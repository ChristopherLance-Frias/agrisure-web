<template>
  <div class="layout">
    <div class="main-wrapper">

      <header class="top-header">
        <div class="header-title-group">
          <h1>Barangay Dashboard</h1>
          <p>{{ barangayName }} &middot; AgriSure MAO Portal</p>
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
      <main class="body">
        <div class="row-grid-3">
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>Farmer Analytics</h2>
                <p>Registered farmers in this barangay</p>
              </div>
            </div>

            <div class="analytics-stat-grid">
              <div class="analytics-stat-card">
                <span class="analytics-stat-label">Total Farmers</span>
                <strong class="analytics-stat-value">{{ farmerStats.total_farmers }}</strong>
              </div>

              <div class="analytics-stat-card">
                <span class="analytics-stat-label">Rice Farmers</span>
                <strong class="analytics-stat-value text-green">
                  {{ farmerStats.rice_farmers }}
                  <span class="stat-percent">{{ riceFarmerPct }}%</span>
                </strong>
              </div>

              <div class="analytics-stat-card">
                <span class="analytics-stat-label">Corn Farmers</span>
                <strong class="analytics-stat-value text-amber">
                  {{ farmerStats.corn_farmers }}
                  <span class="stat-percent">{{ cornFarmerPct }}%</span>
                </strong>
              </div>

              <div class="analytics-stat-card">
                <span class="analytics-stat-label">Avg. Farm Size</span>
                <strong class="analytics-stat-value">
                  {{ farmerStats.average_farm_size.toFixed(2) }}
                  <small>ha</small>
                </strong>
              </div>
            </div>
          </div>

          <!-- Farm Analytics -->
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>Farm Analytics</h2>
                <p>Local farm area and crop breakdown</p>
              </div>
            </div>

            <div class="analytics-stat-grid">
              <div class="analytics-stat-card">
                <span class="analytics-stat-label">Total Farms</span>
                <strong class="analytics-stat-value">{{ farmStats.total_farms }}</strong>
              </div>

              <div class="analytics-stat-card">
                <span class="analytics-stat-label">Rice Farms</span>
                <strong class="analytics-stat-value text-green">
                  {{ farmStats.rice_farms }}
                  <span class="stat-percent">{{ riceFarmPct }}%</span>
                </strong>
              </div>

              <div class="analytics-stat-card">
                <span class="analytics-stat-label">Corn Farms</span>
                <strong class="analytics-stat-value text-amber">
                  {{ farmStats.corn_farms }}
                  <span class="stat-percent">{{ cornFarmPct }}%</span>
                </strong>
              </div>

              <div class="analytics-stat-card">
                <span class="analytics-stat-label">Avg. Farm Area</span>
                <strong class="analytics-stat-value">
                  {{ farmStats.average_farm_area.toFixed(2) }}
                  <small>ha</small>
                </strong>
              </div>
            </div>
          </div>

          <!-- Crop Distribution Chart -->
          <div class="panel flex-center-panel">
            <div class="panel-header">
              <div>
                <h2>Crop Distribution</h2>
                <p>Farms by crop type</p>
              </div>
            </div>

            <div class="chart-wrapper" v-if="cropDistribution.length">
              <ApexChart
                type="donut"
                height="220"
                :options="cropDistributionChart.options"
                :series="cropDistributionChart.series"
              />
            </div>
            <p v-else class="subtext text-center empty-state">No crop data yet.</p>
          </div>
        </div>

        <!-- CROP AREA & DISTRIBUTION SUMMARY ROW -->
        <div class="row-grid-2">
          <!-- Crop Area Distribution -->
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>Crop Area Distribution</h2>
                <p>Total agricultural area in barangay</p>
              </div>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <p class="summary-label">Rice Area</p>
                <p class="summary-value text-green">
                  {{ farmStats.total_rice_area.toFixed(2) }}
                  <span class="summary-unit">ha</span>
                </p>
                <p class="summary-subtext subtext">{{ riceAreaPct }}% of total area</p>
              </div>

              <div class="summary-card">
                <p class="summary-label">Corn Area</p>
                <p class="summary-value text-amber">
                  {{ farmStats.total_corn_area.toFixed(2) }}
                  <span class="summary-unit">ha</span>
                </p>
                <p class="summary-subtext subtext">{{ cornAreaPct }}% of total area</p>
              </div>
            </div>
          </div>

          <!-- Barangay Distribution Summary -->
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>Supplies Distributed</h2>
                <p>Total distribution activity for this barangay</p>
              </div>
            </div>

            <div class="summary-grid compact">
              <div class="summary-card">
                <p class="summary-label">Total Quantity</p>
                <p class="summary-value text-dark">{{ distributionStats.total_distributed }}</p>
              </div>
              <div class="summary-card">
                <p class="summary-label">Events</p>
                <p class="summary-value text-dark">{{ distributionStats.total_events }}</p>
              </div>
              <div class="summary-card">
                <p class="summary-label">Beneficiaries</p>
                <p class="summary-value text-dark">{{ distributionStats.total_beneficiaries }}</p>
              </div>
            </div>

            <ul class="supply-breakdown-list" v-if="bySupply.length">
              <li v-for="item in bySupply" :key="item.id" class="supply-breakdown-item">
                <span>{{ item.supply_name }}</span>
                <strong>{{ item.total_quantity }} {{ item.unit }}</strong>
              </li>
            </ul>
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

const cropDistributionChart = computed(() => ({
  series: cropDistribution.value.map(c => c.total),
  options: {
    labels: cropDistribution.value.map(c => c.crop_type),
    legend: { position: 'bottom', fontSize: '12px' },
    colors: ['#116D3E', '#D29539', '#2E6F8E', '#6B5B95'],
    chart: { toolbar: { show: false } },
    dataLabels: { enabled: false }
  },
}))

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

/* ------------------------------------------------------------------ *
 * Mount
 * ------------------------------------------------------------------ */
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

/* METRICS GRID */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  box-shadow: 0 4px 12px rgba(15, 33, 47, 0.03);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.card-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #5C6B64;
}

.icon-badge {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-badge svg {
  width: 18px;
  height: 18px;
}

.icon-badge.green { background: rgba(17, 109, 62, 0.1); color: #116D3E; }

.card-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0F212F;
  margin-bottom: 0.4rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-pill.neutral { background: #F1F6F2; color: #5C6B64; }

/* PANELS & GRIDS */
.row-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.row-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.row-grid-weather {
  display: grid;
  grid-template-columns: minmax(260px, 360px);
}

.col-span-2 { grid-column: span 2; }

.panel {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 4px 12px rgba(15, 33, 47, 0.03);
  display: flex;
  flex-direction: column;
}

.panel-header {
  margin-bottom: 1rem;
}

.panel-header h2 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0F212F;
}

.panel-header p, .subtext {
  font-size: 0.75rem;
  color: #5C6B64;
  margin-top: 2px;
}

.empty-state {
  padding: 2rem 0;
  color: #94A3B8;
}

/* ANALYTICS STAT GRID */
.analytics-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.analytics-stat-card {
  padding: 12px;
  border: 1px solid #EAF1EC;
  border-radius: 8px;
  background: #FAFCFB;
}

.analytics-stat-label {
  display: block;
  font-size: 0.7rem;
  color: #6B7972;
  margin-bottom: 4px;
}

.analytics-stat-value {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0F212F;
}

.stat-percent {
  font-size: 0.7rem;
  font-weight: 600;
}

.analytics-stat-value small {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6B7972;
}

.chart-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* SUMMARY CARDS */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.summary-grid.compact {
  grid-template-columns: repeat(3, 1fr);
}

.summary-card {
  background: #FAFCFB;
  border: 1px solid #EAF1EC;
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.summary-label { font-size: 0.7rem; color: #5C6B64; margin-bottom: 2px; }
.summary-value { font-size: 1.1rem; font-weight: 700; }
.summary-unit { font-size: 0.7rem; font-weight: 500; color: #5C6B64; }
.summary-subtext { margin-top: 2px; }

/* SUPPLY BREAKDOWN */
.supply-breakdown-list {
  list-style: none;
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.supply-breakdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: #FAFCFB;
  border: 1px solid #EAF1EC;
  border-radius: 6px;
  font-size: 0.78rem;
}

.supply-breakdown-item strong {
  color: #116D3E;
}

/* COLOR UTILITIES */
.text-green { color: #116D3E; }
.text-amber { color: #AC7A2F; }
.text-dark { color: #0F212F; }
.icon-green { color: #116D3E; }
.text-center { text-align: center; }

/* WEATHER CARD */
.weather-card {
  position: relative;
  background: linear-gradient(150deg, #116D3E 0%, #0A5232 55%, #0F212F 100%);
  border-radius: 12px;
  padding: 1.25rem;
  color: #FFFFFF;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.weather-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.sun-disc {
  position: absolute;
  top: -18px;
  right: -18px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(circle, #D29539 0%, rgba(210, 149, 57, 0.3) 60%, transparent 72%);
}

.cloud { position: absolute; fill: rgba(255, 255, 255, 0.14); }
.cloud-back { top: 14px; left: -40px; width: 100px; }
.cloud-front { top: 34px; left: -60px; width: 130px; fill: rgba(255, 255, 255, 0.22); }

.weather-content { position: relative; z-index: 1; }
.weather-top { display: flex; align-items: flex-start; justify-content: space-between; }
.weather-subtitle { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255, 255, 255, 0.7); }
.weather-temp { font-size: 1.8rem; font-weight: 700; margin-top: 2px; }
.weather-updated { font-size: 0.65rem; color: rgba(255, 255, 255, 0.6); }

.weather-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(210, 149, 57, 0.22);
  color: #D29539;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.weather-condition { font-size: 0.78rem; color: rgba(255, 255, 255, 0.85); margin-top: 4px; }

.weather-stats-grid {
  position: relative;
  z-index: 1;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.weather-stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.weather-stat-cell i { color: #D29539; font-size: 0.85rem; }
.stat-label { font-size: 0.6rem; text-transform: uppercase; color: rgba(255, 255, 255, 0.6); }
.weather-stat-cell strong { font-size: 0.8rem; }

.weather-retry-btn {
  position: relative;
  z-index: 1;
  margin-top: 0.75rem;
  background: #D29539;
  color: #0F212F;
  border: none;
  border-radius: 6px;
  padding: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

/* RESPONSIVE LAYOUT */
@media (max-width: 1024px) {
  .row-grid-3 { grid-template-columns: 1fr; }
  .col-span-2 { grid-column: span 1; }
}

@media (max-width: 640px) {
  .row-grid-2 { grid-template-columns: 1fr; }
  .summary-grid.compact { grid-template-columns: 1fr; }
  .row-grid-weather { grid-template-columns: 1fr; }
}
</style>