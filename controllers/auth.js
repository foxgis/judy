var jwt = require('jsonwebtoken')
var config = require('../config')
var User = require('../models/user')


module.exports = function(req, res, next) {
  if (req.body.username && req.body.password) {
    authPassword(req, res, function() {
      authResource(req, res, next)
    })
  } else {
    authAccessToken(req, res, function() {
      authResource(req, res, next)
    })
  }
}


var authPassword = function(req, res, next) {
  if (!req.body.username || !req.body.password) {
    res.status(401).json({ error: '登录信息不完整' })
    return
  }

  User.findOne({ username: req.body.username }, function(err, user) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    if (!user || !user.validPassword(req.body.password)) {
      res.sendStatus(401)
      return
    }

    req.user = user
    next()
  })
}


var authAccessToken = function(req, res, next) {
  var access_token = req.query.access_token || req.body.access_token || 
    req.cookies.access_token || req.headers['x-access-token']
  if (!access_token) {
    res.status(401).json({ error: 'access_token缺失' })
    return
  }


  jwt.verify(access_token, config.jwt_secret, function(err, decoded) {
    if (err) {
      res.status(401).json(err)
      return
    }

    User.findOne({ username: decoded.username }, function(err, user) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      if (!user || user.access_token !== access_token) {
        res.sendStatus(401)
        return
      }

      req.user = user
      next()
    })
  })
}


var authResource = function(req, res, next) {
  var resourceType = req.url.split('/')[1]
  if (resourceType === 'users') {
    if (req.user.username !== req.params.username) {
      res.sendStatus(401)
      return
    }
  }

  /* eslint-disable no-empty */

  if (resourceType === 'uploads') {

  }

  if (resourceType === 'styles') {

  }

  if (resourceType === 'tilesets') {

  }

  if (resourceType === 'fonts') {

  }

  if (resourceType === 'sprites') {

  }

  next()
}
