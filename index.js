var path = require('path')
	, fs = require('fs')
	, existsSync = fs.existsSync || path.existsSync
	, DEFAULT_TYPES = ['js', 'css'];

/**
 * @returns {String}
 */
module.exports = function (filepath, dependency, options) {
	options = options || {};
	options.types = options.types || DEFAULT_TYPES;
	options.sources = options.sources || [];
	if (options.sources.indexOf('node_modules') == -1) options.sources.push('node_modules');
	var leadingChar = dependency.charAt(0)
		, depFilepath;

	// Absolute
	if (leadingChar == '/') {
		depFilepath = checkFile(dependency, options.types);
	// Relative
	} else if (leadingChar == '.') {
		depFilepath = checkFile(path.resolve(path.dirname(filepath), dependency), options.types);
	// node_modules package
	} else if (dependency.indexOf('/') == -1) {
		depFilepath = checkPackage(path.resolve('node_modules', dependency));
	}
	return depFilepath;
};

function checkFile (filepath, types) {
	if (path.extname(filepath).length) {
		return existsSync(filepath) ? filepath : '';
	} else {
		var p;
		for (var i = 0, n = types.length; i < n; i++) {
			p = path.resolve(filepath + '.' + types[i]);
			if (existsSync(p)) return p;
			p = path.resolve(filepath + '/index.' + types[i]);
			if (existsSync(p)) return p;
		}
		return '';
	}
}

function checkPackage (filepath) {
	var json, main, p;
	if (existsSync(filepath)) {
		if (existsSync(json = path.resolve(filepath, 'package.json'))
			&& (main = JSON.parse(fs.readFileSync(json)).main)) {
				p = path.resolve(filepath, main);
				if (existsSync(p)) return p;
		} else {
			p = path.resolve(filepath, 'index.js');
			if (existsSync(p)) return p;
		}
	}
}
