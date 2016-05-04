var ImageJS = require('imagejs')
var Sprite = require('../models/sprite')


module.exports.list = function(req, res) {
  Sprite.find({
    owner: req.params.username,
    is_deleted: false
  }, function(err, sprites) {
    if (err) {
      res.status(500).json({ error: err })
      return
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
      res.status(500).json({ error: err })
      return
    }

    if (!sprite) {
      res.sendStatus(404)
      return
    }

    if (!req.params.format || req.params.format === 'json') {
      if (!req.params.scale) {
        for (var icon in sprite.json) {
          icon.width /= 2
          icon.height /= 2
          icon.x /= 2
          icon.y /= 2
          icon.pixelRatio /= 2
        }
      }

      res.status(200).json(sprite.json)
      return
    }

    if (req.params.format === 'png') {
      if (!req.params.scale) {
        var bitmap = new ImageJS.Bitmap()
        bitmap.read(sprite.image, { type: ImageJS.ImageType.PNG })
          .then(function() {
            var image = bitmap.resize({
              width: bitmap.width / 2,
              height: bitmap.height / 2,
              algorithm: 'nearestNeighbor'
            })

            res.status(200).send(image)
          })
      }

      res.status(200).send(sprite.image)
    }

    res.sendStatus(404)
  })
}
