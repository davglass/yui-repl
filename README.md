# YUI REPL

A NodeJS REPL environment preloaded with a Y variable populated by a YUI sandbox.

## Install

    npm install yui-repl

## Usage

    yui3


## Commands

`.import {url}` Import this url into the REPL context and bind Y to the DOM.
<pre class="console">
    .import http://yuilibrary.com/
    .import http://twitter.com/
    .import http://yahoo.com/
</pre>

`.use {modules,to,use}` Modules to load into to the Y context inside the REPL
<pre class="console">
    .use dd
    .use yql,io
    .use jsonp,io
</pre>

`.io {url}` Make an IO request to the passed URL
<pre class="console">
    .io https://graph.facebook.com/davglass
    .io http://yuilibrary.com/gallery/api/show/yql
</pre>

`.yql {sql}` Make an YQL request with the passed SQL statement
<pre class="console">
    .yql select * from weather.forecast where location=90210
    .yql select * from flickr.photos.recent
</pre>

## Screencast

Here is a simple little screencast of it in action: [View Video](http://dl.dropbox.com/u/5669457/YUI3-REPL-2.mov)
