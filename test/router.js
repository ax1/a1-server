/* eslint-env node, mocha */
const chai = require('chai')
chai.should()
const router = require('../lib/router')
const { rules } = require('./rules')

describe('routing', () => {
  router.load(rules)
  it('index', () => {
    const res = router.resolve('/')
    res.path.should.equal('/index.html')
  })
  it('url without params', () => {
    const res = router.resolve('/governance')
    res.path.should.equal('http://google.com')
  })
  it('url with params', () => {
    const res = router.resolve('/governance/car/test/?users.html')
    res.path.should.equal('http://google.com/car/test/?users.html')
    res.params._.should.equal('car/test/?users.html')
  })
  it('REST url', () => {
    const res = router.resolve('/bikes/33')
    res.path.should.equal('/other/')
    res.params.id.should.equal('33')
  })
  it('use ZERO-CONF REST services', () => {
    // const res = router.resolve('/people/alopez/permissions')
    // res.path.should.equal('/people/')
    // res.params.p0.should.equal('alopez')
    // res.params.p1.should.equal('permissions')
    console.log('ZERO-CONF REST services are tested in the general tests')
  })
})
