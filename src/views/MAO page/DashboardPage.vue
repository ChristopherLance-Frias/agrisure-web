<template>
  <div class="flex h-screen overflow-hidden bg-[#F7F9F7] font-sans text-[#263238]">

    <!-- SIDEBAR -->
    <aside class="w-64 bg-[#1B5E20] text-white flex flex-col justify-between shrink-0 shadow-lg z-20">
      <div>
        <!-- Logo Section -->
        <div class="h-16 flex items-center px-6 bg-opacity-20 bg-black border-b border-green-800">
          <i class="fa-solid fa-wheat-awn text-[#FBC02D] text-2xl mr-3"></i>
          <span class="text-xl font-bold tracking-wide text-white">
            AgriSure 
            <span class="text-xs font-normal text-green-200 block -mt-1">MAO Dashboard</span>
          </span>
        </div>

        <!-- Navigation Links -->
        <nav class="mt-6 px-4 space-y-1">
          <a
            v-for="item in navItems"
            :key="item.name"
            :href="item.href"
            :class="[
              item.active 
                ? 'bg-[#2E7D32] text-white shadow-sm' 
                : 'text-green-100 hover:bg-green-800 hover:text-white',
              'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all'
            ]"
          >
            <i :class="[item.icon, 'w-6']"></i> {{ item.name }}
          </a>
        </nav>
      </div>

      <!-- Bottom Sidebar Actions -->
      <div class="p-4 border-t border-green-800 space-y-1">
        <a href="#" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-green-100 hover:bg-green-800 hover:text-white transition-all">
          <i class="fa-solid fa-gear w-6"></i> Settings
        </a>
        <a href="#" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-red-200 hover:bg-red-700 hover:text-white transition-all">
          <i class="fa-solid fa-right-from-bracket w-6"></i> Logout
        </a>
      </div>
    </aside>

    <!-- MAIN CONTENT CONTAINER -->
    <div class="flex-1 flex flex-col h-screen overflow-y-auto">

      <!-- TOP BAR / HEADER -->
      <header class="bg-white border-b border-[#E5E7EB] sticky top-0 z-10 shadow-sm px-8 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button class="text-gray-500 hover:text-[#2E7D32] lg:hidden">
            <i class="fa-solid fa-bars text-xl"></i>
          </button>
          <div>
            <h1 class="text-xl font-bold text-[#263238]">Welcome back, {{ currentUser.name }}!</h1>
            <p class="text-xs text-gray-500">Here's what's happening in AgriSure today.</p>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Season Dropdown -->
          <div class="relative">
            <select v-model="selectedSeason" class="bg-[#F7F9F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm font-medium text-[#263238] focus:outline-none focus:border-[#2E7D32] cursor-pointer">
              <option value="wet">🌾 Wet Season</option>
              <option value="dry">☀️ Dry Season</option>
            </select>
          </div>

          <!-- Notifications Button -->
          <button class="relative p-2 text-gray-500 hover:text-[#2E7D32] rounded-full hover:bg-gray-100">
            <i class="fa-regular fa-bell text-lg"></i>
            <span class="absolute top-1 right-1 w-2 h-2 bg-[#E53935] rounded-full"></span>
          </button>

          <!-- Profile Dropdown -->
          <div class="flex items-center space-x-3 border-l border-[#E5E7EB] pl-4 cursor-pointer">
            <div class="w-9 h-9 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold text-sm">
              {{ currentUser.initials }}
            </div>
            <div class="hidden md:block">
              <p class="text-sm font-semibold text-[#263238] leading-tight">{{ currentUser.name }}</p>
              <p class="text-xs text-gray-400">{{ currentUser.role }}</p>
            </div>
            <i class="fa-solid fa-chevron-down text-xs text-gray-400"></i>
          </div>
        </div>
      </header>

      <!-- DASHBOARD BODY CONTAINER -->
      <main class="p-8 space-y-8">

        <!-- SECTION 1: TOP METRIC CARDS (5-Columns) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Card 1: Farmers -->
          <div class="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Farmers</p>
                <h3 class="text-2xl font-bold text-[#263238] mt-1">{{ stats.farmers.count }}</h3>
              </div>
              <div class="p-2.5 bg-green-50 rounded-lg text-[#2E7D32]">
                <i class="fa-solid fa-users text-lg"></i>
              </div>
            </div>
            <p class="text-xs text-[#4CAF50] mt-3 font-medium flex items-center gap-1">
              <i class="fa-solid fa-arrow-up"></i> {{ stats.farmers.change }}
            </p>
          </div>

          <!-- Card 2: Applications -->
          <div class="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Applications</p>
                <h3 class="text-2xl font-bold text-[#263238] mt-1">{{ stats.applications.count }}</h3>
              </div>
              <div class="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                <i class="fa-solid fa-file-lines text-lg"></i>
              </div>
            </div>
            <p class="text-xs text-[#FFB300] mt-3 font-medium flex items-center gap-1">
              <i class="fa-solid fa-clock"></i> {{ stats.applications.pending }}
            </p>
          </div>

          <!-- Card 3: Claims -->
          <div class="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Claims</p>
                <h3 class="text-2xl font-bold text-[#263238] mt-1">{{ stats.claims.count }}</h3>
              </div>
              <div class="p-2.5 bg-amber-50 rounded-lg text-amber-600">
                <i class="fa-solid fa-hand-holding-dollar text-lg"></i>
              </div>
            </div>
            <p class="text-xs text-amber-600 mt-3 font-medium flex items-center gap-1">
              <i class="fa-solid fa-magnifying-glass"></i> {{ stats.claims.inspecting }}
            </p>
          </div>

          <!-- Card 4: Damage Reports -->
          <div class="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Damage Reports</p>
                <h3 class="text-2xl font-bold text-[#263238] mt-1">{{ stats.damage.count }}</h3>
              </div>
              <div class="p-2.5 bg-red-50 rounded-lg text-[#E53935]">
                <i class="fa-solid fa-triangle-exclamation text-lg"></i>
              </div>
            </div>
            <p class="text-xs text-[#E53935] mt-3 font-medium flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation"></i> {{ stats.damage.critical }}
            </p>
          </div>

          <!-- Card 5: Inventory -->
          <div class="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inventory</p>
                <h3 class="text-2xl font-bold text-[#263238] mt-1">{{ stats.inventory.items }} <span class="text-xs font-normal text-gray-400">Items</span></h3>
              </div>
              <div class="p-2.5 bg-purple-50 rounded-lg text-purple-600">
                <i class="fa-solid fa-boxes-stacked text-lg"></i>
              </div>
            </div>
            <p class="text-xs text-[#E53935] mt-3 font-medium flex items-center gap-1">
              <i class="fa-solid fa-box-open"></i> {{ stats.inventory.lowStock }}
            </p>
          </div>
        </div>

        <!-- SECTION 2: CHARTS & TASKS -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-base font-bold text-[#263238]">Application Trend (2026)</h2>
              <button class="text-xs text-[#2E7D32] font-semibold hover:underline">View Detailed</button>
            </div>
            <ApexChart type="bar" height="240" :options="chartConfigs.applicationTrend.options" :series="chartConfigs.applicationTrend.series" />
          </div>

          <div class="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 class="text-base font-bold text-[#263238] mb-4">Pending Tasks</h2>
              <ul class="space-y-3 text-sm">
                <li v-for="task in pendingTasks" :key="task.id" class="flex items-center justify-between p-2.5 bg-[#F7F9F7] rounded-lg border border-gray-100">
                  <span class="flex items-center gap-2">
                    <span :class="['w-2.5 h-2.5 rounded-full', task.indicatorClass]"></span> {{ task.title }}
                  </span>
                  <span :class="[task.badgeClass, 'text-xs px-2 py-0.5 rounded-full font-bold']">{{ task.badgeText }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- SECTION 3: ANALYTICS ROW -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <h2 class="text-base font-bold text-[#263238] mb-2">Damage Analytics by Cause</h2>
            <ApexChart type="bar" height="220" :options="chartConfigs.damageAnalytics.options" :series="chartConfigs.damageAnalytics.series" />
          </div>

          <div class="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <h2 class="text-base font-bold text-[#263238] mb-2">Insurance Application Status</h2>
            <ApexChart type="donut" height="220" :options="chartConfigs.insuranceStatus.options" :series="chartConfigs.insuranceStatus.series" />
          </div>
        </div>

        <!-- SECTION 4: INVENTORY & DISTRIBUTION -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <h2 class="text-base font-bold text-[#263238] mb-2">Inventory Stock Levels</h2>
            <ApexChart type="bar" height="220" :options="chartConfigs.inventoryStatus.options" :series="chartConfigs.inventoryStatus.series" />
          </div>

          <div class="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <h2 class="text-base font-bold text-[#263238] mb-4">Distribution Summary</h2>
            <div class="grid grid-cols-2 gap-4">
              <div v-for="item in distributionSummary" :key="item.label" class="p-4 bg-[#F7F9F7] rounded-xl border border-[#E5E7EB]">
                <p class="text-xs text-gray-500 font-semibold uppercase">{{ item.label }}</p>
                <p :class="['text-3xl font-bold mt-1', item.colorClass]">{{ item.value }} <span v-if="item.unit" class="text-xs font-normal text-gray-400">{{ item.unit }}</span></p>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 5: BARANGAY PERFORMANCE & WEATHER -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <h2 class="text-base font-bold text-[#263238] mb-4">Barangay Performance Summary</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-[#F7F9F7] text-gray-500 uppercase text-xs">
                  <tr>
                    <th class="py-3 px-4 rounded-l-lg">Barangay</th>
                    <th class="py-3 px-4">Farmers</th>
                    <th class="py-3 px-4">Claims</th>
                    <th class="py-3 px-4 rounded-r-lg">Damage Incidents</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E5E7EB] text-[#263238]">
                  <tr v-for="bg in barangayData" :key="bg.name">
                    <td class="py-3 px-4 font-semibold">{{ bg.name }}</td>
                    <td class="py-3 px-4">{{ bg.farmers }}</td>
                    <td class="py-3 px-4">{{ bg.claims }}</td>
                    <td class="py-3 px-4">
                      <span :class="[bg.damage > 5 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800', 'text-xs px-2 py-0.5 rounded-full']">
                        {{ bg.damage }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Weather Card -->
          <div class="bg-gradient-to-br from-green-800 to-[#1B5E20] text-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-xs font-semibold text-green-200 uppercase">San Guillermo Weather</p>
                  <h3 class="text-3xl font-bold mt-1">{{ weather.temp }}</h3>
                </div>
                <i :class="[weather.icon, 'text-[#FBC02D] text-4xl']"></i>
              </div>
              <p class="text-sm text-green-100 mt-1">{{ weather.condition }}</p>
            </div>

            <div class="space-y-2 mt-6 pt-4 border-t border-green-700/60 text-sm">
              <div class="flex justify-between text-green-100">
                <span><i class="fa-solid fa-droplet w-5"></i> Humidity</span>
                <span class="font-bold text-white">{{ weather.humidity }}</span>
              </div>
              <div class="flex justify-between text-green-100">
                <span><i class="fa-solid fa-cloud-showers-heavy w-5"></i> Rain Chance</span>
                <span class="font-bold text-white">{{ weather.rainChance }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 6: ACTIVITIES & QUICK ACTIONS -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <h2 class="text-base font-bold text-[#263238] mb-4">Recent Activities</h2>
            <ul class="space-y-3 text-sm">
              <li v-for="act in recentActivities" :key="act.id" class="flex items-center gap-3">
                <span :class="['w-2.5 h-2.5 rounded-full shrink-0', act.color]"></span>
                <span class="text-gray-600" v-html="act.text"></span>
                <span class="text-xs text-gray-400 ml-auto">{{ act.time }}</span>
              </li>
            </ul>
          </div>

          <div class="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <h2 class="text-base font-bold text-[#263238] mb-4">Quick Actions</h2>
            <div class="flex flex-col gap-2">
              <button class="w-full bg-[#2E7D32] text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-green-800 transition-colors flex items-center justify-center gap-2">
                <i class="fa-solid fa-user-plus text-xs"></i> Verify Farmer
              </button>
              <button class="w-full bg-[#F7F9F7] border border-[#E5E7EB] text-[#263238] text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <i class="fa-solid fa-truck-ramp-box text-xs text-[#2E7D32]"></i> Create Distribution
              </button>
              <button class="w-full bg-[#F7F9F7] border border-[#E5E7EB] text-[#263238] text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <i class="fa-solid fa-box text-xs text-[#2E7D32]"></i> Add Inventory
              </button>
              <button class="w-full bg-[#F7F9F7] border border-[#E5E7EB] text-[#263238] text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <i class="fa-solid fa-file-signature text-xs text-[#2E7D32]"></i> Process Claim
              </button>
            </div>
          </div>
        </div>

        <!-- SECTION 7: FARM MAP INTERACTIVE PLACEHOLDER -->
        <div class="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h2 class="text-base font-bold text-[#263238]">Municipal Farm Map</h2>
              <p class="text-xs text-gray-500">Click any barangay status indicator to filter municipal data.</p>
            </div>
            <span class="text-xs font-semibold text-[#2E7D32] bg-green-50 px-3 py-1 rounded-full border border-green-200">Interactive Map Preview</span>
          </div>
          
          <div class="w-full h-72 rounded-xl border border-dashed border-[#2E7D32] flex flex-col items-center justify-center relative overflow-hidden p-6 bg-[#E8F5E9]/30">
            <div class="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
              <i class="fa-solid fa-map-location-dot text-[200px] text-[#2E7D32]"></i>
            </div>

            <div class="z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <button 
                v-for="bgy in barangayData" 
                :key="bgy.name"
                class="p-4 bg-white rounded-xl shadow-md border border-[#E5E7EB] hover:border-[#2E7D32] transition-all group"
              >
                <span :class="['inline-block w-3 h-3 rounded-full mb-1', bgy.statusBg]"></span>
                <h4 class="font-bold text-sm text-[#263238] group-hover:text-[#2E7D32]">{{ bgy.name }}</h4>
                <p class="text-xs text-gray-500">{{ bgy.farmers }} Active Farmers</p>
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import ApexChart from 'vue3-apexcharts';

// Reactive State
const currentUser = ref({ name: 'Christopher', role: 'MAO Officer', initials: 'CP' });
const selectedSeason = ref('wet');

// Sidebar Nav Items
const navItems = ref([
  { name: 'Dashboard', icon: 'fa-solid fa-chart-line', href: '#', active: true },
  { name: 'Farmer Verification', icon: 'fa-solid fa-user-check', href: '#', active: false },
  { name: 'Insurance Applications', icon: 'fa-solid fa-file-invoice', href: '#', active: false },
  { name: 'Farm Map', icon: 'fa-solid fa-map-location-dot', href: '#', active: false },
  { name: 'Damage Reports', icon: 'fa-solid fa-triangle-exclamation', href: '#', active: false },
  { name: 'Claims', icon: 'fa-solid fa-hand-holding-dollar', href: '#', active: false },
  { name: 'Inventory', icon: 'fa-solid fa-boxes-stacked', href: '#', active: false },
  { name: 'Reports', icon: 'fa-solid fa-file-lines', href: '#', active: false },
]);

// Top Stats Cards Data
const stats = ref({
  farmers: { count: '2,845', change: '+24 this month' },
  applications: { count: '1,245', pending: '86 Pending Today' },
  claims: { count: '42', inspecting: '7 Waiting Inspection' },
  damage: { count: '19', critical: '3 Critical Level' },
  inventory: { items: '126', lowStock: '7 Low Stock Items' },
});

// Tasks Data
const pendingTasks = ref([
  { id: 1, title: 'Verify Farmers', badgeText: '12', indicatorClass: 'bg-[#FFB300]', badgeClass: 'bg-amber-100 text-amber-800' },
  { id: 2, title: 'Review Claims', badgeText: '5', indicatorClass: 'bg-[#FFB300]', badgeClass: 'bg-amber-100 text-amber-800' },
  { id: 3, title: 'Low Fertilizer Stock', badgeText: 'Alert', indicatorClass: 'bg-[#E53935]', badgeClass: 'bg-red-100 text-red-800' },
  { id: 4, title: 'Seed Distribution', badgeText: 'Tomorrow', indicatorClass: 'bg-[#4CAF50]', badgeClass: 'bg-green-100 text-green-800' },
  { id: 5, title: 'Insurance Deadline', badgeText: '3 Days', indicatorClass: 'bg-[#FFB300]', badgeClass: 'bg-amber-100 text-amber-800' },
]);

// Barangay Performance Data
const barangayData = ref([
  { name: 'Centro', farmers: 245, claims: 120, damage: 4, statusBg: 'bg-[#4CAF50]' },
  { name: 'Rizal', farmers: 193, claims: 98, damage: 8, statusBg: 'bg-[#FFB300]' },
  { name: 'Mabini', farmers: 175, claims: 82, damage: 2, statusBg: 'bg-[#E53935]' },
  { name: 'San Roque', farmers: 140, claims: 65, damage: 1, statusBg: 'bg-[#4CAF50]' },
]);

// Weather Widget Data
const weather = ref({ temp: '29°C', condition: 'Partly Cloudy', humidity: '81%', rainChance: '70%', icon: 'fa-solid fa-sun' });

// Distribution KPI Summary
const distributionSummary = ref([
  { label: 'Completed Distributions', value: '14', colorClass: 'text-[#2E7D32]' },
  { label: 'Upcoming Scheduled', value: '3', colorClass: 'text-[#FBC02D]' },
  { label: 'Total Beneficiaries', value: '540', colorClass: 'text-[#263238]' },
  { label: 'Supplies Distributed', value: '1,320', unit: 'units', colorClass: 'text-[#263238]' },
]);

// Activities
const recentActivities = ref([
  { id: 1, color: 'bg-[#4CAF50]', text: '<strong class="text-[#263238]">Juan Dela Cruz</strong> submitted a new insurance application.', time: '10m ago' },
  { id: 2, color: 'bg-[#4CAF50]', text: '<strong class="text-[#263238]">Maria Santos</strong> reported flood crop damage in Rizal.', time: '1h ago' },
  { id: 3, color: 'bg-[#FFB300]', text: 'Inventory updated: <strong class="text-[#263238]">Urea Fertilizer</strong> stock reduced.', time: '3h ago' },
  { id: 4, color: 'bg-blue-500', text: 'Insurance Claim <strong class="text-[#263238]">#CLM-2026-089</strong> approved.', time: '5h ago' },
]);

// Chart Configuration (ApexCharts)
const chartConfigs = reactive({
  applicationTrend: {
    series: [{ name: 'Applications', data: [45, 52, 38, 65, 89, 120, 95, 110] }],
    options: {
      chart: { toolbar: { show: false } },
      colors: ['#2E7D32'],
      plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
      xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'] },
      grid: { borderColor: '#E5E7EB' }
    }
  },
  damageAnalytics: {
    series: [{ name: 'Incidents', data: [45, 28, 15, 8] }],
    options: {
      chart: { toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '50%' } },
      colors: ['#E53935'],
      xaxis: { categories: ['Flood', 'Typhoon', 'Drought', 'Pest'] },
      grid: { borderColor: '#E5E7EB' }
    }
  },
  insuranceStatus: {
    series: [68, 20, 12],
    options: {
      labels: ['Approved', 'Pending', 'Rejected'],
      colors: ['#4CAF50', '#FFB300', '#E53935'],
      legend: { position: 'bottom' }
    }
  },
  inventoryStatus: {
    series: [{ name: 'Stock Level (%)', data: [85, 60, 18, 75] }],
    options: {
      chart: { toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '50%' } },
      colors: ['#2E7D32'],
      xaxis: { categories: ['Rice Seeds', 'Corn Seeds', 'Fertilizer', 'Pesticides'], max: 100 },
      grid: { borderColor: '#E5E7EB' }
    }
  }
});
</script>