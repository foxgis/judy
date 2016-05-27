var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Upload = require('../models/upload')
var Style = require('../models/style')
var Sprite = require('../models/sprite')
var Font = require('../models/font')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('权限模块', function() {
  var nick_access_token
  var judy_access_token
  var style_id
  var sprite_id

  before('注册nick', function(done) {
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

        nick_access_token = res.body.access_token

        done()
      })
  })

  before('注册judy', function(done) {
    request(app)
      .post('/api/v1/users')
      .send({ username: 'judy', password: '123456' })
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        res.body.username.should.equal('judy')
        res.body.access_token.should.exist

        judy_access_token = res.body.access_token

        done()
      })
  })

  before('上传文件', function(done) {
    this.timeout(10000)
    request(app)
      .post('/api/v1/uploads/nick')
      .set('x-access-token', nick_access_token)
      .attach('upload', './test/fixtures/svg.zip')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        res.body.owner.should.equal('nick')
        res.body.upload_id.should.exist

        done()
      })
  })

  before('新建样式', function(done) {
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

  before('创建符号库', function(done) {
    this.timeout(4000)
    request(app)
      .post('/api/v1/sprites/nick')
      .set('x-access-token', nick_access_token)
      .attach('upload', './test/fixtures/svg.zip')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        res.body.owner.should.equal('nick')
        res.body.sprite_id.should.exist

        sprite_id = res.body.sprite_id

        done()
      })
  })

  before('上传字体', function(done) {
    this.timeout(6000)
    request(app)
      .post('/api/v1/fonts/nick')
      .set('x-access-token', nick_access_token)
      .attach('upload', './test/fixtures/test.ttf')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        res.body.owner.should.equal('nick')
        res.body.fontname.should.equal('Sketch Gothic School Regular')

        done()
      })
  })

  after('清理', function(done) {
    User.remove({ username: 'nick' }).exec(function() {
      Upload.remove({ owner: 'nick' }).exec(function() {
        Style.remove({ owner: 'nick' }).exec(function() {
          Sprite.remove({ owner: 'nick' }).exec(function() {
            User.remove({ username: 'judy' }).exec(function() {
              Font.remove({ owner: 'nick' }).exec(function() {
                done()
              })
            })
          })
        })
      })
    })
  })

  describe('陌生用户权限', function() {
    describe('获取用户信息', function() {
      it('获取信息成功', function(done) {
        request(app)
          .get('/api/v1/users/nick')
          .set('x-access-token', judy_access_token)
          .expect(200)
          .end(function(err, res) {
            if (err) {
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
          .expect(401, done)
      })

      it('更新失败', function(done) {
        request(app)
          .patch('/api/v1/users/nick')
          .send({ name: '张三' })
          .expect(401, done)
      })
    })

    describe('获取上传文件', function() {
      it('获取失败', function(done) {
        request(app)
          .get('/api/v1/uploads/nick')
          .set('x-access-token', judy_access_token)
          .expect(401, done)
      })
    })

    describe('获取样式', function() {
      it('获取样式列表失败', function(done) {
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

      it('获取私密样式失败', function(done) {
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

      describe('获取公开样式', function() {
        before('公开分享样式', function(done) {
          request(app)
            .patch('/api/v1/styles/nick/' + style_id)
            .set('x-access-token', nick_access_token)
            .send({ scope: 'public' })
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err)
              }

              res.body.scope.should.equal('public')

              done()
            })
        })

        it('获取成功', function(done) {
          request(app)
            .get('/api/v1/styles/nick/' + style_id)
            .set('x-access-token', judy_access_token)
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err)
              }

              res.body.style_id.should.equal(style_id)
              res.body.owner.should.equal('nick')
              should.not.exist(res.body.scopes)

              done()
            })
        })

        it('获取失败', function(done) {
          request(app)
            .get('/api/v1/styles/nick/bad_style_id')
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
      })
    })

    describe('获取符号库', function() {
      it('获取符号库列表失败', function(done) {
        request(app)
          .get('/api/v1/sprites/nick')
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

      it('获取私密符号库失败', function(done) {
        request(app)
          .get('/api/v1/sprites/nick/' + sprite_id)
          .set('x-access-token', judy_access_token)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.sprite_id.should.equal(sprite_id)
            res.body.owner.should.equal('nick')
            should.not.exist(res.body.scopes)

            done()
          })
      })

      describe('获取公开符号库', function() {
        before('公开分享符号库', function(done) {
          request(app)
            .patch('/api/v1/sprites/nick/' + sprite_id)
            .set('x-access-token', nick_access_token)
            .send({ scope: 'public' })
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err)
              }

              res.body.scope.should.equal('public')

              done()
            })
        })

        it('获取成功', function(done) {
          request(app)
            .get('/api/v1/sprites/nick/' + sprite_id)
            .set('x-access-token', judy_access_token)
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err)
              }

              res.body.sprite_id.should.equal(sprite_id)
              res.body.owner.should.equal('nick')
              should.not.exist(res.body.scopes)

              done()
            })
        })

        it('下载成功', function(done) {
          request(app)
            .get('/api/v1/sprites/nick/' + sprite_id + '/sprite@2x.json')
            .set('x-access-token', judy_access_token)
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err)
              }

              res.body.airport.pixelRatio.should.equal(2)

              done()
            })
        })

        it('获取失败', function(done) {
          request(app)
            .get('/api/v1/styles/nick/bad_style_id')
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
      })
    })

    describe('获取字体', function() {
      it('获取列表失败', function(done) {
        request(app)
          .get('/api/v1/fonts/nick')
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

      it('获取字体成功', function(done) {
        request(app)
          .get('/api/v1/fonts/nick/Sketch Gothic School Regular')
          .set('x-access-token', judy_access_token)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.owner.should.equal('nick')

            done()
          })
      })
    })
  })
})
