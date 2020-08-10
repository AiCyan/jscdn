$(document).ready(function () {
  if (location.href.indexOf("#reloaded") == -1) {
    location.href = location.href + "#reloaded";
    location.reload();
  }
});

var version = "v1.2.5";
(function () {
  var root = typeof window === "object" ? window : {};
  var NODE_JS = !root.JS_SHA1_NO_NODE_JS &&
    typeof process === "object" &&
    process.versions &&
    process.versions.node;
  if (NODE_JS) {
    root = global;
  }
  var COMMON_JS = !root.JS_SHA1_NO_COMMON_JS && typeof module === "object" && module.exports;
  var AMD = typeof define === "function" && define.amd;
  var HEX_CHARS = "0123456789abcdef".split("");
  var EXTRA = [-2147483648, 8388608, 32768, 128];
  var SHIFT = [24, 16, 8, 0];
  var OUTPUT_TYPES = ["hex", "array", "digest", "arrayBuffer"];
  var blocks = [];
  var createOutputMethod = function (outputType) {
    return function (message) {
      return new Sha1(true).update(message)[outputType]();
    };
  };
  var createMethod = function () {
    var method = createOutputMethod("hex");
    if (NODE_JS) {
      method = nodeWrap(method);
    }
    method.create = function () {
      return new Sha1();
    };
    method.update = function (message) {
      return method.create().update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createOutputMethod(type);
    }
    return method;
  };
  var nodeWrap = function (method) {
    var crypto = eval("require('crypto')");
    var Buffer = eval("require('buffer').Buffer");
    var nodeMethod = function (message) {
      if (typeof message === "string") {
        return crypto.createHash("sha1").update(message, "utf8").digest("hex");
      } else {
        if (message.constructor === ArrayBuffer) {
          message = new Uint8Array(message);
        } else {
          if (message.length === undefined) {
            return method(message);
          }
        }
      }
      return crypto
        .createHash("sha1")
        .update(new Buffer(message))
        .digest("hex");
    };
    return nodeMethod;
  };

  function Sha1(sharedMemory) {
    if (sharedMemory) {
      blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      this.blocks = blocks;
    } else {
      this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    this.h0 = 1732584193;
    this.h1 = 4023233417;
    this.h2 = 2562383102;
    this.h3 = 271733878;
    this.h4 = 3285377520;
    this.block = this.start = this.bytes = this.hBytes = 0;
    this.finalized = this.hashed = false;
    this.first = true;
  }
  Sha1.prototype.update = function (message) {
    if (this.finalized) {
      return;
    }
    var notString = typeof message !== "string";
    if (notString && message.constructor === root.ArrayBuffer) {
      message = new Uint8Array(message);
    }
    var code,
      index = 0,
      i,
      length = message.length || 0,
      blocks = this.blocks;
    while (index < length) {
      if (this.hashed) {
        this.hashed = false;
        blocks[0] = this.block;
        blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      }
      if (notString) {
        for (i = this.start; index < length && i < 64; ++index) {
          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
        }
      } else {
        for (i = this.start; index < length && i < 64; ++index) {
          code = message.charCodeAt(index);
          if (code < 128) {
            blocks[i >> 2] |= code << SHIFT[i++ & 3];
          } else {
            if (code < 2048) {
              blocks[i >> 2] |= (192 | (code >> 6)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (128 | (code & 63)) << SHIFT[i++ & 3];
            } else {
              if (code < 55296 || code >= 57344) {
                blocks[i >> 2] |= (224 | (code >> 12)) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (128 | ((code >> 6) & 63)) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (128 | (code & 63)) << SHIFT[i++ & 3];
              } else {
                code =
                  65536 +
                  (((code & 1023) << 10) |
                    (message.charCodeAt(++index) & 1023));
                blocks[i >> 2] |= (240 | (code >> 18)) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (128 | ((code >> 12) & 63)) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (128 | ((code >> 6) & 63)) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (128 | (code & 63)) << SHIFT[i++ & 3];
              }
            }
          }
        }
      }
      this.lastByteIndex = i;
      this.bytes += i - this.start;
      if (i >= 64) {
        this.block = blocks[16];
        this.start = i - 64;
        this.hash();
        this.hashed = true;
      } else {
        this.start = i;
      }
    }
    if (this.bytes > 4294967295) {
      this.hBytes += (this.bytes / 4294967296) << 0;
      this.bytes = this.bytes % 4294967296;
    }
    return this;
  };
  Sha1.prototype.finalize = function () {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    var blocks = this.blocks,
      i = this.lastByteIndex;
    blocks[16] = this.block;
    blocks[i >> 2] |= EXTRA[i & 3];
    this.block = blocks[16];
    if (i >= 56) {
      if (!this.hashed) {
        this.hash();
      }
      blocks[0] = this.block;
      blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    }
    blocks[14] = (this.hBytes << 3) | (this.bytes >>> 29);
    blocks[15] = this.bytes << 3;
    this.hash();
  };
  Sha1.prototype.hash = function () {
    var a = this.h0,
      b = this.h1,
      c = this.h2,
      d = this.h3,
      e = this.h4;
    var f,
      j,
      t,
      blocks = this.blocks;
    for (j = 16; j < 80; ++j) {
      t = blocks[j - 3] ^ blocks[j - 8] ^ blocks[j - 14] ^ blocks[j - 16];
      blocks[j] = (t << 1) | (t >>> 31);
    }
    for (j = 0; j < 20; j += 5) {
      f = (b & c) | (~b & d);
      t = (a << 5) | (a >>> 27);
      e = (t + f + e + 1518500249 + blocks[j]) << 0;
      b = (b << 30) | (b >>> 2);
      f = (a & b) | (~a & c);
      t = (e << 5) | (e >>> 27);
      d = (t + f + d + 1518500249 + blocks[j + 1]) << 0;
      a = (a << 30) | (a >>> 2);
      f = (e & a) | (~e & b);
      t = (d << 5) | (d >>> 27);
      c = (t + f + c + 1518500249 + blocks[j + 2]) << 0;
      e = (e << 30) | (e >>> 2);
      f = (d & e) | (~d & a);
      t = (c << 5) | (c >>> 27);
      b = (t + f + b + 1518500249 + blocks[j + 3]) << 0;
      d = (d << 30) | (d >>> 2);
      f = (c & d) | (~c & e);
      t = (b << 5) | (b >>> 27);
      a = (t + f + a + 1518500249 + blocks[j + 4]) << 0;
      c = (c << 30) | (c >>> 2);
    }
    for (; j < 40; j += 5) {
      f = b ^ c ^ d;
      t = (a << 5) | (a >>> 27);
      e = (t + f + e + 1859775393 + blocks[j]) << 0;
      b = (b << 30) | (b >>> 2);
      f = a ^ b ^ c;
      t = (e << 5) | (e >>> 27);
      d = (t + f + d + 1859775393 + blocks[j + 1]) << 0;
      a = (a << 30) | (a >>> 2);
      f = e ^ a ^ b;
      t = (d << 5) | (d >>> 27);
      c = (t + f + c + 1859775393 + blocks[j + 2]) << 0;
      e = (e << 30) | (e >>> 2);
      f = d ^ e ^ a;
      t = (c << 5) | (c >>> 27);
      b = (t + f + b + 1859775393 + blocks[j + 3]) << 0;
      d = (d << 30) | (d >>> 2);
      f = c ^ d ^ e;
      t = (b << 5) | (b >>> 27);
      a = (t + f + a + 1859775393 + blocks[j + 4]) << 0;
      c = (c << 30) | (c >>> 2);
    }
    for (; j < 60; j += 5) {
      f = (b & c) | (b & d) | (c & d);
      t = (a << 5) | (a >>> 27);
      e = (t + f + e - 1894007588 + blocks[j]) << 0;
      b = (b << 30) | (b >>> 2);
      f = (a & b) | (a & c) | (b & c);
      t = (e << 5) | (e >>> 27);
      d = (t + f + d - 1894007588 + blocks[j + 1]) << 0;
      a = (a << 30) | (a >>> 2);
      f = (e & a) | (e & b) | (a & b);
      t = (d << 5) | (d >>> 27);
      c = (t + f + c - 1894007588 + blocks[j + 2]) << 0;
      e = (e << 30) | (e >>> 2);
      f = (d & e) | (d & a) | (e & a);
      t = (c << 5) | (c >>> 27);
      b = (t + f + b - 1894007588 + blocks[j + 3]) << 0;
      d = (d << 30) | (d >>> 2);
      f = (c & d) | (c & e) | (d & e);
      t = (b << 5) | (b >>> 27);
      a = (t + f + a - 1894007588 + blocks[j + 4]) << 0;
      c = (c << 30) | (c >>> 2);
    }
    for (; j < 80; j += 5) {
      f = b ^ c ^ d;
      t = (a << 5) | (a >>> 27);
      e = (t + f + e - 899497514 + blocks[j]) << 0;
      b = (b << 30) | (b >>> 2);
      f = a ^ b ^ c;
      t = (e << 5) | (e >>> 27);
      d = (t + f + d - 899497514 + blocks[j + 1]) << 0;
      a = (a << 30) | (a >>> 2);
      f = e ^ a ^ b;
      t = (d << 5) | (d >>> 27);
      c = (t + f + c - 899497514 + blocks[j + 2]) << 0;
      e = (e << 30) | (e >>> 2);
      f = d ^ e ^ a;
      t = (c << 5) | (c >>> 27);
      b = (t + f + b - 899497514 + blocks[j + 3]) << 0;
      d = (d << 30) | (d >>> 2);
      f = c ^ d ^ e;
      t = (b << 5) | (b >>> 27);
      a = (t + f + a - 899497514 + blocks[j + 4]) << 0;
      c = (c << 30) | (c >>> 2);
    }
    this.h0 = (this.h0 + a) << 0;
    this.h1 = (this.h1 + b) << 0;
    this.h2 = (this.h2 + c) << 0;
    this.h3 = (this.h3 + d) << 0;
    this.h4 = (this.h4 + e) << 0;
  };
  Sha1.prototype.hex = function () {
    this.finalize();
    var h0 = this.h0,
      h1 = this.h1,
      h2 = this.h2,
      h3 = this.h3,
      h4 = this.h4;
    return (
      HEX_CHARS[(h0 >> 28) & 15] +
      HEX_CHARS[(h0 >> 24) & 15] +
      HEX_CHARS[(h0 >> 20) & 15] +
      HEX_CHARS[(h0 >> 16) & 15] +
      HEX_CHARS[(h0 >> 12) & 15] +
      HEX_CHARS[(h0 >> 8) & 15] +
      HEX_CHARS[(h0 >> 4) & 15] +
      HEX_CHARS[h0 & 15] +
      HEX_CHARS[(h1 >> 28) & 15] +
      HEX_CHARS[(h1 >> 24) & 15] +
      HEX_CHARS[(h1 >> 20) & 15] +
      HEX_CHARS[(h1 >> 16) & 15] +
      HEX_CHARS[(h1 >> 12) & 15] +
      HEX_CHARS[(h1 >> 8) & 15] +
      HEX_CHARS[(h1 >> 4) & 15] +
      HEX_CHARS[h1 & 15] +
      HEX_CHARS[(h2 >> 28) & 15] +
      HEX_CHARS[(h2 >> 24) & 15] +
      HEX_CHARS[(h2 >> 20) & 15] +
      HEX_CHARS[(h2 >> 16) & 15] +
      HEX_CHARS[(h2 >> 12) & 15] +
      HEX_CHARS[(h2 >> 8) & 15] +
      HEX_CHARS[(h2 >> 4) & 15] +
      HEX_CHARS[h2 & 15] +
      HEX_CHARS[(h3 >> 28) & 15] +
      HEX_CHARS[(h3 >> 24) & 15] +
      HEX_CHARS[(h3 >> 20) & 15] +
      HEX_CHARS[(h3 >> 16) & 15] +
      HEX_CHARS[(h3 >> 12) & 15] +
      HEX_CHARS[(h3 >> 8) & 15] +
      HEX_CHARS[(h3 >> 4) & 15] +
      HEX_CHARS[h3 & 15] +
      HEX_CHARS[(h4 >> 28) & 15] +
      HEX_CHARS[(h4 >> 24) & 15] +
      HEX_CHARS[(h4 >> 20) & 15] +
      HEX_CHARS[(h4 >> 16) & 15] +
      HEX_CHARS[(h4 >> 12) & 15] +
      HEX_CHARS[(h4 >> 8) & 15] +
      HEX_CHARS[(h4 >> 4) & 15] +
      HEX_CHARS[h4 & 15]
    );
  };
  Sha1.prototype.toString = Sha1.prototype.hex;
  Sha1.prototype.digest = function () {
    this.finalize();
    var h0 = this.h0,
      h1 = this.h1,
      h2 = this.h2,
      h3 = this.h3,
      h4 = this.h4;
    return [
      (h0 >> 24) & 255,
      (h0 >> 16) & 255,
      (h0 >> 8) & 255,
      h0 & 255,
      (h1 >> 24) & 255,
      (h1 >> 16) & 255,
      (h1 >> 8) & 255,
      h1 & 255,
      (h2 >> 24) & 255,
      (h2 >> 16) & 255,
      (h2 >> 8) & 255,
      h2 & 255,
      (h3 >> 24) & 255,
      (h3 >> 16) & 255,
      (h3 >> 8) & 255,
      h3 & 255,
      (h4 >> 24) & 255,
      (h4 >> 16) & 255,
      (h4 >> 8) & 255,
      h4 & 255,
    ];
  };
  Sha1.prototype.array = Sha1.prototype.digest;
  Sha1.prototype.arrayBuffer = function () {
    this.finalize();
    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint32(0, this.h0);
    dataView.setUint32(4, this.h1);
    dataView.setUint32(8, this.h2);
    dataView.setUint32(12, this.h3);
    dataView.setUint32(16, this.h4);
    return buffer;
  };
  var exports = createMethod();
  if (COMMON_JS) {
    module.exports = exports;
  } else {
    root.sha1 = exports;
    if (AMD) {
      define(function () {
        return exports;
      });
    }
  }
})();
/*! showdown v 1.9.1 - 02-11-2019 */
(function () {
  function getDefaultOpts(simple) {
    var defaultOptions = {
      omitExtraWLInCodeBlocks: {
        defaultValue: false,
        describe: "Omit the default extra whiteline added to code blocks",
        type: "boolean",
      },
      noHeaderId: {
        defaultValue: false,
        describe: "Turn on/off generated header id",
        type: "boolean",
      },
      prefixHeaderId: {
        defaultValue: false,
        describe: "Add a prefix to the generated header ids. Passing a string will prefix that string to the header id. Setting to true will add a generic 'section-' prefix",
        type: "string",
      },
      rawPrefixHeaderId: {
        defaultValue: false,
        describe: 'Setting this option to true will prevent showdown from modifying the prefix. This might result in malformed IDs (if, for instance, the " char is used in the prefix)',
        type: "boolean",
      },
      ghCompatibleHeaderId: {
        defaultValue: false,
        describe: "Generate header ids compatible with github style (spaces are replaced with dashes, a bunch of non alphanumeric chars are removed)",
        type: "boolean",
      },
      rawHeaderId: {
        defaultValue: false,
        describe: "Remove only spaces, ' and \" from generated header ids (including prefixes), replacing them with dashes (-). WARNING: This might result in malformed ids",
        type: "boolean",
      },
      headerLevelStart: {
        defaultValue: false,
        describe: "The header blocks level start",
        type: "integer",
      },
      parseImgDimensions: {
        defaultValue: false,
        describe: "Turn on/off image dimension parsing",
        type: "boolean",
      },
      simplifiedAutoLink: {
        defaultValue: false,
        describe: "Turn on/off GFM autolink style",
        type: "boolean",
      },
      excludeTrailingPunctuationFromURLs: {
        defaultValue: false,
        describe: "Excludes trailing punctuation from links generated with autoLinking",
        type: "boolean",
      },
      literalMidWordUnderscores: {
        defaultValue: false,
        describe: "Parse midword underscores as literal underscores",
        type: "boolean",
      },
      literalMidWordAsterisks: {
        defaultValue: false,
        describe: "Parse midword asterisks as literal asterisks",
        type: "boolean",
      },
      strikethrough: {
        defaultValue: false,
        describe: "Turn on/off strikethrough support",
        type: "boolean",
      },
      tables: {
        defaultValue: false,
        describe: "Turn on/off tables support",
        type: "boolean",
      },
      tablesHeaderId: {
        defaultValue: false,
        describe: "Add an id to table headers",
        type: "boolean",
      },
      ghCodeBlocks: {
        defaultValue: true,
        describe: "Turn on/off GFM fenced code blocks support",
        type: "boolean",
      },
      tasklists: {
        defaultValue: false,
        describe: "Turn on/off GFM tasklist support",
        type: "boolean",
      },
      smoothLivePreview: {
        defaultValue: false,
        describe: "Prevents weird effects in live previews due to incomplete input",
        type: "boolean",
      },
      smartIndentationFix: {
        defaultValue: false,
        description: "Tries to smartly fix indentation in es6 strings",
        type: "boolean",
      },
      disableForced4SpacesIndentedSublists: {
        defaultValue: false,
        description: "Disables the requirement of indenting nested sublists by 4 spaces",
        type: "boolean",
      },
      simpleLineBreaks: {
        defaultValue: false,
        description: "Parses simple line breaks as <br> (GFM Style)",
        type: "boolean",
      },
      requireSpaceBeforeHeadingText: {
        defaultValue: false,
        description: "Makes adding a space between `#` and the header text mandatory (GFM Style)",
        type: "boolean",
      },
      ghMentions: {
        defaultValue: false,
        description: "Enables github @mentions",
        type: "boolean",
      },
      ghMentionsLink: {
        defaultValue: "https://github.com/{u}",
        description: "Changes the link generated by @mentions. Only applies if ghMentions option is enabled.",
        type: "string",
      },
      encodeEmails: {
        defaultValue: true,
        description: "Encode e-mail addresses through the use of Character Entities, transforming ASCII e-mail addresses into its equivalent decimal entities",
        type: "boolean",
      },
      openLinksInNewWindow: {
        defaultValue: false,
        description: "Open all links in new windows",
        type: "boolean",
      },
      backslashEscapesHTMLTags: {
        defaultValue: false,
        description: "Support for HTML Tag escaping. ex: <div>foo</div>",
        type: "boolean",
      },
      emoji: {
        defaultValue: false,
        description: "Enable emoji support. Ex: `this is a :smile: emoji`",
        type: "boolean",
      },
      underline: {
        defaultValue: false,
        description: "Enable support for underline. Syntax is double or triple underscores: `__underline word__`. With this option enabled, underscores no longer parses into `<em>` and `<strong>`",
        type: "boolean",
      },
      completeHTMLDocument: {
        defaultValue: false,
        description: "Outputs a complete html document, including `<html>`, `<head>` and `<body>` tags",
        type: "boolean",
      },
      metadata: {
        defaultValue: false,
        description: "Enable support for document metadata (defined at the top of the document between `«««` and `»»»` or between `---` and `---`).",
        type: "boolean",
      },
      splitAdjacentBlockquotes: {
        defaultValue: false,
        description: "Split adjacent blockquote blocks",
        type: "boolean",
      },
    };
    if (simple === false) {
      return JSON.parse(JSON.stringify(defaultOptions));
    }
    var ret = {};
    for (var opt in defaultOptions) {
      if (defaultOptions.hasOwnProperty(opt)) {
        ret[opt] = defaultOptions[opt].defaultValue;
      }
    }
    return ret;
  }

  function allOptionsOn() {
    var options = getDefaultOpts(true),
      ret = {};
    for (var opt in options) {
      if (options.hasOwnProperty(opt)) {
        ret[opt] = true;
      }
    }
    return ret;
  }
  var showdown = {},
    parsers = {},
    extensions = {},
    globalOptions = getDefaultOpts(true),
    setFlavor = "vanilla",
    flavor = {
      github: {
        omitExtraWLInCodeBlocks: true,
        simplifiedAutoLink: true,
        excludeTrailingPunctuationFromURLs: true,
        literalMidWordUnderscores: true,
        strikethrough: true,
        tables: true,
        tablesHeaderId: true,
        ghCodeBlocks: true,
        tasklists: true,
        disableForced4SpacesIndentedSublists: true,
        simpleLineBreaks: true,
        requireSpaceBeforeHeadingText: true,
        ghCompatibleHeaderId: true,
        ghMentions: true,
        backslashEscapesHTMLTags: true,
        emoji: true,
        splitAdjacentBlockquotes: true,
      },
      original: {
        noHeaderId: true,
        ghCodeBlocks: false,
      },
      ghost: {
        omitExtraWLInCodeBlocks: true,
        parseImgDimensions: true,
        simplifiedAutoLink: true,
        excludeTrailingPunctuationFromURLs: true,
        literalMidWordUnderscores: true,
        strikethrough: true,
        tables: true,
        tablesHeaderId: true,
        ghCodeBlocks: true,
        tasklists: true,
        smoothLivePreview: true,
        simpleLineBreaks: true,
        requireSpaceBeforeHeadingText: true,
        ghMentions: false,
        encodeEmails: true,
      },
      vanilla: getDefaultOpts(true),
      allOn: allOptionsOn(),
    };
  showdown.helper = {};
  showdown.extensions = {};
  showdown.setOption = function (key, value) {
    globalOptions[key] = value;
    return this;
  };
  showdown.getOption = function (key) {
    return globalOptions[key];
  };
  showdown.getOptions = function () {
    return globalOptions;
  };
  showdown.resetOptions = function () {
    globalOptions = getDefaultOpts(true);
  };
  showdown.setFlavor = function (name) {
    if (!flavor.hasOwnProperty(name)) {
      throw Error(name + " flavor was not found");
    }
    showdown.resetOptions();
    var preset = flavor[name];
    setFlavor = name;
    for (var option in preset) {
      if (preset.hasOwnProperty(option)) {
        globalOptions[option] = preset[option];
      }
    }
  };
  showdown.getFlavor = function () {
    return setFlavor;
  };
  showdown.getFlavorOptions = function (name) {
    if (flavor.hasOwnProperty(name)) {
      return flavor[name];
    }
  };
  showdown.getDefaultOptions = function (simple) {
    return getDefaultOpts(simple);
  };
  showdown.subParser = function (name, func) {
    if (showdown.helper.isString(name)) {
      if (typeof func !== "undefined") {
        parsers[name] = func;
      } else {
        if (parsers.hasOwnProperty(name)) {
          return parsers[name];
        } else {
          throw Error("SubParser named " + name + " not registered!");
        }
      }
    }
  };
  showdown.extension = function (name, ext) {
    if (!showdown.helper.isString(name)) {
      throw Error("Extension 'name' must be a string");
    }
    name = showdown.helper.stdExtName(name);
    if (showdown.helper.isUndefined(ext)) {
      if (!extensions.hasOwnProperty(name)) {
        throw Error("Extension named " + name + " is not registered!");
      }
      return extensions[name];
    } else {
      if (typeof ext === "function") {
        ext = ext();
      }
      if (!showdown.helper.isArray(ext)) {
        ext = [ext];
      }
      var validExtension = validate(ext, name);
      if (validExtension.valid) {
        extensions[name] = ext;
      } else {
        throw Error(validExtension.error);
      }
    }
  };
  showdown.getAllExtensions = function () {
    return extensions;
  };
  showdown.removeExtension = function (name) {
    delete extensions[name];
  };
  showdown.resetExtensions = function () {
    extensions = {};
  };

  function validate(extension, name) {
    var errMsg = name ?
      "Error in " + name + " extension->" :
      "Error in unnamed extension",
      ret = {
        valid: true,
        error: "",
      };
    if (!showdown.helper.isArray(extension)) {
      extension = [extension];
    }
    for (var i = 0; i < extension.length; ++i) {
      var baseMsg = errMsg + " sub-extension " + i + ": ",
        ext = extension[i];
      if (typeof ext !== "object") {
        ret.valid = false;
        ret.error = baseMsg + "must be an object, but " + typeof ext + " given";
        return ret;
      }
      if (!showdown.helper.isString(ext.type)) {
        ret.valid = false;
        ret.error =
          baseMsg +
          'property "type" must be a string, but ' +
          typeof ext.type +
          " given";
        return ret;
      }
      var type = (ext.type = ext.type.toLowerCase());
      if (type === "language") {
        type = ext.type = "lang";
      }
      if (type === "html") {
        type = ext.type = "output";
      }
      if (type !== "lang" && type !== "output" && type !== "listener") {
        ret.valid = false;
        ret.error =
          baseMsg +
          "type " +
          type +
          ' is not recognized. Valid values: "lang/language", "output/html" or "listener"';
        return ret;
      }
      if (type === "listener") {
        if (showdown.helper.isUndefined(ext.listeners)) {
          ret.valid = false;
          ret.error =
            baseMsg +
            '. Extensions of type "listener" must have a property called "listeners"';
          return ret;
        }
      } else {
        if (
          showdown.helper.isUndefined(ext.filter) &&
          showdown.helper.isUndefined(ext.regex)
        ) {
          ret.valid = false;
          ret.error =
            baseMsg +
            type +
            ' extensions must define either a "regex" property or a "filter" method';
          return ret;
        }
      }
      if (ext.listeners) {
        if (typeof ext.listeners !== "object") {
          ret.valid = false;
          ret.error =
            baseMsg +
            '"listeners" property must be an object but ' +
            typeof ext.listeners +
            " given";
          return ret;
        }
        for (var ln in ext.listeners) {
          if (ext.listeners.hasOwnProperty(ln)) {
            if (typeof ext.listeners[ln] !== "function") {
              ret.valid = false;
              ret.error =
                baseMsg +
                '"listeners" property must be an hash of [event name]: [callback]. listeners.' +
                ln +
                " must be a function but " +
                typeof ext.listeners[ln] +
                " given";
              return ret;
            }
          }
        }
      }
      if (ext.filter) {
        if (typeof ext.filter !== "function") {
          ret.valid = false;
          ret.error =
            baseMsg +
            '"filter" must be a function, but ' +
            typeof ext.filter +
            " given";
          return ret;
        }
      } else {
        if (ext.regex) {
          if (showdown.helper.isString(ext.regex)) {
            ext.regex = new RegExp(ext.regex, "g");
          }
          if (!(ext.regex instanceof RegExp)) {
            ret.valid = false;
            ret.error =
              baseMsg +
              '"regex" property must either be a string or a RegExp object, but ' +
              typeof ext.regex +
              " given";
            return ret;
          }
          if (showdown.helper.isUndefined(ext.replace)) {
            ret.valid = false;
            ret.error =
              baseMsg +
              '"regex" extensions must implement a replace string or function';
            return ret;
          }
        }
      }
    }
    return ret;
  }
  showdown.validateExtension = function (ext) {
    var validateExtension = validate(ext, null);
    if (!validateExtension.valid) {
      console.warn(validateExtension.error);
      return false;
    }
    return true;
  };
  if (!showdown.hasOwnProperty("helper")) {
    showdown.helper = {};
  }
  showdown.helper.isString = function (a) {
    return typeof a === "string" || a instanceof String;
  };
  showdown.helper.isFunction = function (a) {
    var getType = {};
    return a && getType.toString.call(a) === "[object Function]";
  };
  showdown.helper.isArray = function (a) {
    return Array.isArray(a);
  };
  showdown.helper.isUndefined = function (value) {
    return typeof value === "undefined";
  };
  showdown.helper.forEach = function (obj, callback) {
    if (showdown.helper.isUndefined(obj)) {
      throw new Error("obj param is required");
    }
    if (showdown.helper.isUndefined(callback)) {
      throw new Error("callback param is required");
    }
    if (!showdown.helper.isFunction(callback)) {
      throw new Error("callback param must be a function/closure");
    }
    if (typeof obj.forEach === "function") {
      obj.forEach(callback);
    } else {
      if (showdown.helper.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
          callback(obj[i], i, obj);
        }
      } else {
        if (typeof obj === "object") {
          for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
              callback(obj[prop], prop, obj);
            }
          }
        } else {
          throw new Error(
            "obj does not seem to be an array or an iterable object"
          );
        }
      }
    }
  };
  showdown.helper.stdExtName = function (s) {
    return s
      .replace(/[_?*+\/\\.^-]/g, "")
      .replace(/\s/g, "")
      .toLowerCase();
  };

  function escapeCharactersCallback(wholeMatch, m1) {
    var charCodeToEscape = m1.charCodeAt(0);
    return "¨E" + charCodeToEscape + "E";
  }
  showdown.helper.escapeCharactersCallback = escapeCharactersCallback;
  showdown.helper.escapeCharacters = function (
    text,
    charsToEscape,
    afterBackslash
  ) {
    var regexString =
      "([" + charsToEscape.replace(/([\[\]\\])/g, "\\$1") + "])";
    if (afterBackslash) {
      regexString = "\\\\" + regexString;
    }
    var regex = new RegExp(regexString, "g");
    text = text.replace(regex, escapeCharactersCallback);
    return text;
  };
  showdown.helper.unescapeHTMLEntities = function (txt) {
    return txt
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  };
  var rgxFindMatchPos = function (str, left, right, flags) {
    var f = flags || "",
      g = f.indexOf("g") > -1,
      x = new RegExp(left + "|" + right, "g" + f.replace(/g/g, "")),
      l = new RegExp(left, f.replace(/g/g, "")),
      pos = [],
      t,
      s,
      m,
      start,
      end;
    do {
      t = 0;
      while ((m = x.exec(str))) {
        if (l.test(m[0])) {
          if (!t++) {
            s = x.lastIndex;
            start = s - m[0].length;
          }
        } else {
          if (t) {
            if (!--t) {
              end = m.index + m[0].length;
              var obj = {
                left: {
                  start: start,
                  end: s,
                },
                match: {
                  start: s,
                  end: m.index,
                },
                right: {
                  start: m.index,
                  end: end,
                },
                wholeMatch: {
                  start: start,
                  end: end,
                },
              };
              pos.push(obj);
              if (!g) {
                return pos;
              }
            }
          }
        }
      }
    } while (t && (x.lastIndex = s));
    return pos;
  };
  showdown.helper.matchRecursiveRegExp = function (str, left, right, flags) {
    var matchPos = rgxFindMatchPos(str, left, right, flags),
      results = [];
    for (var i = 0; i < matchPos.length; ++i) {
      results.push([
        str.slice(matchPos[i].wholeMatch.start, matchPos[i].wholeMatch.end),
        str.slice(matchPos[i].match.start, matchPos[i].match.end),
        str.slice(matchPos[i].left.start, matchPos[i].left.end),
        str.slice(matchPos[i].right.start, matchPos[i].right.end),
      ]);
    }
    return results;
  };
  showdown.helper.replaceRecursiveRegExp = function (
    str,
    replacement,
    left,
    right,
    flags
  ) {
    if (!showdown.helper.isFunction(replacement)) {
      var repStr = replacement;
      replacement = function () {
        return repStr;
      };
    }
    var matchPos = rgxFindMatchPos(str, left, right, flags),
      finalStr = str,
      lng = matchPos.length;
    if (lng > 0) {
      var bits = [];
      if (matchPos[0].wholeMatch.start !== 0) {
        bits.push(str.slice(0, matchPos[0].wholeMatch.start));
      }
      for (var i = 0; i < lng; ++i) {
        bits.push(
          replacement(
            str.slice(matchPos[i].wholeMatch.start, matchPos[i].wholeMatch.end),
            str.slice(matchPos[i].match.start, matchPos[i].match.end),
            str.slice(matchPos[i].left.start, matchPos[i].left.end),
            str.slice(matchPos[i].right.start, matchPos[i].right.end)
          )
        );
        if (i < lng - 1) {
          bits.push(
            str.slice(
              matchPos[i].wholeMatch.end,
              matchPos[i + 1].wholeMatch.start
            )
          );
        }
      }
      if (matchPos[lng - 1].wholeMatch.end < str.length) {
        bits.push(str.slice(matchPos[lng - 1].wholeMatch.end));
      }
      finalStr = bits.join("");
    }
    return finalStr;
  };
  showdown.helper.regexIndexOf = function (str, regex, fromIndex) {
    if (!showdown.helper.isString(str)) {
      throw "InvalidArgumentError: first parameter of showdown.helper.regexIndexOf function must be a string";
    }
    if (regex instanceof RegExp === false) {
      throw "InvalidArgumentError: second parameter of showdown.helper.regexIndexOf function must be an instance of RegExp";
    }
    var indexOf = str.substring(fromIndex || 0).search(regex);
    return indexOf >= 0 ? indexOf + (fromIndex || 0) : indexOf;
  };
  showdown.helper.splitAtIndex = function (str, index) {
    if (!showdown.helper.isString(str)) {
      throw "InvalidArgumentError: first parameter of showdown.helper.regexIndexOf function must be a string";
    }
    return [str.substring(0, index), str.substring(index)];
  };
  showdown.helper.encodeEmailAddress = function (mail) {
    var encode = [
      function (ch) {
        return "&#" + ch.charCodeAt(0) + ";";
      },
      function (ch) {
        return "&#x" + ch.charCodeAt(0).toString(16) + ";";
      },
      function (ch) {
        return ch;
      },
    ];
    mail = mail.replace(/./g, function (ch) {
      if (ch === "@") {
        ch = encode[Math.floor(Math.random() * 2)](ch);
      } else {
        var r = Math.random();
        ch = r > 0.9 ? encode[2](ch) : r > 0.45 ? encode[1](ch) : encode[0](ch);
      }
      return ch;
    });
    return mail;
  };
  showdown.helper.padEnd = function padEnd(str, targetLength, padString) {
    targetLength = targetLength >> 0;
    padString = String(padString || " ");
    if (str.length > targetLength) {
      return String(str);
    } else {
      targetLength = targetLength - str.length;
      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length);
      }
      return String(str) + padString.slice(0, targetLength);
    }
  };
  if (typeof console === "undefined") {
    console = {
      warn: function (msg) {
        alert(msg);
      },
      log: function (msg) {
        alert(msg);
      },
      error: function (msg) {
        throw msg;
      },
    };
  }
  showdown.helper.regexes = {
    asteriskDashAndColon: /([*_:~])/g,
  };
  showdown.helper.emojis = {
    "+1": "\ud83d\udc4d",
    "-1": "\ud83d\udc4e",
    "100": "\ud83d\udcaf",
    "1234": "\ud83d\udd22",
    "1st_place_medal": "\ud83e\udd47",
    "2nd_place_medal": "\ud83e\udd48",
    "3rd_place_medal": "\ud83e\udd49",
    "8ball": "\ud83c\udfb1",
    a: "\ud83c\udd70\ufe0f",
    ab: "\ud83c\udd8e",
    abc: "\ud83d\udd24",
    abcd: "\ud83d\udd21",
    accept: "\ud83c\ude51",
    aerial_tramway: "\ud83d\udea1",
    airplane: "\u2708\ufe0f",
    alarm_clock: "\u23f0",
    alembic: "\u2697\ufe0f",
    alien: "\ud83d\udc7d",
    ambulance: "\ud83d\ude91",
    amphora: "\ud83c\udffa",
    anchor: "\u2693\ufe0f",
    angel: "\ud83d\udc7c",
    anger: "\ud83d\udca2",
    angry: "\ud83d\ude20",
    anguished: "\ud83d\ude27",
    ant: "\ud83d\udc1c",
    apple: "\ud83c\udf4e",
    aquarius: "\u2652\ufe0f",
    aries: "\u2648\ufe0f",
    arrow_backward: "\u25c0\ufe0f",
    arrow_double_down: "\u23ec",
    arrow_double_up: "\u23eb",
    arrow_down: "\u2b07\ufe0f",
    arrow_down_small: "\ud83d\udd3d",
    arrow_forward: "\u25b6\ufe0f",
    arrow_heading_down: "\u2935\ufe0f",
    arrow_heading_up: "\u2934\ufe0f",
    arrow_left: "\u2b05\ufe0f",
    arrow_lower_left: "\u2199\ufe0f",
    arrow_lower_right: "\u2198\ufe0f",
    arrow_right: "\u27a1\ufe0f",
    arrow_right_hook: "\u21aa\ufe0f",
    arrow_up: "\u2b06\ufe0f",
    arrow_up_down: "\u2195\ufe0f",
    arrow_up_small: "\ud83d\udd3c",
    arrow_upper_left: "\u2196\ufe0f",
    arrow_upper_right: "\u2197\ufe0f",
    arrows_clockwise: "\ud83d\udd03",
    arrows_counterclockwise: "\ud83d\udd04",
    art: "\ud83c\udfa8",
    articulated_lorry: "\ud83d\ude9b",
    artificial_satellite: "\ud83d\udef0",
    astonished: "\ud83d\ude32",
    athletic_shoe: "\ud83d\udc5f",
    atm: "\ud83c\udfe7",
    atom_symbol: "\u269b\ufe0f",
    avocado: "\ud83e\udd51",
    b: "\ud83c\udd71\ufe0f",
    baby: "\ud83d\udc76",
    baby_bottle: "\ud83c\udf7c",
    baby_chick: "\ud83d\udc24",
    baby_symbol: "\ud83d\udebc",
    back: "\ud83d\udd19",
    bacon: "\ud83e\udd53",
    badminton: "\ud83c\udff8",
    baggage_claim: "\ud83d\udec4",
    baguette_bread: "\ud83e\udd56",
    balance_scale: "\u2696\ufe0f",
    balloon: "\ud83c\udf88",
    ballot_box: "\ud83d\uddf3",
    ballot_box_with_check: "\u2611\ufe0f",
    bamboo: "\ud83c\udf8d",
    banana: "\ud83c\udf4c",
    bangbang: "\u203c\ufe0f",
    bank: "\ud83c\udfe6",
    bar_chart: "\ud83d\udcca",
    barber: "\ud83d\udc88",
    baseball: "\u26be\ufe0f",
    basketball: "\ud83c\udfc0",
    basketball_man: "\u26f9\ufe0f",
    basketball_woman: "\u26f9\ufe0f&zwj;\u2640\ufe0f",
    bat: "\ud83e\udd87",
    bath: "\ud83d\udec0",
    bathtub: "\ud83d\udec1",
    battery: "\ud83d\udd0b",
    beach_umbrella: "\ud83c\udfd6",
    bear: "\ud83d\udc3b",
    bed: "\ud83d\udecf",
    bee: "\ud83d\udc1d",
    beer: "\ud83c\udf7a",
    beers: "\ud83c\udf7b",
    beetle: "\ud83d\udc1e",
    beginner: "\ud83d\udd30",
    bell: "\ud83d\udd14",
    bellhop_bell: "\ud83d\udece",
    bento: "\ud83c\udf71",
    biking_man: "\ud83d\udeb4",
    bike: "\ud83d\udeb2",
    biking_woman: "\ud83d\udeb4&zwj;\u2640\ufe0f",
    bikini: "\ud83d\udc59",
    biohazard: "\u2623\ufe0f",
    bird: "\ud83d\udc26",
    birthday: "\ud83c\udf82",
    black_circle: "\u26ab\ufe0f",
    black_flag: "\ud83c\udff4",
    black_heart: "\ud83d\udda4",
    black_joker: "\ud83c\udccf",
    black_large_square: "\u2b1b\ufe0f",
    black_medium_small_square: "\u25fe\ufe0f",
    black_medium_square: "\u25fc\ufe0f",
    black_nib: "\u2712\ufe0f",
    black_small_square: "\u25aa\ufe0f",
    black_square_button: "\ud83d\udd32",
    blonde_man: "\ud83d\udc71",
    blonde_woman: "\ud83d\udc71&zwj;\u2640\ufe0f",
    blossom: "\ud83c\udf3c",
    blowfish: "\ud83d\udc21",
    blue_book: "\ud83d\udcd8",
    blue_car: "\ud83d\ude99",
    blue_heart: "\ud83d\udc99",
    blush: "\ud83d\ude0a",
    boar: "\ud83d\udc17",
    boat: "\u26f5\ufe0f",
    bomb: "\ud83d\udca3",
    book: "\ud83d\udcd6",
    bookmark: "\ud83d\udd16",
    bookmark_tabs: "\ud83d\udcd1",
    books: "\ud83d\udcda",
    boom: "\ud83d\udca5",
    boot: "\ud83d\udc62",
    bouquet: "\ud83d\udc90",
    bowing_man: "\ud83d\ude47",
    bow_and_arrow: "\ud83c\udff9",
    bowing_woman: "\ud83d\ude47&zwj;\u2640\ufe0f",
    bowling: "\ud83c\udfb3",
    boxing_glove: "\ud83e\udd4a",
    boy: "\ud83d\udc66",
    bread: "\ud83c\udf5e",
    bride_with_veil: "\ud83d\udc70",
    bridge_at_night: "\ud83c\udf09",
    briefcase: "\ud83d\udcbc",
    broken_heart: "\ud83d\udc94",
    bug: "\ud83d\udc1b",
    building_construction: "\ud83c\udfd7",
    bulb: "\ud83d\udca1",
    bullettrain_front: "\ud83d\ude85",
    bullettrain_side: "\ud83d\ude84",
    burrito: "\ud83c\udf2f",
    bus: "\ud83d\ude8c",
    business_suit_levitating: "\ud83d\udd74",
    busstop: "\ud83d\ude8f",
    bust_in_silhouette: "\ud83d\udc64",
    busts_in_silhouette: "\ud83d\udc65",
    butterfly: "\ud83e\udd8b",
    cactus: "\ud83c\udf35",
    cake: "\ud83c\udf70",
    calendar: "\ud83d\udcc6",
    call_me_hand: "\ud83e\udd19",
    calling: "\ud83d\udcf2",
    camel: "\ud83d\udc2b",
    camera: "\ud83d\udcf7",
    camera_flash: "\ud83d\udcf8",
    camping: "\ud83c\udfd5",
    cancer: "\u264b\ufe0f",
    candle: "\ud83d\udd6f",
    candy: "\ud83c\udf6c",
    canoe: "\ud83d\udef6",
    capital_abcd: "\ud83d\udd20",
    capricorn: "\u2651\ufe0f",
    car: "\ud83d\ude97",
    card_file_box: "\ud83d\uddc3",
    card_index: "\ud83d\udcc7",
    card_index_dividers: "\ud83d\uddc2",
    carousel_horse: "\ud83c\udfa0",
    carrot: "\ud83e\udd55",
    cat: "\ud83d\udc31",
    cat2: "\ud83d\udc08",
    cd: "\ud83d\udcbf",
    chains: "\u26d3",
    champagne: "\ud83c\udf7e",
    chart: "\ud83d\udcb9",
    chart_with_downwards_trend: "\ud83d\udcc9",
    chart_with_upwards_trend: "\ud83d\udcc8",
    checkered_flag: "\ud83c\udfc1",
    cheese: "\ud83e\uddc0",
    cherries: "\ud83c\udf52",
    cherry_blossom: "\ud83c\udf38",
    chestnut: "\ud83c\udf30",
    chicken: "\ud83d\udc14",
    children_crossing: "\ud83d\udeb8",
    chipmunk: "\ud83d\udc3f",
    chocolate_bar: "\ud83c\udf6b",
    christmas_tree: "\ud83c\udf84",
    church: "\u26ea\ufe0f",
    cinema: "\ud83c\udfa6",
    circus_tent: "\ud83c\udfaa",
    city_sunrise: "\ud83c\udf07",
    city_sunset: "\ud83c\udf06",
    cityscape: "\ud83c\udfd9",
    cl: "\ud83c\udd91",
    clamp: "\ud83d\udddc",
    clap: "\ud83d\udc4f",
    clapper: "\ud83c\udfac",
    classical_building: "\ud83c\udfdb",
    clinking_glasses: "\ud83e\udd42",
    clipboard: "\ud83d\udccb",
    clock1: "\ud83d\udd50",
    clock10: "\ud83d\udd59",
    clock1030: "\ud83d\udd65",
    clock11: "\ud83d\udd5a",
    clock1130: "\ud83d\udd66",
    clock12: "\ud83d\udd5b",
    clock1230: "\ud83d\udd67",
    clock130: "\ud83d\udd5c",
    clock2: "\ud83d\udd51",
    clock230: "\ud83d\udd5d",
    clock3: "\ud83d\udd52",
    clock330: "\ud83d\udd5e",
    clock4: "\ud83d\udd53",
    clock430: "\ud83d\udd5f",
    clock5: "\ud83d\udd54",
    clock530: "\ud83d\udd60",
    clock6: "\ud83d\udd55",
    clock630: "\ud83d\udd61",
    clock7: "\ud83d\udd56",
    clock730: "\ud83d\udd62",
    clock8: "\ud83d\udd57",
    clock830: "\ud83d\udd63",
    clock9: "\ud83d\udd58",
    clock930: "\ud83d\udd64",
    closed_book: "\ud83d\udcd5",
    closed_lock_with_key: "\ud83d\udd10",
    closed_umbrella: "\ud83c\udf02",
    cloud: "\u2601\ufe0f",
    cloud_with_lightning: "\ud83c\udf29",
    cloud_with_lightning_and_rain: "\u26c8",
    cloud_with_rain: "\ud83c\udf27",
    cloud_with_snow: "\ud83c\udf28",
    clown_face: "\ud83e\udd21",
    clubs: "\u2663\ufe0f",
    cocktail: "\ud83c\udf78",
    coffee: "\u2615\ufe0f",
    coffin: "\u26b0\ufe0f",
    cold_sweat: "\ud83d\ude30",
    comet: "\u2604\ufe0f",
    computer: "\ud83d\udcbb",
    computer_mouse: "\ud83d\uddb1",
    confetti_ball: "\ud83c\udf8a",
    confounded: "\ud83d\ude16",
    confused: "\ud83d\ude15",
    congratulations: "\u3297\ufe0f",
    construction: "\ud83d\udea7",
    construction_worker_man: "\ud83d\udc77",
    construction_worker_woman: "\ud83d\udc77&zwj;\u2640\ufe0f",
    control_knobs: "\ud83c\udf9b",
    convenience_store: "\ud83c\udfea",
    cookie: "\ud83c\udf6a",
    cool: "\ud83c\udd92",
    policeman: "\ud83d\udc6e",
    copyright: "\u00a9\ufe0f",
    corn: "\ud83c\udf3d",
    couch_and_lamp: "\ud83d\udecb",
    couple: "\ud83d\udc6b",
    couple_with_heart_woman_man: "\ud83d\udc91",
    couple_with_heart_man_man: "\ud83d\udc68&zwj;\u2764\ufe0f&zwj;\ud83d\udc68",
    couple_with_heart_woman_woman: "\ud83d\udc69&zwj;\u2764\ufe0f&zwj;\ud83d\udc69",
    couplekiss_man_man: "\ud83d\udc68&zwj;\u2764\ufe0f&zwj;\ud83d\udc8b&zwj;\ud83d\udc68",
    couplekiss_man_woman: "\ud83d\udc8f",
    couplekiss_woman_woman: "\ud83d\udc69&zwj;\u2764\ufe0f&zwj;\ud83d\udc8b&zwj;\ud83d\udc69",
    cow: "\ud83d\udc2e",
    cow2: "\ud83d\udc04",
    cowboy_hat_face: "\ud83e\udd20",
    crab: "\ud83e\udd80",
    crayon: "\ud83d\udd8d",
    credit_card: "\ud83d\udcb3",
    crescent_moon: "\ud83c\udf19",
    cricket: "\ud83c\udfcf",
    crocodile: "\ud83d\udc0a",
    croissant: "\ud83e\udd50",
    crossed_fingers: "\ud83e\udd1e",
    crossed_flags: "\ud83c\udf8c",
    crossed_swords: "\u2694\ufe0f",
    crown: "\ud83d\udc51",
    cry: "\ud83d\ude22",
    crying_cat_face: "\ud83d\ude3f",
    crystal_ball: "\ud83d\udd2e",
    cucumber: "\ud83e\udd52",
    cupid: "\ud83d\udc98",
    curly_loop: "\u27b0",
    currency_exchange: "\ud83d\udcb1",
    curry: "\ud83c\udf5b",
    custard: "\ud83c\udf6e",
    customs: "\ud83d\udec3",
    cyclone: "\ud83c\udf00",
    dagger: "\ud83d\udde1",
    dancer: "\ud83d\udc83",
    dancing_women: "\ud83d\udc6f",
    dancing_men: "\ud83d\udc6f&zwj;\u2642\ufe0f",
    dango: "\ud83c\udf61",
    dark_sunglasses: "\ud83d\udd76",
    dart: "\ud83c\udfaf",
    dash: "\ud83d\udca8",
    date: "\ud83d\udcc5",
    deciduous_tree: "\ud83c\udf33",
    deer: "\ud83e\udd8c",
    department_store: "\ud83c\udfec",
    derelict_house: "\ud83c\udfda",
    desert: "\ud83c\udfdc",
    desert_island: "\ud83c\udfdd",
    desktop_computer: "\ud83d\udda5",
    male_detective: "\ud83d\udd75\ufe0f",
    diamond_shape_with_a_dot_inside: "\ud83d\udca0",
    diamonds: "\u2666\ufe0f",
    disappointed: "\ud83d\ude1e",
    disappointed_relieved: "\ud83d\ude25",
    dizzy: "\ud83d\udcab",
    dizzy_face: "\ud83d\ude35",
    do_not_litter: "\ud83d\udeaf",
    dog: "\ud83d\udc36",
    dog2: "\ud83d\udc15",
    dollar: "\ud83d\udcb5",
    dolls: "\ud83c\udf8e",
    dolphin: "\ud83d\udc2c",
    door: "\ud83d\udeaa",
    doughnut: "\ud83c\udf69",
    dove: "\ud83d\udd4a",
    dragon: "\ud83d\udc09",
    dragon_face: "\ud83d\udc32",
    dress: "\ud83d\udc57",
    dromedary_camel: "\ud83d\udc2a",
    drooling_face: "\ud83e\udd24",
    droplet: "\ud83d\udca7",
    drum: "\ud83e\udd41",
    duck: "\ud83e\udd86",
    dvd: "\ud83d\udcc0",
    "e-mail": "\ud83d\udce7",
    eagle: "\ud83e\udd85",
    ear: "\ud83d\udc42",
    ear_of_rice: "\ud83c\udf3e",
    earth_africa: "\ud83c\udf0d",
    earth_americas: "\ud83c\udf0e",
    earth_asia: "\ud83c\udf0f",
    egg: "\ud83e\udd5a",
    eggplant: "\ud83c\udf46",
    eight_pointed_black_star: "\u2734\ufe0f",
    eight_spoked_asterisk: "\u2733\ufe0f",
    electric_plug: "\ud83d\udd0c",
    elephant: "\ud83d\udc18",
    email: "\u2709\ufe0f",
    end: "\ud83d\udd1a",
    envelope_with_arrow: "\ud83d\udce9",
    euro: "\ud83d\udcb6",
    european_castle: "\ud83c\udff0",
    european_post_office: "\ud83c\udfe4",
    evergreen_tree: "\ud83c\udf32",
    exclamation: "\u2757\ufe0f",
    expressionless: "\ud83d\ude11",
    eye: "\ud83d\udc41",
    eye_speech_bubble: "\ud83d\udc41&zwj;\ud83d\udde8",
    eyeglasses: "\ud83d\udc53",
    eyes: "\ud83d\udc40",
    face_with_head_bandage: "\ud83e\udd15",
    face_with_thermometer: "\ud83e\udd12",
    fist_oncoming: "\ud83d\udc4a",
    factory: "\ud83c\udfed",
    fallen_leaf: "\ud83c\udf42",
    family_man_woman_boy: "\ud83d\udc6a",
    family_man_boy: "\ud83d\udc68&zwj;\ud83d\udc66",
    family_man_boy_boy: "\ud83d\udc68&zwj;\ud83d\udc66&zwj;\ud83d\udc66",
    family_man_girl: "\ud83d\udc68&zwj;\ud83d\udc67",
    family_man_girl_boy: "\ud83d\udc68&zwj;\ud83d\udc67&zwj;\ud83d\udc66",
    family_man_girl_girl: "\ud83d\udc68&zwj;\ud83d\udc67&zwj;\ud83d\udc67",
    family_man_man_boy: "\ud83d\udc68&zwj;\ud83d\udc68&zwj;\ud83d\udc66",
    family_man_man_boy_boy: "\ud83d\udc68&zwj;\ud83d\udc68&zwj;\ud83d\udc66&zwj;\ud83d\udc66",
    family_man_man_girl: "\ud83d\udc68&zwj;\ud83d\udc68&zwj;\ud83d\udc67",
    family_man_man_girl_boy: "\ud83d\udc68&zwj;\ud83d\udc68&zwj;\ud83d\udc67&zwj;\ud83d\udc66",
    family_man_man_girl_girl: "\ud83d\udc68&zwj;\ud83d\udc68&zwj;\ud83d\udc67&zwj;\ud83d\udc67",
    family_man_woman_boy_boy: "\ud83d\udc68&zwj;\ud83d\udc69&zwj;\ud83d\udc66&zwj;\ud83d\udc66",
    family_man_woman_girl: "\ud83d\udc68&zwj;\ud83d\udc69&zwj;\ud83d\udc67",
    family_man_woman_girl_boy: "\ud83d\udc68&zwj;\ud83d\udc69&zwj;\ud83d\udc67&zwj;\ud83d\udc66",
    family_man_woman_girl_girl: "\ud83d\udc68&zwj;\ud83d\udc69&zwj;\ud83d\udc67&zwj;\ud83d\udc67",
    family_woman_boy: "\ud83d\udc69&zwj;\ud83d\udc66",
    family_woman_boy_boy: "\ud83d\udc69&zwj;\ud83d\udc66&zwj;\ud83d\udc66",
    family_woman_girl: "\ud83d\udc69&zwj;\ud83d\udc67",
    family_woman_girl_boy: "\ud83d\udc69&zwj;\ud83d\udc67&zwj;\ud83d\udc66",
    family_woman_girl_girl: "\ud83d\udc69&zwj;\ud83d\udc67&zwj;\ud83d\udc67",
    family_woman_woman_boy: "\ud83d\udc69&zwj;\ud83d\udc69&zwj;\ud83d\udc66",
    family_woman_woman_boy_boy: "\ud83d\udc69&zwj;\ud83d\udc69&zwj;\ud83d\udc66&zwj;\ud83d\udc66",
    family_woman_woman_girl: "\ud83d\udc69&zwj;\ud83d\udc69&zwj;\ud83d\udc67",
    family_woman_woman_girl_boy: "\ud83d\udc69&zwj;\ud83d\udc69&zwj;\ud83d\udc67&zwj;\ud83d\udc66",
    family_woman_woman_girl_girl: "\ud83d\udc69&zwj;\ud83d\udc69&zwj;\ud83d\udc67&zwj;\ud83d\udc67",
    fast_forward: "\u23e9",
    fax: "\ud83d\udce0",
    fearful: "\ud83d\ude28",
    feet: "\ud83d\udc3e",
    female_detective: "\ud83d\udd75\ufe0f&zwj;\u2640\ufe0f",
    ferris_wheel: "\ud83c\udfa1",
    ferry: "\u26f4",
    field_hockey: "\ud83c\udfd1",
    file_cabinet: "\ud83d\uddc4",
    file_folder: "\ud83d\udcc1",
    film_projector: "\ud83d\udcfd",
    film_strip: "\ud83c\udf9e",
    fire: "\ud83d\udd25",
    fire_engine: "\ud83d\ude92",
    fireworks: "\ud83c\udf86",
    first_quarter_moon: "\ud83c\udf13",
    first_quarter_moon_with_face: "\ud83c\udf1b",
    fish: "\ud83d\udc1f",
    fish_cake: "\ud83c\udf65",
    fishing_pole_and_fish: "\ud83c\udfa3",
    fist_raised: "\u270a",
    fist_left: "\ud83e\udd1b",
    fist_right: "\ud83e\udd1c",
    flags: "\ud83c\udf8f",
    flashlight: "\ud83d\udd26",
    fleur_de_lis: "\u269c\ufe0f",
    flight_arrival: "\ud83d\udeec",
    flight_departure: "\ud83d\udeeb",
    floppy_disk: "\ud83d\udcbe",
    flower_playing_cards: "\ud83c\udfb4",
    flushed: "\ud83d\ude33",
    fog: "\ud83c\udf2b",
    foggy: "\ud83c\udf01",
    football: "\ud83c\udfc8",
    footprints: "\ud83d\udc63",
    fork_and_knife: "\ud83c\udf74",
    fountain: "\u26f2\ufe0f",
    fountain_pen: "\ud83d\udd8b",
    four_leaf_clover: "\ud83c\udf40",
    fox_face: "\ud83e\udd8a",
    framed_picture: "\ud83d\uddbc",
    free: "\ud83c\udd93",
    fried_egg: "\ud83c\udf73",
    fried_shrimp: "\ud83c\udf64",
    fries: "\ud83c\udf5f",
    frog: "\ud83d\udc38",
    frowning: "\ud83d\ude26",
    frowning_face: "\u2639\ufe0f",
    frowning_man: "\ud83d\ude4d&zwj;\u2642\ufe0f",
    frowning_woman: "\ud83d\ude4d",
    middle_finger: "\ud83d\udd95",
    fuelpump: "\u26fd\ufe0f",
    full_moon: "\ud83c\udf15",
    full_moon_with_face: "\ud83c\udf1d",
    funeral_urn: "\u26b1\ufe0f",
    game_die: "\ud83c\udfb2",
    gear: "\u2699\ufe0f",
    gem: "\ud83d\udc8e",
    gemini: "\u264a\ufe0f",
    ghost: "\ud83d\udc7b",
    gift: "\ud83c\udf81",
    gift_heart: "\ud83d\udc9d",
    girl: "\ud83d\udc67",
    globe_with_meridians: "\ud83c\udf10",
    goal_net: "\ud83e\udd45",
    goat: "\ud83d\udc10",
    golf: "\u26f3\ufe0f",
    golfing_man: "\ud83c\udfcc\ufe0f",
    golfing_woman: "\ud83c\udfcc\ufe0f&zwj;\u2640\ufe0f",
    gorilla: "\ud83e\udd8d",
    grapes: "\ud83c\udf47",
    green_apple: "\ud83c\udf4f",
    green_book: "\ud83d\udcd7",
    green_heart: "\ud83d\udc9a",
    green_salad: "\ud83e\udd57",
    grey_exclamation: "\u2755",
    grey_question: "\u2754",
    grimacing: "\ud83d\ude2c",
    grin: "\ud83d\ude01",
    grinning: "\ud83d\ude00",
    guardsman: "\ud83d\udc82",
    guardswoman: "\ud83d\udc82&zwj;\u2640\ufe0f",
    guitar: "\ud83c\udfb8",
    gun: "\ud83d\udd2b",
    haircut_woman: "\ud83d\udc87",
    haircut_man: "\ud83d\udc87&zwj;\u2642\ufe0f",
    hamburger: "\ud83c\udf54",
    hammer: "\ud83d\udd28",
    hammer_and_pick: "\u2692",
    hammer_and_wrench: "\ud83d\udee0",
    hamster: "\ud83d\udc39",
    hand: "\u270b",
    handbag: "\ud83d\udc5c",
    handshake: "\ud83e\udd1d",
    hankey: "\ud83d\udca9",
    hatched_chick: "\ud83d\udc25",
    hatching_chick: "\ud83d\udc23",
    headphones: "\ud83c\udfa7",
    hear_no_evil: "\ud83d\ude49",
    heart: "\u2764\ufe0f",
    heart_decoration: "\ud83d\udc9f",
    heart_eyes: "\ud83d\ude0d",
    heart_eyes_cat: "\ud83d\ude3b",
    heartbeat: "\ud83d\udc93",
    heartpulse: "\ud83d\udc97",
    hearts: "\u2665\ufe0f",
    heavy_check_mark: "\u2714\ufe0f",
    heavy_division_sign: "\u2797",
    heavy_dollar_sign: "\ud83d\udcb2",
    heavy_heart_exclamation: "\u2763\ufe0f",
    heavy_minus_sign: "\u2796",
    heavy_multiplication_x: "\u2716\ufe0f",
    heavy_plus_sign: "\u2795",
    helicopter: "\ud83d\ude81",
    herb: "\ud83c\udf3f",
    hibiscus: "\ud83c\udf3a",
    high_brightness: "\ud83d\udd06",
    high_heel: "\ud83d\udc60",
    hocho: "\ud83d\udd2a",
    hole: "\ud83d\udd73",
    honey_pot: "\ud83c\udf6f",
    horse: "\ud83d\udc34",
    horse_racing: "\ud83c\udfc7",
    hospital: "\ud83c\udfe5",
    hot_pepper: "\ud83c\udf36",
    hotdog: "\ud83c\udf2d",
    hotel: "\ud83c\udfe8",
    hotsprings: "\u2668\ufe0f",
    hourglass: "\u231b\ufe0f",
    hourglass_flowing_sand: "\u23f3",
    house: "\ud83c\udfe0",
    house_with_garden: "\ud83c\udfe1",
    houses: "\ud83c\udfd8",
    hugs: "\ud83e\udd17",
    hushed: "\ud83d\ude2f",
    ice_cream: "\ud83c\udf68",
    ice_hockey: "\ud83c\udfd2",
    ice_skate: "\u26f8",
    icecream: "\ud83c\udf66",
    id: "\ud83c\udd94",
    ideograph_advantage: "\ud83c\ude50",
    imp: "\ud83d\udc7f",
    inbox_tray: "\ud83d\udce5",
    incoming_envelope: "\ud83d\udce8",
    tipping_hand_woman: "\ud83d\udc81",
    information_source: "\u2139\ufe0f",
    innocent: "\ud83d\ude07",
    interrobang: "\u2049\ufe0f",
    iphone: "\ud83d\udcf1",
    izakaya_lantern: "\ud83c\udfee",
    jack_o_lantern: "\ud83c\udf83",
    japan: "\ud83d\uddfe",
    japanese_castle: "\ud83c\udfef",
    japanese_goblin: "\ud83d\udc7a",
    japanese_ogre: "\ud83d\udc79",
    jeans: "\ud83d\udc56",
    joy: "\ud83d\ude02",
    joy_cat: "\ud83d\ude39",
    joystick: "\ud83d\udd79",
    kaaba: "\ud83d\udd4b",
    key: "\ud83d\udd11",
    keyboard: "\u2328\ufe0f",
    keycap_ten: "\ud83d\udd1f",
    kick_scooter: "\ud83d\udef4",
    kimono: "\ud83d\udc58",
    kiss: "\ud83d\udc8b",
    kissing: "\ud83d\ude17",
    kissing_cat: "\ud83d\ude3d",
    kissing_closed_eyes: "\ud83d\ude1a",
    kissing_heart: "\ud83d\ude18",
    kissing_smiling_eyes: "\ud83d\ude19",
    kiwi_fruit: "\ud83e\udd5d",
    koala: "\ud83d\udc28",
    koko: "\ud83c\ude01",
    label: "\ud83c\udff7",
    large_blue_circle: "\ud83d\udd35",
    large_blue_diamond: "\ud83d\udd37",
    large_orange_diamond: "\ud83d\udd36",
    last_quarter_moon: "\ud83c\udf17",
    last_quarter_moon_with_face: "\ud83c\udf1c",
    latin_cross: "\u271d\ufe0f",
    laughing: "\ud83d\ude06",
    leaves: "\ud83c\udf43",
    ledger: "\ud83d\udcd2",
    left_luggage: "\ud83d\udec5",
    left_right_arrow: "\u2194\ufe0f",
    leftwards_arrow_with_hook: "\u21a9\ufe0f",
    lemon: "\ud83c\udf4b",
    leo: "\u264c\ufe0f",
    leopard: "\ud83d\udc06",
    level_slider: "\ud83c\udf9a",
    libra: "\u264e\ufe0f",
    light_rail: "\ud83d\ude88",
    link: "\ud83d\udd17",
    lion: "\ud83e\udd81",
    lips: "\ud83d\udc44",
    lipstick: "\ud83d\udc84",
    lizard: "\ud83e\udd8e",
    lock: "\ud83d\udd12",
    lock_with_ink_pen: "\ud83d\udd0f",
    lollipop: "\ud83c\udf6d",
    loop: "\u27bf",
    loud_sound: "\ud83d\udd0a",
    loudspeaker: "\ud83d\udce2",
    love_hotel: "\ud83c\udfe9",
    love_letter: "\ud83d\udc8c",
    low_brightness: "\ud83d\udd05",
    lying_face: "\ud83e\udd25",
    m: "\u24c2\ufe0f",
    mag: "\ud83d\udd0d",
    mag_right: "\ud83d\udd0e",
    mahjong: "\ud83c\udc04\ufe0f",
    mailbox: "\ud83d\udceb",
    mailbox_closed: "\ud83d\udcea",
    mailbox_with_mail: "\ud83d\udcec",
    mailbox_with_no_mail: "\ud83d\udced",
    man: "\ud83d\udc68",
    man_artist: "\ud83d\udc68&zwj;\ud83c\udfa8",
    man_astronaut: "\ud83d\udc68&zwj;\ud83d\ude80",
    man_cartwheeling: "\ud83e\udd38&zwj;\u2642\ufe0f",
    man_cook: "\ud83d\udc68&zwj;\ud83c\udf73",
    man_dancing: "\ud83d\udd7a",
    man_facepalming: "\ud83e\udd26&zwj;\u2642\ufe0f",
    man_factory_worker: "\ud83d\udc68&zwj;\ud83c\udfed",
    man_farmer: "\ud83d\udc68&zwj;\ud83c\udf3e",
    man_firefighter: "\ud83d\udc68&zwj;\ud83d\ude92",
    man_health_worker: "\ud83d\udc68&zwj;\u2695\ufe0f",
    man_in_tuxedo: "\ud83e\udd35",
    man_judge: "\ud83d\udc68&zwj;\u2696\ufe0f",
    man_juggling: "\ud83e\udd39&zwj;\u2642\ufe0f",
    man_mechanic: "\ud83d\udc68&zwj;\ud83d\udd27",
    man_office_worker: "\ud83d\udc68&zwj;\ud83d\udcbc",
    man_pilot: "\ud83d\udc68&zwj;\u2708\ufe0f",
    man_playing_handball: "\ud83e\udd3e&zwj;\u2642\ufe0f",
    man_playing_water_polo: "\ud83e\udd3d&zwj;\u2642\ufe0f",
    man_scientist: "\ud83d\udc68&zwj;\ud83d\udd2c",
    man_shrugging: "\ud83e\udd37&zwj;\u2642\ufe0f",
    man_singer: "\ud83d\udc68&zwj;\ud83c\udfa4",
    man_student: "\ud83d\udc68&zwj;\ud83c\udf93",
    man_teacher: "\ud83d\udc68&zwj;\ud83c\udfeb",
    man_technologist: "\ud83d\udc68&zwj;\ud83d\udcbb",
    man_with_gua_pi_mao: "\ud83d\udc72",
    man_with_turban: "\ud83d\udc73",
    tangerine: "\ud83c\udf4a",
    mans_shoe: "\ud83d\udc5e",
    mantelpiece_clock: "\ud83d\udd70",
    maple_leaf: "\ud83c\udf41",
    martial_arts_uniform: "\ud83e\udd4b",
    mask: "\ud83d\ude37",
    massage_woman: "\ud83d\udc86",
    massage_man: "\ud83d\udc86&zwj;\u2642\ufe0f",
    meat_on_bone: "\ud83c\udf56",
    medal_military: "\ud83c\udf96",
    medal_sports: "\ud83c\udfc5",
    mega: "\ud83d\udce3",
    melon: "\ud83c\udf48",
    memo: "\ud83d\udcdd",
    men_wrestling: "\ud83e\udd3c&zwj;\u2642\ufe0f",
    menorah: "\ud83d\udd4e",
    mens: "\ud83d\udeb9",
    metal: "\ud83e\udd18",
    metro: "\ud83d\ude87",
    microphone: "\ud83c\udfa4",
    microscope: "\ud83d\udd2c",
    milk_glass: "\ud83e\udd5b",
    milky_way: "\ud83c\udf0c",
    minibus: "\ud83d\ude90",
    minidisc: "\ud83d\udcbd",
    mobile_phone_off: "\ud83d\udcf4",
    money_mouth_face: "\ud83e\udd11",
    money_with_wings: "\ud83d\udcb8",
    moneybag: "\ud83d\udcb0",
    monkey: "\ud83d\udc12",
    monkey_face: "\ud83d\udc35",
    monorail: "\ud83d\ude9d",
    moon: "\ud83c\udf14",
    mortar_board: "\ud83c\udf93",
    mosque: "\ud83d\udd4c",
    motor_boat: "\ud83d\udee5",
    motor_scooter: "\ud83d\udef5",
    motorcycle: "\ud83c\udfcd",
    motorway: "\ud83d\udee3",
    mount_fuji: "\ud83d\uddfb",
    mountain: "\u26f0",
    mountain_biking_man: "\ud83d\udeb5",
    mountain_biking_woman: "\ud83d\udeb5&zwj;\u2640\ufe0f",
    mountain_cableway: "\ud83d\udea0",
    mountain_railway: "\ud83d\ude9e",
    mountain_snow: "\ud83c\udfd4",
    mouse: "\ud83d\udc2d",
    mouse2: "\ud83d\udc01",
    movie_camera: "\ud83c\udfa5",
    moyai: "\ud83d\uddff",
    mrs_claus: "\ud83e\udd36",
    muscle: "\ud83d\udcaa",
    mushroom: "\ud83c\udf44",
    musical_keyboard: "\ud83c\udfb9",
    musical_note: "\ud83c\udfb5",
    musical_score: "\ud83c\udfbc",
    mute: "\ud83d\udd07",
    nail_care: "\ud83d\udc85",
    name_badge: "\ud83d\udcdb",
    national_park: "\ud83c\udfde",
    nauseated_face: "\ud83e\udd22",
    necktie: "\ud83d\udc54",
    negative_squared_cross_mark: "\u274e",
    nerd_face: "\ud83e\udd13",
    neutral_face: "\ud83d\ude10",
    new: "\ud83c\udd95",
    new_moon: "\ud83c\udf11",
    new_moon_with_face: "\ud83c\udf1a",
    newspaper: "\ud83d\udcf0",
    newspaper_roll: "\ud83d\uddde",
    next_track_button: "\u23ed",
    ng: "\ud83c\udd96",
    no_good_man: "\ud83d\ude45&zwj;\u2642\ufe0f",
    no_good_woman: "\ud83d\ude45",
    night_with_stars: "\ud83c\udf03",
    no_bell: "\ud83d\udd15",
    no_bicycles: "\ud83d\udeb3",
    no_entry: "\u26d4\ufe0f",
    no_entry_sign: "\ud83d\udeab",
    no_mobile_phones: "\ud83d\udcf5",
    no_mouth: "\ud83d\ude36",
    no_pedestrians: "\ud83d\udeb7",
    no_smoking: "\ud83d\udead",
    "non-potable_water": "\ud83d\udeb1",
    nose: "\ud83d\udc43",
    notebook: "\ud83d\udcd3",
    notebook_with_decorative_cover: "\ud83d\udcd4",
    notes: "\ud83c\udfb6",
    nut_and_bolt: "\ud83d\udd29",
    o: "\u2b55\ufe0f",
    o2: "\ud83c\udd7e\ufe0f",
    ocean: "\ud83c\udf0a",
    octopus: "\ud83d\udc19",
    oden: "\ud83c\udf62",
    office: "\ud83c\udfe2",
    oil_drum: "\ud83d\udee2",
    ok: "\ud83c\udd97",
    ok_hand: "\ud83d\udc4c",
    ok_man: "\ud83d\ude46&zwj;\u2642\ufe0f",
    ok_woman: "\ud83d\ude46",
    old_key: "\ud83d\udddd",
    older_man: "\ud83d\udc74",
    older_woman: "\ud83d\udc75",
    om: "\ud83d\udd49",
    on: "\ud83d\udd1b",
    oncoming_automobile: "\ud83d\ude98",
    oncoming_bus: "\ud83d\ude8d",
    oncoming_police_car: "\ud83d\ude94",
    oncoming_taxi: "\ud83d\ude96",
    open_file_folder: "\ud83d\udcc2",
    open_hands: "\ud83d\udc50",
    open_mouth: "\ud83d\ude2e",
    open_umbrella: "\u2602\ufe0f",
    ophiuchus: "\u26ce",
    orange_book: "\ud83d\udcd9",
    orthodox_cross: "\u2626\ufe0f",
    outbox_tray: "\ud83d\udce4",
    owl: "\ud83e\udd89",
    ox: "\ud83d\udc02",
    package: "\ud83d\udce6",
    page_facing_up: "\ud83d\udcc4",
    page_with_curl: "\ud83d\udcc3",
    pager: "\ud83d\udcdf",
    paintbrush: "\ud83d\udd8c",
    palm_tree: "\ud83c\udf34",
    pancakes: "\ud83e\udd5e",
    panda_face: "\ud83d\udc3c",
    paperclip: "\ud83d\udcce",
    paperclips: "\ud83d\udd87",
    parasol_on_ground: "\u26f1",
    parking: "\ud83c\udd7f\ufe0f",
    part_alternation_mark: "\u303d\ufe0f",
    partly_sunny: "\u26c5\ufe0f",
    passenger_ship: "\ud83d\udef3",
    passport_control: "\ud83d\udec2",
    pause_button: "\u23f8",
    peace_symbol: "\u262e\ufe0f",
    peach: "\ud83c\udf51",
    peanuts: "\ud83e\udd5c",
    pear: "\ud83c\udf50",
    pen: "\ud83d\udd8a",
    pencil2: "\u270f\ufe0f",
    penguin: "\ud83d\udc27",
    pensive: "\ud83d\ude14",
    performing_arts: "\ud83c\udfad",
    persevere: "\ud83d\ude23",
    person_fencing: "\ud83e\udd3a",
    pouting_woman: "\ud83d\ude4e",
    phone: "\u260e\ufe0f",
    pick: "\u26cf",
    pig: "\ud83d\udc37",
    pig2: "\ud83d\udc16",
    pig_nose: "\ud83d\udc3d",
    pill: "\ud83d\udc8a",
    pineapple: "\ud83c\udf4d",
    ping_pong: "\ud83c\udfd3",
    pisces: "\u2653\ufe0f",
    pizza: "\ud83c\udf55",
    place_of_worship: "\ud83d\uded0",
    plate_with_cutlery: "\ud83c\udf7d",
    play_or_pause_button: "\u23ef",
    point_down: "\ud83d\udc47",
    point_left: "\ud83d\udc48",
    point_right: "\ud83d\udc49",
    point_up: "\u261d\ufe0f",
    point_up_2: "\ud83d\udc46",
    police_car: "\ud83d\ude93",
    policewoman: "\ud83d\udc6e&zwj;\u2640\ufe0f",
    poodle: "\ud83d\udc29",
    popcorn: "\ud83c\udf7f",
    post_office: "\ud83c\udfe3",
    postal_horn: "\ud83d\udcef",
    postbox: "\ud83d\udcee",
    potable_water: "\ud83d\udeb0",
    potato: "\ud83e\udd54",
    pouch: "\ud83d\udc5d",
    poultry_leg: "\ud83c\udf57",
    pound: "\ud83d\udcb7",
    rage: "\ud83d\ude21",
    pouting_cat: "\ud83d\ude3e",
    pouting_man: "\ud83d\ude4e&zwj;\u2642\ufe0f",
    pray: "\ud83d\ude4f",
    prayer_beads: "\ud83d\udcff",
    pregnant_woman: "\ud83e\udd30",
    previous_track_button: "\u23ee",
    prince: "\ud83e\udd34",
    princess: "\ud83d\udc78",
    printer: "\ud83d\udda8",
    purple_heart: "\ud83d\udc9c",
    purse: "\ud83d\udc5b",
    pushpin: "\ud83d\udccc",
    put_litter_in_its_place: "\ud83d\udeae",
    question: "\u2753",
    rabbit: "\ud83d\udc30",
    rabbit2: "\ud83d\udc07",
    racehorse: "\ud83d\udc0e",
    racing_car: "\ud83c\udfce",
    radio: "\ud83d\udcfb",
    radio_button: "\ud83d\udd18",
    radioactive: "\u2622\ufe0f",
    railway_car: "\ud83d\ude83",
    railway_track: "\ud83d\udee4",
    rainbow: "\ud83c\udf08",
    rainbow_flag: "\ud83c\udff3\ufe0f&zwj;\ud83c\udf08",
    raised_back_of_hand: "\ud83e\udd1a",
    raised_hand_with_fingers_splayed: "\ud83d\udd90",
    raised_hands: "\ud83d\ude4c",
    raising_hand_woman: "\ud83d\ude4b",
    raising_hand_man: "\ud83d\ude4b&zwj;\u2642\ufe0f",
    ram: "\ud83d\udc0f",
    ramen: "\ud83c\udf5c",
    rat: "\ud83d\udc00",
    record_button: "\u23fa",
    recycle: "\u267b\ufe0f",
    red_circle: "\ud83d\udd34",
    registered: "\u00ae\ufe0f",
    relaxed: "\u263a\ufe0f",
    relieved: "\ud83d\ude0c",
    reminder_ribbon: "\ud83c\udf97",
    repeat: "\ud83d\udd01",
    repeat_one: "\ud83d\udd02",
    rescue_worker_helmet: "\u26d1",
    restroom: "\ud83d\udebb",
    revolving_hearts: "\ud83d\udc9e",
    rewind: "\u23ea",
    rhinoceros: "\ud83e\udd8f",
    ribbon: "\ud83c\udf80",
    rice: "\ud83c\udf5a",
    rice_ball: "\ud83c\udf59",
    rice_cracker: "\ud83c\udf58",
    rice_scene: "\ud83c\udf91",
    right_anger_bubble: "\ud83d\uddef",
    ring: "\ud83d\udc8d",
    robot: "\ud83e\udd16",
    rocket: "\ud83d\ude80",
    rofl: "\ud83e\udd23",
    roll_eyes: "\ud83d\ude44",
    roller_coaster: "\ud83c\udfa2",
    rooster: "\ud83d\udc13",
    rose: "\ud83c\udf39",
    rosette: "\ud83c\udff5",
    rotating_light: "\ud83d\udea8",
    round_pushpin: "\ud83d\udccd",
    rowing_man: "\ud83d\udea3",
    rowing_woman: "\ud83d\udea3&zwj;\u2640\ufe0f",
    rugby_football: "\ud83c\udfc9",
    running_man: "\ud83c\udfc3",
    running_shirt_with_sash: "\ud83c\udfbd",
    running_woman: "\ud83c\udfc3&zwj;\u2640\ufe0f",
    sa: "\ud83c\ude02\ufe0f",
    sagittarius: "\u2650\ufe0f",
    sake: "\ud83c\udf76",
    sandal: "\ud83d\udc61",
    santa: "\ud83c\udf85",
    satellite: "\ud83d\udce1",
    saxophone: "\ud83c\udfb7",
    school: "\ud83c\udfeb",
    school_satchel: "\ud83c\udf92",
    scissors: "\u2702\ufe0f",
    scorpion: "\ud83e\udd82",
    scorpius: "\u264f\ufe0f",
    scream: "\ud83d\ude31",
    scream_cat: "\ud83d\ude40",
    scroll: "\ud83d\udcdc",
    seat: "\ud83d\udcba",
    secret: "\u3299\ufe0f",
    see_no_evil: "\ud83d\ude48",
    seedling: "\ud83c\udf31",
    selfie: "\ud83e\udd33",
    shallow_pan_of_food: "\ud83e\udd58",
    shamrock: "\u2618\ufe0f",
    shark: "\ud83e\udd88",
    shaved_ice: "\ud83c\udf67",
    sheep: "\ud83d\udc11",
    shell: "\ud83d\udc1a",
    shield: "\ud83d\udee1",
    shinto_shrine: "\u26e9",
    ship: "\ud83d\udea2",
    shirt: "\ud83d\udc55",
    shopping: "\ud83d\udecd",
    shopping_cart: "\ud83d\uded2",
    shower: "\ud83d\udebf",
    shrimp: "\ud83e\udd90",
    signal_strength: "\ud83d\udcf6",
    six_pointed_star: "\ud83d\udd2f",
    ski: "\ud83c\udfbf",
    skier: "\u26f7",
    skull: "\ud83d\udc80",
    skull_and_crossbones: "\u2620\ufe0f",
    sleeping: "\ud83d\ude34",
    sleeping_bed: "\ud83d\udecc",
    sleepy: "\ud83d\ude2a",
    slightly_frowning_face: "\ud83d\ude41",
    slightly_smiling_face: "\ud83d\ude42",
    slot_machine: "\ud83c\udfb0",
    small_airplane: "\ud83d\udee9",
    small_blue_diamond: "\ud83d\udd39",
    small_orange_diamond: "\ud83d\udd38",
    small_red_triangle: "\ud83d\udd3a",
    small_red_triangle_down: "\ud83d\udd3b",
    smile: "\ud83d\ude04",
    smile_cat: "\ud83d\ude38",
    smiley: "\ud83d\ude03",
    smiley_cat: "\ud83d\ude3a",
    smiling_imp: "\ud83d\ude08",
    smirk: "\ud83d\ude0f",
    smirk_cat: "\ud83d\ude3c",
    smoking: "\ud83d\udeac",
    snail: "\ud83d\udc0c",
    snake: "\ud83d\udc0d",
    sneezing_face: "\ud83e\udd27",
    snowboarder: "\ud83c\udfc2",
    snowflake: "\u2744\ufe0f",
    snowman: "\u26c4\ufe0f",
    snowman_with_snow: "\u2603\ufe0f",
    sob: "\ud83d\ude2d",
    soccer: "\u26bd\ufe0f",
    soon: "\ud83d\udd1c",
    sos: "\ud83c\udd98",
    sound: "\ud83d\udd09",
    space_invader: "\ud83d\udc7e",
    spades: "\u2660\ufe0f",
    spaghetti: "\ud83c\udf5d",
    sparkle: "\u2747\ufe0f",
    sparkler: "\ud83c\udf87",
    sparkles: "\u2728",
    sparkling_heart: "\ud83d\udc96",
    speak_no_evil: "\ud83d\ude4a",
    speaker: "\ud83d\udd08",
    speaking_head: "\ud83d\udde3",
    speech_balloon: "\ud83d\udcac",
    speedboat: "\ud83d\udea4",
    spider: "\ud83d\udd77",
    spider_web: "\ud83d\udd78",
    spiral_calendar: "\ud83d\uddd3",
    spiral_notepad: "\ud83d\uddd2",
    spoon: "\ud83e\udd44",
    squid: "\ud83e\udd91",
    stadium: "\ud83c\udfdf",
    star: "\u2b50\ufe0f",
    star2: "\ud83c\udf1f",
    star_and_crescent: "\u262a\ufe0f",
    star_of_david: "\u2721\ufe0f",
    stars: "\ud83c\udf20",
    station: "\ud83d\ude89",
    statue_of_liberty: "\ud83d\uddfd",
    steam_locomotive: "\ud83d\ude82",
    stew: "\ud83c\udf72",
    stop_button: "\u23f9",
    stop_sign: "\ud83d\uded1",
    stopwatch: "\u23f1",
    straight_ruler: "\ud83d\udccf",
    strawberry: "\ud83c\udf53",
    stuck_out_tongue: "\ud83d\ude1b",
    stuck_out_tongue_closed_eyes: "\ud83d\ude1d",
    stuck_out_tongue_winking_eye: "\ud83d\ude1c",
    studio_microphone: "\ud83c\udf99",
    stuffed_flatbread: "\ud83e\udd59",
    sun_behind_large_cloud: "\ud83c\udf25",
    sun_behind_rain_cloud: "\ud83c\udf26",
    sun_behind_small_cloud: "\ud83c\udf24",
    sun_with_face: "\ud83c\udf1e",
    sunflower: "\ud83c\udf3b",
    sunglasses: "\ud83d\ude0e",
    sunny: "\u2600\ufe0f",
    sunrise: "\ud83c\udf05",
    sunrise_over_mountains: "\ud83c\udf04",
    surfing_man: "\ud83c\udfc4",
    surfing_woman: "\ud83c\udfc4&zwj;\u2640\ufe0f",
    sushi: "\ud83c\udf63",
    suspension_railway: "\ud83d\ude9f",
    sweat: "\ud83d\ude13",
    sweat_drops: "\ud83d\udca6",
    sweat_smile: "\ud83d\ude05",
    sweet_potato: "\ud83c\udf60",
    swimming_man: "\ud83c\udfca",
    swimming_woman: "\ud83c\udfca&zwj;\u2640\ufe0f",
    symbols: "\ud83d\udd23",
    synagogue: "\ud83d\udd4d",
    syringe: "\ud83d\udc89",
    taco: "\ud83c\udf2e",
    tada: "\ud83c\udf89",
    tanabata_tree: "\ud83c\udf8b",
    taurus: "\u2649\ufe0f",
    taxi: "\ud83d\ude95",
    tea: "\ud83c\udf75",
    telephone_receiver: "\ud83d\udcde",
    telescope: "\ud83d\udd2d",
    tennis: "\ud83c\udfbe",
    tent: "\u26fa\ufe0f",
    thermometer: "\ud83c\udf21",
    thinking: "\ud83e\udd14",
    thought_balloon: "\ud83d\udcad",
    ticket: "\ud83c\udfab",
    tickets: "\ud83c\udf9f",
    tiger: "\ud83d\udc2f",
    tiger2: "\ud83d\udc05",
    timer_clock: "\u23f2",
    tipping_hand_man: "\ud83d\udc81&zwj;\u2642\ufe0f",
    tired_face: "\ud83d\ude2b",
    tm: "\u2122\ufe0f",
    toilet: "\ud83d\udebd",
    tokyo_tower: "\ud83d\uddfc",
    tomato: "\ud83c\udf45",
    tongue: "\ud83d\udc45",
    top: "\ud83d\udd1d",
    tophat: "\ud83c\udfa9",
    tornado: "\ud83c\udf2a",
    trackball: "\ud83d\uddb2",
    tractor: "\ud83d\ude9c",
    traffic_light: "\ud83d\udea5",
    train: "\ud83d\ude8b",
    train2: "\ud83d\ude86",
    tram: "\ud83d\ude8a",
    triangular_flag_on_post: "\ud83d\udea9",
    triangular_ruler: "\ud83d\udcd0",
    trident: "\ud83d\udd31",
    triumph: "\ud83d\ude24",
    trolleybus: "\ud83d\ude8e",
    trophy: "\ud83c\udfc6",
    tropical_drink: "\ud83c\udf79",
    tropical_fish: "\ud83d\udc20",
    truck: "\ud83d\ude9a",
    trumpet: "\ud83c\udfba",
    tulip: "\ud83c\udf37",
    tumbler_glass: "\ud83e\udd43",
    turkey: "\ud83e\udd83",
    turtle: "\ud83d\udc22",
    tv: "\ud83d\udcfa",
    twisted_rightwards_arrows: "\ud83d\udd00",
    two_hearts: "\ud83d\udc95",
    two_men_holding_hands: "\ud83d\udc6c",
    two_women_holding_hands: "\ud83d\udc6d",
    u5272: "\ud83c\ude39",
    u5408: "\ud83c\ude34",
    u55b6: "\ud83c\ude3a",
    u6307: "\ud83c\ude2f\ufe0f",
    u6708: "\ud83c\ude37\ufe0f",
    u6709: "\ud83c\ude36",
    u6e80: "\ud83c\ude35",
    u7121: "\ud83c\ude1a\ufe0f",
    u7533: "\ud83c\ude38",
    u7981: "\ud83c\ude32",
    u7a7a: "\ud83c\ude33",
    umbrella: "\u2614\ufe0f",
    unamused: "\ud83d\ude12",
    underage: "\ud83d\udd1e",
    unicorn: "\ud83e\udd84",
    unlock: "\ud83d\udd13",
    up: "\ud83c\udd99",
    upside_down_face: "\ud83d\ude43",
    v: "\u270c\ufe0f",
    vertical_traffic_light: "\ud83d\udea6",
    vhs: "\ud83d\udcfc",
    vibration_mode: "\ud83d\udcf3",
    video_camera: "\ud83d\udcf9",
    video_game: "\ud83c\udfae",
    violin: "\ud83c\udfbb",
    virgo: "\u264d\ufe0f",
    volcano: "\ud83c\udf0b",
    volleyball: "\ud83c\udfd0",
    vs: "\ud83c\udd9a",
    vulcan_salute: "\ud83d\udd96",
    walking_man: "\ud83d\udeb6",
    walking_woman: "\ud83d\udeb6&zwj;\u2640\ufe0f",
    waning_crescent_moon: "\ud83c\udf18",
    waning_gibbous_moon: "\ud83c\udf16",
    warning: "\u26a0\ufe0f",
    wastebasket: "\ud83d\uddd1",
    watch: "\u231a\ufe0f",
    water_buffalo: "\ud83d\udc03",
    watermelon: "\ud83c\udf49",
    wave: "\ud83d\udc4b",
    wavy_dash: "\u3030\ufe0f",
    waxing_crescent_moon: "\ud83c\udf12",
    wc: "\ud83d\udebe",
    weary: "\ud83d\ude29",
    wedding: "\ud83d\udc92",
    weight_lifting_man: "\ud83c\udfcb\ufe0f",
    weight_lifting_woman: "\ud83c\udfcb\ufe0f&zwj;\u2640\ufe0f",
    whale: "\ud83d\udc33",
    whale2: "\ud83d\udc0b",
    wheel_of_dharma: "\u2638\ufe0f",
    wheelchair: "\u267f\ufe0f",
    white_check_mark: "\u2705",
    white_circle: "\u26aa\ufe0f",
    white_flag: "\ud83c\udff3\ufe0f",
    white_flower: "\ud83d\udcae",
    white_large_square: "\u2b1c\ufe0f",
    white_medium_small_square: "\u25fd\ufe0f",
    white_medium_square: "\u25fb\ufe0f",
    white_small_square: "\u25ab\ufe0f",
    white_square_button: "\ud83d\udd33",
    wilted_flower: "\ud83e\udd40",
    wind_chime: "\ud83c\udf90",
    wind_face: "\ud83c\udf2c",
    wine_glass: "\ud83c\udf77",
    wink: "\ud83d\ude09",
    wolf: "\ud83d\udc3a",
    woman: "\ud83d\udc69",
    woman_artist: "\ud83d\udc69&zwj;\ud83c\udfa8",
    woman_astronaut: "\ud83d\udc69&zwj;\ud83d\ude80",
    woman_cartwheeling: "\ud83e\udd38&zwj;\u2640\ufe0f",
    woman_cook: "\ud83d\udc69&zwj;\ud83c\udf73",
    woman_facepalming: "\ud83e\udd26&zwj;\u2640\ufe0f",
    woman_factory_worker: "\ud83d\udc69&zwj;\ud83c\udfed",
    woman_farmer: "\ud83d\udc69&zwj;\ud83c\udf3e",
    woman_firefighter: "\ud83d\udc69&zwj;\ud83d\ude92",
    woman_health_worker: "\ud83d\udc69&zwj;\u2695\ufe0f",
    woman_judge: "\ud83d\udc69&zwj;\u2696\ufe0f",
    woman_juggling: "\ud83e\udd39&zwj;\u2640\ufe0f",
    woman_mechanic: "\ud83d\udc69&zwj;\ud83d\udd27",
    woman_office_worker: "\ud83d\udc69&zwj;\ud83d\udcbc",
    woman_pilot: "\ud83d\udc69&zwj;\u2708\ufe0f",
    woman_playing_handball: "\ud83e\udd3e&zwj;\u2640\ufe0f",
    woman_playing_water_polo: "\ud83e\udd3d&zwj;\u2640\ufe0f",
    woman_scientist: "\ud83d\udc69&zwj;\ud83d\udd2c",
    woman_shrugging: "\ud83e\udd37&zwj;\u2640\ufe0f",
    woman_singer: "\ud83d\udc69&zwj;\ud83c\udfa4",
    woman_student: "\ud83d\udc69&zwj;\ud83c\udf93",
    woman_teacher: "\ud83d\udc69&zwj;\ud83c\udfeb",
    woman_technologist: "\ud83d\udc69&zwj;\ud83d\udcbb",
    woman_with_turban: "\ud83d\udc73&zwj;\u2640\ufe0f",
    womans_clothes: "\ud83d\udc5a",
    womans_hat: "\ud83d\udc52",
    women_wrestling: "\ud83e\udd3c&zwj;\u2640\ufe0f",
    womens: "\ud83d\udeba",
    world_map: "\ud83d\uddfa",
    worried: "\ud83d\ude1f",
    wrench: "\ud83d\udd27",
    writing_hand: "\u270d\ufe0f",
    x: "\u274c",
    yellow_heart: "\ud83d\udc9b",
    yen: "\ud83d\udcb4",
    yin_yang: "\u262f\ufe0f",
    yum: "\ud83d\ude0b",
    zap: "\u26a1\ufe0f",
    zipper_mouth_face: "\ud83e\udd10",
    zzz: "\ud83d\udca4",
    octocat: '<img alt=":octocat:" height="20" width="20" align="absmiddle" src="https://assets-cdn.github.com/images/icons/emoji/octocat.png">',
    showdown: "<span style=\"font-family: 'Anonymous Pro', monospace; text-decoration: underline; text-decoration-style: dashed; text-decoration-color: #3e8b8a;text-underline-position: under;\">S</span>",
  };
  showdown.Converter = function (converterOptions) {
    var options = {},
      langExtensions = [],
      outputModifiers = [],
      listeners = {},
      setConvFlavor = setFlavor,
      metadata = {
        parsed: {},
        raw: "",
        format: "",
      };
    _constructor();

    function _constructor() {
      converterOptions = converterOptions || {};
      for (var gOpt in globalOptions) {
        if (globalOptions.hasOwnProperty(gOpt)) {
          options[gOpt] = globalOptions[gOpt];
        }
      }
      if (typeof converterOptions === "object") {
        for (var opt in converterOptions) {
          if (converterOptions.hasOwnProperty(opt)) {
            options[opt] = converterOptions[opt];
          }
        }
      } else {
        throw Error(
          "Converter expects the passed parameter to be an object, but " +
          typeof converterOptions +
          " was passed instead."
        );
      }
      if (options.extensions) {
        showdown.helper.forEach(options.extensions, _parseExtension);
      }
    }

    function _parseExtension(ext, name) {
      name = name || null;
      if (showdown.helper.isString(ext)) {
        ext = showdown.helper.stdExtName(ext);
        name = ext;
        if (showdown.extensions[ext]) {
          console.warn(
            "DEPRECATION WARNING: " +
            ext +
            " is an old extension that uses a deprecated loading method." +
            "Please inform the developer that the extension should be updated!"
          );
          legacyExtensionLoading(showdown.extensions[ext], ext);
          return;
        } else {
          if (!showdown.helper.isUndefined(extensions[ext])) {
            ext = extensions[ext];
          } else {
            throw Error(
              'Extension "' +
              ext +
              '" could not be loaded. It was either not found or is not a valid extension.'
            );
          }
        }
      }
      if (typeof ext === "function") {
        ext = ext();
      }
      if (!showdown.helper.isArray(ext)) {
        ext = [ext];
      }
      var validExt = validate(ext, name);
      if (!validExt.valid) {
        throw Error(validExt.error);
      }
      for (var i = 0; i < ext.length; ++i) {
        switch (ext[i].type) {
          case "lang":
            langExtensions.push(ext[i]);
            break;
          case "output":
            outputModifiers.push(ext[i]);
            break;
        }
        if (ext[i].hasOwnProperty("listeners")) {
          for (var ln in ext[i].listeners) {
            if (ext[i].listeners.hasOwnProperty(ln)) {
              listen(ln, ext[i].listeners[ln]);
            }
          }
        }
      }
    }

    function legacyExtensionLoading(ext, name) {
      if (typeof ext === "function") {
        ext = ext(new showdown.Converter());
      }
      if (!showdown.helper.isArray(ext)) {
        ext = [ext];
      }
      var valid = validate(ext, name);
      if (!valid.valid) {
        throw Error(valid.error);
      }
      for (var i = 0; i < ext.length; ++i) {
        switch (ext[i].type) {
          case "lang":
            langExtensions.push(ext[i]);
            break;
          case "output":
            outputModifiers.push(ext[i]);
            break;
          default:
            throw Error("Extension loader error: Type unrecognized!!!");
        }
      }
    }

    function listen(name, callback) {
      if (!showdown.helper.isString(name)) {
        throw Error(
          "Invalid argument in converter.listen() method: name must be a string, but " +
          typeof name +
          " given"
        );
      }
      if (typeof callback !== "function") {
        throw Error(
          "Invalid argument in converter.listen() method: callback must be a function, but " +
          typeof callback +
          " given"
        );
      }
      if (!listeners.hasOwnProperty(name)) {
        listeners[name] = [];
      }
      listeners[name].push(callback);
    }

    function rTrimInputText(text) {
      var rsp = text.match(/^\s*/)[0].length,
        rgx = new RegExp("^\\s{0," + rsp + "}", "gm");
      return text.replace(rgx, "");
    }
    this._dispatch = function dispatch(evtName, text, options, globals) {
      if (listeners.hasOwnProperty(evtName)) {
        for (var ei = 0; ei < listeners[evtName].length; ++ei) {
          var nText = listeners[evtName][ei](
            evtName,
            text,
            this,
            options,
            globals
          );
          if (nText && typeof nText !== "undefined") {
            text = nText;
          }
        }
      }
      return text;
    };
    this.listen = function (name, callback) {
      listen(name, callback);
      return this;
    };
    this.makeHtml = function (text) {
      if (!text) {
        return text;
      }
      var globals = {
        gHtmlBlocks: [],
        gHtmlMdBlocks: [],
        gHtmlSpans: [],
        gUrls: {},
        gTitles: {},
        gDimensions: {},
        gListLevel: 0,
        hashLinkCounts: {},
        langExtensions: langExtensions,
        outputModifiers: outputModifiers,
        converter: this,
        ghCodeBlocks: [],
        metadata: {
          parsed: {},
          raw: "",
          format: "",
        },
      };
      text = text.replace(/¨/g, "¨T");
      text = text.replace(/\$/g, "¨D");
      text = text.replace(/\r\n/g, "\n");
      text = text.replace(/\r/g, "\n");
      text = text.replace(/\u00A0/g, "&nbsp;");
      if (options.smartIndentationFix) {
        text = rTrimInputText(text);
      }
      text = "\n\n" + text + "\n\n";
      text = showdown.subParser("detab")(text, options, globals);
      text = text.replace(/^[ \t]+$/gm, "");
      showdown.helper.forEach(langExtensions, function (ext) {
        text = showdown.subParser("runExtension")(ext, text, options, globals);
      });
      text = showdown.subParser("metadata")(text, options, globals);
      text = showdown.subParser("hashPreCodeTags")(text, options, globals);
      text = showdown.subParser("githubCodeBlocks")(text, options, globals);
      text = showdown.subParser("hashHTMLBlocks")(text, options, globals);
      text = showdown.subParser("hashCodeTags")(text, options, globals);
      text = showdown.subParser("stripLinkDefinitions")(text, options, globals);
      text = showdown.subParser("blockGamut")(text, options, globals);
      text = showdown.subParser("unhashHTMLSpans")(text, options, globals);
      text = showdown.subParser("unescapeSpecialChars")(text, options, globals);
      text = text.replace(/¨D/g, "$$");
      text = text.replace(/¨T/g, "¨");
      text = showdown.subParser("completeHTMLDocument")(text, options, globals);
      showdown.helper.forEach(outputModifiers, function (ext) {
        text = showdown.subParser("runExtension")(ext, text, options, globals);
      });
      metadata = globals.metadata;
      return text;
    };
    this.makeMarkdown = this.makeMd = function (src, HTMLParser) {
      src = src.replace(/\r\n/g, "\n");
      src = src.replace(/\r/g, "\n");
      src = src.replace(/>[ \t]+</, ">¨NBSP;<");
      if (!HTMLParser) {
        if (window && window.document) {
          HTMLParser = window.document;
        } else {
          throw new Error(
            "HTMLParser is undefined. If in a webworker or nodejs environment, you need to provide a WHATWG DOM and HTML such as JSDOM"
          );
        }
      }
      var doc = HTMLParser.createElement("div");
      doc.innerHTML = src;
      var globals = {
        preList: substitutePreCodeTags(doc),
      };
      clean(doc);
      var nodes = doc.childNodes,
        mdDoc = "";
      for (var i = 0; i < nodes.length; i++) {
        mdDoc += showdown.subParser("makeMarkdown.node")(nodes[i], globals);
      }

      function clean(node) {
        for (var n = 0; n < node.childNodes.length; ++n) {
          var child = node.childNodes[n];
          if (child.nodeType === 3) {
            if (!/\S/.test(child.nodeValue)) {
              node.removeChild(child);
              --n;
            } else {
              child.nodeValue = child.nodeValue.split("\n").join(" ");
              child.nodeValue = child.nodeValue.replace(/(\s)+/g, "$1");
            }
          } else {
            if (child.nodeType === 1) {
              clean(child);
            }
          }
        }
      }

      function substitutePreCodeTags(doc) {
        var pres = doc.querySelectorAll("pre"),
          presPH = [];
        for (var i = 0; i < pres.length; ++i) {
          if (
            pres[i].childElementCount === 1 &&
            pres[i].firstChild.tagName.toLowerCase() === "code"
          ) {
            var content = pres[i].firstChild.innerHTML.trim(),
              language = pres[i].firstChild.getAttribute("data-language") || "";
            if (language === "") {
              var classes = pres[i].firstChild.className.split(" ");
              for (var c = 0; c < classes.length; ++c) {
                var matches = classes[c].match(/^language-(.+)$/);
                if (matches !== null) {
                  language = matches[1];
                  break;
                }
              }
            }
            content = showdown.helper.unescapeHTMLEntities(content);
            presPH.push(content);
            pres[i].outerHTML =
              '<precode language="' +
              language +
              '" precodenum="' +
              i.toString() +
              '"></precode>';
          } else {
            presPH.push(pres[i].innerHTML);
            pres[i].innerHTML = "";
            pres[i].setAttribute("prenum", i.toString());
          }
        }
        return presPH;
      }
      return mdDoc;
    };
    this.setOption = function (key, value) {
      options[key] = value;
    };
    this.getOption = function (key) {
      return options[key];
    };
    this.getOptions = function () {
      return options;
    };
    this.addExtension = function (extension, name) {
      name = name || null;
      _parseExtension(extension, name);
    };
    this.useExtension = function (extensionName) {
      _parseExtension(extensionName);
    };
    this.setFlavor = function (name) {
      if (!flavor.hasOwnProperty(name)) {
        throw Error(name + " flavor was not found");
      }
      var preset = flavor[name];
      setConvFlavor = name;
      for (var option in preset) {
        if (preset.hasOwnProperty(option)) {
          options[option] = preset[option];
        }
      }
    };
    this.getFlavor = function () {
      return setConvFlavor;
    };
    this.removeExtension = function (extension) {
      if (!showdown.helper.isArray(extension)) {
        extension = [extension];
      }
      for (var a = 0; a < extension.length; ++a) {
        var ext = extension[a];
        for (var i = 0; i < langExtensions.length; ++i) {
          if (langExtensions[i] === ext) {
            langExtensions[i].splice(i, 1);
          }
        }
        for (var ii = 0; ii < outputModifiers.length; ++i) {
          if (outputModifiers[ii] === ext) {
            outputModifiers[ii].splice(i, 1);
          }
        }
      }
    };
    this.getAllExtensions = function () {
      return {
        language: langExtensions,
        output: outputModifiers,
      };
    };
    this.getMetadata = function (raw) {
      if (raw) {
        return metadata.raw;
      } else {
        return metadata.parsed;
      }
    };
    this.getMetadataFormat = function () {
      return metadata.format;
    };
    this._setMetadataPair = function (key, value) {
      metadata.parsed[key] = value;
    };
    this._setMetadataFormat = function (format) {
      metadata.format = format;
    };
    this._setMetadataRaw = function (raw) {
      metadata.raw = raw;
    };
  };
  showdown.subParser("anchors", function (text, options, globals) {
    text = globals.converter._dispatch(
      "anchors.before",
      text,
      options,
      globals
    );
    var writeAnchorTag = function (
      wholeMatch,
      linkText,
      linkId,
      url,
      m5,
      m6,
      title
    ) {
      if (showdown.helper.isUndefined(title)) {
        title = "";
      }
      linkId = linkId.toLowerCase();
      if (wholeMatch.search(/\(<?\s*>? ?(['"].*['"])?\)$/m) > -1) {
        url = "";
      } else {
        if (!url) {
          if (!linkId) {
            linkId = linkText.toLowerCase().replace(/ ?\n/g, " ");
          }
          url = "#" + linkId;
          if (!showdown.helper.isUndefined(globals.gUrls[linkId])) {
            url = globals.gUrls[linkId];
            if (!showdown.helper.isUndefined(globals.gTitles[linkId])) {
              title = globals.gTitles[linkId];
            }
          } else {
            return wholeMatch;
          }
        }
      }
      url = url.replace(
        showdown.helper.regexes.asteriskDashAndColon,
        showdown.helper.escapeCharactersCallback
      );
      var result = '<a href="' + url + '"';
      if (title !== "" && title !== null) {
        title = title.replace(/"/g, "&quot;");
        title = title.replace(
          showdown.helper.regexes.asteriskDashAndColon,
          showdown.helper.escapeCharactersCallback
        );
        result += ' title="' + title + '"';
      }
      if (options.openLinksInNewWindow && !/^#/.test(url)) {
        result += ' rel="noopener noreferrer" target="¨E95Eblank"';
      }
      result += ">" + linkText + "</a>";
      return result;
    };
    text = text.replace(
      /\[((?:\[[^\]]*]|[^\[\]])*)] ?(?:\n *)?\[(.*?)]()()()()/g,
      writeAnchorTag
    );
    text = text.replace(
      /\[((?:\[[^\]]*]|[^\[\]])*)]()[ \t]*\([ \t]?<([^>]*)>(?:[ \t]*((["'])([^"]*?)\5))?[ \t]?\)/g,
      writeAnchorTag
    );
    text = text.replace(
      /\[((?:\[[^\]]*]|[^\[\]])*)]()[ \t]*\([ \t]?<?([\S]+?(?:\([\S]*?\)[\S]*?)?)>?(?:[ \t]*((["'])([^"]*?)\5))?[ \t]?\)/g,
      writeAnchorTag
    );
    text = text.replace(/\[([^\[\]]+)]()()()()()/g, writeAnchorTag);
    if (options.ghMentions) {
      text = text.replace(
        /(^|\s)(\\)?(@([a-z\d]+(?:[a-z\d.-]+?[a-z\d]+)*))/gim,
        function (wm, st, escape, mentions, username) {
          if (escape === "\\") {
            return st + mentions;
          }
          if (!showdown.helper.isString(options.ghMentionsLink)) {
            throw new Error("ghMentionsLink option must be a string");
          }
          var lnk = options.ghMentionsLink.replace(/\{u}/g, username),
            target = "";
          if (options.openLinksInNewWindow) {
            target = ' rel="noopener noreferrer" target="¨E95Eblank"';
          }
          return (
            st + '<a href="' + lnk + '"' + target + ">" + mentions + "</a>"
          );
        }
      );
    }
    text = globals.converter._dispatch("anchors.after", text, options, globals);
    return text;
  });
  var simpleURLRegex = /([*~_]+|\b)(((https?|ftp|dict):\/\/|www\.)[^'">\s]+?\.[^'">\s]+?)()(\1)?(?=\s|$)(?!["<>])/gi,
    simpleURLRegex2 = /([*~_]+|\b)(((https?|ftp|dict):\/\/|www\.)[^'">\s]+\.[^'">\s]+?)([.!?,()\[\]])?(\1)?(?=\s|$)(?!["<>])/gi,
    delimUrlRegex = /()<(((https?|ftp|dict):\/\/|www\.)[^'">\s]+)()>()/gi,
    simpleMailRegex = /(^|\s)(?:mailto:)?([A-Za-z0-9!#$%&'*+-/=?^_`{|}~.]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)(?=$|\s)/gim,
    delimMailRegex = /<()(?:mailto:)?([-.\w]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi,
    replaceLink = function (options) {
      return function (
        wm,
        leadingMagicChars,
        link,
        m2,
        m3,
        trailingPunctuation,
        trailingMagicChars
      ) {
        link = link.replace(
          showdown.helper.regexes.asteriskDashAndColon,
          showdown.helper.escapeCharactersCallback
        );
        var lnkTxt = link,
          append = "",
          target = "",
          lmc = leadingMagicChars || "",
          tmc = trailingMagicChars || "";
        if (/^www\./i.test(link)) {
          link = link.replace(/^www\./i, "http://www.");
        }
        if (options.excludeTrailingPunctuationFromURLs && trailingPunctuation) {
          append = trailingPunctuation;
        }
        if (options.openLinksInNewWindow) {
          target = ' rel="noopener noreferrer" target="¨E95Eblank"';
        }
        return (
          lmc +
          '<a href="' +
          link +
          '"' +
          target +
          ">" +
          lnkTxt +
          "</a>" +
          append +
          tmc
        );
      };
    },
    replaceMail = function (options, globals) {
      return function (wholeMatch, b, mail) {
        var href = "mailto:";
        b = b || "";
        mail = showdown.subParser("unescapeSpecialChars")(
          mail,
          options,
          globals
        );
        if (options.encodeEmails) {
          href = showdown.helper.encodeEmailAddress(href + mail);
          mail = showdown.helper.encodeEmailAddress(mail);
        } else {
          href = href + mail;
        }
        return b + '<a href="' + href + '">' + mail + "</a>";
      };
    };
  showdown.subParser("autoLinks", function (text, options, globals) {
    text = globals.converter._dispatch(
      "autoLinks.before",
      text,
      options,
      globals
    );
    text = text.replace(delimUrlRegex, replaceLink(options));
    text = text.replace(delimMailRegex, replaceMail(options, globals));
    text = globals.converter._dispatch(
      "autoLinks.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("simplifiedAutoLinks", function (text, options, globals) {
    if (!options.simplifiedAutoLink) {
      return text;
    }
    text = globals.converter._dispatch(
      "simplifiedAutoLinks.before",
      text,
      options,
      globals
    );
    if (options.excludeTrailingPunctuationFromURLs) {
      text = text.replace(simpleURLRegex2, replaceLink(options));
    } else {
      text = text.replace(simpleURLRegex, replaceLink(options));
    }
    text = text.replace(simpleMailRegex, replaceMail(options, globals));
    text = globals.converter._dispatch(
      "simplifiedAutoLinks.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("blockGamut", function (text, options, globals) {
    text = globals.converter._dispatch(
      "blockGamut.before",
      text,
      options,
      globals
    );
    text = showdown.subParser("blockQuotes")(text, options, globals);
    text = showdown.subParser("headers")(text, options, globals);
    text = showdown.subParser("horizontalRule")(text, options, globals);
    text = showdown.subParser("lists")(text, options, globals);
    text = showdown.subParser("codeBlocks")(text, options, globals);
    text = showdown.subParser("tables")(text, options, globals);
    text = showdown.subParser("hashHTMLBlocks")(text, options, globals);
    text = showdown.subParser("paragraphs")(text, options, globals);
    text = globals.converter._dispatch(
      "blockGamut.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("blockQuotes", function (text, options, globals) {
    text = globals.converter._dispatch(
      "blockQuotes.before",
      text,
      options,
      globals
    );
    text = text + "\n\n";
    var rgx = /(^ {0,3}>[ \t]?.+\n(.+\n)*\n*)+/gm;
    if (options.splitAdjacentBlockquotes) {
      rgx = /^ {0,3}>[\s\S]*?(?:\n\n)/gm;
    }
    text = text.replace(rgx, function (bq) {
      bq = bq.replace(/^[ \t]*>[ \t]?/gm, "");
      bq = bq.replace(/¨0/g, "");
      bq = bq.replace(/^[ \t]+$/gm, "");
      bq = showdown.subParser("githubCodeBlocks")(bq, options, globals);
      bq = showdown.subParser("blockGamut")(bq, options, globals);
      bq = bq.replace(/(^|\n)/g, "$1  ");
      bq = bq.replace(/(\s*<pre>[^\r]+?<\/pre>)/gm, function (wholeMatch, m1) {
        var pre = m1;
        pre = pre.replace(/^  /gm, "¨0");
        pre = pre.replace(/¨0/g, "");
        return pre;
      });
      return showdown.subParser("hashBlock")(
        "<blockquote>\n" + bq + "\n</blockquote>",
        options,
        globals
      );
    });
    text = globals.converter._dispatch(
      "blockQuotes.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("codeBlocks", function (text, options, globals) {
    text = globals.converter._dispatch(
      "codeBlocks.before",
      text,
      options,
      globals
    );
    text += "¨0";
    var pattern = /(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=¨0))/g;
    text = text.replace(pattern, function (wholeMatch, m1, m2) {
      var codeblock = m1,
        nextChar = m2,
        end = "\n";
      codeblock = showdown.subParser("outdent")(codeblock, options, globals);
      codeblock = showdown.subParser("encodeCode")(codeblock, options, globals);
      codeblock = showdown.subParser("detab")(codeblock, options, globals);
      codeblock = codeblock.replace(/^\n+/g, "");
      codeblock = codeblock.replace(/\n+$/g, "");
      if (options.omitExtraWLInCodeBlocks) {
        end = "";
      }
      codeblock = "<pre><code>" + codeblock + end + "</code></pre>";
      return (
        showdown.subParser("hashBlock")(codeblock, options, globals) + nextChar
      );
    });
    text = text.replace(/¨0/, "");
    text = globals.converter._dispatch(
      "codeBlocks.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("codeSpans", function (text, options, globals) {
    text = globals.converter._dispatch(
      "codeSpans.before",
      text,
      options,
      globals
    );
    if (typeof text === "undefined") {
      text = "";
    }
    text = text.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm, function (
      wholeMatch,
      m1,
      m2,
      m3
    ) {
      var c = m3;
      c = c.replace(/^([ \t]*)/g, "");
      c = c.replace(/[ \t]*$/g, "");
      c = showdown.subParser("encodeCode")(c, options, globals);
      c = m1 + "<code>" + c + "</code>";
      c = showdown.subParser("hashHTMLSpans")(c, options, globals);
      return c;
    });
    text = globals.converter._dispatch(
      "codeSpans.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("completeHTMLDocument", function (text, options, globals) {
    if (!options.completeHTMLDocument) {
      return text;
    }
    text = globals.converter._dispatch(
      "completeHTMLDocument.before",
      text,
      options,
      globals
    );
    var doctype = "html",
      doctypeParsed = "<!DOCTYPE HTML>\n",
      title = "",
      charset = '<meta charset="utf-8">\n',
      lang = "",
      metadata = "";
    if (typeof globals.metadata.parsed.doctype !== "undefined") {
      doctypeParsed = "<!DOCTYPE " + globals.metadata.parsed.doctype + ">\n";
      doctype = globals.metadata.parsed.doctype.toString().toLowerCase();
      if (doctype === "html" || doctype === "html5") {
        charset = '<meta charset="utf-8">';
      }
    }
    for (var meta in globals.metadata.parsed) {
      if (globals.metadata.parsed.hasOwnProperty(meta)) {
        switch (meta.toLowerCase()) {
          case "doctype":
            break;
          case "title":
            title = "<title>" + globals.metadata.parsed.title + "</title>\n";
            break;
          case "charset":
            if (doctype === "html" || doctype === "html5") {
              charset =
                '<meta charset="' + globals.metadata.parsed.charset + '">\n';
            } else {
              charset =
                '<meta name="charset" content="' +
                globals.metadata.parsed.charset +
                '">\n';
            }
            break;
          case "language":
          case "lang":
            lang = ' lang="' + globals.metadata.parsed[meta] + '"';
            metadata +=
              '<meta name="' +
              meta +
              '" content="' +
              globals.metadata.parsed[meta] +
              '">\n';
            break;
          default:
            metadata +=
              '<meta name="' +
              meta +
              '" content="' +
              globals.metadata.parsed[meta] +
              '">\n';
        }
      }
    }
    text =
      doctypeParsed +
      "<html" +
      lang +
      ">\n<head>\n" +
      title +
      charset +
      metadata +
      "</head>\n<body>\n" +
      text.trim() +
      "\n</body>\n</html>";
    text = globals.converter._dispatch(
      "completeHTMLDocument.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("detab", function (text, options, globals) {
    text = globals.converter._dispatch("detab.before", text, options, globals);
    text = text.replace(/\t(?=\t)/g, "    ");
    text = text.replace(/\t/g, "¨A¨B");
    text = text.replace(/¨B(.+?)¨A/g, function (wholeMatch, m1) {
      var leadingText = m1,
        numSpaces = 4 - (leadingText.length % 4);
      for (var i = 0; i < numSpaces; i++) {
        leadingText += " ";
      }
      return leadingText;
    });
    text = text.replace(/¨A/g, "    ");
    text = text.replace(/¨B/g, "");
    text = globals.converter._dispatch("detab.after", text, options, globals);
    return text;
  });
  showdown.subParser("ellipsis", function (text, options, globals) {
    text = globals.converter._dispatch(
      "ellipsis.before",
      text,
      options,
      globals
    );
    text = text.replace(/\.\.\./g, "…");
    text = globals.converter._dispatch(
      "ellipsis.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("emoji", function (text, options, globals) {
    if (!options.emoji) {
      return text;
    }
    text = globals.converter._dispatch("emoji.before", text, options, globals);
    var emojiRgx = /:([\S]+?):/g;
    text = text.replace(emojiRgx, function (wm, emojiCode) {
      if (showdown.helper.emojis.hasOwnProperty(emojiCode)) {
        return showdown.helper.emojis[emojiCode];
      }
      return wm;
    });
    text = globals.converter._dispatch("emoji.after", text, options, globals);
    return text;
  });
  showdown.subParser("encodeAmpsAndAngles", function (text, options, globals) {
    text = globals.converter._dispatch(
      "encodeAmpsAndAngles.before",
      text,
      options,
      globals
    );
    text = text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g, "&amp;");
    text = text.replace(/<(?![a-z\/?$!])/gi, "&lt;");
    text = text.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = globals.converter._dispatch(
      "encodeAmpsAndAngles.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("encodeBackslashEscapes", function (
    text,
    options,
    globals
  ) {
    text = globals.converter._dispatch(
      "encodeBackslashEscapes.before",
      text,
      options,
      globals
    );
    text = text.replace(/\\(\\)/g, showdown.helper.escapeCharactersCallback);
    text = text.replace(
      /\\([`*_{}\[\]()>#+.!~=|-])/g,
      showdown.helper.escapeCharactersCallback
    );
    text = globals.converter._dispatch(
      "encodeBackslashEscapes.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("encodeCode", function (text, options, globals) {
    text = globals.converter._dispatch(
      "encodeCode.before",
      text,
      options,
      globals
    );
    text = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/([*_{}\[\]\\=~-])/g, showdown.helper.escapeCharactersCallback);
    text = globals.converter._dispatch(
      "encodeCode.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("escapeSpecialCharsWithinTagAttributes", function (
    text,
    options,
    globals
  ) {
    text = globals.converter._dispatch(
      "escapeSpecialCharsWithinTagAttributes.before",
      text,
      options,
      globals
    );
    var tags = /<\/?[a-z\d_:-]+(?:[\s]+[\s\S]+?)?>/gi,
      comments = /<!(--(?:(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)>/gi;
    text = text.replace(tags, function (wholeMatch) {
      return wholeMatch
        .replace(/(.)<\/?code>(?=.)/g, "$1`")
        .replace(/([\\`*_~=|])/g, showdown.helper.escapeCharactersCallback);
    });
    text = text.replace(comments, function (wholeMatch) {
      return wholeMatch.replace(
        /([\\`*_~=|])/g,
        showdown.helper.escapeCharactersCallback
      );
    });
    text = globals.converter._dispatch(
      "escapeSpecialCharsWithinTagAttributes.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("githubCodeBlocks", function (text, options, globals) {
    if (!options.ghCodeBlocks) {
      return text;
    }
    text = globals.converter._dispatch(
      "githubCodeBlocks.before",
      text,
      options,
      globals
    );
    text += "¨0";
    text = text.replace(
      /(?:^|\n)(?: {0,3})(```+|~~~+)(?: *)([^\s`~]*)\n([\s\S]*?)\n(?: {0,3})\1/g,
      function (wholeMatch, delim, language, codeblock) {
        var end = options.omitExtraWLInCodeBlocks ? "" : "\n";
        codeblock = showdown.subParser("encodeCode")(
          codeblock,
          options,
          globals
        );
        codeblock = showdown.subParser("detab")(codeblock, options, globals);
        codeblock = codeblock.replace(/^\n+/g, "");
        codeblock = codeblock.replace(/\n+$/g, "");
        codeblock =
          "<pre><code" +
          (language ?
            ' class="' + language + " language-" + language + '"' :
            "") +
          ">" +
          codeblock +
          end +
          "</code></pre>";
        codeblock = showdown.subParser("hashBlock")(
          codeblock,
          options,
          globals
        );
        return (
          "\n\n¨G" +
          (globals.ghCodeBlocks.push({
              text: wholeMatch,
              codeblock: codeblock,
            }) -
            1) +
          "G\n\n"
        );
      }
    );
    text = text.replace(/¨0/, "");
    return globals.converter._dispatch(
      "githubCodeBlocks.after",
      text,
      options,
      globals
    );
  });
  showdown.subParser("hashBlock", function (text, options, globals) {
    text = globals.converter._dispatch(
      "hashBlock.before",
      text,
      options,
      globals
    );
    text = text.replace(/(^\n+|\n+$)/g, "");
    text = "\n\n¨K" + (globals.gHtmlBlocks.push(text) - 1) + "K\n\n";
    text = globals.converter._dispatch(
      "hashBlock.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("hashCodeTags", function (text, options, globals) {
    text = globals.converter._dispatch(
      "hashCodeTags.before",
      text,
      options,
      globals
    );
    var repFunc = function (wholeMatch, match, left, right) {
      var codeblock =
        left +
        showdown.subParser("encodeCode")(match, options, globals) +
        right;
      return "¨C" + (globals.gHtmlSpans.push(codeblock) - 1) + "C";
    };
    text = showdown.helper.replaceRecursiveRegExp(
      text,
      repFunc,
      "<code\\b[^>]*>",
      "</code>",
      "gim"
    );
    text = globals.converter._dispatch(
      "hashCodeTags.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("hashElement", function (text, options, globals) {
    return function (wholeMatch, m1) {
      var blockText = m1;
      blockText = blockText.replace(/\n\n/g, "\n");
      blockText = blockText.replace(/^\n/, "");
      blockText = blockText.replace(/\n+$/g, "");
      blockText =
        "\n\n¨K" + (globals.gHtmlBlocks.push(blockText) - 1) + "K\n\n";
      return blockText;
    };
  });
  showdown.subParser("hashHTMLBlocks", function (text, options, globals) {
    text = globals.converter._dispatch(
      "hashHTMLBlocks.before",
      text,
      options,
      globals
    );
    var blockTags = [
        "pre",
        "div",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "table",
        "dl",
        "ol",
        "ul",
        "script",
        "noscript",
        "form",
        "fieldset",
        "iframe",
        "math",
        "style",
        "section",
        "header",
        "footer",
        "nav",
        "article",
        "aside",
        "address",
        "audio",
        "canvas",
        "figure",
        "hgroup",
        "output",
        "video",
        "p",
      ],
      repFunc = function (wholeMatch, match, left, right) {
        var txt = wholeMatch;
        if (left.search(/\bmarkdown\b/) !== -1) {
          txt = left + globals.converter.makeHtml(match) + right;
        }
        return "\n\n¨K" + (globals.gHtmlBlocks.push(txt) - 1) + "K\n\n";
      };
    if (options.backslashEscapesHTMLTags) {
      text = text.replace(/\\<(\/?[^>]+?)>/g, function (wm, inside) {
        return "&lt;" + inside + "&gt;";
      });
    }
    for (var i = 0; i < blockTags.length; ++i) {
      var opTagPos,
        rgx1 = new RegExp("^ {0,3}(<" + blockTags[i] + "\\b[^>]*>)", "im"),
        patLeft = "<" + blockTags[i] + "\\b[^>]*>",
        patRight = "</" + blockTags[i] + ">";
      while ((opTagPos = showdown.helper.regexIndexOf(text, rgx1)) !== -1) {
        var subTexts = showdown.helper.splitAtIndex(text, opTagPos),
          newSubText1 = showdown.helper.replaceRecursiveRegExp(
            subTexts[1],
            repFunc,
            patLeft,
            patRight,
            "im"
          );
        if (newSubText1 === subTexts[1]) {
          break;
        }
        text = subTexts[0].concat(newSubText1);
      }
    }
    text = text.replace(
      /(\n {0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g,
      showdown.subParser("hashElement")(text, options, globals)
    );
    text = showdown.helper.replaceRecursiveRegExp(
      text,
      function (txt) {
        return "\n\n¨K" + (globals.gHtmlBlocks.push(txt) - 1) + "K\n\n";
      },
      "^ {0,3}<!--",
      "-->",
      "gm"
    );
    text = text.replace(
      /(?:\n\n)( {0,3}(?:<([?%])[^\r]*?\2>)[ \t]*(?=\n{2,}))/g,
      showdown.subParser("hashElement")(text, options, globals)
    );
    text = globals.converter._dispatch(
      "hashHTMLBlocks.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("hashHTMLSpans", function (text, options, globals) {
    text = globals.converter._dispatch(
      "hashHTMLSpans.before",
      text,
      options,
      globals
    );

    function hashHTMLSpan(html) {
      return "¨C" + (globals.gHtmlSpans.push(html) - 1) + "C";
    }
    text = text.replace(/<[^>]+?\/>/gi, function (wm) {
      return hashHTMLSpan(wm);
    });
    text = text.replace(/<([^>]+?)>[\s\S]*?<\/\1>/g, function (wm) {
      return hashHTMLSpan(wm);
    });
    text = text.replace(/<([^>]+?)\s[^>]+?>[\s\S]*?<\/\1>/g, function (wm) {
      return hashHTMLSpan(wm);
    });
    text = text.replace(/<[^>]+?>/gi, function (wm) {
      return hashHTMLSpan(wm);
    });
    text = globals.converter._dispatch(
      "hashHTMLSpans.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("unhashHTMLSpans", function (text, options, globals) {
    text = globals.converter._dispatch(
      "unhashHTMLSpans.before",
      text,
      options,
      globals
    );
    for (var i = 0; i < globals.gHtmlSpans.length; ++i) {
      var repText = globals.gHtmlSpans[i],
        limit = 0;
      while (/¨C(\d+)C/.test(repText)) {
        var num = RegExp.$1;
        repText = repText.replace("¨C" + num + "C", globals.gHtmlSpans[num]);
        if (limit === 10) {
          console.error("maximum nesting of 10 spans reached!!!");
          break;
        }
        ++limit;
      }
      text = text.replace("¨C" + i + "C", repText);
    }
    text = globals.converter._dispatch(
      "unhashHTMLSpans.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("hashPreCodeTags", function (text, options, globals) {
    text = globals.converter._dispatch(
      "hashPreCodeTags.before",
      text,
      options,
      globals
    );
    var repFunc = function (wholeMatch, match, left, right) {
      var codeblock =
        left +
        showdown.subParser("encodeCode")(match, options, globals) +
        right;
      return (
        "\n\n¨G" +
        (globals.ghCodeBlocks.push({
            text: wholeMatch,
            codeblock: codeblock,
          }) -
          1) +
        "G\n\n"
      );
    };
    text = showdown.helper.replaceRecursiveRegExp(
      text,
      repFunc,
      "^ {0,3}<pre\\b[^>]*>\\s*<code\\b[^>]*>",
      "^ {0,3}</code>\\s*</pre>",
      "gim"
    );
    text = globals.converter._dispatch(
      "hashPreCodeTags.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("headers", function (text, options, globals) {
    text = globals.converter._dispatch(
      "headers.before",
      text,
      options,
      globals
    );
    var headerLevelStart = isNaN(parseInt(options.headerLevelStart)) ?
      1 :
      parseInt(options.headerLevelStart),
      setextRegexH1 = options.smoothLivePreview ?
      /^(.+)[ \t]*\n={2,}[ \t]*\n+/gm :
      /^(.+)[ \t]*\n=+[ \t]*\n+/gm,
      setextRegexH2 = options.smoothLivePreview ?
      /^(.+)[ \t]*\n-{2,}[ \t]*\n+/gm :
      /^(.+)[ \t]*\n-+[ \t]*\n+/gm;
    text = text.replace(setextRegexH1, function (wholeMatch, m1) {
      var spanGamut = showdown.subParser("spanGamut")(m1, options, globals),
        hID = options.noHeaderId ? "" : ' id="' + headerId(m1) + '"',
        hLevel = headerLevelStart,
        hashBlock =
        "<h" + hLevel + hID + ">" + spanGamut + "</h" + hLevel + ">";
      return showdown.subParser("hashBlock")(hashBlock, options, globals);
    });
    text = text.replace(setextRegexH2, function (matchFound, m1) {
      var spanGamut = showdown.subParser("spanGamut")(m1, options, globals),
        hID = options.noHeaderId ? "" : ' id="' + headerId(m1) + '"',
        hLevel = headerLevelStart + 1,
        hashBlock =
        "<h" + hLevel + hID + ">" + spanGamut + "</h" + hLevel + ">";
      return showdown.subParser("hashBlock")(hashBlock, options, globals);
    });
    var atxStyle = options.requireSpaceBeforeHeadingText ?
      /^(#{1,6})[ \t]+(.+?)[ \t]*#*\n+/gm :
      /^(#{1,6})[ \t]*(.+?)[ \t]*#*\n+/gm;
    text = text.replace(atxStyle, function (wholeMatch, m1, m2) {
      var hText = m2;
      if (options.customizedHeaderId) {
        hText = m2.replace(/\s?\{([^{]+?)}\s*$/, "");
      }
      var span = showdown.subParser("spanGamut")(hText, options, globals),
        hID = options.noHeaderId ? "" : ' id="' + headerId(m2) + '"',
        hLevel = headerLevelStart - 1 + m1.length,
        header = "<h" + hLevel + hID + ">" + span + "</h" + hLevel + ">";
      return showdown.subParser("hashBlock")(header, options, globals);
    });

    function headerId(m) {
      var title, prefix;
      if (options.customizedHeaderId) {
        var match = m.match(/\{([^{]+?)}\s*$/);
        if (match && match[1]) {
          m = match[1];
        }
      }
      title = m;
      if (showdown.helper.isString(options.prefixHeaderId)) {
        prefix = options.prefixHeaderId;
      } else {
        if (options.prefixHeaderId === true) {
          prefix = "section-";
        } else {
          prefix = "";
        }
      }
      if (!options.rawPrefixHeaderId) {
        title = prefix + title;
      }
      if (options.ghCompatibleHeaderId) {
        title = title
          .replace(/ /g, "-")
          .replace(/&amp;/g, "")
          .replace(/¨T/g, "")
          .replace(/¨D/g, "")
          .replace(/[&+$,\/:;=?@"#{}|^¨~\[\]`\\*)(%.!'<>]/g, "")
          .toLowerCase();
      } else {
        if (options.rawHeaderId) {
          title = title
            .replace(/ /g, "-")
            .replace(/&amp;/g, "&")
            .replace(/¨T/g, "¨")
            .replace(/¨D/g, "$")
            .replace(/["']/g, "-")
            .toLowerCase();
        } else {
          title = title.replace(/[^\w]/g, "").toLowerCase();
        }
      }
      if (options.rawPrefixHeaderId) {
        title = prefix + title;
      }
      if (globals.hashLinkCounts[title]) {
        title = title + "-" + globals.hashLinkCounts[title]++;
      } else {
        globals.hashLinkCounts[title] = 1;
      }
      return title;
    }
    text = globals.converter._dispatch("headers.after", text, options, globals);
    return text;
  });
  showdown.subParser("horizontalRule", function (text, options, globals) {
    text = globals.converter._dispatch(
      "horizontalRule.before",
      text,
      options,
      globals
    );
    var key = showdown.subParser("hashBlock")("<hr />", options, globals);
    text = text.replace(/^ {0,2}( ?-){3,}[ \t]*$/gm, key);
    text = text.replace(/^ {0,2}( ?\*){3,}[ \t]*$/gm, key);
    text = text.replace(/^ {0,2}( ?_){3,}[ \t]*$/gm, key);
    text = globals.converter._dispatch(
      "horizontalRule.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("images", function (text, options, globals) {
    text = globals.converter._dispatch("images.before", text, options, globals);
    var inlineRegExp = /!\[([^\]]*?)][ \t]*()\([ \t]?<?([\S]+?(?:\([\S]*?\)[\S]*?)?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(["'])([^"]*?)\6)?[ \t]?\)/g,
      crazyRegExp = /!\[([^\]]*?)][ \t]*()\([ \t]?<([^>]*)>(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(?:(["'])([^"]*?)\6))?[ \t]?\)/g,
      base64RegExp = /!\[([^\]]*?)][ \t]*()\([ \t]?<?(data:.+?\/.+?;base64,[A-Za-z0-9+/=\n]+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(["'])([^"]*?)\6)?[ \t]?\)/g,
      referenceRegExp = /!\[([^\]]*?)] ?(?:\n *)?\[([\s\S]*?)]()()()()()/g,
      refShortcutRegExp = /!\[([^\[\]]+)]()()()()()/g;

    function writeImageTagBase64(
      wholeMatch,
      altText,
      linkId,
      url,
      width,
      height,
      m5,
      title
    ) {
      url = url.replace(/\s/g, "");
      return writeImageTag(
        wholeMatch,
        altText,
        linkId,
        url,
        width,
        height,
        m5,
        title
      );
    }

    function writeImageTag(
      wholeMatch,
      altText,
      linkId,
      url,
      width,
      height,
      m5,
      title
    ) {
      var gUrls = globals.gUrls,
        gTitles = globals.gTitles,
        gDims = globals.gDimensions;
      linkId = linkId.toLowerCase();
      if (!title) {
        title = "";
      }
      if (wholeMatch.search(/\(<?\s*>? ?(['"].*['"])?\)$/m) > -1) {
        url = "";
      } else {
        if (url === "" || url === null) {
          if (linkId === "" || linkId === null) {
            linkId = altText.toLowerCase().replace(/ ?\n/g, " ");
          }
          url = "#" + linkId;
          if (!showdown.helper.isUndefined(gUrls[linkId])) {
            url = gUrls[linkId];
            if (!showdown.helper.isUndefined(gTitles[linkId])) {
              title = gTitles[linkId];
            }
            if (!showdown.helper.isUndefined(gDims[linkId])) {
              width = gDims[linkId].width;
              height = gDims[linkId].height;
            }
          } else {
            return wholeMatch;
          }
        }
      }
      altText = altText
        .replace(/"/g, "&quot;")
        .replace(
          showdown.helper.regexes.asteriskDashAndColon,
          showdown.helper.escapeCharactersCallback
        );
      url = url.replace(
        showdown.helper.regexes.asteriskDashAndColon,
        showdown.helper.escapeCharactersCallback
      );
      var result =
        `<a href="${url}" target="_blank">
          <img class="shuoshuoimg" src="${url}" style="width: 20%;" />
        </a>`;
      if (title && showdown.helper.isString(title)) {
        title = title
          .replace(/"/g, "&quot;")
          .replace(
            showdown.helper.regexes.asteriskDashAndColon,
            showdown.helper.escapeCharactersCallback
          );
        result += ' title="' + title + '"';
      }
      if (width && height) {
        width = width === "*" ? "auto" : width;
        height = height === "*" ? "auto" : height;
        result += ' width="' + width + '"';
        result += ' height="' + height + '"';
      }
      return result;
    }
    text = text.replace(referenceRegExp, writeImageTag);
    text = text.replace(base64RegExp, writeImageTagBase64);
    text = text.replace(crazyRegExp, writeImageTag);
    text = text.replace(inlineRegExp, writeImageTag);
    text = text.replace(refShortcutRegExp, writeImageTag);
    text = globals.converter._dispatch("images.after", text, options, globals);
    return text;
  });
  showdown.subParser("italicsAndBold", function (text, options, globals) {
    text = globals.converter._dispatch(
      "italicsAndBold.before",
      text,
      options,
      globals
    );

    function parseInside(txt, left, right) {
      return left + txt + right;
    }
    if (options.literalMidWordUnderscores) {
      text = text.replace(/\b___(\S[\s\S]*?)___\b/g, function (wm, txt) {
        return parseInside(txt, "<strong><em>", "</em></strong>");
      });
      text = text.replace(/\b__(\S[\s\S]*?)__\b/g, function (wm, txt) {
        return parseInside(txt, "<strong>", "</strong>");
      });
      text = text.replace(/\b_(\S[\s\S]*?)_\b/g, function (wm, txt) {
        return parseInside(txt, "<em>", "</em>");
      });
    } else {
      text = text.replace(/___(\S[\s\S]*?)___/g, function (wm, m) {
        return /\S$/.test(m) ?
          parseInside(m, "<strong><em>", "</em></strong>") :
          wm;
      });
      text = text.replace(/__(\S[\s\S]*?)__/g, function (wm, m) {
        return /\S$/.test(m) ? parseInside(m, "<strong>", "</strong>") : wm;
      });
      text = text.replace(/_([^\s_][\s\S]*?)_/g, function (wm, m) {
        return /\S$/.test(m) ? parseInside(m, "<em>", "</em>") : wm;
      });
    }
    if (options.literalMidWordAsterisks) {
      text = text.replace(
        /([^*]|^)\B\*\*\*(\S[\s\S]*?)\*\*\*\B(?!\*)/g,
        function (wm, lead, txt) {
          return parseInside(txt, lead + "<strong><em>", "</em></strong>");
        }
      );
      text = text.replace(/([^*]|^)\B\*\*(\S[\s\S]*?)\*\*\B(?!\*)/g, function (
        wm,
        lead,
        txt
      ) {
        return parseInside(txt, lead + "<strong>", "</strong>");
      });
      text = text.replace(/([^*]|^)\B\*(\S[\s\S]*?)\*\B(?!\*)/g, function (
        wm,
        lead,
        txt
      ) {
        return parseInside(txt, lead + "<em>", "</em>");
      });
    } else {
      text = text.replace(/\*\*\*(\S[\s\S]*?)\*\*\*/g, function (wm, m) {
        return /\S$/.test(m) ?
          parseInside(m, "<strong><em>", "</em></strong>") :
          wm;
      });
      text = text.replace(/\*\*(\S[\s\S]*?)\*\*/g, function (wm, m) {
        return /\S$/.test(m) ? parseInside(m, "<strong>", "</strong>") : wm;
      });
      text = text.replace(/\*([^\s*][\s\S]*?)\*/g, function (wm, m) {
        return /\S$/.test(m) ? parseInside(m, "<em>", "</em>") : wm;
      });
    }
    text = globals.converter._dispatch(
      "italicsAndBold.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("lists", function (text, options, globals) {
    function processListItems(listStr, trimTrailing) {
      globals.gListLevel++;
      listStr = listStr.replace(/\n{2,}$/, "\n");
      listStr += "¨0";
      var rgx = /(\n)?(^ {0,3})([*+-]|\d+[.])[ \t]+((\[(x|X| )?])?[ \t]*[^\r]+?(\n{1,2}))(?=\n*(¨0| {0,3}([*+-]|\d+[.])[ \t]+))/gm,
        isParagraphed = /\n[ \t]*\n(?!¨0)/.test(listStr);
      if (options.disableForced4SpacesIndentedSublists) {
        rgx = /(\n)?(^ {0,3})([*+-]|\d+[.])[ \t]+((\[(x|X| )?])?[ \t]*[^\r]+?(\n{1,2}))(?=\n*(¨0|\2([*+-]|\d+[.])[ \t]+))/gm;
      }
      listStr = listStr.replace(rgx, function (
        wholeMatch,
        m1,
        m2,
        m3,
        m4,
        taskbtn,
        checked
      ) {
        checked = checked && checked.trim() !== "";
        var item = showdown.subParser("outdent")(m4, options, globals),
          bulletStyle = "";
        if (taskbtn && options.tasklists) {
          bulletStyle =
            ' class="task-list-item" style="list-style-type: none;"';
          item = item.replace(/^[ \t]*\[(x|X| )?]/m, function () {
            var otp =
              '<input type="checkbox" disabled style="margin: 0px 0.35em 0.25em -1.6em; vertical-align: middle;"';
            if (checked) {
              otp += " checked";
            }
            otp += ">";
            return otp;
          });
        }
        item = item.replace(/^([-*+]|\d\.)[ \t]+[\S\n ]*/g, function (wm2) {
          return "¨A" + wm2;
        });
        if (m1 || item.search(/\n{2,}/) > -1) {
          item = showdown.subParser("githubCodeBlocks")(item, options, globals);
          item = showdown.subParser("blockGamut")(item, options, globals);
        } else {
          item = showdown.subParser("lists")(item, options, globals);
          item = item.replace(/\n$/, "");
          item = showdown.subParser("hashHTMLBlocks")(item, options, globals);
          item = item.replace(/\n\n+/g, "\n\n");
          if (isParagraphed) {
            item = showdown.subParser("paragraphs")(item, options, globals);
          } else {
            item = showdown.subParser("spanGamut")(item, options, globals);
          }
        }
        item = item.replace("¨A", "");
        item = "<li" + bulletStyle + ">" + item + "</li>\n";
        return item;
      });
      listStr = listStr.replace(/¨0/g, "");
      globals.gListLevel--;
      if (trimTrailing) {
        listStr = listStr.replace(/\s+$/, "");
      }
      return listStr;
    }

    function styleStartNumber(list, listType) {
      if (listType === "ol") {
        var res = list.match(/^ *(\d+)\./);
        if (res && res[1] !== "1") {
          return ' start="' + res[1] + '"';
        }
      }
      return "";
    }

    function parseConsecutiveLists(list, listType, trimTrailing) {
      var olRgx = options.disableForced4SpacesIndentedSublists ?
        /^ ?\d+\.[ \t]/gm :
        /^ {0,3}\d+\.[ \t]/gm,
        ulRgx = options.disableForced4SpacesIndentedSublists ?
        /^ ?[*+-][ \t]/gm :
        /^ {0,3}[*+-][ \t]/gm,
        counterRxg = listType === "ul" ? olRgx : ulRgx,
        result = "";
      if (list.search(counterRxg) !== -1) {
        (function parseCL(txt) {
          var pos = txt.search(counterRxg),
            style = styleStartNumber(list, listType);
          if (pos !== -1) {
            result +=
              "\n\n<" +
              listType +
              style +
              ">\n" +
              processListItems(txt.slice(0, pos), !!trimTrailing) +
              "</" +
              listType +
              ">\n";
            listType = listType === "ul" ? "ol" : "ul";
            counterRxg = listType === "ul" ? olRgx : ulRgx;
            parseCL(txt.slice(pos));
          } else {
            result +=
              "\n\n<" +
              listType +
              style +
              ">\n" +
              processListItems(txt, !!trimTrailing) +
              "</" +
              listType +
              ">\n";
          }
        })(list);
      } else {
        var style = styleStartNumber(list, listType);
        result =
          "\n\n<" +
          listType +
          style +
          ">\n" +
          processListItems(list, !!trimTrailing) +
          "</" +
          listType +
          ">\n";
      }
      return result;
    }
    text = globals.converter._dispatch("lists.before", text, options, globals);
    text += "¨0";
    if (globals.gListLevel) {
      text = text.replace(
        /^(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(¨0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm,
        function (wholeMatch, list, m2) {
          var listType = m2.search(/[*+-]/g) > -1 ? "ul" : "ol";
          return parseConsecutiveLists(list, listType, true);
        }
      );
    } else {
      text = text.replace(
        /(\n\n|^\n?)(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(¨0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm,
        function (wholeMatch, m1, list, m3) {
          var listType = m3.search(/[*+-]/g) > -1 ? "ul" : "ol";
          return parseConsecutiveLists(list, listType, false);
        }
      );
    }
    text = text.replace(/¨0/, "");
    text = globals.converter._dispatch("lists.after", text, options, globals);
    return text;
  });
  showdown.subParser("metadata", function (text, options, globals) {
    if (!options.metadata) {
      return text;
    }
    text = globals.converter._dispatch(
      "metadata.before",
      text,
      options,
      globals
    );

    function parseMetadataContents(content) {
      globals.metadata.raw = content;
      content = content.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      content = content.replace(/\n {4}/g, " ");
      content.replace(/^([\S ]+): +([\s\S]+?)$/gm, function (wm, key, value) {
        globals.metadata.parsed[key] = value;
        return "";
      });
    }
    text = text.replace(/^\s*«««+(\S*?)\n([\s\S]+?)\n»»»+\n/, function (
      wholematch,
      format,
      content
    ) {
      parseMetadataContents(content);
      return "¨M";
    });
    text = text.replace(/^\s*---+(\S*?)\n([\s\S]+?)\n---+\n/, function (
      wholematch,
      format,
      content
    ) {
      if (format) {
        globals.metadata.format = format;
      }
      parseMetadataContents(content);
      return "¨M";
    });
    text = text.replace(/¨M/g, "");
    text = globals.converter._dispatch(
      "metadata.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("outdent", function (text, options, globals) {
    text = globals.converter._dispatch(
      "outdent.before",
      text,
      options,
      globals
    );
    text = text.replace(/^(\t|[ ]{1,4})/gm, "¨0");
    text = text.replace(/¨0/g, "");
    text = globals.converter._dispatch("outdent.after", text, options, globals);
    return text;
  });
  showdown.subParser("paragraphs", function (text, options, globals) {
    text = globals.converter._dispatch(
      "paragraphs.before",
      text,
      options,
      globals
    );
    text = text.replace(/^\n+/g, "");
    text = text.replace(/\n+$/g, "");
    var grafs = text.split(/\n{2,}/g),
      grafsOut = [],
      end = grafs.length;
    for (var i = 0; i < end; i++) {
      var str = grafs[i];
      if (str.search(/¨(K|G)(\d+)\1/g) >= 0) {
        grafsOut.push(str);
      } else {
        if (str.search(/\S/) >= 0) {
          str = showdown.subParser("spanGamut")(str, options, globals);
          str = str.replace(/^([ \t]*)/g, "<p>");
          str += "</p>";
          grafsOut.push(str);
        }
      }
    }
    end = grafsOut.length;
    for (i = 0; i < end; i++) {
      var blockText = "",
        grafsOutIt = grafsOut[i],
        codeFlag = false;
      while (/¨(K|G)(\d+)\1/.test(grafsOutIt)) {
        var delim = RegExp.$1,
          num = RegExp.$2;
        if (delim === "K") {
          blockText = globals.gHtmlBlocks[num];
        } else {
          if (codeFlag) {
            blockText = showdown.subParser("encodeCode")(
              globals.ghCodeBlocks[num].text,
              options,
              globals
            );
          } else {
            blockText = globals.ghCodeBlocks[num].codeblock;
          }
        }
        blockText = blockText.replace(/\$/g, "$$$$");
        grafsOutIt = grafsOutIt.replace(/(\n\n)?¨(K|G)\d+\2(\n\n)?/, blockText);
        if (/^<pre\b[^>]*>\s*<code\b[^>]*>/.test(grafsOutIt)) {
          codeFlag = true;
        }
      }
      grafsOut[i] = grafsOutIt;
    }
    text = grafsOut.join("\n");
    text = text.replace(/^\n+/g, "");
    text = text.replace(/\n+$/g, "");
    return globals.converter._dispatch(
      "paragraphs.after",
      text,
      options,
      globals
    );
  });
  showdown.subParser("runExtension", function (ext, text, options, globals) {
    if (ext.filter) {
      text = ext.filter(text, globals.converter, options);
    } else {
      if (ext.regex) {
        var re = ext.regex;
        if (!(re instanceof RegExp)) {
          re = new RegExp(re, "g");
        }
        text = text.replace(re, ext.replace);
      }
    }
    return text;
  });
  showdown.subParser("spanGamut", function (text, options, globals) {
    text = globals.converter._dispatch(
      "spanGamut.before",
      text,
      options,
      globals
    );
    text = showdown.subParser("codeSpans")(text, options, globals);
    text = showdown.subParser("escapeSpecialCharsWithinTagAttributes")(
      text,
      options,
      globals
    );
    text = showdown.subParser("encodeBackslashEscapes")(text, options, globals);
    text = showdown.subParser("images")(text, options, globals);
    text = showdown.subParser("anchors")(text, options, globals);
    text = showdown.subParser("autoLinks")(text, options, globals);
    text = showdown.subParser("simplifiedAutoLinks")(text, options, globals);
    text = showdown.subParser("emoji")(text, options, globals);
    text = showdown.subParser("underline")(text, options, globals);
    text = showdown.subParser("italicsAndBold")(text, options, globals);
    text = showdown.subParser("strikethrough")(text, options, globals);
    text = showdown.subParser("ellipsis")(text, options, globals);
    text = showdown.subParser("hashHTMLSpans")(text, options, globals);
    text = showdown.subParser("encodeAmpsAndAngles")(text, options, globals);
    if (options.simpleLineBreaks) {
      if (!/\n\n¨K/.test(text)) {
        text = text.replace(/\n+/g, "<br />\n");
      }
    } else {
      text = text.replace(/  +\n/g, "<br />\n");
    }
    text = globals.converter._dispatch(
      "spanGamut.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("strikethrough", function (text, options, globals) {
    function parseInside(txt) {
      if (options.simplifiedAutoLink) {
        txt = showdown.subParser("simplifiedAutoLinks")(txt, options, globals);
      }
      return "<del>" + txt + "</del>";
    }
    if (options.strikethrough) {
      text = globals.converter._dispatch(
        "strikethrough.before",
        text,
        options,
        globals
      );
      text = text.replace(/(?:~){2}([\s\S]+?)(?:~){2}/g, function (wm, txt) {
        return parseInside(txt);
      });
      text = globals.converter._dispatch(
        "strikethrough.after",
        text,
        options,
        globals
      );
    }
    return text;
  });
  showdown.subParser("stripLinkDefinitions", function (text, options, globals) {
    var regex = /^ {0,3}\[(.+)]:[ \t]*\n?[ \t]*<?([^>\s]+)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*\n?[ \t]*(?:(\n*)["|'(](.+?)["|')][ \t]*)?(?:\n+|(?=¨0))/gm,
      base64Regex = /^ {0,3}\[(.+)]:[ \t]*\n?[ \t]*<?(data:.+?\/.+?;base64,[A-Za-z0-9+/=\n]+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*\n?[ \t]*(?:(\n*)["|'(](.+?)["|')][ \t]*)?(?:\n\n|(?=¨0)|(?=\n\[))/gm;
    text += "¨0";
    var replaceFunc = function (
      wholeMatch,
      linkId,
      url,
      width,
      height,
      blankLines,
      title
    ) {
      linkId = linkId.toLowerCase();
      if (url.match(/^data:.+?\/.+?;base64,/)) {
        globals.gUrls[linkId] = url.replace(/\s/g, "");
      } else {
        globals.gUrls[linkId] = showdown.subParser("encodeAmpsAndAngles")(
          url,
          options,
          globals
        );
      }
      if (blankLines) {
        return blankLines + title;
      } else {
        if (title) {
          globals.gTitles[linkId] = title.replace(/"|'/g, "&quot;");
        }
        if (options.parseImgDimensions && width && height) {
          globals.gDimensions[linkId] = {
            width: width,
            height: height,
          };
        }
      }
      return "";
    };
    text = text.replace(base64Regex, replaceFunc);
    text = text.replace(regex, replaceFunc);
    text = text.replace(/¨0/, "");
    return text;
  });
  showdown.subParser("tables", function (text, options, globals) {
    if (!options.tables) {
      return text;
    }
    var tableRgx = /^ {0,3}\|?.+\|.+\n {0,3}\|?[ \t]*:?[ \t]*(?:[-=]){2,}[ \t]*:?[ \t]*\|[ \t]*:?[ \t]*(?:[-=]){2,}[\s\S]+?(?:\n\n|¨0)/gm,
      singeColTblRgx = /^ {0,3}\|.+\|[ \t]*\n {0,3}\|[ \t]*:?[ \t]*(?:[-=]){2,}[ \t]*:?[ \t]*\|[ \t]*\n( {0,3}\|.+\|[ \t]*\n)*(?:\n|¨0)/gm;

    function parseStyles(sLine) {
      if (/^:[ \t]*--*$/.test(sLine)) {
        return ' style="text-align:left;"';
      } else {
        if (/^--*[ \t]*:[ \t]*$/.test(sLine)) {
          return ' style="text-align:right;"';
        } else {
          if (/^:[ \t]*--*[ \t]*:$/.test(sLine)) {
            return ' style="text-align:center;"';
          } else {
            return "";
          }
        }
      }
    }

    function parseHeaders(header, style) {
      var id = "";
      header = header.trim();
      if (options.tablesHeaderId || options.tableHeaderId) {
        id = ' id="' + header.replace(/ /g, "_").toLowerCase() + '"';
      }
      header = showdown.subParser("spanGamut")(header, options, globals);
      return "<th" + id + style + ">" + header + "</th>\n";
    }

    function parseCells(cell, style) {
      var subText = showdown.subParser("spanGamut")(cell, options, globals);
      return "<td" + style + ">" + subText + "</td>\n";
    }

    function buildTable(headers, cells) {
      var tb = "<table>\n<thead>\n<tr>\n",
        tblLgn = headers.length;
      for (var i = 0; i < tblLgn; ++i) {
        tb += headers[i];
      }
      tb += "</tr>\n</thead>\n<tbody>\n";
      for (i = 0; i < cells.length; ++i) {
        tb += "<tr>\n";
        for (var ii = 0; ii < tblLgn; ++ii) {
          tb += cells[i][ii];
        }
        tb += "</tr>\n";
      }
      tb += "</tbody>\n</table>\n";
      return tb;
    }

    function parseTable(rawTable) {
      var i,
        tableLines = rawTable.split("\n");
      for (i = 0; i < tableLines.length; ++i) {
        if (/^ {0,3}\|/.test(tableLines[i])) {
          tableLines[i] = tableLines[i].replace(/^ {0,3}\|/, "");
        }
        if (/\|[ \t]*$/.test(tableLines[i])) {
          tableLines[i] = tableLines[i].replace(/\|[ \t]*$/, "");
        }
        tableLines[i] = showdown.subParser("codeSpans")(
          tableLines[i],
          options,
          globals
        );
      }
      var rawHeaders = tableLines[0].split("|").map(function (s) {
          return s.trim();
        }),
        rawStyles = tableLines[1].split("|").map(function (s) {
          return s.trim();
        }),
        rawCells = [],
        headers = [],
        styles = [],
        cells = [];
      tableLines.shift();
      tableLines.shift();
      for (i = 0; i < tableLines.length; ++i) {
        if (tableLines[i].trim() === "") {
          continue;
        }
        rawCells.push(
          tableLines[i].split("|").map(function (s) {
            return s.trim();
          })
        );
      }
      if (rawHeaders.length < rawStyles.length) {
        return rawTable;
      }
      for (i = 0; i < rawStyles.length; ++i) {
        styles.push(parseStyles(rawStyles[i]));
      }
      for (i = 0; i < rawHeaders.length; ++i) {
        if (showdown.helper.isUndefined(styles[i])) {
          styles[i] = "";
        }
        headers.push(parseHeaders(rawHeaders[i], styles[i]));
      }
      for (i = 0; i < rawCells.length; ++i) {
        var row = [];
        for (var ii = 0; ii < headers.length; ++ii) {
          if (showdown.helper.isUndefined(rawCells[i][ii])) {}
          row.push(parseCells(rawCells[i][ii], styles[ii]));
        }
        cells.push(row);
      }
      return buildTable(headers, cells);
    }
    text = globals.converter._dispatch("tables.before", text, options, globals);
    text = text.replace(/\\(\|)/g, showdown.helper.escapeCharactersCallback);
    text = text.replace(tableRgx, parseTable);
    text = text.replace(singeColTblRgx, parseTable);
    text = globals.converter._dispatch("tables.after", text, options, globals);
    return text;
  });
  showdown.subParser("underline", function (text, options, globals) {
    if (!options.underline) {
      return text;
    }
    text = globals.converter._dispatch(
      "underline.before",
      text,
      options,
      globals
    );
    if (options.literalMidWordUnderscores) {
      text = text.replace(/\b___(\S[\s\S]*?)___\b/g, function (wm, txt) {
        return "<u>" + txt + "</u>";
      });
      text = text.replace(/\b__(\S[\s\S]*?)__\b/g, function (wm, txt) {
        return "<u>" + txt + "</u>";
      });
    } else {
      text = text.replace(/___(\S[\s\S]*?)___/g, function (wm, m) {
        return /\S$/.test(m) ? "<u>" + m + "</u>" : wm;
      });
      text = text.replace(/__(\S[\s\S]*?)__/g, function (wm, m) {
        return /\S$/.test(m) ? "<u>" + m + "</u>" : wm;
      });
    }
    text = text.replace(/(_)/g, showdown.helper.escapeCharactersCallback);
    text = globals.converter._dispatch(
      "underline.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("unescapeSpecialChars", function (text, options, globals) {
    text = globals.converter._dispatch(
      "unescapeSpecialChars.before",
      text,
      options,
      globals
    );
    text = text.replace(/¨E(\d+)E/g, function (wholeMatch, m1) {
      var charCodeToReplace = parseInt(m1);
      return String.fromCharCode(charCodeToReplace);
    });
    text = globals.converter._dispatch(
      "unescapeSpecialChars.after",
      text,
      options,
      globals
    );
    return text;
  });
  showdown.subParser("makeMarkdown.blockquote", function (node, globals) {
    var txt = "";
    if (node.hasChildNodes()) {
      var children = node.childNodes,
        childrenLength = children.length;
      for (var i = 0; i < childrenLength; ++i) {
        var innerTxt = showdown.subParser("makeMarkdown.node")(
          children[i],
          globals
        );
        if (innerTxt === "") {
          continue;
        }
        txt += innerTxt;
      }
    }
    txt = txt.trim();
    txt = "> " + txt.split("\n").join("\n> ");
    return txt;
  });
  showdown.subParser("makeMarkdown.codeBlock", function (node, globals) {
    var lang = node.getAttribute("language"),
      num = node.getAttribute("precodenum");
    return "```" + lang + "\n" + globals.preList[num] + "\n```";
  });
  showdown.subParser("makeMarkdown.codeSpan", function (node) {
    return "`" + node.innerHTML + "`";
  });
  showdown.subParser("makeMarkdown.emphasis", function (node, globals) {
    var txt = "";
    if (node.hasChildNodes()) {
      txt += "*";
      var children = node.childNodes,
        childrenLength = children.length;
      for (var i = 0; i < childrenLength; ++i) {
        txt += showdown.subParser("makeMarkdown.node")(children[i], globals);
      }
      txt += "*";
    }
    return txt;
  });
  showdown.subParser("makeMarkdown.header", function (
    node,
    globals,
    headerLevel
  ) {
    var headerMark = new Array(headerLevel + 1).join("#"),
      txt = "";
    if (node.hasChildNodes()) {
      txt = headerMark + " ";
      var children = node.childNodes,
        childrenLength = children.length;
      for (var i = 0; i < childrenLength; ++i) {
        txt += showdown.subParser("makeMarkdown.node")(children[i], globals);
      }
    }
    return txt;
  });
  showdown.subParser("makeMarkdown.hr", function () {
    return "---";
  });
  showdown.subParser("makeMarkdown.image", function (node) {
    var txt = "";
    if (node.hasAttribute("src")) {
      txt += "![" + node.getAttribute("alt") + "](";
      txt += "<" + node.getAttribute("src") + ">";
      if (node.hasAttribute("width") && node.hasAttribute("height")) {
        txt +=
          " =" + node.getAttribute("width") + "x" + node.getAttribute("height");
      }
      if (node.hasAttribute("title")) {
        txt += ' "' + node.getAttribute("title") + '"';
      }
      txt += ")";
    }
    return txt;
  });
  showdown.subParser("makeMarkdown.links", function (node, globals) {
    var txt = "";
    if (node.hasChildNodes() && node.hasAttribute("href")) {
      var children = node.childNodes,
        childrenLength = children.length;
      txt = "[";
      for (var i = 0; i < childrenLength; ++i) {
        txt += showdown.subParser("makeMarkdown.node")(children[i], globals);
      }
      txt += "](";
      txt += "<" + node.getAttribute("href") + ">";
      if (node.hasAttribute("title")) {
        txt += ' "' + node.getAttribute("title") + '"';
      }
      txt += ")";
    }
    return txt;
  });
  showdown.subParser("makeMarkdown.list", function (node, globals, type) {
    var txt = "";
    if (!node.hasChildNodes()) {
      return "";
    }
    var listItems = node.childNodes,
      listItemsLenght = listItems.length,
      listNum = node.getAttribute("start") || 1;
    for (var i = 0; i < listItemsLenght; ++i) {
      if (
        typeof listItems[i].tagName === "undefined" ||
        listItems[i].tagName.toLowerCase() !== "li"
      ) {
        continue;
      }
      var bullet = "";
      if (type === "ol") {
        bullet = listNum.toString() + ". ";
      } else {
        bullet = "- ";
      }
      txt +=
        bullet +
        showdown.subParser("makeMarkdown.listItem")(listItems[i], globals);
      ++listNum;
    }
    txt += "\n<!-- -->\n";
    return txt.trim();
  });
  showdown.subParser("makeMarkdown.listItem", function (node, globals) {
    var listItemTxt = "";
    var children = node.childNodes,
      childrenLenght = children.length;
    for (var i = 0; i < childrenLenght; ++i) {
      listItemTxt += showdown.subParser("makeMarkdown.node")(
        children[i],
        globals
      );
    }
    if (!/\n$/.test(listItemTxt)) {
      listItemTxt += "\n";
    } else {
      listItemTxt = listItemTxt
        .split("\n")
        .join("\n    ")
        .replace(/^ {4}$/gm, "")
        .replace(/\n\n+/g, "\n\n");
    }
    return listItemTxt;
  });
  showdown.subParser("makeMarkdown.node", function (node, globals, spansOnly) {
    spansOnly = spansOnly || false;
    var txt = "";
    if (node.nodeType === 3) {
      return showdown.subParser("makeMarkdown.txt")(node, globals);
    }
    if (node.nodeType === 8) {
      return "<!--" + node.data + "-->\n\n";
    }
    if (node.nodeType !== 1) {
      return "";
    }
    var tagName = node.tagName.toLowerCase();
    switch (tagName) {
      case "h1":
        if (!spansOnly) {
          txt =
            showdown.subParser("makeMarkdown.header")(node, globals, 1) +
            "\n\n";
        }
        break;
      case "h2":
        if (!spansOnly) {
          txt =
            showdown.subParser("makeMarkdown.header")(node, globals, 2) +
            "\n\n";
        }
        break;
      case "h3":
        if (!spansOnly) {
          txt =
            showdown.subParser("makeMarkdown.header")(node, globals, 3) +
            "\n\n";
        }
        break;
      case "h4":
        if (!spansOnly) {
          txt =
            showdown.subParser("makeMarkdown.header")(node, globals, 4) +
            "\n\n";
        }
        break;
      case "h5":
        if (!spansOnly) {
          txt =
            showdown.subParser("makeMarkdown.header")(node, globals, 5) +
            "\n\n";
        }
        break;
      case "h6":
        if (!spansOnly) {
          txt =
            showdown.subParser("makeMarkdown.header")(node, globals, 6) +
            "\n\n";
        }
        break;
      case "p":
        if (!spansOnly) {
          txt =
            showdown.subParser("makeMarkdown.paragraph")(node, globals) +
            "\n\n";
        }
        break;
      case "blockquote":
        if (!spansOnly) {
          txt =
            showdown.subParser("makeMarkdown.blockquote")(node, globals) +
            "\n\n";
        }
        break;
      case "hr":
        if (!spansOnly) {
          txt = showdown.subParser("makeMarkdown.hr")(node, globals) + "\n\n";
        }
        break;
      case "ol":
        if (!spansOnly) {
          txt =
            showdown.subParser("makeMarkdown.list")(node, globals, "ol") +
            "\n\n";
        }
        break;
      case "ul":
        if (!spansOnly) {
          txt =
            showdown.subParser("makeMarkdown.list")(node, globals, "ul") +
            "\n\n";
        }
        break;
      case "precode":
        if (!spansOnly) {
          txt =
            showdown.subParser("makeMarkdown.codeBlock")(node, globals) +
            "\n\n";
        }
        break;
      case "pre":
        if (!spansOnly) {
          txt = showdown.subParser("makeMarkdown.pre")(node, globals) + "\n\n";
        }
        break;
      case "table":
        if (!spansOnly) {
          txt =
            showdown.subParser("makeMarkdown.table")(node, globals) + "\n\n";
        }
        break;
      case "code":
        txt = showdown.subParser("makeMarkdown.codeSpan")(node, globals);
        break;
      case "em":
      case "i":
        txt = showdown.subParser("makeMarkdown.emphasis")(node, globals);
        break;
      case "strong":
      case "b":
        txt = showdown.subParser("makeMarkdown.strong")(node, globals);
        break;
      case "del":
        txt = showdown.subParser("makeMarkdown.strikethrough")(node, globals);
        break;
      case "a":
        txt = showdown.subParser("makeMarkdown.links")(node, globals);
        break;
      case "img":
        txt = showdown.subParser("makeMarkdown.image")(node, globals);
        break;
      default:
        txt = node.outerHTML + "\n\n";
    }
    return txt;
  });
  showdown.subParser("makeMarkdown.paragraph", function (node, globals) {
    var txt = "";
    if (node.hasChildNodes()) {
      var children = node.childNodes,
        childrenLength = children.length;
      for (var i = 0; i < childrenLength; ++i) {
        txt += showdown.subParser("makeMarkdown.node")(children[i], globals);
      }
    }
    txt = txt.trim();
    return txt;
  });
  showdown.subParser("makeMarkdown.pre", function (node, globals) {
    var num = node.getAttribute("prenum");
    return "<pre>" + globals.preList[num] + "</pre>";
  });
  showdown.subParser("makeMarkdown.strikethrough", function (node, globals) {
    var txt = "";
    if (node.hasChildNodes()) {
      txt += "~~";
      var children = node.childNodes,
        childrenLength = children.length;
      for (var i = 0; i < childrenLength; ++i) {
        txt += showdown.subParser("makeMarkdown.node")(children[i], globals);
      }
      txt += "~~";
    }
    return txt;
  });
  showdown.subParser("makeMarkdown.strong", function (node, globals) {
    var txt = "";
    if (node.hasChildNodes()) {
      txt += "**";
      var children = node.childNodes,
        childrenLength = children.length;
      for (var i = 0; i < childrenLength; ++i) {
        txt += showdown.subParser("makeMarkdown.node")(children[i], globals);
      }
      txt += "**";
    }
    return txt;
  });
  showdown.subParser("makeMarkdown.table", function (node, globals) {
    var txt = "",
      tableArray = [
        [],
        []
      ],
      headings = node.querySelectorAll("thead>tr>th"),
      rows = node.querySelectorAll("tbody>tr"),
      i,
      ii;
    for (i = 0; i < headings.length; ++i) {
      var headContent = showdown.subParser("makeMarkdown.tableCell")(
          headings[i],
          globals
        ),
        allign = "---";
      if (headings[i].hasAttribute("style")) {
        var style = headings[i]
          .getAttribute("style")
          .toLowerCase()
          .replace(/\s/g, "");
        switch (style) {
          case "text-align:left;":
            allign = ":---";
            break;
          case "text-align:right;":
            allign = "---:";
            break;
          case "text-align:center;":
            allign = ":---:";
            break;
        }
      }
      tableArray[0][i] = headContent.trim();
      tableArray[1][i] = allign;
    }
    for (i = 0; i < rows.length; ++i) {
      var r = tableArray.push([]) - 1,
        cols = rows[i].getElementsByTagName("td");
      for (ii = 0; ii < headings.length; ++ii) {
        var cellContent = " ";
        if (typeof cols[ii] !== "undefined") {
          cellContent = showdown.subParser("makeMarkdown.tableCell")(
            cols[ii],
            globals
          );
        }
        tableArray[r].push(cellContent);
      }
    }
    var cellSpacesCount = 3;
    for (i = 0; i < tableArray.length; ++i) {
      for (ii = 0; ii < tableArray[i].length; ++ii) {
        var strLen = tableArray[i][ii].length;
        if (strLen > cellSpacesCount) {
          cellSpacesCount = strLen;
        }
      }
    }
    for (i = 0; i < tableArray.length; ++i) {
      for (ii = 0; ii < tableArray[i].length; ++ii) {
        if (i === 1) {
          if (tableArray[i][ii].slice(-1) === ":") {
            tableArray[i][ii] =
              showdown.helper.padEnd(
                tableArray[i][ii].slice(-1),
                cellSpacesCount - 1,
                "-"
              ) + ":";
          } else {
            tableArray[i][ii] = showdown.helper.padEnd(
              tableArray[i][ii],
              cellSpacesCount,
              "-"
            );
          }
        } else {
          tableArray[i][ii] = showdown.helper.padEnd(
            tableArray[i][ii],
            cellSpacesCount
          );
        }
      }
      txt += "| " + tableArray[i].join(" | ") + " |\n";
    }
    return txt.trim();
  });
  showdown.subParser("makeMarkdown.tableCell", function (node, globals) {
    var txt = "";
    if (!node.hasChildNodes()) {
      return "";
    }
    var children = node.childNodes,
      childrenLength = children.length;
    for (var i = 0; i < childrenLength; ++i) {
      txt += showdown.subParser("makeMarkdown.node")(
        children[i],
        globals,
        true
      );
    }
    return txt.trim();
  });
  showdown.subParser("makeMarkdown.txt", function (node) {
    var txt = node.nodeValue;
    txt = txt.replace(/ +/g, " ");
    txt = txt.replace(/¨NBSP;/g, " ");
    txt = showdown.helper.unescapeHTMLEntities(txt);
    txt = txt.replace(/([*_~|`])/g, "\\$1");
    txt = txt.replace(/^(\s*)>/g, "\\$1>");
    txt = txt.replace(/^#/gm, "\\#");
    txt = txt.replace(/^(\s*)([-=]{3,})(\s*)$/, "$1\\$2$3");
    txt = txt.replace(/^( {0,3}\d+)\./gm, "$1\\.");
    txt = txt.replace(/^( {0,3})([+-])/gm, "$1\\$2");
    txt = txt.replace(/]([\s]*)\(/g, "\\]$1\\(");
    txt = txt.replace(/^ {0,3}\[([\S \t]*?)]:/gm, "\\[$1]:");
    return txt;
  });
  var root = this;
  if (typeof define === "function" && define.amd) {
    define(function () {
      return showdown;
    });
  } else {
    if (typeof module !== "undefined" && module.exports) {
      module.exports = showdown;
    } else {
      root.showdown = showdown;
    }
  }
}.call(this));
if (typeof color1 == "undefined") {
  color1 = "RGBA(255, 125, 73, 0.75)";
}
if (typeof color2 == "undefined") {
  color2 = "#9BCD9B";
}
if (typeof color3 == "undefined") {
  color3 = "white";
}
var css =
  `.shuoshuo_row {
    width: 100%;
    display: flex;
  }
  .child {
    flex: 1;
  }
  #shuoshuo_content {
    padding: 10px;
    /* min-height: 500px; */
  }
  /* shuo */
  body.theme-dark .cbp_tmtimeline::before {
    background: RGBA(255, 255, 255, 0.06);
  }
  ul.cbp_tmtimeline {
    padding: 0;
  }
  .cbp_tmtimeline {
    margin: 30px 0 0 0;
    padding: 0;
    list-style: none;
    display: inline;
    position: relative;
  }
  /* The line */
  .cbp_tmtimeline:before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    background: RGBA(0, 0, 0, 0.02);
    left: 80px;
    margin-left: 10px;
  }
  /* The date/time */
  .cbp_tmtimeline>li .cbp_tmtime {
    display: block;
    /* width: 29%; */
    /* padding-right: 110px;*/
    max-width: 70px;
    position: absolute;
  }
  .cbp_tmtimeline>li .cbp_tmtime span {
    display: block;
    text-align: right;
  }
  .cbp_tmtimeline>li .cbp_tmtime span:first-child {
    font-size: 0.9em;
    color: #bdd0db;
  }
  .cbp_tmtimeline>li .cbp_tmtime span:last-child {
    font-size: 1.2em;
    color: #9BCD9B;
  }
  .cbp_tmtimeline>li:nth-child(odd) .cbp_tmtime span:last-child {
    color: RGBA(255, 125, 73, 0.75);
  }
  div.cbp_tmlabel>p {
    margin-bottom: 0;
  }
  /* Right content */
  div class.cdp_tmlabel>li .cbp_tmlabel {
    margin-bottom: 0;
  }
  .cbp_tmtimeline>li .cbp_tmlabel {
    margin: 0 0 45px 65px;
    background: ${color2};
    color: ${color3};
    padding: .8em 1.2em .4em 1.2em;
    /* font-size: 1.2em; */
    font-weight: 300;
    line-height: 1.4;
    position: relative;
    border-radius: 5px;
    transition: all 0.3s ease 0s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    display: block;
  }
  .cbp_tmlabel:hover {
    /* transform:scale(1.05); */
    transform: translateY(-3px);
    z-index: 1;
    box-shadow: 0 15px 32px rgba(0, 0, 0, 0.15) !important
  }
  .cbp_tmtimeline>li:nth-child(odd) .cbp_tmlabel {
    background: ${color1};
  }
  /* The triangle */
  .cbp_tmtimeline>li .cbp_tmlabel:after {
    right: 100%;
    border: solid transparent;
    content: " ";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;

    border-right-color: ${color2};
    border-width: 10px;
    top: 4px;
  }
  .cbp_tmtimeline>li:nth-child(odd) .cbp_tmlabel:after {
    border-right-color: ${color1};
  }
  p.shuoshuo_time {
    margin-top: 10px;
    border-top: 1px dashed #fff;
    padding-top: 5px;
    font-size: 12px;
  }
  /* Media */
  @media screen and (max-width: 65.375em) {
    .cbp_tmtimeline>li .cbp_tmtime span:last-child {
        font-size: 1.2em;
    }
  }
  .shuoshuo_author_img img {
    border: 1px solid #ddd;
    padding: 2px;
    float: left;
    border-radius: 64px;
    transition: all 1.0s;
  }
  /* end */
  .avatar {
    border-radius: 100% !important;
    -moz-border-radius: 100% !important;
    box-shadow: inset 0 -1px 0 3333sf;
    -webkit-box-shadow: inset 0 -1px 0 3333sf;
    -webkit-transition: 0.4s;
    -webkit-transition: -webkit-transform 0.4s ease-out;
    transition: transform 0.4s ease-out;
    -moz-transition: -moz-transform 0.4s ease-out;
  }
  .avatar:hover {
    -webkit-transform: rotateZ(360deg);
    -moz-transform: rotateZ(360deg);
    -o-transform: rotateZ(360deg);
    -ms-transform: rotateZ(360deg);
    transform: rotateZ(360deg);
  }
  /* content */
  .shuoshuo_text {
    width: 100%;
    height: 130px;
    padding: 8px 16px;
    background-repeat: no-repeat;
    background-position: right;
    outline-style: none;
    border: 1px solid #ccc;
    border-radius: 6px;
    resize: none;
    background-color: transparent;
    color: #999;
  }
  /* password */
  .shuoshuo_inputs {
    outline-style: none;
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 8px 16px;
    width: 100%;
    font-size: 12px;
    background-color: transparent;
    color: #999;
  }
  .button {
    background-color: ${color1};
    /* Green */
    border: none;
    margin-left: 5px;
    color: ${color3};
    padding: 8px 16px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 12px;
    border-radius: 12px;
    /* circle */
    outline: none;
    cursor: pointer;
  }
  .button:hover {
    background-color: ${color2};
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.24),
    0 8px 16px 0 rgba(0, 0, 0, 0.19);
  }
  /* butterfly theme adapter */
  #article-container ul p {
    margin: 0 0 1rem;
  }
  /* version */
  .power {
    text-align: right;
    color: #999;
    font-size: .75em;
    padding: .5em 0;
  }
  .power a {
    font-size: .75em;
    position: relative;
    cursor: pointer;
    color: #1abc9c;
    text-decoration: none;
    display: inline-block;
  }
  /* row */
  .shuoshuo_submit {
    margin: 0 0 1rem;
  }
  .shuoshuo_row .col.col-80 {
    width: 80%;
    float: left;
  }
  .shuoshuo_row .col.col-20 {
    width: 20%;
    float: right;
    text-align: right;
  }
  #preview {
    width: 100%;
    float: left;
    margin: .5rem 0 0;
    padding: 7px;
    box-shadow: 0 0 1px #f0f0f0;
  }
  /* lazyload */
  #lazy {
    background: #ffffff;
    bottom: 0;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 9999;
  }
  @import "compass/css3";
  .preloader {
    position: absolute;
    margin-left: -55px;
    margin-top: -100px;
    height: 110px;
    width: 110px;
    left: 50%;
    top: 50%;
  }
  path {
    stroke: #9ea1a4;
    stroke-width: 0.25;
    fill: #241E20;
  }
  #cloud {
    position: relative;
    z-index: 2;
  }
  #cloud path {
    fill: #efefef;
  }
  #sun {
    margin-left: -10px;
    margin-top: 6px;
    opacity: 0;
    width: 60px;
    height: 60px;
    position: absolute;
    left: 45px;
    top: 15px;
    z-index: 1;
    animation-name: rotate;
    animation-duration: 16000ms;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  }
  #sun path {
    stroke-width: 0.18;
    fill: #9ea1a4;
  }
  @keyframes rotate {
    0% {
        transform: rotateZ(0deg);
    }
    100% {
        transform: rotateZ(360deg);
    }
  }
  /* Rain */
  .rain {
    position: absolute;
    width: 70px;
    height: 70px;
    margin-top: -32px;
    margin-left: 19px;
  }
  .drop {
    opacity: 1;
    background: #9ea1a4;
    display: block;
    float: left;
    width: 3px;
    height: 10px;
    margin-left: 4px;
    border-radius: 0px 0px 6px 6px;
    animation-name: drop;
    animation-duration: 350ms;
    animation-iteration-count: infinite;
  }
  .drop:nth-child(1) {
    animation-delay: -130ms;
  }
  .drop:nth-child(2) {
    animation-delay: -240ms;
  }
  .drop:nth-child(3) {
    animation-delay: -390ms;
  }
  .drop:nth-child(4) {
    animation-delay: -525ms;
  }
  .drop:nth-child(5) {
    animation-delay: -640ms;
  }
  .drop:nth-child(6) {
    animation-delay: -790ms;
  }
  .drop:nth-child(7) {
    animation-delay: -900ms;
  }
  .drop:nth-child(8) {
    animation-delay: -1050ms;
  }
  .drop:nth-child(9) {
    animation-delay: -1130ms;
  }
  .drop:nth-child(10) {
    animation-delay: -1300ms;
  }
  @keyframes drop {
    50% {
        height: 45px;
        opacity: 0;
    }
    51% {
        opacity: 0;
    }
    100% {
        height: 1px;
        opacity: 0;
    }
  }
  .text {
    font-family: Helvetica, "Helvetica Neue", sans-serif;
    letter-spacing: 1px;
    text-align: center;
    margin-left: -43px;
    font-weight: bold;
    margin-top: 20px;
    font-size: 11px;
    color: #a0a0a0;
    width: 200px;
  }
  .shuoshuoimg {
    cursor: pointer;
    transition: all 1s;
  }
  .shuoshuoimg:hover {
    transform: scale(3.5);
  }
  .hide {
    display: none;
  }
  .c1 {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, .5);
    z-index: 2;
  }
  .c2 {
    background-color: white;
    position: fixed;
    width: 400px;
    height: auto;
    top: 50%;
    left: 50%;
    z-index: 3;
    margin-top: -150px;
    margin-left: -200px;
    box-shadow: 0 15px 35px rgba(50, 50, 93, .1), 0 5px 15px rgba(0, 0, 0, .07);
    opacity: 0.85;
    border: 0;
    border-radius: 10px;
  }
  .shuoshuo_input_log {
    outline-style: none;
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 12px;
    background-color: transparent;
    color: #999;
  }
  .delete_right {
    cursor: pointer;
    width: 12px;
    height: 12px;
    position: absolute;
    right: 12px;
  }`;
var style = document.createElement("style");
style.type = "text/css";
style.innerHTML = css;
style.id = "addStyle";
document.getElementsByTagName("HEAD").item(0).appendChild(style);
$("head").append(
  '<script src="https://cdn.jsdelivr.net/gh/AiCyan/jscdn@latest/js/shuoshuo/av-min.js"></script>'
);
$("head").append(
  '<script src="https://cdn.jsdelivr.net/gh/AiCyan/jscdn@latest/js/shuoshuo/os.min.js"></script>'
);
if (typeof placeholder1 == "undefined") {
  placeholder1 = "";
}
if (typeof per == "undefined") {
  per = 5;
}
if (typeof placeholder2 == "undefined") {
  placeholder2 = "头像url";
}
if (typeof bgimg == "undefined") {
  bgimg = "";
}
if (typeof lazy == "undefined") {
  lazy = 1;
}
var upload = "上传ing";
var imgurl = "![](" + upload + ")";
var mimito = "ZmFjZTE3NTljMTMwNzYzNGM1NGJhMTk0Njg1NDA1MDVjODVlNGEwYg==";
var mamato = "Bearer " + window.atob(mimito);

function uploadimg(file) {
  document.getElementById("neirong").value += imgurl;
  var nameofimg = sha1(base64url) + ".png";
  var dir1 = nameofimg.slice(0, 2);
  var dir2 = nameofimg.slice(2, 4);
  var picurl = "https://cdn.jsdelivr.net/gh/Artitalk/Artitalk-img/" + dir1 + "/" + dir2 + "/" + nameofimg;
  var settings = { url: "https://api.github.com/repos/Artitalk/Artitalk-img/contents/" + dir1 + "/" + dir2 + "/" + nameofimg,
      method: "PUT",
      timeout: 0,
      async: true,
      headers: {
        Authorization: mamato,
        "Content-Type": "text/plain",
      },
    data: '{\r\n  "message": "' +
      window.location.host +
      '",\r\n  "content": "' +
      file +
      '"\r\n}',
    error: function (msg) {
      if (msg.statusText == "Unprocessable Entity") {
        x = document.getElementById("neirong").value;
        imgurl = "![](" + picurl + ")";
        document.getElementById("neirong").value = x.replace(
          "![](上传ing)",
          imgurl
        );
        imgurl = "![](" + upload + ")";
      } else {
        x = document.getElementById("neirong").value;
        document.getElementById("neirong").value = x.replace(
          "![](上传ing)",
          "(上传失败,可能是网络原因)"
        );
      }
    },
  };
  $.ajax(settings).done(function (response) {
    x = document.getElementById("neirong").value;
    imgurl = "![](" + picurl + ")";
    document.getElementById("neirong").value = x.replace(
      "![](上传ing)",
      imgurl
    );
    imgurl = "![](" + upload + ")";
  });
}

function writeurl() {
  x = document.getElementById("neirong").value;
  imgurl = "![](" + upload + ")";
  document.getElementById("neirong").value = x.replace("![](上传ing)", imgurl);
  upload = "上传ing";
  imgurl = "![](" + upload + ")";
}

function imgChange(img) {
  const reader = new FileReader();
  reader.onload = function (ev) {
    var imgFile = ev.target.result;
    base64url = imgFile.replace(/(.*)?,/, "");
    console.log(imgFile);
    uploadimg(base64url);
  };
  reader.readAsDataURL(img.files[0]);
}
document.addEventListener("paste", function (event) {
  var items = event.clipboardData && event.clipboardData.items;
  var file = null;
  if (items && items.length) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        file = items[i].getAsFile();
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
          base64url = reader.result.replace(/(.*)?,/, "");
          uploadimg(base64url);
        };
        break;
      }
    }
  }
});
var sting =
  `<div id="main" class="site-main" role="main">
    <div id="shuoshuo_content">
        <div id="ccontent"></div>
    </div>
    <div id="shuoshuo_input" class="shuoshuo_active" style="display: none;">
        <div id="shuoshuo_edit">
            <textarea class="shuoshuo_text" id="neirong" placeholder="${placeholder1}" style="background-image: url('${bgimg}');"></textarea>
        </div>
        <div class="shuoshuo_submit">
            <div class="shuoshuo_row">
                <input title="头像URL(不填则默认框内头像)" class="child shuoshuo_inputs" id="touxiang" value="https://cdn.jsdelivr.net/gh/AiCyan/jscdn@2.7/img/custom/avatar.jpg" placeholder="${placeholder2}">
                <div class="child">
                    <button class="button" onclick="savecontent()" style="float: right;">发布</button>
                    <button class="button" onclick="preview()" style="float: right;">预览</button>
                </div>
            </div>
            <div class="shuoshuo_row">
                <div id="preview"></div>
            </div>
        </div>
    </div>
    <div class="power">
        <div style="font-size: 25px;display: inline; cursor: pointer" onclick="artitalk(); " title="发布说说">✍️</div>
        <div style="font-size: 25px;display: inline; cursor: pointer" onclick="myimg.click()" title="上船图片">🚢</div>
        <div style="font-size: 25px;display: inline; cursor: pointer" onclick="swtichuser()" title="登录">👤</div>
    </div>
  </div>
  <input type="file" id="myimg" onchange="imgChange(this)" style="visibility: hidden;" accept="image/png,image/gif,image/jpeg" />
  <div id="shade" class="c1 hide"></div>
  <div id="modal" class="c2 hide">
      <center>
          <p>用户：<input type="text" class="shuoshuo_input_log" id="username" autocomplete="off" /></p>
          <p>密码：<input type="password" class="shuoshuo_input_log" id="pwd" autocomplete="off" /></p>
          <p>
              <input type="button" value="登录" class="button" onclick="Login();">&nbsp;&nbsp;&nbsp;&nbsp;
              <input type="button" value="取消" class="button" onclick="Hide();">
          </p>
      </center>
      <center>
          <div id="logw"></div>
      </center>
  </div>
  <div id="userinfo" class="c2 hide">
      <center>
          <p>
              <div id="status"></div>
          </p>
          <p>
              <input type="button" class="button" value="确定" onclick="hideuser();">&nbsp;&nbsp;&nbsp;&nbsp;
              <input id="tui" type="button" value="退出登录" class="button" style="display: none;" onclick="Louout();">
          </p>
      </center>
  </div>
  <div id="shanchu" class="c2 hide">
      <center>
          <p>删除成功</p>
          <p>
              <input type="button" class="button" value="确定" onclick="hide3();">
          </p>
      </center>
  </div>
  <div id="shanchur" class="c2 hide">
      <center>
          <p>确定删除本条说说吗？</p>
          <p>
              <div id="delete1"></div>
          </p>
      </center>
  </div>`;
document.getElementById("artitalk").innerHTML = sting;
var lazys =
  `<div class="preloader" style="opacity: 1; ">
    <svg version="1.1" id="sun" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"y="0px" width="10px" height="10px" viewBox="0 0 10 10" enable-background="new 0 0 10 10" xml:space="preserve"style="opacity: 1; margin-left: 0px; margin-top: 0px;">
      <g>
        <path fill="none"d="M6.942,3.876c-0.4-0.692-1.146-1.123-1.946-1.123c-0.392,0-0.779,0.104-1.121,0.301c-1.072,0.619-1.44,1.994-0.821,3.067C3.454,6.815,4.2,7.245,5,7.245c0.392,0,0.779-0.104,1.121-0.301C6.64,6.644,7.013,6.159,7.167,5.581C7.321,5,7.243,4.396,6.942,3.876z M6.88,5.505C6.745,6.007,6.423,6.427,5.973,6.688C5.676,6.858,5.34,6.948,5,6.948c-0.695,0-1.343-0.373-1.69-0.975C2.774,5.043,3.093,3.849,4.024,3.312C4.32,3.14,4.656,3.05,4.996,3.05c0.695,0,1.342,0.374,1.69,0.975C6.946,4.476,7.015,5,6.88,5.505z"></path>
        <path fill="none"d="M8.759,2.828C8.718,2.757,8.626,2.732,8.556,2.774L7.345,3.473c-0.07,0.041-0.094,0.132-0.053,0.202C7.319,3.723,7.368,3.75,7.419,3.75c0.025,0,0.053-0.007,0.074-0.02l1.211-0.699C8.774,2.989,8.8,2.899,8.759,2.828z"></path>
        <path fill="none"d="M1.238,7.171c0.027,0.047,0.077,0.074,0.128,0.074c0.025,0,0.051-0.008,0.074-0.02l1.211-0.699c0.071-0.041,0.095-0.133,0.054-0.203S2.574,6.228,2.503,6.269l-1.21,0.699C1.221,7.009,1.197,7.101,1.238,7.171z"></path>
        <path fill="none"d="M6.396,2.726c0.052,0,0.102-0.026,0.13-0.075l0.349-0.605C6.915,1.976,6.89,1.885,6.819,1.844c-0.07-0.042-0.162-0.017-0.202,0.054L6.269,2.503C6.228,2.574,6.251,2.666,6.322,2.706C6.346,2.719,6.371,2.726,6.396,2.726z"></path>
        <path fill="none"d="M3.472,7.347L3.123,7.952c-0.041,0.07-0.017,0.162,0.054,0.203C3.2,8.169,3.226,8.175,3.25,8.175c0.052,0,0.102-0.027,0.129-0.074l0.349-0.605c0.041-0.07,0.017-0.16-0.054-0.203C3.603,7.251,3.513,7.276,3.472,7.347z"></path>
        <path fill="none"d="M3.601,2.726c0.025,0,0.051-0.007,0.074-0.02C3.746,2.666,3.77,2.574,3.729,2.503l-0.35-0.604C3.338,1.828,3.248,1.804,3.177,1.844C3.106,1.886,3.082,1.976,3.123,2.047l0.35,0.604C3.5,2.7,3.549,2.726,3.601,2.726z"></path>
        <path fill="none"d="M6.321,7.292c-0.07,0.043-0.094,0.133-0.054,0.203l0.351,0.605c0.026,0.047,0.076,0.074,0.127,0.074c0.025,0,0.051-0.006,0.074-0.02c0.072-0.041,0.096-0.133,0.055-0.203l-0.35-0.605C6.483,7.276,6.393,7.253,6.321,7.292z"></path>
        <path fill="none"d="M2.202,5.146c0.082,0,0.149-0.065,0.149-0.147S2.284,4.851,2.202,4.851H1.503c-0.082,0-0.148,0.066-0.148,0.148s0.066,0.147,0.148,0.147H2.202z">
        <path fill="none"d="M8.493,4.851H7.794c-0.082,0-0.148,0.066-0.148,0.148s0.066,0.147,0.148,0.147l0,0h0.699c0.082,0,0.148-0.065,0.148-0.147S8.575,4.851,8.493,4.851L8.493,4.851z"></path>
        <path fill="none"d="M5.146,2.203V0.805c0-0.082-0.066-0.148-0.148-0.148c-0.082,0-0.148,0.066-0.148,0.148v1.398c0,0.082,0.066,0.149,0.148,0.149C5.08,2.352,5.146,2.285,5.146,2.203z"></path>
        <path fill="none"d="M4.85,7.796v1.396c0,0.082,0.066,0.15,0.148,0.15c0.082,0,0.148-0.068,0.148-0.15V7.796c0-0.082-0.066-0.148-0.148-0.148C4.917,7.647,4.85,7.714,4.85,7.796z"></path>
        <path fill="none"d="M2.651,3.473L1.44,2.774C1.369,2.732,1.279,2.757,1.238,2.828C1.197,2.899,1.221,2.989,1.292,3.031l1.21,0.699c0.023,0.013,0.049,0.02,0.074,0.02c0.051,0,0.101-0.026,0.129-0.075C2.747,3.604,2.722,3.514,2.651,3.473z"></path>
        <path fill="none"d="M8.704,6.968L7.493,6.269c-0.07-0.041-0.162-0.016-0.201,0.055c-0.041,0.07-0.018,0.162,0.053,0.203l1.211,0.699c0.023,0.012,0.049,0.02,0.074,0.02c0.051,0,0.102-0.027,0.129-0.074C8.8,7.101,8.776,7.009,8.704,6.968z"</path>
      </g>
    </svg>
    <svg version="1.1" id="cloud" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"x="0px" y="0px" width="110px" height="110px" viewBox="0 0 10 10" enable-background="new 0 0 10 10"xml:space="preserve">
      <path fill="none"d="M8.528,5.624H8.247c-0.085,0-0.156-0.068-0.156-0.154c0-0.694-0.563-1.257-1.257-1.257c-0.098,0-0.197,0.013-0.3,0.038C6.493,4.259,6.45,4.252,6.415,4.229C6.38,4.208,6.356,4.172,6.348,4.131C6.117,3.032,5.135,2.235,4.01,2.235c-1.252,0-2.297,0.979-2.379,2.23c-0.004,0.056-0.039,0.108-0.093,0.13C1.076,4.793,0.776,5.249,0.776,5.752c0,0.693,0.564,1.257,1.257,1.257h6.495c0.383,0,0.695-0.31,0.695-0.692S8.911,5.624,8.528,5.624z"></path>
    </svg>
  <div class="rain">
    <span class="drop"></span>
    <span class="drop"></span>
    <span class="drop"></span>
    <span class="drop"></span>
    <span class="drop"></span>
    <span class="drop"></span>
    <span class="drop"></span>
    <span class="drop"></span>
    <span class="drop"></span>
    <span class="drop"></span>
  </div>
    <div class="text">LOOKING OUTSIDE FOR YOU... ONE SEC</div>
  </div>`;
if (lazy == 0) {
  $("#lazy").remove();
} else {
  document.getElementById("lazy").innerHTML = lazys;
}
var string = '<ul class="cbp_tmtimeline" id="maina" pagesize=' + per + ">";
var pos = "";
var oss = "";
$.ajaxSettings.async = false;
$(document).ready(function () {
  $.getJSON("https://api.ip.sb/geoip?callback=?", function (json) {
    pos += json.city + " " + json.region + " " + json.country;
  });
});
var info = new Browser();
oss = info.os;
if (document.all) {
  window.attachEvent("onload", seecontent());
} else {
  window.addEventListener("load", seecontent(), false);
}

function ok() {
  var cbp_tmtimeline = function ($children, n) {
    var $hiddenChildren = $children.filter(":hidden");
    var cnt = $hiddenChildren.length;
    for (var i = 0; i < n && i < cnt; i++) {
      $hiddenChildren.eq(i).show();
    }
    return cnt - n;
  };
  jQuery.showMore = function (selector) {
    if (selector == undefined) {
      selector = ".cbp_tmtimeline";
    }
    $(selector).each(function () {
      var pagesize = $(this).attr("pagesize") || 10;
      var $children = $(this).children();
      if ($children.length > pagesize) {
        for (var i = pagesize; i < $children.length; i++) {
          $children.eq(i).hide();
        }
        $(`<div class="vpage txt-center" style="display: block; text-align: center;"><button type="button" class="button">加载更多...</button></div><br>`)
          .insertAfter($(this))
          .click(function () {
            if (cbp_tmtimeline($children, pagesize) <= 0) {
              $(this).hide();
              document.getElementById("sa").innerHTML = "<center>已经到底啦~</center>";
            }
          });
      }
    });
  };
}

function p(s) {
  return s < 10 ? "0" + s : s;
}

function preview() {
  var pre = document.getElementById("neirong").value;
  var converter = new showdown.Converter(),
    html = converter.makeHtml(pre);
  document.getElementById("preview").innerHTML = html;
}

function savecontent() {
  var img3;
  var currentUser = AV.User.current();
  if (currentUser) {
    console.log(currentUser.attributes.img);
    img3 = currentUser.attributes.img;
  } else {
    document.getElementById("logw").innerHTML = "<center><pre><code>请先登录</code></pre></center>";
    artitalk();
    return;
  }
  var shuoshuo = document.getElementById("neirong").value;
  var img2 = document.getElementById("touxiang").value;
  if (img2 != "") {
    img3 = img2;
  }
  var converte = new showdown.Converter(),
    html = converte.makeHtml(shuoshuo);
  var currentUser = AV.User.current();
  if (shuoshuo == "") {
    document.getElementById("preview").innerHTML = "<center><pre><code>内容不能为空</code></pre></center>";
    return;
  }
  var TestObject = AV.Object.extend("shuoshuo");
  var testObject = new TestObject();
  testObject.set("content", html);
  testObject.set("postion", pos);
  testObject.set("os", oss);
  testObject.set("imgurl", img3);
  testObject.save().then(function (testObject) {
    location.reload();
  });
}

function seecontent() {
  if (typeof severurl == "undefined") {
    AV.init({
      appId: appID,
      appKey: appKEY,
    });
  } else {
    AV.init({
      appId: appID,
      appKey: appKEY,
      serverURL: severurl,
    });
  }
  var currentUser = AV.User.current();
  if (currentUser) {
    $("#key").fadeOut();
  }
  var query = new AV.Query("shuoshuo");
  query.descending("createdAt");
  query.find().then(function (remarks) {
    remarks.forEach(function (atom) {
      var did = atom.id;
      var uncle = atom.attributes.content;
      var posti = atom.attributes.postion;
      var OS = atom.attributes.os;
      var fake = atom.createdAt;
      var touimg;
      touimg = atom.attributes.imgurl;
      var d = new Date(fake);
      var yincang = 'style="display: none"';
      if (currentUser) {
        yincang = "";
      }
      const resDate =
        d.getFullYear() +
        "-" +
        this.p(d.getMonth() + 1) +
        "-" +
        this.p(d.getDate());
      const resTime =
        this.p(d.getHours()) +
        ":" +
        this.p(d.getMinutes()) +
        ":" +
        this.p(d.getSeconds());
      var li = document.createElement("li");
      var cc =
        `<li>
            <span class="shuoshuo_author_img">
                <img src="${touimg}" class="avatar avatar-48" width="48" height="48">
            </span>
            <span class="cbp_tmlabel">
                <div class="delete_right" title="删除" onclick="shuoshuo_delete('${did}')">🍭</div>
                <p>${uncle}</p>
                <p class="shuoshuo_time">
                    <span style="" title="发送平台">✒️ ${OS} 发送</span>
                    <span style="float:right;" title="发送时间"> ⏱️ ${resDate} ${resTime}</span>
                </p>
            </span>
        </li>`;
      string += cc;
    });
    string += "</ul>";
    document.getElementById("ccontent").innerHTML = string;
    ok();
    $.showMore(".cbp_tmtimeline");
    $("#lazy").fadeOut();
  });
}

function artitalk() {
  var currentUser = AV.User.current();
  if (currentUser) {
    $(".shuoshuo_active").fadeIn();
  } else {
    document.getElementById("logw").innerHTML =
      "<center><pre><code>请先登录</code></pre></center>";
    Show();
  }
}

function Show() {
  document.getElementById("shade").classList.remove("hide");
  document.getElementById("modal").classList.remove("hide");
}

function Hide() {
  document.getElementById("shade").classList.add("hide");
  document.getElementById("modal").classList.add("hide");
}

function Login() {
  var password = document.getElementById("pwd").value;
  var username = document.getElementById("username").value;
  AV.User.logIn(username, password).then(
    function (loginedUser) {
      location.reload();
    },
    function (error) {
      document.getElementById("logw").innerHTML =
        "<center><pre><code>登陆失败，请检查用户名及密码是否正确</code></pre></center>";
    }
  );
}

function hideuser() {
  document.getElementById("shade").classList.add("hide");
  document.getElementById("userinfo").classList.add("hide");
}

function Louout() {
  AV.User.logOut();
  location.reload();
}

function swtichuser() {
  document.getElementById("logw").innerHTML = "";
  document.getElementById("shade").classList.remove("hide");
  var currentUser = AV.User.current();
  if (currentUser) {
    document.getElementById("userinfo").classList.remove("hide");
    document.getElementById("status").innerHTML =
      "已登录:\t" + currentUser.attributes.username;
    $("#tui").show();
  } else {
    document.getElementById("modal").classList.remove("hide");
    Show();
  }
}

function hide3() {
  location.reload();
}

function hide4() {
  document.getElementById("shade").classList.add("hide");
  document.getElementById("shanchur").classList.add("hide");
}

function shuoshuo_delete(id) {
  var currentUser = AV.User.current();
  if (currentUser) {
    document.getElementById("shade").classList.remove("hide");
    document.getElementById("shanchur").classList.remove("hide");
    document.getElementById("delete1").innerHTML =
      '<input type="button" class="button" value="确定" onclick="really_shanchu(\'' +
      id +
      '\')"><input type="button" class="button" value="取消" onclick="hide4()">';
  } else {
    document.getElementById("logw").innerHTML =
      "<center><pre><code>请先登录</code></pre></center>";
    Show();
    return;
  }
}

function really_shanchu(id) {
  hide4();
  const deletes = AV.Object.createWithoutData("shuoshuo", id);
  deletes.destroy().then(
    function (success) {
      document.getElementById("shade").classList.remove("hide");
      document.getElementById("shanchu").classList.remove("hide");
    },
    function (error) {
      alert(error.rawMessage);
    }
  );
}

$("#touxiang").focus(function () {
  if (
    $("#touxiang").val() ==
    "https://cdn.jsdelivr.net/gh/AiCyan/jscdn@2.7/img/custom/avatar.jpg"
  ) {
    $(this).val("");
  }
});
$("#touxiang").blur(function () {
  if ($("#touxiang").val() == "") {
    $(this).val(
      "https://cdn.jsdelivr.net/gh/AiCyan/jscdn@2.7/img/custom/avatar.jpg"
    );
  }
});