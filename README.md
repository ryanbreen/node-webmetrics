# node-webmetrics

Provides access to the Webmetrics API.

## Installation

    npm install webmetrics

## Tests

Tests use [vows](http://vowsjs.org) and can be run as `vows test/test_webmetrics_api.js`.  Note that to run the test suite, you must create a credentials.json file within the root directory of this repository.  The file should be formatted like this:

    {
        'username' : 'myusername@mydomain.com',
        'api_key' : 'not_a_great_api_key'
    }

## Usage

This library exposes the Webmetrics API as defined in the [May 18, 2011 API document](http://help.webmetrics.com/help/attachments/7012446/23560559.pdf).  The API is divided into 5 categories: maintenance, logdownload, processeddata, realtime, and snapshot.  If you want to call the `mainteance.getServices` method, you would do something like this:

    var util = require('util');
    var webmetrics = require('webmetrics');
    
    webmetrics.maintenance.getServiceType('myusername@mydomain.com', 'not_a_great_api_key', { 'serviceid' : 1233523 }, function(err, services) {
       util.puts(util.inspect(services));
    });

Each method call of the Webmetrics API expects your username and api key.  All parameters are passed in as a hash of name/value pairs which are composed into a query string.  If a parameter is required by the Webmetrics API but is not present in your options object, the callback will be fired with an error message explaining which parameter was missing.

If you would prefer to make unassisted API calls, for example if new API methods have been introduced that are not yet supported out of the box by this library, you can call the `webmetrics.sendMessage` method: `webmetrics.sendMessage(username, api_key, api, method, query, callback)`.  The getServiceType call in the above example would look like this if the raw `sendMessage` call was used:

    var util = require('util');
    var webmetrics = require('webmetrics');
    
    webmetrics.sendMessage('myusername@mydomain.com', 'not_a_great_api_key', 'maintenance.getServiceType', 'GET', { 'serviceid' : 1233523 }, function(err, services) {
       util.puts(util.inspect(services));
    });

Note that no parameter checking occurs if you use `webmetrics.sendMessage`.

## Author

Ryan Breen (ryan at ryanbreen.com)

## License

Copyright (C) 2011 by Ryan Breen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
