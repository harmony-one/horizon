"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stringToNibbles = stringToNibbles;
exports.nibblesToBuffer = nibblesToBuffer;
exports.matchingNibbleLength = matchingNibbleLength;
exports.doKeysMatch = doKeysMatch;

/**
 * Converts a string OR a buffer to a nibble array.
 * @method stringToNibbles
 * @param {Buffer| String} key
 * @private
 */
function stringToNibbles(key) {
  var bkey = new Buffer(key);
  var nibbles = [];

  for (var i = 0; i < bkey.length; i++) {
    var q = i * 2;
    nibbles[q] = bkey[i] >> 4;
    ++q;
    nibbles[q] = bkey[i] % 16;
  }

  return nibbles;
}
/**
 * Converts a nibble array into a buffer.
 * @method nibblesToBuffer
 * @param {Array} Nibble array
 * @private
 */


function nibblesToBuffer(arr) {
  var buf = new Buffer(arr.length / 2);

  for (var i = 0; i < buf.length; i++) {
    var q = i * 2;
    buf[i] = (arr[q] << 4) + arr[++q];
  }

  return buf;
}
/**
 * Returns the number of in order matching nibbles of two give nibble arrays.
 * @method matchingNibbleLength
 * @param {Array} nib1
 * @param {Array} nib2
 * @private
 */


function matchingNibbleLength(nib1, nib2) {
  var i = 0;

  while (nib1[i] === nib2[i] && nib1.length > i) {
    i++;
  }

  return i;
}
/**
 * Compare two nibble array keys.
 * @param {Array} keyA
 * @param {Array} keyB
 */


function doKeysMatch(keyA, keyB) {
  var length = matchingNibbleLength(keyA, keyB);
  return length === keyA.length && length === keyB.length;
}