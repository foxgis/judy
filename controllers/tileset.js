var mongoose = require('../db')
var Tileset = require('../models/tileset')


module.exports.list = function(req, res) {
  Tileset.find({ owner: req.body.username, is_deleted: false },
    'tileset_id owner scopes filesize format create_at',
    function(err, tilesets) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      res.status(200).json(tilesets)
    }
  )
}


module.exports.retrieve = function(req, res) {
  Tileset.findOne({
    tileset_id: req.body.tileset_id,
    owner: req.body.username,
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
  var name = req.body.tileset_id
  mongoose.connection.db.listCollections({name: name}).toArray(function(err, names) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    if (names.length === 0) {
      res.sendStatus(404)
      return
    }


  })
}


module.exports.delete = function(req, res) {
  Tileset.findOneAndUpdate({
    tileset_id: req.body.tileset_id,
    owner: req.body.username,
    is_deleted: false
  }, function(err) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.sendStatus(204)
  })
}
