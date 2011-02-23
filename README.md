# YUI REPL

A NodeJS REPL environment preloaded with a Y variable populated by a YUI sandbox.

## Install

    npm install yui-repl

## Usage

    yui3


## Commands

`.import {url}` Import this url into the REPL context and bind Y to the DOM.
    .import http://yuilibrary.com/
    .import http://twitter.com/
    .import http://yahoo.com/


`.use {modules,to,use}` Modules to load into to the Y context inside the REPL
    .use dd
    .use yql,io
    .use jsonp,io

`.io {url}` Make an IO request to the passed URL
    .io https://graph.facebook.com/davglass
    .io http://yuilibrary.com/gallery/api/show/yql

`.yql {sql}` Make an YQL request with the passed SQL statement
    .yql select * from weather.forecast where location=90210
    .yql select * from flickr.photos.recent


