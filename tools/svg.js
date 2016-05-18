var AdmZip = require('adm-zip')
var path = require('path')
var Sprite = require('../models/sprite')
var spritezero = require('spritezero')


module.exports = function(owner, file, callback) {
  var zip = new AdmZip(file)
  var sprite = new Sprite({
    owner: owner
  })

  var imgs = new Array
  zip.getEntries().forEach(function(entry){
    var img = {
      svg: zip.readFile(entry),
      id: path.basename(entry.entryName, path.extname(entry.entryName))
    }

    imgs.push(img)
  })

  spritezero.generateLayout(imgs, 2, false, function(err, layout){
    if (err) {
      return callback(err)
    }
    spritezero.generateImage(layout, function(err, png){
      if (err) {
        return callback(err)
      }

      sprite.image = png
      spritezero.generateLayout(imgs, 2, true, function(err, json){
        if (err) {
          return callback(err)
        }

        sprite.json = json
        sprite.save(function(err) {
          if (err) {
            return callback(err)
          }

          callback(null, sprite.sprite_id)
        })
      })
    })
  })  
}
