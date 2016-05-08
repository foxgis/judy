var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Group = require('../models/group')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('群组模块', function(){
  var access_token  // eslint-disable-line no-unused-vars
  var group_id   // eslint-disable-line no-unused-vars

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
        .send({ groupname: 'police'})
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
        .send({ name: 'new_name', members: ['nick','judy']})
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.name.should.equal('new_name')
          res.body.members[1].should.equal('judy')
          res.body.admin.should.equal('nick')

          done()
        })
    })
  })
})