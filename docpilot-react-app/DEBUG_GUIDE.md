# 调试指南 - ONLYOFFICE SDK 按钮点击问题

## 已修复的问题

### 问题描述
- 按钮点击后没有反应
- Document Editor 实例无法正确获取

### 解决方案

#### 1. 正确保存 Document Editor 实例
```javascript
const [docEditor, setDocEditor] = React.useState(null);

const onDocumentReady = React.useCallback((event) => {
  console.log("Document is loaded");
  if (docEditorRef.current) {
    const editor = docEditorRef.current.docEditor;
    setDocEditor(editor);  // 保存实例到 state
  }
}, []);
```

#### 2. 使用保存的实例
```javascript
const updateParagraph = () => {
  if (!docEditor) {
    alert('请等待文档加载完成后再试');
    return;
  }
  
  docEditor.executeMethod('AddText', ['text'], (result) => {
    console.log('Success:', result);
  });
};
```

#### 3. 添加状态指示器
界面顶部现在会显示：
- 🟠 **⏳ 加载中...** - 文档还未就绪
- 🟢 **✓ 已就绪** - 文档已加载，可以使用按钮

## 测试步骤

### 1. 启动应用
```bash
npm start
```

### 2. 检查浏览器控制台
应该看到以下日志：
```
Skip loading. Instance already exists docxEditor
Editor info: {...}
Document is loaded
Document Editor instance: {...}
Saving docEditor instance: [Object]
```

### 3. 等待状态指示器变绿
- 看到 "✓ 已就绪" 时才能点击按钮
- 如果一直显示 "⏳ 加载中..."，检查网络连接和 ONLYOFFICE 服务器

### 4. 测试按钮功能

#### 测试 "📝 更新段落"
1. 在文档中输入一些文本
2. 将光标放在文本中
3. 点击 "📝 更新段落" 按钮
4. 控制台应显示：
   ```
   updateParagraph clicked, docEditor: [Object]
   Attempting to update paragraph...
   Current word: [单词]
   Current sentence: [句子]
   Text added successfully
   ```
5. 文档中应插入带时间戳的文本，如：`[Updated at 10:30:45 AM]`

#### 测试 "✨ 插入格式化文本"
1. 将光标放在任意位置
2. 点击按钮
3. 应该插入包含粗体、斜体、下划线的格式化文本
4. 控制台应显示：
   ```
   insertFormattedText clicked, docEditor: [Object]
   Inserting formatted text...
   Formatted text inserted
   ```

#### 测试 "🔄 替换当前单词"
1. 输入文本："Hello world test"
2. 将光标放在 "world" 上
3. 点击按钮
4. "world" 应该被替换为 "REPLACED"
5. 控制台应显示：
   ```
   replaceCurrentWord clicked, docEditor: [Object]
   Replacing current word...
   Replacing word: world
   Word replaced
   ```

## 常见问题排查

### Q: 状态指示器一直显示 "⏳ 加载中..."
**A:** 检查：
1. ONLYOFFICE Document Server 是否运行在 `http://172.20.10.2/`
2. 网络连接是否正常
3. 浏览器控制台是否有错误信息

### Q: 按钮点击后显示 "请等待文档加载完成后再试"
**A:** 
1. 确保状态指示器显示 "✓ 已就绪"
2. 刷新页面重新加载
3. 检查控制台是否有 "Saving docEditor instance" 日志

### Q: executeMethod 调用失败
**A:** 
1. 检查方法名是否正确（区分大小写）
2. 查看控制台完整错误信息
3. 确认 ONLYOFFICE 版本支持该 API

### Q: 文本没有插入到文档中
**A:**
1. 确保文档处于编辑模式 (`mode: "edit"`)
2. 确保光标在文档内部
3. 尝试手动在文档中输入文本测试编辑功能

## 调试技巧

### 1. 查看 docEditor 对象
在浏览器控制台输入：
```javascript
// 获取 React 组件的 state
// 或在代码中添加：
console.log('docEditor object:', docEditor);
console.log('Available methods:', Object.keys(docEditor));
```

### 2. 测试 API 方法是否可用
```javascript
if (docEditor) {
  console.log('executeMethod exists:', typeof docEditor.executeMethod);
  console.log('docEditor type:', docEditor.constructor.name);
}
```

### 3. 逐步测试
- 先测试简单的方法（如 `AddText`）
- 再测试复杂的方法（如 `pluginMethod_PasteHtml`）
- 观察每次调用的控制台输出

## 成功标志

✅ 状态指示器显示绿色 "✓ 已就绪"
✅ 点击按钮后控制台有相应日志
✅ 文档内容被正确修改
✅ 没有错误或警告信息

## 下一步

如果所有测试通过，你可以：
1. 添加更多自定义按钮
2. 实现更复杂的文档操作
3. 集成到你的实际应用场景中

参考 `ONLYOFFICE_SDK_USAGE.md` 获取更多 API 方法。
