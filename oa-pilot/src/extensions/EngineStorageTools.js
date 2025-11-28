/**
 * EngineStorageTools.js - 文件存储工具定义
 * 为LLM Agent提供文件操作的可调用工具函数（OpenAI Function Calling格式）
 */

import EngineStorage from './EngineStorage';

/**
 * 工具函数定义（OpenAI Function Calling格式）
 */
export const tools = [
  {
    type: "function",
    function: {
      name: "getFileList",
      description: "获取指定文件夹中的文件列表。如果不指定文件夹，则返回当前工作空间的文件列表。",
      parameters: {
        type: "object",
        properties: {
          folder: {
            type: "string",
            description: "文件夹名称（可选，默认为当前工作空间）",
            default: ""
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "downloadFile",
      description: "获取文件的下载URL地址。返回可用于下载或访问文件的URL。",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "要下载的文件名（包含扩展名）"
          },
          folder: {
            type: "string",
            description: "文件所在的文件夹名称（可选，默认为当前工作空间）",
            default: ""
          }
        },
        required: ["filename"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "createFile",
      description: "创建新的Office文档文件（Word、Excel、PowerPoint或PDF）。",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "文件类型",
            enum: ["word", "excel", "ppt", "pdf"]
          },
          filename: {
            type: "string",
            description: "文件名（不含扩展名）"
          },
          folder: {
            type: "string",
            description: "要创建到的文件夹名称（可选，默认为当前工作空间）",
            default: ""
          }
        },
        required: ["type", "filename"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "deleteFile",
      description: "删除指定的文件。",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "要删除的文件名（包含扩展名）"
          },
          folder: {
            type: "string",
            description: "文件所在的文件夹名称（可选，默认为当前工作空间）",
            default: ""
          }
        },
        required: ["filename"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "renameFile",
      description: "重命名文件。只需提供新的文件名（不含扩展名），扩展名会自动保留。",
      parameters: {
        type: "object",
        properties: {
          oldFilename: {
            type: "string",
            description: "原文件名（包含扩展名）"
          },
          newName: {
            type: "string",
            description: "新文件名（不含扩展名）"
          },
          folder: {
            type: "string",
            description: "文件所在的文件夹名称（可选，默认为当前工作空间）",
            default: ""
          }
        },
        required: ["oldFilename", "newName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getFolderList",
      description: "获取所有可用的工作空间/文件夹列表。",
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
  getFileList: async (args) => {
    const folder = args.folder || '';
    const files = await EngineStorage.getFileList(folder);
    return {
      success: true,
      data: files,
      message: `成功获取 ${folder || '根目录'} 中的文件列表，共 ${files.length} 个文件`
    };
  },

  downloadFile: async (args) => {
    const { filename, folder = '' } = args;
    const url = new URL(`${require('../config').default.storageEngineURL}example/download`);
    url.searchParams.append('fileName', filename);
    if (folder) {
      url.searchParams.append('folder', folder);
    }
    return {
      success: true,
      data: {
        filename,
        url: url.toString()
      },
      message: `文件下载地址已生成: ${filename}`
    };
  },

  createFile: async (args) => {
    const { type, filename, folder = '' } = args;
    const result = await EngineStorage.createFile(type, filename, folder);
    return {
      success: true,
      data: result,
      message: `成功创建文件: ${result.filename}`
    };
  },

  deleteFile: async (args) => {
    const { filename, folder = '' } = args;
    await EngineStorage.deleteFile(filename, folder);
    return {
      success: true,
      message: `成功删除文件: ${filename}`
    };
  },

  renameFile: async (args) => {
    const { oldFilename, newName, folder = '' } = args;
    const result = await EngineStorage.renameFile(oldFilename, newName, folder);
    return {
      success: true,
      data: result,
      message: `成功重命名文件: ${oldFilename} → ${result.newFilename}`
    };
  },

  getFolderList: async (args) => {
    const folders = await EngineStorage.getFolderList();
    return {
      success: true,
      data: folders,
      message: `成功获取文件夹列表，共 ${folders.length} 个文件夹`
    };
  }
};

/**
 * 执行工具调用
 * @param {string} toolName - 工具名称
 * @param {Object} args - 工具参数
 * @param {string} defaultFolder - 默认文件夹（当前工作空间）
 * @returns {Promise<Object>} 执行结果
 */
export async function executeToolCall(toolName, args, defaultFolder = '') {
  console.log(`🔧 Executing storage tool: ${toolName}`, args);
  
  const toolFunction = toolFunctions[toolName];
  
  if (!toolFunction) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`
    };
  }

  try {
    // 如果参数中没有指定 folder，使用默认的工作空间
    const finalArgs = { ...args };
    if (!finalArgs.folder && defaultFolder) {
      finalArgs.folder = defaultFolder;
    }

    // 调用工具函数并获取结果
    const result = await toolFunction(finalArgs);
    
    return result;
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
