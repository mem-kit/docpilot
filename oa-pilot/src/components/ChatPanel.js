import React, { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';
import config from '../config';
import './ChatPanel.css';
import { tools, executeToolCall, getToolsDescription } from '../extensions/EngineDocument';

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
      setAgentMode(true);
      
      const toolsDesc = getToolsDescription();
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: `✅ Agent mode enabled with Function Calling support!\n\n📋 Available tools:\n${toolsDesc.map((t, i) => `${i + 1}. ${t.name}: ${t.description}`).join('\n')}\n\n💡 Example commands:\n- "帮我在文档中插入一个段落"\n- "添加一些格式化文本"\n- "更新Excel表格"\n- "修改PPT幻灯片"`
      }]);
      
      if (onLoadMCP) {
        onLoadMCP({ tools: toolsDesc });
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      alert('Failed to load configuration: ' + error.message);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      // Build messages for API call (filter out system messages with tool descriptions)
      const apiMessages = newMessages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      // Prepare API call configuration
      const apiConfig = {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: agentMode 
              ? '你是一个智能文档助手，可以帮助用户操作Word、Excel和PowerPoint文档。当用户要求编辑文档时，请调用相应的工具函数。用中文回复。'
              : '你是一个有帮助的AI助手。用中文回复。'
          },
          ...apiMessages
        ],
        temperature: 0.7,
        max_tokens: 2000
      };

      // Add tools if agent mode is enabled
      if (agentMode && isEditorReady) {
        apiConfig.tools = tools;
        apiConfig.tool_choice = 'auto';
      }

      // Call LLM API
      let completion = await openai.chat.completions.create(apiConfig);
      let responseMessage = completion.choices[0].message;

      // Handle tool calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Add assistant's message with tool calls to conversation
        const toolCallMessages = [...apiMessages, responseMessage];
        
        // Execute all tool calls
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
          
          console.log(`🔧 LLM requested tool: ${functionName}`, functionArgs);
          
          // Execute the tool
          const result = await executeToolCall(functionName, functionArgs, docEditor);
          
          // Add tool result to messages
          toolCallMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(result)
          });
          
          // Show tool execution in UI
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `🔧 正在执行: ${functionName}\n结果: ${result.success ? '✅ 成功' : '❌ 失败: ' + result.error}`,
            isAgent: true
          }]);
        }
        
        // Get final response from LLM after tool execution
        const secondCompletion = await openai.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个智能文档助手。根据工具执行结果，向用户简洁地报告操作完成情况。用中文回复。'
            },
            ...toolCallMessages
          ],
          temperature: 0.7,
          max_tokens: 1000
        });
        
        const finalMessage = secondCompletion.choices[0].message.content;
        setMessages(prev => [...prev, { role: 'assistant', content: finalMessage }]);
        
      } else {
        // No tool calls, just regular response
        const assistantMessage = responseMessage.content;
        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      }
      
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
          placeholder={agentMode ? "例如：'帮我在文档中插入一个段落' 或 '更新Excel表格'..." : "输入您的消息..."}
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
