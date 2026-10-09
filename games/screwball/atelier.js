/* Furnished houses: every visible component is a separately screwed, removable part. */
(function(){'use strict';
function house(R,d){
 var p=[],oak='#b78b57',dark='#644730',brass='#bc914b',cream='#eee3c9',wall=R.pick(['#82b6e4','#e2b5ca','#b1a7e2']),cloth=R.pick(['#426db9','#b9467b','#9160b9']);
 function part(shape,pos,size,color,name,mat,s,rot){p.push({shape:shape,pos:pos,size:size,color:color,name:name,mat:mat||'paint',s:s||['y+1'],rot:rot||[0,0,0],opt:0});}
 function box(x,y,z,w,h,l,c,n,m,s,r){part('box',[x,y,z],[w,h,l],c,n,m,s,r);}
 function round(x,y,z,w,h,l,c,n,m,s){part('rbox',[x,y,z],[w,h,l],c,n,m,s);}
 function cyl(x,y,z,r,h,c,n,m,s,rot){part('cyl',[x,y,z],[r,h],c,n,m,s,rot);}
 // Split parquet floor and removable front panels reveal rooms rather than a hollow shell.
 for(var i=0;i<4;i++)box(-3+i*2,.13,0,1.96,.26,6,oak,'Parquet floor section '+(i+1),'wood',['y+2']);
 box(0,1.85,-3,8,3.45,.18,wall,'Back wall','paint',['z-2']);
 box(-4,1.85,0,.18,3.45,6,wall,'Left wall','paint',['x-2']);
 box(4,1.85,0,.18,3.45,6,wall,'Right wall','paint',['x+2']);
 for(i=0;i<2;i++){
 var x=i?-2.5:2.5;
 box(x,.78,3,2.9,1.05,.18,wall,'Front lower wall '+(i+1),'paint',['z+2']);
 box(x,3.2,3,2.9,.7,.18,wall,'Window lintel '+(i+1),'paint',['z+1']);
 box(x-1.3,2.03,3,.25,1.42,.2,cream,'Window jamb '+(i+1),'wood',['z+1']);
 box(x+1.3,2.03,3,.25,1.42,.2,cream,'Window jamb '+(i+3),'wood',['z+1']);
 box(x,2.02,3.04,2.28,1.4,.045,'#afd9df','Window glass '+(i+1),'glass',['z+2']);
 box(x,2.02,3.12,.12,1.45,.09,cream,'Window mullion '+(i+1),'wood',['z+1']);
 box(x,1.28,3.18,2.8,.13,.38,cream,'Window sill '+(i+1),'wood',['z+1']);
 }
 box(0,3.2,3,2,.7,.18,wall,'Entrance lintel','paint',['z+1']);
 round(0,1.55,3.13,1.8,2.55,.16,'#375e60','Front door','wood',['z+2']);
 cyl(.65,1.55,3.26,.095,.12,brass,'Door handle','metal',['y+1'],[Math.PI/2,0,0]);
 // Roof panels, ridge and chimney: real exterior pieces that must come off.
 box(0,4.15,1.6,8.7,.2,3.75,'#556575','Front roof','roof',['y+2'],[.36,0,0]);
 box(0,4.15,-1.6,8.7,.2,3.75,'#556575','Back roof','roof',['y+2'],[-.36,0,0]);
 box(0,4.88,0,8.8,.18,.25,dark,'Roof ridge','wood',['y+2']);
 part('wedge',[-4,4.08,0],[6,1.15,.18],cream,'Left gable','paint',['z-1'],[0,Math.PI/2,0]);
 part('wedge',[4,4.08,0],[6,1.15,.18],cream,'Right gable','paint',['z+1'],[0,Math.PI/2,0]);
 box(-2.8,4.4,-1.3,.62,2,.62,'#a7644c','Brick chimney','brick',['x-1','z-1']);
 box(-2.8,5.47,-1.3,.8,.13,.8,dark,'Chimney cap','metal',['y+1']);
 // Loft with independent stair treads and railing, on the back right side.
 box(2.4,2.63,-1.9,2.9,.18,1.85,oak,'Loft platform','wood',['y+2']);
 for(i=0;i<7;i++)box(3.03,.43+i*.31,1.45-i*.44,1.35,.16,.47,oak,'Stair tread '+(i+1),'wood',['y+1']);
 for(i=0;i<4;i++)cyl(2.3,.87+i*.52,1.35-i*.74,.055,.8,brass,'Stair baluster '+(i+1),'metal',['a0']);
 box(2.3,2.06,.12,.1,.12,3.15,dark,'Stair handrail','wood',['y+2'],[.61,0,0]);
 box(2.3,3.18,-1.06,2.7,.09,.08,brass,'Loft rail','metal',['z+2']);
 // Sofa, separate cushions and arms.
 round(-2.35,.55,.7,2.8,.43,1.05,dark,'Sofa base','wood',['z+2']);
 round(-2.35,1.14,.23,2.8,.95,.26,cloth,'Sofa back','fabric',['z+2']);
 for(i=0;i<2;i++)round(-3.02+i*1.35,.85,.82,1.25,.24,.85,cloth,'Sofa seat cushion '+(i+1),'fabric',['y+1']);
 round(-3.77,1.02,.72,.21,.62,1.13,cloth,'Sofa left arm','fabric',['x-1']);
 round(-.93,1.02,.72,.21,.62,1.13,cloth,'Sofa right arm','fabric',['x+1']);
 round(-3.16,1.26,.5,.53,.48,.19,'#dbc489','Sofa throw pillow','fabric',['z+1']);
 round(-2.25,.28,1.4,3.5,.045,2.35,'#976758','Woven rug','fabric',['y+2']);
 // Coffee table and a removable book.
 round(-2.28,.86,1.86,1.8,.13,.8,oak,'Coffee tabletop','wood',['y+2']);
 for(i=0;i<2;i++)box(-2.91+i*1.25,.54,1.86,.14,.52,.67,dark,'Coffee table leg '+(i+1),'wood',['z+1']);
 box(-2.6,.99,1.82,.64,.13,.44,'#3e6679','Coffee table book','fabric',['y+1']);
 // Lamp: base, stem and shade can all be unscrewed.
 cyl(-3.48,.35,-.7,.3,.16,brass,'Floor lamp base','metal',['y+1']);
 cyl(-3.48,1.22,-.7,.065,1.6,brass,'Floor lamp stem','metal',['a0']);
 part('cone',[-3.48,2.19,-.7],[.43,.25,.53],'#f8dcaa','Floor lamp shade','glow',['a0']);
 // Art and wall clock, facing into the room.
 box(-2.5,2.52,-2.86,1.8,1.2,.12,brass,'Landscape frame','metal',['z+2']);
 box(-2.5,2.52,-2.76,1.55,.97,.045,'#88aeb1','Landscape painting','art',['z+1']);
 cyl(-.55,2.56,-2.82,.38,.13,cream,'Wall clock','clock',['y+1'],[Math.PI/2,0,0]);
 // Bookcase: shelves, sides and individually removable books.
 box(.48,1.25,-2.65,1.35,1.95,.13,dark,'Bookcase back','wood',['z+2']);
 for(i=0;i<3;i++)box(.48,.39+i*.75,-2.35,1.45,.12,.63,oak,'Bookcase shelf '+(i+1),'wood',['y+1']);
 for(i=0;i<2;i++)box(-.25+i*1.46,1.15,-2.35,.12,1.75,.63,oak,'Bookcase upright '+(i+1),'wood',['z+1']);
 for(i=0;i<5;i++)box(.0+i*.22,.74,-2.28,.17,.55,.4,['#a45349','#527a9c','#c3a159','#6b8d68','#845f88'][i],'Book '+(i+1),'fabric',['z+1']);
 // Kitchen: worktop, two cabinet doors, faucet and kettle.
 box(-2.72,.82,-2.16,1.8,1.08,.93,cream,'Kitchen cabinet','wood',['z+2']);
 box(-2.72,1.41,-2.16,1.98,.12,1.05,'#d9d4c7','Kitchen countertop','stone',['y+2']);
 for(i=0;i<2;i++)box(-3.19+i*.9,.87,-1.65,.82,.9,.09,'#627fb0','Kitchen door '+(i+1),'wood',['z+1']);
 cyl(-2.45,1.74,-2.42,.055,.51,brass,'Kitchen faucet','metal',['a0']);
 part('ball',[-3.15,1.68,-2.1],[.23,.23,.23],'#d4b878','Kettle','metal',['d0,1,0']);
 // Loft bed, mattress, pillow and bedside lamp.
 box(2.4,2.88,-2.0,2.1,.23,1.33,dark,'Loft bed frame','wood',['y+2']);
 round(2.4,3.08,-2.0,2,.17,1.25,'#d7c3a4','Loft mattress','fabric',['y+2']);
 round(1.72,3.25,-2.0,.5,.16,.96,cream,'Loft pillow','fabric',['y+1']);
 box(2.68,3.2,-2,1.4,.06,1.3,cloth,'Loft quilt','fabric',['y+1']);
 // Porch steps and brass light fixture.
 for(i=0;i<3;i++)box(0,.22-i*.06,3.5+i*.36,2.15,.32-i*.08,.38,oak,'Porch step '+(i+1),'wood',['y+1']);
 box(1.04,2.38,3.23,.22,.52,.25,brass,'Porch lantern bracket','metal',['z+1']);
 round(1.04,2.4,3.42,.36,.48,.25,'#ffdf99','Porch lantern','glow',['z+1']);
 return {name:'The furnished loft',parts:p};
}
SBObjects.OBJECTS.furnished={name:'The furnished loft',make:house};
})();
