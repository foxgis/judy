var config = {
  db: 'mongodb://localhost/zootopia',
  jwt_secret: '29THD03',
  cacheSize: 10,
  sourceCacheSize: 10,
  blacklist: [
    'foxgis',
    'admin',
    'guest'
  ]
}

module.exports = config
