var KeyChanger = {
	keys : {
        // 重启浏览器
		'p+ctrl' : 'Services.appinfo.invalidateCachesOnRestart() || Application.restart();',
        // 打开Profile
		'[+ctrl' : 'Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsILocalFile).reveal();',
		// 打开Chrome
		']+ctrl' : 'Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("UChrm", Components.interfaces.nsILocalFile).reveal();',
		// 转到页首
		'q+ctrl' : 'goDoCommand("cmd_scrollTop");',
		// 转到页尾
		'w+ctrl' : 'goDoCommand("cmd_scrollBottom");',
		// 关闭标签页
		'x+ctrl' : 'gBrowser.removeCurrentTab();',
		// 撤销关闭标签页
		'z+ctrl' : 'undoCloseTab();',
		// 刷新标签页/frame
		'r+ctrl' : 'KeyChanger.reloadFrame();',
		// 强制刷新标签页/frame
		'r+ctrl+shift' : 'KeyChanger.reloadFrame(true);',
		// 打开Error Console
		'j+shift' : 'toJavaScriptConsole();',
		// 超级上一页
		'z+alt': 'try{nextPage.next(false);}catch(e){}',
		// 超级下一页
		'x+alt': 'try{nextPage.next(true);}catch(e){}'
	},
	reloadFrame: function(skipCache) {
		let prevDoc, doc = document;
		while (doc) {
			prevDoc = doc;
			doc = doc.activeElement.contentDocument
		}
		prevDoc.location.reload(skipCache);
	},
	makeKeyset : function() {
		var keys = this.makeKeys();
		if (!keys)
			return;

		var keyset = document.getElementById('keychanger-keyset');
		if (keyset)
			keyset.parentNode.removeChild(keyset);
		keyset = document.createElement('keyset');
		keyset.setAttribute('id', 'keychanger-keyset');
		keyset.appendChild(keys);

		var df = document.createDocumentFragment();
		Array.slice(document.getElementsByTagName('keyset')).forEach(function(elem) {
			df.appendChild(elem);
		});
		var insPos = document.getElementById('mainPopupSet');
		insPos.parentNode.insertBefore(keyset, insPos);
		insPos.parentNode.insertBefore(df, insPos);
	},
	makeKeys : function(){
		if (!this.keys)
			return null;

		var dFrag = document.createDocumentFragment();

		Object.keys(this.keys).forEach(function(n) {
			let keyString = n.toUpperCase().split("+");
			let modifiers = "", key, keycode, k;

			for (let i = 0, l = keyString.length; i < l; i++) {
				k = keyString[i];
				switch (k) {
					case "CTRL":
					case "CONTROL":
					case "ACCEL":
						modifiers += "accel,";
						break;
					case "SHIFT":
						modifiers += "shift,";
						break;
					case "ALT":
					case "OPTION":
						modifiers += "alt,";
						break;
					case "META":
					case "COMMAND":
						modifiers += "meta,";
						break;
					case "OS":
					case "WIN":
					case "WINDOWS":
					case "HYPER":
					case "SUPER":
						modifiers += "os,";
						break;
					case "":
						key = "+";
						break;
					case "BACKSPACE":
					case "BKSP":
					case "BS":
						keycode = "VK_BACK";
						break;
					case "RET":
					case "ENTER":
						keycode = "VK_RETURN";
						break;
					case "ESC":
						keycode = "VK_ESCAPE";
						break;
					case "PAGEUP":
					case "PAGE UP":
					case "PGUP":
					case "PUP":
						keycode = "VK_PAGE_UP";
						break;
					case "PAGEDOWN":
					case "PAGE DOWN":
					case "PGDN":
					case "PDN":
						keycode = "VK_PAGE_DOWN";
						break;
					case "TOP":
						keycode = "VK_UP";
						break;
					case "BOTTOM":
						keycode = "VK_DOWN";
						break;
					case "INS":
						keycode = "VK_INSERT";
						break;
					case "DEL":
						keycode = "VK_DELETE";
						break;
					default:
						if (k.length === 1) {
							key = k;
						} else if (k.indexOf("VK_") === -1) {
							keycode = "VK_" + k;
						} else {
							keycode = k;
						}
						break;
				}
			}
			let elem = document.createElement('key');
			if (modifiers !== '')
				elem.setAttribute('modifiers', modifiers.slice(0, -1));
			if (key)
				elem.setAttribute('key', key);
			else if (keycode)
				elem.setAttribute('keycode', keycode);

			let cmd = this.keys[n];
			switch (typeof cmd) {
			case 'function':
				elem.setAttribute('oncommand', '(' + cmd.toSource() + ').call(this, event);');
				break;
			case 'object':
				Object.keys(cmd).forEach(function(a) {
					elem.setAttribute(a, cmd[a]);
				}, this);
				break;
			default:
				elem.setAttribute('oncommand', cmd);
			}
			dFrag.appendChild(elem);
		}, this);
		return dFrag;
	}
};

KeyChanger.makeKeyset();
