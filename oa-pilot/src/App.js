import React, { useRef } from "react";
import config from "./config";
import "./App.css";
import FileList from "./components/FileList";
import ChatPanel from "./components/ChatPanel";
import EditorPanel from "./components/EditorPanel";
import * as APIWord from "./extensions/APIWord";
import * as APIExcel from "./extensions/APIExcel";
import * as APIPowerPoint from "./extensions/APIPowerPoint";
// import * as APIPDF from "./extensions/APIPDF"; // PDF support to be implemented

const getDocumentType = (filename) => {
  if (!filename) return 'word';
  const ext = filename.split('.').pop().toLowerCase();
  if (['doc', 'docx', 'txt', 'pdf'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'cell';
  if (['ppt', 'pptx'].includes(ext)) return 'slide';
  return 'word'; // default
};

export default function App() {
  const [files, setFiles] = React.useState([]);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [docEditor, setDocEditor] = React.useState(null);
  const [isEditorReady, setIsEditorReady] = React.useState(false);
  const [leftPanelVisible, setLeftPanelVisible] = React.useState(true);
  const [rightPanelVisible, setRightPanelVisible] = React.useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = React.useState(280);
  const [rightPanelWidth, setRightPanelWidth] = React.useState(400);
  const [isResizingLeft, setIsResizingLeft] = React.useState(false);
  const [isResizingRight, setIsResizingRight] = React.useState(false);
  const [toolbarVisible, setToolbarVisible] = React.useState(true);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  
  // Handle editor ready callback from EditorPanel
  const handleEditorReady = React.useCallback((editor) => {
    setDocEditor(editor);
    setIsEditorReady(!!editor);
  }, []);
  
  // Load files from OnlyOffice example storage
  React.useEffect(() => {
    fetch(config.baseURL + 'example/files')
      .then(res => res.json())
      .then(data => {
        console.log('Available files:', data);
        setFiles(data);
      })
      .catch(err => console.error('Failed to load files:', err));
  }, []);

  // Handle file selection
  const handleFileSelect = (file) => {
    setSelectedFile(file.title);
  };

  // Handle MCP config load
  const handleLoadMCP = () => {
    console.log('MCP Config loaded');
  };

  // Handle left panel resize
  const handleLeftResizeStart = (e) => {
    e.preventDefault();
    setIsResizingLeft(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = leftPanelWidth;
  };

  // Handle right panel resize
  const handleRightResizeStart = (e) => {
    e.preventDefault();
    setIsResizingRight(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = rightPanelWidth;
  };

  // Handle mouse move during resize
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        const delta = e.clientX - resizeStartX.current;
        const newWidth = Math.max(200, Math.min(500, resizeStartWidth.current + delta));
        setLeftPanelWidth(newWidth);
      } else if (isResizingRight) {
        const delta = resizeStartX.current - e.clientX;
        const newWidth = Math.max(300, Math.min(700, resizeStartWidth.current + delta));
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight, leftPanelWidth, rightPanelWidth]);
  
  // Function to update a paragraph in the document
  const updateParagraph = () => {
    APIWord.updateParagraph(docEditor);
  };

  
  // Function to insert formatted text
  const insertFormattedText = () => {
    APIWord.insertFormattedText(docEditor);
  };
  
  // Function to replace current word
  const replaceCurrentWord = () => {
    APIWord.replaceCurrentWord(docEditor);
  };

  // Function to update spreadsheet
  const updateSpreadsheet = () => {
    APIExcel.updateSpreadsheet(docEditor);
  };

  // Function to update presentation
  const updatePresentation = () => {
    APIPowerPoint.updatePresentation(docEditor);
  };
  
  return (
    <div className="app-container">
      {/* Top toolbar */}
      <div 
        className="app-toolbar" 
        style={{
          height: toolbarVisible ? 'auto' : '0',
          minHeight: toolbarVisible ? 'auto' : '0',
          overflow: toolbarVisible ? 'visible' : 'hidden',
          transition: toolbarVisible ? 'none' : 'all 0.3s ease',
          position: 'relative'
        }}
      >
        <div className="toolbar-left">
          <div style={{ fontWeight: 'bold', color: '#333' }}>OA Pilot</div>
          
          {/* Status indicator */}
          <div style={{ 
            padding: '4px 8px', 
            background: isEditorReady ? '#4CAF50' : '#FF9800', 
            color: 'white', 
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {isEditorReady ? '✓ Ready' : '⏳ Loading...'}
          </div>
          
          {getDocumentType(selectedFile) === 'word' && (
            <>
              <button 
                onClick={updateParagraph}
                style={{ 
                  padding: '6px 12px', 
                  background: '#4CAF50', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                📝 Update paragraph
              </button>
              
              <button 
                onClick={insertFormattedText}
                style={{ 
                  padding: '6px 12px', 
                  background: '#2196F3', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                ✨ Insert formatted text
              </button>
              
              <button 
                onClick={replaceCurrentWord}
                style={{ 
                  padding: '6px 12px', 
                  background: '#FF9800', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                🔄 Replace current word
              </button>
            </>
          )}

          {getDocumentType(selectedFile) === 'cell' && (
            <button 
              onClick={updateSpreadsheet}
              style={{ 
                padding: '6px 12px', 
                background: '#4CAF50', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              📊 Update cell
            </button>
          )}

          {getDocumentType(selectedFile) === 'slide' && (
            <button 
              onClick={updatePresentation}
              style={{ 
                padding: '6px 12px', 
                background: '#E91E63', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              📽️ Update presentation
            </button>
          )}
        </div>
        
        {/* Toolbar toggle button */}
        {toolbarVisible && (
          <button 
            onClick={() => setToolbarVisible(false)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#666',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
            title="隐藏工具栏"
          >
            ▲
          </button>
        )}
      </div>
      
      {/* Show toolbar button when hidden */}
      {!toolbarVisible && (
        <div 
          onClick={() => setToolbarVisible(true)}
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.1)',
            border: 'none',
            borderRadius: '0 0 8px 8px',
            padding: '4px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#666',
            transition: 'all 0.2s',
            zIndex: 1000
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
          title="显示工具栏"
        >
          ▼
        </div>
      )}
      
      {/* Main content area with three panels */}
      <div className="app-content">
        {/* Left panel - File List */}
        <div 
          className="left-panel" 
          style={{ 
            width: leftPanelVisible ? `${leftPanelWidth}px` : '0',
            minWidth: leftPanelVisible ? `${leftPanelWidth}px` : '0',
            maxWidth: leftPanelVisible ? `${leftPanelWidth}px` : '0',
            overflow: leftPanelVisible ? 'visible' : 'hidden',
            transition: leftPanelVisible ? 'none' : 'all 0.3s ease'
          }}
        >
          <FileList 
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
          {leftPanelVisible && (
            <div className="resize-handle resize-handle-right">
              <div 
                className="resize-handle-drag"
                onMouseDown={handleLeftResizeStart}
                title="拖拽调整宽度"
              />
              <button 
                className="resize-handle-btn"
                onClick={() => setLeftPanelVisible(false)}
                title="隐藏文件列表"
              >
                ◀
              </button>
            </div>
          )}
        </div>
        {!leftPanelVisible && (
          <div 
            className="panel-toggle panel-toggle-left"
            onClick={() => setLeftPanelVisible(true)}
            title="显示文件列表"
          >
            <span>▶</span>
          </div>
        )}

        {/* Center panel - Document Editor */}
        <div className="center-panel">
          <EditorPanel 
            selectedFile={selectedFile}
            onEditorReady={handleEditorReady}
          />
        </div>

        {/* Right panel - Chat */}
        <div 
          className="right-panel" 
          style={{ 
            width: rightPanelVisible ? `${rightPanelWidth}px` : '0',
            minWidth: rightPanelVisible ? `${rightPanelWidth}px` : '0',
            maxWidth: rightPanelVisible ? `${rightPanelWidth}px` : '0',
            overflow: rightPanelVisible ? 'visible' : 'hidden',
            transition: rightPanelVisible ? 'none' : 'all 0.3s ease'
          }}
        >
          {rightPanelVisible && (
            <div className="resize-handle resize-handle-left">
              <div 
                className="resize-handle-drag"
                onMouseDown={handleRightResizeStart}
                title="拖拽调整宽度"
              />
              <button 
                className="resize-handle-btn"
                onClick={() => setRightPanelVisible(false)}
                title="隐藏聊天面板"
              >
                ▶
              </button>
            </div>
          )}
          <ChatPanel 
            docEditor={docEditor}
            isEditorReady={isEditorReady}
            files={files}
            onLoadMCP={handleLoadMCP}
          />
        </div>
        {!rightPanelVisible && (
          <div 
            className="panel-toggle panel-toggle-right"
            onClick={() => setRightPanelVisible(true)}
            title="显示聊天面板"
          >
            <span>◀</span>
          </div>
        )}
      </div>
    </div>
  )
}