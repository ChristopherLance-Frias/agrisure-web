<template>
  <div class="dashboard-layout">
    <div class="main-wrapper">
      <!-- TOP BAR / HEADER -->
      <header class="top-header">
        <div class="header-title-group">
          <h1>Barangay Reports</h1>
          <p>{{ barangayName }} &middot; AgriSure Barangay Portal</p>
        </div>

        <div class="header-actions">
          <div class="v-divider"></div>
          <div class="user-profile">
            <div class="user-avatar">{{ currentUser.initials }}</div>
            <div class="user-info">
              <p class="user-name">{{ currentUser.name }}</p>
              <p class="user-role">{{ currentUser.role }}</p>
            </div>
          </div>
        </div>
      </header>

      <main class="dashboard-body">
        <!-- BARANGAY ANALYTICS (tabbed tables) -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Barangay Analytics</h2>
              <p>Farmer, farm, crop, and distribution records for this barangay</p>
            </div>
          </div>

          <div class="tab-header analytics-tab-header">
            <button
              v-for="t in analyticsTabs"
              :key="t.key"
              class="tab-btn"
              :class="{ active: activeAnalyticsTab === t.key }"
              @click="activeAnalyticsTab = t.key"
            >
              {{ t.label }}
            </button>
          </div>

          <!-- FARMER ANALYTICS -->
          <div v-if="activeAnalyticsTab === 'farmers'" class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th class="text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-medium">Total Farmers</td>
                  <td class="text-right num-cell font-medium">{{ farmerStats.total_farmers }}</td>
                </tr>
                <tr>
                  <td>Rice Farmers</td>
                  <td class="text-right num-cell">
                    <span class="text-green font-medium">{{ farmerStats.rice_farmers }}</span>
                    <span class="stat-percent">({{ riceFarmerPct }}%)</span>
                  </td>
                </tr>
                <tr>
                  <td>Corn Farmers</td>
                  <td class="text-right num-cell">
                    <span class="text-amber font-medium">{{ farmerStats.corn_farmers }}</span>
                    <span class="stat-percent">({{ cornFarmerPct }}%)</span>
                  </td>
                </tr>
                <tr>
                  <td>Average Farm Size</td>
                  <td class="text-right num-cell">{{ farmerStats.average_farm_size.toFixed(2) }} ha</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- FARM ANALYTICS -->
          <div v-else-if="activeAnalyticsTab === 'farms'" class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th class="text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-medium">Total Farms</td>
                  <td class="text-right num-cell font-medium">{{ farmStats.total_farms }}</td>
                </tr>
                <tr>
                  <td>Rice Farms</td>
                  <td class="text-right num-cell">
                    <span class="text-green font-medium">{{ farmStats.rice_farms }}</span>
                    <span class="stat-percent">({{ riceFarmPct }}%)</span>
                  </td>
                </tr>
                <tr>
                  <td>Corn Farms</td>
                  <td class="text-right num-cell">
                    <span class="text-amber font-medium">{{ farmStats.corn_farms }}</span>
                    <span class="stat-percent">({{ cornFarmPct }}%)</span>
                  </td>
                </tr>
                <tr>
                  <td>Average Farm Area</td>
                  <td class="text-right num-cell">{{ farmStats.average_farm_area.toFixed(2) }} ha</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- CROP DISTRIBUTION -->
          <div v-else-if="activeAnalyticsTab === 'crops'" class="table-wrapper">
            <table v-if="cropDistribution.length" class="data-table">
              <thead>
                <tr>
                  <th>Crop Type</th>
                  <th class="text-right">Total Farms</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in cropDistribution" :key="row.crop_type">
                  <td class="font-medium">{{ row.crop_type }}</td>
                  <td class="text-right num-cell">{{ row.total }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="subtext text-center empty-state">No crop data yet.</p>
          </div>

          <!-- CROP AREA DISTRIBUTION -->
          <div v-else-if="activeAnalyticsTab === 'area'" class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Crop Type</th>
                  <th class="text-right">Area (ha)</th>
                  <th class="text-right">% of Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-medium text-green">Rice</td>
                  <td class="text-right num-cell">{{ farmStats.total_rice_area.toFixed(2) }}</td>
                  <td class="text-right num-cell">{{ riceAreaPct }}%</td>
                </tr>
                <tr>
                  <td class="font-medium text-amber">Corn</td>
                  <td class="text-right num-cell">{{ farmStats.total_corn_area.toFixed(2) }}</td>
                  <td class="text-right num-cell">{{ cornAreaPct }}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- SUPPLIES DISTRIBUTED -->
          <div v-else-if="activeAnalyticsTab === 'supplies'" class="table-wrapper">
            <table class="data-table summary-subtable">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th class="text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Quantity Distributed</td>
                  <td class="text-right num-cell font-medium">{{ distributionStats.total_distributed }}</td>
                </tr>
                <tr>
                  <td>Distribution Events</td>
                  <td class="text-right num-cell font-medium">{{ distributionStats.total_events }}</td>
                </tr>
                <tr>
                  <td>Beneficiaries</td>
                  <td class="text-right num-cell font-medium">{{ distributionStats.total_beneficiaries }}</td>
                </tr>
              </tbody>
            </table>

            <table v-if="bySupply.length" class="data-table">
              <thead>
                <tr>
                  <th>Supply</th>
                  <th class="text-right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in bySupply" :key="item.id">
                  <td class="font-medium">{{ item.supply_name }}</td>
                  <td class="text-right num-cell">{{ item.total_quantity }} {{ item.unit }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="subtext empty-state">No supplies distributed yet.</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'

/* ------------------------------------------------------------------ *
 * Auth / header info
 * ------------------------------------------------------------------ */
const currentUser = reactive({
  name: '',
  role: 'Barangay Official',
  initials: '',
})

const barangayName = ref('')

/* ------------------------------------------------------------------ *
 * Tabs
 * ------------------------------------------------------------------ */
const analyticsTabs = [
  { key: 'farmers', label: 'Farmers' },
  { key: 'farms', label: 'Farms' },
  { key: 'crops', label: 'Crop Distribution' },
  { key: 'area', label: 'Crop Area' },
  { key: 'supplies', label: 'Supplies Distributed' },
]
const activeAnalyticsTab = ref('farmers')

/* ------------------------------------------------------------------ *
 * Report data
 * ------------------------------------------------------------------ */
const farmerStats = reactive({
  total_farmers: 0,
  rice_farmers: 0,
  corn_farmers: 0,
  average_farm_size: 0,
})

const farmStats = reactive({
  total_farms: 0,
  rice_farms: 0,
  corn_farms: 0,
  total_rice_area: 0,
  total_corn_area: 0,
  average_farm_area: 0,
})

const cropDistribution = ref([])

const distributionStats = reactive({
  total_distributed: 0,
  total_events: 0,
  total_beneficiaries: 0,
})

const bySupply = ref([])

/* ------------------------------------------------------------------ *
 * Computed percentages
 * ------------------------------------------------------------------ */
const riceFarmerPct = computed(() =>
  farmerStats.total_farmers
    ? ((farmerStats.rice_farmers / farmerStats.total_farmers) * 100).toFixed(1)
    : '0.0'
)

const cornFarmerPct = computed(() =>
  farmerStats.total_farmers
    ? ((farmerStats.corn_farmers / farmerStats.total_farmers) * 100).toFixed(1)
    : '0.0'
)

const riceFarmPct = computed(() =>
  farmStats.total_farms
    ? ((farmStats.rice_farms / farmStats.total_farms) * 100).toFixed(1)
    : '0.0'
)

const cornFarmPct = computed(() =>
  farmStats.total_farms
    ? ((farmStats.corn_farms / farmStats.total_farms) * 100).toFixed(1)
    : '0.0'
)

const totalCropArea = computed(() => farmStats.total_rice_area + farmStats.total_corn_area)

const riceAreaPct = computed(() =>
  totalCropArea.value ? ((farmStats.total_rice_area / totalCropArea.value) * 100).toFixed(1) : '0.0'
)

const cornAreaPct = computed(() =>
  totalCropArea.value ? ((farmStats.total_corn_area / totalCropArea.value) * 100).toFixed(1) : '0.0'
)

/* ------------------------------------------------------------------ *
 * API Calls
 * ------------------------------------------------------------------ */
async function fetchFarmerAndFarmStats(barangayId) {
  const [farmersRes, farmsRes] = await Promise.all([
    axios.get('/api/reports/farmers', { params: { barangay_id: barangayId } }),
    axios.get('/api/reports/farms', { params: { barangay_id: barangayId } }),
  ])

  Object.assign(farmerStats, farmersRes.data.summary)
  Object.assign(farmStats, farmsRes.data.summary)
  cropDistribution.value = farmsRes.data.crop_distribution ?? []
}

async function fetchDistributionStats() {
  const res = await axios.get('/api/reports/supplies-distributed')
  Object.assign(distributionStats, res.data.summary)
  bySupply.value = res.data.by_supply ?? []
}

onMounted(async () => {
  const rawUser = localStorage.getItem('user') || localStorage.getItem('barangay_user')

  if (!rawUser) {
    console.error('No authenticated user found in storage.')
    return
  }

  const storedUser = JSON.parse(rawUser)
  const barangayId = storedUser.barangay_id || storedUser.barangay?.id

  if (!barangayId) {
    console.error('Barangay ID missing from authenticated user context.', storedUser)
    return
  }

  currentUser.name = storedUser.name || `${storedUser.first_name || ''} ${storedUser.last_name || ''}`.trim()
  currentUser.role = storedUser.role || 'Barangay Official'
  currentUser.initials = currentUser.name
    ? currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase()
    : 'BO'
  barangayName.value = storedUser.barangay?.name || 'Local Barangay'

  try {
    await Promise.all([
      fetchFarmerAndFarmStats(barangayId),
      fetchDistributionStats(),
    ])
  } catch (e) {
    console.error('Dashboard load failed', e)
  }
})
</script>

<style scoped>
* { box-sizing: border-box; }

/* ===================== PAGE SHELL ===================== */
.dashboard-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #F8FAF8;
}

.main-wrapper {
  flex: 1;
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-header {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #E7F0EC;
  flex-shrink: 0;
  z-index: 20;
  padding: 0 1.75rem;
  min-height: 64px;
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
  color: #5C6B64;
  margin-top: 2px;
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

.user-name { font-size: 12px; font-weight: 700; color: #0F212F; line-height: 1.2; }
.user-role { font-size: 10px; font-weight: 500; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; }

/* ===================== BODY ===================== */
.dashboard-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ===================== PANEL ===================== */
.panel {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1.35rem 1.5rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  display: flex;
  flex-direction: column;
}

.panel-header { margin-bottom: 0.2rem; }
.panel-header h2 { font-size: 1rem; font-weight: 700; color: #0F212F; }
.panel-header p, .subtext { font-size: 0.78rem; color: #5C6B64; margin-top: 3px; }

.empty-state { padding: 2.5rem 0; color: #94A3B8; text-align: center; }

/* ===================== TAB NAVIGATION ===================== */
.tab-header {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #F1F6F2;
  border-radius: 10px;
  padding: 4px;
  flex-wrap: wrap;
  width: fit-content;
}

.analytics-tab-header { margin: 1rem 0 1.2rem; }

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: none;
  background: transparent; 
  font-size: 0.8rem;
  font-weight: 600;
  padding: 8px 15px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}
.tab-btn:hover { color: #0F212F; transform: translateY(-1px); }
.tab-btn.active {
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(17, 109, 62, 0.28);
}
.tab-btn.active .tab-icon { color: #FFFFFF; }

.tab-icon { width: 15px; height: 15px; flex-shrink: 0; color: #94A3B8; }

/* ===================== TAB CONTENT TRANSITION ===================== */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(6px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-6px); }

/* ===================== DATA TABLE ===================== */
.table-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead th {
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5C6B64;
  padding: 10px 14px;
  background: #F1F6F2;
}

.data-table thead tr th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
.data-table thead tr th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }

.data-table tbody td {
  font-size: 0.84rem;
  color: #0F212F;
  padding: 11px 14px;
  border-bottom: 1px solid #F1F6F2;
}
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #FAFCFB; }

.summary-subtable { margin-bottom: 0.25rem; }

.text-right { text-align: right; }
.num-cell { font-variant-numeric: tabular-nums; }
.font-medium { font-weight: 700; }
.text-center { text-align: center; }

.stat-percent {
  font-size: 0.72rem;
  font-weight: 600;
  color: #5C6B64;
  margin-left: 4px;
}

/* ===================== COLOR UTILITIES ===================== */
.text-green { color: #116D3E; }
.text-amber { color: #AC7A2F; }
.text-dark { color: #0F212F; }

/* ===================== RESPONSIVE ===================== */
@media (max-width: 640px) {
  .panel { padding: 1.1rem; }
  .top-header { padding: 0 1.1rem; }
}
</style>