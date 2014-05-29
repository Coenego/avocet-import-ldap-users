/*!
 * Copyright 2014 Digital Services, University of Cambridge Licensed
 * under the Educational Community License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 *     http://opensource.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

var argv = require('optimist')
    .usage('Usage: $0 -f <file>')
    .demand('f')
    .alias('f', 'file')
    .describe('f', 'The file containing the LDAP users')
    .argv;

var _ = require('underscore');
var bunyan = require('bunyan');
var fs = require('fs');
var util = require('util');

var log = bunyan.createLogger({'name': 'import'});

var file = argv.file;

/*!
 * Creates a comma separated line from a string
 *
 * @param  {String}     blob        String containing user details
 * @api private
 */
var createUserLine = function(blob) {

    var uid = null;
    var displayName = null;
    var email = null;

    /*!
     * Removes the key from a value
     *
     * @param  {String}     value   The value where the key needs to be deleted from
     * @param  {String}     key     The key that needs to be deleted from the value
     * @return {String}             The sanitized value
     * @api private
     */
    var cleanUpValue = function(value, key) {
        value = value.replace(key, '');
        return value;
    };

    blob = blob.split(/\r?\n/);
    _.each(blob, function(line) {

        // Fetch the user's displayName
        if (line.indexOf('uid') >= 0) {
            uid = cleanUpValue(line, 'uid: ');
        }

        // Fetch the user's displayName
        if (line.indexOf('cn') >= 0) {
            displayName = cleanUpValue(line, 'cn: ');
        }

        // Fetch the user's email
        if (line.indexOf('mail') >= 0) {
            email = cleanUpValue(line, 'mail: ');
        }
    });

    return util.format('%s, %s, %s', uid, displayName, email);
};

/**
 * Generates a CSV file from a collection of comma separated values
 *
 * @param  {String}     lines       String containing all the comma separated values
 * @api private
 */
var generateCSVFile = function(lines) {
    fs.writeFile('users.csv', lines, function(err) {
        if (err) {
            return log.error('Exporting users.csv failed');
        }

        return log.info('Successfully exported users.csv');
    });
};

/**
 * Import LDAP users from a given file
 *
 * @api private
 */
var importUsers = function() {
    if (!file) {
        return log.error('File containing users not found');
    }

    // Parse the file
    fs.readFile(file, 'utf-8', function(err, data) {
        if (err) {
            return log.error('Error while parsing the user file');
        }

        // Fetch all the users from the file
        data = data.split(/(\r?\n){2,}/);
        data = _.chain(data)
            .map(function(line) { return line.trim(); })
            .compact()
            .value();

        // Create a user object for each retrieved user
        var lines = [];
        _.each(data, function(blob) {
            lines.push(createUserLine(blob));
        });
        lines = lines.join('\n');

        // Generate a .CSV-file
        generateCSVFile(lines);
    });
};

importUsers();
