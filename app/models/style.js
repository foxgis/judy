var mongoose = require('mongoose')
var Schema = mongoose.Schema
var crypto = require('crypto')

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

StyleSchema.methods.setUniqueID = function(username) {
  var salt = crypto.randomBytes(16).toString('hex')
  /* 26位的uniqueID */
  this.id = crypto.pbkdf2Sync(username,salt,1000,64,'sha512').toString('hex').substring(0,26)
}

module.exports = mongoose.model('Style',StyleSchema)
