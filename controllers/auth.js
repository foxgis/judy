var jwt = require('jsonwebtoken')
var config = require('../config')
var User = require('../models/user')
var Style = require('../models/style')
var Sprite = require('../models/sprite')
var Tileset = require('../models/tileset')
var Font = require('../models/font')


module.exports = function(req, res, next) {
  authAccessToken(req, res, function() {
    authResource(req, res, next)
  })
}


var authAccessToken = function(req, res, next) {
  var access_token = req.query.access_token ||
    req.cookies.access_token || req.headers['x-access-token']

  if (!access_token) {
    req.user = { username: 'guest' }
    return next()
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
  var resourceUser = req.url.split('/')[2]

  if (!resourceUser) {
    return next()
  }

  if (resourceType === 'users') {
    return authUser(req, res, next)
  }

  if (resourceType === 'uploads') {
    return authUpload(req, res, next)
  }

  if (resourceType === 'styles') {
    return authStyle(req, res, next)
  }

  if (resourceType === 'tilesets') {
    return authTileset(req, res, next)
  }

  if (resourceType === 'fonts') {
    return authFonts(req, res, next)
  }

  if (resourceType === 'sprites') {
    return authSprite(req, res, next)
  }
}


var authUser = function(req, res, next) {
  if (req.method === 'PATCH' && req.user.username !== req.params.username) {
    return res.sendStatus(401)
  }

  return next()
}


var authUpload = function(req, res, next) {
  if (req.user.username === req.params.username) {
    return next()
  }

  return res.sendStatus(401)
}


var authStyle = function(req, res, next) {
  var style_id = req.url.split('/')[3]

  if (req.user.username === req.params.username) {

    return next()
  }
  else if (!style_id || req.method !== 'GET') {

    return res.sendStatus(401)
  }
  else {
    Style.findOne({
      owner: req.params.username,
      style_id: req.params.style_id,
      scope: 'public'
    }, function(err,style) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!style){
        return res.sendStatus(404)
      }

      return next()
    })
  }
}


var authTileset = function(req, res, next) {
  var tileset_id = req.url.split('/')[3]

  if (req.user.username === req.params.username) {

    return next()
  }
  else if (!tileset_id || req.method !== 'GET') {

    return res.sendStatus(401)
  }
  else {
    Tileset.findOne({
      owner: req.params.username,
      tileset_id: req.params.tileset_id,
      scope: 'public'
    }, function(err,tileset) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!tileset){
        return res.sendStatus(404)
      }

      return next()
    })
  }
}


var authFonts = function(req, res, next) {
  var fontstack = decodeURI(req.url).split('/')[3]

  if (req.user.username === req.params.username) {
    
    return next()
  }
  else if (!fontstack || req.method !== 'GET') {
    
    return res.sendStatus(401)
  }
  else {
    Font.findOne({
      owner: req.params.username,
      name: fontstack,
      scope: 'public'
    }, function(err, font) {
      if (err) {
        return res.status(500).json({ error: err})
      }

      if (!font) {
        return res.sendStatus(404)
      }

      return next()
    })
  }
}


var authSprite = function(req, res, next) {
  var sprite_id = req.url.split('/')[3]

  if (req.user.username === req.params.username) {

    return next()
  }
  else if (!sprite_id || req.method !== 'GET') {

    return res.sendStatus(401)
  }
  else {
    Sprite.findOne({
      owner: req.params.username,
      sprite_id: req.params.sprite_id,
      scope: 'public'
    }, function(err,sprite) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!sprite){
        return res.sendStatus(404)
      }

      return next()
    })
  }
}
