# 🎯 下一步：MCP 集成规划

## ✅ 已完成：LLM Function Calling

我们已经成功实现了基于 DeepSeek 的 Function Calling 功能：

- ✅ 5个文档操作工具（Word、Excel、PowerPoint）
- ✅ 完整的参数传递和验证
- ✅ 详细的执行反馈和错误处理
- ✅ 友好的用户界面

## 🔄 当前架构

```
用户 → ChatPanel → DeepSeek API → EngineDocument → API执行器 → OnlyOffice
```

## 🚀 下一步：MCP 协议集成

### 什么是 MCP？

Model Context Protocol (MCP) 是一个标准化的协议，用于：
- 🔧 动态注册和发现工具
- 📡 标准化的通信格式
- 🔌 可插拔的工具生态系统
- 🌐 跨平台工具共享

### MCP vs 当前 Function Calling

| 特性 | 当前实现 | MCP 集成后 |
|------|---------|-----------|
| 工具定义 | 硬编码在代码中 | 动态从 MCP 服务器加载 |
| 工具发现 | 启动时加载 | 运行时动态发现 |
| 工具扩展 | 需要修改代码 | 无需修改，即插即用 |
| 工具共享 | 不支持 | 支持跨应用共享 |
| 协议标准 | OpenAI 格式 | MCP 标准格式 |

## 🏗️ MCP 集成架构

```
用户输入
    ↓
ChatPanel (UI)
    ↓
LLM API (DeepSeek/OpenAI)
    ↓
MCP Client ←→ MCP Server(s)
    ↓           ↓
Tool Registry  Tool Implementations
    ↓
EngineDocument (适配器)
    ↓
OnlyOffice API
```

## 📋 集成任务清单

### Phase 1: MCP 客户端基础 (1-2天)

1. **创建 MCP 客户端模块**
   ```
   src/extensions/EngineMCP.js
   ```
   - [ ] 实现 MCP 协议通信
   - [ ] 支持工具列表查询
   - [ ] 支持工具调用

2. **MCP 服务器连接**
   - [ ] 配置 MCP 服务器地址
   - [ ] 实现连接和断开逻辑
   - [ ] 添加连接状态管理

3. **工具格式转换**
   - [ ] MCP 格式 → OpenAI Function Calling 格式
   - [ ] OpenAI 格式 → MCP 调用格式

### Phase 2: 工具动态加载 (2-3天)

1. **工具注册系统**
   ```javascript
   class ToolRegistry {
     async loadToolsFromMCP(serverUrl)
     registerTool(toolDef)
     getTool(toolName)
     listAllTools()
   }
   ```

2. **动态工具发现**
   - [ ] 启动时自动发现 MCP 工具
   - [ ] 支持运行时刷新工具列表
   - [ ] 工具版本管理

3. **工具适配器**
   - [ ] 将现有工具迁移到 MCP 格式
   - [ ] 创建工具适配器层
   - [ ] 保持向后兼容

### Phase 3: UI 增强 (1-2天)

1. **MCP 配置界面**
   - [ ] MCP 服务器列表
   - [ ] 连接状态显示
   - [ ] 工具列表展示

2. **工具管理**
   - [ ] 启用/禁用工具
   - [ ] 工具参数配置
   - [ ] 工具使用统计

3. **调试功能**
   - [ ] MCP 消息日志
   - [ ] 工具调用历史
   - [ ] 错误追踪

### Phase 4: 高级功能 (3-5天)

1. **多 MCP 服务器支持**
   - [ ] 连接多个 MCP 服务器
   - [ ] 工具命名空间管理
   - [ ] 服务器优先级

2. **工具链**
   - [ ] 支持工具组合调用
   - [ ] 条件执行
   - [ ] 循环执行

3. **安全和权限**
   - [ ] 工具权限管理
   - [ ] 用户授权
   - [ ] 审计日志

## 📁 新增文件结构

```
src/extensions/
├── EngineMCP.js           # MCP 客户端实现
├── MCPClient.js           # MCP 协议通信
├── ToolRegistry.js        # 工具注册和管理
├── ToolAdapter.js         # 工具格式适配
└── mcp-tools/             # MCP 工具定义
    ├── word-tools.json
    ├── excel-tools.json
    └── ppt-tools.json

src/components/
├── MCPPanel.js            # MCP 配置面板
└── ToolsPanel.js          # 工具管理面板
```

## 🔧 技术实现要点

### 1. MCP 协议通信

```javascript
class MCPClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.ws = null;
  }

  async connect() {
    // WebSocket 或 HTTP 连接
  }

  async listTools() {
    // 获取工具列表
    return await this.sendRequest({
      jsonrpc: "2.0",
      method: "tools/list",
      id: 1
    });
  }

  async callTool(name, arguments) {
    // 调用工具
    return await this.sendRequest({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name, arguments },
      id: 2
    });
  }
}
```

### 2. 工具格式转换

```javascript
// MCP 格式
{
  name: "updateParagraph",
  description: "插入段落",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string" }
    }
  }
}

// ↓ 转换为 ↓

// OpenAI Function Calling 格式
{
  type: "function",
  function: {
    name: "updateParagraph",
    description: "插入段落",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string" }
      }
    }
  }
}
```

### 3. 动态工具加载

```javascript
// ChatPanel.js 改造
const loadMCPConfig = async () => {
  // 连接 MCP 服务器
  const mcpClient = new MCPClient(config.mcpServerURL);
  await mcpClient.connect();
  
  // 获取工具列表
  const mcpTools = await mcpClient.listTools();
  
  // 转换为 OpenAI 格式
  const openaiTools = mcpTools.map(convertMCPToOpenAI);
  
  // 注册到工具注册表
  toolRegistry.registerTools(openaiTools);
  
  // 更新 UI
  setAgentMode(true);
  setTools(openaiTools);
};
```

## 🌟 MCP 集成的优势

### 1. 可扩展性
- ✅ 无需修改代码即可添加新工具
- ✅ 支持第三方工具集成
- ✅ 工具版本独立管理

### 2. 标准化
- ✅ 遵循 MCP 协议标准
- ✅ 与其他 MCP 应用兼容
- ✅ 工具定义可重用

### 3. 灵活性
- ✅ 运行时动态加载工具
- ✅ 支持多个工具源
- ✅ 工具可以独立部署

### 4. 生态系统
- ✅ 接入 MCP 工具市场
- ✅ 共享社区工具
- ✅ 与其他应用互操作

## 📊 实施计划

### 第1周：基础框架
- 实现 MCP 客户端
- 完成协议通信
- 基本工具加载

### 第2周：功能完善
- 动态工具发现
- 格式转换和适配
- UI 集成

### 第3周：高级功能
- 多服务器支持
- 工具管理界面
- 调试和监控

### 第4周：测试优化
- 完整测试
- 性能优化
- 文档编写

## 🎓 学习资源

- [MCP 协议规范](https://modelcontextprotocol.io/)
- [MCP SDK 文档](https://github.com/modelcontextprotocol)
- [MCP 示例项目](https://github.com/modelcontextprotocol/examples)

## 🚦 开始 MCP 集成

当前 Function Calling 已经工作正常，可以开始 MCP 集成了！

### 推荐流程：

1. **先保持当前实现**
   - 不要破坏现有功能
   - MCP 作为额外选项

2. **逐步迁移**
   - 先实现 MCP 客户端
   - 再迁移现有工具
   - 最后添加新功能

3. **测试驱动**
   - 每个阶段充分测试
   - 保持向后兼容
   - 及时修复问题

## 💡 下一步行动

准备好开始 MCP 集成了吗？我可以帮您：

1. 🔧 创建 MCP 客户端基础代码
2. 📋 实现工具格式转换
3. 🎨 设计 MCP 配置界面
4. 📚 编写详细的集成文档

请告诉我您想从哪里开始！
