var resolver = require('..')
	, path = require('path')
	, fs = require('fs')
	, should = require('should');

describe('dependency-resolver', function() {
	before(function() {
		process.chdir('./test/fixtures');
	});
	it('should resolve an absolute path', function() {
		resolver('', path.resolve('foo.js')).should.eql(path.resolve('foo.js'));
	});
	it('should resolve a relative path to a file in the same directory', function() {
		resolver(path.resolve('foo.js'), './baz').should.eql(path.resolve('baz.js'));
	});
	it('should resolve a relative path to a file in a child directory', function() {
		resolver(path.resolve('foo.js'), './nested/foo').should.eql(path.resolve('nested/foo.js'));
	});
	it('should resolve a relative path to a file in a parent directory', function() {
		resolver(path.resolve('nested/foo.js'), '../baz').should.eql(path.resolve('baz.js'));
	});
	it('should not resolve a file with an unkown extension', function() {
		resolver(path.resolve('foo.js'), './bar').should.not.be.ok;
	});
	it('should resolve a file with an unkown extension if optionally specified', function() {
		resolver(path.resolve('foo.js'), './bar', {types: ['js', 'coffee', 'css']}).should.eql(path.resolve('bar.coffee'));
	});
	it('should resolve a node_module path containing a package.json file and a "main" field', function() {
		resolver('', 'foo').should.eql(path.resolve('node_modules/foo/foo.js'));
	});
	it('should resolve a node_module path with no package.json file', function() {
		resolver('', 'bar').should.eql(path.resolve('node_modules/bar/index.js'));
	});
});