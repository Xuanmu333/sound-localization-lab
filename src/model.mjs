export const C = 343;
export const MICS = [{id:'A',x:-4,y:2.5},{id:'B',x:4,y:2.5},{id:'C',x:4,y:-2.5},{id:'D',x:-4,y:-2.5}];
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export function observe(source) {
  const times=MICS.map(m=>distance(source,m)/C);
  return {times, deltas:times.map(t=>t-times[0])};
}
// The inverse model only receives sensor geometry and measured time differences.
export function locate(deltas) {
  let best={x:0,y:0,residual:Infinity};
  for(const sx of [-4,0,4]) for(const sy of [-2.5,0,2.5]) {
    let x=sx,y=sy;
    for(let k=0;k<50;k++) {
      const d0=Math.max(1e-8,Math.hypot(x-MICS[0].x,y-MICS[0].y));
      let a=1e-8,b=0,d=1e-8,u=0,v=0;
      for(let i=1;i<MICS.length;i++) {
        const di=Math.max(1e-8,Math.hypot(x-MICS[i].x,y-MICS[i].y));
        const r=di-d0-C*deltas[i];
        const jx=(x-MICS[i].x)/di-(x-MICS[0].x)/d0;
        const jy=(y-MICS[i].y)/di-(y-MICS[0].y)/d0;
        a+=jx*jx; b+=jx*jy; d+=jy*jy; u+=jx*r; v+=jy*r;
      }
      const determinant=a*d-b*b;
      if(determinant<1e-14) break;
      let dx=(d*u-b*v)/determinant,dy=(a*v-b*u)/determinant;
      const norm=Math.hypot(dx,dy); if(norm>2){dx*=2/norm;dy*=2/norm;}
      x-=dx;y-=dy;
      if(Math.hypot(dx,dy)<1e-10)break;
    }
    const p={x,y};
    const residual=MICS.slice(1).reduce((sum,m,i)=>sum+(distance(p,m)-distance(p,MICS[0])-C*deltas[i+1])**2,0);
    if(Number.isFinite(residual)&&residual<best.residual) best={x,y,residual};
  }
  return best;
}
// Marching squares: each contour is |p-mi| - |p-mA| = c ΔtiA.
export function contour(index,delta) {
  const segments=[],step=.14;
  const f=(x,y)=>distance({x,y},MICS[index])-distance({x,y},MICS[0])-C*delta;
  for(let x=-5.5;x<5.5;x+=step)for(let y=-3.65;y<3.65;y+=step){
    const p=[[x,y],[x+step,y],[x+step,y+step],[x,y+step]],v=p.map(q=>f(...q)),hits=[];
    for(let i=0;i<4;i++) {const j=(i+1)%4;if((v[i]<0)!==(v[j]<0)){const t=v[i]/(v[i]-v[j]);hits.push([p[i][0]+t*(p[j][0]-p[i][0]),p[i][1]+t*(p[j][1]-p[i][1])]);}}
    if(hits.length===2)segments.push(...hits);
    else if(hits.length===4)segments.push(hits[0],hits[1],hits[2],hits[3]);
  }
  return segments;
}
