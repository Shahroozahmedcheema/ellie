/**
 * Reanimated ships with expo-router, and its worklets only exist if the Babel
 * plugin runs. Metro will fall back to sensible defaults without this file, but
 * that fallback is not something to rely on for a release build — a worklet
 * that was never compiled fails natively rather than as a JS error, which
 * closes the app instead of showing a red screen.
 *
 * `babel-preset-expo` pulls in the worklets plugin for SDK 57, so declaring the
 * preset explicitly is all that is needed.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { reanimated: true }]],
  };
};
