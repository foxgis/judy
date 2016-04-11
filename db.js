var mongoose = require('mongoose')
var config = require('./config')

mongoose.connect(config.db)

mongoose.connection.on('connected', function() {
  console.log('Mongoose connected to ' + config.db)
})

mongoose.connection.on('error', function(err) {
  console.log('Mongoose connection error: ' + err)
})

mongoose.connection.on('disconnected', function() {
  console.log('Mongoose disconnected')
})


module.exports = mongoose
