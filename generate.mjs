#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,dataset,labels,resolvePlayer,getPlayer} from './player.mjs';
import {createPlayerCardPNG} from './card-layout.mjs';
function output(v){process.stdout.write(JSON.stringify(v,null,2)+'\n');}
const args=process.argv.slice(2),opts={};
for(let i=0;i<args.length;i++){
 const a=args[i];if(a==='--help'){output({usage:'node generate.mjs --player 库里 --output /absolute/path/card.png',options:['--player NAME','--player-id ID','--lookup','--output FILE','--canvas-module PATH','--overwrite']});process.exit(0);}
 if(['--lookup','--overwrite'].includes(a)){opts[a]=true;continue;}
 if(!['--player','--player-id','--output','--canvas-module'].includes(a)||!args[i+1]){output({status:'error',message:'Unknown or incomplete option: '+a});process.exit(1);}
 opts[a]=args[++i];
}
const query=opts['--player']||opts['--player-id'];
if(!query){output({status:'error',message:'Provide --player NAME or --player-id ID.'});process.exit(1);}
const resolution=opts['--player-id']?(()=>{const match=getPlayer(opts['--player-id']);return match?{status:'matched',candidates:[{id:match.player.id,name:match.player.name,zh:match.player.zh}]}:{status:'not_found',candidates:[]};})():resolvePlayer(query);
if(resolution.status!=='matched'||opts['--lookup']){output({...resolution,snapshot:dataset.metadata.checked_at});process.exit(resolution.status==='matched'?0:2);}
const info=getPlayer(resolution.candidates[0].id),{player:p,team:t,metadata}=info;
const fonts=path.join(ROOT,'assets/fonts');
if(!['chinese.ttf','display.ttf'].every(n=>fs.existsSync(path.join(fonts,n)))){output({status:'assets_missing',message:'Run python3 bootstrap.py first.'});process.exit(3);}
let api;
try{const m=await import(opts['--canvas-module']?pathToFileURL(path.resolve(opts['--canvas-module'])).href:'@napi-rs/canvas');api=m.default||m;}
catch{output({status:'dependency_missing',message:'Run npm install --omit=dev in the skill directory, or use --canvas-module for an existing @napi-rs/canvas installation.'});process.exit(3);}
api.GlobalFonts.registerFromPath(path.join(fonts,'chinese.ttf'),'Chinese');
api.GlobalFonts.registerFromPath(path.join(fonts,'display.ttf'),'Display');
let file=path.resolve(opts['--output']||path.join(process.cwd(),'outputs',p.zh+'-球员技能卡.png'));
if(fs.existsSync(file)&&!opts['--overwrite']){const ext=path.extname(file),base=file.slice(0,-ext.length);let n=2;while(fs.existsSync(base+'-'+n+ext))n++;file=base+'-'+n+ext;}
const actualPhoto=path.join(ROOT,p.photo||'missing');const renderPlayer={...p,photo:actualPhoto};
if(!fs.existsSync(actualPhoto))renderPlayer.photo_state='official_unavailable';
try{
 const buffer=await createPlayerCardPNG({player:renderPlayer,team:t,labels,canvasAPI:api});
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,buffer);
 const rows=labels.map(m=>p.metrics?.find(row=>row[1]===m[1]));
 output({status:p.metrics?'complete':'profile_only',image:file,width:1200,height:2190,player:{id:p.id,zh:p.zh,name:p.name,team:t.zh},metric_season:metadata.metric_season,roster_season:metadata.roster_season,checked_at:metadata.checked_at,metrics:16,groups:{offense:7,defense:7,rebounding:2},missing_values:rows.filter(row=>!row||row[3]==null).length,portrait:renderPlayer.photo_state==='official_unavailable'?'unavailable':'included',note:p.metrics?'Fixed snapshot; not live data.':'Source does not contain a report for this player; metrics are shown as —.'});
}catch(e){output({status:'error',message:e.message});process.exit(1);}
