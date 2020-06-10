module.exports = function (api) {
  api.cache(true);

  const presets = [
    ['@babel/env', {
      "targets": {
        "chrome": "84",
      },
      corejs: '3',
      useBuiltIns: 'usage'
    }]
  ];
  const plugins = [
    '@babel/plugin-transform-runtime',
    'transform-inline-environment-variables'
  ];

  return {
    presets,
    plugins
  };
}
