# OnlyOffice Document Editor - 使用指南

## 项目结构

```
docpilot-react-app/
├── server.js              # Express 后端服务器
├── documents/             # 文档存储目录
│   └── new.docx          # 示例文档(需要您放置)
├── src/
│   ├── App.js            # React 前端应用
│   └── App.css           # 样式文件
└── package.json
```

## 启动步骤

### 1. 准备文档
将您的 `.docx` 文件放到 `documents/` 目录下,例如 `new.docx`

### 2. 启动服务器

**方式 1: 同时启动前后端 (推荐)**
```bash
npm run dev

```

**方式 2: 分别启动**
```bash
# 终端 1 - 启动后端服务器 (端口 80)
npm run server

# 终端 2 - 启动前端 (端口 3000)
npm start
```

**注意:** 由于后端使用端口 80,需要 sudo 权限

### 3. 访问应用
- 前端: http://localhost:3000
- 后端 API: http://172.20.10.2/

## API 端点

### GET /example/download
下载文档
- 参数: `fileName` (例如: `new.docx`)
- 示例: `http://172.20.10.2/example/download?fileName=new.docx`

### POST /example/callback
OnlyOffice Document Server 回调端点
- 用于保存编辑后的文档
- 自动处理,无需手动调用

### GET /example/files
获取所有可用文档列表
- 返回 `documents/` 目录中的所有 `.docx` 文件

### GET /health
健康检查
- 返回服务器状态

## 配置说明

### 前端配置 (src/App.js)

```javascript
config={{
  document: {
    fileType: "docx",
    key: "Khirz6zTPdfd7",  // 每个文档版本需要唯一的 key
    title: "Example Document Title.docx",
    url: "http://172.20.10.2/example/download?fileName=new.docx",
  },
  documentType: "word",
  editorConfig: {
    mode: "edit",  // "edit" 或 "view"
    callbackUrl: "http://172.20.10.2/example/callback",
  },
}}
```

### 重要提示

1. **文档 Key**: 每次编辑新版本时应更改 `key` 值,否则可能会缓存旧版本
2. **IP 地址**: 使用 `192.168.50.156` 而不是 `localhost`,因为 OnlyOffice Document Server 在 Docker 容器中运行
3. **端口 80**: 需要 sudo 权限才能使用端口 80,或者修改 `server.js` 中的端口号

## 工作流程

1. 用户在浏览器打开前端应用
2. OnlyOffice Document Server 从后端下载原始文档 (`/example/download`)
3. 用户编辑文档
4. 保存时,OnlyOffice Document Server 调用 callback (`/example/callback`)
5. 后端从 OnlyOffice 下载编辑后的文档并保存到 `documents/` 目录

## 故障排除

### 问题: "Download failed" 错误
- 确保文档存在于 `documents/` 目录
- 检查文件名是否匹配
- 确认后端服务器正在运行

### 问题: "Document could not be saved"
- 确保 callback URL 正确
- 检查后端日志查看 callback 是否被调用
- 确认 `documents/` 目录有写入权限

### 问题: 布局显示异常
- 清除浏览器缓存
- 检查 `App.css` 中的全局样式

## 日志查看

后端服务器会输出详细日志:
- 文件下载请求
- Callback 接收到的数据
- 文档保存状态

查看终端输出以调试问题。
