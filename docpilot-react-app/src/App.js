import {DocumentEditor} from "@onlyoffice/document-editor-react";
import React, {useRef} from "react";
import "./App.css";

function onDocumentReady(event) {
  console.log("Document is loaded");
}

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
  
  // Generate a unique key based on file and timestamp to avoid caching issues
  const documentKey = React.useMemo(() => `${selectedFile}_${Date.now()}`, [selectedFile]);
  
  // Load files from OnlyOffice example storage
  React.useEffect(() => {
    fetch('http://172.20.10.2/example/files')
      .then(res => res.json())
      .then(data => {
        console.log('Available files:', data);
        setFiles(data);
      })
      .catch(err => console.error('Failed to load files:', err));
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* File selector */}
      {files.length > 0 && (
        <div style={{ padding: '10px', background: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
          <label>Select file: </label>
          <select 
            value={selectedFile} 
            onChange={(e) => setSelectedFile(e.target.value)}
            style={{ padding: '5px', marginLeft: '10px' }}
          >
            {files.map(file => (
              <option key={file.id} value={file.title}>{file.title}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Document editor */}
      <div style={{ flex: 1 }}>
        <DocumentEditor
          id="docxEditor"
          documentServerUrl="http://172.20.10.2/"
          config={{
            document: {
              fileType: "docx",
              key: documentKey,
              title: selectedFile,
              url: `http://172.20.10.2/example/download?fileName=${selectedFile}`,
            },
            documentType: "word",
            editorConfig: {
              mode: "edit",
              callbackUrl: `http://172.20.10.2/example/track?filename=${selectedFile}`,
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