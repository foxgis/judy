var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Upload = require('../models/upload')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('上传模块', function() {

  var access_token
  var upload_id

  before('注册用户', function(done) {
    request(app)
      .post('/api/v1/users')
      .send({ username: 'nick', password: '123456' })
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err)
        }

        User.findOneAndUpdate({ username: 'nick' }, { is_verified: true }, { new: true }, function(err) {
          if (err) {
            done()
          }
        })

        access_token = res.body.access_token

        done()
      })
  })

  after('清理', function(done) {
    User.remove({ username: 'nick' }).exec(function() {
      Upload.remove({ owner: 'nick' }).exec(function() {
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
        .post('/api/v1/uploads/nick')
        .set('x-access-token', access_token)
        .attach('upload', './test/fixtures/中国.jpg')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.name.should.equal('中国')
          res.body.format.should.equal('jpg')
          res.body.upload_id.should.exist
          should.not.exist(res.body.file_id)
          should.not.exist(res.body.is_deleted)
          should.not.exist(res.body.thumbnail)

          upload_id = res.body.upload_id

          done()
        })
    })
  })

  describe('获取上传列表', function() {
    it('获取成功', function(done) {
      request(app)
        .get('/api/v1/uploads/nick')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.forEach(function(upload) {
            upload.owner.should.equal('nick')
          })

          done()
        })
    })
  })

  describe('获取上传状态', function() {
    it('获取成功', function(done) {
      request(app)
        .get('/api/v1/uploads/nick/' + upload_id)
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.name.should.equal('中国')

          done()
        })
    })

    it('获取失败', function(done) {
      request(app)
        .get('/api/v1/uploads/nick/bad_upload_id')
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
        .get('/api/v1/uploads/nick/' + upload_id + '/file')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.header['content-type'].should.equal('image/jpeg')

          done()
        })
    })

    it('下载失败', function(done) {
      request(app)
        .get('/api/v1/uploads/nick/bad_upload_id/file')
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

  describe('修改文件', function() {
    it('修改成功', function(done) {
      this.timeout(4000)
      request(app)
        .patch('/api/v1/uploads/nick/' + upload_id)
        .set('x-access-token', access_token)
        .send({ scope: 'public', tags: ['tag1', 'tag2'], name: 'newName', description: 'desc', owner: 'judy' })
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.scope.should.equal('public')
          res.body.owner.should.equal('nick')
          res.body.tags[0].should.equal('tag1')
          res.body.name.should.equal('newName')
          res.body.description.should.equal('desc')

          done()
        })
    })

    it('修改失败', function(done) {
      request(app)
        .patch('/api/v1/uploads/nick/bad_upload_id')
        .set('x-access-token', access_token)
        .send({ tags: ['nick'] })
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

  describe('缩略图预览', function() {
    it('预览成功', function(done) {
      request(app)
        .get('/api/v1/uploads/nick/' + upload_id + '/thumbnail')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.header['content-type'].should.equal('image/jpeg')

          done()
        })
    })
  })

  describe('搜索上传文件', function() {
    it('搜索成功', function(done) {
      request(app)
        .get('/api/v1/uploads?search=tag1')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.length.should.above(0)

          done()
        })
    })
  })

  describe('统计上传文件', function() {
    it('成功', function(done) {
      request(app)
        .get('/api/v1/stats/uploads')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.length.should.above(0)

          done()
        })
    })
  })

  describe('删除文件', function() {
    after('检查是否删除', function(done) {
      request(app)
        .get('/api/v1/uploads/nick')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('删除成功', function(done) {
      request(app)
        .delete('/api/v1/uploads/nick/' + upload_id)
        .set('x-access-token', access_token)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })
  })
})
