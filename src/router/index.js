import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import LoginPage from '../views/MAO page/MAOLoginPage.vue'
import DashboardPage from '../views/MAO page/MaoSideBar.vue'
import MaoOtpPage from '../views/MAO page/MAOOtpPage.vue'

const routes = [
  {
    path: '/',
    name: 'portal-select',
    component: LandingPage,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
  },
  {
  path: '/otp',
  name: 'otp',
  component: MaoOtpPage,
},
  {
    path: '/dashboard',
    name: 'mao-dashboard', 
    component: DashboardPage,
    meta: { role: 'mao' },
    children: [
      {
        path: '',
        redirect: { name: 'farmer-verification' },
      },
      {
        path: 'farmers',
        name: 'farmer-verification',
        component: () => import('../views/MAO page/FarmerVerificationPage.vue'),
      },
      {
        path: 'farm-map',
        name: 'farm-map',
        component: () => import('../views/MAO page/FarmMapPage.vue'),
      },
      {
      path: 'insurance',
      name: 'insurance-applications',
      component: () => import('../views/MAO page/CropInsuranceApplicationPage.vue'),
      },
      {
      path: 'damage-reports',
      name: 'damage-reports',
      component: () => import('../views/MAO page/DamageReportsPage.vue'),
      },
      {
      path: 'inventory',
      name: 'inventory',
      component: () => import('../views/MAO page/InventoryPage.vue'),
      },
      {
      path: '/mao/claims',
      name: 'mao-claims',
      component: () => import('@/views/MAO page/ClaimsPage.vue')
      },
      {
      path: 'reports',
      name: 'reports',
      component: () => import('@/views/MAO page/ReportsPage.vue')
      },
      {
      path: 'dash',
      name: 'dashboard',
      component: () => import('@/views/MAO page/DashboardPage.vue')
      },
      
    ],
  },

  // ── Barangay Official ────────────────────────────────────────
  {
    path: '/barangay/login',
    name: 'barangay-login',
    component: () => import('../views/Barangay Official Page/BarangyOfficialLoginPage.vue'),
  },
  {
    path: '/barangay/otp',
    name: 'barangay-otp',
    component: () => import('../views/Barangay Official Page/BarangayOtpPage.vue'),
  },
  {
    path: '/barangay/dashboard',
    name: 'barangay-dashboard', 
    component: () => import('../views/Barangay Official Page/BarangayDashboardPage.vue'),
    meta: { role: 'barangay' },
    children: [
      {
        path: '',
        redirect: { name: 'barangay-farmers' },
      },
      {
        path: 'farmers',
        name: 'barangay-farmers',
        component: () => import('../views/Barangay Official Page/FarmersPage.vue'),
      },
      {
        path: 'reports',
        name: 'barangay-reports',
        component: () => import('../views/Barangay Official Page/BarangayReportsPage.vue'),
      },      {
        path: 'distribution-lists',
        name: 'barangay-distribution-lists',
        component: () => import('../views/Barangay Official Page/DistributionListPage.vue')
      },

    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ── Navigation guard ─────────────────────────────────────────
router.beforeEach((to, from, next) => {
  const maoToken      = localStorage.getItem('mao_token')
  const barangayToken = localStorage.getItem('barangay_token')

  // Redirect away from portal-select and MAO login if already logged in
  if (to.name === 'portal-select' || to.name === 'login') {
    if (maoToken)      return next({ name: 'farmer-verification' })
    if (barangayToken) return next({ name: 'barangay-farmers' })
  }

  // Redirect away from barangay login if already logged in
  if (to.name === 'barangay-login') {
    if (barangayToken) return next({ name: 'barangay-farmers' })
    if (maoToken)      return next({ name: 'farmer-verification' })
  }

  // Protect MAO routes
  if (to.meta.role === 'mao' && !maoToken) {
    return next({ name: 'login' })
  }

  // Protect barangay routes
  if (to.meta.role === 'barangay' && !barangayToken) {
    return next({ name: 'barangay-login' })
  }

  next()
})

export default router