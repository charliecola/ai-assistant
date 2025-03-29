import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import regflowApi from '@/api/regflow'

export const useAssistantStore = defineStore('assistant', {
  state: () => ({
    // 基本信息
    assistantName: '港湾',
    assistantAvatar: '/src/assets/avatar.png',
    
    // 当前会话状态
    currentCategory: '', // 当前选择的分类: talent, policy, education, faq
    
    // 常用模板
    templates: [
      { 
        id: 1, 
        content: '毕业于某某大学，取得某某职称，有哪些支持政策'
      },
      {
        id: 2,
        content: '如何申请人才认定？'
      },
      {
        id: 3,
        content: '子女入学政策有哪些？'
      }
    ],
    
    // 分类问题
    categoryQuestions: {
      talent: [
        '什么是人才认定？',
        '人才认定的条件有哪些？',
        '如何申请人才认定？',
        '人才认定的流程是什么？'
      ],
      policy: [
        '有哪些人才补贴政策？',
        '住房补贴政策是什么？',
        '税收优惠政策有哪些？',
        '科研经费支持政策是什么？'
      ],
      education: [
        '子女入学政策有哪些？',
        '国际学校申请条件是什么？',
        '公办学校直升通道如何申请？',
        '学费补贴政策是什么？'
      ],
      faq: [
        '如何查询申请进度？',
        '政策有效期是多久？',
        '政策是否可以叠加使用？',
        '如何申请政策变更？'
      ]
    }
  }),
  
  getters: {
    // 获取当前分类的问题
    currentCategoryQuestions: (state) => {
      if (!state.currentCategory) return []
      return state.categoryQuestions[state.currentCategory] || []
    }
  },
  
  actions: {
    // 设置当前分类
    setCategory(category) {
      this.currentCategory = category
    },
    
    // 添加模板
    addTemplate(content) {
      if (!content) return
      
      const existing = this.templates.find(t => t.content === content)
      if (existing) return
      
      const newId = Math.max(0, ...this.templates.map(t => t.id)) + 1
      this.templates.push({
        id: newId,
        content
      })
    },
    
    // 删除模板
    removeTemplate(id) {
      const index = this.templates.findIndex(t => t.id === id)
      if (index !== -1) {
        this.templates.splice(index, 1)
      }
    },
    
    // 选择问题并发送
    async selectAndSendQuestion(question) {
      // 这里可以集成现有的聊天功能
      // 例如调用chatStore.sendMessage(question)
      return question
    }
  }
}) 