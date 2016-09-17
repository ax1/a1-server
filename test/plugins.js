var assert=require('assert')
var plugins=require('../lib/plugins')

var plugin1=function(req,res,next){
  process.nextTick(function() {console.log('plugin1 executed');next()})
}

var plugin2=function(req,res,next){console.log('plugin2 executed');next()}
assert(true,'install')
;(function install(){
  try{
    plugins.use(plugin1)
    plugins.use(plugin2)
    assert(true,'install')
  }catch (err){
    console.error(err);
    assert(false,'install')
  }
})()


async function execute(){
  try{
    var a=await plugins.executePlugins()
    assert(true,'execute')
  }catch(err){
    console.error(err);
    assert(false,'execute')
  }
}

execute()
