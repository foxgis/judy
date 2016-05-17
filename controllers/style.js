var _ = require('lodash')
var validate = require('mapbox-gl-style-spec').validate
var Style = require('../models/style')
var Group = require('../models/group')


module.exports.list = function(req, res) {
  Style.find({ owner: req.params.username },
    'style_id owner version name createdAt updatedAt scopes tags',
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
  var styles = new Array

  (function loop(i, callback){
    if (i < 1) {
      Group.find({ members: req.user.username }
        , function(err, groups) {
          if (err) {
            return res.status(500).json({ error: err})
          }

          if (!groups) {
            Style.find({
              scopes: 'public'
            }, function(err, publicstyles) {
              if (err) {
                return res.status(500).json({ error: err})
              }

              publicstyles.forEach(function(style){
                styles.splice(0, 0, style)
              })

              loop(i+1, callback)
            })
          }

          groups.forEach(function(group){
            Style.find({
              scopes: group.group_id
            }, function(err, groupstyles) {
              if (err) {
                return res.status(500).json({ error: err})
              }

              groupstyles.forEach(function(style){
                styles.splice(0, 0, style)
              })

              Style.find({
                scopes: 'public'
              }, function(err, publicstyles) {
                if (err) {
                  return res.status(500).json({ error: err})
                }

                publicstyles.forEach(function(style){
                  styles.splice(0, 0, style)
                }) 

                loop(i+1, callback)
              })
            })
          })
        }
      )
    }
    else{
      callback()
    }
  }(0, function(){
    styles.forEach(function(style){
      if (style === undefined || style.tags.indexOf(req.query.search) < 0) {
        styles.splice(styles.indexOf(style), 1)
      }
    })

    return res.status(200).json(styles)
  }))
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
