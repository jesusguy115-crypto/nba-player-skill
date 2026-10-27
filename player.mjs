import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export const ROOT=path.dirname(fileURLToPath(import.meta.url));
export const dataset=JSON.parse(readFileSync(path.join(ROOT,'assets/data/players.json'),'utf8'));
export const aliases=JSON.parse(readFileSync(path.join(ROOT,'assets/data/aliases.json'),'utf8'));
export const labels=JSON.parse(readFileSync(path.join(ROOT,'assets/data/labels.json'),'utf8'));
export function normalize(text){return String(text).normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]/gu,'');}
const key=p=>[p.id,p.zh,p.name,...(aliases[p.id]||[])].map(normalize);
export function resolvePlayer(query){
 const q=normalize(query);if(!q)return {status:'not_found',query,candidates:[]};
 const exact=dataset.players.filter(p=>key(p).includes(q));
 const matched=exact.length?exact:(q.length>=2?dataset.players.filter(p=>key(p).some(k=>k.includes(q))):[]);
 return {status:matched.length===1?'matched':matched.length?'ambiguous':'not_found',query,candidates:matched.map(p=>({id:p.id,name:p.name,zh:p.zh,team:dataset.teams.find(t=>t.slug===p.team_slug).zh,has_report:!!p.metrics}))};
}
export function getPlayer(id){const p=dataset.players.find(p=>p.id===String(id));if(!p)return null;return {player:p,team:dataset.teams.find(t=>t.slug===p.team_slug),metadata:dataset.metadata};}
