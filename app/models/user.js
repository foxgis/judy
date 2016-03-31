var mongoose = require('mongoose')
var crypto = require('crypto')
var jwt = require('jsonwebtoken')
var Schema = mongoose.Schema

/* 用户schema，可扩展 */
var UserSchema = new Schema({
  username: {type: String, index: { unique: true }},
  email:{type:String},
  name:{type:String},
  hash:{type:String},
  salt:{type:String},
  create_at:{type:Date, default:Date.now}
})

/* 密码设置，只保存salt和hash */
UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex')
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000,64,'sha512').toString('hex')
}

/* 通过hash验证用户 */
UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64,'sha512').toString('hex')
  return this.hash === hash
}

/* 用户验证过后生成token返回给客户端，以后客户端发送token进行访问 */
UserSchema.methods.generateToken = function() {

  /* 设置token的有效期这里设置了7天，前端需要每次都提交这个token值 */
  return jwt.sign({
    _id: this._id,
    name: this.name,
    username:this.username
  },process.env.JWT_SECRET,{
    expiresIn:'7d'
  })
}

module.exports = mongoose.model('User',UserSchema)


