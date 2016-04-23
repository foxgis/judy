var mongoose = require('../db')
var Tileset = require('../models/tileset')
var TileSchema = require('../models/tile')
var ImageSchema = require('../models/tile')


module.exports.list = function(req, res) {
  Tileset.find({ owner: req.body.username, is_deleted: false },
    'tileset_id owner scopes filesize format create_at',
    function(err, tilesets) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      res.status(200).json(tilesets)
    }
  )
}


module.exports.retrieve = function(req, res) {
  Tileset.findOne({
    tileset_id: req.body.tileset_id,
    owner: req.body.username,
    is_deleted: false
  }, function(err, tileset) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    if (!tileset) {
      res.sendStatus(404)
      return
    }

    res.status(200).json(tileset)
  })
}


module.exports.getTile = function(req, res) {
  var tiles = 'tiles_' + req.body.tileset_id
  var images = 'images_' + req.body.tileset_id

  var Tile = mongoose.model(tiles, TileSchema, tiles)
  var Image = mongoose.model(images, ImageSchema, images)

  Tile.findOne({
    z: req.params.z,
    x: req.params.x,
    y: req.params.y
  }, function(err, tile) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    if (!tile) {
      res.sendStatus(404)
      return
    }

    Image.findOne({ tile_id: tile.tile_id }, function(err, image) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      if (!image) {
        res.sendStatus(404)
        return
      }

      res.status(200).send(image.tile_data)
    })
  })
}


module.exports.delete = function(req, res) {
  Tileset.findOneAndUpdate({
    tileset_id: req.body.tileset_id,
    owner: req.body.username,
    is_deleted: false
  }, function(err) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.sendStatus(204)
  })
}
