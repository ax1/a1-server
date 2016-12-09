const cluster = require('cluster')
const http = require('http')
const numCPUs = require('os').cpus().length

if (cluster.isMaster) {
  for (var i = 0; i < numCPUs; i++) {cluster.fork()}
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)
    cluster.fork();
  })
} else {
  http.createServer((req, res) => {
    res.writeHead(200)
    res.write('hello world')
    res.end()
  }).listen(8080)
}
