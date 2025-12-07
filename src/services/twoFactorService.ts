import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

export class TwoFactorService {
  private static readonly APP_NAME = 'Inversor';

  /**
   * Generate a new 2FA secret for a user
   */
  static generateSecret(email: string): { secret: string; otpauthUrl: string } {
    const secret = speakeasy.generateSecret({
      name: `${this.APP_NAME} (${email})`,
      issuer: this.APP_NAME,
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url || '',
    };
  }

  /**
   * Generate QR code as data URL from otpauth URL
   */
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#112026',
          light: '#ffffff',
        },
      });
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP token against a secret
   */
  static verifyToken(token: string, secret: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1, // Allow 1 step before/after for clock drift
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate backup codes for recovery
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      // Format as XXXX-XXXX for readability
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
  }

  /**
   * Hash backup codes for secure storage
   */
  static hashBackupCodes(codes: string[]): string[] {
    return codes.map((code) =>
      crypto.createHash('sha256').update(code.replace('-', '')).digest('hex')
    );
  }

  /**
   * Verify a backup code against hashed codes
   */
  static verifyBackupCode(code: string, hashedCodes: string[]): number {
    const normalizedCode = code.replace('-', '').toUpperCase();
    const hashedInput = crypto
      .createHash('sha256')
      .update(normalizedCode)
      .digest('hex');

    return hashedCodes.findIndex((hashedCode) => hashedCode === hashedInput);
  }
}
