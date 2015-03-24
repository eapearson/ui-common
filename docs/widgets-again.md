# Widgets Again

## Author

Erik Pearson
eapearson@lbl.gov

## Goal

Describe the techniques used in the widgets that I, Erik, have been writing the last couple of months.

## Introduction

When starting to write widgets for the functional site, I faced a quandry -- follow the pattern of existing widgets or program Javascript the way I have been used to doing. 

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

Widgets are implemented as RequireJS modules. The widget is the sole object returned. As a consequence, all dependencies are RequireJS modules. For libraries which are not natively packaged as require modules, wrappers are provided in the require-config.js file.

Since functional site views are implemented as a collection of angular directives, the widget invocation is embedded in a directive view. The pattern for widget  invocation is nearly identical each time:

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

This code essentially creates, initializes, and starts a widget with a given element as the attachment point.

### Prototypal definitions and inheritance

Widgets are implemented as an object defined using ``Object.create``. The object properties are specified as a simple object in which each property is an object suitable for ``Object.defineProperty``. The Object.create statement has the feelof __syntax__ but it is really just a specification object with a predefined object layout.

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

This style is a little more verbose, but notice the first arugment to ``Object.create`` which is just a plain object? That is the so-called "prototype" of the new object you are creating. This is the canonical way to create object inheritance in  Javascript.

That is pretty cool.

A second advantage of using ``Object.create`` is are the additional features of the property definition object. A property may be declared to be read-only (``writable: false``) to create constants, or a getter and setter may be used to create well-defined, type-checked, formatted, compound, or whatever other transformations you wish to make on a property.

### The base object

A simple widget may be created using a base object of ``{}`` as in the example above. However, there is quite a bit of power in using a base widget to provide common, shared behavior. In fact, most of the widgets that I have created do use a base widget object (i.e. a prototype). In developing widgets you may come across two areas of shared functionality. There are behaviors common to all widgets, such as rendering lifecycle, state updating, and configuration. This is captured in ``src/widgets/kbaseWidgetBase.js`` if you wish to use it.

On the other hand, there are patterns that are more appropriately shared with the view the widgets are contained in. Widgets that share a view are typically stored together in a common directory, which I call the collection. A shared base widget may be stored in the collection directory.

For instance, in the ``src/social`` collection, all of the widgets share the  concept of the subject user and the active user. The subject user is the user who is being inspected in the browser, the active user is the user doing the inspecting -- the currently authenticated user. Not all widgets share this model, so it does not make sense to place the logic that supports this mode into a base shared widget.

On the other hand, sometimes functionality that is placed into a collection's base widget has broader usage, or the pattern of widget development becomes more centralized. In this case, it may be more appropriate to create a shared, yet still domain-specific widget. E.g. perhaps the ``src/widgets/social/kbaseSocialWidget.js`` would be moved to ``src/kbaseSocialWidget.js``. Since we use RequireJS to manage dependencies, this would only result in one line of code change, in ``require-config.js``.

### Multiple Inheritance?

Javascript is a lightweight language. It supports object inheritance, as outlined above, which can be very useful for supporting DRY. (It can support other useful object-oriented approaches as well.)

It is easy to see how this can be extended to provide a type of multiple inheritance. One object might supply methods which support logging, one might support dialog boxes, another validation. Although JS does not support multiple inheritance as used in classical class-oriented programming, in which you might add all of these prototypes at the same time, it does support chaining. 

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

This style of object construction is fairly cumbersome, at least in ES5 which is what we are using now. For one, There is no explicit support for prototype chains in object construction. This requires the cumbersome usage above. However, it would not be hard to create one or more helper functions to make such constructions more straightforward. 

Perhaps at that point we have gone into the language extension business. I am not opposed to that per se, but it does add an extra layer of complexity and learning, and should be done cautiously. Of course, many JS libs have gone down that route already, creating whole OO systems on top of JS. My feeling is that these architectures add unnecessary complexity, and become magic black boxes which are hard to support, train for, and debug.

Another issue is the lack of direct support for method invocation chaining in Javacript. There is no ``super`` in ES5  which can call the same method in an object's prototype. (There will be in ES6). This can be implemented without too much code, but it does introduce a bit of black-magic javascript.

#### My solution to the lack of ``super``

Although JS does not support multiple-inheritance or interfaces directly, there are ways of achieving this effect. One technique that I favor is that for any object designed to be used as a base object, the initialization method is namedOBJECT_init, where OBJECT is the name of the base object. Of course, the actual name of the variable that holds the base object is not syntactically important or known to javascript as anything special. Yet, practically, we use the variable names as the canonical name of the object, and use it in a all sorts of contexts, such as the file name, require module name, directory paths, documentation, etc

The usage of OBJECT_init ensures that the method is available in all descendant child objects. However, realistically it is used by the object's direct descendent. 

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

What I like about this approach is that the super relationship is very clear, that the usage of the init super call is lexically close to the usafe of the prototype object in the object construction, and it requires no special support.

The downsides are that it requires a specific naming and argument convention.

### Nunjucks templates

When I started widget work at KBase, I found that widget layout and markup was embedded directly in Javascript as concatenated strings. This made editing and visualizing markup very difficult. One of the first things I did was to move all large swathes of markup into external files. I have a lot of experience with simple templating languages, like c-template, Mustache, Handlebars, and others. I felt that the simpler markup lanauges, like c-template, Mustache, Handlebars, and others. I felt that the simpler templating languages would be less suitable for KBase, due to the heavyweight developer presence. After investigating currently popular libraries, I settled on Nunjucks, an implentation of Jinja2, a Python templating langauge, in Javascript. I also found that KBase is using Jinja2 in some of the back end code for the Narrative.

Nunjucks works like most templating languages. Given a template, a data object, and some transformation functions, HTML is rendered. In the widget this final product HTML is inserted into the DOM. Most widgets have a set of templates following this pattern:

- A layout widget is used to create a bootstrap panel. It sets up three primary placeholder or mounting divs - title, messages, and body.
- The widget populates the title with code.
- The widget sets and renders any messages that are generated (e.g. warnings)
- The widget generates state, and renders the body with the template which is given the state.
- Some widgets have an "authenticated" and "unauthenticated" template, to be displayed in each of those major stats. Other widgets may have a variety of body templates which are selected based on different conditions (of state or parameter).
- The widget has an error template which is rendered in case an error is encountered.

Templates are stored in the templates directory within the widget home directory. For example

    src/widgets/dashboard/NarrativeWidget/templates

### Shared state

One common issue across widgets and the functional site in general is that of shared state. 

At the application level, across all views and widgets, we have shared state for

- Session
- User Profile
- Configuration

Many if not all widgets need access to this state.

And within each view there is also a need for state shared between widgets. For instance, on the dashboard the "Owned Narrative" widget generates a total count of widgets. The metrics widget also needs this information. Having state shared at the view level means that the metrics and narrative widget can share the same view of this state.

In some cases the need for shared state is a performance issue. In the case of the dashboard widget, it is quite time-consuming (in terms of wall time that the user experiences as a pause in the browser) to query the workspace for narratives. It can save save several seconds at times for the metrics widget to share in the summary stats generated by the narrative widgets.

In other cases, though, the need for shared state is essential function. In order for widgets to have a consistent approach to authentication, shared Session state comes to the rescue. 

Shared state is provided in the form of the "StateMachine" object. This object is essentially a data store which stores data objects on properties. It provides hooks for actions performed on state properties, allowing widgets and other code to register callbacks for state updates. An important feature is that handlers can be registered before a property is set for the first time, allowing asynchronously loaded modules to share state which is also asynchronously loaded. (That was the reason for the invention of this object, actually.)

### Postal message bus

Early in my widget work, it was evident that there was a need for emitting and listening for application-wide events. The most prominent of these is the login and logout event. In one use-case, the user clicks the log-out button, which cases the login widget to remove authentication for the application, and should also notify all running widgets about the change in authentication state. 

It ends up that there was an event notification system in place at the time. It was the default one provided by jquery. However, it was modeled after DOM events, so it's use was both awkward and also limited to jquery plugins (or other code which explicity hooked into it but was otherwise not DOM-related).

Again, I explored this domain space and, while not being exhaustive by any means, found a suitable library in Postal. Postal describes itself as a "message bus". It primary works in pub-sub mode. It provides a useful model of partitioning messages into channels. A message with a given name is sent with data onto a channel with a given name. At the same time, subscriptions can be made to a message with the same name on the same channel. There are accommodations for spying on messages, for namespacing messages and listening to subsets of them.

I have found that not many messages are required to implement the important functions.

DESCRIBE THEM HERE??

### Render clock

Another issue is that of keeping displays consistent with the state of the app. With the usage of shared state and the message bus, we can ensure that widgets have access to important aspects of the application as well as their own application domain. However, this can also result in many state updates. If each of these results in a refresh of the widget, the application will become very sluggish and may flash updates too frequently.

Combine this with the templating system, which will force a re-render of a widget when the widget is refreshed, and we need to develop a more performant approach than render-on-demand.

The approach I chose was an internal state machine for each widget combined with a render clock. Here is how it works:

- a widget is free to update state at any time, using the state mutation api built into the widget. the widget should not worry about the effect of this on rendering.
- a status flag is present on each widget. it is set to 'dirty' upon any state update, and 'clean' upon rendering.
- a render clock issues clock events through the message bus at certain intervals. At present there are two clock events. The heartbeat is every 1/10 second, and is intended for widgets to render themselves if their dirty flag is set. The refreshbeath is every 60 seconds, and is intended for widgets to update their state from remote sources if they wish to.
- in reality a widget may maintain an internal count based on the heartbeat and conduct a remote-sync operation at whatever interval is best.

This approach allows part of a widget, the state-related aspect, to focus solely on state maintenance, and the visual aspect, the renderer, to focus on rendering.

### Any eye toward the future of widgets

During my exploration of techniques to aid in the construction of performant and responsive widgets, it was clear that there are excellent extant solutions. There simply was not time enough to study them, nor did I feel it appropriate to foist them onto the project without group participation.

One solution is React, from Facebook. It actually represents a family of solutions formed around using a "shadow dom" and "dom diff" to facilitate very efficient yet quite abstract DOM updates. React adds to this a domain specific language (DSL) dubbed JSX, which allows the embedding of HTML-like constructs into Javascript. 
