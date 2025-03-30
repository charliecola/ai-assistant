import { defineStore } from 'pinia'
import regflowApi from '@/api/regflow'
import { ElMessage } from 'element-plus'
import http from '@/utils/request'
import { nextTick } from 'vue'
export const useChatStore = defineStore('chat', {
  state: () => ({
    sessionId: '',
    messageList: [],
    historyList: [],
    loading: false,
    streaming: false,
    streamCancel: null // 用于取消实时流
  }),

  actions: {
    // 创建新会话(实时流式)
    async createNewSessionRealtime() {
      // 取消之前的流
      this.cancelStream()
      
      this.loading = true
      this.streaming = true
      this.sessionId = null
      this.messageList = []
      
      try {
        // 获取流式响应和处理方法
        const { process } = await regflowApi.createSessionRealtime()
        
        // 处理实时流
        this.streamCancel = process(
          // 数据处理回调
          (data) => {
            if (data.code === 0 && data.data) {
              // 如果data是对象，包含answer
              if (typeof data.data === 'object' && data.data.answer) {
                // 过滤掉思考过程
                let content = data.data.answer;
                // 更新sessionId
                this.sessionId = data.data.session_id;
                window.sessionStorage.setItem('sessionId', this.sessionId)
              }
            }
          },
          // 错误处理回调
          (error) => {
            console.error('流处理错误:', error)
            this.loading = false
            this.streaming = false
          },
          // 完成处理回调
          () => {
            console.log('流处理完成')
            this.loading = false
            this.streaming = false
            this.streamCancel = null
          }
        )
        
        return true
      } catch (error) {
        console.error('创建新会话失败:', error)
        ElMessage.error('创建新会话失败')
        this.loading = false
        this.streaming = false
        throw error
      }
    },

    // 发送消息
    async sendMessage(message, scrollToBottom) {
      if (!message.trim()) {
        return false
      }
  
      // 取消之前的流
      this.cancelStream()
      
      // 添加用户消息到列表
      this.messageList.push({
        role: 'user',
        content: message
      })
      
      // 发送请求
      this.loading = true
      this.streaming = true
      try {
        // 获取流式响应和处理方法
        const response = await regflowApi.sendMessage({
          sessionId: this.sessionId,
          message: message
        })
        
        // 添加一个空的助手消息，准备接收流式内容
        const assistantMessageIndex = this.messageList.push({
          role: 'assistant',
          content: ''
        }) - 1
        
        // 处理实时流
        this.streamCancel = http.handleStreamResponse(response,
          // 数据处理回调
          (data) => {
            if (data.code === 0 && data.data) {
              // 如果data是对象，包含answer
              if (typeof data.data === 'object' && data.data.answer) {
                // 过滤掉思考过程
                let content = data.data.answer;
                if (content.includes('<think>')) {
                  content = content.replace(/<think>.*?<\/think>/g, '');
                }
                // 移除流程提示词
                // *'问题优化_0'* is running...🕞   *'知识检索_0'* is running...🕞  *'生成回答_0'* is running...🕞
                content = content.replace(/\*'问题优化_0'\* is running...🕞|\*'知识检索_0'\* is running...🕞|\*'生成回答_0'\* is running...🕞/g, '思考中...');
                content = content.replace(/####/g, '');
                content = content.replace(/ ##.*?\$\$/g, ''); 
                // 更新消息内容
                this.messageList[assistantMessageIndex].content = content;
                if (scrollToBottom) {
                  // 滚动到底部
                  nextTick(() => {
                    scrollToBottom()
                  })
                }
              }
            }
          },
          // 错误处理回调
          (error) => {
            console.error('流处理错误:', error)
            this.loading = false
            this.streaming = false
          },
          // 完成处理回调
          () => {
            console.log('流处理完成')
            this.loading = false
            this.streaming = false
            this.streamCancel = null
            nextTick(() => {
              scrollToBottom()
            })
          }
        )
        
        return response
      } catch (error) {
        console.error('发送消息失败:', error)
        ElMessage.error('发送消息失败，请重试')
        this.loading = false
        this.streaming = false
        throw error
      }
    },
    // 发送消息
    async sendMessageAvatar(message, callback) {
      if (!message.trim()) {
        return false
      }
  
      // 取消之前的流
      this.cancelStream()
      
      // 添加用户消息到列表
      this.messageList.push({
        role: 'user',
        content: message
      })
      
      // 发送请求
      this.loading = true
      this.streaming = true
      try {
        // 获取流式响应和处理方法
        const response = await regflowApi.sendMessage({
          sessionId: this.sessionId,
          message: message
        })
        
        // 添加一个空的助手消息，准备接收流式内容
        const assistantMessageIndex = this.messageList.push({
          role: 'assistant',
          content: ''
        }) - 1
        
        // 处理实时流
        this.streamCancel = http.handleStreamResponse(response,
          // 数据处理回调
          (data) => {
            if (data.code === 0 && data.data) {
              // 如果data是对象，包含answer
              if (typeof data.data === 'object' && data.data.answer && !/##.*?\$\$/.test(data?.data?.answer)) {
                // 过滤掉思考过程
                let content = data.data.answer;
                if (content.includes('<think>')) {
                  content = content.replace(/<think>.*?<\/think>/g, '');
                }
                // 移除流程提示词
                // *'问题优化_0'* is running...🕞   *'知识检索_0'* is running...🕞  *'生成回答_0'* is running...🕞
                content = content.replace(/\*'问题优化_0'\* is running...🕞|\*'知识检索_0'\* is running...🕞|\*'生成回答_0'\* is running...🕞/g, '思考中...');
                content = content.replace(/####/g, '');
                content = content.replace(/##.*?\$\$/g, '');
                // 更新消息内容
                // this.messageList[assistantMessageIndex].content = content;
                if (callback) {
                  // 滚动到底部
                  callback(content)
                }
              }
            }
          },
          // 错误处理回调
          (error) => {
            console.error('流处理错误:', error)
            this.loading = false
            this.streaming = false
          },
          // 完成处理回调
          () => {
            this.loading = false
            this.streaming = false
            this.streamCancel = null
          }
        )
        
        return response
      } catch (error) {
        console.error('发送消息失败:', error)
        ElMessage.error('发送消息失败，请重试')
        this.loading = false
        this.streaming = false
        throw error
      }
    },

    // 取消当前流式请求
    cancelStream() {
      if (this.streamCancel) {
        this.streamCancel()
        this.streamCancel = null
        this.loading = false
        this.streaming = false
        return true
      }
      return false
    },
    
    // 暂停/继续响应生成
    toggleStreamPause() {
      if (this.streaming) {
        if (this.streamCancel) {
          this.streamCancel()
          this.streamCancel = null
          this.streaming = false
          return true
        }
      }
      return false
    },

    // 获取历史会话列表
    async getHistoryList() {
      try {
        const res = await regflowApi.getHistoryList()
        this.historyList = res.sessions || []
        return this.historyList
      } catch (error) {
        console.error('获取历史会话失败:', error)
        throw error
      }
    },

    // 加载历史会话
    async loadHistorySession(id) {
      if (this.sessionId === id) {
        return
      }
      
      // 取消之前的流
      this.cancelStream()
      
      this.loading = true
      try {
        const res = await regflowApi.getSessionDetail(id)
        this.sessionId = id
        this.messageList = res.messages || []
        return res
      } catch (error) {
        console.error('加载历史会话失败:', error)
        ElMessage.error('加载历史会话失败')
        throw error
      } finally {
        this.loading = false
      }
    },

    // 删除会话
    async deleteSession(id) {
      try {
        await regflowApi.deleteSession(id)
        ElMessage.success('删除成功')
        
        // 刷新历史列表
        await this.getHistoryList()
        
        // 如果删除的是当前会话，创建新会话
        if (this.sessionId === id) {
          // 取消之前的流
          this.cancelStream()
          await this.createNewSessionRealtime()
        }
      } catch (error) {
        console.error('删除会话失败:', error)
        ElMessage.error('删除会话失败')
        throw error
      }
    }
  }
}) 