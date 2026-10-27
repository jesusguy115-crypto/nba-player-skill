import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset,labels,resolvePlayer} from './player.mjs';
test('Chinese English nickname resolve to same Curry',()=>{
 const ids=['库里','萌神','Stephen Curry','STEPHEN CURRY'].map(q=>{const r=resolvePlayer(q);assert.equal(r.status,'matched');return r.candidates[0].id;});assert.equal(new Set(ids).size,1);
});
test('ambiguous surname and unknown names are not guessed',()=>{assert.equal(resolvePlayer('Williams').status,'ambiguous');assert.equal(resolvePlayer('不存在的球员xyz').status,'not_found');});
test('snapshot includes complete canonical groups and explicit missing reports',()=>{assert.equal(labels.length,16);assert.equal(labels.filter(x=>x[0]==='进攻').length,7);assert.equal(labels.filter(x=>x[0]==='防守').length,7);assert.equal(labels.filter(x=>x[0]==='篮板').length,2);assert.equal(dataset.players.length,622);assert.equal(dataset.players.filter(p=>p.metrics).length,481);assert.ok(dataset.players.every(p=>p.zh));});
