const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const config = require('../../config/config');
const herbRoute = require('./herb.route');
const batchRoute = require('./batch.route');
const collectionRoute = require('./collection.route');
const formulationRoute = require('./formulation.route');
const processingRoute = require('./processing.route');
const qualityTestRoute = require('./qualityTest.route');
const consumerRoute = require('./consumer.route');
const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/herbs',
    route: herbRoute,
  },
  {
    path: '/batches',
    route: batchRoute,
  },
  {
    path: '/collections',
    route: collectionRoute,
  },
  {
    path: '/formulations',
    route: formulationRoute,
  },
  {
    path: '/processing',
    route: processingRoute,
  },
  {
    path: '/quality-tests',
    route: qualityTestRoute,
  },
  {
    path: '/consumer',
    route: consumerRoute,
  }
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
