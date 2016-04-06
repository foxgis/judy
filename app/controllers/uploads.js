/* 涉及文件系统的操作 */
var multiparty = require('multiparty');
var fs = require('fs')

var sendJSONresponse = function(res, status, content) {
  res.status(status)
  res.json(content)
}

module.exports.uploadFile = function(req, res) {

  var form = new multiparty.Form({uploadDir: './public/uploads/'});
  form.parse(req, function(err, fields, files) {
    console.log(fields.username);
    if(err){
      console.log('parse error: ' + err);
    } else {
      var inputFiles = files.inputFile
      for(var i=0,length=inputFiles.length;i<length;i++){
        var file = inputFiles[0]
        var uploadedPath = file.path;
        var dstPath = 'public/uploads/' + file.originalFilename;
        //重命名为真实文件名
        fs.rename(uploadedPath, dstPath, function(err) {
          if(err){
            console.log('rename error: ' + err);
            sendJSONresponse(res,502,{
              'message':'重命名失败'
            })
          } else {
            console.log('rename ok');
            sendJSONresponse(res,200,{
              'message':'上传成功'
            })
          }
        });
      }
    }
  })


}
