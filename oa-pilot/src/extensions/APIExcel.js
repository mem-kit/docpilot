/**
 * APIExcel.js - Excel表格相关操作API
 * 提供Excel表格的更新、数据填充等功能
 */

/**
 * 更新电子表格
 * @param {Object} docEditor - OnlyOffice文档编辑器实例
 * @param {Object} args - 参数对象 {cell: string, value: string, bold: boolean}
 */
export const updateSpreadsheet = (docEditor, args = {}) => {
  const { cell = 'A1', value = 'Hello from API', bold = false } = args;
  console.log('📊 updateSpreadsheet called with:', { cell, value, bold });
  
  if (!docEditor) {
    console.error('Document editor not initialized yet');
    throw new Error('文档编辑器未初始化');
  }

  return new Promise((resolve, reject) => {
    if (docEditor.createConnector) {
      try {
        const connector = docEditor.createConnector();
        const cellJson = JSON.stringify(cell);
        const valueJson = JSON.stringify(value);
        const functionBody = `
          var Api = window.Api;
          var oWorksheet = Api.GetActiveSheet();
          var oRange = oWorksheet.GetRange(${cellJson});
          oRange.SetValue(${valueJson});
          if (${bold}) {
            oRange.SetBold(true);
          }
        `;
        connector.callCommand(new Function(functionBody), function(result) {
          console.log("Spreadsheet updated", result);
          const styleStr = bold ? '(粗体)' : '';
          resolve({ success: true, message: `成功更新单元格 ${cell}${styleStr}: ${value}` });
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
