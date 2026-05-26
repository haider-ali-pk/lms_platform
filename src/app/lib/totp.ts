import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

export function generateTOTPSecret(email: string): {
  secret: string;
  otpauthUrl: string;
} {
  const totp = new OTPAuth.TOTP({
    issuer: "EduFlow",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret(),
  });

  return {
    secret: totp.secret.base32,
    otpauthUrl: totp.toString(),
  };
}

export function verifyTOTPCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

export async function generateQRCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}