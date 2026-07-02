const http = require('http');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');

/**
 * MIME 类型映射（基于文件扩展名）
 */
function getContentType(filePath) {
    const mimeTypes = new Map([
        ['.html', 'text/html; charset=utf-8'],
        ['.css', 'text/css; charset=utf-8'],
        ['.js', 'application/javascript; charset=utf-8'],
        ['.json', 'application/json; charset=utf-8'],
        ['.png', 'image/png'],
        ['.jpg', 'image/jpeg'],
        ['.jpeg', 'image/jpeg'],
        ['.gif', 'image/gif'],
        ['.svg', 'image/svg+xml'],
        ['.ico', 'image/x-icon'],
    ]);

    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes.get(ext) || 'application/octet-stream';
}

/**
 * 请求处理：读取文件并返回
 */
async function handleRequest(req, res) {
    try {
        // 解析 URL 路径
        let urlPath = req.url.split('?')[0];

        // 根路径重定向到 /index.html
        if (urlPath === '/') {
            urlPath = '/index.html';
        }

        // 安全检查：防止目录遍历攻击
        const filePath = path.join(PUBLIC_DIR, urlPath);
        if (!filePath.startsWith(PUBLIC_DIR)) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('403 Forbidden');
            return;
        }

        // 检查文件是否存在并读取
        const data = await fs.promises.readFile(filePath);
        const contentType = getContentType(filePath);

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 Not Found</h1>');
        } else {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('500 Internal Server Error');
        }
    }
}

/**
 * 主入口：创建并启动 HTTP 服务器
 */
function startServer(port = 3000) {
    const server = http.createServer(handleRequest);

    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });

    return server;
}

// 直接运行时启动服务器
if (require.main === module) {
    const port = parseInt(process.env.PORT || '3000', 10);
    startServer(port);
}

module.exports = { startServer, handleRequest, getContentType };
