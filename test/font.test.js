var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Font = require('../models/font')
var should = require('chai').should() // eslint-disable-line no-unused-vars


describe('字体模块', function(){
  var access_token

  before('注册用户', function(done){
    request(app)
      .post('/api/v1/users')
      .send({username: 'nick', password: '123456'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        res.body.username.should.equal('nick')
        res.body.access_token.should.exist

        access_token = res.body.access_token

        done()
      })
  })

  after('清理', function(done){
    User.remove({username: 'nick'}).exec(function(){
      Font.remove({owner: 'nick'}).exec(function(){
        done()
      })
    })
  })

  describe('上传字体', function(){
    it('上传成功', function(done){
      this.timeout(6000)
      request(app)
        .post('/api/v1/fonts/nick')
        .set('x-access-token', access_token)
        .attach('aa', './test/fixtures/test.ttf')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.fontname.should.equal('Sketch Gothic School Regular')
          res.body.scope.should.equal('public')

          done()
        })
    })

    it('上传失败', function(done){
      request(app)
        .post('/api/v1/fonts/nick')
        .set('x-access-token', access_token)
        .attach('aa', './test/fixtures/china.jpg')
        .expect(400)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.error.should.equal('仅支持ttf、otf字体文件')

          done()
        })
    })
  })

  describe('获取字体列表', function(){
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/fonts/nick')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body[0].fontname.should.equal('Sketch Gothic School Regular')

          done()
        })
    })

    it('获取失败', function(done){
      request(app)
        .get('/api/v1/fonts/nick')
        .expect(401)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })
  })

  describe('获取字体状态', function(){
    it('请求成功', function(done){
      request(app)
        .get(encodeURI('/api/v1/fonts/nick/Sketch Gothic School Regular'))
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick')

          done()
        })
    })

    it('请求失败', function(done){
      request(app)
        .get(encodeURI('/api/v1/fonts/nick/unexist_font'))
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

  describe('下载字体', function(){
    it('请求成功', function(done){
      request(app)
        .get(encodeURI('/api/v1/fonts/nick/Sketch Gothic School Regular/0-255.pbf'))
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.header['content-type'].should.equal('application/octet-stream')

          done()
        })
    })

    it('请求失败', function(done){
      request(app)
        .get(encodeURI('/api/v1/fonts/foxgis/酷炫字体/0-255.pbf'))
        .set('x-access-token', access_token)
        .expect(401)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })
  })

  describe('字体设为私有', function(){
    it('修改成功', function(done){
      request(app)
        .patch(encodeURI('/api/v1/fonts/nick/Sketch Gothic School Regular'))
        .set('x-access-token', access_token)
        .send({ scope: 'private'})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.scope.should.equal('private')

          done()
        })
    })
  })

  describe('删除字体', function(){
    it('删除成功', function(done){
      request(app)
        .delete(encodeURI('/api/v1/fonts/nick/Sketch Gothic School Regular'))
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
