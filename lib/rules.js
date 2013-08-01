var fs = require('fs');

module.exports = function (rules, request, response) {
	for(var i in rules) {
		if(new RegExp(rules[i].match).test(request.url)) {
			var action = rules[i].action;
			if(action.indexOf('http://') === 0) {
			// 如果是网络地址http://或者https://
				request.url = action;
			}else {
			// 如果是本地文件
				var content = fs.createReadStream(action);
				content.pipe(response);
			}
		}
	}

	return request;
};