var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Upload = require('../models/upload')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('文件系统',function(){

  var access_token
  var upload_id

  after('清除用户文件信息', function() {
    User.remove({ username: 'nick' }).exec()
    Upload.remove({owner:'nick'}).exec()
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

  it('上传文件', function(done) {
    request(app)
        .post('/api/v1/uploads/nick')
        .set('x-access-token',access_token)
        .attach('','test/fixtures/create.txt')  //只能在judy下测试test文件夹。在test中测试，路径会报错。
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.should.contain.all.keys({owner:'nick',filename:'create.txt',filesize:4})
          res.body.should.contain.all.keys(['upload_id','upload_at'])
          res.body.should.not.contain.any.keys(['_id','file_id','is_deleted','__v'])

          upload_id = res.body.upload_id

          done()
        })
  })
  describe('获取文件列表',function(){
    it('获取成功',function(done){
      request(app)
        .get('/api/v1/uploads/nick')
        .set('x-access-token',access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body[0].should.contain.all.keys({owner:'nick',filename:'create.txt',filesize:4,upload_id:upload_id})
          res.body[0].should.contain.all.keys(['upload_at'])
          res.body.should.not.contain.any.keys(['_id','file_id','is_deleted','__v'])

          done()
        })
    })
  })
  describe('下载文件',function(){
    it('下载成功',function(done){
      request(app)
        .get('/api/v1/uploads/nick/'+upload_id)
        .set('x-access-token',access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.should.be.an('object')

          done()
        })
    })
    it('下载文件不存在',function(){
      request(app)
        .get('/api/v1/uploads/nick/test')
        .set('x-access-token',access_token)
        .expect(404)
    })
  })
  describe('删除文件',function(){
    it('删除成功',function(done){
      request(app)
        .delete('/api/v1/uploads/nick/'+upload_id)
        .set('x-access-token',access_token)
        .expect(204)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })
  })
})
