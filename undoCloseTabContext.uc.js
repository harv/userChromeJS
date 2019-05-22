// ==UserScript==
// @name           undoCloseTabContext.uc.js
// @namespace      undoCloseTabContext@harv.c
// @description    标签栏右键菜单显示最近关闭的标签页
// @include        chrome://browser/content/browser.xul
// @author         harv.c
// ==/UserScript==
location == "chrome://browser/content/browser.xul" && (function undoCloseTabContext() {
    var tabsToolbar = document.getElementById("TabsToolbar");
    if(!tabsToolbar) return;

    var popup = document.getElementById("mainPopupSet").appendChild(document.createElement("menupopup"));
    popup.setAttribute("id", "undoCloseTabContextMenu");
    popup.setAttribute("onpopupshowing", "this.populateUndoSubmenu();");
    popup.setAttribute("oncommand", "event.stopPropagation();");
    popup.setAttribute("context", "");
    popup.setAttribute("position", "after_start");
    popup.setAttribute("tooltip", "bhTooltip");
    popup.setAttribute("popupsinherittooltip", "true");

    popup._getClosedTabCount = HistoryMenu.prototype._getClosedTabCount;	// fx 35+
    if (!popup._getClosedTabCount) {
    	popup._ss = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);
    	popup._getClosedTabCount = function() {
    		return popup._ss.getClosedTabCount(window);
    	}
    }
    var appVer = parseFloat(AppConstants.MOZ_APP_VERSION);
    if (appVer >= 68) {
        popup.populateUndoSubmenu = eval("(" + HistoryMenu.prototype.populateUndoSubmenu.toString().replace(/\.undoTabMenu\.menupopup/, "").replace(/\.undoTabMenu/g, "") + ")");
    } else if (appVer >= 62) {
        popup.populateUndoSubmenu = eval("(" + HistoryMenu.prototype.populateUndoSubmenu.toString().replace(/\.undoTabMenu\.firstChild/, "").replace(/\.undoTabMenu/g, "") + ")");
    } else {
        popup.populateUndoSubmenu = eval("(" + HistoryMenu.prototype.populateUndoSubmenu.toString().replace(/\._rootElt.*/, ";").replace(/undoMenu\.firstChild/, "this") + ")");
    }

    // replace right click context menu when has recently closed tabs
    var UpdateUndoCloseTabCommand = function() {
        tabsToolbar.setAttribute("context", "undoCloseTabContextMenu");
    };

    if(popup._getClosedTabCount() > 0) {
        UpdateUndoCloseTabCommand();
    } else {
        (gBrowser.mTabContainer || gBrowser.tabContainer).addEventListener("TabClose", function() {
            UpdateUndoCloseTabCommand();
            (gBrowser.mTabContainer || gBrowser.tabContainer).removeEventListener("TabClose", this, false);
        }, false);
    }

    // undoclose tab by middle click on tabbar
    (gBrowser.mTabContainer || gBrowser.tabContainer).addEventListener('click', function(e) {
        if (e.button != 1 || e.target.localName != 'tabs') return;
        undoCloseTab(0);
        e.preventDefault();
        e.stopPropagation();
    }, true);

})();
