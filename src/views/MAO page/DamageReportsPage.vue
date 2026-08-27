<template>
  <div class="layout">
    <div class="main-wrapper">
      <!-- Page header -->
      <header class="top-header">
        <div class="header-title-group">
          <h1 class="page-title">Damage Reports</h1>
          <p class="page-sub">Review and validate crop damage reports submitted by farmers</p>
        </div>

        <div class="header-actions">
          <div v-if="hasConfiguredSeason" class="season-tabs-container">
            <button
              class="season-tab-btn"
              :class="{ active: activeSeasonView === 'current' }"
              @click="switchSeasonView('current')"
            >
              Current Season
            </button>

            <select
              class="season-tab-select"
              :class="{ active: activeSeasonView === 'history' }"
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
        <!-- Metrics -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="card-header">
              <span class="card-label">Total Reports</span>
              <span class="icon-badge blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <line x1="8" y1="9" x2="16" y2="9" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="12" y2="17" />
                </svg>
              </span>
            </div>
            <div class="card-value">{{ activeReports.length }}</div>
          </div>
    
          <div class="metric-card">
            <div class="card-header">
              <span class="card-label">Submitted</span>
              <span class="icon-badge amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 16 14" />
                </svg>
              </span>
            </div>
            <div class="card-value">{{ countByStatus('submitted_to_mao') }}</div>
          </div>
    
          <div class="metric-card">
            <div class="card-header">
              <span class="card-label">Validated</span>
              <span class="icon-badge green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            </div>
            <div class="card-value">{{ countByStatus('validated_by_mao') }}</div>
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
    
          <div class="metric-card">
            <div class="card-header">
              <span class="card-label">Suspicious</span>
              <span class="icon-badge purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                </svg>
              </span>
            </div>
            <div class="card-value">{{ suspiciousCount }}</div>
          </div>
        </div>
    
        <!-- Main panel -->
        <div class="panel">
          <div class="status-tab-bar">
            <button
              class="status-tab"
              :class="{ active: activeStatusTab === 'submitted_to_mao' }"
              @click="switchStatusTab('submitted_to_mao')"
            >
              <span class="dot dot-amber"></span>
              Submitted to MAO
              <span class="task-badge badge-amber">{{ countByStatus('submitted_to_mao') }}</span>
            </button>
    
            <button
              class="status-tab"
              :class="{ active: activeStatusTab === 'validated_by_mao' }"
              @click="switchStatusTab('validated_by_mao')"
            >
              <span class="dot dot-green"></span>
              Validated by MAO
              <span class="task-badge badge-green">{{ countByStatus('validated_by_mao') }}</span>
            </button>
    
            <button
              class="status-tab"
              :class="{ active: activeStatusTab === 'rejected' }"
              @click="switchStatusTab('rejected')"
            >
              <span class="dot dot-red"></span>
              Rejected
              <span class="task-badge badge-red">{{ countByStatus('rejected') }}</span>
            </button>
          </div>
    
          <div class="filters-row">
            <div class="search-wrap">
              <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
    
              <input
                v-model="searchName"
                class="search-input"
                type="text"
                placeholder="Search farmer name..."
              />
            </div>
    
            <select v-model="filterCause" class="filter-select">
              <option value="">All Causes</option>
              <option v-for="c in causeOptions" :key="c" :value="c">
                {{ c }}
              </option>
            </select>
    
            <label class="suspicious-toggle">
              <input type="checkbox" v-model="suspiciousOnly" />
              <span>Suspicious only</span>
            </label>
    
            <button class="btn-outline btn-compact" @click="resetFilters">
              Reset
            </button>
          </div>
    
          <div v-if="isLoading" class="state-box">
            <div class="spinner"></div>
            <span>Loading damage reports...</span>
          </div>
    
          <div v-else-if="errorMessage" class="state-box error-box">
            <span>{{ errorMessage }}</span>
          </div>
    
          <div v-else class="table-responsive">
            <div v-if="filtered.length === 0" class="empty-state">
              No damage reports match your filters.
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
                  <th>Cause</th>
                  <th>Damage Date</th>
                  <th>Distance (m)</th>
                  <th>Flag</th>
                  <th>Status</th>
                </tr>
              </thead>
    
              <tbody>
                <template v-for="report in filtered" :key="report.id">
                  <tr
                    class="main-row"
                    :class="{
                      expanded: expandedId === report.id,
                      suspicious: report.is_suspicious,
                      selected: isSelected(report.id)
                    }"
                    @click="toggleExpand(report.id)"
                  >
                    <td v-if="canBulkAct" @click.stop>
                      <input
                        type="checkbox"
                        :checked="isSelected(report.id)"
                        @change="toggleSelection(report.id)"
                      />
                    </td>
    
                    <td class="expand-cell">
                      <span class="expand-icon" :class="{ open: expandedId === report.id }">
                        ▶
                      </span>
                    </td>
    
                    <td class="farmer-cell">
                      <div class="farmer-name font-bold">
                        {{ farmerName(report) }}
                      </div>
                      <div class="farmer-sub">
                        {{ report.insurance_application?.farm?.farmer_profile?.user?.email || '—' }}
                      </div>
                    </td>
                    <td>{{ report.insurance_application?.farm?.farm_name || '—' }}</td>
                    <td>{{ report.damage_cause || '—' }}</td>
                    <td>{{ formatDate(report.damage_date) }}</td>
                    <td>{{ report.distance_from_farm ?? '—' }}</td>
    
                    <td>
                      <span v-if="report.is_suspicious" class="severity-badge warning">
                        ⚠ Suspicious
                      </span>
                      <span v-else class="severity-badge success">
                        Normal
                      </span>
                    </td>
    
                    <td>
                      <span class="status-pill" :class="report.status">
                        {{ statusLabel(report.status) }}
                      </span>
                    </td>
                  </tr>
    
                  <tr v-if="expandedId === report.id" class="detail-row">
                    <td colspan="9">
                      <div class="detail-box">
                        <div class="detail-content">
                          <div class="image-section">
                            <span class="detail-label">Damage Photo</span>
    
                            <img
                              v-if="report.damage_image_path"
                              :src="imageUrl(report.damage_image_path)"
                              class="damage-thumb"
                              alt="Damage photo"
                              @click.stop="openLightbox(report.damage_image_path)"
                            />
    
                            <div v-else class="no-image">
                              No image
                            </div>
                          </div>
    
                          <div class="info-section">
                            <div class="detail-section">
                              <div class="section-title">Farmer Information</div>
    
                              <div class="summary-grid">
                                <div class="summary-card">
                                  <div class="summary-label">Full Name</div>
                                  <div class="summary-value text-dark">{{ farmerName(report) }}</div>
                                </div>
    
                                <div class="summary-card">
                                  <div class="summary-label">Phone</div>
                                  <div class="summary-value text-dark">
                                    {{ report.insurance_application?.farm?.farmer_profile?.user?.phone_number || '—' }}
                                  </div>
                                </div>
    
                                <div class="summary-card">
                                  <div class="summary-label">Address</div>
                                  <div class="summary-value text-dark">
                                    {{ report.insurance_application?.farm?.farmer_profile?.address || '—' }}
                                  </div>
                                </div>
    
                                <div class="summary-card">
                                  <div class="summary-label">Farm</div>
                                  <div class="summary-value text-dark">
                                    {{ report.insurance_application?.farm?.farm_name || '—' }}
                                  </div>
                                </div>
    
                                <div class="summary-card">
                                  <div class="summary-label">Crop Type</div>
                                  <div class="summary-value text-dark">
                                    {{ report.insurance_application?.farm?.crop_type || '—' }}
                                  </div>
                                </div>
    
                                <div class="summary-card">
                                  <div class="summary-label">Farm Area</div>
                                  <div class="summary-value text-dark">
                                    {{ report.insurance_application?.farm?.farm_area ? report.insurance_application.farm.farm_area + ' ha' : '—' }}
                                  </div>
                                </div>
                              </div>
                            </div>
    
                            <div class="detail-section">
                              <div class="section-title">Damage Details</div>
    
                              <div class="summary-grid">
                                <div class="summary-card">
                                  <div class="summary-label">Cause</div>
                                  <div class="summary-value text-dark">{{ report.damage_cause || '—' }}</div>
                                </div>
    
                                <div class="summary-card">
                                  <div class="summary-label">Damage Date</div>
                                  <div class="summary-value text-dark">{{ formatDate(report.damage_date) }}</div>
                                </div>
    
                                <div class="summary-card col-span-full">
                                  <div class="summary-label">Reported At</div>
                                  <div class="summary-value text-dark">{{ formatDateTime(report.created_at) }}</div>
                                </div>
                              </div>
                            </div>
    
                            <div class="detail-section">
                              <div class="section-title">Location Verification</div>
    
                              <div class="summary-grid">
                                <div class="summary-card">
                                  <div class="summary-label">Farm Coordinates</div>
                                  <div class="summary-value text-dark coords">
                                    {{ report.insurance_application?.farm?.latitude || '—' }},
                                    {{ report.insurance_application?.farm?.longitude || '—' }}
                                  </div>
                                </div>
    
                                <div class="summary-card">
                                  <div class="summary-label">Report Coordinates</div>
                                  <div class="summary-value text-dark coords">
                                    {{ report.report_latitude || '—' }},
                                    {{ report.report_longitude || '—' }}
                                  </div>
                                </div>
    
                                <div class="summary-card">
                                  <div class="summary-label">Distance from Farm</div>
                                  <div class="summary-value text-dark">
                                    {{ report.distance_from_farm != null ? report.distance_from_farm + ' m' : '—' }}
                                  </div>
                                </div>
    
                                <div class="summary-card">
                                  <div class="summary-label">Flag</div>
                                  <div class="summary-value">
                                    <span v-if="report.is_suspicious" class="severity-badge warning">
                                      ⚠ Location mismatch
                                    </span>
                                    <span v-else class="severity-badge success">
                                      Normal
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
    
                            <div class="detail-section">
                              <div class="section-title">Damage Report Action</div>
    
                              <div class="status-update-row" @click.stop>
                                <span class="status-pill" :class="report.status">
                                  {{ statusLabel(report.status) }}
                                </span>
    
                                <template v-if="report.status === 'submitted_to_mao'">
                                  <button
                                    class="btn-primary btn-compact"
                                    @click="updateStatus(report, 'validated_by_mao')"
                                    :disabled="updatingId === report.id"
                                  >
                                    Validate and Create Claim
                                  </button>
    
                                  <button
                                    class="btn-danger btn-compact"
                                    @click="updateStatus(report, 'rejected')"
                                    :disabled="updatingId === report.id"
                                  >
                                    Reject Report
                                  </button>
                                </template>
    
                                <template v-else-if="report.status === 'validated_by_mao'">
                                  <span class="locked-pill approved">
                                    🔒 Validated — Locked. Claim already created.
                                  </span>
                                </template>
    
                                <template v-else-if="report.status === 'rejected'">
                                  <span class="locked-pill rejected">
                                    🔒 Rejected — Locked. This report can no longer be changed.
                                  </span>
                                </template>
    
                                <span v-if="updatingId === report.id" class="updating-text">
                                  Updating...
                                </span>
    
                                <span v-if="updateSuccessId === report.id" class="success-text">
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
              <span>damage report(s) selected</span>
            </div>
    
            <div class="bulk-actions">
              <button
                class="btn-primary btn-compact"
                @click="bulkUpdateStatus('validated_by_mao')"
                :disabled="bulkUpdating"
              >
                Validate Selected
              </button>
    
              <button
                class="btn-danger btn-compact"
                @click="bulkUpdateStatus('rejected')"
                :disabled="bulkUpdating"
              >
                Reject Selected
              </button>
    
              <button class="link-btn-muted" @click="clearSelection">
                Clear
              </button>
            </div>
          </div>
        </transition>
    
        <div v-if="lightboxImage" class="lightbox" @click="closeLightbox">
          <img
            :src="lightboxImage"
            class="lightbox-img"
            alt="Damage photo full view"
          />
          <button class="lightbox-close" @click="closeLightbox">
            ✕
          </button>
        </div>
      </main>
     
    </div>
  </div>
 
</template>

<script>
import axios from 'axios'

const API_BASE = 'https://sanagustinagrisure.com'

export default {
  name: 'DamageReportsPage',

  data() {
    return {
      activeSeasonView: 'current',
      activeStatusTab: 'submitted_to_mao',

      reports: [],
      historyReports: [],
      seasons: [],
      currentSeason: null,
      historySeasonId: '',

      selectedIds: [],
      isLoading: false,
      errorMessage: '',
      expandedId: null,

      searchName: '',
      filterCause: '',
      suspiciousOnly: false,

      lightboxImage: null,
      updatingId: null,
      bulkUpdating: false,
      updateSuccessId: null,
      currentUser: { name: 'Christopher', role: 'MAO Officer', initials: 'CP' },
    }
  },

  computed: {
    hasConfiguredSeason() {
      return !!this.currentSeason;
    },

    previousSeasons() {
      const currentId = this.currentSeason ? String(this.currentSeason.id) : null;
      return this.seasons.filter((season) => {
        const isCurrentId = String(season.id) === currentId;
        const isDefaultSeason = season.is_default === true || season.is_default === 1 || season.is_default === '1';
        return !isCurrentId && !isDefaultSeason;
      });
    },

    /**
     * FIX: Previously this just returned `this.reports` or `this.historyReports`
     * wholesale — `historyReports` is every non-current-season report combined,
     * with no further narrowing to the single previous season chosen in the
     * dropdown. Only the table (`filtered`) applied that extra narrowing, so
     * everything else derived from `activeReports` — the 5 metric cards,
     * the status-tab counts, and the Cause filter options — stayed identical
     * no matter which previous season you picked. Now the season-specific
     * narrowing happens here, once, so every computed value built on top of
     * `activeReports` is consistent with the selected season.
     */
    activeReports() {
      const base = this.activeSeasonView === 'current' ? this.reports : this.historyReports

      if (this.activeSeasonView === 'history' && this.historySeasonId) {
        const targetId = String(this.historySeasonId)
        return base.filter((report) => {
          const appSeasonId = report.insurance_application?.insurance_season_id
                            ?? report.insurance_season_id
                            ?? null
          return appSeasonId !== null && String(appSeasonId) === targetId
        })
      }

      return base
    },

    canBulkAct() {
      return this.activeStatusTab === 'submitted_to_mao'
    },

    causeOptions() {
      const set = new Set(
        this.activeReports
          .map((r) => r.damage_cause)
          .filter(Boolean)
      )
      return Array.from(set).sort()
    },

    suspiciousCount() {
      return this.activeReports.filter((r) => r.is_suspicious).length
    },

    filtered() {
      // Season scoping now happens in `activeReports`, so this only needs
      // to apply the search/cause/status/suspicious filters on top of it.
      return this.activeReports.filter((report) => {
        const name = this.farmerName(report).toLowerCase()

        const matchName =
          !this.searchName ||
          name.indexOf(this.searchName.toLowerCase()) !== -1

        const matchCause =
          !this.filterCause ||
          report.damage_cause === this.filterCause

        const matchStatus = report.status === this.activeStatusTab

        const matchSuspicious =
          !this.suspiciousOnly ||
          report.is_suspicious

        return matchName && matchCause && matchStatus && matchSuspicious
      })
    },

    allFilteredSelected() {
      if (this.filtered.length === 0) return false
      return this.filtered.every((report) => {
        return this.selectedIds.includes(report.id)
      })
    },
  },

  mounted() {
    this.fetchCurrentSeason()
  },

  methods: {
    authHeaders() {
      const token =
        localStorage.getItem('mao_token') ||
        localStorage.getItem('token')

      return {
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/json',
        },
      }
    },

async fetchCurrentSeason() {
  try {
    const response = await axios.get(
      API_BASE + '/api/insurance-seasons/current',
      this.authHeaders()
    )

    this.currentSeason = response.data?.season || null

    await this.fetchSeasons()
    await this.fetchReports()
  } catch (err) {
    console.error("Error fetching current season:", err)
    await this.fetchReports()
  }
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
      } catch (err) {
        console.error(err)
      }
    },

    async fetchReports() {
      this.isLoading = true
      this.errorMessage = ''

      try {
        const response = await axios.get(
          API_BASE + '/api/damage-reports',
          this.authHeaders()
        )

        const allReports = Array.isArray(response.data)
          ? response.data
          : response.data.data || []

        const currentId = this.currentSeason ? this.currentSeason.id : null

        this.reports = allReports.filter((report) => {
          const appSeasonId = report.insurance_application?.insurance_season_id
                            || report.insurance_season_id
                            || null;

          if (currentId) {
            return String(appSeasonId) === String(currentId)
          } return true;
        })

        this.historyReports = allReports.filter((report) => {
          const appSeasonId = report.insurance_application?.insurance_season_id
                            || report.insurance_season_id
                            || null;

          if (currentId) {
            return String(appSeasonId) !== String(currentId)
          } return false;
        })
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          this.errorMessage = err.response.data.message
        } else {
          this.errorMessage = 'Failed to load damage reports. Check your connection.'
        }
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    switchSeasonView(view) {
      this.activeSeasonView = view
      this.expandedId = null
      this.clearSelection()
      this.resetFilters()
    },

    selectPreviousSeason() {
      this.activeSeasonView = 'history'
      this.expandedId = null
      this.clearSelection()
    },

    switchStatusTab(status) {
      this.activeStatusTab = status
      this.expandedId = null
      this.clearSelection()
    },

    toggleSelection(id) {
      if (!this.canBulkAct) return
      if (this.selectedIds.includes(id)) {
        this.selectedIds = this.selectedIds.filter((selectedId) => selectedId !== id)
      } else {
        this.selectedIds.push(id)
      }
    },

    toggleSelectAllFiltered() {
      if (!this.canBulkAct) return

      if (this.allFilteredSelected) {
        const filteredIds = this.filtered.map((report) => report.id)
        this.selectedIds = this.selectedIds.filter((id) => !filteredIds.includes(id))
      } else {
        this.filtered.forEach((report) => {
          if (!this.selectedIds.includes(report.id)) {
            this.selectedIds.push(report.id)
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

    async bulkUpdateStatus(status) {
      if (this.selectedIds.length === 0) return
      if (!confirm('Update ' + this.selectedIds.length + ' selected damage report(s)?')) {
        return
      }

      this.bulkUpdating = true
      try {
        for (let i = 0; i < this.selectedIds.length; i++) {
          await this.updateStatusById(this.selectedIds[i], status)
        }
        this.clearSelection()
        await this.fetchReports()
      } catch (err) {
        console.error(err)
        alert('Failed to update selected reports.')
      } finally {
        this.bulkUpdating = false
      }
    },

    async updateStatus(report, newStatus) {
      if (report.status !== 'submitted_to_mao') return
      if (newStatus === report.status) return

      const confirmMessages = {
        validated_by_mao: 'Validate this damage report and create a claim? This cannot be undone.',
        rejected: 'Reject this damage report? This cannot be undone.',
      }

      if (confirmMessages[newStatus] && !confirm(confirmMessages[newStatus])) {
        return
      }

      this.updatingId = report.id
      this.updateSuccessId = null

      try {
        await this.updateStatusById(report.id, newStatus)
        report.status = newStatus
        this.updateSuccessId = report.id

        setTimeout(() => {
          if (this.updateSuccessId === report.id) {
            this.updateSuccessId = null
          }
        }, 2000)
      } catch (err) {
        console.error(err)
        alert(err.response?.data?.message || 'Failed to update status.')
      } finally {
        this.updatingId = null
      }
    },

    async updateStatusById(id, status) {
      await axios.put(
        API_BASE + '/api/damage-reports/' + id + '/status',
        { status: status },
        this.authHeaders()
      )
    },

    toggleExpand(id) {
      this.expandedId = this.expandedId === id ? null : id
    },

    farmerName(report) {
      const u = report.insurance_application?.farm?.farmer_profile?.user
      if (!u) return '—'
      return [u.first_name, u.middle_name, u.last_name, u.extension_name].filter(Boolean).join(' ')
    },

    imageUrl(path) {
      if (!path) return ''
      return API_BASE + '/storage/' + path
    },

    openLightbox(path) {
      this.lightboxImage = this.imageUrl(path)
    },

    closeLightbox() {
      this.lightboxImage = null
    },

    statusLabel(status) {
      const map = {
        submitted_to_mao: 'Submitted to MAO',
        validated_by_mao: 'Validated by MAO',
        rejected: 'Rejected',
      }
      return map[status] || status || '—'
    },

    countByStatus(status) {
      return this.activeReports.filter((r) => r.status === status).length
    },

    formatDate(date) {
      if (!date) return '—'
      return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },

    formatDateTime(date) {
      if (!date) return '—'
      return new Date(date).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },

    resetFilters() {
      this.searchName = ''
      this.filterCause = ''
      this.historySeasonId = ''
      this.suspiciousOnly = false
    },
  },
}
</script>


<style scoped>
* { box-sizing: border-box; }
 
/* SEASON TABS (styled to match top-header) */
.season-tabs-container {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #F1F6F3;
  border: 1px solid #E7F0EC;
  border-radius: 10px;
  padding: 3px;
}

.season-tab-btn {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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

.season-tab-btn:hover {
  color: #0F212F;
}

.season-tab-btn.active {
  background-color: #FFFFFF;
  color: #116D3E;
  box-shadow: 0 1px 3px rgba(15, 33, 47, 0.08);
}

.season-tab-select {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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

.season-tab-select:hover {
  color: #0F212F;
}

.season-tab-select.active {
  background-color: #FFFFFF;
  color: #116D3E;
  box-shadow: 0 1px 3px rgba(15, 33, 47, 0.08);
}
 
/* ---------- Metrics grid ---------- */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
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
 
.icon-badge svg {
  width: 18px;
  height: 18px;
  display: block;
}
 
.icon-badge.green  { background: rgba(17, 109, 62, 0.12);  color: #116D3E; }
.icon-badge.blue   { background: rgba(46, 111, 142, 0.12); color: #2E6F8E; }
.icon-badge.amber  { background: rgba(210, 149, 57, 0.16); color: #AC7A2F; }
.icon-badge.red    { background: rgba(193, 71, 61, 0.12);  color: #C1473D; }
.icon-badge.purple { background: rgba(107, 91, 149, 0.12); color: #6B5B95; }
 
.card-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0F212F;
}
 
/* ---------- Panel ---------- */
.panel {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
 
/* ---------- Status tab bar (segmented control) ---------- */
.status-tab-bar {
  display: flex;
  gap: 6px;
  background: #F1F6F2;
  padding: 4px;
  border-radius: 10px;
  width: fit-content;
}
 
.status-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  font-size: 0.8rem;
  font-weight: 600;
  color: #5c6b64;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
 
.status-tab.active {
  background: #FFFFFF;
  color: #0F212F;
  box-shadow: 0 2px 8px rgba(15, 33, 47, 0.08);
}
 
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green  { background: #116D3E; }
.dot-amber  { background: #D29539; }
.dot-red    { background: #C1473D; }
 
.task-badge {
  font-size: 0.66rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
}
 
.badge-green  { background: rgba(17, 109, 62, 0.1);  color: #116D3E; }
.badge-amber  { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.badge-red    { background: rgba(193, 71, 61, 0.1);  color: #C1473D; }
 
/* ---------- Filters ---------- */
.filters-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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
  color: #94a3b8;
}
 
.search-input,
.filter-select {
  width: 100%;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  padding: 8px 12px;
  font-size: 0.8rem;
  color: #0F212F;
  background: #FFFFFF;
  outline: none;
  transition: border-color 0.15s ease;
}
 
.search-input { padding-left: 32px; }
 
.search-input:focus,
.filter-select:focus {
  border-color: #116D3E;
}
 
.filter-select {
  width: auto;
  min-width: 150px;
  cursor: pointer;
}
 
.suspicious-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #5c6b64;
  cursor: pointer;
  white-space: nowrap;
}
 
/* ---------- Buttons ---------- */
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
  padding: 11px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  border: none;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.28);
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
 
.btn-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px;
  background: linear-gradient(135deg, #C1473D, #922E26);
  color: #FFFFFF;
  border: none;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(193, 71, 61, 0.28);
}
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
 
.btn-compact { width: auto; padding: 9px 16px; }
 
.link-btn-muted {
  background: none;
  border: none;
  color: #5c6b64;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}
.link-btn-muted:hover { color: #116D3E; }
 
/* ---------- States ---------- */
.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 2.5rem;
  color: #5c6b64;
  font-size: 0.85rem;
}
 
.error-box { color: #C1473D; }
 
.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid #E0EAE3;
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
 
/* ---------- Table ---------- */
.table-responsive { overflow-x: auto; }
 
.data-table { width: 100%; border-collapse: collapse; }
 
.data-table thead th {
  text-align: left;
  font-size: 0.7rem;
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
.main-row.selected { background: rgba(17, 109, 62, 0.06); }
.main-row.suspicious .farmer-name { color: #C1473D; }
 
.expand-cell { width: 24px; }
 
.expand-icon {
  display: inline-block;
  font-size: 0.6rem;
  color: #94a3b8;
  transition: transform 0.15s ease;
}
.expand-icon.open { transform: rotate(90deg); color: #116D3E; }
 
.farmer-sub { font-size: 0.72rem; color: #5c6b64; margin-top: 2px; }
 
.severity-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}
.severity-badge.warning { background: rgba(193, 71, 61, 0.1); color: #C1473D; }
.severity-badge.success { background: rgba(17, 109, 62, 0.1); color: #116D3E; }
 
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}
.status-pill.submitted_to_mao { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.status-pill.validated_by_mao { background: rgba(17, 109, 62, 0.1);  color: #116D3E; }
.status-pill.rejected         { background: rgba(193, 71, 61, 0.1);  color: #C1473D; }
 
/* ---------- Expanded detail row ---------- */
.detail-row td { padding: 0; border-bottom: 1px solid #F1F6F2; }
 
.detail-box {
  background: #F8FAF8;
  padding: 1.3rem;
}
 
.detail-content {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1.5rem;
}
 
.image-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
 
.detail-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
}
 
.damage-thumb {
  width: 100%;
  border-radius: 12px;
  border: 1px solid #EAF1EC;
  cursor: zoom-in;
  object-fit: cover;
}
 
.no-image {
  border: 1px dashed #D7E2D8;
  border-radius: 12px;
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.76rem;
  color: #94a3b8;
}
 
.info-section {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
 
.section-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0F212F;
  margin-bottom: 0.6rem;
}
 
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.7rem;
}
 
.summary-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
}
 
.summary-card.col-span-full { grid-column: 1 / -1; }
 
.summary-label { font-size: 0.68rem; color: #5c6b64; margin-bottom: 4px; }
.summary-value { font-size: 0.82rem; font-weight: 600; }
.summary-value.coords { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.74rem; }
 
.text-dark { color: #0F212F; }
 
.status-update-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
 
.locked-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}
.locked-pill.approved { background: rgba(17, 109, 62, 0.1); color: #116D3E; }
.locked-pill.rejected { background: rgba(193, 71, 61, 0.1); color: #C1473D; }
 
.updating-text { font-size: 0.76rem; color: #5c6b64; }
.success-text { font-size: 0.76rem; color: #116D3E; font-weight: 600; }
 
/* ---------- Floating bulk action bar ---------- */
.bulk-action-bar.floating {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 20px;
  background: #0F212F;
  color: #FFFFFF;
  border-radius: 14px;
  padding: 12px 18px;
  box-shadow: 0 16px 36px rgba(15, 33, 47, 0.3);
  z-index: 30;
}
 
.bulk-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
}
 
.bulk-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
 
.bulk-actions .link-btn-muted { color: rgba(255, 255, 255, 0.7); }
.bulk-actions .link-btn-muted:hover { color: #FFFFFF; }
 
.float-bar-enter-active,
.float-bar-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.float-bar-enter-from,
.float-bar-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }
 
/* ---------- Lightbox ---------- */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(15, 33, 47, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  cursor: zoom-out;
}
 
.lightbox-img {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 12px;
}
 
.lightbox-close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  font-size: 1rem;
  cursor: pointer;
}
 
/* ---------- Responsive ---------- */
@media (max-width: 1200px) {
  .metrics-grid { grid-template-columns: repeat(3, 1fr); }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
}
 
@media (max-width: 900px) {
  .detail-content { grid-template-columns: 1fr; }
}
 
@media (max-width: 768px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .summary-grid { grid-template-columns: 1fr; }
  .page-header-row { flex-direction: column; align-items: flex-start; }
}
</style>