<template>
  <div class="farm-map-page">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Farm Map</h2>
        <p class="page-sub">Showing farm locations across all barangays</p>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-label">Total Farms</span>
        <span class="stat-value">{{ farms.length }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">With Coordinates</span>
        <span class="stat-value">{{ mappableFarms.length }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Total Area</span>
        <span class="stat-value">{{ totalArea }} ha</span>
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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34a853" stroke-width="1.5">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
            <line x1="9" y1="3" x2="9" y2="18"/>
            <line x1="15" y1="6" x2="15" y2="21"/>
          </svg>
          <p>Click a pin on the map to view farm details</p>
        </div>

        <div v-else class="detail-content">
          <div class="detail-header">
            <h3>{{ selectedFarm.farm_name || 'Unnamed Farm' }}</h3>
            <button class="close-btn" @click="selectedFarm = null">✕</button>
          </div>

          <div class="detail-divider"></div>

          <div class="detail-row">
            <span class="detail-label">Owner</span>
            <span class="detail-val">{{ ownerName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Crop Type</span>
            <span class="detail-val">{{ selectedFarm.crop_type || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Farm Size</span>
            <span class="detail-val">
              {{ selectedFarm.farm_area ? selectedFarm.farm_area + ' ha' : '—' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Coordinates</span>
            <span class="detail-val coords">
              {{ selectedFarm.latitude }}, {{ selectedFarm.longitude }}
            </span>
          </div>
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

export default {
  name: 'FarmMapPage',

  data() {
    return {
      farms: [],
      isLoading: false,
      errorMessage: '',
      selectedFarm: null,
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

    ownerName() {
      if (!this.selectedFarm) return '—'
      const u = this.selectedFarm.farmer_profile?.user
      if (!u) return '—'
      return [u.first_name, u.last_name].filter(Boolean).join(' ') || '—'
    },
  },

  async mounted() {
    await this.fetchFarms()
    this.initMap()
  },

  beforeUnmount() {
    try {
      // 1. Remove zoom control and its DOM listeners first
      if (this.zoomControl && this.map) {
        this.zoomControl.remove()
        this.zoomControl = null
      }

      // 2. Remove all zoom button DOM elements to kill their click handlers
      if (this.$refs.mapRef) {
        const zoomBtns = this.$refs.mapRef.querySelectorAll('.leaflet-control-zoom a')
        zoomBtns.forEach(btn => {
          const clone = btn.cloneNode(true) // cloneNode strips all event listeners
          btn.parentNode && btn.parentNode.replaceChild(clone, btn)
        })
      }

      // 3. Remove markers
      this.markers.forEach(m => { try { m.off(); m.remove() } catch (e) { /* ignore */ } })
      this.markers = []

      // 4. Destroy the map
      if (this.map) {
        this.map.stop()
        this.map.off()
        this.map.remove()
        this.map = null
      }

      // 5. Clear leaflet ID from DOM so it can be re-initialized
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
          zoomControl: false,       // no built-in zoom control
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          boxZoom: false,
        }).setView([15.0794, 120.6200], 11)

        // Keep reference to zoom control so we can remove it cleanly
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

        const marker = L.marker([lat, lng], { icon: GREEN_ICON })
          .addTo(this.map)
          .bindTooltip(farm.farm_name || 'Unnamed Farm', {
            permanent: false,
            direction: 'top',
          })
          .on('click', () => {
            this.selectedFarm = farm
          })

        this.markers.push(marker)
        bounds.push([lat, lng])
      })

      if (bounds.length > 0 && this.map) {
        this.map.fitBounds(bounds, { padding: [40, 40], animate: false })
      }
    },
  },
}
</script>

<style scoped>
.farm-map-page {
  padding: 28px 32px;
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background: #f0f4f0;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a3320;
  margin-bottom: 4px;
}

.page-sub {
  font-size: 13px;
  color: #6b7280;
}

.stats-row {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 130px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #34a853;
}

.map-layout {
  display: flex;
  gap: 16px;
  height: 520px;
}

.map-container {
  flex: 1;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.leaflet-map-el {
  width: 100%;
  height: 100%;
}

.map-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  background: rgba(240,244,240,0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  color: #4a7c59;
}

.error-overlay {
  color: #b91c1c;
  background: rgba(254,242,242,0.9);
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(52,168,83,0.2);
  border-top-color: #34a853;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.detail-panel {
  width: 240px;
  flex-shrink: 0;
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
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
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-header h3 {
  font-size: 15px;
  font-weight: 700;
  color: #1a3320;
  line-height: 1.3;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 13px;
  padding: 2px 4px;
  border-radius: 4px;
  flex-shrink: 0;
}

.close-btn:hover { color: #1a3320; }

.detail-divider {
  height: 1px;
  background: #e5e7eb;
  margin-bottom: 14px;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 14px;
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
  color: #1a3320;
}

.coords {
  font-size: 11px;
  font-family: monospace;
  color: #6b7280;
}

@media (max-width: 768px) {
  .farm-map-page { padding: 16px; }
  .map-layout { flex-direction: column; height: auto; }
  .map-container { height: 360px; }
  .detail-panel { width: 100%; }
}
</style>