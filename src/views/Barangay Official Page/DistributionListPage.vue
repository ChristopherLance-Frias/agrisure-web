<template>
  <div class="distribution-page">
    <!-- PAGE HEADER -->
    <header class="page-header">
      <div class="header-title-group">
        <h1>Distribution Lists</h1>
        <p>View assistance distribution lists sent by the MAO to your barangay</p>
      </div>

      <div class="header-actions">
        <button class="refresh-btn" @click="fetchLists">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          Refresh Data
        </button>
      </div>
    </header>

    <!-- METRICS SUMMARY ROW -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="card-header">
          <span class="card-label">Active Distributions</span>
          <div class="icon-badge green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
        </div>
        <div class="card-value">{{ activeLists.length }}</div>
      </div>

      <div class="metric-card">
        <div class="card-header">
          <span class="card-label">Completed History</span>
          <div class="icon-badge blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
        </div>
        <div class="card-value">{{ completedLists.length }}</div>
      </div>

      <div class="metric-card">
        <div class="card-header">
          <span class="card-label">Total Recipients</span>
          <div class="icon-badge gray">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
        </div>
        <div class="card-value">{{ totalRecipients }}</div>
      </div>
    </div>

    <!-- MAIN CARD CONTAINER -->
    <div class="content-card">
      <div class="toolbar">
        <div class="tab-header">
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'active' }"
            @click="currentTab = 'active'"
          >
            Active Distributions
            <span class="tab-badge">{{ activeLists.length }}</span>
          </button>

          <button
            class="tab-btn"
            :class="{ active: currentTab === 'completed' }"
            @click="currentTab = 'completed'"
          >
            Completed History
            <span class="tab-badge completed-badge">{{ completedLists.length }}</span>
          </button>
        </div>

        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Search distribution title or venue..."
          />
        </div>
      </div>

      <!-- LIST / CONTENT STATES -->
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <span>Loading distribution lists...</span>
      </div>

      <div v-else-if="filteredLists.length === 0" class="state-box empty">
        <p>No {{ currentTab === 'active' ? 'active' : 'completed' }} distribution lists found.</p>
      </div>

      <div v-else class="list-grid">
        <div
          v-for="list in filteredLists"
          :key="list.id"
          class="list-card"
          @click="openList(list.id)"
        >
          <div class="card-top">
            <div>
              <h3>{{ list.event?.title || 'Untitled Distribution' }}</h3>
              <p class="venue-text">
                <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ list.event?.venue || 'No venue provided' }}
              </p>
            </div>
            <span
              class="status-pill"
              :class="list.status === 'completed' ? 'completed' : 'published'"
            >
              {{ list.status === 'completed' ? 'Completed' : 'Active' }}
            </span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span>Date</span>
              <strong>{{ formatDate(list.event?.distribution_date) }}</strong>
            </div>

            <div class="meta-item">
              <span>Time</span>
              <strong>{{ formatTime(list.event?.distribution_time) }}</strong>
            </div>

            <div class="meta-item">
              <span>Recipients</span>
              <strong>{{ list.farmers?.length || 0 }}</strong>
            </div>

            <div class="meta-item">
              <span>Supplies</span>
              <strong>{{ list.items?.length || 0 }}</strong>
            </div>
          </div>

          <div class="card-footer">
            <div v-if="list.is_notified || list.status === 'completed'" class="notified-tag">
              ✓ Farmers Notified
            </div>
            <button class="view-btn" type="button">
              View Beneficiary List
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- DETAILS MODAL -->
    <Teleport to="body">
      <div
        v-if="selectedList && selectedList.id"
        class="modal-backdrop"
        @click.self="closeModal"
      >
        <div class="modal">
          <div class="modal-header">
            <div>
              <div class="title-with-badge">
                <h3>{{ selectedList.event?.title || 'Distribution Details' }}</h3>
                <span
                  class="status-pill"
                  :class="selectedList.status === 'completed' ? 'completed' : 'published'"
                >
                  {{ selectedList.status === 'completed' ? 'Completed' : 'Active' }}
                </span>
              </div>
              <p class="modal-subtext">
                {{ formatDate(selectedList.event?.distribution_date) }} •
                {{ formatTime(selectedList.event?.distribution_time) }} •
                {{ selectedList.event?.venue || 'No venue' }}
              </p>
              <div class="pill-group">
                <span class="barangay-pill" v-if="barangayName">
                  {{ barangayName }}
                </span>
                <span class="notified-pill" v-if="selectedList.is_notified || selectedList.status === 'completed'">
                  ✓ Notified
                </span>
              </div>
            </div>

            <button class="close-btn" type="button" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <div class="event-description">
              {{ selectedList.event?.description || 'No description provided.' }}
            </div>

            <div class="details-row">
              <div class="detail-card">
                <span>Total Recipients</span>
                <strong>{{ selectedList.farmers?.length || 0 }}</strong>
              </div>

              <div class="detail-card">
                <span>Total Supplies</span>
                <strong>{{ selectedList.items?.length || 0 }}</strong>
              </div>
            </div>

            <h4 class="section-title">Supply Totals</h4>

            <div v-if="(selectedList.items || []).length === 0" class="empty-beneficiaries">
              No supplies listed.
            </div>

            <div v-else class="supply-totals">
              <div
                v-for="item in selectedList.items || []"
                :key="item.id"
                class="supply-total-card"
              >
                <span>{{ item.supply?.name || 'Unknown Supply' }}</span>
                <strong>
                  {{ totalAllocatedForSupply(item.supply_id) }}
                  {{ item.supply?.unit || '' }}
                </strong>
              </div>
            </div>

            <div class="beneficiaries-header">
              <h4 class="section-title no-margin">Farmer Beneficiaries</h4>

              <label class="select-all-label" v-if="selectedFarmers.length > 0">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
                Select All ({{ selectedFarmerIds.length }}/{{ selectedFarmers.length }})
              </label>
            </div>

            <div v-if="selectedFarmers.length === 0" class="empty-beneficiaries">
              No beneficiaries listed.
            </div>

            <div v-else class="beneficiary-list">
              <div
                v-for="farmerRow in selectedFarmers"
                :key="farmerRow.id"
                class="beneficiary-card"
                :class="{ 'is-selected': isFarmerSelected(farmerRow.farmer_id) }"
              >
                <div class="beneficiary-header">
                  <label class="farmer-checkbox-label">
                    <input
                      type="checkbox"
                      :checked="isFarmerSelected(farmerRow.farmer_id)"
                      @change="toggleFarmer(farmerRow.farmer_id)"
                    />
                  </label>

                  <div class="beneficiary-name-block">
                    <h5>{{ fullName(farmerRow.farmer) }}</h5>
                    <p>{{ farmerRow.farmer?.phone_number || 'No contact number' }}</p>
                    <p class="email-line" v-if="farmerRow.farmer?.email">
                      {{ farmerRow.farmer.email }}
                    </p>
                  </div>

                  <div class="status-stack">
                    <span
                      class="receive-status"
                      :class="farmerRow.claim_status || (farmerRow.received ? 'received' : 'pending')"
                    >
                      {{ farmerReceiveStatus(farmerRow) }}
                    </span>
                    <span
                      v-if="farmerRow.notified || selectedList.status === 'completed'"
                      class="notified-tag-small"
                    >
                      Notified
                    </span>
                  </div>
                </div>

                <div
                  v-if="allocationsForFarmer(farmerRow.farmer_id).length > 0"
                  class="allocation-grid"
                >
                  <div
                    v-for="allocation in allocationsForFarmer(farmerRow.farmer_id)"
                    :key="allocation.id"
                    class="allocation-item"
                  >
                    <span>{{ allocation.supply?.name || 'Supply' }}</span>
                    <strong>
                      {{ allocation.quantity }}
                      {{ allocation.supply?.unit || '' }}
                    </strong>
                  </div>
                </div>

                <div v-else class="no-allocation">
                  No supply allocation recorded.
                </div>
              </div>
            </div>
          </div>

          <!-- NOTIFY ACTION BAR -->
          <div class="notify-bar" v-if="selectedFarmers.length > 0">
            <div class="notify-bar-top">
              <strong>{{ selectedFarmerIds.length }} farmer(s) selected</strong>

              <div class="channel-checks">
                <label><input type="checkbox" v-model="channels.email" /> Email</label>
                <label><input type="checkbox" v-model="channels.sms" /> SMS</label>
                <label><input type="checkbox" v-model="channels.in_app" /> Push</label>
              </div>
            </div>

            <div class="notify-bar-actions">
              <button
                class="notify-btn"
                type="button"
                :disabled="selectedFarmerIds.length === 0 || !hasChannelSelected || sending"
                @click="notifyFarmers"
              >
                {{ sending ? 'Sending...' : 'Notify Selected Farmers' }}
              </button>

              <button
                class="copy-btn"
                type="button"
                :disabled="selectedFarmerIds.length === 0"
                @click="copyMessengerMessage"
              >
                {{ copyLabel }}
              </button>
            </div>

            <div v-if="notifySummary" class="notify-summary">{{ notifySummary }}</div>
            <div v-if="notifyError" class="notify-error">{{ notifyError }}</div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'https://sanagustinagrisure.com'
const NOTIFY_ROUTE = '/api/distribution-events/'

export default {
  name: 'BarangayDistributionListsPage',

  data() {
    return {
      currentTab: 'active',
      lists: [],
      selectedList: null,
      search: '',
      loading: false,

      selectedFarmerIds: [],
      channels: {
        email: true,
        sms: true,
        in_app: true,
      },
      sending: false,
      notifySummary: '',
      notifyError: '',
      copyLabel: 'Copy for Messenger',
    }
  },

  computed: {
    activeLists() {
      return (this.lists || []).filter(item => item.status !== 'completed')
    },

    completedLists() {
      return (this.lists || []).filter(item => item.status === 'completed')
    },

    filteredLists() {
      let sourceList = this.currentTab === 'active' ? this.activeLists : this.completedLists

      if (this.search.trim()) {
        const q = this.search.toLowerCase().trim()
        sourceList = sourceList.filter(item =>
          String(item.event?.title || '').toLowerCase().includes(q) ||
          String(item.event?.venue || '').toLowerCase().includes(q)
        )
      }

      return sourceList
    },

    totalRecipients() {
      return (this.lists || []).reduce(
        (sum, item) => sum + Number(item.farmers?.length || 0),
        0
      )
    },

    selectedFarmers() {
      return this.selectedList?.farmers || []
    },

    isAllSelected() {
      return (
        this.selectedFarmers.length > 0 &&
        this.selectedFarmerIds.length === this.selectedFarmers.length
      )
    },

    hasChannelSelected() {
      return this.channels.email || this.channels.sms || this.channels.in_app
    },

    barangayName() {
      return (
        this.selectedList?.barangay?.name ||
        this.selectedList?.event?.barangay?.name ||
        ''
      )
    },
  },

  mounted() {
    this.fetchLists()
  },

  methods: {
    authHeaders() {
      const token =
        localStorage.getItem('barangay_token') ||
        localStorage.getItem('token')

      return {
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/json',
        },
      }
    },

    async fetchLists() {
      this.loading = true

      try {
        const response = await axios.get(
          API_BASE + '/api/barangay/distribution-lists',
          this.authHeaders()
        )

        const raw = Array.isArray(response.data)
          ? response.data
          : response.data.data || []

        this.lists = raw
      } catch (error) {
        console.error(error)
        alert('Failed to load distribution lists.')
      } finally {
        this.loading = false
      }
    },

    async openList(id) {
      try {
        const response = await axios.get(
          API_BASE + '/api/barangay/distribution-lists/' + id,
          this.authHeaders()
        )

        this.selectedList = response.data
        this.resetSelectionState()
      } catch (error) {
        console.error(error)
        alert('Failed to load distribution details.')
      }
    },

    closeModal() {
      this.selectedList = null
      this.resetSelectionState()
    },

    resetSelectionState() {
      this.selectedFarmerIds = []
      this.notifySummary = ''
      this.notifyError = ''
      this.copyLabel = 'Copy for Messenger'
    },

    isFarmerSelected(farmerId) {
      return this.selectedFarmerIds.includes(farmerId)
    },

    toggleFarmer(farmerId) {
      const index = this.selectedFarmerIds.indexOf(farmerId)

      if (index === -1) {
        this.selectedFarmerIds.push(farmerId)
      } else {
        this.selectedFarmerIds.splice(index, 1)
      }
    },

    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedFarmerIds = []
      } else {
        this.selectedFarmerIds = this.selectedFarmers.map(row => row.farmer_id)
      }
    },

    async notifyFarmers() {
      if (!this.selectedList?.event?.id) {
        this.notifyError = 'Missing event reference for this distribution list.'
        return
      }

      const activeChannels = []
      if (this.channels.email) activeChannels.push('email')
      if (this.channels.sms) activeChannels.push('sms')
      if (this.channels.in_app) activeChannels.push('push')

      this.sending = true
      this.notifySummary = ''
      this.notifyError = ''

      try {
        const eventId = this.selectedList.event.id

        const response = await axios.post(
          API_BASE + NOTIFY_ROUTE + eventId + '/notify',
          {
            farmer_ids: this.selectedFarmerIds,
            channels: activeChannels,
          },
          this.authHeaders()
        )

        const summary = response.data?.summary || {}

        this.notifySummary =
          'Sent to ' + this.selectedFarmerIds.length + ' farmer(s) via ' +
          activeChannels.join(', ') +
          (summary.failed ? ('. Failed: ' + summary.failed) : '.')

        if (this.selectedList) {
          this.selectedList.is_notified = true
        }
      } catch (error) {
        console.error(error)
        this.notifyError = error.response?.data?.message || 'Failed to send notifications. Please try again.'
      } finally {
        this.sending = false
      }
    },

    async copyMessengerMessage() {
      const event = this.selectedList?.event || {}
      const title = event.title || 'Assistance Distribution'
      const venue = event.venue || 'TBA'
      const date = this.formatDate(event.distribution_date)
      const time = this.formatTime(event.distribution_time)

      const supplyLines = (this.selectedList?.items || [])
        .map(item => {
          const name = item.supply?.name || 'Supply'
          const unit = item.supply?.unit || ''
          const total = this.totalAllocatedForSupply(item.supply_id)
          return '- ' + name + ': ' + total + ' ' + unit
        })
        .join('\n')

      const farmerNames = this.selectedFarmers
        .filter(row => this.isFarmerSelected(row.farmer_id))
        .map(row => '- ' + this.fullName(row.farmer))
        .join('\n')

      const message =
        '📢 ' + title + '\n\n' +
        '📅 Date: ' + date + '\n' +
        '🕒 Time: ' + time + '\n' +
        '📍 Venue: ' + venue + '\n\n' +
        'Please bring a valid ID and your claim stub upon arrival.\n\n' +
        'Supplies to be distributed:\n' + supplyLines + '\n\n' +
        'Listed beneficiaries for this batch:\n' + farmerNames + '\n\n' +
        'For questions, please contact your Barangay Agriculture Office.'

      try {
        await navigator.clipboard.writeText(message)
        this.copyLabel = 'Copied!'
      } catch (error) {
        console.error(error)
        this.copyLabel = 'Copy failed — select manually'
      }

      setTimeout(() => {
        this.copyLabel = 'Copy for Messenger'
      }, 2500)
    },

    allocationsForFarmer(farmerId) {
      return (this.selectedList?.allocations || []).filter(
        allocation => Number(allocation.farmer_id) === Number(farmerId)
      )
    },

    totalAllocatedForSupply(supplyId) {
      return (this.selectedList?.allocations || [])
        .filter(allocation => Number(allocation.supply_id) === Number(supplyId))
        .reduce(
          (sum, allocation) => sum + Number(allocation.quantity || 0),
          0
        )
    },

    fullName(user) {
      if (!user) return 'Unknown Farmer'

      return [
        user.first_name,
        user.middle_name,
        user.last_name,
        user.extension_name,
      ]
        .filter(Boolean)
        .join(' ')
    },

    farmerReceiveStatus(row) {
      if (row.claim_status) {
        const map = {
          pending: 'Pending',
          partial: 'Partial',
          received: 'Received',
          missed: 'Missed',
        }

        return map[row.claim_status] || row.claim_status
      }

      return row.received ? 'Received' : 'Pending'
    },

    formatDate(date) {
      if (!date) return '—'

      return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },

    formatTime(time) {
      if (!time) return '—'

      const parts = String(time).split(':')

      if (parts.length < 2) {
        return time
      }

      const hour = Number(parts[0])
      const minute = Number(parts[1])

      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return time
      }

      const date = new Date()
      date.setHours(hour, minute, 0)

      return date.toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
      })
    },
  },
}
</script>

<style scoped>
.distribution-page {
  padding: 1.5rem;
  background-color: #f8fafc;
  min-height: 100vh;
  color: #1e293b;
  font-family: inherit;
}

/* HEADER */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-title-group h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.header-title-group p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.25rem 0 0;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  color: #334155;
  padding: 0.5rem 0.875rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: background-color 0.15s;
}

.refresh-btn:hover {
  background-color: #f1f5f9;
}

/* METRICS GRID */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.card-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-badge stroke {
  stroke-width: 2;
}

.icon-badge svg {
  width: 20px;
  height: 20px;
}

.icon-badge.green {
  background-color: #dcfce7;
  color: #16a34a;
}

.icon-badge.blue {
  background-color: #e0f2fe;
  color: #0284c7;
}

.icon-badge.gray {
  background-color: #f1f5f9;
  color: #64748b;
}

.card-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
}

/* CONTENT CARD & TOOLBAR */
.content-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.75rem;
  margin-bottom: 1.25rem;
}

.tab-header {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background-color: #f1f5f9;
  color: #0f172a;
}

.tab-badge {
  background-color: #e2e8f0;
  color: #475569;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.tab-badge.completed-badge {
  background-color: #dcfce7;
  color: #166534;
}

.search-box {
  position: relative;
  width: 280px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  background-color: #f8fafc;
}

.search-box input:focus {
  background-color: #ffffff;
  border-color: #16a34a;
}

/* LIST CARDS */
.list-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.list-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  background-color: #ffffff;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.list-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.card-top h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.venue-text {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0.25rem 0 0;
}

.status-pill {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  line-height: 1;
}

.status-pill.published {
  background-color: #e0f2fe;
  color: #0369a1;
}

.status-pill.completed {
  background-color: #dcfce7;
  color: #15803d;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  background-color: #f8fafc;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.meta-item span {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.meta-item strong {
  display: block;
  font-size: 0.8125rem;
  color: #0f172a;
  margin-top: 0.125rem;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notified-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: #15803d;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.35rem 0.625rem;
  border-radius: 6px;
  white-space: nowrap;
}

.view-btn {
  flex: 1;
  background-color: #16a34a;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}

.view-btn:hover {
  background-color: #15803d;
}

/* STATE BOX */
.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #64748b;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.4);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal {
  background-color: #ffffff;
  border-radius: 12px;
  width: min(850px, 100%);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #0f172a;
}

.modal-subtext {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0.25rem 0 0;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.close-btn:hover {
  color: #0f172a;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pill-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.barangay-pill, .notified-pill {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.barangay-pill {
  background-color: #f1f5f9;
  color: #475569;
}

.notified-pill {
  background-color: #dcfce7;
  color: #166534;
}

.event-description {
  background-color: #f8fafc;
  padding: 0.875rem;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #334155;
  margin-bottom: 1rem;
}

.details-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.detail-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.875rem;
}

.detail-card span {
  font-size: 0.75rem;
  color: #64748b;

}

.detail-card strong {
  display: block;
  font-size: 1.25rem;
  color: #0f172a;
  margin-top: 0.25rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 1.25rem 0 0.75rem;
}

.section-title.no-margin {
  margin: 0;
}

.supply-totals {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.supply-total-card {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 0.75rem;
}

.supply-total-card span {
  font-size: 0.75rem;
  color: #166534;
}

.supply-total-card strong {
  display: block;
  font-size: 1rem;
  color: #14532d;
  margin-top: 0.25rem;
}

.beneficiaries-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0 0.75rem;
}

.select-all-label {
  font-size: 0.8125rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
}

.beneficiary-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.beneficiary-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.875rem;
  transition: background-color 0.15s;
}

.beneficiary-card.is-selected {
  background-color: #f0fdf4;
  border-color: #86efac;
}

.beneficiary-header {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.beneficiary-name-block {
  flex: 1;
}

.beneficiary-name-block h5 {
  margin: 0;
  font-size: 0.875rem;
  color: #0f172a;
}

.beneficiary-name-block p {
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  color: #64748b;
}

.status-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.receive-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  background-color: #fef3c7;
  color: #92400e;
}

.receive-status.received {
  background-color: #dcfce7;
  color: #166534;
}

.notified-tag-small {
  font-size: 0.6875rem;
  color: #16a34a;
}

.allocation-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
}

.allocation-item {
  font-size: 0.75rem;
  display: flex;
  justify-content: space-between;
  background-color: #f8fafc;
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
}

.allocation-item span {
  color: #64748b;
}

.no-allocation, .empty-beneficiaries {
  font-size: 0.8125rem;
  color: #94a3b8;
  padding: 0.75rem;
  background-color: #f8fafc;
  border-radius: 6px;
  text-align: center;
}

/* NOTIFY BAR */
.notify-bar {
  border-top: 1px solid #e2e8f0;
  padding: 1.25rem 1.5rem;
  background-color: #f8fafc;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.notify-bar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.875rem;
  font-size: 0.875rem;
}

.channel-checks {
  display: flex;
  gap: 1rem;
  font-size: 0.8125rem;
  color: #475569;
}

.channel-checks label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.notify-bar-actions {
  display: flex;
  gap: 0.75rem;
}

.notify-btn {
  background-color: #16a34a;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.notify-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.copy-btn {
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.notify-summary {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: #dcfce7;
  color: #166534;
  border-radius: 6px;
  font-size: 0.8125rem;
}

.notify-error {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: #fee2e2;
  color: #991b1b;
  border-radius: 6px;
  font-size: 0.8125rem;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.icon-xs {
  width: 14px;
  height: 14px;
}

@media (max-width: 768px) {
  .metrics-grid, .list-grid, .details-row, .supply-totals, .allocation-grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .search-box {
    width: 100%;
  }
}
</style>