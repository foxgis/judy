var _ = require('lodash')
var mongoose = require('mongoose')
var tiletype = require('tiletype')
var escaper = require('mongo-key-escaper')
var filesniffer = require('mapbox-file-sniff')
var tilelive = require('tilelive')
var TileSchema = require('../models/tile')
var Tileset = require('../models/tileset')
var config = require('../config')


module.exports.search = function(req, res) {
  var page = +req.query.page || 1

  Tileset.find({
    scope: 'public',
    tags: req.query.search,
    is_deleted: false
  }, '-vector_layers', function(err, tilesets) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(tilesets)

  }).limit(20).skip(20 * (page - 1))
}


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


module.exports.create = function(req, res) {
  filesniffer.quaff(req.files[0].path, true, function(err, protocol) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    var tileset = new Tileset({
      owner: req.params.username
    })

    tileset.save(function(err) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      return res.status(200).json(tileset)

      // 导入数据
      var src = protocol + req.files[0].path
      var dst = 'foxgis+' + config.db + '?tileset_id=' + tileset.tileset_id
      var report = function(stats, p) {
        tileset.progress = p.percentage
        tileset.save()
      }
      var opts = {
        type: 'scanline',
        retry: 2,
        timeout: 3600000,
        progress: report,
        close: true
      }

      tilelive.copy(src, dst, opts, function(err) {
        if (err) {
          tileset.error = err.message
          tileset.save()
        }

        fs.unlink(req.files[0].path)
      })
    })
  })
}


module.exports.retrieve = function(req, res) {
  Tileset.findOne({
    tileset_id: req.params.tileset_id,
    owner: req.params.username
  }, function(err, tileset) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!tileset) {
      return res.sendStatus(404)
    }

    res.status(200).json(escaper.unescape(tileset.toJSON()))
  })
}


module.exports.update = function(req, res) {
  var filter = ['scope', 'tags', 'name', 'description', 'vector_layers']

  Tileset.findOneAndUpdate({
    tileset_id: req.params.tileset_id,
    owner: req.params.username
  }, _.pick(escaper.escape(req.body), filter)
  , { new: true, setDefaultsOnInsert: true }
  , function(err, tileset) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!tileset) {
      return res.sendStatus(404)
    }

    res.status(200).json(escaper.unescape(tileset.toJSON()))
  })
}


module.exports.delete = function(req, res) {
  Tileset.findOneAndUpdate({
    tileset_id: req.params.tileset_id,
    owner: req.params.username
  }, { is_deleted: true }, function(err) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.sendStatus(204)
  })
}


module.exports.getTile = function(req, res) {
  Tileset.findOne({
    tileset_id: req.params.tileset_id,
    owner: req.params.username
  }, function(err, tileset) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!tileset) {
      return res.sendStatus(404)
    }

    if (req.params.format !== 'vector.pbf') {
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

      if (!tile) {
        return res.sendStatus(404)
      }

      res.set(tiletype.headers(tile.tile_data))
      return res.status(200).send(tile.tile_data)
    })
  })
}


module.exports.preview = function(req, res) {
  return res.sendStatus(200)
}
