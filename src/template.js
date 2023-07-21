import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import CannonDebugger from 'cannon-es-debugger';

// CONSTANTS
const PLANE_WIDTH =30;
const PLANE_HEIGHT =30;

//init renderer
const renderer = new THREE.WebGLRenderer({antialias: true, alpha:true});
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//init scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
// Sets orbit control to move the camera around
const orbit = new OrbitControls(camera, renderer.domElement);
// Camera positioning
camera.position.set(15, 23, 45);
orbit.update();

//add a point light
const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(-7, 12, -7);
pointLight.castShadow=true;
scene.add(pointLight);
const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
scene.add(pointLightHelper);
//add some ambient light
scene.add(new THREE.AmbientLight(0xffffff, 0.5))

// CANNON INIT
//initialise the physics world
const physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0,-9.83,0)
});
const timeStep = 1/60;
const cannonDebugger = new CannonDebugger(scene, physicsWorld, {
    // options...
})


//BODIES AND OBJECTS
const groundGeom= new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT);
const groundMaterial = new THREE.MeshLambertMaterial({
    color: 0x221021,
    wireframe: false
})
const groundMesh = new THREE.Mesh(groundGeom, groundMaterial);
groundMesh.receiveShadow=true;
scene.add(groundMesh);
const groundBody = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(PLANE_WIDTH/2,PLANE_HEIGHT/2, 0.1)),
    material: new CANNON.Material(), //add material to ground object that can change friction
})
physicsWorld.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);

//BOX
const boxGeom= new THREE.BoxGeometry(2,2,2);
const boxMAterial = new THREE.MeshLambertMaterial({
    color: 0x006600,
    wireframe:false
})
const boxMesh = new THREE.Mesh(boxGeom, boxMAterial);
boxMesh.castShadow=true;
scene.add(boxMesh);
const boxBody = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(1,1,1)),
    position: new CANNON.Vec3(2,20,0),
    material: new CANNON.Material(), //add material to the box to allow friction
    mass:1,
})
boxBody.angularVelocity.set(0,8,0) //init box as spinning
boxBody.angularDamping=0.4; //slow rotation
physicsWorld.addBody(boxBody);

//SHPERE
const sphereGeom= new THREE.SphereGeometry(2);
const sphereMAterial = new THREE.MeshLambertMaterial({
    color: 0x000066,
    wireframe:false
})
const sphereMesh = new THREE.Mesh(sphereGeom, sphereMAterial);
sphereMesh.castShadow=true;
scene.add(sphereMesh);
const sphereBody = new CANNON.Body({
    shape: new CANNON.Sphere(2),
    position: new CANNON.Vec3(0,15,0),
    material: new CANNON.Material(),
    mass:1,
})
sphereBody.linearDamping = 0.5; //allow for decceleration
physicsWorld.addBody(sphereBody);


//make the ground slippy with little fraction
const groundBoxContactMaterial = new CANNON.ContactMaterial(
    groundBody.material,
    boxBody.material,
    {friction:0.002}
);
physicsWorld.addContactMaterial(groundBoxContactMaterial);

//make the ground bouncy for the ball
const groundSphereContactMaterial = new CANNON.ContactMaterial(
    groundBody.material,
    sphereBody.material,
    {restitution:0.9}
);
physicsWorld.addContactMaterial(groundSphereContactMaterial);


//ANIMATION LOOP
function animate() {
    //Time step
    physicsWorld.step(timeStep);
    cannonDebugger.update() //
    //link up cannon and threejs
    groundMesh.position.copy(groundBody.position);
    groundMesh.quaternion.copy(groundBody.quaternion);
    //box synch
    boxMesh.position.copy(boxBody.position);
    boxMesh.quaternion.copy(boxBody.quaternion);
    //sphere sync
    sphereMesh.position.copy(sphereBody.position);
    sphereMesh.quaternion.copy(sphereBody.quaternion);

    //update render
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

//window listenener for resize
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


