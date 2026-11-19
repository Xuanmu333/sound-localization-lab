import test from 'node:test';
import assert from 'node:assert/strict';
import {C,MICS,observe,locate,distance,contour} from '../src/model.mjs';

test('recovers 493 positions across the supported area using only arrival differences',()=>{
  let count=0;
  for(let x=-3.5;x<=3.5;x+=.25)for(let y=-2;y<=2;y+=.25){
    const actual={x,y};
    const predicted=locate(observe(actual).deltas);
    assert(distance(actual,predicted)<1e-6,`Position (${x}, ${y})`);
    count++;
  }
  assert.equal(count,493);
});

test('equal arrival times locate the center of the rectangular array',()=>{
  assert(distance(locate([0,0,0,0]),{x:0,y:0})<1e-6);
});

test('an unknown emission time does not change the inferred position',()=>{
  const actual={x:-2.3,y:1.7};
  const shifted=observe(actual).times.map(t=>t+123.456);
  const deltas=shifted.map(t=>t-shifted[0]);
  assert(distance(locate(deltas),actual)<1e-6);
});

test('rendered contour vertices satisfy their measured distance differences',()=>{
  const {deltas}=observe({x:1.4,y:.8});
  for(let i=1;i<MICS.length;i++){
    const vertices=contour(i,deltas[i]);
    assert(vertices.length>0);
    for(const [x,y] of vertices){
      const p={x,y};
      const residual=distance(p,MICS[i])-distance(p,MICS[0])-C*deltas[i];
      assert(Math.abs(residual)<.01);
    }
  }
});
