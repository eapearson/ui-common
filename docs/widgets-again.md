# Widgets Again

## Author

Erik Pearson
eapearson@lbl.gov

## Goal

Describe the techniques used in the widgets that I, Erik, have been writing the
last couple of months.

## Introduction

When starting to write widgets for the functional site, I faced a quandry -- 
follow the pattern of existing widgets or program Javascript the way I have 
been used to doing. 

## Content


### Locations of major assets:

- /functional-site/js/app.js
- /functional-site/js/require-config.js
- /functional-site/js/controllers.js
- /functional-site/js/directives/*.js
- /functional-site/js/dataview.js
- /functional-site/docs
- /functional-site/src/*.js
- /functional-site/src/widgets/*.js
- /functional-site/src/widgets/{collection}/*.js
- /functional-site/src/widgets/{widget}
- /functional-site/src/widgets/{collection}/{widget}


### RequireJS modules

Widgets are implemented as RequireJS modules. The widget is the sole object returned.
As a consequence, all dependencies are RequireJS modules. For libraries which
are not natively packaged as require modules, wrappers are provided in the
require-config.js file.

Since functional site views are implemented as a collection of angular directives,
the widget invocation is embedded in a directive view. The pattern for widget 
invocation is nearly identical each time:

    .directive('directiveid', function ($rootScope) {
        return {
           link: function (scope, element, attrs) {
              require(['kb.widget.mywidget'], function (Widget) {
                 Object.create(Widget).init({
                    container: $(element)
                 }).start();
              });
           }
        };
    })

where 

- ``directiveid`` is the string identifier for the directive, as used in the angular template
- ``kb.widget.mywidget`` is the requirejs module id for the widget

This code essentially creates, initializes, and starts a widget with a given element
as the attachment point.


### Prototypal definitions and inheritance

Widgets are implemented as an object defined using ``Object.create``. The object
properties are specified as a simple object in which each property is an object
suitable for ``Object.defineProperty``. The Object.create statement has the feel
of __syntax__ but it is really just a specification object with a predefined 
object layout.

For example

    var Greeting = Object.create({}, {
        say: {
            value: function (name) {
                console.log('Hello ' + name);
            }

        }
    });

is the equivalent of

    var Greeting = {
        say: function (name) {
            console.log('Hello ' + name);
        }
    };

This style is a little more verbose, but notice the first arugment to ``Object.create``
which is just a plain object? That is the so-called "prototype" of the new object
you are creating. This is the canonical way to create object inheritance in 
Javascript.

That is pretty cool.

A second advantage of using ``Object.create`` is are the additional features
of the property definition object. A property may be declared to be read-only 
(``writable: false``) to create constants, or a getter and setter may be used
to create well-defined, type-checked, formatted, compound, or whatever other 
transformations you wish to make on a property.

### The base object

A simple widget may be created using a base object of ``{}`` as in the example
above. However, there is quite a bit of power in using a base widget to provide
common, shared behavior. In fact, most of the widgets that I have created do 
use a base widget object (i.e. a prototype). In developing widgets you may come
across two areas of shared functionality. There are behaviors common to all 
widgets, such as rendering lifecycle, state updating, and configuration. This 
is captured in ``src/widgets/kbaseWidgetBase.js`` if you wish to use it.

On the other hand, there are patterns that are more appropriately shared with
the view the widgets are contained in. Widgets that share a view are typcially
stored together in a common directory, which I call the collection. A shared 
base widget may be stored in the collection directory.

For instance, in the ``src/social`` collection, all of the widgets share the 
concept of the subject user and the active user. The subject user is the user
who is being inspected in the browser, the active user is the user doing the
inspecting -- the currently authenticated user. Not all widgets share this 
model, so it does not make sense to place the logic that supports this mode
into a base shared widget.

On the other hand, sometimes functionality that is placed into a collection's 
base widget has broader usage, or the pattern of widget development becomes more
centralized. In this case, it may be more appropriate to create a shared,
yet still domain-specific widget. E.g. perhaps the 
``src/widgets/social/kbaseSocialWidget.js``
would be moved to ``src/kbaseSocialWidget.js``. Since we use RequireJS to manage
dependencies, this would only result in one line of code change, in
``require-config.js``.

### Multiple Inheritance?

Javascript is a lightweight language. It supports object inheritance, as 
outlined above, which can be very useful for supporting DRY. (It can support
other useful object-oriented approaches as well.)

It is easy to see how this can be extended to provide a type of multiple
inheritance. One object might supply methods which support logging, one might
support dialog boxes, another validation. Although JS does not support multiple 
inheritance as used in classical class-oriented programming, in which you might 
add all of these prototypes at the same time,
it does support chaining. 

So you could have a super-widget defined like this:

    var SuperWidget = Object.create(Logger, 
        Object.create(Dialog,
            Object.create(Validation, {
        say: {
            value: function (name) {
                this.log('I am about to say something');
                if (this.validString(name)) {
                    this.showDialog('Hello ' + name);
                }
            }
        }
    });

#### It is cumbersome

This style of object construction is fairly cumbersome,  
at least in ES5 which is what we are using now. For one, There is no explicit support
for prototype chains in object construction. This requires the cumbersome usage
above. However, it would not be hard to create one or more helper functions
to make such constructions more straightforward. 

Perhaps at that point we have gone into the 
language extension business. I am not opposed to that per se, but it does add
an extra layer of complexity and learning, and should be done cautiously. Of 
course, many JS libs have gone down that route already, creating whole 
OO systems on top of JS. My feeling is that these architectures add unnecessary
complexity, and become magic black boxes which are hard to support, train for,
and debug.

Another issue is the lack of direct support for method invocation chaining in 
Javacript. There is no ``super`` in ES5  which can call the same method in an 
object's prototype. (There will be in ES6). This can be implemented without 
too much code, but it does introduce a bit of black-magic javascript.

#### My solution to the lack of ``super``

Although JS does not support multiple-inheritance or interfaces directly, there
are ways of achieving this effect. One technique that I favor is that for any
object designed to be used as a base object, the initialization method is named
OBJECT_init, where OBJECT is the name of the base object. Of course, the 
actual name of the variable that holds the base object is not syntactically 
important or known to javascript as anything special. Yet, practically, we 
use the variable names as the canonical name of the object, and use it in a
all sorts of contexts, such as the file name, require module name, directory 
paths, documentation, etc

The usage of OBJECT_init ensures that the method is available in all descendant 
child objects. However, realistically it is used by the object's direct 
descendent. 

An example would help here

Say we have a base object ``Logger``

    var Logger = Object.create({}, {
        logLevel: {
            set: function (value) {
                this._logLevel = value;
            },
            get: function () {
                return this._logLevel;
            }
        },
        Logger_init: {
            value: function (cfg) {
                if (cfg && cfg.logLevel) {
                    this.logLevel = cfg.logLevel;
                } else {
                    this.logLevel = 0;
                }
                return this;
            }
        },
        log: {
            value: function (level, message) {
                if (level >= this.logLevel) {
                    console.log(level + ':' + message);
                }
            }
        }
    });

We want our Talker object to have logging capability

    var Talker = Object.create(Logger, {
        init: {
            value: function (cfg) {
                this.Logger_init(cfg);
                this.name = cfg.name;
                return this;
            }
        },
        say: {
            value: function (something) {
                this.log(2, 'About to say something');
                console.log(this.name + ' says: ' + something);
            }
        }
    });

What I like about this approach is that the super relationship is very clear, 
that the usage of the init super call is lexically close to the usafe of the 
prototype object in the object construction, and it requires no special support.

The downsides are that it requires a specific naming and argument convention.

### Nunjucks templates




### Shared state


### Postal message bus


### Simple state machine


### Render clock


