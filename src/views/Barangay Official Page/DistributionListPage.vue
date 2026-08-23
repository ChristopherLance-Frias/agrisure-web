<template>
  <div class="distribution-page">
    <div class="page-header">
      <div>
        <h2>Distribution Lists</h2>
        <p>View assistance distribution lists sent by the MAO to your barangay.</p>
      </div>

      <button class="refresh-btn" @click="fetchLists">
        Refresh
      </button>
    </div>

    <div class="summary-row">
      <div class="summary-card">
        <span>Total Lists</span>
        <strong>{{ lists.length }}</strong>
      </div>

      <div class="summary-card">
        <span>Published</span>
        <strong>{{ publishedCount }}</strong>
      </div>

      <div class="summary-card">
        <span>Completed</span>
        <strong>{{ completedCount }}</strong>
      </div>

      <div class="summary-card">
        <span>Total Recipients</span>
        <strong>{{ totalRecipients }}</strong>
      </div>
    </div>

    <div class="toolbar">
      <input
        v-model="search"
        type="text"
        placeholder="Search distribution title or venue..."
      />

      <select v-model="statusFilter">
        <option value="">All Status</option>
        <option value="published">Published</option>
        <option value="completed">Completed</option>
      </select>
    </div>

    <div v-if="loading" class="state-box">
      Loading distribution lists...
    </div>

    <div v-else-if="filteredLists.length === 0" class="state-box">
      No distribution lists found.
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
            <p>{{ list.event?.venue || 'No venue provided' }}</p>
          </div>

          <span class="status-badge" :class="list.status">
            {{ statusLabel(list.status) }}
          </span>
        </div>

        <div class="meta-grid">
          <div>
            <span>Date</span>
            <strong>{{ formatDate(list.event?.distribution_date) }}</strong>
          </div>

          <div>
            <span>Time</span>
            <strong>{{ formatTime(list.event?.distribution_time) }}</strong>
          </div>

          <div>
            <span>Recipients</span>
            <strong>{{ list.farmers?.length || 0 }}</strong>
          </div>

          <div>
            <span>Supplies</span>
            <strong>{{ list.items?.length || 0 }}</strong>
          </div>
        </div>

        <button class="view-btn" type="button">
          View Beneficiary List
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="selectedList && selectedList.id"
        class="modal-backdrop"
        @click.self="closeModal"
      >
        <div class="modal">
          <div class="modal-header">
            <div>
              <h3>{{ selectedList.event?.title || 'Distribution Details' }}</h3>
              <p>
                {{ formatDate(selectedList.event?.distribution_date) }}
                •
                {{ formatTime(selectedList.event?.distribution_time) }}
                •
                {{ selectedList.event?.venue || 'No venue' }}
              </p>
            </div>

            <button class="close-btn" type="button" @click="closeModal">
              ×
            </button>
          </div>

          <div class="event-description">
            {{ selectedList.event?.description || 'No description provided.' }}
          </div>

          <div class="details-row">
            <div class="detail-card">
              <span>Status</span>
              <strong>{{ statusLabel(selectedList.status) }}</strong>
            </div>

            <div class="detail-card">
              <span>Recipients</span>
              <strong>{{ selectedList.farmers?.length || 0 }}</strong>
            </div>

            <div class="detail-card">
              <span>Supplies</span>
              <strong>{{ selectedList.items?.length || 0 }}</strong>
            </div>
          </div>

          <h4 class="section-title">Supply Totals</h4>

          <div
            v-if="(selectedList.items || []).length === 0"
            class="empty-beneficiaries"
          >
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

          <h4 class="section-title">Farmer Beneficiaries</h4>

          <div v-if="selectedFarmers.length === 0" class="empty-beneficiaries">
            No beneficiaries listed.
          </div>

          <div v-else class="beneficiary-list">
            <div
              v-for="farmerRow in selectedFarmers"
              :key="farmerRow.id"
              class="beneficiary-card"
            >
              <div class="beneficiary-header">
                <div>
                  <h5>{{ fullName(farmerRow.farmer) }}</h5>
                  <p>{{ farmerRow.farmer?.phone_number || 'No contact number' }}</p>
                </div>

                <span
                  class="receive-status"
                  :class="farmerRow.claim_status || (farmerRow.received ? 'received' : 'pending')"
                >
                  {{ farmerReceiveStatus(farmerRow) }}
                </span>
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
      </div>
    </Teleport>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'https://sanagustinagrisure.com'

export default {
  name: 'BarangayDistributionListsPage',

  data() {
    return {
      lists: [],
      selectedList: null,
      search: '',
      statusFilter: '',
      loading: false,
    }
  },

  computed: {
    filteredLists() {
      let list = this.lists || []

      if (this.statusFilter) {
        list = list.filter(item => item.status === this.statusFilter)
      }

      if (this.search.trim()) {
        const q = this.search.toLowerCase().trim()

        list = list.filter(item =>
          String(item.event?.title || '').toLowerCase().includes(q) ||
          String(item.event?.venue || '').toLowerCase().includes(q)
        )
      }

      return list
    },

    publishedCount() {
      return (this.lists || []).filter(item => item.status === 'published').length
    },

    completedCount() {
      return (this.lists || []).filter(item => item.status === 'completed').length
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
          Authorization: `Bearer ${token}`,
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

        this.lists = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
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
          `${API_BASE}/api/barangay/distribution-lists/${id}`,
          this.authHeaders()
        )

        this.selectedList = response.data
      } catch (error) {
        console.error(error)
        alert('Failed to load distribution details.')
      }
    },

    closeModal() {
      this.selectedList = null
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

    statusLabel(status) {
      const map = {
        draft: 'Draft',
        published: 'Published',
        completed: 'Completed',
        cancelled: 'Cancelled',
      }

      return map[status] || status || '—'
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

.refresh-btn {
  border: none;
  background: white;
  color: #047857;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.9rem;
  margin-bottom: 1rem;
}

.summary-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 1rem;
}

.summary-card span {
  color: #6b7280;
  font-size: 0.82rem;
}

.summary-card strong {
  display: block;
  margin-top: 0.35rem;
  font-size: 1.7rem;
  color: #047857;
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

.list-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.95rem;
}

.list-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 1rem;
  cursor: pointer;
  transition: 0.2s ease;
}

.list-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.card-top h3 {
  margin: 0;
  font-size: 1rem;
}

.card-top p {
  margin: 0.3rem 0 0;
  color: #6b7280;
  font-size: 0.85rem;
}

.status-badge {
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  height: fit-content;
  text-transform: capitalize;
  white-space: nowrap;
}

.status-badge.published {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;
  margin: 1rem 0;
}

.meta-grid div {
  background: #f9fafb;
  border-radius: 12px;
  padding: 0.75rem;
}

.meta-grid span {
  display: block;
  font-size: 0.72rem;
  color: #6b7280;
}

.meta-grid strong {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
}

.view-btn {
  width: 100%;
  border: none;
  background: #047857;
  color: white;
  padding: 0.7rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
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
  width: min(980px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 22px;
  padding: 1.4rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
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

.event-description {
  margin: 1rem 0;
  background: #f9fafb;
  border-radius: 14px;
  padding: 1rem;
  color: #4b5563;
}

.details-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
}

.detail-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 0.9rem;
}

.detail-card span {
  color: #6b7280;
  font-size: 0.8rem;
}

.detail-card strong {
  display: block;
  margin-top: 0.25rem;
  color: #047857;
}

.section-title {
  margin: 1.2rem 0 0.7rem;
}

.supply-totals {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.supply-total-card {
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  border-radius: 14px;
  padding: 0.9rem;
}

.supply-total-card span {
  display: block;
  font-size: 0.82rem;
  color: #166534;
}

.supply-total-card strong {
  display: block;
  margin-top: 0.3rem;
  color: #064e3b;
}

.beneficiary-list {
  display: grid;
  gap: 0.8rem;
}

.beneficiary-card {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1rem;
}

.beneficiary-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.beneficiary-header h5 {
  margin: 0;
  font-size: 1rem;
}

.beneficiary-header p {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.83rem;
}

.receive-status {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.74rem;
  height: fit-content;
  background: #fef3c7;
  color: #92400e;
}

.receive-status.received {
  background: #dcfce7;
  color: #166534;
}

.receive-status.partial {
  background: #ffedd5;
  color: #9a3412;
}

.receive-status.missed {
  background: #fee2e2;
  color: #991b1b;
}

.allocation-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.55rem;
}

.allocation-item {
  background: #f9fafb;
  border-radius: 12px;
  padding: 0.7rem;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
}

.allocation-item span {
  color: #6b7280;
  font-size: 0.82rem;
}

.allocation-item strong {
  font-size: 0.85rem;
}

.no-allocation,
.empty-beneficiaries {
  background: #f9fafb;
  color: #6b7280;
  border-radius: 12px;
  padding: 0.8rem;
}

@media (max-width: 900px) {
  .summary-row,
  .list-grid,
  .details-row,
  .supply-totals,
  .allocation-grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
  }

  .meta-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>