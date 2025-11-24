/**
 * APIPowerPoint.js - PowerPoint演示文稿相关操作API
 * 提供PowerPoint幻灯片的更新、内容添加等功能
 */

/**
 * 更新演示文稿
 * @param {Object} docEditor - OnlyOffice文档编辑器实例
 * @param {Object} args - 参数对象 {slideIndex: number, text: string}
 */
export const updatePresentation = (docEditor, args = {}) => {
  const { slideIndex = 0, text = 'Updated Slide from API' } = args;
  console.log('📽️ updatePresentation called with:', { slideIndex, text });
  
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
          var oPresentation = Api.GetPresentation();
          var oSlide = oPresentation.GetSlideByIndex(${slideIndex});
          if (oSlide) {
            var oShape = oSlide.GetAllShapes()[0];
            if (oShape) {
              var oDocContent = oShape.GetDocContent();
              oDocContent.RemoveAllElements();
              var oParagraph = oDocContent.GetElement(0);
              oParagraph.AddText(${textJson});
            }
          }
        `;
        connector.callCommand(new Function(functionBody), function(result) {
          console.log("Presentation updated", result);
          resolve({ success: true, message: `成功更新幻灯片 ${slideIndex + 1}: ${text}` });
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
