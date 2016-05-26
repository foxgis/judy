var app = require('../app')
var request = require('supertest')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('行政区划测试', function(){
  it('获取成功', function(done){
    request(app)
      .get('/admin.json')
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.pac.should.equal(156)

        done()
      })
  })
})
