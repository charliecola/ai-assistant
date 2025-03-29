/**
 * 封装HTTP请求工具
 */
import axios from 'axios';

// 默认配置
const DEFAULT_CONFIG = {
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ExM2NmN2I0MDk0NzExZjA4MjdmMDI0Mm'
  },
  withCredentials: true
};

// 调试模式
const DEBUG = true;

/**
 * 创建请求实例
 * @param {Object} customConfig - 自定义配置
 * @returns {Object} 请求方法集合
 */
export function createRequest(customConfig = {}) {
  // 合并配置创建实例
  const instance = axios.create({
    ...DEFAULT_CONFIG,
    ...customConfig,
    headers: {
      ...DEFAULT_CONFIG.headers,
      ...(customConfig.headers || {})
    }
  });
  
  // 请求拦截器
  instance.interceptors.request.use(
    config => {
      if (DEBUG) {
        console.log('发送请求 =>', config.url);
        console.log('请求方法:', config.method.toUpperCase());
        console.log('请求头:', JSON.stringify(config.headers, null, 2));
        if (config.data) console.log('请求数据:', config.data);
      }
      return config;
    },
    error => {
      console.error('请求错误:', error);
      return Promise.reject(error);
    }
  );
  
  // 响应拦截器
  instance.interceptors.response.use(
    response => {
      if (DEBUG) {
        console.log('响应状态:', response.status);
        if (!response.config.responseType || response.config.responseType !== 'stream') {
          console.log('响应数据:', response.data);
        } else {
          console.log('接收到流式响应');
        }
      }
      return response;
    },
    error => {
      console.error('响应错误:', error.message);
      return Promise.reject(error);
    }
  );
  
  /**
   * 基础请求方法
   * @param {Object} config - 请求配置
   * @returns {Promise} 请求Promise
   */
  function request(config) {
    return instance(config);
  }
  
  /**
   * GET请求
   * @param {string} url - 请求URL
   * @param {Object} params - URL参数
   * @param {Object} config - 额外配置
   * @returns {Promise} 请求Promise
   */
  function get(url, params = {}, config = {}) {
    return request({
      method: 'get',
      url,
      params,
      ...config
    });
  }
  
  /**
   * POST请求
   * @param {string} url - 请求URL
   * @param {Object} data - 请求体数据
   * @param {Object} config - 额外配置
   * @returns {Promise} 请求Promise
   */
  function post(url, data = {}, config = {}) {
    return request({
      method: 'post',
      url,
      data,
      ...config
    });
  }
  
  /**
   * PUT请求
   * @param {string} url - 请求URL
   * @param {Object} data - 请求体数据
   * @param {Object} config - 额外配置
   * @returns {Promise} 请求Promise
   */
  function put(url, data = {}, config = {}) {
    return request({
      method: 'put',
      url,
      data,
      ...config
    });
  }
  
  /**
   * DELETE请求
   * @param {string} url - 请求URL
   * @param {Object} config - 额外配置
   * @returns {Promise} 请求Promise
   */
  function del(url, config = {}) {
    return request({
      method: 'delete',
      url,
      ...config
    });
  }
  
  /**
   * 流式GET请求
   * @param {string} url - 请求URL
   * @param {Object} params - URL参数
   * @param {Object} config - 额外配置
   * @returns {Promise} 请求Promise
   */
  function streamGet(url, params = {}, config = {}) {
    return request({
      method: 'get',
      url,
      params,
      responseType: 'stream',
      ...config
    });
  }
  
  /**
   * 流式POST请求
   * @param {string} url - 请求URL
   * @param {Object} data - 请求体数据
   * @param {Object} config - 额外配置
   * @returns {Promise} 请求Promise
   */
  function streamPost(url, data = {}, config = {}) {
    return request({
      method: 'post',
      url,
      data,
      responseType: 'blob', // 在浏览器中使用blob
      ...config
    });
  }
  
  /**
   * AI聊天接口
   * @param {Object} data - 请求数据
   * @returns {Promise} 流式响应Promise
   */
  async function completions(data) {
    // AI聊天接口的URL
    const url = '/api/v1/agentbots/b1809c96093b11f087c70242ac140006/completions';
    
    // 请求配置
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ExM2NmN2I0MDk0NzExZjA4MjdmMDI0Mm',
        'Accept': 'text/event-stream' // 指定接受SSE格式
      }
    };
    
    // 直接使用fetch API处理流式响应
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误 ${response.status}`);
      }
      
      // 创建一个模拟的axios响应对象
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.body
      };
    } catch (error) {
      console.error('流式请求失败:', error);
      throw error;
    }
  }
  
  /**
   * 处理流式响应
   * @param {Object} response - axios响应对象
   * @param {Function} onData - 数据处理回调
   * @param {Function} onError - 错误处理回调
   * @param {Function} onComplete - 完成处理回调
   * @returns {Function} 取消函数
   */
  function handleStreamResponse(response, onData, onError, onComplete) {
    // 浏览器环境下，response.data是ReadableStream
    const reader = response.data.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    
    // 创建一个取消控制器
    const controller = new AbortController();
    const signal = controller.signal;
    
    // 处理流式数据
    async function processStream() {
      try {
        while (!signal.aborted) {
          const { value, done } = await reader.read();
          
          // 如果已完成，退出循环
          if (done) {
            // 处理缓冲区中剩余的数据
            if (buffer.trim()) {
              parseSSEChunk(buffer);
            }
            if (onComplete) onComplete();
            break;
          }
          
          // 解码新的数据块
          const textChunk = decoder.decode(value, { stream: true });
          console.log("收到原始数据块:", textChunk);
          
          // 追加到缓冲区
          buffer += textChunk;
          
          // 处理缓冲区
          const newlineIndex = buffer.lastIndexOf('\n\n');
          if (newlineIndex !== -1) {
            const completeChunks = buffer.substring(0, newlineIndex + 2);
            buffer = buffer.substring(newlineIndex + 2);
            
            // 解析完整的SSE消息块
            parseSSEChunk(completeChunks);
          }
        }
      } catch (err) {
        console.error("流处理错误:", err);
        if (!signal.aborted && onError) {
          onError(err);
        }
      }
    }
    
    // 解析SSE块
    function parseSSEChunk(chunk) {
      // 分割为独立的消息
      const messages = chunk.split(/\n\n/);
      
      for (const message of messages) {
        if (!message.trim()) continue;
        
        // 提取data行
        const dataLines = message.split('\n')
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trim());
        
        if (dataLines.length === 0) continue;
        
        // 连接多行data字段
        const dataContent = dataLines.join('');
        
        if (dataContent === '[DONE]') {
          console.log("流结束标记");
          continue;
        }
        
        try {
          console.log("解析数据:", dataContent);
          const parsedData = JSON.parse(dataContent);
          onData(parsedData);
        } catch (e) {
          console.warn("JSON解析失败:", e, dataContent);
          // 失败时尝试提取最后出现的JSON对象
          const jsonMatch = dataContent.match(/\{.*\}/g);
          if (jsonMatch && jsonMatch.length > 0) {
            try {
              console.log("尝试解析提取的JSON:", jsonMatch[jsonMatch.length - 1]);
              const extractedData = JSON.parse(jsonMatch[jsonMatch.length - 1]);
              onData(extractedData);
            } catch (e2) {
              console.error("提取的JSON也解析失败:", e2);
            }
          }
        }
      }
    }
    
    // 开始处理流
    processStream();
    
    // 返回取消函数
    return () => {
      controller.abort();
      reader.cancel().catch(() => {});
    };
  }
  
  // 导出所有方法
  return {
    request,
    get,
    post,
    put,
    delete: del,
    streamGet,
    streamPost,
    completions,
    handleStreamResponse
  };
}

// 创建默认实例
const http = createRequest();
export default http;