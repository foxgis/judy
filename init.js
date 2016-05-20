var Font = require('./models/font')


Font.findOneAndUpdate({
  owner: 'foxgis',
  fontname: '宋体'
}, { owner: 'foxgis', scope: 'public', fontname:'宋体'}
,{ upsert: true }, function(){})

Font.findOneAndUpdate({
  owner: 'foxgis',
  fontname: '楷体'
}, { owner: 'foxgis', scope: 'public', fontname: '楷体' }
,{ upsert: true }, function(){})

Font.findOneAndUpdate({
  owner: 'foxgis',
  fontname: '黑体'
}, { owner: 'foxgis', scope: 'public', fontname: '黑体' }
,{ upsert: true }, function(){})

Font.findOneAndUpdate({
  owner: 'foxgis',
  fontname: '仿宋'
}, { owner: 'foxgis', scope: 'public', fontname: '仿宋' }
,{ upsert: true }, function(){})

Font.findOneAndUpdate({
  owner: 'foxgis',
  fontname: '隶书'
}, { owner: 'foxgis', scope: 'public', fontname: '隶书' }
,{ upsert: true }, function(){})
