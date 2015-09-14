httpRequestObserver.streamReadyListener = Oddshot.Tabs.streamReadyListener;
httpRequestObserver.register();
Oddshot.Tabs.register();
window.addEventListener("load", function() { progressListener.init() }, false);
window.addEventListener("unload", function() { progressListener.uninit() }, false);