var http = require('http')
var fs = require('fs')
var template = require('art-template')
var server = http.createServer()

var wwwDir = './www'

server.on('request', function (req, res) {
  var url = req.url
  var filePath
  // 在 Apache 中，當請求路徑為 / 時，預設回傳 index.html
  url === '/' ? filePath = '/index.html' : filePath = url
  var fullPath = wwwDir + filePath

  fs.access(fullPath, function (err) {
    if (err) {
      console.log('資源不存在')
      return res.end('404 Not Found.')
    } else {
      console.log('資源存在')
      if (fs.statSync(fullPath).isDirectory()) {
        console.log('路徑為資料夾')
        // 路徑為資料夾時，抓資料夾成員內容，透過模板引擎寫入資料夾成員到目錄頁面的HTML模板，並回傳到客戶端
        fs.readdir(fullPath, function (err, dirFiles) {
          if (err) {
            return res.end('404 Not Found.')
          }
          // 將 dirFiles 陣列資料套入模板引擎，產出出目錄頁面 HTML 字串，接著回傳給客戶端
          fs.readFile('./template.html', function (err, templateFile) {
            if (err) {
              return res.end('404 Not Found.')
            }
            var htmlStr = template.render(templateFile.toString(), {
              files: dirFiles
            })
            res.end(htmlStr)
          })
        })
      } else {
        // 路徑為檔案時，回傳該檔案
        console.log('路徑為一般檔案')
        fs.readFile(fullPath, function (error, data) {
          if (error) {
            return res.end('404 Not Found.')
          }
          res.end(data)
        })
      }
    }
  })
})

server.listen('9000', function () {
  console.log('伺服器正在運行...')
})