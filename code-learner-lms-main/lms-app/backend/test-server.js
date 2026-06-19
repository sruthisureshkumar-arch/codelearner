const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create({ binary: { version: '6.0.4' } });
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri + 'code-learner-lms';
  process.env.JWT_SECRET = 'test_secret';
  process.env.JWT_EXPIRES_IN = '7d';
  process.env.PORT = 5050;

  require('./src/server.js');

  setTimeout(() => console.log('READY'), 2000);
})();
