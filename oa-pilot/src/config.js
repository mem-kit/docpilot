// config.js
const config = {
  // OnlyOffice Document Server URL (用于编辑器)
  // Example: http://49.235.156.4:7171/example/
  officeEngineURL: "http://49.235.156.4:7171/",
  
  // 文档存储 URL - 自建 Storage Engine，支持 CORS
  // Swagger 地址: http://111.229.40.154/docs/
  storageEngineURL: "http://111.229.40.154/",
  
  // LLM API 配置
  llmURL: "https://api.deepseek.com/v1",
  llmAPIKey: "sk-ee6e7d4d0c6c441fa82d92061694ecf2",
  
  mcpConfig: "mcp.json",
  
  // MCP 代理配置
  // 在开发环境中，使用代理路径避免 CORS 问题
  // /api/mcp 会被代理到 http://localhost:8000/mcp
  mcpProxyPath: "/api/mcp",
}

export default config;