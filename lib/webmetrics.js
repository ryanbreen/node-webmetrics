var util = require('util');
var https = require('https');
var url = require('url');
var querystring = require('querystring');
var crypto = require('crypto');
var sprintf = require('sprintf').sprintf;
var logger = require('./logger.js').getLogger('webmetrics');

exports.URL_HOST = 'https://api.webmetrics.com';
exports.URL_PATH = '/v2/';

var api = {
	'maintenance' : {
		'getServices' : {},	
		'getServiceType' : { 'required' : [ 'serviceid' ] },
		'getNodepad' : {},
		'setNodepad' : { 'required' : [ 'notepad' ] },
		'addNewService' : { 'required' : [ 'servicename', 'servicetype' ] },
		'changePassword' : { 'required' : [ 'newpassword' ] },
		'renameService' : { 'required' : [ 'newname', 'serviceid' ] },
		'resetService' : { 'required' : [ 'serviceid' ] },	
		'getServiceStatus' : { 'required' : [ 'serviceid' ] },	
		'turnServiceOff' : { 'required' : [ 'serviceid' ] },	
		'turnServiceOn' : { 'required' : [ 'serviceid' ] },	
		'getDescription' : { 'required' : [ 'serviceid' ] },	
		'setDescription' : { 'required' : [ 'serviceid', 'description'] },	
		'getMonitoringURL' : { 'required' : [ 'serviceid' ] },	
		'setMonitoringURL' : { 'required' : [ 'serviceid', 'url' ] },	
		'getPageTimeout' : { 'required' : [ 'serviceid' ] },
		'setPageTimeout' : { 'required' : [ 'serviceid', 'timeout' ] },
		'getMonitoringInterval' : { 'required' : [ 'serviceid' ] },
		'setMonitoringInterval' : { 'required' : [ 'serviceid', 'interval' ] },
		'getAvailableMonitoringIntervals' : { 'required' : [ 'serviceid' ] },	
		'getScript' : { 'required' : [ 'serviceid' ] },
		'addAlertingGroup' : { 'required' : [ 'group' ] },
		'getAlertingGroups' : {},
		'removeAlertingGroup' : { 'required' : [ 'group' ] },
		'addContactsToAlertingGroup' : { 'required' : [ 'group', 'contact' ] },
		'getAlertingGroupContacts' : { 'required' : [ 'group' ] },
		'removeContactsFromAlertingGroup' : { 'required' : [ 'group', 'contact' ] },
		'addDiagnosticContacts' : { 'required' : [ 'serviceid', 'contact' ] },	
		'getDiagnosticContacts' : { 'required' : [ 'serviceid' ] },
		'setDiagnosticContacts' : { 'required' : [ 'serviceid', 'contact' ] },
		'removeDiagnosticContact' : { 'required' : [ 'serviceid', 'contact' ] },
		'addEscalationLevelContacts' : { 'required' : [ 'serviceid', 'contact',  'level' ] },
		'getEscalationLevelContacts' : { 'required' : [ 'serviceid', 'level' ] },
		'setEscalationLevelContacts' : { 'required' : [ 'serviceid', 'contact', 'level' ] },
		'removeEscalationLevelContact' : { 'required' : [ 'serviceid', 'contact', 'level' ] },	
		'getAllAlertingContacts' : { 'required' : [ 'serviceid' ] },	
		'getEscalationLevelDelay' : { 'required' : [ 'serviceid', 'level' ] },	
		'getEscalationLevelDelayOptions' : {},
		'setEscalationLevelDelay' : { 'required' : [ 'serviceid', 'level', 'delay' ] },	
		'getReportList' : {},
		'addReportingContacts' : { 'required' : [ 'contact', 'reportid' ] },	
		'getReportingContacts' : { 'required' : [ 'reportid' ] },
		'removeReportingContact' : { 'required' : [ 'contact', 'reportid' ] },
		'setReportingContacts' : { 'required' : [ 'contact', 'reportid' ] },
		'addSMSVoiceContact' : { 'required' : [ 'type', 'name', 'number' ] },	
		'getSMSVoiceContacts' : {},	
		'removeSMSVoiceContact' : { 'required' : [ 'uid' ] },	
		'getLoadtimeSLA' : { 'required' : [ 'serviceid' ] },	
		'getUptimeSLA' : { 'required' : [ 'serviceid' ] },	
		'setLoadtimeSLA' : { 'required' : [ 'serviceid', 'sla' ] },	
		'setUptimeSLA' : { 'required' : [ 'serviceid', 'sla' ] },
		'getMaintenanceWindows' : { 'required' : [ 'serviceid' ] },
		'addOneTimeMaintenanceWindow' : { 'required' : [ 'serviceid', 'stime', 'sday', 'smonth', 'syear', 'etime', 'eday', 'emonth', 'eyear' ] },
		'addWeeklyMaintenanceWindow' : { 'required' : [ 'serviceid', 'wintype', 'stime', 'etime' ] },
		'addMonthlyMaintenanceWindow' : { 'required' : [ 'serviceid', 'wintype', 'stime', 'etime' ] },
		'isInMaintenanceWindow' : { 'required' : [ 'serviceid' ] },
		'removemaintenanceWindow' : { 'required' : [ 'id', 'serviceid' ] }
	},
	
	'realtime' : { 'getdata' : {} },
	
	'processeddata' : {
		'getdata' : { 'required' : [ 'serviceid', 'sday', 'smonth', 'syear', 'eday', 'emonth', 'eyear' ] }
	},
	
	'logdownload' : {
		'getdata' : { 'required' : [ 'serviceid', 'day', 'month', 'year' ] }
	},

	'snapshot' : { 'getdata' : {} }
};

function apiFactory(category, method_name, apiSpec) {
	return function(username, api_key, options, callback) {
		var method = apiSpec.hasOwnProperty('method') ? 'GET' : apiSpec['method'];
		if (apiSpec.hasOwnProperty('required')) {
			for (var i = 0; i<apiSpec['required'].length; ++i) {
				var req = apiSpec['required'][i];
				if (!options.hasOwnProperty(req)) return callback(sprintf('%s must be present in options', req));
			}
		} else if (callback === undefined) {
			callback = options;
			options = {};
		}
		
		exports.sendMessage(username, api_key, sprintf('%s.%s', category, method_name), method, options, callback);
	}
}

for (var category in api) {
	for (var method in api[category]) {
		if (!exports.hasOwnProperty(category)) exports[category] = {};
		exports[category][method] = apiFactory(category, method, api[category][method]);
	}
}

/**
 * Alias some of the names of functions to be more camel-casey since Webmetrics can't seem to make up their minds
 */
exports.realtime['getData'] = exports.realtime.getdata;
exports.logdownload['getData'] = exports.logdownload.getdata;
exports.processeddata['getData'] = exports.processeddata.getdata;
exports.snapshot['getData'] = exports.snapshot.getdata;

function calculateSig(username, api_key) {
	var ts = Math.round(new Date().getTime()/1000.0);
	var sig_base = sprintf('%s%s%s', username, api_key, ts);
	var shasum = crypto.createHash('sha1');
	shasum.update(sig_base);
	return shasum.digest('base64');
}

/**
 * Call the JSON API with the provided method and query parameters.  Call the callback function once the
 * request is completed, passing in the JSON object returned from the server or null in case of error.
 */
exports.sendMessage = function(username, api_key, api, method, query, callback) {
	
	logger.trace('api: %s %s', method, api);
	
	var sig = calculateSig(username, api_key);
	logger.trace('sig length is %s', sig.length);

	query.method = api;
	query.username = username;
	query.sig = sig;
	query.format = 'json';

	var url_query = querystring.stringify(query);
	var url_base = sprintf('%s%s?%s', exports.URL_HOST, exports.URL_PATH, url_query);
	
	logger.trace('URL is %s', url_base);
	
	var parsedUrl = url.parse(url_base);
	_sendRequest(parsedUrl, method, callback);
}

function _sendRequest(parsed_url, method, callback) {
	var path = sprintf('%s%s', parsed_url.pathname, parsed_url.search);
	logger.trace('Path is %s', path);
	var request = https.request({ 'host': parsed_url.host, 'port': parsed_url.port,
		'path': path,
		'method': method,
		'headers': {
			'Host': parsed_url.host,
			'Connection': 'keep-alive'
		}
	}, function(response) {
		
		if (response.statusCode > 399) {
			logger.error('Got error response code %s, request failed.', response.statusCode);
			callback(sprintf('Got error response code %s', response.statusCode));
		} else if (response.statusCode > 299) {
			logger.trace('Location:\n%s', response.headers['location']);
			return _sendRequest(url.parse(response.headers['location']), 'GET', callback);
		}
		
		response.setEncoding('utf8');
		var responseBody = '';
		response.on('data', function (chunk) {
			responseBody += chunk;
		});
		response.on('end', function () {
			try {
				// logger.trace('responseBody:\n%s', responseBody);
				var obj = JSON.parse(responseBody);
				callback(null, obj);
			} catch(e) {
				logger.error('Failed to parse JSON response:\n%s', e.stack);
				callback.apply('Failed to parse JSON response');
			}
		});
	});
	
	request.on('error', function(err) {
		logger.error('Failed to send webmetrics request:\n%s', util.inspect(err));
		callback('Failed to send webmetrics request');
	});
	
	request.end();
}
