var net = require('net');
var fs = require('fs');
var events = require('events');


var irc = {
	client: function(server, nick, config) {
		var parts = server.split(':');
		this.emitter = new events.EventEmitter();
		this.on = this.emitter.on.bind(this.emitter);
		this.off = this.emitter.removeListener.bind(this.emitter);
		this.emit = this.emitter.emit.bind(this.emitter);
		this.config = {
			server: {host: parts[0], port: parts[1]||6667},
			nick: nick,
			admins: config.admins || [],
			realName: config.realName || 'Node Bot',
			userName: config.userName || nick
		};
		this.connection = {
			connected: false,
			nick: nick,
			server: ''
		};
		this.modules = {};
		this.buffer = '';

		this.on('PRIVMSG', function(from, target, message) {
			if (target == this.connection.nick) {
				this.emit('BOTMSG', from, message);
			} else if (target[0] == '#') {
				this.emit('CHANMSG', from, target, message);
			}
		}.bind(this));
	}
};
irc.client.prototype.log = function(str) {
	console.log(str);
};
irc.client.prototype.warn = function(str) {
	console.log('WARN: ' + str);
};
irc.client.prototype.debug = function(str) {
	console.log('DEBUG: ' + str);
};
irc.client.prototype.error = function(str) {
	console.log('ERROR: ' + str);
}
irc.client.prototype.unloadModule = function(modName) {
	if (!this.modules[modName]) {
		this.warn('Unable to unload module ' + modName + '.');
		return;
	}
	this.log('Unloading module ' + modName + '.');
	if (typeof this.modules[modName].unload == 'function') {
		this.modules[modName].unload();
	}
	delete this.modules[modName];
	delete require.cache[require.resolve('./modules/' + modName)];
};
irc.client.prototype.loadModule = function(modName) {
	fs.exists('./modules/' + modName + '.js', function(exists) {
		if (!exists) {
			this.warn('Module ' + modName + ' not found');
			return;
		}
		if (this.modules[modName]) {
			this.log('Module ' + modName + ' already loaded. Unloading.');
			this.unloadModule(modName);
		}
		this.log('Loading module ' + modName);
		var module = (this.modules[modName] = require('./modules/' + modName));
		var callbacks = [];
		module.log = this.log.bind(this);
		module.warn = this.warn.bind(this);
		module.debug = this.debug.bind(this);
		module.error = this.debug.bind(this);
		module.bot = this;
		module.on = function(evt, cb) {
			callbacks.push({event: evt, callback: (cb = cb.bind(module))});
			this.on(evt, cb);
		}.bind(this);
		module.send = this.send.bind(this);
		var unload = typeof module.unload == 'function' ? module.unload.bind(module) : function() {
			this.log('Module ' + module + ' unloaded.');
		}.bind(this);
		module.unload = function() {
			for (var i=0;i<callbacks.length;++i) {
				this.off(callbacks[i].event, callbacks[i].callback);
			}
			unload();
		};
		if (typeof module.init == 'function') {
			module.init();
		}
	}.bind(this));
};
irc.client.prototype.connect = function() {
	this.log('Connecting to ' + this.config.server.host + ':' + this.config.server.port);
	this.net = net.connect(this.config.server, this.onConnect.bind(this));
};
irc.client.prototype.onDisconnect = function() {
	this.log('Disconnected');
	this.connection.connected = false;
	this.connection.nick = '';
	this.connection.server = '';
};
irc.client.prototype.onConnect = function() {
	this.log('Connected to ' + this.config.server.host + ' established');
	this.connection.connected = true;
	this.net.on('error', this.onError.bind(this));
	this.net.on('data', this.onData.bind(this));
	this.net.on('end', this.onDisconnect.bind(this));

	this.send('NICK ' + this.config.nick);
	this.send('USER ' + this.config.userName + ' 8 * :' + this.config.realName);
};
irc.client.prototype.onData = function(data) {
	this.buffer += data.toString();
	while (this.buffer.indexOf('\n') >= 0) {
		data = this.buffer.substring(0,this.buffer.indexOf('\n')-1);
		this.buffer = this.buffer.substring(data.length+2);
		this.debug('READ: ' + data);
		var parts = data.split(' ');
		if (parts[0] == 'PING') {
			this.send('PONG ' + parts[1]);		
			continue;
		}
		if (parts[0][0] == ':') {
			parts[0] = parts[0].substring(1);
		}
		var args = [parts[1], parts[0]];
		for (var i=2;i<parts.length;++i) {
			if (parts[i][0] == ':') {
				args.push(parts.slice(i).join(' ').substring(1));
				break;
			}
			args.push(parts[i]);
		}
		this.emit.apply(this.emit, args);
		this.emit('data', data);
	}
};
irc.client.prototype.onError = function(err) {
	this.error(err);
};
irc.client.prototype.send = function(data) {
	if (!this.connection.connected) {
		this.warn('Couldn\'t send data. Not connected.');
		return;
	}
	this.debug('SEND: ' + data);
	this.net.write(data + '\n');
}
module.exports = irc;
