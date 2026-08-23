<template>
  <div class="farm-map-page">
 
    <!-- Top bar (matches dashboard header) -->
    <header class="top-header">
      <div class="header-title-group">
        <h1>Farm Map</h1>
        <p>Showing farm locations across all barangays</p>
      </div>

      <div class="header-actions">
        <div class="v-divider"></div>
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
 
    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon farms">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 22V12"/>
            <path d="M12 12C12 8 9 6 5 6c0 4 2 7 7 7z"/>
            <path d="M12 12c0-4 3-6 7-6 0 4-2 7-7 7z"/>
          </svg>
        </div>
        <div class="stat-text">
          <span class="stat-label">Total Farms</span>
          <span class="stat-value">{{ farms.length }}</span>
        </div>
      </div>
 
      <div class="stat-card">
        <div class="stat-icon pins">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="stat-text">
          <span class="stat-label">With Coordinates</span>
          <span class="stat-value">{{ mappableFarms.length }}</span>
        </div>
      </div>
 
      <div class="stat-card">
        <div class="stat-icon area">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 15h6v6"/>
          </svg>
        </div>
        <div class="stat-text">
          <span class="stat-label">Total Area</span>
          <span class="stat-value">{{ totalArea }} <small>ha</small></span>
        </div>
      </div>
 
      <div class="stat-card">
        <div class="stat-icon insured">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/>
          </svg>
        </div>
        <div class="stat-text">
          <span class="stat-label">Insured Farms</span>
          <span class="stat-value">{{ insuredCount }}</span>
        </div>
      </div>
    </div>
 
    <!-- Search bar -->
    <div class="search-bar-row">
      <div class="search-wrap">
        <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="search"
          class="search-input"
          type="text"
          placeholder="Search farm name, crop, or farmer..."
          @keyup.enter="jumpToFirstResult"
        />
      </div>
 
      <div class="legend">
        <span class="legend-item"><span class="legend-dot green"></span> Insured</span>
        <span class="legend-item"><span class="legend-dot gray"></span> Uninsured</span>
      </div>
    </div>
 
    <!-- Map + Detail Panel -->
    <div class="map-layout">
 
      <!-- Map -->
      <div class="map-container">
        <div v-if="isLoading" class="map-overlay">
          <div class="spinner"></div>
          <span>Loading farms...</span>
        </div>
        <div v-if="errorMessage" class="map-overlay error-overlay">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>
        <div ref="mapRef" class="leaflet-map-el"></div>
      </div>
 
      <!-- Detail Panel -->
      <div class="detail-panel">
        <div v-if="!selectedFarm" class="detail-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#116D3E" stroke-width="1.5">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
            <line x1="9" y1="3" x2="9" y2="18"/>
            <line x1="15" y1="6" x2="15" y2="21"/>
          </svg>
          <p>Click a pin on the map to view farm details</p>
        </div>
 
        <div v-else class="detail-content">
 
          <!-- Farm image banner -->
          <div class="farm-image-wrap">
            <img
              v-if="farmImageUrl && !farmImageError"
              :src="farmImageUrl"
              :alt="selectedFarm.farm_name || 'Farm photo'"
              class="farm-image"
              @error="onImageError"
            />
            <div v-else class="farm-image-placeholder">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M12 22V12"/>
                <path d="M12 12C12 8 9 6 5 6c0 4 2 7 7 7z"/>
                <path d="M12 12c0-4 3-6 7-6 0 4-2 7-7 7z"/>
              </svg>
            </div>
 
            <span class="insurance-badge" :class="selectedFarm.insurance_status === 'insured' ? 'insured' : 'uninsured'">
              <svg v-if="selectedFarm.insurance_status === 'insured'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/>
              </svg>
              {{ selectedFarm.insurance_status === 'insured' ? 'Insured' : 'Uninsured' }}
            </span>
 
            <button class="close-btn" @click="selectedFarm = null">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
 
          <div class="detail-title-row">
            <h3>{{ selectedFarm.farm_name || 'Unnamed Farm' }}</h3>
            <span class="crop-pill">{{ selectedFarm.crop_type || '—' }}</span>
          </div>
 
          <div class="detail-divider"></div>
 
          <div class="section-title">Farm Information</div>
 
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Farm Size</span>
              <span class="detail-val">
                {{ selectedFarm.farm_area ? selectedFarm.farm_area + ' ha' : '—' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Coordinates</span>
              <span class="detail-val coords">
                {{ formatCoord(selectedFarm.latitude) }}, {{ formatCoord(selectedFarm.longitude) }}
              </span>
            </div>
          </div>
 
          <div class="detail-divider"></div>
 
          <div class="section-title">Farmer Information</div>
 
          <div class="farmer-profile-row">
            <img
              v-if="farmerProfilePhotoUrl && !avatarImageError"
              :src="farmerProfilePhotoUrl"
              class="farmer-avatar"
              alt="Farmer photo"
              @error="onAvatarError"
            />
            <div v-else class="farmer-avatar-placeholder">{{ ownerInitials }}</div>
 
            <div class="farmer-name-block">
              <span class="detail-val">{{ ownerName }}</span>
              <span class="detail-sub">{{ selectedFarm.farmer_profile?.user?.sex || '—' }}</span>
            </div>
          </div>
 
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Email</span>
              <span class="detail-val truncate">{{ selectedFarm.farmer_profile?.user?.email || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Phone</span>
              <span class="detail-val">{{ selectedFarm.farmer_profile?.user?.phone_number || '—' }}</span>
            </div>
            <div class="detail-item span-2">
              <span class="detail-label">Address</span>
              <span class="detail-val">{{ selectedFarm.farmer_profile?.address || '—' }}</span>
            </div>
          </div>
 
          <button class="btn-center" @click="centerOnFarm(selectedFarm)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Center on Map
          </button>
        </div>
      </div>
 
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'



delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const API_BASE = 'https://sanagustinagrisure.com'

const GREEN_ICON = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const GRAY_ICON = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})



export default {
  name: 'FarmMapPage',

  data() {
    return {
      farms: [],
      isLoading: false,
      errorMessage: '',
      selectedFarm: null,
      search: '',
      map: null,
      zoomControl: null,
      markers: [],
      currentUser: { name: 'Christopher', role: 'MAO Officer', initials: 'CP' },
    }
  },

  computed: {
    mappableFarms() {
      return this.farms.filter(f => f.latitude && f.longitude)
    },

    totalArea() {
      const total = this.farms.reduce((sum, f) => sum + (parseFloat(f.farm_area) || 0), 0)
      return total.toFixed(1)
    },

    insuredCount() {
      return this.farms.filter(f => f.insurance_status === 'insured').length
    },

    ownerName() {
      if (!this.selectedFarm) return '—'
      const u = this.selectedFarm.farmer_profile?.user
      if (!u) return '—'
      return [u.first_name, u.middle_name, u.last_name, u.extension_name]
        .filter(Boolean)
        .join(' ') || '—'
    },

    ownerInitials() {
      if (!this.selectedFarm) return '—'
      const u = this.selectedFarm.farmer_profile?.user
      if (!u) return '—'
      const first = u.first_name ? u.first_name[0] : ''
      const last = u.last_name ? u.last_name[0] : ''
      return (first + last).toUpperCase() || '—'
    },

    farmImageUrl() {
      if (!this.selectedFarm?.farm_image_path) return null
      return `${API_BASE}/storage/${this.selectedFarm.farm_image_path}`
    },

    farmerProfilePhotoUrl() {
      const photo = this.selectedFarm?.farmer_profile?.profile_photo
      if (!photo) return null
      return `${API_BASE}/storage/${photo}`
    },
  },

  async mounted() {
    await this.fetchFarms()
    this.initMap()
  },

  beforeUnmount() {
    try {
      if (this.zoomControl && this.map) {
        this.zoomControl.remove()
        this.zoomControl = null
      }

      if (this.$refs.mapRef) {
        const zoomBtns = this.$refs.mapRef.querySelectorAll('.leaflet-control-zoom a')
        zoomBtns.forEach(btn => {
          const clone = btn.cloneNode(true)
          btn.parentNode && btn.parentNode.replaceChild(clone, btn)
        })
      }

      this.markers.forEach(m => { try { m.off(); m.remove() } catch (e) { /* ignore */ } })
      this.markers = []

      if (this.map) {
        this.map.stop()
        this.map.off()
        this.map.remove()
        this.map = null
      }

      if (this.$refs.mapRef) {
        this.$refs.mapRef._leaflet_id = null
      }
    } catch (e) {
      // Swallow any cleanup errors
    }
  },

  methods: {
    async fetchFarms() {
      this.isLoading = true
      this.errorMessage = ''
      try {
        const token = localStorage.getItem('mao_token')
        const response = await axios.get(`${API_BASE}/api/farms`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.farms = Array.isArray(response.data)
          ? response.data
          : response.data.data ?? []
      } catch (err) {
        this.errorMessage = 'Failed to load farms. Check your connection.'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    initMap() {
      this.$nextTick(() => {
        if (!this.$refs.mapRef || this.map) return

        this.map = L.map(this.$refs.mapRef, {
          zoomAnimation: false,
          fadeAnimation: false,
          markerZoomAnimation: false,
          zoomControl: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          boxZoom: false,
        }).setView([15.0794, 120.6200], 11)

        this.zoomControl = L.control.zoom({ position: 'bottomright' })
        this.zoomControl.addTo(this.map)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(this.map)

        this.plotMarkers()
      })
    },

    plotMarkers() {
      if (!this.map) return

      this.markers.forEach(m => { try { m.off(); m.remove() } catch (e) { /* ignore */ } })
      this.markers = []

      if (this.mappableFarms.length === 0) return

      const bounds = []

      this.mappableFarms.forEach(farm => {
        if (!this.map) return

        const lat = parseFloat(farm.latitude)
        const lng = parseFloat(farm.longitude)
        const icon = farm.insurance_status === 'insured' ? GREEN_ICON : GRAY_ICON

        const marker = L.marker([lat, lng], { icon })
          .addTo(this.map)
          .bindTooltip(
            `<strong>${farm.farm_name || 'Unnamed Farm'}</strong><br>${farm.crop_type || '—'}`,
            { permanent: false, direction: 'top', className: 'farm-tooltip' }
          )
          .on('click', () => {
            this.selectedFarm = farm
          })

        marker.farmRef = farm
        this.markers.push(marker)
        bounds.push([lat, lng])
      })

      if (bounds.length > 0 && this.map) {
        this.map.fitBounds(bounds, { padding: [40, 40], animate: false })
      }
    },

    centerOnFarm(farm) {
      if (!this.map || !farm.latitude || !farm.longitude) return
      const lat = parseFloat(farm.latitude)
      const lng = parseFloat(farm.longitude)
      this.map.flyTo([lat, lng], 16, { animate: true, duration: 0.8 })

      const marker = this.markers.find(m => m.farmRef === farm)
      if (marker) marker.openTooltip()
    },

    jumpToFirstResult() {
      const q = this.search.toLowerCase().trim()
      if (!q) return

      const match = this.mappableFarms.find(f => {
        const owner = f.farmer_profile?.user
        const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : ''
        return (
          (f.farm_name || '').toLowerCase().includes(q) ||
          (f.crop_type || '').toLowerCase().includes(q) ||
          ownerName.toLowerCase().includes(q)
        )
      })

      if (match) {
        this.selectedFarm = match
        this.centerOnFarm(match)
      }
    },

    formatCoord(val) {
      if (!val) return '—'
      return parseFloat(val).toFixed(5)
    },

    onImageError(e) {
      e.target.style.display = 'none'
    },
    onAvatarError(e) {
      e.target.style.display = 'none'
    },
  },
}
</script>


<style scoped>
* { box-sizing: border-box; }
 
.farm-map-page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #F8FAF8;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
 
.farm-map-page > *:not(.top-header) {
  padding-left: 1.75rem;
  padding-right: 1.75rem;
}
 
.farm-map-page > .top-header + * { margin-top: 0.5rem; }
 
.map-layout { padding-bottom: 1.75rem; }
 
/* TOP HEADER (copied from dashboard) */
.top-header {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #E7F0EC;
  flex-shrink: 0;
  z-index: 20;
  padding: 0px 15px;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
 
.header-title-group h1 {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #0F212F;
  letter-spacing: -0.01em;
}
 
.header-title-group p {
  font-size: 12px;
  color: #5c6b64;
}
 
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
 
.v-divider {
  height: 24px;
  width: 1px;
  background-color: #E7F0EC;
}
 
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}
 
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  box-shadow: 0 0 0 2px rgba(17, 109, 62, 0.2);
}
 
.user-name {
  font-size: 12px;
  font-weight: 700;
  color: #0F212F;
  line-height: 1.2;
}
 
.user-role {
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
 
/* STATS ROW */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
 
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 14px;
  padding: 1rem 1.1rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
}
 
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
 
.stat-icon.farms   { background: rgba(17, 109, 62, 0.1);  color: #116D3E; }
.stat-icon.pins    { background: rgba(46, 111, 142, 0.1); color: #2E6F8E; }
.stat-icon.area    { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.stat-icon.insured { background: rgba(107, 91, 149, 0.1); color: #6B5B95; }
 
.stat-text { display: flex; flex-direction: column; gap: 2px; }
 
.stat-label { font-size: 0.72rem; color: #5c6b64; font-weight: 600; }
.stat-value { font-size: 1.25rem; font-weight: 700; color: #0F212F; }
.stat-value small { font-size: 0.7rem; font-weight: 600; color: #8a9791; }
 
/* SEARCH BAR */
.search-bar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
 
.search-wrap {
  position: relative;
  flex: 1;
  min-width: 240px;
  max-width: 420px;
}
 
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8a9791;
}
 
.search-input {
  width: 100%;
  border: 1.5px solid #d7e2d8;
  border-radius: 10px;
  padding: 9px 12px 9px 34px;
  font-size: 0.84rem;
  font-family: inherit;
  color: #0F212F;
  outline: none;
  background: #FFFFFF;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
 
.search-input:focus {
  border-color: #116D3E;
  box-shadow: 0 0 0 3px rgba(17, 109, 62, 0.14);
}
 
.legend {
  display: flex;
  align-items: center;
  gap: 14px;
}
 
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #5c6b64;
  font-weight: 600;
}
 
.legend-dot { width: 9px; height: 9px; border-radius: 50%; }
.legend-dot.green { background: #116D3E; }
.legend-dot.gray  { background: #8a9791; }
 
/* MAP LAYOUT */
.map-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.1rem;
  flex: 1;
  min-height: 520px;
}
 
.map-container {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #EAF1EC;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
}
 
.leaflet-map-el { width: 100%; height: 100%; min-height: 520px; }
 
.map-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: rgba(248, 250, 248, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 0.85rem;
  color: #5c6b64;
  font-weight: 600;
}
 
.error-overlay { color: #C1473D; }
 
.spinner {
  width: 26px;
  height: 26px;
  border: 3px solid #E7F0EC;
  border-top-color: #116D3E;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
 
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
 
/* DETAIL PANEL */
.detail-panel {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  overflow-y: auto;
}
 
.detail-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 2rem;
  text-align: center;
  color: #8a9791;
  font-size: 0.85rem;
}
 
.detail-content { display: flex; flex-direction: column; }
 
.farm-image-wrap {
  position: relative;
  height: 150px;
  background: linear-gradient(135deg, #E7F0EC, #F1F6F2);
}
 
.farm-image { width: 100%; height: 100%; object-fit: cover; }
 
.farm-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #116D3E;
  opacity: 0.5;
}
 
.insurance-badge {
  position: absolute;
  bottom: 10px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}
 
.insurance-badge.insured   { background: rgba(17, 109, 62, 0.9); color: #FFFFFF; }
.insurance-badge.uninsured { background: rgba(15, 33, 47, 0.7); color: #FFFFFF; }
 
.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(15, 33, 47, 0.55);
  color: #FFFFFF;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.close-btn:hover { background: rgba(15, 33, 47, 0.75); }
 
.detail-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 1rem 1.1rem 0;
}
 
.detail-title-row h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0F212F;
}
 
.crop-pill {
  font-size: 0.68rem;
  font-weight: 700;
  color: #AC7A2F;
  background: rgba(210, 149, 57, 0.14);
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}
 
.detail-divider {
  height: 1px;
  background: #EAF1EC;
  margin: 0.9rem 1.1rem;
}
 
.section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #8a9791;
  padding: 0 1.1rem;
  margin-bottom: 0.7rem;
}
 
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
  padding: 0 1.1rem;
}
 
.detail-item { display: flex; flex-direction: column; gap: 3px; }
.detail-item.span-2 { grid-column: span 2; }
 
.detail-label { font-size: 0.68rem; color: #8a9791; font-weight: 600; }
.detail-val { font-size: 0.84rem; color: #0F212F; font-weight: 600; }
.detail-val.coords { font-variant-numeric: tabular-nums; }
.detail-val.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.detail-sub { font-size: 0.74rem; color: #5c6b64; text-transform: capitalize; }
 
.farmer-profile-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 1.1rem;
  margin-bottom: 0.9rem;
}
 
.farmer-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
 
.farmer-avatar-placeholder {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(17, 109, 62, 0.1);
  color: #116D3E;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.78rem;
  flex-shrink: 0;
}
 
.farmer-name-block { display: flex; flex-direction: column; gap: 2px; }
 
.btn-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin: 1.1rem;
  padding: 10px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  border: none;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.28);
}
 
/* LEAFLET OVERRIDES */
:global(.farm-pin) { background: transparent; border: none; }
:global(.leaflet-popup-content-wrapper) { border-radius: 10px; }
 
/* RESPONSIVE */
@media (max-width: 1100px) {
  .map-layout { grid-template-columns: 1fr; min-height: unset; }
  .leaflet-map-el { min-height: 380px; }
  .detail-panel { max-height: 480px; }
}
 
@media (max-width: 720px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
</style>
 