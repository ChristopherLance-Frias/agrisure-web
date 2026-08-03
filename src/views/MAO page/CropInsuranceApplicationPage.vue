<template>
  <div class="insurance-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Crop Insurance Applications</h2>
        <p class="page-sub">Review, update, and manage farmer insurance applications submitted to MAO</p>
      </div>
    </div>

    <!-- Active Season Display Window -->
    <div v-if="hasConfiguredSeason" class="season-card">
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
    <div v-else class="setup-card">
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
    <div v-if="showSeasonModal" class="modal-overlay" @click.self="closeSeasonModal">
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

    <!-- Payment Verification Modal Popup -->
    <div v-if="showVerifyModal && verifyingApp" class="modal-overlay" @click.self="closeVerifyModal">
      <div class="modal-box verify-modal">
        <h3 class="modal-title">Verify Payment Proof</h3>
        <p class="modal-subtitle">Farmer: <strong>{{ farmerName(verifyingApp) }}</strong></p>

        <div class="proof-preview-container">
          <a
            v-if="verifyingApp.payment_proof_url"
            :href="verifyingApp.payment_proof_url"
            target="_blank"
            rel="noopener noreferrer"
            class="proof-link-wrap"
          >
            <img
              :src="verifyingApp.payment_proof_url"
              alt="Uploaded Payment Proof"
              class="proof-image-preview"
            />
            <span class="proof-click-hint">🔍 Click image to view full document</span>
          </a>
          <div v-else class="no-proof-warning">
            ⚠ No proof image uploaded yet.
          </div>
        </div>

        <div class="modal-field">
          <label>Verification Decision</label>
          <div class="decision-toggle-group">
            <button
              type="button"
              class="btn-decision approve"
              :class="{ active: verifyDecision === 'approve' }"
              @click="verifyDecision = 'approve'"
            >
              ✓ Approve Payment
            </button>
            <button
              type="button"
              class="btn-decision reject"
              :class="{ active: verifyDecision === 'reject' }"
              @click="verifyDecision = 'reject'"
            >
              ✕ Reject Payment
            </button>
          </div>
        </div>

        <div class="modal-field">
          <label>
            Remarks / Remarks Note
            <span v-if="verifyDecision === 'reject'" class="required-star">* (Required)</span>
          </label>
          <textarea
            v-model="verifyRemarks"
            class="modal-input textarea-remarks"
            rows="3"
            placeholder="e.g. Reference number legible or reason for rejection..."
          ></textarea>
        </div>

        <p v-if="verifyModalError" class="modal-error">{{ verifyModalError }}</p>

        <div class="modal-actions">
          <button class="btn-modal-cancel" @click="closeVerifyModal" :disabled="savingVerify">
            Cancel
          </button>

          <button
            class="btn-modal-save"
            :class="{ 'btn-danger': verifyDecision === 'reject' }"
            @click="submitPaymentVerification"
            :disabled="savingVerify"
          >
            {{ savingVerify ? 'Submitting...' : 'Submit Decision' }}
          </button>
        </div>
      </div>
    </div>

    <div class="section-divider">
      <span>Applications Matrix</span>
    </div>

    <div class="tab-bar">
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

    <div class="refresh-bar">
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

    <div class="filters-row">
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

      <button
        v-if="hasPcicPreparations"
        class="btn-print-pcic"
        @click="printPcicBatchManifest"
      >
        🖨️ Print PCIC Form ({{ countByStatus('approved_for_pcic') }})
      </button>
    </div>

    <div class="status-filter-row">
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
      <div v-if="selectedIds.length > 0" class="bulk-action-bar floating" :class="{ mixed: !selectedStatus }">
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
              class="btn-print-pcic"
              @click="printSelectedPcicBatch"
            >
              🖨️ Print Form Batch ({{ selectedIds.length }})
            </button>

            <button
              class="btn-action-submit-pcic"
              :disabled="!hasPrintedCurrentBatch"
              :title="!hasPrintedCurrentBatch ? 'You must Print PCIC Form first before marking as Forwarded' : ''"
              @click="bulkUpdateStatus('submitted_to_pcic')"
            >
              Mark {{ selectedIds.length }} as Forwarded to PCIC
            </button>

            <span v-if="!hasPrintedCurrentBatch" class="print-required-notice">
              ⚠️ Print PCIC Batch Form first to enable submit button.
            </span>
          </template>

          <template v-if="selectedStatus === 'submitted_to_pcic'">
            <button class="btn-action-finalize" @click="bulkUpdateStatus('insured')">
              Mark {{ selectedIds.length }} as Insured
            </button>

            <button class="btn-action-reject" @click="bulkUpdateStatus('rejected')">
              Reject {{ selectedIds.length }}
            </button>
          </template>

          <template v-if="selectedStatus === 'insured' || selectedStatus === 'rejected'">
            <span class="bulk-terminal-note">No further action available for this status.</span>
          </template>
        </div>

        <button class="btn-reset" @click="clearSelection">Clear</button>
      </div>
    </transition>

    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-label">Total</span>
        <span class="stat-value">{{ activeApplications.length }}</span>
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
        <span class="stat-label">At PCIC Evaluation</span>
        <span class="stat-value review">{{ countByStatus('submitted_to_pcic') }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Needs Revision</span>
        <span class="stat-value revision">{{ countByStatus('needs_revision') }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Insured</span>
        <span class="stat-value insured">{{ countByStatus('insured') }}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Rejected</span>
        <span class="stat-value rejected">{{ countByStatus('rejected') }}</span>
      </div>
    </div>

    <div v-if="isLoading" class="state-box">
      <div class="spinner"></div>
      <span>Fetching applications registry...</span>
    </div>

    <div v-else-if="errorMessage" class="state-box error-box">
      <span>{{ errorMessage }}</span>
    </div>

    <div v-else class="table-wrap">
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
            <th>Payment</th>
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

              <td>
                <span v-if="!app.requires_payment" class="pay-badge free">Free</span>
                <span v-else-if="app.payment_verified" class="pay-badge verified">Verified</span>
                <span v-else class="pay-badge pending">Pending Proof</span>
              </td>

              <td>{{ app.insurance_season?.season_name || currentSeasonName(app) }}</td>
              <td>{{ formatDate(app.application_date) }}</td>
            </tr>

            <tr v-if="expandedId === app.id" class="detail-row">
              <td colspan="13">
                <div class="detail-box" @click.stop>
                  <div class="detail-actions-panel">
                    <div class="action-sub-group">
                      <span class="action-panel-label">
                        <strong>Available Action:</strong>
                      </span>

                      <!-- Single target workflows -->
                      <template v-if="app.status === 'submitted_to_mao' || app.status === 'needs_revision'">
                        <button
                          v-if="app.requires_payment && !app.payment_verified"
                          class="btn-action-verify"
                          @click="openVerifyModal(app)"
                        >
                          🔍 Verify Payment Proof
                        </button>

                        <button
                          v-else
                          class="btn-action-approve"
                          @click="updateAppStatus(app.id, 'approved_for_pcic')"
                        >
                          Mark as To be Submitted to PCIC
                        </button>
                      </template>

                      <template v-if="app.status === 'approved_for_pcic'">
                        <span class="action-hint">
                          ℹ️ PCIC requires batch transmittal. Select this application's checkbox
                          (and any others ready for PCIC) to forward it.
                        </span>
                      </template>

                      <template v-if="app.status === 'submitted_to_pcic'">
                        <button
                          class="btn-action-finalize"
                          @click="updateAppStatus(app.id, 'insured')"
                        >
                          Mark Insured
                        </button>

                        <button
                          class="btn-action-reject"
                          @click="updateAppStatus(app.id, 'rejected')"
                        >
                          Reject
                        </button>
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
                          <span class="detail-val">{{ app.civil_status || '—' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Beneficiary</span>
                          <span class="detail-val">{{ app.beneficiary_name || '—' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Phone</span>
                          <span class="detail-val">{{ app.farm?.farmer_profile?.user?.phone_number || '—' }}</span>
                        </div>

                        <div class="detail-item full-width">
                          <span class="detail-label">Address</span>
                          <span class="detail-val">{{ app.farm?.farmer_profile?.address || '—' }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="detail-section">
                      <div class="section-title">Crop Information</div>

                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Crop Type</span>
                          <span class="detail-val">{{ app.farm?.crop_type || '—' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Variety</span>
                          <span class="detail-val">{{ app.variety || '—' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Farm Type</span>
                          <span class="detail-val">{{ app.farm_type || '—' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Area Size</span>
                          <span class="detail-val">{{ app.farm?.farm_area ? app.farm.farm_area + ' ha' : '—' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Sowing Date</span>
                          <span class="detail-val">{{ formatDate(app.sowing_date) }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Transplanting</span>
                          <span class="detail-val">{{ formatDate(app.transplanting_date) }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="detail-section">
                      <div class="section-title">Land Boundaries & Tenure</div>

                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">North</span>
                          <span class="detail-val">{{ app.north_boundary || '—' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">East</span>
                          <span class="detail-val">{{ app.east_boundary || '—' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">West</span>
                          <span class="detail-val">{{ app.west_boundary || '—' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">South</span>
                          <span class="detail-val">{{ app.south_boundary || '—' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Land Owner</span>
                          <span class="detail-val">{{ app.is_land_owner ? 'Yes' : 'No' }}</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Tenure Status</span>
                          <span class="detail-val">{{ app.tenure_status || '—' }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Payment Details Section -->
                    <div v-if="app.requires_payment" class="detail-section">
                      <div class="section-title">Payment Verification Status</div>

                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Requires Fee</span>
                          <span class="detail-val">Yes</span>
                        </div>

                        <div class="detail-item">
                          <span class="detail-label">Verification Status</span>
                          <span class="detail-val">
                            {{ app.payment_verified ? 'Verified' : 'Unverified / Pending Review' }}
                          </span>
                        </div>

                        <div class="detail-item full-width" v-if="app.payment_remarks">
                          <span class="detail-label">Verification Remarks</span>
                          <span class="detail-val">{{ app.payment_remarks }}</span>
                        </div>

                        <div class="detail-item full-width">
                          <span class="detail-label">Proof of Payment</span>
                          <span class="detail-val">
                            <button
                              class="btn-inline-verify"
                              @click="openVerifyModal(app)"
                            >
                              {{ app.payment_verified ? 'View Proof Image' : 'Review & Verify Proof' }}
                            </button>
                          </span>
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

    <!-- Official Printable PCIC Application Form Layout (Matching Attached Images) -->
    <div v-if="isPrintingPcicBatch" id="print-area" class="print-area pcic-official-form">
      <!-- Page 1 Header -->
      <div class="pcic-page-container">
        <div class="pcic-header text-center">
          <h3>PHILIPPINE CROP INSURANCE CORPORATION</h3>
          <p class="subtitle">Regional Office No. 02</p>
          <h2 class="form-title">APPLICATION FOR CROP INSURANCE</h2>
          <p class="group-sub">(Group Application)</p>
        </div>

        <div class="pcic-meta-grid">
          <div class="meta-row">
            <span class="meta-label">Name of F/A/IA/COOP/A/SPO/LGU:</span>
            <span class="meta-value">MUNICIPAL AGRICULTURE OFFICE (MAO)</span>
          </div>
          <div class="meta-row split-row">
            <div>
              <span class="meta-label">Underwriter/Solicitor:</span>
              <span class="meta-value">_________________________</span>
            </div>
            <div>
              <span class="meta-label">Mailing Address:</span>
              <span class="meta-value">Echague, Isabela</span>
            </div>
          </div>
          <div class="meta-row inline-checks">
            <span class="meta-label">FARMER CATEGORY:</span>
            <label>[ ] Self-Financed</label>
            <label>[ ] Borrowing</label>
            <span class="meta-label margin-left">Program:</span>
            <label>[ ] RSBSA</label>
            <label>[ ] RCEF</label>
            <label>[ ] Regular</label>
            <label>[ ] AGRI-SENSO</label>
            <label>[ ] AGRI-PUHUNA/NAB</label>
            <label>[ ] Others</label>
          </div>
        </div>

        <!-- Official Page 1 Grid (15 Fixed Rows) -->
        <table class="pcic-grid-table">
          <thead>
            <tr>
              <th rowspan="2" class="col-xs">No.</th>
              <th colspan="4">Name of Farmers</th>
              <th rowspan="2">Address<br>(Sitio & Barangay)</th>
              <th rowspan="2">Date of Birth<br>(mm/dd/yy)</th>
              <th rowspan="2">RSBSA Reference No.</th>
              <th rowspan="2">Mode of Indemnity Payment</th>
              <th rowspan="2">Lender</th>
              <th rowspan="2">Account No.</th>
              <th rowspan="2">Cellphone No.</th>
              <th rowspan="2">Spouse / Parents</th>
              <th rowspan="2">Beneficiary</th>
              <th colspan="3">Planting Calendar</th>
            </tr>
            <tr>
              <th>Last Name</th>
              <th>First Name</th>
              <th>Middle Name</th>
              <th class="col-xs">Suffix</th>
              <th>Area</th>
              <th>Sowing/TS</th>
              <th>Transplanting</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="index in 15" :key="'p1-' + index">
              <td>{{ index }}</td>
              <td>{{ getBatchItem(index - 1)?.farm?.farmer_profile?.user?.last_name || '' }}</td>
              <td>{{ getBatchItem(index - 1)?.farm?.farmer_profile?.user?.first_name || '' }}</td>
              <td>{{ getBatchItem(index - 1)?.farm?.farmer_profile?.user?.middle_name || '' }}</td>
              <td>{{ getBatchItem(index - 1)?.farm?.farmer_profile?.user?.extension_name || '' }}</td>
              <td>{{ truncateAddress(getBatchItem(index - 1)?.farm?.farmer_profile?.address) }}</td>
              <td></td>
              <td>{{ getBatchItem(index - 1)?.farm?.farmer_profile?.rsbsa_no || '' }}</td>
              <td>LBP / E-Wallet</td>
              <td></td>
              <td></td>
              <td>{{ getBatchItem(index - 1)?.farm?.farmer_profile?.user?.phone_number || '' }}</td>
              <td></td>
              <td>{{ getBatchItem(index - 1)?.beneficiary_name || '' }}</td>
              <td>{{ getBatchItem(index - 1)?.farm?.farm_area || '' }}</td>
              <td>{{ formatDate(getBatchItem(index - 1)?.sowing_date) }}</td>
              <td>{{ formatDate(getBatchItem(index - 1)?.transplanting_date) }}</td>
            </tr>
            <tr class="row-total">
              <td colspan="14" class="text-right"><strong>TOTAL</strong></td>
              <td><strong>{{ totalBatchArea }}</strong></td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>

        <!-- Page 1 Bottom Certifications & Computations Section -->
        <div class="pcic-footer-grid">
          <div class="footer-box-left">
            <p class="cert-title">CERTIFICATION AND DATA PRIVACY CONSENT STATEMENT</p>
            <p class="cert-text">
              [ ] We hereby certify that the foregoing answers and statements are complete, true and correct. If the application is approved, the insurance shall be deemed based upon the statements contained herein.
            </p>
            <p class="cert-text">
              [ ] By submitting this application, we hereby consent to the collection, use, processing, and disclosure of our sensitive personal data in accordance with the Data Privacy Act of 2012.
            </p>
          </div>

          <div class="footer-box-middle">
            <p class="cert-title">PREMIUM COMPUTATION (FOR PCIC ONLY)</p>
            <div class="pcic-calc-rows">
              <div><span>Premium Rate:</span> <span>___________</span></div>
              <div><span>Farmer's Share (P):</span> <span>___________</span></div>
              <div><span>Government Premium Subsidy (GPS):</span> <span>___________</span></div>
              <div><span>Lending Institution Share (LI):</span> <span>___________</span></div>
              <div><span>Gross Premium (GP):</span> <span>___________</span></div>
              <div><span>Net Premium (due to PCIC):</span> <span>___________</span></div>
            </div>
          </div>

          <div class="footer-box-right">
            <p class="cert-title">FOR PCIC ONLY</p>
            <p class="small-text">CIC No: ____________</p>
            <p class="small-text">Date Issued: ____________</p>
            <p class="small-text">Crop: [ ] RICE [ ] CORN [ ] HVC</p>
            <p class="small-text">Phase: Wet / Dry</p>
          </div>
        </div>

        <div class="page-number-footer">PAGE 1 OF 2</div>
      </div>

      <div class="page-break"></div>

      <!-- Page 2 Form Header and Grid -->
      <div class="pcic-page-container">
        <div class="pcic-header text-center">
          <h2 class="form-title">APPLICATION FOR CROP INSURANCE</h2>
          <p class="group-sub">(Group Application)</p>
        </div>

        <table class="pcic-grid-table page2-table">
          <thead>
            <tr>
              <th rowspan="2" class="col-xs">No.</th>
              <th rowspan="2">NAME OF FARMER<br><small>(First Name initials, Middle initial, Full Surname and Suffix)</small></th>
              <th rowspan="2">DA-RSBSA GEOREF ID /<br>PCIC FARM ID</th>
              <th rowspan="2">LOCATION OF FARM<br>(Barangay)</th>
              <th rowspan="2">AREA<br>(ha)</th>
              <th rowspan="2">LAND CATEGORY<br>/ SOIL TYPE</th>
              <th rowspan="2">TENURIAL<br>STATUS</th>
              <th colspan="4">BOUNDARIES / ADJACENT LOT OWNERS</th>
            </tr>
            <tr>
              <th>North</th>
              <th>South</th>
              <th>East</th>
              <th>West</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="index in 15" :key="'p2-' + index">
              <td>{{ index }}</td>
              <td>
                <template v-if="getBatchItem(index - 1)">
                  {{ formatShortName(getBatchItem(index - 1)?.farm?.farmer_profile?.user) }}
                </template>
              </td>
              <td></td>
              <td>{{ truncateAddress(getBatchItem(index - 1)?.farm?.farmer_profile?.address) }}</td>
              <td>{{ getBatchItem(index - 1)?.farm?.farm_area || '' }}</td>
              <td>{{ getLandCategoryCode(getBatchItem(index - 1)) }}</td>
              <td>{{ getTenurialStatusCode(getBatchItem(index - 1)) }}</td>
              <td>{{ getBatchItem(index - 1)?.north_boundary || '' }}</td>
              <td>{{ getBatchItem(index - 1)?.south_boundary || '' }}</td>
              <td>{{ getBatchItem(index - 1)?.east_boundary || '' }}</td>
              <td>{{ getBatchItem(index - 1)?.west_boundary || '' }}</td>
            </tr>
            <tr class="row-total">
              <td colspan="4" class="text-right"><strong>TOTAL AREA (ha)</strong></td>
              <td><strong>{{ totalBatchArea }}</strong></td>
              <td colspan="6"></td>
            </tr>
          </tbody>
        </table>

        <!-- Page 2 Legends & Official Signatures Section -->
        <div class="pcic-p2-footer">
          <div class="legends-container">
            <div class="legend-box">
              <strong>LAND CATEGORY / SOIL TYPE LEGEND (For Rice):</strong>
              <div class="legend-grid">
                <span>1 - Irrigated</span>
                <span>2 - Rainfed Lowland</span>
                <span>3 - Rainfed Upland</span>
              </div>
            </div>

            <div class="legend-box">
              <strong>TENURIAL STATUS LEGEND:</strong>
              <div class="legend-grid">
                <span>1 - Owner</span>
                <span>2 - Lessee</span>
                <span>3 - Tenant / Other</span>
              </div>
            </div>
          </div>

          <div class="signatures-container">
            <div class="signature-box">
              <p class="sig-label">Prepared / Certified Correct by:</p>
              <div class="sig-line"></div>
              <p class="sig-title">Municipal Agricultural Officer (MAO) / Authorized Representative</p>
              <p class="sig-sub">Signature over Printed Name / Date</p>
            </div>

            <div class="signature-box">
              <p class="sig-label">Approved by (PCIC Regional Office):</p>
              <div class="sig-line"></div>
              <p class="sig-title">Underwriter / Authorized Official</p>
              <p class="sig-sub">Signature over Printed Name / Date</p>
            </div>
          </div>
        </div>

        <div class="page-number-footer">PAGE 2 OF 2</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CropInsurancePage',
  data() {
    return {
      // Tab & Filtering
      activeAppTab: 'current', // 'current' | 'history'
      searchName: '',
      filterCrop: '',
      filterStatus: '',
      historySeasonId: '',

      // Selection & Bulk Actions
      selectedIds: [],
      hasPrintedCurrentBatch: false,

      // UI States
      isLoading: false,
      isRefreshing: false,
      errorMessage: '',
      expandedId: null,
      isPrintingPcicBatch: false,

      // Auto Refresh Config
      autoRefresh: false,
      refreshIntervalSeconds: 15,
      refreshTimer: null,
      lastRefreshedAt: null,

      // Active Insurance Season State
      hasConfiguredSeason: true,
      currentSeason: {
        id: 'season-2026-wet',
        season_name: 'Wet Season 2026',
        deadline_date: '2026-09-30',
        status: 'application_open'
      },
      previousSeasons: [
        { id: 'season-2025-dry', season_name: 'Dry Season 2025' },
        { id: 'season-2025-wet', season_name: 'Wet Season 2025' }
      ],

      // Season Modal State
      showSeasonModal: false,
      isStartingNewSeason: false,
      savingSeason: false,
      seasonModalError: '',
      seasonForm: {
        season_name: '',
        deadline_date: ''
      },

      // Payment Verification Modal
      showVerifyModal: false,
      verifyingApp: null,
      verifyDecision: 'approve', // 'approve' | 'reject'
      verifyRemarks: '',
      savingVerify: false,
      verifyModalError: '',

      // Status filters definition
      statusFilters: [
        { label: 'All', value: '' },
        { label: 'Pending MAO', value: 'submitted_to_mao' },
        { label: 'Ready for PCIC', value: 'approved_for_pcic' },
        { label: 'At PCIC Evaluation', value: 'submitted_to_pcic' },
        { label: 'Needs Revision', value: 'needs_revision' },
        { label: 'Insured', value: 'insured' },
        { label: 'Rejected', value: 'rejected' }
      ],

      // Sample Applications Registry Data
      applications: [
        {
          id: 'app-001',
          season_id: 'season-2026-wet',
          status: 'submitted_to_mao',
          application_date: '2026-07-15',
          requires_payment: false,
          payment_verified: false,
          payment_proof_url: null,
          variety: 'NSIC Rc 222',
          farm_type: 'Irrigated',
          sowing_date: '2026-06-10',
          transplanting_date: '2026-07-01',
          beneficiary_name: 'Maria Santos',
          civil_status: 'Married',
          north_boundary: 'Juan Dela Cruz',
          south_boundary: 'River Canal',
          east_boundary: 'Pedro Ramos',
          west_boundary: 'Barangay Road',
          is_land_owner: true,
          tenure_status: 'Owner',
          land_category: '1', // Irrigated
          farm: {
            farm_name: 'Green Field 1',
            crop_type: 'Rice',
            farm_area: '1.5',
            farmer_profile: {
              rsbsa_no: '02-1234-5678',
              address: 'Brgy. San Fabian, Echague, Isabela',
              user: {
                first_name: 'Juan',
                middle_name: 'Perez',
                last_name: 'Santos',
                extension_name: '',
                email: 'juan.santos@example.com',
                phone_number: '09171234567'
              }
            }
          }
        },
        {
          id: 'app-002',
          season_id: 'season-2026-wet',
          status: 'approved_for_pcic',
          application_date: '2026-07-18',
          requires_payment: true,
          payment_verified: true,
          payment_proof_url: 'https://via.placeholder.com/600x800.png?text=Payment+Receipt+Ref+100234',
          payment_remarks: 'Verified reference #100234',
          variety: 'Pioneer 30T80',
          farm_type: 'Rainfed',
          sowing_date: '2026-06-15',
          transplanting_date: '',
          beneficiary_name: 'Ana Reyes',
          civil_status: 'Married',
          north_boundary: 'Farm Lot 12',
          south_boundary: 'Creek',
          east_boundary: 'Road',
          west_boundary: 'Lot 14',
          is_land_owner: false,
          tenure_status: 'Tenant',
          land_category: '2', // Rainfed Lowland
          farm: {
            farm_name: 'Cornland Alpha',
            crop_type: 'Corn',
            farm_area: '2.0',
            farmer_profile: {
              rsbsa_no: '02-8765-4321',
              address: 'Brgy. Ugad, Echague, Isabela',
              user: {
                first_name: 'Carlos',
                middle_name: 'D',
                last_name: 'Reyes',
                extension_name: 'Jr.',
                email: 'carlos.reyes@example.com',
                phone_number: '09189876543'
              }
            }
          }
        }
      ]
    };
  },

  computed: {
    // Current Active Application Batch based on Active Tab & Filters
    activeApplications() {
      if (this.activeAppTab === 'history') {
        if (this.historySeasonId) {
          return this.applications.filter(a => a.season_id === this.historySeasonId);
        }
        return this.applications.filter(a => a.season_id !== this.currentSeason?.id);
      }
      return this.applications.filter(a => a.season_id === this.currentSeason?.id);
    },

    filtered() {
      return this.activeApplications.filter(app => {
        // Name Search
        const name = this.farmerName(app).toLowerCase();
        const matchesName = !this.searchName || name.includes(this.searchName.toLowerCase());

        // Crop Type
        const crop = app.farm?.crop_type || '';
        const matchesCrop = !this.filterCrop || crop.toLowerCase() === this.filterCrop.toLowerCase();

        // Status
        const matchesStatus = !this.filterStatus || app.status === this.filterStatus;

        return matchesName && matchesCrop && matchesStatus;
      });
    },

    // Selected Items Object Array
    selectedApplications() {
      return this.applications.filter(a => this.selectedIds.includes(a.id));
    },

    // Enforce uniform single-status selection
    selectedStatus() {
      if (this.selectedApplications.length === 0) return null;
      const firstStatus = this.selectedApplications[0].status;
      const hasMixed = this.selectedApplications.some(a => a.status !== firstStatus);
      return hasMixed ? null : firstStatus;
    },

    // Filtered applications eligible for checkboxes
    selectableFiltered() {
      return this.filtered.filter(app => !this.isTerminal(app.status));
    },

    allFilteredSelected() {
      if (this.selectableFiltered.length === 0) return false;
      return this.selectableFiltered.every(app => this.selectedIds.includes(app.id));
    },

    hasPcicPreparations() {
      return this.countByStatus('approved_for_pcic') > 0;
    },

    // Batch Print Area Calculations
    totalBatchArea() {
      const sourceList = this.selectedIds.length > 0 ? this.selectedApplications : this.filtered;
      const total = sourceList.reduce((sum, item) => {
        const val = parseFloat(item.farm?.farm_area) || 0;
        return sum + val;
      }, 0);
      return total.toFixed(2);
    }
  },

  mounted() {
    this.lastRefreshedAt = new Date();
  },

  beforeUnmount() {
    this.stopAutoRefresh();
  },

  methods: {
    // Utility Helpers
    farmerName(app) {
      if (!app?.farm?.farmer_profile?.user) return '—';
      const u = app.farm.farmer_profile.user;
      return `${u.first_name || ''} ${u.middle_name ? u.middle_name + ' ' : ''}${u.last_name || ''} ${u.extension_name || ''}`.trim();
    },

    formatShortName(u) {
      if (!u) return '';
      const fInitial = u.first_name ? u.first_name.charAt(0) + '.' : '';
      const mInitial = u.middle_name ? u.middle_name.charAt(0) + '.' : '';
      const ext = u.extension_name ? ' ' + u.extension_name : '';
      return `${fInitial} ${mInitial} ${u.last_name || ''}${ext}`.trim();
    },

    truncateAddress(addr) {
      if (!addr) return '—';
      return addr.length > 30 ? addr.substring(0, 27) + '...' : addr;
    },

    formatDate(dateStr) {
      if (!dateStr) return '—';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    formatTime(dateObj) {
      if (!dateObj) return '';
      return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    },

    statusLabel(status) {
      const map = {
        submitted_to_mao: 'Pending MAO Review',
        approved_for_pcic: 'To be Submitted to PCIC',
        submitted_to_pcic: 'Submitted to PCIC',
        needs_revision: 'Needs Revision',
        insured: 'Insured',
        rejected: 'Rejected'
      };
      return map[status] || status;
    },

    isTerminal(status) {
      return status === 'insured' || status === 'rejected';
    },

    countByStatus(statusKey) {
      return this.activeApplications.filter(a => a.status === statusKey).length;
    },

    getLandCategoryCode(app) {
      if (!app) return '';
      if (app.land_category) return app.land_category;
      if (app.farm_type === 'Irrigated') return '1';
      if (app.farm_type === 'Rainfed') return '2';
      return '3';
    },

    getTenurialStatusCode(app) {
      if (!app) return '';
      if (app.tenure_status === 'Owner' || app.is_land_owner) return '1';
      if (app.tenure_status === 'Lessee') return '2';
      return '3';
    },

    getBatchItem(index) {
      const list = this.selectedIds.length > 0 ? this.selectedApplications : this.filtered;
      return list[index] || null;
    },

    // Row & Selection Logic
    toggleExpand(id) {
      this.expandedId = this.expandedId === id ? null : id;
    },

    isSelected(id) {
      return this.selectedIds.includes(id);
    },

    isCheckboxDisabled(app) {
      if (this.isTerminal(app.status)) return true;
      if (this.selectedIds.length === 0) return false;
      return this.selectedStatus && app.status !== this.selectedStatus;
    },

    toggleSelection(id) {
      const idx = this.selectedIds.indexOf(id);
      if (idx > -1) {
        this.selectedIds.splice(idx, 1);
      } else {
        this.selectedIds.push(id);
      }
      this.hasPrintedCurrentBatch = false;
    },

    toggleSelectAllFiltered() {
      if (this.allFilteredSelected) {
        const currentFilteredIds = this.selectableFiltered.map(a => a.id);
        this.selectedIds = this.selectedIds.filter(id => !currentFilteredIds.includes(id));
      } else {
        const toAdd = this.selectableFiltered
          .filter(a => !this.selectedStatus || a.status === this.selectedStatus)
          .map(a => a.id);
        this.selectedIds = Array.from(new Set([...this.selectedIds, ...toAdd]));
      }
      this.hasPrintedCurrentBatch = false;
    },

    clearSelection() {
      this.selectedIds = [];
      this.hasPrintedCurrentBatch = false;
    },

    switchTab(tab) {
      this.activeAppTab = tab;
      this.clearSelection();
    },

    resetFilters() {
      this.searchName = '';
      this.filterCrop = '';
      this.filterStatus = '';
      this.historySeasonId = '';
    },

    // Data Actions
    updateAppStatus(id, newStatus) {
      const item = this.applications.find(a => a.id === id);
      if (item) {
        item.status = newStatus;
      }
    },

    bulkUpdateStatus(newStatus) {
      this.applications.forEach(app => {
        if (this.selectedIds.includes(app.id)) {
          app.status = newStatus;
        }
      });
      this.clearSelection();
    },

    // Auto Refresh Logic
    onToggleAutoRefresh() {
      if (this.autoRefresh) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    },

    startAutoRefresh() {
      this.stopAutoRefresh();
      this.refreshTimer = setInterval(() => {
        this.manualRefresh();
      }, this.refreshIntervalSeconds * 1000);
    },

    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    },

    manualRefresh() {
      this.isRefreshing = true;
      setTimeout(() => {
        this.lastRefreshedAt = new Date();
        this.isRefreshing = false;
      }, 600);
    },

    // Season Modal Actions
    openSeasonModal() {
      this.isStartingNewSeason = false;
      this.seasonForm.season_name = this.currentSeason?.season_name || '';
      this.seasonForm.deadline_date = this.currentSeason?.deadline_date || '';
      this.seasonModalError = '';
      this.showSeasonModal = true;
    },

    openNewSeasonModal() {
      this.isStartingNewSeason = true;
      this.seasonForm.season_name = '';
      this.seasonForm.deadline_date = '';
      this.seasonModalError = '';
      this.showSeasonModal = true;
    },

    closeSeasonModal() {
      this.showSeasonModal = false;
    },

    saveSeason() {
      if (!this.seasonForm.season_name || !this.seasonForm.deadline_date) {
        this.seasonModalError = 'Please fill in all season configuration fields.';
        return;
      }

      this.savingSeason = true;
      setTimeout(() => {
        if (this.isStartingNewSeason) {
          if (this.currentSeason) {
            this.previousSeasons.unshift({ ...this.currentSeason });
          }
          this.currentSeason = {
            id: 'season-' + Date.now(),
            season_name: this.seasonForm.season_name,
            deadline_date: this.seasonForm.deadline_date,
            status: 'application_open'
          };
        } else {
          this.currentSeason.season_name = this.seasonForm.season_name;
          this.currentSeason.deadline_date = this.seasonForm.deadline_date;
        }

        this.hasConfiguredSeason = true;
        this.savingSeason = false;
        this.showSeasonModal = false;
      }, 500);
    },

    closeSeason() {
      if (confirm('Are you sure you want to close the current active insurance season?')) {
        this.currentSeason.status = 'closed';
      }
    },

    currentSeasonName(app) {
      if (app.season_id === this.currentSeason?.id) {
        return this.currentSeason.season_name;
      }
      const prev = this.previousSeasons.find(s => s.id === app.season_id);
      return prev ? prev.season_name : 'Archived Season';
    },

    // Payment Verification Modal Actions
    openVerifyModal(app) {
      this.verifyingApp = app;
      this.verifyDecision = 'approve';
      this.verifyRemarks = app.payment_remarks || '';
      this.verifyModalError = '';
      this.showVerifyModal = true;
    },

    closeVerifyModal() {
      this.showVerifyModal = false;
      this.verifyingApp = null;
    },

    submitPaymentVerification() {
      if (this.verifyDecision === 'reject' && !this.verifyRemarks.trim()) {
        this.verifyModalError = 'Remarks are required when rejecting payment proof.';
        return;
      }

      this.savingVerify = true;
      setTimeout(() => {
        if (this.verifyingApp) {
          if (this.verifyDecision === 'approve') {
            this.verifyingApp.payment_verified = true;
            this.verifyingApp.payment_remarks = this.verifyRemarks;
            this.verifyingApp.status = 'approved_for_pcic';
          } else {
            this.verifyingApp.payment_verified = false;
            this.verifyingApp.payment_remarks = this.verifyRemarks;
            this.verifyingApp.status = 'needs_revision';
          }
        }
        this.savingVerify = false;
        this.closeVerifyModal();
      }, 500);
    },

    // Printing Operations
    printPcicBatchManifest() {
      this.isPrintingPcicBatch = true;
      this.hasPrintedCurrentBatch = true;
      this.$nextTick(() => {
        window.print();
        this.isPrintingPcicBatch = false;
      });
    },

    printSelectedPcicBatch() {
      this.printPcicBatchManifest();
    }
  }
};
</script>

<style scoped>
.insurance-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  background-color: #f8fafc;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.page-sub {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* Season Display Card */
.season-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #10b981;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.season-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.season-icon {
  font-size: 24px;
  background: #ecfdf5;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.season-text {
  display: flex;
  flex-direction: column;
}

.season-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  font-weight: 600;
}

.season-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.season-actions {
  display: flex;
  gap: 10px;
}

/* Setup Card Fallback */
.setup-card {
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  max-width: 480px;
  margin: 40px auto;
}

.setup-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.setup-form {
  margin-top: 20px;
  text-align: left;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #0284c7;
  border-bottom-color: #0284c7;
}

/* Refresh Bar */
.refresh-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 16px;
}

.refresh-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #cbd5e1;
}

.refresh-dot.live {
  background-color: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.refresh-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-icon-refresh {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.spinning {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Filters & Controls */
.filters-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-wrap {
  flex: 1;
  min-width: 220px;
}

.search-input, .filter-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  background-color: #ffffff;
}

.status-filter-row {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.status-filter-tag {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-filter-tag.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.sf-count {
  background: rgba(0,0,0,0.08);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
}

.status-filter-tag.active .sf-count {
  background: rgba(255,255,255,0.25);
}

/* Bulk Action Bar */
.bulk-action-bar.floating {
  position: sticky;
  top: 16px;
  z-index: 100;
  background: #0f172a;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

.bulk-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bulk-warning {
  font-size: 13px;
  color: #fde047;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.print-required-notice {
  font-size: 12px;
  color: #fca5a5;
}

.bulk-terminal-note {
  font-size: 13px;
  color: #94a3b8;
}

/* Stat Cards Matrix */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-top: 4px;
}

.stat-value.mao { color: #d97706; }
.stat-value.pcic { color: #0284c7; }
.stat-value.review { color: #8b5cf6; }
.stat-value.revision { color: #dc2626; }
.stat-value.insured { color: #10b981; }
.stat-value.rejected { color: #64748b; }

/* Main Table Styling */
.table-wrap {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.app-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.app-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.app-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.main-row {
  cursor: pointer;
  transition: background-color 0.15s;
}

.main-row:hover {
  background-color: #f8fafc;
}

.main-row.selected {
  background-color: #f0f9ff;
}

.expand-cell {
  width: 24px;
  text-align: center;
}

.expand-icon {
  display: inline-block;
  font-size: 10px;
  transition: transform 0.2s;
  color: #94a3b8;
}

.expand-icon.open {
  transform: rotate(90deg);
  color: #0284c7;
}

.farmer-name {
  font-weight: 600;
  color: #0f172a;
}

.farmer-sub {
  font-size: 11px;
  color: #64748b;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.submitted_to_mao { background: #fef3c7; color: #92400e; }
.status-badge.approved_for_pcic { background: #e0f2fe; color: #075985; }
.status-badge.submitted_to_pcic { background: #ede9fe; color: #5b21b6; }
.status-badge.needs_revision { background: #fee2e2; color: #991b1b; }
.status-badge.insured { background: #d1fae5; color: #065f46; }
.status-badge.rejected { background: #f1f5f9; color: #475569; }

/* Payment Badges */
.pay-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}
.pay-badge.free { background: #f1f5f9; color: #475569; }
.pay-badge.verified { background: #dcfce7; color: #166534; }
.pay-badge.pending { background: #fef9c3; color: #854d0e; }

/* Detail Accordion Panel */
.detail-row td {
  background-color: #f8fafc;
  padding: 0;
}

.detail-box {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.detail-actions-panel {
  background: #ffffff;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.action-sub-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-hint {
  font-size: 12px;
  color: #64748b;
  font-style: italic;
}

.detail-grid-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.detail-section {
  background: #ffffff;
  padding: 14px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #0284c7;
  margin-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item.full-width {
  grid-column: span 2;
}

.detail-label {
  font-size: 11px;
  color: #64748b;
}

.detail-val {
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
}

/* Buttons */
button {
  font-family: inherit;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-season-primary, .btn-modal-save {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  font-size: 13px;
}

.btn-season-secondary, .btn-reset, .btn-modal-cancel {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 8px 16px;
  font-size: 13px;
}

.btn-season-danger {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #e11d48;
  padding: 8px 16px;
  font-size: 13px;
}

.btn-print-pcic {
  background: #059669;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  font-size: 13px;
}

.btn-action-approve {
  background: #0284c7;
  color: white;
  border: none;
  padding: 6px 12px;
  font-size: 12px;
}

.btn-action-submit-pcic {
  background: #7c3aed;
  color: white;
  border: none;
  padding: 6px 12px;
  font-size: 12px;
}

.btn-action-submit-pcic:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-action-finalize {
  background: #059669;
  color: white;
  border: none;
  padding: 6px 12px;
  font-size: 12px;
}

.btn-action-reject {
  background: #dc2626;
  color: white;
  border: none;
  padding: 6px 12px;
  font-size: 12px;
}

.btn-action-verify, .btn-inline-verify {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 6px 12px;
  font-size: 12px;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-box {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.verify-modal {
  max-width: 520px;
}

.modal-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #0f172a;
}

.modal-field {
  margin-bottom: 16px;
}

.modal-field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.modal-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  box-sizing: border-box;
}

.textarea-remarks {
  resize: vertical;
}

.decision-toggle-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn-decision {
  padding: 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.btn-decision.approve.active {
  background: #dcfce7;
  color: #15803d;
  border-color: #86efac;
}

.btn-decision.reject.active {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fca5a5;
}

.proof-preview-container {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  margin-bottom: 16px;
}

.proof-image-preview {
  max-height: 200px;
  max-width: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.proof-click-hint {
  display: block;
  font-size: 11px;
  color: #0284c7;
  margin-top: 6px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.modal-error {
  color: #dc2626;
  font-size: 12px;
  margin-top: 8px;
}

/* Printable Official PCIC Form Layout Styling */
.print-area {
  display: none;
}

@media print {
  body * {
    visibility: hidden;
  }
  
  .print-area, .print-area * {
    visibility: visible;
  }

  .print-area {
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    color: #000;
    background: #fff;
    font-family: Arial, sans-serif;
    font-size: 10px;
  }

  .pcic-page-container {
    padding: 10mm;
    box-sizing: border-box;
    height: 100vh;
    position: relative;
  }

  .page-break {
    page-break-before: always;
  }

  .text-center { text-align: center; }
  .text-right { text-align: right; }

  .pcic-header h3 { font-size: 14px; margin: 0; font-weight: bold; }
  .pcic-header .subtitle { font-size: 11px; margin: 2px 0; }
  .pcic-header .form-title { font-size: 16px; margin: 4px 0 0 0; text-decoration: underline; font-weight: bold; }
  .pcic-header .group-sub { font-size: 11px; margin: 0 0 10px 0; font-style: italic; }

  .pcic-meta-grid {
    border: 1px solid #000;
    padding: 6px;
    margin-bottom: 8px;
  }

  .meta-row {
    margin-bottom: 4px;
    font-size: 10px;
  }

  .split-row {
    display: flex;
    justify-content: space-between;
  }

  .inline-checks label {
    margin-right: 8px;
  }

  .margin-left {
    margin-left: 16px;
  }

  .pcic-grid-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
  }

  .pcic-grid-table th, .pcic-grid-table td {
    border: 1px solid #000;
    padding: 3px 2px;
    text-align: center;
    font-size: 9px;
  }

  .pcic-grid-table th {
    background-color: #f2f2f2 !important;
    -webkit-print-color-adjust: exact;
    font-weight: bold;
  }

  .col-xs {
    width: 20px;
  }

  .row-total td {
    font-weight: bold;
  }

  .pcic-footer-grid {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr;
    gap: 8px;
    border: 1px solid #000;
    padding: 6px;
  }

  .cert-title {
    font-weight: bold;
    font-size: 9px;
    margin: 0 0 4px 0;
    text-decoration: underline;
  }

  .cert-text {
    font-size: 8px;
    margin: 0 0 4px 0;
    line-height: 1.1;
  }

  .pcic-calc-rows div {
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    margin-bottom: 2px;
  }

  .small-text {
    font-size: 8px;
    margin: 2px 0;
  }

  /* Page 2 Specific Footer Layout */
  .pcic-p2-footer {
    margin-top: 12px;
  }

  .legends-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    border: 1px solid #000;
    padding: 6px;
    margin-bottom: 20px;
    font-size: 9px;
  }

  .legend-grid {
    display: flex;
    gap: 12px;
    margin-top: 4px;
  }

  .signatures-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-top: 30px;
    text-align: center;
  }

  .sig-line {
    border-bottom: 1px solid #000;
    margin: 35px 20px 4px 20px;
  }

  .sig-title {
    font-weight: bold;
    font-size: 10px;
    margin: 0;
  }

  .sig-sub {
    font-size: 8px;
    color: #333;
    margin: 2px 0 0 0;
  }

  .page-number-footer {
    position: absolute;
    bottom: 8mm;
    right: 10mm;
    font-size: 9px;
    font-weight: bold;
  }
}
</style>
