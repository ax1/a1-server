## EXECUTE

```sh
cd a1-server/demo 

SERVER_PERFORMANCE=true npm start
```

## TEST

ab -r -n 100000 -c 1000  http://localhost:8080/test

## PERFORMANCE (1 thread)

- improved to 17K on v13.5.0 (v13 has latest V8 perf. improvement, rawServer has also 17K so V8 performs optimizations)
- improved to 15K on same v12.13.0 LTS (maybe older tests were executed without the SERVER_PERFORMANCE flag)
- degradation to 10K on same v12.13.0 LTS (OS problem? because raw node has also a big decrease to 16K, see below)
- degradation to 12.8K when updating to v12.13.0 LTS
- degradation to 13.2K on same node 12.0. Since some security for checking files are performed, this could be improved but no need to add the performance boolean to those codes for now. Hacking the code to perform near plain node is not a must, compared to the set of features. Benchmark should be only to ckeck for unexpected regressions
- degradation to 13.7K r/s on same node 12.0. Performance settings have changed but review if we can improve it again  
- slight degradation when updating to node 12.0.0 (14.7K request/s). Node 12 introduces llhttp by default instead of http-server, but whatever
- same performance after changing checks for dyn and static files (15K request/s)
- same performance from 10.11.1 to 10.13.0 LTS (15K request/s)
- performance increase when using `performance` flag (15K request/s)
- little improvement when removing req.on('error') (to start adapting to http2 docum) (12.5K requests/s)
- same performance at 10.11.1 (12K requests/s)
- same performance at 9.1.0 and with 2.0 version (12K requests/s)
- BIG performance drop at same 9.1.0 and same deps (12K requests/s)->maybe a OS kernel or libs update problem???? checkouting to previous versions shows also drop, so it is not the code itself)
- performance drop at 9.1.0 (14K requests/s) due to default response content-type
- performance increase from 8.8.1 to 9.1.0 (14K requests/s)
- performance increase from 8.8.1 to 9.1.0 (14K requests/s)
- performance idle from 8.4.0 to 8.8.1 (13.4K requests/s)
- performance increased from 8.1.2 to 8.4.0 (13.3K requests/s)
- performance increased with node 8 vs node 7 (+20% , 10K -> 12K request/s)

## PERFORMANCE VS RAW NODE

- raw node 20K
- a1-server 12K

Added a sample code in lib/server to start checking what are the functionalities that slow down the most (and check if refactoring is possible)

20k raw
18.5k without middleware and without dynamic file (middleware security.protect())
16.5 without dynamic file
13 all

## PERFORMANCE VS CLUSTER MODE

- for small hello tests like these, cluster performance is 16K so it is worse than raw node
- it only makes sense in production, when responses takes time in the database, etc.

## PERFORMANCE RAW NODE VS JAVA

- javalin 2.2.4 (jetty) 22Kreq (by using all threads) 250MB after tests (which are the default XX values, so it could be tuned to use less memory. i:e 150MB would be OK for a medium load server)

- node 12.13.0 raw server 16Kreq (cause of degradation:unknown)
- node 10.11.0 raw server 20Kreq (by using ONLY 1 thread) 75MB after tests

So **JAVA is OK** as a web server and **NODE is still relevant** since it uses far less resources
