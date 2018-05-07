var mongoose = require('mongoose');
var ResourceSchema = new mongoose.Schema({
	username: {
		type: String,
		trim: true
	},
	url: {
		type: String,
		required: true,
		trim: true
	},
	title: {
		type: String,
		required: true,
		trim: true
	},
	tags: {
		type: String,
		required: true,
		trim: true
	},
	description: {
		type: String,
		required: true,
		trim: true
	},
	image: {
		type: String,
		required: true,
		trim: true
	},
	timestamp: {
		type: Date,
		default: Date.now
	},
	all_comments: [{
			username: String,
			content: String,
			timestamp: {
				type: Date,
				default: Date.now
			}
		}],
	recommended_by: [String],
	recommended_by_count: {
		type: Number,
		default: 0
	}
});


var Resource = mongoose.model('Resource', ResourceSchema);
module.exports = Resource;
