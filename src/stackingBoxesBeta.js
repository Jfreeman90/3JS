import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import CannonDebugger from 'cannon-es-debugger';
import Box from "./Box";
import level1Data from "../static/level1Data.json" assert {type: "json"}

console.log(level1Data)

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
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
// Sets orbit control to move the camera around
//const orbit = new OrbitControls(camera, renderer.domElement);
// Camera positioning
camera.position.set(15, 23, 30);
camera.lookAt(0, 0, 0);
//orbit.update();

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
//debugger
//const cannonDebugger = new CannonDebugger(scene, physicsWorld, {
    // options...})


//BODIES AND OBJECTS
const groundGeom= new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT);
const groundMaterial = new THREE.MeshLambertMaterial({
    color: 0x221021,
    wireframe: false
})
const groundMesh = new THREE.Mesh(groundGeom, groundMaterial);
groundMesh.name="Ground"
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
const boxMaterial = new THREE.MeshLambertMaterial({
    color: 0x006600,
    wireframe:false,
})
const boxMesh = new THREE.Mesh(boxGeom, boxMaterial);
boxMesh.position.set(2,10,0)
boxMesh.name="Box"
boxMesh.castShadow=true;
//scene.add(boxMesh);
//add a bounding box for collision detection
const boxBoundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
boxBoundingBox.setFromObject(boxMesh); //set min and max values based on the cube
//cannon body
const boxBody = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(1,1,1)),
    position: new CANNON.Vec3(2,10,0),
    material: new CANNON.Material(), //add material to the box to allow friction
    type: CANNON.Body.DYNAMIC
})
//boxBody.angularVelocity.set(0,3,0) //init box as spinning
boxBody.angularDamping=0.6; //slow rotation
boxBody.name="Box";
//physicsWorld.addBody(boxBody);

//make the ground slippy with little fraction
const groundBoxContactMaterial = new CANNON.ContactMaterial(
    groundBody.material,
    boxBody.material,
    {friction:0.006, restitution:0.2}
);
physicsWorld.addContactMaterial(groundBoxContactMaterial);

//BOX2
const boxMesh2 = new THREE.Mesh(boxGeom, boxMaterial);
boxMesh2.position.set(2,10,0)
boxMesh2.name="Box"
boxMesh2.castShadow=true;
//scene.add(boxMesh2);
//add a bounding box for collision detection
const boxBoundingBox2 = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
boxBoundingBox2.setFromObject(boxMesh2); //set min and max values based on the cube
//cannon body
const boxBody2 = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(1,1,1)),
    position: new CANNON.Vec3(2,10,0),
    material: new CANNON.Material(), //add material to the box to allow friction
    type: CANNON.Body.DYNAMIC
})
//boxBody.angularVelocity.set(0,3,0) //init box as spinning
boxBody2.angularDamping=0.6; //slow rotation
boxBody2.name="Box";
//physicsWorld.addBody(boxBody2);

//BOX2
const boxMesh3 = new THREE.Mesh(boxGeom, boxMaterial);
boxMesh3.position.set(2,10,0)
boxMesh3.name="Box"
boxMesh3.castShadow=true;
//scene.add(boxMesh2);
//add a bounding box for collision detection
const boxBoundingBox3 = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
boxBoundingBox3.setFromObject(boxMesh2); //set min and max values based on the cube
//cannon body
const boxBody3 = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(1,1,1)),
    position: new CANNON.Vec3(2,10,0),
    material: new CANNON.Material(), //add material to the box to allow friction
    type: CANNON.Body.DYNAMIC
})
//boxBody.angularVelocity.set(0,3,0) //init box as spinning
boxBody3.angularDamping=0.6; //slow rotation
boxBody3.name="Box";
//physicsWorld.addBody(boxBody2);


// boxes played
let currentBoxIndex = 0;
let maxCubesInLevel=2;
let cubeInPlayYPosition=10;

//boxes playable in the level
let playableBoxesMesh=[boxMesh2, boxMesh3];
let playableBoxesBody=[boxBody2, boxBody3];
let playableBoundingBoxes=[boxBoundingBox2, boxBoundingBox3]
//array of all boxes, begin with one in it
let allBoxesMesh = [boxMesh];
let allBoxesBody = [boxBody];
let allBoundingBoxes = [boxBoundingBox]

//ANIMATION LOOP
function animate() {
    //Time step
    physicsWorld.step(timeStep);
    //cannonDebugger.update() 

    //link up cannon and threejs for ground mesh
    groundMesh.position.copy(groundBody.position);
    groundMesh.quaternion.copy(groundBody.quaternion);

    //update and draw all of the box objects
    for (let i=0; i<allBoxesMesh.length; i++){
        if(allBoxesMesh[i]){
            // only show the 
            scene.add(allBoxesMesh[i]);
            physicsWorld.addBody(allBoxesBody[i]);
            //update the js boxes to match cannon
            allBoxesMesh[i].position.copy(allBoxesBody[i].position);
            allBoxesMesh[i].quaternion.copy(allBoxesBody[i].quaternion);
            allBoundingBoxes[i].copy(allBoxesMesh[i].geometry.boundingBox).applyMatrix4(allBoxesMesh[i].matrixWorld);
        }
    }

    //update the current box in plays y position
    cubeInPlayYPosition=allBoxesBody[currentBoxIndex].position.y;

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

//tracks state of clicks to decide if user is holding down
const mouseHold ={hold: false, mouseDown:false, mouseUp:true}

//decide how to rotate the object depening on movement of the mouse
window.addEventListener('mousemove', (event) =>{
    let directionX = event.movementX;   
    let directionY = event.movementY;
    //only detect and act on mousemovement if the user is holding down click
    if(mouseHold.hold){
        //Find the box currently interacted with
        let pointer = new THREE.Vector2((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);
        let rayCaster = new THREE.Raycaster();
        rayCaster.setFromCamera(pointer, camera);
        const intersects = rayCaster.intersectObjects( scene.children, false );
    
        //variable to find the closest object
        let closestObject;
        let objectDistance=1000000000;

        //if no interesction ignore
        if (intersects.length !==0){
            intersects.forEach(object => {
                if (object.distance<objectDistance){
                    objectDistance = object.distance;
                    closestObject = object;
                }
            });
            if (closestObject.object.name==="Box"){
                // update the 3js rotation
                let deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
                  toRadians(directionY * 1),
                  toRadians(directionX * 1),
                  0,
                  'XYZ'
                ));
                //update 3js mesh of the object targetted
                allBoxesMesh[currentBoxIndex].quaternion.multiplyQuaternions(deltaRotationQuaternion, allBoxesMesh[currentBoxIndex].quaternion);
                //map 3js to the cannon object
                allBoxesBody[currentBoxIndex].quaternion.copy(allBoxesMesh[currentBoxIndex].quaternion);
        }}
    }

});

//mouse down toggle for holding
window.addEventListener('mousedown', (event) =>{
    mouseHold.hold=true;
    mouseHold.mouseDown=true;
    mouseHold.mouseUp=false;
});

//mouse up toggle for holding
window.addEventListener('mouseup', (event) =>{
    mouseHold.mouseUp=true;
    mouseHold.mouseDown=false;
    mouseHold.hold=false;
});

//helpers
function toRadians(angle) {
	return angle * (Math.PI / 180);
}

//space to turn on gravity - add mass to cannon and begin its fall after rotating
window.addEventListener('keydown', (event)=>{
    if (event.code === "Space"){
        //drop the box
        allBoxesBody[currentBoxIndex].mass=2;
        allBoxesBody[currentBoxIndex].updateMassProperties();
        if (playableBoxesMesh[currentBoxIndex]){
            //wait for cube to hit floor before spawning next cube with next click
            if (cubeInPlayYPosition<8){
                //push the next cube that is playable into the renderedable 3js arrays
                allBoxesMesh.push(playableBoxesMesh[currentBoxIndex]);
                allBoxesBody.push(playableBoxesBody[currentBoxIndex]);
                allBoundingBoxes.push(playableBoundingBoxes[currentBoxIndex]);
                //update for next box index
                currentBoxIndex++;
            }
        }
        
    }
})
