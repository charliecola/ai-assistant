<template>
  <div class="chat-container">
    <!-- 聊天区域 -->
    <main class="chat-main" ref="chatContainerRef">
      <!-- 欢迎提示 -->
      <div class="welcome-box">
        <div class="welcome-content">
          <div class="welcome-tip">
            <el-tag type="warning" size="small" class="new-tag" effect="dark">New</el-tag>
            <div class="tip-content">
              我是港港，点击右侧图标可以和我互动哦！
            </div>
          </div>

          <div class="welcome-message">
            您好，我是您的人才政策智能助手，我将基于Deepseek为您提供各种人才政策问题的解答和帮助。
          </div>
        </div>

        <div class="avatar-container">
          <img src="@/assets/images/pic_ganggang.png" class="assistant-avatar" />
        </div>
      </div>

      <!-- 功能菜单 -->
      <div class="menu-container">
        <div v-for="item in menuItems" :key="item.key" class="menu-item"
          :class="{ active: currentCategory === item.key }" @click="selectMenu(item.key)">
          <div class="menu-icon">
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
          </div>
          <div class="menu-name">{{ item.name }}</div>
        </div>
      </div>

      <!-- 分类问题 -->
      <div class="question-list" v-if="currentCategory && currentCategoryQuestions.length > 0">
        <div class="question-list-title">推荐问题</div>
        <div class="question-items">
          <div v-for="(question, index) in currentCategoryQuestions" :key="index" class="question-item"
            @click="selectQuestion(question)">
            {{ question }}
          </div>
        </div>
      </div>

      <!-- 对话 -->
      <div class="message-list">
        <div v-for="(message, index) in messagesList" :key="index"
          :class="['message-item', message.role === 'user' ? 'user-message' : 'assistant-message']">
          <!-- 用户消息 -->
          <template v-if="message.role === 'user'">
            <div class="message-bubble user-bubble">
              {{ message.content }}
            </div>
          </template>

          <!-- 助手消息 -->
          <template v-else>
            <div class="assistant-message-container">
              <div class="message-bubble assistant-bubble">
                <div class="message-content"
                  :class="{ 'content-collapsed': message.hasOverflow && !message.isExpanded }">
                  <div v-html="renderMarkdown(message.content)"></div>
                  <div style="font-size: 13px; color: rgb(141, 141, 141);">
                    （如有其他不明之处，可在工作时间联系泉州市高层次人才服务中心
                    <a href="tel:0595-28133880" style="color: rgb(15, 121, 226);">0595-28133880</a>
                    ，或所在县（市、区）人才办。）
                  </div>
                </div>


                <!-- 展开/收起 -->
                <div v-if="message.hasOverflow" class="expand-action">
                  <el-link type="primary" :underline="false" @click="toggleExpand(message)">
                    {{ message.isExpanded ? '收起' : '展开' }}<el-icon class="el-icon--right">
                      <DArrowRight />
                    </el-icon>
                  </el-link>
                </div>

                <!-- 反馈按钮 -->
                <el-space :size="size" spacer="|" v-if="message.showFeedback" class="feedback-buttons">
                  <el-button class="feedback-button" type="primary" plain size="small" @click="submitFeedback(true)">
                    <svg t="1743242565776" class="icon" viewBox="0 0 1024 1024" version="1.1"
                      xmlns="http://www.w3.org/2000/svg" p-id="1592" width="16" height="16">
                      <path
                        d="M190.193225 471.411583c14.446014 0 26.139334-11.718903 26.139334-26.13831 0-14.44499-11.69332-26.164916-26.139334-26.164916-0.271176 0-0.490164 0.149403-0.73678 0.149403l-62.496379 0.146333c-1.425466-0.195451-2.90005-0.295735-4.373611-0.295735-19.677155 0-35.621289 16.141632-35.621289 36.114522L86.622358 888.550075c0 19.949354 15.96767 35.597753 35.670407 35.597753 1.916653 0 3.808746 0.292666 5.649674 0l61.022819 0.022513c0.099261 0 0.148379 0.048095 0.24764 0.048095 0.097214 0 0.146333-0.048095 0.24457-0.048095l0.73678 0 0-0.148379c13.413498-0.540306 24.174586-11.422144 24.174586-24.960485 0-13.55983-10.760065-24.441669-24.174586-24.981974l0-0.393973-50.949392 0 1.450025-402.275993L190.193225 471.409536z"
                        fill="#666666" p-id="1593"></path>
                      <path
                        d="M926.52241 433.948343c-19.283182-31.445176-47.339168-44.172035-81.289398-45.546336-1.77032-0.246617-3.536546-0.39295-5.380544-0.39295l-205.447139-0.688685c13.462616-39.059598 22.698978-85.58933 22.698978-129.317251 0-28.349675-3.193739-55.962569-9.041934-82.542948l-0.490164 0.049119c-10.638291-46.578852-51.736315-81.31498-100.966553-81.31498-57.264215 0-95.466282 48.15065-95.466282 106.126063 0 3.241834-0.294712 6.387477 0 9.532097-2.996241 108.386546-91.240027 195.548698-196.23636 207.513194l0 54.881958-0.785899 222.227314 0 229.744521 10.709923 0 500.025271 0.222057 8.746198-0.243547c19.35686 0.049119 30.239721-4.817726 47.803749-16.116049 16.682961-10.761088 29.236881-25.50079 37.490869-42.156122 2.260483-3.341095 4.028757-7.075139 5.106298-11.20111l77.018118-344.324116c1.056052-4.053316 1.348718-8.181333 1.056052-12.160971C943.643346 476.446249 938.781618 453.944769 926.52241 433.948343zM893.82573 486.837924l-82.983993 367.783411-0.099261-0.049119c-2.555196 6.141884-6.879688 11.596106-12.872169 15.427364-4.177136 2.727111-8.773827 4.351098-13.414521 4.964058-1.49812-0.195451-3.046383 0-4.620227 0l-477.028511-0.540306-0.171915-407.408897c89.323375-40.266076 154.841577-79.670527 188.596356-173.661202 0.072655 0.024559 0.124843 0.049119 0.195451 0.072655 2.99931-9.137101 6.313799-20.73423 8.697079-33.164331 5.551436-29.185716 5.258771-58.123792 5.258771-58.123792-4.937452-37.98001 25.940812-52.965306 44.364417-52.965306 25.304316 0.860601 50.263777 33.656541 50.263777 52.326762 0 0 5.600555 27.563776 5.649674 57.190537 0.048095 37.366026-4.6673 56.847729-4.6673 56.847729l-0.466628 0c-5.872754 30.879288-16.214287 60.138682-30.464849 86.964654l0.36839 0.342808c-2.358721 4.815679-3.709485 10.220782-3.709485 15.943111 0 19.922748 19.088754 21.742187 38.765909 21.742187l238.761895 0.270153c0 0 14.666024 0.465604 14.690584 0.465604l0 0.100284c12.132318-0.638543 24.221658 5.207605 31.100322 16.409738 5.504364 9.016351 6.437619 19.6045 3.486404 28.988218L893.82573 486.837924z"
                        fill="#666666" p-id="1594"></path>
                      <path
                        d="M264.827039 924.31872c0.319272 0.024559 0.441045 0.024559 0.295735-0.024559 0.243547-0.048095 0.367367-0.074701-0.295735-0.074701s-0.539282 0.026606-0.271176 0.074701C264.43409 924.343279 264.532327 924.343279 264.827039 924.31872z"
                        fill="#2f3447" p-id="1595"></path>
                    </svg>
                    <span>满意</span>
                  </el-button>

                  <el-button class="feedback-button" type="info" plain size="small" @click="submitFeedback(false)">
                    <svg t="1743242774367" class="icon" viewBox="0 0 1024 1024" version="1.1"
                      xmlns="http://www.w3.org/2000/svg" p-id="2603" width="16" height="16">
                      <path
                        d="M556.930612 929.959184c-27.167347 0-52.244898-8.881633-68.440816-25.6-26.644898-27.167347-38.138776-74.187755-50.155102-123.29796-6.791837-27.689796-14.628571-59.036735-22.465306-72.620408-21.942857-37.616327-68.963265-56.946939-82.546939-61.648979H257.044898c-27.167347 0-49.110204-21.942857-49.110204-49.110204v-397.061225c0-27.167347 21.942857-49.110204 49.110204-49.110204h71.57551c30.82449-16.195918 118.595918-56.946939 219.428572-56.946939h191.216326c31.346939 0 97.17551 11.493878 123.820408 55.902041C888.163265 191.216327 929.959184 512 929.959184 539.689796c0 60.081633-56.946939 106.579592-105.534694 106.579592h-125.910204c-4.179592 0-6.791837 2.612245-8.359184 3.657143-1.044898 1.567347-3.134694 4.702041-2.089796 8.881632 4.702041 21.420408 14.628571 77.844898 7.314286 137.404082-7.314286 61.126531-43.885714 108.669388-97.17551 126.432653-13.583673 5.22449-27.689796 7.314286-41.27347 7.314286zM257.044898 192.783673c-4.179592 0-7.314286 3.134694-7.314286 7.314286v397.061225c0 4.179592 3.134694 7.314286 7.314286 7.314285h83.069388l3.134694 1.044898c12.538776 4.179592 76.8 28.212245 108.146938 81.502041 10.971429 18.808163 18.808163 50.155102 27.167347 83.591837 10.44898 43.885714 20.897959 85.159184 39.706123 103.967347 13.583673 13.583673 40.75102 17.240816 66.873469 8.359184 37.616327-12.538776 63.738776-47.020408 68.963265-91.951021 4.702041-37.093878 2.089796-83.069388-6.791836-123.820408-3.134694-15.673469 0.522449-31.346939 10.448979-43.885714 9.926531-12.538776 24.555102-19.330612 40.751021-19.330613h125.910204c28.212245 0 63.738776-30.302041 63.738775-64.783673 0-42.840816-44.930612-340.636735-60.604081-368.326531-14.628571-24.555102-60.604082-35.526531-88.293878-35.52653h-191.216326c-96.653061 0-180.767347 41.273469-204.277551 54.334694l-4.702041 2.612244H257.044898z"
                        fill="#333333" p-id="2604"></path>
                      <path
                        d="M114.938776 629.55102c-11.493878 0-20.897959-9.404082-20.89796-20.897959v-428.408163c0-11.493878 9.404082-20.897959 20.89796-20.897959s20.897959 9.404082 20.897959 20.897959v428.408163c0 11.493878-9.404082 20.897959-20.897959 20.897959z"
                        fill="#2f3447" p-id="2605"></path>
                    </svg>
                    <span>不满意</span>
                  </el-button>
                </el-space>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 相关政策文件 -->
      <el-card class="policy-files-section" v-show="policyFiles.length > 0 && !loading && messagesList.length > 0">
        <template #header>
          <div class="section-header">
            <span class="section-title">相关政策文件</span>
          </div>
        </template>
        <div class="policy-files-list">
          <div v-for="(file, index) in policyFiles" :key="index" class="policy-file-item">
            <el-link :href="file.url" type="primary" class="file-link">
              <span class="file-title">{{ file.title }}</span>
              <el-icon class="arrow-icon">
                <ArrowRight />
              </el-icon>
            </el-link>
          </div>
        </div>
      </el-card>

      <!-- 加载中 -->
      <!-- <div v-if="loading" class="chat-loading">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
      </div> -->
    </main>

    <!-- 底部咨询区域 -->
    <footer class="chat-footer">
      <!-- 咨询模板区域 -->
      <div class="consult-area">
        <div class="consult-label">咨询模板：<span class="template-text">毕业于某某大学，取得某某职称，有哪些支持政策</span></div>
      </div>

      <!-- 输入区域 -->
      <div class="input-container">
        <el-dropdown @command="handleCommand">
          <span class="el-dropdown-link drop-color">
            咨询方向
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="a">人才政策</el-dropdown-item>
              <el-dropdown-item command="b">找工作</el-dropdown-item>
              <el-dropdown-item command="c">绿色通道</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div class="trash-icon" @click="clearInput">
          <el-icon>
            <Delete />
          </el-icon>
        </div>
        <el-input v-model="inputMessage" class="message-input" placeholder="请输入关键词" @keydown="handleKeyDown"
          size="medium" />
        <div class="voice-button" @click="sendMessage">
          <el-icon v-if="!loading">
            <Microphone />
          </el-icon>
          <el-icon v-else class="is-loading">
            <Loading />
          </el-icon>
        </div>
      </div>
    </footer>

    <!-- 历史会话抽屉 -->
    <el-drawer v-model="showHistoryDrawer" title="历史会话" direction="rtl" size="300px">
      <div class="history-list">
        <div v-if="historyList.length === 0" class="empty-history">
          暂无历史会话
        </div>

        <el-card v-for="item in historyList" :key="item.id" class="history-item" shadow="hover"
          :class="{ active: sessionId === item.id }">
          <div class="history-content" @click="loadHistorySession(item.id)">
            <div class="history-title">{{ item.title || '未命名会话' }}</div>
            <div class="history-time">{{ new Date(item.createTime).toLocaleString() }}</div>
          </div>
          <div class="history-delete">
            <el-button type="danger" circle plain size="small" @click.stop="deleteSession(item.id)">
              <el-icon>
                <Delete />
              </el-icon>
            </el-button>
          </div>
        </el-card>
      </div>
    </el-drawer>
    <el-dialog v-model="dialogVisible" title="删除确认" width="500" :before-close="handleClose">
      <span>是否确认删除历史记录！</span>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="deleteSubmit">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useAssistantStore } from '@/stores/assistant'
import { ElDialog } from 'element-plus'
import { marked } from 'marked'
// 使用store
const chatStore = useChatStore()
const assistantStore = useAssistantStore()

// 会话状态
const messageList = computed(() => chatStore.messageList)
const loading = computed(() => chatStore.loading)
const sessionId = computed(() => chatStore.sessionId)
const historyList = computed(() => chatStore.historyList)

// 助手模板
const templates = computed(() => assistantStore.templates)
const currentCategory = computed(() => assistantStore.currentCategory)
const currentCategoryQuestions = computed(() => assistantStore.currentCategoryQuestions)

const inputMessage = ref('')
const chatContainerRef = ref(null)
const showHistoryDrawer = ref(false)

const dialogVisible = ref(false)

// 配置marked选项
marked.setOptions({
  breaks: true, // 将\n转换为<br>
  gfm: true,    // 使用GitHub风格的Markdown
  headerIds: true, // 为标题生成ID
  mangle: false, // 不对链接地址进行编码
  sanitize: false, // 不进行HTML标签过滤（注意：如果允许用户输入Markdown，应启用此选项防止XSS）
})

// 渲染Markdown
const renderMarkdown = (content) => {
  if (!content) return ''
  try {
    return marked(content)
  } catch (error) {
    console.error('Markdown解析错误:', error)
    return content
  }
}

// 使用 computed 属性从 chatStore 中获取消息列表并附加必要的属性
const messagesList = computed(() => {
  return messageList.value.map(msg => ({
    ...msg,
    showFeedback: msg.role === 'assistant',
    isExpanded: false,
    hasOverflow: false // 初始设为 false，将通过 checkMessageOverflow 更新
  }))
})

// 定义 el-space 组件的 size 属性
const size = ref('small')

// 相关政策文件
const policyFiles = ref([
  {
    title: '第三层次',
    url: '#'
  },
  {
    title: '第二层次',
    url: '#'
  },
  {
    title: '第三层次人才认定标准',
    url: '#'
  }
])

// 菜单项
const menuItems = [
  { icon: 'User', name: '人才认定', key: 'talent' },
  { icon: 'Notebook', name: '人才政策', key: 'policy' },
  { icon: 'School', name: '子女教育', key: 'education' },
  { icon: 'QuestionFilled', name: '常见问题', key: 'faq' }
]

const handleCommand = (command) => {
  console.log(command)
}

// 初始化
onMounted(async () => {
  try {
    if (!window.sessionStorage.getItem('sessionId')) {
      // 使用新的实时流处理方式创建会话
      await chatStore.createNewSessionRealtime()
      // 滚动到底部
      await nextTick()
      scrollToBottom()
    }

  } catch (error) {
    console.error('初始化失败:', error)
  }
})

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) {
    return
  }

  const message = inputMessage.value.trim()
  inputMessage.value = ''

  // 将用户消息添加到消息列表
  const userMessage = {
    role: 'user',
    content: message
  }

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 发送到API
  try {
    // 使用聊天store发送消息
    await chatStore.sendMessage(message)

    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
  }
}

// 加载历史会话
const loadHistorySession = async (id) => {
  if (sessionId.value === id) {
    showHistoryDrawer.value = false
    return
  }

  await chatStore.loadHistorySession(id)
  showHistoryDrawer.value = false

  // 滚动到底部
  await nextTick()
  scrollToBottom()
}

// 删除会话
const deleteSession = async (id) => {
  await chatStore.deleteSession(id)
}

// 选择菜单
const selectMenu = (key) => {
  assistantStore.setCategory(key)

  // 自动填充该分类的第一个问题
  if (assistantStore.categoryQuestions[key] && assistantStore.categoryQuestions[key].length > 0) {
    inputMessage.value = assistantStore.categoryQuestions[key][0]
  }
}

// 选择问题
const selectQuestion = (question) => {
  inputMessage.value = question
}

// 滚动到底部
const scrollToBottom = () => {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

// 按Enter键发送消息
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// 使用模板
const useTemplate = (template) => {
  inputMessage.value = template.content
}
// 清空输入
const clearInput = async () => {
  dialogVisible.value = true
}
const handleClose = () => {
  dialogVisible.value = false
}
const deleteSubmit = async () => {
  await chatStore.createNewSessionRealtime()
  await nextTick()
  scrollToBottom()
  dialogVisible.value = false
}
// 反馈
const submitFeedback = (isPositive) => {
  console.log('Feedback:', isPositive ? 'positive' : 'negative')
}

// 展开全文
const toggleExpand = (message) => {
  message.isExpanded = !message.isExpanded
}

// 注册一个DOM更新后的钩子，用于检测消息内容是否超出高度限制
onMounted(() => {
  nextTick(() => {
    checkMessageOverflow()
    window.addEventListener('resize', checkMessageOverflow)
  })
})

// 检查消息是否超出高度限制
const checkMessageOverflow = () => {
  const messageContents = document.querySelectorAll('.message-content')
  messageContents.forEach((content, index) => {
    // 只处理助手消息
    if (messagesList.value[index] && messagesList.value[index].role === 'assistant') {
      const scrollHeight = content.scrollHeight
      const clientHeight = content.clientHeight
      messagesList.value[index].hasOverflow = scrollHeight > 182
    }
  })
}
</script>



<style scoped lang="scss">
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 100%;
  background: linear-gradient(180deg, #e8f4ff 0%, #c6e0ff 100%);
  position: relative;
  overflow: hidden;
}

// Markdown内容样式
:deep(.message-content) {

  /* Markdown内容的样式 */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 16px;
    margin-bottom: 8px;
    font-weight: 600;
    line-height: 1.25;
  }

  h1 {
    font-size: 20px;
  }

  h2 {
    font-size: 18px;
  }

  h3 {
    font-size: 16px;
  }

  p {
    margin-top: 8px;
    margin-bottom: 8px;
  }

  ul,
  ol {
    padding-left: 20px;
    margin-top: 8px;
    margin-bottom: 8px;
  }

  li {
    margin-bottom: 4px;
  }

  code {
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 3px;
    font-family: monospace;
    padding: 0.2em 0.4em;
  }

  pre {
    background-color: #f6f8fa;
    border-radius: 6px;
    padding: 16px;
    overflow: auto;
    margin-top: 8px;
    margin-bottom: 8px;
  }

  pre code {
    background-color: transparent;
    padding: 0;
  }

  blockquote {
    border-left: 4px solid #dfe2e5;
    color: #666;
    padding-left: 16px;
    margin-left: 0;
    margin-top: 8px;
    margin-bottom: 8px;
  }

  a {
    color: #0366d6;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 8px;
    margin-bottom: 8px;
  }

  table th,
  table td {
    border: 1px solid #dfe2e5;
    padding: 6px 13px;
  }

  table th {
    background-color: #f6f8fa;
  }

  img {
    max-width: 100%;
    height: auto;
  }
}

.chat-main {
  overflow-y: auto;
  padding: 13px;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  height: calc(100vh - 100px - 13px);
  box-sizing: border-box;

  /* 隐藏滚动条但保留滚动功能 */
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}

/* 为Webkit浏览器(Chrome、Safari等)隐藏滚动条 */
.chat-main::-webkit-scrollbar {
  display: none;
}

/* 欢迎提示 */
.welcome-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  border-radius: 15px;
}

.welcome-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 70%;
  margin: 15px 10px 0px;
}

.welcome-tip {
  background-color: #4285f4;
  color: white;
  padding: 15px;
  border-radius: 15px;
  position: relative;
  width: 200px;
  box-sizing: border-box;
  background: url('@/assets/images/welcome-tip.png') no-repeat center center;
  background-size: 100% 100%;
}

.new-tag {
  position: absolute;
  top: -10px;
  left: 10px;
  background-color: #ff9500;
  color: white;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
}

.tip-content {
  margin-top: 5px;
}

.avatar-container {
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.assistant-avatar {
  width: 6rem;
  /* height: 100%;
  object-fit: contain; */
}

/* 欢迎语 */
.welcome-message {
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  font-size: 16px;
  color: rgb(97, 115, 142);
  line-height: 28px;
}

/* 功能菜单 */
.menu-container {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
  background-color: white;
  border-radius: 15px;
  padding: 15px 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  width: 22%;
}

.menu-item:hover {
  transform: translateY(-3px);
}

.menu-item.active .menu-icon {
  background-color: #ff9500;
}

.menu-icon {
  width: 45px;
  height: 45px;
  background-color: #4285f4;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
  color: white;
  font-size: 20px;
}

.menu-name {
  font-size: 13px;
  color: #333;
  text-align: center;
}

/* 分类问题 */
.question-list {
  background-color: white;
  border-radius: 15px;
  padding: 15px;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}

.question-list-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  font-size: 14px;
}

.question-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-item {
  background-color: #f0f6ff;
  color: #4285f4;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
}

/* 消息列表 */
.message-list {
  /* margin-top: 20px; */
  width: 100%;
}

.message-item {
  margin-bottom: 10px;
  width: 100%;
}

.user-message {
  display: flex;
  justify-content: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 15px;
  font-size: 15px;
  line-height: 1.5;
  /* max-width: 85%; */
  /* word-break: break-word; */
}

.user-bubble {
  background-color: #4285f4;
  color: white;
  border-top-right-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.assistant-message-container {
  width: 100%;
}

.assistant-bubble {
  background-color: white;
  color: #333;
  /* border-top-left-radius: 5px; */
  border-radius: 0 15px 15px 15px;
  /* 只保留右上角和底部圆角 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 消息内容 */
.message-content {
  // white-space: pre-wrap;
  /* 保留空格和换行 */
  word-break: break-word;
  width: 100%;
  overflow: hidden;
  line-height: 1.5;
  font-size: 16px;
}

.content-collapsed {
  max-height: 182px;
  overflow: hidden;
  position: relative;
}

/* 展开/收起 */
.expand-action {
  margin-top: 10px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: rgb(57, 154, 255);
}

.expand-action .el-icon {
  margin-left: 4px;
  font-size: 15px;
  transform: rotate(90deg);
}

/* 当内容收起时，添加一个渐变效果 */
.content-collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1));
  pointer-events: none;
}

/* 反馈按钮 */
.feedback-buttons {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
  gap: 7px;
  border-top: 1px solid rgb(238, 238, 238);
}

.feedback-button {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  padding: 0;
}

.feedback-button .el-icon {
  font-size: 16px;
}

.feedback-button:hover {
  color: #4285f4;
}

/* 相关政策文件 */
.policy-files-section {
  background-color: white;
  padding: 0;
  /* 移除内边距 */
  width: 100%;
  box-sizing: border-box;
  /* margin: 20px 0; */
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border-radius: 0 15px 15px 15px;
  /* 只保留右上角和底部圆角 */
}

.section-header {
  padding: 10px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.policy-files-list {
  display: flex;
  flex-direction: column;
  padding: 0 16px 16px;
}

.policy-file-item {
  border-bottom: 1px solid #f0f0f0;
}

.policy-file-item:last-child {
  border-bottom: none;
}

.file-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin: 15px 20px;
  text-decoration: none;

  margin: 0px;
  padding: 10px;
  border-bottom: 1px solid rgb(238, 238, 238);
  background: rgba(250, 250, 250, 0.6) !important;
  color: #989798 !important;
  cursor: pointer;
  font-size: 16px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-link:hover {
  background-color: #f9f9f9;
}

.file-title {
  color: #666;
}

.arrow-icon {
  color: #ccc;
  font-size: 16px;
}

/* 移除链接样式 */
:deep(.el-link) {
  text-decoration: none;
  --el-link-font-size: 15px;
  /* 覆盖Element Plus默认的链接字体大小 */
  font-size: 15px;
  /* 直接设置字体大小 */
}

:deep(.el-link:hover) {
  text-decoration: none;
}

:deep(.el-link .el-link--inner) {
  color: #666;
  font-size: 15px;
  /* 确保内部文本大小也是15px */
}

/* 覆盖 Element Plus 默认链接样式 */
:deep(.el-link.el-link--primary) {
  --el-link-text-color: inherit;
  --el-link-hover-text-color: inherit;
  --el-link-disabled-text-color: inherit;
  color: #666 !important;
}

:deep(.el-link.el-link--primary:hover) {
  color: #4285f4 !important;
}

:deep(.el-card__header) {
  padding: 0;
}

:deep(.el-card__body) {
  padding: 0;
}

/* 底部区域 */
.chat-footer {
  padding: 0;
  width: 100%;
  box-sizing: border-box;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: #f5f5f5;
}

/* 咨询模板区域 */
.consult-area {
  background-color: #f5f5f5;
  padding: 10px 15px 5px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e0e0e0;

  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.consult-label {
  color: #666;
  font-size: 13px;
  margin-bottom: 5px;
}

.template-text {
  color: #4285f4;
  font-size: 14px;
  padding: 5px 0;
  /* white-space: nowrap; */
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 输入框区域 */
.input-container {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  padding: 0 15px 5px;
  width: 100%;
  box-sizing: border-box;

  .drop-color {
    color: #4285f4;
  }
}

.trash-icon {
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: #000000;
  font-size: 25px;
  margin: 0 10px;
}

.message-input {
  flex: 1;
}

:deep(.el-input__wrapper) {
  box-shadow: none !important;
  background-color: white;
  border-radius: 10px;
  height: 40px;
}

.voice-button {
  height: 38px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #000;
  cursor: pointer;
  font-size: 25px;
  padding-left: 10px;
}

/* 加载状态 */
.chat-loading {
  text-align: center;
  margin: 15px 0;
  color: #4285f4;
  font-size: 24px;
}

.el-avatar.user {
  background-color: #4285f4;
}

.el-avatar.assistant {
  background-color: #5fc467;
}

:deep(.el-button:focus),
:deep(.el-button:active) {
  outline: none !important;
  box-shadow: none !important;
  border-color: transparent !important;
}

:deep(.el-dialog) {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  margin: 0 !important;
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  max-height: calc(100% - 30px);
  max-width: calc(100% - 30px);
}
</style>
