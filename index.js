var path = require('path')
	, fs = require('fs')
	, lodash = require('lodash')
	, union = lodash.union
	, clone = lodash.clone
	, isObject = lodash.isObject
	, existsSync = fs.existsSync || path.existsSync
	, DEFAULT = {
		js: {
			fileExtensions: ['js'],
			sources: ['node_modules', '.']
		},
		css: {
			fileExtensions: ['css'],
			sources: ['.']
		}
	};

/**
 * Resolve the path for 'dependencyID' from 'filepath'
 * @param {String} filepath
 * @param {String} [dependencyID]
 * @param {Object} [options]
 * @returns {String}
 */
module.exports = function (filepath, dependencyID, options) {
	var findPath = false
		, ID, leadingChar, dependencyFilepath;
	// Find ID from filepath
	if (arguments.length == 1 || (arguments.length == 2 && isObject(dependencyID))) {
		options = dependencyID || {};
	// Find dependencyFilepath from dependencyID
	} else {
		findPath = true;
		leadingChar = dependencyID.charAt(0);
		options = options || {};
	}
	// Set defaults
	filepath = path.resolve(filepath);
	options = clone(options, {deep:true});
	options.type = options.type || 'js';
	options.fileExtensions = union(options.fileExtensions || [], DEFAULT[options.type]['fileExtensions']);
	options.sources = union(options.sources || [], DEFAULT[options.type]['sources']);
	options.sources = options.sources.map(function(source) {
		return path.resolve(source);
	});

	if (findPath) {
		// Force relative css paths
		if (options.type == 'css'
			&& !~dependencyID.indexOf('/')
			&& leadingChar != '.') {
				dependencyID = './' + dependencyID;
				leadingChar = '.';
		}
		// Absolute
		if (leadingChar == '/') {
			dependencyFilepath = checkFile(dependencyID, options);
		// Relative
		} else if (leadingChar == '.') {
			dependencyFilepath = checkFile(path.resolve(path.dirname(filepath), dependencyID), options);
		// Additional source locations, including node_modules
		} else {
			dependencyFilepath = checkSources(dependencyID, options);
		}
		return dependencyFilepath;
	} else {
		ID = resolveFile(filepath, options);
		return ID;
	}
};

function resolveFile (filepath, options) {
	var sources = options.sources
		, id, source, parts, pkg, json, main;
	for (var i = 0, n = sources.length; i < n; i++) {
		source = sources[i];
		if (~filepath.indexOf(source)) {
			// Resolve id relative to source directory
			id = path.relative(source, filepath).replace(path.extname(filepath), '');
			// Replace path separators
			if (process.platform == 'win32') id = id.replace(path.sep, '/');
			// Handle index files
			if (/index$/.test(id)) {
				// Rename to package
				if (id == 'index') id = path.basename(path.join(filepath, '..'));
				// Strip 'index'
				else id = id.slice(0, -6);
			// Handle node_modules
			} else if (~source.indexOf('node_modules')) {
				parts = filepath.split(path.sep);
				// Trim to package root
				pkg = parts.splice(0, parts.indexOf('node_modules') + 2).join('/');
				// Parse package.json for 'main' field
				if (existsSync(json = path.resolve(pkg, 'package.json'))
					&& (main = JSON.parse(fs.readFileSync(json)).main)) {
						// Set id if filepath is main
						if (path.resolve(pkg, main) == filepath) id = path.basename(pkg);
				}
			}
			return id;
		}
	}
	return '';
}

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
		var fileExtensions = options.fileExtensions
			, rpath;
		// Loop through fileExtensions and locate file
		for (var i = 0, n = fileExtensions.length; i < n; i++) {
			rpath = path.resolve(filepath + '.' + fileExtensions[i]);
			if (existsSync(rpath)) return rpath;
			// Try index file
			rpath = path.resolve(filepath + '/index.' + fileExtensions[i]);
			if (existsSync(rpath)) return rpath;
		}
		return '';
	}
}

/**
 * Check the location of 'dependencyID' in 'options.sources'
 * @param {String} dependencyID
 * @param {Object} options
 * @returns {String}
 */
function checkSources (dependencyID, options) {
	var sources = options.sources
		, rpath, testpath;
	// Loop through sources and locate file
	for (var i = 0, n = sources.length; i < n; i++) {
		rpath = path.resolve(sources[i], dependencyID);
		// Handle node_modules
		if (!~dependencyID.indexOf('/')) {
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
