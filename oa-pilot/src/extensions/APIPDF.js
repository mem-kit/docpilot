/**
 * APIPDF.js - PDF文档相关操作API
 * 提供PDF文档的查看、注释等功能
 * 注意：OnlyOffice对PDF的编辑能力有限，主要支持查看和简单注释
 */

/**
 * 添加PDF注释（如果支持）
 * @param {Object} docEditor - OnlyOffice文档编辑器实例
 */
export const addPDFAnnotation = (docEditor) => {
  console.log('📄 addPDFAnnotation clicked');
  
  if (!docEditor) {
    console.error('Document editor not initialized yet');
    alert('请等待文档加载完成后再试');
    return;
  }

  // PDF editing capabilities in OnlyOffice are limited
  // This is a placeholder for future PDF operations
  docEditor.showMessage(
    'PDF Operations', 
    'PDF编辑功能有限，主要支持查看和简单注释', 
    'info'
  );
};

/**
 * 导出PDF文档信息
 * @param {Object} docEditor - OnlyOffice文档编辑器实例
 */
export const exportPDFInfo = (docEditor) => {
  console.log('📄 exportPDFInfo clicked');
  
  if (!docEditor) {
    console.error('Document editor not initialized yet');
    alert('请等待文档加载完成后再试');
    return;
  }

  // Get document info if available
  if (docEditor.createConnector) {
    try {
      const connector = docEditor.createConnector();
      connector.callCommand(function() {
        // PDF API is limited, log document info
        console.log('PDF document loaded');
      }, function() {
        console.log("PDF info exported");
      });
    } catch (e) {
      console.error("Connector error:", e);
    }
  }
};
