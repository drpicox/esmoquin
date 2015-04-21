# Grunt Example file
Esmoquin = require('./lib/esmoquin.js').Esmoquin;

esmoquin = new Esmoquin()
esmoquin.when '/hola', Esmoquin.data 'hola todos'
esmoquin.when '/grunt', Esmoquin.local path: '/Gruntfile.coffee'
esmoquin.when '/local/:path*', Esmoquin.local path: '/<%= params.path %>'
esmoquin.always Esmoquin.proxy host:'ej.mbfrs.com'


module.exports = (grunt) ->

	grunt.initConfig
		pkg: grunt.file.readJSON 'package.json'

		connect:
			example: options:
				hostname: '0.0.0.0'
				port: 8080
				livereload: 18080
				keepalive: true
				open: 'http://localhost:8080'
				middleware: esmoquin.middleware


	grunt.loadNpmTasks 'grunt-contrib-connect'
	grunt.registerTask 'default', ['connect']
