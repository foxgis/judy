var Sprite = require('../models/sprite')
var _ = require('lodash')
var AdmZip = require('adm-zip')
var path = require('path')
var spritezero = require('spritezero')
var fs = require('fs')


module.exports.list = function(req, res) {
  Sprite.find({
    owner: req.params.username,
    is_deleted: false
  }, '-image -json -image2x -json2x', function(err, sprites) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(sprites)
  })
}


module.exports.create = function(req, res) {
  var filter = ['owner', 'sprite_id', 'scope', 'name']
  var sprite = new Sprite({
    owner: req.params.username
  })

  var imgs = new Array
  var zip = new AdmZip(req.files[0].path)
  zip.getEntries().forEach(function(entry){
    var img = {
      svg: zip.readFile(entry),
      id: path.basename(entry.entryName, path.extname(entry.entryName))
    }

    imgs.push(img)
  })
  
  fs.unlink(req.files[0].path)

  spritezero.generateLayout(imgs, 2, false, function(err, layout2x){
    if (err) {
      return res.status(500).json({ error: err })
    }
    spritezero.generateImage(layout2x, function(err, png2x){
      if (err) {
        return res.status(500).json({ error: err })
      }

      sprite.image2x = png2x
      spritezero.generateLayout(imgs, 2, true, function(err, json2x){
        if (err) {
          return res.status(500).json({ error: err })
        }

        sprite.json2x = JSON.stringify(json2x)
        spritezero.generateLayout(imgs, 1, false, function(err, layout){
          if (err) {
            return res.status(500).json({ error: err })
          }
          spritezero.generateImage(layout, function(err, png){
            if (err) {
              return res.status(500).json({ error: err })
            }

            sprite.image = png
            spritezero.generateLayout(imgs, 1, true, function(err, json){
              if (err) {
                return res.status(500).json({ error: err })
              }

              sprite.json = JSON.stringify(json)

              sprite.save(function(err) {
                if (err) {
                  return res.status(500).json({ error: err })
                }

                return res.status(200).json(_.pick(sprite, filter))
              })
            })
          })
        }) 
      })
    })
  })
}


module.exports.retrieve = function(req, res) {
  Sprite.findOne({
    owner: req.params.username,
    sprite_id: req.params.sprite_id,
    is_deleted: false
  }, '-image -json', function(err, sprite) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!sprite) {
      return res.sendStatus(404)
    }

    if (req.user.username === req.params.username) {
      return res.status(200).json(sprite)
    }
    else {
      return res.status(200).json(sprite)
    }
  })
}


module.exports.download = function(req, res) {
  Sprite.findOne({
    sprite_id: req.params.sprite_id,
    owner: req.params.username,
    is_deleted: false
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
      }
      else {
        var json = JSON.parse(sprite.json)
        return res.status(200).json(json)
      }
    }

    if (req.params.format === 'png') {
      if (req.params.scale === '@2x') {
        res.attachment('sprite@2x.png')
        return res.send(sprite.image2x)
      }
      else {
        res.attachment('sprite.png')
        return res.send(sprite.image)
      }
    }
  })
}


module.exports.update = function(req, res) {
  var filter = ['name', 'scope']

  Sprite.findOneAndUpdate({
    sprite_id: req.params.sprite_id,
    owner: req.params.username,
    is_deleted: false
  }, _.pick(req.body, filter), { new: true }, function(err, sprite) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!sprite) {
      return res.sendStatus(404)
    }

    res.status(200).json(_.omit(sprite.toJSON(), 'image', 'json'))
  })
}


module.exports.delete = function(req, res) {
  Sprite.findOneAndUpdate({
    owner: req.params.username,
    sprite_id: req.params.sprite_id,
    is_deleted: false
  }, { is_deleted: true }, function(err) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.sendStatus(204)
  })
}
