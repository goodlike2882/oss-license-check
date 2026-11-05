/* Сканер: читает файлы проекта в браузере и составляет список компонентов.
   Файлы никуда не отправляются: File API отдаёт их содержимое только этой странице. */
(function () {
  "use strict";
  const { normOne } = window.Lic;

  // ---------- распознавание текста лицензии ----------
  // Характерные фразы из текстов лицензий. Порядок важен: сначала более узкие.
  const FP = [
    ["AGPL-3.0", [/gnu affero general public license/, /version 3/]],
    ["LGPL-3.0", [/gnu lesser general public license/, /version 3/]],
    ["LGPL-2.1", [/gnu lesser general public license/, /version 2\.1/]],
    ["LGPL-2.0", [/gnu library general public license/, /version 2/]],
    ["GPL-3.0", [/gnu general public license/, /version 3, 29 june 2007/]],
    ["GPL-2.0", [/gnu general public license/, /version 2, june 1991/]],
    ["MPL-2.0", [/mozilla public license,? version 2\.0/]],
    ["MPL-1.1", [/mozilla public license version 1\.1/]],
    ["EPL-2.0", [/eclipse public license - v 2\.0/]],
    ["EPL-1.0", [/eclipse public license - v 1\.0/]],
    ["CDDL-1.0", [/common development and distribution license/]],
    ["EUPL-1.2", [/european union public licen[cs]e/, /v\. ?1\.2/]],
    ["SSPL-1.0", [/server side public license/]],
    ["BUSL-1.1", [/business source license/]],
    ["Elastic-2.0", [/elastic license 2\.0/]],
    ["Apache-2.0", [/apache license/, /version 2\.0/]],
    ["BSD-4-Clause", [/redistribution and use in source and binary forms/, /all advertising materials mentioning/]],
    ["BSD-3-Clause", [/redistribution and use in source and binary forms/, /neither the name/]],
    ["BSD-2-Clause", [/redistribution and use in source and binary forms/]],
    ["ISC", [/permission to use, copy, modify, and\/?o?r? distribute this software for any purpose with or without fee is hereby granted/]],
    ["MIT", [/permission is hereby granted, free of charge, to any person obtaining a copy/, /the above copyright notice and this permission notice shall be included/]],
    ["MIT-0", [/permission is hereby granted, free of charge, to any person obtaining a copy/]],
    ["Zlib", [/this software is provided 'as-is'/, /altered source versions must be plainly marked/]],
    ["BSL-1.0", [/boost software license - version 1\.0/]],
    ["Unlicense", [/this is free and unencumbered software released into the public domain/]],
    ["CC0-1.0", [/cc0 1\.0 universal/]],
    ["OFL-1.1", [/sil open font license/]],
    ["Python-2.0", [/python software foundation license/]],
    ["WTFPL", [/do what the fuck you want to public license/]],
    ["CC-BY-SA-4.0", [/attribution-sharealike 4\.0 international/]],
    ["CC-BY-4.0", [/attribution 4\.0 international/]],
  ];
  function detectText(text) {
    const t = String(text || "").toLowerCase().replace(/\s+/g, " ").slice(0, 60000);
    for (const [id, res] of FP) {
      if (res.every((re) => re.test(t))) {
        if (/^(A?L?GPL)-[0-9.]+$/.test(id)) {
          const later = /or \(at your option\) any later version/.test(t);
          // Сам текст GPL всегда содержит фразу о «более поздней версии» в разделе «How to Apply»,
          // поэтому без заголовков в исходниках вариант «or-later» не определить.
          return { id: id + "-only", note: later ? "По тексту лицензии нельзя понять, разрешена ли более поздняя версия: смотрите заголовки исходных файлов." : "" };
        }
        return { id, note: "" };
      }
    }
    return null;
  }

  // ---------- форматы файлов ----------
  const comp = (name, version, license, use, src) => ({ name, version: version || "", license: license || "", use: use || "lib", src, modified: false });
  const lic = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v.map(lic).filter(Boolean).join(" OR ");
    if (typeof v === "object") return v.type || v.name || v.id || "";
    return "";
  };

  function parsePackageLock(j, src) {
    const out = [];
    if (j.packages) {
      for (const [k, v] of Object.entries(j.packages)) {
        if (!k || !k.includes("node_modules/") || v.link) continue;
        const name = v.name || k.slice(k.lastIndexOf("node_modules/") + 13);
        out.push(comp(name, v.version, lic(v.license), v.dev || v.devOptional ? "dev" : "lib", src));
      }
    } else if (j.dependencies) {
      const walk = (deps) => Object.entries(deps || {}).forEach(([n, v]) => { out.push(comp(n, v.version, "", v.dev ? "dev" : "lib", src)); walk(v.dependencies); });
      walk(j.dependencies);
    }
    return out;
  }
  function parsePackageJson(j, src) {
    const out = [];
    for (const [n, v] of Object.entries(j.dependencies || {})) out.push(comp(n, v, "", "lib", src));
    for (const [n, v] of Object.entries(j.optionalDependencies || {})) out.push(comp(n, v, "", "lib", src));
    for (const [n, v] of Object.entries(j.devDependencies || {})) out.push(comp(n, v, "", "dev", src));
    return out;
  }
  function parseComposerLock(j, src) {
    const a = (j.packages || []).map((p) => comp(p.name, p.version, lic(p.license), "lib", src));
    const b = (j["packages-dev"] || []).map((p) => comp(p.name, p.version, lic(p.license), "dev", src));
    return a.concat(b);
  }
  function parseRequirements(text, src) {
    return text.split(/\r?\n/).map((l) => l.replace(/#.*/, "").trim()).filter((l) => l && !l.startsWith("-") && !/^(git|https?):/.test(l))
      .map((l) => { const m = l.match(/^([A-Za-z0-9_.\-\[\]]+)\s*(?:[=<>~!]=?\s*([^;,\s]+))?/); return m ? comp(m[1].replace(/\[.*\]/, ""), m[2], "", "lib", src) : null; }).filter(Boolean);
  }
  function parsePom(text, src) {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    const g = (el, tag) => (el.getElementsByTagName(tag)[0] || {}).textContent || "";
    return [...doc.getElementsByTagName("dependency")].map((d) => {
      const scope = g(d, "scope").trim();
      return comp(`${g(d, "groupId").trim()}:${g(d, "artifactId").trim()}`, g(d, "version").trim(), "", scope === "test" || scope === "provided" ? "dev" : "lib", src);
    });
  }
  function parseGoMod(text, src) {
    const out = [];
    const req = text.match(/require\s*\(([\s\S]*?)\)/g) || [];
    const lines = req.flatMap((b) => b.replace(/require\s*\(|\)/g, "").split(/\r?\n/)).concat((text.match(/^require\s+[^\s(]+\s+\S+.*$/gm) || []).map((l) => l.replace(/^require\s+/, "")));
    for (const l of lines) { const m = l.trim().match(/^(\S+)\s+(\S+)/); if (m && !m[1].startsWith("//")) out.push(comp(m[1], m[2], "", "lib", src)); }
    return out;
  }
  function parseCargoLock(text, src) {
    const out = [];
    for (const b of text.split(/\[\[package\]\]/).slice(1)) {
      const n = b.match(/name\s*=\s*"([^"]+)"/), v = b.match(/version\s*=\s*"([^"]+)"/);
      if (n && /source\s*=/.test(b)) out.push(comp(n[1], v && v[1], "", "lib", src));
    }
    return out;
  }
  function parseCycloneDX(j, src) {
    const out = [];
    const walk = (list) => (list || []).forEach((c) => {
      let l = "";
      for (const x of c.licenses || []) { if (x.expression) l = x.expression; else if (x.license) l = l ? l + " AND " + (x.license.id || x.license.name) : x.license.id || x.license.name || ""; }
      out.push(comp(c.group ? `${c.group}/${c.name}` : c.name, c.version, l, c.scope === "excluded" ? "dev" : "lib", src));
      walk(c.components);
    });
    walk(j.components);
    return out;
  }
  function parseSPDX(j, src) {
    const root = new Set((j.documentDescribes || []).concat((j.relationships || []).filter((r) => r.relationshipType === "DESCRIBES").map((r) => r.relatedSpdxElement)));
    return (j.packages || []).filter((p) => !root.has(p.SPDXID)).map((p) => {
      const pick = (v) => (v && !/^NOASSERTION$|^NONE$/.test(v) ? v : "");
      return comp(p.name, p.versionInfo, pick(p.licenseConcluded) || pick(p.licenseDeclared), "lib", src);
    });
  }
  function parsePyMeta(text, src) {
    const head = text.split(/\r?\n\r?\n/)[0];
    const get = (k) => ((head.match(new RegExp(`^${k}:\\s*(.+)$`, "mi")) || [])[1] || "").trim();
    let l = get("License-Expression");
    if (!l) { const cls = [...head.matchAll(/^Classifier:\s*(License ::.+)$/gmi)].map((m) => m[1]).map(normOne).filter(Boolean); if (cls.length) l = [...new Set(cls)].join(" OR "); }
    if (!l) { const raw = get("License"); if (raw && raw.length < 80 && normOne(raw)) l = raw; }
    return comp(get("Name"), get("Version"), l, "lib", src);
  }

  // Определить формат по имени и содержимому.
  function parseFile(name, text) {
    const base = name.split("/").pop().toLowerCase();
    let j = null;
    if (/\.json$/.test(base)) { try { j = JSON.parse(text); } catch (e) { throw new Error(`${name}: не удалось прочитать JSON`); } }
    if (j && j.bomFormat === "CycloneDX") return { kind: "SBOM CycloneDX", comps: parseCycloneDX(j, base) };
    if (j && j.spdxVersion) return { kind: "SBOM SPDX", comps: parseSPDX(j, base) };
    if (base === "package-lock.json" || base === "npm-shrinkwrap.json") return { kind: "npm lock", comps: parsePackageLock(j, base) };
    if (base === "composer.lock") { try { j = JSON.parse(text); } catch (e) { throw new Error(`${name}: не удалось прочитать файл`); } return { kind: "Composer lock", comps: parseComposerLock(j, base) }; }
    if (base === "package.json") return { kind: "package.json", comps: parsePackageJson(j, base), own: j && lic(j.license) };
    if (/^requirements.*\.txt$/.test(base)) return { kind: "requirements", comps: parseRequirements(text, base) };
    if (base === "pom.xml") return { kind: "Maven", comps: parsePom(text, base) };
    if (base === "go.mod") return { kind: "Go modules", comps: parseGoMod(text, base) };
    if (base === "cargo.lock") return { kind: "Cargo lock", comps: parseCargoLock(text, base) };
    if (/^(metadata|pkg-info)$/.test(base)) return { kind: "Python", comps: [parsePyMeta(text, base)] };
    if (/^(licen[cs]e|copying)/.test(base)) { const d = detectText(text); return { kind: "текст лицензии", comps: [], own: d && d.id }; }
    return null;
  }

  // ---------- сканирование папки ----------
  const SKIP = /(^|\/)(\.git|\.hg|\.svn|dist|build|out|target|coverage|\.next|\.cache|__pycache__|\.venv|venv|env)(\/|$)/;
  const SRC = /\.(js|mjs|cjs|ts|tsx|jsx|py|java|kt|go|c|h|cc|cpp|hpp|cs|rb|php|rs|swift|scala|vue|svelte|css|scss)$/i;
  const LICFILE = /^(licen[cs]e|copying|unlicense)(\.[a-z]+|-[a-z]+)?$/i;

  async function scanFolder(files, progress) {
    const list = [...files];
    const root = list.length ? list[0].webkitRelativePath.split("/")[0] + "/" : "";
    const rel = (f) => f.webkitRelativePath.slice(root.length);
    const byPath = new Map(list.map((f) => [rel(f), f]));
    // Файлы лицензий по папкам: «node_modules/x/» → [LICENSE, ...]
    const licIn = new Map();
    for (const f of list) { const p = rel(f), i = p.lastIndexOf("/"); if (LICFILE.test(p.slice(i + 1))) { const d = p.slice(0, i + 1); if (!licIn.has(d)) licIn.set(d, []); licIn.get(d).push(f); } }
    const licFor = (dir) => (licIn.get(dir) || [])[0] || ((licIn.get(dir + "licenses/") || [])[0]);
    const read = (f) => f.text();
    const found = [];
    const notes = [];
    let own = "";
    let done = 0;
    const tick = (label) => { done++; if (done % 50 === 0) progress && progress(label, done); };

    // 1. lock-файлы и манифесты в корне и подпапках (кроме зависимостей).
    const manifests = list.filter((f) => { const p = rel(f); return !/node_modules\/|site-packages\/|vendor\//.test(p) && !SKIP.test(p) && /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|composer\.lock|requirements[^/]*\.txt|pom\.xml|go\.mod|cargo\.lock|bom\.json|[^/]*\.cdx\.json|[^/]*\.spdx\.json)$/i.test(p); });
    for (const f of manifests) {
      try { const r = parseFile(rel(f), await read(f)); if (r) { found.push(...r.comps); notes.push(`${rel(f)}: ${r.kind}, ${r.comps.length} компонентов`); } }
      catch (e) { notes.push(e.message); }
    }
    const rootPkg = byPath.get("package.json");
    if (rootPkg) { try { const j = JSON.parse(await read(rootPkg)); if (lic(j.license)) own = lic(j.license); if (!manifests.some((f) => /package-lock|shrinkwrap/.test(rel(f)))) { found.push(...parsePackageJson(j, "package.json")); notes.push("package.json: lock-файла нет, вложенные зависимости не видны"); } } catch (e) { notes.push("package.json: не удалось прочитать"); } }

    // 2. установленные пакеты npm: node_modules/<имя>/package.json
    const devNames = new Set(found.filter((c) => c.use === "dev").map((c) => c.name));
    const npm = list.filter((f) => /(^|\/)node_modules\/(@[^/]+\/)?[^/@][^/]*\/package\.json$/.test(rel(f)));
    for (const f of npm) {
      try {
        const p = rel(f), dir = p.slice(0, -"package.json".length);
        const j = JSON.parse(await read(f));
        if (!j.name || !j.version) continue;
        let l = lic(j.license || j.licenses);
        let how = "package.json";
        if (!l || /^see licen[cs]e in/i.test(l)) {
          const lf = licFor(dir);
          if (lf) { const d = detectText(await read(lf)); if (d) { l = d.id; how = "текст лицензии"; } }
        }
        found.push(comp(j.name, j.version, l, devNames.has(j.name) ? "dev" : "lib", "node_modules · " + how));
      } catch (e) { /* битый package.json пропускаем */ }
      tick("node_modules");
    }

    // 3. установленные пакеты Python
    const py = list.filter((f) => /\.(dist-info\/METADATA|egg-info\/PKG-INFO)$/.test(rel(f)));
    for (const f of py) {
      try {
        const c = parsePyMeta(await read(f), "site-packages");
        if (!c.license) {
          const dir = rel(f).replace(/[^/]+$/, "");
          const lf = licFor(dir);
          if (lf) { const d = detectText(await read(lf)); if (d) { c.license = d.id; c.src = "site-packages · текст лицензии"; } }
        }
        if (c.name) found.push(c);
      } catch (e) { }
      tick("site-packages");
    }

    // 4. vendor/: Go и PHP — по файлам лицензий
    const vend = list.filter((f) => /(^|\/)vendor\/.+/.test(rel(f)) && LICFILE.test(rel(f).split("/").pop()));
    for (const f of vend) {
      const p = rel(f), dir = p.slice(p.indexOf("vendor/") + 7, p.lastIndexOf("/"));
      if (found.some((c) => c.name === dir && c.license)) continue;
      const d = detectText(await read(f));
      const ex = found.find((c) => c.name === dir);
      if (ex) { if (d) { ex.license = d.id; ex.src += " · vendor"; } }
      else found.push(comp(dir, "", d ? d.id : "", "lib", "vendor · текст лицензии"));
      tick("vendor");
    }

    // 5. лицензия самого проекта
    const rootLic = list.find((f) => !rel(f).includes("/") && LICFILE.test(rel(f)));
    if (rootLic) { const d = detectText(await read(rootLic)); if (d) own = own || d.id; }

    // 6. SPDX-заголовки в собственном коде
    const src = list.filter((f) => SRC.test(rel(f)) && !/node_modules\/|site-packages\/|vendor\//.test(rel(f)) && !SKIP.test(rel(f))).slice(0, 5000);
    const spdx = new Map();
    for (const f of src) {
      try {
        const head = await f.slice(0, 4000).text();
        const m = head.match(/SPDX-License-Identifier:\s*([^\n\r*]+?)\s*(?:\*\/|-->|$)/m);
        if (m) { const id = m[1].trim(); if (!spdx.has(id)) spdx.set(id, []); spdx.get(id).push(rel(f)); }
      } catch (e) { }
      tick("исходники");
    }
    const ownNorm = own && normOne(own.split(/ OR | AND /i)[0]);
    for (const [id, paths] of spdx) {
      if (ownNorm && normOne(id) === ownNorm) continue;
      const c = comp(`Файлы проекта с пометкой ${id}`, "", id, "static", "SPDX-заголовки");
      c.files = paths.slice(0, 20); c.count = paths.length;
      found.push(c);
    }
    if (src.length === 5000) notes.push("Проверены заголовки первых 5000 исходных файлов.");

    return { comps: dedupe(found), notes, own, stats: { files: list.length, npm: npm.length, py: py.length, src: src.length } };
  }

  // Один компонент — одна строка: имя + версия. Предпочитаем запись с лицензией.
  function dedupe(arr) {
    const m = new Map();
    for (const c of arr) {
      if (!c.name) continue;
      const v = String(c.version || "").replace(/^[\^~=v]/, "");
      const k = c.name.toLowerCase() + "@" + v;
      const ex = m.get(k);
      if (!ex) { m.set(k, { ...c, version: v }); continue; }
      if (!ex.license && c.license) { ex.license = c.license; ex.src = c.src; }
      if (ex.use === "dev" && c.use !== "dev") ex.use = c.use;
    }
    // Если версия известна, записи без версии (из package.json) поглощаются.
    const named = new Set([...m.values()].filter((c) => c.version && !/[<>*x]/.test(c.version)).map((c) => c.name.toLowerCase()));
    for (const [k, c] of m) if (!c.version && named.has(c.name.toLowerCase())) m.delete(k);
    // Записи из package.json (диапазоны версий без лицензии) уступают точным записям из lock-файлов и папок.
    const exact = new Set([...m.values()].filter((c) => c.src !== "package.json").map((c) => c.name.toLowerCase()));
    for (const [k, c] of m) if (c.src === "package.json" && exact.has(c.name.toLowerCase())) m.delete(k);
    return [...m.values()];
  }

  window.Scan = { parseFile, scanFolder, detectText, dedupe };
})();
