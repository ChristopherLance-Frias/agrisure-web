<template>
  <div class="inv-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Farming Supply Inventory</h2>
        <p class="page-subtitle">Manage stocks and create distribution events for barangay officials.</p>
      </div>

      <div class="header-actions">
        <button class="btn-secondary" @click="activeTab = 'inventory'; showAddSupply = true">
          Add supply
        </button>

        <button class="btn-primary" @click="openCreateEvent">
          Create distribution event
        </button>
      </div>
    </div>

    <div class="metrics-row">
      <div class="metric-card">
        <div>
          <p class="metric-label">Total supply types</p>
          <p class="metric-value">{{ supplies.length }}</p>
        </div>
      </div>

      <div class="metric-card">
        <div>
          <p class="metric-label">In stock</p>
          <p class="metric-value val-green">{{ supplies.filter(s => s.status === 'in-stock').length }}</p>
        </div>
      </div>

      <div class="metric-card">
        <div>
          <p class="metric-label">Low stock</p>
          <p class="metric-value val-amber">{{ supplies.filter(s => s.status === 'low').length }}</p>
        </div>
      </div>

      <div class="metric-card">
        <div>
          <p class="metric-label">Distribution events</p>
          <p class="metric-value val-blue">{{ distributionEvents.length }}</p>
        </div>
      </div>

      <div class="metric-card">
        <div>
          <p class="metric-label">Completed events</p>
          <p class="metric-value val-purple">{{ distributionEvents.filter(e => e.status === 'completed').length }}</p>
        </div>
      </div>
    </div>

    <div class="tab-bar">
      <button class="tab-btn" :class="{ active: activeTab === 'inventory' }" @click="activeTab = 'inventory'">
        Supply stocks
      </button>

      <button class="tab-btn" :class="{ active: activeTab === 'lists' }" @click="activeTab = 'lists'">
        Distribution events
      </button>
    </div>

    <div v-if="activeTab === 'inventory'">
      <div class="toolbar">
        <div class="search-wrap">
          <input v-model="supplySearch" type="text" placeholder="Search supply name or category…" class="search-input" />
        </div>

        <div class="filter-group">
          <button
            v-for="f in stockFilters"
            :key="f.value"
            class="filter-tag"
            :class="{ active: supplyFilter === f.value }"
            @click="supplyFilter = f.value"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Supply name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Qty available</th>
              <th>Qty distributed</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody v-if="!loadingSupplies">
            <tr v-for="s in filteredSupplies" :key="s.id">
              <td class="td-name">{{ s.name }}</td>
              <td><span class="cat-tag">{{ s.category }}</span></td>
              <td class="td-muted">{{ s.unit }}</td>
              <td class="td-qty">{{ Number(s.qty_available || 0).toLocaleString() }}</td>
              <td class="td-muted">{{ Number(s.qty_distributed || 0).toLocaleString() }}</td>
              <td><span class="status-pill" :class="'sp-' + s.status">{{ stockLabel(s.status) }}</span></td>
              <td>
                <div class="row-actions">
                  <button class="icon-btn" @click="editSupply(s)">Edit</button>
                  <button class="icon-btn" @click="deleteSupply(s.id)">Delete</button>
                </div>
              </td>
            </tr>

            <tr v-if="!filteredSupplies.length">
              <td colspan="7" class="td-empty">No supplies found</td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td colspan="7" class="td-empty">Loading inventory…</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'lists'" class="lists-area">
      <div class="list-col">
        <div class="toolbar">
          <div class="search-wrap">
            <input v-model="listSearch" type="text" placeholder="Search event title…" class="search-input" />
          </div>

          <div class="filter-group">
            <button
              v-for="f in listFilters"
              :key="f.value"
              class="filter-tag"
              :class="{ active: listFilter === f.value }"
              @click="listFilter = f.value"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <div class="dist-cards" v-if="!loadingLists">
          <div
            v-for="event in filteredLists"
            :key="event.id"
            class="dist-card"
            :class="{ selected: selectedEvent && selectedEvent.id === event.id }"
            @click="selectedEvent = event"
          >
            <div class="dc-top">
              <div>
                <p class="dc-id">{{ event.reference_no || ('EVENT-' + event.id) }}</p>
                <p class="dc-barangay">{{ event.title }}</p>
              </div>

              <span class="status-pill" :class="'sp-' + event.status">
                {{ listLabel(event.status) }}
              </span>
            </div>

            <div class="dc-meta">
              <span>{{ event.distribution_date }}</span>
              <span>{{ event.lists?.length || 0 }} barangay list/s</span>
            </div>
          </div>

          <div v-if="!filteredLists.length" class="empty-state">
            <p>No distribution events found</p>
          </div>
        </div>

        <div class="empty-state" v-else>
          <p>Loading distribution events…</p>
        </div>
      </div>

      <div class="detail-col" v-if="selectedEvent">
        <div class="detail-card">
          <div class="detail-header">
            <div>
              <p class="detail-id">{{ selectedEvent.reference_no || selectedEvent.id }}</p>
              <p class="detail-barangay">{{ selectedEvent.title }}</p>
            </div>

            <span class="status-pill" :class="'sp-' + selectedEvent.status">
              {{ listLabel(selectedEvent.status) }}
            </span>
          </div>

          <div class="detail-meta-row">
            <div class="dm-item">
              <span class="dm-label">Date</span>
              <span class="dm-val">{{ selectedEvent.distribution_date }}</span>
            </div>

            <div class="dm-item">
              <span class="dm-label">Time</span>
              <span class="dm-val">{{ selectedEvent.distribution_time || '—' }}</span>
            </div>

            <div class="dm-item">
              <span class="dm-label">Venue</span>
              <span class="dm-val">{{ selectedEvent.venue }}</span>
            </div>

            <div class="dm-item">
              <span class="dm-label">Barangay Lists</span>
              <span class="dm-val">{{ selectedEvent.lists?.length || 0 }}</span>
            </div>
          </div>

          <p class="section-label">Barangay Lists</p>

          <div
            v-for="list in selectedEvent.lists || []"
            :key="list.id"
            style="margin-bottom: 1rem; border: 1px solid #eef2ef; padding: .8rem; border-radius: 10px;"
          >
            <p class="td-name">
              Brgy. {{ list.barangay?.name || 'Unknown Barangay' }}
            </p>

            <p class="td-muted">
              Farmers: {{ list.farmers?.length || 0 }}
            </p>

            <table class="inner-table" style="margin-top:.5rem">
              <thead>
                <tr>
                  <th>Supply</th>
                  <th>Total Qty</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="item in list.items || []" :key="item.id">
                  <td>{{ item.supply?.name }}</td>
                  <td>{{ item.quantity }} {{ item.supply?.unit }}</td>
                </tr>
              </tbody>
            </table>

            <div class="farmer-chips">
              <span
                class="farmer-chip"
                v-for="f in list.farmers || []"
                :key="f.id"
              >
                {{ f.farmer?.last_name }}, {{ f.farmer?.first_name }},{{ f.farmer?.middle_name }}
              </span>
            </div>
          </div>

          <div class="detail-actions">
            <button
              v-if="selectedEvent.status === 'draft'"
              class="action-btn btn-send"
              @click="publishDistributionEvent(selectedEvent)"
            >
              Publish to barangays
            </button>

            <button
              v-if="selectedEvent.status === 'published'"
              class="action-btn btn-send"
              @click="completeDistributionEvent(selectedEvent)"
            >
              Mark as completed
            </button>
          </div>
        </div>
      </div>

      <div class="detail-empty" v-else>
        <p>Select an event to view details</p>
      </div>
    </div>

    <transition name="fade">
      <div class="modal-backdrop" v-if="showAddSupply" @click.self="closeAddSupply">
        <div class="modal">
          <div class="modal-head">
            <h4>{{ editingSupply ? 'Edit supply' : 'Add supply' }}</h4>
            <button class="modal-close" @click="closeAddSupply">×</button>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>Supply name</label>
              <input v-model="supplyForm.name" type="text" />
            </div>

            <div class="form-field">
              <label>Category</label>
              <select v-model="supplyForm.category">
                <option value="">Select category</option>
                <option>Fertilizer</option>
                <option>Pesticide</option>
                <option>Seeds</option>
                <option>Tools</option>
                <option>Equipment</option>
                <option>Other</option>
              </select>
            </div>

            <div class="form-field">
              <label>Unit</label>
              <input v-model="supplyForm.unit" type="text" />
            </div>

            <div class="form-field">
              <label>Qty available</label>
              <input v-model.number="supplyForm.qty_available" type="number" min="0" />
            </div>

            <div class="form-field" style="grid-column:1/-1">
              <label>Low stock threshold</label>
              <input v-model.number="supplyForm.low_threshold" type="number" min="0" />
            </div>
          </div>

          <div class="modal-actions">
            <button class="modal-btn modal-cancel" @click="closeAddSupply">Cancel</button>
            <button class="modal-btn modal-confirm" @click="saveSupply">
              {{ editingSupply ? 'Save changes' : 'Add supply' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div class="modal-backdrop" v-if="showCreateEvent" @click.self="showCreateEvent = false">
        <div class="modal modal-wide" style="max-width: 800px;">
          <div class="modal-head">
            <h4>Create distribution event</h4>
            <button class="modal-close" @click="showCreateEvent = false">×</button>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>Title</label>
              <input v-model="eventForm.title" placeholder="e.g. Fertilizer Distribution" />
            </div>

            <div class="form-field">
              <label>Date</label>
              <input v-model="eventForm.distribution_date" type="date" />
            </div>

            <div class="form-field">
              <label>Time</label>
              <input v-model="eventForm.distribution_time" type="time" />
            </div>

            <div class="form-field">
              <label>Venue</label>
              <input v-model="eventForm.venue" placeholder="e.g. MAO Office" />
            </div>

            <div class="form-field" style="grid-column:1/-1">
              <label>Description</label>
              <textarea v-model="eventForm.description" placeholder="Optional"></textarea>
            </div>
          </div>

          <p class="section-label" style="margin:1rem 0 8px">Barangay Lists</p>

          <div
            v-for="(brgyList, index) in eventForm.barangay_lists"
            :key="index"
            class="barangay-list-box"
            style="border:1px solid #dde8de; padding:1rem; border-radius:12px; margin-bottom:1rem;"
          >
            <div class="form-grid">
              <div class="form-field">
                <label>Barangay</label>
                <select v-model="brgyList.user_id" @change="selectBarangayForList(index)">
                  <option value="">Select Barangay</option>
                  <option
                    v-for="user in barangayAccounts"
                    :key="user.id"
                    :value="user.id"
                  >
                    {{ user.barangay?.name }}
                  </option>
                </select>
              </div>

              <div class="form-field">
                <label>Barangay Official</label>
                <input :value="brgyList.official" readonly />
              </div>
            </div>

            <p class="section-label" style="margin:1rem 0 8px">Supply Items</p>

            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 0.5rem;">
              <div v-for="(item, idx) in brgyList.items" :key="idx" style="display: flex; align-items: center; gap: 4px; background: #f0f4f0; padding: 4px 8px; border-radius: 6px;">
                <select v-model="item.supply_id" style="padding: 4px; font-size: 12px; width: auto; border: 1px solid #d0ddd1; border-radius: 4px;">
                  <option value="">Select supply</option>
                  <option v-for="s in supplies" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </option>
                </select>
                <button class="icon-btn" style="padding: 2px;" @click="brgyList.items.splice(idx, 1)">×</button>
              </div>
              <button class="btn-ghost" @click="brgyList.items.push({ supply_id: '' })">
                + Add item
              </button>
            </div>

            <p class="section-label" style="margin:1rem 0 8px">
              Farmer Recipients ({{ brgyList.farmer_ids.length }} selected)
            </p>

            <div class="recipient-actions" style="margin-bottom: 0.5rem;">
              <button type="button" class="filter-tag" style="padding: 2px 8px;" @click="brgyList.farmer_ids = brgyList.farmers.map(f => f.id)">
                Select All
              </button>
              <button type="button" class="filter-tag" style="padding: 2px 8px;" @click="brgyList.farmer_ids = []">
                Clear
              </button>
            </div>

            <div class="farmers-list" style="display: flex; flex-wrap: wrap; gap: 8px; max-height: 120px; overflow-y: auto; border: 1px solid #eef2ef; padding: 8px; border-radius: 8px; background: #fafcfa; margin-bottom: 1rem;">
              <label
                v-for="farmer in brgyList.farmers"
                :key="farmer.id"
                class="farmer-option"
                style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;"
              >
                <input
                  type="checkbox"
                  :value="farmer.id"
                  v-model="brgyList.farmer_ids"
                />
                {{ farmer.last_name }}, {{ farmer.first_name }}, {{ farmer.middle_name }}
              </label>
            </div>

            <div v-if="brgyList.farmer_ids.length && brgyList.items.some(i => i.supply_id)" class="allocation-matrix-section" style="margin-top: 1rem;">
              <p class="section-label" style="color: #145c2e;">Allocation Matrix</p>
              <div style="overflow-x: auto; border: 1px solid #dde8de; border-radius: 8px; background: #fff;">
                <table class="inner-table" style="margin-bottom: 0;">
                  <thead>
                    <tr>
                      <th>Farmer</th>
                      <th v-for="item in brgyList.items.filter(i => i.supply_id)" :key="item.supply_id">
                        {{ supplyName(item.supply_id) }}
                        <span style="display:block; font-size: 10px; color: #718a77; font-weight: normal;">
                          Total: {{ totalAllocatedForSupply(brgyList, item.supply_id) }}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="farmerId in brgyList.farmer_ids" :key="farmerId">
                      <td class="td-name" style="font-size: 12px;">
                        {{ brgyList.farmers.find(f => f.id === farmerId)?.last_name }}, 
                        {{ brgyList.farmers.find(f => f.id === farmerId)?.first_name }}
                      </td>
                      <td v-for="item in brgyList.items.filter(i => i.supply_id)" :key="item.supply_id">
                        <input 
                          type="number" 
                          min="0" 
                          style="width: 70px; padding: 4px 6px; font-size: 12px; text-align: center; border: 1px solid #ccc; border-radius: 4px;"
                          :value="getAllocation(brgyList, farmerId, item.supply_id)"
                          @input="setAllocation(brgyList, farmerId, item.supply_id, $event.target.value)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <button class="btn-ghost" style="margin-top:1rem; border-color: #fee2e2; color: #7f1d1d;" @click="eventForm.barangay_lists.splice(index, 1)">
              Remove Barangay List
            </button>
          </div>

          <button class="btn-ghost" @click="addBarangayList">
            + Add Barangay List
          </button>

          <div class="modal-actions">
            <button class="modal-btn modal-cancel" @click="showCreateEvent = false">
              Cancel
            </button>

            <button
              class="modal-btn modal-confirm"
              @click="saveDistributionEvent"
              :disabled="!canSaveEvent"
            >
              Save as draft
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="slide-toast">
      <div class="toast" :class="'toast-' + toast.type" v-if="toast.visible">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'http://192.168.100.173:8000'

export default {
  name: 'InventoryPage',

  data() {
    return {
      activeTab: 'inventory',

      supplies: [],
      distributionEvents: [],

      loadingSupplies: false,
      loadingLists: false,

      supplySearch: '',
      supplyFilter: 'all',

      listSearch: '',
      listFilter: 'all',

      selectedEvent: null,

      showAddSupply: false,
      showCreateEvent: false,

      editingSupply: null,

      toast: {
        visible: false,
        message: '',
        type: 'success'
      },

      stockFilters: [
        { label: 'All', value: 'all' },
        { label: 'In stock', value: 'in-stock' },
        { label: 'Low stock', value: 'low' },
        { label: 'Out of stock', value: 'out' }
      ],

      listFilters: [
        { label: 'All', value: 'all' },
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' }
      ],

      supplyForm: {
        name: '',
        category: '',
        unit: '',
        qty_available: 0,
        low_threshold: 50
      },

      barangayAccounts: [],

      eventForm: {
        title: '',
        distribution_date: '',
        distribution_time: '',
        venue: '',
        description: '',
        barangay_lists: []
      }
    }
  },

  computed: {
    filteredSupplies() {
      let list = this.supplies || []

      if (this.supplyFilter !== 'all') {
        list = list.filter(s => s.status === this.supplyFilter)
      }

      if (this.supplySearch.trim()) {
        const q = this.supplySearch.trim().toLowerCase()
        list = list.filter(s =>
          String(s.name || '').toLowerCase().includes(q) ||
          String(s.category || '').toLowerCase().includes(q)
        )
      }

      return list
    },

    filteredLists() {
      let list = this.distributionEvents || []

      if (this.listFilter !== 'all') {
        list = list.filter(e => e.status === this.listFilter)
      }

      if (this.listSearch.trim()) {
        const q = this.listSearch.trim().toLowerCase()
        list = list.filter(e =>
          String(e.id).toLowerCase().includes(q) ||
          String(e.title || '').toLowerCase().includes(q) ||
          String(e.reference_no || '').toLowerCase().includes(q)
        )
      }

      return list
    },

    canSaveEvent() {
      return (
        this.eventForm.title &&
        this.eventForm.distribution_date &&
        this.eventForm.venue &&
        this.eventForm.barangay_lists.length &&
        this.eventForm.barangay_lists.every(list =>
          list.barangay_id &&
          list.farmer_ids.length > 0 &&
          list.items.some(i => i.supply_id) &&
          list.allocations.some(a => a.quantity > 0)
        )
      )
    }
  },

  async mounted() {
    await Promise.all([
      this.fetchSupplies(),
      this.fetchDistributionEvents(),
      this.fetchBarangayAccounts()
    ])
  },

  methods: {
    stockLabel(status) {
      const map = {
        'in-stock': 'In stock',
        low: 'Low stock',
        out: 'Out of stock'
      }

      return map[status] || status
    },

    listLabel(status) {
      const map = {
        draft: 'Draft',
        published: 'Published',
        completed: 'Completed',
        cancelled: 'Cancelled'
      }

      return map[status] || status
    },

    showToast(message, type = 'success') {
      this.toast = { visible: true, message, type }

      clearTimeout(this._toastTimer)

      this._toastTimer = setTimeout(() => {
        this.toast.visible = false
      }, 3000)
    },

    openCreateEvent() {
      this.activeTab = 'lists'
      this.showCreateEvent = true

      if (!this.eventForm.barangay_lists.length) {
        this.addBarangayList()
      }
    },

    addBarangayList() {
      this.eventForm.barangay_lists.push({
        user_id: '',
        barangay_id: '',
        barangay_name: '',
        official: '',
        farmers: [],
        farmer_ids: [],
        items: [
          {
            supply_id: ''
          }
        ],
        allocations: []
      })
    },

    async selectBarangayForList(index) {
      const list = this.eventForm.barangay_lists[index]

      const selected = this.barangayAccounts.find(
        user => user.id == list.user_id
      )

      if (!selected) return

      list.barangay_id = selected.barangay_id
      list.barangay_name = selected.barangay?.name || ''
      list.official = `${selected.first_name} ${selected.last_name}`
      list.farmer_ids = []
      list.allocations = []

      try {
        const response = await axios.get(
          `${API_BASE}/api/barangays/${selected.barangay_id}/farmers`
        )

        list.farmers = response.data
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast('Failed to load farmers', 'error')
      }
    },

    /* --- Helper Allocation Matrix Methods --- */
    getAllocation(brgyList, farmerId, supplyId) {
      const alloc = brgyList.allocations.find(
        a => a.farmer_id === farmerId && a.supply_id === supplyId
      )
      return alloc ? alloc.quantity : 0
    },

    setAllocation(brgyList, farmerId, supplyId, value) {
      const quantity = parseInt(value, 10) || 0
      const index = brgyList.allocations.findIndex(
        a => a.farmer_id === farmerId && a.supply_id === supplyId
      )

      if (index !== -1) {
        if (quantity > 0) {
          brgyList.allocations[index].quantity = quantity
        } else {
          brgyList.allocations.splice(index, 1)
        }
      } else if (quantity > 0) {
        brgyList.allocations.push({
          farmer_id: farmerId,
          supply_id: supplyId,
          quantity: quantity
        })
      }
    },

    totalAllocatedForSupply(brgyList, supplyId) {
      return brgyList.allocations
        .filter(a => a.supply_id === supplyId && brgyList.farmer_ids.includes(a.farmer_id))
        .reduce((sum, a) => sum + (a.quantity || 0), 0)
    },

    supplyName(supplyId) {
      const supply = this.supplies.find(s => s.id === supplyId)
      return supply ? supply.name : 'Unknown Supply'
    },

    async fetchSupplies() {
      try {
        this.loadingSupplies = true
        const response = await axios.get(`${API_BASE}/api/inventory`)
        this.supplies = response.data
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast('Failed to load inventory', 'error')
      } finally {
        this.loadingSupplies = false
      }
    },

    async fetchDistributionEvents() {
      try {
        this.loadingLists = true
        const response = await axios.get(`${API_BASE}/api/distribution-events`)
        this.distributionEvents = response.data
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast('Failed to load distribution events', 'error')
      } finally {
        this.loadingLists = false
      }
    },

    async fetchBarangayAccounts() {
      try {
        const response = await axios.get(`${API_BASE}/api/barangay-accounts`)
        this.barangayAccounts = response.data
      } catch (error) {
        console.error(error.response?.data || error)
      }
    },

    editSupply(supply) {
      this.editingSupply = supply

      this.supplyForm = {
        name: supply.name,
        category: supply.category,
        unit: supply.unit,
        qty_available: supply.qty_available,
        low_threshold: supply.low_threshold ?? 50
      }

      this.showAddSupply = true
    },

    closeAddSupply() {
      this.showAddSupply = false
      this.editingSupply = null

      this.supplyForm = {
        name: '',
        category: '',
        unit: '',
        qty_available: 0,
        low_threshold: 50
      }
    },

    async saveSupply() {
      try {
        if (this.editingSupply) {
          await axios.put(
            `${API_BASE}/api/inventory/${this.editingSupply.id}`,
            this.supplyForm
          )

          this.showToast('Supply updated successfully', 'success')
        } else {
          await axios.post(`${API_BASE}/api/inventory`, this.supplyForm)
          this.showToast('Supply added successfully', 'success')
        }

        await this.fetchSupplies()
        this.closeAddSupply()
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast('Unable to save supply', 'error')
      }
    },

    async deleteSupply(id) {
      if (!confirm('Delete this supply?')) return

      try {
        await axios.delete(`${API_BASE}/api/inventory/${id}`)
        await this.fetchSupplies()
        this.showToast('Supply deleted', 'success')
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast('Failed to delete supply', 'error')
      }
    },

    async saveDistributionEvent() {
      try {
        const payload = {
          title: this.eventForm.title,
          distribution_date: this.eventForm.distribution_date,
          distribution_time: this.eventForm.distribution_time || null,
          venue: this.eventForm.venue,
          description: this.eventForm.description || null,

          barangay_lists: this.eventForm.barangay_lists.map(list => ({
            barangay_id: list.barangay_id,
            farmer_ids: list.farmer_ids,
            items: list.items.filter(i => i.supply_id),
            allocations: list.allocations.filter(a =>
              list.farmer_ids.includes(a.farmer_id) &&
              list.items.some(i => i.supply_id === a.supply_id) &&
              a.quantity > 0
            )
          }))
        }

        await axios.post(`${API_BASE}/api/distribution-events`, payload)

        await this.fetchDistributionEvents()

        this.showToast('Distribution event created', 'success')
        this.showCreateEvent = false
        this.resetEventForm()
      } catch (error) {
        console.error(error.response?.data || error)

        this.showToast(
          error.response?.data?.message || 'Failed to create distribution event',
          'error'
        )
      }
    },

    async publishDistributionEvent(event) {
      try {
        await axios.patch(`${API_BASE}/api/distribution-events/${event.id}/publish`)
        await this.fetchDistributionEvents()
        this.showToast('Distribution event published', 'success')
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast('Unable to publish event', 'error')
      }
    },

    async completeDistributionEvent(event) {
      try {
        await axios.patch(`${API_BASE}/api/distribution-events/${event.id}/complete`)
        await this.fetchDistributionEvents()
        this.showToast('Distribution event completed', 'success')
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast('Unable to complete event', 'error')
      }
    },

    resetEventForm() {
      this.eventForm = {
        title: '',
        distribution_date: '',
        distribution_time: '',
        venue: '',
        description: '',
        barangay_lists: []
      }
    }
  }
}
</script>

<style scoped>
.inv-page {
  font-family: 'DM Sans', sans-serif;
  background: #F5F7F5;
  padding: 2rem;
  color: #263238;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #263238;
  margin: 0 0 4px;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #5c6b64;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s ease, transform 0.1s ease;
}

.btn-primary {
  background: #2E7D32;
  color: #FFFFFF;
}

.btn-primary:hover {
  background: #256428;
}

.btn-secondary {
  background: #FFFFFF;
  color: #2E7D32;
  border: 1px solid #66BB6A;
}

.btn-secondary:hover {
  background: #eaf5ea;
}

.btn-ghost {
  background: transparent;
  border: 1px dashed #66BB6A;
  color: #2E7D32;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.btn-ghost:hover {
  background: #eaf5ea;
}

/* Metrics */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 1.1rem 1.3rem;
  box-shadow: 0 1px 3px rgba(38, 50, 56, 0.08);
}

.metric-label {
  font-size: 0.78rem;
  color: #5c6b64;
  margin: 0 0 6px;
  font-weight: 500;
}

.metric-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #263238;
  margin: 0;
}

.val-green { color: #2E7D32; }
.val-amber { color: #F9A825; }
.val-blue { color: #1976D2; }
.val-purple { color: #6A4C93; }

/* Tabs */
.tab-bar {
  display: flex;
  gap: 4px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 5px;
  width: fit-content;
  margin-bottom: 1.3rem;
  box-shadow: 0 1px 3px rgba(38, 50, 56, 0.06);
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 9px 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #5c6b64;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease;
}

.tab-btn.active {
  background: #2E7D32;
  color: #FFFFFF;
}

/* Toolbar / filters */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.search-wrap {
  flex: 1;
  min-width: 220px;
}

.search-input,
.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  border: 1px solid #d7e2d8;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 0.85rem;
  font-family: inherit;
  color: #263238;
  background: #FFFFFF;
  box-sizing: border-box;
}

.search-input:focus,
.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #66BB6A;
  box-shadow: 0 0 0 3px rgba(102, 187, 106, 0.25);
}

.filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tag {
  border: 1px solid #d7e2d8;
  background: #FFFFFF;
  color: #5c6b64;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.filter-tag.active {
  background: #2E7D32;
  border-color: #2E7D32;
  color: #FFFFFF;
}

/* Table */
.table-card {
  background: #FFFFFF;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(38, 50, 56, 0.08);
}

.data-table,
.inner-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.inner-table th {
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #5c6b64;
  background: #F5F7F5;
  padding: 12px 16px;
  font-weight: 600;
}

.data-table td,
.inner-table td {
  padding: 12px 16px;
  font-size: 0.85rem;
  border-top: 1px solid #eef2ef;
  color: #263238;
}

.td-name { font-weight: 600; }
.td-muted { color: #5c6b64; }
.td-qty { font-weight: 600; color: #2E7D32; }

.td-empty {
  text-align: center;
  padding: 2rem !important;
  color: #93a29a;
}

.cat-tag {
  background: #eaf5ea;
  color: #2E7D32;
  border-radius: 6px;
  padding: 3px 9px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Status pills */
.status-pill {
  display: inline-block;
  padding: 4px 11px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
}

.sp-in-stock,
.sp-published { background: #e5f4e6; color: #2E7D32; }

.sp-low,
.sp-draft { background: #fdf1d6; color: #b9790a; }

.sp-out,
.sp-cancelled { background: #fde3e3; color: #b3261e; }

.sp-completed { background: #e6ecff; color: #3949ab; }

.row-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  border: none;
  background: transparent;
  color: #2E7D32;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.icon-btn:hover { text-decoration: underline; }

/* Distribution lists */
.lists-area {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.2rem;
}

.dist-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dist-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  border: 1px solid transparent;
  box-shadow: 0 1px 3px rgba(38, 50, 56, 0.06);
  transition: border-color 0.15s ease;
}

.dist-card:hover { border-color: #66BB6A; }

.dist-card.selected {
  border-color: #2E7D32;
  background: #f2f9f2;
}

.dc-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.dc-id {
  font-size: 0.72rem;
  color: #93a29a;
  margin: 0 0 3px;
  font-weight: 600;
}

.dc-barangay {
  font-size: 0.92rem;
  font-weight: 700;
  color: #263238;
  margin: 0;
}

.dc-meta {
  display: flex;
  gap: 12px;
  font-size: 0.78rem;
  color: #5c6b64;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #93a29a;
  background: #FFFFFF;
  border-radius: 12px;
  font-size: 0.85rem;
}

.detail-card {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 1.4rem;
  box-shadow: 0 1px 3px rgba(38, 50, 56, 0.08);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.detail-id {
  font-size: 0.75rem;
  color: #93a29a;
  font-weight: 600;
  margin: 0 0 4px;
}

.detail-barangay {
  font-size: 1.15rem;
  font-weight: 700;
  color: #263238;
  margin: 0;
}

.detail-meta-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  background: #F5F7F5;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.2rem;
}

.dm-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dm-label {
  font-size: 0.7rem;
  color: #5c6b64;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 600;
}

.dm-val {
  font-size: 0.9rem;
  font-weight: 600;
  color: #263238;
}

.section-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #263238;
  margin: 0 0 8px;
}

.farmer-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 0.6rem;
}

.farmer-chip {
  background: #eaf5ea;
  color: #2E7D32;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 600;
}

.detail-actions {
  margin-top: 1.2rem;
  display: flex;
  gap: 10px;
}

.action-btn {
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.btn-send {
  background: #2E7D32;
  color: #FFFFFF;
}

.btn-send:hover { background: #256428; }

.detail-empty {
  background: #FFFFFF;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #93a29a;
  font-size: 0.9rem;
  min-height: 300px;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(38, 50, 56, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 1.6rem;
  width: 90%;
  max-width: 520px;
  max-height: 88vh;
  overflow-y: auto;
}

.modal-wide { max-width: 800px; }

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.modal-head h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #263238;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  color: #5c6b64;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #5c6b64;
}

.form-field textarea {
  min-height: 80px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 1.4rem;
}

.modal-btn {
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.modal-cancel {
  background: #F5F7F5;
  color: #5c6b64;
}

.modal-confirm {
  background: #2E7D32;
  color: #FFFFFF;
}

.modal-confirm:hover { background: #256428; }
.modal-confirm:disabled {
  background: #a9c9ab;
  cursor: not-allowed;
}

.barangay-list-box {
  background: #fafcfa;
}

.farmer-option:hover { color: #2E7D32; }

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #FFFFFF;
  z-index: 1200;
  box-shadow: 0 4px 12px rgba(38, 50, 56, 0.2);
}

.toast-success { background: #2E7D32; }
.toast-error { background: #b3261e; }

/* Transitions */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

.slide-toast-enter-active,
.slide-toast-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.slide-toast-enter-from,
.slide-toast-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>