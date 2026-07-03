'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.resolve(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
};

/**
 * 根据文件扩展名返回对应的 Content-Type。
 * @param {string} filePath - 文件路径
 * @returns {string} MIME 类型字符串，未匹配时返回 application/octet-stream
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * 将请求 URL 映射到 public 目录下的安全文件路径。
 * 过滤 .. 序列并校验路径未逃逸出 PUBLIC_DIR，防御路径穿越攻击。
 * @param {string} url - 原始请求 URL（可能包含恶意路径穿越 payload）
 * @returns {string|null} 安全的绝对文件路径；若路径不合法则返回 null
 */
function getFilePath(url) {
  // 过滤 .. 序列作为额外防御层
  let cleanPath = url.replace(/\.\./g, '');
  cleanPath = cleanPath === '/' ? '/index.html' : cleanPath;

  const resolved = path.resolve(PUBLIC_DIR, cleanPath);

  // 校验解析后的路径是否仍在 PUBLIC_DIR 内
  if (!resolved.startsWith(PUBLIC_DIR + path.sep) && resolved !== PUBLIC_DIR) {
    return null;
  }

  return resolved;
}

/**
 * 流式提供静态文件。通过 createReadStream + pipe 高效传输。
 * @param {string} filePath - 已验证安全的文件绝对路径
 * @param {http.IncomingMessage} req - HTTP 请求对象（仅用于日志）
 * @param {http.ServerResponse} res - HTTP 响应对象
 */
function serveFile(filePath, req, res) {
  const contentType = getContentType(filePath);
  const readStream = fs.createReadStream(filePath);

  readStream.on('open', () => {
    console.log(`[${req.method}] ${req.url.slice(0, 200)} -> 200`);
    res.writeHead(200, { 'Content-Type': contentType });
    readStream.pipe(res);
  });

  readStream.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.log(`[${req.method}] ${req.url.slice(0, 200)} -> 404`);
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    } else {
      console.log(`[${req.method}] ${req.url.slice(0, 200)} -> 500`);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Internal Server Error');
    }
  });
}

/**
 * HTTP 请求入口。路由到对应的静态文件服务，包含路径穿越防护。
 * @param {http.IncomingMessage} req - HTTP 请求对象
 * @param {http.ServerResponse} res - HTTP 响应对象
 */
function handleRequest(req, res) {
  const filePath = getFilePath(req.url);

  if (filePath === null) {
    console.log(`[${req.method}] ${req.url.slice(0, 200)} -> 403`);
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  serveFile(filePath, req, res);
}

/**
 * 启动 HTTP 服务器，监听 localhost:PORT。
 * 启动失败时输出错误并退出进程。
 */
function startServer() {
  const server = http.createServer((req, res) => {
    handleRequest(req, res);
  });

  server.listen(PORT, 'localhost', () => {
    console.log(`服务器已启动: http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('服务器启动失败:', err.message);
    process.exit(1);
  });
}

startServer();
