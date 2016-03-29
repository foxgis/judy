var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bodyParser = require('body-parser')

var StyleSchema = new Schema({
  version: Number,  /* According to the spec, must be 8 */
  center: [Number],  /* [lng, lat] */
  bearing: Number,
  created: Date,
  modified: Date,
  name: String,
  owner: String,
  draft: Boolean,
  transition: {
    duration: Number,
    delay: Number
  },
  id: String,
  sources:[{
    type:String,
    url: String,
  }],
  layers:[{
    id: String,
    type: String, /* fill,line,symbol,circle,raster,backgroud*/
    metadata: Schema.Types.Mixed,
    center: [Number], /* [lng,lat] */
    zoom: Number
  }],
  image:{
    type: String, /* default to image */
    url: String,
    coordinates: [[Number]] /* [[lng,lat],[lng,lat]] */
  },
  video: {
    type: String, /* default to video */
    urls: [String],
    coordinates: [[Number]]
  },
  sprite: String, /* link to the symbols */
  glyphs: String, /* link to the font */
  zoom: Number  /* current zoom level */
})

module.exports = mongoose.model('Style',StyleSchema)
