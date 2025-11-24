/**
 * APIPowerPoint.js - PowerPoint演示文稿相关操作API
 * 提供PowerPoint幻灯片的更新、内容添加等功能
 */

/**
 * 更新演示文稿
 * @param {Object} docEditor - OnlyOffice文档编辑器实例
 */
export const updatePresentation = (docEditor) => {
  console.log('📽️ updatePresentation clicked');
  
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
        var oPresentation = Api.GetPresentation();
        var oSlide = oPresentation.GetSlideByIndex(0);
        if (oSlide) {
            var oShape = oSlide.GetAllShapes()[0];
            if (oShape) {
                 var oDocContent = oShape.GetDocContent();
                 oDocContent.RemoveAllElements();
                 var oParagraph = oDocContent.GetElement(0);
                 oParagraph.AddText("Updated Slide from React");
            }
        }
      }, function() {
        console.log("Presentation updated");
      });
    } catch (e) {
      console.error("Connector error:", e);
    }
  }
};
