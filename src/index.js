import {
	AmbientLight,
	Color,
	DefaultLoadingManager,
	DirectionalLight,
	DoubleSide,
	PerspectiveCamera,
	LineBasicMaterial,
	LineSegments,
	MeshPhongMaterial,
	Mesh,
	SphereGeometry,
	Scene,
	TextureLoader,
	Vector2,
	WebGLRenderer,
} from 'three';
import {InteractionManager} from 'three.interactive';

import {GeoJsonGeometry} from 'three-geojson-geometry';
import graticule from '../node_modules/d3-geo/src/graticule';
import {TWEEN} from 'three/examples/jsm/libs/tween.module.min'

const lightbox = GLightbox();
const processContent = () => {
	lightbox.reload();
	const readmore = document.getElementById('readmore');
	if (!readmore) {
		return;
	}
	const remainder = document.getElementById('remainder');
	readmore.children[0].onclick = (e) => {
		readmore.style.display = 'none';
		remainder.style.display = 'block';
		remainder.scrollIntoView();
	};
	readmore.style.display = 'block';
	remainder.style.display = 'none';
}
// call when first page load is finished
document.addEventListener('DOMContentLoaded', () => {
	processContent();
}, false);

var darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
var untouched = true; // controls if an intro animatin rotation is played

const glRenderer = new WebGLRenderer({antialias: true});
document.body.appendChild(glRenderer.domElement);
glRenderer.setPixelRatio(window.devicePixelRatio);

DefaultLoadingManager.onLoad = function () {
	glRenderer.domElement.style.opacity = 1;
};

// overlay additional on top of main renderer
// glRenderer.domElement.style.position = 'absolute';
// glRenderer.domElement.style.zIndex = 1;
// glRenderer.domElement.style.top = 0;
// glRenderer.domElement.style.pointerEvents = 'none';

const scene = new Scene();
const camera = new PerspectiveCamera();
const GLOBE_RADIUS = 100;
camera.position.set(0, 0, GLOBE_RADIUS * 7);

const setTilt = () => {
	graticulesObj.rotation.z = - Math.max(0, (camera.position.z - 2 * GLOBE_RADIUS) / 700); // tilt to side
};


// move globe slightly off center (20% to the right)
// camera.setViewOffset(window.innerWidth, window.innerHeight, -.2 * window.innerWidth, 0, window.innerWidth, window.innerHeight);
// const cssRenderer = new CSS2DRenderer();
// glRenderer.domElement.appendChild(cssRenderer.domElement);
// cssRenderer.domElement.style.position = 'absolute';
// cssRenderer.domElement.style.zIndex = 0;
// cssRenderer.domElement.style.top = 0;

scene.add(new AmbientLight(0xbbbbbb));
const daylight = new DirectionalLight(0xffffff, .8);
daylight.position.x = -.5;
daylight.position.y = 0;
daylight.position.z = .5;
scene.add(daylight);

// GLOBE
const N_TILES = [16, 12]; // long, lat
const USABLE_LATITUDES = 6; // don't use top/bottom 4
const tileWidth = 360 / N_TILES[0];
const tileHeight = 180 / N_TILES[1];
camera.far = 400 * GLOBE_RADIUS;

const graticuleGen = graticule();
graticuleGen.stepMajor([90, 360]);
graticuleGen.stepMinor([tileWidth, tileHeight]);
graticuleGen.extentMinor([[-180, -90 + tileHeight], [180, 90 - tileHeight + .01]]);
graticuleGen.precision(5);
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
setTilt();
scene.add(graticulesObj);

// GLOBE BLOOM
// const renderScene = new RenderPass(scene, camera);
// const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
// bloomPass.threshold = .2;
// bloomPass.radius = .001;

// const composer = new EffectComposer(glRenderer);
// composer.addPass(renderScene);
// composer.addPass(bloomPass);

var hasChanges = true;

const onResize = () => {
	var width = window.innerWidth;
	var height = window.innerHeight;
	// var width = glRenderer.domElement.clientWidth * window.devicePixelRatio;
	// var height = glRenderer.domElement.clientHeight * window.devicePixelRatio;
	// cssRenderer.setSize(width, height);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	glRenderer.setSize(width, height);
	hasChanges = true;
	// composer.setSize(width, height);
	// controls.handleResize();
};
window.addEventListener('resize', onResize);
onResize();


// PROJECT IMAGES
const textureLoader = new TextureLoader();
const projects = ['localmeantime', 'everythingisinterestingonce', 'paranoidcentrist', 'landuse', 'borderlands', 'theview', 'za', 'everybodyelse'];
const getpng = ['borderlands', 'landuse'];
const materials = projects.map((s) => {
	const ext = getpng.includes(s) ? 'png' : 'jpg';
	const url = getpng.includes(s) ?
		'https://res.cloudinary.com/futile/f_png,q_auto,w_1024,dpr_auto,ar_4:3/e_bgremoval/' + s + '.png' :
		'https://res.cloudinary.com/futile/f_jpg,q_auto,w_1024,dpr_auto,ar_4:3/' + s + '.jpg';
	return new MeshPhongMaterial({
		map: textureLoader.load(url),
		side: DoubleSide,
		transparent: ext == 'png'
	});
}
);
const longitudes = [0];
const latitudes = [N_TILES[1] / 2];
projects.forEach((p, i) => {
	longitudes.push(longitudes[i] + 1 + Math.floor(Math.random() * 3));
	latitudes.push((N_TILES[1] - USABLE_LATITUDES) / 2 + (latitudes[i] + 1 + Math.floor(Math.random() * (USABLE_LATITUDES - 1))) % USABLE_LATITUDES);
	// tileHeight * (N_TILES[1] - USABLE_LATITUDES)/2
});

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

const easing = TWEEN.Easing.Quartic.InOut;
const header = document.getElementById('title');
const setTitle = (t) => {
	header.textContent = t;
	if (t != header.dataset.default) {
		t += ' | the Futile Corporation';
	}
	document.title = t;
};

const overlay = document.getElementById('overlay');
const content = document.getElementById('content');
const close = document.getElementById('close');
const hideContent = () => {
	overlay.classList = '';
};
close.onclick = (e) => {
	e.preventDefault();
	hideContent();
	setTitle(header.dataset.default);
	window.history.replaceState('', document.title, window.location.origin + '/');
	new TWEEN.Tween(camera.position).to({x: 0, y: 0, z: GLOBE_RADIUS * 1.9}, easeTime).easing(TWEEN.Easing.Quartic.Out).start();
	content.replaceChildren();
};
close.ontouchend = close.onclick;
close.onpointerup = close.onclick;

const easeTime = 1500;

var touchedProject = null;

// add hover + click actions for every project image
const focusScale = 1.05;
const focusOn = (e) => {
	if (overlay.classList == 'visible') {
		return;
	}
	glRenderer.domElement.style.cursor = 'pointer';
	// TODO show title/info
	new TWEEN.Tween(e.target.scale).to({x: focusScale, y: focusScale, z: focusScale}, 200).easing(TWEEN.Easing.Linear.None).start();
};
const focusOut = (e) => {
	// TODO hide title/info
	for (var t of TWEEN.getAll()) {
		if (t._duration != easeTime) {
			// not a flying animation
			t.stop();
		}
	}
	touchedProject = null; // TODO need to find equivalent for touch pointer
	new TWEEN.Tween(e.target.scale).to({x: 1, y: 1, z: 1}, 100).easing(TWEEN.Easing.Linear.None).start();
	glRenderer.domElement.style.cursor = 'initial';
};

const projectRotation = (p) => {
	let phi = Math.PI / 2 - p.geometry.parameters.phiStart - Math.PI / N_TILES[0]; // left/right
	const theta = Math.PI / 2 - p.geometry.parameters.thetaStart - Math.PI / (2 * N_TILES[1]); // top/down
	return {x: theta, y: phi, z: 0};
};
const pageUrl = (name) => {
	return `/about/${name}/`
};
const loadProject = (name, direct = false) => {
	const xhr = new XMLHttpRequest;
	const target = direct ? name : pageUrl(name);
	xhr.open('GET', target);
	xhr.responseType = 'document';
	xhr.onload = () => {
		if (xhr.readyState === xhr.DONE && xhr.status === 200) {
			content.replaceChildren(...xhr.response.getElementById('content').childNodes);
			content.dataset.title = xhr.response.getElementById('content').dataset.title;
			window.history.replaceState(name, content.dataset.title, window.location.origin + target);
			processContent();
			if (direct) {
				showContent();
			}
		}
	};
	xhr.send();
};
const showContent = () => {
	overlay.classList = 'visible';
	if (content.hasChildNodes()) {
		setTitle(content.dataset.title);
	}
};

document.getElementById('about').onclick = (e) => {
	e.preventDefault();
	loadProject('/about/', true);
}

if (window.location.pathname != '/') {
	loadProject(window.location.pathname.split('/')[1]);
	showContent();
	untouched = false;
	// } else {
	// hideContent();
}

const selectProject = (e) => {
	untouched = false;

	if (e.type === 'pointerdown') {
		touchedProject = e.target.name;
		// e.target.releasePointerCapture(e.pointerId);
		return;
	}
	if (touchedProject !== e.target.name) {
		return;
	}
	touchedProject = null;

	loadProject(e.target.name);

	const target = projectRotation(e.target);
	// const xdiff = target.x - graticulesObj.x;
	const ydiff = (Math.PI + target.y - graticulesObj.rotation.y) % (2 * Math.PI) - Math.PI;
	// console.log(ydiff);
	const zdiff = camera.position.z / GLOBE_RADIUS;
	target.y = graticulesObj.rotation.y + ydiff;
	new TWEEN.Tween(graticulesObj.rotation).to(target, easeTime).easing(easing).start().onComplete(showContent);
	const camEasing = zdiff < 2 ? TWEEN.Easing.Back.In : TWEEN.Easing.Quartic.Out;
	new TWEEN.Tween(camera.position).to({x: 0, y: 0, z: GLOBE_RADIUS * 1.3}, easeTime).easing(camEasing).start();
}

graticulesObj.children.forEach((p) => {
	interactionManager.add(p);
	p.addEventListener('mouseover', focusOn);
	p.addEventListener('mouseout', focusOut);
	p.addEventListener('pointerdown', selectProject);
	p.addEventListener('pointerup', selectProject);
	p.addEventListener('pointerleave', (e) => {console.log('leave');});
});

const setColors = () => {
	// graticulesObj.material.color.set(darkMode ? 'white' : 'black');
	new TWEEN.Tween(graticulesObj.material.color).to({r: darkMode ? 1 : 0, g: darkMode ? 1 : 0, b: darkMode ? 1 : 0}, 1000).easing(TWEEN.Easing.Linear.None).start().onUpdate((e) => {
		glRenderer.setClearColor(new Color(1 - e.r, 1 - e.r, 1 - e.r));
	});
};
setColors();
// document.getElementById('darkmode').checked = darkMode;
document.getElementById('darkmode').addEventListener('click', (e) => {
	darkMode = !darkMode;//e.target.checked;
	document.body.classList = darkMode ? '' : 'light';
	setColors();
});

// MOUSE / POINTER EFFECTS
const zoomCamera = (diff) => {
	const newPosition = camera.position.z * (1 + diff);
	camera.position.z = Math.min(camera.far, Math.max(GLOBE_RADIUS * 1.2, newPosition));
	// graticulesObj.position.x = ((camera.position.z - GLOBE_RADIUS * 1.2) / 100) ** 1.5;
	setTilt();
	hasChanges = true;
};

// MOUSE / POINTER EVENTS

var zoomVelocity = 0;
glRenderer.domElement.addEventListener('wheel', (e) => {
	e.preventDefault();
	hasChanges = true;
	zoomVelocity += e.deltaY; // TODO check e.deltaMode
	// TODO rotate globe on deltaX
});

const pointerCache = [];
var prevPinchDiff = -1;

const pointerdownHandler = (e) => {
	// The pointerdown event signals the start of a touch interaction.
	untouched = false;
	// This event is cached to support 2-finger gestures
	pointerCache.push(e);
};

const pointermoveHandler = (e) => {
	const index = pointerCache.findIndex((cachedEv) => cachedEv.pointerId === e.pointerId);

	// If two pointers are down, check for pinch gestures
	if (pointerCache.length === 2) {
		hasChanges = true;
		pointerCache[index] = e;
		// Calculate the distance between the two pointers
		const curDiff = Math.abs(pointerCache[0].clientX - pointerCache[1].clientX);
		if (prevPinchDiff > 0) {
			zoomCamera((prevPinchDiff - curDiff) / 50);
			if (curDiff > prevPinchDiff) {
				// The distance between the two pointers has increased
				// console.log("Pinch moving OUT -> Zoom in");
			}
			if (curDiff < prevPinchDiff) {
				// The distance between the two pointers has decreased
				// console.log("Pinch moving IN -> Zoom out");
			}
		}

		// Cache the distance for the next move event
		prevPinchDiff = curDiff;
	} else if (pointerCache.length === 1) {
		hasChanges = true;
		const polar = graticulesObj.rotation.x + camera.position.z * (e.clientY - pointerCache[index].clientY) / 80000;
		graticulesObj.rotation.x = Math.min(Math.PI / 4, Math.max(polar, -Math.PI / 4));
		graticulesObj.rotation.y += camera.position.z * (e.clientX - pointerCache[index].clientX) / 80000;
		pointerCache[index] = e;
	}
};

const pointerupHandler = (e) => {
	const index = pointerCache.findIndex((cachedEv) => cachedEv.pointerId === e.pointerId);
	pointerCache.splice(index, 1);

	if (pointerCache.length < 2) {
		prevPinchDiff = -1;
	}
};

const el = glRenderer.domElement;
el.onpointerdown = pointerdownHandler;
el.onpointermove = pointermoveHandler;
el.onpointerup = pointerupHandler;
el.onpointercancel = pointerupHandler;
el.onpointerout = pointerupHandler;
el.onpointerleave = pointerupHandler;

var start = Date.now();
var rendered = 0;
var skipped = 0;

function animate(timestamp) {
	interactionManager.update();
	if (untouched) {
		hasChanges = true;
		graticulesObj.rotation.y += .004;
	}
	if (TWEEN.getAll().length != 0) {
		TWEEN.update();
		hasChanges = true;
	}
	if (zoomVelocity != 0) {
		zoomCamera(zoomVelocity / 2500);
		zoomVelocity *= .8;
		if (Math.abs(zoomVelocity) < .1) {
			zoomVelocity = 0;
		}
	}

	if (overlay.classList != "visible" && hasChanges) {
		hasChanges = false;
		glRenderer.render(scene, camera);
		rendered++;
	} else {
		skipped++;
	}
	const now = Date.now();
	if (now - 1000 > start) {
		//console.log(`${rendered} fps, skipped ${skipped}`);
		rendered = 0;
		skipped = 0;
		start = now;
	}
	requestAnimationFrame(animate);
}
animate();
