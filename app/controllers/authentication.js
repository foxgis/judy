/* 用户认证部分 */
var passport = require('passport')
var mongoose = require('mongoose')
var User = require('../models/user')

var sendJSONresponse = function(res, status, content) {
  res.status(status)
  res.json(content)
}

module.exports.register = function(req, res) {
  if(!req.body.name || !req.body.username || !req.body.password) {
    sendJSONresponse(res, 400, {
      "message": "请输入完整信息"
    })
    return
  }

  var user = new User()
  user.name = req.body.name
  user.username = req.body.username
  user.create_at = new Date()
  user.setPassword(req.body.password)

  user.save(function(err) {
    var token
    if (err) {
      sendJSONresponse(res, 404, err)
    } else {
      token = user.generateToken()
      sendJSONresponse(res, 200, {
        "token" : token
      })
    }
  })
}

module.exports.login = function(req, res) {
  if(!req.body.username || !req.body.password) {
    sendJSONresponse(res, 400, {
      "message": "请输入完整信息"
    })
    return
  }

passport.authenticate('local', function(err, user, info){
    var token

    if (err) {
      sendJSONresponse(res, 404, err)
      return
    }

    if(user) {
      token = user.generateToken()
      sendJSONresponse(res, 200, {
        "token" : token
      })
    } else {
      sendJSONresponse(res, 401, info)
    }
  })(req, res)
}

