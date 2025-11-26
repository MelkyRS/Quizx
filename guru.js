let QUESTION_BANK = {};

function $(s) {
  return document.querySelector(s);
}

async function loadQuestionBankForGuru() {
  try {
    const res = await fetch("questions.json?cacheBust=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    QUESTION_BANK = await res.json();
    console.log("Bank soal dimuat untuk guru:", QUESTION_BANK);
  } catch (err) {
    console.error("Gagal memuat questions.json:", err);
    alert(
      "Gagal memuat questions.json.\n" +
        "Jika ini pertama kali, Anda bisa mulai dari bank kosong, lalu unduh & upload ke GitHub/Vercel."
    );
    QUESTION_BANK = {};
  }
}

function toIdFragment(str) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

document.addEventListener("DOMContentLoaded", () => {
  const loginBox = $("#loginBox");
  const adminArea = $("#adminArea");
  const btnDoLogin = $("#btnDoLogin");
  const btnLogout = $("#btnLogout");
  const btnAddQuestion = $("#btnAddQuestion");
  const btnImportCsv = $("#btnImportCsv");
  const csvFile = $("#csv-file");
  const btnExportJson = $("#btnExportJson");

  function showAdmin(show) {
    if (show) {
      loginBox.style.display = "none";
      adminArea.style.display = "block";
      // ketika guru masuk, load bank soal
      loadQuestionBankForGuru();
    } else {
      loginBox.style.display = "block";
      adminArea.style.display = "none";
    }
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
    $("#username").value = "";
    $("#password").value = "";
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

    if (!cat || !lvl || !text || !a || !b || !c || !d || !["a", "b", "c", "d"].includes(ans)) {
      alert("Lengkapi semua field dan masukkan jawaban benar (a/b/c/d).");
      return;
    }

    if (!QUESTION_BANK[cat]) QUESTION_BANK[cat] = {};
    if (!QUESTION_BANK[cat][lvl]) QUESTION_BANK[cat][lvl] = [];

    const baseId = toIdFragment(cat) + "-" + toIdFragment(lvl);
    const id = `${baseId}-${Date.now()}-${QUESTION_BANK[cat][lvl].length + 1}`;

    QUESTION_BANK[cat][lvl].push({
      id,
      text,
      options: [
        { id: "a", text: a },
        { id: "b", text: b },
        { id: "c", text: c },
        { id: "d", text: d },
      ],
      answerId: ans,
      explanation: exp,
    });

    alert(
      "Soal ditambahkan ke bank di memori.\n" +
        "Setelah selesai mengedit, klik 'Unduh questions.json' lalu upload file itu ke GitHub/Vercel."
    );

    // Clear input
    $("#q-text").value = "";
    $("#q-a").value = "";
    $("#q-b").value = "";
    $("#q-c").value = "";
    $("#q-d").value = "";
    $("#q-ans").value = "";
    $("#q-exp").value = "";
  });

  function parseCsv(text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length <= 1) return [];
    const sep = lines[0].includes(";") ? ";" : ",";
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(sep).map((p) => p.trim());
      if (parts.length >= 7) rows.push(parts);
    }
    return rows;
  }

  btnImportCsv.addEventListener("click", () => {
    const file = csvFile.files[0];
    const cat = ($("#admin-cat").value || "").trim();
    const lvl = ($("#admin-level").value || "").trim();
    if (!file) {
      alert("Pilih file CSV terlebih dahulu.");
      return;
    }
    if (!cat || !lvl) {
      alert("Isi mata pelajaran & level tujuan.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const txt = e.target.result;
      const rows = parseCsv(txt);
      if (!rows.length) {
        alert("CSV tidak berisi baris soal sesuai format.");
        return;
      }

      const baseId = toIdFragment(cat) + "-" + toIdFragment(lvl);
      const qs = rows.map((parts, i) => {
        const [qText, a, b, c, d, ansRaw, exp] = parts;
        const ans = (ansRaw || "a").trim().toLowerCase();
        return {
          id: `${baseId}-${Date.now()}-${i + 1}`,
          text: (qText || "").trim(),
          options: [
            { id: "a", text: (a || "").trim() },
            { id: "b", text: (b || "").trim() },
            { id: "c", text: (c || "").trim() },
            { id: "d", text: (d || "").trim() },
          ],
          answerId: ["a", "b", "c", "d"].includes(ans) ? ans : "a",
          explanation: (exp || "").trim(),
        };
      });

      if (!QUESTION_BANK[cat]) QUESTION_BANK[cat] = {};
      // ganti seluruh level ini dengan hasil impor
      QUESTION_BANK[cat][lvl] = qs;

      alert(
        `Berhasil impor ${qs.length} soal ke ${cat} - ${lvl} di memori.\n` +
          "Jangan lupa klik 'Unduh questions.json' lalu upload ke GitHub/Vercel."
      );
    };
    reader.readAsText(file);
  });

  btnExportJson.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(QUESTION_BANK, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questions.json";
    a.click();
    URL.revokeObjectURL(url);
  });
});
