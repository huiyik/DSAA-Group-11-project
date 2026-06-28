/* ============================================================
   SSMHDS – app.js
   Mirrors the Java code exactly:
   - Student fields: id, name, mark, cgpa, attendance, addedBy
   - getAlert() logic matches Java Student.getAlert()
   - 5 alert categories same as Java
   - searchStudent() matches by id OR name (case-insensitive)
   - searchById() used internally for duplicate check
   - addStudent() / updateStudent() / deleteStudent() same logic as Java
   - displayStudents() = Dashboard table traversal
   - Alerts page = GUI-only feature (not in Java console)
   ============================================================ */

/* ── DATA (mirrors Java StudentLinkedList with Student nodes) ── */
// Using JS array as the linked list (push = insert at end)
// Field names match Java exactly: id, name, mark, cgpa, attendance, addedBy
let students = [
  { id: "S001", name: "Nurul Aina",   mark: 82, cgpa: 3.8, attendance: 90, addedBy: "admin" },
  { id: "S002", name: "Ahmad Rizwan", mark: 60, cgpa: 1.8, attendance: 65, addedBy: "admin" },
  { id: "S003", name: "Siti Nabilah", mark: 75, cgpa: 3.6, attendance: 85, addedBy: "admin" },
  { id: "S004", name: "Jojo",         mark: 55, cgpa: 2.5, attendance: 68, addedBy: "admin" },
  { id: "S005", name: "Hani",         mark: 30, cgpa: 1.5, attendance: 50, addedBy: "admin" }
];

/* ── getAlert() — mirrors Java Student.getAlert() exactly ─── */
function getAlert(s) {
  if (s.cgpa >= 3.50 && s.attendance >= 80) return "Normal";
  if (s.attendance < 70 && s.cgpa < 2.00)  return "Critical - Depression";
  if (s.attendance < 70)                    return "Attendance Issue";
  if (s.cgpa < 2.00)                        return "Academic Risk - Stress";
  return "Average Performance";
}

/* ── getNotification() — mirrors Java Student.getNotification() ── */
function getNotification(s) {
  const a = getAlert(s);
  if (a === "Normal")                 return "Counselor/Admin: Student performance is good. No action needed.";
  if (a === "Critical - Depression")  return "ADMIN ALERT: Immediate intervention required! Low attendance and academic performance.";
  if (a === "Attendance Issue")       return "COUNSELOR ALERT: Contact student regarding attendance.";
  if (a === "Academic Risk - Stress") return "COUNSELOR ALERT: Student needs academic guidance.";
  return "Counselor: Monitor student progress.";
}

/* ── Row colour class (GUI-only — Java console has no colour) ── */
function rowClass(s) {
  const a = getAlert(s);
  if (a === "Critical - Depression")  return "row-depression";
  if (a === "Attendance Issue")       return "row-attendance";
  if (a === "Academic Risk - Stress") return "row-stress";
  return "";
}

/* ── Badge CSS class for alert label ── */
function badgeClass(s) {
  const a = getAlert(s);
  if (a === "Critical - Depression")  return "badge-depression";
  if (a === "Attendance Issue")       return "badge-attendance";
  if (a === "Academic Risk - Stress") return "badge-stress";
  if (a === "Normal")                 return "badge-normal";
  return "badge-avg";
}

/* ── STATE ── */
let updateId  = null;
let deleteId  = null;
let loginAttempts = 0;
const MAX_ATTEMPTS = 3;

/* ── LOGIN — mirrors Java Main.java while(!loggedIn && attempts < 3) ── */
function doLogin() {
  const user = document.getElementById("inp-user").value.trim();
  const pass = document.getElementById("inp-pass").value.trim();
  const errEl = document.getElementById("login-error");
  const ctrEl = document.getElementById("attempt-counter");

  if (user === "admin" && pass === "1234") {
    errEl.style.display = "none";
    ctrEl.style.display = "none";
    loginAttempts = 0;
    document.getElementById("page-login").classList.remove("active");
    document.getElementById("app-shell").style.display = "flex";
    document.getElementById("nav-username").textContent = user;
    renderAll();
    showPage("dashboard");
  } else {
    loginAttempts++;
    document.getElementById("inp-pass").value = "";
    if (loginAttempts >= MAX_ATTEMPTS) {
      errEl.style.display = "none";
      ctrEl.style.display = "none";
      document.getElementById("login-lockout").style.display = "flex";
      document.getElementById("btn-signin").disabled = true;
      document.getElementById("inp-user").disabled  = true;
      document.getElementById("inp-pass").disabled  = true;
    } else {
      errEl.style.display = "flex";
      ctrEl.style.display = "block";
      ctrEl.textContent   = "Attempts remaining: " + (MAX_ATTEMPTS - loginAttempts);
    }
  }
}

function cancelLogin() {
  document.getElementById("inp-user").value = "";
  document.getElementById("inp-pass").value = "";
  document.getElementById("login-error").style.display    = "none";
  document.getElementById("attempt-counter").style.display = "none";
}

function doLogout() {
  loginAttempts = 0;
  document.getElementById("page-login").classList.add("active");
  document.getElementById("app-shell").style.display           = "none";
  document.getElementById("inp-user").value                    = "";
  document.getElementById("inp-pass").value                    = "";
  document.getElementById("inp-user").disabled                 = false;
  document.getElementById("inp-pass").disabled                 = false;
  document.getElementById("btn-signin").disabled               = false;
  document.getElementById("login-error").style.display         = "none";
  document.getElementById("login-lockout").style.display       = "none";
  document.getElementById("attempt-counter").style.display     = "none";
}

document.getElementById("inp-user").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("inp-pass").focus();
});
document.getElementById("inp-pass").addEventListener("keydown", e => {
  if (e.key === "Enter") doLogin();
});

/* ── PAGE NAVIGATION ── */
function showPage(page) {
  ["dashboard","add","search","alerts"].forEach(id => {
    document.getElementById("page-" + id).classList.remove("active");
    const nb = document.getElementById("nav-" + id);
    if (nb) nb.classList.remove("active");
  });
  document.getElementById("page-" + page).classList.add("active");
  const nb = document.getElementById("nav-" + page);
  if (nb) nb.classList.add("active");
  if (page === "dashboard") renderTable();
  if (page === "alerts")    renderAlerts();
}

function renderAll() { renderTable(); updateStats(); renderAlerts(); }

/* ── DASHBOARD TABLE
   Mirrors Java displayStudents() — traverses all nodes and calls display()
   Colour coding is GUI-only. Java console has no colour.           ── */
function renderTable() {
  const query = (document.getElementById("dash-filter").value || "").toLowerCase();
  const list  = students.filter(s =>
    !query || s.id.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
  );
  const tbody = document.getElementById("student-tbody");

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8">
      <div class="empty-state"><span class="empty-icon">&#128100;</span><p>No students found.</p></div>
    </td></tr>`;
  } else {
    tbody.innerHTML = list.map(s => {
      const alert = getAlert(s);
      const rec   = alert !== "Normal" && alert !== "Average Performance"
        ? `<div class="rec-text">${getNotification(s)}</div>` : "";
      return `<tr class="${rowClass(s)}">
        <td>${escHtml(s.id)}</td>
        <td>${escHtml(s.name)}</td>
        <td>${s.mark}</td>
        <td>${s.cgpa.toFixed(2)}</td>
        <td>${s.attendance}%</td>
        <td>${escHtml(s.addedBy)}</td>
        <td>
          <span class="badge ${badgeClass(s)}">${alert}</span>
          ${rec}
        </td>
        <td>
          <button class="btn-edit" onclick="openUpdate('${escHtml(s.id)}')">&#9998; Edit</button>
          <button class="btn-del"  onclick="openDelete('${escHtml(s.id)}')">&#128465; Del</button>
        </td>
      </tr>`;
    }).join("");
  }
  updateStats();
}

function clearFilter() {
  document.getElementById("dash-filter").value = "";
  renderTable();
}

function updateStats() {
  const t    = students.length;
  const norm = students.filter(s => getAlert(s) === "Normal").length;
  const avg  = students.filter(s => getAlert(s) === "Average Performance").length;
  const att  = students.filter(s => getAlert(s) === "Attendance Issue").length;
  const str  = students.filter(s => getAlert(s) === "Academic Risk - Stress").length;
  const dep  = students.filter(s => getAlert(s) === "Critical - Depression").length;

  document.getElementById("stat-total").textContent  = t;
  document.getElementById("stat-normal").textContent = norm;
  document.getElementById("stat-avg").textContent    = avg;
  document.getElementById("stat-att").textContent    = att;
  document.getElementById("stat-stress").textContent = str;
  document.getElementById("stat-dep").textContent    = dep;

  const badge   = document.getElementById("alert-badge");
  const atRisk  = att + str + dep;
  badge.textContent   = atRisk > 0 ? atRisk : "";
  badge.style.display = atRisk > 0 ? "inline" : "none";

  const banner = document.getElementById("dep-banner");
  if (dep > 0) {
    const names = students.filter(s => getAlert(s) === "Critical - Depression").map(s => s.name).join(", ");
    document.getElementById("dep-banner-text").textContent =
      dep + " student" + (dep > 1 ? "s" : "") + " flagged as Critical - Depression: " + names + ". Counselor has been notified.";
    banner.style.display = "flex";
  } else {
    banner.style.display = "none";
  }
}

/* ── ADD STUDENT — mirrors Java addStudent()
   Checks for duplicate ID first (same as searchById() check in Java) ── */
function addStudent() {
  const id   = document.getElementById("add-id").value.trim();
  const name = document.getElementById("add-name").value.trim();
  const mark = parseFloat(document.getElementById("add-mark").value);
  const cgpa = parseFloat(document.getElementById("add-cgpa").value);
  const att  = parseInt(document.getElementById("add-att").value);

  document.getElementById("add-error").style.display = "none";
  document.getElementById("dup-error").style.display = "none";

  if (!id || !name || isNaN(mark) || mark < 0 || mark > 100
           || isNaN(cgpa) || cgpa < 0 || cgpa > 4.0
           || isNaN(att)  || att  < 0 || att  > 100) {
    document.getElementById("add-error").style.display = "flex";
    return;
  }

  // Duplicate ID check — mirrors Java searchById() before addStudent()
  if (students.some(s => s.id === id)) {
    document.getElementById("dup-error").style.display = "flex";
    return;
  }

  // Get logged-in username for addedBy field
  const addedBy = document.getElementById("nav-username").textContent || "admin";

  students.push({ id, name, mark, cgpa, attendance: att, addedBy });

  ["add-id","add-name","add-mark","add-cgpa","add-att"]
    .forEach(i => { document.getElementById(i).value = ""; });

  showToast("Student added successfully!");
  showPage("dashboard");
}

/* ── UPDATE STUDENT — mirrors Java updateStudent()
   Only updates mark, cgpa, attendance (same as Java)                ── */
function openUpdate(id) {
  const s = students.find(x => x.id === id);
  if (!s) return;
  updateId = id;
  document.getElementById("update-name-label").textContent =
    "Updating record for: " + s.name + " (ID: " + id + ")";
  document.getElementById("upd-mark").value = s.mark;
  document.getElementById("upd-cgpa").value = s.cgpa;
  document.getElementById("upd-att").value  = s.attendance;
  document.getElementById("update-modal").style.display = "flex";
}

function saveUpdate() {
  const s = students.find(x => x.id === updateId);
  if (!s) return;
  const m = parseFloat(document.getElementById("upd-mark").value);
  const c = parseFloat(document.getElementById("upd-cgpa").value);
  const a = parseInt(document.getElementById("upd-att").value);
  if (!isNaN(m) && m >= 0 && m <= 100)  s.mark       = m;
  if (!isNaN(c) && c >= 0 && c <= 4.0)  s.cgpa       = c;
  if (!isNaN(a) && a >= 0 && a <= 100)  s.attendance = a;
  closeModal("update-modal");
  renderAll();
  showToast("Student updated successfully!");
}

/* ── DELETE STUDENT — mirrors Java deleteStudent()
   Finds by ID (same as Java searchById() before removing)           ── */
function openDelete(id) {
  const s = students.find(x => x.id === id);
  if (!s) return;
  deleteId = id;
  document.getElementById("delete-confirm-text").textContent =
    "Are you sure you want to delete the record for " + s.name + " (ID: " + id + ")? This cannot be undone.";
  document.getElementById("delete-modal").style.display = "flex";
}

function confirmDelete() {
  students = students.filter(x => x.id !== deleteId);
  closeModal("delete-modal");
  renderAll();
  showToast("Student deleted successfully!");
}

/* ── DELETE BY ID OR NAME (GUI-only modal feature) ── */
function openDeleteSearch() {
  document.getElementById("del-search-key").value = "";
  document.getElementById("del-search-result").innerHTML = "";
  document.getElementById("delete-search-modal").style.display = "flex";
}

function findForDelete() {
  const key   = document.getElementById("del-search-key").value.trim().toLowerCase();
  const resEl = document.getElementById("del-search-result");
  if (!key) {
    resEl.innerHTML = `<p style="font-size:12px;color:#90a4ae">Please enter a Student ID or name.</p>`;
    return;
  }
  // mirrors Java searchStudent(key) — matches id OR name
  const found = students.filter(s =>
    s.id.toLowerCase().includes(key) || s.name.toLowerCase().includes(key)
  );
  if (!found.length) {
    resEl.innerHTML = `<p style="font-size:13px;color:#c62828">&#9888; Student not found!</p>`;
    return;
  }
  resEl.innerHTML = found.map(s => `
    <div class="del-find-card">
      <div>
        <div class="del-name">${escHtml(s.name)}</div>
        <div class="del-ic">ID: ${escHtml(s.id)} &nbsp;|&nbsp;
          <span class="badge ${badgeClass(s)}" style="font-size:10px;padding:2px 7px">${getAlert(s)}</span>
        </div>
      </div>
      <button class="btn-danger" style="padding:5px 12px;font-size:12px"
        onclick="deleteFromSearch('${escHtml(s.id)}')">&#128465; Delete</button>
    </div>`).join("");
}

function deleteFromSearch(id) {
  students = students.filter(x => x.id !== id);
  closeModal("delete-search-modal");
  renderAll();
  showToast("Student deleted successfully!");
}

/* ── SEARCH — mirrors Java searchStudent(key)
   Searches by Student ID or name (case-insensitive name match)      ── */
function doSearch() {
  const key   = document.getElementById("search-key").value.trim().toLowerCase();
  const resEl = document.getElementById("search-result");
  if (!key) {
    resEl.innerHTML = `<p style="color:#90a4ae;font-size:13px">Please enter a Student ID or name.</p>`;
    return;
  }
  const found = students.filter(s =>
    s.id.toLowerCase().includes(key) || s.name.toLowerCase().includes(key)
  );
  if (!found.length) {
    resEl.innerHTML = `<div class="empty-state">
      <span class="empty-icon">&#128100;</span>
      <p>Student not found!</p>
    </div>`;
    return;
  }
  resEl.innerHTML = found.map(s => `
    <div class="result-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <span style="font-size:15px;font-weight:600">${escHtml(s.name)}</span>
        <span class="badge ${badgeClass(s)}">${getAlert(s)}</span>
      </div>
      <table>
        <tr><td>Student ID</td>  <td>${escHtml(s.id)}</td></tr>
        <tr><td>Mark</td>        <td>${s.mark}</td></tr>
        <tr><td>CGPA</td>        <td>${s.cgpa.toFixed(2)}</td></tr>
        <tr><td>Attendance</td>  <td>${s.attendance}%</td></tr>
        <tr><td>Added By</td>    <td>${escHtml(s.addedBy)}</td></tr>
        <tr><td>Notification</td><td>${getNotification(s)}</td></tr>
      </table>
    </div>`).join("");
}

/* ── ALERTS PAGE (GUI-only feature)
   In Java, alert + notification are printed inline inside display().
   The GUI adds a dedicated Alerts page for counsellors.             ── */
function renderAlerts() {
  const flagged = students.filter(s => {
    const a = getAlert(s);
    return a !== "Normal" && a !== "Average Performance";
  });
  const listEl = document.getElementById("notif-list");
  if (!flagged.length) {
    listEl.innerHTML = `<div class="empty-state">
      <span class="empty-icon">&#128276;</span>
      <p>No alerts. All students are Normal or Average Performance.</p>
    </div>`;
    return;
  }
  listEl.innerHTML = flagged.map(s => {
    const alert = getAlert(s);
    const isDep = alert === "Critical - Depression";
    const isAtt = alert === "Attendance Issue";
    const icon  = isDep ? "dep" : isAtt ? "att" : "str";
    const border = isDep ? "unread" : isAtt ? "unread-att" : "unread-stress";
    return `<div class="notif-card ${border}">
      <div class="notif-icon ${icon}">${isDep ? "&#9888;" : isAtt ? "&#128197;" : "&#128543;"}</div>
      <div style="flex:1">
        <div class="notif-name">${escHtml(s.name)}
          <span style="font-size:11px;color:#90a4ae;font-weight:400"> (ID: ${escHtml(s.id)})</span>
        </div>
        <div class="notif-detail">
          Alert: <strong>${alert}</strong> &nbsp;|&nbsp;
          CGPA: ${s.cgpa.toFixed(2)} &nbsp;|&nbsp;
          Attendance: ${s.attendance}% &nbsp;|&nbsp;
          Mark: ${s.mark}
        </div>
        <div class="notif-rec">&#128161; ${getNotification(s)}</div>
      </div>
      <div class="notif-time">Today</div>
    </div>`;
  }).join("");
}

function clearAlerts() {
  document.querySelectorAll(".notif-card").forEach(c =>
    c.classList.remove("unread","unread-stress","unread-att")
  );
  document.getElementById("alert-badge").style.display = "none";
  showToast("All alerts marked as read.");
}

/* ── MODALS ── */
function closeModal(id) { document.getElementById(id).style.display = "none"; }
function closeIfOverlay(e, id) { if (e.target === document.getElementById(id)) closeModal(id); }

/* ── TOAST ── */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  document.getElementById("toast-msg").textContent = msg;
  el.style.display = "flex";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = "none"; }, 2600);
}

/* ── UTILITY ── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
