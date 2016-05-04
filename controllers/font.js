/* eslint-disable no-unused-vars */
var Font = require('../models/font')


module.exports.list = function(req, res) {
  Font.find({
    owner: req.params.username,
    is_deleted: false
  }, function(err, fonts) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.status(200).json(fonts)
  })
}


module.exports.retrieve = function(req, res) {

}
