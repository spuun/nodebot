var server = {
	init: function() {
		this.log('Server module initializing');
		this.on('001', function(from, nick, message) {
			this.bot.connection.nick = nick;
		}.bind(this));
		this.on('004', function(from, server, usermodes, chanmodes, chanmodesWithParams) {
			this.bot.connection.server = server;
		}.bind(this));
		this.on('NICK', function(from, newNick) {
			if (from.indexOf('!') > 0) {
				from = from.substring(0,from.indexOf('!'));
			}
			if (from == this.bot.connection.nick) {
				this.log('Changed nick to ' + newNick);
				this.bot.connection.nick = newNick;
			}
		}.bind(this));

		this.log('Server module iniitalized');
	},
	unload: function() {
		this.log('Server module unloaded'); 
	}
};

module.exports = server;
