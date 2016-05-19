var _ = require('lodash')
var Tileset = require('../models/tileset')
var tilelive = require('tilelive')
var TileSchema = require('../models/tile')
var mongoose = require('mongoose')
var tiletype = require('tiletype')


module.exports.list = function(req, res) {
  Tileset.find({
    owner: req.params.username,
    is_deleted: false
  }, '-vector_layers', function(err, tilesets) {
    if (err) {
      return res.status(500).json({ error: err })
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
      return res.status(500).json({ error: err })
    }

    if (!tileset) {
      return res.sendStatus(404)
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
      return res.status(500).json({ error: err })
    }

    if (!tileset || req.params.format !== tileset.format) {
      return res.sendStatus(404)
    }

    var tiles = 'tiles_' + req.params.tileset_id
    var Tile = mongoose.Model(tiles, TileSchema, tiles)

    Tile.findOne({
      zoom_level: +req.params.z,
      tile_column: +req.params.x,
      tile_row: +req.params.y
    }, function(err, tile) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (tile && tile.tile_data) {
        res.set(tiletype.headers(tile.tile_data))
        return res.status(200).send(tile)
      }

      if (!tileset.uri) {
        return res.sendStatus(404)
      }

      // try to load tile from external resource
      tilelive.load(tileset.uri, function(err, source) {
        if (err) {
          return res.status(500).json({ error: err })
        }

        source.getTile(+req.params.z, +req.params.x, +req.params.y,
          function(err, data, headers) {
            if (err) {
              return res.status(500).json({ error: err })
            }

            if (!data) {
              return res.sendStatus(404)
            }

            res.set(headers)
            res.status(200).send(tile)

            if (source.close) {
              source.close()
            }

            // cache into database
            var tile = new Tile({
              zoom_level: +req.params.z,
              tile_column: +req.params.x,
              tile_row: +req.params.y,
              tile_data: data
            })

            tile.save(function(err) {
              if (err) {
                console.log(err)
              }
            })
          })
      })
    })
  })
}


module.exports.preview = function(req, res) {
  return res.sendStatus(200)
}


module.exports.update = function(req, res) {
  var filter = ['tileset_id', 'owner', 'is_deleted', 'uri', 'createdAt', 'updatedAt']

  Tileset.findOneAndUpdate({
    tileset_id: req.params.tileset_id,
    owner: req.params.username,
    is_deleted: false
  }, _.omit(req.body, filter), function(err, tileset) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!tileset) {
      return res.sendStatus(404)
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
