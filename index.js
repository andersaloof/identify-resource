var path = require('path');

module.exports = function (item, fn) {
	// Validate
	if (item.filepath == null
		|| item.basename == null
		|| item.type == null
		|| item.content == null) {
			return fn('invalid object: unable to resolve dependencies');
	}
	return fn(null, resolve(item));
};

function resolve (item) {
	return item;
}