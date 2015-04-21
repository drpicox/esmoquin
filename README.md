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


See Grutnfile.coffe in this project, it is an example.
