/* eslint-env node, mocha */
const chai = require('chai')
const chaiHttp = require('chai-http')
const should=chai.should() 
//const expect=chai.expect
const host='http://localhost:8080'
chai.use(chaiHttp)

//----------------------general----------------------------------
describe('test environment',()=>{
  it('mocha is working',()=>{
    let obj=null
    should.not.exist(obj)
  })
  it('server is running',(done)=>{
    chai.request(host).get('/').end((err,res)=>{
      res.should.have.status(200)
      done()
    })
  })
})


//----------------------static dynamic and rest requests---------
describe('requests',()=>{
  var service='/cars'
  it('index page',(done)=>{
    chai.request(host).get('/index').end((err,res)=>{
      res.should.have.status(200)
      done()
    })
  })
  it('rest get',(done)=>{
    chai.request(host).get(service).end((err,res)=>{
      res.should.have.status(200)
      done()
    })
  })
  let id_test=null
  it('rest post',(done)=>{
    chai.request(host).post(service).send({name:'mocha',content:'this was a post'}).end((err,res)=>{
      res.should.have.status(201)
      res.should.have.header('Location')
      res.body.should.be.a('object')
      let _id=res.body._id
      _id.should.be.a('string')
      id_test=_id
      done()
    })
  })
  it('rest put',(done)=>{
    chai.request(host).put(service+'/'+id_test).send({name:'mocha',content:'this was a put'}).end((err,res)=>{
      res.should.have.status(204)
      done()
    })
  })
  it('rest delete',(done)=>{
    chai.request(host).delete(service+'/'+id_test).end((err,res)=>{
      res.should.have.status(200)
      done()
    })
  })
})
