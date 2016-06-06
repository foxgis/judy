var Upload = require('../models/upload')


module.exports.uploads = function(req, res) {
  var pipeline = [{
    $match: { is_deleted: false }
  }, {
    $group: { _id: '$owner', total: { $sum: 1 } }
  }, {
    $lookup: { from: 'users', localField: '_id', foreignField: 'username', as: 'users' }
  }, {
    $project: {
      _id: 0,
      total: 1,
      owner: '$_id',
      name: { $arrayElemAt: ['$users.name', 0] },
      location: { $arrayElemAt: ['$users.location', 0] },
      organization: { $arrayElemAt: ['$users.organization', 0] }
    }
  }, {
    $sort: { total: -1 }
  }]

  Upload.aggregate(pipeline, function(err, results) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(results)
  })
}
