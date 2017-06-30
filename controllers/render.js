var fs = require('fs')
var abaculus = require('abaculus')
var SphericalMercator = require('sphericalmercator')
var mapnik = require('mapnik')
var url = require('url')
var mime = require('mime')
var async = require('async')
var http = require('http')
var zlib = require('zlib')
var lodash = require('lodash')
var gl2xml = require('mapbox-gl-json-to-mapnik-xml')
var turf = require('turf')
var mongoose = require('mongoose')
var SourceIndex = require('../models/source_index')
var pgconfig = require('../pgconfig')
turf.bboxClip = require('turf-bbox-clip')

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
          genPgSource(LayerInfo[0], params.zoom, callback)
        },
        tileSource: function(LayerInfo, callback) {
          var source = {}
          if (LayerInfo[1].source.length == 0) {
            return callback(null, source)
          } else {
            genTileSource(LayerInfo[1], params.coors, callback)
          }
        },
        renderMap: function(LayerInfo, pgSource, tileSource, callback) {
          renderStaticImage(map, params, LayerInfo, pgSource, tileSource, callback)
        }
      }, function(err, results) {
        if (err) {
          return callback(err)
        }
        if (!results.renderMap) {
          return callback()
        }
        callback(err, results.renderMap[0], results.renderMap[1])
      })
    }
  }, function(err, results) {
    if (err) {
      return callback(err)
    }
    if (!results.getImage) {
      return callback()
    }
    return callback(err, results.getImage[0], results.getImage[1])
  })
}

function renderStaticImage(map, params, LayerInfo, pgSource, tileSource, callback) {
  map.layers().forEach(function(layer) {
    if (LayerInfo[0].layers.hasOwnProperty(layer.name)) {
      if (pgSource[LayerInfo[0].layers[layer.name]].hasOwnProperty(layer.name)) {
        layer.datasource = new mapnik.Datasource(pgSource[LayerInfo[0].layers[layer.name]][layer.name])
      }   
    } else {
      if (tileSource[LayerInfo[1].layers[layer.name]].hasOwnProperty(layer.name)) {
        layer.datasource = new mapnik.Datasource({
          type: 'geojson',
          inline: JSON.stringify(tileSource[LayerInfo[1].layers[layer.name]][layer.name])
        })
      }
    }
    map.add_layer(layer)
  })

  map.render(new mapnik.Image(map.width, map.height), {
    scale: params.scale
  }, function(err, data) {
    if (err) {
      return callback(err)
    }
    var image = data.encodeSync(params.format)
      //fs.writeFileSync('test.png', image)
    return callback(null, image, {
      'Content-Type': mime.lookup(params.format)
    })
  })
}

function genTileSource(tileLayerInfo, coors, callback) {
  var sm = new SphericalMercator()
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
              
              if (!buf) {
                return callback(null,{})
              }
              vtile.setData(buf)
              vtile.names().forEach(function(layer_name) {
                if(tileLayerInfo.layers.hasOwnProperty(layer_name)&&tileLayerInfo.layers[layer_name] == sourceURL) {
                  var geojson = JSON.parse(vtile.toGeoJSONSync(layer_name))
                  for (var f_num in geojson.features) {
                    var feat = geojson.features[f_num]
                    //Convert lon/lat values to 900913 x/y.
                    if (layer_name == 'hillshade') {
                      var intersect = turf.bboxClip(feat, sm.bbox(x, y, z, false, 'WGS84'))
                      if (intersect) {
                        feat.geometry = intersect.geometry
                      } else {
                        continue
                      }
                    }
                    feat = convert2xy(feat)
                    geojson.features[f_num] = feat
                  }
                  dataSourceGeoJSON[layer_name] = geojson
                }
              })
              callback(null, dataSourceGeoJSON)
            })
          })
        })
      })(x, y, z)
    }, function(err, results) {
      if (err) {
        return callback(err, {})
      }
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
          if (dataSourceGeoJSON.hasOwnProperty(layername)) {
            geojson.features = geojson.features.concat(dataSourceGeoJSON[layername].features)
          }
        })
        geoJSONConfig[layername] = geojson
      }
      source[sourceURL] = geoJSONConfig
      callback(null, source)
    })
  }, function(err, result) {
    var source = {}
    result.forEach(function(subSource) {
      for (var key in subSource) {
        source[key] = subSource[key]
      }
    })
    return callback(null, source)
  })

}

function genPgSource(pgLayerInfo, zoom, callback) {
  var source = {}
  for (var id in pgLayerInfo.source) {
    var layers = {}
    for(var zoomRange in pgLayerInfo.source[id].layers){
      var minzoom = Number(zoomRange.split('_')[0])
      var maxzoom = Number(zoomRange.split('_')[1]?zoomRange.split('_')[1]:minzoom)
      if(zoom-1 >= minzoom && zoom-1 <= maxzoom){
        for(var name in pgLayerInfo.source[id].layers[zoomRange]) {
          lodash.extend(pgLayerInfo.source[id].layers[zoomRange][name],pgconfig)
        }
        source[id] = pgLayerInfo.source[id].layers[zoomRange]
        break
      }
    } 
  }
  return callback(null, source)
}

function getLayerInfo(map, zoom, callback) {
  var styleSource = JSON.parse(map.parameters.source)
  var layers = map.layers();
  async.map(layers,function(layer,callback){
    var layerSource = styleSource[layer.name]
    isNative(layerSource, zoom, layer.name,function(flag, id, name, data){
      if(flag) {
        callback(null,{type:'postgis', id:id, name:name, source: data})
      }else {
        callback(null, {type:'tile', id:id, name:name, source:data})
      }
    })
  },function(err,results){
    var pgConfigInfo = {}
    var tileConfigInfo = {}
    tileConfigInfo.layers = {}
    tileConfigInfo.source = []
    pgConfigInfo.source = {}
    pgConfigInfo.layers = {}
    for(var i = 0;i < results.length;i++) {
      if(results[i].type === 'postgis'){
        pgConfigInfo.layers[results[i].name] = results[i].id
        if(!pgConfigInfo.source.hasOwnProperty(results[i].id)){
          pgConfigInfo.source[results[i].id] = results[i].source
        }
      }
      if(results[i].type === 'tile'){
        tileConfigInfo.layers[results[i].name] = results[i].source
        if(tileConfigInfo.source.indexOf(results[i].source) == -1){
          tileConfigInfo.source.push(results[i].source)
        }
      }
    }
    return callback(null, pgConfigInfo, tileConfigInfo)
  })
}

function convert2xy(feat) {
  var sm = new SphericalMercator()
  var coordinates = feat.geometry.coordinates
  var type = feat.geometry.type
  if (type == 'Point') {
    feat.geometry.coordinates = sm.forward(coordinates)
  } else if (type == 'LineString') {
    for (var i_ls in coordinates) {
      feat.geometry.coordinates[i_ls] = sm.forward(coordinates[i_ls])
    }
  } else if (type == 'Polygon') {
    var poly = []
    var num_subPoly = 0
    for (var i_subPoly in coordinates) {
      var coor_ploygen = coordinates[i_subPoly]
      for (var i_ploygon in coor_ploygen) {
        coor_ploygen[i_ploygon] = sm.forward(coor_ploygen[i_ploygon])
      }
      poly[num_subPoly++] = coor_ploygen
    }
    feat.geometry.coordinates = poly

  } else if (type == 'MultiPolygon') {
    var MultiPoly = []
    var num_poly = 0
    for (var i_mpolygon in coordinates) {
      var m_poly = []
      var m_num_subPoly = 0
      var coor_mpolygon = coordinates[i_mpolygon]
      if (coor_mpolygon.length == 0) {
        continue
      }
      for (var ii_subPoly in coor_mpolygon) {
        var coor_sub_ploygen = coor_mpolygon[ii_subPoly]
        for (var j_mpolygon in coor_sub_ploygen) {
          coor_sub_ploygen[j_mpolygon] = sm.forward(coor_sub_ploygen[j_mpolygon])
        }
        m_poly[m_num_subPoly++] = coor_sub_ploygen
      }
      MultiPoly[num_poly++] = m_poly
    }
    feat.geometry.coordinates = MultiPoly
  } else if (type == 'MultiLineString') {
    for (var i_ml in coordinates) {
      var coor_ml = coordinates[i_ml]
      for (var j_ml in coor_ml) {
        coor_ml[j_ml] = sm.forward(coor_ml[j_ml])
      }
      feat.geometry.coordinates[i_ml] = coor_ml
    }
  } else if (type == 'MultiPoints') {
    for (var i_mp in coordinates) {
      feat.geometry.coordinates[i_mp] = sm.forward(coordinates[i_mp])
    }
  }
  return feat
}

function isNative(sourceUrl, zoom, layername, callback) {
  zoom = Math.min(zoom,12)
  if (isNativeRoute(url.parse(sourceUrl).host)) {
    var urlPath = url.parse(sourceUrl).pathname.split('/')
    var tileset_id = urlPath[urlPath.indexOf('tilesets') + 2]
    var owner = urlPath[urlPath.indexOf('tilesets') + 1]
    var Ngcc = mongoose.model('source_index', SourceIndex, 'source_index')
    Ngcc.findOne({
      tileset_id: tileset_id,
      owner: owner,
      is_deleted:false
    }, function(err, sourceIndex) {
      if(sourceIndex && sourceIndex.toJSON()) {
        var json = sourceIndex.toJSON()
        callback(true, json.tileset_id, layername, json)
      } else {
        callback(false, tileset_id, layername, sourceUrl)
      } 
    })
  }
}

function isNativeRoute() {
  return true
}
