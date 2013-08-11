var http = require('http'),
	https = require('https'),
	net = require('net'),
	url = require('url'),
	fs = require('fs');

/**
 * Create a HTTP proxy.
 * @param config {Object}
 */
module.exports = function (config) {
	config = config || {};

	var originUrl = '';

	var readLocalFile = function(filepath, response) {

		fs.exists(filepath, function (exists) {
			if(exists) {
				var content = fs.createReadStream(filepath);
				content.pipe(response);
			}else {// 文件不存在
				response.writeHead('404', {'Content-Type':'text/plain'});
				response.end('kylin: file <' + filepath + '> not found!');
			}
		});
	};

	var proxy = http.createServer(function (request, response) {

		// 不经过重定向和二级代理，直接转发请求
		var directRequest = function(request, response) {

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
		};

		if(config.rules && config.rules.length) {
			var rules = config.rules;

			// 判断url是否命中用户设置的重定向规则
			var match = function(rules, url) {
				var rule = false;
				for(var i = 0; i < rules.length; i++) {
					var reg = new RegExp(rules[i].match);
					if(reg.test(url)) {
						rule = rules[i];
					}
				}
				return rule;
			};

			var rule = match(rules, request.url);

			if(rule) {
				// 如果命中重定向规则
				var action = rule.action;
				var isUrl = function(s) {
					return /http:\/\/[a-zA-Z0-9]+\./.test(s);
				};
				if(isUrl(action)) {
					// 如果是网络地址
					request.url = action;
				}else {
					// 如果是本地文件
					readLocalFile(action, response);
				}
			}else {
				// 如果没有命中，则直接请求原网址
				directRequest(request, response);
			}

		// }else if(config.subproxy) {
		}else {
			directRequest(request, response);
		}

	});

	// 处理https请求
	proxy.on('connect', function (request, socket) {

		originUrl = request.url;

		var parts = request.url.split(':');

		var opts = {
				port: parts[1] || 443,
				host: parts[0]
			};

		opts.port = 443;
		opts.host = 'localhost';

		// console.log("===================Request for " + opts.host + ":" + opts.port + " received.");
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

	proxy.listen(config.port || 1080);


	httpsServer = https.createServer({
		key: fs.readFileSync('certificates/tianma.key'),
		cert: fs.readFileSync('certificates/tianma.cer')
	}, function(request, response) {
		console.log('origin url:'+originUrl);
		console.log('request:'+request.path);

		var parts = originUrl.split(':');

		var options = {
			hostname: parts[0],
			port: parts[1] || 443,
			path: '/',
			method: 'GET'
		};

		var req = https.request(options, function(res) {
			response.writeHead(res.statusCode, res.headers);
			res.pipe(response);
		});

		req.on('error', function (err) {
			response.writeHead(500, { 'content-type': 'text/plain' });
			response.end(err.message);
		});

		request.pipe(req);

	});

	httpsServer.listen(443);
};