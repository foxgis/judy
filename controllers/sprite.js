var ImageJS = require('imagejs')
var Sprite = require('../models/sprite')
var stream = require('stream')


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
      if (!req.params.scale) {
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

            // BUG
            console.log(image.width)
            // return res.send(image)
          })
      }

      return res.send(sprite.image)
    }

    res.sendStatus(404)
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
