var Font = require('../models/font')
var fs = require('fs')
var path = require('path')


module.exports.list = function(req, res) {
  Font.find({ owner: req.params.username }, function(err, fonts) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.status(200).json(fonts)
  })
}


module.exports.retrieve = function(req, res) {
  var filePath = path.join('fonts', req.params.fontstack, req.params.range + '.pbf')

  fs.readFile(filePath, function(err, pbf) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    return res.status(200).send(pbf)
  })
}
