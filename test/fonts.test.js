var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('字体模块', function(){
  var access_token

  before('注册用户', function(done){
    request(app)
      .post('/api/v1/users')
      .send({username: 'nick4', password: '123456'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.username.should.equal('nick4')
        res.body.access_token.should.exist

        access_token = res.body.access_token

        done()
      })
  })

  after('清理', function(){
    User.remove({username: 'nick4'}).exec()
  })

  describe('请求字体', function(){
    it('请求成功', function(done){
      request(app)
        .get(encodeURI('/api/v1/fonts/foxgis/宋体/0-255.pbf'))
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.header['content-type'].should.equal('application/octet-stream')

          done()
        })
    })

    it('请求失败', function(done){
      request(app)
        .get(encodeURI('/api/v1/fonts/foxgis/酷炫字体/0-255.pbf'))
        .set('x-access-token', access_token)
        .expect(404)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })
  })
})
