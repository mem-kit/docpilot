# ONLYOFFICE API 版本问题说明

## 🔴 当前问题

你的 ONLYOFFICE Document Server 版本**不支持** `createConnector` API。

根据控制台输出，当前可用的方法有：
```javascript
[
  'createEmbedWorker', 'showMessage', 'processRightsChange', 
  'denyEditingRights', 'refreshHistory', 'setHistoryData', 
  'setEmailAddresses', 'setActionLink', 'processMailMerge', 
  'downloadAs', 'serviceCommand', 'attachMouseEvents', 
  'detachMouseEvents', 'destroyEditor', 'setUsers', 
  'showSharingSettings', 'setSharingSettings', 'insertImage', 
  'setMailMergeRecipients', 'setRevisedFile', 'setFavorite', 
  'requestClose', 'grabFocus', 'blurFocus', 'setReferenceData', 
  'refreshFile', 'setRequestedDocument', 'setRequestedSpreadsheet', 
  'setReferenceSource', 'openDocument', 'startFilling', 'requestRoles'
]
```

**缺少的关键方法：**
- ❌ `createConnector` - 用于执行文档构建器命令
- ❌ `executeMethod` - 用于执行插件方法

## 💡 解决方案

### 方案 1: 升级 ONLYOFFICE Document Server（推荐）

升级到支持 Document Builder API 的版本：

```bash
# 使用 Docker 升级到最新版本
docker pull onlyoffice/documentserver:latest
docker stop documentserver
docker rm documentserver
docker run -i -t -d -p 80:80 --name documentserver onlyoffice/documentserver:latest
```

**所需版本：**
- ONLYOFFICE Document Server >= 7.0（支持 createConnector）
- 推荐版本 >= 8.0（完整的 Document Builder API 支持）

### 方案 2: 使用插件机制

创建一个 ONLYOFFICE 插件来实现文档操作：

#### 步骤：

1. **创建插件配置文件** `plugin/config.json`：
```json
{
  "name": "DocPilot Plugin",
  "guid": "asc.{YOUR-GUID-HERE}",
  "version": "1.0.0",
  "variations": [
    {
      "description": "Document manipulation plugin",
      "url": "index.html",
      "icons": ["icon.png"],
      "isViewer": false,
      "EditorsSupport": ["word"],
      "isVisual": true,
      "isModal": false,
      "isInsideMode": false,
      "initDataType": "none",
      "initOnSelectionChanged": true
    }
  ]
}
```

2. **创建插件主文件** `plugin/index.html`：
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://onlyoffice.github.io/sdkjs-plugins/v1/plugins.js"></script>
    <script src="https://onlyoffice.github.io/sdkjs-plugins/v1/plugins-ui.js"></script>
</head>
<body>
    <script>
        window.Asc.plugin.init = function() {
            window.Asc.plugin.executeMethod("GetCurrentWord", [], function(word) {
                console.log("Current word:", word);
            });
        };
        
        window.Asc.plugin.button = function(id) {
            this.executeCommand("close", "");
        };
    </script>
</body>
</html>
```

3. **安装插件到 Document Server**：
```bash
# 复制插件到服务器
cp -r plugin /var/www/onlyoffice/documentserver/sdkjs-plugins/docpilot

# 重启服务
systemctl restart ds-converter
```

### 方案 3: 使用当前可用的 API（临时方案）

代码已经更新为使用 `showMessage` 方法来演示功能。虽然不能实际操作文档，但至少应用可以运行。

#### 当前可用的功能：

1. **showMessage** - 显示消息
   ```javascript
   docEditor.showMessage('Title', 'Message', 'info');
   ```

2. **insertImage** - 插入图片
   ```javascript
   docEditor.insertImage({
     c: "add",
     images: [{
       url: "https://example.com/image.png",
       token: "optional-token"
     }]
   });
   ```

3. **downloadAs** - 下载文档
   ```javascript
   docEditor.downloadAs();
   ```

## 🎯 推荐行动

### 立即可做：
1. ✅ 刷新页面 - 状态指示器现在应该变绿
2. ✅ 点击按钮 - 会显示消息说明功能限制

### 长期解决：
1. 🔄 检查 ONLYOFFICE Document Server 版本
2. 📦 升级到最新版本
3. 🔌 或开发自定义插件

## 🔍 检查当前版本

在浏览器控制台运行：
```javascript
// 检查编辑器版本
console.log(window.DocsAPI);

// 或查看服务器版本
fetch('http://172.20.10.2/hosting/discovery')
  .then(r => r.text())
  .then(console.log);
```

## 📚 相关文档

- [ONLYOFFICE Document Builder API](https://api.onlyoffice.com/docbuilder/basic)
- [创建插件教程](https://api.onlyoffice.com/plugin/basic)
- [版本更新日志](https://github.com/ONLYOFFICE/DocumentServer/releases)

## ⚠️ 注意事项

当前实现的按钮会显示信息提示，说明需要升级或使用插件。这不是代码错误，而是 ONLYOFFICE 服务器配置限制。

要实现完整的文档操作功能，必须：
- 使用支持 `createConnector` API 的 ONLYOFFICE 版本
- 或开发专门的插件
