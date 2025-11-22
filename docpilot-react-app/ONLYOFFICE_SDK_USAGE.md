# ONLYOFFICE JS SDK 使用指南

## 概述

本文档说明如何在 React 应用中使用 ONLYOFFICE Document Editor 的 JavaScript SDK 来操作 Word 文档。

## 已实现功能

### 1. 更新段落功能

在 `App.js` 中已经实现了一个测试按钮 "📝 Update Paragraph"，用于演示如何使用 ONLYOFFICE SDK 更新文档中的段落。

#### 核心实现

```javascript
const docEditorRef = useRef(null);

const updateParagraph = () => {
  const docEditor = docEditorRef.current.docEditor;
  
  if (docEditor) {
    // 获取当前单词
    docEditor.executeMethod('GetCurrentWord', [], (word) => {
      console.log('Current word:', word);
    });
    
    // 在光标位置添加文本
    docEditor.executeMethod('AddText', ['[Updated Text] '], (result) => {
      console.log('Text added:', result);
    });
    
    // 粘贴文本
    docEditor.executeMethod('pluginMethod_PasteText', ['Inserted text!'], (result) => {
      console.log('Paste result:', result);
    });
  }
};
```

## ONLYOFFICE Document Editor API 方法

基于 [ONLYOFFICE sdkjs](https://github.com/ONLYOFFICE/sdkjs) 仓库的分析，以下是一些常用的 API 方法：

### 文本操作

1. **AddText** - 在当前光标位置添加文本
   ```javascript
   docEditor.executeMethod('AddText', ['Your text here']);
   ```

2. **pluginMethod_GetCurrentWord** - 获取当前单词
   ```javascript
   docEditor.executeMethod('GetCurrentWord', [], (word) => {
     console.log(word);
   });
   ```

3. **pluginMethod_ReplaceCurrentWord** - 替换当前单词
   ```javascript
   docEditor.executeMethod('pluginMethod_ReplaceCurrentWord', ['newWord']);
   ```

4. **pluginMethod_GetCurrentSentence** - 获取当前句子
   ```javascript
   docEditor.executeMethod('GetCurrentSentence', [], (sentence) => {
     console.log(sentence);
   });
   ```

5. **pluginMethod_ReplaceCurrentSentence** - 替换当前句子
   ```javascript
   docEditor.executeMethod('pluginMethod_ReplaceCurrentSentence', ['New sentence.']);
   ```

6. **pluginMethod_InputText** - 输入文本（模拟键盘输入）
   ```javascript
   docEditor.executeMethod('pluginMethod_InputText', ['text to input']);
   ```

7. **pluginMethod_PasteText** - 粘贴纯文本
   ```javascript
   docEditor.executeMethod('pluginMethod_PasteText', ['text to paste']);
   ```

8. **pluginMethod_PasteHtml** - 粘贴 HTML 格式文本
   ```javascript
   docEditor.executeMethod('pluginMethod_PasteHtml', ['<b>Bold text</b>']);
   ```

### 段落操作

1. **SetParagraphAlign** - 设置段落对齐方式
   ```javascript
   // align: 0=left, 1=center, 2=right, 3=justify
   docEditor.executeMethod('SetParagraphAlign', [1]); // 居中对齐
   ```

2. **SetParagraphSpacing** - 设置段落间距
   ```javascript
   docEditor.executeMethod('SetParagraphSpacing', [{
     Before: 10, // 段前间距
     After: 10,  // 段后间距
     Line: 1.5,  // 行距
     LineRule: 1 // 行距规则
   }]);
   ```

3. **SetParagraphStyle** - 设置段落样式
   ```javascript
   docEditor.executeMethod('SetParagraphStyle', ['Heading 1']);
   ```

4. **ClearParagraphFormatting** - 清除段落格式
   ```javascript
   docEditor.executeMethod('ClearParagraphFormatting', [true, true]);
   ```

### 文本格式操作

1. **AddToParagraph (TextPr)** - 设置文本属性
   ```javascript
   // 设置粗体
   docEditor.executeMethod('AddToParagraph', [{
     Type: 'para_TextPr',
     Value: { Bold: true }
   }]);
   
   // 设置斜体
   docEditor.executeMethod('AddToParagraph', [{
     Type: 'para_TextPr',
     Value: { Italic: true }
   }]);
   
   // 设置下划线
   docEditor.executeMethod('AddToParagraph', [{
     Type: 'para_TextPr',
     Value: { Underline: true }
   }]);
   
   // 设置字体和大小
   docEditor.executeMethod('AddToParagraph', [{
     Type: 'para_TextPr',
     Value: { 
       FontFamily: { Name: 'Arial' },
       FontSize: 14
     }
   }]);
   ```

### 选择和导航

1. **GetSelectedText** - 获取选中的文本
   ```javascript
   docEditor.executeMethod('GetSelectedText', [true], (text) => {
     console.log('Selected text:', text);
   });
   ```

2. **SelectAll** - 全选文档
   ```javascript
   docEditor.executeMethod('SelectAll', []);
   ```

3. **MoveCursorToStart** - 移动光标到开始
   ```javascript
   docEditor.executeMethod('MoveCursorToStart', []);
   ```

4. **MoveCursorToEnd** - 移动光标到结束
   ```javascript
   docEditor.executeMethod('MoveCursorToEnd', []);
   ```

### 文档操作

1. **CreateParagraph** - 创建新段落
   ```javascript
   docEditor.executeMethod('CreateParagraph', [], (para) => {
     console.log('New paragraph created:', para);
   });
   ```

2. **RemoveSelection** - 删除选中内容
   ```javascript
   docEditor.executeMethod('RemoveSelection', []);
   ```

3. **Undo** - 撤销
   ```javascript
   docEditor.executeMethod('Undo', []);
   ```

4. **Redo** - 重做
   ```javascript
   docEditor.executeMethod('Redo', []);
   ```

## 使用示例

### 示例 1: 替换选中文本

```javascript
const replaceSelectedText = () => {
  const docEditor = docEditorRef.current.docEditor;
  
  docEditor.executeMethod('GetSelectedText', [true], (selectedText) => {
    if (selectedText) {
      console.log('Replacing:', selectedText);
      docEditor.executeMethod('pluginMethod_InputText', ['New text'], () => {
        console.log('Text replaced!');
      });
    }
  });
};
```

### 示例 2: 在文档末尾添加格式化文本

```javascript
const addFormattedText = () => {
  const docEditor = docEditorRef.current.docEditor;
  
  // 移动到文档末尾
  docEditor.executeMethod('MoveCursorToEnd', [], () => {
    // 添加换行
    docEditor.executeMethod('AddText', ['\n'], () => {
      // 设置粗体
      docEditor.executeMethod('AddToParagraph', [{
        Type: 'para_TextPr',
        Value: { Bold: true, FontSize: 16 }
      }], () => {
        // 添加文本
        docEditor.executeMethod('AddText', ['This is bold text!']);
      });
    });
  });
};
```

### 示例 3: 搜索和替换

```javascript
const searchAndReplace = (searchText, replaceText) => {
  const docEditor = docEditorRef.current.docEditor;
  
  // 移动到开始
  docEditor.executeMethod('MoveCursorToStart', [], () => {
    // 搜索文本
    docEditor.executeMethod('pluginMethod_SearchAndReplace', 
      [searchText, replaceText], 
      (result) => {
        console.log('Replaced count:', result);
      }
    );
  });
};
```

## 注意事项

1. **异步执行**: 所有 `executeMethod` 调用都是异步的，使用回调函数获取结果
2. **文档加载**: 确保在 `onDocumentReady` 事件后再调用 API 方法
3. **错误处理**: 始终添加 try-catch 和错误处理逻辑
4. **权限**: 确保文档处于编辑模式 (`mode: "edit"`)

## 参考资源

- [ONLYOFFICE SDK.js GitHub](https://github.com/ONLYOFFICE/sdkjs)
- [ONLYOFFICE API Documentation](https://api.onlyoffice.com/)
- [Document Editor API](https://api.onlyoffice.com/editors/methods)

## 贡献

如果发现新的有用 API 方法，请更新此文档。
