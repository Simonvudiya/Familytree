import {
  formatDate,
  formatRelativeTime,
  calculateReadingTime,
  countWords,
  generateSlug,
  truncate,
  getInitials,
  calculateAge,
  formatLifespan,
  formatFileSize,
  getFileExtension,
  isValidImageFile,
  isValidDocumentFile,
} from "@/lib/utils";

describe("formatDate", () => {
  it("formats date in default format", () => {
    expect(formatDate("2024-01-15")).toBe("January 15, 2024");
  });

  it("handles Date objects", () => {
    expect(formatDate(new Date("2024-01-15"))).toBe("January 15, 2024");
  });

  it("respects custom options", () => {
    expect(formatDate("2024-01-15", { month: "short", day: "numeric" })).toBe("Jan 15, 2024");
  });

  it("handles invalid dates gracefully", () => {
    expect(formatDate("invalid")).toBe("Invalid Date");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  it("returns 'just now' for recent times", () => {
    expect(formatRelativeTime(now)).toBe("just now");
  });

  it("returns minutes ago", () => {
    expect(formatRelativeTime(oneMinuteAgo)).toBe("1m ago");
  });

  it("returns hours ago", () => {
    expect(formatRelativeTime(oneHourAgo)).toBe("1h ago");
  });

  it("returns days ago", () => {
    expect(formatRelativeTime(oneDayAgo)).toBe("1d ago");
  });

  it("returns weeks ago", () => {
    expect(formatRelativeTime(oneWeekAgo)).toBe("1w ago");
  });

  it("returns months ago", () => {
    expect(formatRelativeTime(oneMonthAgo)).toBe("1mo ago");
  });

  it("returns years ago", () => {
    expect(formatRelativeTime(oneYearAgo)).toBe("1y ago");
  });
});

describe("calculateReadingTime", () => {
  it("calculates reading time for short text", () => {
    const text = "This is a short text with ten words total.";
    expect(calculateReadingTime(text)).toBe(1);
  });

  it("calculates reading time for longer text", () => {
    const text = "word ".repeat(400);
    expect(calculateReadingTime(text)).toBe(2);
  });

  it("handles empty text", () => {
    expect(calculateReadingTime("")).toBe(0);
  });
});

describe("countWords", () => {
  it("counts words correctly", () => {
    expect(countWords("Hello world")).toBe(2);
    expect(countWords("  Multiple   spaces  ")).toBe(2);
    expect(countWords("")).toBe(0);
  });
});

describe("generateSlug", () => {
  it("generates slug from title", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("handles special characters", () => {
    expect(generateSlug("Hello, World! @#$")).toBe("hello-world");
  });

  it("handles multiple spaces", () => {
    expect(generateSlug("Hello    World")).toBe("hello-world");
  });

  it("trims leading/trailing dashes", () => {
    expect(generateSlug("  Hello World  ")).toBe("hello-world");
  });

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });
});

describe("truncate", () => {
  it("truncates long text", () => {
    expect(truncate("Hello world this is a long text", 15)).toBe("Hello world thi...");
  });

  it("returns original if shorter than limit", () => {
    expect(truncate("Short", 10)).toBe("Short");
  });

  it("handles exact length", () => {
    expect(truncate("Exactly 10", 10)).toBe("Exactly 10");
  });
});

describe("getInitials", () => {
  it("gets initials from name", () => {
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("John Michael Doe")).toBe("JM");
    expect(getInitials("John")).toBe("J");
  });

  it("handles extra spaces", () => {
    expect(getInitials("  John   Doe  ")).toBe("JD");
  });
});

describe("calculateAge", () => {
  it("calculates age correctly", () => {
    const birthDate = "2000-01-15";
    const today = new Date();
    const expectedAge = today.getFullYear() - 2000 - (today.getMonth() < 0 || (today.getMonth() === 0 && today.getDate() < 15) ? 1 : 0);
    expect(calculateAge(birthDate)).toBe(expectedAge);
  });

  it("handles death date", () => {
    expect(calculateAge("1990-01-01", "2020-01-01")).toBe(30);
  });

  it("returns null for future birth date", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(calculateAge(future.toISOString())).toBeNull();
  });
});

describe("formatLifespan", () => {
  it("formats living person", () => {
    expect(formatLifespan("1990-01-01", undefined, true)).toBe("1990 – Present");
  });

  it("formats deceased person", () => {
    expect(formatLifespan("1990-01-01", "2020-01-01", false)).toBe("1990 – 2020");
  });

  it("handles missing birth date", () => {
    expect(formatLifespan(undefined, "2020-01-01")).toBe("");
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
    expect(formatFileSize(500)).toBe("500 Bytes");
  });

  it("formats KB", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("formats MB", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
  });

  it("formats GB", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
  });
});

describe("getFileExtension", () => {
  it("extracts extension", () => {
    expect(getFileExtension("document.pdf")).toBe("pdf");
    expect(getFileExtension("image.PNG")).toBe("png");
    expect(getFileExtension("archive.tar.gz")).toBe("gz");
  });

  it("handles no extension", () => {
    expect(getFileExtension("README")).toBe("");
  });
});

describe("isValidImageFile", () => {
  it("validates image types", () => {
    const jpeg = new File([""], "test.jpg", { type: "image/jpeg" });
    const png = new File([""], "test.png", { type: "image/png" });
    const webp = new File([""], "test.webp", { type: "image/webp" });
    const gif = new File([""], "test.gif", { type: "image/gif" });
    const heic = new File([""], "test.heic", { type: "image/heic" });

    expect(isValidImageFile(jpeg)).toBe(true);
    expect(isValidImageFile(png)).toBe(true);
    expect(isValidImageFile(webp)).toBe(true);
    expect(isValidImageFile(gif)).toBe(true);
    expect(isValidImageFile(heic)).toBe(true);
  });

  it("rejects non-image types", () => {
    const pdf = new File([""], "test.pdf", { type: "application/pdf" });
    const txt = new File([""], "test.txt", { type: "text/plain" });

    expect(isValidImageFile(pdf)).toBe(false);
    expect(isValidImageFile(txt)).toBe(false);
  });
});

describe("isValidDocumentFile", () => {
  it("validates document types", () => {
    const pdf = new File([""], "test.pdf", { type: "application/pdf" });
    const doc = new File([""], "test.doc", { type: "application/msword" });
    const docx = new File([""], "test.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const txt = new File([""], "test.txt", { type: "text/plain" });

    expect(isValidDocumentFile(pdf)).toBe(true);
    expect(isValidDocumentFile(doc)).toBe(true);
    expect(isValidDocumentFile(docx)).toBe(true);
    expect(isValidDocumentFile(txt)).toBe(true);
  });

  it("rejects non-document types", () => {
    const jpg = new File([""], "test.jpg", { type: "image/jpeg" });
    const mp3 = new File([""], "test.mp3", { type: "audio/mpeg" });

    expect(isValidDocumentFile(jpg)).toBe(false);
    expect(isValidDocumentFile(mp3)).toBe(false);
  });
});