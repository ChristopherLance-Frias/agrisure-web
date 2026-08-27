<template>
  <div class="insurance-page">
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

    <!-- Active Season Display Window -->
    <div v-if="hasConfiguredSeason" class="season-card no-print">
      <div class="season-info">
        <div class="season-icon open">⏱</div>

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
        <button class="btn-season-secondary" @click="openSeasonModal">Season Settings</button>
        <button v-if="currentSeason.status === 'application_open'" class="btn-season-danger" @click="closeSeason">Close Season</button>
        <button v-else class="btn-season-primary" @click="openNewSeasonModal">Start New Season</button>
      </div>
    </div>

    <!-- Setup Prompt Card fallback -->
    <div v-else class="setup-card no-print">
      <div class="setup-icon">📅</div>
      <h3>Season Setup Required</h3>
      <p>Configure the current active insurance window to start processing applications.</p>

      <div class="setup-form">
        <div class="modal-field">
          <label>Season Name</label>
          <input
            v-model="seasonForm.season_name"
            type="text"
            class="modal-input"
            placeholder="Example: Wet Season 2026"
          />
        </div>

        <div class="modal-field">
          <label>Application Deadline</label>
          <input v-model="seasonForm.deadline_date" type="date" class="modal-input" />
        </div>

        <p v-if="seasonModalError" class="modal-error">{{ seasonModalError }}</p>

        <button class="btn-season-primary" @click="saveSeason" :disabled="savingSeason">
          {{ savingSeason ? 'Saving...' : 'Save and Show Applications' }}
        </button>
      </div>
    </div>

    <!-- Settings Modification Modal Popup -->
    <div v-if="showSeasonModal" class="modal-overlay no-print" @click.self="closeSeasonModal">
      <div class="modal-box">
        <h3 class="modal-title">{{ isStartingNewSeason ? 'Start New Season' : 'Season Settings' }}</h3>

        <div class="modal-field">
          <label>Season Name</label>
          <input v-model="seasonForm.season_name" type="text" class="modal-input" />
        </div>

        <div class="modal-field">
          <label>Application Deadline</label>
          <input v-model="seasonForm.deadline_date" type="date" class="modal-input" />
        </div>

        <p v-if="seasonModalError" class="modal-error">{{ seasonModalError }}</p>

        <div class="modal-actions">
          <button class="btn-modal-cancel" @click="closeSeasonModal" :disabled="savingSeason">
            Cancel
          </button>

          <button class="btn-modal-save" @click="saveSeason" :disabled="savingSeason">
            {{ savingSeason ? 'Saving...' : (isStartingNewSeason ? 'Create Season' : 'Save Changes') }}
          </button>
        </div>
      </div>
    </div>

    <div class="section-divider no-print">
      <span>Applications Matrix</span>
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

    <div class="refresh-bar no-print">
      <div class="refresh-status">
        <span class="refresh-dot" :class="{ live: autoRefresh }"></span>
        <span v-if="autoRefresh">Auto-refresh on · every {{ refreshIntervalSeconds }}s</span>
        <span v-else>Auto-refresh off</span>
        <span v-if="lastRefreshedAt" class="refresh-last">· Last updated {{ formatTime(lastRefreshedAt) }}</span>
      </div>

      <div class="refresh-controls">
        <button
          class="btn-icon-refresh"
          @click="manualRefresh"
          :disabled="isLoading || isRefreshing"
          title="Refresh now"
        >
          <span :class="{ spinning: isRefreshing }">⟳</span> Refresh
        </button>

        <label class="toggle-switch">
          <input type="checkbox" v-model="autoRefresh" @change="onToggleAutoRefresh" />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="filters-row no-print">
      <div class="search-wrap">
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

      <button class="btn-reset" @click="resetFilters">Reset Filters</button>
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
            <button class="btn-action-approve" @click="bulkUpdateStatus('approved_for_pcic')">
              Mark {{ selectedIds.length }} as To be Submitted to PCIC
            </button>
          </template>

          <template v-if="selectedStatus === 'approved_for_pcic'">
            <button
              class="btn-action-submit-pcic"
              @click="bulkUpdateStatus('submitted_to_pcic')"
              :disabled="!hasDownloadedSelectedBatch"
              :title="!hasDownloadedSelectedBatch ? 'Download the batch PDF for this selection first' : ''"
            >
              Mark {{ selectedIds.length }} as Forwarded to PCIC
            </button>

            <button
              class="btn-print-pcic"
              @click="downloadSelectedPcicBatch"
              :disabled="isGeneratingPdf"
            >
              📥 {{ isGeneratingPdf ? 'Generating...' : 'Download Selected Batch PDF (' + selectedIds.length + ')' }}
            </button>

            <span v-if="!hasDownloadedSelectedBatch" class="bulk-terminal-note">
              Download the batch PDF before forwarding to PCIC.
            </span>
          </template>

          <template v-if="selectedStatus === 'submitted_to_pcic' || selectedStatus === 'insured' || selectedStatus === 'rejected'">
            <span class="bulk-terminal-note">No further action available for this status.</span>
          </template>
        </div>

        <button class="btn-reset" @click="clearSelection">Clear</button>
      </div>
    </transition>

    <div class="stats-row no-print">
      <div class="stat-card">
        <span class="stat-label">Total</span>
        <span class="stat-value">{{ scopedApplications.length }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Pending MAO</span>
        <span class="stat-value mao">{{ countByStatus('submitted_to_mao') }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Ready for PCIC</span>
        <span class="stat-value pcic">{{ countByStatus('approved_for_pcic') }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Forwarded to PCIC</span>
        <span class="stat-value review">{{ countByStatus('submitted_to_pcic') }}</span>
      </div>
    </div>

    <div v-if="isLoading" class="state-box no-print">
      <div class="spinner"></div>
      <span>Fetching applications registry...</span>
    </div>

    <div v-else-if="errorMessage" class="state-box error-box no-print">
      <span>{{ errorMessage }}</span>
    </div>

    <div v-else class="table-wrap no-print">
      <div v-if="filtered.length === 0" class="empty-state">
        No application records correspond to your filter parameters.
      </div>

      <table v-else class="app-table">
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
                <div class="farmer-name">{{ farmerName(app) }}</div>
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
                  <div class="detail-actions-panel">
                    <div class="action-sub-group">
                      <span class="action-panel-label">
                        <strong>Available Action:</strong>
                      </span>

                      <template v-if="app.status === 'submitted_to_mao' || app.status === 'needs_revision'">
                        <button
                          v-if="app.payment_status !== 'pending_verification' && app.payment_status !== 'rejected'"
                          class="btn-action-approve"
                          @click="updateAppStatus(app.id, 'approved_for_pcic')"
                        >
                          Mark as To be Submitted to PCIC
                        </button>

                        <span v-else-if="app.payment_status === 'pending_verification'" class="action-hint">
                          ⏳ Payment verification required before this can move to PCIC. Verify the
                          payment below — it will automatically advance to "To be submitted to PCIC".
                        </span>

                        <span v-else-if="app.payment_status === 'rejected'" class="action-hint">
                          ❌ Payment proof was rejected. This application cannot proceed to PCIC
                          until the farmer resubmits valid payment proof.
                        </span>
                      </template>

                      <template v-if="app.status === 'approved_for_pcic'">
                        <span class="action-hint">
                          ℹ️ PCIC requires batch transmittal. Select this application's checkbox
                          (and any others ready for PCIC) to forward it.
                        </span>
                      </template>

                      <template v-if="app.status === 'submitted_to_pcic'">
                        <span class="action-hint">
                          ✅ Forwarded to PCIC. PCIC will contact the farmer directly via SMS with
                          the outcome of their application — no further action is needed from MAO.
                        </span>
                      </template>

                      <template v-if="app.status === 'insured' || app.status === 'rejected'">
                        <span class="action-hint">This application has reached a final status.</span>
                      </template>
                    </div>
                  </div>

                  <div class="detail-grid-wrapper">
                    <div class="detail-section">
                      <div class="section-title">Personal Information</div>

                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Full Name</span>
                          <span class="detail-val">{{ farmerName(app) }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Civil Status</span>
                          <span class="detail-val">{{ app.civil_status || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Beneficiary</span>
                          <span class="detail-val">{{ app.beneficiary_name || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Spouse Name</span>
                          <span class="detail-val">{{ app.spouse_name || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Parent / Guardian</span>
                          <span class="detail-val">{{ app.parent_guardian_name || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Phone</span>
                          <span class="detail-val">{{ app.farm?.farmer_profile?.user?.phone_number || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Email</span>
                          <span class="detail-val">{{ app.farm?.farmer_profile?.email_or_phone || app.farm?.farmer_profile?.user?.email || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">RSBSA Reference</span>
                          <span class="detail-val">{{ app.farm?.farmer_profile?.rsbsa_reference || ' ' }}</span>
                        </div>

                        <div class="detail-item full-width">
                          <span class="detail-label">Address</span>
                          <span class="detail-val">{{ app.farm?.farmer_profile?.address || ' ' }}</span>
                        </div>

                        <div class="detail-item full-width" v-if="app.remarks">
                          <span class="detail-label">Remarks</span>
                          <span class="detail-val">{{ app.remarks }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="detail-section">
                      <div class="section-title">Crop Information</div>

                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Crop Type</span>
                          <span class="detail-val">{{ app.farm?.crop_type || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Variety</span>
                          <span class="detail-val">{{ app.variety || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Farm Type</span>
                          <span class="detail-val">{{ app.farm_type || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Area Size</span>
                          <span class="detail-val">{{ app.farm?.farm_area ? app.farm.farm_area + ' ha' : ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Sowing Date</span>
                          <span class="detail-val">{{ formatDate(app.sowing_date) }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Transplanting</span>
                          <span class="detail-val">{{ formatDate(app.transplanting_date) }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Farm Location</span>
                          <span class="detail-val">{{ app.farm_location || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Land Category</span>
                          <span class="detail-val">{{ app.land_category || ' ' }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="detail-section">
                      <div class="section-title">Land Boundaries & Tenure</div>

                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">North</span>
                          <span class="detail-val">{{ app.north_boundary || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">East</span>
                          <span class="detail-val">{{ app.east_boundary || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">West</span>
                          <span class="detail-val">{{ app.west_boundary || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">South</span>
                          <span class="detail-val">{{ app.south_boundary || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Land Owner</span>
                          <span class="detail-val">{{ app.is_land_owner ? 'Yes' : 'No' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Tenure Status</span>
                          <span class="detail-val">{{ app.tenure_status || ' ' }}</span>
                        </div>

                        <div class="detail-item full-width" v-if="app.farm?.latitude && app.farm?.longitude">
                          <span class="detail-label">Farm Coordinates</span>
                          <span class="detail-val">{{ app.farm.latitude }}, {{ app.farm.longitude }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="detail-section">
                      <div class="section-title">Coverage &amp; Payment</div>

                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Insured Area</span>
                          <span class="detail-val">{{ app.insured_area ? app.insured_area + ' ha' : ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Covered Free Area</span>
                          <span class="detail-val">{{ app.covered_free_area ? app.covered_free_area + ' ha' : ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Excess Area</span>
                          <span class="detail-val">{{ app.excess_area ? app.excess_area + ' ha' : ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Free Coverage Before</span>
                          <span class="detail-val">{{ app.free_coverage_before ? app.free_coverage_before + ' ha' : ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Free Coverage After</span>
                          <span class="detail-val">{{ app.free_coverage_after ? app.free_coverage_after + ' ha' : ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Premium Amount</span>
                          <span class="detail-val">{{ formatCurrency(app.premium_amount) }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Payment Status</span>
                          <span class="detail-val">{{ paymentStatusLabel(app.payment_status) }}</span>
                        </div>

                        <div class="detail-item full-width" v-if="app.payment_method && app.payment_status === 'pending_verification'">
                          <span class="detail-label">Payment Validation</span>
                          <div class="payment-validation-actions">
                            <button class="btn-action-approve" @click="verifyPayment(app.id)">
                              Confirm Paid
                            </button>
                            <button class="btn-action-reject" @click="rejectPayment(app.id)">
                              Mark Failed
                            </button>
                          </div>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Payment Method</span>
                          <span class="detail-val">{{ app.payment_method || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">GCash Reference #</span>
                          <span class="detail-val">{{ app.gcash_reference_number || ' ' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Payment Submitted</span>
                          <span class="detail-val">{{ app.payment_submitted_at ? formatDate(app.payment_submitted_at) : ' ' }}</span>
                        </div>

                        <div class="detail-item full-width" v-if="app.payment_proof_path">
                          <span class="detail-label">Payment Proof</span>
                          <img
                            v-if="fileDataUrls[app.payment_proof_path]"
                            :src="fileDataUrls[app.payment_proof_path]"
                            alt="Payment proof"
                            class="payment-proof-img"
                          />
                          <span v-else class="detail-val">Loading…</span>
                        </div>
                      </div>
                    </div>

                    <div class="detail-section">
                      <div class="section-title">Documents</div>

                      <div class="documents-row">
                        <div class="document-tile">
                          <span class="detail-label">Farmer's Signature</span>
                          <img
                            v-if="app.signature_path && fileDataUrls[app.signature_path]"
                            :src="fileDataUrls[app.signature_path]"
                            alt="Farmer signature"
                            class="signature-img"
                          />
                          <span v-else-if="app.signature_path" class="detail-val">Loading…</span>
                          <span v-else class="detail-val">—</span>
                        </div>

                        <div class="document-tile">
                          <span class="detail-label">Farm Photo</span>
                          <img
                            v-if="app.farm?.farm_image_path && fileDataUrls[app.farm.farm_image_path]"
                            :src="fileDataUrls[app.farm.farm_image_path]"
                            alt="Farm photo"
                            class="farm-photo-img"
                          />
                          <span v-else-if="app.farm?.farm_image_path" class="detail-val">Loading…</span>
                          <span v-else class="detail-val">—</span>
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
                  <div class="pcic-form-title">FARM LOCATION & BOUNDARY SCHEDULE (PAGE 2)</div>
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
                      v-if="app?.signature_path && fileDataUrls[app.signature_path]"
                      :src="fileDataUrls[app.signature_path]"
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

      fileDataUrls: {},

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

    isTerminal(status) {
      return status === 'submitted_to_pcic' || status === 'insured' || status === 'rejected'
    },

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

    async verifyPayment(appId) {
      if (!confirm('Verify this payment and move it to "To be submitted to PCIC"?')) {
        return
      }
      try {
        await axios.post(
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

    async loadFile(path) {
      if (!path) {
        return ''
      }
      if (this.fileDataUrls[path]) {
        return this.fileDataUrls[path]
      }
      try {
        var config = this.authHeaders()
        config.params = { path: path }
        var response = await axios.get(API_BASE + '/api/storage/file', config)
        this.fileDataUrls[path] = response.data.data
        return response.data.data
      } catch (err) {
        console.error('Failed to load file: ' + path, err)
        return ''
      }
    },

    async preloadSignatureImages(apps) {
      var uniquePaths = Array.from(
        new Set(apps.map(function(a) { return a.signature_path }).filter(Boolean))
      )
      var self = this

      await Promise.allSettled(
        uniquePaths.map(function(path) {
          return self.loadFile(path)
        })
      )
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

      if (this.expandedId) {
        var app = this.activeApplications.find(function(a) {
          return a.id === id
        })
        if (app) {
          if (app.signature_path) {
            this.loadFile(app.signature_path)
          }
          if (app.farm && app.farm.farm_image_path) {
            this.loadFile(app.farm.farm_image_path)
          }
          if (app.payment_proof_path) {
            this.loadFile(app.payment_proof_path)
          }
        }
      }
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

/* ===================== PAGE SHELL ===================== */
.insurance-page {
  min-height: 100vh;
  background: #F8FAF8;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding: 0 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* ===================== TOP HEADER ===================== */
.top-header {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #E7F0EC;
  margin: 0 -1.75rem;
  padding: 0 1.75rem;
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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

/* ===================== SEASON CARD ===================== */
.season-card {
  background: linear-gradient(150deg, #116D3E 0%, #0A5232 100%);
  border-radius: 16px;
  padding: 1.3rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  color: #FFFFFF;
  box-shadow: 0 12px 26px rgba(17, 109, 62, 0.22);
}

.season-info { display: flex; align-items: center; gap: 1.75rem; flex-wrap: wrap; }

.season-icon {
  width: 42px; height: 42px; border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; flex-shrink: 0;
}

.season-text { display: flex; flex-direction: column; gap: 3px; }
.season-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255, 255, 255, 0.65); }
.season-name { font-size: 1rem; font-weight: 700; }

.season-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.btn-season-primary, .btn-season-secondary, .btn-season-danger {
  padding: 9px 16px;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  border: none;
}

.btn-season-primary { background: #FFFFFF; color: #116D3E; }
.btn-season-primary:hover { background: #F1F6F2; }

.btn-season-secondary { background: rgba(255, 255, 255, 0.14); color: #FFFFFF; }
.btn-season-secondary:hover { background: rgba(255, 255, 255, 0.24); }

.btn-season-danger { background: rgba(193, 71, 61, 0.18); color: #FFD9D5; }
.btn-season-danger:hover { background: rgba(193, 71, 61, 0.3); }

/* ===================== SETUP CARD (fallback) ===================== */
.setup-card {
  background: #FFFFFF;
  border: 1px dashed #D7E2D8;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.setup-icon { font-size: 2rem; margin-bottom: 4px; }
.setup-card h3 { font-size: 1rem; font-weight: 700; color: #0F212F; }
.setup-card p { font-size: 0.82rem; color: #5c6b64; max-width: 420px; }

.setup-form {
  margin-top: 1rem;
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

/* ===================== MODAL FIELDS (shared: setup + settings modal) ===================== */
.modal-field { display: flex; flex-direction: column; gap: 6px; }
.modal-field label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #5c6b64; }

.modal-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.84rem;
  color: #0F212F;
  background: #FFFFFF;
  font-family: inherit;
  transition: border-color 0.15s ease;
}
.modal-input:focus { outline: none; border-color: #116D3E; }

.modal-error {
  font-size: 0.78rem;
  color: #C1473D;
  font-weight: 600;
}

/* ===================== SETTINGS MODAL ===================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(15, 33, 47, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-box {
  width: 100%;
  max-width: 400px;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 24px 60px rgba(15, 33, 47, 0.3);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-title { font-size: 1rem; font-weight: 700; color: #0F212F; }

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.btn-modal-cancel {
  padding: 9px 16px;
  background: #FFFFFF;
  color: #0F212F;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-modal-cancel:hover { background: #F1F6F2; }

.btn-modal-save {
  padding: 9px 16px;
  background: linear-gradient(135deg, #116D3E, #0A5232);
  color: #FFFFFF;
  border: none;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(17, 109, 62, 0.28);
}
.btn-modal-save:disabled, .btn-modal-cancel:disabled { opacity: 0.6; cursor: not-allowed; }

/* ===================== SECTION DIVIDER ===================== */
.section-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 0.4rem;
}
.section-divider::before, .section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #E0EAE3;
}
.section-divider span {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #5c6b64;
  white-space: nowrap;
}

/* ===================== TABS ===================== */
.tab-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #F1F6F2;
  border: 1px solid #E0EAE3;
  border-radius: 10px;
  padding: 3px;
  width: fit-content;
}

.tab-btn {
  border: none;
  background: transparent;
  color: #5c6b64;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
}
.tab-btn:hover { color: #0F212F; }
.tab-btn.active { background: #FFFFFF; color: #116D3E; box-shadow: 0 2px 6px rgba(15, 33, 47, 0.08); }

/* ===================== REFRESH BAR ===================== */
.refresh-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 0.7rem 1rem;
  flex-wrap: wrap;
}

.refresh-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #5c6b64;
  flex-wrap: wrap;
}

.refresh-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  flex-shrink: 0;
}
.refresh-dot.live {
  background: #116D3E;
  box-shadow: 0 0 0 3px rgba(17, 109, 62, 0.15);
}

.refresh-last { color: #94a3b8; }

.refresh-controls { display: flex; align-items: center; gap: 12px; }

.btn-icon-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: #F1F6F2;
  border: 1px solid #E0EAE3;
  color: #116D3E;
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
}
.btn-icon-refresh:hover { background: #E7F0EC; }
.btn-icon-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-icon-refresh .spinning {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.toggle-switch {
  position: relative;
  display: inline-flex;
  width: 38px;
  height: 22px;
  cursor: pointer;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute;
  inset: 0;
  background: #E0EAE3;
  border-radius: 999px;
  transition: background 0.2s ease;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 3px;
  top: 3px;
  background: #FFFFFF;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(15, 33, 47, 0.25);
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

.search-wrap { flex: 1; min-width: 220px; }

.search-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.82rem;
  color: #0F212F;
  background: #FFFFFF;
  transition: border-color 0.15s ease;
}
.search-input:focus { outline: none; border-color: #116D3E; }

.filter-select {
  padding: 9px 30px 9px 12px;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #0F212F;
  background: #FFFFFF url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235c6b64' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>") no-repeat right 10px center;
  background-size: 12px;
  appearance: none;
  cursor: pointer;
}
.filter-select:focus { outline: none; border-color: #116D3E; }

.btn-reset {
  padding: 9px 16px;
  background: #FFFFFF;
  color: #0F212F;
  border: 1.5px solid #E0EAE3;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.btn-reset:hover { border-color: #116D3E; background: #F1F6F2; }

/* ===================== STATUS FILTER ROW ===================== */
.status-filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.status-filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 13px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid #E0EAE3;
  background: #FFFFFF;
  color: #5c6b64;
  transition: all 0.15s ease;
}
.status-filter-tag:hover { border-color: #116D3E; color: #0F212F; }

.status-filter-tag.active { color: #FFFFFF; border-color: transparent; }
.status-filter-tag.sf-all.active { background: #0F212F; }
.status-filter-tag.sf-submitted_to_mao.active { background: #AC7A2F; }
.status-filter-tag.sf-needs_revision.active { background: #B1472E; }
.status-filter-tag.sf-approved_for_pcic.active { background: #2E6F8E; }
.status-filter-tag.sf-submitted_to_pcic.active { background: #0E8074; }
.status-filter-tag.sf-insured.active { background: #116D3E; }
.status-filter-tag.sf-rejected.active { background: #C1473D; }

.sf-count {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(15, 33, 47, 0.08);
}
.status-filter-tag.active .sf-count { background: rgba(255, 255, 255, 0.22); }

/* ===================== STATUS BADGE (shared: table + bulk bar) ===================== */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}
.status-badge.submitted_to_mao   { background: rgba(210, 149, 57, 0.14); color: #AC7A2F; }
.status-badge.needs_revision     { background: rgba(177, 71, 46, 0.12);  color: #B1472E; }
.status-badge.approved_for_pcic  { background: rgba(46, 111, 142, 0.1);  color: #2E6F8E; }
.status-badge.submitted_to_pcic  { background: rgba(14, 128, 116, 0.1);  color: #0E8074; }
.status-badge.insured            { background: rgba(17, 109, 62, 0.1);   color: #116D3E; }
.status-badge.rejected           { background: rgba(193, 71, 61, 0.1);   color: #C1473D; }

/* ===================== BULK ACTION BAR ===================== */
.bulk-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: #0F212F;
  color: #FFFFFF;
  border-radius: 14px;
  padding: 14px 20px;
  box-shadow: 0 14px 30px rgba(15, 33, 47, 0.35);
}

.bulk-action-bar.floating {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 30;
  min-width: 480px;
  max-width: 90vw;
}

.bulk-action-bar.mixed { background: #3f2f2c; }

.bulk-left { display: flex; align-items: center; gap: 8px; font-size: 0.84rem; flex-wrap: wrap; }
.bulk-left strong { color: #D29539; }

.bulk-warning {
  font-size: 0.78rem;
  color: #FFD9D5;
  flex: 1;
}

.bulk-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.btn-action-approve, .btn-action-submit-pcic, .btn-print-pcic, .btn-action-reject {
  padding: 9px 14px;
  border-radius: 9px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  border: none;
}

.btn-action-approve { background: linear-gradient(135deg, #116D3E, #0A5232); color: #FFFFFF; box-shadow: 0 6px 14px rgba(17, 109, 62, 0.28); }
.btn-action-submit-pcic { background: linear-gradient(135deg, #2E6F8E, #234f65); color: #FFFFFF; box-shadow: 0 6px 14px rgba(46, 111, 142, 0.28); }
.btn-action-submit-pcic:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.btn-print-pcic { background: #F1F6F2; color: #0F212F; border: 1px solid #E0EAE3; }
.btn-print-pcic:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-action-reject { background: #FFFFFF; color: #C1473D; border: 1.5px solid rgba(193, 71, 61, 0.4); }

.bulk-terminal-note { font-size: 0.76rem; color: rgba(255, 255, 255, 0.65); }

.float-bar-enter-active, .float-bar-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.float-bar-enter-from, .float-bar-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }

/* ===================== STATS ROW ===================== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 14px;
  padding: 1rem 1.1rem;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label { font-size: 0.75rem; font-weight: 600; color: #5c6b64; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: #0F212F; }
.stat-value.mao    { color: #AC7A2F; }
.stat-value.pcic   { color: #2E6F8E; }
.stat-value.review { color: #0E8074; }

/* ===================== STATES ===================== */
.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 3rem 1rem;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  font-size: 0.85rem;
  color: #5c6b64;
}
.state-box.error-box { color: #C1473D; }

.spinner {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2.5px solid #E0EAE3; border-top-color: #116D3E;
  animation: spin 0.7s linear infinite;
}

/* ===================== TABLE ===================== */
.table-wrap {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(15, 33, 47, 0.05);
  overflow: hidden;
}

.empty-state { text-align: center; padding: 3rem 1rem; color: #5c6b64; font-size: 0.85rem; }

.app-table { width: 100%; border-collapse: collapse; }

.app-table thead th {
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: #5c6b64;
  padding: 10px 12px;
  background: #F1F6F2;
  white-space: nowrap;
}

.app-table tbody td {
  font-size: 0.8rem;
  color: #0F212F;
  padding: 10px 12px;
  border-bottom: 1px solid #F1F6F2;
  vertical-align: middle;
}

.main-row { cursor: pointer; transition: background 0.12s ease; }
.main-row:hover { background: #F8FAF8; }
.main-row.selected { background: rgba(17, 109, 62, 0.05); }
.main-row.expanded { background: #F1F6F2; }

.expand-cell { width: 26px; }
.expand-icon { display: inline-flex; color: #94a3b8; font-size: 0.62rem; transition: transform 0.15s ease; }
.expand-icon.open { transform: rotate(90deg); color: #116D3E; }

.farmer-cell { min-width: 160px; }
.farmer-name { font-weight: 700; color: #0F212F; }
.farmer-sub { font-size: 0.7rem; color: #5c6b64; margin-top: 1px; }

input[type="checkbox"] { accent-color: #116D3E; width: 15px; height: 15px; cursor: pointer; }
input[type="checkbox"]:disabled { cursor: not-allowed; opacity: 0.5; }

/* ===================== DETAIL ROW ===================== */
.detail-row td { padding: 0; border-bottom: 1px solid #F1F6F2; }

.detail-box {
  background: #F8FAF8;
  border-top: 1px dashed #E0EAE3;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.detail-actions-panel { display: flex; }
.action-sub-group { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.action-panel-label { font-size: 0.8rem; color: #0F212F; }

.action-hint {
  font-size: 0.8rem;
  color: #5c6b64;
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  line-height: 1.4;
}

.detail-grid-wrapper {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.detail-section {
  background: #FFFFFF;
  border: 1px solid #EAF1EC;
  border-radius: 12px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.section-title { font-size: 0.82rem; font-weight: 700; color: #0F212F; }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.7rem;
}

.detail-item { display: flex; flex-direction: column; gap: 3px; }
.detail-item.full-width { grid-column: span 2; }
.detail-label { font-size: 0.68rem; color: #5c6b64; }
.detail-val { font-size: 0.82rem; font-weight: 600; color: #0F212F; word-break: break-word; }

.payment-validation-actions { display: flex; gap: 8px; margin-top: 4px; }

.payment-proof-img, .signature-img, .farm-photo-img {
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid #EAF1EC;
  margin-top: 4px;
}

.documents-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.document-tile { display: flex; flex-direction: column; gap: 6px; }

/* ===================== PDF EXPORT (screen preview) ===================== */
.pdf-export-wrapper {
  position: fixed;
  inset: 0;
  z-index: -1;
  opacity: 0;
  pointer-events: none;
  overflow: auto;
  background: #FFFFFF;
}

.pdf-export-container { background: #FFFFFF; }

.pcic-page-container {
  width: 14in;
  min-height: 8.5in;
  padding: 0.5in;
  background: #FFFFFF;
  font-family: "Times New Roman", Times, serif;
  color: #111111;
  font-size: 9pt;
}

.pdf-page-break { page-break-before: always; }

.pcic-official-header { border-bottom: 2px solid #111111; margin-bottom: 8px; padding-bottom: 6px; }

.pcic-header-top { display: flex; align-items: center; gap: 12px; }

.pcic-logo-placeholder {
  width: 50px; height: 50px;
  border: 1px solid #111111;
  border-radius: 50%;
  flex-shrink: 0;
}

.pcic-title-box { flex: 1; text-align: center; }
.pcic-republic { font-size: 8.5pt; }
.pcic-corp-name { font-size: 12pt; font-weight: 700; letter-spacing: 0.5px; }
.pcic-dept { font-size: 8.5pt; }
.pcic-form-title { font-size: 9.5pt; font-weight: 700; margin-top: 4px; text-decoration: underline; }

.pcic-form-code { font-size: 8pt; font-weight: 700; flex-shrink: 0; }

.pcic-meta-table { margin-top: 8px; border: 1px solid #111111; }

.meta-row { display: flex; border-bottom: 1px solid #111111; }
.meta-row:last-child { border-bottom: none; }

.meta-cell { padding: 3px 8px; font-size: 8pt; border-right: 1px solid #111111; }
.meta-cell:last-child { border-right: none; }
.meta-cell.flex-1 { flex: 1; }
.meta-cell.flex-2 { flex: 2; }

.pcic-official-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
  font-size: 7.5pt;
}

.pcic-official-table th, .pcic-official-table td {
  border: 1px solid #111111;
  padding: 3px 4px;
  text-align: left;
  vertical-align: middle;
}

.pcic-official-table th { font-weight: 700; text-align: center; background: #F1F1F1; }

.text-center { text-align: center; }
.text-right { text-align: right; }
.bold { font-weight: 700; }
.font-mono { font-family: "Courier New", monospace; }

.pcic-data-row td { height: 22px; }

.pcic-footer-block { margin-top: 14px; }
.pcic-cert-text { font-size: 8pt; font-style: italic; margin-bottom: 20px; }

.pcic-sig-grid { display: flex; justify-content: space-between; gap: 40px; }
.sig-box { flex: 1; text-align: center; }
.sig-line { border-top: 1px solid #111111; margin-bottom: 4px; }
.sig-title { font-size: 8pt; }

.signature-cell { width: 90px; }
.pdf-signature-img { max-width: 80px; max-height: 30px; object-fit: contain; }

/* ===================== PRINT RULES ===================== */
@media print {
  .no-print { display: none !important; }

  .insurance-page { padding: 0; background: #FFFFFF; }

  .pdf-export-wrapper {
    position: static;
    opacity: 1;
    pointer-events: auto;
    z-index: auto;
    inset: auto;
  }

  .pcic-page-container {
    width: auto;
    min-height: auto;
  }

  @page {
    size: legal landscape;
    margin: 0.4in;
  }
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 1200px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .detail-grid-wrapper { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .season-card { flex-direction: column; align-items: flex-start; }
  .stats-row { grid-template-columns: 1fr; }
  .filters-row { flex-direction: column; align-items: stretch; }
  .detail-grid, .documents-row { grid-template-columns: 1fr; }
  .detail-item.full-width { grid-column: span 1; }
  .bulk-action-bar.floating { left: 12px; right: 12px; transform: none; min-width: 0; }
}
</style>