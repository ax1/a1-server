/**
 * Adapt a server to install connect and express compatible middleware 
 */

module.exports={
  use,
  executePlugins
}

let plugins=[]

/**
 * Install express plugin
 *
 * @param {function} func should be a func(request,response,next)
 */
function use(func){
  plugins.push(func)
}

/**
 * Execute all the plugins installed before the request is processed
 */
function executePlugins(route,req,res,callback){
  let index=-1

  function next(err){
    if (err){
      console.error(err)
      callback(err,req,res)
    }else{
      try{
        index++
        if (index===plugins.length){
          callback(null,route,req,res)
        }else{
          let fn=plugins[index]
          if (!fn) next(err)
          fn(req,res,next)
        }
      }catch(e){
        next(e)
      }
    }
  }

  next()
}
