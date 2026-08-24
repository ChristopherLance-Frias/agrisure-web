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

          <!--
            submitted_to_pcic is now a terminal status for MAO (see isTerminal()).
            Once applications reach it they are no longer selectable, so this
            branch is effectively unreachable — kept only as a defensive fallback.
          -->
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

                      <!--
                        submitted_to_pcic is MAO's final system action for this application.
                        PCIC now notifies the farmer directly via SMS with the outcome, so no
                        "Mark Insured" / "Reject" action is exposed to MAO officers anymore.
                      -->
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
                          <span v-else class="detail-val">—</span>
                        </div>

                        <div class="document-tile">
                          <span class="detail-label">Farm Photo</span>
                          <img
                            v-if="app.farm?.farm_image_path"
                            :src="assetUrl(app.farm.farm_image_path)"
                            alt="Farm photo"
                            class="farm-photo-img"
                          />
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
                      v-if="app?.signature_path"
                      :src="assetUrl(app.signature_path)"
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

    downloadSelectedPcicBatch() {
      if (this.selectedPcicReady.length === 0) {
        alert('Select applications with "To be submitted to PCIC" status only.')
        return
      }
      this.pcicBatchList = this.selectedPcicReady
      this.generatePDF('PCIC_Selected_Batch.pdf')
    },

    async generatePDF(filename) {
      if (!this.pcicBatchList || this.pcicBatchList.length === 0) {
        alert('No applications found to export.')
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
.insurance-page {
  font-family: 'DM Sans', sans-serif;
  background: #F5F7F5;
  padding: 2rem 2rem 6rem;
  color: #263238;
}
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


.season-card {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 1.2rem 1.4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(38, 50, 56, 0.08);
  margin-bottom: 1.5rem;
  border-left: 4px solid #2E7D32;
}

.season-info { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
.season-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  background: #eaf5ea;
  color: #2E7D32;
}

.season-text { display: flex; flex-direction: column; gap: 3px; }
.season-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.03em; color: #5c6b64; font-weight: 600; }
.season-name { font-size: 1rem; font-weight: 700; color: #263238; }
.season-actions { display: flex; gap: 10px; }

.btn-season-secondary,
.btn-season-danger,
.btn-season-primary {
  border: none;
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.btn-season-secondary { background: #FFFFFF; color: #2E7D32; border: 1px solid #66BB6A; }
.btn-season-secondary:hover { background: #eaf5ea; }
.btn-season-danger { background: #FFFFFF; color: #b3261e; border: 1px solid #f3c6c6; }
.btn-season-danger:hover { background: #fdf0f0; }
.btn-season-primary { background: #2E7D32; color: #FFFFFF; width: 100%; }
.btn-season-primary:hover { background: #256428; }
.btn-season-primary:disabled { background: #a9c9ab; cursor: not-allowed; }

.setup-card {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 2.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(38, 50, 56, 0.08);
  margin-bottom: 1.5rem;
}

.setup-icon { font-size: 2.2rem; margin-bottom: 0.6rem; }
.setup-card h3 { margin: 0 0 6px; font-size: 1.1rem; color: #263238; }
.setup-card p { margin: 0 0 1.2rem; color: #5c6b64; font-size: 0.88rem; }
.setup-form { max-width: 360px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; text-align: left; }

.modal-field { display: flex; flex-direction: column; gap: 6px; }
.modal-field label { font-size: 0.78rem; font-weight: 600; color: #5c6b64; }
.modal-input {
  border: 1px solid #d7e2d8;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 0.85rem;
  font-family: inherit;
  color: #263238;
  background: #FFFFFF;
}

.modal-input:focus {
  outline: none;
  border-color: #66BB6A;
  box-shadow: 0 0 0 3px rgba(102, 187, 106, 0.25);
}

.modal-error { color: #b3261e; font-size: 0.8rem; margin: 0; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(38, 50, 56, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-box {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 1.6rem;
  width: 90%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-title { margin: 0; font-size: 1.05rem; color: #263238; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 0.4rem; }

.btn-modal-cancel,
.btn-modal-save {
  border: none;
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.btn-modal-cancel { background: #F5F7F5; color: #5c6b64; }
.btn-modal-save { background: #2E7D32; color: #FFFFFF; }
.btn-modal-save:hover { background: #256428; }
.btn-modal-save:disabled { background: #a9c9ab; cursor: not-allowed; }

.section-divider { display: flex; align-items: center; margin: 1.8rem 0 1.2rem; }
.section-divider::before,
.section-divider::after { content: ''; flex: 1; height: 1px; background: #dde8de; }
.section-divider span {
  padding: 0 14px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #5c6b64;
}

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

.tab-btn.active { background: #2E7D32; color: #FFFFFF; }

.refresh-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
.refresh-status { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #5c6b64; }
.refresh-dot { width: 8px; height: 8px; border-radius: 50%; background: #93a29a; flex-shrink: 0; }
.refresh-dot.live {
  background: #2E7D32;
  box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.5);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.45); }
  70% { box-shadow: 0 0 0 6px rgba(46, 125, 50, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
}

.refresh-last { color: #93a29a; }
.refresh-controls { display: flex; align-items: center; gap: 12px; }

.btn-icon-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #d7e2d8;
  background: #FFFFFF;
  color: #2E7D32;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.btn-icon-refresh:hover { background: #eaf5ea; }
.btn-icon-refresh:disabled { color: #93a29a; cursor: not-allowed; background: #FFFFFF; }
.btn-icon-refresh .spinning { display: inline-block; animation: spin 0.8s linear infinite; }

.toggle-switch { position: relative; display: inline-block; width: 38px; height: 21px; flex-shrink: 0; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; inset: 0; background-color: #d7e2d8; border-radius: 999px; transition: background-color 0.2s ease; }
.toggle-slider::before { content: ''; position: absolute; height: 15px; width: 15px; left: 3px; bottom: 3px; background-color: #FFFFFF; border-radius: 50%; transition: transform 0.2s ease; }
.toggle-switch input:checked + .toggle-slider { background-color: #2E7D32; }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(17px); }

.filters-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 0.9rem; }
.search-wrap { flex: 1; min-width: 220px; }

.search-input,
.filter-select {
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

.filter-select { width: auto; min-width: 170px; }
.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #66BB6A;
  box-shadow: 0 0 0 3px rgba(102, 187, 106, 0.25);
}

.btn-reset {
  border: 1px solid #d7e2d8;
  background: #FFFFFF;
  color: #5c6b64;
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.btn-reset:hover { background: #f0f4f0; }

.btn-print-pcic {
  border: none;
  background: #F9A825;
  color: #263238;
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
.btn-print-pcic:hover { background: #e0960f; }
.btn-print-pcic:disabled { background: #fbe6af; cursor: not-allowed; }

.status-filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1.2rem; }
.status-filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #d7e2d8;
  background: #FFFFFF;
  color: #5c6b64;
  border-radius: 20px;
  padding: 7px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.status-filter-tag:hover { border-color: #66BB6A; }
.sf-count { background: rgba(38, 50, 56, 0.08); border-radius: 10px; padding: 1px 7px; font-size: 0.7rem; font-weight: 700; }
.status-filter-tag.active { color: #FFFFFF; border-color: transparent; }
.status-filter-tag.active .sf-count { background: rgba(255, 255, 255, 0.25); }
.status-filter-tag.sf-all.active { background: #263238; }
.status-filter-tag.sf-submitted_to_mao.active { background: #1976D2; }
.status-filter-tag.sf-approved_for_pcic.active { background: #F9A825; color: #263238; }
.status-filter-tag.sf-approved_for_pcic.active .sf-count { background: rgba(38, 50, 56, 0.15); }
.status-filter-tag.sf-submitted_to_pcic.active { background: #6A4C93; }
.status-filter-tag.sf-needs_revision.active { background: #e08a1e; }
.status-filter-tag.sf-insured.active { background: #2E7D32; }
.status-filter-tag.sf-rejected.active { background: #b3261e; }

.bulk-action-bar {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
  background: #eaf5ea;
  border: 1px solid #bfe0c1;
  border-radius: 12px;
  padding: 0.9rem 1.2rem;
  margin-bottom: 1.2rem;
}

.bulk-action-bar.floating {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 600;
  margin-bottom: 0;
  width: min(920px, calc(100% - 48px));
  box-shadow: 0 10px 30px rgba(38, 50, 56, 0.22), 0 2px 8px rgba(38, 50, 56, 0.12);
  background: #FFFFFF;
  border: 1px solid #dde8de;
  border-left: 4px solid #2E7D32;
}

.bulk-action-bar.floating.mixed { border-left-color: #F9A825; background: #FFFFFF; }
.bulk-action-bar.mixed { background: #fdf1d6; border-color: #f3d38a; }
.float-bar-enter-active, .float-bar-leave-active { transition: transform 0.22s ease, opacity 0.22s ease; }
.float-bar-enter-from, .float-bar-leave-to { transform: translateX(-50%) translateY(16px); opacity: 0; }

.bulk-left { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #263238; }
.bulk-warning { font-size: 0.82rem; color: #7a5205; flex: 1; }
.bulk-actions { display: flex; gap: 10px; flex-wrap: wrap; flex: 1; }
.bulk-terminal-note { font-size: 0.82rem; color: #5c6b64; font-style: italic; }

.btn-action-approve,
.btn-action-submit-pcic,
.btn-action-finalize,
.btn-action-reject {
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.btn-action-approve { background: #1976D2; color: #FFFFFF; }
.btn-action-approve:hover { background: #145ea8; }
.btn-action-submit-pcic { background: #F9A825; color: #263238; }
.btn-action-submit-pcic:hover { background: #e0960f; }
.btn-action-finalize { background: #2E7D32; color: #FFFFFF; }
.btn-action-finalize:hover { background: #256428; }
.btn-action-reject { background: #FFFFFF; color: #b3261e; border: 1px solid #f3c6c6; }
.btn-action-reject:hover { background: #fdf0f0; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1.4rem;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 1px 3px rgba(38, 50, 56, 0.06);
}

.stat-label { font-size: 0.72rem; color: #5c6b64; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }
.stat-value { font-size: 1.35rem; font-weight: 700; color: #263238; }
.stat-value.mao { color: #1976D2; }
.stat-value.pcic { color: #F9A825; }
.stat-value.review { color: #6A4C93; }
.stat-value.revision { color: #e08a1e; }
.stat-value.insured { color: #2E7D32; }
.stat-value.rejected { color: #b3261e; }

.state-box {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 2.5rem;
  text-align: center;
  color: #5c6b64;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.error-box { color: #b3261e; }
.spinner { width: 26px; height: 26px; border: 3px solid #dde8de; border-top-color: #2E7D32; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 2.5rem; color: #93a29a; font-size: 0.88rem; }

.table-wrap {
  background: #FFFFFF;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(38, 50, 56, 0.08);
}

.app-table { width: 100%; border-collapse: collapse; }
.app-table th {
  text-align: left;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #5c6b64;
  background: #F5F7F5;
  padding: 12px 14px;
  font-weight: 600;
  white-space: nowrap;
}

.app-table td { padding: 12px 14px; font-size: 0.83rem; border-top: 1px solid #eef2ef; color: #263238; }
.main-row { cursor: pointer; transition: background 0.15s ease; }
.main-row:hover { background: #f7faf7; }
.main-row.selected { background: #eaf5ea; }
.main-row.expanded { background: #f2f9f2; }

.expand-cell { width: 24px; }
.expand-icon { display: inline-block; font-size: 0.7rem; color: #93a29a; transition: transform 0.15s ease; }
.expand-icon.open { transform: rotate(90deg); color: #2E7D32; }

.farmer-name { font-weight: 600; color: #263238; }
.farmer-sub { font-size: 0.75rem; color: #93a29a; }

.status-badge { display: inline-block; padding: 4px 11px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; }
.status-badge.submitted_to_mao { background: #e3edfa; color: #1976D2; }
.status-badge.approved_for_pcic { background: #fdf1d6; color: #b9790a; }
.status-badge.submitted_to_pcic { background: #ece4f5; color: #6A4C93; }
.status-badge.needs_revision { background: #fbe6d0; color: #b3610f; }
.status-badge.insured { background: #e5f4e6; color: #2E7D32; }
.status-badge.rejected { background: #fde3e3; color: #b3261e; }

.detail-row td { padding: 0; border-top: none; }
.detail-box { background: #fafcfa; padding: 1.4rem; border-top: 1px solid #eef2ef; border-bottom: 2px solid #dde8de; }
.detail-actions-panel { margin-bottom: 1.2rem; }
.action-sub-group { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.action-panel-label { font-size: 0.8rem; color: #5c6b64; }
.action-hint { font-size: 0.8rem; color: #5c6b64; font-style: italic; }

.detail-grid-wrapper { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.2rem; }
.detail-section { background: #FFFFFF; border: 1px solid #eef2ef; border-radius: 10px; padding: 1rem; }
.section-title { font-size: 0.78rem; font-weight: 700; color: #2E7D32; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 0.8rem; }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
.detail-item { display: flex; flex-direction: column; gap: 2px; }
.detail-item.full-width { grid-column: 1 / -1; }
.detail-label { font-size: 0.7rem; color: #93a29a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }
.detail-val { font-size: 0.85rem; color: #263238; font-weight: 500; }
.detail-link { font-size: 0.85rem; color: #2E7D32; font-weight: 600; text-decoration: none; }
.detail-link:hover { text-decoration: underline; }

.payment-validation-actions { display: flex; gap: 10px; margin-top: 4px; }

.documents-row { display: flex; gap: 1.2rem; flex-wrap: wrap; }
.document-tile { display: flex; flex-direction: column; gap: 6px; }

.signature-img { max-width: 220px; max-height: 100px; object-fit: contain; border: 1px solid #eef2ef; border-radius: 8px; background: #FFFFFF; padding: 6px; }
.farm-photo-img { max-width: 220px; max-height: 140px; object-fit: cover; border: 1px solid #eef2ef; border-radius: 8px; }

/* -------------------------------------------------------------
   EXACT PCIC OFFICIAL GOVERNMENT FORM STYLES (LEGAL LANDSCAPE)
------------------------------------------------------------- */
.pdf-export-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  visibility: hidden;
  pointer-events: none;
  z-index: -1;
}

.pdf-export-container {
  width: 1300px; /* Legal Landscape Target Capture Bounds */
  background: #ffffff;
  padding: 0;
  font-family: Arial, Helvetica, sans-serif;
  color: #000000;
  box-sizing: border-box;
}

.pcic-page-container {
  padding: 15px 20px;
  background: #ffffff;
  box-sizing: border-box;
}

/* Header Structure */
.pcic-official-header {
  border: 2px solid #000000;
  margin-bottom: 8px;
}

.pcic-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 2px solid #000000;
}

.pcic-logo-placeholder {
  width: 50px;
  height: 50px;
  border: 1px dashed #666;
  position: relative;
}
.pcic-logo-placeholder::after {
  content: 'LOGO';
  font-size: 8pt;
  color: #888;
  display: block;
  text-align: center;
  line-height: 50px;
}

.pcic-title-box {
  text-align: center;
  flex: 1;
}

.pcic-republic {
  font-size: 8.5pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pcic-corp-name {
  font-size: 12pt;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.pcic-dept {
  font-size: 8pt;
  font-weight: bold;
}

.pcic-form-title {
  font-size: 10.5pt;
  font-weight: bold;
  margin-top: 3px;
  text-decoration: underline;
}

.pcic-form-code {
  font-size: 9pt;
  font-weight: bold;
  border: 1px solid #000;
  padding: 4px 8px;
}

/* Meta Table Grid */
.pcic-meta-table {
  display: flex;
  flex-direction: column;
}

.meta-row {
  display: flex;
  border-bottom: 1px solid #000000;
}
.meta-row:last-child {
  border-bottom: none;
}

.meta-cell {
  padding: 4px 8px;
  font-size: 7.5pt;
  border-right: 1px solid #000000;
}
.meta-cell:last-child {
  border-right: none;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

/* PCIC Table Precision Grid */
.pcic-official-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 2px solid #000000;
}

.pcic-official-table th,
.pcic-official-table td {
  border: 1px solid #000000;
  padding: 2px 3px;
  font-size: 6.8pt;
  line-height: 1.1;
  color: #000000;
  word-wrap: break-word;
  overflow: hidden;
}

.pcic-official-table th {
  background-color: #f2f2f2;
  font-weight: bold;
  text-align: center;
  vertical-align: middle;
  text-transform: uppercase;
}

.pcic-data-row td {
  height: 22px;
  vertical-align: middle;
}

/* Column Width Specifications (Page 1) */
.col-num { width: 22px; }
.col-lname { width: 65px; }
.col-fname { width: 65px; }
.col-mname { width: 45px; }
.col-ext { width: 22px; }
.col-sex { width: 25px; }
.col-civil { width: 45px; }
.col-addr { width: 110px; }
.col-dob { width: 55px; }
.col-rsbsa { width: 75px; }
.col-pay { width: 50px; }
.col-phone { width: 65px; }
.col-spouse { width: 75px; }
.col-parent { width: 75px; }
.col-ben { width: 75px; }
.col-area { width: 35px; }
.col-date { width: 50px; }
.col-var { width: 50px; }

/* Column Width Specifications (Page 2) */
.col-p2-name { width: 120px; }
.col-p2-georef { width: 85px; }
.col-p2-loc { width: 130px; }
.col-p2-cat { width: 65px; }
.col-p2-tenure { width: 65px; }
.col-p2-bnd { width: 80px; }
.col-p2-sig { width: 90px; }

/* Formatting Utilities */
.text-center { text-align: center; }
.text-right { text-align: right; }
.bold { font-weight: bold; }
.font-mono { font-family: monospace, sans-serif; font-size: 6.5pt; }

.signature-cell {
  padding: 0;
  vertical-align: middle;
}

.pdf-signature-img {
  max-width: 80px;
  max-height: 20px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.pdf-page-break {
  break-before: page;
  page-break-before: always;
}

/* Footer Section */
.pcic-footer-block {
  margin-top: 10px;
  border: 1px solid #000000;
  padding: 8px 12px;
}

.pcic-cert-text {
  font-size: 7pt;
  font-style: italic;
  margin-bottom: 12px;
  text-align: center;
}

.pcic-sig-grid {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
}

.sig-box {
  width: 260px;
  text-align: center;
}

.sig-line {
  border-bottom: 1px solid #000000;
  height: 20px;
  margin-bottom: 4px;
}

.sig-title {
  font-size: 7.5pt;
  font-weight: bold;
  text-transform: uppercase;
}

/* Direct Browser Printing Support */
@media print {
  @page {
    size: 14in 8.5in; /* Legal Landscape Format */
    margin: 0;
  }

  body {
    background: #ffffff;
    color: #000000;
  }

  .no-print {
    display: none !important;
  }

  .pdf-export-wrapper {
    position: static !important;
    visibility: visible !important;
  }

  .pdf-export-container {
    width: 100% !important;
    padding: 0 !important;
  }
}
</style>