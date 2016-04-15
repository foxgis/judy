var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var should = require('chai').should()


describe('用户系统', function() {

  var access_token

  after('清除用户数据', function() {
    User.remove({ username: 'nick' }).exec()
  })

  it('注册', function(done) {
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

  it('获取用户信息', function(done) {
    request(app)
      .get('/api/v1/users/nick')
      .set('x-access-token', access_token)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        res.body.username.should.equal('nick')
        res.body.access_token.should.equal(access_token)

        done()
      })
  })

  it('更新用户信息', function(done) {
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

  it('登录', function(done) {
    request(app)
      .post('/api/v1/users/nick')
      .send({ username: 'nick', password: '123456' })
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

  it('获取access_token', function(done) {
    request(app)
      .get('/api/v1/users/nick/access_token')
      .set('x-access-token', access_token)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        res.body.access_token.should.exist

        done()
      })
  })
})
