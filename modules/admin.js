var admin = {
	init: function() {
		this.log('Initializing admin module');
		this.on('BOTMSG', function(from, message) {
			if (this.isAdmin(from)) {
				var parts = message.split(' ');
				var command = parts[0];
				if (command == 'raw') {
					this.send(parts.slice(1).join(' '));
				} else if (command == 'load') {
					this.bot.loadModule(parts[1]);
				}
			}
		});
	},
	isAdmin: function(userinfo) {
		for(var i=0;i<this.bot.config.admins.length;++i) {
			if (this.bot.config.admins[i].test(userinfo)) {
				return true;
			}
		}
		return false;
	}
};

module.exports = admin;
