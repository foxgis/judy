var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Upload = require('../models/upload')
var Style = require('../models/style')
var Sprite = require('../models/sprite')
var Group = require('../models/group')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('权限模块', function(){
  var nick6_access_token
  var judy1_access_token
  var style_id
  var sprite_id
  var group_id

  before('注册nick6', function(done){
    request(app)
      .post('/api/v1/users')
      .send({username: 'nick6', password: '123456'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.username.should.equal('nick6')
        res.body.access_token.should.exist

        nick6_access_token = res.body.access_token

        done()
      })
  })

  before('新建群组', function(done){
    request(app)
      .post('/api/v1/groups/nick6')
      .set('x-access-token', nick6_access_token)
      .send({name: 'police'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.admin.should.equal('nick6')
        res.body.group_id.should.exist

        group_id = res.body.group_id

        done()
      })
  })

  before('上传文件', function(done){
    request(app)
      .post('/api/v1/uploads/nick6')
      .set('x-access-token', nick6_access_token)
      .attach('aa', './test/fixtures/svg.zip')
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.owner.should.equal('nick6')
        res.body.upload_id.should.exist

        done()
      })
  })

  before('新建样式', function(done){
    request(app)
    .post('/api/v1/styles/nick6')
    .set('x-access-token', nick6_access_token)
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

      res.body.owner.should.equal('nick6')

      style_id = res.body.style_id

      done()
    })
  })

  before('获取符号库信息', function(done){
    request(app)
      .get('/api/v1/sprites/nick6')
      .set('x-access-token', nick6_access_token)
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body[0].owner.should.equal('nick6')

        sprite_id = res.body[0].sprite_id

        done()
      })
  })

  before('注册judy1', function(done){
    request(app)
      .post('/api/v1/users')
      .send({username: 'judy1', password: '123456'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.username.should.equal('judy1')
        res.body.access_token.should.exist

        judy1_access_token = res.body.access_token

        done()
      })
  })

  before('申请加入群组', function(done){
    request(app)
      .patch('/api/v1/groups/nick6/' + group_id)
      .set('x-access-token', judy1_access_token)
      .send({join: true})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.admin.should.equal('nick6')
        res.body.applicants[0].should.equal('judy1')

        done()
      })
  })

  before('群组添加新成员', function(done){
    request(app)
      .patch('/api/v1/groups/nick6/' + group_id)
      .set('x-access-token', nick6_access_token)
      .send({add: 'judy1'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.members[1].should.equal('judy1')
        res.body.applicants.should.be.empty

        done()
      })
  })

  after('清理', function(){
    User.remove({username: 'nick6'}).exec()
    Upload.remove({owner: 'nick6'}).exec()
    Style.remove({owner: 'nick6'}).exec()
    Sprite.remove({owner: 'nick6'}).exec()
    User.remove({username: 'judy1'}).exec()
    Group.remove({admin: 'nick6'}).exec()
    Group.remove({admin: 'judy1'}).exec()
  })

  describe('陌生用户权限', function(){
    describe('获取用户信息', function(){
      it('获取信息成功', function(done){
        request(app)
          .get('/api/v1/users/nick6')
          .expect(200)
          .end(function(err, res){
            if(err){
              return done(err)
            }

            res.body.username.should.equal('nick6')

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

            res.body.error.should.equal('没有这个用户')

            done()
          })
      })

      it('更新失败', function(done){
        request(app)
          .patch('/api/v1/users/nick6')
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
          .get('/api/v1/uploads/nick6')
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
          .get('/api/v1/styles/nick6')
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
          .get('/api/v1/styles/nick6/' + style_id)
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
            .patch('/api/v1/styles/nick6/' + style_id)
            .set('x-access-token', nick6_access_token)
            .send({scopes: ['public']})
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
            .get('/api/v1/styles/nick6/' + style_id)
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err)
              }

              res.body.style_id.should.equal(style_id)
              res.body.owner.should.equal('nick6')
              should.not.exist(res.body.scopes)

              done()
            })
        })

        it('获取失败', function(done){
          request(app)
            .get('/api/v1/styles/nick6/bad_style_id')
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
          .get('/api/v1/sprites/nick6')
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
          .get('/api/v1/sprites/nick6/' + sprite_id)
          .expect(401)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.should.be.empty

            done()
          })
      })

      describe('获取公开符号库', function(){
        before('公开分享符号库', function(done){
          request(app)
            .patch('/api/v1/sprites/nick6/' + sprite_id)
            .set('x-access-token', nick6_access_token)
            .send({scopes: ['public']})
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
            .get('/api/v1/sprites/nick6/' + sprite_id)
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err)
              }

              res.body.sprite_id.should.equal(sprite_id)
              res.body.owner.should.equal('nick6')
              should.not.exist(res.body.scopes)

              done()
            })
        })

        it('下载成功', function(done){
          request(app)
            .get('/api/v1/sprites/nick6/' + sprite_id +'/sprite@2x.json')
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
            .get('/api/v1/styles/nick6/bad_style_id')
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

  describe('游客申请加入群组', function(){
    it('操作失败', function(done){
      request(app)
        .patch('/api/v1/groups/nick6/' + group_id)
        .send({join: true})
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

  describe('同组成员权限', function(){
    before('分享样式到组', function(done){
      request(app)
        .patch('/api/v1/styles/nick6/' + style_id)
        .set('x-access-token', nick6_access_token)
        .send({scopes: [group_id]})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick6')
          res.body.scopes[0].should.equal(group_id)

          done()
        })
    })

    before('分享符号库到组', function(done){
      request(app)
        .patch('/api/v1/sprites/nick6/' + sprite_id)
        .set('x-access-token', nick6_access_token)
        .send({scopes: [group_id]})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick6')
          res.body.scopes[0].should.equal(group_id)

          done()
        })
    })

    describe('操作用户信息', function(){
      it('更新失败', function(done){
        request(app)
          .patch('/api/v1/users/nick6')
          .set('x-access-token', judy1_access_token)
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
          .get('/api/v1/uploads/nick6')
          .set('x-access-token', judy1_access_token)
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
          .get('/api/v1/styles/nick6')
          .set('x-access-token', judy1_access_token)
          .expect(401)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.should.be.empty

            done()
          })
      })

      it('获取样式成功', function(done){
        request(app)
          .get('/api/v1/styles/nick6/' + style_id)
          .set('x-access-token', judy1_access_token)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.owner.should.equal('nick6')
            should.not.exist(res.body.scopes)

            done()
          })
      })
    })

    describe('获取符号库', function(){
      it('获取符号库列表失败', function(done){
        request(app)
          .get('/api/v1/sprites/nick6')
          .set('x-access-token', judy1_access_token)
          .expect(401)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.should.be.empty

            done()
          })
      })

      it('获取符号库成功', function(done){
        request(app)
          .get('/api/v1/sprites/nick6/' + sprite_id)
          .set('x-access-token', judy1_access_token)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.owner.should.equal('nick6')
            should.not.exist(res.body.scopes)

            done()
          })
      })

      it('获取失败', function(done){
        request(app)
          .get('/api/v1/sprites/nick6/bad_sprite_id')
          .set('x-access-token', judy1_access_token)
          .expect(404)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.should.be.empty

            done()
          })
      })

      it('下载成功', function(done){
        request(app)
          .get('/api/v1/sprites/nick6/' + sprite_id +'/sprite@2x.json')
          .set('x-access-token', judy1_access_token)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.airport.pixelRatio.should.equal(2)
   
            done()
          })
      })
    })
  })
})
