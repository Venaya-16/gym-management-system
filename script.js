(function initCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles;
    const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; };
    function Particle() { this.x = Math.random() * W; this.y = Math.random() * H; this.vx = (Math.random() - .5) * .3; this.vy = (Math.random() - .5) * .3; this.r = Math.random() * 1.5 + .5; this.alpha = Math.random() * .4 + .1; }
    function draw() {
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y, d = Math.sqrt(dx * dx + dy * dy);
            if (d < 120) { ctx.beginPath(); ctx.strokeStyle = `rgba(124,106,247,${.07 * (1 - d / 120)})`; ctx.lineWidth = .8; ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); }
        }
        particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(124,106,247,${p.alpha})`; ctx.fill(); p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; });
        requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resize);
    resize(); particles = Array.from({ length: 80 }, () => new Particle()); draw();
})();

const API = '';
const esc = str => str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : '';
const escA = str => str ? String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;') : '';
const $ = id => document.getElementById(id);
const val = id => $(id).value.trim();

function getUser() { return localStorage.getItem('userId'); }
function getToken() { return localStorage.getItem('token'); }
function saveAuth(userId, username, role, token) {
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
    localStorage.setItem('token', token);
}
function clearAuth() { ['userId', 'username', 'role', 'token'].forEach(k => localStorage.removeItem(k)); }

async function api(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(API + url, { ...options, headers });
    if (res.status === 401) { clearAuth(); showAuth(); showToast('Session expired', 'error'); throw new Error('401'); }
    return res;
}

function showToast(msg, type = 'success') {
    const t = $('toast');
    t.textContent = msg; t.className = `toast ${type}`; t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

function showAuthMsg(msg, type = 'error') {
    const el = $('auth-message');
    el.textContent = msg; el.className = `message ${type}`; el.classList.remove('hidden');
}

function showAuth() { $('auth-section').classList.remove('hidden'); $('dashboard').classList.add('hidden'); }

function showDashboard() {
    $('auth-section').classList.add('hidden'); $('dashboard').classList.remove('hidden');
    const username = localStorage.getItem('username') || 'User';
    const role = localStorage.getItem('role') || 'student';
    $('nav-username').textContent = username;
    $('user-role-badge').textContent = role.toUpperCase();
    $('user-avatar-text').textContent = username[0].toUpperCase();
    applyRolePermissions(role);
    loadInsights();
    loadTrainers(); loadStudents(); loadWorkouts(); loadSchedules(); loadProgress(); loadProfile();
    enablePasswordToggles();
}

function applyRolePermissions(role) {
    const s = document.createElement('style'); s.id = 'role-styles';
    const old = $('role-styles'); if (old) old.remove();
    if (role === 'student') {
        s.textContent = `.nav-item[data-tab="trainers"],#trainers-tab,.nav-item[data-tab="students"],#students-tab,#show-workout-form-btn,#show-schedule-form-btn,.card-actions,#admin-trainer-summary-wrap{display:none!important}`;
        document.querySelector('.nav-item[data-tab="workouts"]').click();
    } else if (role === 'trainer') {
        s.textContent = `.nav-item[data-tab="trainers"],#trainers-tab,#show-trainer-form-btn,#show-student-form-btn,#admin-trainer-summary-wrap{display:none!important}`;
        document.querySelector('.nav-item[data-tab="students"]').click();
    } else {
        document.querySelector('.nav-item[data-tab="trainers"]').click();
    }
    document.head.appendChild(s);
}

function checkAuth() { getUser() ? showDashboard() : showAuth(); }

function showForm(id) { $(id).classList.remove('hidden'); }
function hideForm(id) { $(id).classList.add('hidden'); }

$('show-register').addEventListener('click', e => { e.preventDefault(); $('login-form').classList.add('hidden'); $('register-form').classList.remove('hidden'); $('auth-message').classList.add('hidden'); });
$('show-login').addEventListener('click', e => { e.preventDefault(); $('register-form').classList.add('hidden'); $('login-form').classList.remove('hidden'); $('auth-message').classList.add('hidden'); });

$('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const username = val('login-username'), password = $('login-password').value;
    if (!username || !password) return showAuthMsg('Username and password required');
    try {
        const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
        const data = await res.json();
        if (!res.ok) return showAuthMsg(data.message);
        saveAuth(data.userId, data.username, data.role, data.token); showDashboard();
    } catch { showAuthMsg('Network error. Is the server running?'); }
});

$('register-form').addEventListener('submit', async e => {
    e.preventDefault();
    const username = val('reg-username'), email = val('reg-email'), password = $('reg-password').value, role = $('reg-role').value;
    if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) return showAuthMsg('Username: min 3 chars, letters/numbers/underscore only');
    if (!email.includes('@')) return showAuthMsg('Valid email required');
    if (role === 'student' && !email.endsWith('@gmail.com')) return showAuthMsg('Students must use @gmail.com');
    if (role === 'trainer' && !email.endsWith('@fitmanager.com')) return showAuthMsg('Trainers must use @fitmanager.com');
    if (password.length < 6) return showAuthMsg('Password min 6 characters');
    try {
        const res = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password, role }) });
        const data = await res.json();
        if (!res.ok) return showAuthMsg(data.message);
        saveAuth(data.userId, data.username, data.role, data.token); showDashboard();
    } catch { showAuthMsg('Network error. Is the server running?'); }
});

$('logout-btn').addEventListener('click', () => { clearAuth(); showAuth(); $('login-form').reset(); $('register-form').reset(); $('auth-message').classList.add('hidden'); });

document.querySelectorAll('.nav-item').forEach(n => n.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
    n.classList.add('active');
    $(n.getAttribute('data-tab') + '-tab').classList.add('active');
}));


const editSVG = `<svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const delSVG = `<svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function emptyState(icon, msg) {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`;
}

function enablePasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach((input) => {
        const wrap = input.closest('.input-wrap') || input.parentElement;
        if (!wrap) return;
        if (wrap.querySelector('.password-toggle')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'password-toggle';
        btn.textContent = 'Show';
        btn.addEventListener('click', () => {
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            btn.textContent = isPass ? 'Hide' : 'Show';
        });
        wrap.style.position = wrap.style.position || 'relative';
        wrap.appendChild(btn);
    });
}

async function loadInsights() {
    const c = $('insight-cards');
    const t = $('today-schedule');
    if (!c || !t) return;
    try {
        const res = await api('/api/insights/overview');
        const data = await res.json();
        if (!res.ok) return;
        c.innerHTML = `
      <div class="card"><div class="card-title">Trainers</div><div class="card-body"><p>${data.totals.trainerCount}</p></div></div>
      <div class="card"><div class="card-title">Students</div><div class="card-body"><p>${data.totals.studentCount}</p></div></div>
      <div class="card"><div class="card-title">Workout Plans</div><div class="card-body"><p>${data.totals.workoutCount}</p></div></div>
      <div class="card"><div class="card-title">Top Specialization</div><div class="card-body"><p>${esc(data.topSpecialization)}</p></div></div>
    `;
        if (!data.todaysSchedules.length) {
            t.innerHTML = '<p>No sessions scheduled for today.</p>';
        } else {
            t.innerHTML = data.todaysSchedules.map((s) => `<p>${esc(s.time)} - ${esc(s.trainerName)}</p>`).join('');
        }
    } catch { }
}

// ── PROFILE ────────────────────────────────────────────────────
async function loadProfile() {
    const role = localStorage.getItem('role') || 'student';
    const details = $('my-profile-details');
    if (!details) return;

    const adminWrap = $('admin-user-manager');
    if (adminWrap && role === 'admin') {
        adminWrap.classList.remove('hidden');
    }
    else {
        if (adminWrap) adminWrap.classList.add('hidden');
    }
    try {
        const res = await api('/api/users/me');
        const me = await res.json();
        if (!res.ok) return;
        details.innerHTML = `
      <p><b>Username</b>: ${esc(me.username)}</p>
      <p><b>Email</b>: ${esc(me.email)}</p>
      <p><b>Role</b>: ${esc(me.role)}</p>
    `;
    } catch { }

    if (role === 'admin') loadAdminUserList();
}

$('change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = $('cp-current').value;
    const newPassword = $('cp-new').value;
    if (!currentPassword || !newPassword) return showToast('Fill both password fields', 'error');
    if (newPassword.length < 6) return showToast('New password min 6 characters', 'error');
    try {
        const res = await api('/api/users/me/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
        const data = await res.json();
        if (!res.ok) return showToast(data.message, 'error');
        showToast('Password updated');
        $('change-password-form').reset();
    } catch { showToast('Failed to update password', 'error'); }
});

let adminUsersCache = [];
async function loadAdminUserList() {
    const sel = $('admin-user-select');
    if (!sel) return;
    try {
        const res = await api('/api/users');
        const users = await res.json();
        if (!res.ok) return;
        adminUsersCache = users;
        sel.innerHTML = '<option value="">-- Select --</option>' + users.map(u => `<option value="${u._id}">${esc(u.username)} (${esc(u.role)})</option>`).join('');
    } catch { }
}

$('admin-user-select').addEventListener('change', function () {
    const u = adminUsersCache.find(x => x._id === this.value);
    if (!u) return;
    $('admin-user-id').value = u._id;
    $('admin-username').value = u.username;
    $('admin-email').value = u.email;
    $('admin-role').value = u.role;
    $('admin-reset-password').value = '';
    enablePasswordToggles();
});

$('admin-user-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = val('admin-user-id');
    if (!id) return showToast('Select a user first', 'error');
    const username = val('admin-username');
    const email = val('admin-email');
    const role = $('admin-role').value;
    const newPassword = $('admin-reset-password').value;

    try {
        const res = await api(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ username, email, role }) });
        const data = await res.json();
        if (!res.ok) return showToast(data.message, 'error');

        if (newPassword && newPassword.length >= 6) {
            const r2 = await api(`/api/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) });
            const d2 = await r2.json();
            if (!r2.ok) return showToast(d2.message, 'error');
        } else if (newPassword) {
            return showToast('Reset password min 6 characters', 'error');
        }

        showToast('User updated');
        await loadAdminUserList();
        $('admin-user-select').value = id;
        $('admin-reset-password').value = '';
    } catch { showToast('Failed to update user', 'error'); }
});

// ── PROGRESS ───────────────────────────────────────────────────
function addProgressExerciseRow(name = '', sets = '', reps = '') {
    const row = document.createElement('div');
    row.className = 'exercise-row';
    row.innerHTML = `<input type="text" placeholder="Exercise name" value="${escA(name)}" required>
    <input type="number" placeholder="Sets" value="${sets}" min="1" style="max-width:80px">
    <input type="number" placeholder="Reps" value="${reps}" min="1" style="max-width:80px">
    <button type="button" class="remove-exercise" onclick="this.parentElement.remove()">&#x2715;</button>`;
    $('progress-exercises-list').appendChild(row);
}

$('show-progress-form-btn').addEventListener('click', () => {
    showForm('progress-form-container');
    $('progress-form').reset();
    $('progress-exercises-list').innerHTML = '';
    $('progress-date').value = new Date().toISOString().slice(0, 10);
    addProgressExerciseRow();
});
['cancel-progress', 'cancel-progress-2'].forEach(id => $(id).addEventListener('click', () => hideForm('progress-form-container')));
$('add-progress-exercise-btn').addEventListener('click', () => addProgressExerciseRow());

$('progress-form').addEventListener('submit', async e => {
    e.preventDefault();
    const role = localStorage.getItem('role') || 'student';
    if (role !== 'student') return showToast('Only students can add entries', 'error');

    const date = $('progress-date').value;
    const weightKg = $('progress-weight').value;
    const workoutMinutes = $('progress-minutes').value;
    const notes = $('progress-notes').value.trim();
    const exercises = Array.from(document.querySelectorAll('#progress-exercises-list .exercise-row')).map(r => {
        const i = r.querySelectorAll('input');
        return { name: i[0].value.trim(), sets: i[1].value ? parseInt(i[1].value) : undefined, reps: i[2].value ? parseInt(i[2].value) : undefined };
    }).filter(x => x.name);
    if (!date) return showToast('Date required', 'error');
    if (!exercises.length) return showToast('Add at least one exercise', 'error');

    try {
        const res = await api('/api/progress/my', { method: 'POST', body: JSON.stringify({ date, weightKg, workoutMinutes, notes, exercises }) });
        const data = await res.json();
        if (!res.ok) return showToast(data.message, 'error');
        showToast('Progress saved!');
        hideForm('progress-form-container');
        loadProgress();
    } catch { showToast('Failed to save', 'error'); }
});

function progressCard(e) {
    const ex = (e.exercises || []).map(x => `<li>${esc(x.name)}${x.sets ? ` — ${x.sets}x${x.reps || ''}` : ''}</li>`).join('');
    return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="card-title">${esc(e.date)}${e.user ? ` · ${esc(e.user.username)}` : ''}</div>
        ${e.weightKg ? `<span class="card-badge badge-duration">${e.weightKg} kg</span>` : ''}
      </div>
      <div class="card-body">
        <p>${e.workoutMinutes ? `${e.workoutMinutes} minutes` : '0 minutes'}${e.notes ? ` · ${esc(e.notes)}` : ''}</p>
        ${ex ? `<ul class="exercise-list">${ex}</ul>` : ''}
      </div>
    </div>
  `;
}

async function loadProgress() {
    const role = localStorage.getItem('role') || 'student';
    const list = $('progress-list');
    if (!list) return;

    $('progress-list-title').textContent = role === 'student' ? 'My Entries' : 'Student Entries';
    $('show-progress-form-btn').style.display = role === 'student' ? '' : 'none';

    const adminWrap = $('admin-trainer-summary-wrap');
    if (adminWrap) adminWrap.classList.toggle('hidden', role !== 'admin');

    try {
        const endpoint = role === 'student' ? '/api/progress/my' : '/api/progress/students';
        const res = await api(endpoint);
        const data = await res.json();
        if (!res.ok) return;
        if (!data.length) {
            list.innerHTML = emptyState('<svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M4 18V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 18v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 18V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M16 18v-11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M20 18v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>', 'No progress entries yet');
        } else {
            list.innerHTML = data.map(progressCard).join('');
        }
    } catch { }

    if (role === 'admin') loadTrainerSummary();
}

async function loadTrainerSummary() {
    const el = $('trainer-summary-list');
    if (!el) return;
    try {
        const res = await api('/api/progress/trainer-summary');
        const data = await res.json();
        if (!res.ok) return;
        if (!data.length) { el.innerHTML = ''; return; }
        el.innerHTML = data.map(t => `
      <div class="card">
        <div class="card-title">${esc(t.trainerName)} <span style="color:var(--text-3);font-weight:500;">(@${esc(t.username)})</span></div>
        <div class="card-body">
          <p>${esc(t.specialization)}</p>
          <p>Assigned students: ${t.assignedStudents}</p>
          <p>Workout plans: ${t.workoutPlans}</p>
          <p>Schedule slots: ${t.scheduledSlots}</p>
        </div>
      </div>
    `).join('');
    } catch { }
}

async function crudDelete(url, onSuccess) {
    if (!confirm('Are you sure?')) return;
    try {
        const res = await api(url, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) return showToast(data.message, 'error');
        showToast('Deleted!'); onSuccess();
    } catch { }
}

async function crudSave(url, method, body, onSuccess) {
    try {
        const res = await api(url, { method, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) return showToast(data.message, 'error');
        onSuccess(data);
    } catch { showToast('Failed to save', 'error'); }
}

// ── TRAINERS ──────────────────────────────────────────────────
async function loadTrainers() {
    try {
        const res = await api('/api/trainers');
        const trainers = await res.json();
        const c = $('trainers-list');
        if (!trainers.length) { c.innerHTML = emptyState('<svg viewBox="0 0 24 24" fill="none" width="24" height="24"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>', 'No trainers yet'); return; }
        c.innerHTML = trainers.map(t => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div class="card-title">${esc(t.name)}</div>
          <div class="card-actions">
            <button class="btn-icon" onclick="editTrainer('${t._id}','${escA(t.name)}','${escA(t.email)}','${escA(t.specialization)}',${t.experience})">${editSVG}</button>
            <button class="btn-icon delete" onclick="deleteTrainer('${t._id}')">${delSVG}</button>
          </div>
        </div>
        <div class="card-body">
          <p>${esc(t.email)}</p>
          <p>${esc(t.specialization)} &middot; ${t.experience} yrs</p>
        </div>
      </div>`).join('');
        updateTrainerDropdowns(trainers);
    } catch { }
}

$('show-trainer-form-btn').addEventListener('click', () => { showForm('trainer-form-container'); $('trainer-form-title').textContent = 'Add Trainer'; $('trainer-form').reset(); $('trainer-id').value = ''; });
['cancel-trainer', 'cancel-trainer-2'].forEach(id => $(id).addEventListener('click', () => hideForm('trainer-form-container')));

$('trainer-form').addEventListener('submit', async e => {
    e.preventDefault();
    const id = val('trainer-id'), name = val('trainer-name'), email = val('trainer-email'), specialization = val('trainer-specialization'), experience = parseInt($('trainer-experience').value);
    if (name.length < 2) return showToast('Name too short', 'error');
    if (!email.includes('@')) return showToast('Valid email required', 'error');
    if (!specialization) return showToast('Specialization required', 'error');
    if (isNaN(experience) || experience < 0) return showToast('Valid experience required', 'error');
    await crudSave(id ? `/api/trainers/${id}` : '/api/trainers', id ? 'PUT' : 'POST', { name, email, specialization, experience }, () => { showToast(id ? 'Updated!' : 'Added!'); hideForm('trainer-form-container'); loadTrainers(); });
});

function editTrainer(id, name, email, specialization, experience) {
    showForm('trainer-form-container'); $('trainer-form-title').textContent = 'Edit Trainer';
    $('trainer-id').value = id; $('trainer-name').value = name; $('trainer-email').value = email; $('trainer-specialization').value = specialization; $('trainer-experience').value = experience;
}

function deleteTrainer(id) { crudDelete(`/api/trainers/${id}`, loadTrainers); }

let trainerCache = [];
function updateTrainerDropdowns(trainers) {
    trainerCache = trainers;
    ['student-trainer', 'workout-trainer', 'schedule-trainer'].forEach(did => {
        const sel = $(did); if (!sel) return;
        const first = sel.options[0]; sel.innerHTML = ''; sel.appendChild(first);
        trainers.forEach(t => { const o = document.createElement('option'); o.value = t._id; o.textContent = `${t.name} (${t.specialization})`; sel.appendChild(o); });
    });
}

// ── STUDENTS ──────────────────────────────────────────────────
const GOALS = {
    weight: ['Build muscle mass', 'Increase strength', 'Powerlifting prep', 'Body recomposition', 'Bulk & cut cycle'],
    cardio: ['Improve cardiovascular fitness', 'Lose weight', 'Marathon prep', 'Increase stamina', 'Fat loss'],
    yoga: ['Improve flexibility', 'Stress relief', 'Injury recovery', 'Improve posture', 'Core stability'],
    crossfit: ['Athletic performance', 'Full body conditioning', 'Functional strength', 'Competition prep', 'Agility & speed'],
    boxing: ['Combat fitness', 'Agility & reflexes', 'Strength & conditioning', 'Weight class prep', 'Self-defence'],
    pilates: ['Core strength', 'Posture correction', 'Injury prevention', 'Toning & sculpting', 'Back pain relief'],
    default: ['General fitness', 'Weight loss', 'Build muscle', 'Improve endurance', 'Healthy lifestyle', 'Body toning']
};

function getGoals(spec) {
    const s = spec.toLowerCase();
    if (/weight|strength|power|lifting/.test(s)) return GOALS.weight;
    if (/cardio|endurance|running|hiit/.test(s)) return GOALS.cardio;
    if (/yoga|flexibility|stretch|mobility/.test(s)) return GOALS.yoga;
    if (/crossfit|functional|athletic/.test(s)) return GOALS.crossfit;
    if (/box|martial|combat|mma/.test(s)) return GOALS.boxing;
    if (/pilates|core/.test(s)) return GOALS.pilates;
    return GOALS.default;
}

function syncGoalDropdown(trainerId, current = '') {
    const sel = $('student-goal'), hint = $('student-goal-hint');
    sel.innerHTML = '';
    if (!trainerId) { sel.innerHTML = '<option value="">-- Select a trainer first --</option>'; if (hint) hint.textContent = ''; return; }
    const trainer = trainerCache.find(t => t._id === trainerId);
    if (!trainer) return;
    const goals = getGoals(trainer.specialization);
    if (current && !goals.includes(current)) { const o = document.createElement('option'); o.value = current; o.textContent = current; o.selected = true; sel.appendChild(o); }
    goals.forEach(g => { const o = document.createElement('option'); o.value = g; o.textContent = g; if (g === current) o.selected = true; sel.appendChild(o); });
    if (hint) hint.textContent = `Based on: ${trainer.specialization}`;
}

$('student-trainer').addEventListener('change', function () { syncGoalDropdown(this.value); });

async function loadStudents() {
    try {
        const res = await api('/api/students');
        const students = await res.json();
        const c = $('students-list');
        if (!students.length) { c.innerHTML = emptyState('<svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M12 3L2 8l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>', 'No students yet'); return; }
        c.innerHTML = students.map(s => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div class="card-title">${esc(s.name)}</div>
          <div class="card-actions">
            <button class="btn-icon" onclick="editStudent('${s._id}','${escA(s.name)}',${s.age},'${escA(s.fitnessGoal)}','${s.trainer ? s.trainer._id : ''}')">${editSVG}</button>
            <button class="btn-icon delete" onclick="deleteStudent('${s._id}')">${delSVG}</button>
          </div>
        </div>
        <div class="card-body">
          <p>Age: ${s.age}</p>
          <p>${s.trainer ? esc(s.trainer.name) : '<span style="color:var(--red)">No trainer</span>'}</p>
          <span class="card-badge badge-goal">${esc(s.fitnessGoal)}</span>
          ${s.trainer ? `<span class="card-badge badge-trainer">${esc(s.trainer.name)}</span>` : '<span class="card-badge badge-unassigned">Unassigned</span>'}
        </div>
      </div>`).join('');
    } catch { }
}

$('show-student-form-btn').addEventListener('click', () => { showForm('student-form-container'); $('student-form-title').textContent = 'Add Student'; $('student-form').reset(); $('student-id').value = ''; syncGoalDropdown(''); });
['cancel-student', 'cancel-student-2'].forEach(id => $(id).addEventListener('click', () => hideForm('student-form-container')));

$('student-form').addEventListener('submit', async e => {
    e.preventDefault();
    const id = val('student-id'), name = val('student-name'), age = parseInt($('student-age').value), fitnessGoal = $('student-goal').value, trainer = $('student-trainer').value || null;
    if (name.length < 2) return showToast('Name too short', 'error');
    if (isNaN(age) || age < 10 || age > 100) return showToast('Age must be 10-100', 'error');
    if (!fitnessGoal) return showToast('Select a fitness goal', 'error');
    await crudSave(id ? `/api/students/${id}` : '/api/students', id ? 'PUT' : 'POST', { name, age, fitnessGoal, trainer }, () => { showToast(id ? 'Updated!' : 'Added!'); hideForm('student-form-container'); loadStudents(); });
});

function editStudent(id, name, age, fitnessGoal, trainerId) {
    showForm('student-form-container'); $('student-form-title').textContent = 'Edit Student';
    $('student-id').value = id; $('student-name').value = name; $('student-age').value = age; $('student-trainer').value = trainerId;
    syncGoalDropdown(trainerId, fitnessGoal);
}

function deleteStudent(id) { crudDelete(`/api/students/${id}`, loadStudents); }

// ── WORKOUTS ──────────────────────────────────────────────────
function addExerciseRow(name = '', sets = '', reps = '') {
    const row = document.createElement('div'); row.className = 'exercise-row';
    row.innerHTML = `<input type="text" placeholder="Exercise name" value="${escA(name)}" required><input type="number" placeholder="Sets" value="${sets}" min="1" style="max-width:80px" required><input type="number" placeholder="Reps" value="${reps}" min="1" style="max-width:80px" required><button type="button" class="remove-exercise" onclick="this.parentElement.remove()">&#x2715;</button>`;
    $('exercises-list').appendChild(row);
}

async function loadWorkouts() {
    try {
        const res = await api('/api/workouts');
        const plans = await res.json();
        const c = $('workouts-list');
        if (!plans.length) { c.innerHTML = emptyState('<svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M6 12h2M16 12h2M8 12V8M16 12V8M4 12H2M22 12h-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>', 'No workouts yet'); return; }
        c.innerHTML = plans.map(p => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div class="card-title">${esc(p.title)}</div>
          <div class="card-actions">
            <button class="btn-icon" onclick='editWorkout(${JSON.stringify(p).replace(/'/g, "&#39;")})'>${editSVG}</button>
            <button class="btn-icon delete" onclick="deleteWorkout('${p._id}')">${delSVG}</button>
          </div>
        </div>
        <div class="card-body">
          <p>${p.trainer ? esc(p.trainer.name) : 'Unknown'}</p>
          <span class="card-badge badge-duration">${p.duration} min</span>
          <ul class="exercise-list">${p.exercises.map(ex => `<li>${esc(ex.name)} &mdash; ${ex.sets}x${ex.reps}</li>`).join('')}</ul>
        </div>
      </div>`).join('');
    } catch { }
}

$('show-workout-form-btn').addEventListener('click', () => { showForm('workout-form-container'); $('workout-form-title').textContent = 'Create Plan'; $('workout-form').reset(); $('workout-id').value = ''; $('exercises-list').innerHTML = ''; addExerciseRow(); });
$('add-exercise-btn').addEventListener('click', () => addExerciseRow());
['cancel-workout', 'cancel-workout-2'].forEach(id => $(id).addEventListener('click', () => hideForm('workout-form-container')));

$('workout-form').addEventListener('submit', async e => {
    e.preventDefault();
    const id = val('workout-id'), title = val('workout-title'), duration = parseInt($('workout-duration').value), trainer = $('workout-trainer').value;
    if (title.length < 2) return showToast('Title too short', 'error');
    if (isNaN(duration) || duration < 1) return showToast('Valid duration required', 'error');
    if (!trainer) return showToast('Select a trainer', 'error');
    const exercises = Array.from(document.querySelectorAll('#exercises-list .exercise-row')).map(r => { const i = r.querySelectorAll('input'); return { name: i[0].value.trim(), sets: parseInt(i[1].value), reps: parseInt(i[2].value) }; });
    if (!exercises.length) return showToast('Add at least one exercise', 'error');
    await crudSave(id ? `/api/workouts/${id}` : '/api/workouts', id ? 'PUT' : 'POST', { title, duration, trainer, exercises }, () => { showToast(id ? 'Updated!' : 'Created!'); hideForm('workout-form-container'); loadWorkouts(); });
});

function editWorkout(p) {
    showForm('workout-form-container'); $('workout-form-title').textContent = 'Edit Plan';
    $('workout-id').value = p._id; $('workout-title').value = p.title; $('workout-duration').value = p.duration; $('workout-trainer').value = p.trainer ? p.trainer._id : '';
    $('exercises-list').innerHTML = ''; p.exercises.forEach(ex => addExerciseRow(ex.name, ex.sets, ex.reps));
}

function deleteWorkout(id) { crudDelete(`/api/workouts/${id}`, loadWorkouts); }

// ── SCHEDULES ─────────────────────────────────────────────────
async function loadSchedules() {
    try {
        const res = await api('/api/schedules');
        const schedules = await res.json();
        const c = $('schedules-list');
        if (!schedules.length) { c.innerHTML = emptyState('<svg viewBox="0 0 24 24" fill="none" width="24" height="24"><rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>', 'No schedules yet'); return; }
        c.innerHTML = schedules.map(s => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div class="card-title">${s.trainer ? esc(s.trainer.name) : 'Unknown'}</div>
          <div class="card-actions"><button class="btn-icon delete" onclick="deleteSchedule('${s._id}')">${delSVG}</button></div>
        </div>
        <div class="card-body">
          <p>${s.date} &middot; ${s.time}</p>
          ${s.trainer ? `<span class="card-badge badge-trainer">${esc(s.trainer.specialization)}</span>` : ''}
        </div>
      </div>`).join('');
    } catch { }
}

$('show-schedule-form-btn').addEventListener('click', () => { showForm('schedule-form-container'); $('schedule-form').reset(); });
['cancel-schedule', 'cancel-schedule-2'].forEach(id => $(id).addEventListener('click', () => hideForm('schedule-form-container')));

$('schedule-form').addEventListener('submit', async e => {
    e.preventDefault();
    const trainer = $('schedule-trainer').value, date = $('schedule-date').value, time = $('schedule-time').value;
    if (!trainer) return showToast('Select a trainer', 'error');
    if (!date || !time) return showToast('Date and time required', 'error');
    await crudSave('/api/schedules', 'POST', { trainer, date, time }, () => { showToast('Slot added!'); hideForm('schedule-form-container'); loadSchedules(); });
});

function deleteSchedule(id) { crudDelete(`/api/schedules/${id}`, loadSchedules); }

checkAuth();
