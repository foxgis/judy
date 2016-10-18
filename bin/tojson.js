/**
 * Created by wyy on 15-12-15.
 */
var xlsx = require('xlsx');
var fs = require('fs');

var workbook = xlsx.readFile("postgis.xlsx");
var code = [];var name=[];
var sheet= workbook.Sheets.Sheet1;
for(item in sheet){
    //console.log(item);
    if(item[0]==="E"){
        code.push(sheet[item].w);
    }else if(item[0]==="F"){
        name.push(sheet[item].w);
    }
}
var count = code.length;
var nodes = [];
for(var i=0;i<count;i++){
    var temp = {
      "value":code[i],
      "description":name[i]
    }
    nodes.push(temp);
    
}
fs.writeFileSync("field.json",JSON.stringify({"field":nodes}));