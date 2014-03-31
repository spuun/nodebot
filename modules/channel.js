var channel = {
	unload: function() {
		this.log('Channel module unloaded');
	},
	init: function() {
		this.log('Channel module initializing');
		this.log('Channel module initialized');
	}
};

module.exports = channel;
