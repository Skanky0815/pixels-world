import { readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { PNG } from 'pngjs';

const jobs = [
  { name: 'desk', family: 'environment', width: 280, height: 148, version: 2 },
  { name: 'chair', family: 'environment', width: 80, height: 156, anchors: [[0,113],[88,1000],[156,1663]] },
  { name: 'bookcase', family: 'environment', width: 136, height: 318, version: 2, anchors: [[0,92],[110,643],[210,1138],[304,1663],[318,1724]] },
  { name: 'bookcase-board', source: 'bookcase', family: 'environment', width: 116, height: 14, version: 2, box: { left: 132, top: 643, width: 558, height: 70 } },
  { name: 'monitor', family: 'environment', width: 110, height: 96 },
  ...[['paper-stacked',48,36],['paper-fallen',96,24],['pen-cup',28,42],['pen-cup-spilled',88,26],['poster-space',108,112],['poster-arcade',108,112]].map(([name,width,height])=>({name,width,height,family:'objects'})),
];

function alphaBounds(image) {
  let left=image.width, top=image.height, right=-1, bottom=-1;
  for(let y=0;y<image.height;y++) for(let x=0;x<image.width;x++) {
    if(image.data[(y*image.width+x)*4+3]<192) continue;
    left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
  }
  if(right<left) throw new Error('Empty study source');
  return {left,top,width:right-left+1,height:bottom-top+1};
}

function sourceY(job, box, y) {
  const target=y*2+1;
  if(!job.anchors) return box.top+Math.min(box.height-1,Math.floor(target*box.height/job.height));
  const index=job.anchors.findIndex(([end])=>end>target);
  const [start,sourceStart]=job.anchors[index-1];
  const [end,sourceEnd]=job.anchors[index];
  return Math.floor(sourceStart+(target-start)*(sourceEnd-sourceStart)/(end-start));
}

function exportAsset(job) {
  const root=new URL(`../../assets/${job.family}/study/`,import.meta.url);
  const image=PNG.sync.read(readFileSync(new URL(`sources/${job.source??job.name}-source-v${job.version??1}.png`,root)));
  const box=job.box??alphaBounds(image);
  const output=new PNG({width:job.width,height:job.height});
  for(let y=0;y<job.height/2;y++) for(let x=0;x<job.width/2;x++) {
    const sx=box.left+Math.min(box.width-1,Math.floor((x*2+1)*box.width/job.width));
    const i=(sourceY(job,box,y)*image.width+sx)*4;
    if(image.data[i+3]<192) continue;
    for(let dy=0;dy<2;dy++) for(let dx=0;dx<2;dx++) output.data.set([...image.data.subarray(i,i+3),255],((y*2+dy)*job.width+x*2+dx)*4);
  }
  writeFileSync(new URL(`study-${job.name}.png`,root),PNG.sync.write(output));
}

for(const job of jobs) exportAsset(job);
