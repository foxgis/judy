var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var async = require('async')
var mongoose = require('mongoose')
var shortid = require('shortid')
var filesniffer = require('mapbox-file-sniff')
var tilelive = require('tilelive')
var Omnivore = require('tilelive-omnivore')
var tiletype = require('tiletype')
var shpFairy = require('shapefile-fairy')
var mkdirp = require('mkdirp')
var config = require('../config')
var TileSchema = require('../models/tile')
var Tileset = require('../models/tileset')
var SphericalMercator = require('sphericalmercator')
var SourceIndex = require('../models/source_index')
var pgconfig = require('../pgconfig')
var gdal = require("gdal")
var uploadResults = []

const Sequelize = require('sequelize');
var sequelize = new Sequelize(pgconfig.dbname, pgconfig.user, pgconfig.password, {
  host: pgconfig.host,
  port: pgconfig.port,
  dialect: 'postgres',
  pool: {
    max: pgconfig.max_size,
    min: 0,
    idle: 10000
  },
  logging: function(){

  }
});


//该模块包含了对瓦片集功能进行业务处理的各项函数

module.exports.list = function(req, res) {
  var query = {
    owner: req.params.username,
    is_deleted: false
  }

  if (req.user.username !== req.params.username && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    query.scope = 'public'
  }

  Tileset.find(query, 'tileset_id owner scope tags filename filesize name description \
  createdAt updatedAt', function(err, tilesets) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(tilesets)
  }).sort({ createdAt: -1 })
}


module.exports.listAll = function(req, res) {
  var query = {
    is_deleted: false
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    query.$or =
    [
        {owner: req.user.username},
        {scope: 'public'}
    ]
  }

  Tileset.find(query, 'tileset_id owner scope tags filename filesize name description \
  createdAt updatedAt', function(err, tilesets) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(tilesets)
  }).sort({ createdAt: -1 })
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

    res.json(tileset)
  })
}


module.exports.upload = function(req, res) {
  var username = req.params.username
  var filePath = req.files[0].path
  var originalname = req.files[0].originalname
  var size = req.files[0].size
  var apiUrl = req.protocol + '://' + req.headers.host + req.baseUrl

  var tileset_id = shortid.generate()

  async.autoInject({
    protocol: function(callback) {
      filesniffer.quaff(filePath, true, callback)
    },
    filetype: function(callback) {
      filesniffer.quaff(filePath, false, callback)
    },
    tilesetDir: function(protocol, callback) {
      var tilesetDir = path.join('tilesets', username)
      mkdirp(tilesetDir, function(err) {
        callback(err, tilesetDir)
      })
    },
    newPath: function(tilesetDir, callback) {
      var newPath = path.join(tilesetDir, tileset_id)
      fs.rename(filePath, newPath, function(err) {
        callback(err, path.resolve(newPath))
      })
    },
    source: function(protocol, filetype, newPath, callback) {
      if (filetype !== 'zip') {
        return callback(null, protocol + '//' + newPath)
      }

      shpFairy(newPath, function(err, shpPath) {
        return callback(err, protocol + '//' + shpPath)
      })
    },
    info: function(source, callback) {
      // 支持json格式
      if(source.slice(0,9) === 'omnivore:'){
        new Omnivore(source, function(err, source) {
          source.getInfo(function(err, info) {
            if(err){
              res.status(500).json({ error: err })
            }else{
              res.json({tileset_id:tileset_id,owner: username,success:true})
            }
            return callback(err, info)
          })
        })
      }else{
        tilelive.info(source, function(err, info) {
          if(err){
            res.status(500).json({ error: err })
          }else{
            res.json({tileset_id:tileset_id,owner: username,success:true})
          }
          return callback(err, info)
        })
      }
    },
    copy: function(source, callback) {
      var dst = 'foxgis+' + config.DB + '?tileset_id=' + tileset_id + '&owner=' + username
      var opts = {
        type: 'scanline',
        retry: 2,
        timeout: 3600000,
        close: true
      }
      tilelive.copy(source, dst, opts, callback)
    },
    writePostgis: function(protocol, source, info, callback) {
      var path = source.replace(protocol + '//', '')
      var dataset = gdal.open(path)
      var layer = dataset.layers.get(0)
      var fields = layer.fields.getNames()
      var features = layer.features;
      var options = {
        geometry: Sequelize.GEOMETRY
      }
      for(var i in fields) {
        var sequelizeType = Sequelize.STRING
        var type = layer.fields.get(fields[i]).type
        switch (type) {
          case gdal.OFTBinary:
            sequelizeType = Sequelize.STRING.BINARY
            break;
          case gdal.OFTInteger:
            sequelizeType = Sequelize.INTEGER
            break;
          case gdal.OFTString:
            sequelizeType = Sequelize.STRING
            break;
          default:
            sequelizeType = Sequelize.STRING
            break;
        }
        options[fields[i]] = sequelizeType
      }
      var DatasetModel = sequelize.define(username + '_' + tileset_id + '_' + layer.name, options, {
        freezeTableName: true, // Model 对应的表名将与model名相同
        timestamps: false
      });
      var feature
      var total = features.count()
      var n = 0
      function feature2db(feature) {
        if(!feature) {return}
        var row = feature.fields.toObject()
        var geometry = feature.getGeometry().toObject()
        row.geometry = geometry
        DatasetModel.create(row).then(function(){
          n++
          if(n === total) {
            console.log('入库完毕!')
          } else {
            feature = features.next()
            feature2db(feature)
          }
        })
      }
      
      DatasetModel.sync({force: true}).then(function () {
        feature = features.get(0)
        feature2db(feature)
        callback(null,layer.name)
      });
      
    },
    writeDB: function(info, copy, writePostgis, callback) {
      var newTileset = {
        tileset_id: tileset_id,
        owner: username,
        scope: 'private',
        is_deleted: false,
        filename: originalname,
        filesize: size,
        name: path.basename(originalname, path.extname(originalname)),
        tiles: [apiUrl + '/tilesets/' + username + '/' + tileset_id + '/{z}/{x}/{y}.' + info.format]
      }

      var keys = ['scope', 'tags', 'description', 'vector_layers']
      keys.forEach(function(key) {
        if (req.body[key]) {
          newTileset[key] = req.body[key]
        }
      })

      Tileset.findOneAndUpdate({
        tileset_id: tileset_id,
        owner: username
      }, newTileset, { upsert: true, new: true, setDefaultsOnInsert: true }, callback)

      var newSourceIndex = {
        tileset_id: tileset_id,
        owner: username,
        is_deleted: false,
        layers:{}
      }
      for(var i in info.vector_layers) {
        var t = {
          "type":"postgis",
          "srid":"3857",
          "extent":[],
          "minzoom": info.minzoom,
          "maxzoom": info.maxzoom,
          "table":"",
          "geometry_field":"geometry"
        }
        var sm = new SphericalMercator()
        t.extent = sm.convert(info.bounds, '900913')
        t.table = '(SELECT * FROM '+'public."'+username + '_' + tileset_id + '_' +writePostgis+'") as data'
        newSourceIndex.layers[info.vector_layers[i].id] = t
      }
      var sourceIndex = mongoose.model('source_index', SourceIndex, 'source_index')
      sourceIndex.findOneAndUpdate({
        tileset_id: tileset_id,
        owner: username
      }, newSourceIndex, { upsert: true, new: true, setDefaultsOnInsert: true }, function(){})
    }
  }, function(err, results) {
    fs.unlink(filePath, function() {})
    var uploadStatus = {}
    if (err) {
      uploadStatus = {
        owner: username,
        tileset_id: tileset_id,
        error:err,
        complete:'error'
      }
    }else{
      var tileset = JSON.parse(JSON.stringify(results.writeDB))
      uploadStatus = {
        owner: tileset.owner,
        tileset_id: tileset.tileset_id,
        complete:true
      }
    }
    uploadResults.push(uploadStatus)
  })
}

module.exports.getCopyStatus = function (req,res) {
  var flag = 0
  for(var i=0;i<uploadResults.length;i++){
    if(uploadResults[i].tileset_id==req.params.tileset_id&&uploadResults[i].owner==req.params.username){
      flag=1
      Tileset.findOne({
        tileset_id: req.params.tileset_id,
        owner: req.params.username
      },function(err, tileset){
        if (err) {
          return res.status(500).json({ error: err })
        }

        if (!tileset) {
          return res.status(500).json({ error: '未知错误' })
        }

        res.json({tileset:tileset,complete:true,uploadResults:uploadResults})
      })
      uploadResults.splice(i,1)
      break
    }
  }
  if(flag===0){
    res.json({tileset_id:req.params.tileset_id,complete:false})
  }

}

module.exports.update = function(req, res) {
  var filter = ['scope', 'tags', 'name', 'description', 'vector_layers']

  Tileset.findOneAndUpdate({
    tileset_id: req.params.tileset_id,
    owner: req.params.username
  }, _.pick(req.body, filter), { new: true }, function(err, tileset) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!tileset) {
      return res.sendStatus(404)
    }

    res.json(tileset)
  })
}


module.exports.delete = function(req, res) {
  Tileset.findOneAndUpdate({
    tileset_id: req.params.tileset_id,
    owner: req.params.username
  }, { is_deleted: true }, { new: true }, function(err, tileset) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!tileset) {
      return res.sendStatus(404)
    }

    res.sendStatus(204)
  })
}


module.exports.downloadTile = function(req, res) {
  var tileset_id = req.params.tileset_id
  var z = +req.params.z || 0
  var x = +req.params.x || 0
  var y = +req.params.y || 0

  var tiles = 'tiles_' + tileset_id
  var Tile = mongoose.model(tiles, TileSchema, tiles)

  Tile.findOne({
    zoom_level: z,
    tile_column: x,
    tile_row: y
  }, function(err, tile) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!tile || !tile.tile_data) {
      return res.sendStatus(404)
    }

    res.set('Expires', new Date(Date.now() + 604800000).toUTCString())
    res.set(tiletype.headers(tile.tile_data))
    res.send(tile.tile_data)
  })
}


module.exports.downloadRaw = function(req, res) {
  var filePath = path.join('tilesets', req.params.username, req.params.tileset_id)

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

    var filename = tileset.name + path.extname(tileset.filename)
    res.download(filePath, filename, function(err) {
      if (err) {
        return res.status(err.status).end()
      }
    })
  })
}
