"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var rlp = require('rlp');

var ethUtil = require('ethereumjs-util');

var _require = require('./util/nibbles'),
    stringToNibbles = _require.stringToNibbles,
    nibblesToBuffer = _require.nibblesToBuffer;

var _require2 = require('./util/hex'),
    isTerminator = _require2.isTerminator,
    addHexPrefix = _require2.addHexPrefix,
    removeHexPrefix = _require2.removeHexPrefix;

module.exports =
/*#__PURE__*/
function () {
  function TrieNode(type, key, value) {
    _classCallCheck(this, TrieNode);

    if (Array.isArray(type)) {
      // parse raw node
      this.parseNode(type);
    } else {
      this.type = type;

      if (type === 'branch') {
        var values = key;
        this.raw = Array.apply(null, Array(17));

        if (values) {
          values.forEach(function (keyVal) {
            this.set.apply(this, keyVal);
          });
        }
      } else {
        this.raw = Array(2);
        this.setValue(value);
        this.setKey(key);
      }
    }
  }
  /**
   * Determines the node type.
   * @private
   * @returns {String} - the node type
   *   - leaf - if the node is a leaf
   *   - branch - if the node is a branch
   *   - extention - if the node is an extention
   *   - unknown - if something else got borked
   */


  _createClass(TrieNode, [{
    key: "parseNode",
    value: function parseNode(rawNode) {
      this.raw = rawNode;
      this.type = TrieNode.getNodeType(rawNode);
    }
  }, {
    key: "setValue",
    value: function setValue(key, value) {
      if (this.type !== 'branch') {
        this.raw[1] = key;
      } else {
        if (arguments.length === 1) {
          value = key;
          key = 16;
        }

        this.raw[key] = value;
      }
    }
  }, {
    key: "getValue",
    value: function getValue(key) {
      if (this.type === 'branch') {
        if (arguments.length === 0) {
          key = 16;
        }

        var val = this.raw[key];

        if (val !== null && val !== undefined && val.length !== 0) {
          return val;
        }
      } else {
        return this.raw[1];
      }
    }
  }, {
    key: "setKey",
    value: function setKey(key) {
      if (this.type !== 'branch') {
        if (Buffer.isBuffer(key)) {
          key = stringToNibbles(key);
        } else {
          key = key.slice(0); // copy the key
        }

        key = addHexPrefix(key, this.type === 'leaf');
        this.raw[0] = nibblesToBuffer(key);
      }
    }
  }, {
    key: "getKey",
    value: function getKey() {
      if (this.type !== 'branch') {
        var key = this.raw[0];
        key = removeHexPrefix(stringToNibbles(key));
        return key;
      }
    }
  }, {
    key: "serialize",
    value: function serialize() {
      return rlp.encode(this.raw);
    }
  }, {
    key: "hash",
    value: function hash() {
      return ethUtil.sha3(this.serialize());
    }
  }, {
    key: "toString",
    value: function toString() {
      var out = this.type;
      out += ': [';
      this.raw.forEach(function (el) {
        if (Buffer.isBuffer(el)) {
          out += el.toString('hex') + ', ';
        } else if (el) {
          out += 'object, ';
        } else {
          out += 'empty, ';
        }
      });
      out = out.slice(0, -2);
      out += ']';
      return out;
    }
  }, {
    key: "getChildren",
    value: function getChildren() {
      var children = [];

      switch (this.type) {
        case 'leaf':
          // no children
          break;

        case 'extention':
          // one child
          children.push([this.key, this.getValue()]);
          break;

        case 'branch':
          for (var index = 0, end = 16; index < end; index++) {
            var value = this.getValue(index);

            if (value) {
              children.push([[index], value]);
            }
          }

          break;
      }

      return children;
    }
  }, {
    key: "value",
    get: function get() {
      return this.getValue();
    },
    set: function set(v) {
      this.setValue(v);
    }
  }, {
    key: "key",
    get: function get() {
      return this.getKey();
    },
    set: function set(k) {
      this.setKey(k);
    }
  }], [{
    key: "getNodeType",
    value: function getNodeType(node) {
      if (node.length === 17) {
        return 'branch';
      } else if (node.length === 2) {
        var key = stringToNibbles(node[0]);

        if (isTerminator(key)) {
          return 'leaf';
        }

        return 'extention';
      }
    }
  }, {
    key: "isRawNode",
    value: function isRawNode(node) {
      return Array.isArray(node) && !Buffer.isBuffer(node);
    }
  }]);

  return TrieNode;
}();