# User Requirement


## Chat Part

聊天面板, 目前还没有接入LLM, 希望使用OpenAI的SDK来接入DeepSeek的LLM系统, 因为DeepSeek是兼容OpenAI的API的.

读取配置文件"config.js",配置项目:

    - llmURL

    - llmAPIKey



## MCP Part

我们可以在浏览器中默认存放 ‘mcp.json’ 和 ‘api.json’ 的信息吗?
放在localstorage里面或者靠谱的浏览器本地数据库里面.

默认加载: 
 - StorageMCP.js
 - ExcelMCP.js
 - PowerPointMCP.js
 - WordMCP.js


 ```api
{
	"servers": {
		"workflow": {

		},
		"smtp": {

		},
	},
	"api": {
		"excel": {
			"command": "ExcelAPI.js",
			"type": "native"
		},
		"powerpoint": {
			"command": "PowerPointAPI.js",
			"type": "native"
		},
		"storage": {
			"command": "StorageAPI.js",
			"type": "native"
		},
		"word": {
			"command": "WordAPI.js",
			"type": "native"
		},
	},
}


 ```




