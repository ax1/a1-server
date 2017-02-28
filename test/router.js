/* eslint-env node, mocha */
const chai = require('chai')
chai.should()
const router=require('../lib/router')

describe('routing',()=>{
  let rules={
    '/':'/index.html',
    '/governance(/*)':'http://google.com',
    '/cars(/:id)':'',
    '/bikes(/:id)':'/other/'
  }
  router.load(rules)
  it('index',()=>{
    const res=router.resolve('/')
    res.path.should.equal('/index.html')
  })
  it('url without params',()=>{
    const res=router.resolve('/governance')
    res.path.should.equal('http://google.com')
  })
  it('url with params',()=>{
    const res=router.resolve('/governance/car/test/?users.html')
    res.path.should.equal('http://google.com/car/test/?users.html')
    res.params._.should.equal('car/test/?users.html')
  })
  it('REST url',()=>{
    const res=router.resolve('/bikes/33')
    res.path.should.equal('/other/')
    res.params.id.should.equal('33')
  })
})
