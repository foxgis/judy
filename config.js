var config = {
  db: 'mongodb://localhost/zootopia',
  jwt_secret: '29THD03',
  cacheSize: 10,
  sourceCacheSize: 10,
  blackList: [
    'admin',
    'guest',
    'foxgis'
  ]
}

module.exports = config
