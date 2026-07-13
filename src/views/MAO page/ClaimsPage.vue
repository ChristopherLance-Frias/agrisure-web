<template>
  <div class="claims-page">
    <div class="page-header">
      <div class="header-inner">
        <h2 class="page-title">Claims &amp; Indemnity</h2>
        <p class="page-sub">Manage validated damage claims, PCIC results, and claiming schedules</p>
      </div>
    </div>

    <div class="season-card">
      <div class="season-info">
        <div class="season-icon" :class="currentSeason ? currentSeason.status : 'closed'">
          {{ currentSeason && currentSeason.status === 'application_open' ? '⏱' : '🔒' }}
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

      <button class="btn-reset" @click="resetFilters">
        Reset
      </button>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-label">Total</span>
        <span class="stat-value">{{ activeClaims.length }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Validated</span>
        <span class="stat-value blue">{{ countByStatus('validated_by_mao') }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Submitted to PCIC</span>
        <span class="stat-value mao">{{ countByStatus('submitted_to_pcic') }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Ready for Claiming</span>
        <span class="stat-value teal">{{ countByStatus('ready_for_claiming') }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Claimed</span>
        <span class="stat-value purple">{{ countByStatus('claimed') }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Rejected</span>
        <span class="stat-value rejected">{{ countByStatus('rejected') }}</span>
      </div>
    </div>

    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <span>Loading claims...</span>
    </div>

    <div v-else-if="errorMessage" class="state-box error-box">
      <span>{{ errorMessage }}</span>
    </div>

    <div v-else class="table-wrap">
      <div v-if="filtered.length === 0" class="empty-state">
        No claims match your filters.
      </div>

      <table v-else class="report-table">
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
                <div class="farmer-name">
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
                <span class="status-badge" :class="claim.status">
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

                        <div class="detail-grid">
                          <div class="detail-item">
                            <span class="detail-label">Full Name</span>
                            <span class="detail-val">{{ farmerName(claim) }}</span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Contact</span>
                            <span class="detail-val">{{ farmerContact(claim) }}</span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Address</span>
                            <span class="detail-val">{{ farmerAddress(claim) }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="detail-section">
                        <div class="section-title">Farm &amp; Damage Information</div>

                        <div class="detail-grid">
                          <div class="detail-item">
                            <span class="detail-label">Farm</span>
                            <span class="detail-val">
                              {{ claim.damage_report?.insurance_application?.farm?.farm_name || '—' }}
                            </span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Crop Type</span>
                            <span class="detail-val">
                              {{ claim.damage_report?.insurance_application?.farm?.crop_type || '—' }}
                            </span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Farm Area</span>
                            <span class="detail-val">
                              {{ claim.damage_report?.insurance_application?.farm?.farm_area ? claim.damage_report.insurance_application.farm.farm_area + ' ha' : '—' }}
                            </span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Season</span>
                            <span class="detail-val">
                              {{ claim.damage_report?.insurance_application?.season?.name || '—' }}
                            </span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Damage Date</span>
                            <span class="detail-val">{{ formatDate(claim.damage_report?.damage_date) }}</span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Damage Cause</span>
                            <span class="detail-val">{{ claim.damage_report?.damage_cause || '—' }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="detail-section">
                        <div class="section-title">Claim / Indemnity Information</div>

                        <div class="detail-grid">
                          <div class="detail-item">
                            <span class="detail-label">Amount</span>
                            <span class="detail-val">{{ claim.claim_amount ? peso(claim.claim_amount) : '—' }}</span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Claiming Date</span>
                            <span class="detail-val">{{ formatDate(claim.claim_schedule) }}</span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Claiming Venue</span>
                            <span class="detail-val">{{ claim.claim_venue || '—' }}</span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Remarks</span>
                            <span class="detail-val">{{ claim.pcic_remarks || '—' }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="detail-section">
                        <div class="section-title">Claim Action</div>

                        <div class="status-update-row" @click.stop>
                          <span class="status-badge" :class="claim.status">
                            {{ statusLabel(claim.status) }}
                          </span>

                          <template v-if="claim.status === 'validated_by_mao'">
                            <button
                              class="action-btn approved"
                              @click="submitToPcic(claim)"
                              :disabled="updatingId === claim.id"
                            >
                              Submit to PCIC
                            </button>
                          </template>

                          <template v-else-if="claim.status === 'submitted_to_pcic'">
                            <button
                              class="action-btn approved"
                              @click="openPcicModal(claim, 'approved')"
                              :disabled="updatingId === claim.id"
                            >
                              PCIC Approved
                            </button>

                            <button
                              class="action-btn rejected"
                              @click="openPcicModal(claim, 'rejected')"
                              :disabled="updatingId === claim.id"
                            >
                              PCIC Rejected
                            </button>
                          </template>

                          <template v-else-if="claim.status === 'ready_for_claiming'">
                            <button
                              class="action-btn approved"
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

    <transition name="float-bar">
      <div v-if="canBulkAct && selectedIds.length > 0" class="bulk-action-bar floating">
        <div class="bulk-left">
          <strong>{{ selectedIds.length }}</strong>
          <span>claim(s) selected</span>
        </div>

        <div class="bulk-actions">
          <button
            v-if="activeStatusTab === 'validated_by_mao'"
            class="action-btn approved"
            @click="bulkSubmitToPcic"
            :disabled="bulkUpdating"
          >
            {{ bulkUpdating ? 'Submitting...' : 'Submit Selected to PCIC' }}
          </button>

          <button
            v-else-if="activeStatusTab === 'ready_for_claiming'"
            class="action-btn approved"
            @click="bulkMarkClaimed"
            :disabled="bulkUpdating"
          >
            {{ bulkUpdating ? 'Updating...' : 'Mark Selected as Claimed' }}
          </button>

          <button class="btn-reset" @click="clearSelection">
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
            <button class="btn-reset" @click="showPcicModal = false">Cancel</button>
            <button class="action-btn approved" @click="savePcicResult">
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
    }
  },

  computed: {
    currentSeason() {
      return this.seasons.find(function(s) {
        return s.status === 'application_open'
      }) || null
    },

    previousSeasons() {
      return this.seasons.filter(function(season) {
        return season.status === 'completed'
      })
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
.claims-page {
  padding: 0 32px 100px;
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background: #F0F4F0;
}

.page-header {
  margin: 0 -32px 22px;
  padding: 32px;
  background: linear-gradient(120deg, #1A3320 0%, #1E3A8A 100%);
}

.header-inner {
  max-width: 100%;
}

.page-title {
  font-size: 21px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 4px;
  letter-spacing: -0.01em;
}

.page-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.72);
}

.season-card {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 18px;
  box-shadow: 0 1px 4px rgba(26,51,32,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.season-info {
  display: flex;
  gap: 24px;
  align-items: center;
}

.season-icon {
  font-size: 22px;
  background: #F0FDF4;
  padding: 10px;
  border-radius: 10px;
}

.season-icon.completed, .season-icon.closed {
  background: #f1f5f9;
}

.season-toggle {
  display: flex;
  background: #F0F4F0;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}

.toggle-btn {
  border: none;
  background: transparent;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 700;
  color: #1E3A8A;
  cursor: pointer;
  border-radius: 8px;
  white-space: nowrap;
}

.toggle-btn.active {
  background: #FFFFFF;
  color: #1A3320;
  box-shadow: 0 1px 3px rgba(26,51,32,0.15);
}

.toggle-select {
  border: none;
  background: transparent;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 700;
  color: #1E3A8A;
  cursor: pointer;
  border-radius: 8px;
  white-space: nowrap;
  outline: none;
}

.toggle-select.active {
  background: #FFFFFF;
  color: #1A3320;
  box-shadow: 0 1px 3px rgba(26,51,32,0.15);
}

.status-tab-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.status-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1.5px solid #e2e8f0;
  background: #FFFFFF;
  border-radius: 999px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  color: #1E3A8A;
  cursor: pointer;
  transition: all 0.15s ease;
}

.status-tab:hover {
  border-color: #34A853;
}

.status-tab.active {
  background: linear-gradient(120deg, #1A3320, #34A853);
  border-color: transparent;
  color: #FFFFFF;
}

.tab-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tab-dot.amber { background: #D97706; }
.tab-dot.green { background: #34A853; }
.tab-dot.red { background: #DC2626; }
.tab-dot.blue { background: #1E3A8A; }
.tab-dot.teal { background: #0f766e; }
.tab-dot.purple { background: #7C3AED; }

.status-tab.active .tab-dot {
  background: #FFFFFF;
}

.tab-count {
  background: rgba(26,51,32,0.08);
  color: inherit;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
}

.status-tab.active .tab-count {
  background: rgba(255,255,255,0.25);
}

.filters-row {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
  align-items: center;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 9px 12px 9px 34px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  background: #FFFFFF;
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #34A853;
}

.filter-select {
  padding: 9px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  background: #FFFFFF;
  outline: none;
  cursor: pointer;
  flex-shrink: 0;
}

.filter-select:focus {
  border-color: #34A853;
}

.btn-reset {
  padding: 9px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  background: #FFFFFF;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-reset:hover {
  border-color: #34A853;
  color: #1A3320;
}

.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 100px;
  box-shadow: 0 1px 4px rgba(26,51,32,0.08);
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1A3320;
}

.stat-value.mao { color: #D97706; }
.stat-value.blue { color: #1E3A8A; }
.stat-value.teal { color: #0f766e; }
.stat-value.purple { color: #7C3AED; }
.stat-value.rejected { color: #DC2626; }

.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px;
  background: #FFFFFF;
  border-radius: 14px;
  font-size: 14px;
  color: #4a7c59;
}

.error-box {
  color: #b91c1c;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(52,168,83,0.2);
  border-top-color: #34A853;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.table-wrap {
  background: #FFFFFF;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(26,51,32,0.08);
  overflow: hidden;
}

.empty-state {
  padding: 48px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.report-table thead tr {
  background: #F0F4F0;
  border-bottom: 1.5px solid #e5e7eb;
}

.report-table th {
  padding: 12px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.main-row {
  border-bottom: 1px solid #F0F4F0;
  cursor: pointer;
  transition: background 0.15s;
}

.main-row:hover {
  background: #F0F4F0;
}

.main-row.expanded {
  background: #F0FDF4;
  border-bottom: none;
}

.main-row.selected {
  background: #ecfdf5;
}

.report-table td {
  padding: 13px 14px;
  color: #1A3320;
  vertical-align: middle;
}

.expand-cell {
  width: 36px;
  text-align: center;
}

.expand-icon {
  display: inline-block;
  font-size: 10px;
  color: #9ca3af;
  transition: transform 0.2s;
}

.expand-icon.open {
  transform: rotate(90deg);
  color: #34A853;
}

.farmer-name {
  font-weight: 600;
  color: #1A3320;
}

.farmer-sub {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.season-pill {
  background: #f1f5f9;
  color: #475569;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.validated_by_mao {
  background: #dbeafe;
  color: #1E3A8A;
}

.status-badge.submitted_to_pcic {
  background: #fef3c7;
  color: #D97706;
}

.status-badge.ready_for_claiming {
  background: #ccfbf1;
  color: #0f766e;
}

.status-badge.claimed {
  background: #ede9fe;
  color: #7C3AED;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #DC2626;
}

.detail-row td {
  padding: 0;
  background: #F0FDF4;
  border-bottom: 1.5px solid #d1fae5;
}

.detail-box {
  padding: 20px 28px;
}

.detail-content {
  display: flex;
  gap: 28px;
}

.info-section {
  flex: 1;
  min-width: 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #34A853;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #d1fae5;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
}

.detail-val {
  font-size: 13px;
  font-weight: 600;
  color: #1A3320;
}

.status-update-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.updating-text {
  font-size: 12px;
  color: #6b7280;
}

.success-text {
  font-size: 12px;
  color: #16a34a;
  font-weight: 600;
}

.locked-pill {
  font-size: 12px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 8px;
}

.locked-pill.approved {
  background: #F0FDF4;
  color: #1A3320;
  border: 1px solid #bbf7d0;
}

.locked-pill.rejected {
  background: #fef2f2;
  color: #7f1d1d;
  border: 1px solid #fecaca;
}

.action-btn {
  border: none;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  color: #FFFFFF;
}

.action-btn.approved {
  background: linear-gradient(120deg, #1A3320, #34A853);
}

.action-btn.rejected {
  background: #DC2626;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bulk-action-bar {
  background: #F0FDF4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.bulk-action-bar.floating {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 600;
  margin-bottom: 0;
  width: min(720px, calc(100% - 48px));
  background: #FFFFFF;
  border: 1px solid #d1fae5;
  border-left: 4px solid #34A853;
  box-shadow: 0 10px 30px rgba(26, 51, 32, 0.22), 0 2px 8px rgba(26, 51, 32, 0.12);
}

.float-bar-enter-active,
.float-bar-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.float-bar-enter-from,
.float-bar-leave-to {
  transform: translateX(-50%) translateY(16px);
  opacity: 0;
}

.bulk-left {
  display: flex;
  gap: 6px;
  align-items: center;
  color: #1A3320;
  font-size: 13px;
}

.bulk-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.small-modal {
  width: min(460px, 100%);
  background: #FFFFFF;
  border-radius: 16px;
  padding: 22px;
  font-family: 'DM Sans', sans-serif;
}

.small-modal h3 {
  margin-top: 0;
  color: #1A3320;
}

.small-modal label {
  display: block;
  margin-top: 14px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #1A3320;
}

.small-modal input,
.small-modal select,
.small-modal textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  border-radius: 9px;
  border: 1.5px solid #e2e8f0;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  outline: none;
}

.small-modal input:focus,
.small-modal textarea:focus {
  border-color: #34A853;
}

.small-modal textarea {
  min-height: 90px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

@media (max-width: 768px) {
  .claims-page {
    padding: 0 16px 100px;
  }

  .page-header {
    margin: 0 -16px 18px;
    padding: 24px 16px;
  }

  .report-table {
    font-size: 12px;
  }

  .detail-content {
    flex-direction: column;
  }

  .bulk-action-bar.floating {
    width: calc(100% - 24px);
    bottom: 12px;
  }
}
</style>