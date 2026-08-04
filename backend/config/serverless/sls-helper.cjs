// eslint-disable-next-line no-undef
module.exports = {
  regionAbbrev(serverless) {
    const { options } = serverless.variables;
    const { region } = options;
    let abbrev;
    switch (region) {
      case 'us-east-1':
        abbrev = 'UE2';
        break;
      case 'us-east-2':
        abbrev = 'UE1';
        break;
      default:
        throw new Error('REGION IS NOT VALID.');
    }
    return abbrev;
  },
  stageLowerCase(serverless) {
    const { options } = serverless.variables;
    const { stage } = options;
    let upperCase;
    switch (stage) {
      case 'PROD':
        upperCase = 'prod';
        break;
      case 'TEST':
        upperCase = 'test';
        break;
      case 'DESA':
        upperCase = 'desa';
        break;
      default:
        throw new Error('STAGE IS NOT VALID.');
    }
    return upperCase;
  }
};
