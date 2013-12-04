# SPIDEY

[![Build Status](https://travis-ci.org/fabiocicerchia/spidey.png)](https://travis-ci.org/fabiocicerchia/spidey)
[![Dependency Status](https://gemnasium.com/fabiocicerchia/spidey.png)](https://gemnasium.com/fabiocicerchia/spidey)
[![Coverage Status](https://coveralls.io/repos/fabiocicerchia/spidey/badge.png)](https://coveralls.io/r/fabiocicerchia/spidey)
[![Code Climate](https://codeclimate.com/github/fabiocicerchia/spidey.png)](https://codeclimate.com/github/fabiocicerchia/spidey)
[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/fabiocicerchia/spidey/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

[![NPM](https://nodei.co/npm/spidey.png?downloads=true&stars=true)](https://nodei.co/npm/spidey/)

[![Spidey - Web Crawler in Node.js to spider dynamically whole websites.](http://jpillora.com/github-twitter-button/img/tweet.png)](https://twitter.com/intent/tweet?text=Spidey+-+Web+Crawler+in+Node.js+to+spider+dynamically+whole+websites.&url=https%3A%2F%2Ffabiocicerchia.github.io%2Fspidey&hashtags=spidey&original_referer=http%3A%2F%2Fgithub.com%2F&tw_p=tweetbutton)

Web Crawler in Node.js to spider dynamically whole websites.

**IMPORTANT: This is a DEVELOPMENT tool, therefore SHOULD NOT be used against a
website you DO NOT OWN!**

It helps you to map / process entire websites, spidering them and parsing each
page in a smart way. It follows all the links and test several times the form
objects. In this way is possible to check effectively the whole website.

## What's this for?

This project was born with the aim of improve the legacy code, but it's not
strictly restricted only to that.

Spidey will crawl every page from an entry-point URL, retrieving all the links
in the page and firing all the events bound to any DOM element in the page in
order to process all the possible combination automatically.
The only "limitation" of an automatic robot is the user input, so for that cases
has been implemented the test case files where it's possible to define custom
input values (e.g.: POST variables for forms, input values for javascript
prompts, etc).

With this in mind the usage of Spidey could be different based on your own
needs, like checking legacy code for dead code or profiling the web app
performance.

Here below few suggestions about its usage:

 * Improve the legacy code
  * Check the dead code (enabling the code coverage server-side)
  * Discover 500 Internal Server Errors
  * Discover notices and warnings
  * SQL profiling
 * Testing
  * Process forms (it'll create easy test cases to be manually compiled)
  * Process automatically JS events attached to DOM nodes
 * Scraping
  * Get the page content for each URL
  * Get the screenshot for each URL
 * Enumeration
  * URLs list
  * Execution times
  * Page output
  * Page load
 * ...

## Features

 * Command Line Interface
 * Catch and handle all the events bound to DOM elements (regardless how they have been set)
 * Follows any 3xx redirect, JS document.location and meta redirect (can be disabled)
 * Ignore duplicated URLs / requests and external URLs
 * HTTP authentication
 * Generate report for each page crawled, with: 6
  * Screenshot
  * HTTP headers
  * HTTP method
  * Data sent (GET and POST)
  * Page output
  * Execution time
  * Console messages
  * Alerts, Confirmations & Prompts
  * Errors
  * List of successful and failed requests
 * Multiple crawlers working asynchronously one URL each one
 * Support for the following HTML tags:
   a, area, base, form, frame, iframe, img, input, link, script
 * URL normalisation
 * Process the web page using PhantomJS
 * Processing the output content only if it's HTML

## Dependencies

Here the list of main dependencies:

 * [Node.js](http://nodejs.org/download/)
 * [PhantomJS](http://phantomjs.org/download.html)
 * [CasperJS](http://casperjs.org/) (optional, only for tests)
 * [Redis](http://redis.io/download)

## Installation

You can install it directly from npm:

```
[user@hostname ~]$ npm install spidey -g
```

or you can download the source code from GitHub and run these commands:

```
[user@hostname ~/spidey]$ npm install
```

## Configuration

Change the file `src/config.js` accordingly to your needs.

## Usage

```
              __     __
.-----.-----.|__|.--|  |.-----.--.--.
|__ --|  _  ||  ||  _  ||  -__|  |  |
|_____|   __||__||_____||_____|___  |
      |__|                    |_____|

SPIDEY v0.2.1

Copyright (C) 2013 Fabio Cicerchia <info@fabiocicerchia.it>

Web Crawler in Node.js to spider dynamically whole websites.
Usage: ./bin/spidey

Options:
  --uri            The URI to be crawled                 [required]
  -u, --username   Username for HTTP authentication
  -p, --password   Password for HTTP authentication
  -d, --details    Store details for each page           [default: false]
  -f, --follow     Follows redirects                     [default: false]
  --disable-stats  Disable anonymous report usage stats  [default: false]
  --help           Show the help
```

## Examples

```
[user@hostname ~]$ spidey --uri "http://www.google.com"
[user@hostname ~]$ spidey --uri "www.google.com"
[user@hostname ~]$ spidey --uri "/tmp/file.html"
[user@hostname ~]$ spidey --uri "file.html"
```

## Tests

```
[user@hostname ~/spidey]$ npm test
```

## How it works

 * Start processing an URL
 * Open a system process to PhantomJS
  * Open the URL
  * If there is a JS event, put it into a dedicate stack
  * Inject custom event listener
    * Override existent event listener
  * Collect all the relevant info from the page for the report
  * On load complete, execute the events in the stack
  * Start to process the web page
  * Get all the links from the page content
  * Normalise and filter by uniqueness all the URLs collected
  * Get all the JS events bound to DOM elements
  * Clone the web page for each new combination in the page (confirm)
  * Put the web page instance in a dedicate stack for each JS event
  * Process the all the web pages in the stack
  * Get all the links from the page content
  * Reiterate until there are no more JS events
 * If there is an error retry up to 5 times
 * Collect all the data sent by the parser
 * Create test cases for POST data with normalised fields
 * Get POST test cases for current URL
 * Launch a new crawler for each test case
 * Store details in report file
 * Increase the counter for possible crawlers to be launched based on the links
 * Check the links if are already been processed
  * If not, launch a new process for each link
 * If there are no more links to be processed, check if there are still sub-crawlers running
  * If not so, terminate the process

## Bugs

For a list of bugs please go to the [GitHub Issue Page](https://github.com/fabiocicerchia/spidey/issues?labels=Bug&page=1&state=open).

## Licence

Copyright (C) 2013 Fabio Cicerchia <info@fabiocicerchia.it>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
