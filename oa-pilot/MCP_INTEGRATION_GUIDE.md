# MCP Integration Guide

## 概述

现在 ChatPanel 已经支持自动加载和调用 MCP (Model Context Protocol) 工具！这意味着你可以在 Agent 模式下使用来自不同 MCP 服务器的工具。

## 功能特性

### 1. 自动加载 MCP 配置
- 从当前工作空间的 `.mcp.txt` 文件自动读取 MCP 服务器配置
- 支持多个 MCP 服务器
- 配置文件格式：
```json
{
  "servers": {
    "camunda": {
      "type": "http",
      "url": "http://111.229.40.154:8000/mcp"        
    }
  }
}
```

### 2. 动态工具发现
- 自动从配置的 MCP 服务器获取可用工具列表
- 将 MCP 工具转换为 OpenAI Function Calling 格式
- 与现有的文档工具（Word/Excel/PPT）无缝集成

### 3. 智能工具执行
- LLM 可以自动选择并调用 MCP 工具
- 支持 MCP 工具和文档工具混合使用
- 实时显示工具执行状态和结果

### 4. 工作空间感知
- 切换工作空间时自动重新加载对应的 MCP 配置
- 每个工作空间可以有独立的 MCP 配置

### 5. UI 控制
- **🔄 MCP 按钮**：手动刷新 MCP 工具
- **工具计数徽章**：显示已加载的 MCP 工具数量
- **实时状态**：显示工具加载和执行状态

## 使用方法

### 步骤 1：准备 MCP 配置文件
在你的工作空间目录下创建 `.mcp.txt` 文件：

```json
{
  "servers": {
    "your-server-name": {
      "type": "http",
      "url": "http://your-mcp-server-url/mcp"
    }
  }
}
```

### 步骤 2：切换到 Agent 模式
1. 在 ChatPanel 底部选择 "🤖 Agent" 模式
2. 系统会自动加载当前工作空间的 MCP 工具
3. 查看顶部的工具计数徽章确认加载成功

### 步骤 3：使用 MCP 工具
直接向 AI 助手发送请求，AI 会自动选择合适的工具：

```
示例：
- "列出所有的流程定义"
- "查看某个流程实例的状态"
- "发送消息到流程"
```

### 步骤 4：刷新 MCP 工具（可选）
- 如果 MCP 配置文件更新了，点击 "🔄 MCP" 按钮重新加载
- 切换工作空间时会自动刷新

## 技术架构

### 文件结构
```
src/
├── extensions/
│   ├── EngineMCP.js          # MCP 工具管理核心
│   └── EngineDocument.js     # 文档工具定义
├── components/
│   ├── ChatPanel.js          # 聊天面板（集成 MCP）
│   └── ChatPanel.css         # 样式文件
└── App.js                    # 主应用（传递工作空间信息）
```

### EngineMCP.js 核心功能

#### 1. `loadMCPConfig(workspace)`
从指定工作空间加载 `.mcp.txt` 配置文件
- 参数：`workspace` - 工作空间名称（空字符串表示根目录）
- 返回：MCP 配置对象

#### 2. `listTools(mcpServerUrl)`
从 MCP 服务器获取可用工具列表
- 参数：`mcpServerUrl` - MCP 服务器 URL
- 返回：OpenAI Function Calling 格式的工具列表

#### 3. `callTool(mcpServerUrl, toolName, args)`
调用 MCP 工具
- 参数：
  - `mcpServerUrl` - MCP 服务器 URL
  - `toolName` - 工具名称
  - `args` - 工具参数
- 返回：工具执行结果

#### 4. `loadWorkspaceMCPTools(workspace)`
一站式加载工作空间的所有 MCP 工具
- 参数：`workspace` - 工作空间名称
- 返回：包含工具列表和服务器映射的对象

### ChatPanel.js 集成

#### 新增状态
```javascript
const [mcpTools, setMcpTools] = useState([]);           // MCP 工具列表
const [mcpServers, setMcpServers] = useState({});       // MCP 服务器映射
const [isLoadingMCP, setIsLoadingMCP] = useState(false); // 加载状态
```

#### 自动加载机制
```javascript
useEffect(() => {
  if (mode === 'agent') {
    loadMCPTools();
  }
}, [selectedWorkspace, mode]);
```

#### 工具合并
```javascript
// 合并文档工具和 MCP 工具
const allTools = [...documentTools, ...mcpTools];
apiConfig.tools = allTools;
```

#### 智能工具执行
```javascript
// 检查是否是 MCP 工具
const mcpTool = mcpTools.find(t => t.function.name === functionName);

if (mcpTool && mcpTool._mcpServer) {
  // 执行 MCP 工具
  result = await EngineMCP.callTool(mcpTool._mcpServer, functionName, functionArgs);
} else {
  // 执行文档工具
  result = await executeToolCall(functionName, functionArgs, docEditor);
}
```

## MCP 服务器 API 规范

你的 MCP 服务器需要实现以下端点：

### 1. `GET /list_tools`
返回可用工具列表

**响应格式：**
```json
{
  "tools": [
    {
      "name": "tool_name",
      "description": "Tool description",
      "inputSchema": {
        "type": "object",
        "properties": {
          "param1": {
            "type": "string",
            "description": "Parameter description"
          }
        },
        "required": ["param1"]
      }
    }
  ]
}
```

### 2. `POST /call_tool`
调用指定工具

**请求格式：**
```json
{
  "name": "tool_name",
  "arguments": {
    "param1": "value1"
  }
}
```

**响应格式：**
```json
{
  "result": "Tool execution result",
  "status": "success"
}
```

## 工作空间配置示例

### 根目录（默认工作空间）
文件路径：`http://111.229.40.154/example/download?fileName=.mcp.txt`

```json
{
  "servers": {
    "camunda": {
      "type": "http",
      "url": "http://111.229.40.154:8000/mcp"
    }
  }
}
```

### 子工作空间（例如：onboard）
文件路径：`http://111.229.40.154/example/download?fileName=.mcp.txt&folder=onboard`

```json
{
  "servers": {
    "camunda": {
      "type": "http",
      "url": "http://111.229.40.154:8000/mcp"
    },
    "custom-tools": {
      "type": "http",
      "url": "http://another-server.com/mcp"
    }
  }
}
```

## 调试技巧

### 1. 查看控制台日志
打开浏览器开发者工具，查看以下日志：
- `📋 Loaded MCP config:` - MCP 配置加载成功
- `🔧 Available MCP tools:` - 可用的 MCP 工具列表
- `✅ Loaded X tools from server:` - 从服务器加载的工具数量
- `🔌 Executing MCP tool:` - MCP 工具执行
- `✅ MCP tool result:` - MCP 工具执行结果

### 2. 检查 MCP 配置文件
确保 `.mcp.txt` 文件存在且格式正确：
```bash
curl -X 'GET' \
  'http://111.229.40.154/example/download?fileName=.mcp.txt&folder=onboard' \
  -H 'accept: application/json'
```

### 3. 测试 MCP 服务器连接
```bash
# 获取工具列表
curl http://111.229.40.154:8000/mcp/list_tools

# 调用工具
curl -X POST http://111.229.40.154:8000/mcp/call_tool \
  -H "Content-Type: application/json" \
  -d '{"name": "tool_name", "arguments": {}}'
```

## 常见问题

### Q: MCP 工具没有加载？
A: 检查：
1. 是否处于 Agent 模式
2. `.mcp.txt` 文件是否存在
3. MCP 服务器 URL 是否正确
4. 网络连接是否正常

### Q: 如何添加新的 MCP 工具？
A: 
1. 在 MCP 服务器端实现新工具
2. 点击 "🔄 MCP" 按钮刷新工具列表
3. 新工具会自动可用

### Q: 可以同时使用多个 MCP 服务器吗？
A: 可以！在 `.mcp.txt` 中配置多个服务器，所有服务器的工具都会被加载。

### Q: MCP 工具和文档工具冲突怎么办？
A: 确保工具名称唯一。如果有冲突，先匹配的工具会被使用。

## 未来增强

- [ ] 支持 MCP 工具的参数验证
- [ ] 添加 MCP 工具的错误重试机制
- [ ] 支持 MCP 工具的权限控制
- [ ] 添加 MCP 工具使用统计
- [ ] 支持 WebSocket 类型的 MCP 服务器
- [ ] 工具执行历史记录

## 相关文档

- [MCP 协议规范](https://modelcontextprotocol.io/)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [EngineStorage API](./src/extensions/README_EngineStorage.md)

---

**最后更新：** 2025-11-27
**版本：** 1.0.0
