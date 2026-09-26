import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyTelegramInitData } from "./verify-init-data";

describe("verifyTelegramInitData", () => {
  const dummyToken = "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ";

  function createValidInitData(userObj: object, authDateSeconds: number, token: string) {
    const params = new URLSearchParams();
    params.set("auth_date", authDateSeconds.toString());
    params.set("query_id", "AAG_dummy123");
    params.set("user", JSON.stringify(userObj));

    // Sort keys alphabetically
    const keys = Array.from(params.keys()).sort();
    const dataCheckArr: string[] = [];
    for (const key of keys) {
      dataCheckArr.push(`${key}=${params.get(key)}`);
    }
    const dataCheckString = dataCheckArr.join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(token)
      .digest();

    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    params.set("hash", hash);
    return params.toString();
  }

  it("validates a freshly generated initData signature successfully", () => {
    const now = Math.floor(Date.now() / 1000);
    const user = { id: 987654321, first_name: "John", username: "john_doe" };
    const initData = createValidInitData(user, now, dummyToken);

    const result = verifyTelegramInitData(initData, dummyToken, 86400);
    expect(result.isValid).toBe(true);
    expect(result.data?.user.id).toBe(987654321);
    expect(result.data?.user.first_name).toBe("John");
    expect(result.data?.queryId).toBe("AAG_dummy123");
  });

  it("rejects initData signed with a different token", () => {
    const now = Math.floor(Date.now() / 1000);
    const user = { id: 987654321, first_name: "John" };
    const initData = createValidInitData(user, now, "DIFFERENT_TOKEN");

    const result = verifyTelegramInitData(initData, dummyToken, 86400);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Invalid cryptographic signature");
  });

  it("rejects expired initData", () => {
    const past = Math.floor(Date.now() / 1000) - 90000; // > 24 hours ago
    const user = { id: 987654321, first_name: "John" };
    const initData = createValidInitData(user, past, dummyToken);

    const result = verifyTelegramInitData(initData, dummyToken, 86400);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("initData has expired");
  });

  it("rejects tampered user payload", () => {
    const now = Math.floor(Date.now() / 1000);
    const user = { id: 987654321, first_name: "John" };
    const initData = createValidInitData(user, now, dummyToken);

    // Tamper with user parameter
    const tampered = initData.replace("John", "Hacker");

    const result = verifyTelegramInitData(tampered, dummyToken, 86400);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Invalid cryptographic signature");
  });
});

describe("verifyTelegramWidgetData", () => {
  const dummyToken = "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ";

  it("validates widget data payload successfully", async () => {
    const { verifyTelegramWidgetData } = await import("./verify-init-data");
    const now = Math.floor(Date.now() / 1000);

    const checkString = `auth_date=${now}\nfirst_name=Alex\nid=5551234\nusername=alex_test`;
    const secretKey = crypto.createHash("sha256").update(dummyToken).digest();
    const hash = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

    const payload = {
      id: 5551234,
      first_name: "Alex",
      username: "alex_test",
      auth_date: now,
      hash,
    };

    const result = verifyTelegramWidgetData(payload, dummyToken);
    expect(result.isValid).toBe(true);
    expect(result.data?.id).toBe(5551234);
    expect(result.data?.first_name).toBe("Alex");
    expect(result.data?.username).toBe("alex_test");
  });

  it("rejects widget data with invalid signature", async () => {
    const { verifyTelegramWidgetData } = await import("./verify-init-data");
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      id: 5551234,
      first_name: "Alex",
      auth_date: now,
      hash: "invalidhash123",
    };

    const result = verifyTelegramWidgetData(payload, dummyToken);
    expect(result.isValid).toBe(false);
  });
});

