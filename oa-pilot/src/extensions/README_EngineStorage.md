# EngineStorage - 文件存储引擎

统一的文件操作 API，提供完整的文件管理功能。

## 功能列表

- ✅ 获取文件列表
- ✅ 创建新文件（支持 Word、Excel、PPT、PDF）
- ✅ 删除文件
- ✅ 重命名文件
- ✅ 打开文件
- ✅ 下载文件
- ✅ 上传文件

## API 文档

### 1. 获取文件列表

```javascript
import EngineStorage from './extensions/EngineStorage';

const files = await EngineStorage.getFileList();
// 返回: Array<{ title, id, version, contentLength, updated, ... }>
```

### 2. 创建新文件

```javascript
// 参数: type ('word' | 'excel' | 'ppt' | 'pdf'), filename (不含扩展名)
const result = await EngineStorage.createFile('word', '我的文档');
// 返回: { filename: "我的文档.docx", documentType: "word" }
```

支持的文件类型：
- `'word'` → `.docx`
- `'excel'` → `.xlsx`
- `'ppt'` → `.pptx`
- `'pdf'` → `.pdf`

### 3. 删除文件

```javascript
await EngineStorage.deleteFile('我的文档.docx');
```

### 4. 重命名文件

```javascript
// 参数: oldFilename, newName (不含扩展名，扩展名会自动保留)
const result = await EngineStorage.renameFile('旧文件.docx', '新文件');
// 返回: { oldFilename: "旧文件.docx", newFilename: "新文件.docx" }
```

### 5. 打开文件

```javascript
// 获取文件信息用于编辑器加载
const fileInfo = await EngineStorage.openFile('我的文档.docx');
// 返回: { title, id, url }

// 传递给编辑器
onFileSelect(fileInfo);
```

### 6. 下载文件

```javascript
const blob = await EngineStorage.downloadFile('我的文档.docx');
// 返回: Blob 对象
```

### 7. 上传文件

```javascript
const blob = new Blob([content], { type: 'application/...' });
const result = await EngineStorage.uploadFile(blob, 'newfile.docx');
// 返回: { filename, documentType }
```

## 在组件中使用

### FileList 组件

```javascript
import EngineStorage from '../extensions/EngineStorage';

// 获取文件列表
const files = await EngineStorage.getFileList();
setFiles(files);

// 创建文件
const result = await EngineStorage.createFile('word', '新文档');

// 删除文件
await EngineStorage.deleteFile(filename);

// 重命名文件
await EngineStorage.renameFile(oldName, newName);
```

### ChatPanel 组件（Agent 自动化）

```javascript
import EngineStorage from '../extensions/EngineStorage';

// Agent 命令：创建文档
async function handleCreateCommand(filename) {
  const result = await EngineStorage.createFile('word', filename);
  const fileInfo = await EngineStorage.openFile(result.filename);
  onFileSelect(fileInfo); // 自动打开编辑器
  return `已创建并打开文档: ${result.filename}`;
}

// Agent 命令：打开文档
async function handleOpenCommand(filename) {
  const fileInfo = await EngineStorage.openFile(filename);
  onFileSelect(fileInfo);
  return `已打开文档: ${filename}`;
}

// Agent 命令：删除文档
async function handleDeleteCommand(filename) {
  await EngineStorage.deleteFile(filename);
  return `已删除文档: ${filename}`;
}

// Agent 命令：列出所有文件
async function handleListCommand() {
  const files = await EngineStorage.getFileList();
  return `共 ${files.length} 个文件: ${files.map(f => f.title).join(', ')}`;
}
```

## Agent 工作流示例

```javascript
// 完整的 Agent 自动化流程
async function agentWorkflow() {
  // 1. 创建文档
  const created = await EngineStorage.createFile('word', '会议纪要');
  
  // 2. 打开文档供用户编辑
  const fileInfo = await EngineStorage.openFile(created.filename);
  onFileSelect(fileInfo);
  
  // 3. 等待编辑完成后重命名
  await new Promise(resolve => setTimeout(resolve, 5000));
  await EngineStorage.renameFile(created.filename, '会议纪要-已完成');
  
  // 4. 确认操作
  const files = await EngineStorage.getFileList();
  console.log('操作完成，当前文件:', files.map(f => f.title));
}
```

## 错误处理

所有方法都会抛出错误，建议使用 try-catch：

```javascript
try {
  await EngineStorage.createFile('word', '文档');
} catch (error) {
  console.error('操作失败:', error.message);
  alert(`操作失败: ${error.message}`);
}
```

## 特性

- ✅ 自动去除文件名中的空格
- ✅ 自动添加正确的文件扩展名
- ✅ 使用模板文件创建新文档
- ✅ 通过 proxy 避免 CORS 问题
- ✅ 完整的错误处理和日志
- ✅ 支持 Agent 自动化操作

## 依赖

- 后端 API：`http://192.168.50.156/example/`
- 代理配置：`src/setupProxy.js`
- 模板文件：`public/sample/*.{docx,xlsx,pptx,pdf}`
