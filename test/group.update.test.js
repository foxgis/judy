var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Group = require('../models/group')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('群组更新模块', function(){
  var nick_access_token
  var judy_access_token
  var group_id

  after('清理', function(){
    User.remove({username: 'nick'}).exec()
    User.remove({username: 'judy'}).exec()
    Group.remove({admin: 'nick'}).exec()
    Group.remove({admin: 'judy'}).exec()
  })

  describe('注册用户', function(){
    it('注册nick', function(done){
      request(app)
        .post('/api/v1/users')
        .send({ username: 'nick', password: '123456'})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.username.should.equal('nick')
          nick_access_token = res.body.access_token

          done()
        })
    })

    it('注册judy', function(done){
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
  })

  describe('群组更新', function(){
    before('新建群组', function(done){
      request(app)
        .post('/api/v1/groups/nick')
        .set('x-access-token', nick_access_token)
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
    
    describe('加入群组', function(){
      describe('申请加入', function(){
        it('申请成功', function(done){
          request(app)
            .patch('/api/v1/groups/nick/' + group_id)
            .set('x-access-token', judy_access_token)
            .send({join: true})
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

        it('重复申请', function(done){
          request(app)
            .patch('/api/v1/groups/nick/' + group_id)
            .set('x-access-token', judy_access_token)
            .send({join: true})
            .expect(200)
            .end(function(err, res){
              if (err){
                return done(err)
              }

              res.body.admin.should.equal('nick')
              res.body.group_id.should.equal(group_id)

              done()
            })
        })

        it('申请失败', function(done){
          request(app)
            .patch('/api/v1/groups/nick/' + group_id)
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
      })

      describe('加入成功', function(){
        it('添加judy', function(done){
          request(app)
            .patch('/api/v1/groups/nick/' + group_id)
            .set('x-access-token', nick_access_token)
            .send({add: 'judy'})
            .expect(200)
            .end(function(err, res){
              if (err){
                return done(err)
              }

              res.body.admin.should.equal('nick')
              res.body.members[1].should.equal('judy')

              done()
            })
        })
      }) 
    })

    describe('转移管理员身份', function(){
      it('操作成功', function(done){
        request(app)
          .patch('/api/v1/groups/nick/' + group_id)
          .set('x-access-token', nick_access_token)
          .send({admin: 'judy'})
          .expect(200)
          .end(function(err, res){
            if (err){
              return done(err)
            }

            res.body.admin.should.equal('judy')
            res.body.members[0].should.equal('nick')

            done()
          })
      })
    })

    describe('退出群组', function(){
      it('退出成功', function(done){
        request(app)
          .patch('/api/v1/groups/judy/' + group_id)
          .set('x-access-token', nick_access_token)
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
          .set('x-access-token', nick_access_token)
          .send({join: true})
          .expect(200)
          .end(function(err, res){
            if (err){
              return done(err)
            }

            res.body.admin.should.equal('judy')
            res.body.applicants[0].should.equal('nick')

            done()
          })
      })

      describe('删除成功', function(){
        before('添加nick', function(done){
          request(app)
            .patch('/api/v1/groups/judy/' + group_id)
            .set('x-access-token', judy_access_token)
            .send({add: 'nick'})
            .expect(200)
            .end(function(err, res){
              if (err){
                return done(err)
              }

              res.body.admin.should.equal('judy')
              res.body.members[1].should.equal('nick')

              done()
            })
        })

        it('删除成功', function(done){
          request(app)
            .patch('/api/v1/groups/judy/' + group_id)
            .set('x-access-token', judy_access_token)
            .send({delete: 'nick'})
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
})
