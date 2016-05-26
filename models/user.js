var crypto = require('crypto')
var mongoose = require('mongoose')
var jwt = require('jsonwebtoken')
var select = require('mongoose-json-select')
var config = require('../config')


var UserSchema = new mongoose.Schema({
  username: { type: String, index: { unique: true } },
  salt: String,
  hash: String,
  access_token: String,
  is_verified: Boolean,

  // profile
  name: String,
  email: String,
  phone: String,
  location: String,
  organization: String
}, { timestamps: true })


UserSchema.plugin(select, '-_id -salt -hash -__v')


UserSchema.virtual('password').set(function(password) {
  this.salt = crypto.randomBytes(16).toString('hex')
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex')
})


UserSchema.methods.updateAccessToken = function() {
  this.access_token = jwt.sign({ username: this.username }, config.jwt_secret, { expiresIn: '30d' })
}


UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex')
  return this.hash === hash
}


module.exports = mongoose.model('User', UserSchema)
