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
			sources: ['.']
		},
		css: {
			fileExtensions: ['css'],
			sources: ['.']
		},
		html: {
			fileExtensions: ['html'],
			sources: ['.']
		}
	};

/**
 * Resolve ID for 'filepath'
 * @param {String} filepath
 * @param {Object} options
 * @returns {String}
 */
exports.identify = function (filepath, options) {
	if (!existsSync(filepath)) return '';

	options = fixOptions(options);

	var sources = clone(options.sources)
		, id = ''
		, parts = filepath.split(path.sep)
		, source, pkg, json, main;

	// Handle node_modules separately
	if (~parts.indexOf('node_modules')) {
		// Trim to package root
		pkg = parts.splice(0, parts.lastIndexOf('node_modules') + 2).join('/');
		// Parse package.json for 'main' field to verify
		if (existsSync(json = path.resolve(pkg, 'package.json'))
			&& (main = JSON.parse(fs.readFileSync(json)).main)) {
				// Handle files with missing extension
				if (path.extname(main) != '.js') main += '.js';
				// Set id if filepath is main
				if (path.resolve(pkg, main) == filepath) id = path.basename(pkg);
		}
		if (!id) {
			// Try index file
			if (path.resolve(pkg, 'index.js') == filepath) {
				id = path.basename(pkg);
			// Full path from package root
			} else {
				id = path.relative(path.join(pkg, '..'), filepath).replace(path.extname(filepath), '');
			}
		}
	} else {
		// Check sources
		for (var i = 0, n = sources.length; i < n; i++) {
			source = sources[i];
			if (~filepath.indexOf(source)) {
				// Resolve id relative to source directory
				id = path.relative(source, filepath).replace(path.extname(filepath), '');
				// Replace path separators
				if (process.platform == 'win32') id = id.replace(path.sep, '/');
				// Handle index files
				if (options.type != 'html' && /index$/.test(id)) {
					// Rename to package
					if (id == 'index') id = path.basename(path.join(filepath, '..'));
				}
				if (id) break;
			}
		}
	}
	return id;
};

/**
 * Resolve the path for 'dependencyID' from 'filepath'
 * @param {String} filepath
 * @param {String} [dependencyID]
 * @param {Object} [options]
 * @returns {String}
 */
exports.resolve = function (filepath, dependencyID, options) {
	if (!existsSync(filepath)) return '';

	options = fixOptions(options);

	var leadingChar = dependencyID.charAt(0)
		, dependencyFilepath;

	// Absolute
	if (leadingChar == '/') {
		dependencyFilepath = checkFile(dependencyID, options);
	// Relative
	} else if (leadingChar == '.') {
		dependencyFilepath = checkFile(path.resolve(path.dirname(filepath), dependencyID), options);
	// Additional source locations, including node_modules
	} else {
		// Handle implicit relative paths for css by checking the current dir first
		if (options.type == 'css') {
			options.sources.unshift(path.dirname(filepath));
			dependencyFilepath = checkSources(dependencyID, options);
		} else {
			dependencyFilepath = !~dependencyID.indexOf('/')
				? checkPackage(filepath, dependencyID)
				: checkSources(dependencyID, options);
		}
	}
	return dependencyFilepath;
};

function fixOptions (options) {
	options = clone(options, {deep:true}) || {};
	options.type = options.type || 'js';
	options.fileExtensions = union(options.fileExtensions || [], DEFAULT[options.type]['fileExtensions']);
	options.sources = union(options.sources || [], DEFAULT[options.type]['sources']);
	options.sources = options.sources.map(function(source) {
		return path.resolve(source);
	});
	return options;
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
			, fp;
		// Loop through fileExtensions and locate file
		for (var i = 0, n = fileExtensions.length; i < n; i++) {
			fp = filepath + '.' + fileExtensions[i];
			if (existsSync(fp)) return fp;
			// Try index file
			fp = path.resolve(filepath, 'index.' + fileExtensions[i]);
			if (existsSync(fp)) return fp;
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
		, fp, testpath;
	// Loop through sources and locate file
	for (var i = 0, n = sources.length; i < n; i++) {
		fp = path.resolve(sources[i], dependencyID);
		if (testpath = checkFile(fp, options)) return testpath;
	}
	return '';
}

/**
 * Check the location of 'pkg' in node_modules directory
 * @param {String} pkg
 * @returns {String}
 */
function checkPackage (filepath, pkg) {
	var node_modules, json, main, fp;
	var packageDir = function(filepath) {
		var dir = path.dirname(filepath)
			, parent, node_modules;
		while (true) {
			node_modules = path.join(dir, 'node_modules');
			if (existsSync(node_modules)) return node_modules;
			parent = path.resolve(dir, '../');
			if (parent === dir) {
				return '';
			}	else {
				dir = parent;
			}
		}
	};

	if (node_modules = packageDir(filepath)) {
		// Parse package.json for 'main' field
		fp = path.resolve(node_modules, pkg);
		if (existsSync(json = path.resolve(fp, 'package.json'))
			&& (main = JSON.parse(fs.readFileSync(json)).main)) {
					fp = path.resolve(fp, main);
					// Handle files with missing extension
					if (path.extname(fp) != '.js') fp += '.js';
					if (existsSync(fp)) return fp;
			// Fallback to index.js
		} else {
			fp = path.resolve(fp, 'index.js');
			if (existsSync(fp)) return fp;
		}
		return '';
	} else {
		return '';
	}
}
