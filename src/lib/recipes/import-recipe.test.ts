import { describe, expect, it } from "vitest";
import { isBlockedHost } from "@/lib/recipes/import-recipe";

describe("isBlockedHost", () => {
  it("rejects loopback, private, and link-local hosts", () => {
    expect(isBlockedHost("localhost")).toBe(true);
    expect(isBlockedHost("127.0.0.1")).toBe(true);
    expect(isBlockedHost("10.1.2.3")).toBe(true);
    expect(isBlockedHost("192.168.0.12")).toBe(true);
    expect(isBlockedHost("172.16.0.4")).toBe(true);
    expect(isBlockedHost("169.254.169.254")).toBe(true);
    expect(isBlockedHost("::1")).toBe(true);
  });

  it("allows a public recipe host", () => {
    expect(isBlockedHost("www.marmiton.org")).toBe(false);
    expect(isBlockedHost("8.8.8.8")).toBe(false);
  });
});
