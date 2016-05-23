var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('用户管理模块', function() {

  var access_token

  after('清除用户数据', function(done) {
    User.remove({ username: 'nick' }).exec(function(){
      done()
    })
  })

  describe('注册', function() {
    it('注册成功', function(done) {
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

          access_token = res.body.access_token

          done()
        })
    })

    it('密码长度过短', function(done) {
      request(app)
        .post('/api/v1/users')
        .send({ username: 'nick', password: '12345' })
        .expect(400)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.error.should.equal('密码长度过短')

          done()
        })
    })

    it('用户名为空', function(done) {
      request(app)
        .post('/api/v1/users')
        .send({ username: '', password: '123456' })
        .expect(400)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.error.should.equal('注册信息不完整')

          done()
        })
    })

    it('密码为空', function(done) {
      request(app)
        .post('/api/v1/users')
        .send({ username: 'nick', password: '' })
        .expect(400)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.error.should.equal('注册信息不完整')

          done()
        })
    })

    it('用户名已经被注册', function(done) {
      request(app)
        .post('/api/v1/users')
        .send({ username: 'nick', password: '123423' })
        .expect(400)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.error.should.equal('该用户名已经被注册')

          done()
        })
    })
  })

  describe('获取用户信息', function() {
    it('获取成功', function(done) {
      request(app)
        .get('/api/v1/users/nick')
        .set('x-access-token', access_token)
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
        .get('/api/v1/users/nick')
        .set('x-access-token', 'bad_access_token')
        .expect(401)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.name.should.equal('JsonWebTokenError')
          res.body.message.should.equal('jwt malformed')

          done()
        })
    })
  })

  describe('更新用户信息', function() {
    it('更新名称', function(done) {
      request(app)
        .patch('/api/v1/users/nick')
        .set('x-access-token', access_token)
        .send({ name: '张三' })
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.name.should.equal('张三')

          done()
        })
    })
  })

  describe('登录', function() {
    it('密码登录成功', function(done) {
      request(app)
        .post('/api/v1/users/nick')
        .send({password: '123456' })
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.username.should.equal('nick')
          res.body.access_token.should.exist

          done()
        })
    })

    it('密码缺失', function(done) {
      request(app)
        .post('/api/v1/users/nick')
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.error.should.equal('登录信息不完整')

          done()
        })
    })

    it('用户名或密码错误', function(done) {
      request(app)
        .post('/api/v1/users/nick')
        .send({password: '12345' })
        .expect(401)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.error.should.equal('用户名或密码错误')

          done()
        })
    })
  })
})
