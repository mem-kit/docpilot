import React, { useEffect, useState } from 'react';
import EngineStorage from '../extensions/EngineStorage';
import './FileList.css';

export default function FileList({ onFileSelect, selectedFile }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [renamingFile, setRenamingFile] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await EngineStorage.getFileList();
      console.log('Available files:', data);
      setFiles(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError('Failed to load file list');
    } finally {
      setLoading(false);
    }
  };

  const createNewDocument = async (type) => {
    setShowCreateMenu(false);
    
    // 提示用户输入文件名
    const defaultNames = {
      'word': '新建文档',
      'excel': '新建表格',
      'ppt': '新建演示',
      'pdf': '新建文档'
    };
    
    let fileName = prompt(`请输入文件名（不含扩展名，不允许空格）:`, defaultNames[type]);
    
    // 用户取消或未输入
    if (!fileName) {
      return;
    }
    
    // 移除空格并验证
    fileName = fileName.trim().replace(/\s+/g, '');
    
    if (!fileName) {
      alert('文件名不能为空！');
      return;
    }
    
    try {
      // 使用 EngineStorage 创建文件
      const result = await EngineStorage.createFile(type, fileName);
      
      // 等待后端处理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 刷新文件列表
      await fetchFiles();
      
      // 自动打开新建的文件
      if (onFileSelect) {
        onFileSelect({ title: result.filename, id: result.filename });
      }
      
    } catch (err) {
      console.error('创建文档失败:', err);
      alert(`创建文档失败: ${err.message}`);
      setError(`创建文档失败: ${err.message}`);
    }
  };

  const deleteFile = async (filename) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`确定要删除 "${filename}" 吗？`)) {
      return;
    }
    
    try {
      // 使用 EngineStorage 删除文件
      await EngineStorage.deleteFile(filename);
      
      // 刷新文件列表
      await fetchFiles();
      
      // 如果删除的是当前打开的文件，清除选择
      if (selectedFile === filename && onFileSelect) {
        onFileSelect(null);
      }
      
    } catch (err) {
      console.error('删除文件失败:', err);
      alert(`删除文件失败: ${err.message}`);
    }
  };

  const renameFile = async (oldFilename) => {
    const newName = prompt('请输入新文件名（不含扩展名，不允许空格）:', oldFilename.replace(/\.[^.]+$/, ''));
    
    if (!newName) {
      return;
    }
    
    // 移除空格并验证
    const sanitizedName = newName.trim().replace(/\s+/g, '');
    
    if (!sanitizedName) {
      alert('文件名不能为空！');
      return;
    }
    
    // 保留原扩展名
    const extension = oldFilename.match(/\.[^.]+$/)?.[0] || '';
    const newFilename = sanitizedName + extension;
    
    if (newFilename === oldFilename) {
      return; // 名称未改变
    }
    
    try {
      setRenamingFile(oldFilename);
      
      // 使用 EngineStorage 重命名文件
      const result = await EngineStorage.renameFile(oldFilename, sanitizedName);
      const newFilename = result.newFilename;
      
      // 刷新文件列表
      await fetchFiles();
      
      // 如果重命名的是当前打开的文件，更新选择
      if (selectedFile === oldFilename && onFileSelect) {
        onFileSelect({ title: newFilename, id: newFilename });
      }
      
    } catch (err) {
      console.error('重命名文件失败:', err);
      alert(`重命名文件失败: ${err.message}`);
    } finally {
      setRenamingFile(null);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['doc', 'docx'].includes(ext)) return '📄';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📽️';
    if (['txt'].includes(ext)) return '📝';
    if (['pdf'].includes(ext)) return '📕';
    if (['json'].includes(ext)) return '📋';
    return '📎';
  };

  if (loading) {
    return (
      <div className="file-list-container">
        <div className="file-list-header">
          <h3>Files</h3>
          <button onClick={fetchFiles} className="refresh-btn" title="Refresh">
            🔄
          </button>
        </div>
        <div className="file-list-loading">Loading files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-list-container">
        <div className="file-list-header">
          <h3>Files</h3>
          <button onClick={fetchFiles} className="refresh-btn" title="Refresh">
            🔄
          </button>
        </div>
        <div className="file-list-error">
          {error}
          <button onClick={fetchFiles} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <h3>Files ({files.length})</h3>
        <div className="header-actions">
          <div className="create-menu-wrapper">
            <button 
              onClick={() => setShowCreateMenu(!showCreateMenu)} 
              className="create-btn" 
              title="新建文档"
            >
              ➕
            </button>
            {showCreateMenu && (
              <div className="create-menu">
                <div className="create-menu-item" onClick={() => createNewDocument('word')}>
                  📄 Word 文档
                </div>
                <div className="create-menu-item" onClick={() => createNewDocument('excel')}>
                  📊 Excel 表格
                </div>
                <div className="create-menu-item" onClick={() => createNewDocument('ppt')}>
                  📽️ PowerPoint 演示
                </div>
                <div className="create-menu-item" onClick={() => createNewDocument('pdf')}>
                  📕 PDF 文档
                </div>
              </div>
            )}
          </div>
          <button onClick={fetchFiles} className="refresh-btn" title="刷新">
            🔄
          </button>
        </div>
      </div>

      <div className="file-list">
        {console.log('Rendering files, count:', files.length)}
        {files.length === 0 && !loading && (
          <div style={{padding: '20px', textAlign: 'center', color: '#999'}}>
            没有文件
          </div>
        )}
        {files.map((file, index) => {
          console.log(`Rendering file ${index}:`, file.title);
          const isRenaming = renamingFile === file.title;
          return (
            <div
              key={file.id || file.title}
              className={`file-item ${selectedFile === file.title ? 'selected' : ''} ${isRenaming ? 'renaming' : ''}`}
            >
              <span className="file-icon" onClick={() => onFileSelect(file)}>{getFileIcon(file.title)}</span>
              <span className="file-name" title={file.title} onClick={() => onFileSelect(file)}>
                {file.title}
              </span>
              <div className="file-actions">
                <button 
                  className="action-btn rename-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    renameFile(file.title);
                  }}
                  disabled={isRenaming}
                  title="重命名"
                >
                  {isRenaming ? '⏳' : '✏️'}
                </button>
                <button 
                  className="action-btn delete-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file.title);
                  }}
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
