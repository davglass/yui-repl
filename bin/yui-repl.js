#!/usr/bin/env node

var net = require('net'),
    util = require('util'),
    replServer = require('repl');

require('colors');


var Y = require('yui3').silent().useSync('yui-base');

Y.toString = function() {
    return 'Dav was here..'
};

var repl = replServer.start('YUI@' + Y.version + '> ');
var ctx = repl.context;
ctx.Y = Y;

repl.defineCommand('clear', {
    help: 'Clear the current Y context',
    action: function() {
        this.outputStream.write('Resetting Y to the default state\n');
        this.bufferedCommand = '';
        this.context.Y = require('yui3').silent().useSync('yui-base');
        this.displayPrompt();
    }
});

var load = function(url) {
    var self = this;
    self.outputStream.write('Fetching URL: '.magenta + url.yellow);
    this.context.Y.load(url, function() {
        self.outputStream.write(' [done]\n'.white);
        self.displayPrompt();
    });
};

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

repl.defineCommand('use', {
    help: 'Comma seperated list of modules to use inside this Y context',
    action: function(l) {
        var args = l.split(',');
        this.outputStream.write('Using modules: '.magenta + l);
        this.context.Y.useSync.apply(this.context.Y, args);
        this.outputStream.write(' [done]\n'.white);
        this.displayPrompt();
    }
});

repl.defineCommand('io', {
    help: 'Make an IO request to the passed URL',
    action: function(url) {
        var self = this,
        Y = this.context.Y;
        self.outputStream.write('Making IO Request: '.magenta + url.yellow);
        Y.use('io', function() {
            Y.io(url, {
                on: {
                    complete: function(id, e) {
                        self.outputStream.write(' [done]\n'.white);
                        var str;
                        try {
                            str = util.inspect(JSON.parse(e.responseText), false, 1, true);
                        } catch (e) {
                            str = e.responseText
                        }
                        self.outputStream.write(str);
                        self.outputStream.write('\n');
                        self.displayPrompt();
                    }
                }
            });
        });
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
                } catch (e) {
                    str = util.inspect(r, false, Infinity, true);
                }
                self.outputStream.write(str);
                self.outputStream.write('\n');
                self.displayPrompt();
            });
        });
    }
});

