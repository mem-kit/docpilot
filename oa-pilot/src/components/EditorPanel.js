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
  
  // Replace logo with text in OnlyOffice iframe using overlay
  const replaceLogoWithText = useCallback(() => {
    const tryReplaceLogo = (attemptCount = 0) => {
      const maxAttempts = 50;
      const interval = 100; // 减少间隔时间，更快响应
      
      try {
        const iframe = document.querySelector('.editor-wrapper iframe');
        
        if (!iframe) {
          if (attemptCount < maxAttempts) {
            setTimeout(() => tryReplaceLogo(attemptCount + 1), interval);
          }
          return;
        }
        
        // 一旦找到iframe就立即创建覆盖层（即使iframe内容还没加载）
        if (attemptCount === 0) {
          console.log('Iframe found, creating overlay immediately');
          createLogoOverlay(iframe);
        }
        
        // 尝试直接访问iframe内容（同端口才能访问）
        let iframeDoc = null;
        try {
          iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        } catch (e) {
          // 跨域，无法访问，已经创建了覆盖层，可以返回
          if (attemptCount > 0) {
            return;
          }
        }
        
        if (iframeDoc) {
          // 同源，可以直接操作
          const extraElement = iframeDoc.querySelector('.extra');
          if (extraElement) {
            // 移除覆盖层，直接修改iframe内容
            const oldOverlay = document.getElementById('onlyoffice-logo-overlay');
            const oldMask = document.getElementById('onlyoffice-logo-mask');
            if (oldOverlay) oldOverlay.remove();
            if (oldMask) oldMask.remove();
            
            extraElement.innerHTML = 'Office Engine';
            extraElement.style.cssText = 'font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0 12px; color: #444;';
            console.log('✓ Logo replaced in iframe (same-origin)');
            return;
          }
          
          if (attemptCount < maxAttempts) {
            setTimeout(() => tryReplaceLogo(attemptCount + 1), interval);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        if (attemptCount < maxAttempts) {
          setTimeout(() => tryReplaceLogo(attemptCount + 1), interval);
        }
      }
    };
    
    // 创建覆盖层来显示自定义文本，并遮盖原logo
    const createLogoOverlay = (iframe) => {
      const overlayId = 'onlyoffice-logo-overlay';
      const maskId = 'onlyoffice-logo-mask';
      
      // 删除旧的覆盖层和遮罩
      const oldOverlay = document.getElementById(overlayId);
      const oldMask = document.getElementById(maskId);
      if (oldOverlay) oldOverlay.remove();
      if (oldMask) oldMask.remove();
      
      // 创建遮罩层来盖住原logo（只遮盖logo区域）
      const mask = document.createElement('div');
      mask.id = maskId;
      mask.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 150px;
        height: 24px;
        background: #f5f5f5;
        z-index: 999;
        pointer-events: none;
      `;
      
      // 创建新的文本覆盖层
      const overlay = document.createElement('div');
      overlay.id = overlayId;
      overlay.textContent = 'Office Engine';
      overlay.style.cssText = `
        position: absolute;
        top: 3px;
        left: 12px;
        font-size: 14px;
        font-weight: bold;
        color: #444;
        z-index: 1000;
        pointer-events: none;
        letter-spacing: 0.3px;
      `;
      
      // 将覆盖层添加到iframe的父容器
      const wrapper = iframe.parentElement;
      if (wrapper) {
        wrapper.style.position = 'relative';
        wrapper.appendChild(mask);
        wrapper.appendChild(overlay);
        console.log('✓ Logo overlay and mask created');
      }
    };
    
    tryReplaceLogo();
  }, []);

  // Handle app ready event - fires when editor UI is fully loaded
  const onAppReady = useCallback(() => {
    console.log("✓ OnlyOffice App is ready (UI loaded)");
    // Try to replace logo when app UI is ready
    replaceLogoWithText();
  }, [replaceLogoWithText]);
  
  // Use MutationObserver to watch for DOM changes and replace logo
  useEffect(() => {
    if (!selectedFile || isCleaningUp) return;
    
    // 立即尝试，不延迟
    replaceLogoWithText();
    
    // 也在短时间后再次尝试，确保覆盖
    setTimeout(() => replaceLogoWithText(), 100);
    setTimeout(() => replaceLogoWithText(), 300);
    
    // 设置MutationObserver监听DOM变化
    const observer = new MutationObserver((mutations) => {
      // 检查是否有.extra或.logo元素被添加
      const hasLogoAdded = mutations.some(mutation => {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Element node
              if (node.classList?.contains('extra') || 
                  node.classList?.contains('logo') ||
                  node.querySelector?.('.extra') ||
                  node.querySelector?.('.logo')) {
                return true;
              }
            }
          }
        }
        return false;
      });
      
      if (hasLogoAdded) {
        console.log('✓ Logo element detected in DOM, attempting replacement...');
        replaceLogoWithText();
      }
    });
    
    // 开始观察整个document的变化
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => {
      observer.disconnect();
    };
  }, [selectedFile, isCleaningUp, replaceLogoWithText]);

  // Handle document ready event
  const onDocumentReady = useCallback((event) => {
    console.log("✓ Document is loaded");
    
    // Replace logo with text after document loads (backup attempt)
    replaceLogoWithText();
    
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
  }, [onEditorReady, replaceLogoWithText]);
  
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
      {!selectedFile ? (
        <div className="editor-loading">
          Please select one document to edit from left file list.
        </div>
      ) : isCleaningUp ? (
        <div className="editor-loading">
          🧹 Cleaning up...
        </div>
      ) : (
        <div key={`editor-wrapper-${documentKey}`} className="editor-wrapper">
          <DocumentEditor
            key={`${getDocumentType(selectedFile)}-${documentKey}`}
            ref={docEditorRef}
            id={editorId}
            documentServerUrl={config.officeEngineURL}
            config={{
              document: {
                fileType: getFileType(selectedFile),
                key: documentKey,
                title: selectedFile,
                url: `${config.storageEngineURL}example/download?fileName=${encodeURIComponent(selectedFile)}`,
              },
              documentType: getDocumentType(selectedFile),
              editorConfig: {
                mode: "edit",
                callbackUrl: `${config.storageEngineURL}example/track?filename=${encodeURIComponent(selectedFile)}`,
              },
            }}
            events_onAppReady={onAppReady}
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
