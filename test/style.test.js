var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Style = require('../models/style')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('样式系统',function(){
  var access_token
  var style_id 

  after('清除用户以及用户样式表信息',function(){
    User.remove({username:'nick'}).exec()
    Style.remove({owner:'nick'}).exec()
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

  it('新建样式',function(done){
    request(app)
      .post('/api/v1/styles/nick')
      .set('x-access-token',access_token)
      .send({
        'version': 8,
        'name': 'test',
        'center':[116.000000,40.000000],
        'metadata': {
          'mapbox:autocomposite': true
        },
        'sprite': 'mapbox://sprites/mapbox/satellite-v8',
        'glyphs': 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        'sources': {
          mapbox: {
            'url': 'mapbox://mapbox.mapbox-streets-v7',
            'type': 'vector'
          }
        },
        'layers': [
          {
            'id': 'background',
            'type': 'background',
            'paint': {
              'background-color': 'rgba(0,0,0,0)'
            }
          }
        ]
      })
      .expect(200)
      .end(function(err,res){ 
        if(err){
          return done(err)
        }

        res.body.owner.should.equal('nick')
        res.body.version.should.equal(8)
        res.body.name.should.equal('test')
        res.body.center.should.eql([116.000000,40.000000])
        res.body.sprite.should.equal('mapbox://sprites/mapbox/satellite-v8')
        res.body.layers[0].id.should.equal('background')

        style_id = res.body.style_id

        done()
      })
  })

  describe('获取样式列表',function(){
    it('获取用户样式列表',function(done){
      request(app)
        .get('/api/v1/styles/nick')
        .set('x-access-token',access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }
          
          res.body[0].owner.should.equal('nick')
          res.body[0].version.should.equal(8)
          res.body[0].name.should.equal('test')

          done()
        })
    })
    it('获取某个样式',function(done){
      request(app)
        .get('/api/v1/styles/nick/'+style_id)
        .set('x-access-token',access_token)
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }
          
          res.body.owner.should.equal('nick')
          res.body.version.should.equal(8)
          res.body.name.should.equal('test')
          res.body.center.should.eql([116.000000,40.000000])
          res.body.sprite.should.equal('mapbox://sprites/mapbox/satellite-v8')
          res.body.layers[0].id.should.equal('background')

          done()
        })
    })
    it('获取样式失败',function(){
      request(app)
        .get('/api/v1/styles/nick/lbhy')
        .set('x-access-token',access_token)
        .expect(404)
    })
  })

  describe('更新某个样式',function(){
    it('更新成功',function(done){
      request(app)
        .patch('/api/v1/styles/nick/'+style_id)
        .set('x-access-token',access_token)
        .send({
          'version': 8,
          'name': 'test',
          'center':[116.000001,40.000001],
          'zoom': 6,
          'metadata': {
            'mapbox:autocomposite': true
          },
          'sprite': 'mapbox://sprites/mapbox/satellite-v8',
          'glyphs': 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
          'sources': {
            mapbox: {
              'url': 'mapbox://mapbox.mapbox-streets-v7',
              'type': 'vector'
            }
          },
          'layers': [
            {
              'id': 'background',
              'type': 'background',
              'paint': {
                'background-color': 'rgba(0,0,0,0)'
              }
            }
          ]
        })
        .expect(200)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.body.zoom.should.equal(6)
          res.body.owner.should.equal('nick')
          res.body.version.should.equal(8)
          res.body.name.should.equal('test')
          res.body.center.should.eql([116.000001,40.000001])
          res.body.sprite.should.equal('mapbox://sprites/mapbox/satellite-v8')
          res.body.layers[0].id.should.equal('background')

          done()
        })
    })
    it('更新失败',function(){
      request(app)
        .patch('/api/v1/styles/nick/kdik')
        .set('x-access-token',access_token)
        .expect(404)
    })
  })

  describe('删除某个样式',function(){
    it('删除成功',function(done){
      request(app)
        .delete('/api/v1/styles/nick/'+style_id)
        .set('x-access-token',access_token)
        .expect(204)
        .end(function(err,res){
          if(err){
            return done(err)
          }

          res.should.exist

          done()
        })
    })
  })
})