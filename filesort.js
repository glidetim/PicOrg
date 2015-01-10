
var fs = require("fs");
var _ = require("underscore");
var async = require("async");

var TPATH = "/Users/Tim/Pictures/2015 Tim Phone Download/Camera";

console.log ("Testing");

fs.readdir(TPATH, function(err, files) {
    if (err) {
        console.log ("Error reading directory");
        console.log(err);
        process.exit(1);
    }

    _.each(files, function(element, index, list) {
    
        console.log(TPATH + element);
            
    });
});