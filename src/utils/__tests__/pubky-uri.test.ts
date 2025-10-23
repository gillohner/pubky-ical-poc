import {
  parseCalendarUri,
  parseEventUri,
  getCalendarPageUrl,
  getEventPageUrl,
  extractPublicKey,
  extractFileId,
} from "../pubky-uri";

describe("pubky-uri utilities", () => {
  describe("parseCalendarUri", () => {
    it("should parse valid calendar URI", () => {
      const uri = "pubky://user123/pub/pubky.app/calendar/cal456";
      const result = parseCalendarUri(uri);
      
      expect(result).toEqual({
        authorId: "user123",
        calendarId: "cal456",
      });
    });

    it("should return null for invalid URI", () => {
      expect(parseCalendarUri("invalid")).toBeNull();
      expect(parseCalendarUri("pubky://user/wrong/path")).toBeNull();
    });
  });

  describe("parseEventUri", () => {
    it("should parse valid event URI", () => {
      const uri = "pubky://user123/pub/pubky.app/event/evt456";
      const result = parseEventUri(uri);
      
      expect(result).toEqual({
        authorId: "user123",
        eventId: "evt456",
      });
    });

    it("should return null for invalid URI", () => {
      expect(parseEventUri("invalid")).toBeNull();
    });
  });

  describe("getCalendarPageUrl", () => {
    it("should build calendar page URL", () => {
      const uri = "pubky://user123/pub/pubky.app/calendar/cal456";
      const url = getCalendarPageUrl(uri);
      
      expect(url).toBe("/calendar/user123/cal456");
    });

    it("should return null for invalid URI", () => {
      expect(getCalendarPageUrl("invalid")).toBeNull();
    });
  });

  describe("getEventPageUrl", () => {
    it("should build event page URL", () => {
      const uri = "pubky://user123/pub/pubky.app/event/evt456";
      const url = getEventPageUrl(uri);
      
      expect(url).toBe("/event/user123/evt456");
    });

    it("should return null for invalid URI", () => {
      expect(getEventPageUrl("invalid")).toBeNull();
    });
  });

  describe("extractPublicKey", () => {
    it("should extract public key from URI", () => {
      const uri = "pubky://user123/pub/pubky.app/files/abc";
      expect(extractPublicKey(uri)).toBe("user123");
    });

    it("should handle different URI formats", () => {
      expect(extractPublicKey("pubky://pk123/path/to/resource")).toBe("pk123");
      expect(extractPublicKey("pubky://user/")).toBe("user");
    });

    it("should return null for invalid input", () => {
      expect(extractPublicKey(null)).toBeNull();
      expect(extractPublicKey(undefined)).toBeNull();
      expect(extractPublicKey("")).toBeNull();
      expect(extractPublicKey("http://example.com")).toBeNull();
    });
  });

  describe("extractFileId", () => {
    it("should extract file ID from file URI", () => {
      const uri = "pubky://user/pub/pubky.app/files/abc123";
      expect(extractFileId(uri)).toBe("abc123");
    });

    it("should handle different paths", () => {
      expect(extractFileId("pubky://user/pub/pubky.app/blobs/xyz789")).toBe("xyz789");
      expect(extractFileId("pubky://user/path/to/file.txt")).toBe("file.txt");
    });

    it("should return null for invalid input", () => {
      expect(extractFileId(null)).toBeNull();
      expect(extractFileId(undefined)).toBeNull();
      expect(extractFileId("")).toBeNull();
    });
  });
});
