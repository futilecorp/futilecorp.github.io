import {
	Scene,
	PerspectiveCamera,
	OrthographicCamera,
	WebGLRenderer,
	LineBasicMaterial,
	MeshPhongMaterial,
	Mesh,
	SphereGeometry,
	Group,
	AmbientLight,
	DirectionalLight,
	TextureLoader,
	LineSegments,
	Raycaster,
	Vector2,
	Vector3,
	DoubleSide
} from 'three';
import {CSS2DRenderer} from 'three/addons/renderers/CSS2DRenderer.js';
import {InteractionManager} from 'three.interactive';

import {TrackballControls} from 'three/examples/jsm/controls/TrackballControls'
import {ArcballControls} from 'three/addons/controls/ArcballControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {GeoJsonGeometry} from 'three-geojson-geometry';
import graticule from '../node_modules/d3-geo/src/graticule';
import {TWEEN} from 'three/examples/jsm/libs/tween.module.min'

var darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

const glRenderer = new WebGLRenderer({alpha: true});
document.body.appendChild(glRenderer.domElement);
// overlay additional on top of main renderer
glRenderer.domElement.style.position = 'absolute';
glRenderer.domElement.style.zIndex = 1;
glRenderer.domElement.style.top = 0;
// glRenderer.domElement.style.pointerEvents = 'none';

const scene = new Scene();
const camera = new PerspectiveCamera();
// const camera = new OrthographicCamera();
camera.position.set(0, 0, 1000);

const controls = new TrackballControls(camera, glRenderer.domElement);
controls.noPan = true;
controls.minDistance = 130;
controls.maxDistance = 45000;
controls.rotateSpeed = 3;
controls.zoomSpeed = 0.8;

// const controls = new ArcballControls(camera, glRenderer.domElement, scene);
// controls.setGizmosVisible(false);
// controls.enablePan = false;
// controls.minDistance = 130;
// controls.maxDistance = 45000;

camera.far = controls.maxDistance + 1;

// move globe slightly off center (20% to the right)
// camera.setViewOffset(window.innerWidth, window.innerHeight, -.2 * window.innerWidth, 0, window.innerWidth, window.innerHeight);
// const cssRenderer = new CSS2DRenderer();
// glRenderer.domElement.appendChild(cssRenderer.domElement);
// cssRenderer.domElement.style.position = 'absolute';
// cssRenderer.domElement.style.zIndex = 0;
// cssRenderer.domElement.style.top = 0;

scene.add(new AmbientLight(0xbbbbbb));
scene.add(new DirectionalLight(0xffffff, 0.6));

const globalGroup = new Group();
// globalGroup.order = "ZYX";
scene.rotateY(1.8);
scene.rotateZ(.5);
scene.add(globalGroup);

// GLOBE
const N_TILES = [24, 18]; // long, lat
const USABLE_LATITUDES = 10; // don't use top/bottom 3
const tileWidth = 360 / N_TILES[0];
const tileHeight = 180 / N_TILES[1];
const GLOBE_RADIUS = 100;

const graticuleGen = graticule();
graticuleGen.stepMajor([90, 360]);
graticuleGen.stepMinor([tileWidth, tileHeight]);
const graticulesObj = new LineSegments(
	new GeoJsonGeometry(graticuleGen(), GLOBE_RADIUS, 2),
	new LineBasicMaterial({transparent: true, opacity: 0.4})
);
globalGroup.add(graticulesObj);

// GLOBE BLOOM
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = .2;
bloomPass.radius = .001;

const composer = new EffectComposer(glRenderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

const onResize = () => {
	var width = window.innerWidth;
	var height = window.innerHeight;
	// cssRenderer.setSize(width, height);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	glRenderer.setSize(width, height);
	composer.setSize(width, height);
	controls.handleResize();
};
window.addEventListener('resize', onResize);
onResize();


// PROJECT IMAGES
const textureLoader = new TextureLoader();
const projects = ['everythingisinterestingonce', 'landuse', 'borderlands', 'theview', 'za', 'everybodyelse'];
const materials = projects.map((s) =>
	new MeshPhongMaterial({
		map: textureLoader.load(
			'https://res.cloudinary.com/futile/f_auto,q_auto/k/' + s + '.jpg'
		),
		side: DoubleSide
	}),
);
const longitudes = [0];
projects.forEach((p, i) => {
	longitudes.push(longitudes[i] + 1 + Math.floor(Math.random() * 4));
});
const latitudes = projects.map(() => (N_TILES[1] - USABLE_LATITUDES) / 2 + Math.floor(Math.random() * USABLE_LATITUDES));


const group = new Group();
// horizontal, then vertical
projects.forEach((p, i) => {
	const geometry = new SphereGeometry(GLOBE_RADIUS, 3, 2, longitudes[i] * 2 * Math.PI / N_TILES[0], 2 * Math.PI / N_TILES[0], latitudes[i] * Math.PI / N_TILES[1], Math.PI / N_TILES[1]);
	const sphere = new Mesh(geometry, materials[i]);
	sphere.name = p;
	group.add(sphere);
});
globalGroup.add(group);

// function Element(id, x, y, z, ry) {

// 	const div = document.createElement('div');
// 	div.style.width = '100px';
// 	div.style.height = '100px';
// 	div.style.backgroundColor = '#000';

// 	const img = document.createElement('img');
// 	img.src = 'img/deathiscoming.jpg';
// 	div.appendChild(img);

// 	const object = new CSS3DObject(div);
// 	object.position.set(x, y, z);
// 	object.rotation.y = ry;

// 	return object;
// }


// INTERACTIONS
const interactionManager = new InteractionManager(
	glRenderer,
	camera,
	glRenderer.domElement
);

const overlay = document.getElementById('overlay');
const close = document.getElementById('close');
close.onclick = (e) => {
	overlay.classList = '';
};
const content = document.getElementById('content');

// add hover + click actions for every project image
const SCALE = 1.05;
const SCALE_INC = .005;

group.children.forEach((p) => {
	interactionManager.add(p);
	p.addEventListener('mouseover', (e) => {
		// e.target.scale.setScalar(SCALE);
		glRenderer.domElement.style.cursor = 'pointer';
	});
	p.addEventListener('mouseout', (e) => {
		e.target.scale.setScalar(1);
		glRenderer.domElement.style.cursor = 'initial';
	});
	p.addEventListener('click', (e) => {
		const scaled = e.target;
		const phi = -Math.PI / 2 + scaled.geometry.parameters.phiStart + Math.PI / N_TILES[0]; // left/right
		const theta = scaled.geometry.parameters.thetaStart + Math.PI / (2 * N_TILES[1]); // top/down
		const dist = 1.3 * GLOBE_RADIUS;

		const focus = new Vector3(dist * Math.sin(theta) * Math.sin(phi), dist * Math.cos(theta), dist * Math.sin(theta) * Math.cos(phi));
		focus.applyEuler(globalGroup.rotation);
		focus.applyEuler(scene.rotation);

		const up = new Vector3(0, 1, 0);
		up.applyEuler(globalGroup.rotation);
		up.applyEuler(scene.rotation);

		// const easing = TWEEN.Easing.Back.In;
		const easing = TWEEN.Easing.Circular.InOut;
		const easeTime = 2000;
		// camera.position.copy(focus);
		if (false) {
			// move position directly through space (potentially through the globe itself)
			new TWEEN.Tween(camera.position).to(focus, easeTime).easing(easing).start();
		} else {
			// TODO move rotation and distance, guaranteeing a movement *around* the globe
			new TWEEN.Tween(camera.position).to(focus, easeTime).easing(easing).start();
		}
		content.src = "https://about.thiswasyouridea.com/" + scaled.name;
		new TWEEN.Tween(camera.up).to(up, easeTime).easing(easing).start().onComplete((e) => {
			overlay.classList = 'visible';
		});
	})
});

const setColors = () => {
	glRenderer.setClearColor(darkMode ? 0x000000 : 0xffffff);
	graticulesObj.material.color.set(darkMode ? 'white' : 'black');
};
setColors();
document.getElementById('darkmode').checked = darkMode;
document.getElementById('darkmode').addEventListener('click', (e) => {
	darkMode = e.target.checked;
	setColors();
});

var untouched = true;
controls.addEventListener('change', (e) => {
	untouched = false;
});

function animate() {
	requestAnimationFrame(animate);
	interactionManager.update();
	if (untouched) {
		globalGroup.rotation.y += .01;
		// globalGroup.rotation.x += .01;
	}
	controls.update();
	// camera position has been updated based on zooming, apply updated center shift based on it
	// offset is 0 at tbControls.minDistance, -.2 (20% to the right) at 1000
	const dist = camera.position.length()
	camera.setViewOffset(window.innerWidth, window.innerHeight, -window.innerWidth * Math.log(1 + dist - controls.minDistance) / 25, 0, window.innerWidth, window.innerHeight);
	bloomPass.strength = Math.min(.5, .1 + (dist - controls.minDistance) / 1000);

	TWEEN.update();

	if (darkMode) {
		composer.render();
	} else {
		glRenderer.render(scene, camera);
	}
}
animate();
