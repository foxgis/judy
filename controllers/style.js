var _ = require('underscore')
var validate = require('mapbox-gl-style-spec').validate
var Style = require('../models/style')


module.exports.list = function(req, res) {
  Style.find({ owner: req.params.username },
    'style_id owner version name createdAt updatedAt',
    function(err, styles) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      res.status(200).json(styles)
    }
  )
}


module.exports.create = function(req, res) {
  var errors = validate(req.body)
  if (errors.length > 0) {
    res.status(400).json(errors)
    return
  }

  var style = new Style(req.body)
  style.owner = req.params.username

  style.save(function(err) {
    if (err) {
      res.status(500).json({ error: err })
      return
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
      res.status(500).json({ error: err })
      return
    }

    if (!style) {
      res.sendStatus(404)
      return
    }

    res.status(200).json(style)
  })
}


module.exports.update = function(req, res) {
  var filter = ['_id', 'style_id', 'owner', 'createdAt', 'updatedAt', '__v']

  Style.findOneAndUpdate({
    style_id: req.params.style_id,
    owner: req.params.username
  }, _.omit(req.body, filter), { new: true }, function(err, style) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    if (!style) {
      res.sendStatus(404)
      return
    }

    res.status(200).json(style)
  })
}


module.exports.delete = function(req, res) {
  Style.findOneAndRemove({
    owner: req.params.username,
    style_id: req.params.style_id
  }, function(err) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    res.sendStatus(204)
  })
}
