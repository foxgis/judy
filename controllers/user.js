var jwt = require('jsonwebtoken')
var config = require('../config')
var User = require('../models/user')


module.exports.create = function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.status(400).send({ message: '注册信息不完整' })
    return
  }

  if (req.body.password.length < 6) {
    res.status(400).send({ message: '密码长度过短' })
    return
  }

  User.findOne({ username: username }, function(err, user) {
    if (err) {
      res.status(500).send({ message: err })
      return
    }

    if (user) {
      res.status(400).send({ message: '该用户名已经被注册' })
      return
    }

    var newUser = new User()
    newUser.username = req.body.username
    newUser.setPassword(req.body.password)
    newUser.access_tokens = [user.generateToken()]

    res.status(400).send({ token: user.generateToken() })
  })
}


module.exports.login = function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.status(400).send({ message: '登录信息不完整' })
    return
  }

  User.findOne({ username: req.body.username }, function(err, user) {
    if (err) {
      res.status(500).send({ message: err })
      return
    }

    if (!user || !user.validPassword(eq.body.password)) {
      res.status(401).send({ message: '用户名或密码错误' })
      return
    }

    res.status(200).send({ token: user.generateToken() })
  })
}


module.exports.verify = function(req, res, next) {
  var access_token = req.body.access_token || req.query.access_token || req.headers['x-access-token']

  if (!access_token) {
    res.status(401).send({ message: '没有access_token' })
  }

  jwt.verify(access_token, config.jwt_secret, function(err, decoded) {
    if (err) {
      res.status(401).send({ message: 'access_token无效' })
      return
    }

    req.decoded = decoded
    next()
  })
}


module.exports.retrieve = function(req, res) {

}


module.exports.update = function(req, res) {

}


module.exports.getToken = function(req, res) {

}
