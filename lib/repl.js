var replServer = require('repl');
var util = require('util');
var len;
replServer.REPLServer.prototype.displayPrompt = function() {
    var l = this.bufferedCommand.length ? 11 : len;
    this.rli.setPrompt(this.bufferedCommand.length ? '.......... '.yellow : this.prompt, l);
    this.rli.prompt();
};

require('colors');


var jsdom = require('jsdom');

//Turn off all the things we don't want.
jsdom.defaultDocumentFeatures = {
    //Don't bring in outside resources
    FetchExternalResources   : false,
    //Don't process them
    ProcessExternalResources : false,
    //Don't expose Mutation events (for performance)
    MutationEvents           : false,
    //Do not use their implementation of QSA
    QuerySelector            : false
};

var dom = jsdom.defaultLevel;
//Hack in focus and blur methods so they don't fail when a YUI widget calls them
dom.Element.prototype.blur = function() {};
dom.Element.prototype.focus = function() {};


exports.startPrompt = function(Y, YUI) {

    var prompt = 'YUI@' + Y.version + '> ';
    len = prompt.length;
    prompt = 'YUI'.magenta + '@'.white + Y.version.yellow + '> '.white;
    var debug = Y.config.debug;


    var repl = replServer.start(prompt);


    var ctx = repl.context;
    ctx.Y = Y;
    ctx.YUI = YUI;

    var clear = function(write) {
        this.outputStream.write('Resetting Y to the default state'.magenta);
        this.bufferedCommand = '';
        var yui = require('yui');
        var Y = YUI();
        this.context.Y = Y;
        this.context.YUI = yui.YUI;
        this.outputStream.write(' [done]\n'.white);
        if (write !== false) {
            this.displayPrompt();
        }
        delete this.context.result;
    };

    repl.defineCommand('help', {
        help: 'Show help',
        action: function() {
            var self = this,
                max = 0,
                aliases = {};

            Object.keys(this.commands).forEach(function(name) {
                if (name.length > max) {
                    max = name.length;
                }
                var cmd = self.commands[name];
                if (cmd.help && cmd.help.indexOf('Alias') === 0) {
                    var a = cmd.help.replace('Alias for ', '.');
                    if (!aliases[a]) {
                        aliases[a] = [];
                    }
                    aliases[a].push(name);
                }
            });
            Object.keys(this.commands).sort().forEach(function(name) {
                var cmd = self.commands[name],
                    rawName = name;
                if (cmd.help && cmd.help.indexOf('Alias') === 0) {
                    return;
                }
                if (name.length < max) {
                    for (var i = name.length; i < max; i++) {
                        name += ' ';
                    }
                }
                self.outputStream.write(name.bold.yellow + '    ' + (cmd.help || '').white);
                if (aliases[rawName]) {
                    self.outputStream.write((' (aliases: ' + aliases[rawName].join(',') + ')').yellow);
                }
                self.outputStream.write('\n');
            });
            this.displayPrompt();
        }
    });
    

    repl.defineCommand('clear', {
        help: 'Clear the current Y context',
        action: clear
    });

    var loadURL = function(url, Y, cb) {
        Y.use('io-base', function() {
            Y.io(url, {
                on: {
                    complete: function(id, e) {
                        var html = e.responseText;
                        var document = jsdom.jsdom(html);
                        var window = document.createWindow();
                        Y.applyConfig({
                            win: window,
                            doc: document
                        });
                        cb();
                    }
                }
            });
        });
    };

    var load = function(url) {
        var self = this;
        clear.call(this, false);
        self.outputStream.write('Fetching URL: '.magenta + url.yellow);
        loadURL(url, self.context.Y, function() {
            self.outputStream.write(' [done]\n'.white);
            self.displayPrompt();
        });
    };

    repl.defineCommand('debug', {
        help: 'Toggle the YUI debug config option',
        action: function() {
            var d = !debug+'';
            debug = !debug;
            this.outputStream.write('Setting debug on the Y instance to: '.magenta + d.white + '\n');
            this.context.Y.config.debug = debug;
            this.displayPrompt();
        }
    });

    repl.defineCommand('d', {
        help: 'Alias for debug',
        action: function() {
            this.commands['.debug'].action.apply(this, arguments);
        }
    });

    repl.defineCommand('import', {
        help: 'Import a document into this context',
        action: load
    });

    repl.defineCommand('load', {
        help: 'Alias for import',
        action: load
    });

    repl.defineCommand('fetch', {
        help: 'Alias for import',
        action: load
    });

    repl.defineCommand('version', {
        help: 'Show the YUI version',
        action: function() {
            this.outputStream.write('Current YUI Version: '.magenta + this.context.Y.version.yellow + '\n');
            this.displayPrompt();
        }
    });

    var use = function(l) {
        var args = l.split(',');
        this.outputStream.write('Using modules: '.magenta + l);
        this.context.Y.applyConfig({ useSync: true });
        this.context.Y.use.apply(this.context.Y, args);
        this.outputStream.write(' [done]\n'.white);
        this.displayPrompt();
    };

    repl.defineCommand('use', {
        help: 'Comma seperated list of modules to use inside this Y context',
        action: use
    });

    repl.defineCommand('u', {
        help: 'Alias for use',
        action: use
    });

    repl.defineCommand('IO', {
        help: 'Alias for io',
        action: function() {
            this.commands['.io'].action.apply(this, arguments);
        }
    });
    repl.defineCommand('io', {
        help: 'Make an IO request to the passed URL',
        action: function(url) {
            var self = this,
            Y = this.context.Y;
            self.outputStream.write('Making IO Request: '.magenta + url.yellow);
            Y.use('io-base', function() {
                Y.io(url, {
                    on: {
                        complete: function(id, e) {
                            self.outputStream.write(' [done]\n'.white);
                            var ct = e.headers['content-type'];
                            if (ct) {
                                ct = 'Content-Type: "' + ct.green + '"';
                            } else {
                                ct = '';
                            }
                            self.outputStream.write(' (' + (e.status + '').green + ' ' + e.statusText + '): ' + ct + '\n\n'.white);
                            var str;
                            try {
                                var data = JSON.parse(e.responseText);
                                self.context.result = data;
                                str = util.inspect(data, false, Infinity, true);
                            } catch (e) {
                                str = e.responseText;
                                self.context.result = str;
                            }
                            if (str) {
                                self.outputStream.write(str);
                            }
                            self.outputStream.write('\n\n');
                            self.displayPrompt();
                        }
                    }
                });
            });
        }
    });

    repl.defineCommand('headers', {
        help: 'Make an IO request to the passed URL and only return the headers',
        action: function(url) {
            var self = this,
            Y = this.context.Y;
            self.outputStream.write('Making IO Request: '.magenta + url.yellow);
            Y.use('io-base', function() {
                Y.io(url, {
                    on: {
                        complete: function(id, e) {
                            self.outputStream.write(' [done]\n'.white);
                            var ct = e.headers['content-type'];
                            if (ct) {
                                ct = 'Content-Type: "' + ct.green + '"';
                            } else {
                                ct = '';
                            }
                            self.outputStream.write(' (' + (e.status + '').green + ' ' + e.statusText + '): ' + ct + '\n\n'.white);
                            var str = util.inspect(e.headers, false, Infinity, true);
                            self.context.result = e.headers;
                            self.outputStream.write(str);
                            self.outputStream.write('\n\n');
                            self.displayPrompt();
                        }
                    }
                });
            });
        }
    });

    repl.defineCommand('YQL', {
        help: 'Alias for yql',
        action: function() {
            this.commands['.yql'].action.apply(this, arguments);
        }
    });

    repl.defineCommand('yql', {
        help: 'Make an YQL request with the passed SQL statement',
        action: function(sql) {
            var self = this,
                Y = this.context.Y;

            self.outputStream.write('Making YQL Request: '.magenta + sql.yellow);
            Y.use('yql', function() {
                Y.YQL(sql, function(r) {
                    self.outputStream.write(' [done]\n'.white);
                    var str;
                    try {
                        str = util.inspect(r.query.results, false, Infinity, true);
                        self.context.result = r.query.results;
                    } catch (e) {
                        str = util.inspect(r, false, Infinity, true);
                    }
                    self.outputStream.write(str);
                    self.outputStream.write('\n\n');
                    self.displayPrompt();
                });
            });
        }
    });

    repl.defineCommand('get', {
        help: 'Get a remote/local script and eval it into this context',
        action: function(url) {
            var self = this,
                Y = this.context.Y;

            self.outputStream.write('Fetching Script: '.magenta + url.yellow);
            Y.Get.script(url, {
                onSuccess: function() {
                    self.outputStream.write(' [done]\n'.white);
                    self.displayPrompt();
                }
            });
        }
    });

    return repl;
};

