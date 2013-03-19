var identify = require('..')
	, path = require('path')
	, fs = require('fs')
	, should = require('should');

describe('identify-resource', function() {
	before(function() {
		process.chdir('./test/fixtures');
	});
	describe('indentifying dependency filepath', function() {
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
			identify(path.resolve('foo.js'), './bar').should.not.be.ok;
		});
		it('should resolve a js file with an unkown extension when optionally specified', function() {
			identify(path.resolve('foo.js'), './bar', {extensions: ['coffee']}).should.eql(path.resolve('bar.coffee'));
		});
		it('should resolve a js node_module path containing a package.json file and a "main" field', function() {
			identify('', 'foo').should.eql(path.resolve('node_modules/foo/foo.js'));
		});
		it('should resolve a js node_module path with no package.json file', function() {
			identify('', 'bar').should.eql(path.resolve('node_modules/bar/index.js'));
		});
		it('should resolve a js file in a separate source directory when optionally specified', function() {
			identify('', 'package/foo', {sources: ['src']}).should.eql(path.resolve('src/package/foo.js'));
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
		it('should resolve an ID for an index filepath in a specified source directory', function() {
			identify(path.resolve('node_modules/bar/index.js'), {sources:['node_modules/bar']}).should.eql('bar');
		});
		it('should resolve an ID for an index filepath in a specified source directory', function() {
			identify(path.resolve('node_modules/bar/index.js'), {sources:['node_modules']}).should.eql('bar');
		});
	});
});