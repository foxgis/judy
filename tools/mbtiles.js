var fs = require('fs')
var shortid = require('shortid')
var sqlite3 = require('sqlite3').verbose()
var mongoose = require('mongoose')
var Tileset = require('../models/tileset')
var TileSchema = require('../models/tile')


module.exports = function(req) {
  var tileset = new Tileset({
    owner: req.user.username,
    scopes: ['private'],
    tileset_id: shortid.generate()
  })

  var tiles = 'tiles_' + tileset.tileset_id
  var Tile = mongoose.model(tiles, TileSchema, tiles)

  var db = new sqlite3.Database(req.files[0].path, sqlite3.OPEN_READONLY)

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
    req.upload.tileset_id = tileset.tileset_id
    req.upload.save()
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
    fs.unlink(req.files[0].path)
    console.log(tiles + ' imported')
  })
}
