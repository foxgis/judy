var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Group = require('../models/group')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('群组模块', function(){
  var access_token
  var judy_access_token
  var group_id

  before('注册用户', function(done){
    request(app)
      .post('/api/v1/users')
      .send({ username: 'nick5', password: '123456'})
      .expect(200)
      .end(function(err,res){
        if(err){
          return done(err)
        }

        access_token = res.body.access_token

        done()
      })
  })

  before('注册judy', function(done){
    request(app)
      .post('/api/v1/users')
      .send({ username: 'judy', password: '123456'})
      .expect(200)
      .end(function(err,res){
        if(err){
          return done(err)
        }

        res.body.username.should.equal('judy')
        judy_access_token = res.body.access_token

        done()
      })
  })

  after('清理', function(){
    User.remove({username: 'nick5'}).exec()
    User.remove({username: 'judy'}).exec()
    Group.remove({admin: 'nick5'}).exec()
    Group.remove({admin: 'judy'}).exec()
  })

  describe('创建群组', function(){
    it('创建成功', function(done){
      request(app)
        .post('/api/v1/groups/nick5')
        .set('x-access-token', access_token)
        .send({ name: 'police'})
        .expect(200)
        .end(function(err,res){
          if (err) {
            return done(err)
          }

          res.body.admin.should.equal('nick5')
          res.body.name.should.equal('police')

          group_id = res.body.group_id

          done()
        })
    })

    it ('群组名已被占用', function(done){
      request(app)
        .post('/api/v1/groups/nick5')
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
        .get('/api/v1/groups/nick5')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err,res){
          if (err) {
            return done(err)
          }

          res.body[0].admin.should.equal('nick5')
          res.body[0].name.should.equal('police')
          res.body[0].group_id.should.equal(group_id)

          done()
        })
    })
  })

  describe('获取群组状态', function(){
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/groups/nick5/' + group_id)
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.admin.should.equal('nick5')
          res.body.name.should.equal('police')
          res.body.group_id.should.equal(group_id)

          done()
        })
    })

    it('获取失败', function(done){
      request(app)
        .get('/api/v1/groups/nick5/bad_group_id')
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
        .patch('/api/v1/groups/nick5/' + group_id)
        .set('x-access-token', access_token)
        .send({ name: 'new_name'})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.name.should.equal('new_name')
          res.body.admin.should.equal('nick5')

          done()
        })
    })

    it('更新失败', function(done){
      request(app)
        .patch('/api/v1/groups/nick5/' + group_id)
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
        .patch('/api/v1/groups/nick5/bad_group_id')
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
        .patch('/api/v1/groups/nick5/' + group_id)
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
        .patch('/api/v1/groups/nick5/' + group_id)
        .set('x-access-token', access_token)
        .send({ add: 'nick5'})
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
        .patch('/api/v1/groups/nick5/' + group_id)
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
        .patch('/api/v1/groups/nick5/' + group_id)
        .set('x-access-token', access_token)
        .send({ delete: 'nick5'})
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
        .patch('/api/v1/groups/nick5/' + group_id)
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
        .patch('/api/v1/groups/nick5/' + group_id)
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

  describe('加入群组', function(){
    describe('申请加入', function(){
      it('申请失败', function(done){
        request(app)
          .patch('/api/v1/groups/nick5/' + group_id)
          .set('x-access-token', judy_access_token)
          .send({join: false})
          .expect(400)
          .end(function(err, res){
            if(err){
              return done(err)
            }

            res.body.should.be.empty

            done()
          })
      })

      it('申请成功', function(done){
        request(app)
          .patch('/api/v1/groups/nick5/' + group_id)
          .set('x-access-token', judy_access_token)
          .send({join: true})
          .expect(200)
          .end(function(err, res){
            if (err){
              return done(err)
            }

            res.body.admin.should.equal('nick5')
            res.body.applicants[0].should.equal('judy')

            done()
          })
      })

      it('重复申请', function(done){
        request(app)
          .patch('/api/v1/groups/nick5/' + group_id)
          .set('x-access-token', judy_access_token)
          .send({join: true})
          .expect(200)
          .end(function(err, res){
            if (err){
              return done(err)
            }

            res.body.admin.should.equal('nick5')
            res.body.group_id.should.equal(group_id)

            done()
          })
      })
    })

    describe('添加judy', function(){
      it('加入成功', function(done){
        request(app)
          .patch('/api/v1/groups/nick5/' + group_id)
          .set('x-access-token', access_token)
          .send({add: 'judy'})
          .expect(200)
          .end(function(err, res){
            if (err){
              return done(err)
            }

            res.body.admin.should.equal('nick5')
            res.body.members[1].should.equal('judy')

            done()
          })
      })
    })
  })

  describe('转移管理员身份', function(){
    it('操作成功', function(done){
      request(app)
        .patch('/api/v1/groups/nick5/' + group_id)
        .set('x-access-token', access_token)
        .send({admin: 'judy'})
        .expect(200)
        .end(function(err, res){
          if (err){
            return done(err)
          }

          res.body.admin.should.equal('judy')
          res.body.members[0].should.equal('nick5')

          done()
        })
    })
  })

  describe('退出群组', function(){
    it('退出失败', function(done){
      request(app)
        .patch('/api/v1/groups/judy/' + group_id)
        .set('x-access-token', access_token)
        .send({quit: false})
        .expect(401)
        .end(function(err, res){
          if (err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('退出成功', function(done){
      request(app)
        .patch('/api/v1/groups/judy/' + group_id)
        .set('x-access-token', access_token)
        .send({quit: true})
        .expect(200)
        .end(function(err, res){
          if (err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })
  })

  describe('删除用户', function(){
    before('申请加入', function(done){
      request(app)
        .patch('/api/v1/groups/judy/' + group_id)
        .set('x-access-token', access_token)
        .send({join: true})
        .expect(200)
        .end(function(err, res){
          if (err){
            return done(err)
          }

          res.body.admin.should.equal('judy')
          res.body.applicants[0].should.equal('nick5')

          done()
        })
    })

    describe('删除成功', function(){
      before('添加nick5', function(done){
        request(app)
          .patch('/api/v1/groups/judy/' + group_id)
          .set('x-access-token', judy_access_token)
          .send({add: 'nick5'})
          .expect(200)
          .end(function(err, res){
            if (err){
              return done(err)
            }

            res.body.admin.should.equal('judy')
            res.body.members[1].should.equal('nick5')

            done()
          })
      })

      it('删除成功', function(done){
        request(app)
          .patch('/api/v1/groups/judy/' + group_id)
          .set('x-access-token', judy_access_token)
          .send({delete: 'nick5'})
          .expect(200)
          .end(function(err, res){
            if (err){
              return done(err)
            }

            res.body.admin.should.equal('judy')
            res.body.members.length.should.equal(1)

            done()
          })
      })
    })
  })
  
  describe('删除群组', function(){
    it('删除成功', function(done){
      request(app)
        .delete('/api/v1/groups/judy/' + group_id)
        .set('x-access-token', judy_access_token)
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
