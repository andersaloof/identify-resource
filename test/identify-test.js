var identify = require('..')
	, path = require('path')
	, fs = require('fs')
	, should = require('should');

describe('identify-resource', function() {
	before(function() {
		process.chdir('./test/fixtures');
	});
	describe('indentifying dependency filepath', function() {
		it('should not resolve a file if the reference file doesn\'t exist', function() {
			identify(path.resolve('blah.js'), '').should.not.be.ok;
		});
		it('should resolve an absolute path', function() {
			identify('', path.resolve('foo.js')).should.eql(path.resolve('foo.js'));
		});
		it('should resolve a relative path to a js file in the same directory', function() {
			identify(path.resolve('foo.js'), './baz').should.eql(path.resolve('baz.js'));
		});
		it('should resolve a relative path to a js file in a child directory', function() {
			identify(path.resolve('foo.js'), './nested/foo').should.eql(path.resolve('nested/foo.js'));
		});
		it('should resolve a relative path to a js file in a parent directory', function() {
			identify(path.resolve('nested/foo.js'), '../baz').should.eql(path.resolve('baz.js'));
		});
		it('should not resolve a js file with an unkown extension', function() {
			identify(path.resolve('foo.js'), './bar.blah').should.not.be.ok;
		});
		it('should resolve a js file with an unkown extension when optionally specified', function() {
			identify(path.resolve('foo.js'), './bar', {fileExtensions: ['coffee']}).should.eql(path.resolve('bar.coffee'));
		});
		it('should resolve a js node_module path containing a package.json file and a "main" field', function() {
			identify(path.resolve('baz.js'), 'foo').should.eql(path.resolve('node_modules/foo/lib/foo.js'));
		});
		it('should resolve a js node_module path from a deeply nested location', function() {
			identify(path.resolve('src/package/foo.js'), 'foo').should.eql(path.resolve('node_modules/foo/lib/foo.js'));
		});
		it('should not resolve a sub-module of a js node_module path from a deeply nested location', function() {
			identify(path.resolve('src/package/foo.js'), 'bat').should.eql('');
		});
		it('should resolve a js node_module path with no package.json file', function() {
			identify(path.resolve('baz.js'), 'bar').should.eql(path.resolve('node_modules/bar/index.js'));
		});
		it('should resolve a js file in a separate source directory when optionally specified', function() {
			identify('', 'package/foo', {sources: ['src']}).should.eql(path.resolve('src/package/foo.js'));
		});
		it('should resolve a case sensitive js file', function() {
			fs.existsSync(identify(path.resolve('foo.js'), './casesensitive')).should.be.ok;
		});
		it('should resolve a css file in the same source directory', function() {
			identify(path.resolve('bar.css'), 'foo', {type: 'css'}).should.eql(path.resolve('foo.css'));
		});
		it('should resolve a css file in a separate source directory when optionally specified', function() {
			identify('', 'package/foo', {type: 'css', sources: ['src']}).should.eql(path.resolve('src/package/foo.css'));
		});
	});

	describe('indentifying filepath ID', function() {
		it('should resolve an ID for a filepath in the default source directory', function() {
			identify(path.resolve('foo.js'), {sources:['.']}).should.eql('foo');
		});
		it('should resolve an ID for a filepath nested in the default source directory', function() {
			identify(path.resolve('nested/bar.js'), {sources:['.']}).should.eql('nested/bar');
		});
		it('should resolve an ID for a filepath in a specified source directory', function() {
			identify(path.resolve('src/bat.js'), {sources:['src']}).should.eql('bat');
		});
		it('should resolve an ID for a filepath nested in a specified source directory', function() {
			identify(path.resolve('src/package/foo.js'), {sources:['src']}).should.eql('package/foo');
		});
		it('should resolve an ID for an index filepath in a specified root source directory', function() {
			identify(path.resolve('src/index.js'), {sources:['src']}).should.eql('src');
		});
		it('should resolve an ID for a node_modules index file', function() {
			identify(path.resolve('node_modules/bar/index.js'), {}).should.eql('bar');
		});
		it('should resolve an ID for a node_modules filepath listed in package.json', function() {
			identify(path.resolve('node_modules/foo/lib/foo.js'), {}).should.eql('foo');
		});
	});
});