var path = require('path')
var AdmZip = require('adm-zip')
var Sprite = require('../models/sprite')

module.exports = function(req){
  var Name = []
  var Image = []
  var zip = new AdmZip(req.files[0].path)
  zip.getEntries().forEach(function(entry){
    var extname = path.extname(entry.entryName)
    if(extname === '.png'){
      var png_name = entry.entryName.replace(extname,'')
      Name.push(png_name)

      Image.push(zip.readFile(entry))
    }
  })
  zip.getEntries().forEach(function(entry){
    var extname = path.extname(entry.entryName)
    if(extname === '.json'){
      var json_name = entry.entryName.replace(extname,'')
      if(Name.indexOf(json_name) >= 0){
        var sprite = new Sprite({
          owner:req.params.username,
          name:json_name
        })
        var json = zip.readFile(entry)
        // sprite.json = json.toString()
        sprite.json = JSON.parse(json.toString().trim())
        sprite.image = Image[Name.indexOf(json_name)]

        sprite.save()

        Name.splice(Name.indexOf(json_name),1)
        Image.splice(Name.indexOf(json_name),1)
      }
    }
  })
}