(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/constants.js
  var Opponent = {
    CUBE: 0,
    SNAKE: 1
  };
  var Difficulty = {
    TUTORIAL: -1,
    EASY: 0,
    NORMAL: 1,
    HARD: 2
  };
  var DifficultyNames = {
    [Difficulty.TUTORIAL]: "Tutorial",
    [Difficulty.EASY]: "Easy",
    [Difficulty.NORMAL]: "Normal",
    [Difficulty.HARD]: "Hard"
  };
  var GameState = {
    IDLE: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3,
    GAME_CLEAR: 4
  };
  var FIELD_RADIUS = 50;
  var MIN_DAMAGE_IMPACT_SPEED = 3;

  // src/core/renderer.js
  var renderer = null;
  var scene = null;
  var camera = null;
  var ballLight = null;
  var neonLight1 = null;
  var neonLight2 = null;
  var resizeListenerRegistered = false;
  var cubeColor = 4491519;
  function initRenderer() {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.body.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(657950);
    scene.fog = new THREE.FogExp2(657950, 0.018);
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 0, 0);
    createGround();
    createLights();
    createStars();
    if (!resizeListenerRegistered) {
      window.addEventListener("resize", onWindowResize);
      resizeListenerRegistered = true;
    }
  }
  function createGround() {
    const groundGroup = new THREE.Group();
    scene.add(groundGroup);
    const groundGeometry = new THREE.CircleGeometry(FIELD_RADIUS, 128);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 1056056,
      side: THREE.DoubleSide
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    groundGroup.add(groundMesh);
    const polarGrid = new THREE.PolarGridHelper(
      FIELD_RADIUS,
      24,
      10,
      128,
      3562380,
      2242645
    );
    polarGrid.position.y = 0.02;
    groundGroup.add(polarGrid);
    const boundaryGeometry = new THREE.TorusGeometry(
      FIELD_RADIUS,
      0.2,
      8,
      128
    );
    const boundaryMaterial = new THREE.MeshBasicMaterial({
      color: 3394815,
      transparent: true,
      opacity: 0.95
    });
    const boundaryMesh = new THREE.Mesh(
      boundaryGeometry,
      boundaryMaterial
    );
    boundaryMesh.rotation.x = Math.PI / 2;
    boundaryMesh.position.y = 0.12;
    groundGroup.add(boundaryMesh);
  }
  function createBallMesh(radius) {
    const ballGeo = new THREE.SphereGeometry(radius, 32, 32);
    const ballMesh_mat = new THREE.MeshPhongMaterial({
      color: 16737843,
      emissive: 4460800,
      shininess: 100,
      specular: 16777215
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMesh_mat);
    ballMesh.castShadow = true;
    scene.add(ballMesh);
    const lineGeo = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(radius * 0.8));
    const lineMat = new THREE.LineBasicMaterial({ color: 16755268, transparent: true, opacity: 0.4 });
    const ballLines = new THREE.LineSegments(lineGeo, lineMat);
    ballMesh.add(ballLines);
    ballLight = new THREE.PointLight(16742212, 1.5, 6);
    scene.add(ballLight);
    return ballMesh;
  }
  function createCubeMesh(x, z, w, h, d, headFace = 4, weakFace = 5) {
    const col = cubeColor;
    const geometry = new THREE.BoxGeometry(w, h, d);
    const materials = [];
    for (let i = 0; i < 6; i++) {
      let faceColor = col;
      if (i === headFace) {
        faceColor = 16711680;
      }
      if (i === weakFace) {
        faceColor = 16774307;
      }
      materials.push(
        new THREE.MeshPhongMaterial({
          color: faceColor,
          emissive: new THREE.Color(faceColor).multiplyScalar(0.2),
          shininess: 80
        })
      );
    }
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(x, h / 2, z);
    scene.add(mesh);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({
        color: 16777215
      })
    );
    mesh.add(edges);
    return mesh;
  }
  function createSnakeMesh(x, z, radius, count, weakSegmentIndex) {
    const meshes = [];
    for (let i = 0; i < count; i++) {
      const r = radius * Math.pow(0.9, i);
      const isHead = i === 0;
      const isWeakSegment = i === weakSegmentIndex;
      const material = new THREE.MeshPhongMaterial({
        color: isWeakSegment ? 16766287 : 2236962,
        emissive: isWeakSegment ? 16748288 : isHead ? 11141120 : 3342336,
        emissiveIntensity: isWeakSegment ? 1.5 : 1,
        shininess: isWeakSegment ? 180 : 120
      });
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 24, 24),
        material
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      if (i === 0) {
        const eyeGeo = new THREE.SphereGeometry(r * 0.18, 16, 16);
        const eyeMat = new THREE.MeshPhongMaterial({ color: 0 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-r * 0.28, r * 0.12, r * 0.82);
        const rightEye = leftEye.clone();
        rightEye.position.x = r * 0.28;
        mesh.add(leftEye);
        mesh.add(rightEye);
        const pupilGeo = new THREE.SphereGeometry(r * 0.07, 12, 12);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 16711680 });
        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(0, 0, r * 0.12);
        leftEye.add(leftPupil);
        const rightPupil = leftPupil.clone();
        rightEye.add(rightPupil);
        const mouthGeo = new THREE.TorusGeometry(
          r * 0.18,
          r * 0.025,
          8,
          24,
          Math.PI
        );
        const mouthMat = new THREE.MeshBasicMaterial({
          color: 0
        });
        const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        mouth.rotation.z = Math.PI;
        mouth.position.set(0, -r * 0.18, r * 1.02);
        mesh.add(mouth);
      }
      meshes.push(mesh);
    }
    return meshes;
  }
  function createLights() {
    const ambientLight = new THREE.AmbientLight(2241365, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(11193599, 1.2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 150;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 60;
    dirLight.shadow.camera.bottom = -60;
    scene.add(dirLight);
    neonLight1 = new THREE.PointLight(17663, 2, 30);
    neonLight1.position.set(-20, 0.5, -20);
    scene.add(neonLight1);
    neonLight2 = new THREE.PointLight(16711816, 2, 30);
    neonLight2.position.set(20, 0.5, 20);
    scene.add(neonLight2);
  }
  function createStars() {
    const starGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for (let i = 0; i < 500; i++) {
      starVerts.push((Math.random() - 0.5) * 200, Math.random() * 50 + 5, (Math.random() - 0.5) * 200);
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
    const starMat = new THREE.PointsMaterial({ color: 16777215, size: 0.15, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(starGeo, starMat));
  }
  function createLightRayMesh(radius = 0.12) {
    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      1,
      12
    );
    const material = new THREE.MeshBasicMaterial({
      color: 16720418,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
  }
  function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  function destroyRenderer() {
    var _a;
    if (resizeListenerRegistered) {
      window.removeEventListener("resize", onWindowResize);
      resizeListenerRegistered = false;
    }
    if (scene) {
      scene.traverse((object) => {
        var _a2, _b, _c, _d;
        (_b = (_a2 = object.geometry) == null ? void 0 : _a2.dispose) == null ? void 0 : _b.call(_a2);
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => {
            var _a3;
            return (_a3 = material.dispose) == null ? void 0 : _a3.call(material);
          });
        } else {
          (_d = (_c = object.material) == null ? void 0 : _c.dispose) == null ? void 0 : _d.call(_c);
        }
      });
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    }
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
      (_a = renderer.domElement) == null ? void 0 : _a.remove();
    }
    renderer = null;
    scene = null;
    camera = null;
    ballLight = null;
    neonLight1 = null;
    neonLight2 = null;
  }

  // src/core/physics.js
  var world = null;
  var ballBody = null;
  var FIELD_WALL_HEIGHT = 10;
  var FIELD_WALL_THICKNESS = 1;
  var FIELD_WALL_SEGMENTS = 64;
  function initPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -25, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    const groundMat = new CANNON.Material("ground");
    const ballMat = new CANNON.Material("ball");
    const enemyMat = new CANNON.Material("enemy");
    world.addContactMaterial(new CANNON.ContactMaterial(groundMat, ballMat, { friction: 0.7, restitution: 0.2 }));
    world.addContactMaterial(new CANNON.ContactMaterial(enemyMat, groundMat, { friction: 0.4, restitution: 0.3 }));
    const groundBody = new CANNON.Body({ mass: 0, material: groundMat });
    groundBody.name = "ground";
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);
    addCircularWall(
      FIELD_RADIUS,
      FIELD_WALL_HEIGHT,
      FIELD_WALL_THICKNESS,
      FIELD_WALL_SEGMENTS
    );
  }
  function addCircularWall(radius, height, thickness, segmentCount) {
    const angleStep = Math.PI * 2 / segmentCount;
    const segmentLength = 2 * radius * Math.tan(Math.PI / segmentCount);
    const wallCenterRadius = radius + thickness / 2;
    for (let i = 0; i < segmentCount; i++) {
      const angle = i * angleStep;
      const wallBody = new CANNON.Body({ mass: 0 });
      wallBody.addShape(new CANNON.Box(new CANNON.Vec3(
        segmentLength / 2,
        height / 2,
        thickness / 2
      )));
      wallBody.position.set(
        Math.cos(angle) * wallCenterRadius,
        height / 2,
        Math.sin(angle) * wallCenterRadius
      );
      wallBody.quaternion.setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        -angle - Math.PI / 2
      );
      wallBody.name = "field-wall";
      world.addBody(wallBody);
    }
  }
  function createBallBody(radius) {
    const ballMat = world.materials.find((m) => m.name === "ball") || new CANNON.Material("ball");
    ballBody = new CANNON.Body({ mass: 1.5, material: ballMat });
    ballBody.addShape(new CANNON.Sphere(radius));
    ballBody.position.set(0, radius + 1, 0);
    ballBody.linearDamping = 0.3;
    ballBody.angularDamping = 0.1;
    world.addBody(ballBody);
    return ballBody;
  }
  function createCubeBody(x, z, w, h, d, mass = 2) {
    const enemyMat = world.materials.find((m) => m.name === "enemy") || new CANNON.Material("enemy");
    const body = new CANNON.Body({ mass, material: enemyMat });
    body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
    body.position.set(x, h / 2, z);
    world.addBody(body);
    return body;
  }
  function createSnakeBody(x, z, radius, count) {
    const bodies = [];
    const constraints = [];
    const radii = [];
    const enemyMat = world.materials.find((m) => m.name === "enemy") || new CANNON.Material("enemy");
    for (let i = 0; i < count; i++) {
      const r = radius * Math.pow(0.9, i);
      radii.push(r);
      const mass = i === 0 ? 2 : 0.5;
      const body = new CANNON.Body({
        mass,
        linearDamping: 0.2,
        angularDamping: 0.95,
        material: enemyMat
      });
      body.addShape(new CANNON.Sphere(r));
      if (i === 0) {
        body.position.set(x, r, z);
      } else {
        const prevR = radii[i - 1];
        const spacing = (prevR + r) * 0.95;
        body.position.set(
          x,
          r,
          bodies[i - 1].position.z - spacing
        );
      }
      world.addBody(body);
      bodies.push(body);
      if (i > 0) {
        const prevR = radii[i - 1];
        const spacing = (prevR + r) * 0.95;
        const c = new CANNON.DistanceConstraint(
          bodies[i - 1],
          body,
          spacing,
          1e6
        );
        world.addConstraint(c);
        constraints.push(c);
      }
    }
    return {
      bodies,
      constraints
    };
  }
  function destroyPhysics() {
    if (!world) return;
    while (world.constraints.length > 0) {
      world.removeConstraint(world.constraints[0]);
    }
    while (world.bodies.length > 0) {
      world.removeBody(world.bodies[0]);
    }
    ballBody = null;
    world = null;
  }

  // src/util.js
  function isMobileDevice() {
    const ua = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod|android/.test(ua);
  }
  function setupGameScreen() {
    return __async(this, null, function* () {
      var _a;
      if (typeof document.documentElement.requestFullscreen === "function") {
        try {
          yield document.documentElement.requestFullscreen();
        } catch (error) {
          console.warn("\u5168\u753B\u9762\u8868\u793A\u306B\u5931\u6557:", error);
        }
      }
      if (isMobileDevice() && typeof ((_a = screen.orientation) == null ? void 0 : _a.lock) === "function") {
        try {
          yield screen.orientation.lock("landscape-primary");
        } catch (error) {
          console.warn("\u753B\u9762\u56FA\u5B9A\u306B\u5931\u6557:", error);
        }
      }
      const gameStartEvent = new CustomEvent("title-exit");
      window.dispatchEvent(gameStartEvent);
    });
  }
  function getEnumKey(enumObject, value) {
    var _a;
    const numberValue = Number(value);
    return (_a = Object.keys(enumObject).find(
      (key) => enumObject[key] === numberValue
    )) != null ? _a : "UNKNOWN";
  }

  // src/input/gyro.js
  var gyroBeta = 0;
  var gyroGamma = 0;
  var gyroBetaZero = 0;
  var gyroGammaZero = 0;
  var gyroEnabled = false;
  var gyroCalibrated = false;
  var GyroFailureReason = Object.freeze({
    UNSUPPORTED: "unsupported",
    PERMISSION_DENIED: "permission-denied",
    PERMISSION_ERROR: "permission-error",
    SENSOR_UNAVAILABLE: "sensor-unavailable",
    CALIBRATION_TIMEOUT: "calibration-timeout",
    CANCELLED: "cancelled"
  });
  var CALIBRATION_TIMEOUT_MS = 5e3;
  var CALIBRATION_SAMPLE_COUNT = 8;
  var STABLE_ANGLE_DELTA = 0.8;
  var TURN_DEAD_ZONE = 1.5;
  var FORWARD_DEAD_ZONE = 1.5;
  var MAX_TURN_TILT = 45;
  var MAX_FORWARD_TILT = 25;
  var lastBeta = null;
  var lastGamma = null;
  var calibrationSamples = [];
  var validReadingCount = 0;
  var calibrationScreenAngle = 0;
  var calibrationTimeoutId = null;
  var resolveCalibration = null;
  var calibrationRequestId = 0;
  var orientationListenerRegistered = false;
  function result(ok, reason = null) {
    return { ok, reason };
  }
  function getScreenAngle() {
    var _a;
    const modernAngle = Number((_a = screen.orientation) == null ? void 0 : _a.angle);
    const legacyAngle = Number(window.orientation);
    const rawAngle = Number.isFinite(modernAngle) ? modernAngle : Number.isFinite(legacyAngle) ? legacyAngle : 0;
    const normalized = (rawAngle % 360 + 360) % 360;
    return Math.round(normalized / 90) * 90 % 360;
  }
  function angularDifference(current, previous) {
    return Math.atan2(
      Math.sin((current - previous) * Math.PI / 180),
      Math.cos((current - previous) * Math.PI / 180)
    ) * 180 / Math.PI;
  }
  function resetSampleCollection() {
    gyroEnabled = false;
    gyroCalibrated = false;
    lastBeta = null;
    lastGamma = null;
    calibrationSamples = [];
    validReadingCount = 0;
    calibrationScreenAngle = getScreenAngle();
  }
  function clearCalibrationTimeout() {
    if (calibrationTimeoutId === null) return;
    clearTimeout(calibrationTimeoutId);
    calibrationTimeoutId = null;
  }
  function startCalibrationTimeout(requestId) {
    clearCalibrationTimeout();
    calibrationTimeoutId = setTimeout(() => {
      if (requestId !== calibrationRequestId) return;
      failCalibration(
        validReadingCount === 0 ? GyroFailureReason.SENSOR_UNAVAILABLE : GyroFailureReason.CALIBRATION_TIMEOUT
      );
    }, CALIBRATION_TIMEOUT_MS);
  }
  function removeSensorListeners() {
    var _a, _b;
    window.removeEventListener("deviceorientation", saveZeroPoint, true);
    if (!orientationListenerRegistered) return;
    (_b = (_a = screen.orientation) == null ? void 0 : _a.removeEventListener) == null ? void 0 : _b.call(_a, "change", handleOrientationChange);
    window.removeEventListener("orientationchange", handleOrientationChange);
    orientationListenerRegistered = false;
  }
  function enableSensorListeners() {
    var _a, _b;
    window.addEventListener("deviceorientation", saveZeroPoint, true);
    if (orientationListenerRegistered) return;
    (_b = (_a = screen.orientation) == null ? void 0 : _a.addEventListener) == null ? void 0 : _b.call(_a, "change", handleOrientationChange);
    window.addEventListener("orientationchange", handleOrientationChange);
    orientationListenerRegistered = true;
  }
  function settleCalibration(calibrationResult) {
    clearCalibrationTimeout();
    const resolve = resolveCalibration;
    resolveCalibration = null;
    resolve == null ? void 0 : resolve(calibrationResult);
  }
  function failCalibration(reason) {
    gyroEnabled = false;
    gyroCalibrated = false;
    removeSensorListeners();
    settleCalibration(result(false, reason));
  }
  function completeCalibration() {
    const sampleCount = calibrationSamples.length;
    gyroBetaZero = calibrationSamples.reduce(
      (sum, sample) => sum + sample.beta,
      0
    ) / sampleCount;
    gyroGammaZero = calibrationSamples.reduce(
      (sum, sample) => sum + sample.gamma,
      0
    ) / sampleCount;
    gyroCalibrated = true;
    gyroEnabled = true;
    settleCalibration(result(true));
  }
  function requestGyro() {
    return __async(this, null, function* () {
      if (gyroEnabled) return result(true);
      removeSensorListeners();
      clearCalibrationTimeout();
      resetSampleCollection();
      const requestId = ++calibrationRequestId;
      if (typeof DeviceOrientationEvent === "undefined" || !isMobileDevice()) {
        return result(false, GyroFailureReason.UNSUPPORTED);
      }
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        try {
          const permission = yield DeviceOrientationEvent.requestPermission();
          if (requestId !== calibrationRequestId) {
            return result(false, GyroFailureReason.CANCELLED);
          }
          if (permission !== "granted") {
            return result(false, GyroFailureReason.PERMISSION_DENIED);
          }
        } catch (error) {
          console.warn("\u30B8\u30E3\u30A4\u30ED\u30BB\u30F3\u30B5\u30FC\u306E\u5229\u7528\u8A31\u53EF\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", error);
          return result(false, GyroFailureReason.PERMISSION_ERROR);
        }
      }
      return new Promise((resolve) => {
        resolveCalibration = resolve;
        enableSensorListeners();
        startCalibrationTimeout(requestId);
      });
    });
  }
  function saveZeroPoint(event) {
    if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    gyroBeta = event.beta;
    gyroGamma = event.gamma;
    if (getScreenAngle() !== calibrationScreenAngle) {
      resetSampleCollection();
      if (resolveCalibration) {
        startCalibrationTimeout(calibrationRequestId);
      }
    }
    if (gyroCalibrated) return;
    validReadingCount++;
    const sample = { beta: event.beta, gamma: event.gamma };
    if (lastBeta === null || lastGamma === null) {
      calibrationSamples = [sample];
    } else {
      const betaDelta = Math.abs(angularDifference(event.beta, lastBeta));
      const gammaDelta = Math.abs(angularDifference(event.gamma, lastGamma));
      if (betaDelta <= STABLE_ANGLE_DELTA && gammaDelta <= STABLE_ANGLE_DELTA) {
        calibrationSamples.push(sample);
      } else {
        calibrationSamples = [sample];
      }
    }
    lastBeta = event.beta;
    lastGamma = event.gamma;
    if (calibrationSamples.length >= CALIBRATION_SAMPLE_COUNT) {
      completeCalibration();
    }
  }
  function handleOrientationChange() {
    if (getScreenAngle() === calibrationScreenAngle) return;
    resetSampleCollection();
    if (resolveCalibration) {
      startCalibrationTimeout(calibrationRequestId);
    }
  }
  function resetCalibration() {
    calibrationRequestId++;
    removeSensorListeners();
    clearCalibrationTimeout();
    const resolve = resolveCalibration;
    resolveCalibration = null;
    resolve == null ? void 0 : resolve(result(false, GyroFailureReason.CANCELLED));
    gyroBeta = 0;
    gyroGamma = 0;
    gyroBetaZero = 0;
    gyroGammaZero = 0;
    resetSampleCollection();
  }
  function mapTiltToScreen(betaDelta, gammaDelta, screenAngle) {
    switch (screenAngle) {
      case 90:
        return { turn: betaDelta, forward: gammaDelta };
      case 180:
        return { turn: -gammaDelta, forward: -betaDelta };
      case 270:
        return { turn: -betaDelta, forward: -gammaDelta };
      default:
        return { turn: gammaDelta, forward: betaDelta };
    }
  }
  function applyDeadZone(value, deadZone) {
    const magnitude = Math.abs(value);
    if (magnitude <= deadZone) return 0;
    return Math.sign(value) * (magnitude - deadZone);
  }
  function getCurrentTilt() {
    const betaDelta = angularDifference(gyroBeta, gyroBetaZero);
    const gammaDelta = angularDifference(gyroGamma, gyroGammaZero);
    const tilt = mapTiltToScreen(
      betaDelta,
      gammaDelta,
      calibrationScreenAngle
    );
    return {
      turn: applyDeadZone(tilt.turn, TURN_DEAD_ZONE),
      forward: applyDeadZone(tilt.forward, FORWARD_DEAD_ZONE)
    };
  }
  function calculateHeadingDeltaFromGyro(dt, turnTilt) {
    const clampedTilt = Math.max(
      -MAX_TURN_TILT,
      Math.min(MAX_TURN_TILT, turnTilt)
    );
    return clampedTilt / MAX_TURN_TILT * Ball.HEADING_SCALE * dt;
  }
  function calculateForceFromGyro(ball2, dt) {
    if (!gyroEnabled || !gyroCalibrated) {
      return new CANNON.Vec3(0, 0, 0);
    }
    const tilt = getCurrentTilt();
    ball2.heading += calculateHeadingDeltaFromGyro(dt, tilt.turn);
    const forwardTilt = Math.max(
      -MAX_FORWARD_TILT,
      Math.min(MAX_FORWARD_TILT, tilt.forward)
    );
    const forwardForce = forwardTilt / MAX_FORWARD_TILT * Ball.FORCE_SCALE;
    const fx = Math.sin(ball2.heading) * forwardForce;
    const fz = -Math.cos(ball2.heading) * forwardForce;
    return new CANNON.Vec3(fx, 0, fz);
  }

  // src/input/keyboard.js
  var keys = {};
  var currentBall = null;
  var registered = false;
  var FORCE_COEF = 1;
  function registerKeyEvent(ball2) {
    currentBall = ball2;
    clearKeyState();
    if (registered) return;
    registered = true;
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", clearKeyState);
    window.addEventListener("pagehide", clearKeyState);
    window.addEventListener("game-over", clearKeyState);
    window.addEventListener("game-clear", clearKeyState);
    window.addEventListener("back-to-mode-select", clearKeyState);
  }
  function handleKeyDown(e) {
    keys[e.code] = true;
    if (e.code === "Space") currentBall == null ? void 0 : currentBall.triggerJump();
  }
  function handleKeyUp(e) {
    keys[e.code] = false;
  }
  function handleVisibilityChange() {
    if (document.hidden) clearKeyState();
  }
  function clearKeyState() {
    Object.keys(keys).forEach((code) => {
      keys[code] = false;
    });
  }
  function calculateHeadingDeltaFromKeys(dt) {
    if (keys["ArrowLeft"] || keys["KeyA"]) return -Ball.HEADING_SCALE * dt;
    if (keys["ArrowRight"] || keys["KeyD"]) return Ball.HEADING_SCALE * dt;
    return 0;
  }
  function calculateForceFromKeys(ball2, dt) {
    let forwardForce = 0;
    ball2.heading += calculateHeadingDeltaFromKeys(dt);
    if (keys["ArrowUp"] || keys["KeyW"]) forwardForce = Ball.FORCE_SCALE;
    if (keys["ArrowDown"] || keys["KeyS"]) forwardForce = -Ball.FORCE_SCALE;
    const fx = Math.sin(ball2.heading) * forwardForce * FORCE_COEF;
    const fz = -Math.cos(ball2.heading) * forwardForce * FORCE_COEF;
    return new CANNON.Vec3(fx, 0, fz);
  }

  // src/object/dynamicObject.js
  var DynamicObject = class {
    constructor() {
      this.body = null;
      this.mesh = null;
      this.heading = 0;
    }
    /**
     * 物理ボディの位置と姿勢を描画メッシュへ同期する。
     * @returns {void}
     */
    updateVisuals() {
      this.mesh.position.copy(this.body.position);
      this.mesh.quaternion.copy(this.body.quaternion);
    }
    /**
     * 指定ボディの重心または指定点へ継続力を加える。
     * @param {CANNON.Vec3} force - 加える力
     * @param {CANNON.Body} body - 対象ボディ
     * @param {CANNON.Vec3|null} point - 力を加えるワールド座標
     * @returns {void}
     */
    applyForce(force, body = this.body, point = null) {
      if (force.x == 0 && force.y == 0 && force.z == 0) return;
      if (!point) point = body.position;
      body.applyForce(force, point);
    }
    /**
     * 指定ボディへ瞬間的な力を加える。
     * @param {CANNON.Vec3} force - 加える力積
     * @param {CANNON.Body} body - 対象ボディ
     * @param {CANNON.Vec3|null} point - 力積を加えるワールド座標
     * @returns {void}
     */
    applyImpulse(force, body = this.body, point = null) {
      if (force.x == 0 && force.y == 0 && force.z == 0) return;
      if (!point) point = body.position;
      body.applyImpulse(force, point);
    }
    /**
     * 追跡処理用に対象の水平座標だけを返す。
     * @param {DynamicObject} target - 追跡対象
     * @returns {{x: number, z: number}} 水平座標
     */
    getTargetPosition(target) {
      const p = target.body.position;
      return {
        x: p.x,
        z: p.z
      };
    }
  };

  // src/object/ball.js
  var _Ball = class _Ball extends DynamicObject {
    constructor() {
      super();
      __publicField(this, "initialPosition", { x: 0, y: _Ball.BALL_R + 1, z: 0 });
      __publicField(this, "initialHeading", 0);
      this.inputEnabled = true;
      this.jumpCount = 0;
      this.body = createBallBody(_Ball.BALL_R);
      this.mesh = createBallMesh(_Ball.BALL_R);
      this.body.name = "ball";
    }
    resetHeading() {
      this.heading = this.initialHeading;
    }
    // ボールの位置を初期位置にリセット
    resetPosition() {
      this.body.position.set(
        this.initialPosition.x,
        this.initialPosition.y,
        this.initialPosition.z
      );
      this.body.velocity.set(0, 0, 0);
      this.body.angularVelocity.set(0, 0, 0);
      this.body.quaternion.set(0, 0, 0, 1);
    }
    reset() {
      this.resetPosition();
      this.resetHeading();
    }
    // チュートリアルの進行に応じてユーザー入力を有効・無効にする
    setInputEnabled(enabled) {
      this.inputEnabled = enabled;
      if (!enabled && this.body) {
        this.body.velocity.x = 0;
        this.body.velocity.z = 0;
        this.body.angularVelocity.set(0, 0, 0);
      }
    }
    /**
     * 接地中に上向きの力積を加える。
     * @returns {void}
     */
    triggerJump() {
      if (!this.inputEnabled) return;
      if (!this.canJump) return;
      const forceVector = new CANNON.Vec3(0, _Ball.JUMP_FORCE, 0);
      this.applyImpulse(forceVector);
      this.canJump = false;
      this.jumpCount++;
    }
    /**
     * 現在有効な入力方式から推進力を求める。
     * @param {number} dt - 前フレームからの経過秒数
     * @returns {CANNON.Vec3} ボールへ加える力
     */
    calculateForce(dt) {
      if (!this.inputEnabled) {
        return new CANNON.Vec3(0, 0, 0);
      }
      let force;
      if (gyroEnabled)
        force = calculateForceFromGyro(this, dt);
      else
        force = calculateForceFromKeys(this, dt);
      return force;
    }
    /**
     * 水平面の合成速度へ上限を設ける。
     * ジャンプと落下の操作感を保つため、Y方向の速度は変更しない。
     */
    clampVelocity() {
      const v = this.body.velocity;
      const horizontalSpeed = Math.hypot(v.x, v.z);
      if (horizontalSpeed <= _Ball.MAX_VEL) return;
      const scale = _Ball.MAX_VEL / horizontalSpeed;
      v.x *= scale;
      v.z *= scale;
    }
    /**
     * 入力、速度制限、描画同期を1フレーム分更新する。
     * @param {number} dt - 前フレームからの経過秒数
     * @returns {void}
     */
    update(dt) {
      const forceVector = this.calculateForce(dt);
      this.applyForce(forceVector);
      this.clampVelocity();
      this.updateVisuals();
    }
  };
  __publicField(_Ball, "BALL_R", 1);
  __publicField(_Ball, "FORCE_SCALE", 60);
  __publicField(_Ball, "HEADING_SCALE", 2);
  __publicField(_Ball, "MAX_VEL", 15);
  __publicField(_Ball, "JUMP_FORCE", 30);
  var Ball = _Ball;

  // src/ui/hpBar.js
  window.addEventListener("game-over", deleteHpBar);
  window.addEventListener("game-clear", deleteHpBar);
  window.addEventListener("tutorial-exit", deleteHpBar);
  window.addEventListener("back-to-mode-select", deleteHpBar);
  function showHpBar() {
    if (document.getElementById("hp-bar-container")) return;
    const hpBarContainer = document.createElement("div");
    hpBarContainer.id = "hp-bar-container";
    const descriptionText = document.createElement("div");
    descriptionText.id = "hp-label";
    descriptionText.textContent = "\u76F8\u624B\u306E\u6B8B\u308AHP";
    const hpFrame = document.createElement("div");
    hpFrame.id = "hp-frame";
    const hpBar = document.createElement("div");
    hpBar.id = "hp-bar";
    hpFrame.appendChild(hpBar);
    hpBarContainer.appendChild(descriptionText);
    hpBarContainer.appendChild(hpFrame);
    document.body.appendChild(hpBarContainer);
  }
  function updateHpBar(hp) {
    const hpBar = document.getElementById("hp-bar");
    if (hpBar) hpBar.style.width = `${hp}%`;
  }
  function deleteHpBar() {
    const hpBarContainer = document.getElementById("hp-bar-container");
    if (hpBarContainer) document.body.removeChild(hpBarContainer);
  }

  // src/core/gameClock.js
  var pausedAt = null;
  var totalPausedDuration = 0;
  function getGameTime() {
    const currentTime = pausedAt != null ? pausedAt : performance.now();
    return currentTime - totalPausedDuration;
  }
  function pauseGameClock() {
    if (pausedAt !== null) return;
    pausedAt = performance.now();
  }
  function resumeGameClock() {
    if (pausedAt === null) return;
    totalPausedDuration += performance.now() - pausedAt;
    pausedAt = null;
  }
  function resetGameClock() {
    pausedAt = null;
    totalPausedDuration = 0;
  }

  // src/tutorial/tutorialController.js
  var _TutorialController = class _TutorialController {
    constructor(enemy, enemyName, partNames = {}) {
      /**
       * チュートリアルの実行順。
       * show: その手順の説明表示
       * begin: OKが押されたときの初期化
       * update: 毎フレーム行う完了判定
       */
      __publicField(this, "steps", [
        {
          id: "movement",
          show: "showMovementExplanation",
          begin: "beginMovementPractice",
          update: "updateMovementPractice"
        },
        {
          id: "turn",
          show: "showTurnExplanation",
          begin: "beginTurnPractice",
          update: "updateTurnPractice"
        },
        {
          id: "jump",
          show: "showJumpExplanation",
          begin: "beginJumpPractice",
          update: "updateJumpPractice"
        },
        {
          id: "battle",
          show: "showBattleExplanation",
          begin: "beginBattlePractice",
          update: "updateBattlePractice"
        },
        {
          id: "weak-point",
          show: "showWeakPointExplanation",
          begin: "beginWeakPointPractice",
          update: "updateWeakPointPractice"
        },
        {
          id: "evade",
          show: "showEvadeExplanation",
          begin: "beginEvadePractice",
          update: "updateEvadePractice"
        }
      ]);
      var _a, _b, _c;
      this.enemy = enemy;
      this.enemyName = enemyName;
      this.dangerPartName = (_a = partNames.danger) != null ? _a : "\u8D64\u3044\u653B\u6483\u90E8\u4F4D";
      this.safePartName = (_b = partNames.safe) != null ? _b : "\u653B\u6483\u90E8\u4F4D\u4EE5\u5916\u306E\u4F53";
      this.weakPartName = (_c = partNames.weak) != null ? _c : "\u9EC4\u8272\u3044\u5F31\u70B9";
      this.ball = null;
      this.overlay = null;
      this.objectivePanel = null;
      this.objectiveTitle = null;
      this.objectiveDescription = null;
      this.objectiveProgressText = null;
      this.objectiveProgressFill = null;
      this.enemyVisible = false;
      this.isMobile = isMobileDevice();
      this.stepIndex = 0;
      this.stepState = "not-started";
      this.traveledDistance = 0;
      this.previousBallPosition = null;
      this.turnedAngle = 0;
      this.previousHeading = null;
      this.jumpStartCount = 0;
      this.hasLeftGround = false;
      this.evadeStartedAt = 0;
      this.battleDamageReceived = false;
      this.weakPointHit = false;
      this.dangerNoticeOpen = false;
      this.stepCompletedAt = 0;
    }
    /** 現在実行中の手順を返す。 */
    get currentStep() {
      var _a;
      return (_a = this.steps[this.stepIndex]) != null ? _a : null;
    }
    /** Cube側の既存の完了判定からも参照できるようにする。 */
    get phase() {
      if (!this.currentStep) return "completed";
      return this.currentStep.id;
    }
    /**
     * 現在の手順の説明・練習・完了判定を一か所で進行する。
     * @param {Ball} ball - プレイヤーが操作するボール
     */
    update(ball2) {
      var _a;
      this.ball = ball2;
      if (this.dangerNoticeOpen) {
        ball2.setInputEnabled(false);
        return;
      }
      if (this.stepState === "completing") {
        ball2.setInputEnabled(false);
        if (getGameTime() - this.stepCompletedAt >= _TutorialController.STEP_COMPLETE_DISPLAY_DURATION) {
          this.advanceStep();
        }
        return;
      }
      if (!this.currentStep) {
        ball2.setInputEnabled(false);
        this.hideObjective();
        if (this.stepState !== "completed") {
          this.stepState = "completed";
          this.showTutorialCompletion();
        }
        return;
      }
      if (this.stepState === "not-started") {
        ball2.setInputEnabled(false);
        this.hideObjective();
        this.stepState = "waiting-confirmation";
        this[this.currentStep.show]();
        return;
      }
      if (this.stepState === "waiting-confirmation") {
        ball2.setInputEnabled(false);
        (_a = this[this.currentStep.updateWaiting]) == null ? void 0 : _a.call(this, ball2);
        return;
      }
      ball2.setInputEnabled(true);
      this.updateObjective();
      const isCompleted = this[this.currentStep.update](ball2);
      if (isCompleted) {
        this.completeCurrentStep();
      } else {
        this.updateObjective();
      }
    }
    /** 説明のOKが押された後、現在の練習を開始する。 */
    beginCurrentStep() {
      this.resetEnemyPosition();
      this[this.currentStep.begin]();
      this.stepState = "practicing";
      this.ball.setInputEnabled(true);
      this.updateObjective();
    }
    /** 達成した手順を短時間表示する。 */
    completeCurrentStep() {
      const completedStepId = this.currentStep.id;
      this.stepState = "completing";
      this.stepCompletedAt = getGameTime();
      this.ball.setInputEnabled(false);
      this.showObjective(
        `\u2713 ${this.getStepTitle(completedStepId)} \u5B8C\u4E86\uFF01`,
        "\u6B21\u306E\u7DF4\u7FD2\u3078\u9032\u307F\u307E\u3059",
        "\u9054\u6210",
        1
      );
    }
    /** 現在の手順を完了し、次の手順へ進める。 */
    advanceStep() {
      this.ball.setInputEnabled(false);
      this.stepIndex++;
      this.stepState = "not-started";
    }
    /** 現在の練習内容と進捗を画面上部へ表示する。 */
    updateObjective() {
      var _a, _b, _c, _d, _e;
      const stepId = (_a = this.currentStep) == null ? void 0 : _a.id;
      if (!stepId || this.stepState !== "practicing") return;
      const now = getGameTime();
      switch (stepId) {
        case "movement": {
          const progress = Math.min(
            this.traveledDistance / _TutorialController.MOVE_DISTANCE,
            1
          );
          this.showObjective(
            "\u524D\u9032\u30FB\u5F8C\u9032\u306E\u7DF4\u7FD2",
            this.isMobile ? "\u7AEF\u672B\u3092\u524D\u5F8C\u306B\u50BE\u3051\u306610m\u79FB\u52D5\u3057\u3088\u3046" : "W\u30FBS\u30AD\u30FC\u306710m\u79FB\u52D5\u3057\u3088\u3046",
            `${this.traveledDistance.toFixed(1)} / ${_TutorialController.MOVE_DISTANCE}m`,
            progress
          );
          break;
        }
        case "turn": {
          const targetDegrees = Math.round(
            _TutorialController.TURN_ANGLE * 180 / Math.PI
          );
          const currentDegrees = Math.min(
            this.turnedAngle * 180 / Math.PI,
            targetDegrees
          );
          this.showObjective(
            "\u65B9\u5411\u8EE2\u63DB\u306E\u7DF4\u7FD2",
            this.isMobile ? "\u7AEF\u672B\u3092\u5DE6\u53F3\u306B\u50BE\u3051\u306690\xB0\u56DE\u8EE2\u3057\u3088\u3046" : "A\u30FBD\u30AD\u30FC\u306790\xB0\u56DE\u8EE2\u3057\u3088\u3046",
            `${Math.round(currentDegrees)} / ${targetDegrees}\xB0`,
            currentDegrees / targetDegrees
          );
          break;
        }
        case "jump": {
          const hasJumped = this.ball.jumpCount > this.jumpStartCount;
          this.showObjective(
            "\u30B8\u30E3\u30F3\u30D7\u306E\u7DF4\u7FD2",
            this.isMobile ? "\u753B\u9762\u3092\u30BF\u30C3\u30D7\u3057\u3066\u30B8\u30E3\u30F3\u30D7\u3057\u3001\u7740\u5730\u3057\u3088\u3046" : "Space\u30AD\u30FC\u3067\u30B8\u30E3\u30F3\u30D7\u3057\u3001\u7740\u5730\u3057\u3088\u3046",
            this.hasLeftGround ? "\u7740\u5730\u3057\u3088\u3046" : hasJumped ? "\u30B8\u30E3\u30F3\u30D7\u4E2D" : "\u30B8\u30E3\u30F3\u30D7\u3057\u3088\u3046",
            this.hasLeftGround ? 0.75 : hasJumped ? 0.5 : 0
          );
          break;
        }
        case "battle":
          this.showObjective(
            "\u653B\u6483\u306E\u7DF4\u7FD2",
            `${this.dangerPartName}\u3092\u907F\u3051\u3001${this.safePartName}\u306B\u3076\u3064\u304B\u308D\u3046`,
            "1\u56DE\u30C0\u30E1\u30FC\u30B8\u3092\u4E0E\u3048\u308B",
            this.battleDamageReceived ? 1 : 0
          );
          break;
        case "weak-point":
          this.showObjective(
            "\u5F31\u70B9\u3078\u306E\u653B\u6483",
            `${this.weakPartName}\u306B\u30DC\u30FC\u30EB\u3092\u3076\u3064\u3051\u3088\u3046`,
            "\u5F31\u70B9\u30921\u56DE\u653B\u6483\u3059\u308B",
            this.weakPointHit ? 1 : 0
          );
          break;
        case "evade": {
          const elapsed = Math.max(0, now - this.evadeStartedAt);
          const remaining = Math.max(
            0,
            _TutorialController.EVADE_DURATION - elapsed
          );
          this.showObjective(
            "\u6575\u304B\u3089\u9003\u3052\u308B\u7DF4\u7FD2",
            `${this.dangerPartName}\u3092\u907F\u3051\u3066\u9003\u3052\u7D9A\u3051\u3088\u3046`,
            `\u6B8B\u308A ${(remaining / 1e3).toFixed(1)}\u79D2`,
            elapsed / _TutorialController.EVADE_DURATION
          );
          break;
        }
        case "warningState": {
          const duration = (_b = this.warningStateDuration) != null ? _b : 2e3;
          const elapsed = Math.max(0, now - ((_c = this.warningStartedAt) != null ? _c : now));
          this.showObjective(
            "\u30EC\u30FC\u30B6\u30FC\u306E\u4E88\u5146",
            `${this.enemyName}\u306E\u70B9\u6EC5\u3092\u78BA\u8A8D\u3057\u3088\u3046`,
            "\u70B9\u6EC5\u72B6\u614B\u306E\u78BA\u8A8D",
            elapsed / duration
          );
          break;
        }
        case "lightRay": {
          const isFiring = this.enemy.isFiringLightRay;
          const warningDuration = (_d = this.warningStateDuration) != null ? _d : 2e3;
          const warningElapsed = Math.max(
            0,
            now - ((_e = this.warningStateStartTime) != null ? _e : now)
          );
          this.showObjective(
            "\u30EC\u30FC\u30B6\u30FC\u56DE\u907F",
            isFiring ? "\u79FB\u52D5\u3057\u3066\u30EC\u30FC\u30B6\u30FC\u306E\u5C04\u7DDA\u304B\u3089\u96E2\u308C\u3088\u3046" : "\u70B9\u6EC5\u3092\u78BA\u8A8D\u3057\u3066\u767A\u5C04\u306B\u5099\u3048\u3088\u3046",
            isFiring ? "\u30EC\u30FC\u30B6\u30FC\u767A\u5C04\u4E2D" : "\u767A\u5C04\u6E96\u5099\u4E2D",
            isFiring ? 0.75 : warningElapsed / warningDuration
          );
          break;
        }
      }
    }
    /**
     * 手順IDから進捗パネル用の表示名を取得する。
     * @param {string} stepId - 手順ID
     * @returns {string} 表示名
     */
    getStepTitle(stepId) {
      var _a;
      return (_a = {
        movement: "\u524D\u9032\u30FB\u5F8C\u9032\u306E\u7DF4\u7FD2",
        turn: "\u65B9\u5411\u8EE2\u63DB\u306E\u7DF4\u7FD2",
        jump: "\u30B8\u30E3\u30F3\u30D7\u306E\u7DF4\u7FD2",
        battle: "\u653B\u6483\u306E\u7DF4\u7FD2",
        "weak-point": "\u5F31\u70B9\u3078\u306E\u653B\u6483",
        evade: "\u6575\u304B\u3089\u9003\u3052\u308B\u7DF4\u7FD2",
        warningState: "\u30EC\u30FC\u30B6\u30FC\u306E\u4E88\u5146",
        lightRay: "\u30EC\u30FC\u30B6\u30FC\u56DE\u907F"
      }[stepId]) != null ? _a : "\u7DF4\u7FD2";
    }
    /**
     * 現在の目標と0～1の進捗を共通パネルへ表示する。
     * @param {string} title - 目標名
     * @param {string} description - 操作説明
     * @param {string} progressText - 進捗テキスト
     * @param {number} progress - 0～1の達成率
     */
    showObjective(title, description, progressText, progress) {
      this.ensureObjectivePanel();
      this.objectiveTitle.textContent = title;
      this.objectiveDescription.textContent = description;
      this.objectiveProgressText.textContent = progressText;
      this.objectiveProgressFill.style.width = `${Math.max(0, Math.min(progress, 1)) * 100}%`;
      this.objectivePanel.hidden = false;
    }
    /** 進捗パネルを初回表示時に生成し、各要素を保持する。 */
    ensureObjectivePanel() {
      if (this.objectivePanel) return;
      const panel = document.createElement("aside");
      panel.className = "tutorial-objective-panel";
      panel.setAttribute("aria-label", "\u73FE\u5728\u306E\u76EE\u6A19");
      const title = document.createElement("strong");
      title.className = "tutorial-objective-title";
      const description = document.createElement("p");
      description.className = "tutorial-objective-description";
      const progressRow = document.createElement("div");
      progressRow.className = "tutorial-objective-progress-row";
      const progressTrack = document.createElement("div");
      progressTrack.className = "tutorial-objective-progress-track";
      const progressFill = document.createElement("div");
      progressFill.className = "tutorial-objective-progress-fill";
      const progressText = document.createElement("span");
      progressText.className = "tutorial-objective-progress-text";
      progressTrack.appendChild(progressFill);
      progressRow.appendChild(progressTrack);
      progressRow.appendChild(progressText);
      panel.appendChild(title);
      panel.appendChild(description);
      panel.appendChild(progressRow);
      document.body.appendChild(panel);
      this.objectivePanel = panel;
      this.objectiveTitle = title;
      this.objectiveDescription = description;
      this.objectiveProgressText = progressText;
      this.objectiveProgressFill = progressFill;
    }
    /** 説明モーダル表示中など、進捗パネルが不要な間は隠す。 */
    hideObjective() {
      if (this.objectivePanel) this.objectivePanel.hidden = true;
    }
    showMovementExplanation() {
      const description = this.isMobile ? "\u30B9\u30DE\u30FC\u30C8\u30D5\u30A9\u30F3\u3092\u524D\u5F8C\u306B\u50BE\u3051\u308B\u3068\u3001\u30DC\u30FC\u30EB\u304C\u524D\u9032\u30FB\u5F8C\u9032\u3057\u307E\u3059\u3002\u7AEF\u672B\u3092\u524D\u5F8C\u306B\u50BE\u3051\u3066\u3001\u4E00\u5B9A\u8DDD\u96E2\u3092\u79FB\u52D5\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002" : "W\u30FBS\u30AD\u30FC\u3001\u307E\u305F\u306F\u4E0A\u4E0B\u306E\u77E2\u5370\u30AD\u30FC\u3067\u524D\u9032\u30FB\u5F8C\u9032\u3057\u307E\u3059\u3002\u4E00\u5B9A\u8DDD\u96E2\u3092\u79FB\u52D5\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002";
      this.ball.reset();
      this.showStepOverlay("\u524D\u9032\u30FB\u5F8C\u9032\u306E\u7DF4\u7FD2", description);
    }
    beginMovementPractice() {
      this.traveledDistance = 0;
      this.previousBallPosition = null;
    }
    updateMovementPractice(ball2) {
      const position = ball2.body.position;
      if (!this.previousBallPosition) {
        this.previousBallPosition = { x: position.x, z: position.z };
        return false;
      }
      const dx = position.x - this.previousBallPosition.x;
      const dz = position.z - this.previousBallPosition.z;
      this.traveledDistance += Math.hypot(dx, dz);
      this.previousBallPosition.x = position.x;
      this.previousBallPosition.z = position.z;
      return this.traveledDistance >= _TutorialController.MOVE_DISTANCE;
    }
    showTurnExplanation() {
      const description = this.isMobile ? "\u30B9\u30DE\u30FC\u30C8\u30D5\u30A9\u30F3\u3092\u5DE6\u53F3\u306B\u50BE\u3051\u308B\u3068\u3001\u30DC\u30FC\u30EB\u306E\u9032\u884C\u65B9\u5411\u3092\u5909\u3048\u3089\u308C\u307E\u3059\u3002\u5DE6\u53F3\u3069\u3061\u3089\u304B\u307890\u5EA6\u4EE5\u4E0A\u56DE\u8EE2\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002" : "A\u30FBD\u30AD\u30FC\u3001\u307E\u305F\u306F\u5DE6\u53F3\u306E\u77E2\u5370\u30AD\u30FC\u3067\u9032\u884C\u65B9\u5411\u3092\u5909\u3048\u3089\u308C\u307E\u3059\u3002\u5DE6\u53F3\u3069\u3061\u3089\u304B\u307890\u5EA6\u4EE5\u4E0A\u56DE\u8EE2\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002";
      this.ball.reset();
      this.showStepOverlay("\u65B9\u5411\u8EE2\u63DB\u306E\u7DF4\u7FD2", description);
    }
    beginTurnPractice() {
      this.turnedAngle = 0;
      this.previousHeading = this.ball.heading;
    }
    updateTurnPractice(ball2) {
      if (this.previousHeading === null) {
        this.previousHeading = ball2.heading;
        return false;
      }
      const headingDifference = Math.atan2(
        Math.sin(ball2.heading - this.previousHeading),
        Math.cos(ball2.heading - this.previousHeading)
      );
      this.turnedAngle += Math.abs(headingDifference);
      this.previousHeading = ball2.heading;
      return this.turnedAngle >= _TutorialController.TURN_ANGLE;
    }
    showJumpExplanation() {
      const description = this.isMobile ? "\u753B\u9762\u3092\u30BF\u30C3\u30D7\u3059\u308B\u3068\u30B8\u30E3\u30F3\u30D7\u3067\u304D\u307E\u3059\u3002\u5B9F\u969B\u306B1\u56DE\u30B8\u30E3\u30F3\u30D7\u3057\u3066\u3001\u7740\u5730\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002" : "\u30B9\u30DA\u30FC\u30B9\u30AD\u30FC\u3092\u62BC\u3059\u3068\u30B8\u30E3\u30F3\u30D7\u3067\u304D\u307E\u3059\u3002\u5B9F\u969B\u306B1\u56DE\u30B8\u30E3\u30F3\u30D7\u3057\u3066\u3001\u7740\u5730\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002";
      this.ball.reset();
      this.showStepOverlay("\u30B8\u30E3\u30F3\u30D7\u306E\u7DF4\u7FD2", description);
    }
    beginJumpPractice() {
      this.jumpStartCount = this.ball.jumpCount;
      this.hasLeftGround = false;
    }
    updateJumpPractice(ball2) {
      const hasJumped = ball2.jumpCount > this.jumpStartCount;
      const groundHeight = ball2.initialPosition.y;
      if (hasJumped && ball2.body.position.y > groundHeight + 0.3) {
        this.hasLeftGround = true;
      }
      return this.hasLeftGround && ball2.canJump;
    }
    showEvadeExplanation() {
      this.enemy.maxHp = _TutorialController.EVADE_ENEMY_HP;
      this.enemy.hp = _TutorialController.EVADE_ENEMY_HP;
      updateHpBar(100);
      this.showEnemy();
      this.ball.reset();
      this.showStepOverlay(
        "\u6575\u304B\u3089\u9003\u3052\u308B\u7DF4\u7FD2",
        `${this.enemyName}\u304C\u30DC\u30FC\u30EB\u3092\u8FFD\u3044\u304B\u3051\u3066\u304D\u307E\u3059\u3002${this.dangerPartName}\u3092\u907F\u3051\u306610\u79D2\u9593\u9003\u3052\u7D9A\u3051\u307E\u3057\u3087\u3046\u3002`
      );
    }
    beginEvadePractice() {
      this.enemy.isBattleFinished = false;
      this.evadeStartedAt = getGameTime();
    }
    updateEvadePractice(ball2) {
      const now = getGameTime();
      this.chaseTarget(ball2, now);
      return now - this.evadeStartedAt >= _TutorialController.EVADE_DURATION;
    }
    showBattleExplanation() {
      this.showEnemy();
      showHpBar();
      this.ball.reset();
      this.showStepOverlay(
        "\u653B\u6483\u306E\u7DF4\u7FD2",
        `${this.enemyName}\u306E${this.dangerPartName}\u306B\u885D\u7A81\u3059\u308B\u3068\u30B2\u30FC\u30E0\u30AA\u30FC\u30D0\u30FC\u306B\u306A\u308A\u307E\u3059\u3002${this.dangerPartName}\u3092\u907F\u3051\u3001${this.safePartName}\u306B\u30DC\u30FC\u30EB\u3092\u3076\u3064\u3051\u3066HP\u3092\u6E1B\u3089\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002`
      );
    }
    beginBattlePractice() {
      this.battleDamageReceived = false;
    }
    updateBattlePractice() {
      return this.battleDamageReceived;
    }
    showWeakPointExplanation() {
      this.ball.reset();
      this.showStepOverlay(
        "\u5F31\u70B9\u3078\u306E\u653B\u6483",
        `${this.weakPartName}\u306F\u76F8\u624B\u306E\u5F31\u70B9\u3067\u3059\u3002\u4ED6\u306E\u90E8\u4F4D\u3088\u308A\u3082\u5927\u304D\u306A\u30C0\u30E1\u30FC\u30B8\u3092\u4E0E\u3048\u3089\u308C\u307E\u3059\u3002${this.weakPartName}\u3092\u72D9\u3063\u3066\u653B\u6483\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002`
      );
    }
    beginWeakPointPractice() {
      this.weakPointHit = false;
    }
    updateWeakPointPractice() {
      return this.weakPointHit;
    }
    /** 敵側でダメージが発生したときに、現在の攻撃練習の完了を記録する。 */
    notifyDamage(damage, { isWeakPoint = false } = {}) {
      var _a, _b, _c, _d;
      if (this.stepState !== "practicing" || damage <= 0) return;
      if (((_a = this.currentStep) == null ? void 0 : _a.id) === "battle") {
        this.battleDamageReceived = true;
        (_b = this.ball) == null ? void 0 : _b.setInputEnabled(false);
        return;
      }
      if (((_c = this.currentStep) == null ? void 0 : _c.id) === "weak-point" && isWeakPoint) {
        this.weakPointHit = true;
        this.enemy.isBattleFinished = true;
        (_d = this.ball) == null ? void 0 : _d.setInputEnabled(false);
      }
    }
    /** チュートリアル中に危険部位へ触れた場合の処理。 */
    notifyDangerCollision() {
      var _a, _b;
      if (this.stepState !== "practicing" || this.dangerNoticeOpen) return;
      if (((_a = this.currentStep) == null ? void 0 : _a.id) === "evade") {
        this.notifyEvadeGameOver();
        return;
      }
      this.dangerNoticeOpen = true;
      (_b = this.ball) == null ? void 0 : _b.setInputEnabled(false);
      this.showOverlay(
        "\u5371\u967A\u306A\u653B\u6483\u90E8\u4F4D\u3067\u3059",
        `${this.dangerPartName}\u306B\u885D\u7A81\u3059\u308B\u3068\u3001\u901A\u5E38\u306E\u30B2\u30FC\u30E0\u3067\u306F\u30B2\u30FC\u30E0\u30AA\u30FC\u30D0\u30FC\u306B\u306A\u308A\u307E\u3059\u3002\u3053\u306E\u90E8\u4F4D\u3092\u907F\u3051\u3066\u653B\u6483\u3057\u307E\u3057\u3087\u3046\u3002`,
        "\u7DF4\u7FD2\u3092\u7D9A\u3051\u308B",
        () => {
          var _a2;
          this.ball.reset();
          this.dangerNoticeOpen = false;
          (_a2 = this.ball) == null ? void 0 : _a2.setInputEnabled(true);
        }
      );
    }
    /** 回避練習中に攻撃部位へ触れた場合、配置と制限時間をリセットする */
    notifyEvadeGameOver() {
      var _a, _b;
      if (((_a = this.currentStep) == null ? void 0 : _a.id) !== "evade" || this.stepState !== "practicing" || this.dangerNoticeOpen) return;
      this.dangerNoticeOpen = true;
      (_b = this.ball) == null ? void 0 : _b.setInputEnabled(false);
      this.showOverlay(
        "\u30B2\u30FC\u30E0\u30AA\u30FC\u30D0\u30FC",
        `${this.dangerPartName}\u306B\u885D\u7A81\u3057\u307E\u3057\u305F\u3002\u30DC\u30FC\u30EB\u3068\u6575\u3092\u521D\u671F\u4F4D\u7F6E\u306B\u623B\u3057\u3001\u3082\u3046\u4E00\u5EA610\u79D2\u9593\u306E\u56DE\u907F\u306B\u6311\u6226\u3057\u307E\u3059\u3002`,
        "\u3084\u308A\u76F4\u3059",
        () => {
          this.ball.reset();
          this.resetEnemyPosition();
          this.evadeStartedAt = getGameTime();
          this.dangerNoticeOpen = false;
          this.ball.setInputEnabled(true);
        }
      );
    }
    /** 全手順の完了を通知し、モード選択へ戻る導線を表示する。 */
    showTutorialCompletion() {
      this.hideObjective();
      this.showOverlay(
        "\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EB\u5B8C\u4E86",
        `${this.enemyName}\u3068\u306E\u3059\u3079\u3066\u306E\u7DF4\u7FD2\u3092\u5B8C\u4E86\u3057\u307E\u3057\u305F\uFF01`,
        "\u30E2\u30FC\u30C9\u9078\u629E\u3078\u623B\u308B",
        () => {
          window.dispatchEvent(new CustomEvent("back-to-mode-select"));
        }
      );
    }
    /** 現在の手順を開始する共通の説明画面 */
    showStepOverlay(title, message) {
      this.showOverlay(
        title,
        message,
        "\u7DF4\u7FD2\u3092\u958B\u59CB",
        () => this.beginCurrentStep()
      );
    }
    /**
     * チュートリアル共通モーダルを生成する。
     * @param {string} title - 見出し
     * @param {string} message - 説明文
     * @param {string} buttonText - 確認ボタンの文言
     * @param {Function} onConfirm - 確認後の処理
     */
    showOverlay(title, message, buttonText, onConfirm) {
      this.removeOverlay();
      const overlay = document.createElement("div");
      overlay.className = "game-tutorial-overlay";
      const modal = document.createElement("div");
      modal.className = "game-tutorial-modal";
      const heading = document.createElement("h2");
      heading.className = "game-tutorial-title";
      heading.textContent = title;
      const description = document.createElement("p");
      description.className = "game-tutorial-description";
      description.textContent = message;
      const button = document.createElement("button");
      button.className = "game-tutorial-button";
      button.textContent = buttonText;
      button.addEventListener("click", () => {
        this.removeOverlay();
        onConfirm();
      }, { once: true });
      modal.appendChild(heading);
      modal.appendChild(description);
      modal.appendChild(button);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      this.overlay = overlay;
    }
    /** 現在の説明モーダルを削除する。 */
    removeOverlay() {
      var _a;
      (_a = this.overlay) == null ? void 0 : _a.remove();
      this.overlay = null;
    }
    /** ゲーム離脱時にチュートリアルが生成したDOMをすべて破棄する。 */
    destroyUi() {
      var _a;
      this.removeOverlay();
      (_a = this.objectivePanel) == null ? void 0 : _a.remove();
      this.objectivePanel = null;
      this.objectiveTitle = null;
      this.objectiveDescription = null;
      this.objectiveProgressText = null;
      this.objectiveProgressFill = null;
    }
    /** 敵種別ごとの物理ボディとメッシュ表示処理。派生クラスで実装する。 */
    showEnemy() {
    }
    /** 敵種別ごとの初期位置復元処理。派生クラスで実装する。 */
    resetEnemyPosition() {
    }
    /** 敵種別ごとの追跡処理。派生クラスで実装する。 */
    chaseTarget() {
    }
  };
  __publicField(_TutorialController, "MOVE_DISTANCE", 10);
  __publicField(_TutorialController, "TURN_ANGLE", Math.PI / 2);
  __publicField(_TutorialController, "EVADE_DURATION", 1e4);
  __publicField(_TutorialController, "EVADE_ENEMY_HP", 200);
  __publicField(_TutorialController, "STEP_COMPLETE_DISPLAY_DURATION", 900);
  var TutorialController = _TutorialController;

  // src/tutorial/cubeTutorial.js
  var _CubeTutorial = class _CubeTutorial extends TutorialController {
    constructor(cube2) {
      super(cube2, "Cube", {
        danger: "\u8D64\u3044\u9762",
        safe: "\u8D64\u3044\u9762\u4EE5\u5916\u306E\u9762",
        weak: "\u9EC4\u8272\u3044\u9762"
      });
      __publicField(this, "warningStateStep", {
        id: "warningState",
        show: "showWarningStateExplanation",
        begin: "beginWarningState",
        update: "updateWarningState"
      });
      this.hideEnemy();
      this.steps.push(this.warningStateStep);
    }
    /** 練習開始までCubeを物理ワールドと画面から隠す。 */
    hideEnemy() {
      if (world.bodies.includes(this.enemy.body)) {
        world.removeBody(this.enemy.body);
      }
      this.enemy.mesh.visible = false;
      this.enemyVisible = false;
    }
    /** Cubeを初期位置へ戻して物理ワールドと画面へ表示する。 */
    showEnemy() {
      const body = this.enemy.body;
      this.resetEnemyPosition();
      if (!world.bodies.includes(body)) {
        world.addBody(body);
      }
      this.enemy.mesh.visible = true;
      this.enemy.updateVisuals();
      this.enemyVisible = true;
    }
    /** Cubeの位置・速度・姿勢を戦闘開始時の状態へ戻す。 */
    resetEnemyPosition() {
      const { x, z, h } = this.enemy.constructor.initialPosition;
      const body = this.enemy.body;
      body.position.set(x, h / 2, z);
      body.quaternion.set(0, 0, 0, 1);
      body.velocity.set(0, 0, 0);
      body.angularVelocity.set(0, 0, 0);
      body.force.set(0, 0, 0);
      body.torque.set(0, 0, 0);
      body.aabbNeedsUpdate = true;
      body.wakeUp();
      this.enemy.yaw = 0;
      if (this.enemyVisible) this.enemy.updateVisuals();
    }
    /**
     * 通常戦闘と同じ追跡処理を練習対象へ適用する。
     * @param {Ball} ball - 追跡対象
     */
    chaseTarget(ball2) {
      this.enemy.chase(ball2);
    }
    /** 突進前に点滅する意味を説明する。 */
    showWarningStateExplanation() {
      const title = "\u70B9\u6EC5\u72B6\u614B";
      const description = "\u70B9\u6EC5\u72B6\u614B\u306F\u6575\u304C\u7A81\u9032\u306E\u6E96\u5099\u3092\u3057\u3066\u3044\u308B\u5408\u56F3\u3067\u3059";
      this.showStepOverlay(title, description);
    }
    /** 点滅状態の実演を開始する。 */
    beginWarningState() {
      const now = getGameTime();
      this.warningStateExplanationStartedAt = now;
      this.showEnemy();
      this.enemy.startDashWarning(now);
    }
    /**
     * 点滅を更新し、実演時間が終わったか判定する。
     * @returns {boolean} 実演が完了した場合はtrue
     */
    updateWarningState() {
      const now = getGameTime();
      this.enemy.updateDashWarning(now);
      if (now - this.warningStateExplanationStartedAt > _CubeTutorial.WARNING_STATE_EXPLANATION_DURATION) {
        this.hideEnemy();
        return true;
      }
      this.enemy.updateVisuals();
      return false;
    }
  };
  __publicField(_CubeTutorial, "WARNING_STATE_EXPLANATION_DURATION", 2e3);
  var CubeTutorial = _CubeTutorial;

  // src/audioManager.js
  var tracks = {
    menu: createTrack("asset/audio/dark_things_loop.mp3", 0.3),
    game: createTrack("asset/audio/fight_looped.wav", 0.28),
    tutorial: createTrack("asset/audio/synthwavehouse.ogg", 0.22),
    gameClear: createTrack("asset/audio/winfretless.ogg", 0.5, false),
    gameOver: createTrack("asset/audio/GameOver.ogg", 0.25, false)
  };
  var enemyHitSound = createTrack(
    "asset/audio/enemy-hit.ogg",
    0.38,
    false
  );
  var currentTrack = null;
  var playbackRequested = false;
  var sfxAudioContext = null;
  var sfxMasterGain = null;
  function getSfxAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sfxAudioContext) {
      sfxAudioContext = new AudioContextClass();
      sfxMasterGain = sfxAudioContext.createGain();
      const compressor = sfxAudioContext.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 10;
      compressor.ratio.value = 5;
      compressor.attack.value = 2e-3;
      compressor.release.value = 0.12;
      sfxMasterGain.gain.value = 0.72;
      sfxMasterGain.connect(compressor).connect(sfxAudioContext.destination);
    }
    if (sfxAudioContext.state === "suspended") {
      sfxAudioContext.resume().catch(() => {
      });
    }
    return sfxAudioContext;
  }
  function createImpactNoise(context, startAt, isWeakPoint) {
    const duration = isWeakPoint ? 0.18 : 0.13;
    const buffer = context.createBuffer(
      1,
      Math.ceil(context.sampleRate * duration),
      context.sampleRate
    );
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
      const decay = Math.pow(1 - i / samples.length, 3);
      samples[i] = (Math.random() * 2 - 1) * decay;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = isWeakPoint ? 1350 : 850;
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(isWeakPoint ? 0.7 : 0.48, startAt);
    gain.gain.exponentialRampToValueAtTime(1e-3, startAt + duration);
    source.connect(filter).connect(gain).connect(sfxMasterGain);
    source.start(startAt);
    source.stop(startAt + duration);
  }
  function createImpactThump(context, startAt, isWeakPoint) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const duration = isWeakPoint ? 0.24 : 0.17;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(isWeakPoint ? 155 : 120, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(42, startAt + duration);
    gain.gain.setValueAtTime(isWeakPoint ? 0.95 : 0.65, startAt);
    gain.gain.exponentialRampToValueAtTime(1e-3, startAt + duration);
    oscillator.connect(gain).connect(sfxMasterGain);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration);
  }
  function createWeakPointChime(context, startAt) {
    [740, 1110].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 0 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, startAt);
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 0.72,
        startAt + 0.2
      );
      gain.gain.setValueAtTime(index === 0 ? 0.32 : 0.18, startAt);
      gain.gain.exponentialRampToValueAtTime(1e-3, startAt + 0.24);
      oscillator.connect(gain).connect(sfxMasterGain);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.24);
    });
  }
  function playSynthesizedImpact(isWeakPoint) {
    const context = getSfxAudioContext();
    if (!context || !sfxMasterGain) return;
    const startAt = context.currentTime + 5e-3;
    createImpactThump(context, startAt, isWeakPoint);
    createImpactNoise(context, startAt, isWeakPoint);
    if (isWeakPoint) createWeakPointChime(context, startAt);
  }
  function createTrack(src, volume, loop = true) {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.preload = "auto";
    audio.volume = volume;
    audio.addEventListener("ended", () => {
      if (currentTrack === audio) playbackRequested = false;
    });
    return audio;
  }
  function startPlayback() {
    return __async(this, null, function* () {
      if (!currentTrack || !playbackRequested) return;
      try {
        yield currentTrack.play();
      } catch (error) {
        if ((error == null ? void 0 : error.name) !== "NotAllowedError" && (error == null ? void 0 : error.name) !== "AbortError") {
          console.warn("BGM\u3092\u518D\u751F\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", error);
        }
      }
    });
  }
  function playTrack(track) {
    if (currentTrack !== track) {
      if (currentTrack) {
        currentTrack.pause();
        currentTrack.currentTime = 0;
      }
      currentTrack = track;
    }
    playbackRequested = true;
    startPlayback();
  }
  function registerBgmEvents() {
    window.addEventListener("title-exit", playMenuBgm);
    window.addEventListener("back-to-mode-select", playMenuBgm);
    document.addEventListener("pointerdown", startPlayback);
    document.addEventListener("keydown", startPlayback);
  }
  function playMenuBgm() {
    playTrack(tracks.menu);
  }
  function playGameBgm(isTutorial) {
    playTrack(isTutorial ? tracks.tutorial : tracks.game);
  }
  function playGameClearBgm() {
    playTrack(tracks.gameClear);
  }
  function playGameOverBgm() {
    playTrack(tracks.gameOver);
  }
  function pauseBgm() {
    playbackRequested = false;
    currentTrack == null ? void 0 : currentTrack.pause();
  }
  function resumeBgm() {
    if (!currentTrack) return;
    playbackRequested = true;
    startPlayback();
  }
  function stopBgm() {
    playbackRequested = false;
    if (!currentTrack) return;
    currentTrack.pause();
    currentTrack.currentTime = 0;
    currentTrack = null;
  }
  function playEnemyHitSfx(isWeakPoint = false) {
    playSynthesizedImpact(isWeakPoint);
    const sound = enemyHitSound.cloneNode();
    sound.volume = enemyHitSound.volume;
    sound.playbackRate = isWeakPoint ? 1.08 : 0.86;
    sound.play().catch((error) => {
      if ((error == null ? void 0 : error.name) !== "NotAllowedError" && (error == null ? void 0 : error.name) !== "AbortError") {
        console.warn("\u653B\u6483\u52B9\u679C\u97F3\u3092\u518D\u751F\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", error);
      }
    });
  }

  // src/core/hitEffects.js
  var effects = [];
  var flashes = /* @__PURE__ */ new Map();
  var previousShakeOffset = new THREE.Vector3();
  var shakeStrength = 0;
  var shakeTime = 0;
  var shakeDuration = 0;
  var sparkGeometry = new THREE.SphereGeometry(0.075, 6, 6);
  function getContactPoint(event, enemyBody) {
    const contact = event.contact;
    const relativePoint = contact.bi === enemyBody ? contact.ri : contact.rj;
    return new THREE.Vector3(
      enemyBody.position.x + relativePoint.x,
      enemyBody.position.y + relativePoint.y,
      enemyBody.position.z + relativePoint.z
    );
  }
  function flashMesh(mesh, isWeakPoint) {
    if (!mesh) return;
    let state = flashes.get(mesh);
    if (!state) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      state = {
        materials,
        originals: materials.map((material) => {
          var _a;
          return {
            emissive: (_a = material.emissive) == null ? void 0 : _a.clone(),
            emissiveIntensity: material.emissiveIntensity
          };
        }),
        remaining: 0
      };
      flashes.set(mesh, state);
    }
    state.remaining = Math.max(state.remaining, isWeakPoint ? 0.16 : 0.09);
    state.materials.forEach((material) => {
      if (!material.emissive) return;
      material.emissive.setHex(16777215);
      material.emissiveIntensity = isWeakPoint ? 2.8 : 1.8;
    });
  }
  function restoreFlash(mesh, state) {
    state.materials.forEach((material, index) => {
      const original = state.originals[index];
      if (!material.emissive || !original.emissive) return;
      material.emissive.copy(original.emissive);
      material.emissiveIntensity = original.emissiveIntensity;
    });
    flashes.delete(mesh);
  }
  function createSparks(position, isWeakPoint, impactSpeed) {
    const count = isWeakPoint ? 22 : 12;
    const color = isWeakPoint ? 16774307 : 16747059;
    const group = new THREE.Group();
    const particles = [];
    for (let i = 0; i < count; i++) {
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const spark = new THREE.Mesh(sparkGeometry, material);
      spark.position.copy(position);
      const velocity = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() * 0.8 + 0.15,
        Math.random() - 0.5
      ).normalize().multiplyScalar(
        (isWeakPoint ? 8 : 5) + Math.min(impactSpeed, 15) * 0.18
      );
      group.add(spark);
      particles.push({ mesh: spark, velocity });
    }
    scene.add(group);
    effects.push({ type: "sparks", group, particles, age: 0, lifetime: isWeakPoint ? 0.42 : 0.3 });
  }
  function createShockwave(position, isWeakPoint) {
    const ringCount = isWeakPoint ? 2 : 1;
    for (let i = 0; i < ringCount; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: isWeakPoint ? 16774832 : 16740416,
        transparent: true,
        opacity: isWeakPoint ? 0.95 : 0.7,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.72, 1, 32),
        material
      );
      ring.position.copy(position);
      ring.scale.setScalar(0.15 + i * 0.12);
      scene.add(ring);
      effects.push({
        type: "ring",
        mesh: ring,
        age: -i * 0.055,
        lifetime: isWeakPoint ? 0.34 : 0.25,
        maxScale: isWeakPoint ? 3.6 : 2.2
      });
    }
  }
  function spawnHitEffect(event, enemyBody, enemyMesh, isWeakPoint, impactSpeed) {
    if (!scene || !enemyBody) return;
    const position = getContactPoint(event, enemyBody);
    createSparks(position, isWeakPoint, impactSpeed);
    createShockwave(position, isWeakPoint);
    flashMesh(enemyMesh, isWeakPoint);
    const strength = isWeakPoint ? 0.34 : 0.14;
    shakeStrength = Math.max(shakeStrength, strength + Math.min(impactSpeed, 15) * 6e-3);
    shakeDuration = isWeakPoint ? 0.2 : 0.12;
    shakeTime = shakeDuration;
  }
  function beginCameraFrame(activeCamera) {
    activeCamera.position.sub(previousShakeOffset);
    previousShakeOffset.set(0, 0, 0);
  }
  function applyCameraShake(activeCamera) {
    if (shakeTime <= 0) return;
    const amount = shakeStrength * (shakeTime / shakeDuration);
    previousShakeOffset.set(
      (Math.random() - 0.5) * 2 * amount,
      (Math.random() - 0.5) * amount,
      (Math.random() - 0.5) * 2 * amount
    );
    activeCamera.position.add(previousShakeOffset);
  }
  function updateHitEffects(dt) {
    shakeTime = Math.max(0, shakeTime - dt);
    for (const [mesh, state] of flashes) {
      state.remaining -= dt;
      if (state.remaining <= 0) restoreFlash(mesh, state);
    }
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      effect.age += dt;
      if (effect.age < 0) continue;
      const progress = Math.min(effect.age / effect.lifetime, 1);
      if (effect.type === "sparks") {
        effect.particles.forEach((particle) => {
          particle.velocity.y -= 12 * dt;
          particle.mesh.position.addScaledVector(particle.velocity, dt);
          particle.mesh.material.opacity = 1 - progress;
          particle.mesh.scale.setScalar(1 - progress * 0.65);
        });
      } else {
        effect.mesh.lookAt(camera.position);
        effect.mesh.scale.setScalar(0.15 + effect.maxScale * progress);
        effect.mesh.material.opacity = (1 - progress) * 0.85;
      }
      if (progress < 1) continue;
      if (effect.type === "sparks") {
        scene.remove(effect.group);
        effect.particles.forEach(({ mesh }) => mesh.material.dispose());
      } else {
        scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        effect.mesh.material.dispose();
      }
      effects.splice(i, 1);
    }
  }
  function resetHitEffects() {
    for (const [mesh, state] of flashes) restoreFlash(mesh, state);
    effects.forEach((effect) => {
      var _a, _b;
      if (effect.type === "sparks") {
        (_a = scene) == null ? void 0 : _a.remove(effect.group);
        effect.particles.forEach(({ mesh }) => mesh.material.dispose());
      } else {
        (_b = scene) == null ? void 0 : _b.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        effect.mesh.material.dispose();
      }
    });
    effects.length = 0;
    shakeStrength = 0;
    shakeTime = 0;
    shakeDuration = 0;
    previousShakeOffset.set(0, 0, 0);
  }

  // src/object/cube.js
  var _Cube = class _Cube extends DynamicObject {
    // 初期位置とサイズ
    constructor(difficulty2) {
      const { x, z, h, w, d } = _Cube.initialPosition;
      super();
      this.yaw = 0;
      this.difficulty = Number(difficulty2);
      this.body = createCubeBody(x, z, w, h, d, _Cube.MASS);
      this.mesh = createCubeMesh(x, z, w, h, d, _Cube.FACE.FRONT, _Cube.FACE.BACK);
      this.weakFace = _Cube.FACE.BACK;
      this.headFace = _Cube.FACE.FRONT;
      this.dashCooldown = 4e3;
      this.lastDashTime = getGameTime();
      this.isPreparingDash = false;
      this.dashWarningStartedAt = 0;
      switch (this.difficulty) {
        case Difficulty.EASY:
          this.maxHp = _Cube.MAX_HP.Easy;
          break;
        case Difficulty.NORMAL:
          this.maxHp = _Cube.MAX_HP.Normal;
          break;
        case Difficulty.HARD:
          this.maxHp = _Cube.MAX_HP.Hard;
          break;
        default:
          this.maxHp = 100;
      }
      this.hp = this.maxHp;
      this.tutorial = null;
      if (this.difficulty !== Difficulty.TUTORIAL) {
        showHpBar();
      }
      this.body.addEventListener("collide", (event) => {
        this.handleDamageEvent(event);
      });
      if (this.difficulty === Difficulty.TUTORIAL) {
        this.tutorial = new CubeTutorial(this);
      }
    }
    /**
    * 衝突イベントのハンドラ
    * @param {CANNON.Event} event - 衝突イベント
    * @returns {void}　
    */
    handleDamageEvent(event) {
      var _a, _b;
      if (this.isBattleFinished || ((_a = this.tutorial) == null ? void 0 : _a.phase) === "completed") return;
      const damage = this.calculateDamage(event);
      if (!damage) return;
      this.applyDamage(damage);
      playEnemyHitSfx(this.lastHitWasWeakPoint);
      const impactSpeed = Math.abs(event.contact.getImpactVelocityAlongNormal());
      spawnHitEffect(
        event,
        this.body,
        this.mesh,
        this.lastHitWasWeakPoint,
        impactSpeed
      );
      const restHpRate = this.hp / this.maxHp;
      updateHpBar(restHpRate * 100);
      (_b = this.tutorial) == null ? void 0 : _b.notifyDamage(damage, {
        isWeakPoint: this.lastHitWasWeakPoint
      });
    }
    /**
    * 衝突イベントからダメージを計算
    * @param {CANNON.Event} event - 衝突イベント
    * @returns {number | null} - 計算されたダメージ量。ダメージがない場合はnullを返す　
    */
    calculateDamage(event) {
      var _a;
      if (event.body.name !== "ball") return null;
      const impactSpeed = Math.abs(event.contact.getImpactVelocityAlongNormal());
      const worldNormal = event.contact.ni;
      const inv = this.body.quaternion.inverse();
      const localNormal = inv.vmult(worldNormal);
      if (localNormal.z < -0.1) {
        if (this.difficulty === Difficulty.TUTORIAL) {
          (_a = this.tutorial) == null ? void 0 : _a.notifyDangerCollision();
          return null;
        }
        const gameOverEvent = new CustomEvent("game-over");
        window.dispatchEvent(gameOverEvent);
        return null;
      }
      if (impactSpeed < MIN_DAMAGE_IMPACT_SPEED) return null;
      this.lastHitWasWeakPoint = false;
      switch (this.weakFace) {
        case _Cube.FACE.BACK:
          this.lastHitWasWeakPoint = localNormal.z > 0.1;
          break;
        case _Cube.FACE.LEFT:
          this.lastHitWasWeakPoint = localNormal.x > 0.1;
          break;
        case _Cube.FACE.RIGHT:
          this.lastHitWasWeakPoint = localNormal.x < -0.1;
          break;
        case _Cube.FACE.TOP:
          this.lastHitWasWeakPoint = localNormal.y > 0.1;
          break;
      }
      return this.lastHitWasWeakPoint ? _Cube.WEAK_FACE_DAMAGE_COEF * impactSpeed : impactSpeed;
    }
    /**
    * 突進待機状態を解除
    * @param {number} damage - 受けたダメージ量
    * @returns {void}　
    */
    applyDamage(damage) {
      this.hp = Math.max(0, this.hp - damage);
      if (this.difficulty === Difficulty.TUTORIAL) return;
      if (this.hp <= 0) {
        const gameClearEvent = new CustomEvent("game-clear");
        window.dispatchEvent(gameClearEvent);
      }
    }
    /**
    * 状態更新
    * @param {Ball} target - ターゲット(操作対象のボール)
    * @returns {void}　
    */
    update(target) {
      if (this.tutorial) {
        this.tutorial.update(target);
        if (this.tutorial.enemyVisible) this.updateVisuals();
        return;
      }
      this.updateBehavior(target);
      this.updateVisuals();
    }
    /**
    * 物理的挙動を制御
    * @param {Ball} target - ターゲット(操作対象のボール)
    * @returns {void}　
    */
    updateBehavior(target) {
      const now = getGameTime();
      if (this.isPreparingDash) {
        const difficultyName = DifficultyNames[this.difficulty];
        const warningTurnSpeed = _Cube.WARNING_TURN_SPEED[difficultyName];
        this.turnTowardTarget(target, warningTurnSpeed);
        this.updateDashWarning(now);
        const warningDuration = _Cube.DASH_WARNING_DURATION[difficultyName];
        if (now - this.dashWarningStartedAt >= warningDuration) {
          this.finishDashWarning();
          this.dash();
          this.lastDashTime = now;
        }
        return;
      }
      if (now - this.lastDashTime >= this.dashCooldown) {
        const difficultyName = DifficultyNames[this.difficulty];
        const warningTurnSpeed = _Cube.WARNING_TURN_SPEED[difficultyName];
        this.startDashWarning(now);
        this.turnTowardTarget(target, warningTurnSpeed);
        return;
      }
      this.chase(target);
    }
    /**
    * ターゲットの方向へ回転
    * @param {Ball} target - ターゲット(操作対象のボール)
    * @param {number} turnSpeed - 回転速度
    * @returns {void}　
    */
    turnTowardTarget(target, turnSpeed) {
      if (!Number.isFinite(turnSpeed)) {
        console.error(`\u56DE\u8EE2\u901F\u5EA6\u304C\u7570\u5E38\u5024: ${turnSpeed}`);
        return;
      }
      const targetPos = this.getTargetPosition(target);
      const cp = this.body.position;
      const dx = targetPos.x - cp.x;
      const dz = targetPos.z - cp.z;
      const targetYaw = Math.atan2(dx, dz);
      const error = Math.atan2(
        Math.sin(targetYaw - this.yaw),
        Math.cos(targetYaw - this.yaw)
      );
      this.yaw += error * turnSpeed;
      this.body.quaternion.setFromEuler(0, this.yaw, 0);
    }
    /**
    * 突進待機状態を開始
    * @param {number} now - 現在の時間（ミリ秒）
    * @returns {void}　
    */
    startDashWarning(now) {
      this.isPreparingDash = true;
      this.dashWarningStartedAt = now;
      this.mesh.visible = true;
    }
    /**
    * 突進待機状態中の点滅アニメーション
    * @param {number} now - 現在の時間（ミリ秒）
    * @returns {void}　
    */
    updateDashWarning(now) {
      const elapsed = now - this.dashWarningStartedAt;
      const blinkCount = Math.floor(elapsed / _Cube.DASH_BLINK_INTERVAL);
      this.mesh.visible = blinkCount % 2 === 0;
    }
    /**
    * 突進待機状態を解除
    * @param {void} 
    * @returns {void}　
    */
    finishDashWarning() {
      this.isPreparingDash = false;
      this.mesh.visible = true;
    }
    /**
    * ターゲットを追跡
    * @param {Ball} target - ターゲット(操作対象のボール)
    * @returns {void}　
    */
    chase(target) {
      const difficultyName = DifficultyNames[this.difficulty];
      const turnSpeed = _Cube.TURN_SPEED[difficultyName];
      this.turnTowardTarget(target, turnSpeed);
      const chaseForce = _Cube.CHACE_FORCE[difficultyName];
      const fx = Math.sin(this.yaw) * chaseForce;
      const fz = Math.cos(this.yaw) * chaseForce;
      const forceVector = new CANNON.Vec3(fx, 0, fz);
      this.applyForce(forceVector);
    }
    /**
    * 突進
    * @param {void} 
    * @returns {void}　
    */
    dash() {
      const difficultyName = DifficultyNames[this.difficulty];
      const dashForce = _Cube.DASH_FORCE[difficultyName];
      const fx = Math.sin(this.yaw) * dashForce;
      const fz = Math.cos(this.yaw) * dashForce;
      const force = new CANNON.Vec3(fx, 0, fz);
      this.applyImpulse(force);
    }
  };
  __publicField(_Cube, "MASS", 2);
  // 質量  
  __publicField(_Cube, "WEAK_FACE_DAMAGE_COEF", 3);
  // 弱点面のダメージ倍率
  __publicField(_Cube, "TURN_SPEED", {
    // 平時ターン速度
    "Tutorial": 9e-3,
    "Easy": 7e-3,
    "Normal": 9e-3,
    "Hard": 0.015
  });
  __publicField(_Cube, "WARNING_TURN_SPEED", {
    // 突進待機時ターン速度
    "Easy": 0.01,
    "Normal": 0.015,
    "Hard": 0.2
  });
  __publicField(_Cube, "CHACE_FORCE", {
    // 追跡時に印加する力
    "Tutorial": 55,
    "Easy": 53,
    "Normal": 55,
    "Hard": 60
  });
  __publicField(_Cube, "DASH_FORCE", {
    // 突進時に印加する力
    "Easy": 0,
    "Normal": 50,
    "Hard": 60
  });
  __publicField(_Cube, "DASH_WARNING_DURATION", {
    // 突進待機時間
    "Easy": 0,
    "Normal": 1200,
    "Hard": 1e3
  });
  __publicField(_Cube, "DASH_BLINK_INTERVAL", 150);
  // 点滅周期
  __publicField(_Cube, "MAX_HP", {
    // 最大HP
    "Easy": 30,
    "Normal": 50,
    "Hard": 100
  });
  __publicField(_Cube, "FACE", {
    // 面の識別子
    RIGHT: 0,
    LEFT: 1,
    TOP: 2,
    BOTTOM: 3,
    FRONT: 4,
    BACK: 5,
    NONE: -1
  });
  __publicField(_Cube, "initialPosition", { x: 0, z: -10, h: 3, w: 3, d: 3 });
  var Cube = _Cube;

  // src/tutorial/snakeTutorial.js
  var SnakeTutorial = class extends TutorialController {
    constructor(snake2) {
      super(snake2, "Snake", {
        danger: "\u8D64\u3044\u982D",
        safe: "\u982D\u4EE5\u5916\u306E\u4F53",
        weak: "\u9EC4\u8272\u3044\u30BB\u30B0\u30E1\u30F3\u30C8"
      });
      __publicField(this, "warningStateDuration", 2e3);
      __publicField(this, "warningStateStep", {
        id: "warningState",
        show: "showWarningStateExplanation",
        begin: "beginWarningState",
        updateWaiting: "updateWaitingWarningState",
        update: "updateWarningState"
      });
      __publicField(this, "lightRayStep", {
        id: "lightRay",
        show: "showLightRayExplanation",
        begin: "beginLightRay",
        updateWaiting: "updateWhileLightRayWaiting",
        update: "updateLightRay"
      });
      this.steps.push(this.warningStateStep);
      this.steps.push(this.lightRayStep);
      this.initialBodyTransforms = snake2.bodies.map((body) => ({
        position: body.position.clone(),
        quaternion: body.quaternion.clone()
      }));
      this.hideEnemy();
    }
    /** Snakeの拘束と全セグメントを物理ワールドから外して非表示にする。 */
    hideEnemy() {
      this.enemy.constraints.forEach((constraint) => {
        if (world.constraints.includes(constraint)) {
          world.removeConstraint(constraint);
        }
      });
      this.enemy.bodies.forEach((body) => {
        if (world.bodies.includes(body)) {
          world.removeBody(body);
        }
      });
      this.enemy.setMeshesVisible(false);
      this.enemy.lightRayMesh.visible = false;
      this.enemyVisible = false;
    }
    /** Snakeを初期配置へ戻し、拘束と全セグメントを再登録する。 */
    showEnemy() {
      this.resetEnemyPosition();
      this.enemy.bodies.forEach((body) => {
        if (!world.bodies.includes(body)) {
          world.addBody(body);
        }
      });
      this.enemy.constraints.forEach((constraint) => {
        if (!world.constraints.includes(constraint)) {
          world.addConstraint(constraint);
        }
      });
      this.enemy.setMeshesVisible(true);
      this.enemy.updateVisuals();
      this.enemyVisible = true;
    }
    /** 全セグメントの位置・姿勢・速度を保存済みの初期状態へ戻す。 */
    resetEnemyPosition() {
      if (!this.initialBodyTransforms) return;
      this.enemy.bodies.forEach((body, index) => {
        const initialTransform = this.initialBodyTransforms[index];
        body.position.copy(initialTransform.position);
        body.quaternion.copy(initialTransform.quaternion);
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.force.set(0, 0, 0);
        body.torque.set(0, 0, 0);
        body.aabbNeedsUpdate = true;
        body.wakeUp();
      });
      this.enemy.headVisualLift = 0;
      this.enemy.headCenterApproach = 0;
      this.enemy.appliedHeadLift = 0;
      this.enemy.appliedHeadCenterOffsetX = 0;
      this.enemy.appliedHeadCenterOffsetZ = 0;
      this.enemy.isHeadPoseControlled = false;
      this.enemy.bodies[0].type = CANNON.Body.DYNAMIC;
      this.enemy.bodies[0].updateMassProperties();
      if (this.enemyVisible) this.enemy.updateVisuals();
    }
    /** レーザー発射前に点滅する意味を説明し、その場で実演する。 */
    showWarningStateExplanation() {
      const title = "\u70B9\u6EC5\u72B6\u614B";
      const description = "\u70B9\u6EC5\u72B6\u614B\u306F\u6575\u304C\u30EC\u30FC\u30B6\u30FC\u3092\u653E\u3064\u6E96\u5099\u3092\u3057\u3066\u3044\u308B\u5408\u56F3\u3067\u3059";
      this.ball.reset();
      this.showStepOverlay(title, description);
      this.showEnemy();
      const now = getGameTime();
      this.warningStartedAt = now;
      this.enemy.startLightRayWarning(now);
    }
    /**
     * 説明オーバーレイの待機中も点滅と顔の向きを更新する。
     * @param {Ball} target - 顔を向ける対象
     */
    updateWaitingWarningState(target) {
      const now = getGameTime();
      this.enemy.updateLightRayWarning(now);
      this.enemy.faceTarget(target);
    }
    /** 点滅状態の実演時間を初期化する。 */
    beginWarningState() {
      this.warningStartedAt = getGameTime();
      this.enemy.startLightRayWarning(getGameTime());
    }
    /**
     * 点滅の実演を進め、規定時間が経過したか判定する。
     * @param {Ball} target - 顔を向ける対象
     * @returns {boolean} 実演が完了した場合はtrue
     */
    updateWarningState(target) {
      this.enemy.updateLightRayWarning(getGameTime());
      this.enemy.faceTarget(target);
      if (getGameTime() - this.warningStartedAt >= this.warningStateDuration) {
        return true;
      }
      return false;
    }
    /** 点滅後に直線状のレーザーが発射されることを説明する。 */
    showLightRayExplanation() {
      const title = "\u5149\u7DDA";
      const description = "\u6575\u304C\u30EC\u30FC\u30B6\u30FC\u3092\u653E\u3063\u3066\u304D\u307E\u3059\u3002\u79FB\u52D5\u3057\u3066\u56DE\u907F\u3057\u307E\u3057\u3087\u3046";
      this.showStepOverlay(title, description);
    }
    /** レーザー回避練習の予兆状態を初期化する。 */
    beginLightRay() {
      this.warningStateStartTime = getGameTime();
      this.enemy.isPreparingLightRay = false;
      this.enemy.isFiringLightRay = false;
      this.enemy.lightRayMesh.visible = false;
      this.enemy.startLightRayWarning(this.warningStateStartTime);
    }
    /**
     * 説明確認待ちの間もレーザー予兆を更新する。
     * @param {Ball} target - 顔を向ける対象
     */
    updateWhileLightRayWaiting(target) {
      const now = getGameTime();
      this.enemy.updateLightRayWarning(now);
      this.enemy.faceTarget(target);
    }
    /**
     * 予兆、発射、命中、終了までのレーザー練習を進める。
     * @param {Ball} target - レーザーの対象
     * @returns {boolean} 回避練習が完了した場合はtrue
     */
    updateLightRay(target) {
      const now = getGameTime();
      if (this.enemy.isPreparingLightRay) {
        this.enemy.updateLightRayWarning(now);
        this.enemy.faceTarget(target);
        if (now - this.warningStateStartTime < this.warningStateDuration) {
          return false;
        }
        this.enemy.finishLightRayWarning();
        this.enemy.fireLightRay(target, now);
        this.enemy.lastLightRayTime = now;
        return false;
      }
      if (this.enemy.isFiringLightRay) {
        const isHit = this.enemy.updateLightRay(now, target);
        if (isHit) {
          this.retryLightRayPractice();
          return false;
        }
        return !this.enemy.isFiringLightRay;
      }
      return false;
    }
    /** 光線に当たった場合、ゲームオーバーにせず同じ練習をやり直す。 */
    retryLightRayPractice() {
      var _a;
      if (this.dangerNoticeOpen) return;
      this.dangerNoticeOpen = true;
      (_a = this.ball) == null ? void 0 : _a.setInputEnabled(false);
      this.showOverlay(
        "\u5149\u7DDA\u306B\u5F53\u305F\u308A\u307E\u3057\u305F",
        "\u30DC\u30FC\u30EB\u3068\u6575\u3092\u521D\u671F\u4F4D\u7F6E\u306B\u623B\u3057\u3001\u5149\u7DDA\u306E\u56DE\u907F\u3092\u3082\u3046\u4E00\u5EA6\u7DF4\u7FD2\u3057\u307E\u3059\u3002",
        "\u3084\u308A\u76F4\u3059",
        () => {
          this.ball.resetPosition();
          this.resetEnemyPosition();
          this.dangerNoticeOpen = false;
          this.beginLightRay();
          this.ball.setInputEnabled(true);
        }
      );
    }
    /**
     * 通常戦闘と同じ蛇行追跡を練習対象へ適用する。
     * @param {Ball} target - 追跡対象
     */
    chaseTarget(target) {
      this.enemy.chase(target, getGameTime());
    }
  };

  // src/object/snake.js
  var _Snake = class _Snake extends DynamicObject {
    // 初期配置
    constructor(difficulty2) {
      var _a;
      super();
      const { x, z } = _Snake.initialPosition;
      this.radius = 2;
      this.segmentCount = 7;
      this.difficulty = difficulty2;
      this.weakSegmentIndex = 1 + Math.floor(
        Math.random() * (this.segmentCount - 1)
      );
      const snake2 = createSnakeBody(
        x,
        z,
        this.radius,
        this.segmentCount
      );
      this.bodies = snake2.bodies;
      this.constraints = snake2.constraints;
      this.lightRayMesh = createLightRayMesh(_Snake.LIGHT_RAY_RADIUS);
      this.rayDirection = new THREE.Vector3();
      this.rayMidPoint = new THREE.Vector3();
      this.rayYAxis = new THREE.Vector3(0, 1, 0);
      this.lightRayStart = new THREE.Vector3();
      this.lightRayTarget = new THREE.Vector3();
      this.lightRayCurrentEnd = new THREE.Vector3();
      this.lightRayDesiredEnd = new THREE.Vector3();
      this.lightRayHitPoint = new THREE.Vector3();
      this.lightRayObstacleHitPoint = new THREE.Vector3();
      this.hasLightRayObstacleHit = false;
      this.rayToBall = new THREE.Vector3();
      this.rayClosestPoint = new THREE.Vector3();
      this.ballPosition = new THREE.Vector3();
      this.difficulty = Number(difficulty2);
      this.meshes = createSnakeMesh(
        x,
        z,
        this.radius,
        this.segmentCount,
        this.weakSegmentIndex
      );
      const difficultyName = DifficultyNames[this.difficulty];
      this.maxHp = (_a = _Snake.MAX_HP[difficultyName]) != null ? _a : _Snake.MAX_HP.Hard;
      this.hp = this.maxHp;
      this.isBattleFinished = false;
      this.faceYaw = 0;
      this.tutorial = null;
      this.chaseSwayPhase = 0;
      this.lastChaseUpdateTime = getGameTime();
      this.lastLightRayTime = getGameTime();
      this.isPreparingLightRay = false;
      this.isFiringLightRay = false;
      this.lightRayWarningStartedAt = 0;
      this.lightRayStartedAt = 0;
      this.lightRayTravelDuration = 0;
      this.lightRayStoppedAt = 0;
      this.headVisualLift = 0;
      this.headCenterApproach = 0;
      this.appliedHeadLift = 0;
      this.appliedHeadCenterOffsetX = 0;
      this.appliedHeadCenterOffsetZ = 0;
      this.isHeadPoseControlled = false;
      if (this.difficulty !== Difficulty.TUTORIAL) {
        showHpBar();
      }
      this.bodies.forEach((body, segmentIndex) => {
        body.addEventListener(
          "collide",
          (event) => this.handleCollisionEvent(event, segmentIndex)
        );
      });
      if (this.difficulty === Difficulty.TUTORIAL) {
        this.tutorial = new SnakeTutorial(this);
      }
    }
    /**
    * セグメントごとの衝突イベントを処理する
    * @param {CANNON.Event} event - 衝突イベント
    * @param {number} segmentIndex - 衝突したセグメント番号
    * @returns {void}
    */
    handleCollisionEvent(event, segmentIndex) {
      var _a, _b;
      if (this.isBattleFinished || event.body.name !== "ball") return;
      if (segmentIndex === 0) {
        if (this.difficulty === Difficulty.TUTORIAL) {
          (_a = this.tutorial) == null ? void 0 : _a.notifyDangerCollision();
          return;
        }
        this.isBattleFinished = true;
        const gameOverEvent = new CustomEvent("game-over");
        window.dispatchEvent(gameOverEvent);
        return;
      }
      const impactSpeed = Math.abs(
        event.contact.getImpactVelocityAlongNormal()
      );
      if (impactSpeed < MIN_DAMAGE_IMPACT_SPEED) return;
      let damage = impactSpeed;
      const isWeakPoint = segmentIndex === this.weakSegmentIndex;
      if (isWeakPoint) {
        damage *= _Snake.WEAK_SEGMENT_DAMAGE_COEF;
      }
      this.applyDamage(damage);
      playEnemyHitSfx(isWeakPoint);
      spawnHitEffect(
        event,
        this.bodies[segmentIndex],
        this.meshes[segmentIndex],
        isWeakPoint,
        impactSpeed
      );
      updateHpBar(this.hp / this.maxHp * 100);
      (_b = this.tutorial) == null ? void 0 : _b.notifyDamage(damage, { isWeakPoint });
    }
    /**
    * HPを減らし、0以下になったら勝利イベントを送る
    * @param {number} damage - 受けたダメージ量
    * @returns {void}
    */
    applyDamage(damage) {
      this.hp = Math.max(0, this.hp - damage);
      if (this.difficulty === Difficulty.TUTORIAL) return;
      if (this.hp > 0) return;
      this.isBattleFinished = true;
      const gameClearEvent = new CustomEvent("game-clear");
      window.dispatchEvent(gameClearEvent);
    }
    /**
    * 1フレーム分の更新処理
    * @param {Ball} target - 操作対象のボール
    * @returns {void}
    */
    update(target) {
      const now = getGameTime();
      if (this.tutorial) {
        this.tutorial.update(target);
        if (this.tutorial.enemyVisible) this.updateVisuals();
        return;
      }
      this.updateBehavior(target, now);
      this.updateVisuals();
      if (this.updateLightRay(now, target)) {
        this.isBattleFinished = true;
        window.dispatchEvent(new CustomEvent("game-over"));
      }
    }
    /**
    * 行動状態を更新する
    * @param {Ball} target - 操作対象のボール
    * @param {number} now - 現在時刻
    * @returns {void}
    */
    updateBehavior(target, now) {
      const difficultyName = DifficultyNames[this.difficulty];
      if (this.isFiringLightRay) return;
      if (this.isPreparingLightRay) {
        this.faceTarget(target);
        this.updateLightRayWarning(now);
        const warningDuration = _Snake.LIGHT_RAY_WARNING_DURATION[difficultyName];
        if (now - this.lightRayWarningStartedAt >= warningDuration) {
          this.finishLightRayWarning();
          this.fireLightRay(target, now);
          this.lastLightRayTime = now;
        }
        return;
      }
      if (now - this.lastLightRayTime >= _Snake.LIGHT_RAY_COOLDOWN) {
        this.startLightRayWarning(now);
        this.faceTarget(target);
        return;
      }
      this.chase(target, now);
    }
    /**
    * 頭がターゲットの方向を向くようにする
    * @param {Ball} target - 操作対象のボール
    * @returns {void}
    */
    faceTarget(target) {
      const targetPos = this.getTargetPosition(target);
      const headPosition = this.bodies[0].position;
      const dx = targetPos.x - headPosition.x;
      const dz = targetPos.z - headPosition.z;
      this.faceYaw = Math.atan2(dx, dz);
    }
    /**
    * 光線発射の予兆状態に入る
    * @param {number} now - 現在時刻
    * @returns {void}
    */
    startLightRayWarning(now) {
      this.isPreparingLightRay = true;
      this.lightRayWarningStartedAt = now;
      this.setMeshesVisible(true);
    }
    /**
    * 予兆中の点滅表示を更新する
    * @param {number} now - 現在時刻
    * @returns {void}
    */
    updateLightRayWarning(now) {
      const elapsed = now - this.lightRayWarningStartedAt;
      const blinkCount = Math.floor(
        elapsed / _Snake.WARNING_BLINK_INTERVAL
      );
      this.setMeshesVisible(blinkCount % 2 === 0);
    }
    /**
    * 光線発射の予兆を終了する
    * @returns {void}
    */
    finishLightRayWarning() {
      this.isPreparingLightRay = false;
      this.setMeshesVisible(true);
    }
    /**
    * 全セグメントの表示・非表示をまとめて切り替える
    * @param {boolean} visible - 表示するかどうか
    * @returns {void}
    */
    setMeshesVisible(visible) {
      this.meshes.forEach((mesh) => {
        mesh.visible = visible;
      });
    }
    /**
    * 光線発射時の始点と進行方向を記録する
    * @param {Ball} target - 操作対象のボール
    * @param {number} now - 現在時刻
    * @returns {void}
    */
    fireLightRay(target, now) {
      const targetPosition = target.body.position;
      this.lightRayStart.copy(this.meshes[0].position);
      this.lightRayTarget.set(
        targetPosition.x,
        targetPosition.y,
        targetPosition.z
      );
      this.rayDirection.subVectors(this.lightRayTarget, this.lightRayStart).normalize();
      this.lightRayTarget.copy(this.rayDirection).multiplyScalar(_Snake.LIGHT_RAY_MAX_DISTANCE).add(this.lightRayStart);
      const difficultyName = DifficultyNames[this.difficulty];
      const lightRaySpeed = _Snake.LIGHT_RAY_SPEED[difficultyName];
      this.lightRayTravelDuration = _Snake.LIGHT_RAY_MAX_DISTANCE / lightRaySpeed * 1e3;
      this.lightRayStartedAt = now;
      this.lightRayStoppedAt = 0;
      this.isFiringLightRay = true;
      const obstacleHitPoint = this.findLightRayCollision(
        this.lightRayTarget,
        target
      );
      this.hasLightRayObstacleHit = Boolean(obstacleHitPoint);
      if (obstacleHitPoint) {
        this.lightRayObstacleHitPoint.copy(obstacleHitPoint);
      }
    }
    /**
    * 光線メッシュの見た目を更新する
    * @param {number} now - 現在時刻
    * @param {Ball} target - 当たり判定を行うボール
    * @returns {boolean} ボールに命中した場合はtrue
    */
    updateLightRay(now, target) {
      if (!this.isFiringLightRay) {
        this.lightRayMesh.visible = false;
        return false;
      }
      const elapsed = now - this.lightRayStartedAt;
      const progress = this.lightRayTravelDuration > 0 ? Math.min(elapsed / this.lightRayTravelDuration, 1) : 1;
      this.lightRayDesiredEnd.lerpVectors(
        this.lightRayStart,
        this.lightRayTarget,
        progress
      );
      if (!this.lightRayStoppedAt) {
        const reachedObstacle = this.hasLightRayObstacleHit && this.lightRayStart.distanceToSquared(this.lightRayDesiredEnd) >= this.lightRayStart.distanceToSquared(this.lightRayObstacleHitPoint);
        if (reachedObstacle) {
          this.lightRayCurrentEnd.copy(this.lightRayObstacleHitPoint);
          this.lightRayStoppedAt = now;
        } else {
          this.lightRayCurrentEnd.copy(this.lightRayDesiredEnd);
          if (progress >= 1) this.lightRayStoppedAt = now;
        }
      }
      this.emitLightRay(this.lightRayStart, this.lightRayCurrentEnd);
      if (this.isLightRayHittingTarget(target)) {
        this.isFiringLightRay = false;
        this.lightRayMesh.visible = false;
        return true;
      }
      if (this.lightRayStoppedAt && now - this.lightRayStoppedAt >= _Snake.LIGHT_RAY_DURATION) {
        this.isFiringLightRay = false;
        this.lightRayMesh.visible = false;
      }
      return false;
    }
    /**
    * 光線の始点から現在の伸長予定位置までで最初に衝突する地点を返す
    * @param {THREE.Vector3} endPosition - 現在フレームの伸長予定位置
    * @param {Ball} target - ボール（既存の線分判定で別途処理する）
    * @returns {THREE.Vector3|null} 衝突地点。衝突しない場合はnull
    */
    findLightRayCollision(endPosition, target) {
      const from = new CANNON.Vec3(
        this.lightRayStart.x,
        this.lightRayStart.y,
        this.lightRayStart.z
      );
      const to = new CANNON.Vec3(
        endPosition.x,
        endPosition.y,
        endPosition.z
      );
      let closestDistance = Infinity;
      let hasHit = false;
      world.raycastAll(from, to, { skipBackfaces: true }, (result2) => {
        if (this.bodies.includes(result2.body) || result2.body === (target == null ? void 0 : target.body)) return;
        if (result2.distance >= closestDistance) return;
        closestDistance = result2.distance;
        this.lightRayHitPoint.set(
          result2.hitPointWorld.x,
          result2.hitPointWorld.y,
          result2.hitPointWorld.z
        );
        hasHit = true;
      });
      return hasHit ? this.lightRayHitPoint : null;
    }
    /**
    * 現在の光線を線分、ボールを球として接触判定を行う
    * @param {Ball} target - 判定対象のボール
    * @returns {boolean} 光線とボールが接触している場合はtrue
    */
    isLightRayHittingTarget(target) {
      var _a, _b, _c;
      if (this.isBattleFinished || !(target == null ? void 0 : target.body)) return false;
      this.rayDirection.subVectors(
        this.lightRayCurrentEnd,
        this.lightRayStart
      );
      const rayLengthSquared = this.rayDirection.lengthSq();
      if (rayLengthSquared < 1e-6) return false;
      this.ballPosition.set(
        target.body.position.x,
        target.body.position.y,
        target.body.position.z
      );
      this.rayToBall.subVectors(this.ballPosition, this.lightRayStart);
      const closestRate = THREE.MathUtils.clamp(
        this.rayToBall.dot(this.rayDirection) / rayLengthSquared,
        0,
        1
      );
      this.rayClosestPoint.copy(this.rayDirection).multiplyScalar(closestRate).add(this.lightRayStart);
      const ballShape = (_a = target.body.shapes) == null ? void 0 : _a[0];
      const ballRadius = (_c = (_b = ballShape == null ? void 0 : ballShape.radius) != null ? _b : ballShape == null ? void 0 : ballShape.boundingSphereRadius) != null ? _c : 1;
      const collisionRadius = ballRadius + _Snake.LIGHT_RAY_RADIUS;
      return this.rayClosestPoint.distanceToSquared(this.ballPosition) <= collisionRadius * collisionRadius;
    }
    /**
    * ボールへ向かって移動しつつ、通常時の顔の向きも更新する
    * @param {Ball} target - 操作対象のボール
    * @param {number} now - 現在時刻
    * @returns {void}
    */
    chase(target, now) {
      const targetPos = this.getTargetPosition(target);
      const head = this.bodies[0];
      const p = head.position;
      const dx = targetPos.x - p.x;
      const dz = targetPos.z - p.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 1e-3) return;
      this.faceYaw = Math.atan2(dx, dz);
      const deltaSeconds = Math.min(
        Math.max((now - this.lastChaseUpdateTime) / 1e3, 0),
        0.05
      );
      this.lastChaseUpdateTime = now;
      this.chaseSwayPhase += Math.PI * 2 * _Snake.CHASE_SWAY_FREQUENCY * deltaSeconds;
      const forwardX = dx / distance;
      const forwardZ = dz / distance;
      const sideX = forwardZ;
      const sideZ = -forwardX;
      const sway = Math.sin(this.chaseSwayPhase) * _Snake.CHASE_SWAY_STRENGTH;
      const moveX = forwardX + sideX * sway;
      const moveZ = forwardZ + sideZ * sway;
      const moveLength = Math.hypot(moveX, moveZ);
      const difficultyName = DifficultyNames[this.difficulty];
      const chaseForce = _Snake.CHASE_FORCE[difficultyName];
      const fx = moveX / moveLength * chaseForce;
      const fz = moveZ / moveLength * chaseForce;
      const forceVector = new CANNON.Vec3(fx, 0, fz);
      this.applyForce(forceVector, head);
    }
    /**
    * レーザー演出中の頭部位置を物理ボディへ適用し、
    * 全セグメントのビジュアルを物理演算の結果に合わせて更新する
    * @returns {void}
    */
    updateVisuals() {
      const isLightRaySequenceActive = this.isPreparingLightRay || this.isFiringLightRay;
      const targetHeadLift = isLightRaySequenceActive ? _Snake.WARNING_HEAD_LIFT : 0;
      const targetHeadCenterApproach = isLightRaySequenceActive ? _Snake.WARNING_HEAD_CENTER_APPROACH : 0;
      this.headVisualLift = THREE.MathUtils.lerp(
        this.headVisualLift,
        targetHeadLift,
        _Snake.HEAD_LIFT_LERP
      );
      this.headCenterApproach = THREE.MathUtils.lerp(
        this.headCenterApproach,
        targetHeadCenterApproach,
        _Snake.HEAD_CENTER_APPROACH_LERP
      );
      const head = this.bodies[0];
      const shouldControlHeadPose = isLightRaySequenceActive || this.headVisualLift > 0.01 || this.headCenterApproach > 1e-3;
      if (shouldControlHeadPose && !this.isHeadPoseControlled) {
        head.type = CANNON.Body.KINEMATIC;
        head.velocity.set(0, 0, 0);
        head.angularVelocity.set(0, 0, 0);
        head.updateMassProperties();
        this.isHeadPoseControlled = true;
      }
      const baseHeadX = head.position.x - this.appliedHeadCenterOffsetX;
      const baseHeadZ = head.position.z - this.appliedHeadCenterOffsetZ;
      let bodyCenterX = 0;
      let bodyCenterZ = 0;
      for (let i = 0; i < this.bodies.length; i++) {
        bodyCenterX += i === 0 ? baseHeadX : this.bodies[i].position.x;
        bodyCenterZ += i === 0 ? baseHeadZ : this.bodies[i].position.z;
      }
      bodyCenterX /= this.bodies.length;
      bodyCenterZ /= this.bodies.length;
      const nextCenterOffsetX = (bodyCenterX - baseHeadX) * this.headCenterApproach;
      const nextCenterOffsetZ = (bodyCenterZ - baseHeadZ) * this.headCenterApproach;
      head.position.x += nextCenterOffsetX - this.appliedHeadCenterOffsetX;
      head.position.y += this.headVisualLift - this.appliedHeadLift;
      head.position.z += nextCenterOffsetZ - this.appliedHeadCenterOffsetZ;
      head.aabbNeedsUpdate = true;
      head.wakeUp();
      this.appliedHeadLift = this.headVisualLift;
      this.appliedHeadCenterOffsetX = nextCenterOffsetX;
      this.appliedHeadCenterOffsetZ = nextCenterOffsetZ;
      if (!shouldControlHeadPose && this.isHeadPoseControlled) {
        head.position.x -= this.appliedHeadCenterOffsetX;
        head.position.y -= this.appliedHeadLift;
        head.position.z -= this.appliedHeadCenterOffsetZ;
        this.headVisualLift = 0;
        this.headCenterApproach = 0;
        this.appliedHeadLift = 0;
        this.appliedHeadCenterOffsetX = 0;
        this.appliedHeadCenterOffsetZ = 0;
        head.type = CANNON.Body.DYNAMIC;
        head.updateMassProperties();
        head.wakeUp();
        this.isHeadPoseControlled = false;
      }
      for (let i = 0; i < this.bodies.length; i++) {
        this.meshes[i].position.copy(
          this.bodies[i].position
        );
        if (i === 0) {
          this.meshes[i].rotation.set(0, this.faceYaw, 0);
          continue;
        }
        this.meshes[i].quaternion.copy(
          this.bodies[i].quaternion
        );
      }
    }
    /**
    * 光線メッシュを始点と終点の間に配置する
    * @param {THREE.Vector3} startPosition - 光線の始点
    * @param {THREE.Vector3} endPosition - 光線の現在の終点
    * @returns {void}
    */
    emitLightRay(startPosition, endPosition) {
      const mesh = this.lightRayMesh;
      this.rayDirection.subVectors(endPosition, startPosition);
      const length = this.rayDirection.length();
      if (length < 1e-3) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      this.rayMidPoint.addVectors(startPosition, endPosition).multiplyScalar(0.5);
      mesh.position.copy(this.rayMidPoint);
      mesh.scale.set(1, length, 1);
      mesh.quaternion.setFromUnitVectors(
        this.rayYAxis,
        this.rayDirection.normalize()
      );
    }
  };
  __publicField(_Snake, "CHASE_FORCE", {
    // 難易度ごとの追跡時に与える力
    "Tutorial": 77,
    "Easy": 70,
    "Normal": 77,
    "Hard": 85
  });
  __publicField(_Snake, "MAX_HP", {
    // 難易度ごとの最大HP
    "Tutorial": 100,
    "Easy": 50,
    "Normal": 90,
    "Hard": 150
  });
  __publicField(_Snake, "CHASE_SWAY_FREQUENCY", 0.8);
  // 追跡時に1秒間で左右へ揺れる回数
  __publicField(_Snake, "CHASE_SWAY_STRENGTH", 1);
  // 追跡方向に対する横方向の力の割合
  __publicField(_Snake, "WEAK_SEGMENT_DAMAGE_COEF", 3);
  // 弱点セグメントへのダメージ倍率
  __publicField(_Snake, "LIGHT_RAY_WARNING_DURATION", {
    // 光線発射前の予兆時間
    "Easy": 1500,
    "Normal": 1200,
    "Hard": 1e3
  });
  __publicField(_Snake, "LIGHT_RAY_SPEED", {
    // 光線が伸びる速さ
    "Tutorial": 50,
    "Easy": 50,
    "Normal": 90,
    "Hard": 150
  });
  __publicField(_Snake, "LIGHT_RAY_RADIUS", 0.15);
  // 光線の半径（描画・当たり判定共通）
  __publicField(_Snake, "LIGHT_RAY_MAX_DISTANCE", FIELD_RADIUS * 2.5);
  __publicField(_Snake, "LIGHT_RAY_COOLDOWN", 4e3);
  // 光線発射後の再待機時間
  // 光線が目標地点へ到達した後、その場に表示しておく時間
  __publicField(_Snake, "LIGHT_RAY_DURATION", 300);
  __publicField(_Snake, "WARNING_BLINK_INTERVAL", 150);
  // 予兆中の点滅周期
  __publicField(_Snake, "WARNING_HEAD_LIFT", 4);
  // 予兆中に持ち上げる頭の高さ
  __publicField(_Snake, "HEAD_LIFT_LERP", 0.1);
  // 頭の上下移動を補間する係数
  __publicField(_Snake, "WARNING_HEAD_CENTER_APPROACH", 0.3);
  // 予兆中に体の中心へ寄せる量
  __publicField(_Snake, "HEAD_CENTER_APPROACH_LERP", 0.12);
  // 頭のXZ寄せを補間する係数
  __publicField(_Snake, "initialPosition", { x: 0, z: -10 });
  var Snake = _Snake;

  // src/gameController.js
  var started = false;
  var ball = null;
  var cube = null;
  var snake = null;
  var opponent = null;
  var difficulty = null;
  var gameState = GameState.IDLE;
  var inputEnabledBeforePause = true;
  window.addEventListener("game-over", handleGameOver);
  window.addEventListener("game-clear", handleGameClear);
  window.addEventListener("back-to-mode-select", returnToModeSelect);
  function updateOpponentAndDifficulty(newOpponent, newDifficulty) {
    opponent = newOpponent;
    difficulty = newDifficulty;
  }
  function pauseGame() {
    var _a;
    if (!started || gameState !== GameState.PLAYING) return false;
    gameState = GameState.PAUSED;
    inputEnabledBeforePause = (_a = ball == null ? void 0 : ball.inputEnabled) != null ? _a : true;
    ball == null ? void 0 : ball.setInputEnabled(false);
    pauseGameClock();
    pauseBgm();
    return true;
  }
  function resumeGame() {
    if (gameState !== GameState.PAUSED) return false;
    gameState = GameState.PLAYING;
    resumeGameClock();
    ball == null ? void 0 : ball.setInputEnabled(inputEnabledBeforePause);
    resumeBgm();
    return true;
  }
  function handleGameOver() {
    if (gameState !== GameState.PLAYING) return;
    gameState = GameState.GAME_OVER;
    started = false;
    playGameOverBgm();
  }
  function handleGameClear() {
    if (gameState !== GameState.PLAYING) return;
    gameState = GameState.GAME_CLEAR;
    started = false;
    playGameClearBgm();
  }
  function returnToModeSelect() {
    destroyGame();
  }
  function runCleanup(label, cleanup) {
    try {
      cleanup();
    } catch (error) {
      console.warn(`${label}\u306E\u7834\u68C4\u306B\u5931\u6557\u3057\u307E\u3057\u305F`, error);
    }
  }
  function cleanupGameResources(cubeToDestroy = cube, snakeToDestroy = snake) {
    runCleanup("Cube\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EBUI", () => {
      var _a;
      (_a = cubeToDestroy == null ? void 0 : cubeToDestroy.tutorial) == null ? void 0 : _a.destroyUi();
    });
    runCleanup("Snake\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EBUI", () => {
      var _a;
      (_a = snakeToDestroy == null ? void 0 : snakeToDestroy.tutorial) == null ? void 0 : _a.destroyUi();
    });
    runCleanup("\u30D2\u30C3\u30C8\u30A8\u30D5\u30A7\u30AF\u30C8", resetHitEffects);
    runCleanup("\u30EC\u30F3\u30C0\u30E9\u30FC", destroyRenderer);
    runCleanup("\u7269\u7406\u30A8\u30F3\u30B8\u30F3", destroyPhysics);
  }
  function destroyGame() {
    started = false;
    gameState = GameState.IDLE;
    stopBgm();
    resetGameClock();
    cleanupGameResources();
    ball = null;
    cube = null;
    snake = null;
  }
  function startGame() {
    const selectedOpponent = Number(opponent);
    const selectedDifficulty = Number(difficulty);
    if (!Object.prototype.hasOwnProperty.call(DifficultyNames, selectedDifficulty)) {
      throw new Error(`\u672A\u5BFE\u5FDC\u306E\u96E3\u6613\u5EA6\u3067\u3059: ${difficulty}`);
    }
    if (selectedOpponent !== Opponent.CUBE && selectedOpponent !== Opponent.SNAKE) {
      throw new Error(`\u672A\u5BFE\u5FDC\u306E\u5BFE\u6226\u76F8\u624B\u3067\u3059: ${opponent}`);
    }
    let nextBall = null;
    let nextCube = null;
    let nextSnake = null;
    started = false;
    gameState = GameState.IDLE;
    resetGameClock();
    try {
      initRenderer();
      initPhysics();
      nextBall = new Ball();
      if (selectedDifficulty === Difficulty.TUTORIAL) {
        nextBall.setInputEnabled(false);
      }
      if (selectedOpponent === Opponent.CUBE) {
        nextCube = new Cube(selectedDifficulty);
      } else {
        nextSnake = new Snake(selectedDifficulty);
      }
      ball = nextBall;
      cube = nextCube;
      snake = nextSnake;
      playGameBgm(selectedDifficulty === Difficulty.TUTORIAL);
      gameState = GameState.PLAYING;
      started = true;
    } catch (error) {
      cleanupGameResources(nextCube, nextSnake);
      stopBgm();
      resetGameClock();
      ball = null;
      cube = null;
      snake = null;
      started = false;
      gameState = GameState.IDLE;
      throw error;
    }
  }
  function judgeCanJump(physicsWorld) {
    const normal = new CANNON.Vec3();
    for (const c of physicsWorld.contacts) {
      if (c.bi !== ball.body && c.bj !== ball.body) continue;
      if (c.bi === ball.body) {
        c.ni.negate(normal);
      } else {
        normal.copy(c.ni);
      }
      if (normal.y < 0.5) continue;
      return true;
    }
    return false;
  }
  function updateGameState(dt) {
    if (!started || gameState !== GameState.PLAYING || !world || !(ball == null ? void 0 : ball.body) || !(ball == null ? void 0 : ball.mesh)) return;
    ball.canJump = judgeCanJump(world);
    ball.update(dt);
    switch (Number(opponent)) {
      case Opponent.CUBE:
        if (cube) cube.update(ball);
        break;
      case Opponent.SNAKE:
        if (snake) snake.update(ball);
        break;
    }
    world.step(1 / 60, dt, 3);
  }

  // src/ui/titlePage.js
  window.addEventListener("title-exit", () => {
    const startOverlay = document.getElementById("start-overlay");
    if (startOverlay)
      startOverlay.remove();
  });
  function showTitlePage() {
    const startOverlay = document.createElement("div");
    startOverlay.id = "start-overlay";
    const titleText = document.createElement("h1");
    titleText.id = "title-start-page";
    titleText.textContent = "\u{1F300} \u30ED\u30FC\u30EA\u30F3\u30B0 \u30D0\u30C8\u30EB";
    const descriptionText = document.createElement("p");
    descriptionText.id = "description-start-page";
    descriptionText.textContent = "\u30DC\u30FC\u30EB\u3092\u64CD\u4F5C\u3057\u3001\u76F8\u624B\u306B\u4F53\u5F53\u305F\u308A\u3092\u3057\u3066\u5012\u305D\u3046\uFF01";
    const startBtn = document.createElement("button");
    startBtn.id = "start-btn";
    startBtn.textContent = "\u30B9\u30BF\u30FC\u30C8\uFF01";
    startBtn.addEventListener("click", setupGameScreen);
    startOverlay.appendChild(titleText);
    startOverlay.appendChild(descriptionText);
    startOverlay.appendChild(startBtn);
    document.body.appendChild(startOverlay);
  }

  // src/ui/modeSelectPage.js
  function showModeSelectPage() {
    const modeSelectOverlay = document.createElement("div");
    modeSelectOverlay.id = "mode-select-overlay";
    const titleText = document.createElement("h1");
    titleText.id = "title-mode-select-page";
    titleText.textContent = "\u96E3\u6613\u5EA6\u9078\u629E";
    const selectionPanel = document.createElement("div");
    selectionPanel.className = "difficulty-selection-panel";
    const opponentIntro = document.createElement("section");
    opponentIntro.className = "opponent-intro";
    opponentIntro.setAttribute("aria-label", "\u5BFE\u6226\u76F8\u624B");
    const opponentImageFrame = document.createElement("div");
    opponentImageFrame.className = "opponent-image-frame";
    const snakeEnemyImg = document.createElement("img");
    snakeEnemyImg.className = "opponent-enemy-img";
    snakeEnemyImg.src = "asset/img/snake.png";
    snakeEnemyImg.alt = "\u5BFE\u6226\u76F8\u624B\u306E\u30B9\u30CD\u30FC\u30AF";
    const opponentTextWrapper = document.createElement("div");
    opponentTextWrapper.className = "opponent-text-wrapper";
    const opponentLabel = document.createElement("span");
    opponentLabel.className = "selection-label";
    opponentLabel.textContent = "\u5BFE\u6226\u76F8\u624B";
    const opponentName = document.createElement("strong");
    opponentName.className = "opponent-name";
    opponentName.textContent = "SNAKE";
    opponentImageFrame.appendChild(snakeEnemyImg);
    opponentTextWrapper.appendChild(opponentLabel);
    opponentTextWrapper.appendChild(opponentName);
    opponentIntro.appendChild(opponentImageFrame);
    opponentIntro.appendChild(opponentTextWrapper);
    const tutorialSection = document.createElement("section");
    tutorialSection.className = "tutorial-selection-section";
    const tutorialLabel = document.createElement("h2");
    tutorialLabel.className = "selection-section-title";
    tutorialLabel.textContent = "\u306F\u3058\u3081\u3066\u904A\u3076\u65B9";
    const difficultySection = document.createElement("section");
    difficultySection.className = "difficulty-selection-section";
    const difficultyLabel = document.createElement("h2");
    difficultyLabel.className = "selection-section-title";
    difficultyLabel.textContent = "\u96E3\u6613\u5EA6";
    const difficultyButtons = document.createElement("div");
    difficultyButtons.className = "difficulty-select-ui-wrapper";
    const tutorialBtn = createDifficultyButton(
      "\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EB",
      "tutorial-btn",
      Difficulty.TUTORIAL
    );
    const easyBtn = createDifficultyButton(
      "\u304B\u3093\u305F\u3093",
      "easy-btn",
      Difficulty.EASY
    );
    const mediumBtn = createDifficultyButton(
      "\u3075\u3064\u3046",
      "medium-btn",
      Difficulty.NORMAL
    );
    const hardBtn = createDifficultyButton(
      "\u3080\u305A\u304B\u3057\u3044",
      "hard-btn",
      Difficulty.HARD
    );
    const difficultyBtns = [tutorialBtn, easyBtn, mediumBtn, hardBtn];
    tutorialSection.appendChild(tutorialLabel);
    tutorialSection.appendChild(tutorialBtn);
    difficultyButtons.appendChild(easyBtn);
    difficultyButtons.appendChild(mediumBtn);
    difficultyButtons.appendChild(hardBtn);
    difficultySection.appendChild(difficultyLabel);
    difficultySection.appendChild(difficultyButtons);
    selectionPanel.appendChild(opponentIntro);
    selectionPanel.appendChild(tutorialSection);
    selectionPanel.appendChild(difficultySection);
    const gameStartBtn = document.createElement("button");
    gameStartBtn.id = "game-start-btn";
    gameStartBtn.type = "button";
    const gyroStatus = document.createElement("p");
    gyroStatus.id = "gyro-start-status";
    gyroStatus.setAttribute("role", "status");
    gyroStatus.setAttribute("aria-live", "polite");
    let selectedDifficulty = Difficulty.EASY;
    let isStarting = false;
    difficultyBtns.forEach((button) => {
      button.addEventListener("click", () => updateSelectedElm(button));
    });
    gameStartBtn.addEventListener("click", () => __async(null, null, function* () {
      if (isStarting) return;
      isStarting = true;
      setSelectionEnabled(false);
      if (isMobileDevice()) {
        gameStartBtn.textContent = "\u30B8\u30E3\u30A4\u30ED\u8ABF\u6574\u4E2D\u2026";
        gyroStatus.textContent = "\u7AEF\u672B\u3092\u6A2A\u5411\u304D\u306B\u6301\u3061\u3001\u52D5\u304B\u3055\u305A\u306B\u304A\u5F85\u3061\u304F\u3060\u3055\u3044";
        resetCalibration();
        const gyroResult = yield requestGyro();
        if (!gyroResult.ok) {
          isStarting = false;
          setSelectionEnabled(true);
          updateStartButtonText();
          gyroStatus.textContent = getGyroFailureMessage(
            gyroResult.reason
          );
          return;
        }
      } else {
        gameStartBtn.textContent = "\u30B2\u30FC\u30E0\u3092\u958B\u59CB\u3057\u3066\u3044\u307E\u3059\u2026";
      }
      window.dispatchEvent(new CustomEvent("game-start"));
    }));
    modeSelectOverlay.appendChild(titleText);
    modeSelectOverlay.appendChild(selectionPanel);
    modeSelectOverlay.appendChild(gameStartBtn);
    modeSelectOverlay.appendChild(gyroStatus);
    document.body.appendChild(modeSelectOverlay);
    const handleGameStarted = () => {
      window.removeEventListener("game-start-failed", handleGameStartFailed);
      modeSelectOverlay.remove();
    };
    const handleGameStartFailed = (event) => {
      var _a, _b;
      if (!modeSelectOverlay.isConnected) return;
      isStarting = false;
      setSelectionEnabled(true);
      updateStartButtonText();
      gyroStatus.textContent = (_b = (_a = event.detail) == null ? void 0 : _a.message) != null ? _b : "\u30B2\u30FC\u30E0\u3092\u958B\u59CB\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002";
    };
    window.addEventListener("game-started", handleGameStarted, { once: true });
    window.addEventListener("game-start-failed", handleGameStartFailed);
    updateSelectedElm(easyBtn);
    function updateSelectedElm(selectedElm) {
      difficultyBtns.forEach((button) => {
        const isSelected = button === selectedElm;
        button.classList.toggle("selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
      });
      selectedDifficulty = Number(selectedElm.dataset.difficulty);
      updateOpponentAndDifficulty(Opponent.SNAKE, selectedDifficulty);
      updateStartButtonText();
      gyroStatus.textContent = "";
    }
    function updateStartButtonText() {
      gameStartBtn.textContent = selectedDifficulty === Difficulty.TUTORIAL ? "\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EB\u958B\u59CB" : "\u30B2\u30FC\u30E0\u958B\u59CB";
    }
    function setSelectionEnabled(enabled) {
      gameStartBtn.disabled = !enabled;
      difficultyBtns.forEach((button) => {
        button.disabled = !enabled;
      });
    }
  }
  function getGyroFailureMessage(reason) {
    switch (reason) {
      case GyroFailureReason.PERMISSION_DENIED:
        return "\u30B8\u30E3\u30A4\u30ED\u306E\u5229\u7528\u304C\u8A31\u53EF\u3055\u308C\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u30D6\u30E9\u30A6\u30B6\u306E\u6A29\u9650\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044";
      case GyroFailureReason.PERMISSION_ERROR:
        return "\u30B8\u30E3\u30A4\u30ED\u306E\u5229\u7528\u8A31\u53EF\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044";
      case GyroFailureReason.SENSOR_UNAVAILABLE:
        return "\u7AEF\u672B\u304B\u3089\u30BB\u30F3\u30B5\u30FC\u5024\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u5BFE\u5FDC\u30D6\u30E9\u30A6\u30B6\u3067\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044";
      case GyroFailureReason.CALIBRATION_TIMEOUT:
        return "\u30B8\u30E3\u30A4\u30ED\u8ABF\u6574\u304C\u6642\u9593\u5185\u306B\u5B8C\u4E86\u3057\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u7AEF\u672B\u3092\u52D5\u304B\u3055\u305A\u306B\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044";
      case GyroFailureReason.UNSUPPORTED:
        return "\u3053\u306E\u7AEF\u672B\u307E\u305F\u306F\u30D6\u30E9\u30A6\u30B6\u306F\u30B8\u30E3\u30A4\u30ED\u64CD\u4F5C\u306B\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u305B\u3093";
      default:
        return "\u30B8\u30E3\u30A4\u30ED\u3092\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044";
    }
  }
  function createDifficultyButton(text, className, difficulty2) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `difficulty-btn ${className}`;
    button.textContent = text;
    button.dataset.difficulty = difficulty2;
    button.setAttribute("aria-pressed", "false");
    return button;
  }

  // src/ui/gameOverPage.js
  function showGameOverPage() {
    const overlay = document.createElement("div");
    overlay.classList.add("game-over-overlay");
    const modal = document.createElement("div");
    modal.classList.add("game-over-modal");
    const title = document.createElement("h1");
    title.classList.add("game-over-title");
    title.textContent = "GAME OVER";
    const opponentText = document.createElement("p");
    opponentText.classList.add("game-over-text");
    opponentText.textContent = `\u6575\uFF1A${getEnumKey(Opponent, opponent)}`;
    const difficultyText = document.createElement("p");
    difficultyText.classList.add("game-over-text");
    difficultyText.textContent = `\u96E3\u6613\u5EA6\uFF1A${getEnumKey(Difficulty, difficulty)}`;
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("game-over-btn-container");
    const retryButton = document.createElement("button");
    retryButton.classList.add("game-over-btn", "game-over-btn-retry");
    retryButton.textContent = "\u30EA\u30C8\u30E9\u30A4";
    const modeSelectButton = document.createElement("button");
    modeSelectButton.classList.add("game-over-btn", "game-over-btn-mode");
    modeSelectButton.textContent = "\u30E2\u30FC\u30C9\u9078\u629E\u306B\u623B\u308B";
    retryButton.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("game-start"));
    });
    window.addEventListener("game-started", () => overlay.remove(), { once: true });
    modeSelectButton.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("back-to-mode-select"));
      overlay.remove();
    });
    buttonContainer.appendChild(retryButton);
    buttonContainer.appendChild(modeSelectButton);
    modal.appendChild(title);
    modal.appendChild(opponentText);
    modal.appendChild(difficultyText);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // src/ui/gameClearPage.js
  function showGameClearPage() {
    const overlay = document.createElement("div");
    overlay.classList.add("game-clear-overlay");
    const modal = document.createElement("div");
    modal.classList.add("game-clear-modal");
    const title = document.createElement("h1");
    title.classList.add("game-clear-title");
    title.textContent = "GAME CLEAR!";
    const opponentText = document.createElement("p");
    opponentText.classList.add("game-clear-text");
    opponentText.textContent = `\u6483\u7834\u3057\u305F\u6575\uFF1A${getEnumKey(Opponent, opponent)}`;
    const difficultyText = document.createElement("p");
    difficultyText.classList.add("game-clear-text");
    difficultyText.textContent = `\u96E3\u6613\u5EA6\uFF1A${getEnumKey(Difficulty, difficulty)}`;
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("game-clear-btn-container");
    const retryButton = document.createElement("button");
    retryButton.classList.add("game-clear-btn", "game-clear-btn-retry");
    retryButton.textContent = "\u3082\u3046\u4E00\u5EA6\u904A\u3076";
    const modeSelectButton = document.createElement("button");
    modeSelectButton.classList.add("game-clear-btn", "game-clear-btn-mode");
    modeSelectButton.textContent = "\u30E2\u30FC\u30C9\u9078\u629E\u306B\u623B\u308B";
    retryButton.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("game-start"));
    });
    window.addEventListener("game-started", () => overlay.remove(), { once: true });
    modeSelectButton.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("back-to-mode-select"));
      overlay.remove();
    });
    buttonContainer.appendChild(retryButton);
    buttonContainer.appendChild(modeSelectButton);
    modal.appendChild(title);
    modal.appendChild(opponentText);
    modal.appendChild(difficultyText);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // src/router.js
  function registerRouterEvents() {
    window.addEventListener("load", showTitlePage);
    window.addEventListener("title-exit", showModeSelectPage);
    window.addEventListener("game-over", showGameOverPage);
    window.addEventListener("game-clear", showGameClearPage);
    window.addEventListener("back-to-mode-select", showModeSelectPage);
  }

  // src/input/touch.js
  var currentBall2 = null;
  var registered2 = false;
  function registerTouchEvent(ball2) {
    currentBall2 = ball2;
    if (registered2) return;
    registered2 = true;
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
  }
  function handleTouchStart(event) {
    const target = event.target;
    if (target instanceof Element && target.closest(
      'button, a, input, select, textarea, [role="button"], [data-no-jump]'
    )) return;
    currentBall2 == null ? void 0 : currentBall2.triggerJump();
  }

  // src/ui/pausePage.js
  var pauseButton = null;
  var pauseOverlay = null;
  function registerPauseUi() {
    window.addEventListener("game-started", showPauseButton);
    window.addEventListener("game-over", removePauseUi);
    window.addEventListener("game-clear", removePauseUi);
    window.addEventListener("back-to-mode-select", removePauseUi);
    document.addEventListener("keydown", handleEscapeKey);
  }
  function showPauseButton() {
    removePauseUi();
    pauseButton = document.createElement("button");
    pauseButton.id = "pause-button";
    pauseButton.type = "button";
    pauseButton.textContent = "\u23F8";
    pauseButton.setAttribute("aria-label", "\u30B2\u30FC\u30E0\u3092\u30DD\u30FC\u30BA\u3059\u308B");
    pauseButton.addEventListener("click", openPauseOverlay);
    document.body.appendChild(pauseButton);
  }
  function openPauseOverlay() {
    if (!pauseGame()) return;
    pauseOverlay = document.createElement("div");
    pauseOverlay.className = "pause-overlay";
    const modal = document.createElement("div");
    modal.className = "pause-modal";
    const title = document.createElement("h2");
    title.className = "pause-title";
    title.textContent = "PAUSE";
    const resumeButton = document.createElement("button");
    resumeButton.className = "pause-menu-button pause-resume-button";
    resumeButton.type = "button";
    resumeButton.textContent = "\u30B2\u30FC\u30E0\u306B\u623B\u308B";
    resumeButton.addEventListener("click", closePauseOverlay, { once: true });
    const modeSelectButton = document.createElement("button");
    modeSelectButton.className = "pause-menu-button pause-mode-button";
    modeSelectButton.type = "button";
    modeSelectButton.textContent = "\u30E2\u30FC\u30C9\u9078\u629E\u306B\u623B\u308B";
    modeSelectButton.addEventListener("click", () => {
      removePauseUi();
      window.dispatchEvent(new CustomEvent("back-to-mode-select"));
    }, { once: true });
    modal.appendChild(title);
    modal.appendChild(resumeButton);
    modal.appendChild(modeSelectButton);
    pauseOverlay.appendChild(modal);
    document.body.appendChild(pauseOverlay);
  }
  function closePauseOverlay() {
    resumeGame();
    pauseOverlay == null ? void 0 : pauseOverlay.remove();
    pauseOverlay = null;
  }
  function removePauseUi() {
    pauseOverlay == null ? void 0 : pauseOverlay.remove();
    pauseButton == null ? void 0 : pauseButton.remove();
    pauseOverlay = null;
    pauseButton = null;
  }
  function handleEscapeKey(event) {
    if (event.code !== "Escape" || gameState !== GameState.PLAYING && gameState !== GameState.PAUSED) return;
    if (gameState === GameState.PAUSED) {
      closePauseOverlay();
    } else {
      openPauseOverlay();
    }
  }

  // src/main.js
  var CAM_DIST = 14;
  var CAM_HEIGHT = 8;
  var lastTime = performance.now();
  var camTarget = new THREE.Vector3();
  registerRouterEvents();
  registerPauseUi();
  registerBgmEvents();
  showControlHint();
  animate();
  window.addEventListener("game-start", init);
  function showControlHint() {
    const controlHint = document.getElementById("keyboard-hint");
    if (!controlHint) return;
    controlHint.textContent = isMobileDevice() ? "\u79FB\u52D5\uFF1A\u7AEF\u672B\u3092\u50BE\u3051\u308B\u3000\u30B8\u30E3\u30F3\u30D7\uFF1A\u753B\u9762\u3092\u30BF\u30C3\u30D7" : "\u79FB\u52D5\uFF1AWASD / \u77E2\u5370\u30AD\u30FC\u3000\u30B8\u30E3\u30F3\u30D7\uFF1A\u30B9\u30DA\u30FC\u30B9\u30AD\u30FC";
  }
  function init() {
    var _a;
    try {
      destroyGame();
      startGame();
      if (!((_a = ball) == null ? void 0 : _a.mesh) || !renderer || !scene || !camera || !ballLight || !neonLight1 || !neonLight2) {
        throw new Error("\u30B2\u30FC\u30E0\u306E\u5FC5\u9808\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3092\u751F\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
      }
      setupEvents();
      lastTime = performance.now();
      renderer.render(scene, camera);
      window.dispatchEvent(new CustomEvent("game-started"));
    } catch (error) {
      console.error("\u30B2\u30FC\u30E0\u306E\u521D\u671F\u5316\u306B\u5931\u6557\u3057\u307E\u3057\u305F", error);
      try {
        destroyGame();
      } catch (cleanupError) {
        console.error("\u521D\u671F\u5316\u5931\u6557\u5F8C\u306E\u5F8C\u59CB\u672B\u306B\u5931\u6557\u3057\u307E\u3057\u305F", cleanupError);
      }
      window.dispatchEvent(new CustomEvent("game-start-failed", {
        detail: {
          message: "\u30B2\u30FC\u30E0\u3092\u958B\u59CB\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"
        }
      }));
    }
  }
  function setupEvents() {
    registerKeyEvent(ball);
    registerTouchEvent(ball);
  }
  function animate() {
    var _a;
    requestAnimationFrame(animate);
    if (!started || !((_a = ball) == null ? void 0 : _a.mesh) || !renderer || !scene || !camera || !ballLight || !neonLight1 || !neonLight2) return;
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1e3, 0.05);
    lastTime = now;
    updateGameState(dt);
    updateHitEffects(dt);
    ballLight.position.copy(ball.mesh.position);
    ballLight.position.y += 0.5;
    beginCameraFrame(camera);
    camTarget.lerp(ball.mesh.position, 0.08);
    const camOffsetX = -Math.sin(ball.heading) * CAM_DIST;
    const camOffsetZ = Math.cos(ball.heading) * CAM_DIST;
    camera.position.lerp(
      new THREE.Vector3(camTarget.x + camOffsetX, camTarget.y + CAM_HEIGHT, camTarget.z + camOffsetZ),
      0.07
    );
    applyCameraShake(camera);
    camera.lookAt(camTarget);
    const t = now / 1e3;
    neonLight1.position.x = Math.sin(t * 0.3) * 25;
    neonLight1.position.z = Math.cos(t * 0.3) * 25;
    neonLight2.position.x = Math.cos(t * 0.4) * 25;
    neonLight2.position.z = Math.sin(t * 0.4) * 25;
    renderer.render(scene, camera);
  }
})();
