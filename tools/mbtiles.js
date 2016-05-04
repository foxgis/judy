var shortid = require('shortid')
var sqlite3 = require('sqlite3').verbose()
var mongoose = require('../db')
var Tileset = require('../models/tileset')
var TileSchema = require('../models/tile')
var fs = require('fs')


module.exports = function(owner, filename, callback) {
  if (!owner) {
    return callback('Missing owner')
  }

  if (!filename) {
    return callback('Missing file')
  }

  fs.stat(filename, function(err) {
    if (err) {
      return callback(err)
    }
  })

  var tileset = new Tileset({
    owner: owner,
    tileset_id: shortid.generate()
  })

  var tiles = 'tiles_' + tileset.tileset_id
  var Tile = mongoose.model(tiles, TileSchema, tiles)

  var db = new sqlite3.Database(filename, sqlite3.OPEN_READONLY)

  db.each('SELECT * FROM metadata', function(err, row) {
    if (['filesize', 'format', 'tilejson', 'name', 'description', 'version',
        'attribution', 'template', 'legend', 'scheme', 'minzoom', 'maxzoom'
      ].indexOf(row.name) > -1 && row.value) {
      tileset[row.name] = row.value
    }

    if ((row.name === 'bounds' || row.name === 'center') && row.value) {
      tileset[row.name] = row.value.split(',')
    }

    if (row.name === 'json' && row.value) {
      tileset.vector_layers = JSON.parse(row.value).vector_layers
    }
  }, function() {
    tileset.save()
  })

  db.each('SELECT * FROM tiles', function(err, row) {
    var tile = new Tile({
      zoom_level: row.zoom_level,
      tile_column: row.tile_column,
      tile_row: row.tile_row,
      tile_data: row.tile_data
    })

    tile.save()
  })

  db.close(function() {
    callback(null, tileset.tileset_id)
  })
}
