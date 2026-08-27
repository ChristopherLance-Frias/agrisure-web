<template>
  <div class="layout">
    <div class="main-wrapper">

      <!-- ============================== SIDEBAR NAV ============================== -->
      <aside class="report-nav" :class="{ 'report-nav--collapsed': sidebarCollapsed }">
        <div class="nav-brand">
          <span class="nav-brand-mark"></span>
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
      <header class="top-header">
        <div class="header-title-group">
          <h1>Reports &amp; Records</h1>
          <p>Monitor farmers, crop insurance, damage claims, distribution, and inventory</p>
        </div>

        <div class="header-actions">
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

      <!-- ============================== MAIN ============================== -->
      <main class="body">
          <!-- Filters -->
          <div class="card filters-card">
            <div class="filters-grid">

              <div class="field">
                <label class="field-label">Barangay</label>
                <select v-model="filters.barangay_id" class="field-input">
                  <option value="">All Barangays</option>
                  <option v-for="b in barangayOptions" :key="b.id" :value="b.id">
                    {{ b.name }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label class="field-label">Year</label>
                <input v-model="filters.year" type="number" placeholder="2026" class="field-input" />
              </div>
              <div class="field field-action">
                <button class="btn btn-secondary" @click="clearFilters">Clear Filters</button>
              </div>
              <div class="field field-action">
                <button class="btn btn-primary" @click="exportActiveTab" :disabled="loading[activeTab]">
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m-9 6h12a2 2 0 002-2V7a2 2 0 00-2-2h-4l-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Export {{ activeTabLabel }} to Excel
                </button>
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
      </main>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import VueApexCharts from 'vue3-apexcharts'
import ExcelJS from 'exceljs'
import Chart from 'chart.js/auto'

const API_BASE = 'https://sanagustinagrisure.com'

// ---------------------------------------------------------------------------
// THEME — matches your dashboard palette
// ---------------------------------------------------------------------------
const THEME = {
  primary:      'FF2F5D3A', // deep green (brand)
  primaryDark:  'FF1F3F27',
  primaryLight: 'FFEAF1EA',
  accentGold:   'FFC99A2E',
  accentBlue:   'FF3E7CA6',
  danger:       'FFB1472E',
  warning:      'FFC99A2E',
  headerText:   'FFFFFFFF',
  bodyText:     'FF1F2937',
  border:       'FFD9D9D9',
  bandEven:     'FFF7F9F7',
  white:        'FFFFFFFF',
}

const CHART_PALETTE = ['#2F5D3A', '#5B8C5A', '#C99A2E', '#3E7CA6', '#B1472E', '#4E6E81', '#9C6B30', '#7A5C3E']

// ---------------------------------------------------------------------------
// LOW-LEVEL STYLE HELPERS (module scope — not Vue methods, called with args)
// ---------------------------------------------------------------------------

/** Style a header row: brand fill, white bold text, freeze + autofilter-ready. */
function styleHeaderRow(ws, rowIndex = 1) {
  const row = ws.getRow(rowIndex)
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: THEME.headerText }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.primary } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: THEME.primaryDark } },
      bottom: { style: 'thin', color: { argb: THEME.primaryDark } },
    }
  })
  row.height = 24
}

/** Zebra-stripe body rows + hairline borders. */
function bandRows(ws, startRow = 2, endRow = ws.rowCount) {
  for (let i = startRow; i <= endRow; i++) {
    const row = ws.getRow(i)
    const isEven = (i - startRow) % 2 === 1
    row.eachCell((cell) => {
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.bandEven } }
      }
      cell.border = { bottom: { style: 'hair', color: { argb: THEME.border } } }
      cell.font = { ...(cell.font || {}), color: { argb: THEME.bodyText }, size: 10.5 }
      if (!cell.alignment) cell.alignment = { vertical: 'middle' }
    })
  }
}

/** Auto-fit column widths based on content length. */
function autoWidth(ws, { min = 12, max = 42 } = {}) {
  ws.columns.forEach((col) => {
    let widest = min
    col.eachCell({ includeEmpty: true }, (cell) => {
      const len = cell.value != null ? String(cell.value).length : 0
      if (len + 3 > widest) widest = len + 3
    })
    col.width = Math.min(widest, max)
  })
}

/**
 * Writes a header + data table starting at a given row, with per-column
 * number formats and optional row-level conditional fill.
 *
 * columns: [{ header, key, format?: 'number'|'currency'|'text', width? }]
 * rowStyler?: (row, rawDataItem) => void   // for conditional highlighting
 */
function writeTable(ws, { startRow = 1, columns, data, rowStyler }) {
  const headerRow = ws.getRow(startRow)
  columns.forEach((col, i) => { headerRow.getCell(i + 1).value = col.header })
  styleHeaderRow(ws, startRow)

  const numFmt = { number: '#,##0', currency: '"₱"#,##0.00', text: undefined }

  ;(data || []).forEach((item, rIdx) => {
    const row = ws.getRow(startRow + 1 + rIdx)
    columns.forEach((col, cIdx) => {
      const cell = row.getCell(cIdx + 1)
      cell.value = item[col.key] ?? ''
      const fmt = numFmt[col.format]
      if (fmt) cell.numFmt = fmt
      cell.alignment = { vertical: 'middle', horizontal: col.format ? 'right' : 'left' }
    })
    if (rowStyler) rowStyler(row, item)
  })

  bandRows(ws, startRow + 1, startRow + (data || []).length)
  ws.autoFilter = {
    from: { row: startRow, column: 1 },
    to: { row: startRow, column: columns.length },
  }
  autoWidth(ws)
  return startRow + (data || []).length // last written row
}

/**
 * Normalizes a data source into an array of rows, whether the API sent
 * an array already (e.g. [{ group: '18-25', total: 12 }]) or a plain
 * object map (e.g. { '18-25': 12 }). Prevents ".map is not a function"
 * crashes when a backend endpoint returns one shape instead of the other.
 */
function toRows(source, labelKey, valueKey) {
  if (Array.isArray(source)) return source
  if (source && typeof source === 'object') {
    return Object.entries(source).map(([k, v]) => ({ [labelKey]: k, [valueKey]: v }))
  }
  return []
}

/** Adds a red/amber fill to a row's first N cells — for low-stock, denied, etc. */
function highlightRow(row, colCount, argb) {
  for (let c = 1; c <= colCount; c++) {
    row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }
  }
}

// ---------------------------------------------------------------------------
// COVER / SUMMARY SHEET — KPI "cards" as merged, colored cells
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// COVER / SUMMARY SHEET
// Clean 2-column × 2-row KPI layout
// ---------------------------------------------------------------------------
function buildCoverSheet(wb, { title, subtitle, kpis, barangayLabel, dateStr }) {
  const ws = wb.addWorksheet('Summary', {
    views: [{ showGridLines: false }]
  })

  // Layout:
  // A = left margin
  // B-C = KPI 1
  // D-E = KPI 2
  // F = right margin
  ws.columns = [
    { width: 3 },
    { width: 22 },
    { width: 22 },
    { width: 22 },
    { width: 22 },
    { width: 3 },
  ]

  // ============================================================
  // REPORT HEADER
  // ============================================================

  ws.mergeCells('B2:E2')

  const titleCell = ws.getCell('B2')
  titleCell.value = title

  titleCell.font = {
    bold: true,
    size: 18,
    color: { argb: THEME.primaryDark }
  }

  titleCell.alignment = {
    vertical: 'middle'
  }

  ws.getRow(2).height = 26

  // Subtitle
  ws.mergeCells('B3:E3')

  const subCell = ws.getCell('B3')
  subCell.value =
    subtitle || 'Municipal Agriculture Office — Field Records'

  subCell.font = {
    italic: true,
    size: 10.5,
    color: { argb: 'FF6B7280' }
  }

  subCell.alignment = {
    vertical: 'middle'
  }

  ws.getRow(3).height = 20

  ws.mergeCells('B4:E4')

  const infoCell = ws.getCell('B4')

  infoCell.value =
    `Barangay: ${barangayLabel}   |   Generated: ${dateStr}`

  infoCell.font = {
    size: 10,
    color: { argb: 'FF6B7280' }
  }

  infoCell.alignment = {
    vertical: 'middle'
  }

  ws.getRow(4).height = 20

  // ============================================================
  // KEY INDICATORS SECTION
  // ============================================================

  ws.mergeCells('B6:E6')

  const sectionTitle = ws.getCell('B6')

  sectionTitle.value = 'KEY INDICATORS'

  sectionTitle.font = {
    bold: true,
    size: 11,
    color: { argb: THEME.primaryDark }
  }

  sectionTitle.alignment = {
    vertical: 'middle'
  }

  ws.getRow(6).height = 22

  const kpiPositions = [
    {
      labelRange: 'B8:C8',
      valueRange: 'B9:C9',
      startCell: 'B8',
      valueCell: 'B9'
    },
    {
      labelRange: 'D8:E8',
      valueRange: 'D9:E9',
      startCell: 'D8',
      valueCell: 'D9'
    },
    {
      labelRange: 'B11:C11',
      valueRange: 'B12:C12',
      startCell: 'B11',
      valueCell: 'B12'
    },
    {
      labelRange: 'D11:E11',
      valueRange: 'D12:E12',
      startCell: 'D11',
      valueCell: 'D12'
    },
  ]

  kpis.slice(0, 4).forEach((kpi, index) => {
    const position = kpiPositions[index]

    if (!position) return

    ws.mergeCells(position.labelRange)
    ws.mergeCells(position.valueRange)

    const labelCell = ws.getCell(position.startCell)
    const valueCell = ws.getCell(position.valueCell)

    labelCell.value = String(kpi.label || '').toUpperCase()

    labelCell.font = {
      bold: true,
      size: 10,
      color: { argb: THEME.headerText }
    }

    labelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: THEME.primary
      }
    }

    labelCell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true
    }

    // ----------------------------------------------------------
    // Value
    // ----------------------------------------------------------

    valueCell.value = kpi.value ?? '—'

    valueCell.font = {
      bold: true,
      size: 18,
      color: { argb: THEME.primaryDark }
    }

    valueCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: 'FFF4F8F5'
      }
    }

    valueCell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true
    }

    // ----------------------------------------------------------
    // Borders
    // ----------------------------------------------------------

    const labelStart = ws.getCell(position.startCell)
    const valueStart = ws.getCell(position.valueCell)

    labelStart.border = {
      top: {
        style: 'thin',
        color: { argb: 'FFD8E5DC' }
      },
      left: {
        style: 'thin',
        color: { argb: 'FFD8E5DC' }
      },
      right: {
        style: 'thin',
        color: { argb: 'FFD8E5DC' }
      }
      // no bottom border between label and value
    }

    valueStart.border = {
      bottom: {
        style: 'thin',
        color: { argb: 'FFD8E5DC' }
      },
      left: {
        style: 'thin',
        color: { argb: 'FFD8E5DC' }
      },
      right: {
        style: 'thin',
        color: { argb: 'FFD8E5DC' }
      }
    }
  })

  // Row heights
  ws.getRow(8).height = 22
  ws.getRow(9).height = 34

  ws.getRow(11).height = 22
  ws.getRow(12).height = 34

  // ============================================================
  // REPORT CONTENT
  // ============================================================

  ws.mergeCells('B15:E15')

  const contentTitle = ws.getCell('B15')

  contentTitle.value = 'REPORT CONTENT'

  contentTitle.font = {
    bold: true,
    size: 11,
    color: { argb: THEME.primaryDark }
  }

  contentTitle.alignment = {
    vertical: 'middle'
  }

  ws.getRow(15).height = 22

  const contentItems = [
    'Farmer demographics',
    'Farmer distribution by barangay',
    'Ranked analytical data',
    'Key analytical insights',
  ]

  contentItems.forEach((item, index) => {
    const row = 16 + index

    ws.mergeCells(`B${row}:E${row}`)

    const cell = ws.getCell(`B${row}`)

    cell.value = `•  ${item}`

    cell.font = {
      size: 10.5,
      color: { argb: THEME.bodyText }
    }

    cell.alignment = {
      vertical: 'middle'
    }

    ws.getRow(row).height = 19
  })

  // ============================================================
  // FOOTER
  // ============================================================

  ws.mergeCells('B22:E22')

  const footer = ws.getCell('B22')

  footer.value =
    'Generated from AgriSure Municipal Agriculture Office analytics.'

  footer.font = {
    italic: true,
    size: 9,
    color: { argb: 'FF94A3B8' }
  }

  footer.alignment = {
    vertical: 'middle'
  }

  ws.getRow(22).height = 20

  // ============================================================
  // PAGE SETUP
  // ============================================================

  ws.pageSetup = {
    orientation: 'portrait',
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    }
  }

  return ws
}

// ---------------------------------------------------------------------------
// ANALYTICS HELPERS
// ---------------------------------------------------------------------------

/** Adds % of total + rank to a flat [{name/label, total}] array. */
function withShareAndRank(rows, valueKey) {
  const list = rows || []
  const total = list.reduce((sum, r) => sum + (Number(r[valueKey]) || 0), 0)
  const ranked = [...list]
    .sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0))
    .map((r, i) => ({ ...r, rank: i + 1 }))
  return ranked.map((r) => ({
    ...r,
    share: total ? `${((r[valueKey] / total) * 100).toFixed(1)}%` : '0.0%',
  }))
}

/** Simple insights text block: top performer, biggest MoM swing, concentration. */
function buildInsights(ws, startRow, lines) {
  const header = ws.getCell(`A${startRow}`)
  header.value = 'Key Insights'
  header.font = { bold: true, size: 12, color: { argb: THEME.primaryDark } }
  lines.forEach((line, i) => {
    const cell = ws.getCell(`A${startRow + 1 + i}`)
    cell.value = `•  ${line}`
    cell.font = { size: 10.5, color: { argb: THEME.bodyText } }
  })
  return startRow + 1 + lines.length
}

/** Ordered month labels shared by every monthly-trend export. */
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Normalizes any monthly source (array of {month, value} OR an object map
 * keyed 1–12) into a full Jan–Dec array, filling gaps with 0 so charts and
 * MoM tables never skip a month just because the API omitted it.
 */
function monthlyRows(source, valueKey = 'total') {
  const rows = toRows(source, 'month', valueKey)
  const map = {}
  rows.forEach((r) => { map[Number(r.month)] = Number(r[valueKey]) || 0 })
  return MONTH_LABELS.map((monthLabel, i) => ({
    month: i + 1,
    monthLabel,
    [valueKey]: map[i + 1] || 0,
  }))
}

/** Month-over-month % change for monthly trend arrays [{month, total|amount}]. */
function withMoMChange(rows, valueKey) {
  const list = rows || []
  return list.map((r, i) => {
    if (i === 0) return { ...r, momChange: '—' }
    const prev = Number(list[i - 1][valueKey]) || 0
    const curr = Number(r[valueKey]) || 0
    if (prev === 0) return { ...r, momChange: curr > 0 ? '+100.0%' : '0.0%' }
    const pct = ((curr - prev) / prev) * 100
    return { ...r, momChange: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` }
  })
}

const FONT_FAMILY = '"Segoe UI", Arial, sans-serif'

function renderChartToPNG({
  type,
  labels,
  values,
  label,
  colors = CHART_PALETTE,
  width = 520,
  height = 300,
}) {
  return new Promise((resolve) => {
    const scale = 2

    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale

    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')

    ctx.scale(scale, scale)

    const isHorizontalBar = type === 'bar'

    const chartConfig = {
      type,
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,

            backgroundColor:
              type === 'doughnut'
                ? colors.slice(0, values.length)
                : colors[0],

            borderColor:
              type === 'doughnut'
                ? '#FFFFFF'
                : colors[0],

            borderWidth:
              type === 'doughnut'
                ? 2
                : 0,

            borderRadius:
              type === 'bar'
                ? 5
                : 0,

            barThickness:
              type === 'bar'
                ? 18
                : undefined,

            maxBarThickness:
              type === 'bar'
                ? 22
                : undefined,

            hoverOffset:
              type === 'doughnut'
                ? 4
                : 0,
          },
        ],
      },

      options: {
        responsive: false,
        animation: false,

        maintainAspectRatio: false,

        layout: {
          padding: {
            top: 12,
            right: 18,
            bottom: 12,
            left: 18,
          },
        },

        plugins: {
          legend: {
            display: type === 'doughnut',

            position: 'bottom',

            labels: {
              font: {
                family: FONT_FAMILY,
                size: 10,
              },

              padding: 14,

              usePointStyle: true,

              pointStyle: 'circle',
            },
          },

          title: {
            display: true,

            text: label,

            color: '#173B2A',

            font: {
              family: FONT_FAMILY,
              size: 14,
              weight: '600',
            },

            padding: {
              top: 4,
              bottom: 18,
            },
          },

          tooltip: {
            enabled: false,
          },
        },

        scales:
          type === 'doughnut'
            ? {}
            : {
                x: {
                  beginAtZero: true,

                  grid: {
                    display: false,
                    drawBorder: false,
                  },

                  border: {
                    display: false,
                  },

                  ticks: {
                    font: {
                      family: FONT_FAMILY,
                      size: 9,
                    },

                    color: '#64748B',

                    precision: 0,
                  },
                },

                y: {
                  beginAtZero: true,

                  grid: {
                    color: '#E5E7EB',
                    drawBorder: false,
                  },

                  border: {
                    display: false,
                  },

                  ticks: {
                    font: {
                      family: FONT_FAMILY,
                      size: 9,
                    },

                    color: '#475569',

                    padding: 8,
                  },
                },
              },

        indexAxis:
          isHorizontalBar
            ? 'y'
            : 'x',
      },
    }

    const chart = new Chart(ctx, chartConfig)

    requestAnimationFrame(() => {
      const base64 = canvas.toDataURL('image/png', 1.0)

      chart.destroy()

      resolve(base64)
    })
  })
}

async function embedChart(
  wb,
  ws,
  {
    anchorCell,
    type,
    labels,
    values,
    label,
    width = 520,
    height = 300,
    colors = CHART_PALETTE,
  }
) {
  const base64 = await renderChartToPNG({
    type,
    labels,
    values,
    label,
    width,
    height,
    colors,
  })

  const imageId = wb.addImage({
    base64,
    extension: 'png',
  })

  ws.addImage(imageId, {
    tl: {
      col: anchorCell.col,
      row: anchorCell.row,
    },

    ext: {
      width,
      height,
    },
  })
}

async function saveWorkbook(wb, filenameBase, barangayLabel) {
  const dateStr = new Date().toISOString().split('T')[0]
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filenameBase}_${barangayLabel}_${dateStr}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

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
        barangay_id: '',
        crop_type: '',
        year: 2026
      },
      barangayOptions: [],
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
      currentUser: { name: 'Christopher', role: 'MAO Officer', initials: 'CP' },
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
    ex() { return this.data.executive },
    activeTabLabel() {
      const t = this.tabs.find(t => t.key === this.activeTab)
      return t ? t.label : ''
    }
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
    this.fetchBarangays()
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle)
  },
  methods: {

    _barangayLabel() {
      return this.filters.barangay_id
        ? (this.barangayOptions.find((b) => b.id === this.filters.barangay_id)?.name || 'AllBarangays')
        : 'AllBarangays'
    },
    _dateStr() {
      return new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    },

    async exportOverview() {
      if (!this.ov) return
      const wb = new ExcelJS.Workbook()
      wb.creator = 'MAO Field Records'

      buildCoverSheet(wb, {
        title: 'Overview Report',
        kpis: this.summaryEntries(this.ov.summary),
        barangayLabel: this._barangayLabel(),
        dateStr: this._dateStr(),
      })

      await saveWorkbook(wb, 'Overview_Report', this._barangayLabel())
    },

async exportFarmers() {
  if (!this.fa) return

  const wb = new ExcelJS.Workbook()
  wb.creator = 'AgriSure - Municipal Agriculture Office'
  wb.created = new Date()

  buildCoverSheet(wb, {
    title: 'Farmers Analytical Report',
    subtitle: 'Farmer registration, demographics, and barangay distribution',
    kpis: this.summaryEntries(this.fa.summary),
    barangayLabel: this._barangayLabel(),
    dateStr: this._dateStr(),
  })

  const demographicsWs = wb.addWorksheet('Demographics', {
    views: [{ showGridLines: false }]
  })

  demographicsWs.columns = [
    { width: 24 },
    { width: 16 },
    { width: 18 },
    { width: 12 },
  ]

  demographicsWs.mergeCells('A1:D1')
  demographicsWs.getCell('A1').value = 'Farmer Demographics'
  demographicsWs.getCell('A1').font = {
    bold: true,
    size: 16,
    color: { argb: THEME.primaryDark }
  }

  demographicsWs.mergeCells('A2:D2')
  demographicsWs.getCell('A2').value =
    `Barangay: ${this._barangayLabel()}  |  Year: ${this.filters.year || 'All Years'}`

  demographicsWs.getCell('A2').font = {
    size: 10,
    color: { argb: 'FF6B7280' }
  }

  demographicsWs.getCell('A4').value = 'Sex Distribution'
  demographicsWs.getCell('A4').font = {
    bold: true,
    size: 12,
    color: { argb: THEME.primaryDark }
  }

  const sexRows = withShareAndRank(
    toRows(this.fa.sex_distribution, 'sex', 'total'),
    'total'
  )

  writeTable(demographicsWs, {
    startRow: 5,
    columns: [
      { header: 'Rank', key: 'rank', format: 'number' },
      { header: 'Sex', key: 'sex' },
      { header: 'Farmers', key: 'total', format: 'number' },
      { header: 'Share', key: 'share' },
    ],
    data: sexRows,
  })

  const civilStartRow = 10

  demographicsWs.getCell(`A${civilStartRow}`).value = 'Civil Status Distribution'
  demographicsWs.getCell(`A${civilStartRow}`).font = {
    bold: true,
    size: 12,
    color: { argb: THEME.primaryDark }
  }

  const civilRows = withShareAndRank(
    toRows(this.fa.civil_status_distribution, 'civil_status', 'total'),
    'total'
  )

  writeTable(demographicsWs, {
    startRow: civilStartRow + 1,
    columns: [
      { header: 'Rank', key: 'rank', format: 'number' },
      { header: 'Civil Status', key: 'civil_status' },
      { header: 'Farmers', key: 'total', format: 'number' },
      { header: 'Share', key: 'share' },
    ],
    data: civilRows,
  })

  const ageStartRow = 18

  demographicsWs.getCell(`A${ageStartRow}`).value = 'Age Group Distribution'
  demographicsWs.getCell(`A${ageStartRow}`).font = {
    bold: true,
    size: 12,
    color: { argb: THEME.primaryDark }
  }

  const ageRows = withShareAndRank(
    toRows(this.fa.age_groups, 'group', 'total'),
    'total'
  )

  writeTable(demographicsWs, {
    startRow: ageStartRow + 1,
    columns: [
      { header: 'Rank', key: 'rank', format: 'number' },
      { header: 'Age Group', key: 'group' },
      { header: 'Farmers', key: 'total', format: 'number' },
      { header: 'Share', key: 'share' },
    ],
    data: ageRows,
  })

  const barangayWs = wb.addWorksheet('Barangay Analysis', {
    views: [{ showGridLines: false }]
  })

  barangayWs.columns = [
    { width: 10 },
    { width: 30 },
    { width: 24 },
    { width: 20 },
  ]

  barangayWs.mergeCells('A1:D1')
  barangayWs.getCell('A1').value = 'Farmers by Barangay'
  barangayWs.getCell('A1').font = {
    bold: true,
    size: 16,
    color: { argb: THEME.primaryDark }
  }

  barangayWs.mergeCells('A2:D2')
  barangayWs.getCell('A2').value =
    'Ranked distribution of registered farmers across barangays'

  barangayWs.getCell('A2').font = {
    size: 10,
    color: { argb: 'FF6B7280' }
  }

  const barangayRows = withShareAndRank(
    toRows(this.fa.farmers_per_barangay, 'name', 'total'),
    'total'
  )

  const barangayLastRow = writeTable(barangayWs, {
    startRow: 4,
    columns: [
      { header: 'Rank', key: 'rank', format: 'number' },
      { header: 'Barangay', key: 'name' },
      { header: 'Registered Farmers', key: 'total', format: 'number' },
      { header: 'Municipal Share', key: 'share' },
    ],
    data: barangayRows,
  })

  const topBarangay = barangayRows[0]
  const secondBarangay = barangayRows[1]

  const topThreeShare = barangayRows
    .slice(0, 3)
    .reduce((sum, row) => {
      return sum + Number(String(row.share).replace('%', '')) || 0
    }, 0)

  buildInsights(barangayWs, barangayLastRow + 3, [
    topBarangay
      ? `${topBarangay.name} has the highest number of registered farmers with ${topBarangay.total} (${topBarangay.share}).`
      : 'No barangay farmer data available.',

    secondBarangay
      ? `${secondBarangay.name} ranks second with ${secondBarangay.total} registered farmers.`
      : 'No second-ranked barangay is available.',

    barangayRows.length
      ? `The top three barangays account for ${topThreeShare.toFixed(1)}% of the registered farmer population.`
      : 'No barangay distribution data available.',
  ])

  // ============================================================
  // 4. CHARTS
  // ============================================================

  const chartWs = wb.addWorksheet('Charts', {
    views: [{ showGridLines: false }]
  })

  // Make the chart sheet look intentional instead of empty.
  chartWs.columns = [
    { width: 4 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 4 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 4 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ]

  chartWs.mergeCells('B2:J2')
  chartWs.getCell('B2').value = 'Farmer Analytics'
  chartWs.getCell('B2').font = {
    bold: true,
    size: 18,
    color: { argb: THEME.primaryDark }
  }

  chartWs.mergeCells('B3:J3')
  chartWs.getCell('B3').value =
    `Visual summary | ${this._barangayLabel()} | ${this.filters.year || 'All Years'}`

  chartWs.getCell('B3').font = {
    size: 10,
    color: { argb: 'FF6B7280' }
  }

  // ------------------------------------------------------------
  // Chart 1 — Sex
  // ------------------------------------------------------------

  await embedChart(wb, chartWs, {
    anchorCell: { col: 1, row: 5 },
    type: 'doughnut',
    labels: sexRows.map(r => r.sex),
    values: sexRows.map(r => Number(r.total) || 0),
    label: 'Farmers by Sex',
    width: 460,
    height: 290,
  })

  // ------------------------------------------------------------
  // Chart 2 — Barangay
  // ------------------------------------------------------------

  const chartBarangays = barangayRows.slice(0, 10)

  await embedChart(wb, chartWs, {
    anchorCell: { col: 8, row: 5 },
    type: 'bar',
    labels: chartBarangays.map(r => r.name),
    values: chartBarangays.map(r => Number(r.total) || 0),
    label: 'Top 10 Barangays by Farmer Count',
    width: 520,
    height: 290,
  })

  // ============================================================
  // 5. FINAL FORMATTING
  // ============================================================

  // Keep the chart sheet visually clean.
  chartWs.getRow(1).height = 8
  chartWs.getRow(2).height = 26
  chartWs.getRow(3).height = 20

  // Freeze useful areas.
  demographicsWs.views = [
    {
      state: 'frozen',
      ySplit: 5,
      showGridLines: false
    }
  ]

  barangayWs.views = [
    {
      state: 'frozen',
      ySplit: 4,
      showGridLines: false
    }
  ]

  // Make the Summary sheet active when the workbook opens.
  wb.views = [
    {
      activeTab: 0,
      firstSheet: 0
    }
  ]

  // ============================================================
  // 6. SAVE
  // ============================================================

  await saveWorkbook(
    wb,
    'Farmers_Analytical_Report',
    this._barangayLabel()
  )
},

    // -----------------------------------------------------------------------
    // INVENTORY — conditional formatting for reorder / stockout risk
    // -----------------------------------------------------------------------
    async exportInventory() {
      if (!this.inv) return
      const wb = new ExcelJS.Workbook()
      wb.creator = 'MAO Field Records'

      buildCoverSheet(wb, {
        title: 'Inventory Report',
        kpis: this.summaryEntries(this.inv.summary),
        barangayLabel: this._barangayLabel(),
        dateStr: this._dateStr(),
      })

      const categoryRows = toRows(this.inv.category_distribution, 'category', 'total_quantity')
      const mostDistributedRows = toRows(this.inv.most_distributed, 'supply_name', 'distributed')

      const chartWs = wb.addWorksheet('Charts')
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 1 },
        type: 'doughnut',
        labels: categoryRows.map((r) => r.category),
        values: categoryRows.map((r) => r.total_quantity),
        label: 'Stock by Category',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 10, row: 1 },
        type: 'bar',
        labels: mostDistributedRows.map((r) => r.supply_name),
        values: mostDistributedRows.map((r) => r.distributed),
        label: 'Most Distributed Items',
      })

      const ws = wb.addWorksheet('Current Inventory')
      const lastRow = writeTable(ws, {
        columns: [
          { header: 'Supply Item', key: 'supply_name' },
          { header: 'Category', key: 'category' },
          { header: 'Available Qty', key: 'quantity', format: 'number' },
          { header: 'Unit', key: 'unit' },
          { header: 'Reorder Threshold', key: 'reorder_level', format: 'number' },
        ],
        data: Array.isArray(this.inv.current_inventory) ? this.inv.current_inventory : [],
        rowStyler: (row, item) => {
          if (Number(item.quantity) <= 0) {
            highlightRow(row, 5, THEME.danger)
            row.eachCell((c) => { c.font = { color: { argb: THEME.white }, bold: true } })
          } else if (Number(item.quantity) <= Number(item.reorder_level)) {
            highlightRow(row, 5, THEME.warning)
          }
        },
      })

      buildInsights(ws, lastRow + 3, [
        `${(this.inv.out_of_stock_items || []).length} item(s) are fully depleted and need immediate restock.`,
        `${(this.inv.low_stock || []).length} item(s) are at or below reorder threshold.`,
      ])

      await saveWorkbook(wb, 'Inventory_Report', this._barangayLabel())
    },

    // -----------------------------------------------------------------------
    // FARMS & CROPS
    // -----------------------------------------------------------------------
    async exportFarms() {
      if (!this.fr) return
      const wb = new ExcelJS.Workbook()
      wb.creator = 'MAO Field Records'

      buildCoverSheet(wb, {
        title: 'Farms & Crops Report',
        kpis: this.summaryEntries(this.fr.summary),
        barangayLabel: this._barangayLabel(),
        dateStr: this._dateStr(),
      })

      const cropRows = toRows(this.fr.crop_distribution, 'crop_type', 'total')
      const cropAreaRows = toRows(this.fr.crop_area_distribution, 'crop_type', 'total_area')
      const largestRows = toRows(this.fr.largest_agricultural_barangays, 'name', 'total_area')

      const chartWs = wb.addWorksheet('Charts')
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 1 },
        type: 'doughnut',
        labels: cropRows.map((r) => r.crop_type),
        values: cropRows.map((r) => r.total),
        label: 'Crop Type Distribution',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 10, row: 1 },
        type: 'bar',
        labels: cropAreaRows.map((r) => r.crop_type),
        values: cropAreaRows.map((r) => r.total_area),
        label: 'Farm Land Area per Crop (ha)',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 20 },
        type: 'bar',
        labels: largestRows.map((r) => r.name),
        values: largestRows.map((r) => r.total_area),
        label: 'Largest Agricultural Areas (ha)',
      })

      const dataWs = wb.addWorksheet('Farms per Barangay')
      const enriched = withShareAndRank(toRows(this.fr.farms_per_barangay, 'name', 'total_farms'), 'total_farms')
      const lastRow = writeTable(dataWs, {
        columns: [
          { header: 'Rank', key: 'rank', format: 'number' },
          { header: 'Barangay', key: 'name' },
          { header: 'Total Active Farms', key: 'total_farms', format: 'number' },
          { header: '% Share of Municipality', key: 'share' },
        ],
        data: enriched,
      })

      const top = enriched[0]
      buildInsights(dataWs, lastRow + 3, [
        `${top?.name || '—'} has the most active farms (${top?.total_farms ?? 0}, ${top?.share || '0%'} of the municipal total).`,
        `${enriched.length} barangay(s) reported active farm data for this period.`,
      ])

      await saveWorkbook(wb, 'Farms_Report', this._barangayLabel())
    },

    // -----------------------------------------------------------------------
    // INSURANCE
    // -----------------------------------------------------------------------
    async exportInsurance() {
      if (!this.ins) return
      const wb = new ExcelJS.Workbook()
      wb.creator = 'MAO Field Records'

      buildCoverSheet(wb, {
        title: 'Insurance Report',
        kpis: this.summaryEntries(this.ins.summary),
        barangayLabel: this._barangayLabel(),
        dateStr: this._dateStr(),
      })

      const statusRows = toRows(this.ins.status_distribution, 'status', 'total')
      const cropRows = toRows(this.ins.crop_distribution, 'crop_type', 'total')
      const topRows = toRows(this.ins.top_barangays, 'name', 'total')

      const chartWs = wb.addWorksheet('Charts')
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 1 },
        type: 'doughnut',
        labels: statusRows.map((r) => r.status),
        values: statusRows.map((r) => r.total),
        label: 'Application Status',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 10, row: 1 },
        type: 'doughnut',
        labels: cropRows.map((r) => r.crop_type),
        values: cropRows.map((r) => r.total),
        label: 'Insured Crop Breakdown',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 20 },
        type: 'bar',
        labels: topRows.map((r) => r.name),
        values: topRows.map((r) => r.total),
        label: 'Top Barangay Application Volumes',
      })

      const trendWs = wb.addWorksheet('Monthly Applications')
      const monthly = withMoMChange(monthlyRows(this.ins.monthly_applications, 'total'), 'total')
      const lastRow = writeTable(trendWs, {
        columns: [
          { header: 'Month', key: 'monthLabel' },
          { header: 'Applications', key: 'total', format: 'number' },
          { header: 'MoM Change', key: 'momChange' },
        ],
        data: monthly,
      })

      const peak = [...monthly].sort((a, b) => b.total - a.total)[0]
      buildInsights(trendWs, lastRow + 3, [
        `${peak?.monthLabel || '—'} had the highest application volume this period (${peak?.total ?? 0}).`,
      ])

      await saveWorkbook(wb, 'Insurance_Report', this._barangayLabel())
    },

    // -----------------------------------------------------------------------
    // DAMAGE REPORTS
    // -----------------------------------------------------------------------
    async exportDamageReports() {
      if (!this.dr) return
      const wb = new ExcelJS.Workbook()
      wb.creator = 'MAO Field Records'

      buildCoverSheet(wb, {
        title: 'Damage Reports',
        kpis: this.summaryEntries(this.dr.summary),
        barangayLabel: this._barangayLabel(),
        dateStr: this._dateStr(),
      })

      const causeRows = toRows(this.dr.damage_causes, 'damage_cause', 'total')
      const cropRows = toRows(this.dr.crop_damage, 'crop_type', 'total')
      const topRows = toRows(this.dr.top_barangays, 'name', 'total_reports')

      const chartWs = wb.addWorksheet('Charts')
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 1 },
        type: 'doughnut',
        labels: causeRows.map((r) => r.damage_cause),
        values: causeRows.map((r) => r.total),
        label: 'Primary Damage Causes',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 10, row: 1 },
        type: 'bar',
        labels: cropRows.map((r) => r.crop_type),
        values: cropRows.map((r) => r.total),
        label: 'Rice vs Corn Crop Damage',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 20 },
        type: 'line',
        labels: MONTH_LABELS,
        values: monthlyRows(this.dr.monthly_damage, 'total').map((r) => r.total),
        label: 'Monthly Damage Incident Trend',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 10, row: 20 },
        type: 'bar',
        labels: topRows.map((r) => r.name),
        values: topRows.map((r) => r.total_reports),
        label: 'Top Affected Barangays',
      })

      const dataWs = wb.addWorksheet('Top Barangays')
      const enriched = withShareAndRank(topRows, 'total_reports')
      const lastRow = writeTable(dataWs, {
        columns: [
          { header: 'Rank', key: 'rank', format: 'number' },
          { header: 'Barangay', key: 'name' },
          { header: 'Damage Reports', key: 'total_reports', format: 'number' },
          { header: '% Share of Reports', key: 'share' },
        ],
        data: enriched,
      })

      const top = enriched[0]
      buildInsights(dataWs, lastRow + 3, [
        `${top?.name || '—'} recorded the most damage reports (${top?.total_reports ?? 0}, ${top?.share || '0%'} of the total).`,
      ])

      await saveWorkbook(wb, 'Damage_Reports', this._barangayLabel())
    },

    // -----------------------------------------------------------------------
    // CLAIMS
    // -----------------------------------------------------------------------
    async exportClaims() {
      if (!this.cl) return
      const wb = new ExcelJS.Workbook()
      wb.creator = 'MAO Field Records'

      buildCoverSheet(wb, {
        title: 'Claims Report',
        kpis: this.summaryEntries(this.cl.summary),
        barangayLabel: this._barangayLabel(),
        dateStr: this._dateStr(),
      })

      const statusRows = toRows(this.cl.status_distribution, 'status', 'total')
      const cropRows = toRows(this.cl.crop_claims, 'crop_type', 'amount')
      const topRows = toRows(this.cl.top_barangays, 'name', 'total_amount')

      const chartWs = wb.addWorksheet('Charts')
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 1 },
        type: 'doughnut',
        labels: statusRows.map((r) => r.status),
        values: statusRows.map((r) => r.total),
        label: 'Claim Status Distribution',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 10, row: 1 },
        type: 'bar',
        labels: cropRows.map((r) => r.crop_type),
        values: cropRows.map((r) => r.amount),
        label: 'Claim Amount by Crop (₱)',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 20 },
        type: 'line',
        labels: MONTH_LABELS,
        values: monthlyRows(this.cl.monthly_claims, 'amount').map((r) => r.amount),
        label: 'Monthly Claim Disbursed Trend (₱)',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 10, row: 20 },
        type: 'bar',
        labels: topRows.map((r) => r.name),
        values: topRows.map((r) => r.total_amount),
        label: 'Top Barangays by Claim Amount',
      })

      const dataWs = wb.addWorksheet('Claims per Barangay')
      const barangayRows = toRows(this.cl.barangays, 'name', 'total_claims')
      const lastRow = writeTable(dataWs, {
        columns: [
          { header: 'Barangay', key: 'name' },
          { header: 'Total Claims', key: 'total_claims', format: 'number' },
          { header: 'Total Amount Disbursed', key: 'total_amount', format: 'currency' },
        ],
        data: barangayRows,
      })

      const topByAmount = [...barangayRows].sort((a, b) => (Number(b.total_amount) || 0) - (Number(a.total_amount) || 0))[0]
      buildInsights(dataWs, lastRow + 3, [
        `${topByAmount?.name || '—'} received the highest total claim disbursement.`,
      ])

      await saveWorkbook(wb, 'Claims_Report', this._barangayLabel())
    },

    // -----------------------------------------------------------------------
    // DISTRIBUTION
    // -----------------------------------------------------------------------
    async exportDistribution() {
      if (!this.dist) return
      const wb = new ExcelJS.Workbook()
      wb.creator = 'MAO Field Records'

      buildCoverSheet(wb, {
        title: 'Distribution Report',
        kpis: this.summaryEntries(this.dist.summary),
        barangayLabel: this._barangayLabel(),
        dateStr: this._dateStr(),
      })

      const suppliesRows = toRows(this.dist.supplies, 'supply_name', 'total_quantity')
      const topRows = toRows(this.dist.top_barangays, 'name', 'total')

      const chartWs = wb.addWorksheet('Charts')
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 1 },
        type: 'line',
        labels: MONTH_LABELS,
        values: monthlyRows(this.dist.monthly_distribution, 'total_events').map((r) => r.total_events),
        label: 'Monthly Distribution Activity',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 10, row: 1 },
        type: 'bar',
        labels: suppliesRows.map((r) => r.supply_name),
        values: suppliesRows.map((r) => r.total_quantity),
        label: 'Most Distributed Supplies',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 20 },
        type: 'bar',
        labels: topRows.map((r) => r.name),
        values: topRows.map((r) => r.total),
        label: 'Top Served Barangays',
      })

      const dataWs = wb.addWorksheet('Beneficiaries')
      const enriched = withShareAndRank(toRows(this.dist.beneficiaries, 'name', 'total'), 'total')
      const lastRow = writeTable(dataWs, {
        columns: [
          { header: 'Rank', key: 'rank', format: 'number' },
          { header: 'Barangay', key: 'name' },
          { header: 'Beneficiaries Count', key: 'total', format: 'number' },
          { header: '% Share', key: 'share' },
        ],
        data: enriched,
      })

      const top = enriched[0]
      buildInsights(dataWs, lastRow + 3, [
        `${top?.name || '—'} has the most beneficiaries served (${top?.total ?? 0}, ${top?.share || '0%'} of the total).`,
      ])

      await saveWorkbook(wb, 'Distribution_Report', this._barangayLabel())
    },

    // -----------------------------------------------------------------------
    // EXECUTIVE INSIGHTS
    // -----------------------------------------------------------------------
    async exportExecutive() {
      if (!this.ex) return
      const wb = new ExcelJS.Workbook()
      wb.creator = 'MAO Field Records'

      buildCoverSheet(wb, {
        title: 'Executive Insights',
        subtitle: 'Cross-program summary for municipal leadership',
        kpis: this.summaryEntries(this.ex.kpis),
        barangayLabel: this._barangayLabel(),
        dateStr: this._dateStr(),
      })

      const farmerRows = toRows(this.ex.top_barangays_by_farmers, 'name', 'total')
      const damageRows = toRows(this.ex.top_damage_barangays, 'name', 'total')
      const claimRows = toRows(this.ex.top_claim_barangays, 'name', 'amount')

      const chartWs = wb.addWorksheet('Charts')
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 1 },
        type: 'bar',
        labels: farmerRows.map((r) => r.name),
        values: farmerRows.map((r) => r.total),
        label: 'Top Farmers Concentration',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 10, row: 1 },
        type: 'bar',
        labels: damageRows.map((r) => r.name),
        values: damageRows.map((r) => r.total),
        label: 'Highest Damage Reports',
      })
      await embedChart(wb, chartWs, {
        anchorCell: { col: 0, row: 20 },
        type: 'bar',
        labels: claimRows.map((r) => r.name),
        values: claimRows.map((r) => r.amount),
        label: 'Highest Insurance Claims (₱)',
      })

      const ws = wb.addWorksheet('Critical Low Stock')
      const lowStockRows = toRows(this.ex.low_stock_supplies, 'supply_name', 'quantity')
      const lastRow = writeTable(ws, {
        columns: [
          { header: 'Supply Item', key: 'supply_name' },
          { header: 'Available Qty', key: 'quantity', format: 'number' },
          { header: 'Unit', key: 'unit' },
          { header: 'Reorder Threshold', key: 'reorder_level', format: 'number' },
        ],
        data: Array.isArray(this.ex.low_stock_supplies) ? this.ex.low_stock_supplies : [],
        rowStyler: (row) => highlightRow(row, 4, THEME.warning),
      })

      buildInsights(ws, lastRow + 3, [
        `${lowStockRows.length} supply item(s) currently sit at or below reorder threshold municipality-wide.`,
      ])

      await saveWorkbook(wb, 'Executive_Insights', this._barangayLabel())
    },

    // -----------------------------------------------------------------------
    // Router
    // -----------------------------------------------------------------------
    exportActiveTab() {
      const exporters = {
        overview: this.exportOverview,
        farmers: this.exportFarmers,
        farms: this.exportFarms,
        insurance: this.exportInsurance,
        damageReports: this.exportDamageReports,
        claims: this.exportClaims,
        distribution: this.exportDistribution,
        inventory: this.exportInventory,
        executive: this.exportExecutive,
      }
      const fn = exporters[this.activeTab]
      if (fn) fn.call(this)
    },

    // -----------------------------------------------------------------------
    // Data fetching / auth
    // -----------------------------------------------------------------------
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
    async fetchBarangays() {
      try {
        const url = API_BASE + '/api/barangays/list'
        const { data: res } = await axios.get(url, this.authHeaders())
        this.barangayOptions = res || []
      } catch (e) {
        console.error(e)
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

    /* ApexCharts Generator Options (unchanged — still used for the on-screen dashboard) */
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

* { box-sizing: border-box; }

.main-wrapper {
  display: grid;
  grid-template-columns: max-content 1fr;
  grid-template-rows: auto 1fr;
}

.body {
  grid-column: 2;
  grid-row: 2;
  overflow-y: auto;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ===================== SIDEBAR (new) ===================== */
.report-nav {
  grid-column: 1;
  grid-row: 1 / span 2;
  width: 232px;
  height: 100vh;
  background: #FFFFFF;
  border-right: 1px solid #EAF1EC;
  display: flex;
  flex-direction: column;
  padding: 1.1rem 0.85rem;
  gap: 1.5rem;
  transition: width 0.2s ease;
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
  padding: 0 0.35rem;
}

.nav-brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  box-shadow: 0 0 0 2px rgba(17, 109, 62, 0.15);
}

.nav-brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  white-space: nowrap;
}

.nav-brand-eyebrow {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
}

.nav-brand-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0F212F;
}

.report-nav--collapsed .nav-brand-text { display: none; }

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  overflow-y: auto;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border: none;
  background: transparent;
  border-radius: 9px;
  color: #5c6b64;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav-tab:hover { background: #F1F6F2; color: #0F212F; }

.nav-tab--active {
  background: rgba(17, 109, 62, 0.1);
  color: #116D3E;
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.nav-icon svg { width: 18px; height: 18px; }

.report-nav--collapsed .nav-tab { justify-content: center; padding: 10px 0; }
.report-nav--collapsed .nav-label { display: none; }

.nav-collapse-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border: 1px solid #EAF1EC;
  background: #F8FAF8;
  border-radius: 9px;
  color: #5c6b64;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.nav-collapse-btn:hover { background: #F1F6F2; color: #0F212F; }

.nav-collapse-btn svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.report-nav--collapsed .nav-collapse-btn { justify-content: center; }
.report-nav--collapsed .nav-collapse-btn .nav-label { display: none; }
.report-nav--collapsed .nav-collapse-btn svg { transform: rotate(180deg); }

/* ===================== BUTTONS (new: .btn base + spin icon) ===================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  border: none;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.28);
}
.btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

.btn-secondary {
  background: #F1F6F2;
  border: 1px solid #E0EAE3;
  color: #116D3E;
}
.btn-secondary:hover { background: #E7F0EC; }

.btn-icon { width: 16px; height: 16px; }
.btn-icon--spin { animation: spin 0.9s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ===================== FILTERS ===================== */
.filters-card { padding: 1.1rem 1.35rem; }

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 0.8fr auto;
  gap: 12px;
  align-items: end;
}

.field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }

.field-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
}

.field-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 500;
  color: #0F212F;
  background: #FFFFFF;
  font-family: inherit;
  transition: border-color 0.15s ease;
}
.field-input:focus { outline: none; border-color: #116D3E; }

select.field-input {
  padding-right: 30px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235c6b64' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
  appearance: none;
  cursor: pointer;
}

.field-action { justify-content: flex-end; }

/* ===================== LOADING / ERROR STATES ===================== */
.status-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 3rem 1rem;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  font-size: 0.85rem;
  color: #5c6b64;
}

.status-error { color: #C1473D; }
.status-icon { width: 18px; height: 18px; flex-shrink: 0; }

.spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2.5px solid #E0EAE3;
  border-top-color: #116D3E;
  animation: spin 0.7s linear infinite;
}

/* ===================== TAB TRANSITION ===================== */
.tab-fade-enter-active, .tab-fade-leave-active { transition: opacity 0.15s ease; }
.tab-fade-enter-from, .tab-fade-leave-to { opacity: 0; }

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ===================== CARD (new base, if not already shared) ===================== */
.card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
}

.card-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #0F212F;
  margin-bottom: 0.9rem;
}

.card-title.text-warning { color: #AC7A2F; }
.card-title.text-danger { color: #C1473D; }

.border-warning { border-color: rgba(210, 149, 57, 0.4); }
.border-danger { border-color: rgba(193, 71, 61, 0.35); }

/* ===================== SUMMARY GRIDS ===================== */
.summary-grid { display: grid; gap: 1rem; }
.summary-grid--3 { grid-template-columns: repeat(3, 1fr); }
.summary-grid--4 { grid-template-columns: repeat(4, 1fr); }
.summary-grid--5 { grid-template-columns: repeat(5, 1fr); }
.summary-grid--6 { grid-template-columns: repeat(6, 1fr); }

.summary-card {
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-card--accent {
  background: linear-gradient(150deg, #116D3E 0%, #0A5232 100%);
  border-color: transparent;
}
.summary-card--accent .summary-label { color: rgba(255, 255, 255, 0.7); }
.summary-card--accent .summary-value { color: #FFFFFF; }

.summary-label { font-size: 0.75rem; font-weight: 600; color: #5c6b64; }
.summary-value { font-size: 1.45rem; font-weight: 700; color: #0F212F; }

/* ===================== CHART GRIDS ===================== */
.chart-grid { display: grid; gap: 1rem; }
.chart-grid--2 { grid-template-columns: repeat(2, 1fr); }
.chart-grid--3 { grid-template-columns: repeat(3, 1fr); }

/* ===================== TABLE ===================== */
.table-card { padding: 1.25rem 1.35rem; }

.table-wrapper { overflow-x: auto; }

.data-table { width: 100%; border-collapse: collapse; }

.data-table thead th {
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
  padding: 10px 14px;
  background: #F1F6F2;
}

.data-table thead tr th:first-child { border-top-left-radius: 10px; border-bottom-left-radius: 10px; }
.data-table thead tr th:last-child { border-top-right-radius: 10px; border-bottom-right-radius: 10px; }

.data-table tbody td {
  font-size: 0.82rem;
  color: #0F212F;
  padding: 11px 14px;
  border-bottom: 1px solid #F1F6F2;
}

.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr.row-warning { background: rgba(210, 149, 57, 0.06); }

.text-right { text-align: right; }
.num-cell { font-variant-numeric: tabular-nums; }
.font-medium { font-weight: 700; }
.text-muted { color: #5c6b64; }
.text-warning { color: #AC7A2F; }
.text-danger { color: #C1473D; }

.empty-row {
  text-align: center;
  padding: 2rem 1rem;
  color: #5c6b64;
  font-size: 0.82rem;
}

/* ===================== BADGES ===================== */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}

.badge-subtle  { background: #F1F6F2; color: #5c6b64; }
.badge-warning { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.badge-danger  { background: rgba(193, 71, 61, 0.1); color: #C1473D; }

/* ===================== SIMPLE LISTS ===================== */
.simple-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.simple-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  background: #F8FAF8;
  border: 1px solid #EAF1EC;
  border-radius: 10px;
  font-size: 0.82rem;
  color: #0F212F;
}

.simple-list-empty {
  text-align: center;
  padding: 1.5rem 1rem;
  color: #5c6b64;
  font-size: 0.82rem;
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 1300px) {
  .summary-grid--5, .summary-grid--6 { grid-template-columns: repeat(3, 1fr); }
  .chart-grid--3 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 1100px) {
  .filters-grid { grid-template-columns: repeat(2, 1fr); }
  .summary-grid--4 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 900px) {
  .chart-grid--2, .chart-grid--3 { grid-template-columns: 1fr; }
  .summary-grid--3, .summary-grid--5, .summary-grid--6 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .summary-grid--3, .summary-grid--4, .summary-grid--5, .summary-grid--6 { grid-template-columns: 1fr; }
  .filters-grid { grid-template-columns: 1fr; }
}
</style>