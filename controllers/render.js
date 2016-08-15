var fs = require('fs')
var abaculus = require('abaculus')
var SphericalMercator = require('sphericalmercator')
var mapnik = require('mapnik')
var url = require('url')
var mime = require('mime')
var async = require('async')
var http = require('http')
var zlib = require('zlib')
var gl2xml = require('mapbox-gl-json-to-mapnik-xml')


module.exports = function(style, params, callback) {
  async.autoInject({
    xml: function(callback) {
      gl2xml(style, callback)
    },
    getImage: function(xml, callback) {
      params.center = abaculus.coordsFromBbox(params.zoom, params.scale, params.bbox)
      params.coors = abaculus.tileList(params.zoom, params.scale, params.center)

      var sm = new SphericalMercator()
      var map = new mapnik.Map(params.center.w, params.center.h)
      map.extent = sm.convert(params.bbox, '900913')
      map.fromStringSync(xml)

      async.autoInject({
        LayerInfo: function(callback) {
          getLayerInfo(map, params.zoom, callback)
        },
        pgSource: function(LayerInfo, callback) {
          genPgSource(LayerInfo[0], callback)
        },
        tileSource: function(LayerInfo, callback) {
          var source = {}
          if (LayerInfo[1].source.length == 0) return callback(null, source)
          else genTileSource(LayerInfo[1], params.coors, callback)
        },
        renderMap: function(LayerInfo, pgSource, tileSource, callback) {
          renderStaticImage(map, params, LayerInfo, pgSource, tileSource, callback)
        }
      }, function(err, results) {
        if (err) return callback(err)
        if (!results.renderMap) return callback()
        callback(err, results.renderMap[0], results.renderMap[1])
      })
    }
  }, function(err, results) {
    if (err) return callback(err)
    if (!results.getImage) return callback()
    return callback(err, results.getImage[0], results.getImage[1])
  })
}

function renderStaticImage(map, params, LayerInfo, pgSource, tileSource, callback) {
  map.layers().forEach(function(layer) {
    if (LayerInfo[0].layers.hasOwnProperty(layer.name)) {
      if (pgSource[LayerInfo[0].layers[layer.name][0]].hasOwnProperty(layer.name))
        layer.datasource = new mapnik.Datasource(pgSource[LayerInfo[0].layers[layer.name][0]][layer.name])
    }
    else {
      if (tileSource[LayerInfo[1].layers[layer.name]].hasOwnProperty(layer.name))
        layer.datasource = new mapnik.Datasource({
          type: 'geojson',
          inline: JSON.stringify(tileSource[LayerInfo[1].layers[layer.name]][layer.name])
        })
    }
    map.add_layer(layer)
  })

  map.render(new mapnik.Image(map.width, map.height), {
    scale: params.scale
  }, function(err, data) {
    if (err) return callback(err)
    var image = data.encodeSync(params.format)
      //fs.writeFileSync('test.png', image)
    return callback(null, image, {
      'Content-Type': mime.lookup(params.format)
    })
  })
}

function genTileSource(tileLayerInfo, coors, callback) {
  async.map(tileLayerInfo.source, function(sourceURL, callback) {
    async.map(coors.tiles, function(item, callback) {
      var x = item.x
      var y = item.y
      var z = item.z;

      /* eslint-disable no-unexpected-multiline*/
      (function getTile(x, y, z) { //闭包，避免异步执行中数据的改变引起错误
        var urlPath = sourceURL
        urlPath = urlPath.replace('{x}', x)
        urlPath = urlPath.replace('{y}', y)
        urlPath = urlPath.replace('{z}', z)

        http.get(urlPath, function(response) {
          var buffer = []
          response.on('data', function(chunk) {
            buffer.push(chunk)
          }).on('end', function() {
            buffer = Buffer.concat(buffer)
            zlib.gunzip(buffer, function(err, buf) {
              var dataSourceGeoJSON = {}
              var vtile = new mapnik.VectorTile(z, x, y)
              if (!buf) return callback(null, {})
              vtile.setData(buf)
              vtile.names().forEach(function(layer_name) {
                var geojson = JSON.parse(vtile.toGeoJSONSync(layer_name))
                for (var f_num in geojson.features) {
                  var feat = geojson.features[f_num]
                    //Convert lon/lat values to 900913 x/y.
                  feat = convert2xy(feat)
                  geojson.features[f_num] = feat
                }
                dataSourceGeoJSON[layer_name] = geojson
              })
              callback(null, dataSourceGeoJSON)
            })
          })
        })
      })(x, y, z)
    }, function(err, results) {
      if (err) return callback(err, {})
        //拼瓦片
      var source = {}
      var geoJSONConfig = {}
      for (var layername in tileLayerInfo.layers) {
        var geojson = {
          'name': layername,
          'type': 'FeatureCollection',
          'features': []
        }
        results.forEach(function(dataSourceGeoJSON) {
          if (dataSourceGeoJSON.hasOwnProperty(layername))
            geojson.features = geojson.features.concat(dataSourceGeoJSON[layername].features)
        })
        geoJSONConfig[layername] = geojson
      }
      source[sourceURL] = geoJSONConfig
      callback(null, source)
    })
  }, function(err, result) {
    var source = {}
    result.forEach(function(subSource) {
      for (var key in subSource)
        source[key] = subSource[key]
    })
    return callback(null, source)
  })

}

function genPgSource(pgLayerInfo, callback) {
  var source = {}
  for (var id in pgLayerInfo.source) {
    source[id] = JSON.parse(fs.readFileSync('./metadata/' + id + '/' + pgLayerInfo.source[id])).layer_config
  }
  return callback(null, source)
}

function getLayerInfo(map, zoom, callback) {
  var pgConfigInfo = {}
  var tileConfigInfo = {}
  tileConfigInfo.layers = {}
  tileConfigInfo.source = []
  pgConfigInfo.source = {}
  pgConfigInfo.layers = {}
  var styleSource = JSON.parse(map.parameters.source)
  map.layers().forEach(function(layer) {
    var layerSource = styleSource[layer.name]
    var nativePg = isNative(layerSource, zoom)
    if (nativePg[0]) {
      pgConfigInfo.layers[layer.name] = [nativePg[1], nativePg[2]]
      if (!pgConfigInfo.source.hasOwnProperty(nativePg[1]))
        pgConfigInfo.source[nativePg[1]] = nativePg[2]
    }
    else {
      tileConfigInfo.layers[layer.name] = layerSource
      if (tileConfigInfo.source.indexOf(layerSource) == -1)
        tileConfigInfo.source.push(layerSource)
    }

  })
  return callback(null, pgConfigInfo, tileConfigInfo)
}

function convert2xy(feat) {
  var sm = new SphericalMercator()
  var coordinates = feat.geometry.coordinates
  var type = feat.geometry.type
  if (type == 'Point')
    feat.geometry.coordinates = sm.forward(coordinates)
  else if (type == 'LineString') {
    for (var i_ls in coordinates) {
      feat.geometry.coordinates[i_ls] = sm.forward(coordinates[i_ls])
    }
  }
  else if (type == 'Polygon') {

    var coor_ploygen = coordinates[0]
    for (var i_ploygon in coor_ploygen) {
      coor_ploygen[i_ploygon] = sm.forward(coor_ploygen[i_ploygon])
    }
    feat.geometry.coordinates[0] = coor_ploygen

  }
  else if (type == 'MultiPolygon') {
    for (var i_mpolygon in coordinates) {
      var coor_mpolygon = coordinates[i_mpolygon][0]
      for (var j_mpolygon in coor_mpolygon) {
        coor_mpolygon[j_mpolygon] = sm.forward(coor_mpolygon[j_mpolygon])
      }
      feat.geometry.coordinates[i_mpolygon][0] = coor_mpolygon
    }
  }
  else if (type == 'MultiLineString') {
    for (var i_ml in coordinates) {
      var coor_ml = coordinates[i_ml]
      for (var j_ml in coor_ml) {
        coor_ml[j_ml] = sm.forward(coor_ml[j_ml])
      }
      feat.geometry.coordinates[i_ml] = coor_ml
    }
  }
  else if (type == 'MultiPoints') {
    for (var i_mp in coordinates) {
      feat.geometry.coordinates[i_mp] = sm.forward(coordinates[i_mp])
    }
  }
  return feat
}

function isNative(sourceUrl, zoom) {
  if (isNativeRoute(url.parse(sourceUrl).host)) {
    var urlPath = url.parse(sourceUrl).pathname.split('/')
    var dirNative = fs.readdirSync('./metadata/')
    if (dirNative.indexOf(urlPath[urlPath.indexOf('tilesets') + 2]) > -1) {
      var zoomConfig = fs.readdirSync('./metadata/' + urlPath[urlPath.indexOf('tilesets') + 2])
        //zoom = ['z',zoom].join('')
      for (var id in zoomConfig) {
        var nameArr = zoomConfig[id].split('.')[0].split('_')
        if (nameArr.length == 3 && zoom >= nameArr[0].slice(1, this.length) && zoom <= nameArr[1].slice(1, this.length)) return [true, urlPath[urlPath.indexOf('tilesets') + 2], zoomConfig[id]]
        if (nameArr.length == 2 && zoom == nameArr[0].slice(1, this.length)) return [true, urlPath[urlPath.indexOf('tilesets') + 2], zoomConfig[id]]
      }
    }
  }
  return [false, null, null]
}

function isNativeRoute() {
  return true
}
