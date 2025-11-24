const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 代理上传接口
  app.use(
    '/example/upload',
    createProxyMiddleware({
      target: 'http://192.168.50.156',
      changeOrigin: true,
      secure: false,
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Origin', 'http://192.168.50.156');
        proxyReq.setHeader('Referer', 'http://192.168.50.156/example/?userid=uid-1&lang=en&directUrl=false');
        proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
        console.log('[Proxy] Upload:', req.method, req.url);
      }
    })
  );

  // 代理删除接口
  app.use(
    '/example/file',
    createProxyMiddleware({
      target: 'http://192.168.50.156',
      changeOrigin: true,
      secure: false,
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Origin', 'http://192.168.50.156');
        proxyReq.setHeader('Referer', 'http://192.168.50.156/example/?userid=uid-1&lang=en&directUrl=false');
        proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
        proxyReq.setHeader('Content-Type', 'text/xml');
        console.log('[Proxy] Delete:', req.method, req.url);
      }
    })
  );
};
