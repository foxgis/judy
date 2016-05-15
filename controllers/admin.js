var admin = require('../models/admin.js')


module.exports.retrieve = function(req, res) {
  return res.status(200).json(admin)
}
