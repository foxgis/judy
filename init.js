var Font = require('./models/font')


Font.findOneAndUpdate({
  owner: 'foxgis',
  name: '宋体'
}, { owner: 'foxgis', scopes: ['public'], name: '宋体' }
,{ upsert: true }, function(){})

Font.findOneAndUpdate({
  owner: 'foxgis',
  name: '楷体'
}, { owner: 'foxgis', scopes: ['public'], name: '楷体' }
,{ upsert: true }, function(){})

Font.findOneAndUpdate({
  owner: 'foxgis',
  name: '黑体'
}, { owner: 'foxgis', scopes: ['public'], name: '黑体' }
,{ upsert: true }, function(){})

Font.findOneAndUpdate({
  owner: 'foxgis',
  name: '仿宋'
}, { owner: 'foxgis', scopes: ['public'], name: '仿宋' }
,{ upsert: true }, function(){})

Font.findOneAndUpdate({
  owner: 'foxgis',
  name: '隶书'
}, { owner: 'foxgis', scopes: ['public'], name: '隶书' }
,{ upsert: true }, function(){})
