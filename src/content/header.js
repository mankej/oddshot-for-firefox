const COMMONJS_URI = "resource://gre/modules/commonjs";
const { require } = Cu.import(COMMONJS_URI + "/toolkit/require.js", {});
Components.utils.import("resource://jsmmodules/httpRequestObserver.js");

const RENDER_ADDRESS = "http://capture.oddshot.tv:8080/";
var { modelFor } = require("sdk/model/core");
var TABS_UTILS = require("sdk/tabs/utils");
var TABS = require("sdk/tabs");
var SHOT_SOURCE = {
    TWITCH:"twitch.tv",
    MLG:"mlg.tv"
};
const TWITCH_STREAM_ADDRES = /http.*?:\/\/www\.twitch.tv\/([A-Za-z0-9_]+)/;

function filterSlug(slug) {
    return slug.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/[_]{2,}/g, "_");
}

function getTransportID(streamer, tabID) {
    return filterSlug(streamer + "_" + tabID);
}
