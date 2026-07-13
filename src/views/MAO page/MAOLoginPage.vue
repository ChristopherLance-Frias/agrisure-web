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
            <h1>MAO</h1>
            <p>Admin Portal</p>
          </div>
        </div>

        <div class="tagline">
          <h2>Municipal Agricultural Office</h2>
          <p>Secure access to the administrative management system. Authorized personnel only.</p>
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
            <p>Sign in with your MAO email address</p>
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
                placeholder="you@mao.gov.ph"
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

          <div class="form-footer">
            <p>MAO Admin System &copy; {{ currentYear }}</p>
            <p>Municipal Agricultural Office</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'http://192.168.100.173:8000'

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
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Layout ──────────────────────────────────────────────────────────────── */
.login-wrapper {
  min-height: 100vh;
  background: #0c1a0e;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  font-family: 'DM Sans', sans-serif;
  position: relative;
  overflow: hidden;
}

.bg-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(52, 168, 83, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(52, 168, 83, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
}

.bg-accent {
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(52, 168, 83, 0.12) 0%, transparent 70%);
  top: -100px; right: -100px;
  pointer-events: none;
}

.login-container {
  position: relative; z-index: 1;
  display: flex;
  width: 100%; max-width: 900px;
  min-height: 560px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(52, 168, 83, 0.2);
}

/* ── Left Panel ──────────────────────────────────────────────────────────── */
.left-panel {
  flex: 1;
  background: linear-gradient(160deg, #122b15 0%, #0c1a0e 100%);
  padding: 3rem 2.5rem;
  display: flex; flex-direction: column; justify-content: space-between;
  border-right: 1px solid rgba(52, 168, 83, 0.15);
}

.brand { display: flex; align-items: center; gap: 14px; }

.logo-mark {
  width: 52px; height: 52px;
  background: #34a853; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}
.logo-mark span {
  font-family: 'DM Serif Display', serif;
  font-size: 26px; color: #fff; line-height: 1;
}

.brand-text h1 {
  font-family: 'DM Serif Display', serif;
  font-size: 22px; color: #e8f5e9;
  letter-spacing: 3px; line-height: 1.1;
}
.brand-text p {
  font-size: 11px; color: rgba(52, 168, 83, 0.7);
  letter-spacing: 2px; text-transform: uppercase; margin-top: 2px;
}

.tagline { padding: 2rem 0; }
.tagline h2 {
  font-family: 'DM Serif Display', serif;
  font-size: 28px; color: #c8e6c9; line-height: 1.3; margin-bottom: 1rem;
}
.tagline p { font-size: 14px; color: rgba(200, 230, 201, 0.55); line-height: 1.7; }

.decorative-lines { display: flex; flex-direction: column; gap: 8px; }
.line {
  height: 2px;
  background: linear-gradient(90deg, rgba(52, 168, 83, 0.5), transparent);
  border-radius: 2px;
}
.line:nth-child(2) { width: 60%; opacity: 0.6; }
.line:nth-child(3) { width: 35%; opacity: 0.3; }

/* ── Right Panel ─────────────────────────────────────────────────────────── */
.right-panel {
  flex: 1.1;
  background: #f5f7f5;
  display: flex; flex-direction: column;
  overflow: hidden;
  position: relative;
}

.step-pane {
  flex: 1;
  padding: 2.5rem 2.5rem;
  display: flex; flex-direction: column; justify-content: space-between;
}

/* ── Slide transition ───────────────────────────────────────────────────── */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}
.panel-slide-enter-from { opacity: 0; transform: translateX(28px); }
.panel-slide-leave-to  { opacity: 0; transform: translateX(-28px); }

/* ── Back Button ─────────────────────────────────────────────────────────── */
.back-btn {
  display: inline-flex; align-items: center; gap: 5px;
  background: none; border: none;
  font-size: 13px; font-family: 'DM Sans', sans-serif;
  font-weight: 500; color: #4a6a4c;
  cursor: pointer; padding: 0; margin-bottom: 1.25rem;
  transition: color 0.2s;
}
.back-btn:hover { color: #34a853; }
.back-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── OTP Icon ────────────────────────────────────────────────────────────── */
.otp-icon {
  width: 56px; height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  border: 1px solid rgba(52, 168, 83, 0.25);
  display: flex; align-items: center; justify-content: center;
  color: #34a853;
  margin-bottom: 1.25rem;
}

/* ── Form Header ─────────────────────────────────────────────────────────── */
.form-header { margin-bottom: 1.5rem; }
.form-header h3 {
  font-family: 'DM Serif Display', serif;
  font-size: 28px; color: #1a2e1c; margin-bottom: 6px;
}
.form-header p { font-size: 14px; color: #6b7c6d; line-height: 1.55; }
.form-header p strong { color: #2d4a2f; }

/* ── Alerts ──────────────────────────────────────────────────────────────── */
.alert {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-radius: 10px;
  font-size: 13.5px; margin-bottom: 1rem; font-weight: 500;
}
.alert-error  { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }

/* ── Fields ──────────────────────────────────────────────────────────────── */
.field { margin-bottom: 1.25rem; }
.field label {
  display: block; font-size: 13px; font-weight: 600;
  color: #2d4a2f; margin-bottom: 7px; letter-spacing: 0.3px;
}
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 13px; color: #7a9e7c; pointer-events: none; }

.input-wrapper input {
  width: 100%;
  padding: 11px 44px;
  border: 1.5px solid #d1dfd2;
  border-radius: 10px;
  font-size: 14px; font-family: 'DM Sans', sans-serif;
  color: #1a2e1c; background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.input-wrapper input::placeholder { color: #aabdab; }
.input-wrapper input:focus {
  border-color: #34a853;
  box-shadow: 0 0 0 3px rgba(52, 168, 83, 0.12);
}
.input-wrapper input:disabled { opacity: 0.6; cursor: not-allowed; background: #f0f4f0; }

.field--error .input-wrapper input { border-color: #f87171; }
.field--error .input-wrapper input:focus { box-shadow: 0 0 0 3px rgba(248,113,113,0.12); }
.error-text { display: block; font-size: 12px; color: #dc2626; margin-top: 5px; }

.toggle-password {
  position: absolute; right: 12px;
  background: none; border: none; cursor: pointer;
  color: #7a9e7c; padding: 4px;
  display: flex; align-items: center; transition: color 0.2s;
}
.toggle-password:hover { color: #34a853; }
.toggle-password:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Form options ────────────────────────────────────────────────────────── */
.form-options {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 1.5rem;
}
.checkbox-label {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; font-size: 13px; color: #4a6a4c; user-select: none;
}
.checkbox-label input[type="checkbox"] { display: none; }
.checkmark {
  width: 17px; height: 17px;
  border: 1.5px solid #b0c8b2; border-radius: 5px;
  background: #fff; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; flex-shrink: 0;
}
.checkbox-label input:checked ~ .checkmark { background: #34a853; border-color: #34a853; }
.checkbox-label input:checked ~ .checkmark::after {
  content: '';
  display: block; width: 5px; height: 9px;
  border: 2px solid #fff; border-top: none; border-left: none;
  transform: rotate(45deg) translate(-1px, -1px);
}
.forgot-link {
  font-size: 13px; color: #34a853; text-decoration: none;
  font-weight: 500; transition: color 0.2s;
}
.forgot-link:hover { color: #1e8a3a; }

/* ── OTP Boxes ───────────────────────────────────────────────────────────── */
.otp-boxes {
  display: flex; gap: 10px;
  justify-content: center;
  margin-bottom: 1.25rem;
}

@keyframes otp-shake {
  0%, 100% { transform: translateX(0); }
  15%       { transform: translateX(-6px); }
  30%       { transform: translateX(6px); }
  45%       { transform: translateX(-5px); }
  60%       { transform: translateX(5px); }
  75%       { transform: translateX(-3px); }
  90%       { transform: translateX(3px); }
}
.otp-shake { animation: otp-shake 0.55s ease; }

.otp-box {
  width: 48px; height: 56px;
  border: 1.5px solid #d1dfd2;
  border-radius: 12px;
  background: #fff;
  text-align: center;
  font-size: 22px; font-weight: 600;
  font-family: 'DM Serif Display', serif;
  color: #1a2e1c;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  caret-color: transparent;
}
.otp-box:focus {
  border-color: #34a853;
  box-shadow: 0 0 0 3px rgba(52, 168, 83, 0.15);
  background: #f0fdf4;
}
.otp-box--filled {
  border-color: #34a853;
  background: #f0fdf4;
}
.otp-box--error {
  border-color: #f87171 !important;
  background: #fff5f5 !important;
}
.otp-box:disabled { opacity: 0.55; cursor: not-allowed; }

/* ── Timer / Resend ──────────────────────────────────────────────────────── */
.otp-timer {
  text-align: center; margin-bottom: 1.5rem;
  min-height: 22px;
}
.timer-text { font-size: 13px; color: #7a9e7c; }
.countdown { font-weight: 600; color: #34a853; margin-left: 4px; }

.resend-btn {
  background: none; border: none;
  font-size: 13px; font-family: 'DM Sans', sans-serif;
  font-weight: 600; color: #34a853;
  cursor: pointer; padding: 0;
  transition: color 0.2s;
}
.resend-btn:hover:not(:disabled) { color: #1e8a3a; }
.resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Submit Button ───────────────────────────────────────────────────────── */
.btn-login {
  width: 100%; padding: 13px;
  background: #34a853; color: #fff; border: none;
  border-radius: 10px; font-size: 15px; font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer; transition: background 0.2s, transform 0.1s;
  letter-spacing: 0.3px;
}
.btn-login:hover:not(:disabled) { background: #2a9248; }
.btn-login:active:not(:disabled) { transform: scale(0.99); }
.btn-login:disabled { opacity: 0.55; cursor: not-allowed; }

.loading-state {
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.spinner { animation: spin 0.8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ── Footer ──────────────────────────────────────────────────────────────── */
.form-footer { margin-top: 1.5rem; text-align: center; }
.form-footer p { font-size: 12px; color: #9aad9b; line-height: 1.6; }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 680px) {
  .login-wrapper { padding: 1rem; }
  .login-container { flex-direction: column; min-height: unset; }
  .left-panel {
    padding: 2rem 1.5rem;
    border-right: none;
    border-bottom: 1px solid rgba(52, 168, 83, 0.15);
  }
  .tagline h2 { font-size: 22px; }
  .decorative-lines { display: none; }
  .right-panel { padding: 0; }
  .step-pane { padding: 2rem 1.5rem; }
  .otp-box { width: 42px; height: 50px; font-size: 20px; }
}
</style>