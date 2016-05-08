var jwt = require('jsonwebtoken')
var config = require('../config')
var User = require('../models/user')
var Style = require('../models/style') 
var Upload = require('../models/upload')
var Sprite = require('../models/sprite')


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
  var resourceId = req.url.split('/')[3] // eslint-disable-line no-unused-vars
  if (resourceType === 'users') {
    if (req.user.username !== req.params.username && req.method !== 'GET') {
      return res.sendStatus(401)
    }

    return next()
  }

  /* eslint-disable no-empty */

  if (resourceType === 'uploads') {
    if (req.user.username === req.params.username) {
      return next()
    } else if (req.method !== 'GET') {
      return res.sendStatus(401)
    } else {
      if(!resourceId){
        return next()
      } else {
        Upload.findOne({
          owner: req.params.username,
          upload_id: req.params.upload_id,
          is_deleted: false
        }, function(err,upload) {
          console.log(upload.scopes[0])
          if (err) {
            return res.status(500).json({ error: err })
          } else if (!upload){
            return res.sendStatus(404)
          } else if (upload.scopes[0] === 'private') {
            return res.sendStatus(401)
          } else if (upload.scopes.indexOf('public') > -1){
            return next()
          } else {
            return res.sendStatus(401)
          }
        })
      }
    }
  }

  if (resourceType === 'styles') {
    if (req.user.username === req.params.username) {
      return next()
    } else if (req.method !== 'GET') {
      return res.sendStatus(401)
    } else {
      if(!resourceId){
        return next()
      } else {
        Style.findOne({
          owner: req.params.username,
          upload_id: req.params.upload_id,
          is_deleted: false
        }, function(err,style) {
          console.log(style.scopes[0])
          if (err) {
            return res.status(500).json({ error: err })
          } else if (!style){
            return res.sendStatus(404)
          } else if (style.scopes[0] === 'private') {
            return res.sendStatus(401)
          } else if (style.scopes.indexOf('public') > -1){
            return next()
          } else {
            return res.sendStatus(401)
          }
        })
      }
    }
  }

  if (resourceType === 'tilesets') {
    return next()
  }

  if (resourceType === 'fonts') {
    return next()
  }

  if (resourceType === 'sprites') {
    if (req.user.username === req.params.username) {
      return next()
    } else if (req.method !== 'GET') {
      return res.sendStatus(401)
    } else {
      if(!resourceId){
        return next()
      } else {
        Sprite.findOne({
          owner: req.params.username,
          upload_id: req.params.upload_id,
          is_deleted: false
        }, function(err,sprite) {
          console.log(sprite.scopes[0])
          if (err) {
            return res.status(500).json({ error: err })
          } else if (!sprite){
            return res.sendStatus(404)
          } else if (sprite.scopes[0] === 'private') {
            return res.sendStatus(401)
          } else if (sprite.scopes.indexOf('public') > -1){
            return next()
          } else {
            return res.sendStatus(401)
          }
        })
      }
    }
  }
}
