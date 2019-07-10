// ==UserScript==
// @name            openNewTab.uc.js
// @namespace       opennewtab@haoutil.com
// @include         main
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/bookmarks/bookmarksPanel.xul
// @include         chrome://browser/content/history/history-panel.xul
// @include         chrome://browser/content/places/bookmarksSidebar.xul
// @include         chrome://browser/content/places/historySidebar.xul
// @include         chrome://browser/content/syncedtabs/sidebar.xhtml
// @include         chrome://browser/content/readinglist/sidebar.xhtml
// @include         chrome://browser/content/places/places.xul
// @description     Open Bookmarks/History/Search in New Tab
// @downloadURL     https://raw.githubusercontent.com/Harv/userChromeJS/master/openNewTab.uc.js
// @version         1.4.1
// ==/UserScript==
(function() {
    var b_urlbar = false;
    var b_searchbar = true;

    function whereToOpenLinkMod() {
        {
    var b_bookmarks = true;
    var b_history = true;
    var b_syncedtab = true;

            if (!e) return 'current';
            var win = window.opener || window;
            var isTabEmpty = win.isTabEmpty;
            var gBrowser = win.gBrowser;
            if (typeof isTabEmpty === "function" && isTabEmpty(gBrowser.mCurrentTab || gBrowser.selectedTab) || gBrowser.selectedTab.isEmpty) return 'current';
            var node = e.originalTarget;
            while (node) {
                if(node.className && node.className.indexOf('bookmark-item') != -1
                    && node.outerHTML && node.outerHTML.indexOf('scheme="javascript"') != -1) {
                    return 'current';
                }
                if (node.className && node.className.indexOf('sync-state') != -1) { // sidebar syncedtabs
                    return b_syncedtab ? 'tab' : 'current';
                }
                switch (node.id) {
                    case 'bookmarksMenuPopup':  // menubar bookmarks
                    case 'BMB_bookmarksPopup':  // navibar bookmarks
                    case 'PanelUI-bookmarks':   // navibar bookmarks
                    case 'bookmarksPanel':      // sidebar bookmarks
                        return b_bookmarks ? 'tab' : 'current';
                    case 'goPopup':             // menubar history
                    case 'PanelUI-history':     // navibar history
                    case 'history-panel':       // sidebar history
                        return b_history ? 'tab' : 'current';
                    case 'placeContent':        // library bookmarks&history
                        var collection = document.getElementById('searchFilter').getAttribute('collection');
                        var tab = collection === "bookmarks" && b_bookmarks || collection === "history" && b_history;
                        return tab ? 'tab' : 'current';
                    case 'PanelUI-remotetabs':    // navibar syncedtabs
                        return b_syncedtab ? 'tab' : 'current';
                }
                node = node.parentNode;
            }
            return 'current';
        }
    }
    function generateReplacement(func, regexp, replacementFunc, appendMatch, appendAhead) {
        var replacementStr = replacementFunc.toString().replace(/^.*{|}$/g, '');
        if (appendMatch) {
            if (appendAhead) {
                replacementStr = '$&' + replacementStr;
            } else {
                replacementStr = replacementStr + '$&';
            }
        }
        var funcStr = func.toString().replace(regexp, replacementStr);
        if (!funcStr.startsWith("function")) {
            funcStr = "function " + funcStr;
        }
        return funcStr;
    }
    function generateWhere() {
        where = typeof isTabEmpty === "function" && isTabEmpty(gBrowser.mCurrentTab || gBrowser.selectedTab) || gBrowser.selectedTab.isEmpty ? 'current' : 'tab';
    }
    if (location == 'chrome://browser/content/browser.xhtml') {
        /* :::: Open Bookmarks/History in New Tab :::: */
        eval('whereToOpenLink = ' + generateReplacement(whereToOpenLink, /(return "current";)(?![\s\S]*\1)/g, whereToOpenLinkMod));
        var sidebar = document.getElementById('sidebar');
        sidebar && sidebar.addEventListener('DOMContentLoaded', function(event) {
            var doc = event.originalTarget;
            var win = doc.defaultView.window;
            if (win.location == 'chrome://browser/content/bookmarks/bookmarksPanel.xul' || win.location == 'chrome://browser/content/history/history-panel.xul'
                || win.location == 'chrome://browser/content/places/bookmarksSidebar.xul' || win.location == 'chrome://browser/content/places/historySidebar.xul'
                || win.location == 'chrome://browser/content/syncedtabs/sidebar.xhtml') {
                eval('win.whereToOpenLink = ' + generateReplacement(win.whereToOpenLink, /(return "current";)(?![\s\S]*\1)/g, whereToOpenLinkMod));
            } else if (win.location == 'chrome://browser/content/readinglist/sidebar.xhtml') {
                /* :::: Open Sidebar ReadingList in New Tab :::: */
                eval('win.RLSidebar.openURL = ' + generateReplacement(win.RLSidebar.openURL, /mainWindow\.openUILink\(url, event\);/, generateWhere, true));
            }
        });
        /* :::: Open Url in New Tab :::: */
        if (b_urlbar) {
            var urlbar = document.getElementById('urlbar');
            urlbar && eval('urlbar.handleCommand=' + generateReplacement(urlbar.handleCommand, /let where = openUILinkWhere( \|\| this\._whereToOpen\(event\))?;/, generateWhere, true, true));
        }
        /* :::: Open Search in New Tab :::: */
        if (b_searchbar) {
            var searchbar = document.getElementById('searchbar');
            searchbar && /*{true: function() {*/
                eval('searchbar.handleSearchCommand=' + generateReplacement(searchbar.handleSearchCommand, /this\.doSearch\(textValue, where(, aEngine)?\);|this\.handleSearchCommandWhere\(aEvent, aEngine, where, params\);/, generateWhere, true));
            /*}, false: function() {
                searchbar.addEventListener('load', this[true]);
            }}[!!searchbar.handleSearchCommand]();*/
            var oneOffButtons = document.getElementById('PopupSearchAutoComplete').oneOffButtons;
            oneOffButtons && eval('oneOffButtons.handleSearchCommand=' + generateReplacement(oneOffButtons.handleSearchCommand, /this\.popup\.handleOneOffSearch\(aEvent, aEngine, where, params\);/, generateWhere, true));
            if (b_urlbar) {
                var oneOffSearchButtons = document.getElementById('PopupAutoCompleteRichResult').input.popup.oneOffSearchButtons;
                oneOffSearchButtons && eval('oneOffSearchButtons.handleSearchCommand=' + generateReplacement(oneOffSearchButtons.handleSearchCommand, /this\.popup\.handleOneOffSearch\(aEvent, aEngine, where, params\);/, generateWhere, true));
            }
        }
    } else if (location == 'chrome://browser/content/places/places.xul') {
        /* :::: Open Bookmarks/History in New Tab :::: */
        eval('whereToOpenLink = ' + generateReplacement(whereToOpenLink, /(return "current";)(?![\s\S]*\1)/g, whereToOpenLinkMod));
    }
})();
