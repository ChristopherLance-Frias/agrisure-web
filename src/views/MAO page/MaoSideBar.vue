<template>
  <div class="dashboard-shell">

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="logo-mark"><span>M</span></div>
        <div class="brand-text">
          <h1>MAO</h1>
          <p>Admin Portal</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link :to="{ name: 'farmer-verification' }" class="nav-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <polyline points="16 11 18 13 22 9"/>
          </svg>
          <span>Farmer Verification</span>
        </router-link>
        <router-link :to="{ name: 'insurance-applications' }" class="nav-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span>Insurance Applications</span>
        </router-link>
        <router-link :to="{ name: 'farm-map' }" class="nav-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
            <line x1="9" y1="3" x2="9" y2="18"/>
            <line x1="15" y1="6" x2="15" y2="21"/>
          </svg>
          <span>Farm Map</span>
        </router-link>
        <router-link :to="{ name: 'damage-reports' }" class="nav-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Damage Reports</span>
        </router-link>
        <router-link :to="{ name: 'mao-claims' }" class="nav-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Claims</span>
        </router-link>
          <router-link :to="{ name: 'reports' }" class="nav-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Reports</span>
        </router-link>
        
        <router-link :to="{ name: 'inventory' }" class="nav-item">
  <!-- box icon svg -->
          <span>Inventory</span>
        </router-link>

        <router-link :to="{ name: 'dashboard' }" class="nav-item">
  <!-- box icon svg -->
          <span>Dashboard</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-info">
          <div class="admin-avatar">{{ adminInitials }}</div>
          <div class="admin-details">
            <p class="admin-name">{{ adminName }}</p>
            <p class="admin-role">MAO Staff</p>
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

    <!-- Page content rendered here -->
    <div class="main-content">
      <router-view />
    </div>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'DashboardPage',

  computed: {
    adminName() {
      const user = JSON.parse(localStorage.getItem('mao_user') || '{}')
      return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Admin'
    },
    adminInitials() {
      const user = JSON.parse(localStorage.getItem('mao_user') || '{}')
      return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'MA'
    },
  },

  methods: {
    handleLogout() {
      localStorage.removeItem('mao_token')
      localStorage.removeItem('mao_user')
      delete axios.defaults.headers.common['Authorization']
      this.$router.push({ name: 'portal-select' })
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.dashboard-shell {
  display: flex;
  min-height: 100vh;
  font-family: 'DM Sans', sans-serif;
  background: #F8FAF8; /* Off White background */
}

/* SIDEBAR */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #1B5E20; /* Dark Forest Green */
  display: flex;
  flex-direction: column;
  padding: 1.75rem 1rem;
  border-right: 1px solid rgba(255,255,255,0.08);
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-brand {
  display: flex; align-items: center; gap: 12px;
  padding: 0 0.5rem 1.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.12);
  margin-bottom: 1.25rem;
}

.logo-mark {
  width: 40px; height: 40px; background: #FBC02D; /* Golden Yellow */
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.logo-mark span {
  font-family: 'DM Serif Display', serif;
  font-size: 20px; color: #1B5E20; /* Dark Forest Green on gold */
}

.brand-text h1 {
  font-family: 'DM Serif Display', serif;
  font-size: 15px; color: #F8FAF8; letter-spacing: 3px;
}

.brand-text p {
  font-size: 9px; color: rgba(248,250,248,0.6);
  letter-spacing: 2px; text-transform: uppercase;
}

/* NAV */
.sidebar-nav {
  flex: 1;
  display: flex; flex-direction: column; gap: 4px;
}

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: rgba(248,250,248,0.55);
  font-size: 13.5px; font-weight: 500;
  text-decoration: none;
  cursor: pointer; transition: all 0.2s;
  width: 100%;
}

.nav-item:hover {
  background: rgba(251,192,45,0.12); /* Golden Yellow tint */
  color: #F8FAF8;
}

.nav-item.router-link-active {
  background: rgba(251,192,45,0.18);
  color: #FBC02D; /* Golden Yellow active state */
}

/* FOOTER */
.sidebar-footer {
  display: flex; align-items: center; gap: 10px;
  padding: 1rem 0.5rem 0;
  border-top: 1px solid rgba(255,255,255,0.12);
  margin-top: 1rem;
}

.admin-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }

.admin-avatar {
  width: 34px; height: 34px;
  background: rgba(251,192,45,0.2);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; color: #FBC02D;
  flex-shrink: 0;
}

.admin-name {
  font-size: 12.5px; font-weight: 600; color: #F8FAF8;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.admin-role { font-size: 10px; color: rgba(248,250,248,0.55); }

.btn-logout {
  background: none; border: none; cursor: pointer;
  color: rgba(248,250,248,0.45); padding: 6px;
  border-radius: 8px; display: flex; align-items: center;
  transition: all 0.2s; flex-shrink: 0;
}
.btn-logout:hover { color: #D32F2F; background: rgba(211,47,47,0.1); } /* Error red */

/* MAIN */
.main-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .sidebar { display: none; }
}
</style>