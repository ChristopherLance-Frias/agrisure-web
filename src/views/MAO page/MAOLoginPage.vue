<template>
  <div class="login-wrapper">
    <div class="bg-grid"></div>
    <div class="bg-accent"></div>
 
    <div class="login-container">
      <!-- Left Panel -->
      <div class="left-panel">
        <div class="brand">
          <div class="logo-mark"><span>M</span></div>
          <div class="brand-text">
            <h1>AGRISURE</h1>
            <p>MAO Portal</p>
          </div>
        </div>
 
        <div class="tagline">
          <h2>AgriSure</h2>
          <p>Digital Crop Insurance Application and Agricultural Assistance Management System for Rice and Corn Farmers. Secure access for authorized personnel only.</p>
        </div>
 
        <div class="decorative-lines">
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
        </div>
      </div>
 
      <!-- Right Panel -->
      <div class="right-panel">
        <div class="step-pane">
          <div class="form-header">
            <h3>Welcome back</h3>
            <p>Sign in with your AgriSure email address</p>
          </div>
 
          <div v-if="errorMessage" class="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ errorMessage }}
          </div>
 
          <!-- Email Field -->
          <div class="field" :class="{ 'field--error': errors.email }">
            <label for="email">Email Address</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="you@agrisure.gov.ph"
                autocomplete="email"
                :disabled="isLoading"
                @keyup.enter="handleLogin"
                @blur="validateEmail"
              />
            </div>
            <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          </div>
 
          <!-- Password -->
          <div class="field" :class="{ 'field--error': errors.password }">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                autocomplete="current-password"
                :disabled="isLoading"
                @keyup.enter="handleLogin"
                @blur="validatePassword"
              />
              <button type="button" class="toggle-password" @click="showPassword = !showPassword" :disabled="isLoading">
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
          </div>
 
          <!-- Remember & Forgot -->
          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.remember" :disabled="isLoading" />
              <span class="checkmark"></span>
              <span>Remember me</span>
            </label>
            <a href="#" class="forgot-link" @click.prevent="handleForgotPassword">Forgot password?</a>
          </div>
 
          <button class="btn-login" :disabled="isLoading" @click="handleLogin">
            <span v-if="!isLoading">Sign In</span>
            <span v-else class="loading-state">
              <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Authenticating...
            </span>
          </button>
          <div class="back-link">
            <a href="#" @click.prevent="$router.push({ name: 'portal-select' })">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to portal selection
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
 

<script>
import axios from 'axios'

const API_BASE = 'https://sanagustinagrisure.com'

export default {
  name: 'MAOLoginPage',

  data() {
    return {
      form: {
        email: '',
        password: '',
        remember: false,
      },

      errors: {
        email: '',
        password: '',
      },

      errorMessage: '',
      isLoading: false,
      showPassword: false,
    }
  },

  computed: {
    currentYear() {
      return new Date().getFullYear()
    },
  },

  methods: {
    validateEmail() {
      this.errors.email = ''

      if (!this.form.email) {
        this.errors.email = 'Email address is required.'
      }
    },

    validatePassword() {
      this.errors.password = ''

      if (!this.form.password) {
        this.errors.password = 'Password is required.'
      }
    },

    validateForm() {
      this.validateEmail()
      this.validatePassword()

      return !this.errors.email && !this.errors.password
    },

    async handleLogin() {
      this.errorMessage = ''

      if (!this.validateForm()) return

      this.isLoading = true

      try {
        const response = await axios.post(
          `${API_BASE}/api/login`,
          {
            login: this.form.email,
            password: this.form.password,
          }
        )

        const data = response.data

        console.log('LOGIN RESPONSE:', data)

        // Farmer → OTP
        if (
          data.requires_otp === true ||
          data.requires_otp === 'true'
        ) {
          this.$router.push({
            name: 'otp',
            query: {
              user_id: data.user_id,
            },
          })

          return
        }

        // MAO direct login
        if (data.access_token) {
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
            name: 'mao-dashboard',
          })

          return
        }

        this.errorMessage =
          data.message || 'Login failed'
      } catch (error) {
        if (error.response) {
          this.errorMessage =
            error.response.data.message ||
            'Invalid credentials'
        } else {
          this.errorMessage =
            'Cannot connect to server'
        }

        console.error(error)
      } finally {
        this.isLoading = false
      }
    },

    handleForgotPassword() {
      this.$router.push({
        name: 'forgot-password',
      })
    },
  },
}
</script>

<style scoped>
* { box-sizing: border-box; }
 
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: linear-gradient(135deg, #116D3E 0%, #0A5232 45%, #0F212F 100%);
  position: relative;
  overflow: hidden;
}
 
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 42px 42px;
  pointer-events: none;
}
 
.bg-accent {
  position: absolute;
  width: 220px;
  height: 220px;
  top: -60px;
  right: 8%;
  background: #D29539;
  opacity: 0.14;
  border-radius: 16px;
  transform: rotate(18deg);
  pointer-events: none;
}
 
.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 920px;
  min-height: 560px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #FFFFFF;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 30px 70px rgba(15, 33, 47, 0.4);
}
 
/* LEFT PANEL */
.left-panel {
  background: linear-gradient(160deg, #116D3E 0%, #0A5232 55%, #0F212F 100%);
  padding: 2.6rem 2.4rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #FFFFFF;
  position: relative;
}
 
.left-panel::after {
  content: '';
  position: absolute;
  width: 130px;
  height: 130px;
  bottom: -30px;
  left: -30px;
  background: #D29539;
  opacity: 0.16;
  border-radius: 14px;
  transform: rotate(-14deg);
}
 
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}
 
.logo-mark {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: linear-gradient(135deg, #D29539, #AC7A2F);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 18px rgba(210, 149, 57, 0.35);
}
 
.logo-mark span {
  font-size: 20px;
  font-weight: 700;
  color: #0F212F;
}
 
.brand-text h1 {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 2.8px;
  color: #FFFFFF;
}
 
.brand-text p {
  font-size: 8.5px;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.6);
  margin-top: 2px;
}
 
.tagline {
  position: relative;
  z-index: 1;
  margin-top: 2.4rem;
}
 
.tagline h2 {
  font-size: 1.9rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: #FFFFFF;
}
 
.tagline p {
  font-size: 0.86rem;
  line-height: 1.6;
  color: rgba(255,255,255,0.72);
  max-width: 340px;
}
 
.decorative-lines {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 2rem;
}
 
.line {
  height: 3px;
  border-radius: 3px;
  background: rgba(255,255,255,0.16);
}
 
.line:nth-child(1) { width: 70%; background: #D29539; opacity: 0.8; }
.line:nth-child(2) { width: 45%; }
.line:nth-child(3) { width: 28%; }
 
/* RIGHT PANEL */
.right-panel {
  padding: 2.8rem 2.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
 
.step-pane {
  width: 100%;
  max-width: 360px;
}
 
.form-header {
  margin-bottom: 1.6rem;
}
 
.form-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0F212F;
  margin-bottom: 4px;
}
 
.form-header p {
  font-size: 0.86rem;
  color: #5c6b64;
}
 
.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 13px;
  border-radius: 10px;
  margin-bottom: 1.1rem;
  font-size: 0.82rem;
  font-weight: 500;
  border-left: 4px solid transparent;
}
 
.alert-error { background: #fde3e3; color: #b3261e; border-left-color: #b3261e; }
 
.field {
  margin-bottom: 1.15rem;
}
 
.field label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: #0F212F;
  margin-bottom: 6px;
}
 
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1.5px solid #d7e2d8;
  border-radius: 10px;
  background: #FFFFFF;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
 
.input-wrapper:focus-within {
  border-color: #116D3E;
  box-shadow: 0 0 0 3px rgba(17, 109, 62, 0.16);
}
 
.field--error .input-wrapper {
  border-color: #b3261e;
}
 
.input-icon {
  margin-left: 12px;
  color: #8a9791;
  flex-shrink: 0;
}
 
.input-wrapper input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 11px 12px;
  font-size: 0.9rem;
  color: #0F212F;
  font-family: inherit;
}
 
.toggle-password {
  background: none;
  border: none;
  cursor: pointer;
  color: #8a9791;
  padding: 8px 12px;
  display: flex;
  align-items: center;
}
 
.toggle-password:hover { color: #116D3E; }
 
.error-text {
  display: block;
  font-size: 0.74rem;
  color: #b3261e;
  margin-top: 5px;
}
 
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.4rem;
}
 
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  color: #5c6b64;
  cursor: pointer;
}
 
.checkbox-label input { accent-color: #116D3E; width: 15px; height: 15px; }
 
.forgot-link {
  font-size: 0.82rem;
  color: #116D3E;
  font-weight: 600;
  text-decoration: none;
}
 
.forgot-link:hover { text-decoration: underline; }
 
.btn-login {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  border: none;
  border-radius: 10px;
  color: #FFFFFF;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.3);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
 
.btn-login:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(17, 109, 62, 0.4);
}
 
.btn-login:disabled {
  background: #ACCCBB;
  box-shadow: none;
  cursor: not-allowed;
}
 
.loading-state {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
 
.spinner {
  animation: spin 0.8s linear infinite;
}
.back-link {
  text-align: center;
  margin-top: 1.4rem;
}

.back-link a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: #5c6b64;
  text-decoration: none;
  font-weight: 500;
}

.back-link a:hover {
  color: #116D3E;
}

 
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
 
.form-footer {
  text-align: center;
  margin-top: 1.6rem;
  font-size: 0.75rem;
  color: #8a9791;
  line-height: 1.5;
}
 
@media (max-width: 780px) {
  .login-container { grid-template-columns: 1fr; }
  .left-panel { display: none; }
}
</style>