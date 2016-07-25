var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var validate = require('mapbox-gl-style-spec').validate
var escaper = require('mongo-key-escaper')
var abaculus = require('abaculus')
var gl2xml = require('mapbox-gl-json-to-mapnik-xml')
var async = require('async')
var tilelive = require('tilelive')
  // var mbgl = require('mapbox-gl-native')
  // var sharp = require('sharp')
  // var request = require('request')
var SphericalMercator = require('sphericalmercator')
var mime = require('mime')
var mapnik = require('mapnik')
var url = require('url')
var Style = require('../models/style')



module.exports.list = function(req, res) {
  Style.find({
    owner: req.params.username,
    is_deleted: false
  }, 'style_id owner scope tags description version name createdAt updatedAt', function(err, styles) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(styles)
  }).sort({ createdAt: -1 })
}


module.exports.retrieve = function(req, res) {
  Style.findOne({
    style_id: req.params.style_id,
    owner: req.params.username
  }, function(err, style) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!style) {
      return res.sendStatus(404)
    }

    res.json(escaper.unescape(style.toJSON()))
  })
}


module.exports.create = function(req, res) {
  var errors = validate(req.body)
  if (errors.length > 0) {
    return res.status(400).json(errors)
  }

  var filter = ['_id', '__v', 'is_deleted', 'style_id', 'owner', 'createdAt', 'updatedAt']
  var style = _.omit(escaper.escape(req.body), filter)

  var newStyle = new Style(style)
  newStyle.owner = req.params.username

  newStyle.save(function(err, style) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(escaper.unescape(style.toJSON()))
  })
}


module.exports.update = function(req, res) {
  var filter = ['_id', '__v', 'is_deleted', 'style_id', 'owner', 'createdAt', 'updatedAt']

  Style.findOneAndUpdate({
    style_id: req.params.style_id,
    owner: req.params.username
  }, _.omit(escaper.escape(req.body), filter), { new: true }, function(err, style) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!style) {
      return res.sendStatus(404)
    }

    res.json(escaper.unescape(style.toJSON()))
  })
}


module.exports.delete = function(req, res) {
  Style.findOneAndUpdate({
    style_id: req.params.style_id,
    owner: req.params.username
  }, { is_deleted: true }, { new: true }, function(err, style) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!style) {
      return res.sendStatus(404)
    }

    res.sendStatus(204)
  })
}


module.exports.downloadTile = function(req, res) {
  var style_id = req.params.style_id
  var username = req.params.username
  var z = +req.params.z || 0
  var x = +req.params.x || 0
  var y = +req.params.y || 0
  var scale = +(req.params.scale || '@1x').slice(1, 2)
  var format = req.params.format || 'png'

  async.autoInject({
    style: function(callback) {
      Style.findOne({ style_id: style_id, owner: username }, callback)
    },
    getTile: function(style, callback) {
      var opts = {
        style: style,
        scale: scale,
        format: format
      }

      getTileMapnik(z, x, y, opts, callback)
    }
  }, function(err, results) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.set(results.getTile[1])
    res.send(results.getTile[0])
  })
}


module.exports.preview = function(req, res) {
  var style_id = req.params.style_id
  var username = req.params.username

  var params = {
    zoom: Math.round(+req.query.zoom + 1 || 0),
    scale: +req.query.scale || 1,
    bbox: JSON.parse(req.query.bbox || null) || [-180, -85.0511, 180, 85.0511],
    center: JSON.parse(req.query.center || null),
    format: req.query.format || 'png',
    quality: +req.query.quality || null,
    limit: 19008,
    tileSize: 256
  }

  async.autoInject({
    style: function(callback) {
      Style.findOne({ style_id: style_id, owner: username }, callback)
    },
    getImage: function(style, callback) {
      getImageAbaculus(style, params, callback)
    }
  }, function(err, results) {
    if (err) {
      return res.status(500).json({ error: err.message || err })
    }

    res.set(results.getImage[1])
    res.send(results.getImage[0])
  })
}


function getTileMapnik(z, x, y, opts, callback) {
  if (!opts.style) {
    return callback('Mising style')
  }

  opts.scale = +opts.scale || 1
  opts.format = opts.format || 'png'

  async.autoInject({
    xml: function(callback) {
      gl2xml(opts.style, callback)
    },
    source: function(xml, callback) {
      var uri = {
        protocol: 'vector:',
        xml: xml,
        scale: opts.scale,
        format: opts.format
      }

      tilelive.load(uri, callback)
    },
    getTile: function(source, callback) {
      source.getTile(z, x, y, callback)
    }
  }, function(err, results) {
    if (err) return callback(err)

    if (!results.getTile) return callback()

    return callback(err, results.getTile[0], results.getTile[1])
  })
}


// function getTileMapboxGL(z, x, y, opts, callback) {
//   if (!opts.style) {
//     return callback(new Error('Mising style'))
//   }

//   opts.scale = (+opts.scale || 1) / 2
//   opts.format = opts.format || 'png'

//   var mapOptions = {
//     request: function(req, callback) {
//       request({
//         url: req.url,
//         encoding: null,
//         gzip: true
//       }, function(err, res, body) {
//         if (err) return callback(err)

//         return callback(null, {data: body})
//       })
//     },
//     ratio: opts.scale
//   }

//   var sm = new SphericalMercator({ size: 512 })
//   var center = sm.ll([x * 512 + 256, y * 512 + 256], z)

//   var renderOptions = {
//     zoom: z,
//     width: 512,
//     height: 512,
//     center: center,
//     bearing: opts.bearing || 0,
//     pitch: opts.pitch || 0
//   }

//   var map = new mbgl.Map(mapOptions)
//   map.load(opts.style)
//   map.render(renderOptions, function(err, buffer) {
//     if (err) return callback(err)

//     map.release()

//     var image = sharp(buffer, {
//       raw: {
//         width: renderOptions.width * mapOptions.ratio,
//         height: renderOptions.width * mapOptions.ratio,
//         channels: 4
//       }
//     })

//     image.toFormat(opts.format).toBuffer(function(err, buffer, info) {
//       return callback(err, buffer, { 'Content-Type': mime.lookup(info.format) })
//     })
//   })
// }

/* eslint-disable no-unused-vars */
function getImageAbaculus(style, params, callback) {
  var opts = {
    style: style,
    scale: params.scale,
    format: params.format
  }

  params.getTile = function(z, x, y, callback2) {
    return getTileMapnik(z, x, y, opts, callback2)
  }

  abaculus(params, callback)
}


function getImageMapnik(style, params, callback) {
  async.autoInject({
    xml: function(callback) {
      gl2xml(style, callback)
    },
    getImage: function(xml, callback) {
      var sm = new SphericalMercator()

      params.center = abaculus.coordsFromBbox(params.zoom, params.scale, params.bbox)

      var map = new mapnik.Map(params.center.w, params.center.h)
      map.extent = sm.convert(params.bbox, '900913')
      map.fromStringSync(xml)

      var sourceUrl = map.parameters.source
      var urlPath = url.parse(sourceUrl).pathname.split('/')

      var config = 'z0_z4_config.json'
      var zoom = params.zoom
      if (zoom <= 4) config = 'z0_z4_config.json'
      else if (zoom == 5) config = 'z5_config.json'
      else if (zoom <= 7) config = 'z6_z7_config.json'
      else if (zoom == 8) config = 'z8_config.json'
      else if (zoom == 9) config = 'z9_config.json'
      else if (zoom == 10) config = 'z10_config.json'
      else config = 'z11_z12_config.json'

      fs.readFile(path.join('metadata', urlPath[urlPath.indexOf('tilesets') + 2], config), function(err, buffer) {
        if (err) return callback(err)

        var layerConfig = JSON.parse(buffer).layer_config
        map.layers().forEach(function(layer) {
          if (layerConfig.hasOwnProperty(layer.name)) {
            layer.datasource = new mapnik.Datasource(layerConfig[layer.name])
            map.add_layer(layer)
          }
        })

        map.render(new mapnik.Image(map.width, map.height), { scale: params.scale }, function(err, data) {
          if (err) return callback(err)

          var image = data.encodeSync(params.format)
          return callback(null, image, { 'Content-Type': mime.lookup(params.format) })
        })
      })

    }
  }, function(err, results) {
    if (err) return callback(err)

    if (!results.getImage) return callback()

    return callback(err, results.getImage[0], results.getImage[1])
  })
}
