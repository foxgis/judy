var ImageJS = require('imagejs')
var Sprite = require('../models/sprite')
var stream = require('stream')
var _ = require('lodash')


module.exports.list = function(req, res) {
  Sprite.find({
    owner: req.params.username,
    is_deleted: false
  }, '-image -json', function(err, sprites) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(sprites)
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
      return res.status(200).json(_.omit(sprite.toJSON(), 'scopes'))
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
      if (!req.params.scale) {
        for (var icon in sprite.json) {
          sprite.json[icon].width /= 2
          sprite.json[icon].height /= 2
          sprite.json[icon].x /= 2
          sprite.json[icon].y /= 2
          sprite.json[icon].pixelRatio /= 2
        }
      }

      return res.status(200).json(sprite.json)
    }

    if (req.params.format === 'png') {
      if (req.params.scale === '@2x') {
        res.attachment('sprite@2x.png')
        return res.send(sprite.image)
      } else {
        var bitmap = new ImageJS.Bitmap()
        var bufferStream = new stream.PassThrough()
        bufferStream.end(sprite.image)
        bitmap.read(bufferStream, { type: ImageJS.ImageType.PNG })
          .then(function() {
            var image = bitmap.resize({
              width: bitmap.width / 2,
              height: bitmap.height / 2,
              algorithm: 'nearestNeighbor'
            })

            res.attachment('sprite@2x.png')
            image.write(res, { type: ImageJS.ImageType.PNG })
          })
      }
    }
  })
}


module.exports.update = function(req, res) {
  var filter = ['name']

  if (!req.body.share && !req.body.unshare) {
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
  else {
    Sprite.findOne({
      owner: req.params.username,
      sprite_id: req.params.sprite_id,
      is_deleted: false
    }, function(err, sprite) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!sprite) {
        return res.sendStatus(404)
      }

      if (req.body.share === 'public') {
        if (sprite.scopes[0] === 'public') {
          return res.status(200).json(sprite)
        }
        else if (sprite.scopes[0] === 'private') {
          sprite.scopes.splice(0, 1, 'public')
        }
        else {
          sprite.scopes.splice(0, 0, 'public')
        }
      }
      else if (req.body.share && req.body.share !== 'public') {
        if (sprite.scopes.indexOf(req.body.share) > -1) {
          return res.status(200).json(sprite)
        }
        else if (sprite.scopes[0] === 'private') {
          sprite.scopes.splice(0, 1, req.body.share)
        }
        else {
          sprite.scopes.push(req.body.share)
        }
      }
      else if (req.body.unshare === 'public') {
        if (sprite.scopes[0] !== 'public') {
          return res.status(200).json(sprite)
        }
        else if (sprite.scopes.length === 1) {
          sprite.scopes = ['private']
        }
        else {
          sprite.scopes.splice(0, 1)
        }
      }
      else if (req.body.unshare && req.body.unshare !== 'public'){
        if (sprite.scopes.indexOf(req.body.unshare) < 0) {
          return res.status(200).json(sprite)
        }
        else if (sprite.scopes.length === 1) {
          sprite.scopes = ['private']
        }
        else {
          sprite.scopes.splice(sprite.scopes.indexOf(req.body.unshare), 1)
        }
      }
      else{
        return res.sendStatus(401)
      }

      sprite.save(function(err){
        if (err) {
          return res.status(500).json({ error: err})
        }

        return res.status(200).json(_.omit(sprite.toJSON(), 'image', 'json'))
      })
    })
  }
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
