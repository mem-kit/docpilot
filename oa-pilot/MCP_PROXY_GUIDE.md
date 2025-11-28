# MCP CORS 代理配置说明

## 问题

在浏览器中直接访问 `http://localhost:8000/mcp` 会遇到 CORS 跨域错误：

```
Access to fetch at 'http://localhost:8000/mcp' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present 
on the requested resource.
```

## 解决方案

使用 React 开发服务器的简单代理功能（`package.json` 中的 `proxy` 配置）。

## 配置文件

### 1. 代理配置 (`package.json`)

已在 `package.json` 中添加：
```json
{
  "proxy": "http://localhost:8000"
}
```

这会自动代理所有未知请求到 `http://localhost:8000`：
- ✅ 自动处理 CORS
- ✅ 保留所有 HTTP 头部（包括 `mcp-session-id`）
- ✅ 支持 SSE (Server-Sent Events)
- ✅ 无需额外配置

### 2. MCP 配置文件 (`.mcp.txt`)

在工作空间中创建 `.mcp.txt` 文件：

```json
{
    "servers": {
        "camunda": {
            "type": "http",
            "url": "http://localhost:8000/mcp"
        }
    }
}
```

**注意：** 
- 保持使用原始 URL `http://localhost:8000/mcp`
- 系统会自动检测 localhost 并使用代理路径
- 不需要手动改为 `/api/mcp`

## 工作原理

```
浏览器请求              React Dev Server       MCP 服务器
  ↓                         ↓                      ↓
http://localhost:3000  →  package.json  →  http://localhost:8000
     /mcp                    proxy              /mcp
```

流程：
1. 前端代码请求 `/mcp`（相对路径）
2. React 开发服务器检查 `proxy` 配置
3. 代理转发到 `http://localhost:8000/mcp`
4. MCP 服务器处理并返回
5. 代理转发响应回前端
6. ✅ 无 CORS 错误！

## 自动转换

`EngineMCP.js` 会自动检测并转换 URL：

```javascript
// 配置文件中的 URL
"url": "http://localhost:8000/mcp"

// 自动转换为（开发环境）
baseUrl = "/mcp"  // 相对路径，使用代理

// 生产环境保持原样
baseUrl = "http://production-server:8000/mcp"
```

## 使用方法

### 启动服务

```bash
# 1. 启动 MCP 服务器
# 确保 Camunda MCP Server 运行在 http://localhost:8000/mcp

# 2. 启动 React 开发服务器
npm start

# 代理会自动生效
```

### 查看代理

启动后，在浏览器 Network 标签页查看：
- Request URL: `http://localhost:3000/mcp`
- Status: `200 OK`
- Headers: 包含 `mcp-session-id`

### 调试

在浏览器开发者工具中：

1. **Network 标签页**
   - 查看请求 URL：应该是 `/api/mcp`（不是 `http://localhost:8000/mcp`）
   - 查看响应头：应该有 `mcp-session-id`

2. **Console 标签页**
   - 查看 MCP 日志
   - 点击 "📝 日志" 按钮查看详细调试信息

## 常见问题

### Q: 代理配置修改后不生效？
**A:** 需要重启开发服务器：
```bash
# 停止当前服务器 (Ctrl+C)
npm start  # 重新启动
```

### Q: 还是有 CORS 错误？
**A:** 检查：
1. `setupProxy.js` 文件是否在 `src/` 目录下
2. MCP 服务器是否在 `http://localhost:8000/mcp` 运行
3. 查看终端是否有代理日志输出

### Q: 生产环境怎么办？
**A:** 生产环境有两种方案：

**方案 1：后端配置 CORS**
让 MCP 服务器添加 CORS 头：
```python
# FastAPI 示例
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**方案 2：使用 Nginx 代理**
```nginx
location /api/mcp {
    proxy_pass http://mcp-server:8000/mcp;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header mcp-session-id $http_mcp_session_id;
}
```

## 端口说明

| 服务 | 端口 | 用途 |
|------|------|------|
| React Dev Server | 3000 | 前端应用 |
| MCP Server | 8000 | Camunda MCP 服务 |
| Proxy | 3000 | 代理 `/api/mcp` 到 8000 |

## 测试代理

使用 curl 测试代理是否工作：

```bash
# 直接访问（会 CORS）
curl http://localhost:8000/mcp

# 通过代理访问（开发服务器必须运行）
curl http://localhost:3000/api/mcp
```

两者应该返回相同的结果。

---

**提示：** 代理只在开发环境（`npm start`）中生效。生产构建（`npm run build`）不包含代理功能。
