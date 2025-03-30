<template>
  <div class="avatarTalk-container">
    <!-- 加载指示器 -->
    <div v-if="isLoading" class="loading-indicator">
      <div class="three-bounce">
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
      </div>
    </div>

    <!-- 欢迎屏幕 -->
    <div v-if="showWelcome && !isChatActive" class="welcome-screen" @click="activateChat">
      点击开启对话
    </div>
    <!-- 聊天界面 -->
    <div v-if="isChatActive" class="chat-interface">
      <div class="chat-background"></div>
      <div ref="chatContainer" class="chat-container"></div>
      <div class="input-container">
        <div class="mic-button">
          <div class="mic-icon">
            <img
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAABMCAMAAAD+4N92AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////////VXz1bAAAAAJ0Uk5T/wDltzBKAAAAyElEQVR42uzXSw7CMAwE0Jn7X5pNEfibaaAqSO7S9VOqxI5csHhwPNXrFtUSK1VICCyDUFgCIbEIobEAv+QAEV7v0DiMGzdu3P3OBBWXBQWHf3Y8uy3Cgi6BW47OUfzMl1ss6MvEO8pOgqEqo+vmHuPiCFc1wlsA5kwymHTZs//SFgsRk2VdNW3GJFCELgXUYKi3biOyfXL3UjvDoXbLM/Nh7Q6MZ6nenv4wqcML5s/tuXz//0Gpg9KRi3od93tus48w7nP3EGAARBwIOtsmYdcAAAAASUVORK5CYII="
              alt="Microphone"
            />
          </div>
        </div>

        <div class="message-input-area">
          <input
            type="text"
            class="message-input"
            v-model="userMessage"
            @keyup.enter="sendMessage"
          />
          <div class="send-button" @click="sendMessage">
            <img
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIIAAACCCAMAAAC93eDPAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////////VXz1bAAAAAJ0Uk5T/wDltzBKAAAB/UlEQVR42uzbXZLjIAxF4XP3v+mZ6oeu+WliIV0hxxUtgHx2sACpQJPB7xDDgC/ENGCMALME/o55AMOA4wT+Dx0lwDABhgksBWcIrOMMgdeCfgLMEriKbgIhQSMBZgkQFvQQYJjAnsBPeP2b/YTLp+4mkBIYCWwK3ITQ3FvsGDmXBukjkBIYCVQFRUI8BdFD2EmCa0GBQEVgIGyuA9gJOAUZAnVBiQBuwSYBjyBPoEWwQUgBjAQwCjIEOgURAmbBLgG6BRcEGgRbBFoEG4QiICxYEaBLECRQF8Rfwk8EOgUBApwW/EOgW3BFcAFEjgBDAuEBRF/mksCkQDgA4QnlTYPL/fAEQTWBTgq6CGVBeTpu1rtWH+UhwStCHuEQfCfoMkBUCYXTSlEg0h+HGgh7CJtAJNNErgcUIez1U3arn0FCZryS4MdN/O5w+Amb611RsDzQeQUpQvxc3EhQbKyy4HV9wSUoEJa9HKfgutZkEFQJ6haEin5FgYNg6k37CS5BnsAbEdRFYJzAOMEp6O7QdRG8gjcl8F4Ezf8R8wQ9mCCroDc7Ppwgo6B1sZ4nqJmgD6FU6Tx4jpgn6ARBH0KmIdlB0J0JOkbQDQiqC55A0E0JOkvQDQgqCh5C0A0IKgkeQ6jdF34MoXRv23Vd50P406BBgu5C0ChBWcIvAQYAfPUqTvGCwZ4AAAAASUVORK5CYII="
              alt="Send"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 录音指示器 -->
    <div v-if="isRecording" class="recording-overlay">
      <div class="loading-spinner"></div>
      <div class="recording-timer">录音中({{ recordingTime }})s</div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import axios from 'axios'
import MarkdownIt from 'markdown-it'
import { EventSourcePolyfill } from 'event-source-polyfill'
import avatarImage from '@/assets/images/avatar.png'
import userImage from '@/assets/images/user.png'

import { useTTS } from '@/hooks/use-tts.js'

export default {
  name: 'ChatbotWithAvatar',

  setup() {
    const fullResponse = ref('')

    const { startTTS, stopTTS } = useTTS(fullResponse)
    // 路由和查询参数
    const route = useRoute()
    const robotKey = ref(route.query.robotKey || 'e7a1858e8d6541f892f5e65521060b3c')

    // 状态管理
    const isLoading = ref(false)
    const showWelcome = ref(true)
    const isChatActive = ref(false)
    const userMessage = ref('')
    const isListening = ref(false)
    const isRecording = ref(false)
    const recordingTime = ref(0)
    const showFAQ = ref(false)
    const isMicActive = ref(false)
    const isAvatarIdle = ref(true)

    // DOM引用
    const canvasContainer = ref(null)
    const chatContainer = ref(null)
    const faqPanel = ref(null)

    // 3D场景引用
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    )
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    const controls = new OrbitControls(camera, renderer.domElement)
    let mixer = null
    let idleAnimation = null
    let talkingAnimation = null
    let specialAnimation = null
    let morphTargetDictionary = null

    // 音频
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const audioElement = new Audio()
    let audioStream = null
    let mediaRecorder = null
    let audioChunks = []

    // 常见问题数据
    const faqItems = ref([
      {
        question: "青年人才'新八条'政策有哪些变化？",
        answer: '突出用人单位主体作用，增设用人单位审核环节...',
      },
      {
        question: '高层次人才对学前教育阶段入学有什么优惠政策？',
        answer: '学前教育阶段，市级认定的第一、第二层次人才...',
      },
      {
        question: "本政策（青年人才'新八条'）所指民营企业和民办非企业单位是什么？",
        answer: '民营企业，是指登记注册地在我市的私营企业...',
      },
      {
        question: '怎么申报高层次人才？',
        answer: "请登录泉州市高层次人才'一站式'服务系统...",
      },
      {
        question: '如何申报高层次人才团队？',
        answer: "泉州市高层次人才团队评审采取'网上审核作业+专家评审'方式确认...",
      },
    ])

    // Markdown解析器
    const md = new MarkdownIt({
      html: false,
      linkify: true,
      typographer: true,
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre><code class="hljs">${
              hljs.highlight(str, {
                language: lang,
                ignoreIllegals: true,
              }).value
            }</code></pre>`
          } catch (e) {}
        }
        return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`
      },
    })

    // 设置为响应式引用
    const avatarImageUrl = ref(avatarImage)
    const userImageUrl = ref(userImage)

    // 初始化聊天
    const activateChat = () => {
      isChatActive.value = true
      showWelcome.value = false
      // 初始问候语
      const greeting =
        '您好，我是港港，您的专属A I人才政策咨询助手，我已接入前沿的Deepseek模型，有问题尽管问我！'
      setTimeout(() => {
        addBotGreeting(greeting)
        startTTS()
        fullResponse.value = greeting
      }, 500)
    }

    // 添加机器人欢迎消息
    const addBotGreeting = (message) => {
      const formattedMessage = md.render(message)
      const html = `<div class="message">
          <span class="message-avatar">
            <img src="${avatarImageUrl.value}" class="assistant-avatar" />
    </span>
          <div class="message-content">
            <div class="message-bubble message-bubble-left">
              <p>${formattedMessage}</p>
    </div> 
          </div>
        </div>`

      chatContainer.value.innerHTML += html
      scrollToBottom()
    }

    // 添加机器人思考中消息
    const addThinkingMessage = (messageId) => {
      const html = `<div class="message">
          <span class="message-avatar">
            <img src="${avatarImageUrl.value}" class="assistant-avatar" />
    </span>
          <div class="message-content">
            <div class="message-bubble message-bubble-left">
              <p class="thinking" id="${messageId}">思考中...</p>
    </div>  
          </div>
        </div>`

      chatContainer.value.innerHTML += html
      scrollToBottom()
    }

    // 添加用户消息
    const addUserMessage = (message) => {
      message = md.render(message)

      const messageElement = ` <div class="message message-right">
            <span class="message-avatar-right">
              <img src="${userImageUrl.value}" class="assistant-avatar" />
    </span>
            <div class="message-content">
              <div class="message-bubble message-bubble-right">
                <p>
                ${message}
                </p>
    </div>  
            </div>
          </div>`

      chatContainer.value.innerHTML += messageElement
      scrollToBottom()
    }

    // 添加机器人回复
    const addBotResponse = (message) => {
      const formattedMessage = md.render(message)
      const html = `<div class="message">
          <span class="message-avatar">
            <img src="${avatarImageUrl.value}" class="assistant-avatar" />
    </span>
          <div class="message-content">
            <div class="message-bubble message-bubble-left">
              <p>${formattedMessage}</p>
    </div>  
          </div>
        </div>`

      chatContainer.value.innerHTML += html
      scrollToBottom()
    }
    const scrollToBottom = () => {
      nextTick(() => {
        if (chatContainer.value) {
          chatContainer.value.scrollTop = chatContainer.value.scrollHeight
        }
      })
    }
    // 语音录制
    const startRecording = () => {
      isRecording.value = true
      recordingTime.value = 10

      const timer = setInterval(() => {
        recordingTime.value--
        if (recordingTime.value <= 0) {
          stopRecording()
          clearInterval(timer)
        }
      }, 1000)
    }

    const stopRecording = () => {
      isRecording.value = false
      // 处理录制的音频...
    }

    // 语音识别
    const startListening = () => {
      if (isWeChatBrowser()) {
        setupWeChatRecording()
      } else {
        setupWebRecording()
      }
    }

    const isWeChatBrowser = () => {
      return /micromessenger/i.test(navigator.userAgent.toLowerCase())
    }

    const setupWeChatRecording = async () => {
      try {
        const response = await axios.get(
          `https://chatpal.top/prod-api/wx/getSignature?url=${encodeURIComponent(
            window.location.href.split('#')[0]
          )}&robotKey=${robotKey.value}`
        )

        if (response.data.code === 200) {
          const data = response.data.data
          wx.config({
            debug: false,
            appId: data.appId,
            timestamp: data.timestamp,
            nonceStr: data.nonceStr,
            signature: data.signature,
            jsApiList: [
              'openLocation',
              'startRecord',
              'stopRecord',
              'translateVoice',
              'hideMenuItems',
            ],
          })

          isListening.value = true
          recordingTime.value = 10

          const timer = setInterval(() => {
            recordingTime.value--
            if (recordingTime.value <= 0) {
              stopWeChatRecording()
              clearInterval(timer)
            }
          }, 1000)

          wx.startRecord()
        }
      } catch (error) {
        console.error('微信录音设置失败:', error)
      }
    }

    const setupWebRecording = () => {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          audioStream = stream
          isListening.value = true
          recordingTime.value = 10

          const timer = setInterval(() => {
            recordingTime.value--
            if (recordingTime.value <= 0) {
              stopWebRecording()
              clearInterval(timer)
            }
          }, 1000)

          // 初始化媒体录制器
          mediaRecorder = new MediaRecorder(stream)
          mediaRecorder.start()

          mediaRecorder.ondataavailable = (e) => {
            audioChunks.push(e.data)
          }

          mediaRecorder.onstop = () => {
            processAudioRecording()
          }
        })
        .catch((error) => {
          console.error('访问麦克风出错:', error)
        })
    }

    const stopWeChatRecording = () => {
      wx.stopRecord({
        success: (res) => {
          const localId = res.localId
          processWeChatAudio(localId)
        },
        fail: (err) => {
          console.error('微信录音失败:', err)
        },
      })
    }

    const stopWebRecording = () => {
      if (mediaRecorder) {
        mediaRecorder.stop()
        audioStream.getTracks().forEach((track) => track.stop())
      }
      isListening.value = false
    }

    const processWeChatAudio = (localId) => {
      wx.translateVoice({
        localId: localId,
        isShowProgressTips: 1,
        success: (res) => {
          if (res.translateResult) {
            userMessage.value = res.translateResult
            isMicActive.value = false
          }
        },
        fail: (err) => {
          console.error('微信语音翻译失败:', err)
        },
      })
    }

    const processAudioRecording = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      audioChunks = []

      try {
        const formData = new FormData()
        formData.append('file', audioBlob)

        const response = await axios.post('https://chatpal.top/speech-api/asr/file', formData)

        if (response.data.code === 0 && response.data.result.text) {
          userMessage.value = response.data.result.text
          isMicActive.value = false
        }
      } catch (error) {
        console.error('音频处理失败:', error)
      }
    }

    const createMorphTargetAnimation = (blendData, dictionary, targetName) => {
      // 创建变形目标动画的实现
      // ...
    }

    const playAudio = (filename) => {
      audioElement.src = `./mp3/${filename}`
      audioElement.load()
      audioElement.play()
    }

    // 常见问题处理
    const toggleFAQ = () => {
      showFAQ.value = !showFAQ.value
    }

    const selectFAQItem = (index) => {
      showFAQ.value = false
      const question = faqItems.value[index].question
      const answer = faqItems.value[index].answer

      addUserMessage(question)
      setTimeout(() => {
        addBotResponse(answer)
      }, 1000)
    }

    // 发送消息
    const sendMessage = () => {
      stopTTS()
      fullResponse.value = ''
      if (userMessage.value.trim() === '') return

      addUserMessage(userMessage.value)
      sendToChatAPI(userMessage.value)
      userMessage.value = ''
    }

    // 聊天API集成
    const sendToChatAPI = async (message) => {
      const sessionId = generateSessionId()
      const apiUrl = 'https://chatpal.top/ai-chat-api'
      const messageId = generateMessageId()

      addThinkingMessage(messageId)

      // 准备要发送的JSON数据
      const requestData = {
        query: message,
        knowledge_base_name: 'e7a1858e8d6541f892f5e65521060b3c',
        top_k: 3,
        score_threshold: 1,
        history: [], // 可以根据需要添加历史消息
        stream: true,
        model_name: 'zhipu-api',
        temperature: 0.7,
        prompt_name: 'default',
        local_doc_url: false,
      }

      try {
        // 发起fetch请求
        const response = await fetch(`${apiUrl}/chat/knowledge_base_chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        // 获取响应的reader来处理流
        const reader = response.body.getReader()
        fullResponse.value = ''
        let isFirstResponse = true
        let isSparkChain = true
        // 文本解码器，用于将二进制数据转为文本
        const decoder = new TextDecoder('utf-8')

        // 处理流数据
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          // 解码接收到的数据
          const chunk = decoder.decode(value, { stream: true })
          // 处理接收到的数据块
          // 注意：根据你的API返回格式可能需要调整此部分
          // 假设每个数据块是一个完整的JSON字符串
          try {
            // 处理可能包含多个JSON对象的文本(用换行符分隔)
            const lines = chunk.split('\n').filter((line) => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data:')) {
                const jsonStr = line.substring(5).trim()
                const data = JSON.parse(jsonStr)

                if (data.docs && isFirstResponse) {
                  // 第一个响应包含文档的特殊处理
                  data.answer =
                    '如有其他不明之处，可在工作时间联系泉州市高层次人才服务中心0595-28133880，或所在县（市、区）人才办。'
                  isFirstResponse = false
                }

                if (data.answer) {
                  if (isSparkChain) {
                    setTimeout(() => {
                      startTTS()
                    }, 500)
                    isSparkChain = false
                  }
                  fullResponse.value += data.answer
                  // 用部分响应更新UI
                  const messageElement = document.getElementById(messageId)
                  if (messageElement) {
                    messageElement.innerHTML = md.render(fullResponse.value)
                    scrollToBottom()
                  }
                }
              }
            }
          } catch (error) {
            console.error('解析流数据出错:', error)
          }
        }
      } catch (error) {
        console.error('获取流式响应出错:', error)

        // 处理错误情况，更新UI
        const messageElement = document.getElementById(messageId)
        if (messageElement) {
          messageElement.innerHTML = '抱歉，获取回答时发生错误。'
          scrollToBottom()
        }
      }
    }

    const triggerSpecialResponse = (responseId) => {
      isAvatarIdle.value = false

      axios.get(`./json/${responseId}.json`).then((response) => {
        const { blendData, filename } = response.data[0]
        const clip = createMorphTargetAnimation(blendData, morphTargetDictionary, 'head')
        const action = mixer.clipAction(clip)

        action.setLoop(THREE.LoopRepeat)
        playAudio(filename)

        setTimeout(() => {
          if (specialAnimation) {
            specialAnimation.setEffectiveTimeScale(1.2)

            if (idleAnimation) idleAnimation.stop()
            if (talkingAnimation) talkingAnimation.stop()

            specialAnimation.loop = THREE.LoopOnce
            specialAnimation.reset().play()

            audioElement.play()
            action.play()
          }
        }, 500)
      })
    }

    // 工具函数
    const generateSessionId = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    const generateMessageId = () => {
      return `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    }

    // 初始化组件
    onMounted(() => {

      // 点击外部时关闭常见问题
      document.addEventListener('click', (event) => {
        if (
          faqPanel.value &&
          !faqPanel.value.contains(event.target) &&
          event.target.className !== 'mt-0'
        ) {
          showFAQ.value = false
        }
      })

      // 禁用右键点击
      window.oncontextmenu = () => false
    })

    return {
      // 引用
      canvasContainer,
      chatContainer,
      faqPanel,

      // 状态
      isLoading,
      showWelcome,
      isChatActive,
      userMessage,
      isListening,
      isRecording,
      recordingTime,
      showFAQ,
      isMicActive,
      faqItems,

      // 方法
      activateChat,
      startListening,
      stopRecording,
      sendMessage,
      toggleFAQ,
      selectFAQItem,
      startTTS,
      stopTTS,
    }
  },
}
</script>
  
<style lang="scss" >
/* 基础容器样式 */
.avatarTalk-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-image: url('@/assets/images/bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  .assistant-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50px;
  }
  .canvas-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  /* 加载和欢迎界面 */
  .loading-indicator {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(25, 25, 25, 0.3);
    z-index: 100;
  }

  .welcome-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
    cursor: pointer;
    z-index: 101;
  }

  /* 聊天界面 */
  .chat-interface {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 10;
  }

  .chat-background {
    position: absolute;
    z-index: 0;
    pointer-events: none;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 30vh;
    background-image: linear-gradient(to top, #000, #0000);
  }

  .chat-messages {
    position: absolute;
    z-index: 10;
    left: 0;
    bottom: 0;
    padding: 64px;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    overflow-y: scroll;
    width: 100%;
    max-height: 30v h;
    scrollbar-width: thin;
    background-image: linear-gradient(to top, #000, #0000);
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.5);
      border-radius: 20px;
    }
  }

  .avatar {
    flex: 0 0 48px;
    padding: 0 8px;

    &-image {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  }

  .message-content {
    //backdrop-filter: blur(4px);
    border-radius: 8px;
    font-size: 14px;
    color: #374151;
    word-break: break-all;
  }

  /* 输入区域 */
  .input-area {
    position: fixed;
    bottom: 0;
    left: 0;
    padding: 16px;
    width: 100%;
    display: flex;
    gap: 4px;
    z-index: 20;
  }

  .mic-button-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .icon {
    padding: 8px;
    width: 48px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }

  .recording-indicator {
    text-align: center;
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .text-input-container {
    display: flex;
    align-items: center;
    padding-left: 8px;
  }

  .message-input {
    width: 100%;
    flex: 1;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    padding: 8px;
    font-size: 18px;
    color: white;
    border: none;
    outline: none;
  }

  .send-button {
    padding: 8px;
    width: 48px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border-radius: 8px;
    background-color: rgba(75, 85, 99, 0.3);

    img {
      width: 24px;
    }
  }

  /* 快捷操作按钮 */
  .quick-actions {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 30;
    display: flex;
    gap: 16px;
  }

  .action-button {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    cursor: pointer;
    color: white;

    img {
      width: 24px;
      margin-right: 4px;
    }
  }

  /* 录音指示器 */
  .recording-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  .recording-timer {
    color: white;
    font-size: 24px;
    margin-top: 16px;
  }

  /* FAQ面板 */
  .faq-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 80%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 20002;
    overflow-y: auto;
  }

  .faq-content {
    padding: 16px;
  }

  .faq-header {
    margin-bottom: 16px;

    h1 {
      color: #f3f4f6;
    }
  }

  .faq-list {
    list-style: none;
    padding: 0;
  }

  .faq-item {
    padding: 8px 0;
    cursor: pointer;
    color: white;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .item-number {
    margin-right: 16px;
    color: #f59e0b;
  }

  /* 加载动画 */
  .three-bounce {
    display: flex;
    justify-content: center;
    align-items: center;

    > div {
      width: 18px;
      height: 18px;
      background-color: white;
      border-radius: 100%;
      display: inline-block;
      animation: sk-bouncedelay 1.4s infinite ease-in-out both;
    }

    .bounce1 {
      animation-delay: -0.32s;
    }

    .bounce2 {
      animation-delay: -0.16s;
    }
  }

  @keyframes sk-bouncedelay {
    0%,
    80%,
    100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }

  .loading-spinner {
    display: inline-block;
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
  }

  /* Container for the input area */
  .input-container {
    position: fixed;
    bottom: 0;
    left: 0;
    padding: 1rem;
    width: 100vw;
    display: flex;
    gap: 0.25rem;
    z-index: 20;
  }

  /* Microphone button section */
  .mic-button {
    //backdrop-filter: blur(4px);
    display: flex;
    overflow: hidden;
    min-width: 3.5rem;
    align-items: center;
    justify-content: center;
    border-radius: 0.75rem;
    background-color: rgba(243, 244, 246, 0.3);
    padding: 0.25rem;
    transition: all 0.3s ease;
    line-height: 1rem;
  }

  .mic-icon {
    padding: 0.5rem;
    width: 3rem;
    height: 2.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .mic-icon img {
    width: 17px;
    height: auto;
  }

  /* Message input section */
  .message-input-area {
    padding-left: 0.5rem;
    //backdrop-filter: blur(4px);
    border-radius: 0.75rem;
    background-color: rgba(243, 244, 246, 0.3);
    padding: 0.25rem;
    display: flex;
    transition: all 0.3s ease;
    line-height: 1rem;
    flex-grow: 1;
  }

  .message-input {
    width: 100%;
    flex: 1;
    background-color: transparent;
    border: none;
    font-size: 1.125rem;
    color: white;
    padding: 0.5rem;
    border-radius: 0.75rem;
    outline: none;
  }

  .message-input::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  /* Send button */
  .send-button {
    transition: all 0.3s ease;
    border-radius: 0.75rem;
    background-color: rgba(75, 85, 99, 0.6);
    padding: 0.5rem;
    width: 3rem;
    height: 2.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    img {
      width: 24px;
      height: auto;
    }
  }

  /* Hover and focus states */
  .send-button:hover {
    background-color: rgba(75, 85, 99, 0.8);
  }

  .message-input:focus {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .chat-container {
    position: absolute;
    z-index: 10;
    bottom: 4rem;
    left: 0;
    color: white;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    overflow-y: scroll;
    padding-top: 2.5rem;
    width: 100%;
    max-height: 30vh;

    .message {
      display: flex;
      padding: 0.25rem 0;
      width: 100%;

      &-right {
        flex-direction: row-reverse;
        justify-content: flex-start;
      }

      &-avatar {
        flex: 0 0 3rem;
        padding-right: 0.5rem;

        &-right {
          padding-right: 0;
          padding-left: 0.5rem;
        }
      }

      &-content {
        padding-top: 0.25rem;
      }

      &-bubble {
        padding: 0.25rem 0.5rem;
        color: #333;
        border-radius: 0.25rem;
        word-break: break-all;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        font-size: 0.875rem;
        line-height: 1.25rem;
        //backdrop-filter: blur(4px);

        &-left {
          background-color: rgba(224, 242, 254, 0.8);
          margin-right: 3rem;
        }

        &-right {
          margin-left: 3rem;
          background-color: rgba(224, 242, 254, 0.8);
        }
      }
    }
  }

  .avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>