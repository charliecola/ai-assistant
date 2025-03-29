import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在请求发送之前做一些处理
    const token = localStorage.getItem('regflow_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    // 添加API密钥（如果有）
    const apiKey = import.meta.env.VITE_REGFLOW_API_KEY
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey
    }
    
    return config
  },
  error => {
    // 处理请求错误
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // RegFlow API返回直接数据，没有code包装
    return res
  },
  error => {
    console.error('Response error:', error)
    
    // 处理错误响应
    const { response } = error
    let message = '请求失败'
    
    if (response) {
      if (response.status === 401) {
        message = '身份验证失败，请重新登录'
        // 清除令牌并重定向到登录页
        localStorage.removeItem('regflow_token')
      } else if (response.data && response.data.error) {
        message = response.data.error.message || response.data.error
      }
    }
    
    ElMessage({
      message,
      type: 'error',
      duration: 5 * 1000
    })
    
    return Promise.reject(error)
  }
)

export default service 