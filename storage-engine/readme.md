## Readme

我希望使用Python创建一个项目: Storage-Engine

#file:requirements.txt 这个文件已经准备好了

已经创建了虚拟环境: .venv


这个服务器提供文件存储服务, 允许跨域访问.

请使用fastapi框架, 提供swagger-web-gui

这个服务是提供给onlyoffice的, 包含下列接口:

下面的IP是样例, 可以被替换.

- 列出文件: http://49.235.156.4/example/files

返回数据:
···JSON
[{"version":2,"id":"36.21.29.167new.docx11764055788794","contentLength":"25.03 KB","pureContentLength":25630,"title":"new.docx","updated":"2025-11-25T07:29:48.794Z"},{"version":2,"id":"36.21.29.167new.xlsx11764055781543","contentLength":"8.37 KB","pureContentLength":8574,"title":"new.xlsx","updated":"2025-11-25T07:29:41.543Z"}]
···

- 删除文件: http://49.235.156.4/example/file?filename={param_file_name.xlsx}

      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'text/xml',
          'X-Requested-With': 'XMLHttpRequest'
        }

- 上传文件: http://49.235.156.4/example/upload

method: POST /example/upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryf8c2sFYPaGSsyXKE
X-Requested-With: XMLHttpRequest

- 下载文件: http://49.235.156.4/example/download?fileName={new.docx}