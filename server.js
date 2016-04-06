/* 启动文件 */

/* 环境变量 */
require('dotenv').load()
var express = require('express')
var app = express()
var morgan = require('morgan')
var mongoose = require('mongoose')
var config = require('./config')
var bodyParser = require('body-parser')
var path = require('path');
var passport = require('passport')
require('./app/config/passport')

/* 使用body parser 从post请求中获取信息，并处理成json*/
// app.use(bodyParser({ keepExtensions: true, uploadDir: '/public/uploads' }));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

/* CORS 跨域处理 */
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization')
    next()
})

/* 打印所有请求信息，方便调试 */
app.use(morgan('dev'))

/* 连接数据库 */
mongoose.connect(config.database)

app.use(express.static(__dirname + '/public'))

var apiRoutes = require('./app/routes/index')

app.use(passport.initialize())

app.use('/api',apiRoutes)

app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'))
})

/* 404错误 */
app.use(function(req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

/* Access token错误 */
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.json({
      success:false,
      message: err.name + ': ' + err.message})
  }
})

app.listen(config.port)

console.log('访问' + config.port)
