var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var mongoose = require('mongoose')
var async = require('async')
var mkdirp = require('mkdirp')
var Grid = require('gridfs-stream')
var shortid = require('shortid')
var Template = require('../models/template')
var Buffer = require('buffer').Buffer


//该模块包含了对模板功能进行业务处理的各项函数

module.exports.list = function(req, res) {
  Template.find({
    is_deleted: false
  }, '-_id -__v -is_deleted -styleJSON', function(err, templates) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.status(200).json(templates)
  }).sort({ createdAt: -1 })
}


module.exports.retrieve = function(req, res) {
  Template.findOne({
    template_id: req.params.template_id,
    owner: req.params.username
  }, function(err, template) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!template) {
      return res.sendStatus(404)
    }

    res.status(200).json(template)
  })
}


module.exports.delete = function(req, res) {
  Template.findOneAndUpdate({
    template_id: req.params.template_id,
    owner: req.params.username
  }, { is_deleted: true }, function(err) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.sendStatus(204)
  })
}


module.exports.update = function(req, res) {
  var filter = ['name', 'replace']
  var updateData = _.pick(req.body, filter)

  if (req.body['styleJSON']) {
    updateData['styleJSON'] = Buffer.from(req.body['styleJSON'])
  }

  Template.findOneAndUpdate({
    template_id: req.params.template_id,
    owner: req.params.username
  }, updateData, { new: true }, function(err, template) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!template) {
      return res.sendStatus(404)
    }

    res.status(200).json(template)
  })
}


module.exports.updatejson = function(req, res) {
  var filter = ['name', 'replace']
  var updateData = _.pick(req.body, filter)

  fs.readFile(req.files[0].path, function(err, jsonBuffer) {
    fs.unlink(req.files[0].path)
    updateData['styleJSON'] = jsonBuffer
    Template.findOneAndUpdate({
      template_id: req.params.template_id,
      owner: req.params.username
    }, updateData, { new: true }, function(err, template) {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (!template) {
        return res.sendStatus(404)
      }

      res.status(200).json(template)
    })

  })
}


module.exports.getJSON = function(req, res) {
  Template.findOne({
    template_id: req.params.template_id,
    owner: req.params.username
  }, function(err, template) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!template) {
      return res.sendStatus(404)
    }
    
    res.set({ 'Content-Type': 'application/json' })
    res.status(200).send(template.styleJSON)
  })
}


module.exports.postImage = function(req, res) {
  var username = req.params.username
  var filePath = req.files[0].path
  var template_id = req.params.template_id
  var originalname = req.files[0].originalname
  var apiUrl = req.protocol + '://' + req.headers.host + req.baseUrl

  async.autoInject({
    fileDir: function(callback) {
      var fileDir = path.join('templates', username)
      mkdirp(fileDir, function(err) {
        callback(err, fileDir)
      })
    },
    newPath: function(fileDir, callback) {
      var newPath = path.join(fileDir, template_id)
      fs.rename(filePath, newPath, function(err) {
        callback(err, newPath)
      })
    },
    updateDB: function(newPath, callback) {

      var updateData = {}
      updateData.imageName = originalname
      updateData.thumb = {}
      updateData.thumb['background-image'] = 'url(\'' +apiUrl + '/templates/'+username+'/'+template_id+ '/image\')'

      Template.findOneAndUpdate({
        template_id: req.params.template_id,
        owner: req.params.username
      }, updateData, { new: true }, function(err, template) {
        callback(err, template)
      })
    }
  }, function(err, results) {
    fs.unlink(filePath, function() {})

    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json(results.updateDB)
  })
}


module.exports.getImage = function(req, res) {
  var filePath = path.join('templates', req.params.username, req.params.template_id)

  Template.findOne({
    template_id: req.params.template_id,
    owner: req.params.username
  }, function(err, template) {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (!template) {
      return res.sendStatus(404)
    }

    fs.readFile(filePath, function(err, buffer) {
      res.set({ 'Content-Type': 'image/jpeg' })
      res.status(200).send(buffer)
    })
  })
}


module.exports.upload = function(req, res) {
  var apiUrl = req.protocol + '://' + req.headers.host + req.baseUrl
  var template_id = shortid.generate()
  var gfs = Grid(mongoose.connection.db, mongoose.mongo)
  var writeStream = gfs.createWriteStream({
    filename: req.files[0].originalname
  })
  fs.createReadStream(req.files[0].path).pipe(writeStream)

  writeStream.on('error', function(err) {
    fs.unlink(req.files[0].path)
    return res.status(500).json({ error: err })
  })

  writeStream.on('close', function(template) {
    var thumb = {}
    thumb['background-image'] = 'url(\'' +apiUrl + '/templates/wanyanyan/rkXfofQc/image\')'
    var newTemplate = new Template({
      template_id: template_id,
      owner: req.params.username,
      style: template.filename,
      thumb: thumb
    })

    var keys = ['scope', 'name', 'replace']
    keys.forEach(function(key) {
      if (req.body[key]) {
        newTemplate[key] = req.body[key]
      }
    })

    fs.readFile(req.files[0].path, function(err, jsonBuffer) {
      fs.unlink(req.files[0].path)
      newTemplate.styleJSON = jsonBuffer
      newTemplate.save(function(err) {
        if (err) {
          return res.status(500).json({ error: err })
        }

        return res.status(200).json(newTemplate)
      })
    })    
  })
}