var Group = require('../models/group')
var _ = require('underscore')


module.exports.create = function(req, res){
  var group = new Group({
    name: req.body.groupname,
    admin: req.params.username
  })
  group.members.push(req.params.username)

  group.save(function(err){
    if (err) {
      return res.status(500).json({ error: err})
    }
  })

  return res.status(200).json(group)
}


module.exports.retrieve = function(req, res){
  Group.findOne({
    admin: req.params.username,
    group_id: req.params.group_id
  }, function(err, group){
    if (err) {
      return res.status(500).json({ error: err})
    }

    if (!group) {
      return res.sendStatus(404)
    }

    return res.status(200).json(group)
  })
}


module.exports.update = function(req, res){
  var filter = ['name','members']

  Group.findOneAndUpdate({
    admin: req.params.username,
    group_id: req.params.group_id
  }, _.pick(req.body, filter), { new: true }, function(err, group) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!group) {
      return res.sendStatus(404)
    }
    
    return res.status(200).json(group)
  })
}
