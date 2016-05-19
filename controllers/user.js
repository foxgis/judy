var _ = require('lodash')
var User = require('../models/user')
var config = require('../config')


module.exports.create = function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.status(400).json({ error: '注册信息不完整' })
    return
  }

  if (config.blacklist.indexOf(req.body.username) !== -1) {
    res.status(400).json({ error: '该用户名已经被注册'})
    return
  }

  if (req.body.password.length < 6) {
    res.status(400).json({ error: '密码长度过短' })
    return
  }

  User.findOne({ username: req.body.username }, function(err, user) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    if (user) {
      res.status(400).json({ error: '该用户名已经被注册' })
      return
    }

    var newUser = new User({
      username: req.body.username,
      password: req.body.password
    })

    newUser.updateAccessToken()
    newUser.save(function(err) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      res.status(200).json(newUser)
    })
  })
}


module.exports.retrieve = function(req, res) {
  User.findOne({ username: req.params.username }, function(err, user) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    if (!user) {
      res.status(404).json({ error: '没有这个用户'})
      return
    }

    res.status(200).json(_.omit(user.toJSON(), 'access_token'))
  })
}


module.exports.update = function(req, res) {
  var filter = ['name', 'email', 'phone', 'location', 'organization', 'avatar']

  User.findOneAndUpdate({ username: req.params.username },
    _.pick(req.body, filter), { new: true },
    function(err, user) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      res.status(200).json(_.omit(user.toJSON(), 'access_token'))
    })
}


module.exports.login = function(req, res) {
  if (!req.body.password) {
    return res.status(401).json({ error: '登录信息不完整' })
  }

  User.findOne({ username: req.params.username }, function(err, user) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!user || !user.validPassword(req.body.password)) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    user.updateAccessToken()
    user.save(function(err) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      return res.status(200).json(user)
    })
  })
}
