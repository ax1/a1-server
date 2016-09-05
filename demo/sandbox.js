// var NodeUglifier = require("node-uglifier");
// new NodeUglifier("../dist/server.js").uglify().exportToFile("../SERVER.js");
var modConcat = require("node-module-concat");
var outputFile = "../SERVER.js";
modConcat("../lib/server.js", outputFile, function(err, files) {
    if(err) throw err;
    console.log(files.length + " were combined into " + outputFile);
});
