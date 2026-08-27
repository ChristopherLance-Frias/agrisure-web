<template>
  <div class="otp-wrapper">
    <div class="otp-card">
      <span class="corner-accent corner-tr"></span>
      <span class="corner-accent corner-bl"></span>

      <div class="brand">
        <div class="brand-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L4 5v6c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V5l-8-3z"
              stroke="#FFFFFF"
              stroke-width="1.5"
              stroke-linejoin="round"
              fill="#FFFFFF"
              fill-opacity="0.18"
            />
            <path
              d="M8.5 12.2l2.3 2.3 4.7-4.9"
              stroke="#FFFFFF"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <span class="brand-label">MAO Portal</span>
      </div>

      <h2>Verify OTP</h2>

      <p class="subtitle">
        Enter the 6-digit verification code sent to your email or phone.
      </p>

      <transition name="fade">
        <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
      </transition>

      <transition name="fade">
        <div v-if="successMessage" class="alert success">{{ successMessage }}</div>
      </transition>

      <div class="otp-input-group" @paste="onPaste">
        <input
          v-for="(digit, index) in otpDigits"
          :key="index"
          :ref="el => setDigitRef(el, index)"
          v-model="otpDigits[index]"
          type="text"
          inputmode="numeric"
          maxlength="1"
          class="otp-digit"
          :class="['accent-' + (index % 3), { filled: digit !== '' }]"
          @input="onDigitInput(index, $event)"
          @keydown="onDigitKeydown(index, $event)"
        />
      </div>

      <button
        class="btn-primary"
        @click="verifyOtp"
        :disabled="isLoading || otpCode.length !== 6"
      >
        {{ isLoading ? 'Verifying…' : 'Verify OTP' }}
      </button>

      <div class="resend-row">
        <div v-if="resendCooldown > 0" class="timer-block">
          <div class="timer-ring-wrap">
            <svg class="timer-ring" viewBox="0 0 64 64">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#D29539" />
                  <stop offset="100%" stop-color="#116D3E" />
                </linearGradient>
              </defs>

              <circle class="ring-bg" cx="32" cy="32" r="27" />

              <circle
                class="ring-progress"
                cx="32" cy="32" r="27"
                :style="ringStyle"
              />
            </svg>

            <div class="timer-center">
              <span class="timer-value">{{ resendCooldown }}</span>
            </div>
          </div>

          <span class="resend-hint">
            Didn't get the code?<br />
            Resend available in <strong>{{ formattedCooldown }}</strong>
          </span>
        </div>

        <button
          v-else
          class="btn-resend"
          @click="resendOtp"
          :disabled="isLoading"
        >
          ↻ Resend OTP
        </button>
      </div>

      <button class="btn-back" @click="goBack">
        ← Back to Login
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'https://sanagustinagrisure.com'
const RESEND_COOLDOWN_SECONDS = 180 // 3 minutes

export default {
  name: 'OtpPage',

  data() {
    return {
      otpDigits: ['', '', '', '', '', ''],
      digitRefs: [],

      isLoading: false,
      errorMessage: '',
      successMessage: '',

      resendCooldown: RESEND_COOLDOWN_SECONDS,
      cooldownTimer: null,
    }
  },

  computed: {
    userId() {
      return this.$route.query.user_id
    },

    otpCode() {
      return this.otpDigits.join('')
    },

    formattedCooldown() {
      var seconds = this.resendCooldown
      var m = Math.floor(seconds / 60)
      var s = seconds % 60
      return m + ':' + String(s).padStart(2, '0')
    },

    ringStyle() {
      var radius = 27
      var circumference = 2 * Math.PI * radius
      var fraction = this.resendCooldown / RESEND_COOLDOWN_SECONDS
      var offset = circumference * (1 - fraction)

      return {
        strokeDasharray: circumference + 'px',
        strokeDashoffset: offset + 'px',
      }
    },
  },

  mounted() {
    this.startCooldown()

    this.$nextTick(function() {
      if (this.digitRefs[0]) this.digitRefs[0].focus()
    }.bind(this))
  },

  beforeUnmount() {
    this.stopCooldown()
  },

  methods: {
    setDigitRef(el, index) {
      this.digitRefs[index] = el
    },

    onDigitInput(index, event) {
      var value = event.target.value.replace(/[^0-9]/g, '').slice(-1)
      this.otpDigits[index] = value

      if (value && index < 5) {
        this.$nextTick(function() {
          if (this.digitRefs[index + 1]) this.digitRefs[index + 1].focus()
        }.bind(this))
      }

      if (this.otpCode.length === 6) {
        this.errorMessage = ''
      }
    },

    onDigitKeydown(index, event) {
      if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
        this.otpDigits[index - 1] = ''

        this.$nextTick(function() {
          if (this.digitRefs[index - 1]) this.digitRefs[index - 1].focus()
        }.bind(this))
      }

      if (event.key === 'ArrowLeft' && index > 0) {
        this.digitRefs[index - 1].focus()
      }

      if (event.key === 'ArrowRight' && index < 5) {
        this.digitRefs[index + 1].focus()
      }
    },

    onPaste(event) {
      var pasted = (event.clipboardData || window.clipboardData)
        .getData('text')
        .replace(/[^0-9]/g, '')
        .slice(0, 6)

      if (!pasted) return

      event.preventDefault()

      var chars = pasted.split('')

      for (var i = 0; i < 6; i++) {
        this.otpDigits[i] = chars[i] || ''
      }

      var lastIndex = Math.min(chars.length, 6) - 1

      this.$nextTick(function() {
        if (lastIndex >= 0 && this.digitRefs[lastIndex]) {
          this.digitRefs[lastIndex].focus()
        }
      }.bind(this))
    },

    startCooldown() {
      this.stopCooldown()
      this.resendCooldown = RESEND_COOLDOWN_SECONDS

      var self = this

      this.cooldownTimer = setInterval(function() {
        if (self.resendCooldown > 0) {
          self.resendCooldown -= 1
        }

        if (self.resendCooldown <= 0) {
          self.stopCooldown()
        }
      }, 1000)
    },

    stopCooldown() {
      if (this.cooldownTimer) {
        clearInterval(this.cooldownTimer)
        this.cooldownTimer = null
      }
    },

    async verifyOtp() {
      if (this.otpCode.length !== 6) {
        this.errorMessage = 'Please enter a valid 6-digit OTP.'
        return
      }

      this.errorMessage = ''
      this.isLoading = true

      try {
        const response = await axios.post(
          `${API_BASE}/api/verify-login-otp`,
          {
            user_id: this.userId,
            otp_code: this.otpCode,
          }
        )

        const data = response.data

        localStorage.setItem('mao_token', data.access_token)
        localStorage.setItem('mao_user', JSON.stringify(data.user))

        axios.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`

        this.$router.push({ name: 'mao-dashboard' })
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || 'Invalid OTP.'
        } else {
          this.errorMessage = 'Unable to connect to server.'
        }

        this.otpDigits = ['', '', '', '', '', '']

        this.$nextTick(function() {
          if (this.digitRefs[0]) this.digitRefs[0].focus()
        }.bind(this))
      } finally {
        this.isLoading = false
      }
    },

    async resendOtp() {
      if (this.resendCooldown > 0) return

      const login = localStorage.getItem('otp_login')
      const password = localStorage.getItem('otp_password')

      if (!login || !password) {
        this.errorMessage = 'Login session expired. Please login again.'
        return
      }

      this.errorMessage = ''
      this.successMessage = ''
      this.isLoading = true

      try {
        const response = await axios.post(`${API_BASE}/api/login`, {
          login,
          password,
        })

        this.successMessage = response.data.message || 'OTP sent successfully.'
        this.otpDigits = ['', '', '', '', '', '']
        this.startCooldown()

        this.$nextTick(function() {
          if (this.digitRefs[0]) this.digitRefs[0].focus()
        }.bind(this))
      } catch (error) {
        this.errorMessage = error.response?.data?.message || 'Failed to resend OTP.'
      } finally {
        this.isLoading = false
      }
    },

    goBack() {
      this.$router.push({ name: 'login' })
    },
  },
}
</script>

<style scoped>
.otp-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'DM Sans', sans-serif;
  background: linear-gradient(135deg, #116D3E 0%, #0A5232 45%, #0F212F 100%);
  position: relative;
  overflow: hidden;
}

.otp-wrapper::before,
.otp-wrapper::after {
  content: '';
  position: absolute;
  background: #D29539;
  opacity: 0.14;
  border-radius: 10px;
}

.otp-wrapper::before {
  width: 160px;
  height: 160px;
  top: -40px;
  right: 8%;
  transform: rotate(18deg);
}

.otp-wrapper::after {
  width: 110px;
  height: 110px;
  bottom: -20px;
  left: 10%;
  transform: rotate(-12deg);
}

.otp-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: #FFFFFF;
  padding: 2.4rem 2.2rem;
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(15, 33, 47, 0.35);
  text-align: center;
  overflow: hidden;
  z-index: 1;
}

.corner-accent {
  position: absolute;
  width: 34px;
  height: 34px;
  background: #D29539;
  border-radius: 7px;
}

.corner-tr {
  top: -12px;
  right: 18px;
  transform: rotate(20deg);
}

.corner-bl {
  bottom: -12px;
  left: 18px;
  transform: rotate(-20deg);
  background: #0A5232;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 1.1rem;
}

.brand-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.35);
}

.brand-icon svg path {
  stroke: #FFFFFF;
  fill: #FFFFFF;
  fill-opacity: 0.18;
}

.brand-label {
  font-weight: 700;
  font-size: 0.95rem;
  color: #0F212F;
}

h2 {
  margin: 0 0 8px;
  color: #0F212F;
  font-size: 1.35rem;
  font-weight: 700;
}

.subtitle {
  color: #5c6b64;
  margin: 0 0 1.6rem;
  font-size: 0.88rem;
  line-height: 1.4;
}

.alert {
  padding: 11px 14px;
  border-radius: 10px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: left;
  border-left: 4px solid transparent;
}

.error { background: #fde3e3; color: #b3261e; border-left-color: #b3261e; }
.success { background: #E7F0EC; color: #116D3E; border-left-color: #116D3E; }

.otp-input-group {
  display: flex;
  justify-content: center;
  gap: 9px;
  margin-bottom: 1.6rem;
}

.otp-digit {
  width: 44px;
  height: 54px;
  text-align: center;
  font-size: 1.4rem;
  font-weight: 700;
  color: #0F212F;
  border: 1.5px solid #d7e2d8;
  border-radius: 10px;
  background: #FFFFFF;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, transform 0.1s ease;
}

.otp-digit:focus {
  outline: none;
  transform: translateY(-2px);
}

.otp-digit.accent-0:focus { border-color: #116D3E; box-shadow: 0 0 0 3px rgba(17, 109, 62, 0.22); }
.otp-digit.accent-1:focus { border-color: #D29539; box-shadow: 0 0 0 3px rgba(210, 149, 57, 0.25); }
.otp-digit.accent-2:focus { border-color: #0A5232; box-shadow: 0 0 0 3px rgba(10, 82, 50, 0.22); }

.otp-digit.accent-0.filled { border-color: #116D3E; background: #E7F0EC; color: #116D3E; }
.otp-digit.accent-1.filled { border-color: #D29539; background: #FAF2E7; color: #AC7A2F; }
.otp-digit.accent-2.filled { border-color: #0A5232; background: #E7F0EC; color: #0A5232; }

.btn-primary {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  border: none;
  border-radius: 10px;
  color: #FFFFFF;
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(17, 109, 62, 0.4);
}

.btn-primary:disabled {
  background: #ACCCBB;
  box-shadow: none;
  cursor: not-allowed;
}

.resend-row {
  margin-top: 1.3rem;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-block {
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
}

.timer-ring-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.timer-ring {
  width: 64px;
  height: 64px;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: #E7F0EC;
  stroke-width: 5;
}

.ring-progress {
  fill: none;
  stroke: url(#ringGrad);
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}

.timer-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0F212F;
  font-variant-numeric: tabular-nums;
}

.resend-hint {
  font-size: 0.8rem;
  color: #5c6b64;
  line-height: 1.4;
}

.resend-hint strong {
  color: #116D3E;
  font-variant-numeric: tabular-nums;
}

.btn-resend {
  background: linear-gradient(135deg, #D29539, #AC7A2F);
  border: none;
  color: #FFFFFF;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
  padding: 10px 22px;
  border-radius: 999px;
  box-shadow: 0 8px 18px rgba(210, 149, 57, 0.35);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.btn-resend:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(210, 149, 57, 0.45);
}

.btn-resend:disabled {
  background: #ACCCBB;
  box-shadow: none;
  cursor: not-allowed;
}

.btn-back {
  width: 100%;
  margin-top: 1.4rem;
  background: transparent;
  border: none;
  color: #5c6b64;
  font-size: 0.82rem;
  cursor: pointer;
  font-family: inherit;
  padding: 6px;
}

.btn-back:hover { color: #0F212F; }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>