<script setup>
/* global defineProps */

/**
 * Generic Chart.js wrapper.
 * npm install chart.js
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  type: { type: String, default: 'bar' }, // bar | pie | doughnut | line
  chartData: { type: Object, required: true }, // { labels: [], datasets: [] }
  chartOptions: { type: Object, default: () => ({}) },
  height: { type: Number, default: 280 },
})

const canvasRef = ref(null)
let chartInstance = null

function renderChart() {
  if (!canvasRef.value) return
  if (chartInstance) chartInstance.destroy()
  chartInstance = new Chart(canvasRef.value, {
    type: props.type,
    data: props.chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      ...props.chartOptions,
    },
  })
}

onMounted(renderChart)
watch(() => [props.chartData, props.type], renderChart, { deep: true })
onBeforeUnmount(() => {
  if (chartInstance) chartInstance.destroy()
})
</script>

<template>
  <div :style="{ height: height + 'px', position: 'relative' }">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>