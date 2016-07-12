var express = require('express')
var compression = require('compression')
var helmet = require('helmet')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var cors = require('cors')
var tilelive = require('tilelive')
var tileliveLoader = require('tilelive-modules/loader')
var config = require('./config')
var router = require('./router')

// 连接数据库
require('./db')

var app = express()

app.set('json spaces', 2)

app.use(compression())
app.use(helmet())
app.use(cors())
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride())
app.use(cookieParser())
app.use(express.static('public'))

tileliveLoader(tilelive, config)

app.use('/api/v1', router)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res) {
    res.status(err.status || 500)
    res.json({
      error: err,
      message: err.message
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
  res.status(err.status || 500)
  res.json({
    // error: err,
    message: err.message
  })
})


module.exports = app
