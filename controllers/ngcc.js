var mongoose = require('mongoose')
var NgccSchema = require('../models/ngcc')

module.exports.list = function(req, res) {
  var tableName = 'ngcc_admin_map_'+req.query.tablename
  var query = {}
  if(req.query.fieldname) {
    query.field_name = req.query.fieldname
  }

  var Ngcc = mongoose.model(tableName, NgccSchema, tableName)
  Ngcc.find(query, '-_id -__v -updatedAt -createdAt', function(err, ngccs) {
    if (err) {
      return res.status(500).json({ error: err })
    }
    res.status(200).json(ngccs)
  })
}