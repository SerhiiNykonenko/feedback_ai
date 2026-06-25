import { describe, expect, it } from "vitest";
import { translate } from "@/lib/i18n";

describe("translations", () => {
  it("provides English and Ukrainian navigation labels", () => {
    expect(translate("en", "settings")).toBe("Settings");
    expect(translate("uk", "settings")).toBe("Налаштування");
  });

  it("provides localized action labels", () => {
    expect(translate("en", "createUser")).toBe("Create user");
    expect(translate("uk", "createUser")).toBe("Створити користувача");
  });
});
