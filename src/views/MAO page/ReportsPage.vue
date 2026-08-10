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
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.reports-page {
  --color-canvas: #F5F4EE;
  --color-surface: #FFFFFF;
  --color-surface-alt: #FBFAF4;
  --color-ink: #23261F;
  --color-ink-soft: #5B6156;
  --color-border: #E2DFD2;
  --color-primary: #2F5D3A;
  --color-primary-dark: #1F3F27;
  --color-primary-soft: #E4EEE3;
  --color-accent: #C99A2E;
  --color-accent-soft: #F5E7C2;
  --color-danger: #B1472E;
  --color-danger-soft: #F5DCD3;
  --color-sky: #3E7CA6;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-mono: 'IBM Plex Mono', 'SFMono-Regular', monospace;

  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-body);
  min-height: 100vh;
}

*, *::before, *::after { box-sizing: border-box; }

/* ---------- Shell layout ---------- */
.reports-shell {
  display: grid;
  grid-template-columns: 236px 1fr;
  min-height: 100vh;
}

@media (max-width: 900px) {
  .reports-shell { grid-template-columns: 1fr; }
}

/* ---------- Sidebar ---------- */
.report-nav {
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  padding: 24px 14px;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 236px;
  align-self: start;
  transition: width 0.18s ease, padding 0.18s ease;
}

.reports-shell { transition: grid-template-columns 0.18s ease; }
.reports-shell:has(.report-nav--collapsed) { grid-template-columns: 72px 1fr; }

.report-nav--collapsed { width: 72px; padding: 24px 10px; }
.report-nav--collapsed .nav-brand-text,
.report-nav--collapsed .nav-label { display: none; }
.report-nav--collapsed .nav-brand { justify-content: center; padding: 0; }
.report-nav--collapsed .nav-tab,
.report-nav--collapsed .nav-collapse-btn { justify-content: center; padding: 9px; }
.report-nav--collapsed .nav-tab--active::before { left: -10px; }
.report-nav--collapsed svg polyline { transform-origin: 12px 12px; transform: rotate(180deg); }

@media (max-width: 900px) {
  .report-nav {
    position: static;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    flex-direction: row;
    align-items: center;
    padding: 14px;
    overflow-x: auto;
    gap: 16px;
  }
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  flex-shrink: 0;
}
.nav-brand-mark { font-size: 22px; line-height: 1; }
.nav-brand-text { display: flex; flex-direction: column; }
.nav-brand-eyebrow {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent);
  font-weight: 600;
}
.nav-brand-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary-dark);
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
@media (max-width: 900px) {
  .nav-list { flex-direction: row; }
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-ink-soft);
  cursor: pointer;
  text-align: left;
  position: relative;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.nav-tab:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
.nav-tab:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.nav-tab--active {
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
  font-weight: 600;
}
.nav-tab--active::before {
  content: '';
  position: absolute;
  left: -14px;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 2px;
  background: var(--color-accent);
}
@media (max-width: 900px) {
  .nav-tab--active::before { left: 0; top: auto; bottom: -8px; width: auto; right: 0; height: 3px; }
}
.nav-icon {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  display: inline-flex;
}
.nav-icon :deep(svg) { width: 100%; height: 100%; }

.nav-collapse-btn {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.nav-collapse-btn:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
.nav-collapse-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.nav-collapse-btn svg { width: 16px; height: 16px; flex-shrink: 0; transition: transform 0.18s ease; }

@media (max-width: 900px) {
  .nav-collapse-btn { display: none; }
  .report-nav--collapsed { width: auto; }
}

/* ---------- Main ---------- */
.reports-main { min-width: 0; }
.reports-content {
  max-width: 1360px;
  margin: 0 auto;
  padding: 32px 28px 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
@media (max-width: 640px) {
  .reports-content { padding: 20px 16px 48px; }
}

/* ---------- Header ---------- */
.reports-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.eyebrow {
  display: block;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-accent);
  font-weight: 600;
  margin-bottom: 4px;
}
.reports-title {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 600;
  color: var(--color-primary-dark);
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}
.reports-subtitle {
  font-size: 13.5px;
  color: var(--color-ink-soft);
  margin: 0;
}

/* ---------- Buttons ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}
.btn:active { transform: translateY(1px); }
.btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-primary:hover { background: var(--color-primary-dark); }
.btn-secondary {
  background: var(--color-surface);
  color: var(--color-ink);
  border-color: var(--color-border);
}
.btn-secondary:hover { border-color: var(--color-primary); color: var(--color-primary-dark); }
.btn-icon { width: 16px; height: 16px; }
.btn-icon--spin { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ---------- Cards ---------- */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
}
.card-title {
  font-family: var(--font-body);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 14px;
}

/* ---------- Filters ---------- */
.filters-card { padding: 18px 20px; }
.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr) auto;
  gap: 14px;
  align-items: end;
}
@media (max-width: 900px) {
  .filters-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .filters-grid { grid-template-columns: 1fr; }
}
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-ink-soft);
}
.field-input {
  font-family: var(--font-body);
  font-size: 13.5px;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: var(--color-surface-alt);
  color: var(--color-ink);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.field-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.field-action { justify-content: flex-end; }

/* ---------- Status states ---------- */
.status-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 500;
}
.status-loading {
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  color: var(--color-ink-soft);
}
.status-error {
  background: var(--color-danger-soft);
  border: 1px solid #e2b7a8;
  color: var(--color-danger);
}
.status-icon { width: 18px; height: 18px; flex-shrink: 0; }
.spinner {
  width: 16px; height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ---------- Panels ---------- */
.tab-panel { display: flex; flex-direction: column; gap: 20px; }

.tab-fade-enter-active, .tab-fade-leave-active { transition: opacity 0.18s ease; }
.tab-fade-enter-from, .tab-fade-leave-to { opacity: 0; }

/* ---------- Summary cards ---------- */
.summary-grid { display: grid; gap: 14px; }
.summary-grid--3 { grid-template-columns: repeat(3, 1fr); }
.summary-grid--4 { grid-template-columns: repeat(4, 1fr); }
.summary-grid--5 { grid-template-columns: repeat(5, 1fr); }
.summary-grid--6 { grid-template-columns: repeat(6, 1fr); }
@media (max-width: 900px) {
  .summary-grid--3, .summary-grid--4, .summary-grid--5, .summary-grid--6 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .summary-grid--3, .summary-grid--4, .summary-grid--5, .summary-grid--6 { grid-template-columns: 1fr; }
}
.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border-left: 3px solid var(--color-primary);
}
.summary-card--accent { border-left-color: var(--color-accent); }
.summary-label {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-ink-soft);
}
.summary-value {
  font-family: var(--font-mono);
  font-size: 21px;
  font-weight: 600;
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
}

/* ---------- Charts ---------- */
.chart-grid { display: grid; gap: 16px; }
.chart-grid--2 { grid-template-columns: repeat(2, 1fr); }
.chart-grid--3 { grid-template-columns: repeat(3, 1fr); }
@media (max-width: 900px) {
  .chart-grid--2, .chart-grid--3 { grid-template-columns: 1fr; }
}

/* ---------- Tables ---------- */
.table-card { padding: 20px 20px 8px; }
.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead th {
  position: sticky;
  top: 0;
  background: var(--color-surface-alt);
  text-align: left;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-ink-soft);
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.data-table tbody td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-ink);
}
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: var(--color-surface-alt); }
.data-table tbody tr.row-warning { background: var(--color-accent-soft); }
.text-right { text-align: right; }
.num-cell { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.font-medium { font-weight: 600; }
.text-muted { color: var(--color-ink-soft); }
.empty-row { text-align: center; padding: 18px; color: var(--color-ink-soft); font-style: italic; }

/* ---------- Badges ---------- */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.badge-subtle { background: var(--color-primary-soft); color: var(--color-primary-dark); }
.badge-warning { background: var(--color-accent-soft); color: #8A6410; }
.badge-danger { background: var(--color-danger-soft); color: var(--color-danger); }

/* ---------- Alert cards ---------- */
.border-warning { border-color: #E4C77E; }
.border-danger { border-color: #E2B7A8; }
.text-warning { color: #8A6410; }
.text-danger { color: var(--color-danger); }

.simple-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.simple-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 13px;
}
.simple-list-item:last-child { border-bottom: none; }
.simple-list-empty { color: var(--color-ink-soft); font-style: italic; font-size: 13px; padding: 6px 0; }

/* ---------- Motion & accessibility ---------- */
@media (prefers-reduced-motion: reduce) {
  .btn-icon--spin, .spinner { animation: none; }
  .tab-fade-enter-active, .tab-fade-leave-active { transition: none; }
}
</style>