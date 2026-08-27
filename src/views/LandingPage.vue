<template>
  <div class="portal-wrapper">
    <div class="bg-grid"></div>
    <div class="bg-accent bg-accent--tr"></div>
    <div class="bg-accent bg-accent--bl"></div>
 
    <div class="portal-inner">
      <!-- Header -->
      <div class="portal-header">
        <div class="brand">
          <div class="logo-mark"><span></span></div>
        </div>
        <h2>AgriSure</h2>
        <p>Digital Crop Insurance Application and Agricultural Assistance Management System for Rice and Corn Farmers. Select your portal to continue — access is restricted to authorized personnel only.</p>
      </div>
 
      <!-- Cards -->
      <div class="portal-cards">
        <!-- AgriSure Admin Card -->
        <div class="card card--mao" @click="$router.push({ name: 'login' })">
          <div class="badge badge--green">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Admin Access
          </div>
          <div class="icon-ring icon-ring--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="#116D3E" stroke-width="1.6">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p class="card-sub">AgriSure Staff</p>
          <h3 class="card-title">Admin Portal</h3>
          <p class="card-desc">For AgriSure administrators and staff managing crop insurance programs, farmer records, and agricultural assistance operations for rice and corn farmers.</p>
          <button class="card-btn card-btn--green" type="button" @click.stop="$router.push({ name: 'login' })">
            Continue as AgriSure Admin
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
 
        <!-- Barangay Official Card -->
        <div class="card card--brgy" @click="$router.push({ name: 'barangay-login' })">
          <div class="badge badge--blue">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Official Access
          </div>
          <div class="icon-ring icon-ring--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="#D29539" stroke-width="1.6">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <p class="card-sub">Barangay Official</p>
          <h3 class="card-title">Official Portal</h3>
          <p class="card-desc">For barangay officials accessing crop insurance data, assistance reports, and services for rice and corn farmers in their community.</p>
          <button class="card-btn card-btn--blue" type="button" @click.stop="$router.push({ name: 'barangay-login' })">
            Continue as Barangay Official
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </div>
 
      <div class="portal-footer">
        <p>AgriSure &copy; {{ currentYear }} &middot; Digital Crop Insurance and Agricultural Assistance Management System for Rice and Corn Farmers</p>
        <p>Authorized personnel only. Unauthorized access is prohibited.</p>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'LandingPage',
  computed: {
    currentYear() {
      return new Date().getFullYear()
    },
  },
}
</script>

<style scoped>
* { box-sizing: border-box; }
 
.portal-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: linear-gradient(135deg, #116D3E 0%, #0A5232 45%, #0F212F 100%);
  position: relative;
  overflow: hidden;
}
 
/* Faint grid texture over the gradient backdrop */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 42px 42px;
  pointer-events: none;
}
 
/* Amber / deep-green decorative squares, echoing the OTP screen's floating accents */
.bg-accent {
  position: absolute;
  border-radius: 16px;
  pointer-events: none;
}
 
.bg-accent--tr {
  width: 220px;
  height: 220px;
  top: -60px;
  right: 6%;
  background: #D29539;
  opacity: 0.14;
  transform: rotate(18deg);
}
 
.bg-accent--bl {
  width: 170px;
  height: 170px;
  bottom: -40px;
  left: 8%;
  background: #0A5232;
  opacity: 0.22;
  transform: rotate(-12deg);
}
 
.portal-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 980px;
}
 
/* HEADER */
.portal-header {
  text-align: center;
  color: #FFFFFF;
  margin-bottom: 2.75rem;
}
 
.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 1.6rem;
}
 
.logo-mark {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #D29539, #AC7A2F);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(210, 149, 57, 0.35);
}
 
.logo-mark span {
  font-size: 26px;
  font-weight: 700;
  color: #0F212F;
}
 
.brand-text h1 {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 3.5px;
  color: #FFFFFF;
}
 
.brand-text p {
  font-size: 9.5px;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.6);
  margin-top: 2px;
}
 
.portal-header h2 {
  font-size: 2.1rem;
  font-weight: 700;
  margin: 0 0 10px;
  color: #FFFFFF;
}
 
.portal-header p {
  max-width: 620px;
  margin: 0 auto;
  font-size: 0.92rem;
  line-height: 1.55;
  color: rgba(255,255,255,0.72);
}
 
/* CARDS */
.portal-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  max-width: 640px;
  margin: 0 auto;
}
 
.card {
  position: relative;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 1.4rem 1.3rem;
  text-align: left;
  cursor: pointer;
  border: 1.5px solid transparent;
  box-shadow: 0 14px 34px rgba(15, 33, 47, 0.22);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
 
.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 26px 60px rgba(15, 33, 47, 0.32);
}
 
.card--mao:hover { border-color: #116D3E; }
.card--brgy:hover { border-color: #D29539; }
 
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  margin-bottom: 0.7rem;
}
 
.badge--green { background: rgba(17, 109, 62, 0.12); color: #116D3E; }
.badge--blue  { background: rgba(210, 149, 57, 0.16); color: #AC7A2F; }
 
.icon-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.7rem;
}
 
.icon-ring svg { width: 20px; height: 20px; }
 
.icon-ring--green { background: #E7F0EC; border: 1px solid rgba(17, 109, 62, 0.18); }
.icon-ring--blue  { background: #FAF2E7; border: 1px solid rgba(210, 149, 57, 0.22); }
 
.card-sub {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #5c6b64;
  margin-bottom: 3px;
}
 
.card-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0F212F;
  margin-bottom: 6px;
}
 
.card-desc {
  font-size: 0.78rem;
  line-height: 1.45;
  color: #5c6b64;
  margin-bottom: 1rem;
}
 
.card-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 9px;
  color: #FFFFFF;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
 
.card-btn:hover { transform: translateY(-1px); }
 
.card-btn--green {
  background: linear-gradient(135deg, #116D3E, #0A5232);
  box-shadow: 0 10px 22px rgba(17, 109, 62, 0.32);
}
.card-btn--green:hover { box-shadow: 0 12px 26px rgba(17, 109, 62, 0.42); }
 
.card-btn--blue {
  background: linear-gradient(135deg, #D29539, #AC7A2F);
  box-shadow: 0 10px 22px rgba(210, 149, 57, 0.35);
}
.card-btn--blue:hover { box-shadow: 0 12px 26px rgba(210, 149, 57, 0.45); }
 
/* FOOTER */
.portal-footer {
  text-align: center;
  margin-top: 2.75rem;
  color: rgba(255,255,255,0.55);
  font-size: 0.78rem;
  line-height: 1.6;
}
 
@media (max-width: 720px) {
  .portal-cards { grid-template-columns: 1fr; }
  .portal-header h2 { font-size: 1.6rem; }
}
</style>