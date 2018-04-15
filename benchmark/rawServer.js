var http = require('http');

http.createServer(function(request, response) {
  response.writeHead(200, { 'Content-type': 'text/plan' });
  response.write('hola caracola');
  response.end();
  //console.log('passed')

}).listen(8080);