
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

performance increased with node 8 vs node 7 (+20% , 10K -> 12K request/s)

### 19/06/17 with node 8.1.2 & no logger output

ab -r -n 100000 -c 1000  http://localhost:8080/test
This is ApacheBench, Version 2.3 <$Revision: 1706008 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient)
Completed 10000 requests
Completed 20000 requests
Completed 30000 requests
Completed 40000 requests
Completed 50000 requests
Completed 60000 requests
Completed 70000 requests
Completed 80000 requests
Completed 90000 requests
Completed 100000 requests
Finished 100000 requests


Server Software:        
Server Hostname:        localhost
Server Port:            8080

Document Path:          /test
Document Length:        13 bytes

Concurrency Level:      1000
Time taken for tests:   8.084 seconds
Complete requests:      100000
Failed requests:        0
Total transferred:      8800000 bytes
HTML transferred:       1300000 bytes
Requests per second:    12370.62 [#/sec] (mean)
Time per request:       80.837 [ms] (mean)
Time per request:       0.081 [ms] (mean, across all concurrent requests)
Transfer rate:          1063.10 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   50 359.5      0    7016
Processing:     5   18  22.7     19     819
Waiting:        5   18  22.7     19     819
Total:          9   69 367.7     19    7233

Percentage of the requests served within a certain time (ms)
  50%     19
  66%     20
  75%     21
  80%     21
  90%     24
  95%     27
  98%   1018
  99%   1025
 100%   7233 (longest request)

### 19/06/17 with node 7.7.1 & no logger output

ab -r -n 100000 -c 1000  http://localhost:8080/test

This is ApacheBench, Version 2.3 <$Revision: 1706008 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient)
Completed 10000 requests
Completed 20000 requests
Completed 30000 requests
Completed 40000 requests
Completed 50000 requests
Completed 60000 requests
Completed 70000 requests
Completed 80000 requests
Completed 90000 requests
Completed 100000 requests
Finished 100000 requests


Server Software:        
Server Hostname:        localhost
Server Port:            8080

Document Path:          /test
Document Length:        13 bytes

Concurrency Level:      1000
Time taken for tests:   9.484 seconds
Complete requests:      100000
Failed requests:        0
Total transferred:      8800000 bytes
HTML transferred:       1300000 bytes
Requests per second:    10544.04 [#/sec] (mean)
Time per request:       94.840 [ms] (mean)
Time per request:       0.095 [ms] (mean, across all concurrent requests)
Transfer rate:          906.13 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   66 356.7      0    7012
Processing:    10   20  23.9     14     444
Waiting:       10   20  23.9     14     444
Total:         10   86 364.3     14    7043

Percentage of the requests served within a certain time (ms)
  50%     14
  66%     23
  75%     24
  80%     25
  90%     28
  95%     82
  98%   1027
  99%   1225
 100%   7043 (longest request)
O
