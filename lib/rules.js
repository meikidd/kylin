/**
 * Config response rules.
 * @param rules {Object}
 * @param request {Object}
 * @param response {Object}
 */
var fs = require('fs');

module.exports = function (rules, request, response) {

	var isUrl = function(s) {
		return /http:\/\/[a-zA-Z0-9]+\./.test(s);
	};

	rules = rules || [];
	for(var i in rules) {
		if(new RegExp(rules[i].match).test(request.url)) {
			var action = rules[i].action;
			if(isUrl(action)) {
				// 如果是网络地址
				request.url = action;
				// console.log(action);
			}else {
				// 如果是本地文件
				var content = fs.createReadStream(action);
				content.pipe(response);
			}
		}
	}

	return request;
};