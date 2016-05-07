var jwt = require('jsonwebtoken')
var config = require('../config')
var User = require('../models/user')


module.exports = function(req, res, next) {
  authAccessToken(req, res, function() {
    authResource(req, res, next)
  })
}


var authAccessToken = function(req, res, next) {
  var access_token = req.query.access_token ||
    req.cookies.access_token || req.headers['x-access-token']
  if (!access_token) {
    return res.status(401).json({ error: 'access_token缺失' })
  }


  jwt.verify(access_token, config.jwt_secret, function(err, decoded) {
    if (err) {
      return res.status(401).json(err)
    }

    User.findOne({ username: decoded.username }, function(err, user) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!user || user.access_token !== access_token) {
        return res.sendStatus(401)
      }

      req.user = user
      next()
    })
  })
}


var authResource = function(req, res, next) {
  var resourceType = req.url.split('/')[1]
  if (resourceType === 'users') {
    if (req.user.username !== req.params.username && req.method !== 'GET') {
      return res.sendStatus(401)
    }

    return next()
  }

  /* eslint-disable no-empty */

  if (resourceType === 'uploads') {
    return next()
  }

  if (resourceType === 'styles') {
    return next()
  }

  if (resourceType === 'tilesets') {
    return next()
  }

  if (resourceType === 'fonts') {
    return next()
  }

  if (resourceType === 'sprites') {
    return next()
  }

  res.sendStatus(404)
}
