
<template>
  <div class="reports-page">
    <div class="reports-container">

      <!-- Header -->
      <div class="reports-header">
        <div>
          <h1 class="reports-title">Agricultural Program Reports</h1>
          <p class="reports-subtitle">Farmers, insurance, damage, claims, distribution & inventory analytics</p>
        </div>
        <button class="btn-primary" @click="refreshActive">
          Refresh
        </button>
      </div>

      <!-- Filters -->
      <div class="card filters-card">
        <div class="filters-grid">
          <div class="field">
            <label class="field-label">Season ID</label>
            <input v-model="filters.season_id" type="text" placeholder="Any" class="field-input" />
          </div>
          <div class="field">
            <label class="field-label">Barangay ID</label>
            <input v-model="filters.barangay_id" type="text" placeholder="Any" class="field-input" />
          </div>
          <div class="field">
            <label class="field-label">Crop Type</label>
            <select v-model="filters.crop_type" class="field-input">
              <option value="">Any</option>
              <option value="Rice">Rice</option>
              <option value="Corn">Corn</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Year</label>
            <input v-model="filters.year" type="number" placeholder="Any" class="field-input" />
          </div>
          <div class="field field-action">
            <button class="btn-secondary" @click="clearFilters">Clear Filters</button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-bar">
        <button
          v-for="t in tabs" :key="t.key"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === t.key }"
          @click="activeTab = t.key"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Status -->
      <div v-if="loading[activeTab]" class="status-message">Loading report data…</div>
      <div v-else-if="errors[activeTab]" class="status-error">
        {{ errors[activeTab] }}
      </div>

      <template v-else>

        <!-- ============================== OVERVIEW ============================== -->
        <div v-if="activeTab === 'overview' && ov" class="tab-panel">
          <div class="summary-grid summary-grid--5">
            <div v-for="s in summaryEntries(ov.summary)" :key="s.key" class="card summary-card">
              <p class="summary-label">{{ s.label }}</p>
              <p class="summary-value">{{ s.value }}</p>
            </div>
          </div>
        </div>

        <!-- ============================== FARMERS ============================== -->
        <div v-if="activeTab === 'farmers' && fa" class="tab-panel">
          <div class="summary-grid summary-grid--4">
            <div v-for="s in summaryEntries(fa.summary)" :key="s.key" class="card summary-card">
              <p class="summary-label">{{ s.label }}</p>
              <p class="summary-value">{{ s.value }}</p>
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Farmers by Sex</h3>
              <ChartCanvas type="pie" :chart-data="pieData(fa.sex_distribution, 'sex', 'total')" />
            </div>
            <div class="card">
              <h3 class="card-title">Civil Status Distribution</h3>
              <ChartCanvas type="pie" :chart-data="pieData(fa.civil_status_distribution, 'civil_status', 'total')" />
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Age Groups</h3>
              <ChartCanvas type="bar"
                :chart-data="barData(mapToRows(fa.age_groups, 'group', 'total'), 'group', 'total', 'Farmers')" />
            </div>
            <div class="card">
              <h3 class="card-title">Top Barangays (Farmer Count)</h3>
              <ChartCanvas type="bar" :chart-data="barData(fa.top_barangays, 'name', 'total', 'Farmers')" />
            </div>
          </div>

          <div class="card table-card">
            <h3 class="card-title">Farmers per Barangay</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th class="text-right">Total Farmers</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in fa.farmers_per_barangay" :key="row.id">
                  <td>{{ row.name }}</td>
                  <td class="text-right">{{ formatValue('total', row.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ============================== FARMS & CROPS ============================== -->
        <div v-if="activeTab === 'farms' && fr" class="tab-panel">
          <div class="summary-grid summary-grid--3">
            <div v-for="s in summaryEntries(fr.summary)" :key="s.key" class="card summary-card">
              <p class="summary-label">{{ s.label }}</p>
              <p class="summary-value">{{ s.value }}</p>
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Crop Distribution</h3>
              <ChartCanvas type="pie" :chart-data="pieData(fr.crop_distribution, 'crop_type', 'total')" />
            </div>
            <div class="card">
              <h3 class="card-title">Farm Area per Crop</h3>
              <ChartCanvas type="bar" :chart-data="barData(fr.crop_area_distribution, 'crop_type', 'total_area', 'Hectares')" />
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">Largest Agricultural Barangays</h3>
            <ChartCanvas type="bar" :chart-data="barData(fr.largest_agricultural_barangays, 'name', 'total_area', 'Hectares')" />
          </div>

          <div class="card table-card">
            <h3 class="card-title">Farms per Barangay</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th class="text-right">Total Farms</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in fr.farms_per_barangay" :key="row.id">
                  <td>{{ row.name }}</td>
                  <td class="text-right">{{ formatValue('total', row.total_farms) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ============================== INSURANCE ============================== -->
        <div v-if="activeTab === 'insurance' && ins" class="tab-panel">
          <div class="summary-grid summary-grid--6">
            <div v-for="s in summaryEntries(ins.summary)" :key="s.key" class="card summary-card">
              <p class="summary-label">{{ s.label }}</p>
              <p class="summary-value">{{ s.value }}</p>
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Status Distribution</h3>
              <ChartCanvas type="pie" :chart-data="pieData(ins.status_distribution, 'status', 'total')" />
            </div>
            <div class="card">
              <h3 class="card-title">Crop Distribution</h3>
              <ChartCanvas type="pie" :chart-data="pieData(ins.crop_distribution, 'crop_type', 'total')" />
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">Monthly Applications</h3>
            <ChartCanvas type="line" :chart-data="monthlyData(ins.monthly_applications, 'total', 'Applications')" />
          </div>

          <div class="card">
            <h3 class="card-title">Top Barangays (Applications)</h3>
            <ChartCanvas type="bar" :chart-data="barData(ins.top_barangays, 'name', 'total', 'Applications')" />
          </div>
        </div>

        <!-- ============================== DAMAGE REPORTS ============================== -->
        <div v-if="activeTab === 'damageReports' && dr" class="tab-panel">
          <div class="summary-grid summary-grid--3">
            <div v-for="s in summaryEntries(dr.summary)" :key="s.key" class="card summary-card">
              <p class="summary-label">{{ s.label }}</p>
              <p class="summary-value">{{ s.value }}</p>
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Damage Causes</h3>
              <ChartCanvas type="pie" :chart-data="pieData(dr.damage_causes, 'damage_cause', 'total')" />
            </div>
            <div class="card">
              <h3 class="card-title">Rice vs Corn Damage</h3>
              <ChartCanvas type="bar" :chart-data="barData(dr.crop_damage, 'crop_type', 'total', 'Reports')" />
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">Monthly Damage Trend</h3>
            <ChartCanvas type="line" :chart-data="monthlyData(dr.monthly_damage, 'total', 'Reports')" />
          </div>

          <div class="card">
            <h3 class="card-title">Top 10 Most Damaged Barangays</h3>
            <ChartCanvas type="bar" :chart-data="barData(dr.top_barangays, 'name', 'total_reports', 'Reports')" />
          </div>
        </div>

        <!-- ============================== CLAIMS ============================== -->
        <div v-if="activeTab === 'claims' && cl" class="tab-panel">
          <div class="summary-grid summary-grid--6">
            <div v-for="s in summaryEntries(cl.summary)" :key="s.key" class="card summary-card">
              <p class="summary-label">{{ s.label }}</p>
              <p class="summary-value">{{ s.value }}</p>
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Status Distribution</h3>
              <ChartCanvas type="pie" :chart-data="pieData(cl.status_distribution, 'status', 'total')" />
            </div>
            <div class="card">
              <h3 class="card-title">Rice vs Corn Claim Amount</h3>
              <ChartCanvas type="bar" :chart-data="barData(cl.crop_claims, 'crop_type', 'amount', 'Amount (PHP)')" />
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">Monthly Claim Amount</h3>
            <ChartCanvas type="line" :chart-data="monthlyData(cl.monthly_claims, 'amount', 'Amount (PHP)')" />
          </div>

          <div class="card">
            <h3 class="card-title">Top 10 Barangays by Claim Amount</h3>
            <ChartCanvas type="bar" :chart-data="barData(cl.top_barangays, 'name', 'total_amount', 'Amount (PHP)')" />
          </div>

          <div class="card table-card">
            <h3 class="card-title">Claims per Barangay</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th class="text-right">Total Claims</th>
                  <th class="text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in cl.barangays" :key="row.id">
                  <td>{{ row.name }}</td>
                  <td class="text-right">{{ formatValue('total', row.total_claims) }}</td>
                  <td class="text-right">{{ formatValue('amount', row.total_amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ============================== DISTRIBUTION ============================== -->
        <div v-if="activeTab === 'distribution' && dist" class="tab-panel">
          <div class="summary-grid summary-grid--4">
            <div v-for="s in summaryEntries(dist.summary)" :key="s.key" class="card summary-card">
              <p class="summary-label">{{ s.label }}</p>
              <p class="summary-value">{{ s.value }}</p>
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">Monthly Distribution Events</h3>
            <ChartCanvas type="line" :chart-data="monthlyData(dist.monthly_distribution, 'total_events', 'Events')" />
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Most Distributed Supplies</h3>
              <ChartCanvas type="bar" :chart-data="barData(dist.supplies, 'supply_name', 'total_quantity', 'Quantity')" />
            </div>
            <div class="card">
              <h3 class="card-title">Top Barangays Served</h3>
              <ChartCanvas type="bar" :chart-data="barData(dist.top_barangays, 'name', 'total', 'Events')" />
            </div>
          </div>

          <div class="card table-card">
            <h3 class="card-title">Beneficiaries per Barangay</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th class="text-right">Beneficiaries</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in dist.beneficiaries" :key="row.id">
                  <td>{{ row.name }}</td>
                  <td class="text-right">{{ formatValue('total', row.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ============================== INVENTORY ============================== -->
        <div v-if="activeTab === 'inventory' && inv" class="tab-panel">
          <div class="summary-grid summary-grid--4">
            <div v-for="s in summaryEntries(inv.summary)" :key="s.key" class="card summary-card">
              <p class="summary-label">{{ s.label }}</p>
              <p class="summary-value">{{ s.value }}</p>
            </div>
          </div>

          <div cxass="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Stock by Category</h3>
              <ChartCanvas type="pie" :chart-data="pieData(inv.category_distribution, 'category', 'total_quantity')" />
            </div>
            <div class="card">
              <h3 class="card-title">Most Distributed Supplies</h3>
              <ChartCanvas type="bar" :chart-data="barData(inv.most_distributed, 'supply_name', 'distributed', 'Distributed')" />
            </div>
          </div>

          <div class="card table-card">
            <h3 class="card-title">Current Inventory</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Supply</th>
                  <th>Category</th>
                  <th class="text-right">Quantity</th>
                  <th>Unit</th>
                  <th class="text-right">Reorder Level</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in inv.current_inventory" :key="row.id"
                    :class="{ 'row-warning': row.quantity <= row.reorder_level }">
                  <td>{{ row.supply_name }}</td>
                  <td>{{ row.category }}</td>
                  <td class="text-right">{{ formatValue('total', row.quantity) }}</td>
                  <td>{{ row.unit }}</td>
                  <td class="text-right">{{ formatValue('total', row.reorder_level) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title card-title--warning">Low Stock</h3>
              <ul class="simple-list">
                <li v-for="item in inv.low_stock" :key="item.id" class="simple-list-item">
                  <span>{{ item.supply_name }}</span>
                  <span class="simple-list-value simple-list-value--warning">{{ item.quantity }} {{ item.unit }}</span>
                </li>
                <li v-if="!inv.low_stock?.length" class="simple-list-empty">None</li>
              </ul>
            </div>
            <div class="card">
              <h3 class="card-title card-title--danger">Out of Stock</h3>
              <ul class="simple-list">
                <li v-for="item in inv.out_of_stock_items" :key="item.id" class="simple-list-item simple-list-item--single">
                  {{ item.supply_name }}
                </li>
                <li v-if="!inv.out_of_stock_items?.length" class="simple-list-empty">None</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- ============================== EXECUTIVE ============================== -->
        <div v-if="activeTab === 'executive' && ex" class="tab-panel">
          <div class="summary-grid summary-grid--5">
            <div v-for="s in summaryEntries(ex.kpis)" :key="s.key" class="card summary-card">
              <p class="summary-label">{{ s.label }}</p>
              <p class="summary-value">{{ s.value }}</p>
            </div>
          </div>

          <div class="chart-grid chart-grid--3">
            <div class="card">
              <h3 class="card-title">Top Barangays by Farmers</h3>
              <ChartCanvas type="bar" :chart-data="barData(ex.top_barangays_by_farmers, 'name', 'total', 'Farmers')" height="240" />
            </div>
            <div class="card">
              <h3 class="card-title">Top Damage Barangays</h3>
              <ChartCanvas type="bar" :chart-data="barData(ex.top_damage_barangays, 'name', 'total', 'Reports')" height="240" />
            </div>
            <div class="card">
              <h3 class="card-title">Top Claim Barangays</h3>
              <ChartCanvas type="bar" :chart-data="barData(ex.top_claim_barangays, 'name', 'amount', 'Amount (PHP)')" height="240" />
            </div>
          </div>

          <div class="card table-card">
            <h3 class="card-title card-title--warning">Low Stock Supplies</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Supply</th>
                  <th class="text-right">Quantity</th>
                  <th>Unit</th>
                  <th class="text-right">Reorder Level</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in ex.low_stock_supplies" :key="row.id">
                  <td>{{ row.supply_name }}</td>
                  <td class="text-right">{{ formatValue('total', row.quantity) }}</td>
                  <td>{{ row.unit }}</td>
                  <td class="text-right">{{ formatValue('total', row.reorder_level) }}</td>
                </tr>
                <tr v-if="!ex.low_stock_supplies?.length">
                  <td colspan="4" class="empty-row">No low stock items</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import ChartCanvas from './ChartCanvas.vue'

// Match your team's exact API Base configurations
const API_BASE = 'http://192.168.100.173:8000'

export default {
  name: 'ReportsPage',
  components: {
    ChartCanvas
  },
  data() {
    return {
      activeTab: 'overview',
      filters: {
        season_id: '',
        barangay_id: '',
        crop_type: '',
        year: 2026
      },
      tabs: [
        { key: 'overview', label: 'Overview', endpoint: '/api/reports/overview' },
        { key: 'farmers', label: 'Farmers', endpoint: '/api/reports/farmers' },
        { key: 'farms', label: 'Farms & Crops', endpoint: '/api/reports/farms' },
        { key: 'insurance', label: 'Insurance', endpoint: '/api/reports/insurance' },
        { key: 'damageReports', label: 'Damage Reports', endpoint: '/api/reports/damage-reports' },
        { key: 'claims', label: 'Claims', endpoint: '/api/reports/claims' },
        { key: 'distribution', label: 'Distribution', endpoint: '/api/reports/distribution' },
        { key: 'inventory', label: 'Inventory', endpoint: '/api/reports/inventory' },
        { key: 'executive', label: 'Executive Insights', endpoint: '/api/reports/executive' }
      ],
      data: {},       // Stores data per tab key, e.g. { overview: {...} }
      loading: {},    // Stores boolean states per tab key
      errors: {},     // Stores text errors per tab key
      loadedOnce: {}, // Prevent reload flicker upon revisiting tabs
      debounceHandle: null
    }
  },
  computed: {
    ov() { return this.data.overview },
    fa() { return this.data.farmers },
    fr() { return this.data.farms },
    ins() { return this.data.insurance },
    dr() { return this.data.damageReports },
    cl() { return this.data.claims },
    dist() { return this.data.distribution },
    inv() { return this.data.inventory },
    ex() { return this.data.executive }
  },
  watch: {
    activeTab(newKey) {
      if (!this.loadedOnce[newKey]) {
        this.fetchTab(newKey)
      }
    },
    filters: {
      deep: true,
      handler() {
        clearTimeout(this.debounceHandle)
        this.debounceHandle = setTimeout(() => {
          // Re-fetch all previously loaded tabs under new filters
          this.tabs.forEach(t => {
            if (this.loadedOnce[t.key]) this.fetchTab(t.key)
          })
          if (!this.loadedOnce[this.activeTab]) {
            this.fetchTab(this.activeTab)
          }
        }, 400)
      }
    }
  },
  mounted() {
    this.fetchTab('overview')
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle)
  },
  methods: {
    // Match the authorization headers pattern used in your working pages
    authHeaders() {
      const token =
        localStorage.getItem('mao_token') ||
        localStorage.getItem('token')

      return {
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/json',
        },
      }
    },
    async fetchTab(key) {
      const meta = this.tabs.find(t => t.key === key)
      if (!meta) return

      this.loading = { ...this.loading, [key]: true }
      this.errors = { ...this.errors, [key]: null }

      try {
        const queryParams = {}
        Object.entries(this.filters).forEach(([k, v]) => {
          if (v !== '' && v !== null && v !== undefined) queryParams[k] = v
        })

        // Build request URL & configuration matching your standard
        const url = API_BASE + meta.endpoint
        const config = {
          ...this.authHeaders(),
          params: queryParams
        }

        const { data: res } = await axios.get(url, config)
        
        this.data = { ...this.data, [key]: res }
        this.loadedOnce = { ...this.loadedOnce, [key]: true }
      } catch (e) {
        console.error(e)
        this.errors = { ...this.errors, [key]: e?.response?.data?.message || 'Failed to load report data.' }
      } finally {
        this.loading = { ...this.loading, [key]: false }
      }
    },
    refreshActive() {
      this.fetchTab(this.activeTab)
    },
    clearFilters() {
      this.filters.season_id = ''
      this.filters.barangay_id = ''
      this.filters.crop_type = ''
      this.filters.year = ''
    },
    titleCase(key) {
      return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
    },
    formatValue(key, value) {
      if (value === null || value === undefined) return '-'
      if (typeof value !== 'number') return value
      if (/amount/i.test(key)) {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
      }
      return new Intl.NumberFormat('en-PH').format(value)
    },
    summaryEntries(obj) {
      if (!obj) return []
      return Object.entries(obj).map(([key, value]) => ({
        key,
        label: this.titleCase(key),
        value: this.formatValue(key, value)
      }))
    },
    colorAt(i) {
      const palette = [
        '#34a853', '#2563eb', '#f59e0b', '#dc2626', '#7c3aed',
        '#0891b2', '#db2777', '#65a30d', '#ea580c', '#475569'
      ]
      return palette[i % palette.length]
    },
    pieData(rows, labelKey, valueKey) {
      const list = rows || []
      return {
        labels: list.map(r => r[labelKey] ?? 'Unknown'),
        datasets: [{
          data: list.map(r => Number(r[valueKey]) || 0),
          backgroundColor: list.map((_, i) => this.colorAt(i))
        }]
      }
    },
    barData(rows, labelKey, valueKey, label = '') {
      const list = rows || []
      return {
        labels: list.map(r => r[labelKey] ?? 'Unknown'),
        datasets: [{
          label,
          data: list.map(r => Number(r[valueKey]) || 0),
          backgroundColor: this.colorAt(0),
          borderRadius: 4
        }]
      }
    },
    monthlyData(rows, valueKey = 'total', label = 'Total') {
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const map = {}
      ;(rows || []).forEach(r => { map[r.month] = Number(r[valueKey]) || 0 })
      
      const labels = []
      const values = []
      for (let m = 1; m <= 12; m++) {
        labels.push(monthNames[m])
        values.push(map[m] || 0)
      }
      return {
        labels,
        datasets: [{
          label,
          data: values,
          borderColor: this.colorAt(0),
          backgroundColor: this.colorAt(0) + '33',
          fill: true,
          tension: 0.3
        }]
      }
    },
    mapToRows(obj, labelKey, valueKey) {
      return Object.entries(obj || {}).map(([k, v]) => ({ [labelKey]: k, [valueKey]: v }))
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
}

.reports-page {
  min-height: 100vh;
  background: #F8FAF8;
  font-family: 'DM Sans', sans-serif;
  padding: 28px 32px;
}

.reports-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* ================= HEADER ================= */
.reports-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.reports-title {
  font-size: 22px;
  font-weight: 700;
  color: #263238;
  margin-bottom: 4px;
}

.reports-subtitle {
  font-size: 13px;
  color: #607D8B;
}

.btn-primary {
  background: #2E7D32;
  color: #FFFFFF;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: background 0.15s ease;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #1B5E20;
}

.btn-secondary {
  background: #FFFFFF;
  color: #263238;
  border: 1px solid #D9E2D9;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-secondary:hover {
  background: #F8FAF8;
  border-color: #2E7D32;
  color: #2E7D32;
}

/* ================= CARD BASE ================= */
.card {
  background: #FFFFFF;
  border: 1px solid #D9E2D9;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(38,50,56,0.05);
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #263238;
  margin-bottom: 14px;
}

.card-title--warning {
  color: #F9A825;
}

.card-title--danger {
  color: #D32F2F;
}

/* ================= FILTERS ================= */
.filters-card {
  margin-bottom: 20px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr) auto;
  gap: 14px;
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: #607D8B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-input {
  border: 1px solid #D9E2D9;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  color: #263238;
  background: #FFFFFF;
}

.field-input:focus {
  outline: none;
  border-color: #2E7D32;
}

.field-action {
  justify-content: flex-end;
}

/* ================= TABS ================= */
.tabs-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 2px solid #D9E2D9;
  overflow-x: auto;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 500;
  color: #607D8B;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.tab-btn:hover {
  color: #2E7D32;
}

.tab-btn--active {
  color: #2E7D32;
  border-bottom-color: #2E7D32;
  font-weight: 700;
}

/* ================= STATUS MESSAGES ================= */
.status-message {
  padding: 40px;
  text-align: center;
  color: #607D8B;
  font-size: 14px;
}

.status-error {
  padding: 16px 20px;
  background: rgba(211,47,47,0.08);
  border: 1px solid rgba(211,47,47,0.25);
  border-radius: 10px;
  color: #D32F2F;
  font-size: 13px;
  font-weight: 500;
}

/* ================= TAB PANEL LAYOUT ================= */
.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ================= SUMMARY CARDS ================= */
.summary-grid {
  display: grid;
  gap: 14px;
}

.summary-grid--3 { grid-template-columns: repeat(3, 1fr); }
.summary-grid--4 { grid-template-columns: repeat(4, 1fr); }
.summary-grid--5 { grid-template-columns: repeat(5, 1fr); }
.summary-grid--6 { grid-template-columns: repeat(6, 1fr); }

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
}

.summary-label {
  font-size: 11px;
  font-weight: 600;
  color: #607D8B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: #2E7D32;
}

/* ================= CHART GRIDS ================= */
.chart-grid {
  display: grid;
  gap: 16px;
}

.chart-grid--2 { grid-template-columns: repeat(2, 1fr); }
.chart-grid--3 { grid-template-columns: repeat(3, 1fr); }

/* ================= TABLES ================= */
.table-card {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  text-align: left;
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #607D8B;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 2px solid #D9E2D9;
  white-space: nowrap;
}

.data-table td {
  padding: 10px 12px;
  color: #263238;
  border-bottom: 1px solid #D9E2D9;
}

.data-table tbody tr:hover {
  background: #F8FAF8;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.text-right {
  text-align: right;
}

.row-warning {
  background: rgba(251,192,45,0.08);
}

.row-warning:hover {
  background: rgba(251,192,45,0.14) !important;
}

.empty-row {
  text-align: center;
  color: #607D8B;
  padding: 20px;
  font-style: italic;
}

/* ================= SIMPLE LISTS ================= */
.simple-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.simple-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #D9E2D9;
  font-size: 13px;
  color: #263238;
}

.simple-list-item:last-child {
  border-bottom: none;
}

.simple-list-item--single {
  justify-content: flex-start;
}

.simple-list-value--warning {
  font-weight: 600;
  color: #F9A825;
}

.simple-list-empty {
  color: #607D8B;
  font-style: italic;
  font-size: 13px;
  padding: 8px 0;
}

/* ================= RESPONSIVE ================= */
@media (max-width: 1200px) {
  .summary-grid--5,
  .summary-grid--6 {
    grid-template-columns: repeat(3, 1fr);
  }
  .chart-grid--3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .filters-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .field-action {
    grid-column: span 2;
    justify-content: flex-start;
  }
  .chart-grid--2,
  .chart-grid--3 {
    grid-template-columns: 1fr;
  }
  .summary-grid--3,
  .summary-grid--4,
  .summary-grid--5,
  .summary-grid--6 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .reports-page { padding: 16px; }
  .reports-header { flex-direction: column; align-items: stretch; }
  .filters-grid { grid-template-columns: 1fr; }
  .field-action { grid-column: span 1; }
  .summary-grid--3,
  .summary-grid--4,
  .summary-grid--5,
  .summary-grid--6 {
    grid-template-columns: 1fr;
  }
}
</style>