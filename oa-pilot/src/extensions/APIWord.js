/**
 * APIWord.js - Word文档相关操作API
 * 提供Word文档的段落更新、格式化文本插入、单词替换等功能
 */

/**
 * 更新文档中的段落
 * @param {Object} docEditor - OnlyOffice文档编辑器实例
 */
export const updateParagraph = (docEditor) => {
  console.log('📝 updateParagraph clicked');
  
  if (!docEditor) {
    console.error('Document editor not initialized yet');
    alert('请等待文档加载完成后再试');
    return;
  }

  // Check if createConnector is available (Standard API)
  if (docEditor.createConnector) {
    try {
      const connector = docEditor.createConnector();
      connector.callCommand(function() {
        // eslint-disable-next-line no-undef
        var oDocument = Api.GetDocument();
        // eslint-disable-next-line no-undef
        var oParagraph = Api.CreateParagraph();
        oParagraph.AddText("这是新插入的段落 from React");
        oDocument.InsertContent([oParagraph]);
      }, function() {
        console.log("Command executed successfully");
      });
    } catch (e) {
      console.error("Connector error:", e);
    }
  } else {
    // Fallback for environments where API is not fully available
    console.warn("createConnector API not available on this Document Server");
  }
};

/**
 * 插入格式化文本到文档
 * @param {Object} docEditor - OnlyOffice文档编辑器实例
 */
export const insertFormattedText = (docEditor) => {
  console.log('✨ insertFormattedText clicked');
  
  if (!docEditor) {
    console.error('Document editor not initialized yet');
    alert('请等待文档加载完成后再试');
    return;
  }
  
  if (docEditor.createConnector) {
    try {
      const connector = docEditor.createConnector();
      connector.callCommand(function() {
        // eslint-disable-next-line no-undef
        var oDocument = Api.GetDocument();
        // eslint-disable-next-line no-undef
        var oParagraph = Api.CreateParagraph();
        
        // Bold text
        // eslint-disable-next-line no-undef
        var oRunBold = Api.CreateRun();
        oRunBold.SetBold(true);
        oRunBold.AddText("Bold text");
        oParagraph.AddElement(oRunBold);

        // Normal text
        // eslint-disable-next-line no-undef
        var oRunNormal = Api.CreateRun();
        oRunNormal.AddText(" and ");
        oParagraph.AddElement(oRunNormal);

        // Italic text
        // eslint-disable-next-line no-undef
        var oRunItalic = Api.CreateRun();
        oRunItalic.SetItalic(true);
        oRunItalic.AddText("italic text");
        oParagraph.AddElement(oRunItalic);
        
        // Underline text
        // eslint-disable-next-line no-undef
        var oRunUnderline = Api.CreateRun();
        oRunUnderline.SetUnderline(true);
        oRunUnderline.AddText(" with underline");
        oParagraph.AddElement(oRunUnderline);

        oDocument.InsertContent([oParagraph]);
      }, function() {
        console.log("Formatted text inserted successfully");
      });
    } catch (e) {
      console.error("Connector error:", e);
    }
  } else {
    docEditor.showMessage('API Limitation', 'createConnector API not available', 'warning');
  }
};

/**
 * 替换当前选中的单词
 * @param {Object} docEditor - OnlyOffice文档编辑器实例
 */
export const replaceCurrentWord = (docEditor) => {
  console.log('🔄 replaceCurrentWord clicked');
  
  if (!docEditor) {
    console.error('Document editor not initialized yet');
    alert('请等待文档加载完成后再试');
    return;
  }
  
  if (docEditor.createConnector) {
    try {
      const connector = docEditor.createConnector();
      connector.callCommand(function() {
        // eslint-disable-next-line no-undef
        var oDocument = Api.GetDocument();
        
        // Try to get selection
        // eslint-disable-next-line no-undef
        var oRange = oDocument.GetRangeBySelect();
        
        // If selection is empty or collapsed, we might want to select the current word
        // But for simplicity, let's just insert text at current position if nothing selected
        // Or replace selection if something is selected
        
        // eslint-disable-next-line no-undef
        oRange.SetText("REPLACED");
        
      }, function() {
        console.log("Word replaced successfully");
      });
    } catch (e) {
      console.error("Connector error:", e);
    }
  } else {
    docEditor.showMessage('API Limitation', 'createConnector API not available', 'warning');
  }
};
