var _ = require('lodash')
var Tileset = require('../models/tileset')
var tilelive = require('tilelive')
var crypto = require('crypto')


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

    tilelive.load(tileset.uri, function(err, source) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      source.getTile(req.params.z, req.params.x, req.params.y,
        function(err, tile, headers) {
          if (err) {
            return res.status(500).json({ error: err })
          }

          if (!tile) {
            return res.sendStatus(404)
          }

          var _headers = {}
          Object.keys(headers).forEach(function(x) {
            _headers[x.toLowerCase()] = headers[x]
          })

          if (!_headers['content-md5']) {
            var hash = crypto.createHash('md5')
            _headers['content-md5'] = hash.update(tile).digest('base64')
          }

          if (req.params.format === 'pbf') {
            _headers['content-type'] = _headers['content-type'] || 'application/x-protobuf'
            _headers['content-encoding'] = _headers['content-encoding'] || 'gzip'
          }

          res.set(_headers)
          res.status(200).send(tile)
        })
    })
  })
}


module.exports.update = function(req, res) {
  var filter = ['tileset_id', 'owner', 'is_deleted', 'createdAt', 'updatedAt']

  if (!req.body.share && !req.body.unshare) {
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
  else {
    Tileset.findOne({
      tileset_id: req.params.tileset_id,
      owner: req.params.username,
      is_deleted: false
    }, function(err, tileset){
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!tileset) {
        return res.sendStatus(404)
      }

      if (req.body.share === 'public') {
        if (tileset.scopes[0] === 'public') {
          return res.status(200).json(tileset)
        }
        else if (tileset.scopes[0] === 'private') {
          tileset.scopes.splice(0, 1, 'public')
        }
        else {
          tileset.scopes.splice(0, 0, 'public')
        }
      }
      else if (req.body.share && req.body.share !== 'public') {
        if (tileset.scopes.indexOf(req.body.share) > -1) {
          return res.status(200).json(tileset)
        }
        else if (tileset.scopes[0] === 'private') {
          tileset.scopes.splice(0, 1, req.body.share)
        }
        else {
          tileset.scopes.push(req.body.share)
        }
      }
      else if (req.body.unshare === 'public') {
        if (tileset.scopes[0] !== 'public') {
          return res.status(200).json(tileset)
        }
        else if (tileset.scopes.length === 1) {
          tileset.scopes = ['private']
        }
        else {
          tileset.scopes.splice(0, 1)
        }
      }
      else {
        if (tileset.scopes.indexOf(req.body.unshare) < 0) {
          return res.status(200).json(tileset)
        }
        else if (tileset.scopes.length === 1) {
          tileset.scopes = ['private']
        }
        else {
          tileset.scopes.splice(tileset.scopes.indexOf(req.body.unshare), 1)
        }
      }

      tileset.save(function(err){
        if (err) {
          return res.status(500).json({ error: err})
        }

        return res.status(200).json(tileset)
      })
    })
  }
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
