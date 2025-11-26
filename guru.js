// guru.js - client-side simple auth + admin (username: guru, password: admin)
const STORAGE_KEY = "qb_v1";

function loadQB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) { console.warn(e); }
  return null;
}
function saveQB(qb) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(qb));
    return true;
  } catch(e) { console.error(e); return false; }
}

function $(s){return document.querySelector(s);}

document.addEventListener("DOMContentLoaded", () => {
  const loginBox = $("#loginBox");
  const adminArea = $("#adminArea");
  const btnDoLogin = $("#btnDoLogin");
  const btnLogout = $("#btnLogout");
  const btnAddQuestion = $("#btnAddQuestion");
  const btnImportCsv = $("#btnImportCsv");
  const csvFile = $("#csv-file");
  const btnExportJson = $("#btnExportJson");
  const btnClearStorage = $("#btnClearStorage");

  function showAdmin(show) {
    if (show) { loginBox.style.display = "none"; adminArea.style.display = "block"; }
    else { loginBox.style.display = "block"; adminArea.style.display = "none"; }
  }

  showAdmin(false);

  btnDoLogin.addEventListener("click", () => {
    const u = $("#username").value.trim();
    const p = $("#password").value;
    if (u === "guru" && p === "admin") {
      alert("Login berhasil. Selamat datang, Guru.");
      showAdmin(true);
    } else {
      alert("Username atau password salah.");
    }
  });

  btnLogout.addEventListener("click", () => {
    showAdmin(false);
    $("#username").value = ""; $("#password").value = "";
  });

  btnAddQuestion.addEventListener("click", () => {
    const cat = ($("#admin-cat").value || "").trim();
    const lvl = ($("#admin-level").value || "").trim();
    const text = ($("#q-text").value || "").trim();
    const a = ($("#q-a").value || "").trim();
    const b = ($("#q-b").value || "").trim();
    const c = ($("#q-c").value || "").trim();
    const d = ($("#q-d").value || "").trim();
    const ans = ($("#q-ans").value || "").trim().toLowerCase();
    const exp = ($("#q-exp").value || "").trim();

    if (!cat || !lvl || !text || !a || !b || !c || !d || !["a","b","c","d"].includes(ans)) {
      alert("Lengkapi semua field dan masukkan jawaban benar (a/b/c/d).");
      return;
    }

    let qb = loadQB();
    if (!qb) qb = {}; // jika belum ada, buat baru
    if (!qb[cat]) qb[cat] = {};
    if (!qb[cat][lvl]) qb[cat][lvl] = [];

    const id = `${cat.slice(0,3).toLowerCase()}-${lvl.slice(0,2).toLowerCase()}-${Date.now()}`;
    qb[cat][lvl].push({
      id, text,
      options: [{id:"a",text:a},{id:"b",text:b},{id:"c",text:c},{id:"d",text:d}],
      answerId: ans, explanation: exp
    });

    const ok = saveQB(qb);
    if (ok) {
      alert("Soal ditambahkan & disimpan di localStorage. Buka index.html untuk memeriksa.");
      // clear inputs
      $("#q-text").value=""; $("#q-a").value=""; $("#q-b").value=""; $("#q-c").value=""; $("#q-d").value=""; $("#q-ans").value=""; $("#q-exp").value="";
    } else {
      alert("Gagal menyimpan soal (cek console).");
    }
  });

  // CSV parsing - same format as described
  function parseCsv(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length>0);
    if (lines.length <= 1) return [];
    const sep = lines[0].includes(";") ? ";" : ",";
    const rows = [];
    for (let i=1;i<lines.length;i++){
      const parts = lines[i].split(sep).map(p => p.trim());
      if (parts.length >= 7) rows.push(parts);
    }
    return rows;
  }

  btnImportCsv.addEventListener("click", () => {
    const file = csvFile.files[0];
    const cat = ($("#admin-cat").value || "").trim();
    const lvl = ($("#admin-level").value || "").trim();
    if (!file) { alert("Pilih file CSV terlebih dahulu."); return; }
    if (!cat || !lvl) { alert("Isi mata pelajaran & level tujuan."); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
      const txt = e.target.result;
      const rows = parseCsv(txt);
      if (!rows.length) { alert("CSV tidak berisi baris soal sesuai format."); return; }
      const qs = rows.map((parts,i) => {
        const [qText,a,b,c,d,ansRaw,exp] = parts;
        const ans = (ansRaw||"a").trim().toLowerCase();
        return {
          id: `${cat.slice(0,3).toLowerCase()}-${lvl.slice(0,2).toLowerCase()}-${Date.now()}-${i}`,
          text: (qText||"").trim(),
          options: [{id:"a",text:(a||"").trim()},{id:"b",text:(b||"").trim()},{id:"c",text:(c||"").trim()},{id:"d",text:(d||"").trim()}],
          answerId: ["a","b","c","d"].includes(ans) ? ans : "a",
          explanation: (exp||"").trim()
        };
      });

      // replace the category/level
      let qb = loadQB() || {};
      if (!qb[cat]) qb[cat] = {};
      qb[cat][lvl] = qs;
      const ok = saveQB(qb);
      if (ok) alert(`Berhasil impor ${qs.length} soal ke ${cat} - ${lvl}. Buka index.html untuk memeriksa.`);
      else alert("Gagal menyimpan hasil impor.");
    };
    reader.readAsText(file);
  });

  btnExportJson.addEventListener("click", () => {
    const qb = loadQB();
    if (!qb) { alert("Belum ada data soal di penyimpanan lokal."); return; }
    const blob = new Blob([JSON.stringify(qb, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "question-bank-backup.json"; a.click();
    URL.revokeObjectURL(url);
  });

  btnClearStorage.addEventListener("click", () => {
    if (!confirm("Reset akan menghapus semua soal yang telah disimpan di browser (localStorage). Tetap lanjutkan?")) return;
    localStorage.removeItem(STORAGE_KEY);
    alert("Bank soal di localStorage telah dihapus. Jika ingin kembalikan ke default, buka index.html (app.js memakai DEFAULT jika localStorage kosong).");
  });

});
