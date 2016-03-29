/* 启动文件 */

var express = require('express')
var app = express()
var morgan = require('morgan')
var mongoose = require('mongoose')
var config = require('./config')
var bodyParser = require('body-parser')
var path = require('path');

/* 使用body parser 从post请求中获取信息，并处理成json*/
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

/* CORS 跨域处理 */
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization')
    next()
})

/* 打印所有请求信息，方便调试 */
app.use(morgan('dev'))

/* 连接数据库 */
mongoose.connect(config.database)

app.use(express.static(__dirname + '/public'));

var apiRoutes = require('./app/routes/api')(app,express)

app.use('/api',apiRoutes)

app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(config.port)

console.log('访问 ' + config.port);
