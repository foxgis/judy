var Group = require('../models/group')
var _ = require('lodash')


module.exports.list = function(req, res) {
  Group.find({
    members: req.params.username
  }, function(err, groups) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.status(200).json(groups)
  })
}


module.exports.create = function(req, res) {
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


module.exports.update = function(req, res) {
  var filter = ['join', 'quit', 'name', 'admin', 'add', 'delete']
  _.pick(req.body, filter)

  Group.findOne({
    admin: req.params.username,
    group_id: req.params.group_id
  }, function(err, group) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!group) {
      return res.sendStatus(404)
    }

    if (group.admin === req.user.username){
      if (req.body.join || req.body.quit) {
        return res.sendStatus(401)
      }

      if (req.body.add) {
        if (group.members.indexOf(req.body.add) > -1) {

          return res.sendStatus(400)
        }

        group.members.push(req.body.add)
        group.applicants.splice(group.applicants.indexOf(req.body.add),1)
      }

      if (req.body.delete) {
        if (group.members.indexOf(req.body.delete) < 0
          || req.body.delete === group.admin){

          return res.sendStatus(400)
        }

        group.members.splice(group.members.indexOf(req.body.quit),1)
      }

      if (req.body.admin) {
        if (group.members.indexOf(req.body.admin) < 0) {
          return res.sendStatus(401)
        }

        group.admin = req.body.admin
      }

      if (req.body.name) {
        group.name = req.body.name
      }

      group.save(function(err){
        if (err) {
          return res.status(500).json({ error: err})
        }
      })

      return res.status(200).json(group)

    } else if (group.members.indexOf(req.user.username) > -1) {
      if (!req.body.quit || req.body.quit !== true) {
        return res.sendStatus(401)
      }

      group.members.splice(group.members.indexOf(req.user.username),1)
      group.save(function(err){
        if (err) {
          return res.status(500).json({ error: err})
        }
      })

      return res.sendStatus(200)

    } else if (group.applicants.indexOf(req.user.username) > -1) {

      return res.status(200).json(group)

    } else {
      if(!req.body.join || req.body.join !== true) {
        return res.sendStatus(400)
      }

      group.applicants.push(req.user.username)
      group.save(function(err){
        if (err) {
          return res.status(500).json({ error: err})
        }
      })

      return res.status(200).json(group)
    }
  })
}


module.exports.delete = function(req, res) {
  Group.findOneAndRemove({
    admin: req.params.username,
    group_id: req.params.group_id
  }, function(err) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.sendStatus(204)
  })
}
