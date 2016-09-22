/**
 * Protect the server against attacks
 */

const logger=require('../lib/Logger').getLogger('proxy-custom')

module.exports={
  protect,
  block
}

let blacklist=[]
let lastClean=Date.now()

function getClient(request){
  if(request.headers['x-forwarded-for']) return request.headers['x-forwarded-for']
  else return request.connection.remoteAddress
}

/**
 * Block rogue user
 */
function block(request){
  let client=getClient(request)
  blacklist.push(client)
  logger.warn('blocking rogue '+client)
  request.destroy()
}

/**
 * Install protection against rogue users
 */
function protect(){
  var plugin=function(request,response,next){
    //clean every 10 min
    if(Date.now()-lastClean>10*60*1000){
      blacklist=[]
      lastClean=Date.now()
    }
    //if rogue client, screw him
    if(blacklist.includes(getClient(request))){
      // request.more='gelete'
      // request.socket.pause()
      // request.socket.end()
      request.destroy()
      response.end()
      //setTimeout((request,next)=>{request.connection.destroy();next()},1000000)//while executing tis timeout, the server process ondata several times, strange,, but dont use timeout for now
    }
    else next()
  }
  return plugin
}
