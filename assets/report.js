/* Отчёт: .docx (собирается в браузере через JSZip) и CSV. */
(function () {
  "use strict";
  const { L, O, CAT_RU, USE_RU } = window.Lic;
  const LEVEL_RU = { 0: "без обязанностей", 1: "есть обязанности", 2: "нужна проверка", 3: "конфликт", u: "лицензия не установлена" };
  const MODEL_RU = { dist: "копии передаются клиентам (установка, приложение, поставка на сервер заказчика)", saas: "работает как онлайн-сервис, копии не передаются", internal: "используется только внутри компании" };

  const x = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const run = (t, b) => `<w:r>${b ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
  const p = (t, style, b) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}${run(t, b)}</w:p>`;
  const pRuns = (parts, style) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}${parts.map(([t, b]) => run(t, b)).join("")}</w:p>`;
  const li = (t) => p(t, "ListBullet");
  function table(head, rows, widths) {
    const total = widths.reduce((a, b) => a + b, 0);
    const cell = (t, w, h) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${h ? '<w:shd w:val="clear" w:color="auto" w:fill="E7ECF4"/>' : ""}</w:tcPr><w:p><w:pPr><w:pStyle w:val="TableText"/></w:pPr>${run(t, h)}</w:p></w:tc>`;
    const row = (r, h) => `<w:tr>${h ? "<w:trPr><w:tblHeader/></w:trPr>" : ""}${r.map((t, i) => cell(t, widths[i], h)).join("")}</w:tr>`;
    return `<w:tbl><w:tblPr><w:tblStyle w:val="Grid"/><w:tblW w:w="${total}" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${row(head, true)}${rows.map((r) => row(r)).join("")}</w:tbl>${p("")}`;
  }

  function body(d) {
    const { product, comps, res, issues, date } = d;
    const counts = { 3: 0, 2: 0, 1: 0, 0: 0, u: 0 };
    res.forEach((r) => counts[r.level]++);
    const b = [];
    b.push(p("Анализ лицензий сторонних компонентов", "Title"));
    b.push(p(`${product.name || "Продукт без названия"} · ${date}`, "Subtitle"));
    b.push(p("1. Исходные данные", "Heading1"));
    b.push(pRuns([["Модель распространения: ", true], [MODEL_RU[product.model]]]));
    b.push(pRuns([["Лицензия продукта: ", true], [product.lic === "proprietary" ? "закрытая (собственная)" : product.lic]]));
    b.push(pRuns([["Коммерческое использование: ", true], [product.commercial ? "да" : "нет"]]));
    b.push(pRuns([["Компонентов: ", true], [String(comps.length)]]));
    b.push(p("2. Итог", "Heading1"));
    b.push(table(["Оценка", "Компонентов"], [["Конфликт", counts[3]], ["Нужна проверка", counts[2]], ["Лицензия не установлена", counts.u], ["Есть обязанности", counts[1]], ["Без обязанностей", counts[0]]].map((r) => r.map(String)), [6000, 3000]));

    const bad = comps.map((c, i) => ({ c, r: res[i] })).filter((y) => y.r.level === 3 || y.r.level === 2);
    b.push(p("3. Конфликты и риски", "Heading1"));
    if (!issues.length && !bad.length) b.push(p("Конфликтов и компонентов, требующих проверки, не найдено."));
    issues.forEach((i) => { b.push(p(`${i.level === 3 ? "Конфликт" : "Проверить"}: ${i.title}`, "Heading2")); b.push(p(i.text)); b.push(pRuns([["Что сделать: ", true], [i.todo]])); });
    bad.sort((a, b2) => b2.r.level - a.r.level).forEach(({ c, r }) => {
      b.push(p(`${c.name}${c.version ? " " + c.version : ""}: ${r.title}`, "Heading2"));
      b.push(pRuns([["Лицензия: ", true], [`${r.lic.label || c.license} (${CAT_RU[r.lic.cat]}); использование: ${USE_RU[c.use]}${c.modified ? ", изменялся" : ""}.`]]));
      r.why.forEach((w) => b.push(p(w)));
      r.todo.forEach((t) => b.push(pRuns([["Что сделать: ", true], [t]])));
    });

    const unknown = comps.filter((c, i) => res[i].level === "u");
    if (unknown.length) {
      b.push(p("4. Компоненты с неустановленной лицензией", "Heading1"));
      b.push(p("Лицензию нужно выяснить вручную: в репозитории компонента, на его странице в реестре пакетов или у правообладателя."));
      unknown.slice(0, 300).forEach((c) => b.push(li(`${c.name}${c.version ? " " + c.version : ""}`)));
      if (unknown.length > 300) b.push(p(`И ещё ${unknown.length - 300}. Полный список — в таблице раздела 6.`));
    }

    b.push(p("5. Обязанности по лицензиям", "Heading1"));
    const byDuty = new Map();
    comps.forEach((c, i) => res[i].duties.forEach((dd) => { if (!byDuty.has(dd)) byDuty.set(dd, []); byDuty.get(dd).push(c.name); }));
    if (!byDuty.size) b.push(p("При указанной модели распространения обязанностей не выявлено."));
    for (const [code, names] of byDuty) {
      b.push(p(O[code], "Heading2"));
      b.push(p(`Компоненты (${names.length}): ${names.slice(0, 60).join(", ")}${names.length > 60 ? ` и ещё ${names.length - 60}` : ""}.`));
    }

    b.push(p("6. Перечень компонентов", "Heading1"));
    b.push(table(["№", "Компонент", "Версия", "Лицензия", "Использование", "Оценка"],
      comps.map((c, i) => [String(i + 1), c.name, c.version || "—", res[i].lic.label || c.license || "не установлена", USE_RU[c.use] + (c.modified ? ", изменялся" : ""), LEVEL_RU[res[i].level]]),
      [500, 2600, 1100, 1700, 2000, 1500]));

    b.push(p("7. Для договора", "Heading1"));
    b.push(p("Если продукт передаётся по лицензионному договору, перечень компонентов и их лицензий можно сделать приложением к договору, а в договор включить условие:"));
    b.push(p("«Программа включает компоненты, которые распространяются их правообладателями на условиях открытых лицензий (ст. 1286.1 Гражданского кодекса Российской Федерации). Перечень таких компонентов и их лицензий приведён в Приложении № __. Использование этих компонентов регулируется условиями соответствующих лицензий, которые имеют приоритет над условиями настоящего Договора в части таких компонентов.»", "Quote"));
    b.push(p("Если в договоре есть заверения об обстоятельствах (ст. 431.2 ГК РФ) об отсутствии прав третьих лиц на программу, их нужно согласовать с перечнем: на компоненты с открытыми лицензиями права третьих лиц есть, программа использует их на условиях этих лицензий."));

    b.push(p("8. Ограничения анализа", "Heading1"));
    ["Лицензии определены по данным пакетов (package.json, lock-файлы, метаданные, SBOM), текстам файлов лицензий и пометкам SPDX в исходниках. Если автор указал лицензию неверно, вывод тоже будет неверным.",
      "Анализ не находит фрагменты чужого кода, скопированные в проект без пометок, и не проверяет уязвимости.",
      "Вложенные зависимости видны, только если в проекте есть lock-файл или установленные пакеты.",
      "Оценка совместимости основана на правилах для типовых случаев и позиции Free Software Foundation. Спорные случаи должен оценить юрист с учётом того, как именно компоненты связаны с продуктом.",
      "Отчёт подготовлен автоматически и не является юридическим заключением."].forEach((t) => b.push(li(t)));
    return b.join("");
  }

  const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="ru-RU"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:jc w:val="both"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="left"/><w:spacing w:after="60"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:color w:val="595959"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:jc w:val="left"/><w:spacing w:before="280" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="1F4E99"/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:jc w:val="left"/><w:spacing w:before="160" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/><w:pPr><w:numPr><w:numId w:val="1"/></w:numPr><w:spacing w:after="60"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="567"/></w:pPr><w:rPr><w:i/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="left"/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="17"/></w:rPr></w:style>
<w:style w:type="table" w:styleId="Grid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="BFBFBF"/><w:left w:val="single" w:sz="4" w:color="BFBFBF"/><w:bottom w:val="single" w:sz="4" w:color="BFBFBF"/><w:right w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideH w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideV w:val="single" w:sz="4" w:color="BFBFBF"/></w:tblBorders><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
</w:styles>`;
  const NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="–"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;

  async function docx(d) {
    const zip = new JSZip();
    const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`);
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`);
    zip.file("word/styles.xml", STYLES);
    zip.file("word/numbering.xml", NUMBERING);
    zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body(d)}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="851" w:bottom="1134" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`);
    return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }

  function csv(d) {
    const q = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const rows = [["Компонент", "Версия", "Лицензия", "Категория", "Использование", "Изменялся", "Оценка", "Вывод", "Источник"]];
    d.comps.forEach((c, i) => { const r = d.res[i]; rows.push([c.name, c.version, r.lic.label || c.license, CAT_RU[r.lic.cat], USE_RU[c.use], c.modified ? "да" : "нет", LEVEL_RU[r.level], r.title, c.src]); });
    return new Blob(["﻿" + rows.map((r) => r.map(q).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  }

  // Файл уведомлений: компоненты, их копирайты и тексты лицензий (по одному тексту на лицензию).
  // texts: {id: текст} — загружаются из assets/license-texts.
  const NO_TEXT = new Set(["GPL", "PublicDomain", "Proprietary", "NONE", "Commons-Clause", "Google-Patent-Grant"]);
  function noticeIds(d) {
    const ids = new Set();
    noticeComps(d).forEach(({ r }) => r.lic.terms.forEach((t) => { if (t.id && !NO_TEXT.has(t.id)) ids.add(t.id); if (t.exc === "classpath-exception-2.0") ids.add("Classpath-exception-2.0"); if (t.exc === "llvm-exception") ids.add("LLVM-exception"); }));
    return [...ids].sort();
  }
  function noticeComps(d) {
    return d.comps.map((c, i) => ({ c, r: d.res[i] })).filter(({ c, r }) => c.use !== "dev" && !["unknown", "none", "proprietary"].includes(r.lic.cat))
      .sort((a, b) => a.c.name.localeCompare(b.c.name));
  }
  function notices(d, texts) {
    const line = "=".repeat(78), thin = "-".repeat(78);
    const list = noticeComps(d);
    const out = [];
    out.push(`СТОРОННИЕ КОМПОНЕНТЫ${d.product.name ? ` В СОСТАВЕ «${d.product.name}»` : ""}`, "THIRD-PARTY SOFTWARE NOTICES", "",
      "Продукт включает перечисленные ниже компоненты. Они распространяются их правообладателями на условиях",
      "указанных лицензий. Тексты лицензий приведены в конце файла.", `Сформировано: ${d.date}`, "", line);
    let miss = 0;
    for (const { c, r } of list) {
      out.push("", `${c.name}${c.version ? " " + c.version : ""}`, `Лицензия / License: ${r.lic.label}`);
      if (c.copyright && c.copyright.length) c.copyright.forEach((x) => out.push(x));
      else { out.push("Copyright: [уведомление не найдено — возьмите его из файла LICENSE компонента]"); miss++; }
    }
    out.push("", line, "", "ТЕКСТЫ ЛИЦЕНЗИЙ / LICENSE TEXTS");
    for (const id of noticeIds(d)) {
      out.push("", thin, `${id}${L[id] ? " — " + L[id].name : ""}`, thin, "", texts[id] ? texts[id].trim() : "[текст лицензии не найден, приложите его вручную]");
    }
    const skipped = d.comps.filter((c, i) => c.use !== "dev" && ["unknown", "none", "proprietary"].includes(d.res[i].lic.cat));
    return { text: out.join("\n") + "\n", count: list.length, miss, skipped: skipped.length };
  }

  window.Report = { docx, csv, notices, noticeIds, LEVEL_RU, MODEL_RU };
})();
