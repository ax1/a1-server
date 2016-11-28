const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(process);
  }).listen(8080);
}

// http.createServer((req, res) => {
//   res.writeHead(200);
//   res.end(process());
// }).listen(8080);

const text=`aaaaaaaaaaaaa`

function process(){
  let res=text
  while(res.length>0){
    res=res.replace(res.substring(0,1),'')
  }
  return res
}
