import { defineConfig } from 'wxt';

// https://wxt.dev/api/config.html
export default defineConfig({
  // Build into a visible folder (default is the hidden .output) so the
  // unpacked extension is easy to find in the Chrome "Load unpacked" dialog.
  outDir: 'dist',
  manifest: {
    name: 'Polar for Canvas',
    description:
      "Re-skins Canvas LMS with Polar's monochrome design system — Night/Ash/Mist/Snow with an Ether accent and Neue Montreal / Geist Mono typography.",
    // Toggle state is stored with chrome.storage.sync
    permissions: ['storage'],
    // Allow the user to add their school's Canvas host from the popup.
    // The content script below is statically registered for the common
    // Instructure-hosted domains; custom hosts are matched at runtime.
    host_permissions: ['*://*.instructure.com/*', '*://*.canvas.net/*'],
    optional_host_permissions: ['*://*/*'],
    web_accessible_resources: [
      {
        resources: ['polar.css', 'fonts/*'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
