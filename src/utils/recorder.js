export class RecorderManager {
  constructor() {
    this.audioContext = null
    this.mediaStream = null
    this.scriptProcessor = null
    this.audioSource = null
    this.audioChunks = []
    this.onFrameRecorded = null
    this.onStart = null
    this.onStop = null
    this.onError = null
    this.isRecording = false
  }

  async start(options = {}) {
    try {
      if (this.isRecording) {
        return // 避免重复启动
      }

      // 停止任何现有的录音
      this.cleanup()

      // 设置录音状态
      this.isRecording = true

      // 获取麦克风权限
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      }

      console.log('获取媒体设备...')
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

      // 创建音频上下文（兼容移动端）
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioContext({
        sampleRate: options.sampleRate || 16000,
      })

      // 在iOS上可能需要解锁音频上下文
      if (this.audioContext.state === 'suspended') {
        console.log('尝试解锁音频上下文...')
        await this.audioContext.resume()
      }

      // 创建音频源
      this.audioSource = this.audioContext.createMediaStreamSource(this.mediaStream)

      // 创建处理器节点，使用 1024 作为 buffer size
      this.scriptProcessor = this.audioContext.createScriptProcessor(1024, 1, 1)

      // 连接节点
      this.audioSource.connect(this.scriptProcessor)
      this.scriptProcessor.connect(this.audioContext.destination)

      // 处理音频数据
      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isRecording) return

        const inputData = e.inputBuffer.getChannelData(0)
        const pcmData = new Int16Array(inputData.length)

        // 将Float32Array转换为Int16Array
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = inputData[i] * 0x7fff
        }

        // 发送音频帧
        if (this.onFrameRecorded) {
          this.onFrameRecorded({
            isLastFrame: false,
            frameBuffer: pcmData.buffer,
          })
        }
      }

      // 触发开始事件
      if (this.onStart) {
        this.onStart()
      }

      console.log('录音已成功启动')
    } catch (error) {
      console.error('录音启动失败:', error)
      this.isRecording = false

      // 触发错误事件
      if (this.onError) {
        this.onError(error)
      }

      throw error
    }
  }

  stop() {
    if (!this.isRecording) {
      return // 如果未在录音，则不需要停止
    }

    try {
      // 标记录音状态
      this.isRecording = false

      // 发送最后一帧
      if (this.onFrameRecorded) {
        this.onFrameRecorded({
          isLastFrame: true,
          frameBuffer: new Int16Array(0).buffer,
        })
      }

      // 清理资源
      this.cleanup()

      // 触发停止事件
      if (this.onStop) {
        this.onStop()
      }

      console.log('录音已停止')
    } catch (error) {
      console.error('录音停止失败:', error)

      // 触发错误事件
      if (this.onError) {
        this.onError(error)
      }

      throw error
    }
  }

  // 清理资源方法
  cleanup() {
    // 断开节点连接
    if (this.scriptProcessor && this.audioSource) {
      try {
        this.audioSource.disconnect(this.scriptProcessor)
        this.scriptProcessor.disconnect()
      } catch (e) {
        console.warn('断开音频节点连接失败:', e)
      }
    }

    // 关闭音频上下文
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close()
      } catch (e) {
        console.warn('关闭音频上下文失败:', e)
      }
    }

    // 停止媒体流
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop())
      } catch (e) {
        console.warn('停止媒体流失败:', e)
      }
    }

    // 重置引用
    this.audioContext = null
    this.mediaStream = null
    this.scriptProcessor = null
    this.audioSource = null
  }
}
