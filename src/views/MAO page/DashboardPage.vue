<template>
  <div class="dashboard-layout">

    <!-- MAIN CONTENT AREA -->
    <div class="main-wrapper">

      <!-- TOP BAR / HEADER -->
      <header class="top-header">
        <div class="header-title-group">
          <h1>Dashboard Overview</h1>
          <p>San Agustin Municipal Agriculture Office &middot; AgriSure</p>
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

      <!-- DASHBOARD BODY CONTAINER -->
      <main class="body">

        <!-- METRICS ROW (5 Cards) -->
        <div class="metrics-grid">
            <!-- Card 1: Farmers -->
            <div class="metric-card">
              <div class="card-header">
                <span class="card-label">Registered Farmers</span>
                <div class="icon-badge green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
              <h3 class="card-value">{{ stats.farmers.count }}</h3>
              <div class="card-footer green">
                <span class="status-pill green">
                  {{ stats.farmers.change }}
                </span>
              </div>
            </div>

            <!-- Card 2: Applications -->
            <div class="metric-card">
              <div class="card-header">
                <span class="card-label">Applications</span>
                <div class="icon-badge blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M9 15l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <h3 class="card-value">{{ stats.applications.count }}</h3>
              <div class="card-footer amber">
                <span class="status-pill amber">
                  {{ stats.applications.pending }}
                </span>
                <span
                  v-if="applicationTrendChange"
                  :class="['trend-badge', applicationTrendChange.direction]"
                >
                  <i :class="['fa-solid', applicationTrendChange.direction === 'up' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down']"></i>
                  {{ applicationTrendChange.pct }}% MoM
                </span>
              </div>
            </div>

            <!-- Card 3: Claims -->
            <div class="metric-card">
              <div class="card-header">
                <span class="card-label">Active Claims</span>
                <div class="icon-badge amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 1v22" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </div>
              <h3 class="card-value">{{ stats.claims.count }}</h3>
              <div class="card-footer amber">
                <span class="status-pill amber">
                  {{ stats.claims.inspecting }}
                </span>
                <span v-if="averageClaimAmount" class="trend-badge neutral">
                  Avg &#8369;{{ Math.round(averageClaimAmount).toLocaleString() }}
                </span>
              </div>
            </div>

            <!-- Card 4: Damage Reports -->
            <div class="metric-card">
              <div class="card-header">
                <span class="card-label">Damage Reports</span>
                <div class="icon-badge red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
              </div>
              <h3 class="card-value">{{ stats.damage.count }}</h3>
              <div class="card-footer red">
                <span class="status-pill red">
                  {{ stats.damage.critical }}
                </span>
              </div>
            </div>

            <!-- Card 5: Inventory -->
            <div class="metric-card">
              <div class="card-header">
                <span class="card-label">Inventory</span>
                <div class="icon-badge purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 8L12 3 3 8l9 5 9-5z" />
                    <path d="M3 8v8l9 5 9-5V8" />
                    <path d="M12 13v8" />
                  </svg>
                </div>
              </div>
              <h3 class="card-value">
                {{ stats.inventory.items }} <span class="unit-text">Items</span>
              </h3>
              <div class="card-footer red">
                <span class="status-pill red">
                  {{ stats.inventory.lowStock }}
                </span>
              </div>
            </div>
        </div>
        <!-- FARMER & FARM ANALYTICS -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Farmer & Farm Analytics</h2>
              <p>Registered farmers, farms, and crop mix</p>
            </div>
          </div>

          <div class="analytics-split-row">
            <div class="analytics-split-left">
              <div class="analytics-stat-grid">
                <div class="analytics-stat-card">
                  <span class="analytics-stat-label">Total Farmers</span>
                  <strong class="analytics-stat-value">{{ farmerAnalytics.totalFarmers }}</strong>
                </div>

                <div class="analytics-stat-card">
                  <span class="analytics-stat-label">Total Farms</span>
                  <strong class="analytics-stat-value">{{ farmAnalytics.totalFarms }}</strong>
                </div>

                <div class="analytics-stat-card">
                  <span class="analytics-stat-label">Total Farm Area</span>
                  <strong class="analytics-stat-value">
                    {{ totalFarmArea.toFixed(2) }}
                    <small>ha</small>
                  </strong>
                </div>

                <div class="analytics-stat-card">
                  <span class="analytics-stat-label">Total Rice Farm Area</span>
                  <strong class="analytics-stat-value">
                    {{ farmAnalytics.riceArea.toFixed(2) }}
                    <small>ha</small>
                  </strong>
                </div>

                <div class="analytics-stat-card">
                  <span class="analytics-stat-label">Total Corn Farm Area</span>
                  <strong class="analytics-stat-value">
                    {{ farmAnalytics.cornArea.toFixed(2) }}
                    <small>ha</small>
                  </strong>
                </div>
              </div>
            </div>

            <div class="analytics-split-right">
              <ApexChart
                type="donut"
                height="220"
                :options="chartConfigs.cropDistribution.options"
                :series="chartConfigs.cropDistribution.series"
              />
            </div>
          </div>
        </div>

        <!-- FARMERS BY BARANGAY -->
        <div class="panel">

          <div class="panel-header">
            <div>
              <h2>Farmers by Barangay</h2>
              <p>Distribution of registered farmers across barangays</p>
            </div>
          </div>

          <ApexChart
            type="bar"
            height="350"
            :options="chartConfigs.farmerBarangay.options"
            :series="chartConfigs.farmerBarangay.series"
          />

        </div>

        <!-- FARM AREA SUMMARY -->
        <div class="row-grid-2">

          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>Crop Area Distribution</h2>
                <p>Total agricultural area by crop</p>
              </div>
            </div>

            <div class="summary-grid">

              <div class="summary-card">
                <p class="summary-label">Rice Area</p>
                <p class="summary-value text-green">
                  {{ farmAnalytics.riceArea.toFixed(2) }}
                  <span class="summary-unit">ha</span>
                </p>
                <p class="summary-subtext">{{ riceAreaPct }}% of total area</p>
              </div>

              <div class="summary-card">
                <p class="summary-label">Corn Area</p>
                <p class="summary-value text-amber">
                  {{ farmAnalytics.cornArea.toFixed(2) }}
                  <span class="summary-unit">ha</span>
                </p>
                <p class="summary-subtext">{{ cornAreaPct }}% of total area</p>
              </div>

            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>Largest Agricultural Barangays</h2>
                <p>Barangays with the largest registered farm area</p>
              </div>
            </div>

            <div class="table-responsive">

              <table class="data-table">

                <thead>
                  <tr>
                    <th>Barangay</th>
                    <th>Farms</th>
                    <th>Total Area</th>
                    <th>Avg Farm Size</th>
                  </tr>
                </thead>

                <tbody>

                  <tr
                    v-for="barangay in farmReport.largest_agricultural_barangays"
                    :key="barangay.id"
                  >

                    <td class="font-bold">
                      {{ barangay.name }}
                    </td>

                    <td>
                      {{ barangay.total_farms }}
                    </td>

                    <td>
                      {{ Number(barangay.total_area).toFixed(2) }} ha
                    </td>

                    <td>
                      {{ barangay.total_farms ? (Number(barangay.total_area) / barangay.total_farms).toFixed(2) : '0.00' }} ha
                    </td>

                  </tr>

                  <tr
                    v-if="!farmReport.largest_agricultural_barangays?.length"
                  >
                    <td colspan="4" class="text-center">
                      No farm data available.
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>
          </div>

        </div>
        <!-- MAIN CHARTS ROW -->
        <div class="row-grid-3">
          <!-- Main Chart: Application Trend -->
          <div class="panel col-span-2">
            <div class="panel-header">
              <div>
                <h2>Application Volume Trend</h2>
                <p>Monthly breakdown for calendar year 2026</p>
              </div>
              <div class="panel-header-actions">
                <span
                  v-if="applicationTrendChange"
                  :class="['trend-badge', applicationTrendChange.direction]"
                >
                  <i :class="['fa-solid', applicationTrendChange.direction === 'up' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down']"></i>
                  {{ applicationTrendChange.pct }}% vs last month
                </span>
                <button class="btn-secondary">View Full Analytics</button>
              </div>
            </div>
            <ApexChart type="bar" height="250" :options="chartConfigs.applicationTrend.options" :series="chartConfigs.applicationTrend.series" />
          </div>

          <!-- Pending Tasks Card -->
          <div class="panel flex-column-between">
            <div>
              <div class="panel-header">
                <h2>Urgent Pending Tasks</h2>
                <span class="count-pill">{{ actionableTasksCount }} Actionable</span>
              </div>
              <ul class="task-list">
                <li
                  v-for="task in pendingTasks"
                  :key="task.id"
                  class="task-item"
                  style="cursor: pointer;"
                  @click="goTo(task.route)"
                >
                  <div class="task-info">
                    <span :class="['dot', task.dotColor]"></span>
                    <span class="task-title">{{ task.title }}</span>
                  </div>
                  <span :class="['task-badge', task.badgeColor]">{{ task.badgeText }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- ANALYTICS DUAL ROW -->
        <div class="panel">
          <div class="panel-header">
            <h2>Damage Analytics by Cause</h2>
            <span class="subtext">
              {{ currentSeason?.season_name || 'Current Season' }}
              — {{ damageReportsTotal }} Total {{ damageReportsTotal === 1 ? 'Incident' : 'Incidents' }} Reported
            </span>
          </div>
          <ApexChart type="bar" height="210" :options="chartConfigs.damageAnalytics.options" :series="chartConfigs.damageAnalytics.series" />
        </div>

        <!-- INVENTORY & DISTRIBUTION ROW -->
            <div class="panel">
              <div class="panel-header">
                <h2>Inventory Stock Levels</h2>
                <button class="link-btn" @click="goToInventory">Restock Alert Log</button>
              </div>
              <ApexChart type="bar" height="210" :options="chartConfigs.inventoryStatus.options" :series="chartConfigs.inventoryStatus.series" />
            </div>

          <div class="row-grid-2">
            <div class="panel">
              <h2 class="panel-title-spaced">Distribution Summary</h2>
              <div class="summary-grid">
                <div v-for="item in distributionSummary" :key="item.label" class="summary-card">
                  <p class="summary-label">{{ item.label }}</p>
                  <p :class="['summary-value', item.colorClass]">
                    {{ item.value }}
                    <span v-if="item.unit" class="summary-unit">{{ item.unit }}</span>
                  </p>
                </div>
              </div>
            </div>
            <div class="panel">
              <div class="panel-header">
                <h2>Insurance Application Status</h2>
                <span class="subtext">
                  {{ currentSeason?.season_name ? `${currentSeason.season_name} — Registered vs. Applied` : 'Registered vs. Applied' }}
                </span>
              </div>
            <ApexChart type="donut" height="210" :options="chartConfigs.insuranceStatus.options" :series="chartConfigs.insuranceStatus.series" />
          </div>
        </div>

        <!-- BARANGAY PERFORMANCE & WEATHER WIDGET -->
        <div class="row-grid-3">
          <!-- Table Container -->
          <div class="panel col-span-2">
            <div class="panel-header">
              <h2>Barangay Performance Summary</h2>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Barangay</th>
                    <th>Active Farmers</th>
                    <th>Total Farms</th>
                    <th>Damage Reports</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(bg, idx) in barangayData" :key="bg.name">
                    <td class="font-bold">
                      {{ bg.name }}
                      <span v-if="idx === 0" class="rank-badge">Top</span>
                    </td>
                    <td>{{ bg.farmers }}</td>
                    <td>{{ bg.totalFarms }}</td>
                    <td>
                      <span :class="['severity-badge', bg.damageReports > 5 ? 'warning' : 'success']">
                        {{ bg.damageReports }} Incidents
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!barangayData.length">
                    <td colspan="5" class="text-center">No barangay data available.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Weather Card -->
          <div class="weather-card" :class="`is-${skyState}`">
            <div class="weather-scene" aria-hidden="true">
              <div class="sun-disc"></div>
              <svg class="cloud cloud-back" viewBox="0 0 100 40">
                <path d="M20 30 Q10 30 10 22 Q10 14 18 14 Q20 6 30 6 Q40 6 42 14 Q50 14 50 22 Q50 30 40 30 Z" />
              </svg>
              <svg class="cloud cloud-front" viewBox="0 0 100 40">
                <path d="M20 30 Q10 30 10 22 Q10 14 18 14 Q20 6 30 6 Q40 6 42 14 Q50 14 50 22 Q50 30 40 30 Z" />
              </svg>
              <div class="fog-layer" v-if="skyState === 'fog'"></div>
              <div class="rain" v-if="skyState === 'rain' || skyState === 'storm'">
                <span v-for="n in 8" :key="n" class="rain-drop" :style="{ '--i': n }"></span>
              </div>
              <div class="lightning" v-if="skyState === 'storm'"></div>
            </div>

            <div class="weather-content">
              <div class="weather-top">
                <div>
                  <span class="weather-subtitle">San Agustin Agro-Weather</span>
                  <h3 class="weather-temp">
                    <template v-if="!loading && !error">{{ weather.temp }}</template>
                    <template v-else-if="loading">--&deg;C</template>
                    <template v-else>N/A</template>
                  </h3>
                  <p class="weather-updated" v-if="!loading && !error">
                    Updated {{ formatUpdatedAt(weather.updatedAt) }}
                  </p>
                </div>
                <div class="weather-icon-box">
                  <i :class="weather.icon"></i>
                </div>
              </div>
              <p class="weather-condition">
                {{ loading ? 'Loading...' : (error ? 'Unable to load weather' : weather.condition) }}
              </p>
            </div>

            <div class="weather-stats-grid">
              <div class="weather-stat-cell">
                <i class="fa-solid fa-droplet"></i>
                <span class="stat-label">Humidity</span>
                <strong>{{ weather.humidity }}</strong>
              </div>
              <div class="weather-stat-cell">
                <i class="fa-solid fa-cloud-showers-heavy"></i>
                <span class="stat-label">Rain Chance</span>
                <strong>{{ weather.rainChance }}</strong>
              </div>
              <div class="weather-stat-cell">
                <i class="fa-solid fa-wind"></i>
                <span class="stat-label">Wind</span>
                <strong>{{ weather.wind ?? '--' }}</strong>
              </div>
            </div>

            <button v-if="error" class="weather-retry-btn" @click="fetchWeather">Retry</button>
          </div>
        </div>

        <!-- ACTIVITIES & QUICK ACTIONS -->
        <div class="row-grid-3">
          <!-- Activities Feed -->
          <div class="panel col-span-2">
            <h2 class="panel-title-spaced">Recent Municipal Activity Log</h2>
            <ul class="activity-list">
              <li v-for="act in recentActivities" :key="act.id" class="activity-item">
                <span :class="['activity-dot', act.colorClass]"></span>
                <span class="activity-text" v-html="act.text"></span>
                <span class="activity-time">{{ act.time }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- MUNICIPAL FARM MAP PREVIEW -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Interactive Municipal Farm Map</h2>
              <p>Select any barangay node below to filter regional data</p>
            </div>
            <span class="gis-badge">
              GIS Module Connected
            </span>
          </div>

          <div class="map-placeholder">
            <div class="map-bg-icon">
              <i class="fa-solid fa-map-location-dot"></i>
            </div>
          <div class="map-grid">
            <button
              v-for="bgy in barangayData"
              :key="bgy.name"
              class="map-card"
              @click="openBarangayModal(bgy)"
            >
              <div class="map-card-top">
                <span class="map-card-title">{{ bgy.name }}</span>
                <span :class="['status-dot', bgy.statusBg]"></span>
              </div>
              <p class="map-card-desc">{{ bgy.farmers }} Active Farmers &middot; {{ bgy.totalArea.toFixed(1) }} ha</p>
            </button>
          </div>
          </div>

          <!-- Barangay detail modal -->
          <div v-if="selectedBarangay" class="modal-overlay" @click.self="closeBarangayModal">
            <div class="modal-panel">
              <div class="modal-header">
                <h3>{{ selectedBarangay.name }}</h3>
                <button class="modal-close" @click="closeBarangayModal">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div class="modal-body analytics-stat-grid">
                <div class="analytics-stat-card">
                  <span class="analytics-stat-label">Active Farmers</span>
                  <strong class="analytics-stat-value">{{ selectedBarangay.farmers }}</strong>
                </div>
                <div class="analytics-stat-card">
                  <span class="analytics-stat-label">Total Farms</span>
                  <strong class="analytics-stat-value">{{ selectedBarangay.totalFarms }}</strong>
                </div>
                <div class="analytics-stat-card">
                  <span class="analytics-stat-label">Total Farm Area</span>
                  <strong class="analytics-stat-value">{{ selectedBarangay.totalArea.toFixed(2) }} <small>ha</small></strong>
                </div>
                <div class="analytics-stat-card">
                  <span class="analytics-stat-label">Avg. Farm Size</span>
                  <strong class="analytics-stat-value">{{ selectedBarangay.avgFarmSize.toFixed(2) }} <small>ha</small></strong>
                </div>
                <div class="analytics-stat-card">
                  <span class="analytics-stat-label">Damage Reports</span>
                  <strong class="analytics-stat-value">{{ selectedBarangay.damageReports }}</strong>
                </div>
                <div class="analytics-stat-card">
                  <span class="analytics-stat-label">Claim Amount</span>
                  <strong class="analytics-stat-value">&#8369;{{ Number(selectedBarangay.claimAmount).toLocaleString() }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import ApexChart from 'vue3-apexcharts'
import { useRouter } from 'vue-router'
// ...
const router = useRouter()

const goTo = (routeName) => router.push({ name: routeName })

const goToInventory = () => {
  router.push({ name: 'inventory' }) // or router.push('/inventory')
}
const LAT = 15.48
const LON = 120.60

/* ---------------- AgriSure palette ---------------- */
const palette = {
  green: '#116D3E',
  greenDark: '#0A5232',
  amber: '#D29539',
  amberDark: '#AC7A2F',
  blue: '#2E6F8E',
  red: '#C1473D',
  purple: '#6B5B95',
  teal: '#0E8A7D'
}

// Cycling palette used for distributed/categorical bar charts (damage causes,
// inventory items, etc.) so each bar reads as its own category at a glance
// instead of a wall of one color.
const categoricalColors = [
  palette.green, palette.blue, palette.amber, palette.purple, palette.teal, palette.red
]

// Shared visual defaults so every chart in this dashboard reads as one
// family — same font, same grid treatment, same tooltip chrome — instead of
// each chart carrying its own one-off styling.
const baseChartTheme = {
  fontFamily: 'DM Sans, sans-serif',
  grid: {
    borderColor: '#EAF1EC',
    strokeDashArray: 4,
    padding: { left: 8, right: 8 }
  },
  tooltip: {
    theme: 'light',
    style: { fontFamily: 'DM Sans, sans-serif', fontSize: '12px' }
  }
}

const currentUser = ref({ name: 'Christopher', role: 'MAO Officer', initials: 'CP' })

const stats = ref({
  farmers: { count: 0, change: '' },
  applications: { count: 0, pending: '' },
  claims: { count: 0, inspecting: '' },
  damage: { count: 0, critical: '' },
  inventory: { items: 0, lowStock: '' }
})

const pendingTasks = ref([])
const barangayData = ref([])
const weather = ref({
  temp: '--\u00b0C',
  condition: 'Loading...',
  humidity: '--%',
  rainChance: '--%',
  rainChanceRaw: 0,
  wind: null,
  updatedAt: null,
  icon: 'fa-solid fa-cloud-sun'
})

const loading = ref(true)
const error = ref(false)
let refreshTimer = null

/* sky animation state, derived from the current weather code + rain chance */
const skyState = computed(() => {
  const code = weather.value?.code
  const rainChance = weather.value?.rainChanceRaw ?? 0
  if (error.value || code == null) return 'clear'
  if ([95, 96, 99].includes(code)) return 'storm'
  if ([61, 63, 65, 51, 53, 55, 80, 81, 82].includes(code)) return 'rain'
  if ([45, 48].includes(code)) return 'fog'
  if ([3].includes(code)) return rainChance >= 70 ? 'rain' : 'overcast'
  return 'clear' // 0, 1, 2
})

const distributionSummary = ref([])
const recentActivities = ref([])

/* ---------------- Derived analytics state ---------------- */
const applicationTrendChange = ref(null) // { direction: 'up' | 'down', pct: number }
const insuranceApprovalRate = ref(null)
const claimsApprovalRate = ref(null)
const averageClaimAmount = ref(null)
const damageRatePer100Farmers = ref(null)
const currentSeason = ref(null)
const damageReportsTotal = ref(0)
const selectedBarangay = ref(null)

const farmerAnalytics = ref({
  totalFarmers: 0,
  riceFarmers: 0,
  cornFarmers: 0,
  averageFarmSize: 0
})

const farmAnalytics = ref({
  totalFarms: 0,
  riceFarms: 0,
  cornFarms: 0,
  riceArea: 0,
  cornArea: 0,
  averageFarmArea: 0
})

const farmReport = ref({
  summary: {
    total_farms: 0,
    rice_farms: 0,
    corn_farms: 0,
    total_rice_area: 0,
    total_corn_area: 0,
    average_farm_area: 0
  },
  crop_distribution: [],
  crop_area_distribution: [],
  farms_per_barangay: [],
  largest_agricultural_barangays: []
})

// Area-mix percentages
const riceAreaPct = computed(() => {
  const total = farmAnalytics.value.riceArea + farmAnalytics.value.cornArea
  return total ? Math.round((farmAnalytics.value.riceArea / total) * 100) : 0
})
const cornAreaPct = computed(() => {
  const total = farmAnalytics.value.riceArea + farmAnalytics.value.cornArea
  return total ? Math.round((farmAnalytics.value.cornArea / total) * 100) : 0
})
const actionableTasksCount = computed(() =>
  pendingTasks.value.filter(t => Number(t.badgeText) > 0).length
)

const chartConfigs = reactive({
  applicationTrend: {
    series: [{ name: 'Applications', data: [] }],
    options: {
      chart: {
        toolbar: { show: false },
        fontFamily: baseChartTheme.fontFamily,
        animations: { easing: 'easeinout', speed: 400 },
        dropShadow: { enabled: true, top: 3, left: 0, blur: 4, color: palette.green, opacity: 0.15 }
      },
      colors: [palette.green],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.35,
          gradientToColors: [palette.greenDark],
          opacityFrom: 0.95,
          opacityTo: 0.75,
          stops: [0, 100]
        }
      },
      plotOptions: {
        bar: { borderRadius: 8, borderRadiusApplication: 'end', columnWidth: '42%' }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        labels: { style: { colors: '#5c6b64', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: { labels: { style: { colors: '#5c6b64', fontSize: '11px' } } },
      grid: baseChartTheme.grid,
      tooltip: baseChartTheme.tooltip
    }
  },
  damageAnalytics: {
    series: [{ name: 'Incidents', data: [] }],
    options: {
      chart: { toolbar: { show: false }, fontFamily: baseChartTheme.fontFamily },
      colors: categoricalColors,
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          borderRadiusApplication: 'end',
          distributed: true,
          barHeight: '65%'
        }
      },
      legend: { show: false },
      dataLabels: {
        enabled: true,
        style: { colors: ['#0F212F'], fontSize: '11px', fontWeight: 600 },
        formatter: (val, opts) => {
          const total = opts.w.globals.series[opts.seriesIndex].reduce((a, b) => a + b, 0)
          const pct = total ? Math.round((val / total) * 100) : 0
          return `${val} (${pct}%)`
        }
      },
      xaxis: {
        categories: [],
        labels: { style: { colors: '#5c6b64', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      grid: baseChartTheme.grid,
      tooltip: baseChartTheme.tooltip
    }
  },
  insuranceStatus: {
    series: [],
    options: {
      chart: { fontFamily: baseChartTheme.fontFamily },
      labels: [],
      colors: [palette.green, palette.amber, palette.blue, palette.purple, palette.red],
      fill: {
        type: 'gradient',
        gradient: { shade: 'light', type: 'diagonal1', shadeIntensity: 0.25, opacityFrom: 1, opacityTo: 0.85, stops: [0, 100] }
      },
      stroke: { width: 2, colors: ['#FFFFFF'] },
      legend: {
        position: 'bottom',
        labels: { colors: '#5c6b64' },
        fontSize: '12px',
        markers: { size: 6, shape: 'circle', offsetX: -2 },
        itemMargin: { horizontal: 8, vertical: 4 }
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: '11px', fontWeight: 700 },
        dropShadow: { enabled: false },
        formatter: (val) => `${Math.round(val)}%`
      },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              value: { fontSize: '20px', fontWeight: 700, color: '#0F212F' },
              total: {
                show: true,
                label: 'Total',
                color: '#5c6b64',
                fontSize: '12px',
                formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0)
              }
            }
          }
        }
      },
      tooltip: baseChartTheme.tooltip
    }
  },
  inventoryStatus: {
    series: [{ name: 'Stock', data: [] }],
    options: {
      chart: { toolbar: { show: false }, fontFamily: baseChartTheme.fontFamily },
      colors: categoricalColors,
      plotOptions: {
        bar: { horizontal: true, borderRadius: 6, borderRadiusApplication: 'end', distributed: true, barHeight: '65%' }
      },
      legend: { show: false },
      dataLabels: {
        enabled: true,
        style: { colors: ['#0F212F'], fontSize: '11px', fontWeight: 600 }
      },
      xaxis: {
        categories: [],
        max: 100,
        labels: { style: { colors: '#5c6b64', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      grid: baseChartTheme.grid,
      tooltip: baseChartTheme.tooltip
    }
  },
  farmerBarangay: {
    series: [{
      name: 'Farmers',
      data: []
    }],
    options: {
      chart: {
        toolbar: { show: false },
        fontFamily: baseChartTheme.fontFamily
      },
      colors: [palette.green],
      fill: {
        type: 'gradient',
        gradient: { shade: 'light', type: 'horizontal', shadeIntensity: 0.3, gradientToColors: [palette.teal], opacityFrom: 0.95, opacityTo: 0.8, stops: [0, 100] }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          borderRadiusApplication: 'end',
          barHeight: '55%'
        }
      },
      dataLabels: {
        enabled: true,
        style: { colors: ['#0F212F'], fontSize: '11px', fontWeight: 600 },
        offsetX: 4
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: '#5c6b64',
            fontSize: '11px'
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      grid: baseChartTheme.grid,
      tooltip: baseChartTheme.tooltip
    }
  },
  cropDistribution: {
    series: [],
    options: {
      chart: {
        fontFamily: baseChartTheme.fontFamily
      },
      labels: [],
      colors: [
        palette.green,
        palette.amber,
        palette.blue,
        palette.purple,
        palette.red
      ],
      fill: {
        type: 'gradient',
        gradient: { shade: 'light', type: 'diagonal1', shadeIntensity: 0.25, opacityFrom: 1, opacityTo: 0.85, stops: [0, 100] }
      },
      stroke: { width: 2, colors: ['#FFFFFF'] },
      legend: {
        position: 'bottom',
        labels: {
          colors: '#5c6b64'
        },
        fontSize: '12px',
        markers: { size: 6, shape: 'circle', offsetX: -2 },
        itemMargin: { horizontal: 8, vertical: 4 }
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: '11px', fontWeight: 700 },
        formatter: (val) => `${Math.round(val)}%`
      },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              value: { fontSize: '20px', fontWeight: 700, color: '#0F212F' },
              total: {
                show: true,
                label: 'Total Farms',
                color: '#5c6b64',
                fontSize: '12px',
                formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0)
              }
            }
          }
        }
      },
      tooltip: baseChartTheme.tooltip
    }
  },
})

const openBarangayModal = (bgy) => {
  selectedBarangay.value = bgy
}

const closeBarangayModal = () => {
  selectedBarangay.value = null
}

const totalFarmArea = computed(() => farmAnalytics.value.riceArea + farmAnalytics.value.cornArea)

const loadDashboard = async () => {
  try {
    const seasonRes = await axios.get('/api/insurance-seasons/current')
    currentSeason.value = seasonRes.data.season
    const seasonId = currentSeason.value?.id

    const [
      overview,
      farmers,
      farms,
      insurance,
      damage,
      claims,
      distribution,
      inventory,
      executive
    ] = await Promise.all([
      axios.get('/api/reports/overview'),
      axios.get('/api/reports/farmers'),
      axios.get('/api/reports/farms'),
      axios.get('/api/reports/insurance', { params: { season_id: seasonId } }),
      axios.get('/api/reports/damage-reports', { params: { season_id: seasonId } }),
      axios.get('/api/reports/claims', { params: { season_id: seasonId } }),
      axios.get('/api/reports/distribution'),
      axios.get('/api/reports/inventory'),
      axios.get('/api/reports/executive', { params: { season_id: seasonId } })
    ])
    const ov = overview.data.summary
    const frm = farmers.data
    const ins = insurance.data
    const dmg = damage.data
    const clm = claims.data
    const dist = distribution.data
    const inv = inventory.data
    const exe = executive.data
    farmReport.value = farms.data
    const farm = farmReport.value

    farmerAnalytics.value = {
      totalFarmers: Number(frm.summary.total_farmers || 0),
      riceFarmers: Number(frm.summary.rice_farmers || 0),
      cornFarmers: Number(frm.summary.corn_farmers || 0),
      averageFarmSize: Number(frm.summary.average_farm_size || 0)
    }

    if (frm.top_barangays?.length) {
      chartConfigs.farmerBarangay.series = [{
        name: 'Farmers',
        data: frm.top_barangays.map(i => Number(i.total))
      }]

      chartConfigs.farmerBarangay.options = {
        ...chartConfigs.farmerBarangay.options,
        xaxis: {
          ...chartConfigs.farmerBarangay.options.xaxis,
          categories: frm.top_barangays.map(i => i.name)
        }
      }
    } else {
      chartConfigs.farmerBarangay.series = [{ name: 'Farmers', data: [] }]
      chartConfigs.farmerBarangay.options = {
        ...chartConfigs.farmerBarangay.options,
        xaxis: {
          ...chartConfigs.farmerBarangay.options.xaxis,
          categories: []
        }
      }
    }

    farmAnalytics.value = {
      totalFarms: Number(farm.summary.total_farms || 0),
      riceFarms: Number(farm.summary.rice_farms || 0),
      cornFarms: Number(farm.summary.corn_farms || 0),
      riceArea: Number(farm.summary.total_rice_area || 0),
      cornArea: Number(farm.summary.total_corn_area || 0),
      averageFarmArea: Number(farm.summary.average_farm_area || 0)
    }

    stats.value = {
      farmers: {
        count: ov.total_farmers,
        change: `${ov.total_farms} Farms`
      },
      applications: {
        count: ins.summary.total_applications,  
        pending: `${ins.summary.submitted_to_mao} Pending`
      },
      claims: {
        count: clm.summary.total_claims, 
        inspecting: `\u20b1${Number(clm.summary.total_claim_amount || 0).toLocaleString()}`
      },
      damage: {
        count: dmg.summary.total_damage_reports,
        critical: `${dmg.summary.validated_by_mao} Validated`
      },
      inventory: {
        items: ov.inventory_supplies,
        lowStock: `${inv.summary.low_stock_items} Low Stock`
      }
    }

    /* ---- Application trend + month-over-month change ---- */
    const monthlyTotals = ins.monthly_applications.map(i => i.total)
    chartConfigs.applicationTrend.series = [{
      name: 'Applications',
      data: monthlyTotals
    }]
    chartConfigs.applicationTrend.options.xaxis.categories = ins.monthly_applications.map(i => `Month ${i.month}`)

    if (monthlyTotals.length >= 2) {
      const last = monthlyTotals[monthlyTotals.length - 1]
      const prev = monthlyTotals[monthlyTotals.length - 2]
      if (prev > 0) {
        const pct = Math.round(((last - prev) / prev) * 100)
        applicationTrendChange.value = { direction: pct >= 0 ? 'up' : 'down', pct: Math.abs(pct) }
      } else if (last > 0) {
        applicationTrendChange.value = { direction: 'up', pct: 100 }
      } else {
        applicationTrendChange.value = null
      }
    } else {
      applicationTrendChange.value = null
    }

    /* ---- Damage causes, with % of total baked into the chart labels ---- */
    damageReportsTotal.value = Number(dmg.summary.total_damage_reports || 0)

    chartConfigs.damageAnalytics.series = [{
      name: 'Incidents',
      data: dmg.damage_causes.map(i => i.total)
    }]

    chartConfigs.damageAnalytics.options = {
      ...chartConfigs.damageAnalytics.options,
      xaxis: {
        ...chartConfigs.damageAnalytics.options.xaxis,
        categories: dmg.damage_causes.map(i => i.damage_cause)
      }
    }

    /* ---- Insurance status + approval rate ---- */
    const notApplied = Math.max(farmAnalytics.value.totalFarms - stats.value.applications.count, 0)

    chartConfigs.insuranceStatus.series = [stats.value.applications.count, notApplied]

    chartConfigs.insuranceStatus.options = {
      ...chartConfigs.insuranceStatus.options,
      labels: ['Applied for Insurance', 'Not Applied'],
      colors: [palette.green, palette.red],
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              value: { fontSize: '20px', fontWeight: 700, color: '#0F212F' },
              total: {
                show: true,
                label: 'Total Farms',
                color: '#5c6b64',
                fontSize: '12px',
                formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0)
              }
            }
          }
        }
      }
    }  

    // The controller's insurance status values are:
    // submitted_to_mao, approved_for_pcic, submitted_to_pcic, insured, rejected.
    // "insured" is the true terminal-approved state, not a status literally named "approved".
    insuranceApprovalRate.value = ins.summary.total_applications
      ? Math.round((Number(ins.summary.insured || 0) / ins.summary.total_applications) * 100)
      : null

    /* ---- Claims approval rate + average payout,   the claims report's own summary ---- */
    claimsApprovalRate.value = clm.summary.total_claims
      ? Math.round((Number(clm.summary.claimed || 0) / clm.summary.total_claims) * 100)
      : null
    averageClaimAmount.value = Number(clm.summary.average_claim_amount || 0)

    /* ---- Damage rate normalized per 100 farmers, for cross-barangay comparability ---- */
    damageRatePer100Farmers.value = ov.total_farmers
      ? Math.round((ov.damage_reports / ov.total_farmers) * 100 * 10) / 10
      : null

    chartConfigs.inventoryStatus.series = [{
      name: 'Quantity',
      data: inv.current_inventory.map(i => i.quantity)
    }]
    chartConfigs.inventoryStatus.options.xaxis.categories = inv.current_inventory.map(i => i.supply_name)

    /* ---- Barangay table: merge farmer counts, farm/area data, and the executive
       report's own top_damage_barangays / top_claim_barangays — these are real
       per-barangay damage counts and claim amounts, not estimates. ---- */

const farmsByBarangay = new Map(
  (farm.farms_per_barangay || []).map(b => [b.name, b])
)
const damageByBarangay = new Map(
  (exe.top_damage_barangays || []).map(b => [b.name, Number(b.total || 0)])
)
const claimsByBarangay = new Map(
  (exe.top_claim_barangays || []).map(b => [b.name, Number(b.amount || 0)])
)

barangayData.value = exe.top_barangays_by_farmers
  .map(i => {
    const farmInfo = farmsByBarangay.get(i.name) || {}
    const totalFarms = Number(farmInfo.total_farms || 0)
    const totalArea = Number(farmInfo.total_area || 0)
    return {
      name: i.name,
      farmers: i.total,
      totalFarms,
      totalArea,
      avgFarmSize: totalFarms ? totalArea / totalFarms : 0,
      damageReports: damageByBarangay.get(i.name) ?? 0,
      claimAmount: claimsByBarangay.get(i.name) ?? 0,
      statusBg: 'status-green'
    }
  })
  .sort((a, b) => b.farmers - a.farmers)

    /* ---- Crop distribution donut ---- */
    if (farm.crop_distribution?.length) {
      chartConfigs.cropDistribution.series = [
      farmerAnalytics.value.riceFarmers,
      farmerAnalytics.value.cornFarmers
     ]

      chartConfigs.cropDistribution.options = {
        ...chartConfigs.cropDistribution.options,
        labels: ['Rice', 'Corn'],
        plotOptions: {
          pie: {
            donut: {
              size: '68%',
              labels: {
                show: true,
                value: { fontSize: '20px', fontWeight: 700, color: '#0F212F' },
                total: {
                  show: true,
                  label: 'Total Farmers',
                  color: '#5c6b64',
                  fontSize: '12px',
                  formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0)
                }
              }
            }
          }
        }
      }
    }
    distributionSummary.value = [
      { label: 'Distribution Events', value: dist.summary.distribution_events, colorClass: 'text-green' },
      { label: 'Beneficiaries', value: dist.summary.beneficiary_farmers, colorClass: 'text-dark' },
      { label: 'Barangays Served', value: dist.summary.barangays_served, colorClass: 'text-amber' },
      { label: 'Items Distributed', value: dist.summary.distributed_items, unit: 'units', colorClass: 'text-dark' }
    ]

    pendingTasks.value = [
      {
        id: 1,
        title: 'Farmer Verification Pending',
        badgeText: /* still needs a data source — see below */ 0,
        dotColor: 'dot-amber',
        badgeColor: 'badge-amber',
        route: 'farmer-verification'
      },
      {
        id: 2,
        title: 'Insurance Application Pending',
        badgeText: ins.summary.submitted_to_mao,
        dotColor: 'dot-amber',
        badgeColor: 'badge-amber',
        route: 'insurance-applications'
      },
      {
        id: 3,
        title: 'Validate Damage Report Pending',
        badgeText: dmg.summary.submitted_to_mao,
        dotColor: 'dot-red',
        badgeColor: 'badge-red',
        route: 'damage-reports'
      },
      {
        id: 4,
        title: 'Inventory Low Stock Supplies',
        badgeText: inv.summary.low_stock_items,
        dotColor: 'dot-red',
        badgeColor: 'badge-red',
        route: 'inventory'
      },
      {
        id: 5,
        title: 'Claims Ready',
        badgeText: clm.summary.ready_for_claiming,
        dotColor: 'dot-green',
        badgeColor: 'badge-green',
        route: 'mao-claims'
      }
    ]

    recentActivities.value = [
      { id: 1, colorClass: 'dot-green', text: `${ov.insurance_applications} insurance applications recorded.`, time: 'Today' },
      { id: 2, colorClass: 'dot-red', text: `${ov.damage_reports} damage reports submitted.`, time: 'Today' },
      { id: 3, colorClass: 'dot-amber', text: `${inv.summary.low_stock_items} supplies are low on stock.`, time: 'Today' },
      { id: 4, colorClass: 'dot-blue', text: `\u20b1${Number(exe.kpis.claims_released_amount).toLocaleString()} claims released.`, time: 'Today' }
    ]

  } catch (e) {
    console.error(e)
  }
}

function mapWeatherCode(code) {
  const map = {
    0:  { condition: 'Clear Sky',        icon: 'fa-solid fa-sun' },
    1:  { condition: 'Mainly Clear',     icon: 'fa-solid fa-cloud-sun' },
    2:  { condition: 'Partly Cloudy',    icon: 'fa-solid fa-cloud-sun' },
    3:  { condition: 'Overcast',         icon: 'fa-solid fa-cloud' },
    45: { condition: 'Foggy',            icon: 'fa-solid fa-smog' },
    48: { condition: 'Foggy',            icon: 'fa-solid fa-smog' },
    51: { condition: 'Light Drizzle',    icon: 'fa-solid fa-cloud-rain' },
    53: { condition: 'Drizzle',          icon: 'fa-solid fa-cloud-rain' },
    55: { condition: 'Heavy Drizzle',    icon: 'fa-solid fa-cloud-rain' },
    61: { condition: 'Light Rain',       icon: 'fa-solid fa-cloud-rain' },
    63: { condition: 'Rain',             icon: 'fa-solid fa-cloud-showers-heavy' },
    65: { condition: 'Heavy Rain',       icon: 'fa-solid fa-cloud-showers-heavy' },
    80: { condition: 'Rain Showers',     icon: 'fa-solid fa-cloud-showers-heavy' },
    81: { condition: 'Rain Showers',     icon: 'fa-solid fa-cloud-showers-heavy' },
    82: { condition: 'Violent Showers',  icon: 'fa-solid fa-cloud-showers-heavy' },
    95: { condition: 'Thunderstorm',     icon: 'fa-solid fa-cloud-bolt' },
    96: { condition: 'Thunderstorm',     icon: 'fa-solid fa-cloud-bolt' },
    99: { condition: 'Severe Storm',     icon: 'fa-solid fa-cloud-bolt' },
  }
  return map[code] || { condition: 'Partly Cloudy', icon: 'fa-solid fa-cloud-sun' }
}

function formatUpdatedAt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}

async function fetchWeather() {
  loading.value = true
  error.value = false

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m` +
      `&timezone=Asia%2FManila`

    const res = await fetch(url)
    if (!res.ok) throw new Error('Weather request failed')

    const data = await res.json()
    const c = data.current

    const { condition, icon } = mapWeatherCode(c.weather_code)

    weather.value = {
      temp: `${Math.round(c.temperature_2m)}\u00b0C`,
      condition,
      humidity: `${Math.round(c.relative_humidity_2m)}%`,
      rainChance: `${Math.round(c.precipitation_probability ?? 0)}%`,
      rainChanceRaw: c.precipitation_probability ?? 0,
      wind: c.wind_speed_10m != null ? `${Math.round(c.wind_speed_10m)} km/h` : null,
      updatedAt: c.time,
      icon,
      code: c.weather_code
    }
  } catch (err) {
    console.error('Failed to fetch weather:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchWeather()
  // Refresh every 15 minutes
  refreshTimer = setInterval(fetchWeather, 15 * 60 * 1000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

onMounted(loadDashboard)
</script>
<style scoped>

* { box-sizing: border-box; }

/* METRICS GRID */
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

.icon-badge.green  { background: rgba(17, 109, 62, 0.12); color: #116D3E; }
.icon-badge.blue   { background: rgba(46, 111, 142, 0.12); color: #2E6F8E; }
.icon-badge.amber  { background: rgba(210, 149, 57, 0.16); color: #AC7A2F; }
.icon-badge.red    { background: rgba(193, 71, 61, 0.12); color: #C1473D; }
.icon-badge.purple { background: rgba(107, 91, 149, 0.12); color: #6B5B95; }

.card-value { font-size: 1.6rem; font-weight: 700; color: #0F212F; margin-bottom: 0.6rem; }

.unit-text { font-size: 0.85rem; color: #5c6b64; }

.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 0.7rem;
  border-top: 1px solid #F1F6F2;
}
.card-footer.green { border-top-color: rgba(17, 109, 62, 0.15); }
.card-footer.amber { border-top-color: rgba(210, 149, 57, 0.2); }
.card-footer.red   { border-top-color: rgba(193, 71, 61, 0.15); }

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
.status-pill.green { background: rgba(17, 109, 62, 0.1); color: #116D3E; }
.status-pill.amber { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.status-pill.red   { background: rgba(193, 71, 61, 0.1); color: #C1473D; }

.trend-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}
.trend-badge.up      { color: #116D3E; }
.trend-badge.down    { color: #C1473D; }
.trend-badge.neutral { color: #5c6b64; }
.trend-badge i { font-size: 0.68rem; }

/* PANEL GRIDS */
.row-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.row-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.col-span-2 { grid-column: span 2; }

/* When a row-grid-3 has only one child (the col-span-2 panel with no
   sibling — e.g. the activity log row after Quick Actions was removed),
   let it take the full row instead of leaving a dead 1/3 gap. */
.row-grid-3 > .col-span-2:only-child { grid-column: 1 / -1; }

.panel {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
}

.flex-column-between { display: flex; flex-direction: column; justify-content: space-between; }

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 12px;
}

.panel-header h2 { font-size: 1rem; font-weight: 700; color: #0F212F; }
.panel-header p, .subtext { font-size: 0.76rem; color: #5c6b64; margin-top: 2px; }

.panel-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.panel-title-spaced { font-size: 1rem; font-weight: 700; color: #0F212F; margin-bottom: 1rem; }

.count-pill {
  font-size: 0.7rem;
  font-weight: 700;
  color: #AC7A2F;
  background: rgba(210, 149, 57, 0.14);
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

/* ANALYTICS SPLIT ROW — new: stat grid + donut chart side by side,
   used in the merged "Farmer & Farm Analytics" panel */
.analytics-split-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.analytics-split-left { flex: 1 1 380px; min-width: 0; }
.analytics-split-right {
  flex: 0 1 280px;
  min-width: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* BUTTONS */
.btn-secondary {
  background: #F1F6F2;
  border: 1px solid #E0EAE3;
  color: #116D3E;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease;
}
.btn-secondary:hover { background: #E7F0EC; }

.link-btn {
  background: none;
  border: none;
  color: #116D3E;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}
.link-btn:hover { text-decoration: underline; }

/* TASK LIST */
.task-list { display: flex; flex-direction: column; gap: 10px; }

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 6px;
  border-bottom: 1px solid #F1F6F2;
  border-radius: 8px;
  transition: background 0.12s ease;
}
.task-item:hover { background: #F8FAF8; }
.task-item:last-child { border-bottom: none; }

.task-info { display: flex; align-items: center; gap: 8px; min-width: 0; }

.task-title {
  font-size: 0.8rem;
  color: #0F212F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green  { background: #116D3E; }
.dot-amber  { background: #D29539; }
.dot-red    { background: #C1473D; }
.dot-blue   { background: #2E6F8E; }
.dot-purple { background: #6B5B95; }

.task-badge {
  font-size: 0.66rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}
.badge-green  { background: rgba(17, 109, 62, 0.1); color: #116D3E; }
.badge-amber  { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.badge-red    { background: rgba(193, 71, 61, 0.1); color: #C1473D; }
.badge-blue   { background: rgba(46, 111, 142, 0.1); color: #2E6F8E; }
.badge-purple { background: rgba(107, 91, 149, 0.1); color: #6B5B95; }

/* SUMMARY GRID */
.summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.9rem; }

.summary-card {
  background: #F8FAF8;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 0.9rem;
}

.summary-label { font-size: 0.72rem; color: #5c6b64; margin-bottom: 4px; }
.summary-value { font-size: 1.15rem; font-weight: 700; }
.summary-unit { font-size: 0.72rem; font-weight: 500; color: #5c6b64; }
.summary-subtext { font-size: 0.72rem; color: #5c6b64; margin-top: 4px; }

.text-green  { color: #116D3E; }
.text-amber  { color: #AC7A2F; }
.text-blue   { color: #2E6F8E; }
.text-purple { color: #6B5B95; }
.text-dark   { color: #0F212F; }

.stat-percent { font-size: 0.7rem; font-weight: 700; margin-left: 4px; }

/* TABLE */
.table-responsive { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }

.data-table thead th {
  text-align: left;
  font-size: 0.72rem;
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
.text-center { text-align: center; color: #5c6b64; }

.rank-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background: rgba(210, 149, 57, 0.16);
  color: #AC7A2F;
}

.severity-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}
.severity-badge.warning { background: rgba(193, 71, 61, 0.1); color: #C1473D; }
.severity-badge.success { background: rgba(17, 109, 62, 0.1); color: #116D3E; }

/* ANALYTICS STAT GRID (also reused inside the barangay modal) */
.analytics-stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

.analytics-stat-card {
  padding: 16px;
  border: 1px solid #EAF1EC;
  border-radius: 10px;
  background: #FAFCFB;
}

.analytics-stat-label { display: block; font-size: 11px; color: #6B7972; margin-bottom: 6px; }

.analytics-stat-value { display: block; font-size: 24px; font-weight: 700; color: #116D3E; }
.analytics-stat-value small { font-size: 12px; font-weight: 500; color: #6B7972; }

/* WEATHER CARD */
.weather-card {
  position: relative;
  isolation: isolate;
  background: linear-gradient(150deg, #116D3E 0%, #0A5232 55%, #0F212F 100%);
  border-radius: 16px;
  padding: 1.3rem;
  color: #FFFFFF;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.weather-scene { position: absolute; inset: 0; overflow: hidden; z-index: 0; }

.sun-disc {
  position: absolute;
  top: -18px; right: -18px;
  width: 90px; height: 90px;
  border-radius: 50%;
  background: radial-gradient(circle, #D29539 0%, rgba(210, 149, 57, 0.3) 60%, transparent 72%);
  animation: sun-pulse 4s ease-in-out infinite;
  transition: opacity 0.4s ease;
}

.is-rain .sun-disc, .is-storm .sun-disc, .is-overcast .sun-disc, .is-fog .sun-disc { opacity: 0.15; }

.cloud { position: absolute; fill: rgba(255, 255, 255, 0.14); }
.cloud-back { top: 14px; left: -40px; width: 100px; animation: drift 22s linear infinite; }
.cloud-front { top: 34px; left: -60px; width: 130px; fill: rgba(255, 255, 255, 0.22); animation: drift 15s linear infinite; }

.is-overcast .cloud, .is-rain .cloud, .is-storm .cloud { fill: rgba(255, 255, 255, 0.3); }

@keyframes drift { from { transform: translateX(0); } to { transform: translateX(340px); } }
@keyframes sun-pulse { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.08); opacity: 1; } }

.fog-layer {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.12) 50%, transparent);
  animation: fog-drift 8s ease-in-out infinite;
}
@keyframes fog-drift { 0%, 100% { opacity: 0.5; transform: translateX(0); } 50% { opacity: 0.9; transform: translateX(12px); } }

.rain { position: absolute; inset: 0; }
.rain-drop {
  position: absolute; top: -10%;
  left: calc(var(--i) * 12.5%);
  width: 2px; height: 14px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 2px;
  animation: fall 1.1s linear infinite;
  animation-delay: calc(var(--i) * 0.13s);
}
@keyframes fall { from { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } to { transform: translateY(160px); opacity: 0; } }

.lightning {
  position: absolute; inset: 0;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  animation: flash 5s ease-in-out infinite;
}
@keyframes flash { 0%, 92%, 100% { opacity: 0; } 93% { opacity: 0.7; } 94% { opacity: 0; } 95% { opacity: 0.4; } 96% { opacity: 0; } }

.weather-content { position: relative; z-index: 1; }
.weather-top { display: flex; align-items: flex-start; justify-content: space-between; }
.weather-subtitle { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.6px; color: rgba(255, 255, 255, 0.65); }
.weather-temp { font-size: 1.9rem; font-weight: 700; margin-top: 4px; }
.weather-updated { font-size: 0.7rem; color: rgba(255, 255, 255, 0.55); margin: 2px 0 0; }

.weather-icon-box {
  width: 42px; height: 42px; border-radius: 12px;
  background: rgba(210, 149, 57, 0.22);
  color: #D29539;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem;
}

.weather-condition { font-size: 0.8rem; color: rgba(255, 255, 255, 0.75); margin-top: 6px; }

.weather-stats-grid {
  position: relative; z-index: 1;
  margin-top: 1rem; padding-top: 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.weather-stat-cell { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; padding: 4px 2px; }
.weather-stat-cell i { color: #D29539; font-size: 0.95rem; }
.stat-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.4px; color: rgba(255, 255, 255, 0.6); }
.weather-stat-cell strong { font-size: 0.85rem; color: #FFFFFF; }

.weather-retry-btn {
  position: relative; z-index: 1;
  margin-top: 0.9rem;
  background: #D29539;
  color: #0F212F;
  border: none;
  border-radius: 8px;
  padding: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}
.weather-retry-btn:hover { background: #AC7A2F; }

@media (prefers-reduced-motion: reduce) {
  .sun-disc, .cloud, .rain-drop, .fog-layer, .lightning { animation: none; }
}

/* ACTIVITY LIST */
.activity-list { display: flex; flex-direction: column; gap: 12px; }
.activity-item { display: flex; align-items: center; gap: 10px; }
.activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.activity-text { flex: 1; font-size: 0.8rem; color: #3f4a45; line-height: 1.4; }
.activity-time { font-size: 0.72rem; color: #8a9791; white-space: nowrap; flex-shrink: 0; }

/* GIS / MAP */
.gis-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #116D3E;
  background: rgba(17, 109, 62, 0.1);
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.map-placeholder {
  position: relative;
  background: #F8FAF8;
  border: 1px dashed #D7E2D8;
  border-radius: 14px;
  padding: 1.5rem;
  overflow: hidden;
}

.map-bg-icon { position: absolute; right: 1rem; top: 1rem; font-size: 3rem; color: #116D3E; opacity: 0.06; }

.map-grid { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; }

.map-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 0.85rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.map-card:hover { border-color: #116D3E; transform: translateY(-2px); }

.map-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.map-card-title { font-size: 0.82rem; font-weight: 700; color: #0F212F; }

.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-green { background: #116D3E; }
.status-amber { background: #D29539; }
.status-red   { background: #C1473D; }

.map-card-desc { font-size: 0.72rem; color: #5c6b64; }

/* BARANGAY DETAIL MODAL — new */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(15, 33, 47, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-panel {
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
  background: #FFFFFF;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(15, 33, 47, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 1.25rem 1.4rem;
  border-bottom: 1px solid #F1F6F2;
  flex-shrink: 0;
}

.modal-header h3 { font-size: 1.05rem; font-weight: 700; color: #0F212F; }

.modal-close {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: #F1F6F2;
  color: #5c6b64;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.modal-close:hover { background: #E7F0EC; color: #0F212F; }

.modal-body { padding: 1.4rem; }

/* RESPONSIVE */
@media (max-width: 1200px) {
  .metrics-grid { grid-template-columns: repeat(3, 1fr); }
  .row-grid-3 { grid-template-columns: 1fr; }
  .col-span-2 { grid-column: span 1; }
  .row-grid-3 > .col-span-2:only-child { grid-column: 1 / -1; }
  .map-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 900px) {
  .analytics-split-row { flex-direction: column; align-items: stretch; }
  .analytics-split-right { flex: none; width: 100%; }
}

@media (max-width: 768px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .row-grid-2 { grid-template-columns: 1fr; }
  .map-grid { grid-template-columns: 1fr; }
  .panel-header { flex-direction: column; align-items: stretch; }
  .panel-header-actions { justify-content: space-between; }
  .analytics-stat-grid { grid-template-columns: 1fr; }
}
</style>