<template>
  <div class="inv-page">
 
    <!-- TOP BAR / HEADER -->
    <header class="top-header inv-top-header">
      <div class="header-title-group">
        <p class="eyebrow">Municipal Agriculture Office</p>
        <h1>Farming Supply Inventory</h1>
        <p>Track stock levels and dispatch supplies to selected barangays.</p>
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
 
    <!-- PAGE ACTIONS -->
    <div class="page-actions">
      <button class="btn btn-ghost" @click="activeTab = 'inventory'; showAddSupply = true">
        <svg viewBox="0 0 20 20" class="icon"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
        Add supply
      </button>
      <button class="btn btn-primary" @click="openCreateEvent">
        <svg viewBox="0 0 20 20" class="icon"><path d="M4 6h9M4 10h12M4 14h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
        Create distribution event
      </button>
    </div>
 
    <!-- LEDGER -->
    <div class="ledger-strip">
      <div class="ledger-item">
        <span class="ledger-value">{{ supplies.length }}</span>
        <span class="ledger-label">Supply types</span>
      </div>
      <div class="ledger-divider"></div>
      <div class="ledger-item">
        <span class="ledger-value tone-green">{{ supplies.filter(s => s.status === 'in-stock').length }}</span>
        <span class="ledger-label">In stock</span>
      </div>
      <div class="ledger-divider"></div>
      <div class="ledger-item">
        <span class="ledger-value tone-gold">{{ supplies.filter(s => s.status === 'low').length }}</span>
        <span class="ledger-label">Low stock</span>
      </div>
      <div class="ledger-divider"></div>
      <div class="ledger-item">
        <span class="ledger-value tone-blue">{{ distributionEvents.length }}</span>
        <span class="ledger-label">Distribution events</span>
      </div>
      <div class="ledger-divider"></div>
      <div class="ledger-item">
        <span class="ledger-value tone-plum">{{ distributionEvents.filter(e => e.status === 'completed').length }}</span>
        <span class="ledger-label">Completed</span>
      </div>
    </div>
 
    <!-- TABS -->
    <div class="tab-bar" role="tablist">
      <button class="tab-btn" :class="{ active: activeTab === 'inventory' }" @click="activeTab = 'inventory'">Supply stocks</button>
      <button class="tab-btn" :class="{ active: activeTab === 'lists' }" @click="activeTab = 'lists'">Distribution events</button>
    </div>
 
    <!-- INVENTORY -->
    <div v-if="activeTab === 'inventory'">
      <div class="toolbar">
        <div class="search-wrap">
          <svg viewBox="0 0 20 20" class="icon search-icon">
            <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6" fill="none" />
            <path d="M14 14l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
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
              <td>
                <span class="status-pill" :class="'sp-' + s.status">
                  <i class="dot"></i>{{ stockLabel(s.status) }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="icon-btn" title="Edit" @click="editSupply(s)">
                    <svg viewBox="0 0 20 20" class="icon"><path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round" /></svg>
                  </button>
                  <button class="icon-btn icon-btn-danger" title="Delete" @click="deleteSupply(s.id)">
                    <svg viewBox="0 0 20 20" class="icon"><path d="M5 6h10M8 6V4h4v2M6 6l1 10h6l1-10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </button>
                </div>
              </td>
            </tr>
 
            <tr v-if="!filteredSupplies.length">
              <td colspan="7">
                <div class="empty-block">
                  <p class="empty-title">No supplies found</p>
                  <p class="empty-copy">Try a different search term or filter, or add a new supply.</p>
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
 
    <!-- DISTRIBUTION EVENTS -->
    <div v-if="activeTab === 'lists'" class="lists-area">
      <div class="list-col">
        <div class="toolbar toolbar-stack">
          <div class="search-wrap">
            <svg viewBox="0 0 20 20" class="icon search-icon">
              <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6" fill="none" />
              <path d="M14 14l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
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
            v-for="event in filteredLists" :key="event.id" class="dist-card"
            :class="{ selected: selectedEvent && selectedEvent.id === event.id }"
            @click="selectEvent(event)"
          >
            <div class="dc-top">
              <p class="dc-id">{{ event.reference_no || ('EVENT-' + event.id) }}</p>
              <span class="status-pill" :class="'sp-' + event.status"><i class="dot"></i>{{ listLabel(event.status) }}</span>
            </div>
 
            <p class="dc-title">{{ event.title }}</p>
 
            <div class="dc-meta">
              <span class="dc-meta-item">
                <svg viewBox="0 0 20 20" class="icon-sm">
                  <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.4" fill="none" />
                  <path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
                </svg>
                {{ event.distribution_date }}
              </span>
              <span class="dc-meta-item">
                <svg viewBox="0 0 20 20" class="icon-sm">
                  <path d="M10 2a5 5 0 100 10 5 5 0 000-10zM3 18c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" />
                </svg>
                {{ event.lists?.length || 0 }} barangay/s
              </span>
            </div>
          </button>
 
          <div v-if="!filteredLists.length" class="empty-state">
            <p class="empty-title">No distribution events found</p>
            <p class="empty-copy">Create one to start dispatching supplies.</p>
          </div>
        </div>
 
        <div class="empty-state" v-else><p>Loading distribution events…</p></div>
      </div>
 
      <!-- EVENT DETAIL -->
      <div class="detail-col" v-if="selectedEvent">
        <div class="manifest-card">
          <div class="manifest-header">
            <div>
              <p class="detail-id">{{ selectedEvent.reference_no || ('EVENT-' + selectedEvent.id) }}</p>
              <h3 class="detail-title">{{ selectedEvent.title }}</h3>
            </div>
            <span class="status-pill status-pill-lg" :class="'sp-' + selectedEvent.status"><i class="dot"></i>{{ listLabel(selectedEvent.status) }}</span>
          </div>
 
          <!-- Letter -->
          <div v-if="selectedEvent.letter_image" class="event-letter-preview">
            <p class="section-label">Authorization letter</p>
            <div class="letter-preview-card">
              <img :src="letterUrl(selectedEvent.letter_image)" alt="Distribution authorization letter" class="letter-image" />
              <a :href="letterUrl(selectedEvent.letter_image)" target="_blank" class="btn btn-ghost btn-sm">View letter</a>
            </div>
          </div>
 
          <div class="detail-meta-row">
            <div class="dm-item"><span class="dm-label">Date</span><span class="dm-val">{{ selectedEvent.distribution_date }}</span></div>
            <div class="dm-item"><span class="dm-label">Time</span><span class="dm-val">{{ selectedEvent.distribution_time || '—' }}</span></div>
            <div class="dm-item"><span class="dm-label">Venue</span><span class="dm-val">{{ selectedEvent.venue }}</span></div>
            <div class="dm-item"><span class="dm-label">Barangays</span><span class="dm-val">{{ selectedEvent.lists?.length || 0 }}</span></div>
          </div>
 
          <div class="perforation"><span v-for="n in 40" :key="n"></span></div>
 
          <!-- Barangay Lists -->
          <p class="section-label">Selected barangays</p>
 
          <div v-for="list in selectedEvent.lists || []" :key="list.id" class="barangay-block">
            <button class="barangay-block-head" @click="toggleListOpen(list.id)">
              <div class="bb-left">
                <svg class="chevron icon-sm" :class="{ open: isListOpen(list.id) }" viewBox="0 0 20 20">
                  <path d="M7 5l6 5-6 5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="bb-name">Brgy. {{ list.barangay?.name || 'Unknown Barangay' }}</span>
              </div>
              <div class="bb-right">
                <span class="bb-stat">{{ list.farmers?.length || 0 }} farmers</span>
                <span class="status-pill" :class="'sp-' + (list.status || 'draft')"><i class="dot"></i>{{ listLabel(list.status || 'draft') }}</span>
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
 
          <!-- Actions -->
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
 
      <!-- Empty detail -->
      <div class="detail-empty" v-else>
        <svg viewBox="0 0 48 48" class="empty-icon">
          <rect x="8" y="10" width="32" height="30" rx="3" stroke="currentColor" stroke-width="2" fill="none" />
          <path d="M8 18h32M16 6v8M32 6v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <p class="empty-title">Select an event to view its manifest</p>
        <p class="empty-copy">Details, authorization letter, barangays, farmers, and allocations will appear here.</p>
      </div>
    </div>
 
    <!-- ADD / EDIT SUPPLY MODAL -->
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
            <button class="btn btn-primary" @click="saveSupply">{{ editingSupply ? 'Save changes' : 'Add supply' }}</button>
          </div>
        </div>
      </div>
    </transition>
 
    <!-- CREATE DISTRIBUTION EVENT -->
    <transition name="fade">
      <div class="modal-backdrop" v-if="showCreateEvent" @click.self="closeCreateEvent">
        <div class="modal modal-wide">
          <div class="modal-head">
            <div>
              <p class="eyebrow">New distribution</p>
              <h4>Create distribution event</h4>
            </div>
            <button class="modal-close" @click="closeCreateEvent">×</button>
          </div>
 
          <!-- WIZARD STEPS -->
          <div class="wizard-steps">
            <button class="wizard-step" :class="{ active: wizardStep === 1, done: wizardStep > 1 }" @click="wizardStep = 1">
              <span class="wizard-step-num">
                <svg v-if="wizardStep > 1" viewBox="0 0 16 16" class="icon-sm"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
                <template v-else>1</template>
              </span>
              Letter
            </button>
            <span class="wizard-line"></span>
 
            <button class="wizard-step" :class="{ active: wizardStep === 2, done: wizardStep > 2 }" :disabled="!letterStepValid" @click="letterStepValid && (wizardStep = 2)">
              <span class="wizard-step-num">
                <svg v-if="wizardStep > 2" viewBox="0 0 16 16" class="icon-sm"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
                <template v-else>2</template>
              </span>
              Event details
            </button>
            <span class="wizard-line"></span>
 
            <button class="wizard-step" :class="{ active: wizardStep === 3, done: wizardStep > 3 }" :disabled="!step1Valid" @click="step1Valid && (wizardStep = 3)">
              <span class="wizard-step-num">
                <svg v-if="wizardStep > 3" viewBox="0 0 16 16" class="icon-sm"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
                <template v-else>3</template>
              </span>
              Barangays
            </button>
            <span class="wizard-line"></span>
 
            <button class="wizard-step" :class="{ active: wizardStep === 4, done: wizardStep > 4 }" :disabled="!barangaysSelected" @click="barangaysSelected && (wizardStep = 4)">
              <span class="wizard-step-num">4</span>
              Farmers & allocation
            </button>
            <span class="wizard-line"></span>
 
            <button class="wizard-step" :class="{ active: wizardStep === 5 }" :disabled="!canReviewEvent" @click="canReviewEvent && (wizardStep = 5)">
              <span class="wizard-step-num">5</span>
              Review
            </button>
          </div>
 
          <!-- STEP 1 — LETTER -->
          <div v-if="wizardStep === 1" class="wizard-panel">
            <div class="wizard-intro">
              <p class="config-step-title">Authorization letter</p>
              <p class="empty-copy">Upload the manually prepared and signed letter authorizing the distribution event.</p>
            </div>
 
            <div class="letter-upload-area">
              <div v-if="!eventForm.letter_preview" class="letter-upload-box" @click="$refs.letterInput.click()">
                <svg viewBox="0 0 48 48" class="upload-icon">
                  <path d="M24 31V8M24 8l-8 8M24 8l8 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M10 29v8a3 3 0 003 3h22a3 3 0 003-3v-8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
                </svg>
                <p class="upload-title">Upload signed letter</p>
                <p class="upload-copy">Click to select a JPG, PNG, or PDF file</p>
                <p class="upload-hint">This is the physical letter signed by the mayor.</p>
              </div>
 
              <input ref="letterInput" type="file" accept="image/jpeg,image/png,application/pdf" class="hidden-file-input" @change="handleLetterUpload" />
 
              <div v-if="eventForm.letter_preview && eventForm.letter_type !== 'application/pdf'" class="letter-preview">
                <img :src="eventForm.letter_preview" alt="Letter preview" />
                <div class="letter-preview-actions">
                  <div>
                    <p class="td-name">{{ eventForm.letter_name }}</p>
                    <p class="td-muted">Authorization letter</p>
                  </div>
                  <button type="button" class="btn btn-ghost btn-sm" @click="removeLetter">Remove</button>
                </div>
              </div>
 
              <div v-if="eventForm.letter_preview && eventForm.letter_type === 'application/pdf'" class="letter-pdf-preview">
                <div class="pdf-icon">PDF</div>
                <div class="pdf-info">
                  <p class="td-name">{{ eventForm.letter_name }}</p>
                  <p class="td-muted">Authorization letter</p>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" @click="removeLetter">Remove</button>
              </div>
            </div>
 
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="closeCreateEvent">Cancel</button>
              <button class="btn btn-primary" :disabled="!letterStepValid" @click="wizardStep = 2">Continue to event details</button>
            </div>
          </div>
 
          <!-- STEP 2 — EVENT DETAILS -->
          <div v-else-if="wizardStep === 2" class="wizard-panel">
            <div class="form-grid">
              <div class="form-field span-2">
                <label>Event title</label>
                <input v-model="eventForm.title" type="text" placeholder="e.g. Fertilizer Distribution — 3rd Quarter" />
              </div>
              <div class="form-field">
                <label>Distribution date</label>
                <input v-model="eventForm.distribution_date" type="date" />
              </div>
              <div class="form-field">
                <label>Distribution time</label>
                <input v-model="eventForm.distribution_time" type="time" />
              </div>
              <div class="form-field span-2">
                <label>Venue</label>
                <input v-model="eventForm.venue" type="text" placeholder="e.g. Municipal Agriculture Office" />
              </div>
              <div class="form-field span-2">
                <label>Description <span class="optional">(optional)</span></label>
                <textarea v-model="eventForm.description" placeholder="Additional information for the distribution event"></textarea>
              </div>
            </div>
 
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="wizardStep = 1">Back</button>
              <button class="btn btn-primary" :disabled="!step1Valid" @click="wizardStep = 3">Continue to barangays</button>
            </div>
          </div>
 
          <!-- STEP 3 — SELECT BARANGAYS -->
          <div v-else-if="wizardStep === 3" class="wizard-panel">
            <div class="wizard-intro">
              <p class="config-step-title">Select barangays</p>
              <p class="empty-copy">Select all barangays that will receive supplies from this distribution event.</p>
            </div>
 
            <div class="barangay-selection-toolbar">
              <button type="button" class="filter-tag" @click="selectAllBarangays">Select all</button>
              <button type="button" class="filter-tag" @click="clearBarangays">Clear</button>
              <span class="count-badge">{{ eventForm.barangay_lists.length }} selected</span>
            </div>
 
            <div class="barangay-selection-list">
              <label v-for="account in barangayAccounts" :key="account.id" class="barangay-selection-option">
                <input type="checkbox" :checked="isBarangaySelected(account.barangay_id)" @change="toggleBarangay(account)" />
                <div class="barangay-option-copy">
                  <span class="barangay-option-name">{{ account.barangay?.name || 'Unknown Barangay' }}</span>
                  <span class="barangay-option-official">{{ account.first_name }} {{ account.last_name }}</span>
                </div>
              </label>
              <p v-if="!barangayAccounts.length" class="empty-copy">No barangay accounts found.</p>
            </div>
 
            <div v-if="eventForm.barangay_lists.length" class="selected-barangays">
              <p class="mini-label">Selected barangays</p>
              <div class="selected-barangay-chips">
                <span v-for="list in eventForm.barangay_lists" :key="list.barangay_id" class="selected-barangay-chip">
                  {{ list.barangay_name }}
                  <button type="button" @click="removeBarangayById(list.barangay_id)">×</button>
                </span>
              </div>
            </div>
 
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="wizardStep = 2">Back</button>
              <button class="btn btn-primary" :disabled="!barangaysSelected" @click="prepareFarmerStep">Continue to farmers</button>
            </div>
          </div>
 
          <!-- STEP 4 — FARMERS & ALLOCATION -->
          <div v-else-if="wizardStep === 4" class="wizard-panel">
            <div class="barangay-tabs">
              <button
                v-for="(brgyList, index) in eventForm.barangay_lists" :key="brgyList.barangay_id" class="barangay-tab"
                :class="{ active: activeListIndex === index, incomplete: !isListComplete(brgyList) }"
                @click="activeListIndex = index"
              >
                <svg v-if="isListComplete(brgyList)" viewBox="0 0 16 16" class="icon-sm tab-check">
                  <path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                {{ brgyList.barangay_name }}
              </button>
            </div>
 
            <div v-if="currentList" class="barangay-config">
              <!-- FARMERS -->
              <div class="config-step">
                <div class="config-step-header">
                  <p class="config-step-title">
                    <span class="step-badge">1</span> Farmer recipients
                    <span class="count-badge">{{ currentList.farmer_ids.length }} / {{ currentList.farmers.length }} selected</span>
                  </p>
                  <div class="recipient-actions">
                    <button type="button" class="filter-tag" @click="selectAllFarmers(currentList)">Select all</button>
                    <button type="button" class="filter-tag" @click="clearFarmers(currentList)">Clear</button>
                  </div>
                </div>
 
                <div class="farmers-list">
                  <label v-for="farmer in currentList.farmers" :key="farmer.id" class="farmer-option">
                    <input type="checkbox" :value="farmer.id" v-model="currentList.farmer_ids" />
                    {{ farmer.last_name }}, {{ farmer.first_name }} {{ farmer.middle_name || '' }}
                  </label>
                  <p v-if="!currentList.farmers.length" class="empty-copy small">Loading or no registered farmers found for this barangay.</p>
                </div>
              </div>
 
              <!-- SUPPLIES -->
              <div class="config-step">
                <p class="config-step-title"><span class="step-badge">2</span> Supply items</p>
                <div class="item-chip-row">
                  <div v-for="(item, idx) in currentList.items" :key="idx" class="item-chip">
                    <select v-model="item.supply_id">
                      <option value="">Select supply</option>
                      <option v-for="s in supplies" :key="s.id" :value="s.id">{{ s.name }} — {{ s.qty_available }} {{ s.unit }} available</option>
                    </select>
                    <button type="button" class="chip-remove" @click="removeSupplyItem(currentList, idx)">×</button>
                  </div>
                  <button type="button" class="btn-ghost btn-sm" @click="addSupplyItem(currentList)">+ Add supply</button>
                </div>
              </div>
 
              <!-- ALLOCATION -->
              <div class="config-step" v-if="currentList.farmer_ids.length && selectedSupplyItems(currentList).length">
                <div class="config-step-header">
                  <p class="config-step-title"><span class="step-badge">3</span> Allocation per farmer</p>
                </div>
 
                <div class="allocation-wrap">
                  <table class="inner-table allocation-table">
                    <thead>
                      <tr>
                        <th class="sticky-col">Farmer</th>
                        <th v-for="item in selectedSupplyItems(currentList)" :key="item.supply_id">
                          {{ supplyName(item.supply_id) }}
                          <span class="alloc-total">
                            Total: {{ totalAllocatedForSupply(currentList, item.supply_id) }} / {{ availableQuantity(item.supply_id) }}
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="farmerId in currentList.farmer_ids" :key="farmerId">
                        <td class="td-name sticky-col">{{ farmerName(currentList, farmerId) }}</td>
                        <td v-for="item in selectedSupplyItems(currentList)" :key="item.supply_id">
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
 
              <!-- VALIDATION SUMMARY -->
              <div class="allocation-summary">
                <div><span class="dm-label">Farmers</span><strong>{{ currentList.farmer_ids.length }}</strong></div>
                <div><span class="dm-label">Supplies</span><strong>{{ selectedSupplyItems(currentList).length }}</strong></div>
                <div v-for="item in selectedSupplyItems(currentList)" :key="'summary-' + item.supply_id">
                  <span class="dm-label">{{ supplyName(item.supply_id) }}</span>
                  <strong>{{ totalAllocatedForSupply(currentList, item.supply_id) }} {{ supplyUnit(item.supply_id) }}</strong>
                </div>
              </div>
            </div>
 
            <div v-else class="empty-state"><p class="empty-title">No barangay selected</p></div>
 
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="wizardStep = 3">Back</button>
              <button class="btn btn-primary" :disabled="!canReviewEvent" @click="wizardStep = 5">Review event</button>
            </div>
          </div>
 
          <!-- STEP 5 — REVIEW -->
          <div v-else-if="wizardStep === 5" class="wizard-panel review-panel">
            <div class="review-header">
              <div>
                <p class="eyebrow">Final review</p>
                <h3 class="detail-title">{{ eventForm.title }}</h3>
              </div>
              <span class="status-pill sp-draft"><i class="dot"></i>Draft</span>
            </div>
 
            <div class="review-section">
              <p class="section-label">Authorization letter</p>
              <div class="review-letter">
                <span class="review-check">✓</span>
                <div>
                  <strong>{{ eventForm.letter_name }}</strong>
                  <p class="td-muted">Signed authorization letter attached</p>
                </div>
              </div>
            </div>
 
            <div class="review-section">
              <p class="section-label">Event details</p>
              <div class="detail-meta-row">
                <div class="dm-item"><span class="dm-label">Date</span><span class="dm-val">{{ eventForm.distribution_date }}</span></div>
                <div class="dm-item"><span class="dm-label">Time</span><span class="dm-val">{{ eventForm.distribution_time || '—' }}</span></div>
                <div class="dm-item"><span class="dm-label">Venue</span><span class="dm-val">{{ eventForm.venue }}</span></div>
              </div>
            </div>
 
            <div class="review-section">
              <p class="section-label">Selected barangays</p>
              <div v-for="list in eventForm.barangay_lists" :key="list.barangay_id" class="review-barangay">
                <div class="review-barangay-header">
                  <strong>{{ list.barangay_name }}</strong>
                  <span class="count-badge">{{ list.farmer_ids.length }} farmers</span>
                </div>
                <table class="inner-table">
                  <thead><tr><th>Supply</th><th class="num">Quantity</th></tr></thead>
                  <tbody>
                    <tr v-for="item in selectedSupplyItems(list)" :key="item.supply_id">
                      <td>{{ supplyName(item.supply_id) }}</td>
                      <td class="num">{{ totalAllocatedForSupply(list, item.supply_id) }} {{ supplyUnit(item.supply_id) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
 
            <div class="review-section">
              <p class="section-label">Total inventory allocation</p>
              <div class="inventory-review-list">
                <div v-for="total in totalEventAllocations" :key="total.supply_id" class="inventory-review-item">
                  <span>{{ total.name }}</span>
                  <strong>{{ total.quantity }} {{ total.unit }}</strong>
                </div>
              </div>
            </div>
 
            <div class="review-notice">
              <strong>Ready to save?</strong>
              <p>Saving will create this distribution event as a <strong>Draft</strong>. Inventory will only be deducted when the event is published.</p>
            </div>
 
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="wizardStep = 4">Back</button>
              <button class="btn btn-primary" :disabled="savingEvent" @click="saveDistributionEvent">
                <span v-if="savingEvent">Saving…</span>
                <span v-else>Save as draft</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
 
    <!-- TOAST -->
    <transition name="slide-toast">
      <div class="toast" :class="'toast-' + toast.type" v-if="toast.visible">{{ toast.message }}</div>
    </transition>
 
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = 'https://sanagustinagrisure.com'

export default {
  name: 'InventoryPage',

  data() {
    return {
      activeTab: 'inventory',
      supplies: [],
      distributionEvents: [],
      loadingSupplies: false,
      loadingLists: false,
      savingEvent: false,
      supplySearch: '',
      supplyFilter: 'all',
      listSearch: '',
      listFilter: 'all',
      selectedEvent: null,
      openListIds: [],

      showAddSupply: false,
      editingSupply: null,
      supplyForm: { name: '', category: '', unit: '', qty_available: 0, low_threshold: 50 },

      showCreateEvent: false,
      wizardStep: 1,
      activeListIndex: 0,
      eventForm: {
        letter_file: null,
        letter_preview: '',
        letter_name: '',
        letter_type: '',
        title: '',
        distribution_date: '',
        distribution_time: '',
        venue: '',
        description: '',
        barangay_lists: []
      },
      barangayAccounts: [],

      toast: { visible: false, message: '', type: 'success' },
      currentUser: { name: 'Christopher', role: 'MAO Officer', initials: 'CP' },

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
      ]
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

    letterStepValid() {
      return !!this.eventForm.letter_file
    },

    step1Valid() {
      return !!(this.eventForm.title && this.eventForm.distribution_date && this.eventForm.venue)
    },

    barangaysSelected() {
      return this.eventForm.barangay_lists.length > 0
    },

    canReviewEvent() {
      if (!this.step1Valid) return false
      if (!this.eventForm.barangay_lists.length) return false
      return this.eventForm.barangay_lists.every(list => this.isListComplete(list))
    },

    currentList() {
      return this.eventForm.barangay_lists[this.activeListIndex] || null
    },

    totalEventAllocations() {
      const totals = {}
      this.eventForm.barangay_lists.forEach(list => {
        list.allocations.forEach(allocation => {
          if (!totals[allocation.supply_id]) {
            totals[allocation.supply_id] = {
              supply_id: allocation.supply_id,
              name: this.supplyName(allocation.supply_id),
              unit: this.supplyUnit(allocation.supply_id),
              quantity: 0
            }
          }
          totals[allocation.supply_id].quantity += Number(allocation.quantity || 0)
        })
      })
      return Object.values(totals)
    }
  },

  async mounted() {
    await Promise.all([this.fetchSupplies(), this.fetchDistributionEvents(), this.fetchBarangayAccounts()])
  },

  methods: {
    stockLabel(status) {
      return { 'in-stock': 'In stock', low: 'Low stock', out: 'Out of stock' }[status] || status
    },

    listLabel(status) {
      return { draft: 'Draft', published: 'Published', completed: 'Completed', cancelled: 'Cancelled' }[status] || status
    },

    showToast(message, type = 'success') {
      this.toast = { visible: true, message, type }
      clearTimeout(this._toastTimer)
      this._toastTimer = setTimeout(() => { this.toast.visible = false }, 3000)
    },

    openCreateEvent() {
      this.activeTab = 'lists'
      this.resetEventForm()
      this.showCreateEvent = true
      this.wizardStep = 1
      this.activeListIndex = 0
    },

    closeCreateEvent() {
      if (this.savingEvent) return
      this.showCreateEvent = false
    },

    handleLetterUpload(event) {
      const file = event.target.files && event.target.files[0]
      if (!file) return

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        this.showToast('Please upload a JPG, PNG, or PDF file.', 'error')
        event.target.value = ''
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        this.showToast('The letter file must not exceed 10 MB.', 'error')
        event.target.value = ''
        return
      }

      this.eventForm.letter_file = file
      this.eventForm.letter_name = file.name
      this.eventForm.letter_type = file.type

      if (file.type === 'application/pdf') {
        this.eventForm.letter_preview = 'pdf-file'
        return
      }

      const reader = new FileReader()
      reader.onload = e => { this.eventForm.letter_preview = e.target.result }
      reader.readAsDataURL(file)
    },

    removeLetter() {
      this.eventForm.letter_file = null
      this.eventForm.letter_preview = ''
      this.eventForm.letter_name = ''
      this.eventForm.letter_type = ''
      if (this.$refs.letterInput) this.$refs.letterInput.value = ''
    },

    isBarangaySelected(barangayId) {
      return this.eventForm.barangay_lists.some(list => String(list.barangay_id) === String(barangayId))
    },

    toggleBarangay(account) {
      const barangayId = account.barangay_id
      const existingIndex = this.eventForm.barangay_lists.findIndex(list => String(list.barangay_id) === String(barangayId))

      if (existingIndex !== -1) {
        this.eventForm.barangay_lists.splice(existingIndex, 1)
        if (this.activeListIndex >= this.eventForm.barangay_lists.length) {
          this.activeListIndex = Math.max(0, this.eventForm.barangay_lists.length - 1)
        }
        return
      }

      this.eventForm.barangay_lists.push({
        barangay_id: barangayId,
        barangay_name: account.barangay?.name || 'Unknown Barangay',
        official: `${account.first_name || ''} ${account.last_name || ''}`.trim(),
        farmers: [],
        farmer_ids: [],
        items: [{ supply_id: '' }],
        allocations: []
      })
      this.activeListIndex = this.eventForm.barangay_lists.length - 1
    },

    selectAllBarangays() {
      this.barangayAccounts.forEach(account => {
        if (!this.isBarangaySelected(account.barangay_id)) this.toggleBarangay(account)
      })
    },

    clearBarangays() {
      this.eventForm.barangay_lists = []
      this.activeListIndex = 0
    },

    removeBarangayById(barangayId) {
      const index = this.eventForm.barangay_lists.findIndex(list => String(list.barangay_id) === String(barangayId))
      if (index !== -1) this.eventForm.barangay_lists.splice(index, 1)
      if (this.activeListIndex >= this.eventForm.barangay_lists.length) {
        this.activeListIndex = Math.max(0, this.eventForm.barangay_lists.length - 1)
      }
    },

    async prepareFarmerStep() {
      this.wizardStep = 4
      await this.loadAllBarangayFarmers()
    },

    async loadAllBarangayFarmers() {
      for (const list of this.eventForm.barangay_lists) {
        if (list.farmers.length > 0) continue
        try {
          const response = await axios.get(`${API_BASE}/api/barangays/${list.barangay_id}/farmers`)
          list.farmers = response.data || []
        } catch (error) {
          console.error(error.response?.data || error)
          this.showToast(`Failed to load farmers for ${list.barangay_name}`, 'error')
        }
      }
    },

    selectAllFarmers(list) {
      list.farmer_ids = list.farmers.map(farmer => farmer.id)
    },

    clearFarmers(list) {
      list.farmer_ids = []
      list.allocations = []
    },

    farmerName(list, farmerId) {
      const farmer = list.farmers.find(f => String(f.id) === String(farmerId))
      if (!farmer) return 'Unknown farmer'
      return `${farmer.last_name}, ${farmer.first_name} ${farmer.middle_name || ''}`.trim()
    },

    addSupplyItem(list) {
      list.items.push({ supply_id: '' })
    },

    removeSupplyItem(list, index) {
      const item = list.items[index]
      if (item && item.supply_id) {
        list.allocations = list.allocations.filter(allocation => String(allocation.supply_id) !== String(item.supply_id))
      }
      list.items.splice(index, 1)
      if (!list.items.length) list.items.push({ supply_id: '' })
    },

    selectedSupplyItems(list) {
      return (list.items || []).filter(item => item.supply_id)
    },

    supplyName(supplyId) {
      const supply = this.supplies.find(s => String(s.id) === String(supplyId))
      return supply ? supply.name : 'Unknown supply'
    },

    supplyUnit(supplyId) {
      const supply = this.supplies.find(s => String(s.id) === String(supplyId))
      return supply ? supply.unit : ''
    },

    availableQuantity(supplyId) {
      const supply = this.supplies.find(s => String(s.id) === String(supplyId))
      return Number(supply?.qty_available || 0)
    },

    getAllAllocation(list, farmerId, supplyId) {
      const allocation = list.allocations.find(a => String(a.farmer_id) === String(farmerId) && String(a.supply_id) === String(supplyId))
      return allocation ? allocation.quantity : 0
    },

    setAllocation(list, farmerId, supplyId, value) {
      let quantity = parseInt(value, 10)
      if (Number.isNaN(quantity) || quantity < 0) quantity = 0

      const available = this.availableQuantity(supplyId)
      const currentTotal = this.totalAllocatedForSupply(list, supplyId)
      const oldQuantity = this.getAllAllocation(list, farmerId, supplyId)
      const otherAllocations = currentTotal - Number(oldQuantity || 0)

      if (quantity + otherAllocations > available) {
        quantity = Math.max(0, available - otherAllocations)
        this.showToast(`Allocation cannot exceed available stock.`, 'error')
      }

      const index = list.allocations.findIndex(a => String(a.farmer_id) === String(farmerId) && String(a.supply_id) === String(supplyId))
      if (index !== -1) {
        if (quantity > 0) list.allocations[index].quantity = quantity
        else list.allocations.splice(index, 1)
      } else if (quantity > 0) {
        list.allocations.push({ farmer_id: farmerId, supply_id: supplyId, quantity })
      }
    },

    totalAllocatedForSupply(list, supplyId) {
      return (list.allocations || [])
        .filter(allocation => String(allocation.supply_id) === String(supplyId) && list.farmer_ids.includes(allocation.farmer_id))
        .reduce((sum, allocation) => sum + Number(allocation.quantity || 0), 0)
    },

    isListComplete(list) {
      if (!list) return false
      if (!list.barangay_id) return false
      if (!list.farmer_ids.length) return false
      if (!this.selectedSupplyItems(list).length) return false
      if (!list.allocations.length) return false

      const farmersWithAllocation = new Set(
        list.allocations.filter(a => Number(a.quantity) > 0).map(a => String(a.farmer_id))
      )
      const everyFarmerHasAllocation = list.farmer_ids.every(farmerId => farmersWithAllocation.has(String(farmerId)))
      if (!everyFarmerHasAllocation) return false

      const suppliesWithAllocation = new Set(
        list.allocations.filter(a => Number(a.quantity) > 0).map(a => String(a.supply_id))
      )
      return this.selectedSupplyItems(list).every(item => suppliesWithAllocation.has(String(item.supply_id)))
    },

    // EVENT SELECTION
    selectEvent(event) {
      this.selectedEvent = event
      this.openListIds = (event.lists || []).slice(0, 1).map(list => list.id)
    },

    toggleListOpen(id) {
      const index = this.openListIds.indexOf(id)
      if (index === -1) this.openListIds.push(id)
      else this.openListIds.splice(index, 1)
    },

    isListOpen(id) {
      return this.openListIds.includes(id)
    },

    letterUrl(path) {
      if (!path) return ''
      if (String(path).startsWith('http')) return path
      return `${API_BASE}/storage/${String(path).replace(/^\/?storage\//, '')}`
    },

    // INVENTORY
    async fetchSupplies() {
      try {
        this.loadingSupplies = true
        const response = await axios.get(`${API_BASE}/api/inventory`)
        this.supplies = response.data || []
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast('Failed to load inventory', 'error')
      } finally {
        this.loadingSupplies = false
      }
    },

    // EVENTS
    async fetchDistributionEvents() {
      try {
        this.loadingLists = true
        const response = await axios.get(`${API_BASE}/api/distribution-events`)
        this.distributionEvents = response.data || []

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

    // BARANGAY ACCOUNTS
    async fetchBarangayAccounts() {
      try {
        const response = await axios.get(`${API_BASE}/api/barangay-accounts`)
        this.barangayAccounts = response.data || []
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast('Failed to load barangay accounts', 'error')
      }
    },

    // SUPPLY CRUD
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

    // SAVE DISTRIBUTION EVENT
    async saveDistributionEvent() {
      if (!this.canReviewEvent) {
        this.showToast('Please complete all barangay allocations.', 'error')
        return
      }

      try {
        this.savingEvent = true
        const formData = new FormData()

        // EVENT DETAILS
        formData.append('title', this.eventForm.title)
        formData.append('distribution_date', this.eventForm.distribution_date)
        if (this.eventForm.distribution_time) formData.append('distribution_time', this.eventForm.distribution_time)
        formData.append('venue', this.eventForm.venue)
        if (this.eventForm.description) formData.append('description', this.eventForm.description)

        // LETTER
        formData.append('letter_image', this.eventForm.letter_file)

        // BARANGAY LISTS
        this.eventForm.barangay_lists.forEach((list, listIndex) => {
          formData.append(`barangay_lists[${listIndex}][barangay_id]`, list.barangay_id)

          list.farmer_ids.forEach((farmerId, farmerIndex) => {
            formData.append(`barangay_lists[${listIndex}][farmer_ids][${farmerIndex}]`, farmerId)
          })

          this.selectedSupplyItems(list).forEach((item, itemIndex) => {
            formData.append(`barangay_lists[${listIndex}][items][${itemIndex}][supply_id]`, item.supply_id)
          })

          list.allocations
            .filter(allocation =>
              list.farmer_ids.includes(allocation.farmer_id) &&
              this.selectedSupplyItems(list).some(item => String(item.supply_id) === String(allocation.supply_id)) &&
              Number(allocation.quantity) > 0
            )
            .forEach((allocation, allocationIndex) => {
              formData.append(`barangay_lists[${listIndex}][allocations][${allocationIndex}][farmer_id]`, allocation.farmer_id)
              formData.append(`barangay_lists[${listIndex}][allocations][${allocationIndex}][supply_id]`, allocation.supply_id)
              formData.append(`barangay_lists[${listIndex}][allocations][${allocationIndex}][quantity]`, allocation.quantity)
            })
        })

        await axios.post(`${API_BASE}/api/distribution-events`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        await this.fetchDistributionEvents()
        this.showToast('Distribution event saved as draft.', 'success')
        this.showCreateEvent = false
        this.resetEventForm()
      } catch (error) {
        console.error(error.response?.data || error)
        const message = error.response?.data?.message || 'Failed to create distribution event.'
        this.showToast(message, 'error')
      } finally {
        this.savingEvent = false
      }
    },

    // PUBLISH EVENT
    async publishDistributionEvent(event) {
      try {
        if (!event.lists || !event.lists.length) {
          this.showToast('This event has no barangay lists to publish.', 'error')
          return
        }

        const confirmed = confirm('Publish this distribution event to all selected barangays? Inventory will be deducted.')
        if (!confirmed) return

        const response = await axios.patch(`${API_BASE}/api/distribution-events/${event.id}/publish`)
        if (response.data && response.data.event) {
          this.selectedEvent = response.data.event
        } else {
          event.status = 'published'
          event.lists.forEach(list => { list.status = 'published' })
        }

        await Promise.all([this.fetchDistributionEvents(), this.fetchSupplies()])
        this.showToast('Distribution event published and stock updated!', 'success')
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast(error.response?.data?.message || 'Unable to publish event', 'error')
      }
    },

    // COMPLETE EVENT
    async completeDistributionEvent(event) {
      try {
        if (!event.lists || !event.lists.length) return

        const confirmed = confirm('Mark this distribution event as completed?')
        if (!confirmed) return

        const response = await axios.patch(`${API_BASE}/api/distribution-events/${event.id}/complete`)
        if (response.data && response.data.event) {
          this.selectedEvent = response.data.event
        } else {
          event.status = 'completed'
          event.lists.forEach(list => { list.status = 'completed' })
        }

        await this.fetchDistributionEvents()
        this.showToast('Distribution event completed', 'success')
      } catch (error) {
        console.error(error.response?.data || error)
        this.showToast('Unable to complete event', 'error')
      }
    },

    // RESET EVENT
    resetEventForm() {
      this.eventForm = {
        letter_file: null,
        letter_preview: '',
        letter_name: '',
        letter_type: '',
        title: '',
        distribution_date: '',
        distribution_time: '',
        venue: '',
        description: '',
        barangay_lists: []
      }
      this.wizardStep = 1
      this.activeListIndex = 0
      if (this.$refs.letterInput) this.$refs.letterInput.value = ''
    }
  }
}
</script>

<style scoped>
* { box-sizing: border-box; }
 
.inv-page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #F8FAF8;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
 
/* ===================== HEADER ===================== */
.top-header {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid #E7F0EC;
  border-radius: 16px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
 
.header-title-group .eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #116D3E;
  margin-bottom: 2px;
}
 
.header-title-group h1 {
  font-size: 18px;
  font-weight: 700;
  color: #0F212F;
  letter-spacing: -0.01em;
}
 
.header-title-group p:not(.eyebrow) {
  font-size: 12px;
  color: #5c6b64;
  margin-top: 2px;
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
 
/* ===================== PAGE ACTIONS ===================== */
.page-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}
 
/* ===================== BUTTONS ===================== */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}
 
.btn .icon { width: 16px; height: 16px; }
 
.btn-primary {
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.28);
}
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
 
.btn-ghost {
  background: #FFFFFF;
  color: #0F212F;
  border: 1.5px solid #E0EAE3;
}
.btn-ghost:hover { border-color: #116D3E; background: #F1F6F2; }
 
.btn-sm { padding: 7px 12px; font-size: 0.74rem; }
 
.btn-block { width: 100%; justify-content: center; margin-top: 0.4rem; }
 
/* ===================== LEDGER STRIP ===================== */
.ledger-strip {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1rem 1.4rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
}
 
.ledger-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  text-align: center;
}
 
.ledger-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0F212F;
}
 
.ledger-value.tone-green { color: #116D3E; }
.ledger-value.tone-gold  { color: #AC7A2F; }
.ledger-value.tone-blue  { color: #2E6F8E; }
.ledger-value.tone-plum  { color: #6B5B95; }
 
.ledger-label {
  font-size: 0.7rem;
  color: #5c6b64;
  font-weight: 600;
}
 
.ledger-divider {
  width: 1px;
  height: 34px;
  background: #EAF1EC;
}
 
/* ===================== TABS ===================== */
.tab-bar {
  display: flex;
  gap: 4px;
  background: #F1F6F2;
  padding: 4px;
  border-radius: 10px;
  width: fit-content;
}
 
.tab-btn {
  border: none;
  background: transparent;
  font-size: 0.8rem;
  font-weight: 600;
  color: #5c6b64;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
 
.tab-btn.active {
  background: #FFFFFF;
  color: #0F212F;
  box-shadow: 0 2px 8px rgba(15, 33, 47, 0.08);
}
 
/* ===================== TOOLBAR / SEARCH / FILTERS ===================== */
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
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
  width: 16px;
  height: 16px;
}
 
.search-input {
  width: 100%;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  padding: 9px 12px 9px 34px;
  font-size: 0.8rem;
  color: #0F212F;
  background: #FFFFFF;
  outline: none;
  transition: border-color 0.15s ease;
}
.search-input:focus { border-color: #116D3E; }
 
.filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
 
.filter-tag {
  border: 1.5px solid #E0EAE3;
  background: #FFFFFF;
  color: #5c6b64;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 7px 13px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}
.filter-tag:hover { border-color: #116D3E; }
.filter-tag.active {
  background: linear-gradient(135deg, #116D3E, #0A5232);
  border-color: transparent;
  color: #FFFFFF;
}
 
/* ===================== TABLE ===================== */
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
 
.data-table thead th.num,
.data-table td.num { text-align: right; }
 
.data-table th.col-actions { width: 90px; }
 
.data-table tbody td {
  font-size: 0.82rem;
  color: #0F212F;
  padding: 12px 14px;
  border-bottom: 1px solid #F1F6F2;
}
 
.data-table tbody tr.row-low { background: rgba(210, 149, 57, 0.05); }
.data-table tbody tr.row-out { background: rgba(193, 71, 61, 0.05); }
 
.td-name { font-weight: 700; }
.td-muted { color: #5c6b64; }
.td-qty { font-weight: 700; }
.td-loading { text-align: center; color: #5c6b64; padding: 2.5rem !important; }
 
.cat-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: #2E6F8E;
  background: rgba(46, 111, 142, 0.1);
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}
 
.row-actions { display: flex; gap: 6px; }
 
.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1.5px solid #E0EAE3;
  background: #FFFFFF;
  color: #5c6b64;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.icon-btn .icon { width: 14px; height: 14px; }
.icon-btn:hover { border-color: #116D3E; color: #116D3E; }
.icon-btn-danger:hover { border-color: #C1473D; color: #C1473D; }
 
.empty-block, .empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
}
 
.empty-title { font-size: 0.88rem; font-weight: 700; color: #0F212F; margin-bottom: 4px; }
.empty-copy { font-size: 0.78rem; color: #5c6b64; }
.empty-copy.small { font-size: 0.74rem; }
 
/* ===================== STATUS PILLS ===================== */
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
 
.status-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
 
.status-pill-lg { padding: 6px 14px; font-size: 0.76rem; }
 
.status-pill.sp-in-stock  { background: rgba(17, 109, 62, 0.1);  color: #116D3E; }
.status-pill.sp-low       { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.status-pill.sp-out       { background: rgba(193, 71, 61, 0.1);  color: #C1473D; }
 
.status-pill.sp-draft     { background: #F1F6F2; color: #5c6b64; }
.status-pill.sp-published { background: rgba(46, 111, 142, 0.1); color: #2E6F8E; }
.status-pill.sp-completed { background: rgba(17, 109, 62, 0.1);  color: #116D3E; }
.status-pill.sp-cancelled { background: rgba(193, 71, 61, 0.1);  color: #C1473D; }
 
/* ===================== DISTRIBUTION LISTS ===================== */
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
  border: 1.5px solid #EAF1EC;
  border-radius: 14px;
  padding: 0.9rem 1rem;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.dist-card:hover { border-color: #C7DECF; }
.dist-card.selected {
  border-color: #116D3E;
  box-shadow: 0 0 0 2px rgba(17, 109, 62, 0.15);
}
 
.dc-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.dc-id { font-size: 0.68rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
.dc-title { font-size: 0.88rem; font-weight: 700; color: #0F212F; margin-bottom: 8px; }
 
.dc-meta { display: flex; gap: 14px; flex-wrap: wrap; }
.dc-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  color: #5c6b64;
  font-weight: 600;
}
 
.icon-sm { width: 14px; height: 14px; flex-shrink: 0; }
 
/* ===================== MANIFEST / DETAIL ===================== */
.manifest-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  padding: 1.5rem;
}
 
.manifest-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 1.1rem; }
.detail-id { font-size: 0.68rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
.detail-title { font-size: 1.1rem; font-weight: 700; color: #0F212F; margin-top: 2px; }
 
.section-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
  margin-bottom: 8px;
}
 
.event-letter-preview { margin-bottom: 1.1rem; }
.letter-preview-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #F8FAF8;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 10px;
}
.letter-image { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; }
 
.detail-meta-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
  margin-bottom: 1rem;
}
 
.dm-item { display: flex; flex-direction: column; gap: 3px; }
.dm-label { font-size: 0.68rem; color: #5c6b64; font-weight: 600; }
.dm-val { font-size: 0.84rem; font-weight: 700; color: #0F212F; }
 
.perforation {
  display: flex;
  gap: 6px;
  overflow: hidden;
  margin: 1.1rem 0;
}
.perforation span {
  flex: 1;
  height: 1px;
  border-bottom: 1px dashed #E0EAE3;
}
 
.barangay-block {
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  margin-bottom: 8px;
  overflow: hidden;
}
 
.barangay-block-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #F8FAF8;
  border: none;
  cursor: pointer;
}
 
.bb-left { display: flex; align-items: center; gap: 8px; }
.bb-name { font-size: 0.82rem; font-weight: 700; color: #0F212F; }
 
.chevron { color: #94a3b8; transition: transform 0.15s ease; }
.chevron.open { transform: rotate(90deg); color: #116D3E; }
 
.bb-right { display: flex; align-items: center; gap: 10px; }
.bb-stat { font-size: 0.72rem; color: #5c6b64; font-weight: 600; }
 
.barangay-block-body { padding: 12px 14px; }
 
.mini-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c6b64;
  margin: 10px 0 6px;
}
 
.farmer-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.farmer-chip {
  font-size: 0.72rem;
  font-weight: 600;
  color: #116D3E;
  background: rgba(17, 109, 62, 0.08);
  padding: 4px 10px;
  border-radius: 999px;
}
 
.detail-actions { margin-top: 1.2rem; }
 
.detail-empty {
  background: #FFFFFF;
  border: 1px dashed #D7E2D8;
  border-radius: 16px;
  padding: 3rem 1.5rem;
  text-align: center;
}
.empty-icon { width: 44px; height: 44px; color: #C7DECF; margin-bottom: 12px; }
 
/* ===================== INNER TABLE ===================== */
.inner-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
.inner-table th {
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 6px 8px;
}
.inner-table th.num, .inner-table td.num { text-align: right; }
.inner-table td { font-size: 0.78rem; color: #0F212F; padding: 6px 8px; border-top: 1px solid #F1F6F2; }
 
/* ===================== MODALS ===================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 33, 47, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 20px;
}
 
.modal {
  background: #FFFFFF;
  border-radius: 18px;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  max-height: 88vh;
  overflow-y: auto;
  box-shadow: 0 24px 60px rgba(15, 33, 47, 0.25);
}
 
.modal-wide { max-width: 780px; }
 
.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}
.modal-head h4 { font-size: 1.05rem; font-weight: 700; color: #0F212F; }
.modal-head .eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #116D3E;
  margin-bottom: 2px;
}
 
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
 
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.9rem;
}
 
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field.span-2 { grid-column: span 2; }
.form-field label { font-size: 0.76rem; font-weight: 600; color: #5c6b64; }
.form-field .optional { font-weight: 400; color: #94a3b8; }
 
.form-field input,
.form-field select,
.form-field textarea {
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  padding: 9px 12px;
  font-size: 0.82rem;
  color: #0F212F;
  background: #FFFFFF;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s ease;
}
.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus { border-color: #116D3E; }
.form-field textarea { min-height: 80px; resize: vertical; }
 
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 1.4rem;
  padding-top: 1.1rem;
  border-top: 1px solid #F1F6F2;
}
 
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
 
/* ===================== WIZARD ===================== */
.wizard-steps {
  display: flex;
  align-items: center;
  margin-bottom: 1.4rem;
  overflow-x: auto;
}
 
.wizard-step {
  display: flex;
  align-items: center;
  gap: 7px;
  border: none;
  background: transparent;
  font-size: 0.76rem;
  font-weight: 600;
  color: #94a3b8;
  padding: 4px 6px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.wizard-step:disabled { cursor: not-allowed; opacity: 0.6; }
.wizard-step.active { color: #0F212F; }
.wizard-step.done { color: #116D3E; }
 
.wizard-step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #F1F6F2;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  font-weight: 700;
  flex-shrink: 0;
}
.wizard-step.active .wizard-step-num { background: linear-gradient(135deg, #116D3E, #0A5232); color: #FFFFFF; }
.wizard-step.done .wizard-step-num { background: rgba(17, 109, 62, 0.12); color: #116D3E; }
 
.wizard-line { width: 20px; height: 1px; background: #E0EAE3; flex-shrink: 0; margin: 0 2px; }
 
.wizard-panel { display: flex; flex-direction: column; gap: 1rem; }
.wizard-intro { margin-bottom: 0.2rem; }
 
.config-step-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0F212F;
  flex-wrap: wrap;
}
 
.step-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(17, 109, 62, 0.12);
  color: #116D3E;
  font-size: 0.7rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
 
/* ===================== LETTER UPLOAD ===================== */
.letter-upload-box {
  border: 1.5px dashed #D7E2D8;
  border-radius: 14px;
  padding: 2.2rem 1.2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.letter-upload-box:hover { border-color: #116D3E; background: #F8FAF8; }
 
.upload-icon { width: 40px; height: 40px; color: #C7DECF; margin-bottom: 10px; }
.upload-title { font-size: 0.88rem; font-weight: 700; color: #0F212F; }
.upload-copy { font-size: 0.78rem; color: #5c6b64; margin-top: 2px; }
.upload-hint { font-size: 0.7rem; color: #94a3b8; margin-top: 6px; }
 
.hidden-file-input { display: none; }
 
.letter-preview img { width: 100%; max-height: 220px; object-fit: cover; border-radius: 12px; }
.letter-preview-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}
 
.letter-pdf-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 12px;
}
.pdf-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(193, 71, 61, 0.1);
  color: #C1473D;
  font-size: 0.65rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pdf-info { flex: 1; }
 
/* ===================== BARANGAY SELECTION ===================== */
.barangay-selection-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
 
.count-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #116D3E;
  background: rgba(17, 109, 62, 0.1);
  padding: 3px 10px;
  border-radius: 999px;
  margin-left: auto;
}
 
.barangay-selection-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
  padding: 4px;
}
 
.barangay-selection-option {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1.5px solid #EAF1EC;
  border-radius: 10px;
  padding: 9px 12px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.barangay-selection-option:hover { border-color: #C7DECF; background: #F8FAF8; }
 
.barangay-option-copy { display: flex; flex-direction: column; }
.barangay-option-name { font-size: 0.8rem; font-weight: 700; color: #0F212F; }
.barangay-option-official { font-size: 0.7rem; color: #5c6b64; }
 
.selected-barangays { margin-top: 0.2rem; }
.selected-barangay-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.selected-barangay-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(17, 109, 62, 0.1);
  color: #116D3E;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 5px 6px 5px 11px;
  border-radius: 999px;
}
.selected-barangay-chip button {
  border: none;
  background: rgba(17, 109, 62, 0.15);
  color: #116D3E;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 0.65rem;
  cursor: pointer;
}
 
/* ===================== FARMERS & ALLOCATION ===================== */
.barangay-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  border-bottom: 1px solid #F1F6F2;
  padding-bottom: 10px;
}
 
.barangay-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid #E0EAE3;
  background: #FFFFFF;
  color: #5c6b64;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 7px 13px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.barangay-tab.active { border-color: #116D3E; color: #116D3E; background: rgba(17, 109, 62, 0.06); }
.barangay-tab.incomplete { border-style: dashed; }
.tab-check { color: #116D3E; }
 
.barangay-config { display: flex; flex-direction: column; gap: 1.3rem; margin-top: 1rem; }
 
.config-step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
 
.recipient-actions { display: flex; gap: 6px; }
 
.farmers-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}
 
.farmer-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #0F212F;
  padding: 7px 10px;
  border: 1px solid #F1F6F2;
  border-radius: 8px;
  cursor: pointer;
}
.farmer-option:hover { border-color: #C7DECF; }
 
.item-chip-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
 
.item-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  padding: 4px 4px 4px 10px;
}
.item-chip select {
  border: none;
  font-size: 0.78rem;
  color: #0F212F;
  outline: none;
  background: transparent;
  max-width: 220px;
}
.chip-remove {
  border: none;
  background: #F1F6F2;
  color: #5c6b64;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
}
 
.allocation-wrap { overflow-x: auto; }
 
.allocation-table th {
  white-space: nowrap;
  padding-right: 16px;
}
 
.alloc-total {
  display: block;
  font-size: 0.62rem;
  font-weight: 500;
  color: #5c6b64;
  text-transform: none;
}
 
.sticky-col {
  position: sticky;
  left: 0;
  background: #FFFFFF;
  z-index: 1;
}
 
.alloc-input {
  width: 70px;
  border: 1.5px solid #E0EAE3;
  border-radius: 7px;
  padding: 6px 8px;
  font-size: 0.78rem;
  text-align: right;
}
.alloc-input:focus { border-color: #116D3E; outline: none; }
 
.allocation-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  background: #F8FAF8;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 12px 16px;
}
.allocation-summary > div { display: flex; flex-direction: column; gap: 2px; }
.allocation-summary strong { font-size: 0.86rem; color: #0F212F; }
 
/* ===================== REVIEW ===================== */
.review-panel { gap: 1.3rem; }
 
.review-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
 
.review-section { border-top: 1px solid #F1F6F2; padding-top: 1rem; }
 
.review-letter {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(17, 109, 62, 0.06);
  border-radius: 12px;
  padding: 12px 14px;
}
.review-check {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #116D3E;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
}
 
.review-barangay {
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 8px;
}
.review-barangay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
 
.inventory-review-list { display: flex; flex-direction: column; gap: 6px; }
.inventory-review-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #0F212F;
  padding: 8px 10px;
  background: #F8FAF8;
  border-radius: 8px;
}
 
.review-notice {
  background: rgba(210, 149, 57, 0.1);
  border: 1px solid rgba(210, 149, 57, 0.25);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 0.8rem;
  color: #7a5620;
}
.review-notice strong { color: #AC7A2F; }
.review-notice p { margin-top: 4px; }
 
/* ===================== TOAST ===================== */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #0F212F;
  color: #FFFFFF;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 12px 18px;
  border-radius: 10px;
  box-shadow: 0 16px 36px rgba(15, 33, 47, 0.3);
  z-index: 60;
}
.toast-success { background: linear-gradient(135deg, #116D3E, #0A5232); }
.toast-error   { background: linear-gradient(135deg, #C1473D, #922E26); }
.toast-info    { background: #0F212F; }
 
.slide-toast-enter-active, .slide-toast-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.slide-toast-enter-from, .slide-toast-leave-to { opacity: 0; transform: translateY(10px); }
 
/* ===================== RESPONSIVE ===================== */
@media (max-width: 1100px) {
  .lists-area { grid-template-columns: 1fr; }
  .barangay-selection-list, .farmers-list { grid-template-columns: 1fr; }
}
 
@media (max-width: 768px) {
  .ledger-strip { flex-wrap: wrap; gap: 1rem; }
  .ledger-divider { display: none; }
  .form-grid { grid-template-columns: 1fr; }
  .form-field.span-2 { grid-column: span 1; }
  .detail-meta-row { grid-template-columns: repeat(2, 1fr); }
}
</style>