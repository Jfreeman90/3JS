import * as THREE from "three";
import * as CANNON from "cannon-es";
import CannonDebugger from 'cannon-es-debugger';
import level1Data from "../static/level1Data.json" assert {type: "json"}

// ------------------------------------------------
///                LOAD LEVEL DATA
//--------------------------------------------------
const levelData = level1Data;
// ------------------------------------------------
///            CONSTANTS & VARIABLES
//--------------------------------------------------
const PLANE_WIDTH = levelData.ground.dimensions.width;
const PLANE_HEIGHT = levelData.ground.dimensions.height;
const PLANE_DEPTH = levelData.ground.dimensions.depth;
// boxes played
let currentBoxIndex = 0;
let cubeInPlayYPosition=10;
//tracks state of clicks to decide if user is holding down
const mouseHold ={hold: false, mouseDown:false, mouseUp:true}

// ------------------------------------------------
///                     RENDERER
//--------------------------------------------------
const renderer = new THREE.WebGLRenderer({antialias: true, alpha:true});
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// ------------------------------------------------
///                     SCENE & CAMERA
//--------------------------------------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
// Camera positioning
camera.position.set(levelData.scene.cameraPosition.x, levelData.scene.cameraPosition.y, levelData.scene.cameraPosition.z);
camera.lookAt(levelData.scene.cameraDirection.x, levelData.scene.cameraDirection.y, levelData.scene.cameraDirection.z);


// -------------------------------------------------
///           LIGHTING
//--------------------------------------------------
const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(levelData.scene.pointLightPosition.x, levelData.scene.pointLightPosition.y, levelData.scene.pointLightPosition.z);
pointLight.castShadow=true;
scene.add(pointLight);
const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
scene.add(pointLightHelper);
//add some ambient light if level needs
if(levelData.scene.ambientLight){
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
}


// ------------------------------------------------
///                     CANNON
//--------------------------------------------------
const physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, levelData.scene.gravity, 0)
});
const timeStep = levelData.scene.timeStep;


// ------------------------------------------------
///                     GROUND
//--------------------------------------------------
const groundGeom= new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT);
const groundMaterial = new THREE.MeshLambertMaterial({
    color: levelData.ground.color,
    wireframe: false
})
const groundMesh = new THREE.Mesh(groundGeom, groundMaterial);
groundMesh.name="Ground"
groundMesh.receiveShadow=true;
scene.add(groundMesh);
const groundBody = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(PLANE_WIDTH/2,PLANE_HEIGHT/2, PLANE_DEPTH)),
    material: new CANNON.Material(), //add material to ground object that can change friction
})
physicsWorld.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);


// ------------------------------------------------
///                     BOXES
//--------------------------------------------------
//boxes playable in the level
let playableBoxesMesh=[];
let playableBoxesBody=[];
let playableBoundingBoxes=[]

//loop through each box and add to the arrays
levelData.blocks.forEach(block => {
    //create an object for each box and push to playable boxes
    // Three JS Mesh
    let boxMesh = new THREE.Mesh(
        new THREE.BoxGeometry(block.dimensions.width, block.dimensions.height, block.dimensions.depth),
        new THREE.MeshLambertMaterial({color: block.color}),
    );
    boxMesh.position.set(block.position.x, block.position.y, block.position.z);
    boxMesh.name=block.name;
    boxMesh.castShadow=true;
    // Three JS Bounding box for height checking collision
    let boxBoundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    boxBoundingBox.setFromObject(boxMesh); //set min and max values based on the cube
    //Cannon JS box body for the physics simulation
    let boxBody =new CANNON.Body({
        shape: new CANNON.Box(new CANNON.Vec3(block.dimensions.width/2, block.dimensions.height/2, block.dimensions.depth/2)),
        position: new CANNON.Vec3(block.position.x, block.position.y, block.position.z),
        material: new CANNON.Material(), //add material to the box to allow friction
        type: CANNON.Body.DYNAMIC
    })
    boxBody.angularDamping=block.angularDamping; //slow rotation
    boxBody.name=block.name;
    //make the ground slippy with little fraction for each box and small bounce.
    let groundBoxContactMaterial = new CANNON.ContactMaterial(
        groundBody.material,
        boxBody.material,
        {friction:levelData.ground.friction, restitution: levelData.ground.restitution}
    );
    physicsWorld.addContactMaterial(groundBoxContactMaterial);
    //add all of the box objects to the array of boxes that can be played
    playableBoxesMesh.push(boxMesh);
    playableBoxesBody.push(boxBody);
    playableBoundingBoxes.push(boxBoundingBox);
});

//array of all boxes, begin with one in it
let allBoxesMesh = [playableBoxesMesh[0]];
let allBoxesBody = [playableBoxesBody[0]];
let allBoundingBoxes = [playableBoundingBoxes[0]]
let maxHeight; //scores after each cube
// Array to track if a box has been dropped
let allBoxesDropped = [false]; // Initialize with the first box not dropped


// ------------------------------------------------
///               ANIMATION LOOP
//--------------------------------------------------
function animate() {
    // Keep track of highest point without using the height checker
    let currentMaxHeight = 0;

    //Time step
    physicsWorld.step(timeStep);

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


            // Check if this box has a higher point than our current max
            const boxMaxY = allBoundingBoxes[i].max.y;
            if (boxMaxY > currentMaxHeight) {
                currentMaxHeight = boxMaxY;
            }
        }
    }

    // Update max height if it's changed (with adjusted value)
    const adjustedHeight = currentMaxHeight - PLANE_DEPTH;
    
    // Round to 2 decimal places to avoid floating point precision issues
    const displayHeight = Math.round(adjustedHeight * 100) / 100;
    
    // Only update the DOM if the displayed height value has changed
    if (displayHeight !== parseFloat(document.getElementById("Height_score").textContent.split(": ")[1])) {
        document.getElementById("Height_score").innerHTML = `HEIGHT: ${displayHeight}`;
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
            // Check the current box is in play(hasnt began falling yet) and if so it should be intercatable
            //TODO
            if (closestObject.object.name==="Box"&& !allBoxesDropped[currentBoxIndex]){
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
        // Mark the current box as dropped
        allBoxesDropped[currentBoxIndex] = true;

        //drop the box
        allBoxesBody[currentBoxIndex].mass=2;
        allBoxesBody[currentBoxIndex].updateMassProperties();
        //if (playableBoxesMesh[currentBoxIndex]){
        if (cubeInPlayYPosition < 8 ){
            //push the next cube that is playable into the renderedable 3js arrays
            allBoxesMesh.push(playableBoxesMesh[currentBoxIndex]);
            allBoxesBody.push(playableBoxesBody[currentBoxIndex]);
            allBoundingBoxes.push(playableBoundingBoxes[currentBoxIndex]);

            // Add to dropped state array for the new box
            allBoxesDropped.push(false);

            //update for next box index
            currentBoxIndex++;
        }
    }
})
