var mongoose = require('mongoose')


var ImageSchema = new mongoose.Schema({
  tile_id: { type: String, index: true},
  tile_data: Buffer
})


module.exports = ImageSchema
