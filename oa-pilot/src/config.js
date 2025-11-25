// config.js
const config = {
  // OnlyOffice Document Server URL (用于编辑器)
  // Example: http://49.235.156.4/example/
  officeEngineURL: "http://49.235.156.4/",
  
  // 文档存储 URL - 自建 Storage Engine，支持 CORS
  // Swagger 地址: http://111.229.40.154/docs/
  storageEngineURL: "http://111.229.40.154/",
  
  // LLM API 配置
  llmURL: "https://api.deepseek.com/v1",
  llmAPIKey: "sk-ee6e7d4d0c6c441fa82d92061694ecf2",
  
  mcpConfig: "mcp.json",
}

export default config;