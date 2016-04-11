var mongoose = require('mongoose')
var config = require('../config')
var jwt = require('jsonwebtoken')


var UserSchema = new mongoose.Schema({
  username: { type: String, index: { unique: true } },
  salt: String,
  hash: String,

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

UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex')
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex')
}

UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex')
  return this.hash === hash
}

UserSchema.methods.generateToken = function() {
  return jwt.sign({
    username: this.username,
  }, config.jwt_secret, {
    expiresIn: '7d'
  })
}

module.exports = mongoose.model('User', UserSchema)
