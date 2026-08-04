<template>
  <div class="reports-page">
    <div class="reports-container">

      <!-- Header -->
      <header class="reports-header">
        <div class="header-titles">
          <h1 class="reports-title">Agricultural Analytics & Reports</h1>
          <p class="reports-subtitle">Monitor farmers, crop insurance, damage claims, distribution, and inventory</p>
        </div>
        <button class="btn btn-primary" @click="refreshActive">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </header>

      <!-- Filters -->
      <div class="card filters-card">
        <div class="filters-grid">
          <div class="field">
            <label class="field-label">Season ID</label>
            <input v-model="filters.season_id" type="text" placeholder="e.g. 2026-S1" class="field-input" />
          </div>
          <div class="field">
            <label class="field-label">Barangay ID</label>
            <input v-model="filters.barangay_id" type="text" placeholder="Any Barangay" class="field-input" />
          </div>
          <div class="field">
            <label class="field-label">Crop Type</label>
            <select v-model="filters.crop_type" class="field-input">
              <option value="">All Crops</option>
              <option value="Rice">Rice</option>
              <option value="Corn">Corn</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Year</label>
            <input v-model="filters.year" type="number" placeholder="2026" class="field-input" />
          </div>
          <div class="field field-action">
            <button class="btn btn-secondary" @click="clearFilters">Clear Filters</button>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="tabs-bar">
        <button
          v-for="t in tabs" :key="t.key"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === t.key }"
          @click="activeTab = t.key"
        >
          {{ t.label }}
        </button>
      </nav>

      <!-- Loading / Error States -->
      <div v-if="loading[activeTab]" class="status-card status-loading">
        <div class="spinner"></div>
        <span>Fetching analytic records…</span>
      </div>
      <div v-else-if="errors[activeTab]" class="status-card status-error">
        <svg class="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ errors[activeTab] }}</span>
      </div>

      <template v-else>

        <!-- ============================== OVERVIEW ============================== -->
        <div v-if="activeTab === 'overview' && ov" class="tab-panel">
          <div class="summary-grid summary-grid--5">
            <div v-for="s in summaryEntries(ov.summary)" :key="s.key" class="card summary-card">
              <span class="summary-label">{{ s.label }}</span>
              <span class="summary-value">{{ s.value }}</span>
            </div>
          </div>
        </div>

        <!-- ============================== FARMERS ============================== -->
        <div v-if="activeTab === 'farmers' && fa" class="tab-panel">
          <div class="summary-grid summary-grid--4">
            <div v-for="s in summaryEntries(fa.summary)" :key="s.key" class="card summary-card">
              <span class="summary-label">{{ s.label }}</span>
              <span class="summary-value">{{ s.value }}</span>
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Farmers Demographics (Sex)</h3>
              <apexchart type="donut" height="280" :options="donutOptions(fa.sex_distribution, 'sex')" :series="donutSeries(fa.sex_distribution, 'total')" />
            </div>
            <div class="card">
              <h3 class="card-title">Civil Status Breakdown</h3>
              <apexchart type="donut" height="280" :options="donutOptions(fa.civil_status_distribution, 'civil_status')" :series="donutSeries(fa.civil_status_distribution, 'total')" />
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Age Group Distribution</h3>
              <apexchart type="bar" height="280" :options="barOptions(mapToRows(fa.age_groups, 'group', 'total'), 'group', '#2563eb')" :series="barSeries(mapToRows(fa.age_groups, 'group', 'total'), 'total', 'Farmers')" />
            </div>
            <div class="card">
              <h3 class="card-title">Top Barangays by Farmer Count</h3>
              <apexchart type="bar" height="280" :options="barOptions(fa.top_barangays, 'name', '#10b981', true)" :series="barSeries(fa.top_barangays, 'total', 'Farmers')" />
            </div>
          </div>

          <div class="card table-card">
            <h3 class="card-title">Farmers per Barangay</h3>
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Barangay</th>
                    <th class="text-right">Total Registered Farmers</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in fa.farmers_per_barangay" :key="row.id">
                    <td class="font-medium">{{ row.name }}</td>
                    <td class="text-right num-cell">{{ formatValue('total', row.total) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================== FARMS & CROPS ============================== -->
        <div v-if="activeTab === 'farms' && fr" class="tab-panel">
          <div class="summary-grid summary-grid--3">
            <div v-for="s in summaryEntries(fr.summary)" :key="s.key" class="card summary-card">
              <span class="summary-label">{{ s.label }}</span>
              <span class="summary-value">{{ s.value }}</span>
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Crop Type Distribution</h3>
              <apexchart type="pie" height="280" :options="donutOptions(fr.crop_distribution, 'crop_type')" :series="donutSeries(fr.crop_distribution, 'total')" />
            </div>
            <div class="card">
              <h3 class="card-title">Farm Land Area per Crop</h3>
              <apexchart type="bar" height="280" :options="barOptions(fr.crop_area_distribution, 'crop_type', '#f59e0b')" :series="barSeries(fr.crop_area_distribution, 'total_area', 'Hectares')" />
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">Largest Agricultural Areas</h3>
            <apexchart type="bar" height="300" :options="barOptions(fr.largest_agricultural_barangays, 'name', '#3b82f6', true)" :series="barSeries(fr.largest_agricultural_barangays, 'total_area', 'Hectares')" />
          </div>

          <div class="card table-card">
            <h3 class="card-title">Farms per Barangay</h3>
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Barangay</th>
                    <th class="text-right">Total Active Farms</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in fr.farms_per_barangay" :key="row.id">
                    <td class="font-medium">{{ row.name }}</td>
                    <td class="text-right num-cell">{{ formatValue('total', row.total_farms) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================== INSURANCE ============================== -->
        <div v-if="activeTab === 'insurance' && ins" class="tab-panel">
          <div class="summary-grid summary-grid--6">
            <div v-for="s in summaryEntries(ins.summary)" :key="s.key" class="card summary-card">
              <span class="summary-label">{{ s.label }}</span>
              <span class="summary-value">{{ s.value }}</span>
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Application Status</h3>
              <apexchart type="donut" height="280" :options="donutOptions(ins.status_distribution, 'status')" :series="donutSeries(ins.status_distribution, 'total')" />
            </div>
            <div class="card">
              <h3 class="card-title">Insured Crop Breakdown</h3>
              <apexchart type="donut" height="280" :options="donutOptions(ins.crop_distribution, 'crop_type')" :series="donutSeries(ins.crop_distribution, 'total')" />
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">Monthly Insurance Applications</h3>
            <apexchart type="area" height="280" :options="lineOptions('#8b5cf6')" :series="monthlySeries(ins.monthly_applications, 'total', 'Applications')" />
          </div>

          <div class="card">
            <h3 class="card-title">Top Barangay Application Volumes</h3>
            <apexchart type="bar" height="280" :options="barOptions(ins.top_barangays, 'name', '#6366f1')" :series="barSeries(ins.top_barangays, 'total', 'Applications')" />
          </div>
        </div>

        <!-- ============================== DAMAGE REPORTS ============================== -->
        <div v-if="activeTab === 'damageReports' && dr" class="tab-panel">
          <div class="summary-grid summary-grid--3">
            <div v-for="s in summaryEntries(dr.summary)" :key="s.key" class="card summary-card">
              <span class="summary-label">{{ s.label }}</span>
              <span class="summary-value">{{ s.value }}</span>
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Primary Damage Causes</h3>
              <apexchart type="donut" height="280" :options="donutOptions(dr.damage_causes, 'damage_cause')" :series="donutSeries(dr.damage_causes, 'total')" />
            </div>
            <div class="card">
              <h3 class="card-title">Rice vs Corn Crop Damage</h3>
              <apexchart type="bar" height="280" :options="barOptions(dr.crop_damage, 'crop_type', '#ef4444')" :series="barSeries(dr.crop_damage, 'total', 'Reports')" />
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">Monthly Damage Incident Trend</h3>
            <apexchart type="area" height="280" :options="lineOptions('#ef4444')" :series="monthlySeries(dr.monthly_damage, 'total', 'Damage Reports')" />
          </div>

          <div class="card">
            <h3 class="card-title">Top 10 Most Affected Barangays</h3>
            <apexchart type="bar" height="300" :options="barOptions(dr.top_barangays, 'name', '#f97316', true)" :series="barSeries(dr.top_barangays, 'total_reports', 'Reports')" />
          </div>
        </div>

        <!-- ============================== CLAIMS ============================== -->
        <div v-if="activeTab === 'claims' && cl" class="tab-panel">
          <div class="summary-grid summary-grid--6">
            <div v-for="s in summaryEntries(cl.summary)" :key="s.key" class="card summary-card">
              <span class="summary-label">{{ s.label }}</span>
              <span class="summary-value">{{ s.value }}</span>
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Claim Status Distribution</h3>
              <apexchart type="donut" height="280" :options="donutOptions(cl.status_distribution, 'status')" :series="donutSeries(cl.status_distribution, 'total')" />
            </div>
            <div class="card">
              <h3 class="card-title">Claim Amount by Crop (PHP)</h3>
              <apexchart type="bar" height="280" :options="barOptions(cl.crop_claims, 'crop_type', '#10b981')" :series="barSeries(cl.crop_claims, 'amount', 'Amount (₱)')" />
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">Monthly Claim Disbursed Trend</h3>
            <apexchart type="area" height="280" :options="lineOptions('#10b981')" :series="monthlySeries(cl.monthly_claims, 'amount', 'Claim Amount')" />
          </div>

          <div class="card">
            <h3 class="card-title">Top 10 Barangays by Claim Amount</h3>
            <apexchart type="bar" height="300" :options="barOptions(cl.top_barangays, 'name', '#059669', true)" :series="barSeries(cl.top_barangays, 'total_amount', 'Amount (₱)')" />
          </div>

          <div class="card table-card">
            <h3 class="card-title">Claims per Barangay</h3>
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Barangay</th>
                    <th class="text-right">Total Claims</th>
                    <th class="text-right">Total Amount Disbursed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in cl.barangays" :key="row.id">
                    <td class="font-medium">{{ row.name }}</td>
                    <td class="text-right num-cell">{{ formatValue('total', row.total_claims) }}</td>
                    <td class="text-right num-cell font-medium">{{ formatValue('amount', row.total_amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================== DISTRIBUTION ============================== -->
        <div v-if="activeTab === 'distribution' && dist" class="tab-panel">
          <div class="summary-grid summary-grid--4">
            <div v-for="s in summaryEntries(dist.summary)" :key="s.key" class="card summary-card">
              <span class="summary-label">{{ s.label }}</span>
              <span class="summary-value">{{ s.value }}</span>
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">Monthly Distribution Activity</h3>
            <apexchart type="area" height="280" :options="lineOptions('#06b6d4')" :series="monthlySeries(dist.monthly_distribution, 'total_events', 'Events')" />
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Most Distributed Supplies</h3>
              <apexchart type="bar" height="280" :options="barOptions(dist.supplies, 'supply_name', '#0891b2')" :series="barSeries(dist.supplies, 'total_quantity', 'Quantity')" />
            </div>
            <div class="card">
              <h3 class="card-title">Top Served Barangays</h3>
              <apexchart type="bar" height="280" :options="barOptions(dist.top_barangays, 'name', '#3b82f6')" :series="barSeries(dist.top_barangays, 'total', 'Events')" />
            </div>
          </div>

          <div class="card table-card">
            <h3 class="card-title">Beneficiaries per Barangay</h3>
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Barangay</th>
                    <th class="text-right">Beneficiaries Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in dist.beneficiaries" :key="row.id">
                    <td class="font-medium">{{ row.name }}</td>
                    <td class="text-right num-cell">{{ formatValue('total', row.total) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================== INVENTORY ============================== -->
        <div v-if="activeTab === 'inventory' && inv" class="tab-panel">
          <div class="summary-grid summary-grid--4">
            <div v-for="s in summaryEntries(inv.summary)" :key="s.key" class="card summary-card">
              <span class="summary-label">{{ s.label }}</span>
              <span class="summary-value">{{ s.value }}</span>
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card">
              <h3 class="card-title">Stock Volume by Category</h3>
              <apexchart type="donut" height="280" :options="donutOptions(inv.category_distribution, 'category')" :series="donutSeries(inv.category_distribution, 'total_quantity')" />
            </div>
            <div class="card">
              <h3 class="card-title">Highest Distributed Items</h3>
              <apexchart type="bar" height="280" :options="barOptions(inv.most_distributed, 'supply_name', '#8b5cf6')" :series="barSeries(inv.most_distributed, 'distributed', 'Distributed Units')" />
            </div>
          </div>

          <div class="card table-card">
            <h3 class="card-title">Current Inventory Levels</h3>
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Supply Item</th>
                    <th>Category</th>
                    <th class="text-right">Available Qty</th>
                    <th>Unit</th>
                    <th class="text-right">Reorder Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in inv.current_inventory" :key="row.id" :class="{ 'row-warning': row.quantity <= row.reorder_level }">
                    <td class="font-medium">{{ row.supply_name }}</td>
                    <td><span class="badge badge-subtle">{{ row.category }}</span></td>
                    <td class="text-right num-cell font-medium">{{ formatValue('total', row.quantity) }}</td>
                    <td class="text-muted">{{ row.unit }}</td>
                    <td class="text-right num-cell">{{ formatValue('total', row.reorder_level) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="chart-grid chart-grid--2">
            <div class="card border-warning">
              <h3 class="card-title text-warning">Low Stock Warning</h3>
              <ul class="simple-list">
                <li v-for="item in inv.low_stock" :key="item.id" class="simple-list-item">
                  <span class="font-medium">{{ item.supply_name }}</span>
                  <span class="badge badge-warning">{{ item.quantity }} {{ item.unit }}</span>
                </li>
                <li v-if="!inv.low_stock?.length" class="simple-list-empty">All stock levels healthy</li>
              </ul>
            </div>
            <div class="card border-danger">
              <h3 class="card-title text-danger">Out of Stock Alerts</h3>
              <ul class="simple-list">
                <li v-for="item in inv.out_of_stock_items" :key="item.id" class="simple-list-item">
                  <span class="font-medium text-danger">{{ item.supply_name }}</span>
                  <span class="badge badge-danger">Depleted</span>
                </li>
                <li v-if="!inv.out_of_stock_items?.length" class="simple-list-empty">No depleted inventory items</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- ============================== EXECUTIVE ============================== -->
        <div v-if="activeTab === 'executive' && ex" class="tab-panel">
          <div class="summary-grid summary-grid--5">
            <div v-for="s in summaryEntries(ex.kpis)" :key="s.key" class="card summary-card summary-card--accent">
              <span class="summary-label">{{ s.label }}</span>
              <span class="summary-value">{{ s.value }}</span>
            </div>
          </div>

          <div class="chart-grid chart-grid--3">
            <div class="card">
              <h3 class="card-title">Top Farmers Concentration</h3>
              <apexchart type="bar" height="240" :options="barOptions(ex.top_barangays_by_farmers, 'name', '#2563eb')" :series="barSeries(ex.top_barangays_by_farmers, 'total', 'Farmers')" />
            </div>
            <div class="card">
              <h3 class="card-title">Highest Damage Reports</h3>
              <apexchart type="bar" height="240" :options="barOptions(ex.top_damage_barangays, 'name', '#ef4444')" :series="barSeries(ex.top_damage_barangays, 'total', 'Damage Reports')" />
            </div>
            <div class="card">
              <h3 class="card-title">Highest Insurance Claims</h3>
              <apexchart type="bar" height="240" :options="barOptions(ex.top_claim_barangays, 'name', '#10b981')" :series="barSeries(ex.top_claim_barangays, 'amount', 'Amount (₱)')" />
            </div>
          </div>

          <div class="card table-card border-warning">
            <h3 class="card-title text-warning">Critical Low Stock Supplies</h3>
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Supply Item</th>
                    <th class="text-right">Available Qty</th>
                    <th>Unit</th>
                    <th class="text-right">Reorder Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in ex.low_stock_supplies" :key="row.id">
                    <td class="font-medium">{{ row.supply_name }}</td>
                    <td class="text-right num-cell text-warning font-medium">{{ formatValue('total', row.quantity) }}</td>
                    <td class="text-muted">{{ row.unit }}</td>
                    <td class="text-right num-cell">{{ formatValue('total', row.reorder_level) }}</td>
                  </tr>
                  <tr v-if="!ex.low_stock_supplies?.length">
                    <td colspan="4" class="empty-row">No supply reorder warnings active</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import VueApexCharts from 'vue3-apexcharts'

const API_BASE = 'http://192.168.100.173:8000'

export default {
  name: 'ReportsPage',
  components: {
    apexchart: VueApexCharts
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
      data: {},
      loading: {},
      errors: {},
      loadedOnce: {},
      debounceHandle: null,
      palette: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b']
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
    authHeaders() {
      const token = localStorage.getItem('mao_token') || localStorage.getItem('token')
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
        this.errors = { ...this.errors, [key]: e?.response?.data?.message || 'Failed to connect to reports service.' }
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
    mapToRows(obj, labelKey, valueKey) {
      return Object.entries(obj || {}).map(([k, v]) => ({ [labelKey]: k, [valueKey]: v }))
    },

    /* ApexCharts Generator Options */
    donutOptions(rows = [], labelKey) {
      const labels = (rows || []).map(r => r[labelKey] ?? 'Unspecified')
      return {
        chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
        labels,
        colors: this.palette,
        legend: { position: 'bottom', fontSize: '12px' },
        stroke: { width: 0 },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: '72%',
              labels: {
                show: true,
                total: { show: true, label: 'Total', fontSize: '12px', color: '#64748b' }
              }
            }
          }
        }
      }
    },
    donutSeries(rows = [], valueKey) {
      return (rows || []).map(r => Number(r[valueKey]) || 0)
    },
    barOptions(rows = [], labelKey, primaryColor = '#2563eb', isHorizontal = false) {
      const categories = (rows || []).map(r => r[labelKey] ?? 'Unspecified')
      return {
        chart: {
          type: 'bar',
          toolbar: { show: false },
          fontFamily: 'Inter, sans-serif'
        },
        colors: [primaryColor],
        plotOptions: {
          bar: {
            horizontal: isHorizontal,
            borderRadius: 5,
            columnWidth: '55%',
            barHeight: '60%'
          }
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories,
          labels: { style: { colors: '#64748b', fontSize: '11px' } },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: { style: { colors: '#64748b', fontSize: '11px' } }
        },
        grid: {
          borderColor: '#f1f5f9',
          strokeDashArray: 4
        }
      }
    },
    barSeries(rows = [], valueKey, seriesName = 'Total') {
      return [{
        name: seriesName,
        data: (rows || []).map(r => Number(r[valueKey]) || 0)
      }]
    },
    lineOptions(primaryColor = '#2563eb') {
      return {
        chart: {
          type: 'area',
          toolbar: { show: false },
          fontFamily: 'Inter, sans-serif'
        },
        colors: [primaryColor],
        stroke: { curve: 'smooth', width: 2 },
        fill: {
          type: 'gradient',
          gradient: { opacityFrom: 0.35, opacityTo: 0.05 }
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          labels: { style: { colors: '#64748b', fontSize: '11px' } },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: { style: { colors: '#64748b', fontSize: '11px' } }
        },
        grid: {
          borderColor: '#f1f5f9',
          strokeDashArray: 4
        }
      }
    },
    monthlySeries(rows = [], valueKey = 'total', seriesName = 'Total') {
      const map = {}
      ;(rows || []).forEach(r => { map[r.month] = Number(r[valueKey]) || 0 })
      const data = []
      for (let m = 1; m <= 12; m++) {
        data.push(map[m] || 0)
      }
      return [{ name: seriesName, data }]
    }
  }
}
</script>

<style scoped>
/* Modern Dashboard Styling */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.reports-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
  min-height: 100vh;
  padding: 2rem;
}

.reports-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.reports-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reports-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.reports-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.25rem;
}

/* Cards Standard */
.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
  transition: border-color 0.2s ease;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

/* Filter Card */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.field-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  background-color: #fff;
  transition: all 0.2s ease;
}

.field-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.55rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #ffffff;
  color: #475569;
  border-color: #cbd5e1;
}

.btn-secondary:hover {
  background-color: #f1f5f9;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
  padding-bottom: 2px;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #1e293b;
}

.tab-btn--active {
  color: #2563eb;
  font-weight: 600;
  border-bottom-color: #2563eb;
}

/* Tab Panels & Grids */
.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.summary-grid {
  display: grid;
  gap: 1rem;
}

.summary-grid--3 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.summary-grid--4 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.summary-grid--5 { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.summary-grid--6 { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }

.summary-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
  background: #ffffff;
}

.summary-card--accent {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-left: 4px solid #2563eb;
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  text-transform: capitalize;
}

.summary-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
}

/* Chart Grids */
.chart-grid {
  display: grid;
  gap: 1.25rem;
}

.chart-grid--2 { grid-template-columns: repeat(2, 1fr); }
.chart-grid--3 { grid-template-columns: repeat(3, 1fr); }

@media (max-width: 900px) {
  .chart-grid--2, .chart-grid--3 {
    grid-template-columns: 1fr;
  }
}

/* Tables */
.table-card {
  padding: 0;
  overflow: hidden;
}

.table-card .card-title {
  padding: 1.25rem 1.25rem 0 1.25rem;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}

.data-table th {
  background-color: #f8fafc;
  padding: 0.75rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background-color: #f8fafc;
}

.row-warning {
  background-color: #fffbeb;
}

.row-warning:hover {
  background-color: #fef3c7 !important;
}

.text-right { text-align: right; }
.font-medium { font-weight: 500; }
.num-cell { font-family: ui-monospace, monospace; }
.empty-row { text-align: center; color: #94a3b8; padding: 2rem !important; }

/* Status Messages & Badges */
.status-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 0.875rem;
}

.status-error { color: #ef4444; }
.status-icon { width: 20px; height: 20px; }

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Alerts & Lists */
.simple-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.simple-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.875rem;
}

.simple-list-empty {
  font-size: 0.85rem;
  color: #94a3b8;
  font-style: italic;
  padding: 0.5rem 0;
}

.badge {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 4px;
}

.badge-subtle { background: #f1f5f9; color: #475569; }
.badge-warning { background: #fef3c7; color: #d97706; }
.badge-danger { background: #fee2e2; color: #dc2626; }

.border-warning { border-left: 4px solid #f59e0b; }
.border-danger { border-left: 4px solid #ef4444; }
.text-warning { color: #d97706; }
.text-danger { color: #dc2626; }
.text-muted { color: #94a3b8; }
</style>