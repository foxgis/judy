var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Group = require('../models/group')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('群组模块', function(){
  var access_token
  var group_id

  before('注册用户', function(done){
    request(app)
      .post('/api/v1/users')
      .send({ username: 'nick', password: '123456'})
      .expect(200)
      .end(function(err,res){
        if(err){
          return done(err)
        }

        access_token = res.body.access_token

        done()
      })
  })

  after('清理', function(){
    User.remove({ username: 'nick'}).exec()
    Group.remove({ admin: 'nick'}).exec()
  })

  describe('创建群组', function(){
    it('创建成功', function(done){
      request(app)
        .post('/api/v1/groups/nick')
        .set('x-access-token', access_token)
        .send({ name: 'police'})
        .expect(200)
        .end(function(err,res){
          if (err) {
            return done(err)
          }

          res.body.admin.should.equal('nick')
          res.body.name.should.equal('police')

          group_id = res.body.group_id

          done()
        })
    })

    it ('创建失败', function(done){
      request(app)
        .post('/api/v1/groups/nick')
        .set('x-access-token', access_token)
        .send({ myname: 'nick'})
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.error.should.equal('信息不完整')

          done()
        })
    })

    it ('群组名已被占用', function(done){
      request(app)
        .post('/api/v1/groups/nick')
        .set('x-access-token', access_token)
        .send({ name: 'police'})
        .expect(400)
        .end(function(err,res){
          if (err) {
            return done(err)
          }

          res.body.error.should.equal('群组名已被占用')

          done()
        })
    })
  })

  describe('获取群组列表', function(){
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/groups/nick')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err,res){
          if (err) {
            return done(err)
          }

          res.body[0].admin.should.equal('nick')
          res.body[0].name.should.equal('police')
          res.body[0].group_id.should.equal(group_id)

          done()
        })
    })
  })

  describe('获取群组状态', function(){
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.admin.should.equal('nick')
          res.body.name.should.equal('police')
          res.body.group_id.should.equal(group_id)

          done()
        })
    })

    it('获取失败', function(done){
      request(app)
        .get('/api/v1/groups/nick/bad_group_id')
        .set('x-access-token', access_token)
        .expect(404)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })
  })

  describe('更新群组', function(){
    it('更新成功', function(done){
      request(app)
        .patch('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', access_token)
        .send({ name: 'new_name'})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.name.should.equal('new_name')
          res.body.admin.should.equal('nick')

          done()
        })
    })

    it('更新失败', function(done){
      request(app)
        .patch('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', access_token)
        .send({ bad_request: 'bad'})
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('更新失败', function(done){
      request(app)
        .patch('/api/v1/groups/nick/bad_group_id')
        .set('x-access-token', access_token)
        .send({ name: 'new_name'})
        .expect(404)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('更新失败', function(done){
      request(app)
        .patch('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', access_token)
        .send({ quit: true})
        .expect(401)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('更新失败', function(done){
      request(app)
        .patch('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', access_token)
        .send({ add: 'nick'})
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('更新失败', function(done){
      request(app)
        .patch('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', access_token)
        .send({ add: 'no_this_user'})
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('更新失败', function(done){
      request(app)
        .patch('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', access_token)
        .send({ delete: 'nick'})
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('更新失败', function(done){
      request(app)
        .patch('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', access_token)
        .send({ delete: 'not_in_members'})
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('更新失败', function(done){
      request(app)
        .patch('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', access_token)
        .send({ admin: 'not_in_members'})
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
  
  describe('删除群组', function(){
    it('删除成功', function(done){
      request(app)
        .delete('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', access_token)
        .expect(204)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })
  })
})
