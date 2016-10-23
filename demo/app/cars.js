/**
 * REST example
 */

 const db=[
   {"name":"toyota","engine":"2222","_id":"doKnnvbRCpt7fQaC"},
   {"name":"toyota","engine":"1111","_id":"tibP9rhyyu3dzTtX"}
]

module.exports={
  get, post, put, delete:remove
}

async function get(request,response,params){
  if (params && Object.keys(params).length>0) return  db.find(params.id)
  else return db
}

async function post(request,response,params){
  const data=request.body
  db.push(data)
  response.statusCode=201
  let location=request.url
  if (location.endsWith('/')) location=location+data._id
  else location=location+'/'+data._id
  response.setHeader('Location',location)
  return {'_id':data._id}
}

async function put(request,response,params){
  const found= db.find((el)=>{
    if(el._id===params.id){el=request.body;return true}
    else return false
  })
  if (!found) throw(404)
  response.statusCode=204
  return 1
}

async function remove(request,response,params){
  if(params && Object.keys(params).length)  return db.remove(params.id).length
  else return db.splice(0).lenght
}
