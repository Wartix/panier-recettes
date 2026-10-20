import { describe, expect, it } from "vitest";
import { parseReceipt } from "@/lib/receipts/parse";

const SAMPLE = `
MAXI
LAVAL CHOMEDEY
LAIT 2% 2L                 5,29
BEURRE SALE 454G           4,99
OEUFS GROS X12             4,49
POITRINE POULET
  0,682 kg @ 13,99/kg      9,54
SOUS-TOTAL                24,31
TPS                        0,00
TOTAL                     24,31
`;

describe("parseReceipt", () => {
  it("reads a Quebec receipt, weight lines, and the prices paid", () => {
    const receipt = parseReceipt(SAMPLE);
    expect(receipt.storeId).toBe("maxi");
    expect(receipt.lines.map((line) => line.priceCents)).toEqual([529, 499, 449, 954]);
    expect(receipt.lines[0].itemKey).toBe("milk");
    expect(receipt.lines[1].itemKey).toBe("butter");
    expect(receipt.lines[3]).toMatchObject({ quantity: 0.682, unit: "kg", itemKey: "chicken_breast" });
    expect(receipt.totalCents).toBe(2431);
  });
});
