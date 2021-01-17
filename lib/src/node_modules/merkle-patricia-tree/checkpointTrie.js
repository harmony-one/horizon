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

var async = require('async');

var WriteStream = require('level-ws');

var BaseTrie = require('./baseTrie');

var ScratchReadStream = require('./scratchReadStream');

var ScratchDB = require('./scratch');

var _require = require('./util/async'),
    callTogether = _require.callTogether;

module.exports =
/*#__PURE__*/
function (_BaseTrie) {
  _inherits(CheckpointTrie, _BaseTrie);

  function CheckpointTrie() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, CheckpointTrie);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(CheckpointTrie)).call.apply(_getPrototypeOf2, [this].concat(args))); // Reference to main DB instance

    _this._mainDB = _this.db; // DB instance used for checkpoints

    _this._scratch = null; // Roots of trie at the moment of checkpoint

    _this._checkpoints = [];
    return _this;
  }
  /**
   * Is the trie during a checkpoint phase?
   */


  _createClass(CheckpointTrie, [{
    key: "checkpoint",

    /**
     * Creates a checkpoint that can later be reverted to or committed.
     * After this is called, no changes to the trie will be permanently saved
     * until `commit` is called. Calling `putRaw` overrides the checkpointing
     * mechanism and would directly write to db.
     * @method checkpoint
     */
    value: function checkpoint() {
      var wasCheckpoint = this.isCheckpoint;

      this._checkpoints.push(this.root); // Entering checkpoint mode is not necessary for nested checkpoints


      if (!wasCheckpoint && this.isCheckpoint) {
        this._enterCpMode();
      }
    }
    /**
     * Commits a checkpoint to disk, if current checkpoint is not nested. If
     * nested, only sets the parent checkpoint as current checkpoint.
     * @method commit
     * @param {Function} cb the callback
     * @throws If not during a checkpoint phase
     */

  }, {
    key: "commit",
    value: function commit(cb) {
      var _this2 = this;

      cb = callTogether(cb, this.sem.leave);
      this.sem.take(function () {
        if (_this2.isCheckpoint) {
          _this2._checkpoints.pop();

          if (!_this2.isCheckpoint) {
            _this2._exitCpMode(true, cb);
          } else {
            cb();
          }
        } else {
          throw new Error('trying to commit when not checkpointed');
        }
      });
    }
    /**
     * Reverts the trie to the state it was at when `checkpoint` was first called.
     * If during a nested checkpoint, sets root to most recent checkpoint, and sets
     * parent checkpoint as current.
     * @method revert
     * @param {Function} cb the callback
     */

  }, {
    key: "revert",
    value: function revert(cb) {
      var _this3 = this;

      cb = callTogether(cb, this.sem.leave);
      this.sem.take(function () {
        if (_this3.isCheckpoint) {
          _this3.root = _this3._checkpoints.pop();

          if (!_this3.isCheckpoint) {
            _this3._exitCpMode(false, cb);

            return;
          }
        }

        cb();
      });
    }
    /**
     * Returns a copy of the underlying trie with the interface
     * of CheckpointTrie. If during a checkpoint, the copy will
     * contain the checkpointing metadata (incl. reference to the same scratch).
     * @method copy
     */

  }, {
    key: "copy",
    value: function copy() {
      var db = this._mainDB.copy();

      var trie = new CheckpointTrie(db, this.root);

      if (this.isCheckpoint) {
        trie._checkpoints = this._checkpoints.slice();
        trie._scratch = this._scratch.copy();
        trie.db = trie._scratch;
      }

      return trie;
    }
    /**
     * Enter into checkpoint mode.
     * @private
     */

  }, {
    key: "_enterCpMode",
    value: function _enterCpMode() {
      this._scratch = new ScratchDB(this._mainDB);
      this.db = this._scratch;
    }
    /**
     * Exit from checkpoint mode.
     * @private
     */

  }, {
    key: "_exitCpMode",
    value: function _exitCpMode(commitState, cb) {
      var scratch = this._scratch;
      this._scratch = null;
      this.db = this._mainDB;

      if (commitState) {
        this._createScratchReadStream(scratch).pipe(WriteStream(this.db)).on('close', cb);
      } else {
        async.nextTick(cb);
      }
    }
    /**
     * Returns a `ScratchReadStream` based on the state updates
     * since checkpoint.
     * @method createScratchReadStream
     * @private
     */

  }, {
    key: "_createScratchReadStream",
    value: function _createScratchReadStream(scratch) {
      scratch = scratch || this._scratch;
      var trie = new BaseTrie(scratch, this.root);
      return new ScratchReadStream(trie);
    }
  }, {
    key: "isCheckpoint",
    get: function get() {
      return this._checkpoints.length > 0;
    }
  }]);

  return CheckpointTrie;
}(BaseTrie);