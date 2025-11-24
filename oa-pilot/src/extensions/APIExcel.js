/**
 * APIExcel.js - Excel表格相关操作API
 * 提供Excel表格的更新、数据填充等功能
 */

/**
 * 更新电子表格
 * @param {Object} docEditor - OnlyOffice文档编辑器实例
 */
export const updateSpreadsheet = (docEditor) => {
  console.log('📊 updateSpreadsheet clicked');
  
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
        var Api = window.Api;
        var oWorksheet = Api.GetActiveSheet();
        oWorksheet.GetRange("A1").SetValue("Hello from React");
        oWorksheet.GetRange("A1").SetBold(true);
        oWorksheet.GetRange("B1").SetValue("Updated via API");
      }, function() {
        console.log("Spreadsheet updated");
      });
    } catch (e) {
      console.error("Connector error:", e);
    }
  }
};
