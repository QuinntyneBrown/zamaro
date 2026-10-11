<?php

namespace App\Services\Accounts;

use App\Models\User;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use PragmaRX\Google2FA\Google2FA;

/**
 * RFC 6238 codes for two-step sign-in (L2-072.3, ADR-0021): 30-second steps, six digits, and one step
 * either side accepted for a phone clock that is a little off. Codes follow the real clock, never the
 * frozen e2e one, as the person's authenticator app does.
 */
class TotpVerifier
{
    private const WINDOW = 1;

    private readonly Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA;
        $this->google2fa->setWindow(self::WINDOW);
    }

    /** A new base32 key of 32 characters (160 bits). */
    public function newSecret(): string
    {
        return $this->google2fa->generateSecretKey(32);
    }

    /** The key in groups of four, as the setup page shows it: "JBSW Y3DP EHPK 3PXP …". */
    public static function grouped(string $secret): string
    {
        return trim(chunk_split($secret, 4, ' '));
    }

    /** The `otpauth://` address an authenticator app reads from the QR code. */
    public function uri(User $user, string $secret): string
    {
        return $this->google2fa->getQRCodeUrl(config('app.name'), $user->email, $secret);
    }

    /** The QR code of `uri()` as SVG. */
    public function qrSvg(string $uri): string
    {
        return (new Writer(new ImageRenderer(new RendererStyle(192, 1), new SvgImageBackEnd)))->writeString($uri);
    }

    public function verify(string $secret, string $code): bool
    {
        $code = preg_replace('/\s/', '', $code);

        return preg_match('/^\d{6}$/', $code) === 1 && $this->google2fa->verifyKey($secret, $code, self::WINDOW);
    }
}
