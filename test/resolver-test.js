var resolver = require('..')
	, path = require('path')
	, fs = require('fs')
	, should = require('should');

describe('dependency-resolver', function() {
	beforeEach(function() {
		this.item = {
			filepath:'hey/ho',
			basename:'ho',
			content:'hey ho',
			type:'js'
		}
	});
	it('should accept an object with "filepath", "content", "type", and "basename" properties', function(done) {
		resolver(this.item, function(err, item) {
			should.not.exist(err);
			should.exist(item);
			done();
		});
	});
	it('should return an error when passed an object that doesn\'t include the required properties', function(done) {
		resolver({hey:'ho'}, function(err, item) {
			should.exist(err);
			should.not.exist(item);
			done();
		});
	});
	it('should decorate the passed object with an "id"', function(done) {
		resolver(this.item, function(err, item) {
			item.should.have.property('id');
			done();
		});
	});
	it('should decorate the passed object with a "dependencies" array', function(done) {
		resolver(this.item, function(err, item) {
			item.should.have.property('dependencies');
			done();
		});
	});
	it('should generate dependency objects that include both an "id" and "source" properties');
	it('should resolve absolute dependency references');
	it('should resolve relative dependency references');
	it('should resolve node_module dependency references by parsing the "main" field of a "package.json" file');
});