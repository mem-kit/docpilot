import React, { useEffect, useState } from 'react';
import EngineStorage from '../extensions/EngineStorage';
import './FileList.css';

export default function FileList({ onFileSelect, selectedFile }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [renamingFile, setRenamingFile] = useState(null);
  const [folders, setFolders] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(() => {
    return localStorage.getItem('selectedWorkspace') || '';
  });

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [selectedWorkspace]);

  const fetchFolders = async () => {
    try {
      const data = await EngineStorage.getFolderList();
      console.log('Available folders:', data);
      setFolders(data);
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await EngineStorage.getFileList(selectedWorkspace);
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
    
    // Prompt user to input file name
    const defaultNames = {
      'word': 'new_word_document',
      'excel': 'new_excel_sheet',
      'ppt': 'new_ppt_presentation',
      'pdf': 'new_pdf_document'
    };
    
    let fileName = prompt(`Please input new file name (without extension, no spaces):`, defaultNames[type]);
    
    // User cancelled or didn't input anything
    if (!fileName) {
      return;
    }
    
    // Remove spaces and validate
    fileName = fileName.trim().replace(/\s+/g, '');
    
    if (!fileName) {
      alert('File name cannot be empty!');
      return;
    }
    
    try {
      // Use EngineStorage to create file
      const result = await EngineStorage.createFile(type, fileName, selectedWorkspace);
      
      // Wait for backend processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh file list
      await fetchFiles();
      
      // Automatically open the newly created file
      if (onFileSelect) {
        onFileSelect({ title: result.filename, id: result.filename });
      }
      
    } catch (err) {
      console.error('Failed to create document:', err);
      alert(`Failed to create document: ${err.message}`);
      setError(`Failed to create document: ${err.message}`);
    }
  };

  const deleteFile = async (filename) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }
    
    try {
      // Use EngineStorage to delete file
      await EngineStorage.deleteFile(filename, selectedWorkspace);
      
      // Refresh file list
      await fetchFiles();
      
      // If deleted file is currently open, clear selection
      if (selectedFile === filename && onFileSelect) {
        onFileSelect(null);
      }
      
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert(`Failed to delete file: ${err.message}`);
    }
  };

  const renameFile = async (oldFilename) => {
    const newName = prompt('Please enter new file name (without extension, no spaces):', oldFilename.replace(/\.[^.]+$/, ''));
    
    if (!newName) {
      return;
    }
    
    // Remove spaces and validate
    const sanitizedName = newName.trim().replace(/\s+/g, '');
    
    if (!sanitizedName) {
      alert('File name cannot be empty!');
      return;
    }
    
    // Keep original extension
    const extension = oldFilename.match(/\.[^.]+$/)?.[0] || '';
    const newFilename = sanitizedName + extension;
    
    if (newFilename === oldFilename) {
      return; // Name unchanged
    }
    
    try {
      setRenamingFile(oldFilename);
      
      // Use EngineStorage to rename file
      const result = await EngineStorage.renameFile(oldFilename, sanitizedName, selectedWorkspace);
      const newFilename = result.newFilename;
      
      // Refresh file list
      await fetchFiles();
      
      // If renamed file is currently open, update selection
      if (selectedFile === oldFilename && onFileSelect) {
        onFileSelect({ title: newFilename, id: newFilename });
      }
      
    } catch (err) {
      console.error('Failed to rename file:', err);
      alert(`Failed to rename file: ${err.message}`);
    } finally {
      setRenamingFile(null);
    }
  };

  const handleWorkspaceChange = (e) => {
    const newWorkspace = e.target.value;
    setSelectedWorkspace(newWorkspace);
    localStorage.setItem('selectedWorkspace', newWorkspace);
    
    // Clear current file selection when switching workspace
    if (onFileSelect) {
      onFileSelect(null);
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
              title="Create New Document"
            >
              ➕
            </button>
            {showCreateMenu && (
              <div className="create-menu">
                <div className="create-menu-item" onClick={() => createNewDocument('word')}>
                  📄 Word Document
                </div>
                <div className="create-menu-item" onClick={() => createNewDocument('excel')}>
                  📊 Excel Spreadsheet
                </div>
                <div className="create-menu-item" onClick={() => createNewDocument('ppt')}>
                  📽️ PowerPoint Presentation
                </div>
                <div className="create-menu-item" onClick={() => createNewDocument('pdf')}>
                  📕 PDF Document
                </div>
              </div>
            )}
          </div>
          <button onClick={fetchFiles} className="refresh-btn" title="Refresh">
            🔄
          </button>
        </div>
      </div>

      <div className="file-list">
        {console.log('Rendering files, count:', files.length)}
        {files.length === 0 && !loading && (
          <div style={{padding: '20px', textAlign: 'center', color: '#999'}}>
            No files
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
                  title="Rename"
                >
                  {isRenaming ? '⏳' : '✏️'}
                </button>
                <button 
                  className="action-btn delete-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file.title);
                  }}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="workspace-selector">
        <label htmlFor="workspace-dropdown">Workspace:</label>
        <select 
          id="workspace-dropdown"
          value={selectedWorkspace} 
          onChange={handleWorkspaceChange}
          className="workspace-dropdown"
        >
          <option value="">Root (Default)</option>
          {folders.map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
