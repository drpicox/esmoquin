module.exports.Esmoquin = Esmoquin;

/*
	req.url                   # original object
	req.path(value)           # path of the url (ex /blabla/bla)
	req.host(value)           # host of the url (ex localhost:8080)
	req.search(search, value) # query params in th url
	req.params                # params found in /:url by when

	options:
		.host
		.path
		.protocol

*/

var minimatcher = require('minimatch');
var request = require('request');
var url = require('url');
var _ = require('lodash');

function Esmoquin() {
	this.routes = [];
	this.middleware = middleware.bind(this);
}

Esmoquin.data = data;                     // 'text', {stop: false, encoding: 'iso9382'}
Esmoquin.local = local;                   // {path: '<%= "/new/"+params.common %>'} , ex: when('/old/:common*', ...)
Esmoquin.proxy = proxy;                   // 'host:port', {protocol:'https:'}
Esmoquin.prototype.always = always;       // action
Esmoquin.prototype.minimatch = minimatch; // '**/*.js', action, { debug: true }
Esmoquin.prototype.route = route;         // matcher(req), action(req,res,next): bool
Esmoquin.prototype.when = when;           // '/api/users/:userId', action, {method: 'get', caseInsensitiveMatch: true}
['get','post','put','delete','patch'].forEach(function(method) {
	Esmoquin.prototype.get = whenMethod(method);
});

function Route(args) {
	this.match = args.match || function(req) { return false; };
	this.action = args.action || function(req,res,next) { return false; }; // true to stop evaluations
}

function always(action) {
	this.route(function(){return true;}, action);
}

function data(data, opts) {
	var stop = opts && opts.stop;
	if (stop !== false) {
		stop = true;
	}

	return dataAction;

	function dataAction(req, res, next) {
		res.end(data, opts && opts.encoding);
		return stop;
	}
}

function local(opts) {
	return localAction;

	function localAction(req, res, next) {
		options(opts, req);
		next();
		return true;
	}
}

function minimatch(pattern, action, opts) {
	this.route(minimatchMatcher(pattern, opts), action);
}

function minimatchMatcher(pattern, opts) {
	return minimatchMatch;

	function minimatchMatch(req) {
		var path = req.path();
		var matches = minimatcher(path, pattern, opts);
		return matches;
	}
}

function middleware(req,res,next) {

	// if it is connect: options: middleware: (connect, options, middlewares)
	if (typeof next !== 'function') {
		var middlewares = next;
		middlewares.unshift(middleware.bind(this));
		return middlewares;
	}

	// keep track of original url to restore it
	var originals = {
		url: req.url,
		host: req.host,
		search: req.search,
		path: req.path,
		params: req.params,
		protocol: req.protocol,
	};

	// never compress so we can manipulate
	req.headers["accept-encoding"] = 'identity'

	// easy tools for req
	req.host = reqHost;
	req.search = reqSearch;
	req.path = reqPath;
	req.protocol = reqProtocol;

	// check which rules matches until an actions makes stop
	var some = this.routes.some(function(route) {
		if (route.match(req)) {
			return route.action(req, res, next);
		} else {
			return false;
		}
	});

	// if nothing done, go next middleware
	if (!some) {
		req.url = originals.url;
		req.host = originals.host;
		req.search = originals.search;
		req.path = originals.path;
		req.params = originals.params;
		req.protocol = originals.protocol;
		return next();
	}
}

function options(opts, req, defaults) {
	if (!opts && !defaults) { return; }

	if (opts && _.isString(opts.host)) {
		var host = opts.host;
		host = _.template(host)(req);
		req.host(host);
	} else if (defaults && _.isString(defaults.host)) {
		req.host(defaults.host);
	}

	if (opts && _.isString(opts.path)) {
		var path = opts.path;
		path = _.template(path)(req);
		req.path(path);
	} else if (defaults && _.isString(defaults.path)) {
		req.path(defaults.path);
	}

	if (opts && _.isString(opts.protocol)) {
		var protocol = opts.protocol;
		protocol = _.template(protocol)(req);
		req.protocol(protocol);
	} else if (defaults && _.isString(defaults.protocol)) {
		req.protocol(defaults.protocol);
	}

}

function proxy(opts) {
	return proxyAction;

	function proxyAction(req, res, next) {
		options(opts, req, {protocol: 'http'});
		req.headers['host'] = req.host();
		var proxy = request({url:req.url, headers:req.headers, method: req.method});
		req.pipe(proxy).pipe(res);
		return true;
	}
}

function reqHost(newValue) {
	var urlObj = url.parse(this.url);
	var oldValue = urlObj.host;

	if (arguments.length > 0) {
		urlObj.host = newValue;
		this.url = url.format(urlObj);
	}

	return oldValue;
}

function reqPath(newValue) {
	var urlObj = url.parse(this.url);
	var oldValue = urlObj.pathname;

	if (arguments.length > 0) {
		urlObj.pathname = newValue;
		this.url = url.format(urlObj);
	}

	return oldValue;
}

function reqProtocol(newValue) {
	var urlObj = url.parse(this.url);
	var oldValue = urlObj.protocol;

	if (arguments.length > 0) {
		urlObj.protocol = newValue;
		this.url = url.format(urlObj);
	}

	return oldValue;
}
function reqSearch(search, newValue) {
	var urlObj = url.parse(this.url, true);
	var oldValue = urlObj[search];

	if (arguments.length > 1) {
		delete urlObj.search;
		urlObj.query[search] = newValue;
		this.url = url.format(urlObj);
	}

	return oldValue;
}

function route(match, action) {
	this.routes.push({match:match, action:action});
}

function whenMethod(method) {
	return function(path, action, opts) {
		opts = opts || {};
		opts.method = method;
		when.call(this, path, action, opts);
	}
}

function when(path, action, opts) {
	this.route(whenMatcher(path, opts), action);
}

/* Inspired by pathRexp in visionmedia/express/lib/utils.js. */
function whenMatcher(path, opts) {
	var insensitive = opts && opts.caseInsensitiveMatch;
	var originalPath = path;
	var regexp = path;
	var keys = [];

	path = path
		.replace(/([().])/g, '\\$1')
		.replace(/(\/)?:(\w+)([\?\*])?/g, function(_, slash, key, option) {
			var optional = option === '?' ? option : null;
			var star = option === '*' ? option : null;
			keys.push({ name: key, optional: !!optional });
			slash = slash || '';
			return ''
				+ (optional ? '' : slash)
				+ '(?:'
				+ (optional ? slash : '')
				+ (star && '(.+?)' || '([^/]+)')
				+ (optional || '')
				+ ')'
				+ (optional || '');
		})
		.replace(/([\/$\*])/g, '\\$1');

	regexp = new RegExp('^' + path + '$', insensitive ? 'i' : '');

	return whenMatch;

	function whenMatch(req) {
		var on = req.path();
		var m = regexp.exec(on);

		if (!m) {
			return false;
		}
		if (opts && opts.method && req.method.toLowerCase() !== opts.method.toLowerCase()) {
			return false;
		}

		req.params = {};
		for (var i = 1, len = m.length; i < len; ++i) {
			var key = keys[i - 1];

			var val = m[i];

			if (key && val) {
				req.params[key.name] = val;
			}
		}

		return true;
	}
}
