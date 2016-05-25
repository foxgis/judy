var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var async = require('async')
var mkdirp = require('mkdirp')
var fontmachine = require('fontmachine')
var Font = require('../models/font')


module.exports.list = function(req, res) {
  Font.find({
    owner: req.params.username,
    is_deleted: false
  }, function(err, fonts) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(fonts)
  })
}


module.exports.create = function(req, res) {
  var ext = path.extname(req.files[0].originalname)
  if (ext !== '.ttf' && ext !== '.otf') {
    return res.status(400).json({ error: '仅支持ttf、otf字体文件' })

  } else {
    fs.readFile(req.files[0].path, function(err, buffer) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      fs.unlink(req.files[0].path)

      fontmachine.makeGlyphs({ font: buffer, filetype: ext }, function(err, font) {
        if (err) {
          return res.status(500).json({ error: err })
        }

        var fontdir = path.join('fonts', req.params.username, font.name)
        mkdirp(fontdir, function(err) {
          if (err) {
            return res.status(500).json({ error: err })
          }
          async.each(font.stack, function(pbf, callback) {
            fs.writeFile(path.join(fontdir, pbf.name), pbf.data, callback)
          }, function(err) {
            if (err) {
              return res.status(500).json({ error: err })
            }

            Font.findOneAndUpdate({
              fontname: font.name,
              owner: req.params.username
            }, {
              fontname: font.name,
              owner: req.params.username,
              is_deleted: false
            }, { upsert: true, new: true, setDefaultsOnInsert: true}, function(err, font) {
              if (err) {
                return res.status(500).json({ error: err })
              }

              res.status(200).json(font)
            })
          })
        })
      })
    })
  }
}


module.exports.retrieve = function(req, res) {
  Font.findOne({
    fontname: req.params.fontname,
    owner: req.params.username
  }, function(err, font) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!font) {
      return res.sendStatus(404)
    }

    res.status(200).json(font)
  })
}


module.exports.update = function(req, res) {
  var filter = ['scope']

  Font.findOneAndUpdate({
    fontname: req.params.fontname,
    owner: req.params.username
  }, _.pick(req.body, filter), { new: true }, function(err, font) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!font) {
      return res.sendStatus(404)
    }

    res.status(200).json(font)
  })
}


module.exports.delete = function(req, res) {
  Font.findOneAndUpdate({
    style_id: req.params.style_id,
    owner: req.params.username
  }, { is_deleted: true }, function(err) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.sendStatus(204)
  })
}


module.exports.download = function(req, res) {
  var filePath = path.join('fonts', req.params.username, req.params.fontname, req.params.range + '.pbf')

  fs.readFile(filePath, function(err, pbf) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    return res.status(200).send(pbf)
  })
}
