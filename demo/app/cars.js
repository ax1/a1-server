let db=require('../../lib/persistence').db()

module.exports={
  get,
  post,
  put,
  delete:remove
}

function get(request,response,params,callback){
  try{
    if (params && Object.keys(params).length>0){
      db.find({_id:params.id},callback)
    }else{
      db.find({},callback)
    }
  }catch (e){
    callback(e)
  }
}

function post(request,response,params,callback){
  try{
    db.insert(JSON.parse(request.body),(err,data)=>{
      if (err) callback(err)
      else{
        response.statusCode=201
        let location=request.url
        if (location.endsWith('/')) location=location+data._id
        else location=location+'/'+data._id
        response.setHeader('Location',location)
        callback(null,{'_id':data._id})
      }
    })
  }catch (e){
    callback(e)
  }
}

function put(request,response,params,callback){
  try{
    db.update({_id:params.id},JSON.parse(request.body),{},(err, numAffected, affectedDocuments, upsert)=>{
      if(err){
        callback(err)
      }else{
        if(numAffected===0){
          response.statusCode=404
          callback(404)
        }else{
          response.statusCode=204
          callback(null,'')
        }
      }
    })
  }catch (e){
    callback(e)
  }
}

function remove(request,response,params,callback){
  try{
    if(params && Object.keys(params).length){
      db.remove({_id:params.id},{},callback)
    }else{
      //normal http delete doesn't contain body (so if no id, delete all)
      db.remove({},{multi:true},callback)
    }
  }catch (e){
    callback(e)
  }
}
