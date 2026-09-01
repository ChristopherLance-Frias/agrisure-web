<template>
  <div class="layout">
    <div class="main-wrapper">
      <header class="top-header">
        <div class="header-title-group">
          <h1>Claims &amp; Indemnity</h1>
          <p>Manage validated damage claims, PCIC results, and claiming schedules</p>
        </div>

        <div class="header-actions">
          <div class="season-toggle">
            <button
              class="toggle-btn"
              :class="{ active: activeTab === 'current' }"
              @click="setSeasonTab('current')"
            >
              Current Season
            </button>
  
            <select
              class="field-input toggle-select"
              :class="{ active: activeTab === 'previous' }"
              v-model="historySeasonId"
              @change="selectPreviousSeason"
            >
              <option value="">Previous Seasons</option>
              <option v-for="season in previousSeasons" :key="season.id" :value="season.id">
                {{ season.season_name || season.name }}
              </option>
            </select>
          </div>

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
      <main class="body">
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
    
          <!-- ============================== -->
          <!-- FILTERS                         -->
          <!-- ============================== -->
          <div class="card filters-card">
            <div class="filters-grid">
              <div class="field field-search">
                <span class="field-label">Search</span>
                <div class="search-wrap">
                  <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input v-model="search" class="field-input search-input" type="text" placeholder="Search farmer, farm, or crop..." />
                </div>
              </div>
    
              <div class="field">
                <span class="field-label">Crop</span>
                <select v-model="filterCrop" class="field-input">
                  <option value="">All Crops</option>
                  <option v-for="c in cropOptions" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
    
              <div class="field">
                <span class="field-label">Barangay</span>
                <select v-model="filterBarangay" class="field-input">
                  <option value="">All Barangays</option>
                  <option v-for="b in barangayOptions" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>
    
              <div class="field field-action">
                <button class="btn-outline" @click="resetFilters">Reset</button>
              </div>
            </div>
          </div>
    
          <!-- ============================== -->
          <!-- STATS                           -->
          <!-- ============================== -->
          <div class="summary-grid summary-grid--6">
            <div class="summary-card">
              <span class="summary-label">Total</span>
              <span class="summary-value">{{ activeClaims.length }}</span>
            </div>
    
            <div class="summary-card">
              <span class="summary-label">MAO Review</span>
              <span class="summary-value stat-blue">{{ countByStatus('under_mao_review') }}</span>
            </div>
    
            <div class="summary-card">
              <span class="summary-label">PCIC Processing</span>
              <span class="summary-value stat-mao">{{ countByStatus('in_pcic_processing') }}</span>
            </div>
    
            <div class="summary-card">
              <span class="summary-label">Ready for Claiming</span>
              <span class="summary-value stat-teal">{{ countByStatus('ready_for_claiming') }}</span>
            </div>
    
            <div class="summary-card">
              <span class="summary-label">Claimed</span>
              <span class="summary-value stat-purple">{{ countByStatus('claimed') }}</span>
            </div>
    
            <div class="summary-card">
              <span class="summary-label">Rejected</span>
              <span class="summary-value stat-rejected">{{ countByStatus('pcic_rejected') }}</span>
            </div>
          </div>
    
          <!-- ============================== -->
          <!-- STATE / TABLE                   -->
          <!-- ============================== -->
          <div v-if="loading" class="status-card status-loading">
            <div class="spinner"></div>
            <span>Loading claims...</span>
          </div>
    
          <div v-else-if="errorMessage" class="status-card status-error">
            <span>{{ errorMessage }}</span>
          </div>
    
          <div v-else class="card table-card">
            <div v-if="filtered.length === 0" class="empty-row">No claims match your filters.</div>
    
            <div v-else class="table-wrapper">
              <table class="data-table report-table">
                <thead>
                  <tr>
                    <th v-if="canBulkAct" class="checkbox-cell">
                      <input type="checkbox" :checked="allFilteredSelected" @change="toggleSelectAllFiltered" />
                    </th>
                    <th></th>
                    <th>Farmer</th>
                    <th>Farm</th>
                    <th>Crop</th>
                    <th>Barangay</th>
                    <th>Season</th>
                    <th>Status</th>
                  </tr>
                </thead>
    
                <tbody>
                  <template v-for="claim in filtered" :key="claim.id">
                    <tr
                      class="main-row"
                      :class="{ expanded: expandedId === claim.id, selected: isSelected(claim.id) }"
                      @click="toggleExpand(claim.id)"
                    >
                      <td v-if="canBulkAct" class="checkbox-cell" @click.stop>
                        <input type="checkbox" :checked="isSelected(claim.id)" @change="toggleSelection(claim.id)" />
                      </td>
    
                      <td class="expand-cell">
                        <span class="expand-icon" :class="{ open: expandedId === claim.id }">▶</span>
                      </td>
    
                      <td class="farmer-cell">
                        <div class="farmer-name">{{ farmerName(claim) }}</div>
                        <div class="farmer-sub">{{ farmerContact(claim) }}</div>
                      </td>
                      <td>{{ claim.damage_report?.insurance_application?.farm?.farm_name || '—' }}</td>
                      <td>{{ claim.damage_report?.insurance_application?.farm?.crop_type || '—' }}</td>
                      <td>{{ claimBarangay(claim) || '—' }}</td>
                      <td>
                        <span class="badge badge-subtle">
                          {{ claim.damage_report?.insurance_application?.season?.name || claim.damage_report?.insurance_application?.season?.season_name || 'Unknown' }}
                        </span>
                      </td>
    
                      <td>
                        <span class="badge status-badge" :class="claim.status">{{ statusLabel(claim.status) }}</span>
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
                                  <div class="detail-item">
                                    <span class="detail-label">Barangay</span>
                                    <span class="detail-val">{{ claimBarangay(claim) || '—' }}</span>
                                  </div>
                                </div>
                              </div>
    
                              <div class="detail-section">
                                <div class="section-title">Farm &amp; Damage Information</div>
                                <div class="detail-grid">
                                  <div class="detail-item">
                                    <span class="detail-label">Farm</span>
                                    <span class="detail-val">{{ claim.damage_report?.insurance_application?.farm?.farm_name || '—' }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Crop Type</span>
                                    <span class="detail-val">{{ claim.damage_report?.insurance_application?.farm?.crop_type || '—' }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Farm Area</span>
                                    <span class="detail-val">{{ claim.damage_report?.insurance_application?.farm?.farm_area ? claim.damage_report.insurance_application.farm.farm_area + ' ha' : '—' }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Season</span>
                                    <span class="detail-val">{{ claim.damage_report?.insurance_application?.season?.season_name || claim.damage_report?.insurance_application?.season?.name || '—' }}</span>
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
    
                              <div class="detail-section" v-if="hasCas02Data(claim)">
                                <div class="section-title">CAS-02 Filing Details</div>
                                <div class="detail-grid">
                                  <div class="detail-item">
                                    <span class="detail-label">Crop Stage at Loss</span>
                                    <span class="detail-val">{{ casField(claim, 'crop_stage_at_loss') || '—' }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Area Damaged</span>
                                    <span class="detail-val">{{ casField(claim, 'area_damaged') ? casField(claim, 'area_damaged') + ' ha' : '—' }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Degree of Damage</span>
                                    <span class="detail-val">{{ casField(claim, 'degree_of_damage') ? casField(claim, 'degree_of_damage') + '%' : '—' }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Expected Harvest Date</span>
                                    <span class="detail-val">{{ formatDate(casField(claim, 'expected_harvest_date')) }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Claim Filed Date</span>
                                    <span class="detail-val">{{ formatDate(casField(claim, 'claim_filed_date')) }}</span>
                                  </div>
                                </div>
    
                                <div class="section-title cost-subtitle">Cost of Production Inputs at Time of Loss</div>
                                <div class="detail-grid">
                                  <div class="detail-item">
                                    <span class="detail-label">Land Preparation</span>
                                    <span class="detail-val">{{ casCost(claim, 'cost_land_preparation') }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Seedling / Transplanting</span>
                                    <span class="detail-val">{{ casCost(claim, 'cost_seedling_transplanting') }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Seeds</span>
                                    <span class="detail-val">{{ casCost(claim, 'cost_seeds') }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Fertilizer</span>
                                    <span class="detail-val">{{ casCost(claim, 'cost_fertilizer') }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Chemicals</span>
                                    <span class="detail-val">{{ casCost(claim, 'cost_chemicals') }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Others</span>
                                    <span class="detail-val">{{ casCost(claim, 'cost_others') }}</span>
                                  </div>
                                  <div class="detail-item">
                                    <span class="detail-label">Total Production Cost</span>
                                    <span class="detail-val total-cost">{{ casTotalCost(claim) }}</span>
                                  </div>
                                </div>
                              </div>
    
                              <div class="detail-section">
                                <div class="section-title">Claim Action</div>
                                <div class="status-update-row" @click.stop>
                                  <span class="badge status-badge" :class="claim.status">{{ statusLabel(claim.status) }}</span>
    
                                  <template v-if="claim.status === 'under_mao_review'">
                                    <button class="btn-primary" @click="submitToPcic(claim)" :disabled="updatingId === claim.id">
                                      Submit to PCIC (Download CAS-02)
                                    </button>
                                  </template>
    
                                  <template v-else-if="claim.status === 'in_pcic_processing'">
                                    <button class="btn-secondary" @click="openScheduleModal([claim.id])" :disabled="updatingId === claim.id">
                                      {{ claim.claim_schedule ? 'Update Claiming Schedule' : 'Set Claiming Schedule' }}
                                    </button>
                                    <button class="btn-primary" @click="openPcicModal(claim, 'approved')" :disabled="updatingId === claim.id">
                                      PCIC Approved
                                    </button>
                                    <button class="btn-primary btn-danger" @click="openPcicModal(claim, 'rejected')" :disabled="updatingId === claim.id">
                                      PCIC Rejected
                                    </button>
                                  </template>
    
                                  <template v-else-if="claim.status === 'ready_for_claiming'">
                                    <button class="btn-secondary" @click="openScheduleModal([claim.id])" :disabled="updatingId === claim.id">
                                      {{ claim.claim_schedule ? 'Update Claiming Schedule' : 'Set Claiming Schedule' }}
                                    </button>
                                    <button class="btn-primary" @click="markClaimed(claim)" :disabled="updatingId === claim.id">
                                      Mark as Claimed
                                    </button>
                                  </template>
    
                                  <template v-else-if="claim.status === 'claimed'">
                                    <span class="badge locked-pill badge-open">🔒 Claimed — Locked.</span>
                                  </template>
    
                                  <template v-else-if="claim.status === 'pcic_rejected'">
                                    <span class="badge locked-pill badge-danger">🔒 Rejected — Locked. This claim can no longer be changed.</span>
                                  </template>
    
                                  <span v-if="updatingId === claim.id" class="updating-text">Updating...</span>
                                  <span v-if="updateSuccessId === claim.id" class="success-text">✓ Updated</span>
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
        
    
        <!-- ============================== -->
        <!-- BULK ACTION BAR                 -->
        <!-- ============================== -->
        <transition name="float-bar">
          <div v-if="canBulkAct && selectedIds.length > 0" class="bulk-action-bar">
            <div class="bulk-left">
              <strong>{{ selectedIds.length }}</strong>
              <span>claim(s) selected</span>
            </div>
    
            <div class="bulk-actions">
              <button v-if="activeStatusTab === 'under_mao_review'" class="btn-primary" @click="bulkSubmitToPcic" :disabled="bulkUpdating">
                {{ bulkUpdating ? 'Submitting...' : 'Submit Selected to PCIC' }}
              </button>
    
              <template v-else-if="activeStatusTab === 'in_pcic_processing'">
                <button class="btn-primary" @click="openScheduleModal(selectedIds)" :disabled="bulkUpdating">Set Claiming Schedule</button>
              </template>
    
              <template v-else-if="activeStatusTab === 'ready_for_claiming'">
                <button class="btn-secondary" @click="openScheduleModal(selectedIds)" :disabled="bulkUpdating">Set Claiming Schedule</button>
                <button class="btn-primary" @click="bulkMarkClaimed" :disabled="bulkUpdating">
                  {{ bulkUpdating ? 'Updating...' : 'Mark Selected as Claimed' }}
                </button>
              </template>
    
              <button class="btn-outline" @click="clearSelection">Clear</button>
            </div>
          </div>
        </transition>
    
        <!-- ============================== -->
        <!-- MODALS                          -->
        <!-- ============================== -->
        <Teleport to="body">
          <div v-if="showPcicModal" class="modal-backdrop" @click.self="showPcicModal = false">
            <div class="card small-modal">
              <h3 class="card-title">{{ pcicForm.result === 'approved' ? 'PCIC Approved' : 'PCIC Rejected' }}</h3>
    
              <div class="field">
                <span class="field-label">Remarks</span>
                <textarea class="field-input" v-model="pcicForm.pcic_remarks" placeholder="Enter PCIC remarks"></textarea>
              </div>
    
              <div class="modal-actions">
                <button class="btn-outline" @click="showPcicModal = false">Cancel</button>
                <button class="btn-primary" @click="savePcicResult">Save Result</button>
              </div>
            </div>
          </div>
        </Teleport>
    
        <Teleport to="body">
          <div v-if="showScheduleModal" class="modal-backdrop" @click.self="closeScheduleModal">
            <div class="card small-modal">
              <h3 class="card-title">Set Claiming Schedule</h3>
              <p class="modal-subtitle">This will apply to {{ scheduleTargetIds.length }} selected claim(s).</p>
    
              <div class="field">
                <span class="field-label">Claiming Date</span>
                <input class="field-input" v-model="scheduleForm.claim_schedule" type="date" />
              </div>
    
              <div class="field">
                <span class="field-label">Claiming Venue</span>
                <input class="field-input" v-model="scheduleForm.claim_venue" type="text" placeholder="e.g. Barangay Hall" />
              </div>
    
              <div class="modal-actions">
                <button class="btn-outline" @click="closeScheduleModal">Cancel</button>
                <button class="btn-primary" @click="saveClaimSchedule" :disabled="bulkUpdating">
                  {{ bulkUpdating ? 'Saving...' : 'Confirm' }}
                </button>
              </div>
            </div>
          </div>
        </Teleport>
      </main>
    </div> 
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'https://sanagustinagrisure.com'

const BATCHABLE_STATUSES = {
  under_mao_review: {
    endpoint: 'downloadCas02Pdf',
  },
  in_pcic_processing: {
    endpoint: 'bulk-schedule',
  },
  ready_for_claiming: {
    endpoint: 'claimed',
  },
}

const STATUS_TABS = [
  { key: 'under_mao_review', label: 'MAO Review', dot: 'blue' },
  { key: 'in_pcic_processing', label: 'PCIC Processing', dot: 'amber' },
  { key: 'ready_for_claiming', label: 'Ready for Claiming', dot: 'teal' },
  { key: 'claimed', label: 'Claimed', dot: 'purple' },
  { key: 'pcic_rejected', label: 'Rejected', dot: 'red' },
]

export default {
  name: 'MaoClaimsPage',

  data() {
    return {
      claims: [],
      seasons: [],

      /**
       * FIX: currentSeason is now fetched from the backend
       * (GET /api/insurance-seasons/current) instead of being guessed
       * client-side from `seasons[].status === 'application_open'`.
       *
       * The old computed version broke as soon as an MAO officer closed
       * applications for a season: its status flips to something like
       * 'application_closed', no season matches 'application_open' anymore,
       * currentSeason becomes null, and activeClaims('current') returns []
       * — every in-flight claim (MAO review, PCIC processing, ready for
       * claiming) disappears from the "Current Season" tab even though the
       * season is still very much active downstream of applications.
       *
       * Damage Reports already solved this correctly by asking the backend
       * what "current" means instead of re-deriving it from a status
       * string. Claims now does the same, so both pages agree on what
       * "current season" means and both survive closing applications.
       */
      currentSeason: null,

      activeTab: 'current',
      activeStatusTab: 'under_mao_review',
      historySeasonId: '',

      search: '',
      filterCrop: '',
      filterBarangay: '',

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
        pcic_remarks: '',
      },

      showScheduleModal: false,
      scheduleTargetIds: [],
      scheduleForm: {
        claim_schedule: '',
        claim_venue: '',
      },

      statusTabs: STATUS_TABS,
      currentUser: { name: 'Christopher', role: 'MAO Officer', initials: 'CP' },
    }
  },

  computed: {
    previousSeasons() {
      const currentId = this.currentSeason ? String(this.currentSeason.id) : null;
      return this.seasons.filter((season) => {
        const isCurrentId = String(season.id) === currentId;
        const isDefaultSeason = season.is_default === true || season.is_default === 1 || season.is_default === '1';
        return !isCurrentId && !isDefaultSeason;
      });
    },

    activeClaims() {
      const list = this.claims || []
      const currentId = this.currentSeason ? String(this.currentSeason.id) : null

      const getSeasonId = (claim) => {
        const id =
          claim.damage_report?.insurance_application?.season?.id ??
          claim.damage_report?.insurance_application?.insurance_season_id ??
          null
        return id === null ? null : String(id)
      }

      if (this.activeTab === 'current') {
        if (!currentId) return []
        return list.filter((claim) => getSeasonId(claim) === currentId)
      }

      // Previous: any claim whose season is not the current season
      let result = list.filter((claim) => {
        const seasonId = getSeasonId(claim)
        if (seasonId === null) return false
        return currentId === null || seasonId !== currentId
      })

      // Narrow further to the specific previous season chosen in the dropdown
      if (this.historySeasonId) {
        const targetId = String(this.historySeasonId)
        result = result.filter((claim) => getSeasonId(claim) === targetId)
      }

      return result
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

    barangayOptions() {
      var self = this
      var set = new Set(
        this.activeClaims
          .map(function(c) {
            return self.claimBarangay(c)
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

        var matchBarangay =
          !self.filterBarangay ||
          self.claimBarangay(claim) === self.filterBarangay

        return matchStatus && matchSearch && matchCrop && matchBarangay
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
    this.fetchCurrentSeason()
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

    /**
     * FIX: fetch the backend's notion of "current season" — the same
     * endpoint Damage Reports uses — instead of deriving it from
     * seasons[].status on the client. See the comment on `currentSeason`
     * in data() for why the old approach broke.
     */
    async fetchCurrentSeason() {
      try {
        const response = await axios.get(
          API_BASE + '/api/insurance-seasons/current',
          this.authHeaders()
        )
        this.currentSeason = response.data?.season || null
      } catch (err) {
        console.error('Error fetching current season:', err)
        this.currentSeason = null
      } finally {
        await this.fetchSeasons()
        await this.fetchClaims()
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
          API_BASE + '/api/claims',
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
    },

    selectPreviousSeason() {
      this.activeTab = 'previous'
      this.expandedId = null
      this.clearSelection()
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
      if (claim.status !== 'under_mao_review') return
      if (!confirm('Mark this claim as submitted to PCIC and download CAS-02?')) return

      this.updatingId = claim.id
      this.updateSuccessId = null

      try {
        var headers = this.authHeaders()
        headers.responseType = 'blob'

        var response = await axios.patch(
          API_BASE + '/api/claims/' + claim.id + '/downloadCas02Pdf',
          {},
          headers
        )

        var blob = new Blob([response.data], { type: 'application/pdf' })
        var url = window.URL.createObjectURL(blob)
        var link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'CAS-02_Claim_' + claim.id + '.pdf')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        claim.status = 'in_pcic_processing'
        this.updateSuccessId = claim.id
        this.flashSuccess(claim.id)
      } catch (err) {
        console.error(err)
        alert('Failed to update claim and download CAS-02 PDF.')
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
        pcic_remarks: '',
      }
      this.showPcicModal = true
    },

    async savePcicResult() {
      if (!this.pcicClaimId) return

      this.updatingId = this.pcicClaimId
      var targetId = this.pcicClaimId

      try {
        await axios.patch(
          API_BASE + '/api/claims/' + targetId + '/pcic-result',
          this.pcicForm,
          this.authHeaders()
        )

        var claim = this.claims.find(function(c) {
          return c.id === targetId
        })

        if (claim) {
          claim.status = this.pcicForm.result === 'approved' ? 'ready_for_claiming' : 'pcic_rejected'
          claim.pcic_remarks = this.pcicForm.pcic_remarks
        }

        this.showPcicModal = false
        this.updateSuccessId = targetId
        this.flashSuccess(targetId)
      } catch (err) {
        console.error(err)
        alert(err.response?.data?.message || 'Failed to save PCIC result.')
      } finally {
        this.updatingId = null
        this.pcicClaimId = null
      }
    },

    openScheduleModal(claimIds) {
      if (!claimIds || claimIds.length === 0) return
      this.scheduleTargetIds = claimIds.slice()
      this.scheduleForm = {
        claim_schedule: '',
        claim_venue: '',
      }
      this.showScheduleModal = true
    },

    closeScheduleModal() {
      this.showScheduleModal = false
      this.scheduleTargetIds = []
    },

    async saveClaimSchedule() {
      if (!this.scheduleForm.claim_schedule || !this.scheduleForm.claim_venue) {
        alert('Please provide both a claiming date and venue.')
        return
      }

      this.bulkUpdating = true

      try {
        var response = await axios.post(
          API_BASE + '/api/claims/bulk-schedule',
          {
            claim_ids: this.scheduleTargetIds,
            claim_schedule: this.scheduleForm.claim_schedule,
            claim_venue: this.scheduleForm.claim_venue,
          },
          this.authHeaders()
        )

        var updatedIds = response.data.updated_claim_ids || []
        var self = this

        updatedIds.forEach(function(id) {
          var claim = self.claims.find(function(c) {
            return c.id === id
          })
          if (claim) {
            claim.claim_schedule = self.scheduleForm.claim_schedule
            claim.claim_venue = self.scheduleForm.claim_venue
            claim.status = 'ready_for_claiming'
          }
        })

        if (response.data.skipped_claim_ids && response.data.skipped_claim_ids.length > 0) {
          alert(
            response.data.skipped_claim_ids.length +
            ' claim(s) were skipped (not eligible for scheduling).'
          )
        }

        this.closeScheduleModal()
        this.clearSelection()
      } catch (err) {
        console.error(err)
        alert(err.response?.data?.message || 'Failed to set claiming schedule.')
      } finally {
        this.bulkUpdating = false
      }
    },

    async bulkSubmitToPcic() {
      if (this.selectedIds.length === 0) return
      if (!confirm('Mark ' + this.selectedIds.length + ' claim(s) as submitted to PCIC?')) return
      await this.runBatchAction(BATCHABLE_STATUSES.under_mao_review.endpoint, 'in_pcic_processing', true)
    },

    async bulkMarkClaimed() {
      if (this.selectedIds.length === 0) return
      if (!confirm('Mark ' + this.selectedIds.length + ' claim(s) as claimed?')) return
      await this.runBatchAction(BATCHABLE_STATUSES.ready_for_claiming.endpoint, 'claimed', false)
    },

    async runBatchAction(endpoint, newStatus, isFileResponse = false) {
      this.bulkUpdating = true
      var idsToProcess = this.selectedIds.slice()
      var failedIds = []

      try {
        var headers = this.authHeaders()
        if (isFileResponse) {
          headers.responseType = 'blob'
        }

        var results = await Promise.allSettled(
          idsToProcess.map((id) =>
            axios.patch(
              API_BASE + '/api/claims/' + id + '/' + endpoint,
              {},
              headers
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

            if (isFileResponse && result.value?.data) {
              var blob = new Blob([result.value.data], { type: 'application/pdf' })
              var url = window.URL.createObjectURL(blob)
              var link = document.createElement('a')
              link.href = url
              link.setAttribute('download', 'CAS-02_Claim_' + idsToProcess[i] + '.pdf')
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              window.URL.revokeObjectURL(url)
            }
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

    hasCas02Data(claim) {
      if (!claim) return false
      return !!(
        claim.crop_stage_at_loss ||
        claim.area_damaged ||
        claim.degree_of_damage ||
        claim.expected_harvest_date ||
        claim.claim_filed_date ||
        claim.damage_report?.crop_stage_at_loss ||
        claim.damage_report?.area_damaged
      )
    },

    casField(claim, fieldName) {
      if (!claim) return null
      if (claim[fieldName] !== undefined && claim[fieldName] !== null) {
        return claim[fieldName]
      }
      return claim.damage_report?.[fieldName] ?? null
    },

    casCost(claim, fieldName) {
      const val = this.casField(claim, fieldName)
      if (val === null || val === undefined || val === '') return '—'
      return this.peso(val)
    },

    casTotalCost(claim) {
      const fields = [
        'cost_land_preparation',
        'cost_seedling_transplanting',
        'cost_seeds',
        'cost_fertilizer',
        'cost_chemicals',
        'cost_others',
      ]

      let total = 0
      let hasValue = false

      fields.forEach((field) => {
        const val = Number(this.casField(claim, field))
        if (!isNaN(val) && val > 0) {
          total += val
          hasValue = true
        }
      })

      const explicitTotal = Number(this.casField(claim, 'total_production_cost'))
      if (!hasValue && !isNaN(explicitTotal) && explicitTotal > 0) {
        return this.peso(explicitTotal)
      }

      return hasValue ? this.peso(total) : '—'
    },

    getProfile(claim) {
      var farm = claim.damage_report?.insurance_application?.farm
      return farm?.farmerProfile || farm?.farmer_profile || null
    },

    farmerName(claim) {
      var profile = this.getProfile(claim)
      var user = profile?.user
      if (!user) return '—'
      return [user.first_name, user.middle_name, user.last_name, user.extension_name]
        .filter(Boolean)
        .join(' ')
    },

    farmerContact(claim) {
      var profile = this.getProfile(claim)
      return profile?.user?.phone_number || profile?.phone_number || '—'
    },

    farmerAddress(claim) {
      var profile = this.getProfile(claim)
      return profile?.address || '—'
    },

    claimBarangay(claim) {
      if (!claim) return null
      var profile = this.getProfile(claim)
      var user = profile?.user

      var barangay = user?.barangay || profile?.barangay

      if (typeof barangay === 'string') return barangay
      if (typeof barangay === 'object' && barangay !== null) {
        return barangay.barangay_name || barangay.name || barangay.barangay || null
      }

      return profile?.address || null
    },

    countByStatus(status) {
      return this.activeClaims.filter(function(c) {
        return c.status === status
      }).length
    },

    statusLabel(status) {
      var map = {
        under_mao_review: 'Under MAO Review',
        in_pcic_processing: 'In PCIC Processing',
        ready_for_claiming: 'Ready for Claiming',
        claimed: 'Claimed',
        pcic_rejected: 'PCIC Rejected',
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
      this.filterBarangay = ''
      this.historySeasonId = ''
    },
  },
}
</script>

<style scoped>

/* ===================== GENERIC CARD ===================== */
.card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
}
 
.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0F212F;
  margin-bottom: 0.75rem;
}
 
/* ===================== BADGES ===================== */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}
 
.badge-open    { background: rgba(17, 109, 62, 0.1); color: #116D3E; }
.badge-subtle  { background: #F1F6F2; color: #5c6b64; }
.badge-danger  { background: rgba(193, 71, 61, 0.1); color: #C1473D; }
 
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-open   { background: #116D3E; }
.dot-closed { background: #94a3b8; }
 
/* Claim status badges — class is bound directly to claim.status */
.status-badge.under_mao_review   { background: rgba(46, 111, 142, 0.1);   color: #2E6F8E; }
.status-badge.in_pcic_processing { background: rgba(210, 149, 57, 0.14);  color: #AC7A2F; }
.status-badge.ready_for_claiming { background: rgba(14, 128, 116, 0.1);   color: #0E8074; }
.status-badge.claimed            { background: rgba(107, 91, 149, 0.12); color: #6B5B95; }
.status-badge.pcic_rejected      { background: rgba(193, 71, 61, 0.1);   color: #C1473D; }
 
.locked-pill {
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 8px;
}
 
/* ===================== SEASON CARD ===================== */
.season-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
 
.season-info { display: flex; align-items: center; }
 
.season-status-badge { font-size: 0.75rem; }
 
.season-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #F1F6F2;
  border: 1px solid #E0EAE3;
  border-radius: 10px;
  padding: 3px;
}
 
.toggle-btn {
  border: none;
  background: transparent;
  color: #5c6b64;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
}
 
.toggle-btn:hover { color: #116D3E; }
 
.toggle-btn.active {
  background: #FFFFFF;
  color: #116D3E;
  box-shadow: 0 2px 6px rgba(15, 33, 47, 0.08);
}
 
.toggle-select {
  width: auto;
  appearance: none;
  border: none;
  background: transparent;
  color: #5c6b64;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 7px 26px 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235c6b64' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 12px;
}
 
.toggle-select.active {
  background-color: #FFFFFF;
  color: #116D3E;
  box-shadow: 0 2px 6px rgba(15, 33, 47, 0.08);
}
 
/* ===================== STATUS TAB BAR ===================== */
.status-tab-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
 
.status-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #EAF1EC;
  background: #FFFFFF;
  color: #5c6b64;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 9px 15px;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(15, 33, 47, 0.03);
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
 
.status-tab:hover { border-color: #D7E2D8; color: #0F212F; }
 
.status-tab.active {
  background: #F1F6F2;
  border-color: #E0EAE3;
  color: #0F212F;
}
 
.tab-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.tab-dot.dot-blue,  .tab-dot.dot-mao_review    { background: #2E6F8E; }
.tab-dot.dot-amber, .tab-dot.dot-mao, .tab-dot.dot-pcic { background: #D29539; }
.tab-dot.dot-teal,  .tab-dot.dot-claiming      { background: #0E8074; }
.tab-dot.dot-purple,.tab-dot.dot-claimed       { background: #6B5B95; }
.tab-dot.dot-red,   .tab-dot.dot-rejected      { background: #C1473D; }
.tab-dot.dot-green                             { background: #116D3E; }
.tab-dot.dot-gray                              { background: #94a3b8; }
 
.tab-count {
  font-size: 0.66rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: #F1F6F2;
  color: #5c6b64;
}
 
.status-tab.active .tab-count {
  background: #FFFFFF;
  color: #116D3E;
}
 
/* ===================== FILTERS ===================== */
.filters-card { padding: 1.1rem 1.35rem; }
 
.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 12px;
  align-items: end;
}
 
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
 
.field-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
}
 
.field-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 500;
  color: #0F212F;
  background: #FFFFFF;
  font-family: inherit;
  transition: border-color 0.15s ease;
}
 
.field-input:focus { outline: none; border-color: #116D3E; }
 
select.field-input {
  padding-right: 30px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235c6b64' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
  appearance: none;
  cursor: pointer;
}
 
textarea.field-input { resize: vertical; min-height: 80px; }
 
.field-search { position: relative; }
 
.search-wrap { position: relative; }
 
.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}
 
.search-input { padding-left: 32px; }
 
.field-action { justify-content: flex-end; }
 
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 16px;
  background: #FFFFFF;
  color: #0F212F;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.btn-outline:hover { border-color: #116D3E; background: #F1F6F2; }
 
/* ===================== SUMMARY STATS ===================== */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
}
 
.summary-grid--6 { grid-template-columns: repeat(6, 1fr); }
 
.summary-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 14px;
  padding: 1rem 1.1rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
 
.summary-label { font-size: 0.75rem; font-weight: 600; color: #5c6b64; }
.summary-value { font-size: 1.5rem; font-weight: 700; color: #0F212F; }
 
.stat-blue     { color: #2E6F8E; }
.stat-mao      { color: #AC7A2F; }
.stat-teal     { color: #0E8074; }
.stat-purple   { color: #6B5B95; }
.stat-rejected { color: #C1473D; }
 
/* ===================== LOADING / ERROR STATES ===================== */
.status-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 3rem 1rem;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  font-size: 0.85rem;
  color: #5c6b64;
}
 
.status-error { color: #C1473D; }
 
.spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2.5px solid #E0EAE3;
  border-top-color: #116D3E;
  animation: spin 0.7s linear infinite;
}
 
@keyframes spin { to { transform: rotate(360deg); } }
 
/* ===================== TABLE ===================== */
.table-card { padding: 0.5rem; }
 
.empty-row {
  text-align: center;
  padding: 3rem 1rem;
  color: #5c6b64;
  font-size: 0.85rem;
}
 
.table-wrapper { overflow-x: auto; }
 
.data-table { width: 100%; border-collapse: collapse; }
 
.data-table thead th {
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
  padding: 10px 14px;
  background: #F1F6F2;
}
 
.data-table thead tr th:first-child { border-top-left-radius: 10px; border-bottom-left-radius: 10px; }
.data-table thead tr th:last-child  { border-top-right-radius: 10px; border-bottom-right-radius: 10px; }
 
.data-table tbody td {
  font-size: 0.82rem;
  color: #0F212F;
  padding: 12px 14px;
  border-bottom: 1px solid #F1F6F2;
}
 
.checkbox-cell { width: 32px; }
.checkbox-cell input { accent-color: #116D3E; width: 15px; height: 15px; cursor: pointer; }
 
.expand-cell { width: 28px; }
.expand-icon {
  display: inline-flex;
  color: #94a3b8;
  font-size: 0.65rem;
  transition: transform 0.15s ease;
}
.expand-icon.open { transform: rotate(90deg); color: #116D3E; }
 
.farmer-cell { min-width: 170px; }
.farmer-name { font-weight: 700; color: #0F212F; line-height: 1.3; }
.farmer-sub { font-size: 0.72rem; color: #5c6b64; margin-top: 1px; }
 
.main-row { cursor: pointer; transition: background 0.12s ease; }
.main-row:hover { background: #F8FAF8; }
.main-row.selected { background: rgba(17, 109, 62, 0.05); }
.main-row.expanded { background: #F1F6F2; }
 
/* ===================== DETAIL / ACCORDION ===================== */
.detail-row td { padding: 0; border-bottom: 1px solid #F1F6F2; }
 
.detail-box {
  background: #F8FAF8;
  border-top: 1px dashed #E0EAE3;
  padding: 1.25rem 1.5rem;
}
 
.detail-content { display: flex; }
 
.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
 
.detail-section { display: flex; flex-direction: column; gap: 0.7rem; }
 
.section-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0F212F;
}
 
.section-title.cost-subtitle {
  margin-top: 0.3rem;
  font-size: 0.76rem;
  color: #5c6b64;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
 
.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
 
.detail-item {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
 
.detail-label { font-size: 0.7rem; color: #5c6b64; }
.detail-val { font-size: 0.92rem; font-weight: 700; color: #0F212F; }
.detail-val.total-cost { color: #116D3E; }
 
.status-update-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
 
.updating-text { font-size: 0.78rem; color: #5c6b64; }
.success-text { font-size: 0.78rem; font-weight: 700; color: #116D3E; }
 
/* ===================== BUTTONS ===================== */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  border: none;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.28);
  transition: opacity 0.15s ease;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
 
.btn-primary.btn-danger {
  background: linear-gradient(135deg, #C1473D, #9A362E);
  box-shadow: 0 8px 18px rgba(193, 71, 61, 0.28);
}
 
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: #F1F6F2;
  border: 1px solid #E0EAE3;
  color: #116D3E;
  font-size: 0.82rem;
  font-weight: 700;
  border-radius: 9px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease;
}
.btn-secondary:hover { background: #E7F0EC; }
.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
 
/* ===================== BULK ACTION BAR ===================== */
.bulk-action-bar {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 30;
  min-width: 420px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #0F212F;
  color: #FFFFFF;
  border-radius: 14px;
  padding: 14px 20px;
  box-shadow: 0 14px 30px rgba(15, 33, 47, 0.35);
}
 
.bulk-left { display: flex; align-items: center; gap: 6px; font-size: 0.84rem; }
.bulk-left strong { color: #D29539; }
 
.bulk-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
 
.bulk-actions .btn-outline {
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  border-color: rgba(255, 255, 255, 0.25);
}
.bulk-actions .btn-outline:hover { background: rgba(255, 255, 255, 0.08); color: #FFFFFF; }
 
.float-bar-enter-active, .float-bar-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.float-bar-enter-from, .float-bar-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
 
/* ===================== MODALS ===================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15, 33, 47, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
 
.small-modal {
  width: 100%;
  max-width: 420px;
  box-shadow: 0 24px 60px rgba(15, 33, 47, 0.3);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
 
.small-modal .card-title { margin-bottom: 0; }
 
.modal-subtitle {
  font-size: 0.78rem;
  color: #5c6b64;
  margin-top: -8px;
}
 
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}
 
/* ===================== RESPONSIVE ===================== */
@media (max-width: 1200px) {
  .summary-grid, .summary-grid--6 { grid-template-columns: repeat(3, 1fr); }
  .filters-grid { grid-template-columns: 1fr 1fr; }
  .detail-grid { grid-template-columns: repeat(2, 1fr); }
}
 
@media (max-width: 768px) {
  .summary-grid, .summary-grid--6 { grid-template-columns: repeat(2, 1fr); }
  .filters-grid { grid-template-columns: 1fr; }
  .detail-grid { grid-template-columns: 1fr; }
  .season-card { flex-direction: column; align-items: flex-start; }
  .bulk-action-bar { left: 12px; right: 12px; transform: none; min-width: 0; flex-wrap: wrap; }
}
</style>