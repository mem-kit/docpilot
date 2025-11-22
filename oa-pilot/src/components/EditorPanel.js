import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import config from '../config';
import './EditorPanel.css';

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

export default function EditorPanel({ selectedFile, onEditorReady, onEditorChange }) {
  const docEditorRef = useRef(null);
  const [isCleaningUp, setIsCleaningUp] = React.useState(false);
  
  // Generate a unique key based on file and timestamp to avoid caching issues
  const documentKey = useMemo(() => `${selectedFile}_${Date.now()}`, [selectedFile]);
  
  // Generate unique editor ID for each document
  const editorId = useMemo(() => `docEditor_${documentKey}`, [documentKey]);
  
  // Reset editor state and cleanup when file changes
  useEffect(() => {
    // Cleanup function for destroying existing editor
    const cleanupEditor = async () => {
      // Set cleaning flag to prevent new editor from rendering
      setIsCleaningUp(true);
      
      // Destroy all existing editor instances before switching files
      if (window.DocEditor && window.DocEditor.instances) {
        const instances = Object.keys(window.DocEditor.instances);
        console.log('🧹 Destroying editors:', instances);
        
        for (const key of instances) {
          try {
            const instance = window.DocEditor.instances[key];
            if (instance && typeof instance.destroyEditor === 'function') {
              instance.destroyEditor();
              console.log('✓ Destroyed instance:', key);
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
            container.parentNode.removeChild(container);
            console.log('✓ Removed container:', container.id);
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
  
  // Handle document ready event
  const onDocumentReady = useCallback((event) => {
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
      
      // Notify parent component
      if (onEditorReady) {
        onEditorReady(editor);
      }
      console.log("✓ Editor ready!");
    } else {
      console.error("✗ Failed to get editor instance");
      if (onEditorReady) {
        onEditorReady(null);
      }
    }
  }, [onEditorReady]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('EditorPanel unmounting, cleaning up editors');
      if (window.DocEditor && window.DocEditor.instances) {
        Object.keys(window.DocEditor.instances).forEach(key => {
          try {
            const instance = window.DocEditor.instances[key];
            if (instance && typeof instance.destroyEditor === 'function') {
              instance.destroyEditor();
            }
          } catch (e) {
            console.log('Error during cleanup:', e);
          }
        });
      }
    };
  }, []);

  return (
    <div className="editor-panel">
      {isCleaningUp ? (
        <div className="editor-loading">
          🧹 清理中...
        </div>
      ) : (
        <div key={`editor-wrapper-${documentKey}`} className="editor-wrapper">
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
  );
}
