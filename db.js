var mongoose = require('mongoose')
var config = require('./config')

//mongoose.Promise = global.Promise
mongoose.connect(config.DB)

/* eslint-disable no-console */
mongoose.connection.on('connected', function() {
  console.log('Mongoose connected to ' + config.DB)
})


mongoose.connection.on('error', function(err) {
  console.log('Mongoose connection error: ' + err.message)
})


mongoose.connection.on('disconnected', function() {
  console.log('Mongoose disconnected')
})


process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination')
    process.exit(0)
  })
})


module.exports = mongoose
