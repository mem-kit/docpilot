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
   * 获取文件夹列表
   * @returns {Promise<Array<string>>} 文件夹列表
   */
  static async getFolderList() {
    try {
      const response = await fetch(`${config.storageEngineURL}example/folders`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get folder list:', error);
      throw error;
    }
  }

  /**
   * 获取文件列表
   * @param {string} folder - 文件夹名称（空字符串表示根目录）
   * @returns {Promise<Array>} 文件列表
   */
  static async getFileList(folder = '') {
    try {
      const url = new URL(`${config.storageEngineURL}example/files`);
      if (folder) {
        url.searchParams.append('folder', folder);
      }
      const response = await fetch(url);
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
   * @param {string} folder - 文件夹名称（空字符串表示根目录）
   * @returns {Promise<Object>} 创建结果 { filename, documentType }
   */
  static async createFile(type, filename, folder = '') {
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
      formData.append('file', blob, fullFileName);

      console.log('Creating file:', {
        type,
        filename: sanitizedName,
        fullFileName,
        templateName,
        blobSize: blob.size,
        blobType: blob.type
      });

      // 直接上传到 storage engine（支持 CORS）
      const uploadUrl = new URL(`${config.storageEngineURL}example/upload`);
      if (folder) {
        uploadUrl.searchParams.append('folder', folder);
      }
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      console.log('Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload error response:', errorText);
        throw new Error(`上传失败 (${uploadResponse.status}): ${errorText}`);
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
   * @param {string} folder - 文件夹名称（空字符串表示根目录）
   * @returns {Promise<void>}
   */
  static async deleteFile(filename, folder = '') {
    try {
      const url = new URL(`${config.storageEngineURL}example/file`);
      url.searchParams.append('filename', filename);
      if (folder) {
        url.searchParams.append('folder', folder);
      }
      const response = await fetch(url, {
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
   * @param {string} folder - 文件夹名称（空字符串表示根目录）
   * @returns {Promise<Object>} { oldFilename, newFilename }
   */
  static async renameFile(oldFilename, newName, folder = '') {
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
      const downloadUrl = new URL(`${config.storageEngineURL}example/download`);
      downloadUrl.searchParams.append('fileName', oldFilename);
      if (folder) {
        downloadUrl.searchParams.append('folder', folder);
      }
      const downloadResponse = await fetch(downloadUrl);
      if (!downloadResponse.ok) {
        throw new Error('下载文件失败');
      }
      const blob = await downloadResponse.blob();

      // 2. 上传新文件
      const formData = new FormData();
      formData.append('file', blob, newFilename);

      const uploadUrl = new URL(`${config.storageEngineURL}example/upload`);
      if (folder) {
        uploadUrl.searchParams.append('folder', folder);
      }
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('上传新文件失败');
      }

      // 3. 删除旧文件
      const deleteUrl = new URL(`${config.storageEngineURL}example/file`);
      deleteUrl.searchParams.append('filename', oldFilename);
      if (folder) {
        deleteUrl.searchParams.append('folder', folder);
      }
      const deleteResponse = await fetch(deleteUrl, {
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
   * @param {string} folder - 文件夹名称（空字符串表示根目录）
   * @returns {Promise<Object>} 文件信息 { title, id, url }
   */
  static async openFile(filename, folder = '') {
    try {
      // 验证文件是否存在
      const files = await this.getFileList(folder);
      const file = files.find(f => f.title === filename);

      if (!file) {
        throw new Error(`文件不存在: ${filename}`);
      }

      console.log('Opening file:', filename);

      const downloadUrl = new URL(`${config.storageEngineURL}example/download`);
      downloadUrl.searchParams.append('fileName', filename);
      if (folder) {
        downloadUrl.searchParams.append('folder', folder);
      }
      
      return {
        title: file.title,
        id: file.id || file.title,
        url: downloadUrl.toString()
      };
    } catch (error) {
      console.error('Failed to open file:', error);
      throw error;
    }
  }

  /**
   * 下载文件内容
   * @param {string} filename - 文件名
   * @param {string} folder - 文件夹名称（空字符串表示根目录）
   * @returns {Promise<Blob>} 文件内容
   */
  static async downloadFile(filename, folder = '') {
    try {
      const url = new URL(`${config.storageEngineURL}example/download`);
      url.searchParams.append('fileName', filename);
      if (folder) {
        url.searchParams.append('folder', folder);
      }
      const response = await fetch(url);
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
   * @param {string} folder - 文件夹名称（空字符串表示根目录）
   * @returns {Promise<Object>} 上传结果
   */
  static async uploadFile(blob, filename, folder = '') {
    try {
      const formData = new FormData();
      formData.append('file', blob, filename);

      const url = new URL(`${config.storageEngineURL}example/upload`);
      if (folder) {
        url.searchParams.append('folder', folder);
      }
      const response = await fetch(url, {
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
