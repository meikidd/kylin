var http = require('http'),
	net = require('net'),
	fs = require('fs'),
	url = require('url');

/**
 * Create a HTTP proxy.
 * @param config {Object}
 */
module.exports = function (config) {
	config = config || {};

	var server = http.createServer(function (request, response) {

			if(config.rules) {
				for(var i in config.rules) {
					if(new RegExp(config.rules[i].match).test(request.url)) {
						if(config.rules[i].action.indexOf('http://') === 0) {
						// 如果是网络地址http://或者https://
							request.url = config.rules[i].action;
						}else {
						// 如果是本地文件
							var content = fs.readFileSync(config.rules[i].action, 'utf-8')
							// console.log(content);
							response.writeHead(200, {"Content-Type": "text/plain"});
						    response.write(content);
						    response.end();
							return;
						}
					}
				}
			}



			var meta = url.parse(request.url);

			var opts = {
					hostname: meta.hostname,
					port: meta.port || 80,
					path: meta.path,
					method: request.method,
					headers: request.headers
				};

			var req = http.request(opts, function (res) {
					response.writeHead(res.statusCode, res.headers);
					res.pipe(response);
				});

			req.on('error', function (err) {
				response.writeHead(500, { 'content-type': 'text/plain' });
				response.end(err.message);
			});

			request.pipe(req);
		});

	server.on('connect', function (request, socket) {
		var parts = request.url.split(':');

		var opts = {
				port: parts[1] || 443,
				host: parts[0]
			};

		console.log("===================Request for " + opts.host + ":" + opts.port + " received.");
		var client = net.connect(opts, function () {
				socket.pipe(client);

				client.pipe(socket);

				socket.write('HTTP/'
					+ request.httpVersion
					+ ' 200 Connection established\r\n\r\n', 'utf8');
			});

		client.on('error', function (err) {
			socket.write('HTTP/'
				+ request.httpVersion
				+ ' 500 Internal Server Error\r\n\r\n', 'utf8');

			socket.end();
		});
	});

	server.listen(config.port || 1080);
};