import test from "node:test";
import assert from "node:assert/strict";
import { checkFrameHeaders } from "../embed-check.js";

const ourOrigin = "https://skillsight.example";

test("XFO DENY blocks", () => {
  const r = checkFrameHeaders({ status: 200, xfoRaw: ["DENY"], ourOrigin });
  assert.equal(r.embeddable, false);
  assert.match(r.reason, /DENY/);
});

test("XFO SAMEORIGIN blocks", () => {
  const r = checkFrameHeaders({ status: 200, xfoRaw: ["SAMEORIGIN"], ourOrigin });
  assert.equal(r.embeddable, false);
  assert.match(r.reason, /SAMEORIGIN/);
});

test("frame-ancestors 'none' blocks", () => {
  const r = checkFrameHeaders({
    status: 200,
    cspRawValues: ["default-src 'self'; frame-ancestors 'none'"],
    ourOrigin,
  });
  assert.equal(r.embeddable, false);
  assert.match(r.reason, /frame-ancestors/);
});

test("frame-ancestors with a specific other origin blocks", () => {
  const r = checkFrameHeaders({
    status: 200,
    cspRawValues: ["frame-ancestors https://not-skillsight.example"],
    ourOrigin,
  });
  assert.equal(r.embeddable, false);
});

test("frame-ancestors with our own origin allows", () => {
  const r = checkFrameHeaders({
    status: 200,
    cspRawValues: [`frame-ancestors ${ourOrigin}`],
    ourOrigin,
  });
  assert.equal(r.embeddable, true);
});

test("frame-ancestors * allows", () => {
  const r = checkFrameHeaders({
    status: 200,
    cspRawValues: ["frame-ancestors *"],
    ourOrigin,
  });
  assert.equal(r.embeddable, true);
  assert.equal(r.reason, null);
});

test("no headers + 200 allows", () => {
  const r = checkFrameHeaders({ status: 200, ourOrigin });
  assert.equal(r.embeddable, true);
});

test("no headers + 403 blocks", () => {
  const r = checkFrameHeaders({ status: 403, ourOrigin });
  assert.equal(r.embeddable, false);
  assert.match(r.reason, /403/);
});

test("no headers + network error status blocks", () => {
  const r = checkFrameHeaders({ status: null, ourOrigin });
  assert.equal(r.embeddable, false);
});

test("CSP frame-ancestors takes precedence over a permissive-looking XFO", () => {
  const r = checkFrameHeaders({
    status: 200,
    xfoRaw: ["SAMEORIGIN"],
    cspRawValues: ["frame-ancestors *"],
    ourOrigin,
  });
  assert.equal(r.embeddable, true);
});

test("multiple CSP headers: strictest of several policies wins", () => {
  const r = checkFrameHeaders({
    status: 200,
    cspRawValues: ["frame-ancestors *", "frame-ancestors 'none'"],
    ourOrigin,
  });
  assert.equal(r.embeddable, false);
});
