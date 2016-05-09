var Group = require('../models/group')
var _ = require('underscore')


module.exports.create = function(req, res){
  if (!req.body.name) {
    return res.status(400).json({ error: '信息不完整'})
  }

  Group.findOne({ name: req.body.name}, function(err, group){
    if (err) {
      return res.status(500).json({ error: err})
    }

    if (group) {
      return res.status(400).json({ error: '群组名已被占用'})
    }

    var newGroup = new Group({
      name: req.body.name,
      admin: req.params.username,
      members: [req.params.username]
    })

    if (req.body.members){
      newGroup.members = req.body.members
    }

    newGroup.save(function(err){
      if (err) {
        return res.status(500).json({ error: err})
      }
    })

    return res.status(200).json(newGroup)
  })
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
