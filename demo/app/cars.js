/**
 * REST example
 */

let db=require('../../lib/persistence').getDB()

module.exports={
  get, post, put, delete:remove
}

async function get(request,response,params){
  if (params && Object.keys(params).length>0) return await db.findAsync({_id:params.id})
  else return await db.findAsync({})
}

async function post(request,response,params){
  let data=await db.insertAsync(JSON.parse(request.body))
  response.statusCode=201
  let location=request.url
  if (location.endsWith('/')) location=location+data._id
  else location=location+'/'+data._id
  response.setHeader('Location',location)
  return {'_id':data._id}
}

async function put(request,response,params){
  let numAffected=await db.updateAsync({_id:params.id},JSON.parse(request.body),{})
  if(numAffected===0)response.statusCode=404
  else response.statusCode=204
  return numAffected
}

async function remove(request,response,params){
  if(params && Object.keys(params).length)  return await db.removeAsync({_id:params.id},{})
  else return await db.remove({},{multi:true}) //normal http delete doesn't contain body (so if no id, delete all)
}
