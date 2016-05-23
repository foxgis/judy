var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Tileset = require('../models/tileset')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('瓦片集模块', function(){
  var access_token// eslint-disable-line no-unused-vars
  var tileset_id// eslint-disable-line no-unused-vars

  before('注册用户', function(done){
    request(app)
      .post('/api/v1/users')
      .send({ username: 'nick', password: '123456'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.username.should.equal('nick')
        res.body.access_token.should.exist

        access_token = res.body.access_token

        done()
      })
  })

  after('清理', function(done){
    User.remove({ username: 'nick'}).exec(function(){
      Tileset.remove({ owner: 'nick'}).exec(function(){
        done()
      })
    })
  })

  describe('上传瓦片集', function(){
    it('上传成功', function(done){
      request(app)
        .post('/api/v1/tilesets/nick')
        .set('x-access-token', access_token)
        .attach('aa', './test/fixtures/beijing.mbtiles')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          console.log(res.body)

          done()
        })
    })
  })
})
