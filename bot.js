var irc = require('./irc.js');

var bot = new irc.client(
			'irc.freenode.net:6667', 
			'spuunbot', 
			{
				userName: 'spuunbot' 
				realName: 'spuuns nodejs bot'
				debug: true,
				channels: ['#example'],
				admins: [
					/@kebabfredag.nu$/,
					/root@example.org$/]
			});
bot.loadModule('server');
bot.loadModule('channel');
bot.loadModule('admin');
bot.connect();
