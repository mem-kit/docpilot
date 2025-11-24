# 调试指南 - 文档未更新问题

## 🔍 问题症状

执行 Agent 命令后，Word 文档内容没有变化。

## 🛠️ 调试步骤

### 1. 打开浏览器开发者工具

按 `F12` 或右键 → 检查，打开开发者工具的 Console 标签。

### 2. 检查编辑器实例

打开一个 Word 文档后，在 Console 中输入：

```javascript
window.DocEditor.instances
```

**预期结果：** 应该看到类似这样的对象：
```javascript
{
  docEditor: {
    createConnector: function() {...},
    destroyEditor: function() {...},
    // ... 其他方法
  }
}
```

**如果为空或 undefined：** 编辑器未正确初始化

### 3. 测试 createConnector

在 Console 中输入：

```javascript
const editor = window.DocEditor.instances[Object.keys(window.DocEditor.instances)[0]];
const connector = editor.createConnector();
console.log(connector);
```

**预期结果：** 应该返回一个 connector 对象

### 4. 手动测试插入段落

在 Console 中输入：

```javascript
const editor = window.DocEditor.instances[Object.keys(window.DocEditor.instances)[0]];
const connector = editor.createConnector();

connector.callCommand(function() {
  var oDocument = Api.GetDocument();
  var oParagraph = Api.CreateParagraph();
  oParagraph.AddText("测试插入段落 - " + new Date().toISOString());
  oDocument.InsertContent([oParagraph]);
}, function(result) {
  console.log("手动测试成功:", result);
});
```

**预期结果：** 文档中应该出现新的段落

### 5. 查看 Agent 执行日志

切换到 Agent 模式并发送命令后，查看 Console 中的日志：

**应该看到的日志：**

```
🔧 LLM requested tool: updateParagraph {text: "..."}
📝 About to execute tool with editor: {...}
📝 Editor ready status: true
🔧 Executing tool: updateParagraph {text: "..."}
📋 Editor instance: {...}
📋 Editor has createConnector: function() {...}
📝 updateParagraph called with text: ...
Command executed successfully
📝 Tool execution result: {success: true, message: "..."}
```

## 🐛 常见问题和解决方案

### 问题 1: Editor instance: null

**原因：** 编辑器实例没有正确传递给 ChatPanel

**解决方案：**

检查 `App.js` 中是否正确传递了 `docEditor`：

```javascript
<ChatPanel 
  docEditor={docEditor}  // ← 确保这个不是 null
  isEditorReady={isEditorReady}
  ...
/>
```

### 问题 2: Editor has createConnector: undefined

**原因：** OnlyOffice Document Server 版本太旧或配置不正确

**解决方案：**

1. 确认 OnlyOffice Document Server 版本 >= 7.0
2. 检查 `config.js` 中的 `baseURL` 是否正确
3. 确认文档服务器正在运行

### 问题 3: isEditorReady: false

**原因：** 文档还没有完全加载

**解决方案：**

等待编辑器完全加载后再发送命令。可以在 UI 中添加状态提示。

### 问题 4: Command executed successfully 但文档没变化

**原因：** 

1. 可能是编辑模式问题（只读模式）
2. 可能是权限问题
3. 可能是 OnlyOffice API 版本不兼容

**解决方案：**

检查编辑器配置：

```javascript
editorConfig: {
  mode: "edit",  // ← 确保是 "edit" 模式
  callbackUrl: `...`
}
```

### 问题 5: 错误 "createConnector API 不可用"

**原因：** OnlyOffice Document Server 不支持 Connector API

**解决方案：**

1. 升级 OnlyOffice Document Server 到最新版本
2. 或者使用其他 API 方法（如 `setReviewPermissions`）

## 📊 完整测试流程

### 步骤 1: 验证环境

```bash
# 检查 OnlyOffice Server 是否运行
curl http://192.168.50.156/

# 应该返回 OnlyOffice 的欢迎页面
```

### 步骤 2: 测试文档加载

1. 打开应用
2. 选择一个 .docx 文件
3. 等待文档在编辑器中显示
4. 在 Console 输入：`window.DocEditor.instances`
5. 确认有编辑器实例

### 步骤 3: 测试 Agent 模式

1. 切换到 Agent 模式（选择 🤖 Agent）
2. 发送命令：`在文档中添加一段文字：这是测试`
3. 观察 Console 日志
4. 检查文档是否更新

### 步骤 4: 如果失败，手动测试

在 Console 中执行：

```javascript
// 获取编辑器实例
const editor = window.DocEditor.instances[Object.keys(window.DocEditor.instances)[0]];
console.log('Editor:', editor);

// 测试 createConnector
if (editor.createConnector) {
  const connector = editor.createConnector();
  console.log('Connector:', connector);
  
  // 测试插入段落
  connector.callCommand(function() {
    var oDocument = Api.GetDocument();
    var oParagraph = Api.CreateParagraph();
    oParagraph.AddText("手动测试 - " + new Date().toLocaleString());
    oDocument.InsertContent([oParagraph]);
  }, function(result) {
    console.log("手动测试结果:", result);
  });
} else {
  console.error('createConnector 不可用');
}
```

## 🔧 代码修复建议

如果问题持续存在，可能需要：

### 1. 添加编辑器状态检查

在 `ChatPanel.js` 中：

```javascript
const sendMessage = async () => {
  // ... 现有代码 ...
  
  if (mode === 'agent' && !isEditorReady) {
    setMessages(prev => [...prev, {
      role: 'system',
      content: '❌ 编辑器未就绪，请等待文档加载完成后再试'
    }]);
    setIsLoading(false);
    return;
  }
  
  if (mode === 'agent' && !docEditor) {
    setMessages(prev => [...prev, {
      role: 'system',
      content: '❌ 编辑器实例不可用，请重新打开文档'
    }]);
    setIsLoading(false);
    return;
  }
  
  // ... 继续执行 ...
}
```

### 2. 改进错误提示

在 UI 中显示编辑器状态：

```javascript
{mode === 'agent' && (
  <div className="agent-status">
    <span className="status-badge">🤖 Agent Mode</span>
    {!isEditorReady && (
      <span className="warning-badge">⚠️ Editor not ready - Please wait</span>
    )}
    {isEditorReady && docEditor && (
      <span className="success-badge">✅ Ready to execute</span>
    )}
  </div>
)}
```

## 📝 日志收集

如果问题仍未解决，请收集以下信息：

1. **浏览器 Console 的完整日志**
2. **Network 标签中的请求**（特别是到 OnlyOffice Server 的请求）
3. **OnlyOffice Server 版本**
4. **文档类型**（.docx, .xlsx, .pptx）
5. **错误消息**（如果有）

## 🎯 快速诊断命令

将以下代码粘贴到 Console 中进行快速诊断：

```javascript
// 快速诊断脚本
console.log('=== OnlyOffice Editor 诊断 ===');
console.log('1. Window.DocEditor:', typeof window.DocEditor);
console.log('2. Instances:', window.DocEditor?.instances);
console.log('3. Instance keys:', Object.keys(window.DocEditor?.instances || {}));

const editor = window.DocEditor?.instances?.[Object.keys(window.DocEditor?.instances || {})[0]];
console.log('4. Editor object:', editor);
console.log('5. Has createConnector:', typeof editor?.createConnector);
console.log('6. Editor methods:', Object.keys(editor || {}));

if (editor?.createConnector) {
  console.log('✅ Editor is ready for API calls');
  
  // 测试插入
  const connector = editor.createConnector();
  connector.callCommand(function() {
    var oDocument = Api.GetDocument();
    var oParagraph = Api.CreateParagraph();
    oParagraph.AddText("诊断测试 - " + new Date().toLocaleTimeString());
    oDocument.InsertContent([oParagraph]);
  }, function(result) {
    console.log('✅ 测试插入成功!', result);
  });
} else {
  console.error('❌ Editor not ready or createConnector not available');
}
```

---

完成这些调试步骤后，您应该能够找到问题所在。如果需要进一步帮助，请提供 Console 日志的截图或文本。
