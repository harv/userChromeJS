// ==UserScript==
// @name            redirector_ui.uc.js
// @namespace       redirector@haoutil.com
// @description     Redirect your requests.
// @include         chrome://browser/content/browser.xhtml
// @author          harv.c
// @homepage        http://haoutil.com
// @downloadURL     https://raw.githubusercontent.com/Harv/userChromeJS/master/redirector_ui.uc.js
// @startup         Redirector.init();
// @shutdown        Redirector.destroy();
// @version         1.6.3
// ==/UserScript==
location == "chrome://browser/content/browser.xhtml" && (function() {
    const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr,
    } = Components;

    const { XPCOMUtils } = Cu.import('resource://gre/modules/XPCOMUtils.jsm');
    const { Services } = globalThis || Cu.import("resource://gre/modules/Services.jsm");
    const { NetUtil } = Cu.import("resource://gre/modules/NetUtil.jsm");
    const { FileUtils } = Cu.import("resource://gre/modules/FileUtils.jsm");

    function RedirectorUI() {
        this.rules = "local/_redirector.js".split("/"); // 规则文件路径
        this.state = true;                              // 是否启用脚本
        this.addIcon = 2;                               // 添加到 0 不添加 1 地址栏图标 2 导航栏按钮 3 工具栏菜单
        this.enableIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABZ0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMDvo9WkAAAI2SURBVDhPbVPNahNRGP3uzORvMhNCy7RJmGziICEtZOuiNbjRB5CgD+AyG1e6i4ib0m4KbhRKEemu1oUgbgTzAhXBjd2IUJBuopKCGjJzPSe5GWLpB5f5fs45uffcG7kYzWZzuVAo9DKZzJHjOB+5mBeLxV4YhksGdmlYnuc9tG37HLkG8Qz5wLKsAXP2OCuVSg+IJSGNTqfj+L5/hFTncrlBpVLp9Pv9FMScvWw2O0Cpie12u/ZsikDjCT4aW9/5vrpa1CLl+UrCsICvIo5C+IEdYg1HJIqiK0qpvyC/01qrROQZCHq+YqUSrNPEtm8TT5F8Pv+WHHIF5myjSOr1+hoBCwKPkN8dO859rdTPRKnRWRB4xMDMdXLg2bZA7TPOdswBYy6A76ZpCciv2fvl+1dNS8ghV+Dwb7i7Z/qLAntYfWz/KdY4tqxP6KfGkkOu4I4nKJ6b/qLAEMQJtk8fDs5dt2Ig0yAHAhMKfEXy3vT/O8Ifz2vh+wNHOB2JrBjINHAbH8gVuP8CamM4GnCwKMB6Ylk91rFtv2TNaDQaK3hgY3iwL0EQbMBRDUd3ObwocBJFORzhG+oEjOvsua67Sw65rHkTr9CIsZsuyBsA38M3PTOu8hp7eAs38JTvEEuOGYu0Wq0lkE+wrRgvbAtPu2xGabTb7TLezBYwCXbwhRwzmkWtVluG6huk/CONYNIhvHnMBbOYw0fRxBA7JV0W1Wr1FskQGaLELSoKDtnDmW/OUPMQ+QfYiMmtP0QQSQAAAABJRU5ErkJggg==";
        this.disableIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABZ0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMDvo9WkAAAHuSURBVDhPfVM7S4JRGP6832kKFVOLnIwckuZWaWrwfkG0hn5CY9HWEDgE4qBD0BSFuLRESdjWWIRTQ0u1BVEYZc9zPJ/5KfXAy3nPezvv7Sjj8Hq9UavVWjUajV1QD/RhMpnuIKt4PJ6wNJtEOBx22my2Q51O1zcYDJ9ms7mNswqqgb/W6/Vf0H05HI6DUChkkW4DSOcbOsOgGggEvFI1RDAYnIXNEdi+0+m8iEajpoEGgFODzlCsx+PxuWQyuaxSNptdLJfLLmmq2O32LRy03RMCvLYkU6vznk6nG6D+GL1nMpkN4QCgH02U1GNWfL2KyyfqmqESxmqAIjPI5/Nr4F9Ab8Vi0Uobn88XYcYul2tXQYe7aNIVFYQagM5SRNklZaVSaVqKFEznHn4dBuix21I+mkFL8me8o4SmNBFA1icI8igCgKlJ+TBAKpW6xfkqnfdjsZhmdPA5VQN0kUFbyjUlFAqFAPhn0FMul9OM1mKxsPSOaCIaMtFEtQfgN3lHFtwBATYRRx97scPVFWPERTNGNUAikTDj/gD6RpAVyvB6azhGYmSR+FoEhqtwnBJKALIFyqiD7TZEv4tEuN1uyB3qKtfVckbh9/vnsUDHYDn/c80qEwyCMkQmf30mEla5MuE8iv++M9Z+7Dsryg+nccGV4H85ngAAAABJRU5ErkJggg==";
    }
    RedirectorUI.prototype = {
        hash: new Date().getTime(),
        get redirector() {
            if (!Services.redirector) {
                let state = this.state;
                XPCOMUtils.defineLazyGetter(Services, "redirector", function() {
                    let redirector = new Redirector();
                    redirector.clearCache = function() {
                        this.redirectUrls = {};
                    };
                    redirector.state = state;
                    return redirector;
                });
                if (this.state) {
                    Services.redirector.init();
                }
            }
            return Services.redirector;
        },
        init: function() {
            this.state = this.redirector.state;
            this.loadRule();
            this.drawUI();
            // register self as a messagelistener
            Services.cpmm.addMessageListener("redirector:toggle", this);
            Services.cpmm.addMessageListener("redirector:toggle-item", this);
            Services.cpmm.addMessageListener("redirector:reload", this);
        },
        destroy: function() {
            this.destoryUI();
            // Services.cpmm.removeMessageListener("redirector:toggle", this);
            // Services.cpmm.removeMessageListener("redirector:toggle-item", this);
            // Services.cpmm.removeMessageListener("redirector:reload", this);
        },
        drawUI: function() {
            if (this.addIcon > 0 && !document.getElementById("redirector-icon")) {
                // add menu
                let menu = document.getElementById("mainPopupSet").appendChild(document.createXULElement("menupopup"));
                menu.setAttribute("id", "redirector-menupopup");
                let menuitem = menu.appendChild(document.createXULElement("menuitem"));
                menuitem.setAttribute("label", "Enable");
                menuitem.setAttribute("id", "redirector-toggle");
                menuitem.setAttribute("type", "checkbox");
                menuitem.setAttribute("autocheck", "false");
                menuitem.setAttribute("key", "redirector-toggle-key");
                menuitem.setAttribute("checked", this.state);
                menuitem.setAttribute("oncommand", "Redirector.toggle();");
                menuitem = menu.appendChild(document.createXULElement("menuitem"));
                menuitem.setAttribute("label", "Reload");
                menuitem.setAttribute("id", "redirector-reload");
                menuitem.setAttribute("oncommand", "Redirector.reload();");
                menuitem = menu.appendChild(document.createXULElement("menuitem"));
                menuitem.setAttribute("label", "Edit");
                menuitem.setAttribute("id", "redirector-edit");
                menuitem.setAttribute("oncommand", "Redirector.edit();");
                let menuseparator = menu.appendChild(document.createXULElement("menuseparator"));
                menuseparator.setAttribute("id", "redirector-separator");
                // add icon
                if (this.addIcon == 1) {
                    let icon = document.getElementById("urlbar-icons").appendChild(document.createXULElement("image"));
                    icon.setAttribute("id", "redirector-icon");
                    icon.setAttribute("context", "redirector-menupopup");
                    icon.setAttribute("onclick", "Redirector.iconClick(event);");
                    icon.setAttribute("tooltiptext", "Redirector");
                    icon.setAttribute("style", "list-style-image: url(" + (this.state ? this.enableIcon : this.disableIcon) + ")");
                } else if (this.addIcon == 2) {
                    let icon = document.getElementById("nav-bar-customization-target").appendChild(document.createXULElement("toolbarbutton"));
                    icon.setAttribute("id", "redirector-icon");
                    icon.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
                    icon.setAttribute("label", "Redirector");
                    icon.setAttribute("tooltiptext", "Redirector");
                    icon.setAttribute("removable", true);
                    icon.setAttribute("popup", "redirector-menupopup");
                    icon.setAttribute("style", "list-style-image: url(" + (this.state ? this.enableIcon : this.disableIcon) + ")");
                } else if (this.addIcon == 3) {
                    let icon = document.getElementById("devToolsSeparator").parentNode.appendChild(document.createXULElement("menu"));
                    icon.setAttribute("id", "redirector-icon");
                    icon.setAttribute("class", "menu-iconic");
                    icon.setAttribute("label", "Redirector");
                    icon.setAttribute("style", "list-style-image: url(" + (this.state ? this.enableIcon : this.disableIcon) + ")");
                    icon.appendChild(document.getElementById("redirector-menupopup"));
                }
                // add rule items
                this.buildItems();
            }
            if (!document.getElementById("redirector-toggle-key")) {
                // add shortcuts
                let key = document.getElementById("mainKeyset").appendChild(document.createXULElement("key"));
                key.setAttribute("id", "redirector-toggle-key");
                key.setAttribute("oncommand", "Redirector.toggle();");
                key.setAttribute("key", "r");
                key.setAttribute("modifiers", "shift");
            }
        },
        destoryUI: function() {
            let icon = document.getElementById("redirector-icon");
            if (icon) {
                icon.parentNode.removeChild(icon);
                delete icon;
            }
            let menu = document.getElementById("redirector-menupopup");
            if (menu) {
                menu.parentNode.removeChild(menu);
                delete menu;
            }
            let key = document.getElementById("redirector-toggle-key");
            if (key) {
                key.parentNode.removeChild(key);
                delete key;
            }
        },
        buildItems: function() {
            let menu = document.getElementById("redirector-menupopup");
            if (!menu) return;
            for (let i = 0; i < this.redirector.rules.length; i++) {
                let menuitem = menu.appendChild(document.createXULElement("menuitem"));
                menuitem.setAttribute("label", this.redirector.rules[i].name);
                menuitem.setAttribute("id", "redirector-item-" + i);
                menuitem.setAttribute("class", "redirector-item");
                menuitem.setAttribute("type", "checkbox");
                menuitem.setAttribute("autocheck", "false");
                menuitem.setAttribute("checked", typeof this.redirector.rules[i].state === "undefined" ? true : this.redirector.rules[i].state);
                menuitem.setAttribute("oncommand", "Redirector.toggle('"+ i +"');");
                menuitem.setAttribute("disabled", !this.state);
            }
        },
        clearItems: function() {
            let menu = document.getElementById("redirector-menupopup");
            let menuitems = document.querySelectorAll("menuitem[id^='redirector-item-']");
            if (!menu || !menuitems) return;
            for (let menuitem of menuitems) {
                menu.removeChild(menuitem);
            }
        },
        loadRule: function(forceLoadRule) {
            if (!forceLoadRule && this.redirector.rules.length > 0) {
                return;
            }
            var aFile = FileUtils.getDir("UChrm", this.rules, true);
            if (!aFile.exists() || !aFile.isFile()) return null;
            var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
            var sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
            fstream.init(aFile, -1, 0, 0);
            sstream.init(fstream);
            var data = sstream.read(sstream.available());
            try {
                data = decodeURIComponent(escape(data));
            } catch (e) {}
            sstream.close();
            fstream.close();
            if (!data) return;
            var sandbox = new Cu.Sandbox(new XPCNativeWrapper(window));
            try {
                Cu.evalInSandbox(data, sandbox, "1.8");
            } catch (e) {
                return;
            }
            this.redirector.rules = sandbox.rules;
        },
        toggle: function(i, callfromMessage) {
            if (i) {
                // update checkbox state
                let item = document.getElementById("redirector-item-" + i);
                if (!callfromMessage) {
                    this.redirector.rules[i].state = !this.redirector.rules[i].state;
                }
                if (item) item.setAttribute("checked", this.redirector.rules[i].state);
                // clear cache
                this.redirector.clearCache();
                if (!callfromMessage) {
                    // notify other windows to update
                    Services.ppmm.broadcastAsyncMessage("redirector:toggle-item", {hash: this.hash, item: i});
                }
            } else {
                let menuitems = document.querySelectorAll("menuitem[id^='redirector-item-']");
                this.state = !this.state;
                this.redirector.state = this.state;
                if (this.state) {
                    if (!callfromMessage) {
                        this.redirector.init();
                    }
                    Object.keys(menuitems).forEach(function(n) {menuitems[n].setAttribute("disabled", false)});
                } else {
                    if (!callfromMessage) {
                        this.redirector.destroy();
                    }
                    Object.keys(menuitems).forEach(function(n) {menuitems[n].setAttribute("disabled", true)});
                }
                // update checkbox state
                let toggle = document.getElementById("redirector-toggle");
                if (toggle) {
                    toggle.setAttribute("checked", this.state);
                }
                // update icon state
                let icon = document.getElementById("redirector-icon");
                if (icon) {
                    icon.style.listStyleImage = "url(" + (this.state ? this.enableIcon : this.disableIcon) + ")";
                }
                if (!callfromMessage) {
                    // notify other windows to update
                    Services.ppmm.broadcastAsyncMessage("redirector:toggle", {hash: this.hash});
                }
            }
        },
        reload: function(callfromMessage) {
            if (!callfromMessage) {
                this.redirector.clearCache();
            }
            this.clearItems();
            this.loadRule(true);
            this.buildItems();
            if (!callfromMessage) {
                // notify other windows to update
                Services.ppmm.broadcastAsyncMessage("redirector:reload", {hash: this.hash});
            }
        },
        edit: function() {
            let aFile = FileUtils.getDir("UChrm", this.rules, true);
            if (!aFile || !aFile.exists() || !aFile.isFile()) return;
            var editor;
            try {
                editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
            } catch (e) {
                alert("Please set editor path.\nview_source.editor.path");
                toOpenWindowByType('pref:pref', 'about:config?filter=view_source.editor.path');
                return;
            }
            var UI = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
            UI.charset = window.navigator.platform.toLowerCase().indexOf("win") >= 0 ? "gbk" : "UTF-8";
            var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            try {
                var path = UI.ConvertFromUnicode(aFile.path);
                var args = [path];
                process.init(editor);
                process.run(false, args, args.length);
            } catch (e) {
                alert("editor error.")
            }
        },
        iconClick: function(event) {
            switch(event.button) {
                case 1:
                    document.getElementById("redirector-toggle").doCommand();
                    break;
                default:
                    document.getElementById("redirector-menupopup").openPopup(null, null, event.clientX, event.clientY);
            }
            event.preventDefault();
        },
        // nsIMessageListener interface implementation
        receiveMessage: function(message) {
            if (this.hash == message.data.hash) {
                return;
            }
            switch (message.name) {
                case "redirector:toggle":
                    this.toggle(null, true);
                    break;
                case "redirector:toggle-item":
                    this.toggle(message.data.item, true);
                    break;
                case "redirector:reload":
                    this.reload(true);
                    break;
            }
        }
    };
    function Redirector() {
        this.rules = [];
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

    if (window.Redirector) {
        window.Redirector.destroy();
        delete window.Redirector;
    }

    window.Redirector = new RedirectorUI();
    window.Redirector.init();
})();
