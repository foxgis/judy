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

  // profile
  name: String,
  email: String,
  phone: String,
  organization: String,
  avatar: String,

  groups: [String],
  is_verified: { type: Boolean, default: false },
  create_at: { type: Date, default: Date.now }
})


// user.toJSON()时默认排除掉敏感字段
UserSchema.plugin(select, '-_id -salt -hash -__v')


UserSchema.virtual('password').set(function(password) {
  this.salt = crypto.randomBytes(16).toString('hex')
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex')
})


UserSchema.methods.updateAccessToken = function() {
  this.access_token = jwt.sign({ username: this.username }, config.jwt_secret, { expiresIn: '7d' })
}


UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex')
  return this.hash === hash
}


module.exports = mongoose.model('User', UserSchema)
