const Memcached = require('memcached');
const util = require('util');

const memcached = new Memcached('route-cache:11211');
memcached.get = util.promisify(memcached.get);
memcached.set = util.promisify(memcached.set);

module.exports = memcached;
