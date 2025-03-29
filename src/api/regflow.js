import request from '@/utils/request'

// 从环境变量获取应用ID
const APP_ID = import.meta.env.VITE_APP_ID

// API基础前缀
const API_PREFIX = `/api/v1/agentbots/${APP_ID}`

// RegFlow API接口封装
export default {
  /**
   * 发送消息到RegFlow
   * @param {Object} data 请求参数
   * @returns {Promise} 返回Promise对象
   */
  sendMessage(data) {
    return request.sseRequest(`${API_PREFIX}/completions`, {
      conversation: APP_ID,
      quote: true,
      session_id: data.sessionId,
      question: data.message
    })
  },
  
  
  initSession() {
    return request.realtimeStream({
      url: `${API_PREFIX}/completions`,
      method: 'POST',
      data: {
        question: ""
      }
    })
  },

  /**
   * 获取历史会话列表
   * @returns {Promise} 返回Promise对象
   */
  getHistoryList() {
    return request({
      url: `${API_PREFIX}/sessions`,
      method: 'get'
    })
  },

  /**
   * 获取会话详情
   * @param {String} sessionId 会话ID
   * @returns {Promise} 返回Promise对象
   */
  getSessionDetail(sessionId) {
    return request({
      url: `${API_PREFIX}/sessions/${sessionId}`,
      method: 'get'
    })
  },

  /**
   * 创建新会话（实时流式响应）
   * @returns {Promise} 返回包含响应和处理方法的Promise对象
   */
  createSessionRealtime() {
    return request.realtimeStream({
      url: `${API_PREFIX}/completions`,
      method: 'POST',
      data: {
        question: ''
      }
    })
  },

  /**
   * 删除会话
   * @param {String} sessionId 会话ID
   * @returns {Promise} 返回Promise对象
   */
  deleteSession(sessionId) {
    return request({
      url: `${API_PREFIX}/sessions/${sessionId}`,
      method: 'delete'
    })
  }
} 