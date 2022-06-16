/*
 * Request handlers
 *
 */

// Dependencies

var _data = require('./data');
var helpers = require('./helpers');

// Define the handlers

var handlers = {};

// Users handler

handlers.users = function (data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods

handlers._users = {}; //_users to denote a private method for the users method

// Users - post
// Requred data: firstName, lastName, phone, password, tosAgreement
// Optional data: none

handlers._users.post = function (data, callback) {
  var firstName =
    typeof data.payload.firstName === 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName === 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var phone =
    typeof data.payload.phone === 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password === 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  var tosAgreement =
    typeof data.payload.tosAgreement === 'boolean' &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure the user doesn't already exist
    _data.read('users', phone, function (err, data) {
      if (err) {
        // Hash the password
        var hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          // Create the user object

          var userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement: true,
          };

          // Store the user

          _data.create('users', phone, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: 'Could not create the new user' });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the user's password" });
        }
      } else {
        // User already exists

        callback(400, {
          Error: 'A user with that phone number already exists',
        });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

// Users - get
// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object. Don't let them access others data

handlers._users.get = function (data, callback) {
  // Check that the phone number is valid

  var phone =
    typeof data.queryStringObject.phone === 'string' &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone
      : false;
  if (phone) {
    // Lookup the user

    _data.read('users', phone, function (err, data) {
      if (!err && data) {
        // Remove the hashed password from the user object before returning it

        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let an authenticated user update their object. Don't let them update others data

handlers._users.put = function (data, callback) {
  // Check for the required field

  var phone =
    typeof data.payload.phone === 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  // Check for the optional fields

  var firstName =
    typeof data.payload.firstName === 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName === 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var password =
    typeof data.payload.password === 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  // Error if the phone is invalid

  if (phone) {
    // Lookup the user

    _data.read('users', phone, function (err, userDataObj) {
      if (!err && userDataObj) {
        // Error if nothing is sent to update
        if (firstName || lastName || password) {
          // Update the fields necessary
          if (firstName) {
            userDataObj.firstName = firstName;
          }
          if (lastName) {
            userDataObj.lastName = lastName;
          }
          if (password) {
            userDataObj.hashedPassword = helpers.hash(password);
          }

          // Store the new updates

          _data.update('users', phone, userDataObj, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.log('handlers._users.put', err);
              callback(500, { Error: 'Could not update the user' });
            }
          });
        } else {
          callback(400, { Error: 'Missing fields to update' });
        }
      } else {
        callback(400, { Error: 'The specified user does not exist' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - delete
// Required data: phone
// @TODO Only let an authenticated user delete their object. Don't let them delete others data
// @TODO Cleanup (delete) any other data files associated with this user

handlers._users.delete = function (data, callback) {
  // Check that the phone number is valid

  var phone =
    typeof data.queryStringObject.phone === 'string' &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone
      : false;

  if (phone) {
    // Lookup the user

    _data.read('users', phone, function (err, data) {
      if (!err && data) {
        _data.delete('users', phone, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: 'Could not delete the specified user' });
          }
        });
      } else {
        callback(400, { Error: 'Could not find the specified user' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Ping handler

handlers.ping = function (data, callback) {
  // Callback a http status code, and a payload object
  callback(200);
};

// Not found handler

handlers.notFound = function (data, callback) {
  callback(404);
};

module.exports = handlers;
