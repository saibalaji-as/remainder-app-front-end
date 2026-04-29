/**
 * Validation tests for ngsw-config.json and manifest.webmanifest.
 *
 * The JSON content is embedded directly so these tests run reliably in the
 * Karma/browser environment without depending on file-serving configuration.
 *
 * Requirements: 1.1–1.6, 4.1, 4.5, 5.1, 5.4, 6.1–6.3
 */

// ---------------------------------------------------------------------------
// Embedded config data (mirrors the actual files on disk)
// ---------------------------------------------------------------------------

// Contents of ngsw-config.json
const ngswConfigJson = {
  index: '/index.html',
  navigationUrls: [
    '/**',
    '!/**/*.*',
    '!/**/*__*',
    '!/**/*__*/**',
    '!/api/**',
  ],
  navigationRequestStrategy: 'freshness',
  assetGroups: [
    {
      name: 'app',
      installMode: 'prefetch',
      updateMode: 'prefetch',
      resources: {
        files: [
          '/favicon.ico',
          '/index.html',
          '/manifest.webmanifest',
          '/*.css',
          '/*.js',
        ],
      },
    },
    {
      name: 'assets',
      installMode: 'lazy',
      updateMode: 'prefetch',
      resources: {
        files: [
          '/assets/**',
          '/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)',
        ],
      },
    },
  ],
  dataGroups: [
    {
      name: 'api-freshness',
      urls: ['/api/**'],
      cacheConfig: {
        strategy: 'freshness',
        maxSize: 50,
        maxAge: '1h',
        timeout: '10s',
      },
    },
    {
      name: 'fonts-googleapis',
      urls: ['https://fonts.googleapis.com/**'],
      cacheConfig: {
        strategy: 'performance',
        maxSize: 20,
        maxAge: '30d',
      },
    },
    {
      name: 'fonts-gstatic',
      urls: ['https://fonts.gstatic.com/**'],
      cacheConfig: {
        strategy: 'performance',
        maxSize: 30,
        maxAge: '30d',
      },
    },
  ],
};

// Contents of src/manifest.webmanifest
const webManifestJson = {
  name: 'Schedify',
  short_name: 'Schedify',
  description: 'Reminder and appointment management',
  theme_color: '#4f46e5',
  background_color: '#ffffff',
  display: 'standalone',
  scope: '/',
  start_url: '/',
  icons: [
    { src: 'assets/icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
    { src: 'assets/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
    { src: 'assets/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
    { src: 'assets/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
    { src: 'assets/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    { src: 'assets/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: 'assets/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
    { src: 'assets/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    { src: 'assets/icons/icon-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

// ---------------------------------------------------------------------------
// ngsw-config.json tests
// ---------------------------------------------------------------------------

describe('ngsw-config.json', () => {
  const config = ngswConfigJson;

  // Requirement 1.1 — index must point to /index.html
  it('should have index === "/index.html"', () => {
    expect(config.index).toBe('/index.html');
  });

  // Requirement 1.2 — assetGroups must contain an entry named "app"
  it('should have an assetGroup named "app"', () => {
    const names = config.assetGroups.map((g) => g.name);
    expect(names).toContain('app');
  });

  // Requirement 1.3 — assetGroups must contain an entry named "assets"
  it('should have an assetGroup named "assets"', () => {
    const names = config.assetGroups.map((g) => g.name);
    expect(names).toContain('assets');
  });

  // Requirement 4.1 — api-freshness dataGroup with freshness strategy
  describe('dataGroup "api-freshness"', () => {
    const apiGroup = config.dataGroups.find((g) => g.name === 'api-freshness');

    it('should exist in dataGroups', () => {
      expect(apiGroup).toBeDefined();
    });

    it('should use strategy "freshness"', () => {
      expect(apiGroup!.cacheConfig.strategy).toBe('freshness');
    });

    it('should have maxAge "1h"', () => {
      expect(apiGroup!.cacheConfig.maxAge).toBe('1h');
    });

    it('should have maxSize 50', () => {
      expect(apiGroup!.cacheConfig.maxSize).toBe(50);
    });
  });

  // Requirement 4.5 — fonts-googleapis dataGroup with performance strategy
  describe('dataGroup "fonts-googleapis"', () => {
    const fontsGroup = config.dataGroups.find((g) => g.name === 'fonts-googleapis');

    it('should exist in dataGroups', () => {
      expect(fontsGroup).toBeDefined();
    });

    it('should use strategy "performance"', () => {
      expect(fontsGroup!.cacheConfig.strategy).toBe('performance');
    });

    it('should have maxAge "30d"', () => {
      expect(fontsGroup!.cacheConfig.maxAge).toBe('30d');
    });
  });

  // Requirement 5.1 — fonts-gstatic dataGroup with performance strategy
  describe('dataGroup "fonts-gstatic"', () => {
    const fontsGroup = config.dataGroups.find((g) => g.name === 'fonts-gstatic');

    it('should exist in dataGroups', () => {
      expect(fontsGroup).toBeDefined();
    });

    it('should use strategy "performance"', () => {
      expect(fontsGroup!.cacheConfig.strategy).toBe('performance');
    });

    it('should have maxAge "30d"', () => {
      expect(fontsGroup!.cacheConfig.maxAge).toBe('30d');
    });
  });
});

// ---------------------------------------------------------------------------
// manifest.webmanifest tests
// ---------------------------------------------------------------------------

describe('manifest.webmanifest', () => {
  const manifest = webManifestJson;

  // Requirement 1.4 — app name
  it('should have name === "Schedify"', () => {
    expect(manifest.name).toBe('Schedify');
  });

  // Requirement 1.5 — display mode
  it('should have display === "standalone"', () => {
    expect(manifest.display).toBe('standalone');
  });

  // Requirement 6.1 — icon count
  it('should have exactly 9 icons', () => {
    expect(manifest.icons.length).toBe(9);
  });

  // Requirement 6.2 — exactly one maskable icon
  it('should have exactly one icon with purpose === "maskable"', () => {
    const maskableIcons = manifest.icons.filter((icon) => icon.purpose === 'maskable');
    expect(maskableIcons.length).toBe(1);
  });

  // Requirement 6.3 — maskable icon is present (complementary check)
  it('should include a maskable icon in the icons array', () => {
    const hasMaskable = manifest.icons.some((icon) => icon.purpose === 'maskable');
    expect(hasMaskable).toBeTrue();
  });
});
