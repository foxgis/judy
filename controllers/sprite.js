var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var async = require('async')
var AdmZip = require('adm-zip')
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

    res.status(200).json(sprites)
  }).sort({ createdAt: -1 })
}


module.exports.create = function(req, res) {
  var username = req.params.username
  var filePath = req.files[0].path
  var name = path.basename(req.files[0].originalname, path.extname(req.files[0].originalname))

  var sprite_id = shortid.generate()
  var spritedir = path.join('sprites', username, sprite_id)

  async.series([
    // mkdir
    function(callback) {
      mkdirp(spritedir, callback)
    },

    // unzip
    function(callback) {
      try {
        var zip = new AdmZip(filePath)
        zip.getEntries()
          .filter(function(entry) {
            return !entry.isDirectory && path.extname(entry.entryName) === '.svg'
          })
          .forEach(function(entry) {
            zip.extractEntryTo(entry, spritedir, false, true)
          })

        callback()
      } catch (err) {
        callback(err)
      }
    },

    // write to DB
    function(callback) {
      var newSprite = new Sprite({
        sprite_id: sprite_id,
        owner: username,
        name: name
      })

      newSprite.save(function(err, sprite) {
        callback(err, sprite)
      })
    }
  ], function(err, results) {
    fs.unlink(filePath)

    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(results[2])
  })
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

    res.status(200).json(sprite)
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

    res.status(200).json(sprite)
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


module.exports.download = function(req, res) {
  var scale = +(req.params.scale || '@1x').slice(1, 2)
  var format = req.params.format || 'json'
  var spritedir = path.join('sprites', req.params.username, req.params.sprite_id)

  async.autoInject({
    files: function(callback) {
      rd.readFileFilter(spritedir, /\.svg$/i, callback)
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
  var spritedir = path.join('sprites', username, sprite_id)

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
    zip.addLocalFolder(spritedir)

    res.attachment(sprite.name + '.zip')
    res.send(zip.toBuffer())
  })
}
