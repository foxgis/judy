var jwt = require('jsonwebtoken')
var config = require('../config')
var User = require('../models/user')
var Style = require('../models/style')
var Sprite = require('../models/sprite')
var Tileset = require('../models/tileset')
var Font = require('../models/font')
var Upload = require('../models/upload')


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
  switch (resourceType) {
    case 'users':
      return authUser(req, res, next)
    case 'styles':
      return authStyle(req, res, next)
    case 'tilesets':
      return authTileset(req, res, next)
    case 'fonts':
      return authFont(req, res, next)
    case 'sprites':
      return authSprite(req, res, next)
    case 'uploads':
      return authUpload(req, res, next)
  }
}


var authUser = function(req, res, next) {
  if (req.method !== 'GET' && req.user.username !== req.params.username) {
    return res.sendStatus(401)
  }

  return next()
}


var authStyle = function(req, res, next) {
  if (req.user.username === req.params.username) {
    return next()

  } else if (!req.params.style_id || req.method !== 'GET') {
    return res.sendStatus(401)

  } else {
    Style.findOne({
      style_id: req.params.style_id,
      owner: req.params.username,
      scope: 'public'
    }, function(err, style) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!style) {
        return res.sendStatus(401)
      }

      return next()
    })
  }
}


var authTileset = function(req, res, next) {
  if (req.user.username === req.params.username) {
    return next()

  } else if (!req.params.tileset_id || req.method !== 'GET') {
    return res.sendStatus(401)

  } else {
    Tileset.findOne({
      tileset_id: req.params.tileset_id,
      owner: req.params.username,
      scope: 'public'
    }, function(err, tileset) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!tileset) {
        return res.sendStatus(401)
      }

      return next()
    })
  }
}


var authFont = function(req, res, next) {
  if (req.user.username === req.params.username) {
    return next()

  } else if (!req.params.fontname || req.method !== 'GET') {
    return res.sendStatus(401)

  } else {
    Font.findOne({
      fontname: req.params.fontname.split(',')[0],
      owner: req.params.username
      // scope: 'public'
    }, function(err, font) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!font) {
        return res.sendStatus(401)
      }

      return next()
    })
  }
}


var authSprite = function(req, res, next) {
  if (req.user.username === req.params.username) {
    return next()

  } else if (!req.params.username || req.method !== 'GET') {
    return res.sendStatus(401)

  } else {
    Sprite.findOne({
      sprite_id: req.params.sprite_id,
      owner: req.params.username,
      scope: 'public'
    }, function(err, sprite) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!sprite) {
        return res.sendStatus(401)
      }

      return next()
    })
  }
}


var authUpload = function(req, res, next) {
  if (req.user.username === req.params.username) {
    return next()

  } else if (!req.params.username || req.method !== 'GET') {
    return res.sendStatus(401)

  } else {
    Upload.findOne({
      upload_id: req.params.upload_id,
      owner: req.params.username,
      scope: 'public'
    }, function(err, upload) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!upload) {
        return res.sendStatus(401)
      }

      return next()
    })
  }
}
