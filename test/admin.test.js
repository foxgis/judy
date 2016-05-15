var app = require('../app')
var request = require('supertest')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('行政区划模块', function(){
  it('请求成功', function(done){
    request(app)
      .get('/api/v1/admin.json')
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.pac.should.equal(156)
        res.body.sub_admins.length.should.equal(34)

        done()
      })
  })
})