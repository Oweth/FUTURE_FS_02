const STORAGE_KEY = 'leadflow_crm_leads';
let leads = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let editId = null;
let notesLeadId = null;

// Seed demo data if empty
if (!leads.length) {
const demo = [
    { id: uid(), fname:'Amara', lname:'Nkosi', email:'amara.nkosi@gmail.com', source:'LinkedIn', status:'new', notes:[{text:'Interested in website redesign', date:today()}], added: today() },
    { id: uid(), fname:'David', lname:'Chen', email:'d.chen@techcorp.co', source:'Website', status:'contacted', notes:[{text:'Demo scheduled for next week', date:today()}], added: today() },
    { id: uid(), fname:'Sofia', lname:'Martínez', email:'sofia.m@startup.io', source:'Referral', status:'converted', notes:[{text:'Signed contract — Q2 project', date:today()}], added: today() },
    { id: uid(), fname:'James', lname:'Okafor', email:'james.ok@agency.co', source:'Email Campaign', status:'new', notes:[], added: today() },
];
leads = demo;
save();
}

function uid() { return Math.random().toString(36).slice(2,10) + Date.now().toString(36); }
function today() { return new Date().toISOString().split('T')[0]; }
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); }

function updateStats() {
document.getElementById('st-total').textContent = leads.length;
document.getElementById('st-new').textContent = leads.filter(l=>l.status==='new').length;
document.getElementById('st-contacted').textContent = leads.filter(l=>l.status==='contacted').length;
document.getElementById('st-converted').textContent = leads.filter(l=>l.status==='converted').length;
}

function getFiltered() {
const q = document.getElementById('search').value.toLowerCase();
const fs = document.getElementById('filterStatus').value;
const src = document.getElementById('filterSource').value;
return leads.filter(l => {
    const match = !q || `${l.fname} ${l.lname} ${l.email} ${l.source}`.toLowerCase().includes(q);
    const stMatch = !fs || l.status === fs;
    const srcMatch = !src || l.source === src;
    return match && stMatch && srcMatch;
});
}

function render() {
updateStats();
const filtered = getFiltered();
const tbody = document.getElementById('leads-body');
const empty = document.getElementById('empty-state');
if (!filtered.length) { tbody.innerHTML=''; empty.style.display='block'; return; }
empty.style.display='none';
tbody.innerHTML = filtered.map(l => {
    const latestNote = l.notes.length ? l.notes[l.notes.length-1].text : '—';
    return `<tr>
    <td>
        <div class="lead-name">${l.fname} ${l.lname}</div>
    </td>
    <td><span class="lead-email">${l.email}</span></td>
    <td><span class="source-badge">${l.source}</span></td>
    <td>
        <select class="status-select status-${l.status}" onchange="updateStatus('${l.id}', this.value)">
        <option value="new" ${l.status==='new'?'selected':''}>● New</option>
        <option value="contacted" ${l.status==='contacted'?'selected':''}>● Contacted</option>
        <option value="converted" ${l.status==='converted'?'selected':''}>● Converted</option>
        </select>
    </td>
    <td><span class="note-text" title="${latestNote}">${latestNote}</span></td>
    <td><span class="date-text">${l.added}</span></td>
    <td>
        <div class="actions">
        <button class="btn btn-ghost" style="padding:6px 12px;font-size:0.8rem" onclick="openNotes('${l.id}')">Notes</button>
        <button class="btn btn-ghost" style="padding:6px 12px;font-size:0.8rem" onclick="openEdit('${l.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteLead('${l.id}')">✕</button>
        </div>
    </td>
    </tr>`;
}).join('');
}

function updateStatus(id, val) {
const l = leads.find(x=>x.id===id);
if (l) { l.status = val; save(); render(); toast(`Status updated to ${val}`); }
}

function openAddModal() {
editId = null;
document.getElementById('modal-title').innerHTML = 'Add <span>New Lead</span>';
['f-fname','f-lname','f-email','f-note'].forEach(id => document.getElementById(id).value='');
document.getElementById('f-source').value = 'Website';
document.getElementById('f-status').value = 'new';
document.getElementById('addModal').classList.add('show');
}

function openEdit(id) {
const l = leads.find(x=>x.id===id);
if (!l) return;
editId = id;
document.getElementById('modal-title').innerHTML = 'Edit <span>Lead</span>';
document.getElementById('f-fname').value = l.fname;
document.getElementById('f-lname').value = l.lname;
document.getElementById('f-email').value = l.email;
document.getElementById('f-source').value = l.source;
document.getElementById('f-status').value = l.status;
document.getElementById('f-note').value = '';
document.getElementById('addModal').classList.add('show');
}

function saveLead() {
const fname = document.getElementById('f-fname').value.trim();
const lname = document.getElementById('f-lname').value.trim();
const email = document.getElementById('f-email').value.trim();
const source = document.getElementById('f-source').value;
const status = document.getElementById('f-status').value;
const note = document.getElementById('f-note').value.trim();
if (!fname || !lname || !email) { toast('Please fill in required fields'); return; }
if (editId) {
    const l = leads.find(x=>x.id===editId);
    if (l) { Object.assign(l, {fname,lname,email,source,status}); if(note) l.notes.push({text:note,date:today()}); }
    toast('Lead updated');
} else {
    leads.unshift({ id:uid(), fname, lname, email, source, status, notes: note?[{text:note,date:today()}]:[], added:today() });
    toast('Lead added');
}
save(); render(); closeModal('addModal');
}

function deleteLead(id) {
if (!confirm('Delete this lead?')) return;
leads = leads.filter(l=>l.id!==id);
save(); render(); toast('Lead deleted');
}

function openNotes(id) {
notesLeadId = id;
renderNotes();
document.getElementById('notesModal').classList.add('show');
setTimeout(() => document.getElementById('new-note-input').focus(), 100);
}

function renderNotes() {
const l = leads.find(x=>x.id===notesLeadId);
if (!l) return;
const list = document.getElementById('notes-list');
list.innerHTML = l.notes.length ? l.notes.slice().reverse().map(n=>`
    <div class="note-item">
    <div class="note-item-text">${n.text}</div>
    <div class="note-item-date">${n.date}</div>
    </div>`).join('') : '<div class="empty-text" style="color:var(--muted);font-size:0.875rem">No notes yet.</div>';
}

function addNote() {
const input = document.getElementById('new-note-input');
const text = input.value.trim();
if (!text) return;
const l = leads.find(x=>x.id===notesLeadId);
if (l) { l.notes.push({text, date:today()}); save(); render(); renderNotes(); input.value=''; toast('Note added'); }
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => { if(e.target===o) o.classList.remove('show'); }));

let toastTimer;
function toast(msg) {
const el = document.getElementById('toast');
el.textContent = msg; el.classList.add('show');
clearTimeout(toastTimer);
toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

render();