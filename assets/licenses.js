/* База лицензий и правила оценки.
   Категории:
   pd       — общественное достояние и лицензии без условий;
   perm     — разрешительные: нужно сохранить уведомление;
   content  — лицензии для текстов, изображений, данных (Creative Commons);
   weak     — слабый копилефт: раскрыть изменения самого компонента (LGPL, MPL, EPL, CDDL);
   strong   — сильный копилефт: при передаче копий весь продукт на тех же условиях (GPL);
   network  — сетевой копилефт: то же при работе продукта как сервиса (AGPL, EUPL, OSL);
   restricted — не open source: запрет коммерческого использования или работы как сервиса;
   proprietary — закрытая лицензия, нужен отдельный договор;
   none     — лицензии нет;
   unknown  — лицензия не установлена.
   Уровни оценки: 0 — без обязанностей, 1 — есть обязанности, 2 — нужна проверка юристом,
   3 — конфликт, u — лицензия не установлена. */
(function () {
  "use strict";

  const O = {
    notice: "Сохранить уведомление об авторском праве и текст лицензии во всех копиях: в дистрибутиве, документации или окне «О программе».",
    noticeSrc: "Сохранить уведомление об авторском праве в исходном коде компонента.",
    noticeFile: "Передать вместе с продуктом файл NOTICE компонента, если он есть.",
    changes: "Отметить в изменённых файлах, что и когда изменено.",
    noEndorse: "Не использовать имена авторов компонента для продвижения продукта без их разрешения.",
    advertising: "Упоминать авторов компонента во всех рекламных материалах продукта.",
    patent: "Учитывать: патентная лицензия от авторов прекращается, если подать против них патентный иск по поводу компонента.",
    source: "Предоставить получателям исходный код компонента, включая свои изменения, на условиях его лицензии.",
    fileCopyleft: "Изменения в файлах компонента раскрыть на условиях той же лицензии. Свой код в отдельных файлах раскрывать не нужно.",
    relink: "Дать получателям возможность заменить библиотеку изменённой версией. В лицензионном договоре на продукт нельзя запрещать обратную разработку в объёме, нужном для отладки таких изменений.",
    sourceAll: "Распространять весь продукт, в который входит компонент, на условиях той же лицензии и с исходным кодом.",
    network: "Предложить исходный код всего продукта пользователям, которые работают с ним по сети.",
    attribution: "Указать автора и лицензию произведения.",
    shareAlike: "Распространять переработанное произведение на условиях той же лицензии.",
    fontSale: "Не продавать шрифт отдельно от программы.",
    nc: "Не использовать в коммерческих целях.",
    terms: "Соблюдать ограничения, записанные в тексте лицензии: прочитать его целиком.",
    contract: "Иметь отдельный лицензионный договор с правообладателем, который покрывает вашу модель распространения.",
  };

  // gplNo — несовместима с GPL любой версии; gpl2No — несовместима с GPL-2.0-only.
  const L = {};
  const def = (ids, name, cat, ob, x = {}) => ids.split(" ").forEach((id) => (L[id] = { id, name, cat, ob, ...x }));
  def("0BSD", "BSD Zero Clause", "pd", []);
  def("Unlicense", "The Unlicense", "pd", []);
  def("CC0-1.0", "Creative Commons Zero 1.0", "pd", []);
  def("MIT-0", "MIT No Attribution", "pd", []);
  def("WTFPL", "WTFPL", "pd", []);
  def("PublicDomain", "Общественное достояние", "pd", [], { note: "Автор заявил, что передаёт произведение в общественное достояние. В России автор не может отказаться от исключительного права заявлением, поэтому такое заявление рассматривают как разрешение использовать без условий." });
  def("MIT X11 ISC BlueOak-1.0.0 PostgreSQL Unicode-DFS-2016 Unicode-3.0 NCSA", "", "perm", ["notice"]);
  L.MIT.name = "MIT"; L.X11.name = "X11"; L.ISC.name = "ISC"; L["BlueOak-1.0.0"].name = "Blue Oak Model 1.0.0";
  L.PostgreSQL.name = "PostgreSQL"; L["Unicode-DFS-2016"].name = "Unicode License 2016"; L["Unicode-3.0"].name = "Unicode License v3"; L.NCSA.name = "University of Illinois/NCSA";
  def("BSD-2-Clause", "BSD 2-Clause", "perm", ["notice"]);
  def("BSD-3-Clause", "BSD 3-Clause", "perm", ["notice", "noEndorse"]);
  def("BSD-4-Clause", "BSD 4-Clause (с рекламной оговоркой)", "perm", ["notice", "advertising", "noEndorse"], { gplNo: true });
  def("OpenSSL", "OpenSSL License", "perm", ["notice", "advertising"], { gplNo: true });
  def("Apache-2.0", "Apache 2.0", "perm", ["notice", "noticeFile", "changes", "patent"], { gpl2No: true });
  def("Zlib", "zlib", "perm", ["noticeSrc", "changes"]);
  def("BSL-1.0", "Boost Software License 1.0", "perm", ["noticeSrc"]);
  def("Python-2.0 PSF-2.0", "Python Software Foundation", "perm", ["notice", "changes"]);
  def("Artistic-2.0", "Artistic 2.0", "perm", ["notice", "changes"]);
  def("OFL-1.1", "SIL Open Font License 1.1", "perm", ["notice", "fontSale"]);
  def("CC-BY-3.0 CC-BY-4.0", "Creative Commons Attribution", "content", ["attribution"]);
  def("CC-BY-SA-3.0 CC-BY-SA-4.0", "Creative Commons Attribution-ShareAlike", "content", ["attribution", "shareAlike"], { sa: true });
  def("LGPL-2.0-only LGPL-2.0-or-later LGPL-2.1-only LGPL-2.1-or-later", "GNU LGPL 2.x", "weak", ["notice", "source", "relink", "changes"], { lgpl: 2 });
  def("LGPL-3.0-only LGPL-3.0-or-later", "GNU LGPL 3.0", "weak", ["notice", "source", "relink", "changes", "patent"], { lgpl: 3, gpl2No: true });
  L["LGPL-2.1-or-later"].gplAny = true; L["LGPL-2.0-or-later"].gplAny = true;
  def("MPL-2.0", "Mozilla Public License 2.0", "weak", ["notice", "fileCopyleft", "patent"]);
  def("MPL-1.1", "Mozilla Public License 1.1", "weak", ["notice", "fileCopyleft"], { gplNo: true });
  def("EPL-1.0", "Eclipse Public License 1.0", "weak", ["notice", "fileCopyleft", "patent"], { gplNo: true });
  def("EPL-2.0", "Eclipse Public License 2.0", "weak", ["notice", "fileCopyleft", "patent"], { gplMaybe: true });
  def("CDDL-1.0 CDDL-1.1", "Common Development and Distribution License", "weak", ["notice", "fileCopyleft", "patent"], { gplNo: true });
  def("GPL-2.0-only", "GNU GPL 2.0 (только эта версия)", "strong", ["notice", "sourceAll", "changes"], { gpl: 2 });
  def("GPL-2.0-or-later", "GNU GPL 2.0 или более поздняя", "strong", ["notice", "sourceAll", "changes"], { gpl: 2, gplAny: true });
  def("GPL-3.0-only", "GNU GPL 3.0 (только эта версия)", "strong", ["notice", "sourceAll", "changes", "patent"], { gpl: 3 });
  def("GPL-3.0-or-later", "GNU GPL 3.0 или более поздняя", "strong", ["notice", "sourceAll", "changes", "patent"], { gpl: 3, gplAny: true });
  def("GPL", "GNU GPL (версия не указана)", "strong", ["notice", "sourceAll", "changes"], { gpl: 0, note: "Версия GPL не указана. Нужно выяснить её в тексте лицензии компонента." });
  def("AGPL-3.0-only AGPL-3.0-or-later", "GNU Affero GPL 3.0", "network", ["notice", "sourceAll", "network", "changes", "patent"], { gpl: 3, agpl: true });
  def("EUPL-1.2", "European Union Public Licence 1.2", "network", ["notice", "sourceAll", "network"]);
  def("OSL-3.0", "Open Software License 3.0", "network", ["notice", "sourceAll", "network", "patent"], { gplNo: true });
  def("SSPL-1.0", "Server Side Public License 1.0", "restricted", ["sourceAll", "network", "terms"], { sspl: true, gplNo: true });
  def("BUSL-1.1", "Business Source License 1.1", "restricted", ["terms"], { busl: true, gplNo: true });
  def("Elastic-2.0", "Elastic License 2.0", "restricted", ["terms"], { elastic: true, gplNo: true });
  def("CC-BY-NC-4.0 CC-BY-NC-SA-4.0 CC-BY-NC-ND-4.0 CC-BY-NC-3.0", "Creative Commons NonCommercial", "restricted", ["attribution", "nc"], { nc: true, gplNo: true });
  def("PolyForm-Noncommercial-1.0.0", "PolyForm Noncommercial 1.0.0", "restricted", ["nc", "terms"], { nc: true, gplNo: true });
  def("Commons-Clause", "Commons Clause", "restricted", ["terms"], { nc: true, gplNo: true, note: "Commons Clause запрещает продавать программу или услуги, основная ценность которых в этой программе." });
  def("Proprietary", "Закрытая лицензия", "proprietary", ["contract"]);
  def("NONE", "Лицензии нет", "none", []);

  // Исключения к GPL, которые снимают требование раскрывать код продукта.
  const EXC = {
    "classpath-exception-2.0": "weak", "gcc-exception-3.1": "perm", "gcc-exception-2.0": "perm",
    "llvm-exception": "perm", "autoconf-exception-3.0": "perm", "autoconf-exception-2.0": "perm",
    "bison-exception-2.2": "perm", "font-exception-2.0": "perm", "universal-foss-exception-1.0": "weak",
  };

  // ---------- распознавание названия лицензии ----------
  const ids = Object.keys(L);
  const byLower = Object.fromEntries(ids.map((i) => [i.toLowerCase(), i]));
  const ALIAS = [
    [/^(the )?mit( license| licence)?$|^expat$|^mit\/x11$/, "MIT"],
    [/^isc( license)?( \(iscl\))?$/, "ISC"],
    [/^(the )?apache( software)?( license| licence)?,?( version)? ?2(\.0)?$|^apache-2$|^asl ?2(\.0)?$|^apache software license$/, "Apache-2.0"],
    [/^(new |modified |revised |simplified )?bsd( license| licence)?$/, "BSD-3-Clause"],
    [/^bsd[- ]?2([- ]clause)?( license)?$|^freebsd$|^simplified bsd$/, "BSD-2-Clause"],
    [/^bsd[- ]?3([- ]clause)?( license)?$|^new bsd$/, "BSD-3-Clause"],
    [/^(gnu )?(general public license|gpl) ?v?2\+$|^gpl-2\.0\+$|^gplv2 or later$/, "GPL-2.0-or-later"],
    [/^(gnu )?(general public license|gpl) ?v?2(\.0)?( only)?$|^gpl-2\.0$/, "GPL-2.0-only"],
    [/^(gnu )?(general public license|gpl) ?v?3\+$|^gpl-3\.0\+$|^gplv3 or later$/, "GPL-3.0-or-later"],
    [/^(gnu )?(general public license|gpl) ?v?3(\.0)?( only)?$|^gpl-3\.0$/, "GPL-3.0-only"],
    [/^(gnu )?(gpl|general public license)$/, "GPL"],
    [/^(gnu )?(lesser|library) (general public license|gpl) ?v?2(\.1)?\+?$|^lgpl ?v?2(\.1)?\+?$|^lgpl-2\.1\+$/, "LGPL-2.1-or-later"],
    [/^(gnu )?(lesser|library) (general public license|gpl) ?v?3(\.0)?\+?$|^lgpl ?v?3(\.0)?\+?$|^lgpl-3\.0\+$/, "LGPL-3.0-or-later"],
    [/^(gnu )?(lgpl|lesser general public license)$/, "LGPL-2.1-or-later"],
    [/^(gnu )?(affero|agpl)( general public license)? ?v?3(\.0)?\+?$|^agpl-3\.0\+$|^agpl$/, "AGPL-3.0-or-later"],
    [/^(mozilla public license|mpl) ?2(\.0)?( \(mpl 2\.0\))?$/, "MPL-2.0"],
    [/^(mozilla public license|mpl) ?1\.1$/, "MPL-1.1"],
    [/^(eclipse public license|epl) ?(v|version )?1(\.0)?$/, "EPL-1.0"],
    [/^(eclipse public license|epl) ?(v|version )?2(\.0)?$/, "EPL-2.0"],
    [/^cddl( ?1\.[01])?$/, "CDDL-1.0"],
    [/^(python software foundation|psf)( license)?( \(psfl\))?$|^psfl$/, "PSF-2.0"],
    [/^boost( software license)?( 1\.0)?$/, "BSL-1.0"],
    [/^zlib( license)?$/, "Zlib"],
    [/^(the )?unlicense( \(unlicense\))?$/, "Unlicense"],
    [/^public domain$|^public-domain$/, "PublicDomain"],
    [/^cc0( 1\.0)?( universal)?$/, "CC0-1.0"],
    [/^(sil )?ofl( 1\.1)?$|^sil open font license.*$/, "OFL-1.1"],
    [/^business source license.*$|^busl$|^bsl 1\.1$/, "BUSL-1.1"],
    [/^elastic license 2\.0$|^elv2$/, "Elastic-2.0"],
    [/^sspl$|^server side public license.*$/, "SSPL-1.0"],
    [/^eupl( v?1\.2)?$/, "EUPL-1.2"],
    [/^unlicensed$|^proprietary$|^commercial$|^other\/proprietary license$/, "Proprietary"],
  ];
  // Классификаторы PyPI: «License :: OSI Approved :: MIT License».
  const CLASSIFIER = [
    [/mit license/, "MIT"], [/apache software license/, "Apache-2.0"], [/bsd license/, "BSD-3-Clause"],
    [/isc license/, "ISC"], [/python software foundation/, "PSF-2.0"], [/mozilla public license 2\.0/, "MPL-2.0"],
    [/affero general public license v3 or later/, "AGPL-3.0-or-later"], [/affero general public license v3/, "AGPL-3.0-only"],
    [/lesser general public license v3 or later/, "LGPL-3.0-or-later"], [/lesser general public license v3/, "LGPL-3.0-only"],
    [/lesser general public license v2 or later/, "LGPL-2.1-or-later"], [/lesser general public license v2/, "LGPL-2.1-only"],
    [/general public license v3 or later/, "GPL-3.0-or-later"], [/general public license v3/, "GPL-3.0-only"],
    [/general public license v2 or later/, "GPL-2.0-or-later"], [/general public license v2/, "GPL-2.0-only"],
    [/general public license \(gpl\)/, "GPL"], [/the unlicense/, "Unlicense"], [/public domain/, "PublicDomain"],
    [/zlib\/libpng/, "Zlib"], [/boost software license/, "BSL-1.0"], [/eclipse public license 2\.0/, "EPL-2.0"],
    [/eclipse public license 1\.0/, "EPL-1.0"], [/other\/proprietary/, "Proprietary"],
  ];

  // Одно название лицензии → SPDX-идентификатор или null.
  function normOne(raw) {
    let s = String(raw || "").trim();
    while (s.startsWith("(") && s.endsWith(")")) s = s.slice(1, -1).trim();
    if (!s) return null;
    if (byLower[s.toLowerCase()]) return byLower[s.toLowerCase()];
    let t = s.toLowerCase().replace(/[“”"']/g, "").replace(/\s+/g, " ").trim();
    if (/^license :: /.test(t)) { for (const [re, id] of CLASSIFIER) if (re.test(t)) return id; return null; }
    if (byLower[t]) return byLower[t];
    const t2 = t.replace(/ license$| licence$/, "");
    if (byLower[t2]) return byLower[t2];
    for (const [re, id] of ALIAS) if (re.test(t) || re.test(t2)) return id;
    if (/^gpl-2\.0\+$/.test(t)) return "GPL-2.0-or-later";
    if (/^(l?a?gpl)-([23])\.([01])$/.test(t)) return t.toUpperCase().replace(/^(L?A?GPL)/, "$1") + "-only";
    return null;
  }

  // Разбор выражения SPDX: «MIT OR Apache-2.0», «(GPL-2.0-only WITH Classpath-exception-2.0)».
  // Возвращает варианты (OR), каждый — список терминов (AND): {id, exc, raw}.
  function parseExpr(raw) {
    const s = String(raw || "").trim();
    if (!s) return [];
    const flat = s.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
    const orParts = flat.split(/ or /i);
    if (orParts.length === 1 && / and /i.test(flat) === false && / with /i.test(flat) === false) {
      // «MIT/Apache-2.0» и «MIT, Apache-2.0» в старых пакетах означают выбор.
      const sl = flat.split(/\s*\/\s*|\s*,\s*/).filter(Boolean);
      if (sl.length > 1 && sl.every((x) => normOne(x))) return sl.map((x) => [term(x)]);
    }
    return orParts.map((p) => p.split(/ and /i).map(term));
  }
  function term(x) {
    const [lic, exc] = x.split(/ with /i).map((v) => v && v.trim());
    return { id: normOne(lic), exc: exc ? exc.toLowerCase() : null, raw: x.trim() };
  }

  // Порядок рисков категорий для выбора варианта в «A OR B».
  const RANK = { pd: 0, perm: 1, content: 2, weak: 3, strong: 4, network: 5, restricted: 6, proprietary: 7, none: 8, unknown: 9 };
  function catOf(t) {
    if (!t.id) return "unknown";
    let c = L[t.id].cat;
    if (t.exc && EXC[t.exc] && (c === "strong" || c === "weak")) c = EXC[t.exc];
    return c;
  }
  // Итоговая лицензия компонента: выбирается наименее рискованный вариант.
  function resolve(raw) {
    const opts = parseExpr(raw);
    if (!opts.length) return { terms: [], cat: "unknown", choice: null, label: "" };
    let best = null;
    for (const o of opts) {
      const r = Math.max(...o.map((t) => RANK[catOf(t)]));
      if (!best || r < best.r) best = { o, r };
    }
    const terms = best.o;
    const cat = terms.reduce((a, t) => (RANK[catOf(t)] > RANK[a] ? catOf(t) : a), catOf(terms[0]));
    const label = terms.map((t) => (t.id ? t.id + (t.exc ? ` WITH ${t.exc}` : "") : t.raw)).join(" AND ");
    return { terms, cat, choice: opts.length > 1 ? label : null, label };
  }

  // ---------- оценка ----------
  const CAT_RU = { pd: "без условий", perm: "разрешительная", content: "для контента", weak: "слабый копилефт", strong: "копилефт", network: "сетевой копилефт", restricted: "ограничительная", proprietary: "закрытая", none: "нет лицензии", unknown: "не установлена" };
  const USE_RU = { lib: "библиотека в составе продукта", static: "встроен в код или статическая сборка", separate: "отдельная программа в комплекте", dev: "инструмент разработки, в продукт не входит" };

  // product: {model: dist|saas|internal, lic: "proprietary"|SPDX, commercial: bool}
  // comp: {name, version, license, use, modified}
  function assessComp(comp, product) {
    const r = resolve(comp.license);
    const res = { lic: r, level: 0, title: "", why: [], duties: [], todo: [] };
    const linked = comp.use === "lib" || comp.use === "static";
    const shipped = product.model === "dist" && comp.use !== "dev";
    const served = product.model === "saas" && comp.use !== "dev";
    const ids = r.terms.map((t) => t.id).filter(Boolean);
    const info = ids.map((i) => L[i]);
    const any = (k) => info.some((x) => x[k]);
    const set = (lvl, title) => { if (lvl > res.level || !res.title) { res.level = Math.max(res.level, lvl); res.title = title; } };
    const duty = (...codes) => codes.forEach((c) => !res.duties.includes(c) && res.duties.push(c));
    if (r.choice) res.why.push(`Лицензия выбирается из вариантов «${comp.license}». Взят наименее ограничительный: ${r.label}.`);
    info.forEach((x) => x.note && res.why.push(x.note));

    if (r.cat === "unknown") {
      res.level = "u"; res.title = "Лицензия не установлена";
      res.why.push("Сайт не нашёл лицензию в данных о компоненте. Пока она не установлена, нельзя проверить, разрешено ли использование и на каких условиях.");
      res.todo.push("Найти лицензию в репозитории или на странице компонента и указать её в таблице. Если выбрать папку проекта с установленными зависимостями или загрузить SBOM, лицензии подставятся автоматически.");
      return res;
    }
    if (r.cat === "none") {
      set(comp.use === "dev" ? 2 : 3, "Нет лицензии");
      res.why.push("Код без лицензии нельзя использовать без разрешения правообладателя: исключительное право принадлежит автору, а использование без его согласия незаконно (п. 1 ст. 1229, ст. 1270 ГК РФ).");
      res.todo.push("Получить разрешение автора или лицензионный договор, либо заменить компонент.");
      return res;
    }
    if (r.cat === "proprietary") {
      set(2, "Закрытый компонент"); duty("contract");
      res.why.push("Компонент распространяется не на открытой лицензии. Право использовать его даёт только договор с правообладателем.");
      res.todo.push("Проверить, что договор есть и разрешает вашу модель распространения и число пользователей.");
      return res;
    }
    if (any("nc") && product.commercial) {
      set(3, "Запрещено коммерческое использование");
      res.why.push("Лицензия разрешает использование только в некоммерческих целях, а продукт используется в предпринимательской деятельности.");
      res.todo.push("Заменить компонент или получить у правообладателя коммерческую лицензию.");
      duty("nc"); return res;
    }
    if (comp.use === "dev") {
      res.title = "Инструмент разработки";
      res.why.push("Компонент нужен только для разработки или сборки и не передаётся вместе с продуктом. Условия о распространении к нему не применяются.");
      if (any("busl") || any("elastic") || any("sspl")) { set(2, "Ограничительная лицензия у инструмента"); res.todo.push("Прочитать условия: лицензия может ограничивать и само использование, а не только распространение."); }
      else res.todo.push("Проверить, что компонент действительно не попадает в сборку.");
      return res;
    }

    switch (r.cat) {
      case "pd":
        res.title = "Без условий"; break;
      case "perm":
        if (shipped) { set(1, "Нужно сохранить уведомления"); info.forEach((x) => duty(...x.ob)); }
        else { res.title = "Без обязанностей при вашей модели"; res.why.push("Обязанности разрешительных лицензий возникают при передаче копий. Продукт не передаётся, поэтому сейчас их нет."); }
        if (shipped && any("advertising")) res.why.push("Лицензия требует упоминать авторов в рекламе. Это неудобно и делает компонент несовместимым с GPL.");
        break;
      case "content":
        if (shipped || served) { set(any("sa") ? 2 : 1, any("sa") ? "Лицензия для контента с условием «на тех же условиях»" : "Нужно указать автора"); info.forEach((x) => duty(...x.ob)); }
        else res.title = "Без обязанностей при вашей модели";
        if (any("sa")) res.why.push("CC BY-SA рассчитана на тексты и изображения. Если по ней лицензирован код, неясно, какую часть продукта считать переработкой.");
        break;
      case "weak":
        if (!shipped) { res.title = "Без обязанностей при вашей модели"; res.why.push("Слабый копилефт срабатывает при передаче копий. Если продукт станет передаваться клиентам, появятся обязанности."); break; }
        set(1, "Нужно раскрыть код компонента"); info.forEach((x) => duty(...x.ob));
        if (info.some((x) => x.lgpl)) {
          if (comp.use === "static") { set(2, "LGPL при статической сборке"); res.why.push("При статической сборке LGPL требует передать получателям объектные файлы продукта или его исходный код, чтобы они могли пересобрать продукт с изменённой библиотекой."); res.todo.push("Перейти на динамическое подключение библиотеки или подготовить объектные файлы для пересборки."); }
          if (product.lic === "proprietary") res.todo.push("Проверить лицензионный договор (EULA) продукта: запрет обратной разработки не должен мешать отладке изменённой библиотеки.");
        }
        if (comp.modified) res.todo.push("Подготовить исходный код изменённого компонента для передачи получателям.");
        break;
      case "strong":
      case "network": {
        const triggers = r.cat === "network" ? shipped || served : shipped;
        if (!triggers) {
          if (r.cat === "network" && product.model === "internal") { set(1, "Сетевой копилефт внутри компании"); res.why.push("AGPL требует предложить исходный код тем, кто работает с изменённой программой по сети. Если ей пользуются только работники компании, это обычно не считают предоставлением третьим лицам, но при доступе подрядчиков или клиентов обязанность возникнет."); res.todo.push("Не открывать доступ к программе за пределами компании или подготовить исходный код."); }
          else { res.title = "Без обязанностей при вашей модели"; res.why.push(product.model === "saas" ? "GPL требует раскрывать код при передаче копий. Если продукт работает только как сервис и копии не передаются, обязанность не возникает. При переходе на поставку клиентам оценка изменится." : "Копии продукта никому не передаются, поэтому условия GPL о распространении не применяются."); }
          break;
        }
        if (comp.use === "separate") duty("notice", "source", "changes");
        else info.forEach((x) => duty(...x.ob));
        if (comp.use === "separate") {
          set(2, "Отдельная программа под копилефтом");
          res.why.push("Если программа под GPL только поставляется вместе с продуктом и обменивается с ним данными стандартными способами (файлы, командная строка, сеть), условия GPL распространяются только на неё, а не на весь продукт. Граница спорная: тесная интеграция может сделать их одним произведением.");
          res.todo.push("Описать, как продукт взаимодействует с программой, и передать её исходный код получателям.");
        } else if (product.lic === "proprietary") {
          set(3, r.cat === "network" && served ? "Закрытый сервис с AGPL-кодом" : "Закрытый продукт с GPL-кодом");
          res.why.push(r.cat === "network" && served
            ? "AGPL требует предложить исходный код всего продукта пользователям, которые работают с ним по сети. Для закрытого сервиса это означает раскрыть его код."
            : "Продукт связан с копилефт-кодом и передаётся клиентам. Лицензия требует передавать продукт целиком на тех же условиях и с исходным кодом, что противоречит закрытой лицензии.");
          res.todo.push("Заменить компонент; выделить его в отдельную программу; купить у правообладателя коммерческую лицензию, если он её продаёт; либо открыть код продукта на совместимых условиях.");
          res.why.push("Если продолжать распространение с нарушением условий, лицензия прекращается, а дальнейшее использование становится нарушением исключительного права (ст. 1301 ГК РФ: компенсация от 10 тыс. до 5 млн руб. или двукратная стоимость права).");
        } else {
          set(1, "Продукт распространяется на условиях копилефта");
          res.why.push("Продукт открыт, но условия копилефта распространяются на него целиком. Проверьте совместимость в разделе о конфликтах.");
        }
        if (info.some((x) => x.gpl === 0)) set(2, res.title);
        break;
      }
      case "restricted":
        info.forEach((x) => duty(...x.ob));
        if (any("sspl") && (served || shipped)) { set(3, "SSPL при работе сервиса или передаче"); res.why.push("SSPL требует при предоставлении программы как сервиса раскрыть код всего сервиса, включая инфраструктуру управления. На практике это несовместимо с закрытым сервисом."); res.todo.push("Заменить компонент или купить коммерческую лицензию."); }
        else { set(2, "Не open source: ограничения в тексте лицензии"); res.why.push(any("busl") ? "Business Source License разрешает производственное использование только в пределах дополнительного разрешения (Additional Use Grant) и переходит в открытую лицензию после даты, указанной правообладателем." : any("elastic") ? "Elastic License 2.0 запрещает предоставлять программу третьим лицам как управляемый сервис и обходить ключи лицензии." : "Лицензия ограничивает использование. Её нужно прочитать целиком."); res.todo.push("Прочитать условия и сверить с моделью продукта."); }
        break;
    }
    if (comp.modified && (r.cat === "perm" || r.cat === "strong" || r.cat === "network") && (shipped || served)) duty("changes");
    if (!res.title) res.title = "Без обязанностей";
    return res;
  }

  // Конфликты на уровне продукта: совместимость лицензий связанных компонентов.
  function assessProduct(comps, results, product) {
    const out = [];
    const shipped = product.model === "dist";
    const served = product.model === "saas";
    const linked = comps.map((c, i) => ({ c, r: results[i], i })).filter((x) => (x.c.use === "lib" || x.c.use === "static"));
    const lic = (x) => x.r.lic.terms.map((t) => t.id).filter(Boolean).map((i) => L[i]);
    const names = (arr) => arr.map((x) => x.c.name).join(", ");
    const copyleft = linked.filter((x) => (shipped && (x.r.lic.cat === "strong" || x.r.lic.cat === "network")) || (served && x.r.lic.cat === "network"));
    if (!copyleft.length) return out;

    const gpl2only = copyleft.filter((x) => lic(x).some((l) => l.gpl === 2 && !l.gplAny));
    const v3 = linked.filter((x) => lic(x).some((l) => l.gpl === 3 || l.lgpl === 3));
    const gpl2no = linked.filter((x) => lic(x).some((l) => l.gpl2No) && !gpl2only.includes(x));
    if (gpl2only.length && (v3.length || gpl2no.length)) {
      out.push({ level: 3, at: [...gpl2only, ...v3, ...gpl2no].map((x) => x.i), title: "GPL-2.0-only несовместима с частью компонентов",
        text: `${names(gpl2only)} лицензированы только по GPL-2.0. С ними в одном продукте нельзя распространять код под GPL-3.0, LGPL-3.0 и Apache 2.0 (${names([...new Set([...v3, ...gpl2no])])}): по позиции Free Software Foundation их условия противоречат GPL-2.0.`,
        todo: "Найти версии компонентов под совместимыми лицензиями или разделить продукт на отдельные программы." });
    }
    const gplNo = linked.filter((x) => lic(x).some((l) => l.gplNo));
    if (gplNo.length) {
      out.push({ level: 3, at: gplNo.map((x) => x.i), title: "Компоненты, несовместимые с GPL",
        text: `В продукт под условиями копилефта (${names(copyleft)}) входят компоненты, лицензии которых с GPL несовместимы: ${names(gplNo)}. Выполнить условия обеих лицензий одновременно нельзя.`,
        todo: "Заменить один из компонентов или вынести его в отдельную программу." });
    }
    const epl2 = linked.filter((x) => lic(x).some((l) => l.gplMaybe));
    if (epl2.length) out.push({ level: 2, at: epl2.map((x) => x.i), title: "EPL 2.0 рядом с GPL", text: `EPL 2.0 совместима с GPL, только если правообладатель указал GPL как вторичную лицензию (Secondary License). Компоненты: ${names(epl2)}.`, todo: "Проверить файл лицензии компонента." });
    if (product.lic !== "proprietary" && L[product.lic]) {
      const p = L[product.lic];
      const need = copyleft.map((x) => lic(x)).flat();
      const isCopyleft = p.cat === "strong" || p.cat === "network";
      if (!isCopyleft) out.push({ level: 2, at: copyleft.map((x) => x.i), title: `Лицензия продукта ${product.lic} не учитывает копилефт`,
        text: `Продукт объявлен под ${p.name}, но в него входит копилефт-код (${names(copyleft)}). Передавать продукт целиком можно только на условиях ${need.map((l) => l.id).filter((v, i, a) => a.indexOf(v) === i).join(", ")}.`,
        todo: "Сменить лицензию продукта на совместимую или заменить компоненты." });
      else if (p.gpl === 2 && !p.gplAny && v3.length) out.push({ level: 3, at: v3.map((x) => x.i), title: "Продукт под GPL-2.0-only с компонентами версии 3", text: `Компоненты под GPL-3.0 или LGPL-3.0 (${names(v3)}) нельзя распространять в составе продукта под GPL-2.0-only.`, todo: "Перевести продукт на GPL-3.0 или заменить компоненты." });
    }
    return out;
  }

  window.Lic = { L, O, CAT_RU, USE_RU, normOne, resolve, assessComp, assessProduct, ids: ids.filter((i) => !["GPL", "NONE", "PublicDomain", "Proprietary"].includes(i)).sort((a, b) => a.localeCompare(b)) };
})();
