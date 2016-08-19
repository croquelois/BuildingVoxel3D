/* jshint esversion: 6, node:true */
"use strict";
var fs = require('fs');

function pad0(n){ return ("0000"+n).slice(-4); }

module.exports = function(world,materials,dir,name,n){
  let cx;
  let cy;

  var template = {
       "up": ["--+","-++","+++","+-+"],
     "down": ["---","-+-","++-","+--"],
     "left": ["---","-+-","-++","--+"],
    "right": ["+--","++-","+++","+-+"],
    "front": ["---","+--","+-+","--+"],
     "back": ["-+-","++-","+++","-++"]
  };
  Object.keys(template).forEach(function(k){
    template[k] = template[k].map(function(s){
      var x = (s[0]=="-"?-1:1)/2;
      var y = (s[1]=="-"?-1:1)/2;
      var z = (s[2]=="-"?-1:1)/2;
      return {x,y,z};
    });
  });

  let filenameMaterials = name+'-'+pad0(n)+'-materials.mtl';
  let fdM = fs.openSync(dir+'/'+filenameMaterials,"w");
  fs.writeSync(fdM, "Wavefront OBJ material file"+"\n\n");
  Object.keys(materials).forEach(function(name){
      fs.writeSync(fdM, "newmtl "+name+"\n");
      let Kd = materials[name];
      fs.writeSync(fdM, "Kd "+[Kd.r,Kd.g,Kd.b].join(" ")+"\n");
      fs.writeSync(fdM, "Ks 0 0 0\n");
      fs.writeSync(fdM, "\n");
  });
  fs.closeSync(fdM);

  let fdV;
  let vIdx = 1;
  function openFileDescriptorVertices(){
    let filenameVertices = dir+'/'+name+'-'+pad0(n)+'-vertices.tmp';
    fdV = fs.openSync(filenameVertices,"w");
    fs.writeSync(fdV, "mtllib "+filenameMaterials+"\n");
    fs.writeSync(fdV, "o test"+"\n");
  }

  var fdF = {};
  function getFileDescriptorForFacesType(t){
    if(fdF[t] === undefined){
      let filenameFaces = dir+'/'+name+'-'+pad0(n)+'-faces-'+t+'.tmp';
      let fd = fdF[t] = fs.openSync(filenameFaces,"w");
      fs.writeSync(fd,"g "+t+"\n");
      fs.writeSync(fd,"usemtl "+t+"\n");
    }
    return fdF[t];
  }

  function closeAll(){
    fs.closeSync(fdV);
    Object.keys(fdF).forEach(function(t){ fs.closeSync(fdF[t]); });
  }

  function concat(filesIn, fileOut){
    let r = filesIn.map(function(file){ return fs.createReadStream(file); });
    let w = fs.createWriteStream(fileOut);
    let n = filesIn.length;
    function pipe(i){
      if(!r[i]){
        w.end();
        return;
      }
      r[i].pipe(w,{end: false});
      r[i].on('end',function(){
        let nIdx = i+1;
        console.log("file #"+nIdx+" on "+n+" concatened");
        if(nIdx == n) w.end();
        else pipe(nIdx);
      });
    }
    pipe(0);
  }

  function concatIn(fileOut){
    let filenameVertices = dir+'/'+name+'-'+pad0(n)+'-vertices.tmp';
    let filesIn = [filenameVertices].concat(Object.keys(fdF).map(function(t){ return dir+'/'+name+'-'+pad0(n)+'-faces-'+t+'.tmp'; }));
    concat(filesIn,fileOut);
  }

  function pushFace(p,d,t){
    var tmp = template[d];
    var face = [];
    tmp.forEach(function(m){
      let v = {x:p.x+m.x,y:p.y+m.y,z:p.z+m.z};
      fs.writeSync(fdV, "v "+[(v.x-cx)*0.01,v.z*0.01,(v.y-cy)*0.01].join(" ")+"\n");
      face.push(vIdx++);
    });
    let fd = getFileDescriptorForFacesType(t);
    fs.writeSync(fd, "f "+face.join(" ")+"\n");
  }

  function get(p){
    if(!world.inbound(p)) return "Void";
    return world.get(p);
  }

  openFileDescriptorVertices();
  console.log("Extract world:");
  cx = world.dim.x/2;
  cy = world.dim.y/2;
  let est = world.dim.x*world.dim.y*world.dim.z;
  let updateEst = ~~(est/10);
  let i = 0;
  world.fill(function(p,v){
    i++;
    if((i%updateEst)===0) console.log("progress: "+(100*i/est).toFixed(2)+"%");

    var x = p.x;
    var y = p.y;
    var z = p.z;
    if(v == "Void") return v;
    var py = (get({x, z, y:y+1}) != "Void");
    var ny = (get({x, z, y:y-1}) != "Void");
    var px = (get({x:x+1, z, y}) != "Void");
    var nx = (get({x:x-1, z, y}) != "Void");
    var pz = (get({x, z:z+1, y}) != "Void");
    var nz = (get({x, z:z-1, y}) != "Void");
    if(!py) pushFace(p,"back",v);
    if(!ny) pushFace(p,"front",v);
    if(!px) pushFace(p,"right",v);
    if(!nx) pushFace(p,"left",v);
    if(!pz) pushFace(p,"up",v);
    if(!nz) pushFace(p,"down",v);
    return v;
  });

  console.log("Close part files");
  closeAll();
  console.log("Concatenation");
  let filename = dir+'/'+name+'-'+pad0(n)+'.obj';
  concatIn(filename);
};
