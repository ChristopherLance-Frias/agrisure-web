<template>
  <div class="dashboard-shell" :class="{ 'is-collapsed': isCollapsed }">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="logo-mark"><span>B</span></div>
        <div class="brand-text">
          <h1>BRGY</h1>
          <p>{{ barangayName }}</p>
        </div>
        <button 
          class="btn-collapse" 
          @click="toggleCollapse" 
          :title="isCollapsed ? 'Expand' : 'Collapse'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25">
            <polyline points="15 6 9 12 15 18" />
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <!-- Overview Group -->
        <!-- Overview Group -->
        <div class="nav-group">
          <p class="nav-group-label">Overview</p>

          <router-link :to="{ name: 'barangay-dashboard' }" class="nav-item" title="Dashboard" exact>
            <span class="nav-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7.5" height="7.5" rx="2"/>
                <rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/>
                <rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/>
                <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>
              </svg>
            </span>
            <span class="nav-label">Dashboard</span>
          </router-link>
        </div>

        <!-- Management Group -->
        <div class="nav-group">
          <p class="nav-group-label">Management</p>

          <router-link :to="{ name: 'barangay-farmers' }" class="nav-item" title="Farmers">
            <span class="nav-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </span>
            <span class="nav-label">Farmers</span>
          </router-link>

          <router-link :to="{ name: 'barangay-distribution-lists' }" class="nav-item" title="Distribution List">
            <span class="nav-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </span>
            <span class="nav-label">Distribution List</span>
          </router-link>
        </div>

        <!-- Analytics Group -->
        <div class="nav-group">
          <p class="nav-group-label">Analytics</p>

          <router-link :to="{ name: 'barangay-reports' }" class="nav-item" title="Reports">
            <span class="nav-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </span>
            <span class="nav-label">Reports</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-info">
          <div class="admin-avatar">{{ adminInitials }}</div>
          <div class="admin-details">
            <p class="admin-name">{{ adminName }}</p>
            <p class="admin-role">Barangay Official</p>
          </div>
        </div>

        <button class="btn-logout" @click="handleLogout" title="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'BarangayDashboardPage',

  data() {
    return {
      isCollapsed: localStorage.getItem('barangay_sidebar_collapsed') === '1',
    }
  },

  computed: {
    barangayUser() {
      return JSON.parse(localStorage.getItem('barangay_user') || '{}')
    },

    adminName() {
      const user = this.barangayUser
      const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
      return fullName || 'Official'
    },

    adminInitials() {
      const user = this.barangayUser
      const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
      return initials || 'BO'
    },

    barangayName() {
      const user = this.barangayUser
      return user.barangay?.name || 'Official Portal'
    },
  },

  mounted() {
    const token = localStorage.getItem('barangay_token')
    const user = this.barangayUser

    if (!token || user.role !== 'barangay') {
      this.handleLogout()
      return
    }

    axios.defaults.headers.common.Authorization = `Bearer ${token}`
  },

  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed
      localStorage.setItem('barangay_sidebar_collapsed', this.isCollapsed ? '1' : '0')
    },

    handleLogout() {
      localStorage.removeItem('barangay_token')
      localStorage.removeItem('barangay_user')

      delete axios.defaults.headers.common.Authorization

      this.$router.push({
        name: 'portal-select',
      })
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.dashboard-shell {
  display: flex;
  min-height: 100vh;
  font-family: 'DM Sans', sans-serif;
  background: #F8FAF8;
}

/* SIDEBAR — Deep green -> charcoal gradient with amber accents */
.sidebar {
  width: 252px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #116D3E 0%, #0A5232 55%, #0F212F 100%);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  height: 100vh;
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.is-collapsed .sidebar {
  width: 76px;
  padding: 1.5rem 0.75rem;
}

.is-collapsed .brand-text,
.is-collapsed .nav-group-label,
.is-collapsed .nav-label,
.is-collapsed .admin-details {
  display: none;
}

.is-collapsed .sidebar-brand {
  justify-content: center;
}

.is-collapsed .btn-collapse {
  transform: rotate(180deg);
  position: static;
  margin-top: 0.5rem;
}

.is-collapsed .nav-item {
  justify-content: center;
}

.is-collapsed .admin-info {
  justify-content: center;
}

/* BRANDING */
.sidebar-brand {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 0.35rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.35rem;
}

.logo-mark {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #D29539, #AC7A2F);
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(210, 149, 57, 0.35);
}

.logo-mark span {
  font-family: 'DM Serif Display', serif;
  font-size: 19px;
  color: #0F212F;
}

.brand-text h1 {
  font-family: 'DM Serif Display', serif;
  font-size: 14.5px;
  color: #F8FAF8;
  letter-spacing: 2.5px;
}

.brand-text p {
  font-size: 8.5px;
  color: rgba(248, 250, 248, 0.55);
  letter-spacing: 1.8px;
  text-transform: uppercase;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.btn-collapse {
  margin-left: auto;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border: none;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(248, 250, 248, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-collapse:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #F8FAF8;
}

/* NAVIGATION */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-group-label {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: rgba(248, 250, 248, 0.32);
  padding: 0 0.65rem 0.4rem;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 12px;
  margin-left: 2px;
  border-radius: 10px;
  color: rgba(248, 250, 248, 0.6);
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
  width: 100%;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  width: 3px;
  height: 0%;
  background: #D29539;
  border-radius: 3px;
  transform: translateY(-50%);
  transition: height 0.18s ease;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.85;
  transition: transform 0.16s ease, opacity 0.16s ease;
}

.nav-item:hover {
  background: rgba(210, 149, 57, 0.12);
  color: #F8FAF8;
}

.nav-item:hover .nav-icon {
  transform: translateX(1px);
  opacity: 1;
}

.nav-item.router-link-active {
  background: rgba(210, 149, 57, 0.18);
  color: #D29539;
}

.nav-item.router-link-active .nav-icon {
  opacity: 1;
}

.nav-item.router-link-active::before {
  height: 60%;
}

/* FOOTER */
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 1rem 0.35rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 1rem;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.admin-avatar {
  width: 33px;
  height: 33px;
  background: rgba(210, 149, 57, 0.18);
  border: 1px solid rgba(210, 149, 57, 0.32);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11.5px;
  font-weight: 600;
  color: #D29539;
  flex-shrink: 0;
}

.admin-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #F8FAF8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-role {
  font-size: 10px;
  color: rgba(248, 250, 248, 0.5);
}

.btn-logout {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(248, 250, 248, 0.4);
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.btn-logout:hover {
  color: #EF5350;
  background: rgba(239, 83, 80, 0.12);
}

/* MAIN CONTENT */
.main-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>