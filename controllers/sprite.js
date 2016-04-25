var Sprite = require('../models/sprite')
var this_sprite = require('../tools/sprite')

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

    res.status(200).json(sprite)
  })
}
