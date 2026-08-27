<template>
  <div class="layout">
    <div class="main-wrapper">

 
    <header class="top-header">
      <div class="header-title-group">
        <h1>Distribution Lists</h1>
        <p>View assistance distribution lists sent by the MAO to your Barangay</p>
      </div>

      <div class="header-actions">
        <button class="btn-refresh" @click="fetchLists">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          Refresh Data
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
    <main class="body">
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
    </main>
   
    </div>
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
      currentUser: {
        name: '',
        role: 'Barangay Official',
        initials: 'BO',
      },
      barangayName: '',
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
    selectedBarangayName() {
      return (
        this.selectedList?.barangay?.name ||
        this.selectedList?.event?.barangay?.name ||
        this.barangayName ||
        ''
      )
    },
  },
  mounted() {
    this.loadUser()
    this.fetchLists()
  },
  methods: {
    loadUser() {
      const rawUser = localStorage.getItem('user') || localStorage.getItem('barangay_user')
      if (!rawUser) {
        console.error('No authenticated user found in storage.')
        return
      }
      let storedUser
      try {
        storedUser = JSON.parse(rawUser)
      } catch (error) {
        console.error('Invalid authenticated user data:', error)
        return
      }
      const barangayId = storedUser.barangay_id || storedUser.barangay?.id
      if (!barangayId) {
        console.error('Barangay ID missing from authenticated user context.', storedUser)
      }
      this.currentUser.name =
        storedUser.name ||
        `${storedUser.first_name || ''} ${storedUser.last_name || ''}`.trim() ||
        'Barangay Official'
      this.currentUser.role = storedUser.role || 'Barangay Official'
      this.currentUser.initials = this.currentUser.name
        .split(' ')
        .filter(Boolean)
        .map(word => word[0])
        .join('')
        .toUpperCase() || 'BO'
      this.barangayName = storedUser.barangay?.name || 'Local Barangay'
    },
    authHeaders() {
      const token = localStorage.getItem('barangay_token') || localStorage.getItem('token')
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
          `${API_BASE}/api/barangay/distribution-lists`,
          this.authHeaders()
        )
        const raw = Array.isArray(response.data) ? response.data : response.data?.data || []
        this.lists = raw
      } catch (error) {
        console.error('Failed to load distribution lists:', error)
        if (error.response) {
          console.error('Status:', error.response.status)
          console.error('Response:', error.response.data)
        }
        alert('Failed to load distribution lists.')
      } finally {
        this.loading = false
      }
    },
    async openList(id) {
      try {
        const response = await axios.get(
          `${API_BASE}/api/barangay/distribution-lists/${id}`,
          this.authHeaders()
        )
        this.selectedList = response.data
        this.resetSelectionState()
      } catch (error) {
        console.error('Failed to load distribution details:', error)
        if (error.response) {
          console.error('Status:', error.response.status)
          console.error('Response:', error.response.data)
        }
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
      if (!this.selectedFarmerIds.length) {
        this.notifyError = 'Please select at least one farmer.'
        return
      }
      if (!this.hasChannelSelected) {
        this.notifyError = 'Please select at least one notification channel.'
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
          `${API_BASE}${NOTIFY_ROUTE}${eventId}/notify`,
          {
            farmer_ids: this.selectedFarmerIds,
            channels: activeChannels,
          },
          this.authHeaders()
        )
        const summary = response.data?.summary || {}
        this.notifySummary =
          'Sent to ' +
          this.selectedFarmerIds.length +
          ' farmer(s) via ' +
          activeChannels.join(', ') +
          (summary.failed ? '. Failed: ' + summary.failed : '.')
        if (this.selectedList) {
          this.selectedList.is_notified = true
        }
      } catch (error) {
        console.error('Failed to send notifications:', error)
        this.notifyError =
          error.response?.data?.message ||
          'Failed to send notifications. Please try again.'
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
        console.error('Clipboard error:', error)
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
      if (parts.length < 2) return time
      const hour = Number(parts[0])
      const minute = Number(parts[1])
      if (Number.isNaN(hour) || Number.isNaN(minute)) return time
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

* { box-sizing: border-box; }

/* ===================== LAYOUT ===================== */
.layout {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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

.icon-sm { width: 15px; height: 15px; }
.icon-xs { width: 13px; height: 13px; flex-shrink: 0; }



/* ===================== METRICS ===================== */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

.card-label { font-size: 0.78rem; font-weight: 600; color: #5c6b64; }

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

.icon-badge.green { background: rgba(17, 109, 62, 0.12); color: #116D3E; }
.icon-badge.blue  { background: rgba(46, 111, 142, 0.12); color: #2E6F8E; }
.icon-badge.gray  { background: rgba(148, 163, 184, 0.16); color: #64748b; }

.card-value { font-size: 1.6rem; font-weight: 700; color: #0F212F; }

/* ===================== CONTENT CARD ===================== */
.content-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* ===================== TOOLBAR ===================== */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #F1F6F2;
  border: 1px solid #E0EAE3;
  border-radius: 10px;
  padding: 3px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: #5c6b64;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
}

.tab-btn:hover { color: #0F212F; }

.tab-btn.active {
  background: #FFFFFF;
  color: #116D3E;
  box-shadow: 0 2px 6px rgba(15, 33, 47, 0.08);
}

.tab-badge {
  font-size: 0.66rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(17, 109, 62, 0.1);
  color: #116D3E;
}

.tab-badge.completed-badge {
  background: rgba(46, 111, 142, 0.1);
  color: #2E6F8E;
}

.search-box {
  position: relative;
  min-width: 260px;
  flex: 1;
  max-width: 360px;
}

.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  color: #94a3b8;
  pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: 9px 12px 9px 32px;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.82rem;
  color: #0F212F;
  background: #FFFFFF;
  transition: border-color 0.15s ease;
}
.search-box input:focus { outline: none; border-color: #116D3E; }

/* ===================== STATES ===================== */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 3rem 1rem;
  color: #5c6b64;
  font-size: 0.85rem;
  text-align: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2.5px solid #E0EAE3;
  border-top-color: #116D3E;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===================== LIST GRID / CARDS ===================== */
.list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.list-card {
  background: #F8FAF8;
  border: 1px solid #EAF1EC;
  border-radius: 14px;
  padding: 1.1rem;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.list-card:hover { border-color: #116D3E; transform: translateY(-2px); }

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.card-top h3 {
  font-size: 0.94rem;
  font-weight: 700;
  color: #0F212F;
  line-height: 1.3;
}

.venue-text {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76rem;
  color: #5c6b64;
  margin-top: 4px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-pill.published { background: rgba(17, 109, 62, 0.1); color: #116D3E; }
.status-pill.completed { background: rgba(46, 111, 142, 0.1); color: #2E6F8E; }

.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 10px;
  padding: 0.6rem 0.65rem;
}
.meta-item span { font-size: 0.66rem; color: #5c6b64; }
.meta-item strong { font-size: 0.86rem; color: #0F212F; }

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.notified-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: #116D3E;
}

.view-btn {
  background: none;
  border: 1.5px solid #E0EAE3;
  color: #0F212F;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.view-btn:hover { border-color: #116D3E; background: #F1F6F2; }

/* ===================== MODAL ===================== */
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

.modal {
  width: 100%;
  max-width: 680px;
  max-height: 88vh;
  background: #FFFFFF;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(15, 33, 47, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 1.4rem 1.5rem 1.1rem;
  border-bottom: 1px solid #F1F6F2;
  flex-shrink: 0;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.title-with-badge h3 { font-size: 1.05rem; font-weight: 700; color: #0F212F; }

.modal-subtext {
  font-size: 0.78rem;
  color: #5c6b64;
  margin-top: 6px;
}

.pill-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.barangay-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: #F1F6F2;
  color: #5c6b64;
}

.notified-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(17, 109, 62, 0.1);
  color: #116D3E;
}

.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: #F1F6F2;
  color: #5c6b64;
  font-size: 1.2rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.close-btn:hover { background: #E7F0EC; color: #0F212F; }

.modal-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.event-description {
  font-size: 0.84rem;
  color: #3f4a45;
  line-height: 1.5;
  background: #F8FAF8;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 0.9rem 1rem;
}

.details-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.detail-card {
  background: #F8FAF8;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-card span { font-size: 0.72rem; color: #5c6b64; }
.detail-card strong { font-size: 1.15rem; font-weight: 700; color: #0F212F; }

.section-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0F212F;
  margin-bottom: 0.7rem;
}
.section-title.no-margin { margin-bottom: 0; }

.empty-beneficiaries {
  text-align: center;
  padding: 1.5rem 1rem;
  color: #5c6b64;
  font-size: 0.82rem;
  background: #F8FAF8;
  border: 1px dashed #E0EAE3;
  border-radius: 12px;
}

.supply-totals {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.supply-total-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: #F8FAF8;
  border: 1px solid #EAF1EC;
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
}
.supply-total-card span { font-size: 0.78rem; color: #5c6b64; }
.supply-total-card strong { font-size: 0.84rem; color: #0F212F; }

.beneficiaries-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #5c6b64;
  cursor: pointer;
}
.select-all-label input { accent-color: #116D3E; width: 15px; height: 15px; cursor: pointer; }

.beneficiary-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.beneficiary-card {
  background: #F8FAF8;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.beneficiary-card.is-selected {
  border-color: #116D3E;
  background: rgba(17, 109, 62, 0.04);
}

.beneficiary-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.farmer-checkbox-label { padding-top: 2px; }
.farmer-checkbox-label input { accent-color: #116D3E; width: 16px; height: 16px; cursor: pointer; }

.beneficiary-name-block { flex: 1; min-width: 0; }
.beneficiary-name-block h5 { font-size: 0.86rem; font-weight: 700; color: #0F212F; }
.beneficiary-name-block p { font-size: 0.74rem; color: #5c6b64; margin-top: 2px; }
.beneficiary-name-block .email-line { color: #94a3b8; }

.status-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  flex-shrink: 0;
}

.receive-status {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}

.receive-status.pending  { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.receive-status.partial  { background: rgba(46, 111, 142, 0.1);  color: #2E6F8E; }
.receive-status.received { background: rgba(17, 109, 62, 0.1);   color: #116D3E; }
.receive-status.missed   { background: rgba(193, 71, 61, 0.1);   color: #C1473D; }

.notified-tag-small {
  font-size: 0.64rem;
  font-weight: 700;
  color: #116D3E;
}

.allocation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #E0EAE3;
}

.allocation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 8px;
  padding: 0.45rem 0.6rem;
}
.allocation-item span { font-size: 0.72rem; color: #5c6b64; }
.allocation-item strong { font-size: 0.76rem; color: #0F212F; }

.no-allocation {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #E0EAE3;
  font-size: 0.75rem;
  color: #94a3b8;
}

/* ===================== NOTIFY BAR ===================== */
.notify-bar {
  flex-shrink: 0;
  padding: 1rem 1.5rem 1.25rem;
  border-top: 1px solid #F1F6F2;
  background: #F8FAF8;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notify-bar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.notify-bar-top strong { font-size: 0.84rem; color: #0F212F; }

.channel-checks {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.channel-checks label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #5c6b64;
  cursor: pointer;
}
.channel-checks input { accent-color: #116D3E; width: 15px; height: 15px; cursor: pointer; }

.notify-bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.notify-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  border: none;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.28);
}
.notify-btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }

.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  background: #FFFFFF;
  color: #0F212F;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.copy-btn:hover { border-color: #116D3E; background: #F1F6F2; }
.copy-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.notify-summary {
  font-size: 0.78rem;
  font-weight: 600;
  color: #116D3E;
}

.notify-error {
  font-size: 0.78rem;
  font-weight: 600;
  color: #C1473D;
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 1100px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .list-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
}

@media (max-width: 768px) {
  .metrics-grid { grid-template-columns: 1fr; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-box { max-width: none; }
  .meta-grid { grid-template-columns: repeat(2, 1fr); }
  .details-row, .supply-totals { grid-template-columns: 1fr; }
  .modal { max-height: 100vh; border-radius: 0; }
  .modal-backdrop { padding: 0; }
}
</style>