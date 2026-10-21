const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(require("node:path").join(__dirname, "../src/shared/lib/input-formats.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const compiledExports = {};
vm.runInNewContext(compiled, { exports: compiledExports });

const { nationalMobile, localMobile, formatNationalMobile, formatLocalMobile, validNationalMobile, validLocalMobile, cameraId, formatCameraId, validCameraId, buttonId, formatButtonId, validButtonId, plateInput, validPlateInput, formatInputEdit } = compiledExports;
assert.equal(localMobile("0917 123 4567"), "09171234567");
assert.equal(localMobile("+63 917 123 4567"), "09171234567");
assert.equal(localMobile("0917abc1234567"), "09171234567");
assert.equal(formatLocalMobile("09171234567"), "0917 123 4567");
assert.equal(validLocalMobile("09171234567"), true);
assert.equal(validLocalMobile("08171234567"), false);
assert.equal(nationalMobile("+63 917 123 4567"), "9171234567");
assert.equal(nationalMobile("09171234567"), "9171234567");
assert.equal(nationalMobile("917123456789"), "9171234567");
assert.equal(nationalMobile("08171234567"), "8171234567");
assert.equal(validNationalMobile(nationalMobile("08171234567")), false);
assert.equal(formatNationalMobile("9171234567"), "917 123 4567");
assert.equal(validNationalMobile("9171234567"), true);
assert.equal(validNationalMobile("917123456"), false);
assert.equal(cameraId("cam-793-mau"), "CAM793MAU");
assert.equal(formatCameraId(cameraId("C")), "C");
assert.equal(formatCameraId(cameraId("CA")), "CA");
assert.equal(formatCameraId(cameraId("CAM")), "CAM-");
assert.equal(cameraId("CAM793MAUX"), "CAM793MAUX");
assert.equal(formatCameraId(cameraId("CAM793MAU")), "CAM-793-MAU");
assert.equal(formatCameraId(cameraId("XYZ793MAU")), "XYZ-793-MAU");
assert.equal(formatCameraId(cameraId("CAM-79-MAU")), "CAM-79M-AU");
assert.equal(formatCameraId(cameraId("CAM-A")), "CAM-A");
assert.equal(validCameraId(cameraId("CAM-79-MAU")), false);
assert.equal(validCameraId(cameraId("CAM-793-MAU")), true);
assert.equal(validCameraId(cameraId("XYZ-793-MAU")), true);
assert.equal(plateInput("abc@1234"), "ABC1234");
assert.equal(validPlateInput("ABC-1234"), true);
assert.equal(validPlateInput("123ABC"), true);
assert.equal(buttonId("but-071-xkd"), "BUT071XKD");
assert.equal(formatButtonId(buttonId("BUT071XKD")), "BUT-071-XKD");
assert.equal(formatButtonId(buttonId("SUN071XKD")), "SUN-071-XKD");
assert.equal(validButtonId(buttonId("BUT-071-XKD")), true);
assert.equal(validButtonId(buttonId("SUN-071-XKD")), true);
assert.equal(validButtonId(buttonId("BUT-07-XKD")), false);
assert.equal(buttonId("BUT-071-XKDX"), "BUT071XKDX");
const phoneFormat = { normalize: nationalMobile, format: formatNationalMobile };
assert.equal(formatInputEdit("912 345", "912345", phoneFormat).raw, "91345");
assert.equal(formatInputEdit("912 345", "912 9345", phoneFormat).formatted, "912 934 5");
assert.equal(formatInputEdit("912 345", "912 9345", phoneFormat).cursor, 5);
assert.equal(formatInputEdit("", "+63 917 123 4567", phoneFormat).formatted, "917 123 4567");
const cameraFormat = { normalize: cameraId, format: formatCameraId };
assert.equal(formatInputEdit("", "CAM793MAU", cameraFormat).formatted, "CAM-793-MAU");
assert.equal(formatInputEdit("", "XYZ793MAU", cameraFormat).formatted, "XYZ-793-MAU");
assert.equal(formatInputEdit("", "C", cameraFormat).cursor, 1);
assert.equal(formatInputEdit("CA", "CAM", cameraFormat).formatted, "CAM-");
assert.equal(formatInputEdit("CA", "CAM", cameraFormat).cursor, 4);
assert.equal(formatInputEdit("CAM-79", "CAM-793", cameraFormat).formatted, "CAM-793-");
assert.equal(formatInputEdit("CAM-79", "CAM-793", cameraFormat).cursor, 8);
assert.equal(formatInputEdit("CAM-", "CAM-A", cameraFormat).formatted, "CAM-A");
assert.equal(formatInputEdit("CAM-", "CAM-A", cameraFormat).raw, "CAMA");
assert.equal(validCameraId(formatInputEdit("CAM-", "CAM-A", cameraFormat).raw), false);
const buttonFormat = { normalize: buttonId, format: formatButtonId };
assert.equal(formatInputEdit("", "BUT071XKD", buttonFormat).formatted, "BUT-071-XKD");
assert.equal(formatInputEdit("", "SUN071XKD", buttonFormat).formatted, "SUN-071-XKD");
assert.equal(formatInputEdit("BUT-07", "BUT-07A", buttonFormat).formatted, "BUT-07A-");
for (const inputFormat of [cameraFormat, buttonFormat]) {
  let displayed = "";
  for (const [character, expected] of [
    ["A", "A"], ["B", "AB"], ["C", "ABC-"],
    ["1", "ABC-1"], ["2", "ABC-12"], ["3", "ABC-123-"],
    ["X", "ABC-123-X"], ["Y", "ABC-123-XY"], ["Z", "ABC-123-XYZ"],
  ]) {
    const edit = formatInputEdit(displayed, displayed + character, inputFormat);
    assert.equal(edit.formatted, expected);
    assert.equal(edit.cursor, expected.length);
    displayed = edit.formatted;
  }
  assert.equal(formatInputEdit("ABC-", "ABC", inputFormat).formatted, "AB");
  assert.equal(formatInputEdit("ABC-123-", "ABC-123", inputFormat).formatted, "ABC-12");
  assert.equal(formatInputEdit("ABC-12", "ABC-124", inputFormat).formatted, "ABC-124-");
  assert.equal(formatInputEdit("", "ABC-123-XYZ", inputFormat).formatted, "ABC-123-XYZ");
}
console.log("Input format tests passed");
