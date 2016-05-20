var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Upload = require('../models/upload')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('上传模块', function() {

  var access_token
  var upload_id

  before('注册用户',function(done){
    request(app)
      .post('/api/v1/users')
      .send({ username: 'nick_up', password: '123456' })
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        access_token = res.body.access_token

        done()
      })
  })

  after('清理', function() {
    User.remove({ username: 'nick_up' }).exec()
    Upload.remove({ owner: 'nick_up' }).exec()
  })

  describe('上传文件', function() {
    it('上传成功', function(done) {
      request(app)
        .post('/api/v1/uploads/nick_up')
        .set('x-access-token', access_token)
        .attach('aa', './test/fixtures/create.txt')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.owner.should.equal('nick_up')
          res.body.name.should.equal('create.txt')
          res.body.upload_id.should.exist
          should.not.exist(res.body.file_id)
          should.not.exist(res.body.is_deleted)

          upload_id = res.body.upload_id

          done()
        })
    })
  })

  describe('获取上传列表', function() {
    it('获取成功', function(done) {
      request(app)
        .get('/api/v1/uploads/nick_up')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.forEach(function(upload) {
            upload.owner.should.equal('nick_up')
          })

          done()
        })
    })
  })

  describe('获取上传状态', function() {
    it('获取成功', function(done) {
      request(app)
        .get('/api/v1/uploads/nick_up/' + upload_id)
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.owner.should.equal('nick_up')
          res.body.name.should.equal('create.txt')

          done()
        })
    })

    it('获取失败', function(done) {
      request(app)
        .get('/api/v1/uploads/nick_up/bad_upload_id')
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

  describe('下载文件', function() {
    it('下载成功', function(done) {
      request(app)
        .get('/api/v1/uploads/nick_up/' + upload_id + '/raw')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.header['content-type'].should.equal('application/octet-stream')

          done()
        })
    })

    it('下载失败', function(done) {
      request(app)
        .get('/api/v1/uploads/nick_up/bad_upload_id/raw')
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

  describe('删除文件', function() {
    it('删除成功', function(done) {
      request(app)
        .delete('/api/v1/uploads/nick_up/' + upload_id)
        .set('x-access-token', access_token)
        .expect(204)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })
  })
})
