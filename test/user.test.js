var app = require('../app')
var request = require('supertest')
var User = require('../models/user')


describe('用户系统', function() {

  after('清除用户数据', function() {
    User.remove({ username: 'jingsam' }).exec()
  })

  it('注册', function(done) {
    request(app)
      .post('/api/v1/users')
      .send({ username: 'jingsam', password: '123456' })
      .expect(200, done)
  })

  it('登录', function(done) {
    request(app)
      .post('/api/v1/users/jingsam')
      .send({ username: 'jingsam', password: '123456' })
      .expect(200, done)
  })

  it('获取用户信息', function(done) {
    request(app)
      .post('/api/v1/users/jingsam')
      .send({ username: 'jingsam', password: '123456' })
      .expect(200, done)
  })

  it('更新用户信息', function(done) {
    request(app)
      .post('/api/v1/users/jingsam')
      .send({ username: 'jingsam', password: '123456' })
      .expect(200, done)
  })

  it('获取access_token', function(done) {
    request(app)
      .post('/api/v1/users/jingsam')
      .send({ username: 'jingsam', password: '123456' })
      .expect(200, done)
  })
})
