var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Upload = require('../models/upload')
var Style = require('../models/style')
var Sprite = require('../models/sprite')
var Group = require('../models/group')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('其他用户权限模块', function(){
  var nick_access_token
  var judy_access_token
  var style_id
  var sprite_id
  var group_id

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

  before('新建群组', function(done){
    request(app)
      .post('/api/v1/groups/nick')
      .set('x-access-token', nick_access_token)
      .send({name: 'police'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.admin.should.equal('nick')
        res.body.group_id.should.exist

        group_id = res.body.group_id

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
        res.body.upload_id.should.exist

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

  before('分享样式到组', function(done){
    request(app)
      .patch('/api/v1/styles/nick/' + style_id)
      .set('x-access-token', nick_access_token)
      .send({share: group_id})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.owner.should.equal('nick')
        res.body.scopes[0].should.equal(group_id)

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

  before('分享符号库到组', function(done){
    request(app)
      .patch('/api/v1/sprites/nick/' + sprite_id)
      .set('x-access-token', nick_access_token)
      .send({share: group_id})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.owner.should.equal('nick')
        res.body.scopes[0].should.equal(group_id)

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

  before('申请加入群组', function(done){
    request(app)
      .patch('/api/v1/groups/nick/' + group_id)
      .set('x-access-token', judy_access_token)
      .send({join: true})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.admin.should.equal('nick')
        res.body.applicants[0].should.equal('judy')

        done()
      })
  })

  before('群组添加新成员', function(done){
    request(app)
      .patch('/api/v1/groups/nick/' + group_id)
      .set('x-access-token', nick_access_token)
      .send({add: 'judy'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.members[1].should.equal('judy')
        res.body.applicants.should.be.empty

        done()
      })
  })

  after('清理', function(){
    User.remove({username: 'nick'}).exec()
    Upload.remove({owner: 'nick'}).exec()
    Style.remove({owner: 'nick'}).exec()
    Sprite.remove({owner: 'nick'}).exec()
    User.remove({username: 'judy'}).exec()
    Group.remove({admin: 'nick'}).exec()
    Group.remove({admin: 'judy'}).exec()
  })

  describe('操作用户信息', function(){
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

    it('获取样式成功', function(done){
      request(app)
        .get('/api/v1/styles/nick/' + style_id)
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

  describe('获取符号库', function(){
    it('获取符号库列表失败', function(done){
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

    it('获取符号库成功', function(done){
      request(app)
        .get('/api/v1/sprites/nick/' + sprite_id)
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

    it('获取失败', function(done){
      request(app)
        .get('/api/v1/sprites/nick/bad_sprite_id')
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

    it('下载成功', function(done){
      request(app)
        .get('/api/v1/sprites/nick/' + sprite_id +'/sprite@2x.json')
        .set('x-access-token', judy_access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.london.pixelRatio.should.equal(2)
 
          done()
        })
    })
  })
})
