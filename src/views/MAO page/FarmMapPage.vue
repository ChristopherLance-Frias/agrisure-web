<template>
  <div class="farm-map-page">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">🗺️ Farm Map</h2>
        <p class="page-sub">Showing farm locations across all barangays</p>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon farms">🌾</div>
        <div class="stat-text">
          <span class="stat-label">Total Farms</span>
          <span class="stat-value">{{ farms.length }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon pins">📍</div>
        <div class="stat-text">
          <span class="stat-label">With Coordinates</span>
          <span class="stat-value">{{ mappableFarms.length }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon area">📐</div>
        <div class="stat-text">
          <span class="stat-label">Total Area</span>
          <span class="stat-value">{{ totalArea }} <small>ha</small></span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon insured">🛡️</div>
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
              v-if="farmImageUrl"
              :src="farmImageUrl"
              :alt="selectedFarm.farm_name || 'Farm photo'"
              class="farm-image"
              @error="onImageError"
            />
            <div v-else class="farm-image-placeholder">🌾</div>

            <span class="insurance-badge" :class="selectedFarm.insurance_status === 'insured' ? 'insured' : 'uninsured'">
              {{ selectedFarm.insurance_status === 'insured' ? '🛡️ Insured' : 'Uninsured' }}
            </span>

            <button class="close-btn" @click="selectedFarm = null">✕</button>
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
              v-if="farmerProfilePhotoUrl"
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
            📍 Center on Map
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

const API_BASE = 'http://192.168.100.173:8000'

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
.farm-map-page {
  padding: 28px 32px;
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background: #F5F7F5;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #0F212F;
  margin-bottom: 4px;
}

.page-sub {
  font-size: 13px;
  color: #6b7280;
}

/* Stats */
.stats-row {
  display: flex;
  gap: 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-card {
  background: white;
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 160px;
  box-shadow: 0 1px 4px rgba(26,51,32,0.08);
  flex: 1;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: rgba(17, 109, 62, 0.1);
}

.stat-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #116D3E;
}

.stat-value small {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

/* Search + legend */
.search-bar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #116D3E;
}

.legend {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: #6b7280;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.legend-dot.green { background: #34A853; }
.legend-dot.gray { background: #9ca3af; }

/* Map layout */
.map-layout {
  display: flex;
  gap: 16px;
  height: 540px;
}

.map-container {
  flex: 1;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 12px rgba(26,51,32,0.1);
}

.leaflet-map-el {
  width: 100%;
  height: 100%;
}

.map-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  background: rgba(245,247,245,0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  color: #116D3E;
}

.error-overlay {
  color: #b91c1c;
  background: rgba(254,242,242,0.9);
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(17,109,62,0.15);
  border-top-color: #116D3E;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Detail panel */
.detail-panel {
  width: 280px;
  flex-shrink: 0;
  background: white;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(26,51,32,0.1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.detail-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 20px;
}

.detail-content {
  padding: 0 0 18px;
}

.farm-image-wrap {
  position: relative;
  width: 100%;
  height: 140px;
  background: #F5F7F5;
}

.farm-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.farm-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.insurance-badge {
  position: absolute;
  bottom: 10px;
  left: 12px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  backdrop-filter: blur(4px);
}

.insurance-badge.insured {
  background: rgba(17, 109, 62, 0.85);
  color: white;
}

.insurance-badge.uninsured {
  background: rgba(107, 114, 128, 0.85);
  color: white;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.9);
  color: #0F212F;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover { background: white; }

.detail-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 18px 0;
}

.detail-title-row h3 {
  font-size: 15px;
  font-weight: 700;
  color: #0F212F;
  line-height: 1.3;
}

.crop-pill {
  font-size: 11px;
  font-weight: 600;
  color: #116D3E;
  background: rgba(17, 109, 62, 0.1);
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}

.detail-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 14px 18px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #116D3E;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 18px;
  margin-bottom: 10px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 18px;
  margin-bottom: 4px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item.span-2 {
  grid-column: span 2;
}

.detail-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
}

.detail-val {
  font-size: 13px;
  font-weight: 600;
  color: #0F212F;
}

.detail-val.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coords {
  font-size: 11px;
  font-family: monospace;
  color: #6b7280;
  font-weight: 500;
}

.farmer-profile-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  margin-bottom: 14px;
}

.farmer-avatar,
.farmer-avatar-placeholder {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.farmer-avatar-placeholder {
  background: rgba(17, 109, 62, 0.12);
  color: #116D3E;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.farmer-name-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-sub {
  font-size: 12px;
  color: #6b7280;
}

.btn-center {
  margin: 16px 18px 0;
  width: calc(100% - 36px);
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: #116D3E;
  color: white;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: background 0.15s ease;
}

.btn-center:hover {
  background: #0A5232;
}

@media (max-width: 768px) {
  .farm-map-page { padding: 16px; }
  .map-layout { flex-direction: column; height: auto; }
  .map-container { height: 360px; }
  .detail-panel { width: 100%; }
}
</style>