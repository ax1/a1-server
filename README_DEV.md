## EXECUTE
cd a1-server/demo
node index.js

## TEST
ab -r -n 100000 -c 1000  http://localhost:8080/test

## PERFORMANCE
performance increase from 8.8.1 to 9.1.0 (14K requests/s)
performance idle from 8.4.0 to 8.8.1 (13.4K requests/s)
performance increased from 8.1.2 to 8.4.0 (13.3K requests/s)
performance increased with node 8 vs node 7 (+20% , 10K -> 12K request/s)
