/**
 * 封装HTTP请求工具
 */
import axios from 'axios';
import { ElMessage } from 'element-plus';

// 默认配置
const DEFAULT_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
};

// 调试模式
const DEBUG = import.meta.env.MODE === 'development';

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
      // 在请求发送之前添加认证令牌
      const token = import.meta.env.VITE_REGFLOW_API_KEY;
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
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
      return response.data;
  },
  error => {
      console.error('响应错误:', error.message);
    
    // 处理错误响应
      const { response } = error;
      let message = '请求失败';
    
    if (response) {
      if (response.status === 401) {
          message = '身份验证失败，请重新登录';
        // 清除令牌并重定向到登录页
          localStorage.removeItem('regflow_token');
      } else if (response.data && response.data.error) {
          message = response.data.error.message || response.data.error;
        }
    }
    
    ElMessage({
      message,
      type: 'error',
      duration: 5 * 1000
      });
      
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
   * SSE流式请求（使用fetch API）
   * @param {string|Object} urlOrConfig - 请求URL或完整配置对象
   * @param {Object} [data] - 请求数据，如果urlOrConfig是对象则忽略
   * @param {Object} [config] - 额外配置，如果urlOrConfig是对象则忽略
   * @returns {Promise<string>} 返回响应文本的Promise
   */
  async function sseRequest(urlOrConfig, data = {}, config = {}) {
    // 解析参数
    let url, finalData, finalConfig = {};
    
    if (typeof urlOrConfig === 'object') {
      url = urlOrConfig.url;
      finalData = urlOrConfig.data || {};
      finalConfig = { ...urlOrConfig };
      delete finalConfig.url;
      delete finalConfig.data;
    } else {
      url = urlOrConfig;
      finalData = data;
      finalConfig = config;
    }
    
    // 完整URL
    const baseURL = finalConfig.baseURL || DEFAULT_CONFIG.baseURL;
    const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
    
    // 合并headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_REGFLOW_API_KEY}`,
      'Accept': 'text/event-stream',
      ...(finalConfig.headers || {})
    };
    
    const method = finalConfig.method || 'POST';
    
    if (DEBUG) {
      console.log(`SSE请求 => ${fullUrl}`);
      console.log('SSE请求方法:', method);
      console.log('SSE请求头:', JSON.stringify(headers, null, 2));
      console.log('SSE请求数据:', finalData);
    }
    
    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(finalData) : undefined,
        credentials: finalConfig.withCredentials ? 'include' : 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误 ${response.status}`);
      }
      
      // 创建一个模拟的axios响应对象
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: response.body
      };
    } catch (error) {
      console.error('SSE请求失败:', error);
      ElMessage({
        message: '流式请求失败',
        type: 'error',
        duration: 5 * 1000
      });
      throw error;
    }
  }
  
  /**
   * 解析SSE响应文本
   * @param {string} responseText - 响应文本
   * @param {Function} onData - 数据处理回调
   * @param {Function} [onComplete] - 完成处理回调
   * @returns {Array} 解析后的数据数组
   */
  function parseSSE(responseText, onData, onComplete) {
    // 分割为独立的消息
    const lines = responseText.split('\n').filter(line => line.trim());
    const results = [];
    
    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          const jsonStr = line.slice(5).trim(); // 移除 'data:' 前缀
          
          // 检查是否为[DONE]标记
          if (jsonStr === '[DONE]') {
            if (DEBUG) console.log("流结束标记");
            continue;
          }
          
          // 尝试解析JSON
          try {
            const data = JSON.parse(jsonStr);
            
            // 回调处理
            if (onData) {
              onData(data);
            }
            
            results.push(data);
          } catch (e) {
            if (DEBUG) console.warn("JSON解析失败:", e, jsonStr);
            // 失败时尝试提取最后出现的JSON对象
            const jsonMatch = jsonStr.match(/\{.*\}/g);
            if (jsonMatch && jsonMatch.length > 0) {
              try {
                if (DEBUG) console.log("尝试解析提取的JSON:", jsonMatch[jsonMatch.length - 1]);
                const extractedData = JSON.parse(jsonMatch[jsonMatch.length - 1]);
                onData(extractedData);
                results.push(extractedData);
              } catch (e2) {
                console.error("提取的JSON也解析失败:", e2);
              }
            }
          }
        } catch (e) {
          console.warn('解析SSE数据失败:', e);
        }
      }
    }
    
    // 处理完成回调
    if (onComplete) {
      onComplete(results);
    }
    
    return results;
  }
  
  /**
   * AI聊天接口（实时流处理）
   * @param {string|Object} urlOrConfig - 请求URL或完整配置对象
   * @param {Object} [data] - 请求数据，如果urlOrConfig是对象则忽略
   * @param {Object} [config] - 额外配置，如果urlOrConfig是对象则忽略
   * @returns {Promise<{response: Response, process: Function}>} 返回响应对象和处理函数
   */
  async function realtimeStream(urlOrConfig, data = {}, config = {}) {
    // 解析参数
    let url, finalData, finalConfig = {};
    
    if (typeof urlOrConfig === 'object') {
      url = urlOrConfig.url;
      finalData = urlOrConfig.data || {};
      finalConfig = { ...urlOrConfig };
      delete finalConfig.url;
      delete finalConfig.data;
    } else {
      url = urlOrConfig;
      finalData = data;
      finalConfig = config;
    }
    
    // 完整URL
    const baseURL = finalConfig.baseURL || DEFAULT_CONFIG.baseURL;
    const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
    
    // 合并headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_REGFLOW_API_KEY}`,
      'Accept': 'text/event-stream',
      ...(finalConfig.headers || {})
    };
    
    const method = finalConfig.method || 'POST';
    
    if (DEBUG) {
      console.log(`实时流请求 => ${fullUrl}`);
      console.log('实时流请求方法:', method);
      console.log('实时流请求头:', JSON.stringify(headers, null, 2));
      console.log('实时流请求数据:', finalData);
    }
    
    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(finalData) : undefined,
        credentials: finalConfig.withCredentials ? 'include' : 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误 ${response.status}`);
      }
      
      // 返回响应对象和处理方法
      return {
        response,
        process: (onData, onError, onComplete) => 
          handleStreamResponse(response, onData, onError, onComplete)
      };
    } catch (error) {
      console.error('实时流请求失败:', error);
      ElMessage({
        message: '流式请求失败',
        type: 'error',
        duration: 5 * 1000
      });
      throw error;
    }
  }
  
  /**
   * 处理流式响应（使用读取器）
   * @param {Response} response - fetch响应对象
   * @param {Function} onData - 数据处理回调
   * @param {Function} onError - 错误处理回调
   * @param {Function} onComplete - 完成处理回调
   * @returns {Function} 取消函数
   */
  function handleStreamResponse(response, onData, onError, onComplete) {
    const reader = response.body.getReader();
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
          if (DEBUG) console.log("收到原始数据块:", textChunk);
          
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
          if (DEBUG) console.log("流结束标记");
          continue;
        }
        
        try {
          if (DEBUG) console.log("解析流数据:", dataContent);
          const parsedData = JSON.parse(dataContent);
          onData(parsedData);
        } catch (e) {
          console.warn("流JSON解析失败:", e, dataContent);
          // 失败时尝试提取最后出现的JSON对象
          const jsonMatch = dataContent.match(/\{.*\}/g);
          if (jsonMatch && jsonMatch.length > 0) {
            try {
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
    sseRequest,
    parseSSE,
    realtimeStream,
    handleStreamResponse
  };
}

// 创建默认实例
const http = createRequest();
export default http;
