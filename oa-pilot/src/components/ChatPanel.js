import React, { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';
import config from '../config';
import './ChatPanel.css';
import { tools as documentTools, executeToolCall, getToolsDescription } from '../extensions/EngineDocument';
import EngineMCP from '../extensions/EngineMCP';

export default function ChatPanel({ docEditor, isEditorReady, files, onLoadMCP, selectedWorkspace }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('ask'); // 'ask' or 'agent'
  const [mcpTools, setMcpTools] = useState([]);
  const [mcpServers, setMcpServers] = useState({});
  const [mcpClients, setMcpClients] = useState({}); // 保存 MCP 客户端实例
  const [isLoadingMCP, setIsLoadingMCP] = useState(false);
  const [mcpConfig, setMcpConfig] = useState(null);
  const [mcpLogs, setMcpLogs] = useState([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const messagesEndRef = useRef(null);

  const addMcpLog = (type, message, data = null) => {
    const log = {
      timestamp: new Date().toISOString(),
      type, // 'info', 'success', 'error', 'debug'
      message,
      data
    };
    console.log(`[MCP ${type.toUpperCase()}]`, message, data || '');
    setMcpLogs(prev => [...prev.slice(-49), log]); // Keep last 50 logs
  };

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

  // Load MCP tools when workspace changes
  useEffect(() => {
    if (mode === 'agent') {
      loadMCPTools();
    }
  }, [selectedWorkspace, mode]);

  const loadMCPTools = async () => {
    setIsLoadingMCP(true);
    addMcpLog('info', `开始加载 MCP 工具 - 工作空间: ${selectedWorkspace || 'root'}`);
    
    try {
      const result = await EngineMCP.loadWorkspaceMCPTools(selectedWorkspace, addMcpLog);
      setMcpTools(result.tools);
      setMcpServers(result.servers);
      setMcpClients(result.clients); // 保存客户端实例
      setMcpConfig(result.config);
      
      if (result.tools.length > 0) {
        addMcpLog('success', `成功加载 ${result.tools.length} 个 MCP 工具`, {
          tools: result.tools.map(t => t.function.name),
          servers: Object.keys(result.servers)
        });
        console.log(`✅ Loaded ${result.tools.length} MCP tools from workspace: ${selectedWorkspace || 'root'}`);
      } else {
        addMcpLog('info', 'MCP 配置文件不存在或没有配置工具');
      }
    } catch (error) {
      console.error('Failed to load MCP tools:', error);
      addMcpLog('error', 'MCP 工具加载失败', { error: error.message });
      setMcpTools([]);
      setMcpServers({});
      setMcpClients({});
      setMcpConfig(null);
    } finally {
      setIsLoadingMCP(false);
    }
  };

  const showMCPConfig = () => {
    const configInfo = {
      workspace: selectedWorkspace || 'root',
      hasConfig: !!mcpConfig,
      config: mcpConfig,
      servers: mcpServers,
      toolsCount: mcpTools.length,
      tools: mcpTools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        server: t._mcpServerName,
        parameters: Object.keys(t.function.parameters?.properties || {})
      }))
    };
    
    addMcpLog('debug', '查看 MCP 配置', configInfo);
    alert(`MCP 配置信息：\n\n${JSON.stringify(configInfo, null, 2)}`);
  };

  const showMCPLogs = () => {
    setShowDebugPanel(true);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    
    if (newMode === 'agent') {
      const toolsDesc = getToolsDescription();
      const mcpToolsDesc = mcpTools.map(t => ({
        name: t.function.name,
        description: t.function.description
      }));
      
      const allToolsDesc = [...toolsDesc, ...mcpToolsDesc];
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: `🤖 Switched to Agent Mode\n\n📋 Available tools:\n${allToolsDesc.map((t, i) => `${i + 1}. ${t.name}: ${t.description}`).join('\n')}\n\n💡 Example commands:\n- "Add a paragraph to the document"\n- "Insert formatted text"\n- "Update Excel spreadsheet"\n- "Modify PPT slide"${mcpTools.length > 0 ? `\n\n🔌 MCP Tools (${mcpTools.length}):\n${mcpToolsDesc.map((t, i) => `- ${t.name}: ${t.description}`).join('\n')}` : ''}`
      }]);
      
      if (onLoadMCP) {
        onLoadMCP({ tools: allToolsDesc });
      }
      
      // Load MCP tools
      loadMCPTools();
    } else {
      setMessages(prev => [...prev, {
        role: 'system',
        content: '💬 Switched to Ask Mode\n\nI will answer your questions but won\'t execute document operations.'
      }]);
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
            content: mode === 'agent' 
              ? `你是一个智能文档助手，可以帮助用户操作Word、Excel和PowerPoint文档。

可用工具：
1. updateParagraph - 在Word文档中插入新段落（参数：text）
2. insertFormattedText - 在Word文档中插入格式化文本（参数：text, bold, italic, underline）
3. replaceCurrentWord - 替换Word文档中选中的文本（参数：text）
4. updateSpreadsheet - 更新Excel单元格内容（参数：cell, value, bold）
5. updatePresentation - 更新PowerPoint幻灯片内容（参数：slideIndex, text）

${mcpTools.length > 0 ? `\nMCP工具（额外功能）：\n${mcpTools.map((t, i) => `${i + 6}. ${t.function.name} - ${t.function.description}`).join('\n')}\n` : ''}
使用指南：
- 当用户要求编辑文档时，主动调用相应的工具
- 根据用户的具体需求选择合适的工具和参数
- 如果用户没有明确指定参数，使用合理的默认值
- MCP工具提供了额外的业务流程功能，根据需求选择合适的工具
- 用中文回复，保持专业和友好的语气`
              : '你是一个有帮助的AI助手。用中文回复。'
          },
          ...apiMessages
        ],
        temperature: 0.7,
        max_tokens: 2000
      };

      // Add tools if agent mode is enabled
      if (mode === 'agent' && isEditorReady) {
        // Combine document tools and MCP tools
        const allTools = [...documentTools, ...mcpTools];
        apiConfig.tools = allTools;
        apiConfig.tool_choice = 'auto';
      }

      // Call LLM API
      let completion = await openai.chat.completions.create(apiConfig);
      let responseMessage = completion.choices[0].message;

      // Handle tool calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Add assistant's message with tool calls to conversation
        const toolCallMessages = [...apiMessages, responseMessage];
        
        // Execute all tool calls sequentially
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
          
          console.log(`🔧 LLM requested tool: ${functionName}`, functionArgs);
          
          // Show tool execution start in UI
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `🔧 正在执行: ${functionName}\n参数: ${JSON.stringify(functionArgs, null, 2)}`,
            isAgent: true
          }]);
          
          try {
            let result;
            
            // Check if this is an MCP tool
            const mcpTool = mcpTools.find(t => t.function.name === functionName);
            
            if (mcpTool && mcpTool._mcpClientKey) {
              // Execute MCP tool using the correct client instance
              console.log('🔌 Executing MCP tool:', functionName);
              const client = mcpClients[mcpTool._mcpClientKey];
              
              if (!client) {
                throw new Error(`MCP client not found for server: ${mcpTool._mcpServerName}`);
              }
              
              addMcpLog('info', `执行 MCP 工具: ${functionName}`, {
                server: mcpTool._mcpServerName,
                args: functionArgs
              });
              result = await EngineMCP.callTool(client, functionName, functionArgs, addMcpLog);
              addMcpLog('success', `MCP 工具执行完成: ${functionName}`, result);
            } else {
              // Execute document tool
              console.log('📝 About to execute tool with editor:', docEditor);
              console.log('📝 Editor ready status:', isEditorReady);
              result = await executeToolCall(functionName, functionArgs, docEditor);
              console.log('📝 Tool execution result:', result);
            }
            
            // Add tool result to messages
            toolCallMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: functionName,
              content: JSON.stringify(result)
            });
            
            // Show tool execution result in UI
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: result.success 
                ? `✅ 执行成功\n${result.message || '操作已完成'}` 
                : `❌ 执行失败\n错误: ${result.error || '未知错误'}`,
              isAgent: true
            }]);
          } catch (error) {
            console.error(`Error executing ${functionName}:`, error);
            addMcpLog('error', `工具执行失败: ${functionName}`, {
              error: error.message,
              stack: error.stack
            });
            
            // Add error to tool messages
            toolCallMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: functionName,
              content: JSON.stringify({ success: false, error: error.message })
            });
            
            // Show error in UI
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `❌ 执行失败: ${functionName}\n错误: ${error.message}`,
              isAgent: true
            }]);
          }
        }
        
        // Get final response from LLM after tool execution
        try {
          const secondCompletion = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: '你是一个智能文档助手。根据工具执行结果，向用户简洁清晰地报告操作完成情况。如果有错误，给出建议。用中文回复。'
              },
              ...toolCallMessages
            ],
            temperature: 0.7,
            max_tokens: 1000
          });
          
          const finalMessage = secondCompletion.choices[0].message.content;
          setMessages(prev => [...prev, { role: 'assistant', content: finalMessage }]);
        } catch (error) {
          console.error('Error getting final response:', error);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: '工具已执行完成，但生成总结时出错。'
          }]);
        }
        
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
      </div>

      {mode === 'agent' && (
        <div className="agent-status">
          <div>
            <span className="status-badge">🤖 Agent Mode</span>
            {!isEditorReady && (
              <span className="warning-badge">⚠️ Editor not ready</span>
            )}
            {mcpTools.length > 0 && (
              <span className="mcp-badge">🔌 MCP: {mcpTools.length} tools</span>
            )}
          </div>
          <div className="mcp-debug-buttons">
            <button 
              onClick={showMCPConfig} 
              disabled={!mcpConfig && mcpTools.length === 0}
              className="debug-mcp-btn"
              title="查看 MCP 配置"
            >
              📋 配置
            </button>
            <button 
              onClick={showMCPLogs} 
              className="debug-mcp-btn"
              title="查看 MCP 日志"
            >
              📝 日志 {mcpLogs.length > 0 && `(${mcpLogs.length})`}
            </button>
            <button 
              onClick={loadMCPTools} 
              disabled={isLoadingMCP}
              className="refresh-mcp-btn"
              title="刷新 MCP 工具"
            >
              {isLoadingMCP ? '⏳' : '🔄'} 刷新
            </button>
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <h4>👋 Welcome!</h4>
            {mode === 'ask' ? (
              <>
                <p>💬 <strong>Ask Mode</strong></p>
                <p>I can answer your questions and provide information.</p>
                <p className="hint">💡 Switch to Agent mode to automate document operations</p>
              </>
            ) : (
              <>
                <p>🤖 <strong>Agent Mode</strong></p>
                <p>I can automatically operate Word, Excel and PowerPoint documents.</p>
                <p className="hint">💡 Try: "Add a paragraph to the document"</p>
              </>
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

      {showDebugPanel && (
        <div className="debug-panel">
          <div className="debug-panel-header">
            <h4>🔍 MCP 调试日志</h4>
            <div>
              <button onClick={() => setMcpLogs([])} className="clear-logs-btn">清空</button>
              <button onClick={() => setShowDebugPanel(false)} className="close-debug-btn">✕</button>
            </div>
          </div>
          <div className="debug-panel-content">
            {mcpLogs.length === 0 ? (
              <div className="no-logs">暂无日志</div>
            ) : (
              mcpLogs.map((log, idx) => (
                <div key={idx} className={`log-entry log-${log.type}`}>
                  <div className="log-header">
                    <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={`log-type log-type-${log.type}`}>{log.type.toUpperCase()}</span>
                  </div>
                  <div className="log-message">{log.message}</div>
                  {log.data && (
                    <pre className="log-data">{JSON.stringify(log.data, null, 2)}</pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="chat-input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={mode === 'agent' ? "e.g., 'Add a paragraph' or 'Update Excel'..." : "Ask me anything..."}
          className="chat-input"
          rows={3}
          disabled={isLoading}
        />
        <div className="input-actions">
          <select 
            className="mode-selector-bottom"
            value={mode}
            onChange={(e) => handleModeChange(e.target.value)}
            title="Select mode"
          >
            <option value="ask">💬 Ask</option>
            <option value="agent">🤖 Agent</option>
          </select>
          <button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            className="send-btn"
          >
            {isLoading ? '⏳' : '📤'} Send
          </button>
        </div>
      </div>
    </div>
  );
}
