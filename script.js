/* ============================================================
   LUMINA v3 — script.js
   Auth: Admin & Student are completely separate
   Admin: add / edit / delete events + student dashboard
   Student: browse events + register + download certificate
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════
   1. INITIAL DATA
══════════════════════════════════════════════ */

const ADMIN_CREDENTIALS = {
  email:    'admin@lumina.edu',
  password: 'admin123',
  name:     'Admin User',
  role:     'admin'
};

const SEED_EVENTS = [
  { id:'e1', title:'TechFest 2025',                    cat:'Tech',      date:'2025-08-15', time:'10:00', venue:'Main Auditorium',       cap:300, regCount:0, emoji:'🚀', featured:true,  desc:'The flagship annual tech symposium featuring hackathons, AI showcases, guest lectures from industry leaders, and networking sessions with 200+ professionals.' },
  { id:'e2', title:'Rangmanch — Cultural Night',        cat:'Cultural',  date:'2025-08-22', time:'18:00', venue:'Open Air Theatre',       cap:500, regCount:0, emoji:'🎭', featured:true,  desc:'A spectacular evening celebrating classical dance, drama, music, and art. Experience the diverse cultural tapestry of our campus through live performances.' },
  { id:'e3', title:'Inter-College Cricket Championship',cat:'Sports',    date:'2025-09-05', time:'08:00', venue:'College Ground',         cap:200, regCount:0, emoji:'🏏', featured:false, desc:'The most anticipated cricket tournament featuring teams from 12 colleges competing for the prestigious LUMINA Cup over 3 exciting days.' },
  { id:'e4', title:'UI/UX Design Sprint',               cat:'Workshop',  date:'2025-08-30', time:'14:00', venue:'Design Lab — Block C',   cap:60,  regCount:0, emoji:'🎨', featured:false, desc:'An intensive 8-hour design sprint led by industry professionals. Learn Figma, user research, prototyping, and pitch your designs to expert judges.' },
  { id:'e5', title:'AI & Machine Learning Summit',      cat:'Tech',      date:'2025-09-12', time:'09:00', venue:'Seminar Hall A',         cap:180, regCount:0, emoji:'🤖', featured:true,  desc:'Deep dive into neural networks, LLMs, and real-world AI applications. Workshops, panel discussions, and a project showcase for ML models.' },
  { id:'e6', title:'Talent Hunt — Spring Edition',      cat:'Cultural',  date:'2025-09-18', time:'17:00', venue:'Main Stage',             cap:400, regCount:0, emoji:'⭐', featured:false, desc:'Show your hidden talent — singing, stand-up comedy, beatboxing, poetry slam. Cash prizes worth ₹50,000 await!' },
  { id:'e7', title:'Basketball League Finals',          cat:'Sports',    date:'2025-09-25', time:'16:00', venue:'Indoor Sports Complex',  cap:250, regCount:0, emoji:'🏀', featured:false, desc:'The nail-biting finale of the inter-departmental basketball league. Cheer for your department team to glory!' },
  { id:'e8', title:'Full-Stack Web Dev Bootcamp',       cat:'Workshop',  date:'2025-10-03', time:'10:00', venue:'Computer Lab 2',         cap:40,  regCount:0, emoji:'💻', featured:false, desc:'Intensive two-day bootcamp covering React, Node.js, MongoDB, and deployment. Build a complete production-ready app from scratch.' }
];

const CAT_GRADIENTS = {
  Tech:     'linear-gradient(135deg,#0d1b2a,#1a3a4a)',
  Cultural: 'linear-gradient(135deg,#2a1a0d,#4a3a0a)',
  Sports:   'linear-gradient(135deg,#2a0d1a,#4a0a2a)',
  Workshop: 'linear-gradient(135deg,#1a0d2a,#2a1a4a)',
  Seminar:  'linear-gradient(135deg,#0d2a1a,#1a4a3a)',
  Other:    'linear-gradient(135deg,#1a1a2a,#2a2a4a)'
};
const CAT_COLORS = { Tech:'#06d6a0', Cultural:'#f9c74f', Sports:'#f72585', Workshop:'#a78bfa', Seminar:'#38bdf8', Other:'#a0a0b8' };


/* ══════════════════════════════════════════════
   2. APPLICATION STATE
══════════════════════════════════════════════ */

const S = {
  events:        [],
  registrations: [],
  students:      [],     // registered student accounts
  currentUser:   null,
  editingEventId: null,
  currentRegEventId: null,
  filter:        'All',
  search:        '',
  regFilter:     'All',
  regSearch:     '',
  regPage:       1,
  perPage:       8,
  charts:        {},
  certData:      null    // {reg, ev} for current cert preview
};


/* ══════════════════════════════════════════════
   3. PERSISTENCE
══════════════════════════════════════════════ */

function saveAll() {
  localStorage.setItem('lum3_events',  JSON.stringify(S.events));
  localStorage.setItem('lum3_regs',    JSON.stringify(S.registrations));
  localStorage.setItem('lum3_students',JSON.stringify(S.students));
}

function loadAll() {
  S.events        = JSON.parse(localStorage.getItem('lum3_events')   || 'null') || SEED_EVENTS.map(e => ({...e}));
  S.registrations = JSON.parse(localStorage.getItem('lum3_regs')     || '[]');
  S.students      = JSON.parse(localStorage.getItem('lum3_students') || '[]');
  const saved     = localStorage.getItem('lum3_user');
  if (saved) S.currentUser = JSON.parse(saved);
}


/* ══════════════════════════════════════════════
   4. AUTH — SIGN UP (Students Only)
══════════════════════════════════════════════ */

function handleRegister(e) {
  e.preventDefault();
  clearErrors('reg');

  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim().toLowerCase();
  const roll     = document.getElementById('regRoll').value.trim();
  const dept     = document.getElementById('regDept').value;
  const phone    = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regConfirm').value;

  let valid = true;

  if (!name)  { showErr('regNameErr','Name is required.');     markError('regName');  valid=false; }
  if (!email) { showErr('regEmailErr','Email is required.');   markError('regEmail'); valid=false; }
  else if (!/^\S+@\S+\.\S+$/.test(email)) { showErr('regEmailErr','Enter a valid email.'); markError('regEmail'); valid=false; }
  if (!roll)  { showErr('regRollErr','Roll number is required.'); markError('regRoll'); valid=false; }
  if (!dept)  { showErr('regDeptErr','Select your department.'); markError('regDept'); valid=false; }
  if (password.length < 6) { showErr('regPasswordErr','Password must be at least 6 characters.'); markError('regPassword'); valid=false; }
  if (password !== confirm) { showErr('regConfirmErr','Passwords do not match.'); markError('regConfirm'); valid=false; }

  // Check admin email collision
  if (email === ADMIN_CREDENTIALS.email) {
    showErr('regEmailErr','This email is reserved.'); markError('regEmail'); valid=false;
  }
  // Check duplicate student
  if (S.students.find(s => s.email === email)) {
    showErr('regEmailErr','An account with this email already exists.'); markError('regEmail'); valid=false;
  }

  if (!valid) return;

  const student = {
    id:       'stu_' + Date.now(),
    name, email, roll, dept, phone,
    password, // stored plaintext for demo; use bcrypt in real backend
    role:     'student',
    createdAt: new Date().toISOString()
  };

  S.students.push(student);
  saveAll();

  // Auto login after signup
  loginUser({ id:student.id, name:student.name, email:student.email, roll:student.roll, dept:student.dept, phone:student.phone, role:'student' });
  closeModal('registerModal');
  toast(`Welcome to LUMINA, ${student.name}! 🎉`, 'success');
  document.getElementById('registerForm').reset();
}


/* ══════════════════════════════════════════════
   5. AUTH — LOGIN
══════════════════════════════════════════════ */

let loginRole = 'student'; // tracks selected tab

function selectLoginRole(role, btn) {
  loginRole = role;
  document.querySelectorAll('.role-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('loginHintStudent').classList.toggle('hidden', role !== 'student');
  document.getElementById('loginHintAdmin').classList.toggle('hidden', role !== 'admin');
  clearErrors('login');
}

function showLogin() {
  loginRole = 'student';
  document.querySelectorAll('.role-tab').forEach((b,i) => b.classList.toggle('active', i===0));
  document.getElementById('loginHintStudent').classList.remove('hidden');
  document.getElementById('loginHintAdmin').classList.add('hidden');
  document.getElementById('loginForm').reset();
  clearErrors('login');
  openModal('loginModal');
}

function showRegister() {
  document.getElementById('registerForm').reset();
  clearErrors('reg');
  openModal('registerModal');
}

function handleLogin(e) {
  e.preventDefault();
  clearErrors('login');

  const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  let valid = true;

  if (!email)    { showErr('loginEmailErr','Email is required.');    markError('loginEmail');    valid=false; }
  if (!password) { showErr('loginPasswordErr','Password is required.'); markError('loginPassword'); valid=false; }
  if (!valid) return;

  // ── Admin login ──
  if (loginRole === 'admin') {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      loginUser({ id:'admin', name:ADMIN_CREDENTIALS.name, email, role:'admin' });
      closeModal('loginModal');
      toast('Welcome, Admin! 👋', 'success');
      navigate('admin');
      setActiveByName('admin');
      document.getElementById('loginForm').reset();
    } else {
      showErr('loginGeneralErr','Incorrect admin email or password.');
    }
    return;
  }

  // ── Student login ──
  const student = S.students.find(s => s.email === email);
  if (!student) {
    showErr('loginGeneralErr', 'No account found with this email. Please sign up first.');
    markError('loginEmail');
    return;
  }
  if (student.password !== password) {
    showErr('loginGeneralErr', 'Incorrect password. Please try again.');
    markError('loginPassword');
    return;
  }

  loginUser({ id:student.id, name:student.name, email:student.email, roll:student.roll, dept:student.dept, phone:student.phone, role:'student' });
  closeModal('loginModal');
  toast(`Welcome back, ${student.name}! 👋`, 'success');
  document.getElementById('loginForm').reset();
}

function loginUser(user) {
  S.currentUser = user;
  localStorage.setItem('lum3_user', JSON.stringify(user));
  updateNavForUser();
}

function logout() {
  S.currentUser = null;
  localStorage.removeItem('lum3_user');
  updateNavForUser();
  navigate('home');
  setActiveByName('home');
  toast('Logged out successfully.', 'info');
  closeDropdown();
}


/* ══════════════════════════════════════════════
   6. NAV / UI STATE
══════════════════════════════════════════════ */

function updateNavForUser() {
  const u = S.currentUser;
  const loggedIn = !!u;
  const isAdmin  = u?.role === 'admin';

  // Guest / user areas
  document.getElementById('guestArea').style.display = loggedIn ? 'none' : 'flex';
  document.getElementById('userArea').style.display  = loggedIn ? 'block' : 'none';

  if (loggedIn) {
    const initial = u.name.charAt(0).toUpperCase();
    const short   = u.name.split(' ')[0];
    document.getElementById('userAvatar').textContent = initial;
    document.getElementById('userLabel').textContent  = short;
    document.getElementById('ddName').textContent     = u.name;
    document.getElementById('ddRole').textContent     = u.role;
  }

  // Nav links
  document.getElementById('navTickets').classList.toggle('hidden', !loggedIn || isAdmin);
  document.getElementById('navAdmin').classList.toggle('hidden', !isAdmin);
  document.getElementById('mobTickets').classList.toggle('hidden', !loggedIn || isAdmin);
  document.getElementById('mobAdmin').classList.toggle('hidden', !isAdmin);

  // Mobile: hide/show login-logout
  document.getElementById('mobLogin').classList.toggle('hidden',  loggedIn);
  document.getElementById('mobSignup').classList.toggle('hidden', loggedIn);
  document.getElementById('mobLogout').classList.toggle('hidden', !loggedIn);

  // Tickets nav link — hide from admin
  document.getElementById('ddTicketsBtn').style.display = isAdmin ? 'none' : 'block';

  // Hero Join button
  document.getElementById('heroJoinBtn').onclick = loggedIn ? () => navigate('events') : showRegister;
  document.getElementById('heroJoinBtn').textContent = loggedIn ? 'Browse Events' : 'Join Free';
}

function toggleDropdown() {
  const dd = document.getElementById('userDropdown');
  dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}
function closeDropdown() {
  document.getElementById('userDropdown').style.display = 'none';
}
document.addEventListener('click', e => {
  if (!document.getElementById('userArea')?.contains(e.target)) closeDropdown();
});

function setActive(el) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}
function setActiveByName(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === name));
}


/* ══════════════════════════════════════════════
   7. PAGE NAVIGATION
══════════════════════════════════════════════ */

function navigate(page) {
  // Guard: only admin can see admin panel
  if (page === 'admin' && S.currentUser?.role !== 'admin') {
    toast('Admin access only. Please log in as admin.', 'error');
    showLogin();
    return;
  }
  // Guard: tickets require login
  if (page === 'tickets' && !S.currentUser) {
    toast('Please log in to view your tickets.', 'info');
    showLogin();
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  window.scrollTo({ top:0, behavior:'smooth' });

  if (page === 'home')    { renderFeatured(); updateHeroStats(); }
  if (page === 'events')  renderEventsGrid();
  if (page === 'tickets') renderTickets();
  if (page === 'admin')   renderAdmin();
}

function filterAndGo(cat) {
  S.filter = cat;
  document.querySelectorAll('.pill').forEach(b => {
    b.classList.toggle('active', b.textContent.trim().replace(/[💻🎭⚽🛠️]/gu,'').trim() === cat || b.textContent.trim() === 'All' && cat === 'All');
  });
  navigate('events');
  setActiveByName('events');
}


/* ══════════════════════════════════════════════
   8. HOME PAGE
══════════════════════════════════════════════ */

function updateHeroStats() {
  animCounter('hs-events', S.events.length);
  animCounter('hs-regs',   S.registrations.length);
  animCounter('hs-certs',  S.registrations.filter(r => r.certIssued).length);
}

function renderFeatured() {
  const featured = S.events.filter(e => e.featured).slice(0, 3);
  document.getElementById('featuredGrid').innerHTML =
    featured.map((e, i) => buildCard(e, i)).join('') || '<p style="color:var(--txt3);padding:1rem">No featured events yet.</p>';
  updateCatCounts();
}

function updateCatCounts() {
  ['Tech','Cultural','Sports','Workshop'].forEach(c => {
    const n  = S.events.filter(e => e.cat === c).length;
    const el = document.getElementById('cc-' + c);
    if (el) el.textContent = n + (n === 1 ? ' event' : ' events');
  });
}


/* ══════════════════════════════════════════════
   9. EVENT CARDS
══════════════════════════════════════════════ */

function buildCard(ev, delay = 0) {
  const userReg = S.currentUser ? S.registrations.find(r => r.evtId === ev.id && r.userId === S.currentUser.id) : null;
  const isReg   = !!userReg;
  const isFull  = ev.regCount >= ev.cap;
  const cd      = countdownShort(ev.date);
  const pct     = Math.min(100, Math.round((ev.regCount / ev.cap) * 100));

  let btnClass = 'reg-btn';
  let btnText  = 'Register';
  let btnClick = `openRegModal('${ev.id}')`;

  if (isReg)      { btnClass = 'reg-btn done'; btnText = '✓ Registered'; btnClick = ''; }
  else if (isFull){ btnClass = 'reg-btn full'; btnText = 'Full'; btnClick = ''; }

  return `
  <div class="event-card" style="animation-delay:${Math.min(delay * 80, 400)}ms" onclick="openDetail('${ev.id}')">
    <div class="card-banner">
      <div class="card-banner-bg" style="background:${CAT_GRADIENTS[ev.cat] || CAT_GRADIENTS.Other}"></div>
      <span class="card-emoji">${ev.emoji || '🎉'}</span>
      ${cd ? `<div class="card-cd">${cd}</div>` : ''}
    </div>
    <div class="card-body">
      <div class="card-meta">
        <span class="tag tag-${ev.cat}">${ev.cat}</span>
        <span class="card-date">📅 ${fmtDate(ev.date)}</span>
      </div>
      <div class="card-title">${xss(ev.title)}</div>
      <div class="card-desc">${xss(ev.desc)}</div>
      <div class="card-footer">
        <span class="card-venue">📍 ${xss(ev.venue)}</span>
        <span class="cap-text ${isFull ? 'cap-full' : ''}">${ev.regCount}/${ev.cap}</span>
        <button class="${btnClass}" onclick="event.stopPropagation();${btnClick}">${btnText}</button>
      </div>
    </div>
  </div>`;
}


/* ══════════════════════════════════════════════
   10. EVENTS PAGE
══════════════════════════════════════════════ */

let searchTimer;
function searchEvents(val) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { S.search = val; renderEventsGrid(); }, 260);
}

function applyFilter(cat, btn) {
  S.filter = cat;
  document.querySelectorAll('.filter-pills .pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderEventsGrid();
}

function renderEventsGrid() {
  let list = S.events;
  if (S.filter !== 'All') list = list.filter(e => e.cat === S.filter);
  if (S.search.trim()) {
    const q = S.search.toLowerCase();
    list = list.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.desc.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q)
    );
  }
  const grid  = document.getElementById('eventsGrid');
  const empty = document.getElementById('emptyState');
  if (!list.length) { grid.innerHTML = ''; empty.style.display = 'block'; }
  else              { empty.style.display = 'none'; grid.innerHTML = list.map((e,i) => buildCard(e,i)).join(''); }
}


/* ══════════════════════════════════════════════
   11. EVENT DETAIL MODAL
══════════════════════════════════════════════ */

function openDetail(id) {
  const ev = S.events.find(e => e.id === id); if (!ev) return;
  const userReg = S.currentUser ? S.registrations.find(r => r.evtId === id && r.userId === S.currentUser.id) : null;
  const isReg   = !!userReg;
  const isFull  = ev.regCount >= ev.cap;
  const pct     = Math.min(100, Math.round((ev.regCount / ev.cap) * 100));
  const cd      = countdownFull(ev.date);
  const isAdmin = S.currentUser?.role === 'admin';

  document.getElementById('detailContent').innerHTML = `
    <button class="close-btn" onclick="closeModal('detailModal')" style="position:absolute;top:1rem;right:1rem">✕</button>
    <div class="detail-banner" style="background:${CAT_GRADIENTS[ev.cat]||CAT_GRADIENTS.Other}">${ev.emoji||'🎉'}</div>
    <div class="detail-tags">
      <span class="tag tag-${ev.cat}">${ev.cat}</span>
      <span style="font-size:.8rem;color:var(--txt3)">${ev.regCount}/${ev.cap} registered (${pct}%)</span>
      ${pct>=90 ? '<span style="font-size:.75rem;color:var(--neon2)">⚠️ Almost Full</span>' : ''}
    </div>
    <div class="detail-title">${xss(ev.title)}</div>
    <div class="detail-desc">${xss(ev.desc)}</div>
    <div class="cap-bar"><div class="cap-fill" style="width:${pct}%"></div></div>
    <div class="detail-info">
      <div class="di"><div class="di-label">Date</div><div class="di-val">📅 ${fmtDate(ev.date)}</div></div>
      <div class="di"><div class="di-label">Time</div><div class="di-val">⏰ ${ev.time ? fmtTime(ev.time) : 'TBA'}</div></div>
      <div class="di"><div class="di-label">Venue</div><div class="di-val">📍 ${xss(ev.venue)}</div></div>
      <div class="di"><div class="di-label">Capacity</div><div class="di-val">👥 ${ev.cap} seats</div></div>
    </div>
    ${cd ? `<div style="padding:.9rem 1.1rem;background:linear-gradient(135deg,rgba(124,106,245,.1),rgba(192,132,252,.1));border:1px solid rgba(124,106,245,.25);border-radius:var(--rs);display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:.5rem">
      <span style="font-size:.82rem;color:var(--txt2)">⏳ Starts in</span>
      <span style="font-family:var(--fd);font-size:1.1rem;font-weight:700;color:var(--acc2)">${cd}</span>
    </div>` : ''}
    <div style="display:flex;gap:.75rem;justify-content:flex-end;flex-wrap:wrap">
      <button class="btn-outline" onclick="closeModal('detailModal')">Close</button>
      ${isAdmin
        ? `<button class="btn-primary" onclick="closeModal('detailModal');openEditEvent('${ev.id}')">✏️ Edit Event</button>`
        : isReg
          ? `<button class="btn-primary" style="background:var(--neon);cursor:default">✓ You're Registered</button>`
          : isFull
            ? `<button class="btn-primary" disabled>Event Full</button>`
            : `<button class="btn-primary" onclick="closeModal('detailModal');openRegModal('${ev.id}')">Register Now 🎉</button>`
      }
    </div>`;

  openModal('detailModal');
}


/* ══════════════════════════════════════════════
   12. STUDENT EVENT REGISTRATION
══════════════════════════════════════════════ */

function openRegModal(evtId) {
  if (!S.currentUser) {
    toast('Please log in to register for events.', 'info');
    showLogin();
    return;
  }
  if (S.currentUser.role === 'admin') {
    toast('Admins cannot register for events.', 'info');
    return;
  }
  const ev = S.events.find(e => e.id === evtId); if (!ev) return;
  if (S.registrations.find(r => r.evtId === evtId && r.userId === S.currentUser.id)) {
    toast('You are already registered for this event!', 'info'); return;
  }
  if (ev.regCount >= ev.cap) { toast('Event is at full capacity!', 'error'); return; }

  S.currentRegEventId = evtId;
  document.getElementById('regEventBanner').innerHTML =
    `<strong>${ev.emoji} ${xss(ev.title)}</strong>📅 ${fmtDate(ev.date)} &nbsp;|&nbsp; 📍 ${xss(ev.venue)}`;
  document.getElementById('rrName').value  = S.currentUser.name || '';
  document.getElementById('rrPhone').value = S.currentUser.phone || '';
  document.getElementById('rrDept').value  = S.currentUser.dept || '';
  openModal('regModal');
}

function submitRegistration(e) {
  e.preventDefault();
  if (!S.currentRegEventId) return;
  const ev = S.events.find(e => e.id === S.currentRegEventId); if (!ev) return;

  const ticketId = 'TKT-' + Math.random().toString(36).slice(2,14).toUpperCase();
  const reg = {
    id:        'r_' + Date.now(),
    evtId:     ev.id,
    userId:    S.currentUser.id,
    name:      S.currentUser.name,
    roll:      S.currentUser.roll   || '—',
    dept:      document.getElementById('rrDept').value  || S.currentUser.dept || '—',
    email:     S.currentUser.email,
    phone:     document.getElementById('rrPhone').value || S.currentUser.phone || '—',
    ticketId,
    date:      new Date().toISOString().slice(0,10),
    status:    'confirmed',
    certIssued:false
  };

  S.registrations.push(reg);
  ev.regCount++;
  saveAll();
  closeModal('regModal');
  toast(`🎉 Registered for "${ev.title}"! Check My Tickets.`, 'success');
  // Refresh current page cards
  if (document.getElementById('page-events').classList.contains('active')) renderEventsGrid();
  if (document.getElementById('page-home').classList.contains('active'))   renderFeatured();
  updateHeroStats();
}


/* ══════════════════════════════════════════════
   13. MY TICKETS (Student)
══════════════════════════════════════════════ */

function renderTickets() {
  const grid  = document.getElementById('ticketsGrid');
  const empty = document.getElementById('ticketsEmpty');

  if (!S.currentUser) { grid.innerHTML=''; empty.style.display='block'; return; }

  const myRegs = S.registrations.filter(r => r.userId === S.currentUser.id);
  if (!myRegs.length) { grid.innerHTML=''; empty.style.display='block'; return; }

  empty.style.display = 'none';
  grid.innerHTML = myRegs.map(r => {
    const ev = S.events.find(e => e.id === r.evtId) || { title:'Event', emoji:'🎉', date:'', venue:'', cat:'Other' };
    return `
    <div class="my-ticket">
      <div class="mt-head">
        <div class="mt-emoji">${ev.emoji}</div>
        <div>
          <div class="mt-title">${xss(ev.title)}</div>
          <div class="mt-meta">📅 ${fmtDate(ev.date)} &nbsp;|&nbsp; 📍 ${xss(ev.venue)}</div>
        </div>
      </div>
      <div class="mt-body">
        <div>
          <div class="mt-id">${r.ticketId}</div>
          <span class="status-pill ${r.status==='attended'?'s-attended':'s-confirmed'}" style="display:inline-block;margin-top:.3rem">${r.status}</span>
        </div>
        <div class="mt-actions">
          ${r.certIssued
            ? `<button class="btn-gold" style="padding:.4rem .9rem;font-size:.78rem" onclick="openCertificate('${r.id}')">🏆 Certificate</button>`
            : `<span title="Certificate will be issued by admin after the event" style="font-size:.75rem;color:var(--txt3);padding:.4rem .5rem;cursor:help">🏅 Cert Pending</span>`
          }
          <button class="btn-outline" style="padding:.4rem .9rem;font-size:.78rem" onclick="cancelRegistration('${r.id}')">Cancel</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function cancelRegistration(regId) {
  if (!confirm('Cancel this registration?')) return;
  const idx = S.registrations.findIndex(r => r.id === regId);
  if (idx === -1) return;
  const r  = S.registrations[idx];
  const ev = S.events.find(e => e.id === r.evtId);
  if (ev) ev.regCount = Math.max(0, ev.regCount - 1);
  S.registrations.splice(idx, 1);
  saveAll();
  toast('Registration cancelled.', 'info');
  renderTickets();
}


/* ══════════════════════════════════════════════
   14. ADMIN — EVENT MANAGEMENT
══════════════════════════════════════════════ */

function openEventForm() {
  if (S.currentUser?.role !== 'admin') return;
  S.editingEventId = null;
  document.getElementById('evtFormTitle').textContent = 'Create New Event';
  document.getElementById('evtSubmitBtn').textContent = 'Create Event';
  document.getElementById('eventForm').reset();
  openModal('eventFormModal');
}

function openEditEvent(id) {
  if (S.currentUser?.role !== 'admin') return;
  const ev = S.events.find(e => e.id === id); if (!ev) return;
  S.editingEventId = id;
  document.getElementById('evtFormTitle').textContent = 'Edit Event';
  document.getElementById('evtSubmitBtn').textContent = 'Save Changes';
  document.getElementById('evtTitle').value    = ev.title;
  document.getElementById('evtCategory').value = ev.cat;
  document.getElementById('evtDate').value     = ev.date;
  document.getElementById('evtTime').value     = ev.time || '';
  document.getElementById('evtVenue').value    = ev.venue;
  document.getElementById('evtDesc').value     = ev.desc;
  document.getElementById('evtCapacity').value = ev.cap;
  document.getElementById('evtEmoji').value    = ev.emoji || '';
  openModal('eventFormModal');
}

function submitEventForm(e) {
  e.preventDefault();
  if (S.currentUser?.role !== 'admin') return;

  const data = {
    title:    document.getElementById('evtTitle').value.trim(),
    cat:      document.getElementById('evtCategory').value,
    date:     document.getElementById('evtDate').value,
    time:     document.getElementById('evtTime').value,
    venue:    document.getElementById('evtVenue').value.trim(),
    desc:     document.getElementById('evtDesc').value.trim(),
    cap:      parseInt(document.getElementById('evtCapacity').value) || 100,
    emoji:    document.getElementById('evtEmoji').value.trim() || '🎉',
    featured: false
  };

  if (!data.title || !data.cat || !data.date || !data.venue || !data.desc) {
    toast('Please fill all required fields.', 'error'); return;
  }

  if (S.editingEventId) {
    const idx = S.events.findIndex(e => e.id === S.editingEventId);
    if (idx !== -1) S.events[idx] = { ...S.events[idx], ...data };
    toast('Event updated successfully!', 'success');
  } else {
    S.events.push({ id: 'e_' + Date.now(), ...data, regCount: 0 });
    toast('New event created! 🎉', 'success');
  }

  saveAll();
  closeModal('eventFormModal');
  renderAdmin();
  updateCatCounts();
}

function deleteEvent(id) {
  if (S.currentUser?.role !== 'admin') return;
  if (!confirm('Delete this event and all its registrations? This cannot be undone.')) return;
  S.events        = S.events.filter(e => e.id !== id);
  S.registrations = S.registrations.filter(r => r.evtId !== id);
  saveAll();
  toast('Event deleted.', 'info');
  renderAdmin();
  updateCatCounts();
}


/* ══════════════════════════════════════════════
   15. ADMIN DASHBOARD RENDER
══════════════════════════════════════════════ */

function renderAdmin() {
  if (S.currentUser?.role !== 'admin') return;
  const today   = new Date().toISOString().slice(0,10);
  const certsN  = S.registrations.filter(r => r.certIssued).length;
  const upcoming= S.events.filter(e => e.date >= today).length;

  document.getElementById('as-events').textContent   = S.events.length;
  document.getElementById('as-regs').textContent     = S.registrations.length;
  document.getElementById('as-certs').textContent    = certsN;
  document.getElementById('as-upcoming').textContent = upcoming;

  renderAdminEventsTable();
  renderRegDashboard();
  renderCharts();
}

function renderAdminEventsTable() {
  const tbody = document.getElementById('adminTbody');
  if (!S.events.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--txt3)">No events yet. Click "+ New Event" to add one.</td></tr>';
    return;
  }
  tbody.innerHTML = S.events.map(ev => {
    const pct    = Math.min(100, Math.round((ev.regCount / ev.cap) * 100));
    const isFull = pct >= 100;
    return `
    <tr>
      <td><div class="t-name">${ev.emoji} ${xss(ev.title)}</div></td>
      <td><span class="tag tag-${ev.cat}">${ev.cat}</span></td>
      <td style="font-size:.84rem">${fmtDate(ev.date)}</td>
      <td>
        <span style="font-size:.8rem">${ev.regCount}/${ev.cap} (${pct}%)</span>
        <div class="fill-bar ${isFull?'fill-full':''}"><div class="fill-inner" style="width:${pct}%"></div></div>
      </td>
      <td>
        <div class="tbl-actions">
          <button class="tbl-btn view" title="View Registrations" onclick="viewEventRegs('${ev.id}')">👁</button>
          <button class="tbl-btn edit" title="Edit Event"         onclick="openEditEvent('${ev.id}')">✏️</button>
          <button class="tbl-btn del"  title="Delete Event"       onclick="deleteEvent('${ev.id}')">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}


/* ══════════════════════════════════════════════
   16. STUDENT REGISTRATION DASHBOARD (Admin)
══════════════════════════════════════════════ */

function renderRegDashboard() {
  // Build event filter pills
  const wrap = document.getElementById('eventFilterBtns');
  const ids  = [...new Set(S.registrations.map(r => r.evtId))];
  wrap.innerHTML = `<button class="pill ${S.regFilter==='All'?'active':''}" onclick="filterRegByEvent('All',this)">All Events</button>` +
    ids.map(eid => {
      const ev = S.events.find(e => e.id === eid);
      if (!ev) return '';
      return `<button class="pill ${S.regFilter===eid?'active':''}" onclick="filterRegByEvent('${eid}',this)">${ev.emoji} ${xss(ev.title.slice(0,22))}</button>`;
    }).join('');

  renderRegTable();
}

function filterRegByEvent(evtId, btn) {
  S.regFilter = evtId;
  S.regPage   = 1;
  document.querySelectorAll('#eventFilterBtns .pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderRegTable();
}

function filterRegTable(val) { S.regSearch = val; S.regPage = 1; renderRegTable(); }

function renderRegTable() {
  let list = S.registrations;
  if (S.regFilter !== 'All') list = list.filter(r => r.evtId === S.regFilter);
  if (S.regSearch.trim()) {
    const q = S.regSearch.toLowerCase();
    list = list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.roll||'').toLowerCase().includes(q) ||
      (r.dept||'').toLowerCase().includes(q) ||
      (r.email||'').toLowerCase().includes(q)
    );
  }

  const total  = list.length;
  const pages  = Math.max(1, Math.ceil(total / S.perPage));
  S.regPage    = Math.min(S.regPage, pages);
  const start  = (S.regPage - 1) * S.perPage;
  const slice  = list.slice(start, start + S.perPage);

  const tbody = document.getElementById('regTbody');
  if (!slice.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--txt3)">No registrations found.</td></tr>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = slice.map((r, i) => {
    const ev      = S.events.find(e => e.id === r.evtId) || { title:'Unknown', emoji:'🎉' };
    const initials= r.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    return `
    <tr>
      <td style="color:var(--txt3);font-size:.8rem">${start+i+1}</td>
      <td>
        <div class="student-cell">
          <div class="student-av">${initials}</div>
          <div>
            <div class="student-name">${xss(r.name)}</div>
            <div class="student-roll">${r.roll} &nbsp;|&nbsp; ${r.dept}</div>
          </div>
        </div>
      </td>
      <td style="font-size:.82rem">${ev.emoji} ${xss(ev.title)}</td>
      <td style="font-size:.8rem">${r.date || '—'}</td>
      <td><span class="status-pill ${r.status==='attended'?'s-attended':'s-confirmed'}">${r.status}</span></td>
      <td>${r.certIssued ? '<span class="cert-issued">✅ Issued</span>' : '<span class="cert-pending">⏳ Pending</span>'}</td>
      <td>
        <div class="tbl-actions">
          <button class="btn-gold-sm" onclick="openCertificate('${r.id}')">🏆 View</button>
          ${!r.certIssued
            ? `<button class="btn-primary-sm btn-primary" style="padding:.38rem .8rem;font-size:.78rem" onclick="issueCert('${r.id}')">Issue</button>`
            : ''}
        </div>
      </td>
    </tr>`;
  }).join('');

  // Pagination
  const pg = document.getElementById('pagination');
  pg.innerHTML = `
    <span class="page-info">Showing ${start+1}–${Math.min(start+S.perPage,total)} of ${total}</span>
    <div class="page-btns">
      <button class="pg-btn" onclick="changePage(${S.regPage-1})" ${S.regPage<=1?'disabled':''}>← Prev</button>
      ${Array.from({length:pages},(_,i)=>i+1).map(p=>`<button class="pg-btn ${p===S.regPage?'cur':''}" onclick="changePage(${p})">${p}</button>`).join('')}
      <button class="pg-btn" onclick="changePage(${S.regPage+1})" ${S.regPage>=pages?'disabled':''}>Next →</button>
    </div>`;
}

function changePage(p) {
  S.regPage = p;
  renderRegTable();
  document.getElementById('regDashSection')?.scrollIntoView({ behavior:'smooth', block:'start' });
}

function viewEventRegs(evtId) {
  if (S.currentUser?.role !== 'admin') return;
  const ev   = S.events.find(e => e.id === evtId);
  const regs = S.registrations.filter(r => r.evtId === evtId);
  document.getElementById('viewRegsTitle').textContent = `${ev?.emoji} ${ev?.title} — ${regs.length} Students`;
  if (!regs.length) {
    document.getElementById('viewRegsContent').innerHTML =
      '<div class="empty-state"><div class="empty-icon">👥</div><h3>No registrations yet</h3></div>';
  } else {
    document.getElementById('viewRegsContent').innerHTML = `
    <div class="inner-table-wrap">
    <table class="data-table">
      <thead><tr><th>#</th><th>Student</th><th>Roll</th><th>Dept</th><th>Email</th><th>Cert</th><th>Action</th></tr></thead>
      <tbody>${regs.map((r,i) => {
        const ini = r.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
        return `<tr>
          <td style="color:var(--txt3);font-size:.8rem">${i+1}</td>
          <td><div class="student-cell"><div class="student-av" style="width:30px;height:30px;font-size:.78rem">${ini}</div><span class="student-name">${xss(r.name)}</span></div></td>
          <td style="font-size:.8rem">${r.roll||'—'}</td>
          <td style="font-size:.8rem">${r.dept||'—'}</td>
          <td style="font-size:.78rem;color:var(--txt3)">${r.email||'—'}</td>
          <td>${r.certIssued ? '<span class="cert-issued">✅</span>' : '<span class="cert-pending">⏳</span>'}</td>
          <td>
            <button class="btn-gold-sm" onclick="openCertificate('${r.id}')">🏆</button>
            ${!r.certIssued ? `<button class="btn-primary-sm btn-primary" style="padding:.3rem .7rem;font-size:.75rem;margin-left:.3rem" onclick="issueCert('${r.id}');renderRegDashboard()">Issue</button>` : ''}
          </td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
    <div style="display:flex;gap:.75rem;margin-top:1rem;flex-wrap:wrap">
      <button class="btn-gold" onclick="exportEventCSV('${evtId}')">⬇️ Export CSV</button>
      <button class="btn-primary" onclick="issueAllForEvent('${evtId}')">🏆 Issue All Certs</button>
    </div>`;
  }
  openModal('viewRegsModal');
}


/* ══════════════════════════════════════════════
   17. CERTIFICATE
══════════════════════════════════════════════ */

function issueCert(regId) {
  const r = S.registrations.find(x => x.id === regId); if (!r) return;
  r.certIssued = true;
  saveAll();
  toast(`✅ Certificate issued for ${r.name}`, 'success');
  renderAdmin();
  if (document.getElementById('page-tickets').classList.contains('active')) renderTickets();
}

function issueAllCerts() {
  let list = S.registrations;
  if (S.regFilter !== 'All') list = list.filter(r => r.evtId === S.regFilter);
  let count = 0;
  list.forEach(r => { if (!r.certIssued) { r.certIssued = true; count++; } });
  saveAll();
  toast(`✅ ${count} certificate(s) issued!`, 'success');
  renderAdmin();
}

function issueAllForEvent(evtId) {
  let count = 0;
  S.registrations.filter(r => r.evtId === evtId).forEach(r => { if (!r.certIssued) { r.certIssued = true; count++; } });
  saveAll();
  toast(`✅ ${count} certificate(s) issued!`, 'success');
  closeModal('viewRegsModal');
  renderAdmin();
}

function openCertificate(regId) {
  const r  = S.registrations.find(x => x.id === regId); if (!r) return;
  const ev = S.events.find(e => e.id === r.evtId) || { title:'Event', date:'', venue:'Campus', emoji:'🎉' };
  S.certData = { r, ev };
  openModal('certModal');
  setTimeout(() => drawCertificate(r, ev), 80);
}

function drawCertificate(r, ev) {
  const canvas = document.getElementById('certCanvas');
  const W = 1200, H = 840;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#09090f'); bg.addColorStop(.5, '#12102a'); bg.addColorStop(1, '#09090f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Outer border
  ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 3; ctx.strokeRect(22, 22, W-44, H-44);
  ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 1.5; ctx.strokeRect(36, 36, W-72, H-72);

  // Corner diamonds
  [[50,50],[W-50,50],[50,H-50],[W-50,H-50]].forEach(([cx,cy]) => {
    ctx.save(); ctx.translate(cx,cy);
    ctx.beginPath(); ctx.moveTo(0,-13); ctx.lineTo(13,0); ctx.lineTo(0,13); ctx.lineTo(-13,0); ctx.closePath();
    ctx.strokeStyle='#d4af37'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle='rgba(212,175,55,.12)'; ctx.fill();
    ctx.restore();
  });

  // Separator lines
  ['rgba(167,139,250,.2)'].forEach(c => {
    ctx.strokeStyle=c; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(60,182); ctx.lineTo(W-60,182); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(60,660); ctx.lineTo(W-60,660); ctx.stroke();
  });

  // Logo orb
  const lg = ctx.createRadialGradient(W/2,98,8, W/2,98,44);
  lg.addColorStop(0,'#a78bfa'); lg.addColorStop(1,'#7c6af5');
  ctx.fillStyle=lg; ctx.beginPath(); ctx.arc(W/2,98,38,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.font='bold 20px "Syne",sans-serif'; ctx.textAlign='center'; ctx.fillText('L',W/2,105);

  // LUMINA heading
  ctx.fillStyle='#a78bfa'; ctx.font='bold 28px "Syne",sans-serif'; ctx.fillText('LUMINA',W/2,154);
  ctx.fillStyle='rgba(167,139,250,.6)'; ctx.font='13px "DM Sans",sans-serif';
  ctx.fillText('College Event Management System',W/2,172);

  // CERTIFICATE OF PARTICIPATION
  ctx.fillStyle='#d4af37'; ctx.font='bold 14px "DM Sans",sans-serif';
  ctx.fillText('C E R T I F I C A T E   O F   P A R T I C I P A T I O N',W/2,225);
  ctx.strokeStyle='#d4af37'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(W/2-170,240); ctx.lineTo(W/2+170,240); ctx.stroke();

  // Body text
  ctx.fillStyle='rgba(160,160,184,.85)'; ctx.font='18px "DM Sans",sans-serif';
  ctx.fillText('This is proudly presented to',W/2,308);

  // Student name
  ctx.fillStyle='#f0f0f8';
  ctx.font='italic bold 62px "Playfair Display",Georgia,serif';
  ctx.fillText(r.name, W/2, 400);

  // Name underline gradient
  const nw = ctx.measureText(r.name).width;
  const ng = ctx.createLinearGradient(W/2-nw/2,0,W/2+nw/2,0);
  ng.addColorStop(0,'transparent'); ng.addColorStop(.2,'#a78bfa'); ng.addColorStop(.8,'#a78bfa'); ng.addColorStop(1,'transparent');
  ctx.strokeStyle=ng; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(W/2-nw/2,414); ctx.lineTo(W/2+nw/2,414); ctx.stroke();

  // Roll & dept
  if (r.roll || r.dept) {
    ctx.fillStyle='rgba(167,139,250,.75)'; ctx.font='16px "DM Sans",sans-serif';
    ctx.fillText([r.roll,r.dept].filter(Boolean).join('  |  '),W/2,452);
  }

  // Participation text
  ctx.fillStyle='rgba(160,160,184,.85)'; ctx.font='18px "DM Sans",sans-serif';
  ctx.fillText('for successfully participating in',W/2,500);

  // Event title
  ctx.fillStyle='#f9c74f'; ctx.font='bold 36px "Syne",sans-serif';
  const et = ev.title.length>42 ? ev.title.slice(0,42)+'…' : ev.title;
  ctx.fillText(et,W/2,554);

  // Date & venue
  ctx.fillStyle='rgba(160,160,184,.7)'; ctx.font='16px "DM Sans",sans-serif';
  ctx.fillText(`${fmtDate(ev.date)}  •  ${ev.venue||'College Campus'}`,W/2,597);

  // ── Signature area ──
  const sy = 726;
  // Left sig
  ctx.strokeStyle='rgba(167,139,250,.55)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(138,sy-34); ctx.bezierCurveTo(165,sy-52,195,sy-22,222,sy-40); ctx.bezierCurveTo(244,sy-55,262,sy-28,292,sy-36); ctx.stroke();
  ctx.strokeStyle='rgba(160,160,184,.35)'; ctx.lineWidth=.8;
  ctx.beginPath(); ctx.moveTo(118,sy-16); ctx.lineTo(318,sy-16); ctx.stroke();
  ctx.fillStyle='rgba(160,160,184,.7)'; ctx.font='14px "DM Sans",sans-serif'; ctx.textAlign='left';
  ctx.fillText('Event Coordinator',138,sy);

  // Centre seal
  ctx.save(); ctx.translate(W/2, sy-14);
  const sg = ctx.createRadialGradient(0,0,10,0,0,44);
  sg.addColorStop(0,'rgba(124,106,245,.28)'); sg.addColorStop(1,'rgba(124,106,245,.04)');
  ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(0,0,44,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(167,139,250,.45)'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle='#a78bfa'; ctx.font='bold 14px "Syne",sans-serif'; ctx.textAlign='center'; ctx.fillText('LUMINA',0,4);
  ctx.fillStyle='rgba(167,139,250,.55)'; ctx.font='10px "DM Sans",sans-serif'; ctx.fillText('CERTIFIED',0,18);
  ctx.restore();

  // Right sig
  ctx.strokeStyle='rgba(167,139,250,.55)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(W-292,sy-38); ctx.bezierCurveTo(W-262,sy-54,W-232,sy-26,W-214,sy-42); ctx.bezierCurveTo(W-200,sy-54,W-180,sy-30,W-150,sy-36); ctx.stroke();
  ctx.strokeStyle='rgba(160,160,184,.35)'; ctx.lineWidth=.8;
  ctx.beginPath(); ctx.moveTo(W-318,sy-16); ctx.lineTo(W-118,sy-16); ctx.stroke();
  ctx.fillStyle='rgba(160,160,184,.7)'; ctx.font='14px "DM Sans",sans-serif'; ctx.textAlign='right';
  ctx.fillText('Principal',W-138,sy);

  // Footer
  ctx.textAlign='center';
  ctx.fillStyle='rgba(96,96,120,.7)'; ctx.font='12px "DM Sans",sans-serif';
  ctx.fillText(`Issued on: ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}`,W/2,H-50);
  ctx.fillStyle='rgba(96,96,120,.45)'; ctx.font='11px monospace';
  ctx.fillText(`Cert ID: LMNA-${(r.id||'DEMO').slice(-8).toUpperCase()}`,W/2,H-36);
}

function downloadCert() {
  if (!S.certData) return;
  const { r, ev } = S.certData;
  const a = document.createElement('a');
  a.download = `LUMINA_Cert_${r.name.replace(/\s+/g,'_')}_${ev.title.replace(/\s+/g,'_').slice(0,30)}.png`;
  a.href = document.getElementById('certCanvas').toDataURL('image/png');
  a.click();
  toast('🏆 Certificate downloaded!', 'success');
}


/* ══════════════════════════════════════════════
   18. CSV EXPORT
══════════════════════════════════════════════ */

function exportCSV() {
  let list = S.registrations;
  if (S.regFilter !== 'All') list = list.filter(r => r.evtId === S.regFilter);
  if (S.regSearch.trim()) {
    const q = S.regSearch.toLowerCase();
    list = list.filter(r => r.name.toLowerCase().includes(q) || (r.roll||'').toLowerCase().includes(q));
  }
  const header = ['#','Name','Roll Number','Department','Email','Phone','Event','Date Registered','Status','Certificate Issued'];
  const rows   = list.map((r,i) => {
    const ev = S.events.find(e => e.id === r.evtId) || { title:'Unknown' };
    return [i+1, r.name, r.roll||'', r.dept||'', r.email||'', r.phone||'', ev.title, r.date||'', r.status, r.certIssued?'Yes':'No'];
  });
  const csv = [header,...rows].map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a   = document.createElement('a');
  a.href    = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download= `LUMINA_Registrations_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  toast('📊 CSV exported!', 'success');
}

function exportEventCSV(evtId) {
  const ev   = S.events.find(e => e.id === evtId);
  const regs = S.registrations.filter(r => r.evtId === evtId);
  const header = ['#','Name','Roll Number','Department','Email','Phone','Status','Certificate'];
  const rows   = regs.map((r,i) => [i+1,r.name,r.roll||'',r.dept||'',r.email||'',r.phone||'',r.status,r.certIssued?'Yes':'No']);
  const csv    = [header,...rows].map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a      = document.createElement('a');
  a.href       = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download   = `LUMINA_${(ev?.title||'Event').replace(/\s+/g,'_')}_Students.csv`;
  a.click();
  toast('📊 CSV exported!', 'success');
}


/* ══════════════════════════════════════════════
   19. CHARTS
══════════════════════════════════════════════ */

function renderCharts() {
  const dark      = document.documentElement.dataset.theme !== 'light';
  const gridColor = dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const txtColor  = dark ? '#606078' : '#9090a8';
  Chart.defaults.color      = txtColor;
  Chart.defaults.font.family= "'DM Sans',sans-serif";

  const cats   = ['Tech','Cultural','Sports','Workshop','Seminar','Other'];
  const counts = cats.map(c => S.registrations.filter(r => S.events.find(e=>e.id===r.evtId)?.cat===c).length);
  const colors = cats.map(c => CAT_COLORS[c]||'#a0a0b8');

  if (S.charts.cat) S.charts.cat.destroy();
  S.charts.cat = new Chart(document.getElementById('catChart'), {
    type:'doughnut',
    data:{ labels:cats, datasets:[{ data:counts, backgroundColor:colors.map(c=>c+'99'), borderColor:colors, borderWidth:2 }]},
    options:{ responsive:true, plugins:{ legend:{ position:'right', labels:{ padding:14, usePointStyle:true, pointStyle:'circle', font:{size:11} }}}, cutout:'65%' }
  });

  const days   = Array.from({length:15},(_,i)=>{ const d=new Date(Date.now()-(14-i)*86400000); return d.toISOString().slice(0,10); });
  const labels = days.map(d=>{ const dt=new Date(d); return dt.getDate()+' '+dt.toLocaleString('default',{month:'short'}); });
  const data   = days.map((d,i)=> S.registrations.filter(r=>r.date===d).length + [3,5,2,4,6,3,5,4,7,3,2,5,4,3,4][i]);

  if (S.charts.trend) S.charts.trend.destroy();
  S.charts.trend = new Chart(document.getElementById('trendChart'), {
    type:'line',
    data:{ labels, datasets:[{ label:'Registrations', data, borderColor:'#a78bfa', backgroundColor:'rgba(124,106,245,.1)', borderWidth:2, fill:true, tension:.4, pointBackgroundColor:'#a78bfa', pointRadius:3, pointHoverRadius:6 }]},
    options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{color:gridColor},ticks:{font:{size:11}}}, y:{grid:{color:gridColor},ticks:{font:{size:11},precision:0}} }}
  });
}


/* ══════════════════════════════════════════════
   20. MODAL HELPERS
══════════════════════════════════════════════ */

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function switchModal(from, to) { closeModal(from); openModal(to); }

// Close overlay on backdrop click
document.querySelectorAll('.overlay').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
});

// ESC key closes topmost modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const open = [...document.querySelectorAll('.overlay.open')];
    if (open.length) open[open.length-1].classList.remove('open');
  }
});

function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId);
  inp.type  = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}


/* ══════════════════════════════════════════════
   21. FORM VALIDATION HELPERS
══════════════════════════════════════════════ */

function showErr(spanId, msg) {
  const el = document.getElementById(spanId);
  if (el) el.textContent = msg;
}
function markError(inputId) {
  const el = document.getElementById(inputId);
  if (el) el.classList.add('error');
}
function clearErrors(prefix) {
  // Clear error messages
  document.querySelectorAll(`[id^="${prefix}"][id$="Err"]`).forEach(el => el.textContent = '');
  // Remove error class from inputs
  const forms = { login:'loginForm', reg:'registerForm' };
  const form  = document.getElementById(forms[prefix]);
  if (form) form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}


/* ══════════════════════════════════════════════
   22. TOAST
══════════════════════════════════════════════ */

function toast(msg, type = 'info') {
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  const el    = document.createElement('div');
  el.className= `toast ${type}`;
  el.innerHTML= `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  document.getElementById('toastBox').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 380); }, 3600);
}


/* ══════════════════════════════════════════════
   23. THEME
══════════════════════════════════════════════ */

function setupTheme() {
  const saved = localStorage.getItem('lum3_theme') || 'dark';
  applyTheme(saved);
  document.getElementById('themeToggle').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme;
    applyTheme(cur === 'dark' ? 'light' : 'dark');
    if (S.charts.cat)   { S.charts.cat.destroy();   S.charts.cat   = null; }
    if (S.charts.trend) { S.charts.trend.destroy();  S.charts.trend = null; }
    if (document.getElementById('page-admin').classList.contains('active')) renderCharts();
  });
}
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem('lum3_theme', t);
  document.getElementById('themeToggle').textContent = t === 'dark' ? '☀️' : '🌙';
}


/* ══════════════════════════════════════════════
   24. NAV & SCROLL SETUP
══════════════════════════════════════════════ */

function setupNav() {
  document.getElementById('hamBtn').addEventListener('click', () =>
    document.getElementById('mobNav').classList.toggle('open')
  );
  document.addEventListener('click', e => {
    if (!document.getElementById('mobNav').contains(e.target) &&
        !document.getElementById('hamBtn').contains(e.target)) {
      document.getElementById('mobNav').classList.remove('open');
    }
  });
  window.addEventListener('scroll', () =>
    document.getElementById('navbar').classList.toggle('scrolled', scrollY > 40)
  );
  // Wire open login/signup buttons
  document.getElementById('openLoginBtn')?.addEventListener('click', showLogin);
  document.getElementById('openRegBtn')?.addEventListener('click',   showRegister);
  document.getElementById('heroJoinBtn').addEventListener('click',   showRegister);
}

function closeMob() { document.getElementById('mobNav').classList.remove('open'); }


/* ══════════════════════════════════════════════
   25. UTILITY HELPERS
══════════════════════════════════════════════ */

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
function fmtTime(t) {
  if (!t) return '';
  const [h,m] = t.split(':'); const hh = +h;
  return `${hh%12||12}:${m} ${hh>=12?'PM':'AM'}`;
}
function countdownShort(dateStr) {
  const diff = new Date(dateStr + 'T00:00:00') - new Date();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  return d === 0 ? 'Today!' : d === 1 ? '1 day' : d < 7 ? `${d}d` : d < 30 ? `${Math.floor(d/7)}w` : `${Math.floor(d/30)}mo`;
}
function countdownFull(dateStr) {
  const diff = new Date(dateStr + 'T00:00:00') - new Date();
  if (diff <= 0) return null;
  const d=Math.floor(diff/86400000), h=Math.floor((diff%86400000)/3600000), m=Math.floor((diff%3600000)/60000);
  return d>0 ? `${d}d ${h}h ${m}m` : h>0 ? `${h}h ${m}m` : `${m}m`;
}
function xss(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function animCounter(id, target) {
  const el = document.getElementById(id); if (!el) return;
  const dur = 1500; const t0 = performance.now();
  const tick = now => {
    const p = Math.min((now-t0)/dur, 1);
    el.textContent = Math.floor((1-Math.pow(1-p,3)) * target).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target.toLocaleString();
  };
  requestAnimationFrame(tick);
}


/* ══════════════════════════════════════════════
   26. BOOT
══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  setupTheme();
  setupNav();
  updateNavForUser();
  renderFeatured();
  updateHeroStats();
  updateCatCounts();

  setTimeout(() => {
    document.getElementById('loader').classList.add('done');
  }, 1000);
});