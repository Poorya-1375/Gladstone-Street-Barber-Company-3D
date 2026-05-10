import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Elements
const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const startOverlay = document.getElementById('start-overlay');
const inShopOverlay = document.getElementById('in-shop-overlay');
const barberOverlay = document.getElementById('barber-overlay');
const closeBarberBtn = document.getElementById('close-barber-btn');
const barberNameEl = document.getElementById('barber-name');
const barberAvatarEl = document.getElementById('barber-avatar');
const dogDialogue = document.getElementById('dog-dialogue');
const exitShopBtn = document.getElementById('exit-shop-btn');

// State
let isInside = false;
let isEntering = false;
let isOverlayOpen = false;
let hasDogSettled = false;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
const interactables = []; 

// Audio Setup
const doorBellAudio = new Audio(encodeURI('Image/sound/door-bell.mp3'));
const dogBarkAudio = new Audio(encodeURI('Image/sound/dog-sound.mp3'));

function playBell() {
    doorBellAudio.currentTime = 0;
    doorBellAudio.play().catch(e => console.error("Audio play failed:", e));
}

function playBark() {
    dogBarkAudio.currentTime = 0;
    dogBarkAudio.play().catch(e => console.error("Audio play failed:", e));
}

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 40, 150);

// Sun
const sunGeo = new THREE.SphereGeometry(8, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.set(-30, 50, -40);
scene.add(sun);

// Grass Ground
const grassMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 1.0 });
const grass = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), grassMat);
grass.rotation.x = -Math.PI / 2;
grass.position.y = -0.05;
scene.add(grass);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
mainLight.position.set(10, 20, 20);
mainLight.castShadow = true;
scene.add(mainLight);

// Loading Manager
const manager = new THREE.LoadingManager();
let hasLoaded = false;

function finishLoading() {
    if (hasLoaded) return;
    hasLoaded = true;
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            startOverlay.classList.remove('hidden');
        }, 1000);
    }, 500);
}

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    loadingBar.style.width = (itemsLoaded / itemsTotal * 100) + '%';
};
manager.onLoad = function () { finishLoading(); };
manager.onError = function (url) {
    console.warn('Error loading ' + url);
    finishLoading();
};
setTimeout(finishLoading, 8000);

const textureLoader = new THREE.TextureLoader(manager);

// Textures
const texCurtis = textureLoader.load(encodeURI('Image/Curtis Sekulich.png'));
const texBrandon = textureLoader.load(encodeURI('Image/Brandon.png'));
const texJordan = textureLoader.load(encodeURI('Image/Jordan.png'));
const texDog = textureLoader.load(encodeURI('Image/dog_3d.png'));
const texLogo = textureLoader.load(encodeURI('Image/Logo/logo high quality.png'));

// ==========================================
// BUILD 3D ENVIRONMENT
// ==========================================

const shopGroup = new THREE.Group();
scene.add(shopGroup);

// Materials
const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
const floorMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.8 }); // Dark wood color
const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.7 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
const leatherMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
const mirrorMat = new THREE.MeshStandardMaterial({ color: 0x88aacc, metalness: 0.3, roughness: 0.1 }); // Light silvery-blue
const brickMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.85, metalness: 0.3, roughness: 0.9 });

// 1. Room Shell (Matched to the 40-width of the facade)
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
shopGroup.add(floor);

const backWall = new THREE.Mesh(new THREE.BoxGeometry(40, 30, 2), wallMat);
backWall.position.set(0, 15, -30);
backWall.receiveShadow = true;
shopGroup.add(backWall);

const leftWall = new THREE.Mesh(new THREE.BoxGeometry(2, 30, 60), wallMat);
leftWall.position.set(-20, 15, 0);
leftWall.receiveShadow = true;
shopGroup.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.BoxGeometry(2, 30, 60), wallMat);
rightWall.position.set(20, 15, 0);
rightWall.receiveShadow = true;
shopGroup.add(rightWall);

const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), wallMat);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = 30;
shopGroup.add(ceiling);

// 2. Detailed Exterior Facade & Door
const mintMat = new THREE.MeshStandardMaterial({ color: 0x48c9b0, roughness: 0.9, bumpScale: 0.02 });
const whitePaintMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 });
const blackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
const redMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.7 });
const blueMat = new THREE.MeshStandardMaterial({ color: 0x1111cc, roughness: 0.7 });
const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
const lightMetalMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.2 });
const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
const concreteMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 1.0 });
const neighborMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.9 }); // Red-orange

const facadeGroup = new THREE.Group();
facadeGroup.position.set(0, 0, 30);
shopGroup.add(facadeGroup);

// Sidewalk
const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(50, 20), concreteMat);
sidewalk.rotation.x = -Math.PI / 2;
sidewalk.position.set(0, 0.01, 10);
sidewalk.receiveShadow = true;
facadeGroup.add(sidewalk);

// --- MAIN TURQUOISE FACADE ---
// Left Pillar
const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(4, 20, 2), mintMat);
wallLeft.position.set(-18, 10, 0);
facadeGroup.add(wallLeft);

// Center Pillar (between window and door)
const wallCenter = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 2), mintMat);
wallCenter.position.set(6, 10, 0);
facadeGroup.add(wallCenter);

// Right Pillar (Edge of the property)
const wallRight = new THREE.Mesh(new THREE.BoxGeometry(4, 20, 2), mintMat);
wallRight.position.set(18, 10, 0);
facadeGroup.add(wallRight);

// Upper Wall
const upperWall = new THREE.Mesh(new THREE.BoxGeometry(40, 10, 2), mintMat);
upperWall.position.set(0, 25, 0);
facadeGroup.add(upperWall);

// High-res Procedural Canvas Texture for Logo (to fix blurriness and blue background)
const logoCanvas = document.createElement('canvas');
logoCanvas.width = 2048;
logoCanvas.height = 512;
const ctx = logoCanvas.getContext('2d');

ctx.clearRect(0, 0, 2048, 512);
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// "Gladstone St."
ctx.font = '900 160px Outfit, sans-serif';
ctx.fillStyle = '#f39c12'; // Warm Gold/Yellow
ctx.strokeStyle = '#111111'; // Black outline
ctx.lineWidth = 15;
ctx.strokeText('Gladstone St.', 1024, 200);
ctx.fillText('Gladstone St.', 1024, 200);

// "BARBER CO."
ctx.font = '900 100px Inter, sans-serif';
ctx.strokeText('BARBER CO.', 1024, 340);
ctx.fillStyle = '#f1c40f';
ctx.fillText('BARBER CO.', 1024, 340);

// Stars
function drawStar(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * size,
                   -Math.sin((18 + i * 72) / 180 * Math.PI) * size);
        ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (size/2.5),
                   -Math.sin((54 + i * 72) / 180 * Math.PI) * (size/2.5));
    }
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
}
drawStar(250, 250, 40);
drawStar(1800, 250, 40);
drawStar(1550, 100, 25);
drawStar(450, 100, 20);

const crispLogoTex = new THREE.CanvasTexture(logoCanvas);
crispLogoTex.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Make it ultra sharp

const wallLogo = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 6), 
    new THREE.MeshBasicMaterial({map: crispLogoTex, transparent: true})
);
wallLogo.position.set(0, 25, 1.05);
facadeGroup.add(wallLogo);

// Trims
const topTrim = new THREE.Mesh(new THREE.BoxGeometry(41, 1, 2.5), whitePaintMat);
topTrim.position.set(0, 29.5, 0);
facadeGroup.add(topTrim);

const midTrim = new THREE.Mesh(new THREE.BoxGeometry(41, 0.8, 2.5), whitePaintMat);
midTrim.position.set(0, 20, 0);
facadeGroup.add(midTrim);

// --- WINDOW BASE ---
// Front Base Wall
const baseFront = new THREE.Mesh(new THREE.BoxGeometry(22, 6, 2), mintMat);
baseFront.position.set(-5, 3, 0);
facadeGroup.add(baseFront);
// White trim panel on base
const basePanel = new THREE.Mesh(new THREE.PlaneGeometry(20, 4), whitePaintMat);
basePanel.position.set(-5, 3, 1.05);
facadeGroup.add(basePanel);

// Doormat
const doorMat = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 3), new THREE.MeshStandardMaterial({color: 0x8B5A2B}));
doorMat.position.set(12, 0.05, 1.5);
facadeGroup.add(doorMat);

// --- WINDOW GLASS ---
const glassFront = new THREE.Mesh(new THREE.PlaneGeometry(22, 14), glassMat);
glassFront.position.set(-5, 13, 0.5);
facadeGroup.add(glassFront);

// Plants inside the window
const plantGeo = new THREE.CylinderGeometry(0.5, 0.2, 1.5);
const plantMat = new THREE.MeshStandardMaterial({color: 0x27ae60});
const potGeo = new THREE.CylinderGeometry(0.8, 0.6, 1);
const potMat = new THREE.MeshStandardMaterial({color: 0xd35400});

for(let i=0; i<3; i++) {
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(-10 + i*4, 6.5, -1);
    const plant = new THREE.Mesh(plantGeo, plantMat);
    plant.position.set(0, 1, 0);
    pot.add(plant);
    facadeGroup.add(pot);
}

// Window Details (Decals & Signs) removed as requested

// Barber Pole Animated Texture
function createBarberTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    
    for (let i = -256; i < 512; i += 128) {
        ctx.fillStyle = '#cc1111'; // Red
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 32, 0); ctx.lineTo(i - 256 + 32, 256); ctx.lineTo(i - 256, 256); ctx.fill();
        
        ctx.fillStyle = '#1111cc'; // Blue
        ctx.beginPath(); ctx.moveTo(i + 64, 0); ctx.lineTo(i + 96, 0); ctx.lineTo(i - 256 + 96, 256); ctx.lineTo(i - 256 + 64, 256); ctx.fill();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 4); 
    return tex;
}
const barberTex = createBarberTexture();
const barberPoleMat = new THREE.MeshStandardMaterial({ map: barberTex, roughness: 0.6 });

// --- MAIN EXTERIOR BARBER POLE ---
const mainPoleGroup = new THREE.Group();
mainPoleGroup.position.set(6, 10, 1.5); // Mounted on the center pillar
const mainBackPlate = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 0.2), whitePaintMat);
mainPoleGroup.add(mainBackPlate);
const mainCapTop = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.6), lightMetalMat);
mainCapTop.position.set(0, 3, 0.6);
mainPoleGroup.add(mainCapTop);
const mainCapBot = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.6), lightMetalMat);
mainCapBot.position.set(0, -3, 0.6);
mainPoleGroup.add(mainCapBot);

const mainPole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 5.4, 32), barberPoleMat);
mainPole.position.set(0, 0, 0.6);
mainPoleGroup.add(mainPole);
facadeGroup.add(mainPoleGroup);

// --- EXTERNAL LIGHT FIXTURE BARBER POLE (Smaller, Far left) ---
const extLightGroup = new THREE.Group();
extLightGroup.position.set(-18, 14, 1.5);
const lightBackPlate = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 0.2), whitePaintMat);
extLightGroup.add(lightBackPlate);
const lightCapTop = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5), goldMat);
lightCapTop.position.set(0, 2, 0.5);
extLightGroup.add(lightCapTop);
const lightCapBot = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5), goldMat);
lightCapBot.position.set(0, -2, 0.5);
extLightGroup.add(lightCapBot);

const lightPole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.5, 32), barberPoleMat);
lightPole.position.set(0, 0, 0.5);
extLightGroup.add(lightPole);
facadeGroup.add(extLightGroup);

// --- UTILITY METERS ---
const meterGroup = new THREE.Group();
meterGroup.position.set(-14, 3, 1.2);
const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5), lightMetalMat);
pipe1.position.set(-1, -1, 0);
meterGroup.add(pipe1);
const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4), lightMetalMat);
pipe2.position.set(1, -1.5, 0);
meterGroup.add(pipe2);
const meter1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.8), darkMetalMat);
meter1.position.set(-1, 0.5, 0);
meterGroup.add(meter1);
const meter2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.8), darkMetalMat);
meter2.position.set(1, 0, 0);
meterGroup.add(meter2);
const glassMeter = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5), glassMat);
glassMeter.rotation.x = Math.PI/2;
glassMeter.position.set(-1, 0.5, 0.5);
meterGroup.add(glassMeter);
facadeGroup.add(meterGroup);

// --- VINTAGE LAWN CHAIR ---
const chairGroup = new THREE.Group();
chairGroup.position.set(-10, 0, 4);
chairGroup.rotation.y = Math.PI / 6;
chairGroup.scale.set(1.5, 1.5, 1.5); // Scaled up
const chLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3), whitePaintMat);
chLeg1.position.set(-1, 1.5, -1);
chLeg1.rotation.x = Math.PI/8;
chairGroup.add(chLeg1);
const chLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3), whitePaintMat);
chLeg2.position.set(1, 1.5, -1);
chLeg2.rotation.x = Math.PI/8;
chairGroup.add(chLeg2);
const chLeg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3), whitePaintMat);
chLeg3.position.set(-1, 1.5, 1);
chLeg3.rotation.x = -Math.PI/8;
chairGroup.add(chLeg3);
const chLeg4 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3), whitePaintMat);
chLeg4.position.set(1, 1.5, 1);
chLeg4.rotation.x = -Math.PI/8;
chairGroup.add(chLeg4);
// Webbing (Red/White plane)
const webGeo = new THREE.PlaneGeometry(2.5, 4);
const webTex = new THREE.CanvasTexture((()=>{
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'red'; ctx.fillRect(0,0,64,64);
    ctx.fillStyle = 'white';
    for(let i=0; i<64; i+=8) { ctx.fillRect(i,0,4,64); ctx.fillRect(0,i,64,4); }
    return c;
})());
webTex.wrapS = THREE.RepeatWrapping; webTex.wrapT = THREE.RepeatWrapping;
webTex.repeat.set(2, 4);
const webMat = new THREE.MeshBasicMaterial({ map: webTex, side: THREE.DoubleSide });
const seatWeb = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), webMat);
seatWeb.rotation.x = -Math.PI/2;
seatWeb.position.set(0, 1.4, 0);
chairGroup.add(seatWeb);
const backWeb = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.5), webMat);
backWeb.rotation.x = -Math.PI/8;
backWeb.position.set(0, 2.5, -1);
chairGroup.add(backWeb);
facadeGroup.add(chairGroup);

// --- AWNING ---
const awningGroup = new THREE.Group();
awningGroup.position.set(0, 20.5, 1);
awningGroup.rotation.x = -Math.PI / 4.5; // Slanted outward down towards the street
facadeGroup.add(awningGroup);

const awnWidth = 34; // Covers window and entrance
const numAwnStripes = 34;
const stWidth = awnWidth / numAwnStripes;
for (let i = 0; i < numAwnStripes; i++) {
    const isBlack = i % 2 === 0;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(stWidth, 6, 0.2), isBlack ? blackMat : whitePaintMat);
    stripe.position.set(-awnWidth/2 + i*stWidth + (stWidth/2), -3, 0);
    awningGroup.add(stripe);
    
    // Scalloped edge
    const scallop = new THREE.Mesh(new THREE.CylinderGeometry(stWidth/2, stWidth/2, 0.2), isBlack ? blackMat : whitePaintMat);
    scallop.rotation.x = Math.PI/2;
    scallop.position.set(-awnWidth/2 + i*stWidth + (stWidth/2), -6, 0);
    awningGroup.add(scallop);
}

// --- DOOR SYSTEM ---
const doorPivot = new THREE.Group();
doorPivot.position.set(16, 0, 0); // Hinge on the right edge of door gap
facadeGroup.add(doorPivot);

const doorGroup = new THREE.Group();
doorGroup.position.set(-4.5, 0, 0); // Center of door is 4.5 units from right hinge
doorPivot.add(doorGroup);

// Door solid frame
const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(9, 16, 0.6), whitePaintMat);
doorFrame.position.set(0, 8, 0);

// Cutout simulated with glass
const doorGlassFrame = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 8.5), glassMat);
doorGlassFrame.position.set(0, 11, 0.35);

const doorBottomPanel = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 0.8), whitePaintMat);
doorBottomPanel.position.set(0, 3.5, 0);

// Mail Slot
const mailSlot = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 0.9), blackMat);
mailSlot.position.set(0, 5, 0);

const doorHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2), darkMetalMat);
doorHandle.position.set(-3, 8, 0.5); // Handle on left side since hinge is on right

doorGroup.add(doorFrame);
doorGroup.add(doorGlassFrame);
doorGroup.add(doorBottomPanel);
doorGroup.add(mailSlot);
doorGroup.add(doorHandle);

// Invisible hit box for clicking door easily
const doorHitbox = new THREE.Mesh(new THREE.PlaneGeometry(10, 18), new THREE.MeshBasicMaterial({visible: false}));
doorHitbox.position.set(0, 9, 1);
doorHitbox.userData = { isDoor: true };
doorGroup.add(doorHitbox);
interactables.push(doorHitbox);

// 3. Barber Stations
function createStation(x, z, title, texture, role, rotY = 0, bookingUrl = "") {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    // Desk Top (Wood)
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 4), woodMat);
    deskTop.position.set(0, 4.25, 2);
    deskTop.castShadow = true;
    group.add(deskTop);

    // Cabinet Base (Mint Green)
    const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x48c9b0, roughness: 0.7 });
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(11.5, 4, 3.5), cabinetMat);
    cabinet.position.set(0, 2, 2.25);
    cabinet.castShadow = true;
    group.add(cabinet);

    // Station Mirror
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(8, 12), mirrorMat);
    mirror.position.set(0, 11, 0.6);
    group.add(mirror);

    const mirrorFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(9, 13, 0.5), mirrorFrameMat);
    mirrorFrame.position.set(0, 11, 0.25);
    group.add(mirrorFrame);

    // Barber Chair
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 8);
    
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 1.0, roughness: 0.1 });
    const redLeatherMat = new THREE.MeshStandardMaterial({ color: 0xaa1111, roughness: 0.6 }); // Vintage Red

    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.5, 32), chromeMat);
    base.position.y = 0.25;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3), chromeMat);
    pole.position.y = 1.5;
    
    // Seat Cushion
    const seat = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1, 4.5), redLeatherMat);
    seat.position.y = 3;
    
    // Backrest Cushion
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4.5, 1.2), redLeatherMat);
    backrest.position.set(0, 5.5, -1.8);
    
    // Chrome Armrests
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4), chromeMat);
    armL.position.set(-2.5, 4.5, 0);
    armL.rotation.x = Math.PI / 2;
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4), chromeMat);
    armR.position.set(2.5, 4.5, 0);
    armR.rotation.x = Math.PI / 2;
    
    // Footrest
    const footrest = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 2), chromeMat);
    footrest.position.set(0, 1, 2.5);

    chairGroup.add(base, pole, seat, backrest, armL, armR, footrest);
    
    // Add barber portrait floating next to the chair
    const portraitGeo = new THREE.PlaneGeometry(5, 5);
    const portraitMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const portrait = new THREE.Mesh(portraitGeo, portraitMat);
    portrait.position.set(-6, 7.5, 8); // Floating to the left of the chair (viewer's perspective)
    portrait.rotation.y = -Math.PI / 6; // Angle them towards the door and the camera
    
    // Portrait frame (elegant gold trim)
    const edges = new THREE.EdgesGeometry(portraitGeo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xd4af37, linewidth: 2 }));
    portrait.add(line);

    portrait.userData = { isBarber: true, name: title, role: role, url: texture.image?.src || texture.source?.data?.src, bookingUrl: bookingUrl };
    interactables.push(portrait);

    group.add(chairGroup);
    group.add(portrait);

    // Station light
    const spotLight = new THREE.SpotLight(0xffddaa, 1.5);
    spotLight.position.set(0, 25, 2);
    spotLight.target.position.set(0, 0, 6);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    group.add(spotLight);
    group.add(spotLight.target);

    return group;
}

// Move stations to the left side wall, facing right (spaced cleanly so they don't hit the back wall)
shopGroup.add(createStation(-19, 15, "Curtis", texCurtis, "Master Barber", Math.PI / 2, "https://booksy.com/en-us/1264001_gladstone-street-barber-company_barber-shop_134776_portland/staffer/1202446#ba_s=seo"));
shopGroup.add(createStation(-19, 0, "Brandon", texBrandon, "Senior Barber", Math.PI / 2, "https://booksy.com/en-us/1264001_gladstone-street-barber-company_barber-shop_134776_portland/staffer/1408575#ba_s=seo"));
shopGroup.add(createStation(-19, -15, "Jordin", texJordan, "Barber Specialist", Math.PI / 2, "https://booksy.com/en-us/1264001_gladstone-street-barber-company_barber-shop_134776_portland/staffer/1649506#ba_s=seo"));

// 4. Dog
function create3DDog() {
    const dogGroup = new THREE.Group();
    const furMat = new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.9 }); // Golden yellow
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1 });
    const tongueMat = new THREE.MeshStandardMaterial({ color: 0xff6666, roughness: 0.8 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 4), furMat);
    body.position.set(0, 2.25, 0);
    dogGroup.add(body);

    // Head Group (for animation)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 3.8, 1.8);
    
    // Head Base
    const head = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), furMat);
    headGroup.add(head);

    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1.5), furMat);
    snout.position.set(0, -0.2, 1.5);
    headGroup.add(snout);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.2), noseMat);
    nose.position.set(0, 0.3, 0.8);
    snout.add(nose);
    
    // Tongue (cute smile)
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.8), tongueMat);
    tongue.position.set(0, -0.4, 0.6);
    tongue.rotation.x = Math.PI / 8;
    snout.add(tongue);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), eyeMat);
    eyeL.position.set(-0.6, 0.4, 1.0);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), eyeMat);
    eyeR.position.set(0.6, 0.4, 1.0);
    headGroup.add(eyeR);

    // Ears (flappy)
    const earL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 1.2), furMat);
    earL.position.set(-1.2, -0.2, 0);
    earL.rotation.z = Math.PI / 10;
    headGroup.add(earL);

    const earR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 1.2), furMat);
    earR.position.set(1.2, -0.2, 0);
    earR.rotation.z = -Math.PI / 10;
    headGroup.add(earR);

    dogGroup.add(headGroup);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.7, 2, 0.7);
    const legFL = new THREE.Mesh(legGeo, furMat);
    legFL.position.set(-0.7, 1, 1.6);
    const legFR = new THREE.Mesh(legGeo, furMat);
    legFR.position.set(0.7, 1, 1.6);
    const legBL = new THREE.Mesh(legGeo, furMat);
    legBL.position.set(-0.7, 1, -1.6);
    const legBR = new THREE.Mesh(legGeo, furMat);
    legBR.position.set(0.7, 1, -1.6);

    dogGroup.add(legFL, legFR, legBL, legBR);

    // Tail (wagging)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 3, -2);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 2.5), furMat);
    tail.position.set(0, 0, -1);
    tailGroup.add(tail);
    dogGroup.add(tailGroup);

    dogGroup.scale.set(0.8, 0.8, 0.8);

    // Shadow mapping
    dogGroup.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    // Expose parts for animation
    dogGroup.userData = { 
        isDog: true, 
        head: headGroup, 
        tail: tailGroup 
    };

    return dogGroup;
}

const dogMesh = create3DDog();
// Move dog into the middle foreground so it's clearly visible when you enter
dogMesh.position.set(12, 0, 0);

interactables.push(dogMesh);
shopGroup.add(dogMesh);

// Setup Camera Start Position (Outside the door)
camera.position.set(0, 12, 65);
const cameraTarget = new THREE.Vector3(0, 15, 0);

// Mouse & Raycasting
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables);
    
    document.body.style.cursor = 'default';
    
    interactables.forEach(obj => {
        if (!obj.userData.isDoor) gsap.to(obj.scale, { x: 1, y: 1, z: 1, duration: 0.2 });
    });

    if (intersects.length > 0) {
        const obj = intersects[0].object;
        
        // Prevent interacting with interior objects while outside
        if (!isInside && !obj.userData.isDoor) return;
        
        document.body.style.cursor = 'pointer';
        if (!obj.userData.isDoor) {
            gsap.to(obj.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.2 });
        }
    } 
});

window.addEventListener('click', () => {
    if (isOverlayOpen) return;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // Prevent clicking interior objects from outside
        if (!isInside && !object.userData.isDoor) return;
        
        if (object.userData.isDoor && !isInside) {
            enterShop();
        } else if (object.userData.isBarber) {
            openBarberInfo(object);
        } else if (object.userData.isDog) {
            triggerDog();
        }
    }
});

function enterShop() {
    startOverlay.classList.add('hidden');
    isEntering = true;
    
    playBell();
    
    // 1. Swing Door Open
    gsap.to(doorPivot.rotation, {
        y: Math.PI / 2.2,
        duration: 1.5,
        ease: "power2.inOut"
    });

    // 2. Walk camera to door, then inside
    gsap.to(camera.position, {
        x: 12,
        z: 45,
        duration: 1.5,
        ease: "power2.inOut",
        onComplete: () => {
            
            // As we walk through the door, smoothly tilt the camera DOWN to look at the dog
            const targetX = hasDogSettled ? -8 : 12;
            const targetZ = hasDogSettled ? 8 : 0;
            
            gsap.to(cameraTarget, {
                x: targetX,
                y: 3, // Dog's height
                z: targetZ,
                duration: 2,
                ease: "power2.inOut"
            });
            
            // Walk straight through door to the dog
            if (!hasDogSettled) {
                setTimeout(() => { triggerDog(); }, 1500); // Dog barks 0.5s before camera stops
            }
            
            gsap.to(camera.position, {
                z: 10,
                duration: 2,
                ease: "power2.inOut",
                onComplete: () => {
                    isInside = true;
                    isEntering = false;
                    
                    if (!hasDogSettled) {
                        // After dog barks, turn left to see characters
                        setTimeout(() => {
                            // Move camera back a bit to "zoom out"
                            gsap.to(camera.position, { x: 10, z: 25, duration: 1.5, ease: "power2.inOut" });
                            
                            gsap.to(cameraTarget, {
                                x: -20, y: 8, z: 0,
                                duration: 1.5, ease: "power2.inOut",
                                onComplete: () => {
                                    inShopOverlay.classList.remove('hidden');
                                    
                                    // Dog walks to chairs and lays down after 5 seconds
                                    setTimeout(() => {
                                        dogWalkAndLayDown();
                                    }, 5000);
                                }
                            });
                        }, 1000); // 1 sec delay so we look at the dog first
                    } else {
                        // Dog is already settled. Just pan the camera directly to the chairs
                        setTimeout(() => {
                            gsap.to(camera.position, { x: 10, z: 25, duration: 1.5, ease: "power2.inOut" });
                            gsap.to(cameraTarget, {
                                x: -20, y: 8, z: 0,
                                duration: 1.5, ease: "power2.inOut",
                                onComplete: () => {
                                    inShopOverlay.classList.remove('hidden');
                                }
                            });
                        }, 500); // Short delay
                    }
                }
            });
        }
    });
}

function dogWalkAndLayDown() {
    // 1. Dog turns diagonally towards the space between the first two chairs
    gsap.to(dogMesh.rotation, {
        y: -Math.PI / 2.5, // Diagonal left
        duration: 1,
        ease: "power2.inOut",
        onComplete: () => {
            // 2. Dog walks slowly to the spot
            gsap.to(dogMesh.position, {
                x: -8, // In front of the chairs
                z: 8,  // Between the center chair and the left chair
                duration: 5,
                ease: "none",
                onUpdate: function() {
                    // Bob up and down to simulate a walking gait
                    dogMesh.position.y = Math.abs(Math.sin(this.progress() * Math.PI * 10)) * 0.4;
                },
                onComplete: () => {
                    dogMesh.position.y = 0; // Ground the dog
                    
                    // 3. Turn to face the front door (+Z)
                    gsap.to(dogMesh.rotation, {
                        y: 0, // Face forward (+Z axis)
                        duration: 1,
                        ease: "power2.inOut",
                        onComplete: () => {
                            // 4. Dog lays down
                            gsap.to(dogMesh.position, {
                                y: -1.0, // Drop body down so legs clip into floor, simulating laying down
                                duration: 1.5,
                                ease: "power1.inOut"
                            });
                            
                            // Rest head down
                            if (dogMesh.userData.head) {
                                gsap.to(dogMesh.userData.head.rotation, {
                                    x: -Math.PI / 6, // Head tilts down to sleep
                                    y: Math.PI / 6, // Tilt slightly sideways
                                    duration: 1.5,
                                    ease: "power1.inOut",
                                    onComplete: () => {
                                        hasDogSettled = true;
                                        setTimeout(startDogIdle, 4000); // Wait 4 secs before starting idle loop
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }
    });
}

function startDogIdle() {
    if (!hasDogSettled) return;
    
    // Animate head to look down and "lick paws"
    gsap.to(dogMesh.userData.head.rotation, {
        x: Math.PI / 5, // Head down
        y: 0,
        duration: 0.8,
        ease: "power1.inOut",
        onComplete: () => {
            // Bob head a few times (licking)
            gsap.to(dogMesh.userData.head.rotation, {
                x: Math.PI / 4,
                duration: 0.3,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    // Look back up towards the camera
                    gsap.to(dogMesh.userData.head.rotation, {
                        x: -Math.PI / 8, // Look up
                        y: Math.PI / 8,  // Look slightly sideways towards camera
                        duration: 1.2,
                        ease: "power2.inOut",
                        onComplete: () => {
                            // Wait a random amount of time, then repeat
                            setTimeout(startDogIdle, 4000 + Math.random() * 3000);
                        }
                    });
                }
            });
        }
    });
}

function triggerDog() {
    playBark();
    dogDialogue.classList.remove('hidden');
    dogDialogue.style.transform = "translateX(-50%) translateY(0)";
    
    // Jump animation
    gsap.to(dogMesh.position, {
        y: 1.5, // Jump height from floor
        duration: 0.2,
        yoyo: true,
        repeat: 3,
        onComplete: () => { dogMesh.position.y = 0; }
    });

    // Wag tail
    if (dogMesh.userData.tail) {
        gsap.to(dogMesh.userData.tail.rotation, {
            z: Math.PI / 4,
            duration: 0.1,
            yoyo: true,
            repeat: 11
        });
    }

    // Head tilt
    if (dogMesh.userData.head) {
        gsap.to(dogMesh.userData.head.rotation, {
            z: Math.PI / 8,
            duration: 0.3,
            yoyo: true,
            repeat: 3
        });
    }
    
    setTimeout(() => {
        dogDialogue.classList.add('hidden');
        dogDialogue.style.transform = "translateX(-50%) translateY(20px)";
    }, 2500);
}

function openBarberInfo(barberMesh) {
    isOverlayOpen = true;
    barberNameEl.textContent = barberMesh.userData.name;
    
    if (barberMesh.material.map && barberMesh.material.map.image) {
        barberAvatarEl.src = barberMesh.material.map.image.src;
    }
    
    const bookBtn = document.querySelector('.book-btn');
    if (barberMesh.userData.bookingUrl) {
        bookBtn.href = barberMesh.userData.bookingUrl;
    } else {
        bookBtn.href = "#";
    }
    
    barberOverlay.classList.remove('hidden');
}

closeBarberBtn.addEventListener('click', () => {
    barberOverlay.classList.add('hidden');
    setTimeout(() => { isOverlayOpen = false; }, 300);
});

exitShopBtn.addEventListener('click', () => {
    inShopOverlay.classList.add('hidden');
    isInside = false; 
    isEntering = true; // Let GSAP control cameraTarget during exit
    
    // Smoothly turn camera back to looking out the door!
    gsap.to(cameraTarget, {
        x: 12,
        y: 15,
        z: 0,
        duration: 1.5,
        ease: "power2.inOut"
    });

    // Pan camera back to the door gap
    gsap.to(camera.position, {
        z: 45,
        duration: 2,
        ease: "power2.inOut",
        onComplete: () => {
            isEntering = false; // Give cameraTarget control back to animate() loop
            
            // Close the door
            gsap.to(doorPivot.rotation, {
                y: 0,
                duration: 1.5,
                ease: "power2.inOut"
            });
            
            // Walk camera back to the street start position
            gsap.to(camera.position, {
                x: 0,
                y: 12,
                z: 65,
                duration: 1.5,
                ease: "power2.inOut",
                onComplete: () => {
                    startOverlay.classList.remove('hidden');
                }
            });
        }
    });
});

// Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
const clock = new THREE.Clock();
let breatheTime = 0;

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    
    if (isInside && !isOverlayOpen) {
        breatheTime += 0.01;
        // Subtle floating effect for barbers
        interactables.forEach(obj => {
            if (obj.userData.isBarber) {
                obj.position.y = 8 + Math.sin(time * 2 + obj.position.x) * 0.3;
            }
        });
        
        // Gentle breathing camera
        camera.position.y = 10 + Math.cos(breatheTime) * 0.5;
        camera.lookAt(cameraTarget);
    } else if (!isInside && !isEntering) {
        // Look straight ahead through the gap, but angled slightly up to see the logo and sky
        cameraTarget.set(camera.position.x, 15, 0);
        camera.lookAt(cameraTarget);
    } else if (isEntering) {
        // Camera target is being controlled entirely by GSAP!
        camera.lookAt(cameraTarget);
    }
    
    // Animate Barber Poles
    barberTex.offset.y -= 0.005; // Negative Y creates upward spiral illusion
    
    renderer.render(scene, camera);
}

animate();
