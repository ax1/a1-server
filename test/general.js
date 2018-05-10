/* eslint-env node, mocha */
const chai = require('chai')
const chaiHttp = require('chai-http')
const should = chai.should()
const host = 'http://localhost:8080'
chai.use(chaiHttp)

//----------------------general----------------------------------
describe('test environment', () => {
  it('mocha is working', () => {
    let obj = null
    should.not.exist(obj)
  })
  it('server is running', (done) => {
    chai.request(host).get('/').end((err, res) => {
      res.should.have.status(200)
      done()
    })
  })
})

//----------------------index.html when default paths------------
describe('index.html pages', () => {
  it('/-> index.html', (done) => {
    chai.request(host).get('/').end((err, res) => {
      res.should.have.status(200)
      done()
    })
  })
  it('/index -> index.html', (done) => {
    chai.request(host).get('/index').end((err, res) => {
      res.should.have.status(200)
      done()
    })
  })
  it('/details -> /details/index.html', (done) => {
    chai.request(host).get('/details').end((err, res) => {
      res.should.have.status(200)
      done()
    })
  })
  it('/details/index -> /details/index.html', (done) => {
    chai.request(host).get('/details/index').end((err, res) => {
      res.should.have.status(200)
      done()
    })
  })
})

//----------------------static dynamic and rest requests---------
describe('requests', () => {
  var service = '/cars'
  it('rest get', (done) => {
    chai.request(host).get(service).end((err, res) => {
      res.should.have.status(200)
      done()
    })
  })
  let id_test = null
  it('rest post', (done) => {
    chai.request(host).post(service).send({
      name: "lada",
      engine: "2.0",
      id: "AEIOU"
    }).end((err, res) => {
      res.should.have.status(201)
      res.should.have.header('Location')
      res.body.should.be.a('object')
      let id = res.body.id
      id.should.be.a('string')
      id_test = id
      done()
    })
  })
  it('rest put', (done) => {
    chai.request(host).put(service + '/' + id_test).send({
      name: "lada",
      engine: "4.0",
      id: "AEIOU"
    }).end((err, res) => {
      res.should.have.status(204)
      done()
    })
  })
  it('rest delete', (done) => {
    chai.request(host).delete(service + '/' + id_test).end((err, res) => {
      res.should.have.status(200)
      done()
    })
  })
})

//----------------------test a POST-------------------------------------------
describe('POST method', () => {
  it('should handle POST multipart/form-data', done => {
    chai.request(host).post('/test').field('name', 'Eddie').end((err, res) => {
      res.text.includes('Eddie').should.be.ok
      done()
    })
  })
  it('should handle POST text/plain', done => {
    const text = '{"name", "Eddie"}'
    chai.request(host).post('/test').send(text).end((err, res) => {
      res.text.should.be.equal(text)
      done()
    })
  })
})

//----------------------responses as streams----------------------------------
describe('streams', () => {
  it('should return all static files as streams', (done) => {
    chai.request(host).get('/index.html').end((err, res) => {
      res.should.have.status(200)
      done()
    })
  })
  it('should return certain dynamic files as streams', (done) => {
    chai.request(host).get('/test-stream').end((err, res) => {
      res.should.have.status(200)
      done()
    })
  })
})

//---------------------querystring behaviour----------------------------------
describe('parameter handling', () => {
  it('should parse querystring params when no route', (done) => {
    chai.request(host).put('/test?person=max').end((err, res) => {
      console.log(Object.keys(res))
      res.text.includes('person').should.be.ok
      done()
    })
  })
  it('should merge querystring params when REST route params', (done) => {
    chai.request(host).put('/cars/doKnnvbRCpt7fQaC?person=max').end((err, res) => {
      console.log(Object.keys(res))
      res.text.includes('person').should.be.ok
      done()
    })
  })
})

//----------------------handling error pages----------------------------------
describe('errors', () => {
  it('should return error 500', (done) => {
    chai.request(host).put('/test').end((err, res) => {
      res.should.have.status(500)
      done()
    })
  })
})