var mongoose = require('mongoose')
var select = require('mongoose-json-select')


//该模块定义了一个schema，对应Mongodb数据库中的fonts集合，并导出模型，使其执行数据库CURD操作
var FontSchema = new mongoose.Schema({
  fontname: { type: String, index: true },
  owner: String,
  scope: { type: String, default: 'public' },
  is_deleted: { type: Boolean, default: false },

  family_name: String,
  style_name: String,
  coverages: [{
    name: String,
    id: String,
    count: Number,
    total: Number,
    _id: false
  }],

  filename: String,
  filesize: Number
}, { timestamps: true })


FontSchema.plugin(select, '-_id -__v -is_deleted')


module.exports = mongoose.model('Font', FontSchema)
