var crypto = require('crypto')
var mongoose = require('mongoose')
var jwt = require('jsonwebtoken')
var select = require('mongoose-json-select')


//该模块定义了一个schema，对应Mongodb数据库中的users集合，并导出模型，使其执行数据库CURD操作
var UserSchema = new mongoose.Schema({
  username: { type: String, index: { unique: true } },
  salt: String,
  hash: String,
  role: { type: String, default: 'user'},
  scope: { type: String, default: 'public'},
  is_verified: { type: Boolean, default: false },
  downloadNum: { type: Number, default: 0 },

  // 用户资料
  name: String,
  location: String,
  organization: String,
  position: String,
  telephone: String,
  mobile: String,
  email: String,
  signature: String,
  avatar: Buffer
}, { timestamps: true })


UserSchema.plugin(select, '-_id -__v -salt -hash -avatar')


//注册用户时根据密码生成哈希码
UserSchema.virtual('password').set(function(password) {
  this.salt = crypto.randomBytes(16).toString('hex')
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex')
})


//用户登录成功后返回新的access_token
UserSchema.virtual('access_token').get(function() {
  return jwt.sign({ username: this.username }, this.salt, { expiresIn: '7d' })
})


//验证用户密码的正确性
UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex')
  return this.hash === hash
}

UserSchema.index({ downloadNum: -1 })

module.exports = mongoose.model('User', UserSchema)
