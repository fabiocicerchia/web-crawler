/**
 *               __     __
 * .-----.-----.|__|.--|  |.-----.--.--.
 * |__ --|  _  ||  ||  _  ||  -__|  |  |
 * |_____|   __||__||_____||_____|___  |
 *       |__|                    |_____|
 *
 * SPIDEY v0.1.2
 *
 * Copyright (C) 2013 Fabio Cicerchia <info@fabiocicerchia.it>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var Parser    = require('../../src/parser'),
    config    = require('../../src/config'),
    fs        = require('fs'),
    idCrawler = require('system').args[1],
    execId    = require('system').args[2],
    idRequest = require('system').args[3],
    username  = require('system').args[4],
    password  = require('system').args[5],
    url       = require('system').args[6],
    type      = require('system').args[7],
    data      = require('system').args[8],
    evt       = require('system').args[9],
    xPath     = require('system').args[10],
    page      = require('webpage').create();

if (username !== undefined && password !== undefined) {
    page.customHeaders = {
        'Authorization': 'Basic ' + btoa(username + ':' + password)
    };
}

/**
 * PhantomParser Class.
 *
 * @class PhantomParser
 * @extends Parser
 */
var PhantomParser = function () {
    /**
     * Current instance.
     *
     * @property currentCrawler
     * @type {Object}
     * @default this
     */
    var currentParser = this;

    /**
     * Configure all the callbacks for PhantomJS.
     *
     * @method setUpPage
     * @return undefined
     */
    this.setUpPage = function () {
        page.settings.resourceTimeout = config.parser.timeout;
        page.onResourceTimeout        = this.onResourceTimeout;
        page.onError                  = this.onError;
        page.onInitialized            = this.onInitialized;
        page.onResourceReceived       = this.onResourceReceived;
        page.onAlert                  = this.onAlert;
        page.onConfirm                = this.onConfirm;
        page.onPrompt                 = this.onPrompt;
        page.onConsoleMessage         = this.onConsoleMessage;
    };

    /**
     * Parse the URL as GET request.
     *
     * @method parseGet
     * @return undefined
     */
    this.parseGet = function () {
        this.setUpPage();

        page.open(this.url + this.data, this.onOpen);
        page.onLoadFinished = this.onLoadFinished;
    };

    /**
     * Parse the URL as POST request.
     *
     * @method parsePost
     * @return undefined
     */
    this.parsePost = function () {
        this.setUpPage();

        page.open(this.url, 'post', this.data, this.onOpen);
        page.onLoadFinished = this.onLoadFinished;
    };

    /**
     * Fire an event to an object (document, window, ...).
     *
     * @method fireEventObject
     * @return undefined
     */
    this.fireEventObject = function () {
        var obj,
            evt;

        eval('obj = ' + arguments[0].xPath);
        if (obj !== undefined) {
            evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(arguments[0].event, false, false, null);
            obj.dispatchEvent(evt);
        }
    };

    /**
     * Fire an event to a DOM element.
     *
     * @method fireEventDOM
     * @return undefined
     */
    this.fireEventDOM = function () {
        var element = document.getElementByXpath(arguments[0].xPath),
            evt;

        if (element !== undefined) {
            evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(arguments[0].event, false, false, null);
            element.dispatchEvent(evt);
        }
    };

    /**
     * Callback fired when the page has been opened.
     *
     * @method onOpen
     * @param {String} status The page return status
     * @return undefined
     */
    this.onOpen = function (status) {
        currentParser.report.time.end = Date.now();
        currentParser.report.time.total = currentParser.report.time.end - currentParser.report.time.start;

        if (status === 'success') {
            page.navigationLocked = true;
        }
    };

    /**
     * Callback fired when the page goes on timeout.
     *
     * @method onResourceTimeout
     * @return undefined
     */
    this.onResourceTimeout = function () {
        phantom.exit();
    };

    /**
     * Callback fired when the page has thrown an error.
     *
     * @method onError
     * @param {String} msg   The error message
     * @param {Array}  trace The stack trace
     * @return undefined
     */
    this.onError = function (msg, trace) {
        var msgStack = ['ERROR: ' + msg];

        if (trace && trace.length) {
            msgStack.push('TRACE:');
            trace.forEach(function(t) {
                msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
            });
        }

        currentParser.report.errors.push(msgStack.join('\n'));
    };

    /**
     * Callback invoked after the web page is created but before a URL is
     * loaded.
     *
     * @method onInitialized
     * @return undefined
     */
    this.onInitialized = function() {
        page.injectJs('../sha1.js');
        page.injectJs('../events.js');
    };

    /**
     * Callback invoked when the a resource requested by the page is received.
     *
     * @method onResourceReceived
     * @param {Object} response The response metadata object
     * @return undefined
     */
    this.onResourceReceived = function(response) {
        if (response.stage === 'end') {
            currentParser.report.resources[response.url] = {
                headers: response.headers
            };
        }
    };

    /**
     * Callback invoked when there is a JavaScript alert on the web page.
     *
     * @method onAlert
     * @param {String} msg The string for the message
     * @return undefined
     */
    this.onAlert = function(msg) {
        currentParser.report.alerts.push(msg);
    };

    /**
     * Callback invoked when there is a JavaScript confirm on the web page.
     *
     * @method onConfirm
     * @param {String} msg The string for the message
     * @return undefined
     */
    this.onConfirm = function(msg) {
        currentParser.report.confirms.push(msg);
        // `true` === pressing the "OK" button, `false` === pressing the "Cancel" button
        return true; // TODO: Trying to hit both and parse again the page.
    };

    /**
     * Callback invoked when there is a JavaScript prompt on the web page.
     *
     * @method onPrompt
     * @param {String} msg        The string for the message
     * @param {String} defaultVal The default value for the prompt answer
     * @return undefined
     */
    this.onPrompt = function(msg, defaultVal) {
        currentParser.report.confirms.push({msg: msg, defaultVal: defaultVal});
        return defaultVal; // TODO: Generate a test case for this scenario.
    };

    /**
     * Callback invoked when there is a JavaScript console message on the web
     * page.
     *
     * @method onConsoleMessage
     * @param {String}  msg      The string for the message
     * @param {Integer} lineNum  The line number
     * @param {String}  sourceId The source identifier
     * @return undefined
     */
    this.onConsoleMessage = function(msg, lineNum, sourceId) {
        currentParser.report.console.push({msg: msg, lineNum: lineNum, sourceId: sourceId});
    };

    /**
     * Callback fired when the page has been loaded properly.
     *
     * @method onLoadFinished
     * @return undefined
     */
    this.onLoadFinished = function () {
        if (currentParser.event.toString() !== '' && currentParser.xPath.toString() !== '') {
            if (currentParser.xPath[0] !== '/') {
                page.evaluate(currentParser.fireEventObject, currentParser);
            } else {
                page.evaluate(currentParser.fireEventDOM, currentParser);
            }
        }

        currentParser.parsePage();
    };

    /**
     * Parse the page to get the information needed.
     *
     * @method parsePage
     * @return undefined
     */
    this.parsePage = function () {
        var url, links, response;

        currentParser.report.content = page.content;

        url = page.evaluate(function () {
            return document.location.href;
        });

        fs.makeDirectory(fs.workingDirectory + '/report/' + execId + '/');
        page.render(fs.workingDirectory + '/report/' + execId + '/' + idRequest + '.png');

        links = page.evaluate(currentParser.onEvaluate);

        links.events = page.evaluate(function () {
            return window.eventContainer.getEvents();
        });

        links.anchors = [].map.call(links.anchors, function (item) {
            return currentParser.normaliseUrl(item, url);
        }).filter(currentParser.onlyUnique);

        links.links = [].map.call(links.links, function (item) {
            return currentParser.normaliseUrl(item, url);
        }).filter(currentParser.onlyUnique);

        links.scripts = [].map.call(links.scripts, function (item) {
            return currentParser.normaliseUrl(item, url);
        }).filter(currentParser.onlyUnique);

        links.forms = [].map.call(links.forms, function (item) {
            item.action = currentParser.normaliseUrl(item.action, url);

            if (item.action === undefined) {
                return undefined;
            }

            return item;
        }).filter(currentParser.onlyUnique);

        response = {
            idCrawler: idCrawler,
            links:     links,
            report:    currentParser.report
        };

        console.log('###' + JSON.stringify(response));
        phantom.exit();
    };

    /**
     * Callback fired to evaluate the page content.
     *
     * @method onEvaluate
     * @return {Object} A list of links (anchors, links, scripts and forms).
     */
    this.onEvaluate = function () {
        var urls = {
                anchors: [],
                links: [],
                scripts: [],
                forms: []
            },
            currentUrl = document.location.href;

        urls.anchors = [].map.call(document.querySelectorAll('a'), function (item) {
            return item.getAttribute('href');
        });

        urls.links = [].map.call(document.querySelectorAll('link'), function (item) {
            return item.getAttribute('href');
        });

        urls.scripts = [].map.call(document.querySelectorAll('script'), function (item) {
            return item.getAttribute('src');
        });

        urls.forms = [].map.call(document.querySelectorAll('form'), function (item) {
            var input, select, textarea;

            input = [].map.call(item.getElementsByTagName('input'), function (item) {
                return item.getAttribute('name');
            });

            select = [].map.call(item.getElementsByTagName('select'), function (item) {
                return item.getAttribute('name');
            });

            textarea = [].map.call(item.getElementsByTagName('textarea'), function (item) {
                return item.getAttribute('name');
            });

            return {
                action: item.getAttribute('action') || currentUrl,
                type:   item.getAttribute('method') || 'get',
                fields: input.concat(select).concat(textarea)
            };
        });

        return urls;
    };
};

PhantomParser.prototype = new Parser();
new PhantomParser().parse(url, type, data, evt, xPath);
