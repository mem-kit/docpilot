import React, { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';
import config from '../config';
import './ChatPanel.css';

export default function ChatPanel({ docEditor, isEditorReady, files, onLoadMCP }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize OpenAI client with DeepSeek configuration
  const openai = new OpenAI({
    apiKey: config.llmAPIKey,
    baseURL: config.llmURL.trim(), // Remove trailing space
    dangerouslyAllowBrowser: true // Required for browser usage
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMCPConfig = async () => {
    try {
      // Look for mcp.json in the files list
      const mcpFile = files.find(f => f.title.toLowerCase() === 'mcp.json');
      if (!mcpFile) {
        alert('mcp.json not found in file list');
        return;
      }

      // Fetch the mcp.json content
      const response = await fetch(`${config.baseURL}example/download?fileName=${mcpFile.title}`);
      const mcpData = await response.json();
      
      setAgentMode(true);
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: `✅ Configuration loaded successfully. Agent mode enabled.\n\nAvailable tools: ${JSON.stringify(mcpData.tools || mcpData, null, 2)}`
      }]);
      
      if (onLoadMCP) {
        onLoadMCP(mcpData);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      alert('Failed to load configuration: ' + error.message);
    }
  };

  const executeDocumentCommand = (command) => {
    if (!isEditorReady || !docEditor) {
      return 'Document editor is not ready';
    }

    if (!docEditor.createConnector) {
      return 'Document automation API is not available';
    }

    return new Promise((resolve, reject) => {
      try {
        const connector = docEditor.createConnector();
        connector.callCommand(
          function(cmd) {
            try {
              // Execute the command string
              // eslint-disable-next-line no-eval
              eval(cmd);
            } catch (e) {
              return 'Error: ' + e.message;
            }
          }.bind(null, command),
          function(result) {
            resolve(result || 'Command executed successfully');
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  };

  const processAgentCommand = async (userMessage) => {
    // Simple agent logic - detect document manipulation intents
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('insert') || lowerMsg.includes('add text')) {
      // Extract text to insert (simple pattern matching)
      const textMatch = userMessage.match(/"([^"]+)"/);
      const textToInsert = textMatch ? textMatch[1] : 'Sample text from agent';
      
      const command = `
        var oDocument = Api.GetDocument();
        var oParagraph = Api.CreateParagraph();
        oParagraph.AddText("${textToInsert}");
        oDocument.InsertContent([oParagraph]);
      `;
      
      try {
        const result = await executeDocumentCommand(command);
        return `✅ Executed: Inserted text "${textToInsert}"\n\nResult: ${result}`;
      } catch (error) {
        return `❌ Failed to execute command: ${error.message}`;
      }
    }
    
    if (lowerMsg.includes('make bold') || lowerMsg.includes('bold text')) {
      const command = `
        var oDocument = Api.GetDocument();
        var oParagraph = Api.CreateParagraph();
        var oRun = Api.CreateRun();
        oRun.SetBold(true);
        oRun.AddText("Bold text added by agent");
        oParagraph.AddElement(oRun);
        oDocument.InsertContent([oParagraph]);
      `;
      
      try {
        const result = await executeDocumentCommand(command);
        return `✅ Executed: Added bold text\n\nResult: ${result}`;
      } catch (error) {
        return `❌ Failed to execute command: ${error.message}`;
      }
    }
    
    if (lowerMsg.includes('replace') || lowerMsg.includes('change')) {
      const command = `
        var oDocument = Api.GetDocument();
        var oRange = oDocument.GetRangeBySelect();
        oRange.SetText("Text replaced by agent");
      `;
      
      try {
        const result = await executeDocumentCommand(command);
        return `✅ Executed: Replaced selected text\n\nResult: ${result}`;
      } catch (error) {
        return `❌ Failed to execute command: ${error.message}`;
      }
    }
    
    // If no command matched, return null to proceed with normal chat
    return null;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // If agent mode is enabled, try to process as agent command first
      if (agentMode && isEditorReady) {
        const agentResult = await processAgentCommand(userMessage);
        if (agentResult) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: agentResult,
            isAgent: true 
          }]);
          setIsLoading(false);
          return;
        }
      }

      // Otherwise, send to LLM using OpenAI SDK
      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: agentMode 
              ? 'You are a helpful assistant with document automation capabilities. When users ask to modify documents, provide clear instructions or acknowledge successful operations.'
              : 'You are a helpful assistant.'
          },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const assistantMessage = completion.choices[0].message.content;

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `❌ Error: ${error.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>AI Assistant</h3>
        <div className="chat-controls">
          <button 
            onClick={loadMCPConfig} 
            className={`mcp-btn ${agentMode ? 'active' : ''}`}
            title="Load MCP configuration for agent mode"
          >
            {agentMode ? '🤖 Agent Mode ON' : '🔧 Load MCP'}
          </button>
        </div>
      </div>

      {agentMode && (
        <div className="agent-status">
          <span className="status-badge">🤖 Agent Mode Active</span>
          {!isEditorReady && (
            <span className="warning-badge">⚠️ Editor not ready</span>
          )}
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <h4>👋 Welcome!</h4>
            <p>Ask me anything or use agent mode to automate document editing.</p>
            {!agentMode && (
              <p className="hint">💡 Click "Load MCP" to enable document automation.</p>
            )}
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role} ${msg.isAgent ? 'agent-message' : ''}`}>
            <div className="message-role">
              {msg.role === 'user' ? '👤' : msg.role === 'system' ? '⚙️' : msg.isAgent ? '🤖' : '🤖'}
            </div>
            <div className="message-content">
              <pre>{msg.content}</pre>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-role">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={agentMode ? "Ask me anything or command: 'insert text \"Hello\"', 'make bold', 'replace'..." : "Type your message..."}
          className="chat-input"
          rows={3}
          disabled={isLoading}
        />
        <button 
          onClick={sendMessage} 
          disabled={!input.trim() || isLoading}
          className="send-btn"
        >
          {isLoading ? '⏳' : '📤'} Send
        </button>
      </div>
    </div>
  );
}
