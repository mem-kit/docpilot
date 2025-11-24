/**
 * EngineDocument.js - 文档操作工具定义
 * 为LLM Agent提供可调用的工具函数定义（OpenAI Function Calling格式）
 */

import * as APIWord from './APIWord';
import * as APIExcel from './APIExcel';
import * as APIPowerPoint from './APIPowerPoint';
// import * as APIPDF from './APIPDF'; // PDF support to be implemented

/**
 * 工具函数定义（OpenAI Function Calling格式）
 */
export const tools = [
  {
    type: "function",
    function: {
      name: "updateParagraph",
      description: "在Word文档中插入一个新段落。适用于添加文本内容到文档中。",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "要插入的段落文本内容"
          }
        },
        required: ["text"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "insertFormattedText",
      description: "在Word文档中插入格式化文本，可以指定粗体、斜体、下划线等样式。",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "要插入的文本内容"
          },
          bold: {
            type: "boolean",
            description: "是否设置为粗体",
            default: false
          },
          italic: {
            type: "boolean",
            description: "是否设置为斜体",
            default: false
          },
          underline: {
            type: "boolean",
            description: "是否添加下划线",
            default: false
          }
        },
        required: ["text"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "replaceCurrentWord",
      description: "替换Word文档中当前选中的文本。如果没有选中文本，则在光标位置插入。",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "要替换为的新文本"
          }
        },
        required: ["text"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "updateSpreadsheet",
      description: "更新Excel表格中的单元格内容，可以指定单元格位置、文本内容和格式。",
      parameters: {
        type: "object",
        properties: {
          cell: {
            type: "string",
            description: "单元格位置，例如 'A1', 'B2' 等",
            default: "A1"
          },
          value: {
            type: "string",
            description: "要设置的单元格值"
          },
          bold: {
            type: "boolean",
            description: "是否设置为粗体",
            default: false
          }
        },
        required: ["value"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "updatePresentation",
      description: "更新PowerPoint演示文稿中指定幻灯片的文本内容。",
      parameters: {
        type: "object",
        properties: {
          slideIndex: {
            type: "number",
            description: "幻灯片索引（从0开始）",
            default: 0
          },
          text: {
            type: "string",
            description: "要设置的文本内容"
          }
        },
        required: ["text"]
      }
    }
  }
];

/**
 * 工具函数映射表
 * 将工具名称映射到实际的执行函数
 */
export const toolFunctions = {
  updateParagraph: APIWord.updateParagraph,
  insertFormattedText: APIWord.insertFormattedText,
  replaceCurrentWord: APIWord.replaceCurrentWord,
  updateSpreadsheet: APIExcel.updateSpreadsheet,
  updatePresentation: APIPowerPoint.updatePresentation
};

/**
 * 执行工具调用
 * @param {string} toolName - 工具名称
 * @param {Object} args - 工具参数
 * @param {Object} docEditor - 文档编辑器实例
 * @returns {Promise<Object>} 执行结果
 */
export async function executeToolCall(toolName, args, docEditor) {
  console.log(`🔧 Executing tool: ${toolName}`, args);
  console.log(`📋 Editor instance:`, docEditor);
  console.log(`📋 Editor has createConnector:`, docEditor?.createConnector);
  
  if (!docEditor) {
    console.error('❌ Document editor is not available');
    return {
      success: false,
      error: "Document editor is not available"
    };
  }

  const toolFunction = toolFunctions[toolName];
  
  if (!toolFunction) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`
    };
  }

  try {
    // 调用工具函数并获取结果
    const result = await toolFunction(docEditor, args);
    
    // 如果工具函数返回了结果，使用它；否则返回默认成功消息
    if (result && typeof result === 'object') {
      return result;
    }
    
    return {
      success: true,
      message: `Successfully executed ${toolName}`
    };
  } catch (error) {
    console.error(`Error executing ${toolName}:`, error);
    return {
      success: false,
      error: error.message || "Unknown error occurred"
    };
  }
}

/**
 * 获取工具描述（用于显示给用户）
 */
export function getToolsDescription() {
  return tools.map(tool => ({
    name: tool.function.name,
    description: tool.function.description
  }));
}
