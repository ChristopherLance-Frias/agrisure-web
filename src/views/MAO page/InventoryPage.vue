<template>
  <div class="inv-page">
    <!-- ===== Header ===== -->
    <header class="top-header">
      <div class="header-title-group">
        <h1>Dashboard Overview</h1>
        <p>San Agustin Municipal Agriculture Office &middot; AgriSure</p>
      </div>
  
      <div class="header-actions">
        <div class="v-divider"></div>
  
        <!-- User Profile -->
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

          <div
            class="detail-actions"
            v-if="
              selectedEvent.status === 'draft' ||
              selectedEvent.status === 'published'
            "
          >
            <button
              v-if="selectedEvent.status === 'draft'"
              class="btn btn-primary btn-block"
              @click="publishDistributionEvent(selectedEvent)"
            >
              Publish to barangays
            </button>

            <button
              v-if="selectedEvent.status === 'published'"
              class="btn btn-primary btn-block"
              @click="completeDistributionEvent(selectedEvent)"
            >
              Mark as completed
            </button>

            <button
              v-if="selectedEvent.status === 'draft'"
              class="btn btn-danger btn-block"
              @click="deleteDistributionEvent(selectedEvent)"
            >
              Delete distribution
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
      },
      currentUser: { name: 'Christopher', role: 'MAO Officer', initials: 'CP' },      
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
    },
    async deleteDistributionEvent(event) {
      if (!event) return

      const confirmed = confirm(
        `Are you sure you want to delete "${event.title}"?\n\nThis action cannot be undone.`
      )

      if (!confirmed) return

      try {
        await axios.delete(
          `${API_BASE}/api/distribution-events/${event.id}`
        )

        // Remove from list
        this.distributionEvents = this.distributionEvents.filter(
          e => e.id !== event.id
        )

        // Clear selected event
        this.selectedEvent = null

        // Close any opened barangay lists
        this.openListIds = []

        this.showToast(
          'Distribution event deleted successfully.',
          'success'
        )

      } catch (error) {
        console.error(error.response?.data || error)

        this.showToast(
          error.response?.data?.message ||
          'Failed to delete distribution event.',
          'error'
        )
      }
    },
  }
}
</script>

<style scoped>
* { box-sizing: border-box; }

.inv-page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  flex: 1;
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ================= HEADER (sticky / non-scrollable) ================= */
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
/* ================= BUTTONS ================= */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  transition: border-color 0.15s ease, background 0.15s ease, opacity 0.15s ease;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-ghost {
  background: #FFFFFF;
  color: #0F212F;
  border: 1.5px solid #E0EAE3;
}
.btn-ghost:hover { border-color: #116D3E; background: #F1F6F2; }

.btn-primary {
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.28);
}

.btn-danger {
  background: linear-gradient(135deg, #C1473D, #922E26);
  color: #FFFFFF;
  box-shadow: 0 8px 18px rgba(193, 71, 61, 0.28);
}

.btn-block { width: 100%; }
.btn-sm { padding: 6px 12px; font-size: 0.76rem; }

.icon { width: 16px; height: 16px; display: block; }
.icon-sm { width: 14px; height: 14px; display: block; }

/* ================= LEDGER STRIP ================= */
.ledger-strip {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  padding: 1.1rem 1.4rem;
  display: flex;
  align-items: center;
}

.ledger-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.ledger-value { font-size: 1.5rem; font-weight: 700; color: #0F212F; }
.ledger-value.tone-green { color: #116D3E; }
.ledger-value.tone-gold  { color: #AC7A2F; }
.ledger-value.tone-blue  { color: #2E6F8E; }
.ledger-value.tone-plum  { color: #6B5B95; }

.ledger-label { font-size: 0.74rem; font-weight: 600; color: #5c6b64; }

.ledger-divider { width: 1px; align-self: stretch; background: #EAF1EC; margin: 0 1.4rem; }

/* ================= TAB BAR ================= */
.tab-bar {
  display: flex;
  gap: 6px;
  background: #F1F6F2;
  padding: 4px;
  border-radius: 10px;
  width: fit-content;
}

.tab-btn {
  border: none;
  background: transparent;
  font-size: 0.82rem;
  font-weight: 600;
  color: #5c6b64;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.tab-btn.active {
  background: #FFFFFF;
  color: #116D3E;
  box-shadow: 0 2px 8px rgba(15, 33, 47, 0.08);
}

/* ================= TOOLBAR / FILTERS ================= */
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.toolbar-stack { flex-direction: column; align-items: stretch; }

.search-wrap { position: relative; flex: 1; min-width: 220px; }

.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  padding: 9px 12px 9px 32px;
  font-size: 0.82rem;
  color: #0F212F;
  background: #FFFFFF;
  outline: none;
  transition: border-color 0.15s ease;
}
.search-input:focus { border-color: #116D3E; }

.filter-group { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.filter-tag {
  border: 1.5px solid #E0EAE3;
  background: #FFFFFF;
  color: #5c6b64;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.filter-tag:hover { border-color: #116D3E; color: #0F212F; }
.filter-tag.active {
  background: rgba(17, 109, 62, 0.1);
  border-color: transparent;
  color: #116D3E;
}

/* ================= TABLE ================= */
.table-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  overflow: hidden;
}

.data-table { width: 100%; border-collapse: collapse; }

.data-table thead th {
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
  padding: 10px 14px;
  background: #F1F6F2;
}

.data-table th.num, .data-table td.num { text-align: right; }
.data-table th.col-actions { width: 90px; }

.data-table tbody td {
  font-size: 0.82rem;
  color: #0F212F;
  padding: 12px 14px;
  border-bottom: 1px solid #F1F6F2;
}

.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #F8FAF8; }

.data-table tr.row-low td { background: rgba(210, 149, 57, 0.05); }
.data-table tr.row-out td { background: rgba(193, 71, 61, 0.05); }

.td-name { font-weight: 700; }
.td-muted { color: #5c6b64; }
.td-qty { font-weight: 700; }
.td-loading { text-align: center; padding: 2.5rem; color: #5c6b64; font-size: 0.85rem; }

.cat-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: #5c6b64;
  background: #F1F6F2;
  padding: 3px 9px;
  border-radius: 999px;
}

.row-actions { display: flex; align-items: center; gap: 6px; }

.icon-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #E0EAE3;
  background: #FFFFFF;
  color: #5c6b64;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.icon-btn:hover { border-color: #116D3E; color: #116D3E; background: #F1F6F2; }
.icon-btn-danger:hover { border-color: #C1473D; color: #C1473D; background: rgba(193, 71, 61, 0.06); }

/* ================= STATUS PILLS / DOTS ================= */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}

.status-pill .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

.status-pill.status-pill-lg { padding: 6px 14px; font-size: 0.78rem; }

.status-pill.sp-in-stock,
.status-pill.sp-published,
.status-pill.sp-completed { background: rgba(17, 109, 62, 0.1); color: #116D3E; }
.status-pill.sp-in-stock .dot,
.status-pill.sp-published .dot,
.status-pill.sp-completed .dot { background: #116D3E; }

.status-pill.sp-low,
.status-pill.sp-draft { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.status-pill.sp-low .dot,
.status-pill.sp-draft .dot { background: #D29539; }

.status-pill.sp-out,
.status-pill.sp-cancelled,
.status-pill.sp-rejected { background: rgba(193, 71, 61, 0.1); color: #C1473D; }
.status-pill.sp-out .dot,
.status-pill.sp-cancelled .dot,
.status-pill.sp-rejected .dot { background: #C1473D; }

/* ================= EMPTY / LOADING STATES ================= */
.empty-block, .empty-state {
  text-align: center;
  padding: 2.5rem 1.5rem;
  color: #5c6b64;
}

.empty-icon { width: 40px; height: 40px; color: #B9CBC0; margin: 0 auto 10px; display: block; }
.empty-title { font-size: 0.86rem; font-weight: 700; color: #0F212F; margin-bottom: 4px; }
.empty-copy { font-size: 0.78rem; color: #5c6b64; }
.empty-copy.small { font-size: 0.74rem; }

/* ================= DISTRIBUTION EVENTS: LISTS AREA ================= */
.lists-area {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.25rem;
  align-items: start;
}

.list-col { display: flex; flex-direction: column; gap: 1rem; }

.dist-cards { display: flex; flex-direction: column; gap: 10px; }

.dist-card {
  text-align: left;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 14px;
  padding: 1rem 1.1rem;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s ease, background 0.15s ease;
  font-family: inherit;
}
.dist-card:hover { border-color: #C9DED0; }
.dist-card.selected { border-color: #116D3E; background: rgba(17, 109, 62, 0.04); }

.dc-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.dc-id { font-size: 0.7rem; font-weight: 700; color: #94a3b8; letter-spacing: 0.3px; }
.dc-title { font-size: 0.9rem; font-weight: 700; color: #0F212F; }

.dc-meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.dc-meta-item { display: flex; align-items: center; gap: 5px; font-size: 0.74rem; color: #5c6b64; }

/* ================= MANIFEST DETAIL PANEL ================= */
.detail-col { display: flex; flex-direction: column; }

.manifest-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.manifest-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.detail-id { font-size: 0.72rem; font-weight: 700; color: #94a3b8; letter-spacing: 0.3px; margin-bottom: 2px; }
.detail-title { font-size: 1.1rem; font-weight: 700; color: #0F212F; }

.detail-meta-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  background: #F8FAF8;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 0.9rem 1rem;
}

.dm-item { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.dm-label { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #5c6b64; }
.dm-val { font-size: 0.84rem; font-weight: 600; color: #0F212F; overflow-wrap: anywhere; }

.perforation {
  display: flex;
  gap: 4px;
  overflow: hidden;
  height: 1px;
}
.perforation span {
  flex: 1;
  height: 1px;
  border-top: 1px dashed #D7E2D8;
}

.section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
}

/* ---- Barangay accordion blocks ---- */
.barangay-block {
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  overflow: hidden;
}
.barangay-block + .barangay-block { margin-top: 8px; }

.barangay-block-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #F8FAF8;
  border: none;
  padding: 12px 14px;
  cursor: pointer;
  font-family: inherit;
}

.bb-left { display: flex; align-items: center; gap: 8px; }
.bb-name { font-size: 0.84rem; font-weight: 700; color: #0F212F; }
.bb-right { display: flex; align-items: center; gap: 10px; }
.bb-stat { font-size: 0.74rem; color: #5c6b64; font-weight: 600; }

.chevron { color: #94a3b8; transition: transform 0.15s ease; }
.chevron.open { transform: rotate(90deg); color: #116D3E; }

.barangay-block-body { padding: 14px; display: flex; flex-direction: column; gap: 12px; }

.inner-table { width: 100%; border-collapse: collapse; }
.inner-table th {
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: #5c6b64;
  padding: 6px 8px;
  border-bottom: 1px solid #F1F6F2;
}
.inner-table th.num, .inner-table td.num { text-align: right; }
.inner-table td { font-size: 0.8rem; color: #0F212F; padding: 7px 8px; border-bottom: 1px solid #F1F6F2; }
.inner-table tr:last-child td { border-bottom: none; }

.mini-label { font-size: 0.7rem; font-weight: 700; color: #5c6b64; }

.farmer-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.farmer-chip {
  font-size: 0.74rem;
  font-weight: 600;
  color: #0F212F;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 999px;
  padding: 4px 10px;
}

.detail-actions { display: flex; gap: 10px; flex-wrap: wrap; padding-top: 4px; }
.detail-actions .btn-block { flex: 1; min-width: 160px; }

.detail-empty {
  background: #FFFFFF;
  border: 1px dashed #D7E2D8;
  border-radius: 16px;
  padding: 3rem 1.5rem;
  text-align: center;
  color: #5c6b64;
}

/* ================= MODALS ================= */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 33, 47, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1.5rem;
}

.modal {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(15, 33, 47, 0.25);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.modal.modal-wide { max-width: 900px; }

.modal-head { display: flex; align-items: center; justify-content: space-between; }
.modal-head h4 { font-size: 1.05rem; font-weight: 700; color: #0F212F; }

.modal-close {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: #F1F6F2;
  color: #5c6b64;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}
.modal-close:hover { background: #E7F0EC; color: #0F212F; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field.span-2 { grid-column: 1 / -1; }

.form-field label { font-size: 0.76rem; font-weight: 600; color: #5c6b64; }
.form-field .optional { font-weight: 400; color: #94a3b8; }

.form-field input,
.form-field select,
.form-field textarea {
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  padding: 9px 12px;
  font-size: 0.84rem;
  color: #0F212F;
  background: #FFFFFF;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s ease;
}
.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus { border-color: #116D3E; }
.form-field input[readonly] { background: #F8FAF8; color: #5c6b64; }
.form-field textarea { resize: vertical; min-height: 70px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }

/* ================= WIZARD ================= */
.wizard-steps { display: flex; align-items: center; gap: 10px; }

.wizard-step {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  font-size: 0.82rem;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px 4px;
}
.wizard-step.active { color: #0F212F; }
.wizard-step.done { color: #116D3E; }

.wizard-step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #F1F6F2;
  color: #5c6b64;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  flex-shrink: 0;
}
.wizard-step.active .wizard-step-num { background: rgba(17, 109, 62, 0.12); color: #116D3E; }
.wizard-step.done .wizard-step-num { background: #116D3E; color: #FFFFFF; }

.wizard-line { flex: 1; height: 1px; background: #EAF1EC; }

.wizard-panel { display: flex; flex-direction: column; gap: 1.2rem; }

/* ---- Barangay tabs (inside wizard step 2) ---- */
.barangay-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  border-bottom: 1px solid #EAF1EC;
  padding-bottom: 10px;
}

.barangay-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid #E0EAE3;
  background: #FFFFFF;
  color: #5c6b64;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
}
.barangay-tab.active { border-color: #116D3E; background: rgba(17, 109, 62, 0.08); color: #116D3E; }
.barangay-tab.incomplete { border-style: dashed; }
.tab-check { color: #116D3E; }
.tab-remove { color: #94a3b8; font-weight: 700; margin-left: 2px; }
.tab-remove:hover { color: #C1473D; }

.btn-add-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1.5px dashed #C9DED0;
  color: #116D3E;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
}
.btn-add-tab:hover { background: #F1F6F2; }

.barangay-config { display: flex; flex-direction: column; gap: 1.4rem; }

.config-step { display: flex; flex-direction: column; gap: 10px; }

.config-step-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.86rem;
  font-weight: 700;
  color: #0F212F;
}

.step-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(17, 109, 62, 0.1);
  color: #116D3E;
  font-size: 0.7rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.count-badge {
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 700;
  color: #5c6b64;
  background: #F1F6F2;
  padding: 3px 9px;
  border-radius: 999px;
}

.item-chip-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.item-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  padding: 4px 6px 4px 10px;
  background: #FFFFFF;
}
.item-chip select { border: none; font-size: 0.8rem; color: #0F212F; outline: none; background: transparent; font-family: inherit; }
.chip-remove { color: #94a3b8; font-weight: 700; cursor: pointer; background: none; border: none; font-size: 0.9rem; }
.chip-remove:hover { color: #C1473D; }

.recipient-actions { display: flex; gap: 6px; }

.farmers-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid #EAF1EC;
  border-radius: 10px;
  padding: 10px;
}

.farmer-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #0F212F;
  cursor: pointer;
}
.farmer-option input { accent-color: #116D3E; }

/* ---- Allocation table ---- */
.allocation-wrap { overflow-x: auto; border: 1px solid #EAF1EC; border-radius: 10px; }

.allocation-table th, .allocation-table td { white-space: nowrap; }

.allocation-table .sticky-col {
  position: sticky;
  left: 0;
  background: #FFFFFF;
  z-index: 1;
}
.allocation-table thead .sticky-col { background: #F1F6F2; z-index: 2; }

.alloc-total { display: block; font-size: 0.64rem; font-weight: 600; color: #94a3b8; text-transform: none; letter-spacing: 0; margin-top: 2px; }

.alloc-input {
  width: 72px;
  border: 1.5px solid #E0EAE3;
  border-radius: 7px;
  padding: 5px 8px;
  font-size: 0.78rem;
  color: #0F212F;
  outline: none;
  font-family: inherit;
}
.alloc-input:focus { border-color: #116D3E; }

/* ================= TOAST ================= */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #0F212F;
  color: #FFFFFF;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 16px 36px rgba(15, 33, 47, 0.3);
  z-index: 60;
}
.toast-success { background: linear-gradient(135deg, #116D3E, #0A5232); }
.toast-error { background: linear-gradient(135deg, #C1473D, #922E26); }

/* ================= TRANSITIONS ================= */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-toast-enter-active, .slide-toast-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.slide-toast-enter-from, .slide-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }

/* ================= RESPONSIVE ================= */
@media (max-width: 1100px) {
  .lists-area { grid-template-columns: 1fr; }
  .detail-meta-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: stretch; }
  .header-actions { justify-content: flex-start; }
  .ledger-strip { flex-wrap: wrap; gap: 1rem; }
  .ledger-divider { display: none; }
  .form-grid { grid-template-columns: 1fr; }
  .farmers-list { grid-template-columns: 1fr; }
  .modal.modal-wide { max-width: 100%; }
}
</style>