# 文档操作Agent使用指南

## 🎯 功能概述

OA Pilot 现在支持通过AI Agent自动操作文档！用户只需用自然语言描述需求，LLM会自动调用相应的API函数来完成文档操作。

## 🚀 快速开始

### 1. 启动Agent模式

1. 打开应用
2. 在右侧聊天面板点击 **"🔧 Load MCP"** 按钮
3. 系统会显示可用的工具列表

### 2. 使用自然语言操作文档

启用Agent模式后，您可以使用中文自然语言指令：

**Word文档操作示例：**
```
- "帮我在文档中插入一个段落"
- "添加一些格式化文本，包括粗体和斜体"
- "替换当前选中的文字"
```

**Excel表格操作示例：**
```
- "更新Excel表格"
- "在表格中添加数据"
```

**PowerPoint操作示例：**
```
- "更新PPT的第一张幻灯片"
- "修改演示文稿内容"
```

## 🛠️ 可用工具

### Word文档工具

| 工具名称 | 功能描述 |
|---------|---------|
| `updateParagraph` | 在Word文档中插入一个新段落 |
| `insertFormattedText` | 插入包含粗体、斜体和下划线的格式化文本 |
| `replaceCurrentWord` | 替换当前选中的文本（需先在文档中选中） |

### Excel表格工具

| 工具名称 | 功能描述 |
|---------|---------|
| `updateSpreadsheet` | 更新表格，在A1单元格插入文本并设置样式 |

### PowerPoint工具

| 工具名称 | 功能描述 |
|---------|---------|
| `updatePresentation` | 更新第一张幻灯片的内容 |

## 🏗️ 技术架构

### 模块化设计

```
src/extensions/
├── APIWord.js          # Word文档操作API
├── APIExcel.js         # Excel表格操作API
├── APIPowerPoint.js    # PowerPoint操作API
├── APIPDF.js          # PDF操作API (待实现)
└── DocumentTools.js    # 工具定义和调度中心
```

### Function Calling流程

```
用户输入 
  ↓
LLM分析意图
  ↓
选择合适的工具
  ↓
调用DocumentTools.executeToolCall()
  ↓
执行对应的API函数
  ↓
返回执行结果
  ↓
LLM生成友好的回复
```

## 💡 工作原理

1. **工具注册**: `DocumentTools.js` 定义了所有可用工具的OpenAI Function Calling格式
2. **LLM决策**: 当用户输入指令时，LLM分析意图并决定调用哪个工具
3. **工具执行**: 系统调用对应的模块化API函数
4. **结果反馈**: 执行结果返回给LLM，LLM生成用户友好的回复

## 🔧 扩展开发

### 添加新工具

1. **在对应的API文件中实现函数**（例如 `APIWord.js`）:
```javascript
export const newFunction = (docEditor, args) => {
  // 实现逻辑
};
```

2. **在 `DocumentTools.js` 中注册工具**:
```javascript
export const tools = [
  {
    type: "function",
    function: {
      name: "newFunction",
      description: "功能描述",
      parameters: {
        type: "object",
        properties: {
          param1: {
            type: "string",
            description: "参数描述"
          }
        },
        required: ["param1"]
      }
    }
  }
];

// 添加到函数映射
export const toolFunctions = {
  newFunction: APIModule.newFunction
};
```

3. **测试**: 启用Agent模式，用自然语言测试新功能

## 📝 示例对话

**用户**: "帮我在文档中插入一个段落"

**Agent**: 
```
🔧 正在执行: updateParagraph
结果: ✅ 成功

✅ 已成功在文档中插入新段落！
```

**用户**: "添加一些格式化文本"

**Agent**:
```
🔧 正在执行: insertFormattedText  
结果: ✅ 成功

✅ 已插入格式化文本，包含粗体、斜体和下划线样式！
```

## ⚙️ 配置说明

### LLM配置 (`src/config.js`)

```javascript
export default {
  llmAPIKey: 'your-api-key',
  llmURL: 'https://api.deepseek.com',
  // ...
}
```

### 支持的LLM

- ✅ DeepSeek (默认)
- ✅ OpenAI GPT-4
- ✅ 任何兼容OpenAI API格式的模型

## 🎨 用户界面

- **Agent状态指示器**: 显示Agent模式是否启用
- **工具执行反馈**: 实时显示工具调用和执行结果
- **友好的提示语**: 帮助用户理解可用功能

## 🐛 故障排查

### 文档编辑器未就绪
**问题**: Agent模式启用但显示"⚠️ Editor not ready"

**解决**: 等待文档加载完成，确保编辑器状态显示"✓ 已就绪"

### 工具调用失败
**问题**: 工具执行返回错误

**解决**: 
- 检查文档类型是否匹配（Word工具需要Word文档）
- 查看浏览器控制台的详细错误信息
- 确认OnlyOffice API可用

### LLM不调用工具
**问题**: LLM只回复文字，不执行操作

**解决**:
- 确保Agent模式已启用（显示"🤖 Agent Mode ON"）
- 使用更明确的指令，如"请执行..."或"帮我..."
- 检查LLM是否支持Function Calling功能

## 🚧 开发路线图

- [ ] 支持带参数的工具调用（自定义文本、样式等）
- [ ] 添加更多Word操作（表格、图片、样式）
- [ ] 实现PDF注释和标记功能
- [ ] 支持批量操作
- [ ] 添加操作历史和撤销功能
- [ ] 多文档同时操作

## 📚 相关文档

- [OnlyOffice Document Builder API](https://api.onlyoffice.com/docbuilder/basic)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [项目架构说明](./AGENT_MODE_GUIDE.md)

## 💬 反馈和贡献

欢迎提交Issue和Pull Request！
