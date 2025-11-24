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
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "insertFormattedText",
      description: "在Word文档中插入格式化文本，包含粗体、斜体和下划线样式。适用于需要添加带格式的文本。",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "replaceCurrentWord",
      description: "替换Word文档中当前选中的文本。用户需要先在文档中选中要替换的文本。",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "updateSpreadsheet",
      description: "更新Excel表格，在A1单元格插入'Hello from React'并设置为粗体，在B1单元格插入'Updated via API'。",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "updatePresentation",
      description: "更新PowerPoint演示文稿，修改第一张幻灯片的第一个形状中的文本为'Updated Slide from React'。",
      parameters: {
        type: "object",
        properties: {},
        required: []
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
  
  if (!docEditor) {
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
    // 调用工具函数
    await toolFunction(docEditor, args);
    
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
