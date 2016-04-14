var app = require('../app')
var request = require('supertest')


describe('用户系统', function(){
  it('登录', function(done){
    request(app)
      .post('/api/v1/users/jingsam')
      .send({ username: 'jingsam', password: '123456'})
      .expect(200, done);
  })
})
