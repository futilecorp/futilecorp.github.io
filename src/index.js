import {
	AxesHelper,
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

const GLOBE_RADIUS = 100;

const scene = new Scene();
const camera = new PerspectiveCamera();
camera.position.set(0, 0, GLOBE_RADIUS * 7);

const zoomCamera = (diff) => {
	const newPosition = camera.position.z * (1 + diff);
	camera.position.z = Math.min(camera.far, Math.max(GLOBE_RADIUS * 1.2, newPosition));
	// camera.position.x = newPosition / -2;
	// graticulesObj.rotation.x = 0;
	// graticulesObj.rotation.z = 0;
	// graticulesObj.rotation.z = - Math.min(.7, Math.max(0, graticulesObj.rotation.z + diff / 100)); // tilt to side
};
glRenderer.domElement.addEventListener('wheel', (e) => {
	e.preventDefault();
	zoomCamera(e.deltaY / 500);
});
// TODO implement pinching https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures

// move globe slightly off center (20% to the right)
// camera.setViewOffset(window.innerWidth, window.innerHeight, -.2 * window.innerWidth, 0, window.innerWidth, window.innerHeight);
// const cssRenderer = new CSS2DRenderer();
// glRenderer.domElement.appendChild(cssRenderer.domElement);
// cssRenderer.domElement.style.position = 'absolute';
// cssRenderer.domElement.style.zIndex = 0;
// cssRenderer.domElement.style.top = 0;

scene.add(new AmbientLight(0xbbbbbb));
scene.add(new DirectionalLight(0xffffff, 0.6));

// GLOBE
const N_TILES = [24, 18]; // long, lat
const USABLE_LATITUDES = 8; // don't use top/bottom 4
const tileWidth = 360 / N_TILES[0];
const tileHeight = 180 / N_TILES[1];
camera.far = 100 * GLOBE_RADIUS;

const graticuleGen = graticule();
graticuleGen.stepMajor([90, 360]);
graticuleGen.stepMinor([tileWidth, tileHeight]);
const graticulesObj = new LineSegments(
	new GeoJsonGeometry(graticuleGen(), GLOBE_RADIUS, 2),
	new LineBasicMaterial({
		opacity: 0.4,
		linewidth: 2,
		transparent: true,
	})
);
graticulesObj.rotation.order = 'ZXY';
graticulesObj.rotation.z = -.7; // tilt to side
graticulesObj.rotation.x = .7; // tilt slightly to front
scene.add(graticulesObj);
// camera.up.applyAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);

// GLOBE BLOOM
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = .2;
bloomPass.radius = .001;

const composer = new EffectComposer(glRenderer);
composer.addPass(renderScene);
// composer.addPass(bloomPass);

const onResize = () => {
	var width = window.innerWidth;
	var height = window.innerHeight;
	// cssRenderer.setSize(width, height);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	glRenderer.setSize(width, height);
	composer.setSize(width, height);
	// controls.handleResize();
};
window.addEventListener('resize', onResize);
onResize();


// PROJECT IMAGES
const textureLoader = new TextureLoader();
const projects = ['localmeantime', 'everythingisinterestingonce', 'landuse', 'borderlands', 'theview', 'za', 'everybodyelse'];
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


// horizontal, then vertical
projects.forEach((p, i) => {
	const geometry = new SphereGeometry(GLOBE_RADIUS, 3, 2, longitudes[i] * 2 * Math.PI / N_TILES[0], 2 * Math.PI / N_TILES[0], latitudes[i] * Math.PI / N_TILES[1], Math.PI / N_TILES[1]);
	const sphere = new Mesh(geometry, materials[i]);
	sphere.name = p;
	graticulesObj.add(sphere);
});

// const axesHelper = new AxesHelper(5);
// scene.add(axesHelper);

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

// const easing = TWEEN.Easing.Back.In;
const easing = TWEEN.Easing.Circular.InOut;
const easeTime = 2000;
const title = document.title;
const header = document.getElementById('title');
const setTitle = (t) => {
	document.title = t;
	header.textContent = t;
};
const overlay = document.getElementById('overlay');
const content = document.getElementById('content');
const close = document.getElementById('close');
close.onclick = (e) => {
	overlay.classList = '';
	setTitle(title);
	new TWEEN.Tween(camera.position).to({x: 0, y: 0, z: GLOBE_RADIUS * 1.7}, easeTime).easing(easing).start();
	content.replaceChildren();
};
close.ontouchend = close.onclick;

// add hover + click actions for every project image
const SCALE = 1.05;
const SCALE_INC = .005;

graticulesObj.children.forEach((p) => {
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
		let phi = Math.PI / 2 - scaled.geometry.parameters.phiStart - Math.PI / N_TILES[0]; // left/right
		const theta = Math.PI / 2 - scaled.geometry.parameters.thetaStart - Math.PI / (2 * N_TILES[1]); // top/down

		const diff = phi - (graticulesObj.rotation.y) % (2 * Math.PI);
		new TWEEN.Tween(graticulesObj.rotation).to({x: theta, y: graticulesObj.rotation.y + diff, z: 0}, easeTime).easing(easing).start().onComplete((e) => {
			overlay.classList = 'visible';
		});
		new TWEEN.Tween(camera.position).to({x: 0, y: 0, z: GLOBE_RADIUS * 1.3}, easeTime).easing(TWEEN.Easing.Back.In).start();
		const xhr = new XMLHttpRequest;
		xhr.open('GET', '/static/' + scaled.name + '/');
		xhr.responseType = 'document';
		xhr.onload = () => {
			if (xhr.readyState === xhr.DONE && xhr.status === 200) {
				content.replaceChildren(...xhr.response.getElementById('content').childNodes);
				setTitle(xhr.response.title);
			}
		};

		xhr.send();
		// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseXML
		//
		// content.src = "https://futilecorp.github.io/static/" + scaled.name;
		// content.addEventListener('load', (e) => {
		// 	// console.log(e.target.contentDocument);
		// });
	});
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
var mouseDown = false;

var mousePos = [0, 0];
glRenderer.domElement.addEventListener('mousedown', (e) => {
	untouched = false;
	mouseDown = true;
	mousePos = [e.offsetX, e.offsetY];
});
glRenderer.domElement.addEventListener('touchstart', (e) => {
	untouched = false;
	mouseDown = true;
	mousePos = [e.touches[0].clientX, e.touches[0].clientY];
});

glRenderer.domElement.addEventListener('mouseup', (e) => {
	mouseDown = false;
});
glRenderer.domElement.addEventListener('touchend', (e) => {
	mouseDown = false;
});
glRenderer.domElement.addEventListener('mousemove', (e) => {
	if (mouseDown) {
		const polar = graticulesObj.rotation.x + camera.position.z * (e.offsetY - mousePos[1]) / 80000;
		graticulesObj.rotation.x = Math.min(Math.PI / 4, Math.max(polar, -Math.PI / 4));
		graticulesObj.rotation.y += camera.position.z * (e.offsetX - mousePos[0]) / 80000;
		mousePos = [e.offsetX, e.offsetY];
	}
});
glRenderer.domElement.addEventListener('touchmove', (e) => {
	if (mouseDown) {
		const polar = graticulesObj.rotation.x + camera.position.z * (e.touches[0].clientY - mousePos[1]) / 80000;
		graticulesObj.rotation.x = Math.min(Math.PI / 4, Math.max(polar, -Math.PI / 4));
		graticulesObj.rotation.y += camera.position.z * (e.touches[0].clientX - mousePos[0]) / 80000;
		mousePos = [e.touches[0].clientX, e.touches[0].clientY];
	}
});

function animate() {
	requestAnimationFrame(animate);
	interactionManager.update();
	if (untouched) {
		graticulesObj.rotation.y += .004;
	}
	// camera position has been updated based on zooming, apply updated center shift based on it
	// offset is 0 at tbControls.minDistance, -.2 (20% to the right) at 1000
	const dist = camera.position.length()
	// camera.setViewOffset(window.innerWidth, window.innerHeight, -window.innerWidth * Math.log(1 + dist - controls.minDistance) / 25, 0, window.innerWidth, window.innerHeight);
	// bloomPass.strength = Math.min(.5, .1 + (dist - controls.minDistance) / 1000);

	TWEEN.update();

	if (darkMode) {
		composer.render();
	} else {
		glRenderer.render(scene, camera);
	}
}
animate();
