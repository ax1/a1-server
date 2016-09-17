/**
 * Adapt a server to install connect and express compatible middleware
 *Example: server.use((req,res,next)=>{console.log('middleware executed');next()})
 */

module.exports={
  use,
  executePlugins
}

let plugins=[]

/**
 * Install express plugin
 * @param {function} func should be a func(request,response,next)
 */
function use(func){
  plugins.push(func)
}

/**
 * Execute all the plugins installed before the request is processed
 */
async function executePlugins(route,req,res){
  let index=-1

  function next(err){
    if (err){
      console.error(err)
      throw (err)
    }else{
      try{
        index++
        if (index===plugins.length){
           return
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
