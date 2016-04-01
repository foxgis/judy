/* 用户认证部分 */
var passport = require('passport')
var mongoose = require('mongoose')
var jwt = require('jsonwebtoken')
var User = require('../models/user')
var expressjwt = require('express-jwt')

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
      if(err.code === 11000 ) {
        sendJSONresponse(res,404,{
          success: false,
          message: 'Oops,该用户名已经被注册,请更换用户名'
        })
      } else {
      sendJSONresponse(res, 404, err)
      }
    } else {
      token = user.generateToken()
      sendJSONresponse(res, 200, {
        token: token
      })
    }
  })
}

module.exports.login = function(req, res) {
  if(!req.body.username || !req.body.password) {
    sendJSONresponse(res, 400, {
      message: "请输入完整信息"
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
        token: token
      })
    } else {
      sendJSONresponse(res, 401, info)
    }
  })(req, res)
}

module.exports.verify = function(req,res,next) {
  var access_token = req.body.access_token || req.query.access_token || req.headers['x-access-token']

  if(access_token) {
    jwt.verify(access_token,process.env.JWT_SECRET,function(err, decoded) {
      if(err) {
        res.status(401).send({
          success:false,
          message:'access_token无效'
        })
      } else {
        req.decoded = decoded
        console.log(req.decoded)
        next()
      }
    })
  } else {
    res.status(401).send({
      success:false,
      message:'没有access_token'
    })
  }
}
