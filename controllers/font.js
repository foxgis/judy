var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var async = require('async')
var mkdirp = require('mkdirp')
var fontmachine = require('fontmachine')
var fontscope = require('font-scope')

var Font = require('../models/font')


module.exports.list = function(req, res) {
  Font.find({
    owner: req.params.username,
    is_deleted: false
  }, '-_id -__v -is_deleted', function(err, fonts) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(fonts)
  }).sort({ createdAt: -1 })
}


module.exports.create = function(req, res) {
  var ext = path.extname(req.files[0].originalname).toLowerCase()

  if (ext !== '.ttf' && ext !== '.otf') {
    fs.unlink(req.files[0].path)
    return res.status(400).json({ error: '仅支持ttf、otf字体文件' })

  } else {
    async.autoInject({
      buffer: function(callback) {
        fs.readFile(req.files[0].path, callback)
      },
      font: function(buffer, callback) {
        fontmachine.makeGlyphs({ font: buffer, filetype: ext }, callback)
      },
      fontdir: function(font, callback) {
        var fontdir = path.join('fonts', req.params.username, font.name)
        mkdirp(fontdir, function(err) {
          callback(err, fontdir)
        })
      },
      writeFile: function(buffer, fontdir, callback) {
        fs.writeFile(fontdir + ext, buffer, callback)
      },
      writePbf: function(font, fontdir, callback) {
        async.each(font.stack, function(pbf, callback2) {
          fs.writeFile(path.join(fontdir, pbf.name), pbf.data, callback2)
        }, callback)
      },
      writeDB: function(font, callback) {
        var newFont = {
          fontname: font.name,
          owner: req.params.username,
          is_deleted: false,
          family_name: font.metadata.family_name,
          style_name: font.metadata.style_name,
          coverages: fontscope([font.codepoints]).map(function(coverage) {
            return {
              name: coverage.name,
              id: coverage.id,
              count: coverage.count,
              total: coverage.total
            }
          })
        }

        Font.findOneAndUpdate({
          fontname: newFont.fontname,
          owner: newFont.owner
        }, newFont, { upsert: true, new: true, setDefaultsOnInsert: true }, callback)
      }
    }, function(err, results) {
      fs.unlink(req.files[0].path)

      if (err) {
        return res.status(500).json({ error: err })
      }

      res.status(200).json(results.writeDB)
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
    fontname: req.params.fontname,
    owner: req.params.username
  }, { is_deleted: true }, function(err) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.sendStatus(204)
  })
}


module.exports.download = function(req, res) {
  var filePath = path.join('fonts', req.params.username,
    req.params.fontname, req.params.range + '.pbf')

  fs.readFile(filePath, function(err, pbf) {
    if (!err) {
      res.set('Content-Encoding', 'gzip')
      return res.status(200).send(pbf)
    }

    return res.sendStatus(404)
  })
}


module.exports.downloadRaw = function(req, res) {
  var ttf = path.join('fonts', req.params.username, req.params.fontname + '.ttf')
  var otf = path.join('fonts', req.params.username, req.params.fontname + '.otf')

  fs.readFile(ttf, function(err, font) {
    if (!err) {
      return res.status(200).send(font)
    }

    fs.readFile(otf, function(err, font) {
      if (!err) {
        return res.status(200).send(font)
      }

      return res.sendStatus(404)
    })
  })
}


module.exports.preview = function(req, res) {
  // var ratio = (req.params.scale || '@1x').slice(1, 2)
  // var color = '#' + req.params.color
  // var fontname = req.params.fontname

  var Canvas = require('canvas')
  var canvas = new Canvas(620, 60)
  var ctx = canvas.getContext('2d')

  ctx.font = 'normal 40px Impact, serif'
  ctx.fillText('serif', 0, 50)

  res.set('Content-Type', 'image/png')
  res.status(200).send(canvas.toBuffer())
}
