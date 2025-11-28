/**
 * EngineMCP.js - MCP (Model Context Protocol) 工具管理
 * 实现 MCP Streamable HTTP 客户端（JSON-RPC 2.0 + SSE）
 */

import config from '../config';

class EngineMCP {
  /**
   * MCP 客户端类 - 管理单个 MCP 服务器连接
   */
  static MCPClient = class {
    constructor(baseUrl, logCallback = null) {
      // 直接使用完整 URL，服务器已支持 CORS
      this.baseUrl = baseUrl;
      this.sessionId = null;
      this.requestId = 0;
      this.logCallback = logCallback;
      this.isInitialized = false;
      
      if (logCallback) {
        logCallback('info', `连接到 MCP 服务器: ${this.baseUrl}`);
      }
    }

    log(type, message, data = null) {
      if (this.logCallback) {
        this.logCallback(type, message, data);
      }
    }

    // 1. 获取 Session ID
    async getSessionId() {
      try {
        this.log('info', `获取 Session ID: ${this.baseUrl}`);
        
        const response = await fetch(this.baseUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/event-stream'
          }
        });

        // 调试：打印所有可访问的响应头
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        this.log('debug', '浏览器可访问的响应头', headers);

        // 尝试从响应头获取 session ID
        // 注意：服务器必须在 Access-Control-Expose-Headers 中暴露 mcp-session-id
        this.sessionId = response.headers.get('mcp-session-id');
        
        if (!this.sessionId) {
          // 如果浏览器无法读取 mcp-session-id 响应头
          this.log('error', '❌ 无法读取 mcp-session-id 响应头');
          this.log('error', '可能原因：服务器未在 Access-Control-Expose-Headers 中暴露该头');
          this.log('error', '服务器需要添加: Access-Control-Expose-Headers: mcp-session-id');
          
          // 如果没有 session ID，抛出错误
          let errorDetail = '';
          if (!response.ok) {
            try {
              const errorText = await response.text();
              errorDetail = errorText ? `: ${errorText}` : '';
            } catch (e) {
              // 忽略读取错误体的失败
            }
          }
          throw new Error(`无法获取 session ID。服务器需要在 CORS 配置中暴露 'mcp-session-id' 响应头。响应: ${response.status} ${response.statusText}${errorDetail}`);
        }

        this.log('success', `✅ 获得 Session ID: ${this.sessionId}`);
        
        // MCP 服务器在首次 GET 请求时会返回 400 + session ID，这是正常行为
        if (!response.ok) {
          this.log('info', `服务器返回 ${response.status}，但已成功获取 session ID`);
        }
        
        return this.sessionId;
      } catch (error) {
        this.log('error', `获取 Session ID 失败: ${error.message}`);
        throw error;
      }
    }

    // 2. 解析 SSE 响应
    parseSSEResponse(text) {
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          try {
            return JSON.parse(data);
          } catch (e) {
            this.log('error', 'Failed to parse SSE data', { line, error: e.message });
          }
        }
      }
      return null;
    }

    // 3. 发送 JSON-RPC 请求
    async sendRequest(method, params = null, isNotification = false) {
      try {
        const payload = {
          jsonrpc: '2.0',
          method: method
        };

        if (!isNotification) {
          payload.id = ++this.requestId;
        }

        if (params !== null && params !== undefined) {
          payload.params = params;
        }

        this.log('debug', `发送请求: ${method}`, payload);

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'mcp-session-id': this.sessionId
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const text = await response.text();
        const result = this.parseSSEResponse(text);

        if (result && result.error) {
          throw new Error(`JSON-RPC Error: ${result.error.message} (code: ${result.error.code})`);
        }

        this.log('debug', `收到响应: ${method}`, result);
        return result;
      } catch (error) {
        this.log('error', `请求失败: ${method}`, { error: error.message });
        throw error;
      }
    }

    // 4. 初始化连接
    async initialize() {
      try {
        if (this.isInitialized) {
          return true;
        }

        // Step 1: Get session ID
        await this.getSessionId();

        // Step 2: Send initialize request
        this.log('info', '发送初始化请求');
        const initResult = await this.sendRequest('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'docpilot-client',
            version: '1.0.0'
          }
        });

        this.log('success', '初始化成功', initResult.result);

        // Step 3: Send initialized notification
        this.log('info', '发送初始化完成通知');
        await this.sendRequest('notifications/initialized', {}, true);

        this.isInitialized = true;
        this.log('success', 'MCP 连接已建立');
        return true;
      } catch (error) {
        this.log('error', '初始化失败', { error: error.message });
        throw error;
      }
    }

    // 5. 获取工具列表
    async listTools() {
      try {
        if (!this.isInitialized) {
          await this.initialize();
        }

        this.log('info', '获取工具列表');
        const result = await this.sendRequest('tools/list', {});
        
        const tools = result.result.tools || [];
        this.log('success', `获取到 ${tools.length} 个工具`, { tools: tools.map(t => t.name) });
        
        return tools;
      } catch (error) {
        this.log('error', '获取工具列表失败', { error: error.message });
        throw error;
      }
    }

    // 6. 调用工具
    async callTool(toolName, args = {}) {
      try {
        if (!this.isInitialized) {
          await this.initialize();
        }

        this.log('info', `调用工具: ${toolName}`, args);
        const result = await this.sendRequest('tools/call', {
          name: toolName,
          arguments: args
        });

        this.log('success', `工具执行成功: ${toolName}`, result.result);
        return result.result;
      } catch (error) {
        this.log('error', `工具调用失败: ${toolName}`, { error: error.message });
        throw error;
      }
    }
  };
  /**
   * 从指定工作空间获取MCP配置文件(.mcp.txt)
   * @param {string} workspace - 工作空间名称
   * @param {Function} logCallback - 日志回调函数
   * @returns {Promise<Object>} MCP配置对象
   */
  static async loadMCPConfig(workspace = '', logCallback = null) {
    try {
      const url = new URL(`${config.storageEngineURL}example/download`);
      url.searchParams.append('fileName', '.mcp.txt');
      if (workspace) {
        url.searchParams.append('folder', workspace);
      }

      if (logCallback) {
        logCallback('info', `请求 MCP 配置文件: ${url.toString()}`);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load MCP config: ${response.status} ${response.statusText}`);
      }

      let configText = await response.text();
      if (logCallback) {
        logCallback('debug', '收到 MCP 配置文件', { length: configText.length, preview: configText.substring(0, 200) });
      }

      // 移除 JSON 中的注释（支持 // 和 /* */ 两种注释）
      // 注意：只移除在字符串外部的注释，不能破坏 URL 中的 //
      let cleanedText = configText;
      
      try {
        // 先移除多行注释 /* ... */
        cleanedText = cleanedText.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // 移除单行注释，但要小心不要移除字符串中的 //
        // 使用更复杂的正则来识别真正的注释（在行首或空白后）
        cleanedText = cleanedText.split('\n').map(line => {
          // 查找字符串外的 // 注释
          // 简单策略：如果 // 前面没有 : 或 "，则认为是注释
          const commentMatch = line.match(/^([^"]*?)\/\/(.*)$/);
          if (commentMatch) {
            const beforeComment = commentMatch[1];
            // 检查是否在字符串值中（包含 "url": "http://）
            if (beforeComment.includes('"http://') || beforeComment.includes('"https://')) {
              return line; // 保留包含 URL 的行
            }
            // 否则移除注释部分
            return beforeComment;
          }
          return line;
        }).join('\n');
        
        if (logCallback && cleanedText !== configText) {
          logCallback('debug', '已移除配置文件中的注释', { 
            originalLength: configText.length, 
            cleanedLength: cleanedText.length,
            cleanedPreview: cleanedText.substring(0, 200)
          });
        }
      } catch (cleanError) {
        if (logCallback) {
          logCallback('debug', '注释清理失败，使用原始文本', { error: cleanError.message });
        }
        cleanedText = configText;
      }

      const mcpConfig = JSON.parse(cleanedText);
      
      console.log('📋 Loaded MCP config:', mcpConfig);
      if (logCallback) {
        logCallback('success', '成功解析 MCP 配置', { servers: Object.keys(mcpConfig.servers || {}) });
      }
      return mcpConfig;
    } catch (error) {
      console.error('Failed to load MCP config:', error);
      if (logCallback) {
        logCallback('error', `加载 MCP 配置失败: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 从MCP服务器获取可用工具列表（使用正确的 MCP 协议）
   * @param {string} mcpServerUrl - MCP服务器URL
   * @param {Function} logCallback - 日志回调函数
   * @returns {Promise<Array>} 工具列表（OpenAI Function Calling格式）
   */
  static async listTools(mcpServerUrl, logCallback = null) {
    try {
      const client = new this.MCPClient(mcpServerUrl, logCallback);
      const mcpTools = await client.listTools();
      
      // 转换为 OpenAI Function Calling 格式
      const tools = this.convertMCPToolsToOpenAIFormat(mcpTools);
      
      // 保存客户端实例供后续调用使用
      return { tools, client };
    } catch (error) {
      console.error('Failed to list MCP tools:', error);
      if (logCallback) {
        logCallback('error', `获取工具列表失败: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 将MCP工具格式转换为OpenAI Function Calling格式
   * @param {Array} mcpTools - MCP工具列表
   * @returns {Array} OpenAI格式的工具列表
   */
  static convertMCPToolsToOpenAIFormat(mcpTools) {
    return mcpTools.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description || `MCP tool: ${tool.name}`,
        parameters: tool.inputSchema || {
          type: "object",
          properties: {},
          required: []
        }
      }
    }));
  }

  /**
   * 调用MCP工具（使用正确的 MCP 协议）
   * @param {Object} client - MCP 客户端实例
   * @param {string} toolName - 工具名称
   * @param {Object} args - 工具参数
   * @param {Function} logCallback - 日志回调函数
   * @returns {Promise<Object>} 工具执行结果
   */
  static async callTool(client, toolName, args = {}, logCallback = null) {
    try {
      console.log(`🔧 Calling MCP tool: ${toolName}`, args);
      
      const result = await client.callTool(toolName, args);
      console.log('✅ MCP tool result:', result);

      return {
        success: true,
        data: result,
        message: `MCP tool ${toolName} executed successfully`
      };
    } catch (error) {
      console.error(`Failed to call MCP tool ${toolName}:`, error);
      if (logCallback) {
        logCallback('error', `工具执行失败: ${toolName}`, { error: error.message });
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 加载工作空间的所有MCP工具
   * @param {string} workspace - 工作空间名称
   * @param {Function} logCallback - 日志回调函数
   * @returns {Promise<Object>} 包含工具列表、客户端实例和服务器URL的对象
   */
  static async loadWorkspaceMCPTools(workspace = '', logCallback = null) {
    try {
      // 1. 加载MCP配置文件
      const mcpConfig = await this.loadMCPConfig(workspace, logCallback);
      
      if (!mcpConfig.servers || Object.keys(mcpConfig.servers).length === 0) {
        console.warn('No MCP servers configured');
        if (logCallback) {
          logCallback('info', '未配置 MCP 服务器');
        }
        return { tools: [], servers: {}, clients: {}, config: mcpConfig };
      }

      // 2. 从所有配置的服务器获取工具
      const allTools = [];
      const serverMap = {};
      const clientMap = {};

      for (const [serverName, serverConfig] of Object.entries(mcpConfig.servers)) {
        if (serverConfig.type === 'http' && serverConfig.url) {
          try {
            if (logCallback) {
              logCallback('info', `正在连接 MCP 服务器: ${serverName}`, { url: serverConfig.url });
            }
            
            // 使用正确的 MCP 协议获取工具
            const { tools, client } = await this.listTools(serverConfig.url, logCallback);
            
            // 为每个工具添加服务器信息和客户端引用
            tools.forEach(tool => {
              tool._mcpServerName = serverName;
              tool._mcpClientKey = serverName; // 用于查找对应的客户端
            });
            
            allTools.push(...tools);
            serverMap[serverName] = serverConfig.url;
            clientMap[serverName] = client; // 保存客户端实例
            
            console.log(`✅ Loaded ${tools.length} tools from server: ${serverName}`);
            if (logCallback) {
              logCallback('success', `从服务器 ${serverName} 加载了 ${tools.length} 个工具`);
            }
          } catch (error) {
            console.error(`Failed to load tools from server ${serverName}:`, error);
            if (logCallback) {
              logCallback('error', `从服务器 ${serverName} 加载工具失败`, { error: error.message });
            }
          }
        }
      }

      return {
        tools: allTools,
        servers: serverMap,
        clients: clientMap, // 返回客户端实例映射
        config: mcpConfig
      };
    } catch (error) {
      console.error('Failed to load workspace MCP tools:', error);
      if (logCallback) {
        logCallback('error', '加载工作空间 MCP 工具失败', { error: error.message });
      }
      return { tools: [], servers: {}, clients: {}, config: null };
    }
  }
}

export default EngineMCP;
