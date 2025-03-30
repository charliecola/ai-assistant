<template>
  <div class="voice-recorder">
    <div class="voice-recorder-modal" v-if="isVoice">
      <div class="modal-content">
        <div class="timer" v-if="isRecording">{{ formattedTime }}</div>
        <div class="recording-icon">
          <div class="microphone-icon" @click="toggleRecording">
            <el-icon v-if="!isRecording">
              <Microphone />
            </el-icon>
            <el-icon v-else>
              <svg
                t="1743309997197"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="5508"
                width="22"
                height="22"
              >
                <path
                  d="M512 64C265.6 64 64 265.6 64 512s201.6 448 448 448 448-201.6 448-448S758.4 64 512 64z m0 832C300.8 896 128 723.2 128 512S300.8 128 512 128s384 172.8 384 384-172.8 384-384 384z"
                  fill="#fff"
                  p-id="5509"
                ></path>
                <path
                  d="M624 400v224h-224v-224h224m0-64h-224c-35.2 0-64 28.8-64 64v224c0 35.2 28.8 64 64 64h224c35.2 0 64-28.8 64-64v-224c0-35.2-28.8-64-64-64z"
                  fill="#fff"
                  p-id="5510"
                ></path>
              </svg>
            </el-icon>
          </div>
        </div>
        <div class="recording-text">{{ isRecording ? '录音中...' : '点击开始说话' }}</div>
        <div class="close-button" @click="closeRecording">
          <el-icon>
            <Close />
          </el-icon>
        </div>
      </div>
    </div>
    <div class="voice-button" @click="openVoice">
      <el-icon>
        <Microphone />
      </el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, onUnmounted, computed, onMounted } from 'vue'
import { Microphone, Close } from '@element-plus/icons-vue'
import { RecorderManager } from '@/utils/recorder'
import CryptoJS from 'crypto-js'

const emit = defineEmits(['submit-voice'])
const isVoice = ref(false)
const isRecording = ref(false)
const recordingStartTime = ref(null)
const recordingTime = ref(0)
const timerInterval = ref(null)
const recorder = ref(null)
const iatWS = ref(null)
const resultText = ref('')
const resultTextTemp = ref('')
const hasPermission = ref(false)
const permissionError = ref('')

// 讯飞语音识别配置
const APPID = 'c3acc5a2'
const API_SECRET = 'NDFlNWY3OTQ3NjM5ODI3N2Y4NWMzNTUw'
const API_KEY = 'e4dad86e3f5822cde2e2613f7684c392'

// 计算已录制的时间（格式化为 MM:SS）
const formattedTime = computed(() => {
  const minutes = Math.floor(recordingTime.value / 60)
  const seconds = recordingTime.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// 启动计时器
const startTimer = () => {
  recordingStartTime.value = Date.now()
  recordingTime.value = 0

  // 每秒更新一次时间
  timerInterval.value = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - recordingStartTime.value) / 1000)
    recordingTime.value = elapsedSeconds
  }, 1000)
}

// 停止计时器
const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

// 获取WebSocket URL
const getWebSocketUrl = () => {
  const url = 'wss://iat-api.xfyun.cn/v2/iat'
  const host = 'iat-api.xfyun.cn'
  const date = new Date().toGMTString()
  const algorithm = 'hmac-sha256'
  const headers = 'host date request-line'
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`
  const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, API_SECRET)
  const signature = CryptoJS.enc.Base64.stringify(signatureSha)
  const authorizationOrigin = `api_key="${API_KEY}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
  const authorization = btoa(authorizationOrigin)
  return `${url}?authorization=${authorization}&date=${date}&host=${host}`
}

// 将音频数据转换为Base64
const toBase64 = (buffer) => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

// 渲染识别结果
const renderResult = (resultData) => {
  const jsonData = JSON.parse(resultData)
  if (jsonData.data && jsonData.data.result) {
    const data = jsonData.data.result
    let str = ''
    const ws = data.ws
    for (let i = 0; i < ws.length; i++) {
      str = str + ws[i].cw[0].w
    }
    if (data.pgs) {
      if (data.pgs === 'rpl') {
        // 替换前一个词
        resultText.value = resultTextTemp.value
      }
      resultTextTemp.value = resultText.value + str
    } else {
      resultText.value = resultText.value + str
    }
  }

  // 仅在明确结束时才关闭连接
  if (jsonData.code === 0 && jsonData.data && jsonData.data.status === 2) {
    iatWS.value.close()
    emit('submit-voice', resultTextTemp.value || resultText.value)
    stopRecording()
  }
  if (jsonData.code !== 0 && jsonData.code !== null) {
    iatWS.value.close()
    console.error(jsonData)
  }
}

// 连接WebSocket
const connectWebSocket = () => {
  const websocketUrl = getWebSocketUrl()
  if ('WebSocket' in window) {
    iatWS.value = new WebSocket(websocketUrl)
  } else if ('MozWebSocket' in window) {
    iatWS.value = new MozWebSocket(websocketUrl)
  } else {
    alert('浏览器不支持WebSocket')
    return
  }

  iatWS.value.onopen = () => {
    // 开始录音
    recorder.value.start({
      sampleRate: 16000,
      frameSize: 1280,
    })
    const params = {
      common: {
        app_id: APPID,
      },
      business: {
        language: 'zh_cn',
        domain: 'iat',
        accent: 'mandarin',
        vad_eos: 10000, // 增加静音检测超时时间为10秒
        dwa: 'wpgs', // 开启实时转写
        pd: 'default', // 标点符号
      },
      data: {
        status: 0,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
      },
    }
    iatWS.value.send(JSON.stringify(params))
  }

  iatWS.value.onmessage = (e) => {
    console.log('收到识别结果:', e.data)
    renderResult(e.data)
  }

  iatWS.value.onerror = (e) => {
    console.error('WebSocket错误:', e)
    // 不要立即停止，尝试继续或重连
    if (isRecording.value) {
      // 如果已断开，则尝试重新连接
      if (iatWS.value.readyState !== iatWS.value.OPEN) {
        setTimeout(() => {
          if (isRecording.value) {
            console.log('尝试重新连接...')
            connectWebSocket()
          }
        }, 2000)
      }
    } else {
      recorder.value.stop()
      stopRecording()
    }
  }

  iatWS.value.onclose = (e) => {
    console.log('WebSocket已关闭', e.code, e.reason)
    if (isRecording.value) {
      recorder.value.stop()
      emit('submit-voice', resultTextTemp.value || resultText.value)
      stopRecording()
    }
  }
}

// 检查麦克风权限
const checkMicrophonePermission = async () => {
  try {
    // 请求麦克风权限
    console.log('请求麦克风权限...')
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // 如果成功获取流，则有权限
    hasPermission.value = true
    permissionError.value = ''

    // 释放流，我们只是在检查权限
    stream.getTracks().forEach((track) => track.stop())

    return true
  } catch (error) {
    console.error('麦克风权限错误:', error)
    hasPermission.value = false

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      permissionError.value = '请授予麦克风访问权限以使用语音识别功能'
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      permissionError.value = '未找到麦克风设备'
    } else {
      permissionError.value = `无法访问麦克风: ${error.message}`
    }

    // 显示错误信息
    alert(permissionError.value)
    return false
  }
}

const openVoice = async () => {
  // 先检查麦克风权限
  const hasAccess = await checkMicrophonePermission()
  if (!hasAccess) {
    console.error('无法获取麦克风权限')
    return
  }

  isVoice.value = true
  isRecording.value = false
  recordingTime.value = 0
  resultText.value = ''
  resultTextTemp.value = ''
}

const toggleRecording = () => {
  if (isRecording.value) {
    console.log('停止录音')
    stopRecording()
  } else {
    console.log('开始录音')
    startRecording()
  }
}

const startRecording = async () => {
  try {
    // 再次检查权限，确保在录音前有权限
    if (!hasPermission.value) {
      const hasAccess = await checkMicrophonePermission()
      if (!hasAccess) {
        throw new Error('无法获取麦克风权限')
      }
    }

    resultText.value = ''
    resultTextTemp.value = ''
    isRecording.value = true
    startTimer()
    console.log('初始化WebSocket连接')
    connectWebSocket()
  } catch (error) {
    console.error('录音失败:', error)
    alert(`录音失败: ${error.message}`)
    isVoice.value = false
    stopTimer()
  }
}

const stopRecording = () => {
  isVoice.value = false
  isRecording.value = false
  stopTimer()
  if (recorder.value) {
    // 确保在停止录音前发送结束帧
    if (iatWS.value && iatWS.value.readyState === iatWS.value.OPEN) {
      iatWS.value.send(
        JSON.stringify({
          data: {
            status: 2, // 表示是最后一帧音频
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
            audio: '',
          },
        }),
      )
    }
    recorder.value.stop()
  }
  // 给WebSocket一些时间处理最后一帧
  setTimeout(() => {
    if (iatWS.value) {
      iatWS.value.close()
    }
  }, 500)
}

const closeRecording = () => {
  stopRecording()
}

// 在组件挂载时初始化录音管理器
onMounted(() => {
  recorder.value = new RecorderManager()
  recorder.value.onFrameRecorded = ({ isLastFrame, frameBuffer }) => {
    if (iatWS.value && iatWS.value.readyState === iatWS.value.OPEN) {
      // 只在有实际音频数据或是最后一帧时发送
      if (isLastFrame || (frameBuffer && frameBuffer.byteLength > 0)) {
        iatWS.value.send(
          JSON.stringify({
            data: {
              status: isLastFrame ? 2 : 1,
              format: 'audio/L16;rate=16000',
              encoding: 'raw',
              audio: frameBuffer ? toBase64(frameBuffer) : '',
            },
          }),
        )
      }
    }
  }
})

// 在组件卸载时清理资源
onUnmounted(() => {
  stopTimer()
  if (recorder.value) {
    recorder.value.stop()
  }
  if (iatWS.value) {
    iatWS.value.close()
  }
})
</script>

<style scoped>
.voice-recorder {
  position: relative;
}

.voice-recorder-modal {
  position: fixed;
  border-radius: 5px;
  left: 50%;
  -webkit-transform: translate(-50%);
  transform: translate(-50%);
  bottom: 0;
  -webkit-box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1607843137254902);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1607843137254902);
  height: 160px;
  width: 95%;
  z-index: 999999999;
  background-color: #fff;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.timer {
  height: 20px;
  font-size: 14px;
  font-family:
    PingFangSC-Regular,
    PingFang SC;
  font-weight: 400;
  color: #000;
  line-height: 20px;
  text-align: center;
}

.modal-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
}

.recording-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.microphone-icon {
  position: relative;
  z-index: 2;
  color: #fff;
  font-size: 22px;
  background-color: #2933e0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
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

.recording-text {
  color: #333;
  height: 20px;
  font-size: 13px;
  font-family:
    PingFangSC-Regular,
    PingFang SC;
  font-weight: 400;
  color: #000;
  margin-top: 10px;
  margin-bottom: 5px;
  line-height: 20px;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #000;
  font-size: 18px;
}
</style>
