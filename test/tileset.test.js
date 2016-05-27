var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Tileset = require('../models/tileset')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('瓦片集模块', function(){
  var access_token
  var tileset_id

  before('注册用户', function(done){
    request(app)
      .post('/api/v1/users')
      .send({ username: 'nick', password: '123456'})
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
    User.remove({ username: 'nick'}).exec(function(){
      Tileset.remove({ owner: 'nick'}).exec(function(){
        done()
      })
    })
  })

  describe('上传瓦片集', function(){
    afterEach('yes', function(done){
      this.timeout(4100)
      setTimeout(function(){
        done()
      },4000)
    })

    it('上传成功', function(done){
      this.timeout(4000)
      request(app)
        .post('/api/v1/tilesets/nick')
        .set('x-access-token', access_token)
        .attach('upload', './test/fixtures/beijing.mbtiles')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.scheme.should.equal('xyz')
          res.body.tileset_id.should.exist

          tileset_id = res.body.tileset_id

          done()
        })
    })
  })

  describe('获取用户瓦片集列表', function(){
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/tilesets/nick')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body[0].owner.should.equal('nick')
          res.body[0].name.should.equal('Open Streets')

          done()
        })
    })
  })

  describe('获取瓦片集状态', function(){
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/tilesets/nick/' + tileset_id)
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.name.should.equal('Open Streets')

          done()
        })
    })
  })

  describe('更新瓦片集', function(){
    it('更新成功', function(done){
      request(app)
        .patch('/api/v1/tilesets/nick/' + tileset_id)
        .set('x-access-token', access_token)
        .send({ name: 'newname', scope: 'public', tags: ['nick']})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.name.should.equal('newname')
          res.body.scope.should.equal('public')
          res.body.tags[0].should.equal('nick')

          done()
        })
    })
  })

  describe('瓦片集搜索', function(){
    it('搜索成功', function(done){
      request(app)
        .get('/api/v1/tilesets?search=nick&page=1')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body[0].owner.should.equal('nick')
          res.body[0].name.should.equal('newname')
          res.body[0].scope.should.equal('public')
          res.body[0].tags[0].should.equal('nick')

          done()
        })
    })
  })

  describe('获取瓦片', function(){
    this.timeout(6000)
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/tilesets/nick/' + tileset_id + '/6/52/24.vector.pbf')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.type.should.equal('application/x-protobuf')

          done()
        })
    })
  })

  describe('删除瓦片集', function(){
    after('检查是否删除', function(done){
      request(app)
        .get('/api/v1/tilesets/nick')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.should.be.empty

          done()
        })
    })

    it('删除成功', function(done){
      request(app)
        .delete('/api/v1/tilesets/nick/' + tileset_id)
        .set('x-access-token', access_token)
        .expect(204, done)
    })
  })
})
