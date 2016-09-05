# 1 min Tutorial

Just use the default configuration (port 8080, static files at folder /public and dynamic files at folder /app )

```javascript
let server=require('opamp')
server.start()

//now open a browser and go to http://localhost:8080
```

Instead of returning a callback, this module returns a promise after  started. The parameter returned is a node [http server](https://nodejs.org/api/http.html#http_class_http_server).

```javascript
let server=require('opamp')
server.start().then(httpServer=>{}).catch(err=>{})
```
---

# 15 min Tutorial

## Configuration

Available options, and their default values:

```javascript
{
  ssl:{
    /*key: fs.readFileSync('~/webapp/server.key'),
    cert: fs.readFileSync('~/webapp/server.crt')
    */
  },
  serverName:'',
  welcomePage:'index.html',
  port:'8080',
  staticFolder:'public',
  dynamicFolder:'app',
  rules:{'/':'index.html'}
}
```
To create a configuration object just add the properties you want to change, and pass the object when calling server.start()

```javascript
let configuration={
  port:80,
  rules:{
    '/':'landing.html',
    '/intranet/*':'/private/'
  }
}

server.start(configuration)
```

---

## Routing

With routing you can:

- serve static resources and dynamically generated resources.
- beautify any .html request by removing that extension in the url.
- use plain .js files to process requests, or create REST APIs.
- reverse proxying requests to other servers you trust in.


### Automatic routing

- if the request has an extension (.html, .js, .css, .png, ...), a static file is served. This file should be located at the 'public' directory
- if the request has not extension:
  - if name+".html" exists, that static file is served.
  - otherwise, a js file is executed in the server, and the result is sent.

Examples:
- /index.html will serve /public/index.html
- /index will serve /public/index.html, since it exists
- /process will execute (not serve) /app/process.js

### Custom Routing

By adding rules to the configuration. See  ['url-pattern']() npm module.

```javascript
let rules={
  '/':'/index.html',
  '/governance(/\*)':'http://server1:8081',
  '/cars(/:id)':'',
  '/bikes(/:id)':'/other/'
}
let configuration={rules:rules}
server.start(configuration)
```

---

## Static files

- drop the resources (html,js,css) into the `public` folder
- request the resources as usual `http://server/css/main.css`
- As a nice feature, the html files can also be requested without the extension (.html)


---

## Dynamic files
- create a .js file at the `app` folder
- exports the http methods you want to process (get post put delete)
-implement the exported functions as async functions. The param sent to the callback should be either a JSON object, or a simple type (number, string)

```javascript
module.exports={get:get}

function get(request,response,params,callback){
  //callback(null, 'tested ok at '+(new Date()).toString())
  callback(null,{a:22})
}
```


---

## Creating a REST API

The same as with normal dynamic files. The only extra is to add a rule in the server configuration to be able to extract the path parameters.

Configuration:

```javascript
let rules={
  '/cars(/:id)':'' /*endpoint at /app/cars.js*/,
  '/bikes(/:id)':'/inventory/motorbikes' /*endpoint at /app/inventory/motorbikes.js*/
}
```
REST service:

Don't forget to surround errors with try-catch, to call the callback properly

Look how the error thrown has the HTTP status code

params object is already filled (when the router is processed). These are RES params only, the queryString params can be taken from the request object

The callback is the function that insert the content and response headers and send the response to the client

```javascript
//file at /app/cars.js
module.exports={get:all}

var cars={
  '1':{name:'volvo',engine:'6V'},
  '2':{name:'seat',engine:'4L'}
}

function all(request,response,params,callback){
  if(params.id) get(request,response,params,callback)
  else list(request,response,params,callback)
}

function get(request,response,params,callback){
  try{
    let obj=cars[params.id]
    if (!obj) throw(404)
    callback(null,obj)
  }catch (e){
    callback(e)
  }
}

function list(request,response,params,callback){
  try{
    callback(null,cars)
  }catch (e){
    callback(e)
  }
}
```

---
## Plugins

A plugin is a function to be executed before a request has been processed. Plugins can be useful to check if user is authenticated, to insert headers, to log every request to the server, and so on.

```
request->is staticFile?
            - yes->send the file
            - no->executePlugins->execute and send the dynamic file
```

Add plugins **the same way as connect or express middleware**. The plugins for these applications are also valid here (passport, morgan, cookie-parser, etc...).

For custom plugins, **don't forget** to add next()/next(err) at the end of the function.

```javascript
//custom plugin
server.use((req,res,next)=>{console.log('middleware executed');next()})

//express-type plugin (middleware)
let morgan=require('morgan')
server.use(morgan('combined'))
```

---

## WebSockets

The simplest way is by using the [ws](https://www.npmjs.com/package/ws) module, already downloaded with the server.

```javascript
let WebSocketServer = require('ws').Server

server.start(serverConfiguration)
  .then(httpServer=>{startWebsocket(httpServer)})
  .catch(err=>{throw err})

  function startWebsocket(httpServer){
    let wss = new WebSocketServer({ server:httpServer })
    wss.on('connection', ws=>{
      ws.on('message', message=>{
        ws.send('response from the server')
      })
    })
  }  
```
