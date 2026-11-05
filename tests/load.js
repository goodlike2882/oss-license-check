// Загружает браузерные модули в Node: они пишут в window.
global.window = {};
global.DOMParser = class { parseFromString() { throw new Error("DOMParser недоступен в тестах"); } };
require("../assets/licenses.js");
require("../assets/scanner.js");
module.exports = { Lic: window.Lic, Scan: window.Scan };
