// ==UserScript==
// @name            redirector.uc.js
// @namespace       redirector@haoutil.com
// @description     Redirect your requests.
// @include         chrome://browser/content/browser.xhtml
// @author          harv.c
// @homepage        http://haoutil.com
// @downloadURL     https://raw.githubusercontent.com/Harv/userChromeJS/master/redirector.uc.js
// @startup         Services.redirector.init();
// @shutdown        Services.redirector.destroy();
// @version         1.6.4
// ==/UserScript==
location == "chrome://browser/content/browser.xhtml" && (function() {
    const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr,
    } = Components;

    const { XPCOMUtils } = globalThis || Cu.import('resource://gre/modules/XPCOMUtils.jsm');
    const { Services } = globalThis || Cu.import("resource://gre/modules/Services.jsm");
    const { NetUtil } = globalThis || Cu.import("resource://gre/modules/NetUtil.jsm");

    function Redirector() {
        this.rules = [{
            from: "about:haoutil",                  // 需要重定向的地址
            to: "https://haoutil.googlecode.com",   // 目标地址
                                                    // 支持函数(function(matches){}),返回必须是字符串
                                                    // 参数 matches: 正则,匹配结果数组(match函数结果); 通配符,整个网址和(*)符号匹配结果组成的数组; 字符串,整个网址
            wildcard: false,                        // 可选，true 表示 from 是通配符, 默认 false
            regex: false,                           // 可选，true 表示 from 是正则表达式, 默认 false
            resp: false,                            // 可选，true 表示替换 response body, 默认 false
            decode: false,                          // 可选，true 表示尝试对 from 解码, 默认 false
            state: true                             // 可选，true 表示该条规则生效, 默认 true
        },{
            // google链接加密
            from: /^http:\/\/(([^\.]+\.)?google\..+)/i,
            exclude: /google\.cn/i,                 // 可选，排除例外规则
            to: "https://$1",
            regex: true
        },{
            // google搜索结果禁止跳转
            from: /^https?:\/\/(www|news)\.google\.com\/(news\/)?url\?.*url=([^&]*).*/i,
            to: "$3",
            regex: true,
            decode: true
        }];
        this.redirectUrls = {};
    }
    Redirector.prototype = {
        init: function() {
            Services.obs.addObserver(this, "http-on-modify-request", false);
            // Services.obs.addObserver(this, "http-on-examine-response", false);
        },
        destroy: function() {
            Services.obs.removeObserver(this, "http-on-modify-request", false);
            // Services.obs.removeObserver(this, "http-on-examine-response", false);
        },
        getRedirectUrl: function(originUrl) {
            let redirectUrl = this.redirectUrls[originUrl];
            if(typeof redirectUrl !== "undefined") {
                return redirectUrl;
            }
            redirectUrl = null;
            let url, redirect;
            let regex, from, to, exclude, decode;
            for (let rule of this.rules) {
                if (typeof rule.state === "undefined") rule.state = true;
                if (!rule.state) continue;
                if (rule.computed) {
                    regex = rule.computed.regex; from = rule.computed.from; to = rule.computed.to; exclude = rule.computed.exclude; decode = rule.computed.decode;
                } else {
                    regex = rule.regex || rule.wildcard; from = rule.from; to = rule.to; exclude = rule.exclude; decode = rule.decode;
                    if (rule.wildcard) {
                        from = this.wildcardToRegex(rule.from);
                        exclude = this.wildcardToRegex(rule.exclude);
                    }
                    rule.computed = {regex: regex, from: from, to: to, exclude: exclude, decode: decode};
                }
                url = decode ? decodeURIComponent(originUrl) : originUrl;
                redirect = regex
                    ? from.test(url) ? !(exclude && exclude.test(url)) : false
                    : from == url ? !(exclude && exclude == url) : false;
                if (redirect) {
                    url = typeof to === "function"
                        ? regex ? to(url.match(from)) : to(from)
                        : regex ? url.replace(from, to) : to;
                    redirectUrl = {
                        url : decode ? url : decodeURIComponent(url),    // 避免二次解码
                        resp: rule.resp
                    };
                    break;
                }
            }
            this.redirectUrls[originUrl] = redirectUrl;
            return redirectUrl;
        },
        wildcardToRegex: function(wildcard) {
            return new RegExp((wildcard + "").replace(new RegExp("[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]", "g"), "\\$&").replace(/\\\*/g, "(.*)").replace(/\\\?/g, "."), "i");
        },
        // nsIObserver interface implementation
        observe: function(subject, topic, data, additional) {
            switch (topic) {
                case "http-on-modify-request": {
                    let http = subject.QueryInterface(Ci.nsIHttpChannel);
                    let redirectUrl = this.getRedirectUrl(http.URI.spec);
                    if (redirectUrl/* && !redirectUrl.resp*/) {
                        http.cancel(Cr.NS_BINDING_REDIRECTED); // NS_BINDING_ABORTED
                        let loadingContext = (http.notificationCallbacks || http.loadGroup.notificationCallbacks).getInterface(Ci.nsILoadContext);
                        let webNavigation = loadingContext.topFrameElement/*browser*/.webNavigation;
                        let loadURI = webNavigation.fixupAndLoadURIString || webNavigation.loadURI;
                        loadURI.call(webNavigation, redirectUrl.url, {
                            triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}),
                        });
                    }
                    break;
                }
                // case "http-on-examine-response": {
                //     let http = subject.QueryInterface(Ci.nsIHttpChannel);
                //     let redirectUrl = this.getRedirectUrl(http.URI.spec);
                //     if (redirectUrl && redirectUrl.resp) {
                //         http.suspend();
                //         http.QueryInterface(Ci.nsITraceableChannel);
                //         let oldListener = http.setNewListener({
                //             onStartRequest: function () {},
                //             onStopRequest: function () {},
                //             onDataAvailable: function () {},
                //         });
                //         NetUtil.asyncFetch({
                //             uri: Services.io.newURI(redirectUrl.url, null, null),
                //             loadingPrincipal: Services.scriptSecurityManager.createNullPrincipal({}),
                //             securityFlags: Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_DATA_IS_NULL,
                //             contentPolicyType: Ci.nsIContentPolicy.TYPE_OTHER,
                //         }, function(inputStream, statusCode, request) {
                //             http.resume();
                //             oldListener.onStartRequest(request/*, context*/);
                //             oldListener.onDataAvailable(request/*, context*/, inputStream, 0, inputStream.available());
                //             oldListener.onStopRequest(request/*, context*/, Cr.NS_OK);
                //         });
                //     }
                //     break;
                // }
            }
        },
        // nsIFactory interface implementation
        createInstance: function(outer, iid) {
            if (outer)
                throw Cr.NS_ERROR_NO_AGGREGATION;
            return this.QueryInterface(iid);
        },
        // nsISupports interface implementation
        QueryInterface: (ChromeUtils.generateQI || XPCOMUtils.generateQI)([Ci.nsIObserver, Ci.nsIFactory, Ci.nsISupports])
    };

    if (!Services.redirector) {
        XPCOMUtils.defineLazyGetter(Services, "redirector", function() {
            return new Redirector();
        });
        Services.redirector.init();
    }
})();
