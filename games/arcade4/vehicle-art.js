// Shared Lot Escape vehicle artwork. Consumers keep their own size and rules.
const atlas=new Image(), tiles=[];
let ready=false;
atlas.onload=()=>{
  try{
    const sheet=document.createElement('canvas');sheet.width=atlas.naturalWidth;sheet.height=atlas.naturalHeight;
    const ctx=sheet.getContext('2d');ctx.drawImage(atlas,0,0);const pixels=ctx.getImageData(0,0,sheet.width,sheet.height).data;
    for(let n=0;n<6;n++){
      const left=Math.floor(n%3*sheet.width/3),right=Math.floor((n%3+1)*sheet.width/3),top=Math.floor(Math.floor(n/3)*sheet.height/2),bottom=Math.floor((Math.floor(n/3)+1)*sheet.height/2);
      let x0=right,y0=bottom,x1=left,y1=top;
      for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(pixels[(y*sheet.width+x)*4+3]>65){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
      if(x1<=x0||y1<=y0)return;
      const cv=document.createElement('canvas');cv.width=192;cv.height=384;
      cv.getContext('2d').drawImage(atlas,x0,y0,x1-x0+1,y1-y0+1,0,0,192,384);tiles.push(cv);
    }
    ready=true;
  }catch(e){ready=false;}
};
atlas.src='../arcade4/vehicles-lot-v2.png';
export function vehicleTile(index){return ready?tiles[index%6]:null;}
export function drawVehicle(c,index,w,h){const tile=vehicleTile(index);if(!tile)return false;c.drawImage(tile,-w/2,-h/2,w,h);return true;}
