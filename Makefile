# Relies on minify: https://www.npmjs.com/package/minify

build-js: scripts/Detector.js
build-js: scripts/OrbitControls.js
build-js: scripts/STLLoader.js
build-js: scripts/STLWebViewer2.js
build-js:
	sed -e 's/latin1/utf8/' $^ | minify --js > build/stlwebviewer2.js

build-css: stylesheets/style.css
build-css:
	sed -e 's/latin1/utf8/' $^ | minify --css > build/stlwebviewer2.css

build: build-css build-js

.DEFAULT_GOAL := build
