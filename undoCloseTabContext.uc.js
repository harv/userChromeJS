// ==UserScript==
// @name           undoCloseTabContext.uc.js
// @namespace      undoCloseTabContext@harv.c
// @description    标签栏右键菜单显示最近关闭的标签页
// @include        chrome://browser/content/browser.xhtml
// @author         harv.c
// ==/UserScript==
location == "chrome://browser/content/browser.xhtml" && (async function undoCloseTabContext() {
    if (!gBrowserInit.delayedStartupFinished) await window.delayedStartupPromise;

    var tabsToolbar = document.getElementById("TabsToolbar");
    if(!tabsToolbar) return;

    var popup = document.getElementById("mainPopupSet").appendChild(document.createXULElement("menupopup"));
    popup.setAttribute("id", "undoCloseTabContextMenu");
    popup.setAttribute("onpopupshowing", "this.populateUndoSubmenu();");
    popup.setAttribute("oncommand", "event.stopPropagation();");
    popup.setAttribute("context", "");
    popup.setAttribute("position", "after_start");
    popup.setAttribute("tooltip", "bhTooltip");
    popup.setAttribute("popupsinherittooltip", "true");

    var appVer = parseFloat(AppConstants.MOZ_APP_VERSION);

    if (appVer >= 119) {
        popup._getClosedTabCount = function() {
            try {
                return SessionStore.getClosedTabCount();
            } catch (ex) {
                return 0;
            }
        };
    } else if (appVer >= 35) {
        popup._getClosedTabCount = HistoryMenu.prototype._getClosedTabCount;
    } else {
    	popup._ss = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);
    	popup._getClosedTabCount = function() {
    		return popup._ss.getClosedTabCount(window);
    	}
    }

    if (appVer >= 68) {
        popup.populateUndoSubmenu = eval("(" + HistoryMenu.prototype.populateUndoSubmenu.toString().replace(/\.undoTabMenu\.menupopup/, "").replace(/\.undoTabMenu/g, "") + ")");
    } else if (appVer >= 62) {
        popup.populateUndoSubmenu = eval("(" + HistoryMenu.prototype.populateUndoSubmenu.toString().replace(/\.undoTabMenu\.firstChild/, "").replace(/\.undoTabMenu/g, "") + ")");
    } else {
        popup.populateUndoSubmenu = eval("(" + HistoryMenu.prototype.populateUndoSubmenu.toString().replace(/\._rootElt.*/, ";").replace(/undoMenu\.firstChild/, "this") + ")");
    }

    // replace right click context menu when has recently closed tabs
    tabsToolbar.setAttribute("context", "undoCloseTabContextMenu");
})();
