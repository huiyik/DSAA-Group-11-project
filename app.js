/* ============================================================
   SSMHDS – app.js
   Mirrors the fixed Java logic exactly.

   Data structure: JS array used as a Queue (FIFO)
     push()   = Queue.offer()   — add to rear
     shift()  = Queue.poll()    — remove from front
     filter() = iterate + remove (mirrors Queue traversal + remove)

   All 6 functionalities match the Java classes:
     Student.setCondition()
     StudentSystem.login()
     StudentSystem.addStudent()     — with duplicate IC check
     StudentSystem.updateStudent()  — recalculates condition
     StudentSystem.deleteStudent()  — matches by IC (mirrors equals() fix)
     StudentSystem.searchStudent()  — name or IC, case-insensitive name
     StudentSystem.displayStudent() — with alertQueue drain
   ============================================================ */

/* ── DATA STORE ─────────────────────────────────────────────
   Mirrors: Queue<Student> students = new LinkedList<>()
   Seed data matches the sample output shown in the report.   */
let students = [
  { name: "Nurul Aina",   ic: "050312012345", grade: 90, cgpa: 3.9, attendance: 100 },
  { name: "Ahmad Rizwan", ic: "040515076543", grade: 65, cgpa: 2.3, attendance: 70  },
  { name: "Siti Nabilah", ic: "050820034521", grade: 82, cgpa: 3.2, attendance: 90  },
  { name: "Jojo",         ic: "050123091230", grade: 60, cgpa: 3.5, attendance: 90  },
  { name: "Hani",         ic: "060304056789", grade: 30, cgpa: 1.5, attendance: 50  }
];
students.forEach(setCondition);

/* ── setCondition  (mirrors Student.setCondition()) ─────── */
function setCondition(s) {
  if      (s.grade < 50 || s.cgpa < 2.0 || s.attendance < 50) s.condition = "Depression";
  else if (s.grade < 70 || s.cgpa < 2.5 || s.attendance < 75) s.condition = "Stress";
  else                                                          s.condition = "Normal";
}

/* ── STATE ──────────────────────────────────────────────── */
let updateIC  = null;
let deleteIC  = null;
let loginAttempts = 0;
const MAX_ATTEMPTS = 3;   // mirrors TestSystem 3-attempt loop

/* ============================================================
   AUTH  (mirrors StudentSystem.login() + TestSystem retry loop)
   ============================================================ */
function doLogin() {
  const user  = document.getElementById("inp-user").value.trim();
  const pass  = document.getElementById("inp-pass").value.trim();
  const errEl = document.getElementById("login-error");
  const ctrEl = document.getElementById("attempt-counter");

  // Mirrors: user.equals("admin") && pass.equals("1234")
  if (user === "admin" && pass === "1234") {
    errEl.style.display     = "none";
    ctrEl.style.display     = "none";
    loginAttempts           = 0;
    document.getElementById("page-login").classList.remove("active");
    document.getElementById("app-shell").style.display = "flex";
    document.getElementById("nav-username").textContent = user;
    renderAll();
    showPage("dashboard");
  } else {
    loginAttempts++;
    document.getElementById("inp-pass").value = "";

    if (loginAttempts >= MAX_ATTEMPTS) {
      // Mirrors: "Too many failed attempts. Exiting system."
      errEl.style.display  = "none";
      ctrEl.style.display  = "none";
      document.getElementById("login-lockout").style.display = "flex";
      document.getElementById("btn-signin").disabled          = true;
      document.getElementById("inp-user").disabled            = true;
      document.getElementById("inp-pass").disabled            = true;
    } else {
      // Mirrors: "Please try again. (X/3 attempts used)"
      errEl.style.display = "flex";
      ctrEl.style.display = "block";
      ctrEl.textContent   =
        `Attempt ${loginAttempts} of ${MAX_ATTEMPTS}. Please try again.`;
    }
  }
}

// Cancel login — clears fields and resets state (SSMHDS_01_02 optional requirement)
function cancelLogin() {
  document.getElementById("inp-user").value             = "";
  document.getElementById("inp-pass").value             = "";
  document.getElementById("login-error").style.display  = "none";
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

/* ============================================================
   PAGE NAVIGATION
   ============================================================ */
function showPage(page) {
  ["dashboard", "add", "search", "alerts"].forEach(id => {
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

/* ============================================================
   DASHBOARD TABLE  (mirrors StudentSystem.displayStudent())
   SSMHDS_06_01 — display all students in a table
   SSMHDS_06_02 — highlight high-risk students
   SSMHDS_06_03 — display recommendations for high-risk students
   ============================================================ */
function renderTable() {
  const query  = (document.getElementById("dash-filter").value || "").toLowerCase();
  const list   = students.filter(s =>
    !query || s.name.toLowerCase().includes(query) || s.ic.includes(query)
  );
  const tbody  = document.getElementById("student-tbody");

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state">
        <span class="empty-icon">&#128100;</span>
        <p>No students found.</p>
      </div></td></tr>`;
  } else {
    tbody.innerHTML = list.map(s => {
      const rowCls   = s.condition === "Depression" ? "row-depression"
                     : s.condition === "Stress"     ? "row-stress" : "";
      const badgeCls = s.condition === "Depression" ? "badge-depression"
                     : s.condition === "Stress"     ? "badge-stress"    : "badge-normal";

      // SSMHDS_06_03: inline recommendation text for high-risk students
      let recHtml = "";
      if (s.condition === "Depression") {
        recHtml = `<div class="rec-text">Refer to counselor immediately.</div>`;
      } else if (s.condition === "Stress") {
        recHtml = `<div class="rec-text">Schedule check-in session.</div>`;
      }

      return `<tr class="${rowCls}">
        <td>${escHtml(s.name)}</td>
        <td>${escHtml(s.ic)}</td>
        <td>${s.grade}%</td>
        <td>${s.cgpa.toFixed(2)}</td>
        <td>${s.attendance}%</td>
        <td>
          <span class="badge ${badgeCls}">${s.condition}</span>
          ${recHtml}
        </td>
        <td>
          <button class="btn-edit" onclick="openUpdate('${escHtml(s.ic)}')">&#9998; Edit</button>
          <button class="btn-del"  onclick="openDelete('${escHtml(s.ic)}')">&#128465; Del</button>
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

/* ── Stats + alert banner ───────────────────────────────── */
function updateStats() {
  const total   = students.length;
  const nNormal = students.filter(s => s.condition === "Normal").length;
  const nStress = students.filter(s => s.condition === "Stress").length;
  const nDep    = students.filter(s => s.condition === "Depression").length;

  document.getElementById("stat-total").textContent  = total;
  document.getElementById("stat-normal").textContent = nNormal;
  document.getElementById("stat-stress").textContent = nStress;
  document.getElementById("stat-dep").textContent    = nDep;

  const badge  = document.getElementById("alert-badge");
  const atRisk = nDep + nStress;
  badge.textContent    = atRisk > 0 ? atRisk : "";
  badge.style.display  = atRisk > 0 ? "inline" : "none";

  const banner = document.getElementById("dep-banner");
  if (nDep > 0) {
    const names = students
      .filter(s => s.condition === "Depression")
      .map(s => s.name).join(", ");
    document.getElementById("dep-banner-text").textContent =
      `${nDep} student${nDep > 1 ? "s" : ""} flagged for depression risk: ${names}. Counselor has been notified.`;
    banner.style.display = "flex";
  } else {
    banner.style.display = "none";
  }
}

/* ============================================================
   ADD STUDENT  (mirrors StudentSystem.addStudent())
   SSMHDS_02_01: insert name, IC, grade, CGPA, attendance
   SSMHDS_02_02: success message
   SSMHDS_02_03: error message if validation fails
   + duplicate IC check
   ============================================================ */
function addStudent() {
  const name  = document.getElementById("add-name").value.trim();
  const ic    = document.getElementById("add-ic").value.trim();
  const grade = parseFloat(document.getElementById("add-grade").value);
  const cgpa  = parseFloat(document.getElementById("add-cgpa").value);
  const att   = parseInt(document.getElementById("add-att").value);

  const errEl = document.getElementById("add-error");
  const dupEl = document.getElementById("dup-error");
  errEl.style.display = "none";
  dupEl.style.display = "none";

  // Input validation (mirrors addStudent() while-loop guards)
  if (!name || !ic
      || isNaN(grade) || grade < 0 || grade > 100
      || isNaN(cgpa)  || cgpa  < 0 || cgpa  > 4.0
      || isNaN(att)   || att   < 0 || att   > 100) {
    errEl.style.display = "flex";
    return;
  }

  // Duplicate IC check (mirrors: "Error: A student with IC X already exists.")
  if (students.some(s => s.ic === ic)) {
    dupEl.style.display = "flex";
    return;
  }

  const s = { name, ic, grade, cgpa, attendance: att };
  setCondition(s);
  students.push(s);   // mirrors Queue.offer()

  ["add-name","add-ic","add-grade","add-cgpa","add-att"]
    .forEach(id => { document.getElementById(id).value = ""; });

  showToast("Student saved successfully!");   // SSMHDS_02_02
  showPage("dashboard");
}

/* ============================================================
   UPDATE STUDENT  (mirrors StudentSystem.updateStudent())
   SSMHDS_03_01/02: admin modifies grade, CGPA, attendance
   SSMHDS_03_03: success message
   ============================================================ */
function openUpdate(ic) {
  const s = students.find(x => x.ic === ic);
  if (!s) return;
  updateIC = ic;
  document.getElementById("update-name-label").textContent =
    "Updating record for: " + s.name + " (" + ic + ")";
  document.getElementById("upd-grade").value = s.grade;
  document.getElementById("upd-cgpa").value  = s.cgpa;
  document.getElementById("upd-att").value   = s.attendance;
  document.getElementById("update-modal").style.display = "flex";
}

function saveUpdate() {
  const s = students.find(x => x.ic === updateIC);
  if (!s) return;
  const g = parseFloat(document.getElementById("upd-grade").value);
  const c = parseFloat(document.getElementById("upd-cgpa").value);
  const a = parseInt(document.getElementById("upd-att").value);
  if (!isNaN(g) && g >= 0 && g <= 100)  s.grade      = g;
  if (!isNaN(c) && c >= 0 && c <= 4.0)  s.cgpa       = c;
  if (!isNaN(a) && a >= 0 && a <= 100)  s.attendance = a;
  setCondition(s);   // mirrors s.setCondition() after update
  closeModal("update-modal");
  renderAll();
  showToast("Student updated successfully!");   // SSMHDS_03_03
}

/* ============================================================
   DELETE STUDENT  (mirrors StudentSystem.deleteStudent())
   SSMHDS_08_01: delete by IC (via row button) OR by name/IC (search modal)
   SSMHDS_08_02: success message
   ============================================================ */

// Delete via row button — opens confirm modal with IC already known
function openDelete(ic) {
  const s = students.find(x => x.ic === ic);
  if (!s) return;
  deleteIC = ic;
  document.getElementById("delete-confirm-text").textContent =
    "Are you sure you want to delete the record for " + s.name +
    " (" + ic + ")? This action cannot be undone.";
  document.getElementById("delete-modal").style.display = "flex";
}

function confirmDelete() {
  // Mirrors: students.remove(target) — matched by IC (uses equals() override)
  students = students.filter(x => x.ic !== deleteIC);
  closeModal("delete-modal");
  renderAll();
  showToast("Student deleted successfully!");   // SSMHDS_08_02
}

// SSMHDS_08_01: Delete by name or IC — search first, then delete
function openDeleteSearch() {
  document.getElementById("del-search-key").value   = "";
  document.getElementById("del-search-result").innerHTML = "";
  document.getElementById("delete-search-modal").style.display = "flex";
}

function findForDelete() {
  const key    = document.getElementById("del-search-key").value.trim().toLowerCase();
  const resEl  = document.getElementById("del-search-result");
  if (!key) { resEl.innerHTML = `<p style="font-size:12px;color:#90a4ae">Please enter a name or IC number.</p>`; return; }

  // Mirrors: s.name.equalsIgnoreCase(key) || s.ic.equals(key)
  const found = students.filter(s =>
    s.name.toLowerCase().includes(key) || s.ic.includes(key)
  );

  if (!found.length) {
    resEl.innerHTML = `<p style="font-size:13px;color:#c62828">&#9888; Student not found.</p>`;
    return;
  }

  resEl.innerHTML = found.map(s => {
    const badgeCls = s.condition === "Depression" ? "badge-depression"
                   : s.condition === "Stress"     ? "badge-stress" : "badge-normal";
    return `<div class="del-find-card">
      <div>
        <div class="del-name">${escHtml(s.name)}</div>
        <div class="del-ic">${escHtml(s.ic)} &nbsp;|&nbsp; <span class="badge ${badgeCls}" style="font-size:10px;padding:2px 7px">${s.condition}</span></div>
      </div>
      <button class="btn-danger" style="padding:5px 12px;font-size:12px"
        onclick="deleteFromSearch('${escHtml(s.ic)}')">&#128465; Delete</button>
    </div>`;
  }).join("");
}

function deleteFromSearch(ic) {
  students = students.filter(x => x.ic !== ic);
  closeModal("delete-search-modal");
  renderAll();
  showToast("Student deleted successfully!");   // SSMHDS_08_02
}

/* ============================================================
   SEARCH  (mirrors StudentSystem.searchStudent())
   Searches by name (case-insensitive) or IC number
   ============================================================ */
function doSearch() {
  const key   = document.getElementById("search-key").value.trim().toLowerCase();
  const resEl = document.getElementById("search-result");

  if (!key) {
    resEl.innerHTML = `<p style="color:#90a4ae;font-size:13px">Please enter a name or IC number.</p>`;
    return;
  }

  // Mirrors: s.name.equalsIgnoreCase(key) || s.ic.equals(key)
  const found = students.filter(s =>
    s.name.toLowerCase().includes(key) || s.ic.includes(key)
  );

  if (!found.length) {
    resEl.innerHTML = `<div class="empty-state">
      <span class="empty-icon">&#128100;</span>
      <p>Student not found for "<strong>${escHtml(key)}</strong>".</p>
    </div>`;
    return;
  }

  resEl.innerHTML = found.map(s => {
    const badgeCls = s.condition === "Depression" ? "badge-depression"
                   : s.condition === "Stress"     ? "badge-stress" : "badge-normal";
    return `<div class="result-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <span style="font-size:15px;font-weight:600">${escHtml(s.name)}</span>
        <span class="badge ${badgeCls}">${s.condition}</span>
      </div>
      <table>
        <tr><td>IC Number</td>  <td>${escHtml(s.ic)}</td></tr>
        <tr><td>Grade Mark</td> <td>${s.grade}%</td></tr>
        <tr><td>CGPA</td>       <td>${s.cgpa.toFixed(2)}</td></tr>
        <tr><td>Attendance</td> <td>${s.attendance}%</td></tr>
      </table>
    </div>`;
  }).join("");
}

/* ============================================================
   ALERTS PAGE  (mirrors alertQueue drain in displayStudent())
   SSMHDS_07_01: counselor notified of high-risk students
   SSMHDS_06_03: recommendations shown per student
   ============================================================ */
function renderAlerts() {
  // Mirrors Java:
  //   Queue<Student> alertQueue = new LinkedList<>();
  //   for (Student s : students) { if (!Normal) alertQueue.offer(s); }
  //   while (!alertQueue.isEmpty()) { at = alertQueue.poll(); print alert }
  const alertQueue = students.filter(s => s.condition !== "Normal");
  const listEl     = document.getElementById("notif-list");

  if (!alertQueue.length) {
    listEl.innerHTML = `<div class="empty-state">
      <span class="empty-icon">&#128276;</span>
      <p>No alerts at this time. All students are Normal.</p>
    </div>`;
    return;
  }

  // Drain queue — FIFO order matches insertion order (mirrors alertQueue.poll())
  listEl.innerHTML = alertQueue.map(s => {
    const isDep = s.condition === "Depression";
    // Mirrors: if (at.condition.equals("Depression")) rec = "IMMEDIATELY" else "check-in"
    const rec   = isDep
      ? "Refer to counselor IMMEDIATELY. Schedule welfare check and parental notification."
      : "Monitor closely. Recommend academic support and schedule a check-in session.";
    return `<div class="notif-card ${isDep ? "unread" : "unread-stress"}">
      <div class="notif-icon ${isDep ? "dep" : "str"}">${isDep ? "&#9888;" : "&#128543;"}</div>
      <div style="flex:1">
        <div class="notif-name">${escHtml(s.name)}
          <span style="font-size:11px;color:#90a4ae;font-weight:400"> (${escHtml(s.ic)})</span>
        </div>
        <div class="notif-detail">
          Condition: <strong>${s.condition}</strong> &nbsp;|&nbsp;
          Grade: ${s.grade}% &nbsp;|&nbsp;
          CGPA: ${s.cgpa.toFixed(2)} &nbsp;|&nbsp;
          Attendance: ${s.attendance}%
        </div>
        <div class="notif-rec">&#128161; ${rec}</div>
      </div>
      <div class="notif-time">Today</div>
    </div>`;
  }).join("");
}

function clearAlerts() {
  document.querySelectorAll(".notif-card").forEach(c =>
    c.classList.remove("unread", "unread-stress")
  );
  document.getElementById("alert-badge").style.display = "none";
  showToast("All alerts marked as read.");
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

function closeIfOverlay(event, id) {
  if (event.target === document.getElementById(id)) closeModal(id);
}

/* ============================================================
   TOAST
   ============================================================ */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  document.getElementById("toast-msg").textContent = msg;
  el.style.display = "flex";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = "none"; }, 2600);
}

/* ============================================================
   UTILITY
   ============================================================ */
function escHtml(str) {
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;");
}
