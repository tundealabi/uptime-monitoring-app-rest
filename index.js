/*
 * Primary file for the API
 *
 */

// Dependencies
var http = require('http');
var https = require('https');
const { StringDecoder } = require('string_decoder');
var url = require('url');
var stringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var config = require('./config');

// Instantiate the http server

var httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
});

// Start the http server
httpServer.listen(config.httpPort, function () {
  console.log(
    'non-secured server is hot @ ' +
      config.httpPort +
      ' in ' +
      config.envName +
      ' mode'
  );
});

// Instantiate the https server

const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem'),
};

var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
  unifiedServer(req, res);
});

// Start the https server
httpsServer.listen(config.httpsPort, function () {
  console.log(
    'secured server is hot @ ' +
      config.httpsPort +
      ' in ' +
      config.envName +
      ' mode'
  );
});

// All the server logic for the http and https server

var unifiedServer = function (req, res) {
  // Get the URL and parse it

  var parsedUrl = url.parse(req.url, true);

  //Get the path

  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object

  var queryStringObject = parsedUrl.query;

  // Get the HTTP method

  var method = req.method.toLowerCase();

  //Get the headers as an object

  var headers = req.headers;

  // Get the payload, if any

  var decoder = new StringDecoder('utf-8');
  var buffer = '';

  req.on('data', function (data) {
    buffer += decoder.write(data);
  });

  req.on('end', function () {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found use the notFound handler

    var chosenHandler =
      typeof router[trimmedPath] !== 'undefined'
        ? router[trimmedPath]
        : handlers.notFound;

    // Construct the data object to send to the handler

    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: buffer,
    };

    // Route the handler to the request specified in the router
    chosenHandler(data, function (statusCode, payload) {
      // Use the status code called by the handler, or default to 200

      statusCode = typeof statusCode === 'number' ? statusCode : 200;

      // Use the payload called back by the handler, or default to an empty object

      payload = typeof payload === 'object' ? payload : {};

      // Convert the payload to a string

      var payloadString = JSON.stringify(payload);

      // Return the response

      res.setHeader('Content-Type', 'applicaton/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request path

      console.log('Returning this response: ', {
        statusCode,
        payloadString,
      });
    });
  });
};

// Define the handlers

var handlers = {};

// Ping handler

handlers.ping = function (data, callback) {
  // Callback a http status code, and a payload object
  callback(200);
};

// Not found handler

handlers.notFound = function (data, callback) {
  callback(404);
};

// Define a request router

var router = {
  ping: handlers.ping,
};
