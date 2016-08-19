/* jshint esversion:6, node:true, sub: true */
"use strict";

var Perlin = require("./PerlinSimplex");
var Grid3D = require("./Grid3D");
var writeObj = require("./writeObj");

let materials = {
  "Sand"    : {r:1.00,g:0.90,b:0.70},
  "HardSand": {r:0.80,g:0.70,b:0.50},
  "Stone"   : {r:0.70,g:0.70,b:0.70},
  "Saphire" : {r:0.30,g:0.30,b:0.90},
  "Marble"  : {r:1.00,g:1.00,b:1.00},
  "Grass"   : {r:0.55,g:0.75,b:0.35},
  "Dirt"    : {r:0.30,g:0.15,b:0.00},
  "Wood"    : {r:0.45,g:0.15,b:0.00},
  "Leaf"    : {r:0.40,g:0.60,b:0.20},
  "Debug"   : {r:1.00,g:0.00,b:1.00},
};

Grid3D.prototype.createNoisySurface = function(p1,p2,t,scale,octave,noise){
  let P = new Perlin();
  P.noiseDetail(octave,noise);
  for(let x=p1.x;x<=p2.x;x++)
    for(let y=p1.y;y<=p2.y;y++){
      let zThr = p1.z + P.noise(x*scale,y*scale,0)*(p2.z-p1.z);
      for(let z=p1.z;z<=zThr;z++)
        this.set({x,y,z}, t);
    }
};

Grid3D.prototype.createBlock = function(p1,p2,t){
  for(let x=p1.x;x<=p2.x;x++)
    for(let y=p1.y;y<=p2.y;y++)
      for(let z=p1.z;z<=p2.z;z++)
        this.set({x,y,z}, t);
};

Grid3D.prototype.createCircle = function(pc,r,t){
  let cx = pc.x;
  let cy = pc.y;
  let z = pc.z;
  let r2 = r*r;
  let sx = Math.floor(cx-r);
  let ex = Math.ceil(cx+r);
  let sy = Math.floor(cy-r);
  let ey = Math.ceil(cy+r);
  for(let x=sx;x<=ex;x++)
    for(let y=sy;y<=ey;y++){
      let dx = x-cx;
      let dy = y-cy;
      if((dx*dx+dy*dy) <= r2) this.set({x,y,z}, t);
    }
};

Grid3D.prototype.createGround = function(z){
  this.fill(function(p,v){
    if(p.z < z) return "Dirt";
    if(p.z == z) return "Grass";
    return "Void";
  });
};

Grid3D.prototype.createDesert = function(z){
  this.fill(function(p,v){
    if(p.z <= z) return "Sand";
    return "Void";
  });
};

Grid3D.prototype.createCrenelage = function(p1,p2,offset,d1,d2,t1,t2){
  let dx = p2.x-p1.x;
  let dy = p2.y-p1.y;
  if(dx > dy){
    for(let x=p1.x+offset;x<=p2.x;x+=(d1+d2)){
      this.createBlock({x:Math.max(x,p1.x)          , y:p1.y, z:p1.z},
                       {x:Math.min(x+(d1-1),p2.x)   , y:p2.y, z:p2.z},
                       t1);
      if(x+d1 > p2.x) continue;
      this.createBlock({x:Math.max(x+d1,p1.x)       , y:p1.y, z:p1.z},
                       {x:Math.min(x+(d1+d2-1),p2.x), y:p2.y, z:p2.z},
                       t2);
    }
  }else if(dy > dx){
    for(let y=p1.y+offset;y<=p2.y;y+=(d1+d2)){
      this.createBlock({x:p1.x, y:Math.max(y,p1.y)          , z:p1.z},
                       {x:p2.x, y:Math.min(y+(d1-1),p2.y)   , z:p2.z},
                       t1);
      if(y+d1 > p2.y) continue;
      this.createBlock({x:p1.x, y:Math.max(y+d1,p1.y)       , z:p1.z},
                       {x:p2.x, y:Math.min(y+(d1+d2-1),p2.y), z:p2.z},
                       t2);
    }
  }else{
    this.createBlock({x:p1.x  ,y:p1.y  ,z:p1.z},{x:p2.x  ,y:p2.y  ,z:p2.z},t1);
  }
};

Grid3D.prototype.createBaseTower = function(p1,p2,corner){
  this.createBlock({x:p1.x  ,y:p1.y  ,z:p1.z  },{x:p2.x  ,y:p2.y  ,z:p2.z-1},"Stone");
  this.createBlock({x:p1.x  ,y:p1.y  ,z:p2.z  },{x:p2.x  ,y:p2.y  ,z:p2.z+2},"Void");

  if(corner){
    this.createBlock({x:p1.x-2,y:p1.y-2,z:p2.z-3},{x:p2.x+2,y:p2.y+2,z:p2.z-1},"Stone");
    this.createBlock({x:p1.x-1,y:p1.y-1,z:p2.z-4},{x:p2.x+1,y:p2.y+1,z:p2.z-4},"Stone");
  }else{
    this.createBlock({x:p1.x-2,y:p1.y  ,z:p2.z-3},{x:p1.x-1,y:p2.y  ,z:p2.z-1},"Stone");
    this.createBlock({x:p2.x+1,y:p1.y  ,z:p2.z-3},{x:p2.x+2,y:p2.y  ,z:p2.z-1},"Stone");
    this.createBlock({x:p1.x  ,y:p1.y-2,z:p2.z-3},{x:p2.x  ,y:p1.y-1,z:p2.z-1},"Stone");
    this.createBlock({x:p1.x  ,y:p2.y+1,z:p2.z-3},{x:p2.x  ,y:p2.y+2,z:p2.z-1},"Stone");

    this.createBlock({x:p1.x-1,y:p1.y  ,z:p2.z-4},{x:p1.x-1,y:p2.y  ,z:p2.z-4},"Stone");
    this.createBlock({x:p2.x+1,y:p1.y  ,z:p2.z-4},{x:p2.x+1,y:p2.y  ,z:p2.z-4},"Stone");
    this.createBlock({x:p1.x  ,y:p1.y-1,z:p2.z-4},{x:p2.x  ,y:p1.y-1,z:p2.z-4},"Stone");
    this.createBlock({x:p1.x  ,y:p2.y+1,z:p2.z-4},{x:p2.x  ,y:p2.y+1,z:p2.z-4},"Stone");
  }
  this.createCrenelage({x:p1.x-2,y:p1.y  ,z:p2.z-4},{x:p1.x-2,y:p2.y  ,z:p2.z-4},0,2,2,"Stone","Void");
  this.createCrenelage({x:p1.x-1,y:p1.y  ,z:p2.z-5},{x:p1.x-1,y:p2.y  ,z:p2.z-5},0,2,2,"Stone","Void");

  this.createCrenelage({x:p2.x+2,y:p1.y  ,z:p2.z-4},{x:p2.x+2,y:p2.y  ,z:p2.z-4},0,2,2,"Stone","Void");
  this.createCrenelage({x:p2.x+1,y:p1.y  ,z:p2.z-5},{x:p2.x+1,y:p2.y  ,z:p2.z-5},0,2,2,"Stone","Void");

  this.createCrenelage({x:p1.x,y:p1.y-2,z:p2.z-4},{x:p2.x,y:p1.y-2,z:p2.z-4},0,2,2,"Stone","Void");
  this.createCrenelage({x:p1.x,y:p1.y-1,z:p2.z-5},{x:p2.x,y:p1.y-1,z:p2.z-5},0,2,2,"Stone","Void");

  this.createCrenelage({x:p1.x,y:p2.y+2,z:p2.z-4},{x:p2.x,y:p2.y+2,z:p2.z-4},0,2,2,"Stone","Void");
  this.createCrenelage({x:p1.x,y:p2.y+1,z:p2.z-5},{x:p2.x,y:p2.y+1,z:p2.z-5},0,2,2,"Stone","Void");
};


Grid3D.prototype.createTower = function(p1,p2,herb){
  this.createBaseTower(p1,p2);

  this.createCircle({x:(p1.x+p2.x)/2,y:(p1.y+p2.y)/2,z:p1.z-1},(p2.x-p1.x)/2+4,"Dirt");

  this.createBlock({x:p1.x-2,y:p1.y  ,z:p2.z  },{x:p1.x-1,y:p2.y  ,z:p2.z  },"Marble");
  this.createBlock({x:p2.x+1,y:p1.y  ,z:p2.z  },{x:p2.x+2,y:p2.y  ,z:p2.z  },"Marble");
  this.createBlock({x:p1.x  ,y:p1.y-2,z:p2.z  },{x:p2.x  ,y:p1.y-1,z:p2.z  },"Marble");
  this.createBlock({x:p1.x  ,y:p2.y+1,z:p2.z  },{x:p2.x  ,y:p2.y+2,z:p2.z  },"Marble");

  if(herb) this.createHedgeAround(p1,{x:p2.x,y:p2.y,z:p1.z+8},herb);
};

Grid3D.prototype.createBigTower = function(p1,p2){
  this.createBaseTower(p1,p2,true);

  this.createCrenelage({x:p1.x-2,y:p1.y-2,z:p2.z+2},{x:p1.x-1,y:p2.y+2,z:p2.z+2},-2,6,2,"Marble","Void");
  this.createCrenelage({x:p1.x-2,y:p1.y-2,z:p2.z+1},{x:p1.x-1,y:p2.y+2,z:p2.z+1},-2,6,2,"Stone","Void");
  this.createBlock    ({x:p1.x-2,y:p1.y-2,z:p2.z+0},{x:p1.x-1,y:p2.y+2,z:p2.z+0},"Stone");

  this.createCrenelage({x:p2.x+1,y:p1.y-2,z:p2.z+2},{x:p2.x+2,y:p2.y+2,z:p2.z+2},-2,6,2,"Marble","Void");
  this.createCrenelage({x:p2.x+1,y:p1.y-2,z:p2.z+1},{x:p2.x+2,y:p2.y+2,z:p2.z+1},-2,6,2,"Stone","Void");
  this.createBlock    ({x:p2.x+1,y:p1.y-2,z:p2.z+0},{x:p2.x+2,y:p2.y+2,z:p2.z+0},"Stone");

  this.createCrenelage({x:p1.x-2,y:p1.y-2,z:p2.z+2},{x:p2.x+2,y:p1.y-1,z:p2.z+2},-2,6,2,"Marble","Void");
  this.createCrenelage({x:p1.x-2,y:p1.y-2,z:p2.z+1},{x:p2.x+2,y:p1.y-1,z:p2.z+1},-2,6,2,"Stone","Void");
  this.createBlock    ({x:p1.x-2,y:p1.y-2,z:p2.z+0},{x:p2.x+2,y:p1.y-1,z:p2.z+0},"Stone");

  this.createCrenelage({x:p1.x-2,y:p2.y+1,z:p2.z+2},{x:p2.x+2,y:p2.y+2,z:p2.z+2},-2,6,2,"Marble","Void");
  this.createCrenelage({x:p1.x-2,y:p2.y+1,z:p2.z+1},{x:p2.x+2,y:p2.y+2,z:p2.z+1},-2,6,2,"Stone","Void");
  this.createBlock    ({x:p1.x-2,y:p2.y+1,z:p2.z+0},{x:p2.x+2,y:p2.y+2,z:p2.z+0},"Stone");
};

Grid3D.prototype.createDoor = function(p1,p2,side){
  this.createBigTower(p1,p2);
  let arr = [{m:4,z:[p1.z,p2.z-9]},{m:5,z:[p2.z-8,p2.z-8]},{m:6,z:[p2.z-7,p2.z-7]}];
  if(side == "N" || side == "S"){
    arr.forEach(function(e){
      this.createBlock({x:p1.x+e.m,y:p1.y,z:e.z[0]},{x:p2.x-e.m,y:p2.y,z:e.z[1]},"Void");
      this.createBlock({x:p1.x+e.m,y:p1.y+2,z:e.z[0]},{x:p2.x-e.m,y:p2.y-2,z:e.z[1]},"Wood");
    },this);
  }
  if(side == "E" || side == "W"){
    arr.forEach(function(e){
      this.createBlock({x:p1.x,y:p1.y+e.m,z:e.z[0]},{x:p2.x,y:p2.y-e.m,z:e.z[1]},"Void");
      this.createBlock({x:p1.x+2,y:p1.y+e.m,z:e.z[0]},{x:p2.x-2,y:p2.y-e.m,z:e.z[1]},"Wood");
    },this);
  }
  if(side == "E") this.createBlock({x:p2.x  ,y: p1.y  ,z: p1.z-1},{x:p2.x+4,y: p2.y  ,z: p1.z-1},"Dirt");
  if(side == "W") this.createBlock({x:p1.x-4,y: p1.y  ,z: p1.z-1},{x:p1.x  ,y: p2.y  ,z: p1.z-1},"Dirt");
  if(side == "N") this.createBlock({x:p1.x  ,y: p1.y-4,z: p1.z-1},{x:p2.x  ,y: p1.y  ,z: p1.z-1},"Dirt");
  if(side == "S") this.createBlock({x:p1.x  ,y: p2.y  ,z: p1.z-1},{x:p2.x  ,y: p2.y+4,z: p1.z-1},"Dirt");
};

Grid3D.prototype.createHedge = function(p1,p2){
  this.createBlock(p1,{x:p2.x,y:p2.y ,z:p1.z+1  },"Leaf");
  this.createNoisySurface({x:p1.x,y:p1.y ,z:p1.z+2  },p2, "Leaf", 1/128, 4, 4);
};

Grid3D.prototype.createHedgeAround = function(p1,p2,side){
  side = side || "EWNS";
  if(side.indexOf("S") >= 0) this.createHedge({x:p1.x  ,y:p2.y+1,z:p1.z},{x:p2.x  ,y:p2.y+2,z:p2.z});
  if(side.indexOf("N") >= 0) this.createHedge({x:p1.x  ,y:p1.y-2,z:p1.z},{x:p2.x  ,y:p1.y-1,z:p2.z});
  if(side.indexOf("E") >= 0) this.createHedge({x:p2.x+1,y:p1.y  ,z:p1.z},{x:p2.x+2,y:p2.y  ,z:p2.z});
  if(side.indexOf("W") >= 0) this.createHedge({x:p1.x-2,y:p1.y  ,z:p1.z},{x:p1.x-1,y:p2.y  ,z:p2.z});
};

Grid3D.prototype.createWall = function(p1,p2){
  this.createBlock({x:p1.x  ,y:p1.y  ,z:p2.z  },{x:p2.x  ,y:p2.y  ,z:p2.z  },"Marble");
  this.createBlock({x:p1.x  ,y:p1.y  ,z:p1.z  },{x:p2.x  ,y:p2.y  ,z:p2.z-1},"Stone");
};

Grid3D.prototype.createFortress = function(p1, p2,side){
  side = side || "";

  // Perimeter
  this.createBlock      ({x:p1.x-4,y:p1.y-4,z:p1.z-1}, {x:p2.x+4,y:p2.y+4,z:p1.z-1},"Dirt");
  this.createWall       ({x:p1.x  ,y:p1.y  ,z:p1.z  }, {x:p2.x  ,y:p1.y+1,z:p2.z});
  this.createWall       ({x:p1.x  ,y:p1.y  ,z:p1.z  }, {x:p1.x+1,y:p2.y  ,z:p2.z});
  this.createWall       ({x:p2.x-1,y:p1.y  ,z:p1.z  }, {x:p2.x  ,y:p2.y  ,z:p2.z});
  this.createWall       ({x:p1.x  ,y:p2.y-1,z:p1.z  }, {x:p2.x  ,y:p2.y  ,z:p2.z});
  this.createHedgeAround({x:p1.x  ,y:p1.y  ,z:p1.z  }, {x:p2.x  ,y:p2.y  ,z:p1.z+9});

  // Corner towers
  this.createTower({x:p1.x-2,y:p1.y-2,z: p1.z},{x:p1.x+3,y:p1.y+3,z: p2.z},"NW");
  this.createTower({x:p2.x-3,y:p1.y-2,z: p1.z},{x:p2.x+2,y:p1.y+3,z: p2.z},"NE");
  this.createTower({x:p1.x-2,y:p2.y-3,z: p1.z},{x:p1.x+3,y:p2.y+2,z: p2.z},"SW");
  this.createTower({x:p2.x-3,y:p2.y-3,z: p1.z},{x:p2.x+2,y:p2.y+2,z: p2.z},"SE");

  // Middle towers & doors
  let m = {x:p1.x+Math.floor((p2.x-p1.x)/2),y:p1.y+Math.floor((p2.y-p1.y)/2)};

  if(side.indexOf("W") >= 0){
    this.createDoor ({x:p1.x-2,y: m.y-4,z: p1.z  },{x:p1.x+3,y: m.y+9,z: p2.z  },"W");
  }else this.createTower({x:p1.x-2,y: m.y-2,z: p1.z},{x:p1.x+3,y: m.y+3,z: p2.z},"W");

  if(side.indexOf("E") >= 0){
    this.createDoor ({x:p2.x-3,y: m.y-4,z: p1.z  },{x:p2.x+2,y: m.y+9,z: p2.z  },"E");
  }else this.createTower({x:p2.x-3,y: m.y-2,z: p1.z},{x:p2.x+2,y: m.y+3,z: p2.z},"E");

  if(side.indexOf("N") >= 0){
    this.createDoor ({x:m.x-4,y: p1.y-2,z: p1.z  },{x:m.x+9,y: p1.y+3,z: p2.z  },"N");
  }else this.createTower({x: m.x-2,y:p1.y-2,z: p1.z},{x: m.x+3,y:p1.y+3,z: p2.z},"N");

  if(side.indexOf("S") >= 0){
    this.createDoor ({x:m.x-4,y: p2.y-3,z: p1.z  },{x:m.x+9,y: p2.y+2,z: p2.z  },"S");
  }else this.createTower({x: m.x-2,y:p2.y-3,z: p1.z},{x: m.x+3,y:p2.y+2,z: p2.z},"S");

  // Courtyard
  this.createBlock({x:p1.x+1,y:p1.y+1,z: p1.z-1},{x:p2.x-1,y:p2.y-1,z: p1.z-1},"Stone");
  this.createBlock({x:p1.x+6,y:p1.y+6,z: p1.z-1},{x:p2.x-6,y:p2.y-6,z: p1.z-1},"Grass");
};

Grid3D.prototype.createDesertWall = function(p1,p2){
  function Z(p,n,z){ return {x:p.x,y:p.y,z:(n==1?p1:p2).z+z}; }
  this.createBlock(Z(p1,1,  0),Z(p2,2, -7),"HardSand");
  this.createBlock(Z(p1,2, -7),Z(p2,2, -6),"Wood");
};

Grid3D.prototype.createDesertArch = function(p1,p2){
  function Z(p,n,z){ return {x:p.x,y:p.y,z:(n==1?p1:p2).z+z}; }
  this.createCrenelage(Z(p1,1,  0),Z(p2,2, -2),0,2,6,"HardSand","Void");
  this.createCrenelage(Z(p1,2, -1),Z(p2,2, -1),-1,4,4,"HardSand","Void");
  this.createCrenelage(Z(p1,2,  0),Z(p2,2,  0),-2,6,2,"HardSand","Void");
};

Grid3D.prototype.createDesertCrenelage = function(p1,p2){
  function Z(p,n,z){ return {x:p.x,y:p.y,z:(n==1?p1:p2).z+z}; }
  this.createBlock    (Z(p1,1,  0),Z(p2,1, 0),"HardSand");
  this.createCrenelage(Z(p1,1,  1),Z(p2,1, 2),-2,6,2,"HardSand","Void");
  this.createCrenelage(Z(p1,1,  3),Z(p2,1, 3),-1,4,4,"HardSand","Void");
  this.createCrenelage(Z(p1,1,  4),Z(p2,1, 4), 0,2,6,"HardSand","Void");
};

Grid3D.prototype.createDesertExternalWall = function(p1,p2){
  function Z(p,n,z){ return {x:p.x,y:p.y,z:(n==1?p1:p2).z+z}; }
  this.createDesertArch(Z(p1,1,  0),Z(p2,1,  7));
  this.createBlock     (Z(p1,1,  8),Z(p2,2, -8),"HardSand");
  this.createBlock     (Z(p1,2, -7),Z(p2,2, -6),"Wood");
  this.createDesertCrenelage(Z(p1,2, -5),p2);
};

Grid3D.prototype.createDesertInternalWall = function(p1,p2){
  function Z(p,n,z){ return {x:p.x,y:p.y,z:(n==1?p1:p2).z+z}; }
  this.createDesertArch(Z(p1,1,  0),Z(p2,1,  7));
  this.createBlock    (Z(p1,1,  8),Z(p2,2, -8),"HardSand");
  this.createBlock    (Z(p1,2, -7),Z(p2,2, -6),"Wood");
  this.createBlock    (Z(p1,2, -5),Z(p2,2, -5),"HardSand");
  this.createCrenelage(Z(p1,2, -4),Z(p2,2, -4),0,2,6,"HardSand","Void");
};

Grid3D.prototype.createDesertTower = function(p1,p2, side){
  function Z(p,n,z){ return {x:p.x,y:p.y,z:(n==1?p1:p2).z+z}; }
  this.createBlock(Z(p1,1,  0),Z(p2,2,-16),"HardSand");
  this.createBlock({x:p1.x+2,y:p1.y+2,z:p1.z},{x:p2.x-2,y:p2.y-2,z:p2.z-16},"Void");
  this.createBlock(Z(p1,2,-15),Z(p2,2,-14),"Wood");
  this.createBlock(Z(p1,2,-13),Z(p2,2, -8),"Saphire");
  this.createBlock({x:p1.x+2,y:p1.y+2,z:p2.z-13},{x:p2.x-2,y:p2.y-2,z:p2.z-8},"Void");
  this.createBlock(Z(p1,2, -7),Z(p2,2, -6),"Wood");
  this.createBlock(Z(p1,2, -5),Z(p2,2,  0),"Void");
  this.createDesertCrenelage({x:p1.x  ,y:p1.y  ,z:p2.z-5},{x:p1.x+1,y:p2.y  ,z:p2.z});
  this.createDesertCrenelage({x:p2.x-1,y:p1.y  ,z:p2.z-5},{x:p2.x  ,y:p2.y  ,z:p2.z});
  this.createDesertCrenelage({x:p1.x  ,y:p1.y  ,z:p2.z-5},{x:p2.x  ,y:p1.y+1,z:p2.z});
  this.createDesertCrenelage({x:p1.x  ,y:p2.y-1,z:p2.z-5},{x:p2.x  ,y:p2.y  ,z:p2.z});
};

Grid3D.prototype.createDesertDoorShape = function(p1,p2,side,type){
  if(side == "N" || side == "S"){
    this.createBlock({x:p1.x+0,y:p1.y  ,z:p1.z+0},{x:p2.x-0,y:p2.y  ,z:p2.z-2},type);
    this.createBlock({x:p1.x+1,y:p1.y  ,z:p2.z-1},{x:p2.x-1,y:p2.y  ,z:p2.z-1},type);
    this.createBlock({x:p1.x+2,y:p1.y  ,z:p2.z-0},{x:p2.x-2,y:p2.y  ,z:p2.z-0},type);
  }
  if(side == "E" || side == "W"){
    this.createBlock({x:p1.x  ,y:p1.y+0,z:p1.z+0},{x:p2.x  ,y:p2.y-0,z:p2.z-2},type);
    this.createBlock({x:p1.x  ,y:p1.y+1,z:p2.z-1},{x:p2.x  ,y:p2.y-1,z:p2.z-1},type);
    this.createBlock({x:p1.x  ,y:p1.y+2,z:p2.z-0},{x:p2.x  ,y:p2.y-2,z:p2.z-0},type);
  }
};
Grid3D.prototype.createDesertDoor = function(p1,p2,side){
  this.createDesertTower(p1,p2);
  let m = {x:0,y:0};
  if(side == "N" || side == "S") m.x = 6;
  if(side == "E" || side == "W") m.y = 6;
  this.createDesertDoorShape({x:p1.x+m.x,y:p1.y+m.y,z:p1.z},{x:p2.x-m.x,y:p2.y-m.y,z:p2.z-18},side,"Void");
};

Grid3D.prototype.createDesertCastle = function(p1, p2, side){
  side = side || "";
  this.createDesertWall({x:p1.x+2,y:p1.y+2,z:p1.z}, {x:p2.x-2,y:p1.y+7,z:p2.z});
  this.createDesertWall({x:p1.x+2,y:p2.y-7,z:p1.z}, {x:p2.x-2,y:p2.y-2,z:p2.z});
  this.createDesertWall({x:p1.x+2,y:p1.y+2,z:p1.z}, {x:p1.x+7,y:p2.y-2,z:p2.z});
  this.createDesertWall({x:p2.x-7,y:p1.y+2,z:p1.z}, {x:p2.x-2,y:p2.y-2,z:p2.z});

  this.createDesertExternalWall({x:p1.x  ,y:p1.y  ,z:p1.z  }, {x:p2.x  ,y:p1.y+1,z:p2.z});
  this.createDesertExternalWall({x:p1.x  ,y:p2.y-1,z:p1.z  }, {x:p2.x  ,y:p2.y  ,z:p2.z});
  this.createDesertExternalWall({x:p1.x  ,y:p1.y  ,z:p1.z  }, {x:p1.x+1,y:p2.y  ,z:p2.z});
  this.createDesertExternalWall({x:p2.x-1,y:p1.y  ,z:p1.z  }, {x:p2.x  ,y:p2.y  ,z:p2.z});

  this.createDesertInternalWall({x:p1.x+8,y:p1.y+8  ,z:p1.z  }, {x:p2.x-8,y:p1.y+9,z:p2.z});
  this.createDesertInternalWall({x:p1.x+8,y:p2.y-9  ,z:p1.z  }, {x:p2.x-8,y:p2.y-8,z:p2.z});
  this.createDesertInternalWall({x:p1.x+8,y:p1.y+8  ,z:p1.z  }, {x:p1.x+9,y:p2.y-8,z:p2.z});
  this.createDesertInternalWall({x:p2.x-9,y:p1.y+8  ,z:p1.z  }, {x:p2.x-8,y:p2.y-8,z:p2.z});

  let m = {x:p1.x+Math.floor((p2.x-p1.x)/2),y:p1.y+Math.floor((p2.y-p1.y)/2)};
  let ly1 = 8 + ((+6+(m.y-8-p1.y)) % 8);
  let ry1 = 9 + (7-((m.y+9-p1.y) % 8));
  let ly2 = 2 + ((+6+(m.y-2-p1.y)) % 8);
  let ry2 = 3 + (7-((m.y+3-p1.y) % 8));
  let lx1 = 8 + ((+6+(m.x-8-p1.x)) % 8);
  let rx1 = 9 + (7-((m.x+9-p1.x) % 8));
  let lx2 = 2 + ((+6+(m.x-2-p1.x)) % 8);
  let rx2 = 3 + (7-((m.x+3-p1.x) % 8));

  if(side.indexOf("E") >= 0){
    this.createBlock          ({x:p2.x -1,y:m.y-ly1,z:p1.z  },{x:p2.x   ,y:m.y+ry1,z:p2.z-10},"HardSand");
    this.createBlock          ({x:p2.x -9,y:m.y-ly2,z:p1.z  },{x:p2.x -8,y:m.y+ry2,z:p2.z-10},"HardSand");
    this.createDesertDoor     ({x:p2.x -5,y:m.y -8,z:p1.z  },{x:p2.x +4,y:m.y +9,z:p2.z +8},"E");
    this.createBlock          ({x:p2.x +3,y:m.y -4,z:p2.z-3},{x:p2.x +4,y:m.y -3,z:p2.z -2},"Void");
    this.createBlock          ({x:p2.x +3,y:m.y -0,z:p2.z-3},{x:p2.x +4,y:m.y +1,z:p2.z -2},"Void");
    this.createBlock          ({x:p2.x +3,y:m.y +4,z:p2.z-3},{x:p2.x +4,y:m.y +5,z:p2.z -2},"Void");
    this.createDesertDoorShape({x:p2.x -9,y:m.y -2,z:p1.z  },{x:p2.x -6,y:m.y +3,z:p2.z-10},"E","Void");
  }
  if(side.indexOf("W") >= 0){
    this.createBlock          ({x:p1.x   ,y:m.y-ly1,z:p1.z  },{x:p1.x +1,y:m.y+ry1,z:p2.z-10},"HardSand");
    this.createBlock          ({x:p1.x +8,y:m.y-ly2,z:p1.z  },{x:p1.x +9,y:m.y+ry2,z:p2.z-10},"HardSand");
    this.createDesertDoor     ({x:p1.x -4,y:m.y -8,z:p1.z  },{x:p1.x +5,y:m.y +9,z:p2.z +8},"W");
    this.createBlock          ({x:p1.x -4,y:m.y -4,z:p2.z-3},{x:p1.x -3,y:m.y -3,z:p2.z -2},"Void");
    this.createBlock          ({x:p1.x -4,y:m.y -0,z:p2.z-3},{x:p1.x -3,y:m.y +1,z:p2.z -2},"Void");
    this.createBlock          ({x:p1.x -4,y:m.y +4,z:p2.z-3},{x:p1.x -3,y:m.y +5,z:p2.z -2},"Void");
    this.createDesertDoorShape({x:p1.x +6,y:m.y -2,z:p1.z  },{x:p1.x +9,y:m.y +3,z:p2.z-10},"W","Void");
  }
  if(side.indexOf("S") >= 0){
    this.createBlock          ({x:m.x-lx1,y:p2.y -1,z:p1.z  },{x:m.x+rx1,y:p2.y   ,z:p2.z-10},"HardSand");
    this.createBlock          ({x:m.x-lx2,y:p2.y -9,z:p1.z  },{x:m.x+rx2,y:p2.y -8,z:p2.z-10},"HardSand");
    this.createDesertDoor     ({x:m.x -8,y:p2.y -5,z:p1.z  },{x:m.x +9,y:p2.y +4,z:p2.z +8},"S");
    this.createBlock          ({x:m.x -4,y:p2.y +3,z:p2.z-3},{x:m.x -3,y:p2.y +4,z:p2.z -2},"Void");
    this.createBlock          ({x:m.x -0,y:p2.y +3,z:p2.z-3},{x:m.x +1,y:p2.y +4,z:p2.z -2},"Void");
    this.createBlock          ({x:m.x +4,y:p2.y +3,z:p2.z-3},{x:m.x +5,y:p2.y +4,z:p2.z -2},"Void");
    this.createDesertDoorShape({x:m.x -2,y:p2.y -9,z:p1.z  },{x:m.x +3,y:p2.y -6,z:p2.z-10},"S","Void");
  }
  if(side.indexOf("N") >= 0){
    this.createBlock          ({x:m.x-lx1,y:p1.y   ,z:p1.z  },{x:m.x+rx1,y:p1.y +1,z:p2.z-10},"HardSand");
    this.createBlock          ({x:m.x-lx2,y:p1.y +8,z:p1.z  },{x:m.x+rx2,y:p1.y +9,z:p2.z-10},"HardSand");
    this.createDesertDoor     ({x:m.x -8,y:p1.y -4,z:p1.z  },{x:m.x +9,y:p1.y +5,z:p2.z +8},"N");
    this.createBlock          ({x:m.x -4,y:p1.y -4,z:p2.z-3},{x:m.x -3,y:p1.y -3,z:p2.z -2},"Void");
    this.createBlock          ({x:m.x -0,y:p1.y -4,z:p2.z-3},{x:m.x +1,y:p1.y -3,z:p2.z -2},"Void");
    this.createBlock          ({x:m.x +4,y:p1.y -4,z:p2.z-3},{x:m.x +5,y:p1.y -3,z:p2.z -2},"Void");
    this.createDesertDoorShape({x:m.x -2,y:p1.y +6,z:p1.z  },{x:m.x +3,y:p1.y +9,z:p2.z-10},"N","Void");
  }
};


let node = new Grid3D({x:128,y:128,z:64});
node.createDesert(5);
node.createDesertCastle({x:25,y:25,z: 6},{x:90,y:114,z:23},"E");
writeObj(node, materials, "img", "terrain", 0);

node = new Grid3D({x:128,y:128,z:64});
node.createGround(5);
node.createFortress({x:25,y:25,z: 6},{x:90,y:114,z:23},"E");
writeObj(node, materials, "img", "terrain", 1);
