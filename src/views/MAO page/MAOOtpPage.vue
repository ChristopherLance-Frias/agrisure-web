<template>
  <div class="otp-wrapper">
    <div class="otp-card">
      <h2>Verify OTP</h2>

      <p class="subtitle">
        Enter the 6-digit verification code sent to your email or phone.
      </p>

      <div v-if="errorMessage" class="alert error">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="alert success">
        {{ successMessage }}
      </div>

      <input
        v-model="otpCode"
        type="text"
        maxlength="6"
        placeholder="Enter OTP"
        class="otp-input"
      />

      <button
        class="btn-primary"
        @click="verifyOtp"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Verifying...' : 'Verify OTP' }}
      </button>

      <button
        class="btn-link"
        @click="resendOtp"
        :disabled="isLoading"
      >
        Resend OTP
      </button>

      <button
        class="btn-link"
        @click="goBack"
      >
        Back to Login
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'http://192.168.100.173:8000'

export default {
  name: 'OtpPage',

  data() {
    return {
      otpCode: '',
      isLoading: false,
      errorMessage: '',
      successMessage: '',
    }
  },

  computed: {
    userId() {
      return this.$route.query.user_id
    }
  },

  methods: {
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

        localStorage.setItem(
          'mao_token',
          data.access_token
        )

        localStorage.setItem(
          'mao_user',
          JSON.stringify(data.user)
        )

        axios.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${data.access_token}`

        this.$router.push({
          name: 'mao-dashboard'
        })

      } catch (error) {
        if (error.response) {
          this.errorMessage =
            error.response.data.message ||
            'Invalid OTP.'
        } else {
          this.errorMessage =
            'Unable to connect to server.'
        }
      } finally {
        this.isLoading = false
      }
    },

    async resendOtp() {
      const login = localStorage.getItem('otp_login')
      const password = localStorage.getItem('otp_password')

      if (!login || !password) {
        this.errorMessage =
          'Login session expired. Please login again.'
        return
      }

      this.errorMessage = ''
      this.successMessage = ''
      this.isLoading = true

      try {
        const response = await axios.post(
          `${API_BASE}/api/login`,
          {
            login,
            password
          }
        )

        this.successMessage =
          response.data.message ||
          'OTP sent successfully.'
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message ||
          'Failed to resend OTP.'
      } finally {
        this.isLoading = false
      }
    },

    goBack() {
      this.$router.push({
        name: 'login'
      })
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
  background: #f5f7f5;
  padding: 20px;
}

.otp-card {
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 35px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
}

h2 {
  text-align: center;
  margin-bottom: 10px;
  color: #1a2e1c;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 25px;
}

.otp-input {
  width: 100%;
  padding: 14px;
  font-size: 22px;
  text-align: center;
  letter-spacing: 10px;
  border: 1px solid #ddd;
  border-radius: 10px;
  margin-bottom: 20px;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: #34a853;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: .6;
}

.btn-link {
  width: 100%;
  margin-top: 10px;
  background: transparent;
  border: none;
  color: #34a853;
  cursor: pointer;
}

.alert {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.error {
  background: #fee2e2;
  color: #b91c1c;
}

.success {
  background: #dcfce7;
  color: #166534;
}
</style>