/* Интерфейс: анкета продукта, загрузка компонентов, таблица и выгрузка отчёта. */
(function () {
  "use strict";
  const { L, O, CAT_RU, USE_RU, resolve, assessComp, assessProduct, ids } = window.Lic;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const STORE = "oss-license-check-v1";
  const PAGE = 400;

  let product = { name: "", model: "dist", lic: "proprietary", commercial: true };
  let comps = [];
  let filter = null, query = "", open = new Set(), shown = PAGE;
  let res = [], issues = [];

  // ---------- справочники ----------
  const PRODUCT_LICS = ["MIT", "Apache-2.0", "BSD-3-Clause", "MPL-2.0", "LGPL-3.0-or-later", "GPL-2.0-only", "GPL-2.0-or-later", "GPL-3.0-only", "GPL-3.0-or-later", "AGPL-3.0-or-later", "EUPL-1.2"];
  $("#p-lic").innerHTML = `<option value="proprietary">Закрытая (собственная лицензия)</option>` + PRODUCT_LICS.map((i) => `<option value="${i}">${i} — ${esc(L[i].name)}</option>`).join("");
  $("#lic-list").innerHTML = ids.map((i) => `<option value="${i}">${esc(L[i].name)}</option>`).join("");

  // ---------- состояние ----------
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ product, comps })); } catch (e) { /* хранилище недоступно или переполнено */ }
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "null");
      if (s && s.product) product = { ...product, ...s.product };
      if (s && Array.isArray(s.comps)) comps = s.comps;
    } catch (e) { }
  }
  function syncForm() {
    $("#p-name").value = product.name;
    $(`input[name="model"][value="${product.model}"]`).checked = true;
    $("#p-lic").value = PRODUCT_LICS.includes(product.lic) ? product.lic : "proprietary";
    $("#p-comm").checked = product.commercial;
    licHint();
  }
  function licHint() {
    $("#p-lic-hint").textContent = product.lic === "proprietary" && product.model === "dist" ? "Закрытый продукт нельзя объединять с копилефт-кодом, если копии передаются клиентам." : "";
  }

  // ---------- оценка и отрисовка ----------
  const LV = { 3: ["b3", "конфликт"], 2: ["b2", "проверить"], u: ["bu", "не установлена"], 1: ["b1", "обязанности"], 0: ["b0", "без обязанностей"] };
  const ORDER = { 3: 0, 2: 1, u: 2, 1: 3, 0: 4 };

  function evaluate() {
    res = comps.map((c) => assessComp(c, product));
    issues = assessProduct(comps, res, product);
    // Компоненты из конфликтов на уровне продукта получают оценку не ниже конфликта.
    const rank = (l) => (l === "u" ? 1.5 : l);
    for (const is of issues) for (const i of new Set(is.at || [])) {
      const r = res[i];
      if (rank(is.level) > rank(r.level)) { r.level = is.level; r.title = is.title; }
      r.why.push(is.text); if (!r.todo.includes(is.todo)) r.todo.push(is.todo);
    }
  }

  function render() {
    evaluate();
    const has = comps.length > 0;
    $("#res").hidden = !has; $("#res-empty").hidden = has;
    if (!has) return;
    const cnt = { 3: 0, 2: 0, u: 0, 1: 0, 0: 0 };
    res.forEach((r) => cnt[r.level]++);
    $("#tiles").innerHTML = [3, 2, "u", 1, 0].map((k) => `<button type="button" class="tile l${k}" data-f="${k}" aria-pressed="${String(filter) === String(k)}"><b>${cnt[k]}</b><span>${{ 3: "конфликт", 2: "нужна проверка", u: "лицензия не установлена", 1: "есть обязанности", 0: "без обязанностей" }[k]}</span></button>`).join("");
    $("#issues").innerHTML = issues.map((i) => `<div class="issue l${i.level}"><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p><p class="todo">Что сделать: ${esc(i.todo)}</p></div>`).join("");
    renderTable();
  }

  function rowsToShow() {
    const q = query.toLowerCase();
    return comps.map((c, i) => i)
      .filter((i) => filter === null || String(res[i].level) === String(filter))
      .filter((i) => !q || comps[i].name.toLowerCase().includes(q) || String(comps[i].license).toLowerCase().includes(q) || (res[i].lic.label || "").toLowerCase().includes(q))
      .sort((a, b) => ORDER[res[a].level] - ORDER[res[b].level] || comps[a].name.localeCompare(comps[b].name));
  }

  function renderTable() {
    const all = rowsToShow();
    const list = all.slice(0, shown);
    $("#tbody").innerHTML = list.map((i) => {
      const c = comps[i], r = res[i], [cls, word] = LV[r.level];
      const label = r.lic.label && r.lic.label !== c.license ? `<span class="sub">→ ${esc(r.lic.label)} · ${esc(CAT_RU[r.lic.cat])}</span>` : `<span class="sub">${esc(CAT_RU[r.lic.cat])}</span>`;
      let h = `<tr class="row" data-i="${i}"><td><span class="badge ${cls}">${word}</span></td>`;
      h += `<td><span class="nm">${esc(c.name)}</span><span class="sub">${esc([c.version, c.src].filter(Boolean).join(" · "))}</span></td>`;
      h += `<td><input type="text" class="lic-in" list="lic-list" value="${esc(c.license)}" data-k="license" data-i="${i}" aria-label="Лицензия ${esc(c.name)}" placeholder="не установлена">${label}</td>`;
      h += `<td class="col-use"><select data-k="use" data-i="${i}" aria-label="Как используется ${esc(c.name)}">${Object.entries(USE_RU).map(([k, v]) => `<option value="${k}"${k === c.use ? " selected" : ""}>${esc(v)}</option>`).join("")}</select></td>`;
      h += `<td class="col-mod"><input type="checkbox" data-k="modified" data-i="${i}"${c.modified ? " checked" : ""} aria-label="${esc(c.name)} изменялся"></td>`;
      h += `<td><button type="button" class="del" data-del="${i}" aria-label="Удалить ${esc(c.name)}">×</button></td></tr>`;
      if (open.has(i)) {
        h += `<tr class="detail"><td colspan="6"><p><b>${esc(r.title)}.</b></p>${r.why.map((w) => `<p>${esc(w)}</p>`).join("")}`;
        if (r.duties.length) h += `<p><b>Обязанности:</b></p><ul>${r.duties.map((d) => `<li>${esc(O[d])}</li>`).join("")}</ul>`;
        if (r.todo.length) h += `<p><b>Что сделать:</b></p><ul>${r.todo.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
        if (c.files) h += `<p class="sub">Файлы: ${esc(c.files.join(", "))}${c.count > c.files.length ? ` и ещё ${c.count - c.files.length}` : ""}</p>`;
        h += `</td></tr>`;
      }
      return h;
    }).join("") || `<tr><td colspan="6" class="empty">Ничего не найдено</td></tr>`;
    const rest = all.length - list.length;
    $("#btn-more").hidden = rest <= 0;
    $("#btn-more").textContent = `Показать ещё ${Math.min(rest, PAGE)} из ${rest}`;
  }

  // ---------- события анкеты ----------
  $("#p-name").addEventListener("input", (e) => { product.name = e.target.value; save(); });
  $$('input[name="model"]').forEach((r) => r.addEventListener("change", () => { product.model = r.value; licHint(); save(); render(); }));
  $("#p-lic").addEventListener("change", (e) => { product.lic = e.target.value; licHint(); save(); render(); });
  $("#p-comm").addEventListener("change", (e) => { product.commercial = e.target.checked; save(); render(); });

  // ---------- таблица ----------
  $("#tiles").addEventListener("click", (e) => {
    const t = e.target.closest(".tile"); if (!t) return;
    filter = String(filter) === t.dataset.f ? null : t.dataset.f === "u" ? "u" : Number(t.dataset.f);
    shown = PAGE; render();
  });
  $("#q").addEventListener("input", (e) => { query = e.target.value; shown = PAGE; renderTable(); });
  $("#btn-more").addEventListener("click", () => { shown += PAGE; renderTable(); });
  $("#tbody").addEventListener("click", (e) => {
    if (e.target.closest("input, select, a")) return;
    const d = e.target.closest("[data-del]");
    if (d) { comps.splice(Number(d.dataset.del), 1); open.clear(); save(); render(); return; }
    const row = e.target.closest("tr.row"); if (!row) return;
    const i = Number(row.dataset.i);
    open.has(i) ? open.delete(i) : open.add(i);
    renderTable();
  });
  $("#tbody").addEventListener("change", (e) => {
    const el = e.target, i = Number(el.dataset.i), k = el.dataset.k;
    if (!k) return;
    comps[i][k] = el.type === "checkbox" ? el.checked : el.value.trim();
    save(); render();
  });
  $("#btn-clear").addEventListener("click", () => { comps = []; open.clear(); filter = null; save(); render(); log(""); });
  $("#btn-add").addEventListener("click", () => { $("#add-form").hidden = !$("#add-form").hidden; if (!$("#add-form").hidden) $("#a-name").focus(); });
  $("#add-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#a-name").value.trim();
    if (!name) { $("#a-name").focus(); return; }
    comps.push({ name, version: $("#a-ver").value.trim(), license: $("#a-lic").value.trim(), use: $("#a-use").value, modified: false, src: "вручную" });
    $("#a-name").value = ""; $("#a-ver").value = ""; $("#a-lic").value = "";
    filter = null; save(); render(); $("#a-name").focus();
  });

  // ---------- загрузка ----------
  function log(text, append) {
    const el = $("#log");
    el.hidden = !text && !append;
    el.textContent = append ? el.textContent + "\n" + text : text;
    el.scrollTop = el.scrollHeight;
  }
  function addComps(list, srcLabel) {
    const before = comps.length;
    comps = window.Scan.dedupe(comps.concat(list));
    open.clear(); filter = null; shown = PAGE;
    save(); render();
    return comps.length - before;
  }
  function setOwn(own) {
    const id = own && window.Lic.normOne(String(own).split(/ OR | AND /i)[0]);
    if (id && PRODUCT_LICS.includes(id)) { product.lic = id; syncForm(); save(); render(); log(`Лицензия продукта по файлам проекта: ${id}. Проверьте поле «Лицензия продукта».`, true); }
  }

  $("#in-folder").addEventListener("change", async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    log(`Папка: ${files.length} файлов. Читаю…`);
    try {
      const r = await window.Scan.scanFolder(files, (label, n) => log(`Прочитано ${n} файлов (${label})…`, false));
      log(`Папка: ${r.stats.files} файлов, пакетов npm: ${r.stats.npm}, пакетов Python: ${r.stats.py}, исходников проверено: ${r.stats.src}.`);
      r.notes.forEach((n) => log(n, true));
      const added = addComps(r.comps);
      log(`Компонентов в списке: ${comps.length} (добавлено ${added}).`, true);
      if (!r.comps.length) log("Компоненты не найдены. Если зависимости не установлены, загрузите lock-файл или SBOM.", true);
      setOwn(r.own);
    } catch (err) { log("Не удалось прочитать папку: " + err.message, true); }
    e.target.value = "";
  });

  async function readFiles(files) {
    log("");
    for (const f of files) {
      try {
        const r = window.Scan.parseFile(f.name, await f.text());
        if (!r) { log(`${f.name}: формат не распознан`, true); continue; }
        if (r.kind === "текст лицензии") { log(r.own ? `${f.name}: текст лицензии ${r.own}` : `${f.name}: лицензия по тексту не распознана`, true); setOwn(r.own); continue; }
        const added = addComps(r.comps);
        log(`${f.name}: ${r.kind}, найдено ${r.comps.length}, новых ${added}`, true);
        if (r.own) setOwn(r.own);
      } catch (err) { log(err.message, true); }
    }
  }
  $("#in-files").addEventListener("change", (e) => { readFiles([...e.target.files]); e.target.value = ""; });
  const drop = $("#drop");
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => readFiles([...e.dataTransfer.files]));

  // Пример: реальные проекты с их опубликованными лицензиями.
  $("#btn-demo").addEventListener("click", () => {
    const d = (name, license, use, src) => ({ name, version: "", license, use, modified: false, src: src || "пример" });
    product = { name: "Пример: настольная программа для клиентов", model: "dist", lic: "proprietary", commercial: true };
    comps = [
      d("react", "MIT", "lib"), d("lodash", "MIT", "lib"), d("typescript", "Apache-2.0", "dev"),
      d("axe-core", "MPL-2.0", "lib"), d("FFmpeg", "LGPL-2.1-or-later", "lib"), d("GNU Readline", "GPL-3.0-or-later", "lib"),
      d("Ghostscript", "AGPL-3.0-or-later", "separate"), d("Terraform", "BUSL-1.1", "dev"), d("legacy-utils (код подрядчика)", "", "static"),
    ];
    open.clear(); filter = null; syncForm(); save(); render();
    log("Загружен пример. Лицензии взяты из опубликованных данных проектов; поменяйте модель распространения, чтобы увидеть, как меняются выводы.");
  });

  // ---------- выгрузка ----------
  function saveBlob(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const today = () => new Date().toLocaleDateString("ru-RU");
  const fileBase = () => "Лицензии" + (product.name ? " — " + product.name.replace(/[\\/:*?"<>|]/g, "").slice(0, 60) : "");
  // В отчёте компоненты идут по тяжести оценки.
  function ordered() {
    const idx = comps.map((c, i) => i).sort((a, b) => ORDER[res[a].level] - ORDER[res[b].level] || comps[a].name.localeCompare(comps[b].name));
    return { product, comps: idx.map((i) => comps[i]), res: idx.map((i) => res[i]), issues, date: today() };
  }
  $("#btn-docx").addEventListener("click", async () => {
    const b = $("#btn-docx"); b.disabled = true;
    try { saveBlob(await window.Report.docx(ordered()), fileBase() + ".docx"); } finally { b.disabled = false; }
  });
  $("#btn-csv").addEventListener("click", () => saveBlob(window.Report.csv(ordered()), fileBase() + ".csv"));

  load(); syncForm(); render();
})();
