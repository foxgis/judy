var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Upload = require('../models/upload')
var Sprite = require('../models/sprite')
var Group = require('../models/group')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('符号库模块', function() {

  var access_token
  var sprite_id

  before('注册用户', function(done) {
    request(app)
      .post('/api/v1/users')
      .send({ username: 'nick', password: '123456' })
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        access_token = res.body.access_token

        done()
      })
  })

  after('清除用户以及用户样式表信息', function() {
    User.remove({ username: 'nick' }).exec()
    Upload.remove({ owner: 'nick' }).exec()
    Sprite.remove({ owner: 'nick' }).exec()
  })

  describe('上传符号库文件', function() {
    it('上传成功', function(done) {
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
          res.body.upload_id.should.exist

          done()
        })
    })
  })

  describe('获取符号库列表', function() {
    it('获取成功', function(done) {
      request(app)
        .get('/api/v1/sprites/nick')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body[0].owner.should.equal('nick')
          res.body[0].sprite_id.should.exist

          sprite_id = res.body[0].sprite_id

          done()
        })
    })
  })

  describe('获取符号库', function() {
    it('获取成功', function(done) {
      request(app)
        .get('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.sprite_id.should.equal(sprite_id)

          done()
        })
    })

    it('获取失败', function() {
      request(app)
        .get('/api/v1/sprites/nick/un_existed_sprite_id')
        .set('x-access-token', access_token)
        .expect(404)
    })
  })

  describe('下载符号库', function() {
    it('@2x', function(done) {
      request(app)
        .get('/api/v1/sprites/nick/' + sprite_id + '/sprite@2x')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.london.pixelRatio.should.equal(2)

          done()
        })
    })

    it('@1x', function(done) {
      request(app)
        .get('/api/v1/sprites/nick/' + sprite_id + '/sprite')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.london.pixelRatio.should.equal(1)

          done()
        })
    })

    it('@2x.json', function(done) {
      request(app)
        .get('/api/v1/sprites/nick/' + sprite_id + '/sprite@2x.json')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.london.pixelRatio.should.equal(2)

          done()
        })
    })

    it('@1x.json', function(done) {
      request(app)
        .get('/api/v1/sprites/nick/' + sprite_id + '/sprite.json')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.london.pixelRatio.should.equal(1)

          done()
        })
    })

    it('@2x.png', function(done) {
      request(app)
        .get('/api/v1/sprites/nick/' + sprite_id + '/sprite@2x.png')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.header['content-type'].should.equal('image/png')

          done()
        })
    })

    it('@1x.png', function(done) {
      request(app)
        .get('/api/v1/sprites/nick/' + sprite_id + '/sprite.png')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.header['content-type'].should.equal('image/png')

          done()
        })
    })

    it('下载不存在的符号库', function() {
      request(app)
        .get('/api/v1/sprites/nick/un_existed_sprite_id/sprite')
        .set('x-access-token', access_token)
        .expect(404)
    })
  })

  describe('更新符号库',function(){
    it('更新符号库',function(done){
      request(app)
        .patch('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .send({ owner: 'judy', name: 'new_name' })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.name.should.equal('new_name')

          done()
        })
    })

    it('更新不存在的符号库',function(){
      request(app)
        .patch('/api/v1/sprites/nick/un_existed_sprite_id')
        .set('x-access-token', access_token)
        .send({ owner: 'judy', name: 'new_name' })
        .expect(404)
    })
  })

  describe('删除符号库', function() {
    it('删除成功', function() {
      request(app)
        .delete('/api/v1/sprites/nick/' + sprite_id)
        .set('x-access-token', access_token)
        .expect(204)
    })
  })

  describe('查看其他人的样式', function() {
    var judy_access_token

    before('注册judy', function(done){
      request(app)
      .post('/api/v1/users')
      .send({ username: 'judy', password: '123456' })
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        judy_access_token = res.body.access_token

        done()
      })
    })

    after('清理', function(){
      User.remove({ username: 'judy'}).exec()
    })

    describe('操作其他用户的私有符号库',function(){
      it('获取列表失败', function(){
        request(app)
          .get('/api/v1/sprites/nick')
          .set('x-access-token', judy_access_token)
          .expect(401)
      })

      it('获取符号库状态失败', function() {
        request(app)
          .get('/api/v1/sprites/nick/' + sprite_id)
          .set('x-access-token', judy_access_token)
          .expect(401)
      })

      it('下载失败', function(){
        request(app)
          .get('/api/v1/sprites/nick/' + sprite_id +'/sprite@2x.json')
          .set('x-access-token', judy_access_token)
          .expect(401)
      })

      it('更新失败', function(){
        request(app)
          .patch('/api/v1/sprites/nick/' + sprite_id)
          .set('x-access-token', judy_access_token)
          .send({ name: 'new_name'})
          .expect(401)
      })

      it('删除失败', function() {
        request(app)
          .delete('/api/v1/sprites/nick/' + sprite_id)
          .set('x-access-token', judy_access_token)
          .expect(401)
      })
    })

    describe('操作其他用户的公开样式', function(){
      before('公开样式', function(done){
        request(app)
          .patch('/api/v1/sprites/nick/' + sprite_id)
          .set('x-access-token', access_token)
          .send({ scopes: ['public']})
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.scopes[0].should.equal('public')

            done()
          })
      })

      it('获取列表失败', function(){
        request(app)
          .get('/api/v1/styles/nick')
          .set('x-access-token', judy_access_token)
          .expect(401)
      })

      it('获取符号库状态成功', function(done) {
        request(app)
          .get('/api/v1/sprites/nick/' + sprite_id)
          .set('x-access-token', judy_access_token)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err)
            }

            res.body.scopes[0].should.equal('public')
            res.body.sprite_id.should.equal(sprite_id)
            res.body.owner.should.equal('nick')

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

            res.body.london.pixelRatio.should.equal(2)

            done()
          })
      })

      it('更新失败', function(){
        request(app)
          .patch('/api/v1/sprites/nick/' + sprite_id)
          .set('x-access-token', judy_access_token)
          .send({ name: 'new_name'})
          .expect(401)
      })

      it('删除失败', function() {
        request(app)
          .delete('/api/v1/sprites/nick/' + sprite_id)
          .set('x-access-token', judy_access_token)
          .expect(401)
      })
    })

    describe('操作同组成员分享的样式', function(){
      var group_id

      before('创建群组',function(done){
        request(app)
          .post('/api/v1/groups/nick')
          .set('x-access-token', access_token)
          .send({ name: 'judy_nick', members: [ 'nick', 'judy']})
          .expect(200)
          .end(function(err,res){
            if (err) {
              return done(err)
            }

            res.body.admin.should.equal('nick')

            group_id = res.body.group_id

            done()
          })
      })

      after('清理', function(){
        Group.remove({ group_id: group_id}).exec()
      })

      describe('操作同组成员分享的样式', function(){
        before('分享样式到组', function(done){
          request(app)
            .patch('/api/v1/sprites/nick/' + sprite_id)
            .set('x-access-token', access_token)
            .send({ scopes: [group_id]})
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err)
              }

              res.body.scopes[0].should.equal(group_id)

              done()
            })
        })

        describe('操作同组成员分享的样式', function(){
          it('获取列表失败', function(){
            request(app)
              .get('/api/v1/sprites/nick')
              .set('x-access-token', judy_access_token)
              .expect(401)
          })

          it('获取符号库状态成功', function(done) {
            request(app)
              .get('/api/v1/sprites/nick/' + sprite_id)
              .set('x-access-token', judy_access_token)
              .expect(200)
              .end(function(err, res) {
                if (err) {
                  return done(err)
                }

                res.body.scopes[0].should.equal(group_id)
                res.body.sprite_id.should.equal(sprite_id)
                res.body.owner.should.equal('nick')

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

                res.body.london.pixelRatio.should.equal(2)

                done()
              })
          })

          it('更新失败', function(){
            request(app)
              .patch('/api/v1/sprites/nick/' + sprite_id)
              .set('x-access-token', judy_access_token)
              .send({ 'name': 'test2'})
              .expect(401)
          })

          it('删除失败', function() {
            request(app)
              .delete('/api/v1/sprites/nick/' + sprite_id)
              .set('x-access-token', judy_access_token)
              .expect(401)
          })
        })
      })
    })
  })
})
