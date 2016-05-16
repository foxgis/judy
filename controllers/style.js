var _ = require('lodash')
var validate = require('mapbox-gl-style-spec').validate
var Style = require('../models/style')
var Group = require('../models/group')


module.exports.list = function(req, res) {
  Style.find({ owner: req.params.username },
    'style_id owner version name createdAt updatedAt',
    function(err, styles) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      res.status(200).json(styles)
    }
  )
}


module.exports.create = function(req, res) {
  var errors = validate(req.body)
  if (errors.length > 0) {
    return res.status(400).json(errors)
  }

  var style = new Style(req.body)
  style.owner = req.params.username

  style.save(function(err) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(style)
  })
}


module.exports.retrieve = function(req, res) {
  Style.findOne({
    owner: req.params.username,
    style_id: req.params.style_id
  }, function(err, style) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!style) {
      return res.sendStatus(404)
    }

    if (req.user.username === req.params.username) {
      return res.status(200).json(style)
    }
    else {
      return res.status(200).json(_.omit(style.toJSON(), 'scopes'))
    }
  })
}


module.exports.update = function(req, res) {
  var filter = ['_id', 'style_id', 'owner', 'createdAt', 'updatedAt', '__v']

  if (!req.body.share && !req.body.unshare) {
    Style.findOneAndUpdate({
      style_id: req.params.style_id,
      owner: req.params.username,
      is_deleted: false
    }, _.omit(req.body, filter), { new: true }, function(err, style) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!style) {
        return res.sendStatus(404)
      }

      res.status(200).json(style)
    })
  }
  else {
    Style.findOne({
      style_id: req.params.style_id,
      owner: req.params.username,
      is_deleted: false
    }, function(err, style){
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!style) {
        return res.sendStatus(404)
      }

      if (req.body.share === 'public') {
        if (style.scopes[0] === 'public') {
          return res.status(200).json(style)
        }
        else if (style.scopes[0] === 'private') {
          style.scopes.splice(0, 1, 'public')
        }
        else {
          style.scopes.splice(0, 0, 'public')
        }
      }
      else if (req.body.share && req.body.share !== 'public') {
        if (style.scopes.indexOf(req.body.share) > -1) {
          return res.status(200).json(style)
        } 
        else if (style.scopes[0] === 'private') {
          style.scopes.splice(0, 1, req.body.share)
        }
        else {
          style.scopes.push(req.body.share)
        }
      }
      else if (req.body.unshare === 'public') {
        if (style.scopes[0] !== 'public') {
          return res.status(200).json(style)
        }
        else if (style.scopes.length === 1) {
          style.scopes = ['private']
        }
        else {
          style.scopes.splice(0, 1)
        }
      }
      else {
        if (style.scopes.indexOf(req.body.unshare) < 0) {
          return res.status(200).json(style)
        } 
        else if (style.scopes.length === 1) {
          style.scopes = ['private']
        }
        else {
          style.scopes.splice(style.scopes.indexOf(req.body.unshare), 1)
        }
      }

      style.save(function(err){
        if (err) {
          return res.status(500).json({ error: err})
        }

        return res.status(200).json(style)
      })
    })
  }
}


module.exports.search = function(req, res) {
  Style.find({
    tags: req.body.search
  }, function(err, styles){
    if (err) {
      return res.status(500).json({ error: err})
    }

    if (!styles) {
      return res.sendStatus(404)
    }

    (function stylesLoop(i, callback){
      if (i < styles.length) {
        var style = styles[i]

        if (style.owner !== req.user.username && style.scopes[0] === 'private') {
          styles.splice(styles.indexOf(style),1)
          stylesLoop(i+1, callback)
        }
        else if (style.owner !== req.user.username && style.scopes[0] !== 'public') {
          style.scopes.forEach(function(scope){
            Group.findOne({
              group_id: scope
            }, function(err, group) {
              if (err) {
                return res.status(500).json({ error: err})
              }

              if (!group || group.members.indexOf(req.user.username) < 0) {
                styles.splice(styles.indexOf(style),1)
              }

              stylesLoop(i+1, callback)
            })
          })
        }
      }
    }(0, function(){ return res.status(200).send(styles)}))

    var i = 0

    if (i < styles.length) {
      i++
      var style = styles[i]

      if (style.owner !== req.user.username && style.scopes[0] === 'private') {
        styles.splice(styles.indexOf(style),1)
      }
      else if (style.owner !== req.user.username && style.scopes[0] !== 'public') {
        style.scopes.forEach(function(scope){
          Group.findOne({
            group_id: scope
          }, function(err, group) {
            if (err) {
              return res.status(500).json({ error: err})
            }

            if (!group || group.members.indexOf(req.user.username) < 0) {
              styles.splice(styles.indexOf(style),1)
            }
          })
        })
      }
    }
    else {
      return res.status(200).send(styles)
    }
  })
}


module.exports.delete = function(req, res) {
  Style.findOneAndUpdate({
    owner: req.params.username,
    style_id: req.params.style_id,
    is_deleted: false
  }, { is_deleted: true }, function(err) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.sendStatus(204)
  })
}
