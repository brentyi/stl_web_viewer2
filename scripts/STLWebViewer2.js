/*
 * Helper for viewing STLs, with some additions for returning model volume, dimensions, file size, etc
 * brentyi@berkeley.edu
 */
THREE.STLViewer = function(modelURL, $container, showBoundingBox, loadedCallback) {
    if (!Detector.webgl) Detector.addGetWebGLMessage();
    var camera, controls, cameraTarget, scene, renderer, pointLight;

    if($container == undefined) {
        $container = $('body');
    }

    camera = new THREE.PerspectiveCamera(40, $container.width() / $container.height(), 1, 15000);
    camera.position.set(50, 50, 50);
    cameraTarget = new THREE.Vector3();
    controls = new THREE.OrbitControls(camera, $container.get(0));
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
    scene = new THREE.Scene();

    var loader = new THREE.STLLoader();

    pointLight = new THREE.PointLight( 0xdddddd, 0.75, 0);

    fileSize = 0;

    onProgress = function(event) {
        console.log(event.loaded + "/" + event.total);
        fileSize = event.total;
        $container.children('#percent').text(Math.floor(event.loaded / event.total * 100.0) + "%");
    };

    loader.load(modelURL, function(geometry) {
        var material = new THREE.MeshPhongMaterial({
            color: 0xf7f8ff,
            specular: 0x111111,
            shininess: 0,
            wireframe: false,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
            transparent: true,
            opacity: 0.8
        });

        var mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(0, 0, 0);
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        scene.add(mesh);

        var edges = new THREE.EdgesGeometry(geometry, 29);
        var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: 0x777777
        }));
        scene.add(line);

        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        cameraTarget.copy(geometry.boundingSphere.center);

        var r = geometry.boundingSphere.radius;
        controls.maxDistance = r * 10;

        pointLight.position.set(0, r, 0);
        camera.position.set(
            r * 1.5 + cameraTarget.x,
            r * 1.5 + cameraTarget.y,
            r * 1.5 + cameraTarget.z
        );

        if (showBoundingBox) {
            var box = new THREE.BoundingBoxHelper(mesh, 0xff7777);
            scene.add(box);
        }

        $container.addClass('loaded');
        loadedCallback && loadedCallback({
            volume: calculateVolume(mesh),
            width: Math.abs(mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x),
            height: Math.abs(mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y),
            length: Math.abs(mesh.geometry.boundingBox.max.z - mesh.geometry.boundingBox.min.z),
            fileSize: fileSize
        });
    }, onProgress);

    // Lights
    scene.add(new THREE.HemisphereLight(0x999999, 0x555555));
    camera.add(pointLight);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({
        antialias: false
    });
    renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize($container.width(), $container.height());
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.renderReverseSided = false;
    $container.append(renderer.domElement);

    animate();

    function animate() {
        camera.aspect = $container.width() / $container.height();
        camera.updateProjectionMatrix();
        renderer.setSize($container.width(), $container.height());

        requestAnimationFrame(animate);
        controls.update();
        render();
    }

    function render() {
        camera.lookAt(cameraTarget);
        renderer.render(scene, camera);
    }

    function calculateVolume(object){
        var total = 0;

        geometry = new THREE.Geometry().fromBufferGeometry(object.geometry);
        faces = geometry.faces;
        vertices = geometry.vertices;
        for(var i = 0; i < faces.length; i++){
            var Pi = faces[i].a;
            var Qi = faces[i].b;
            var Ri = faces[i].c;

            var P = new THREE.Vector3(vertices[Pi].x, vertices[Pi].y, vertices[Pi].z);
            var Q = new THREE.Vector3(vertices[Qi].x, vertices[Qi].y, vertices[Qi].z);
            var R = new THREE.Vector3(vertices[Ri].x, vertices[Ri].y, vertices[Ri].z);
            total += signedVolumeOfTriangle(P, Q, R);
        }
        return Math.abs(total);
    }

    function signedVolumeOfTriangle(p1, p2, p3) {
        var v321 = p3.x*p2.y*p1.z;
        var v231 = p2.x*p3.y*p1.z;
        var v312 = p3.x*p1.y*p2.z;
        var v132 = p1.x*p3.y*p2.z;
        var v213 = p2.x*p1.y*p3.z;
        var v123 = p1.x*p2.y*p3.z;
        return (-v321 + v231 + v312 - v132 - v213 + v123) / 6.0;
    }
}
