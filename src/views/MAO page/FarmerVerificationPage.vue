<template>
  <div class="page">

    <!-- Top bar (matches dashboard header) -->
    <header class="top-header">
      <div class="header-title-group">
        <h1>Farmer Verification</h1>
        <p>Review and manage farmer registration requests.</p>
      </div>

      <div class="header-actions">
        <button class="btn-refresh" @click="fetchFarmers" :disabled="isLoading">
          <svg :class="['refresh-icon', { spinning: isLoading }]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>

        <div class="v-divider"></div>

        <!-- User Profile -->
        <div class="user-profile">
          <div class="user-avatar">
            {{ currentUser.initials }}
          </div>
          <div class="user-info">
            <p class="user-name">{{ currentUser.name }}</p>
            <p class="user-role">{{ currentUser.role }}</p>
          </div>
        </div>
      </div>
    </header>

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
      <div
        v-for="farmer in farmers"
        :key="farmer.id"
        class="farmer-card"
        tabindex="0"
        @click="openDetail(farmer)"
        @keyup.enter="openDetail(farmer)"
      >

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
          <button class="btn-approve" @click.stop="openModal(farmer, 'approve')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Approve
          </button>
          <button class="btn-reject" @click.stop="openModal(farmer, 'reject')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Reject
          </button>
        </div>

        <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>

      </div>
    </div>

    <!-- Farmer Detail Modal -->
    <div v-if="detail.show" class="modal-overlay" @click.self="closeDetail">
      <div class="modal detail-modal">
        <div class="modal-header detail-header">
          <div class="detail-avatar">{{ detail.farmer ? initials(detail.farmer) : '' }}</div>
          <div class="detail-header-text">
            <h3>{{ detail.farmer?.last_name }}, {{ detail.farmer?.first_name }} {{ detail.farmer?.middle_name || '' }}</h3>
            <span :class="['status-badge', `status-${detail.farmer?.account_status}`]">
              {{ detail.farmer?.account_status }}
            </span>
          </div>
          <button class="modal-close" @click="closeDetail">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body detail-body">
          <div class="detail-grid">
            <div class="detail-field">
              <span class="detail-label">Email Address</span>
              <span class="detail-value">{{ detail.farmer?.email || '—' }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">Phone Number</span>
              <span class="detail-value">{{ detail.farmer?.phone_number || '—' }}</span>
            </div>
            <div class="detail-field" v-if="detail.farmer?.barangay">
              <span class="detail-label">Barangay</span>
              <span class="detail-value">{{ detail.farmer?.barangay }}</span>
            </div>
            <div class="detail-field" v-if="detail.farmer?.address">
              <span class="detail-label">Address</span>
              <span class="detail-value">{{ detail.farmer?.address }}</span>
            </div>
            <div class="detail-field" v-if="detail.farmer?.rsbsa_reference">
              <span class="detail-label">RSBSA Number</span>
              <span class="detail-value">{{ detail.farmer?.rsbsa_reference }}</span>
            </div>
            <div class="detail-field" v-if="detail.farmer?.farm_size">
              <span class="detail-label">Farm Size</span>
              <span class="detail-value">{{ detail.farmer?.farm_size }} ha</span>
            </div>
            <div class="detail-field" v-if="detail.farmer?.crop_type">
              <span class="detail-label">Primary Crop</span>
              <span class="detail-value">{{ detail.farmer?.crop_type }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">Registered</span>
              <span class="detail-value">{{ formatDate(detail.farmer?.created_at) }}</span>
            </div>
          </div>

          <div v-if="detail.farmer?.remarks" class="detail-remarks">
            <span class="detail-label">Remarks</span>
            <p>{{ detail.farmer?.remarks }}</p>
          </div>
        </div>

        <div class="modal-footer" v-if="detail.farmer?.account_status === 'pending'">
          <button class="btn-reject" @click="openModal(detail.farmer, 'reject'); closeDetail()">
            Reject
          </button>
          <button class="btn-approve" @click="openModal(detail.farmer, 'approve'); closeDetail()">
            Approve
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
            <label>RSBSA Number <span class="required">*</span></label>
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

const API_BASE = 'http://192.168.216.1:8000'

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

      detail: {
        show: false,
        farmer: null,
      },

      currentUser: { name: 'Christopher', role: 'MAO Officer', initials: 'CP' },
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
        return
      }

      this.modal.processing = true
      this.modal.error = ''

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

    openDetail(farmer) {
      this.detail.farmer = farmer
      this.detail.show = true
    },

    closeDetail() {
      this.detail.show = false
      this.detail.farmer = null
    },
  },
}
</script>

<style scoped>
* { box-sizing: border-box; }

.page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #F8FAF8;
  min-height: 100%;
}

.page > *:not(.top-header):not(.modal-overlay) {
  padding-left: 1.75rem;
  padding-right: 1.75rem;
}

.page > .top-header + *:not(.modal-overlay) { margin-top: 1.4rem; }

/* TOP HEADER (copied from dashboard) */
.top-header {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #E7F0EC;
  flex-shrink: 0;
  z-index: 20;
  padding: 0px 15px;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-group h1 {
  font-size: 18px;
  font-weight: 700;
  color: #0F212F;
  letter-spacing: -0.01em;
}

.header-title-group p {
  font-size: 12px;
  color: #64748b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.v-divider {
  height: 24px;
  width: 1px;
  background-color: #E7F0EC;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  box-shadow: 0 0 0 2px rgba(17, 109, 62, 0.2);
}

.user-name {
  font-size: 12px;
  font-weight: 700;
  color: #0F212F;
  line-height: 1.2;
}

.user-role {
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #FFFFFF;
  border: 1.5px solid #E0EAE3;
  color: #116D3E;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 9px 15px;
  border-radius: 9px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.btn-refresh:hover:not(:disabled) { border-color: #116D3E; background: #F1F6F2; }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

.refresh-icon.spinning { animation: spin 0.9s linear infinite; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* TABS */
.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 1.4rem;
  border-bottom: 1px solid #EAF1EC;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  border-bottom: 2.5px solid transparent;
  color: #5c6b64;
  font-size: 0.86rem;
  font-weight: 600;
  padding: 10px 6px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.tab:hover { color: #116D3E; }

.tab.active {
  color: #116D3E;
  border-bottom-color: #116D3E;
}

.tab-badge {
  background: #D29539;
  color: #FFFFFF;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
}

/* ALERT */
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

/* SKELETON */
.skeleton-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 1.75rem; }

.skeleton-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 14px;
  padding: 1rem 1.2rem;
}

.sk { background: #EAF1EC; border-radius: 8px; animation: pulse 1.4s ease-in-out infinite; }
.sk-avatar { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; }
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.sk-line-lg { height: 12px; width: 40%; }
.sk-line-sm { height: 10px; width: 60%; }
.sk-btn { width: 90px; height: 32px; border-radius: 8px; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* EMPTY STATE */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 3.5rem 1rem;
  color: #8a9791;
  text-align: center;
}

.empty-state svg { color: #C7D6CB; }
.empty-state p { font-size: 0.88rem; }
.empty-state strong { color: #5c6b64; text-transform: capitalize; }

/* FARMER LIST */
.farmer-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 1.75rem; }

.farmer-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 14px;
  padding: 1rem 1.2rem;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
}

.farmer-card:hover {
  border-color: #116D3E;
  box-shadow: 0 10px 24px rgba(15, 33, 47, 0.08);
  transform: translateY(-1px);
}

.farmer-card:focus-visible {
  outline: none;
  border-color: #116D3E;
  box-shadow: 0 0 0 3px rgba(17, 109, 62, 0.16);
}

.farmer-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(17, 109, 62, 0.1);
  color: #116D3E;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.82rem;
  flex-shrink: 0;
}

.farmer-info { flex: 1; min-width: 0; }

.farmer-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: #0F212F;
  margin-bottom: 4px;
}

.farmer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.farmer-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76rem;
  color: #5c6b64;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 11px;
  border-radius: 999px;
  text-transform: capitalize;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-pending   { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.status-approved  { background: rgba(17, 109, 62, 0.1);   color: #116D3E; }
.status-rejected  { background: rgba(193, 71, 61, 0.1);   color: #C1473D; }
.status-suspended { background: rgba(107, 91, 149, 0.1);  color: #6B5B95; }

.farmer-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.chevron { color: #C7D6CB; flex-shrink: 0; }

/* BUTTONS */
.btn-approve, .btn-reject {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 8px 13px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.15s ease;
}

.btn-approve {
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  box-shadow: 0 6px 14px rgba(17, 109, 62, 0.28);
}
.btn-approve:hover:not(:disabled) { transform: translateY(-1px); }
.btn-approve:disabled { opacity: 0.65; cursor: not-allowed; }

.btn-reject {
  background: #FFFFFF;
  color: #C1473D;
  border: 1.5px solid rgba(193, 71, 61, 0.3);
}
.btn-reject:hover:not(:disabled) { background: rgba(193, 71, 61, 0.06); }
.btn-reject:disabled { opacity: 0.65; cursor: not-allowed; }

/* MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 33, 47, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}

.modal {
  background: #FFFFFF;
  border-radius: 18px;
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  box-shadow: 0 30px 70px rgba(15, 33, 47, 0.4);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1.3rem 1.4rem;
}

.modal-approve { background: #E7F0EC; }
.modal-reject  { background: #FBEAE8; }

.modal-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-approve .modal-icon { background: #116D3E; color: #FFFFFF; }
.modal-reject .modal-icon  { background: #C1473D; color: #FFFFFF; }

.modal-header h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0F212F;
}

.modal-body { padding: 1.4rem; }

.modal-body p { font-size: 0.86rem; color: #5c6b64; }

.modal-farmer-name {
  font-size: 1rem;
  font-weight: 700;
  color: #0F212F;
  margin: 6px 0 1.1rem;
}

.field { margin-bottom: 0.6rem; }

.field label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: #0F212F;
  margin-bottom: 6px;
}

.field .required { color: #C1473D; }
.field .optional { color: #8a9791; font-weight: 400; }

.field input, .field textarea {
  width: 100%;
  border: 1.5px solid #d7e2d8;
  border-radius: 9px;
  padding: 10px 12px;
  font-size: 0.86rem;
  font-family: inherit;
  color: #0F212F;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field input:focus, .field textarea:focus {
  border-color: #116D3E;
  box-shadow: 0 0 0 3px rgba(17, 109, 62, 0.14);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 1rem 1.4rem 1.4rem;
}

.btn-cancel {
  background: none;
  border: 1.5px solid #E0EAE3;
  color: #5c6b64;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: 9px;
  cursor: pointer;
}
.btn-cancel:hover:not(:disabled) { background: #F1F6F2; }
.btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner { animation: spin 0.8s linear infinite; }

/* DETAIL MODAL */
.detail-modal { max-width: 480px; }

.detail-header {
  align-items: center;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  position: relative;
}

.detail-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255,255,255,0.16);
  border: 1.5px solid rgba(255,255,255,0.3);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.detail-header-text { flex: 1; min-width: 0; }

.detail-header-text h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 6px;
}

.detail-header .status-badge { background: rgba(255,255,255,0.2); color: #FFFFFF; }

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255,255,255,0.14);
  border: none;
  color: #FFFFFF;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.modal-close:hover { background: rgba(255,255,255,0.24); }

.detail-body { padding: 1.4rem; }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-field { display: flex; flex-direction: column; gap: 3px; }

.detail-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #8a9791;
}

.detail-value {
  font-size: 0.86rem;
  font-weight: 600;
  color: #0F212F;
  word-break: break-word;
}

.detail-remarks {
  margin-top: 1.2rem;
  padding-top: 1rem;
  border-top: 1px solid #EAF1EC;
}

.detail-remarks p {
  font-size: 0.84rem;
  color: #5c6b64;
  margin-top: 4px;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .farmer-card { flex-wrap: wrap; }
  .farmer-actions { width: 100%; }
  .btn-approve, .btn-reject { flex: 1; justify-content: center; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>