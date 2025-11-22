import {DocumentEditor} from "@onlyoffice/document-editor-react";

import React, {useRef} from "react";
import config from "./config";
import "./App.css";
import FileList from "./components/FileList";
import ChatPanel from "./components/ChatPanel";

function onLoadComponentError(errorCode, errorDescription) {
  switch (errorCode) {
  case -1: // Unknown error loading component
    console.log(errorDescription);
    break;

  case -2: // Error load DocsAPI from http://documentserver/
    console.log(errorDescription);
    break;

  case -3: // DocsAPI is not defined
    console.log(errorDescription);
    break;
  
  default:
    break;
  }
}

function onError(event) {
  console.log("Editor error:", event);
  if (event.data && event.data.errorCode) {
    switch(event.data.errorCode) {
      case -4:
        console.error("Download failed - OnlyOffice server cannot access the document URL");
        console.error("Document URL:", event.data.errorDescription);
        break;
      default:
        console.error("Error code:", event.data.errorCode);
        console.error("Error description:", event.data.errorDescription);
    }
  }
}

function onWarning(event) {
  console.log("Editor warning:", event);
}

function onInfo(event) {
  console.log("Editor info:", event);
}

const getFileType = (filename) => {
  if (!filename) return 'docx';
  return filename.split('.').pop().toLowerCase();
};

const getDocumentType = (filename) => {
  const ext = getFileType(filename);
  if (['doc', 'docx', 'txt', 'pdf'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'cell';
  if (['ppt', 'pptx'].includes(ext)) return 'slide';
  return 'word'; // default
};

export default function App() {
  const [files, setFiles] = React.useState([]);
  const [selectedFile, setSelectedFile] = React.useState('new.docx');
  const docEditorRef = useRef(null);
  const [docEditor, setDocEditor] = React.useState(null);
  const [isEditorReady, setIsEditorReady] = React.useState(false);
  const [isCleaningUp, setIsCleaningUp] = React.useState(false);
  const [leftPanelVisible, setLeftPanelVisible] = React.useState(true);
  const [rightPanelVisible, setRightPanelVisible] = React.useState(true);
  const [mcpConfig, setMcpConfig] = React.useState(null);
  const [leftPanelWidth, setLeftPanelWidth] = React.useState(280);
  const [rightPanelWidth, setRightPanelWidth] = React.useState(400);
  const [isResizingLeft, setIsResizingLeft] = React.useState(false);
  const [isResizingRight, setIsResizingRight] = React.useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  
  // Generate a unique key based on file and timestamp to avoid caching issues
  const documentKey = React.useMemo(() => `${selectedFile}_${Date.now()}`, [selectedFile]);
  
  // Generate unique editor ID for each document
  const editorId = React.useMemo(() => `docEditor_${documentKey}`, [documentKey]);
  
  // Reset editor state and cleanup when file changes
  React.useEffect(() => {
    // Cleanup function for destroying existing editor
    const cleanupEditor = async () => {
      // Set cleaning flag to prevent new editor from rendering
      setIsCleaningUp(true);
      setIsEditorReady(false);
      setDocEditor(null);
      
      // Destroy all existing editor instances before switching files
      if (window.DocEditor && window.DocEditor.instances) {
        const instances = Object.keys(window.DocEditor.instances);
        console.log('🧹 Destroying editors:', instances);
        
        for (const key of instances) {
          try {
            const instance = window.DocEditor.instances[key];
            if (instance && typeof instance.destroyEditor === 'function') {
              console.log('Calling destroyEditor on:', key);
              instance.destroyEditor();
            }
            // Manually delete the instance reference
            delete window.DocEditor.instances[key];
            console.log('✓ Deleted instance:', key);
          } catch (e) {
            console.log('Error destroying editor instance:', e);
          }
        }
        
        // Clear any container DOM that might exist
        const allContainers = document.querySelectorAll('[id^="docEditor"]');
        allContainers.forEach(container => {
          if (container && container.parentNode) {
            container.innerHTML = '';
            console.log('✓ Cleared DOM container:', container.id);
          }
        });
        
        // Give ONLYOFFICE time to clean up its own DOM
        await new Promise(resolve => setTimeout(resolve, 250));
        console.log('✓ Cleanup complete');
      }
      
      // Allow new editor to render
      setIsCleaningUp(false);
    };
    
    cleanupEditor();
  }, [selectedFile]);
  
  // Load files from OnlyOffice example storage
  React.useEffect(() => {
    fetch(config.baseURL + 'example/files')
      .then(res => res.json())
      .then(data => {
        console.log('Available files:', data);
        setFiles(data);
        // Set first file as default if available
        if (data.length > 0 && !selectedFile) {
          setSelectedFile(data[0].title);
        }
      })
      .catch(err => console.error('Failed to load files:', err));
  }, []);

  // Handle file selection
  const handleFileSelect = (file) => {
    setSelectedFile(file.title);
  };

  // Handle MCP config load
  const handleLoadMCP = (config) => {
    setMcpConfig(config);
    console.log('MCP Config loaded:', config);
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
  
  // Handle document ready event
  const onDocumentReady = React.useCallback((event) => {
    console.log("✓ Document is loaded");
    
    // Get editor instance from window.DocEditor instances
    let editor = null;
    
    if (window.DocEditor && window.DocEditor.instances) {
      const instances = window.DocEditor.instances;
      console.log("DocEditor instances:", Object.keys(instances));
      
      // Get by ID or first available
      editor = instances['docEditor'] || instances[Object.keys(instances)[0]];
    }
    
    // Fallback to ref
    if (!editor && docEditorRef.current) {
      editor = docEditorRef.current.docEditor || docEditorRef.current;
    }
    
    if (editor) {
      console.log("✓ Got editor instance");
      console.log("Available methods:", Object.keys(editor));
      
      // Save editor - we'll use serviceCommand method which is available
      setDocEditor(editor);
      setIsEditorReady(true);
      console.log("✓ Editor ready!");
    } else {
      console.error("✗ Failed to get editor instance");
      setIsEditorReady(false);
    }
  }, []);
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up editors');
      if (window.DocEditor && window.DocEditor.instances) {
        Object.keys(window.DocEditor.instances).forEach(key => {
          try {
            const instance = window.DocEditor.instances[key];
            if (instance && typeof instance.destroyEditor === 'function') {
              instance.destroyEditor();
            }
          } catch (e) {
            console.log('Error destroying editor on unmount:', e);
          }
        });
      }
    };
  }, []);
  
  // Function to update a paragraph in the document
  const updateParagraph = () => {
    console.log('📝 updateParagraph clicked');
    
    if (!docEditor) {
      console.error('Document editor not initialized yet');
      alert('请等待文档加载完成后再试');
      return;
    }

    // Check if createConnector is available (Standard API)
    if (docEditor.createConnector) {
      try {
        const connector = docEditor.createConnector();
        connector.callCommand(function() {
          // eslint-disable-next-line no-undef
          var oDocument = Api.GetDocument();
          // eslint-disable-next-line no-undef
          var oParagraph = Api.CreateParagraph();
          oParagraph.AddText("这是新插入的段落 from React");
          oDocument.InsertContent([oParagraph]);
        }, function() {
          console.log("Command executed successfully");
        });
      } catch (e) {
        console.error("Connector error:", e);
      }
    } else {
      // Fallback for environments where API is not fully available
      console.warn("createConnector API not available on this Document Server");
  
    }
  };

  
  // Function to insert formatted text
  const insertFormattedText = () => {
    console.log('✨ insertFormattedText clicked');
    
    if (!docEditor) {
      console.error('Document editor not initialized yet');
      alert('请等待文档加载完成后再试');
      return;
    }
    
    if (docEditor.createConnector) {
      try {
        const connector = docEditor.createConnector();
        connector.callCommand(function() {
          // eslint-disable-next-line no-undef
          var oDocument = Api.GetDocument();
          // eslint-disable-next-line no-undef
          var oParagraph = Api.CreateParagraph();
          
          // Bold text
          // eslint-disable-next-line no-undef
          var oRunBold = Api.CreateRun();
          oRunBold.SetBold(true);
          oRunBold.AddText("Bold text");
          oParagraph.AddElement(oRunBold);

          // Normal text
          // eslint-disable-next-line no-undef
          var oRunNormal = Api.CreateRun();
          oRunNormal.AddText(" and ");
          oParagraph.AddElement(oRunNormal);

          // Italic text
          // eslint-disable-next-line no-undef
          var oRunItalic = Api.CreateRun();
          oRunItalic.SetItalic(true);
          oRunItalic.AddText("italic text");
          oParagraph.AddElement(oRunItalic);
          
          // Underline text
          // eslint-disable-next-line no-undef
          var oRunUnderline = Api.CreateRun();
          oRunUnderline.SetUnderline(true);
          oRunUnderline.AddText(" with underline");
          oParagraph.AddElement(oRunUnderline);

          oDocument.InsertContent([oParagraph]);
        }, function() {
          console.log("Formatted text inserted successfully");
        });
      } catch (e) {
        console.error("Connector error:", e);
      }
    } else {
      docEditor.showMessage('API Limitation', 'createConnector API not available', 'warning');
    }
  };
  
  // Function to replace current word
  const replaceCurrentWord = () => {
    console.log('🔄 replaceCurrentWord clicked');
    
    if (!docEditor) {
      console.error('Document editor not initialized yet');
      alert('请等待文档加载完成后再试');
      return;
    }
    
    if (docEditor.createConnector) {
      try {
        const connector = docEditor.createConnector();
        connector.callCommand(function() {
          // eslint-disable-next-line no-undef
          var oDocument = Api.GetDocument();
          
          // Try to get selection
          // eslint-disable-next-line no-undef
          var oRange = oDocument.GetRangeBySelect();
          
          // If selection is empty or collapsed, we might want to select the current word
          // But for simplicity, let's just insert text at current position if nothing selected
          // Or replace selection if something is selected
          
          // eslint-disable-next-line no-undef
          oRange.SetText("REPLACED");
          
        }, function() {
          console.log("Word replaced successfully");
        });
      } catch (e) {
        console.error("Connector error:", e);
      }
    } else {
      docEditor.showMessage('API Limitation', 'createConnector API not available', 'warning');
    }
  };

  // Function to update spreadsheet
  const updateSpreadsheet = () => {
    console.log('📊 updateSpreadsheet clicked');
    
    if (!docEditor) {
      console.error('Document editor not initialized yet');
      alert('请等待文档加载完成后再试');
      return;
    }

    if (docEditor.createConnector) {
      try {
        const connector = docEditor.createConnector();
        connector.callCommand(function() {
          // eslint-disable-next-line no-undef
          var oWorksheet = Api.GetActiveSheet();
          oWorksheet.GetRange("A1").SetValue("Hello from React");
          oWorksheet.GetRange("A1").SetBold(true);
          oWorksheet.GetRange("B1").SetValue("Updated via API");
        }, function() {
          console.log("Spreadsheet updated");
        });
      } catch (e) {
        console.error("Connector error:", e);
      }
    }
  };

  // Function to update presentation
  const updatePresentation = () => {
    console.log('📽️ updatePresentation clicked');
    
    if (!docEditor) {
      console.error('Document editor not initialized yet');
      alert('请等待文档加载完成后再试');
      return;
    }

    if (docEditor.createConnector) {
      try {
        const connector = docEditor.createConnector();
        connector.callCommand(function() {
          // eslint-disable-next-line no-undef
          var oPresentation = Api.GetPresentation();
          var oSlide = oPresentation.GetSlideByIndex(0);
          if (oSlide) {
              var oShape = oSlide.GetAllShapes()[0];
              if (oShape) {
                   var oDocContent = oShape.GetDocContent();
                   oDocContent.RemoveAllElements();
                   var oParagraph = oDocContent.GetElement(0);
                   oParagraph.AddText("Updated Slide from React");
              }
          }
        }, function() {
          console.log("Presentation updated");
        });
      } catch (e) {
        console.error("Connector error:", e);
      }
    }
  };
  
  return (
    <div className="app-container">
      {/* Top toolbar */}
      <div className="app-toolbar">
        <div className="toolbar-left">
          <div style={{ fontWeight: 'bold', color: '#333' }}>SDK 测试功能：</div>
          
          {/* Status indicator */}
          <div style={{ 
            padding: '4px 8px', 
            background: isEditorReady ? '#4CAF50' : '#FF9800', 
            color: 'white', 
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {isEditorReady ? '✓ 已就绪' : '⏳ 加载中...'}
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
                📝 更新段落
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
                ✨ 插入格式化文本
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
                🔄 替换当前单词
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
              📊 更新表格
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
              📽️ 更新幻灯片
            </button>
          )}
        </div>
      </div>
      
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
          {isCleaningUp ? (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '16px',
              color: '#666'
            }}>
              🧹 清理中...
            </div>
          ) : (
            <div key={`editor-wrapper-${documentKey}`} style={{ width: '100%', height: '100%', position: 'absolute' }}>
              <DocumentEditor
                key={`${getDocumentType(selectedFile)}-${documentKey}`}
                ref={docEditorRef}
                id={editorId}
                documentServerUrl={config.baseURL}
                config={{
                  document: {
                    fileType: getFileType(selectedFile),
                    key: documentKey,
                    title: selectedFile,
                    url: `${config.baseURL}example/download?fileName=${selectedFile}`,
                  },
                  documentType: getDocumentType(selectedFile),
                  editorConfig: {
                    mode: "edit",
                    callbackUrl: `${config.baseURL}example/track?filename=${selectedFile}`,
                  },
                }}
                events_onDocumentReady={onDocumentReady}
                events_onError={onError}
                events_onWarning={onWarning}
                events_onInfo={onInfo}
                onLoadComponentError={onLoadComponentError}
              />
            </div>
          )}
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