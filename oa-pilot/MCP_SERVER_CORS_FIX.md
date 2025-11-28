# MCP 服务器 CORS 配置修复指南

## 问题描述

浏览器的 JavaScript 代码无法读取 `mcp-session-id` 响应头，即使服务器已经返回了该头。

### 当前行为

```bash
curl -v http://localhost:8000/mcp
```

响应头：
```
< HTTP/1.1 400 Bad Request
< mcp-session-id: ec65d523023c46d8a86d32ff9e5d97d8
< access-control-allow-origin: *
< access-control-allow-credentials: true
```

但是在浏览器中：
```javascript
const response = await fetch('http://localhost:8000/mcp');
const sessionId = response.headers.get('mcp-session-id');
console.log(sessionId); // null ❌
```

## 原因

**CORS 安全策略**：浏览器默认只允许 JavaScript 访问以下"简单响应头"：
- `Cache-Control`
- `Content-Language`
- `Content-Type`
- `Expires`
- `Last-Modified`
- `Pragma`

对于自定义响应头（如 `mcp-session-id`），服务器必须明确在 **`Access-Control-Expose-Headers`** 中声明，浏览器才能访问。

## 解决方案

### 服务器端修复（必需）

在 MCP 服务器的 CORS 配置中添加：

```
Access-Control-Expose-Headers: mcp-session-id
```

### FastMCP / FastAPI 示例

如果你的 MCP 服务器使用 FastAPI + FastMCP：

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 或指定域名，如 ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["mcp-session-id"]  # ✅ 关键：暴露自定义响应头
)
```

### 验证修复

修复后，使用 curl 验证：

```bash
curl -v http://localhost:8000/mcp \
  -H "Origin: http://localhost:3000"
```

应该看到：
```
< access-control-expose-headers: mcp-session-id
< mcp-session-id: ec65d523023c46d8a86d32ff9e5d97d8
```

然后在浏览器中测试：
```javascript
const response = await fetch('http://localhost:8000/mcp', {
  headers: { 'Accept': 'application/json, text/event-stream' }
});
const sessionId = response.headers.get('mcp-session-id');
console.log(sessionId); // ec65d523023c46d8a86d32ff9e5d97d8 ✅
```

## 完整的 CORS 配置建议

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # 开发环境
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "mcp-session-id"],  # 允许客户端发送的请求头
    expose_headers=["mcp-session-id"]  # 允许客户端读取的响应头
)
```

## 参考资料

- [MDN: CORS - Access-Control-Expose-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers)
- [FastAPI CORS Middleware](https://fastapi.tiangolo.com/tutorial/cors/)
- [MCP 协议规范](https://spec.modelcontextprotocol.io/)
