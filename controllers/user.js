var jwt = require('jsonwebtoken')
var config = require('../config')
var User = require('../models/user')


module.exports.create = function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.status(400).json({ error: '注册信息不完整' })
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

      res.status(200).json(newUser.toJSON())
    })
  })
}


module.exports.retrieve = function(req, res) {
  User.findOne({ username: req.params.username }, function(err, user) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.status(200).json(user.toJSON())
  })
}


module.exports.update = function(req, res) {
  User.findOneAndUpdate({ username: req.params.username }, req.body, {
    fields: 'name email phone organization avatar groups'
  }, function(err, user) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    User.findOne({ username: req.params.username }, function(err, user2) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      res.status(200).json(user2.toJSON())
    })
  })
}


module.exports.login = function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.status(400).json({ error: '登录信息不完整' })
    return
  }

  User.findOne({ username: req.body.username }, function(err, user) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    if (!user || !user.validPassword(req.body.password)) {
      res.status(401).json({ error: '用户名或密码错误' })
      return
    }

    user.updateAccessToken()
    user.save(function(err) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      res.status(200).json(user.toJSON())
    })
  })
}


module.exports.updateAccessToken = function(req, res) {
  User.findOne({ username: req.params.username }, function(err, user) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    user.updateAccessToken()
    user.save(function(err) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      res.status(200).json(user.toJSON())
    })
  })
}
