let Nedb = require('nedb')
let database

module.exports={start,db}

function start(path,callback){
    try{
      if(!database) database= new Nedb({ filename:path, autoload: true })
      if(callback) callback(null,database)
    }catch(e){
      if(callback) callback(e)
    }
}

function db(){
  if (! database) throw 'database is not inited yet'
  else return database
}

//let database=require('./database').get()
