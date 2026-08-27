<template>
  <div class="layout">
    <div class="main-wrapper">
      <header class="top-header">
        <div class="header-title-group">
          <h1>Registered Farmers</h1>
          <p>Verified agricultural households in your Barangay</p>
        </div>

        <div class="header-actions">

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
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-card-label">Total Farmers</span>
              <span class="icon-badge blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <circle cx="12" cy="8" r="3.2"/>
                  <path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6" stroke-linecap="round"/>
                </svg>
              </span>
            </div>
            <div class="stat-card-value">{{ farmers.length }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-card-label">Verified</span>
              <span class="icon-badge green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </div>
            <div class="stat-card-value">{{ verifiedCount }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-card-label">Total Farms</span>
              <span class="icon-badge amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M4 20c0-8 4-14 15-15-1 10-6 15-15 15Z" stroke-linejoin="round"/>
                  <path d="M9 19c2-4 5-7 9-10" stroke-linecap="round"/>
                </svg>
              </span>
            </div>
            <div class="stat-card-value">{{ totalFarms }}</div>
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
      </main>

    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'https://sanagustinagrisure.com'

export default {
  name: 'BarangayFarmersPage',

  data() {
    return {
      farmers: [],
      selectedFarmer: null,
      search: '',
      loading: false,

      currentUser: {
        name: '',
        role: 'Barangay Official',
        initials: '',
      },

      barangayName: 'Local Barangay',
    }
  },

  computed: {
    filteredFarmers() {
      const q = this.search.toLowerCase().trim()

      if (!q) {
        return this.farmers
      }

      return this.farmers.filter((farmer) =>
        this.fullName(farmer).toLowerCase().includes(q) ||
        String(farmer.phone_number || '').includes(q) ||
        String(farmer.farmer_profile?.address || '')
          .toLowerCase()
          .includes(q)
      )
    },

    verifiedCount() {
      return this.farmers.filter(
        (farmer) => farmer.account_status === 'verified'
      ).length
    },

    totalFarms() {
      return this.farmers.reduce(
        (total, farmer) =>
          total + (farmer.farmer_profile?.farms?.length || 0),
        0
      )
    },

    selectedFarms() {
      return this.selectedFarmer?.farmer_profile?.farms || []
    },

    selectedTotalArea() {
      return this.selectedFarms.reduce(
        (sum, farm) => sum + Number(farm.farm_area || 0),
        0
      )
    },
  },

  mounted() {
    this.loadUser()
    this.fetchFarmers()
  },

  methods: {
    loadUser() {
      const rawUser =
        localStorage.getItem('user') ||
        localStorage.getItem('barangay_user')

      if (!rawUser) {
        console.error('No authenticated user found in storage.')
        return
      }

      let storedUser

      try {
        storedUser = JSON.parse(rawUser)
      } catch (error) {
        console.error('Invalid user data in localStorage.', error)
        return
      }

      const barangayId =
        storedUser.barangay_id ||
        storedUser.barangay?.id

      if (!barangayId) {
        console.error(
          'Barangay ID missing from authenticated user context.',
          storedUser
        )
        return
      }

      this.currentUser.name =
        storedUser.name ||
        `${storedUser.first_name || ''} ${storedUser.last_name || ''}`.trim()

      this.currentUser.role =
        storedUser.role || 'Barangay Official'

      this.currentUser.initials = this.currentUser.name
        ? this.currentUser.name
            .split(' ')
            .filter(Boolean)
            .map((word) => word[0])
            .join('')
            .toUpperCase()
        : 'BO'

      this.barangayName =
        storedUser.barangay?.name || 'Local Barangay'
    },

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
        const response = await axios.get(
          `${API_BASE}/api/barangay/farmers`,
          this.authHeaders()
        )

        this.farmers = response.data
      } catch (error) {
        console.error('Failed to load farmers:', error)

        if (error.response) {
          console.error('Status:', error.response.status)
          console.error('Response:', error.response.data)
        }

        alert('Failed to load farmers.')
      } finally {
        this.loading = false
      }
    },

    async openFarmer(id) {
      try {
        const response = await axios.get(
          `${API_BASE}/api/barangay/farmers/${id}`,
          this.authHeaders()
        )

        this.selectedFarmer = response.data
      } catch (error) {
        console.error('Failed to load farmer details:', error)

        if (error.response) {
          console.error('Status:', error.response.status)
          console.error('Response:', error.response.data)
        }

        alert('Failed to load farmer details.')
      }
    },

    fullName(farmer) {
      return [
        farmer.first_name,
        farmer.middle_name,
        farmer.last_name,
        farmer.extension_name,
      ]
        .filter(Boolean)
        .join(' ')
    },

    formatDate(date) {
      if (!date) {
        return '—'
      }

      return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
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

/* ===================== STATS GRID (cards, no dividers) ===================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1.2rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
}

.stat-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.9rem;
}

.stat-card-label { font-size: 0.78rem; font-weight: 600; color: #5c6b64; }

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
.icon-badge.amber { background: rgba(210, 149, 57, 0.16); color: #AC7A2F; }

.stat-card-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0F212F;
}

.stat-card-value.accent { color: #116D3E; }

/* ===================== TOOLBAR ===================== */
.toolbar { display: flex; align-items: center; }

.search-wrap {
  position: relative;
  max-width: 420px;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  width: 16px;
  height: 16px;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 34px;
  border: 1.5px solid #E0EAE3;
  border-radius: 10px;
  font-size: 0.84rem;
  color: #0F212F;
  background: #FFFFFF;
  transition: border-color 0.15s ease;
}
.search-input:focus { outline: none; border-color: #116D3E; }

/* ===================== LOADING / EMPTY STATES ===================== */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 3.5rem 1rem;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
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

/* ===================== TABLE ===================== */
.table-wrap {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  overflow: hidden;
}

.farmer-table { width: 100%; border-collapse: collapse; }

.farmer-table thead th {
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
  padding: 12px 16px;
  background: #F1F6F2;
  border-bottom: 1px solid #EAF1EC;
}

.farmer-row { cursor: pointer; transition: background 0.12s ease; }
.farmer-row:hover { background: #F8FAF8; }
.farmer-row td {
  padding: 12px 16px;
  font-size: 0.84rem;
  color: #0F212F;
  border-bottom: 1px solid #F1F6F2;
  vertical-align: middle;
}
.farmer-row:last-child td { border-bottom: none; }

.col-name { position: relative; display: flex; align-items: center; gap: 10px; }

.row-accent {
  width: 3px;
  align-self: stretch;
  min-height: 30px;
  border-radius: 3px;
  background: transparent;
  transition: background 0.12s ease;
}
.farmer-row:hover .row-accent { background: #116D3E; }

.name-block { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.name-primary { font-weight: 700; color: #0F212F; }
.name-secondary {
  font-size: 0.74rem;
  color: #5c6b64;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.mono { font-variant-numeric: tabular-nums; font-family: "SF Mono", Menlo, monospace; font-size: 0.8rem; }

.view-btn {
  background: none;
  border: none;
  color: #116D3E;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  padding: 6px 4px;
  white-space: nowrap;
}
.view-btn:hover { text-decoration: underline; }

/* ===================== BADGES ===================== */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: capitalize;
  white-space: nowrap;
}

.badge.verified { background: rgba(17, 109, 62, 0.1); color: #116D3E; }
.badge.pending  { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.badge.rejected { background: rgba(193, 71, 61, 0.1); color: #C1473D; }

/* ===================== DRAWER ===================== */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(15, 33, 47, 0.45);
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: 420px;
  max-width: 100%;
  height: 100vh;
  background: #FFFFFF;
  box-shadow: -20px 0 50px rgba(15, 33, 47, 0.2);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.drawer-enter-active, .drawer-leave-active { transition: opacity 0.2s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform 0.25s ease; }
.drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: translateX(100%); }

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 1.5rem;
  background: linear-gradient(150deg, #116D3E 0%, #0A5232 100%);
  color: #FFFFFF;
}

.drawer-eyebrow {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 6px;
}

.drawer-name { font-size: 1.15rem; font-weight: 700; }
.drawer-contact { font-size: 0.8rem; color: rgba(255, 255, 255, 0.75); margin-top: 4px; }

.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.14);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.close-btn:hover { background: rgba(255, 255, 255, 0.24); }

.drawer-section {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #F1F6F2;
}
.drawer-section:last-child { border-bottom: none; }

.section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
  margin-bottom: 0.9rem;
}

.detail-grid { display: flex; flex-direction: column; gap: 10px; }

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-key { font-size: 0.8rem; color: #5c6b64; }
.detail-val { font-size: 0.84rem; font-weight: 600; color: #0F212F; text-align: right; }

.farm-summary-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  background: #F8FAF8;
}

.farm-stat-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.farm-stat-num { font-size: 1.5rem; font-weight: 700; color: #0F212F; }
.farm-stat-num.accent { color: #116D3E; }
.farm-stat-label { font-size: 0.72rem; color: #5c6b64; }

.farm-stat-divider { width: 1px; height: 36px; background: #E0EAE3; }

.empty-farms {
  text-align: center;
  padding: 1.5rem 1rem;
  color: #5c6b64;
  font-size: 0.82rem;
  background: #F8FAF8;
  border: 1px dashed #E0EAE3;
  border-radius: 12px;
}

.farms-list { display: flex; flex-direction: column; gap: 10px; }

.farm-item {
  background: #F8FAF8;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 0.9rem 1rem;
}

.farm-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 0.7rem;
}

.farm-item-name { font-size: 0.88rem; font-weight: 700; color: #0F212F; }

.farm-area-pill {
  font-size: 0.7rem;
  font-weight: 700;
  color: #116D3E;
  background: rgba(17, 109, 62, 0.1);
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}

.farm-item-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.farm-detail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.fd-key { font-size: 0.74rem; color: #5c6b64; }
.fd-val { font-size: 0.78rem; font-weight: 600; color: #0F212F; text-align: right; }

/* ===================== RESPONSIVE ===================== */
@media (max-width: 900px) {
  .stats-grid { grid-template-columns: 1fr; }
  .name-secondary { max-width: 160px; }
  .drawer { width: 100%; }
}

@media (max-width: 640px) {
  .col-contact, .col-date { display: none; }
}
</style>