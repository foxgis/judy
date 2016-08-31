var _ = require('lodash')
var fs = require('fs')
var async = require('async')
var gm = require('gm')
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

    var keys = ['scope', 'name', 'location', 'organization', 'position',
      'telephone', 'mobile', 'email', 'signature', 'role', 'is_verified'
    ]
    keys.forEach(function(key) {
      if (req.body[key]) {
        newUser[key] = req.body[key]
      }
    })

    newUser.save(function(err, user) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      res.json(user.toJSON({ virtuals: true }))
    })
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

    res.json(user.toJSON({ virtuals: true }))
  })
}


module.exports.delete = function(req, res) {

  User.findOneAndRemove({ username: req.params.username }, function(err) {
    if (err) {
      return res.status(500).json({ error: err })
    } else {
      res.sendStatus(204)
    }
    
  })
}


module.exports.retrieve = function(req, res) {
  User.findOne({ username: req.params.username }, function(err, user) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!user) {
      return res.sendStatus(404)
    }

    res.json(user)
  })
}


module.exports.update = function(req, res) {
  var filter = ['scope', 'name', 'location', 'organization', 'position',
    'telephone', 'mobile', 'email', 'signature'
  ]
  
  if (req.user.role === 'superadmin') {
    filter.push('is_verified','role')
  }

  User.findOneAndUpdate({
    username: req.params.username
  }, _.pick(req.body, filter), { new: true }, function(err, user) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!user) {
      return res.sendStatus(404)
    }

    res.json(user)
  })
}


module.exports.updatePassword = function(req, res) {

  if (!req.body.oldPassword) {
    return res.status(400).json({ error: '缺少初始密码信息' })
  }

  if (!req.body.newPassword) {
    return res.status(400).json({ error: '缺少修改密码信息' })
  }

  User.findOne({ username: req.params.username }, function(err, user) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!user || !user.validPassword(req.body.oldPassword)) {
      return res.status(401).json({ error: '用户密码错误' })
    } else {
      user.password = req.body.newPassword
      user.save(function (err, newuser) {
        if (err) {
          return res.status(500).json({ error: err })
        }

        res.json(newuser.toJSON({ virtuals: true }))
      })
    }

  })

}


module.exports.uploadAvatar = function(req, res) {
  var filePath = req.files[0].path
  var username = req.params.username

  async.autoInject({
    avatar: function(callback) {
      gm(filePath).resize(100, 100, '!').toBuffer('png', callback)
    },
    writeDB: function(avatar, callback) {
      User.findOneAndUpdate({ username: username }, { avatar: avatar }, { new: true }, callback)
    }
  }, function(err, results) {
    fs.unlink(filePath, function() {})

    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!results.writeDB) {
      return res.sendStatus(404)
    }

    res.type('png')
    res.send(results.writeDB.avatar)
  })
}


module.exports.downloadAvatar = function(req, res) {
  User.findOne({ username: req.params.username }, function(err, user) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!user || !user.avatar) {
      return res.sendStatus(404)
    }

    res.type('png')
    res.send(user.avatar)
  })
}


module.exports.list = function(req, res) {
  User.find({
    role: {$ne: 'superadmin'}
  }, function(err, users) {
    if (err) {
      return res.status(500).json({ error: err })
    }
    res.json(users)
  }).sort({ createdAt: -1 })
}
