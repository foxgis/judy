var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var async = require('async')
var mkdirp = require('mkdirp')
var fontmachine = require('fontmachine')
var fontscope = require('font-scope')
var gm = require('gm')
var Font = require('../models/font')


module.exports.list = function(req, res) {
  Font.find({
    owner: req.params.username,
    is_deleted: false
  }, '-_id -__v -is_deleted', function(err, fonts) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(fonts)
  }).sort({ createdAt: -1 })
}


module.exports.upload = function(req, res) {
  var username = req.params.username
  var filePath = req.files[0].path
  var originalname = req.files[0].originalname
  var size = req.files[0].size

  var ext = path.extname(originalname).toLowerCase()

  if (ext !== '.ttf' && ext !== '.otf') {
    fs.unlink(filePath)
    return res.status(400).json({ error: '仅支持ttf、otf字体文件' })

  } else {
    async.autoInject({
      buffer: function(callback) {
        fs.readFile(filePath, callback)
      },
      font: function(buffer, callback) {
        fontmachine.makeGlyphs({ font: buffer, filetype: ext }, callback)
      },
      fontDir: function(font, callback) {
        var fontDir = path.join('fonts', username, font.name)
        mkdirp(fontDir, function(err) {
          callback(err, fontDir)
        })
      },
      writePbf: function(font, fontDir, callback) {
        async.each(font.stack, function(pbf, next) {
          fs.writeFile(path.join(fontDir, pbf.name), pbf.data, next)
        }, callback)
      },
      writeFile: function(buffer, fontDir, callback) {
        fs.writeFile(fontDir + path.extname(originalname), buffer, callback)
      },
      writeDB: function(writePbf, writeFile, font, callback) {
        var newFont = {
          fontname: font.name,
          owner: username,
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
          }),
          filename: originalname,
          filesize: size
        }

        var keys = ['scope']
        keys.forEach(function(key) {
          if (req.body[key]) {
            newFont[key] = req.body[key]
          }
        })

        Font.findOneAndUpdate({
          fontname: newFont.fontname,
          owner: newFont.owner
        }, newFont, { upsert: true, new: true, setDefaultsOnInsert: true }, callback)
      }
    }, function(err, results) {
      fs.unlink(filePath, function() {})

      if (err) {
        return res.status(500).json({ error: err })
      }

      res.json(results.writeDB)
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

    res.json(font)
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

    res.json(font)
  })
}


module.exports.delete = function(req, res) {
  Font.findOneAndUpdate({
    fontname: req.params.fontname,
    owner: req.params.username
  }, { is_deleted: true }, { new: true }, function(err, font) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!font) {
      return res.sendStatus(404)
    }

    res.sendStatus(204)
  })
}


module.exports.download = function(req, res) {
  var filePath = path.join('fonts', req.params.username,
    req.params.fontname, req.params.range + '.pbf')

  fs.readFile(filePath, function(err, pbf) {
    if (err) {
      return res.sendStatus(404)
    }

    res.set('Content-Encoding', 'gzip')
    res.set('Content-Type', 'application/x-protobuf')
    res.set('Expires', new Date(Date.now() + 604800000).toUTCString())
    return res.send(pbf)
  })
}


module.exports.downloadRaw = function(req, res) {
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

    var filename = font.fontname + path.extname(font.filename)
    var filePath = path.join('fonts', req.params.username, filename)

    res.download(path.resolve(filePath), filename, function(err) {
      if (err) {
        return res.status(err.status).end()
      }
    })
  })
}


module.exports.preview = function(req, res) {
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

    var filename = font.fontname + path.extname(font.filename)
    var filePath = path.join('fonts', req.params.username, filename)

    fs.access(filePath, fs.R_OK, function(err) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      res.type('png')
      gm(620, 60, '#FFFFFFFF')
        .font(filePath)
        .fontSize(40)
        .fill('#404040')
        .drawText(0, 45, font.fontname)
        .stream('png')
        .pipe(res)
    })
  })
}
