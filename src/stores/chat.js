import { defineStore } from 'pinia'
import regflowApi from '@/api/regflow'
import { ElMessage } from 'element-plus'

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessionId: '',
    messageList: [],
    historyList: [],
    loading: false
  }),

  actions: {
    // 创建新会话
    async createNewSession() {
      this.loading = true
      try {
        const res = await regflowApi.createSession()
        this.sessionId = res.id
        this.messageList = []
        
        // 添加欢迎消息
        this.messageList.push({
          role: 'assistant',
          content: '你好！我是AI助手，有什么可以帮助你的吗？'
        })
        
        return res
      } catch (error) {
        console.error('创建会话失败:', error)
        ElMessage.error('创建会话失败')
        throw error
      } finally {
        this.loading = false
      }
    },

    // 发送消息
    async sendMessage(message) {
      if (!message.trim()) {
        ElMessage.warning('请输入消息内容')
        return
      }
      
      // 添加用户消息到列表
      this.messageList.push({
        role: 'user',
        content: message
      })
      
      // 发送请求
      this.loading = true
      try {
        const res = await regflowApi.sendMessage({
          sessionId: this.sessionId,
          message: message
        })
        
        // 添加AI回复
        if (res.choices && res.choices.length > 0) {
          this.messageList.push({
            role: res.choices[0].message.role,
            content: res.choices[0].message.content
          })
        }
        
        return res
      } catch (error) {
        console.error('发送消息失败:', error)
        ElMessage.error('发送消息失败，请重试')
        throw error
      } finally {
        this.loading = false
      }
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
          await this.createNewSession()
        }
      } catch (error) {
        console.error('删除会话失败:', error)
        ElMessage.error('删除会话失败')
        throw error
      }
    }
  }
}) 