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


module.exports.search = function(req, res) {
  var page = 1
  if (req.query.page) {
    page = req.query.page
  }

  var pagesize = 20
  var finalStyles = new Array
  var filter = ['style_id','owner','version','name','createdAt','updatedAt','tags']

  Group.find({ members: req.user.username }
    , function(err, groups) {
      if (err) {
        return res.status(500).json({ error: err})
      }

      var scopes = ['public']
      groups.forEach(function(group){
        scopes.push(group.group_id)
      })

      Style.find({
        scopes: {$in: scopes},
        tags: req.query.search
      }, function(err, styles) {
        if (err) {
          return res.status(500).json({ error: err})
        }

        if (!styles) {
          return res.sendStatus(404)
        }

        styles.forEach(function(style){
          finalStyles.push(_.pick(style, filter))
        })

        return res.status(200).json(finalStyles)

      }).skip(pagesize*(page-1)).limit(pagesize)
    }
  )
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
