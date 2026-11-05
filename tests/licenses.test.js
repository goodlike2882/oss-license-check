// Распознавание названий лицензий и выражений SPDX.
const test = require("node:test");
const assert = require("node:assert/strict");
const { Lic } = require("./load");

const names = {
  "MIT": "MIT", "The MIT License": "MIT", "Apache 2.0": "Apache-2.0", "Apache License, Version 2.0": "Apache-2.0",
  "ALv2": "Apache-2.0", "The BSD License": "BSD-3-Clause", "Eclipse Distribution License - v 1.0": "BSD-3-Clause",
  "GPLv3": "GPL-3.0-only", "GPL-2.0": "GPL-2.0-only", "GPL-2.0+": "GPL-2.0-or-later",
  "GNU General Public License v3.0 or later": "GPL-3.0-or-later", "LGPL-2.1": "LGPL-2.1-only",
  "GNU Lesser General Public License, Version 2.1": "LGPL-2.1-only", "lgpl_v2_1": "LGPL-2.1-only",
  "AGPL-3.0": "AGPL-3.0-only", "GNU Affero General Public License v3": "AGPL-3.0-only",
  "COMMON DEVELOPMENT AND DISTRIBUTION LICENSE (CDDL) Version 1.0": "CDDL-1.0", "ISC License (ISCL)": "ISC",
  "License :: OSI Approved :: BSD License": "BSD-3-Clause", "UNLICENSED": "Proprietary", "Public Domain": "PublicDomain",
};
for (const [raw, id] of Object.entries(names)) test(`«${raw}» → ${id}`, () => assert.equal(Lic.normOne(raw), id));

test("нераспознанное название не угадывается", () => {
  assert.equal(Lic.normOne("SEE LICENSE IN LICENSE"), null);
  assert.equal(Lic.normOne("какая-то лицензия"), null);
});

test("из выбора OR берётся наименее ограничительный вариант", () => {
  const r = Lic.resolve("GPL-3.0-or-later OR MIT");
  assert.equal(r.label, "MIT");
  assert.equal(r.cat, "perm");
  assert.ok(r.choice);
});

test("AND суммирует условия: категория по самому строгому термину", () => {
  assert.equal(Lic.resolve("Apache-2.0 AND LGPL-3.0-or-later").cat, "weak");
});

test("исключение Classpath снимает сильный копилефт", () => {
  assert.equal(Lic.resolve("GPL-2.0-only WITH Classpath-exception-2.0").cat, "weak");
  assert.equal(Lic.resolve("GNU General Public License, version 2 (GPL2), with the classpath exception AND MIT").cat, "weak");
});

test("«or later» и «and» внутри названий не делят выражение", () => {
  assert.equal(Lic.resolve("Lesser General Public License, version 3 or greater AND Apache-2.0").label, "LGPL-3.0-or-later AND Apache-2.0");
  assert.equal(Lic.resolve("Apache License, Version 2.0 and Common Development And Distribution License (CDDL) Version 1.0").label, "Apache-2.0 AND CDDL-1.0");
});
