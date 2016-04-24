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

      res.status(200).json(newUser)
    })
  })
}


module.exports.retrieve = function(req, res) {
  res.status(200).json(req.user)
}


module.exports.update = function(req, res) {
  var fields = ['name', 'email', 'phone', 'organization', 'avatar']
  for (var i = 0; i < fields.length; i++) {
    req.user[fields[i]] = req.body[fields[i]] || req.user[fields[i]]
  }

  req.user.save(function(err) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.status(200).json(req.user)
  })
}


module.exports.login = function(req, res) {
  req.user.updateAccessToken()
  req.user.save(function(err) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.status(200).json(req.user)
  })
}
