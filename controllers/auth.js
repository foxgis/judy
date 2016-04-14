var jwt = require('jsonwebtoken')
var config = require('../config')
var User = require('../models/user')

module.exports = function(req, res, next) {
  var access_token = req.query.access_token || req.cookies.access_token || req.headers['x-access-token']
  if (!access_token) {
    res.status(400).json({ error: 'access_token缺失' })
    return
  }


  jwt.verify(access_token, config.jwt_secret, function(err, decoded) {
    if (err) {
      res.status(401).json(err)
      return
    }

    User.findOne({ username: decoded.username }, function(err, user) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      // 用户身份认证
      if (!user) {
        res.status(404).json({ error: '用户不存在' })
        return
      }

      if (user.access_token !== access_token) {
        res.status(401).json({error: 'access_token失效'})
        return
      }

      // 资源权限认证
      var resourceType = req.url.split('/')[1]
      if (resourceType === 'users') {
        if (decoded.username !== req.params.username) {
          res.status(401).json({error: 'access_token与用户不匹配'})
          return
        }
      }

      next()
    })
  })
}
