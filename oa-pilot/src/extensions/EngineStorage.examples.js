/**
 * EngineStorage API 使用示例
 * 
 * 在 ChatPanel 或其他组件中使用文件操作 API
 */

import EngineStorage from '../extensions/EngineStorage';

// ============= 使用示例 =============

// 1. 获取文件列表
async function example_getFileList() {
  try {
    const files = await EngineStorage.getFileList();
    console.log('文件列表:', files);
    // 返回: [{ title: "file.docx", id: "...", version: 1, ... }]
  } catch (error) {
    console.error('获取文件列表失败:', error);
  }
}

// 2. 创建新文件
async function example_createFile() {
  try {
    // 创建 Word 文档
    const result = await EngineStorage.createFile('word', '我的新文档');
    console.log('文件已创建:', result);
    // 返回: { filename: "我的新文档.docx", documentType: "word" }
    
    // 其他类型
    await EngineStorage.createFile('excel', '销售数据');
    await EngineStorage.createFile('ppt', '项目演示');
    await EngineStorage.createFile('pdf', '报告');
  } catch (error) {
    console.error('创建文件失败:', error);
  }
}

// 3. 删除文件
async function example_deleteFile() {
  try {
    await EngineStorage.deleteFile('我的新文档.docx');
    console.log('文件已删除');
  } catch (error) {
    console.error('删除文件失败:', error);
  }
}

// 4. 重命名文件
async function example_renameFile() {
  try {
    const result = await EngineStorage.renameFile('我的新文档.docx', '更新后的文档');
    console.log('文件已重命名:', result);
    // 返回: { oldFilename: "我的新文档.docx", newFilename: "更新后的文档.docx" }
  } catch (error) {
    console.error('重命名文件失败:', error);
  }
}

// 5. 打开文件（获取文件信息用于编辑器）
async function example_openFile() {
  try {
    const fileInfo = await EngineStorage.openFile('我的新文档.docx');
    console.log('文件信息:', fileInfo);
    // 返回: { title: "我的新文档.docx", id: "...", url: "http://..." }
    
    // 可以将这个信息传递给 EditorPanel
    // onFileSelect(fileInfo);
  } catch (error) {
    console.error('打开文件失败:', error);
  }
}

// 6. 下载文件内容
async function example_downloadFile() {
  try {
    const blob = await EngineStorage.downloadFile('我的新文档.docx');
    console.log('文件已下载:', blob.size, 'bytes');
    
    // 可以创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '我的新文档.docx';
    a.click();
  } catch (error) {
    console.error('下载文件失败:', error);
  }
}

// 7. 上传文件
async function example_uploadFile() {
  try {
    // 从文件输入获取文件
    // const fileInput = document.querySelector('input[type="file"]');
    // const file = fileInput.files[0];
    
    // 或从 Blob 创建
    const blob = new Blob(['Hello World'], { type: 'text/plain' });
    
    const result = await EngineStorage.uploadFile(blob, 'test.txt');
    console.log('文件已上传:', result);
  } catch (error) {
    console.error('上传文件失败:', error);
  }
}

// ============= 在 ChatPanel 中使用 Agent 命令 =============

/**
 * 处理 Agent 的文件操作命令
 * @param {string} command - 命令类型
 * @param {Object} params - 命令参数
 */
async function handleAgentFileCommand(command, params) {
  switch (command) {
    case 'create':
      // Agent: "创建一个名为'会议纪要'的Word文档"
      return await EngineStorage.createFile(params.type || 'word', params.filename);
      
    case 'open':
      // Agent: "打开'会议纪要.docx'"
      return await EngineStorage.openFile(params.filename);
      
    case 'delete':
      // Agent: "删除'临时文件.docx'"
      return await EngineStorage.deleteFile(params.filename);
      
    case 'rename':
      // Agent: "将'草稿.docx'重命名为'最终版本'"
      return await EngineStorage.renameFile(params.oldName, params.newName);
      
    case 'list':
      // Agent: "显示所有文件"
      return await EngineStorage.getFileList();
      
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

// ============= 完整的 Agent 工作流示例 =============

async function example_agentWorkflow() {
  try {
    // 1. 创建新文档
    console.log('Agent: 创建新文档...');
    const created = await EngineStorage.createFile('word', '项目计划');
    
    // 2. 打开文档
    console.log('Agent: 打开文档...');
    const fileInfo = await EngineStorage.openFile(created.filename);
    
    // 3. 编辑文档（通过 EditorPanel）
    console.log('Agent: 编辑文档...');
    // onFileSelect(fileInfo);
    
    // 4. 重命名文档
    console.log('Agent: 重命名文档...');
    await EngineStorage.renameFile(created.filename, '项目计划-最终版');
    
    // 5. 获取文件列表确认
    console.log('Agent: 确认文件列表...');
    const files = await EngineStorage.getFileList();
    console.log('当前文件:', files.map(f => f.title));
    
    console.log('Agent: 工作流完成！');
  } catch (error) {
    console.error('Agent 工作流失败:', error);
  }
}

export {
  example_getFileList,
  example_createFile,
  example_deleteFile,
  example_renameFile,
  example_openFile,
  example_downloadFile,
  example_uploadFile,
  handleAgentFileCommand,
  example_agentWorkflow
};
