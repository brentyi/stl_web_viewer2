/*
 * Helper for embedding STL files into webpages!
 * brentyi@berkeley.edu
 */

$(() => {
  // Load and view all STLs
  $(".stlwv2-model").each(function () {
    let $container = $(this);
    let modelUrl = $container.data("model-url");
    new STLWebViewer2(modelUrl, $container);
  });

  // Disable fullscreen when the user presses Escape
  $(document).keyup(function (e) {
    if (e.key === "Escape") {
      $(".stlwv2-model .stlwv2-fullscreen-checkbox").each(function () {
        $(this).prop("checked") &&
          $(this).prop("checked", false).trigger("change");
      });
    }
  });
});

function STLWebViewer2(modelUrl, $container) {
  // Set initial attributes
  this.modelUrl = modelUrl;
  this.$container = $container;

  // Check for WebGl support
  if (!Detector.webgl) {
    Detector.addGetWebGLMessage({ parent: this.$container[0] });
    return;
  }

  // Build out viewer DOM elements
  STLWebViewer2.instanceCount = (STLWebViewer2.instanceCount || 0) + 1;
  let checkboxId =
    "stlwv2-fullscreen-checkbox-" + (STLWebViewer2.instanceCount - 1);
  this.$container.append(
    [
      '<input class="stlwv2-fullscreen-checkbox" id="' +
        checkboxId +
        '" type="checkbox"></input>',
      '<div class="stlwv2-inner">',
      '    <div class="stlwv2-percent"></div>',
      '    <label class="stlwv2-hud stlwv2-fullscreen-on" title="Fullscreen" for="' +
        checkboxId +
        '">',
      "        &#x21F1;</label>",
      '    <label class="stlwv2-hud stlwv2-fullscreen-off" title="Close" for="' +
        checkboxId +
        '">',
      "        &times;</label>",
      '    <a class="stlwv2-hud stlwv2-github-link" target="_blank" href="https://github.com/brentyi/stl_web_viewer2">',
      "        STL Web Viewer</a>",
      "</div>",
    ].join("\n")
  );
  this.$innerContainer = this.$container.children(".stlwv2-inner");

  // Fullscreen-mode toggle logic
  this.$fullscreenCheckbox = $("#" + checkboxId);
  this.$fullscreenCheckbox.on(
    "change",
    this.fullscreenToggleHandler.bind(this)
  );

  // Set up threejs scene, camera, renderer
  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera(
    40,
    this.$innerContainer.width() / this.$innerContainer.height(),
    1,
    15000
  );
  this.cameraTarget = new THREE.Vector3();
  this.renderer = this.makeRenderer((antialias = true));
  this.$innerContainer.append(this.renderer.domElement);

  // Orbit this.controls
  this.controls = new OrbitControls(this.camera, this.$innerContainer.get(0));
  this.controls.target = this.cameraTarget;
  this.controls.enableDamping = true;
  this.controls.enableKeys = false;
  this.controls.rotateSpeed = 0.15;
  this.controls.dampingFactor = 0.125;
  this.controls.enableZoom = true;
  this.controls.autoRotate = true;
  this.controls.autoRotateSpeed = 0.25;
  this.controls.autoRotateDelay = 5000;

  // Lights: hemisphere light attached to the world
  this.hemisphereLight = new THREE.HemisphereLight(0x999999, 0x555555);
  this.scene.add(this.hemisphereLight);

  // Lights: point light attached to the camera
  this.pointLight = new THREE.PointLight(0xdddddd, 0.75, 0);
  this.camera.add(this.pointLight);
  this.scene.add(this.camera);

  // Load STL file and add to scene
  new STLLoader().load(
    this.modelUrl,
    this.stlLoadedCallback.bind(this),
    this.updateProgress.bind(this)
  );
}

// Progress callback -- (for % loaded indicator)
STLWebViewer2.prototype.updateProgress = function (event) {
  console.log(
    "Loading " + this.modelUrl + ": " + event.loaded + "/" + event.total
  );
  this.$innerContainer
    .children(".stlwv2-percent")
    .text(Math.floor((event.loaded / event.total) * 100.0) + "%");
};

// Callback for when our mesh has been fully loaded
STLWebViewer2.prototype.stlLoadedCallback = function (geometry) {
  // Define (shaded) mesh and add to this.scene
  let material = new THREE.MeshPhongMaterial({
    color: 0xf7f8ff,
    specular: 0x111111,
    shininess: 0,
    wireframe: false,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    transparent: true,
    opacity: 0.85,
  });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  this.scene.add(mesh);

  // Add model edges
  let edges = new THREE.EdgesGeometry(geometry, 29);
  let line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({
      color: 0x666666,
    })
  );
  this.scene.add(line);

  // Update model bounding box and sphere
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  this.cameraTarget.copy(geometry.boundingSphere.center);

  // Set light, camera, and orbit control parameters based on model size
  let r = geometry.boundingSphere.radius;
  this.controls.maxDistance = r * 10;
  this.pointLight.position.set(0, r, 0);
  this.camera.position.set(
    r * 1.5 + this.cameraTarget.x,
    r * 1.5 + this.cameraTarget.y,
    r * 1.5 + this.cameraTarget.z
  );

  // Render & animate scene
  this.animate();

  // Update CSS styles
  this.$innerContainer.addClass("stlwv2-loaded");
};

// Helper for animating 3D model, updating controls, etc
STLWebViewer2.prototype.animate = function () {
  // Performance check: disable anti-aliasing if too slow
  this.animateLoops = (this.animateLoops || 0) + 1;
  if (!this.performanceChecked) {
    if (this.animateLoops == 5) {
      this.performanceCheckStartTime = performance.now();
    } else if (this.animateLoops > 5) {
      let delta = performance.now() - this.performanceCheckStartTime;
      // Check framerate after 2 seconds
      if (delta > 2000) {
        let framerate = (1000 * (this.animateLoops - 5)) / delta;
        console.log("Cumulative framerate: " + framerate);
        if (framerate < 30) {
          console.log("Disabling anti-aliasing");
          this.renderer.domElement.remove();
          delete this.renderer;
          this.renderer = this.makeRenderer((antialias = false));
          this.$innerContainer.append(this.renderer.domElement);
        }
        this.performanceChecked = true;
      }
    }
  }

  // Update camera & renderer
  this.camera.aspect =
    this.$innerContainer.width() / this.$innerContainer.height();
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(
    this.$innerContainer.width(),
    this.$innerContainer.height()
  );

  // Render :)
  requestAnimationFrame(this.animate.bind(this));
  this.controls.update();
  this.renderer.render(this.scene, this.camera);
};

// Helper for creating a WebGL renderer
STLWebViewer2.prototype.makeRenderer = function (antialias) {
  let renderer = new THREE.WebGLRenderer({
    antialias: antialias,
  });
  renderer.setClearColor(0xffffff);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;
  return renderer;
};

// Helper for handling fullscreen toggle
// Contains all animation logic, etc
STLWebViewer2.prototype.fullscreenToggleHandler = function () {
  // Location and dimensions of viewer outer container
  let top = this.$container.position().top - ScrollHelpers.top() + 1;
  let left = this.$container.position().left - ScrollHelpers.left() + 1;
  let bottom = $(window).height() - (top + this.$container.innerHeight()) + 1;
  let width = this.$container.width() - 2;

  // We're storing state in an invisible checkbox; poll the 'checked' property
  // to determine if we're going to or from fullscreen mode
  if (this.$fullscreenCheckbox.prop("checked")) {
    // Seamless position:absolute => position:fixed transition
    // Also fade out a little for dramatic effect
    this.$innerContainer.css({
      top: top + "px",
      bottom: bottom + "px",
      left: left + "px",
      width: width + "px",
      position: "fixed",
      opacity: "0.5",
      "z-index": 2000,
    });

    // Expand to fill screen :)
    this.$innerContainer.animate(
      {
        top: "0",
        bottom: "0",
        left: "0",
        width: "100%",
        opacity: "1",
      },
      300,
      () => {
        // ...and fade back in
        this.$innerContainer.animate(
          {
            opacity: "1",
          },
          500
        );
      }
    );
  } else {
    // Fade out a little for dramatic effect
    this.$innerContainer.css({
      opacity: "0.5",
    });

    // Shrink to fill outer container
    this.$innerContainer.animate(
      {
        top: top + "px",
        bottom: bottom + "px",
        left: left + "px",
        width: width + "px",
      },
      300,
      () => {
        // Reset all styles to original values in CSS file
        // Seamless position:fixed => position:absolute transition
        this.$innerContainer.css({
          position: "",
          top: "",
          bottom: "",
          left: "",
          width: "",
          "z-index": "",
        });

        // ...and fade back in
        this.$innerContainer.animate(
          {
            opacity: "1",
          },
          500
        );
      }
    );
  }
};
