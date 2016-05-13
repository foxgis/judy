var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Upload = require('../models/upload')
var Sprite = require('../models/sprite')
var Style = require('../models/style')
var Group = require('../models/group')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('分享样式模块', function(){
  var access_token
  var style_id
  var group_id
  var sprite_id

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

        access_token = res.body.access_token

        done()
      })
  })

  before('上传符号库文件', function(done){
    request(app)
      .post('/api/v1/uploads/nick')
      .set('x-access-token', access_token)
      .attach('aa', './test/fixtures/sprite.zip')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        res.body.owner.should.equal('nick')

        done()
      })
  })

  before('获取符号库信息', function(done){
    request(app)
      .get('/api/v1/sprites/nick')
      .set('x-access-token', access_token)
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body[0].owner.should.equal('nick')
        res.body[0].sprite_id.should.exist

        sprite_id = res.body[0].sprite_id

        done()
      })
  })

  before('新建样式', function(done){
    request(app)
    .post('/api/v1/styles/nick')
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

      res.body.owner.should.equal('nick')

      style_id = res.body.style_id

      done()
    })
  })

  before('新建群组', function(done){
    request(app)
      .post('/api/v1/groups/nick')
      .set('x-access-token', access_token)
      .send({ name: 'group1'})
      .expect(200)
      .end(function(err,res){
        if (err) {
          return done(err)
        }

        res.body.admin.should.equal('nick')
        res.body.name.should.equal('group1')

        group_id = res.body.group_id

        done()
      })
  })

  after('清理', function(){
    User.remove({username: 'nick'}).exec()
    Upload.remove({owner: 'nick'}).exec()
    Sprite.remove({owner: 'nick'}).exec()
    Style.remove({owner: 'nick'}).exec()
    Group.remove({admin: 'nick'}).exec()
  })

  describe('获取样式列表', function(){
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if (err) {
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.style_id.should.equal(style_id)
          res.body.scopes[0].should.equal('private')

          done()
        })
    })
  })

  describe('更新样式表', function(){
    it('更新成功', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({name: 'newname'})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.name.should.equal('newname')

          done()
        })
    })

    it('不当请求', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({name: 'newname1', share: 'public'})
        .expect(401)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('不当请求', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({name: 'newname1', unshare: 'public'})
        .expect(401)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('私密样式取消分享', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({unshare: 'public'})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('private')

          done()
        })
    })

    it('分享私密样式', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
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

    it('分享公开样式', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
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

    it('公开样式取消分享', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({unshare: 'public'})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('private')

          done()
        })
    })

    it('分享样式到群组', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({share: group_id})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal(group_id)

          done()
        })
    })

    it('分享到群组的样式公开分享', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({share: 'public'})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('public')
          res.body.scopes[1].should.equal(group_id)

          done()
        })
    })

    it('取消群组分享', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({unshare: group_id})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('public')

          done()
        })
    })

    it('取消公开样式的群组分享', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({unshare: group_id})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('public')

          done()
        })
    })

    it('公开样式分享到群组', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({share: group_id})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('public')
          res.body.scopes[1].should.equal(group_id)

          done()
        })
    })

    it('取消群组样式的公开分享', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({unshare: 'public'})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal(group_id)

          done()
        })
    })

    it('重复分享到群组', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({share: group_id})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal(group_id)

          done()
        })
    })

    it('取消群组样式的分享', function(done){
      request(app)
        .patch('/api/v1/styles/nick/' + style_id)
        .set('x-access-token', access_token)
        .send({unshare: group_id})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('private')

          done()
        })
    })
  })

  describe('更新符号库', function(){
    it('更新成功', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({name: 'new_name'})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.name.should.equal('new_name')

          done()
        })
    })

    it('不当请求', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({name: 'newname1', share: 'public'})
        .expect(401)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('不当请求', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({owner: 'judy'})
        .expect(401)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('私密样式取消分享', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({unshare: 'public'})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('private')

          done()
        })
    })

    it('分享私密样式', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
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

    it('分享公开样式', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
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

    it('公开样式取消分享', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({unshare: 'public'})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('private')

          done()
        })
    })

    it('分享样式到群组', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({share: group_id})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal(group_id)

          done()
        })
    })

    it('分享到群组的样式公开分享', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({share: 'public'})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('public')
          res.body.scopes[1].should.equal(group_id)

          done()
        })
    })

    it('取消群组分享', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({unshare: group_id})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('public')

          done()
        })
    })

    it('取消公开样式的群组分享', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({unshare: group_id})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('public')

          done()
        })
    })

    it('公开样式分享到群组', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({share: group_id})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('public')
          res.body.scopes[1].should.equal(group_id)

          done()
        })
    })

    it('取消群组样式的公开分享', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({unshare: 'public'})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal(group_id)

          done()
        })
    })

    it('重复分享到群组', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({share: group_id})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal(group_id)

          done()
        })
    })

    it('取消群组样式的分享', function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({unshare: group_id})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scopes[0].should.equal('private')

          done()
        })
    })
  })
})
