
var Upload = require('../models/upload')


module.exports.list = function(req, res) {
  Upload.find({ owner: req.params.username }, '-_id -file_id -__v', function(err, uploads) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.status(200).json(uploads)
  })
}


module.exports.create = function(req, res) {
  // console.log(req.files)

  // res.status(200).json({})
}


module.exports.retrieve = function(req, res) {

}


module.exports.delete = function(req, res) {

}
