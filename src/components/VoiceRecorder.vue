<template>
  <div class="voice-recorder">
    <div class="voice-recorder-modal" v-if="isVoice">
      <div class="modal-content">
        <div class="timer" v-if="isRecording">{{ formattedTime }}</div>
        <div class="recording-icon">
          <div class="microphone-icon" @click="startRecording">
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
import { ref, defineEmits, onUnmounted, computed, defineProps } from 'vue'
import { Microphone, Close } from '@element-plus/icons-vue'

const emit = defineEmits(['submit-voice'])
const isVoice = ref(false)
const audioContext = ref(null)
const mediaRecorder = ref(null)
const audioChunks = ref([])
const isRecording = ref(false)
const recordingStartTime = ref(null)
const recordingTime = ref(0)
const timerInterval = ref(null)

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

const toggleRecording = () => {
  // if (isVoice.value) {
  //   stopRecording()
  // } else {
  //   startRecording()
  // }
}
const openVoice = () => {
  isVoice.value = true
  isRecording.value = false
  recordingTime.value = 0
}

const startRecording = async () => {
  try {
    if (isRecording.value) {
      // 如果正在录音，则停止录音
      stopRecording()
      return
    }
    isRecording.value = true
    // 启动计时器
    startTimer()

    // 在实际应用中，这里应该实现真正的录音逻辑
    // 以下是获取用户麦克风权限的示例代码
    // const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // audioContext.value = new AudioContext()
    // mediaRecorder.value = new MediaRecorder(stream)
    // audioChunks.value = []

    // mediaRecorder.value.ondataavailable = (event) => {
    //   audioChunks.value.push(event.data)
    // }

    // mediaRecorder.value.onstop = () => {
    //   const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' })
    //   // 处理录音数据，例如发送到服务器进行语音识别
    //   console.log('录音完成', audioBlob)
    //   // 模拟语音识别完成，向父组件发送识别结果
    //   emit('submit-voice', '这是一段语音识别后的文本')
    // }

    // mediaRecorder.value.start()

    // 模拟语音识别过程
    setTimeout(() => {
      emit('submit-voice', '请问泉州人才引进政策有哪些？')
      // stopRecording()
    }, 3000)
  } catch (error) {
    console.error('录音失败:', error)
    isVoice.value = false
    stopTimer()
  }
}

const stopRecording = () => {
  isVoice.value = false
  isRecording.value = false
  stopTimer()
  // 在实际应用中，这里应该停止录音
  // if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
  //   mediaRecorder.value.stop()
  // }
}

const closeRecording = () => {
  // 取消录音
  isVoice.value = false
  isRecording.value = false
  stopTimer()
}

// 在组件卸载时清理资源
onUnmounted(() => {
  stopTimer()

  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }

  if (audioContext.value) {
    audioContext.value.close()
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

/* 添加计时器样式 */
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
