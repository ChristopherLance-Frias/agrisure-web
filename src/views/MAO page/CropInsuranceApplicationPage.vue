<template>
  <div class="layout">
    <div class="main-wrapper">
      <header class="top-header no-print">
        <div class="header-title-group">
          <h1>Crop Insurance Applications</h1>
          <p>Review, update, and manage farmer insurance applications submitted to MAO</p>
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

      <main class="body">
        <div v-if="hasConfiguredSeason" class="panel season-card no-print">
          <div class="season-info">
            <span class="season-icon open">⏱</span>

            <div class="season-text">
              <span class="season-label">Current Insurance Season</span>
              <span class="season-name">{{ currentSeason.season_name }}</span>
            </div>

            <div class="season-text">
              <span class="season-label">Application Deadline</span>
              <span class="season-name">{{ formatDate(currentSeason.deadline_date) }}</span>
            </div>
          </div>

          <div class="season-actions">
            <button class="btn-outline btn-compact" @click="openSeasonModal">Season Settings</button>
            <button v-if="currentSeason.status === 'application_open'" class="btn-danger btn-compact" @click="closeSeason">Close Season</button>
            <button v-else class="btn-primary btn-compact" @click="openNewSeasonModal">Start New Season</button>
          </div>
        </div>

        <!-- Setup Prompt Card fallback -->
        <div v-else class="panel setup-card no-print">
          <div class="setup-icon">📅</div>
          <h3>Season Setup Required</h3>
          <p>Configure the current active insurance window to start processing applications.</p>

          <div class="setup-form">
            <div class="form-field">
              <label>Season Name</label>
              <input
                v-model="seasonForm.season_name"
                type="text"
                placeholder="Example: Wet Season 2026"
              />
            </div>

            <div class="form-field">
              <label>Application Deadline</label>
              <input v-model="seasonForm.deadline_date" type="date" />
            </div>

            <p v-if="seasonModalError" class="modal-error">{{ seasonModalError }}</p>

            <button class="btn-primary btn-block" @click="saveSeason" :disabled="savingSeason">
              {{ savingSeason ? 'Saving...' : 'Save and Show Applications' }}
            </button>
          </div>
        </div>

        <!-- Settings Modification Modal Popup -->
        <div v-if="showSeasonModal" class="modal-backdrop no-print" @click.self="closeSeasonModal">
          <div class="modal">
            <div class="modal-head">
              <h4>{{ isStartingNewSeason ? 'Start New Season' : 'Season Settings' }}</h4>
              <button class="modal-close" @click="closeSeasonModal">×</button>
            </div>

            <div class="form-field">
              <label>Season Name</label>
              <input v-model="seasonForm.season_name" type="text" />
            </div>

            <div class="form-field">
              <label>Application Deadline</label>
              <input v-model="seasonForm.deadline_date" type="date" />
            </div>

            <p v-if="seasonModalError" class="modal-error">{{ seasonModalError }}</p>

            <div class="modal-actions">
              <button class="btn-outline btn-compact" @click="closeSeasonModal" :disabled="savingSeason">
                Cancel
              </button>

              <button class="btn-primary btn-compact" @click="saveSeason" :disabled="savingSeason">
                {{ savingSeason ? 'Saving...' : (isStartingNewSeason ? 'Create Season' : 'Save Changes') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Application Window Navigation Tabs -->
        <div class="tab-bar no-print">
          <button
            class="tab-btn"
            :class="{ active: activeAppTab === 'current' }"
            @click="switchTab('current')"
          >
            Current Season Window
          </button>

          <button
            class="tab-btn"
            :class="{ active: activeAppTab === 'history' }"
            @click="switchTab('history')"
          >
            Archived / Previous Seasons
          </button>
        </div>

        <div class="panel">
          <div class="refresh-bar no-print">
            <div class="refresh-status">
              <span class="refresh-dot" :class="{ live: autoRefresh }"></span>
              <span v-if="autoRefresh">Auto-refresh on &middot; every {{ refreshIntervalSeconds }}s</span>
              <span v-else>Auto-refresh off</span>
              <span v-if="lastRefreshedAt" class="refresh-last">&middot; Last updated {{ formatTime(lastRefreshedAt) }}</span>
            </div>

            <div class="refresh-controls">
              <button
                class="btn-icon-refresh"
                @click="manualRefresh"
                :disabled="isLoading || isRefreshing"
                title="Refresh now"
              >
                <span class="refresh-glyph" :class="{ spinning: isRefreshing }">⟳</span> Refresh
              </button>

              <label class="toggle-switch">
                <input type="checkbox" v-model="autoRefresh" @change="onToggleAutoRefresh" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="filters-row no-print">
            <div class="search-wrap">
              <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                v-model="searchName"
                class="search-input"
                type="text"
                placeholder="Search farmer name..."
              />
            </div>

            <select v-model="filterCrop" class="filter-select">
              <option value="">All Crop Types</option>
              <option value="Rice">Rice</option>
              <option value="Corn">Corn</option>
            </select>

            <select
              v-if="activeAppTab === 'history'"
              v-model="historySeasonId"
              class="filter-select"
            >
              <option value="">All Previous Cycles</option>
              <option
                v-for="season in previousSeasons"
                :key="season.id"
                :value="season.id"
              >
                {{ season.season_name }}
              </option>
            </select>

            <button class="btn-outline btn-compact" @click="resetFilters">Reset Filters</button>
          </div>

          <div class="status-filter-row no-print">
            <button
              v-for="f in statusFilters"
              :key="f.value"
              class="status-filter-tag"
              :class="[f.value ? 'sf-' + f.value : 'sf-all', { active: filterStatus === f.value }]"
              @click="filterStatus = f.value"
            >
              {{ f.label }}
              <span v-if="f.value" class="sf-count">{{ countByStatus(f.value) }}</span>
            </button>
          </div>

          <!-- Status-aware floating bulk action bar -->
          <transition name="float-bar">
            <div v-if="selectedIds.length > 0" class="bulk-action-bar floating no-print" :class="{ mixed: !selectedStatus }">
              <div class="bulk-left">
                <strong>{{ selectedIds.length }}</strong>
                <span>application(s) selected</span>

                <span v-if="selectedStatus" class="status-badge" :class="selectedStatus">
                  {{ statusLabel(selectedStatus) }}
                </span>
              </div>

              <div v-if="!selectedStatus" class="bulk-warning">
                ⚠ Select applications with the same status to apply a bulk action.
              </div>

              <div v-else class="bulk-actions">
                <template v-if="selectedStatus === 'submitted_to_mao' || selectedStatus === 'needs_revision'">
                  <button class="btn-primary btn-compact" @click="bulkUpdateStatus('approved_for_pcic')">
                    Mark {{ selectedIds.length }} as To be Submitted to PCIC
                  </button>
                </template>

                <template v-if="selectedStatus === 'approved_for_pcic'">
                  <button
                    class="btn-primary btn-compact"
                    @click="bulkUpdateStatus('submitted_to_pcic')"
                    :disabled="!hasDownloadedSelectedBatch"
                    :title="!hasDownloadedSelectedBatch ? 'Download the batch PDF for this selection first' : ''"
                  >
                    Mark {{ selectedIds.length }} as Forwarded to PCIC
                  </button>

                  <button
                    class="btn-outline btn-compact"
                    @click="downloadSelectedPcicBatch"
                    :disabled="isGeneratingPdf"
                  >
                    📥 {{ isGeneratingPdf ? 'Generating...' : 'Download Selected Batch PDF (' + selectedIds.length + ')' }}
                  </button>

                  <span v-if="!hasDownloadedSelectedBatch" class="bulk-terminal-note">
                    Download the batch PDF before forwarding to PCIC.
                  </span>
                </template>

                <!--
                  submitted_to_pcic is now a terminal status for MAO (see isTerminal()).
                  Once applications reach it they are no longer selectable, so this
                  branch is effectively unreachable — kept only as a defensive fallback.
                -->
                <template v-if="selectedStatus === 'submitted_to_pcic' || selectedStatus === 'insured' || selectedStatus === 'rejected'">
                  <span class="bulk-terminal-note">No further action available for this status.</span>
                </template>
              </div>

              <button class="link-btn-muted" @click="clearSelection">Clear</button>
            </div>
          </transition>

          <div class="metrics-grid no-print">
            <div class="metric-card">
              <div class="card-header">
                <span class="card-label">Total</span>
                <span class="icon-badge blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <line x1="8" y1="9" x2="16" y2="9" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                  </svg>
                </span>
              </div>
              <div class="card-value">{{ scopedApplications.length }}</div>
            </div>

            <div class="metric-card">
              <div class="card-header">
                <span class="card-label">Pending MAO</span>
                <span class="icon-badge amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 16 14" />
                  </svg>
                </span>
              </div>
              <div class="card-value">{{ countByStatus('submitted_to_mao') }}</div>
            </div>

            <div class="metric-card">
              <div class="card-header">
                <span class="card-label">Ready for PCIC</span>
                <span class="icon-badge teal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              </div>
              <div class="card-value">{{ countByStatus('approved_for_pcic') }}</div>
            </div>

            <div class="metric-card">
              <div class="card-header">
                <span class="card-label">Forwarded to PCIC</span>
                <span class="icon-badge purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 6h16M4 12h16M4 18h10" />
                  </svg>
                </span>
              </div>
              <div class="card-value">{{ countByStatus('submitted_to_pcic') }}</div>
            </div>
          </div>

          <div v-if="isLoading" class="state-box no-print">
            <div class="spinner"></div>
            <span>Fetching applications registry...</span>
          </div>

          <div v-else-if="errorMessage" class="state-box error-box no-print">
            <span>{{ errorMessage }}</span>
          </div>

          <div v-else class="table-responsive no-print">
            <div v-if="filtered.length === 0" class="empty-state">
              No application records correspond to your filter parameters.
            </div>

            <table v-else class="data-table app-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      :checked="allFilteredSelected"
                      :disabled="selectableFiltered.length === 0"
                      @change="toggleSelectAllFiltered"
                    />
                  </th>
                  <th></th>
                  <th>Farmer</th>
                  <th>Barangay</th>
                  <th>Farm Name</th>
                  <th>Crop</th>
                  <th>Variety</th>
                  <th>Farm Type</th>
                  <th>Area (ha)</th>
                  <th>Current Status</th>
                  <th>Season</th>
                  <th>Applied Date</th>
                </tr>
              </thead>

              <tbody>
                <template v-for="app in filtered" :key="app.id">
                  <tr
                    class="main-row"
                    :class="{ expanded: expandedId === app.id, selected: isSelected(app.id) }"
                    @click="toggleExpand(app.id)"
                  >
                    <td @click.stop>
                      <input
                        type="checkbox"
                        v-if="isTerminal(app.status) === false"
                        :checked="isSelected(app.id)"
                        :disabled="isCheckboxDisabled(app)"
                        :title="app.payment_status === 'pending_verification' ? 'Expand details to verify payment before selecting' : (app.payment_status === 'rejected' ? 'Payment was rejected — this application cannot be selected' : '')"
                        @change="toggleSelection(app.id)"
                      />
                    </td>

                    <td class="expand-cell">
                      <span class="expand-icon" :class="{ open: expandedId === app.id }">▶</span>
                    </td>

                    <td class="farmer-cell">
                      <div class="farmer-name font-bold">{{ farmerName(app) }}</div>
                      <div class="farmer-sub">{{ app.farm?.farmer_profile?.user?.email || '—' }}</div>
                    </td>

                    <td>{{ truncateAddress(app.farm?.farmer_profile?.address) }}</td>
                    <td>{{ app.farm?.farm_name || '—' }}</td>
                    <td>{{ app.farm?.crop_type || '—' }}</td>
                    <td>{{ app.variety || '—' }}</td>
                    <td>{{ app.farm_type || '—' }}</td>
                    <td>{{ app.farm?.farm_area || '—' }}</td>

                    <td>
                      <span class="status-badge" :class="app.status">
                        {{ statusLabel(app.status) }}
                      </span>
                    </td>

                    <td>{{ app.season?.season_name || currentSeasonName(app) }}</td>
                    <td>{{ formatDate(app.application_date) }}</td>
                  </tr>

                  <tr v-if="expandedId === app.id" class="detail-row">
                    <td colspan="12">
                      <div class="detail-box" @click.stop>
                        <div class="action-panel">
                          <span class="action-panel-label">Available Action:</span>

                          <template v-if="app.status === 'submitted_to_mao' || app.status === 'needs_revision'">
                            <button
                              v-if="app.payment_status !== 'pending_verification' && app.payment_status !== 'rejected'"
                              class="btn-primary btn-compact"
                              @click="updateAppStatus(app.id, 'approved_for_pcic')"
                            >
                              Mark as To be Submitted to PCIC
                            </button>

                            <span v-else-if="app.payment_status === 'pending_verification'" class="action-hint amber">
                              ⏳ Payment verification required before this can move to PCIC. Verify the
                              payment below — it will automatically advance to "To be submitted to PCIC".
                            </span>

                            <span v-else-if="app.payment_status === 'rejected'" class="action-hint red">
                              ❌ Payment proof was rejected. This application cannot proceed to PCIC
                              until the farmer resubmits valid payment proof.
                            </span>
                          </template>

                          <template v-if="app.status === 'approved_for_pcic'">
                            <span class="action-hint blue">
                              ℹ️ PCIC requires batch transmittal. Select this application's checkbox
                              (and any others ready for PCIC) to forward it.
                            </span>
                          </template>

                          <!--
                            submitted_to_pcic is MAO's final system action for this application.
                            PCIC now notifies the farmer directly via SMS with the outcome, so no
                            "Mark Insured" / "Reject" action is exposed to MAO officers anymore.
                          -->
                          <template v-if="app.status === 'submitted_to_pcic'">
                            <span class="action-hint green">
                              ✅ Forwarded to PCIC. PCIC will contact the farmer directly via SMS with
                              the outcome of their application — no further action is needed from MAO.
                            </span>
                          </template>

                          <template v-if="app.status === 'insured' || app.status === 'rejected'">
                            <span class="action-hint">This application has reached a final status.</span>
                          </template>
                        </div>

                        <div class="detail-content full-width">
                          <div class="info-section">
                            <div class="detail-section">
                              <div class="section-title">Personal Information</div>

                              <div class="summary-grid">
                                <div class="summary-card">
                                  <div class="summary-label">Full Name</div>
                                  <div class="summary-value text-dark">{{ farmerName(app) }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Civil Status</div>
                                  <div class="summary-value text-dark">{{ app.civil_status || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Beneficiary</div>
                                  <div class="summary-value text-dark">{{ app.beneficiary_name || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Spouse Name</div>
                                  <div class="summary-value text-dark">{{ app.spouse_name || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Parent / Guardian</div>
                                  <div class="summary-value text-dark">{{ app.parent_guardian_name || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Phone</div>
                                  <div class="summary-value text-dark">{{ app.farm?.farmer_profile?.user?.phone_number || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Email</div>
                                  <div class="summary-value text-dark">{{ app.farm?.farmer_profile?.email_or_phone || app.farm?.farmer_profile?.user?.email || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">RSBSA Reference</div>
                                  <div class="summary-value text-dark">{{ app.farm?.farmer_profile?.rsbsa_reference || '—' }}</div>
                                </div>
                                <div class="summary-card col-span-full">
                                  <div class="summary-label">Address</div>
                                  <div class="summary-value text-dark">{{ app.farm?.farmer_profile?.address || '—' }}</div>
                                </div>
                                <div class="summary-card col-span-full" v-if="app.remarks">
                                  <div class="summary-label">Remarks</div>
                                  <div class="summary-value text-dark">{{ app.remarks }}</div>
                                </div>
                              </div>
                            </div>

                            <div class="detail-section">
                              <div class="section-title">Crop Information</div>

                              <div class="summary-grid">
                                <div class="summary-card">
                                  <div class="summary-label">Crop Type</div>
                                  <div class="summary-value text-dark">{{ app.farm?.crop_type || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Variety</div>
                                  <div class="summary-value text-dark">{{ app.variety || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Farm Type</div>
                                  <div class="summary-value text-dark">{{ app.farm_type || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Area Size</div>
                                  <div class="summary-value text-dark">{{ app.farm?.farm_area ? app.farm.farm_area + ' ha' : '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Sowing Date</div>
                                  <div class="summary-value text-dark">{{ formatDate(app.sowing_date) }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Transplanting</div>
                                  <div class="summary-value text-dark">{{ formatDate(app.transplanting_date) }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Farm Location</div>
                                  <div class="summary-value text-dark">{{ app.farm_location || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Land Category</div>
                                  <div class="summary-value text-dark">{{ app.land_category || '—' }}</div>
                                </div>
                              </div>
                            </div>

                            <div class="detail-section">
                              <div class="section-title">Land Boundaries &amp; Tenure</div>

                              <div class="summary-grid">
                                <div class="summary-card">
                                  <div class="summary-label">North</div>
                                  <div class="summary-value text-dark">{{ app.north_boundary || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">East</div>
                                  <div class="summary-value text-dark">{{ app.east_boundary || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">West</div>
                                  <div class="summary-value text-dark">{{ app.west_boundary || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">South</div>
                                  <div class="summary-value text-dark">{{ app.south_boundary || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Land Owner</div>
                                  <div class="summary-value text-dark">{{ app.is_land_owner ? 'Yes' : 'No' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Tenure Status</div>
                                  <div class="summary-value text-dark">{{ app.tenure_status || '—' }}</div>
                                </div>
                                <div class="summary-card col-span-full" v-if="app.farm?.latitude && app.farm?.longitude">
                                  <div class="summary-label">Farm Coordinates</div>
                                  <div class="summary-value text-dark coords">{{ app.farm.latitude }}, {{ app.farm.longitude }}</div>
                                </div>
                              </div>
                            </div>

                            <div class="detail-section">
                              <div class="section-title">Coverage &amp; Payment</div>

                              <div class="summary-grid">
                                <div class="summary-card">
                                  <div class="summary-label">Insured Area</div>
                                  <div class="summary-value text-dark">{{ app.insured_area ? app.insured_area + ' ha' : '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Covered Free Area</div>
                                  <div class="summary-value text-dark">{{ app.covered_free_area ? app.covered_free_area + ' ha' : '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Excess Area</div>
                                  <div class="summary-value text-dark">{{ app.excess_area ? app.excess_area + ' ha' : '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Free Coverage Before</div>
                                  <div class="summary-value text-dark">{{ app.free_coverage_before ? app.free_coverage_before + ' ha' : '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Free Coverage After</div>
                                  <div class="summary-value text-dark">{{ app.free_coverage_after ? app.free_coverage_after + ' ha' : '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Premium Amount</div>
                                  <div class="summary-value text-dark">{{ formatCurrency(app.premium_amount) }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Payment Status</div>
                                  <div class="summary-value text-dark">{{ paymentStatusLabel(app.payment_status) }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Payment Method</div>
                                  <div class="summary-value text-dark">{{ app.payment_method || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">GCash Reference #</div>
                                  <div class="summary-value text-dark">{{ app.gcash_reference_number || '—' }}</div>
                                </div>
                                <div class="summary-card">
                                  <div class="summary-label">Payment Submitted</div>
                                  <div class="summary-value text-dark">{{ app.payment_submitted_at ? formatDate(app.payment_submitted_at) : '—' }}</div>
                                </div>
                                <div class="summary-card col-span-full" v-if="app.payment_method && app.payment_status === 'pending_verification'">
                                  <div class="summary-label">Payment Validation</div>
                                  <div class="payment-validation-actions">
                                    <button class="btn-primary btn-compact" @click="verifyPayment(app.id)">
                                      Confirm Paid
                                    </button>
                                    <button class="btn-danger btn-compact" @click="rejectPayment(app.id)">
                                      Mark Failed
                                    </button>
                                  </div>
                                </div>
                                <div class="summary-card col-span-full" v-if="app.payment_proof_path">
                                  <div class="summary-label">Payment Proof</div>
                                  <a class="detail-link" :href="assetUrl(app.payment_proof_path)" target="_blank" rel="noopener">View uploaded proof</a>
                                </div>
                              </div>
                            </div>

                            <div class="detail-section">
                              <div class="section-title">Documents</div>

                              <div class="documents-row">
                                <div class="document-tile">
                                  <span class="detail-label">Farmer's Signature</span>
                                  <img
                                    v-if="app.signature_path"
                                    :src="assetUrl(app.signature_path)"
                                    alt="Farmer signature"
                                    class="signature-img"
                                  />
                                  <span v-else class="summary-value text-dark">—</span>
                                </div>

                                <div class="document-tile">
                                  <span class="detail-label">Farm Photo</span>
                                  <img
                                    v-if="app.farm?.farm_image_path"
                                    :src="assetUrl(app.farm.farm_image_path)"
                                    alt="Farm photo"
                                    class="farm-photo-img"
                                  />
                                  <span v-else class="summary-value text-dark">—</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- PDF Legal-Size Batch Export Container -->
        <div v-if="isPrintingPcicBatch" id="pdf-export-wrapper" class="pdf-export-wrapper">
          <div id="pdf-download-area" class="pdf-export-container legal-size-print">

            <template v-for="(pageRows, setIdx) in pcicBatchPages" :key="'set-' + setIdx">

              <!-- ================= PAGE 1: APPLICATION FORM ================= -->
              <div :class="{ 'pdf-page-break': setIdx > 0 }" class="pcic-page-container">
                <!-- Header Block -->
                <div class="pcic-official-header">
                  <div class="pcic-header-top">
                    <div class="pcic-logo-placeholder"></div>
                    <div class="pcic-title-box">
                      <div class="pcic-republic">Republic of the Philippines</div>
                      <div class="pcic-corp-name">PHILIPPINE CROP INSURANCE CORPORATION</div>
                      <div class="pcic-dept">DEPARTMENT OF AGRICULTURE</div>
                      <div class="pcic-form-title">APPLICATION FOR CROP INSURANCE (GROUP APPLICATION)</div>
                    </div>
                    <div class="pcic-form-code">PCIC-RO-01</div>
                  </div>

                  <!-- Meta Data Grid Header -->
                  <div class="pcic-meta-table">
                    <div class="meta-row">
                      <div class="meta-cell flex-2"><strong>NAME OF FO / FA / COOP / BARANGAY:</strong> {{ farmerOrgName || 'MAO AGRICULTURAL REGISTRY' }}</div>
                      <div class="meta-cell flex-1"><strong>CROP TYPE:</strong> {{ pdfCropLabel }}</div>
                      <div class="meta-cell flex-1"><strong>CROP SEASON:</strong> {{ currentSeason ? currentSeason.season_name : 'REGULAR' }}</div>
                    </div>
                    <div class="meta-row">
                      <div class="meta-cell flex-2"><strong>OFFICE ADDRESS / BARANGAY:</strong> ECHAGUE, CAGAYAN VALLEY</div>
                      <div class="meta-cell flex-1"><strong>BATCH NO:</strong> BATCH-{{ setIdx + 1 }}</div>
                      <div class="meta-cell flex-1"><strong>DATE SUBMITTED:</strong> {{ formatDate(new Date()) }}</div>
                    </div>
                  </div>
                </div>

                <!-- Page 1 Table -->
                <table class="pcic-official-table">
                  <thead>
                    <tr>
                      <th rowspan="2" class="col-num">NO.</th>
                      <th colspan="4" class="col-name-group">NAME OF FARMER</th>
                      <th rowspan="2" class="col-sex">SEX</th>
                      <th rowspan="2" class="col-civil">CIVIL STATUS</th>
                      <th rowspan="2" class="col-addr">ADDRESS (Sitio/Barangay)</th>
                      <th rowspan="2" class="col-dob">DATE OF BIRTH</th>
                      <th rowspan="2" class="col-rsbsa">RSBSA REF. NO.</th>
                      <th rowspan="2" class="col-pay">PAYMENT MODE</th>
                      <th rowspan="2" class="col-phone">TEL / PHONE</th>
                      <th rowspan="2" class="col-spouse">SPOUSE NAME</th>
                      <th rowspan="2" class="col-parent">PARENT / GUARDIAN</th>
                      <th rowspan="2" class="col-ben">BENEFICIARY NAME</th>
                      <th rowspan="2" class="col-area">AREA (ha)</th>
                      <th rowspan="2" class="col-date">SOWING / DS</th>
                      <th rowspan="2" class="col-date">TRANSPLANT</th>
                      <th rowspan="2" class="col-var">VARIETY</th>
                    </tr>
                    <tr>
                      <th class="col-lname">LAST NAME</th>
                      <th class="col-fname">FIRST NAME</th>
                      <th class="col-mname">MIDDLE</th>
                      <th class="col-ext">EXT</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr v-for="(app, idx) in pageRows" :key="'p1-' + setIdx + '-' + idx" class="pcic-data-row">
                      <td class="text-center bold">{{ (setIdx * 15) + idx + 1 }}</td>
                      <td>{{ app?.farm?.farmer_profile?.user?.last_name || '' }}</td>
                      <td>{{ app?.farm?.farmer_profile?.user?.first_name || '' }}</td>
                      <td>{{ app?.farm?.farmer_profile?.user?.middle_name || '' }}</td>
                      <td class="text-center">{{ app?.farm?.farmer_profile?.user?.extension_name || '' }}</td>
                      <td class="text-center">{{ genderLabel(app?.farm?.farmer_profile?.user?.sex) }}</td>
                      <td class="text-center">{{ app?.civil_status || '' }}</td>
                      <td>{{ truncateAddress(app?.farm?.farmer_profile?.address) }}</td>
                      <td class="text-center">{{ app ? formatDate(app.farm?.farmer_profile?.birthdate) : '' }}</td>
                      <td class="text-center font-mono">{{ app?.farm?.farmer_profile?.rsbsa_reference || '' }}</td>
                      <td class="text-center">{{ app?.payment_method || '' }}</td>
                      <td class="text-center">{{ app?.farm?.farmer_profile?.user?.phone_number || '' }}</td>
                      <td>{{ app?.spouse_name || '' }}</td>
                      <td>{{ app?.parent_guardian_name || '' }}</td>
                      <td>{{ app?.beneficiary_name || '' }}</td>
                      <td class="text-right bold">{{ app?.farm?.farm_area || '' }}</td>
                      <td class="text-center">{{ app ? formatDate(app.sowing_date) : '' }}</td>
                      <td class="text-center">{{ app ? formatDate(app.transplanting_date) : '' }}</td>
                      <td>{{ app?.variety || '' }}</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Page Footer / Signatures -->
                <div class="pcic-footer-block">
                  <div class="pcic-cert-text">
                    I hereby certify that the information provided above is true and correct to the best of my knowledge and belief.
                  </div>
                  <div class="pcic-sig-grid">
                    <div class="sig-box">
                      <div class="sig-line"></div>
                      <div class="sig-title">Prepared / Submitted By (MAO Officer)</div>
                    </div>
                    <div class="sig-box">
                      <div class="sig-line"></div>
                      <div class="sig-title">Validated / Received By (PCIC Representative)</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ================= PAGE 2: LOCATION & BOUNDARIES SCHEDULE ================= -->
              <div class="pdf-page-break pcic-page-container">
                <!-- Page 2 Header -->
                <div class="pcic-official-header">
                  <div class="pcic-header-top">
                    <div class="pcic-logo-placeholder"></div>
                    <div class="pcic-title-box">
                      <div class="pcic-republic">Republic of the Philippines</div>
                      <div class="pcic-corp-name">PHILIPPINE CROP INSURANCE CORPORATION</div>
                      <div class="pcic-form-title">FARM LOCATION &amp; BOUNDARY SCHEDULE (PAGE 2)</div>
                    </div>
                    <div class="pcic-form-code">PCIC-RO-01B</div>
                  </div>

                  <div class="pcic-meta-table">
                    <div class="meta-row">
                      <div class="meta-cell flex-1"><strong>BATCH PAGE:</strong> SET {{ setIdx + 1 }} OF {{ pcicBatchPages.length }}</div>
                      <div class="meta-cell flex-2"><strong>ORGANIZATION / BARANGAY:</strong> {{ farmerOrgName || 'MAO AGRICULTURAL REGISTRY' }}</div>
                      <div class="meta-cell flex-1"><strong>CROP TYPE:</strong> {{ pdfCropLabel }}</div>
                      <div class="meta-cell flex-1"><strong>DATE:</strong> {{ formatDate(new Date()) }}</div>
                    </div>
                  </div>
                </div>

                <!-- Page 2 Table -->
                <table class="pcic-official-table">
                  <thead>
                    <tr>
                      <th class="col-num">NO.</th>
                      <th class="col-p2-name">NAME OF FARMER</th>
                      <th class="col-p2-georef">GEOREF ID / FARM ID</th>
                      <th class="col-p2-loc">FARM LOCATION (Sitio / Barangay)</th>
                      <th class="col-area">AREA (ha)</th>
                      <th class="col-p2-cat">LAND CATEGORY</th>
                      <th class="col-p2-tenure">TENURIAL STATUS</th>
                      <th class="col-p2-bnd">NORTH BOUNDARY</th>
                      <th class="col-p2-bnd">SOUTH BOUNDARY</th>
                      <th class="col-p2-bnd">EAST BOUNDARY</th>
                      <th class="col-p2-bnd">WEST BOUNDARY</th>
                      <th class="col-p2-sig">SIGNATURE OF FARMER</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr v-for="(app, idx) in pageRows" :key="'p2-' + setIdx + '-' + idx" class="pcic-data-row">
                      <td class="text-center bold">{{ (setIdx * 15) + idx + 1 }}</td>
                      <td class="bold">{{ app ? pcicFormName(app) : '' }}</td>
                      <td class="text-center font-mono">{{ app?.farm?.id ? 'FM-' + app.farm.id : '' }}</td>
                      <td>{{ app?.farm_location || truncateAddress(app?.farm?.farmer_profile?.address) }}</td>
                      <td class="text-right bold">{{ app?.farm?.farm_area || '' }}</td>
                      <td class="text-center">{{ app?.land_category || '' }}</td>
                      <td class="text-center">{{ app?.tenure_status || '' }}</td>
                      <td>{{ app?.north_boundary || '' }}</td>
                      <td>{{ app?.south_boundary || '' }}</td>
                      <td>{{ app?.east_boundary || '' }}</td>
                      <td>{{ app?.west_boundary || '' }}</td>
                      <td class="text-center signature-cell">
                        <img
                          v-if="app?.signature_path"
                          :src="signatureDataUrls[app.signature_path] || assetUrl(app.signature_path)"
                          alt="Signature"
                          class="pdf-signature-img"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Page 2 Footer -->
                <div class="pcic-footer-block">
                  <div class="pcic-cert-text">
                    Note: All boundary details specified above correspond strictly to actual ground layout and RSBSA-registered agricultural plots.
                  </div>
                  <div class="pcic-sig-grid">
                    <div class="sig-box">
                      <div class="sig-line"></div>
                      <div class="sig-title">MAO Inspector / Verifier Signature</div>
                    </div>
                    <div class="sig-box">
                      <div class="sig-line"></div>
                      <div class="sig-title">Municipal Agricultural Officer</div>
                    </div>
                  </div>
                </div>
              </div>

            </template>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import html2pdf from 'html2pdf.js'

const API_BASE = 'https://sanagustinagrisure.com'

export default {
  name: 'CropInsuranceApplicationPage',

  data() {
    return {
      activeAppTab: 'current',
      applications: [],
      historyApplications: [],
      seasons: [],
      historySeasonId: '',

      isLoading: false,
      errorMessage: '',
      expandedId: null,

      searchName: '',
      filterCrop: '',
      filterStatus: '',

      statusFilters: [
        { label: 'All', value: '' },
        { label: 'Submitted to MAO', value: 'submitted_to_mao' },
        { label: 'To be Submitted to PCIC', value: 'approved_for_pcic' },
        { label: 'Forwarded to PCIC', value: 'submitted_to_pcic' },
      ],

      selectedIds: [],
      batchProcessing: false,
      hasDownloadedSelectedBatch: false,

      isPrintingPcicBatch: false,
      isGeneratingPdf: false,
      pcicBatchList: [],
      currentSeason: null,

      // Maps a raw signature_path -> preloaded base64 data URI, populated by
      // preloadSignatureImages() just before PDF generation. html2canvas
      // (used by html2pdf) needs to read image pixel data cross-origin to
      // draw it into the PDF canvas; the live CDN in front of the API
      // strips/withholds CORS headers on image responses, so fetching
      // signatures as base64 JSON instead (which passes through the same
      // CORS pipeline as the rest of the API) sidesteps that entirely.
      signatureDataUrls: {},

      showSeasonModal: false,
      seasonModalError: '',
      savingSeason: false,
      isStartingNewSeason: false,

      seasonForm: {
        season_name: 'Wet Season ' + new Date().getFullYear(),
        deadline_date: '',
      },

      autoRefresh: true,
      isRefreshing: false,
      lastRefreshedAt: null,
      refreshIntervalSeconds: 30,
      refreshTimer: null,
      currentUser: { name: 'Christopher', role: 'MAO Officer', initials: 'CP' },
    }
  },

  computed: {
    hasConfiguredSeason() {
      return !!(this.currentSeason && this.currentSeason.deadline_date)
    },

    previousSeasons() {
      var currentId = this.currentSeason ? this.currentSeason.id : null
      return this.seasons.filter(function(season) {
        return season.id !== currentId
      })
    },

    activeApplications() {
      return this.activeAppTab === 'current'
        ? this.applications
        : this.historyApplications
    },

    // Everything EXCEPT the status filter: search + crop + season. Stat
    // cards and the status-pill counts read from this (not from
    // activeApplications) so the numbers stay in sync with whatever
    // season/search/crop is currently narrowing the table — previously
    // they always summed the whole tab's data regardless of the season
    // dropdown, so counts looked "wrong" as soon as you picked a season.
    scopedApplications() {
      var search = this.searchName.toLowerCase()
      var crop = this.filterCrop
      var isCurrent = this.activeAppTab === 'current'
      var historyId = this.historySeasonId
      var self = this

      return this.activeApplications.filter(function(app) {
        var name = self.farmerName(app).toLowerCase()
        var matchName = !search || name.indexOf(search) !== -1
        var matchCrop = !crop || (app.farm && app.farm.crop_type === crop)
        var matchSeason = isCurrent || !historyId || self.matchesSeasonId(app, historyId)

        return matchName && matchCrop && matchSeason
      })
    },

    filtered() {
      var status = this.filterStatus
      return this.scopedApplications.filter(function(app) {
        return !status || app.status === status
      })
    },

    // Rows that CAN be checked for bulk selection: not terminal, and not
    // sitting on an unverified or rejected payment. A pending payment must
    // be resolved (via verifyPayment/rejectPayment in the expanded row)
    // before the application can join a batch, and a rejected payment
    // blocks it permanently until the farmer resubmits proof — see
    // isCheckboxDisabled below for the matching per-row lock.
    //
    // NOTE: the backend's actual payment_status enum is
    // not_required | pending_verification | verified | rejected — there is
    // no bare 'pending' value, so checks must use 'pending_verification'.
    selectableFiltered() {
      var self = this
      return this.filtered.filter(function(app) {
        return !self.isTerminal(app.status)
          && app.payment_status !== 'pending_verification'
          && app.payment_status !== 'rejected'
      })
    },

    allFilteredSelected() {
      var self = this
      if (this.selectableFiltered.length === 0) {
        return false
      }
      return this.selectableFiltered.every(function(app) {
        return self.selectedIds.includes(app.id)
      })
    },

    selectedApplications() {
      var self = this
      return this.activeApplications.filter(function(app) {
        return self.selectedIds.includes(app.id)
      })
    },

    selectedStatus() {
      var apps = this.selectedApplications
      if (apps.length === 0) {
        return null
      }
      var firstStatus = apps[0].status
      var allSame = apps.every(function(app) {
        return app.status === firstStatus
      })
      return allSame ? firstStatus : null
    },

    selectedPcicReady() {
      return this.selectedApplications.filter(function(app) {
        return app.status === 'approved_for_pcic'
      })
    },

    farmerOrgName() {
      return ''
    },

    pdfCropLabel() {
      var crops = this.pcicBatchList
        .map(function(app) { return app.farm?.crop_type })
        .filter(Boolean)
      var unique = Array.from(new Set(crops))
      if (unique.length === 0) return 'RICE / CORN'
      if (unique.length === 1) return unique[0].toUpperCase()
      return 'MIXED (' + unique.join(', ').toUpperCase() + ')'
    },

    pcicBatchPages() {
      var PAGE_SIZE = 15
      var list = this.pcicBatchList
      var chunks = []

      for (var i = 0; i < list.length; i += PAGE_SIZE) {
        chunks.push(list.slice(i, i + PAGE_SIZE))
      }
      if (chunks.length === 0) {
        chunks.push([])
      }

      return chunks.map(function(chunk) {
        var padded = chunk.slice()
        while (padded.length < PAGE_SIZE) {
          padded.push(null)
        }
        return padded
      })
    },
  },

  watch: {
    filtered() {
      var selectableIds = this.selectableFiltered.map(function(app) {
        return app.id
      })
      this.selectedIds = this.selectedIds.filter(function(id) {
        return selectableIds.includes(id)
      })
    },

    selectedIds: {
      handler() {
        this.hasDownloadedSelectedBatch = false
      },
      deep: true,
    },
  },

  mounted() {
    this.fetchCurrentSeason()
    this.startAutoRefresh()
  },

  beforeUnmount() {
    this.stopAutoRefresh()
  },

  methods: {
    authHeaders() {
      var token = localStorage.getItem('mao_token')
      return {
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/json',
        },
      }
    },

    // Historical application records may carry their season reference either
    // as a flat `insurance_season_id` field, a nested `season.id` relation,
    // or (less commonly) `season_id`. This checks all three shapes and
    // compares as strings so number/string API inconsistencies don't cause
    // false negatives.
    matchesSeasonId(app, seasonId) {
      var appSeasonId = app.insurance_season_id ?? app.season?.id ?? app.season_id
      if (appSeasonId === undefined || appSeasonId === null) {
        return false
      }
      return String(appSeasonId) === String(seasonId)
    },

    startAutoRefresh() {
      this.stopAutoRefresh()
      if (!this.autoRefresh) return
      var self = this
      this.refreshTimer = setInterval(function() {
        self.silentRefresh()
      }, this.refreshIntervalSeconds * 1000)
    },

    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },

    onToggleAutoRefresh() {
      if (this.autoRefresh) {
        this.startAutoRefresh()
      } else {
        this.stopAutoRefresh()
      }
    },

    async silentRefresh() {
      if (this.showSeasonModal || this.savingSeason) return
      if (this.batchProcessing) return
      if (this.isPrintingPcicBatch) return
      if (this.isRefreshing) return

      this.isRefreshing = true
      try {
        await this.refreshCurrentTab()
        this.lastRefreshedAt = new Date()
      } catch (err) {
        console.error('Auto-refresh failed', err)
      } finally {
        this.isRefreshing = false
      }
    },

    async manualRefresh() {
      if (this.isRefreshing) return
      this.isRefreshing = true
      try {
        await this.fetchSeasons()
        await this.refreshCurrentTab()
        this.lastRefreshedAt = new Date()
      } catch (err) {
        console.error('Manual refresh failed', err)
      } finally {
        this.isRefreshing = false
      }
    },

    formatTime(date) {
      if (!date) return ''
      return date.toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
      })
    },

    // submitted_to_pcic is now MAO's final system action: PCIC notifies the
    // farmer directly via SMS with the outcome, so MAO no longer needs (or
    // has) a manual "Insured" / "Rejected" step for these applications.
    isTerminal(status) {
      return status === 'submitted_to_pcic' || status === 'insured' || status === 'rejected'
    },

    // Locks the row checkbox while payment is unverified OR rejected. An
    // officer must open the row and resolve it via verifyPayment (which
    // moves payment_status to 'verified') before the application can be
    // added to a batch. A 'rejected' payment blocks selection permanently
    // until the farmer resubmits proof through a separate flow — this keeps
    // "Select All" and manual selection from ever picking up unresolved
    // rows in the first place, rather than only rejecting them once a bulk
    // action is attempted.
    isCheckboxDisabled(app) {
      if (app.payment_status === 'pending_verification' || app.payment_status === 'rejected') {
        return true
      }

      if (this.selectedIds.length === 0) {
        return false
      }
      if (this.isSelected(app.id)) {
        return false
      }
      return this.selectedStatus !== null && this.selectedStatus !== app.status
    },

    async fetchCurrentSeason() {
      try {
        var response = await axios.get(
          API_BASE + '/api/insurance-seasons/current',
          this.authHeaders()
        )
        this.currentSeason = response.data.season
        await this.fetchSeasons()

        if (this.currentSeason && !this.currentSeason.deadline_date) {
          this.seasonForm = {
            season_name: 'Wet Season ' + new Date().getFullYear(),
            deadline_date: '',
          }
          this.applications = []
        } else {
          await this.fetchApplications()
        }
      } catch (err) {
        this.currentSeason = null
        console.error('Failed to fetch current season', err)
      }
    },

    async fetchSeasons() {
      try {
        var response = await axios.get(
          API_BASE + '/api/insurance-seasons',
          this.authHeaders()
        )
        this.seasons = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
      } catch (err) {
        console.error('Failed to fetch seasons', err)
      }
    },

    async fetchApplications() {
      this.isLoading = true
      this.errorMessage = ''
      try {
        var response = await axios.get(
          API_BASE + '/api/insurance-applications',
          this.authHeaders()
        )
        var apps = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
        var currentId = this.currentSeason ? this.currentSeason.id : null

        this.applications = apps.filter(function(app) {
          return app.insurance_season_id == currentId
        })
      } catch (err) {
        this.errorMessage = 'Failed to load insurance applications.'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    async fetchApplicationHistory() {
      this.isLoading = true
      this.errorMessage = ''
      try {
        var response = await axios.get(
          API_BASE + '/api/insurance-applications-history',
          this.authHeaders()
        )
        this.historyApplications = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
      } catch (err) {
        this.errorMessage = 'Failed to fetch archived applications.'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    // NOTE: 'insured' and 'rejected' routes are retained here only for legacy
    // / historical data reference. They are no longer reachable from this UI
    // since submitted_to_pcic is now terminal for MAO officers — PCIC updates
    // the farmer directly and MAO's system record stops at submitted_to_pcic.
    routeForStatus(status) {
      var routeMap = {
        approved_for_pcic: 'approve-for-pcic',
        needs_revision: 'needs-revision',
        submitted_to_pcic: 'submit-pcic',
        insured: 'approve',
        rejected: 'reject',
      }
      return routeMap[status] || null
    },

    // Matches InsuranceApplicationController@verifyPayment /
    // InsuranceApplicationController@rejectPayment.
    //
    // verifyPayment only flips payment_status -> 'verified' on the backend;
    // it does NOT advance the application's status. Since the whole point of
    // this action (per the scenario) is "verify payment, then move the app
    // to 'To be submitted to PCIC'", we chain a second call to approve-for-pcic
    // right after a successful verification, but only when the application
    // is still sitting in a status that action makes sense for.
    async verifyPayment(appId) {
      if (!confirm('Verify this payment and move it to "To be submitted to PCIC"?')) {
        return
      }
      try {
        await axios.put(
          API_BASE + '/api/insurance-applications/' + appId + '/verify-payment',
          {},
          this.authHeaders()
        )

        var app = this.activeApplications.find(function(a) {
          return a.id === appId
        })
        if (app && (app.status === 'submitted_to_mao' || app.status === 'needs_revision')) {
          await axios.put(
            API_BASE + '/api/insurance-applications/' + appId + '/approve-for-pcic',
            {},
            this.authHeaders()
          )
        }

        await this.refreshCurrentTab()
      } catch (error) {
        console.error(error)
        alert(error.response?.data?.message || 'Failed to verify payment.')
      }
    },

    async rejectPayment(appId) {
      var remarks = prompt('Reason for rejecting this payment proof:')
      if (remarks === null) {
        return
      }
      try {
        await axios.put(
          API_BASE + '/api/insurance-applications/' + appId + '/reject-payment',
          { remarks: remarks },
          this.authHeaders()
        )
        await this.refreshCurrentTab()
      } catch (error) {
        console.error(error)
        alert(error.response?.data?.message || 'Failed to reject payment.')
      }
    },

    // Gates the PCIC-submission action: if a payment was required, it must
    // be verified first (per the backend's own verifyPayment message —
    // "Application may now proceed to PCIC"). Records with no payment_status
    // at all (legacy data) are allowed through.
    canSubmitToPcic(app) {
      return !app.payment_status
        || app.payment_status === 'verified'
        || app.payment_status === 'not_required'
    },

    async updateAppStatus(appId, status) {
      var action = this.routeForStatus(status)
      if (!action) {
        alert('Invalid status action.')
        return
      }
      try {
        await axios.put(
          API_BASE + '/api/insurance-applications/' + appId + '/' + action,
          {},
          this.authHeaders()
        )
        await this.refreshCurrentTab()
      } catch (error) {
        console.error(error)
        alert(error.response?.data?.message || 'Failed to update application status.')
      }
    },

    async bulkUpdateStatus(status) {
      if (this.selectedIds.length === 0) return
      if (this.batchProcessing) return

      var action = this.routeForStatus(status)
      if (!action) {
        alert('Invalid status action.')
        return
      }
      var count = this.selectedIds.length
      if (!confirm('Apply this action to ' + count + ' selected application(s)?')) {
        return
      }

      this.batchProcessing = true
      var idsToProcess = this.selectedIds.slice()
      var failedIds = []
      var self = this

      try {
        var results = await Promise.allSettled(
          idsToProcess.map(function(appId) {
            return axios.put(
              API_BASE + '/api/insurance-applications/' + appId + '/' + action,
              {},
              self.authHeaders()
            )
          })
        )

        results.forEach(function(result, i) {
          if (result.status === 'rejected') {
            failedIds.push(idsToProcess[i])
          }
        })

        await this.refreshCurrentTab()

        if (failedIds.length > 0) {
          alert(failedIds.length + ' application(s) failed. They remain selected.')
          this.selectedIds = failedIds
        } else {
          this.selectedIds = []
        }
      } catch (error) {
        console.error(error)
        alert('Failed to process batch update.')
      } finally {
        this.batchProcessing = false
      }
    },

    async refreshCurrentTab() {
      if (this.activeAppTab === 'history') {
        await this.fetchApplicationHistory()
      } else {
        await this.fetchApplications()
      }
    },

    // Fetches every unique signature image used in this batch as a base64
    // data URI, ahead of PDF generation. This exists because the live CDN
    // sitting in front of the API strips CORS headers on plain image
    // responses, which blocks html2canvas from reading the pixels needed
    // to draw the signature into the PDF (the image still displays fine as
    // a normal <img> on the page — CORS only matters for canvas reads).
    // Routing the same bytes through a JSON endpoint sidesteps that, since
    // JSON API responses already pass CORS correctly here.
async preloadSignatureImages(apps) {
  const uniquePaths = Array.from(
    new Set(apps.map((a) => a.signature_path).filter(Boolean))
  );

  const results = await Promise.allSettled(
    uniquePaths.map(async (path) => {
      const filename = path.split('/').pop();
      // Ensure it hits the /api/ route
      const res = await axios.get(`/api/storage/signatures/${filename}`);
      return { path, dataUrl: res.data.data };
    })
  );

  const map = {};
  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      map[r.value.path] = r.value.dataUrl;
    } else {
      console.error('Failed to preload signature image:', r.reason);
    }
  });

  this.signatureDataUrls = map;
},
    async downloadSelectedPcicBatch() {
      if (this.selectedPcicReady.length === 0) {
        alert('Select applications with "To be submitted to PCIC" status only.')
        return
      }
      this.pcicBatchList = this.selectedPcicReady

      this.isGeneratingPdf = true
      try {
        await this.preloadSignatureImages(this.pcicBatchList)
      } catch (err) {
        console.error('Failed to preload signature images', err)
      }

      this.generatePDF('PCIC_Selected_Batch.pdf')
    },

    async generatePDF(filename) {
      if (!this.pcicBatchList || this.pcicBatchList.length === 0) {
        alert('No applications found to export.')
        this.isGeneratingPdf = false
        return
      }

      this.isPrintingPcicBatch = true
      this.isGeneratingPdf = true

      await this.$nextTick()

      setTimeout(async () => {
        const element = document.getElementById('pdf-download-area')

        if (!element) {
          console.error('PDF element not found in DOM')
          this.isPrintingPcicBatch = false
          this.isGeneratingPdf = false
          return
        }

        const captureWidth = element.scrollWidth

        const opt = {
          margin: [5, 5, 5, 5],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: captureWidth,
            width: captureWidth,
            onclone: (clonedDoc) => {
              const wrapper = clonedDoc.getElementById('pdf-export-wrapper')
              if (wrapper) {
                wrapper.style.visibility = 'visible'
                wrapper.style.position = 'static'
              }
            },
          },
          // LEGAL LANDSCAPE FORMAT (8.5 x 14 in / 215.9 x 355.6 mm)
          jsPDF: { unit: 'mm', format: [215.9, 355.6], orientation: 'landscape' },
          pagebreak: { mode: ['css'], before: '.pdf-page-break' },
        }

        try {
          await html2pdf().set(opt).from(element).save()
          this.hasDownloadedSelectedBatch = true
        } catch (err) {
          console.error('PDF Generation Failed:', err)
          alert('Failed to generate PDF document.')
        } finally {
          this.isPrintingPcicBatch = false
          this.isGeneratingPdf = false
        }
      }, 100)
    },

    toggleSelection(id) {
      if (this.selectedIds.includes(id)) {
        this.selectedIds = this.selectedIds.filter(function(selectedId) {
          return selectedId !== id
        })
      } else {
        this.selectedIds.push(id)
      }
    },

    toggleSelectAllFiltered() {
      var self = this
      if (this.allFilteredSelected) {
        var selectableIds = this.selectableFiltered.map(function(app) {
          return app.id
        })
        this.selectedIds = this.selectedIds.filter(function(id) {
          return !selectableIds.includes(id)
        })
      } else {
        var targetStatus = this.selectedStatus
        this.selectableFiltered.forEach(function(app) {
          var matchesTarget = !targetStatus || app.status === targetStatus
          if (matchesTarget && !self.selectedIds.includes(app.id)) {
            self.selectedIds.push(app.id)
          }
        })
      }
    },

    isSelected(id) {
      return this.selectedIds.includes(id)
    },

    clearSelection() {
      this.selectedIds = []
    },

    switchTab(tab) {
      this.activeAppTab = tab
      this.expandedId = null
      this.clearSelection()
      this.resetFilters()
      if (tab === 'history') {
        this.fetchApplicationHistory()
      } else {
        this.fetchApplications()
      }
    },

    openNewSeasonModal() {
      this.seasonModalError = ''
      this.isStartingNewSeason = true
      this.showSeasonModal = true
      this.seasonForm = {
        season_name: 'Wet Season ' + new Date().getFullYear(),
        deadline_date: '',
      }
    },

    openSeasonModal() {
      this.seasonModalError = ''
      this.isStartingNewSeason = false
      this.showSeasonModal = true
      var dateStr = this.currentSeason && this.currentSeason.deadline_date
        ? this.currentSeason.deadline_date.slice(0, 10)
        : ''

      this.seasonForm = {
        season_name: this.currentSeason && this.currentSeason.season_name
          ? this.currentSeason.season_name
          : 'Wet Season ' + new Date().getFullYear(),
        deadline_date: dateStr,
      }
    },

    closeSeasonModal() {
      this.showSeasonModal = false
      this.seasonModalError = ''
    },

    async saveSeason() {
      if (!this.seasonForm.season_name.trim()) {
        this.seasonModalError = 'Please enter a season name.'
        return
      }
      if (!this.seasonForm.deadline_date) {
        this.seasonModalError = 'Please select a deadline date.'
        return
      }

      this.savingSeason = true
      this.seasonModalError = ''

      try {
        if (this.isStartingNewSeason) {
          await axios.post(
            API_BASE + '/api/insurance-seasons/new',
            {
              season_name: this.seasonForm.season_name,
              deadline_date: this.seasonForm.deadline_date,
            },
            this.authHeaders()
          )
        } else {
          await axios.put(
            API_BASE + '/api/insurance-seasons/current',
            {
              season_name: this.seasonForm.season_name,
              deadline_date: this.seasonForm.deadline_date,
              status: 'application_open',
            },
            this.authHeaders()
          )
        }
        await this.fetchCurrentSeason()
        this.showSeasonModal = false
      } catch (err) {
        this.seasonModalError = err.response?.data?.message || 'Failed to save season.'
      } finally {
        this.savingSeason = false
      }
    },

    async closeSeason() {
      if (!this.currentSeason) return
      if (!confirm('Close "' + this.currentSeason.season_name + '"?')) {
        return
      }
      try {
        await axios.post(
          API_BASE + '/api/insurance-seasons/current/close',
          {},
          this.authHeaders()
        )
        this.applications = []
        this.historyApplications = []
        await this.fetchCurrentSeason()
      } catch (err) {
        console.error(err)
        alert('Failed to close season.')
      }
    },

    toggleExpand(id) {
      this.expandedId = this.expandedId === id ? null : id
    },

    farmerName(app) {
      var user = app.farm?.farmer_profile?.user || null
      if (!user) return '—'
      return [
        user.first_name,
        user.middle_name,
        user.last_name,
        user.extension_name,
      ].filter(Boolean).join(' ')
    },

    truncateAddress(address) {
      if (!address) return '—'
      return address.split(',')[0].trim()
    },

    currentSeasonName(app) {
      var appSeasonId = app.insurance_season_id ?? app.season?.id
      var season = this.seasons.find(function(s) {
        return String(s.id) === String(appSeasonId)
      })
      return season ? season.season_name : '—'
    },

    statusLabel(status) {
      var map = {
        submitted_to_mao: 'Submitted to MAO',
        approved_for_pcic: 'To be submitted to PCIC',
        submitted_to_pcic: 'Forwarded to PCIC',
        needs_revision: 'Needs Revision',
        insured: 'Insured',
        rejected: 'Rejected',
      }
      return map[status] || status || '—'
    },

    pcicFormName(app) {
      var user = app?.farm?.farmer_profile?.user || null
      if (!user) return ''

      var firstInitials = (user.first_name || '')
        .split(' ')
        .filter(Boolean)
        .map(function(part) { return part.charAt(0).toUpperCase() + '.' })
        .join(' ')

      var middleInitial = user.middle_name
        ? user.middle_name.charAt(0).toUpperCase() + '.'
        : ''

      var parts = [firstInitials, middleInitial, user.last_name, user.extension_name]
        .filter(Boolean)

      return parts.join(' ')
    },

    genderLabel(sex) {
      if (!sex) return ''
      var s = sex.toString().trim().toLowerCase()
      if (s === 'male' || s === 'm') return 'M'
      if (s === 'female' || s === 'f') return 'F'
      return sex
    },

    assetUrl(path) {
      if (!path) return ''
      return API_BASE + '/api/storage/' + path
    },

    // NOTE: the backend's payment_status enum is
    // not_required | pending_verification | verified | rejected.
    paymentStatusLabel(status) {
      var map = {
        not_required: 'Not Required',
        pending_verification: 'Pending Verification',
        verified: 'Verified',
        rejected: 'Rejected',
      }
      return map[status] || status || '—'
    },

    formatCurrency(amount) {
      if (amount === null || amount === undefined || amount === '') return '—'
      var num = Number(amount)
      if (Number.isNaN(num)) return '—'
      return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },

    countByStatus(status) {
      return this.scopedApplications.filter(function(app) {
        return app.status === status
      }).length
    },

    formatDate(date) {
      if (!date) return '—'
      return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },

    resetFilters() {
      this.searchName = ''
      this.filterCrop = ''
      this.filterStatus = ''
      this.historySeasonId = ''
    },
  },
}
</script>

<style scoped>
* { box-sizing: border-box; }

/* ===================== SHELL ===================== */
.dashboard-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #F8FAF8;
}

.main-wrapper {
  flex: 1;
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-header {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #E7F0EC;
  flex-shrink: 0;
  z-index: 20;
  padding: 0 1.75rem;
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-group h1 { font-size: 18px; font-weight: 700; color: #0F212F; letter-spacing: -0.01em; }
.header-title-group p { font-size: 12px; color: #5c6b64; margin-top: 2px; }

.header-actions { display: flex; align-items: center; gap: 16px; }
.v-divider { height: 24px; width: 1px; background-color: #E7F0EC; }

.user-profile { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.user-avatar {
  width: 36px; height: 36px; border-radius: 12px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 12px;
  box-shadow: 0 0 0 2px rgba(17, 109, 62, 0.2);
}
.user-name { font-size: 12px; font-weight: 700; color: #0F212F; line-height: 1.2; }
.user-role { font-size: 10px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

.dashboard-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ===================== PANEL ===================== */
.panel {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  padding: 1.35rem 1.5rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* ===================== SEASON CARD ===================== */
.season-card {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.season-info { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }

.season-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; flex-shrink: 0;
  background: rgba(17, 109, 62, 0.1); color: #116D3E;
}

.season-text { display: flex; flex-direction: column; gap: 2px; }
.season-label { font-size: 0.7rem; font-weight: 600; color: #5c6b64; text-transform: uppercase; letter-spacing: 0.3px; }
.season-name { font-size: 0.9rem; font-weight: 700; color: #0F212F; }

.season-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* ===================== SETUP CARD ===================== */
.setup-card { align-items: flex-start; max-width: 520px; }
.setup-icon { font-size: 2rem; margin-bottom: 0.2rem; }
.setup-card h3 { font-size: 1rem; font-weight: 700; color: #0F212F; }
.setup-card p { font-size: 0.82rem; color: #5c6b64; }
.setup-form { display: flex; flex-direction: column; gap: 0.9rem; width: 100%; margin-top: 0.4rem; }

.modal-error {
  font-size: 0.78rem;
  color: #C1473D;
  background: rgba(193, 71, 61, 0.08);
  border-radius: 8px;
  padding: 8px 10px;
}

/* ===================== FORM FIELDS ===================== */
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 0.76rem; font-weight: 600; color: #5c6b64; }
.form-field input {
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
.form-field input:focus { border-color: #116D3E; }

/* ===================== MODAL ===================== */
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
  max-width: 440px;
  box-shadow: 0 24px 60px rgba(15, 33, 47, 0.25);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-head { display: flex; align-items: flex-start; justify-content: space-between; }
.modal-head h4 { font-size: 1.05rem; font-weight: 700; color: #0F212F; }
.modal-close {
  width: 30px; height: 30px; border-radius: 8px; border: none;
  background: #F1F6F2; color: #5c6b64; font-size: 1.1rem; line-height: 1; cursor: pointer;
}
.modal-close:hover { background: #E7F0EC; color: #0F212F; }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 0.6rem;
  border-top: 1px solid #F1F6F2;
}

/* ===================== SECTION DIVIDER ===================== */
.section-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #5c6b64;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.section-divider::before, .section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
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
  border: none; background: transparent; font-size: 0.8rem; font-weight: 600;
  color: #5c6b64; padding: 8px 16px; border-radius: 8px; cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.tab-btn.active { background: #FFFFFF; color: #0F212F; box-shadow: 0 2px 8px rgba(15, 33, 47, 0.08); }

/* ===================== REFRESH BAR ===================== */
.refresh-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid #F1F6F2;
}

.refresh-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #5c6b64;
  flex-wrap: wrap;
}

.refresh-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; flex-shrink: 0;
}
.refresh-dot.live { background: #116D3E; box-shadow: 0 0 0 3px rgba(17, 109, 62, 0.18); }

.refresh-last { color: #94a3b8; }

.refresh-controls { display: flex; align-items: center; gap: 12px; }

.btn-icon-refresh {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1.5px solid #E0EAE3; background: #FFFFFF; color: #5c6b64;
  font-size: 0.76rem; font-weight: 600; padding: 6px 12px; border-radius: 8px; cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.btn-icon-refresh:hover:not(:disabled) { border-color: #116D3E; color: #116D3E; }
.btn-icon-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
.refresh-glyph { display: inline-block; }
.refresh-glyph.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.toggle-switch { position: relative; display: inline-block; width: 38px; height: 22px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute; cursor: pointer; inset: 0;
  background: #E0EAE3; border-radius: 999px; transition: background 0.15s ease;
}
.toggle-slider::before {
  content: ''; position: absolute; height: 16px; width: 16px; left: 3px; top: 3px;
  background: #FFFFFF; border-radius: 50%; transition: transform 0.15s ease;
  box-shadow: 0 1px 3px rgba(15, 33, 47, 0.2);
}
.toggle-switch input:checked + .toggle-slider { background: #116D3E; }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(16px); }

/* ===================== FILTERS ===================== */
.filters-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-wrap { position: relative; flex: 1; min-width: 220px; }
.search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.search-input, .filter-select {
  width: 100%; border: 1.5px solid #E0EAE3; border-radius: 9px; padding: 8px 12px;
  font-size: 0.8rem; color: #0F212F; background: #FFFFFF; outline: none;
  transition: border-color 0.15s ease;
}
.search-input { padding-left: 32px; }
.search-input:focus, .filter-select:focus { border-color: #116D3E; }
.filter-select { width: auto; min-width: 150px; cursor: pointer; }

/* ===================== STATUS FILTER PILLS ===================== */
.status-filter-row { display: flex; flex-wrap: wrap; gap: 6px; }
.status-filter-tag {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1.5px solid #E0EAE3; background: #FFFFFF; color: #5c6b64;
  font-size: 0.76rem; font-weight: 600; padding: 7px 13px; border-radius: 999px; cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}
.status-filter-tag:hover { border-color: #C7DECF; }
.status-filter-tag.active { border-color: transparent; color: #FFFFFF; }
.status-filter-tag.sf-all.active { background: linear-gradient(135deg, #0F212F, #0A5232); }
.status-filter-tag.sf-submitted_to_mao.active { background: linear-gradient(135deg, #2E6F8E, #1B4A5F); }
.status-filter-tag.sf-approved_for_pcic.active { background: linear-gradient(135deg, #D29539, #AC7A2F); }
.status-filter-tag.sf-submitted_to_pcic.active { background: linear-gradient(135deg, #6B5B95, #4E4270); }
.sf-count { font-size: 0.68rem; font-weight: 700; opacity: 0.85; }

/* ===================== METRICS ===================== */
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.metric-card {
  background: #F8FAF8; border: 1px solid #EAF1EC; border-radius: 14px; padding: 1rem 1.15rem;
}
.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.6rem; }
.card-label { font-size: 0.74rem; font-weight: 600; color: #5c6b64; }
.icon-badge { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
.icon-badge svg { width: 15px; height: 15px; }
.icon-badge.blue   { background: rgba(46, 111, 142, 0.12); color: #2E6F8E; }
.icon-badge.amber  { background: rgba(210, 149, 57, 0.16); color: #AC7A2F; }
.icon-badge.teal   { background: rgba(14, 138, 125, 0.12); color: #0E8A7D; }
.icon-badge.purple { background: rgba(107, 91, 149, 0.12); color: #6B5B95; }
.card-value { font-size: 1.4rem; font-weight: 700; color: #0F212F; }

/* ===================== BUTTONS ===================== */
.btn-outline {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  background: #FFFFFF; color: #0F212F; border: 1.5px solid #E0EAE3; border-radius: 9px;
  font-size: 0.8rem; font-weight: 600; cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.btn-outline:hover { border-color: #116D3E; background: #F1F6F2; }
.btn-outline:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  background: linear-gradient(135deg, #116D3E, #0A5232); color: #FFFFFF; border: none; border-radius: 9px;
  font-size: 0.82rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.28);
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

.btn-danger {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  background: linear-gradient(135deg, #C1473D, #922E26); color: #FFFFFF; border: none; border-radius: 9px;
  font-size: 0.82rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 8px 18px rgba(193, 71, 61, 0.28);
}

.btn-block { width: 100%; padding: 11px; }
.btn-compact { padding: 9px 15px; }

.link-btn-muted {
  background: none; border: none; color: #5c6b64; font-size: 0.76rem; font-weight: 600; cursor: pointer;
}
.link-btn-muted:hover { color: #116D3E; }

/* ===================== STATES ===================== */
.state-box {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 2.5rem; color: #5c6b64; font-size: 0.85rem;
}
.error-box { color: #C1473D; }
.spinner {
  width: 18px; height: 18px; border: 2.5px solid #E0EAE3; border-top-color: #116D3E;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
.empty-state { text-align: center; padding: 2.5rem; color: #5c6b64; font-size: 0.85rem; }

/* ===================== TABLE ===================== */
.table-responsive { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table thead th {
  text-align: left; font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #5c6b64; padding: 8px 10px; background: #F1F6F2; white-space: nowrap;
}
.data-table tbody td { font-size: 0.8rem; color: #0F212F; padding: 10px; border-bottom: 1px solid #F1F6F2; }
.font-bold { font-weight: 700; }

.main-row { cursor: pointer; transition: background 0.15s ease; }
.main-row:hover { background: #F8FAF8; }
.main-row.selected { background: rgba(17, 109, 62, 0.06); }

.expand-cell { width: 22px; }
.expand-icon { display: inline-block; font-size: 0.6rem; color: #94a3b8; transition: transform 0.15s ease; }
.expand-icon.open { transform: rotate(90deg); color: #116D3E; }

.farmer-sub { font-size: 0.7rem; color: #5c6b64; margin-top: 2px; }

/* ===================== STATUS BADGES ===================== */
.status-badge {
  display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px;
  font-size: 0.68rem; font-weight: 700; white-space: nowrap;
}
.status-badge.submitted_to_mao   { background: rgba(46, 111, 142, 0.1);  color: #2E6F8E; }
.status-badge.approved_for_pcic  { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.status-badge.submitted_to_pcic  { background: rgba(107, 91, 149, 0.1);  color: #6B5B95; }
.status-badge.needs_revision     { background: rgba(193, 71, 61, 0.1);   color: #C1473D; }
.status-badge.insured            { background: rgba(17, 109, 62, 0.1);   color: #116D3E; }
.status-badge.rejected           { background: rgba(193, 71, 61, 0.1);   color: #C1473D; }

/* ===================== DETAIL ROW ===================== */
.detail-row td { padding: 0; border-bottom: 1px solid #F1F6F2; }
.detail-box { background: #F8FAF8; padding: 1.3rem; display: flex; flex-direction: column; gap: 1.1rem; }

.action-panel {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: #FFFFFF; border: 1px solid #EAF1EC; border-radius: 12px; padding: 10px 14px;
}
.action-panel-label { font-size: 0.76rem; font-weight: 700; color: #0F212F; }

.action-hint { font-size: 0.78rem; color: #5c6b64; }
.action-hint.amber { color: #AC7A2F; }
.action-hint.red { color: #C1473D; }
.action-hint.blue { color: #2E6F8E; }
.action-hint.green { color: #116D3E; }

.info-section { display: flex; flex-direction: column; gap: 1.1rem; }
.section-title { font-size: 0.82rem; font-weight: 700; color: #0F212F; margin-bottom: 0.6rem; }

.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.7rem; }
.summary-card { background: #FFFFFF; border: 1px solid #EAF1EC; border-radius: 12px; padding: 0.75rem 0.9rem; }
.summary-card.col-span-full { grid-column: 1 / -1; }
.summary-label { font-size: 0.66rem; color: #5c6b64; margin-bottom: 4px; }
.summary-value { font-size: 0.8rem; font-weight: 600; }
.summary-value.coords { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.72rem; }
.text-dark { color: #0F212F; }

.payment-validation-actions { display: flex; gap: 8px; margin-top: 6px; }

.detail-link { font-size: 0.78rem; font-weight: 600; color: #116D3E; text-decoration: none; }
.detail-link:hover { text-decoration: underline; }

.documents-row { display: flex; gap: 1rem; flex-wrap: wrap; }
.document-tile {
  display: flex; flex-direction: column; gap: 8px; background: #FFFFFF;
  border: 1px solid #EAF1EC; border-radius: 12px; padding: 0.9rem; min-width: 200px;
}
.document-tile .detail-label { font-size: 0.68rem; color: #5c6b64; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
.signature-img, .farm-photo-img { max-width: 220px; border-radius: 8px; border: 1px solid #EAF1EC; }

/* ===================== FLOATING BULK BAR ===================== */
.bulk-action-bar.floating {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  background: #0F212F; color: #FFFFFF; border-radius: 14px; padding: 12px 18px;
  box-shadow: 0 16px 36px rgba(15, 33, 47, 0.3); z-index: 30; max-width: 92vw;
}
.bulk-action-bar.floating.mixed { background: #7a3a1f; }
.bulk-left { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; }
.bulk-warning { font-size: 0.78rem; color: #FCE4CC; }
.bulk-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.bulk-terminal-note { font-size: 0.72rem; color: rgba(255, 255, 255, 0.7); }

.float-bar-enter-active, .float-bar-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.float-bar-enter-from, .float-bar-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }

/* ===================== PDF EXPORT (official document look) ===================== */
/* This block is intentionally NOT themed like the rest of the app — it's the
   actual printed PCIC form layout, captured by html2canvas, so it mimics a
   real government document: black text, ruled tables, serif headings. */
.pdf-export-wrapper {
  position: fixed;
  top: 0;
  left: -99999px;
  visibility: hidden;
  background: #FFFFFF;
  z-index: -1;
}

.pdf-export-container {
  background: #FFFFFF;
  color: #000000;
  font-family: Georgia, 'Times New Roman', serif;
  width: 1344px; /* ~355.6mm at 96dpi scale used for capture */
  padding: 24px;
}

.pcic-page-container { padding-bottom: 16px; }
.pdf-page-break { page-break-before: always; }

.pcic-official-header { border-bottom: 2px solid #000; margin-bottom: 10px; padding-bottom: 8px; }
.pcic-header-top { display: flex; align-items: center; gap: 16px; }
.pcic-logo-placeholder {
  width: 64px; height: 64px; border: 1px solid #000; border-radius: 50%; flex-shrink: 0;
}
.pcic-title-box { flex: 1; text-align: center; }
.pcic-republic { font-size: 12px; }
.pcic-corp-name { font-size: 16px; font-weight: 700; letter-spacing: 0.5px; }
.pcic-dept { font-size: 11px; }
.pcic-form-title { font-size: 13px; font-weight: 700; margin-top: 4px; text-decoration: underline; }
.pcic-form-code { font-size: 11px; font-weight: 700; white-space: nowrap; }

.pcic-meta-table { margin-top: 8px; font-size: 11px; }
.meta-row { display: flex; gap: 12px; border-top: 1px solid #000; padding: 3px 0; }
.meta-row:first-child { border-top: none; }
.meta-cell.flex-1 { flex: 1; }
.meta-cell.flex-2 { flex: 2; }

.pcic-official-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 6px; }
.pcic-official-table th, .pcic-official-table td {
  border: 1px solid #000; padding: 4px 5px; vertical-align: middle;
}
.pcic-official-table th { background: #EDEDED; font-weight: 700; text-align: center; font-size: 9.5px; }
.pcic-data-row td { height: 26px; }

.text-center { text-align: center; }
.text-right { text-align: right; }
.bold { font-weight: 700; }
.font-mono { font-family: 'Courier New', monospace; }

.pcic-footer-block { margin-top: 14px; }
.pcic-cert-text { font-size: 10px; font-style: italic; margin-bottom: 18px; }
.pcic-sig-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; }
.sig-box { text-align: center; }
.sig-line { border-top: 1px solid #000; margin-bottom: 4px; }
.sig-title { font-size: 10px; }

.signature-cell { width: 90px; }
.pdf-signature-img { max-width: 80px; max-height: 34px; object-fit: contain; }

/* ===================== RESPONSIVE ===================== */
@media (max-width: 1300px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .metrics-grid { grid-template-columns: 1fr; }
  .summary-grid { grid-template-columns: 1fr; }
  .season-card { flex-direction: column; align-items: flex-start; }
}
</style>