<template>
  <div id="pdf-download-area" class="pdf-export-container">
    <div class="print-letterhead">
      <h1>Office of the Municipal Agriculture Office</h1>
      <h2>PCIC Master Batch Endorsement Transmittal Manifest</h2>
      <p>
        <strong>Target Insurance Season Window:</strong>
        {{ seasonName }}
      </p>
      <p>
        <strong>Transmittal Dispatch Date:</strong>
        {{ formatDate(new Date()) }}
      </p>
    </div>

    <div class="print-divider"></div>

    <table class="print-batch-table">
      <thead>
        <tr>
          <th>App ID</th>
          <th>Farmer Legal Name</th>
          <th>Barangay Location</th>
          <th>Commodity</th>
          <th>Farm Area</th>
          <th>Sowing Date</th>
          <th>Tenure Position</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="app in pcicBatchList" :key="app.id">
          <td>{{ app.id }}</td>
          <td>{{ farmerName(app) }}</td>
          <td>{{ truncateAddress(app.farm?.farmer_profile?.address) }}</td>
          <td>{{ app.farm ? app.farm.crop_type : '' }} ({{ app.variety || '' }})</td>
          <td>{{ app.farm ? app.farm.farm_area : '' }} ha</td>
          <td>{{ formatDate(app.sowing_date) }}</td>
          <td>{{ app.tenure_status || 'Owner' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import html2pdf from 'html2pdf.js'

export default {
  name: 'PcicPdf',
  props: {
    pcicBatchList: {
      type: Array,
      required: true,
    },
    currentSeason: {
      type: Object,
      default: null,
    },
  },
  computed: {
    seasonName() {
      return this.currentSeason ? this.currentSeason.season_name : 'All Seasons'
    },
  },
  methods: {
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

    formatDate(date) {
      if (!date) return '—'
      return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },

    async generate(filename) {
      await this.$nextTick()
      // Give browser extra repaint delay to ensure DOM text & tables are rendered
      await new Promise((resolve) => setTimeout(resolve, 300))

      const element = document.getElementById('pdf-download-area')

      console.log(element)
        console.log(element.offsetWidth)
        console.log(element.offsetHeight)
        console.log(element.getBoundingClientRect())
      if (!element) {
        throw new Error('PDF element not found in DOM')
      }

      const opt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 1050,
          onclone: (clonedDoc) => {
            // Force cloned element visible at origin for clean canvas rendering
            const clonedEl = clonedDoc.getElementById('pdf-download-area')
            if (clonedEl) {
              clonedEl.style.position = 'static'
              clonedEl.style.left = '0'
              clonedEl.style.top = '0'
              clonedEl.style.visibility = 'visible'
              clonedEl.style.opacity = '1'
            }
          },
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      }

      await html2pdf().set(opt).from(element).save()
    },
  },
}
</script>

<style scoped>
.pdf-export-container {
    position: fixed;
    top: 0;
    left: 0;

    width: 1050px;
    background: #fff;

    opacity: 0;
    pointer-events: none;
    z-index: -1;
}

.print-letterhead { text-align: center; margin-bottom: 1rem; }
.print-letterhead h1 { font-size: 1.2rem; margin: 0 0 4px; color: #263238; }
.print-letterhead h2 { font-size: 1rem; margin: 0 0 8px; font-weight: 600; color: #263238; }
.print-letterhead p { font-size: 0.85rem; margin: 2px 0; color: #263238; }

.print-divider { border-top: 2px solid #263238; margin: 1rem 0; }

.print-batch-table { width: 100%; border-collapse: collapse; }
.print-batch-table th, .print-batch-table td { border: 1px solid #263238; padding: 8px 10px; font-size: 0.8rem; text-align: left; color: #263238; }
.print-batch-table th { background: #f5f7f5; font-weight: 700; }
</style>