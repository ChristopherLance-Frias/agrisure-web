<template>
  <div class="dashboard-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="logo-mark"><span>B</span></div>
        <div class="brand-text">
          <h1>BRGY</h1>
          <p>{{ barangayName }}</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link :to="{ name: 'barangay-farmers' }" class="nav-item">
          <span>Farmers</span>
        </router-link>

        <router-link :to="{ name: 'barangay-reports' }" class="nav-item">
          <span>Reports</span>
        </router-link>
         <router-link :to="{ name: 'barangay-distribution-lists' }" class="nav-item">
          <span>Distribution List</span>
         </router-link>
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
          Logout
        </button>
      </div>
    </aside>

    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'BarangayDashboardPage',

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

      const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`
        .toUpperCase()

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
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.dashboard-shell {
  display: flex;
  min-height: 100vh;
  font-family: 'DM Sans', sans-serif;
  background: #f0f4ff;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #0c1220;
  display: flex;
  flex-direction: column;
  padding: 1.75rem 1rem;
  border-right: 1px solid rgba(66, 133, 244, 0.15);
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 0.5rem 1.75rem;
  border-bottom: 1px solid rgba(66, 133, 244, 0.12);
  margin-bottom: 1.25rem;
}

.logo-mark {
  width: 40px;
  height: 40px;
  background: #4285f4;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-mark span {
  font-family: 'DM Serif Display', serif;
  font-size: 20px;
  color: #fff;
}

.brand-text h1 {
  font-family: 'DM Serif Display', serif;
  font-size: 15px;
  color: #e8eeff;
  letter-spacing: 3px;
}

.brand-text p {
  font-size: 9px;
  color: rgba(66, 133, 244, 0.6);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: rgba(200, 214, 245, 0.5);
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(66, 133, 244, 0.08);
  color: #c8d6f5;
}

.nav-item.router-link-active {
  background: rgba(66, 133, 244, 0.15);
  color: #7aadff;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 1rem 0.5rem 0;
  border-top: 1px solid rgba(66, 133, 244, 0.12);
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
  width: 34px;
  height: 34px;
  background: rgba(66, 133, 244, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #7aadff;
  flex-shrink: 0;
}

.admin-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #c8d6f5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-role {
  font-size: 10px;
  color: rgba(66, 133, 244, 0.5);
}

.btn-logout {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(200, 214, 245, 0.4);
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-logout:hover {
  color: #e57373;
  background: rgba(229, 115, 115, 0.1);
}

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