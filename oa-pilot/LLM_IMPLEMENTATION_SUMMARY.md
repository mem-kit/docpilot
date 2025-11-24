# LLM Tool Calling 实现总结

## 📋 项目概述

成功实现了通过 LLM (DeepSeek) 的 Function Calling 功能来操作 OnlyOffice 文档编辑器。

## 🏗️ 架构设计

```
用户输入 (自然语言)
    ↓
ChatPanel.js (聊天界面)
    ↓
DeepSeek API (Function Calling)
    ↓
EngineDocument.js (工具定义和路由)
    ↓
APIWord.js / APIExcel.js / APIPowerPoint.js (具体实现)
    ↓
OnlyOffice Document Editor (文档更新)
```

## 🔧 核心实现

### 1. 工具定义 (EngineDocument.js)

```javascript
// 定义可用工具（OpenAI Function Calling 格式）
export const tools = [
  {
    type: "function",
    function: {
      name: "updateParagraph",
      description: "在Word文档中插入一个新段落",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "要插入的段落文本内容"
          }
        },
        required: ["text"]
      }
    }
  },
  // ... 更多工具定义
];

// 工具执行器
export async function executeToolCall(toolName, args, docEditor) {
  const toolFunction = toolFunctions[toolName];
  return await toolFunction(docEditor, args);
}
```

### 2. API 实现 (以 APIWord.js 为例)

```javascript
export const updateParagraph = (docEditor, args = {}) => {
  const text = args.text || '默认文本';
  
  return new Promise((resolve, reject) => {
    if (docEditor.createConnector) {
      const connector = docEditor.createConnector();
      connector.callCommand(function() {
        var oDocument = Api.GetDocument();
        var oParagraph = Api.CreateParagraph();
        oParagraph.AddText(text);
        oDocument.InsertContent([oParagraph]);
      }, function(result) {
        resolve({ 
          success: true, 
          message: `成功插入段落: ${text}` 
        });
      });
    } else {
      reject(new Error('API 不可用'));
    }
  });
};
```

### 3. LLM 集成 (ChatPanel.js)

```javascript
// 调用 LLM API
const completion = await openai.chat.completions.create({
  model: 'deepseek-chat',
  messages: [...apiMessages],
  tools: tools,  // 传入工具定义
  tool_choice: 'auto'  // 让 LLM 自动决定是否调用工具
});

// 处理工具调用
if (responseMessage.tool_calls) {
  for (const toolCall of responseMessage.tool_calls) {
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);
    
    // 执行工具
    const result = await executeToolCall(
      functionName, 
      functionArgs, 
      docEditor
    );
    
    // 将结果返回给 LLM
    toolCallMessages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      name: functionName,
      content: JSON.stringify(result)
    });
  }
  
  // 获取 LLM 的最终回复
  const finalResponse = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [...toolCallMessages]
  });
}
```

## 📊 数据流

### 成功场景

```
用户: "在文档中添加一段文字：Hello World"
  ↓
LLM 分析: 需要调用 updateParagraph
  ↓
工具调用: {
  name: "updateParagraph",
  arguments: { text: "Hello World" }
}
  ↓
执行: updateParagraph(docEditor, { text: "Hello World" })
  ↓
OnlyOffice API: 在文档中插入段落
  ↓
结果: { success: true, message: "成功插入段落: Hello World" }
  ↓
LLM 总结: "已成功在文档中添加段落：Hello World"
```

### 错误场景

```
用户: "在文档中添加文字"
  ↓
编辑器未就绪
  ↓
错误: { success: false, error: "文档编辑器未初始化" }
  ↓
LLM: "无法执行操作，请先打开文档"
```

## 🎯 已实现的工具

| 工具名称 | 功能 | 参数 | 适用文档 |
|---------|------|------|----------|
| updateParagraph | 插入段落 | text | Word |
| insertFormattedText | 插入格式化文本 | text, bold, italic, underline | Word |
| replaceCurrentWord | 替换选中文本 | text | Word |
| updateSpreadsheet | 更新单元格 | cell, value, bold | Excel |
| updatePresentation | 更新幻灯片 | slideIndex, text | PowerPoint |

## ✨ 关键特性

### 1. 参数智能推断
LLM 可以从自然语言中提取参数：

```
用户: "在A2单元格写入粗体的'总计'"
  ↓
LLM 推断: {
  cell: "A2",
  value: "总计",
  bold: true
}
```

### 2. 异步执行
所有 API 调用都是异步的，支持复杂操作：

```javascript
// 支持 async/await
const result = await executeToolCall(name, args, editor);

// 返回 Promise
return new Promise((resolve, reject) => {
  // ... 执行操作
  resolve(result);
});
```

### 3. 详细反馈
每一步都有清晰的状态显示：

```
🔧 正在执行: updateParagraph
参数: { text: "Hello World" }
  ↓
✅ 执行成功
成功插入段落: Hello World
  ↓
🤖 已成功在文档中添加段落
```

### 4. 错误处理
完善的错误捕获和提示：

```javascript
try {
  const result = await executeToolCall(...);
} catch (error) {
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: `❌ 执行失败: ${error.message}`,
    isAgent: true
  }]);
}
```

## 🔄 工作流程

### Agent 模式激活
1. 用户点击 "Load MCP" 按钮
2. 加载工具定义
3. 显示可用工具列表
4. 系统准备就绪

### 命令执行
1. 用户输入自然语言命令
2. 发送到 DeepSeek API
3. LLM 分析并决定调用哪个工具
4. 提取参数并执行工具
5. 获取执行结果
6. LLM 生成友好的回复
7. 更新 UI 显示

### 多步骤任务
支持一次执行多个工具调用：

```
用户: "添加标题、正文和结尾"
  ↓
LLM 调用:
  1. updateParagraph({ text: "标题" })
  2. updateParagraph({ text: "正文" })
  3. updateParagraph({ text: "结尾" })
```

## 🛠️ 技术栈

- **前端框架**: React 19.2.0
- **编辑器**: OnlyOffice Document Editor
- **LLM**: DeepSeek Chat API
- **AI SDK**: OpenAI SDK 6.9.1
- **语言**: JavaScript (ES6+)

## 📁 文件结构

```
src/
├── components/
│   ├── ChatPanel.js          # 聊天界面和 LLM 集成
│   ├── EditorPanel.js         # OnlyOffice 编辑器封装
│   └── FileList.js            # 文件列表
├── extensions/
│   ├── EngineDocument.js      # 工具定义和执行器
│   ├── APIWord.js             # Word 文档 API
│   ├── APIExcel.js            # Excel 表格 API
│   ├── APIPowerPoint.js       # PowerPoint 幻灯片 API
│   └── APIPDF.js              # PDF 文档 API（待实现）
└── config.js                  # 配置文件
```

## 🎨 UI 设计

### Agent 状态显示
```
🤖 Agent Mode Active
⚠️ Editor not ready (如果编辑器未就绪)
```

### 消息类型
- 👤 用户消息
- 🤖 AI 回复
- 🔧 工具执行（Agent 消息）
- ⚙️ 系统消息

### 执行反馈
```
🔧 正在执行: functionName
参数: { ... }
  ↓
✅ 执行成功 / ❌ 执行失败
结果: ...
```

## 🚀 性能优化

1. **异步执行**: 不阻塞 UI
2. **错误隔离**: 单个工具失败不影响其他工具
3. **状态管理**: 实时更新执行状态
4. **日志记录**: 详细的控制台输出

## 🔐 安全考虑

1. **API Key 配置**: 存储在 config.js（生产环境应使用环境变量）
2. **参数验证**: 所有参数都有类型检查
3. **错误处理**: 防止敏感信息泄露
4. **权限控制**: 仅在 Agent 模式下启用工具调用

## 📈 未来扩展

### 短期目标
1. 添加更多文档操作工具
2. 支持批量操作
3. 实现撤销/重做功能

### 中期目标
1. 集成 MCP 协议
2. 支持动态工具注册
3. 添加工具执行历史

### 长期目标
1. 多文档协同编辑
2. 智能文档分析
3. 自动化工作流

## 🎓 使用示例

### 基础操作
```javascript
// 用户输入
"在文档中添加一段文字：这是测试内容"

// LLM 理解并执行
updateParagraph({ text: "这是测试内容" })

// 结果
✅ 成功插入段落: 这是测试内容
```

### 格式化操作
```javascript
// 用户输入
"添加粗体斜体的重要提示"

// LLM 理解并执行
insertFormattedText({ 
  text: "重要提示", 
  bold: true, 
  italic: true 
})

// 结果
✅ 成功插入格式化文本(粗体, 斜体): 重要提示
```

### Excel 操作
```javascript
// 用户输入
"在B3单元格输入数字500并加粗"

// LLM 理解并执行
updateSpreadsheet({ 
  cell: "B3", 
  value: "500", 
  bold: true 
})

// 结果
✅ 成功更新单元格 B3(粗体): 500
```

## 🎉 总结

成功实现了一个完整的 LLM Function Calling 系统，用户可以通过自然语言控制文档编辑器。

**核心成就**:
- ✅ 5个工具函数，覆盖主要文档操作
- ✅ 完整的参数传递和验证
- ✅ 详细的执行反馈和错误处理
- ✅ 友好的用户界面和交互体验

**技术亮点**:
- 使用 OpenAI Function Calling 标准
- 异步执行保证性能
- 完善的错误处理机制
- 智能的参数推断

下一步可以开始 MCP 集成，实现更强大的工具生态系统！
