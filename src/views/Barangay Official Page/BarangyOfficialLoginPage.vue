<template>
  <div class="login-wrapper">
    <div class="bg-grid"></div>
    <div class="bg-accent"></div>

    <div class="login-container">
      <!-- Left Panel -->
      <div class="left-panel">
        <div class="brand">
          <div class="logo-mark"><span>B</span></div>
          <div class="brand-text">
            <h1>BRGY</h1>
            <p>Official Portal</p>
          </div>
        </div>

        <div class="tagline">
          <h2>Barangay Official Portal</h2>
          <p>Secure access to agricultural data and services for your barangay community.</p>
        </div>

        <div class="decorative-lines">
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="right-panel">
        <div class="form-header">
          <h3>Welcome back</h3>
          <p>Sign in with your Barangay Official account</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form" novalidate>

          <div v-if="errorMessage" class="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="alert alert-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ successMessage }}
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
                placeholder="you@barangay.gov.ph"
                autocomplete="email"
                :disabled="isLoading"
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

          <button type="submit" class="btn-login" :disabled="isLoading">
            <span v-if="!isLoading">Sign In</span>
            <span v-else class="loading-state">
              <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Authenticating...
            </span>
          </button>
        </form>

        <div class="back-link">
          <a href="#" @click.prevent="$router.push({ name: 'portal-select' })">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to portal selection
          </a>
        </div>

        <div class="form-footer">
          <p>MAO Admin System &copy; {{ currentYear }}</p>
          <p>Municipal Agricultural Office</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'http://192.168.100.173:8000'

export default {
  name: 'BarangayLoginPage',

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
      successMessage: '',
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
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
        this.errors.email = 'Please enter a valid email address.'
      }
    },

    validatePassword() {
      this.errors.password = ''

      if (!this.form.password) {
        this.errors.password = 'Password is required.'
      } else if (this.form.password.length < 6) {
        this.errors.password = 'Password must be at least 6 characters.'
      }
    },

    validateForm() {
      this.validateEmail()
      this.validatePassword()

      return !this.errors.email && !this.errors.password
    },

    async handleLogin() {
      this.errorMessage = ''
      this.successMessage = ''

      if (!this.validateForm()) return

      this.isLoading = true

      try {
        const response = await axios.post(
          `${API_BASE}/api/login`,
          {
            login: this.form.email,
            password: this.form.password,
          },
          {
            headers: {
              Accept: 'application/json',
            },
          }
        )

        const data = response.data

        console.log('LOGIN RESPONSE:', data)

        if (data.role && data.role !== 'barangay') {
          this.errorMessage =
            'Access denied. This portal is for Barangay Officials only.'
          return
        }

        // OTP required
        if (data.requires_otp === true || data.requires_otp === 'true') {
          this.$router.push({
            name: 'barangay-otp',
            query: {
              user_id: data.user_id,
              role: data.role,
            },
          })

          return
        }

        // Direct login, just in case you disable OTP later
        if (data.access_token && data.user) {
          if (data.user.role !== 'barangay') {
            this.errorMessage =
              'Access denied. This portal is for Barangay Officials only.'
            return
          }

          localStorage.setItem('barangay_token', data.access_token)
          localStorage.setItem('barangay_user', JSON.stringify(data.user))

          axios.defaults.headers.common.Authorization =
            `Bearer ${data.access_token}`

          this.successMessage =
            data.message ||
            `Welcome, ${data.user.first_name} ${data.user.last_name}! Redirecting...`

          setTimeout(() => {
            this.$router.push({
              name: 'barangay-dashboard',
            })
          }, 1200)

          return
        }

        this.errorMessage = data.message || 'Login failed'
      } catch (error) {
        if (error.response) {
          const { status, data } = error.response

          switch (status) {
            case 401:
              this.errorMessage =
                data.message || 'Invalid email or password.'
              break

            case 403:
              this.errorMessage =
                data.message || 'Access denied.'
              break

            case 422:
              this.errorMessage =
                data.message || 'Please check your input and try again.'
              break

            case 429:
              this.errorMessage =
                'Too many login attempts. Please try again later.'
              break

            default:
              this.errorMessage =
                data.message || 'Server error. Please try again.'
          }
        } else if (error.request) {
          this.errorMessage =
            'Cannot connect to the server. Check your network.'
        } else {
          this.errorMessage =
            'An unexpected error occurred.'
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

.login-wrapper {
  min-height: 100vh;
  background: #0c1220;
  display: flex; align-items: center; justify-content: center;
  padding: 2rem;
  font-family: 'DM Sans', sans-serif;
  position: relative; overflow: hidden;
}

.bg-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(66, 133, 244, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(66, 133, 244, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
}

.bg-accent {
  position: absolute;
  width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(66, 133, 244, 0.12) 0%, transparent 70%);
  top: -100px; right: -100px; pointer-events: none;
}

.login-container {
  position: relative; z-index: 1;
  display: flex; width: 100%; max-width: 900px; min-height: 560px;
  border-radius: 20px; overflow: hidden;
  border: 1px solid rgba(66, 133, 244, 0.2);
}

.left-panel {
  flex: 1;
  background: linear-gradient(160deg, #111d3a 0%, #0c1220 100%);
  padding: 3rem 2.5rem;
  display: flex; flex-direction: column; justify-content: space-between;
  border-right: 1px solid rgba(66, 133, 244, 0.15);
}

.brand { display: flex; align-items: center; gap: 14px; }

.logo-mark {
  width: 52px; height: 52px; background: #4285f4;
  border-radius: 14px; display: flex; align-items: center; justify-content: center;
}
.logo-mark span { font-family: 'DM Serif Display', serif; font-size: 26px; color: #fff; line-height: 1; }

.brand-text h1 { font-family: 'DM Serif Display', serif; font-size: 22px; color: #e8eeff; letter-spacing: 3px; line-height: 1.1; }
.brand-text p  { font-size: 11px; color: rgba(66,133,244,0.7); letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }

.tagline { padding: 2rem 0; }
.tagline h2 { font-family: 'DM Serif Display', serif; font-size: 28px; color: #c8d6f5; line-height: 1.3; margin-bottom: 1rem; }
.tagline p  { font-size: 14px; color: rgba(200,214,245,0.55); line-height: 1.7; }

.decorative-lines { display: flex; flex-direction: column; gap: 8px; }
.line { height: 2px; background: linear-gradient(90deg, rgba(66,133,244,0.5), transparent); border-radius: 2px; }
.line:nth-child(2) { width: 60%; opacity: 0.6; }
.line:nth-child(3) { width: 35%; opacity: 0.3; }

.right-panel {
  flex: 1.1; background: #f5f7ff;
  padding: 2.5rem; display: flex; flex-direction: column; justify-content: space-between;
}

.form-header { margin-bottom: 1.5rem; }
.form-header h3 { font-family: 'DM Serif Display', serif; font-size: 28px; color: #1a1e3a; margin-bottom: 6px; }
.form-header p  { font-size: 14px; color: #6b6e8a; }

.alert { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 10px; font-size: 13.5px; margin-bottom: 1rem; font-weight: 500; }
.alert-error   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.alert-success { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

.field { margin-bottom: 1.25rem; }
.field label { display: block; font-size: 13px; font-weight: 600; color: #2d3480; margin-bottom: 7px; letter-spacing: 0.3px; }

.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon    { position: absolute; left: 13px; color: #7a85c0; pointer-events: none; }

.input-wrapper input {
  width: 100%; padding: 11px 44px;
  border: 1.5px solid #cdd1f0; border-radius: 10px;
  font-size: 14px; font-family: 'DM Sans', sans-serif;
  color: #1a1e3a; background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s; outline: none;
}
.input-wrapper input::placeholder { color: #a8aed4; }
.input-wrapper input:focus        { border-color: #4285f4; box-shadow: 0 0 0 3px rgba(66,133,244,0.12); }
.input-wrapper input:disabled     { opacity: 0.6; cursor: not-allowed; background: #f0f2ff; }
.field--error .input-wrapper input       { border-color: #f87171; }
.field--error .input-wrapper input:focus { box-shadow: 0 0 0 3px rgba(248,113,113,0.12); }
.error-text { display: block; font-size: 12px; color: #dc2626; margin-top: 5px; }

.toggle-password { position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: #7a85c0; padding: 4px; display: flex; align-items: center; transition: color 0.2s; }
.toggle-password:hover    { color: #4285f4; }
.toggle-password:disabled { opacity: 0.5; cursor: not-allowed; }

.form-options { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }

.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #4a4e80; user-select: none; }
.checkbox-label input[type="checkbox"] { display: none; }
.checkmark { width: 17px; height: 17px; border: 1.5px solid #b0b8e0; border-radius: 5px; background: #fff; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
.checkbox-label input:checked ~ .checkmark { background: #4285f4; border-color: #4285f4; }
.checkbox-label input:checked ~ .checkmark::after { content: ''; display: block; width: 5px; height: 9px; border: 2px solid #fff; border-top: none; border-left: none; transform: rotate(45deg) translate(-1px, -1px); }

.forgot-link { font-size: 13px; color: #4285f4; text-decoration: none; font-weight: 500; transition: color 0.2s; }
.forgot-link:hover { color: #2563eb; }

.btn-login { width: 100%; padding: 13px; background: #4285f4; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.2s, transform 0.1s; letter-spacing: 0.3px; }
.btn-login:hover:not(:disabled)  { background: #3070d6; }
.btn-login:active:not(:disabled) { transform: scale(0.99); }
.btn-login:disabled               { opacity: 0.7; cursor: not-allowed; }

.loading-state { display: flex; align-items: center; justify-content: center; gap: 8px; }
.spinner { animation: spin 0.8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.back-link { text-align: center; margin-top: 1rem; }
.back-link a { font-size: 13px; color: #6b6e8a; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: color 0.2s; }
.back-link a:hover { color: #4285f4; }

.form-footer { margin-top: 1rem; text-align: center; }
.form-footer p { font-size: 12px; color: #9a9db5; line-height: 1.6; }

@media (max-width: 680px) {
  .login-wrapper { padding: 1rem; }
  .login-container { flex-direction: column; min-height: unset; }
  .left-panel { padding: 2rem 1.5rem; border-right: none; border-bottom: 1px solid rgba(66,133,244,0.15); }
  .tagline h2 { font-size: 22px; }
  .decorative-lines { display: none; }
  .right-panel { padding: 2rem 1.5rem; }
}
</style>