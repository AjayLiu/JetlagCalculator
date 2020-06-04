(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
const geoTz = require('geo-tz');

$( document ).ready(function() {
    AirportInput("autocomplete-airport-1");
    
    $('#sleepInput').timepicker({
        'minTime': '10:00pm',
        'maxTime': '9:30pm',
    });

    $(".result").hide();

    $( "#calculateButton" ).click(function() {
        calculate();
    });


    function checkInputData(id) {
        var realId = "autocomplete-airport-" + id;
        return ([document.getElementById(realId).getAttribute("data-lat"), document.getElementById(realId).getAttribute(
            "data-lon"), document.getElementById(realId).getAttribute("data-tz")]);
    }


    function calculate(){
        var sleepInput = $('#sleepInput').val();
        
        var thisTimeZone = moment.tz.guess(true);
        var userSleepTime = moment.tz(sleepInput, "hh:mma", thisTimeZone);
        if(userSleepTime.isValid() && checkInputData(1) != null){
            //ex: PDT -7, Taiwan GMT +8  = -15hrs

            alert (geoTz(checkInputData(1)[0], checkInputData(1)[1]));
            
            // var diff = userSleepTime.utcOffset()/60 - time.utcOffset();        

            // var resultTime = userSleepTime.subtract(diff, "hours").format("hh:mma");

            // document.getElementById("resultTitle").innerHTML = "You should try sleeping at: " + resultTime;
            
            // $(".result").show();
                            
            // document.querySelector('.result').scrollIntoView({ 
            //     behavior: 'smooth' 
            // }); 
        } else {
            alert("INVALID INPUT");
        }

    }
});


},{"geo-tz":9}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var invariant_1 = require("@turf/invariant");
// http://en.wikipedia.org/wiki/Even%E2%80%93odd_rule
// modified from: https://github.com/substack/point-in-polygon/blob/master/index.js
// which was modified from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
/**
 * Takes a {@link Point} and a {@link Polygon} or {@link MultiPolygon} and determines if the point
 * resides inside the polygon. The polygon can be convex or concave. The function accounts for holes.
 *
 * @name booleanPointInPolygon
 * @param {Coord} point input point
 * @param {Feature<Polygon|MultiPolygon>} polygon input polygon or multipolygon
 * @param {Object} [options={}] Optional parameters
 * @param {boolean} [options.ignoreBoundary=false] True if polygon boundary should be ignored when determining if
 * the point is inside the polygon otherwise false.
 * @returns {boolean} `true` if the Point is inside the Polygon; `false` if the Point is not inside the Polygon
 * @example
 * var pt = turf.point([-77, 44]);
 * var poly = turf.polygon([[
 *   [-81, 41],
 *   [-81, 47],
 *   [-72, 47],
 *   [-72, 41],
 *   [-81, 41]
 * ]]);
 *
 * turf.booleanPointInPolygon(pt, poly);
 * //= true
 */
function booleanPointInPolygon(point, polygon, options) {
    if (options === void 0) { options = {}; }
    // validation
    if (!point) {
        throw new Error("point is required");
    }
    if (!polygon) {
        throw new Error("polygon is required");
    }
    var pt = invariant_1.getCoord(point);
    var geom = invariant_1.getGeom(polygon);
    var type = geom.type;
    var bbox = polygon.bbox;
    var polys = geom.coordinates;
    // Quick elimination if point is not inside bbox
    if (bbox && inBBox(pt, bbox) === false) {
        return false;
    }
    // normalize to multipolygon
    if (type === "Polygon") {
        polys = [polys];
    }
    var insidePoly = false;
    for (var i = 0; i < polys.length && !insidePoly; i++) {
        // check if it is in the outer ring first
        if (inRing(pt, polys[i][0], options.ignoreBoundary)) {
            var inHole = false;
            var k = 1;
            // check for the point in any of the holes
            while (k < polys[i].length && !inHole) {
                if (inRing(pt, polys[i][k], !options.ignoreBoundary)) {
                    inHole = true;
                }
                k++;
            }
            if (!inHole) {
                insidePoly = true;
            }
        }
    }
    return insidePoly;
}
exports.default = booleanPointInPolygon;
/**
 * inRing
 *
 * @private
 * @param {Array<number>} pt [x,y]
 * @param {Array<Array<number>>} ring [[x,y], [x,y],..]
 * @param {boolean} ignoreBoundary ignoreBoundary
 * @returns {boolean} inRing
 */
function inRing(pt, ring, ignoreBoundary) {
    var isInside = false;
    if (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) {
        ring = ring.slice(0, ring.length - 1);
    }
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var xi = ring[i][0];
        var yi = ring[i][1];
        var xj = ring[j][0];
        var yj = ring[j][1];
        var onBoundary = (pt[1] * (xi - xj) + yi * (xj - pt[0]) + yj * (pt[0] - xi) === 0) &&
            ((xi - pt[0]) * (xj - pt[0]) <= 0) && ((yi - pt[1]) * (yj - pt[1]) <= 0);
        if (onBoundary) {
            return !ignoreBoundary;
        }
        var intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
            (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
        if (intersect) {
            isInside = !isInside;
        }
    }
    return isInside;
}
/**
 * inBBox
 *
 * @private
 * @param {Position} pt point [x,y]
 * @param {BBox} bbox BBox [west, south, east, north]
 * @returns {boolean} true/false if point is inside BBox
 */
function inBBox(pt, bbox) {
    return bbox[0] <= pt[0] &&
        bbox[1] <= pt[1] &&
        bbox[2] >= pt[0] &&
        bbox[3] >= pt[1];
}

},{"@turf/invariant":7}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module helpers
 */
/**
 * Earth Radius used with the Harvesine formula and approximates using a spherical (non-ellipsoid) Earth.
 *
 * @memberof helpers
 * @type {number}
 */
exports.earthRadius = 6371008.8;
/**
 * Unit of measurement factors using a spherical (non-ellipsoid) earth radius.
 *
 * @memberof helpers
 * @type {Object}
 */
exports.factors = {
    centimeters: exports.earthRadius * 100,
    centimetres: exports.earthRadius * 100,
    degrees: exports.earthRadius / 111325,
    feet: exports.earthRadius * 3.28084,
    inches: exports.earthRadius * 39.370,
    kilometers: exports.earthRadius / 1000,
    kilometres: exports.earthRadius / 1000,
    meters: exports.earthRadius,
    metres: exports.earthRadius,
    miles: exports.earthRadius / 1609.344,
    millimeters: exports.earthRadius * 1000,
    millimetres: exports.earthRadius * 1000,
    nauticalmiles: exports.earthRadius / 1852,
    radians: 1,
    yards: exports.earthRadius / 1.0936,
};
/**
 * Units of measurement factors based on 1 meter.
 *
 * @memberof helpers
 * @type {Object}
 */
exports.unitsFactors = {
    centimeters: 100,
    centimetres: 100,
    degrees: 1 / 111325,
    feet: 3.28084,
    inches: 39.370,
    kilometers: 1 / 1000,
    kilometres: 1 / 1000,
    meters: 1,
    metres: 1,
    miles: 1 / 1609.344,
    millimeters: 1000,
    millimetres: 1000,
    nauticalmiles: 1 / 1852,
    radians: 1 / exports.earthRadius,
    yards: 1 / 1.0936,
};
/**
 * Area of measurement factors based on 1 square meter.
 *
 * @memberof helpers
 * @type {Object}
 */
exports.areaFactors = {
    acres: 0.000247105,
    centimeters: 10000,
    centimetres: 10000,
    feet: 10.763910417,
    inches: 1550.003100006,
    kilometers: 0.000001,
    kilometres: 0.000001,
    meters: 1,
    metres: 1,
    miles: 3.86e-7,
    millimeters: 1000000,
    millimetres: 1000000,
    yards: 1.195990046,
};
/**
 * Wraps a GeoJSON {@link Geometry} in a GeoJSON {@link Feature}.
 *
 * @name feature
 * @param {Geometry} geometry input geometry
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature} a GeoJSON Feature
 * @example
 * var geometry = {
 *   "type": "Point",
 *   "coordinates": [110, 50]
 * };
 *
 * var feature = turf.feature(geometry);
 *
 * //=feature
 */
function feature(geom, properties, options) {
    if (options === void 0) { options = {}; }
    var feat = { type: "Feature" };
    if (options.id === 0 || options.id) {
        feat.id = options.id;
    }
    if (options.bbox) {
        feat.bbox = options.bbox;
    }
    feat.properties = properties || {};
    feat.geometry = geom;
    return feat;
}
exports.feature = feature;
/**
 * Creates a GeoJSON {@link Geometry} from a Geometry string type & coordinates.
 * For GeometryCollection type use `helpers.geometryCollection`
 *
 * @name geometry
 * @param {string} type Geometry Type
 * @param {Array<any>} coordinates Coordinates
 * @param {Object} [options={}] Optional Parameters
 * @returns {Geometry} a GeoJSON Geometry
 * @example
 * var type = "Point";
 * var coordinates = [110, 50];
 * var geometry = turf.geometry(type, coordinates);
 * // => geometry
 */
function geometry(type, coordinates, options) {
    if (options === void 0) { options = {}; }
    switch (type) {
        case "Point": return point(coordinates).geometry;
        case "LineString": return lineString(coordinates).geometry;
        case "Polygon": return polygon(coordinates).geometry;
        case "MultiPoint": return multiPoint(coordinates).geometry;
        case "MultiLineString": return multiLineString(coordinates).geometry;
        case "MultiPolygon": return multiPolygon(coordinates).geometry;
        default: throw new Error(type + " is invalid");
    }
}
exports.geometry = geometry;
/**
 * Creates a {@link Point} {@link Feature} from a Position.
 *
 * @name point
 * @param {Array<number>} coordinates longitude, latitude position (each in decimal degrees)
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<Point>} a Point feature
 * @example
 * var point = turf.point([-75.343, 39.984]);
 *
 * //=point
 */
function point(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    var geom = {
        type: "Point",
        coordinates: coordinates,
    };
    return feature(geom, properties, options);
}
exports.point = point;
/**
 * Creates a {@link Point} {@link FeatureCollection} from an Array of Point coordinates.
 *
 * @name points
 * @param {Array<Array<number>>} coordinates an array of Points
 * @param {Object} [properties={}] Translate these properties to each Feature
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north]
 * associated with the FeatureCollection
 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
 * @returns {FeatureCollection<Point>} Point Feature
 * @example
 * var points = turf.points([
 *   [-75, 39],
 *   [-80, 45],
 *   [-78, 50]
 * ]);
 *
 * //=points
 */
function points(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    return featureCollection(coordinates.map(function (coords) {
        return point(coords, properties);
    }), options);
}
exports.points = points;
/**
 * Creates a {@link Polygon} {@link Feature} from an Array of LinearRings.
 *
 * @name polygon
 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<Polygon>} Polygon Feature
 * @example
 * var polygon = turf.polygon([[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]], { name: 'poly1' });
 *
 * //=polygon
 */
function polygon(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    for (var _i = 0, coordinates_1 = coordinates; _i < coordinates_1.length; _i++) {
        var ring = coordinates_1[_i];
        if (ring.length < 4) {
            throw new Error("Each LinearRing of a Polygon must have 4 or more Positions.");
        }
        for (var j = 0; j < ring[ring.length - 1].length; j++) {
            // Check if first point of Polygon contains two numbers
            if (ring[ring.length - 1][j] !== ring[0][j]) {
                throw new Error("First and last Position are not equivalent.");
            }
        }
    }
    var geom = {
        type: "Polygon",
        coordinates: coordinates,
    };
    return feature(geom, properties, options);
}
exports.polygon = polygon;
/**
 * Creates a {@link Polygon} {@link FeatureCollection} from an Array of Polygon coordinates.
 *
 * @name polygons
 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygon coordinates
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
 * @returns {FeatureCollection<Polygon>} Polygon FeatureCollection
 * @example
 * var polygons = turf.polygons([
 *   [[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]],
 *   [[[-15, 42], [-14, 46], [-12, 41], [-17, 44], [-15, 42]]],
 * ]);
 *
 * //=polygons
 */
function polygons(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    return featureCollection(coordinates.map(function (coords) {
        return polygon(coords, properties);
    }), options);
}
exports.polygons = polygons;
/**
 * Creates a {@link LineString} {@link Feature} from an Array of Positions.
 *
 * @name lineString
 * @param {Array<Array<number>>} coordinates an array of Positions
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<LineString>} LineString Feature
 * @example
 * var linestring1 = turf.lineString([[-24, 63], [-23, 60], [-25, 65], [-20, 69]], {name: 'line 1'});
 * var linestring2 = turf.lineString([[-14, 43], [-13, 40], [-15, 45], [-10, 49]], {name: 'line 2'});
 *
 * //=linestring1
 * //=linestring2
 */
function lineString(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    if (coordinates.length < 2) {
        throw new Error("coordinates must be an array of two or more positions");
    }
    var geom = {
        type: "LineString",
        coordinates: coordinates,
    };
    return feature(geom, properties, options);
}
exports.lineString = lineString;
/**
 * Creates a {@link LineString} {@link FeatureCollection} from an Array of LineString coordinates.
 *
 * @name lineStrings
 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north]
 * associated with the FeatureCollection
 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
 * @returns {FeatureCollection<LineString>} LineString FeatureCollection
 * @example
 * var linestrings = turf.lineStrings([
 *   [[-24, 63], [-23, 60], [-25, 65], [-20, 69]],
 *   [[-14, 43], [-13, 40], [-15, 45], [-10, 49]]
 * ]);
 *
 * //=linestrings
 */
function lineStrings(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    return featureCollection(coordinates.map(function (coords) {
        return lineString(coords, properties);
    }), options);
}
exports.lineStrings = lineStrings;
/**
 * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
 *
 * @name featureCollection
 * @param {Feature[]} features input features
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {FeatureCollection} FeatureCollection of Features
 * @example
 * var locationA = turf.point([-75.343, 39.984], {name: 'Location A'});
 * var locationB = turf.point([-75.833, 39.284], {name: 'Location B'});
 * var locationC = turf.point([-75.534, 39.123], {name: 'Location C'});
 *
 * var collection = turf.featureCollection([
 *   locationA,
 *   locationB,
 *   locationC
 * ]);
 *
 * //=collection
 */
function featureCollection(features, options) {
    if (options === void 0) { options = {}; }
    var fc = { type: "FeatureCollection" };
    if (options.id) {
        fc.id = options.id;
    }
    if (options.bbox) {
        fc.bbox = options.bbox;
    }
    fc.features = features;
    return fc;
}
exports.featureCollection = featureCollection;
/**
 * Creates a {@link Feature<MultiLineString>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiLineString
 * @param {Array<Array<Array<number>>>} coordinates an array of LineStrings
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<MultiLineString>} a MultiLineString feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiLine = turf.multiLineString([[[0,0],[10,10]]]);
 *
 * //=multiLine
 */
function multiLineString(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    var geom = {
        type: "MultiLineString",
        coordinates: coordinates,
    };
    return feature(geom, properties, options);
}
exports.multiLineString = multiLineString;
/**
 * Creates a {@link Feature<MultiPoint>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiPoint
 * @param {Array<Array<number>>} coordinates an array of Positions
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<MultiPoint>} a MultiPoint feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiPt = turf.multiPoint([[0,0],[10,10]]);
 *
 * //=multiPt
 */
function multiPoint(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    var geom = {
        type: "MultiPoint",
        coordinates: coordinates,
    };
    return feature(geom, properties, options);
}
exports.multiPoint = multiPoint;
/**
 * Creates a {@link Feature<MultiPolygon>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiPolygon
 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygons
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<MultiPolygon>} a multipolygon feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiPoly = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]]);
 *
 * //=multiPoly
 *
 */
function multiPolygon(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    var geom = {
        type: "MultiPolygon",
        coordinates: coordinates,
    };
    return feature(geom, properties, options);
}
exports.multiPolygon = multiPolygon;
/**
 * Creates a {@link Feature<GeometryCollection>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name geometryCollection
 * @param {Array<Geometry>} geometries an array of GeoJSON Geometries
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<GeometryCollection>} a GeoJSON GeometryCollection Feature
 * @example
 * var pt = turf.geometry("Point", [100, 0]);
 * var line = turf.geometry("LineString", [[101, 0], [102, 1]]);
 * var collection = turf.geometryCollection([pt, line]);
 *
 * // => collection
 */
function geometryCollection(geometries, properties, options) {
    if (options === void 0) { options = {}; }
    var geom = {
        type: "GeometryCollection",
        geometries: geometries,
    };
    return feature(geom, properties, options);
}
exports.geometryCollection = geometryCollection;
/**
 * Round number to precision
 *
 * @param {number} num Number
 * @param {number} [precision=0] Precision
 * @returns {number} rounded number
 * @example
 * turf.round(120.4321)
 * //=120
 *
 * turf.round(120.4321, 2)
 * //=120.43
 */
function round(num, precision) {
    if (precision === void 0) { precision = 0; }
    if (precision && !(precision >= 0)) {
        throw new Error("precision must be a positive number");
    }
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(num * multiplier) / multiplier;
}
exports.round = round;
/**
 * Convert a distance measurement (assuming a spherical Earth) from radians to a more friendly unit.
 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
 *
 * @name radiansToLength
 * @param {number} radians in radians across the sphere
 * @param {string} [units="kilometers"] can be degrees, radians, miles, or kilometers inches, yards, metres,
 * meters, kilometres, kilometers.
 * @returns {number} distance
 */
function radiansToLength(radians, units) {
    if (units === void 0) { units = "kilometers"; }
    var factor = exports.factors[units];
    if (!factor) {
        throw new Error(units + " units is invalid");
    }
    return radians * factor;
}
exports.radiansToLength = radiansToLength;
/**
 * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into radians
 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
 *
 * @name lengthToRadians
 * @param {number} distance in real units
 * @param {string} [units="kilometers"] can be degrees, radians, miles, or kilometers inches, yards, metres,
 * meters, kilometres, kilometers.
 * @returns {number} radians
 */
function lengthToRadians(distance, units) {
    if (units === void 0) { units = "kilometers"; }
    var factor = exports.factors[units];
    if (!factor) {
        throw new Error(units + " units is invalid");
    }
    return distance / factor;
}
exports.lengthToRadians = lengthToRadians;
/**
 * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into degrees
 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, centimeters, kilometres, feet
 *
 * @name lengthToDegrees
 * @param {number} distance in real units
 * @param {string} [units="kilometers"] can be degrees, radians, miles, or kilometers inches, yards, metres,
 * meters, kilometres, kilometers.
 * @returns {number} degrees
 */
function lengthToDegrees(distance, units) {
    return radiansToDegrees(lengthToRadians(distance, units));
}
exports.lengthToDegrees = lengthToDegrees;
/**
 * Converts any bearing angle from the north line direction (positive clockwise)
 * and returns an angle between 0-360 degrees (positive clockwise), 0 being the north line
 *
 * @name bearingToAzimuth
 * @param {number} bearing angle, between -180 and +180 degrees
 * @returns {number} angle between 0 and 360 degrees
 */
function bearingToAzimuth(bearing) {
    var angle = bearing % 360;
    if (angle < 0) {
        angle += 360;
    }
    return angle;
}
exports.bearingToAzimuth = bearingToAzimuth;
/**
 * Converts an angle in radians to degrees
 *
 * @name radiansToDegrees
 * @param {number} radians angle in radians
 * @returns {number} degrees between 0 and 360 degrees
 */
function radiansToDegrees(radians) {
    var degrees = radians % (2 * Math.PI);
    return degrees * 180 / Math.PI;
}
exports.radiansToDegrees = radiansToDegrees;
/**
 * Converts an angle in degrees to radians
 *
 * @name degreesToRadians
 * @param {number} degrees angle between 0 and 360 degrees
 * @returns {number} angle in radians
 */
function degreesToRadians(degrees) {
    var radians = degrees % 360;
    return radians * Math.PI / 180;
}
exports.degreesToRadians = degreesToRadians;
/**
 * Converts a length to the requested unit.
 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
 *
 * @param {number} length to be converted
 * @param {Units} [originalUnit="kilometers"] of the length
 * @param {Units} [finalUnit="kilometers"] returned unit
 * @returns {number} the converted length
 */
function convertLength(length, originalUnit, finalUnit) {
    if (originalUnit === void 0) { originalUnit = "kilometers"; }
    if (finalUnit === void 0) { finalUnit = "kilometers"; }
    if (!(length >= 0)) {
        throw new Error("length must be a positive number");
    }
    return radiansToLength(lengthToRadians(length, originalUnit), finalUnit);
}
exports.convertLength = convertLength;
/**
 * Converts a area to the requested unit.
 * Valid units: kilometers, kilometres, meters, metres, centimetres, millimeters, acres, miles, yards, feet, inches
 * @param {number} area to be converted
 * @param {Units} [originalUnit="meters"] of the distance
 * @param {Units} [finalUnit="kilometers"] returned unit
 * @returns {number} the converted distance
 */
function convertArea(area, originalUnit, finalUnit) {
    if (originalUnit === void 0) { originalUnit = "meters"; }
    if (finalUnit === void 0) { finalUnit = "kilometers"; }
    if (!(area >= 0)) {
        throw new Error("area must be a positive number");
    }
    var startFactor = exports.areaFactors[originalUnit];
    if (!startFactor) {
        throw new Error("invalid original units");
    }
    var finalFactor = exports.areaFactors[finalUnit];
    if (!finalFactor) {
        throw new Error("invalid final units");
    }
    return (area / startFactor) * finalFactor;
}
exports.convertArea = convertArea;
/**
 * isNumber
 *
 * @param {*} num Number to validate
 * @returns {boolean} true/false
 * @example
 * turf.isNumber(123)
 * //=true
 * turf.isNumber('foo')
 * //=false
 */
function isNumber(num) {
    return !isNaN(num) && num !== null && !Array.isArray(num) && !/^\s*$/.test(num);
}
exports.isNumber = isNumber;
/**
 * isObject
 *
 * @param {*} input variable to validate
 * @returns {boolean} true/false
 * @example
 * turf.isObject({elevation: 10})
 * //=true
 * turf.isObject('foo')
 * //=false
 */
function isObject(input) {
    return (!!input) && (input.constructor === Object);
}
exports.isObject = isObject;
/**
 * Validate BBox
 *
 * @private
 * @param {Array<number>} bbox BBox to validate
 * @returns {void}
 * @throws Error if BBox is not valid
 * @example
 * validateBBox([-180, -40, 110, 50])
 * //=OK
 * validateBBox([-180, -40])
 * //=Error
 * validateBBox('Foo')
 * //=Error
 * validateBBox(5)
 * //=Error
 * validateBBox(null)
 * //=Error
 * validateBBox(undefined)
 * //=Error
 */
function validateBBox(bbox) {
    if (!bbox) {
        throw new Error("bbox is required");
    }
    if (!Array.isArray(bbox)) {
        throw new Error("bbox must be an Array");
    }
    if (bbox.length !== 4 && bbox.length !== 6) {
        throw new Error("bbox must be an Array of 4 or 6 numbers");
    }
    bbox.forEach(function (num) {
        if (!isNumber(num)) {
            throw new Error("bbox must only contain numbers");
        }
    });
}
exports.validateBBox = validateBBox;
/**
 * Validate Id
 *
 * @private
 * @param {string|number} id Id to validate
 * @returns {void}
 * @throws Error if Id is not valid
 * @example
 * validateId([-180, -40, 110, 50])
 * //=Error
 * validateId([-180, -40])
 * //=Error
 * validateId('Foo')
 * //=OK
 * validateId(5)
 * //=OK
 * validateId(null)
 * //=Error
 * validateId(undefined)
 * //=Error
 */
function validateId(id) {
    if (!id) {
        throw new Error("id is required");
    }
    if (["string", "number"].indexOf(typeof id) === -1) {
        throw new Error("id must be a number or a string");
    }
}
exports.validateId = validateId;
// Deprecated methods
function radians2degrees() {
    throw new Error("method has been renamed to `radiansToDegrees`");
}
exports.radians2degrees = radians2degrees;
function degrees2radians() {
    throw new Error("method has been renamed to `degreesToRadians`");
}
exports.degrees2radians = degrees2radians;
function distanceToDegrees() {
    throw new Error("method has been renamed to `lengthToDegrees`");
}
exports.distanceToDegrees = distanceToDegrees;
function distanceToRadians() {
    throw new Error("method has been renamed to `lengthToRadians`");
}
exports.distanceToRadians = distanceToRadians;
function radiansToDistance() {
    throw new Error("method has been renamed to `radiansToLength`");
}
exports.radiansToDistance = radiansToDistance;
function bearingToAngle() {
    throw new Error("method has been renamed to `bearingToAzimuth`");
}
exports.bearingToAngle = bearingToAngle;
function convertDistance() {
    throw new Error("method has been renamed to `convertLength`");
}
exports.convertDistance = convertDistance;

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("@turf/helpers");
/**
 * Unwrap a coordinate from a Point Feature, Geometry or a single coordinate.
 *
 * @name getCoord
 * @param {Array<number>|Geometry<Point>|Feature<Point>} coord GeoJSON Point or an Array of numbers
 * @returns {Array<number>} coordinates
 * @example
 * var pt = turf.point([10, 10]);
 *
 * var coord = turf.getCoord(pt);
 * //= [10, 10]
 */
function getCoord(coord) {
    if (!coord) {
        throw new Error("coord is required");
    }
    if (!Array.isArray(coord)) {
        if (coord.type === "Feature" && coord.geometry !== null && coord.geometry.type === "Point") {
            return coord.geometry.coordinates;
        }
        if (coord.type === "Point") {
            return coord.coordinates;
        }
    }
    if (Array.isArray(coord) && coord.length >= 2 && !Array.isArray(coord[0]) && !Array.isArray(coord[1])) {
        return coord;
    }
    throw new Error("coord must be GeoJSON Point or an Array of numbers");
}
exports.getCoord = getCoord;
/**
 * Unwrap coordinates from a Feature, Geometry Object or an Array
 *
 * @name getCoords
 * @param {Array<any>|Geometry|Feature} coords Feature, Geometry Object or an Array
 * @returns {Array<any>} coordinates
 * @example
 * var poly = turf.polygon([[[119.32, -8.7], [119.55, -8.69], [119.51, -8.54], [119.32, -8.7]]]);
 *
 * var coords = turf.getCoords(poly);
 * //= [[[119.32, -8.7], [119.55, -8.69], [119.51, -8.54], [119.32, -8.7]]]
 */
function getCoords(coords) {
    if (Array.isArray(coords)) {
        return coords;
    }
    // Feature
    if (coords.type === "Feature") {
        if (coords.geometry !== null) {
            return coords.geometry.coordinates;
        }
    }
    else {
        // Geometry
        if (coords.coordinates) {
            return coords.coordinates;
        }
    }
    throw new Error("coords must be GeoJSON Feature, Geometry Object or an Array");
}
exports.getCoords = getCoords;
/**
 * Checks if coordinates contains a number
 *
 * @name containsNumber
 * @param {Array<any>} coordinates GeoJSON Coordinates
 * @returns {boolean} true if Array contains a number
 */
function containsNumber(coordinates) {
    if (coordinates.length > 1 && helpers_1.isNumber(coordinates[0]) && helpers_1.isNumber(coordinates[1])) {
        return true;
    }
    if (Array.isArray(coordinates[0]) && coordinates[0].length) {
        return containsNumber(coordinates[0]);
    }
    throw new Error("coordinates must only contain numbers");
}
exports.containsNumber = containsNumber;
/**
 * Enforce expectations about types of GeoJSON objects for Turf.
 *
 * @name geojsonType
 * @param {GeoJSON} value any GeoJSON object
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} if value is not the expected type.
 */
function geojsonType(value, type, name) {
    if (!type || !name) {
        throw new Error("type and name required");
    }
    if (!value || value.type !== type) {
        throw new Error("Invalid input to " + name + ": must be a " + type + ", given " + value.type);
    }
}
exports.geojsonType = geojsonType;
/**
 * Enforce expectations about types of {@link Feature} inputs for Turf.
 * Internally this uses {@link geojsonType} to judge geometry types.
 *
 * @name featureOf
 * @param {Feature} feature a feature with an expected geometry type
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} error if value is not the expected type.
 */
function featureOf(feature, type, name) {
    if (!feature) {
        throw new Error("No feature passed");
    }
    if (!name) {
        throw new Error(".featureOf() requires a name");
    }
    if (!feature || feature.type !== "Feature" || !feature.geometry) {
        throw new Error("Invalid input to " + name + ", Feature with geometry required");
    }
    if (!feature.geometry || feature.geometry.type !== type) {
        throw new Error("Invalid input to " + name + ": must be a " + type + ", given " + feature.geometry.type);
    }
}
exports.featureOf = featureOf;
/**
 * Enforce expectations about types of {@link FeatureCollection} inputs for Turf.
 * Internally this uses {@link geojsonType} to judge geometry types.
 *
 * @name collectionOf
 * @param {FeatureCollection} featureCollection a FeatureCollection for which features will be judged
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} if value is not the expected type.
 */
function collectionOf(featureCollection, type, name) {
    if (!featureCollection) {
        throw new Error("No featureCollection passed");
    }
    if (!name) {
        throw new Error(".collectionOf() requires a name");
    }
    if (!featureCollection || featureCollection.type !== "FeatureCollection") {
        throw new Error("Invalid input to " + name + ", FeatureCollection required");
    }
    for (var _i = 0, _a = featureCollection.features; _i < _a.length; _i++) {
        var feature = _a[_i];
        if (!feature || feature.type !== "Feature" || !feature.geometry) {
            throw new Error("Invalid input to " + name + ", Feature with geometry required");
        }
        if (!feature.geometry || feature.geometry.type !== type) {
            throw new Error("Invalid input to " + name + ": must be a " + type + ", given " + feature.geometry.type);
        }
    }
}
exports.collectionOf = collectionOf;
/**
 * Get Geometry from Feature or Geometry Object
 *
 * @param {Feature|Geometry} geojson GeoJSON Feature or Geometry Object
 * @returns {Geometry|null} GeoJSON Geometry Object
 * @throws {Error} if geojson is not a Feature or Geometry Object
 * @example
 * var point = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [110, 40]
 *   }
 * }
 * var geom = turf.getGeom(point)
 * //={"type": "Point", "coordinates": [110, 40]}
 */
function getGeom(geojson) {
    if (geojson.type === "Feature") {
        return geojson.geometry;
    }
    return geojson;
}
exports.getGeom = getGeom;
/**
 * Get GeoJSON object's type, Geometry type is prioritize.
 *
 * @param {GeoJSON} geojson GeoJSON object
 * @param {string} [name="geojson"] name of the variable to display in error message
 * @returns {string} GeoJSON type
 * @example
 * var point = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [110, 40]
 *   }
 * }
 * var geom = turf.getType(point)
 * //="Point"
 */
function getType(geojson, name) {
    if (geojson.type === "FeatureCollection") {
        return "FeatureCollection";
    }
    if (geojson.type === "GeometryCollection") {
        return "GeometryCollection";
    }
    if (geojson.type === "Feature" && geojson.geometry !== null) {
        return geojson.geometry.type;
    }
    return geojson.type;
}
exports.getType = getType;

},{"@turf/helpers":6}],8:[function(require,module,exports){
module.exports={"timezones":["Africa/Abidjan","Africa/Accra","Africa/Addis_Ababa","Africa/Algiers","Africa/Asmara","Africa/Bamako","Africa/Bangui","Africa/Banjul","Africa/Bissau","Africa/Blantyre","Africa/Brazzaville","Africa/Bujumbura","Africa/Cairo","Africa/Casablanca","Africa/Ceuta","Africa/Conakry","Africa/Dakar","Africa/Dar_es_Salaam","Africa/Djibouti","Africa/Douala","Africa/El_Aaiun","Africa/Freetown","Africa/Gaborone","Africa/Harare","Africa/Johannesburg","Africa/Juba","Africa/Kampala","Africa/Khartoum","Africa/Kigali","Africa/Kinshasa","Africa/Lagos","Africa/Libreville","Africa/Lome","Africa/Luanda","Africa/Lubumbashi","Africa/Lusaka","Africa/Malabo","Africa/Maputo","Africa/Maseru","Africa/Mbabane","Africa/Mogadishu","Africa/Monrovia","Africa/Nairobi","Africa/Ndjamena","Africa/Niamey","Africa/Nouakchott","Africa/Ouagadougou","Africa/Porto-Novo","Africa/Sao_Tome","Africa/Tripoli","Africa/Tunis","Africa/Windhoek","America/Adak","America/Anchorage","America/Anguilla","America/Antigua","America/Aruba","America/Araguaina","America/Argentina/Buenos_Aires","America/Argentina/Catamarca","America/Argentina/Cordoba","America/Argentina/Jujuy","America/Argentina/La_Rioja","America/Argentina/Mendoza","America/Argentina/Rio_Gallegos","America/Argentina/Salta","America/Argentina/San_Juan","America/Argentina/San_Luis","America/Argentina/Tucuman","America/Argentina/Ushuaia","America/Asuncion","America/Atikokan","America/Bahia","America/Bahia_Banderas","America/Barbados","America/Belem","America/Belize","America/Blanc-Sablon","America/Boa_Vista","America/Bogota","America/Boise","America/Cambridge_Bay","America/Campo_Grande","America/Cancun","America/Caracas","America/Cayenne","America/Cayman","America/Chicago","America/Chihuahua","America/Costa_Rica","America/Creston","America/Cuiaba","America/Curacao","America/Danmarkshavn","America/Dawson","America/Dawson_Creek","America/Denver","America/Detroit","America/Dominica","America/Edmonton","America/Eirunepe","America/El_Salvador","America/Fort_Nelson","America/Fortaleza","America/Glace_Bay","America/Goose_Bay","America/Grand_Turk","America/Grenada","America/Guadeloupe","America/Guatemala","America/Guayaquil","America/Guyana","America/Halifax","America/Havana","America/Hermosillo","America/Indiana/Indianapolis","America/Indiana/Knox","America/Indiana/Marengo","America/Indiana/Petersburg","America/Indiana/Tell_City","America/Indiana/Vevay","America/Indiana/Vincennes","America/Indiana/Winamac","America/Inuvik","America/Iqaluit","America/Jamaica","America/Juneau","America/Kentucky/Louisville","America/Kentucky/Monticello","America/Kralendijk","America/La_Paz","America/Lima","America/Los_Angeles","America/Lower_Princes","America/Maceio","America/Managua","America/Manaus","America/Marigot","America/Martinique","America/Matamoros","America/Mazatlan","America/Miquelon","America/Menominee","America/Merida","America/Metlakatla","America/Mexico_City","America/Moncton","America/Monterrey","America/Montevideo","America/Montserrat","America/Nassau","America/New_York","America/Nipigon","America/Nome","America/Noronha","America/North_Dakota/Beulah","America/North_Dakota/Center","America/North_Dakota/New_Salem","America/Nuuk","America/Ojinaga","America/Panama","America/Pangnirtung","America/Paramaribo","America/Phoenix","America/Port-au-Prince","America/Port_of_Spain","America/Porto_Velho","America/Puerto_Rico","America/Punta_Arenas","America/Rainy_River","America/Rankin_Inlet","America/Recife","America/Regina","America/Resolute","America/Rio_Branco","America/Santarem","America/Santiago","America/Santo_Domingo","America/Sao_Paulo","America/Scoresbysund","America/Sitka","America/St_Barthelemy","America/St_Johns","America/St_Kitts","America/St_Lucia","America/St_Thomas","America/St_Vincent","America/Swift_Current","America/Tegucigalpa","America/Thule","America/Thunder_Bay","America/Tijuana","America/Toronto","America/Tortola","America/Vancouver","America/Whitehorse","America/Winnipeg","America/Yakutat","America/Yellowknife","Antarctica/Casey","Antarctica/Davis","Antarctica/DumontDUrville","Antarctica/Macquarie","Antarctica/Mawson","Antarctica/McMurdo","Antarctica/Palmer","Antarctica/Rothera","Antarctica/Syowa","Antarctica/Troll","Antarctica/Vostok","Arctic/Longyearbyen","Asia/Aden","Asia/Almaty","Asia/Amman","Asia/Anadyr","Asia/Aqtau","Asia/Aqtobe","Asia/Ashgabat","Asia/Atyrau","Asia/Baghdad","Asia/Bahrain","Asia/Baku","Asia/Bangkok","Asia/Barnaul","Asia/Beirut","Asia/Bishkek","Asia/Brunei","Asia/Chita","Asia/Choibalsan","Asia/Colombo","Asia/Damascus","Asia/Dhaka","Asia/Dili","Asia/Dubai","Asia/Dushanbe","Asia/Famagusta","Asia/Gaza","Asia/Hebron","Asia/Ho_Chi_Minh","Asia/Hong_Kong","Asia/Hovd","Asia/Irkutsk","Asia/Jakarta","Asia/Jayapura","Asia/Jerusalem","Asia/Kabul","Asia/Kamchatka","Asia/Karachi","Asia/Kathmandu","Asia/Khandyga","Asia/Kolkata","Asia/Krasnoyarsk","Asia/Kuala_Lumpur","Asia/Kuching","Asia/Kuwait","Asia/Macau","Asia/Magadan","Asia/Makassar","Asia/Manila","Asia/Muscat","Asia/Nicosia","Asia/Novokuznetsk","Asia/Novosibirsk","Asia/Omsk","Asia/Oral","Asia/Phnom_Penh","Asia/Pontianak","Asia/Pyongyang","Asia/Qatar","Asia/Qostanay","Asia/Qyzylorda","Asia/Riyadh","Asia/Samarkand","Asia/Sakhalin","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Srednekolymsk","Asia/Taipei","Asia/Tashkent","Asia/Tbilisi","Asia/Tehran","Asia/Thimphu","Asia/Tokyo","Asia/Tomsk","Asia/Ulaanbaatar","Asia/Urumqi","Asia/Ust-Nera","Asia/Vientiane","Asia/Vladivostok","Asia/Yakutsk","Asia/Yangon","Asia/Yekaterinburg","Asia/Yerevan","Atlantic/Azores","Atlantic/Bermuda","Atlantic/Canary","Atlantic/Cape_Verde","Atlantic/Faroe","Atlantic/Madeira","Atlantic/Reykjavik","Atlantic/South_Georgia","Atlantic/St_Helena","Atlantic/Stanley","Australia/Adelaide","Australia/Brisbane","Australia/Broken_Hill","Australia/Currie","Australia/Darwin","Australia/Eucla","Australia/Hobart","Australia/Lindeman","Australia/Lord_Howe","Australia/Melbourne","Australia/Perth","Australia/Sydney","Etc/UTC","Europe/Amsterdam","Europe/Andorra","Europe/Astrakhan","Europe/Athens","Europe/Belgrade","Europe/Berlin","Europe/Bratislava","Europe/Brussels","Europe/Bucharest","Europe/Budapest","Europe/Busingen","Europe/Chisinau","Europe/Copenhagen","Europe/Dublin","Europe/Gibraltar","Europe/Guernsey","Europe/Helsinki","Europe/Isle_of_Man","Europe/Istanbul","Europe/Jersey","Europe/Kaliningrad","Europe/Kiev","Europe/Kirov","Europe/Lisbon","Europe/Ljubljana","Europe/London","Europe/Luxembourg","Europe/Madrid","Europe/Malta","Europe/Mariehamn","Europe/Minsk","Europe/Monaco","Europe/Moscow","Europe/Oslo","Europe/Paris","Europe/Podgorica","Europe/Prague","Europe/Riga","Europe/Rome","Europe/Samara","Europe/San_Marino","Europe/Sarajevo","Europe/Saratov","Europe/Simferopol","Europe/Skopje","Europe/Sofia","Europe/Stockholm","Europe/Tallinn","Europe/Tirane","Europe/Ulyanovsk","Europe/Uzhgorod","Europe/Vaduz","Europe/Vatican","Europe/Vienna","Europe/Vilnius","Europe/Volgograd","Europe/Warsaw","Europe/Zagreb","Europe/Zaporozhye","Europe/Zurich","Indian/Antananarivo","Indian/Chagos","Indian/Christmas","Indian/Cocos","Indian/Comoro","Indian/Kerguelen","Indian/Mahe","Indian/Maldives","Indian/Mauritius","Indian/Mayotte","Indian/Reunion","Pacific/Apia","Pacific/Auckland","Pacific/Bougainville","Pacific/Chatham","Pacific/Chuuk","Pacific/Easter","Pacific/Efate","Pacific/Enderbury","Pacific/Fakaofo","Pacific/Fiji","Pacific/Funafuti","Pacific/Galapagos","Pacific/Gambier","Pacific/Guadalcanal","Pacific/Guam","Pacific/Honolulu","Pacific/Kiritimati","Pacific/Kosrae","Pacific/Kwajalein","Pacific/Majuro","Pacific/Marquesas","Pacific/Midway","Pacific/Nauru","Pacific/Niue","Pacific/Norfolk","Pacific/Noumea","Pacific/Pago_Pago","Pacific/Palau","Pacific/Pitcairn","Pacific/Pohnpei","Pacific/Port_Moresby","Pacific/Rarotonga","Pacific/Saipan","Pacific/Tahiti","Pacific/Tarawa","Pacific/Tongatapu","Pacific/Wake","Pacific/Wallis"],"lookup":{"d":{"a":{"a":{"a":{"a":{"a":{"b":{"b":{"c":"f"},"c":{"b":"f","c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f"}},"b":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","d":"f"}}},"d":{"b":{"a":{"a":"f"}},"c":{"d":{"c":"f"}}}},"b":{"a":{"a":{"b":{"a":"f","d":"f"},"c":{"a":"f"}}},"c":{"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}}},"c":{"a":{"c":{"c":{"c":"f"}}},"b":{"b":{"a":{"a":"f","b":"f","c":"f"},"c":{"c":"f"},"d":{"b":"f"}},"c":{"a":{"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[401],"d":"f"},"c":[401],"d":[401]},"d":{"b":{"c":"f"},"c":{"b":"f","c":"f","d":"f"},"d":{"d":"f"}}},"c":{"a":{"a":{"a":"f","c":"f"},"b":{"a":"f","b":[401],"c":[401],"d":"f"},"c":[401],"d":{"b":"f","c":"f"}},"b":{"a":[401],"b":{"a":[401],"b":[401],"c":"f","d":[401]},"c":{"a":"f","b":"f","d":"f"},"d":{"a":[401],"b":[401],"c":"f","d":[401]}},"c":{"a":{"a":"f","b":"f"},"d":{"c":"f","d":"f"}},"d":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":[401],"b":"f","c":"f","d":[401]},"c":{"a":"f","b":"f","d":"f"},"d":{"a":"f","b":[401],"c":"f","d":"f"}}},"d":{"a":{"c":{"d":"f"},"d":{"c":"f"}},"b":{"b":{"b":"f"},"d":{"d":"f"}},"c":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"b":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[401],"c":"f","d":"f"}}}},"d":{"a":{"a":{"b":{"b":"f","c":"f"},"c":{"c":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"b":"f","c":"f","d":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"d":{"a":"f","b":"f","c":"f","d":"f"}}}}},"b":{"a":{"a":{"c":{"c":{"b":"f","c":"f","d":"f"}}},"b":{"a":{"c":{"c":"f","d":"f"}},"b":{"c":{"c":"f"},"d":{"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[418]},"b":{"a":"f","b":"f","c":[418],"d":"f"},"c":[418],"d":[418]},"d":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[418],"c":[418],"d":[418]},"c":[418],"d":{"a":"f","b":[418],"c":[418],"d":[418]}}},"c":[418],"d":{"a":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":[390]},"b":{"a":"f","b":[418],"c":[418],"d":[418]},"c":[418],"d":{"a":[390],"b":"f","c":"f","d":[390]}},"c":{"a":{"a":[390],"b":"f","c":"f","d":[390]},"b":[418],"c":{"a":"f","b":[418],"c":"f","d":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[390],"d":"f"},"c":{"a":"f","b":[390],"c":[390],"d":"f"},"d":{"a":"f","b":"f"}}}},"b":{"a":{"a":{"a":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[418]},"d":{"a":"f","b":"f","c":[418],"d":"f"}},"b":{"d":{"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"c":{"b":"f","c":"f","d":"f"},"d":{"a":[418],"b":"f","c":"f","d":[418]}},"d":[418]},"b":{"a":{"c":{"c":"f","d":"f"}},"b":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[243],"c":[243],"d":[243]},"d":{"a":"f","b":"f","c":[243],"d":"f"}},"c":[243],"d":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[243],"c":[243],"d":[243]},"c":[243],"d":{"a":"f","b":[243],"c":[243],"d":[243]}}},"c":{"a":[243],"b":[243],"c":{"a":[243],"b":{"a":[243],"b":[243],"c":[243],"d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"a":[243],"b":"f","c":"f","d":"f"}},"d":[243]},"d":{"a":[418],"b":{"a":{"a":[418],"b":"f","c":[418],"d":[418]},"b":{"a":[418],"b":"f","c":"f","d":[418]},"c":{"a":[418],"b":"f","c":"f","d":[418]},"d":[418]},"c":{"a":[418],"b":{"a":[418],"b":"f","c":"f","d":[418]},"c":{"a":[418],"b":"f","c":"f","d":[418]},"d":[418]},"d":[418]}},"c":{"a":{"a":[418],"b":{"a":[418],"b":{"a":[418],"b":"f","c":"f","d":[418]},"c":{"a":[418],"b":"f","c":"f","d":[418]},"d":[418]},"c":{"a":[418],"b":{"a":[418],"b":"f","c":"f","d":[418]},"c":{"a":[418],"b":"f","c":"f","d":[418]},"d":[418]},"d":{"a":[418],"b":[418],"c":{"a":"f","b":"f","c":"f"},"d":{"a":[418],"b":"f","c":"f","d":"f"}}},"b":{"a":{"a":[243],"b":{"a":[243],"b":"f","c":"f","d":[243]},"c":{"a":[243],"b":"f","c":"f","d":[243]},"d":[243]},"b":{"a":{"a":"f"},"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"c":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":[243],"b":{"a":[243],"b":"f","c":[243],"d":[243]},"c":[243],"d":[243]}},"c":{"a":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f","b":"f"},"d":{"a":"f"}},"b":{"a":{"a":"f"}},"c":{"d":{"c":"f"}}},"d":{"a":{"a":{"a":"f"},"b":{"b":"f","c":"f"},"c":{"a":"f","b":"f","c":"f"}},"b":{"a":[418],"b":{"a":[418],"b":"f","c":"f","d":[418]},"c":{"a":"f","b":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"b":{"b":"f"},"c":{"b":"f"}}}},"d":{"a":{"a":{"a":{"c":"f"},"b":{"a":"f","b":[390],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[401],"d":"f"}},"b":{"a":{"a":"f","d":"f"},"b":{"b":"f"}},"d":{"a":[401],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[401],"b":[401],"c":"f","d":[401]}}},"b":{"a":{"a":{"a":"f","b":[418],"c":"f","d":"f"},"b":{"a":[418],"b":[418],"c":"f","d":[418]},"c":{"a":"f","b":"f"},"d":{"b":"f"}},"b":{"a":[418],"b":[418],"c":[418],"d":{"a":"f","b":[418],"c":"f","d":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[418],"c":[418],"d":{"a":"f","b":"f","c":[418],"d":"f"}},"d":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":[418],"c":[418],"d":[418]},"b":{"a":[418],"b":"f","c":[418],"d":[418]},"c":[418],"d":[418]},"b":{"a":{"a":"f","b":[418],"c":[418],"d":[418]},"b":{"a":[418],"b":"f","c":"f","d":[418]},"c":{"a":[418],"b":"f","c":"f","d":"f"},"d":[418]},"c":{"a":{"a":[418],"b":[418],"c":"f","d":"f"},"b":{"a":"f","d":"f"}},"d":{"a":[418],"b":{"a":[418],"b":[418],"c":"f","d":[418]},"c":{"a":"f","b":"f","d":"f"},"d":{"a":[418],"b":[418],"c":"f","d":[418]}}},"d":{"a":{"a":{"a":"f","b":"f","d":"f"}},"b":{"a":{"c":"f"},"b":{"a":"f","b":"f","c":[418],"d":"f"},"c":{"a":[418],"b":[418],"c":[418],"d":"f"},"d":{"b":"f","c":"f"}},"c":{"b":{"a":"f","b":[418],"c":[418],"d":"f"},"c":{"a":"f","b":[418],"c":[418],"d":[418]},"d":{"b":"f","c":"f","d":"f"}}}}},"c":{"a":{"a":{"b":{"a":{"a":"f","b":[418],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f"}}},"c":{"c":{"c":{"c":"f"}}}},"b":{"a":{"a":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f"}},"b":{"a":{"a":"f","b":"f","c":[305],"d":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[305]},"c":{"a":[305],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[305]},"d":{"b":{"b":"f","c":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}}},"b":{"b":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[308],"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[308],"c":[308],"d":{"b":"f","c":"f"}}},"c":{"b":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":[308],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[308],"d":"f"},"d":{"c":"f"}},"c":{"a":{"a":"f","b":"f","c":[308],"d":"f"},"b":[308],"c":[308],"d":{"a":"f","b":[308],"c":[308],"d":[308]}},"d":{"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f","d":"f"}}},"d":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[305],"c":[305],"d":[305]},"c":[305],"d":{"a":"f","b":"f","c":"f"}},"b":{"a":[305],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[305]},"c":{"a":[305],"b":{"a":"f","c":"f","d":"f"},"c":{"a":[305],"b":"f","c":"f","d":[305]},"d":[305]},"d":{"a":{"a":"f","b":"f","c":"f"},"b":[305],"c":[305],"d":{"a":"f","b":"f","c":[305],"d":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","b":[305],"c":[305],"d":"f"},"b":[305],"c":[305],"d":{"a":"f","b":[305],"c":[305],"d":"f"}},"b":{"a":[305],"b":{"a":[305],"b":"f","c":"f","d":[305]},"c":[305],"d":[305]},"c":[305],"d":[305]},"b":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":[305],"b":"f","c":"f","d":[305]},"c":{"a":[305],"b":"f","c":"f","d":[305]},"d":{"a":"f","b":[305],"c":[305],"d":[305]}},"b":[308],"c":[308],"d":{"a":[305],"b":{"a":[305],"b":"f","c":"f","d":[305]},"c":{"a":[305],"b":"f","c":"f","d":[305]},"d":[305]}},"c":{"a":{"a":[305],"b":{"a":[305],"b":"f","c":"f","d":[305]},"c":{"a":[305],"b":"f","c":"f","d":[305]},"d":[305]},"b":[308],"c":[308],"d":{"a":[305],"b":{"a":[305],"b":"f","c":"f","d":[305]},"c":{"a":[305],"b":"f","c":"f","d":[305]},"d":[305]}},"d":[305]},"d":{"b":{"b":{"b":{"b":"f"},"c":{"b":"f","c":"f","d":"f"}},"c":{"b":{"a":"f","b":"f","c":"f"},"c":{"a":"f","b":"f","c":[305],"d":"f"},"d":{"c":"f","d":"f"}},"d":{"c":{"c":"f"}}},"c":{"a":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":[305],"d":"f"},"b":[305],"c":[305],"d":{"a":"f","b":[305],"c":[305],"d":[305]}},"c":[305],"d":{"a":{"a":"f","c":"f","d":"f"},"b":{"a":"f","b":[305],"c":[305],"d":"f"},"c":[305],"d":{"a":"f","b":"f","c":"f"}}},"d":{"b":{"c":{"c":"f","d":"f"}},"c":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"b":"f","d":"f"}}}}},"d":{"a":{"a":{"a":{"c":{"b":"f","c":"f"}},"b":{"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f"}},"d":{"b":{"b":"f"}}},"b":{"b":{"a":{"c":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}}},"c":{"c":{"c":{"c":"f"}}},"d":{"c":{"d":{"d":"f"}},"d":{"a":{"a":"f","c":"f","d":"f"},"b":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[397]},"d":[397]}}},"b":{"a":{"a":{"b":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":[394]},"c":{"a":[394],"b":"f","c":"f","d":[394]},"d":{"b":"f","c":"f","d":"f"}}},"b":{"a":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"b":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"}},"d":{"b":{"b":"f","c":"f"}}},"d":{"a":{"a":{"a":"f","b":[394],"c":[394],"d":"f"},"b":{"a":[394],"b":"f","c":"f","d":[394]},"c":{"a":[394],"b":"f","c":"f","d":[394]},"d":{"a":"f","b":[394],"c":[394],"d":"f"}},"d":{"a":{"a":"f","b":[394],"c":[394],"d":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":[394],"c":"f","d":"f"}}}},"c":{"a":{"a":{"a":{"a":[394],"b":"f","c":"f","d":[394]},"d":{"a":"f","b":"f","d":"f"}},"b":{"c":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[413],"c":[413],"d":"f"},"d":{"d":"f"}},"d":{"a":{"a":"f","d":"f"},"c":{"c":"f"}}},"b":{"a":{"d":{"a":"f","d":"f"}},"c":{"a":{"c":"f"},"b":{"c":"f","d":"f"},"c":{"a":[413],"b":"f","c":"f","d":[413]},"d":{"b":"f","c":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}}},"c":{"a":{"a":{"a":"f"}},"b":{"a":{"b":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"}}},"d":{"a":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":[413]},"c":{"a":"f","b":"f","d":"f"},"d":{"a":"f","b":"f","c":[413],"d":"f"}},"c":{"a":{"a":[413],"b":"f","c":"f","d":"f"},"b":{"a":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[413],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}}}},"d":{"a":{"a":[397],"b":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f"}},"d":{"a":[397],"b":{"a":[397],"b":"f","c":"f","d":[397]},"c":{"a":[397],"b":"f","c":"f","d":"f"},"d":{"a":[397],"b":[397],"c":"f","d":"f"}}},"b":{"b":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"c":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[394]},"d":{"b":"f","c":"f"}}},"c":{"b":{"a":{"b":"f","c":"f"},"b":{"a":[394],"b":"f","c":"f","d":"f"},"c":{"a":"f"}},"c":{"c":{"c":"f"},"d":{"a":"f","d":"f"}},"d":{"c":{"c":"f","d":"f"}}},"d":{"a":{"a":{"a":"f"}},"c":{"b":{"c":"f"},"c":{"b":"f"}}}}}},"b":{"a":{"a":{"a":{"a":{"a":[243],"b":{"a":[243],"b":"f","c":[243],"d":[243]},"c":[243],"d":[243]},"b":{"a":{"a":"f","b":[243],"c":[243],"d":[243]},"b":[243],"c":[243],"d":[243]},"c":[243],"d":[243]},"b":{"a":[243],"b":{"a":{"a":[243],"b":"f","c":[243],"d":[243]},"b":{"a":"f","b":[257],"c":[257],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[243]},"d":[243]},"c":{"a":[243],"b":{"a":[243],"b":"f","c":"f","d":[243]},"c":{"a":[243],"b":"f","c":"f","d":"f"},"d":[243]},"d":[243]},"c":{"a":[243],"b":{"a":[243],"b":{"a":"f","b":[257],"c":[257],"d":"f"},"c":{"a":"f","b":[257],"c":[257],"d":"f"},"d":{"a":[243],"b":[243],"c":"f","d":[243]}},"c":{"a":{"a":[243],"b":"f","c":"f","d":[243]},"b":[257],"c":[257],"d":{"a":[243],"b":"f","c":"f","d":[243]}},"d":[243]},"d":[243]},"b":{"a":[257],"b":{"a":{"a":[257],"b":{"a":[257],"b":"f","c":"f","d":[257]},"c":{"a":[257],"b":"f","c":"f","d":[257]},"d":[257]},"b":{"a":{"a":"f","b":[266],"c":[266],"d":"f"},"b":[266],"c":[266],"d":[266]},"c":{"a":{"a":[266],"b":[266],"c":[266],"d":"f"},"b":[266],"c":[266],"d":{"a":"f","b":[266],"c":[266],"d":"f"}},"d":{"a":[257],"b":{"a":[257],"b":"f","c":"f","d":[257]},"c":{"a":[257],"b":"f","c":[257],"d":[257]},"d":[257]}},"c":{"a":[257],"b":{"a":{"a":"f","b":"f","c":"f","d":[257]},"b":[266],"c":[266],"d":{"a":[257],"b":"f","c":"f","d":[257]}},"c":{"a":{"a":[257],"b":"f","c":"f","d":[257]},"b":[266],"c":{"a":"f","b":"f","c":[242],"d":[242]},"d":{"a":"f","b":"f","c":[242],"d":[242]}},"d":{"a":[257],"b":[257],"c":{"a":[257],"b":"f","c":"f","d":"f"},"d":[257]}},"d":[257]},"c":{"a":[257],"b":{"a":{"a":[257],"b":{"a":"f","b":[242],"c":[242],"d":"f"},"c":{"a":"f","b":[242],"c":[242],"d":"f"},"d":[257]},"b":[242],"c":{"a":{"a":[242],"b":[242],"c":[242],"d":"f"},"b":[242],"c":[242],"d":{"a":"f","b":"f","c":"f","d":[257]}},"d":{"a":[257],"b":{"a":"f","b":[242],"c":"f","d":"f"},"c":[257],"d":[257]}},"c":{"a":{"a":[257],"b":{"a":[257],"b":[257],"c":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"}}},"d":{"a":[257],"b":{"a":[257],"b":{"a":[257],"b":[257],"c":"f","d":[257]},"c":{"a":[257],"b":"f","c":"f","d":"f"},"d":[257]},"c":{"a":{"a":[257],"b":[257],"c":"f","d":"f"},"b":{"a":"f","d":"f"},"d":{"a":"f"}},"d":{"a":[257],"b":[257],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":[257],"c":"f","d":"f"}}}},"d":{"a":{"a":{"a":[243],"b":{"a":[243],"b":[243],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[243],"b":[243],"c":"f","d":"f"}},"b":[243],"c":{"a":{"a":"f","b":[243],"c":[243],"d":"f"},"b":[243],"c":{"a":[243],"b":[243],"c":"f","d":[243]},"d":{"a":"f","b":[243],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f"},"b":{"b":"f"}}},"b":{"a":[243],"b":{"a":{"a":[243],"b":"f","c":"f","d":[243]},"b":[257],"c":[257],"d":{"a":[243],"b":"f","c":"f","d":[243]}},"c":{"a":{"a":[243],"b":"f","c":"f","d":[243]},"b":[257],"c":[257],"d":{"a":[243],"b":"f","c":"f","d":"f"}},"d":{"a":[243],"b":[243],"c":{"a":[243],"b":[243],"c":"f","d":"f"},"d":[243]}},"c":{"a":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":[232],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[257],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}},"c":{"b":{"a":"f","b":[257],"c":"f","d":"f"},"c":{"b":"f"}}},"d":{"b":{"a":{"b":"f"},"b":{"a":"f","b":"f"}},"c":{"c":{"d":"f"},"d":{"c":"f","d":"f"}},"d":{"c":{"a":"f","c":"f","d":"f"}}}}},"b":{"a":{"a":{"a":[266],"b":{"a":[266],"b":{"a":"f","b":[242],"c":[242],"d":"f"},"c":{"a":"f","b":[242],"c":[242],"d":"f"},"d":{"a":[266],"b":[266],"c":"f","d":[266]}},"c":{"a":{"a":[266],"b":"f","c":"f","d":"f"},"b":[242],"c":[242],"d":{"a":"f","b":[242],"c":[242],"d":"f"}},"d":[266]},"b":[242],"c":{"a":[242],"b":[242],"c":{"a":[242],"b":{"a":[242],"b":[242],"c":"f","d":[242]},"c":{"a":[242],"b":"f","c":"f","d":"f"},"d":{"a":[242],"b":[242],"c":"f","d":"f"}},"d":[242]},"d":{"a":[266],"b":{"a":{"a":"f","b":[242],"c":[242],"d":"f"},"b":[242],"c":[242],"d":{"a":"f","b":[242],"c":[242],"d":"f"}},"c":{"a":{"a":"f","b":[242],"c":[242],"d":[242]},"b":[242],"c":[242],"d":[242]},"d":{"a":{"a":[266],"b":[266],"c":"f","d":"f"},"b":{"a":[266],"b":"f","c":"f","d":"f"},"c":[242],"d":{"a":"f","b":[242],"c":[242],"d":[242]}}}},"b":{"a":{"a":{"a":[242],"b":[242],"c":{"a":[242],"b":[242],"c":"f","d":[242]},"d":[242]},"b":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":[242],"b":{"a":[242],"b":"f","c":"f","d":[242]},"c":{"a":"f","b":"f","d":"f"},"d":[242]}},"d":{"a":{"a":{"a":[242],"b":"f","c":"f","d":[242]},"b":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"}}}},"d":{"a":{"a":[242],"b":[242],"c":{"a":[242],"b":{"a":[242],"b":[242],"c":"f","d":[242]},"c":{"a":"f","b":"f"},"d":{"a":"f","b":"f"}},"d":{"a":[242],"b":[242],"c":{"a":[242],"b":"f","c":"f","d":"f"},"d":[242]}},"b":{"a":{"a":[242],"b":{"a":[242],"b":"f","c":"f","d":[242]},"c":{"a":"f","b":"f","d":"f"},"d":[242]},"b":{"a":{"a":"f","b":"f"},"b":{"a":"f"}},"d":{"a":{"a":[242],"b":"f","c":"f","d":"f"},"b":{"a":"f"}}},"c":{"d":{"a":{"c":"f"},"b":{"d":"f"},"c":{"a":"f"},"d":{"b":"f"}}},"d":{"a":{"a":{"a":"f","b":"f"},"b":{"a":"f"}}}}},"c":{"b":{"a":{"b":{"a":{"c":"f"},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":{"b":"f","c":"f"}}}}},"d":{"a":{"a":{"a":{"a":{"c":"f","d":"f"},"b":{"a":"f","b":[308],"c":[308],"d":"f"},"c":[308],"d":{"a":"f","b":[308],"c":[308],"d":[308]}},"b":{"a":{"a":[308],"b":"f","c":[308],"d":[308]},"b":{"a":"f","b":"f","c":"f","d":[308]},"c":{"a":"f","b":"f","d":"f"},"d":[308]},"c":{"a":[308],"b":{"a":"f","b":"f","c":"f","d":[308]},"c":{"a":[308],"b":"f","c":"f","d":[308]},"d":[308]},"d":[308]},"b":{"c":{"d":{"a":"f","c":"f","d":"f"}},"d":{"c":{"b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","c":"f","d":"f"},"b":{"a":"f","b":[314],"c":[314],"d":"f"},"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"b":{"a":{"a":[314],"b":"f","c":[314],"d":[314]},"b":{"a":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[314]},"d":[314]},"c":{"a":[314],"b":{"a":[314],"b":"f","c":[314],"d":[314]},"c":[314],"d":[314]},"d":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}}},"d":{"a":[308],"b":{"a":[308],"b":{"a":[308],"b":"f","c":[308],"d":[308]},"c":[308],"d":[308]},"c":[308],"d":[308]}},"b":{"a":{"d":{"c":{"a":"f","d":"f"},"d":{"d":"f"}}},"d":{"a":{"a":{"a":"f"},"b":{"a":"f"},"d":{"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","d":"f"},"c":{"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[314]}}}},"c":{"a":{"a":{"a":{"a":[314],"b":"f","c":[314],"d":[314]},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[314]},"b":{"b":{"a":"f","d":"f"},"c":{"a":"f"}},"c":{"c":{"d":"f"},"d":{"d":"f"}},"d":{"a":[314],"b":{"a":"f","c":"f","d":"f"},"c":{"a":[314],"b":"f","c":"f","d":[314]},"d":[314]}},"c":{"a":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[314],"d":[314]},"d":{"a":"f","b":"f","c":[314],"d":[314]}},"b":{"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[314],"b":"f","c":[314],"d":[314]}},"d":[314]},"d":{"a":[314],"b":{"a":{"a":"f","b":"f","c":[314],"d":[314]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[314],"d":[314]},"c":[314],"d":[314]}},"d":{"a":[308],"b":{"a":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"b":[314],"c":[314],"d":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"b":[314],"c":[314],"d":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}}},"d":[308]}}},"c":{"a":{"a":{"a":[308],"b":{"a":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"b":[314],"c":[314],"d":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"b":[314],"c":[314],"d":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}}},"d":{"a":{"a":{"a":[308],"b":[308],"c":"f","d":"f"},"b":{"a":[308],"b":[308],"c":"f","d":"f"},"c":[304],"d":[304]},"b":{"a":{"a":[308],"b":[308],"c":"f","d":"f"},"b":{"a":[308],"b":[308],"c":"f","d":"f"},"c":[304],"d":[304]},"c":[304],"d":[304]}},"b":{"a":[314],"b":{"a":[314],"b":{"a":[314],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[314]},"c":{"a":[314],"b":{"a":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[314]},"d":[314]},"d":[314]},"c":{"a":[314],"b":{"a":[314],"b":{"a":[314],"b":"f","c":"f","d":[314]},"c":{"a":"f","b":"f","d":"f"},"d":[314]},"c":{"a":{"a":[314],"b":[314],"c":"f","d":[314]},"b":{"a":"f","d":"f"},"d":{"a":[314],"b":"f","c":"f","d":[314]}},"d":[314]},"d":[314]},"c":{"a":[314],"b":{"a":[314],"b":{"a":{"a":[314],"b":"f","c":"f","d":[314]},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":[314]},"c":{"a":{"a":[314],"b":{"a":[314],"b":"f","c":"f","d":[314]},"c":{"a":[314],"b":"f","c":"f","d":[314]},"d":[314]},"b":{"a":{"a":"f"}},"c":{"d":{"d":"f"}},"d":{"a":[314],"b":{"a":[314],"b":"f","c":"f","d":[314]},"c":{"a":[314],"b":"f","c":"f","d":[314]},"d":[314]}},"d":[314]},"d":{"a":[304],"b":{"a":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"b":[314],"c":[314],"d":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[314],"c":"f","d":"f"},"b":{"a":[314],"b":[314],"c":"f","d":"f"},"c":{"a":[309],"b":[309],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":[314],"b":[314],"c":"f","d":"f"},"b":[314],"c":[314],"d":{"a":[309],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":[314],"b":[314],"c":"f","d":"f"},"c":{"b":"f","c":"f"}},"d":{"b":{"b":"f"}}},"d":{"a":{"a":[304],"b":[304],"c":{"a":[304],"b":[304],"c":"f","d":"f"},"d":[304]},"b":{"a":{"a":[304],"b":[304],"c":"f","d":[304]},"b":{"a":[304],"b":[304],"c":"f","d":"f"},"c":{"a":"f","b":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":[304],"b":[304],"c":"f","d":[304]},"b":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}}}},"d":{"a":{"a":{"a":{"a":{"a":"f","b":"f"},"d":{"a":"f","d":"f"}}},"b":{"b":{"b":{"b":"f","c":"f"}}}},"b":{"a":{"a":{"a":{"a":"f","b":[314],"c":"f","d":"f"},"b":{"a":[314],"b":"f","c":"f","d":"f"},"c":{"a":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[314],"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}}},"b":{"a":{"a":[314],"b":{"a":[314],"b":[314],"c":"f","d":[314]},"c":{"a":[314],"b":"f","c":"f","d":"f"},"d":{"a":[314],"b":[314],"c":"f","d":"f"}},"b":{"a":{"a":"f","d":"f"},"d":{"a":"f"}},"d":{"a":{"a":"f"}}}}}},"d":{"a":{"a":{"b":{"a":{"b":{"a":"f","b":"f"}},"b":{"a":{"a":"f"},"b":{"b":"f"}}}},"b":{"a":{"a":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":[413],"b":"f","c":"f","d":"f"},"c":{"a":"f"}}}},"c":{"a":{"a":{"a":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"b":{"a":{"b":"f","c":"f"},"b":{"d":"f"},"c":{"a":"f"},"d":{"b":"f"}}}}},"b":{"a":{"a":{"b":{"b":{"c":"f"},"c":{"b":"f","c":"f"}},"c":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[305],"d":"f"},"d":{"b":"f","c":"f"}}},"b":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":[305],"c":[305],"d":{"a":"f","b":"f","c":[305],"d":"f"}},"b":[305],"c":[305],"d":{"a":{"a":"f","b":[305],"c":[305],"d":[305]},"b":[305],"c":[305],"d":[305]}},"c":[305],"d":{"b":{"b":{"a":"f","b":[305],"c":[305],"d":"f"},"c":{"a":"f","b":[305],"c":[305],"d":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":[305],"c":[305],"d":[305]},"c":[305],"d":{"b":"f","c":"f"}}}},"b":{"a":[305],"b":{"a":{"a":[305],"b":{"a":[305],"b":"f","c":"f","d":[305]},"c":{"a":[305],"b":"f","c":"f","d":[305]},"d":[305]},"b":[308],"c":[308],"d":{"a":[305],"b":{"a":[305],"b":"f","c":"f","d":[305]},"c":{"a":[305],"b":"f","c":"f","d":[305]},"d":[305]}},"c":{"a":{"a":{"a":[305],"b":[305],"c":"f","d":"f"},"b":{"a":[305],"b":"f","c":"f","d":"f"},"c":[304],"d":[304]},"b":{"a":{"a":[308],"b":[308],"c":"f","d":"f"},"b":{"a":[308],"b":[308],"c":"f","d":"f"},"c":[304],"d":[304]},"c":[304],"d":[304]},"d":{"a":[305],"b":{"a":[305],"b":{"a":[305],"b":[305],"c":"f","d":[305]},"c":{"a":[305],"b":"f","c":"f","d":[305]},"d":[305]},"c":{"a":[305],"b":{"a":[305],"b":"f","c":"f","d":[305]},"c":{"a":[305],"b":"f","c":"f","d":[305]},"d":[305]},"d":[305]}},"c":{"a":{"a":{"a":[305],"b":[305],"c":{"a":"f","b":"f","c":[315],"d":[315]},"d":{"a":"f","b":"f","c":[315],"d":[315]}},"b":{"a":[305],"b":{"a":[305],"b":"f","c":"f","d":[305]},"c":{"a":"f","b":"f","c":"f","d":[315]},"d":{"a":"f","b":"f","c":[315],"d":[315]}},"c":{"a":[315],"b":{"a":[315],"b":"f","c":"f","d":[315]},"c":{"a":[315],"b":"f","c":"f","d":[315]},"d":[315]},"d":[315]},"b":[304],"c":[304],"d":{"a":[315],"b":{"a":[315],"b":{"a":[315],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[315]},"c":{"a":[315],"b":{"a":[315],"b":"f","c":"f","d":[315]},"c":{"a":[315],"b":"f","c":"f","d":[315]},"d":[315]},"d":[315]}},"d":{"a":{"b":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":[315]},"c":{"a":[315],"b":"f","c":[315],"d":[315]},"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":[315],"b":[315],"c":[315],"d":"f"},"c":{"a":"f","b":[315],"c":[315],"d":"f"},"d":{"b":"f"}}},"b":{"a":{"a":{"a":[305],"b":[305],"c":"f","d":[305]},"b":{"a":[305],"b":[305],"c":"f","d":"f"},"c":{"a":[315],"b":"f","c":[315],"d":[315]},"d":{"a":"f","b":"f","c":[315],"d":[315]}},"b":{"a":[305],"b":[305],"c":{"a":"f","b":"f","c":[315],"d":[315]},"d":{"a":"f","b":"f","c":[315],"d":[315]}},"c":[315],"d":[315]},"c":{"a":[315],"b":[315],"c":[315],"d":{"a":{"a":[315],"b":[315],"c":[315],"d":"f"},"b":[315],"c":[315],"d":{"a":"f","b":[315],"c":[315],"d":"f"}}},"d":{"b":{"b":{"a":"f","b":[315],"c":[315],"d":"f"},"c":{"a":"f","b":[315],"c":"f","d":"f"}},"c":{"b":{"a":"f","b":"f","c":"f"}}}}},"c":{"a":{"b":{"a":{"a":{"a":"f","b":[315],"c":"f","d":"f"},"b":[315],"c":[315],"d":{"b":"f","c":"f"}},"b":[315],"c":{"a":[315],"b":[315],"c":{"a":"f","b":"f","c":[313],"d":[313]},"d":{"a":[315],"b":"f","c":"f","d":[315]}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":[315],"c":[315],"d":"f"},"c":{"a":"f","b":[315],"c":[315],"d":"f"}}},"c":{"a":{"b":{"a":"f","b":[315],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":[313],"d":"f"},"b":[313],"c":[313],"d":{"a":[313],"b":[313],"c":"f","d":"f"}},"c":{"a":{"b":"f"},"b":{"a":"f","b":[313],"c":"f","d":"f"},"c":{"b":"f","c":"f","d":"f"}}}},"b":{"a":{"a":[315],"b":{"a":{"a":[315],"b":"f","c":"f","d":[315]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[313],"b":"f","c":"f","d":[313]},"d":{"a":"f","b":"f","c":[313],"d":"f"}},"c":{"a":{"a":"f","b":[313],"c":[313],"d":[313]},"b":{"a":[313],"b":"f","c":"f","d":[313]},"c":{"a":[313],"b":"f","c":"f","d":[313]},"d":[313]},"d":{"a":{"a":[315],"b":[315],"c":"f","d":"f"},"b":{"a":[315],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[313],"c":[313],"d":[313]},"d":{"a":"f","b":"f","c":[313],"d":[313]}}},"b":{"a":[304],"b":{"a":[304],"b":{"a":[304],"b":"f","c":"f","d":[304]},"c":{"a":[304],"b":"f","c":"f","d":"f"},"d":[304]},"c":{"a":{"a":[304],"b":[304],"c":"f","d":[304]},"b":{"a":"f","d":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":[304],"b":[304],"c":"f","d":[304]},"b":{"a":[304],"b":[304],"c":"f","d":"f"},"c":{"b":"f"},"d":{"a":[304],"b":"f","c":"f","d":[304]}}},"c":{"a":{"a":{"a":[304],"b":"f","c":"f","d":[304]},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":"f"}}},"d":{"a":[313],"b":{"a":[313],"b":{"a":[313],"b":"f","c":"f","d":[313]},"c":{"a":[313],"b":"f","c":"f","d":[313]},"d":[313]},"c":{"a":{"a":[313],"b":[313],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f"}},"d":{"a":{"a":[313],"b":[313],"c":"f","d":[313]},"b":{"a":[313],"b":[313],"c":"f","d":"f"},"c":{"b":"f","c":"f"},"d":{"a":"f","b":"f","d":"f"}}}},"c":{"a":{"a":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","d":"f"},"d":{"b":"f","c":"f"}},"d":{"a":{"a":"f","b":"f","c":[310],"d":[310]},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"a":[310],"b":"f","c":"f","d":[310]}}},"d":{"a":{"a":{"a":[310],"b":"f","c":"f","d":[310]},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":"f"}}}},"d":{"b":{"b":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[310],"d":[310]},"c":[310],"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"b":{"a":{"a":"f","b":"f","c":"f"},"b":[310],"c":{"a":[310],"b":[310],"c":[310],"d":"f"},"d":{"b":"f","c":"f"}},"c":{"b":{"a":"f","b":"f"}}}}},"d":{"a":{"a":{"b":{"c":{"c":"f"}},"c":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[389],"c":[389],"d":"f"},"d":{"c":"f"}}},"b":{"a":{"a":{"c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":[389],"d":"f"}},"d":{"a":{"a":[389],"b":"f","c":"f","d":[389]},"b":{"a":"f"},"d":{"a":[389],"b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[389]}}},"d":{"a":{"c":{"a":"f","b":"f","c":"f","d":[389]},"d":{"b":"f","c":"f"}},"b":{"a":{"b":"f","c":"f","d":"f"},"b":[389],"c":{"a":[389],"b":"f","c":"f","d":[389]},"d":{"a":"f","b":[389],"c":[389],"d":"f"}},"c":{"a":[389],"b":{"a":[389],"b":"f","c":"f","d":[389]},"c":[389],"d":[389]},"d":{"a":{"b":"f","c":"f"},"b":{"a":[389],"b":[389],"c":[389],"d":"f"},"c":{"a":"f","b":[389],"c":"f","d":"f"}}}},"c":{"d":{"d":{"a":{"a":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[389],"b":"f","c":[389],"d":[389]}}}},"d":{"a":{"a":{"b":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":[389],"b":[389],"c":[389],"d":"f"},"b":{"a":[389],"b":[389],"c":"f","d":[389]},"c":{"a":[389],"b":"f","c":"f","d":[389]},"d":{"a":"f","b":[389],"c":[389],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":[389],"b":"f","c":"f","d":[389]},"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"b":"f","c":"f","d":"f"}},"c":{"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":[389],"d":[389]},"b":{"a":[389],"b":"f","c":"f","d":[389]},"c":{"a":[389],"b":"f","c":[389],"d":[389]},"d":{"a":[389],"b":[389],"c":[389],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[389],"c":"f","d":"f"},"b":[389],"c":[389],"d":{"b":"f","c":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":[389]},"c":{"a":"f","c":"f","d":"f"},"d":{"a":[389],"b":"f","c":[389],"d":[389]}},"c":{"a":[389],"b":{"a":[389],"b":"f","c":[389],"d":[389]},"c":[389],"d":{"a":"f","b":[389],"c":[389],"d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":[389],"b":[389],"c":"f","d":"f"},"c":{"b":"f"}}}}}}},"b":{"a":{"a":{"b":{"a":{"b":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}},"b":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f"}}},"c":{"d":{"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}}},"c":{"b":{"a":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"}}}}},"b":{"b":{"d":{"a":{"a":{"c":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"c":"f"},"c":{"b":"f","c":"f"},"d":{"a":"f","b":"f","c":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"b":"f"},"d":{"d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f"}},"d":{"a":{"a":"f","d":"f"}}},"c":{"a":{"c":{"c":"f"},"d":{"a":"f","d":"f"}},"b":{"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f"}},"d":{"b":{"b":"f","c":"f"}}},"d":{"b":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"b":{"a":"f","b":"f","c":"f","d":"f"}}}},"d":{"b":{"b":{"c":{"c":"f"}},"c":{"b":{"b":"f","c":"f"}}},"c":{"c":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}}}},"c":{"a":{"c":{"d":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}}}},"b":{"b":{"a":{"a":{"c":"f"},"b":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[377]},"d":{"b":"f","c":"f","d":"f"}},"b":{"c":{"c":"f"}},"c":{"a":{"d":"f"},"b":{"b":"f","c":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":[377],"c":[377],"d":"f"},"b":{"a":[377],"b":"f","c":"f","d":[377]},"c":[377],"d":{"a":"f","b":[377],"c":[377],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[377],"c":[377],"d":"f"},"b":[377],"c":[377],"d":{"a":"f","b":[377],"c":[377],"d":[377]}},"b":{"a":{"a":"f","c":"f","d":"f"},"c":{"d":"f"},"d":{"a":[377],"b":"f","c":"f","d":[377]}},"c":{"a":[377],"b":{"a":"f","b":"f","c":[377],"d":[377]},"c":[377],"d":[377]},"d":{"a":{"a":"f","b":[377],"c":[377],"d":"f"},"b":[377],"c":[377],"d":{"a":"f","b":[377],"c":[377],"d":"f"}}},"d":{"b":{"c":{"b":"f","c":"f"}},"c":{"b":{"b":"f"}}}},"c":{"b":{"a":{"a":{"a":"f","b":[377],"c":"f","d":"f"},"b":[377],"c":[377],"d":{"b":"f","c":"f"}},"b":[377],"c":[377],"d":{"a":{"b":"f","c":"f"},"b":[377],"c":{"a":"f","b":[377],"c":[377],"d":"f"},"d":{"b":"f"}}},"c":{"a":{"b":{"a":"f","b":[377],"c":[377],"d":"f"},"c":{"a":"f","b":[377],"c":[377],"d":"f"}},"b":[377],"c":[377],"d":{"b":{"a":"f","b":[377],"c":"f","d":"f"},"c":{"b":"f","c":"f"}}},"d":{"a":{"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"}}}},"d":{"a":{"c":{"c":{"d":"f"},"d":{"c":"f"}}},"b":{"a":{"b":{"a":"f","b":"f"}},"c":{"c":{"d":"f"},"d":{"c":"f"}}},"c":{"b":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"b":"f"}}},"d":{"b":{"a":{"b":"f"},"b":{"a":"f"}}}}}},"b":{"a":{"a":{"a":{"a":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f"}},"b":{"a":{"a":[40],"b":"f","c":"f","d":[40]},"b":[42],"c":[42],"d":{"a":[40],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[42],"c":{"a":[42],"b":[42],"c":[42],"d":"f"},"d":{"b":"f","c":"f"}}},"b":{"a":[42],"b":{"a":[42],"b":{"a":[42],"b":"f","c":"f","d":[42]},"c":{"a":[42],"b":"f","c":"f","d":"f"},"d":[42]},"c":{"a":{"a":[42],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[17],"c":[17],"d":[17]},"c":[17],"d":{"a":"f","b":[17],"c":[17],"d":[17]}},"d":{"a":[42],"b":[42],"c":{"a":[42],"b":"f","c":"f","d":[42]},"d":[42]}},"c":{"a":{"a":[42],"b":{"a":"f","b":"f","c":[17],"d":"f"},"c":{"a":"f","b":[17],"c":[17],"d":[17]},"d":{"a":[42],"b":"f","c":"f","d":[42]}},"b":[17],"c":[17],"d":{"a":{"a":"f","b":"f","c":[17],"d":"f"},"b":[17],"c":[17],"d":[17]}},"d":{"b":{"b":{"a":"f","b":[42],"c":[42],"d":"f"},"c":{"a":"f","b":"f","c":"f"}},"c":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"}}}},"b":{"a":{"a":{"a":[26],"b":[26],"c":{"a":"f","b":"f","c":[17],"d":[17]},"d":{"a":"f","b":"f","c":[17],"d":[17]}},"b":{"a":{"a":[26],"b":"f","c":"f","d":[26]},"b":[34],"c":[34],"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[28],"d":"f"},"b":{"a":"f","b":[34],"c":[34],"d":"f"},"c":{"a":"f","b":[34],"c":[34],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":[17]},"b":{"a":[34],"b":{"a":[34],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[29],"c":[29],"d":"f"},"d":{"a":[34],"b":[34],"c":"f","d":[34]}},"c":{"a":{"a":[34],"b":"f","c":"f","d":[34]},"b":{"a":[29],"b":[29],"c":"f","d":"f"},"c":[34],"d":[34]},"d":[34]},"c":[34],"d":{"a":[17],"b":{"a":{"a":"f","b":"f","c":[11],"d":"f"},"b":{"a":"f","b":[34],"c":[34],"d":"f"},"c":{"a":"f","b":[34],"c":[34],"d":"f"},"d":{"a":"f","b":[11],"c":"f","d":"f"}},"c":{"a":{"a":[17],"b":"f","c":[17],"d":[17]},"b":{"a":"f","b":[34],"c":[34],"d":"f"},"c":{"a":"f","b":[34],"c":[34],"d":"f"},"d":{"a":[17],"b":[17],"c":"f","d":[17]}},"d":[17]}},"c":{"a":{"a":[17],"b":{"a":{"a":[17],"b":"f","c":"f","d":[17]},"b":{"a":"f","b":[34],"c":[34],"d":"f"},"c":[34],"d":{"a":[17],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[34],"c":[34],"d":"f"},"b":[34],"c":{"a":[34],"b":[34],"c":[34],"d":"f"},"d":{"a":"f","b":[34],"c":"f","d":"f"}},"d":[17]},"b":[34],"c":{"a":[34],"b":[34],"c":{"a":[34],"b":[34],"c":{"a":[34],"b":[34],"c":"f","d":"f"},"d":{"a":[34],"b":"f","c":"f","d":"f"}},"d":{"a":[34],"b":[34],"c":{"a":[34],"b":[34],"c":"f","d":[34]},"d":[34]}},"d":{"a":{"a":{"a":[17],"b":[17],"c":"f","d":[17]},"b":{"a":[17],"b":"f","c":"f","d":"f"},"c":[35],"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":[35],"c":[35],"d":[35]},"b":{"a":"f","b":[34],"c":"f","d":"f"},"c":{"a":[35],"b":"f","c":"f","d":[35]},"d":[35]},"c":{"a":[35],"b":{"a":[35],"b":"f","c":"f","d":[35]},"c":{"a":[35],"b":"f","c":"f","d":[35]},"d":[35]},"d":{"a":{"a":"f","b":[35],"c":[35],"d":"f"},"b":[35],"c":[35],"d":{"a":"f","b":[35],"c":[35],"d":"f"}}}},"d":{"a":{"b":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f","d":"f"}},"c":{"b":{"a":"f","b":[17],"c":[17],"d":"f"},"c":{"a":"f","b":"f","c":"f"}}},"b":[17],"c":{"a":[17],"b":{"a":[17],"b":[17],"c":{"a":[17],"b":[17],"c":"f","d":[17]},"d":[17]},"c":{"a":[17],"b":{"a":"f","b":"f","c":[9],"d":"f"},"c":{"a":"f","b":[9],"c":[9],"d":"f"},"d":[17]},"d":{"a":[17],"b":[17],"c":[17],"d":{"a":[17],"b":[17],"c":[17],"d":"f"}}},"d":{"b":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f","d":"f"}},"c":{"a":{"c":"f"},"b":{"a":"f","b":[17],"c":[17],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[37]},"d":{"b":"f","c":"f"}},"d":{"c":{"d":"f"}}}}},"b":{"a":{"a":{"a":[29],"b":{"a":[29],"b":{"a":"f","b":[10],"c":"f","d":"f"},"c":{"a":[29],"b":"f","c":"f","d":[29]},"d":[29]},"c":[29],"d":{"a":{"a":[29],"b":[29],"c":[29],"d":"f"},"b":[29],"c":{"a":[29],"b":[29],"c":[29],"d":"f"},"d":{"a":"f","b":[29],"c":"f","d":"f"}}},"b":{"a":{"a":[10],"b":{"a":[10],"b":"f","c":"f","d":[10]},"c":{"a":[10],"b":"f","c":"f","d":[10]},"d":{"a":[10],"b":[10],"c":[10],"d":"f"}},"b":{"a":{"a":"f","b":[31],"c":[31],"d":[31]},"b":[31],"c":[31],"d":[31]},"c":{"a":{"a":[31],"b":[31],"c":"f","d":"f"},"b":{"a":[31],"b":[31],"c":[31],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[10]},"d":{"a":"f","b":"f","c":[10],"d":"f"}},"d":{"a":{"a":"f","b":[10],"c":[10],"d":"f"},"b":{"a":[10],"b":"f","c":"f","d":[10]},"c":{"a":[10],"b":"f","c":"f","d":[10]},"d":{"a":"f","b":[10],"c":[10],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[10],"c":[10],"d":{"a":[29],"b":"f","c":"f","d":[29]}},"b":{"a":[10],"b":{"a":[10],"b":"f","c":"f","d":"f"},"c":{"a":[10],"b":"f","c":[10],"d":[10]},"d":[10]},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[29],"b":"f","c":[29],"d":[29]}},"d":{"a":{"a":[29],"b":"f","c":[29],"d":[29]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[29],"b":"f","c":[29],"d":[29]},"d":[29]}},"d":{"a":{"a":[34],"b":{"a":"f","b":[29],"c":[29],"d":"f"},"c":{"a":"f","b":[29],"c":[29],"d":"f"},"d":[34]},"b":[29],"c":[29],"d":{"a":[34],"b":{"a":"f","b":"f","c":"f","d":[34]},"c":{"a":[34],"b":"f","c":"f","d":[34]},"d":[34]}}},"b":{"a":{"a":{"a":[31],"b":{"a":[31],"b":"f","c":"f","d":[31]},"c":{"a":[31],"b":"f","c":"f","d":[31]},"d":[31]},"b":{"b":{"a":"f","b":"f"},"c":{"c":"f"}},"c":{"b":{"b":"f"}},"d":{"a":[31],"b":{"a":[31],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[31]}},"b":{"a":{"d":{"d":"f"}},"d":{"a":{"a":"f"}}},"d":{"a":{"a":{"a":[31],"b":"f","c":"f","d":[31]},"b":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":"f"}}}},"d":{"a":{"a":{"a":[34],"b":{"a":[34],"b":"f","c":"f","d":[34]},"c":{"a":[34],"b":"f","c":"f","d":"f"},"d":[34]},"b":{"a":{"a":[29],"b":[29],"c":[29],"d":"f"},"b":[29],"c":{"a":[29],"b":[29],"c":"f","d":[29]},"d":{"a":"f","b":[29],"c":[29],"d":"f"}},"c":{"a":{"a":"f","b":[29],"c":[29],"d":"f"},"b":{"a":[29],"b":"f","c":"f","d":[29]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[33],"d":[33]}},"d":{"a":{"a":"f","b":"f","c":[33],"d":"f"},"b":{"a":"f","b":[33],"c":[33],"d":[33]},"c":[33],"d":{"a":"f","b":"f","c":[33],"d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":[33],"d":"f"},"b":{"a":"f","b":"f","c":[33],"d":[33]},"c":[33],"d":{"a":"f","b":[33],"c":[33],"d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":[33]},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[33]},"c":{"a":{"a":[33],"b":"f","c":"f","d":[33]},"b":{"a":"f"},"d":{"a":[33],"b":"f","c":"f","d":[33]}},"d":[33]},"c":{"a":[33],"b":{"a":{"a":[33],"b":"f","c":"f","d":[33]},"d":{"a":[33],"b":"f","c":"f","d":[33]}},"c":{"a":{"a":[33],"b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":[33]},"d":{"a":{"a":{"a":"f","b":[33],"c":[33],"d":"f"},"b":[33],"c":[33],"d":{"a":"f","b":"f","c":[33],"d":"f"}},"b":[33],"c":[33],"d":{"a":{"a":"f","b":[33],"c":[33],"d":"f"},"b":[33],"c":[33],"d":{"a":"f","b":[33],"c":[33],"d":"f"}}}}},"c":{"a":{"a":{"a":{"a":{"a":"f","b":[33],"c":[33],"d":[33]},"b":[33],"c":[33],"d":[33]},"b":[33],"c":[33],"d":{"a":{"a":"f","b":[33],"c":[33],"d":"f"},"b":[33],"c":[33],"d":{"a":"f","b":[33],"c":[33],"d":"f"}}},"b":{"a":[33],"b":{"a":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[33]}},"c":{"a":{"a":[33],"b":"f","c":"f","d":[33]},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":[33]},"d":[33]},"c":{"a":[33],"b":{"a":[33],"b":{"a":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[33]},"d":[33]},"c":{"a":[33],"b":{"a":[33],"b":"f","c":"f","d":[33]},"c":{"a":[33],"b":"f","c":"f","d":[33]},"d":[33]},"d":[33]},"d":{"a":{"a":{"a":"f","b":[33],"c":[33],"d":"f"},"b":[33],"c":[33],"d":{"a":"f","b":[33],"c":[33],"d":"f"}},"b":[33],"c":[33],"d":{"a":{"a":"f","b":[33],"c":[33],"d":"f"},"b":[33],"c":[33],"d":{"a":"f","b":[33],"c":[33],"d":"f"}}}},"d":{"a":{"a":{"a":[33],"b":[33],"c":{"a":"f","b":"f","c":[51],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":[33],"b":[33],"c":"f","d":[33]},"b":{"a":[33],"b":[33],"c":"f","d":"f"},"c":[51],"d":{"a":"f","b":"f","c":[51],"d":[51]}},"c":[51],"d":{"a":{"a":[22],"b":"f","c":[22],"d":[22]},"b":{"a":"f","b":[51],"c":[51],"d":"f"},"c":{"a":"f","b":[51],"c":[51],"d":"f"},"d":[22]}},"b":{"a":{"a":{"a":[33],"b":[33],"c":"f","d":"f"},"b":{"a":[33],"b":[33],"c":"f","d":"f"},"c":[51],"d":[51]},"b":{"a":{"a":"f","b":"f","c":[51],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[51],"b":"f","c":"f","d":[51]},"d":[51]},"c":{"a":[51],"b":{"a":[51],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[51]},"d":[51]},"c":{"a":[51],"b":{"a":{"a":[51],"b":"f","c":"f","d":[51]},"b":{"a":"f"},"d":{"a":[51],"b":"f","c":"f","d":[51]}},"c":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":[51],"b":[51],"c":{"a":[51],"b":[51],"c":"f","d":[51]},"d":[51]}},"d":{"a":{"a":[22],"b":{"a":"f","b":[51],"c":[51],"d":"f"},"c":{"a":"f","b":[51],"c":[51],"d":"f"},"d":[22]},"b":[51],"c":[51],"d":{"a":[22],"b":{"a":"f","b":[51],"c":[51],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[22]},"d":[22]}}}},"d":{"a":{"a":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"b":"f","c":"f"},"b":[37],"c":[37],"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":[37],"b":[37],"c":[37],"d":"f"},"c":{"a":"f","b":[37],"c":[37],"d":"f"},"d":{"b":"f","c":"f"}},"d":{"a":{"a":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":[37],"d":[37]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[37],"d":[37]},"b":{"a":{"a":"f","b":"f","c":[37],"d":"f"},"b":{"a":"f","b":[9],"c":[9],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[37]},"c":{"a":[37],"b":{"a":"f","b":[9],"c":[9],"d":"f"},"c":{"a":"f","b":[9],"c":[9],"d":"f"},"d":{"a":[37],"b":[37],"c":"f","d":[37]}},"d":[37]},"c":{"a":[37],"b":{"a":{"a":[37],"b":"f","c":"f","d":"f"},"b":{"a":[9],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[37],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[37]}},"c":{"a":{"a":[37],"b":"f","c":"f","d":[37]},"b":{"a":"f","b":"f","c":"f","d":[9]},"c":{"a":"f","b":"f","c":[37],"d":"f"},"d":{"a":[37],"b":"f","c":"f","d":[37]}},"d":[37]},"d":{"b":{"a":{"b":"f","c":"f"},"b":[37],"c":[37],"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f"},"b":{"a":"f","b":[37],"c":[37],"d":"f"},"c":{"a":"f","b":[37],"c":"f","d":"f"}},"d":{"a":{"a":"f","c":"f","d":"f"},"d":{"a":[377],"b":"f","c":"f","d":[377]}}}},"b":{"a":{"a":{"a":{"a":"f","b":[35],"c":[35],"d":"f"},"b":[35],"c":[35],"d":{"a":"f","b":[35],"c":"f","d":"f"}},"b":{"a":[35],"b":{"a":[35],"b":"f","c":"f","d":[35]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[35],"b":"f","c":"f","d":[35]}},"c":{"a":{"a":[35],"b":"f","c":"f","d":[35]},"b":{"a":[34],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[35],"c":[35],"d":[35]},"d":{"a":[35],"b":"f","c":[35],"d":[35]}},"d":{"a":{"a":[9],"b":"f","c":"f","d":[9]},"b":[35],"c":[35],"d":{"a":[9],"b":"f","c":"f","d":"f"}}},"b":{"a":{"a":{"a":[34],"b":"f","c":"f","d":"f"},"b":{"a":[34],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[35],"c":[35],"d":[35]},"d":{"a":"f","b":"f","c":[35],"d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":[35]},"b":[33],"c":[33],"d":{"a":[35],"b":"f","c":"f","d":[35]}},"c":{"a":{"a":[35],"b":"f","c":[35],"d":[35]},"b":{"a":"f","b":"f","c":[35],"d":[35]},"c":[35],"d":[35]},"d":[35]},"c":{"a":[35],"b":[35],"c":{"a":[35],"b":[35],"c":{"a":[35],"b":[35],"c":"f","d":[35]},"d":[35]},"d":{"a":[35],"b":[35],"c":[35],"d":{"a":[35],"b":[35],"c":[35],"d":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":[37],"d":"f"},"b":{"a":"f","b":[35],"c":"f","d":"f"},"c":[37],"d":[37]},"b":{"a":{"a":[35],"b":[35],"c":[35],"d":"f"},"b":[35],"c":[35],"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[23],"d":"f"},"b":{"a":"f","b":[35],"c":[35],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[23]},"d":[23]},"d":{"a":[37],"b":{"a":[37],"b":[37],"c":"f","d":[37]},"c":{"a":"f","b":"f","c":[23],"d":[23]},"d":{"a":[37],"b":"f","c":"f","d":[37]}}}},"c":{"a":{"a":{"a":{"a":[37],"b":"f","c":"f","d":"f"},"b":[23],"c":[23],"d":{"a":"f","b":"f","c":"f","d":[37]}},"b":[23],"c":[23],"d":{"a":{"a":"f","b":"f","c":"f","d":[37]},"b":[23],"c":[23],"d":{"a":[37],"b":"f","c":"f","d":[37]}}},"b":{"a":{"a":{"a":"f","b":[35],"c":"f","d":"f"},"b":[35],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[23],"b":"f","c":"f","d":[23]}},"b":{"a":{"a":[35],"b":[35],"c":"f","d":"f"},"b":{"a":[35],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":[51],"c":"f","d":"f"}},"c":{"a":[22],"b":{"a":"f","b":[22],"c":[22],"d":[22]},"c":[22],"d":[22]},"d":{"a":[23],"b":{"a":[23],"b":"f","c":"f","d":[23]},"c":{"a":"f","b":"f","c":[22],"d":"f"},"d":[23]}},"c":{"a":{"a":{"a":[23],"b":"f","c":"f","d":[23]},"b":{"a":"f","b":[22],"c":[22],"d":[22]},"c":[22],"d":{"a":"f","b":"f","c":[22],"d":"f"}},"b":[22],"c":[22],"d":{"a":{"a":"f","b":[22],"c":[22],"d":"f"},"b":[22],"c":[22],"d":[22]}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":[37]},"b":[23],"c":[23],"d":{"a":[37],"b":"f","c":"f","d":[37]}},"b":[23],"c":{"a":[23],"b":{"a":[23],"b":[23],"c":"f","d":"f"},"c":{"a":"f","b":[22],"c":"f","d":"f"},"d":{"a":[23],"b":"f","c":"f","d":"f"}},"d":{"a":{"a":[37],"b":"f","c":[37],"d":[37]},"b":{"a":"f","b":[23],"c":[23],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[37]},"d":[37]}}},"d":{"a":{"a":{"a":{"a":[377],"b":"f","c":"f","d":[377]},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":[377]},"b":{"b":{"b":"f"}},"d":{"a":{"a":[377],"b":"f","c":"f","d":[377]},"b":{"a":"f"},"d":{"a":[377],"b":"f","c":"f","d":[377]}}},"b":{"a":{"a":{"a":"f","b":[37],"c":"f","d":"f"},"b":{"a":[37],"b":[37],"c":[37],"d":"f"},"c":{"a":"f","b":[37],"c":"f","d":"f"}},"b":{"a":{"a":[37],"b":"f","c":[37],"d":[37]},"b":{"a":"f","b":[37],"c":[37],"d":[37]},"c":[37],"d":[37]},"c":{"a":{"a":[37],"b":[37],"c":[37],"d":"f"},"b":[37],"c":[37],"d":{"a":"f","b":"f","c":"f"}},"d":{"b":{"b":"f","c":"f"}}},"c":{"b":{"a":{"b":"f"},"b":{"a":"f","b":[37],"c":[37],"d":"f"},"c":{"a":"f","b":[37],"c":[37],"d":[37]},"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[37],"c":[37],"d":{"b":"f","c":"f"}}},"d":{"a":{"a":{"a":[377],"b":"f","c":"f","d":[377]},"c":{"a":"f","d":"f"},"d":{"a":[377],"b":"f","c":[377],"d":[377]}},"d":{"a":[377],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[377]}}}}},"c":{"a":{"a":{"a":{"a":{"a":[377],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[377]},"d":{"a":[377],"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"a":[377],"b":"f","c":"f","d":[377]}}},"b":{"b":{"a":{"b":"f","c":"f"},"b":[37],"c":[37],"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[37],"c":{"a":"f","b":[37],"c":"f","d":"f"},"d":{"b":"f"}}},"c":{"b":{"b":{"b":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","d":"f"}}}},"b":{"a":{"a":{"a":[37],"b":{"a":[37],"b":"f","c":"f","d":[37]},"c":{"a":[37],"b":"f","c":"f","d":"f"},"d":[37]},"b":{"a":[24],"b":{"a":[24],"b":"f","c":[24],"d":[24]},"c":[24],"d":[24]},"c":[24],"d":{"a":[37],"b":{"a":"f","b":[24],"c":[24],"d":"f"},"c":{"a":"f","b":[24],"c":[24],"d":"f"},"d":[37]}},"b":{"a":{"a":{"a":"f","b":[22],"c":[22],"d":"f"},"b":[22],"c":[22],"d":{"a":"f","b":"f","c":"f","d":[24]}},"b":[22],"c":{"a":[22],"b":[22],"c":{"a":[22],"b":[22],"c":"f","d":"f"},"d":[22]},"d":{"a":{"a":[24],"b":"f","c":"f","d":[24]},"b":{"a":[22],"b":[22],"c":[22],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[24]},"d":[24]}},"c":{"a":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":[24],"d":[24]},"b":{"a":{"a":[22],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":[24],"d":[24]},"d":[24]},"c":[24],"d":[24]},"d":{"a":{"a":{"a":"f","b":[37],"c":[37],"d":"f"},"b":{"a":"f","b":[24],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[39],"d":"f"},"d":{"a":"f","b":[37],"c":[37],"d":"f"}},"b":{"a":[24],"b":[24],"c":[24],"d":{"a":"f","b":[24],"c":[24],"d":"f"}},"c":{"a":{"a":"f","b":[24],"c":[24],"d":[24]},"b":[24],"c":[24],"d":[24]},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[24],"d":{"b":"f","c":"f"}}}},"c":{"a":{"a":{"a":{"b":"f","c":"f"},"b":[24],"c":{"a":"f","b":[24],"c":"f","d":"f"},"d":{"b":"f"}},"b":{"a":[24],"b":{"a":[24],"b":[24],"c":"f","d":"f"},"c":{"a":"f","b":[38],"c":[38],"d":"f"},"d":[24]},"c":{"a":[24],"b":{"a":"f","b":[38],"c":"f","d":"f"},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":{"a":"f","b":[24],"c":[24],"d":"f"}},"d":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}},"b":{"a":{"a":{"a":[24],"b":[24],"c":[24],"d":"f"},"b":[24],"c":[24],"d":{"a":"f","b":[24],"c":"f","d":"f"}},"b":[24],"c":[24],"d":{"a":{"a":[38],"b":"f","c":"f","d":[38]},"b":[24],"c":[24],"d":{"a":"f","b":"f","c":[24],"d":"f"}}},"c":{"a":[24],"b":[24],"c":[24],"d":{"a":[24],"b":[24],"c":[24],"d":{"a":"f","b":[24],"c":"f","d":"f"}}},"d":{"b":{"a":{"a":"f","b":[24],"c":"f","d":"f"},"b":[24],"c":{"a":"f","b":[24],"c":[24],"d":"f"},"d":{"b":"f"}},"c":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f"}}}}},"b":{"a":{"a":{"a":{"a":[22],"b":{"a":[22],"b":"f","c":"f","d":[22]},"c":{"a":[22],"b":"f","c":"f","d":[22]},"d":[22]},"b":[51],"c":[51],"d":{"a":[22],"b":{"a":[22],"b":"f","c":"f","d":[22]},"c":{"a":[22],"b":"f","c":"f","d":"f"},"d":[22]}},"b":{"a":{"a":[51],"b":{"a":[51],"b":"f","c":"f","d":[51]},"c":{"a":[51],"b":"f","c":"f","d":[51]},"d":[51]},"d":{"a":[51],"b":{"a":[51],"b":"f","c":"f","d":[51]},"c":{"a":[51],"b":"f","c":"f","d":[51]},"d":[51]}},"c":{"a":{"a":[51],"b":{"a":[51],"b":"f","c":"f","d":[51]},"c":{"a":[51],"b":"f","c":"f","d":"f"},"d":[51]},"d":{"a":[51],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[51],"b":[51],"c":"f","d":[51]}}},"d":{"a":{"a":[22],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":[22],"c":"f","d":"f"}},"b":[51],"c":{"a":[51],"b":[51],"c":{"a":[51],"b":[51],"c":"f","d":[51]},"d":[51]},"d":{"a":{"a":[24],"b":"f","c":[24],"d":[24]},"b":{"a":"f","b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]}}},"d":{"a":{"a":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":[24],"d":[24]},"b":{"a":{"a":[51],"b":[51],"c":[51],"d":"f"},"b":{"a":[51],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[24],"c":[24],"d":[24]},"d":{"a":"f","b":"f","c":[24],"d":[24]}},"c":{"a":[24],"b":{"a":[24],"b":[24],"c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"d":[24]},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"}}},"d":{"a":[24],"b":{"a":[24],"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[24]},"c":{"a":[24],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[24]},"d":[24]}}},"c":{"a":{"a":{"a":{"a":{"a":[24],"b":[24],"c":[24],"d":"f"},"b":[24],"c":{"a":"f","b":[24],"c":"f","d":"f"},"d":{"a":"f","b":"f"}},"b":{"a":[24],"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}}}}},"d":{"b":{"b":{"a":{"a":{"b":"f"},"b":{"a":"f","b":[24],"c":"f","d":"f"}},"b":{"a":{"a":[24],"b":[24],"c":"f","d":"f"},"b":{"a":[24],"b":[24],"c":"f","d":"f"}}}}}},"d":{"b":{"b":{"b":{"a":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"b":{"a":[377],"b":[377],"c":[377],"d":{"a":[377],"b":[377],"c":[377],"d":"f"}},"c":{"a":{"a":"f","b":[377],"c":[377],"d":"f"},"b":[377],"c":[377],"d":{"a":"f","b":[377],"c":"f","d":"f"}}},"c":{"b":{"a":{"b":"f"},"b":{"a":"f","b":[377],"c":"f","d":"f"}}}}},"d":{"b":{"d":{"a":{"c":{"d":"f"},"d":{"b":"f","c":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"b":"f"}}}}}}},"c":{"a":{"a":{"b":{"c":{"a":{"c":{"b":"f","c":"f"}},"b":{"a":{"c":"f","d":"f"},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":[382],"c":[382],"d":[382]}},"c":{"a":{"a":[382],"b":[382],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f"},"d":{"a":"f","b":"f"}},"d":{"b":{"b":"f","c":"f"}}}}},"b":{"b":{"a":{"b":{"c":{"b":"f","c":"f","d":"f"},"d":{"c":"f"}},"c":{"a":{"b":"f"},"b":{"a":"f","b":"f"}}},"b":{"a":{"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f"}}}}},"c":{"c":{"a":{"c":{"c":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[207]}},"d":{"c":{"a":"f","b":"f","c":[207],"d":[207]},"d":{"a":"f","b":"f","c":"f","d":[203]}}},"b":{"d":{"d":{"c":"f","d":"f"}}},"c":{"a":{"a":{"a":[207],"b":"f","c":[207],"d":[207]},"b":{"a":"f","b":"f","c":[207],"d":[207]},"c":[207],"d":[207]},"b":{"a":{"a":"f","c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[207],"d":[207]},"c":[207],"d":[207]},"d":{"a":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}},"b":[207],"c":[207],"d":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}}}},"d":{"b":{"c":{"c":{"b":"f","c":"f","d":"f"},"d":{"c":"f","d":"f"}}},"c":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[203],"d":[203]},"c":[203],"d":[203]},"b":{"a":{"a":"f","b":[203],"c":[203],"d":[203]},"b":[203],"c":[203],"d":[203]},"c":[203],"d":[203]},"d":{"a":{"c":{"b":"f","c":"f","d":"f"},"d":{"c":"f"}},"b":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":[203],"c":[203],"d":[203]},"d":{"a":"f","b":"f","c":[203],"d":[203]}},"c":[203],"d":{"a":{"a":"f","b":"f","c":[203],"d":[203]},"b":[203],"c":[203],"d":[203]}}}},"d":{"c":{"c":{"c":{"a":{"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[203],"d":"f"},"c":[203],"d":[203]},"d":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[203],"d":[203]},"d":{"a":"f","b":"f","c":[203],"d":"f"}}},"d":{"c":{"c":{"c":"f","d":"f"},"d":{"c":"f"}}}},"d":{"a":{"d":{"d":{"d":"f"}}},"c":{"a":{"c":{"d":"f"},"d":{"a":"f","c":"f","d":"f"}},"c":{"a":{"d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[200],"d":[200]}},"d":{"a":[200],"b":{"a":"f","b":"f","c":"f","d":[200]},"c":[200],"d":[200]}},"d":{"a":{"a":{"a":"f","b":"f","c":[209],"d":[209]},"b":{"a":"f","b":"f","c":[209],"d":[209]},"c":[209],"d":[209]},"b":{"a":{"a":"f","b":"f","c":"f","d":[209]},"b":{"c":"f","d":"f"},"c":{"a":[200],"b":"f","c":[200],"d":[200]},"d":{"a":[209],"b":"f","c":"f","d":[209]}},"c":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"d":[209]}}}},"b":{"a":{"a":{"b":{"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"b":"f"}}}}},"d":{"c":{"d":{"c":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"d":{"c":{"a":"f","b":"f","c":"f","d":[207]},"d":{"a":"f","b":"f","c":[207],"d":[207]}}}},"d":{"c":{"a":{"d":{"d":"f"}},"c":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":{"a":[207],"b":"f","c":[207],"d":[207]},"d":[207]},"d":{"a":{"a":"f","b":"f","c":[207],"d":[207]},"b":{"a":"f","b":"f","c":"f","d":[207]},"c":[207],"d":[207]}},"d":{"a":{"a":{"d":"f"},"c":{"a":"f","b":"f","c":[207],"d":[207]},"d":{"a":"f","b":"f","c":[207],"d":[207]}},"b":{"c":{"c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"c":[207],"d":[207]}}}},"c":{"a":{"a":[207],"b":{"a":{"a":[207],"b":{"a":[207],"b":{"a":[207],"b":"f","c":[207],"d":[207]},"c":[207],"d":[207]},"c":[207],"d":[207]},"b":{"a":{"a":{"a":"f","b":"f","c":[207],"d":[207]},"b":{"a":"f","c":"f","d":"f"},"c":[207],"d":[207]},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"c":{"a":{"a":"f","b":[208],"c":[208],"d":"f"},"b":[208],"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"d":[207]},"c":{"a":[207],"b":{"a":{"a":"f","b":[208],"c":[208],"d":"f"},"b":[208],"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"c":{"a":{"a":"f","b":[208],"c":[208],"d":"f"},"b":[208],"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"d":[207]},"d":[207]},"c":{"a":[207],"b":{"a":[207],"b":{"a":{"a":"f","b":[208],"c":[208],"d":"f"},"b":[208],"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"c":{"a":{"a":"f","b":[208],"c":[208],"d":"f"},"b":[208],"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"d":[207]},"c":{"a":[207],"b":{"a":{"a":"f","b":[208],"c":[208],"d":"f"},"b":[208],"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"c":{"a":{"a":"f","b":[208],"c":[208],"d":"f"},"b":[208],"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"d":[207]},"d":[207]},"d":[207]},"b":{"a":{"a":{"a":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[208],"d":[208]},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[208],"d":[208]},"c":[208],"d":[208]},"b":{"a":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[208],"d":[208]},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[208],"d":[208]},"c":[208],"d":[208]},"c":[208],"d":[208]},"b":{"a":{"a":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[208],"d":[208]},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[208],"d":[208]},"c":[208],"d":[208]},"b":{"a":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[208],"d":[208]},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"c":{"a":[208],"b":{"a":[208],"b":"f","c":"f","d":[208]},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"d":[208]},"c":{"a":[208],"b":{"a":[208],"b":{"a":[208],"b":"f","c":"f","d":[208]},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"c":{"a":[208],"b":{"a":[208],"b":"f","c":"f","d":[208]},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"d":[208]},"d":[208]},"c":{"a":[208],"b":{"a":[208],"b":{"a":[208],"b":{"a":[208],"b":"f","c":"f","d":[208]},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"c":{"a":[208],"b":{"a":[208],"b":"f","c":"f","d":[208]},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"d":[208]},"c":{"a":[208],"b":{"a":[208],"b":{"a":[208],"b":"f","c":"f","d":[208]},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"c":{"a":[208],"b":{"a":[208],"b":"f","c":"f","d":[208]},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"d":[208]},"d":[208]},"d":[208]},"c":{"a":[208],"b":{"a":[208],"b":{"a":[208],"b":{"a":[208],"b":{"a":[208],"b":"f","c":"f","d":[208]},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"c":{"a":[208],"b":{"a":[208],"b":"f","c":"f","d":[208]},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"d":[208]},"c":{"a":[208],"b":{"a":[208],"b":{"a":[208],"b":"f","c":"f","d":[208]},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"c":{"a":[208],"b":{"a":[208],"b":"f","c":"f","d":[208]},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"d":[208]},"d":[208]},"c":{"a":{"a":[208],"b":[208],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[208],"b":{"a":[208],"b":{"a":[208],"b":"f","c":"f","d":[208]},"c":{"a":[208],"b":"f","c":"f","d":[208]},"d":[208]},"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"a":[208],"b":[208],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[208],"b":[208],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}},"d":{"a":[207],"b":{"a":[207],"b":{"a":[207],"b":{"a":{"a":"f","b":[208],"c":[208],"d":"f"},"b":[208],"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"c":{"a":{"a":"f","b":[208],"c":[208],"d":"f"},"b":[208],"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"d":[207]},"c":{"a":[207],"b":{"a":{"a":"f","b":[208],"c":[208],"d":"f"},"b":[208],"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"c":{"a":{"a":"f","b":[208],"c":[208],"d":"f"},"b":[208],"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"d":[207]},"d":[207]},"c":{"a":{"a":[207],"b":[207],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[207],"b":{"a":{"a":"f","b":[208],"c":[208],"d":"f"},"b":[208],"c":[208],"d":{"a":"f","b":[208],"c":[208],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"a":[207],"b":[207],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[207],"b":[207],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}}},"d":{"a":{"a":{"a":{"a":[209],"b":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"c":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"d":[209]},"b":{"a":[200],"b":{"a":[200],"b":{"a":[200],"b":"f","c":[200],"d":[200]},"c":[200],"d":[200]},"c":[200],"d":[200]},"c":[200],"d":{"a":[209],"b":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"c":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"d":[209]}},"b":{"a":{"a":{"a":{"a":"f","b":"f","c":"f","d":[200]},"b":{"a":"f","b":"f","c":[203],"d":"f"},"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}},"b":{"a":{"a":"f","b":"f","c":[203],"d":[203]},"b":[203],"c":[203],"d":[203]},"c":[203],"d":{"a":{"a":[200],"b":"f","c":"f","d":[200]},"b":[203],"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}}},"b":[203],"c":[203],"d":{"a":{"a":{"a":[200],"b":"f","c":"f","d":[200]},"b":[203],"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}},"b":[203],"c":[203],"d":{"a":{"a":[200],"b":"f","c":"f","d":[200]},"b":[203],"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}}}},"c":{"a":{"a":{"a":{"a":[200],"b":"f","c":"f","d":[200]},"b":[203],"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}},"b":[203],"c":[203],"d":{"a":{"a":[200],"b":"f","c":"f","d":[200]},"b":[203],"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}}},"b":[203],"c":[203],"d":{"a":{"a":{"a":[200],"b":"f","c":"f","d":[200]},"b":[203],"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}},"b":[203],"c":[203],"d":{"a":{"a":[200],"b":"f","c":"f","d":[200]},"b":[203],"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}}}},"d":{"a":{"a":[209],"b":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"c":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"c":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"d":[209]}}},"b":{"a":[203],"b":{"a":{"a":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}},"b":[207],"c":[207],"d":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}}},"b":[207],"c":[207],"d":{"a":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}},"b":[207],"c":[207],"d":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}}}},"c":{"a":{"a":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}},"b":[207],"c":[207],"d":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}}},"b":[207],"c":[207],"d":{"a":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}},"b":[207],"c":[207],"d":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}}}},"d":[203]},"c":{"a":[203],"b":{"a":{"a":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}},"b":[207],"c":[207],"d":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}}},"b":[207],"c":[207],"d":{"a":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}},"b":[207],"c":[207],"d":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}}}},"c":{"a":{"a":{"a":{"a":[203],"b":"f","c":"f","d":[203]},"b":[207],"c":[207],"d":{"a":[203],"b":"f","c":"f","d":[203]}},"b":[207],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[207],"b":[207],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"a":[203],"b":[203],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[203],"b":[203],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}},"d":{"a":{"a":{"a":[209],"b":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"c":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"c":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"d":[209]}},"b":{"a":{"a":{"a":{"a":[200],"b":"f","c":"f","d":[200]},"b":[203],"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}},"b":[203],"c":[203],"d":{"a":{"a":[200],"b":"f","c":"f","d":[200]},"b":[203],"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}}},"b":[203],"c":[203],"d":{"a":{"a":{"a":[200],"b":"f","c":"f","d":[200]},"b":[203],"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}},"b":[203],"c":[203],"d":{"a":{"a":[200],"b":"f","c":"f","d":[200]},"b":[203],"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}}}},"c":{"a":{"a":{"a":{"a":[200],"b":"f","c":"f","d":[200]},"b":[203],"c":[203],"d":{"a":[200],"b":"f","c":"f","d":[200]}},"b":[203],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[203],"b":[203],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"a":[209],"b":{"a":{"a":[209],"b":"f","c":"f","d":[209]},"b":[200],"c":[200],"d":{"a":[209],"b":"f","c":"f","d":[209]}},"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[200],"b":[200],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}}}},"d":{"a":{"a":{"a":{"a":{"d":{"d":{"c":"f","d":"f"}}},"b":{"b":{"a":{"a":"f","b":[389],"c":[389],"d":"f"},"b":[389],"c":[389],"d":{"a":"f","b":[389],"c":"f","d":"f"}},"c":{"a":{"b":"f"},"b":{"a":"f","b":[389],"c":"f","d":"f"}}},"d":{"a":{"a":{"a":"f","b":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"}}}},"b":{"a":{"a":{"a":[389],"b":{"a":"f","b":"f","c":"f","d":[389]},"c":{"a":[389],"b":"f","c":"f","d":[389]},"d":[389]},"d":{"a":{"a":[389],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":[389],"c":"f","d":"f"}}},"d":{"a":{"b":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"d":{"d":"f"}},"d":{"c":{"c":"f","d":"f"}}}},"c":{"a":{"a":{"b":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":"f","d":"f"}},"d":{"a":{"d":"f"}}},"c":{"b":{"c":{"a":"f","d":"f"},"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"}}}},"d":{"b":{"c":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f"}}}}},"c":{"c":{"c":{"a":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"b":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"c":[201],"d":[201]},"d":{"a":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"b":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"c":[201],"d":[201]}},"d":{"c":{"a":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"b":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"c":[201],"d":[201]},"d":{"a":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"b":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"c":[201],"d":[201]}}},"d":{"c":{"c":{"a":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":[204],"c":[204],"d":[204]},"d":{"a":"f","b":"f","c":[204],"d":"f"}},"b":{"a":{"a":"f","b":"f","c":[201],"d":"f"},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":{"a":"f","b":[201],"c":[201],"d":"f"}},"c":{"a":{"a":"f","b":[201],"c":[201],"d":"f"},"b":[201],"c":[201],"d":{"a":"f","b":[201],"c":[201],"d":"f"}},"d":[204]},"d":{"b":{"c":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[204],"d":"f"},"b":{"a":"f","b":[204],"c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":[204],"c":[204],"d":[204]},"d":{"a":"f","b":"f","c":[204],"d":"f"}}}},"d":{"c":{"c":{"c":{"c":"f","d":"f"}}}}}},"b":{"c":{"c":{"a":{"c":{"c":{"a":"f","b":"f","c":[209],"d":"f"},"d":{"a":"f","b":"f","c":[199],"d":[199]}},"d":{"c":{"a":"f","b":"f","c":[199],"d":[199]},"d":{"a":"f","b":"f","c":[199],"d":[199]}}},"b":{"c":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"d":{"c":{"a":"f","b":"f","c":"f","d":[209]},"d":{"a":"f","b":"f","c":[209],"d":[209]}}},"c":[209],"d":{"a":[199],"b":{"a":[199],"b":{"a":"f","b":[209],"c":[209],"d":"f"},"c":{"a":"f","b":[209],"c":[209],"d":"f"},"d":[199]},"c":{"a":[199],"b":{"a":"f","b":[209],"c":[209],"d":"f"},"c":{"a":"f","b":[209],"c":[209],"d":"f"},"d":[199]},"d":[199]}},"d":{"a":{"c":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"d":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}}},"b":{"c":{"c":{"a":"f","b":"f","c":[199],"d":[199]},"d":{"a":"f","b":"f","c":[199],"d":[199]}},"d":{"c":{"b":"f","c":"f","d":"f"},"d":{"c":"f","d":"f"}}},"c":[199],"d":[199]}},"d":{"c":{"b":{"c":{"c":{"c":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":[199],"d":[199]},"b":{"a":"f","b":"f","c":[199],"d":[199]},"c":[199],"d":[199]},"b":{"a":{"a":"f","b":"f","c":[199],"d":[199]},"b":{"a":"f","b":"f","c":[199],"d":[199]},"c":[199],"d":[199]},"c":[199],"d":[199]},"d":{"a":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"b":{"a":{"a":"f","b":"f","c":"f","d":[201]},"b":{"a":"f","b":"f","c":[199],"d":[199]},"c":[199],"d":{"a":[201],"b":"f","c":"f","d":[201]}},"c":{"a":{"a":[201],"b":"f","c":"f","d":[201]},"b":[199],"c":[199],"d":{"a":[201],"b":"f","c":"f","d":[201]}},"d":[201]}},"d":{"c":{"a":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"b":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"c":[201],"d":[201]},"d":{"a":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"b":{"a":{"a":"f","b":"f","c":[201],"d":[201]},"b":{"a":"f","b":"f","c":[201],"d":[201]},"c":[201],"d":[201]},"c":[201],"d":[201]}}}},"c":{"a":{"a":{"a":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}},"d":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}}},"b":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}},"d":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}}},"c":[314],"d":[314]},"b":{"a":{"a":[201],"b":{"a":{"a":[201],"b":"f","c":"f","d":[201]},"b":[199],"c":[199],"d":{"a":[201],"b":"f","c":"f","d":[201]}},"c":{"a":{"a":[201],"b":"f","c":"f","d":[201]},"b":[199],"c":{"a":[199],"b":[199],"c":"f","d":"f"},"d":{"a":[201],"b":"f","c":"f","d":"f"}},"d":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}}},"b":{"a":[199],"b":[199],"c":{"a":[199],"b":[199],"c":{"a":[199],"b":[199],"c":"f","d":"f"},"d":{"a":[199],"b":[199],"c":"f","d":"f"}},"d":{"a":[199],"b":[199],"c":{"a":[199],"b":[199],"c":"f","d":"f"},"d":{"a":[199],"b":[199],"c":"f","d":"f"}}},"c":{"a":[314],"b":{"a":{"a":"f","b":[209],"c":[209],"d":"f"},"b":[209],"c":[209],"d":{"a":"f","b":[209],"c":[209],"d":"f"}},"c":{"a":{"a":"f","b":[209],"c":[209],"d":"f"},"b":[209],"c":[209],"d":{"a":"f","b":[209],"c":[209],"d":"f"}},"d":[314]},"d":[314]},"c":{"a":[314],"b":{"a":[314],"b":{"a":{"a":"f","b":[209],"c":[209],"d":"f"},"b":[209],"c":[209],"d":{"a":"f","b":[209],"c":[209],"d":"f"}},"c":{"a":{"a":"f","b":[209],"c":[209],"d":"f"},"b":[209],"c":[209],"d":{"a":"f","b":[209],"c":[209],"d":"f"}},"d":[314]},"c":{"a":[314],"b":{"a":{"a":"f","b":[209],"c":[209],"d":"f"},"b":[209],"c":[209],"d":{"a":"f","b":[209],"c":[209],"d":"f"}},"c":{"a":{"a":"f","b":[209],"c":[209],"d":"f"},"b":[209],"c":[209],"d":{"a":"f","b":[209],"c":[209],"d":"f"}},"d":[314]},"d":[314]},"d":[314]},"b":{"a":{"a":{"a":[199],"b":[199],"c":{"a":[199],"b":[199],"c":{"a":[199],"b":[199],"c":"f","d":"f"},"d":{"a":[199],"b":[199],"c":"f","d":"f"}},"d":{"a":[199],"b":[199],"c":{"a":[199],"b":[199],"c":"f","d":"f"},"d":{"a":[199],"b":[199],"c":"f","d":"f"}}},"b":{"a":[199],"b":[199],"c":{"a":[199],"b":[199],"c":{"a":[199],"b":[199],"c":"f","d":"f"},"d":{"a":[199],"b":[199],"c":"f","d":"f"}},"d":{"a":[199],"b":[199],"c":{"a":[199],"b":[199],"c":"f","d":"f"},"d":{"a":[199],"b":[199],"c":"f","d":"f"}}},"c":[209],"d":[209]},"b":{"a":{"a":[199],"b":{"a":[199],"b":{"a":"f","b":[209],"c":[209],"d":"f"},"c":{"a":"f","b":[209],"c":[209],"d":"f"},"d":[199]},"c":{"a":[199],"b":{"a":"f","b":[209],"c":[209],"d":"f"},"c":{"a":"f","b":[209],"c":[209],"d":"f"},"d":{"a":[199],"b":[199],"c":"f","d":"f"}},"d":{"a":[199],"b":[199],"c":{"a":[199],"b":[199],"c":"f","d":"f"},"d":{"a":[199],"b":[199],"c":"f","d":"f"}}},"b":[209],"c":[209],"d":[209]},"c":[209],"d":[209]},"c":{"a":[209],"b":[209],"c":{"a":{"a":[209],"b":[209],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[209],"b":[209],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"a":[209],"b":[209],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[209],"b":[209],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}},"d":{"a":[314],"b":{"a":[314],"b":{"a":[314],"b":{"a":{"a":"f","b":[209],"c":[209],"d":"f"},"b":[209],"c":[209],"d":{"a":"f","b":[209],"c":[209],"d":"f"}},"c":{"a":{"a":"f","b":[209],"c":[209],"d":"f"},"b":[209],"c":[209],"d":{"a":"f","b":[209],"c":[209],"d":"f"}},"d":[314]},"c":{"a":[314],"b":{"a":{"a":"f","b":[209],"c":[209],"d":"f"},"b":[209],"c":[209],"d":{"a":"f","b":[209],"c":[209],"d":"f"}},"c":{"a":{"a":"f","b":[209],"c":[209],"d":"f"},"b":[209],"c":[209],"d":{"a":"f","b":[209],"c":[209],"d":"f"}},"d":[314]},"d":[314]},"c":{"a":{"a":[314],"b":[314],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[314],"b":{"a":{"a":"f","b":[209],"c":[209],"d":"f"},"b":[209],"c":[209],"d":{"a":"f","b":[209],"c":[209],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"a":[314],"b":[314],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[314],"b":[314],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}}},"d":{"a":{"a":{"a":{"b":{"c":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[204],"d":"f"},"b":{"a":"f","b":[204],"c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":[204],"c":[204],"d":[204]},"d":{"a":"f","b":"f","c":[204],"d":"f"}}},"b":{"a":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":[204],"c":[204],"d":[204]},"d":{"a":"f","b":"f","c":[204],"d":"f"}},"b":{"a":{"a":"f","b":"f","c":[204],"d":"f"},"b":{"a":"f","b":[204],"c":[204],"d":[204]},"c":[204],"d":[204]},"c":[204],"d":[204]},"c":[204],"d":[204]},"b":{"a":[204],"b":{"a":[204],"b":{"a":{"a":"f","b":[201],"c":[201],"d":"f"},"b":[201],"c":[201],"d":{"a":"f","b":[201],"c":[201],"d":"f"}},"c":{"a":{"a":"f","b":[201],"c":[201],"d":"f"},"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":"f","b":[201],"c":"f","d":"f"}},"d":[204]},"c":{"a":[204],"b":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"c":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"d":[204]},"d":[204]},"c":{"a":[204],"b":{"a":[204],"b":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"c":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"d":[204]},"c":{"a":[204],"b":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"c":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"d":[204]},"d":[204]},"d":[204]},"b":{"a":{"a":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}},"d":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}}},"b":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}},"d":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}}},"c":[314],"d":[314]},"b":{"a":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}},"d":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}}},"b":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}},"d":{"a":[201],"b":[201],"c":{"a":[201],"b":[201],"c":"f","d":"f"},"d":{"a":[201],"b":[201],"c":"f","d":"f"}}},"c":[314],"d":[314]},"c":[314],"d":[314]},"c":{"a":[314],"b":[314],"c":{"a":{"a":[314],"b":[314],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[314],"b":[314],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"a":[314],"b":[314],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[314],"b":[314],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}},"d":{"a":[204],"b":{"a":[204],"b":{"a":[204],"b":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"c":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"d":[204]},"c":{"a":[204],"b":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"c":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"d":[204]},"d":[204]},"c":{"a":[204],"b":{"a":[204],"b":{"a":{"a":"f","b":[314],"c":[314],"d":"f"},"b":[314],"c":[314],"d":{"a":"f","b":[314],"c":[314],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":[204]},"c":[204],"d":[204]},"d":[204]}}}},"c":{"a":{"a":{"a":{"c":{"a":{"c":{"a":{"d":"f"},"d":{"a":"f","d":"f"}}}}},"b":{"a":{"c":{"b":{"c":{"a":"f","d":"f"},"d":{"b":"f","c":"f"}}}},"b":{"b":{"b":{"c":{"b":"f","c":"f"}},"c":{"a":{"c":"f"},"b":{"a":"f","b":"f","c":[103],"d":"f"},"c":[103],"d":{"a":"f","b":"f","c":[103],"d":[103]}},"d":{"c":{"b":"f","c":"f","d":"f"},"d":{"c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":[103],"c":[103],"d":[103]},"b":[103],"c":[103],"d":[103]},"b":[103],"c":[103],"d":[103]},"d":{"b":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[103],"c":[103],"d":"f"},"d":{"c":"f"}},"c":{"a":{"a":"f","b":"f","c":[103],"d":"f"},"b":[103],"c":[103],"d":[103]},"d":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":[103],"c":[103],"d":[103]},"d":{"b":"f","c":"f"}}}},"c":{"a":{"a":{"a":{"b":"f","c":"f"},"b":[103],"c":[103],"d":{"b":"f","c":"f"}},"b":[103],"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[103],"b":[103],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[171],"d":[171]},"d":{"a":"f","b":"f","c":[171],"d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":[103],"c":[103],"d":"f"},"c":{"a":"f","b":"f","c":[171],"d":[171]},"d":{"b":"f","c":"f"}}},"b":{"a":[103],"b":[103],"c":[103],"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[103],"c":{"a":[103],"b":[103],"c":[103],"d":"f"},"d":{"a":[171],"b":"f","c":"f","d":[171]}}},"c":{"a":{"a":{"a":"f","b":[171],"c":"f","d":"f"},"b":{"a":"f","b":[103],"c":"f","d":"f"},"c":{"a":[72],"b":"f","c":[72],"d":[72]},"d":{"a":[72],"b":"f","c":[72],"d":[72]}},"b":{"a":[103],"b":[103],"c":{"a":"f","b":[103],"c":[103],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":[72],"b":{"a":"f","b":[103],"c":[103],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[72]},"d":[72]},"d":[72]},"d":{"a":{"a":{"b":"f","c":"f"},"b":{"a":[171],"b":[171],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[134],"d":"f"},"d":{"b":"f"}},"b":{"a":{"a":[171],"b":[171],"c":"f","d":[171]},"b":{"a":[171],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[72],"c":[72],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[134]}},"c":{"a":{"a":[134],"b":"f","c":"f","d":[134]},"b":{"a":"f","b":[72],"c":[72],"d":[72]},"c":{"a":"f","b":[72],"c":[72],"d":"f"},"d":{"a":"f","b":"f","c":[134],"d":"f"}},"d":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f"}}}}},"c":{"b":{"a":{"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[72],"c":[72],"d":[72]},"c":[72],"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f"},"b":{"a":"f","b":[72],"c":[72],"d":"f"},"c":{"a":"f","b":"f","c":"f"}}},"b":[72],"c":{"a":{"a":[72],"b":[72],"c":{"a":[72],"b":"f","c":"f","d":"f"},"d":[72]},"b":{"a":{"a":[72],"b":[72],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[178],"d":{"a":"f","b":"f","c":[178],"d":"f"}},"c":[178],"d":{"a":{"a":[72],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[178],"c":[178],"d":[178]},"c":[178],"d":{"a":"f","b":"f","c":"f","d":[72]}}},"d":{"b":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"c":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"b":"f","c":"f"}}}},"c":{"a":{"b":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[72],"c":"f","d":"f"}}},"b":{"a":{"a":{"a":[72],"b":"f","c":"f","d":[72]},"b":[178],"c":[178],"d":{"a":[72],"b":"f","c":"f","d":"f"}},"b":[178],"c":[178],"d":{"a":{"a":"f","b":[178],"c":[178],"d":"f"},"b":[178],"c":[178],"d":{"a":"f","b":[178],"c":[178],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[178],"c":[178],"d":"f"},"b":[178],"c":[178],"d":{"a":"f","b":"f","c":"f"}},"b":[178],"c":[178],"d":{"a":{"b":"f","c":"f"},"b":{"a":[178],"b":[178],"c":[178],"d":"f"},"c":{"a":"f","b":[178],"c":[178],"d":"f"},"d":{"b":"f"}}}}},"d":{"a":{"c":{"d":{"a":{"a":"f","d":"f"},"d":{"a":"f"}}},"d":{"c":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}}}}},"b":{"a":{"a":{"a":{"a":{"a":{"c":"f"},"b":{"b":"f","c":"f","d":"f"},"c":[75],"d":{"a":"f","b":"f","c":"f","d":[103]}},"b":{"a":{"a":"f","b":[75],"c":[75],"d":[75]},"b":[75],"c":[75],"d":[75]},"c":[75],"d":{"a":{"a":[103],"b":"f","c":"f","d":[103]},"b":[75],"c":{"a":"f","b":[75],"c":[75],"d":"f"},"d":{"a":[103],"b":"f","c":[103],"d":[103]}}},"b":{"a":{"a":[75],"b":{"a":"f","b":"f","c":[175],"d":"f"},"c":{"a":"f","b":[175],"c":[175],"d":"f"},"d":{"a":[75],"b":[75],"c":"f","d":[75]}},"b":[175],"c":{"a":[175],"b":{"a":[175],"b":[175],"c":"f","d":[175]},"c":{"a":[175],"b":"f","c":[175],"d":[175]},"d":[175]},"d":{"a":{"a":[75],"b":"f","c":[75],"d":[75]},"b":{"a":"f","b":[175],"c":[175],"d":"f"},"c":{"a":"f","b":[175],"c":[175],"d":"f"},"d":{"a":[75],"b":[75],"c":"f","d":[75]}}},"c":{"a":{"a":{"a":[75],"b":"f","c":"f","d":[75]},"b":{"a":[175],"b":[175],"c":[175],"d":"f"},"c":{"a":"f","b":[175],"c":[175],"d":"f"},"d":{"a":[75],"b":"f","c":[75],"d":[75]}},"b":[175],"c":[175],"d":{"a":[75],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[75],"b":"f","c":"f","d":"f"},"d":[75]}},"d":{"a":{"a":[103],"b":{"a":"f","b":[75],"c":[75],"d":"f"},"c":{"a":"f","b":[75],"c":"f","d":"f"},"d":[103]},"b":[75],"c":{"a":{"a":[75],"b":[75],"c":[75],"d":"f"},"b":[75],"c":[75],"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[103],"b":{"a":[103],"b":"f","c":"f","d":[103]},"c":{"a":[103],"b":[103],"c":"f","d":[103]},"d":[103]}}},"b":{"a":{"a":{"a":[175],"b":{"a":[175],"b":"f","c":"f","d":[175]},"c":{"a":[175],"b":"f","c":"f","d":"f"},"d":[175]},"b":{"a":{"a":[136],"b":"f","c":"f","d":[136]},"b":{"a":[78],"b":[78],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[136]},"d":{"a":[136],"b":"f","c":[136],"d":[136]}},"c":{"a":[136],"b":{"a":[136],"b":"f","c":[136],"d":[136]},"c":[136],"d":[136]},"d":{"a":{"a":[175],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[136],"c":[136],"d":[136]},"c":[136],"d":{"a":"f","b":[136],"c":[136],"d":"f"}}},"b":{"a":{"a":{"a":"f","b":[136],"c":[136],"d":"f"},"b":[136],"c":[136],"d":{"a":"f","b":[136],"c":[136],"d":"f"}},"b":[136],"c":[136],"d":[136]},"c":[136],"d":{"a":{"a":{"a":"f","b":[136],"c":[136],"d":"f"},"b":[136],"c":[136],"d":{"a":"f","b":"f","c":"f","d":[175]}},"b":[136],"c":[136],"d":{"a":{"a":[175],"b":"f","c":"f","d":[175]},"b":[136],"c":{"a":"f","b":[136],"c":[136],"d":"f"},"d":{"a":[175],"b":"f","c":[175],"d":[175]}}}},"c":{"a":{"a":{"a":[175],"b":{"a":"f","b":[136],"c":[136],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[175]},"b":[136],"c":[136],"d":{"a":[175],"b":{"a":"f","b":[136],"c":[136],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[175],"b":[175],"c":"f","d":[175]}}},"b":{"a":[136],"b":[136],"c":[136],"d":{"a":[136],"b":[136],"c":{"a":"f","b":[136],"c":[136],"d":"f"},"d":{"a":[136],"b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":[166],"c":[166],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[166]},"c":[166],"d":[166]},"b":{"a":{"a":[136],"b":[136],"c":[136],"d":"f"},"b":[136],"c":{"a":"f","b":[136],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":[130]},"c":[130],"d":{"a":"f","b":"f","c":[130],"d":"f"}},"d":[166]},"d":{"a":{"a":{"a":[175],"b":"f","c":"f","d":[175]},"b":{"a":"f","b":"f","c":"f","d":[91]},"c":[91],"d":{"a":"f","b":"f","c":[91],"d":[91]}},"b":{"a":{"a":[136],"b":[136],"c":"f","d":"f"},"b":{"a":[136],"b":"f","c":"f","d":"f"},"c":{"a":[91],"b":"f","c":"f","d":[91]},"d":[91]},"c":{"a":[91],"b":{"a":[91],"b":"f","c":"f","d":[91]},"c":{"a":[91],"b":"f","c":"f","d":"f"},"d":{"a":[91],"b":[91],"c":"f","d":[91]}},"d":[91]}},"d":{"a":{"a":{"a":[103],"b":{"a":[103],"b":"f","c":"f","d":[103]},"c":{"a":[103],"b":"f","c":"f","d":[103]},"d":[103]},"b":{"a":{"a":"f","b":[75],"c":[75],"d":"f"},"b":[75],"c":[75],"d":{"a":"f","b":"f","c":"f","d":[57]}},"c":{"a":{"a":[57],"b":"f","c":[57],"d":[57]},"b":{"a":"f","b":[75],"c":[75],"d":"f"},"c":{"a":"f","b":[75],"c":[75],"d":"f"},"d":{"a":[57],"b":"f","c":"f","d":[57]}},"d":{"a":[103],"b":{"a":[103],"b":"f","c":"f","d":[103]},"c":{"a":"f","b":"f","c":[57],"d":"f"},"d":[103]}},"b":{"a":{"a":[75],"b":{"a":"f","b":[175],"c":[175],"d":"f"},"c":{"a":"f","b":[175],"c":[175],"d":"f"},"d":{"a":[75],"b":"f","c":"f","d":[75]}},"b":[175],"c":[175],"d":{"a":[75],"b":{"a":"f","b":[175],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[175],"d":"f"},"d":[75]}},"c":{"a":{"a":[75],"b":{"a":"f","b":[175],"c":[175],"d":"f"},"c":{"a":"f","b":[175],"c":"f","d":"f"},"d":{"a":[75],"b":"f","c":"f","d":"f"}},"b":{"a":[175],"b":[175],"c":{"a":"f","b":"f","c":[91],"d":"f"},"d":{"a":[175],"b":[175],"c":"f","d":"f"}},"c":[91],"d":{"a":[91],"b":[91],"c":[91],"d":{"a":[91],"b":[91],"c":[91],"d":"f"}}},"d":{"a":{"a":[103],"b":{"a":"f","b":[57],"c":[57],"d":"f"},"c":{"a":"f","b":[57],"c":[57],"d":"f"},"d":[103]},"b":{"a":[57],"b":{"a":"f","b":[75],"c":[75],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[57]},"d":[57]},"c":{"a":[57],"b":{"a":[57],"b":"f","c":"f","d":[57]},"c":{"a":[57],"b":"f","c":"f","d":[57]},"d":[57]},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[57],"c":[57],"d":[57]},"c":{"a":[57],"b":[57],"c":[57],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[72]}}}}},"b":{"a":{"a":{"a":{"a":[136],"b":{"a":[136],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[79],"d":"f"},"d":[136]},"b":[79],"c":{"a":[79],"b":{"a":[79],"b":[79],"c":"f","d":[79]},"c":{"a":"f","b":"f","c":[131],"d":"f"},"d":{"a":"f","b":"f","c":[131],"d":"f"}},"d":{"a":[136],"b":{"a":"f","b":[79],"c":[79],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[136]},"d":[136]}},"b":{"a":{"a":{"a":[79],"b":[79],"c":"f","d":[79]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[131]},"d":{"a":[79],"b":"f","c":"f","d":"f"}},"b":[110],"c":{"a":{"a":[110],"b":[110],"c":[110],"d":"f"},"b":[110],"c":[110],"d":{"a":"f","b":[110],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":[131],"c":[131],"d":"f"},"b":{"a":[131],"b":"f","c":"f","d":[131]},"c":[131],"d":{"a":"f","b":[131],"c":[131],"d":[131]}}},"c":{"a":[131],"b":{"a":{"a":[131],"b":"f","c":[131],"d":[131]},"b":{"a":"f","b":[110],"c":"f","d":"f"},"c":{"a":[131],"b":"f","c":"f","d":[131]},"d":[131]},"c":{"a":[131],"b":{"a":[131],"b":"f","c":"f","d":[131]},"c":[131],"d":[131]},"d":[131]},"d":{"a":{"a":[136],"b":{"a":[136],"b":"f","c":"f","d":[136]},"c":{"a":[136],"b":"f","c":"f","d":[136]},"d":[136]},"b":{"a":{"a":"f","b":[131],"c":[131],"d":"f"},"b":[131],"c":[131],"d":{"a":"f","b":[131],"c":[131],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[100],"d":[100]},"b":{"a":"f","b":[131],"c":"f","d":"f"},"c":{"a":[100],"b":"f","c":"f","d":[100]},"d":[100]},"d":{"a":[136],"b":{"a":[136],"b":"f","c":"f","d":[136]},"c":{"a":"f","b":"f","c":[100],"d":"f"},"d":[136]}}},"b":{"a":{"a":{"a":[110],"b":{"a":"f","c":"f","d":"f"},"c":{"a":[110],"b":"f","c":"f","d":[110]},"d":[110]},"d":{"a":[110],"b":{"a":[110],"b":"f","c":"f","d":[110]},"c":{"a":[110],"b":"f","c":"f","d":[110]},"d":[110]}},"b":{"b":{"b":{"a":"f","b":"f","c":[399],"d":"f"},"c":{"a":"f","b":[399],"c":"f","d":"f"}},"c":{"b":{"b":"f"}}},"c":{"a":{"a":{"d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}}},"d":{"a":{"a":[110],"b":{"a":[110],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[131],"c":[131],"d":"f"},"d":{"a":[110],"b":"f","c":"f","d":[110]}},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[131],"d":[131]},"c":[131],"d":{"a":{"a":[110],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[131],"c":[131],"d":[131]},"c":[131],"d":{"a":"f","b":[131],"c":[131],"d":[131]}}}},"c":{"a":{"a":[131],"b":{"a":[131],"b":[131],"c":{"a":[131],"b":[131],"c":"f","d":[131]},"d":[131]},"c":{"a":[131],"b":{"a":[131],"b":"f","c":"f","d":[131]},"c":{"a":[131],"b":"f","c":"f","d":[131]},"d":[131]},"d":[131]},"b":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}}},"d":{"a":[131],"b":{"a":[131],"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f"},"d":{"a":[131],"b":"f","c":"f","d":[131]}},"c":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f"}},"d":{"a":[131],"b":[131],"c":{"a":[131],"b":"f","c":"f","d":[131]},"d":[131]}}},"d":{"a":{"a":{"a":[136],"b":{"a":"f","b":[100],"c":[100],"d":"f"},"c":{"a":"f","b":[100],"c":[100],"d":[100]},"d":{"a":[136],"b":"f","c":"f","d":[136]}},"b":{"a":[100],"b":{"a":[100],"b":"f","c":[100],"d":[100]},"c":{"a":[100],"b":"f","c":[100],"d":[100]},"d":[100]},"c":{"a":{"a":[100],"b":[100],"c":"f","d":[100]},"b":{"a":[100],"b":"f","c":"f","d":"f"},"c":[174],"d":{"a":"f","b":"f","c":[174],"d":[174]}},"d":{"a":{"a":[136],"b":"f","c":"f","d":[136]},"b":[100],"c":{"a":[100],"b":"f","c":"f","d":"f"},"d":{"a":[136],"b":"f","c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":[131],"c":[131],"d":"f"},"b":[131],"c":[131],"d":{"a":"f","b":[131],"c":[131],"d":"f"}},"b":[131],"c":[131],"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[131],"c":[131],"d":{"a":"f","b":[131],"c":[131],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[131],"c":[131],"d":[131]},"b":[131],"c":[131],"d":{"a":"f","b":[131],"c":[131],"d":[131]}},"b":[131],"c":[131],"d":[131]},"d":{"a":{"a":{"a":"f","b":[100],"c":"f","d":"f"},"b":{"a":"f","b":[174],"c":[174],"d":"f"},"c":[174],"d":{"a":"f","b":"f","c":[174],"d":"f"}},"b":{"a":[174],"b":{"a":[174],"b":"f","c":"f","d":[174]},"c":{"a":"f","b":"f","c":[131],"d":"f"},"d":{"a":"f","b":[174],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[131],"d":"f"},"b":{"a":"f","b":[131],"c":[131],"d":[131]},"c":[131],"d":{"a":"f","b":[131],"c":[131],"d":"f"}},"d":{"a":{"a":[174],"b":[174],"c":[174],"d":"f"},"b":[174],"c":{"a":[174],"b":[174],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[130]}}}}},"c":{"a":{"a":{"a":{"a":[130],"b":{"a":"f","b":[131],"c":[131],"d":"f"},"c":{"a":"f","b":[131],"c":[131],"d":[131]},"d":{"a":[130],"b":"f","c":"f","d":[130]}},"b":[131],"c":[131],"d":{"a":{"a":[130],"b":"f","c":"f","d":[130]},"b":[131],"c":{"a":"f","b":[131],"c":[131],"d":"f"},"d":{"a":[130],"b":"f","c":"f","d":[130]}}},"b":[131],"c":{"a":[131],"b":[131],"c":{"a":[131],"b":[131],"c":{"a":[131],"b":[131],"c":"f","d":[131]},"d":[131]},"d":[131]},"d":{"a":{"a":{"a":[130],"b":"f","c":[130],"d":[130]},"b":{"a":"f","b":[131],"c":[131],"d":"f"},"c":{"a":"f","b":[131],"c":[131],"d":"f"},"d":[130]},"b":[131],"c":[131],"d":{"a":[130],"b":{"a":"f","b":[131],"c":[131],"d":"f"},"c":{"a":"f","b":[131],"c":[131],"d":"f"},"d":{"a":[130],"b":"f","c":[130],"d":[130]}}}},"b":{"a":{"a":{"a":[131],"b":{"a":[131],"b":"f","c":"f","d":[131]},"c":{"a":[131],"b":"f","c":"f","d":[131]},"d":[131]},"d":{"a":[131],"b":{"a":[131],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[131]}},"d":{"a":{"a":{"a":[131],"b":"f","c":"f","d":[131]},"b":{"a":"f"},"d":{"a":[131],"b":"f","c":"f","d":[131]}},"d":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f","d":"f"}}}},"d":{"a":{"a":{"a":[130],"b":{"a":"f","b":[131],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[130]},"b":[131],"c":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f","b":[131],"c":"f","d":"f"},"c":{"b":"f","c":"f"},"d":{"a":"f","d":"f"}},"d":{"a":[130],"b":{"a":"f","b":"f","c":[176],"d":"f"},"c":{"a":"f","b":[176],"c":[176],"d":[176]},"d":{"a":[130],"b":"f","c":"f","d":[130]}}},"b":{"a":[131],"b":{"a":[131],"b":{"a":[131],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[131],"b":[131],"c":"f","d":[131]}},"c":{"a":{"a":"f","b":"f","d":"f"}},"d":{"a":[131],"b":{"a":[131],"b":[131],"c":"f","d":[131]},"c":{"a":"f","b":"f","d":"f"},"d":{"a":[131],"b":[131],"c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"a":{"a":{"a":[130],"b":"f","c":"f","d":[130]},"b":[176],"c":[176],"d":{"a":[130],"b":"f","c":"f","d":[130]}},"b":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":[176],"d":"f"},"b":{"a":[176],"b":"f","c":"f","d":[176]},"c":[176],"d":{"a":"f","b":[176],"c":[176],"d":"f"}}}}},"d":{"a":{"a":{"a":{"a":{"a":[72],"b":"f","c":"f","d":[72]},"b":{"a":"f","b":[57],"c":[57],"d":[57]},"c":[57],"d":{"a":[72],"b":"f","c":"f","d":[72]}},"b":{"a":[57],"b":[57],"c":{"a":[57],"b":[57],"c":"f","d":[57]},"d":[57]},"c":{"a":{"a":[57],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[178],"d":[178]},"d":{"a":{"a":[72],"b":"f","c":"f","d":[72]},"b":{"a":"f","b":[57],"c":"f","d":"f"},"c":{"a":[178],"b":"f","c":[178],"d":[178]},"d":{"a":[72],"b":"f","c":"f","d":[72]}}},"b":{"a":{"a":{"a":"f","b":[91],"c":[91],"d":"f"},"b":[91],"c":[91],"d":{"a":"f","b":[91],"c":[91],"d":"f"}},"b":[91],"c":[91],"d":{"a":{"a":"f","b":[91],"c":[91],"d":"f"},"b":[91],"c":[91],"d":{"a":"f","b":[91],"c":[91],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[91],"c":[91],"d":"f"},"b":[91],"c":[91],"d":{"a":"f","b":"f","c":"f","d":[178]}},"b":[91],"c":[91],"d":{"a":{"a":[178],"b":"f","c":"f","d":[178]},"b":{"a":[91],"b":[91],"c":[91],"d":"f"},"c":{"a":"f","b":[91],"c":"f","d":"f"},"d":[178]}},"d":{"a":{"a":{"a":[72],"b":"f","c":"f","d":"f"},"b":[178],"c":[178],"d":{"a":"f","b":"f","c":"f","d":[178]}},"b":[178],"c":[178],"d":[178]}},"b":{"a":{"a":[91],"b":{"a":{"a":[91],"b":"f","c":"f","d":[91]},"b":[166],"c":[166],"d":{"a":[91],"b":"f","c":"f","d":[91]}},"c":{"a":{"a":[91],"b":"f","c":"f","d":[91]},"b":[166],"c":{"a":"f","b":"f","c":[130],"d":"f"},"d":{"a":[91],"b":"f","c":"f","d":[91]}},"d":[91]},"b":{"a":{"a":[166],"b":[166],"c":{"a":[166],"b":"f","c":"f","d":"f"},"d":{"a":[166],"b":[166],"c":"f","d":[166]}},"b":{"a":{"a":"f","b":[130],"c":[130],"d":"f"},"b":[130],"c":[130],"d":{"a":"f","b":[130],"c":[130],"d":[130]}},"c":[130],"d":{"a":{"a":[166],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[130],"c":[130],"d":[130]},"c":[130],"d":{"a":"f","b":[130],"c":[130],"d":[130]}}},"c":[130],"d":{"a":[91],"b":{"a":{"a":[91],"b":"f","c":"f","d":[91]},"b":{"a":"f","b":[130],"c":[130],"d":[130]},"c":{"a":"f","b":[130],"c":[130],"d":"f"},"d":{"a":[91],"b":"f","c":"f","d":[91]}},"c":{"a":{"a":[91],"b":"f","c":"f","d":[91]},"b":[130],"c":[130],"d":{"a":"f","b":"f","c":[130],"d":[130]}},"d":{"a":[91],"b":[91],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[91]}}},"c":{"a":{"a":{"a":{"a":"f","b":[91],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[130],"d":"f"},"c":{"a":"f","b":[130],"c":[130],"d":"f"},"d":{"a":[82],"b":"f","c":"f","d":[82]}},"b":[130],"c":{"a":[130],"b":[130],"c":{"a":[130],"b":[130],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[70]}},"d":{"a":{"a":[82],"b":"f","c":[82],"d":[82]},"b":{"a":"f","b":[130],"c":[130],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[82]}},"b":[130],"c":{"a":{"a":{"a":"f","b":[130],"c":[130],"d":"f"},"b":[130],"c":[130],"d":{"a":"f","b":[130],"c":[130],"d":"f"}},"b":[130],"c":{"a":[130],"b":{"a":[130],"b":[130],"c":[130],"d":"f"},"c":{"a":"f","b":[130],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[61],"d":"f"}},"d":{"a":{"a":"f","b":[130],"c":[130],"d":"f"},"b":[130],"c":{"a":"f","b":"f","c":"f","d":[65]},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"a":{"a":[82],"b":{"a":"f","b":"f","c":[70],"d":"f"},"c":{"a":"f","b":[70],"c":[70],"d":"f"},"d":[82]},"b":{"a":[70],"b":{"a":[70],"b":"f","c":[70],"d":[70]},"c":[70],"d":[70]},"c":[70],"d":{"a":[82],"b":{"a":"f","b":[70],"c":[70],"d":"f"},"c":{"a":"f","b":[70],"c":[70],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}}},"d":{"a":[178],"b":{"a":{"a":[178],"b":{"a":[178],"b":"f","c":"f","d":[178]},"c":{"a":[178],"b":"f","c":"f","d":[178]},"d":[178]},"b":{"a":{"a":[91],"b":[91],"c":"f","d":"f"},"b":{"a":[91],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[82],"c":[82],"d":[82]},"d":{"a":"f","b":"f","c":[82],"d":"f"}},"c":[82],"d":{"a":{"a":[178],"b":[178],"c":"f","d":[178]},"b":{"a":[178],"b":"f","c":"f","d":"f"},"c":[82],"d":{"a":"f","b":"f","c":[82],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[82],"c":"f","d":"f"},"b":[82],"c":[82],"d":{"a":[178],"b":"f","c":"f","d":[178]}},"b":[82],"c":{"a":[82],"b":[82],"c":{"a":[82],"b":[82],"c":"f","d":[82]},"d":[82]},"d":{"a":{"a":[178],"b":"f","c":"f","d":[178]},"b":{"a":[82],"b":[82],"c":[82],"d":"f"},"c":{"a":"f","b":[82],"c":"f","d":"f"},"d":[178]}},"d":[178]}}},"c":{"a":{"a":{"a":{"a":[178],"b":[178],"c":[178],"d":{"a":{"a":"f","b":[178],"c":"f","d":"f"},"b":{"a":[178],"b":[178],"c":[178],"d":"f"},"c":{"a":"f","b":[178],"c":"f","d":"f"}}},"b":{"a":{"a":[178],"b":{"a":[178],"b":"f","c":[178],"d":[178]},"c":[178],"d":[178]},"b":{"a":{"a":"f","b":[82],"c":[82],"d":"f"},"b":{"a":[82],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[70],"d":"f"},"d":{"a":"f","b":[82],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[178]},"b":{"a":"f","b":[70],"c":[70],"d":[70]},"c":[70],"d":{"a":[178],"b":"f","c":"f","d":[178]}},"d":[178]},"c":{"a":[178],"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[70],"c":{"a":[70],"b":[70],"c":[70],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[60],"c":"f","d":"f"},"b":{"a":"f","b":[70],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[178],"b":"f","c":[178],"d":[178]}},"d":[178]},"d":{"a":{"b":{"b":"f"}},"b":{"a":{"a":"f","b":[178],"c":[178],"d":"f"},"b":[178],"c":[178],"d":{"a":"f","b":[178],"c":[178],"d":"f"}},"c":{"a":{"a":"f","b":[178],"c":[178],"d":"f"},"b":[178],"c":[178],"d":{"a":"f","b":[178],"c":[178],"d":"f"}}}},"b":{"a":{"a":[70],"b":{"a":[70],"b":{"a":[70],"b":[70],"c":"f","d":[70]},"c":{"a":[70],"b":"f","c":"f","d":"f"},"d":[70]},"c":{"a":{"a":"f","b":"f","c":[60],"d":"f"},"b":{"a":"f","b":[60],"c":[60],"d":[60]},"c":[60],"d":{"a":"f","b":[60],"c":[60],"d":[60]}},"d":{"a":[70],"b":[70],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[70]}},"b":{"a":{"a":{"a":"f","b":[65],"c":[65],"d":"f"},"b":{"a":[65],"b":"f","c":"f","d":[65]},"c":{"a":[65],"b":"f","c":"f","d":[65]},"d":{"a":"f","b":[65],"c":[65],"d":"f"}},"b":{"a":{"a":"f","b":[61],"c":[61],"d":"f"},"b":{"a":[61],"b":"f","c":"f","d":[61]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[61]}},"c":{"a":{"a":[61],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[65],"d":[65]},"c":{"a":[65],"b":[65],"c":"f","d":"f"},"d":[65]},"d":{"a":{"a":"f","b":[65],"c":[65],"d":"f"},"b":{"a":[65],"b":"f","c":"f","d":[65]},"c":{"a":[65],"b":"f","c":[65],"d":[65]},"d":{"a":"f","b":"f","c":"f","d":[60]}}},"c":{"a":{"a":{"a":[60],"b":"f","c":[60],"d":[60]},"b":{"a":"f","b":[65],"c":"f","d":"f"},"c":{"a":[60],"b":"f","c":"f","d":[60]},"d":[60]},"b":{"a":[65],"b":{"a":"f","b":[59],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[59],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[68]}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[59],"b":[59],"c":[59],"d":"f"},"c":[59],"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[60],"b":{"a":[60],"b":"f","c":[60],"d":[60]},"c":[60],"d":[60]}},"d":{"a":{"a":{"a":[70],"b":"f","c":[70],"d":[70]},"b":{"a":"f","b":[60],"c":[60],"d":"f"},"c":{"a":"f","b":[60],"c":[60],"d":"f"},"d":[70]},"b":[60],"c":[60],"d":{"a":{"a":[70],"b":[70],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[60],"d":{"a":"f","b":"f","c":[60],"d":[60]}}}},"c":{"a":{"a":{"a":{"a":[60],"b":[60],"c":[60],"d":"f"},"b":[60],"c":[60],"d":{"a":"f","b":[60],"c":[60],"d":"f"}},"b":[60],"c":[60],"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[60],"c":{"a":"f","b":[60],"c":[60],"d":"f"},"d":{"a":"f","b":"f","c":[148],"d":"f"}}},"b":{"a":[60],"b":{"a":{"a":"f","b":[59],"c":[59],"d":"f"},"b":{"a":"f","b":"f","c":[62],"d":"f"},"c":{"a":"f","b":[62],"c":[62],"d":[62]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[62],"c":{"a":[62],"b":"f","c":"f","d":[62]},"d":{"a":[60],"b":"f","c":"f","d":[60]}},"d":[60]},"c":{"a":[60],"b":{"a":{"a":[60],"b":"f","c":"f","d":[60]},"b":{"a":[62],"b":"f","c":"f","d":[62]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[60],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[67],"c":[67],"d":"f"},"b":{"a":[67],"b":"f","c":"f","d":[67]},"c":{"a":[67],"b":"f","c":"f","d":[67]},"d":{"a":"f","b":[67],"c":[67],"d":"f"}},"d":[60]},"d":{"a":{"a":[148],"b":{"a":"f","b":[60],"c":[60],"d":"f"},"c":{"a":"f","b":[60],"c":[60],"d":"f"},"d":[148]},"b":[60],"c":{"a":[60],"b":[60],"c":{"a":[60],"b":[60],"c":[60],"d":"f"},"d":{"a":[60],"b":"f","c":"f","d":"f"}},"d":{"a":[148],"b":{"a":"f","b":[60],"c":[60],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[148]},"d":[148]}}},"d":{"a":{"b":{"a":{"a":"f","b":[178],"c":"f","d":"f"},"b":[178],"c":{"a":"f","b":[178],"c":[178],"d":"f"},"d":{"b":"f"}},"c":{"b":{"a":"f","b":[178],"c":"f","d":"f"},"c":{"b":"f","c":"f"}}},"b":{"a":[178],"b":{"a":[178],"b":{"a":"f","b":"f","c":"f","d":[178]},"c":[178],"d":[178]},"c":{"a":[178],"b":[178],"c":{"a":[178],"b":"f","c":"f","d":"f"},"d":[178]},"d":[178]},"c":{"a":{"a":{"a":"f","b":[178],"c":[178],"d":"f"},"b":[178],"c":[178],"d":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":[178],"b":[178],"c":"f","d":[178]},"b":{"a":"f","b":"f","c":[148],"d":"f"},"c":[148],"d":{"a":"f","b":"f","c":[148],"d":"f"}},"c":{"a":{"a":"f","b":[148],"c":[148],"d":[148]},"b":[148],"c":[148],"d":{"a":"f","b":[148],"c":[148],"d":"f"}},"d":{"a":{"b":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"b":{"b":{"b":"f"}}}}},"b":{"a":{"a":{"a":{"a":{"a":"f","b":[176],"c":[176],"d":"f"},"b":[176],"c":[176],"d":[176]},"b":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":[176],"c":"f","d":"f"},"b":[176],"c":[176],"d":{"a":[65],"b":"f","c":"f","d":"f"}}},"d":{"a":{"a":{"a":[59],"b":"f","c":"f","d":[59]},"b":[176],"c":[176],"d":{"a":[59],"b":"f","c":"f","d":[59]}},"b":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[176]},"d":{"a":[176],"b":"f","c":"f","d":[176]}},"d":{"a":{"a":[59],"b":"f","c":"f","d":[59]},"b":{"a":[176],"b":[176],"c":[176],"d":"f"},"c":{"a":"f","b":[176],"c":[176],"d":"f"},"d":{"a":[59],"b":"f","c":"f","d":"f"}}}},"b":{"d":{"a":{"c":{"a":"f","d":"f"},"d":{"b":"f","c":"f"}}}},"c":{"d":{"d":{"c":{"c":"f","d":"f"},"d":{"d":"f"}}}},"d":{"a":{"a":{"a":{"a":"f","b":[62],"c":[62],"d":[62]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[62]},"b":{"a":{"a":[176],"b":"f","c":"f","d":[176]},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":[176]},"c":{"a":{"a":[176],"b":"f","c":"f","d":[176]},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[176],"b":[176],"c":[176],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":[66],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[66]},"c":{"a":[66],"b":"f","c":"f","d":[66]},"d":{"a":"f","b":[66],"c":[66],"d":[66]}}},"c":{"c":{"c":{"c":"f"}}},"d":{"a":{"a":[66],"b":{"a":[66],"b":"f","c":[66],"d":[66]},"c":{"a":[66],"b":"f","c":"f","d":"f"},"d":{"a":[66],"b":[66],"c":"f","d":"f"}},"b":{"a":{"a":"f","b":[176],"c":[176],"d":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":[176],"c":[176],"d":"f"}},"c":{"a":{"a":[176],"b":"f","c":[176],"d":[176]},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[176]},"d":{"a":[63],"b":{"a":[63],"b":"f","c":"f","d":[63]},"c":{"a":[63],"b":"f","c":"f","d":[63]},"d":[63]}}}},"c":{"a":{"a":{"a":{"a":[63],"b":{"a":[63],"b":"f","c":"f","d":[63]},"c":{"a":[63],"b":"f","c":"f","d":[63]},"d":[63]},"b":{"a":[176],"b":{"a":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":[176],"b":[176],"c":[176],"d":"f"}},"c":{"a":{"a":"f","b":[176],"c":[176],"d":"f"},"b":{"a":[176],"b":"f","c":"f","d":[176]},"c":{"a":[176],"b":"f","c":"f","d":[176]},"d":{"a":"f","b":[176],"c":"f","d":"f"}},"d":{"a":[63],"b":{"a":[63],"b":[63],"c":"f","d":[63]},"c":{"a":[63],"b":[63],"c":"f","d":[63]},"d":{"a":"f","b":"f","c":"f","d":[65]}}},"b":{"b":{"b":{"b":"f"}},"d":{"d":{"d":"f"}}},"c":{"a":{"a":{"a":"f","c":"f","d":"f"},"d":{"a":[176],"b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}}},"d":{"a":{"a":{"a":[65],"b":"f","c":"f","d":[65]},"b":{"a":[63],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[65],"c":[65],"d":[65]},"d":{"a":[65],"b":"f","c":[65],"d":[65]}},"b":{"a":{"a":"f","b":"f","c":"f","d":[65]},"b":[176],"c":[176],"d":{"a":[65],"b":"f","c":"f","d":[65]}},"c":{"a":{"a":"f","b":"f","c":[176],"d":"f"},"b":[176],"c":[176],"d":{"a":"f","b":"f","c":"f","d":[65]}},"d":[65]}},"b":{"a":{"a":{"a":{"a":"f"},"b":{"a":"f","b":"f"}}}},"d":{"a":{"a":[65],"b":{"a":{"a":[65],"b":"f","c":"f","d":[65]},"b":[176],"c":{"a":"f","b":[176],"c":[176],"d":"f"},"d":{"a":[65],"b":"f","c":[65],"d":[65]}},"c":{"a":[65],"b":{"a":"f","b":[176],"c":[176],"d":"f"},"c":{"a":"f","b":[176],"c":[176],"d":"f"},"d":{"a":[65],"b":[65],"c":"f","d":"f"}},"d":{"a":[65],"b":[65],"c":{"a":[65],"b":[65],"c":"f","d":"f"},"d":{"a":[65],"b":[65],"c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","c":"f","d":"f"},"d":{"a":[176],"b":"f","c":"f","d":[176]}},"d":{"a":{"a":[176],"b":"f","c":"f","d":[176]},"d":{"a":[176],"b":"f","c":"f","d":[176]}}},"c":{"a":{"a":{"a":[176],"b":"f","c":[176],"d":[176]},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[176]},"d":{"a":[176],"b":{"a":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[176]},"d":[176]}},"d":{"a":[59],"b":{"a":[59],"b":{"a":"f","b":[176],"c":[176],"d":"f"},"c":{"a":"f","b":[176],"c":[176],"d":"f"},"d":{"a":[59],"b":[59],"c":"f","d":[59]}},"c":{"a":{"a":[59],"b":"f","c":"f","d":[59]},"b":{"a":"f","b":[176],"c":[176],"d":"f"},"c":{"a":"f","b":[176],"c":[176],"d":"f"},"d":{"a":[59],"b":"f","c":"f","d":[59]}},"d":[59]}}},"d":{"a":{"b":{"a":{"b":{"b":"f","c":"f"}},"b":{"a":{"a":[148],"b":[148],"c":[148],"d":"f"},"b":[148],"c":[148],"d":{"a":"f","b":[148],"c":"f","d":"f"}},"c":{"a":{"b":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"b":"f"}}}},"b":{"a":{"a":{"a":[148],"b":{"a":"f","b":"f","c":[58],"d":"f"},"c":{"a":"f","b":[58],"c":[58],"d":[58]},"d":{"a":[148],"b":"f","c":"f","d":[148]}},"b":{"a":{"a":"f","b":[58],"c":[58],"d":[58]},"b":{"a":"f","b":"f","c":"f","d":[58]},"c":[58],"d":[58]},"c":[58],"d":{"a":{"a":"f","b":"f","c":[58],"d":[58]},"b":[58],"c":[58],"d":{"a":"f","b":[58],"c":[58],"d":"f"}}},"b":{"a":{"a":{"a":[60],"b":[60],"c":"f","d":"f"},"b":{"a":[60],"b":[60],"c":[60],"d":"f"},"c":{"a":"f","b":[60],"c":"f","d":"f"},"d":[58]},"b":{"a":{"a":"f","b":[67],"c":[67],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[63],"c":[63],"d":"f"},"d":{"a":"f","b":[67],"c":[67],"d":"f"}},"c":{"a":{"a":"f","b":[67],"c":[67],"d":"f"},"b":{"a":"f","b":[63],"c":[63],"d":"f"},"c":{"a":"f","b":"f","c":[65],"d":[65]},"d":{"a":"f","b":"f","c":[65],"d":[65]}},"d":{"a":[58],"b":{"a":"f","b":[65],"c":[65],"d":"f"},"c":{"a":"f","b":[65],"c":[65],"d":"f"},"d":[58]}},"c":{"a":{"a":[58],"b":{"a":"f","b":[65],"c":[65],"d":"f"},"c":{"a":"f","b":[65],"c":[65],"d":"f"},"d":[58]},"b":[65],"c":[65],"d":{"a":[58],"b":{"a":"f","b":[65],"c":[65],"d":"f"},"c":{"a":"f","b":[65],"c":[65],"d":"f"},"d":[58]}},"d":{"a":{"a":{"a":"f","b":[58],"c":[58],"d":"f"},"b":[58],"c":[58],"d":{"a":"f","b":[58],"c":"f","d":"f"}},"b":[58],"c":{"a":[58],"b":[58],"c":{"a":[58],"b":[58],"c":"f","d":"f"},"d":{"a":"f","b":[58],"c":"f","d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":[58],"b":[58],"c":[58],"d":"f"},"c":{"a":"f","b":"f"}}}},"c":{"a":{"b":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}}},"b":{"a":{"a":[58],"b":{"a":"f","b":[65],"c":[65],"d":"f"},"c":{"a":"f","b":[65],"c":[65],"d":"f"},"d":{"a":[58],"b":[58],"c":"f","d":"f"}},"b":[65],"c":{"a":[65],"b":[65],"c":{"a":[65],"b":[65],"c":"f","d":"f"},"d":{"a":[65],"b":[65],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[65],"c":{"a":[65],"b":[65],"c":"f","d":"f"},"d":{"b":"f","c":"f"}}},"c":{"a":{"b":{"a":"f","b":[59],"c":[59],"d":"f"},"c":{"a":"f","b":"f","c":"f"}},"b":{"a":[59],"b":[59],"c":[59],"d":{"a":[59],"b":[59],"c":[59],"d":"f"}},"c":{"a":{"a":"f","b":[59],"c":[59],"d":"f"},"b":[59],"c":[59],"d":{"a":"f","b":[59],"c":[59],"d":"f"}}}}}},"d":{"b":{"b":{"b":{"a":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f"}},"b":{"a":[178],"b":[178],"c":{"a":"f","b":"f","c":"f"},"d":{"a":"f","b":"f"}},"c":{"b":{"b":"f"}}}}},"d":{"b":{"d":{"a":{"a":{"b":"f","c":"f"},"b":{"d":"f"},"c":{"a":"f"},"d":{"b":"f","c":"f"}}}},"d":{"b":{"b":{"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":{"b":"f","c":"f"}}}}}}},"b":{"a":{"a":{"a":{"a":{"a":{"a":[399],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[399],"b":[399],"c":"f","d":[399]}},"d":{"a":{"a":"f","b":"f"}}}}}},"b":{"a":{"b":{"c":{"b":{"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f"},"c":{"d":"f"},"d":{"c":"f"}}}},"c":{"b":{"b":{"a":{"b":"f"},"b":{"a":"f"}}},"c":{"d":{"a":{"a":"f","d":"f"},"d":{"d":"f"}}},"d":{"b":{"d":{"c":"f"}},"c":{"a":{"b":"f","c":"f"},"c":{"c":"f"}}}},"d":{"a":{"c":{"b":{"c":"f"},"c":{"b":"f","c":"f"}}},"b":{"d":{"a":{"d":"f"},"d":{"a":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","d":"f"}}},"d":{"b":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"},"d":{"a":"f","b":"f"}}}}},"b":{"b":{"a":{"c":{"d":{"d":"f"}},"d":{"c":{"c":"f"}}},"c":{"d":{"a":{"a":"f","d":"f"}}},"d":{"a":{"b":{"b":"f","c":"f"},"c":{"a":"f","b":"f","d":"f"}},"b":{"a":{"a":"f","d":"f"},"b":{"c":"f"},"c":{"b":"f"},"d":{"a":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"b":"f","c":"f"}},"d":{"b":{"b":"f","c":"f"}}}},"c":{"a":{"c":{"d":{"c":"f"}}},"c":{"b":{"c":{"b":"f","c":"f"}}},"d":{"a":{"b":{"c":"f"},"c":{"b":"f","c":"f"}},"b":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f"}},"d":{"c":{"b":"f","c":"f"}}}},"d":{"c":{"c":{"d":{"a":"f","d":"f"}},"d":{"c":{"b":"f","c":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f"}},"b":{"d":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f"}}}}},"c":{"a":{"a":{"c":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}},"b":{"a":{"b":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f"}}}},"b":{"a":{"a":{"b":{"b":"f"}},"c":{"a":{"c":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"c":{"b":"f","c":"f","d":"f"},"d":{"c":"f","d":"f"}}},"b":{"c":{"d":{"c":"f"}},"d":{"b":{"a":"f","d":"f"},"c":{"a":"f"}}},"c":{"a":{"c":{"d":"f"},"d":{"c":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"b":{"a":"f","b":"f","c":[397],"d":"f"},"c":{"a":"f","b":[397],"c":[397],"d":"f"},"d":{"c":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f"}},"c":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"b":"f"}}}},"c":{"a":{"b":{"c":{"b":"f","c":"f"}},"c":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"d":{"a":{"c":"f"},"c":{"a":"f"},"d":{"b":"f","c":"f"}}},"b":{"a":{"d":{"a":"f","d":"f"}},"b":{"a":{"b":"f","c":"f"},"b":[397],"c":[397],"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[397],"c":[397],"d":{"b":"f","c":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"b":"f","c":"f"},"b":{"a":[397],"b":"f","c":"f","d":[397]},"c":{"a":"f","b":"f","d":"f"},"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f"},"b":{"a":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"}}},"d":{"b":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}}},"d":{"a":{"b":{"c":{"b":"f","c":"f"}},"c":{"b":{"b":"f"}},"d":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","d":"f"},"d":{"b":"f","c":"f","d":"f"}}},"b":{"a":{"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"c":{"c":"f","d":"f"}},"d":{"a":{"d":"f"},"b":{"a":"f","b":"f","c":"f"},"d":{"a":"f","d":"f"}}}}},"d":{"a":{"b":{"d":{"d":{"c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f"}},"b":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"c":"f"}}},"d":{"b":{"a":{"c":"f"},"d":{"b":"f"}},"c":{"b":{"b":"f","c":"f","d":"f"},"c":{"b":"f"}}}},"b":{"a":{"b":{"b":{"b":"f","c":"f"}}},"b":{"a":{"a":{"a":"f","d":"f"}}},"c":{"c":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"d":"f"},"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}}},"d":{"a":{"a":{"a":"f","c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[421]}},"c":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"d":"f"}},"d":{"a":{"a":[421],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f"}}}},"c":{"a":{"a":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}}},"b":{"a":{"b":{"a":"f","b":"f"}}},"c":{"b":{"b":{"b":"f","c":"f"}},"c":{"a":{"d":"f"},"d":{"a":"f"}},"d":{"b":{"c":"f"},"c":{"b":"f"},"d":{"c":"f"}}},"d":{"c":{"c":{"c":"f","d":"f"}}}},"d":{"a":{"a":{"c":{"c":"f","d":"f"},"d":{"c":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"c":"f"},"c":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","d":"f"}}},"b":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f"},"d":{"a":"f"}},"c":{"c":{"d":"f"},"d":{"c":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f"},"b":{"c":"f"},"c":{"b":"f","c":"f"}},"b":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f"}}},"d":{"a":{"c":{"d":"f"}},"b":{"b":{"b":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"c":"f"},"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f"},"d":{"b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"b":"f","c":"f"}}}}}},"c":{"a":{"a":{"a":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f"}}},"c":{"c":{"a":{"c":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"c":{"b":"f","c":"f"}}}},"b":{"a":{"a":{"c":{"d":"f"},"d":{"c":"f"}},"b":{"a":{"d":"f"},"b":{"a":"f","b":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"b":"f"},"b":{"a":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":"f"}}}}},"b":{"b":{"b":{"a":{"b":{"a":"f"}},"b":{"c":{"a":"f","c":"f","d":"f"}},"c":{"b":{"a":"f","b":"f"}}}},"c":{"b":{"b":{"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"c":"f"},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":{"b":"f","c":"f"}}},"c":{"b":{"a":{"c":"f"},"b":{"a":"f","d":"f"}}}}},"c":{"c":{"c":{"a":{"c":{"c":"f","d":"f"}},"b":{"d":{"d":"f"}},"c":{"a":{"a":"f","d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":[391]},"c":{"a":"f","b":"f"},"d":{"b":"f"}}}}}},"d":{"a":{"b":{"c":{"d":{"b":{"b":"f","c":"f"}}}}},"b":{"b":{"a":{"c":{"b":{"d":"f"}},"d":{"d":{"b":"f"}}},"b":{"a":{"c":{"d":"f"},"d":{"c":"f"}},"b":{"b":{"b":"f","c":"f"},"c":{"a":"f","b":"f","c":"f"}},"d":{"a":{"b":"f"},"b":{"a":"f"},"d":{"c":"f","d":"f"}}}}}}},"c":{"c":{"a":{"c":{"a":{"c":{"a":{"c":"f"},"b":{"c":"f","d":"f"},"c":[204],"d":{"b":"f","c":"f"}}},"b":{"c":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[204],"d":[204]},"d":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[204],"d":[204]}},"c":[204],"d":{"b":{"a":{"b":"f","c":"f"},"b":[204],"c":[204],"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[204],"c":[204],"d":{"b":"f","c":"f"}}}}},"b":{"c":{"a":{"c":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[204],"d":[204]},"d":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[204],"d":[204]}},"b":{"c":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[204],"d":[204]},"d":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"c":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[204],"d":[204]},"d":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[204],"d":[204]}},"b":{"c":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[204],"d":[204]},"d":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[204],"d":[204]}},"c":[204],"d":[204]}},"c":[204],"d":{"b":{"a":{"b":{"a":{"b":"f","c":"f"},"b":[204],"c":[204],"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[204],"c":[204],"d":{"b":"f","c":"f"}}},"b":[204],"c":[204],"d":{"b":{"a":{"b":"f","c":"f"},"b":[204],"c":[204],"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[204],"c":[204],"d":{"b":"f","c":"f"}}}},"c":{"a":{"b":{"a":{"b":"f","c":"f"},"b":[204],"c":[204],"d":{"b":"f","c":"f"}},"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":[204],"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":[204],"c":[204],"d":[204]},"d":{"a":{"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}}},"d":{"c":{"c":{"a":{"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}},"d":{"c":{"a":{"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}}}},"d":{"a":{"b":{"c":{"b":{"c":{"d":{"d":"f"}},"d":{"c":{"c":"f"}}},"c":{"a":{"b":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":"f"}}},"d":{"a":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[301],"d":"f"}},"b":{"a":{"b":"f","c":"f","d":"f"},"b":{"d":"f"},"c":{"a":"f"},"d":{"a":[301],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f"}},"d":{"b":{"a":"f","b":"f"}}}},"d":{"d":{"c":{"c":{"c":"f","d":"f"}}}}},"c":{"a":{"a":{"b":{"a":{"c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"b":"f","c":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}}},"b":{"a":{"a":{"a":"f","d":"f"}}},"d":{"b":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"}}}},"b":{"c":{"b":{"c":{"a":"f","b":"f","c":[69],"d":[69]},"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":[69],"b":[69],"c":"f","d":"f"},"c":{"b":"f"}}}}}},"b":{"a":{"b":{"b":{"b":{"a":{"a":"f","b":[59],"c":[59],"d":"f"},"b":[59],"c":{"a":"f","b":"f","c":[64],"d":[64]},"d":{"a":"f","b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[64],"c":[64],"d":{"b":"f","c":"f"}}},"c":{"b":{"a":{"b":"f","c":"f"},"b":{"a":[64],"b":[64],"c":[64],"d":"f"},"c":{"a":"f","b":"f","c":"f"}},"c":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}}},"c":{"a":{"a":{"a":{"c":"f"},"b":{"c":"f","d":"f"},"c":{"a":[303],"b":[303],"c":[303],"d":"f"},"d":{"b":"f","c":"f"}},"b":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":[303]},"c":{"a":[303],"b":"f","c":"f","d":[303]},"d":[303]},"c":{"a":{"a":[303],"b":[303],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f"}}},"c":{"a":{"c":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[69],"c":[69],"d":[69]},"d":{"a":"f","b":"f","c":[69],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":"f","c":[168],"d":"f"},"c":{"a":"f","b":[168],"c":"f","d":"f"}},"d":{"b":{"a":"f","b":"f"}}}}},"b":{"a":{"a":{"a":{"a":[59],"b":[59],"c":{"a":"f","b":"f","c":[64],"d":[64]},"d":{"a":"f","b":"f","c":[64],"d":[64]}},"b":{"a":{"a":[59],"b":"f","c":"f","d":[59]},"b":{"a":[176],"b":[176],"c":[176],"d":"f"},"c":{"a":"f","b":[176],"c":[176],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[64]}},"c":{"a":{"a":[64],"b":"f","c":[64],"d":[64]},"b":{"a":"f","b":[176],"c":[176],"d":"f"},"c":{"a":"f","b":[176],"c":"f","d":"f"},"d":[64]},"d":[64]},"b":{"a":{"a":[176],"b":{"a":[176],"b":"f","c":"f","d":[176]},"c":{"a":[176],"b":"f","c":"f","d":[176]},"d":[176]},"d":{"a":[176],"b":{"a":[176],"b":"f","c":"f","d":[176]},"c":{"a":[176],"b":"f","c":"f","d":[176]},"d":[176]}},"c":{"a":{"a":[176],"b":{"a":[176],"b":"f","c":[176],"d":[176]},"c":{"a":"f","b":"f","c":[168],"d":[168]},"d":{"a":"f","b":"f","c":[168],"d":"f"}},"b":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":[168],"c":[168],"d":"f"},"b":{"a":[168],"b":[168],"c":"f","d":[168]},"c":{"a":[168],"b":"f","c":"f","d":[168]},"d":{"a":"f","b":[168],"c":[168],"d":"f"}}},"d":{"a":[64],"b":{"a":[64],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[64],"b":"f","c":"f","d":[64]},"d":[64]},"c":{"a":[64],"b":{"a":[64],"b":"f","c":"f","d":[64]},"c":{"a":[64],"b":[64],"c":"f","d":"f"},"d":[64]},"d":{"a":[64],"b":[64],"c":[64],"d":{"a":"f","b":[64],"c":"f","d":"f"}}}},"d":{"a":{"a":{"a":{"b":"f","c":"f"},"b":[64],"c":{"a":[64],"b":[64],"c":"f","d":[64]},"d":{"b":"f","c":"f"}},"b":{"a":[64],"b":{"a":"f","b":"f","c":[168],"d":"f"},"c":{"a":"f","b":"f","c":[168],"d":"f"},"d":{"a":[64],"b":[64],"c":"f","d":"f"}},"c":[168],"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[168],"d":[168]},"c":[168],"d":{"a":"f","b":"f","c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":[168],"c":[168],"d":[168]},"b":{"a":[168],"b":"f","c":"f","d":[168]},"c":{"a":[168],"b":"f","c":"f","d":[168]},"d":[168]},"d":{"a":[168],"b":{"a":[168],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[168]}},"c":{"a":{"a":{"a":[168],"b":"f","c":"f","d":"f"},"b":{"a":"f"},"d":{"a":"f","d":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":[69]},"b":[168],"c":[168],"d":{"a":[69],"b":"f","c":"f","d":[69]}},"b":{"a":[168],"b":[168],"c":{"a":[168],"b":[168],"c":"f","d":[168]},"d":[168]},"c":{"a":{"a":[168],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f"}},"d":{"a":{"a":"f","b":"f","c":[168],"d":[168]},"b":{"a":[168],"b":[168],"c":"f","d":[168]},"c":{"a":[168],"b":"f","c":"f","d":"f"},"d":{"a":[168],"b":[168],"c":"f","d":"f"}}}}},"c":{"a":{"a":{"a":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"}}}},"c":{"d":{"a":{"d":{"c":"f","d":"f"}},"d":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}}}},"d":{"c":{"a":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"b":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":[206],"d":[206]},"d":{"a":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"b":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":[206],"d":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}}}}},"d":{"a":{"d":{"a":{"c":{"c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":[69],"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f"}}}},"b":{"d":{"c":{"d":{"d":"f"}},"d":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","b":[69],"c":[69],"d":[69]},"b":{"a":[69],"b":"f","c":"f","d":[69]},"c":{"a":"f","b":"f","c":[168],"d":"f"},"d":{"a":[69],"b":[69],"c":"f","d":[69]}},"b":{"a":{"a":"f","b":"f","c":[168],"d":[168]},"b":{"a":"f","c":"f","d":"f"},"c":[168],"d":[168]},"c":{"a":{"a":"f","b":"f","c":"f","d":[69]},"b":{"a":[168],"b":[168],"c":"f","d":"f"},"c":[69],"d":[69]},"d":{"a":{"a":[69],"b":"f","c":[69],"d":[69]},"b":{"a":"f","b":"f","c":[69],"d":[69]},"c":[69],"d":[69]}},"b":{"a":{"a":{"d":"f"},"c":{"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[168]}},"c":{"d":{"d":"f"}},"d":{"a":{"a":[168],"b":[168],"c":"f","d":"f"},"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[69]}},"c":{"a":{"a":[69],"b":{"a":"f","b":"f","c":[69],"d":[69]},"c":[69],"d":[69]},"b":{"a":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[69]},"d":{"a":[69],"b":"f","c":[69],"d":[69]}},"c":[69],"d":[69]},"d":[69]},"d":{"b":{"b":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[69],"c":[69],"d":[69]},"d":{"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f"},"b":[69],"c":[69],"d":{"b":"f","c":"f"}}},"c":{"b":{"a":{"b":"f","c":"f"},"b":{"a":[69],"b":[69],"c":[69],"d":"f"},"c":{"a":"f","b":[69],"c":[69],"d":"f"}},"c":{"b":{"a":"f","b":[69],"c":[69],"d":"f"},"c":{"a":"f","b":[69],"c":"f","d":"f"}}}}}},"c":{"a":{"a":{"b":{"b":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"c":{"b":{"b":"f"}}}},"b":{"a":{"a":[69],"b":[69],"c":[69],"d":{"a":{"a":"f","b":[69],"c":[69],"d":"f"},"b":[69],"c":[69],"d":{"a":"f","b":[69],"c":[69],"d":"f"}}},"b":[69],"c":[69],"d":{"a":{"a":{"a":"f","b":[69],"c":[69],"d":"f"},"b":[69],"c":[69],"d":{"a":"f","b":"f","c":"f"}},"b":[69],"c":[69],"d":{"a":{"b":"f","c":"f"},"b":[69],"c":{"a":[69],"b":[69],"c":[69],"d":"f"},"d":{"b":"f","c":"f"}}}},"c":{"a":{"a":{"b":{"a":"f","b":[69],"c":[69],"d":"f"},"c":{"a":"f","b":[69],"c":[69],"d":[69]},"d":{"a":"f","b":"f","c":[69],"d":[69]}},"b":[69],"c":[69],"d":[69]},"b":[69],"c":[69],"d":[69]},"d":{"a":{"a":{"c":{"c":"f","d":"f"},"d":{"c":"f"}},"b":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":[69],"d":{"a":{"a":"f","b":"f","c":[69],"d":[69]},"b":[69],"c":[69],"d":[69]}},"b":{"a":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"b":{"c":{"a":"f","b":"f","c":[69],"d":[69]},"d":{"a":"f","b":"f","c":[69],"d":"f"}},"c":[69],"d":[69]},"c":[69],"d":[69]}},"b":{"a":{"a":{"a":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}},"b":[206],"c":[206],"d":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}}},"b":[206],"c":[206],"d":{"a":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}},"b":[206],"c":[206],"d":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}}}},"b":{"a":{"a":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}},"d":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}}},"d":{"a":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}},"d":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}}}},"c":{"a":{"a":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}},"d":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}}},"d":{"a":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}},"d":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}}}},"d":{"a":{"a":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}},"b":[206],"c":[206],"d":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}}},"b":[206],"c":[206],"d":{"a":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}},"b":[206],"c":[206],"d":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}}}}},"c":{"a":{"a":{"a":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}},"b":[206],"c":[206],"d":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}}},"b":[206],"c":[206],"d":{"a":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}},"b":[206],"c":[206],"d":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}}}},"b":{"a":{"a":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}},"d":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}}},"d":{"a":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}},"d":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}}}},"c":{"a":{"a":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":"f","d":[206]}},"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"a":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}},"b":[206],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[206],"b":[206],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}},"d":{"a":[69],"b":[69],"c":{"a":{"a":[69],"b":[69],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[69],"b":[69],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"a":[69],"b":[69],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[69],"b":[69],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}}},"d":{"a":{"a":{"a":{"a":{"a":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[24],"d":[24]},"d":{"a":[24],"b":"f","c":[24],"d":[24]}},"b":{"c":{"c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"c":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"d":[24]},"b":{"c":{"a":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[316]},"d":{"a":"f","b":"f","c":[316],"d":[316]}},"d":{"a":{"a":"f","b":"f","c":"f","d":[316]},"b":{"c":"f","d":"f"},"c":[316],"d":[316]}},"c":[316],"d":{"a":[24],"b":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"c":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"d":[24]}},"b":{"a":{"d":{"c":{"d":"f"},"d":{"c":"f","d":"f"}}},"c":{"a":{"a":{"d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[206],"d":"f"}},"b":{"d":{"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[206],"d":[206]},"b":{"a":"f","b":"f","c":"f","d":[206]},"c":[206],"d":[206]},"d":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}}},"d":{"a":{"a":[316],"b":{"a":"f","b":"f","c":[316],"d":[316]},"c":[316],"d":[316]},"b":{"a":{"a":"f","b":"f","c":"f","d":[316]},"b":{"c":"f","d":"f"},"c":[316],"d":[316]},"c":[316],"d":[316]}},"c":{"a":[316],"b":{"a":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}},"b":[206],"c":[206],"d":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}},"b":[206],"c":[206],"d":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}}},"d":[316]},"d":{"a":{"a":[24],"b":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"c":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"d":[24]},"b":[316],"c":[316],"d":{"a":[24],"b":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"c":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"d":[24]}}},"b":{"a":{"d":{"c":{"d":{"c":"f","d":"f"}},"d":{"a":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[206]},"d":{"a":[206],"b":"f","c":[206],"d":[206]}}}},"c":{"a":{"c":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[69],"d":[69]},"c":[69],"d":[69]},"d":{"a":{"a":"f","b":"f","c":"f","d":[206]},"b":{"c":"f","d":"f"},"c":[69],"d":{"a":[206],"b":"f","c":"f","d":[206]}}},"b":{"c":{"a":{"a":"f","b":"f","c":[69],"d":[69]},"b":{"a":"f","b":"f","c":[69],"d":[69]},"c":[69],"d":[69]},"d":{"a":{"a":"f","b":"f","c":[69],"d":[69]},"b":{"a":"f","b":"f","c":[69],"d":[69]},"c":[69],"d":[69]}},"c":[69],"d":{"a":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"b":[69],"c":[69],"d":{"a":[206],"b":"f","c":"f","d":[206]}},"b":[69],"c":[69],"d":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"b":[69],"c":[69],"d":{"a":[206],"b":"f","c":"f","d":[206]}}}},"d":{"a":{"a":[206],"b":{"a":{"a":[206],"b":"f","c":[206],"d":[206]},"b":{"a":"f","b":"f","c":[206],"d":[206]},"c":[206],"d":[206]},"c":[206],"d":[206]},"b":{"a":{"a":{"a":"f","c":"f","d":"f"},"b":{"d":"f"},"c":{"a":"f","b":"f","c":[206],"d":[206]},"d":[206]},"b":{"c":{"d":"f"},"d":{"a":"f","c":"f","d":"f"}},"c":{"a":[206],"b":{"a":"f","b":"f","c":[206],"d":[206]},"c":[206],"d":[206]},"d":[206]},"c":[206],"d":[206]}},"c":{"a":[206],"b":{"a":{"a":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"b":[69],"c":[69],"d":{"a":[206],"b":"f","c":"f","d":[206]}},"b":[69],"c":[69],"d":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"b":[69],"c":[69],"d":{"a":[206],"b":"f","c":"f","d":[206]}}},"b":[69],"c":[69],"d":{"a":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"b":[69],"c":[69],"d":{"a":[206],"b":"f","c":"f","d":[206]}},"b":[69],"c":[69],"d":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"b":[69],"c":[69],"d":{"a":[206],"b":"f","c":"f","d":[206]}}}},"c":{"a":{"a":{"a":{"a":[206],"b":"f","c":"f","d":[206]},"b":[69],"c":[69],"d":{"a":[206],"b":"f","c":"f","d":[206]}},"b":[69],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[69],"b":[69],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"a":[206],"b":[206],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[206],"b":[206],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}},"d":{"a":{"a":{"a":[24],"b":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"c":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"d":[24]},"b":[316],"c":[316],"d":{"a":[24],"b":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"c":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"d":[24]}},"b":{"a":[316],"b":{"a":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}},"b":[206],"c":[206],"d":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}},"b":[206],"c":[206],"d":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}}},"d":[316]},"c":{"a":{"a":[316],"b":[316],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":{"a":{"a":"f","b":[206],"c":[206],"d":"f"},"b":[206],"c":[206],"d":{"a":"f","b":[206],"c":[206],"d":"f"}},"b":[206],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]},"d":{"a":{"a":[24],"b":{"a":[24],"b":{"a":[24],"b":"f","c":"f","d":[24]},"c":{"a":[24],"b":"f","c":"f","d":[24]},"d":[24]},"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"b":{"a":[316],"b":[316],"c":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]},"d":{"a":{"a":"f","b":"f","c":[204],"d":[204]},"b":{"a":"f","b":"f","c":[204],"d":[204]},"c":[204],"d":[204]}},"c":[204],"d":[204]}}}}},"b":{"a":{"a":{"a":{"c":{"a":{"c":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[158],"d":[158]},"d":{"a":"f","b":"f","c":[158],"d":[158]}},"d":{"c":{"a":"f","b":"f","c":[158],"d":"f"},"d":{"c":"f","d":"f"}}},"b":{"b":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":[158],"c":[158],"d":[158]},"b":[158],"c":[158],"d":[158]},"d":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[158],"d":[158]},"c":[158],"d":[158]}},"c":{"a":[158],"b":[158],"c":[158],"d":{"a":[158],"b":[158],"c":[158],"d":{"a":[158],"b":[158],"c":[158],"d":"f"}}},"d":{"a":{"a":{"a":[158],"b":[158],"c":"f","d":"f"},"b":[158],"c":{"a":"f","b":[158],"c":"f","d":"f"},"d":{"b":"f"}},"b":{"a":[158],"b":[158],"c":[158],"d":{"a":[158],"b":[158],"c":"f","d":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}}}},"d":{"b":{"c":{"c":{"c":"f","d":"f"}}},"c":{"b":{"b":{"a":"f","b":[158],"c":"f","d":"f"}}}}},"b":{"c":{"a":{"a":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[158],"d":[158]},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[158],"d":[158]},"c":[158],"d":[158]},"b":{"a":{"a":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[158],"d":[158]},"d":{"a":[158],"b":"f","c":[158],"d":[158]}},"b":{"c":{"a":"f","b":"f","c":[158],"d":[158]},"d":{"a":"f","b":"f","c":[158],"d":[158]}},"c":[158],"d":[158]},"c":[158],"d":[158]},"d":{"a":{"a":{"c":{"a":"f","b":"f","c":[158],"d":[158]},"d":{"a":"f","b":"f","c":[158],"d":"f"}},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[158],"d":{"a":"f","b":[158],"c":[158],"d":[158]}},"c":[158],"d":[158]},"b":{"a":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[158],"d":[158]},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[158],"d":[158]},"c":[158],"d":[158]},"c":[158],"d":[158]}},"c":{"a":{"a":[158],"b":[158],"c":[158],"d":{"a":[158],"b":[158],"c":[158],"d":{"a":{"a":[158],"b":[158],"c":"f","d":"f"},"b":[158],"c":{"a":"f","b":[158],"c":[158],"d":"f"},"d":{"a":[93],"b":"f","c":"f","d":"f"}}}},"b":[158],"c":[158],"d":{"a":{"a":{"a":[158],"b":[158],"c":{"a":"f","b":[158],"c":[158],"d":"f"},"d":{"a":"f","b":"f","c":[179],"d":"f"}},"b":[158],"c":[158],"d":{"a":[179],"b":{"a":"f","b":[158],"c":"f","d":"f"},"c":{"a":[179],"b":"f","c":"f","d":"f"},"d":{"a":[179],"b":[179],"c":"f","d":"f"}}},"b":[158],"c":{"a":[158],"b":[158],"c":{"a":[158],"b":[158],"c":[158],"d":{"a":[158],"b":[158],"c":"f","d":"f"}},"d":{"a":{"a":[158],"b":[158],"c":[158],"d":"f"},"b":[158],"c":{"a":"f","b":"f","c":"f"},"d":{"a":"f","b":"f"}}},"d":{"a":{"a":{"a":[158],"b":[158],"c":[158],"d":"f"},"b":[158],"c":{"a":[158],"b":[158],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}},"b":[158],"c":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":[158],"b":[158],"c":"f","d":"f"}},"d":{"b":{"b":"f"}}}}},"d":{"b":{"a":{"b":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}}},"b":{"a":{"a":{"a":"f","b":[158],"c":[158],"d":[158]},"b":[158],"c":[158],"d":{"a":[158],"b":[158],"c":[158],"d":"f"}},"b":[158],"c":[158],"d":{"a":{"a":"f","b":[158],"c":"f","d":"f"},"b":[158],"c":[158],"d":{"b":"f","c":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[158],"b":[158],"c":"f","d":"f"},"c":{"a":[93],"b":"f","c":[93],"d":[93]},"d":{"a":[93],"b":[93],"c":"f","d":"f"}},"b":{"a":[158],"b":[158],"c":{"a":[158],"b":[158],"c":[158],"d":"f"},"d":{"a":"f","b":[158],"c":"f","d":"f"}},"c":{"a":[93],"b":{"a":"f","b":"f","c":"f","d":[93]},"c":{"a":[93],"b":[93],"c":"f","d":[93]},"d":{"a":[93],"b":[93],"c":[93],"d":"f"}},"d":{"a":{"b":"f"},"b":{"a":"f","b":[93],"c":"f","d":"f"},"c":{"b":"f","c":"f"}}},"d":{"b":{"b":{"c":"f"},"c":{"b":"f","c":"f"}}}},"c":{"b":{"b":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":"f","c":[158],"d":"f"},"c":{"a":"f","b":[158],"c":"f","d":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":[179],"c":[179],"d":[179]},"c":{"a":[179],"b":[179],"c":"f","d":"f"},"d":{"b":"f","c":"f"}}},"c":{"b":{"b":{"a":"f","b":"f","c":"f","d":"f"}}}},"d":{"b":{"c":{"a":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f"}}}}}},"b":{"a":{"c":{"a":{"c":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[161],"d":[161]},"c":{"a":"f","b":"f","c":[158],"d":[158]},"d":{"a":[158],"b":"f","c":[158],"d":[158]}},"d":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[158],"d":[158]}},"b":{"a":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"b":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":[161],"d":{"a":{"a":"f","b":[161],"c":[161],"d":[161]},"b":[161],"c":{"a":[161],"b":[161],"c":[161],"d":"f"},"d":{"a":"f","b":[161],"c":"f","d":"f"}}},"c":{"a":{"a":[158],"b":{"a":"f","b":"f","c":"f","d":[158]},"c":[158],"d":[158]},"b":{"a":{"a":[161],"b":[161],"c":"f","d":"f"},"b":{"a":[161],"b":[161],"c":[161],"d":"f"},"c":{"a":"f","b":"f","c":[158],"d":[158]},"d":[158]},"c":{"a":[158],"b":[158],"c":{"a":"f","b":"f","c":[189],"d":[189]},"d":{"a":[158],"b":"f","c":"f","d":"f"}},"d":{"a":[158],"b":[158],"c":{"a":[158],"b":[158],"c":"f","d":"f"},"d":[158]}},"d":[158]},"d":{"a":{"a":{"c":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[158]}},"b":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":[158],"d":[158]},"b":{"a":{"d":{"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[158],"d":[158]},"b":{"a":"f","c":"f","d":"f"},"c":[158],"d":[158]},"d":{"a":{"a":"f","b":"f","c":[158],"d":[158]},"b":{"a":"f","b":"f","c":[158],"d":[158]},"c":[158],"d":[158]}},"c":[158],"d":[158]}},"b":{"c":{"a":{"a":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"b":{"d":{"c":"f","d":"f"}},"c":{"a":{"a":[124],"b":"f","c":[124],"d":[124]},"b":{"a":"f","b":"f","c":[124],"d":[124]},"c":[124],"d":[124]},"d":[124]},"b":{"c":{"a":{"c":"f","d":"f"},"b":{"d":"f"},"c":{"a":"f","b":"f","c":[170],"d":[170]},"d":[170]},"d":{"a":{"a":"f","b":"f","c":[170],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[170]},"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}},"b":[170],"c":[170],"d":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}}},"d":[124]},"d":{"a":{"a":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"b":{"c":{"b":"f","c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":[124],"d":{"a":{"a":"f","b":[124],"c":[124],"d":"f"},"b":[124],"c":[124],"d":{"a":"f","b":[124],"c":[124],"d":"f"}}},"b":{"a":{"c":{"a":"f","b":"f","c":"f","d":[124]},"d":{"a":"f","b":"f","c":[124],"d":[124]}},"b":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":[124],"d":[124]},"c":{"a":[124],"b":[124],"c":[124],"d":{"a":[124],"b":[124],"c":[124],"d":{"a":"f","b":[124],"c":[124],"d":"f"}}},"d":{"a":{"a":{"a":"f","b":[124],"c":[124],"d":"f"},"b":[124],"c":[124],"d":{"a":"f","b":[124],"c":"f","d":"f"}},"b":[124],"c":{"a":{"a":[124],"b":[124],"c":"f","d":"f"},"b":{"a":[124],"b":[124],"c":[124],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"c":"f","d":"f"}},"d":{"a":{"a":[158],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[189]},"d":{"a":"f","b":[189],"c":[189],"d":[189]}}}}},"c":{"a":{"a":{"a":[189],"b":{"a":[189],"b":{"a":"f","b":"f","c":[189],"d":[189]},"c":[189],"d":[189]},"c":{"a":{"a":[189],"b":[189],"c":"f","d":[189]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":[189],"b":[189],"c":{"a":[189],"b":[189],"c":"f","d":"f"},"d":[189]}},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":[189]},"b":{"a":[124],"b":[124],"c":[124],"d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"a":"f","b":"f","d":"f"}},"b":{"a":[124],"b":[124],"c":[124],"d":{"a":[124],"b":[124],"c":"f","d":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[124],"c":{"a":"f","b":[124],"c":[124],"d":"f"},"d":{"b":"f"}},"d":{"a":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f"}}},"c":{"b":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f"}},"c":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":[124],"c":[124],"d":[124]},"d":{"a":"f","b":"f","c":[124],"d":"f"}},"d":{"c":{"c":"f"}}},"d":{"a":{"a":{"a":"f","b":"f"},"b":{"a":"f"}}}},"b":{"a":[124],"b":{"a":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}},"b":[170],"c":[170],"d":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}},"b":[170],"c":[170],"d":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}}},"d":{"a":{"a":[124],"b":[124],"c":[124],"d":{"a":[124],"b":[124],"c":[124],"d":"f"}},"b":[124],"c":[124],"d":{"a":{"a":"f","b":[124],"c":[124],"d":"f"},"b":[124],"c":[124],"d":[124]}}},"c":{"a":[124],"b":{"a":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}},"b":[170],"c":[170],"d":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}},"b":{"a":[170],"b":{"a":[170],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[81],"c":[81],"d":"f"},"d":[170]},"c":{"a":[170],"b":{"a":"f","b":[81],"c":[81],"d":"f"},"c":{"a":"f","b":[81],"c":[81],"d":"f"},"d":[170]},"d":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}}},"d":[124]},"d":{"a":{"b":{"c":{"c":"f","d":"f"},"d":{"c":"f"}},"c":{"a":{"a":"f","b":"f","c":[124],"d":"f"},"b":[124],"c":[124],"d":[124]},"d":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":[124],"c":[124],"d":[124]},"d":{"a":"f","b":"f","c":[124],"d":"f"}}},"b":{"a":{"a":{"c":"f"},"b":{"a":"f","b":"f","c":[124],"d":"f"},"c":[124],"d":{"a":"f","b":"f","c":[124],"d":"f"}},"b":[124],"c":[124],"d":[124]},"c":[124],"d":{"a":{"a":{"a":"f","b":[124],"c":[124],"d":"f"},"b":[124],"c":[124],"d":{"a":"f","b":[124],"c":[124],"d":"f"}},"b":[124],"c":[124],"d":{"a":{"a":"f","b":[124],"c":[124],"d":"f"},"b":[124],"c":[124],"d":{"a":"f","b":[124],"c":[124],"d":"f"}}}}},"d":{"a":[158],"b":{"a":{"a":[158],"b":{"a":{"a":[158],"b":[158],"c":"f","d":[158]},"b":{"a":[158],"b":[158],"c":"f","d":"f"},"c":{"a":[189],"b":[189],"c":[189],"d":"f"},"d":{"a":[158],"b":"f","c":"f","d":[158]}},"c":{"a":[158],"b":{"a":"f","b":"f","c":"f","d":[158]},"c":{"a":[158],"b":"f","c":[158],"d":[158]},"d":[158]},"d":[158]},"b":{"a":{"a":{"a":"f","b":"f","c":[189],"d":"f"},"b":{"a":"f","b":[189],"c":[189],"d":[189]},"c":[189],"d":[189]},"b":[189],"c":[189],"d":{"a":[189],"b":[189],"c":[189],"d":{"a":"f","b":[189],"c":[189],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"}},"b":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":"f"}}},"d":{"a":{"a":[158],"b":[158],"c":{"a":[158],"b":[158],"c":"f","d":[158]},"d":[158]},"b":{"a":[158],"b":{"a":[158],"b":[158],"c":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":[158],"b":{"a":[158],"b":"f","c":"f","d":[158]},"c":{"a":"f","b":"f","d":"f"},"d":[158]}}},"c":{"a":{"a":{"a":{"a":[158],"b":"f","c":"f","d":[158]},"b":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":"f"}}},"b":{"c":{"c":{"c":"f"}}},"c":{"b":{"b":{"a":"f","b":"f","c":[161],"d":"f"},"c":{"a":"f","b":[161],"c":[161],"d":"f"}},"c":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[161],"c":[161],"d":[161]},"c":[161],"d":[161]},"d":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[161],"d":"f"},"d":{"c":"f"}}}},"d":{"a":[158],"b":{"a":[158],"b":[158],"c":{"a":[158],"b":{"a":[158],"b":"f","c":"f","d":[158]},"c":{"a":[158],"b":"f","c":"f","d":[158]},"d":[158]},"d":[158]},"c":{"a":[158],"b":{"a":[158],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f"},"d":{"a":[158],"b":"f","c":"f","d":[158]}},"c":{"a":{"a":[158],"b":"f","c":"f","d":[158]},"d":{"a":[158],"b":"f","c":"f","d":[158]}},"d":[158]},"d":[158]}}},"c":{"a":{"a":{"a":[158],"b":{"a":[158],"b":{"a":{"a":[158],"b":"f","c":"f","d":[158]},"d":{"a":[158],"b":"f","c":"f","d":[158]}},"c":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f"}},"d":{"a":[158],"b":[158],"c":{"a":[158],"b":"f","c":"f","d":[158]},"d":[158]}},"c":{"a":{"a":[158],"b":{"a":[158],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[158],"b":[158],"c":"f","d":[158]}},"d":{"a":{"a":[158],"b":"f","c":"f","d":"f"},"d":{"a":"f"}}},"d":{"a":[158],"b":[158],"c":{"a":[158],"b":[158],"c":{"a":[158],"b":"f","c":"f","d":[158]},"d":[158]},"d":[158]}},"b":{"a":{"b":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[161],"c":"f","d":"f"}},"c":{"b":{"b":"f","c":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":[161],"d":[161]},"b":[161],"c":[161],"d":[161]},"b":[161],"c":[161],"d":{"a":{"a":[161],"b":[161],"c":[161],"d":"f"},"b":[161],"c":[161],"d":{"a":"f","b":"f","c":"f"}}},"c":{"a":{"a":{"b":"f"},"b":{"a":"f","b":[161],"c":[161],"d":"f"},"c":{"a":"f","b":[161],"c":[161],"d":"f"}},"b":[161],"c":[161],"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":[161],"c":[161],"d":"f"},"c":{"a":"f","b":"f","c":"f"}}}},"c":{"b":{"a":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"b":[161],"c":{"a":{"a":"f","b":[161],"c":"f","d":"f"},"b":[161],"c":[161],"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[105]},"d":{"b":"f","c":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":[105],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[105],"b":"f","c":"f","d":"f"},"d":[105]},"b":{"a":{"a":"f","b":"f","c":[192],"d":[192]},"b":{"a":"f","b":[161],"c":"f","d":"f"},"c":{"a":[192],"b":"f","c":[192],"d":[192]},"d":[192]},"c":[192],"d":{"a":[105],"b":{"a":"f","b":[192],"c":[192],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[105]}},"d":{"b":{"b":{"c":"f"},"c":{"b":"f","c":"f","d":"f"}},"c":{"b":{"a":"f","b":[105],"c":[105],"d":"f"},"c":{"a":"f","b":[105],"c":[105],"d":"f"},"d":{"c":"f"}}}},"d":{"a":{"a":[158],"b":{"a":[158],"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f"},"d":{"a":[158],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f"}},"d":{"a":{"a":[158],"b":[158],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"d":{"a":"f"}}}}},"b":{"a":{"a":{"a":{"a":{"a":"f","b":[124],"c":[124],"d":"f"},"b":[124],"c":[124],"d":{"a":"f","b":[124],"c":[124],"d":"f"}},"b":[124],"c":[124],"d":{"a":{"a":"f","b":[124],"c":[124],"d":"f"},"b":[124],"c":[124],"d":{"a":"f","b":[124],"c":[124],"d":"f"}}},"b":[124],"c":{"a":[124],"b":[124],"c":{"a":[124],"b":{"a":[124],"b":[124],"c":[124],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[192]},"d":{"a":"f","b":"f","c":[192],"d":[192]}},"d":{"a":[124],"b":[124],"c":{"a":"f","b":"f","c":[192],"d":"f"},"d":{"a":"f","b":"f","c":[192],"d":[192]}}},"d":{"a":{"a":{"a":"f","b":[124],"c":[124],"d":"f"},"b":[124],"c":[124],"d":{"a":"f","b":[124],"c":[124],"d":"f"}},"b":[124],"c":{"a":[124],"b":[124],"c":{"a":[124],"b":"f","c":"f","d":"f"},"d":[124]},"d":{"a":{"a":"f","b":[124],"c":[124],"d":"f"},"b":[124],"c":[124],"d":{"a":"f","b":[124],"c":[124],"d":"f"}}}},"b":{"a":{"a":[124],"b":[124],"c":{"a":[124],"b":{"a":[124],"b":[124],"c":"f","d":[124]},"c":{"a":"f","b":"f","c":[71],"d":"f"},"d":{"a":[124],"b":[124],"c":"f","d":"f"}},"d":[124]},"b":{"a":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}},"b":{"a":[170],"b":{"a":"f","b":[81],"c":"f","d":"f"},"c":[170],"d":[170]},"c":[170],"d":{"a":{"a":"f","b":"f","c":[71],"d":"f"},"b":{"a":"f","b":[170],"c":[170],"d":"f"},"c":{"a":"f","b":[170],"c":[170],"d":"f"},"d":[71]}},"c":{"a":{"a":[71],"b":{"a":"f","b":[170],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[71],"b":"f","c":"f","d":"f"}},"b":{"a":[170],"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}},"c":[170],"d":{"a":{"a":"f","b":"f","c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}}},"d":{"a":{"a":[124],"b":{"a":[124],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[71],"c":"f","d":"f"},"d":{"a":[124],"b":"f","c":[124],"d":[124]}},"b":{"a":{"a":"f","b":[71],"c":"f","d":[71]},"b":{"a":[71],"b":[71],"c":[71],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[124]},"d":{"a":"f","b":"f","c":[124],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[124],"b":"f","c":"f","d":[124]}},"d":[124]}},"c":{"a":[124],"b":{"a":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}},"b":[170],"c":[170],"d":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}},"b":[170],"c":{"a":[170],"b":{"a":[170],"b":[170],"c":"f","d":[170]},"c":{"a":"f","b":"f","c":"f","d":[152]},"d":{"a":[170],"b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":[170],"c":[170],"d":"f"},"b":[170],"c":[170],"d":{"a":"f","b":[170],"c":[170],"d":"f"}}},"d":[124]},"d":{"a":{"a":{"a":{"a":"f","b":[124],"c":[124],"d":"f"},"b":[124],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":[124],"c":[124],"d":"f"}},"b":{"a":{"a":[124],"b":"f","c":"f","d":[124]},"b":{"a":"f","b":[192],"c":[192],"d":"f"},"c":[192],"d":{"a":"f","b":"f","c":[192],"d":[192]}},"c":[192],"d":{"a":{"a":"f","b":[124],"c":[124],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[192],"d":"f"},"d":{"a":"f","b":[124],"c":[124],"d":"f"}}},"b":{"a":[192],"b":{"a":[192],"b":{"a":"f","b":"f","c":[124],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[192]},"c":{"a":[192],"b":{"a":"f","b":[124],"c":[124],"d":"f"},"c":{"a":"f","b":[124],"c":"f","d":"f"},"d":[192]},"d":[192]},"c":{"a":[192],"b":{"a":[192],"b":{"a":[192],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[124],"c":[124],"d":[124]},"d":{"a":[192],"b":"f","c":"f","d":[192]}},"c":{"a":{"a":[192],"b":"f","c":"f","d":"f"},"b":[124],"c":[124],"d":{"a":"f","b":[124],"c":[124],"d":"f"}},"d":[192]},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[192],"c":[192],"d":[192]},"c":[192],"d":{"a":"f","b":[192],"c":[192],"d":[192]}},"b":[192],"c":[192],"d":[192]}}},"c":{"a":{"a":{"a":[192],"b":[192],"c":[192],"d":{"a":{"a":"f","b":[192],"c":[192],"d":"f"},"b":[192],"c":[192],"d":{"a":"f","b":[192],"c":[192],"d":"f"}}},"b":{"a":[192],"b":{"a":{"a":"f","b":"f","c":"f","d":[192]},"b":[124],"c":{"a":"f","b":[124],"c":"f","d":"f"},"d":{"a":[192],"b":"f","c":[192],"d":[192]}},"c":[192],"d":[192]},"c":{"a":[192],"b":{"a":[192],"b":{"a":[192],"b":[192],"c":"f","d":[192]},"c":{"a":[192],"b":"f","c":"f","d":[192]},"d":[192]},"c":{"a":[192],"b":{"a":[192],"b":"f","c":[192],"d":[192]},"c":[192],"d":[192]},"d":[192]},"d":[192]},"b":{"a":{"a":{"a":[124],"b":[124],"c":[124],"d":{"a":[124],"b":[124],"c":[124],"d":"f"}},"b":{"a":[124],"b":[124],"c":{"a":"f","b":"f","c":[152],"d":[152]},"d":{"a":[124],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[124]},"b":[152],"c":[152],"d":{"a":"f","b":"f","c":[152],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[124],"c":[124],"d":{"a":"f","b":[124],"c":[124],"d":"f"}}},"b":{"a":{"a":{"a":"f","b":[170],"c":"f","d":"f"},"b":{"a":[170],"b":"f","c":"f","d":"f"},"c":[152],"d":{"a":"f","b":"f","c":[152],"d":[152]}},"b":{"a":{"a":"f","b":[152],"c":[152],"d":[152]},"b":{"a":[152],"b":"f","c":"f","d":[152]},"c":{"a":[152],"b":"f","c":"f","d":[152]},"d":[152]},"c":{"a":[152],"b":{"a":[152],"b":"f","c":[152],"d":[152]},"c":{"a":"f","b":"f","c":[169],"d":"f"},"d":{"a":[152],"b":[152],"c":"f","d":[152]}},"d":[152]},"c":{"a":[152],"b":{"a":{"a":[152],"b":"f","c":[152],"d":[152]},"b":{"a":"f","b":[169],"c":"f","d":"f"},"c":[152],"d":[152]},"c":{"a":[152],"b":{"a":[152],"b":"f","c":"f","d":[152]},"c":[152],"d":[152]},"d":[152]},"d":{"a":{"a":{"a":"f","b":[124],"c":[124],"d":"f"},"b":[124],"c":{"a":[124],"b":"f","c":"f","d":[124]},"d":{"a":"f","b":[124],"c":[124],"d":[124]}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[152],"c":[152],"d":{"a":"f","b":[152],"c":[152],"d":[152]}},"c":[152],"d":{"a":{"a":"f","b":[124],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[152],"d":"f"},"c":{"a":"f","b":[152],"c":[152],"d":[152]},"d":{"a":"f","b":"f","c":"f","d":[192]}}}},"c":{"a":{"a":{"a":{"a":[192],"b":"f","c":"f","d":[192]},"b":[152],"c":[152],"d":{"a":[192],"b":"f","c":"f","d":[192]}},"b":[152],"c":{"a":{"a":[152],"b":[152],"c":[152],"d":"f"},"b":[152],"c":{"a":"f","b":"f","c":"f","d":[192]},"d":{"a":"f","b":"f","c":[192],"d":"f"}},"d":{"a":{"a":[192],"b":"f","c":"f","d":[192]},"b":{"a":[152],"b":[152],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[152]},"d":{"a":[192],"b":"f","c":"f","d":[192]}}},"b":{"a":[152],"b":[152],"c":{"a":{"a":[152],"b":[152],"c":"f","d":[152]},"b":{"a":[152],"b":[152],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[152],"b":"f","c":"f","d":"f"}},"d":{"a":[152],"b":[152],"c":{"a":[152],"b":[152],"c":"f","d":[152]},"d":[152]}},"c":{"a":{"a":{"a":[152],"b":[152],"c":"f","d":[152]},"b":{"a":"f","b":"f","c":[97],"d":"f"},"c":[97],"d":{"a":"f","b":"f","c":[97],"d":"f"}},"b":{"a":[97],"b":{"a":[97],"b":"f","c":"f","d":[97]},"c":{"a":[97],"b":"f","c":"f","d":"f"},"d":{"a":[97],"b":[97],"c":"f","d":[97]}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[87],"d":"f"},"c":[87],"d":{"a":"f","b":[87],"c":[87],"d":"f"}},"d":{"a":[97],"b":[97],"c":{"a":[97],"b":"f","c":"f","d":"f"},"d":[97]}},"d":{"a":{"a":{"a":[192],"b":"f","c":"f","d":"f"},"b":{"a":[152],"b":"f","c":"f","d":"f"},"c":[192],"d":{"a":"f","b":"f","c":[192],"d":[192]}},"b":{"a":{"a":[192],"b":[192],"c":"f","d":[192]},"b":{"a":[192],"b":"f","c":"f","d":"f"},"c":{"a":[152],"b":[152],"c":"f","d":[152]},"d":{"a":"f","b":"f","c":[152],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[97],"d":"f"},"c":{"a":"f","b":[97],"c":[97],"d":[97]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":[152],"d":"f"},"b":{"a":"f","b":[192],"c":"f","d":"f"},"c":{"a":[152],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[192]}}}},"d":{"a":{"a":[192],"b":[192],"c":[192],"d":{"a":[192],"b":[192],"c":[192],"d":{"a":[192],"b":[192],"c":"f","d":"f"}}},"b":[192],"c":{"a":[192],"b":[192],"c":[192],"d":{"a":[192],"b":[192],"c":{"a":[192],"b":[192],"c":[192],"d":"f"},"d":{"a":[192],"b":[192],"c":"f","d":"f"}}},"d":{"a":{"a":{"a":[146],"b":"f","c":"f","d":"f"},"b":{"a":[192],"b":[192],"c":[192],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[151]},"d":{"a":"f","b":[151],"c":[151],"d":"f"}},"b":[192],"c":{"a":{"a":[192],"b":[192],"c":[192],"d":"f"},"b":[192],"c":{"a":[192],"b":[192],"c":"f","d":"f"},"d":{"a":"f","b":[192],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":[151],"c":[151],"d":"f"},"b":{"a":[151],"b":"f","c":"f","d":[151]},"c":[151],"d":{"a":"f","b":[151],"c":[151],"d":[151]}}}}},"d":{"a":{"b":{"c":{"c":{"b":"f","c":"f","d":"f"}}},"c":{"b":{"b":{"a":"f","b":"f","c":[182],"d":"f"},"c":{"a":"f","b":[182],"c":[182],"d":"f"}},"c":{"b":{"a":"f","b":[182],"c":[182],"d":"f"},"c":{"a":"f","b":[182],"c":[182],"d":"f"}}}},"b":{"a":{"a":{"c":{"a":"f","b":"f","c":[105],"d":"f"},"d":{"c":"f","d":"f"}},"b":{"a":{"b":"f","c":"f","d":"f"},"b":[105],"c":[105],"d":{"a":"f","b":[105],"c":[105],"d":[105]}},"c":[105],"d":{"a":{"a":"f","b":"f","c":[105],"d":"f"},"b":[105],"c":[105],"d":{"a":"f","b":[105],"c":[105],"d":[105]}}},"b":{"a":{"a":[105],"b":{"a":"f","b":"f","c":[192],"d":"f"},"c":{"a":"f","b":[192],"c":[192],"d":"f"},"d":[105]},"b":{"a":[192],"b":[192],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[192],"b":[192],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[105],"d":[105]},"b":{"a":"f","b":"f","c":"f","d":[105]},"c":{"a":[105],"b":"f","c":"f","d":[105]},"d":[105]},"d":{"a":[105],"b":{"a":"f","b":"f","c":[105],"d":[105]},"c":[105],"d":[105]}},"c":{"a":{"a":[105],"b":{"a":[105],"b":[105],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[105]},"b":{"a":[105],"b":{"a":[105],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[192],"d":"f"},"d":{"a":[105],"b":[105],"c":"f","d":[105]}},"c":{"a":{"a":"f","b":"f","c":[192],"d":[192]},"b":[192],"c":[192],"d":[192]},"d":{"a":{"a":"f","b":"f","c":[192],"d":[192]},"b":{"a":"f","b":"f","c":"f","d":[192]},"c":[192],"d":[192]}},"d":{"a":{"a":{"a":"f","b":[105],"c":[105],"d":"f"},"b":[105],"c":[105],"d":{"a":"f","b":[105],"c":"f","d":"f"}},"b":[105],"c":{"a":{"a":"f","b":"f","c":[77],"d":[77]},"b":{"a":"f","b":"f","c":"f","d":[77]},"c":{"a":[77],"b":"f","c":"f","d":[77]},"d":[77]},"d":{"a":{"a":[182],"b":"f","c":"f","d":[182]},"b":{"a":"f","b":"f","c":[77],"d":[77]},"c":{"a":"f","b":[77],"c":[77],"d":"f"},"d":{"a":[182],"b":"f","c":[182],"d":[182]}}}},"c":{"a":{"a":{"a":[182],"b":{"a":"f","b":"f","c":"f","d":[182]},"c":{"a":[182],"b":"f","c":[182],"d":[182]},"d":[182]},"b":{"a":[77],"b":{"a":[77],"b":"f","c":"f","d":[77]},"c":{"a":[77],"b":"f","c":"f","d":[77]},"d":{"a":"f","b":[77],"c":"f","d":"f"}},"c":{"a":{"a":[182],"b":"f","c":"f","d":[182]},"b":{"a":[77],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[112],"d":[112]},"d":{"a":[182],"b":"f","c":"f","d":[182]}},"d":[182]},"b":{"a":[192],"b":[192],"c":{"a":[192],"b":[192],"c":{"a":[192],"b":[192],"c":"f","d":"f"},"d":{"a":[192],"b":[192],"c":"f","d":"f"}},"d":{"a":[192],"b":[192],"c":{"a":[192],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":[192],"c":"f","d":"f"}}},"c":{"a":{"a":{"a":[112],"b":"f","c":[112],"d":[112]},"b":{"a":"f","b":[146],"c":"f","d":"f"},"c":{"a":[112],"b":"f","c":"f","d":[112]},"d":[112]},"b":[146],"c":{"a":[146],"b":[146],"c":{"a":[146],"b":"f","c":"f","d":[146]},"d":{"a":"f","b":[146],"c":"f","d":"f"}},"d":{"a":[112],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[112],"b":"f","c":[112],"d":[112]},"d":[112]}},"d":{"a":{"a":{"a":[182],"b":[182],"c":"f","d":"f"},"b":{"a":"f","b":[182],"c":"f","d":"f"},"d":{"a":"f","d":"f"}},"b":{"a":{"a":[182],"b":"f","c":"f","d":"f"},"b":[112],"c":[112],"d":{"b":"f","c":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[112],"c":[112],"d":"f"},"c":{"a":"f","b":[112],"c":"f","d":"f"},"d":{"b":"f"}}}},"d":{"b":{"a":{"c":{"c":"f"}},"b":{"a":{"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[182],"d":"f"},"c":{"a":"f","b":[182],"c":[182],"d":[182]},"d":{"a":"f","b":"f","c":[182],"d":"f"}},"c":[182],"d":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[182],"d":"f"}}},"c":{"a":{"b":{"a":"f","b":[182],"c":[182],"d":"f"},"c":{"a":"f","b":[182],"c":"f","d":"f"}},"b":{"a":{"a":[182],"b":[182],"c":"f","d":[182]},"b":{"a":[182],"b":[182],"c":"f","d":[182]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[182],"b":"f","c":"f","d":"f"}}}}}},"d":{"a":{"a":{"c":{"d":{"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}}},"b":{"a":{"a":{"c":{"b":"f","c":"f"}},"b":{"c":{"a":"f","b":"f","c":[300],"d":[300]},"d":{"a":"f","b":"f","c":[300],"d":[300]}},"c":[300],"d":{"b":{"a":"f","b":"f","c":[300],"d":"f"},"c":{"a":"f","b":[300],"c":[300],"d":"f"}}},"b":{"a":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[300],"d":"f"}},"b":{"c":{"a":"f","b":"f","c":[300],"d":[300]},"d":{"b":"f","c":"f","d":"f"}},"c":[300],"d":[300]},"c":{"a":{"a":[300],"b":[300],"c":[300],"d":{"a":[300],"b":[300],"c":"f","d":"f"}},"b":{"a":[300],"b":[300],"c":{"a":[300],"b":[300],"c":"f","d":"f"},"d":[300]},"c":{"a":{"a":"f","b":"f"},"b":{"a":"f"}},"d":{"a":{"b":"f"},"b":{"a":"f","b":"f"}}},"d":{"a":{"b":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":[300],"b":[300],"c":"f","d":"f"},"b":[300],"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}}}},"c":{"d":{"a":{"c":{"c":"f"}},"d":{"b":{"b":"f"}}}},"d":{"a":{"a":{"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[342],"d":"f"}},"c":{"c":{"c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":[342],"c":"f","d":"f"},"b":{"a":[342],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f"}}},"b":{"a":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"}},"d":{"d":{"c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":[342]},"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[342]},"d":[342]},"b":{"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f"}},"d":{"a":[342],"b":{"a":[342],"b":"f","c":"f","d":[342]},"c":{"a":[342],"b":"f","c":"f","d":"f"},"d":[342]}},"d":{"a":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f","d":"f"}},"b":{"a":{"a":[342],"b":"f","c":[342],"d":[342]},"b":{"a":"f","b":"f","c":[342],"d":[342]},"c":[342],"d":{"a":"f","b":[342],"c":[342],"d":"f"}},"c":[342],"d":{"a":{"b":"f"},"b":{"a":"f","b":[342],"c":[342],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}}}}},"b":{"a":{"a":{"a":{"c":{"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[300]}},"d":{"a":[300],"b":{"a":"f","b":"f","c":"f","d":[300]},"c":{"a":[300],"b":"f","c":"f","d":"f"},"d":[300]}},"b":{"b":{"a":{"b":"f"},"b":{"a":"f","b":[158],"c":"f","d":"f"},"c":{"b":"f"}}},"d":{"a":{"a":[300],"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"a":[300],"b":"f","c":"f","d":"f"}}}},"b":{"a":{"a":{"a":[158],"b":[158],"c":[158],"d":{"a":"f","b":[158],"c":"f","d":"f"}},"b":[158],"c":{"a":[158],"b":[158],"c":{"a":"f","b":[158],"c":"f","d":"f"},"d":{"a":"f","b":"f"}},"d":{"a":{"b":"f"},"b":{"a":"f","b":[158],"c":"f","d":"f"},"c":{"b":"f"}}},"b":{"a":[158],"b":[158],"c":[158],"d":{"a":[158],"b":[158],"c":[158],"d":{"a":[158],"b":[158],"c":[158],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[158],"c":[158],"d":"f"},"b":[158],"c":[158],"d":{"a":"f","b":"f","c":"f"}},"b":[158],"c":[158],"d":{"a":{"b":"f"},"b":{"a":"f","b":[158],"c":[158],"d":"f"},"c":{"a":"f","b":[158],"c":"f","d":"f"}}}},"c":{"b":{"a":{"b":{"b":"f","c":"f"},"c":{"b":"f"}},"b":{"a":[158],"b":[158],"c":[158],"d":{"a":"f","b":[158],"c":[158],"d":"f"}},"c":{"a":{"a":"f","b":[158],"c":"f","d":"f"},"b":[158],"c":{"a":"f","b":"f"},"d":{"b":"f"}}}}},"d":{"a":{"a":{"a":{"a":{"c":"f"},"b":{"a":"f","b":"f","c":[342],"d":"f"},"c":[342],"d":{"b":"f","c":"f"}},"b":[342],"c":{"a":{"a":[342],"b":"f","c":"f","d":[342]},"b":{"a":"f","b":[342],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":[342],"d":"f"},"b":[342],"c":[342],"d":[342]}},"b":{"a":{"a":{"a":[342],"b":"f","c":"f","d":[342]},"b":{"a":"f","d":"f"},"c":{"a":"f","b":"f","c":[330],"d":"f"},"d":{"a":[342],"b":"f","c":"f","d":[342]}},"b":{"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[330],"d":"f"},"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[330]},"d":{"a":{"a":[342],"b":[342],"c":"f","d":[342]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[330],"c":[330],"d":[330]},"d":{"a":"f","b":"f","c":[330],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[330],"c":[330],"d":"f"},"b":[330],"c":[330],"d":{"a":"f","b":[330],"c":[330],"d":"f"}},"b":{"a":{"a":[330],"b":[330],"c":"f","d":[330]},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[330]},"d":[330]},"c":{"a":{"a":[330],"b":[330],"c":[330],"d":"f"},"b":{"a":[330],"b":"f","c":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f"}},"d":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f","b":"f","c":"f"}}},"d":{"a":[342],"b":{"a":[342],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[342]},"c":{"a":[342],"b":{"a":[342],"b":"f","c":"f","d":[342]},"c":{"a":[342],"b":"f","c":"f","d":[342]},"d":[342]},"d":{"a":[342],"b":[342],"c":[342],"d":{"a":[342],"b":[342],"c":[342],"d":"f"}}}},"d":{"a":{"a":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":[342],"c":"f","d":"f"},"b":{"a":[342],"b":"f","c":[342],"d":"f"},"c":{"a":"f","b":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[351],"d":[351]},"b":{"a":"f","c":"f","d":"f"},"c":{"a":[351],"b":"f","c":"f","d":[351]},"d":[351]},"d":{"a":[351],"b":{"a":"f","b":"f","c":[351],"d":[351]},"c":[351],"d":[351]}},"b":{"a":{"a":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f"}}},"d":{"a":{"a":[351],"b":[351],"c":{"a":[351],"b":"f","c":"f","d":[351]},"d":[351]},"b":{"a":{"a":[351],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f"},"d":{"a":"f"}},"d":{"a":[351],"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[351]}}}}}},"b":{"a":{"a":{"c":{"c":{"c":{"c":{"c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":{"d":"f"},"c":{"a":"f","b":"f","c":[81],"d":[81]},"d":{"a":"f","b":"f","c":[81],"d":[81]}}},"d":{"a":{"d":{"d":"f"}},"c":{"a":{"a":"f","c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[81],"d":[81]},"d":{"a":{"a":"f","b":"f","c":"f","d":[170]},"b":{"a":"f","b":"f","c":[81],"d":[81]},"c":[81],"d":{"a":[170],"b":"f","c":"f","d":[170]}}}},"d":{"a":{"c":{"c":{"d":"f"},"d":{"c":"f","d":"f"}},"d":{"c":{"a":"f","b":"f","c":"f","d":[170]},"d":{"a":"f","b":"f","c":[170],"d":[170]}}},"c":{"a":{"a":{"a":"f","c":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":[170],"b":"f","c":[170],"d":[170]}},"b":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":[170],"d":[170]},"d":{"a":[170],"b":{"a":[170],"b":{"a":"f","b":"f","c":[170],"d":[170]},"c":[170],"d":[170]},"c":[170],"d":[170]}}},"b":{"d":{"d":{"d":{"d":{"d":"f"}}}}},"c":{"a":{"a":{"a":{"a":{"a":"f","b":"f","c":[198],"d":[198]},"b":{"a":"f","b":"f","c":"f","d":[198]},"c":[198],"d":[198]},"b":{"a":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[198]},"d":{"a":[198],"b":"f","c":[198],"d":[198]}},"c":[198],"d":[198]},"b":{"a":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":{"a":{"a":"f","c":"f","d":"f"},"b":{"d":"f"},"c":{"a":"f","b":"f","c":[123],"d":[123]},"d":[123]},"d":{"a":[198],"b":{"a":"f","b":"f","c":[123],"d":"f"},"c":{"a":"f","b":[123],"c":[123],"d":"f"},"d":[198]}},"c":{"a":{"a":[198],"b":{"a":"f","b":[123],"c":[123],"d":"f"},"c":{"a":"f","b":[123],"c":[123],"d":"f"},"d":[198]},"b":{"a":[123],"b":{"a":[123],"b":"f","c":[123],"d":[123]},"c":[123],"d":[123]},"c":[123],"d":{"a":[198],"b":{"a":"f","b":[123],"c":[123],"d":"f"},"c":{"a":"f","b":[123],"c":[123],"d":"f"},"d":[198]}},"d":[198]},"b":{"a":{"d":{"d":{"a":"f","d":"f"}}},"d":{"a":{"a":{"a":"f","d":"f"},"c":{"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[123]}},"d":{"a":[123],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[123],"b":"f","c":"f","d":[123]}}}},"c":{"a":{"a":{"a":[123],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[123],"b":"f","c":[123],"d":[123]},"d":[123]},"b":{"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[123]},"b":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[123]},"d":[123]},"d":[123]},"b":{"d":{"c":{"d":"f"},"d":{"c":"f","d":"f"}}},"c":{"a":{"a":[123],"b":{"a":"f","b":"f","c":[123],"d":[123]},"c":[123],"d":[123]},"b":{"a":{"a":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[123],"d":[123]},"c":[123],"d":[123]},"d":[123]},"d":{"a":[198],"b":{"a":{"a":[198],"b":{"a":"f","b":[123],"c":[123],"d":"f"},"c":{"a":"f","b":[123],"c":[123],"d":"f"},"d":[198]},"b":[123],"c":[123],"d":{"a":[198],"b":{"a":"f","b":[123],"c":[123],"d":"f"},"c":{"a":"f","b":[123],"c":[123],"d":"f"},"d":[198]}},"c":{"a":{"a":{"a":[198],"b":[198],"c":[198],"d":"f"},"b":{"a":"f","b":[123],"c":[123],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[81]},"d":{"a":"f","b":"f","c":[81],"d":[81]}},"b":[123],"c":[123],"d":{"a":[81],"b":{"a":[81],"b":"f","c":"f","d":[81]},"c":{"a":"f","b":"f","c":[123],"d":"f"},"d":{"a":[81],"b":[81],"c":"f","d":[81]}}},"d":{"a":{"a":{"a":"f","b":"f","c":[81],"d":"f"},"b":{"a":"f","b":"f","c":[81],"d":[81]},"c":[81],"d":[81]},"b":{"a":{"a":"f","b":"f","c":"f","d":[81]},"b":{"a":"f","b":[198],"c":"f","d":"f"},"c":[81],"d":[81]},"c":[81],"d":[81]}}},"d":{"a":{"a":[170],"b":[170],"c":{"a":{"a":{"a":[170],"b":[170],"c":"f","d":"f"},"b":[170],"c":[170],"d":{"a":[173],"b":"f","c":"f","d":"f"}},"b":[170],"c":{"a":[170],"b":[170],"c":{"a":[170],"b":[170],"c":"f","d":"f"},"d":[170]},"d":[170]},"d":{"a":[170],"b":{"a":{"a":[170],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":[173]},"c":{"a":[173],"b":[173],"c":"f","d":"f"},"d":{"a":"f","b":[173],"c":"f","d":"f"}},"c":[170],"d":[170]}},"b":{"a":{"a":{"a":{"a":[170],"b":"f","c":"f","d":[170]},"b":[81],"c":[81],"d":{"a":[170],"b":"f","c":"f","d":[170]}},"b":[81],"c":[81],"d":{"a":{"a":[170],"b":"f","c":"f","d":[170]},"b":[81],"c":[81],"d":{"a":[170],"b":"f","c":"f","d":[170]}}},"b":{"a":[81],"b":{"a":{"a":"f","b":[198],"c":[198],"d":"f"},"b":[198],"c":[198],"d":{"a":"f","b":[198],"c":[198],"d":"f"}},"c":{"a":{"a":"f","b":[198],"c":[198],"d":"f"},"b":[198],"c":[198],"d":{"a":"f","b":[198],"c":[198],"d":"f"}},"d":[81]},"c":{"a":[81],"b":{"a":{"a":"f","b":[198],"c":[198],"d":"f"},"b":[198],"c":[198],"d":{"a":"f","b":[198],"c":[198],"d":"f"}},"c":{"a":{"a":"f","b":[198],"c":[198],"d":"f"},"b":[198],"c":[198],"d":{"a":"f","b":[198],"c":[198],"d":"f"}},"d":[81]},"d":{"a":{"a":{"a":[170],"b":"f","c":"f","d":[170]},"b":[81],"c":[81],"d":{"a":[170],"b":"f","c":"f","d":[170]}},"b":[81],"c":[81],"d":{"a":{"a":[170],"b":"f","c":"f","d":[170]},"b":[81],"c":[81],"d":{"a":[170],"b":"f","c":"f","d":"f"}}}},"c":{"a":[81],"b":{"a":[81],"b":{"a":{"a":"f","b":[198],"c":[198],"d":"f"},"b":[198],"c":[198],"d":{"a":"f","b":[198],"c":[198],"d":"f"}},"c":{"a":{"a":"f","b":[198],"c":[198],"d":"f"},"b":[198],"c":[198],"d":{"a":"f","b":[198],"c":[198],"d":"f"}},"d":[81]},"c":{"a":[81],"b":{"a":{"a":"f","b":"f","c":[81],"d":[81]},"b":{"a":"f","b":"f","c":"f","d":[81]},"c":[81],"d":[81]},"c":[81],"d":[81]},"d":[81]},"d":{"a":{"a":{"a":[170],"b":[170],"c":{"a":[170],"b":[170],"c":"f","d":"f"},"d":[170]},"b":{"a":[170],"b":{"a":[170],"b":[170],"c":"f","d":[170]},"c":{"a":"f","b":"f","c":[81],"d":[81]},"d":{"a":"f","b":"f","c":[81],"d":"f"}},"c":[81],"d":{"a":{"a":[170],"b":[170],"c":"f","d":[170]},"b":{"a":"f","b":[81],"c":[81],"d":"f"},"c":[81],"d":{"a":"f","b":"f","c":[81],"d":"f"}}},"b":{"a":{"a":{"a":[170],"b":[170],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[81],"d":"f"},"c":[81],"d":[81]},"b":{"a":{"a":"f","b":"f","c":[81],"d":[81]},"b":{"a":"f","b":[81],"c":[81],"d":[81]},"c":[81],"d":[81]},"c":[81],"d":[81]},"c":[81],"d":{"a":{"a":{"a":"f","b":[81],"c":[81],"d":[81]},"b":[81],"c":[81],"d":[81]},"b":[81],"c":[81],"d":[81]}}}},"b":{"c":{"c":{"b":{"b":{"c":{"c":"f","d":"f"},"d":{"c":"f"}},"c":{"a":{"a":"f","b":"f","c":[214],"d":[214]},"b":[214],"c":{"a":"f","b":"f","c":"f"},"d":{"a":"f","b":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"b":"f"}}},"c":{"b":{"c":{"b":"f","c":"f","d":"f"},"d":{"c":"f"}},"c":{"a":{"a":"f","b":"f","c":[214],"d":"f"},"b":[214],"c":[214],"d":[214]},"d":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":[214],"c":[214],"d":[214]},"d":{"a":"f","b":"f","c":[214],"d":"f"}}},"d":{"c":{"c":{"c":"f"}}}},"d":{"a":{"c":{"c":{"c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":{"a":[53],"b":"f","c":[53],"d":[53]},"d":[53]}},"c":{"a":{"a":{"a":"f","d":"f"},"c":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[153]}},"b":{"d":{"c":"f","d":"f"}},"c":{"a":{"a":[153],"b":"f","c":"f","d":[153]},"b":{"d":"f"},"d":{"a":"f","b":"f"}},"d":{"a":[153],"b":[153],"c":{"a":[153],"b":"f","c":"f","d":"f"},"d":[153]}},"d":{"a":[53],"b":{"a":[53],"b":{"a":"f","b":"f","c":[153],"d":"f"},"c":{"a":"f","b":[153],"c":[153],"d":"f"},"d":[53]},"c":{"a":[53],"b":{"a":"f","b":[153],"c":[153],"d":"f"},"c":{"a":"f","b":[153],"c":[153],"d":"f"},"d":[53]},"d":[53]}}},"d":{"c":{"a":{"c":{"c":{"a":"f","b":"f","c":[53],"d":[53]},"d":{"a":"f","b":"f","c":[53],"d":[53]}},"d":{"c":{"a":"f","b":"f","c":[53],"d":[53]},"d":{"b":"f","c":"f","d":"f"}}},"b":{"c":{"a":{"a":"f","b":"f","c":[53],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[53]},"c":[53],"d":[53]},"d":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[53],"d":{"a":"f","b":[53],"c":[53],"d":[53]}}},"c":[53],"d":[53]},"d":{"b":{"c":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"d":{"c":{"c":"f"}}},"c":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[53],"d":[53]},"c":[53],"d":{"a":"f","b":[53],"c":[53],"d":"f"}},"b":{"a":{"a":[53],"b":"f","c":[53],"d":[53]},"b":{"a":"f","b":[53],"c":[53],"d":[53]},"c":[53],"d":[53]},"c":[53],"d":{"a":{"a":"f","b":[53],"c":[53],"d":"f"},"b":[53],"c":[53],"d":{"a":"f","b":[53],"c":[53],"d":"f"}}},"d":{"a":{"a":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[195],"d":"f"},"d":{"a":[123],"b":"f","c":[123],"d":[123]}},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[94],"d":{"a":"f","b":[94],"c":[94],"d":"f"}},"c":{"a":{"a":"f","b":[94],"c":[94],"d":"f"},"b":[94],"c":[94],"d":{"a":"f","b":[94],"c":[94],"d":"f"}},"d":{"a":[123],"b":{"a":"f","b":[195],"c":[195],"d":"f"},"c":{"a":"f","b":[195],"c":[195],"d":"f"},"d":{"a":[123],"b":[123],"c":"f","d":[123]}}}}}},"c":{"a":{"a":{"a":{"a":{"a":{"a":[123],"b":"f","c":"f","d":"f"},"b":[195],"c":[195],"d":[195]},"b":{"a":{"a":"f","b":[94],"c":[94],"d":"f"},"b":[94],"c":[94],"d":{"a":"f","b":[94],"c":[94],"d":"f"}},"c":{"a":{"a":"f","b":[94],"c":[94],"d":"f"},"b":[94],"c":[94],"d":{"a":"f","b":[94],"c":[94],"d":"f"}},"d":[195]},"b":{"a":{"a":{"a":"f","b":[53],"c":[53],"d":"f"},"b":[53],"c":[53],"d":{"a":"f","b":[53],"c":[53],"d":"f"}},"b":[53],"c":[53],"d":{"a":{"a":"f","b":[53],"c":[53],"d":"f"},"b":[53],"c":[53],"d":{"a":"f","b":[53],"c":[53],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[53],"c":[53],"d":"f"},"b":[53],"c":[53],"d":{"a":"f","b":[53],"c":[53],"d":"f"}},"b":[53],"c":[53],"d":{"a":{"a":"f","b":[53],"c":[53],"d":"f"},"b":[53],"c":[53],"d":{"a":"f","b":[53],"c":[53],"d":"f"}}},"d":{"a":[195],"b":{"a":{"a":"f","b":[94],"c":[94],"d":"f"},"b":[94],"c":[94],"d":{"a":"f","b":[94],"c":[94],"d":"f"}},"c":{"a":{"a":"f","b":[94],"c":[94],"d":"f"},"b":[94],"c":[94],"d":{"a":"f","b":[94],"c":[94],"d":"f"}},"d":[195]}},"b":[53],"c":{"a":{"a":[53],"b":[53],"c":{"a":[53],"b":[53],"c":{"a":[53],"b":[53],"c":[53],"d":"f"},"d":{"a":"f","b":[53],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":[53],"c":"f","d":"f"},"b":[53],"c":{"a":"f","b":"f"},"d":{"a":"f","b":"f","d":"f"}}},"b":[53],"c":{"a":{"a":{"a":[53],"b":[53],"c":[53],"d":"f"},"b":[53],"c":[53],"d":{"a":[53],"b":[53],"c":[53],"d":"f"}},"b":[53],"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[53],"c":{"a":"f","b":[53],"c":"f","d":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":"f","b":[53],"c":"f","d":"f"},"b":[53],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f"}}},"d":{"b":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f"}},"c":{"b":{"b":"f"}}}},"d":{"a":{"a":[195],"b":{"a":{"a":"f","b":[94],"c":[94],"d":"f"},"b":[94],"c":[94],"d":{"a":"f","b":[94],"c":[94],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[197],"d":[197]},"c":{"a":[197],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":[195],"b":[195],"c":"f","d":"f"},"b":{"a":[195],"b":[195],"c":"f","d":"f"},"c":{"a":"f","b":[194],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[126],"d":"f"}}},"b":{"a":{"a":{"a":"f","b":[53],"c":[53],"d":"f"},"b":[53],"c":[53],"d":{"a":"f","b":[53],"c":[53],"d":"f"}},"b":[53],"c":{"a":{"a":[53],"b":[53],"c":"f","d":"f"},"b":{"a":[53],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"a":"f","b":"f"}},"d":{"a":{"a":"f","b":[53],"c":"f","d":"f"},"b":{"a":[53],"b":[53],"c":"f","d":"f"},"d":{"a":"f","b":"f"}}},"d":{"a":{"a":[126],"b":{"a":"f","b":"f","c":"f","d":[126]},"c":{"a":"f","b":"f","d":"f"},"d":{"a":[126],"b":[126],"c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":[180],"b":"f","c":"f","d":[180]},"b":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}}}}},"b":{"a":{"a":{"a":[53],"b":{"a":[53],"b":{"a":"f","b":[153],"c":[153],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[53]},"c":{"a":[53],"b":{"a":"f","b":[153],"c":[153],"d":"f"},"c":{"a":"f","b":[153],"c":[153],"d":"f"},"d":[53]},"d":[53]},"b":{"a":{"a":{"a":[153],"b":"f","c":"f","d":"f"},"b":{"a":"f"},"c":{"a":"f","b":"f","c":[153],"d":[153]},"d":{"a":"f","b":"f","c":[153],"d":"f"}},"b":{"c":{"d":"f"},"d":{"a":"f","c":"f","d":"f"}},"c":{"a":[153],"b":{"a":"f","b":"f","c":"f","d":[153]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[153],"b":"f","c":"f","d":[153]}},"d":[153]},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[153],"b":"f","c":"f","d":"f"},"c":{"d":"f"},"d":{"a":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","d":"f"},"c":{"c":"f"}},"c":{"b":{"b":"f","c":"f"},"d":{"a":"f","d":"f"}},"d":{"a":[153],"b":{"a":"f","b":"f","c":"f","d":[153]},"c":{"a":[153],"b":"f","c":[153],"d":[153]},"d":[153]}},"d":{"a":[53],"b":{"a":{"a":[53],"b":[53],"c":"f","d":[53]},"b":{"a":"f","b":[153],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[53],"b":"f","c":[53],"d":[53]}},"c":{"a":[53],"b":{"a":"f","b":[153],"c":[153],"d":"f"},"c":{"a":"f","b":[153],"c":[153],"d":"f"},"d":[53]},"d":[53]}},"b":{"a":{"a":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":[214],"c":[214],"d":[214]},"d":{"b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":[214],"d":"f"},"b":{"a":"f","b":"f","c":[214],"d":[214]},"c":[214],"d":[214]},"c":{"a":[214],"b":[214],"c":[214],"d":{"a":"f","b":[214],"c":[214],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[214],"b":[214],"c":[214],"d":"f"},"c":{"a":"f","b":"f"}}},"b":{"a":[214],"b":[214],"c":{"a":[214],"b":[214],"c":{"a":"f","b":[214],"c":"f","d":"f"},"d":{"a":"f","b":"f"}},"d":{"a":[214],"b":[214],"c":{"a":"f","b":"f","d":"f"},"d":[214]}},"c":{"a":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f"}},"c":{"b":{"c":"f"},"c":{"b":"f"}}},"d":{"a":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[153],"d":[153]},"d":{"b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":[214],"c":"f","d":"f"},"b":{"a":[214],"b":[214],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f"}},"d":{"a":{"a":[153],"b":[153],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"}}}},"c":{"a":{"b":{"c":{"a":"f","d":"f"},"d":{"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"}}},"d":{"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}}},"d":{"a":{"a":[53],"b":{"a":[53],"b":{"a":"f","b":[153],"c":[153],"d":"f"},"c":{"a":"f","b":[153],"c":[153],"d":"f"},"d":[53]},"c":{"a":[53],"b":{"a":"f","b":[153],"c":[153],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[53]},"d":[53]},"b":{"a":{"a":[153],"b":[153],"c":{"a":[153],"b":"f","c":"f","d":[153]},"d":[153]},"b":{"a":{"a":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"c":{"a":{"a":[153],"b":"f","c":"f","d":[153]},"b":{"a":"f","d":"f"},"d":{"a":"f","b":"f"}},"d":{"a":[153],"b":{"a":[153],"b":[153],"c":"f","d":"f"},"c":{"a":"f","b":"f"},"d":{"a":"f","b":"f"}}},"d":{"a":{"a":{"a":[53],"b":[53],"c":"f","d":"f"},"b":{"a":[53],"b":[53],"c":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"b":{"a":{"a":[53],"b":[53],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"d":{"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":[53]},"b":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[53]},"d":[53]}}}},"c":{"a":{"a":{"a":{"a":{"a":"f","b":[53],"c":"f","d":"f"},"b":{"a":[53],"b":[53],"c":[53],"d":"f"},"c":{"a":"f","b":[53],"c":[53],"d":"f"},"d":{"c":"f"}},"b":{"a":{"a":"f","b":"f","c":[53],"d":[53]},"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":[153],"c":[153],"d":"f"},"d":{"a":[53],"b":[53],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":[153],"c":"f","d":"f"},"c":{"a":"f","b":"f"}},"d":{"a":{"b":"f"},"b":{"a":"f","b":"f"}}},"b":{"a":{"a":{"d":"f"},"c":{"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[153]}},"c":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[153],"b":"f","c":[153],"d":"f"}},"d":{"a":{"a":[153],"b":[153],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":[153]},"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}}},"c":{"b":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":[153],"c":"f","d":"f"},"c":{"b":"f"}}}},"b":{"a":{"d":{"d":{"d":"f"}}},"c":{"a":{"c":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":{"a":{"a":[52],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":[52]},"c":{"a":"f","b":"f"},"d":{"b":"f"}},"d":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":[52],"b":[52],"c":"f","d":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":[52],"d":"f"},"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f"}},"b":{"c":{"a":"f","b":"f","c":[52],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"b":"f"},"b":{"a":"f","b":"f"}}}}},"d":{"a":{"a":{"a":{"a":{"a":"f"}}}},"b":{"b":{"a":{"b":{"b":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"}}}}}},"d":{"a":{"a":{"a":{"a":{"a":{"a":[81],"b":[81],"c":"f","d":"f"},"b":{"a":[81],"b":[81],"c":"f","d":"f"},"c":[170],"d":[170]},"b":{"a":{"a":[81],"b":[81],"c":"f","d":"f"},"b":{"a":[81],"b":[81],"c":"f","d":"f"},"c":[170],"d":[170]},"c":[170],"d":[170]},"b":{"a":{"a":{"a":[81],"b":[81],"c":"f","d":"f"},"b":{"a":[81],"b":[81],"c":"f","d":"f"},"c":[170],"d":[170]},"b":{"a":{"a":[81],"b":[81],"c":"f","d":"f"},"b":{"a":[81],"b":[81],"c":"f","d":"f"},"c":[170],"d":[170]},"c":[170],"d":[170]},"c":[170],"d":[170]},"b":{"a":{"a":{"a":{"a":[81],"b":[81],"c":"f","d":"f"},"b":[81],"c":[81],"d":{"a":[170],"b":"f","c":"f","d":[170]}},"b":[81],"c":[81],"d":{"a":{"a":[170],"b":"f","c":"f","d":[170]},"b":[81],"c":[81],"d":{"a":[170],"b":"f","c":"f","d":[170]}}},"b":{"a":[81],"b":[81],"c":{"a":{"a":[81],"b":[81],"c":"f","d":[81]},"b":{"a":[81],"b":[81],"c":"f","d":"f"},"c":[198],"d":{"a":"f","b":"f","c":[198],"d":"f"}},"d":{"a":[81],"b":[81],"c":{"a":[81],"b":[81],"c":"f","d":"f"},"d":{"a":[81],"b":[81],"c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":[198],"c":[198],"d":[198]},"b":[198],"c":[198],"d":[198]},"b":[198],"c":[198],"d":[198]},"d":{"a":{"a":{"a":[170],"b":"f","c":"f","d":[170]},"b":{"a":"f","b":"f","c":[198],"d":"f"},"c":[198],"d":{"a":[170],"b":"f","c":"f","d":[170]}},"b":{"a":{"a":"f","b":"f","c":[198],"d":[198]},"b":{"a":"f","b":"f","c":[198],"d":[198]},"c":[198],"d":[198]},"c":[198],"d":{"a":{"a":[170],"b":"f","c":"f","d":[170]},"b":[198],"c":[198],"d":{"a":[170],"b":"f","c":"f","d":[170]}}}},"c":{"a":{"a":{"a":{"a":[170],"b":"f","c":"f","d":[170]},"b":[198],"c":[198],"d":{"a":[170],"b":"f","c":"f","d":[170]}},"b":[198],"c":{"a":{"a":[198],"b":[198],"c":"f","d":"f"},"b":{"a":[198],"b":[198],"c":"f","d":"f"},"c":[172],"d":[172]},"d":{"a":{"a":[170],"b":"f","c":"f","d":"f"},"b":{"a":[198],"b":[198],"c":"f","d":"f"},"c":[172],"d":{"a":[196],"b":"f","c":"f","d":[196]}}},"b":{"a":[198],"b":[198],"c":{"a":{"a":[198],"b":[198],"c":"f","d":"f"},"b":{"a":[198],"b":[198],"c":"f","d":"f"},"c":[99],"d":{"a":"f","b":[99],"c":[99],"d":"f"}},"d":{"a":{"a":[198],"b":[198],"c":"f","d":"f"},"b":{"a":[198],"b":[198],"c":"f","d":"f"},"c":[172],"d":[172]}},"c":{"a":[172],"b":{"a":{"a":"f","b":[99],"c":[99],"d":"f"},"b":[99],"c":[99],"d":{"a":"f","b":[99],"c":[99],"d":"f"}},"c":{"a":{"a":"f","b":[99],"c":[99],"d":"f"},"b":[99],"c":[99],"d":{"a":"f","b":[99],"c":[99],"d":"f"}},"d":[172]},"d":{"a":{"a":{"a":[196],"b":"f","c":"f","d":[196]},"b":[172],"c":[172],"d":{"a":[196],"b":"f","c":"f","d":[196]}},"b":[172],"c":[172],"d":{"a":{"a":[196],"b":"f","c":"f","d":[196]},"b":[172],"c":[172],"d":{"a":[196],"b":"f","c":"f","d":[196]}}}},"d":{"a":{"a":[170],"b":[170],"c":{"a":[170],"b":{"a":[170],"b":[170],"c":"f","d":"f"},"c":{"a":"f","b":[196],"c":[196],"d":"f"},"d":[170]},"d":[170]},"b":{"a":[170],"b":[170],"c":{"a":{"a":[170],"b":[170],"c":"f","d":"f"},"b":{"a":[170],"b":[170],"c":"f","d":"f"},"c":[196],"d":[196]},"d":{"a":{"a":[170],"b":[170],"c":"f","d":"f"},"b":{"a":[170],"b":[170],"c":"f","d":"f"},"c":[196],"d":[196]}},"c":[196],"d":{"a":{"a":[170],"b":[170],"c":{"a":[170],"b":"f","c":"f","d":[170]},"d":[170]},"b":{"a":{"a":"f","b":"f","c":[196],"d":"f"},"b":{"a":"f","b":[196],"c":[196],"d":"f"},"c":[196],"d":{"a":"f","b":[196],"c":[196],"d":[196]}},"c":[196],"d":{"a":{"a":[170],"b":[170],"c":"f","d":"f"},"b":{"a":[170],"b":"f","c":"f","d":"f"},"c":{"a":[196],"b":"f","c":[196],"d":[196]},"d":[196]}}}},"b":{"a":{"a":{"a":{"a":[81],"b":[81],"c":{"a":[81],"b":[81],"c":"f","d":"f"},"d":[81]},"b":{"a":[81],"b":{"a":[81],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[198],"c":[198],"d":[198]},"d":{"a":"f","b":"f","c":[198],"d":"f"}},"c":[198],"d":{"a":{"a":[81],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[198],"c":[198],"d":[198]},"c":[198],"d":[198]}},"b":{"a":{"a":{"a":"f","b":"f","c":[198],"d":[198]},"b":{"a":"f","b":[123],"c":[123],"d":"f"},"c":{"a":"f","b":[123],"c":[123],"d":"f"},"d":[198]},"b":[123],"c":[123],"d":{"a":[198],"b":{"a":"f","b":[123],"c":[123],"d":"f"},"c":{"a":"f","b":[123],"c":[123],"d":"f"},"d":[198]}},"c":{"a":{"a":[198],"b":{"a":"f","b":[123],"c":[123],"d":"f"},"c":{"a":"f","b":[123],"c":[123],"d":"f"},"d":[198]},"b":[123],"c":[123],"d":{"a":[198],"b":{"a":"f","b":[123],"c":[123],"d":"f"},"c":{"a":"f","b":[123],"c":[123],"d":"f"},"d":[198]}},"d":[198]},"b":{"a":[123],"b":{"a":[123],"b":{"a":[123],"b":{"a":[123],"b":[123],"c":"f","d":"f"},"c":{"a":"f","b":[195],"c":[195],"d":"f"},"d":{"a":[123],"b":"f","c":"f","d":[123]}},"c":{"a":{"a":"f","b":"f","c":[195],"d":"f"},"b":{"a":"f","b":[195],"c":[195],"d":[195]},"c":[195],"d":{"a":"f","b":[195],"c":[195],"d":"f"}},"d":{"a":[123],"b":{"a":[123],"b":[123],"c":"f","d":[123]},"c":{"a":[123],"b":[123],"c":"f","d":[123]},"d":[123]}},"c":{"a":{"a":{"a":[123],"b":[123],"c":"f","d":[123]},"b":{"a":"f","b":"f","c":[195],"d":"f"},"c":{"a":"f","b":[195],"c":[195],"d":[195]},"d":{"a":[123],"b":"f","c":"f","d":"f"}},"b":[195],"c":[195],"d":{"a":{"a":"f","b":"f","c":[195],"d":"f"},"b":[195],"c":[195],"d":{"a":"f","b":[195],"c":[195],"d":[195]}}},"d":{"a":[123],"b":[123],"c":{"a":[123],"b":[123],"c":{"a":[123],"b":"f","c":"f","d":"f"},"d":[123]},"d":[123]}},"c":{"a":{"a":{"a":[123],"b":[123],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[123],"b":"f","c":"f","d":"f"}},"b":{"a":{"a":[123],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[195],"c":[195],"d":[195]},"c":[195],"d":{"a":"f","b":[195],"c":[195],"d":"f"}},"c":{"a":{"a":[195],"b":[195],"c":"f","d":"f"},"b":{"a":[195],"b":[195],"c":"f","d":"f"},"c":[194],"d":{"a":[102],"b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":[195],"c":"f","d":"f"},"b":{"a":[195],"b":[195],"c":"f","d":"f"},"c":[102],"d":[102]}},"b":{"a":[195],"b":[195],"c":{"a":{"a":[195],"b":[195],"c":"f","d":"f"},"b":{"a":[195],"b":[195],"c":"f","d":"f"},"c":{"a":[194],"b":[194],"c":"f","d":[194]},"d":[194]},"d":{"a":{"a":[195],"b":[195],"c":"f","d":"f"},"b":{"a":[195],"b":[195],"c":"f","d":"f"},"c":[194],"d":[194]}},"c":{"a":[194],"b":{"a":{"a":[194],"b":[194],"c":"f","d":[194]},"b":{"a":"f","b":"f","c":[126],"d":"f"},"c":{"a":[126],"b":[126],"c":"f","d":[126]},"d":{"a":[194],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[126],"b":"f","c":"f","d":"f"},"c":{"a":[180],"b":"f","c":[180],"d":[180]},"d":[180]},"d":{"a":[194],"b":{"a":[194],"b":[194],"c":"f","d":[194]},"c":{"a":[194],"b":"f","c":"f","d":"f"},"d":{"a":[194],"b":[194],"c":"f","d":[194]}}},"d":{"a":{"a":[102],"b":{"a":[102],"b":[102],"c":"f","d":"f"},"c":{"a":"f","b":[194],"c":[194],"d":[194]},"d":{"a":[102],"b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":[194],"c":[194],"d":"f"},"b":[194],"c":[194],"d":[194]},"c":[194],"d":{"a":{"a":"f","b":"f","c":[194],"d":"f"},"b":[194],"c":[194],"d":{"a":"f","b":[194],"c":[194],"d":[194]}}}},"d":{"a":{"a":[198],"b":[198],"c":{"a":{"a":[198],"b":[198],"c":"f","d":"f"},"b":{"a":[198],"b":[198],"c":"f","d":"f"},"c":[99],"d":[99]},"d":{"a":{"a":[198],"b":[198],"c":"f","d":"f"},"b":{"a":[198],"b":[198],"c":"f","d":"f"},"c":[99],"d":[99]}},"b":{"a":{"a":[198],"b":{"a":"f","b":[123],"c":[123],"d":"f"},"c":{"a":"f","b":[123],"c":[123],"d":"f"},"d":[198]},"b":[123],"c":{"a":{"a":[123],"b":[123],"c":"f","d":"f"},"b":{"a":[123],"b":[123],"c":"f","d":"f"},"c":[102],"d":[102]},"d":{"a":{"a":[198],"b":[198],"c":"f","d":"f"},"b":{"a":"f","b":[123],"c":"f","d":"f"},"c":{"a":"f","b":[102],"c":[102],"d":"f"},"d":[99]}},"c":{"a":{"a":[99],"b":{"a":"f","b":[102],"c":[102],"d":"f"},"c":{"a":"f","b":[102],"c":"f","d":"f"},"d":[99]},"b":{"a":[102],"b":[102],"c":{"a":[102],"b":[102],"c":"f","d":"f"},"d":{"a":[102],"b":[102],"c":"f","d":"f"}},"c":{"a":[95],"b":[95],"c":{"a":[95],"b":"f","c":"f","d":[95]},"d":[95]},"d":{"a":[99],"b":{"a":"f","b":[95],"c":[95],"d":"f"},"c":{"a":"f","b":[95],"c":[95],"d":"f"},"d":[99]}},"d":[99]}},"c":{"a":{"a":[99],"b":{"a":{"a":[99],"b":{"a":"f","b":[95],"c":[95],"d":"f"},"c":{"a":"f","b":[95],"c":[95],"d":"f"},"d":[99]},"b":{"a":[95],"b":{"a":[95],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[194],"c":[194],"d":[194]},"d":{"a":[95],"b":"f","c":"f","d":[95]}},"c":{"a":{"a":"f","b":"f","c":[194],"d":"f"},"b":[194],"c":[194],"d":[194]},"d":{"a":[99],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[194],"d":"f"},"d":[99]}},"c":{"a":{"a":{"a":"f","b":"f","c":[194],"d":"f"},"b":{"a":"f","b":[194],"c":[194],"d":[194]},"c":[194],"d":{"a":"f","b":[194],"c":[194],"d":"f"}},"b":[194],"c":[194],"d":{"a":{"a":"f","b":[194],"c":[194],"d":[194]},"b":[194],"c":[194],"d":[194]}},"d":{"a":[99],"b":[99],"c":{"a":[99],"b":{"a":[99],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[194],"c":[194],"d":"f"},"d":{"a":[99],"b":[99],"c":"f","d":[99]}},"d":[99]}},"b":{"a":[194],"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[180],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[194]}},"b":{"a":[180],"b":{"a":[180],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[180]},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f"},"d":{"a":[194],"b":"f","c":"f","d":[194]}},"d":{"a":{"a":[194],"b":"f","c":[194],"d":[194]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[194],"c":"f","d":"f"},"d":[194]}},"c":{"a":{"a":{"a":[194],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[194],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"b":{"a":{"a":[194],"b":"f","c":"f","d":"f"},"d":{"a":"f"}},"d":{"a":{"b":"f"},"b":{"a":"f","b":"f"},"d":{"d":"f"}}},"d":{"a":[194],"b":{"a":[194],"b":[194],"c":{"a":[194],"b":[194],"c":"f","d":[194]},"d":[194]},"c":{"a":[194],"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[194]},"d":[194]},"d":[194]}},"c":{"a":{"a":[194],"b":{"a":[194],"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"c":{"a":{"a":"f"}},"d":{"a":{"a":[194],"b":[194],"c":"f","d":[194]},"b":{"a":[194],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[132]}}},"d":{"a":{"a":{"a":[132],"b":"f","c":"f","d":[132]},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}}}},"d":{"a":{"a":[99],"b":{"a":{"a":[99],"b":"f","c":"f","d":[99]},"b":{"a":"f","b":[194],"c":[194],"d":[194]},"c":{"a":"f","b":[194],"c":[194],"d":"f"},"d":{"a":[99],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[96]},"b":{"a":"f","b":"f","c":[132],"d":[132]},"c":[132],"d":{"a":[96],"b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":[96],"d":[96]},"b":{"a":"f","b":"f","c":[96],"d":[96]},"c":[96],"d":[96]}},"b":{"a":[194],"b":[194],"c":{"a":{"a":"f","b":"f","c":[132],"d":[132]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[132],"b":"f","c":[132],"d":[132]},"d":[132]},"d":{"a":{"a":"f","b":"f","c":[132],"d":[132]},"b":{"a":"f","b":"f","c":[132],"d":[132]},"c":[132],"d":[132]}},"c":[132],"d":{"a":{"a":[96],"b":{"a":[96],"b":[96],"c":"f","d":[96]},"c":{"a":[96],"b":"f","c":"f","d":"f"},"d":[96]},"b":{"a":{"a":"f","b":[132],"c":[132],"d":"f"},"b":[132],"c":[132],"d":[132]},"c":{"a":{"a":[132],"b":[132],"c":"f","d":[132]},"b":{"a":[132],"b":[132],"c":[132],"d":"f"},"c":{"a":[132],"b":[132],"c":[132],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[80]}},"d":{"a":[96],"b":{"a":"f","b":[132],"c":[132],"d":"f"},"c":{"a":"f","b":"f","c":[80],"d":[80]},"d":{"a":[96],"b":"f","c":"f","d":[96]}}}}},"d":{"a":{"a":{"a":{"a":{"a":"f","b":[196],"c":"f","d":"f"},"b":[196],"c":{"a":"f","b":[196],"c":[196],"d":"f"},"d":{"a":[169],"b":"f","c":[169],"d":[169]}},"b":[196],"c":{"a":{"a":[196],"b":[196],"c":[196],"d":"f"},"b":[196],"c":[196],"d":{"a":"f","b":"f","c":"f","d":[169]}},"d":{"a":{"a":"f","b":[169],"c":[169],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[169]},"c":[169],"d":{"a":"f","b":[169],"c":[169],"d":[169]}}},"b":[196],"c":[196],"d":{"a":{"a":{"a":[169],"b":[169],"c":[169],"d":"f"},"b":[169],"c":[169],"d":{"a":"f","b":[169],"c":[169],"d":"f"}},"b":{"a":{"a":[169],"b":"f","c":[169],"d":[169]},"b":{"a":"f","b":[196],"c":"f","d":"f"},"c":{"a":[169],"b":"f","c":"f","d":[169]},"d":[169]},"c":{"a":[169],"b":{"a":[169],"b":"f","c":"f","d":[169]},"c":{"a":[169],"b":"f","c":"f","d":[169]},"d":[169]},"d":{"a":{"a":"f","b":[169],"c":"f","d":"f"},"b":[169],"c":[169],"d":{"a":"f","b":"f","c":[169],"d":"f"}}}},"b":{"a":{"a":{"a":{"a":[196],"b":"f","c":"f","d":[196]},"b":[172],"c":[172],"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":[172],"c":{"a":[172],"b":{"a":[172],"b":[172],"c":"f","d":"f"},"c":{"a":"f","b":[187],"c":[187],"d":"f"},"d":[172]},"d":{"a":{"a":[196],"b":"f","c":"f","d":"f"},"b":[172],"c":[172],"d":{"a":"f","b":[172],"c":[172],"d":"f"}}},"b":{"a":[172],"b":{"a":{"a":"f","b":[99],"c":[99],"d":"f"},"b":[99],"c":[99],"d":{"a":"f","b":[99],"c":[99],"d":"f"}},"c":{"a":{"a":"f","b":[99],"c":[99],"d":"f"},"b":[99],"c":[99],"d":{"a":"f","b":[99],"c":[99],"d":"f"}},"d":{"a":{"a":[172],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[187],"b":[187],"c":"f","d":[187]},"d":[187]}},"c":{"a":{"a":[187],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[187],"b":"f","c":[187],"d":[187]},"d":{"a":"f","b":[187],"c":[187],"d":"f"}},"b":{"a":[99],"b":[99],"c":[99],"d":{"a":"f","b":[99],"c":[99],"d":"f"}},"c":{"a":{"a":"f","b":[99],"c":[99],"d":"f"},"b":[99],"c":[99],"d":{"a":"f","b":[99],"c":[99],"d":"f"}},"d":{"a":{"a":[187],"b":[187],"c":[187],"d":"f"},"b":[187],"c":[187],"d":{"a":"f","b":[187],"c":[187],"d":[187]}}},"d":{"a":{"a":{"a":"f","b":[172],"c":[172],"d":"f"},"b":[172],"c":[172],"d":{"a":"f","b":[172],"c":[172],"d":"f"}},"b":{"a":[172],"b":{"a":"f","b":"f","c":"f","d":[172]},"c":{"a":[172],"b":"f","c":"f","d":[172]},"d":[172]},"c":{"a":[172],"b":{"a":[172],"b":"f","c":"f","d":[172]},"c":{"a":"f","b":"f","c":[187],"d":"f"},"d":[172]},"d":{"a":{"a":"f","b":[172],"c":[172],"d":"f"},"b":[172],"c":[172],"d":{"a":"f","b":[172],"c":[172],"d":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","b":[172],"c":[172],"d":"f"},"b":[172],"c":[172],"d":{"a":"f","b":[172],"c":[172],"d":"f"}},"b":{"a":[172],"b":{"a":"f","b":[187],"c":"f","d":"f"},"c":{"a":[172],"b":"f","c":"f","d":"f"},"d":[172]},"c":{"a":{"a":"f","b":"f","c":[96],"d":[96]},"b":{"a":"f","b":"f","c":[96],"d":[96]},"c":[96],"d":[96]},"d":{"a":{"a":"f","b":"f","c":[87],"d":[87]},"b":{"a":"f","b":"f","c":"f","d":[87]},"c":{"a":[87],"b":"f","c":"f","d":[87]},"d":[87]}},"b":{"a":[187],"b":{"a":{"a":"f","b":[99],"c":[99],"d":"f"},"b":[99],"c":[99],"d":{"a":"f","b":[99],"c":[99],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[96],"d":[96]},"b":{"a":"f","b":"f","c":[96],"d":[96]},"c":[96],"d":[96]},"d":{"a":{"a":"f","b":"f","c":[96],"d":[96]},"b":{"a":"f","b":"f","c":[96],"d":[96]},"c":[96],"d":[96]}},"c":[96],"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[96],"d":[96]},"c":[96],"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":[96],"c":[96],"d":{"a":{"a":"f","b":[96],"c":[96],"d":"f"},"b":[96],"c":[96],"d":[96]}}},"d":{"a":{"a":{"a":{"a":"f","b":[169],"c":[169],"d":"f"},"b":[169],"c":[169],"d":{"a":"f","b":[169],"c":"f","d":"f"}},"b":{"a":[169],"b":{"a":[169],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[169]},"c":{"a":{"a":[169],"b":[169],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[87],"d":"f"},"c":[87],"d":{"a":[87],"b":"f","c":[87],"d":[87]}},"d":{"a":{"a":[152],"b":"f","c":"f","d":[152]},"b":{"a":"f","b":[169],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[87],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"b":{"a":[196],"b":[196],"c":{"a":{"a":"f","b":"f","c":[87],"d":[87]},"b":{"a":"f","b":"f","c":[87],"d":[87]},"c":[87],"d":[87]},"d":{"a":{"a":"f","b":"f","c":[87],"d":[87]},"b":{"a":"f","b":"f","c":[87],"d":[87]},"c":[87],"d":[87]}},"c":{"a":[87],"b":{"a":[87],"b":{"a":[87],"b":[87],"c":"f","d":[87]},"c":{"a":[87],"b":"f","c":"f","d":"f"},"d":[87]},"c":{"a":[87],"b":{"a":[87],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[96],"c":[96],"d":"f"},"d":[87]},"d":[87]},"d":{"a":{"a":{"a":[87],"b":[87],"c":[87],"d":"f"},"b":[87],"c":[87],"d":{"a":"f","b":[87],"c":[87],"d":"f"}},"b":[87],"c":[87],"d":{"a":{"a":"f","b":[87],"c":[87],"d":[87]},"b":[87],"c":[87],"d":[87]}}}}}},"c":{"a":{"a":{"a":{"a":[87],"b":{"a":[87],"b":{"a":[87],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[87],"b":"f","c":"f","d":[87]},"d":[87]},"c":{"a":[87],"b":{"a":[87],"b":"f","c":"f","d":[87]},"c":{"a":[87],"b":"f","c":"f","d":[87]},"d":[87]},"d":[87]},"c":{"a":[87],"b":{"a":[87],"b":{"a":[87],"b":"f","c":"f","d":[87]},"c":{"a":[87],"b":[87],"c":"f","d":[87]},"d":[87]},"c":{"a":[87],"b":{"a":[87],"b":"f","c":[87],"d":[87]},"c":[87],"d":[87]},"d":[87]},"d":[87]},"b":{"a":[96],"b":{"a":[96],"b":{"a":{"a":[96],"b":[96],"c":"f","d":[96]},"b":{"a":"f","b":[96],"c":"f","d":"f"},"c":[80],"d":{"a":[96],"b":"f","c":"f","d":[96]}},"c":{"a":{"a":[96],"b":"f","c":"f","d":[96]},"b":[80],"c":[80],"d":{"a":[96],"b":"f","c":"f","d":[96]}},"d":[96]},"c":{"a":[96],"b":{"a":{"a":[96],"b":"f","c":[96],"d":[96]},"b":{"a":"f","b":"f","c":[96],"d":[96]},"c":[96],"d":[96]},"c":[96],"d":[96]},"d":{"a":{"a":{"a":[96],"b":[96],"c":[96],"d":"f"},"b":[96],"c":[96],"d":{"a":"f","b":[96],"c":[96],"d":"f"}},"b":[96],"c":[96],"d":{"a":{"a":"f","b":[96],"c":[96],"d":"f"},"b":[96],"c":[96],"d":{"a":"f","b":"f","c":"f","d":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","b":[96],"c":[96],"d":"f"},"b":[96],"c":[96],"d":{"a":"f","b":[96],"c":[96],"d":"f"}},"b":[96],"c":[96],"d":{"a":{"a":"f","b":"f","c":"f","d":[87]},"b":[96],"c":{"a":"f","b":[96],"c":[96],"d":"f"},"d":{"a":[87],"b":"f","c":[87],"d":[87]}}},"b":{"a":[96],"b":[96],"c":{"a":[96],"b":[96],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[96]},"d":[96]},"c":{"a":{"a":[96],"b":[96],"c":{"a":[96],"b":[96],"c":"f","d":[96]},"d":[96]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[96],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[163],"c":[163],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":[163],"d":{"a":[96],"b":{"a":[96],"b":"f","c":"f","d":[96]},"c":{"a":[96],"b":"f","c":"f","d":[96]},"d":[96]}},"d":{"a":{"a":[87],"b":{"a":"f","b":[96],"c":[96],"d":"f"},"c":{"a":"f","b":[96],"c":[96],"d":"f"},"d":[87]},"b":[96],"c":[96],"d":{"a":[87],"b":{"a":"f","b":[96],"c":[96],"d":"f"},"c":{"a":"f","b":[96],"c":[96],"d":"f"},"d":[87]}}},"d":[87]},"b":{"a":{"a":{"a":{"a":{"a":"f","b":"f","c":[80],"d":"f"},"b":[80],"c":[80],"d":[80]},"b":{"a":[80],"b":{"a":"f","b":[132],"c":"f","d":"f"},"c":[80],"d":[80]},"c":{"a":[80],"b":[80],"c":{"a":[80],"b":[80],"c":"f","d":"f"},"d":[80]},"d":[80]},"b":{"a":{"a":{"a":[132],"b":[132],"c":[132],"d":"f"},"b":[132],"c":[132],"d":{"a":"f","b":[132],"c":[132],"d":"f"}},"b":[132],"c":[132],"d":{"a":{"a":"f","b":[132],"c":[132],"d":"f"},"b":[132],"c":[132],"d":{"a":"f","b":[132],"c":[132],"d":"f"}}},"c":[132],"d":{"a":{"a":{"a":"f","b":"f","c":[96],"d":[96]},"b":{"a":"f","b":"f","c":[132],"d":"f"},"c":{"a":"f","b":[132],"c":[132],"d":"f"},"d":[96]},"b":{"a":{"a":"f","b":"f","c":[132],"d":[132]},"b":{"a":"f","b":[132],"c":[132],"d":[132]},"c":[132],"d":[132]},"c":[132],"d":{"a":[96],"b":{"a":"f","b":[132],"c":[132],"d":"f"},"c":{"a":"f","b":[132],"c":[132],"d":"f"},"d":[96]}}},"b":{"a":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":{"a":[132],"b":"f","c":"f","d":[132]},"d":{"a":[132],"b":"f","c":"f","d":[132]}}},"d":{"a":{"a":{"a":[132],"b":"f","c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":{"a":[132],"b":"f","c":"f","d":[132]},"d":{"a":"f","b":"f","d":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f"}}}},"d":{"a":{"a":{"a":[96],"b":{"a":"f","b":[132],"c":[132],"d":"f"},"c":{"a":"f","b":[132],"c":[132],"d":"f"},"d":[96]},"b":[132],"c":[132],"d":{"a":[96],"b":{"a":"f","b":[132],"c":[132],"d":"f"},"c":{"a":"f","b":[132],"c":[132],"d":"f"},"d":{"a":"f","b":"f","c":[163],"d":[163]}}},"b":{"a":[132],"b":{"a":[132],"b":[132],"c":{"a":[132],"b":"f","c":"f","d":[132]},"d":[132]},"c":{"a":[132],"b":{"a":[132],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[132],"b":[132],"c":"f","d":[132]}},"d":[132]},"c":{"a":[132],"b":{"a":{"a":[132],"b":"f","c":"f","d":[132]},"d":{"a":"f","b":"f","d":"f"}},"c":{"a":{"a":"f"}},"d":{"a":[132],"b":{"a":[132],"b":"f","c":"f","d":[132]},"c":{"a":[132],"b":"f","c":"f","d":"f"},"d":{"a":[132],"b":[132],"c":"f","d":"f"}}},"d":{"a":{"a":[163],"b":{"a":"f","b":[132],"c":"f","d":"f"},"c":{"a":[163],"b":"f","c":"f","d":"f"},"d":[163]},"b":[132],"c":[132],"d":{"a":[163],"b":{"a":"f","b":"f","c":[132],"d":"f"},"c":{"a":"f","b":[132],"c":[132],"d":"f"},"d":[163]}}}},"c":{"a":{"a":{"a":{"a":[163],"b":{"a":"f","b":"f","c":"f","d":[163]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[163]},"b":{"a":[132],"b":{"a":[132],"b":"f","c":"f","d":[132]},"c":{"a":[132],"b":"f","c":"f","d":"f"},"d":{"a":[132],"b":[132],"c":"f","d":"f"}},"c":{"a":[191],"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[191],"b":[191],"c":"f","d":[191]}},"d":{"a":{"a":"f","b":"f","c":[114],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[191],"c":[191],"d":"f"},"d":[114]}},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}}},"c":{"d":{"a":{"a":"f","d":"f"},"d":{"a":"f"}}},"d":{"a":{"a":{"a":[114],"b":"f","c":"f","d":[114]},"b":{"a":"f","b":[191],"c":[191],"d":[191]},"c":[191],"d":{"a":[114],"b":"f","c":"f","d":"f"}},"b":{"a":{"a":[191],"b":"f","c":"f","d":[191]},"d":{"a":[191],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f"},"b":{"b":"f","c":"f"},"c":{"b":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":[191],"c":[191],"d":"f"},"b":{"a":[191],"b":"f","c":"f","d":[191]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":[191],"c":[191],"d":"f"}}}},"d":{"a":{"a":{"a":{"a":"f","b":"f","c":[140],"d":[140]},"b":{"a":"f","b":"f","c":"f","d":[140]},"c":{"a":[140],"b":"f","c":"f","d":"f"},"d":[140]},"b":{"a":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f"},"d":{"a":"f"}}},"d":{"a":{"a":{"d":"f"}},"b":{"a":{"a":"f","d":"f"}}}}},"d":{"a":{"a":[87],"b":[87],"c":{"a":[87],"b":{"a":[87],"b":[87],"c":{"a":[87],"b":[87],"c":"f","d":[87]},"d":[87]},"c":{"a":[87],"b":{"a":[87],"b":"f","c":"f","d":[87]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[87]},"d":{"a":[87],"b":[87],"c":[87],"d":{"a":"f","b":[87],"c":"f","d":"f"}}},"d":{"a":[87],"b":{"a":[87],"b":[87],"c":[87],"d":{"a":[87],"b":[87],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":[87],"c":"f","d":"f"},"c":{"b":"f"}},"d":{"a":{"a":[87],"b":[87],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"}}}},"b":{"a":{"a":{"a":[87],"b":{"a":"f","b":[96],"c":[96],"d":"f"},"c":{"a":"f","b":[96],"c":[96],"d":"f"},"d":[87]},"b":[96],"c":{"a":{"a":"f","b":"f","c":"f","d":[87]},"b":{"a":[96],"b":[96],"c":"f","d":[96]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[87],"b":"f","c":"f","d":[87]}},"d":{"a":[87],"b":{"a":"f","b":"f","c":[87],"d":[87]},"c":[87],"d":[87]}},"b":{"a":{"a":[96],"b":{"a":[96],"b":"f","c":"f","d":[96]},"c":{"a":[96],"b":"f","c":"f","d":[96]},"d":[96]},"b":[163],"c":{"a":[163],"b":{"a":[163],"b":[163],"c":"f","d":[163]},"c":{"a":"f","b":"f","c":[114],"d":[114]},"d":{"a":"f","b":"f","c":[114],"d":[114]}},"d":{"a":{"a":[96],"b":[96],"c":"f","d":"f"},"b":{"a":[96],"b":"f","c":"f","d":[96]},"c":{"a":"f","b":"f","c":[114],"d":"f"},"d":{"a":[159],"b":"f","c":[159],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":[88]},"b":{"a":"f","b":[114],"c":[114],"d":"f"},"c":{"a":"f","b":[114],"c":[114],"d":"f"},"d":[88]},"b":[114],"c":{"a":[114],"b":[114],"c":{"a":[114],"b":"f","c":"f","d":"f"},"d":[114]},"d":{"a":[88],"b":{"a":"f","b":[114],"c":[114],"d":"f"},"c":{"a":"f","b":[114],"c":"f","d":"f"},"d":[88]}},"d":{"a":{"a":[87],"b":[87],"c":{"a":[87],"b":[87],"c":[87],"d":"f"},"d":{"a":[87],"b":[87],"c":"f","d":"f"}},"b":{"a":{"a":[87],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[88],"c":[88],"d":"f"},"c":{"a":"f","b":[88],"c":[88],"d":"f"},"d":{"a":"f","b":[159],"c":[159],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[88],"c":[88],"d":[88]},"c":[88],"d":{"a":"f","b":[88],"c":[88],"d":[88]}},"d":{"a":{"a":"f","b":[139],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[139],"b":"f","c":"f","d":[139]},"d":{"a":"f","b":"f","c":"f","d":"f"}}}},"c":{"a":{"a":{"a":{"a":[147],"b":"f","c":"f","d":"f"},"b":{"a":[139],"b":"f","c":"f","d":[139]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[147]}},"b":{"a":[88],"b":[88],"c":{"a":[88],"b":[88],"c":"f","d":"f"},"d":{"a":[88],"b":[88],"c":[88],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[147],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[147]},"c":{"a":[147],"b":"f","c":"f","d":[147]},"d":[147]},"d":[147]},"b":{"a":{"a":[88],"b":{"a":"f","b":"f","c":[114],"d":"f"},"c":{"a":"f","b":[114],"c":[114],"d":"f"},"d":{"a":[88],"b":[88],"c":"f","d":[88]}},"b":{"a":{"a":[114],"b":[114],"c":"f","d":[114]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[140],"d":"f"},"d":{"a":[114],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","c":"f"},"b":{"a":"f","b":[140],"c":[140],"d":"f"},"c":{"a":[140],"b":"f","c":"f","d":[140]},"d":{"b":"f","c":"f"}},"d":{"a":{"a":[88],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":[140]},"c":{"a":[140],"b":"f","c":"f","d":[140]},"d":{"a":"f","b":[140],"c":[140],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[140],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"b":"f","c":"f"},"d":{"a":[140],"b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":[140],"d":"f"},"b":{"a":[140],"b":"f","c":"f","d":[140]},"c":{"a":[140],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":[140],"c":[140],"d":[140]}},"c":{"a":{"a":[140],"b":"f","c":"f","d":"f"},"b":{"a":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"},"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[147],"c":[147],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[145]},"d":{"a":[145],"b":"f","c":[145],"d":[145]}},"b":{"a":[147],"b":{"a":[147],"b":[147],"c":"f","d":[147]},"c":{"a":"f","b":"f","c":[140],"d":"f"},"d":[147]},"c":{"a":{"a":[147],"b":[147],"c":[147],"d":"f"},"b":{"a":"f","b":[140],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[145],"b":{"a":[145],"b":"f","c":"f","d":[145]},"c":[145],"d":[145]}}},"d":{"b":{"a":{"a":{"b":"f","c":"f"},"b":{"a":[87],"b":[87],"c":[87],"d":"f"},"c":{"a":"f","b":[87],"c":[87],"d":"f"}},"b":{"a":{"a":[87],"b":"f","c":"f","d":[87]},"b":{"a":"f","b":"f","c":[147],"d":"f"},"c":{"a":"f","b":[147],"c":[147],"d":"f"},"d":{"a":[87],"b":"f","c":"f","d":[87]}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[147],"c":[147],"d":{"a":"f","b":"f","c":[147],"d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":[87],"c":"f","d":"f"},"c":{"a":"f","b":[139],"c":"f","d":"f"},"d":{"b":"f","c":"f"}}},"c":{"a":{"b":{"a":"f","b":"f","c":[147],"d":"f"},"c":{"a":"f","b":[147],"c":[147],"d":"f"}},"b":{"a":[147],"b":{"a":[147],"b":[147],"c":"f","d":[147]},"c":{"a":[147],"b":"f","c":"f","d":"f"},"d":[147]},"c":{"a":[147],"b":{"a":"f","b":"f","c":[145],"d":"f"},"c":{"a":"f","b":[145],"c":[145],"d":"f"},"d":{"a":[147],"b":[147],"c":"f","d":[147]}},"d":{"b":{"a":"f","b":[147],"c":[147],"d":"f"},"c":{"a":"f","b":[147],"c":[147],"d":"f"}}},"d":{"d":{"d":{"d":"f"}}}}}},"b":{"c":{"b":{"c":{"c":{"d":{"b":"f","c":"f","d":"f"}},"d":{"c":{"c":"f"}}}},"c":{"a":{"c":{"b":{"c":"f"},"c":{"b":"f"},"d":{"a":"f","d":"f"}},"d":{"c":{"b":"f","c":"f","d":"f"}}},"b":{"a":{"b":{"b":"f"}},"b":{"a":{"a":"f"}}},"d":{"a":{"b":{"a":"f"}}}},"d":{"c":{"a":{"c":{"c":"f"}},"b":{"b":{"a":"f","b":"f","c":"f","d":"f"},"d":{"d":"f"}},"c":{"a":{"a":"f","d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"c":{"b":{"d":"f"},"c":{"a":"f"},"d":{"b":"f"}}}}}},"c":{"a":{"b":{"b":{"b":{"c":{"b":"f","c":"f","d":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"c":{"c":"f"}}},"c":{"a":{"b":{"b":"f","c":"f"}},"b":{"a":{"a":[403],"b":[403],"c":"f","d":"f"},"b":{"a":"f","d":"f"},"d":{"a":"f","b":"f"}}}}},"b":{"a":{"a":{"a":{"a":{"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"d":"f"},"d":{"a":"f"}},"d":{"a":{"a":"f"}}}},"b":{"d":{"d":{"d":{"c":"f","d":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"}}}}},"c":{"d":{"a":{"a":{"c":{"b":"f","c":"f"}},"b":{"d":{"a":"f","d":"f"}},"d":{"b":{"a":"f","d":"f"}}},"d":{"a":{"a":{"d":"f"},"d":{"a":"f","d":"f"}}}}},"d":{"c":{"c":{"b":{"b":{"c":"f"},"c":{"b":"f","c":"f"}}}}}},"d":{"a":{"a":{"a":{"a":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"},"c":{"c":"f","d":"f"},"d":{"d":"f"}},"d":{"a":{"a":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[143]}}},"b":{"a":{"b":{"a":"f","b":"f","c":[145],"d":"f"},"c":{"a":"f","b":[145],"c":[145],"d":"f"},"d":{"b":"f","c":"f"}},"b":{"a":{"a":"f","b":"f","c":[145],"d":[145]},"b":[145],"c":[145],"d":[145]},"c":[145],"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":[145],"c":[145],"d":[145]},"c":[145],"d":{"b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":[145],"c":[145],"d":"f"},"b":[145],"c":[145],"d":{"a":"f","b":[145],"c":[145],"d":[145]}},"b":[145],"c":{"a":[145],"b":[145],"c":{"a":[145],"b":[145],"c":"f","d":"f"},"d":[145]},"d":[145]},"d":{"a":{"a":{"a":[143],"b":"f","c":"f","d":[143]},"b":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[143]},"d":[143]},"b":{"c":{"a":"f","b":"f","c":[145],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[145]}},"c":[145],"d":{"a":{"a":[143],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[145],"d":"f"},"c":{"a":"f","b":[145],"c":[145],"d":"f"},"d":{"a":[109],"b":"f","c":"f","d":[109]}}}},"b":{"a":{"a":{"a":[145],"b":[145],"c":{"a":[145],"b":"f","c":"f","d":[145]},"d":[145]},"b":{"a":{"a":"f","b":"f","c":[140],"d":"f"},"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":[140],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[145]},"d":[145]},"b":{"a":{"a":{"d":"f"},"d":{"a":"f"}}},"c":{"b":{"a":{"b":"f","c":"f"},"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","d":"f"},"d":{"b":"f","c":"f"}}},"d":{"a":{"a":[145],"b":[145],"c":{"a":[145],"b":"f","c":"f","d":[145]},"d":[145]},"b":{"a":{"a":[145],"b":"f","c":"f","d":"f"},"b":{"a":"f"},"d":{"a":"f"}},"d":{"a":{"a":[145],"b":[145],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"d":{"a":"f","d":"f"}}}},"d":{"a":{"a":{"a":{"a":"f","b":"f","c":[145],"d":"f"},"b":[145],"c":{"a":"f","b":[145],"c":[145],"d":"f"},"d":{"a":"f","b":"f","c":[109],"d":[109]}},"b":{"a":[145],"b":[145],"c":{"a":"f","b":"f","c":"f"},"d":{"a":[145],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"}},"d":{"a":[109],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[109],"b":"f","c":"f","d":"f"},"d":[109]}},"b":{"a":{"a":[145],"b":[145],"c":{"a":[145],"b":"f","c":"f","d":"f"},"d":{"a":[145],"b":[145],"c":"f","d":"f"}},"b":{"a":{"a":[145],"b":"f","c":"f","d":"f"},"b":{"a":"f"},"d":{"a":"f"}},"d":{"a":{"a":"f","b":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f"}}}}},"b":{"a":{"d":{"a":{"c":{"c":"f","d":"f"}},"d":{"b":{"a":"f","b":"f"}}}}},"d":{"d":{"d":{"a":{"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"c":"f"}},"d":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":[399],"c":[399],"d":[399]}}}}}}},"d":{"a":{"a":{"a":{"a":{"a":{"a":[351],"b":{"a":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":[351]},"b":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":[344],"d":{"a":{"a":[351],"b":"f","c":"f","d":[351]},"b":{"a":"f","b":"f","c":[344],"d":"f"},"c":[344],"d":{"a":"f","b":"f","c":[344],"d":[344]}}},"b":{"a":{"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"c":"f","d":"f"}},"b":{"d":{"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[344]},"d":{"a":[344],"b":"f","c":"f","d":[344]}},"d":[344]},"c":{"a":{"a":{"a":[344],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[340],"d":{"a":"f","b":"f","c":"f","d":[344]}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","c":"f","d":"f"},"d":{"a":[340],"b":"f","c":"f","d":[340]}},"d":{"a":{"a":[344],"b":"f","c":"f","d":[344]},"b":[340],"c":{"a":[340],"b":[340],"c":[340],"d":"f"},"d":{"a":[344],"b":"f","c":"f","d":[344]}}},"d":[344]},"d":{"a":{"a":{"a":[344],"b":[344],"c":[344],"d":{"a":"f","b":[344],"c":[344],"d":"f"}},"b":[344],"c":[344],"d":{"a":{"a":"f","b":[344],"c":"f","d":"f"},"b":[344],"c":{"a":"f","b":[344],"c":[344],"d":"f"},"d":{"b":"f"}}},"b":{"a":{"a":{"a":[344],"b":"f","c":"f","d":[344]},"b":{"a":"f","b":[340],"c":[340],"d":"f"},"c":{"a":"f","b":[340],"c":[340],"d":"f"},"d":{"a":[344],"b":[344],"c":"f","d":[344]}},"b":{"a":{"a":[340],"b":"f","c":"f","d":[340]},"d":{"a":[340],"b":"f","c":"f","d":[340]}},"c":{"a":{"a":[340],"b":"f","c":"f","d":[340]},"d":{"a":[340],"b":"f","c":"f","d":"f"}},"d":{"a":[344],"b":{"a":"f","b":[340],"c":[340],"d":"f"},"c":{"a":"f","b":[340],"c":"f","d":"f"},"d":{"a":[344],"b":"f","c":"f","d":[344]}}},"c":{"a":{"a":{"a":[344],"b":"f","c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":{"a":[13],"b":"f","c":"f","d":[13]},"c":{"a":"f","c":"f","d":"f"},"d":{"a":[13],"b":"f","c":[13],"d":[13]}}},"d":{"a":{"a":{"a":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[3],"b":"f","c":[3],"d":[3]}},"b":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f","b":"f","c":"f"},"c":{"a":"f","b":"f","c":[13],"d":"f"},"d":{"a":"f","c":"f","d":"f"}},"c":[13],"d":{"a":[3],"b":{"a":"f","b":"f","c":[13],"d":"f"},"c":{"a":"f","b":[13],"c":[13],"d":"f"},"d":[3]}}}},"b":{"a":{"c":{"c":{"d":{"a":"f","d":"f"}},"d":{"c":{"b":"f","c":"f"}}}},"d":{"a":{"a":{"c":{"c":"f"}},"b":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"}}},"b":{"a":{"a":{"a":"f","c":"f","d":"f"},"b":{"b":"f"},"d":{"a":"f","b":"f","d":"f"}},"b":{"a":{"a":"f"}}}}},"d":{"a":{"a":{"a":{"a":[3],"b":{"a":"f","b":[13],"c":[13],"d":"f"},"c":{"a":"f","b":[13],"c":[13],"d":[13]},"d":{"a":[3],"b":"f","c":"f","d":[3]}},"b":[13],"c":{"a":{"a":"f","b":[13],"c":"f","d":"f"},"b":[13],"c":[13],"d":{"a":[3],"b":"f","c":"f","d":[3]}},"d":{"a":{"a":[3],"b":"f","c":[3],"d":[3]},"b":{"a":"f","b":"f","c":[3],"d":[3]},"c":[3],"d":[3]}},"b":{"a":{"a":[13],"b":{"a":[13],"b":"f","c":[13],"d":[13]},"c":[13],"d":[13]},"b":{"a":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[13]}},"c":{"a":{"a":[13],"b":"f","c":"f","d":[13]},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":[13]},"d":[13]},"c":{"a":{"a":[13],"b":[13],"c":[13],"d":{"a":[13],"b":[13],"c":"f","d":"f"}},"b":{"a":{"a":[13],"b":[13],"c":"f","d":[13]},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[13]},"c":{"a":[13],"b":{"a":"f","b":"f","c":"f","d":[13]},"c":[13],"d":{"a":"f","b":[13],"c":[13],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":[3],"d":[3]},"b":{"a":"f","b":"f","c":"f","d":[3]},"c":{"a":[3],"b":"f","c":[3],"d":[3]},"d":[3]}},"d":{"a":[3],"b":{"a":{"a":[3],"b":"f","c":"f","d":[3]},"b":{"a":[13],"b":[13],"c":[13],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[3]},"d":[3]},"c":{"a":[3],"b":{"a":[3],"b":"f","c":[3],"d":[3]},"c":[3],"d":[3]},"d":[3]}},"b":{"a":{"b":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"}},"c":{"b":{"b":"f"}}},"b":{"a":{"a":{"d":"f"},"d":{"a":"f","d":"f"}}},"c":{"d":{"a":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"a":{"c":{"b":"f","c":"f","d":"f"}},"b":{"b":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":{"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"b":"f","c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}}}},"c":{"a":{"a":{"a":{"a":[13],"b":[13],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[20],"b":"f","c":"f","d":[20]},"d":[20]},"b":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":"f","d":"f"}},"c":{"a":{"a":"f","c":"f","d":"f"},"d":{"a":[20],"b":"f","c":"f","d":[20]}},"d":{"a":[20],"b":{"a":[20],"b":"f","c":[20],"d":[20]},"c":[20],"d":{"a":"f","b":"f","c":"f","d":[45]}}},"b":{"a":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","d":"f"}}},"d":{"a":{"a":{"a":[45],"b":"f","c":"f","d":[45]},"b":[20],"c":[20],"d":{"a":[45],"b":"f","c":"f","d":[45]}},"b":{"a":{"a":[20],"b":"f","c":"f","d":[20]},"c":{"a":"f","d":"f"},"d":{"a":[20],"b":"f","c":[20],"d":[20]}},"c":{"a":[20],"b":{"a":"f","b":"f","c":"f","d":[20]},"c":{"a":[20],"b":"f","c":"f","d":[20]},"d":[20]},"d":{"a":{"a":[45],"b":"f","c":"f","d":[45]},"b":{"a":[20],"b":[20],"c":[20],"d":"f"},"c":{"a":"f","b":[20],"c":[20],"d":"f"},"d":[45]}}},"d":{"a":{"a":[3],"b":[3],"c":{"a":[3],"b":[3],"c":{"a":[3],"b":[3],"c":"f","d":[3]},"d":[3]},"d":[3]},"b":{"a":{"a":[3],"b":[3],"c":{"a":[3],"b":"f","c":"f","d":"f"},"d":[3]},"b":{"a":{"a":"f","b":[13],"c":"f","d":"f"},"b":{"a":[13],"b":[13],"c":"f","d":"f"},"c":[20],"d":{"a":"f","b":[20],"c":[20],"d":"f"}},"c":{"a":{"a":"f","b":[20],"c":[20],"d":"f"},"b":[20],"c":{"a":"f","b":"f","c":[45],"d":[45]},"d":{"a":"f","b":"f","c":[45],"d":[45]}},"d":{"a":{"a":[3],"b":[3],"c":"f","d":[3]},"b":{"a":"f","b":[45],"c":[45],"d":"f"},"c":[45],"d":{"a":"f","b":"f","c":[45],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":[5]},"b":[45],"c":[45],"d":{"a":[5],"b":"f","c":"f","d":[5]}},"b":[45],"c":[45],"d":{"a":{"a":[5],"b":"f","c":"f","d":[5]},"b":[45],"c":[45],"d":{"a":"f","b":"f","c":[45],"d":"f"}}},"d":{"a":[3],"b":{"a":[3],"b":{"a":"f","b":"f","c":[5],"d":"f"},"c":{"a":"f","b":[5],"c":[5],"d":[5]},"d":{"a":[3],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[5],"c":[5],"d":[5]},"b":[5],"c":[5],"d":[5]},"d":{"a":[3],"b":{"a":[3],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[5],"c":[5],"d":"f"},"d":{"a":[3],"b":[3],"c":"f","d":[3]}}}}}},"b":{"a":{"b":{"a":{"b":{"b":{"b":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":[112],"c":"f","d":"f"},"b":{"a":[112],"b":[112],"c":[112],"d":"f"},"c":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":[112],"b":"f","c":[112],"d":[112]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","d":"f"},"d":{"a":[112],"b":[112],"c":[112],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f"}}}}},"b":{"a":{"a":{"a":{"a":[151],"b":[151],"c":{"a":[151],"b":[151],"c":[151],"d":"f"},"d":{"a":"f","b":[151],"c":"f","d":"f"}},"b":[151],"c":{"a":{"a":[151],"b":[151],"c":[151],"d":"f"},"b":[151],"c":[151],"d":{"a":"f","b":[151],"c":[151],"d":"f"}},"d":{"a":{"b":"f"},"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f"}}},"b":{"a":{"a":{"a":[151],"b":"f","c":[151],"d":[151]},"b":{"a":"f","b":"f","c":"f","d":[151]},"c":[151],"d":[151]},"b":{"a":{"a":[192],"b":[192],"c":[192],"d":"f"},"b":[192],"c":{"a":[192],"b":[192],"c":"f","d":"f"},"d":{"a":"f","b":[192],"c":"f","d":"f"}},"c":[151],"d":[151]},"c":{"a":[151],"b":[151],"c":[151],"d":{"a":{"a":"f","b":[151],"c":[151],"d":"f"},"b":[151],"c":[151],"d":{"a":"f","b":"f","c":"f"}}},"d":{"a":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"b":{"a":[151],"b":[151],"c":{"a":[151],"b":[151],"c":[151],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"b":{"a":"f","b":"f"}}}},"b":{"a":{"a":{"a":[192],"b":{"a":"f","b":[192],"c":[192],"d":[192]},"c":[192],"d":{"a":[192],"b":[192],"c":[192],"d":"f"}},"b":{"a":{"a":[192],"b":"f","c":"f","d":[192]},"b":[97],"c":[97],"d":{"a":"f","b":"f","c":[97],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[192]},"b":[97],"c":{"a":[97],"b":[97],"c":[97],"d":"f"},"d":{"a":[192],"b":"f","c":"f","d":[192]}},"d":{"a":{"a":"f","b":[192],"c":[192],"d":"f"},"b":[192],"c":{"a":[192],"b":[192],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[151]}}},"b":{"a":{"a":[97],"b":{"a":[97],"b":"f","c":"f","d":[97]},"c":{"a":[97],"b":"f","c":"f","d":[97]},"d":[97]},"b":[87],"c":[87],"d":{"a":[97],"b":{"a":[97],"b":"f","c":"f","d":[97]},"c":{"a":[97],"b":"f","c":"f","d":[97]},"d":[97]}},"c":{"a":{"a":{"a":[97],"b":[97],"c":"f","d":"f"},"b":{"a":[97],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":[115],"c":[115],"d":"f"}},"b":{"a":{"a":"f","b":[87],"c":[87],"d":"f"},"b":[87],"c":[87],"d":[87]},"c":{"a":{"a":"f","b":[87],"c":[87],"d":"f"},"b":[87],"c":[87],"d":{"a":"f","b":[87],"c":[87],"d":"f"}},"d":{"a":{"a":"f","b":[115],"c":[115],"d":"f"},"b":{"a":[115],"b":"f","c":[115],"d":[115]},"c":[115],"d":{"a":"f","b":[115],"c":[115],"d":"f"}}},"d":{"a":{"a":[151],"b":{"a":[151],"b":"f","c":[151],"d":[151]},"c":[151],"d":[151]},"b":{"a":{"a":"f","b":[192],"c":"f","d":"f"},"b":{"a":"f","b":[97],"c":"f","d":"f"},"c":[151],"d":[151]},"c":[151],"d":[151]}},"c":{"a":[151],"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[115],"b":[115],"c":"f","d":[115]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[151],"b":"f","c":"f","d":[151]}},"b":{"a":{"a":"f","b":[87],"c":[87],"d":"f"},"b":[87],"c":[87],"d":{"a":"f","b":[87],"c":[87],"d":"f"}},"c":[87],"d":{"a":{"a":[151],"b":[151],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[87],"d":"f"},"c":[87],"d":{"a":"f","b":"f","c":[87],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[87],"c":[87],"d":"f"},"b":[87],"c":[87],"d":{"a":"f","b":"f","c":"f","d":[151]}},"b":[87],"c":[87],"d":{"a":{"a":[151],"b":"f","c":"f","d":[151]},"b":[87],"c":[87],"d":{"a":[151],"b":"f","c":"f","d":[151]}}},"d":[151]},"d":{"b":{"a":{"a":{"b":"f","c":"f"},"b":{"a":[151],"b":[151],"c":[151],"d":"f"},"c":{"a":"f","b":[151],"c":[151],"d":"f"}},"b":[151],"c":[151],"d":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f"}}},"c":{"a":{"b":{"b":"f","c":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}},"b":[151],"c":{"a":{"a":"f","b":[151],"c":"f","d":"f"},"b":[151],"c":{"a":"f","b":[151],"c":[151],"d":"f"},"d":{"a":"f","b":"f"}},"d":{"b":{"b":"f"}}}}},"c":{"a":{"b":{"b":{"b":{"a":"f","b":"f"}}}},"b":{"a":{"a":{"a":{"a":"f","b":[151],"c":[151],"d":"f"},"b":[151],"c":[151],"d":{"a":"f","b":"f","c":"f"}},"b":[151],"c":[151],"d":{"a":{"b":"f"},"b":{"a":"f","b":[151],"c":"f","d":"f"},"c":{"b":"f","c":"f"}}},"b":{"a":{"a":{"a":[151],"b":"f","c":"f","d":[151]},"b":[87],"c":[87],"d":{"a":[151],"b":"f","c":"f","d":"f"}},"b":[87],"c":[87],"d":{"a":{"a":"f","b":[87],"c":"f","d":"f"},"b":[87],"c":[87],"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":[87],"c":"f","d":"f"},"b":[87],"c":{"a":"f","b":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":[87],"b":[87],"c":{"a":"f","b":[87],"c":[87],"d":"f"},"d":{"a":"f","b":"f","c":"f"}},"c":{"b":{"a":"f","b":[87],"c":"f","d":"f"},"c":{"a":"f","b":"f"}},"d":{"a":{"a":"f","b":"f"}}},"d":{"a":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"b":{"a":[151],"b":[151],"c":{"a":[151],"b":[151],"c":"f","d":"f"},"d":[151]},"c":{"a":[151],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[151],"b":"f","c":"f","d":[151]}},"d":{"b":{"a":"f","b":"f","c":[151],"d":"f"},"c":{"a":"f","b":[151],"c":[151],"d":"f"}}}},"c":{"a":{"a":{"a":{"c":"f"},"b":{"a":"f","b":[151],"c":[151],"d":"f"},"c":[151],"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":[151],"b":[151],"c":"f","d":[151]},"b":{"a":"f","d":"f"},"d":{"a":[151],"b":"f","c":"f","d":[151]}},"c":{"a":{"a":[151],"b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[151],"c":{"a":[151],"b":[151],"c":"f","d":[151]},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"c":{"c":{"c":"f"}},"d":{"d":{"d":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[151],"d":"f"},"c":{"a":"f","b":"f","d":"f"},"d":{"a":[150],"b":"f","c":"f","d":[150]}},"b":{"a":{"a":"f","c":"f","d":"f"},"b":{"d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"c":{"a":{"c":"f","d":"f"},"b":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[113]},"d":[113]},"d":{"a":{"a":[150],"b":[150],"c":"f","d":"f"},"b":{"a":"f","c":"f","d":"f"},"c":[113],"d":{"a":"f","b":"f","c":[113],"d":[113]}}}},"d":{"b":{"b":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[150],"d":[150]},"d":{"b":"f","c":"f"}},"c":{"a":{"a":"f","b":"f","c":[150],"d":"f"},"b":[150],"c":[150],"d":{"a":"f","b":[150],"c":[150],"d":"f"}}},"c":{"a":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[150],"c":[150],"d":[150]},"d":{"b":"f","c":"f"}},"b":{"a":{"a":"f","b":[150],"c":[150],"d":[150]},"b":[150],"c":[150],"d":[150]},"c":{"a":[150],"b":[150],"c":{"a":[150],"b":"f","c":"f","d":"f"},"d":[150]},"d":{"a":{"a":"f","b":"f","c":[150],"d":"f"},"b":[150],"c":[150],"d":{"a":"f","b":[150],"c":[150],"d":[150]}}},"d":{"c":{"c":{"b":"f","c":"f"}}}}},"d":{"b":{"b":{"a":{"c":{"c":"f"}},"b":{"d":{"d":"f"}},"c":{"a":{"a":"f"}},"d":{"b":{"b":"f"}}}}}},"c":{"a":{"b":{"c":{"a":{"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f"}},"b":{"c":{"a":"f","b":"f","c":"f","d":[167]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[167],"c":"f","d":"f"},"b":{"a":[167],"b":"f","c":"f","d":"f"},"d":{"a":"f"}},"d":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"c":{"b":{"c":"f"},"c":{"b":"f","c":"f"}}}},"c":{"a":{"b":{"b":{"a":"f","b":"f","c":[108],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f"}},"d":{"b":{"a":"f"}}},"c":{"c":{"a":{"c":"f","d":"f"},"b":{"b":"f","c":"f","d":"f"},"c":[84],"d":[84]},"d":{"a":{"a":"f","d":"f"},"b":{"c":"f","d":"f"},"c":{"a":"f","b":[84],"c":[84],"d":[84]},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"b":{"a":{"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f","d":"f"},"d":{"c":"f"}}}}},"b":{"a":{"a":{"a":{"c":{"c":"f"}},"b":{"a":{"c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[106],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":[177],"b":"f","c":"f","d":[177]},"b":{"a":"f","b":"f"},"c":{"a":"f","b":"f","c":[164],"d":"f"},"d":{"a":[177],"b":"f","c":[177],"d":[177]}},"d":{"b":{"a":"f","b":"f","c":[177],"d":"f"},"c":{"a":"f","b":[177],"c":[177],"d":[177]},"d":{"b":"f","c":"f"}}},"b":{"a":{"a":[150],"b":[150],"c":{"a":[150],"b":"f","c":"f","d":"f"},"d":[150]},"b":{"a":{"a":[150],"b":[150],"c":"f","d":"f"},"b":{"a":"f","b":[113],"c":[113],"d":"f"},"c":[113],"d":{"a":"f","b":"f","c":[113],"d":"f"}},"c":{"a":[113],"b":{"a":[113],"b":[113],"c":"f","d":[113]},"c":{"a":[113],"b":"f","c":"f","d":"f"},"d":{"a":[113],"b":[113],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[113],"c":[113],"d":"f"},"c":{"a":[113],"b":[113],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","d":"f"},"b":{"a":"f","b":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[164],"d":[164]}},"b":{"a":{"b":"f"},"b":{"a":"f"},"c":{"a":"f","b":"f","c":"f","d":[125]},"d":{"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[125],"c":[125],"d":"f"},"b":{"a":[125],"b":"f","c":"f","d":[125]},"c":{"a":[125],"b":"f","c":"f","d":[125]},"d":{"a":[125],"b":[125],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","c":"f"},"c":{"b":"f","c":"f"}}},"d":{"a":{"a":{"b":"f","c":"f"},"b":[177],"c":[177],"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":[177],"b":"f","c":"f","d":[177]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[164],"c":[164],"d":"f"},"d":{"a":[177],"b":[177],"c":"f","d":[177]}},"c":{"a":{"a":[177],"b":[177],"c":[177],"d":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f"}}}},"b":{"a":{"a":{"a":[113],"b":[113],"c":{"a":[113],"b":[113],"c":"f","d":"f"},"d":{"a":[113],"b":[113],"c":"f","d":[113]}},"b":{"a":[113],"b":[113],"c":{"a":"f","b":"f","d":"f"},"d":{"a":[113],"b":[113],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","d":"f"},"c":{"d":"f"},"d":{"c":"f"}}},"b":{"a":{"a":{"a":"f","c":"f","d":"f"},"b":{"c":"f"},"c":{"b":"f","c":"f"},"d":{"a":"f","b":"f"}},"b":{"a":{"c":"f","d":"f"},"b":{"b":"f"},"c":{"a":"f","b":"f","c":"f","d":[143]},"d":{"a":"f","b":"f","c":[143],"d":"f"}},"c":{"a":{"a":"f","b":[143],"c":"f","d":"f"},"b":[143],"c":{"a":"f","b":[143],"c":[143],"d":"f"},"d":{"a":"f","b":"f","c":[83],"d":"f"}},"d":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}},"c":{"a":{"c":{"b":"f","c":"f"}},"b":{"a":{"a":"f","b":[83],"c":[83],"d":"f"},"b":{"a":"f","b":[143],"c":[143],"d":"f"},"c":{"a":"f","b":[143],"c":[143],"d":"f"},"d":{"a":"f","b":[83],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[143],"c":"f","d":"f"},"c":{"a":"f","b":[109],"c":[109],"d":"f"},"d":{"a":"f","b":[76],"c":"f","d":"f"}}},"d":{"a":{"a":{"b":"f"},"b":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":"f","d":"f"}},"c":{"b":{"c":"f"},"c":{"b":"f","c":"f"}}}},"c":{"a":{"a":{"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"b":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[188],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[135],"d":"f"},"d":{"b":"f","c":"f"}},"d":{"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f"}}},"b":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":[188]},"c":[188],"d":{"a":"f","b":[188],"c":[188],"d":[188]}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[109],"c":[109],"d":"f"},"c":{"a":"f","b":[109],"c":[109],"d":[109]},"d":{"a":"f","b":"f","c":"f","d":[188]}},"c":{"a":{"a":[188],"b":"f","c":[188],"d":[188]},"b":{"a":"f","b":[109],"c":[109],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[188]},"d":{"a":{"a":[188],"b":[188],"c":[188],"d":"f"},"b":[188],"c":{"a":[188],"b":[188],"c":[188],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[135]}}},"c":{"a":{"a":{"a":[135],"b":"f","c":[135],"d":[135]},"b":{"a":"f","b":"f","c":"f","d":[135]},"c":{"a":[135],"b":"f","c":"f","d":[135]},"d":[135]},"b":{"a":{"a":"f","b":"f","c":[101],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[101]},"c":{"a":"f","b":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f"}},"d":{"a":[135],"b":{"a":[135],"b":"f","c":"f","d":[135]},"c":{"a":[135],"b":"f","c":"f","d":"f"},"d":[135]}},"d":{"a":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}},"b":{"a":{"d":"f"},"b":{"a":"f","b":[135],"c":[135],"d":"f"},"c":{"a":"f","b":[135],"c":[135],"d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[135],"c":[135],"d":"f"},"c":{"a":"f","b":[135],"c":"f","d":"f"},"d":{"a":"f"}},"d":{"b":{"b":"f","c":"f"}}}},"d":{"b":{"b":{"a":{"b":"f"},"b":{"a":"f","b":"f"},"c":{"b":"f","c":"f"}}},"c":{"d":{"a":{"d":"f"},"c":{"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[79]}}},"d":{"a":{"c":{"c":"f"}},"b":{"c":{"d":"f"},"d":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":[79]},"c":{"a":"f","b":[79],"c":[79],"d":"f"},"d":{"a":"f","b":"f","c":[84],"d":[84]}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[84],"c":[84],"d":[84]},"d":{"a":"f","b":"f","c":[84],"d":[84]}}}}},"c":{"a":{"a":{"a":[84],"b":{"a":[84],"b":{"a":"f","b":"f","c":"f","d":[84]},"c":{"a":[84],"b":"f","c":"f","d":[84]},"d":[84]},"c":{"a":[84],"b":{"a":[84],"b":"f","c":"f","d":[84]},"c":{"a":[84],"b":"f","c":"f","d":[84]},"d":[84]},"d":[84]},"b":{"a":{"a":[79],"b":{"a":"f","b":"f","c":"f","d":[79]},"c":{"a":[79],"b":"f","c":[79],"d":[79]},"d":[79]},"b":{"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","c":"f","d":"f"},"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[160],"c":[160],"d":"f"},"d":{"a":[79],"b":"f","c":"f","d":[79]}},"d":{"a":{"a":"f","b":[79],"c":[79],"d":"f"},"b":[79],"c":[79],"d":[79]}},"c":{"a":[79],"b":{"a":{"a":[79],"b":"f","c":"f","d":[79]},"b":{"a":"f","b":[160],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[79]},"c":{"a":[79],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[79]},"d":[79]},"d":{"a":[84],"b":{"a":[84],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[79],"d":"f"},"d":{"a":[84],"b":[84],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[79],"d":[79]},"b":{"a":"f","b":[79],"c":[79],"d":[79]},"c":[79],"d":[79]},"d":{"a":[84],"b":{"a":[84],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[79],"c":[79],"d":[79]},"d":{"a":"f","b":"f","c":[79],"d":"f"}}}},"b":{"a":{"a":{"d":{"c":"f","d":"f"}},"b":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[89],"c":[89],"d":"f"},"d":{"c":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[89],"b":[89],"c":"f","d":[89]},"c":{"a":[89],"b":"f","c":"f","d":[89]},"d":{"a":[160],"b":"f","c":"f","d":[160]}},"d":{"a":{"a":"f","b":"f","c":"f","d":[160]},"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[160],"d":[160]},"d":[160]}},"b":{"a":{"a":{"a":"f","b":"f","c":[89],"d":[89]},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[89],"b":[89],"c":"f","d":[89]}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"c":{"d":{"d":"f"}},"d":{"c":{"c":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[160],"c":{"a":[160],"b":[160],"c":"f","d":"f"},"d":{"b":"f","c":"f"}},"b":{"a":{"a":[160],"b":"f","c":"f","d":[160]},"b":{"a":"f","b":"f","d":"f"},"d":{"a":"f","b":"f","d":"f"}}}},"c":{"a":{"c":{"a":{"a":"f","d":"f"}},"d":{"b":{"b":"f","c":"f"}}},"b":{"a":{"b":{"b":"f"}},"b":{"a":{"a":"f"}}},"c":{"c":{"c":{"b":"f","c":"f"}}},"d":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":[110]},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":[110]}}},"d":{"a":{"a":{"a":{"a":"f","b":[79],"c":[79],"d":"f"},"b":[79],"c":[79],"d":{"a":"f","b":[79],"c":[79],"d":"f"}},"b":[79],"c":[79],"d":{"a":{"a":"f","b":[79],"c":[79],"d":"f"},"b":[79],"c":[79],"d":{"a":"f","b":[79],"c":[79],"d":"f"}}},"b":{"a":[79],"b":{"a":[79],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[79]},"c":{"a":[79],"b":{"a":"f","c":"f","d":"f"},"c":{"a":[79],"b":"f","c":"f","d":[79]},"d":[79]},"d":[79]},"c":{"a":[79],"b":{"a":[79],"b":{"a":[79],"b":"f","c":[79],"d":[79]},"c":[79],"d":[79]},"c":{"a":[79],"b":{"a":[79],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[110],"c":[110],"d":[110]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[79],"b":[79],"c":{"a":[79],"b":[79],"c":"f","d":[79]},"d":[79]}},"d":{"a":{"a":{"a":"f","b":[79],"c":[79],"d":"f"},"b":[79],"c":{"a":"f","b":[79],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":[79],"c":[79],"d":{"a":[136],"b":{"a":"f","b":"f","c":[79],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[136]},"d":[136]}}}},"d":{"a":{"c":{"c":{"c":{"a":"f","b":"f","c":[162],"d":[162]},"d":{"a":"f","b":"f","c":[162],"d":"f"}},"d":{"c":{"c":"f"}}}},"b":{"a":{"b":{"a":{"b":"f","c":"f"},"b":{"a":[165],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[165],"c":"f","d":"f"}},"c":{"a":{"c":"f"},"b":{"a":"f","b":[84],"c":[84],"d":"f"},"c":[84],"d":{"a":"f","b":"f","c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":[84],"c":[84],"d":"f"},"b":[84],"c":[84],"d":{"a":"f","b":[84],"c":[84],"d":"f"}},"b":[84],"c":[84],"d":[84]},"c":{"a":[84],"b":[84],"c":{"a":[84],"b":[84],"c":{"a":[84],"b":"f","c":"f","d":[84]},"d":[84]},"d":[84]},"d":{"a":{"b":{"b":"f","c":"f"},"c":{"a":"f","b":"f","c":[111],"d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":[111]},"b":{"a":[84],"b":[84],"c":[84],"d":"f"},"c":{"a":"f","b":[84],"c":[84],"d":"f"},"d":{"a":[111],"b":[111],"c":"f","d":[111]}},"c":{"a":{"a":[111],"b":"f","c":[111],"d":[111]},"b":{"a":"f","b":[84],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[111]},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":[111],"c":[111],"d":[111]},"c":[111],"d":{"a":"f","b":"f","c":"f","d":[162]}}}},"c":{"a":{"a":{"a":{"a":[162],"b":"f","c":"f","d":[162]},"b":{"a":[111],"b":[111],"c":[111],"d":"f"},"c":{"a":"f","b":[111],"c":[111],"d":"f"},"d":[162]},"b":{"a":{"a":[111],"b":[111],"c":"f","d":[111]},"b":{"a":"f","b":[84],"c":[84],"d":"f"},"c":{"a":"f","b":[84],"c":"f","d":"f"},"d":{"a":[111],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[78],"c":"f","d":"f"},"b":{"a":[78],"b":"f","c":[78],"d":[78]},"c":[78],"d":{"a":[111],"b":"f","c":"f","d":[111]}},"d":{"a":{"a":[162],"b":[162],"c":"f","d":[162]},"b":{"a":"f","b":[111],"c":[111],"d":"f"},"c":{"a":"f","b":[111],"c":[111],"d":[111]},"d":{"a":[162],"b":"f","c":"f","d":[162]}}},"b":{"a":{"a":[84],"b":[84],"c":{"a":[84],"b":[84],"c":"f","d":[84]},"d":[84]},"b":{"a":[84],"b":[84],"c":[84],"d":{"a":[84],"b":[84],"c":[84],"d":"f"}},"c":{"a":{"a":"f","b":[84],"c":[84],"d":[84]},"b":{"a":[84],"b":[84],"c":"f","d":[84]},"c":{"a":[84],"b":"f","c":[84],"d":[84]},"d":[84]},"d":{"a":{"a":"f","b":"f","c":"f","d":[78]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[78],"b":"f","c":"f","d":[78]},"d":[78]}},"c":{"a":{"a":{"a":[78],"b":[78],"c":"f","d":[78]},"b":{"a":"f","b":"f","c":[84],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[136]},"d":{"a":[78],"b":"f","c":"f","d":[78]}},"b":{"a":[84],"b":{"a":[84],"b":"f","c":"f","d":[84]},"c":{"a":[84],"b":"f","c":"f","d":[84]},"d":[84]},"c":{"a":{"a":"f","b":[84],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[136],"d":"f"},"c":[136],"d":{"a":[136],"b":"f","c":[136],"d":[136]}},"d":{"a":{"a":"f","b":"f","c":[136],"d":"f"},"b":{"a":[136],"b":"f","c":[136],"d":[136]},"c":[136],"d":{"a":"f","b":[136],"c":[136],"d":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[111],"c":{"a":[111],"b":[111],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[175]}},"b":{"a":{"a":[111],"b":"f","c":"f","d":"f"},"b":[78],"c":[78],"d":{"a":"f","b":[78],"c":[78],"d":"f"}},"c":{"a":{"a":"f","b":[78],"c":[78],"d":[78]},"b":[78],"c":[78],"d":{"a":[78],"b":[78],"c":"f","d":"f"}},"d":{"a":[175],"b":{"a":[175],"b":"f","c":"f","d":[175]},"c":{"a":[175],"b":"f","c":"f","d":[175]},"d":[175]}}},"d":{"b":{"a":{"a":{"c":"f"},"b":{"a":"f","b":"f","c":[85],"d":"f"},"c":[85],"d":{"b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":[85]},"b":[162],"c":[162],"d":{"a":[85],"b":"f","c":"f","d":[85]}},"c":{"a":{"a":[85],"b":"f","c":"f","d":"f"},"b":[162],"c":[162],"d":{"a":"f","b":"f","c":"f","d":[85]}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[85],"b":[85],"c":[85],"d":"f"},"c":{"a":"f","b":[85],"c":[85],"d":"f"},"d":{"a":"f","b":[75],"c":[75],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[75],"c":[75],"d":[75]},"b":{"a":"f","b":[85],"c":"f","d":"f"},"c":[75],"d":[75]},"b":{"a":{"a":[85],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[175],"b":"f","c":[175],"d":[175]},"d":{"a":[75],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[175],"c":[175],"d":"f"},"b":[175],"c":[175],"d":[175]},"d":{"a":[75],"b":{"a":[75],"b":"f","c":"f","d":[75]},"c":{"a":[75],"b":"f","c":"f","d":[75]},"d":[75]}},"d":{"b":{"b":{"b":"f","c":"f"},"c":{"a":"f","b":"f","c":[75],"d":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":[75],"c":[75],"d":[75]},"c":[75],"d":{"b":"f","c":"f","d":"f"}}}}}},"d":{"a":{"a":{"a":{"a":{"a":{"a":"f","b":"f","c":[5],"d":"f"},"b":[5],"c":[5],"d":[5]},"b":[5],"c":[5],"d":[5]},"b":{"a":{"a":{"a":"f","b":[45],"c":[45],"d":"f"},"b":[45],"c":[45],"d":{"a":"f","b":[45],"c":[45],"d":"f"}},"b":[45],"c":[45],"d":{"a":{"a":"f","b":[45],"c":[45],"d":"f"},"b":[45],"c":[45],"d":{"a":"f","b":[45],"c":[45],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[45],"c":[45],"d":"f"},"b":[45],"c":[45],"d":{"a":"f","b":[45],"c":[45],"d":"f"}},"b":[45],"c":[45],"d":{"a":{"a":"f","b":[45],"c":[45],"d":"f"},"b":[45],"c":[45],"d":{"a":"f","b":[45],"c":[45],"d":"f"}}},"d":[5]},"b":{"a":{"a":{"a":[45],"b":{"a":"f","b":[20],"c":[20],"d":"f"},"c":{"a":"f","b":[20],"c":"f","d":"f"},"d":[45]},"b":{"a":[20],"b":{"a":[20],"b":"f","c":[20],"d":[20]},"c":{"a":[20],"b":[20],"c":"f","d":"f"},"d":{"a":[20],"b":[20],"c":"f","d":"f"}},"c":{"a":[45],"b":{"a":[45],"b":[45],"c":"f","d":[45]},"c":{"a":[45],"b":"f","c":"f","d":[45]},"d":[45]},"d":[45]},"b":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"}}},"d":{"a":[45],"b":{"a":[45],"b":{"a":[45],"b":"f","c":"f","d":[45]},"c":{"a":[45],"b":"f","c":"f","d":[45]},"d":[45]},"c":{"a":[45],"b":{"a":[45],"b":"f","c":"f","d":[45]},"c":{"a":[45],"b":"f","c":"f","d":[45]},"d":[45]},"d":[45]}},"c":{"a":{"a":{"a":[45],"b":{"a":[45],"b":[45],"c":"f","d":[45]},"c":{"a":"f","b":"f","c":[16],"d":"f"},"d":{"a":[45],"b":[45],"c":[45],"d":"f"}},"b":{"a":{"a":"f","b":"f","c":[16],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[16],"b":"f","c":"f","d":[16]},"d":[16]},"c":[16],"d":{"a":{"a":"f","b":[45],"c":"f","d":"f"},"b":{"a":"f","b":[16],"c":[16],"d":"f"},"c":[16],"d":{"a":[5],"b":"f","c":"f","d":[5]}}},"b":{"a":{"d":{"d":"f"}},"b":{"b":{"c":"f"},"c":{"b":"f"}},"d":{"a":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[16],"b":[16],"c":"f","d":[16]},"c":{"a":[16],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":[16],"c":[16],"d":"f"}},"b":{"a":{"a":[16],"b":"f","c":"f","d":"f"},"b":{"a":[16],"b":[16],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[16],"d":[16]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":[8],"b":"f","c":[8],"d":[8]},"b":{"a":"f","b":"f","c":"f","d":[8]},"c":{"a":[8],"b":"f","c":"f","d":[8]},"d":{"a":"f","b":[8],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":[15],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[15]},"c":{"a":[15],"b":"f","c":[15],"d":[15]},"d":[15]}}},"d":{"a":{"a":[5],"b":{"a":[5],"b":{"a":[5],"b":"f","c":"f","d":[5]},"c":{"a":[5],"b":"f","c":"f","d":[5]},"d":[5]},"c":{"a":[5],"b":[5],"c":[5],"d":{"a":[5],"b":[5],"c":[5],"d":"f"}},"d":{"a":{"a":[5],"b":[5],"c":"f","d":"f"},"b":[5],"c":{"a":"f","b":[5],"c":"f","d":"f"},"d":{"a":[46],"b":"f","c":[46],"d":[46]}}},"b":{"a":{"a":{"a":"f","b":[45],"c":[45],"d":[45]},"b":[45],"c":{"a":[45],"b":[45],"c":"f","d":"f"},"d":{"a":[45],"b":[45],"c":"f","d":"f"}},"b":{"a":[45],"b":[45],"c":[45],"d":{"a":[45],"b":[45],"c":"f","d":"f"}},"c":{"a":{"a":[5],"b":"f","c":[5],"d":[5]},"b":{"a":"f","b":"f","c":"f","d":[5]},"c":[5],"d":[5]},"d":[5]},"c":{"a":[5],"b":[5],"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[5],"b":[5],"c":"f","d":"f"},"c":{"a":[15],"b":"f","c":[15],"d":[15]},"d":{"a":"f","b":[15],"c":[15],"d":"f"}},"d":{"a":[5],"b":[5],"c":{"a":[5],"b":[5],"c":"f","d":[5]},"d":[5]}},"d":{"a":[46],"b":{"a":{"a":"f","b":[5],"c":"f","d":"f"},"b":[5],"c":{"a":"f","b":[5],"c":[5],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[46]}},"c":{"a":[46],"b":{"a":"f","b":[5],"c":"f","d":"f"},"c":{"a":[46],"b":"f","c":"f","d":[46]},"d":[46]},"d":[46]}}},"b":{"a":{"d":{"c":{"d":{"a":"f","d":"f"}},"d":{"c":{"b":"f","c":"f","d":"f"},"d":{"c":"f","d":"f"}}}},"d":{"a":{"a":{"a":{"a":"f","b":[297],"c":[297],"d":"f"},"b":{"a":[297],"b":"f","c":"f","d":"f"},"c":{"a":[297],"b":"f","c":"f","d":[297]},"d":{"a":"f","b":[297],"c":[297],"d":"f"}},"b":{"a":{"a":"f"}},"d":{"a":{"a":"f","b":[297],"c":"f","d":"f"},"b":{"a":[297],"b":"f","c":"f","d":[297]},"c":{"a":"f","b":"f"},"d":{"b":"f"}}}}},"d":{"a":{"a":{"a":{"a":{"a":"f","b":"f","c":[1],"d":"f"},"b":{"a":"f","b":"f","c":[1],"d":[1]},"c":{"a":[1],"b":"f","c":"f","d":[1]},"d":[1]},"b":{"a":{"a":"f","b":[46],"c":[46],"d":"f"},"b":{"a":[46],"b":"f","c":"f","d":[46]},"c":{"a":[46],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":[46],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[0],"d":"f"},"b":{"a":"f","b":[0],"c":[0],"d":[0]},"c":[0],"d":[0]},"d":{"a":[1],"b":{"a":[1],"b":"f","c":"f","d":[1]},"c":{"a":[1],"b":"f","c":"f","d":[1]},"d":[1]}},"b":{"a":{"a":{"a":[5],"b":[5],"c":"f","d":"f"},"b":{"a":[5],"b":"f","c":"f","d":[5]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[0]}},"b":{"a":{"a":"f","b":[15],"c":[15],"d":[15]},"b":[15],"c":{"a":[15],"b":[15],"c":"f","d":[15]},"d":[15]},"c":{"a":[15],"b":{"a":[15],"b":"f","c":"f","d":[15]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[15],"b":[15],"c":"f","d":[15]}},"d":{"a":[0],"b":{"a":[0],"b":"f","c":"f","d":[0]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[0]}},"c":{"a":{"a":[0],"b":{"a":"f","b":"f","c":"f","d":[0]},"c":{"a":[0],"b":"f","c":"f","d":[0]},"d":[0]},"b":{"a":{"a":[15],"b":"f","c":"f","d":[15]},"b":{"a":"f","b":"f","c":"f","d":[41]},"c":{"a":[41],"b":"f","c":"f","d":[41]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":[41],"b":[41],"c":[41],"d":"f"},"b":{"a":[41],"b":[41],"c":"f","d":[41]},"c":{"a":"f","b":"f","d":"f"},"d":[41]},"d":{"a":[0],"b":{"a":[0],"b":"f","c":"f","d":[0]},"c":{"a":[0],"b":"f","c":"f","d":"f"},"d":[0]}},"d":{"a":{"a":[1],"b":{"a":[1],"b":"f","c":"f","d":[1]},"c":[1],"d":[1]},"b":{"a":{"a":[0],"b":[0],"c":[0],"d":"f"},"b":[0],"c":[0],"d":{"a":"f","b":[0],"c":[0],"d":"f"}},"c":{"a":{"a":"f","b":[0],"c":[0],"d":"f"},"b":[0],"c":[0],"d":{"a":"f","b":[0],"c":[0],"d":"f"}},"d":{"a":[1],"b":[1],"c":{"a":[1],"b":[1],"c":"f","d":[1]},"d":[1]}}},"b":{"a":{"a":{"a":[15],"b":[15],"c":[15],"d":{"a":[15],"b":[15],"c":"f","d":"f"}},"b":{"a":{"a":[15],"b":"f","c":"f","d":[15]},"b":{"a":[8],"b":"f","c":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"c":{"a":{"a":"f"}},"d":{"a":{"a":[21],"b":"f","c":[21],"d":[21]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[21]},"d":[21]}},"d":{"a":{"a":[21],"b":{"a":[21],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[21],"b":[21],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","d":"f"}}}},"d":{"a":{"a":{"a":{"a":"f","b":[1],"c":"f","d":"f"},"b":{"a":[1],"b":"f","c":"f","d":[1]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f"}},"b":{"a":{"a":"f","b":[0],"c":"f","d":"f"},"b":{"a":[0],"b":[0],"c":"f","d":"f"},"c":{"b":"f"},"d":{"a":"f"}}},"b":{"a":{"a":[0],"b":{"a":"f","b":[41],"c":[41],"d":"f"},"c":{"a":"f","b":[41],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":[41],"b":"f","c":"f","d":[41]},"b":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"b":{"a":"f","b":"f"}}}}}}}},"a":{"a":{"a":{"c":{"a":{"a":{"c":{"c":{"a":"f","b":"f","c":"f","d":[289]},"d":{"b":"f","c":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"},"d":{"a":"f"}}},"b":{"c":{"a":{"c":"f","d":"f"},"b":{"d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f"}},"d":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f"},"d":{"d":"f"}}},"c":{"a":{"a":{"a":"f","c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":{"a":[289],"b":[289],"c":"f","d":"f"},"d":{"a":"f","b":[289],"c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":[289],"d":"f"},"b":{"a":"f","b":"f","c":[289],"d":[289]},"c":{"a":[289],"b":"f","c":"f","d":"f"},"d":{"a":[289],"b":[289],"c":"f","d":"f"}},"c":{"a":{"a":"f"}},"d":{"b":{"b":"f"}}},"d":{"b":{"a":{"b":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"}}}},"b":{"a":{"c":{"c":{"a":"f","b":"f","c":[289],"d":[289]},"d":{"b":"f","c":"f","d":"f"}},"d":{"c":{"c":"f","d":"f"}}},"b":{"c":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"d":{"c":{"a":"f","b":"f","c":"f","d":[289]},"d":{"a":"f","b":"f","c":[289],"d":[289]}}},"c":{"a":{"a":[289],"b":[289],"c":{"a":[289],"b":[289],"c":"f","d":[289]},"d":[289]},"b":{"a":{"a":[289],"b":"f","c":[289],"d":[289]},"b":[289],"c":{"a":"f","b":"f"},"d":{"a":[289],"b":"f","c":"f","d":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":[289]},"c":{"a":"f","b":"f"},"d":{"b":"f"}},"d":{"a":{"a":[289],"b":"f","c":"f","d":[289]},"b":{"a":"f","b":"f"},"c":{"a":"f","d":"f"},"d":{"a":[289],"b":"f","c":"f","d":[289]}}},"d":{"a":{"a":{"a":"f","b":"f","c":[289],"d":[289]},"b":{"a":"f","b":[289],"c":[289],"d":[289]},"c":{"a":[289],"b":[289],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}},"b":{"a":[289],"b":[289],"c":[289],"d":{"a":[289],"b":[289],"c":"f","d":"f"}},"c":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[289],"c":[289],"d":"f"},"c":[289],"d":[289]},"d":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[289],"d":"f"}}}},"c":{"a":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[289],"c":[289],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[277]},"d":[277]},"b":{"a":[289],"b":[289],"c":[289],"d":{"a":"f","b":[289],"c":[289],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[277]},"b":[289],"c":{"a":"f","b":[289],"c":"f","d":"f"},"d":{"a":[277],"b":"f","c":[277],"d":[277]}},"d":[277]},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":[289]},"b":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[289]},"d":[289]},"b":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":[289],"d":[289]},"c":{"a":[289],"b":[289],"c":[289],"d":{"a":[289],"b":[289],"c":{"a":[289],"b":[289],"c":[289],"d":"f"},"d":{"a":"f","b":[289],"c":"f","d":"f"}}},"d":{"a":[277],"b":{"a":{"a":[277],"b":[277],"c":"f","d":[277]},"b":{"a":[277],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[289],"c":[289],"d":"f"},"d":{"a":[277],"b":"f","c":"f","d":[277]}},"c":{"a":[277],"b":{"a":"f","b":"f","c":"f","d":[277]},"c":{"a":[277],"b":"f","c":"f","d":"f"},"d":[277]},"d":[277]}},"d":{"a":{"c":{"a":{"c":"f","d":"f"},"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[277],"c":[277],"d":[277]},"d":[277]},"d":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[277],"d":[277]}},"b":{"a":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[277],"d":[277]},"d":{"b":"f","c":"f","d":"f"}},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[277],"d":[277]},"c":[277],"d":{"a":{"a":"f","b":[277],"c":[277],"d":[277]},"b":[277],"c":[277],"d":[277]}},"c":[277],"d":[277]}},"d":{"b":{"b":{"c":{"a":{"c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f"}}}},"c":{"b":{"c":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[277],"d":{"a":"f","b":"f","c":[277],"d":[277]}},"d":{"a":{"c":"f"},"b":{"c":"f","d":"f"},"c":{"a":[277],"b":[277],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"c":"f","d":"f"},"b":{"b":"f","c":"f","d":"f"},"c":[277],"d":{"a":"f","b":"f","c":[277],"d":"f"}},"b":[277],"c":{"a":{"a":[277],"b":[277],"c":"f","d":"f"},"b":[277],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[214],"d":[214]}},"d":{"a":{"a":"f","b":[277],"c":"f","d":"f"},"b":{"a":[277],"b":[277],"c":"f","d":"f"},"c":[214],"d":[214]}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":[214]},"b":{"c":"f","d":"f"},"c":[214],"d":[214]},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[214],"d":[214]},"c":[214],"d":[214]}},"d":{"a":{"a":{"d":{"d":"f"}},"d":{"a":{"a":"f","b":"f","c":[214],"d":[214]},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":[214],"c":"f","d":"f"}}},"b":{"c":{"d":{"c":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":[214],"d":[214]},"b":{"a":"f","b":"f","c":[214],"d":[214]},"c":[214],"d":[214]},"b":{"a":{"a":"f","b":"f","c":[214],"d":[214]},"b":{"a":"f","b":"f","c":[214],"d":[214]},"c":[214],"d":[214]},"c":[214],"d":[214]},"d":{"a":{"a":{"c":"f"},"b":{"c":"f","d":"f"},"c":[214],"d":{"a":"f","b":"f","c":[214],"d":[214]}},"b":{"a":{"a":"f","b":"f","c":[214],"d":"f"},"b":{"a":"f","b":"f","c":[214],"d":[214]},"c":[214],"d":[214]},"c":[214],"d":[214]}}}},"b":{"b":{"c":{"c":{"a":{"a":{"a":"f","b":"f","c":[251],"d":[251]},"b":{"a":"f","b":"f","c":[251],"d":[251]},"c":[251],"d":[251]},"b":{"a":{"a":"f","b":"f","c":[251],"d":[251]},"b":{"a":"f","b":"f","c":"f","d":[251]},"c":{"a":"f","b":"f","c":"f","d":[251]},"d":{"a":[251],"b":"f","c":[251],"d":[251]}},"c":{"a":[251],"b":{"a":[251],"b":"f","c":"f","d":[251]},"c":{"a":"f","b":"f","d":"f"},"d":{"a":[251],"b":[251],"c":"f","d":"f"}},"d":{"a":[251],"b":[251],"c":{"a":[251],"b":[251],"c":"f","d":"f"},"d":{"a":[251],"b":[251],"c":"f","d":"f"}}},"d":{"a":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"c":"f"}},"b":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[251],"d":[251]},"c":[251],"d":[251]},"c":{"a":[251],"b":[251],"c":{"a":[251],"b":[251],"c":"f","d":[251]},"d":[251]},"d":{"a":{"a":"f","b":"f","c":[251],"d":[251]},"b":[251],"c":[251],"d":[251]}}},"d":{"c":{"c":{"a":{"c":"f","d":"f"},"b":{"b":"f","c":"f","d":"f"},"c":[251],"d":{"a":"f","b":[251],"c":[251],"d":[251]}},"d":{"c":{"a":"f","b":"f","c":[251],"d":[251]},"d":{"b":"f","c":"f","d":"f"}}}}},"c":{"a":{"a":{"b":{"a":{"c":"f"},"b":{"a":"f","b":"f","c":[251],"d":"f"},"c":[251],"d":{"b":"f","c":"f"}},"c":{"a":{"a":"f","b":"f","c":[251],"d":"f"},"b":[251],"c":[251],"d":[251]},"d":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[251],"d":[251]}},"b":{"a":{"a":{"a":"f","b":[251],"c":[251],"d":[251]},"b":[251],"c":[251],"d":[251]},"b":[251],"c":[251],"d":[251]},"c":[251],"d":{"a":{"a":[251],"b":[251],"c":[251],"d":{"a":[251],"b":[251],"c":"f","d":"f"}},"b":[251],"c":[251],"d":{"a":{"a":[290],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[251],"c":[251],"d":[251]},"c":{"a":"f","b":[251],"c":"f","d":"f"},"d":{"a":[290],"b":"f","c":[290],"d":[290]}}}},"b":{"a":{"a":[251],"b":{"a":{"a":[251],"b":[251],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[251]}},"c":{"a":[251],"b":{"a":[251],"b":"f","c":[251],"d":[251]},"c":[251],"d":[251]},"d":[251]},"b":{"a":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":[251]},"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}},"b":{"a":{"d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"b":"f"},"b":{"a":"f","b":[251],"c":"f","d":"f"},"c":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[251]}},"d":{"a":{"a":"f","b":"f","c":[251],"d":[251]},"b":{"a":"f","c":"f","d":"f"},"c":{"a":[251],"b":"f","c":[251],"d":[251]},"d":[251]}},"c":[251],"d":[251]},"c":[251],"d":{"a":{"a":{"a":{"a":[290],"b":[290],"c":"f","d":[290]},"b":{"a":"f","b":[251],"c":[251],"d":"f"},"c":{"a":"f","b":[251],"c":[251],"d":[251]},"d":{"a":"f","b":"f","c":[251],"d":"f"}},"b":[251],"c":{"a":[251],"b":[251],"c":[251],"d":{"a":[251],"b":[251],"c":[251],"d":"f"}},"d":{"a":{"a":"f","b":[251],"c":[251],"d":"f"},"b":[251],"c":{"a":"f","b":"f","c":"f","d":[290]},"d":{"a":"f","b":"f","c":[290],"d":[290]}}},"b":[251],"c":{"a":{"a":[251],"b":[251],"c":[251],"d":{"a":"f","b":"f","c":[251],"d":"f"}},"b":[251],"c":[251],"d":{"a":{"a":"f","b":[251],"c":[251],"d":[251]},"b":[251],"c":[251],"d":{"a":"f","b":[251],"c":[251],"d":"f"}}},"d":{"a":[290],"b":{"a":{"a":"f","b":[251],"c":"f","d":"f"},"b":{"a":[251],"b":[251],"c":"f","d":"f"},"c":{"a":[290],"b":"f","c":[290],"d":[290]},"d":[290]},"c":{"a":[290],"b":{"a":[290],"b":"f","c":"f","d":[290]},"c":{"a":[290],"b":"f","c":[290],"d":[290]},"d":[290]},"d":[290]}}},"d":{"a":{"a":{"d":{"d":{"d":"f"}}},"c":{"c":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[290],"d":[290]},"d":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[290],"d":[290]},"d":{"a":"f","b":"f","c":[290],"d":"f"}}},"d":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f"}},"c":{"c":{"c":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"}}}},"b":{"b":{"c":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":[251],"c":[251],"d":[251]},"d":{"b":"f","c":"f","d":"f"}}},"c":{"a":{"c":{"c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f"},"b":[251],"c":{"a":"f","b":[251],"c":"f","d":"f"},"d":{"b":"f","c":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[290],"b":[290],"c":[290],"d":"f"},"c":[290],"d":{"a":"f","b":"f","c":[290],"d":[290]}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[290],"d":{"a":"f","b":"f","c":[290],"d":[290]}}},"d":{"c":{"c":{"a":"f","b":"f","c":[290],"d":[290]},"d":{"b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"c":{"c":"f","d":"f"},"d":{"a":[290],"b":"f","c":"f","d":[290]}}}},"c":{"a":[290],"b":{"a":[290],"b":[290],"c":{"a":[290],"b":{"a":[290],"b":[290],"c":"f","d":[290]},"c":[290],"d":[290]},"d":[290]},"c":[290],"d":[290]},"d":{"a":{"a":{"c":{"a":"f","b":"f","c":"f","d":[289]},"d":{"b":"f","c":"f","d":"f"}},"b":{"b":{"a":"f","b":[290],"c":[290],"d":"f"},"c":{"a":"f","b":[290],"c":[290],"d":"f"},"d":{"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[290],"c":[290],"d":"f"},"c":[290],"d":{"a":"f","b":[290],"c":[290],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":[289],"d":[289]},"b":[289],"c":{"a":[289],"b":"f","c":"f","d":"f"},"d":[289]}},"b":[290],"c":[290],"d":{"a":{"a":[289],"b":{"a":"f","b":[290],"c":[290],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[289]},"d":[289]},"b":[290],"c":{"a":[290],"b":[290],"c":[290],"d":{"a":[290],"b":[290],"c":"f","d":"f"}},"d":{"a":[289],"b":{"a":"f","b":"f","c":[290],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[289]},"d":[289]}}}}},"c":{"a":{"a":{"a":{"a":[289],"b":{"a":{"a":[289],"b":"f","c":"f","d":[289]},"b":{"a":[290],"b":[290],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[289]},"c":{"a":{"a":[289],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[290],"c":[290],"d":[290]},"c":[290],"d":{"a":"f","b":[290],"c":[290],"d":"f"}},"d":{"a":{"a":"f","b":[289],"c":"f","d":"f"},"b":[289],"c":{"a":"f","b":[289],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[249],"d":[249]}}},"b":[290],"c":[290],"d":{"a":{"a":[249],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[249],"b":"f","c":"f","d":"f"},"d":{"a":[249],"b":[249],"c":"f","d":[249]}},"b":[290],"c":[290],"d":{"a":{"a":[249],"b":"f","c":"f","d":[249]},"b":[290],"c":[290],"d":{"a":"f","b":"f","c":[290],"d":[290]}}}},"b":[290],"c":{"a":{"a":[290],"b":[290],"c":{"a":[290],"b":[290],"c":{"a":[290],"b":"f","c":"f","d":"f"},"d":[290]},"d":[290]},"b":{"a":{"a":[290],"b":[290],"c":{"a":[290],"b":[290],"c":"f","d":[290]},"d":[290]},"b":{"a":[290],"b":[290],"c":[290],"d":{"a":[290],"b":[290],"c":[290],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[241]},"b":[290],"c":{"a":"f","b":[290],"c":"f","d":"f"},"d":{"a":[241],"b":"f","c":[241],"d":[241]}},"d":{"a":{"a":[290],"b":"f","c":"f","d":[290]},"b":{"a":"f","b":"f","c":[241],"d":[241]},"c":[241],"d":{"a":"f","b":"f","c":[241],"d":[241]}}},"c":{"a":{"a":{"a":[241],"b":[241],"c":[241],"d":"f"},"b":[241],"c":[241],"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":[241],"b":{"a":[241],"b":"f","c":[241],"d":[241]},"c":[241],"d":[241]},"c":[241],"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[241],"b":[241],"c":"f","d":[241]},"c":{"a":"f","b":"f","c":"f","d":[227]},"d":{"a":"f","b":"f","c":[227],"d":[227]}}},"d":{"a":[290],"b":{"a":[290],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[227],"d":"f"},"d":[290]},"c":{"a":{"a":[290],"b":"f","c":"f","d":[290]},"b":{"a":"f","b":[227],"c":[227],"d":[227]},"c":[227],"d":{"a":[290],"b":"f","c":"f","d":"f"}},"d":[290]}},"d":{"a":{"a":{"a":{"a":[290],"b":[290],"c":"f","d":"f"},"b":{"a":[290],"b":[290],"c":[290],"d":"f"},"c":{"a":"f","b":[290],"c":"f","d":"f"},"d":[249]},"b":[290],"c":{"a":{"a":"f","b":[290],"c":[290],"d":"f"},"b":[290],"c":[290],"d":{"a":"f","b":[290],"c":[290],"d":"f"}},"d":{"a":[249],"b":{"a":[249],"b":"f","c":[249],"d":[249]},"c":{"a":[249],"b":[249],"c":"f","d":"f"},"d":{"a":[249],"b":[249],"c":"f","d":"f"}}},"b":[290],"c":[290],"d":{"a":{"a":[289],"b":{"a":[289],"b":"f","c":"f","d":[289]},"c":{"a":[289],"b":"f","c":[289],"d":[289]},"d":[289]},"b":{"a":{"a":"f","b":[290],"c":[290],"d":"f"},"b":[290],"c":[290],"d":{"a":"f","b":"f","c":[290],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[290],"c":[290],"d":{"a":"f","b":[290],"c":"f","d":"f"}},"d":[289]}}},"b":{"a":{"a":{"a":[290],"b":[290],"c":{"a":[290],"b":{"a":[290],"b":[290],"c":"f","d":[290]},"c":[290],"d":[290]},"d":[290]},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[251],"c":[251],"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":[251],"c":[251],"d":{"a":{"a":"f","b":[251],"c":[251],"d":"f"},"b":[251],"c":[251],"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":[251],"d":"f"},"b":[251],"c":[251],"d":{"a":"f","b":[251],"c":[251],"d":"f"}},"b":[251],"c":[251],"d":{"a":{"a":"f","b":"f","c":[251],"d":"f"},"b":[251],"c":[251],"d":{"a":"f","b":[251],"c":"f","d":"f"}}},"d":{"a":[290],"b":{"a":{"a":[290],"b":[290],"c":"f","d":[290]},"b":{"a":[290],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[241],"d":"f"},"d":{"a":[290],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[241],"c":[241],"d":"f"},"b":[241],"c":[241],"d":{"a":"f","b":[241],"c":[241],"d":"f"}},"d":{"a":[290],"b":[290],"c":{"a":[290],"b":"f","c":"f","d":[290]},"d":[290]}}},"b":[251],"c":{"a":[251],"b":[251],"c":[251],"d":{"a":{"a":[251],"b":[251],"c":{"a":"f","b":[251],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":[251],"b":[251],"c":[251],"d":{"a":[251],"b":[251],"c":[251],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[241]},"b":[251],"c":[251],"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":[241],"d":[241]},"b":[241],"c":[241],"d":[241]}}},"d":{"a":{"a":{"a":[290],"b":{"a":[290],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[290]},"d":[290]},"b":{"a":{"a":"f","b":[241],"c":[241],"d":[241]},"b":[241],"c":[241],"d":[241]},"c":{"a":{"a":[241],"b":[241],"c":[241],"d":"f"},"b":[241],"c":[241],"d":{"a":"f","b":[241],"c":[241],"d":"f"}},"d":{"a":[290],"b":{"a":[290],"b":"f","c":"f","d":[290]},"c":{"a":[290],"b":[290],"c":"f","d":"f"},"d":{"a":"f","b":[290],"c":"f","d":"f"}}},"b":{"a":{"a":{"a":[241],"b":"f","c":[241],"d":[241]},"b":{"a":"f","b":[251],"c":[251],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[241]},"d":[241]},"b":[251],"c":{"a":[251],"b":[251],"c":{"a":[251],"b":[251],"c":[251],"d":"f"},"d":{"a":[251],"b":[251],"c":"f","d":"f"}},"d":{"a":{"a":[241],"b":"f","c":"f","d":[241]},"b":{"a":"f","b":"f","c":[251],"d":"f"},"c":{"a":"f","b":"f","c":[251],"d":"f"},"d":[241]}},"c":{"a":{"a":[241],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[241],"d":[241]},"b":{"a":{"a":"f","b":"f","c":[241],"d":[241]},"b":{"a":"f","b":[251],"c":"f","d":"f"},"c":{"a":[241],"b":"f","c":[241],"d":[241]},"d":[241]},"c":[241],"d":[241]},"d":{"a":{"a":{"a":"f","b":[241],"c":[241],"d":[241]},"b":{"a":"f","b":"f","c":[241],"d":[241]},"c":[241],"d":[241]},"b":{"a":{"a":"f","b":[241],"c":[241],"d":[241]},"b":[241],"c":[241],"d":[241]},"c":[241],"d":[241]}}},"c":{"a":{"a":[241],"b":[241],"c":{"a":[241],"b":[241],"c":{"a":[241],"b":{"a":[241],"b":[241],"c":"f","d":"f"},"c":{"a":"f","b":[285],"c":[285],"d":"f"},"d":[241]},"d":[241]},"d":{"a":{"a":[241],"b":[241],"c":[241],"d":{"a":[241],"b":[241],"c":"f","d":"f"}},"b":[241],"c":{"a":{"a":[241],"b":[241],"c":"f","d":"f"},"b":[241],"c":{"a":[241],"b":[241],"c":[241],"d":"f"},"d":{"a":[227],"b":"f","c":"f","d":[227]}},"d":{"a":{"a":[227],"b":"f","c":[227],"d":[227]},"b":{"a":"f","b":[241],"c":"f","d":"f"},"c":[227],"d":[227]}}},"b":{"a":{"a":[241],"b":{"a":{"a":[241],"b":"f","c":[241],"d":[241]},"b":{"a":"f","b":[251],"c":[251],"d":"f"},"c":{"a":"f","b":[251],"c":[251],"d":"f"},"d":[241]},"c":{"a":[241],"b":{"a":"f","b":"f","c":"f","d":[241]},"c":{"a":"f","b":"f","c":[251],"d":"f"},"d":{"a":[241],"b":[241],"c":"f","d":[241]}},"d":[241]},"b":[251],"c":{"a":[251],"b":[251],"c":{"a":[251],"b":[251],"c":[251],"d":{"a":[251],"b":[251],"c":"f","d":"f"}},"d":{"a":[251],"b":[251],"c":{"a":[251],"b":[251],"c":"f","d":[251]},"d":[251]}},"d":{"a":{"a":[241],"b":{"a":[241],"b":"f","c":"f","d":"f"},"c":{"a":[241],"b":"f","c":"f","d":"f"},"d":[241]},"b":{"a":{"a":"f","b":"f","c":[251],"d":[251]},"b":[251],"c":[251],"d":[251]},"c":{"a":{"a":"f","b":[251],"c":[251],"d":"f"},"b":[251],"c":[251],"d":{"a":"f","b":[251],"c":[251],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":[285],"d":"f"},"b":{"a":"f","b":"f","c":[285],"d":[285]},"c":[285],"d":[285]}}},"c":{"a":{"a":[285],"b":{"a":{"a":"f","b":[251],"c":"f","d":"f"},"b":{"a":[251],"b":[251],"c":"f","d":"f"},"c":{"a":"f","b":[240],"c":[240],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[285]}},"c":{"a":{"a":"f","b":"f","c":[240],"d":[240]},"b":[240],"c":[240],"d":{"a":[240],"b":[240],"c":[240],"d":"f"}},"d":{"a":[285],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[285],"b":"f","c":"f","d":[285]},"d":[285]}},"b":{"a":{"a":{"a":[251],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[240],"d":[240]},"c":[240],"d":{"a":"f","b":[240],"c":[240],"d":[240]}},"b":{"a":{"a":[240],"b":"f","c":[240],"d":[240]},"b":{"a":"f","b":[251],"c":"f","d":"f"},"c":[240],"d":[240]},"c":{"a":[240],"b":[240],"c":{"a":[240],"b":[240],"c":"f","d":[240]},"d":[240]},"d":[240]},"c":{"a":[240],"b":{"a":[240],"b":{"a":[240],"b":"f","c":"f","d":[240]},"c":{"a":"f","b":"f","c":[275,286],"d":"f"},"d":[240]},"c":{"a":[240],"b":{"a":"f","b":[275,286],"c":[275,286],"d":"f"},"c":{"a":"f","b":"f","c":[275,286],"d":"f"},"d":{"a":[240],"b":[240],"c":"f","d":"f"}},"d":{"a":[240],"b":[240],"c":{"a":[240],"b":[240],"c":"f","d":[240]},"d":[240]}},"d":{"a":[285],"b":{"a":{"a":"f","b":[240],"c":[240],"d":"f"},"b":[240],"c":[240],"d":{"a":"f","b":"f","c":"f","d":[285]}},"c":{"a":{"a":"f","b":"f","c":[240],"d":"f"},"b":[240],"c":[240],"d":{"a":"f","b":[240],"c":[240],"d":"f"}},"d":{"a":[285],"b":[285],"c":{"a":[285],"b":"f","c":"f","d":[285]},"d":[285]}}},"d":{"a":{"a":{"a":[227],"b":[227],"c":{"a":[227],"b":[227],"c":"f","d":"f"},"d":{"a":[227],"b":[227],"c":"f","d":"f"}},"b":{"a":{"a":[227],"b":"f","c":[227],"d":[227]},"b":{"a":"f","b":[241],"c":"f","d":"f"},"c":{"a":"f","b":[285],"c":[285],"d":"f"},"d":{"a":[227],"b":[227],"c":"f","d":"f"}},"c":[285],"d":{"a":{"a":"f","b":[285],"c":[285],"d":"f"},"b":{"a":"f","b":"f","c":[285],"d":[285]},"c":[285],"d":{"a":"f","b":[285],"c":[285],"d":[285]}}},"b":{"a":{"a":{"a":"f","b":"f","c":[285],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[285]},"c":[285],"d":[285]},"b":{"a":{"a":[241],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[285],"c":[285],"d":[285]},"c":[285],"d":[285]},"c":[285],"d":[285]},"c":[285],"d":{"a":{"a":{"a":"f","b":[285],"c":"f","d":"f"},"b":[285],"c":[285],"d":{"a":[228],"b":"f","c":"f","d":[228]}},"b":[285],"c":[285],"d":{"a":{"a":[228],"b":"f","c":"f","d":[228]},"b":[285],"c":[285],"d":{"a":"f","b":"f","c":[285],"d":"f"}}}}},"d":{"a":{"a":{"a":{"a":[289],"b":{"a":[289],"b":[289],"c":"f","d":[289]},"c":{"a":"f","b":"f","c":"f","d":[289]},"d":[289]},"b":{"a":{"a":[289],"b":"f","c":"f","d":"f"},"b":[290],"c":[290],"d":{"a":[290],"b":[290],"c":[290],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[289]},"b":{"a":[290],"b":[290],"c":[290],"d":"f"},"c":{"a":"f","b":[290],"c":[290],"d":[290]},"d":{"a":[289],"b":"f","c":"f","d":"f"}},"d":{"a":[289],"b":[289],"c":{"a":[289],"b":[289],"c":[289],"d":"f"},"d":{"a":[289],"b":[289],"c":"f","d":"f"}}},"b":{"a":[290],"b":[290],"c":{"a":[290],"b":[290],"c":{"a":[290],"b":[290],"c":"f","d":[290]},"d":[290]},"d":[290]},"c":{"a":[290],"b":{"a":{"a":[290],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[275],"d":[275]},"c":[275],"d":{"a":"f","b":[275],"c":[275],"d":"f"}},"c":{"a":{"a":"f","b":[275],"c":[275],"d":[275]},"b":[275],"c":[275],"d":[275]},"d":{"a":[290],"b":{"a":[290],"b":"f","c":"f","d":[290]},"c":{"a":[290],"b":"f","c":"f","d":"f"},"d":[290]}},"d":{"a":{"a":{"a":"f","b":[290],"c":[290],"d":"f"},"b":{"a":"f","b":"f","c":[290],"d":[290]},"c":{"a":"f","b":[290],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[289],"d":[289]}},"b":{"a":{"a":"f","b":"f","c":[290],"d":[290]},"b":[290],"c":[290],"d":[290]},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[290],"c":{"a":"f","b":[290],"c":[290],"d":"f"},"d":{"a":[289],"b":"f","c":"f","d":[289]}},"d":{"a":[289],"b":{"a":[289],"b":"f","c":[289],"d":[289]},"c":[289],"d":[289]}}},"b":{"a":{"a":{"a":[290],"b":{"a":[290],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[227],"d":"f"},"d":[290]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[227],"c":[227],"d":[227]},"c":[227],"d":{"a":[290],"b":{"a":"f","b":"f","c":[227],"d":"f"},"c":{"a":"f","b":"f","c":[227],"d":"f"},"d":{"a":[290],"b":[290],"c":"f","d":"f"}}},"b":{"a":{"a":[227],"b":{"a":[227],"b":"f","c":"f","d":[227]},"c":{"a":"f","b":"f","c":[241],"d":"f"},"d":{"a":[227],"b":[227],"c":"f","d":[227]}},"b":[241],"c":{"a":{"a":[241],"b":[241],"c":[241],"d":"f"},"b":[241],"c":{"a":[241],"b":[241],"c":[241],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[227]}},"d":{"a":{"a":[227],"b":"f","c":[227],"d":[227]},"b":{"a":"f","b":[241],"c":"f","d":"f"},"c":[227],"d":[227]}},"c":{"a":[227],"b":{"a":{"a":[227],"b":"f","c":"f","d":[227]},"b":{"a":"f","b":[241],"c":[241],"d":[241]},"c":{"a":"f","b":"f","c":"f","d":[227]},"d":{"a":[227],"b":"f","c":[227],"d":[227]}},"c":[227],"d":[227]},"d":{"a":{"a":[275],"b":{"a":"f","b":"f","c":[275],"d":[275]},"c":[275],"d":[275]},"b":{"a":{"a":"f","b":[227],"c":"f","d":"f"},"b":[227],"c":[227],"d":{"a":"f","b":"f","c":[227],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[275]},"b":[227],"c":{"a":[227],"b":[227],"c":[227],"d":"f"},"d":{"a":[275],"b":"f","c":"f","d":[275]}},"d":[275]}},"c":{"a":{"a":[275],"b":{"a":[275],"b":{"a":"f","b":[227],"c":"f","d":"f"},"c":{"a":[275],"b":"f","c":[275],"d":[275]},"d":[275]},"c":{"a":[275],"b":[275],"c":{"a":[275],"b":[275],"c":"f","d":[275]},"d":[275]},"d":[275]},"b":{"a":{"a":[227],"b":{"a":[227],"b":[227],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[228],"d":"f"},"d":{"a":"f","b":"f","c":[275],"d":"f"}},"b":{"a":{"a":[227],"b":"f","c":"f","d":"f"},"b":{"a":[227],"b":[227],"c":[227],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[228]},"d":[228]},"c":{"a":[228],"b":[228],"c":{"a":[228],"b":"f","c":"f","d":[228]},"d":[228]},"d":{"a":[275],"b":{"a":"f","b":[228],"c":"f","d":"f"},"c":{"a":[275],"b":"f","c":"f","d":"f"},"d":{"a":[275],"b":[275],"c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":[228],"d":[228]},"b":{"a":"f","b":"f","c":[228],"d":[228]},"c":[228],"d":{"a":[228],"b":[228],"c":"f","d":"f"}},"b":{"a":[228],"b":{"a":[228],"b":"f","c":[228],"d":[228]},"c":[228],"d":[228]},"c":{"a":[228],"b":[228],"c":{"a":[228],"b":[228],"c":"f","d":[228]},"d":{"a":"f","b":"f","c":"f","d":[275]}},"d":{"a":{"a":[275],"b":"f","c":[275],"d":[275]},"b":{"a":"f","b":[228],"c":[228],"d":"f"},"c":{"a":"f","b":"f","c":[275],"d":[275]},"d":[275]}},"d":{"a":[275],"b":{"a":{"a":[275],"b":[275],"c":"f","d":[275]},"b":{"a":"f","b":"f","c":[228],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[275],"b":"f","c":"f","d":[275]}},"c":[275],"d":[275]}},"d":{"a":{"a":[289],"b":{"a":{"a":[289],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[290],"c":[290],"d":[290]},"c":{"a":[290],"b":[290],"c":"f","d":[290]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":[289],"b":"f","c":[289],"d":[289]},"b":{"a":"f","b":"f","c":[275],"d":"f"},"c":{"a":"f","b":[275],"c":[275],"d":"f"},"d":{"a":[289],"b":"f","c":"f","d":[289]}},"d":{"a":[289],"b":[289],"c":{"a":"f","b":[289],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[275],"d":"f"}}},"b":{"a":{"a":[290],"b":{"a":"f","b":[275],"c":[275],"d":"f"},"c":{"a":"f","b":[275],"c":[275],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":[275],"c":[275],"d":[275]},"c":[275],"d":{"a":{"a":{"a":"f","b":[275],"c":"f","d":"f"},"b":{"a":[275],"b":"f","c":[275],"d":[275]},"c":[275],"d":{"a":[289],"b":"f","c":"f","d":[289]}},"b":{"a":{"a":"f","b":"f","c":[275],"d":[275]},"b":[275],"c":[275],"d":[275]},"c":{"a":[275],"b":[275],"c":[275],"d":{"a":[275],"b":[275],"c":[275],"d":"f"}},"d":{"a":{"a":[289],"b":"f","c":"f","d":[289]},"b":{"a":[275],"b":[275],"c":[275],"d":"f"},"c":{"a":"f","b":[275],"c":"f","d":"f"},"d":[289]}}}}},"d":{"a":{"a":{"a":{"a":[214],"b":[214],"c":[214],"d":{"a":[214],"b":[214],"c":[214],"d":{"a":[214],"b":[214],"c":[214],"d":"f"}}},"b":[214],"c":{"a":[214],"b":{"a":[214],"b":{"a":[214],"b":[214],"c":"f","d":[214]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[214]},"c":{"a":[214],"b":{"a":[214],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[246],"c":[246],"d":[246]},"d":{"a":"f","b":"f","c":[246],"d":[246]}},"d":{"a":[214],"b":[214],"c":{"a":"f","b":"f","c":[246],"d":[246]},"d":{"a":"f","b":"f","c":[246],"d":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f"},"b":[214],"c":[214],"d":{"b":"f","c":"f","d":"f"}},"b":[214],"c":{"a":[214],"b":[214],"c":{"a":[214],"b":[214],"c":"f","d":"f"},"d":{"a":"f","b":[214],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":[214],"c":[214],"d":"f"},"b":[214],"c":{"a":"f","b":"f","d":"f"},"d":{"a":"f","b":[214],"c":"f","d":"f"}}}},"b":{"a":{"a":[214],"b":[214],"c":{"a":[214],"b":[214],"c":{"a":[214],"b":[214],"c":"f","d":"f"},"d":{"a":[214],"b":[214],"c":"f","d":"f"}},"d":[214]},"b":{"a":[214],"b":{"a":[214],"b":{"a":"f","b":"f","c":[277],"d":"f"},"c":{"a":"f","b":[277],"c":"f","d":"f"},"d":{"a":[214],"b":"f","c":"f","d":[214]}},"c":{"a":{"a":[214],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[256],"d":[256]},"c":[256],"d":{"a":"f","b":[256],"c":[256],"d":[256]}},"d":{"a":[214],"b":[214],"c":{"a":"f","b":"f","c":[256],"d":"f"},"d":{"a":[214],"b":[214],"c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":[256],"c":[256],"d":"f"},"b":[256],"c":[256],"d":{"a":"f","b":[256],"c":[256],"d":"f"}},"b":[256],"c":[256],"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[256],"c":[256],"d":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"a":{"a":{"a":[214],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[246],"d":[246]},"c":[246],"d":[246]},"b":{"a":{"a":"f","b":"f","c":[246],"d":[246]},"b":{"a":[246],"b":"f","c":"f","d":[246]},"c":[246],"d":[246]},"c":[246],"d":{"a":{"a":"f","b":[246],"c":[246],"d":[246]},"b":[246],"c":[246],"d":[246]}}},"c":{"a":{"a":[246],"b":[246],"c":{"a":[246],"b":[246],"c":[246],"d":{"a":"f","b":[246],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":[246],"c":[246],"d":"f"},"c":{"a":"f","b":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":[246]},"b":[256],"c":{"a":[256],"b":[256],"c":[256],"d":"f"},"d":{"a":[246],"b":"f","c":"f","d":[246]}},"b":{"a":{"a":[256],"b":"f","c":"f","d":[256]},"b":{"a":"f","b":"f","c":"f"},"d":{"a":[256],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":[246],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[246],"b":"f","c":[246],"d":[246]},"d":[246]}},"c":{"a":[246],"b":{"a":{"a":[246],"b":"f","c":"f","d":[246]},"b":{"d":"f"},"c":{"a":"f","b":"f","c":[246],"d":[246]},"d":[246]},"c":[246],"d":[246]},"d":{"b":{"a":{"b":"f","c":"f"},"b":{"a":[246],"b":[246],"c":[246],"d":"f"},"c":{"a":"f","b":"f","c":"f"}},"c":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}}}},"d":{"a":{"b":{"b":{"a":"f","b":"f"}}},"b":{"a":{"a":{"a":"f","b":[246],"c":"f","d":"f"},"b":[246],"c":{"a":"f","b":[246],"c":"f","d":"f"},"d":{"b":"f"}},"b":[246],"c":{"a":{"a":"f","b":[246],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f"},"d":{"b":"f"}},"d":{"b":{"b":"f"}}}}},"b":{"a":{"a":{"a":{"a":[277],"b":[277],"c":{"a":[277],"b":[277],"c":"f","d":"f"},"d":{"a":[277],"b":[277],"c":"f","d":"f"}},"b":{"a":[277],"b":[277],"c":[277],"d":{"a":[277],"b":[277],"c":[277],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[256]},"b":[277],"c":{"a":"f","b":[277],"c":"f","d":"f"},"d":{"a":[256],"b":"f","c":[256],"d":[256]}},"d":{"a":{"a":"f","b":"f","c":[256],"d":[256]},"b":{"a":"f","b":[256],"c":[256],"d":[256]},"c":[256],"d":[256]}},"b":[277],"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[256],"d":"f"},"c":[256],"d":[256]},"b":{"a":{"a":"f","b":"f","c":"f","d":[256]},"b":{"a":[277],"b":[277],"c":"f","d":"f"},"c":[256],"d":{"a":[256],"b":"f","c":[256],"d":[256]}},"c":[256],"d":[256]},"d":{"a":[256],"b":{"a":[256],"b":{"a":"f","b":"f","c":[256],"d":[256]},"c":[256],"d":[256]},"c":[256],"d":[256]}},"b":{"a":{"a":[277],"b":[277],"c":{"a":[277],"b":{"a":[277],"b":[277],"c":"f","d":"f"},"c":{"a":"f","b":[287],"c":[287],"d":[287]},"d":{"a":"f","b":"f","c":[287],"d":[287]}},"d":{"a":[277],"b":[277],"c":{"a":[277],"b":"f","c":"f","d":"f"},"d":[277]}},"b":{"a":{"a":{"a":[277],"b":[277],"c":"f","d":"f"},"b":{"a":"f","b":[289],"c":[289],"d":"f"},"c":[289],"d":{"a":"f","b":[289],"c":"f","d":"f"}},"b":{"a":[289],"b":[289],"c":{"a":[289],"b":[289],"c":[289],"d":"f"},"d":{"a":[289],"b":[289],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":[249],"c":[249],"d":[249]},"b":{"a":"f","b":"f","c":[249],"d":[249]},"c":[249],"d":[249]},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[249],"d":[249]},"c":[249],"d":{"a":[287],"b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":[249],"c":[249],"d":"f"},"b":[249],"c":[249],"d":{"a":"f","b":[249],"c":"f","d":"f"}},"b":[249],"c":{"a":[249],"b":[249],"c":{"a":[249],"b":"f","c":"f","d":[249]},"d":[249]},"d":{"a":{"a":[287],"b":"f","c":"f","d":"f"},"b":[249],"c":[249],"d":{"a":"f","b":[249],"c":[249],"d":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":[287],"d":"f"},"b":{"a":"f","b":[287],"c":[287],"d":[287]},"c":[287],"d":{"a":"f","b":[287],"c":"f","d":"f"}},"b":{"a":[287],"b":{"a":[287],"b":[287],"c":"f","d":[287]},"c":{"a":[287],"b":"f","c":"f","d":[287]},"d":[287]},"c":{"a":[287],"b":[287],"c":{"a":"f","b":"f","c":[289],"d":"f"},"d":{"a":[287],"b":[287],"c":"f","d":"f"}},"d":{"a":{"a":[256],"b":"f","c":"f","d":[256]},"b":[287],"c":{"a":[287],"b":[287],"c":"f","d":"f"},"d":{"a":[256],"b":"f","c":"f","d":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","b":[289],"c":[289],"d":[289]},"b":{"a":"f","b":"f","c":[289],"d":[289]},"c":[289],"d":{"a":[289],"b":[289],"c":"f","d":"f"}},"b":{"a":{"a":[289],"b":"f","c":[289],"d":[289]},"b":[289],"c":[289],"d":[289]},"c":{"a":[289],"b":[289],"c":[289],"d":{"a":[289],"b":[289],"c":[289],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":[289],"d":[289]},"b":[289],"c":{"a":[289],"b":[289],"c":"f","d":"f"},"d":{"a":[289],"b":[289],"c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":[289]},"b":{"a":[249],"b":[249],"c":[249],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[289]},"d":[289]},"b":{"a":[249],"b":{"a":[249],"b":"f","c":"f","d":[249]},"c":[249],"d":[249]},"c":{"a":[249],"b":[249],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[289]}},"d":{"a":[289],"b":{"a":[289],"b":"f","c":"f","d":[289]},"c":{"a":[289],"b":"f","c":[289],"d":[289]},"d":[289]}},"c":{"a":[289],"b":[289],"c":[289],"d":{"a":{"a":"f","b":[289],"c":"f","d":"f"},"b":[289],"c":{"a":"f","b":[289],"c":"f","d":"f"},"d":{"b":"f"}}},"d":{"a":{"a":{"a":"f"}},"b":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":[289],"b":[289],"c":[289],"d":"f"},"c":{"a":"f","b":"f","c":"f"}},"c":{"b":{"b":"f"},"d":{"d":"f"}},"d":{"c":{"c":"f"}}}},"d":{"a":{"a":{"a":{"a":[256],"b":[256],"c":[256],"d":"f"},"b":[256],"c":{"a":[256],"b":[256],"c":[256],"d":"f"},"d":{"a":"f","b":"f","c":"f"}},"b":[256],"c":[256],"d":{"b":{"a":"f","b":"f","c":"f"},"c":{"a":"f","b":"f","c":[256],"d":"f"}}},"b":{"a":[256],"b":{"a":[256],"b":{"a":[256],"b":"f","c":"f","d":[256]},"c":{"a":[256],"b":"f","c":"f","d":[256]},"d":[256]},"c":{"a":[256],"b":{"a":[256],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[289],"c":"f","d":"f"},"d":{"a":[256],"b":[256],"c":"f","d":[256]}},"d":[256]},"c":{"a":{"a":{"a":[256],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f"}},"b":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":"f"}}},"d":{"a":{"b":{"a":"f","b":"f"},"d":{"a":"f","b":"f","c":"f","d":[246]}},"b":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":[246],"b":"f","c":"f","d":[246]},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":[246]}}}},"c":{"a":{"a":{"a":{"a":[246],"b":{"a":"f","b":"f","c":"f","d":[246]},"c":{"a":[246],"b":"f","c":"f","d":[246]},"d":[246]},"d":{"a":[246],"b":{"a":[246],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[246]}},"d":{"a":{"a":[246],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[246],"b":[246],"c":"f","d":[246]}},"d":{"a":{"a":[246],"b":"f","c":"f","d":[246]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}}},"b":{"a":{"a":{"b":{"b":"f"}},"b":{"a":{"a":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"d":"f"},"c":{"b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"c":{"c":"f"}}},"b":{"a":{"b":{"b":"f"},"c":{"a":"f","b":"f","c":[289],"d":"f"}},"b":{"a":{"a":"f","b":[289],"c":"f","d":"f"},"b":[289],"c":{"a":[289],"b":[289],"c":[289],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":[289],"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[289],"c":[289],"d":"f"},"c":[289],"d":{"a":"f","b":[289],"c":[289],"d":[289]}}},"c":[289],"d":{"a":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"b":{"a":[273],"b":{"a":"f","b":[289],"c":[289],"d":"f"},"c":{"a":"f","b":[289],"c":[289],"d":"f"},"d":[273]},"c":{"a":[273],"b":{"a":"f","b":[289],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[273]},"d":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}}}},"c":{"a":{"a":{"b":{"a":"f","b":"f","c":[273],"d":"f"},"c":{"a":"f","b":[273],"c":[273],"d":"f"}},"b":{"a":[273],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[273]},"c":{"a":{"a":"f","b":[273],"c":[273],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":[273],"c":[273],"d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f"},"d":{"b":"f"}}},"b":{"a":[289],"b":[289],"c":[289],"d":{"a":{"a":[289],"b":[289],"c":[289],"d":"f"},"b":[289],"c":[289],"d":{"a":"f","b":[289],"c":"f","d":"f"}}},"c":{"a":{"a":{"b":"f","c":"f"},"b":{"a":[289],"b":[289],"c":[289],"d":"f"},"c":{"a":"f","b":[289],"c":[289],"d":"f"}},"b":[289],"c":{"a":[289],"b":[289],"c":[289],"d":{"a":"f","b":[289],"c":"f","d":"f"}},"d":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f"}}},"d":{"a":{"c":{"b":"f","c":"f"}},"b":{"a":{"a":"f","b":[273],"c":[273],"d":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":[273],"c":[273],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[283]},"d":{"b":"f","c":"f","d":"f"}},"d":{"b":{"b":"f","c":"f"}}}},"d":{"a":{"a":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":[277],"d":"f"},"c":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}},"d":{"b":{"b":"f"}}},"c":{"a":{"a":{"d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":[287],"d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"}}},"d":{"b":{"a":{"b":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"}}}}},"d":{"a":{"c":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"a":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"b":{"b":{"c":"f"},"c":{"a":"f","b":"f","d":"f"},"d":{"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f"}}}},"b":{"a":{"a":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[246],"d":"f"},"d":{"c":"f","d":"f"}},"b":{"a":{"d":"f"},"b":{"b":"f","c":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[246],"c":[246],"d":{"b":"f","c":"f","d":"f"}},"b":[246],"c":{"a":[246],"b":[246],"c":[246],"d":{"a":"f","b":[246],"c":[246],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":[246],"b":[246],"c":"f","d":"f"},"c":{"b":"f"}}},"c":{"a":{"b":{"b":"f","c":"f"}},"b":{"a":{"a":"f","b":[246],"c":"f","d":"f"},"b":[246],"c":{"a":"f","b":[246],"c":[246],"d":"f"},"d":{"b":"f"}},"c":{"b":{"a":"f","b":[246],"c":"f","d":"f"},"c":{"b":"f"}}}}}}},"b":{"a":{"a":{"c":{"d":{"a":{"a":{"c":"f","d":"f"},"d":{"a":"f","b":"f"}},"c":{"a":{"a":"f","c":"f","d":"f"},"d":{"a":"f"}},"d":{"a":{"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[251],"d":"f"},"c":{"a":"f","b":"f"},"d":{"a":"f","b":"f"}}}},"d":{"c":{"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f"},"d":{"a":"f","b":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"d":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f"}}}}},"b":{"c":{"a":{"d":{"c":{"d":"f"},"d":{"c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":[349],"d":[349]},"b":{"a":"f","c":"f","d":"f"},"c":[349],"d":[349]},"b":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":{"a":[349],"b":"f","c":"f","d":"f"},"d":[349]},"c":{"a":{"a":"f","b":"f"},"b":{"a":"f"}},"d":{"a":{"a":[349],"b":[349],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"}}},"d":{"a":{"a":[349],"b":{"a":"f","b":"f","c":[349],"d":[349]},"c":[349],"d":[349]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[349],"d":[349]},"c":[349],"d":{"a":"f","b":"f","c":[349],"d":[349]}},"c":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":[349],"b":[349],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f","b":"f"}}}},"d":{"a":{"c":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"d":{"c":{"c":"f"}}},"b":{"c":{"c":{"a":"f","b":"f","c":"f","d":[349]},"d":{"a":"f","b":"f","c":[349],"d":[349]}},"d":{"c":{"a":"f","b":"f","c":[349],"d":[349]},"d":{"b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":[349],"c":[349],"d":[349]},"b":[349],"c":[349],"d":{"a":[349],"b":[349],"c":[349],"d":"f"}},"b":[349],"c":{"a":{"a":[349],"b":[349],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":[349],"b":[349],"c":"f","d":"f"}}},"d":{"a":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":[349],"d":[349]},"c":{"a":"f","b":"f"},"d":{"b":"f"}},"b":{"a":{"a":"f","b":"f","c":[349],"d":[349]},"b":{"a":"f","b":"f","c":[349],"d":"f"},"c":{"a":[349],"b":[349],"c":"f","d":"f"},"d":{"a":"f","b":[349],"c":"f","d":"f"}}}}},"c":{"a":{"a":{"c":{"a":{"d":"f"},"c":{"a":"f","b":"f","c":[349],"d":[349]},"d":{"a":"f","b":"f","c":[349],"d":[349]}},"d":{"a":{"a":"f","b":"f","c":[349],"d":[349]},"b":{"a":"f","c":"f","d":"f"},"c":[349],"d":[349]}},"b":{"c":{"d":{"c":"f","d":"f"}},"d":{"c":{"a":"f","b":"f","c":"f","d":[349]},"d":{"a":"f","b":"f","c":[349],"d":[349]}}},"c":{"a":{"a":[349],"b":[349],"c":[349],"d":{"a":"f","b":[349],"c":"f","d":"f"}},"b":{"a":{"a":[349],"b":"f","c":[349],"d":[349]},"b":{"a":"f","b":"f","c":"f","d":[349]},"c":[349],"d":[349]},"c":{"a":{"a":[349],"b":[349],"c":[349],"d":"f"},"b":[349],"c":{"a":[349],"b":[349],"c":[349],"d":"f"},"d":{"a":"f","b":"f","c":"f"}},"d":{"a":{"b":"f"},"b":{"a":"f","b":"f","c":"f"}}},"d":{"a":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":[349],"b":[349],"c":"f","d":"f"},"b":{"a":[349],"b":[349],"c":[349],"d":"f"},"c":{"a":"f","b":"f"}}}},"b":{"d":{"a":{"a":{"c":"f","d":"f"},"c":{"d":"f"},"d":{"a":[349],"b":"f","c":"f","d":[349]}},"c":{"a":{"d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":[349],"b":{"a":"f","b":"f","c":"f","d":[349]},"c":[349],"d":[349]}}},"c":{"a":{"a":{"a":[349],"b":[349],"c":[349],"d":{"a":"f","b":[349],"c":[349],"d":"f"}},"b":{"a":{"a":[349],"b":"f","c":[349],"d":[349]},"b":{"a":"f","c":"f","d":"f"},"c":{"a":[349],"b":"f","c":"f","d":[349]},"d":[349]},"c":{"a":[349],"b":{"a":[349],"b":"f","c":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":[349],"b":[349],"c":{"a":[349],"b":[349],"c":"f","d":"f"},"d":{"a":[349],"b":[349],"c":"f","d":[349]}}},"c":{"a":{"a":{"c":"f"},"b":{"c":"f","d":"f"},"c":{"a":[349],"b":"f","c":[349],"d":[349]},"d":{"a":"f","b":"f","c":[349],"d":[349]}},"b":{"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":"f","c":[349],"d":[349]},"c":[349],"d":{"a":"f","b":"f","c":[349],"d":[349]}},"d":{"a":{"a":"f","b":[349],"c":"f","d":"f"},"b":{"a":[349],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[349],"d":[349]},"d":{"a":[349],"b":"f","c":[349],"d":[349]}}},"d":{"a":{"a":{"a":"f","b":"f"},"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"b":{"c":{"b":"f","c":"f"},"d":{"c":"f","d":"f"}},"c":{"a":{"a":[349],"b":"f","c":[349],"d":[349]},"b":{"a":"f","b":"f","c":[349],"d":[349]},"c":[349],"d":[349]},"d":[349]}},"d":{"a":{"d":{"a":{"a":"f","b":"f","c":"f","d":[292]},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[292],"b":[292],"c":"f","d":[292]}}},"b":{"b":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f"}},"c":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[349],"c":[349],"d":[349]},"d":{"a":"f","b":"f","c":[349],"d":[349]}},"d":{"c":{"b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":[349],"d":[349]},"b":{"a":"f","b":[349],"c":[349],"d":[349]},"c":{"a":"f","b":"f","c":[349],"d":"f"},"d":[349]},"b":{"a":{"a":[349],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f"},"c":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":[349],"d":{"a":[349],"b":{"a":"f","b":[349],"c":[349],"d":[349]},"c":[349],"d":[349]}},"d":{"a":{"a":{"a":[292],"b":"f","c":[292],"d":[292]},"b":{"a":"f","c":"f","d":"f"},"c":{"a":[292],"b":"f","c":"f","d":[292]},"d":[292]},"b":{"a":{"c":"f","d":"f"},"b":{"b":"f","c":"f","d":"f"},"c":[349],"d":{"a":[349],"b":[349],"c":[349],"d":"f"}},"c":{"a":{"a":"f","b":[349],"c":[349],"d":[349]},"b":[349],"c":[349],"d":[349]},"d":{"a":[292],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[349],"d":"f"},"d":{"a":[292],"b":"f","c":"f","d":[292]}}}}},"d":{"a":{"a":{"a":{"c":{"d":"f"},"d":{"c":"f","d":"f"}},"d":{"a":{"a":[251],"b":[251],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"d":{"c":"f","d":"f"}}},"b":{"a":{"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"c":"f"}},"b":{"d":{"d":"f"}},"c":{"d":{"c":"f","d":"f"}},"d":{"a":{"b":"f"},"b":{"a":"f","b":"f"},"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":"f","c":[251],"d":[251]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"c":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f"},"c":{"a":"f","b":"f","c":[251],"d":[251]},"d":{"a":[251],"b":"f","c":[251],"d":[251]}},"d":{"a":{"a":[251],"b":"f","c":[251],"d":[251]},"b":{"a":"f","b":"f","c":"f","d":[251]},"c":[251],"d":[251]}},"d":{"a":{"a":{"a":[251],"b":"f","c":[251],"d":[251]},"b":{"a":"f","b":"f","c":[251],"d":[251]},"c":[251],"d":[251]},"b":{"a":{"a":"f","b":"f","c":"f","d":[251]},"b":{"d":"f"},"c":{"a":"f","b":"f","c":[251],"d":[251]},"d":[251]},"c":[251],"d":[251]}},"b":{"b":{"c":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[349],"d":[349]},"c":{"a":[349],"b":[349],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}}},"c":{"b":{"b":{"b":"f"}},"c":{"d":{"a":"f","b":"f","c":"f","d":[292]}},"d":{"c":{"a":"f","b":"f","c":[292],"d":[292]},"d":{"b":"f","c":"f","d":"f"}}},"d":{"a":{"d":{"d":"f"}},"c":{"c":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[292]}},"d":{"a":{"a":"f"},"c":{"a":"f","b":"f","c":[292],"d":[292]},"d":{"a":"f","b":"f","c":"f","d":[251]}}}},"c":{"a":{"a":{"a":{"a":[251],"b":"f","c":"f","d":"f"},"b":[292],"c":[292],"d":{"a":"f","b":[292],"c":[292],"d":[292]}},"b":[292],"c":[292],"d":[292]},"b":{"a":[292],"b":{"a":{"a":[292],"b":"f","c":[292],"d":[292]},"b":{"a":"f","c":"f","d":"f"},"c":{"a":[292],"b":"f","c":"f","d":[292]},"d":[292]},"c":{"a":[292],"b":{"a":[292],"b":"f","c":[292],"d":[292]},"c":[292],"d":[292]},"d":[292]},"c":[292],"d":[292]},"d":{"a":[251],"b":{"a":[251],"b":{"a":[251],"b":[251],"c":{"a":[251],"b":"f","c":"f","d":"f"},"d":{"a":[251],"b":[251],"c":"f","d":[251]}},"c":{"a":{"a":[251],"b":"f","c":"f","d":[251]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[292],"b":[292],"c":[292],"d":"f"},"d":{"a":[251],"b":"f","c":"f","d":"f"}},"d":[251]},"c":{"a":{"a":[251],"b":[251],"c":{"a":[251],"b":"f","c":"f","d":"f"},"d":[251]},"b":{"a":[251],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[292],"d":[292]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":[292],"d":{"a":[251],"b":{"a":"f","b":[292],"c":[292],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[251]}},"d":[251]}}},"b":{"a":{"c":{"c":{"a":{"c":{"a":"f","b":"f","c":[210],"d":[210]},"d":{"b":"f","c":"f","d":"f"}},"b":{"a":{"d":"f"},"c":{"a":"f","b":"f","c":[210],"d":[210]},"d":{"a":"f","b":"f","c":[210],"d":[210]}},"c":{"a":[210],"b":[210],"c":{"a":[210],"b":[210],"c":"f","d":"f"},"d":{"a":"f","b":[210],"c":"f","d":"f"}},"d":{"a":{"a":[210],"b":[210],"c":"f","d":"f"},"b":[210],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"a":{"c":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"c":{"c":"f","d":"f"},"d":{"d":"f"}},"c":{"a":{"a":"f"},"b":{"a":"f","b":"f","c":"f"},"c":{"a":"f","b":"f","c":[210],"d":[210]},"d":{"a":"f","b":"f","c":[210],"d":"f"}},"d":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":"f"},"c":{"b":"f","c":"f"}}}},"d":{"c":{"b":{"c":{"c":"f","d":"f"}},"c":{"b":{"a":"f","b":"f"}}},"d":{"a":{"d":{"a":"f","b":"f","c":"f","d":"f"}}}}},"b":{"c":{"d":{"d":{"a":{"a":"f","b":"f","c":[210],"d":[210]},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[210],"b":"f","c":"f","d":[210]}}}},"d":{"c":{"a":{"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"b":{"d":{"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[210],"d":[210]},"b":{"a":"f","b":"f","c":[210],"d":[210]},"c":[210],"d":[210]},"d":[210]},"d":{"a":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[210],"d":{"a":"f","b":[210],"c":[210],"d":[210]}},"b":{"a":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[210]},"d":{"a":"f","b":"f","c":[210],"d":[210]}},"c":[210],"d":[210]}}},"c":{"a":{"a":{"a":{"a":[210],"b":[210],"c":{"a":[210],"b":[210],"c":"f","d":[210]},"d":[210]},"b":{"a":[210],"b":[210],"c":[210],"d":{"a":[210],"b":[210],"c":[210],"d":"f"}},"c":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":[210],"c":[210],"d":"f"},"c":{"a":"f","b":"f","c":"f"}},"d":{"a":{"a":[210],"b":[210],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"}}},"b":{"a":[210],"b":{"a":[210],"b":{"a":[210],"b":[210],"c":"f","d":[210]},"c":{"a":"f","b":"f"},"d":{"a":[210],"b":"f","c":"f","d":[210]}},"c":{"a":{"a":"f","b":"f","d":"f"}},"d":{"a":[210],"b":{"a":[210],"b":[210],"c":"f","d":"f"},"c":{"a":"f"},"d":{"a":[210],"b":"f","c":"f","d":"f"}}},"d":{"a":{"c":{"c":"f"}},"b":{"c":{"d":"f"},"d":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f"}},"d":{"b":{"b":"f"}}}},"b":{"a":{"a":{"a":{"a":[210],"b":"f","c":"f","d":"f"},"b":{"a":"f"}}}},"d":{"a":{"c":{"c":{"d":"f"},"d":{"c":"f","d":"f"}},"d":{"a":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[350]},"d":{"a":"f","b":"f","c":[350],"d":[350]}}},"c":{"a":{"a":{"d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[350],"d":[350]}},"b":{"d":{"d":"f"}},"c":{"a":{"a":"f","c":"f","d":"f"},"b":{"d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":[350]},"d":{"a":[350],"b":[350],"c":[350],"d":{"a":"f","b":[350],"c":"f","d":"f"}}},"d":{"a":{"a":[350],"b":[350],"c":{"a":"f","b":[350],"c":"f","d":"f"},"d":{"a":[350],"b":"f","c":"f","d":"f"}},"b":{"a":[350],"b":{"a":"f","b":"f","c":"f","d":[350]},"c":[350],"d":[350]},"c":{"a":{"a":[350],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[350],"c":[350],"d":"f"},"c":{"a":"f","b":"f","c":[363],"d":[363]},"d":[363]},"d":{"a":{"a":"f","b":"f","c":[363],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[363]},"c":[363],"d":[363]}}}},"d":{"b":{"a":{"b":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":"f"}}},"b":{"a":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":"f"},"c":{"a":"f","b":"f","c":"f"}},"b":{"a":{"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[210],"d":"f"},"c":[210],"d":{"a":"f","b":[210],"c":"f","d":"f"}},"c":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[210],"c":"f","d":"f"},"d":{"a":[210],"b":"f","c":"f","d":"f"}},"d":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"}}}},"c":{"a":{"c":{"a":{"c":"f"},"b":{"c":"f","d":"f"},"c":[350],"d":{"a":"f","b":"f","c":[350],"d":[350]}},"d":{"c":{"b":"f","c":"f","d":"f"}}},"b":{"c":{"a":{"c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[350],"d":[350]},"d":{"a":{"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[350],"d":[350]}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[350],"c":"f","d":"f"},"c":{"a":[333],"b":"f","c":"f","d":[333]},"d":[333]},"b":[350],"c":{"a":{"a":"f","b":"f","c":[333],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[333]},"c":{"a":"f","b":"f","c":[363],"d":"f"},"d":[333]},"d":{"a":[333],"b":{"a":[333],"b":"f","c":[333],"d":[333]},"c":[333],"d":[333]}},"d":{"a":{"a":{"a":"f","b":"f","c":[349],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[349]},"c":{"a":[349],"b":"f","c":[349],"d":[349]},"d":[349]},"b":{"a":{"a":[350],"b":[350],"c":"f","d":"f"},"b":{"a":[350],"b":[350],"c":"f","d":"f"},"c":{"a":"f","b":[333],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[349],"d":[349]}},"c":{"a":[349],"b":{"a":[349],"b":"f","c":"f","d":[349]},"c":{"a":"f","b":"f","c":[333],"d":[333]},"d":{"a":[349],"b":"f","c":"f","d":[349]}},"d":[349]}},"d":{"c":{"a":{"c":{"b":"f","c":"f","d":"f"}},"b":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[349],"d":[349]},"d":{"a":"f","b":"f","c":[349],"d":[349]}},"c":[349],"d":{"a":{"a":"f","b":"f","c":[349],"d":"f"},"b":{"a":"f","b":[349],"c":[349],"d":[349]},"c":[349],"d":[349]}},"d":{"c":{"a":{"a":"f","b":"f","c":"f","d":[349]},"b":{"c":"f","d":"f"},"c":[349],"d":[349]},"d":{"a":{"a":"f","b":"f","c":[349],"d":[349]},"b":{"a":"f","b":"f","c":[349],"d":[349]},"c":[349],"d":[349]}}}}},"c":{"a":{"a":[349],"b":{"a":{"a":[349],"b":{"a":{"a":[349],"b":"f","c":[349],"d":[349]},"b":{"a":"f","b":[333],"c":[333],"d":"f"},"c":{"a":"f","b":[333],"c":[333],"d":[333]},"d":{"a":[349],"b":"f","c":"f","d":[349]}},"c":{"a":{"a":[349],"b":"f","c":"f","d":[349]},"b":[333],"c":[333],"d":{"a":[349],"b":"f","c":"f","d":[349]}},"d":[349]},"b":{"a":[333],"b":{"a":{"a":[333],"b":[333],"c":"f","d":[333]},"b":{"a":"f","b":[363],"c":[363],"d":"f"},"c":{"a":"f","b":[363],"c":[363],"d":"f"},"d":{"a":[333],"b":"f","c":"f","d":[333]}},"c":{"a":{"a":[333],"b":"f","c":"f","d":[333]},"b":[363],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[333],"b":"f","c":"f","d":[333]}},"d":[333]},"c":{"a":[333],"b":{"a":[333],"b":{"a":"f","b":"f","c":"f","d":[333]},"c":[333],"d":[333]},"c":[333],"d":[333]},"d":{"a":{"a":[349],"b":[349],"c":{"a":[349],"b":[349],"c":"f","d":[349]},"d":[349]},"b":{"a":{"a":"f","b":"f","c":[333],"d":"f"},"b":[333],"c":[333],"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":[333],"b":[333],"c":[333],"d":{"a":"f","b":[333],"c":"f","d":"f"}},"d":{"a":[349],"b":{"a":[349],"b":"f","c":"f","d":[349]},"c":{"a":[349],"b":"f","c":[349],"d":[349]},"d":[349]}}},"c":{"a":{"a":[349],"b":{"a":{"a":[349],"b":"f","c":"f","d":[349]},"b":{"a":[333],"b":[333],"c":[333],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[349]},"d":[349]},"c":{"a":[349],"b":[349],"c":{"a":[349],"b":"f","c":"f","d":[349]},"d":[349]},"d":[349]},"b":{"a":{"a":[333],"b":[333],"c":[333],"d":{"a":[333],"b":[333],"c":[333],"d":"f"}},"b":[333],"c":{"a":{"a":[333],"b":[333],"c":"f","d":"f"},"b":[333],"c":{"a":"f","b":"f","c":"f","d":[364]},"d":{"a":"f","b":"f","c":[364],"d":[364]}},"d":{"a":{"a":"f","b":"f","c":"f","d":[349]},"b":{"a":"f","b":[333],"c":"f","d":"f"},"c":{"a":"f","b":[364],"c":[364],"d":[364]},"d":{"a":"f","b":"f","c":[364],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[364],"c":{"a":[364],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":[364],"c":"f","d":"f"}},"b":{"a":[364],"b":[364],"c":{"a":[364],"b":[364],"c":"f","d":"f"},"d":{"a":"f","b":[364],"c":"f","d":"f"}},"c":{"a":[354],"b":{"a":"f","b":"f","c":[354],"d":[354]},"c":{"a":[354],"b":[354],"c":"f","d":"f"},"d":{"a":[354],"b":[354],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":[354],"d":"f"},"b":{"a":"f","b":[354],"c":[354],"d":[354]},"c":[354],"d":{"a":"f","b":[354],"c":[354],"d":"f"}}},"d":{"a":[349],"b":[349],"c":{"a":[349],"b":[349],"c":{"a":[349],"b":[349],"c":"f","d":[349]},"d":[349]},"d":[349]}},"d":[349]},"b":{"a":{"a":{"a":[363],"b":[363],"c":[363],"d":{"a":[363],"b":[363],"c":[363],"d":{"a":[363],"b":[363],"c":[363],"d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[350],"c":{"a":"f","b":[350],"c":"f","d":"f"},"d":{"a":[363],"b":"f","c":"f","d":[363]}},"b":{"a":[350],"b":{"a":[350],"b":"f","c":"f","d":[350]},"c":{"a":[350],"b":"f","c":"f","d":[350]},"d":[350]},"c":{"a":[350],"b":[350],"c":[350],"d":{"a":[350],"b":[350],"c":[350],"d":"f"}},"d":{"a":[363],"b":{"a":[363],"b":"f","c":"f","d":[363]},"c":{"a":[363],"b":"f","c":"f","d":[363]},"d":[363]}},"c":{"a":{"a":[363],"b":{"a":[363],"b":"f","c":"f","d":[363]},"c":[363],"d":[363]},"b":{"a":{"a":"f","b":[350],"c":"f","d":"f"},"b":[350],"c":{"a":"f","b":[350],"c":[350],"d":"f"},"d":{"a":[363],"b":"f","c":[363],"d":[363]}},"c":{"a":[363],"b":{"a":"f","b":[350],"c":[350],"d":"f"},"c":{"a":"f","b":[350],"c":[350],"d":"f"},"d":[363]},"d":[363]},"d":{"a":{"a":{"a":"f","b":[363],"c":"f","d":"f"},"b":[363],"c":{"a":[363],"b":[363],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[333]}},"b":[363],"c":{"a":{"a":"f","b":[363],"c":"f","d":"f"},"b":[363],"c":{"a":"f","b":[363],"c":[363],"d":"f"},"d":{"b":"f"}},"d":{"a":[333],"b":{"a":[333],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[333]}}},"b":{"a":{"a":{"d":{"d":"f"}},"d":{"a":{"a":"f","c":"f","d":"f"},"c":{"d":"f"},"d":{"a":[350],"b":"f","c":"f","d":[350]}}},"c":{"d":{"a":{"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[350]}}},"d":{"a":{"a":[350],"b":{"a":"f","b":"f","c":"f","d":[350]},"c":[350],"d":[350]},"b":{"a":{"d":"f"},"c":{"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[350]}},"c":{"a":[350],"b":{"a":"f","b":"f","c":"f","d":[350]},"c":[350],"d":[350]},"d":[350]}},"c":{"a":{"a":[350],"b":[350],"c":[350],"d":{"a":[350],"b":[350],"c":[350],"d":{"a":[350],"b":[350],"c":[350],"d":"f"}}},"b":{"a":{"a":{"a":[350],"b":"f","c":[350],"d":[350]},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[350],"b":[350],"c":"f","d":[350]}},"d":{"a":{"a":[350],"b":"f","c":"f","d":[350]},"d":{"a":[350],"b":"f","c":"f","d":[350]}}},"c":{"a":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[350],"b":[350],"c":[350],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"b":{"a":[350],"b":[350],"c":{"a":[350],"b":"f","c":"f","d":"f"},"d":{"a":[350],"b":[350],"c":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":[329],"c":[329],"d":"f"},"b":{"a":"f","b":"f","c":[329],"d":[329]},"c":[329],"d":{"a":"f","b":[329],"c":[329],"d":"f"}}}},"d":{"a":{"a":{"a":[333],"b":{"a":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[333],"b":[333],"c":"f","d":[333]}},"b":{"b":{"a":"f","b":[363],"c":[363],"d":"f"},"c":{"a":"f","b":[363],"c":[363],"d":"f"},"d":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":[363],"c":[363],"d":"f"},"b":[363],"c":[363],"d":{"a":[363],"b":[363],"c":[363],"d":"f"}},"d":{"a":{"a":[333],"b":"f","c":"f","d":[333]},"b":{"a":"f","b":[346],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"a":"f","b":"f","d":"f"}}},"b":{"a":[363],"b":{"a":{"a":[363],"b":[363],"c":"f","d":[363]},"b":{"a":"f","b":[350],"c":[350],"d":"f"},"c":{"a":"f","b":[350],"c":[350],"d":"f"},"d":{"a":[363],"b":"f","c":[363],"d":[363]}},"c":{"a":[363],"b":{"a":"f","b":[350],"c":"f","d":"f"},"c":{"a":[363],"b":"f","c":"f","d":[363]},"d":[363]},"d":[363]},"c":{"a":[363],"b":{"a":[363],"b":{"a":[363],"b":"f","c":[363],"d":[363]},"c":[363],"d":[363]},"c":{"a":[363],"b":{"a":[363],"b":"f","c":"f","d":[363]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[363]},"d":[363]},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":[364]},"b":{"c":"f"},"c":{"b":"f","c":"f"},"d":{"a":[364],"b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[363],"b":[363],"c":"f","d":"f"},"c":{"b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[363],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}},"d":{"a":{"a":[354],"b":"f","c":"f","d":[354]},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[354],"b":[354],"c":"f","d":"f"}}}}},"c":{"a":{"a":{"a":{"a":{"a":[371],"b":"f","c":[371],"d":[371]},"b":{"a":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":[371],"b":"f","c":"f","d":"f"}},"b":{"b":{"b":"f"},"c":{"c":"f","d":"f"},"d":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[373],"d":"f"},"b":{"a":[373],"b":"f","c":[373],"d":[373]},"c":[373],"d":[373]},"d":{"a":{"a":[337],"b":[337],"c":"f","d":"f"},"b":{"a":[337],"b":[337],"c":"f","d":"f"},"c":[373],"d":[373]}},"b":{"a":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":[363],"b":[363],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f"}},"b":{"a":{"a":[363],"b":"f","c":"f","d":[363]},"b":{"a":"f","b":"f","c":[329],"d":[329]},"c":{"a":"f","b":[329],"c":[329],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[322],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[322],"d":[322]},"d":{"a":{"a":"f","b":"f","c":"f","d":[373]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[373],"b":"f","c":"f","d":[373]},"d":[373]}},"c":{"a":{"a":[373],"b":{"a":[373],"b":"f","c":"f","d":[373]},"c":{"a":[373],"b":"f","c":"f","d":[373]},"d":[373]},"b":[322],"c":{"a":[322],"b":[322],"c":[322],"d":{"a":[322],"b":[322],"c":[322],"d":"f"}},"d":{"a":[373],"b":{"a":[373],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[373],"b":[373],"c":"f","d":"f"}}},"d":[373]},"b":{"a":{"a":{"a":{"a":"f","b":[329],"c":[329],"d":"f"},"b":[329],"c":{"a":[329],"b":[329],"c":"f","d":"f"},"d":{"a":[329],"b":[329],"c":"f","d":[329]}},"b":{"a":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","d":"f"}},"c":{"a":{"a":"f","c":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":[322],"b":"f","c":[322],"d":[322]}},"d":{"a":{"a":"f","b":"f","c":[322],"d":[322]},"b":{"a":"f","b":[322],"c":[322],"d":[322]},"c":[322],"d":[322]}},"b":{"c":{"b":{"c":"f"},"c":{"b":"f","c":"f"}},"d":{"d":{"c":"f","d":"f"}}},"c":{"a":{"a":{"a":[317],"b":"f","c":"f","d":[317]},"c":{"a":"f","d":"f"},"d":{"a":[317],"b":"f","c":[317],"d":[317]}},"b":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":[342],"d":[342]},"c":[342],"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":[342],"b":[342],"c":[342],"d":"f"},"c":{"a":[342],"b":[342],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":[317],"b":[317],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[324]},"d":{"a":"f","b":[324],"c":[324],"d":[324]}}},"d":{"a":[322],"b":{"a":{"a":[322],"b":"f","c":"f","d":[322]},"b":{"a":"f","b":[317],"c":[317],"d":[317]},"c":{"a":"f","b":[317],"c":[317],"d":"f"},"d":{"a":[322],"b":"f","c":"f","d":[322]}},"c":{"a":[322],"b":{"a":"f","b":"f","c":"f","d":[322]},"c":{"a":[322],"b":"f","c":"f","d":[322]},"d":[322]},"d":[322]}},"c":{"a":{"a":[322],"b":{"a":[322],"b":{"a":"f","b":"f","c":"f","d":[322]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[322]},"c":{"a":{"a":"f","b":"f","c":[351],"d":"f"},"b":{"a":"f","b":[351],"c":[351],"d":[351]},"c":[351],"d":{"a":"f","b":"f","c":"f","d":[322]}},"d":[322]},"b":{"a":{"a":{"a":[324],"b":[324],"c":"f","d":[324]},"b":{"a":"f","b":"f","c":[351],"d":"f"},"c":[351],"d":{"a":"f","b":"f","c":[351],"d":"f"}},"b":{"a":[351],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[351],"b":"f","c":[351],"d":[351]},"d":[351]},"c":[351],"d":[351]},"c":[351],"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[376],"d":"f"},"c":{"a":"f","b":[376],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[355]}},"b":{"a":{"a":"f","b":"f","c":"f","d":[376]},"b":{"a":"f","b":[351],"c":[351],"d":"f"},"c":{"a":"f","b":[351],"c":"f","d":"f"},"d":{"a":[376],"b":[376],"c":[376],"d":"f"}},"c":{"a":{"a":"f","b":[376],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[351],"d":"f"},"c":{"a":"f","b":[351],"c":[351],"d":"f"},"d":{"a":[355],"b":"f","c":"f","d":[355]}},"d":{"a":{"a":[355],"b":"f","c":[355],"d":[355]},"b":{"a":"f","b":"f","c":"f","d":[355]},"c":[355],"d":[355]}}},"d":{"a":{"a":{"a":[373],"b":[373],"c":{"a":[373],"b":[373],"c":"f","d":"f"},"d":{"a":[373],"b":[373],"c":"f","d":"f"}},"b":{"a":{"a":[373],"b":[373],"c":"f","d":[373]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[353],"b":[353],"c":[353],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":[323],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[323],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":[323],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":[323],"c":"f","d":"f"},"b":{"a":[323],"b":"f","c":[323],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[326]},"d":{"a":"f","b":"f","c":[326],"d":[326]}}},"b":{"a":{"a":{"a":"f","b":"f","c":[353],"d":"f"},"b":[353],"c":[353],"d":[353]},"b":{"a":{"a":"f","b":"f","c":[353],"d":[353]},"b":{"a":"f","b":[322],"c":[322],"d":"f"},"c":{"a":"f","b":[322],"c":[322],"d":"f"},"d":{"a":[353],"b":[353],"c":"f","d":[353]}},"c":{"a":{"a":"f","b":"f","c":[322],"d":"f"},"b":[322],"c":[322],"d":{"a":"f","b":"f","c":"f","d":[370]}},"d":{"a":{"a":[353],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[353],"c":"f","d":"f"},"c":[370],"d":{"a":"f","b":[370],"c":[370],"d":[370]}}},"c":{"a":{"a":{"a":"f","b":[370],"c":[370],"d":"f"},"b":[370],"c":{"a":[370],"b":[370],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":[370],"b":"f","c":[370],"d":[370]},"b":{"a":"f","b":"f","c":"f","d":[370]},"c":{"a":"f","b":"f","c":[355],"d":"f"},"d":{"a":[370],"b":[370],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":[355],"c":[355],"d":"f"},"b":[355],"c":[355],"d":{"a":"f","b":"f","c":"f","d":[374]}},"d":{"a":{"a":"f","b":"f","c":"f","d":[374]},"b":{"a":[341],"b":"f","c":[341],"d":"f"},"c":{"a":"f","b":"f","c":[374],"d":[374]},"d":{"a":[374],"b":[374],"c":"f","d":"f"}}},"d":{"a":{"a":{"a":"f","b":[326],"c":"f","d":"f"},"b":[326],"c":[326],"d":{"a":[325],"b":"f","c":"f","d":[325]}},"b":{"a":{"a":[326],"b":"f","c":[326],"d":[326]},"b":{"a":"f","b":"f","c":[326],"d":[326]},"c":[326],"d":[326]},"c":{"a":{"a":"f","b":[326],"c":"f","d":"f"},"b":{"a":[326],"b":"f","c":"f","d":"f"},"c":{"a":[374],"b":[374],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":[325],"b":"f","c":[325],"d":[325]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[321],"c":[321],"d":"f"},"d":{"a":[325],"b":[325],"c":"f","d":[325]}}}}},"d":{"a":{"a":[349],"b":[349],"c":{"a":[349],"b":{"a":[349],"b":[349],"c":{"a":[349],"b":[349],"c":"f","d":[349]},"d":[349]},"c":{"a":[349],"b":{"a":[349],"b":"f","c":"f","d":[349]},"c":{"a":"f","b":"f","c":[338],"d":[338]},"d":{"a":[349],"b":"f","c":"f","d":[349]}},"d":[349]},"d":{"a":{"a":[349],"b":[349],"c":{"a":"f","b":[349],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":[349],"c":{"a":[349],"b":[349],"c":[349],"d":{"a":"f","b":[349],"c":"f","d":"f"}},"d":{"a":[359],"b":{"a":[359],"b":"f","c":"f","d":[359]},"c":{"a":"f","b":"f","c":[372],"d":[372]},"d":{"a":"f","b":"f","c":[372],"d":[372]}}}},"b":{"a":{"a":{"a":[349],"b":{"a":[349],"b":[349],"c":"f","d":[349]},"c":{"a":[349],"b":"f","c":"f","d":[349]},"d":[349]},"b":{"a":{"a":[349],"b":[349],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[347],"d":"f"},"c":[347],"d":{"a":"f","b":[347],"c":[347],"d":"f"}},"c":{"a":{"a":"f","b":[347],"c":[347],"d":[347]},"b":[347],"c":[347],"d":[347]},"d":{"a":[349],"b":{"a":[349],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[347],"d":"f"},"d":{"a":[349],"b":[349],"c":"f","d":[349]}}},"b":{"a":{"a":{"a":"f","b":[354],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[371],"d":"f"},"c":{"a":"f","b":[371],"c":"f","d":"f"},"d":{"a":[347],"b":"f","c":[347],"d":[347]}},"b":{"a":{"a":"f","b":"f","c":[371],"d":[371]},"b":[371],"c":{"a":[371],"b":[371],"c":"f","d":[371]},"d":[371]},"c":{"a":{"a":[371],"b":[371],"c":[371],"d":"f"},"b":{"a":[371],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[373],"c":[373],"d":"f"},"d":{"a":"f","b":"f","c":[347],"d":[347]}},"d":{"a":[347],"b":{"a":[347],"b":"f","c":"f","d":[347]},"c":{"a":[347],"b":"f","c":[347],"d":[347]},"d":[347]}},"c":{"a":[347],"b":{"a":{"a":[347],"b":"f","c":"f","d":[347]},"b":{"a":"f","b":[373],"c":[373],"d":"f"},"c":{"a":"f","b":[373],"c":"f","d":"f"},"d":{"a":[347],"b":"f","c":[347],"d":[347]}},"c":{"a":{"a":"f","b":"f","c":"f","d":[338]},"b":{"a":"f","b":[373],"c":[373],"d":"f"},"c":{"a":"f","b":[373],"c":[373],"d":[373]},"d":{"a":[338],"b":"f","c":"f","d":[338]}},"d":{"a":{"a":[347],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[338],"d":[338]},"c":[338],"d":[338]}},"d":{"a":{"a":{"a":[349],"b":"f","c":[349],"d":[349]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[349],"b":[349],"c":"f","d":"f"}},"b":{"a":[347],"b":[347],"c":[347],"d":{"a":[347],"b":[347],"c":[347],"d":"f"}},"c":{"a":{"a":"f","b":[347],"c":"f","d":"f"},"b":{"a":[347],"b":"f","c":"f","d":"f"},"c":[338],"d":{"a":"f","b":[338],"c":[338],"d":[338]}},"d":{"a":[338],"b":{"a":[338],"b":"f","c":[338],"d":[338]},"c":[338],"d":[338]}}},"c":{"a":{"a":[338],"b":[338],"c":{"a":[338],"b":[338],"c":{"a":[338],"b":"f","c":"f","d":"f"},"d":[338]},"d":[338]},"b":{"a":[338],"b":{"a":{"a":[338],"b":"f","c":[338],"d":[338]},"b":{"a":"f","b":[373],"c":"f","d":"f"},"c":{"a":[338],"b":"f","c":"f","d":[338]},"d":[338]},"c":{"a":{"a":[338],"b":[338],"c":"f","d":[338]},"b":{"a":[338],"b":"f","c":"f","d":"f"},"c":{"a":[367],"b":"f","c":"f","d":"f"},"d":{"a":[338],"b":"f","c":"f","d":"f"}},"d":{"a":[338],"b":[338],"c":{"a":"f","b":[338],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[328]}}},"c":{"a":{"a":{"a":"f","b":"f","c":[325],"d":"f"},"b":[325],"c":[325],"d":{"a":"f","b":[325],"c":[325],"d":[325]}},"b":{"a":{"a":"f","b":[325],"c":[325],"d":[325]},"b":{"a":[325],"b":"f","c":[325],"d":[325]},"c":[325],"d":[325]},"c":[325],"d":{"a":{"a":"f","b":[325],"c":[325],"d":"f"},"b":[325],"c":[325],"d":{"a":"f","b":[325],"c":[325],"d":[325]}}},"d":{"a":{"a":[338],"b":[338],"c":{"a":[338],"b":[338],"c":"f","d":[338]},"d":[338]},"b":{"a":{"a":[338],"b":[338],"c":"f","d":[338]},"b":{"a":"f","b":[328],"c":[328],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[338],"b":"f","c":"f","d":[338]}},"c":{"a":{"a":"f","b":"f","c":[338],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":[338],"c":"f","d":"f"},"b":{"a":[338],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[360],"b":"f","c":"f","d":"f"}}}},"d":{"a":{"a":[372],"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[349],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":[349],"c":[349],"d":"f"}},"c":{"a":{"a":"f","b":[349],"c":[349],"d":[349]},"b":{"a":"f","b":"f","c":"f","d":[349]},"c":{"a":[349],"b":"f","c":"f","d":[349]},"d":{"a":"f","b":[349],"c":[349],"d":"f"}},"d":{"a":[372],"b":{"a":[372],"b":"f","c":"f","d":[372]},"c":{"a":[372],"b":"f","c":"f","d":[372]},"d":{"a":"f","b":[372],"c":"f","d":"f"}}},"b":{"a":{"a":{"a":[349],"b":[349],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[338],"d":{"a":"f","b":"f","c":[338],"d":[338]}},"b":{"a":{"a":"f","b":"f","c":[338],"d":"f"},"b":[338],"c":[338],"d":[338]},"c":{"a":[338],"b":[338],"c":{"a":[338],"b":[338],"c":[338],"d":"f"},"d":{"a":[338],"b":[338],"c":"f","d":"f"}},"d":{"a":[338],"b":[338],"c":{"a":[338],"b":[338],"c":"f","d":[338]},"d":{"a":[338],"b":[338],"c":[338],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":[349]},"b":{"a":[338],"b":"f","c":"f","d":[338]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[349],"b":"f","c":[349],"d":[349]}},"b":{"a":[375],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[338],"c":[338],"d":"f"},"d":{"a":[375],"b":[375],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[360],"d":{"a":"f","b":"f","c":[360],"d":"f"}},"d":{"a":[349],"b":{"a":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[349]},"d":[349]}},"d":{"a":{"a":{"a":[349],"b":"f","c":"f","d":[349]},"b":{"a":"f","b":"f","c":[349],"d":"f"},"c":[349],"d":[349]},"b":[349],"c":[349],"d":[349]}}}},"d":{"a":{"a":{"a":{"a":[251],"b":[251],"c":{"a":[251],"b":{"a":[251],"b":[251],"c":"f","d":[251]},"c":{"a":[251],"b":"f","c":"f","d":"f"},"d":{"a":[251],"b":[251],"c":"f","d":[251]}},"d":[251]},"b":{"a":{"a":{"a":[251],"b":[251],"c":"f","d":[251]},"b":{"a":"f","b":"f","c":[292],"d":"f"},"c":[292],"d":{"a":[251],"b":"f","c":"f","d":[251]}},"b":[292],"c":[292],"d":{"a":{"a":"f","b":"f","c":[292],"d":"f"},"b":[292],"c":[292],"d":{"a":"f","b":[292],"c":[292],"d":"f"}}},"c":[292],"d":{"a":[251],"b":{"a":{"a":[251],"b":"f","c":"f","d":[251]},"b":{"a":[292],"b":[292],"c":[292],"d":"f"},"c":{"a":"f","b":[292],"c":"f","d":"f"},"d":[251]},"c":{"a":[251],"b":{"a":"f","b":[292],"c":"f","d":"f"},"c":{"a":[251],"b":"f","c":"f","d":[251]},"d":[251]},"d":[251]}},"b":[292],"c":{"a":{"a":{"a":[292],"b":[292],"c":{"a":"f","b":[292],"c":[292],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":[292],"c":{"a":[292],"b":[292],"c":[292],"d":{"a":[292],"b":[292],"c":[292],"d":"f"}},"d":{"a":[284],"b":{"a":"f","b":[292],"c":[292],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[284]},"d":[284]}},"b":[292],"c":{"a":{"a":[292],"b":{"a":[292],"b":[292],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[263]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":[292],"c":[292],"d":{"a":[263],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[263]}},"d":{"a":[284],"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[292],"c":{"a":"f","b":"f","c":[263],"d":[263]},"d":{"a":"f","b":"f","c":[263],"d":"f"}},"c":{"a":{"a":"f","b":[263],"c":[263],"d":[263]},"b":[263],"c":[263],"d":{"a":[263],"b":[263],"c":[263],"d":"f"}},"d":{"a":{"a":[284],"b":[284],"c":"f","d":"f"},"b":{"a":[284],"b":"f","c":"f","d":"f"},"c":{"a":[262],"b":"f","c":"f","d":[262]},"d":[262]}}},"d":{"a":{"a":[251],"b":{"a":{"a":[251],"b":"f","c":"f","d":[251]},"b":{"a":"f","b":"f","c":[292],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[251]},"d":[251]},"c":{"a":{"a":[251],"b":[251],"c":"f","d":"f"},"b":{"a":[251],"b":"f","c":"f","d":"f"},"c":[284],"d":{"a":"f","b":[284],"c":[284],"d":[284]}},"d":{"a":[251],"b":[251],"c":{"a":[251],"b":"f","c":"f","d":"f"},"d":{"a":[251],"b":[251],"c":"f","d":[251]}}},"b":{"a":{"a":[292],"b":[292],"c":{"a":"f","b":[292],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[284],"d":"f"}},"b":{"a":[292],"b":[292],"c":{"a":[292],"b":"f","c":"f","d":"f"},"d":{"a":[292],"b":[292],"c":"f","d":"f"}},"c":[284],"d":[284]},"c":{"a":[284],"b":[284],"c":{"a":[284],"b":{"a":[284],"b":[284],"c":"f","d":[284]},"c":{"a":"f","b":"f","c":[262],"d":"f"},"d":{"a":[284],"b":[284],"c":"f","d":"f"}},"d":{"a":[284],"b":[284],"c":{"a":[284],"b":[284],"c":"f","d":"f"},"d":{"a":[284],"b":[284],"c":"f","d":[284]}}},"d":{"a":{"a":{"a":[251],"b":"f","c":[251],"d":[251]},"b":{"a":"f","b":[284],"c":[284],"d":"f"},"c":{"a":"f","b":[284],"c":[284],"d":[284]},"d":{"a":[251],"b":"f","c":"f","d":"f"}},"b":[284],"c":{"a":[284],"b":[284],"c":{"a":[284],"b":[284],"c":[284],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":[251]},"b":{"a":[284],"b":[284],"c":[284],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[251],"b":"f","c":"f","d":[251]}}}}},"b":{"a":{"a":{"a":{"a":[292],"b":{"a":"f","b":"f","c":"f","d":[292]},"c":[292],"d":[292]},"b":{"a":{"a":[349],"b":[349],"c":[349],"d":"f"},"b":[349],"c":{"a":[349],"b":[349],"c":[349],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[292]}},"c":{"a":[292],"b":{"a":"f","b":"f","c":"f","d":[292]},"c":[292],"d":[292]},"d":[292]},"b":{"a":[349],"b":[349],"c":[349],"d":{"a":{"a":[349],"b":[349],"c":[349],"d":"f"},"b":[349],"c":{"a":"f","b":[349],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[292]}}},"c":{"a":{"a":[292],"b":{"a":[292],"b":"f","c":"f","d":"f"},"c":{"a":[292],"b":"f","c":"f","d":[292]},"d":[292]},"b":[349],"c":[349],"d":{"a":[292],"b":{"a":[292],"b":"f","c":"f","d":[292]},"c":{"a":[292],"b":"f","c":"f","d":[292]},"d":[292]}},"d":[292]},"b":[349],"c":{"a":{"a":{"a":{"a":[349],"b":[349],"c":[349],"d":"f"},"b":[349],"c":{"a":"f","b":"f","c":[292],"d":[292]},"d":{"a":"f","b":"f","c":[292],"d":[292]}},"b":{"a":[349],"b":[349],"c":{"a":"f","b":[349],"c":[349],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[292]}},"c":{"a":{"a":"f","b":"f","c":[339],"d":[339]},"b":{"a":"f","b":[349],"c":"f","d":"f"},"c":[339],"d":{"a":"f","b":[339],"c":[339],"d":"f"}},"d":{"a":[292],"b":{"a":[292],"b":"f","c":"f","d":[292]},"c":{"a":[292],"b":"f","c":"f","d":[292]},"d":[292]}},"b":{"a":{"a":[349],"b":[349],"c":{"a":[349],"b":"f","c":"f","d":"f"},"d":[349]},"b":{"a":[349],"b":[349],"c":[349],"d":{"a":"f","b":"f","c":"f","d":[339]}},"c":{"a":{"a":[339],"b":"f","c":"f","d":[339]},"b":{"a":"f","b":[349],"c":[349],"d":"f"},"c":[349],"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":[349],"b":[349],"c":[349],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[339],"d":[339]},"d":{"a":"f","b":"f","c":"f","d":[339]}}},"c":{"a":[339],"b":{"a":{"a":"f","b":"f","c":"f","d":[339]},"b":{"a":[349],"b":[349],"c":[349],"d":"f"},"c":{"a":"f","b":[349],"c":[349],"d":[349]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[349],"c":[349],"d":{"a":"f","b":"f","c":[349],"d":[349]}},"d":{"a":{"a":[339],"b":[339],"c":"f","d":[339]},"b":{"a":"f","b":[339],"c":"f","d":"f"},"c":[349],"d":{"a":"f","b":"f","c":[349],"d":"f"}}},"d":{"a":{"a":[292],"b":{"a":[292],"b":"f","c":"f","d":[292]},"c":{"a":[292],"b":"f","c":"f","d":"f"},"d":[292]},"b":{"a":{"a":[339],"b":[339],"c":"f","d":"f"},"b":{"a":[339],"b":[339],"c":[339],"d":"f"},"c":{"a":"f","b":[339],"c":[339],"d":"f"},"d":[356]},"c":{"a":[356],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[356],"b":[356],"c":"f","d":"f"}},"d":{"a":[292],"b":{"a":"f","b":"f","c":[356],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[292]}}},"d":{"a":[292],"b":{"a":{"a":[292],"b":{"a":[292],"b":"f","c":[292],"d":[292]},"c":[292],"d":[292]},"b":{"a":{"a":"f","b":[349],"c":"f","d":"f"},"b":{"a":[349],"b":"f","c":"f","d":"f"},"c":[292],"d":[292]},"c":[292],"d":[292]},"c":[292],"d":[292]}},"c":{"a":{"a":{"a":{"a":[292],"b":[292],"c":[292],"d":{"a":[292],"b":[292],"c":[292],"d":"f"}},"b":[292],"c":{"a":{"a":[292],"b":[292],"c":"f","d":"f"},"b":{"a":[292],"b":[292],"c":[292],"d":"f"},"c":{"a":"f","b":"f","c":[269],"d":[269]},"d":[269]},"d":{"a":{"a":"f","b":"f","c":"f","d":[212]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[269],"c":[269],"d":[269]},"d":{"a":[212],"b":"f","c":"f","d":[212]}}},"b":{"a":{"a":[292],"b":[292],"c":{"a":[292],"b":[292],"c":"f","d":[292]},"d":[292]},"b":[292],"c":[292],"d":{"a":[292],"b":[292],"c":[292],"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[292],"c":{"a":[292],"b":[292],"c":[292],"d":"f"},"d":{"a":[269],"b":"f","c":"f","d":[269]}},"b":[292],"c":{"a":[292],"b":[292],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":[269],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[292],"c":[292],"d":"f"},"c":{"a":[292],"b":[292],"c":"f","d":"f"},"d":{"a":"f","b":[292],"c":"f","d":"f"}}},"d":{"a":{"a":{"a":[212],"b":"f","c":"f","d":[212]},"b":{"a":[269],"b":[269],"c":[269],"d":"f"},"c":{"a":"f","b":[269],"c":[269],"d":"f"},"d":[212]},"b":{"a":[269],"b":{"a":[269],"b":"f","c":"f","d":[269]},"c":[269],"d":[269]},"c":{"a":[269],"b":[269],"c":{"a":[269],"b":"f","c":"f","d":[269]},"d":[269]},"d":{"a":[212],"b":{"a":"f","b":"f","c":[269],"d":"f"},"c":{"a":"f","b":"f","c":[269],"d":"f"},"d":{"a":[212],"b":[212],"c":"f","d":"f"}}}},"b":{"a":{"a":{"a":[292],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[292],"b":"f","c":"f","d":[292]},"d":[292]},"b":{"a":{"a":"f","b":"f","c":[349],"d":"f"},"b":{"a":"f","b":"f","c":[349],"d":"f"},"c":[349],"d":{"a":"f","b":[349],"c":[349],"d":"f"}},"c":{"a":{"a":"f","b":[349],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[356],"d":{"a":"f","b":"f","c":"f","d":[292]}},"d":{"a":[292],"b":{"a":[292],"b":"f","c":"f","d":[292]},"c":{"a":[292],"b":"f","c":[292],"d":[292]},"d":[292]}},"b":{"a":{"a":[349],"b":[349],"c":{"a":[349],"b":[349],"c":[349],"d":"f"},"d":{"a":[349],"b":[349],"c":"f","d":[349]}},"b":[349],"c":{"a":{"a":"f","b":"f","c":"f","d":[366]},"b":{"a":"f","b":[349],"c":[349],"d":"f"},"c":{"a":"f","b":[349],"c":[349],"d":"f"},"d":{"a":[366],"b":[366],"c":"f","d":[366]}},"d":{"a":{"a":"f","b":"f","c":[366],"d":"f"},"b":{"a":"f","b":"f","c":[366],"d":[366]},"c":{"a":"f","b":[366],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[356],"d":[356]}}},"c":{"a":{"a":[356],"b":{"a":[356],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[359],"d":[359]},"d":{"a":[356],"b":"f","c":"f","d":"f"}},"b":{"a":{"a":[366],"b":"f","c":"f","d":"f"},"b":[349],"c":{"a":"f","b":"f","c":"f","d":[359]},"d":{"a":"f","b":"f","c":[359],"d":[359]}},"c":{"a":[359],"b":[359],"c":{"a":[359],"b":"f","c":"f","d":"f"},"d":{"a":[359],"b":[359],"c":"f","d":[359]}},"d":{"a":{"a":"f","b":[359],"c":[359],"d":"f"},"b":[359],"c":{"a":[359],"b":[359],"c":[359],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[264]}}},"d":{"a":[292],"b":{"a":{"a":[292],"b":"f","c":"f","d":[292]},"b":{"a":[356],"b":[356],"c":[356],"d":"f"},"c":{"a":"f","b":[356],"c":"f","d":"f"},"d":[292]},"c":{"a":{"a":[292],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[264],"d":[264]},"d":{"a":[292],"b":{"a":[292],"b":[292],"c":"f","d":[292]},"c":{"a":"f","b":"f","c":[264],"d":"f"},"d":{"a":[292],"b":"f","c":"f","d":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","b":"f","c":[216],"d":[216]},"b":{"a":"f","b":[264],"c":[264],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[216]},"d":[216]},"b":[264],"c":{"a":{"a":"f","b":"f","c":"f","d":[218]},"b":{"a":[264],"b":[264],"c":"f","d":"f"},"c":{"a":[218],"b":"f","c":[218],"d":[218]},"d":{"a":[218],"b":"f","c":[218],"d":[218]}},"d":{"a":{"a":[216],"b":[216],"c":"f","d":[216]},"b":{"a":[216],"b":"f","c":"f","d":"f"},"c":[218],"d":{"a":[216],"b":"f","c":"f","d":[216]}}},"b":{"a":{"a":[264],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[264],"d":[264]},"d":[264]},"b":{"a":{"a":"f","b":"f","c":[372],"d":"f"},"b":{"a":"f","b":"f","c":[372],"d":[372]},"c":[372],"d":{"a":"f","b":"f","c":"f","d":[264]}},"c":{"a":{"a":[264],"b":"f","c":"f","d":[264]},"b":{"a":[372],"b":[372],"c":"f","d":"f"},"c":{"a":[319],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[264],"b":[264],"c":{"a":[264],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":[264],"c":"f","d":"f"}}},"c":{"a":{"a":[218],"b":{"a":[218],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[319],"c":"f","d":"f"},"d":{"a":[218],"b":[218],"c":[218],"d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":[319]},"b":{"a":"f","b":[349],"c":[349],"d":"f"},"c":[349],"d":{"a":[319],"b":"f","c":"f","d":[319]}},"c":{"a":{"a":[319],"b":"f","c":"f","d":[319]},"b":{"a":"f","b":[349],"c":[349],"d":"f"},"c":[349],"d":{"a":"f","b":"f","c":[349],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":[319],"c":[319],"d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"c":"f","d":"f"}}},"d":{"a":{"a":{"a":[216],"b":"f","c":"f","d":[216]},"b":[218],"c":[218],"d":{"a":[216],"b":"f","c":"f","d":"f"}},"b":{"a":[218],"b":[218],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[218],"b":[218],"c":"f","d":"f"}},"c":{"a":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[215]},"d":{"a":[215],"b":"f","c":[215],"d":[215]}},"d":{"a":{"a":"f","b":"f","c":[215],"d":[215]},"b":{"a":"f","b":"f","c":"f","d":[215]},"c":[215],"d":{"a":[215],"b":[215],"c":[215],"d":"f"}}}},"d":{"a":{"a":{"a":{"a":"f","b":"f","c":[269],"d":"f"},"b":[269],"c":[269],"d":{"a":"f","b":[269],"c":"f","d":"f"}},"b":{"a":[269],"b":{"a":"f","b":"f","c":[216],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[269]},"d":[269]},"c":{"a":{"a":[269],"b":[269],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[216],"d":"f"},"c":{"a":[216],"b":[216],"c":"f","d":[216]},"d":{"a":"f","b":"f","c":[216],"d":"f"}},"d":{"a":{"a":[212],"b":"f","c":[212],"d":[212]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[212],"d":[212]}},"b":{"a":{"a":[216],"b":{"a":"f","b":"f","c":[216],"d":[216]},"c":[216],"d":[216]},"b":[216],"c":[216],"d":{"a":[216],"b":[216],"c":[216],"d":{"a":[216],"b":[216],"c":[216],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":[270]},"b":[216],"c":{"a":"f","b":[216],"c":"f","d":"f"},"d":{"a":[270],"b":"f","c":[270],"d":[270]}},"b":{"a":[216],"b":[216],"c":{"a":[216],"b":[216],"c":"f","d":[216]},"d":[216]},"c":{"a":{"a":[216],"b":[216],"c":[216],"d":"f"},"b":{"a":[216],"b":"f","c":"f","d":[216]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[272],"d":"f"}},"d":{"a":[270],"b":{"a":[270],"b":"f","c":"f","d":[270]},"c":{"a":[270],"b":"f","c":"f","d":"f"},"d":[270]}},"d":{"a":{"a":[212],"b":[212],"c":{"a":[212],"b":[212],"c":"f","d":[212]},"d":[212]},"b":{"a":{"a":"f","b":"f","c":"f","d":[212]},"b":{"a":[216],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[270],"c":[270],"d":[270]},"d":{"a":"f","b":"f","c":[270],"d":"f"}},"c":[270],"d":{"a":{"a":"f","b":"f","c":[270],"d":"f"},"b":{"a":"f","b":"f","c":[270],"d":[270]},"c":[270],"d":{"a":"f","b":[270],"c":[270],"d":"f"}}}}},"d":{"a":{"a":{"a":{"a":{"a":[251],"b":"f","c":"f","d":"f"},"b":[261],"c":{"a":"f","b":[261],"c":[261],"d":"f"},"d":{"a":[251],"b":"f","c":"f","d":[251]}},"b":{"a":[261],"b":{"a":"f","b":"f","c":"f","d":[261]},"c":{"a":[261],"b":"f","c":"f","d":"f"},"d":[261]},"c":{"a":[261],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[223],"d":[223]},"d":{"a":[261],"b":"f","c":"f","d":"f"}},"d":{"a":{"a":[251],"b":"f","c":"f","d":[251]},"b":{"a":"f","b":[261],"c":[261],"d":"f"},"c":[261],"d":{"a":[251],"b":"f","c":"f","d":[251]}}},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[262],"b":"f","c":[262],"d":[262]},"c":[262],"d":[262]},"b":[262],"c":{"a":{"a":[262],"b":[262],"c":"f","d":"f"},"b":[262],"c":{"a":"f","b":[262],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[223],"d":[223]}},"d":{"a":{"a":[262],"b":[262],"c":[262],"d":"f"},"b":[262],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[223],"d":[223]}}},"c":{"a":[223],"b":{"a":[223],"b":[223],"c":{"a":[223],"b":"f","c":"f","d":[223]},"d":[223]},"c":{"a":[223],"b":{"a":[223],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[212],"c":[212],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[223],"b":[223],"c":{"a":[223],"b":[223],"c":"f","d":"f"},"d":{"a":[223],"b":"f","c":"f","d":"f"}}},"d":{"a":{"a":{"a":[251],"b":"f","c":"f","d":[251]},"b":[261],"c":{"a":"f","b":"f","c":[223],"d":"f"},"d":{"a":[251],"b":"f","c":"f","d":[251]}},"b":{"a":{"a":"f","b":[223],"c":[223],"d":"f"},"b":[223],"c":[223],"d":{"a":"f","b":[223],"c":[223],"d":[223]}},"c":[223],"d":{"a":{"a":[251],"b":[251],"c":"f","d":[251]},"b":{"a":"f","b":"f","c":[223],"d":"f"},"c":{"a":"f","b":[223],"c":[223],"d":[223]},"d":{"a":[251],"b":"f","c":"f","d":"f"}}}},"b":{"a":{"a":{"a":[262],"b":{"a":[262],"b":"f","c":[262],"d":[262]},"c":[262],"d":[262]},"b":{"a":{"a":"f","b":[263],"c":"f","d":"f"},"b":[263],"c":[263],"d":{"a":"f","b":"f","c":[263],"d":"f"}},"c":{"a":{"a":"f","b":[263],"c":[263],"d":"f"},"b":[263],"c":{"a":[263],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[212]}},"d":{"a":[262],"b":{"a":[262],"b":[262],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[212],"d":"f"},"d":{"a":[262],"b":[262],"c":"f","d":"f"}}},"b":{"a":{"a":[263],"b":{"a":[263],"b":"f","c":"f","d":[263]},"c":{"a":[263],"b":"f","c":"f","d":"f"},"d":[263]},"b":{"a":[292],"b":[292],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[212],"d":"f"}},"c":[212],"d":{"a":{"a":[263],"b":[263],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[212],"c":[212],"d":[212]},"d":{"a":"f","b":"f","c":[212],"d":[212]}}},"c":[212],"d":{"a":{"a":{"a":"f","b":"f","c":[212],"d":"f"},"b":[212],"c":[212],"d":{"a":"f","b":[212],"c":[212],"d":[212]}},"b":{"a":[212],"b":{"a":[212],"b":"f","c":[212],"d":[212]},"c":[212],"d":[212]},"c":[212],"d":[212]}},"c":{"a":[212],"b":{"a":[212],"b":{"a":[212],"b":{"a":[212],"b":"f","c":"f","d":[212]},"c":[212],"d":[212]},"c":[212],"d":[212]},"c":{"a":[212],"b":[212],"c":{"a":[212],"b":[212],"c":{"a":[212],"b":[212],"c":"f","d":[212]},"d":[212]},"d":[212]},"d":[212]},"d":{"a":{"a":{"a":{"a":"f","b":[223],"c":[223],"d":"f"},"b":[223],"c":{"a":[223],"b":[223],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[240]}},"b":{"a":[223],"b":{"a":[223],"b":[223],"c":"f","d":[223]},"c":{"a":"f","b":"f","c":[212],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[212],"c":[212],"d":"f"},"b":[212],"c":{"a":"f","b":[212],"c":[212],"d":"f"},"d":{"a":"f","b":"f","c":[275,286],"d":[275,286]}},"d":{"a":[240],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[275,286],"c":[275,286],"d":[275,286]},"d":{"a":[240],"b":"f","c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":[212],"c":[212],"d":"f"},"b":[212],"c":[212],"d":[212]},"b":[212],"c":[212],"d":[212]},"c":{"a":{"a":{"a":[212],"b":[212],"c":"f","d":[212]},"b":[212],"c":{"a":"f","b":[212],"c":[212],"d":"f"},"d":{"a":"f","b":"f","c":[275,286],"d":[275,286]}},"b":[212],"c":{"a":[212],"b":[212],"c":{"a":[212],"b":[212],"c":[212],"d":"f"},"d":{"a":[212],"b":[212],"c":"f","d":"f"}},"d":{"a":[286,275],"b":{"a":"f","b":[212],"c":[212],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[286,275]}},"d":{"a":[275,286],"b":{"a":[286,275],"b":{"a":"f","b":[212],"c":[212],"d":"f"},"c":{"a":"f","b":"f","c":[275,286],"d":[275,286]},"d":[286,275]},"c":[275,286],"d":[275,286]}}}}},"c":{"a":{"a":{"a":{"a":[286,275],"b":{"a":[275,286],"b":{"a":{"a":[275,286],"b":"f","c":"f","d":[275,286]},"b":{"a":"f","b":[212],"c":[212],"d":[212]},"c":[212],"d":{"a":[275,286],"b":"f","c":"f","d":[275,286]}},"c":{"a":{"a":[275,286],"b":"f","c":"f","d":[275,286]},"b":[212],"c":{"a":[212],"b":"f","c":"f","d":"f"},"d":{"a":[275,286],"b":"f","c":"f","d":[275,286]}},"d":[275,286]},"c":{"a":[275,286],"b":{"a":{"a":[275,286],"b":"f","c":[275,286],"d":[275,286]},"b":{"a":"f","b":"f","c":"f","d":[275,286]},"c":[286,275],"d":[286,275]},"c":[275,286],"d":[275,286]},"d":[286,275]},"b":{"a":{"a":[212],"b":[212],"c":{"a":{"a":[212],"b":[212],"c":"f","d":"f"},"b":{"a":"f","b":[212],"c":"f","d":"f"},"c":{"a":[225],"b":"f","c":"f","d":[225]},"d":{"a":"f","b":"f","c":[225],"d":[225]}},"d":{"a":{"a":[212],"b":[212],"c":"f","d":"f"},"b":{"a":[212],"b":[212],"c":"f","d":"f"},"c":{"a":[225],"b":"f","c":[225],"d":[225]},"d":{"a":"f","b":"f","c":[225],"d":[225]}}},"b":{"a":[212],"b":{"a":[212],"b":{"a":[212],"b":"f","c":"f","d":[212]},"c":{"a":[212],"b":"f","c":"f","d":[212]},"d":[212]},"c":{"a":[212],"b":{"a":[212],"b":"f","c":"f","d":[212]},"c":[212],"d":[212]},"d":{"a":[212],"b":[212],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[225],"d":"f"}}},"c":{"a":{"a":{"a":[225],"b":[225],"c":"f","d":[225]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[225],"b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":[212],"c":"f","d":"f"},"b":[212],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[279],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[279],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[225],"b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[279],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[225],"b":"f","c":"f","d":"f"}}},"d":{"a":{"a":{"a":[225],"b":[225],"c":[225],"d":"f"},"b":[225],"c":{"a":[225],"b":[225],"c":[225],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[275,286]}},"b":{"a":[225],"b":[225],"c":{"a":[225],"b":[225],"c":"f","d":[225]},"d":[225]},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[225],"b":[225],"c":[225],"d":"f"},"c":{"a":"f","b":[225],"c":"f","d":"f"},"d":[286,275]},"d":{"a":[286,275],"b":{"a":"f","b":"f","c":"f","d":[275,286]},"c":[286,275],"d":[286,275]}}},"c":{"a":{"a":[275,286],"b":{"a":[286,275],"b":{"a":[275,286],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[234],"d":[234]},"d":{"a":[275,286],"b":"f","c":"f","d":[275,286]}},"c":{"a":{"a":[275,286],"b":"f","c":"f","d":[275,286]},"b":{"a":[234],"b":[234],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[247],"d":"f"}},"d":{"a":[286,275],"b":[286,275],"c":{"a":[275,286],"b":[275,286],"c":"f","d":[275,286]},"d":[286,275]}},"b":{"a":{"a":{"a":"f","b":"f","c":[234],"d":[234]},"b":[234],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[234]},"b":{"a":[234],"b":{"a":[234],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[272],"d":"f"},"d":{"a":[234],"b":[234],"c":[234],"d":"f"}},"c":{"a":{"a":"f","b":[234],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[245],"d":[245]},"d":{"a":[245],"b":"f","c":[245],"d":[245]}},"d":{"a":{"a":[234],"b":[234],"c":[234],"d":"f"},"b":{"a":"f","b":[245],"c":[245],"d":"f"},"c":{"a":"f","b":[245],"c":[245],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":[247],"b":"f","c":[247],"d":[247]},"b":{"a":"f","b":[245],"c":[245],"d":"f"},"c":{"a":"f","b":[245],"c":[245],"d":"f"},"d":[247]},"b":[245],"c":{"a":[245],"b":[245],"c":[245],"d":{"a":[245],"b":[245],"c":[245],"d":"f"}},"d":{"a":[247],"b":{"a":"f","b":[245],"c":"f","d":"f"},"c":{"a":"f","b":[245],"c":"f","d":"f"},"d":[247]}},"d":{"a":{"a":[286,275],"b":{"a":[275,286],"b":"f","c":"f","d":[275,286]},"c":{"a":"f","b":"f","c":[247],"d":"f"},"d":{"a":[275,286],"b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":[247],"c":[247],"d":"f"},"b":[247],"c":[247],"d":[247]},"c":{"a":{"a":[247],"b":[247],"c":"f","d":"f"},"b":{"a":[247],"b":[247],"c":[247],"d":"f"},"c":{"a":"f","b":"f","c":[247],"d":"f"},"d":[250]},"d":{"a":{"a":"f","b":[250],"c":[250],"d":"f"},"b":{"a":"f","b":[247],"c":"f","d":"f"},"c":[250],"d":{"a":"f","b":[250],"c":[250],"d":"f"}}}},"d":{"a":[286,275],"b":[286,275],"c":{"a":{"a":[286,275],"b":[286,275],"c":{"a":"f","b":"f","c":"f","d":[275]},"d":{"a":[275,286],"b":"f","c":"f","d":"f"}},"b":{"a":[286,275],"b":[286,275],"c":[286,275],"d":{"a":[275,286],"b":[275,286],"c":"f","d":"f"}},"c":{"a":{"a":[275],"b":"f","c":[275],"d":[275]},"b":{"a":"f","b":[275,286],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[275]},"d":[275]},"d":[275]},"d":{"a":{"a":{"a":"f","b":"f","c":[275],"d":"f"},"b":{"a":"f","b":"f","c":[275],"d":[275]},"c":[275],"d":[275]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[286,275],"c":{"a":"f","b":"f","c":"f","d":[275]},"d":{"a":[275],"b":"f","c":[275],"d":[275]}},"c":[275],"d":[275]}}},"b":{"a":{"a":{"a":{"a":{"a":[270],"b":[270],"c":[270],"d":"f"},"b":[270],"c":{"a":[270],"b":[270],"c":"f","d":[270]},"d":[270]},"b":{"a":[270],"b":[270],"c":{"a":[270],"b":[270],"c":"f","d":"f"},"d":{"a":[270],"b":[270],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":[272],"c":[272],"d":[272]},"b":{"a":"f","b":"f","c":[272],"d":[272]},"c":[272],"d":[272]},"d":{"a":{"a":[270],"b":[270],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[272],"d":"f"},"c":{"a":"f","b":[272],"c":[272],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[212]}}},"b":{"a":{"a":{"a":[270],"b":"f","c":"f","d":[270]},"b":{"a":"f","b":[272],"c":[272],"d":[272]},"c":[272],"d":{"a":"f","b":"f","c":[272],"d":"f"}},"b":[272],"c":{"a":[272],"b":[272],"c":[272],"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[272],"b":[272],"c":{"a":[272],"b":[272],"c":"f","d":"f"},"d":[272]}},"c":{"a":{"a":[272],"b":{"a":"f","b":[217],"c":[217],"d":"f"},"c":{"a":"f","b":[217],"c":[217],"d":[217]},"d":{"a":"f","b":"f","c":[217],"d":"f"}},"b":{"a":{"a":[217],"b":"f","c":[217],"d":[217]},"b":{"a":"f","b":[272],"c":[272],"d":"f"},"c":{"a":"f","b":"f","c":[217],"d":[217]},"d":[217]},"c":[217],"d":[217]},"d":{"a":{"a":{"a":[212],"b":"f","c":"f","d":[212]},"b":{"a":"f","b":[272],"c":[272],"d":[272]},"c":[272],"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":[272],"b":[272],"c":{"a":[272],"b":[272],"c":"f","d":[272]},"d":[272]},"c":{"a":[272],"b":{"a":[272],"b":"f","c":"f","d":[272]},"c":{"a":"f","b":"f","c":[217],"d":"f"},"d":{"a":[272],"b":[272],"c":"f","d":[272]}},"d":{"a":{"a":"f","b":"f","c":[272],"d":"f"},"b":[272],"c":[272],"d":{"a":"f","b":[272],"c":[272],"d":"f"}}}},"b":{"a":{"a":{"a":{"a":"f","b":[215],"c":[215],"d":"f"},"b":[215],"c":[215],"d":{"a":"f","b":[215],"c":[215],"d":"f"}},"b":{"a":[215],"b":[215],"c":{"a":[215],"b":"f","c":"f","d":[215]},"d":[215]},"c":{"a":[215],"b":{"a":[215],"b":"f","c":"f","d":"f"},"c":{"a":"f"},"d":{"a":[215],"b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":[215],"c":[215],"d":"f"},"b":[215],"c":{"a":[215],"b":[215],"c":"f","d":"f"},"d":{"a":"f","b":[215],"c":[215],"d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","d":"f"},"b":{"c":"f"},"c":{"b":"f","c":"f"},"d":{"a":"f"}},"b":{"a":{"a":"f","b":[349],"c":[349],"d":"f"},"b":[349],"c":[349],"d":{"a":"f","b":[349],"c":[349],"d":[349]}},"c":{"a":{"a":"f","b":[349],"c":[349],"d":"f"},"b":[349],"c":{"a":[349],"b":"f","c":"f","d":"f"},"d":[349]},"d":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f","d":"f"}}},"c":{"a":{"b":{"a":"f","b":[349],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[221],"d":[221]},"d":{"b":"f","c":"f"}},"b":{"a":{"a":[349],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[280],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[221]}},"c":{"a":[221],"b":{"a":[221],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[221],"b":[221],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[221],"c":{"a":[221],"b":[221],"c":"f","d":[221]},"d":{"b":"f","c":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[217],"c":[217],"d":[217]},"c":[217],"d":{"a":"f","b":"f","c":[217],"d":[217]}},"b":{"a":{"a":"f","b":"f","c":"f","d":[217]},"d":{"a":[217],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[217]},"b":{"b":"f","c":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":[217]}},"c":{"a":{"a":{"a":[217],"b":{"a":[217],"b":[217],"c":"f","d":[217]},"c":{"a":[217],"b":"f","c":"f","d":[217]},"d":{"a":[217],"b":[217],"c":"f","d":"f"}},"b":{"a":{"a":"f","d":"f"}},"c":{"c":{"b":"f","c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":{"a":[281],"b":"f","c":[281],"d":[281]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[281],"b":"f","c":[281],"d":[281]},"d":[281]}},"b":{"a":{"a":{"b":"f","c":"f"},"b":{"a":[221],"b":"f","c":"f","d":[221]},"c":{"a":"f","b":"f","c":[281],"d":"f"},"d":{"b":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":[281]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[281],"d":[281]},"c":{"a":[281],"b":[281],"c":{"a":[281],"b":[281],"c":"f","d":[281]},"d":[281]},"d":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[281],"c":[281],"d":[281]},"c":[281],"d":{"a":"f","b":[281],"c":[281],"d":[281]}}},"c":{"a":[281],"b":{"a":[281],"b":{"a":[281],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[219],"c":[219],"d":"f"},"d":[281]},"c":{"a":[281],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[281],"b":"f","c":"f","d":[281]},"d":[281]},"d":[281]},"d":[281]},"d":{"a":{"a":{"a":{"a":"f","b":[272],"c":[272],"d":[272]},"b":{"a":[272],"b":[272],"c":"f","d":[272]},"c":{"a":"f","b":"f","c":[217],"d":"f"},"d":{"a":[272],"b":[272],"c":"f","d":[272]}},"b":{"a":{"a":"f","b":"f","c":[217],"d":"f"},"b":[217],"c":[217],"d":[217]},"c":{"a":[217],"b":[217],"c":[217],"d":{"a":[217],"b":[217],"c":[217],"d":"f"}},"d":{"a":{"a":[272],"b":"f","c":"f","d":"f"},"b":{"a":[217],"b":[217],"c":[217],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[245]},"d":{"a":"f","b":[245],"c":[245],"d":[245]}}},"b":{"a":[217],"b":{"a":[217],"b":[217],"c":{"a":[217],"b":[217],"c":"f","d":"f"},"d":[217]},"c":{"a":{"a":"f","b":"f","c":[281],"d":[281]},"b":{"a":"f","b":[281],"c":[281],"d":[281]},"c":[281],"d":[281]},"d":{"a":[217],"b":{"a":[217],"b":"f","c":"f","d":[217]},"c":{"a":"f","b":"f","c":[281],"d":"f"},"d":{"a":[217],"b":[217],"c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[281],"c":[281],"d":{"a":"f","b":[281],"c":"f","d":"f"}},"b":[281],"c":[281],"d":{"a":{"a":[245],"b":"f","c":"f","d":[245]},"b":[281],"c":[281],"d":{"a":[245],"b":"f","c":"f","d":[245]}}},"d":{"a":[245],"b":{"a":{"a":"f","b":[217],"c":"f","d":"f"},"b":{"a":[217],"b":[217],"c":[217],"d":"f"},"c":{"a":"f","b":[217],"c":"f","d":"f"},"d":{"a":[245],"b":"f","c":[245],"d":[245]}},"c":{"a":[245],"b":{"a":[245],"b":"f","c":[245],"d":[245]},"c":[245],"d":[245]},"d":[245]}}},"c":{"a":{"a":{"a":[245],"b":[245],"c":[245],"d":{"a":[245],"b":[245],"c":[245],"d":{"a":"f","b":[245],"c":"f","d":"f"}}},"b":{"a":{"a":{"a":[245],"b":"f","c":"f","d":[245]},"b":[281],"c":[281],"d":{"a":[245],"b":"f","c":"f","d":[245]}},"b":[281],"c":[281],"d":{"a":{"a":[245],"b":"f","c":"f","d":[245]},"b":[281],"c":[281],"d":{"a":"f","b":"f","c":[281],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[281],"c":[281],"d":"f"},"b":[281],"c":[281],"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":[281],"c":[281],"d":{"a":{"a":"f","b":"f","c":[281],"d":"f"},"b":[281],"c":[281],"d":{"a":"f","b":[281],"c":[281],"d":[281]}}},"d":{"a":{"a":{"a":[247],"b":"f","c":"f","d":[247]},"b":[245],"c":{"a":[245],"b":[245],"c":"f","d":"f"},"d":{"a":[247],"b":"f","c":"f","d":[247]}},"b":{"a":[245],"b":[245],"c":{"a":[245],"b":[245],"c":"f","d":[245]},"d":{"a":[245],"b":[245],"c":[245],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[247],"d":[247]},"b":{"a":"f","b":"f","c":[247],"d":[247]},"c":{"a":[247],"b":"f","c":"f","d":"f"},"d":[247]},"d":{"a":[247],"b":{"a":[247],"b":"f","c":[247],"d":[247]},"c":[247],"d":[247]}}},"b":{"a":[281],"b":{"a":[281],"b":{"a":[281],"b":{"a":"f","b":"f","c":[219],"d":"f"},"c":{"a":"f","b":[219],"c":[219],"d":[219]},"d":{"a":[281],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[219],"c":[219],"d":"f"},"b":[219],"c":[219],"d":{"a":"f","b":[219],"c":[219],"d":"f"}},"d":{"a":[281],"b":{"a":[281],"b":[281],"c":"f","d":[281]},"c":{"a":[281],"b":[281],"c":"f","d":[281]},"d":[281]}},"c":{"a":{"a":[281],"b":{"a":[281],"b":"f","c":"f","d":[281]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[281],"b":[281],"c":"f","d":[281]}},"b":{"a":[219],"b":[219],"c":[219],"d":{"a":"f","b":"f","c":"f","d":[254]}},"c":{"a":{"a":[254],"b":"f","c":"f","d":"f"},"b":{"a":[219],"b":[219],"c":"f","d":"f"},"c":[271],"d":{"a":"f","b":[271],"c":[271],"d":[271]}},"d":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f","b":[254],"c":[254],"d":"f"},"c":{"a":"f","b":"f","c":[271],"d":"f"},"d":{"a":"f","c":"f","d":"f"}}},"d":{"a":[281],"b":[281],"c":{"a":[281],"b":[281],"c":{"a":[281],"b":"f","c":"f","d":[281]},"d":[281]},"d":[281]}},"c":{"a":{"a":[281],"b":{"a":[281],"b":{"a":[281],"b":"f","c":"f","d":"f"},"c":{"a":"f"},"d":{"a":[281],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f"},"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":[281],"c":"f","d":"f"},"b":{"a":[281],"b":"f","c":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":[271],"d":"f"},"b":[271],"c":[271],"d":{"a":"f","b":[271],"c":[271],"d":"f"}},"b":[271],"c":[271],"d":{"a":{"a":"f","b":[271],"c":[271],"d":"f"},"b":[271],"c":[271],"d":{"a":"f","b":[271],"c":[271],"d":"f"}}},"c":[271],"d":{"a":{"a":{"a":"f","b":"f","c":[233],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[233],"b":"f","c":[233],"d":[233]},"d":{"a":"f","b":[233],"c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[271],"d":"f"},"d":[233]},"c":{"a":{"a":[233],"b":"f","c":"f","d":[233]},"b":{"a":"f","b":[271],"c":[271],"d":[271]},"c":[271],"d":{"a":"f","b":"f","c":[271],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":[259]},"b":[233],"c":{"a":[233],"b":[233],"c":"f","d":"f"},"d":{"a":[259],"b":"f","c":"f","d":[259]}}}},"d":{"a":{"a":[247],"b":{"a":[247],"b":{"a":"f","b":[281],"c":[281],"d":"f"},"c":{"a":"f","b":[281],"c":[281],"d":"f"},"d":{"a":[247],"b":"f","c":[247],"d":[247]}},"c":{"a":[247],"b":{"a":"f","b":"f","c":"f","d":[247]},"c":{"a":[247],"b":"f","c":[247],"d":[247]},"d":[247]},"d":{"a":[247],"b":[247],"c":[247],"d":{"a":[247],"b":[247],"c":"f","d":[247]}}},"b":{"a":[281],"b":{"a":[281],"b":[281],"c":{"a":[281],"b":[281],"c":"f","d":[281]},"d":[281]},"c":{"a":[281],"b":{"a":[281],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[281],"b":[281],"c":"f","d":[281]}},"d":{"a":{"a":[281],"b":[281],"c":[281],"d":"f"},"b":[281],"c":[281],"d":{"a":"f","b":[281],"c":[281],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f"}},"b":{"a":{"a":"f","b":"f"},"b":{"b":"f","c":"f"},"c":{"a":"f","b":"f","c":[259],"d":"f"},"d":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":[259],"c":[259],"d":"f"},"b":[259],"c":[259],"d":[259]},"d":{"b":{"c":"f"},"c":{"b":"f","c":"f","d":"f"}}},"d":{"a":{"a":{"a":[247],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f"},"d":{"a":"f","d":"f"}},"b":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":"f","c":"f"}},"d":{"a":{"a":"f"}}}}},"d":{"a":{"a":[275],"b":{"a":[275],"b":{"a":[275],"b":{"a":[275],"b":"f","c":"f","d":[275]},"c":{"a":"f","b":"f","c":"f","d":[275]},"d":[275]},"c":{"a":[275],"b":{"a":[275],"b":"f","c":"f","d":[275]},"c":{"a":[275],"b":"f","c":"f","d":"f"},"d":[275]},"d":[275]},"c":{"a":{"a":[275],"b":{"a":[275],"b":[275],"c":"f","d":[275]},"c":{"a":"f","b":"f","c":[248],"d":"f"},"d":{"a":[275],"b":[275],"c":"f","d":[275]}},"b":{"a":{"a":[275],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[250],"c":[250],"d":[250]},"c":[250],"d":{"a":"f","b":"f","c":"f","d":[248]}},"c":{"a":{"a":[248],"b":"f","c":"f","d":[248]},"b":{"a":[250],"b":[250],"c":[250],"d":"f"},"c":{"a":"f","b":[250],"c":[250],"d":[250]},"d":{"a":"f","b":"f","c":[250],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[248],"c":[248],"d":[248]}},"d":{"a":[275],"b":[275],"c":{"a":[275],"b":{"a":[275],"b":[275],"c":"f","d":[275]},"c":{"a":"f","b":"f","c":[248],"d":"f"},"d":{"a":[275],"b":[275],"c":"f","d":[275]}},"d":{"a":[275],"b":[275],"c":[275],"d":{"a":[275],"b":[275],"c":[275],"d":"f"}}}},"b":{"a":{"a":{"a":{"a":"f","b":[250],"c":[250],"d":[250]},"b":[250],"c":[250],"d":{"a":"f","b":[250],"c":[250],"d":"f"}},"b":{"a":[250],"b":{"a":"f","b":[247],"c":[247],"d":"f"},"c":{"a":"f","b":[247],"c":[247],"d":[247]},"d":{"a":[250],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[250]},"b":{"a":[247],"b":[247],"c":[247],"d":"f"},"c":{"a":"f","b":[247],"c":[247],"d":"f"},"d":{"a":[250],"b":"f","c":"f","d":[250]}},"d":{"a":{"a":"f","b":[250],"c":[250],"d":"f"},"b":[250],"c":[250],"d":{"a":"f","b":[250],"c":[250],"d":[250]}}},"b":{"a":{"a":[247],"b":{"a":[247],"b":"f","c":"f","d":[247]},"c":[247],"d":[247]},"b":{"a":{"a":"f","b":[245],"c":"f","d":"f"},"b":[245],"c":[245],"d":{"a":[247],"b":"f","c":"f","d":[247]}},"c":{"a":{"a":[247],"b":"f","c":"f","d":[247]},"b":{"a":[245],"b":[245],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[247]},"d":{"a":[247],"b":"f","c":[247],"d":[247]}},"d":[247]},"c":{"a":[247],"b":[247],"c":[247],"d":{"a":{"a":"f","b":[247],"c":[247],"d":"f"},"b":[247],"c":[247],"d":{"a":"f","b":"f","c":"f","d":[250]}}},"d":{"a":[250],"b":{"a":[250],"b":{"a":"f","b":[247],"c":[247],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[250]},"d":[250]},"c":{"a":[250],"b":{"a":[250],"b":"f","c":[250],"d":[250]},"c":[250],"d":[250]},"d":[250]}},"c":{"a":[250],"b":{"a":{"a":{"a":[250],"b":"f","c":[250],"d":[250]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[250],"d":[250]},"b":{"a":{"a":"f","b":[247],"c":[247],"d":"f"},"b":[247],"c":[247],"d":{"a":"f","b":"f","c":"f","d":[250]}},"c":{"a":{"a":"f","b":"f","c":[247],"d":"f"},"b":[247],"c":[247],"d":{"a":"f","b":[247],"c":[247],"d":[247]}},"d":{"a":[250],"b":[250],"c":{"a":[250],"b":"f","c":"f","d":[250]},"d":[250]}},"c":{"a":{"a":[250],"b":{"a":[250],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[250]},"d":[250]},"b":{"a":[247],"b":[247],"c":{"a":"f","b":[247],"c":[247],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":[250],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[250],"b":[250],"c":"f","d":[250]}},"d":[250]},"d":[250]},"d":{"a":{"a":{"a":{"a":"f","b":"f","c":"f","d":[282]},"b":{"a":"f","b":"f","c":[248],"d":"f"},"c":{"a":"f","b":[248],"c":[248],"d":"f"},"d":{"a":[282],"b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":[248],"d":[248]},"b":[248],"c":{"a":[248],"b":"f","c":"f","d":"f"},"d":[248]},"c":{"a":{"a":"f","b":"f","c":[250],"d":[250]},"b":{"a":"f","b":[250],"c":[250],"d":[250]},"c":[250],"d":[250]},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[250],"c":[250],"d":"f"},"d":{"a":"f","b":[231],"c":"f","d":"f"}}},"b":{"a":{"a":{"a":[248],"b":[248],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[250],"d":"f"},"c":[250],"d":{"a":"f","b":"f","c":[250],"d":[250]}},"b":{"a":{"a":"f","b":[250],"c":[250],"d":[250]},"b":[250],"c":[250],"d":[250]},"c":[250],"d":[250]},"c":[250],"d":{"a":{"a":{"a":"f","b":"f","c":[231],"d":[231]},"b":{"a":"f","b":[250],"c":[250],"d":"f"},"c":{"a":"f","b":[250],"c":[250],"d":[250]},"d":{"a":[231],"b":"f","c":"f","d":[231]}},"b":[250],"c":[250],"d":{"a":{"a":[231],"b":"f","c":"f","d":[231]},"b":{"a":"f","b":[250],"c":[250],"d":[250]},"c":[250],"d":{"a":[231],"b":"f","c":"f","d":[231]}}}}}},"b":{"a":{"a":{"a":{"a":[349],"b":[349],"c":{"a":{"a":"f","b":"f","c":[280,349],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[349],"b":{"a":[349],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[280],"c":[280],"d":[280]},"d":{"a":"f","b":"f","c":[280],"d":[280]}}},"b":{"a":{"a":{"a":[349],"b":[349],"c":"f","d":[349]},"b":{"a":[349],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":[360],"b":[360],"c":"f","d":"f"},"c":{"b":"f"}},"c":{"c":{"d":"f"},"d":{"c":"f"}},"d":{"a":{"a":"f"}}},"c":{"a":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[335],"d":[335]},"d":{"a":"f","b":"f","c":"f","d":[335]}},"b":{"a":{"a":"f","b":"f","c":[335],"d":"f"},"b":{"a":"f","b":"f","c":[335],"d":[335]},"c":[335],"d":[335]},"c":[335],"d":[335]},"d":{"a":{"a":[280],"b":{"a":[280],"b":[280],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[335],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[293]}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[335],"d":[335]},"d":{"a":"f","b":"f","c":[335],"d":[335]}},"c":[335],"d":{"a":{"a":[293],"b":"f","c":"f","d":[293]},"b":{"a":"f","b":[335],"c":[335],"d":"f"},"c":[335],"d":{"a":"f","b":"f","c":"f","d":"f"}}}},"b":{"a":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f"}},"b":{"a":{"b":"f","c":"f"},"b":{"a":[325],"b":[325],"c":[325],"d":"f"},"c":{"a":"f","b":[325],"c":"f","d":"f"}},"c":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f"}},"d":{"d":{"d":"f"}}},"b":{"a":{"a":[325],"b":[325],"c":{"a":"f","b":[325],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[362],"d":"f"}},"b":{"a":[325],"b":{"a":[325],"b":"f","c":"f","d":[325]},"c":{"a":[325],"b":"f","c":"f","d":"f"},"d":{"a":[325],"b":[325],"c":"f","d":"f"}},"c":{"a":[362],"b":{"a":[362],"b":"f","c":"f","d":[362]},"c":{"a":[362],"b":"f","c":"f","d":[362]},"d":[362]},"d":{"a":[362],"b":[362],"c":[362],"d":{"a":[362],"b":[362],"c":[362],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":[335],"d":[335]},"b":{"a":"f","b":[362],"c":[362],"d":"f"},"c":{"a":"f","b":"f","c":[320],"d":"f"},"d":[335]},"b":{"a":{"a":[362],"b":[362],"c":"f","d":[362]},"b":{"a":[362],"b":"f","c":"f","d":[362]},"c":{"a":"f","b":"f","c":"f","d":[320]},"d":{"a":"f","b":"f","c":[320],"d":[320]}},"c":[320],"d":{"a":[335],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[335],"b":"f","c":"f","d":"f"},"d":[335]}},"d":{"a":{"a":{"a":"f","b":"f","c":[335],"d":[335]},"b":{"a":"f","c":"f","d":"f"},"c":{"a":[335],"b":"f","c":[335],"d":[335]},"d":[335]},"b":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[335],"c":[335],"d":[335]},"d":{"a":"f","b":"f","c":[335],"d":[335]}},"c":[335],"d":[335]}},"c":{"a":{"a":[335],"b":[335],"c":{"a":[335],"b":[335],"c":[335],"d":{"a":[335],"b":[335],"c":[335],"d":"f"}},"d":{"a":[335],"b":[335],"c":{"a":[335],"b":[335],"c":"f","d":[335]},"d":[335]}},"b":{"a":{"a":[335],"b":{"a":"f","b":[320],"c":[320],"d":"f"},"c":{"a":"f","b":[320],"c":[320],"d":"f"},"d":{"a":[335],"b":[335],"c":"f","d":[335]}},"b":[320],"c":{"a":[320],"b":[320],"c":{"a":[320],"b":[320],"c":"f","d":[320]},"d":[320]},"d":{"a":{"a":[335],"b":"f","c":"f","d":[335]},"b":[320],"c":[320],"d":{"a":[335],"b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[320],"c":{"a":[320],"b":[320],"c":[320],"d":"f"},"d":{"a":"f","b":"f","c":"f"}},"b":{"a":[320],"b":{"a":[320],"b":"f","c":"f","d":[320]},"c":{"a":"f","b":"f","d":"f"},"d":[320]},"c":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f"}},"d":{"b":{"a":"f","b":"f","c":"f"}}},"d":{"a":{"a":{"a":[335],"b":[335],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":[335],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"},"d":{"b":"f"}}}},"d":{"a":{"a":{"a":{"a":[281],"b":"f","c":"f","d":"f"},"b":[335],"c":[335],"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":[335],"c":{"a":{"a":[335],"b":[335],"c":[335],"d":"f"},"b":[335],"c":{"a":"f","b":[335],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[230],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[335],"b":[335],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[219]},"d":{"a":"f","b":"f","c":[219],"d":"f"}}},"b":{"a":[335],"b":[335],"c":{"a":[335],"b":[335],"c":{"a":[335],"b":[335],"c":[335],"d":"f"},"d":[335]},"d":{"a":[335],"b":[335],"c":{"a":[335],"b":[335],"c":"f","d":"f"},"d":{"a":[335],"b":"f","c":"f","d":"f"}}},"c":{"a":{"a":[230],"b":{"a":[230],"b":"f","c":[230],"d":[230]},"c":[230],"d":[230]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[230]}},"c":{"a":{"a":[230],"b":"f","c":"f","d":"f"},"b":{"b":"f","c":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[230],"b":[230],"c":{"a":[230],"b":"f","c":[230],"d":[230]},"d":[230]}},"d":{"a":[219],"b":{"a":{"a":"f","b":"f","c":"f","d":[219]},"b":[230],"c":[230],"d":{"a":[219],"b":"f","c":"f","d":[219]}},"c":{"a":{"a":[219],"b":"f","c":"f","d":[219]},"b":[230],"c":{"a":"f","b":[230],"c":"f","d":"f"},"d":{"a":[219],"b":"f","c":[219],"d":[219]}},"d":[219]}}},"b":{"a":{"a":{"a":{"a":{"a":"f","b":"f","c":[321],"d":"f"},"b":[321],"c":[321],"d":{"a":"f","b":[321],"c":[321],"d":"f"}},"b":{"a":{"a":"f","b":"f","c":[358],"d":"f"},"b":[358],"c":{"a":[358],"b":[358],"c":"f","d":[358]},"d":{"a":"f","b":[358],"c":[358],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[358],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":[321],"c":[321],"d":[321]},"b":{"a":[321],"b":[321],"c":"f","d":[321]},"c":{"a":[321],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":[321],"c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[374],"b":[374],"c":"f","d":[374]},"c":{"a":[374],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[374],"d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[355],"c":[355],"d":"f"},"c":{"a":"f","b":[355],"c":[355],"d":"f"},"d":{"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":[355],"c":[355],"d":[355]},"b":[355],"c":[355],"d":[355]},"d":{"a":{"a":[374],"b":"f","c":"f","d":[374]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":[355],"d":"f"},"b":[355],"c":[355],"d":{"a":"f","b":[355],"c":[355],"d":[355]}},"b":{"a":[355],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[355]},"c":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f"}},"d":{"a":[355],"b":{"a":[355],"b":[355],"c":"f","d":[355]},"c":{"a":"f","b":"f"},"d":{"a":[355],"b":"f","c":"f","d":[355]}}},"d":{"a":{"a":{"a":[361],"b":"f","c":[361],"d":[361]},"b":{"a":"f","b":[365],"c":[365],"d":"f"},"c":{"a":"f","b":[365],"c":[365],"d":"f"},"d":{"a":"f","b":[361],"c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","d":"f"},"c":{"b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[355],"c":[355],"d":[355]},"c":{"a":[355],"b":[355],"c":[355],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[320],"b":{"a":"f","b":[365],"c":[365],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[320]},"d":[320]}}},"b":{"a":{"a":{"a":[355],"b":[355],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[355],"b":[355],"c":"f","d":[355]}},"b":{"a":{"a":[355],"b":"f","c":[355],"d":[355]},"b":{"a":"f","b":[351],"c":[351],"d":"f"},"c":{"a":"f","b":[351],"c":[351],"d":[351]},"d":{"a":[355],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":[351],"c":"f","d":"f"},"c":{"a":"f","b":"f"},"d":{"a":"f","d":"f"}},"d":{"a":[355],"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[351],"d":"f"},"d":{"a":[355],"b":[355],"c":"f","d":[355]}}},"b":{"a":[351],"b":[351],"c":{"a":[351],"b":[351],"c":{"a":"f","b":"f","c":[344],"d":[344]},"d":{"a":[351],"b":"f","c":"f","d":"f"}},"d":{"a":{"a":[351],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[351],"c":"f","d":"f"},"c":{"b":"f","c":"f","d":"f"}}},"c":{"a":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f"}},"b":{"a":[344],"b":[344],"c":{"a":[344],"b":[344],"c":[344],"d":"f"},"d":{"a":"f","b":[344],"c":"f","d":"f"}},"c":{"a":{"d":"f"},"b":{"a":"f","b":[344],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":{"c":"f"},"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[344],"d":"f"},"d":{"b":"f","c":"f"}}},"d":{"a":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":[351],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[355],"d":[355]},"d":{"b":"f","c":"f"}},"b":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":[355],"c":[355],"d":{"b":"f","c":"f"}}}},"c":{"a":{"a":{"a":{"b":"f"},"b":{"a":"f","b":[355],"c":"f","d":"f"},"c":{"b":"f"}},"b":{"a":{"a":"f","d":"f"},"d":{"a":"f"}},"c":{"a":{"c":"f"},"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[3],"d":[3]},"d":{"a":"f","b":"f","c":[3],"d":"f"}},"d":{"a":{"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[50],"b":"f","c":"f","d":[50]},"d":{"a":"f","b":[50],"c":[50],"d":"f"}}},"b":{"a":{"b":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f"},"d":{"b":"f"}},"c":{"c":{"d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"c":{"a":"f","b":"f","c":[3],"d":[3]},"d":{"a":"f","b":"f","c":[3],"d":[3]}}},"c":{"a":[3],"b":{"a":[3],"b":{"a":"f","b":"f","c":[3],"d":[3]},"c":[3],"d":[3]},"c":[3],"d":[3]},"d":{"a":{"a":{"a":"f","b":[50],"c":[50],"d":"f"},"b":[50],"c":{"a":[50],"b":[50],"c":"f","d":[50]},"d":[50]},"b":{"a":{"a":"f","b":[3],"c":[3],"d":"f"},"b":[3],"c":[3],"d":{"a":"f","b":[3],"c":[3],"d":"f"}},"c":{"a":{"a":"f","b":[3],"c":[3],"d":"f"},"b":[3],"c":[3],"d":{"a":"f","b":"f","c":"f","d":[50]}},"d":{"a":[50],"b":[50],"c":[50],"d":{"a":"f","b":[50],"c":[50],"d":"f"}}}},"d":{"a":{"a":{"a":[320],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[320]},"b":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f"}},"d":{"a":{"a":[320],"b":"f","c":"f","d":[320]},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"a":[320],"b":"f","c":"f","d":"f"}}},"b":{"a":{"a":{"a":[355],"b":"f","c":"f","d":[355]},"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[355]},"d":{"a":"f","b":"f","c":[355],"d":"f"}},"b":{"a":{"c":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[355],"d":"f"}},"c":{"a":{"a":[355],"b":[355],"c":"f","d":[355]},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":[355],"c":[355],"d":"f"},"c":{"a":[355],"b":[355],"c":"f","d":"f"},"d":{"b":"f","c":"f"}}},"c":{"a":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f"}},"b":{"a":{"a":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}},"c":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}}},"d":{"a":{"a":{"a":"f"}}}}},"c":{"a":{"a":{"a":{"a":{"c":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":[49],"b":"f","c":[49],"d":[49]}},"c":{"c":{"b":"f","c":"f","d":"f"}},"d":{"a":[49],"b":{"a":[49],"b":"f","c":"f","d":[49]},"c":{"a":[49],"b":"f","c":"f","d":[49]},"d":[49]}},"b":{"a":{"c":{"b":"f","c":"f","d":"f"}},"b":{"a":{"c":"f","d":"f"},"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[49]},"d":{"a":"f","b":"f","c":[49],"d":[49]}},"c":{"a":[49],"b":{"a":[49],"b":"f","c":[49],"d":[49]},"c":[49],"d":[49]},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":[49],"c":[49],"d":[49]},"c":[49],"d":{"a":"f","b":"f","c":[49],"d":[49]}}},"c":[49],"d":{"a":{"a":[49],"b":{"a":[49],"b":"f","c":[49],"d":[49]},"c":[49],"d":[49]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[49],"c":[49],"d":[49]},"c":[49],"d":[49]},"c":[49],"d":[49]}},"b":{"a":{"a":{"a":[50],"b":[50],"c":{"a":[50],"b":[50],"c":"f","d":[50]},"d":[50]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[3],"c":[3],"d":{"a":"f","b":[3],"c":[3],"d":"f"}},"c":[3],"d":{"a":{"a":"f","b":[50],"c":"f","d":"f"},"b":{"a":[50],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[3],"c":[3],"d":"f"},"d":{"a":[49],"b":"f","c":"f","d":[49]}}},"b":[3],"c":[3],"d":{"a":{"a":{"a":[49],"b":"f","c":"f","d":[49]},"b":{"a":"f","b":[3],"c":[3],"d":"f"},"c":{"a":"f","b":[3],"c":[3],"d":"f"},"d":[49]},"b":[3],"c":[3],"d":{"a":{"a":[49],"b":[49],"c":"f","d":[49]},"b":{"a":"f","b":[3],"c":[3],"d":"f"},"c":{"a":[3],"b":[3],"c":[3],"d":"f"},"d":{"a":[49],"b":"f","c":"f","d":[49]}}}},"c":{"a":{"a":{"a":{"a":[49],"b":"f","c":"f","d":[49]},"b":{"a":[3],"b":[3],"c":[3],"d":"f"},"c":{"a":"f","b":[3],"c":[3],"d":"f"},"d":{"a":[49],"b":[49],"c":"f","d":[49]}},"b":[3],"c":[3],"d":{"a":{"a":[49],"b":"f","c":[49],"d":[49]},"b":{"a":"f","b":[3],"c":[3],"d":"f"},"c":{"a":"f","b":[3],"c":[3],"d":"f"},"d":{"a":[49],"b":[49],"c":"f","d":[49]}}},"b":[3],"c":[3],"d":{"a":{"a":{"a":[49],"b":"f","c":"f","d":[49]},"b":[3],"c":[3],"d":{"a":"f","b":"f","c":[3],"d":[3]}},"b":[3],"c":[3],"d":{"a":[3],"b":[3],"c":[3],"d":{"a":"f","b":[3],"c":"f","d":"f"}}}},"d":{"a":[49],"b":[49],"c":{"a":[49],"b":{"a":[49],"b":[49],"c":{"a":[49],"b":"f","c":"f","d":[49]},"d":[49]},"c":{"a":{"a":[49],"b":[49],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[44],"b":"f","c":[44],"d":[44]},"d":{"a":"f","b":[44],"c":[44],"d":"f"}},"d":{"a":{"a":[49],"b":[49],"c":"f","d":"f"},"b":{"a":[49],"b":[49],"c":[49],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":[43],"c":[43],"d":[43]}}},"d":{"a":[49],"b":[49],"c":{"a":[49],"b":[49],"c":{"a":[49],"b":"f","c":"f","d":"f"},"d":[49]},"d":[49]}}},"d":{"a":{"a":{"a":[219],"b":{"a":[219],"b":{"a":[219],"b":"f","c":[219],"d":[219]},"c":[219],"d":[219]},"c":{"a":{"a":[219],"b":[219],"c":"f","d":[219]},"b":{"a":"f","b":"f","c":[271],"d":"f"},"c":[271],"d":{"a":"f","b":"f","c":[271],"d":"f"}},"d":{"a":[219],"b":[219],"c":{"a":[219],"b":[219],"c":"f","d":[219]},"d":[219]}},"b":{"a":{"a":{"a":"f","b":[230],"c":"f","d":"f"},"b":[230],"c":{"a":"f","b":[230],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[213],"d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":[213],"b":"f","c":"f","d":[213]},"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[244]},"d":{"a":[213],"b":"f","c":"f","d":[213]}},"d":{"a":{"a":"f","b":[213],"c":"f","d":"f"},"b":{"a":[213],"b":"f","c":[213],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[271]}},"c":{"a":{"a":{"a":[271],"b":[271],"c":"f","d":[271]},"b":{"a":"f","b":[213],"c":[213],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[271]},"d":[271]},"b":{"a":{"a":[213],"b":"f","c":"f","d":[213]},"b":{"a":"f","b":"f","c":[12],"d":"f"},"c":{"a":"f","b":[12],"c":[12],"d":"f"},"d":{"a":[213],"b":"f","c":[213],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[271],"d":[271]},"b":{"a":"f","b":[12],"c":[12],"d":"f"},"c":{"a":"f","b":[12],"c":[12],"d":"f"},"d":[271]},"d":[271]},"d":{"a":{"a":[219],"b":{"a":[219],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[271],"c":[271],"d":[271]},"d":{"a":[219],"b":"f","c":"f","d":[219]}},"b":[271],"c":[271],"d":{"a":{"a":"f","b":"f","c":[271],"d":"f"},"b":[271],"c":[271],"d":[271]}}},"b":{"a":{"c":{"a":{"c":"f","d":"f"},"c":{"b":"f","c":"f","d":"f"},"d":{"a":[12],"b":"f","c":"f","d":[12]}},"d":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":[12],"c":[12],"d":[12]},"d":{"a":"f","b":"f","c":[12],"d":[12]}}},"b":{"b":{"b":{"c":"f"},"c":{"a":"f","b":"f","c":[49],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[49],"d":"f"},"b":{"a":"f","b":[49],"c":[49],"d":[49]},"c":[49],"d":{"a":"f","b":[49],"c":[49],"d":"f"}},"d":{"a":{"c":"f"},"b":{"c":"f","d":"f"},"c":[12],"d":{"a":"f","b":"f","c":[12],"d":[12]}}},"c":{"a":[12],"b":{"a":{"a":"f","b":[49],"c":[49],"d":"f"},"b":[49],"c":[49],"d":{"a":"f","b":[49],"c":[49],"d":"f"}},"c":{"a":{"a":"f","b":[49],"c":[49],"d":"f"},"b":[49],"c":[49],"d":{"a":"f","b":[49],"c":[49],"d":"f"}},"d":[12]},"d":[12]},"c":{"a":[12],"b":{"a":[12],"b":{"a":{"a":"f","b":[49],"c":[49],"d":"f"},"b":[49],"c":[49],"d":{"a":"f","b":[49],"c":[49],"d":"f"}},"c":{"a":{"a":"f","b":[49],"c":[49],"d":"f"},"b":[49],"c":[49],"d":{"a":"f","b":[49],"c":[49],"d":"f"}},"d":[12]},"c":{"a":[12],"b":{"a":{"a":"f","b":[49],"c":[49],"d":"f"},"b":[49],"c":[49],"d":{"a":"f","b":[49],"c":[49],"d":"f"}},"c":{"a":{"a":"f","b":[49],"c":[49],"d":"f"},"b":[49],"c":[49],"d":{"a":"f","b":[49],"c":[49],"d":"f"}},"d":[12]},"d":[12]},"d":{"a":[271],"b":{"a":[271],"b":{"a":{"a":[271],"b":[271],"c":"f","d":[271]},"b":{"a":"f","b":[12],"c":"f","d":"f"},"c":{"b":"f","c":"f"},"d":{"a":[271],"b":"f","c":"f","d":[271]}},"c":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[12],"c":[12],"d":"f"},"d":{"a":"f","d":"f"}},"d":[271]},"c":{"a":{"a":[271],"b":{"a":[271],"b":"f","c":"f","d":[271]},"c":{"a":[271],"b":"f","c":"f","d":"f"},"d":[271]},"b":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":[12],"c":[12],"d":[12]},"c":[12],"d":{"a":"f","b":"f","c":[12],"d":"f"}},"c":{"a":{"a":"f","b":[12],"c":[12],"d":"f"},"b":[12],"c":[12],"d":{"a":"f","b":[12],"c":[12],"d":[12]}},"d":{"a":{"a":[271],"b":[271],"c":"f","d":[271]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"b":"f","c":"f"},"d":{"a":[271],"b":"f","c":"f","d":[271]}}},"d":[271]}}},"c":{"a":{"a":{"a":{"a":[271],"b":[271],"c":{"a":[271],"b":[271],"c":{"a":[271],"b":"f","c":"f","d":[271]},"d":[271]},"d":[271]},"b":{"a":{"a":{"a":[271],"b":"f","c":"f","d":[271]},"b":{"b":"f","c":"f"},"c":{"a":"f","b":"f","c":[27],"d":"f"},"d":{"a":"f","b":"f","d":"f"}},"b":{"a":{"a":[12],"b":[12],"c":"f","d":"f"},"b":{"a":[12],"b":[12],"c":"f","d":"f"},"c":{"a":[27],"b":"f","c":[27],"d":[27]},"d":[27]},"c":[27],"d":{"a":{"a":"f","d":"f"},"b":{"a":"f","b":[27],"c":[27],"d":"f"},"c":{"a":"f","b":[27],"c":[27],"d":"f"},"d":{"a":"f"}}},"c":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[27],"c":[27],"d":"f"},"c":[27],"d":{"a":"f","b":[27],"c":[27],"d":"f"}},"b":[27],"c":[27],"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[27],"c":{"a":"f","b":[27],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":[4],"d":"f"}}},"d":{"a":[271],"b":{"a":[271],"b":{"a":[271],"b":"f","c":"f","d":[271]},"c":{"a":"f","b":"f","d":"f"},"d":[271]},"c":{"a":{"a":[271],"b":[271],"c":"f","d":[271]},"b":{"a":"f","d":"f"},"d":{"a":[271],"b":"f","c":"f","d":[271]}},"d":{"a":[271],"b":[271],"c":{"a":"f","b":[271],"c":[271],"d":"f"},"d":{"a":"f","b":"f","c":[211],"d":[211]}}}},"b":{"a":{"a":{"a":{"a":[12],"b":[12],"c":"f","d":"f"},"b":{"a":[12],"b":"f","c":"f","d":"f"},"c":[27],"d":{"a":"f","b":[27],"c":[27],"d":[27]}},"b":{"a":{"a":[12],"b":[12],"c":"f","d":"f"},"b":{"a":[12],"b":[12],"c":"f","d":"f"},"c":[27],"d":[27]},"c":[27],"d":[27]},"b":{"a":{"a":{"a":[12],"b":[12],"c":"f","d":"f"},"b":{"a":[12],"b":[12],"c":"f","d":"f"},"c":[27],"d":[27]},"b":{"a":{"a":"f","b":[49],"c":[49],"d":"f"},"b":[49],"c":[49],"d":{"a":"f","b":[49],"c":[49],"d":"f"}},"c":{"a":{"a":"f","b":[49],"c":[49],"d":"f"},"b":[49],"c":{"a":[49],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":[49],"c":"f","d":"f"}},"d":[27]},"c":{"a":[27],"b":{"a":{"a":[27],"b":"f","c":"f","d":[27]},"b":{"a":"f","b":[43],"c":[43],"d":[43]},"c":[43],"d":{"a":[27],"b":"f","c":"f","d":[27]}},"c":{"a":{"a":[27],"b":"f","c":"f","d":[27]},"b":[43],"c":[43],"d":{"a":[27],"b":"f","c":"f","d":[27]}},"d":[27]},"d":[27]},"c":{"a":[27],"b":{"a":[27],"b":{"a":{"a":[27],"b":"f","c":"f","d":[27]},"b":[43],"c":{"a":[43],"b":[43],"c":"f","d":"f"},"d":{"a":[27],"b":"f","c":"f","d":[27]}},"c":{"a":[27],"b":{"a":[27],"b":"f","c":"f","d":[27]},"c":{"a":[27],"b":"f","c":"f","d":[27]},"d":[27]},"d":[27]},"c":{"a":[27],"b":[27],"c":{"a":[27],"b":{"a":[27],"b":[27],"c":"f","d":[27]},"c":{"a":[27],"b":"f","c":"f","d":[27]},"d":[27]},"d":[27]},"d":{"a":[27],"b":[27],"c":[27],"d":{"a":{"a":[27],"b":[27],"c":"f","d":"f"},"b":[27],"c":{"a":"f","b":[27],"c":[27],"d":[27]},"d":{"a":"f","b":"f","c":"f","d":"f"}}}},"d":{"a":{"a":{"a":[211],"b":{"a":"f","b":[271],"c":"f","d":"f"},"c":[211],"d":[211]},"b":{"a":{"a":[271],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[4],"d":"f"},"c":{"a":"f","b":[4],"c":[4],"d":[4]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[4],"c":[4],"d":"f"},"c":{"a":"f","b":"f","c":[2],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[211],"b":{"a":[211],"b":"f","c":"f","d":[211]},"c":{"a":[211],"b":"f","c":"f","d":[211]},"d":[211]}},"b":{"a":{"a":{"a":"f","b":[4],"c":[4],"d":[4]},"b":{"a":[4],"b":"f","c":"f","d":[4]},"c":{"a":[4],"b":"f","c":"f","d":[4]},"d":[4]},"b":[27],"c":{"a":{"a":"f","b":[27],"c":[27],"d":"f"},"b":[27],"c":[27],"d":{"a":"f","b":[27],"c":[27],"d":"f"}},"d":{"a":{"a":[4],"b":[4],"c":"f","d":[4]},"b":{"a":[4],"b":"f","c":[4],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":[2],"b":{"a":{"a":"f","b":[27],"c":[27],"d":"f"},"b":[27],"c":[27],"d":{"a":"f","b":[27],"c":"f","d":"f"}},"c":{"a":{"a":[2],"b":"f","c":"f","d":[2]},"b":[27],"c":{"a":"f","b":[27],"c":[27],"d":"f"},"d":{"a":[2],"b":"f","c":[2],"d":[2]}},"d":[2]},"d":{"a":{"a":[211],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[211]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[2],"c":[2],"d":{"a":"f","b":[2],"c":[2],"d":"f"}},"c":{"a":{"a":[2],"b":[2],"c":[2],"d":"f"},"b":[2],"c":[2],"d":{"a":"f","b":[2],"c":[2],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":[18],"c":[18],"d":"f"},"d":{"b":"f","c":"f"}}}}},"b":{"a":{"a":{"a":{"a":[49],"b":[49],"c":{"a":[49],"b":"f","c":"f","d":"f"},"d":[49]},"b":{"a":{"a":[49],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[43],"c":[43],"d":[43]},"c":[43],"d":{"a":"f","b":[43],"c":[43],"d":[43]}},"c":[43],"d":{"a":{"a":[49],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[43],"c":[43],"d":[43]},"c":[43],"d":{"a":"f","b":[43],"c":[43],"d":[43]}}},"b":{"a":{"a":[43],"b":{"a":"f","b":[44],"c":[44],"d":"f"},"c":{"a":"f","b":[44],"c":[44],"d":"f"},"d":{"a":[43],"b":[43],"c":"f","d":[43]}},"b":[44],"c":[44],"d":{"a":{"a":[43],"b":"f","c":"f","d":[43]},"b":[44],"c":[44],"d":{"a":[43],"b":"f","c":"f","d":[43]}}},"c":{"a":{"a":{"a":[43],"b":"f","c":"f","d":[43]},"b":[44],"c":[44],"d":{"a":[43],"b":"f","c":"f","d":[43]}},"b":[44],"c":[44],"d":{"a":{"a":[43],"b":"f","c":"f","d":[43]},"b":[44],"c":[44],"d":{"a":[43],"b":"f","c":"f","d":[43]}}},"d":[43]},"b":{"a":{"a":{"a":{"a":[44],"b":"f","c":[44],"d":[44]},"b":{"a":"f","b":[3],"c":"f","d":"f"},"c":{"a":[44],"b":"f","c":"f","d":[44]},"d":[44]},"b":{"a":[3],"b":[3],"c":[3],"d":{"a":[3],"b":[3],"c":[3],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[44]},"b":{"a":[3],"b":[3],"c":[3],"d":"f"},"c":{"a":"f","b":[3],"c":"f","d":"f"},"d":[44]},"d":[44]},"b":{"a":[3],"b":{"a":[3],"b":{"a":[3],"b":[3],"c":"f","d":[3]},"c":{"a":[3],"b":"f","c":"f","d":"f"},"d":[3]},"c":{"a":{"a":[3],"b":[3],"c":"f","d":[3]},"b":{"a":"f","b":[5],"c":[5],"d":"f"},"c":[5],"d":{"a":"f","b":"f","c":[5],"d":"f"}},"d":{"a":[3],"b":[3],"c":{"a":[3],"b":[3],"c":"f","d":[3]},"d":[3]}},"c":{"a":{"a":{"a":"f","b":[3],"c":"f","d":"f"},"b":{"a":[3],"b":"f","c":"f","d":"f"},"c":{"a":[5],"b":"f","c":[5],"d":[5]},"d":{"a":[44],"b":"f","c":"f","d":[44]}},"b":[5],"c":[5],"d":{"a":{"a":[44],"b":"f","c":"f","d":[44]},"b":[5],"c":{"a":[5],"b":[5],"c":[5],"d":"f"},"d":{"a":[44],"b":"f","c":"f","d":[44]}}},"d":{"a":[44],"b":{"a":[44],"b":{"a":[44],"b":"f","c":[44],"d":[44]},"c":[44],"d":[44]},"c":[44],"d":[44]}},"c":{"a":[44],"b":{"a":{"a":[44],"b":{"a":"f","b":[5],"c":[5],"d":"f"},"c":{"a":"f","b":[5],"c":[5],"d":"f"},"d":[44]},"b":[5],"c":{"a":{"a":"f","b":"f","c":[44],"d":[44]},"b":{"a":"f","b":[5],"c":"f","d":"f"},"c":{"a":[44],"b":"f","c":"f","d":[44]},"d":[44]},"d":{"a":[44],"b":{"a":"f","b":"f","c":[44],"d":[44]},"c":[44],"d":[44]}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":[30]},"b":{"a":[44],"b":[44],"c":[44],"d":"f"},"c":{"a":"f","b":[44],"c":[44],"d":"f"},"d":[30]},"b":{"a":[44],"b":{"a":[44],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[46],"c":[46],"d":"f"},"d":{"a":[44],"b":[44],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[46],"c":{"a":[46],"b":[46],"c":[46],"d":"f"},"d":{"a":"f","b":[46],"c":"f","d":"f"}},"d":{"a":[30],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[30]}},"d":{"a":{"a":{"a":[44],"b":[44],"c":[44],"d":"f"},"b":[44],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[30],"d":[30]}},"b":{"a":[44],"b":{"a":[44],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[30],"c":[30],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[30]}},"c":[30],"d":[30]}},"d":{"a":{"a":[43],"b":[43],"c":[43],"d":{"a":[43],"b":[43],"c":[43],"d":{"a":"f","b":[43],"c":[43],"d":"f"}}},"b":{"a":{"a":{"a":[43],"b":"f","c":[43],"d":[43]},"b":{"a":"f","b":[44],"c":[44],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[43]},"d":[43]},"b":[44],"c":{"a":{"a":"f","b":[44],"c":[44],"d":"f"},"b":[44],"c":[44],"d":{"a":"f","b":[44],"c":[44],"d":"f"}},"d":{"a":[43],"b":{"a":[43],"b":"f","c":[43],"d":[43]},"c":[43],"d":[43]}},"c":{"a":{"a":[43],"b":[43],"c":{"a":[43],"b":"f","c":"f","d":[43]},"d":[43]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[44],"b":[44],"c":"f","d":[44]},"c":{"a":"f","b":"f","c":[30],"d":[30]},"d":{"a":"f","b":"f","c":[30],"d":[30]}},"c":{"a":[30],"b":[30],"c":[30],"d":{"a":[30],"b":[30],"c":[30],"d":"f"}},"d":{"a":[43],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[43]}},"d":{"a":{"a":{"a":"f","b":[43],"c":[43],"d":"f"},"b":[43],"c":[43],"d":{"a":"f","b":[43],"c":[43],"d":"f"}},"b":[43],"c":[43],"d":{"a":{"a":"f","b":[43],"c":[43],"d":"f"},"b":[43],"c":[43],"d":[43]}}}},"c":{"a":{"a":{"a":{"a":{"a":"f","b":[43],"c":"f","d":"f"},"b":[43],"c":[43],"d":{"a":[6],"b":"f","c":"f","d":[6]}},"b":[43],"c":{"a":[43],"b":[43],"c":[43],"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":[6],"b":"f","c":[6],"d":[6]},"b":{"a":"f","b":[43],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[6],"d":[6]},"d":[6]}},"b":{"a":{"a":[43],"b":{"a":"f","b":"f","c":[19],"d":"f"},"c":{"a":"f","b":[19],"c":"f","d":"f"},"d":{"a":[43],"b":[43],"c":"f","d":[43]}},"b":{"a":{"a":"f","b":[30],"c":[30],"d":"f"},"b":[30],"c":[30],"d":{"a":"f","b":[30],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[19]},"b":[30],"c":{"a":[30],"b":[30],"c":[30],"d":"f"},"d":{"a":[19],"b":"f","c":"f","d":[19]}},"d":{"a":[43],"b":{"a":[43],"b":"f","c":"f","d":[43]},"c":{"a":"f","b":"f","c":[19],"d":"f"},"d":[43]}},"c":{"a":{"a":{"a":[43],"b":[43],"c":"f","d":"f"},"b":{"a":"f","b":[19],"c":[19],"d":"f"},"c":{"a":"f","b":[19],"c":[19],"d":"f"},"d":{"a":"f","b":"f","c":[6],"d":[6]}},"b":{"a":[19],"b":{"a":"f","b":[30],"c":[30],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[19]},"d":[19]},"c":{"a":[19],"b":{"a":[19],"b":"f","c":"f","d":[19]},"c":[19],"d":[19]},"d":{"a":[6],"b":{"a":"f","b":[19],"c":[19],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[6]},"d":[6]}},"d":{"a":[6],"b":{"a":{"a":[6],"b":"f","c":"f","d":[6]},"b":{"a":[43],"b":[43],"c":"f","d":"f"},"c":{"a":[6],"b":"f","c":[6],"d":[6]},"d":[6]},"c":[6],"d":[6]}},"b":{"a":[30],"b":{"a":{"a":[30],"b":{"a":"f","b":[47],"c":[47],"d":"f"},"c":{"a":"f","b":[47],"c":"f","d":"f"},"d":[30]},"b":{"a":[47],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[47]},"c":{"a":{"a":[47],"b":[47],"c":"f","d":[47]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[32],"b":"f","c":"f","d":[32]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[30],"b":{"a":[30],"b":"f","c":"f","d":[30]},"c":{"a":[30],"b":"f","c":[30],"d":[30]},"d":[30]}},"c":{"a":[30],"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":[32]},"c":{"a":[32],"b":"f","c":"f","d":[32]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[32],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[1],"c":[1],"d":"f"},"d":{"a":"f","b":"f","c":"f"}},"d":{"a":[30],"b":[30],"c":{"a":"f","b":"f"},"d":{"a":[30],"b":"f","c":"f","d":[30]}}},"d":{"a":{"a":[30],"b":[30],"c":[30],"d":{"a":[30],"b":[30],"c":"f","d":"f"}},"b":[30],"c":[30],"d":{"a":{"a":"f","b":"f","c":[19],"d":"f"},"b":{"a":"f","b":[30],"c":[30],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[19]},"d":[19]}}},"c":{"a":{"a":{"a":[19],"b":{"a":[19],"b":"f","c":"f","d":[19]},"c":{"a":[19],"b":"f","c":"f","d":[19]},"d":[19]},"b":{"a":[30],"b":[30],"c":{"a":[30],"b":[30],"c":"f","d":[30]},"d":{"a":"f","b":[30],"c":"f","d":"f"}},"c":{"a":{"b":"f","d":"f"},"b":{"a":"f","b":"f"},"d":{"a":"f","d":"f"}},"d":{"a":[19],"b":{"a":[19],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[19]}},"b":{"a":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f","d":"f"}},"b":{"b":{"a":"f","b":"f"}}},"d":{"a":{"a":{"a":[19],"b":[19],"c":"f","d":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[36]},"b":{"c":{"d":"f"},"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f"}},"d":{"a":{"a":[36],"b":[36],"c":"f","d":"f"},"b":{"a":"f","c":"f","d":"f"},"c":{"a":[31],"b":"f","c":"f","d":[31]},"d":[31]}}},"d":{"a":{"a":{"a":[6],"b":{"a":[6],"b":[6],"c":"f","d":[6]},"c":{"a":"f","b":"f","c":[29],"d":"f"},"d":{"a":[6],"b":[6],"c":"f","d":"f"}},"b":{"a":{"a":[6],"b":[6],"c":[6],"d":"f"},"b":[6],"c":[6],"d":{"a":"f","b":"f","c":"f","d":[29]}},"c":{"a":{"a":[29],"b":"f","c":"f","d":[29]},"b":{"a":[6],"b":[6],"c":"f","d":"f"},"c":{"a":"f","b":[10],"c":[10],"d":[10]},"d":{"a":[29],"b":"f","c":"f","d":[29]}},"d":{"a":{"a":"f","b":[29],"c":[29],"d":[29]},"b":[29],"c":[29],"d":[29]}},"b":{"a":{"a":[6],"b":{"a":[6],"b":"f","c":"f","d":[6]},"c":{"a":"f","b":"f","c":[19],"d":"f"},"d":[6]},"b":[19],"c":[19],"d":{"a":{"a":[6],"b":[6],"c":"f","d":"f"},"b":{"a":"f","b":[19],"c":[19],"d":"f"},"c":[19],"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[19],"b":[19],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[10],"d":[10]},"d":{"a":[10],"b":"f","c":"f","d":[10]}},"b":{"a":{"a":[19],"b":[19],"c":"f","d":"f"},"b":{"a":[19],"b":[19],"c":"f","d":"f"},"c":{"a":[31],"b":"f","c":"f","d":[31]},"d":{"a":[10],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[31],"d":[31]},"b":{"a":[31],"b":"f","c":"f","d":[31]},"c":[31],"d":{"a":"f","b":[31],"c":[31],"d":"f"}},"d":{"a":[10],"b":{"a":[10],"b":"f","c":"f","d":[10]},"c":{"a":[10],"b":"f","c":[10],"d":[10]},"d":[10]}},"d":{"a":{"a":{"a":[29],"b":[29],"c":[29],"d":"f"},"b":[29],"c":[29],"d":{"a":"f","b":[29],"c":[29],"d":"f"}},"b":{"a":{"a":[29],"b":"f","c":[29],"d":[29]},"b":{"a":"f","b":[10],"c":[10],"d":"f"},"c":{"a":"f","b":[10],"c":[10],"d":"f"},"d":[29]},"c":{"a":[29],"b":{"a":"f","b":[10],"c":[10],"d":"f"},"c":{"a":"f","b":[10],"c":[10],"d":"f"},"d":[29]},"d":[29]}}},"d":{"a":{"a":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[40],"b":"f","c":"f","d":"f"},"d":[40]},"b":{"a":{"a":"f","b":[2],"c":[2],"d":[2]},"b":[2],"c":[2],"d":[2]},"c":[2],"d":{"a":{"a":[40],"b":[40],"c":"f","d":[40]},"b":{"a":"f","b":[2],"c":[2],"d":"f"},"c":[2],"d":{"a":"f","b":"f","c":[2],"d":"f"}}},"b":{"a":[2],"b":{"a":[2],"b":{"a":"f","b":[27],"c":"f","d":"f"},"c":{"a":[2],"b":"f","c":"f","d":[2]},"d":[2]},"c":{"a":[2],"b":{"a":[2],"b":"f","c":"f","d":[2]},"c":{"a":[2],"b":"f","c":"f","d":[2]},"d":[2]},"d":[2]},"c":{"a":[2],"b":{"a":[2],"b":{"a":[2],"b":"f","c":[2],"d":[2]},"c":{"a":[2],"b":"f","c":"f","d":[2]},"d":[2]},"c":{"a":[2],"b":{"a":"f","b":"f","c":[25],"d":"f"},"c":{"a":"f","b":[25],"c":[25],"d":"f"},"d":[2]},"d":[2]},"d":[2]},"b":{"a":{"a":{"a":{"a":"f","b":"f","c":[25],"d":"f"},"b":{"a":"f","b":[27],"c":[27],"d":"f"},"c":{"a":"f","b":[27],"c":"f","d":"f"},"d":{"a":"f","b":[25],"c":[25],"d":[25]}},"b":{"a":[27],"b":[27],"c":{"a":[27],"b":[27],"c":"f","d":"f"},"d":{"a":[27],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[25],"d":[25]},"b":{"a":"f","b":"f","c":"f","d":[25]},"c":[25],"d":[25]},"d":{"a":[25],"b":{"a":[25],"b":"f","c":[25],"d":[25]},"c":[25],"d":{"a":[25],"b":[25],"c":[25],"d":"f"}}},"b":{"a":{"a":[27],"b":[27],"c":{"a":[27],"b":"f","c":"f","d":"f"},"d":{"a":[27],"b":[27],"c":[27],"d":"f"}},"b":{"a":[27],"b":{"a":[27],"b":"f","c":"f","d":[27]},"c":{"a":"f","b":"f","c":[6],"d":"f"},"d":{"a":"f","b":[27],"c":[27],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[6],"c":[6],"d":"f"},"c":{"a":"f","b":[6],"c":[6],"d":"f"},"d":{"a":[25],"b":"f","c":"f","d":[25]}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[25],"c":[25],"d":"f"},"c":[25],"d":[25]}},"c":{"a":{"a":[25],"b":[25],"c":{"a":[25],"b":"f","c":"f","d":[25]},"d":[25]},"b":{"a":{"a":"f","b":"f","c":[6],"d":"f"},"b":[6],"c":[6],"d":{"a":"f","b":[6],"c":[6],"d":[6]}},"c":[6],"d":{"a":[25],"b":{"a":"f","b":"f","c":[6],"d":"f"},"c":{"a":"f","b":[6],"c":[6],"d":[6]},"d":{"a":[25],"b":"f","c":"f","d":[25]}}},"d":{"a":{"a":{"a":"f","b":[25],"c":"f","d":"f"},"b":[25],"c":[25],"d":{"a":"f","b":[25],"c":[25],"d":[25]}},"b":[25],"c":[25],"d":[25]}},"c":{"a":{"a":[25],"b":{"a":[25],"b":[25],"c":{"a":"f","b":[25],"c":"f","d":"f"},"d":{"a":[25],"b":"f","c":"f","d":[25]}},"c":{"a":{"a":"f","b":"f","c":[34],"d":"f"},"b":[34],"c":[34],"d":{"a":"f","b":[34],"c":[34],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[25],"b":[25],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[26],"d":[26]},"d":[26]}},"b":{"a":{"a":{"a":[25],"b":"f","c":"f","d":"f"},"b":{"a":[6],"b":"f","c":"f","d":"f"},"c":[34],"d":{"a":"f","b":[34],"c":[34],"d":"f"}},"b":{"a":{"a":[6],"b":[6],"c":"f","d":"f"},"b":[6],"c":{"a":"f","b":"f","c":"f","d":[34]},"d":{"a":"f","b":"f","c":[34],"d":[34]}},"c":{"a":[34],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[34],"b":"f","c":"f","d":[34]},"d":[34]},"d":[34]},"c":{"a":[34],"b":{"a":[34],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[34]},"d":[34]},"c":{"a":[34],"b":{"a":[34],"b":"f","c":"f","d":[34]},"c":{"a":[34],"b":"f","c":"f","d":"f"},"d":[34]},"d":[34]},"d":{"a":{"a":[26],"b":{"a":[26],"b":[26],"c":"f","d":[26]},"c":{"a":[26],"b":"f","c":"f","d":[26]},"d":[26]},"b":{"a":{"a":"f","b":[34],"c":[34],"d":"f"},"b":[34],"c":[34],"d":{"a":[34],"b":[34],"c":[34],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[34],"c":[34],"d":{"a":[26],"b":"f","c":"f","d":[26]}},"d":[26]}},"d":{"a":{"a":{"a":{"a":[2],"b":[2],"c":"f","d":"f"},"b":[2],"c":{"a":"f","b":[2],"c":"f","d":"f"},"d":{"a":[40],"b":"f","c":[40],"d":[40]}},"b":{"a":[2],"b":[2],"c":{"a":[2],"b":[2],"c":[2],"d":"f"},"d":{"a":[2],"b":[2],"c":"f","d":[2]}},"c":{"a":{"a":"f","b":"f","c":[42],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[42]},"c":{"a":[42],"b":"f","c":[42],"d":[42]},"d":{"a":"f","b":"f","c":"f","d":[40]}},"d":{"a":[40],"b":{"a":[40],"b":"f","c":[40],"d":[40]},"c":[40],"d":[40]}},"b":{"a":{"a":[2],"b":[2],"c":{"a":[2],"b":[2],"c":"f","d":[2]},"d":[2]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[25],"c":[25],"d":[25]},"c":{"a":"f","b":"f","c":"f","d":[42]},"d":{"a":"f","b":"f","c":[42],"d":"f"}},"c":{"a":[42],"b":{"a":[42],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[26],"d":"f"},"d":[42]},"d":{"a":{"a":[2],"b":[2],"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[42],"d":"f"},"c":[42],"d":{"a":"f","b":[42],"c":[42],"d":[42]}}},"c":{"a":[42],"b":{"a":[42],"b":{"a":"f","b":[26],"c":[26],"d":"f"},"c":{"a":"f","b":[26],"c":[26],"d":"f"},"d":[42]},"c":{"a":[42],"b":{"a":"f","b":[26],"c":"f","d":"f"},"c":{"a":[42],"b":"f","c":"f","d":[42]},"d":[42]},"d":[42]},"d":{"a":{"a":[40],"b":[40],"c":[40],"d":{"a":[40],"b":[40],"c":[40],"d":"f"}},"b":{"a":{"a":[40],"b":"f","c":"f","d":[40]},"b":[42],"c":[42],"d":{"a":[40],"b":"f","c":"f","d":[40]}},"c":{"a":{"a":[40],"b":"f","c":"f","d":[40]},"b":[42],"c":[42],"d":{"a":[40],"b":"f","c":"f","d":[40]}},"d":{"a":{"a":"f","b":"f","c":"f"},"b":[40],"c":{"a":"f","b":[40],"c":[40],"d":"f"},"d":{"b":"f"}}}}}},"d":{"a":{"a":{"a":{"a":{"a":{"a":[231],"b":"f","c":"f","d":"f"},"b":[250],"c":{"a":[250],"b":[250],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}},"b":[250],"c":{"a":[250],"b":[250],"c":[250],"d":{"a":"f","b":[250],"c":"f","d":"f"}},"d":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}},"b":[250],"c":{"a":[250],"b":[250],"c":[250],"d":{"a":{"a":"f","b":[250],"c":[250],"d":"f"},"b":[250],"c":{"a":[250],"b":[250],"c":[250],"d":"f"},"d":{"a":"f","b":"f","c":"f"}}},"d":{"b":{"a":{"b":"f"},"b":{"a":"f","b":[250],"c":[250],"d":"f"},"c":{"a":"f","b":"f","c":"f"}},"c":{"b":{"b":"f"}}}},"b":{"a":[250],"b":{"a":[250],"b":{"a":{"a":[250],"b":[250],"c":"f","d":[250]},"b":{"a":"f","d":"f"},"d":{"a":[250],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[250],"b":[250],"c":"f","d":"f"},"d":{"a":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}}},"d":[250]},"c":{"a":{"a":[250],"b":{"a":[250],"b":{"a":[250],"b":[250],"c":"f","d":[250]},"c":{"a":[250],"b":"f","c":"f","d":[250]},"d":[250]},"c":{"a":[250],"b":{"a":[250],"b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[250]},"d":[250]},"b":{"a":{"a":{"a":"f","d":"f"}}},"c":{"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"a":[250],"b":{"a":[250],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[250],"b":[250],"c":"f","d":[250]}},"c":{"a":{"a":[250],"b":"f","c":"f","d":[250]},"c":{"b":"f","c":"f"},"d":{"a":[250],"b":"f","c":"f","d":"f"}},"d":[250]}},"d":{"b":{"a":{"b":{"a":"f","b":[250],"c":"f","d":"f"},"c":{"b":"f"}},"b":{"a":[250],"b":[250],"c":[250],"d":{"a":"f","b":[250],"c":"f","d":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[250],"c":[250],"d":{"b":"f","c":"f"}}},"c":{"b":{"a":{"b":"f","c":"f"},"b":[250],"c":[250],"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[250],"c":{"a":"f","b":[250],"c":[250],"d":"f"},"d":{"b":"f","c":"f"}}}}},"b":{"a":{"b":{"a":{"b":{"a":"f","b":[259],"c":[259],"d":"f"},"c":{"a":"f","b":"f","c":"f"}},"b":[259],"c":{"a":{"a":"f","b":[259],"c":[259],"d":[259]},"b":[259],"c":[259],"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}},"c":{"b":{"a":{"b":"f","c":"f"},"b":[259],"c":{"a":"f","b":[259],"c":"f","d":"f"},"d":{"b":"f"}},"c":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}}},"b":{"a":{"a":{"a":{"a":"f","b":"f","c":[271],"d":"f"},"b":[271],"c":[271],"d":{"a":"f","b":"f","c":"f","d":[259]}},"b":[271],"c":[271],"d":{"a":{"a":[259],"b":"f","c":"f","d":[259]},"b":[271],"c":{"a":[271],"b":[271],"c":"f","d":"f"},"d":{"a":[259],"b":"f","c":"f","d":[259]}}},"b":[271],"c":{"a":{"a":[271],"b":[271],"c":{"a":[271],"b":[271],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[211]}},"b":[271],"c":{"a":{"a":[271],"b":[271],"c":[271],"d":"f"},"b":[271],"c":{"a":"f","b":"f","c":[211],"d":[211]},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":[211],"b":{"a":[211],"b":"f","c":"f","d":[211]},"c":[211],"d":[211]}},"d":{"a":{"a":[259],"b":{"a":[259],"b":"f","c":[259],"d":[259]},"c":[259],"d":[259]},"b":{"a":{"a":"f","b":[271],"c":"f","d":"f"},"b":{"a":[271],"b":[271],"c":[271],"d":"f"},"c":{"a":"f","b":"f","c":[211],"d":[211]},"d":{"a":[259],"b":"f","c":"f","d":[259]}},"c":{"a":{"a":[259],"b":"f","c":"f","d":[259]},"b":[211],"c":[211],"d":{"a":"f","b":"f","c":[211],"d":"f"}},"d":{"a":[259],"b":[259],"c":[259],"d":{"a":"f","b":"f","c":"f"}}}},"c":{"a":{"a":{"a":{"b":"f"},"b":{"a":"f","b":"f"}},"b":{"a":{"a":"f","b":[211],"c":"f","d":"f"},"b":[211],"c":[211],"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f"},"b":{"a":"f","b":[211],"c":"f","d":"f"}}},"b":{"a":[211],"b":[211],"c":[211],"d":{"a":{"a":[211],"b":[211],"c":[211],"d":"f"},"b":[211],"c":{"a":[211],"b":[211],"c":[211],"d":"f"},"d":{"a":"f","b":"f","c":"f"}}},"c":{"a":{"b":{"a":"f","b":"f"}},"b":{"a":{"a":"f","b":[211],"c":"f","d":"f"},"b":[211],"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}},"c":{"b":{"b":"f"},"d":{"c":"f","d":"f"}},"d":{"a":{"d":"f"},"c":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[40]}}},"d":{"a":{"c":{"c":"f","d":"f"}},"b":{"d":{"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":[40],"c":"f","d":"f"},"d":{"a":"f","b":"f"}},"d":{"b":{"a":"f","b":[211],"c":"f","d":"f"}}}}},"c":{"b":{"a":{"b":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}},"b":{"a":[40],"b":{"a":{"a":[40],"b":"f","c":"f","d":[40]},"b":{"a":"f","b":"f","c":"f","d":[40]},"c":[40],"d":[40]},"c":{"a":[40],"b":[40],"c":{"a":[40],"b":[40],"c":"f","d":[40]},"d":[40]},"d":{"a":[40],"b":[40],"c":[40],"d":{"a":"f","b":[40],"c":[40],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":[40],"c":[40],"d":"f"},"b":{"a":[40],"b":[40],"c":"f","d":[40]},"c":[40],"d":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":[40],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[2],"d":[2]},"c":[2],"d":{"a":"f","b":[2],"c":"f","d":"f"}},"c":{"a":{"a":[40],"b":"f","c":"f","d":[40]},"b":{"a":[2],"b":[2],"c":[2],"d":"f"},"c":{"a":"f","b":[2],"c":"f","d":"f"},"d":[40]},"d":{"a":{"b":"f","c":"f"},"b":[40],"c":{"a":"f","b":[40],"c":[40],"d":"f"},"d":{"b":"f"}}}},"c":{"b":{"a":{"b":{"a":"f","b":[40],"c":"f","d":"f"},"c":{"b":"f","c":"f"}},"b":{"a":[40],"b":{"a":[40],"b":"f","c":"f","d":[40]},"c":[40],"d":[40]},"c":{"a":{"a":"f","b":[40],"c":[40],"d":"f"},"b":[40],"c":[40],"d":{"a":"f","b":"f","c":"f"}},"d":{"b":{"b":"f"}}},"c":{"b":{"a":{"b":"f"},"b":{"a":"f","b":[40],"c":[40],"d":"f"},"c":{"a":"f","b":"f","c":"f"}}}}},"d":{"a":{"b":{"b":{"a":{"b":"f","c":"f"},"b":{"a":[250],"b":[250],"c":[250],"d":"f"},"c":{"a":"f","b":[250],"c":[250],"d":"f"},"d":{"c":"f"}},"c":{"a":{"a":"f","b":"f","c":[229],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","d":"f"},"d":{"a":"f","b":[229],"c":[229],"d":"f"}},"d":{"c":{"c":"f"}}},"c":{"a":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"b":{"a":[229],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[229]},"c":{"a":[229],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":[229],"c":"f","d":"f"}},"d":{"b":{"b":"f","c":"f"},"c":{"b":"f"}}}},"b":{"a":{"a":{"a":[250],"b":[250],"c":{"a":[250],"b":[250],"c":"f","d":[250]},"d":[250]},"b":{"a":{"a":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"c":{"c":"f"}},"d":{"a":[250],"b":{"a":[250],"b":"f","c":"f","d":[250]},"c":{"a":[250],"b":"f","c":"f","d":[250]},"d":{"a":"f","b":[250],"c":[250],"d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"b":"f"},"d":{"d":"f"}}},"c":{"a":{"a":{"a":"f","d":"f"},"d":{"d":"f"}},"d":{"a":{"a":"f","c":"f","d":"f"},"d":{"a":[384],"b":"f","c":"f","d":[384]}}},"d":{"a":{"a":{"a":"f","b":[250],"c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"}},"b":{"b":{"b":"f","c":"f"},"c":{"c":"f"}},"c":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}}}},"c":{"a":{"b":{"b":{"a":"f","b":"f","c":[384],"d":"f"},"c":{"a":"f","b":[384],"c":[384],"d":"f"}},"c":{"b":{"a":"f","b":[384],"c":[384],"d":"f"},"c":{"a":"f","b":[384],"c":[384],"d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}}},"d":{"b":{"b":{"a":"f","b":[384],"c":"f","d":"f"},"c":{"b":"f","c":"f"}},"c":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}}}}}}},"d":{"a":{"b":{"a":{"b":{"b":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":"f","c":[287],"d":"f"},"c":{"a":"f","b":[287],"c":[287],"d":"f"}},"c":{"b":{"a":"f","b":"f","c":"f"}}}},"b":{"a":{"a":{"a":{"a":"f","c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":{"a":"f","b":[283],"c":[283],"d":[283]},"d":{"a":"f","b":"f","c":"f","d":[287]}},"b":{"a":{"a":"f","b":[283],"c":[283],"d":"f"},"b":{"a":[283],"b":"f","c":"f","d":[283]},"c":{"a":[283],"b":"f","c":"f","d":[283]},"d":[283]},"c":{"a":[283],"b":[283],"c":{"a":[283],"b":[283],"c":"f","d":"f"},"d":{"a":[283],"b":[283],"c":"f","d":[283]}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[283],"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}}},"b":{"a":{"d":{"d":"f"}},"b":{"a":{"b":"f","c":"f"},"b":{"a":[289],"b":[289],"c":[289],"d":"f"},"c":{"a":"f","b":[289],"c":"f","d":"f"}},"c":{"b":{"b":"f","c":"f"}},"d":{"a":{"a":"f","c":"f","d":"f"},"c":{"d":"f"},"d":{"a":[283],"b":"f","c":"f","d":[283]}}},"c":{"a":{"a":{"a":[283],"b":[283],"c":[283],"d":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":[283],"b":"f","c":"f","d":[283]},"d":{"a":[283],"b":"f","c":"f","d":[283]}}},"d":{"a":{"b":{"b":"f","c":"f"}},"b":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":[283],"d":"f"}},"c":{"a":{"c":"f"},"b":{"a":"f","b":[283],"c":[283],"d":"f"},"c":[283],"d":{"b":"f","c":"f"}}}},"c":{"a":{"b":{"a":{"b":"f","c":"f"},"b":{"a":[283],"b":[283],"c":[283],"d":"f"},"c":{"a":"f","b":[283],"c":[283],"d":"f"}},"c":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f"}}},"b":{"a":{"a":{"a":[283],"b":"f","c":[283],"d":[283]},"b":{"a":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[283]},"d":[283]},"b":{"d":{"c":"f","d":"f"}},"c":{"a":{"a":[283],"b":"f","c":"f","d":[283]},"c":{"d":"f"},"d":{"a":[283],"b":"f","c":"f","d":[283]}},"d":[283]},"c":{"a":[283],"b":{"a":[283],"b":{"a":"f","b":"f","c":"f","d":[283]},"c":[283],"d":[283]},"c":{"a":{"a":[283],"b":[283],"c":[283],"d":"f"},"b":[283],"c":[283],"d":{"a":"f","b":"f","c":"f"}},"d":{"a":{"a":"f","b":[283],"c":"f","d":"f"},"b":{"a":[283],"b":[283],"c":"f","d":[283]},"c":{"a":"f","b":"f","d":"f"},"d":{"b":"f","c":"f"}}},"d":{"b":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"c":{"b":{"b":"f"}}}}},"c":{"b":{"b":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"b":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}}}},"c":{"a":{"b":{"a":{"b":"f","c":"f"},"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f"},"c":{"c":"f","d":"f"}}},"d":{"b":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}}}},"d":{"d":{"b":{"d":{"a":"f","b":"f","c":"f","d":"f"}}}}}},"b":{"a":{"a":{"a":{"a":[289],"b":{"a":{"a":"f","b":"f","c":"f","d":[289]},"b":[275],"c":[275],"d":{"a":[289],"b":"f","c":"f","d":[289]}},"c":{"a":{"a":[289],"b":"f","c":"f","d":[289]},"b":{"a":[275],"b":[275],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":[289],"b":[289],"c":[289],"d":"f"},"b":[289],"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f"}}},"b":{"a":[275],"b":[275],"c":[275],"d":{"a":[275],"b":[275],"c":[275],"d":{"a":[275],"b":[275],"c":[275],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":[267]},"b":{"a":[275],"b":[275],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":[267],"d":[267]},"d":{"a":[267],"b":"f","c":[267],"d":[267]}},"b":{"a":{"a":[275],"b":[275],"c":[275],"d":"f"},"b":[275],"c":[275],"d":{"a":"f","b":[275],"c":"f","d":"f"}},"c":{"a":{"a":[267],"b":"f","c":[267],"d":[267]},"b":{"a":"f","b":[275],"c":"f","d":"f"},"c":{"a":[267],"b":"f","c":"f","d":[267]},"d":[267]},"d":{"a":{"a":"f","b":[267],"c":[267],"d":"f"},"b":[267],"c":{"a":[267],"b":[267],"c":[267],"d":"f"},"d":{"a":"f","b":"f","c":"f"}}},"d":{"b":{"a":{"b":"f"},"b":{"a":"f","b":[267],"c":"f","d":"f"},"c":{"b":"f","c":"f"}},"c":{"b":{"b":"f"}}}},"b":{"a":[275],"b":{"a":[275],"b":{"a":{"a":[275],"b":"f","c":[275],"d":[275]},"b":{"a":"f","b":"f","c":[275],"d":[275]},"c":[275],"d":[275]},"c":[275],"d":[275]},"c":[275],"d":{"a":[275],"b":[275],"c":[275],"d":{"a":[275],"b":[275],"c":[275],"d":{"a":[275],"b":[275],"c":[275],"d":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","b":[275],"c":"f","d":"f"},"b":{"a":[275],"b":[275],"c":[275],"d":"f"},"c":{"a":"f","b":"f","c":"f"}},"b":[275],"c":[275],"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":[275],"d":[275]},"c":[275],"d":{"b":"f","c":"f"}}},"b":[275],"c":[275],"d":{"a":{"a":{"b":"f"},"b":{"a":"f","b":[275],"c":"f","d":"f"},"c":{"b":"f"}},"b":{"a":[275],"b":[275],"c":[275],"d":{"a":"f","b":[275],"c":[275],"d":"f"}},"c":{"a":{"a":"f","b":[275],"c":[275],"d":"f"},"b":[275],"c":[275],"d":[275]},"d":{"b":{"c":"f"},"c":{"b":"f","c":"f"}}}},"d":{"a":{"c":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"a":"f","b":"f"}}},"b":{"a":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":[267],"c":[267],"d":[267]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":[267],"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":[267]},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","d":"f"},"d":{"a":[274],"b":"f","c":"f","d":[274]}},"d":{"a":{"a":"f","b":[274],"c":[274],"d":"f"},"b":{"a":[274],"b":"f","c":[274],"d":[274]},"c":[274],"d":[274]}},"c":{"a":[274],"b":{"a":{"a":[274],"b":"f","c":"f","d":[274]},"d":{"a":[274],"b":"f","c":"f","d":[274]}},"c":{"a":{"a":[274],"b":"f","c":[274],"d":[274]},"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[274],"b":[274],"c":"f","d":[274]}},"d":{"a":{"a":"f","b":[274],"c":[274],"d":"f"},"b":[274],"c":{"a":[274],"b":[274],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"a":{"a":{"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[283]},"d":{"a":"f","b":"f","c":[283],"d":[283]}},"b":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"},"d":{"d":"f"}},"c":{"a":{"a":"f","b":"f","c":[283],"d":[283]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[283],"b":"f","c":"f","d":[283]},"d":[283]},"d":[283]}}},"b":{"a":{"a":{"a":{"a":{"a":"f","b":"f","c":"f","d":[275]},"b":[285],"c":[285],"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":[285],"c":{"a":[285],"b":[285],"c":{"a":[285],"b":[285],"c":"f","d":"f"},"d":{"a":"f","b":[285],"c":"f","d":"f"}},"d":{"a":{"a":[275],"b":"f","c":[275],"d":[275]},"b":{"a":"f","b":[285],"c":[285],"d":"f"},"c":{"a":"f","b":"f","c":[275],"d":[275]},"d":[275]}},"b":{"a":[285],"b":[285],"c":{"a":[285],"b":[285],"c":{"a":[285],"b":"f","c":"f","d":"f"},"d":[285]},"d":{"a":[285],"b":[285],"c":[285],"d":{"a":[285],"b":[285],"c":[285],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":"f","d":[275]},"b":{"a":[285],"b":"f","c":"f","d":"f"},"c":[275],"d":[275]},"b":{"a":{"a":"f","b":"f","c":[275],"d":"f"},"b":{"a":"f","b":[275],"c":[275],"d":[275]},"c":[275],"d":[275]},"c":[275],"d":[275]},"d":[275]},"b":{"a":{"a":[285],"b":{"a":{"a":"f","b":[240],"c":[240],"d":"f"},"b":[240],"c":{"a":[240],"b":[240],"c":"f","d":[240]},"d":{"a":"f","b":[240],"c":[240],"d":"f"}},"c":{"a":{"a":"f","b":[240],"c":[240],"d":"f"},"b":{"a":[240],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[275]},"d":{"a":"f","b":"f","c":[275],"d":[275]}},"d":{"a":[285],"b":[285],"c":{"a":"f","b":"f","c":[275],"d":[275]},"d":{"a":"f","b":"f","c":[275],"d":[275]}}},"b":{"a":{"a":{"a":[240],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[275,286],"d":[275,286]},"c":[286,275],"d":{"a":"f","b":[275,286],"c":[275,286],"d":"f"}},"b":[275,286],"c":[275,286],"d":[275,286]},"c":{"a":{"a":{"a":[275,286],"b":[275,286],"c":"f","d":"f"},"b":[286,275],"c":{"a":"f","b":[275,286],"c":[275,286],"d":"f"},"d":{"a":[275],"b":"f","c":[275],"d":[275]}},"b":[275,286],"c":{"a":{"a":[275,286],"b":[275,286],"c":[275,286],"d":"f"},"b":[286,275],"c":[286,275],"d":{"a":"f","b":[275,286],"c":[275,286],"d":"f"}},"d":{"a":[275],"b":{"a":"f","b":"f","c":"f","d":[275]},"c":[275],"d":[275]}},"d":{"a":[275],"b":{"a":[275],"b":{"a":[275],"b":"f","c":"f","d":[275]},"c":[275],"d":[275]},"c":[275],"d":[275]}},"c":{"a":[275],"b":{"a":[275],"b":{"a":{"a":"f","b":[275,286],"c":"f","d":"f"},"b":{"a":[275,286],"b":[275,286],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[275]},"d":[275]},"c":{"a":[275],"b":{"a":"f","b":"f","c":[275,286],"d":"f"},"c":{"a":"f","b":[275,286],"c":[275,286],"d":"f"},"d":[275]},"d":[275]},"c":{"a":[275],"b":{"a":[275],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":[275],"d":[275]},"c":[275],"d":[275]},"d":[275]},"d":[275]},"c":{"a":[275],"b":{"a":[275],"b":[275],"c":{"a":[275],"b":[275],"c":{"a":[275],"b":[275],"c":{"a":[275],"b":[275],"c":"f","d":[275]},"d":{"a":[275],"b":[275],"c":[275],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[275],"b":[275],"c":[275],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[250]},"d":[250]}},"d":{"a":[275],"b":[275],"c":{"a":[275],"b":{"a":[275],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[250],"c":[250],"d":"f"},"d":{"a":[275],"b":"f","c":"f","d":"f"}},"d":[275]}},"c":{"a":{"a":{"a":[275],"b":{"a":[275],"b":[275],"c":"f","d":[275]},"c":{"a":[275],"b":"f","c":"f","d":[275]},"d":[275]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[250],"b":[250],"c":[250],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[291]},"d":{"a":[291],"b":"f","c":[291],"d":[291]}},"c":{"a":[291],"b":[291],"c":[291],"d":{"a":"f","b":[291],"c":[291],"d":"f"}},"d":{"a":[275],"b":{"a":[275],"b":"f","c":"f","d":[275]},"c":{"a":[275],"b":"f","c":[275],"d":[275]},"d":[275]}},"b":{"a":{"a":[250],"b":[250],"c":[250],"d":{"a":[250],"b":[250],"c":[250],"d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":[250]},"b":{"a":"f","b":"f","c":[282],"d":[282]},"c":{"a":[282],"b":[282],"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":[250],"d":{"a":{"a":"f","b":[250],"c":[250],"d":"f"},"b":[250],"c":[250],"d":{"a":"f","b":[250],"c":"f","d":"f"}}},"c":{"a":{"a":{"a":[291],"b":"f","c":"f","d":[291]},"b":[250],"c":{"a":[250],"b":[250],"c":"f","d":"f"},"d":{"a":[291],"b":"f","c":"f","d":[291]}},"b":{"a":{"a":"f","b":"f","c":[231],"d":"f"},"b":{"a":"f","b":"f","c":[231],"d":[231]},"c":{"a":[231],"b":[231],"c":[231],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[250]}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[231],"c":[231],"d":"f"},"c":{"a":"f","b":[231],"c":[231],"d":[231]},"d":{"a":"f","b":"f","c":[231],"d":"f"}},"d":{"a":[291],"b":{"a":"f","b":"f","c":"f","d":[291]},"c":{"a":[291],"b":"f","c":"f","d":[291]},"d":[291]}},"d":{"a":{"a":[275],"b":[275],"c":{"a":[275],"b":[275],"c":"f","d":[275]},"d":[275]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[291],"c":[291],"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[291],"d":[291]},"b":[291],"c":[291],"d":[291]},"d":{"a":[275],"b":{"a":[275],"b":"f","c":"f","d":[275]},"c":{"a":"f","b":"f","c":[291],"d":"f"},"d":[275]}}},"d":{"a":[275],"b":[275],"c":{"a":[275],"b":[275],"c":{"a":[275],"b":[275],"c":{"a":[275],"b":[275],"c":"f","d":"f"},"d":{"a":[275],"b":[275],"c":"f","d":"f"}},"d":{"a":{"a":[275],"b":[275],"c":"f","d":[275]},"b":{"a":[275],"b":[275],"c":[275],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[222]},"d":{"a":"f","b":"f","c":[222],"d":"f"}}},"d":[275]}},"d":{"a":{"a":{"a":{"a":{"a":"f","b":[283],"c":"f","d":"f"},"b":[283],"c":{"a":"f","b":[283],"c":"f","d":"f"},"d":{"b":"f"}},"b":{"a":[283],"b":{"a":[283],"b":"f","c":[283],"d":[283]},"c":[283],"d":{"a":[283],"b":[283],"c":[283],"d":"f"}},"c":{"a":{"a":"f","b":[283],"c":[283],"d":"f"},"b":{"a":[283],"b":[283],"c":"f","d":[283]},"c":{"a":[283],"b":"f","c":[283],"d":"f"},"d":{"a":"f","b":"f","c":"f"}}},"b":{"a":{"a":{"a":"f","c":"f","d":"f"},"b":{"b":"f","c":"f"},"c":{"b":"f","d":"f"},"d":{"a":[283],"b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f"},"d":{"a":"f","d":"f"}}},"c":{"a":{"a":{"a":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}}},"d":{"b":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f"}},"c":{"b":{"b":"f","c":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}}}},"b":{"a":{"a":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[275],"c":[275],"d":"f"}},"b":[275],"c":[275],"d":{"a":{"c":"f"},"b":{"a":"f","b":[275],"c":[275],"d":"f"},"c":[275],"d":{"b":"f","c":"f","d":"f"}}},"b":[275],"c":[275],"d":{"a":{"a":{"a":"f","b":[275],"c":[275],"d":"f"},"b":[275],"c":[275],"d":{"a":"f","b":[275],"c":"f","d":"f"}},"b":[275],"c":[275],"d":{"a":{"b":"f","c":"f"},"b":[275],"c":{"a":"f","b":[275],"c":[275],"d":"f"},"d":{"b":"f"}}}},"c":{"a":{"a":{"b":{"a":"f","b":[275],"c":"f","d":"f"},"c":{"b":"f","c":"f"}},"b":[275],"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[275],"c":[275],"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"b":{"b":"f"},"c":{"a":"f","c":"f","d":"f"}}},"b":[275],"c":{"a":[275],"b":[275],"c":{"a":[275],"b":[275],"c":[275],"d":{"a":[275],"b":[275],"c":"f","d":[275]}},"d":{"a":{"a":"f","b":[275],"c":[275],"d":"f"},"b":[275],"c":{"a":[275],"b":[275],"c":[275],"d":"f"},"d":{"a":"f","b":"f","c":"f"}}},"d":{"a":{"a":{"c":"f","d":"f"},"b":{"a":"f","b":"f","c":[278],"d":"f"},"c":{"a":"f","b":[278],"c":[278],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[275],"c":[275],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":[278],"b":"f","c":"f","d":[278]}},"c":{"a":[278],"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[278],"b":[278],"c":"f","d":[278]}},"d":{"a":{"a":"f"},"b":{"a":"f","b":[278],"c":[278],"d":"f"},"c":{"a":"f","b":[278],"c":[278],"d":"f"}}}},"d":{"a":{"b":{"b":{"a":"f","b":"f"}},"c":{"a":{"c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":[283]},"c":{"a":"f","b":"f"},"d":{"b":"f"}}},"c":{"b":{"a":{"b":"f","c":"f"},"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}},"c":{"b":{"b":"f"}}},"d":{"b":{"a":{"c":"f"},"d":{"b":"f"}}}}}},"c":{"a":{"b":{"a":{"a":{"b":{"a":"f","b":[278],"c":[278],"d":"f"},"c":{"a":"f","b":"f","d":"f"}},"b":{"a":{"a":[278],"b":"f","c":"f","d":"f"},"d":{"a":"f"}},"d":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[258]},"d":{"b":"f","c":"f"}}},"b":{"a":{"b":{"a":"f","b":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[275],"c":[275],"d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"}}},"c":{"c":{"c":{"c":"f"}}},"d":{"a":{"a":{"b":"f","c":"f"},"b":{"a":[258],"b":"f","c":"f","d":[258]},"c":[258],"d":{"b":"f","c":"f"}},"b":{"a":{"d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[258]},"d":{"a":[258],"b":"f","c":"f","d":[258]}},"d":{"a":{"b":"f","c":"f"},"b":[258],"c":[258],"d":{"b":"f","c":"f"}}}},"c":{"a":{"a":{"a":{"b":"f","c":"f"},"b":[258],"c":[258],"d":{"b":"f","c":"f"}},"b":{"a":{"a":[258],"b":"f","c":"f","d":[258]},"d":{"a":[258],"b":"f","c":"f","d":[258]}},"c":{"a":{"a":[258],"b":"f","c":"f","d":[258]},"d":{"a":[258],"b":"f","c":"f","d":[258]}},"d":{"a":{"b":"f","c":"f","d":"f"},"b":[258],"c":[258],"d":{"a":"f","b":[258],"c":[258],"d":[258]}}},"b":{"b":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"d":{"a":{"a":"f","d":"f"}}},"c":{"c":{"d":{"c":"f"}}},"d":{"a":[258],"b":{"a":{"a":[258],"b":"f","c":"f","d":[258]},"d":{"a":[258],"b":"f","c":"f","d":[258]}},"c":{"a":{"a":[258],"b":"f","c":"f","d":[258]},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":[258]},"d":[258]}},"d":{"b":{"c":{"c":{"b":"f","c":"f","d":"f"}}},"c":{"b":{"b":{"a":"f","b":[258],"c":[258],"d":"f"},"c":{"a":"f","b":[258],"c":[258],"d":"f"},"d":{"c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":[258],"c":[258],"d":{"a":"f","b":"f","c":[258],"d":"f"}}}}},"b":{"a":{"a":{"a":{"a":[275],"b":[275],"c":[275],"d":{"a":[275],"b":[275],"c":[275],"d":"f"}},"b":{"a":[275],"b":{"a":[275],"b":[275],"c":"f","d":[275]},"c":{"a":"f","b":"f","c":[222],"d":"f"},"d":{"a":[275],"b":[275],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f","b":[222],"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":[275],"c":[275],"d":"f"},"b":[275],"c":{"a":[275],"b":"f","c":[275],"d":[275]},"d":{"a":"f","b":"f","c":"f"}}},"b":{"a":{"a":{"a":"f","b":[222],"c":[222],"d":"f"},"b":[222],"c":[222],"d":[222]},"b":{"a":{"a":[222],"b":"f","c":"f","d":[222]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[288]},"d":{"a":[222],"b":"f","c":"f","d":[222]}},"c":{"a":{"a":"f","b":"f","c":[288],"d":"f"},"b":[288],"c":[288],"d":[288]},"d":{"a":{"a":[222],"b":[222],"c":[222],"d":"f"},"b":{"a":[222],"b":"f","c":"f","d":[222]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":[222],"c":"f","d":"f"}}},"c":{"a":{"a":{"b":"f","c":"f"},"b":{"a":[222],"b":"f","c":"f","d":[222]},"c":{"a":"f","b":"f","c":[288],"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","b":[288],"c":[288],"d":"f"},"b":{"a":[288],"b":"f","c":"f","d":[288]},"c":{"a":[288],"b":"f","c":[288],"d":[288]},"d":{"a":[288],"b":[288],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[222]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[222],"b":"f","c":[222],"d":[222]},"d":[222]},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":[288]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[288],"d":"f"}}},"d":{"a":{"a":{"b":"f","c":"f"},"b":{"a":[275],"b":[275],"c":[275],"d":"f"},"c":{"a":"f","b":[275],"c":"f","d":"f"}},"b":{"a":{"a":[275],"b":"f","c":"f","d":[275]},"d":{"a":[275],"b":"f","c":"f","d":[275]}},"c":{"a":{"a":"f","b":"f"},"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f","d":"f"}},"d":{"b":{"b":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}}},"b":{"a":{"a":{"a":{"a":[275],"b":[275],"c":"f","d":[275]},"b":{"a":"f","b":[291],"c":[291],"d":"f"},"c":[291],"d":{"a":"f","b":"f","c":[291],"d":"f"}},"b":[291],"c":{"a":[291],"b":[291],"c":[291],"d":{"a":[291],"b":[291],"c":[291],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":[288]},"b":{"a":[291],"b":[291],"c":[291],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[222]},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"b":{"a":{"a":[291],"b":{"a":[291],"b":"f","c":"f","d":[291]},"c":[291],"d":[291]},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[231],"c":"f","d":"f"},"c":{"b":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":[291],"b":[291],"c":{"a":[291],"b":[291],"c":"f","d":[291]},"d":[291]}},"c":{"a":{"a":[291],"b":{"a":[291],"b":"f","c":"f","d":[291]},"c":{"a":[291],"b":"f","c":"f","d":"f"},"d":[291]},"d":{"a":[291],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[291]}},"d":{"a":{"a":{"a":"f","b":"f","c":[222],"d":"f"},"b":{"a":[222],"b":"f","c":[222],"d":[222]},"c":[222],"d":{"a":"f","b":[222],"c":[222],"d":"f"}},"b":{"a":{"a":"f","b":[291],"c":[291],"d":"f"},"b":[291],"c":[291],"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":[291],"c":{"a":[291],"b":[291],"c":[291],"d":"f"},"d":{"a":"f","b":[291],"c":"f","d":"f"}},"d":{"a":{"a":"f","b":[222],"c":[222],"d":"f"},"b":[222],"c":{"a":[222],"b":[222],"c":"f","d":[222]},"d":{"a":"f","b":[222],"c":[222],"d":[222]}}}},"c":{"a":{"a":{"a":[222],"b":{"a":[222],"b":"f","c":"f","d":[222]},"c":{"a":[222],"b":"f","c":"f","d":[222]},"d":[222]},"b":{"a":{"a":[291],"b":"f","c":"f","d":[291]},"b":{"a":"f","b":[291],"c":"f","d":"f"},"c":{"b":"f","c":"f"},"d":{"a":[291],"b":"f","c":"f","d":[291]}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[291]}},"d":{"a":[222],"b":{"a":[222],"b":"f","c":[222],"d":[222]},"c":{"a":[222],"b":"f","c":"f","d":[222]},"d":[222]}},"b":{"a":{"a":[291],"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"a":[291],"b":"f","c":"f","d":"f"}},"d":{"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f"},"d":{"b":"f"}},"b":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[250]}},"d":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"b":"f","c":"f"}}},"d":{"a":{"a":[222],"b":{"a":"f","b":"f","c":[291],"d":"f"},"c":{"a":"f","b":"f","c":[291],"d":"f"},"d":[222]},"b":{"a":{"a":[291],"b":"f","c":"f","d":[291]},"d":{"a":[291],"b":"f","c":"f","d":[291]}},"c":{"a":{"a":[291],"b":"f","c":"f","d":[291]},"d":{"a":[291],"b":"f","c":"f","d":[291]}},"d":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f","b":[291],"c":[291],"d":"f"},"c":{"a":"f","b":[291],"c":[291],"d":"f"},"d":{"b":"f","c":"f"}}}},"d":{"a":{"a":{"a":{"a":[275],"b":"f","c":"f","d":[275]},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[275],"b":[275],"c":"f","d":"f"}},"b":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":[238]},"c":{"a":[238],"b":"f","c":"f","d":[238]},"d":{"a":"f","b":"f","c":[238],"d":"f"}},"c":{"a":{"a":"f","b":[238],"c":[238],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":[238],"b":"f","c":"f","d":[238]},"d":{"a":"f","b":[238],"c":[238],"d":"f"}}},"b":{"a":{"a":{"a":"f","b":[288],"c":[288],"d":"f"},"b":{"a":[288],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[222],"c":[222],"d":"f"},"d":{"a":[288],"b":[288],"c":"f","d":[288]}},"b":[222],"c":{"a":[222],"b":[222],"c":[222],"d":{"a":"f","b":[222],"c":"f","d":"f"}},"d":{"a":{"a":[288],"b":"f","c":"f","d":[288]},"b":{"a":"f","b":[222],"c":[222],"d":[222]},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":[265],"d":[265]},"b":[265],"c":[265],"d":[265]},"b":{"a":{"a":[265],"b":"f","c":[265],"d":[265]},"b":{"a":"f","b":[222],"c":[222],"d":"f"},"c":{"a":"f","b":[222],"c":[222],"d":"f"},"d":[265]},"c":{"a":{"a":[265],"b":"f","c":"f","d":[265]},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":[265],"b":"f","c":"f","d":[265]}},"d":{"a":{"a":[265],"b":[265],"c":[265],"d":"f"},"b":[265],"c":[265],"d":{"a":"f","b":"f","c":"f","d":[238]}}},"d":{"b":{"a":{"a":"f","b":[238],"c":[238],"d":"f"},"b":{"a":[238],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":[238],"c":[238],"d":"f"}},"c":{"a":{"a":"f","b":[238],"c":[238],"d":"f"},"b":{"a":"f","b":"f","c":"f","d":[238]},"c":[238],"d":{"a":"f","b":[238],"c":[238],"d":"f"}}}}},"c":{"a":{"a":{"b":{"a":{"a":"f","b":[238],"c":[238],"d":"f"},"b":[238],"c":[238],"d":{"a":"f","b":[238],"c":[238],"d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":[238],"b":[238],"c":[238],"d":"f"},"c":{"a":"f","b":"f","c":"f"}},"d":{"d":{"a":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":[265],"c":[265],"d":"f"},"c":{"a":"f","b":"f","c":[238],"d":[238]},"d":[238]},"b":{"a":[265],"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":[238]},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":[238],"b":[238],"c":{"a":[238],"b":[238],"c":"f","d":[238]},"d":{"a":[238],"b":[238],"c":[238],"d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f"},"b":{"a":"f","b":"f"}},"b":{"b":{"b":"f","c":"f"},"c":{"a":"f","b":"f","c":[222],"d":"f"}},"c":{"b":{"a":"f","b":[222],"c":[222],"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[252]},"d":{"b":"f","c":"f","d":"f"}}}},"b":{"a":{"a":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[222]},"d":{"b":"f","c":"f"}},"b":{"a":{"a":[291],"b":"f","c":"f","d":[291]},"d":{"a":[291],"b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"b":"f","c":"f","d":"f"},"b":[222],"c":[222],"d":{"a":"f","b":[222],"c":[222],"d":"f"}}},"b":{"a":{"b":{"b":"f","c":"f"}},"b":{"a":{"a":[250],"b":"f","c":"f","d":"f"},"d":{"a":"f"}},"c":{"a":{"d":"f"},"d":{"a":"f","d":"f"}},"d":{"b":{"c":"f"},"c":{"b":"f","c":"f","d":"f"}}},"c":{"a":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"c":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"a":{"a":{"a":"f","b":[222],"c":[222],"d":[222]},"b":[222],"c":{"a":[222],"b":"f","c":"f","d":"f"},"d":[222]},"b":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"c":{"c":"f"}},"d":{"a":{"a":[222],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":[252],"c":"f","d":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","b":"f","c":"f","d":[252]},"c":{"b":"f","c":"f"},"d":{"a":[252],"b":"f","c":"f","d":[252]}},"b":{"a":{"a":"f","b":"f","c":[242],"d":"f"},"b":{"a":"f","b":"f","c":[242],"d":[242]},"c":[242],"d":{"a":"f","b":[242],"c":[242],"d":[242]}},"c":[242],"d":{"a":{"a":[252],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[242],"d":"f"},"c":[242],"d":{"a":"f","b":"f","c":"f","d":"f"}}},"b":{"a":{"a":{"a":"f","b":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}}},"c":{"a":{"a":{"a":"f"}}},"d":{"a":{"a":{"a":"f","b":[242],"c":[242],"d":[242]},"b":[242],"c":[242],"d":[242]},"b":{"a":[242],"b":{"a":[242],"b":"f","c":"f","d":[242]},"c":{"a":"f","b":"f","d":"f"},"d":[242]},"c":{"a":{"a":[242],"b":[242],"c":"f","d":[242]},"b":{"a":"f","d":"f"},"d":{"a":[242],"b":"f","c":"f","d":[242]}},"d":[242]}},"d":{"a":{"b":{"b":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":[242]},"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":[242],"b":"f","c":[242],"d":[242]},"c":[242],"d":{"a":"f","b":"f","c":[242],"d":"f"}},"d":{"c":{"d":"f"},"d":{"a":"f","b":"f","c":"f","d":[253]}}},"b":{"b":{"a":{"a":"f","b":"f","c":[252],"d":"f"},"b":[252],"c":[252],"d":{"a":"f","b":[252],"c":[252],"d":"f"}},"c":{"a":{"a":"f","b":[252],"c":[252],"d":"f"},"b":[252],"c":[252],"d":{"a":"f","b":[252],"c":[252],"d":"f"}},"d":{"a":{"a":"f","c":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":[242],"b":"f","c":[242],"d":[242]}}},"c":{"a":{"a":[242],"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":[242]},"b":{"a":[252],"b":{"a":[252],"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[242],"c":[242],"d":"f"},"d":{"a":[252],"b":[252],"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[242],"d":[242]},"b":[242],"c":[242],"d":[242]},"d":{"a":[242],"b":{"a":"f","b":"f","c":[242],"d":[242]},"c":[242],"d":[242]}},"d":{"a":{"a":[253],"b":{"a":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":[253]},"d":{"a":[253],"b":[253],"c":[253],"d":"f"}},"b":{"a":{"a":"f","b":[242],"c":[242],"d":"f"},"b":[242],"c":[242],"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":[266],"b":"f","c":[266],"d":[266]},"b":{"a":"f","b":[242],"c":[242],"d":"f"},"c":{"a":"f","b":[242],"c":[242],"d":"f"},"d":[266]},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":[253],"b":"f","c":"f","d":"f"},"c":[266],"d":[266]}}}},"d":{"a":{"b":{"b":{"a":{"a":"f","b":[258],"c":[258],"d":"f"},"b":[258],"c":[258],"d":{"a":"f","b":[258],"c":[258],"d":"f"}},"c":{"a":{"a":"f","b":[258],"c":[258],"d":"f"},"b":[258],"c":[258],"d":{"a":"f","b":[258],"c":[258],"d":[258]}},"d":{"c":{"b":"f","c":"f"}}},"c":{"a":{"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f"}},"b":[258],"c":{"a":{"a":[258],"b":[258],"c":[258],"d":"f"},"b":[258],"c":{"a":[258],"b":"f","c":"f","d":"f"},"d":{"a":"f","b":[258],"c":[258],"d":"f"}},"d":{"b":{"b":"f","c":"f"},"c":{"c":"f"}}},"d":{"a":{"a":{"a":"f","d":"f"},"d":{"a":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f"}}}},"b":{"a":{"a":[258],"b":{"a":[258],"b":{"a":"f","c":"f","d":"f"},"c":{"a":[258],"b":"f","c":"f","d":[258]},"d":[258]},"c":{"a":[258],"b":{"a":[258],"b":"f","c":[258],"d":[258]},"c":[258],"d":[258]},"d":[258]},"b":{"a":{"b":{"b":"f","c":"f","d":"f"},"c":{"b":"f","c":"f"}},"b":{"a":{"b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f"}},"c":{"a":{"b":"f"},"b":{"b":"f"},"c":{"b":"f"}},"d":{"a":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":[258]}}},"c":{"a":{"a":{"a":[258],"b":"f","c":"f","d":[258]},"b":{"a":"f","d":"f"},"c":{"d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"b":{"c":"f"}},"d":{"a":{"a":"f","b":[253],"c":[253],"d":"f"},"b":{"a":"f","c":"f","d":"f"},"c":{"a":[253],"b":"f","c":"f","d":[253]},"d":{"a":"f","b":[253],"c":[253],"d":[253]}}},"d":{"a":[258],"b":[258],"c":{"a":[258],"b":[258],"c":{"a":"f","b":"f","c":[253],"d":"f"},"d":[258]},"d":{"a":[258],"b":[258],"c":{"a":"f","b":[258],"c":[258],"d":"f"},"d":{"a":"f","b":"f"}}}},"c":{"a":{"a":{"b":{"a":"f","b":"f","c":"f"}},"b":{"a":{"a":[258],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":[253],"c":[253],"d":"f"},"c":{"a":"f","b":[253],"c":[253],"d":"f"},"d":{"a":"f","b":"f","c":"f"}},"c":{"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f"}}},"b":{"a":{"a":[253],"b":{"a":[253],"b":"f","c":[253],"d":[253]},"c":{"a":[253],"b":[253],"c":"f","d":"f"},"d":{"a":[253],"b":[253],"c":"f","d":"f"}},"b":{"a":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[253],"d":[253]},"b":{"a":"f","b":"f","c":"f","d":[253]},"c":{"a":[253],"b":"f","c":[253],"d":[253]},"d":{"a":[253],"b":[253],"c":[253],"d":"f"}},"d":{"a":{"a":"f","b":[257],"c":[257],"d":[257]},"b":{"a":[257],"b":"f","c":"f","d":[257]},"c":{"a":[257],"b":"f","c":"f","d":[257]},"d":[257]}},"c":{"a":[257],"b":{"a":{"a":"f","b":[253],"c":[253],"d":"f"},"b":[253],"c":{"a":[253],"b":[253],"c":"f","d":"f"},"d":{"a":"f","b":[253],"c":"f","d":"f"}},"c":{"a":{"a":[257],"b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":[266],"d":"f"},"c":{"a":"f","b":[266],"c":[266],"d":[266]},"d":{"a":"f","b":"f","c":[266],"d":"f"}},"d":[257]},"d":{"a":{"c":{"c":"f","d":"f"}},"b":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[257],"c":[257],"d":"f"},"d":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":[257],"d":[257]},"b":[257],"c":[257],"d":[257]},"d":{"a":{"a":"f","b":"f","c":[257],"d":[257]},"b":{"a":"f","b":[257],"c":[257],"d":[257]},"c":[257],"d":[257]}}},"d":{"a":{"a":{"b":{"b":"f","c":"f"},"c":{"c":"f"}},"b":{"a":{"a":"f"},"d":{"a":"f"}},"c":{"d":{"c":"f","d":"f"}}},"b":{"a":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[257],"c":"f","d":"f"}},"b":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","d":"f"},"c":{"d":"f"},"d":{"a":[257],"b":"f","c":"f","d":[257]}},"c":{"a":[257],"b":{"a":"f","d":"f"},"c":{"a":"f","d":"f"},"d":[257]},"d":{"b":{"b":"f","c":"f","d":"f"},"c":{"a":"f","b":[257],"c":"f","d":"f"},"d":{"b":"f","c":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","c":[243],"d":"f"},"b":{"a":[243],"b":"f","c":"f","d":[243]},"c":[243],"d":{"a":"f","b":[243],"c":[243],"d":"f"}},"b":{"a":{"a":[257],"b":[257],"c":[257],"d":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":[257],"c":"f","d":"f"}},"c":{"a":{"a":[243],"b":"f","c":"f","d":[243]},"b":{"a":[257],"b":"f","c":[257],"d":[257]},"c":[257],"d":{"a":[243],"b":"f","c":"f","d":[243]}},"d":{"a":{"a":"f","b":[243],"c":[243],"d":"f"},"b":[243],"c":[243],"d":[243]}},"d":{"b":{"a":{"a":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"c":"f","d":"f"},"c":[243],"d":{"a":"f","b":[243],"c":[243],"d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":[243],"d":"f"}}}}}},"d":{"a":{"b":{"d":{"a":{"b":{"a":"f","b":"f","c":"f","d":"f"}}}},"c":{"a":{"d":{"d":{"a":"f"}}},"c":{"d":{"d":{"a":"f","b":"f","c":"f","d":"f"}}},"d":{"c":{"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f"}}}},"d":{"b":{"c":{"b":{"c":"f"},"c":{"b":"f","c":"f"}}},"c":{"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"},"c":{"c":"f","d":"f"}}}}},"b":{"b":{"a":{"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"b":"f","c":"f","d":"f"}}},"b":{"c":{"b":{"d":"f"},"c":{"a":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"a":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f"}}},"d":{"a":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"b":"f"}}}},"d":{"b":{"b":{"c":{"b":"f"}}}}},"c":{"a":{"a":{"c":{"c":{"b":"f","c":"f"}}},"b":{"d":{"b":{"d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"a":{"a":"f","b":"f","d":"f"},"b":{"a":"f","b":"f","c":"f"},"c":{"b":"f","c":"f"},"d":{"a":"f","d":"f"}},"b":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"a":"f"},"b":{"b":"f","c":"f"}}},"d":{"a":{"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}},"b":{"a":{"a":"f","d":"f"},"b":{"b":"f","c":"f"},"c":{"b":"f","c":"f","d":"f"}},"c":{"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"b":"f","c":"f","d":"f"}},"d":{"d":{"a":"f","d":"f"}}}},"b":{"a":{"b":{"c":{"c":"f"}},"c":{"b":{"b":"f"}},"d":{"a":{"c":"f","d":"f"},"c":{"a":"f","d":"f"},"d":{"a":"f","b":"f"}}},"b":{"a":{"d":{"b":"f","c":"f","d":"f"}},"c":{"d":{"d":"f"}},"d":{"a":{"a":"f","b":"f"},"b":{"b":"f","c":"f"}}},"c":{"a":{"a":{"a":"f","d":"f"}},"b":{"a":{"a":"f"}}},"d":{"a":{"a":{"d":"f"},"b":{"a":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"}}}},"c":{"c":{"c":{"c":{"c":"f"}}}},"d":{"a":{"a":{"a":{"a":"f"}},"b":{"a":{"a":"f","b":"f","c":"f"},"b":{"a":"f"}},"d":{"b":{"b":"f","c":"f"}}},"d":{"c":{"a":{"a":"f","d":"f"}},"d":{"b":{"b":"f","c":"f"}}}}},"d":{"a":{"b":{"b":{"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}},"c":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}},"c":{"a":{"c":{"b":"f","c":"f"}},"b":{"a":{"a":"f","b":"f","d":"f"},"b":{"c":"f"},"c":{"b":"f","c":"f"},"d":{"a":"f","c":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"},"b":{"c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"b":{"b":"f","c":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"}}}},"b":{"a":{"a":{"a":{"b":"f"},"b":{"a":"f","b":"f"},"c":{"b":"f","c":"f"}},"b":{"d":{"a":"f","d":"f"}},"c":{"a":{"a":"f","d":"f"},"d":{"a":"f","d":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"a":"f","b":"f","c":"f","d":"f"},"d":{"b":"f","c":"f"}}},"b":{"a":{"a":{"a":"f","b":"f"},"c":{"c":"f","d":"f"}},"d":{"b":{"a":"f","b":"f"}}},"c":{"b":{"c":{"c":"f","d":"f"}},"c":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f","b":"f","c":"f","d":"f"},"c":{"c":"f"}},"d":{"b":{"c":"f"},"c":{"b":"f"}}},"d":{"a":{"a":{"a":"f","b":"f","c":"f","d":"f"},"b":{"a":"f"},"d":{"a":"f","b":"f","d":"f"}},"d":{"d":{"c":"f","d":"f"}}}},"c":{"a":{"a":{"a":{"a":"f","b":"f"},"d":{"a":"f","d":"f"}},"b":{"b":{"b":"f","c":"f"}}},"b":{"a":{"a":{"a":"f","d":"f"}}}},"d":{"b":{"b":{"b":{"a":"f","b":"f"},"c":{"b":"f","c":"f"}},"d":{"a":{"c":"f"},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":{"b":"f","c":"f"}}},"c":{"a":{"a":{"c":"f"},"b":{"d":"f"},"c":{"a":"f","d":"f"},"d":{"b":"f","c":"f"}},"d":{"a":{"b":"f","c":"f"},"b":{"a":"f","d":"f"},"c":{"a":"f"},"d":{"a":"f","b":"f","c":"f","d":"f"}}}}}}}}}}
},{}],9:[function(require,module,exports){
var find = require('./lib/find.js')

module.exports = find

},{"./lib/find.js":10}],10:[function(require,module,exports){
(function (__dirname){
var fs = require('fs')
var path = require('path')

var geobuf = require('geobuf')
var inside = require('@turf/boolean-point-in-polygon').default
var Pbf = require('pbf')
var point = require('@turf/helpers').point

var tzData = require('../data/index.json')
const {getTimezoneAtSea, oceanZones} = require('./oceanUtils')

let featureCache

/**
 * Set caching behavior.
 */
function cacheLevel (options) {
  if (
    options && options.store &&
      typeof options.store.get === 'function' &&
      typeof options.store.set === 'function'
  ) {
    featureCache = options.store
  } else {
    featureCache = new Map()
  }
  if (options && options.preload) {
    preCache()
  }
}

cacheLevel()

/**
 * A function that will load all features into an unexpiring cache
 */
function preCache () {
  // shoutout to github user @magwo for an initial version of this recursive function
  var preloadFeaturesRecursive = function (curTzData, quadPos) {
    if (curTzData === 'f') {
      var geoJson = loadFeatures(quadPos)
      featureCache.set(quadPos, geoJson)
    } else if (typeof curTzData === 'object') {
      Object.getOwnPropertyNames(curTzData).forEach(function (value) {
        preloadFeaturesRecursive(curTzData[value], quadPos + value)
      })
    }
  }
  preloadFeaturesRecursive(tzData.lookup, '')
}

var loadFeatures = function (quadPos) {
  // exact boundaries saved in file
  // parse geojson for exact boundaries
  var filepath = quadPos.split('').join('/')
  var data = new Pbf(fs.readFileSync(
    path.join(__dirname, '/../data/', filepath, '/geo.buf'))
  )
  var geoJson = geobuf.decode(data)
  return geoJson
}

var getTimezone = function (originalLat, originalLon) {
  let lat = parseFloat(originalLat)
  let lon = parseFloat(originalLon)

  var err

  // validate latitude
  if (isNaN(lat) || lat > 90 || lat < -90) {
    err = new Error('Invalid latitude: ' + lat)
    throw err
  }

  // validate longitude
  if (isNaN(lon) || lon > 180 || lon < -180) {
    err = new Error('Invalid longitude: ' + lon)
    throw err
  }

  // North Pole should return all ocean zones
  if (lat === 90) {
    return oceanZones.map(zone => zone.tzid)
  }

  // fix edges of the world
  if (lat >= 89.9999) {
    lat = 89.9999
  } else if (lat <= -89.9999) {
    lat = -89.9999
  }

  if (lon >= 179.9999) {
    lon = 179.9999
  } else if (lon <= -179.9999) {
    lon = -179.9999
  }

  var pt = point([lon, lat])
  var quadData = {
    top: 89.9999,
    bottom: -89.9999,
    left: -179.9999,
    right: 179.9999,
    midLat: 0,
    midLon: 0
  }
  var quadPos = ''
  var curTzData = tzData.lookup

  while (true) {
    // calculate next quadtree position
    var nextQuad
    if (lat >= quadData.midLat && lon >= quadData.midLon) {
      nextQuad = 'a'
      quadData.bottom = quadData.midLat
      quadData.left = quadData.midLon
    } else if (lat >= quadData.midLat && lon < quadData.midLon) {
      nextQuad = 'b'
      quadData.bottom = quadData.midLat
      quadData.right = quadData.midLon
    } else if (lat < quadData.midLat && lon < quadData.midLon) {
      nextQuad = 'c'
      quadData.top = quadData.midLat
      quadData.right = quadData.midLon
    } else {
      nextQuad = 'd'
      quadData.top = quadData.midLat
      quadData.left = quadData.midLon
    }

    // console.log(nextQuad)
    curTzData = curTzData[nextQuad]
    // console.log()
    quadPos += nextQuad

    // analyze result of current depth
    if (!curTzData) {
      // no timezone in this quad, therefore must be timezone at sea
      return getTimezoneAtSea(originalLon)
    } else if (curTzData === 'f') {
      // get exact boundaries
      var geoJson = featureCache.get(quadPos)
      if (!geoJson) {
        geoJson = loadFeatures(quadPos)
        featureCache.set(quadPos, geoJson)
      }

      var timezonesContainingPoint = []

      for (var i = 0; i < geoJson.features.length; i++) {
        if (inside(pt, geoJson.features[i])) {
          timezonesContainingPoint.push(geoJson.features[i].properties.tzid)
        }
      }

      // if at least one timezone contained the point, return those timezones,
      // otherwise must be timezone at sea
      return timezonesContainingPoint.length > 0
        ? timezonesContainingPoint
        : getTimezoneAtSea(originalLon)
    } else if (curTzData.length > 0) {
      // exact match found
      return curTzData.map(idx => tzData.timezones[idx])
    } else if (typeof curTzData !== 'object') {
      // not another nested quad index, throw error
      err = new Error('Unexpected data type')
      throw err
    }

    // calculate next quadtree depth data
    quadData.midLat = (quadData.top + quadData.bottom) / 2
    quadData.midLon = (quadData.left + quadData.right) / 2
  }
}

module.exports = getTimezone
module.exports.setCache = cacheLevel

// for backwards compatibility
module.exports.preCache = function () {
  cacheLevel({ preload: true })
}

}).call(this,"/node_modules/geo-tz/lib")
},{"../data/index.json":8,"./oceanUtils":11,"@turf/boolean-point-in-polygon":5,"@turf/helpers":6,"fs":1,"geobuf":14,"path":2,"pbf":16}],11:[function(require,module,exports){
const oceanZones = [
  { tzid: 'Etc/GMT-12', left: 172.5, right: 180 },
  { tzid: 'Etc/GMT-11', left: 157.5, right: 172.5 },
  { tzid: 'Etc/GMT-10', left: 142.5, right: 157.5 },
  { tzid: 'Etc/GMT-9', left: 127.5, right: 142.5 },
  { tzid: 'Etc/GMT-8', left: 112.5, right: 127.5 },
  { tzid: 'Etc/GMT-7', left: 97.5, right: 112.5 },
  { tzid: 'Etc/GMT-6', left: 82.5, right: 97.5 },
  { tzid: 'Etc/GMT-5', left: 67.5, right: 82.5 },
  { tzid: 'Etc/GMT-4', left: 52.5, right: 67.5 },
  { tzid: 'Etc/GMT-3', left: 37.5, right: 52.5 },
  { tzid: 'Etc/GMT-2', left: 22.5, right: 37.5 },
  { tzid: 'Etc/GMT-1', left: 7.5, right: 22.5 },
  { tzid: 'Etc/GMT', left: -7.5, right: 7.5 },
  { tzid: 'Etc/GMT+1', left: -22.5, right: -7.5 },
  { tzid: 'Etc/GMT+2', left: -37.5, right: -22.5 },
  { tzid: 'Etc/GMT+3', left: -52.5, right: -37.5 },
  { tzid: 'Etc/GMT+4', left: -67.5, right: -52.5 },
  { tzid: 'Etc/GMT+5', left: -82.5, right: -67.5 },
  { tzid: 'Etc/GMT+6', left: -97.5, right: -82.5 },
  { tzid: 'Etc/GMT+7', left: -112.5, right: -97.5 },
  { tzid: 'Etc/GMT+8', left: -127.5, right: -112.5 },
  { tzid: 'Etc/GMT+9', left: -142.5, right: -127.5 },
  { tzid: 'Etc/GMT+10', left: -157.5, right: -142.5 },
  { tzid: 'Etc/GMT+11', left: -172.5, right: -157.5 },
  { tzid: 'Etc/GMT+12', left: -180, right: -172.5 }
]

function getTimezoneAtSea (lon) {
  // coordinates along the 180 longitude should return two zones
  if (lon === -180 || lon === 180) {
    return ['Etc/GMT+12', 'Etc/GMT-12']
  }
  const tzs = []
  for (var i = 0; i < oceanZones.length; i++) {
    var z = oceanZones[i]
    if (z.left <= lon && z.right >= lon) {
      tzs.push(z.tzid)
    } else if (z.right < lon) {
      break
    }
  }
  return tzs
}

module.exports.oceanZones = oceanZones
module.exports.getTimezoneAtSea = getTimezoneAtSea

},{}],12:[function(require,module,exports){
'use strict';

module.exports = decode;

var keys, values, lengths, dim, e;

var geometryTypes = [
    'Point', 'MultiPoint', 'LineString', 'MultiLineString',
    'Polygon', 'MultiPolygon', 'GeometryCollection'];

function decode(pbf) {
    dim = 2;
    e = Math.pow(10, 6);
    lengths = null;

    keys = [];
    values = [];
    var obj = pbf.readFields(readDataField, {});
    keys = null;

    return obj;
}

function readDataField(tag, obj, pbf) {
    if (tag === 1) keys.push(pbf.readString());
    else if (tag === 2) dim = pbf.readVarint();
    else if (tag === 3) e = Math.pow(10, pbf.readVarint());

    else if (tag === 4) readFeatureCollection(pbf, obj);
    else if (tag === 5) readFeature(pbf, obj);
    else if (tag === 6) readGeometry(pbf, obj);
}

function readFeatureCollection(pbf, obj) {
    obj.type = 'FeatureCollection';
    obj.features = [];
    return pbf.readMessage(readFeatureCollectionField, obj);
}

function readFeature(pbf, feature) {
    feature.type = 'Feature';
    var f = pbf.readMessage(readFeatureField, feature);
    if (!f.hasOwnProperty('geometry')) f.geometry = null;
    return f;
}

function readGeometry(pbf, geom) {
    return pbf.readMessage(readGeometryField, geom);
}

function readFeatureCollectionField(tag, obj, pbf) {
    if (tag === 1) obj.features.push(readFeature(pbf, {}));

    else if (tag === 13) values.push(readValue(pbf));
    else if (tag === 15) readProps(pbf, obj);
}

function readFeatureField(tag, feature, pbf) {
    if (tag === 1) feature.geometry = readGeometry(pbf, {});

    else if (tag === 11) feature.id = pbf.readString();
    else if (tag === 12) feature.id = pbf.readSVarint();

    else if (tag === 13) values.push(readValue(pbf));
    else if (tag === 14) feature.properties = readProps(pbf, {});
    else if (tag === 15) readProps(pbf, feature);
}

function readGeometryField(tag, geom, pbf) {
    if (tag === 1) geom.type = geometryTypes[pbf.readVarint()];

    else if (tag === 2) lengths = pbf.readPackedVarint();
    else if (tag === 3) readCoords(geom, pbf, geom.type);
    else if (tag === 4) {
        geom.geometries = geom.geometries || [];
        geom.geometries.push(readGeometry(pbf, {}));
    }
    else if (tag === 13) values.push(readValue(pbf));
    else if (tag === 15) readProps(pbf, geom);
}

function readCoords(geom, pbf, type) {
    if (type === 'Point') geom.coordinates = readPoint(pbf);
    else if (type === 'MultiPoint') geom.coordinates = readLine(pbf, true);
    else if (type === 'LineString') geom.coordinates = readLine(pbf);
    else if (type === 'MultiLineString') geom.coordinates = readMultiLine(pbf);
    else if (type === 'Polygon') geom.coordinates = readMultiLine(pbf, true);
    else if (type === 'MultiPolygon') geom.coordinates = readMultiPolygon(pbf);
}

function readValue(pbf) {
    var end = pbf.readVarint() + pbf.pos,
        value = null;

    while (pbf.pos < end) {
        var val = pbf.readVarint(),
            tag = val >> 3;

        if (tag === 1) value = pbf.readString();
        else if (tag === 2) value = pbf.readDouble();
        else if (tag === 3) value = pbf.readVarint();
        else if (tag === 4) value = -pbf.readVarint();
        else if (tag === 5) value = pbf.readBoolean();
        else if (tag === 6) value = JSON.parse(pbf.readString());
    }
    return value;
}

function readProps(pbf, props) {
    var end = pbf.readVarint() + pbf.pos;
    while (pbf.pos < end) props[keys[pbf.readVarint()]] = values[pbf.readVarint()];
    values = [];
    return props;
}

function readPoint(pbf) {
    var end = pbf.readVarint() + pbf.pos,
        coords = [];
    while (pbf.pos < end) coords.push(pbf.readSVarint() / e);
    return coords;
}

function readLinePart(pbf, end, len, closed) {
    var i = 0,
        coords = [],
        p, d;

    var prevP = [];
    for (d = 0; d < dim; d++) prevP[d] = 0;

    while (len ? i < len : pbf.pos < end) {
        p = [];
        for (d = 0; d < dim; d++) {
            prevP[d] += pbf.readSVarint();
            p[d] = prevP[d] / e;
        }
        coords.push(p);
        i++;
    }
    if (closed) coords.push(coords[0]);

    return coords;
}

function readLine(pbf) {
    return readLinePart(pbf, pbf.readVarint() + pbf.pos);
}

function readMultiLine(pbf, closed) {
    var end = pbf.readVarint() + pbf.pos;
    if (!lengths) return [readLinePart(pbf, end, null, closed)];

    var coords = [];
    for (var i = 0; i < lengths.length; i++) coords.push(readLinePart(pbf, end, lengths[i], closed));
    lengths = null;
    return coords;
}

function readMultiPolygon(pbf) {
    var end = pbf.readVarint() + pbf.pos;
    if (!lengths) return [[readLinePart(pbf, end, null, true)]];

    var coords = [];
    var j = 1;
    for (var i = 0; i < lengths[0]; i++) {
        var rings = [];
        for (var k = 0; k < lengths[j]; k++) rings.push(readLinePart(pbf, end, lengths[j + 1 + k], true));
        j += lengths[j] + 1;
        coords.push(rings);
    }
    lengths = null;
    return coords;
}

},{}],13:[function(require,module,exports){
'use strict';

module.exports = encode;

var keys, keysNum, keysArr, dim, e,
    maxPrecision = 1e6;

var geometryTypes = {
    'Point': 0,
    'MultiPoint': 1,
    'LineString': 2,
    'MultiLineString': 3,
    'Polygon': 4,
    'MultiPolygon': 5,
    'GeometryCollection': 6
};

function encode(obj, pbf) {
    keys = {};
    keysArr = [];
    keysNum = 0;
    dim = 0;
    e = 1;

    analyze(obj);

    e = Math.min(e, maxPrecision);
    var precision = Math.ceil(Math.log(e) / Math.LN10);

    for (var i = 0; i < keysArr.length; i++) pbf.writeStringField(1, keysArr[i]);
    if (dim !== 2) pbf.writeVarintField(2, dim);
    if (precision !== 6) pbf.writeVarintField(3, precision);

    if (obj.type === 'FeatureCollection') pbf.writeMessage(4, writeFeatureCollection, obj);
    else if (obj.type === 'Feature') pbf.writeMessage(5, writeFeature, obj);
    else pbf.writeMessage(6, writeGeometry, obj);

    keys = null;

    return pbf.finish();
}

function analyze(obj) {
    var i, key;

    if (obj.type === 'FeatureCollection') {
        for (i = 0; i < obj.features.length; i++) analyze(obj.features[i]);

    } else if (obj.type === 'Feature') {
        if (obj.geometry !== null) analyze(obj.geometry);
        for (key in obj.properties) saveKey(key);

    } else if (obj.type === 'Point') analyzePoint(obj.coordinates);
    else if (obj.type === 'MultiPoint') analyzePoints(obj.coordinates);
    else if (obj.type === 'GeometryCollection') {
        for (i = 0; i < obj.geometries.length; i++) analyze(obj.geometries[i]);
    }
    else if (obj.type === 'LineString') analyzePoints(obj.coordinates);
    else if (obj.type === 'Polygon' || obj.type === 'MultiLineString') analyzeMultiLine(obj.coordinates);
    else if (obj.type === 'MultiPolygon') {
        for (i = 0; i < obj.coordinates.length; i++) analyzeMultiLine(obj.coordinates[i]);
    }

    for (key in obj) {
        if (!isSpecialKey(key, obj.type)) saveKey(key);
    }
}

function analyzeMultiLine(coords) {
    for (var i = 0; i < coords.length; i++) analyzePoints(coords[i]);
}

function analyzePoints(coords) {
    for (var i = 0; i < coords.length; i++) analyzePoint(coords[i]);
}

function analyzePoint(point) {
    dim = Math.max(dim, point.length);

    // find max precision
    for (var i = 0; i < point.length; i++) {
        while (Math.round(point[i] * e) / e !== point[i] && e < maxPrecision) e *= 10;
    }
}

function saveKey(key) {
    if (keys[key] === undefined) {
        keysArr.push(key);
        keys[key] = keysNum++;
    }
}

function writeFeatureCollection(obj, pbf) {
    for (var i = 0; i < obj.features.length; i++) {
        pbf.writeMessage(1, writeFeature, obj.features[i]);
    }
    writeProps(obj, pbf, true);
}

function writeFeature(feature, pbf) {
    if (feature.geometry !== null) pbf.writeMessage(1, writeGeometry, feature.geometry);

    if (feature.id !== undefined) {
        if (typeof feature.id === 'number' && feature.id % 1 === 0) pbf.writeSVarintField(12, feature.id);
        else pbf.writeStringField(11, feature.id);
    }

    if (feature.properties) writeProps(feature.properties, pbf);
    writeProps(feature, pbf, true);
}

function writeGeometry(geom, pbf) {
    pbf.writeVarintField(1, geometryTypes[geom.type]);

    var coords = geom.coordinates;

    if (geom.type === 'Point') writePoint(coords, pbf);
    else if (geom.type === 'MultiPoint') writeLine(coords, pbf, true);
    else if (geom.type === 'LineString') writeLine(coords, pbf);
    else if (geom.type === 'MultiLineString') writeMultiLine(coords, pbf);
    else if (geom.type === 'Polygon') writeMultiLine(coords, pbf, true);
    else if (geom.type === 'MultiPolygon') writeMultiPolygon(coords, pbf);
    else if (geom.type === 'GeometryCollection') {
        for (var i = 0; i < geom.geometries.length; i++) pbf.writeMessage(4, writeGeometry, geom.geometries[i]);
    }

    writeProps(geom, pbf, true);
}

function writeProps(props, pbf, isCustom) {
    var indexes = [],
        valueIndex = 0;

    for (var key in props) {
        if (isCustom && isSpecialKey(key, props.type)) {
            continue;
        }
        pbf.writeMessage(13, writeValue, props[key]);
        indexes.push(keys[key]);
        indexes.push(valueIndex++);
    }
    pbf.writePackedVarint(isCustom ? 15 : 14, indexes);
}

function writeValue(value, pbf) {
    if (value === null) return;

    var type = typeof value;

    if (type === 'string') pbf.writeStringField(1, value);
    else if (type === 'boolean') pbf.writeBooleanField(5, value);
    else if (type === 'object') pbf.writeStringField(6, JSON.stringify(value));
    else if (type === 'number') {
        if (value % 1 !== 0) pbf.writeDoubleField(2, value);
        else if (value >= 0) pbf.writeVarintField(3, value);
        else pbf.writeVarintField(4, -value);
    }
}

function writePoint(point, pbf) {
    var coords = [];
    for (var i = 0; i < dim; i++) coords.push(Math.round(point[i] * e));
    pbf.writePackedSVarint(3, coords);
}

function writeLine(line, pbf) {
    var coords = [];
    populateLine(coords, line);
    pbf.writePackedSVarint(3, coords);
}

function writeMultiLine(lines, pbf, closed) {
    var len = lines.length,
        i;
    if (len !== 1) {
        var lengths = [];
        for (i = 0; i < len; i++) lengths.push(lines[i].length - (closed ? 1 : 0));
        pbf.writePackedVarint(2, lengths);
        // TODO faster with custom writeMessage?
    }
    var coords = [];
    for (i = 0; i < len; i++) populateLine(coords, lines[i], closed);
    pbf.writePackedSVarint(3, coords);
}

function writeMultiPolygon(polygons, pbf) {
    var len = polygons.length,
        i, j;
    if (len !== 1 || polygons[0].length !== 1) {
        var lengths = [len];
        for (i = 0; i < len; i++) {
            lengths.push(polygons[i].length);
            for (j = 0; j < polygons[i].length; j++) lengths.push(polygons[i][j].length - 1);
        }
        pbf.writePackedVarint(2, lengths);
    }

    var coords = [];
    for (i = 0; i < len; i++) {
        for (j = 0; j < polygons[i].length; j++) populateLine(coords, polygons[i][j], true);
    }
    pbf.writePackedSVarint(3, coords);
}

function populateLine(coords, line, closed) {
    var i, j,
        len = line.length - (closed ? 1 : 0),
        sum = new Array(dim);
    for (j = 0; j < dim; j++) sum[j] = 0;
    for (i = 0; i < len; i++) {
        for (j = 0; j < dim; j++) {
            var n = Math.round(line[i][j] * e) - sum[j];
            coords.push(n);
            sum[j] += n;
        }
    }
}

function isSpecialKey(key, type) {
    if (key === 'type') return true;
    else if (type === 'FeatureCollection') {
        if (key === 'features') return true;
    } else if (type === 'Feature') {
        if (key === 'id' || key === 'properties' || key === 'geometry') return true;
    } else if (type === 'GeometryCollection') {
        if (key === 'geometries') return true;
    } else if (key === 'coordinates') return true;
    return false;
}

},{}],14:[function(require,module,exports){
'use strict';

exports.encode = require('./encode');
exports.decode = require('./decode');

},{"./decode":12,"./encode":13}],15:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],16:[function(require,module,exports){
'use strict';

module.exports = Pbf;

var ieee754 = require('ieee754');

function Pbf(buf) {
    this.buf = ArrayBuffer.isView && ArrayBuffer.isView(buf) ? buf : new Uint8Array(buf || 0);
    this.pos = 0;
    this.type = 0;
    this.length = this.buf.length;
}

Pbf.Varint  = 0; // varint: int32, int64, uint32, uint64, sint32, sint64, bool, enum
Pbf.Fixed64 = 1; // 64-bit: double, fixed64, sfixed64
Pbf.Bytes   = 2; // length-delimited: string, bytes, embedded messages, packed repeated fields
Pbf.Fixed32 = 5; // 32-bit: float, fixed32, sfixed32

var SHIFT_LEFT_32 = (1 << 16) * (1 << 16),
    SHIFT_RIGHT_32 = 1 / SHIFT_LEFT_32;

// Threshold chosen based on both benchmarking and knowledge about browser string
// data structures (which currently switch structure types at 12 bytes or more)
var TEXT_DECODER_MIN_LENGTH = 12;
var utf8TextDecoder = typeof TextDecoder === 'undefined' ? null : new TextDecoder('utf8');

Pbf.prototype = {

    destroy: function() {
        this.buf = null;
    },

    // === READING =================================================================

    readFields: function(readField, result, end) {
        end = end || this.length;

        while (this.pos < end) {
            var val = this.readVarint(),
                tag = val >> 3,
                startPos = this.pos;

            this.type = val & 0x7;
            readField(tag, result, this);

            if (this.pos === startPos) this.skip(val);
        }
        return result;
    },

    readMessage: function(readField, result) {
        return this.readFields(readField, result, this.readVarint() + this.pos);
    },

    readFixed32: function() {
        var val = readUInt32(this.buf, this.pos);
        this.pos += 4;
        return val;
    },

    readSFixed32: function() {
        var val = readInt32(this.buf, this.pos);
        this.pos += 4;
        return val;
    },

    // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)

    readFixed64: function() {
        var val = readUInt32(this.buf, this.pos) + readUInt32(this.buf, this.pos + 4) * SHIFT_LEFT_32;
        this.pos += 8;
        return val;
    },

    readSFixed64: function() {
        var val = readUInt32(this.buf, this.pos) + readInt32(this.buf, this.pos + 4) * SHIFT_LEFT_32;
        this.pos += 8;
        return val;
    },

    readFloat: function() {
        var val = ieee754.read(this.buf, this.pos, true, 23, 4);
        this.pos += 4;
        return val;
    },

    readDouble: function() {
        var val = ieee754.read(this.buf, this.pos, true, 52, 8);
        this.pos += 8;
        return val;
    },

    readVarint: function(isSigned) {
        var buf = this.buf,
            val, b;

        b = buf[this.pos++]; val  =  b & 0x7f;        if (b < 0x80) return val;
        b = buf[this.pos++]; val |= (b & 0x7f) << 7;  if (b < 0x80) return val;
        b = buf[this.pos++]; val |= (b & 0x7f) << 14; if (b < 0x80) return val;
        b = buf[this.pos++]; val |= (b & 0x7f) << 21; if (b < 0x80) return val;
        b = buf[this.pos];   val |= (b & 0x0f) << 28;

        return readVarintRemainder(val, isSigned, this);
    },

    readVarint64: function() { // for compatibility with v2.0.1
        return this.readVarint(true);
    },

    readSVarint: function() {
        var num = this.readVarint();
        return num % 2 === 1 ? (num + 1) / -2 : num / 2; // zigzag encoding
    },

    readBoolean: function() {
        return Boolean(this.readVarint());
    },

    readString: function() {
        var end = this.readVarint() + this.pos;
        var pos = this.pos;
        this.pos = end;

        if (end - pos >= TEXT_DECODER_MIN_LENGTH && utf8TextDecoder) {
            // longer strings are fast with the built-in browser TextDecoder API
            return readUtf8TextDecoder(this.buf, pos, end);
        }
        // short strings are fast with our custom implementation
        return readUtf8(this.buf, pos, end);
    },

    readBytes: function() {
        var end = this.readVarint() + this.pos,
            buffer = this.buf.subarray(this.pos, end);
        this.pos = end;
        return buffer;
    },

    // verbose for performance reasons; doesn't affect gzipped size

    readPackedVarint: function(arr, isSigned) {
        if (this.type !== Pbf.Bytes) return arr.push(this.readVarint(isSigned));
        var end = readPackedEnd(this);
        arr = arr || [];
        while (this.pos < end) arr.push(this.readVarint(isSigned));
        return arr;
    },
    readPackedSVarint: function(arr) {
        if (this.type !== Pbf.Bytes) return arr.push(this.readSVarint());
        var end = readPackedEnd(this);
        arr = arr || [];
        while (this.pos < end) arr.push(this.readSVarint());
        return arr;
    },
    readPackedBoolean: function(arr) {
        if (this.type !== Pbf.Bytes) return arr.push(this.readBoolean());
        var end = readPackedEnd(this);
        arr = arr || [];
        while (this.pos < end) arr.push(this.readBoolean());
        return arr;
    },
    readPackedFloat: function(arr) {
        if (this.type !== Pbf.Bytes) return arr.push(this.readFloat());
        var end = readPackedEnd(this);
        arr = arr || [];
        while (this.pos < end) arr.push(this.readFloat());
        return arr;
    },
    readPackedDouble: function(arr) {
        if (this.type !== Pbf.Bytes) return arr.push(this.readDouble());
        var end = readPackedEnd(this);
        arr = arr || [];
        while (this.pos < end) arr.push(this.readDouble());
        return arr;
    },
    readPackedFixed32: function(arr) {
        if (this.type !== Pbf.Bytes) return arr.push(this.readFixed32());
        var end = readPackedEnd(this);
        arr = arr || [];
        while (this.pos < end) arr.push(this.readFixed32());
        return arr;
    },
    readPackedSFixed32: function(arr) {
        if (this.type !== Pbf.Bytes) return arr.push(this.readSFixed32());
        var end = readPackedEnd(this);
        arr = arr || [];
        while (this.pos < end) arr.push(this.readSFixed32());
        return arr;
    },
    readPackedFixed64: function(arr) {
        if (this.type !== Pbf.Bytes) return arr.push(this.readFixed64());
        var end = readPackedEnd(this);
        arr = arr || [];
        while (this.pos < end) arr.push(this.readFixed64());
        return arr;
    },
    readPackedSFixed64: function(arr) {
        if (this.type !== Pbf.Bytes) return arr.push(this.readSFixed64());
        var end = readPackedEnd(this);
        arr = arr || [];
        while (this.pos < end) arr.push(this.readSFixed64());
        return arr;
    },

    skip: function(val) {
        var type = val & 0x7;
        if (type === Pbf.Varint) while (this.buf[this.pos++] > 0x7f) {}
        else if (type === Pbf.Bytes) this.pos = this.readVarint() + this.pos;
        else if (type === Pbf.Fixed32) this.pos += 4;
        else if (type === Pbf.Fixed64) this.pos += 8;
        else throw new Error('Unimplemented type: ' + type);
    },

    // === WRITING =================================================================

    writeTag: function(tag, type) {
        this.writeVarint((tag << 3) | type);
    },

    realloc: function(min) {
        var length = this.length || 16;

        while (length < this.pos + min) length *= 2;

        if (length !== this.length) {
            var buf = new Uint8Array(length);
            buf.set(this.buf);
            this.buf = buf;
            this.length = length;
        }
    },

    finish: function() {
        this.length = this.pos;
        this.pos = 0;
        return this.buf.subarray(0, this.length);
    },

    writeFixed32: function(val) {
        this.realloc(4);
        writeInt32(this.buf, val, this.pos);
        this.pos += 4;
    },

    writeSFixed32: function(val) {
        this.realloc(4);
        writeInt32(this.buf, val, this.pos);
        this.pos += 4;
    },

    writeFixed64: function(val) {
        this.realloc(8);
        writeInt32(this.buf, val & -1, this.pos);
        writeInt32(this.buf, Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
        this.pos += 8;
    },

    writeSFixed64: function(val) {
        this.realloc(8);
        writeInt32(this.buf, val & -1, this.pos);
        writeInt32(this.buf, Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
        this.pos += 8;
    },

    writeVarint: function(val) {
        val = +val || 0;

        if (val > 0xfffffff || val < 0) {
            writeBigVarint(val, this);
            return;
        }

        this.realloc(4);

        this.buf[this.pos++] =           val & 0x7f  | (val > 0x7f ? 0x80 : 0); if (val <= 0x7f) return;
        this.buf[this.pos++] = ((val >>>= 7) & 0x7f) | (val > 0x7f ? 0x80 : 0); if (val <= 0x7f) return;
        this.buf[this.pos++] = ((val >>>= 7) & 0x7f) | (val > 0x7f ? 0x80 : 0); if (val <= 0x7f) return;
        this.buf[this.pos++] =   (val >>> 7) & 0x7f;
    },

    writeSVarint: function(val) {
        this.writeVarint(val < 0 ? -val * 2 - 1 : val * 2);
    },

    writeBoolean: function(val) {
        this.writeVarint(Boolean(val));
    },

    writeString: function(str) {
        str = String(str);
        this.realloc(str.length * 4);

        this.pos++; // reserve 1 byte for short string length

        var startPos = this.pos;
        // write the string directly to the buffer and see how much was written
        this.pos = writeUtf8(this.buf, str, this.pos);
        var len = this.pos - startPos;

        if (len >= 0x80) makeRoomForExtraLength(startPos, len, this);

        // finally, write the message length in the reserved place and restore the position
        this.pos = startPos - 1;
        this.writeVarint(len);
        this.pos += len;
    },

    writeFloat: function(val) {
        this.realloc(4);
        ieee754.write(this.buf, val, this.pos, true, 23, 4);
        this.pos += 4;
    },

    writeDouble: function(val) {
        this.realloc(8);
        ieee754.write(this.buf, val, this.pos, true, 52, 8);
        this.pos += 8;
    },

    writeBytes: function(buffer) {
        var len = buffer.length;
        this.writeVarint(len);
        this.realloc(len);
        for (var i = 0; i < len; i++) this.buf[this.pos++] = buffer[i];
    },

    writeRawMessage: function(fn, obj) {
        this.pos++; // reserve 1 byte for short message length

        // write the message directly to the buffer and see how much was written
        var startPos = this.pos;
        fn(obj, this);
        var len = this.pos - startPos;

        if (len >= 0x80) makeRoomForExtraLength(startPos, len, this);

        // finally, write the message length in the reserved place and restore the position
        this.pos = startPos - 1;
        this.writeVarint(len);
        this.pos += len;
    },

    writeMessage: function(tag, fn, obj) {
        this.writeTag(tag, Pbf.Bytes);
        this.writeRawMessage(fn, obj);
    },

    writePackedVarint:   function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedVarint, arr);   },
    writePackedSVarint:  function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedSVarint, arr);  },
    writePackedBoolean:  function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedBoolean, arr);  },
    writePackedFloat:    function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedFloat, arr);    },
    writePackedDouble:   function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedDouble, arr);   },
    writePackedFixed32:  function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedFixed32, arr);  },
    writePackedSFixed32: function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedSFixed32, arr); },
    writePackedFixed64:  function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedFixed64, arr);  },
    writePackedSFixed64: function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedSFixed64, arr); },

    writeBytesField: function(tag, buffer) {
        this.writeTag(tag, Pbf.Bytes);
        this.writeBytes(buffer);
    },
    writeFixed32Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed32);
        this.writeFixed32(val);
    },
    writeSFixed32Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed32);
        this.writeSFixed32(val);
    },
    writeFixed64Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed64);
        this.writeFixed64(val);
    },
    writeSFixed64Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed64);
        this.writeSFixed64(val);
    },
    writeVarintField: function(tag, val) {
        this.writeTag(tag, Pbf.Varint);
        this.writeVarint(val);
    },
    writeSVarintField: function(tag, val) {
        this.writeTag(tag, Pbf.Varint);
        this.writeSVarint(val);
    },
    writeStringField: function(tag, str) {
        this.writeTag(tag, Pbf.Bytes);
        this.writeString(str);
    },
    writeFloatField: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed32);
        this.writeFloat(val);
    },
    writeDoubleField: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed64);
        this.writeDouble(val);
    },
    writeBooleanField: function(tag, val) {
        this.writeVarintField(tag, Boolean(val));
    }
};

function readVarintRemainder(l, s, p) {
    var buf = p.buf,
        h, b;

    b = buf[p.pos++]; h  = (b & 0x70) >> 4;  if (b < 0x80) return toNum(l, h, s);
    b = buf[p.pos++]; h |= (b & 0x7f) << 3;  if (b < 0x80) return toNum(l, h, s);
    b = buf[p.pos++]; h |= (b & 0x7f) << 10; if (b < 0x80) return toNum(l, h, s);
    b = buf[p.pos++]; h |= (b & 0x7f) << 17; if (b < 0x80) return toNum(l, h, s);
    b = buf[p.pos++]; h |= (b & 0x7f) << 24; if (b < 0x80) return toNum(l, h, s);
    b = buf[p.pos++]; h |= (b & 0x01) << 31; if (b < 0x80) return toNum(l, h, s);

    throw new Error('Expected varint not more than 10 bytes');
}

function readPackedEnd(pbf) {
    return pbf.type === Pbf.Bytes ?
        pbf.readVarint() + pbf.pos : pbf.pos + 1;
}

function toNum(low, high, isSigned) {
    if (isSigned) {
        return high * 0x100000000 + (low >>> 0);
    }

    return ((high >>> 0) * 0x100000000) + (low >>> 0);
}

function writeBigVarint(val, pbf) {
    var low, high;

    if (val >= 0) {
        low  = (val % 0x100000000) | 0;
        high = (val / 0x100000000) | 0;
    } else {
        low  = ~(-val % 0x100000000);
        high = ~(-val / 0x100000000);

        if (low ^ 0xffffffff) {
            low = (low + 1) | 0;
        } else {
            low = 0;
            high = (high + 1) | 0;
        }
    }

    if (val >= 0x10000000000000000 || val < -0x10000000000000000) {
        throw new Error('Given varint doesn\'t fit into 10 bytes');
    }

    pbf.realloc(10);

    writeBigVarintLow(low, high, pbf);
    writeBigVarintHigh(high, pbf);
}

function writeBigVarintLow(low, high, pbf) {
    pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
    pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
    pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
    pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
    pbf.buf[pbf.pos]   = low & 0x7f;
}

function writeBigVarintHigh(high, pbf) {
    var lsb = (high & 0x07) << 4;

    pbf.buf[pbf.pos++] |= lsb         | ((high >>>= 3) ? 0x80 : 0); if (!high) return;
    pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
    pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
    pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
    pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
    pbf.buf[pbf.pos++]  = high & 0x7f;
}

function makeRoomForExtraLength(startPos, len, pbf) {
    var extraLen =
        len <= 0x3fff ? 1 :
        len <= 0x1fffff ? 2 :
        len <= 0xfffffff ? 3 : Math.floor(Math.log(len) / (Math.LN2 * 7));

    // if 1 byte isn't enough for encoding message length, shift the data to the right
    pbf.realloc(extraLen);
    for (var i = pbf.pos - 1; i >= startPos; i--) pbf.buf[i + extraLen] = pbf.buf[i];
}

function writePackedVarint(arr, pbf)   { for (var i = 0; i < arr.length; i++) pbf.writeVarint(arr[i]);   }
function writePackedSVarint(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeSVarint(arr[i]);  }
function writePackedFloat(arr, pbf)    { for (var i = 0; i < arr.length; i++) pbf.writeFloat(arr[i]);    }
function writePackedDouble(arr, pbf)   { for (var i = 0; i < arr.length; i++) pbf.writeDouble(arr[i]);   }
function writePackedBoolean(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeBoolean(arr[i]);  }
function writePackedFixed32(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeFixed32(arr[i]);  }
function writePackedSFixed32(arr, pbf) { for (var i = 0; i < arr.length; i++) pbf.writeSFixed32(arr[i]); }
function writePackedFixed64(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeFixed64(arr[i]);  }
function writePackedSFixed64(arr, pbf) { for (var i = 0; i < arr.length; i++) pbf.writeSFixed64(arr[i]); }

// Buffer code below from https://github.com/feross/buffer, MIT-licensed

function readUInt32(buf, pos) {
    return ((buf[pos]) |
        (buf[pos + 1] << 8) |
        (buf[pos + 2] << 16)) +
        (buf[pos + 3] * 0x1000000);
}

function writeInt32(buf, val, pos) {
    buf[pos] = val;
    buf[pos + 1] = (val >>> 8);
    buf[pos + 2] = (val >>> 16);
    buf[pos + 3] = (val >>> 24);
}

function readInt32(buf, pos) {
    return ((buf[pos]) |
        (buf[pos + 1] << 8) |
        (buf[pos + 2] << 16)) +
        (buf[pos + 3] << 24);
}

function readUtf8(buf, pos, end) {
    var str = '';
    var i = pos;

    while (i < end) {
        var b0 = buf[i];
        var c = null; // codepoint
        var bytesPerSequence =
            b0 > 0xEF ? 4 :
            b0 > 0xDF ? 3 :
            b0 > 0xBF ? 2 : 1;

        if (i + bytesPerSequence > end) break;

        var b1, b2, b3;

        if (bytesPerSequence === 1) {
            if (b0 < 0x80) {
                c = b0;
            }
        } else if (bytesPerSequence === 2) {
            b1 = buf[i + 1];
            if ((b1 & 0xC0) === 0x80) {
                c = (b0 & 0x1F) << 0x6 | (b1 & 0x3F);
                if (c <= 0x7F) {
                    c = null;
                }
            }
        } else if (bytesPerSequence === 3) {
            b1 = buf[i + 1];
            b2 = buf[i + 2];
            if ((b1 & 0xC0) === 0x80 && (b2 & 0xC0) === 0x80) {
                c = (b0 & 0xF) << 0xC | (b1 & 0x3F) << 0x6 | (b2 & 0x3F);
                if (c <= 0x7FF || (c >= 0xD800 && c <= 0xDFFF)) {
                    c = null;
                }
            }
        } else if (bytesPerSequence === 4) {
            b1 = buf[i + 1];
            b2 = buf[i + 2];
            b3 = buf[i + 3];
            if ((b1 & 0xC0) === 0x80 && (b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80) {
                c = (b0 & 0xF) << 0x12 | (b1 & 0x3F) << 0xC | (b2 & 0x3F) << 0x6 | (b3 & 0x3F);
                if (c <= 0xFFFF || c >= 0x110000) {
                    c = null;
                }
            }
        }

        if (c === null) {
            c = 0xFFFD;
            bytesPerSequence = 1;

        } else if (c > 0xFFFF) {
            c -= 0x10000;
            str += String.fromCharCode(c >>> 10 & 0x3FF | 0xD800);
            c = 0xDC00 | c & 0x3FF;
        }

        str += String.fromCharCode(c);
        i += bytesPerSequence;
    }

    return str;
}

function readUtf8TextDecoder(buf, pos, end) {
    return utf8TextDecoder.decode(buf.subarray(pos, end));
}

function writeUtf8(buf, str, pos) {
    for (var i = 0, c, lead; i < str.length; i++) {
        c = str.charCodeAt(i); // code point

        if (c > 0xD7FF && c < 0xE000) {
            if (lead) {
                if (c < 0xDC00) {
                    buf[pos++] = 0xEF;
                    buf[pos++] = 0xBF;
                    buf[pos++] = 0xBD;
                    lead = c;
                    continue;
                } else {
                    c = lead - 0xD800 << 10 | c - 0xDC00 | 0x10000;
                    lead = null;
                }
            } else {
                if (c > 0xDBFF || (i + 1 === str.length)) {
                    buf[pos++] = 0xEF;
                    buf[pos++] = 0xBF;
                    buf[pos++] = 0xBD;
                } else {
                    lead = c;
                }
                continue;
            }
        } else if (lead) {
            buf[pos++] = 0xEF;
            buf[pos++] = 0xBF;
            buf[pos++] = 0xBD;
            lead = null;
        }

        if (c < 0x80) {
            buf[pos++] = c;
        } else {
            if (c < 0x800) {
                buf[pos++] = c >> 0x6 | 0xC0;
            } else {
                if (c < 0x10000) {
                    buf[pos++] = c >> 0xC | 0xE0;
                } else {
                    buf[pos++] = c >> 0x12 | 0xF0;
                    buf[pos++] = c >> 0xC & 0x3F | 0x80;
                }
                buf[pos++] = c >> 0x6 & 0x3F | 0x80;
            }
            buf[pos++] = c & 0x3F | 0x80;
        }
    }
    return pos;
}

},{"ieee754":15}]},{},[4]);
