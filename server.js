/**
 * Created by efthemiosprime on 5/11/2015.
 */
var http = require('http');         // built-in module provides http server and client functionality
var fs = require('fs');             // built-in fs module provides filesystem related functionality
var path = require('path');         // built-in path module provides filesystem path-related functionality
var mime = require('mime');         // add-on mime module provides ability to derive a mime type based on a filename extension
var cache = {};                     // cache object is where contents of cached files are stored