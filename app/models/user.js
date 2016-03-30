var mongoose = require('mongoose')
var crypto = require('crypto')
var jwt = require('jsonwebtoken')
var Schema = mongoose.Schema

/* 用户schema，可扩展 */
var UserSchema = new Schema({
  email:String,
  name:String,
  username: {type:String,required:true,index:{unique:true}},
  hash:String,
  salt:String,
  create_at:Date
})

// /* 添加创建时间 */
// UserSchema.pre('save', function(next) {

//   var user = this
//   user.create_at = new Date();

// /* 为后期修改用户信息做扩展 */
//   if(!user.isModified('password')) {
//       return next();
//     } else {
//       user.setPassword(user.password)
//       next()
//     }
// })

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

  /* 设置token的有效期 */
  var expiry = new Date()
  expiry.setDate(expiry.getDate() + 7)

  return jwt.sign({
    _id: this._id,
    name: this.name,
    exp: parseInt(expiry.getTime() / 1000)
  },process.env.JWT_SECRET)
}

module.exports = mongoose.model('User',UserSchema)


