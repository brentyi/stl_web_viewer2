/*
 * Helper for viewing STLs, with some additions for returning model volume, dimensions, file size, etc
 * brentyi@berkeley.edu
 */

(() => {
    $(() => {
        // Load and view all STLs
        $('.stlwv2-model').each(function() {
            let $container = $(this);
            let modelUrl = $container.data('model-url');
            STLWebViewer2(modelUrl, $container);
        });

        // Disable fullscreen when the user presses Escape
        $(document).keyup(function(e) {
             if (e.key === "Escape") {
                 $('.stlwv2-model .stlwv2-fullscreen-checkbox').each(function() {
                     $(this).prop("checked") && $(this).prop("checked", false).trigger("change");
                 });
             }
         });
    });

    let viewerCount = 0;
    let STLWebViewer2 = (modelUrl, $container, showBoundingBox, loadedCallback) => {
        // Check for WebGl support
        if (!Detector.webgl) Detector.addGetWebGLMessage();

        // If no container is defined, use body
        if($container == undefined) {
            $container = $('body');
        }

        // Build out viewer DOM elements
        fullscreenCheckboxId = 'stlwv2-fullscreen-checkbox-' + viewerCount;
        $container.append('\
            <input class="stlwv2-fullscreen-checkbox" id="' + fullscreenCheckboxId + '" type="checkbox"></input>\
            <div class="stlwv2-inner">\
                <div class="stlwv2-percent"></div>\
                <label class="stlwv2-hud stlwv2-fullscreen-on" title="Fullscreen" for="' + fullscreenCheckboxId + '">\
                    &#x21F1;</label>\
                <label class="stlwv2-hud stlwv2-fullscreen-off" title="Close" for="' + fullscreenCheckboxId + '">\
                    &times;</label>\
                <a class="stlwv2-hud stlwv2-github-link" target="_blank" href="https://github.com/brentyi/stl_web_viewer2">\
                    STL Web Viewer</a>\
            </div>\
        ');
        let $innerContainer = $container.children('.stlwv2-inner');

        // Fullscreen-mode toggle animations
        let $fullscreenCheckbox = $('#' + fullscreenCheckboxId);
        $fullscreenCheckbox.on("change", (event) => {
            // Location and dimensions of viewer outer container
            let top = $container.position().top - $('html').scrollTop();
            let left = $container.position().left - $('html').scrollLeft();
            let bottom = $(window).height() - (top + $container.innerHeight());
            let width = $container.width();

            // We're storing state in an invisible checkbox; poll the "checked" property
            // to determine if we're going to or from fullscreen mode
            if ($fullscreenCheckbox.prop('checked')) {
                // Seamless position:absolute => position:fixed transition
                // Also fade out a little for dramatic effect
                $innerContainer.css(
                {
                    "top": top + "px",
                    "bottom": bottom + "px",
                    "left": left + "px",
                    "width": width + "px",
                    "position": "fixed",
                    "opacity": "0.5",
                    "z-index": 2000
                });

                // Expand to fill screen :)
                $innerContainer.animate({
                    "top": "0",
                    "bottom": "0",
                    "left": "0",
                    "width": "100%",
                    "opacity": "1"
                }, 300, () => {
                    // ...and fade back in
                    $innerContainer.animate({
                        "opacity": "1"
                    }, 500);
                });
            } else {
                // Fade out a little for dramatic effect
                $innerContainer.css({
                    "opacity": "0.5"
                });

                // Shrink to fill outer container
                $innerContainer.animate({
                    "top": top + "px",
                    "bottom": bottom + "px",
                    "left": left + "px",
                    "width": width + "px"
                }, 300, () => {
                    // Reset all styles
                    // Seamless position:fixed => position:absolute transition
                    $innerContainer.css({
                        "position": "",
                        "top": "",
                        "bottom": "",
                        "left": "",
                        "width": "",
                        "z-index": ""
                    });

                    // ...and fade back in
                    $innerContainer.animate({
                        "opacity": "1"
                    }, 500);
                });
            }
        });

        // Start building our threejs scene
        let scene = new THREE.Scene();

        // Camera
        let camera = new THREE.PerspectiveCamera(40, $innerContainer.width() / $innerContainer.height(), 1, 15000);
        camera.position.set(50, 50, 50);
        let cameraTarget = new THREE.Vector3();

        // Orbit controls
        let controls = new THREE.OrbitControls(camera, $innerContainer.get(0));
        controls.target = cameraTarget;
        controls.addEventListener('change', render);
        controls.enableDamping = true;
        controls.enableKeys = false;
        controls.rotateSpeed = 0.15;
        controls.dampingFactor = 0.125;
        controls.enableZoom = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.25;
        controls.autoRotateDelay = 5000;

        // Lights: hemisphere light attached to the world
        let hemisphereLight = new THREE.HemisphereLight(0x999999, 0x555555);
        scene.add(hemisphereLight);

        // Lights: point light attached to the camera
        let pointLight = new THREE.PointLight( 0xdddddd, 0.75, 0);
        camera.add(pointLight);
        scene.add(camera);

        // Load STL file and add to scene
        let loader = new THREE.STLLoader();
        let fileSize = 0;
        let onProgress = (event) => {
            // Progress callback -- (for % loaded indicator)
            console.log("Loading " + modelUrl + ": " + event.loaded + "/" + event.total);
            fileSize = event.total;
            $innerContainer.children('.stlwv2-percent').text(
                Math.floor(event.loaded / event.total * 100.0) + "%"
            );
        };
        let onLoaded = (geometry) => {
            // Callback for when our mesh has been fully loaded

            // Define (shaded) mesh and add to scene
            let material = new THREE.MeshPhongMaterial({
                color: 0xf7f8ff,
                specular: 0x111111,
                shininess: 0,
                wireframe: false,
                polygonOffset: true,
                polygonOffsetFactor: 1,
                polygonOffsetUnits: 1,
                transparent: true,
                opacity: 0.85
            });

            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, 0, 0);
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            scene.add(mesh);

            // Render model edges
            let edges = new THREE.EdgesGeometry(geometry, 29);
            let line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
                color: 0x666666
            }));
            scene.add(line);

            // Update model bounding box and sphere
            geometry.computeBoundingSphere();
            geometry.computeBoundingBox();
            cameraTarget.copy(geometry.boundingSphere.center);

            // Set light, camera, and orbit control parameters based on model size
            let r = geometry.boundingSphere.radius;
            controls.maxDistance = r * 10;
            pointLight.position.set(0, r, 0);
            camera.position.set(
                r * 1.5 + cameraTarget.x,
                r * 1.5 + cameraTarget.y,
                r * 1.5 + cameraTarget.z
            );

            // Render a bounding box
            if (showBoundingBox) {
                let box = new THREE.BoundingBoxHelper(mesh, 0xff7777);
                scene.add(box);
            }

            // Done!
            $innerContainer.addClass('stlwv2-loaded');
            loadedCallback && loadedCallback({
                volume: calculateVolume(mesh),
                width: Math.abs(mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x),
                height: Math.abs(mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y),
                length: Math.abs(mesh.geometry.boundingBox.max.z - mesh.geometry.boundingBox.min.z),
                fileSize: fileSize
            });
        }
        loader.load(modelUrl, onLoaded, onProgress);

        // Rendering!
        let renderer = new THREE.WebGLRenderer({
            antialias: false
        });
        renderer.setClearColor(0xffffff);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize($innerContainer.width(), $innerContainer.height());
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
        renderer.shadowMap.enabled = true;
        $innerContainer.append(renderer.domElement);

        // Start!
        animate();

        // Animate
        function animate() {
            camera.aspect = $innerContainer.width() / $innerContainer.height();
            camera.updateProjectionMatrix();
            renderer.setSize($innerContainer.width(), $innerContainer.height());

            requestAnimationFrame(animate);
            controls.update();
            render();
        }

        // Render scene
        function render() {
            camera.lookAt(cameraTarget);
            renderer.render(scene, camera);
        }

        // Increment viewerCount
        // This is currently only used for our fullscreen checkbox IDs
        viewerCount++;
    }

    // Helpers for computing object volumes
    function calculateVolume(object){
        let total = 0;

        geometry = new THREE.Geometry().fromBufferGeometry(object.geometry);
        faces = geometry.faces;
        vertices = geometry.vertices;
        for(let i = 0; i < faces.length; i++){
            let Pi = faces[i].a;
            let Qi = faces[i].b;
            let Ri = faces[i].c;

            let P = new THREE.Vector3(vertices[Pi].x, vertices[Pi].y, vertices[Pi].z);
            let Q = new THREE.Vector3(vertices[Qi].x, vertices[Qi].y, vertices[Qi].z);
            let R = new THREE.Vector3(vertices[Ri].x, vertices[Ri].y, vertices[Ri].z);
            total += signedVolumeOfTriangle(P, Q, R);
        }
        return Math.abs(total);
    }

    function signedVolumeOfTriangle(p1, p2, p3) {
        let v321 = p3.x*p2.y*p1.z;
        let v231 = p2.x*p3.y*p1.z;
        let v312 = p3.x*p1.y*p2.z;
        let v132 = p1.x*p3.y*p2.z;
        let v213 = p2.x*p1.y*p3.z;
        let v123 = p1.x*p2.y*p3.z;
        return (-v321 + v231 + v312 - v132 - v213 + v123) / 6.0;
    }

})();
