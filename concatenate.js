var modConcat = require("node-module-concat");
var outputFile = "./lib/SERVER.js";
modConcat("./lib/server.js", outputFile, function(err, files) {
    if(err) throw err;
    console.log(files.length + " were combined into " + outputFile);
});
