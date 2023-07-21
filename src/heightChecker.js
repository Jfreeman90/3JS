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
camera.position.set(15, 23, 35);
camera.lookAt(0,0,0)
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

//BODIES AND OBJECTS
const groundGeom= new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT);
const groundMaterial = new THREE.MeshLambertMaterial({
    color: 0x221021,
    wireframe: false
})
const groundMesh = new THREE.Mesh(groundGeom, groundMaterial);
groundMesh.receiveShadow=true;
scene.add(groundMesh);
//add the cannon object
const groundBody = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(PLANE_WIDTH/2,PLANE_HEIGHT/2, 0.1)),
    material: new CANNON.Material(), //add material to ground object that can change friction
})
physicsWorld.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);

//BOX
const boxGeom= new THREE.BoxGeometry(2,3,2);
const boxMAterial = new THREE.MeshLambertMaterial({
    color: 0x006600,
    wireframe:false
})
const boxMesh = new THREE.Mesh(boxGeom, boxMAterial);
boxMesh.castShadow=true;
scene.add(boxMesh);
//add a bounding box for collision detection
const boxBoundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
boxBoundingBox.setFromObject(boxMesh); //set min and max values based on the cube
//cannon object
const boxBody = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(1, 1.5, 1)),
    position: new CANNON.Vec3(0, 1.5, 0),
    material: new CANNON.Material(), //add material to the box to allow friction
    mass:1,
})
boxBody.angularVelocity.set(0,0,0) //init box as spinning
boxBody.angularDamping=0.4; //slow rotation
physicsWorld.addBody(boxBody);

//BOX 2
const box2Geom= new THREE.BoxGeometry(2,3,2);
const box2MAterial = new THREE.MeshLambertMaterial({
    color: 0x006600,
    wireframe:false
})
const box2Mesh = new THREE.Mesh(box2Geom, box2MAterial);
box2Mesh.castShadow=true;
scene.add(box2Mesh);
//add a bounding box for collision detection
const boxBoundingBox2 = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
boxBoundingBox2.setFromObject(box2Mesh); //set min and max values based on the cube
//cannon object
const boxBody2 = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(1, 1.5, 1)),
    position: new CANNON.Vec3(0, 5, 0),
    material: new CANNON.Material(), //add material to the box to allow friction
    mass:1,
})
boxBody2.angularVelocity.set(0,0,0) //init box as spinning
boxBody2.angularDamping=0.4; //slow rotation
physicsWorld.addBody(boxBody2);


//make the ground slippy with little fraction
const groundBoxContactMaterial = new CANNON.ContactMaterial(
    groundBody.material,
    boxBody.material,
    {friction:0.002, restitution:0.1}
);
physicsWorld.addContactMaterial(groundBoxContactMaterial);

//initiate a plane that scrolls down and stops when intersecrts with another box object
const heightCheckerDimensions={x:10, y:0.05, z:10}
const heightCheckerGeom= new THREE.BoxGeometry(heightCheckerDimensions.x, heightCheckerDimensions.y, heightCheckerDimensions.z);
const heightCheckerMaterial = new THREE.MeshLambertMaterial({
    color: 0x006600,
    wireframe:false,
    visible:true,
})
const heightCheckerMesh = new THREE.Mesh(heightCheckerGeom, heightCheckerMaterial);
scene.add(heightCheckerMesh);
//add a bounding box for collision detection
const heightCheckerBoundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
heightCheckerBoundingBox.setFromObject(heightCheckerMesh); //set min and max values based on the cube
//Cannon
const heightCheckerBody = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(heightCheckerDimensions.x/2, heightCheckerDimensions.y/2, heightCheckerDimensions.z/2)),
    position: new CANNON.Vec3(0, 20, 0),
    material: new CANNON.Material(), //add material to the box to allow friction
    mass:0.1,
})
physicsWorld.addBody(heightCheckerBody);

//frame count for collision checks instead of every itteration
let frames=0;

//array of all boxes
const allBoxesMesh = [boxMesh, box2Mesh];
const allBoxesBody = [boxBody, boxBody2];
const allBoundingBoxes = [boxBoundingBox, boxBoundingBox2]

//ANIMATION LOOP
function animate() {
    //Time step
    physicsWorld.step(timeStep);
    //link up cannon and threejs
    groundMesh.position.copy(groundBody.position);
    groundMesh.quaternion.copy(groundBody.quaternion);

    //heightChcker sync and bounding
    heightCheckerMesh.position.copy(heightCheckerBody.position);
    heightCheckerMesh.quaternion.copy(heightCheckerBody.quaternion);
    heightCheckerBoundingBox.copy(heightCheckerMesh.geometry.boundingBox).applyMatrix4(heightCheckerMesh.matrixWorld);

    for (let i=0; i<allBoxesMesh.length; i++){
        allBoxesMesh[i].position.copy(allBoxesBody[i].position);
        allBoxesMesh[i].quaternion.copy(allBoxesBody[i].quaternion);
        allBoundingBoxes[i].copy(allBoxesMesh[i].geometry.boundingBox).applyMatrix4(allBoxesMesh[i].matrixWorld);
        //check for max height with a collision of that box
        if (frames%60===1){
            if (heightCheckerBoundingBox.intersectsBox(allBoundingBoxes[i])){
                console.log("Max height:", heightCheckerMesh.position.y - heightCheckerDimensions.y*2);
            }
        }
    }

    frames++
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


