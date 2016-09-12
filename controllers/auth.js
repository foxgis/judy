var jwt = require('jsonwebtoken')
var User = require('../models/user')
var Style = require('../models/style')
var Sprite = require('../models/sprite')
var Tileset = require('../models/tileset')
var Font = require('../models/font')
var File = require('../models/file')
var Upload = require('../models/upload')
var Template = require('../models/template')


//该模块对用户权限进行验证
module.exports = function(req, res, next) {
  authAccessToken(req, res, function() {
    authResource(req, res, next)
  })
}


//验证access_token的有效性，并获取用户属性添加到req对象当中（即req.user）
var authAccessToken = function(req, res, next) {
  var access_token = req.query.access_token || req.cookies.access_token ||
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


//用于验证用户的资源权限
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
    case 'files':
      return authFile(req, res, next)
    case 'uploads':
      return authUpload(req, res, next)
    case 'stats':
      return authStat(req, res, next)
    case 'templates':
      return authTemplate(req, res,next)
  }
}


//验证用户模块权限
var authUser = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /users':
      if (req.user.role === 'superadmin') {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'GET /users/:username':
    case 'GET /users/:username/avatar':
      if (req.user.username === req.params.username || req.user.role === 'admin' ||
        req.user.role === 'superadmin') {
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
    case 'PATCH /users/:username/password':
      if (req.user.username === req.params.username || req.user.role === 'superadmin') {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'DELETE /users/:username':
      if (req.user.role === 'superadmin') {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'PUT /users/:username/avatar':
      if (req.user.username === req.params.username) {
        return next()
      } else {
        return res.sendStatus(401)
      }

    default:
      return res.sendStatus(401)
  }
}


//验证样式模块权限
var authStyle = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /styles/:username':
      return next()

    case 'GET /styles/:username/:style_id':
    case 'GET /styles/:username/:style_id/:z(\\d+)/:x(\\d+)/:y(\\d+):scale(@[1-4]x)?\.:format([\\w\\.]+)':
    case 'GET /styles/:username/:style_id/thumbnail':
      if (req.user.username === req.params.username || req.user.role === 'admin' ||
        req.user.role === 'superadmin') {
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

    default:
      return res.sendStatus(401)
  }
}


//验证瓦片集模块权限
var authTileset = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /tilesets/:username':
      return next()

    case 'GET /tilesets/:username/:tileset_id':
    case 'GET /tilesets/:username/:tileset_id/:z(\\d+)/:x(\\d+)/:y(\\d+):scale(@[1-4]x)?\.:format([\\w\\.]+)':
    case 'GET /tilesets/:username/:tileset_id/raw':
      if (req.user.username === req.params.username || req.user.role === 'admin' ||
        req.user.role === 'superadmin') {
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

    default:
      return res.sendStatus(401)
  }
}


//验证字体模块权限
var authFont = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /fonts/:username':
      return next()

    case 'GET /fonts/:username/:fontname':
    case 'GET /fonts/:username/:fontname/:range.pbf':
    case 'GET /fonts/:username/:fontname/raw':
    case 'GET /fonts/:username/:fontname/thumbnail':
      if (req.user.username === req.params.username || req.user.role === 'admin' ||
        req.user.role === 'superadmin') {
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


//验证符号库模块权限
var authSprite = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /sprites/:username':
      return next()

    case 'GET /sprites/:username/:sprite_id':
    case 'GET /sprites/:username/:sprite_id/sprite:scale(@[1-4]x)?.:format([\\w\\.]+)?':
    case 'GET /sprites/:username/:sprite_id/raw':
    case 'GET /sprites/:username/:sprite_id/:icon':
      if (req.user.username === req.params.username || req.user.role === 'admin' ||
        req.user.role === 'superadmin') {
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
    case 'DELETE /sprites/:username/:sprite_id':
    case 'DELETE /sprites/:username/:sprite_id/:icon':
      if (req.user.username === req.params.username) {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'PUT /sprites/:username/:sprite_id/:icon':
    case 'PATCH /sprites/:username/:sprite_id':
      if (req.user.username === req.params.username) {
        return next()
      } else {
        Sprite.findOne({
          sprite_id: req.params.sprite_id,
          owner: req.params.username
        }, function(err ,sprite) {
          if (err) {
            return res.status(500).json({ error: err })
          }

          if (!sprite) {
            return res.sendStatus(404)
          }
        
          if (sprite.scope === 'public') {
            return next()
          } else {
            return res.sendStatus(401)
          }
        })

        return
      }
      

    default:
      return res.sendStatus(401)
  }
}


//验证文件模块权限
var authFile = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /files/stats':
    case 'GET /files/search':
      return next()

    case 'GET /files/:username':
      if (req.user.username === req.params.username || req.user.role === 'admin' ||
        req.user.role === 'superadmin') {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'GET /files/:username/:file_id':
    case 'GET /files/:username/:file_id/raw':
    case 'GET /files/:username/:file_id/thumbnail':
      if (req.user.username === req.params.username || req.user.role === 'admin' ||
        req.user.role === 'superadmin') {
        return next()
      } else {
        File.findOne({
          file_id: req.params.file_id,
          owner: req.params.username,
          scope: 'public'
        }, function(err, file) {
          if (err) {
            return res.status(500).json({ error: err })
          }

          if (!file) {
            return res.sendStatus(401)
          }

          return next()
        })

        return
      }

    case 'POST /files/:username':
    case 'PATCH /files/:username/:file_id':
    case 'DELETE /files/:username/:file_id':
      if (req.user.username === req.params.username) {
        return next()
      } else {
        return res.sendStatus(401)
      }

    default:
      return res.sendStatus(401)
  }
}


//验证上传图集模块权限
var authUpload = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /uploads/:username':
      return next()

    case 'GET /uploads/:username/:upload_id':
    case 'GET /uploads/:username/:upload_id/file':
    case 'GET /uploads/:username/:upload_id/thumbnail':
    case 'GET /uploads/:username/:upload_id/mini_thumbnail':
      if (req.user.username === req.params.username || req.user.role === 'admin' ||
        req.user.role === 'superadmin') {
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

    case 'GET /uploads/excel':
    case 'GET /uploads/:username/download':
      if (req.user.role === 'admin' || req.user.role === 'superadmin') {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'DELETE /uploads/:username':
      if (req.user.role === 'superadmin') {
        return next()
      } else {
        return res.sendStatus(401)
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


//验证统计模块权限
var authStat = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /stats/uploads':
    case 'GET /stats/userdownloads':
    case 'GET /stats/filedownloads':
    case 'GET /stats/location':
    case 'GET /stats/year':
      return next()

    default:
      return res.sendStatus(401)
  }
}


//验证模板模块权限
var authTemplate = function(req, res, next) {
  switch (req.method + ' ' + req.route.path) {
    case 'GET /templates':
      return next()

    case 'GET /templates/:username/:template_id':
    case 'GET /templates/:username/:template_id/json':
    case 'GET /templates/:username/:template_id/image':
      if (req.user.username === req.params.username || req.user.role === 'admin' ||
        req.user.role === 'superadmin') {
        return next()
      } else {
        Template.findOne({
          template_id: req.params.template_id,
          owner: req.params.username,
          scope: 'public'
        }, function(err, template) {
          if (err) {
            return res.status(500).json({ error: err })
          }

          if (!template) {
            return res.sendStatus(401)
          }

          return next()
        })

        return
      }

    case 'POST /templates/:username':
      if (req.user.username === req.params.username &&
        (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        return next()
      } else {
        return res.sendStatus(401)
      }

    case 'PATCH /templates/:username/:template_id':
    case 'PUT /templates/:username/:template_id':
    case 'DELETE /templates/:username/:template_id':
    case 'POST /templates/:username/:template_id/image':
      if (req.user.username === req.params.username ||
        req.user.role === 'admin' || req.user.role === 'superadmin') {
        return next()
      } else {
        return res.sendStatus(401)
      }

    default:
      return res.sendStatus(401)
  }
}
