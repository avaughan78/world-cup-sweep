import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for hydration scripts and inline __NEXT_DATA__
  // googletagmanager.com serves the GA4 tag script
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  // Tailwind + React inline style props require 'unsafe-inline'
  "style-src 'self' 'unsafe-inline'",
  // Allow any HTTPS image — TheSportsDB uses multiple CDN subdomains (r2.thesportsdb.com etc.)
  // and Wikipedia can serve from various Wikimedia hosts. Restricting to specific domains
  // breaks regularly as CDNs change; https: still blocks all HTTP image sources.
  "img-src 'self' data: https:",
  // Google Fonts are self-hosted by Next.js at build time
  "font-src 'self'",
  // Local video files (.mp4) for prize easter eggs
  "media-src 'self'",
  // YouTube/Vimeo iframes for prize video modal and trophy easter egg
  "frame-src https://www.youtube.com https://player.vimeo.com",
  // canvas-confetti spawns a Web Worker from a blob URL for off-thread rendering
  "worker-src blob:",
  // Same-origin API calls + GA4 data collection endpoints
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com",
  // Disallow <object>, <embed>, <applet>
  "object-src 'none'",
  // Prevent base-tag injection attacks
  "base-uri 'self'",
  // Restrict where forms can submit
  "form-action 'self'",
  // Prevent this site being embedded in any frame (CSP-level equivalent of X-Frame-Options)
  "frame-ancestors 'none'",
  // Upgrade any accidental http:// subrequests to https://
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options',                value: 'DENY' },
  { key: 'X-Content-Type-Options',         value: 'nosniff' },
  { key: 'Referrer-Policy',                value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',             value: 'camera=(), microphone=(), geolocation=()' },
  // Force HTTPS for 1 year, including subdomains
  { key: 'Strict-Transport-Security',      value: 'max-age=31536000; includeSubDomains' },
  // Prevent cross-origin window references (pop-up/tab isolation)
  { key: 'Cross-Origin-Opener-Policy',     value: 'same-origin' },
  // Prevent other origins loading this site's resources
  { key: 'Cross-Origin-Resource-Policy',   value: 'same-origin' },
  { key: 'Content-Security-Policy',        value: csp },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
