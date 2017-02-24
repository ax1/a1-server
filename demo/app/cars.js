/**
 * REST example
 */

const db=[
  {name:"toyota",engine:"2222",id:"doKnnvbRCpt7fQaC"},
  {name:"toyota",engine:"1111",id:"tibP9rhyyu3dzTtX"}
]

module.exports={
  get, post, put, delete:remove
}

async function get(request,response,params){
  if (params && Object.keys(params).length>0) return  db.find(item=>item.id==params.id)
  else return db
}

async function post(request,response,params){
  const data=JSON.parse(request.body)
  db.push(data)
  response.statusCode=201
  let location=request.url
  if (location.endsWith('/')) location=location+data.id
  else location=location+'/'+data.id
  response.setHeader('Location',location)
  return {'id':data.id}
}

async function put(request,response,params){
  const index= db.findIndex(el=>el.id===params.id)
  if (index>-1){
    db.splice(index,1,JSON.parse(request.body))
    response.statusCode=204
  }else{
    throw(404)
  }
}

async function remove(request,response,params){
  if(params && Object.keys(params).length){
    const index=db.findIndex(item=>item.id==params.id)
    if (index>-1) {
      db.splice(index,1)
      return 1
    }else return 0
  }
  else throw(404)
}
