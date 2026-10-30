import { describe, expect, test } from "bun:test";
import { PublicBaseUrlError, resolvePublicBaseUrl } from "./base-url";

const PROD_URL = "https://connectrip-guide-interviews.netlify.app";

describe("resolvePublicBaseUrl in production", () => {
  const resolve = (configured: string | undefined, requestOrigin = "https://connectrip-guide-interviews.netlify.app") =>
    resolvePublicBaseUrl({ configured, requestOrigin, production: true });

  test("uses the configured https origin", () => {
    expect(resolve(PROD_URL)).toBe(PROD_URL);
    expect(resolve(`${PROD_URL}/`)).toBe(PROD_URL);
    expect(resolve(` ${PROD_URL} `)).toBe(PROD_URL);
  });

  test("ignores the request origin", () => {
    expect(resolve(PROD_URL, "http://localhost:3000")).toBe(PROD_URL);
  });

  test.each([undefined, ""])("refuses a missing value (%p) instead of falling back", (configured) => {
    expect(() => resolve(configured)).toThrow(PublicBaseUrlError);
  });

  test.each([
    "http://localhost:3000",
    "https://localhost:3000",
    "https://127.0.0.1:3005",
    "https://0.0.0.0",
    "https://[::1]:3000",
    "http://connectrip-guide-interviews.netlify.app",
  ])("refuses %s", (configured) => {
    expect(() => resolve(configured)).toThrow(PublicBaseUrlError);
  });

  test("does not mistake a hostname that merely starts with localhost", () => {
    expect(resolve("https://localhost.example.com")).toBe("https://localhost.example.com");
  });
});

describe("resolvePublicBaseUrl in development", () => {
  test("uses the configured value, local or not", () => {
    expect(resolvePublicBaseUrl({ configured: "http://localhost:3000/", requestOrigin: "http://localhost:3005", production: false })).toBe(
      "http://localhost:3000",
    );
  });

  test("falls back to the request origin", () => {
    expect(resolvePublicBaseUrl({ configured: undefined, requestOrigin: "http://localhost:3005", production: false })).toBe(
      "http://localhost:3005",
    );
  });
});
