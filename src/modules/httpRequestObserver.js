var EXPORTED_SYMBOLS = ["httpRequestObserver", "Transport"];
Components.utils.import("resource://gre/modules/devtools/Console.jsm");
const { require } = Components.utils.import("resource://gre/modules/commonjs/toolkit/require.js", {});
var TABS_UTILS = require("sdk/tabs/utils");
var TWITCH_TS_REQUEST =  /.*\.ts$/;
var Transport = function (streamer,title,game,transportID,source,originurl,avatarurl){
    this.payload = [];
    this.streamer=streamer;
    this.title=title;
    this.game=game;
    this.transportID=transportID;
    this.source=source;
    this.originurl=originurl;
    this.avatarurl=avatarurl;
    this.ready = false;
};

var httpRequestObserver =
{
    topic: "http-on-examine-response",
    registerd: false,
    collection:{},
    streamReadyListener: function(browser){},
    observe: function(subject, topic, data)
    {
        if (topic == this.topic) {
            subject.QueryInterface(Components.interfaces.nsIHttpChannel);
            let browser = this.getContext(subject);
            let url = subject.name;
            if(TWITCH_TS_REQUEST.test(url)) {
                var tabID = browser.tabID.substr(1);
                if(this.collection[tabID]) {
                    this.collection[tabID].payload.push(url);
                    if (this.collection[tabID].payload.length == 10) {
                        this.collection[tabID].ready = true;
                        this.streamReadyListener(browser, this.collection[tabID]);
                    } else if (this.collection[tabID].payload.length > 10)
                        this.collection[tabID].payload.shift();
                    //console.log(this.collection[tabID].streamer + ' gather '+ this.collection[tabID].payload.length+ ' '+url);
                }
            }
        }
    },

    get observerService() {
        return Components.classes["@mozilla.org/observer-service;1"]
            .getService(Components.interfaces.nsIObserverService);
    },

    register: function()
    {
        if(!this.registerd) {
            this.observerService.addObserver(this, this.topic, false);
            this.registerd = true;
        }
    },

    unregister: function()
    {
        if(this.registerd) {
            this.observerService.removeObserver(this, this.topic);
            this.registerd = false;
        }

    },
    loadContext: function(httpChannel){
        var loadContext;
        try {
            var interfaceRequestor = httpChannel.notificationCallbacks.QueryInterface(Components.interfaces.nsIInterfaceRequestor);
            try {
                loadContext = interfaceRequestor.getInterface(Components.interfaces.nsILoadContext);
            } catch (ex) {
                try {
                    loadContext = subject.loadGroup.notificationCallbacks.getInterface(Components.interfaces.nsILoadContext);
                } catch (ex2) {
                }
            }
        } catch (ex0) {
        }
        return loadContext;
    },
    getContext: function(httpChannel) {
        let loadContext = this.loadContext(httpChannel);
        if (loadContext && loadContext.associatedWindow) {
            var contentWindow = loadContext.associatedWindow;
            if (!contentWindow) {
                return null;
            } else {
                var aDOMWindow = contentWindow.top.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                    .getInterface(Components.interfaces.nsIWebNavigation)
                    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                    .rootTreeItem
                    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                    .getInterface(Components.interfaces.nsIDOMWindow);
                var gBrowser = aDOMWindow.gBrowser;
                if(gBrowser) {
                    var aTab = gBrowser._getTabForContentWindow(contentWindow.top);
                    if(aTab) {
                        var browser = aTab.linkedBrowser;
                        var util = aDOMWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindowUtils);
                        var windowID = util.outerWindowID;
                        var tabID = TABS_UTILS.getTabId(aTab);
                        return {
                            windowID: windowID,
                            tabID: tabID,
                            aDOMWindow: aDOMWindow,
                            gBrowser: gBrowser,
                            aTab: aTab,
                            browser: browser,
                            contentWindow: contentWindow
                        }
                    }
                }
            }
        }
        return null;
    }
};