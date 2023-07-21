import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import CannonDebugger from 'cannon-es-debugger';
import Box from "./Box";

// Sizes of canvas
const sizes = {
    width: 1000,
    height:800
}

// Scene
const scene = new THREE.Scene();

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas.webgl'),
    antialias:true,
    alpha:true,
})
renderer.shadowMap.enabled=true;    //allow shadows
renderer.setSize(sizes.width, sizes.height)

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.set(0,10,30)
scene.add(camera)
//init camera controls
const controls = new OrbitControls(camera, renderer.domElement);
renderer.render(scene, camera)

//initialise the physics world
const physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0,-9.83,0)
});

//view cannon objects
const cannonDebugger = new CannonDebugger(scene, physicsWorld, {
    // options...
})

//add light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 20, 20);
directionalLight.castShadow=true;   //allow shadows
const helper = new THREE.DirectionalLightHelper(directionalLight, 2);
scene.add( helper );
scene.add(directionalLight);
//add some ambient light
scene.add(new THREE.AmbientLight(0xffffff, 0.5))

//add a point light
const pointLight = new THREE.PointLight( 0xffffff, 1, 100 );
pointLight.position.set( 10, 10, 10 );
scene.add( pointLight );

const sphereSize = 1;
const pointLightHelper = new THREE.PointLightHelper( pointLight, sphereSize );
scene.add( pointLightHelper );

//create a ground body in the physics world
const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(15, 15, 0.1)),
});
//rotate ground body by 90
groundBody.quaternion.setFromEuler(-Math.PI/2,  0, 0);
physicsWorld.addBody(groundBody);
//create the ground object in 3 js
const ground3JS= new THREE.Mesh(new THREE.PlaneGeometry(30, 30, 8, 8), new THREE.MeshLambertMaterial({side: THREE.DoubleSide }));
ground3JS.rotateX(-Math.PI/2);
ground3JS.receiveShadow=true;
ground3JS.material.color.setHex(0x033f21);
scene.add(ground3JS);

//Add a box physics object 0 box dimensions are half of 3js diemensions
const boxBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Box(new CANNON.Vec3(1,1,2)),
});
boxBody.position.set(1,12,0);
physicsWorld.addBody(boxBody);
//Add a corresponding scene object
const box3JS= new Box({width:2, height:2, depth:4, color:"#ffffff", velocity:{x:0, y:0, z:0}, position:{x:0, y:0, z:0}});
box3JS.castShadow=true;
scene.add(box3JS);

//click a box to return its object in the console.
//find object that is clicked on in the scenes, nearest the foreground and console.log the object.
window.addEventListener('mousedown', (event) =>{
    let pointer = new THREE.Vector2((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);
    let rayCaster = new THREE.Raycaster();
    rayCaster.setFromCamera( pointer, camera );
    const intersects = rayCaster.intersectObjects( scene.children, false );

    let closestObject;
    let objectDistance=1000000000;
    intersects.forEach(object => {
        if (object.distance<objectDistance){
            objectDistance = object.distance;
            closestObject = object;
        }
    });

    const positionArray=closestObject.object.geometry.attributes.position.array;
})

//connstant
let frames=0;
let boxesCannon=[boxBody]
let boxes3JS=[box3JS];
const SPAWN_HEIGHT = 16;
const SPAWN_RATE=50;
const PLANE_WIDTH=30;
const PLANE_LENGTH=30;
const MAX_DIMENSION=2;
const MAX_CUBES=50;

//random number between max and min;
function randBetweenMaxMin(max, min){
    return Math.random() * (max - min) + min
};      

//animate
function animate() {
    requestAnimationFrame(animate)
    physicsWorld.fixedStep();
    //cannonDebugger.update();

    //sphere3JS.position.copy(sphereBody.position);
    //sphere3JS.quaternion.copy(sphereBody.quaternion);


    //render each box
    for( let i=0; i<boxesCannon.length; i++){
        boxes3JS[i].position.copy(boxesCannon[i].position);
        boxes3JS[i].quaternion.copy(boxesCannon[i].quaternion);
    }

    renderer.render(scene, camera) // Render the three.js scene
    //increase frame count
    frames++;

    if(boxes3JS.length<MAX_CUBES){
        //spawn new object
        if (frames%SPAWN_RATE===0){
            //add new 3 and cannon box with new dimsensions and position in the x/z plane
            const xRand= randBetweenMaxMin(PLANE_WIDTH/2 - MAX_DIMENSION/2, -PLANE_WIDTH/2 + MAX_DIMENSION/2);
            const zRand= randBetweenMaxMin(PLANE_LENGTH/2 - MAX_DIMENSION/2, -PLANE_LENGTH/2 + MAX_DIMENSION/2);
            //new random dimension
            const randWidth= randBetweenMaxMin(MAX_DIMENSION, 0);
            const randHeight= randBetweenMaxMin(MAX_DIMENSION, 0);
            const randDepth= randBetweenMaxMin(MAX_DIMENSION, 0);
            //new random rotation on spawn
            const xRotation=randBetweenMaxMin(-Math.PI, Math.PI);
            const yRotation=randBetweenMaxMin(-Math.PI, Math.PI);
            const zRotation=randBetweenMaxMin(-Math.PI, Math.PI);
            //set random color
            const randomColor = "0x"+ String(Math.floor(Math.random() * (0xffffff + 1)).toString(16));
            //add the bodies
            //Add a box physics object 0 box dimensions are hald of 3js diemensions
            const boxBody = new CANNON.Body({mass: 5, shape: new CANNON.Box(new CANNON.Vec3(randWidth, randHeight, randDepth))});
            boxBody.position.set(xRand, SPAWN_HEIGHT, zRand);
            physicsWorld.addBody(boxBody);
            //update the random angles
            boxBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), xRotation);
            boxBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), yRotation);
            boxBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0,0,1), zRotation);
            boxesCannon.push(boxBody);
            //Add a corresponding scene object
            const box3JS=new THREE.Mesh(new THREE.BoxGeometry(randWidth*2, randHeight*2, randDepth*2), new THREE.MeshLambertMaterial());
            box3JS.castShadow=true;
            box3JS.material.color.setHex(randomColor);
            scene.add(box3JS);
            boxes3JS.push(box3JS);
        }
    }
}
animate()