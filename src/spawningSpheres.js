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
const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );
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
    wireframe: false,
    side:THREE.DoubleSide
})
const groundMesh = new THREE.Mesh(groundGeom, groundMaterial);
groundMesh.receiveShadow=true;
scene.add(groundMesh);
const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(PLANE_WIDTH/2, PLANE_HEIGHT/2, 0.1)),
    material: new CANNON.Material(), //add material to ground object that can change friction
})
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
physicsWorld.addBody(groundBody);


//event listener for clicking the mouse
const mouse =  new THREE.Vector2();
const intersectionPoint=new THREE.Vector3();
const planeNormal = new THREE.Vector3();
const plane = new THREE.Plane();
const raycaster = new THREE.Raycaster();

//SHPERES ADDED ON CLICK
const sphereMeshes=[];
const sphereBodies=[];
window.addEventListener('click', (e) =>{
    //find location
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    planeNormal.copy(camera.position).normalize();
    plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position);
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, intersectionPoint);
    if (intersectionPoint.y<0){
        intersectionPoint.y = -intersectionPoint.y
    }
    console.log(intersectionPoint)
    //add the mesh
    const sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 30, 30), new THREE.MeshLambertMaterial({
        color: Math.random()*0xFFFFFF,
        wireframe:false
    }));
    sphereMesh.castShadow=true;
    scene.add(sphereMesh);
    const sphereBody = new CANNON.Body({
        shape: new CANNON.Sphere(0.5),
        material: new CANNON.Material(),
        position: new CANNON.Vec3(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z),
        mass:0.2,
    })
    sphereBody.linearDamping = 0.2; //allow for decceleration
    physicsWorld.addBody(sphereBody);

    //make the ground bouncy for the ball
    const groundSphereContactMaterial = new CANNON.ContactMaterial(
    groundBody.material,
    sphereBody.material,
    {restitution:0.5}
    );
    physicsWorld.addContactMaterial(groundSphereContactMaterial);


    //append new spheres to the array of objects
    sphereBodies.push(sphereBody);
    sphereMeshes.push(sphereMesh);
});

const cannonDebugger = new CannonDebugger(scene, physicsWorld, {
    // options...
  })

//ANIMATION LOOP
function animate() {
    //Time step
    physicsWorld.step(timeStep);

    //link up cannon and threejs
    groundMesh.position.copy(groundBody.position);
    groundMesh.quaternion.copy(groundBody.quaternion);

    //upfate each circle
    for (let i=0; i<sphereBodies.length; i++){
        sphereMeshes[i].position.copy(sphereBodies[i].position);
        sphereMeshes[i].quaternion.copy(sphereBodies[i].quaternion);
    }

    //cannonDebugger.update() // Update the CannonDebugger meshes
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


