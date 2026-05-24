const { app, BrowserWindow } = require('electron')
const path = require('path')
const http = require('http')
const fs = require('fs')
const url = require('url')

let mainWindow
let server

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
}

function startServer() {
  const appDir = path.join(__dirname, 'app')
  
  server = http.createServer((req, res) => {
    let pathname = url.parse(req.url).pathname
    
    // Remove trailing slash (except root)
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }
    
    let filePath = path.join(appDir, pathname)
    
    // Try exact file first
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      serveFile(filePath, res)
      return
    }
    
    // Try with .html extension (Next.js static export pattern)
    if (fs.existsSync(filePath + '.html')) {
      serveFile(filePath + '.html', res)
      return
    }
    
    // Try index.html in directory
    const indexPath = path.join(filePath, 'index.html')
    if (fs.existsSync(indexPath)) {
      serveFile(indexPath, res)
      return
    }
    
    // Fallback to index.html for SPA routing
    serveFile(path.join(appDir, 'index.html'), res)
  })
  
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      console.log(`Server running on http://127.0.0.1:${port}`)
      resolve(port)
    })
  })
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'
  
  try {
    const data = fs.readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(data)
  } catch (err) {
    res.writeHead(404)
    res.end('Not found')
  }
}

async function createWindow() {
  const port = await startServer()
  
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'NOA CDSS Dashboard',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#111827',
    show: false,
  })

  mainWindow.loadURL(`http://127.0.0.1:${port}`)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (server) server.close()
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
