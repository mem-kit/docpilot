import {DocumentEditor} from "@onlyoffice/document-editor-react";
import React, {useRef} from "react";
import config from "./config";
import "./App.css";

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

export default function App() {
  const [files, setFiles] = React.useState([]);
  const [selectedFile, setSelectedFile] = React.useState('new.docx');
  const docEditorRef = useRef(null);
  const [docEditor, setDocEditor] = React.useState(null);
  
  // Generate a unique key based on file and timestamp to avoid caching issues
  const documentKey = React.useMemo(() => `${selectedFile}_${Date.now()}`, [selectedFile]);
  
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
  
  // Handle document ready event
  const onDocumentReady = React.useCallback((event) => {
    console.log("✓ Document is loaded");
    
    // Get editor instance from window.DocEditor instances
    let editor = null;
    
    if (window.DocEditor && window.DocEditor.instances) {
      const instances = window.DocEditor.instances;
      console.log("DocEditor instances:", Object.keys(instances));
      
      // Get by ID or first available
      editor = instances['docxEditor'] || instances[Object.keys(instances)[0]];
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
      console.log("✓ Editor ready!");
    } else {
      console.error("✗ Failed to get editor instance");
    }
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
      docEditor.showMessage(
        "API Limitation", 
        "当前 ONLYOFFICE 服务版本不支持 createConnector API，无法通过代码直接修改文档内容。\n请升级 Document Server。", 
        "warning"
      );
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
  
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar with file selector and test buttons */}
      <div style={{ padding: '10px', background: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        {/* SDK Test Buttons Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 'bold', color: '#333', marginRight: '10px' }}>SDK 测试功能：</div>
          
          {/* Status indicator */}
          <div style={{ 
            padding: '4px 8px', 
            background: docEditor ? '#4CAF50' : '#FF9800', 
            color: 'white', 
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {docEditor ? '✓ 已就绪' : '⏳ 加载中...'}
          </div>
          
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
        </div>
        
        {/* File selector row */}
        {files.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold', color: '#333' }}>选择文件: </label>
            <select 
              value={selectedFile} 
              onChange={(e) => setSelectedFile(e.target.value)}
              style={{ padding: '5px 10px', marginLeft: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {files.map(file => (
                <option key={file.id} value={file.title}>{file.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Document editor */}
      <div style={{ flex: 1 }}>
        <DocumentEditor
          ref={docEditorRef}
          id="docxEditor"
          documentServerUrl={config.baseURL}
          config={{
            document: {
              fileType: "docx",
              key: documentKey,
              title: selectedFile,
              url: `${config.baseURL}example/download?fileName=${selectedFile}`,
            },
            documentType: "word",
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
    </div>
  )
}