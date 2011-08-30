var util = require('util');
var fs = require('fs');
var vows = require('vows');
var assert = require('assert');
var logger = require('../lib/logger.js').getLogger('webmetrics_test', './test/vows_log4js.json');

var webmetrics = require('../lib/webmetrics.js');

var happy = false;
try {
	var credsJSON = fs.readFileSync('credentials.json', 'utf-8');
	var creds = JSON.parse(credsJSON);
	happy = (creds !== undefined && creds.username !== undefined && creds.api_key !== undefined);
} catch(e) {
	util.puts(e.stack);
}

if (!happy) {
	util.puts('To run vows, you must have a file called "credentials.json" in your working directory.');
	util.puts('That file must contain a JSON object like this { "username" : "BananaHead", "password" : "12345678"}');
	process.exit(1);
}

/**
 * Macro to validate that an array of results was properly composed.
 */
function assertValidResponseCollection(collectionName, equals, length) {
	return function (err, response) {
		assert.equal(null, err);
		assert.notEqual(null, response);
		assert.notEqual(undefined, response[collectionName]);
		assert[(equals ? 'equal' : 'notEqual')](length, response[collectionName].length);
	};
}

function assertValidResponseObject(name, parameter, value) {
	logger.trace('%s', util.inspect(value));
	
	return function (response) {
		logger.trace('%s', util.inspect(response));
		logger.trace('%s', response[name][parameter]);
		logger.trace('%s', value);
		assert.notEqual(null, response);
		assert.notEqual(undefined, response[name]);
		assert.equal(value, response[name][parameter]);
	};
}

var api = {
    call: function (category, command, args) {
        return function () {
			var arguments = [ creds.username, creds.api_key ];
			if (args !== undefined) arguments.push(args);
			arguments.push(this.callback);
			logger.trace('Arguments:\n%s', util.inspect(arguments));
            webmetrics[category][command].apply(this, arguments);
        };
    }
};

vows.describe('Webmetrics API').addBatch({
	
	'General:' : {
		'snapshot.getData' : {
			topic: api.call('snapshot', 'getData'),
			'returns a valid response' : assertValidResponseCollection('service', false, 0)
		}
	},
	
	'Maintenance:' : {
		
		'getServices' : {
	 		topic: api.call('maintenance', 'getServices', {'expanded' : 1}),		
			'returns a valid response' : assertValidResponseCollection('service', false, 0),
		
			'-> getServiceType' : {	
				topic: function(err, getServicesResponse) {
					var parent = this;
					webmetrics.maintenance.getServiceType(creds.username, creds.api_key,
						{'serviceid' : getServicesResponse.service[0].id[0]}, function(err, response) {
						parent.callback(getServicesResponse, response);
					});
				},
							
				'returns a valid response' : function(getServicesResponse, response) {
					assert.notEqual(undefined, getServicesResponse.service);
					assert.notEqual(undefined, getServicesResponse.service[0]);
					assert.notEqual(undefined, getServicesResponse.service[0].type);
					assert.notEqual(undefined, getServicesResponse.service[0].type[0]);
					assert.notEqual(undefined, response.type);
					assert.notEqual(undefined, response.type[0]);
					assert.equal(getServicesResponse.service[0].type[0], response.type[0]);
				}
			},
			
			'-> realtime.getdata' : {	
				topic: function(err, getServicesResponse) {
					var parent = this;
					webmetrics.realtime.getData(creds.username, creds.api_key,
						{
							'serviceid' : getServicesResponse.service[0].id[0],
							'samplenum' : 20
						}, function(err, response) {
							parent.callback(getServicesResponse, response);
						}
					);
				},
							
				'returns a valid response' : function(getServicesResponse, response) {
					assert.notEqual(undefined, getServicesResponse.service);
					assert.notEqual(undefined, getServicesResponse.service[0]);
					assert.notEqual(undefined, getServicesResponse.service[0].type);
					assert.notEqual(undefined, getServicesResponse.service[0].type[0]);
					assert.notEqual(undefined, response.service);
					assert.notEqual(undefined, response.service[0]);
					assert.notEqual(undefined, response.service[0].type);
					assert.equal(getServicesResponse.service[0].type[0], response.service[0].type);
				}
			},
			
			'-> logdownload.getdata' : {	
				topic: function(err, getServicesResponse) {
					var parent = this;
					var now = new Date();
					webmetrics.logdownload.getData(creds.username, creds.api_key,
						{
							'serviceid' : getServicesResponse.service[0].id[0],
							'year' : now.getFullYear(),
							'month' : now.getMonth()+1,
							'day' : now.getDate()
						}, function(err, response) {
							parent.callback(getServicesResponse, response);
						}
					);
				},
							
				'returns a valid response' : function(getServicesResponse, response) {
					assert.notEqual(undefined, response.logs);
					assert.notEqual(0, response.logs.length);
				}
			},
			
			'-> processeddata.getdata' : {	
				topic: function(err, getServicesResponse) {
					var parent = this;
					var now = new Date();
					var lastmonth = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
					webmetrics.processeddata.getData(creds.username, creds.api_key,
						{
							'serviceid' : getServicesResponse.service[0].id[0],
							'eyear' : now.getFullYear(),
							'emonth' : now.getMonth()+1,
							'eday' : now.getDate(),
							'syear' : lastmonth.getFullYear(),
							'smonth' : lastmonth.getMonth()+1,
							'sday' : lastmonth.getDate()
						},
						function(err, response) {
							parent.callback(getServicesResponse, response);
						}
					);
				},
							
				'returns a valid response' : function(getServicesResponse, response) {
					assert.notEqual(undefined, response.summary);
					assert.notEqual(0, response.summary.length);
				}
			}
		}
	}
}).export(module, {error: false});
