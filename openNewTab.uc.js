// ==UserScript==
// @name           	openNewTab.uc.js
// @namespace      	opennewtab@haoutil.com
// @include			main
// @include			chrome://browser/content/places/places.xul
// @description    	Open Bookmarks/History/Search in New Tab
// @downloadURL     https://raw.githubusercontent.com/Harv/userChromeJS/master/openNewTab.uc.js
// @version			1.1
// ==/UserScript==

(function() {
	function whereToOpenLinkMod() {
		{
			if (!e) return "current";

			var win = window.opener || window;
			if (win.isTabEmpty(win.gBrowser.mCurrentTab)) return "current";

			var node = e.originalTarget;
			while (node) {
				switch (node.id) {
					case "bookmarksMenuPopup": // menubar bookmarket
					case "goPopup": 		   // menubar history
					case "BMB_bookmarksPopup": // navibar bookmarket
					case "PanelUI-history":    // navibar history
					case "bookmarksPanel":     // sidebar bookmarket
					case "history-panel":      // sidebar history
					case "placeContent":       // library bookmarket&history
						return "tab";
				}
				node = node.parentNode;
			}

			return "current";
		}
	}

	if (location == "chrome://browser/content/browser.xul") {
		/* :::: Open Bookmarks/History in New Tab :::: */
		eval("whereToOpenLink = " + whereToOpenLink.toString().replace(/return "current";/g, whereToOpenLinkMod.toString().replace(/^.*{|}$/g, "")));

		window.document.getElementById("sidebar").addEventListener('DOMContentLoaded', function(event) {
			var doc = event.originalTarget;
			var win = doc.defaultView.window;
			if (win.location == 'chrome://browser/content/bookmarks/bookmarksPanel.xul'
				|| win.location == 'chrome://browser/content/history/history-panel.xul') {
				eval("win.whereToOpenLink=" + win.whereToOpenLink.toString().replace(/return "current";/g, whereToOpenLinkMod.toString().replace(/^.*{|}$/g, "")));
			} else if (win.location == "chrome://browser/content/readinglist/sidebar.xhtml") {
                /* :::: Open Sidebar ReadingList in New Tab :::: */
                eval("win.RLSidebar.openURL = " + win.RLSidebar.openURL.toString().replace(/log\.debug\(.*\);/, "")
                    .replace(/mainWindow\.openUILink\(url, event\);/, (function(url, event) {
                        var where = isTabEmpty(gBrowser.mCurrentTab) ? 'current' : 'tab';
                    }).toString().replace(/^.*{|}$/g, "") + "\nmainWindow.openUILinkIn(url, where);"));
            }
		});

		/* :::: Open Search in New Tab :::: */
		var searchbar = document.getElementById("searchbar");
		eval("searchbar.handleSearchCommand=" + searchbar.handleSearchCommand.toString().replace(/this\.doSearch\(textValue, where(, aEngine)?\);/,(function() {
			{
				if (isTabEmpty(gBrowser.mCurrentTab)) where = 'current';
				else where = 'tab';

				try {
					this.doSearch(textValue, where);
				} catch(e) {	// firefox 34+
					this.doSearch(textValue, where, aEngine);
				}
			}
		}).toString().replace(/^.*{|}$/g, "")));
	} else if (location == "chrome://browser/content/places/places.xul") {
		/* :::: Open Bookmarks/History in New Tab :::: */
		eval("whereToOpenLink = " + whereToOpenLink.toString().replace(/return "current";/g, whereToOpenLinkMod.toString().replace(/^.*{|}$/g, "")));
	}
})();