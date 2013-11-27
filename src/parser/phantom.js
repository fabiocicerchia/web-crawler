/**
 *               __     __
 * .-----.-----.|__|.--|  |.-----.--.--.
 * |__ --|  _  ||  ||  _  ||  -__|  |  |
 * |_____|   __||__||_____||_____|___  |
 *       |__|                    |_____|
 *
 * SPIDEY v0.2.1
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

var Parser    = require('../parser'),
    config    = require('../config'),
    fs        = require('fs'),
    system    = require('system'),
    args      = system.args,
    idCrawler = args[1],
    execId    = args[2],
    idRequest = args[3],
    username  = args[4],
    password  = args[5],
    url       = args[6],
    type      = args[7],
    data      = args[8],
    evt       = args[9],
    xPath     = args[10],
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
var PhantomParser = function (page) {
    /**
     * The WebPage element.
     *
     * @property page
     * @type {Object}
     * @default {Object}
     */
    this.page = page;

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
        this.page.settings.resourceTimeout = config.parser.timeout;
        this.page.onResourceTimeout        = this.onResourceTimeout;
        this.page.onError                  = this.onError;
        this.page.onInitialized            = this.onInitialized;
        this.page.onResourceReceived       = this.onResourceReceived;
        this.page.onAlert                  = this.onAlert;
        this.page.onConfirm                = this.onConfirm;
        this.page.onPrompt                 = this.onPrompt;
        this.page.onConsoleMessage         = this.onConsoleMessage;
        this.page.viewportSize             = { width: 1024, height: 800 };
        this.page.settings.userAgent       = 'Spidey/0.2.1 (+http://fabiocicerchia.github.io/spidey)';
    };

    /**
     * Parse the URL as GET request.
     *
     * @method parseGet
     * @return undefined
     */
    this.parseGet = function () {
        this.setUpPage();

        this.page.open(this.url + this.data, this.onOpen);
        this.page.onLoadFinished = this.onLoadFinished;
    };

    /**
     * Parse the URL as POST request.
     *
     * @method parsePost
     * @return undefined
     */
    this.parsePost = function () {
        this.setUpPage();

        this.page.open(this.url, 'post', this.data, this.onOpen);
        this.page.onLoadFinished = this.onLoadFinished;
    };

    /**
     * Fire an event to an object (document, window, ...).
     *
     * @method fireEventObject
     * @return undefined
     */
    this.fireEventObject = function () {
        var obj,
            evt,
            xPath = arguments[0].xPath,
            event = arguments[0].event;

        eval('obj = ' + xPath);
        if (obj !== undefined) {
            evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, false, false, null);
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
        var xPath = arguments[0].xPath,
            event = arguments[0].event,
            element = window.eventContainer.getElementByXpath(xPath),
            evt;

        if (element !== undefined) {
            evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, false, false, null);
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
            currentParser.page.navigationLocked = true;
        }
    };

    /**
     * Callback fired when the page goes on timeout.
     *
     * @method onResourceTimeout
     * @return undefined
     */
    this.onResourceTimeout = function () {
        if (args.join(' ').indexOf('casperjs') === -1) {
            phantom.exit();
        }

        return true;
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
            trace.forEach(function (t) {
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
    this.onInitialized = function () {
        currentParser.page.injectJs('../sha1.js');
        currentParser.page.injectJs('../events.js');
    };

    /**
     * Callback invoked when the a resource requested by the page is received.
     *
     * @method onResourceReceived
     * @param {Object} response The response metadata object
     * @return undefined
     */
    this.onResourceReceived = function (response) {
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
    this.onAlert = function (msg) {
        currentParser.report.alerts.push(msg);
    };

    /**
     * Callback invoked when there is a JavaScript confirm on the web page.
     *
     * @method onConfirm
     * @param {String} msg The string for the message
     * @return undefined
     */
    this.onConfirm = function (msg) {
        currentParser.report.confirms.push(msg);
        // `true` === pressing the "OK" button, `false` === pressing the "Cancel" button
        return true;
    };

    /**
     * Callback invoked when there is a JavaScript prompt on the web page.
     *
     * @method onPrompt
     * @param {String} msg        The string for the message
     * @param {String} defaultVal The default value for the prompt answer
     * @return undefined
     */
    this.onPrompt = function (msg, defaultVal) {
        currentParser.report.prompts.push({msg: msg, defaultVal: defaultVal});
        return defaultVal;
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
    this.onConsoleMessage = function (msg, lineNum, sourceId) {
        currentParser.report.console.push({msg: msg, lineNum: lineNum, sourceId: sourceId});
    };

    /**
     * Callback fired when the page has been loaded properly.
     *
     * @method onLoadFinished
     * @return undefined
     */
    this.onLoadFinished = function () {
        if (currentParser.event !== '' && currentParser.xPath !== '') {
            if (currentParser.xPath[0] !== '/') {
                currentParser.page.evaluate(currentParser.fireEventObject, currentParser);
            } else {
                currentParser.page.evaluate(currentParser.fireEventDOM, currentParser);
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

        currentParser.report.content = currentParser.page.content;

        url = currentParser.page.evaluate(function () {
            return document.location.href;
        });

        fs.makeDirectory(fs.workingDirectory + '/report/' + execId + '/');
        page.render(fs.workingDirectory + '/report/' + execId + '/' + idRequest + '.png');

        links = currentParser.page.evaluate(currentParser.onEvaluate, currentParser.tags);

        links.events = currentParser.page.evaluate(function () {
            return window.eventContainer.getEvents();
        });

        links.a = [].map.call(links.a, function (item) {
            return currentParser.normaliseUrl(item, url);
        }).filter(currentParser.onlyUnique);

        links.link = [].map.call(links.link, function (item) {
            return currentParser.normaliseUrl(item, url);
        }).filter(currentParser.onlyUnique);

        links.script = [].map.call(links.script, function (item) {
            return currentParser.normaliseUrl(item, url);
        }).filter(currentParser.onlyUnique);

        links.form = [].map.call(links.form, function (item) {
            item.action = item.action || url;
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
                a:      [],
                link:   [],
                script: [],
                form:   [],
                events: []
            },
            currentUrl = document.location.href,
            attribute,
            tag,
            tags = arguments[0];

        for (tag in tags) {
            if (tags.hasOwnProperty(tag)) {
                attribute = tags[tag];
                urls[tag] = [].map.call(document.querySelectorAll(tag), function (item) { return item.getAttribute(attribute); });
            }
        }

        urls.form = [].map.call(document.querySelectorAll('form'), function (item) {
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
if (args.join(' ').indexOf('casperjs --cli test') === -1) {
    new PhantomParser(page).parse(url, type, data, evt, xPath);
} else {
    module.exports = PhantomParser;
}