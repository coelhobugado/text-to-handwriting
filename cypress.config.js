const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'tests/**/*.spec.js',
    supportFile: false,
    videosFolder: 'tests/videos',
    screenshotsFolder: 'tests/screenshots',
    video: false
  }
});
