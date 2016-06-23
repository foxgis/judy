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
  var ext = path.extname(req.files[0].originalname).toLowerCase()

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
      fontdir: function(font, callback) {
        var fontdir = path.join('fonts', username, font.name)
        mkdirp(fontdir, function(err) {
          callback(err, fontdir)
        })
      },
      writePbf: function(font, fontdir, callback) {
        async.each(font.stack, function(pbf, next) {
          fs.writeFile(path.join(fontdir, pbf.name), pbf.data, next)
        }, callback)
      },
      writeFile: function(buffer, font, fontdir, callback) {
        fs.writeFile(fontdir + ext, buffer, callback)
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
          })
        }

        Font.findOneAndUpdate({
          fontname: newFont.fontname,
          owner: newFont.owner
        }, newFont, { upsert: true, new: true, setDefaultsOnInsert: true }, callback)
      }
    }, function(err, results) {
      fs.unlink(filePath)

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
    if (!err) {
      res.set('Content-Encoding', 'gzip')
      return res.status(200).send(pbf)
    }

    return res.sendStatus(404)
  })
}


module.exports.downloadRaw = function(req, res) {
  var fontdir = path.join('fonts', req.params.username, req.params.fontname)
  var ttf = fontdir + '.ttf'
  var otf = fontdir + '.otf'

  fs.readFile(ttf, function(err, font) {
    if (!err) {
      res.attachment(ttf)
      return res.send(font)
    }

    fs.readFile(otf, function(err, font) {
      if (!err) {
        res.attachment(otf)
        return res.send(font)
      }

      return res.sendStatus(404)
    })
  })
}


module.exports.preview = function(req, res) {
  var fontname = req.params.fontname
  var fontdir = path.join('fonts', req.params.username, fontname)
  var ttf = fontdir + '.ttf'
  var otf = fontdir + '.otf'

  fs.access(ttf, fs.R_OK, function(err) {
    if (!err) {
      res.set('Content-Type', 'image/png')
      return gm(620, 60, '#FFFFFFFF')
        .font(ttf)
        .fontSize(40)
        .fill('#404040')
        .drawText(0, 45, fontname)
        .stream('png')
        .pipe(res)
    }

    fs.access(otf, fs.R_OK, function(err) {
      if (!err) {
        res.set('Content-Type', 'image/png')
        return gm(620, 60, '#FFFFFFFF')
          .font(otf)
          .fontSize(40)
          .fill('#404040')
          .drawText(0, 45, fontname)
          .stream('png')
          .pipe(res)
      }

      res.sendStatus(404)
    })
  })
}
