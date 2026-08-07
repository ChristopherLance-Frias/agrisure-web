<template>
  <div class="dashboard-layout">

   

    <!-- MAIN CONTENT AREA -->
    <div class="main-wrapper">

      <!-- TOP BAR / HEADER -->
      <header class="top-header">
        <div class="header-title-group">
          <h1>Dashboard Overview</h1>
          <p>San Guillermo Municipal Agriculture Office</p>
        </div>

        <div class="header-actions">
          <!-- Search Bar -->
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text" 
              placeholder="Search farmer, claim, ID..." 
              class="search-input"
            />
          </div>

          <!-- Season Dropdown -->
          <select v-model="selectedSeason" class="season-select">
            <option value="wet">🌾 Wet Season (2026)</option>
            <option value="dry">☀️ Dry Season (2026)</option>
          </select>

          <!-- Notifications Button -->
          <button class="icon-btn">
            <i class="fa-regular fa-bell"></i>
            <span class="notification-badge"></span>
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
                    <template v-else-if="loading">--°C</template>
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
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import ApexChart from 'vue3-apexcharts'
import { onUnmounted } from 'vue'

const LAT = 15.48
const LON = 120.60

const currentUser = ref({ name: 'Christopher', role: 'MAO Officer', initials: 'CP' })
const selectedSeason = ref('wet')

const stats = ref({
    farmers:{count:0,change:''},
    applications:{count:0,pending:''},
    claims:{count:0,inspecting:''},
    damage:{count:0,critical:''},
    inventory:{items:0,lowStock:''}
})

const pendingTasks = ref([])
const barangayData = ref([])
const weather = ref({
  temp: '--°C',
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
    applicationTrend:{
        series:[{name:'Applications',data:[]}],
        options:{
            chart:{toolbar:{show:false},fontFamily:'inherit'},
            colors:['#047857'],
            plotOptions:{bar:{borderRadius:6,columnWidth:'40%'}},
            xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']},
            grid:{borderColor:'#f1f5f9'}
        }
    },
    damageAnalytics:{
        series:[{name:'Incidents',data:[]}],
        options:{
            chart:{toolbar:{show:false}},
            colors:['#e11d48'],
            plotOptions:{bar:{horizontal:true,borderRadius:6}},
            xaxis:{categories:[]}
        }
    },
    insuranceStatus:{
        series:[],
        options:{
            labels:[],
            colors:['#059669','#d97706','#2563eb','#7c3aed','#dc2626'],
            legend:{position:'bottom'}
        }
    },
    inventoryStatus:{
        series:[{name:'Stock',data:[]}],
        options:{
            chart:{toolbar:{show:false}},
            colors:['#059669'],
            plotOptions:{bar:{horizontal:true,borderRadius:6}},
            xaxis:{categories:[],max:100}
        }
    }
})

const loadDashboard = async()=>{
    try{

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

        const ov=overview.data.summary
        const ins=insurance.data
        const dmg=damage.data
        const dist=distribution.data
        const inv=inventory.data
        const exe=executive.data

        stats.value={
            farmers:{
                count:ov.total_farmers,
                change:`${ov.total_farms} Farms`
            },
            applications:{
                count:ov.insurance_applications,
                pending:`${ins.summary.submitted_to_mao} Pending`
            },
            claims:{
                count:ov.claims,
                inspecting:`₱${Number(exe.kpis.claims_released_amount).toLocaleString()}`
            },
            damage:{
                count:ov.damage_reports,
                critical:`${dmg.summary.validated_by_mao} Validated`
            },
            inventory:{
                items:ov.inventory_supplies,
                lowStock:`${inv.summary.low_stock_items} Low Stock`
            }
        }

        chartConfigs.applicationTrend.series=[{
            name:'Applications',
            data:ins.monthly_applications.map(i=>i.total)
        }]

        chartConfigs.applicationTrend.options.xaxis.categories=ins.monthly_applications.map(i=>`Month ${i.month}`)

        chartConfigs.damageAnalytics.series=[{
            name:'Incidents',
            data:dmg.damage_causes.map(i=>i.total)
        }]

        chartConfigs.damageAnalytics.options.xaxis.categories=dmg.damage_causes.map(i=>i.damage_cause)

        chartConfigs.insuranceStatus.series=ins.status_distribution.map(i=>i.total)

        chartConfigs.insuranceStatus.options.labels=ins.status_distribution.map(i=>i.status)

        chartConfigs.inventoryStatus.series=[{
            name:'Quantity',
            data:inv.current_inventory.map(i=>i.quantity)
        }]

        chartConfigs.inventoryStatus.options.xaxis.categories=inv.current_inventory.map(i=>i.supply_name)

        barangayData.value=exe.top_barangays_by_farmers.map(i=>({
            name:i.name,
            farmers:i.total,
            claims:0,
            damage:0,
            statusBg:'dot-green'
        }))

        distributionSummary.value=[
            {label:'Distribution Events',value:dist.summary.distribution_events,colorClass:'text-green'},
            {label:'Beneficiaries',value:dist.summary.beneficiary_farmers,colorClass:'text-dark'},
            {label:'Barangays Served',value:dist.summary.barangays_served,colorClass:'text-amber'},
            {label:'Items Distributed',value:dist.summary.distributed_items,unit:'units',colorClass:'text-dark'}
        ]

        pendingTasks.value=[
            {id:1,title:'Applications Pending',badgeText:ins.summary.submitted_to_mao,dotColor:'dot-amber',badgeColor:'badge-amber'},
            {id:2,title:'Validated Damage Reports',badgeText:dmg.summary.validated_by_mao,dotColor:'dot-red',badgeColor:'badge-red'},
            {id:3,title:'Low Stock Supplies',badgeText:inv.summary.low_stock_items,dotColor:'dot-red',badgeColor:'badge-red'},
            {id:4,title:'Claims Ready',badgeText:exe.kpis.claims_processed,dotColor:'dot-green',badgeColor:'badge-green'}
        ]

        recentActivities.value=[
            {id:1,colorClass:'dot-green',text:`${ov.insurance_applications} insurance applications recorded.`,time:'Today'},
            {id:2,colorClass:'dot-red',text:`${ov.damage_reports} damage reports submitted.`,time:'Today'},
            {id:3,colorClass:'dot-amber',text:`${inv.summary.low_stock_items} supplies are low on stock.`,time:'Today'},
            {id:4,colorClass:'dot-blue',text:`₱${Number(exe.kpis.claims_released_amount).toLocaleString()} claims released.`,time:'Today'}
        ]

    }catch(e){
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
      temp: `${Math.round(c.temperature_2m)}°C`,
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
/* GENERAL STYLES & RESET */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.dashboard-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #f8fafc;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: #334155;
  -webkit-font-smoothing: antialiased;
}

/* SIDEBAR */
.sidebar {
  width: 256px;
  background-color: #0f3822;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;
  z-index: 30;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  border-right: 1px solid rgba(6, 78, 59, 0.4);
}

.brand-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background-color: rgba(2, 44, 34, 0.4);
  border-bottom: 1px solid rgba(6, 95, 70, 0.4);
}

.brand-logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fbbf24, #fcd34d);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #022c22;
  font-weight: 900;
  box-shadow: 0 4px 10px rgba(251, 191, 36, 0.2);
}

.brand-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  display: block;
  line-height: 1;
}

.brand-subtitle {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #6ee7b7;
  display: block;
  margin-top: 4px;
}

.nav-container {
  margin-top: 20px;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 12px;
  color: rgba(167, 243, 208, 0.8);
  text-decoration: none;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background-color: rgba(6, 95, 70, 0.5);
  color: #ffffff;
}

.nav-item.active {
  background-color: rgba(5, 150, 105, 0.9);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(6, 78, 59, 0.3);
}

.nav-icon {
  width: 20px;
  text-align: center;
  font-size: 16px;
  color: rgba(110, 231, 183, 0.7);
}

.nav-item.active .nav-icon {
  color: #fcd34d;
}

.nav-badge {
  margin-left: auto;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9999px;
  background-color: #fbbf24;
  color: #022c22;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(6, 95, 70, 0.4);
  background-color: rgba(2, 44, 34, 0.2);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  color: rgba(167, 243, 208, 0.7);
  text-decoration: none;
  transition: all 0.15s ease;
}

.footer-link:hover {
  background-color: rgba(6, 95, 70, 0.4);
  color: #ffffff;
}

.footer-link.logout {
  color: rgba(fda4af, 0.8);
}

.footer-link.logout:hover {
  background-color: rgba(76, 5, 25, 0.4);
  color: #fecdd3;
}

.footer-icon {
  width: 20px;
  text-align: center;
}

/* MAIN CONTENT WRAPPER */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
}

/* TOP HEADER */
.top-header {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 14px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-group h1 {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.header-title-group p {
  font-size: 12px;
  color: #64748b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  position: relative;
  width: 256px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 10px;
  font-size: 12px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 6px 12px 6px 36px;
  font-size: 12px;
  color: #334155;
  outline: none;
  transition: all 0.15s ease;
}

.search-input:focus {
  background-color: #ffffff;
  border-color: #059669;
  box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
}

.season-select {
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  outline: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.season-select:hover {
  background-color: #e2e8f0;
}

.icon-btn {
  position: relative;
  padding: 8px;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background-color: #f1f5f9;
  color: #047857;
}

.notification-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background-color: #f43f5e;
  border-radius: 9999px;
  border: 2px solid #ffffff;
}

.v-divider {
  height: 24px;
  width: 1px;
  background-color: #e2e8f0;
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
  background: linear-gradient(135deg, #047857, #059669);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
}

.user-name {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.user-role {
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* BODY CONTAINER */
.dashboard-body {
  padding: 32px;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* METRICS GRID */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .metrics-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .metrics-grid { grid-template-columns: repeat(1, 1fr); }
}

.metric-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.15s ease;
}

.metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.icon-badge {
  padding: 8px;
  border-radius: 12px;
  font-size: 14px;
}

.icon-badge.green { background-color: #ecfdf5; color: #047857; }
.icon-badge.blue { background-color: #eff6ff; color: #2563eb; }
.icon-badge.amber { background-color: #fffbeb; color: #d97706; }
.icon-badge.red { background-color: #fff1f2; color: #e11d48; }
.icon-badge.purple { background-color: #faf5ff; color: #9333ea; }

.card-value {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin-top: 8px;
  letter-spacing: -0.02em;
}

.unit-text {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

.card-footer {
  margin-top: 12px;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}

.status-pill.green { background-color: #ecfdf5; color: #047857; }
.status-pill.amber { background-color: #fffbeb; color: #b45309; }
.status-pill.red { background-color: #fff1f2; color: #be123c; }

/* GRID LAYOUT HELPER CLASSES */
.row-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.row-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
  .row-grid-3, .row-grid-2 { grid-template-columns: 1fr; }
}

.col-span-2 {
  grid-column: span 2 / span 2;
}

@media (max-width: 1024px) {
  .col-span-2 { grid-column: span 1; }
}

/* PANELS */
.panel {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.flex-column-between {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h2 {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.panel-header p {
  font-size: 12px;
  color: #94a3b8;
}

.subtext {
  font-size: 12px;
  color: #94a3b8;
}

.panel-title-spaced {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 16px;
}

/* BUTTONS & LINKS */
.btn-secondary {
  font-size: 12px;
  font-weight: 700;
  color: #047857;
  background-color: #ecfdf5;
  border: none;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background-color: #d1fae5;
}

.btn-block {
  width: 100%;
  margin-top: 16px;
  padding: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  background-color: #f1f5f9;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-block:hover {
  background-color: #e2e8f0;
}

.btn-primary {
  background-color: #047857;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(4, 120, 87, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.15s ease;
}

.btn-primary:hover {
  background-color: #065f46;
}

.btn-outline {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.15s ease;
}

.btn-outline:hover {
  background-color: #f1f5f9;
}

.link-btn {
  font-size: 12px;
  font-weight: 600;
  color: #047857;
  background: transparent;
  border: none;
  cursor: pointer;
}

.link-btn:hover { text-decoration: underline; }

.link-btn-muted {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
}

.link-btn-muted:hover { color: #0f172a; }

/* TASKS LIST */
.count-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  background-color: #f1f5f9;
  color: #475569;
}

.task-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-title {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.task-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

/* DOTS & BADGE COLORS */
.dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
}

.dot-amber { background-color: #fbbf24; box-shadow: 0 0 0 4px #fef3c7; }
.dot-red { background-color: #f43f5e; box-shadow: 0 0 0 4px #ffe4e6; }
.dot-green { background-color: #10b981; box-shadow: 0 0 0 4px #d1fae5; }
.dot-blue { background-color: #3b82f6; box-shadow: 0 0 0 4px #dbeafe; }

.badge-amber { background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
.badge-red { background-color: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
.badge-green { background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }

/* SUMMARY GRID */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.summary-card {
  padding: 14px;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
}

.summary-label {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-size: 24px;
  font-weight: 900;
  margin-top: 4px;
  letter-spacing: -0.02em;
}

.summary-unit {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
}

.text-green { color: #047857; }
.text-amber { color: #d97706; }
.text-dark { color: #1e293b; }

/* DATA TABLES */
.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  text-align: left;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table th {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #94a3b8;
  text-transform: uppercase;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-weight: 500;
}

.font-bold { font-weight: 700; color: #0f172a; }

.severity-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid;
}

.severity-badge.warning { background-color: #fffbeb; color: #b45309; border-color: #fde68a; }
.severity-badge.success { background-color: #ecfdf5; color: #047857; border-color: #a7f3d0; }

/* WEATHER CARD */
.weather-card {
  background: linear-gradient(135deg, #0f3822, #154d2e, #064e3b);
  color: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.weather-bg-icon {
  position: absolute;
  right: -24px;
  top: -24px;
  font-size: 120px;
  color: rgba(255, 255, 255, 0.05);
  pointer-events: none;
}

.weather-content {
  position: relative;
  z-index: 10;
}

.weather-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.weather-subtitle {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6ee7b7;
}

.weather-temp {
  font-size: 36px;
  font-weight: 800;
  margin-top: 4px;
  letter-spacing: -0.02em;
}

.weather-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fcd34d;
  font-size: 24px;
}

.weather-condition {
  font-size: 12px;
  color: #a7f3d0;
  font-weight: 500;
  margin-top: 4px;
}

.weather-stats {
  position: relative;
  z-index: 10;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(4, 120, 87, 0.5);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.weather-stat-row {
  display: flex;
  justify-content: space-between;
  color: #a7f3d0;
}

.weather-stat-row strong { color: #ffffff; }

.weather-retry-btn {
  margin-top: 8px;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: rgba(255,255,255,0.2);
  color: inherit;
}

/* ACTIVITIES */
.activity-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.activity-text {
  color: #475569;
  line-height: 1.4;
}

.activity-time {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 600;
  margin-left: auto;
  flex-shrink: 0;
}

/* QUICK ACTIONS GRID */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.col-span-full {
  grid-column: 1 / -1;
}

.icon-green {
  color: #047857;
  font-size: 14px;
}

/* MAP PLACEHOLDER */
.gis-badge {
  font-size: 10px;
  font-weight: 700;
  color: #065f46;
  background-color: #ecfdf5;
  padding: 4px 10px;
  border-radius: 9999px;
  border: 1px solid rgba(167, 243, 208, 0.6);
}

.map-placeholder {
  width: 100%;
  height: 240px;
  border-radius: 12px;
  border: 1px dashed rgba(110, 231, 183, 0.8);
  background-color: rgba(236, 253, 245, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 24px;
}

.map-bg-icon {
  position: absolute;
  font-size: 180px;
  color: #064e3b;
  opacity: 0.05;
  pointer-events: none;
}

.map-grid {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 768px;
}

@media (max-width: 768px) {
  .map-grid { grid-template-columns: repeat(2, 1fr); }
}

.map-card {
  padding: 14px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.map-card:hover {
  border-color: #059669;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.map-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.map-card-title {
  font-weight: 700;
  font-size: 12px;
  color: #1e293b;
}

.map-card-desc {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
}
</style>