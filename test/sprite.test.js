var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Sprite = require('../models/sprite')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('符号库系统',function(){
  var access_token 

  after('清除用户以及用户样式表信息',function(){
    User.remove({username:'nick'}).exec()
    Sprite.remove({owner:'nick'}).exec()
  })

  it('注册', function(done) {
    request(app)
      .post('/api/v1/users')
      .send({ username: 'nick', password: '123456' })
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        res.body.username.should.equal('nick')
        res.body.access_token.should.exist

        access_token = res.body.access_token

        done()
      })
  })

  it('上传符号库文件',function(done){
    request(app)
      .post('/api/v1/uploads/nick')
      .set('x-access-token',access_token)
      .attach('','test/fixtures/sprite.zip')
      .expect(200)
      .end(function(err,res){
        if(err){
          return done(err)
        }

        res.should.not.be.empty

        done()
      })
  })


  describe('获取符号库',function(){
    it('获取用户符号库列表',function(done){
      request(app)
        .get('/api/v1/sprites/nick')
        .set('x-access-token',access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body[0].should.contain.all.keys({owner:'nick'})
          res.body[0].should.contain.all.keys(['create_at','sprite_id','name'])
          res.body[1].should.contain.all.keys({owner:'nick'})
          res.body[1].should.contain.all.keys(['create_at','sprite_id','name'])

          done()
        })
    })
  })
})