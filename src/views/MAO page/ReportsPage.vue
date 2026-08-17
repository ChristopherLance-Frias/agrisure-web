<template>
  <div class="reports-page">
    <div class="reports-shell">

      <!-- ============================== SIDEBAR NAV ============================== -->
      <aside class="report-nav" :class="{ 'report-nav--collapsed': sidebarCollapsed }">
        <div class="nav-brand">
          <span class="nav-brand-mark">🌾</span>
          <div class="nav-brand-text">
            <span class="nav-brand-eyebrow">MAO Field Records</span>
            <span class="nav-brand-title">Reports</span>
          </div>
        </div>

        <nav class="nav-list" role="tablist" aria-label="Report categories">
          <button
            v-for="t in tabs" :key="t.key"
            class="nav-tab"
            :class="{ 'nav-tab--active': activeTab === t.key }"
            role="tab"
            :aria-selected="activeTab === t.key"
            :title="sidebarCollapsed ? t.label : null"
            @click="activeTab = t.key"
          >
            <span class="nav-icon" v-html="navIcons[t.key]"></span>
            <span class="nav-label">{{ t.label }}</span>
          </button>
        </nav>

        <button
          class="nav-collapse-btn"
          type="button"
          :aria-expanded="!sidebarCollapsed"
          aria-label="Toggle sidebar"
          @click="toggleSidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 6 9 12 15 18" />
          </svg>
          <span class="nav-label">Collapse</span>
        </button>
      </aside>

      <!-- ============================== MAIN ============================== -->
      <main class="reports-main">
        <div class="reports-content">

          <!-- Header -->
          <header class="reports-header">
            <div class="header-titles">
              <span class="eyebrow">Agricultural Analytics</span>
              <h1 class="reports-title">Reports &amp; Records</h1>
              <p class="reports-subtitle">Monitor farmers, crop insurance, damage claims, distribution, and inventory</p>
            </div>
            <button class="btn btn-primary" @click="refreshActive" :aria-busy="loading[activeTab]">
              <svg
                class="btn-icon"
                :class="{ 'btn-icon--spin': loading[activeTab] }"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
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

          <!-- Loading / Error States -->
          <div v-if="loading[activeTab]" class="status-card status-loading" aria-live="polite">
            <div class="spinner"></div>
            <span>Fetching analytic records…</span>
          </div>
          <div v-else-if="errors[activeTab]" class="status-card status-error" aria-live="polite">
            <svg class="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ errors[activeTab] }}</span>
          </div>

          <Transition name="tab-fade" mode="out-in">

            <!-- ============================== OVERVIEW ============================== -->
            <div v-if="!loading[activeTab] && !errors[activeTab] && activeTab === 'overview' && ov" key="overview" class="tab-panel">
              <div class="summary-grid summary-grid--5">
                <div v-for="s in summaryEntries(ov.summary)" :key="s.key" class="card summary-card">
                  <span class="summary-label">{{ s.label }}</span>
                  <span class="summary-value">{{ s.value }}</span>
                </div>
              </div>
            </div>

            <!-- ============================== FARMERS ============================== -->
            <div v-else-if="!loading[activeTab] && !errors[activeTab] && activeTab === 'farmers' && fa" key="farmers" class="tab-panel">
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
                  <apexchart type="bar" height="280" :options="barOptions(mapToRows(fa.age_groups, 'group', 'total'), 'group', '#2F5D3A')" :series="barSeries(mapToRows(fa.age_groups, 'group', 'total'), 'total', 'Farmers')" />
                </div>
                <div class="card">
                  <h3 class="card-title">Top Barangays by Farmer Count</h3>
                  <apexchart type="bar" height="280" :options="barOptions(fa.top_barangays, 'name', '#5B8C5A', true)" :series="barSeries(fa.top_barangays, 'total', 'Farmers')" />
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
            <div v-else-if="!loading[activeTab] && !errors[activeTab] && activeTab === 'farms' && fr" key="farms" class="tab-panel">
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
                  <apexchart type="bar" height="280" :options="barOptions(fr.crop_area_distribution, 'crop_type', '#C99A2E')" :series="barSeries(fr.crop_area_distribution, 'total_area', 'Hectares')" />
                </div>
              </div>

              <div class="card">
                <h3 class="card-title">Largest Agricultural Areas</h3>
                <apexchart type="bar" height="300" :options="barOptions(fr.largest_agricultural_barangays, 'name', '#3E7CA6', true)" :series="barSeries(fr.largest_agricultural_barangays, 'total_area', 'Hectares')" />
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
            <div v-else-if="!loading[activeTab] && !errors[activeTab] && activeTab === 'insurance' && ins" key="insurance" class="tab-panel">
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
                <apexchart type="area" height="280" :options="lineOptions('#3E7CA6')" :series="monthlySeries(ins.monthly_applications, 'total', 'Applications')" />
              </div>

              <div class="card">
                <h3 class="card-title">Top Barangay Application Volumes</h3>
                <apexchart type="bar" height="280" :options="barOptions(ins.top_barangays, 'name', '#4E6E81')" :series="barSeries(ins.top_barangays, 'total', 'Applications')" />
              </div>
            </div>

            <!-- ============================== DAMAGE REPORTS ============================== -->
            <div v-else-if="!loading[activeTab] && !errors[activeTab] && activeTab === 'damageReports' && dr" key="damageReports" class="tab-panel">
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
                  <apexchart type="bar" height="280" :options="barOptions(dr.crop_damage, 'crop_type', '#B1472E')" :series="barSeries(dr.crop_damage, 'total', 'Reports')" />
                </div>
              </div>

              <div class="card">
                <h3 class="card-title">Monthly Damage Incident Trend</h3>
                <apexchart type="area" height="280" :options="lineOptions('#B1472E')" :series="monthlySeries(dr.monthly_damage, 'total', 'Damage Reports')" />
              </div>

              <div class="card">
                <h3 class="card-title">Top 10 Most Affected Barangays</h3>
                <apexchart type="bar" height="300" :options="barOptions(dr.top_barangays, 'name', '#9C6B30', true)" :series="barSeries(dr.top_barangays, 'total_reports', 'Reports')" />
              </div>
            </div>

            <!-- ============================== CLAIMS ============================== -->
            <div v-else-if="!loading[activeTab] && !errors[activeTab] && activeTab === 'claims' && cl" key="claims" class="tab-panel">
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
                  <apexchart type="bar" height="280" :options="barOptions(cl.crop_claims, 'crop_type', '#2F5D3A')" :series="barSeries(cl.crop_claims, 'amount', 'Amount (₱)')" />
                </div>
              </div>

              <div class="card">
                <h3 class="card-title">Monthly Claim Disbursed Trend</h3>
                <apexchart type="area" height="280" :options="lineOptions('#2F5D3A')" :series="monthlySeries(cl.monthly_claims, 'amount', 'Claim Amount')" />
              </div>

              <div class="card">
                <h3 class="card-title">Top 10 Barangays by Claim Amount</h3>
                <apexchart type="bar" height="300" :options="barOptions(cl.top_barangays, 'name', '#1F3F27', true)" :series="barSeries(cl.top_barangays, 'total_amount', 'Amount (₱)')" />
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
            <div v-else-if="!loading[activeTab] && !errors[activeTab] && activeTab === 'distribution' && dist" key="distribution" class="tab-panel">
              <div class="summary-grid summary-grid--4">
                <div v-for="s in summaryEntries(dist.summary)" :key="s.key" class="card summary-card">
                  <span class="summary-label">{{ s.label }}</span>
                  <span class="summary-value">{{ s.value }}</span>
                </div>
              </div>

              <div class="card">
                <h3 class="card-title">Monthly Distribution Activity</h3>
                <apexchart type="area" height="280" :options="lineOptions('#4E6E81')" :series="monthlySeries(dist.monthly_distribution, 'total_events', 'Events')" />
              </div>

              <div class="chart-grid chart-grid--2">
                <div class="card">
                  <h3 class="card-title">Most Distributed Supplies</h3>
                  <apexchart type="bar" height="280" :options="barOptions(dist.supplies, 'supply_name', '#3E7CA6')" :series="barSeries(dist.supplies, 'total_quantity', 'Quantity')" />
                </div>
                <div class="card">
                  <h3 class="card-title">Top Served Barangays</h3>
                  <apexchart type="bar" height="280" :options="barOptions(dist.top_barangays, 'name', '#5B8C5A')" :series="barSeries(dist.top_barangays, 'total', 'Events')" />
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
            <div v-else-if="!loading[activeTab] && !errors[activeTab] && activeTab === 'inventory' && inv" key="inventory" class="tab-panel">
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
                  <apexchart type="bar" height="280" :options="barOptions(inv.most_distributed, 'supply_name', '#7A5C3E')" :series="barSeries(inv.most_distributed, 'distributed', 'Distributed Units')" />
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
            <div v-else-if="!loading[activeTab] && !errors[activeTab] && activeTab === 'executive' && ex" key="executive" class="tab-panel">
              <div class="summary-grid summary-grid--5">
                <div v-for="s in summaryEntries(ex.kpis)" :key="s.key" class="card summary-card summary-card--accent">
                  <span class="summary-label">{{ s.label }}</span>
                  <span class="summary-value">{{ s.value }}</span>
                </div>
              </div>

              <div class="chart-grid chart-grid--3">
                <div class="card">
                  <h3 class="card-title">Top Farmers Concentration</h3>
                  <apexchart type="bar" height="240" :options="barOptions(ex.top_barangays_by_farmers, 'name', '#2F5D3A')" :series="barSeries(ex.top_barangays_by_farmers, 'total', 'Farmers')" />
                </div>
                <div class="card">
                  <h3 class="card-title">Highest Damage Reports</h3>
                  <apexchart type="bar" height="240" :options="barOptions(ex.top_damage_barangays, 'name', '#B1472E')" :series="barSeries(ex.top_damage_barangays, 'total', 'Damage Reports')" />
                </div>
                <div class="card">
                  <h3 class="card-title">Highest Insurance Claims</h3>
                  <apexchart type="bar" height="240" :options="barOptions(ex.top_claim_barangays, 'name', '#C99A2E')" :series="barSeries(ex.top_claim_barangays, 'amount', 'Amount (₱)')" />
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

          </Transition>

        </div>
      </main>

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
      sidebarCollapsed: localStorage.getItem('mao_sidebar_collapsed') === 'true',
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
      navIcons: {
        overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
        farmers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.5-4 4-6 7.5-6s6 2 7.5 6" stroke-linecap="round"/></svg>',
        farms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20c0-8 4-14 15-15-1 10-6 15-15 15Z" stroke-linejoin="round"/><path d="M9 19c2-4 5-7 9-10" stroke-linecap="round"/></svg>',
        insurance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3Z" stroke-linejoin="round"/></svg>',
        damageReports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 4 22 20H2L12 4Z" stroke-linejoin="round"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/></svg>',
        claims: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="3" width="14" height="18" rx="1.5"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>',
        distribution: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="8" width="12" height="8"/><path d="M14 11h4l3 3v2h-7z"/><circle cx="7" cy="18.5" r="1.6" fill="currentColor" stroke="none"/><circle cx="17" cy="18.5" r="1.6" fill="currentColor" stroke="none"/></svg>',
        inventory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3 21 7.5 12 12 3 7.5 12 3Z" stroke-linejoin="round"/><path d="M3 7.5V16.5L12 21 21 16.5V7.5" stroke-linejoin="round"/><line x1="12" y1="12" x2="12" y2="21"/></svg>',
        executive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polyline points="3,17 9,11 13,15 21,5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="15,5 21,5 21,11" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      },
      data: {},
      loading: {},
      errors: {},
      loadedOnce: {},
      debounceHandle: null,
      // Harvest-themed data palette: paddy greens, palay gold, soil rust, sky, clay
      palette: ['#2F5D3A', '#C99A2E', '#3E7CA6', '#B1472E', '#7A5C3E', '#5B8C5A', '#9C6B30', '#4E6E81', '#8E3B46', '#6B7166']
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
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      localStorage.setItem('mao_sidebar_collapsed', this.sidebarCollapsed)
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
        legend: { position: 'bottom', fontSize: '12px', labels: { colors: '#5B6156' } },
        stroke: { width: 2, colors: ['#FFFFFF'] },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: '72%',
              labels: {
                show: true,
                total: { show: true, label: 'Total', fontSize: '12px', color: '#5B6156' }
              }
            }
          }
        }
      }
    },
    donutSeries(rows = [], valueKey) {
      return (rows || []).map(r => Number(r[valueKey]) || 0)
    },
    barOptions(rows = [], labelKey, primaryColor = '#2F5D3A', isHorizontal = false) {
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
            borderRadius: 4,
            columnWidth: '55%',
            barHeight: '60%'
          }
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories,
          labels: { style: { colors: '#5B6156', fontSize: '11px' } },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: { style: { colors: '#5B6156', fontSize: '11px' } }
        },
        grid: {
          borderColor: '#ECE9DC',
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
    lineOptions(primaryColor = '#2F5D3A') {
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
          labels: { style: { colors: '#5B6156', fontSize: '11px' } },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: { style: { colors: '#5B6156', fontSize: '11px' } }
        },
        grid: {
          borderColor: '#ECE9DC',
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
/* ==========================================================================
   AgriSure — Reports & Records Page
   Matches the base dashboard design system:
   greens #116D3E/#0A5232, ink #0F212F, muted #5c6b64, bg #F8FAF8,
   card border #EAF1EC, radius 16/12/9px, shadow 0 8px 22px rgba(15,33,47,.05)
   ========================================================================== */

* { box-sizing: border-box; }

.reports-page {
  height: 100vh;
  overflow: hidden;
  background: #F8FAF8;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.reports-shell {
  display: flex;
  height: 100vh;
}

/* ============================== SIDEBAR NAV ============================== */

.report-nav {
  width: 232px;
  flex-shrink: 0;
  background: #FFFFFF;
  border-right: 1px solid #E7F0EC;
  display: flex;
  flex-direction: column;
  padding: 1.1rem 0.9rem;
  transition: width 0.18s ease;
  overflow: hidden;
}

.report-nav--collapsed {
  width: 72px;
  padding: 1.1rem 0.6rem;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0.35rem 1.1rem;
  margin-bottom: 0.6rem;
  border-bottom: 1px solid #EAF1EC;
}

.nav-brand-mark {
  font-size: 1.3rem;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  background: rgba(17, 109, 62, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  white-space: nowrap;
}

.nav-brand-eyebrow {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.nav-brand-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: #0F212F;
}

.report-nav--collapsed .nav-brand-text { display: none; }

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow-y: auto;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  background: none;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  color: #5c6b64;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav-tab:hover {
  background: #F1F6F2;
  color: #116D3E;
}

.nav-tab--active {
  background: rgba(17, 109, 62, 0.1);
  color: #116D3E;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon svg { width: 100%; height: 100%; }

.report-nav--collapsed .nav-label { display: none; }
.report-nav--collapsed .nav-tab { justify-content: center; }

.nav-collapse-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  margin-top: 0.6rem;
  border-top: 1px solid #EAF1EC;
  padding-top: 0.9rem;
  background: none;
  border-left: none;
  border-right: none;
  border-bottom: none;
  color: #5c6b64;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.nav-collapse-btn:hover { color: #116D3E; }

.nav-collapse-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.18s ease;
}

.report-nav--collapsed .nav-collapse-btn svg { transform: rotate(180deg); }
.report-nav--collapsed .nav-collapse-btn { justify-content: center; }

/* ============================== MAIN ============================== */

.reports-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

.reports-content {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 1440px;
}

.reports-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.header-titles { display: flex; flex-direction: column; gap: 2px; }

.eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #116D3E;
}

.reports-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0F212F;
  letter-spacing: -0.01em;
}

.reports-subtitle {
  font-size: 0.82rem;
  color: #5c6b64;
}

/* ============================== BUTTONS ============================== */

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  border: none;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.28);
}

.btn-secondary {
  background: #F1F6F2;
  border: 1px solid #E0EAE3;
  color: #116D3E;
}
.btn-secondary:hover { background: #E7F0EC; }

.btn-icon { width: 15px; height: 15px; }
.btn-icon--spin { animation: spin 0.9s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ============================== CARDS ============================== */

.card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1.2rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
}

.card-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #0F212F;
  margin-bottom: 0.9rem;
}

.border-warning { border-color: rgba(210, 149, 57, 0.4); }
.border-danger { border-color: rgba(193, 71, 61, 0.4); }
.text-warning { color: #AC7A2F; }
.text-danger { color: #C1473D; }

/* ============================== FILTERS ============================== */

.filters-card { padding: 1rem 1.2rem; }

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr) auto;
  gap: 0.9rem;
  align-items: end;
}

.field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }

.field-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #5c6b64;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.field-input {
  padding: 8px 10px;
  border: 1.5px solid #E0EAE3;
  border-radius: 8px;
  font-size: 0.82rem;
  color: #0F212F;
  background: #FFFFFF;
  font-family: inherit;
  transition: border-color 0.15s ease;
}

.field-input:focus {
  outline: none;
  border-color: #116D3E;
}

.field-action { display: flex; }

/* ============================== STATUS STATES ============================== */

.status-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 1rem 1.2rem;
  border-radius: 14px;
  font-size: 0.84rem;
  font-weight: 600;
}

.status-loading {
  background: #F1F6F2;
  color: #116D3E;
  border: 1px solid #E0EAE3;
}

.status-error {
  background: rgba(193, 71, 61, 0.08);
  color: #C1473D;
  border: 1px solid rgba(193, 71, 61, 0.25);
}

.status-icon { width: 18px; height: 18px; flex-shrink: 0; }

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(17, 109, 62, 0.25);
  border-top-color: #116D3E;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ============================== TAB TRANSITION ============================== */

.tab-fade-enter-active, .tab-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tab-fade-enter-from { opacity: 0; transform: translateY(4px); }
.tab-fade-leave-to { opacity: 0; transform: translateY(-4px); }

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ============================== SUMMARY GRID ============================== */

.summary-grid {
  display: grid;
  gap: 0.9rem;
}

.summary-grid--3 { grid-template-columns: repeat(3, 1fr); }
.summary-grid--4 { grid-template-columns: repeat(4, 1fr); }
.summary-grid--5 { grid-template-columns: repeat(5, 1fr); }
.summary-grid--6 { grid-template-columns: repeat(6, 1fr); }

.summary-card {
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-card--accent {
  background: linear-gradient(150deg, rgba(17, 109, 62, 0.06), rgba(10, 82, 50, 0.02));
  border-color: rgba(17, 109, 62, 0.18);
}

.summary-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #5c6b64;
}

.summary-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #0F212F;
}

/* ============================== CHART GRID ============================== */

.chart-grid { display: grid; gap: 1rem; }
.chart-grid--2 { grid-template-columns: repeat(2, 1fr); }
.chart-grid--3 { grid-template-columns: repeat(3, 1fr); }

/* ============================== TABLES ============================== */

.table-card { padding: 1.2rem; }

.table-wrapper { overflow-x: auto; }

.data-table { width: 100%; border-collapse: collapse; }

.data-table thead th {
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
  padding: 8px 10px;
  background: #F1F6F2;
  white-space: nowrap;
}

.data-table tbody td {
  font-size: 0.82rem;
  color: #0F212F;
  padding: 10px;
  border-bottom: 1px solid #F1F6F2;
}

.data-table tbody tr:last-child td { border-bottom: none; }

.row-warning td { background: rgba(210, 149, 57, 0.06); }

.text-right { text-align: right; }
.num-cell { font-variant-numeric: tabular-nums; }
.font-medium { font-weight: 600; }
.text-muted { color: #5c6b64; }

.empty-row {
  text-align: center;
  color: #5c6b64;
  font-size: 0.8rem;
  padding: 1.2rem !important;
}

/* ============================== BADGES ============================== */

.badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}

.badge-subtle { background: #F1F6F2; color: #5c6b64; }
.badge-warning { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.badge-danger { background: rgba(193, 71, 61, 0.1); color: #C1473D; }

/* ============================== SIMPLE LISTS ============================== */

.simple-list { display: flex; flex-direction: column; gap: 4px; }

.simple-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 2px;
  border-bottom: 1px solid #F1F6F2;
  font-size: 0.82rem;
}

.simple-list-item:last-child { border-bottom: none; }

.simple-list-empty {
  font-size: 0.8rem;
  color: #5c6b64;
  padding: 0.6rem 2px;
}

/* ============================== RESPONSIVE ============================== */

@media (max-width: 1280px) {
  .summary-grid--5, .summary-grid--6 { grid-template-columns: repeat(3, 1fr); }
  .chart-grid--3 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 1024px) {
  .filters-grid { grid-template-columns: repeat(2, 1fr); }
  .field-action { grid-column: span 2; }
  .chart-grid--2, .chart-grid--3 { grid-template-columns: 1fr; }
  .summary-grid--4, .summary-grid--5, .summary-grid--6 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .reports-shell { flex-direction: column; }
  .report-nav {
    width: 100%;
    flex-direction: row;
    align-items: center;
    padding: 0.7rem 1rem;
    overflow-x: auto;
  }
  .nav-list { flex-direction: row; flex: none; }
  .nav-collapse-btn { display: none; }
  .reports-header { flex-direction: column; align-items: stretch; }
  .filters-grid { grid-template-columns: 1fr; }
  .field-action { grid-column: auto; }
  .summary-grid--3, .summary-grid--4, .summary-grid--5, .summary-grid--6 {
    grid-template-columns: repeat(2, 1fr);
  }
}nter-active, .tab-fade-leave-active { transition: none; }

</style>