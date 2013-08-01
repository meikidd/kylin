/**
 * Config next proxy address.
 * @param next {Object}
 * @param opts {Object}
 */
module.exports = function (next, opts) {
	if(next && next.ip && next.port) {
		opts.hostname = next.ip;
		opts.port = next.port;
	}
	// TODO 如何判断循环代理
	return opts;
};