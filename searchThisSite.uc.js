// ==UserScript==
// @name            searchThisSite.uc.js
// @namespace       searchthissite@haoutil.com
// @include         main
// @include         chrome://browser/content/browser.xhtml
// @description     Search This Site
// @downloadURL     https://raw.githubusercontent.com/Harv/userChromeJS/master/searchThisSite.uc.js
// @version         1.0.1
// ==/UserScript==
location == "chrome://browser/content/browser.xhtml" && (function () {
    const { Services } = globalThis || Cu.import("resource://gre/modules/Services.jsm");

    Services.obs.addObserver(function observer(subject, topic, data) {
        if (data != "init-complete") return;
        Services.obs.removeObserver(observer, topic);
        addSiteSearchEngine();
    }, "browser-search-service");

    function addSiteSearchEngine() {
        var engineName = "Search This Site";
        var engineUrl = "https://www.google.com/search?safe=off&hl=zh-CN&newwindow=1&q=";
        var engineIcon = "data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAABMLAAATCwAAAAAAAAAAAACuZG77rmVv/a9lb/2uZW/9rmVv/a5lb/2uZW/9r2Vv/a9lb/2vZW/9r2Vv/a9lb/2uZW/9rmVv/a5lb/2uZG77rmRu/tO5u//XwcP/18HD/9fBw//XwcL/18HD/9fBw//XwcP/18HD/9fBw//XwcP/18HD/9fBw//Tubv/rmRu/q9mcP3ax8j/3c7P/93O0P/dztD/3c7Q/93Oz//dzs//3c7Q/93Oz//dztD/3c7Q/93Oz//dztD/2sfJ/69mcP2vZ3H928nL/9/S1P/f0dT/zqGd/7VXSv+kJhP/oBoF/6w/Lv+9cGb/17m4/9/S1P/e0tT/3tLU/9rJy/+vZ3H9r2dx/dzLz//g1dj/zZmU/6cgC/+nIAv/rzgm/684Jv+nIAv/pyAL/6ssGf/NmZT/4NXY/+DW2P/czM//r2dx/a9ocv3ez9P/4tnc/7xWSP+vJxL/tj8t/9/Mz//fzc//rycS/68nEv+vJxL/sjMf/+LY3P/i2Nz/3s/T/69ocv2waHL93tLW/+Pc4P/BUkL/uC8a/9KXkf/j3OD/z4uE/7gvGv+4Lxr/uC8a/7gvGv/Yrqv/49zg/97S1v+waHL9sGhy/d/U2f/k4OP/3r69/9SRiv/i1Nf/zXBj/8I4I//COCP/wjgj/8I4I//COCP/4MnK/+Tg5P/f1Nr/sGhz/bBpc/3h193/5uLn/+bi5//k19v/0WFR/8xBLP/MQSz/zEEs/8xBLP/MQSz/02xe/+bi5//m4ub/4Nfd/7Bpc/2waXP94tvf/+fl6v/n5er/35yW/9ZJNf/WSTX/1kk1/9ZJNf/WSTX/3H1x/+bb3v/n5er/5+Xq/+La3/+waXP9sGl0/ePd4v/o6O3/6Ojt/+F5bP/fUT3/31E9/99RPf/heWz/5sC+/+fU1v/mwL7/6Oft/+nn7f/j3eL/sGl0/bBpdP3k3+X/6erw/+nq8P/ok4n/51hE/+dYRP/nWET/6eDl/+jNzv/nYk//51hE/+jNzv/p6fD/5N/l/7BqdP2wanT95eHo/+rt8//q7PL/69nd/+5oVv/uXkv/7l5L/+17bP/uXkv/7l5L/+5eS//r2d3/6uzz/+Xg5/+wanT9sGp0/efl6//r7vT/6u30/+vu9P/r297/75qR//J1Zf/zYk//8Yd7//JrWv/vraf/6+70/+ru9P/m5Ov/sGp0/a9ocv7h1t7/5uHp/+Xi6f/m4un/5eHp/+Xi6f/m4un/5uLp/+Xi6f/l4un/5uLp/+bi6f/l4en/4Nbe/69ocv6waHP7sGl0/bFqdP2wanT9sWp0/bFqdP2wanT9sWp0/bFqdP2xanT9sWp0/bFqdP2xanT9sWp0/bBpdP2waHP7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAD//w=="
        var engine = Services.search.getEngineByName(engineName);
        if (!engine) {
            Services.search.addUserEngine(
                engineName,
                engineUrl,
            );
            engine = Services.search.getEngineByName(engineName);
            engine.wrappedJSObject._setIcon(engineIcon, true)
        }

        engine = engine.wrappedJSObject;
        if(engine.getSubmission.toString().indexOf("getHostname") == -1) {
            engine.getSubmission = function (aData, aResponseType) {
                function getHostname() {
                    var hostname = ["http", "https"].includes(gBrowser.currentURI.scheme) ? gBrowser.currentURI.host : "";
                    hostname = hostname.match(/[^.]+\.(com|net|org)(\.[^.]+)?$/g) || hostname.match(/[^.]+(\.[^.]+)+/g) || "";
                    return hostname;
                };

                var url = engineUrl + encodeURIComponent(aData) + "&sitesearch=" + getHostname();
                var submission = {uri:Services.io.newURI(url, null, null), postData:null};
                return submission;
            }
        }
    }
})();
