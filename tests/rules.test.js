// Оценка компонентов и конфликты на уровне продукта.
const test = require("node:test");
const assert = require("node:assert/strict");
const { Lic } = require("./load");

const DIST = { model: "dist", lic: "proprietary", commercial: true };
const SAAS = { model: "saas", lic: "proprietary", commercial: true };
const INTERNAL = { model: "internal", lic: "proprietary", commercial: true };
const c = (license, use = "lib", extra = {}) => ({ name: "x", license, use, modified: false, ...extra });
const level = (license, product, use) => Lic.assessComp(c(license, use), product).level;

test("MIT: обязанности при передаче копий, без обязанностей в SaaS", () => {
  assert.equal(level("MIT", DIST), 1);
  assert.equal(level("MIT", SAAS), 0);
  assert.deepEqual(Lic.assessComp(c("MIT"), DIST).duties, ["notice"]);
});

test("GPL в закрытом продукте: конфликт при передаче, нет обязанностей в SaaS", () => {
  assert.equal(level("GPL-3.0-only", DIST), 3);
  assert.equal(level("GPL-3.0-only", SAAS), 0);
  assert.equal(level("GPL-3.0-only", INTERNAL), 0);
});

test("AGPL в закрытом сервисе — конфликт; внутри компании — обязанности", () => {
  assert.equal(level("AGPL-3.0-or-later", SAAS), 3);
  assert.equal(level("AGPL-3.0-or-later", INTERNAL), 1);
});

test("GPL как отдельная программа требует проверки и раскрытия только её кода", () => {
  const r = Lic.assessComp(c("GPL-3.0-only", "separate"), DIST);
  assert.equal(r.level, 2);
  assert.ok(r.duties.includes("source"));
  assert.ok(!r.duties.includes("sourceAll"));
});

test("LGPL: обязанности при динамическом подключении, проверка при статической сборке", () => {
  assert.equal(level("LGPL-2.1-or-later", DIST, "lib"), 1);
  assert.equal(level("LGPL-2.1-or-later", DIST, "static"), 2);
  assert.ok(Lic.assessComp(c("LGPL-2.1-or-later"), DIST).duties.includes("relink"));
});

test("инструмент разработки не создаёт обязанностей", () => {
  assert.equal(level("GPL-3.0-only", DIST, "dev"), 0);
});

test("некоммерческая лицензия в коммерческом продукте — конфликт", () => {
  assert.equal(level("CC-BY-NC-4.0", DIST), 3);
  assert.equal(level("CC-BY-NC-4.0", { ...DIST, commercial: false }), 2);
});

test("SSPL в сервисе — конфликт", () => assert.equal(level("SSPL-1.0", SAAS), 3));
test("лицензия не установлена — отдельный уровень", () => assert.equal(level("", DIST), "u"));
test("UNLICENSED — закрытый компонент, нужен договор", () => assert.equal(level("UNLICENSED", DIST), 2));
test("исключение FOSS у MySQL не снимает конфликт", () => assert.equal(level("GPL-2.0-only WITH Universal-FOSS-exception-1.0", DIST), 3));

function product(comps, p) {
  const res = comps.map((x) => Lic.assessComp(x, p));
  return Lic.assessProduct(comps, res, p);
}

test("GPL-2.0-only рядом с Apache 2.0 и GPL-3.0 — конфликт", () => {
  const issues = product([c("GPL-2.0-only"), c("Apache-2.0"), c("GPL-3.0-only")], { ...DIST, lic: "GPL-2.0-only" });
  assert.ok(issues.some((i) => i.level === 3 && /GPL-2\.0-only/.test(i.title)));
});

test("компонент, несовместимый с GPL, в копилефт-продукте — конфликт", () => {
  const issues = product([c("GPL-3.0-only"), c("EPL-1.0")], { ...DIST, lic: "GPL-3.0-only" });
  assert.ok(issues.some((i) => i.level === 3 && /несовместимые с GPL/.test(i.title)));
});

test("открытый продукт под MIT с GPL-кодом — проверка лицензии продукта", () => {
  const issues = product([c("GPL-3.0-only")], { ...DIST, lic: "MIT" });
  assert.ok(issues.some((i) => i.level === 2));
});

test("в SaaS GPL-компоненты не порождают конфликтов продукта", () => {
  assert.equal(product([c("GPL-2.0-only"), c("Apache-2.0")], SAAS).length, 0);
});
