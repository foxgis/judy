var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var async = require('async')
var AdmZip = require('adm-zip')
var zipfile = require('zipfile')
var rd = require('rd')
var spritezero = require('spritezero')
var mkdirp = require('mkdirp')
var shortid = require('shortid')
var Sprite = require('../models/sprite')


module.exports.list = function(req, res) {
  Sprite.find({
    owner: req.params.username,
    is_deleted: false
  }, '-_id -__v -is_deleted', function(err, sprites) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(sprites)
  }).sort({ createdAt: -1 })
}


module.exports.retrieve = function(req, res) {
  Sprite.findOne({
    sprite_id: req.params.sprite_id,
    owner: req.params.username
  }, function(err, sprite) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!sprite) {
      return res.sendStatus(404)
    }

    res.json(sprite)
  })
}


module.exports.upload = function(req, res) {
  var username = req.params.username
  var filePath = req.files[0].path
  var originalname = req.files[0].originalname
  var size = req.files[0].size

  var sprite_id = shortid.generate()

  async.autoInject({
    spriteDir: function(callback) {
      var spriteDir = path.join('sprites', username, sprite_id)
      mkdirp(spriteDir, function(err) {
        callback(err, spriteDir)
      })
    },
    unzip: function(spriteDir, callback) {
      try {
        var zip = new zipfile.ZipFile(filePath)
        async.each(zip.names, function(name, next) {
          if (path.extname(name) !== '.svg') return next()
          zip.copyFile(name, path.join(spriteDir, path.basename(name)), next)
        }, callback)

      } catch (err) {
        return callback(err)
      }
    },
    writeDB: function(unzip, callback) {
      var newSprite = new Sprite({
        sprite_id: sprite_id,
        owner: username,
        name: path.basename(originalname, path.extname(originalname)),
        filename: originalname,
        filesize: size
      })

      var keys = ['scope', 'name']
      keys.forEach(function(key) {
        if (req.body[key]) {
          newSprite[key] = req.body[key]
        }
      })

      newSprite.save(function(err, sprite) {
        callback(err, sprite)
      })
    }
  }, function(err, results) {
    fs.unlink(filePath)

    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(results.writeDB)
  })
}


module.exports.uploadIcon = function(req, res) {
  var spriteDir = path.join('sprites', req.params.username, req.params.sprite_id)
  var filePath = req.files[0].path
  var originalname = req.files[0].originalname
  var icon = req.params.icon

  if (path.extname(originalname).toLowerCase() !== '.svg') {
    return res.status(400).json({ error: '仅支持svg格式的图标' })
  }

  fs.rename(filePath, path.join(spriteDir, icon + '.svg'), function(err) {
    if (err && err.code === 'ENOENT') {
      return res.sendStatus(404)
    }

    if (err) {
      return res.status(500).json({ error: err })
    }

    res.sendStatus(204)
  })
}


module.exports.update = function(req, res) {
  var filter = ['scope', 'name']

  Sprite.findOneAndUpdate({
    sprite_id: req.params.sprite_id,
    owner: req.params.username
  }, _.pick(req.body, filter), { new: true }, function(err, sprite) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!sprite) {
      return res.sendStatus(404)
    }

    res.json(sprite)
  })
}


module.exports.delete = function(req, res) {
  Sprite.findOneAndUpdate({
    sprite_id: req.params.sprite_id,
    owner: req.params.username
  }, { is_deleted: true }, { new: true }, function(err, sprite) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!sprite) {
      return res.sendStatus(404)
    }

    res.sendStatus(204)
  })
}


module.exports.deleteIcon = function(req, res) {
  var spriteDir = path.join('sprites', req.params.username, req.params.sprite_id)
  var iconPath = path.join(spriteDir, req.params.icon + '.svg')

  fs.unlink(iconPath, function(err) {
    if (err && err.code === 'ENOENT') {
      return res.sendStatus(404)
    }

    if (err) {
      return res.status(500).json({ error: err })
    }

    res.sendStatus(204)
  })
}


module.exports.download = function(req, res) {
  var scale = +(req.params.scale || '@1x').slice(1, 2)
  var format = req.params.format || 'json'
  var spriteDir = path.join('sprites', req.params.username, req.params.sprite_id)

  async.autoInject({
    files: function(callback) {
      rd.readFileFilter(spriteDir, /\.svg$/i, callback)
    },
    svgs: function(files, callback) {
      async.map(files, function(file, next) {
        fs.readFile(file, function(err, buffer) {
          if (err) return next(err)
          next(null, {
            id: path.basename(file, path.extname(file)),
            svg: buffer
          })
        })
      }, callback)
    },
    json: function(svgs, callback) {
      spritezero.generateLayout(svgs, scale, true, callback)
    },
    layout: function(svgs, callback) {
      spritezero.generateLayout(svgs, scale, false, callback)
    },
    image: function(layout, callback) {
      spritezero.generateImage(layout, callback)
    }
  }, function(err, results) {
    if (err && err.code === 'ENOENT') {
      return res.sendStatus(404)
    }

    if (err) {
      return res.status(500).json({ error: err })
    }

    switch (format) {
      case 'json':
        return res.json(results.json)
      case 'png':
        res.type('png')
        return res.send(results.image)
      default:
        return res.sendStatus(404)
    }
  })
}


module.exports.downloadRaw = function(req, res) {
  var username = req.params.username
  var sprite_id = req.params.sprite_id
  var spriteDir = path.join('sprites', username, sprite_id)

  Sprite.findOne({
    sprite_id: sprite_id,
    owner: username
  }, function(err, sprite) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!sprite) {
      return res.sendStatus(404)
    }

    var zip = new AdmZip()
    zip.addLocalFolder(spriteDir)

    res.attachment(sprite.name + '.zip')
    res.send(zip.toBuffer())
  })
}


module.exports.downloadIcon = function(req, res) {
  var spriteDir = path.join('sprites', req.params.username, req.params.sprite_id)
  var iconPath = path.join(spriteDir, req.params.icon + '.svg')

  res.sendFile(path.resolve(iconPath), function(err) {
    if (err) {
      return res.status(err.status).end()
    }
  })
}
