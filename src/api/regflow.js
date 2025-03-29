import request from '@/utils/request'

// API基础前缀
const API_PREFIX = '/api/v1/agentbots/79f3833e093f11f094b00242ac140006'

// RegFlow API接口封装
export default {
  /**
   * 发送消息到RegFlow
   * @param {Object} data 请求参数
   * @returns {Promise} 返回Promise对象
   */
  sendMessage(data) {
    return request({
      url: `${API_PREFIX}/completions`,
      method: 'post',
      data: {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: data.message
          }
        ],
        session_id: data.sessionId
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
   * 创建新会话
   * @returns {Promise} 返回Promise对象
   */
  createSession() {
    return request({
      url: `${API_PREFIX}/sessions`,
      method: 'post',
      data: {
        title: '新会话'
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