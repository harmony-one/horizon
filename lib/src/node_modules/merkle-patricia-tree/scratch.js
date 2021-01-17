"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var DB = require('./db');

var _require = require('./util/async'),
    asyncFirstSeries = _require.asyncFirstSeries;

var ENCODING_OPTS = {
  keyEncoding: 'binary',
  valueEncoding: 'binary'
  /**
   * An in-memory wrap over `DB` with an upstream DB
   * which will be queried when a key is not found
   * in the in-memory scratch. This class is used to implement
   * checkpointing functionality in CheckpointTrie.
   */

};

module.exports =
/*#__PURE__*/
function (_DB) {
  _inherits(ScratchDB, _DB);

  function ScratchDB(upstreamDB) {
    var _this;

    _classCallCheck(this, ScratchDB);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ScratchDB).call(this));
    _this._upstream = upstreamDB;
    return _this;
  }
  /**
   * Similar to `DB.get`, but first searches in-memory
   * scratch DB, if key not found, searches upstream DB.
   */


  _createClass(ScratchDB, [{
    key: "get",
    value: function get(key, cb) {
      var getDBs = this._upstream._leveldb ? [this._leveldb, this._upstream._leveldb] : [this._leveldb];

      var dbGet = function dbGet(db, cb2) {
        db.get(key, ENCODING_OPTS, function (err, v) {
          if (err || !v) {
            cb2(null, null);
          } else {
            cb2(null, v);
          }
        });
      };

      asyncFirstSeries(getDBs, dbGet, cb);
    }
  }, {
    key: "copy",
    value: function copy() {
      var scratch = new ScratchDB(this._upstream);
      scratch._leveldb = this._leveldb;
      return scratch;
    }
  }]);

  return ScratchDB;
}(DB);