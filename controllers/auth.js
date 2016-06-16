var jwt = require('jsonwebtoken')
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
    req.cookies.access_token ||
    req.headers['x-access-token']

  if (!access_token) {
    return res.status(401).json({ error: 'access_token缺失' })
  }

  var decoded = jwt.decode(access_token, { json: true })

  User.findOne({ username: decoded.username }, function(err, user) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!user) {
      return res.status(401).json({ error: '用户不存在' })
    }

    if (!user.is_verified) {
      return res.status(401).json({ error: '用户未认证' })
    }

    jwt.verify(access_token, user.salt, function(err) {
      if (err) {
        return res.status(401).json({ error: err })
      }

      req.user = user
      next()
    })
  })
}


var authResource = function(req, res, next) {
  var resourceType = req.route.path.split('/')[1]
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
    case 'stats':
      return authStat(req, res, next)
  }
}


var authUser = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /users/:username':
      if (req.user.username === req.params.username || req.user.role === 'admin') {
        return next()
      } else {
        User.findOne({
          username: req.params.username,
          scope: 'public'
        }, function(err, user) {
          if (err) {
            return res.status(500).json({ error: err })
          }

          if (!user) {
            return res.sendStatus(401)
          }

          return next()
        })

        return
      }

    case 'PATCH /users/:username':
      if (req.user.username === req.params.username) {
        return next()
      } else {
        return res.sendStatus(401)
      }

    default:
      return res.sendStatus(401)
  }
}


var authStyle = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /styles/:username':
      if (req.user.username === req.params.username || req.user.role === 'admin') {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'GET /styles/:username/:style_id':
      if (req.user.username === req.params.username || req.user.role === 'admin') {
        return next()
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

        return
      }

    case 'POST /styles/:username':
    case 'PATCH /styles/:username/:style_id':
    case 'DELETE /styles/:username/:style_id':
      if (req.user.username === req.params.username) {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'GET /styles':
      return next()

    default:
      return res.sendStatus(401)
  }
}


var authTileset = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /tilesets/:username':
      if (req.user.username === req.params.username || req.user.role === 'admin') {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'GET /tilesets/:username/:tileset_id':
    case 'GET /tilesets/:username/:tileset_id/:z(\\d+)/:x(\\d+)/:y(\\d+):scale(@[2]x)?\.:format([\\w\\.]+)':
      if (req.user.username === req.params.username || req.user.role === 'admin') {
        return next()
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

        return
      }

    case 'POST /tilesets/:username':
    case 'PATCH /tilesets/:username/:tileset_id':
    case 'DELETE /tilesets/:username/:tileset_id':
      if (req.user.username === req.params.username) {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'GET /tilesets':
      return next()

    default:
      return res.sendStatus(401)
  }
}


var authFont = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /fonts/:username':
      if (req.user.username === req.params.username || req.user.role === 'admin') {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'GET /fonts/:username/:fontname':
    case 'GET /fonts/:username/:fontname/:range.pbf':
    case 'GET /fonts/:username/:fontname/raw':
    case 'GET /fonts/:username/:fontname/:color:scale(@[2]x)?':
      if (req.user.username === req.params.username || req.user.role === 'admin') {
        return next()
      } else {
        Font.findOne({
          fontname: req.params.fontname,
          owner: req.params.username,
          scope: 'public'
        }, function(err, font) {
          if (err) {
            return res.status(500).json({ error: err })
          }

          if (!font) {
            return res.sendStatus(401)
          }

          return next()
        })

        return
      }

    case 'POST /fonts/:username':
    case 'PATCH /fonts/:username/:fontname':
    case 'DELETE /fonts/:username/:fontname':
      if (req.user.username === req.params.username) {
        return next()
      } else {
        return res.sendStatus(401)
      }

    default:
      return res.sendStatus(401)
  }
}


var authSprite = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /sprites/:username':
      if (req.user.username === req.params.username || req.user.role === 'admin') {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'GET /sprites/:username/:sprite_id':
    case 'GET /sprites/:username/:sprite_id/sprite:scale(@[2]x)?.:format([\\w\\.]+)?':
      if (req.user.username === req.params.username || req.user.role === 'admin') {
        return next()
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

        return
      }

    case 'POST /sprites/:username':
    case 'PATCH /sprites/:username/:sprite_id':
    case 'DELETE /sprites/:username/:sprite_id':
      if (req.user.username === req.params.username) {
        return next()
      } else {
        return res.sendStatus(401)
      }

    default:
      return res.sendStatus(401)
  }
}


var authUpload = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /uploads/:username':
      if (req.user.username === req.params.username || req.user.role === 'admin') {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'GET /uploads/:username/:upload_id':
    case 'GET /uploads/:username/:upload_id/file':
    case 'GET /uploads/:username/:upload_id/thumbnail':
    case 'GET /uploads/:username/:upload_id/mini_thumbnail':
      if (req.user.username === req.params.username || req.user.role === 'admin') {
        return next()
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

        return
      }

    case 'POST /uploads/:username':
    case 'PATCH /uploads/:username/:upload_id':
    case 'DELETE /uploads/:username/:upload_id':
      if (req.user.username === req.params.username) {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'GET /uploads':
      return next()

    default:
      return res.sendStatus(401)
  }
}


var authStat = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /stats/uploads':
      return next()

    default:
      return res.sendStatus(401)
  }
}
