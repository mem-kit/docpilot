# MCP Streamable HTTP 客户端集成指南

本文档说明如何使用 Node.js + React 客户端连接到 Camunda MCP Server（streamable HTTP 模式）。

## 服务器信息

- **服务器地址**: `http://localhost:8000/mcp`
- **传输模式**: streamable HTTP (Server-Sent Events)
- **协议**: MCP (Model Context Protocol) over JSON-RPC 2.0

## 连接流程

### 1. 获取 Session ID

首先需要发送 GET 请求获取 session ID，服务器会在响应头中返回 `mcp-session-id`。

```bash
curl -v -X GET http://localhost:8000/mcp \
  -H "Accept: application/json, text/event-stream"
```

**响应头示例**:
```
mcp-session-id: 4b762ae11ced44c296b13ea0cf7d82a1
```

### 2. 初始化会话 (Initialize)

使用获取的 session ID 发送初始化请求：

```bash
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: 4b762ae11ced44c296b13ea0cf7d82a1" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'
```

**响应示例**:
```
event: message
data: {
  "jsonrpc":"2.0",
  "id":1,
  "result":{
    "protocolVersion":"2024-11-05",
    "capabilities":{
      "experimental":{},
      "prompts":{"listChanged":true},
      "resources":{"subscribe":false,"listChanged":true},
      "tools":{"listChanged":true}
    },
    "serverInfo":{
      "name":"Camunda BPM",
      "version":"2.13.1"
    }
  }
}
```

### 3. 发送初始化完成通知 (Initialized Notification)

```bash
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: 4b762ae11ced44c296b13ea0cf7d82a1" \
  -d '{
    "jsonrpc": "2.0",
    "method": "notifications/initialized"
  }'
```

### 4. 调用方法

初始化完成后，可以调用各种 MCP 方法。

#### 获取工具列表 (tools/list)

```bash
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: 4b762ae11ced44c296b13ea0cf7d82a1" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

#### 调用工具 (tools/call)

```bash
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: 4b762ae11ced44c296b13ea0cf7d82a1" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "list_process_definitions",
      "arguments": {
        "latest_version": true,
        "max_results": 10
      }
    }
  }'
```

## 响应格式

所有响应都使用 **Server-Sent Events (SSE)** 格式：

```
event: message
data: {"jsonrpc":"2.0","id":2,"result":{...}}
```

或者错误响应：

```
event: message
data: {"jsonrpc":"2.0","id":2,"error":{"code":-32602,"message":"Invalid request parameters"}}
```

## Node.js + React 客户端实现

### 安装依赖

```bash
npm install eventsource
# 或
npm install fetch-event-source
```

### 客户端代码示例

```javascript
class MCPClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.sessionId = null;
    this.requestId = 0;
  }

  // 1. 获取 Session ID
  async getSessionId() {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/event-stream'
      }
    });
    
    this.sessionId = response.headers.get('mcp-session-id');
    if (!this.sessionId) {
      throw new Error('Failed to get session ID');
    }
    return this.sessionId;
  }

  // 2. 发送 JSON-RPC 请求
  async sendRequest(method, params = {}, isNotification = false) {
    const payload = {
      jsonrpc: '2.0',
      method: method
    };

    if (!isNotification) {
      payload.id = ++this.requestId;
    }

    if (params && Object.keys(params).length > 0) {
      payload.params = params;
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': this.sessionId
      },
      body: JSON.stringify(payload)
    });

    // 解析 SSE 响应
    const text = await response.text();
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6);
        return JSON.parse(data);
      }
    }
    
    return null;
  }

  // 3. 初始化连接
  async initialize(clientInfo = { name: 'nodejs-client', version: '1.0.0' }) {
    await this.getSessionId();
    
    const initResult = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: clientInfo
    });

    // 发送初始化完成通知
    await this.sendRequest('notifications/initialized', {}, true);
    
    return initResult;
  }

  // 4. 获取工具列表
  async listTools() {
    const result = await this.sendRequest('tools/list', {});
    return result.result.tools;
  }

  // 5. 调用工具
  async callTool(toolName, args = {}) {
    const result = await this.sendRequest('tools/call', {
      name: toolName,
      arguments: args
    });
    return result.result;
  }
}

// 使用示例
async function main() {
  const client = new MCPClient('http://localhost:8000/mcp');
  
  try {
    // 初始化
    console.log('Initializing...');
    await client.initialize();
    
    // 获取工具列表
    console.log('Fetching tools...');
    const tools = await client.listTools();
    console.log('Available tools:', tools.map(t => t.name));
    
    // 调用工具
    console.log('Listing process definitions...');
    const result = await client.callTool('list_process_definitions', {
      latest_version: true,
      max_results: 10
    });
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### React Hook 示例

```javascript
import { useState, useEffect } from 'react';

function useMCPClient(baseUrl) {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const mcpClient = new MCPClient(baseUrl);
    
    mcpClient.initialize()
      .then(() => {
        setClient(mcpClient);
        setIsConnected(true);
      })
      .catch(err => {
        setError(err.message);
      });
  }, [baseUrl]);

  return { client, isConnected, error };
}

// 在组件中使用
function CamundaTools() {
  const { client, isConnected, error } = useMCPClient('http://localhost:8000/mcp');
  const [tools, setTools] = useState([]);

  useEffect(() => {
    if (isConnected && client) {
      client.listTools().then(setTools);
    }
  }, [isConnected, client]);

  if (error) return <div>Error: {error}</div>;
  if (!isConnected) return <div>Connecting...</div>;

  return (
    <div>
      <h2>Available Tools</h2>
      <ul>
        {tools.map(tool => (
          <li key={tool.name}>{tool.name}: {tool.description}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 可用工具列表

服务器提供以下 13 个 Camunda 工具：

1. `list_process_definitions` - 列出所有流程定义
2. `get_process_definition` - 获取特定流程定义详情
3. `start_process_instance` - 启动流程实例
4. `list_process_instances` - 列出流程实例
5. `get_process_instance` - 获取流程实例详情
6. `delete_process_instance` - 删除流程实例
7. `list_tasks` - 列出用户任务
8. `get_task` - 获取任务详情
9. `complete_task` - 完成任务
10. `claim_task` - 认领任务
11. `get_task_variables` - 获取任务变量
12. `get_process_variables` - 获取流程变量
13. `deploy_bpmn` - 部署 BPMN 文件

## 注意事项

1. **必须按顺序**: 先获取 session ID → 初始化 → 发送 initialized 通知 → 调用方法
2. **Session ID 管理**: 每个 session ID 对应一个会话，需要在所有请求中携带
3. **响应格式**: 所有响应都是 SSE 格式，需要解析 `data:` 行
4. **错误处理**: 检查响应中的 `error` 字段
5. **协议版本**: 当前使用 `2024-11-05` 版本

## 故障排查

### 错误: "Not Acceptable: Client must accept both application/json and text/event-stream"
**解决**: 确保请求头包含 `Accept: application/json, text/event-stream`

### 错误: "Bad Request: Missing session ID"
**解决**: 先调用 GET 请求获取 session ID，然后在所有 POST 请求中添加 `mcp-session-id` 头

### 错误: "Invalid request parameters"
**解决**: 确保已经完成初始化流程（initialize → initialized notification）

## 参考资料

- MCP 协议规范: https://spec.modelcontextprotocol.io/
- FastMCP 文档: https://github.com/jlowin/fastmcp
- JSON-RPC 2.0 规范: https://www.jsonrpc.org/specification
