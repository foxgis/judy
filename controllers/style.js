var validate = require('mapbox-gl-style-spec').validate
var Style = require('../models/style')


module.exports.list = function(req, res) {
  Style.find({ owner: req.params.username },
    'style_id owner create_at modify_at version name',
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
  if (errors) {
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
  Style.findOne({ owner: req.params.username, style_id: req.params.style_id }, function(err, style) {
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
  Style.findOne({ owner: req.params.username, style_id: req.params.style_id }, function(err, style) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    if (!style) {
      res.sendStatus(404)
      return
    }


  })
}


module.exports.delete = function(req, res) {
  Style.findOne({ owner: req.params.username, style_id: req.params.style_id }, function(err, style) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    if (!style) {
      res.sendStatus(404)
      return
    }

    style.remove(function(err) {
      if (err) {
        res.status(500).json({ error: err })
        return
      }

      res.sendStatus(204)
    })
  })
}
