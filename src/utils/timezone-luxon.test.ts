import { AdminTimeUtil } from "../utils/timezone-luxon";

describe("AdminTimeUtil", () => {
  describe("formatToronto", () => {
    it("should format UTC date to Toronto timezone correctly", () => {
      // August 15, 2025 11:30 PM UTC = 7:30 PM EDT
      const utcDate = "2025-08-15T23:30:00.000Z";
      const formatted = AdminTimeUtil.formatToronto(utcDate);

      expect(formatted).toBe("August 15, 2025 7:30 PM");
    });

    it("should handle winter time correctly", () => {
      // December 16, 2024 12:30 AM UTC = December 15, 2024 7:30 PM EST
      const utcDate = "2024-12-16T00:30:00.000Z";
      const formatted = AdminTimeUtil.formatToronto(utcDate);

      expect(formatted).toBe("December 15, 2024 7:30 PM");
    });

    it("should return empty string for null/undefined input", () => {
      expect(AdminTimeUtil.formatToronto(null)).toBe("");
      expect(AdminTimeUtil.formatToronto(undefined)).toBe("");
      expect(AdminTimeUtil.formatToronto("")).toBe("");
    });
  });

  describe("formatForDateTimeInput", () => {
    it("should format UTC date for datetime-local input", () => {
      // August 15, 2025 11:30 PM UTC = 7:30 PM EDT
      const utcDate = "2025-08-15T23:30:00.000Z";
      const formatted = AdminTimeUtil.formatForDateTimeInput(utcDate);

      expect(formatted).toBe("2025-08-15T19:30");
    });

    it("should handle winter time correctly", () => {
      // December 16, 2024 12:30 AM UTC = December 15, 2024 7:30 PM EST
      const utcDate = "2024-12-16T00:30:00.000Z";
      const formatted = AdminTimeUtil.formatForDateTimeInput(utcDate);

      expect(formatted).toBe("2024-12-15T19:30");
    });
  });

  describe("parseFromDateTimeInput", () => {
    it("should parse Toronto datetime input to UTC ISO string", () => {
      // August 15, 2025 7:30 PM EDT = 11:30 PM UTC
      const torontoInput = "2025-08-15T19:30";
      const utcISO = AdminTimeUtil.parseFromDateTimeInput(torontoInput);

      expect(utcISO).toBe("2025-08-15T23:30:00.000Z");
    });

    it("should handle winter time correctly", () => {
      // December 15, 2024 7:30 PM EST = December 16, 2024 12:30 AM UTC
      const torontoInput = "2024-12-15T19:30";
      const utcISO = AdminTimeUtil.parseFromDateTimeInput(torontoInput);

      expect(utcISO).toBe("2024-12-16T00:30:00.000Z");
    });

    it("should throw error for invalid input", () => {
      expect(() => AdminTimeUtil.parseFromDateTimeInput("")).toThrow();
      expect(() => AdminTimeUtil.parseFromDateTimeInput("invalid")).toThrow();
    });
  });

  describe("isDaylightSavingTime", () => {
    it("should detect summer DST correctly", () => {
      const summerDate = "2025-08-15T12:00:00.000Z";
      expect(AdminTimeUtil.isDaylightSavingTime(summerDate)).toBe(true);
    });

    it("should detect winter standard time correctly", () => {
      const winterDate = "2025-01-15T12:00:00.000Z";
      expect(AdminTimeUtil.isDaylightSavingTime(winterDate)).toBe(false);
    });
  });

  describe("getTimezoneInfo", () => {
    it("should return correct timezone info for summer", () => {
      const summerDate = "2025-08-15T12:00:00.000Z";
      const info = AdminTimeUtil.getTimezoneInfo(summerDate);

      expect(info.timezone).toBe("America/Toronto");
      expect(info.abbreviation).toBe("EDT");
      expect(info.offset).toBe("-04:00");
      expect(info.isDST).toBe(true);
    });

    it("should return correct timezone info for winter", () => {
      const winterDate = "2025-01-15T12:00:00.000Z";
      const info = AdminTimeUtil.getTimezoneInfo(winterDate);

      expect(info.timezone).toBe("America/Toronto");
      expect(info.abbreviation).toBe("EST");
      expect(info.offset).toBe("-05:00");
      expect(info.isDST).toBe(false);
    });
  });

  describe("round-trip conversion", () => {
    it("should maintain consistency in round-trip conversion", () => {
      const originalInput = "2025-08-15T19:30";

      // Toronto input -> UTC -> back to Toronto input format
      const utcISO = AdminTimeUtil.parseFromDateTimeInput(originalInput);
      const backToInput = AdminTimeUtil.formatForDateTimeInput(utcISO);

      expect(backToInput).toBe(originalInput);
    });

    it("should handle DST boundary round-trip correctly", () => {
      const dstInput = "2025-03-09T03:30";

      const utcISO = AdminTimeUtil.parseFromDateTimeInput(dstInput);
      const backToInput = AdminTimeUtil.formatForDateTimeInput(utcISO);

      expect(backToInput).toBe(dstInput);
    });
  });

  describe("formatOperationHours", () => {
    it("should format operation hours correctly", () => {
      const result = AdminTimeUtil.formatOperationHours("09:00", "17:00");
      expect(result).toBe("9:00 AM - 5:00 PM");
    });

    it('should return "Closed" for missing times', () => {
      expect(AdminTimeUtil.formatOperationHours("", "17:00")).toBe("Closed");
      expect(AdminTimeUtil.formatOperationHours("09:00", "")).toBe("Closed");
    });
  });
});
