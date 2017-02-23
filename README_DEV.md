
# INSTALL ASYNC-AWAIT (pre-ES7)

### Install babel
npm install babel babel-cli --save-dev
npm install babel-plugin-transform-async-to-generator --save-dev

### Add plugin to package.json
"babel": {
  "plugins": [
    "transform-async-to-generator"
  ]
}

### Execute
cd opamp/demo
node index.js


## PERFORMANCE
performance has dropped a little bit against express (before was better), but this version is asyncfied and promise based so this loss is acceptable

V7.6.0 perf has been increased from 7.0.0

siege http://localhost:8080/test -r100 -c100
ab -r -n 100000 -c 1000  http://localhost:8080/test

** SIEGE 3.0.8
** Preparing 100 concurrent users for battle.
The server is now under siege..      done.

Transactions:		       10000 hits
Availability:		      100.00 %
Elapsed time:		       60.26 secs
Data transferred:	        0.12 MB
Response time:		        0.00 secs
Transaction rate:	      165.95 trans/sec
Throughput:		        0.00 MB/sec
Concurrency:		        0.38
Successful transactions:       10000
Failed transactions:	           0
Longest transaction:	        0.05
Shortest transaction:


with express server


siege  http://localhost:8081/test -r100 -c100
** SIEGE 3.0.8
** Preparing 100 concurrent users for battle.
The server is now under siege..      done.

Transactions:		       10000 hits
Availability:		      100.00 %
Elapsed time:		       62.24 secs
Data transferred:	        0.12 MB
Response time:		        0.00 secs
Transaction rate:	      160.67 trans/sec
Throughput:		        0.00 MB/sec
Concurrency:		        0.44
Successful transactions:       10000
Failed transactions:	           0
Longest transaction:	        0.04
Shortest transaction:	        0.00
