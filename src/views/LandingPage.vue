<template>
  <div class="portal-wrapper">
    <div class="bg-grid"></div>
    <div class="bg-accent bg-accent--tr"></div>
    <div class="bg-accent bg-accent--bl"></div>

    <div class="portal-inner">
      <!-- Header -->
      <div class="portal-header">
        <div class="brand">
          <div class="logo-mark"><span>M</span></div>
          <div class="brand-text">
            <h1>MAO</h1>
            <p>Admin Portal</p>
          </div>
        </div>
        <h2>Municipal Agricultural Office</h2>
        <p>Select your portal to continue. Access is restricted to authorized personnel only.</p>
      </div>

      <!-- Cards -->
      <div class="portal-cards">
        <!-- MAO Admin Card -->
        <div class="card card--mao" @click="$router.push({ name: 'login' })">
          <div class="badge badge--green">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Admin Access
          </div>
          <div class="icon-ring icon-ring--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="#34a853" stroke-width="1.6">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p class="card-sub">MAO Staff</p>
          <h3 class="card-title">Admin Portal</h3>
          <p class="card-desc">For MAO administrators and staff managing agricultural programs, records, and operations.</p>
          <button class="card-btn card-btn--green" type="button" @click.stop="$router.push({ name: 'login' })">
            Continue as MAO Admin
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
            <svg viewBox="0 0 24 24" fill="none" stroke="#4285f4" stroke-width="1.6">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <p class="card-sub">Barangay Official</p>
          <h3 class="card-title">Official Portal</h3>
          <p class="card-desc">For barangay officials accessing agricultural data, reports, and services for their community.</p>
          <button class="card-btn card-btn--blue" type="button" @click.stop="$router.push({ name: 'barangay-login' })">
            Continue as Barangay Official
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="portal-footer">
        <p>MAO Admin System &copy; {{ currentYear }} &middot; Municipal Agricultural Office</p>
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
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.portal-wrapper {
  min-height: 100vh;
  background: #0c1a0e;
  display: flex; align-items: center; justify-content: center;
  padding: 2rem;
  font-family: 'DM Sans', sans-serif;
  position: relative; overflow: hidden;
}

.bg-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(52, 168, 83, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(52, 168, 83, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
}

.bg-accent--tr {
  position: absolute; width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(52,168,83,.1) 0%, transparent 70%);
  top: -120px; right: -120px; pointer-events: none;
}

.bg-accent--bl {
  position: absolute; width: 400px; height: 400px; border-radius: 50%;
  background: radial-gradient(circle, rgba(52,168,83,.07) 0%, transparent 70%);
  bottom: -80px; left: -80px; pointer-events: none;
}

.portal-inner {
  position: relative; z-index: 1;
  width: 100%; max-width: 860px;
  display: flex; flex-direction: column; align-items: center; gap: 3rem;
}

/* Header */
.portal-header { text-align: center; }

.brand {
  display: flex; align-items: center; justify-content: center;
  gap: 14px; margin-bottom: 2rem;
}

.logo-mark {
  width: 56px; height: 56px; background: #34a853;
  border-radius: 16px; display: flex; align-items: center; justify-content: center;
}
.logo-mark span { font-family: 'DM Serif Display', serif; font-size: 28px; color: #fff; }

.brand-text h1 { font-family: 'DM Serif Display', serif; font-size: 24px; color: #e8f5e9; letter-spacing: 3px; }
.brand-text p  { font-size: 11px; color: rgba(52,168,83,.7); letter-spacing: 2px; text-transform: uppercase; margin-top: 3px; }

.portal-header h2 { font-family: 'DM Serif Display', serif; font-size: 32px; color: #c8e6c9; line-height: 1.3; margin-bottom: .75rem; }
.portal-header p  { font-size: 15px; color: rgba(200,230,201,.55); max-width: 420px; margin: 0 auto; line-height: 1.7; }

/* Cards */
.portal-cards {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 1.5rem; width: 100%;
}

.card {
  background: rgba(255,255,255,.04);
  border-radius: 20px; padding: 2.5rem 2rem;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  cursor: pointer; transition: background .25s, border-color .25s, transform .15s;
}

.card--mao { border: 1px solid rgba(52,168,83,.18); }
.card--brgy { border: 1px solid rgba(66,133,244,.18); }

.card--mao:hover { background: rgba(52,168,83,.08); border-color: rgba(52,168,83,.45); transform: translateY(-4px); }
.card--brgy:hover { background: rgba(66,133,244,.08); border-color: rgba(66,133,244,.45); transform: translateY(-4px); }

.badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px; padding: 4px 10px; border-radius: 20px; margin-bottom: 1.25rem;
}
.badge--green { background: rgba(52,168,83,.12); color: rgba(52,168,83,.9); border: 1px solid rgba(52,168,83,.2); }
.badge--blue  { background: rgba(66,133,244,.12); color: rgba(66,133,244,.9); border: 1px solid rgba(66,133,244,.2); }

.icon-ring {
  width: 80px; height: 80px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;
}
.icon-ring svg { width: 36px; height: 36px; }
.icon-ring--green { background: rgba(52,168,83,.15); border: 1.5px solid rgba(52,168,83,.3); }
.icon-ring--blue  { background: rgba(66,133,244,.15); border: 1.5px solid rgba(66,133,244,.3); }

.card--mao:hover .icon-ring--green { background: rgba(52,168,83,.25); border-color: rgba(52,168,83,.5); }
.card--brgy:hover .icon-ring--blue { background: rgba(66,133,244,.25); border-color: rgba(66,133,244,.5); }

.card-sub   { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600; margin-bottom: 1rem; }
.card--mao .card-sub { color: #34a853; }
.card--brgy .card-sub { color: #4285f4; }

.card-title { font-family: 'DM Serif Display', serif; font-size: 22px; color: #e8f5e9; margin-bottom: .5rem; }
.card-desc  { font-size: 13.5px; color: rgba(200,230,201,.5); line-height: 1.65; margin-bottom: 1.75rem; }

.card-btn {
  width: 100%; padding: 11px; border-radius: 10px; border: none;
  font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 8px; transition: background .2s, transform .1s; color: #fff;
}
.card-btn:active { transform: scale(.98); }
.card-btn--green { background: #34a853; }
.card-btn--green:hover { background: #2a9248; }
.card-btn--blue  { background: #4285f4; }
.card-btn--blue:hover  { background: #3070d6; }

/* Footer */
.portal-footer { text-align: center; }
.portal-footer p { font-size: 12px; color: rgba(200,230,201,.3); line-height: 1.7; }

@media (max-width: 600px) {
  .portal-cards { grid-template-columns: 1fr; }
  .portal-header h2 { font-size: 24px; }
}
</style>