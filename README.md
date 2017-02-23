# Opamp

Amplify your server powers!

Next-gen async/await style web server. No need of callback style programming.

All the basic features in one module, routing, static & dynamic pages, REST services and reverse-proxy.

Built-in logger, customizable with other loggers without changing a line in your code.

Can install express/connect middleware or create your own plugins.

## Installation

```bash
npm install opamp
```

## 1 min Tutorial

Just use the default configuration (port 8080, static files at folder /public and dynamic files at folder /app )

```javascript
// index.js page
const server=require('opamp')
server.start()

//start the server: >node --harmony index
//now open a browser and go to http://localhost:8080
```

Instead of returning a callback, this module returns a promise after  started. The parameter returned is a node [http server](https://nodejs.org/api/http.html#http_class_http_server).

```javascript
// index.js page
const server=require('opamp')
server.start().then(httpServer=>{}).catch(err=>{})
```

Use the --harmony flag to enable async/await natively

```bash
cd yourApp
node --harmony index.js
```

## 30 min Tutorial (or less)

> HINT: check demo application in the module (node_modules/opamp/demo)


### starting the server

To start the app, use the `-harmony` flag to enable async/await. This is only valid for node V7 (node V8 will have async/await enabled by default, so no need of `--harmony`)

```bash
cd yourApp
node --harmony index.js
```


### Configuration

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
  Logger:Logger
}
```
To create a configuration object just add the properties you want to change, and pass the object when calling server.start()

```javascript
const configuration={
  port:80,
  rules:{
    '/':'landing.html',
    '/intranet/*':'/private/'
  }
}

server.start(configuration)
```



### Routing

When routing you can:

- serve static resources and dynamically generated resources.
- beautify any .html request by removing the extension in the url.
- use plain .js files to process requests, or to create REST APIs.
- reverse proxying requests to other servers you trust in.


#### Automatic routing

- if the request has an extension (.html, .js, .css, .png, ...), a static file is served. This file should be located at the 'public' directory
- if the request has not extension:
  - if name+".html" exists, that static file is served.
  - otherwise, a js file is executed in the server, and the result is sent back.

Examples:
- /index.html will serve /public/index.html
- /index will serve /public/index.html, since it exists
- /process will execute /app/process.js

#### Custom Routing

By adding rules to the configuration. See  ['url-pattern'](https://www.npmjs.com/package/url-pattern) npm module.

```javascript
const rules={
  '/':'/index.html', //root page
  '/governance(/\*)':'http://server1:8081',//proxy to private server
  '/cars(/:id)':'', //REST service
  '/bikes(/:id)':'/other/' //another REST example
}
const configuration={rules:rules}
server.start(configuration)
```



### Static files

- drop the resources (html,js,css) into the `public` folder
- request the resources as usual `http://server/css/main.css`
- As a nice feature, the html files can also be requested without the extension (.html)




### Dynamic files
- create a .js file at the `app` folder
- exports the http methods you want to process (get post put delete)
- implement the exported functions as [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) functions (or normal functions if no I/O processing). The output of the function should be either a JSON object, or a simple type (number, string).

> IMPORTANT: no callbacks!!!

```javascript
module.exports={options,get}

//normal (synchronous) function since no access to database or file system, etc...
function options(request,response,params){
  return ['GET']
}

//async keyword to avoid blocking the request
async function get(request,response,params){
  return database.get(params.id)
}
```



### Creating a REST API

The same as with normal dynamic files. The only difference is to add a rule in the server configuration to be able to extract the 'path' parameters.

Configuration:

```javascript
const rules={
  '/cars(/:id)':'', /*endpoint at /app/cars.js*/
  '/bikes(/:id)':'/inventory/motorbikes' /*endpoint at /app/inventory/motorbikes.js*/
}
```

REST service:

The params object is already filled (when the router is processed). These are REST params only, the queryString params can be taken from the request object as usual

> Look how the error thrown has the HTTP status code

```javascript
//file at /app/cars.js
module.exports={get}

var cars={
  '1':{name:'volvo',engine:'6V'},
  '2':{name:'seat',engine:'4L'}
}

async function get(request,response,params){
  if(params.id) return getItem(request,response,params)
  else return list(request,response,params)
}

function getItem(request,response,params){
  const obj=cars[params.id]
  if (!obj) throw(404)
  else return obj
}

function list(request,response,params,callback){
  return cars
}
```


### Plugins

A plugin is a function to be executed **before** a request has been processed. Plugins can be useful to check if user is authenticated, to insert headers, to log every request to the server, and so on.

```
request->is static file?
  |- yes->send the file
  |- no->executePlugins->execute and send the dynamic file
```

Add plugins **the same way as connect or express middleware**. The plugins for these applications are also valid here (passport, morgan, cookie-parser, etc...).

For custom plugins, **don't forget** to add next()/next(err) at the end of the function.

```javascript
//custom plugin
server.use((req,res,next)=>{console.log('middleware executed');next()})

//express-type plugin (middleware)
const morgan=require('morgan')
server.use(morgan('combined'))
```



### WebSockets

The simplest way is by using the [ws](https://www.npmjs.com/package/ws) module, already downloaded with the server.

```javascript
const WebSocketServer = require('ws').Server

server.start(serverConfiguration)
  .then(httpServer=>{startWebsocket(httpServer)})
  .catch(err=>{throw err})

  function startWebsocket(httpServer){
    const wss = new WebSocketServer({ server:httpServer })
    wss.on('connection', ws=>{
      ws.on('message', message=>{
        ws.send('response from the server')
      })
    })
  }  
```

### Logging

By default no logging module is required (for better performance), but if any of the most popular logging systems (winston, bunyan, log4js, etc...) is a requirement, that logging component can be added in the configuration object.

This way, the developer only need to use the Logger class shipped with the server. If in the future, the real logger is replaced by a new one, no code changes are required, just set the new logger you want to use in the configuration object.

```javascript
//STEP-1 configure the Logger in the server
const configuration={
  Logger:require('winston')
}
server.start(configuration)

//STEP-2 use the standard logger (it behaves as a proxy for your logger)
//and in any js file
const Logger=require('opamp/Logger')
const logger=Logger.getLogger('your-logger-name')
//...
logger.error(err)
```
