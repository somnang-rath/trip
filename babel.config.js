module.exports = function (api) {
  api.cache(true)
  const isTest = process.env.NODE_ENV === "test"
  return {
    presets: [
      ["expo/internal/babel-preset", isTest ? { reanimated: false } : {}],
      // nativewind/babel pulls in react-native-worklets/plugin transitively,
      // which we don't install for tests. Class names render as plain strings
      // in jest, so the transform isn't needed there.
      ...(isTest ? [] : ["nativewind/babel"]),
    ],
    plugins: isTest ? [] : ["react-native-reanimated/plugin"],
  }
}
