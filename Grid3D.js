/* jshint node:true, undef: true, unused: true, sub:true, esversion: 6 */
"use strict";

function Grid3D(dim){
  this.dim = dim;
  this.data = [];
  for(let z=0;z<dim.z;z++){
    let ly = [];
    for(let y=0;y<dim.y;y++){
      let lx = [];
      for(let x=0;x<dim.x;x++) lx[x] = 0;
      ly.push(lx);
    }
    this.data.push(ly);
  }
}

Grid3D.prototype.set = function(p,v){
  this.data[p.z][p.y][p.x] = v;
};

Grid3D.prototype.get = function(p){
  return this.data[p.z][p.y][p.x];
};

Grid3D.prototype.inbound = function(p){
  return (p.x>=0 && p.y>=0 && p.z >=0 && p.x<this.dim.x && p.y<this.dim.y && p.z<this.dim.z);
};

Grid3D.prototype.clone = function(){
  return (new Grid3D(this.dim)).fill(this.get.bind(this));
};

Grid3D.prototype.fill = function(f){
  let dx = this.dim.x;
  let dy = this.dim.y;
  let dz = this.dim.z;
  let lz = this.data;
  for(let z=0;z<dz;z++){
    let ly = lz[z];
    for(let y=0;y<dy;y++){
      let lx = ly[y];
      for(let x=0;x<dx;x++) lx[x] = f({x,y,z},lx[x]);
    }
  }
  return this;
};

module.exports = Grid3D;
