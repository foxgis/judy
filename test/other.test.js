var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Upload = require('../models/upload')
var Style = require('../models/style')
var Sprite = require('../models/sprite')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('其他用户权限模块', function(){
  var nick_access_token
  var judy_access_token
  var upload_id // eslint-disable-line no-unused-vars
  var style_id // eslint-disable-line no-unused-vars
  var sprite_id // eslint-disable-line no-unused-vars

  before('注册nick', function(done){
    request(app)
      .post('/api/v1/users')
      .send({username: 'nick', password: '123456'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.username.should.equal('nick')
        res.body.access_token.should.exist

        nick_access_token = res.body.access_token

        done()
      })
  })

  before('上传文件', function(done){
    request(app)
      .post('/api/v1/uploads/nick')
      .set('x-access-token', nick_access_token)
      .attach('aa', './test/fixtures/sprite.zip')
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.owner.should.equal('nick')

        upload_id = res.body.upload_id

        done()
      })
  })

  before('新建样式', function(done){
    request(app)
    .post('/api/v1/styles/nick')
    .set('x-access-token', nick_access_token)
    .send({
      'version': 8,
      'name': 'test',
      'center': [116.000000, 40.000000],
      'metadata': {
        'mapbox:autocomposite': true
      },
      'sprite': 'mapbox://sprites/mapbox/satellite-v8',
      'glyphs': 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
      'sources': {
        'mapbox': {
          'url': 'mapbox://mapbox.mapbox-streets-v7',
          'type': 'vector'
        }
      },
      'layers': [{
        'id': 'background',
        'type': 'background',
        'paint': {
          'background-color': 'rgba(0,0,0,0)'
        }
      }]
    })
    .expect(200)
    .end(function(err, res) {
      if (err) {
        return done(err)
      }

      res.body.owner.should.equal('nick')

      style_id = res.body.style_id

      done()
    })
  })

  before('获取符号库信息', function(done){
    request(app)
      .get('/api/v1/sprites/nick')
      .set('x-access-token', nick_access_token)
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body[0].owner.should.equal('nick')

        sprite_id = res.body[0].sprite_id

        done()
      })
  })

  before('注册judy', function(done){
    request(app)
      .post('/api/v1/users')
      .send({username: 'judy', password: '123456'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.username.should.equal('judy')
        res.body.access_token.should.exist

        judy_access_token = res.body.access_token

        done()
      })
  })

  after('清理', function(){
    User.remove({username: 'nick'}).exec()
    Upload.remove({owner: 'nick'}).exec()
    Style.remove({owner: 'nick'}).exec()
    Sprite.remove({owner: 'nick'}).exec()
    User.remove({username: 'judy'}).exec()
  })

  describe('获取用户信息', function(){
    it('获取信息成功', function(done){
      request(app)
        .get('/api/v1/users/nick')
        .set('x-access-token', judy_access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.username.should.equal('nick')

          done()
        })
    })

    it('获取失败', function(done) {
      request(app)
        .get('/api/v1/users/no_this_user')
        .set('x-access-token', judy_access_token)
        .expect(404)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.error.should.equal('没有这个用户')

          done()
        })
    })

    it('更新失败', function(done){
      request(app)
        .patch('/api/v1/users/nick')
        .set('x-access-token', judy_access_token)
        .send({name: '张三'})
        .expect(401)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })
  })

  describe('获取上传文件', function(){
    it('获取失败', function(done){
      request(app)
        .get('/api/v1/uploads/nick')
        .set('x-access-token', judy_access_token)
        .expect(401)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })
  })

  describe('获取样式', function(){
    it('获取样式列表失败', function(done){
      request(app)
        .get('/api/v1/styles/nick')
        .set('x-access-token', judy_access_token)
        .expect(401)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('获取私密样式失败', function(done){
      request(app)
        .get('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', judy_access_token)
        .expect(401)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    describe('获取公开样式', function(){
      before('公开分享样式', function(done){
        request(app)
          .patch('/api/v1/styles/nick/' + style_id)
          .set('x-access-token', nick_access_token)
          .send({share: 'public'})
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err)
            }

            res.body.scopes[0].should.equal('public')

            done()
          })
      })

      it('获取成功', function(done){
        request(app)
          .get('/api/v1/styles/nick/' + style_id)
          .set('x-access-token', judy_access_token)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.scopes[0].should.equal('public')
            res.body.style_id.should.equal(style_id)
            res.body.owner.should.equal('nick')

            done()
          })
      })

      it('获取失败', function(done){
        request(app)
          .get('/api/v1/styles/nick/bad_style_id')
          .set('x-access-token', judy_access_token)
          .expect(404)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.should.be.empty

            done()
          })
      })
    })
  })
})
