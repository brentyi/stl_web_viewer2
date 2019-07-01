build/stlwebviewer2.js: scripts/Detector.js
build/stlwebviewer2.js: scripts/OrbitControls.js
build/stlwebviewer2.js: scripts/STLLoader.js
build/stlwebviewer2.js: scripts/STLWebViewer2.js
build/stlwebviewer2.js:
	sed -e 's/latin1/utf8/' $^ > $@
