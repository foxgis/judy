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
    Group.remove({ admin: 'judy'}).exec()
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
  })

  describe('更新群组', function(){
    it('更新成功', function(done){
      request(app)
        .patch('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', access_token)
        .send({ name: 'new_name', members: ['nick','newmember']})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.name.should.equal('new_name')
          res.body.members[1].should.equal('newmember')
          res.body.admin.should.equal('nick')

          done()
        })
    })
  })

  describe('操作其他用户的群组', function(){
    var judy_access_token

    before('注册judy', function(done){
      request(app)
        .post('/api/v1/users')
        .send({ username: 'judy', password: '123456'})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          judy_access_token = res.body.access_token

          done()
        })
    })

    after('清理', function(){
      User.remove({ username: 'judy'}).exec()
    })

    it('新建群组失败', function(){
      request(app)
        .post('/api/v1/groups/nick')
        .set('x-access-token', judy_access_token)
        .send({ name: 'zootopia'})
        .expect(401)
    })

    it('获取群组状态成功', function(done){
      request(app)
        .get('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', judy_access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.admin.should.equal('nick')
          res.body.group_id.should.equal(group_id)

          done()
        })
    })

    it('申请加入群组成功', function(done){
      request(app)
        .patch('/api/v1/groups/nick/' + group_id)
        .set('x-access-token', judy_access_token)
        .expect(200)
        .end(function(err, res){
          if (err){
            return done(err)
          }

          res.body.admin.should.equal('nick')
          res.body.applicants[0].should.equal('judy')

          done()
        })
    })

    describe('组内成员操作群组', function(){
      before('添加新成员', function(done){
        request(app)
          .patch('/api/v1/groups/nick/' + group_id)
          .set('x-access-token', access_token)
          .send({ members: ['nick','judy']})
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err)
            }

            res.body.members[1].should.equal('judy')
            res.body.admin.should.equal('nick')

            done()
          })
      })

      it('获取群组状态', function(done){
        request(app)
          .get('/api/v1/groups/nick/' + group_id)
          .set('x-access-token', judy_access_token)
          .expect(200)
          .end(function(err,res){
            if(err){
              return done(err)
            }

            res.body.admin.should.equal('nick')
            res.body.group_id.should.equal(group_id)

            done()
          })
      })

      it('转让群主', function(done){
        request(app)
          .patch('/api/v1/groups/nick/' + group_id)
          .set('x-access-token', access_token)
          .send({ admin: 'judy'})
          .expect(200)
          .end(function(err, res){
            if (err){
              return done(err)
            }

            res.body.admin.should.equal('judy')
            res.body.group_id.should.equal(group_id)
            res.body.members[0].should.equal('nick')
            res.body.members[1].should.equal('judy')

            done()
          })
      })

      it('退出群组', function(done){
        request(app)
          .patch('/api/v1/groups/judy/' + group_id)
          .set('x-access-token', access_token)
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
})