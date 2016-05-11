// var app = require('../app')
// var request = require('supertest')
// var User = require('../models/user')
// var Style = require('../models/style')
// var Group = require('../models/group')
// var should = require('chai').should() // eslint-disable-line no-unused-vars

// describe('样式管理模块', function() {

//   var access_token
//   var style_id

//   before('注册用户', function(done) {
//     request(app)
//       .post('/api/v1/users')
//       .send({ username: 'nick', password: '123456' })
//       .expect(200)
//       .end(function(err, res) {
//         if (err) {
//           return done(err)
//         }

//         access_token = res.body.access_token

//         done()
//       })
//   })

//   after('清理', function() {
//     User.remove({ username: 'nick' }).exec()
//     Style.remove({ owner: 'nick' }).exec()
//   })

//   describe('新建样式', function() {
//     it('新建成功', function(done) {
//       request(app)
//         .post('/api/v1/styles/nick')
//         .set('x-access-token', access_token)
//         .send({
//           'version': 8,
//           'name': 'test',
//           'center': [116.000000, 40.000000],
//           'metadata': {
//             'mapbox:autocomposite': true
//           },
//           'sprite': 'mapbox://sprites/mapbox/satellite-v8',
//           'glyphs': 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
//           'sources': {
//             'mapbox': {
//               'url': 'mapbox://mapbox.mapbox-streets-v7',
//               'type': 'vector'
//             }
//           },
//           'layers': [{
//             'id': 'background',
//             'type': 'background',
//             'paint': {
//               'background-color': 'rgba(0,0,0,0)'
//             }
//           }]
//         })
//         .expect(200)
//         .end(function(err, res) {
//           if (err) {
//             return done(err)
//           }

//           res.body.owner.should.equal('nick')
//           res.body.style_id.should.exist

//           style_id = res.body.style_id

//           done()
//         })
//     })

//     it('不合法的样式', function() {
//       request(app)
//         .post('/api/v1/styles/nick')
//         .set('x-access-token', access_token)
//         .send({
//           'version': 8,
//           'name': 'test',
//           'center': [116.000000, 40.000000]
//         })
//         .expect(400)
//     })
//   })

//   describe('获取样式列表', function() {
//     it('获取成功', function(done) {
//       request(app)
//         .get('/api/v1/styles/nick')
//         .set('x-access-token', access_token)
//         .expect(200)
//         .end(function(err, res) {
//           if (err) {
//             return done(err)
//           }

//           res.body[0].style_id.should.equal(style_id)
//           res.body[0].owner.should.equal('nick')

//           done()
//         })
//     })
//   })

//   describe('获取某个样式', function() {
//     it('获取成功', function(done) {
//       request(app)
//         .get('/api/v1/styles/nick/' + style_id)
//         .set('x-access-token', access_token)
//         .expect(200)
//         .end(function(err, res) {
//           if (err) {
//             return done(err)
//           }

//           res.body.scopes[0].should.equal('private')
//           res.body.style_id.should.equal(style_id)
//           res.body.owner.should.equal('nick')

//           done()
//         })
//     })

//     it('获取不存在的样式', function() {
//       request(app)
//         .get('/api/v1/styles/nick/lbhy')
//         .set('x-access-token', access_token)
//         .expect(404)
//     })
//   })

//   describe('更新样式', function() {
//     it('更新成功', function(done) {
//       request(app)
//         .patch('/api/v1/styles/nick/' + style_id)
//         .set('x-access-token', access_token)
//         .send({
//           'style_id': 'abcd',
//           'owner': 'judy',
//           'name': 'test2',
//           'center': [50.000000, 40.000000],
//           'layers': [{
//             'paint': {
//               'background-color': 'rgba(1,1,1,1)'
//             }
//           }]
//         })
//         .expect(200)
//         .end(function(err, res) {
//           if (err) {
//             return done(err)
//           }

//           res.body.style_id.should.equal(style_id)
//           res.body.scopes[0].should.equal('private')
//           res.body.owner.should.equal('nick')
//           res.body.name.should.equal('test2')
//           res.body.center[0].should.equal(50)
//           res.body.layers[0].paint['background-color'].should.equal('rgba(1,1,1,1)')

//           done()
//         })
//     })

//     it('更新不存在的样式', function() {
//       request(app)
//         .patch('/api/v1/styles/nick/kdik')
//         .set('x-access-token', access_token)
//         .expect(404)
//     })
//   })

//   describe('删除样式', function() {
//     it('删除成功', function() {
//       request(app)
//         .delete('/api/v1/styles/nick/' + style_id)
//         .set('x-access-token', access_token)
//         .expect(204)
//     })
//   })

//   describe('查看其他用户的样式', function() {
//     var judy_access_token

//     before('注册judy', function(done){
//       request(app)
//         .post('/api/v1/users')
//         .send({ username: 'judy', password: '123456' })
//         .expect(200)
//         .end(function(err, res) {
//           if (err) {
//             return done(err)
//           }

//           judy_access_token = res.body.access_token

//           done()
//         })
//     })

//     after('清理', function(){
//       User.remove({ username: 'judy'}).exec()
//     })

//     describe('操作其他用户的私有样式',function(){
//       it('新建失败', function() {
//         request(app)
//           .post('/api/v1/styles/nick')
//           .set('x-access-token', judy_access_token)
//           .send({ 'name': 'test'})
//           .expect(401)
//       })

//       it('获取列表失败', function(){
//         request(app)
//           .get('/api/v1/styles/nick')
//           .set('x-access-token', judy_access_token)
//           .expect(401)
//       })

//       it('获取样式失败', function() {
//         request(app)
//           .get('/api/v1/styles/nick/' + style_id)
//           .set('x-access-token', judy_access_token)
//           .expect(401)
//       })

//       it('更新失败', function(){
//         request(app)
//           .patch('/api/v1/styles/nick/' + style_id)
//           .set('x-access-token', judy_access_token)
//           .send({ 'name': 'test2'})
//           .expect(401)
//       })

//       it('删除失败', function() {
//         request(app)
//           .delete('/api/v1/styles/nick/' + style_id)
//           .set('x-access-token', judy_access_token)
//           .expect(401)
//       })
//     })

//     describe('操作其他用户的公开样式', function(){
//       before('公开样式', function(done){
//         request(app)
//           .patch('/api/v1/styles/nick/' + style_id)
//           .set('x-access-token', access_token)
//           .send({ scopes: ['public']})
//           .expect(200)
//           .end(function(err, res) {
//             if (err) {
//               return done(err)
//             }

//             res.body.scopes[0].should.equal('public')

//             done()
//           })
//       })

//       it('新建失败', function() {
//         request(app)
//           .post('/api/v1/styles/nick')
//           .set('x-access-token', judy_access_token)
//           .send({ 'name': 'test'})
//           .expect(401)
//       })

//       it('获取列表失败', function(){
//         request(app)
//           .get('/api/v1/styles/nick')
//           .set('x-access-token', judy_access_token)
//           .expect(401)
//       })

//       it('获取样式成功', function(done) {
//         request(app)
//           .get('/api/v1/styles/nick/' + style_id)
//           .set('x-access-token', judy_access_token)
//           .expect(200)
//           .end(function(err, res) {
//             if (err) {
//               return done(err)
//             }

//             res.body.scopes[0].should.equal('public')
//             res.body.style_id.should.equal(style_id)
//             res.body.owner.should.equal('nick')

//             done()
//           })
//       })

//       it('更新失败', function(){
//         request(app)
//           .patch('/api/v1/styles/nick/' + style_id)
//           .set('x-access-token', judy_access_token)
//           .send({ 'name': 'test2'})
//           .expect(401)
//       })

//       it('删除失败', function() {
//         request(app)
//           .delete('/api/v1/styles/nick/' + style_id)
//           .set('x-access-token', judy_access_token)
//           .expect(401)
//       })
//     })

//     describe('操作同组成员分享的样式', function(){
//       var group_id

//       before('创建群组',function(done){
//         request(app)
//           .post('/api/v1/groups/nick')
//           .set('x-access-token', access_token)
//           .send({ name: 'judy_nick', members:['nick', 'judy']})
//           .expect(200)
//           .end(function(err,res){
//             if (err) {
//               return done(err)
//             }

//             res.body.admin.should.equal('nick')

//             group_id = res.body.group_id

//             done()
//           })
//       })

//       after('清理', function(){
//         Group.remove({ group_id: group_id}).exec()
//       })

//       describe('操作同组成员分享的样式', function(){
//         before('分享样式到组', function(done){
//           request(app)
//             .patch('/api/v1/styles/nick/' + style_id)
//             .set('x-access-token', access_token)
//             .send({ scopes: [group_id]})
//             .expect(200)
//             .end(function(err, res) {
//               if (err) {
//                 return done(err)
//               }

//               res.body.scopes[0].should.equal(group_id)

//               done()
//             })
//         })

//         describe('操作同组成员分享的样式', function(){
//           it('新建失败', function() {
//             request(app)
//               .post('/api/v1/styles/nick')
//               .set('x-access-token', judy_access_token)
//               .send({ 'name': 'test'})
//               .expect(401)
//           })

//           it('获取列表失败', function(){
//             request(app)
//               .get('/api/v1/styles/nick')
//               .set('x-access-token', judy_access_token)
//               .expect(401)
//           })

//           it('获取样式成功', function(done) {
//             request(app)
//               .get('/api/v1/styles/nick/' + style_id)
//               .set('x-access-token', judy_access_token)
//               .expect(200)
//               .end(function(err, res) {
//                 if (err) {
//                   return done(err)
//                 }

//                 res.body.scopes[0].should.equal(group_id)
//                 res.body.style_id.should.equal(style_id)
//                 res.body.owner.should.equal('nick')

//                 done()
//               })
//           })

//           it('更新失败', function(){
//             request(app)
//               .patch('/api/v1/styles/nick/' + style_id)
//               .set('x-access-token', judy_access_token)
//               .send({ 'name': 'test2'})
//               .expect(401)
//           })

//           it('删除失败', function() {
//             request(app)
//               .delete('/api/v1/styles/nick/' + style_id)
//               .set('x-access-token', judy_access_token)
//               .expect(401)
//           })
//         })
//       })
//     })
//   })
// })
