var app = require('../app')
var request = require('supertest')


describe('POST /users', function(){
  it('respond with json', function(done){
    request(app)
      .post('/api/v1/users')
      .send({ username: 'jingsam', password: '123456'})
      .expect(200, done);
  })
})
