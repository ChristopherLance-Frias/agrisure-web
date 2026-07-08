<template>
  <div class="claims-page">
    <!-- Page Header with Deep Green & Navy Gradient -->
    <div class="page-header">
      <div>
        <h2>Claims & Indemnity Dashboard</h2>
        <p>Manage agricultural damage claims, validation workflows, and PCIC schedule handovers.</p>
      </div>

      <button class="btn-refresh" @click="fetchClaims">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        Refresh Data
      </button>
    </div>

    <!-- Stats Summary Row -->
    <div class="stats-row">
      <div class="stat-card">
        <span>Total Portfolio Claims</span>
        <strong>{{ claims.length }}</strong>
      </div>

      <div class="stat-card status-border-submitted">
        <span>Submitted to MAO</span>
        <strong class="text-amber">{{ countByStatus('submitted_to_mao') }}</strong>
      </div>

      <div class="stat-card status-border-validated">
        <span>Validated Claims</span>
        <strong class="text-vibrant">{{ countByStatus('validated_by_mao') }}</strong>
      </div>

      <div class="stat-card status-border-pcic">
        <span>With PCIC Review</span>
        <strong class="text-navy">{{ countByStatus('submitted_to_pcic') }}</strong>
      </div>

      <div class="stat-card status-border-ready">
        <span>Ready for Claiming</span>
        <strong class="text-vibrant">{{ countByStatus('ready_for_claiming') }}</strong>
      </div>

      <div class="stat-card status-border-rejected">
        <span>Rejected Claims</span>
        <strong class="text-red">{{ countByStatus('rejected') }}</strong>
      </div>
    </div>

    <!-- Vibrant Workflow Status Tabs -->
    <div class="tabs-container">
      <button 
        class="tab-btn-item" 
        :class="{ active: activeTab === 'validated_by_mao' }"
        @click="activeTab = 'validated_by_mao'"
      >
        Validated by MAO (Claims)
        <span class="tab-badge bg-vibrant">{{ countByStatus('validated_by_mao') }}</span>
      </button>
      <button 
        class="tab-btn-item" 
        :class="{ active: activeTab === 'submitted_to_mao' }"
        @click="activeTab = 'submitted_to_mao'"
      >
        Submitted to MAO
        <span class="tab-badge bg-amber">{{ countByStatus('submitted_to_mao') }}</span>
      </button>
      <button 
        class="tab-btn-item" 
        :class="{ active: activeTab === 'rejected' }"
        @click="activeTab = 'rejected'"
      >
        Rejected
        <span class="tab-badge bg-red">{{ countByStatus('rejected') }}</span>
      </button>
    </div>

    <!-- Filters and Toolbar -->
    <div class="toolbar">
      <div class="search-wrapper">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search farmers, farm sectors, or crop variations..."
        />
      </div>

      <!-- Contextual Secondary Sub-Filter inside the tab selection -->
      <select v-model="subStatusFilter" class="custom-select">
        <option value="">All Secondary States</option>
        <option v-if="activeTab === 'validated_by_mao'" value="submitted_to_pcic">Submitted to PCIC</option>
        <option v-if="activeTab === 'validated_by_mao'" value="ready_for_claiming">Ready for Claiming</option>
        <option v-if="activeTab === 'validated_by_mao'" value="claimed">Fully Claimed</option>
      </select>
    </div>

    <!-- Data Table & States Loading -->
    <div v-if="loading" class="state-box content-loading">
      <div class="spinner"></div>
      <p>Fetching agricultural ledger logs...</p>
    </div>

    <div v-else-if="filteredClaims.length === 0" class="state-box empty-state">
      <p>No claims found matching the active tab filters.</p>
    </div>

    <div v-else class="table-card">
      <table>
        <thead>
          <tr>
            <th class="checkbox-col">
              <input
                type="checkbox"
                :checked="allSelectableChecked"
                :disabled="selectableClaims.length === 0"
                @change="toggleSelectAll($event)"
                @click.stop
              />
            </th>
            <th>Flag</th>
            <th>Farmer Profile</th>
            <th>Farm Registry</th>
            <th>Crop Class</th>
            <th>Season Cycle</th>
            <th>Incident Date</th>
            <th>Indemnity Amount</th>
            <th>Status Badge</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="claim in filteredClaims"
            :key="claim.id"
            class="clickable-row"
            :class="{ 'suspicious-row-bg': claim.is_suspicious }"
            @click="openClaim(claim.id)"
          >
            <td class="checkbox-col">
              <input
                type="checkbox"
                v-if="isSelectable(claim)"
                :checked="selectedIds.includes(claim.id)"
                @change="toggleSelect(claim.id)"
                @click.stop
              />
            </td>

            <!-- Suspicious Warning Column -->
            <td>
              <span v-if="claim.is_suspicious" class="suspicious-indicator" title="Flagged by system anomaly detector">
                ⚠ Risk
              </span>
              <span v-else class="clean-indicator">✓</span>
            </td>

            <td>
              <div class="farmer-info-cell">
                <strong>{{ farmerName(claim) }}</strong>
                <small>{{ farmerContact(claim) }}</small>
              </div>
            </td>

            <td>{{ claim.damage_report?.farm?.farm_name || '—' }}</td>
            <td>{{ claim.damage_report?.farm?.crop_type || '—' }}</td>
            <td>
              <span class="season-pill">
                {{ claim.damage_report?.season?.name || 'Unknown Cycle' }}
              </span>
            </td>
            <td>{{ formatDate(claim.damage_report?.damage_date) }}</td>
            <td>{{ claim.claim_amount ? peso(claim.claim_amount) : '—' }}</td>

            <td>
              <span class="status-badge" :class="claim.status">
                {{ statusLabel(claim.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Floating Batch Action Bar -->
    <Teleport to="body">
      <div v-if="selectedIds.length > 0" class="batch-bar">
        <div class="batch-bar-inner">
          <span>⚡ <strong>{{ selectedIds.length }}</strong> claims flagged for batch actions</span>

          <div class="batch-actions">
            <button class="batch-btn ghost" @click="clearSelection">
              Cancel Selection
            </button>

            <button
              v-if="batchActionType === 'submit_to_pcic'"
              class="batch-btn primary"
              :disabled="batchProcessing"
              @click="batchSubmitToPcic"
            >
              {{ batchProcessing ? 'Processing Batch...' : 'Forward Selected to PCIC' }}
            </button>

            <button
              v-else-if="batchActionType === 'mark_claimed'"
              class="batch-btn primary"
              :disabled="batchProcessing"
              @click="batchMarkClaimed"
            >
              {{ batchProcessing ? 'Updating...' : 'Mark selected as Claimed' }}
            </button>

            <span v-else class="batch-mixed-hint">
              Align selections to matching statuses to run swift workflows.
            </span>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Inspection & Interaction Modal Details -->
    <Teleport to="body">
      <div v-if="selectedClaim" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h3>{{ farmerName(selectedClaim) }}</h3>
              <p>
                Registry: {{ selectedClaim.damage_report?.farm?.farm_name || 'Farm' }}
                •
                Crop: {{ selectedClaim.damage_report?.farm?.crop_type || 'Crop' }}
              </p>
            </div>
            <button class="close-btn" @click="closeModal">×</button>
          </div>

          <!-- Suspicious Flag Callout banner if true -->
          <div v-if="selectedClaim.is_suspicious" class="suspicious-banner">
            <strong>⚠ SUSPICIOUS APPLICATION ALERT</strong>
            <p>System flagged this file due to mismatched yield history vs local regional parameters.</p>
          </div>

          <div class="details-grid">
            <div class="info-card">
              <h4>Farmer Information</h4>
              <div class="info-row"><span>Full Name</span><strong>{{ farmerName(selectedClaim) }}</strong></div>
              <div class="info-row"><span>Mobile Context</span><strong>{{ farmerContact(selectedClaim) }}</strong></div>
              <div class="info-row"><span>Home Address</span><strong>{{ farmerAddress(selectedClaim) }}</strong></div>
            </div>

            <div class="info-card">
              <h4>Farm & Incident Metadata</h4>
              <div class="info-row"><span>Farm Identifier</span><strong>{{ selectedClaim.damage_report?.farm?.farm_name || '—' }}</strong></div>
              <div class="info-row"><span>Registered Area</span><strong>{{ selectedClaim.damage_report?.farm?.farm_area || '—' }} ha</strong></div>
              <div class="info-row"><span>Climatic Cycle</span><strong>{{ selectedClaim.damage_report?.season?.name || '—' }}</strong></div>
              <div class="info-row"><span>Incident Date</span><strong>{{ formatDate(selectedClaim.damage_report?.damage_date) }}</strong></div>
              <div class="info-row"><span>Primary Cause</span><strong>{{ selectedClaim.damage_report?.damage_cause || '—' }}</strong></div>
            </div>
          </div>

          <div class="info-card full">
            <h4>Claim Assessment & Indemnity Track</h4>
            <div class="info-row"><span>Calculated Valuation</span><strong>{{ selectedClaim.claim_amount ? peso(selectedClaim.claim_amount) : 'Pending Assessment' }}</strong></div>
            <div class="info-row"><span>Target Release Date</span><strong>{{ formatDate(selectedClaim.claim_schedule) }}</strong></div>
            <div class="info-row"><span>Disbursement Desk</span><strong>{{ selectedClaim.claim_venue || '—' }}</strong></div>
            <div class="info-row"><span>Internal Remarks</span><strong>{{ selectedClaim.pcic_remarks || '—' }}</strong></div>
            <div class="info-row">
              <span>Workflow State</span>
              <span class="status-badge" :class="selectedClaim.status">{{ statusLabel(selectedClaim.status) }}</span>
            </div>
          </div>

          <!-- Interaction Logic Block with Visual Locks -->
          <div class="action-section">
            <!-- LOCK STATES: Read-only for Validated / Rejected status states -->
            <template v-if="selectedClaim.status === 'validated_by_mao'">
              <div class="locked-state-msg validated-lock">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                ✓ Validated - Registry Record Locked
              </div>
              <button class="action-btn primary space-left" @click="submitToPcic(selectedClaim.id)">
                Forward Out to PCIC File Desk
              </button>
            </template>

            <template v-else-if="selectedClaim.status === 'rejected'">
              <div class="locked-state-msg rejected-lock">
                ✕ Rejected - Case Terminated & Locked
              </div>
            </template>

            <template v-else-if="selectedClaim.status === 'submitted_to_pcic' || selectedClaim.status === 'ready_for_claiming' || selectedClaim.status === 'claimed'">
              <div class="locked-state-msg legacy-lock">
                🔒 Active External Processing Chain - Ledger Lock Active
              </div>
              <button v-if="selectedClaim.status === 'ready_for_claiming'" class="action-btn success space-left" @click="markClaimed(selectedClaim.id)">
                Mark Registry File as Disbursed
              </button>
            </template>

            <!-- WRITE STATE: Active Action Buttons if purely 'submitted_to_mao' -->
            <template v-else-if="selectedClaim.status === 'submitted_to_mao'">
              <button class="action-btn success" @click="updateClaimStatus(selectedClaim.id, 'validated_by_mao')">
                Approve & Validate Claim
              </button>
              <button class="action-btn danger" @click="updateClaimStatus(selectedClaim.id, 'rejected')">
                Reject Ledger Profile
              </button>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'http://192.168.100.173:8000'

const BATCHABLE_STATUSES = {
  validated_by_mao: { endpoint: 'submit-to-pcic', actionType: 'submit_to_pcic' },
  ready_for_claiming: { endpoint: 'claimed', actionType: 'mark_claimed' },
}

export default {
  name: 'MaoClaimsPage',

  data() {
    return {
      claims: [],
      selectedClaim: null,
      search: '',
      subStatusFilter: '',
      loading: false,
      activeTab: 'validated_by_mao', // Defaulting to claims list as ordered

      selectedIds: [],
      batchProcessing: false,
      showPcicModal: false,
    }
  },

  computed: {
    filteredClaims() {
      let list = this.claims || []

      // 1. Core Workflow Tab Isolation Filtering
      if (this.activeTab === 'validated_by_mao') {
        // Keeps all validated, and advanced sub-statuses within the active operational claims wing
        list = list.filter(claim => ['validated_by_mao', 'submitted_to_pcic', 'ready_for_claiming', 'claimed'].includes(claim.status))
      } else {
        list = list.filter(claim => claim.status === this.activeTab)
      }

      // 2. Sub-status breakdown selections
      if (this.subStatusFilter && this.activeTab === 'validated_by_mao') {
        list = list.filter(claim => claim.status === this.subStatusFilter)
      }

      // 3. Robust Multi-Field Fuzzy Match Search
      if (this.search.trim()) {
        const q = this.search.toLowerCase().trim()
        list = list.filter(claim =>
          this.farmerName(claim).toLowerCase().includes(q) ||
          String(claim.damage_report?.farm?.farm_name || '').toLowerCase().includes(q) ||
          String(claim.damage_report?.farm?.crop_type || '').toLowerCase().includes(q)
        )
      }

      return list
    },

    selectableClaims() {
      return this.filteredClaims.filter(claim => this.isSelectable(claim))
    },

    allSelectableChecked() {
      if (this.selectableClaims.length === 0) return false
      return this.selectableClaims.every(claim => this.selectedIds.includes(claim.id))
    },

    batchActionType() {
      if (this.selectedIds.length === 0) return null
      const selectedClaims = this.claims.filter(claim => this.selectedIds.includes(claim.id))
      const statuses = new Set(selectedClaims.map(claim => claim.status))
      if (statuses.size !== 1) return null
      const status = [...statuses][0]
      return BATCHABLE_STATUSES[status]?.actionType || null
    },
  },

  watch: {
    filteredClaims() {
      const validIds = this.selectableClaims.map(claim => claim.id)
      this.selectedIds = this.selectedIds.filter(id => validIds.includes(id))
    },
    activeTab() {
      this.selectedIds = []
      this.subStatusFilter = ''
    }
  },

  mounted() {
    this.fetchClaims()
  },

  methods: {
    authHeaders() {
      const token = localStorage.getItem('mao_token') || localStorage.getItem('token')
      return {
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/json',
        },
      }
    },

    isSelectable(claim) {
      return Object.prototype.hasOwnProperty.call(BATCHABLE_STATUSES, claim.status)
    },

    async fetchClaims() {
      this.loading = true
      try {
        const response = await axios.get(`${API_BASE}/api/claims`, this.authHeaders())
        this.claims = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (error) {
        console.error(error)
        alert('Failed to synchronize local agricultural database ledger records.')
      } finally {
        this.loading = false
      }
    },

    async openClaim(id) {
      try {
        const response = await axios.get(`${API_BASE}/api/claims/${id}`, this.authHeaders())
        this.selectedClaim = response.data
      } catch (error) {
        console.error(error)
        alert('Could not open detailed telemetry view of chosen case file.')
      }
    },

    closeModal() {
      this.selectedClaim = null
    },

    async updateClaimStatus(id, targetStatus) {
      const promptTxt = targetStatus === 'validated_by_mao' ? 'Validate this claim?' : 'Reject this entry?'
      if (!confirm(promptTxt)) return
      try {
        await axios.patch(`${API_BASE}/api/claims/${id}/status`, { status: targetStatus }, this.authHeaders())
        await this.fetchClaims()
        this.closeModal()
      } catch (error) {
        console.error(error)
        alert('Error writing processing transaction parameters to remote node.')
      }
    },

    async submitToPcic(id) {
      if (!confirm('Forward registry files to the PCIC clearing department?')) return
      try {
        await axios.patch(`${API_BASE}/api/claims/${id}/submit-to-pcic`, {}, this.authHeaders())
        await this.fetchClaims()
        await this.openClaim(id)
      } catch (error) {
        console.error(error)
        alert(error.response?.data?.message || 'Handover dispatch error.')
      }
    },

    toggleSelect(id) {
      const index = this.selectedIds.indexOf(id)
      if (index === -1) {
        this.selectedIds.push(id)
      } else {
        this.selectedIds.splice(index, 1)
      }
    },

    toggleSelectAll(event) {
      if (event.target.checked) {
        this.selectedIds = this.selectableClaims.map(claim => claim.id)
      } else {
        this.selectedIds = []
      }
    },

    clearSelection() {
      this.selectedIds = []
    },

    async runBatchAction(endpoint, confirmMessage) {
      if (this.selectedIds.length === 0) return
      if (!confirm(confirmMessage)) return

      this.batchProcessing = true
      const idsToProcess = [...this.selectedIds]
      const failedIds = []

      try {
        const results = await Promise.allSettled(
          idsToProcess.map(id =>
            axios.patch(`${API_BASE}/api/claims/${id}/${endpoint}`, {}, this.authHeaders())
          )
        )

        results.forEach((result, i) => {
          if (result.status === 'rejected') failedIds.push(idsToProcess[i])
        })

        await this.fetchClaims()

        if (failedIds.length > 0) {
          alert(`${failedIds.length} operations timed out or failed. Flagged records kept open for manual retry execution loop.`)
          this.selectedIds = failedIds
        } else {
          this.selectedIds = []
        }
      } catch (error) {
        console.error(error)
        alert('Failed execution chain on multiple targets.')
      } finally {
        this.batchProcessing = false
      }
    },

    batchSubmitToPcic() {
      return this.runBatchAction(
        BATCHABLE_STATUSES.validated_by_mao.endpoint,
        `Dispatch ${this.selectedIds.length} documents out to PCIC processing centers?`
      )
    },

    batchMarkClaimed() {
      return this.runBatchAction(
        BATCHABLE_STATUSES.ready_for_claiming.endpoint,
        `Mark ${this.selectedIds.length} balances as securely paid and claimed?`
      )
    },

    async markClaimed(id) {
      if (!confirm('Mark claim portfolio collection finalized?')) return
      try {
        await axios.patch(`${API_BASE}/api/claims/${id}/claimed`, {}, this.authHeaders())
        await this.fetchClaims()
        this.closeModal()
      } catch (error) {
        console.error(error)
        alert('Error closing local balance sheet portfolio record entry.')
      }
    },

    farmerName(claim) {
      const user = claim.damage_report?.insurance_application?.farm?.farmer_profile?.user
      if (!user) return 'Unregistered Entity'
      return [user.first_name, user.middle_name, user.last_name, user.extension_name]
        .filter(Boolean)
        .join(' ')
    },

    farmerContact(claim) {
      return claim.damage_report?.insurance_application?.farm?.farmer_profile?.user?.phone_number || '—'
    },

    farmerAddress(claim) {
      return claim.damage_report?.insurance_application?.farm?.farmer_profile?.address || '—'
    },

    countByStatus(status) {
      return this.claims.filter(claim => claim.status === status).length
    },

    statusLabel(status) {
      const map = {
        submitted_to_mao: 'Submitted to MAO',
        validated_by_mao: 'Validated by MAO',
        submitted_to_pcic: 'Submitted to PCIC',
        ready_for_claiming: 'Ready for Claiming',
        claimed: 'Disbursed (Claimed)',
        rejected: 'Rejected File',
      }
      return map[status] || status || '—'
    },

    formatDate(date) {
      if (!date) return '—'
      return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },

    peso(amount) {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
      }).format(Number(amount || 0))
    },
  },
}
</script>

<style scoped>
/* Main Structural Framework Layout */
.claims-page {
  min-height: 100vh;
  padding: 2rem;
  background-color: #F0F4F0; /* Soft Sage Archetype Background */
  font-family: system-ui, -apple-system, sans-serif;
  color: #1A3320; /* Primary Deep Green text definition */
}

/* Page Header Custom Linear Deep Green & Navy Gradient Gradient */
.page-header {
  background: linear-gradient(135deg, #1A3320 0%, #1E3A8A 100%);
  color: #FFFFFF;
  border-radius: 14px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(26, 51, 32, 0.15);
}

.page-header h2 {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}

.page-header p {
  margin: 0.5rem 0 0 0;
  opacity: 0.85;
  font-size: 0.95rem;
}

.btn-refresh {
  border: none;
  background-color: #34A853; /* Vibrant Green Action Button */
  color: #FFFFFF;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(52, 168, 83, 0.3);
  transition: transform 0.2s, background-color 0.2s;
}

.btn-refresh:hover {
  background-color: #2c9046;
  transform: translateY(-1px);
}

/* Card Metrics Grid Component Structuring */
.stats-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: #FFFFFF;
  border: 1px solid #1E3A8A; /* Subtle Navy border */
  border-radius: 14px;
  padding: 1.2rem;
  box-shadow: 0 2px 6px rgba(30, 58, 138, 0.04);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card span {
  color: #1E3A8A; /* Accents Navy Graying */
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-card strong {
  display: block;
  margin-top: 0.5rem;
  font-size: 1.8rem;
  font-weight: 800;
  color: #1A3320;
}

/* Stat Side Accent Badging Status Boundaries */
.status-border-submitted { border-left: 4px solid #D97706; }
.status-border-validated { border-left: 4px solid #34A853; }
.status-border-pcic { border-left: 4px solid #1E3A8A; }
.status-border-ready { border-left: 4px solid #34A853; }
.status-border-rejected { border-left: 4px solid #DC2626; }

.text-amber { color: #D97706 !important; }
.text-vibrant { color: #34A853 !important; }
.text-navy { color: #1E3A8A !important; }
.text-red { color: #DC2626 !important; }

/* Agile & High Colorful UI Status Tabs Framework */
.tabs-container {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  background-color: #FFFFFF;
  padding: 0.5rem;
  border-radius: 14px;
  border: 1px solid rgba(30, 58, 138, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.tab-btn-item {
  border: none;
  background: transparent;
  padding: 0.85rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1E3A8A;
  cursor: pointer;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-btn-item:hover {
  background-color: #F0F4F0;
  color: #1A3320;
}

/* Active Pill Highlight Logic Styles */
.tab-btn-item.active {
  background-color: #34A853; /* Vibrant Green active indicator */
  color: #FFFFFF !important;
  box-shadow: 0 4px 12px rgba(52, 168, 83, 0.25);
}

.tab-badge {
  padding: 0.15rem 0.5rem;
  border-radius: 99px;
  font-size: 0.75rem;
  color: #FFFFFF;
  font-weight: 800;
}
.bg-vibrant { background-color: #1A3320; }
.bg-amber { background-color: #D97706; }
.bg-red { background-color: #DC2626; }
.tab-btn-item.active .tab-badge {
  background-color: #FFFFFF !important;
  color: #34A853 !important;
}

/* Modern Input Search & Filtering Toolbar */
.toolbar {
  background-color: #FFFFFF;
  border: 1px solid rgba(30, 58, 138, 0.1);
  border-radius: 14px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.01);
}

.search-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #1E3A8A;
  opacity: 0.6;
}

.toolbar input {
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 2.8rem;
  border-radius: 10px;
  border: 1px solid rgba(30, 58, 138, 0.2);
  outline: none;
  font-size: 0.9rem;
  color: #1A3320;
  background-color: #F0F4F0;
  transition: border-color 0.2s, background-color 0.2s;
}

.toolbar input:focus {
  border-color: #34A853;
  background-color: #FFFFFF;
}

.custom-select {
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  border: 1px solid rgba(30, 58, 138, 0.2);
  background-color: #FFFFFF;
  color: #1A3320;
  font-weight: 600;
  outline: none;
  cursor: pointer;
}

/* Interactive Data Table Component View */
.table-card {
  background-color: #FFFFFF;
  border: 1px solid rgba(30, 58, 138, 0.1);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  background-color: #F0F4F0;
  padding: 1.1rem 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #1A3320;
  border-bottom: 2px solid rgba(30, 58, 138, 0.08);
}

td {
  padding: 1.1rem 1rem;
  border-top: 1px solid #F0F4F0;
  font-size: 0.9rem;
  color: #1A3320;
  vertical-align: middle;
}

/* Row Expansion States and Suspicious Color Highlight Parameters */
.clickable-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.clickable-row:hover {
  background-color: #F0FDF4 !important; /* Soft Sage Expanded Highlight */
}

.suspicious-row-bg {
  background-color: rgba(234, 88, 12, 0.04);
}

/* Suspicious Status Flags Column Aesthetics */
.suspicious-indicator {
  background-color: #EA580C; /* Suspicious Orange Warning Badge */
  color: #FFFFFF;
  font-weight: 700;
  font-size: 0.72rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  white-space: nowrap;
}

.clean-indicator {
  color: #34A853;
  font-weight: 700;
  opacity: 0.5;
}

.farmer-info-cell strong {
  display: block;
  color: #1A3320;
}

.farmer-info-cell small {
  display: block;
  color: #1E3A8A;
  opacity: 0.75;
  margin-top: 0.15rem;
}

.season-pill {
  background-color: #F0F4F0;
  color: #1A3320;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
}

/* Color Palette Semantic State Badges System */
.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  display: inline-block;
  text-align: center;
}

.status-badge.submitted_to_mao,
.status-badge.submitted_to_pcic {
  background-color: rgba(217, 119, 6, 0.12);
  color: #D97706; /* Warm Amber for submitted states */
}

.status-badge.validated_by_mao,
.status-badge.ready_for_claiming {
  background-color: rgba(52, 168, 83, 0.12);
  color: #34A853; /* Vibrant Green Validation checks */
}

.status-badge.rejected {
  background-color: rgba(220, 38, 38, 0.12);
  color: #DC2626; /* Semantic Red Rejections */
}

.status-badge.claimed {
  background-color: rgba(30, 58, 138, 0.1);
  color: #1E3A8A; /* Deep Navy Processing Completion */
}

/* Bottom Bulk / Floating Action Strip Bar */
.batch-bar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998;
  width: min(800px, 92%);
}

.batch-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  background-color: #1A3320; /* Deep Primary Green Chassis Foundation */
  color: #FFFFFF;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(26, 51, 32, 0.35);
  border: 1px solid rgba(52, 168, 83, 0.3);
}

.batch-btn {
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
}

.batch-btn.ghost {
  background: transparent;
  color: #FFFFFF;
  opacity: 0.8;
}

.batch-btn.ghost:hover { opacity: 1; }

.batch-btn.primary {
  background-color: #34A853; /* Vibrant Green Action trigger */
  color: #FFFFFF;
  box-shadow: 0 4px 10px rgba(52, 168, 83, 0.2);
}

/* Modals Overlay Configurations */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(26, 51, 32, 0.6); /* Deep Green Dimmer Backing */
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal {
  width: min(900px, 100%);
  max-height: 88vh;
  overflow-y: auto;
  background-color: #FFFFFF; /* Crisp White Cards background */
  border-radius: 14px;
  padding: 2rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #F0F4F0;
  padding-bottom: 1.2rem;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #1A3320;
  font-weight: 800;
}

.close-btn {
  border: none;
  background-color: #F0F4F0;
  color: #1A3320;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Suspicious Application Top Bar Alert Banner Inside Modal */
.suspicious-banner {
  background-color: rgba(234, 88, 12, 0.1);
  border: 1px solid #EA580C;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: #EA580C;
}
.suspicious-banner strong { display: block; font-size: 0.95rem; margin-bottom: 0.2rem; }
.suspicious-banner p { margin: 0; font-size: 0.88rem; opacity: 0.9; }

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.info-card {
  background-color: #F0F4F0; /* Soft Sage internal background blocks */
  border: 1px solid rgba(30, 58, 138, 0.05);
  border-radius: 12px;
  padding: 1.25rem;
}

.info-card.full { margin-top: 1.5rem; }

.info-card h4 {
  margin: 0 0 1rem 0;
  color: #1A3320;
  font-size: 0.95rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.65rem 0;
  border-bottom: 1px dashed rgba(30, 58, 138, 0.15);
  font-size: 0.9rem;
}

.info-row span { color: #1E3A8A; font-weight: 500; }
.info-row strong { color: #1A3320; font-weight: 700; }

/* Interactive Workflow Guarded States Block Layout Rules */
.action-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #F0F4F0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-btn {
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 12px;
  color: #FFFFFF;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.action-btn.primary { background-color: #1E3A8A; }
.action-btn.success { background-color: #34A853; }
.action-btn.danger { background-color: #DC2626; }
.space-left { margin-left: auto; }

/* Interactive Logic State Locks styling */
.locked-state-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
}

.validated-lock {
  background-color: rgba(52, 168, 83, 0.15);
  color: #34A853;
  border: 1px solid #34A853;
}

.rejected-lock {
  background-color: rgba(220, 38, 38, 0.15);
  color: #DC2626;
  border: 1px solid #DC2626;
}

.legacy-lock {
  background-color: #F0F4F0;
  color: #1A3320;
  border: 1px solid rgba(30, 58, 138, 0.2);
}

/* Loading Animation Spinners */
.spinner {
  border: 3px solid rgba(52, 168, 83, 0.1);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border-left-color: #34A853;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Layout Media Adaptability Breakpoints queries */
@media (max-width: 1200px) {
  .stats-row { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .stats-row, .details-grid { grid-template-columns: 1fr; }
  .toolbar, .tabs-container { flex-direction: column; align-items: stretch; }
  .table-card { overflow-x: auto; }
  .action-section { flex-direction: column; align-items: stretch; }
  .space-left { margin-left: 0; }
}
</style>