before(() => {
  collectionName = externalConfig.collectionName;
  appKey = externalConfig.appKey;
  appSecret = externalConfig.appSecret;

  Kinvey.init({
    appKey: appKey,
    appSecret: appSecret
  });
})