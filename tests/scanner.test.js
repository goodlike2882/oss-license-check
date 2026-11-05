// Чтение форматов и распознавание текстов лицензий.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { Scan } = require("./load");
const fx = (f) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8");

test("package-lock v3: версии, лицензии и пометка dev", () => {
  const r = Scan.parseFile("package-lock.json", fx("package-lock.json"));
  const by = Object.fromEntries(r.comps.map((x) => [x.name, x]));
  assert.equal(r.comps.length, 4);
  assert.equal(by.react.license, "MIT");
  assert.equal(by.typescript.use, "dev");
  assert.equal(by["@img/sharp-libvips-linux-x64"].license, "LGPL-3.0-or-later");
  assert.equal(by.nolic.license, "");
});

test("CycloneDX: несколько записей и выражения", () => {
  const r = Scan.parseFile("bom.json", fx("cyclonedx.json"));
  assert.equal(r.kind, "SBOM CycloneDX");
  assert.ok(r.comps.find((x) => x.name === "org.apache.logging.log4j/log4j-core" && x.license === "Apache-2.0"));
});

test("метаданные пакета Python: лицензия из классификатора", () => {
  const r = Scan.parseFile("METADATA", fx("METADATA"));
  assert.equal(r.comps[0].name, "requests");
  assert.equal(r.comps[0].license, "Apache-2.0");
});

test("requirements.txt: имена и версии", () => {
  const r = Scan.parseFile("requirements.txt", "requests==2.31.0\n# comment\nDjango>=4.2 ; python_version>'3.8'\n-r other.txt\n");
  assert.deepEqual(r.comps.map((x) => [x.name, x.version]), [["requests", "2.31.0"], ["Django", "4.2"]]);
});

test("текст лицензии распознаётся по характерным фразам", () => {
  assert.equal(Scan.detectText("Permission is hereby granted, free of charge, to any person obtaining a copy ... The above copyright notice and this permission notice shall be included").id, "MIT");
  assert.equal(Scan.detectText("GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007").id, "GPL-3.0-only");
  assert.equal(Scan.detectText("Apache License Version 2.0, January 2004").id, "Apache-2.0");
  assert.equal(Scan.detectText("просто текст"), null);
});

test("строки Copyright без шаблонных строк лицензии", () => {
  const cr = Scan.copyrights("Copyright (c) Meta Platforms, Inc.\nCopyright (c) <year> <copyright holders>\nThe above copyright notice\n© 2015 Jane Doe");
  assert.deepEqual(cr, ["Copyright (c) Meta Platforms, Inc.", "© 2015 Jane Doe"]);
});

test("дубликаты из package.json уступают точным записям", () => {
  const out = Scan.dedupe([
    { name: "react", version: "^18.2.0", license: "", use: "lib", src: "package.json" },
    { name: "react", version: "18.2.0", license: "MIT", use: "lib", src: "package-lock.json" },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].license, "MIT");
});
