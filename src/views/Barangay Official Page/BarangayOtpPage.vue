<template>
  <div class="otp-wrapper">
    <div class="otp-card">
      <div class="brand">
        <div class="brand-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2L3 9v6c0 8.25 5.5 15.97 13 18 7.5-2.03 13-9.75 13-18V9L16 2z" fill="#1d4ed8" fill-opacity="0.15" stroke="#1d4ed8" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M16 8v8m0 0l4-4m-4 4l-4-4" stroke="#1d4ed8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="brand-label">Barangay Portal</span>
      </div>

      <h2>Verify Your Identity</h2>

      <p class="subtitle">
        Enter the 6-digit code sent to your registered email or mobile number.
      </p>

      <div v-if="errorMessage" class="alert error">
        <span class="alert-icon">&#9888;</span>
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="alert success">
        <span class="alert-icon">&#10003;</span>
        {{ successMessage }}
      </div>

      <div class="otp-fields">
        <input
          v-for="(digit, index) in otpDigits"
          :key="index"
          :ref="'otpInput' + index"
          v-model="otpDigits[index]"
          type="text"
          inputmode="numeric"
          maxlength="1"
          class="otp-box"
          :class="{ filled: digit !== '' }"
          @input="handleInput(index)"
          @keydown="handleKeydown($event, index)"
          @paste="handlePaste($event)"
        />
      </div>

      <div class="timer-row" v-if="countdown > 0">
        <span class="timer-text">Code expires in <strong>{{ formattedCountdown }}</strong></span>
      </div>
      <div class="timer-row" v-else>
        <span class="timer-text expired">Code has expired</span>
      </div>

      <button
        class="btn-primary"
        @click="verifyOtp"
        :disabled="isLoading || otpCode.length !== 6"
      >
        <span v-if="isLoading" class="spinner"></span>
        {{ isLoading ? 'Verifying...' : 'Verify OTP' }}
      </button>

      <div class="divider"></div>

      <button
        class="btn-secondary"
        @click="resendOtp"
        :disabled="isLoading || resendCooldown > 0"
      >
        {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP' }}
      </button>

      <button
        class="btn-link"
        @click="goBack"
      >
        &larr; Back to Login
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'http://192.168.100.173:8000'

export default {
  name: 'BarangayOtpPage',

  data() {
    return {
      otpDigits: ['', '', '', '', '', ''],
      isLoading: false,
      errorMessage: '',
      successMessage: '',
      countdown: 300,
      resendCooldown: 0,
      countdownTimer: null,
      resendTimer: null,
    }
  },

  computed: {
    userId() {
      return this.$route.query.user_id
    },

    otpCode() {
      return this.otpDigits.join('')
    },

    formattedCountdown() {
      const m = Math.floor(this.countdown / 60)
      const s = this.countdown % 60
      return `${m}:${s.toString().padStart(2, '0')}`
    }
  },

  mounted() {
    this.startCountdown()
    this.$nextTick(() => {
      const firstInput = this.$refs['otpInput0']
      if (firstInput && firstInput[0]) firstInput[0].focus()
    })
  },

  beforeUnmount() {
  clearInterval(this.countdownTimer)
  clearInterval(this.resendTimer)
},

  methods: {
    startCountdown() {
      clearInterval(this.countdownTimer)
      this.countdown = 300
      this.countdownTimer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--
        } else {
          clearInterval(this.countdownTimer)
        }
      }, 1000)
    },

    startResendCooldown() {
      this.resendCooldown = 60
      clearInterval(this.resendTimer)
      this.resendTimer = setInterval(() => {
        if (this.resendCooldown > 0) {
          this.resendCooldown--
        } else {
          clearInterval(this.resendTimer)
        }
      }, 1000)
    },

    handleInput(index) {
      const val = this.otpDigits[index]
      if (val && !/^\d$/.test(val)) {
        this.otpDigits[index] = ''
        return
      }
      if (val && index < 5) {
        const next = this.$refs['otpInput' + (index + 1)]
        if (next && next[0]) next[0].focus()
      }
    },

    handleKeydown(event, index) {
      if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
        const prev = this.$refs['otpInput' + (index - 1)]
        if (prev && prev[0]) {
          prev[0].focus()
          this.otpDigits[index - 1] = ''
        }
      }
    },

    handlePaste(event) {
      event.preventDefault()
      const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
      pasted.split('').forEach((char, i) => {
        if (i < 6) this.otpDigits[i] = char
      })
      const focusIndex = Math.min(pasted.length, 5)
      const target = this.$refs['otpInput' + focusIndex]
      if (target && target[0]) target[0].focus()
    },

    async verifyOtp() {
    if (this.otpCode.length !== 6) {
      this.errorMessage = 'Please enter the complete 6-digit OTP.'
      return
    }

    this.errorMessage = ''
    this.successMessage = ''
    this.isLoading = true

    try {
      const response = await axios.post(
        `${API_BASE}/api/verify-login-otp`,  // ← updated endpoint
        {
          user_id: this.userId,
          otp_code: this.otpCode,
        }
      )

      // ↓ PUT IT HERE, replacing the old localStorage lines and router push
      const data = response.data

      localStorage.setItem('barangay_token', data.access_token)
      localStorage.setItem('barangay_user', JSON.stringify(data.user))

      if (data.user.role !== 'barangay') {
        this.errorMessage = 'Unauthorized access.'
        return
      }

      await this.$router.push({ name: 'barangay-dashboard' })

    } catch (error) {
      if (error.response) {
        this.errorMessage =
          error.response.data.message || 'Invalid or expired OTP.'
      } else {
        this.errorMessage = 'Unable to connect to server.'
      }
      this.otpDigits = ['', '', '', '', '', '']
      this.$nextTick(() => {
        const first = this.$refs['otpInput0']
        if (first && first[0]) first[0].focus()
      })
    } finally {
      this.isLoading = false
    }
  },

    async resendOtp() {
      const login = localStorage.getItem('brgy_otp_login')
      const password = localStorage.getItem('brgy_otp_password')

      if (!login || !password) {
        this.errorMessage = 'Session expired. Please log in again.'
        return
      }

      this.errorMessage = ''
      this.successMessage = ''
      this.isLoading = true

      try {
        const response = await axios.post(
          `${API_BASE}/api/barangay/login`,
          { login, password }
        )

        this.successMessage =
          response.data.message || 'A new OTP has been sent.'

        this.otpDigits = ['', '', '', '', '', '']
        this.startCountdown()
        this.startResendCooldown()

        this.$nextTick(() => {
          const first = this.$refs['otpInput0']
          if (first && first[0]) first[0].focus()
        })

      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || 'Failed to resend OTP.'
      } finally {
        this.isLoading = false
      }
    },

    goBack() {
      this.$router.push({ name: 'barangay-login' })
    }
  }
}
</script>

<style scoped>
.otp-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  padding: 20px;
}

.otp-card {
  width: 100%;
  max-width: 440px;
  background: white;
  padding: 40px 35px;
  border-radius: 18px;
  box-shadow: 0 12px 40px rgba(29, 78, 216, 0.08);
  border-top: 4px solid #1d4ed8;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 22px;
}

.brand-label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #1d4ed8;
}

h2 {
  text-align: center;
  margin-bottom: 10px;
  color: #1e3a8a;
  font-size: 22px;
  font-weight: 700;
}

.subtitle {
  text-align: center;
  color: #64748b;
  margin-bottom: 28px;
  font-size: 14px;
  line-height: 1.6;
}

.otp-fields {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 18px;
}

.otp-box {
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  color: #1e3a8a;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #f8fafc;
}

.otp-box:focus {
  border-color: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.12);
  background: white;
}

.otp-box.filled {
  border-color: #1d4ed8;
  background: #eff6ff;
}

.timer-row {
  text-align: center;
  margin-bottom: 20px;
}

.timer-text {
  font-size: 13px;
  color: #64748b;
}

.timer-text.expired {
  color: #dc2626;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: #1d4ed8;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s, opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #1e40af;
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.divider {
  height: 1px;
  background: #e2e8f0;
  margin: 18px 0;
}

.btn-secondary {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1.5px solid #1d4ed8;
  border-radius: 10px;
  color: #1d4ed8;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #eff6ff;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-link {
  width: 100%;
  margin-top: 12px;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-link:hover {
  color: #1d4ed8;
}

.alert {
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.alert-icon {
  flex-shrink: 0;
  font-size: 15px;
}

.error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.success {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>