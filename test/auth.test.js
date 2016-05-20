var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Upload = require('../models/upload')
var Style = require('../models/style')
var Sprite = require('../models/sprite')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('权限模块', function(){
  var access_token
  var style_id
  var sprite_id

  before('注册nick_au', function(done){
    request(app)
      .post('/api/v1/users')
      .send({username: 'nick_au', password: '123456'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.username.should.equal('nick_au')
        res.body.access_token.should.exist

        access_token = res.body.access_token

        done()
      })
  })

  before('上传文件', function(done){
    request(app)
      .post('/api/v1/uploads/nick_au')
      .set('x-access-token', access_token)
      .attach('aa', './test/fixtures/svg.zip')
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.owner.should.equal('nick_au')
        res.body.upload_id.should.exist

        done()
      })
  })

  before('新建样式', function(done){
    request(app)
    .post('/api/v1/styles/nick_au')
    .set('x-access-token', access_token)
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

      res.body.owner.should.equal('nick_au')

      style_id = res.body.style_id

      done()
    })
  })

  before('创建符号库', function(done) {
    request(app)
      .post('/api/v1/sprites/nick_au')
      .set('x-access-token', access_token)
      .attach('aa', './test/fixtures/svg.zip')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        res.body.owner.should.equal('nick_au')
        res.body.sprite_id.should.exist

        sprite_id = res.body.sprite_id

        done()
      })
  })

  after('清理', function(){
    User.remove({username: 'nick_au'}).exec()
    Upload.remove({owner: 'nick_au'}).exec()
    Style.remove({owner: 'nick_au'}).exec()
    Sprite.remove({owner: 'nick_au'}).exec()
  })

  describe('陌生用户权限', function(){
    describe('获取用户信息', function(){
      it('获取信息成功', function(done){
        request(app)
          .get('/api/v1/users/nick_au')
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err)
            }

            res.body.username.should.equal('nick_au')

            done()
          })
      })

      it('获取失败', function(done) {
        request(app)
          .get('/api/v1/users/no_this_user')
          .expect(404)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.error.should.equal('用户不存在')

            done()
          })
      })

      it('更新失败', function(done){
        request(app)
          .patch('/api/v1/users/nick_au')
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
          .get('/api/v1/uploads/nick_au')
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
          .get('/api/v1/styles/nick_au')
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
          .get('/api/v1/styles/nick_au/' + style_id)
          .expect(404)
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
            .patch('/api/v1/styles/nick_au/' + style_id)
            .set('x-access-token', access_token)
            .send({scope: 'public'})
            .expect(200)
            .end(function(err, res){
              if(err){
                return done(err)
              }

              res.body.scope.should.equal('public')

              done()
            })
        })

        it('获取成功', function(done){
          request(app)
            .get('/api/v1/styles/nick_au/' + style_id)
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err)
              }

              res.body.style_id.should.equal(style_id)
              res.body.owner.should.equal('nick_au')
              should.not.exist(res.body.scopes)

              done()
            })
        })

        it('获取失败', function(done){
          request(app)
            .get('/api/v1/styles/nick_au/bad_style_id')
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

    describe('获取符号库', function(){
      it('获取符号库列表失败', function(done){
        request(app)
          .get('/api/v1/sprites/nick_au')
          .expect(401)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.should.be.empty

            done()
          })
      })

      it('获取私密符号库失败', function(done){
        request(app)
          .get('/api/v1/sprites/nick_au/' + sprite_id)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.sprite_id.should.equal(sprite_id)
            res.body.owner.should.equal('nick_au')
            should.not.exist(res.body.scopes)

            done()
          })
      })

      describe('获取公开符号库', function(){
        before('公开分享符号库', function(done){
          request(app)
            .patch('/api/v1/sprites/nick_au/' + sprite_id)
            .set('x-access-token', access_token)
            .send({scope: 'public'})
            .expect(200)
            .end(function(err, res){
              if(err){
                return done(err)
              }

              res.body.scope.should.equal('public')

              done()
            })
        })

        it('获取成功', function(done){
          request(app)
            .get('/api/v1/sprites/nick_au/' + sprite_id)
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err)
              }

              res.body.sprite_id.should.equal(sprite_id)
              res.body.owner.should.equal('nick_au')
              should.not.exist(res.body.scopes)

              done()
            })
        })

        it('下载成功', function(done){
          request(app)
            .get('/api/v1/sprites/nick_au/' + sprite_id +'/sprite@2x.json')
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err)
              }

              res.body.airport.pixelRatio.should.equal(2)

              done()
            })
        })

        it('获取失败', function(done){
          request(app)
            .get('/api/v1/styles/nick_au/bad_style_id')
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
})
