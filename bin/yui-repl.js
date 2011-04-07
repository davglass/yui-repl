#!/usr/bin/env node

var net = require('net'),
    util = require('util'),
    cli = require('cli'),
    replServer = require('repl'),
    yrepl = require('../lib/repl');

require('colors');


cli.enable('status', 'help');
cli.parse({
    url: ['u', 'Import document from the url passed', 'url'],
    get: ['g', 'Add this script before starting the repl', 'path'],
    html: ['H', 'Import HTML string', 'string'],
    silent: ['s', 'Silent mode: on or off', 'string', 'on']
});


cli.main(function() {
    var opts = this.options;

    var Y = require('yui3');
    var YUI = Y.YUI;
    if (opts.silent == 'on') {
        Y = Y.silent();
    }
    Y = Y.useSync('yui-base');

    var start = function() {
        if (opts.get) {
            util.print('Fetching script:'.magenta + opts.get.yellow);
            var r = yrepl.startPrompt(Y, YUI);
            r.commands['.get'].action.call(r, opts.get);
        } else {
            yrepl.startPrompt(Y, YUI);
        }
    }
    
    if (opts.html) {
        var html = opts.html;
        util.print('Importing HTML into document'.magenta);
        Y.useSync('node');
        if (html.indexOf('<body') === -1) {
            //No Body, append to body
            Y.one('body').append(html);
        } else if (html.indexOf('<html') > -1) {
            //This is an HTML doc
            Y.one('doc').set('innerHTML', html);
        } else if (html.indexOf('<body') > -1) {
            //Body without HTML
            Y.one('body').set('outerHTML', html);
        }
        util.print(' [done]\n'.white);
        start();
    } else if (opts.url) {
        util.print('Fetching URL: '.magenta, opts.url.yellow);
        Y.useSync('node');
        Y.fetch(opts.url, function() {
            util.print(' [done]\n'.white);
            start();
        });
    } else {
        start();
    }

});
