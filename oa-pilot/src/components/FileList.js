import React, { useEffect, useState } from 'react';
import config from '../config';
import './FileList.css';

export default function FileList({ onFileSelect, selectedFile }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.baseURL}example/files`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFiles(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError('Failed to load file list');
    } finally {
      setLoading(false);
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
        <button onClick={fetchFiles} className="refresh-btn" title="Refresh">
          🔄
        </button>
      </div>
      <div className="file-list">
        {files.map((file) => (
          <div
            key={file.id || file.title}
            className={`file-item ${selectedFile === file.title ? 'selected' : ''}`}
            onClick={() => onFileSelect(file)}
          >
            <span className="file-icon">{getFileIcon(file.title)}</span>
            <span className="file-name" title={file.title}>
              {file.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
