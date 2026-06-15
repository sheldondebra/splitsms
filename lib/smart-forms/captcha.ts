import { createHmac, timingSafeEqual } from "crypto";

function captchaSecret(): string {
  return process.env.SESSION_SECRET ?? "splitsms-captcha";
}

export type CaptchaChallenge = {
  a: number;
  b: number;
  token: string;
};

export function createCaptchaChallenge(): CaptchaChallenge {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const token = createHmac("sha256", captchaSecret())
    .update(`captcha:${a}:${b}`)
    .digest("hex")
    .slice(0, 32);
  return { a, b, token };
}

export function verifyCaptchaChallenge(
  a: number,
  b: number,
  answer: number,
  token: string,
): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(answer)) return false;
  if (a < 1 || a > 9 || b < 1 || b > 9) return false;
  if (answer !== a + b) return false;

  const expected = createHmac("sha256", captchaSecret())
    .update(`captcha:${a}:${b}`)
    .digest("hex")
    .slice(0, 32);

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
