var mongoose = require('mongoose');
var config = require('../config');
var async = require('async');
var pg = require('pg');
var _ = require('lodash');
var fs = require('fs');

var userDownloads = [
  {
    "organization": "中国地图出版集团",
    "location": "中图社",
    "name": "郑伟",
    "username": "Zhongtu01",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 1411
  },
  {
    "location": "浙江省",
    "username": "Zhejiang33",
    "name": "陈卫青",
    "organization": "浙江省测绘与地理信息局",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 624
  },
  {
    "location": "四川省",
    "username": "Sichuan51",
    "name": "刘国强",
    "organization": "四川测绘地理信息局",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 196
  },
  {
    "location": "西藏自治区",
    "username": "Xizang54",
    "name": "旭红",
    "organization": "西藏自治区测绘局",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 170
  },
  {
    "location": "甘肃省",
    "username": "Gansu62",
    "name": "刘岩",
    "organization": "甘肃省测绘地理信息局成果地图处",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 107
  },
  {
    "location": "内蒙古自治区",
    "username": "Neimenggu15",
    "name": "石建军",
    "organization": "内蒙古自治区地图院",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 100
  },
  {
    "organization": "国家基础地理信息中心",
    "location": "国地信",
    "name": "admin_map",
    "username": "foxgis",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 78
  },
  {
    "location": "陕西省",
    "username": "Shanxi61",
    "name": "任建",
    "organization": "陕西测绘地理信息局地理信息与地图处",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 77
  },
  {
    "location": "福建省",
    "username": "Fujian35",
    "name": "潘虹英",
    "organization": "福建省测绘地理信息局测绘成果与地图管理处",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 73
  },
  {
    "location": "河南省",
    "username": "Henan41",
    "name": "杨晓超",
    "organization": "河南省地图院",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 72
  },
  {
    "location": "黑龙江省",
    "username": "Heilongjiang23",
    "name": "周再强",
    "organization": "国家测绘地理信息局黑龙江基础地理信息中心",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 63
  },
  {
    "location": "广西壮族自治区",
    "username": "Guangxi45",
    "name": "鄢咏折",
    "organization": "广西壮族自治区测绘地理信息局",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 60
  },
  {
    "location": "山西省",
    "username": "Shanxi14",
    "name": "郭尚洁",
    "organization": "山西省测绘地理信息局地图编制与测绘成果处",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 44
  },
  {
    "location": "广东省",
    "username": "Guangdong44",
    "name": "魏巍",
    "organization": "广东省国土资源厅测绘管理处",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 42
  },
  {
    "location": "江苏省",
    "username": "Jiangsu32",
    "name": "江峰",
    "organization": "地理信息与地图管理处",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 30
  },
  {
    "location": "重庆市",
    "username": "Chongqing50",
    "name": "付强",
    "organization": "重庆市规划局（市测绘地理信息局）",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 30
  },
  {
    "location": "青海省",
    "username": "Qinghai63",
    "name": "杨燕",
    "organization": "青海省基础地理信息中心",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 30
  },
  {
    "location": "山东省",
    "username": "Shandong37",
    "name": "姚继兰",
    "organization": "山东省国土资源厅",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 29
  },
  {
    "location": "新疆维吾尔自治区",
    "username": "Xinjiang65",
    "name": "杨红英",
    "organization": "新疆维吾尔自治区测绘地理信息局地图管理处",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 28
  },
  {
    "location": "江西省",
    "username": "Jiangxi36",
    "name": "赵娜",
    "organization": "江西省测绘地理信息局",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 28
  },
  {
    "organization": "吉威",
    "location": "北京市",
    "name": "陈立生1",
    "username": "chenlisheng",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 28
  },
  {
    "location": "海南省",
    "username": "Hainan46",
    "name": "陈秋蓉",
    "organization": "海南测绘地理信息局成果管理与应用处",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 26
  },
  {
    "location": "辽宁省",
    "username": "Liaoning21",
    "name": "倪淑杰",
    "organization": "测绘成果管理处",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 24
  },
  {
    "location": "宁夏回族自治区",
    "username": "Ningxia64",
    "name": "郭建林",
    "organization": "宁夏国土资源厅基础测绘处",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 24
  },
  {
    "location": "吉林省",
    "username": "Jilin22",
    "name": "姜楠",
    "organization": "吉林省测绘地理信息局",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 19
  },
  {
    "location": "湖北省",
    "username": "Hubei42",
    "name": "李永丰",
    "organization": "湖北省地图院",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 18
  },
  {
    "organization": "geoway",
    "location": "北京市",
    "name": "万炎炎",
    "username": "wanyanyan",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 17
  },
  {
    "location": "上海市",
    "username": "Shanghai31",
    "name": "余音",
    "organization": "上海市测绘院计划业务处",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 10
  },
  {
    "location": "云南省",
    "username": "Yunnan53",
    "name": "赵孝玉",
    "organization": "云南省测绘地理信息局计划财务处",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 9
  },
  {
    "location": "天津市",
    "username": "Tianjin12",
    "name": "刘亚洁",
    "organization": "天津市规划局",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 8
  },
  {
    "location": "安徽省",
    "username": "Anhui34",
    "name": "方剑",
    "organization": "安徽省第四测绘院",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 8
  },
  {
    "location": "北京市",
    "username": "Beijing11",
    "name": "吴飞",
    "organization": "北京市测绘设计研究院",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 6
  },
  {
    "location": "贵州省",
    "username": "Guizhou52",
    "name": "陈伟亮",
    "organization": "贵州省国土资源厅",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 6
  },
  {
    "location": "河北省",
    "username": "Hebei13",
    "name": "贾成千",
    "organization": "河北省地理信息局",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 4
  },
  {
    "organization": "国家基础地理信息中心",
    "location": "国地信",
    "name": "王云帆",
    "username": "wyf",
    "statMaplands": [],
    "statTags": [],
    "statYears": [],
    "downloadNum": 1
  }
]

fs.readFile('data.json','utf-8',function(err, json) {
  //fs.unlink(collectionName+'_name.json');
  if (err) {
    return JSON.stringify({ error: err });
  }
  var data = JSON.parse(json);
  var result = [];

  for(var j=0;j<userDownloads.length;j++){
    var username = userDownloads[j].username;
    userDownloads[j].statMaplands = [];
    userDownloads[j].statTags = [];
    userDownloads[j].statYears = [];
    for(var i=0;i<data.length;i++){
      if(data[i].downloadNum > 0){
        var owner = data[i].owner;
        var location = data[i].location;
        var year = data[i].year;
        var tags = data[i].tags;
        if(username === owner){

          var istag = false;
          for(var t=0;t<tags.length;t++){
            var temptag = tags[t];      
            for(var u=0;u<userDownloads[j].statTags.length;u++){
              istag = false;
              if(userDownloads[j].statTags[u].name === temptag){
                userDownloads[j].statTags[u].count += data[i].downloadNum;
                istag = true;
                break;
              }
            }
            if(!istag){
              var tempStat = {
                name: temptag,
                count: data[i].downloadNum
              }
              userDownloads[j].statTags.push(tempStat);
            }
          }

          var isYear = false;
          for(var k=0;k<userDownloads[j].statYears.length;k++){
            isYear = false;
            if(userDownloads[j].statYears[k].name === year){
              userDownloads[j].statYears[k].count += data[i].downloadNum;
              isYear = true;
              break;
            }
          }
          if(!isYear){
            var tempStat = {
              name: year,
              count: data[i].downloadNum
            }
            userDownloads[j].statYears.push(tempStat);
          }

          var isLocation = false;
          for(var m=0;m<userDownloads[j].statMaplands.length;m++){
            isLocation = false;
            if(userDownloads[j].statMaplands[m].name === location){
              userDownloads[j].statMaplands[m].count += data[i].downloadNum;
              isLocation = true;
              break;
            }
          }
          if(!isLocation){
            var tempStat = {
              name: location,
              count: data[i].downloadNum
            }
            userDownloads[j].statMaplands.push(tempStat);
          }
        }
      }
    }
    fs.appendFile("stat.json",JSON.stringify(userDownloads[j])+",\n");
  }

})

