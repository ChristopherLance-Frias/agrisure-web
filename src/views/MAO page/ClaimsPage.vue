<template>
  <div class="claims-page">
    <div class="page-header">
      <div>
        <h2>Claims & Indemnity</h2>
        <p>Manage validated damage claims, PCIC results, and claiming schedules.</p>
      </div>

      <button class="btn-refresh" @click="fetchClaims">Refresh</button>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <span>Total Claims</span>
        <strong>{{ claims.length }}</strong>
      </div>

      <div class="stat-card">
        <span>Validated</span>
        <strong>{{ countByStatus('validated_by_mao') }}</strong>
      </div>

      <div class="stat-card">
        <span>Submitted to PCIC</span>
        <strong>{{ countByStatus('submitted_to_pcic') }}</strong>
      </div>

      <div class="stat-card">
        <span>Ready for Claiming</span>
        <strong>{{ countByStatus('ready_for_claiming') }}</strong>
      </div>

      <div class="stat-card">
        <span>Claimed</span>
        <strong>{{ countByStatus('claimed') }}</strong>
      </div>

      <div class="stat-card">
        <span>Rejected</span>
        <strong>{{ countByStatus('rejected') }}</strong>
      </div>
    </div>

    <div class="tabs-container">
      <button 
        class="tab-btn-item" 
        :class="{ active: activeTab === 'current' }"
        @click="setSeasonTab('current')"
      >
        Current Season Claims
      </button>

      <select
        class="tab-select-item"
        :class="{ active: activeTab === 'previous' }"
        v-model="historySeasonId"
        @change="selectPreviousSeason"
      >
        <option value="">Previous Seasons Claims</option>
        <option
          v-for="season in previousSeasons"
          :key="season.id"
          :value="season.id"
        >
          {{ season.season_name || season.name }}
        </option>
      </select>
    </div>

    <div class="toolbar">
      <input
        v-model="search"
        type="text"
        placeholder="Search farmer, farm, or crop..."
      />

      <select v-model="statusFilter">
        <option value="">All Status</option>
        <option value="validated_by_mao">Validated by MAO</option>
        <option value="submitted_to_pcic">Submitted to PCIC</option>
        <option value="ready_for_claiming">Ready for Claiming</option>
        <option value="claimed">Claimed</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>

    <div v-if="loading" class="state-box">
      Loading claims...
    </div>

    <div v-else-if="filteredClaims.length === 0" class="state-box">
      No claims found for this section.
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
            <th>Farmer</th>
            <th>Farm</th>
            <th>Crop</th>
            <th>Season</th>
            <th>Damage Date</th>
            <th>Amount</th>
            <th>Claiming Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="claim in filteredClaims"
            :key="claim.id"
            class="clickable-row"
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

            <td>
              <strong>{{ farmerName(claim) }}</strong>
              <small>{{ farmerContact(claim) }}</small>
            </td>

            <td>{{ claim.damage_report?.insurance_application?.farm?.farm_name || '—' }}</td>
            <td>{{ claim.damage_report?.insurance_application?.farm?.crop_type || '—' }}</td>
            <td>
              <span class="season-pill">
                {{ claim.damage_report?.insurance_application?.season?.name || 'Unknown' }}
              </span>
            </td>
            <td>{{ formatDate(claim.damage_report?.damage_date) }}</td>
            <td>{{ claim.claim_amount ? peso(claim.claim_amount) : '—' }}</td>
            <td>{{ formatDate(claim.claim_schedule) }}</td>

            <td>
              <span class="status-badge" :class="claim.status">
                {{ statusLabel(claim.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="selectedIds.length > 0" class="batch-bar">
        <div class="batch-bar-inner">
          <span>{{ selectedIds.length }} claim(s) selected</span>

          <div class="batch-actions">
            <button class="batch-btn ghost" @click="clearSelection">
              Clear
            </button>

            <button
              v-if="batchActionType === 'submit_to_pcic'"
              class="batch-btn primary"
              :disabled="batchProcessing"
              @click="batchSubmitToPcic"
            >
              {{ batchProcessing ? 'Submitting...' : 'Mark Submitted to PCIC' }}
            </button>

            <button
              v-else-if="batchActionType === 'mark_claimed'"
              class="batch-btn primary"
              :disabled="batchProcessing"
              @click="batchMarkClaimed"
            >
              {{ batchProcessing ? 'Updating...' : 'Mark as Claimed' }}
            </button>

            <span v-else class="batch-mixed-hint">
              Select claims with the same status to take a batch action.
            </span>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedClaim" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h3>{{ farmerName(selectedClaim) }}</h3>
              <p>
                {{ selectedClaim.damage_report?.insurance_application?.farm?.farm_name || 'Farm' }}
                •
                {{ selectedClaim.damage_report?.insurance_application?.farm?.crop_type || 'Crop' }}
              </p>
            </div>

            <button class="close-btn" @click="closeModal">×</button>
          </div>

          <div class="details-grid">
            <div class="info-card">
              <h4>Farmer Information</h4>

              <div class="info-row">
                <span>Name</span>
                <strong>{{ farmerName(selectedClaim) }}</strong>
              </div>

              <div class="info-row">
                <span>Contact</span>
                <strong>{{ farmerContact(selectedClaim) }}</strong>
              </div>

              <div class="info-row">
                <span>Address</span>
                <strong>{{ farmerAddress(selectedClaim) }}</strong>
              </div>
            </div>

            <div class="info-card">
              <h4>Farm / Damage Information</h4>

              <div class="info-row">
                <span>Farm</span>
                <strong>{{ selectedClaim.damage_report?.insurance_application?.farm?.farm_name || '—' }}</strong>
              </div>

              <div class="info-row">
                <span>Crop</span>
                <strong>{{ selectedClaim.damage_report?.insurance_application?.farm?.crop_type || '—' }}</strong>
              </div>

              <div class="info-row">
                <span>Area</span>
                <strong>{{ selectedClaim.damage_report?.insurance_application?.farm?.farm_area || '—' }} ha</strong>
              </div>

              <div class="info-row">
                <span>Season Context</span>
                <strong>{{ selectedClaim.damage_report?.insurance_application?.season?.name || '—' }}</strong>
              </div>

              <div class="info-row">
                <span>Damage Date</span>
                <strong>{{ formatDate(selectedClaim.damage_report?.damage_date) }}</strong>
              </div>

              <div class="info-row">
                <span>Damage Cause</span>
                <strong>{{ selectedClaim.damage_report?.damage_cause || '—' }}</strong>
              </div>
            </div>
          </div>

          <div class="info-card full">
            <h4>Claim / Indemnity Information</h4>

            <div class="info-row">
              <span>Amount</span>
              <strong>{{ selectedClaim.claim_amount ? peso(selectedClaim.claim_amount) : '—' }}</strong>
            </div>

            <div class="info-row">
              <span>Claiming Date</span>
              <strong>{{ formatDate(selectedClaim.claim_schedule) }}</strong>
            </div>

            <div class="info-row">
              <span>Claiming Venue</span>
              <strong>{{ selectedClaim.claim_venue || '—' }}</strong>
            </div>

            <div class="info-row">
              <span>Remarks</span>
              <strong>{{ selectedClaim.pcic_remarks || '—' }}</strong>
            </div>

            <div class="info-row">
              <span>Status</span>
              <strong>{{ statusLabel(selectedClaim.status) }}</strong>
            </div>
          </div>

          <div class="action-section">
            <template v-if="selectedClaim.status === 'validated_by_mao'">
              <button class="action-btn primary" @click="submitToPcic(selectedClaim.id)">
                Mark Submitted to PCIC
              </button>
            </template>

            <template v-if="selectedClaim.status === 'submitted_to_pcic'">
              <button class="action-btn success" @click="openPcicModal('approved')">
                PCIC Approved
              </button>

              <button class="action-btn danger" @click="openPcicModal('rejected')">
                PCIC Rejected
              </button>
            </template>

            <template v-if="selectedClaim.status === 'ready_for_claiming'">
              <button class="action-btn success" @click="markClaimed(selectedClaim.id)">
                Mark as Claimed
              </button>
            </template>

            <template v-if="selectedClaim.status === 'claimed'">
              <span class="success-text">✓ This claim has already been claimed.</span>
            </template>

            <template v-if="selectedClaim.status === 'rejected'">
              <span class="rejected-text">This claim was rejected.</span>
            </template>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showPcicModal"
        class="modal-backdrop"
        @click.self="showPcicModal = false"
      >
        <div class="small-modal">
          <h3>
            {{ pcicForm.result === 'approved' ? 'PCIC Approved' : 'PCIC Rejected' }}
          </h3>

          <template v-if="pcicForm.result === 'approved'">
            <label>Indemnity Amount</label>
            <input
              v-model.number="pcicForm.claim_amount"
              type="number"
              min="0"
              placeholder="Enter amount"
            />

            <label>Claiming Date</label>
            <input v-model="pcicForm.claim_schedule" type="date" />

            <label>Claiming Venue</label>
            <input
              v-model="pcicForm.claim_venue"
              type="text"
              placeholder="e.g. MAO Office"
            />
          </template>

          <label>Remarks</label>
          <textarea
            v-model="pcicForm.pcic_remarks"
            placeholder="Enter PCIC remarks"
          ></textarea>

          <div class="modal-actions">
            <button @click="showPcicModal = false">Cancel</button>
            <button class="confirm" @click="savePcicResult">
              Save Result
            </button>
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
  validated_by_mao: {
    endpoint: 'submit-to-pcic',
    actionType: 'submit_to_pcic',
  },
  ready_for_claiming: {
    endpoint: 'claimed',
    actionType: 'mark_claimed',
  },
}

export default {
  name: 'MaoClaimsPage',

  data() {
    return {
      claims: [],
      seasons: [],
      selectedClaim: null,
      search: '',
      statusFilter: '',
      loading: false,
      activeTab: 'current',
      historySeasonId: '',

      selectedIds: [],
      batchProcessing: false,
      showPcicModal: false,

      pcicForm: {
        result: 'approved',
        claim_amount: null,
        claim_schedule: '',
        claim_venue: '',
        pcic_remarks: '',
      },
    }
  },

  computed: {
    // Seasons eligible to appear in the "Previous Seasons" dropdown.
    // Matches the same status check used to bucket claims into the previous tab.
    previousSeasons() {
      return this.seasons.filter(season => season.status === 'completed')
    },

    filteredClaims() {
      let list = this.claims || []

      // 1. Client side structural alignment fallback
      if (this.activeTab === 'current') {
        list = list.filter(claim => {
          const status = claim.damage_report?.insurance_application?.season?.status
          return status === 'application_open' || status === 'application_closed'
        })
      } else if (this.activeTab === 'previous') {
        list = list.filter(claim => {
          const status = claim.damage_report?.insurance_application?.season?.status
          return status === 'completed'
        })

        // Narrow further to the specific previous season picked from the dropdown
        if (this.historySeasonId) {
          list = list.filter(claim => {
            const seasonId = claim.damage_report?.insurance_application?.season?.id
              || claim.damage_report?.insurance_application?.insurance_season_id
              || null
            return String(seasonId) === String(this.historySeasonId)
          })
        }
      }

      // 2. Filter by status selection dropdown
      if (this.statusFilter) {
        list = list.filter(claim => claim.status === this.statusFilter)
      }

      // 3. Search parameters query string matching
      if (this.search.trim()) {
        const q = this.search.toLowerCase().trim()
        list = list.filter(claim =>
          this.farmerName(claim).toLowerCase().includes(q) ||
          String(claim.damage_report?.insurance_application?.farm?.farm_name || '').toLowerCase().includes(q) ||
          String(claim.damage_report?.insurance_application?.farm?.crop_type || '').toLowerCase().includes(q)
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
    }
  },

  mounted() {
    this.fetchSeasons()
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

    async fetchSeasons() {
      try {
        const response = await axios.get(
          API_BASE + '/api/insurance-seasons',
          this.authHeaders()
        )
        this.seasons = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
      } catch (error) {
        console.error(error)
      }
    },

    async fetchClaims() {
      this.loading = true
      try {
        // Automatically appends query parameters syncing with your Laravel index logic
        const response = await axios.get(
          `${API_BASE}/api/claims?season_type=${this.activeTab}`,
          this.authHeaders()
        )
        this.claims = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
      } catch (error) {
        console.error(error)
        alert('Failed to load claims.')
      } finally {
        this.loading = false
      }
    },

    setSeasonTab(tabName) {
      this.activeTab = tabName
      this.historySeasonId = '' // Reset the dropdown selection when going back to current
      this.selectedIds = [] // Clean selection state across contexts
      this.fetchClaims()   // Live refresh from backend logic endpoints
    },

    selectPreviousSeason() {
      this.activeTab = 'previous'
      this.selectedIds = []
      this.fetchClaims()
    },

    async openClaim(id) {
      try {
        const response = await axios.get(
          API_BASE + '/api/claims/' + id,
          this.authHeaders()
        )
        this.selectedClaim = response.data
      } catch (error) {
        console.error(error)
        alert('Failed to load claim details.')
      }
    },

    closeModal() {
      this.selectedClaim = null
    },

    async submitToPcic(id) {
      if (!confirm('Mark this claim as submitted to PCIC?')) return
      try {
        await axios.patch(
          API_BASE + '/api/claims/' + id + '/submit-to-pcic',
          {},
          this.authHeaders()
        )
        await this.fetchClaims()
        await this.openClaim(id)
      } catch (error) {
        console.error(error)
        alert(error.response?.data?.message || 'Failed to update claim.')
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
            axios.patch(
              API_BASE + '/api/claims/' + id + '/' + endpoint,
              {},
              this.authHeaders()
            )
          )
        )

        results.forEach((result, i) => {
          if (result.status === 'rejected') {
            failedIds.push(idsToProcess[i])
          }
        })

        await this.fetchClaims()

        if (failedIds.length > 0) {
          alert(
            failedIds.length + ' of ' + idsToProcess.length +
            ' claim(s) failed to update. They remain selected so you can retry.'
          )
          this.selectedIds = failedIds
        } else {
          this.selectedIds = []
        }
      } catch (error) {
        console.error(error)
        alert('Failed to process batch action.')
      } finally {
        this.batchProcessing = false
      }
    },

    batchSubmitToPcic() {
      const count = this.selectedIds.length
      return this.runBatchAction(
        BATCHABLE_STATUSES.validated_by_mao.endpoint,
        'Mark ' + count + ' claim(s) as submitted to PCIC?'
      )
    },

    batchMarkClaimed() {
      const count = this.selectedIds.length
      return this.runBatchAction(
        BATCHABLE_STATUSES.ready_for_claiming.endpoint,
        'Mark ' + count + ' claim(s) as claimed?'
      )
    },

    openPcicModal(result) {
      this.pcicForm = {
        result,
        claim_amount: null,
        claim_schedule: '',
        claim_venue: '',
        pcic_remarks: '',
      }
      this.showPcicModal = true
    },

    async savePcicResult() {
      if (!this.selectedClaim) return
      try {
        await axios.patch(
          API_BASE + '/api/claims/' + this.selectedClaim.id + '/pcic-result',
          this.pcicForm,
          this.authHeaders()
        )
        this.showPcicModal = false
        await this.fetchClaims()
        await this.openClaim(this.selectedClaim.id)
      } catch (error) {
        console.error(error)
        alert(error.response?.data?.message || 'Failed to save PCIC result.')
      }
    },

    async markClaimed(id) {
      if (!confirm('Mark this claim as claimed?')) return
      try {
        await axios.patch(
          API_BASE + '/api/claims/' + id + '/claimed',
          {},
          this.authHeaders()
        )
        await this.fetchClaims()
        this.closeModal()
      } catch (error) {
        console.error(error)
        alert(error.response?.data?.message || 'Failed to mark as claimed.')
      }
    },

    farmerName(claim) {
      const user = claim.damage_report?.insurance_application?.farm?.farmer_profile?.user
      if (!user) return 'Unknown Farmer'
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
        validated_by_mao: 'Validated by MAO',
        submitted_to_pcic: 'Submitted to PCIC',
        ready_for_claiming: 'Ready for Claiming',
        claimed: 'Claimed',
        rejected: 'Rejected',
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
.claims-page {
  min-height: 100vh;
  padding: 1.5rem;
  background: #f8faf9;
  color: #1f2937;
}

.page-header {
  background: linear-gradient(135deg, #0f766e, #16a34a);
  color: white;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  font-size: 1.6rem;
}

.page-header p {
  margin: 0.35rem 0 0;
  opacity: 0.9;
}

.btn-refresh {
  border: none;
  background: white;
  color: #047857;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.9rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 1rem;
}

.stat-card span {
  color: #6b7280;
  font-size: 0.78rem;
}

.stat-card strong {
  display: block;
  margin-top: 0.35rem;
  font-size: 1.6rem;
  color: #047857;
}

/* Season Tabs Styles */
.tabs-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 2px;
  align-items: center;
}

.tab-btn-item {
  border: none;
  background: transparent;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: all 0.2s ease;
}

.tab-btn-item:hover {
  color: #0f766e;
  background: #f1f5f9;
}

.tab-btn-item.active {
  color: #0f766e;
}

.tab-btn-item.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 4px;
  background: #0f766e;
  border-radius: 99px;
}

/* Dropdown styled to sit alongside the tab buttons */
.tab-select-item {
  border: none;
  background: transparent;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  outline: none;
  transition: all 0.2s ease;
}

.tab-select-item:hover {
  color: #0f766e;
  background: #f1f5f9;
}

.tab-select-item.active {
  color: #0f766e;
  border-bottom: 4px solid #0f766e;
  margin-bottom: -2px;
}

.season-pill {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.toolbar {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 1rem;
  display: flex;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.toolbar input,
.toolbar select {
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  outline: none;
}

.toolbar input {
  flex: 1;
}

.state-box {
  background: white;
  padding: 2rem;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  text-align: center;
  color: #6b7280;
}

.table-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  background: #f3f4f6;
  padding: 0.85rem;
  font-size: 0.8rem;
  color: #4b5563;
}

td {
  padding: 0.85rem;
  border-top: 1px solid #f1f5f9;
  font-size: 0.88rem;
}

td small {
  display: block;
  margin-top: 0.2rem;
  color: #6b7280;
}

.clickable-row {
  cursor: pointer;
  transition: background 0.12s ease;
}

.clickable-row:hover {
  background: #f0fdf4;
}

.checkbox-col {
  width: 40px;
  text-align: center;
}

.checkbox-col input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.status-badge {
  padding: 0.32rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  white-space: nowrap;
  background: #e5e7eb;
  color: #374151;
}

.status-badge.submitted_to_pcic {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.pcic_approved,
.status-badge.ready_for_claiming {
  background: #dcfce7;
  color: #166534;
}

.status-badge.pcic_rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.claimed {
  background: #ede9fe;
  color: #5b21b6;
}

.batch-bar {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998;
}

.batch-bar-inner {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: #111827;
  color: white;
  padding: 0.85rem 1.25rem;
  border-radius: 999px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.batch-bar-inner span {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.batch-mixed-hint {
  font-size: 0.82rem;
  font-weight: 500;
  color: #d1d5db;
  white-space: nowrap;
}

.batch-btn {
  border: none;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.batch-btn.ghost {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

.batch-btn.primary {
  background: #16a34a;
  color: white;
}

.batch-btn.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal {
  width: min(1000px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 22px;
  padding: 1.4rem;
}

.small-modal {
  width: min(460px, 100%);
  background: white;
  border-radius: 20px;
  padding: 1.4rem;
}

.small-modal h3 {
  margin-top: 0;
}

.small-modal label {
  display: block;
  margin-top: 0.85rem;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.small-modal input,
.small-modal select,
.small-modal textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid #d1d5db;
}

.small-modal textarea {
  min-height: 90px;
  resize: vertical;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
}

.modal-header p {
  margin: 0.35rem 0 0;
  color: #6b7280;
}

.close-btn {
  border: none;
  background: #f3f4f6;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.9rem;
}

.info-card {
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1rem;
}

.info-card.full {
  margin-top: 0.9rem;
}

.info-card h4 {
  margin: 0 0 0.8rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.55rem 0;
  border-bottom: 1px dashed #e5e7eb;
}

.info-row span {
  color: #6b7280;
  font-size: 0.84rem;
}

.info-row strong {
  text-align: right;
  font-size: 0.88rem;
}

.action-section {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.action-btn {
  border: none;
  padding: 0.7rem 1rem;
  border-radius: 12px;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.action-btn.primary {
  background: #047857;
}

.action-btn.success {
  background: #16a34a;
}

.action-btn.danger {
  background: #dc2626;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1rem;
}

.modal-actions button {
  border: none;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  cursor: pointer;
}

.modal-actions .confirm {
  background: #047857;
  color: white;
  font-weight: 700;
}

@media (max-width: 900px) {
  .stats-row,
  .details-grid {
    grid-template-columns: 1fr;
  }

  .toolbar,
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .table-card {
    overflow-x: auto;
  }

  table {
    min-width: 900px;
  }

  .batch-bar {
    left: 1rem;
    right: 1rem;
    transform: none;
  }

  .batch-bar-inner {
    border-radius: 18px;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>