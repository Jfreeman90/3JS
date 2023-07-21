import * as THREE from 'three';

//create class for boxes extending mesh with adition infomation
class Box extends THREE.Mesh {
    //init new box with defined height width and depth and stationary velocity by default
    constructor({width, height, depth, color, velocity = {x:0, y:0.00, z:0}, position= {x:0, y:0, z:0}, isGround=false, heightChecker=false}){
        //mesh
        super(new THREE.BoxGeometry(width, height, depth), new THREE.MeshLambertMaterial({color})) //use the default THREE.mesh constrcutor
        //Gravity constant
        this.GRAVITY=-0.0003;
        this.AIR_RESISTANCE=0.8;
        //dimensions
        this.width = width;
        this.height = height;
        this.depth = depth;
        //set position on object creation
        this.position.set(position.x, position.y, position.z);
        //all edges of the cubes
        this.bottom = this.position.y - this.height/2;
        this.top = this.position.y + this.height/2;
        this.left =this.position.x - this.width/2;;
        this.right =this.position.x + this.width/2;
        this.front =this.position.z + this.depth/2;
        this.back = this.position.z - this.depth/2;
        // the speed and direction the cube is currently moving
        this.velocity = velocity;
        //define if the particular clock is the ground platform
        this.isGround = isGround;
        //define if the box is a height checker
        this.heightChecker=heightChecker
    }

    updateEdges(){
        //update the positions of the edges of the cube
        this.bottom = this.position.y - this.height/2;
        this.top = this.position.y + this.height/2;
        this.left =this.position.x - this.width/2;;
        this.right =this.position.x + this.width/2;
        this.front =this.position.z + this.depth/2;
        this.back = this.position.z - this.depth/2;
    }

    //new method to update positions
    update(){
        //update the position of the cubes edges
        this.updateEdges();

        //movement update
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;

        //verticle movement
        //update box due to gravity
        this.velocity.y -= this.GRAVITY;           
    }
    
    //and check for ground
    applyGravity(ground){
        //check for ground collision
        if(boxCollision({box1: this, box2:ground})){
            //reduce velocity due to friction before deciding rebound height
            this.velocity.y *= (this.AIR_RESISTANCE / this.mass);
            this.velocity.y = -this.velocity.y;
        } else {this.position.y += this.velocity.y;}
    }

    maxHeight(heightCheckerObject){
        if(!boxCollision({box1:this, box2:heightCheckerObject})){
            //console.log("Height checker stops");
            if (this.heightChecker){
                this.velocity.y=0;
            }
        }
    }
}

export default Box;
//functions used 

function boxCollision({box1, box2}){
    //check collisions  
    const xCollision=box1.right >= box2.left && box1.left <= box2.right;
    const yCollision =box1.bottom + box1.velocity.y <= box2.top && box1.top >=box2.bottom;
    const zCollision=box1.front >= box2.back && box1.back <= box2.front;

    //if collision 
    return xCollision && yCollision && zCollision
}

function verticalCollision({box1, box2}){
    //check collisions
    console.log("box1 bottom", box1.bottom);
    console.log("box2 top", box2.bottom);
    const yCollision = box1.bottom + box1.velocity.y <= box2.top;

    //if collision 
    return yCollision
}