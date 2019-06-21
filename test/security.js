/* eslint-env node, mocha */
const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
//const should = chai.should()

const host = 'http://localhost:8080'



describe('Prevent accessing external files', () => {
  it('should NOT allow files OUT of root folder ', (done) => {
    chai.request(host).get('/../../public/test').end((err, res) => {
      res.should.have.status(404)
      done()
    })
  })
  it('should NOT allow files OUT of root folder if symbolic link and file OUT of subfolder of symbolic link ', (done) => {
    chai.request(host).get('/link/../forbidden/test').end((err, res) => {
      res.should.have.status(404)
      done()
    })
  })
  it('should YES allow files out of root folder if symbolic link and file in subfolder of symbolic link ', (done) => {
    chai.request(host).get('/link/test').end((err, res) => {
      res.should.have.status(200)
      done()
    })
  })

})