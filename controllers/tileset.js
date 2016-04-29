var mongoose = require('mongoose')
var _ = require('underscore')
var Tileset = require('../models/tileset')
var TileSchema = require('../models/tile')


module.exports.list = function(req, res) {
  Tileset.find({
    owner: req.params.username,
    is_deleted: false
  }, '-vector_layers', function(err, tilesets) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.status(200).json(tilesets)
  })
}


module.exports.retrieve = function(req, res) {
  Tileset.findOne({
    tileset_id: req.params.tileset_id,
    owner: req.params.username,
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
  Tileset.findOne({
    tileset_id: req.params.tileset_id,
    owner: req.params.username,
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

    if (tileset.tiles.length > 0) {
      var url = tileset.tiles[0]
        .replace(/\{z\}/i, req.params.z)
        .replace(/\{x\}/i, req.params.x)
        .replace(/\{y\}/i, req.params.y)

      res.redirect(url)
    }

    var tiles = 'tiles_' + req.params.tileset_id
    var Tile = mongoose.model(tiles, TileSchema, tiles)

    Tile.findOne({
      zoom_level: +req.params.z,
      tile_column: +req.params.x,
      tile_row: +req.params.y
    }, function(err, tile) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      if (!tile) {
        res.sendStatus(404)
        return
      }

      res.status(200).send(tile.tile_data)
    })
  })
}


module.exports.update = function(req, res) {
  var filter = ['tileset_id', 'owner', 'is_deleted', 'createdAt', 'updatedAt']

  Tileset.findOneAndUpdate({
    tileset_id: req.params.tileset_id,
    owner: req.params.username,
    is_deleted: false
  }, _.omit(req.body, filter), function(err, tileset) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.status(200).json(tileset)
  })
}


module.exports.delete = function(req, res) {
  Tileset.findOneAndUpdate({
    tileset_id: req.params.tileset_id,
    owner: req.params.username,
    is_deleted: false
  }, { is_deleted: true }, function(err) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.sendStatus(204)
  })
}
