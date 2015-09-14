var progressListener = {
    QueryInterface: XPCOMUtils.generateQI(["nsIWebProgressListener", "nsISupportsWeakReference"]),

    init: function() {
        gBrowser.addProgressListener(this);
    },

    uninit: function() {
        gBrowser.removeProgressListener(this);
    },

    onLocationChange: function(aWebProgress,aRequest, aURI) {
        let chromeWindow = aWebProgress.DOMWindow.top.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIWebNavigation)
            .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
            .rootTreeItem
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindow);
        let tab = modelFor(chromeWindow.gBrowser._getTabForContentWindow(aWebProgress.DOMWindow.top));
        let tabID = tab.id.substr(1);
        let currentURL = aURI.spec;
        let oldUrl = Oddshot.Tabs.tabs[tabID];
        if(oldUrl && oldUrl != currentURL)
            Oddshot.Tabs.ready(tab);

        Oddshot.Tabs.tabs[tabID] = currentURL;
    },

    // For definitions of the remaining functions see related documentation
    onStateChange: function(aWebProgress, aRequest, aFlag, aStatus) {},
    onProgressChange: function(aWebProgress, aRequest, curSelf, maxSelf, curTot, maxTot) {},
    onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) {},
    onSecurityChange: function(aWebProgress, aRequest, aState) {}
};