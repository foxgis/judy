var path = require('path')
var AdmZip = require('adm-zip')
var Sprite = require('../models/sprite')

module.exports = function(req){
  var zip = new AdmZip(req.files[0].path)
  var sprite = new Sprite({
    owner:req.params.username,
    name:req.files[0].originalname
  })

  zip.getEntries().forEach(function(entry){
    var extname = path.extname(entry.entryName)
    if(extname === '.json'){
      var json = zip.readFile(entry)
      sprite.json = json.toString()
    }else if(extname === '.png'){
      sprite.image = zip.readFile(entry)
    }
  })

  sprite.save()
}