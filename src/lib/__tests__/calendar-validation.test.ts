import {
  validateCalendarForm,
  validateEventForm,
  generateEventUid,
  dateToMicroseconds,
  microsecondsToDate,
  formatDateForInput,
  parseDateFromInput,
} from "../calendar-validation";

describe("calendar-validation", () => {
  describe("validateCalendarForm", () => {
    it("should validate correct calendar form", () => {
      const result = validateCalendarForm({
        name: "My Calendar",
        color: "#FF0000",
        timezone: "Europe/Zurich",
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should require calendar name", () => {
      const result = validateCalendarForm({
        name: "",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it("should validate color format", () => {
      const invalidColor = validateCalendarForm({
        name: "Test",
        color: "invalid",
      });

      expect(invalidColor.isValid).toBe(false);
      expect(invalidColor.errors.color).toBeDefined();

      const validColor = validateCalendarForm({
        name: "Test",
        color: "#FF0000",
      });

      expect(validColor.isValid).toBe(true);
    });
  });

  describe("validateEventForm", () => {
    it("should validate correct event form", () => {
      const start = new Date("2025-10-23T10:00:00");
      const end = new Date("2025-10-23T11:00:00");

      const result = validateEventForm({
        summary: "Team Meeting",
        dtstart: start,
        dtend: end,
        status: "CONFIRMED",
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should require event summary", () => {
      const result = validateEventForm({
        summary: "",
        dtstart: new Date(),
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.summary).toBeDefined();
    });

    it("should require start date", () => {
      const result = validateEventForm({
        summary: "Test Event",
        dtstart: null as any,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.dtstart).toBeDefined();
    });

    it("should validate end date is after start date", () => {
      const start = new Date("2025-10-23T11:00:00");
      const end = new Date("2025-10-23T10:00:00"); // Before start

      const result = validateEventForm({
        summary: "Test",
        dtstart: start,
        dtend: end,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.dtend).toBeDefined();
    });
  });

  describe("generateEventUid", () => {
    it("should generate valid UID", () => {
      const uid = generateEventUid("user123");
      
      expect(uid).toContain("@user123");
      expect(uid).toMatch(/^\d+-[a-z0-9]+@user123$/);
    });

    it("should generate unique UIDs", () => {
      const uid1 = generateEventUid("user123");
      const uid2 = generateEventUid("user123");
      
      expect(uid1).not.toBe(uid2);
    });
  });

  describe("date conversion", () => {
    it("should convert date to microseconds", () => {
      const date = new Date("2025-10-23T12:00:00.000Z");
      const microseconds = dateToMicroseconds(date);
      
      expect(typeof microseconds).toBe("number");
      expect(microseconds).toBeGreaterThan(0);
    });

    it("should convert microseconds to date", () => {
      const originalDate = new Date("2025-10-23T12:00:00.000Z");
      const microseconds = dateToMicroseconds(originalDate);
      const convertedDate = microsecondsToDate(microseconds);
      
      expect(convertedDate.getTime()).toBe(originalDate.getTime());
    });
  });

  describe("formatDateForInput", () => {
    it("should format date for datetime-local input", () => {
      const date = new Date("2025-10-23T15:30:00");
      const formatted = formatDateForInput(date);
      
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });

  describe("parseDateFromInput", () => {
    it("should parse datetime-local input", () => {
      const input = "2025-10-23T15:30";
      const date = parseDateFromInput(input);
      
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(9); // October (0-indexed)
      expect(date?.getDate()).toBe(23);
    });

    it("should return null for invalid input", () => {
      expect(parseDateFromInput("invalid")).toBeNull();
      expect(parseDateFromInput("")).toBeNull();
    });
  });
});
