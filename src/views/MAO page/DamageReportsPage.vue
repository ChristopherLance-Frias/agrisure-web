<template>
  <div class="damage-page">
    <div class="page-header">
      <div class="header-inner">
        <h2 class="page-title">Damage Reports</h2>
        <p class="page-sub">Review and validate crop damage reports submitted by farmers</p>
      </div>
    </div>

    <div v-if="hasConfiguredSeason" class="season-card">
      <div class="season-info">
        <div class="season-icon" :class="currentSeason.status || 'closed'">
          {{ currentSeason.status === 'application_open' ? '⏱' : '🔒' }}
        </div>
      </div>

      <div class="season-toggle">
        <button
          class="toggle-btn"
          :class="{ active: activeSeasonView === 'current' }"
          @click="switchSeasonView('current')"
        >
          Current Season
        </button>

        <select
          class="toggle-select"
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
    </div>

    <div class="status-tab-bar">
      <button
        class="status-tab"
        :class="{ active: activeStatusTab === 'submitted_to_mao' }"
        @click="switchStatusTab('submitted_to_mao')"
      >
        <span class="tab-dot amber"></span>
        Submitted to MAO
        <span class="tab-count">{{ countByStatus('submitted_to_mao') }}</span>
      </button>

      <button
        class="status-tab"
        :class="{ active: activeStatusTab === 'validated_by_mao' }"
        @click="switchStatusTab('validated_by_mao')"
      >
        <span class="tab-dot green"></span>
        Validated by MAO
        <span class="tab-count">{{ countByStatus('validated_by_mao') }}</span>
      </button>

      <button
        class="status-tab"
        :class="{ active: activeStatusTab === 'rejected' }"
        @click="switchStatusTab('rejected')"
      >
        <span class="tab-dot red"></span>
        Rejected
        <span class="tab-count">{{ countByStatus('rejected') }}</span>
      </button>
    </div>

    <div class="filters-row">
      <div class="search-wrap">
        <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
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

      <button class="btn-reset" @click="resetFilters">
        Reset
      </button>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-label">Total</span>
        <span class="stat-value">{{ activeReports.length }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Submitted</span>
        <span class="stat-value mao">{{ countByStatus('submitted_to_mao') }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Validated</span>
        <span class="stat-value approved">{{ countByStatus('validated_by_mao') }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Rejected</span>
        <span class="stat-value rejected">{{ countByStatus('rejected') }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Suspicious</span>
        <span class="stat-value suspicious">{{ suspiciousCount }}</span>
      </div>
    </div>

    <div v-if="isLoading" class="state-box">
      <div class="spinner"></div>
      <span>Loading damage reports...</span>
    </div>

    <div v-else-if="errorMessage" class="state-box error-box">
      <span>{{ errorMessage }}</span>
    </div>

    <div v-else class="table-wrap">
      <div v-if="filtered.length === 0" class="empty-state">
        No damage reports match your filters.
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
                <div class="farmer-name">
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
                <span v-if="report.is_suspicious" class="flag-badge suspicious">
                  ⚠ Suspicious
                </span>
                <span v-else class="flag-badge ok">
                  Normal
                </span>
              </td>

              <td>
                <span class="status-badge" :class="report.status">
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

                        <div class="detail-grid">
                          <div class="detail-item">
                            <span class="detail-label">Full Name</span>
                            <span class="detail-val">{{ farmerName(report) }}</span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Phone</span>
                            <span class="detail-val">
                              {{ report.insurance_application?.farm?.farmer_profile?.user?.phone_number || '—' }}
                            </span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Address</span>
                            <span class="detail-val">
                              {{ report.insurance_application?.farm?.farmer_profile?.address || '—' }}
                            </span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Farm</span>
                            <span class="detail-val">
                              {{ report.insurance_application?.farm?.farm_name || '—' }}
                            </span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Crop Type</span>
                            <span class="detail-val">
                              {{ report.insurance_application?.farm?.crop_type || '—' }}
                            </span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Farm Area</span>
                            <span class="detail-val">
                              {{ report.insurance_application?.farm?.farm_area ? report.insurance_application.farm.farm_area + ' ha' : '—' }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div class="detail-section">
                        <div class="section-title">Damage Details</div>

                        <div class="detail-grid">
                          <div class="detail-item">
                            <span class="detail-label">Cause</span>
                            <span class="detail-val">{{ report.damage_cause || '—' }}</span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Damage Date</span>
                            <span class="detail-val">{{ formatDate(report.damage_date) }}</span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Reported At</span>
                            <span class="detail-val">{{ formatDateTime(report.created_at) }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="detail-section">
                        <div class="section-title">Location Verification</div>

                        <div class="detail-grid">
                          <div class="detail-item">
                            <span class="detail-label">Farm Coordinates</span>
                            <span class="detail-val coords">
                              {{ report.insurance_application?.farm?.latitude || '—' }},
                              {{ report.insurance_application?.farm?.longitude || '—' }}
                            </span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Report Coordinates</span>
                            <span class="detail-val coords">
                              {{ report.report_latitude || '—' }},
                              {{ report.report_longitude || '—' }}
                            </span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Distance from Farm</span>
                            <span class="detail-val">
                              {{ report.distance_from_farm != null ? report.distance_from_farm + ' m' : '—' }}
                            </span>
                          </div>

                          <div class="detail-item">
                            <span class="detail-label">Flag</span>
                            <span class="detail-val">
                              <span v-if="report.is_suspicious" class="flag-badge suspicious">
                                ⚠ Suspicious — location mismatch
                              </span>
                              <span v-else class="flag-badge ok">
                                Normal
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div class="detail-section">
                        <div class="section-title">Damage Report Action</div>

                        <div class="status-update-row" @click.stop>
                          <span class="status-badge" :class="report.status">
                            {{ statusLabel(report.status) }}
                          </span>

                          <template v-if="report.status === 'submitted_to_mao'">
                            <button
                              class="action-btn approved"
                              @click="updateStatus(report, 'validated_by_mao')"
                              :disabled="updatingId === report.id"
                            >
                              Validate and Create Claim
                            </button>

                            <button
                              class="action-btn rejected"
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

    <transition name="float-bar">
      <div v-if="canBulkAct && selectedIds.length > 0" class="bulk-action-bar floating">
        <div class="bulk-left">
          <strong>{{ selectedIds.length }}</strong>
          <span>damage report(s) selected</span>
        </div>

        <div class="bulk-actions">
          <button
            class="action-btn approved"
            @click="bulkUpdateStatus('validated_by_mao')"
            :disabled="bulkUpdating"
          >
            Validate Selected
          </button>

          <button
            class="action-btn rejected"
            @click="bulkUpdateStatus('rejected')"
            :disabled="bulkUpdating"
          >
            Reject Selected
          </button>

          <button class="btn-reset" @click="clearSelection">
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
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'http://192.168.100.173:8000'

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
    }
  },

  computed: {
    hasConfiguredSeason() {
      return !!this.currentSeason;
    },

    previousSeasons() {
      var currentId = this.currentSeason ? this.currentSeason.id : null
      return this.seasons.filter(function(season) {
        return season.id !== currentId
      })
    },

    activeReports() {
      return this.activeSeasonView === 'current'
        ? this.reports
        : this.historyReports
    },

    canBulkAct() {
      return this.activeStatusTab === 'submitted_to_mao'
    },

    causeOptions() {
      var set = new Set(
        this.activeReports
          .map(function(r) {
            return r.damage_cause
          })
          .filter(Boolean)
      )
      return Array.from(set).sort()
    },

    suspiciousCount() {
      return this.activeReports.filter(function(r) {
        return r.is_suspicious
      }).length
    },

    filtered() {
      var self = this

      return this.activeReports.filter(function(report) {
        var name = self.farmerName(report).toLowerCase()

        var matchName =
          !self.searchName ||
          name.indexOf(self.searchName.toLowerCase()) !== -1

        var matchCause =
          !self.filterCause ||
          report.damage_cause === self.filterCause

        var matchStatus = report.status === self.activeStatusTab

        var matchSuspicious =
          !self.suspiciousOnly ||
          report.is_suspicious

        var appSeasonId = report.insurance_application?.insurance_season_id || null;

        var matchSeason =
          self.activeSeasonView === 'current' ||
          !self.historySeasonId ||
          appSeasonId == self.historySeasonId

        return matchName && matchCause && matchStatus && matchSuspicious && matchSeason
      })
    },

    allFilteredSelected() {
      var self = this
      if (this.filtered.length === 0) return false
      return this.filtered.every(function(report) {
        return self.selectedIds.includes(report.id)
      })
    },
  },

  mounted() {
    this.fetchCurrentSeason()
  },

  methods: {
    authHeaders() {
      var token =
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
        var response = await axios.get(
          API_BASE + '/api/insurance-seasons/current',
          this.authHeaders()
        )

        // Extract from the raw array payload you provided
        var data = response.data;
        if (Array.isArray(data)) {
          this.currentSeason = data.find(s => s.is_default === true || s.is_default === 1) || data[0] || null;
        } else if (data && Array.isArray(data.season)) {
          this.currentSeason = data.season.find(s => s.is_default === true || s.is_default === 1) || data.season[0] || null;
        } else {
          this.currentSeason = data || null;
        }

        await this.fetchSeasons()
        await this.fetchReports()
      } catch (err) {
        console.error("Error fetching current season:", err)
        await this.fetchReports()
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

    async fetchReports() {
      this.isLoading = true
      this.errorMessage = ''

      try {
        var response = await axios.get(
          API_BASE + '/api/damage-reports',
          this.authHeaders()
        )

        var allReports = Array.isArray(response.data)
          ? response.data
          : response.data.data || []

        var currentId = this.currentSeason ? this.currentSeason.id : null

        this.reports = allReports.filter(function(report) {
          // Check both standard relationship and direct foreign key fallbacks if relation isn't eager loaded
          var appSeasonId = report.insurance_application?.insurance_season_id
                            || report.insurance_season_id
                            || null;

          if (currentId) {
            return String(appSeasonId) === String(currentId)
          } return true;
        })

        this.historyReports = allReports.filter(function(report) {
          var appSeasonId = report.insurance_application?.insurance_season_id
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
        var filteredIds = this.filtered.map(function(report) {
          return report.id
        })
        this.selectedIds = this.selectedIds.filter(function(id) {
          return !filteredIds.includes(id)
        })
      } else {
        this.filtered.forEach(function(report) {
          if (!self.selectedIds.includes(report.id)) {
            self.selectedIds.push(report.id)
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
        for (var i = 0; i < this.selectedIds.length; i++) {
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

      var confirmMessages = {
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

        var self = this
        setTimeout(function() {
          if (self.updateSuccessId === report.id) {
            self.updateSuccessId = null
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
      var map = {
        submitted_to_mao: 'Submitted to MAO',
        validated_by_mao: 'Validated by MAO',
        rejected: 'Rejected',
      }
      return map[status] || status || '—'
    },

    countByStatus(status) {
      return this.activeReports.filter(function(r) {
        return r.status === status
      }).length
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
.damage-page {
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

.season-text {
  display: flex;
  flex-direction: column;
}

.season-label {
  font-size: 11px;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 700;
}

.season-name {
  font-size: 14px;
  font-weight: 700;
  color: #1A3320;
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

.tab-dot.amber {
  background: #D97706;
}

.tab-dot.green {
  background: #34A853;
}

.tab-dot.red {
  background: #DC2626;
}

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

.suspicious-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 13px;
  background: #FFFFFF;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
}

.suspicious-toggle input {
  accent-color: #EA580C;
  cursor: pointer;
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

.stat-value.mao {
  color: #D97706;
}

.stat-value.approved {
  color: #34A853;
}

.stat-value.rejected {
  color: #DC2626;
}

.stat-value.suspicious {
  color: #EA580C;
}

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
  to {
    transform: rotate(360deg);
  }
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

.main-row.suspicious:not(.expanded) {
  background: #fff7ed;
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

.flag-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.flag-badge.suspicious {
  background: #ffedd5;
  color: #EA580C;
}

.flag-badge.ok {
  background: #f1f5f9;
  color: #64748b;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.submitted_to_mao {
  background: #fef3c7;
  color: #D97706;
}

.status-badge.validated_by_mao {
  background: #dcfce7;
  color: #16a34a;
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

.image-section {
  flex-shrink: 0;
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.damage-thumb {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  border: 1.5px solid #d1fae5;
}

.damage-thumb:hover {
  opacity: 0.85;
}

.no-image {
  width: 100%;
  height: 160px;
  border-radius: 10px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 12px;
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

.coords {
  font-size: 11px;
  font-family: monospace;
  color: #6b7280;
  font-weight: 500;
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

.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: zoom-out;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.4);
}

.lightbox-close {
  position: absolute;
  top: 24px;
  right: 28px;
  background: rgba(255,255,255,0.15);
  border: none;
  color: #FFFFFF;
  font-size: 18px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-close:hover {
  background: rgba(255,255,255,0.3);
}

@media (max-width: 768px) {
  .damage-page {
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

  .image-section {
    width: 100%;
  }

  .bulk-action-bar.floating {
    width: calc(100% - 24px);
    bottom: 12px;
  }
}
</style>