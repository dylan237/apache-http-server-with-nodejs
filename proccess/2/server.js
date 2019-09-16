var http = require('http')
var fs = require('fs')
var path = require('path')
var template = require('art-template')
var server = http.createServer()

var wwwDir = './www'

server.on('request', function (req, res) {
  var timeFormater = function(RFCdate) {
    var millisecond = Date.parse(RFCdate) // RFC3999Date格式轉毫秒
    var dateObj = new Date(millisecond) 　// 轉時間物件
    return `${dateObj.toLocaleDateString()} ${dateObj.getHours()}:${dateObj.getMinutes()}`
  }
  // 錯誤頁面處理函式
  var toErrorPage = function () {
    res.setHeader('Content-type', 'text/html')
    return res.end('<h1>404 Not Found.</h1>')
  }
  // 傳入檔名，回傳content-type字串
  var returnContentType = function (fileName) {
    // path.extname => 取副檔名
    var deputy = path.extname(fileName)
    switch(deputy) {
      case '.html':
        return 'text/html; charset=utf-8'
        break
      case '.js':
        return 'application/x-javascript; charset=utf-8'
        break
      case '.css':
        return 'text/css; charset=utf-8'
        break
      case '.txt':
        return 'text/plain; charset=utf-8'
        break
      case '.jpg':
        return 'image/jpg'
        break
      case '.jpeg':
        return 'image/jpeg'
        break
      case '.png':
        return 'image/png'
        break
      default:
        return 'charset=utf-8'
        break
    }
  }
  var url = req.url
  var filePath
  // 在 Apache 中，當請求路徑為 / 時，預設回傳 index.html
  url === '/' ? filePath = '/index.html' : filePath = url
  var fullPath = wwwDir + filePath

  fs.access(fullPath, function (err) {
    if (err) {
      console.log('資源不存在')
      toErrorPage()
    } else {
      console.log('資源存在')
      if (fs.statSync(fullPath).isDirectory()) {
        console.log('路徑為資料夾')
        // 路徑為資料夾時，抓資料夾成員內容，透過模板引擎寫入資料夾成員到目錄頁面的HTML模板，並回傳到客戶端
        fs.readdir(fullPath, function (err, dirFiles) {
          if (err) {
            toErrorPage()
          }
          // 檢查該資料夾內是否有名為index的檔案，有則建立一個indexItem物件
          var indexItem = {}
          dirFiles.forEach((file) => {
            if (/index\./.test(file)) {
              indexItem = {
                hasIndexFile: true,
                fileName: file
              }
            }
          })
          // 如果有index，則回傳該檔案
          if (indexItem.hasIndexFile) {
            var indexPathLocation = fullPath + '/' + indexItem.fileName
            fs.readFile(indexPathLocation, function(err, indexFile) {
              if (err) {
                toErrorPage()
              }
              res.setHeader('Content-type', returnContentType(indexItem.fileName))
              res.end(indexFile)
            })
          } else {
            // 將 dirFiles 陣列資料套入模板引擎，產出出目錄頁面 HTML 字串，接著回傳給客戶端
            fs.readFile('./template.html', function (err, templateFile) {
              if (err) {
                toErrorPage()
              }
              var filesDetailInfo = dirFiles.map((file) => {
                // fs.statSync => 取得檔案或資料夾的詳細資料
                var statSync = fs.statSync(fullPath + '/' + file)
                var fileDetail = {
                  fileName: file,                           // 檔名
                  size: statSync.size,                      // 檔案大小
                  createTime: timeFormater(statSync.ctime), // 創建時間
                  mutateTime: timeFormater(statSync.mtime), // 修改時間
                }
                return fileDetail
              })
              var htmlStr = template.render(templateFile.toString(), {
                path: filePath,
                port: 9000,
                files: filesDetailInfo
              })
              res.end(htmlStr)
            })
          }
        })
      } else {
        // 路徑為檔案時，回傳該檔案
        console.log('路徑為一般檔案')
        fs.readFile(fullPath, function (error, data) {
          if (error) {
            toErrorPage()
          }
          res.setHeader('Content-type', returnContentType(filePath))
          res.end(data)
        })
      }
    }
  })
})

server.listen('9000', function () {
  console.log('伺服器正在運行...')
})