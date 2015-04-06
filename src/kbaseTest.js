/*jslint browser: true,  todo: true, vars: true, nomen: true */
/*global define */
/**
 * A primitive testing framework for javascript objects.
 * 
 * @module Test
 * 
 * @todo document
 * @todo test the test!
 */


/**
 * 
 * @typedef {TestConfig} 
 * @property {string} expected - The expected result status for the test
 * @property {HTMLElement} container - The DOM node to which the results will 
 * be shown.
 * @property {object} object - the object on which the methods is to be tested.
 * @property {string} method - The name of the method to be tested.
 * @
 * 
 */

define(['underscore', 'q'], function (_, Q) {
    'use strict';
    
    var DOM = Object.create({}, {
        init: {
            value: function (cfg) {
                this.container = cfg.container;
                return this;
            }
        },
        setNodeTree: {
            value: function (tree) {
                this.addNodeTree(this.container, tree);
            }
        },
        addNodeTree: {
            value: function (context, tree) {
                var buildNodes;
                buildNodes = function (parent, nodes) {
                    var i;
                    for (i = 0; i < nodes.length; i += 1) {                        
                        var node = nodes[i];
                        var el;
                        if (node.type === 'text') {
                            el = document.createTextNode(node.data);
                            parent.appendChild(el);
                        } else if (node.type === 'html') {
                            parent.innerHTML = node.data;
                        } else {
                            el = document.createElement(node.tag||'div');
                            el.setAttribute('data-name', node.name);
                            if (node.attribs) {
                                var name;
                                for (name in node.attribs) {
                                    el.setAttribute(name, node.attribs[name]);
                                }
                            }
                            // A shortcut for a simple text node:
                            if (node.text) {
                                node.children = [
                                    {
                                        type: 'text',
                                        data: node.text
                                    }
                                ]
                            }
                            if (node.children) {
                                buildNodes(el, node.children);
                            }
                            parent.appendChild(el);
                        }
                       
                    }
                };
                buildNodes(context, tree);
            }
        },
        findElement: {
            value: function (path) {
                var i, next, name;
                var next = this.container;
                for (i = 0; i < path.length; i += 1) {
                    name = '[data-name="' + path[i] + '"]';
                    next = next.querySelector(name);
                    if (next === null) {
                        return null;
                    }
                }
                return next;
            }
        },
        addText: {
            value: function (path, text) {
                var el = this.findElement(path);
                if (el !== null) {
                    var tn = document.createTextNode(text);
                    el.appendChild(tn);
                }
            }
        },
        addNodes: {
            value: function (path, nodes) {
                var el = this.findElement(path);
                if (el !== null) {
                    this.addNodeTree(el, nodes);
                }
            }
        }
    });
    
    return Object.create({}, {
        /**
         * Initialize the object to a sane state. Serves like a constructor
         * for classic prototype-based composition.
         * 
         * @function init
         * 
         * @param {object} cfg - a configuration object
         * 
         * @returns {object} a reference to the object itself, for chaining.
         */
        init: {
            value: function (cfg) {
                /*var k;
                for (k in cfg) {
                    this[k] = cfg[k];
                }
                if (cfg.type === undefined) {
                    cfg.type = 'method';
                }
                */
                
                this.id = cfg.id;
                this.type = cfg.type || 'method';
                this.name = cfg.name;
                this.description = cfg.description;
                this.expected = cfg.expected;
                this.whenResult = cfg.whenResult;
                

                // this isn't, or should be, used any more.
                this.getResult = cfg.getResult;

                this.testResult = cfg.testResult;
                
                this.container = document.querySelector('[data-test="' + this.id + '"]');
                 this.myDOM = Object.create(DOM).init({container: this.container});
                this.setupDisplay();

                this.tests = cfg.tests;

                // @todo this should be wrapped in an object that is passed to the test method associated with type
                
                this.propertyName = cfg.propertyName;
                this.makeObject = cfg.makeObject;
                this.object = cfg.object;
                this.method = cfg.method;

                return this;
            }
        },
        
        /**
         * Displays the results of an individual test in the container node.
         * It is typically used to display failed tests, but may be used to
         * display any test result.
         * 
         * @function showResult
         * 
         * @param {object} context - a plain object containing properties to be
         * displyed.
         * 
         * @returns {undefined}
         * 
         */
        showError: {
            value: function (context) {
                var m = [
                    {
                        tag: 'table',
                        attribs: {
                            class: 'error'
                        },
                        children: (function () {
                            var table = [
                                ['Type', context.type],
                                ['Test', context.id],
                                ['Description', context.description],
                                ['Subtest', context.subtest],
                                ['Input', context.input],
                                ['Status', context.status],
                                ['Elapsed', context.elapsed],
                                ['Expecting', context.expected],
                                ['Actual', context.actual],
                                ['Message', context.message]
                            ];
                            return table.map(function(row) {
                                return {
                                    tag: 'tr',
                                    children: [
                                        {
                                            tag: 'td', text: row[0]

                                        },
                                        {
                                            tag: 'td', text: row[1]
                                        }
                                    ]
                                }
                            });
                        })()
                    }
                ];
                console.log(this.myDOM.findElement(['layout', 'body', 'results', 'test-'+context.id, 'description', 'error']));
                this.myDOM.addNodes(['layout', 'body', 'results', 'test-'+context.id, 'description', 'error'], m);
            }
        },
        
        
        setupDisplay: {
            value: function () {
                
                var layout = [
                    {
                        tag: 'div',
                        name: 'layout',
                        children: [
                            {
                                tag: 'div',
                                name: 'header',
                                attribs: {
                                    class: 'title',
                                    style: 'font-weight: bold; font-size: 150%;'
                                }
                            },
                            {
                                tag: 'div',
                                name: 'body',
                                children: [
                                    {
                                        tag: 'table',
                                        name: 'results',
                                        attribs: {
                                            class: 'results'
                                        }
                                    }
                                ]
                            },
                            {
                                tag: 'div',
                                name: 'footer'
                            }
                        ]
                    }
                ];
                this.myDOM.setNodeTree(layout);
            }
        },
        showHeader: {
            value: function () {
                this.myDOM.addText(['layout', 'header'], this.name);
            }
        },
        showTestLine: {
            value: function (test) {
                var node = [
                    {
                        tag: 'tr',
                        name: 'test-' + test.id,
                        children: [
                            {
                                tag: 'td',
                                name: 'name',
                                children: [
                                    {
                                        type: 'text',
                                        data: 'Test ' + test.id
                                    }
                                ]
                            },
                            {
                                tag: 'td',
                                name: 'result'                                
                            },
                            {
                                tag: 'td',
                                name: 'description',
                                children: [
                                    {
                                        type: 'html',
                                        data: (function () {
                                            var html;
                                            if (test.description) {
                                                html = test.description;
                                                if (test.shows) {
                                                    html += '<br><i>shows that: ' + test.shows + '</i>';
                                                }
                                            } else {
                                                html = '* no desc *';
                                            }
                                            return html;
                                        }())
                                    },
                                    {
                                        name: 'error'                                        
                                    }
                                ]
                            }
                        ]
                    }
                ];
                this.myDOM.addNodes(['layout', 'body', 'results'], node);
            }
        },
        showTestResult: {
            value: function (test, result) {
                var path = ['layout', 'body', 'results', 'test-'+test.id, 'result'];
                var el = this.myDOM.findElement(path);
                if (el) {
                    el.innerHTML = result;
                    if (result === 'PASS') {
                        el.style.color = 'green';
                    } else {
                        el.style.color = 'red';
                    }
                }
            }
        },
        /**
         * Displays the summary statistics for the test run, appended to the 
         * container node.
         * 
         * @function showFinal
         * 
         * @param {object} context - a simple object containing properties to display.
         * 
         * @returns {undefined}
         */
        showSummary: {
            value: function (context) {
                
                var nodes = [
                    {
                        tag: 'table',
                        attribs: {
                          border: 1, cellpadding: 4, cellspacing: 0  
                        },
                        children: [
                            {
                                tag: 'tr',
                                children: [
                                    {
                                        tag: 'td',
                                        text: context.succeed
                                    },
                                    {
                                        tag: 'td',
                                        text: 'Successes'
                                    }
                                ]
                            },
                            {
                                tag: 'tr',
                                children: [
                                    {
                                        tag: 'td',
                                        text: context.fail
                                    },
                                    {
                                        tag: 'td',
                                        text: 'Fails'
                                    }
                                ]
                            },
                            {
                                tag: 'tr',
                                children: [
                                    {
                                        tag: 'td',
                                        text: context.error
                                    },
                                    {
                                        tag: 'td',
                                        text: 'Errors'
                                    }
                                ]
                            }
                        ]
                    }
                ];
                
                this.myDOM.addNodes(['layout', 'footer'], nodes);               
            }
        },
        /**
         * @typedef {object} MethodTestResult
         * @property {object} output - the result of the output comparison, if any
         * @property {object} mutation - the result of the mutation comparison, if any
         * @property {object} exception - the result of the exception comparison, if any
         * @property {object} error - 
         */

        /**
         * Runs a method test on the output.
         * 
         * @todo convert to setting a success flag, or perhaps we have it right...
         */
        runMethodOutputTest: {
            value: function (test, output) {
                var result = {
                    type: 'output',
                    actual: output
                };
                if (typeof test.expects.output === 'function') {
                    // NB the output function call is invoked with the test 
                    // as the context, so it has access to the object itself,
                    // useful for "this" tests.
                    result.expected = test.expects.output.call(this, test);
                    if (_.isEqual(output, result.expected)) {
                        result.status = 'success';
                        result.message = 'output matches expected';
                    } else {
                        result.status = 'failure';
                        result.message = 'output does not match expected';
                    }                
                } else if (typeof test.expects.output === 'object' && !(test.expects.output instanceof Array)) {
                    // NB the output value can't be simply the object. If an object
                    // it must be wrapped.
                    if (test.expects.output.value) {
                        result.expected = test.expects.output.value;
                        if (_.isEqual(output, test.expects.output.value)) {
                            result.status = 'success';
                            result.message = 'output matches expected';
                        } else {
                            result.status = 'failure';
                            result.message = 'output does not match expected';
                        }
                    } else if (test.expects.output.test) {
                        result.message = test.expects.output.name;
                        if (test.expects.output.test.call({}, output)) {
                            result.status = 'success';
                        } else {
                            result.status = 'failure';
                        }
                    } else {
                        result.status = 'error';
                        result.message = 'test misconfigured -- output object is not a simple object, value, or test';
                    }
                } else {
                    // simple equality test.
                    result.expected = test.expects.output;
                    if (_.isEqual(output, result.expected)) {
                        result.status = 'success';
                        result.message = 'output matches expected';
                    } else {
                        result.status = 'failure';
                        result.message = 'output does not match expected';
                    }
                }
                
                return result;
            }
        },
        runMethodMutationTest: {
            value: function (test) {
                
                var result = {
                    type: 'mutation',
                    expected: test.expects.mutation,
                    // NB freeze the input to protect from further change.
                    actual: test.input
                };
                
                var i;
                var mutated = [];
                var mismatches = [];
                // First see if we have any mutations of input.
                for (i = 0; i < test.input; i += 1) {
                    if (!_.isEqual(test.input[i], test.originalInput[i])) {
                        mutated.push(i);
                    }
                }
                // And if we have any expectation mismatches.
                if (test.expects.mutation) {
                    for (i = 0; i < test.input; i += 1) {
                        if (!_.isEqual(test.input[i], test.expects.mutation[i])) {
                            mismatches.push(i);
                        }
                    }
                }
                // Now the test
                if (mutated.length > 0) {
                    if (test.expects.mutation) {
                        if (mismatches.length === 0) {
                            result.status = 'success';
                            result.message = 'Muatations were found, and matched the expected mutations';
                        } else {
                            result.status = 'failure';
                            result.message = 'Mutations were found, but the expectation did not match';
                        }
                    } else {
                        result.status = 'failure';
                        result.message = 'Mutations were made to the input, but were not expected';
                    }
                } else {
                    if (test.expects.mutation) {
                        if (mismatches.length === 0) {
                            result.status = 'success';
                            result.message = 'No mutations, and the expectation was for no change';
                        } else {
                            result.status = 'failure';
                            result.message = 'No mutations found, but were expected';
                        }
                    } else {
                        result.status = 'success';
                        result.message = 'No mutations found, none expected';
                    }
                }
                return result;
            }
        },
        exceptionMatch: {
            value: function (ex, test) {
                if (typeof ex === 'string') {
                    if  (ex === test) {
                        return true;
                    }
                }
                var type = eval(test.type);
                if (ex instanceof type) {
                    if (ex.message === test.message) {
                        return true;
                    }
                }
                return false;
            }
        },
        runMethodExceptionTest: {
            value: function (test, ex) {
                var result = {
                    type: 'exception',
                    expected: test.expects.exception,
                    actual: ex
                };
                if (ex !== undefined) {
                    if (test.expects.exception) {
                        if (this.exceptionMatch(ex, test.expects.exception)) {
                            result.status = 'success';
                            result.message = 'Exception encountered, and it matches the expectation';
                        } else {
                            result.status = 'failure';
                            result.message = 'Exception encountered, and it fails the expectation';
                        }
                    } else {
                        result.status = 'failure';
                        console.log('EX');
                        console.log(ex);
                        result.message = 'Exception test not supplied, but exception encountered';
                    }
                } else {
                    if (test.expects.exception) {
                        result.status = 'failure';
                        result.message = 'Exception test supplied, but no exception encountered';
                    } else {
                        result.status = 'success';
                        result.message = 'No exception encountered, and non expected';
                    }
                }
                return result;
            }
        },
        
        /**
         * Runs a single test for a method test run.
         * 
         * It compares the result of executing the method with the supplied
         * input arguments to an expected output value.
         * 
         * The method test can look at three different attributes, depending
         * on what the test is after.
         * An output comparison will inspect the output of executing the method
         * with the supplied inputs.
         * A mutation comparison will inspect the state of input arguments after
         * method execution, comparing to mutation values provided.
         * An exception comparison will inspect an exception generated by 
         * executing the method with the provided inputs, comparing it to the
         * provided exception expected value.
         * 
         * Each of these three states is inspected, and the results compared
         * to the supplied expected values.
         * 
         * @function runMethodTest
         * 
         * @param {object} test - a method test specification
         * 
         * @returns {MethodTestResult} the result of the test.
         *
         */
        runMethodTest: {
            value: function (test) {
                // var result = [];
                // TODO: this should be test.input, not test.expects.input
                test.originalInput = JSON.parse(JSON.stringify(test.input));
                //if (!this.testPromise) {
                //    this.testPromise = function (obj, input) {
                //        return Q.Promise(function (resolve) {
                //            resolve(obj[this.method].apply(obj, input));
                //        });
                //    };
                //}
                
                if (!test.object) {
                    throw new Error('Invalid method test - no object');
                }
                if (!test.method) {
                    if (this.method) {
                        test.method = this.method;
                    } else {
                        throw new Error('Invalid method test - no method');
                    }
                }
                
                if (!test.whenResult) {
                    if (this.whenresult) {
                        test.whenResult = this.whenResult;
                    } else {
                        test.whenResult = function (test) {
                            return Q.Promise(function (resolve) {
                                // resolve(test.object[test.method].apply(object, test.input));
                                var method = test.object[test.method];
                                if (method === undefined) {
                                    throw new Error('Method ' + test.method + ' not found on object.');
                                }
                                var result = method.apply(test.object, test.input);
                                resolve(result);
                                // resolve(test.object[test.method](test.input));
                            }.bind(this));
                        }.bind(this);
                    }
                }
                
                return Q.Promise(function (resolve) {
                    var start = new Date();
                    test.whenResult(test)
                        .then(function (output) {
                            var results = [];
                            results.push(this.runMethodOutputTest(test, output));
                            if (!test.ignoreMutation) {
                                // console.log('ignoring mutation test');
                                results.push(this.runMethodMutationTest(test));
                            }
                            test.result.results = results;
                            //console.log('in method test');
                            //console.log(test);
                            var elapsed = (new Date()).getTime() - start.getTime();
                            test.elapsed = elapsed;
                            resolve(test);
                        }.bind(this))
                        .catch(function (err) {
                             //console.log('in method test EX');
                             //console.log(err);
                            test.result.results = [this.runMethodExceptionTest(test, err)];
                            var elapsed = (new Date()).getTime() - start.getTime();
                            test.elapsed = elapsed;
                            resolve(test);
                        }.bind(this))
                        .done();
                }.bind(this));
            }
        },
        /**
         * Returns the object being tested. Used by test methods to avoid 
         * direct references to the test object.
         * 
         * @function getObject
         * 
         * @returns {object} an arbitrary object, the object being tested.
         */
        getObject: {
            value: function () {
                var obj;
                if (this.makeObject) {
                    obj = this.makeObject();
                } else {
                    obj = this.object;
                }
                return obj;
            }
        },
        /**
         * @typedef {object} PropertyTestResult
         * @property {object} comparison - the result of a comparing the given 
         * property to the provided expected property value.
         * @property {object} error - the result of an exception encountered during
         * the execution of the test. Note that this is NOT the same as an 
         * exception anaylsis
         */
        /**
         * Executes a test of the value of a property. This is a simple test,
         * only inspecting the property on an object
         * 
         * @function runPropertyTest
         * 
         * @todo provide a properties test that allows executing of arbitrary code
         * 
         * @params {object} test - a test specification
         * 
         * @returns {PropertyTestResult} the result of the test
         */
        runPropertyComparisonTest: {
            value: function (test, value) {
                var status;
                if (_.isEqual(test.expects.propertyValue, value)) {
                    status = 'success';
                } else {
                    status = 'failure';
                }
                
                return {
                    type: 'property',
                    expected: test.expects.propertyValue,
                    actual: value,
                    status: status
                };
            }
        },
        runPropertyTest: {
            value: function (test) {
                return Q.Promise(function (resolve) {
                    var start = new Date();
                    var actual = this.getObject()[this.propertyName];
                    
                    test.result.results = [this.runPropertyComparisonTest(test, actual)];
                    var elapsed = (new Date()).getTime() - start.getTime();
                    test.elapsed = elapsed;
                    resolve(test);
                }.bind(this));
            }
        },
        runTest: {
            value: function (test) {
                switch (this.type) {
                case 'property':
                    return this.runPropertyTest(test);
                case 'method':
                    return this.runMethodTest(test);
                default:
                    return this.runMethodTest(test);
                }
            }
        },
        runTests: {
            value: function () {
                var testId = 0,
                    summary = {
                        succeed: 0,
                        fail: 0,
                        error: 0,
                        unknown: 0
                    };
                    
                // Show the test header.
                this.showHeader(this.name);
                
                // Set up tests.
                this.tests.forEach(function (test) {
                    testId += 1;
                    test.id = testId;
                    test.result = {
                        id: testId,
                        start: (new Date()),
                        status: 'pending'
                    };
                    test.object = this.getObject();
                    // TODO: exception should be caught here.

                    test.whenTest= this.runTest(test);
                    
                    this.showTestLine(test);
                }.bind(this));
                
                // now run the tests, updating the display for each line.
                Q.allSettled(this.tests.map(function (test) {return test.whenTest;}))
                    .then(function (results) {
                        results.forEach(function (qResult) {
                            var test = qResult.value;
                            // this is a Q thing ... a bit funky if you ask me... eap
                            if (qResult.state === 'fulfilled') {
                                var subtestFail = false;
                                test.result.results.forEach(function (result) {
                                    var expectedStatus = test.expects.status || 'success';
                                    if (expectedStatus !== result.status) {
                                        subtestFail = true;
                                        this.showError({
                                            id: test.id,
                                            // id: this.id,
                                            type: this.type,
                                            tester: this.description,
                                            description: test.description,
                                            shows: test.shows, 
                                            status: result.status,
                                            elapsed: test.elapsed,
                                            input: JSON.stringify(test.input),
                                            expected: JSON.stringify(result.expected),
                                            actual: JSON.stringify(result.actual),
                                            subtest: result.type,
                                            message: 'Expected test result of ' + expectedStatus + ', but got ' + result.status + '. ' + result.message
                                        });
                                    } 
                                }.bind(this));
                                if (subtestFail) {
                                    test.status = 'fail';
                                    this.showTestResult(test, 'fail');
                                    // test.fail += 1;
                                } else {
                                    test.status = 'success';
                                    this.showTestResult(test, 'PASS');
                                    // succeed += 1;
                                }
                            } else {
                                test.status = 'error';
                                this.showError({
                                    id: this.id,
                                    type: this.type,
                                    description: this.description,
                                    shows: this.shows,
                                    status: 'error',
                                    //input: JSON.stringify(test.expects.input),
                                    //expected: JSON.stringify(subtest.expected),
                                    //actual: JSON.stringify(subtest.actual),
                                    // subtest: subtest.type,
                                    message: 'Error thrown running the test: ' + err.message
                                });
                            }
                        }.bind(this));
                        results.forEach(function (result) {
                            if (result.value.status === 'success') {
                                summary.succeed += 1;
                            } else if (result.value.status === 'fail') {
                                summary.fail += 1;
                            } else if (result.value.status === 'error') {
                                summary.error += 1;
                            } else {
                                summary.unknown += 1;
                            }
                        });
                        this.showSummary(summary);
                    }.bind(this))
                    .catch(function (err) {
                       console.log('ERROR'); 
                       console.log(err);
                    })
                    .done();
            }
        }
    });
});

