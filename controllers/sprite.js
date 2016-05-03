var Sprite = require('../models/sprite')
var Image = require('lwip')


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

    if(!req.params.format || req.params.format === 'json'){
      sprite.json = JSON.parse(sprite.json)
      if(req.params.scale === '@2x'){
        res.status(200).json(sprite.json)
      }else{
        for(var key in sprite.json){
          sprite.json[key].x = sprite.json[key].x/2
          sprite.json[key].y = sprite.json[key].y/2
          sprite.json[key].height = sprite.json[key].height/2
          sprite.json[key].width = sprite.json[key].width/2
          sprite.json[key].pixelRatio = sprite.json[key].pixelRatio/2
        }
        res.status(200).json(sprite.json)
      }
    }
    if(req.params.format === 'png'){
      if(req.params.scale === '@2x'){
        res.type('png')
        res.status(200).send(sprite.image)
      }else{
        Image.open(sprite.image,'png',function(err,image){
          image.batch().scale(0.5).toBuffer('png',function(err,buffer){
            res.type('png')
            res.status(200).send(buffer)
          })
        })
      }
    }
  })
}

module.exports.delete = function(req, res){
  Sprite.findOneAndRemove({
    owner: req.params.username,
    sprite_id: req.params.sprite_id
  }, function(err) { 
    if (err) {
      res.status(500).json({ error: err })
      return
    }
    
    res.sendStatus(204)
  })
}
