// use-tts.js
import { ref, onMounted, onUnmounted } from 'vue'
import CryptoJS from 'crypto-js'

export function useTTS(externalAnswer) {
    // 内置API配置
    const APPID = 'c3acc5a2'
    const API_KEY = 'e4dad86e3f5822cde2e2613f7684c392'
    const API_SECRET = 'NDFlNWY3OTQ3NjM5ODI3N2Y4NWMzNTUw'

    const ttsWS = ref(null)
    const audioPlayer = ref(null)
    const mp3Answer = ref('')

    const getWebSocketUrl = () => {
        const url = 'wss://tts-api.xfyun.cn/v2/tts'
        const host = location.host
        const date = new Date().toGMTString()
        const algorithm = 'hmac-sha256'
        const headers = 'host date request-line'
        const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`
        const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, API_SECRET)
        const signature = CryptoJS.enc.Base64.stringify(signatureSha)
        const authorizationOrigin = `api_key="${API_KEY}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
        const authorization = btoa(authorizationOrigin)
        return `${url}?authorization=${authorization}&date=${date}&host=${host}`
    }

    const encodeText = (text, type) => {
        if (type === 'unicode') {
            let buf = new ArrayBuffer(text.length * 4)
            let bufView = new Uint16Array(buf)
            for (let i = 0, strlen = text.length; i < strlen; i++) {
                bufView[i] = text.charCodeAt(i)
            }
            let binary = ''
            let bytes = new Uint8Array(buf)
            let len = bytes.byteLength
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i])
            }
            return window.btoa(binary)
        } else {
            return Base64.encode(text)
        }
    }

    const connectWebSocket = () => {
        const url = getWebSocketUrl()
        ttsWS.value = new WebSocket(url)

        ttsWS.value.onopen = () => {
            audioPlayer.value?.start({
                autoPlay: true,
                sampleRate: 16000,
                resumePlayDuration: 1000
            })

            const text = externalAnswer.value.replace(mp3Answer.value, '')
            console.log(externalAnswer.value,1111)
            mp3Answer.value += text

            const params = {
                common: { app_id: APPID },
                business: {
                    aue: 'raw',
                    auf: 'audio/L16;rate=16000',
                    vcn: 'xiaoyan',
                    speed: 60,
                    volume: 50,
                    pitch: 50,
                    bgs: 1,
                    tte: 'UTF8'
                },
                data: {
                    status: 2,
                    text: encodeText(text, 'UTF8')
                }
            }
            ttsWS.value?.send(JSON.stringify(params))
        }

        ttsWS.value.onmessage = (e) => {
            const jsonData = JSON.parse(e.data)
            if (jsonData.code !== 0) return

            audioPlayer.value?.postMessage({
                type: 'base64',
                data: jsonData.data.audio,
                isLastData: jsonData.data.status === 2
            })

            if (jsonData.code === 0 && jsonData.data.status === 2) {
                ttsWS.value?.close()
            }
        }

        ttsWS.value.onerror = (e) => {
            console.error('WebSocket error:', e)
        }
    }

    const startTTS = () => {
        connectWebSocket()
    }

    const stopTTS = () => {
        ttsWS.value?.close()
        audioPlayer.value?.stop()
        mp3Answer.value = ''
    }

    onMounted(() => {
        audioPlayer.value = new AudioPlayer('dist')
        audioPlayer.value.onStop = () => {
            if (mp3Answer.value !== externalAnswer.value) {
                connectWebSocket()
            }
        }
    })

    onUnmounted(() => {
        ttsWS.value?.close()
        audioPlayer.value?.reset()
    })

    return {
        startTTS,
        stopTTS
    }
}