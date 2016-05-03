var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Upload = require('../models/upload')
var Sprite = require('../models/sprite')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('符号库系统',function(){
  var access_token 
  var sprite_id

  after('清除用户以及用户样式表信息',function(){
    User.remove({username:'nick'}).exec()
    Upload.remove({owner:'nick'}).exec()
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

  describe('上传',function(){
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

          sprite_id = res.body[1].sprite_id

          done()
        })
    })
  })

  describe('下载符号库',function(){
    it('2倍未指定格式',function(done){
      request(app)
        .get('/api/v1/sprites/nick/'+sprite_id+'@2x')
        .set('x-access-token',access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.should.be.an('object')

          done()
        })
    })

    it('1倍未指定格式',function(done){
      request(app)
        .get('/api/v1/sprites/nick/'+sprite_id)
        .set('x-access-token',access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.should.be.an('object')

          done()
        })
    })

    it('下载2倍json',function(done){
      request(app)
        .get('/api/v1/sprites/nick/'+sprite_id+'@2x.json')
        .set('x-access-token',access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.should.exist

          done()
        })
    })

    it('下载1倍json',function(done){
      request(app)
        .get('/api/v1/sprites/nick/'+sprite_id+'.json')
        .set('x-access-token',access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.should.be.an('object')

          done()
        })
    })

    it('下载2倍图片',function(done){
      request(app)
        .get('/api/v1/sprites/nick/'+sprite_id+'@2x.png')
        .set('x-access-token',access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.should.exist

          done()
        })
    })

    it('下载1倍图片',function(done){
      request(app)
        .get('/api/v1/sprites/nick/'+sprite_id+'.png')
        .set('x-access-token',access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.should.exist

          done()
        })
    })
  })

  describe('删除符号库',function(){
    it('删除成功',function(done){
      request(app)
        .delete('/api/v1/sprites/niick/'+sprite_id)
        .set('x-access-token',access_token)
        .expect(204)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.should.expect

          done()
        })
    })
  })
})