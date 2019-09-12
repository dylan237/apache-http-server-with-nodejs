var http = require('http')
var fs = require('fs')
var path = require('path')
var template = require('art-template')

var server = http.createServer()

var wwwDir = './www'
var port = '8000'

server.on('request', function (req, res) {
  // 避免chrome自動發送favicon.ico請求
  if (req.url === '/favicon.ico') return
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
  // 將 RFC3999Date 時間格式轉為 2000-1-1 11:11 格式
  var timeFormater = function(RFCdate) {
    console.log(RFCdate)
    var millisecond = Date.parse(RFCdate) // RFC3999Date格式轉毫秒
    var dateObj = new Date(millisecond) // 轉時間物件
    return `${dateObj.toLocaleDateString()} ${dateObj.getHours()}:${dateObj.getMinutes()}`
  }
  // 客戶端請求路徑
  var url = req.url
  // 當請求路徑為 / 時，預設回傳 index.html
  var filePath
  url === '/' ? filePath = '/index.html' : filePath = url
  // 開放資源資料夾 + 客戶端請求路徑 (靜態資源絕對路徑)
  fullPath = wwwDir + filePath

  // fs.access => 判斷該請求路徑是否存在
  fs.access(fullPath, function (err) {
    if (err) {
      console.log('資源不存在')
      toErrorPage()
    } else {
      console.log('資源存在')
      // lstatSync(資源路徑).isDirectory() => 判斷是否為資料夾
      if (fs.statSync(fullPath).isDirectory()) {
        // 路徑為資料夾時，渲染抓資料夾內容，並渲染阿帕契目錄頁面
        console.log('路徑為資料夾')
        fs.readFile('./template.html', function (err, templateFile) {
          if (err) {
            toErrorPage()
          }
          // fs.readdir => 取資料夾內的成員
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
            // 若沒有則印出資料夾成員頁面
            } else {
              // 取得資料夾內檔案大小與修改日期，filesDetailInfo === 所有內部檔案資料集合
              var filesDetailInfo = dirFiles.map((file) => {
                // fs.statSync => 取得檔案或資料夾的詳細資料
                var statSync = fs.statSync(fullPath + '/' + file)
                var fileDetail = {
                  fileName: file,
                  size: statSync.size, // 檔案大小
                  createTime: timeFormater(statSync.ctime), // 創建時間
                  mutateTime: timeFormater(statSync.mtime), // 修改時間
                }
                return fileDetail
              })
              console.log(filesDetailInfo)
              // 模板引擎
              var htmlStr = template.render(templateFile.toString(), {
                path: filePath,
                port: port,
                files: filesDetailInfo
              })
              res.end(htmlStr)
            }
          })
        })
      } else {
        // 路徑為檔案時，渲染該檔案
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

server.listen(port, function () {
  console.log(`伺服器正運行於 ${port} port...`)
})