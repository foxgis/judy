var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var async = require('async')
var AdmZip = require('adm-zip')
var spritezero = require('spritezero')
var Sprite = require('../models/sprite')


module.exports.list = function(req, res) {
  Sprite.find({
    owner: req.params.username,
    is_deleted: false
  }, '-_id -__v -is_deleted -image -json -image2x -json2x', function(err, sprites) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(sprites)
  }).sort({ updatedAt: -1 })
}


module.exports.create = function(req, res) {
  var sprite = new Sprite({
    owner: req.params.username
  })

  var imgs = []
  var zip = new AdmZip(req.files[0].path)
  zip.getEntries()
    .filter(function(entry) {
      return !entry.isDirectory && path.extname(entry.entryName) === '.svg'
    })
    .forEach(function(entry) {
      var img = {
        svg: zip.readFile(entry),
        id: path.basename(entry.entryName, path.extname(entry.entryName))
      }

      imgs.push(img)
    })

  fs.unlink(req.files[0].path)

  async.autoInject({
    layout2x: function(callback) {
      spritezero.generateLayout(imgs, 2, false, callback)
    },
    image2x: function(layout2x, callback) {
      spritezero.generateImage(layout2x, callback)
    },
    json2x: function(callback) {
      spritezero.generateLayout(imgs, 2, true, callback)
    },
    layout: function(callback) {
      spritezero.generateLayout(imgs, 1, false, callback)
    },
    image: function(layout, callback) {
      spritezero.generateImage(layout, callback)
    },
    json: function(callback) {
      spritezero.generateLayout(imgs, 1, true, callback)
    }
  }, function(err, results) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    sprite.image2x = results.image2x
    sprite.json2x = JSON.stringify(results.json2x)
    sprite.image = results.image
    sprite.json = JSON.stringify(results.json)

    sprite.save(function(err) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      return res.status(200).json(sprite)
    })
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
  var filter = ['name', 'scope']

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
    owner: req.params.username,
    sprite_id: req.params.sprite_id,
    is_deleted: false
  }, { is_deleted: true }, function(err) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.sendStatus(204)
  })
}


module.exports.download = function(req, res) {
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

    if (!req.params.format || req.params.format === 'json') {
      if (req.params.scale === '@2x') {
        var json2x = JSON.parse(sprite.json2x)
        return res.status(200).json(json2x)
      } else {
        var json = JSON.parse(sprite.json)
        return res.status(200).json(json)
      }

    } else if (req.params.format === 'png') {
      if (req.params.scale === '@2x') {
        res.attachment('sprite@2x.png')
        return res.send(sprite.image2x)
      } else {
        res.attachment('sprite.png')
        return res.send(sprite.image)
      }

    } else {
      return res.sendStatus(404)
    }
  })
}
