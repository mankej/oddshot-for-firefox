if ("undefined" == typeof(Oddshot)) {
  var Oddshot = {};
}
Oddshot.Tabs = {
    tabs: {},
    streamReadyListener: function(browser, transport){
        let gBrowser = browser.gBrowser;
        let bundle = document.getElementById("oddshot-string-bundle");
        let nb = gBrowser.getNotificationBox();
        if(nb.currentNotification)
            nb.currentNotification.close();
        if(browser.aTab == TABS_UTILS.getActiveTab(browser.aDOMWindow))
            document.getElementById("oddshot-app-toolbarbutton").classList.remove('off');
        nb.appendNotification(
            bundle.getString('oddshot.stream.ready')+': '+transport.streamer, "oddshod-stream-ready-notification",
            "chrome://oddshot/skin/icon-48.png",
            nb.PRIORITY_INFO_HIGH, []);
    },
    activate: function(tab) {
        let tabID = tab.id.substr(1);
        let tabUrl = tab.url;
        let transport = httpRequestObserver.collection[tabID];
        if(TWITCH_STREAM_ADDRES.test(tabUrl)) {
            if (transport && transport.ready) {
                if(document.getElementById("oddshot-app-toolbarbutton").classList.contains('off'))
                    document.getElementById("oddshot-app-toolbarbutton").classList.remove('off');
            }else
                document.getElementById("oddshot-app-toolbarbutton").classList.add('off');
        }else
            document.getElementById("oddshot-app-toolbarbutton").classList.add('off');
    },
    close: function(tab){
        let tabID = tab.id.substr(1);
        let transport = httpRequestObserver.collection[tabID];
        if(transport)
            delete httpRequestObserver.collection[tabID];
        if(Oddshot.Tabs.tabs[tabID])
            delete Oddshot.Tabs.tabs[tabID];
    },
    ready: function(tab){
        let tabID = tab.id.substr(1);
        let tabUrl = tab.url;
        let transport = httpRequestObserver.collection[tabID];
        if(transport) {
            if(!document.getElementById("oddshot-app-toolbarbutton").classList.contains('off'))
                document.getElementById("oddshot-app-toolbarbutton").classList.add('off');
            delete httpRequestObserver.collection[tabID];
        }
        if(TWITCH_STREAM_ADDRES.test(tabUrl)) {
            let streamer = tabUrl.replace(TWITCH_STREAM_ADDRES,"$1");
            let url = "https://api.twitch.tv/kraken/channels/"+streamer;
            let request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
            request.onload = function (aEvent) {
                let streamData = JSON.parse(aEvent.target.responseText);
                httpRequestObserver.collection[tabID] = new Transport(streamData['display_name'],streamData['status'],streamData['game'],getTransportID(streamData['display_name'], tabID),SHOT_SOURCE.TWITCH,streamData.url,streamData.logo);
                let bundle = document.getElementById("oddshot-string-bundle");
                let nb = gBrowser.getNotificationBox();
                if(nb.currentNotification)
                    nb.currentNotification.close();
                nb.appendNotification(
                    bundle.getString('oddshot.stream.start.capture')+': '+streamData['display_name'], "oddshod-stream-ready-notification",
                    "chrome://oddshot/skin/icon-48",
                    nb.PRIORITY_INFO_HIGH, []);
            };
            request.onerror = function (aEvent) {
                console.error(aEvent.target.status);
            };
            request.open("GET", url, true);
            request.send(null);
        }
    },
    register: function(){
        TABS.on('ready', this.ready);
        TABS.on('close', this.close);
        TABS.on('activate', this.activate);
    }
};
Oddshot.BrowserOverlay = {
    sendToOddshot: function(payload,streamer,title,game,transportID,source,streamURL,avatarURL){
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", RENDER_ADDRESS);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState != 4)  {
                return;
            }

            if (xmlhttp.status != 200)  {
                // Handle error, display to user
                // @todo
                console.error("Failed retrieving shot data (" + xmlhttp.status + ")");
                return;
            }

            let resp = xmlhttp.responseText;
            try {
                let data = JSON.parse(resp);
                TABS.open(data.url);
            } catch (e) {
                console.error("Error processing shot data: " + e.message);
            }
        };
        let dataToSend = JSON.stringify({
            payload: payload,
            streamer: streamer,
            title: title,
            game: game,
            transport: transportID,
            source: source,
            originurl: streamURL,
            avatarurl: avatarURL
        });
        xmlhttp.send(dataToSend);
    },
  capture : function(aEvent) {
      let activeTab = TABS_UTILS.getActiveTab(window);
      let activeTabID = TABS_UTILS.getTabId(activeTab).substr(1);
      let transport = httpRequestObserver.collection[activeTabID];
      if (transport && transport.ready) {
          this.sendToOddshot(transport.payload,transport.streamer,transport.title,transport.game,transport.transportID,transport.source,transport.originurl,transport.avatarurl);
      }
  }
};
