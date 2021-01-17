const keccak256 = require('js-sha3').keccak256;
const BN = require('bn.js');
const rlp = require('rlp');
const Buffer = require('safe-buffer').Buffer;

const KECCAK256_RLP_ARRAY = Buffer.from(
  '1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
  'hex'
);

const KECCAK256_RLP_NULL = Buffer.from(
  '56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
  'hex'
);

const KECCAK256_NULL = Buffer.from(
  'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
  'hex'
);

const encode = input => (input === '0x0')
  ? rlp.encode(Buffer.alloc(0))
  : rlp.encode(input);

const decode = rlp.decode;

const toBuffer = input => (input === '0x0')
  ? Buffer.alloc(0)
  : _toBuffer(input);

const keccak = input => toBuffer(_keccak(input));

const toHex = input => (input instanceof Array)
  ? toHex(encode(input))
  : bufferToHex(input);

const toWord = input => setLengthLeft(toBuffer(input), 32);

const mappingAt = (...keys) => { // first key is mapping's position
  keys[0] = toWord(keys[0]);
  const keysReducer = (positionAccumulator, key) => {
    const buf = Buffer.concat([toWord(key), positionAccumulator]);
    return keccak(buf);
  };
  return toHex(keys.reduce(keysReducer));
};

module.exports = {
  keccak,
  encode,
  decode,
  toBuffer,
  toHex,
  toWord,
  mappingAt,
  KECCAK256_RLP_ARRAY,
  KECCAK256_RLP_NULL,
  KECCAK256_NULL
};


// following 5 functions adapted or copied from ethereumjs-util

function _keccak(a) {
  a = _toBuffer(a);
  return keccak256.create().update(a).digest();
}

function _toBuffer(v) {
  if (!Buffer.isBuffer(v)) {
      if (Array.isArray(v)) {
          v = Buffer.from(v);
      }
      else if (typeof v === 'string') {
          if (isHexString(v)) {
              v = Buffer.from(padToEven(stripHexPrefix(v)), 'hex');
          }
          else {
              v = Buffer.from(v);
          }
      }
      else if (typeof v === 'number') {
          v = intToBuffer(v);
      }
      else if (v === null || v === undefined) {
          v = Buffer.allocUnsafe(0);
      }
      else if (BN.isBN(v)) {
          v = v.toArrayLike(Buffer);
      }
      else if (v.toArray) {
          // converts a BN to a Buffer
          v = Buffer.from(v.toArray());
      }
      else {
          throw new Error('invalid type');
      }
  }
  return v;
}

function bufferToHex(buf) {
  buf = _toBuffer(buf);
  return '0x' + buf.toString('hex');
}

function setLengthLeft(msg, length, right) {
  if (right === void 0) { right = false; }
  var buf = zeros(length);
  msg = _toBuffer(msg);
  if (right) {
      if (msg.length < length) {
          msg.copy(buf);
          return buf;
      }
      return msg.slice(0, length);
  }
  else {
      if (msg.length < length) {
          msg.copy(buf, length - msg.length);
          return buf;
      }
      return msg.slice(-length);
  }
}

function zeros(bytes) {
  return Buffer.allocUnsafe(bytes).fill(0);
}


// remaining functions copied from ethjs-util

function isHexString(value, length) {
  if (typeof value !== 'string' || !value.match(/^0x[0-9A-Fa-f]*$/)) {
    return false;
  }

  if (length && value.length !== 2 + 2 * length) {
    return false;
  }

  return true;
}

function padToEven(value) {
  var a = value;

  if (typeof a !== 'string') {
    throw new Error('[ethjs-util] while padding to even, value must be string, is currently ' + typeof a + ', while padToEven.');
  }

  if (a.length % 2) {
    a = '0' + a;
  }

  return a;
}

function stripHexPrefix(str) {
  if (typeof str !== 'string') {
    return str;
  }

  return isHexPrefixed(str) ? str.slice(2) : str;
}

function isHexPrefixed(str) {
  if (typeof str !== 'string') {
    throw new Error("[is-hex-prefixed] value must be type 'string', is currently type " + (typeof str) + ", while checking isHexPrefixed.");
  }

  return str.slice(0, 2) === '0x';
}

function intToBuffer(i) {
  var hex = intToHex(i);

  return new Buffer(padToEven(hex.slice(2)), 'hex');
}

function intToHex(i) {
  var hex = i.toString(16);

  return '0x' + hex;
}