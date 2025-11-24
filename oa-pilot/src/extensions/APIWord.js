/**
 * APIWord.js - Word文档相关操作API
 * 提供Word文档的段落更新、格式化文本插入、单词替换等功能
 */

/**
 * 更新文档中的段落
 * @param {Object} docEditor - OnlyOffice文档编辑器实例
 * @param {Object} args - 参数对象 {text: string}
 */
export const updateParagraph = (docEditor, args = {}) => {
  const text = args.text || '这是新插入的段落';
  console.log('📝 updateParagraph called with text:', text);
  
  if (!docEditor) {
    console.error('Document editor not initialized yet');
    throw new Error('文档编辑器未初始化');
  }

  return new Promise((resolve, reject) => {
    if (docEditor.createConnector) {
      try {
        const connector = docEditor.createConnector();
        // 将参数序列化为JSON字符串，嵌入到函数体中
        const textJson = JSON.stringify(text);
        const functionBody = `
          var oDocument = Api.GetDocument();
          var oParagraph = Api.CreateParagraph();
          var textToAdd = ${textJson};
          oParagraph.AddText(textToAdd);
          oDocument.InsertContent([oParagraph]);
        `;
        // 使用new Function创建函数并传递给callCommand
        connector.callCommand(new Function(functionBody), function(result) {
          console.log("Command executed successfully", result);
          resolve({ success: true, message: `成功插入段落: ${text}` });
        });
      } catch (e) {
        console.error("Connector error:", e);
        reject(new Error(`执行失败: ${e.message}`));
      }
    } else {
      reject(new Error('createConnector API 不可用'));
    }
  });
};

/**
 * 插入格式化文本到文档
 * @param {Object} docEditor - OnlyOffice文档编辑器实例
 * @param {Object} args - 参数对象 {text: string, bold: boolean, italic: boolean, underline: boolean}
 */
export const insertFormattedText = (docEditor, args = {}) => {
  const { text = '格式化文本', bold = false, italic = false, underline = false } = args;
  console.log('✨ insertFormattedText called with:', { text, bold, italic, underline });
  
  if (!docEditor) {
    console.error('Document editor not initialized yet');
    throw new Error('文档编辑器未初始化');
  }
  
  return new Promise((resolve, reject) => {
    if (docEditor.createConnector) {
      try {
        const connector = docEditor.createConnector();
        const textJson = JSON.stringify(text);
        const functionBody = `
          var oDocument = Api.GetDocument();
          var oParagraph = Api.CreateParagraph();
          var oRun = Api.CreateRun();
          
          if (${bold}) oRun.SetBold(true);
          if (${italic}) oRun.SetItalic(true);
          if (${underline}) oRun.SetUnderline(true);
          
          oRun.AddText(${textJson});
          oParagraph.AddElement(oRun);
          oDocument.InsertContent([oParagraph]);
        `;
        connector.callCommand(new Function(functionBody), function(result) {
          console.log("Formatted text inserted successfully", result);
          const styles = [];
          if (bold) styles.push('粗体');
          if (italic) styles.push('斜体');
          if (underline) styles.push('下划线');
          const styleStr = styles.length > 0 ? `(${styles.join(', ')})` : '';
          resolve({ success: true, message: `成功插入格式化文本${styleStr}: ${text}` });
        });
      } catch (e) {
        console.error("Connector error:", e);
        reject(new Error(`执行失败: ${e.message}`));
      }
    } else {
      reject(new Error('createConnector API 不可用'));
    }
  });
};

/**
 * 替换当前选中的单词
 * @param {Object} docEditor - OnlyOffice文档编辑器实例
 * @param {Object} args - 参数对象 {text: string}
 */
export const replaceCurrentWord = (docEditor, args = {}) => {
  const text = args.text || 'REPLACED';
  console.log('🔄 replaceCurrentWord called with text:', text);
  
  if (!docEditor) {
    console.error('Document editor not initialized yet');
    throw new Error('文档编辑器未初始化');
  }
  
  return new Promise((resolve, reject) => {
    if (docEditor.createConnector) {
      try {
        const connector = docEditor.createConnector();
        const textJson = JSON.stringify(text);
        const functionBody = `
          var oDocument = Api.GetDocument();
          var oRange = oDocument.GetRangeBySelect();
          oRange.SetText(${textJson});
        `;
        connector.callCommand(new Function(functionBody), function(result) {
          console.log("Word replaced successfully", result);
          resolve({ success: true, message: `成功替换文本为: ${text}` });
        });
      } catch (e) {
        console.error("Connector error:", e);
        reject(new Error(`执行失败: ${e.message}`));
      }
    } else {
      reject(new Error('createConnector API 不可用'));
    }
  });
};
