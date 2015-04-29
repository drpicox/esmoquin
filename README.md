# esmoquin
A (grunt) connect middleware to test local SPAs in remote Servers.

This middleware has the objective to mock a real production web.

Usually, when we are developing SPAs or Javascript applications, we need to run it in clones of production environments just to know that everything goes well. That is PHP servers, JSP servers, ... But usually those environments are too heavy (databases, tools, ...) and do not serve to any purpose more than a place to load and make API calls correctly. During a while, mocking those API calls is enough, but sooner or later real API calls have to be tested.

The idea of this middleware is to:

- act as proxy of another website, for example, your preproduction environment
 
- replace files for your local files, for example, replace SPA javascript for your local files

- mock API calls with your custom data or real data

- I expect that sooner it will include livereload (even in proxied HTML docs), and also add multiple `<script>` tags instead a big script file so we can debug all local files.


How to start
------------

Install `esmoquin` node module:

```bash
$ npm i --save-dev esmoquin
```

Create a esmoquin instance:

```javascript
var Esmoquin = require('esmoquin').Esmoquin;
var esmoquin = new Esmoquin();
// here configure your esmoquin instance
```

Add your esmoquin instance middleware to your connect options configuration:

```javascript
grunt.config({

    //...

    connect: {
        options: {
            // ...
            middleware: esmoquin.middleware,
        },
        // ...
    },
});
```

Or add it inside your middlewares array:

```javascript
grunt.config({

    //...

    connect: {
        options: {
            // ...
            middleware: [
                // ...
                middlewares.unshift(esmoquin.middleware);
            ],
        },
        // ...
    },
});
```

Or add it as one middleware more:

```javascript
grunt.config({

    //...

    connect: {
        options: {
            // ...
            middleware: function(connect,options,middlewares) {
                // ...
                middlewares.unshift(esmoquin.middleware);
                return middlewares;
            },
        },
        // ...
    },
});
```


See [Gruntfile.coffe](Gruntfile.coffee) in this project, it is an example.




Examples
--------

### Open all .md files from a remote host.

The idea of this example is to retrieve resources only available in other application contexts in your server and test your app before deployment.

```javascript
esmoquin.minimatch '**/*.md', Esmoquin.proxy host:'your-host.com'
```


### Proxy everything but Javascripts

The idea of this example is to test/debug a production deployment but with the last version of Javascript without deployment.

```javascript
esmoquin.minimatch '**/*.md', Esmoquin.local path: '/app/<%= params.path %>'
esmoquin.always Esmoquin.proxy host:'ej.mbfrs.com'
```

