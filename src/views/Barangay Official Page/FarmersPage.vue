<template>
  <div class="farmers-page">

    <!-- Header -->
    <div class="page-header">
      <div class="header-eyebrow">BARANGAY MANAGEMENT SYSTEM</div>
      <h2 class="header-title">Registered Farmers</h2>
      <p class="header-sub">Verified agricultural households in your barangay</p>
    </div>

    <!-- Stats Strip -->
    <div class="stats-strip">
      <div class="stat-item">
        <span class="stat-value">{{ farmers.length }}</span>
        <span class="stat-label">Total Farmers</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value accent">{{ verifiedCount }}</span>
        <span class="stat-label">Verified</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ totalFarms }}</span>
        <span class="stat-label">Total Farms</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 20 20" fill="none">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.6"/>
          <path d="M13 13l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search by name, contact, or address…"
          class="search-input"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <span>Loading farmers…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredFarmers.length === 0" class="state-box">
      <svg viewBox="0 0 48 48" fill="none" width="44" height="44">
        <circle cx="24" cy="24" r="20" stroke="#3DAA72" stroke-width="2"/>
        <path d="M16 30c2-4 10-4 12 0" stroke="#3DAA72" stroke-width="2" stroke-linecap="round"/>
        <circle cx="19" cy="22" r="1.5" fill="#3DAA72"/>
        <circle cx="29" cy="22" r="1.5" fill="#3DAA72"/>
      </svg>
      <p>No farmers found matching your search.</p>
    </div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <table class="farmer-table">
        <thead>
          <tr>
            <th class="col-name">Farmer</th>
            <th class="col-contact">Contact</th>
            <th class="col-status">Status</th>
            <th class="col-farms">Farms</th>
            <th class="col-date">Registered</th>
            <th class="col-action"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="farmer in filteredFarmers"
            :key="farmer.id"
            class="farmer-row"
            @click="openFarmer(farmer.id)"
          >
            <td class="col-name">
              <div class="row-accent"></div>
              <div class="name-block">
                <span class="name-primary">{{ fullName(farmer) }}</span>
                <span class="name-secondary">{{ farmer.farmer_profile?.address || 'No address on record' }}</span>
              </div>
            </td>
            <td class="col-contact mono">{{ farmer.phone_number || '—' }}</td>
            <td class="col-status">
              <span class="badge" :class="farmer.account_status">
                {{ farmer.account_status }}
              </span>
            </td>
            <td class="col-farms mono">
              {{ farmer.farmer_profile?.farms?.length || 0 }}
            </td>
            <td class="col-date mono">{{ formatDate(farmer.created_at) }}</td>
            <td class="col-action">
              <button class="view-btn" @click.stop="openFarmer(farmer.id)">
                View →
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Drawer Overlay -->
    <transition name="drawer">
      <div v-if="selectedFarmer" class="drawer-backdrop" @click.self="selectedFarmer = null">
        <div class="drawer">

          <!-- Drawer Header -->
          <div class="drawer-header">
            <div class="drawer-header-inner">
              <div class="drawer-eyebrow">FARMER PROFILE</div>
              <h3 class="drawer-name">{{ fullName(selectedFarmer) }}</h3>
              <div class="drawer-contact">{{ selectedFarmer.phone_number || 'No contact number' }}</div>
            </div>
            <button class="close-btn" @click="selectedFarmer = null" aria-label="Close">
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Personal Info -->
          <div class="drawer-section">
            <div class="section-label">Personal Information</div>
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-key">Sex</span>
                <span class="detail-val">{{ selectedFarmer.sex || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">Birthdate</span>
                <span class="detail-val mono">{{ formatDate(selectedFarmer.farmer_profile?.birthdate) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">Address</span>
                <span class="detail-val">{{ selectedFarmer.farmer_profile?.address || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">RSBSA Ref #</span>
                <span class="detail-val mono">{{ selectedFarmer.farmer_profile?.rsbsa_reference || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">Account Status</span>
                <span class="detail-val">
                  <span class="badge" :class="selectedFarmer.account_status">{{ selectedFarmer.account_status }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Farm Summary -->
          <div class="drawer-section farm-summary-row">
            <div class="farm-stat-block">
              <span class="farm-stat-num">{{ selectedFarms.length }}</span>
              <span class="farm-stat-label">Registered Farms</span>
            </div>
            <div class="farm-stat-divider"></div>
            <div class="farm-stat-block">
              <span class="farm-stat-num accent">{{ selectedTotalArea.toFixed(2) }}</span>
              <span class="farm-stat-label">Total Hectares</span>
            </div>
          </div>

          <!-- Farms List -->
          <div class="drawer-section">
            <div class="section-label">Registered Farms</div>

            <div v-if="selectedFarms.length === 0" class="empty-farms">
              No farms registered for this farmer.
            </div>

            <div v-else class="farms-list">
              <div
                v-for="farm in selectedFarms"
                :key="farm.id"
                class="farm-item"
              >
                <div class="farm-item-header">
                  <span class="farm-item-name">{{ farm.farm_name || 'Unnamed Farm' }}</span>
                  <span class="farm-area-pill">{{ farm.farm_area || 0 }} ha</span>
                </div>
                <div class="farm-item-meta">
                  <div class="farm-detail">
                    <span class="fd-key">Crop</span>
                    <span class="fd-val">{{ farm.crop_type || '—' }}</span>
                  </div>
                  <div class="farm-detail">
                    <span class="fd-key">Insurance</span>
                    <span class="fd-val">{{ farm.insurance_status || '—' }}</span>
                  </div>
                  <div class="farm-detail">
                    <span class="fd-key">Coordinates</span>
                    <span class="fd-val mono">{{ farm.latitude || '—' }}, {{ farm.longitude || '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </transition>

  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'http://192.168.254.121:8000'

export default {
  name: 'BarangayFarmersPage',

  data() {
    return {
      farmers: [],
      selectedFarmer: null,
      search: '',
      loading: false,
    }
  },

  computed: {
    filteredFarmers() {
      const q = this.search.toLowerCase().trim()
      if (!q) return this.farmers
      return this.farmers.filter(f =>
        this.fullName(f).toLowerCase().includes(q) ||
        String(f.phone_number || '').includes(q) ||
        String(f.farmer_profile?.address || '').toLowerCase().includes(q)
      )
    },
    verifiedCount() {
      return this.farmers.filter(f => f.account_status === 'verified').length
    },
    totalFarms() {
      return this.farmers.reduce((total, f) => total + (f.farmer_profile?.farms?.length || 0), 0)
    },
    selectedFarms() {
      return this.selectedFarmer?.farmer_profile?.farms || []
    },
    selectedTotalArea() {
      return this.selectedFarms.reduce((sum, farm) => sum + Number(farm.farm_area || 0), 0)
    },
  },

  mounted() {
    this.fetchFarmers()
  },

  methods: {
    authHeaders() {
      const token = localStorage.getItem('barangay_token')
      return {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    },

    async fetchFarmers() {
      this.loading = true
      try {
        const response = await axios.get(`${API_BASE}/api/barangay/farmers`, this.authHeaders())
        this.farmers = response.data
      } catch (error) {
        console.error(error)
        alert('Failed to load farmers.')
      } finally {
        this.loading = false
      }
    },

    async openFarmer(id) {
      try {
        const response = await axios.get(`${API_BASE}/api/barangay/farmers/${id}`, this.authHeaders())
        this.selectedFarmer = response.data
      } catch (error) {
        console.error(error)
        alert('Failed to load farmer details.')
      }
    },

    fullName(farmer) {
      return [farmer.first_name, farmer.middle_name, farmer.last_name, farmer.extension_name]
        .filter(Boolean)
        .join(' ')
    },

    formatDate(date) {
      if (!date) return '—'
      return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

/* ── Base ─────────────────────────────────────────────────── */
.farmers-page {
  font-family: 'DM Sans', sans-serif;
  background: #F0F7F4;
  min-height: 100vh;
  color: #1F2937;
  padding: 1.75rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.mono {
  font-family: 'DM Mono', monospace;
}

/* ── Header ───────────────────────────────────────────────── */
.page-header {
  margin-bottom: 1.5rem;
}

.header-eyebrow {
  font-family: 'DM Mono', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  color: #3DAA72;
  margin-bottom: 0.4rem;
}

.header-title {
  font-size: 2rem;
  font-weight: 700;
  color: #0B3D2E;
  margin: 0 0 0.25rem;
  line-height: 1.1;
}

.header-sub {
  font-size: 0.9rem;
  color: #6B7280;
  margin: 0;
}

/* ── Stats Strip ──────────────────────────────────────────── */
.stats-strip {
  display: flex;
  align-items: center;
  gap: 0;
  background: #0B3D2E;
  border-radius: 16px;
  padding: 1.1rem 1.5rem;
  margin-bottom: 1.25rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.stat-value {
  font-family: 'DM Mono', monospace;
  font-size: 2rem;
  font-weight: 500;
  color: #fff;
  line-height: 1;
}

.stat-value.accent {
  color: #FBBF24;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255,255,255,0.12);
  margin: 0 1.5rem;
}

/* ── Toolbar ──────────────────────────────────────────────── */
.toolbar {
  margin-bottom: 1.1rem;
}

.search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
  width: 18px;
  height: 18px;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  border: 1.5px solid #D1FAE5;
  border-radius: 12px;
  background: white;
  color: #1F2937;
  outline: none;
  transition: border-color 0.15s;
}

.search-input:focus {
  border-color: #3DAA72;
}

/* ── State Boxes ──────────────────────────────────────────── */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  color: #6B7280;
  font-size: 0.9rem;
  border: 1.5px dashed #D1FAE5;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2.5px solid #D1FAE5;
  border-top-color: #3DAA72;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Table ────────────────────────────────────────────────── */
.table-wrap {
  background: white;
  border-radius: 18px;
  border: 1.5px solid #D1FAE5;
  overflow: hidden;
}

.farmer-table {
  width: 100%;
  border-collapse: collapse;
}

.farmer-table thead tr {
  border-bottom: 1.5px solid #E5F5ED;
}

.farmer-table th {
  padding: 0.8rem 1rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6B7280;
  background: #FAFAFA;
  text-align: left;
}

.farmer-table td {
  padding: 0.85rem 1rem;
  font-size: 0.88rem;
  border-bottom: 1px solid #F0F7F4;
  vertical-align: middle;
}

.farmer-row {
  cursor: pointer;
  transition: background 0.12s;
  position: relative;
}

.farmer-row:hover {
  background: #F6FDF9;
}

/* The signature "field row" accent — left green border that grows on hover */
.col-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 200px;
}

.row-accent {
  width: 3px;
  height: 28px;
  border-radius: 99px;
  background: #D1FAE5;
  flex-shrink: 0;
  transition: height 0.2s ease, background 0.2s ease;
}

.farmer-row:hover .row-accent {
  height: 44px;
  background: #3DAA72;
}

.name-block {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.name-primary {
  font-weight: 600;
  color: #0B3D2E;
}

.name-secondary {
  font-size: 0.76rem;
  color: #9CA3AF;
}

/* ── Badges ───────────────────────────────────────────────── */
.badge {
  display: inline-block;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.03em;
}

.badge.verified {
  background: #D1FAE5;
  color: #065F46;
}

.badge.pending {
  background: #FEF3C7;
  color: #92400E;
}

.badge.rejected {
  background: #FEE2E2;
  color: #991B1B;
}

/* ── View Button ──────────────────────────────────────────── */
.view-btn {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1A6B4A;
  background: #F0F7F4;
  border: 1.5px solid #D1FAE5;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  white-space: nowrap;
}

.view-btn:hover {
  background: #D1FAE5;
  border-color: #3DAA72;
}

/* ── Drawer ───────────────────────────────────────────────── */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 61, 46, 0.35);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: min(480px, 100%);
  height: 100%;
  background: white;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Drawer transition */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s;
}

.drawer-enter-active .drawer,
.drawer-leave-active .drawer {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(100%);
}

.drawer-header {
  background: #0B3D2E;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-shrink: 0;
}

.drawer-header-inner {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.drawer-eyebrow {
  font-family: 'DM Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.14em;
  color: #3DAA72;
}

.drawer-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.drawer-contact {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.55);
  font-family: 'DM Mono', monospace;
}

.close-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  transition: background 0.15s;
}

.close-btn:hover {
  background: rgba(255,255,255,0.2);
}

/* ── Drawer Sections ──────────────────────────────────────── */
.drawer-section {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #F0F7F4;
}

.section-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9CA3AF;
  margin-bottom: 0.85rem;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.55rem 0;
  border-bottom: 1px dashed #F0F7F4;
  gap: 1rem;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-key {
  font-size: 0.82rem;
  color: #9CA3AF;
  flex-shrink: 0;
}

.detail-val {
  font-size: 0.85rem;
  font-weight: 500;
  color: #0B3D2E;
  text-align: right;
}

/* ── Farm Summary Row ─────────────────────────────────────── */
.farm-summary-row {
  display: flex;
  align-items: center;
  background: #F6FDF9;
}

.farm-stat-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.farm-stat-num {
  font-family: 'DM Mono', monospace;
  font-size: 2.2rem;
  font-weight: 500;
  color: #0B3D2E;
  line-height: 1;
}

.farm-stat-num.accent {
  color: #1A6B4A;
}

.farm-stat-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #9CA3AF;
}

.farm-stat-divider {
  width: 1px;
  height: 44px;
  background: #D1FAE5;
  margin: 0 1.5rem;
}

/* ── Farms List ───────────────────────────────────────────── */
.farms-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.farm-item {
  border: 1.5px solid #E5F5ED;
  border-radius: 14px;
  overflow: hidden;
}

.farm-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 0.9rem;
  background: #F0F7F4;
  gap: 0.75rem;
}

.farm-item-name {
  font-weight: 600;
  font-size: 0.88rem;
  color: #0B3D2E;
}

.farm-area-pill {
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
  background: #0B3D2E;
  color: #FBBF24;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  white-space: nowrap;
}

.farm-item-meta {
  padding: 0.6rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.farm-detail {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid #F0F7F4;
  gap: 1rem;
}

.farm-detail:last-child {
  border-bottom: none;
}

.fd-key {
  font-size: 0.78rem;
  color: #9CA3AF;
}

.fd-val {
  font-size: 0.8rem;
  font-weight: 500;
  color: #1F2937;
  text-align: right;
}

.empty-farms {
  padding: 1rem;
  background: #FAFAFA;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #9CA3AF;
  text-align: center;
  border: 1.5px dashed #E5E7EB;
}

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 768px) {
  .farmers-page {
    padding: 1.25rem 1rem;
  }

  .stats-strip {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-divider {
    margin: 0 1rem;
  }

  .table-wrap {
    overflow-x: auto;
  }

  .farmer-table {
    min-width: 640px;
  }

  .drawer {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .row-accent,
  .farmer-row,
  .view-btn,
  .spinner {
    transition: none;
    animation: none;
  }
}
</style>