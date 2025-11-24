# User Requirement

I want to build an application with onlyoffice and LLM.


## GUI

- left panel
    
    list the file list in this panel
    
    file list API: http://192.168.50.156/example/files

    you can get the baseURL  from the file: config.js

    User can hide it to extend the work area.

- centerl panel: EditPanel

    if user click 1 document in the left side, open it in this panel.

    this panel is consider as work area in this web-applicatioin

    可以将中间的EditorPanel改造成多tab页面吗?
这样就支持打开多个文档了, 同时也可以关闭单个文档, 就跟浏览器一样, 可以打开多个网页tab

- right panel

    here can open a chat which connects to the LLM api

    API llmURL: https://api.deepseek.com/v1 

    API llmAPIKey: MY_ACCESS_TOKEN

    Please get above config from the file: config.js

    This chat is able to load the mcp.json in the file list

    then it has the MCP capability and agent mode to update the document via onlyoffice automation API.

