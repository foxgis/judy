var Upload = require('../models/upload')
var User = require('../models/user')


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
    $group: { _id: '$location', total: { $sum: '$total' } }
  }, {
    $project: {
      _id: 0,
      total: 1,
      location: '$_id'
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

module.exports.userdownloads = function(req, res) {
  User.find({ downloadNum: { $gt: 0}}, 'name username location organization downloadNum -_id',function(err, users) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(users)

  }).sort({ downloadNum: -1 }).limit(100)
}

module.exports.filedownloads = function(req, res) {
  Upload.find({ 
    is_deleted: false,
    downloadNum: { $gt: 0}
  }, 'name location year downloadNum -_id', function(err, uploads) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(uploads)

  }).sort({ downloadNum: -1 }).limit(100)
}

module.exports.location = function(req, res) {
  var match = {}
  if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    match['is_deleted'] = false
    match['scope'] = 'public'
  }
  var pipeline = [{
    $match: match
  },{
    $group: { _id: '$location', total: { $sum: 1 } }
  },{
    $project: {
      _id: 0,
      total: 1,
      location: '$_id'
    }
  },{
    $sort: { total: -1 }
  }]

  Upload.aggregate(pipeline, function(err, results) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(results)
  })
}

module.exports.year = function(req, res) {
  var match = {}
  if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    match['is_deleted'] = false
    match['scope'] = 'public'
  }
  var pipeline = [{
    $match: match
  },{
    $group: { _id: '$year', total: { $sum: 1 } }
  },{
    $project: {
      _id: 0,
      total: 1,
      year: '$_id'
    }
  },{
    $sort: { total: -1 }
  }]

  Upload.aggregate(pipeline, function(err, results) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(results)
  })
}