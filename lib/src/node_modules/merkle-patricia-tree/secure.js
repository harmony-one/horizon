"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var ethUtil = require('ethereumjs-util');

var CheckpointTrie = require('./checkpointTrie');
/**
 * You can create a secure Trie where the keys are automatically hashed
 * using **keccak256** by using `require('merkle-patricia-tree/secure')`.
 * It has the same methods and constructor as `Trie`.
 * @class SecureTrie
 * @extends Trie
 * @public
 */


module.exports =
/*#__PURE__*/
function (_CheckpointTrie) {
  _inherits(SecureTrie, _CheckpointTrie);

  function SecureTrie() {
    var _getPrototypeOf2;

    _classCallCheck(this, SecureTrie);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(SecureTrie)).call.apply(_getPrototypeOf2, [this].concat(args)));
  }

  _createClass(SecureTrie, [{
    key: "copy",
    value: function copy() {
      var db = this.db.copy();
      return new SecureTrie(db, this.root);
    }
  }, {
    key: "get",
    value: function get(key, cb) {
      var hash = ethUtil.keccak256(key);

      _get(_getPrototypeOf(SecureTrie.prototype), "get", this).call(this, hash, cb);
    }
    /**
     * For a falsey value, use the original key
     * to avoid double hashing the key.
     */

  }, {
    key: "put",
    value: function put(key, val, cb) {
      if (!val) {
        this.del(key, cb);
      } else {
        var hash = ethUtil.keccak256(key);

        _get(_getPrototypeOf(SecureTrie.prototype), "put", this).call(this, hash, val, cb);
      }
    }
  }, {
    key: "del",
    value: function del(key, cb) {
      var hash = ethUtil.keccak256(key);

      _get(_getPrototypeOf(SecureTrie.prototype), "del", this).call(this, hash, cb);
    }
  }], [{
    key: "prove",
    value: function prove(trie, key, cb) {
      var hash = ethUtil.keccak256(key);

      _get(_getPrototypeOf(SecureTrie), "prove", this).call(this, trie, hash, cb);
    }
  }, {
    key: "verifyProof",
    value: function verifyProof(rootHash, key, proof, cb) {
      var hash = ethUtil.keccak256(key);

      _get(_getPrototypeOf(SecureTrie), "verifyProof", this).call(this, rootHash, hash, proof, cb);
    }
  }]);

  return SecureTrie;
}(CheckpointTrie);