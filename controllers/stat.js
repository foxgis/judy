var Upload = require('../models/upload')


//统计系统中各地区总共上传了多少文件
module.exports.uploads = function(req, res) {
  var query = { is_deleted: false }
  if (req.query.location) {
    var locationStr = req.query.location.replace('null','')
    query.location = { $in: locationStr.split(',')}
  }

  if (req.query.year) {
    var yearStr = req.query.year.replace('null','')
    query.year = { $in: yearStr.split(',')}
  }

  if (req.query.tags) {
    query.tags = { $in: req.query.tags.split(',')}
  }
  var pipeline = [{
    $match: query
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


//统计用户下载信息
module.exports.userdownloads = function(req, res) {
  var query = { is_deleted: false }
  if (req.query.location) {
    var locationStr = req.query.location.replace('null','')
    query.location = { $in: locationStr.split(',')}
  }

  if (req.query.year) {
    var yearStr = req.query.year.replace('null','')
    query.year = { $in: yearStr.split(',')}
  }

  if (req.query.tags) {
    query.tags = { $in: req.query.tags.split(',')}
  }
  var pipeline = [{
    $match: query
  }, {
    $group: { _id: '$owner', total: { $sum:'$downloadNum' } }
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
    $group: { _id: '$organization', total: { $sum: '$total' } }
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


//统计文件下载信息
module.exports.filedownloads = function(req, res) {
  var query = { 
    is_deleted: false,
    downloadNum: { $gt: 0}
  }
  if (req.query.location) {
    var locationStr = req.query.location.replace('null','')
    query.location = { $in: locationStr.split(',')}
  }

  if (req.query.year) {
    var yearStr = req.query.year.replace('null','')
    query.year = { $in: yearStr.split(',')}
  }

  if (req.query.tags) {
    query.tags = { $in: req.query.tags.split(',')}
  }
  Upload.find(query, 'owner upload_id name location year downloadNum -_id', function(err, uploads) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(uploads)

  }).sort({ downloadNum: -1 }).limit(100)
}


//统计各地区文件上传数量
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


//统计各制图年份文件上传数量
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


//统计主题词
module.exports.tags = function(req, res) {
  var match = {}
  if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    match['is_deleted'] = false
    match['scope'] = 'public'
  }
  var pipeline = [{
    $match: match
  },{
    $unwind: '$tags'
  },{
    $group: { _id: '$tags', total: { $sum: 1 } }
  },{
    $project: {
      _id: 0,
      total: 1,
      tag: '$_id'
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
