var path = require('path')
var AdmZip = require('adm-zip')
var Sprite = require('../models/sprite')

module.exports = function(owner, filename, callback) {
  var zip = new AdmZip(filename)
  var sprite = new Sprite({
    owner: owner,
    name: path.basename(filename)
  })

  zip.getEntries().forEach(function(entry) {
    var extname = path.extname(entry.entryName)
    if (extname === '.json') {
      var json = zip.readFile(entry)
      sprite.json = JSON.parse(json)
    } else if (extname === '.png') {
      sprite.image = zip.readFile(entry)
    }
  })

  sprite.save(function(err) {
    if (err) {
      return callback(err)
    }

    callback(null, sprite.sprite_id)
  })
}
