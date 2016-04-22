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

        res.body.should.contain.all.keys({
          'owner':'nick',
          'draft':true,

          'version': 8,
          'name': 'test',
          'metadata': {
            'mapbox:autocomposite': true
          },
          'center':[116.000000,40.000000],
          'bearing': 0,
          'pitch': 0,
          'sources': {
            mapbox: {
              'url': 'mapbox://mapbox.mapbox-streets-v7',
              'type': 'vector'
            }
          },
          'sprite': 'mapbox://sprites/mapbox/satellite-v8',
          'glyphs': 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
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
        res.body.should.contain.all.keys(['style_id','create_at','modify_at'])
        res.body.should.not.contain.any.keys(['_id','__v'])

        style_id = res.body.style_id

        done()
      })
  })
  it('新建样式失败',function(){
    request(app)
      .post('/api/v1/styles/nick')
      .set('x-access-token',access_token)
      .send({
        'version': 8,
        'name': 'test',
        'center':[116.000000,40.000000]
      })
      .expect(400)
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
          
          res.body[0].should.contain.all.keys({
            'style_id':style_id,
            'owner':'nick',
            'version':8,
            'name':'test'
          })
          res.body[0].should.contain.all.keys(['create_at','modify_at'])
          res.body[0].should.not.contain.any.keys(['draft','metadata','center','zoom','bearing'
            ,'pitch','sources','sprite','glyphs','transition','layers','__v','_id'])

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
          
          res.body.should.contain.all.keys({
            'owner':'nick',
            'draft':true,

            'version': 8,
            'name': 'test',
            'metadata': {
              'mapbox:autocomposite': true
            },
            'center':[116.000000,40.000000],
            'bearing': 0,
            'pitch': 0,
            'sources': {
              mapbox: {
                'url': 'mapbox://mapbox.mapbox-streets-v7',
                'type': 'vector'
              }
            },
            'sprite': 'mapbox://sprites/mapbox/satellite-v8',
            'glyphs': 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
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
          res.body.should.contain.all.keys(['style_id','create_at','modify_at'])

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
          'transition':{'duration':3587,'delay':'8'},
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

          res.body.should.contain.all.keys({
            'owner':'nick',
            'draft':true,
 
            'version': 8,
            'name': 'test',
            'metadata': {
              'mapbox:autocomposite': true
            },
            'center':[116.000001,40.000001],
            'zoom':6,
            'bearing': 0,
            'pitch': 0,
            'sources': {
              mapbox: {
                'url': 'mapbox://mapbox.mapbox-streets-v7',
                'type': 'vector'
              }
            },
            'sprite': 'mapbox://sprites/mapbox/satellite-v8',
            'glyphs': 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
            'transition':{'duration':3587,'delay':'8'},
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
          res.body.should.contain.all.keys(['style_id','create_at','modify_at'])
          res.body.should.not.contain.any.keys(['_id','__v'])

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