#!/usr/bin/env node
"use strict"

var fs       = require('fs')
var http     = require('http')
var connect  = require('connect')
var express  = require('express')
var socketio = require('socket.io')
var program  = require('commander')
var DMX      = require('./dmx')
var pliabAnim = require('./pliabAnim')
var A        = DMX.Animation

program
	.version("0.0.1")
	.option('-c, --config <file>', 'Read config from file [/etc/dmx-web.json]', '/etc/dmx-web.json')
	.parse(process.argv)


var	config = JSON.parse(fs.readFileSync(program.config, 'utf8'))

function DMXWeb() {
	var app    = express()
	var server = http.createServer(app)
	var io     = socketio.listen(server)

	var dmx = new DMX()

	for(var universe in config.universes) {
		dmx.addUniverse(
			universe,
			config.universes[universe].output.driver,
			config.universes[universe].output.device,
			config.universes[universe].output.options
		)
	}

	var listen_port = config.server.listen_port || 8080
	var listen_host = config.server.listen_host || '::'

	server.listen(listen_port, listen_host, null, function() {
		if(config.server.uid && config.server.gid) {
			try {
				process.setuid(config.server.uid)
				process.setgid(config.server.gid)
			} catch (err) {
				console.log(err)
				process.exit(1)
			}
		}
	})
	io.set('log level', 1)

	app.configure(function() {
		app.use(connect.json())
	})

	app.get('/', function(req, res) {
		res.sendfile(__dirname + '/index.html')
	})

	app.get('/config', function(req, res) {
		var response = {"devices": DMX.devices, "universes": {}}
		Object.keys(config.universes).forEach(function(key) {
			response.universes[key] = config.universes[key].devices
		})

		res.json(response)
	})

	app.get('/state/:universe', function(req, res) {
		if(!(req.params.universe in dmx.universes)) {
			res.status(404).json({"error": "universe not found"})
			return
		}

		res.json({"state": dmx.universeToObject(req.params.universe)})
	})
	
	app.post('/state/:universe', function(req, res) {
		if(!(req.params.universe in dmx.universes)) {
			res.status(404).json({"error": "universe not found"})
			return
		}

		dmx.update(req.params.universe, req.body)
		res.json({"state": dmx.universeToObject(req.params.universe)})
	})

	app.post('/animation/:universe/led/:led', function(req, res) {
		let ledBar = req.params.led;
		let percentBar = req.body.percent;
		let color = req.body.color;
		const LEDBAR_MAP_START = {
			1: 0,
			2: 150
		};
		const LEDCHANNEL_MAP = {
			150: 300
		}

		try {
			var universe = dmx.universes[req.params.universe]
			var old = dmx.universeToObject(req.params.universe)
			let stepTo;
			var animation = new A();
			let ledChannel; // 10 led = 3 x 10
			let STARTING_AT = LEDBAR_MAP_START[ledBar];

			universe.updateAll(0); // Permet de reseter les led... @todo utiliser update() au lieu de add()
			ledChannel = percentBar * 150 / 100;		

			(function generateLed1(n) {
				console.log('LED #1', n, 'de ', ledChannel);						
				let ledColor = pliabAnim.convertLedColorToDMX(n, color);

				animation.add(ledColor);
				animation.run(universe);
				if (n < ledChannel - 3) {
					setTimeout(function() {
						generateLed1(n+3);
					}, 0);
				}
			}(0));
			

			let ledChannel2 = (100-percentBar/2) * 300 / 100;		

			(function generateLed2(n) {
				console.log('LED #2', n, 'de ', ledChannel2);	
				let ledColor = pliabAnim.convertLedColorToDMX(n, color);

				animation.add(ledColor);
				animation.run(universe);
				if (n > ledChannel2) {
					setTimeout(function() {
						generateLed2(n-3);
					}, 0);
				}
			}(300));

			res.json({"success": true});
		} catch(e) {
			console.log(e)
			res.json({"error": String(e)})
		}
	
	});

	app.post('/animation/:universe', function(req, res) {
		try {
			var universe = dmx.universes[req.params.universe]

			// preserve old states
			var old = dmx.universeToObject(req.params.universe)

			var animation = new A()			
			for(var step in req.body) {	
				let stepTo = req.body[step].to;
								
				if (req.body[step].deviceId == 1) {
					stepTo = pliabAnim.convertToDMX(req.body[step], true);
				}
				else if (stepTo.hasOwnProperty('color') || stepTo.hasOwnProperty('opacity')) {
					stepTo = pliabAnim.convertToDMX(req.body[step]);
				}
				
				console.log('stepTo', stepTo);
				animation.add(
					stepTo,
					req.body[step].duration || 0,
					req.body[step].options  || {}
				)
			}
			animation.add(old, 0)
			animation.run(universe)
			res.json({"success": true})
		} catch(e) {
			console.log(e)
			res.json({"error": String(e)})
		}
	})

	io.sockets.on('connection', function(socket) {
		socket.emit('init', {'devices': DMX.devices, 'setup': config})

		socket.on('request_refresh', function() {
			for(var universe in config.universes) {
				socket.emit('update', universe, dmx.universeToObject(universe))
			}
		})

		socket.on('update', function(universe, update) {
			dmx.update(universe, update)
		})

		dmx.on('update', function(universe, update) {
			socket.emit('update', universe, update)
		})
	})
}

DMXWeb()
