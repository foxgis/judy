var Sprite = require('../models/sprite')
var this_sprite = require('../tools/sprite')
var sharp = require('sharp')

module.exports.create = function(req,res){
  var sprite = this_sprite
  res.status(200).json(sprite)
}


module.exports.list = function(req, res) {
  Sprite.find({ owner: req.params.username },
    'sprite_id owner create_at name',
    function(err,sprites){
      if(err){
        res.status(500).json({ error: err })
        return
      }
      res.status(200).json(sprites)
    }
  )
}


module.exports.retrieve = function(req, res) {
  Sprite.findOne({
    owner: req.params.username,
    sprite_id: req.params.sprite_id
  }, function(err, sprite) {
    if (err) {
      res.status(500).json({ error: err })
      return
    }

    if (!sprite) {
      res.sendStatus(404)
      return
    }

    var scale = req.params.scale
    var format = req.params.format
    
    if(format === 'json' || format === undefined){
      if(scale === '@2x'){
        res = sprite.json
      }else{
        if(scale === undefined){
          for(var key in sprite.json){
            for(var k in sprite.json[key]){
              sprite.json[key][k] = sprite.json[key][k]/2
              res = sprite.json
            }
          } 
        }
      }
    }else if(format === 'png'){
      if(scale === '@2x'){
        res = sprite.image
      }else if(scale === undefined){
        var image = sharp(sprite.image)
        image
            .metadata
            .then(function(metadata){
              return image
                .resize(Math.round(metadata.width/2),Math.round(metadata.height/2))
                .png
                .toBuffer
            })
            .then(function(data){
              res = data
            })
      }
    }
  })
}
