var _ = require('lodash')
var User = require('../models/user')


module.exports.create = function(req, res) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ error: '注册信息不完整' })
  }

  if (req.body.password.length < 6) {
    return res.status(400).json({ error: '密码长度过短' })
  }

  User.findOne({ username: req.body.username }, function(err, user) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (user) {
      return res.status(400).json({ error: '该用户名已经被注册' })
    }

    var newUser = new User({
      username: req.body.username,
      password: req.body.password
    })

    if (req.body.scope) newUser.scope = req.body.scope
    if (req.body.name) newUser.name = req.body.name
    if (req.body.location) newUser.location = req.body.location
    if (req.body.organization) newUser.organization = req.body.organization
    if (req.body.position) newUser.position = req.body.position
    if (req.body.telephone) newUser.telephone = req.body.telephone
    if (req.body.mobile) newUser.mobile = req.body.mobile
    if (req.body.email) newUser.email = req.body.email

    newUser.save(function(err) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      newUser.updateAccessToken()
      res.status(200).json(newUser)
    })
  })
}


module.exports.retrieve = function(req, res) {
  User.findOne({ username: req.params.username }, function(err, user) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    res.status(200).json(_.omit(user.toJSON(), 'access_token'))
  })
}


module.exports.update = function(req, res) {
  var filter = ['scope', 'name', 'location', 'organization', 'position', 'telephone', 'mobile', 'email']

  User.findOneAndUpdate({ username: req.params.username },
    _.pick(req.body, filter), { new: true },
    function(err, user) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!user) {
        return res.status(404).json({ error: '用户不存在' })
      }

      res.status(200).json(user)
    })
}


module.exports.login = function(req, res) {
  if (!req.body.password) {
    return res.status(400).json({ error: '登录信息不完整' })
  }

  User.findOne({ username: req.params.username }, function(err, user) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!user || !user.validPassword(req.body.password)) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    user.updateAccessToken()
    res.status(200).json(user)
  })
}
