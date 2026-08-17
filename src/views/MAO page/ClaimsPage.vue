<template>
  <div class="claims-page">
    <header class="top-header no-print">
      <div class="header-title-group">
        <h1>Claims &amp; Indemnity</h1>
        <p>Manage validated damage claims, PCIC results, and claiming schedules</p>
      </div>

      <div class="header-actions">
        <div class="v-divider"></div>

        <!-- User Profile -->
        <div class="user-profile">
          <div class="user-avatar">
            {{ currentUser?.initials || '?' }}
          </div>
          <div class="user-info">
            <p class="user-name">{{ currentUser?.name || 'Loading...' }}</p>
            <p class="user-role">{{ currentUser?.role || '' }}</p>
          </div>
        </div>
      </div>
    </header>

    <div class="dashboard-body">
      <div class="season-card">
        <div class="season-info">
          <div class="season-icon" :class="currentSeason ? currentSeason.status : 'application_closed'">
            {{ currentSeason && currentSeason.status === 'application_open' ? 'application open' : 'application closed' }}
          </div>
        </div>

        <div class="season-toggle">
          <button
            class="toggle-btn"
            :class="{ active: activeTab === 'current' }"
            @click="setSeasonTab('current')"
          >
            Current Season
          </button>

          <select
            class="toggle-select"
            :class="{ active: activeTab === 'previous' }"
            v-model="historySeasonId"
            @change="selectPreviousSeason"
          >
            <option value="">Previous Seasons</option>
            <option
              v-for="season in previousSeasons"
              :key="season.id"
              :value="season.id"
            >
              {{ season.season_name || season.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="status-tab-bar">
        <button
          v-for="tab in statusTabs"
          :key="tab.key"
          class="status-tab"
          :class="{ active: activeStatusTab === tab.key }"
          @click="switchStatusTab(tab.key)"
        >
          <span class="tab-dot" :class="tab.dot"></span>
          {{ tab.label }}
          <span class="tab-count">{{ countByStatus(tab.key) }}</span>
        </button>
      </div>

      <div class="filters-row">
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>

          <input
            v-model="search"
            class="search-input"
            type="text"
            placeholder="Search farmer, farm, or crop..."
          />
        </div>

        <select v-model="filterCrop" class="filter-select">
          <option value="">All Crops</option>
          <option v-for="c in cropOptions" :key="c" :value="c">
            {{ c }}
          </option>
        </select>

        <button class="btn-outline btn-compact" @click="resetFilters">
          Reset
        </button>
      </div>

      <div class="metrics-grid claims-metrics">
        <div class="metric-card">
          <div class="card-header">
            <span class="card-label">Total</span>
          </div>
          <div class="card-value">{{ activeClaims.length }}</div>
        </div>

        <div class="metric-card">
          <div class="card-header">
            <span class="card-label">Validated</span>
            <span class="icon-badge blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          </div>
          <div class="card-value">{{ countByStatus('validated_by_mao') }}</div>
        </div>

        <div class="metric-card">
          <div class="card-header">
            <span class="card-label">Submitted to PCIC</span>
            <span class="icon-badge amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 16 14" />
              </svg>
            </span>
          </div>
          <div class="card-value">{{ countByStatus('submitted_to_pcic') }}</div>
        </div>

        <div class="metric-card">
          <div class="card-header">
            <span class="card-label">Ready for Claiming</span>
            <span class="icon-badge purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M2 12h20" />
              </svg>
            </span>
          </div>
          <div class="card-value">{{ countByStatus('ready_for_claiming') }}</div>
        </div>

        <div class="metric-card">
          <div class="card-header">
            <span class="card-label">Claimed</span>
            <span class="icon-badge green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          </div>
          <div class="card-value">{{ countByStatus('claimed') }}</div>
        </div>

        <div class="metric-card">
          <div class="card-header">
            <span class="card-label">Rejected</span>
            <span class="icon-badge red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          </div>
          <div class="card-value">{{ countByStatus('rejected') }}</div>
        </div>
      </div>

      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <span>Loading claims...</span>
      </div>

      <div v-else-if="errorMessage" class="state-box error-box">
        <span>{{ errorMessage }}</span>
      </div>

      <div v-else class="panel table-wrap">
        <div v-if="filtered.length === 0" class="empty-state">
          No claims match your filters.
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th v-if="canBulkAct">
                <input
                  type="checkbox"
                  :checked="allFilteredSelected"
                  @change="toggleSelectAllFiltered"
                />
              </th>
              <th></th>
              <th>Farmer</th>
              <th>Farm</th>
              <th>Crop</th>
              <th>Season</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="claim in filtered" :key="claim.id">
              <tr
                class="main-row"
                :class="{
                  expanded: expandedId === claim.id,
                  selected: isSelected(claim.id)
                }"
                @click="toggleExpand(claim.id)"
              >
                <td v-if="canBulkAct" @click.stop>
                  <input
                    type="checkbox"
                    :checked="isSelected(claim.id)"
                    @change="toggleSelection(claim.id)"
                  />
                </td>

                <td class="expand-cell">
                  <span class="expand-icon" :class="{ open: expandedId === claim.id }">
                    ▶
                  </span>
                </td>

                <td class="farmer-cell">
                  <div class="farmer-name font-bold">
                    {{ farmerName(claim) }}
                  </div>

                  <div class="farmer-sub">
                    {{ farmerContact(claim) }}
                  </div>
                </td>
                <td>{{ claim.damage_report?.insurance_application?.farm?.farm_name || '—' }}</td>
                <td>{{ claim.damage_report?.insurance_application?.farm?.crop_type || '—' }}</td>
                <td>
                  <span class="season-pill">
                    {{ claim.damage_report?.insurance_application?.season?.name || 'Unknown' }}
                  </span>
                </td>
                <td>{{ claim.claim_amount ? peso(claim.claim_amount) : '—' }}</td>

                <td>
                  <span class="status-pill" :class="claim.status">
                    {{ statusLabel(claim.status) }}
                  </span>
                </td>
              </tr>

              <tr v-if="expandedId === claim.id" class="detail-row">
                <td colspan="8">
                  <div class="detail-box">
                    <div class="detail-content">
                      <div class="info-section">
                        <div class="detail-section">
                          <div class="section-title">Farmer Information</div>

                          <div class="summary-grid">
                            <div class="summary-card">
                              <div class="summary-label">Full Name</div>
                              <div class="summary-value text-dark">{{ farmerName(claim) }}</div>
                            </div>

                            <div class="summary-card">
                              <div class="summary-label">Contact</div>
                              <div class="summary-value text-dark">{{ farmerContact(claim) }}</div>
                            </div>

                            <div class="summary-card col-span-full">
                              <div class="summary-label">Address</div>
                              <div class="summary-value text-dark">{{ farmerAddress(claim) }}</div>
                            </div>
                          </div>
                        </div>

                        <div class="detail-section">
                          <div class="section-title">Farm &amp; Damage Information</div>

                          <div class="summary-grid">
                            <div class="summary-card">
                              <div class="summary-label">Farm</div>
                              <div class="summary-value text-dark">
                                {{ claim.damage_report?.insurance_application?.farm?.farm_name || '—' }}
                              </div>
                            </div>

                            <div class="summary-card">
                              <div class="summary-label">Crop Type</div>
                              <div class="summary-value text-dark">
                                {{ claim.damage_report?.insurance_application?.farm?.crop_type || '—' }}
                              </div>
                            </div>

                            <div class="summary-card">
                              <div class="summary-label">Farm Area</div>
                              <div class="summary-value text-dark">
                                {{ claim.damage_report?.insurance_application?.farm?.farm_area ? claim.damage_report.insurance_application.farm.farm_area + ' ha' : '—' }}
                              </div>
                            </div>

                            <div class="summary-card">
                              <div class="summary-label">Season</div>
                              <div class="summary-value text-dark">
                                {{ claim.damage_report?.insurance_application?.season?.name || '—' }}
                              </div>
                            </div>

                            <div class="summary-card">
                              <div class="summary-label">Damage Date</div>
                              <div class="summary-value text-dark">{{ formatDate(claim.damage_report?.damage_date) }}</div>
                            </div>

                            <div class="summary-card">
                              <div class="summary-label">Damage Cause</div>
                              <div class="summary-value text-dark">{{ claim.damage_report?.damage_cause || '—' }}</div>
                            </div>
                          </div>
                        </div>

                        <div class="detail-section">
                          <div class="section-title">Claim / Indemnity Information</div>

                          <div class="summary-grid">
                            <div class="summary-card">
                              <div class="summary-label">Amount</div>
                              <div class="summary-value text-dark">{{ claim.claim_amount ? peso(claim.claim_amount) : '—' }}</div>
                            </div>

                            <div class="summary-card">
                              <div class="summary-label">Claiming Date</div>
                              <div class="summary-value text-dark">{{ formatDate(claim.claim_schedule) }}</div>
                            </div>

                            <div class="summary-card">
                              <div class="summary-label">Claiming Venue</div>
                              <div class="summary-value text-dark">{{ claim.claim_venue || '—' }}</div>
                            </div>

                            <div class="summary-card">
                              <div class="summary-label">Remarks</div>
                              <div class="summary-value text-dark">{{ claim.pcic_remarks || '—' }}</div>
                            </div>
                          </div>
                        </div>

                        <div class="detail-section">
                          <div class="section-title">Claim Action</div>

                          <div class="status-update-row" @click.stop>
                            <span class="status-pill" :class="claim.status">
                              {{ statusLabel(claim.status) }}
                            </span>

                            <template v-if="claim.status === 'validated_by_mao'">
                              <button
                                class="btn-primary btn-compact"
                                @click="submitToPcic(claim)"
                                :disabled="updatingId === claim.id"
                              >
                                Submit to PCIC
                              </button>
                            </template>

                            <template v-else-if="claim.status === 'submitted_to_pcic'">
                              <button
                                class="btn-primary btn-compact"
                                @click="openPcicModal(claim, 'approved')"
                                :disabled="updatingId === claim.id"
                              >
                                PCIC Approved
                              </button>

                              <button
                                class="btn-danger btn-compact"
                                @click="openPcicModal(claim, 'rejected')"
                                :disabled="updatingId === claim.id"
                              >
                                PCIC Rejected
                              </button>
                            </template>

                            <template v-else-if="claim.status === 'ready_for_claiming'">
                              <button
                                class="btn-primary btn-compact"
                                @click="markClaimed(claim)"
                                :disabled="updatingId === claim.id"
                              >
                                Mark as Claimed
                              </button>
                            </template>

                            <template v-else-if="claim.status === 'claimed'">
                              <span class="locked-pill approved">
                                🔒 Claimed — Locked.
                              </span>
                            </template>

                            <template v-else-if="claim.status === 'rejected'">
                              <span class="locked-pill rejected">
                                🔒 Rejected — Locked. This claim can no longer be changed.
                              </span>
                            </template>

                            <span v-if="updatingId === claim.id" class="updating-text">
                              Updating...
                            </span>

                            <span v-if="updateSuccessId === claim.id" class="success-text">
                              ✓ Updated
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <transition name="float-bar">
      <div v-if="canBulkAct && selectedIds.length > 0" class="bulk-action-bar floating">
        <div class="bulk-left">
          <strong>{{ selectedIds.length }}</strong>
          <span>claim(s) selected</span>
        </div>

        <div class="bulk-actions">
          <button
            v-if="activeStatusTab === 'validated_by_mao'"
            class="btn-primary btn-compact"
            @click="bulkSubmitToPcic"
            :disabled="bulkUpdating"
          >
            {{ bulkUpdating ? 'Submitting...' : 'Submit Selected to PCIC' }}
          </button>

          <button
            v-else-if="activeStatusTab === 'ready_for_claiming'"
            class="btn-primary btn-compact"
            @click="bulkMarkClaimed"
            :disabled="bulkUpdating"
          >
            {{ bulkUpdating ? 'Updating...' : 'Mark Selected as Claimed' }}
          </button>

          <button class="link-btn-muted" @click="clearSelection">
            Clear
          </button>
        </div>
      </div>
    </transition>

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
            <button class="btn-outline btn-compact" @click="showPcicModal = false">Cancel</button>
            <button class="btn-primary btn-compact" @click="savePcicResult">
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
  },
  ready_for_claiming: {
    endpoint: 'claimed',
  },
}

const STATUS_TABS = [
  { key: 'validated_by_mao', label: 'Validated by MAO', dot: 'blue' },
  { key: 'submitted_to_pcic', label: 'Submitted to PCIC', dot: 'amber' },
  { key: 'ready_for_claiming', label: 'Ready for Claiming', dot: 'teal' },
  { key: 'claimed', label: 'Claimed', dot: 'purple' },
  { key: 'rejected', label: 'Rejected', dot: 'red' },
]

export default {
  name: 'MaoClaimsPage',

  data() {
    return {
      claims: [],
      seasons: [],
      activeTab: 'current',
      activeStatusTab: 'validated_by_mao',
      historySeasonId: '',

      search: '',
      filterCrop: '',

      selectedIds: [],
      loading: false,
      errorMessage: '',
      expandedId: null,

      updatingId: null,
      updateSuccessId: null,
      bulkUpdating: false,

      showPcicModal: false,
      pcicClaimId: null,
      pcicForm: {
        result: 'approved',
        claim_amount: null,
        claim_schedule: '',
        claim_venue: '',
        pcic_remarks: '',
      },

      statusTabs: STATUS_TABS,
      currentUser: { name: 'Christopher', role: 'MAO Officer', initials: 'CP' },

    }
  },

  computed: {
    currentSeason() {
      return this.seasons.find(function(s) {
        return s.status === 'application_open'
      }) || null
    },

    previousSeasons() {
      const currentId = this.currentSeason ? String(this.currentSeason.id) : null;
      return this.seasons.filter((season) => {
        const isCurrentId = String(season.id) === currentId;
        const isDefaultSeason = season.is_default === true || season.is_default === 1 || season.is_default === '1';
        return !isCurrentId && !isDefaultSeason;
      });
    },
    activeClaims() {
      var self = this
      var list = this.claims || []

      if (this.activeTab === 'current') {
        return list.filter(function(claim) {
          var status = claim.damage_report?.insurance_application?.season?.status
          return status === 'application_open' || status === 'application_closed'
        })
      }

      list = list.filter(function(claim) {
        var status = claim.damage_report?.insurance_application?.season?.status
        return status === 'completed'
      })

      if (this.historySeasonId) {
        list = list.filter(function(claim) {
          var seasonId = claim.damage_report?.insurance_application?.season?.id
            || claim.damage_report?.insurance_application?.insurance_season_id
            || null
          return String(seasonId) === String(self.historySeasonId)
        })
      }

      return list
    },

    canBulkAct() {
      return Object.prototype.hasOwnProperty.call(BATCHABLE_STATUSES, this.activeStatusTab)
    },

    cropOptions() {
      var set = new Set(
        this.activeClaims
          .map(function(c) {
            return c.damage_report?.insurance_application?.farm?.crop_type
          })
          .filter(Boolean)
      )
      return Array.from(set).sort()
    },

    filtered() {
      var self = this
      var q = this.search.toLowerCase().trim()

      return this.activeClaims.filter(function(claim) {
        var matchStatus = claim.status === self.activeStatusTab

        var matchSearch =
          !q ||
          self.farmerName(claim).toLowerCase().indexOf(q) !== -1 ||
          String(claim.damage_report?.insurance_application?.farm?.farm_name || '').toLowerCase().indexOf(q) !== -1 ||
          String(claim.damage_report?.insurance_application?.farm?.crop_type || '').toLowerCase().indexOf(q) !== -1

        var matchCrop =
          !self.filterCrop ||
          claim.damage_report?.insurance_application?.farm?.crop_type === self.filterCrop

        return matchStatus && matchSearch && matchCrop
      })
    },

    allFilteredSelected() {
      var self = this
      if (this.filtered.length === 0) return false
      return this.filtered.every(function(claim) {
        return self.selectedIds.includes(claim.id)
      })
    },
  },

  mounted() {
    this.fetchSeasons()
    this.fetchClaims()
  },

  methods: {
    authHeaders() {
      var token = localStorage.getItem('mao_token') || localStorage.getItem('token')
      return {
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/json',
        },
      }
    },

    async fetchSeasons() {
      try {
        var response = await axios.get(
          API_BASE + '/api/insurance-seasons',
          this.authHeaders()
        )
        this.seasons = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
      } catch (err) {
        console.error(err)
      }
    },

    async fetchClaims() {
      this.loading = true
      this.errorMessage = ''

      try {
        var response = await axios.get(
          API_BASE + '/api/claims?season_type=' + this.activeTab,
          this.authHeaders()
        )
        this.claims = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          this.errorMessage = err.response.data.message
        } else {
          this.errorMessage = 'Failed to load claims. Check your connection.'
        }
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    setSeasonTab(tabName) {
      this.activeTab = tabName
      this.historySeasonId = ''
      this.expandedId = null
      this.clearSelection()
      this.fetchClaims()
    },

    selectPreviousSeason() {
      this.activeTab = 'previous'
      this.expandedId = null
      this.clearSelection()
      this.fetchClaims()
    },

    switchStatusTab(status) {
      this.activeStatusTab = status
      this.expandedId = null
      this.clearSelection()
    },

    toggleExpand(id) {
      this.expandedId = this.expandedId === id ? null : id
    },

    toggleSelection(id) {
      if (!this.canBulkAct) return
      if (this.selectedIds.includes(id)) {
        this.selectedIds = this.selectedIds.filter(function(selectedId) {
          return selectedId !== id
        })
      } else {
        this.selectedIds.push(id)
      }
    },

    toggleSelectAllFiltered() {
      var self = this
      if (!this.canBulkAct) return

      if (this.allFilteredSelected) {
        var filteredIds = this.filtered.map(function(claim) {
          return claim.id
        })
        this.selectedIds = this.selectedIds.filter(function(id) {
          return !filteredIds.includes(id)
        })
      } else {
        this.filtered.forEach(function(claim) {
          if (!self.selectedIds.includes(claim.id)) {
            self.selectedIds.push(claim.id)
          }
        })
      }
    },

    isSelected(id) {
      return this.selectedIds.includes(id)
    },

    clearSelection() {
      this.selectedIds = []
    },

    async submitToPcic(claim) {
      if (claim.status !== 'validated_by_mao') return
      if (!confirm('Mark this claim as submitted to PCIC?')) return

      this.updatingId = claim.id
      this.updateSuccessId = null

      try {
        await axios.patch(
          API_BASE + '/api/claims/' + claim.id + '/submit-to-pcic',
          {},
          this.authHeaders()
        )
        claim.status = 'submitted_to_pcic'
        this.updateSuccessId = claim.id
        this.flashSuccess(claim.id)
      } catch (err) {
        console.error(err)
        alert(err.response?.data?.message || 'Failed to update claim.')
      } finally {
        this.updatingId = null
      }
    },

    async markClaimed(claim) {
      if (claim.status !== 'ready_for_claiming') return
      if (!confirm('Mark this claim as claimed?')) return

      this.updatingId = claim.id
      this.updateSuccessId = null

      try {
        await axios.patch(
          API_BASE + '/api/claims/' + claim.id + '/claimed',
          {},
          this.authHeaders()
        )
        claim.status = 'claimed'
        this.updateSuccessId = claim.id
        this.flashSuccess(claim.id)
      } catch (err) {
        console.error(err)
        alert(err.response?.data?.message || 'Failed to mark as claimed.')
      } finally {
        this.updatingId = null
      }
    },

    flashSuccess(id) {
      var self = this
      setTimeout(function() {
        if (self.updateSuccessId === id) {
          self.updateSuccessId = null
        }
      }, 2000)
    },

    openPcicModal(claim, result) {
      this.pcicClaimId = claim.id
      this.pcicForm = {
        result: result,
        claim_amount: null,
        claim_schedule: '',
        claim_venue: '',
        pcic_remarks: '',
      }
      this.showPcicModal = true
    },

    async savePcicResult() {
      if (!this.pcicClaimId) return

      this.updatingId = this.pcicClaimId

      try {
        // REMOVED 'var response =' from this line
        await axios.patch(
          API_BASE + '/api/claims/' + this.pcicClaimId + '/pcic-result',
          this.pcicForm,
          this.authHeaders()
        )

        var claim = this.claims.find(function(c) {
          return c.id === this.pcicClaimId
        }, this)

        if (claim) {
          claim.status = this.pcicForm.result === 'approved' ? 'ready_for_claiming' : 'rejected'
          claim.claim_amount = this.pcicForm.claim_amount
          claim.claim_schedule = this.pcicForm.claim_schedule
          claim.claim_venue = this.pcicForm.claim_venue
          claim.pcic_remarks = this.pcicForm.pcic_remarks
        }

        this.showPcicModal = false
        this.updateSuccessId = this.pcicClaimId
        this.flashSuccess(this.pcicClaimId)
      } catch (err) {
        console.error(err)
        alert(err.response?.data?.message || 'Failed to save PCIC result.')
      } finally {
        this.updatingId = null
        this.pcicClaimId = null
      }
    },
    async bulkSubmitToPcic() {
      if (this.selectedIds.length === 0) return
      if (!confirm('Mark ' + this.selectedIds.length + ' claim(s) as submitted to PCIC?')) return
      await this.runBatchAction(BATCHABLE_STATUSES.validated_by_mao.endpoint, 'submitted_to_pcic')
    },

    async bulkMarkClaimed() {
      if (this.selectedIds.length === 0) return
      if (!confirm('Mark ' + this.selectedIds.length + ' claim(s) as claimed?')) return
      await this.runBatchAction(BATCHABLE_STATUSES.ready_for_claiming.endpoint, 'claimed')
    },

    async runBatchAction(endpoint, newStatus) {
      this.bulkUpdating = true
      var idsToProcess = this.selectedIds.slice()
      var failedIds = []

      try {
        var results = await Promise.allSettled(
          idsToProcess.map((id) =>
            axios.patch(
              API_BASE + '/api/claims/' + id + '/' + endpoint,
              {},
              this.authHeaders()
            )
          )
        )

        var self = this
        results.forEach(function(result, i) {
          if (result.status === 'rejected') {
            failedIds.push(idsToProcess[i])
          } else {
            var claim = self.claims.find(function(c) {
              return c.id === idsToProcess[i]
            })
            if (claim) claim.status = newStatus
          }
        })

        if (failedIds.length > 0) {
          alert(
            failedIds.length + ' of ' + idsToProcess.length +
            ' claim(s) failed to update. They remain selected so you can retry.'
          )
          this.selectedIds = failedIds
        } else {
          this.selectedIds = []
        }
      } catch (err) {
        console.error(err)
        alert('Failed to process batch action.')
      } finally {
        this.bulkUpdating = false
      }
    },

    farmerName(claim) {
      var user = claim.damage_report?.insurance_application?.farm?.farmer_profile?.user
      if (!user) return '—'
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
      return this.activeClaims.filter(function(c) {
        return c.status === status
      }).length
    },

    statusLabel(status) {
      var map = {
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

    resetFilters() {
      this.search = ''
      this.filterCrop = ''
      this.historySeasonId = ''
    },
  },
}
</script>

<style scoped>

* { box-sizing: border-box; }

.claims-page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #F8FAF8;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* TOP HEADER */
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
  color: #5c6b64;
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

/* BODY */
.dashboard-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* SEASON CARD */
.season-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.season-icon {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 5px 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
}

.season-icon.application_open {
  background: rgba(17, 109, 62, 0.1);
  color: #116D3E;
}

.season-icon.application_closed {
  background: rgba(193, 71, 61, 0.1);
  color: #C1473D;
}

.season-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #F1F6F3;
  border: 1px solid #E7F0EC;
  border-radius: 10px;
  padding: 3px;
}

.toggle-btn {
  font-size: 12px;
  font-weight: 600;
  color: #5c6b64;
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toggle-btn:hover { color: #0F212F; }

.toggle-btn.active {
  background-color: #FFFFFF;
  color: #116D3E;
  box-shadow: 0 1px 3px rgba(15, 33, 47, 0.08);
}

.toggle-select {
  font-size: 12px;
  font-weight: 600;
  color: #5c6b64;
  background-color: transparent;
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
}

.toggle-select:hover { color: #0F212F; }

.toggle-select.active {
  background-color: #FFFFFF;
  color: #116D3E;
  box-shadow: 0 1px 3px rgba(15, 33, 47, 0.08);
}

/* STATUS TAB BAR */
.status-tab-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 14px;
  padding: 6px;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
}

.status-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #5c6b64;
  background: transparent;
  border: none;
  border-radius: 9px;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.status-tab:hover { background: #F1F6F2; color: #0F212F; }

.status-tab.active {
  background: #F1F6F2;
  color: #116D3E;
}

.tab-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.tab-dot.green  { background: #116D3E; }
.tab-dot.amber  { background: #D29539; }
.tab-dot.blue   { background: #2E6F8E; }
.tab-dot.purple { background: #6B5B95; }
.tab-dot.red    { background: #C1473D; }

.tab-count {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(15, 33, 47, 0.06);
  color: #5c6b64;
}

.status-tab.active .tab-count {
  background: rgba(17, 109, 62, 0.14);
  color: #116D3E;
}

/* FILTERS ROW */
.filters-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 9px 12px 9px 34px;
  border: 1px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.82rem;
  color: #0F212F;
  background: #FFFFFF;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus { border-color: #116D3E; }

.filter-select {
  padding: 9px 12px;
  border: 1px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.82rem;
  color: #0F212F;
  background: #FFFFFF;
  cursor: pointer;
  outline: none;
}

.btn-compact { padding: 8px 14px; font-size: 0.78rem; }

.btn-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: #FFFFFF;
  color: #0F212F;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.btn-outline:hover { border-color: #116D3E; background: #F1F6F2; }

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  border: none;
  border-radius: 9px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.28);
}

.btn-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #C1473D, #9c342c);
  color: #FFFFFF;
  border: none;
  border-radius: 9px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(193, 71, 61, 0.25);
}

.link-btn-muted {
  background: none;
  border: none;
  color: #5c6b64;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}
.link-btn-muted:hover { color: #116D3E; }

/* METRICS GRID (claims: 6 cols) */
.metrics-grid.claims-metrics {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
}

.metric-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1.2rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.9rem;
}

.card-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #5c6b64;
}

.icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-badge svg { width: 18px; height: 18px; display: block; }

.icon-badge.green  { background: rgba(17, 109, 62, 0.12); color: #116D3E; }
.icon-badge.blue   { background: rgba(46, 111, 142, 0.12); color: #2E6F8E; }
.icon-badge.amber  { background: rgba(210, 149, 57, 0.16); color: #AC7A2F; }
.icon-badge.red    { background: rgba(193, 71, 61, 0.12); color: #C1473D; }
.icon-badge.purple { background: rgba(107, 91, 149, 0.12); color: #6B5B95; }

.card-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0F212F;
}

/* PANEL / TABLE */
.panel {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
}

.table-wrap { overflow-x: auto; }

.data-table { width: 100%; border-collapse: collapse; }

.data-table thead th {
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
  padding: 8px 10px;
  background: #F1F6F2;
}

.data-table tbody td {
  font-size: 0.82rem;
  color: #0F212F;
  padding: 10px;
  border-bottom: 1px solid #F1F6F2;
}

.font-bold { font-weight: 700; }

.main-row { cursor: pointer; transition: background 0.15s ease; }
.main-row:hover { background: #F8FAF8; }
.main-row.expanded { background: #F1F6F2; }
.main-row.selected { background: rgba(17, 109, 62, 0.06); }

.expand-cell { width: 24px; }
.expand-icon {
  display: inline-block;
  font-size: 0.65rem;
  color: #94a3b8;
  transition: transform 0.15s ease;
}
.expand-icon.open { transform: rotate(90deg); color: #116D3E; }

.farmer-name { font-size: 0.85rem; color: #0F212F; }
.farmer-sub { font-size: 0.72rem; color: #5c6b64; margin-top: 2px; }

.season-pill {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(46, 111, 142, 0.1);
  color: #2E6F8E;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: capitalize;
}

.status-pill.validated_by_mao   { background: rgba(46, 111, 142, 0.1); color: #2E6F8E; }
.status-pill.submitted_to_pcic  { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.status-pill.ready_for_claiming { background: rgba(107, 91, 149, 0.12); color: #6B5B95; }
.status-pill.claimed            { background: rgba(17, 109, 62, 0.1); color: #116D3E; }
.status-pill.rejected           { background: rgba(193, 71, 61, 0.1); color: #C1473D; }

/* stat-value color helpers (used in stats-row if kept) */
.stat-value.blue    { color: #2E6F8E; }
.stat-value.mao     { color: #AC7A2F; }
.stat-value.teal    { color: #6B5B95; }
.stat-value.purple  { color: #6B5B95; }
.stat-value.rejected{ color: #C1473D; }

/* DETAIL ROW */
.detail-row td { padding: 0; border-bottom: 1px solid #F1F6F2; }

.detail-box {
  background: #F8FAF8;
  padding: 1.25rem 1.5rem;
}

.detail-content { display: flex; flex-direction: column; gap: 1.25rem; }

.detail-section { display: flex; flex-direction: column; gap: 0.6rem; }

.section-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #0F212F;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.9rem;
}

.summary-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 0.9rem;
}

.summary-label { font-size: 0.72rem; color: #5c6b64; margin-bottom: 4px; }
.summary-value { font-size: 0.95rem; font-weight: 700; }
.text-dark { color: #0F212F; }
.col-span-full { grid-column: span 3; }

.status-update-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.locked-pill {
  font-size: 0.76rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
}
.locked-pill.approved { background: rgba(17, 109, 62, 0.08); color: #116D3E; }
.locked-pill.rejected { background: rgba(193, 71, 61, 0.08); color: #C1473D; }

.updating-text { font-size: 0.76rem; color: #5c6b64; }
.success-text { font-size: 0.76rem; color: #116D3E; font-weight: 600; }

/* STATE BOX */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 3rem;
  color: #5c6b64;
  font-size: 0.85rem;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
}

.error-box { color: #C1473D; }

.spinner {
  width: 26px;
  height: 26px;
  border: 3px solid #E7F0EC;
  border-top-color: #116D3E;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  text-align: center;
  padding: 2.5rem;
  color: #5c6b64;
  font-size: 0.85rem;
}

/* BULK ACTION BAR */
.bulk-action-bar.floating {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #0F212F;
  color: #FFFFFF;
  border-radius: 14px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 12px 30px rgba(15, 33, 47, 0.35);
  z-index: 30;
}

.bulk-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
}

.bulk-actions { display: flex; align-items: center; gap: 10px; }

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 33, 47, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.small-modal {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 1.5rem;
  width: 380px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 20px 50px rgba(15, 33, 47, 0.25);
}

.small-modal h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #0F212F;
  margin-bottom: 4px;
}

.small-modal label {
  font-size: 0.76rem;
  font-weight: 600;
  color: #5c6b64;
  margin-top: 4px;
}

.small-modal input,
.small-modal textarea {
  padding: 9px 12px;
  border: 1px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.82rem;
  color: #0F212F;
  outline: none;
  font-family: inherit;
}

.small-modal input:focus,
.small-modal textarea:focus { border-color: #116D3E; }

.small-modal textarea { resize: vertical; min-height: 70px; }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

/* RESPONSIVE */
@media (max-width: 1200px) {
  .metrics-grid.claims-metrics { grid-template-columns: repeat(3, 1fr); }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .col-span-full { grid-column: span 2; }
}

@media (max-width: 768px) {
  .metrics-grid.claims-metrics { grid-template-columns: repeat(2, 1fr); }
  .summary-grid { grid-template-columns: 1fr; }
  .col-span-full { grid-column: span 1; }
  .filters-row { flex-direction: column; align-items: stretch; }
}
</style>