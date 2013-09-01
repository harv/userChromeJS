// ==UserScript==
// @name            redirector.uc.js
// @namespace       redirector@haoutil.tk
// @description     Redirect your requests.
// @include         chrome://browser/content/browser.xul
// @author          harv.c
// @homepage        http://haoutil.tk
// @version         1.1.0
// ==/UserScript==
(function() {
    Cu.import("resource://gre/modules/XPCOMUtils.jsm");
    Cu.import("resource://gre/modules/Services.jsm");
    Cu.import("resource://gre/modules/NetUtil.jsm");
    function Redirector() {
        this.rules = [{
            from: "about:haoutil",                  // 需要重定向的地址
            to: "https://haoutil.googlecode.com",   // 目标地址
            regex: false,                           // 可选，true 表示 from 是正则表达式
            resp: false,                            // 可选，true 表示替换 response body
        },{
            from: /^http:\/\/(([^\.]+\.)?google\..+)/i,
            exclude: /google\.cn/i,                 // 可选，排除例外规则
            to: "https://$1",
            regex: true
        }];
    }
    Redirector.prototype = {
        _cache: {
            url: [],
            redirectUrl: []
        },
        classDescription: "Redirector content policy",
        classID: Components.ID("{1d5903f0-6b5b-4229-8673-76b4048c6675}"),
        contractID: "@haoutil.tk/redirector/policy;1",
        xpcom_categories: ["content-policy", "net-channel-event-sinks"],
        init: function() {
            let registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
            registrar.registerFactory(this.classID, this.classDescription, this.contractID, this);
            let catMan = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);
            for each (let category in this.xpcom_categories)
                catMan.addCategoryEntry(category, this.classDescription, this.contractID, false, true);
            Services.obs.addObserver(this, "http-on-modify-request", false);
            Services.obs.addObserver(this, "http-on-examine-response", false);
        },
        getRedirectUrl: function(url) {
            let index = this._cache.url.indexOf(url);
            if(index > -1)
                return this._cache.redirectUrl[index];
            let redirectUrl = null
            for each (let rule in this.rules) {
                let redirect = rule.regex
                    ? rule.exclude && rule.exclude.test(url) ? false : rule.from.test(url) ? true : false
                    : rule.exclude && rule.exclude == url ? false : rule.from == url ? true : false;
                if (redirect) {
                    if (!rule.exclude)
                        redirectUrl = {
                            url: rule.regex ? url.replace(rule.from, rule.to) : rule.to,
                            resp: rule.resp
                        };
                    break;
                }
            }
            this._cache.url.push(url);
            this._cache.redirectUrl.push(redirectUrl);
            return redirectUrl;
        },
        getTarget: function(redirectUrl, callback) {
            NetUtil.asyncFetch(redirectUrl.url, function(inputStream, status) {
                var binaryOutputStream = Cc['@mozilla.org/binaryoutputstream;1'].createInstance(Ci['nsIBinaryOutputStream']);
                var storageStream = Cc['@mozilla.org/storagestream;1'].createInstance(Ci['nsIStorageStream']);
                var count = inputStream.available();
                var data = NetUtil.readInputStreamToString(inputStream, count);
                storageStream.init(512, count, null);
                binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));
                binaryOutputStream.writeBytes(data, count);
                redirectUrl.storageStream = storageStream;
                redirectUrl.count = count;
                if (typeof callback === 'function')
                    callback();
            });
        },
        // nsIContentPolicy interface implementation
        shouldLoad: function(contentType, contentLocation, requestOrigin, context, mimeTypeGuess, extra) {
            // only redirect documents
            if (contentType != Ci.nsIContentPolicy.TYPE_DOCUMENT)
                return Ci.nsIContentPolicy.ACCEPT;
            if (!context || !context.loadURI)
                return Ci.nsIContentPolicy.ACCEPT;
            let redirectUrl = this.getRedirectUrl(contentLocation.spec);
            if (redirectUrl && !redirectUrl.resp) {
                context.loadURI(redirectUrl.url, requestOrigin, null);
                return Ci.nsIContentPolicy.REJECT_REQUEST;
            }
            return Ci.nsIContentPolicy.ACCEPT;
        },
        shouldProcess: function(contentType, contentLocation, requestOrigin, context, mimeTypeGuess, extra) {
            return Ci.nsIContentPolicy.ACCEPT;
        },
        // nsIChannelEventSink interface implementation
        asyncOnChannelRedirect: function(oldChannel, newChannel, flags, redirectCallback) {
            this.onChannelRedirect(oldChannel, newChannel, flags);
            redirectCallback.onRedirectVerifyCallback(Cr.NS_OK);
        },
        onChannelRedirect: function(oldChannel, newChannel, flags) {
            // only redirect documents
            if (!(newChannel.loadFlags & Ci.nsIChannel.LOAD_DOCUMENT_URI))
                return; 
            let newLocation = newChannel.URI.spec;
            if (!newLocation)
                return;
            let callbacks = [];
            if (newChannel.notificationCallbacks)
                callbacks.push(newChannel.notificationCallbacks);
            if (newChannel.loadGroup && newChannel.loadGroup.notificationCallbacks)
                callbacks.push(newChannel.loadGroup.notificationCallbacks);
            let win, webNav;
            for each (let callback in callbacks) {
                try {
                    win = callback.getInterface(Ci.nsILoadContext).associatedWindow;
                    webNav = win.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebNavigation);
                    break;
                } catch(e) {}
            }
            if (!webNav)
                return;
            let redirectUrl = this.getRedirectUrl(newLocation);
            if (redirectUrl && !redirectUrl.resp) {
                webNav.loadURI(redirectUrl.url, null, null, null, null);
                throw Cr.NS_BASE_STREAM_WOULD_BLOCK;
            }
        },
        // nsIObserver interface implementation
        observe: function(subject, topic, data, additional) {
            switch (topic) {
                case "http-on-modify-request": {
                    let http = subject.QueryInterface(Ci.nsIHttpChannel);
                    let redirectUrl = this.getRedirectUrl(http.URI.spec);
                    if (redirectUrl && !redirectUrl.resp)
                        if(http.redirectTo)
                            http.redirectTo(Services.io.newURI(redirectUrl.url, null, null));
                    break;
                }
                case "http-on-examine-response": {
                    let http = subject.QueryInterface(Ci.nsIHttpChannel);
                    let redirectUrl = this.getRedirectUrl(http.URI.spec);
                    if (redirectUrl && redirectUrl.resp) {
                        if (!redirectUrl.storageStream || !redirectUrl.count) {
                            http.suspend();
                            this.getTarget(redirectUrl, function() {
                                http.resume();
                            });
                        }
                        let newListener = new TrackingListener();
                        subject.QueryInterface(Ci.nsITraceableChannel);
                        newListener.originalListener = subject.setNewListener(newListener);
                        newListener.redirectUrl = redirectUrl;
                    }
                    break;
                }
            }
        },
        // nsIFactory interface implementation
        createInstance: function(outer, iid) {
            if (outer)
                throw Cr.NS_ERROR_NO_AGGREGATION;
            return this.QueryInterface(iid);
        },
        // nsISupports interface implementation
        QueryInterface: XPCOMUtils.generateQI([Ci.nsIContentPolicy, Ci.nsIChannelEventSink, Ci.nsIObserver, Ci.nsIFactory, Ci.nsISupports])
    };
    function TrackingListener() {
        this.originalListener = null;
        this.redirectUrl = null;
    }
    TrackingListener.prototype = {
        // nsITraceableChannel interface implementation
        onStartRequest: function(request, context) {
            this.originalListener.onStartRequest(request, context);
        },
        onStopRequest: function(request, context) {
            this.originalListener.onStopRequest(request, context, Cr.NS_OK);
        },
        onDataAvailable: function(request, context) {
            this.originalListener.onDataAvailable(request, context, this.redirectUrl.storageStream.newInputStream(0), 0, this.redirectUrl.count);
        },
        // nsISupports interface implementation
        QueryInterface: XPCOMUtils.generateQI([Ci.nsIStreamListener, Ci.nsISupports])
    };
    new Redirector().init();
})();
