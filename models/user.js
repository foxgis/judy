var crypto = require('crypto')
var mongoose = require('mongoose')
var jwt = require('jsonwebtoken')
var select = require('mongoose-json-select')


var UserSchema = new mongoose.Schema({
  username: { type: String, index: { unique: true } },
  salt: String,
  hash: String,
  access_token: String,
  role: { type: String, default: 'user'},
  scope: { type: String, default: 'public'},
  is_verified: { type: Boolean, default: false },

  // profile
  name: String,
  email: String,
  phone: String,
  location: String,
  organization: String
}, { timestamps: true })


UserSchema.plugin(select, '-_id -__v -salt -hash -role')


UserSchema.virtual('password').set(function(password) {
  this.salt = crypto.randomBytes(16).toString('hex')
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex')
})


UserSchema.methods.updateAccessToken = function() {
  this.access_token = jwt.sign({ username: this.username }, this.salt, { expiresIn: '7d' })
}


UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex')
  return this.hash === hash
}


module.exports = mongoose.model('User', UserSchema)
