# Relies on minify: https://www.npmjs.com/package/minify

# Scripts to help sed wrap our javascript in an anonymous function
# Helps with namespacing + minification
SED_JS_PREFIX = '1i(() => {'
SED_JS_SUFFIX = '$$a})();'

# Javscript build rule
# > This concatenates + wraps all matching JS files and minifies
build-js: scripts/*.js
build-js:
	sed -e $(SED_JS_PREFIX) -e $(SED_JS_SUFFIX) $^ \
		| minify --js \
		> build/stlwebviewer2.js

# CSS build rule
# > This simply concatenates all matching CSS files and minifies
build-css: stylesheets/*.css
build-css:
	cat $^ \
		| minify --css \
		> build/stlwebviewer2.css

build: build-css build-js
.DEFAULT_GOAL := build
