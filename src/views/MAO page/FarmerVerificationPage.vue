<template>
  <div class="page">

    <!-- Top bar -->
    <div class="topbar">
      <div>
        <h2 class="page-title">Farmer Verification</h2>
        <p class="page-sub">Review and manage farmer registration requests.</p>
      </div>
      <button class="btn-refresh" @click="fetchFarmers" :disabled="isLoading">
        <svg :class="['refresh-icon', { spinning: isLoading }]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Refresh
      </button>
    </div>

    <!-- Status tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab', { active: activeTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'pending' && counts.pending > 0" class="tab-badge">{{ counts.pending }}</span>
      </button>
    </div>

    <!-- Error -->
    <div v-if="fetchError" class="alert alert-error">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ fetchError }}
    </div>

    <!-- Skeleton loader -->
    <div v-if="isLoading" class="skeleton-list">
      <div v-for="n in 4" :key="n" class="skeleton-card">
        <div class="sk sk-avatar"></div>
        <div class="sk-lines">
          <div class="sk sk-line-lg"></div>
          <div class="sk sk-line-sm"></div>
        </div>
        <div class="sk sk-btn"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!isLoading && farmers.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <p>No <strong>{{ activeTab }}</strong> registrations found.</p>
    </div>

    <!-- Farmer list -->
    <div v-else class="farmer-list">
      <div v-for="farmer in farmers" :key="farmer.id" class="farmer-card">

        <div class="farmer-avatar">{{ initials(farmer) }}</div>

        <div class="farmer-info">
          <h4 class="farmer-name">
            {{ farmer.last_name }}, {{ farmer.first_name }}
            <span v-if="farmer.middle_name"> {{ farmer.middle_name}}</span>
          </h4>
          <div class="farmer-meta">
            <span v-if="farmer.email">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {{ farmer.email }}
            </span>
            <span v-if="farmer.phone_number">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.42 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.49 5.49l1.27-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.32 16z"/>
              </svg>
              {{ farmer.phone_number }}
            </span>
            <span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Registered {{ formatDate(farmer.created_at) }}
            </span>
          </div>
        </div>

        <span :class="['status-badge', `status-${farmer.account_status}`]">
          {{ farmer.account_status }}
        </span>

        <!-- Actions — pending tab only -->
        <div v-if="activeTab === 'pending'" class="farmer-actions">
          <button class="btn-approve" @click="openModal(farmer, 'approve')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Approve
          </button>
          <button class="btn-reject" @click="openModal(farmer, 'reject')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Reject
          </button>
        </div>

      </div>
    </div>

    <!-- Confirm Modal -->
    <div v-if="modal.show" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header" :class="modal.action === 'approve' ? 'modal-approve' : 'modal-reject'">
          <div class="modal-icon">
            <svg v-if="modal.action === 'approve'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <h3>{{ modal.action === 'approve' ? 'Approve Farmer' : 'Reject Farmer' }}</h3>
        </div>

        <div class="modal-body">
          <p>You are about to <strong>{{ modal.action }}</strong> the registration of:</p>
          <div class="modal-farmer-name">
            {{ modal.farmer?.last_name }}, {{ modal.farmer?.first_name }}
            {{ modal.farmer?.middle_name ? modal.farmer.middle_name : '' }}
          </div>
          
          <div v-if="modal.action === 'approve'" class="field">
            <label>RSBSA Number <span style="color:red">*</span></label>
            <input
                v-model="modal.rsbsa_reference"
                type="text"
                placeholder="Enter farmer's RSBSA Number"
            />
            </div>

            <div v-if="modal.action === 'reject'" class="field">
            <label>
                Reason for Rejection
                <span class="optional">(optional)</span>
            </label>
            <textarea
                v-model="modal.remarks"
                placeholder="e.g. Incomplete or invalid documents."
                rows="3"
            ></textarea>
            </div>

          <div v-if="modal.error" class="alert alert-error" style="margin-top:0.75rem">
            {{ modal.error }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal" :disabled="modal.processing">
            Cancel
          </button>
          <button
            :class="modal.action === 'approve' ? 'btn-approve' : 'btn-reject'"
            @click="confirmAction"
            :disabled="modal.processing"
          >
            <svg v-if="modal.processing" class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            {{ modal.processing ? 'Processing...' : (modal.action === 'approve' ? 'Yes, Approve' : 'Yes, Reject') }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'http://192.168.100.173:8000'

export default {
  name: 'FarmerVerification',

  data() {
    return {
      activeTab: 'pending',
      farmers: [],
      counts: { pending: 0, verified: 0, rejected: 0 },
      isLoading: false,
      fetchError: '',

      tabs: [
        { key: 'pending',  label: 'Pending' },
        { key: 'verified', label: 'Verified' },
        { key: 'rejected', label: 'Rejected' },
      ],

      modal: {
        show: false,
        action: '',
        farmer: null,
        remarks: '',
        rsbsa_reference: '',
        processing: false,
        error: '',
        },
    }
  },

  mounted() {
    this.fetchFarmers()
    this.fetchCounts()
  },

  methods: {
    authHeaders() {
      const token = localStorage.getItem('mao_token')
      return { Authorization: `Bearer ${token}` }
    },

    async fetchFarmers() {
      this.isLoading = true
      this.fetchError = ''
      this.farmers = []
      try {
        const res = await axios.get(`${API_BASE}/api/farmers/${this.activeTab}`, {
          headers: this.authHeaders(),
        })
        this.farmers = res.data.data ?? res.data
      } catch (e) {
        this.fetchError = e.response?.data?.message || 'Failed to load farmers. Please try again.'
      } finally {
        this.isLoading = false
      }
    },

    async fetchCounts() {
      try {
        const [p, v, r] = await Promise.all([
          axios.get(`${API_BASE}/api/farmers/pending`,  { headers: this.authHeaders() }),
          axios.get(`${API_BASE}/api/farmers/verified`, { headers: this.authHeaders() }),
          axios.get(`${API_BASE}/api/farmers/rejected`, { headers: this.authHeaders() }),
        ])
        const len = res => (res.data.data ?? res.data).length
        this.counts = { pending: len(p), verified: len(v), rejected: len(r) }
      } catch (_) { /* counts are non-critical */ }
    },

    switchTab(key) {
      this.activeTab = key
      this.fetchFarmers()
    },

    initials(farmer) {
      return `${farmer.first_name?.[0] ?? ''}${farmer.last_name?.[0] ?? ''}`.toUpperCase()
    },

    formatDate(d) {
      if (!d) return '—'
      return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    },

    openModal(farmer, action) {
     this.modal = {
            show: true,
            action,
            farmer,
            remarks: '',
            rsbsa_reference: '',
            processing: false,
            error: '',
        }
    },

    closeModal() {
      if (this.modal.processing) return
      this.modal.show = false
    },

    async confirmAction() {
    const { farmer, action, remarks, rsbsa_reference } = this.modal

    if (action === 'approve' && !rsbsa_reference.trim()) {
    this.modal.error = 'RSBSA Number is required.'
    this.modal.processing = false
    return
    }

      const endpoint = action === 'approve'
        ? `${API_BASE}/api/farmers/${farmer.id}/verify`
        : `${API_BASE}/api/farmers/${farmer.id}/reject`

      try {
        const payload = action === 'approve'
            ? { rsbsa_reference }
            : { remarks }

            await axios.post(endpoint, payload, {
            headers: this.authHeaders()
            })

        this.farmers = this.farmers.filter(f => f.id !== farmer.id)
        this.counts.pending = Math.max(0, this.counts.pending - 1)
        if (action === 'approve') this.counts.verified += 1
        else this.counts.rejected += 1

        this.modal.show = false
      } catch (e) {
        this.modal.error = e.response?.data?.message || 'Action failed. Please try again.'
      } finally {
        this.modal.processing = false
      }
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.page {
  padding: 2rem;
  min-height: 100vh;
  background: #f0f4f0;
  font-family: 'DM Sans', sans-serif;
}

/* TOPBAR */
.topbar {
  display: flex; align-items: flex-start;
  justify-content: space-between; margin-bottom: 1.5rem;
}

.page-title {
  font-family: 'DM Serif Display', serif;
  font-size: 26px; color: #1a2e1c;
}

.page-sub { font-size: 13px; color: #7a9e7c; margin-top: 3px; }

.btn-refresh {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 16px;
  background: #fff; border: 1.5px solid #d1dfd2;
  border-radius: 9px; font-size: 13px; font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  color: #4a6a4c; cursor: pointer; transition: all 0.2s;
}
.btn-refresh:hover { border-color: #34a853; color: #34a853; }
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

.refresh-icon { transition: transform 0.3s; }
.spinning { animation: spin 0.7s linear infinite; }

/* TABS */
.tabs {
  display: flex; gap: 6px; margin-bottom: 1.5rem;
}

.tab {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 18px;
  border: 1.5px solid #d1dfd2;
  border-radius: 9px;
  background: #fff;
  font-size: 13.5px; font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  color: #6b7c6d; cursor: pointer; transition: all 0.2s;
}

.tab:hover { border-color: #34a853; color: #2d4a2f; }

.tab.active {
  background: #34a853; border-color: #34a853;
  color: #fff;
}

.tab-badge {
  background: #fff;
  color: #34a853;
  font-size: 11px; font-weight: 700;
  padding: 1px 7px; border-radius: 20px;
  min-width: 20px; text-align: center;
}

.tab.active .tab-badge {
  background: rgba(255,255,255,0.25);
  color: #fff;
}

/* ALERT */
.alert {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-radius: 10px;
  font-size: 13.5px; margin-bottom: 1.25rem; font-weight: 500;
}
.alert-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

/* SKELETON */
.skeleton-list { display: flex; flex-direction: column; gap: 10px; }
.skeleton-card {
  background: #fff; border-radius: 14px; padding: 1.1rem 1.5rem;
  display: flex; align-items: center; gap: 1rem;
  border: 1px solid #e8ede8;
}
.sk { background: #e8ede8; border-radius: 6px; animation: shimmer 1.4s infinite; }
.sk-avatar { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; }
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.sk-line-lg { height: 14px; width: 55%; }
.sk-line-sm { height: 12px; width: 38%; }
.sk-btn { width: 80px; height: 32px; border-radius: 8px; }

@keyframes shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* EMPTY */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 4rem 2rem;
  color: #9aad9b; gap: 1rem;
}
.empty-state p { font-size: 15px; }

/* FARMER LIST */
.farmer-list { display: flex; flex-direction: column; gap: 10px; }

.farmer-card {
  background: #fff;
  border: 1px solid #e4ebe4;
  border-radius: 14px;
  padding: 1.1rem 1.5rem;
  display: flex; align-items: center; gap: 1rem;
  transition: box-shadow 0.2s;
}
.farmer-card:hover { box-shadow: 0 2px 12px rgba(52,168,83,0.08); }

.farmer-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: #e8f5e9;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #34a853;
  flex-shrink: 0;
}

.farmer-info { flex: 1; min-width: 0; }

.farmer-name {
  font-size: 14.5px; font-weight: 600;
  color: #1a2e1c; margin-bottom: 5px;
}

.farmer-meta {
  display: flex; align-items: center; flex-wrap: wrap; gap: 14px;
}

.farmer-meta span {
  display: flex; align-items: center; gap: 5px;
  font-size: 12.5px; color: #7a9e7c;
}

.status-badge {
  padding: 4px 12px; border-radius: 20px;
  font-size: 11.5px; font-weight: 600;
  text-transform: capitalize; flex-shrink: 0;
}
.status-pending  { background: #fff8e1; color: #d97706; border: 1px solid #fde68a; }
.status-verified { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.status-rejected { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.farmer-actions {
  display: flex; gap: 8px; flex-shrink: 0;
}

.btn-approve, .btn-reject {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px;
  font-size: 13px; font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer; transition: all 0.2s;
}

.btn-approve { background: #34a853; color: #fff; border: none; }
.btn-approve:hover:not(:disabled) { background: #2a9248; }

.btn-reject { background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; }
.btn-reject:hover:not(:disabled) { background: #fee2e2; }

.btn-approve:disabled, .btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }

/* MODAL */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 1rem;
}

.modal {
  background: #fff; border-radius: 16px;
  width: 100%; max-width: 440px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
}

.modal-header {
  display: flex; align-items: center; gap: 12px;
  padding: 1.25rem 1.5rem;
}

.modal-approve { background: #f0fdf4; border-bottom: 1px solid #bbf7d0; }
.modal-reject  { background: #fef2f2; border-bottom: 1px solid #fecaca; }

.modal-icon {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.modal-approve .modal-icon { background: #dcfce7; color: #16a34a; }
.modal-reject  .modal-icon { background: #fee2e2; color: #dc2626; }

.modal-header h3 {
  font-family: 'DM Serif Display', serif;
  font-size: 18px; color: #1a2e1c;
}

.modal-body { padding: 1.5rem; }
.modal-body p { font-size: 14px; color: #4a6a4c; margin-bottom: 10px; }

.modal-farmer-name {
  font-size: 15px; font-weight: 600; color: #1a2e1c;
  background: #f5f7f5; padding: 10px 14px;
  border-radius: 8px; margin-bottom: 1.25rem;
}

.field label {
  display: block; font-size: 13px; font-weight: 600;
  color: #2d4a2f; margin-bottom: 7px;
}
.optional { font-weight: 400; color: #9aad9b; }

.field textarea {
  width: 100%; padding: 10px 12px;
  border: 1.5px solid #d1dfd2; border-radius: 10px;
  font-size: 13.5px; font-family: 'DM Sans', sans-serif;
  color: #1a2e1c; resize: vertical; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field textarea:focus {
  border-color: #34a853;
  box-shadow: 0 0 0 3px rgba(52,168,83,0.1);
}
.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #d1dfd2;
  border-radius: 10px;
  font-size: 13.5px;
  font-family: 'DM Sans', sans-serif;
  color: #1a2e1c;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field input:focus {
  border-color: #34a853;
  box-shadow: 0 0 0 3px rgba(52,168,83,0.1);
}

.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e8ede8; background: #fafcfa;
}

.btn-cancel {
  padding: 9px 18px; border-radius: 9px;
  border: 1.5px solid #d1dfd2; background: #fff;
  font-size: 13.5px; font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  color: #4a6a4c; cursor: pointer; transition: all 0.2s;
}
.btn-cancel:hover:not(:disabled) { border-color: #9aad9b; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner { animation: spin 0.8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .page { padding: 1.25rem; }
  .farmer-card { flex-wrap: wrap; }
  .farmer-actions { width: 100%; justify-content: flex-end; margin-top: 0.5rem; }
  .tabs { flex-wrap: wrap; }
}
</style>