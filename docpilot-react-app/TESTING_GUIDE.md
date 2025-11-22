# ONLYOFFICE SDK 集成 - 功能测试

## 已完成的功能

### 1. ✅ 更新段落功能按钮

在应用顶部添加了一个绿色按钮 "📝 更新段落"，功能包括：
- 获取当前光标位置的单词
- 获取当前句子
- 在光标位置插入带时间戳的文本

**使用方法：**
1. 在文档中点击任意位置
2. 点击 "📝 更新段落" 按钮
3. 会在当前位置插入类似 `[Updated at 10:30:45 AM]` 的文本

### 2. ✅ 插入格式化文本按钮

蓝色按钮 "✨ 插入格式化文本"，功能：
- 使用 HTML 格式插入文本
- 支持**粗体**、*斜体*、下划线等格式

**使用方法：**
1. 在文档中点击要插入的位置
2. 点击按钮
3. 会插入包含多种格式的示例文本

### 3. ✅ 替换当前单词按钮

橙色按钮 "🔄 替换当前单词"，功能：
- 获取光标所在的单词
- 将其替换为 "REPLACED"

**使用方法：**
1. 将光标放在某个单词上
2. 点击按钮
3. 该单词会被替换为 "REPLACED"

## 技术实现细节

### 核心代码结构

```javascript
// 1. 创建 ref 来访问 DocumentEditor 实例
const docEditorRef = useRef(null);

// 2. 将 ref 绑定到 DocumentEditor 组件
<DocumentEditor ref={docEditorRef} ... />

// 3. 通过 executeMethod 调用 API
const docEditor = docEditorRef.current.docEditor;
docEditor.executeMethod('MethodName', [args], (result) => {
  console.log(result);
});
```

### 使用的 API 方法

1. **GetCurrentWord** - 获取当前单词
2. **GetCurrentSentence** - 获取当前句子
3. **AddText** - 添加纯文本
4. **pluginMethod_PasteHtml** - 粘贴 HTML 格式文本
5. **pluginMethod_ReplaceCurrentWord** - 替换当前单词

## 测试步骤

### 测试环境准备
1. 确保 ONLYOFFICE Document Server 运行在 `http://172.20.10.2/`
2. 启动 React 应用：`npm start` 或 `npm run dev`
3. 打开浏览器访问应用

### 测试用例 1: 更新段落
```
1. 打开一个 Word 文档（如 new.docx）
2. 在文档中输入一些文本："This is a test document."
3. 将光标放在文本中间
4. 点击 "📝 更新段落" 按钮
5. 验证是否插入了带时间戳的文本
6. 检查浏览器控制台，应该显示：
   - Current word: [当前单词]
   - Current sentence: [当前句子]
   - Text added successfully
```

### 测试用例 2: 插入格式化文本
```
1. 将光标放在文档末尾
2. 点击 "✨ 插入格式化文本" 按钮
3. 验证是否插入了包含粗体、斜体、下划线的文本
4. 检查控制台是否显示 "Formatted text inserted"
```

### 测试用例 3: 替换单词
```
1. 在文档中输入："The quick brown fox"
2. 将光标放在单词 "quick" 上
3. 点击 "🔄 替换当前单词" 按钮
4. 验证 "quick" 是否被替换为 "REPLACED"
5. 检查控制台显示：
   - Replacing word: quick
   - Word replaced
```

## 已知问题和限制

1. **异步操作**：所有 API 调用都是异步的，需要使用回调函数
2. **文档权限**：需要确保文档处于编辑模式
3. **API 可用性**：某些 API 方法可能在特定版本的 ONLYOFFICE 中不可用

## 扩展建议

可以添加更多功能按钮：
- 🔍 搜索和替换
- 📋 复制选中文本
- ✂️ 剪切选中文本
- 📝 更改文本格式（字体、大小、颜色）
- 📊 插入表格
- 🖼️ 插入图片
- 📄 创建新段落

## 相关文档

- `ONLYOFFICE_SDK_USAGE.md` - 详细的 API 使用指南
- [ONLYOFFICE SDK GitHub](https://github.com/ONLYOFFICE/sdkjs)
- [ONLYOFFICE API 文档](https://api.onlyoffice.com/)

## 更新日志

**2024-11-21**
- ✅ 添加了三个测试功能按钮
- ✅ 实现了段落更新功能
- ✅ 实现了格式化文本插入
- ✅ 实现了单词替换功能
- ✅ 创建了详细的 API 使用文档
