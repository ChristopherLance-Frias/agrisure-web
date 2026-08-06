<template>
  <div class="inv-page">
    <!-- ===== Header ===== -->
    <div class="page-header">
      <div class="header-copy">
        <p class="eyebrow">Municipal Agriculture Office</p>
        <h1 class="page-title">Farming Supply Inventory</h1>
        <p class="page-subtitle">Track stock levels and dispatch supplies to barangay officials.</p>
      </div>

      <div class="header-actions">
        <button class="btn btn-ghost" @click="activeTab = 'inventory'; showAddSupply = true">
          <svg viewBox="0 0 20 20" class="icon"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          Add supply
        </button>

        <button class="btn btn-primary" @click="openCreateEvent">
          <svg viewBox="0 0 20 20" class="icon"><path d="M4 6h9M4 10h12M4 14h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          Create distribution event
        </button>
      </div>
    </div>

    <!-- ===== Ledger strip ===== -->
    <div class="ledger-strip">
      <div class="ledger-item">
        <span class="ledger-value">{{ supplies.length }}</span>
        <span class="ledger-label">Supply types</span>
      </div>
      <div class="ledger-divider" />
      <div class="ledger-item">
        <span class="ledger-value tone-green">{{ supplies.filter(s => s.status === 'in-stock').length }}</span>
        <span class="ledger-label">In stock</span>
      </div>
      <div class="ledger-divider" />
      <div class="ledger-item">
        <span class="ledger-value tone-gold">{{ supplies.filter(s => s.status === 'low').length }}</span>
        <span class="ledger-label">Low stock</span>
      </div>
      <div class="ledger-divider" />
      <div class="ledger-item">
        <span class="ledger-value tone-blue">{{ distributionEvents.length }}</span>
        <span class="ledger-label">Distribution events</span>
      </div>
      <div class="ledger-divider" />
      <div class="ledger-item">
        <span class="ledger-value tone-plum">{{ distributionEvents.filter(e => e.status === 'completed').length }}</span>
        <span class="ledger-label">Completed</span>
      </div>
    </div>

    <!-- ===== Section switch ===== -->
    <div class="tab-bar" role="tablist">
      <button class="tab-btn" :class="{ active: activeTab === 'inventory' }" @click="activeTab = 'inventory'">
        Supply stocks
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'lists' }" @click="activeTab = 'lists'">
        Distribution events
      </button>
    </div>

    <!-- ===================== INVENTORY ===================== -->
    <div v-if="activeTab === 'inventory'">
      <div class="toolbar">
        <div class="search-wrap">
          <svg viewBox="0 0 20 20" class="icon search-icon"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M14 14l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          <input v-model="supplySearch" type="text" placeholder="Search supply name or category…" class="search-input" />
        </div>

        <div class="filter-group">
          <button v-for="f in stockFilters" :key="f.value" class="filter-tag" :class="{ active: supplyFilter === f.value }" @click="supplyFilter = f.value">
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
              <th class="num">Available</th>
              <th class="num">Distributed</th>
              <th>Status</th>
              <th class="col-actions"></th>
            </tr>
          </thead>

          <tbody v-if="!loadingSupplies">
            <tr v-for="s in filteredSupplies" :key="s.id" :class="{ 'row-low': s.status === 'low', 'row-out': s.status === 'out' }">
              <td class="td-name">{{ s.name }}</td>
              <td><span class="cat-tag">{{ s.category }}</span></td>
              <td class="td-muted">{{ s.unit }}</td>
              <td class="td-qty num">{{ Number(s.qty_available || 0).toLocaleString() }}</td>
              <td class="td-muted num">{{ Number(s.qty_distributed || 0).toLocaleString() }}</td>
              <td><span class="status-pill" :class="'sp-' + s.status"><i class="dot" />{{ stockLabel(s.status) }}</span></td>
              <td>
                <div class="row-actions">
                  <button class="icon-btn" title="Edit" @click="editSupply(s)">
                    <svg viewBox="0 0 20 20" class="icon"><path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>
                  </button>
                  <button class="icon-btn icon-btn-danger" title="Delete" @click="deleteSupply(s.id)">
                    <svg viewBox="0 0 20 20" class="icon"><path d="M5 6h10M8 6V4h4v2M6 6l1 10h6l1-10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!filteredSupplies.length">
              <td colspan="7">
                <div class="empty-block">
                  <p class="empty-title">No supplies found</p>
                  <p class="empty-copy">Try a different search term or filter, or add a new supply to get started.</p>
                </div>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr><td colspan="7" class="td-loading">Loading inventory…</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===================== DISTRIBUTION EVENTS ===================== -->
    <div v-if="activeTab === 'lists'" class="lists-area">
      <div class="list-col">
        <div class="toolbar toolbar-stack">
          <div class="search-wrap">
            <svg viewBox="0 0 20 20" class="icon search-icon"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M14 14l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            <input v-model="listSearch" type="text" placeholder="Search event title or reference…" class="search-input" />
          </div>

          <div class="filter-group">
            <button v-for="f in listFilters" :key="f.value" class="filter-tag" :class="{ active: listFilter === f.value }" @click="listFilter = f.value">
              {{ f.label }}
            </button>
          </div>
        </div>

        <div class="dist-cards" v-if="!loadingLists">
          <button
            v-for="event in filteredLists"
            :key="event.id"
            class="dist-card"
            :class="{ selected: selectedEvent && selectedEvent.id === event.id }"
            @click="selectEvent(event)"
          >
            <div class="dc-top">
              <p class="dc-id">{{ event.reference_no || ('EVENT-' + event.id) }}</p>
              <span class="status-pill" :class="'sp-' + event.status"><i class="dot" />{{ listLabel(event.status) }}</span>
            </div>
            <p class="dc-title">{{ event.title }}</p>
            <div class="dc-meta">
              <span class="dc-meta-item">
                <svg viewBox="0 0 20 20" class="icon-sm"><rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                {{ event.distribution_date }}
              </span>
              <span class="dc-meta-item">
                <svg viewBox="0 0 20 20" class="icon-sm"><path d="M10 2a5 5 0 100 10 5 5 0 000-10zM3 18c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>
                {{ event.lists?.length || 0 }} barangay list/s
              </span>
            </div>
          </button>

          <div v-if="!filteredLists.length" class="empty-state">
            <p class="empty-title">No distribution events found</p>
            <p class="empty-copy">Create one to start dispatching supplies to barangays.</p>
          </div>
        </div>

        <div class="empty-state" v-else>
          <p>Loading distribution events…</p>
        </div>
      </div>

      <!-- ===== Manifest detail panel ===== -->
      <div class="detail-col" v-if="selectedEvent">
        <div class="manifest-card">
          <div class="manifest-header">
            <div>
              <p class="detail-id">{{ selectedEvent.reference_no || ('EVENT-' + selectedEvent.id) }}</p>
              <h3 class="detail-title">{{ selectedEvent.title }}</h3>
            </div>
            <span class="status-pill status-pill-lg" :class="'sp-' + selectedEvent.status"><i class="dot" />{{ listLabel(selectedEvent.status) }}</span>
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
              <span class="dm-label">Barangay lists</span>
              <span class="dm-val">{{ selectedEvent.lists?.length || 0 }}</span>
            </div>
          </div>

          <div class="perforation"><span v-for="n in 40" :key="n" /></div>

          <p class="section-label">Barangay lists</p>

          <div v-for="list in selectedEvent.lists || []" :key="list.id" class="barangay-block">
            <button class="barangay-block-head" @click="toggleListOpen(list.id)">
              <div class="bb-left">
                <svg class="chevron icon-sm" :class="{ open: isListOpen(list.id) }" viewBox="0 0 20 20"><path d="M7 5l6 5-6 5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span class="bb-name">Brgy. {{ list.barangay?.name || 'Unknown Barangay' }}</span>
              </div>
              <div class="bb-right">
                <span class="bb-stat">{{ list.farmers?.length || 0 }} farmers</span>
                <span class="status-pill" :class="'sp-' + (list.status || 'draft')"><i class="dot" />{{ listLabel(list.status || 'draft') }}</span>
              </div>
            </button>

            <div class="barangay-block-body" v-show="isListOpen(list.id)">
              <table class="inner-table">
                <thead><tr><th>Supply</th><th class="num">Total qty</th></tr></thead>
                <tbody>
                  <tr v-for="item in list.items || []" :key="item.id">
                    <td>{{ item.supply?.name }}</td>
                    <td class="num">{{ item.quantity }} {{ item.supply?.unit }}</td>
                  </tr>
                </tbody>
              </table>

              <p class="mini-label">Recipients</p>
              <div class="farmer-chips">
                <span class="farmer-chip" v-for="f in list.farmers || []" :key="f.id">
                  {{ f.farmer?.last_name }}, {{ f.farmer?.first_name }} {{ f.farmer?.middle_name || '' }}
                </span>
              </div>
            </div>
          </div>

          <div class="detail-actions" v-if="selectedEvent.status === 'draft' || selectedEvent.status === 'published'">
            <button v-if="selectedEvent.status === 'draft'" class="btn btn-primary btn-block" @click="publishDistributionEvent(selectedEvent)">
              Publish to barangays
            </button>
            <button v-if="selectedEvent.status === 'published'" class="btn btn-primary btn-block" @click="completeDistributionEvent(selectedEvent)">
              Mark as completed
            </button>
          </div>
        </div>
      </div>

      <div class="detail-empty" v-else>
        <svg viewBox="0 0 48 48" class="empty-icon"><rect x="8" y="10" width="32" height="30" rx="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 18h32M16 6v8M32 6v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <p class="empty-title">Select an event to view its manifest</p>
        <p class="empty-copy">Details, barangay lists, and status actions will appear here.</p>
      </div>
    </div>

    <!-- ===================== ADD / EDIT SUPPLY MODAL ===================== -->
    <transition name="fade">
      <div class="modal-backdrop" v-if="showAddSupply" @click.self="closeAddSupply">
        <div class="modal">
          <div class="modal-head">
            <h4>{{ editingSupply ? 'Edit supply' : 'Add supply' }}</h4>
            <button class="modal-close" @click="closeAddSupply">×</button>
          </div>

          <div class="form-grid">
            <div class="form-field span-2">
              <label>Supply name</label>
              <input v-model="supplyForm.name" type="text" placeholder="e.g. Urea Fertilizer 50kg" />
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
              <input v-model="supplyForm.unit" type="text" placeholder="e.g. sack, liter, piece" />
            </div>

            <div class="form-field">
              <label>Qty available</label>
              <input v-model.number="supplyForm.qty_available" type="number" min="0" />
            </div>

            <div class="form-field">
              <label>Low stock threshold</label>
              <input v-model.number="supplyForm.low_threshold" type="number" min="0" />
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-ghost" @click="closeAddSupply">Cancel</button>
            <button class="btn btn-primary" @click="saveSupply">
              {{ editingSupply ? 'Save changes' : 'Add supply' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ===================== CREATE DISTRIBUTION EVENT — WIZARD ===================== -->
    <transition name="fade">
      <div class="modal-backdrop" v-if="showCreateEvent" @click.self="closeCreateEvent">
        <div class="modal modal-wide">
          <div class="modal-head">
            <h4>Create distribution event</h4>
            <button class="modal-close" @click="closeCreateEvent">×</button>
          </div>

          <!-- Step indicator -->
          <div class="wizard-steps">
            <button class="wizard-step" :class="{ active: wizardStep === 1, done: wizardStep > 1 }" @click="wizardStep = 1">
              <span class="wizard-step-num"><svg v-if="wizardStep > 1" viewBox="0 0 16 16" class="icon-sm"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><template v-else>1</template></span>
              Event details
            </button>
            <span class="wizard-line" />
            <button class="wizard-step" :class="{ active: wizardStep === 2 }" @click="canGoToStep2 && (wizardStep = 2)">
              <span class="wizard-step-num">2</span>
              Barangay lists & allocation
            </button>
          </div>

          <!-- Step 1 -->
          <div v-if="wizardStep === 1" class="wizard-panel">
            <div class="form-grid">
              <div class="form-field span-2">
                <label>Title</label>
                <input v-model="eventForm.title" placeholder="e.g. Fertilizer Distribution — 3rd Quarter" />
              </div>
              <div class="form-field">
                <label>Date</label>
                <input v-model="eventForm.distribution_date" type="date" />
              </div>
              <div class="form-field">
                <label>Time</label>
                <input v-model="eventForm.distribution_time" type="time" />
              </div>
              <div class="form-field span-2">
                <label>Venue</label>
                <input v-model="eventForm.venue" placeholder="e.g. MAO Office" />
              </div>
              <div class="form-field span-2">
                <label>Description <span class="optional">(optional)</span></label>
                <textarea v-model="eventForm.description" placeholder="Notes for barangay officials"></textarea>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn btn-ghost" @click="closeCreateEvent">Cancel</button>
              <button class="btn btn-primary" :disabled="!step1Valid" @click="wizardStep = 2">
                Continue to barangay lists
              </button>
            </div>
          </div>

          <!-- Step 2 -->
          <div v-else class="wizard-panel">
            <div class="barangay-tabs">
              <button
                v-for="(brgyList, index) in eventForm.barangay_lists"
                :key="index"
                class="barangay-tab"
                :class="{ active: activeListIndex === index, incomplete: !isListComplete(brgyList) }"
                @click="activeListIndex = index"
              >
                <svg v-if="isListComplete(brgyList)" viewBox="0 0 16 16" class="icon-sm tab-check"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ brgyList.barangay_name || 'New barangay list ' + (index + 1) }}
                <span class="tab-remove" @click.stop="removeBarangayList(index)">×</span>
              </button>
              <button class="btn-ghost btn-add-tab" @click="addBarangayList">
                <svg viewBox="0 0 20 20" class="icon"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                Add barangay
              </button>
            </div>

            <div v-if="currentList" class="barangay-config">
              <!-- 1. barangay + official -->
              <div class="config-step">
                <p class="config-step-title"><span class="step-badge">1</span>Barangay & official</p>
                <div class="form-grid">
                  <div class="form-field">
                    <label>Barangay</label>
                    <select v-model="currentList.user_id" @change="selectBarangayForList(activeListIndex)">
                      <option value="">Select barangay</option>
                      <option v-for="user in barangayAccounts" :key="user.id" :value="user.id">{{ user.barangay?.name }}</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label>Barangay official</label>
                    <input :value="currentList.official" readonly placeholder="Auto-filled after selection" />
                  </div>
                </div>
              </div>

              <!-- 2. supply items -->
              <div class="config-step">
                <p class="config-step-title"><span class="step-badge">2</span>Supply items</p>
                <div class="item-chip-row">
                  <div v-for="(item, idx) in currentList.items" :key="idx" class="item-chip">
                    <select v-model="item.supply_id">
                      <option value="">Select supply</option>
                      <option v-for="s in supplies" :key="s.id" :value="s.id">{{ s.name }}</option>
                    </select>
                    <button class="chip-remove" @click="currentList.items.splice(idx, 1)">×</button>
                  </div>
                  <button class="btn-ghost btn-sm" @click="currentList.items.push({ supply_id: '' })">+ Add item</button>
                </div>
              </div>

              <!-- 3. farmers -->
              <div class="config-step">
                <p class="config-step-title">
                  <span class="step-badge">3</span>Farmer recipients
                  <span class="count-badge">{{ currentList.farmer_ids.length }} / {{ currentList.farmers.length }} selected</span>
                </p>
                <div class="recipient-actions">
                  <button type="button" class="filter-tag" @click="currentList.farmer_ids = currentList.farmers.map(f => f.id)">Select all</button>
                  <button type="button" class="filter-tag" @click="currentList.farmer_ids = []">Clear</button>
                </div>
                <div class="farmers-list">
                  <label v-for="farmer in currentList.farmers" :key="farmer.id" class="farmer-option">
                    <input type="checkbox" :value="farmer.id" v-model="currentList.farmer_ids" />
                    {{ farmer.last_name }}, {{ farmer.first_name }} {{ farmer.middle_name || '' }}
                  </label>
                  <p v-if="!currentList.farmers.length" class="empty-copy small">Select a barangay to load its registered farmers.</p>
                </div>
              </div>

              <!-- 4. allocation -->
              <div class="config-step" v-if="currentList.farmer_ids.length && currentList.items.some(i => i.supply_id)">
                <p class="config-step-title"><span class="step-badge">4</span>Allocation per farmer</p>
                <div class="allocation-wrap">
                  <table class="inner-table allocation-table">
                    <thead>
                      <tr>
                        <th class="sticky-col">Farmer</th>
                        <th v-for="item in currentList.items.filter(i => i.supply_id)" :key="item.supply_id">
                          {{ supplyName(item.supply_id) }}
                          <span class="alloc-total">Total: {{ totalAllocatedForSupply(currentList, item.supply_id) }}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="farmerId in currentList.farmer_ids" :key="farmerId">
                        <td class="td-name sticky-col">
                          {{ currentList.farmers.find(f => f.id === farmerId)?.last_name }},
                          {{ currentList.farmers.find(f => f.id === farmerId)?.first_name }}
                        </td>
                        <td v-for="item in currentList.items.filter(i => i.supply_id)" :key="item.supply_id">
                          <input
                            type="number" min="0" class="alloc-input"
                            :value="getAllAllocation(currentList, farmerId, item.supply_id)"
                            @input="setAllocation(currentList, farmerId, item.supply_id, $event.target.value)"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div v-else class="empty-state">
              <p class="empty-title">No barangay list yet</p>
              <p class="empty-copy">Add a barangay to start configuring supply items and recipients.</p>
            </div>

            <div class="modal-actions">
              <button class="btn btn-ghost" @click="wizardStep = 1">Back</button>
              <button class="btn btn-primary" :disabled="!canSaveEvent" @click="saveDistributionEvent">
                Save as draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="slide-toast">
      <div class="toast" :class="'toast-' + toast.type" v-if="toast.visible">{{ toast.message }}</div>
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
      openListIds: [],

      showAddSupply: false,
      showCreateEvent: false,
      editingSupply: null,

      wizardStep: 1,
      activeListIndex: 0,

      toast: { visible: false, message: '', type: 'success' },

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

      supplyForm: { name: '', category: '', unit: '', qty_available: 0, low_threshold: 50 },

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
      if (this.supplyFilter !== 'all') list = list.filter(s => s.status === this.supplyFilter)
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
      if (this.listFilter !== 'all') list = list.filter(e => e.status === this.listFilter)
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

    step1Valid() {
      return !!(this.eventForm.title && this.eventForm.distribution_date && this.eventForm.venue)
    },

    canGoToStep2() {
      return this.step1Valid
    },

    currentList() {
      return this.eventForm.barangay_lists[this.activeListIndex] || null
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
      return { 'in-stock': 'In stock', low: 'Low stock', out: 'Out of stock' }[status] || status
    },

    listLabel(status) {
      return { draft: 'Draft', published: 'Published', completed: 'Completed', cancelled: 'Cancelled' }[status] || status
    },

    isListComplete(list) {
      return !!(list.barangay_id && list.farmer_ids.length > 0 && list.items.some(i => i.supply_id) && list.allocations.some(a => a.quantity > 0))
    },

    toggleListOpen(id) {
      const i = this.openListIds.indexOf(id)
      if (i === -1) this.openListIds.push(id)
      else this.openListIds.splice(i, 1)
    },

    isListOpen(id) {
      return this.openListIds.includes(id)
    },

    showToast(message, type = 'success') {
      this.toast = { visible: true, message, type }
      clearTimeout(this._toastTimer)
      this._toastTimer = setTimeout(() => { this.toast.visible = false }, 3000)
    },

    openCreateEvent() {
      this.activeTab = 'lists'
      this.showCreateEvent = true
      this.wizardStep = 1
      this.activeListIndex = 0
      if (!this.eventForm.barangay_lists.length) this.addBarangayList()
    },

    closeCreateEvent() {
      this.showCreateEvent = false
    },

    addBarangayList() {
      this.eventForm.barangay_lists.push({
        user_id: '',
        barangay_id: '',
        barangay_name: '',
        official: '',
        farmers: [],
        farmer_ids: [],
        items: [{ supply_id: '' }],
        allocations: []
      })
      this.activeListIndex = this.eventForm.barangay_lists.length - 1
    },

    removeBarangayList(index) {
      this.eventForm.barangay_lists.splice(index, 1)
      if (this.activeListIndex >= this.eventForm.barangay_lists.length) {
        this.activeListIndex = Math.max(0, this.eventForm.barangay_lists.length - 1)
      }
    },

    async selectBarangayForList(index) {
      const list = this.eventForm.barangay_lists[index]
      const selected = this.barangayAccounts.find(user => user.id == list.user_id)
      if (!selected) return

      list.barangay_id = selected.barangay_id
      list.barangay_name = selected.barangay?.name || ''
      list.official = `${selected.first_name} ${selected.last_name}`
      list.farmer_ids = []
      list.allocations = []

      try {
        const response = await axios.get(`${API_BASE}/api/barangays/${selected.barangay_id}/farmers`)
        list.farmers = response.data
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast('Failed to load farmers', 'error')
      }
    },

    getAllAllocation(brgyList, farmerId, supplyId) {
      const alloc = brgyList.allocations.find(a => a.farmer_id === farmerId && a.supply_id === supplyId)
      return alloc ? alloc.quantity : 0
    },

    setAllocation(brgyList, farmerId, supplyId, value) {
      const quantity = parseInt(value, 10) || 0
      const index = brgyList.allocations.findIndex(a => a.farmer_id === farmerId && a.supply_id === supplyId)

      if (index !== -1) {
        if (quantity > 0) brgyList.allocations[index].quantity = quantity
        else brgyList.allocations.splice(index, 1)
      } else if (quantity > 0) {
        brgyList.allocations.push({ farmer_id: farmerId, supply_id: supplyId, quantity })
      }
    },

    totalAllocatedForSupply(brgyList, supplyId) {
      return brgyList.allocations
        .filter(a => a.supply_id === supplyId && brgyList.farmer_ids.includes(a.farmer_id))
        .reduce((sum, a) => sum + (a.quantity || 0), 0)
    },

    supplyName(supplyId) {
      const supply = this.supplies.find(s => s.id === supplyId)
      return supply ? supply.name : 'Unknown supply'
    },

    selectEvent(event) {
      this.selectedEvent = event
      this.openListIds = (event.lists || []).slice(0, 1).map(l => l.id)
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

        if (this.selectedEvent) {
          const updated = this.distributionEvents.find(e => e.id === this.selectedEvent.id)
          if (updated) this.selectedEvent = updated
        }
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
      this.supplyForm = { name: '', category: '', unit: '', qty_available: 0, low_threshold: 50 }
    },

    async saveSupply() {
      try {
        if (this.editingSupply) {
          await axios.put(`${API_BASE}/api/inventory/${this.editingSupply.id}`, this.supplyForm)
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
        this.showToast(error.response?.data?.message || 'Failed to create distribution event', 'error')
      }
    },

    async publishDistributionEvent(event) {
      try {
        if (!event.lists || !event.lists.length) {
          this.showToast('This event has no barangay lists to publish.', 'error')
          return
        }

        const response = await axios.patch(`${API_BASE}/api/distribution-events/${event.id}/publish`)

        if (response.data && response.data.event) {
          this.selectedEvent = response.data.event
        } else {
          event.status = 'published'
          event.lists.forEach(l => l.status = 'published')
        }

        await Promise.all([this.fetchDistributionEvents(), this.fetchSupplies()])
        this.showToast('Distribution event published and stock updated!', 'success')
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast(error.response?.data?.message || 'Unable to publish event', 'error')
      }
    },

    async completeDistributionEvent(event) {
      try {
        if (!event.lists || !event.lists.length) return

        const response = await axios.patch(`${API_BASE}/api/distribution-events/${event.id}/complete`)

        if (response.data && response.data.event) {
          this.selectedEvent = response.data.event
        } else {
          event.status = 'completed'
          event.lists.forEach(l => l.status = 'completed')
        }

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
      this.wizardStep = 1
      this.activeListIndex = 0
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

.inv-page {
  --ink: #2C2A24;
  --ink-soft: #6B6656;
  --paper: #F7F4EC;
  --paper-raised: #FFFFFF;
  --line: #E4DFD0;
  --green: #2F6B3F;
  --green-soft: #E3EEE2;
  --gold: #B5811F;
  --gold-soft: #FBF0DA;
  --blue: #3E6E9E;
  --blue-soft: #E5EEF6;
  --plum: #6E4E8C;
  --plum-soft: #EDE6F3;
  --red: #A83D36;
  --red-soft: #F7E5E2;

  font-family: 'Inter', sans-serif;
  background: var(--paper);
  padding: 2.25rem 2.5rem 3rem;
  color: var(--ink);
  line-height: 1.4;
}

.icon { width: 16px; height: 16px; display: block; }
.icon-sm { width: 13px; height: 13px; display: block; }

/* ===== Header ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.5rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}

.eyebrow {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--green);
  margin: 0 0 6px;
  font-weight: 600;
}

.page-title {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 2rem;
  letter-spacing: -0.01em;
  color: var(--ink);
  margin: 0 0 6px;
}

.page-subtitle {
  font-size: 0.92rem;
  color: var(--ink-soft);
  margin: 0;
}

.header-actions { display: flex; gap: 10px; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: none;
  border-radius: 9px;
  padding: 10px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.08s ease;
}

.btn:active { transform: translateY(1px); }

.btn-primary { background: var(--green); color: #FFFFFF; }
.btn-primary:hover { background: #275834; }
.btn-primary:disabled { background: #B9C9BA; cursor: not-allowed; }

.btn-ghost { background: var(--paper-raised); color: var(--green); border: 1px solid var(--line); }
.btn-ghost:hover { border-color: var(--green); background: var(--green-soft); }

.btn-block { width: 100%; justify-content: center; }
.btn-sm { padding: 6px 12px; font-size: 0.78rem; }

/* ===== Ledger strip ===== */
.ledger-strip {
  display: flex;
  align-items: center;
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 1.1rem 1.5rem;
  margin-bottom: 1.5rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.ledger-item { display: flex; flex-direction: column; gap: 3px; min-width: 90px; }

.ledger-value {
  font-family: 'Fraunces', serif;
  font-size: 1.7rem;
  font-weight: 600;
  color: var(--ink);
}

.ledger-label {
  font-size: 0.72rem;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.tone-green { color: var(--green); }
.tone-gold { color: var(--gold); }
.tone-blue { color: var(--blue); }
.tone-plum { color: var(--plum); }

.ledger-divider { width: 1px; align-self: stretch; background: var(--line); }

/* ===== Tabs ===== */
.tab-bar {
  display: inline-flex;
  gap: 3px;
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: 11px;
  padding: 4px;
  margin-bottom: 1.4rem;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 9px 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-soft);
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease;
}

.tab-btn.active { background: var(--green); color: #FFFFFF; }

/* ===== Toolbar ===== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.toolbar-stack { flex-direction: column; align-items: stretch; }

.search-wrap { flex: 1; min-width: 220px; position: relative; }

.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-soft);
  pointer-events: none;
}

.search-input,
.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 9px 12px;
  font-size: 0.85rem;
  font-family: inherit;
  color: var(--ink);
  background: var(--paper-raised);
  box-sizing: border-box;
}

.search-input { padding-left: 34px; }

.search-input:focus,
.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: var(--green);
  box-shadow: 0 0 0 3px rgba(47, 107, 63, 0.15);
}

.filter-group { display: flex; gap: 7px; flex-wrap: wrap; }

.filter-tag {
  border: 1px solid var(--line);
  background: var(--paper-raised);
  color: var(--ink-soft);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.filter-tag.active { background: var(--ink); border-color: var(--ink); color: #FFFFFF; }

/* ===== Table ===== */
.table-card {
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
}

.data-table, .inner-table { width: 100%; border-collapse: collapse; }

.data-table th, .inner-table th {
  text-align: left;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
  background: var(--paper);
  padding: 11px 16px;
  font-weight: 700;
  border-bottom: 1px solid var(--line);
}

.data-table td, .inner-table td {
  padding: 12px 16px;
  font-size: 0.85rem;
  border-top: 1px solid var(--line);
  color: var(--ink);
}

.data-table tr:hover td { background: #FBFAF5; }
.row-low td { background: var(--gold-soft); }
.row-low:hover td { background: #f8e7c4; }
.row-out td { background: var(--red-soft); }

.num { text-align: right; }
.td-name { font-weight: 600; }
.td-muted { color: var(--ink-soft); }
.td-qty { font-family: 'IBM Plex Mono', monospace; font-weight: 600; color: var(--green); }
.td-loading { text-align: center; padding: 2.5rem !important; color: var(--ink-soft); }
.col-actions { width: 90px; }

.cat-tag {
  background: var(--green-soft);
  color: var(--green);
  border-radius: 6px;
  padding: 3px 9px;
  font-size: 0.72rem;
  font-weight: 700;
}

/* ===== Status pills ===== */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px 4px 8px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}

.status-pill-lg { padding: 6px 14px 6px 10px; font-size: 0.75rem; }

.status-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: inline-block; }

.sp-in-stock, .sp-published { background: var(--green-soft); color: var(--green); }
.sp-low, .sp-draft { background: var(--gold-soft); color: var(--gold); }
.sp-out, .sp-cancelled { background: var(--red-soft); color: var(--red); }
.sp-completed { background: var(--blue-soft); color: var(--blue); }

.row-actions { display: flex; gap: 4px; }

.icon-btn {
  border: none;
  background: transparent;
  color: var(--ink-soft);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: inline-flex;
}

.icon-btn:hover { background: var(--green-soft); color: var(--green); }
.icon-btn-danger:hover { background: var(--red-soft); color: var(--red); }

/* ===== Empty states ===== */
.empty-block { text-align: center; padding: 2.5rem 1rem; }
.empty-title { font-weight: 700; color: var(--ink); margin: 0 0 4px; font-size: 0.9rem; }
.empty-copy { color: var(--ink-soft); font-size: 0.82rem; margin: 0; }
.empty-copy.small { font-size: 0.78rem; padding: 6px 2px; }

.empty-state {
  text-align: center;
  padding: 2.5rem 1.25rem;
  background: var(--paper-raised);
  border: 1px dashed var(--line);
  border-radius: 12px;
}

/* ===== Distribution layout ===== */
.lists-area { display: grid; grid-template-columns: 380px 1fr; gap: 1.25rem; align-items: start; }

.dist-cards { display: flex; flex-direction: column; gap: 10px; }

.dist-card {
  display: block;
  width: 100%;
  text-align: left;
  background: var(--paper-raised);
  border-radius: 12px;
  padding: 1rem 1.1rem;
  cursor: pointer;
  border: 1px solid var(--line);
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dist-card:hover { border-color: var(--green); }
.dist-card.selected { border-color: var(--green); box-shadow: 0 0 0 3px rgba(47,107,63,0.12); background: #FBFDFB; }

.dc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }

.dc-id {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: var(--ink-soft);
  margin: 0;
  font-weight: 600;
}

.dc-title { font-size: 0.95rem; font-weight: 700; color: var(--ink); margin: 0 0 8px; }

.dc-meta { display: flex; gap: 14px; font-size: 0.76rem; color: var(--ink-soft); flex-wrap: wrap; }
.dc-meta-item { display: inline-flex; align-items: center; gap: 5px; }

/* ===== Manifest detail ===== */
.manifest-card {
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 1.5rem 1.6rem;
}

.manifest-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.1rem; gap: 1rem; }

.detail-id { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; color: var(--ink-soft); font-weight: 600; margin: 0 0 5px; }

.detail-title { font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 600; color: var(--ink); margin: 0; }

.detail-meta-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  background: var(--paper);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.1rem;
}

.dm-item { display: flex; flex-direction: column; gap: 3px; }
.dm-label { font-size: 0.68rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
.dm-val { font-size: 0.9rem; font-weight: 600; color: var(--ink); }

.perforation {
  display: flex;
  gap: 6px;
  overflow: hidden;
  margin: 0 -0.2rem 1.2rem;
  height: 1px;
}
.perforation span {
  flex: 1;
  border-top: 1.5px dashed var(--line);
}

.section-label { font-size: 0.78rem; font-weight: 700; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px; }

.barangay-block { border: 1px solid var(--line); border-radius: 10px; margin-bottom: 10px; overflow: hidden; }

.barangay-block-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--paper);
  border: none;
  padding: 10px 14px;
  cursor: pointer;
  font-family: inherit;
}

.bb-left { display: flex; align-items: center; gap: 8px; }
.bb-name { font-weight: 700; font-size: 0.87rem; color: var(--ink); }
.bb-right { display: flex; align-items: center; gap: 10px; }
.bb-stat { font-size: 0.76rem; color: var(--ink-soft); }

.chevron { transition: transform 0.15s ease; color: var(--ink-soft); }
.chevron.open { transform: rotate(90deg); }

.barangay-block-body { padding: 12px 14px 14px; }

.mini-label { font-size: 0.72rem; font-weight: 700; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.04em; margin: 12px 0 8px; }

.farmer-chips { display: flex; flex-wrap: wrap; gap: 6px; }

.farmer-chip {
  background: var(--green-soft);
  color: var(--green);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 600;
}

.detail-actions { margin-top: 1.2rem; }

.detail-empty {
  background: var(--paper-raised);
  border: 1px dashed var(--line);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--ink-soft);
  min-height: 320px;
  text-align: center;
  padding: 2rem;
}

.empty-icon { width: 40px; height: 40px; color: var(--line); margin-bottom: 4px; }

/* ===== Modal ===== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(44, 42, 36, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1.5rem;
}

.modal {
  background: var(--paper-raised);
  border-radius: 16px;
  padding: 1.7rem;
  width: 100%;
  max-width: 540px;
  max-height: 88vh;
  overflow-y: auto;
}

.modal-wide { max-width: 900px; }

.modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.3rem; }
.modal-head h4 { margin: 0; font-family: 'Fraunces', serif; font-size: 1.2rem; font-weight: 600; color: var(--ink); }

.modal-close { border: none; background: transparent; font-size: 1.5rem; line-height: 1; cursor: pointer; color: var(--ink-soft); }
.modal-close:hover { color: var(--ink); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.span-2 { grid-column: 1/-1; }

.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 0.78rem; font-weight: 600; color: var(--ink-soft); }
.optional { font-weight: 400; text-transform: none; letter-spacing: 0; }
.form-field textarea { min-height: 76px; resize: vertical; }

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.5rem; }

/* ===== Wizard ===== */
.wizard-steps { display: flex; align-items: center; margin-bottom: 1.4rem; }

.wizard-step {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-soft);
  padding: 4px 0;
}

.wizard-step.active { color: var(--ink); }
.wizard-step.done { color: var(--green); }

.wizard-step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  flex-shrink: 0;
}

.wizard-step.active .wizard-step-num { border-color: var(--ink); color: var(--ink); }
.wizard-step.done .wizard-step-num { border-color: var(--green); color: var(--green); background: var(--green-soft); }

.wizard-line { flex: 1; height: 1px; background: var(--line); margin: 0 12px; max-width: 60px; }

.wizard-panel { min-height: 200px; }

/* ===== Barangay tabs (wizard step 2) ===== */
.barangay-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1.2rem; }

.barangay-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--ink-soft);
  border-radius: 9px;
  padding: 7px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.barangay-tab.active { background: var(--ink); border-color: var(--ink); color: #FFFFFF; }
.barangay-tab.incomplete:not(.active)::after { content: ''; }
.tab-check { color: var(--green); }
.barangay-tab.active .tab-check { color: #b8e0c0; }

.tab-remove { margin-left: 4px; opacity: 0.6; }
.tab-remove:hover { opacity: 1; }

.btn-add-tab { padding: 7px 12px; }

.barangay-config { background: var(--paper); border-radius: 12px; padding: 1.2rem; }

.config-step { margin-bottom: 1.3rem; }
.config-step:last-child { margin-bottom: 0; }

.config-step-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 10px;
}

.step-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--green);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  font-weight: 700;
}

.count-badge {
  margin-left: auto;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--ink-soft);
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 2px 9px;
}

.item-chip-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

.item-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--paper-raised);
  border: 1px solid var(--line);
  padding: 4px 6px 4px 10px;
  border-radius: 8px;
}

.item-chip select { border: none; font-size: 0.78rem; padding: 2px; width: auto; background: transparent; }
.item-chip select:focus { outline: none; box-shadow: none; }

.chip-remove { border: none; background: transparent; color: var(--ink-soft); cursor: pointer; font-size: 1rem; line-height: 1; padding: 2px; }
.chip-remove:hover { color: var(--red); }

.recipient-actions { display: flex; gap: 8px; margin-bottom: 8px; }

.farmers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  max-height: 140px;
  overflow-y: auto;
  border: 1px solid var(--line);
  padding: 10px;
  border-radius: 9px;
  background: var(--paper-raised);
}

.farmer-option { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; cursor: pointer; color: var(--ink); }
.farmer-option:hover { color: var(--green); }

.allocation-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 9px; background: var(--paper-raised); }

.allocation-table th { white-space: nowrap; }

.alloc-total { display: block; font-size: 0.65rem; color: var(--ink-soft); font-weight: 500; text-transform: none; margin-top: 2px; }

.sticky-col { position: sticky; left: 0; background: inherit; z-index: 1; }
.allocation-table thead .sticky-col { background: var(--paper); }
.allocation-table tbody .sticky-col { background: var(--paper-raised); }

.alloc-input {
  width: 68px;
  padding: 5px 7px;
  font-size: 0.8rem;
  text-align: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: 'IBM Plex Mono', monospace;
}

/* ===== Toast ===== */
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
  box-shadow: 0 8px 24px rgba(44, 42, 36, 0.25);
}

.toast-success { background: var(--green); }
.toast-error { background: var(--red); }

/* ===== Transitions ===== */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-toast-enter-active, .slide-toast-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.slide-toast-enter-from, .slide-toast-leave-to { transform: translateY(20px); opacity: 0; }

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .lists-area { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: auto; }
}

@media (max-width: 640px) {
  .inv-page { padding: 1.25rem; }
  .page-header { flex-direction: column; align-items: stretch; }
  .header-actions { flex-direction: column; }
}
</style>