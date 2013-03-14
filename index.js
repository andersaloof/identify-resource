var path = require('path')
	, fs = require('fs')
	, existsSync = fs.existsSync || path.existsSync
	, DEFAULT = {
		js: {
			extensions: ['js'],
			sources: ['node_modules']
		},
		css: {
			extensions: ['css'],
			sources: []
		}
	};

/**
 * Resolve the path for 'dependency' from 'filepath'
 * @param {String} filepath
 * @param {String} dependency
 * @param {Object} options
 * @returns {String}
 */
module.exports = function (filepath, dependency, options) {
	options = options || {};
	options.type = options.type || 'js';
	options.extensions = union(DEFAULT[options.type]['extensions'], options.extensions || []);
	options.sources = union(DEFAULT[options.type]['sources'], options.sources || []);
	var leadingChar = dependency.charAt(0)
		, depFilepath;

	// Force relative css paths
	if (options.type == 'css'
		&& dependency.indexOf('/') == -1
		&& leadingChar != '.') {
			dependency = './' + dependency;
			leadingChar = '.';
	}

	// Absolute
	if (leadingChar == '/') {
		depFilepath = checkFile(dependency, options);
	// Relative
	} else if (leadingChar == '.') {
		depFilepath = checkFile(path.resolve(path.dirname(filepath), dependency), options);
	// Additional source locations, including node_modules
	} else {
		depFilepath = checkSources(dependency, options);
	}
	return depFilepath;
};

/**
 * Check the location of 'filepath'
 * @param {String} filepath
 * @param {Object} options
 * @returns {String}
 */
function checkFile (filepath, options) {
	// Already have a file extension
	if (path.extname(filepath).length) {
		return existsSync(filepath) ? filepath : '';
	} else {
		var extensions = options.extensions
			, rpath;
		// Loop through extensions and locate file
		for (var i = 0, n = extensions.length; i < n; i++) {
			rpath = path.resolve(filepath + '.' + extensions[i]);
			if (existsSync(rpath)) return rpath;
			// Try index file
			rpath = path.resolve(filepath + '/index.' + extensions[i]);
			if (existsSync(rpath)) return rpath;
		}
		return '';
	}
}

/**
 * Check the location of 'dependency' in 'options.sources'
 * @param {String} dependency
 * @param {Object} options
 * @returns {String}
 */
function checkSources (dependency, options) {
	var sources = options.sources
		, rpath, testpath;
	// Loop through sources and locate file
	for (var i = 0, n = sources.length; i < n; i++) {
		rpath = path.resolve(sources[i], dependency);
		// Handle node_modules
		if (dependency.indexOf('/') == -1) {
			if (testpath = checkPackage(rpath)) return testpath;
		}
		if (testpath = checkFile(rpath, options)) return testpath;
	}
	return '';
}

/**
 * Check the location of 'filepath' in a package directory
 * @param {String} filepath
 * @returns {String}
 */
function checkPackage (filepath) {
	var json, main, rpath;
	if (existsSync(filepath)) {
		// Parse package.json for 'main' field
		if (existsSync(json = path.resolve(filepath, 'package.json'))
			&& (main = JSON.parse(fs.readFileSync(json)).main)) {
				rpath = path.resolve(filepath, main);
				if (existsSync(rpath)) return rpath;
		// Fallback to index.js
		} else {
			rpath = path.resolve(filepath, 'index.js');
			if (existsSync(rpath)) return rpath;
		}
	}
	return '';
}

/**
 * Get union of passed arrays
 * @param {Array} arguments
 * @returns {Array}
 */
function union () {
	return Array.prototype.concat.apply(Array.prototype, arguments).filter(function(el, i, array) {
		return array.indexOf(el) == i;
	});
}