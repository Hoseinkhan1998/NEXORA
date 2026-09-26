import crypto from "node:crypto";
import type { TelegramUser } from "../types";

export interface VerifiedTelegramData {
  user: TelegramUser;
  authDate: Date;
  queryId?: string;
  startParam?: string;
}

/**
 * Validates Telegram Mini App initData string using HMAC-SHA256 according to Telegram specifications.
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number = 86400 // Default 24 hours
): { isValid: boolean; data: VerifiedTelegramData | null; error?: string } {
  if (!initData || !botToken) {
    return { isValid: false, data: null, error: "Missing initData or botToken" };
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) {
      return { isValid: false, data: null, error: "Hash parameter missing in initData" };
    }

    params.delete("hash");

    // Sort parameters alphabetically
    const keys = Array.from(params.keys()).sort();
    const dataCheckArr: string[] = [];

    for (const key of keys) {
      const val = params.get(key);
      if (val !== null) {
        dataCheckArr.push(`${key}=${val}`);
      }
    }

    const dataCheckString = dataCheckArr.join("\n");

    // secret_key = HMAC_SHA256("WebAppData", bot_token)
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // calculated_hash = HMAC_SHA256(secret_key, data_check_string)
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    const calculatedBuffer = Buffer.from(calculatedHash, "hex");
    const receivedBuffer = Buffer.from(hash, "hex");

    if (
      calculatedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(calculatedBuffer, receivedBuffer)
    ) {
      return { isValid: false, data: null, error: "Invalid cryptographic signature" };
    }

    // Check auth_date for expiration
    const authDateStr = params.get("auth_date");
    if (!authDateStr) {
      return { isValid: false, data: null, error: "auth_date missing" };
    }

    const authTimestamp = parseInt(authDateStr, 10);
    if (isNaN(authTimestamp)) {
      return { isValid: false, data: null, error: "Invalid auth_date format" };
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (maxAgeSeconds > 0 && nowSeconds - authTimestamp > maxAgeSeconds) {
      return { isValid: false, data: null, error: "initData has expired" };
    }

    // Parse user object
    const userJson = params.get("user");
    if (!userJson) {
      return { isValid: false, data: null, error: "User payload missing" };
    }

    const user = JSON.parse(userJson) as TelegramUser;
    const queryId = params.get("query_id") || undefined;
    const startParam = params.get("start_param") || undefined;

    return {
      isValid: true,
      data: {
        user,
        authDate: new Date(authTimestamp * 1000),
        queryId,
        startParam,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation exception";
    return { isValid: false, data: null, error: message };
  }
}
