/**
 * EngineStorage - 文件存储引擎
 * 提供统一的文件操作接口，包括：
 * - 获取文件列表
 * - 创建新文件
 * - 删除文件
 * - 重命名文件
 * - 打开文件
 */

import config from '../config';

class EngineStorage {
  /**
   * 获取文件列表
   * @returns {Promise<Array>} 文件列表
   */
  static async getFileList() {
    try {
      const response = await fetch(`${config.storageEngineURL}example/files`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get file list:', error);
      throw error;
    }
  }

  /**
   * 创建新文件
   * @param {string} type - 文件类型: 'word', 'excel', 'ppt', 'pdf'
   * @param {string} filename - 文件名（不含扩展名）
   * @returns {Promise<Object>} 创建结果 { filename, documentType }
   */
  static async createFile(type, filename) {
    try {
      // 文件名验证和清理
      const sanitizedName = filename.trim().replace(/\s+/g, '');
      
      if (!sanitizedName) {
        throw new Error('文件名不能为空');
      }

      // 扩展名映射
      const extensions = {
        'word': '.docx',
        'excel': '.xlsx',
        'ppt': '.pptx',
        'pdf': '.pdf'
      };

      const fullFileName = sanitizedName + (extensions[type] || '.docx');

      // 模板文件映射
      const templateFiles = {
        'word': 'example.docx',
        'excel': 'example.xlsx',
        'ppt': 'example.pptx',
        'pdf': 'example.pdf'
      };

      const templateName = templateFiles[type];

      // 从 public/sample 目录下载模板文件
      const response = await fetch(`/sample/${templateName}`);
      
      if (!response.ok) {
        throw new Error(`无法获取模板文件: ${response.status}`);
      }

      const blob = await response.blob();

      // 使用模板文件内容，以新文件名上传
      const formData = new FormData();
      formData.append('uploadedFile', blob, fullFileName);

      // 直接上传到 storage engine（支持 CORS）
      const uploadResponse = await fetch(`${config.storageEngineURL}example/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`上传失败: ${uploadResponse.status}`);
      }

      const result = await uploadResponse.json();
      console.log('File created:', result);

      return {
        filename: fullFileName,
        ...result
      };
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  }

  /**
   * 删除文件
   * @param {string} filename - 要删除的文件名
   * @returns {Promise<void>}
   */
  static async deleteFile(filename) {
    try {
      const response = await fetch(`${config.storageEngineURL}example/file?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'text/xml',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        throw new Error(`删除失败: ${response.status}`);
      }

      console.log('File deleted:', filename);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * 重命名文件（通过下载-上传-删除策略）
   * @param {string} oldFilename - 原文件名
   * @param {string} newName - 新文件名（不含扩展名）
   * @returns {Promise<Object>} { oldFilename, newFilename }
   */
  static async renameFile(oldFilename, newName) {
    try {
      // 文件名验证和清理
      const sanitizedName = newName.trim().replace(/\s+/g, '');

      if (!sanitizedName) {
        throw new Error('文件名不能为空');
      }

      // 保留原扩展名
      const extension = oldFilename.match(/\.[^.]+$/)?.[0] || '';
      const newFilename = sanitizedName + extension;

      if (newFilename === oldFilename) {
        return { oldFilename, newFilename }; // 名称未改变
      }

      // 1. 下载原文件
      const downloadResponse = await fetch(`${config.storageEngineURL}example/download?fileName=${encodeURIComponent(oldFilename)}`);
      if (!downloadResponse.ok) {
        throw new Error('下载文件失败');
      }
      const blob = await downloadResponse.blob();

      // 2. 上传新文件
      const formData = new FormData();
      formData.append('uploadedFile', blob, newFilename);

      const uploadResponse = await fetch(`${config.storageEngineURL}example/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('上传新文件失败');
      }

      // 3. 删除旧文件
      const deleteResponse = await fetch(`${config.storageEngineURL}example/file?filename=${encodeURIComponent(oldFilename)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'text/xml',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!deleteResponse.ok) {
        console.warn('删除旧文件失败，但新文件已创建');
      }

      console.log('File renamed:', oldFilename, '->', newFilename);

      return { oldFilename, newFilename };
    } catch (error) {
      console.error('Failed to rename file:', error);
      throw error;
    }
  }

  /**
   * 打开文件（返回文件信息用于编辑器加载）
   * @param {string} filename - 要打开的文件名
   * @returns {Promise<Object>} 文件信息 { title, id, url }
   */
  static async openFile(filename) {
    try {
      // 验证文件是否存在
      const files = await this.getFileList();
      const file = files.find(f => f.title === filename);

      if (!file) {
        throw new Error(`文件不存在: ${filename}`);
      }

      console.log('Opening file:', filename);

      return {
        title: file.title,
        id: file.id || file.title,
        url: `${config.storageEngineURL}example/download?fileName=${filename}`
      };
    } catch (error) {
      console.error('Failed to open file:', error);
      throw error;
    }
  }

  /**
   * 下载文件内容
   * @param {string} filename - 文件名
   * @returns {Promise<Blob>} 文件内容
   */
  static async downloadFile(filename) {
    try {
      const response = await fetch(`${config.storageEngineURL}example/download?fileName=${encodeURIComponent(filename)}`);
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  }

  /**
   * 上传文件
   * @param {Blob} blob - 文件内容
   * @param {string} filename - 文件名
   * @returns {Promise<Object>} 上传结果
   */
  static async uploadFile(blob, filename) {
    try {
      const formData = new FormData();
      formData.append('uploadedFile', blob, filename);

      const response = await fetch(`${config.storageEngineURL}example/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('File uploaded:', result);
      return result;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }
}

export default EngineStorage;
