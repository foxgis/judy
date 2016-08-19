var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Template = require('../models/template')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('模板模块', function() {

  var access_token
  var template_id

  before('注册用户', function(done) {
    request(app)
      .post('/api/v1/users')
      .send({ username: 'nick', password: '123456' })
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        User.findOneAndUpdate({ username: 'nick' }, { is_verified: true, role: 'admin'}, { new: true }, function(err) {
          if (err) {
            done()
          }
        })

        access_token = res.body.access_token

        done()
      })
  })

  after('清理', function(done){
    User.remove({ username: 'nick'}).exec(function(){
      Template.remove({ owner: 'nick'}).exec(function(){
        done()
      })
    })
  })

  describe('上传文件', function() {
    afterEach('yes', function(done) {
      setTimeout(function() {
        done()
      }, 1000)
    })

    it('上传成功', function(done) {
      this.timeout(4000)
      request(app)
        .post('/api/v1/templates/nick')
        .set('x-access-token', access_token)
        .send({ name: '地级市行政区划图', replace: '成都市' })
        .attach('upload', './test/fixtures/admin.json')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.style.should.equal('admin.json')

          template_id = res.body.template_id

          done()
        })
    })
  })

  describe('获取模板列表', function(){
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/templates')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.length.should.above(0)

          done()
        })
    })
  })

  describe('获取模板状态', function(){
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/templates/nick/' + template_id)
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.template_id.should.equal(template_id)

          done()
        })
    })
  })

  describe('更新模板', function(){
    it('更新成功', function(done){
      request(app)
        .patch('/api/v1/templates/nick/' + template_id)
        .set('x-access-token', access_token)
        .send({ name: 'newname', replace: 'newreplace'})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.name.should.equal('newname')
          res.body.replace.should.equal('newreplace')

          done()
        })
    })
  })

  describe('获取JSON', function(){
    this.timeout(1000)
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/templates/nick/' + template_id + '/json')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.type.should.equal('application/json')

          done()
        })
    })

    it('获取失败', function(done){
      request(app)
        .get('/api/v1/templates/nick/bad_template_id/json')
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

  describe('上传图片', function(){

    afterEach('yes', function(done) {
      setTimeout(function() {
        done()
      }, 1000)
    })

    it('上传成功', function(done){
      this.timeout(2000)
      request(app)
        .post('/api/v1/templates/nick/' + template_id + '/image')
        .set('x-access-token', access_token)
        .attach('upload', './test/fixtures/中国.jpg')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }
          res.body.thumb.should.exist
          done()
        })
    })
  })

  describe('获取图片', function(){
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/templates/nick/' + template_id + '/image')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }
          res.header['content-type'].should.equal('image/jpeg')
          done()
        })
    })

    it('获取失败', function(done) {
      request(app)
        .get('/api/v1/templates/nick/bad_template_id/image')
        .set('x-access-token', access_token)
        .expect(404)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })
  })

  describe('删除模板', function(){
    it('删除成功', function(done){
      request(app)
        .delete('/api/v1/templates/nick/' + template_id)
        .set('x-access-token', access_token)
        .expect(204, done)
    })
  })

})