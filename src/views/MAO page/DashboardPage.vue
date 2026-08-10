<template>
  <div class="dashboard-layout">

    <!-- MAIN CONTENT AREA -->
    <div class="main-wrapper">

      <!-- TOP BAR / HEADER -->
      <header class="top-header">
        <div class="header-title-group">
          <h1>Dashboard Overview</h1>
          <p>San Guillermo Municipal Agriculture Office &middot; AgriSure</p>
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
      <main class="dashboard-body">

        <!-- METRICS ROW (5 Cards) -->
        <div class="metrics-grid">
          <!-- Card 1: Farmers -->
          <div class="metric-card">
            <div class="card-header">
              <span class="card-label">Registered Farmers</span>
              <div class="icon-badge green">
                <i class="fa-solid fa-users"></i>
              </div>
            </div>
            <h3 class="card-value">{{ stats.farmers.count }}</h3>
            <div class="card-footer green">
              <span class="status-pill green">
                <i class="fa-solid fa-arrow-trend-up"></i> {{ stats.farmers.change }}
              </span>
            </div>
          </div>

          <!-- Card 2: Applications -->
          <div class="metric-card">
            <div class="card-header">
              <span class="card-label">Applications</span>
              <div class="icon-badge blue">
                <i class="fa-solid fa-file-signature"></i>
              </div>
            </div>
            <h3 class="card-value">{{ stats.applications.count }}</h3>
            <div class="card-footer amber">
              <span class="status-pill amber">
                <i class="fa-solid fa-clock"></i> {{ stats.applications.pending }}
              </span>
            </div>
          </div>

          <!-- Card 3: Claims -->
          <div class="metric-card">
            <div class="card-header">
              <span class="card-label">Active Claims</span>
              <div class="icon-badge amber">
                <i class="fa-solid fa-hand-holding-dollar"></i>
              </div>
            </div>
            <h3 class="card-value">{{ stats.claims.count }}</h3>
            <div class="card-footer amber">
              <span class="status-pill amber">
                <i class="fa-solid fa-magnifying-glass"></i> {{ stats.claims.inspecting }}
              </span>
            </div>
          </div>

          <!-- Card 4: Damage Reports -->
          <div class="metric-card">
            <div class="card-header">
              <span class="card-label">Damage Reports</span>
              <div class="icon-badge red">
                <i class="fa-solid fa-triangle-exclamation"></i>
              </div>
            </div>
            <h3 class="card-value">{{ stats.damage.count }}</h3>
            <div class="card-footer red">
              <span class="status-pill red">
                <i class="fa-solid fa-circle-exclamation"></i> {{ stats.damage.critical }}
              </span>
            </div>
          </div>

          <!-- Card 5: Inventory -->
          <div class="metric-card">
            <div class="card-header">
              <span class="card-label">Inventory</span>
              <div class="icon-badge purple">
                <i class="fa-solid fa-boxes-stacked"></i>
              </div>
            </div>
            <h3 class="card-value">
              {{ stats.inventory.items }} <span class="unit-text">Items</span>
            </h3>
            <div class="card-footer red">
              <span class="status-pill red">
                <i class="fa-solid fa-box-open"></i> {{ stats.inventory.lowStock }}
              </span>
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
              <button class="btn-secondary">View Full Analytics</button>
            </div>
            <ApexChart type="bar" height="250" :options="chartConfigs.applicationTrend.options" :series="chartConfigs.applicationTrend.series" />
          </div>

          <!-- Pending Tasks Card -->
          <div class="panel flex-column-between">
            <div>
              <div class="panel-header">
                <h2>Urgent Pending Tasks</h2>
                <span class="count-pill">5 Actionable</span>
              </div>
              <ul class="task-list">
                <li v-for="task in pendingTasks" :key="task.id" class="task-item">
                  <div class="task-info">
                    <span :class="['dot', task.dotColor]"></span>
                    <span class="task-title">{{ task.title }}</span>
                  </div>
                  <span :class="['task-badge', task.badgeColor]">{{ task.badgeText }}</span>
                </li>
              </ul>
            </div>
            <button class="btn-block">Manage Task Queue</button>
          </div>
        </div>

        <!-- ANALYTICS DUAL ROW -->
        <div class="row-grid-2">
          <div class="panel">
            <div class="panel-header">
              <h2>Damage Analytics by Cause</h2>
              <span class="subtext">Total Incidents Reported</span>
            </div>
            <ApexChart type="bar" height="210" :options="chartConfigs.damageAnalytics.options" :series="chartConfigs.damageAnalytics.series" />
          </div>

          <div class="panel">
            <div class="panel-header">
              <h2>Insurance Application Status</h2>
              <span class="subtext">Current Season Approval Rate</span>
            </div>
            <ApexChart type="donut" height="210" :options="chartConfigs.insuranceStatus.options" :series="chartConfigs.insuranceStatus.series" />
          </div>
        </div>

        <!-- INVENTORY & DISTRIBUTION ROW -->
        <div class="row-grid-2">
          <div class="panel">
            <div class="panel-header">
              <h2>Inventory Stock Levels</h2>
              <button class="link-btn">Restock Alert Log</button>
            </div>
            <ApexChart type="bar" height="210" :options="chartConfigs.inventoryStatus.options" :series="chartConfigs.inventoryStatus.series" />
          </div>

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
        </div>

        <!-- BARANGAY PERFORMANCE & WEATHER WIDGET -->
        <div class="row-grid-3">
          <!-- Table Container -->
          <div class="panel col-span-2">
            <div class="panel-header">
              <h2>Barangay Performance Summary</h2>
              <button class="link-btn-muted">Export CSV</button>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Barangay</th>
                    <th>Active Farmers</th>
                    <th>Claims Filed</th>
                    <th>Damage Severity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="bg in barangayData" :key="bg.name">
                    <td class="font-bold">{{ bg.name }}</td>
                    <td>{{ bg.farmers }}</td>
                    <td>{{ bg.claims }}</td>
                    <td>
                      <span :class="['severity-badge', bg.damage > 5 ? 'warning' : 'success']">
                        {{ bg.damage }} Incidents
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Weather Card -->
          <div class="weather-card">
            <div class="weather-bg-icon">
              <i class="fa-solid fa-cloud-sun"></i>
            </div>

            <div class="weather-content">
              <div class="weather-top">
                <div>
                  <span class="weather-subtitle">San Guillermo Agro-Weather</span>
                  <h3 class="weather-temp">
                    <template v-if="!loading && !error">{{ weather.temp }}</template>
                    <template v-else-if="loading">--&deg;C</template>
                    <template v-else>N/A</template>
                  </h3>
                </div>
                <div class="weather-icon-box">
                  <i :class="weather.icon"></i>
                </div>
              </div>
              <p class="weather-condition">
                {{ loading ? 'Loading...' : (error ? 'Unable to load weather' : weather.condition) }}
              </p>
            </div>

            <div class="weather-stats">
              <div class="weather-stat-row">
                <span><i class="fa-solid fa-droplet"></i> Humidity</span>
                <strong>{{ weather.humidity }}</strong>
              </div>
              <div class="weather-stat-row">
                <span><i class="fa-solid fa-cloud-showers-heavy"></i> Rain Probability</span>
                <strong>{{ weather.rainChance }}</strong>
              </div>
            </div>

            <button
              v-if="error"
              class="weather-retry-btn"
              @click="fetchWeather"
            >
              Retry
            </button>
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

          <!-- Quick Actions Grid -->
          <div class="panel">
            <h2 class="panel-title-spaced">Quick Action Shortcuts</h2>
            <div class="actions-grid">
              <button class="btn-primary col-span-full">
                <i class="fa-solid fa-user-check"></i> Verify New Farmer
              </button>
              <button class="btn-outline">
                <i class="fa-solid fa-truck-ramp-box icon-green"></i> Schedule Distribution
              </button>
              <button class="btn-outline">
                <i class="fa-solid fa-box icon-green"></i> Add Supplies
              </button>
            </div>
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
              >
                <div class="map-card-top">
                  <span class="map-card-title">{{ bgy.name }}</span>
                  <span :class="['status-dot', bgy.statusBg]"></span>
                </div>
                <p class="map-card-desc">{{ bgy.farmers }} Active Farmers</p>
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import ApexChart from 'vue3-apexcharts'

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
  purple: '#6B5B95'
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
  icon: 'fa-solid fa-cloud-sun'
})

const loading = ref(true)
const error = ref(false)
let refreshTimer = null

const distributionSummary = ref([])
const recentActivities = ref([])

const chartConfigs = reactive({
  applicationTrend: {
    series: [{ name: 'Applications', data: [] }],
    options: {
      chart: { toolbar: { show: false }, fontFamily: 'DM Sans, sans-serif' },
      colors: [palette.green],
      plotOptions: { bar: { borderRadius: 6, columnWidth: '40%' } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        labels: { style: { colors: '#5c6b64', fontSize: '11px' } }
      },
      yaxis: { labels: { style: { colors: '#5c6b64', fontSize: '11px' } } },
      grid: { borderColor: '#EAF1EC' }
    }
  },
  damageAnalytics: {
    series: [{ name: 'Incidents', data: [] }],
    options: {
      chart: { toolbar: { show: false }, fontFamily: 'DM Sans, sans-serif' },
      colors: [palette.red],
      plotOptions: { bar: { horizontal: true, borderRadius: 6 } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: [],
        labels: { style: { colors: '#5c6b64', fontSize: '11px' } }
      },
      grid: { borderColor: '#EAF1EC' }
    }
  },
  insuranceStatus: {
    series: [],
    options: {
      chart: { fontFamily: 'DM Sans, sans-serif' },
      labels: [],
      colors: [palette.green, palette.amber, palette.blue, palette.purple, palette.red],
      legend: { position: 'bottom', labels: { colors: '#5c6b64' }, fontSize: '12px' },
      dataLabels: { enabled: false },
      stroke: { width: 0 }
    }
  },
  inventoryStatus: {
    series: [{ name: 'Stock', data: [] }],
    options: {
      chart: { toolbar: { show: false }, fontFamily: 'DM Sans, sans-serif' },
      colors: [palette.amber],
      plotOptions: { bar: { horizontal: true, borderRadius: 6 } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: [],
        max: 100,
        labels: { style: { colors: '#5c6b64', fontSize: '11px' } }
      },
      grid: { borderColor: '#EAF1EC' }
    }
  }
})

const loadDashboard = async () => {
  try {
    const [
      overview,
      insurance,
      damage,
      distribution,
      inventory,
      executive
    ] = await Promise.all([
      axios.get('/api/reports/overview'),
      axios.get('/api/reports/insurance'),
      axios.get('/api/reports/damage-reports'),
      axios.get('/api/reports/distribution'),
      axios.get('/api/reports/inventory'),
      axios.get('/api/reports/executive')
    ])

    const ov = overview.data.summary
    const ins = insurance.data
    const dmg = damage.data
    const dist = distribution.data
    const inv = inventory.data
    const exe = executive.data

    stats.value = {
      farmers: {
        count: ov.total_farmers,
        change: `${ov.total_farms} Farms`
      },
      applications: {
        count: ov.insurance_applications,
        pending: `${ins.summary.submitted_to_mao} Pending`
      },
      claims: {
        count: ov.claims,
        inspecting: `\u20b1${Number(exe.kpis.claims_released_amount).toLocaleString()}`
      },
      damage: {
        count: ov.damage_reports,
        critical: `${dmg.summary.validated_by_mao} Validated`
      },
      inventory: {
        items: ov.inventory_supplies,
        lowStock: `${inv.summary.low_stock_items} Low Stock`
      }
    }

    chartConfigs.applicationTrend.series = [{
      name: 'Applications',
      data: ins.monthly_applications.map(i => i.total)
    }]
    chartConfigs.applicationTrend.options.xaxis.categories = ins.monthly_applications.map(i => `Month ${i.month}`)

    chartConfigs.damageAnalytics.series = [{
      name: 'Incidents',
      data: dmg.damage_causes.map(i => i.total)
    }]
    chartConfigs.damageAnalytics.options.xaxis.categories = dmg.damage_causes.map(i => i.damage_cause)

    chartConfigs.insuranceStatus.series = ins.status_distribution.map(i => i.total)
    chartConfigs.insuranceStatus.options.labels = ins.status_distribution.map(i => i.status)

    chartConfigs.inventoryStatus.series = [{
      name: 'Quantity',
      data: inv.current_inventory.map(i => i.quantity)
    }]
    chartConfigs.inventoryStatus.options.xaxis.categories = inv.current_inventory.map(i => i.supply_name)

    barangayData.value = exe.top_barangays_by_farmers.map(i => ({
      name: i.name,
      farmers: i.total,
      claims: 0,
      damage: 0,
      statusBg: 'status-green'
    }))

    distributionSummary.value = [
      { label: 'Distribution Events', value: dist.summary.distribution_events, colorClass: 'text-green' },
      { label: 'Beneficiaries', value: dist.summary.beneficiary_farmers, colorClass: 'text-dark' },
      { label: 'Barangays Served', value: dist.summary.barangays_served, colorClass: 'text-amber' },
      { label: 'Items Distributed', value: dist.summary.distributed_items, unit: 'units', colorClass: 'text-dark' }
    ]

    pendingTasks.value = [
      { id: 1, title: 'Applications Pending', badgeText: ins.summary.submitted_to_mao, dotColor: 'dot-amber', badgeColor: 'badge-amber' },
      { id: 2, title: 'Validated Damage Reports', badgeText: dmg.summary.validated_by_mao, dotColor: 'dot-red', badgeColor: 'badge-red' },
      { id: 3, title: 'Low Stock Supplies', badgeText: inv.summary.low_stock_items, dotColor: 'dot-red', badgeColor: 'badge-red' },
      { id: 4, title: 'Claims Ready', badgeText: exe.kpis.claims_processed, dotColor: 'dot-green', badgeColor: 'badge-green' }
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

async function fetchWeather() {
  loading.value = true
  error.value = false

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code` +
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
      icon
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
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');

* { box-sizing: border-box; }

.dashboard-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-family: 'DM Sans', sans-serif;
  background: #F8FAF8;
}

.main-wrapper {
  flex: 1;
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* TOP HEADER */
.top-header {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #E7F0EC;
  flex-shrink: 0;
  z-index: 20;
  padding: 14px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-group h1 {
  font-family: 'DM Serif Display', serif;
  font-size: 18px;
  font-weight: 400;
  color: #0F212F;
  letter-spacing: -0.01em;
}

.header-title-group p {
  font-size: 12px;
  color: #5c6b64;
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

.user-name {
  font-size: 12px;
  font-weight: 700;
  color: #0F212F;
  line-height: 1.2;
}

.user-role {
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* BODY */
.dashboard-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

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
  font-size: 0.85rem;
  flex-shrink: 0;
}

.icon-badge.green  { background: rgba(17, 109, 62, 0.12); color: #116D3E; }
.icon-badge.blue   { background: rgba(46, 111, 142, 0.12); color: #2E6F8E; }
.icon-badge.amber  { background: rgba(210, 149, 57, 0.16); color: #AC7A2F; }
.icon-badge.red    { background: rgba(193, 71, 61, 0.12); color: #C1473D; }
.icon-badge.purple { background: rgba(107, 91, 149, 0.12); color: #6B5B95; }

.card-value {
  font-family: 'DM Serif Display', serif;
  font-size: 1.7rem;
  font-weight: 400;
  color: #0F212F;
  margin-bottom: 0.6rem;
}

.unit-text { font-size: 0.85rem; color: #5c6b64; font-family: 'DM Sans', sans-serif; }

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-pill.green { background: rgba(17, 109, 62, 0.1); color: #116D3E; }
.status-pill.amber { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.status-pill.red   { background: rgba(193, 71, 61, 0.1); color: #C1473D; }

/* PANEL GRIDS */
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

.col-span-2 { grid-column: span 2; }

.panel {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
}

.flex-column-between {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 12px;
}

.panel-header h2 {
  font-family: 'DM Serif Display', serif;
  font-size: 1.05rem;
  font-weight: 400;
  color: #0F212F;
}

.panel-header p, .subtext {
  font-size: 0.76rem;
  color: #5c6b64;
  margin-top: 2px;
}

.panel-title-spaced {
  font-family: 'DM Serif Display', serif;
  font-size: 1.05rem;
  font-weight: 400;
  color: #0F212F;
  margin-bottom: 1rem;
}

.count-pill {
  font-size: 0.7rem;
  font-weight: 700;
  color: #AC7A2F;
  background: rgba(210, 149, 57, 0.14);
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
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

.btn-block {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  border: none;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 1rem;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.28);
}

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

.icon-green { color: #116D3E; }

.link-btn {
  background: none;
  border: none;
  color: #116D3E;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}
.link-btn:hover { text-decoration: underline; }

.link-btn-muted {
  background: none;
  border: none;
  color: #5c6b64;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}
.link-btn-muted:hover { color: #116D3E; }

/* TASK LIST */
.task-list { display: flex; flex-direction: column; gap: 10px; }

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #F1F6F2;
}

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
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.9rem;
}

.summary-card {
  background: #F8FAF8;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 0.9rem;
}

.summary-label { font-size: 0.72rem; color: #5c6b64; margin-bottom: 4px; }
.summary-value { font-size: 1.15rem; font-weight: 700; }
.summary-unit { font-size: 0.72rem; font-weight: 500; color: #5c6b64; }

.text-green  { color: #116D3E; }
.text-amber  { color: #AC7A2F; }
.text-blue   { color: #2E6F8E; }
.text-purple { color: #6B5B95; }
.text-dark   { color: #0F212F; }

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

.severity-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
}

.severity-badge.warning { background: rgba(193, 71, 61, 0.1); color: #C1473D; }
.severity-badge.success { background: rgba(17, 109, 62, 0.1); color: #116D3E; }

/* WEATHER CARD */
.weather-card {
  position: relative;
  background: linear-gradient(150deg, #116D3E 0%, #0A5232 55%, #0F212F 100%);
  border-radius: 16px;
  padding: 1.3rem;
  color: #FFFFFF;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.weather-bg-icon {
  position: absolute;
  right: -18px;
  bottom: -18px;
  font-size: 6rem;
  opacity: 0.1;
}

.weather-content { position: relative; z-index: 1; }

.weather-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.weather-subtitle {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: rgba(255,255,255,0.65);
}

.weather-temp {
  font-family: 'DM Serif Display', serif;
  font-size: 2rem;
  font-weight: 400;
  margin-top: 4px;
}

.weather-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(210, 149, 57, 0.22);
  color: #D29539;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.weather-condition {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.75);
  margin-top: 6px;
}

.weather-stats {
  position: relative;
  z-index: 1;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid rgba(255,255,255,0.14);
  padding-top: 0.9rem;
}

.weather-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.75);
}

.weather-stat-row strong { color: #FFFFFF; }

.weather-retry-btn {
  position: relative;
  z-index: 1;
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

/* ACTIVITY LIST */
.activity-list { display: flex; flex-direction: column; gap: 12px; }

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.activity-text {
  flex: 1;
  font-size: 0.8rem;
  color: #3f4a45;
  line-height: 1.4;
}

.activity-time {
  font-size: 0.72rem;
  color: #8a9791;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ACTIONS GRID */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.7rem;
}

.col-span-full { grid-column: span 2; }

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

.map-bg-icon {
  position: absolute;
  right: 1rem;
  top: 1rem;
  font-size: 3rem;
  color: #116D3E;
  opacity: 0.06;
}

.map-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
}

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

.map-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.map-card-title { font-size: 0.82rem; font-weight: 700; color: #0F212F; }

.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-green { background: #116D3E; }
.status-amber { background: #D29539; }
.status-red   { background: #C1473D; }

.map-card-desc { font-size: 0.72rem; color: #5c6b64; }

/* RESPONSIVE */
@media (max-width: 1200px) {
  .metrics-grid { grid-template-columns: repeat(3, 1fr); }
  .row-grid-3 { grid-template-columns: 1fr; }
  .col-span-2 { grid-column: span 1; }
  .map-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .row-grid-2 { grid-template-columns: 1fr; }
  .actions-grid, .col-span-full { grid-template-columns: 1fr; }
  .map-grid { grid-template-columns: 1fr; }
}
</style>