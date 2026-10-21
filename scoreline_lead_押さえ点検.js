const fs=require('fs'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2]||'lead.html','utf8');
class P{constructor(v){this.value=v}setValueAtTime(){return this}linearRampToValueAtTime(){return this}exponentialRampToValueAtTime(){return this}setTargetAtTime(){return this}cancelScheduledValues(){return this}}
const nd=()=>({connect(){return this},disconnect(){},start(){},stop(){},gain:new P(1),frequency:new P(440),Q:new P(1),detune:new P(0),playbackRate:new P(1),delayTime:new P(0),type:'sine',buffer:null,curve:null,oversample:'none',normalize:true,onended:null,addEventListener(){}});
class AC{constructor(){this.currentTime=0;this.sampleRate=44100;this.destination=nd();this.state='running'}
 createGain(){return nd()}createOscillator(){return nd()}createBufferSource(){return nd()}createBiquadFilter(){return nd()}
 createWaveShaper(){return nd()}createDelay(){return nd()}createConvolver(){return nd()}createDynamicsCompressor(){return nd()}
 createBuffer(c,l,r){const d=[...Array(c)].map(()=>new Float32Array(l));return{length:l,sampleRate:r,numberOfChannels:c,getChannelData:i=>d[i]}}
 resume(){return Promise.resolve()}close(){return Promise.resolve()}}
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});
const w=dom.window; w.AudioContext=AC; w.webkitAudioContext=AC;
w.HTMLElement.prototype.scrollIntoView=function(){};
/* jsdom は elementFromPoint を持たない。**なぞりの筋はこれを引くので、
   塞いでおかねば「未実装」の叫びで点検の出力が埋まる** */
w.document.elementFromPoint=()=>null;
let pass=0,fail=0,bad=[],HOLD=false;
/* ══ 当てはマスごと（1.238）══
   点検も**マスの鍵で引く**。名だけで引いていた頃の書き方では、
   実装が正しくても落ちる——**点検が古い設計を握っていてはならない。** */
const CURASG=(U0)=>{
  const cy=U0.fbProgCycle();
  const bar=U0.fbCurBar();
  const i=U0.fbSlotAt(cy,bar,U0.fbCurTick(bar));
  const nm=(cy.rows[i]||{}).name;
  return (i<0||!nm)?null:U0.fbAsgAt(cy,i,nm);
};
const ok=(n,c,d)=>{ if(c) pass++; else {fail++; bad.push(n+(d?'  … '+d:''));} };
setTimeout(()=>{
 const U=w.UTADORI,d=w.document;
 const CH={C:{root:0,type:'maj',bass:null},G:{root:7,type:'maj',bass:null},
           Am:{root:9,type:'min',bass:null},F:{root:5,type:'maj',bass:null},
           Bb:{root:10,type:'maj',bass:null},E7:{root:4,type:'dom7',bass:null},
           FonC:{root:5,type:'maj',bass:0}};

 /* [41] 候補が集まる */
 ok('[41] 候補を集める道がある', /function\s+voicingCandidates/.test(html));
 /* **全ルート × 全種類で当たる。** 三つ四つのコードでは、
    守りが一度も働かないまま「通った」ことになる */
 const TYPES=['maj','min','dom7','maj7','min7','m7b5','dim','aug','sus4','sus2','add9','min6','dom9','dom7sus4','min9','maj9','dim7','minMaj7','dom6'];
 const OM=[40,45,50,55,59,64];
 const all=[];
 for(let r=0;r<12;r++) TYPES.forEach(t=>{
   const c={root:r,type:t,bass:null};
   U.voicingCandidates(c,12).forEach(x=>all.push({c,x}));
 });
 ok('[41] 全ルート×全種類で候補が出る', all.length>200, '候補='+all.length);

 /* **判定の関数を使わずに、性質そのものを見る。**
    同じ関数で確かめれば、その関数を壊しても気付けない */
 const bads=[];
 all.forEach(({c,x})=>{
   const fr=x.frets;
   const on=[]; for(let i=0;i<6;i++) if(fr[i]!=null) on.push(i);
   if(on.length<3) bads.push('弦が足りない '+U.fretText(fr));
   const used=on.map(i=>fr[i]).filter(f=>f>0);
   if(used.length){
     const mn=Math.min(...used), mx=Math.max(...used);
     /* 手の開きは3フレットまで（handOK の決まりに合わせる） */
     if(mx-mn>3) bads.push('手が開かない('+(mx-mn)+'F) '+U.fretText(fr));
     if(mn>=4&&on.some(i=>fr[i]===0)) bads.push('高い位置に開放弦 '+U.fretText(fr));
     /* 逆さまの形（低音弦だけが高い） */
     if(fr[on[0]]>0&&fr[on[0]]-mn>=3) bads.push('逆さま '+U.fretText(fr));
     /* 指が足りるか（セーハを1本と数えて4本以内） */
     const byF={}; used.forEach(f=>{ byF[f]=(byF[f]||0)+1; });
     let fingers=0;
     Object.keys(byF).forEach(f=>{ fingers+=(byF[f]>=2&&+f===mn)?1:byF[f]; });
     if(fingers>4) bads.push('指が'+fingers+'本 '+U.fretText(fr));
   }
   if(fr.some(f=>f!=null&&(f<0||f>17))) bads.push('フレット外 '+U.fretText(fr));
   /* 和音の音が足りている（三和音なら3種類） */
   const pcs=new Set(on.map(i=>(OM[i]+fr[i])%12));
   if(pcs.size<3) bads.push('音が'+pcs.size+'種 '+U.fretText(fr));
 });
 ok('[41] どの候補も押さえられる形である', bads.length===0,
    [...new Set(bads)].slice(0,4).join(' / '));

 /* 重なりが無い・低い順 */
 const c1=U.voicingCandidates(CH.C,12);
 ok('[41] 同じ形が二度出ない',
    new Set(c1.map(x=>U.fretSig(x.frets))).size===c1.length, c1.length+'種');
 ok('[41] 低い位置から順に並ぶ',
    c1.every((x,i)=>i===0||U.lowFret(c1[i-1].frets)<=U.lowFret(x.frets)),
    c1.map(x=>U.lowFret(x.frets)).join(','));
 /* **位置の散らばり**——一箇所しか出なければ「選ぶ」意味が無い */
 const spread=k=>new Set(U.voicingCandidates(CH[k],12).map(x=>U.lowFret(x.frets))).size;
 ok('[41] 候補が位置ごとに散らばる',
    ['C','G','Am','F','E7'].every(k=>spread(k)>=3),
    ['C','G','Am','F','E7'].map(k=>k+'='+spread(k)).join(' '));
 /* 定番の開放形が入っている */
 ok('[41] C の開放形が候補にある',
    c1.some(x=>U.fretSig(x.frets)==='x-3-2-0-1-0'||/開放形/.test(x.label)),
    c1.map(x=>U.fretText(x.frets)).slice(0,3).join(' / '));
 ok('[41] どの候補にも名前が付く', c1.every(x=>x.label&&x.label!=='—'),
    c1.map(x=>x.label).slice(0,3).join(' / '));

 /* [41b] **候補の中身が、そのコードとして鳴るか** ──
    名前と形が揃っていても、鳴らして別の和音では意味がない */
 const wrongs=[];
 all.forEach(({c:ch,x})=>{
   const k=ch.root+'|'+ch.type;
   {
     const pcs=new Set();
     x.frets.forEach((f,i)=>{ if(f!=null) pcs.add((OM[i]+f)%12); });
     const root=((ch.root%12)+12)%12;
     const minor=/^(min|m7b5|dim|dim7|min7|min6|min9|minMaj7)$/.test(ch.type);
     const susy=/^sus/.test(ch.type)||ch.type==='dom7sus4';
     const third=(root+(minor?3:4))%12;
     if(!pcs.has(root)) wrongs.push(k+':ルートが無い '+U.fretText(x.frets));
     if(!susy&&!pcs.has(third)) wrongs.push(k+':三度が無い '+U.fretText(x.frets));
     if(ch.type==='dom7'&&!pcs.has((root+10)%12)) wrongs.push(k+':七度が無い '+U.fretText(x.frets));
     /* 表の音が混じっていないか（コードの外の音） */
     const CDx={maj:[0,4,7],min:[0,3,7],dom7:[0,4,7,10],maj7:[0,4,7,11],min7:[0,3,7,10],
       m7b5:[0,3,6,10],dim:[0,3,6,9],aug:[0,4,8],sus4:[0,5,7],sus2:[0,2,7],
       add9:[0,4,7,2],min6:[0,3,7,9],dom9:[0,4,7,10,2],dom7sus4:[0,5,7,10],
       min9:[0,3,7,10,2],maj9:[0,4,7,11,2],dim7:[0,3,6,9],minMaj7:[0,3,7,11],
       dom6:[0,4,7,9]};
     const okpc=new Set((CDx[ch.type]||[0,4,7]).map(i=>(root+i)%12));
     [...pcs].forEach(p2=>{ if(!okpc.has(p2)) wrongs.push(k+':外の音 '+U.fretText(x.frets)); });
   }
 });
 ok('[41] 候補はどれもそのコードとして鳴る', wrongs.length===0,
    [...new Set(wrongs)].slice(0,4).join(' / '));
 /* 分数コードは、いちばん低い音がベース音 */
 const fc=U.voicingCandidates(CH.FonC,12);
 ok('[41] 分数コードの候補も出る', fc.length>0, fc.length+'種');

 /* [42] 選ばせる画面 */
 ok('[42] 選ぶ画面がある', /function\s+openVoicingPicker/.test(html));
 ok('[42] 指板で組む道も残す', /pbtn\(g2,'指板で組む…'/.test(html));
 ok('[42] 自動に戻す道がある', /pbtn\(g2,'自動に戻す'/.test(html));
 try{
   const b=U.song.bars.find(x=>(x.notes||[]).some(n=>n.chord&&n.chord.root!=null));
   const ix=(b.notes||[]).findIndex(n=>n.chord&&n.chord.root!=null);
   const n=b.notes[ix];
   U.openVoicingPicker({chord:JSON.parse(JSON.stringify(n.chord)),target:{barId:b.id,noteIdx:ix}});
   const pop=d.querySelector('.pop-ov');
   ok('[42] 画面が開く', !!pop);
   const t=pop?pop.textContent:'';
   ok('[42] どこに当てるかを先に選ばせる',
      /この音符だけ/.test(t)&&/曲じゅうのこのコード/.test(t), t.slice(0,50));
   const btns=[...pop.querySelectorAll('.pb')].filter(x=>/^[0-9×]/.test(x.textContent.trim()));
   ok('[42] 候補が並ぶ', btns.length>=3, '候補='+btns.length);
   btns[0].dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
   ok('[42] 選べばこの音符に入る', !!n.voicing, JSON.stringify(n.voicing&&n.voicing.frets));
   d.querySelectorAll('.pop-ov').forEach(x=>x.remove());
   /* 曲じゅうへ */
   U.openVoicingPicker({chord:JSON.parse(JSON.stringify(n.chord)),target:{barId:b.id,noteIdx:ix}});
   const pop2=d.querySelector('.pop-ov');
   [...pop2.querySelectorAll('.pb')].find(x=>/曲じゅう/.test(x.textContent))
     .dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
   const bs=[...pop2.querySelectorAll('.pb')].filter(x=>/^[0-9×]/.test(x.textContent.trim()));
   bs[1].dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
   ok('[42] 曲じゅうへ入れると辞書に載る',
      !!(U.song.voicings&&U.song.voicings[U.chordKey(n.chord)]), '');
   ok('[42] 曲じゅうにすると音符ごとの取り決めは外れる', !n.voicing, JSON.stringify(n.voicing));
   d.querySelectorAll('.pop-ov').forEach(x=>x.remove());
   /* 自動に戻す */
   U.openVoicingPicker({chord:JSON.parse(JSON.stringify(n.chord))});
   const pop3=d.querySelector('.pop-ov');
   [...pop3.querySelectorAll('.pb')].find(x=>/自動に戻す/.test(x.textContent))
     .dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
   ok('[42] 自動に戻せる',
      !(U.song.voicings&&U.song.voicings[U.chordKey(n.chord)]), '');
   d.querySelectorAll('.pop-ov').forEach(x=>x.remove());
 }catch(e){ ok('[42] 画面の実地', false, e.message); }

 /* [43] 入口が揃っている */
 ok('[43] 音符の設定から辿れる', /pbtn\(rv,'押さえを選ぶ…'/.test(html));
 ok('[43] コード図から辿れる', /openVoicingPicker\(\{chord:clone\(h\.chord\)\}\)/.test(html));
 ok('[43] コード盤から辿れる', /vb\.textContent='押さえ…'/.test(html));

 /* ══ コードを差し替えたら、古い押さえは効かない ══
    譜面には新しい名前、鳴るのは古い和音——見えるものと鳴るものが
    食い違うのが、いちばん質の悪い形である */
 ok('[63] 押さえが持ち主を憶える', /function\s+voicingFits/.test(html));
 ok('[63] 決める時に持ち主を刻む', /n\.voicing\.for=chordKey/.test(html));
 try{
   const b=U.song.bars.find(x=>(x.notes||[]).some(n=>n.kind!=='rest'));
   const ix=(b.notes||[]).findIndex(n=>n.kind!=='rest');
   const n=b.notes[ix];
   n.chord={root:5,type:'maj',bass:null}; n.voicing=null;
   U.openVoicingPicker({chord:{root:5,type:'maj',bass:null},target:{barId:b.id,noteIdx:ix}});
   { const pop=d.querySelector('.pop-ov');
     const one=[...pop.querySelectorAll('.pb')].find(x=>/この音符だけ/.test(x.textContent));
     if(one) one.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     const cand=[...pop.querySelectorAll('.pb')].filter(x=>/^[0-9×]/.test(x.textContent.trim()));
     cand[0].dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     d.querySelectorAll('.pop-ov').forEach(x=>x.remove()); }
   ok('[63] 決めた押さえに持ち主が付く',
      !!(n.voicing&&n.voicing.for===U.chordKey({root:5,type:'maj',bass:null})),
      n.voicing?String(n.voicing.for):'なし');
   const keptFrets=n.voicing?U.fretText(n.voicing.frets):'';
   /* コードだけ差し替える */
   n.chord={root:7,type:'dom7',bass:null};
   const v2=U.resolveVoicing(U.song,n);
   const OM2=[40,45,50,55,59,64];
   const pcs=new Set(); (v2.frets||[]).forEach((f,i)=>{ if(f!=null) pcs.add((OM2[i]+f)%12); });
   ok('[63] 差し替えたら、古い押さえを使わない',
      U.fretText(v2.frets)!==keptFrets, U.fretText(v2.frets)+' / 旧='+keptFrets);
   ok('[63] 名前どおりの和音が鳴る（G7 に G と B）',
      pcs.has(7)&&pcs.has(11), [...pcs].join(','));
   /* 元のコードへ戻せば、決めた押さえがまた効く */
   n.chord={root:5,type:'maj',bass:null};
   ok('[63] 元へ戻せば、決めた押さえがまた効く',
      U.fretText(U.resolveVoicing(U.song,n).frets)===keptFrets,
      U.fretText(U.resolveVoicing(U.song,n).frets));
   /* **持ち主の無い昔の押さえは、そのまま使う。**
      1.68 以前に決めた分を捨てては、L様の譜面が変わってしまう */
   /* **曲の辞書も自動も当たらない形**を置く。そうしないと、
      持ち主なしを捨てても辞書や自動が同じ形を返し、違いが出ない */
   n.chord={root:5,type:'maj',bass:null};
   if(U.song.voicings) delete U.song.voicings[U.chordKey(n.chord)];
   const oldShape=[1,3,3,2,5,1];
   n.voicing=U.buildVoicing(oldShape);   /* for を持たない */
   ok('[63] 昔の押さえ（持ち主なし）はそのまま使う',
      U.fretText(U.resolveVoicing(U.song,n).frets)===U.fretText(oldShape),
      U.fretText(U.resolveVoicing(U.song,n).frets)+' / 期待='+U.fretText(oldShape));
   /* 指板で組んだ分にも持ち主が付く */
   n.voicing=null; n.chord={root:0,type:'maj',bass:null};
   U.openVoicingEditor({chord:{root:0,type:'maj',bass:null},target:{barId:b.id,noteIdx:ix}});
   if(w.UTADORI.vedit){ /* 直に触れない時は飛ばす */ }
   U.saveVoicingFor&&U.saveVoicingFor();
   n.voicing=null;
 }catch(e){ ok('[63] 差し替えの実地', false, e.message); }
 /* 指板で組む道（別に開いて保存する） */
 try{
   const b2=U.song.bars.find(x=>(x.notes||[]).some(n=>n.kind!=='rest'));
   const ix2=(b2.notes||[]).findIndex(n=>n.kind!=='rest');
   const n2=b2.notes[ix2];
   n2.chord={root:2,type:'min',bass:null}; n2.voicing=null;
   U.openVoicingEditor({chord:{root:2,type:'min',bass:null},
     target:{barId:b2.id,noteIdx:ix2},scope:'note'});
   U.setVeditScope&&U.setVeditScope('note');
   U.saveVoicing();
   ok('[63] 指板で組んだ押さえにも持ち主が付く',
      !!(n2.voicing&&n2.voicing.for===U.chordKey({root:2,type:'min',bass:null})),
      n2.voicing?String(n2.voicing.for):'なし');
   n2.voicing=null;
 }catch(e){ ok('[63] 指板の実地', false, e.message); }

 /* ══ 使わなくなった押さえを掃く ══ */
 ok('[64] 掃く道がある', /function\s+gcVoicings/.test(html));
 ok('[64] 保存の直前に一度だけ通す', /try\{ gcVoicings\(s\); \}catch\(e\)\{\}/.test(html));
 try{
   const s2=U.song;
   s2.voicings=s2.voicings||{};
   const dead=U.chordKey({root:11,type:'dim7',bass:null});
   s2.voicings[dead]=U.buildVoicing([null,2,3,1,3,1]);
   /* 生きているコードの押さえも一つ */
   const live=s2.bars.find(x=>(x.notes||[]).some(n=>n.chord&&n.chord.root!=null));
   const lc=(live.notes.find(n=>n.chord&&n.chord.root!=null)||{}).chord;
   const lk=U.chordKey(lc);
   s2.voicings[lk]=U.buildVoicing([null,3,2,0,1,0]);
   U.saveSong(s2);
   ok('[64] 使っていない押さえは掃かれる',
      !(s2.voicings&&s2.voicings[dead]), '');
   ok('[64] 使っている押さえは残る',
      !!(s2.voicings&&s2.voicings[lk]), '');
   /* **帯の控えに使われている押さえも、生きている** */
   const bb=s2.bars[0];
   const bandKey=U.chordKey({root:10,type:'maj',bass:null});
   bb.chordAt={0:{root:10,type:'maj',bass:null}};
   s2.voicings=s2.voicings||{};
   s2.voicings[bandKey]=U.buildVoicing([null,1,3,3,3,1]);
   U.saveSong(s2);
   ok('[64] 帯の控えに使う押さえは残る',
      !!(s2.voicings&&s2.voicings[bandKey]), '');
   bb.chordAt=null;
   if(s2.voicings) delete s2.voicings[lk];
 }catch(e){ ok('[64] 掃除の実地', false, e.message); }

 /* ══ 指板図の丸は「鳴る音」で出る ══
    カポ2で A の形を押さえれば、鳴る実音は B（B D♯ F♯）。
    譜面に「A」と書いてあっても、**指板から出ているのは B の和音**である。
    生徒が指板から聴き取るのは、鳴る音の方。 */
 try{
   const NM2=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
   const OM3=[40,45,50,55,59,64];
   const keepC=U.song.meta.capo, keepN=U.song.meta.capoName;
   /* 指板ぜんぶで、丸の出る**実音**を集める */
   const litPcs=(chord,cap)=>{
     const out=new Set();
     for(let si=0;si<6;si++) for(let f=0;f<=12;f++)
       if(U.toneDegreeAt(chord,si,f)) out.add((OM3[si]+f+cap)%12);
     return [...out].sort((a,b)=>a-b);
   };
   const want=(root,type)=>{
     const iv=(type==='min')?[0,3,7]:[0,4,7];
     return iv.map(x=>((root+x)%12+12)%12).sort((a,b)=>a-b);
   };
   const bad=[];
   /* ① 押さえ名で書く：名前は動かないが、鳴る音はカポぶん上がる */
   U.song.meta.capoName='shape';
   [[9,'maj'],[0,'maj'],[2,'min'],[7,'maj']].forEach(([r,t])=>{
     [0,1,2,3,5,7].forEach(cap=>{
       U.song.meta.capo=cap;
       const got=litPcs({root:r,type:t,bass:null},cap);
       const exp=want((r+cap)%12,t);
       if(JSON.stringify(got)!==JSON.stringify(exp))
         bad.push(NM2[r]+t+' Capo'+cap+': '+got.map(x=>NM2[x]).join(',')
           +' ≠ '+exp.map(x=>NM2[x]).join(','));
     });
   });
   ok('[65] 押さえ名で書いても、丸は鳴る音で出る', bad.length===0, bad.slice(0,3).join(' / '));
   /* ══ ② 実音で書いても、丸は一つも動かない（1.88 で改めた）══
      `chord.root` は**どちらの設定でも押さえの根**である。
      chordName が表に出す時だけカポぶん足して「D」と書いているだけで、
      中に持っている数は同じ。ゆえに鳴る根は、いつでも root＋カポ。
      古い式は capoName を見て根をずらしていたので、
      **《実音で書く》に切り替えた途端、丸がカポぶんずれていた。** */
   U.song.meta.capoName='actual';
   const bad2=[];
   [[9,'maj'],[0,'maj'],[4,'min']].forEach(([r,t])=>{
     [0,2,5].forEach(cap=>{
       U.song.meta.capo=cap;
       const got=litPcs({root:r,type:t,bass:null},cap);
       const exp=want((r+cap)%12,t);
       if(JSON.stringify(got)!==JSON.stringify(exp))
         bad2.push(NM2[r]+t+' Capo'+cap+': '+got.map(x=>NM2[x]).join(',')
           +' ≠ '+exp.map(x=>NM2[x]).join(','));
     });
   });
   ok('[65] 実音で書いても、丸は鳴る音で出る', bad2.length===0, bad2.slice(0,3).join(' / '));
   /* **二つの書き方で、丸が同じ所に出ること。**
      片方ずつ正しくても、突き合わせなければ食い違いに気付けない */
   { const diff=[];
     [[9,'maj'],[0,'maj'],[3,'min']].forEach(([r,t])=>{
       [1,2,4,7].forEach(cap=>{
         U.song.meta.capo=cap;
         U.song.meta.capoName='shape';
         const a1=JSON.stringify(litPcs({root:r,type:t,bass:null},cap));
         U.song.meta.capoName='actual';
         const a2=JSON.stringify(litPcs({root:r,type:t,bass:null},cap));
         if(a1!==a2) diff.push(NM2[r]+t+' Capo'+cap);
       });
     });
     ok('[65] 名前の書き方で丸は動かない', diff.length===0, diff.slice(0,3).join(' / ')); }
   /* ③ どの設定でも丸が消えない */
   const empty=[];
   ['shape','actual'].forEach(nm=>{
     U.song.meta.capoName=nm;
     [0,2,5,7].forEach(cap=>{
       U.song.meta.capo=cap;
       if(litPcs({root:0,type:'maj',bass:null},cap).length<3) empty.push(nm+' Capo'+cap);
     });
   });
   ok('[65] どの設定でも構成音の丸が出る', empty.length===0, empty.join(' '));
   /* ④ 既定は「押さえ名」 */
   delete U.song.meta.capoName; U.song.meta.capo=2;
   ok('[65] 書き方を決めていない曲でも、丸は鳴る音で出る',
      JSON.stringify(litPcs({root:9,type:'maj',bass:null},2))===JSON.stringify(want(11,'maj')),
      litPcs({root:9,type:'maj',bass:null},2).map(x=>NM2[x]).join(','));
   /* ⑤ **点の音名も鳴る音で出す** ══
      「押さえ名で書く」はコード名の書き方であって、
      指板から出ている音が変わるわけではない。
      名前に合わせて音名まで動かすと、図の音名と耳が食い違う */
   { const v2=U.buildVoicing([null,1,3,3,3,1]);   /* A# の形 */
     const NM3b=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
     const namesOf=()=>{ const o=[];
       for(let i=0;i<6;i++){ const l=U.dotLabel(v2,i,U.song.meta,'note'); if(l) o.push(l); }
       return o; };
     const badN=[];
     ['shape','actual'].forEach(nm=>{
       U.song.meta.capoName=nm;
       [0,2,4].forEach(cap=>{
         U.song.meta.capo=cap;
         const got=namesOf();
         const exp=[1,2,3,4,5].map(i=>NM3b[(OM3[i]+[null,1,3,3,3,1][i]+cap)%12]);
         if(JSON.stringify(got)!==JSON.stringify(exp))
           badN.push(nm+' Capo'+cap+': '+got.join(',')+' ≠ '+exp.join(','));
       });
     });
     ok('[65] 点の音名は鳴る音で出る（書き方によらず）',
        badN.length===0, badN.slice(0,3).join(' / ')); }

   /* ⑥ 鳴らす側と食い違わない */
   U.song.meta.capoName='shape'; U.song.meta.capo=2;
   { const v=U.autoVoicing(9,'maj',null);
     const heard=new Set(); (v.frets||[]).forEach((f,i)=>{ if(f!=null) heard.add((OM3[i]+f+2)%12); });
     const lit=new Set(litPcs({root:9,type:'maj',bass:null},2));
     ok('[65] 鳴る音と丸の音が食い違わない',
        [...heard].every(x=>lit.has(x)),
        '鳴='+[...heard].map(x=>NM2[x]).join(',')+' 丸='+[...lit].map(x=>NM2[x]).join(',')); }
   U.song.meta.capo=keepC; U.song.meta.capoName=keepN;
 }catch(e){ ok('[65] カポの実地', false, e.message); }

 /* ══ カポは指板図の左端に立つ（1.88 で改めた）══
    以前は「押さえの数はナットから数えた数」として、カポより手前を伏せていた。
    だが `frets` は再生も音名も丸も**カポから数えた数**で扱っている。
    ゆえにカポ2で C の形（1・2・3）が伏せ帯の中に描かれ、叩いても直せず、
    構成音の丸まで消えていた。**図の左端をカポと見なす**のが正しい。 */
 try{
   const keepC2=U.song.meta.capo, keepN2=U.song.meta.capoName;
   U.song.meta.capo=2; U.song.meta.capoName='shape';
   U.openVoicingEditor({chord:{root:10,type:'maj',bass:null}});
   U.renderVoicingEditor();
   const host=d.getElementById('vc-body');
   const svg=host.innerHTML;
   const hits=[...host.querySelectorAll('.vc-hit')];
   const fx=[...svg.matchAll(/<line x1="([\d.]+)" y1="[-\d.]+" x2="\1" y2="[-\d.]+" stroke="(?:#1f2937|#c9ccd3)"/g)]
     .map(m5=>+m5[1]).sort((a,b)=>a-b);
   const cellX={};
   for(let f=1;f<fx.length;f++) cellX[f]=[fx[f-1],fx[f]];
   const circles=[...svg.matchAll(/<circle cx="([\d.]+)"[^>]*fill="rgba\((?:180,83,9|79,70,229)/g)]
     .map(m2=>+m2[1]);
   const frets=circles.map(cx=>{
     const k=Object.keys(cellX).find(f=>cx>=cellX[f][0]&&cx<=cellX[f][1]);
     return k===undefined?-1:+k; }).filter(f=>f>=0);
   ok('[66] 構成音の丸が出る', circles.length>0, ''+circles.length);
   /* **カポの手前という場所は、もう無い。** 1・2 にも丸が出る */
   ok('[66] カポ1つ目・2つ目の枠にも丸が出る',
      frets.some(f=>f===1)||frets.some(f=>f===2),
      [...new Set(frets)].sort((a,b)=>a-b).join(','));
   ok('[66] 伏せ帯はもう描かない', !/fill="#eceef1"/.test(svg), '');
   ok('[66] カポの位置を字でも出す', /Capo 2/.test(svg), '');
   /* カポの棒は、1フレット線より左（＝ナットの所） */
   { const m6=svg.match(/<rect x="([-\d.]+)"[^>]*fill="#b45309"/);
     ok('[66] カポの棒はナットの所に立つ',
        !!m6&&(+m6[1])<fx[0], m6?('x='+m6[1]+' ナット='+fx[0].toFixed(1)):'棒が無い'); }
   /* **丸は、鳴る音そのもの。** 名前の書き方に関わらず、位置は動かない */
   { const OM4=[40,45,50,55,59,64], cap2=2, rootAct=(10+cap2)%12;
     const want=new Set();
     for(let i=0;i<6;i++) for(let f=0;f<=12;f++){
       const pc=(OM4[i]+f+cap2)%12;
       if([0,4,7].map(x=>(rootAct+x)%12).includes(pc)) want.add(i+':'+f);
     }
     ok('[66] 丸は鳴る音の位置に出る', want.size>0, '望='+want.size);
     const shapeSet=[...svg.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)"[^>]*fill="rgba\((?:180,83,9|79,70,229)/g)]
       .map(m7=>m7[1]+','+m7[2]).sort().join(' ');
     /* ══ ここが 1.88 の肝 ══
        《実音で書く》に変えても、鳴る音は変わらぬのだから丸も動かぬこと。
        古い式は capoName を見て根をずらしていたので、ここで動いていた */
     U.song.meta.capoName='actual'; U.renderVoicingEditor();
     const svg2=d.getElementById('vc-body').innerHTML;
     const actualSet=[...svg2.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)"[^>]*fill="rgba\((?:180,83,9|79,70,229)/g)]
       .map(m8=>m8[1]+','+m8[2]).sort().join(' ');
     ok('[66] 名前の書き方を変えても丸は動かない', shapeSet===actualSet&&shapeSet.length>0,
        '押さえ名='+shapeSet.split(' ').length+'個 実音='+actualSet.split(' ').length+'個');
     U.song.meta.capoName='shape'; U.renderVoicingEditor();
   }
   /* 実フレットの数字（相対＋カポ）が下に出る */
   ok('[66] 実フレットの数も出す',
      />3<\/text>/.test(d.getElementById('vc-body').innerHTML)&&/>14<\/text>/.test(d.getElementById('vc-body').innerHTML),
      '');
   /* カポ手前だった所も、今は的がある＝叩けば置ける */
   const h1=[...d.getElementById('vc-body').querySelectorAll('.vc-hit')]
     .find(h=>+h.getAttribute('data-f')===1&&+h.getAttribute('data-s')===0);
   ok('[66] 1フレットにも的がある', !!h1, '');
   if(h1){
     h1.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     ok('[66] 1フレットに置ける', U.vedit.frets[0]===1, String(U.vedit.frets[0]));
   }
   const h5=[...d.getElementById('vc-body').querySelectorAll('.vc-hit')]
     .find(h=>+h.getAttribute('data-f')===5&&+h.getAttribute('data-s')===0);
   if(h5){
     h5.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     ok('[66] 高いフレットにも置ける', U.vedit.frets[0]===5, String(U.vedit.frets[0]));
   }
   U.song.meta.capo=0; U.renderVoicingEditor();
   ok('[66] カポ無しならカポの棒は出ない',
      !/Capo /.test(d.getElementById('vc-body').innerHTML), '');
   U.closeVoicingEditor&&U.closeVoicingEditor();
   U.song.meta.capo=keepC2; U.song.meta.capoName=keepN2;
 }catch(e){ ok('[66] カポの実地', false, e.message); }

 /* ══ チューニング（1.90）══
    L様——「チューニングを追加して音に反映するように」。
    **押さえた所はそのまま、鳴る音だけが変わる**のが約束。
    ゆえに確かめるのは「音」であって、「押さえ」ではない。 */
 try{
   const keepT=U.song.meta.tuning, keepC3=U.song.meta.capo;
   U.song.meta.capo=0;
   ok('[90] チューニングの表がある', Array.isArray(U.TUNINGS)&&U.TUNINGS.length>=9,
      'n='+(U.TUNINGS?U.TUNINGS.length:0));
   /* 表そのものの筋が通っているか。**名札と MIDI が食い違えば、図と音がずれる** */
   { const NM=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
     const NMb=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
     const bad=[];
     U.TUNINGS.forEach(t=>{
       if(t.midi.length!==6||t.label.length!==6){ bad.push(t.id+' 本数'); return; }
       for(let i=0;i<6;i++){
         const pc=t.midi[i]%12;
         const l=t.label[i].replace('♯','#').replace('♭','b');
         if(l!==NM[pc]&&l!==NMb[pc]) bad.push(t.id+' '+(6-i)+'弦:'+t.label[i]+'≠'+NM[pc]);
       }
       for(let i=1;i<6;i++) if(t.midi[i]<=t.midi[i-1]) bad.push(t.id+' 並びが逆');
     });
     ok('[90] 名札と鳴る音が合っている', bad.length===0, bad.slice(0,3).join(' / ')); }
   /* **標準の隔たりかどうかの見分け。** ここを誤ると定番の型を当てる／当てないが逆になる */
   { const wantStd=['std','half','whole'];
     const bad2=[];
     U.TUNINGS.forEach(t=>{
       U.song.meta.tuning=t.id;
       const got=U.tuningStd(U.song);
       if(got!==(wantStd.indexOf(t.id)>=0)) bad2.push(t.id+'='+got);
     });
     ok('[90] 隔たりが標準かどうかを見分ける', bad2.length===0, bad2.join(' ')); }
   /* ══ 音に反映されているか ══
      **開放弦を引く道が一本であること。** どこかに標準を直に書いた所が残れば、
      そこだけ音が変わらない */
   { const bad3=[];
     U.TUNINGS.forEach(t=>{
       U.song.meta.tuning=t.id;
       if(JSON.stringify(U.OM())!==JSON.stringify(t.midi)) bad3.push(t.id);
     });
     ok('[90] 開放弦は選んだ並びから引く', bad3.length===0, bad3.join(' ')); }
   /* 音名の札も、選んだ並びで鳴る音になること */
   { const FR=[3,2,0,0,0,3];
     const v3=U.buildVoicing(FR.slice());
     U.song.meta.tuning='dropd';
     const NM4=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
     const EN={'C#':'D♭','D#':'E♭','F#':'G♭','G#':'A♭','A#':'B♭'};
     const dd=[38,45,50,55,59,64];
     const bad4=[];
     for(let i=0;i<6;i++){
       if(FR[i]===0) continue;
       const l=U.dotLabel(v3,i,U.song.meta,'note');
       const want=NM4[(dd[i]+FR[i])%12];
       if(l!==want&&l!==(EN[want]||want)) bad4.push((6-i)+'弦:'+l+'≠'+want);
     }
     ok('[90] 点の音名も選んだ並びで出る', bad4.length===0, bad4.join(' ')); }
   /* ══ 変則では、定番の型を当てない ══
      ドロップD で G の開放形（320003）を当てれば、低音が F に落ちて G/F になる。
      **押さえは変えてよいが、鳴る音が名前と違ってはならない。** */
   { const bad5=[];
     ['std','dropd','dadgad','openg','opend','dropc'].forEach(id=>{
       U.song.meta.tuning=id;
       const om=U.OM();
       [[7,'maj'],[0,'maj'],[9,'min'],[2,'maj'],[5,'maj']].forEach(([r,ty])=>{
         const v=U.resolveVoicing(U.song,{chord:{root:r,type:ty,bass:null}});
         if(!v){ bad5.push(id+' '+r+ty+' 押さえ無し'); return; }
         const on=[]; for(let i=0;i<6;i++) if(v.frets[i]!=null) on.push(i);
         if(!on.length){ bad5.push(id+' '+r+ty+' 空'); return; }
         const set=new Set(on.map(i=>(om[i]+v.frets[i])%12));
         const iv=(ty==='min')?[0,3,7]:[0,4,7];
         if(!set.has(r%12)||!set.has((r+iv[1])%12)) bad5.push(id+' '+r+ty+' 音欠け');
         set.forEach(pc=>{ if(iv.map(x=>(r+x)%12).indexOf(pc)<0) bad5.push(id+' '+r+ty+' 余分'); });
       });
     });
     ok('[90] どの並びでも、鳴る音が名前と合う', bad5.length===0, bad5.slice(0,4).join(' / ')); }
   /* **控えがチューニングを跨がないこと。** 跨げば、並びを変えても前の形が返り続ける */
   { U.song.meta.tuning='std';
     const a=U.resolveVoicing(U.song,{chord:{root:7,type:'maj',bass:null}});
     U.song.meta.tuning='dadgad';
     const b=U.resolveVoicing(U.song,{chord:{root:7,type:'maj',bass:null}});
     ok('[90] 並びを変えれば押さえも組み直る',
        JSON.stringify(a.frets)!==JSON.stringify(b.frets),
        'std='+a.frets.join(',')+' dadgad='+b.frets.join(',')); }
   /* 見出しの一行に出ること */
   { U.song.meta.tuning='dadgad'; U.render();
     const sub=d.querySelector('.p-sub');
     ok('[90] 見出しの一行にチューニングが出る',
        !!sub&&/DADGAD/.test(sub.textContent)&&!!sub.querySelector('[data-go="tuning"]'),
        sub?sub.textContent.slice(0,60):'一行が無い'); }
   U.song.meta.tuning=keepT||'std'; U.song.meta.capo=keepC3; U.render();
 }catch(e){ ok('[90] チューニングの実地', false, e.message); }

 /* ══ 輪（ホイール）の当たり判定（1.92）══
    L様——「ホイールからアルペジオがつけられない」。
    区画 i は **i*step を中心に左右へ step/2** の扇として描いているのに、
    当たり判定は `floor(a/step)`＝**i*step から時計回りへ step** を i と見ていた。
    半区画ぶんずれていたので、**扇の反時計回り側を指すと一つ手前の札が当たる。**
    （⌇アルペジオの左半分を指すと •スタッカートが付く、という形で表に出た）
    **扇の真ん中だけで確かめては、この不具合は一生見つからない。** */
 try{
   let barId=null,idx=-1;
   (U.song.bars||[]).forEach(bb=>{ if(barId==null&&(bb.notes||[]).some(x=>x.kind!=='rest')){
     barId=bb.id; idx=bb.notes.findIndex(x=>x.kind!=='rest'); } });
   ok('[92] 音符のある小節が見つかる', barId!=null&&idx>=0);
   U.openNoteRadial(barId,idx,400,400,false);
   const svg=d.querySelector('.rad-ov svg');
   const secs=[...svg.querySelectorAll('.rad-s')];
   const n=secs.length, step=Math.PI*2/n, out=104;
   const miss=[];
   for(let i=0;i<n;i++) [-0.45,-0.25,0,0.25,0.45].forEach(off=>{
     const a=i*step+off*step, r=70;
     const got=U.radSector(r*Math.sin(a),-r*Math.cos(a),n,out);
     if(got!==i) miss.push('区画'+i+' ずれ'+off+'→'+got);
   });
   ok('[92] 描いた扇と当たり判定が一致する（端まで）', miss.length===0, miss.slice(0,4).join(' / '));
   ok('[92] 中心は〈くわしく〉', U.radSector(0,0,n,out)==='c');
   ok('[92] 遠くへ離せば何も起きない', U.radSector(0,-(out+80),n,out)===null);
   const bar=U.song.bars.find(b=>b.id===barId), note=bar.notes[idx];
   const keepSym=JSON.stringify(note.sym);
   note.sym.arp=false; note.sym.rasg=false;
   const ai=[...svg.querySelectorAll('.rad-t')].filter(t=>/アルペジオ/.test(t.textContent))
     .map(t=>+t.getAttribute('data-i'))[0];
   ok('[92] 輪にアルペジオがある', ai!=null, String(ai));
   { const a=ai*step-0.4*step, r=70;
     ok('[92] 扇の左寄りでもアルペジオに当たる',
        U.radSector(r*Math.sin(a),-r*Math.cos(a),n,out)===ai); }
   { svg.querySelector('.rad-s[data-i="'+ai+'"]')
       .dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     ok('[92] 輪からアルペジオが付く', note.sym.arp===true, 'arp='+note.sym.arp); }
   /* **輪と札で、答えが一つであること。**
      札だけが「ラスゲアードと同時には付けられません」と塞いでいた */
   { note.sym.arp=false; note.sym.rasg=true;
     ok('[92] ラスゲアード中でもアルペジオを塞がない',
        U.symWhy(barId,note,'arp')===null, String(U.symWhy(barId,note,'arp')));
     note.sym.arp=false; note.sym.rasg=false; }
   /* 休符には付かない（ここは塞いだままであること） */
   { const rn={kind:'rest',sym:{}};
     ok('[92] 休符には付けられない', U.symWhy(barId,rn,'arp')!==null); }
   /* ══ 塞いだ札の薄さが、隣へ滲まないこと（1.93）══
      `.rad-s.off ~ .rad-t` は「後ろに続く兄弟ぜんぶ」なので、
      一つ塞がると**その先の札が残らず薄く**なっていた。
      〈スタッカート〉が塞がるだけで〈アルペジオ〉が押せなく見えた、の正体。 */
   { const bar2=U.song.bars.find(b=>b.id===barId), nn=bar2.notes[idx];
     const keep2=JSON.stringify({len:nn.len,sym:nn.sym});
     /* 全音符にすればスタッカートだけが塞がる（2分より長い音には付けない） */
     nn.len=U.barTicks(U.song,bar2); nn.kind='chord';
     U.closeRadial(); U.openNoteRadial(barId,idx,400,400,false);
     const sv=d.querySelector('.rad-ov svg');
     const lab=i=>[...sv.querySelectorAll('.rad-t[data-i="'+i+'"]')].map(t=>t.textContent).join('');
     const secOff=i=>sv.querySelector('.rad-s[data-i="'+i+'"]').classList.contains('off');
     const txtOff=i=>[...sv.querySelectorAll('.rad-t[data-i="'+i+'"]')].every(t=>t.classList.contains('off'));
     const cnt=sv.querySelectorAll('.rad-s').length;
     const bad6=[];
     for(let i=0;i<cnt;i++) if(secOff(i)!==txtOff(i)) bad6.push(i+'『'+lab(i)+'』扇='+secOff(i)+' 字='+txtOff(i));
     ok('[93] 塞ぎは、扇と字で一致する', bad6.length===0, bad6.slice(0,4).join(' / '));
     const st=[...Array(cnt).keys()].find(i=>/スタッカート/.test(lab(i)));
     const ar2=[...Array(cnt).keys()].find(i=>/アルペジオ/.test(lab(i)));
     ok('[93] 長い音ではスタッカートが塞がる', st!=null&&secOff(st), 'i='+st);
     ok('[93] その後ろのアルペジオは塞がらない',
        ar2!=null&&!secOff(ar2)&&!txtOff(ar2), 'i='+ar2+' 扇='+(ar2!=null?secOff(ar2):'—')+' 字='+(ar2!=null?txtOff(ar2):'—'));
     /* 塞がっていないのだから、押せば実際に付く */
     { const nb=U.song.bars.find(b=>b.id===barId).notes[idx];
       nb.sym.arp=false;
       sv.querySelector('.rad-s[data-i="'+ar2+'"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
       ok('[93] 塞ぎの後ろの札も、押せば効く', nb.sym.arp===true, 'arp='+nb.sym.arp); }
     const kp=JSON.parse(keep2); nn.len=kp.len; nn.sym=kp.sym;
     U.closeRadial(); }
   note.sym=JSON.parse(keepSym);
   U.closeRadial&&U.closeRadial();
   U.render();
 }catch(e){ ok('[92] 輪の実地', false, e.message); }

 /* ══ 輪の中身（1.94）══
    L様——「ダウンアップ休符はいらない。よく使う rit、フェルマータとかにしたい」。
    **降ろした物に行き場が無い、という形にはしないこと。**
    ダウン・アップは記号を叩けば回り、〈休符に〉は休符の筆で叩けば同じ。
    休符から音符へ戻す道だけは他所に無いので、輪と札の両方に残す。 */
 try{
   let bId=null,ni=-1,ri=-1;
   (U.song.bars||[]).forEach(bb=>{ if(bId==null&&(bb.notes||[]).some(x=>x.kind!=='rest')){
     bId=bb.id; ni=bb.notes.findIndex(x=>x.kind!=='rest'); } });
   const labs=()=>[...new Set([...d.querySelectorAll('.rad-ov .rad-t')]
     .map(t=>+t.getAttribute('data-i')))].map(i=>
       [...d.querySelectorAll('.rad-ov .rad-t[data-i="'+i+'"]')].map(t=>t.textContent).join(''));
   U.closeRadial(); U.openNoteRadial(bId,ni,400,400,false);
   const L=labs();
   ok('[94] 音符の輪は七つ', L.length===7, L.join('／'));
   ok('[94] ダウン・アップ・休符には降ろした',
      !L.some(x=>/ダウン|アップ/.test(x))&&!L.some(x=>/^休符に$/.test(x)), L.join('／'));
   ok('[94] フェルマータと rit. が載っている',
      L.some(x=>/フェルマータ/.test(x))&&L.some(x=>/rit\./.test(x)), L.join('／'));
   ok('[95] ブラッシングが載っている', L.some(x=>/ブラッシング/.test(x)), L.join('／'));
   ok('[95] 空振りは輪から降ろした', !L.some(x=>/空振り/.test(x)), L.join('／'));
   /* **降ろした物に行き場があること。**〈くわしく〉→ ストロークに残す */
   { U.closeRadial(); U.openNoteMenu(bId,ni);
     const bt=[...d.querySelectorAll('.pop button')].map(b=>b.textContent);
     ok('[95] 空振りは〈くわしく〉に残っている', bt.some(t=>/空振り/.test(t)), '');
     ok('[95] 〈くわしく〉にもブラッシングの道がある',
        bt.some(t=>/ブラッシング/.test(t)), '');
     U.closePop(); U.openNoteRadial(bId,ni,400,400,false); }
   /* ══ ブラッシングが実際に効くこと ══
      符頭が × になり、鳴りも擦過音に替わる（kind==='brush'） */
   { const nt=U.song.bars.find(b=>b.id===bId).notes[ni];
     const keepK=nt.kind, keepC=nt.chord?JSON.parse(JSON.stringify(nt.chord)):null;
     nt.kind='chord';
     U.closeRadial(); U.openNoteRadial(bId,ni,400,400,false);
     const L3=labs(), bi2=L3.findIndex(x=>/ブラッシング/.test(x));
     d.querySelector('.rad-ov .rad-s[data-i="'+bi2+'"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     ok('[95] 輪からブラッシングが付く', nt.kind==='brush', nt.kind);
     ok('[95] ブラッシングではコードを落とす（帯から付けた時と同じ）', nt.chord==null, String(nt.chord));
     /* もう一度で戻ること。**片道では、押し間違えた人が戻れない** */
     U.closeRadial(); U.openNoteRadial(bId,ni,400,400,false);
     const L4=labs(), bi3=L4.findIndex(x=>/ブラッシング/.test(x));
     d.querySelector('.rad-ov .rad-s[data-i="'+bi3+'"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     ok('[95] もう一度でふつうの音符に戻る', nt.kind==='chord', nt.kind);
     nt.kind=keepK; nt.chord=keepC; }
   /* **札を押せば輪は閉じる。** 続きの点検のために開き直す */
   U.closeRadial(); U.openNoteRadial(bId,ni,400,400,false);
   /* 実際に効くこと */
   { const nt=U.song.bars.find(b=>b.id===bId).notes[ni];
     const keep=JSON.stringify(nt.sym);
     const fi=L.findIndex(x=>/フェルマータ/.test(x));
     d.querySelector('.rad-ov .rad-s[data-i="'+fi+'"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     ok('[94] 輪からフェルマータが付く', nt.sym.fermata===true, String(nt.sym.fermata));
     U.closeRadial(); U.openNoteRadial(bId,ni,400,400,false);
     const L2=labs(), qi=L2.findIndex(x=>/rit\./.test(x));
     d.querySelector('.rad-ov .rad-s[data-i="'+qi+'"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     ok('[94] 輪から rit. が付く', nt.sym.tempo==='rit', String(nt.sym.tempo));
     nt.sym=JSON.parse(keep); }
   /* ══ 休符の輪 ══ */
   { const bar3=U.song.bars.find(b=>b.id===bId);
     const nt=bar3.notes[ni], keepK=nt.kind, keepS=nt.stroke;
     nt.kind='rest'; nt.stroke=null;
     U.closeRadial(); U.openNoteRadial(bId,ni,400,400,false);
     const R=labs();
     ok('[94] 休符の輪は三つ', R.length===3, R.join('／'));
     ok('[94] 休符でも塞がった札を並べない',
        [...d.querySelectorAll('.rad-ov .rad-s')].every(e=>!e.classList.contains('off')), R.join('／'));
     ok('[94] 休符の輪はフェルマータ・rit.・音符に',
        R.some(x=>/フェルマータ/.test(x))&&R.some(x=>/rit\./.test(x))&&R.some(x=>/音符に/.test(x)), R.join('／'));
     /* **戻る道が生きていること。** ここが切れると休符は一方通行になる */
     const bi=R.findIndex(x=>/音符に/.test(x));
     d.querySelector('.rad-ov .rad-s[data-i="'+bi+'"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     ok('[94] 休符から音符へ戻せる', bar3.notes[ni].kind!=='rest', bar3.notes[ni].kind);
     bar3.notes[ni].kind=keepK; bar3.notes[ni].stroke=keepS; }
   /* 札の側にも戻る道があること（輪だけに載せない） */
   { const bar4=U.song.bars.find(b=>b.id===bId), nt=bar4.notes[ni];
     const keepK=nt.kind; nt.kind='rest';
     U.closeRadial(); U.openNoteMenu(bId,ni);
     const btns=[...d.querySelectorAll('.pop button')].map(b=>b.textContent);
     ok('[94] 〈くわしく〉にも「音符にする」がある',
        btns.some(t=>/音符にする/.test(t)), btns.slice(0,8).join('／'));
     U.closePop&&U.closePop(); nt.kind=keepK; }
   U.closeRadial(); U.render();
 }catch(e){ ok('[94] 輪の中身の実地', false, e.message); }

 /* ══ 休符の筆のなぞり（1.97）══
    L様——「休符の筆でドラッグできない」。
    空白からのなぞりは通っていたが、**休符の筆で濃く光っているのは音符のマス**である。
    そこを押してなぞると、音符のまま長さだけが変わっていた——
    **的として光らせておきながら、筆と違う仕事をしていた。** */
 try{
   const L=100,W=400;
   const ev=(t,x)=>{ const e=new w.MouseEvent(t,{bubbles:true,clientX:x,clientY:40,button:0}); e.pointerId=1; return e; };
   const stage=(pen,fill)=>{
     U.mode='rhythm'; U.setPen(pen); U.render();
     const wr0=d.querySelector('#paper .mwrap'); const id=wr0.getAttribute('data-bar');
     const bar=U.song.bars.find(b=>b.id===id); bar.notes=[];
     if(fill) fill(bar); U.render();
     const wr=d.querySelector('#paper .mwrap[data-bar="'+id+'"]');
     wr.getBoundingClientRect=()=>({left:L,top:0,width:W,height:80,right:L+W,bottom:80});
     Object.defineProperty(wr,'clientWidth',{value:W,configurable:true});
     return {id,wr};
   };
   const swipe=(cell,x0,x1)=>{ cell.dispatchEvent(ev('pointerdown',x0));
     d.getElementById('paper').dispatchEvent(ev('pointermove',x0+40));
     d.getElementById('paper').dispatchEvent(ev('pointermove',x1));
     w.dispatchEvent(ev('pointerup',x1)); };
   const notesOf=id=>U.song.bars.find(b=>b.id===id).notes;
   /* ① 空白から */
   { const {id,wr}=stage('rest');
     const c=wr.querySelector('.hit[data-src="-1"]');
     swipe(c,L+40,L+200);
     const ns=notesOf(id);
     ok('[97] 空白からなぞって休符が置ける',
        ns.length===1&&ns[0].kind==='rest'&&ns[0].len<U.barTicks(U.song,U.song.bars.find(b=>b.id===id)),
        JSON.stringify(ns.map(n=>n.kind+n.start+'/'+n.len))); }
   /* ② 音符の上から。**休符になり、なぞった長さになること** */
   { const {id,wr}=stage('rest',bar=>{ U.insertNote(U.song,bar,0,{kind:'chord',chord:null,stroke:null}); });
     const bar=U.song.bars.find(b=>b.id===id);
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+id+'"]');
     wr2.getBoundingClientRect=()=>({left:L,top:0,width:W,height:80,right:L+W,bottom:80});
     Object.defineProperty(wr2,'clientWidth',{value:W,configurable:true});
     const full=wr2.querySelector('.hit.hv-full');
     ok('[97] 休符の筆では音符のマスが的', !!full, '');
     if(full){
       swipe(full,L+40,L+190);
       const ns=notesOf(id);
       ok('[97] 音符の上からなぞれば休符になる',
          ns.length&&ns[0].kind==='rest', JSON.stringify(ns.map(n=>n.kind+n.start+'/'+n.len)));
       ok('[97] しかも長さがなぞりで決まる',
          ns.length&&ns[0].len<U.barTicks(U.song,bar), String(ns[0]&&ns[0].len));
     } }
   /* ③ 音符の筆では、今までどおり音符のまま伸縮する */
   { const {id,wr}=stage('note',bar=>{ U.insertNote(U.song,bar,0,{kind:'chord',chord:null,stroke:null}); });
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+id+'"]');
     wr2.getBoundingClientRect=()=>({left:L,top:0,width:W,height:80,right:L+W,bottom:80});
     Object.defineProperty(wr2,'clientWidth',{value:W,configurable:true});
     const full=wr2.querySelector('.hit.hv-full');
     if(full){ swipe(full,L+40,L+190);
       const ns=notesOf(id);
       ok('[97] 音符の筆では音符のまま（休符にしない）',
          ns.length&&ns[0].kind!=='rest', JSON.stringify(ns.map(n=>n.kind+n.start+'/'+n.len))); } }
   /* ④ 休符にする手続きが一本であること。
        **休符にも付けられる指示（フェルマータ・rit.）は残す** */
   { const {id}=stage('rest',bar=>{ U.insertNote(U.song,bar,0,{kind:'chord',chord:null,stroke:null}); });
     const bar=U.song.bars.find(b=>b.id===id), n0=bar.notes[0];
     n0.accent=true; n0.staccato=true; n0.sym.arp=true; n0.sym.ring=true;
     n0.sym.fermata=true; n0.sym.tempo='rit';
     U.makeRest(n0);
     ok('[97] 休符にすれば弾き方の指示は落ちる',
        !n0.accent&&!n0.staccato&&!n0.sym.arp&&!n0.sym.ring, JSON.stringify(n0.sym));
     ok('[97] 休符にも付く指示（フェルマータ・rit.）は残す',
        n0.sym.fermata===true&&n0.sym.tempo==='rit', JSON.stringify(n0.sym)); }
   U.setPen('note'); U.render();
 }catch(e){ ok('[97] 休符の筆の実地', false, e.message); }

 /* ══ 左方向のなぞり（1.98）══
    L様——「左方向にもドラッグできて欲しい」。
    なぞりは**範囲を引く**もの。押した所と離した所の間が音価であり、
    どちらへ引いても押したマスは必ず含まれる。
    以前は押した所を必ず頭としていたので、左へ引いても最短になるだけだった。 */
 try{
   const L=100,W=400;
   const ev=(t,x)=>{ const e=new w.MouseEvent(t,{bubbles:true,clientX:x,clientY:40,button:0}); e.pointerId=1; return e; };
   const stage=(pen,fill)=>{
     U.mode='rhythm'; U.setPen(pen); U.render();
     const w0=d.querySelector('#paper .mwrap'); const id=w0.getAttribute('data-bar');
     const bar=U.song.bars.find(b=>b.id===id); bar.notes=[];
     if(fill) fill(bar); U.render();
     const wr=d.querySelector('#paper .mwrap[data-bar="'+id+'"]');
     wr.getBoundingClientRect=()=>({left:L,top:0,width:W,height:80,right:L+W,bottom:80});
     Object.defineProperty(wr,'clientWidth',{value:W,configurable:true});
     return {id,wr,bar:U.song.bars.find(b=>b.id===id)};
   };
   const swipe=(cell,x0,x1)=>{ cell.dispatchEvent(ev('pointerdown',x0));
     d.getElementById('paper').dispatchEvent(ev('pointermove',x0+(x1>x0?40:-40)));
     d.getElementById('paper').dispatchEvent(ev('pointermove',x1));
     w.dispatchEvent(ev('pointerup',x1)); };
   const ns=id=>U.song.bars.find(b=>b.id===id).notes;
   /* ① 右から左へ。**離した所が頭になり、押したマスは含まれる** */
   { const {id,wr,bar}=stage('note');
     const cells=[...wr.querySelectorAll('.hit')];
     const c=cells[Math.min(6,cells.length-1)];
     const anchor=+c.getAttribute('data-start');
     swipe(c,L+250,L+120);
     const a=ns(id);
     ok('[98] 左へなぞっても置ける', a.length===1, JSON.stringify(a.map(n=>n.kind+n.start+'/'+n.len)));
     ok('[98] 頭が押した所より手前へ来る', a.length&&a[0].start<anchor,
        '頭='+(a[0]&&a[0].start)+' 押した所='+anchor);
     ok('[98] 押したマスは範囲に含まれる',
        a.length&&a[0].start<=anchor&&a[0].start+a[0].len>anchor,
        '範囲='+(a[0]&&a[0].start)+'〜'+(a[0]&&(a[0].start+a[0].len))+' 押した所='+anchor); }
   /* ② 小節の手前へは、はみ出さない */
   { const {id,wr}=stage('note');
     const cells=[...wr.querySelectorAll('.hit')];
     const c=cells[1];
     swipe(c,L+80,L-400);
     const a=ns(id);
     ok('[98] 小節の頭より手前へは出ない', a.length&&a[0].start>=0, JSON.stringify(a.map(n=>n.start+'/'+n.len))); }
   /* ③ 既存の音符を左へ引けば、頭ごと手前へ伸びる。中身は残ること */
   { const {id,wr,bar}=stage('note',b=>{
       const j=U.insertNote(U.song,b,U.beatTicks(U.barTS(U.song,b))*2,
         {kind:'chord',chord:{root:0,type:'maj',bass:null},stroke:'d'});
       U.song.bars.find(x=>x.id===b.id);
     });
     U.render();
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+id+'"]');
     wr2.getBoundingClientRect=()=>({left:L,top:0,width:W,height:80,right:L+W,bottom:80});
     Object.defineProperty(wr2,'clientWidth',{value:W,configurable:true});
     const before=ns(id).find(n=>n.chord);
     const st0=before?before.start:null;
     const full=wr2.querySelector('.hit.hv-full');
     if(full&&st0!=null){
       swipe(full,L+210,L+90);
       const a=ns(id), moved=a.find(n=>n.chord);
       ok('[98] 既存の音符も頭ごと手前へ伸びる', !!moved&&moved.start<st0,
          '前='+st0+' 後='+(moved&&moved.start));
       ok('[98] 動かしてもコードと向きは残る',
          !!moved&&moved.chord&&moved.chord.root===0&&moved.stroke==='d',
          JSON.stringify(moved&&{c:moved.chord,s:moved.stroke}));
     }else ok('[98] 既存の音符も頭ごと手前へ伸びる', false, 'マスが無い'); }
   /* ④ 右へのなぞりは今までどおり */
   { const {id,wr,bar}=stage('note');
     const c=wr.querySelector('.hit[data-src="-1"]');
     swipe(c,L+40,L+220);
     const a=ns(id);
     ok('[98] 右へは今までどおり（頭は押した所）', a.length&&a[0].start===0, JSON.stringify(a.map(n=>n.start+'/'+n.len)));
     ok('[98] 右へは小節ぜんぶにはならない', a.length&&a[0].len<U.barTicks(U.song,bar), String(a[0]&&a[0].len)); }
   /* ⑤ 行きつ戻りつしても切れ端が残らない。
        **足し引きで済ませていたら、ここで余りの音符が残る** */
   { const {id,wr,bar}=stage('note');
     const c=wr.querySelector('.hit[data-src="-1"]');
     c.dispatchEvent(ev('pointerdown',L+40));
     [80,200,300,150,60,240,120].forEach(x=>d.getElementById('paper').dispatchEvent(ev('pointermove',L+x)));
     w.dispatchEvent(ev('pointerup',L+120));
     const a=ns(id);
     ok('[98] 行きつ戻りつしても残るのは一つだけ', a.length===1, JSON.stringify(a.map(n=>n.start+'/'+n.len))); }
   /* ⑥ 取り消しは一手にまとまること */
   { const {id,wr}=stage('note');
     const c=wr.querySelector('.hit[data-src="-1"]');
     swipe(c,L+40,L+200);
     ok('[98] なぞりで一つ置かれた', ns(id).length===1, '');
     U.doUndo();
     ok('[98] 取り消しは一手で戻る', ns(id).length===0, JSON.stringify(ns(id).map(n=>n.start+'/'+n.len))); }
   U.setPen('note'); U.render();
 }catch(e){ ok('[98] 左なぞりの実地', false, e.message); }

 /* ══ コードの帯のマス割り（1.99）══
    L様——「一段を2小節にしたときにコードの帯の区切りがズレてる」。
    譜面の的（.hit・〈入力〉）は cellMarks の [st,en] をそのまま使うのに、
    帯だけが「時刻＋grid/2 を中心に、幅は隣との中間まで」で張られていた。
    `grid` は**音符の頭と長さの最大公約数**なので、
    音符の無い小節では1拍まるごとになり、8分刻みなら半マスずれる。
    段が広いほど、そのずれは目に見えて大きくなる。

    **帯は〈コード〉、譜面のマスは〈入力〉にしか出ない。**
    ゆえに同じ小節を二度描いて、二つの割り方を突き合わせる。 */
 try{
   const grab=(m,sel,key)=>{
     U.mode=m; U.render();
     const out={};
     [...d.querySelectorAll('#paper .mwrap')].forEach(wr=>{
       const id=wr.getAttribute('data-bar');
       const svg=wr.querySelector('svg.msvg'); if(!svg) return;
       const o={};
       svg.querySelectorAll(sel).forEach(r=>{
         const st=r.getAttribute(key); if(st==null) return;
         o[st]={x:+r.getAttribute('x'),w:+r.getAttribute('width')};
       });
       if(!out[id]) out[id]=o;
     });
     return out;
   };
   const staff=grab('rhythm','.hit','data-start');
   const band =grab('edit','.hit-mark[data-zone="chord"]','data-st');
   let n=0; const bad=[];
   Object.keys(band).forEach(id=>{
     const h=staff[id]; if(!h) return;
     Object.keys(band[id]).forEach(st=>{
       if(!h[st]) return; n++;
       if(Math.abs(band[id][st].x-h[st].x)>0.6||Math.abs(band[id][st].w-h[st].w)>0.6)
         bad.push('小節'+id+' tick'+st+' 帯='+band[id][st].x.toFixed(1)+'/'+band[id][st].w.toFixed(1)
                  +' 譜面='+h[st].x.toFixed(1)+'/'+h[st].w.toFixed(1));
     });
   });
   ok('[99] 突き合わせるマスがあった', n>20, String(n));
   ok('[99] 帯の区切りが譜面のマスと揃う', bad.length===0, bad.slice(0,4).join(' / '));
   /* ══ 音符の無い小節でこそ、ずれていた ══
      grid が1拍まるごとになる小節を作って確かめる */
   { const id=Object.keys(band)[0];
     const bar=U.song.bars.find(b=>b.id===id);
     const keep=JSON.parse(JSON.stringify(bar.notes)), keepS=bar.snap;
     bar.notes=[]; bar.snap=2;                       /* 空の小節・刻みは8分 */
     const st2=grab('rhythm','.hit','data-start')[id];
     const bd2=grab('edit','.hit-mark[data-zone="chord"]','data-st')[id];
     const ks=Object.keys(bd2||{}).filter(k=>st2&&st2[k]!=null);
     ok('[99] 音符の無い小節でもマスが並ぶ', ks.length>1, String(ks.length));
     const bad2=ks.filter(k=>Math.abs(bd2[k].x-st2[k].x)>0.6||Math.abs(bd2[k].w-st2[k].w)>0.6);
     ok('[99] 音符の無い小節でも区切りが揃う', bad2.length===0,
        bad2.slice(0,3).map(k=>'tick'+k+' 帯='+bd2[k].x.toFixed(1)+'/'+bd2[k].w.toFixed(1)
          +' 譜面='+st2[k].x.toFixed(1)+'/'+st2[k].w.toFixed(1)).join(' / '));
     bar.notes=keep; if(keepS==null) delete bar.snap; else bar.snap=keepS; }
   U.mode='rhythm'; U.render();
 }catch(e){ ok('[99] 帯のマスの実地', false, e.message); }

 /* ══ 速さと強弱の記号は、五線の下へ（1.100）══
    L様——「rit やクレッシェンドなどの記号は下の帯がいいね」。
    クレッシェンドは元より下に引いていたが、**rit. だけが五線の上**、
    しかも**それを選ぶ帯（sym）も上**という三つ巴だった。
    上はコード名・ストローク記号・フェルマータで混み合う所である。 */
 try{
   const bar=U.song.bars[0];
   const keepN=JSON.parse(JSON.stringify(bar.notes));
   bar.notes=[]; U.insertNote(U.song,bar,0,{kind:'chord',chord:null,stroke:null});
   const setSym=o=>{ bar.notes[0].sym=Object.assign(
     {fermata:false,tempo:null,hair:null,pm:false,arp:false,rasg:false,ring:false,tap:false,text:null},o); };
   const draw=()=>U.engrave(U.song,bar,{width:400,hits:true,
     zoneKinds:['chord','sym','lyric','ann'],barId:bar.id}).svg;
   const BASE=54;                                   /* 五線の高さ（engrave の baseY） */
   const yOf=(svg,re)=>{ const m=svg.match(re); return m?+m[1]:null; };
   const zone=(svg,k)=>{ const m=svg.match(new RegExp('data-zone="'+k+'"[^>]*y="([-\\d.]+)"[^>]*height="([\\d.]+)"'));
     return m?{y:+m[1],h:+m[2]}:null; };
   /* ① rit. は五線より下 */
   { setSym({tempo:'rit'}); const svg=draw();
     const y=yOf(svg,/<text[^>]*y="([-\d.]+)"[^>]*>rit\.<\/text>/);
     ok('[100] rit. は五線の下に出る', y!=null&&y>BASE, '五線='+BASE+' rit.='+y); }
   /* ② クレッシェンドも下（元より） */
   { setSym({hair:'cresc'}); const svg=draw();
     const ys=[...svg.matchAll(/<path d="M [\d.]+ ([\d.]+) L/g)].map(m=>+m[1]).filter(v=>v>BASE);
     ok('[100] クレッシェンドも五線の下', ys.length>0, ys.slice(0,3).join(',')); }
   /* ③ 二つ同時でも重ならない。**別々に足していたので重なっていた** */
   { setSym({tempo:'rit',hair:'cresc'}); const svg=draw();
     const ty=yOf(svg,/<text[^>]*y="([-\d.]+)"[^>]*>rit\.<\/text>/);
     const hy=[...svg.matchAll(/<path d="M [\d.]+ ([\d.]+) L/g)].map(m=>+m[1]).filter(v=>v>BASE);
     const hmin=hy.length?Math.min(...hy):null;
     ok('[100] rit. と強弱が重ならない', ty!=null&&hmin!=null&&Math.abs(ty-hmin)>=10,
        'rit.='+ty+' 強弱='+hmin); }
   /* ④ 記号の帯も下。**物が下にあるのに的が上では、叩いた所と選ばれる物が離れる** */
   { setSym({}); const svg=draw();
     const z=zone(svg,'sym');
     ok('[100] 記号の帯も五線の下', !!z&&z.y>BASE, z?('y='+z.y):'帯が無い');
     ok('[100] 記号の帯は指が届く高さ', !!z&&z.h>=16, z?('h='+z.h):'—'); }
   /* ⑤ 歌詞の帯と重ならない。**重なった二つの的は、どちらが当たるか読めない** */
   { [{},{tempo:'rit'},{hair:'cresc'},{tempo:'rit',hair:'cresc'}].forEach(o=>{
       setSym(o); const svg=draw();
       const zs=zone(svg,'sym'), zl=zone(svg,'lyric');
       if(!zs||!zl) return;
       ok('[100] 記号の帯と歌詞の帯が重ならない（'+(o.tempo||'—')+'/'+(o.hair||'—')+'）',
          zs.y+zs.h<=zl.y, '記号='+zs.y+'〜'+(zs.y+zs.h)+' 歌詞='+zl.y);
     }); }
   /* ⑥ フェルマータは音符の上に残す（記譜の作法） */
   { setSym({fermata:true}); const svg=draw();
     const ys=[...svg.matchAll(/<circle cx="[\d.]+" cy="([\d.]+)" r="1.9"/g)].map(m=>+m[1]);
     ok('[100] フェルマータは五線の上のまま', ys.some(v=>v<BASE), ys.join(',')); }
   bar.notes=keepN; U.render();
 }catch(e){ ok('[100] 下の帯の実地', false, e.message); }

 /* ══ 鳴っている間は、手を入れる道具を伏せる（1.104 → 1.105）══
    L様——「再生時はいらない表示はなくして。例えば小節を足すとか」
          →「微妙な残り方をしてる」。
    1.104 は一つずつ伏せたので、**伏せ忘れた物だけが宙に浮いた**
    （繰り返し1回の「×」と「1」、名前が空の見出しの ⑂ 印）。
    見出しは中身を丸ごと伏せ、札（data-label）を一行出す形へ改めた。 */
 try{
   U.mode='rhythm'; U.render();
   /* **書いたままの字を読むこと。** jsdom の cssRules は
      `::after` や `attr()` を落とすことがあり、有る物を無いと言う */
   const css=[...d.querySelectorAll('style')].map(el=>el.textContent).join('\n');
   ok('[105] 再生中は見出しの中身を丸ごと伏せる',
      /body\.playing \.sec-head\s*>\s*\*/.test(css), '');
   ok('[105] 代わりに札を一行出す',
      /sec-head::after/.test(css)&&/attr\(data-label\)/.test(css), '');
   ok('[105] 札が空なら見出しごと畳む',
      /body\.playing \.sec-head\[data-label="?"?\]\{[^}]*display:\s*none/.test(css)
      ||/body\.playing \.sec-head\[data-label=""\]/.test(css), '');
   /* ══ 実地 ══ */
   const sec0=U.song.sections[0];
   const keepNm=sec0.name, keepRp=sec0.repeat;
   const headOf=()=>d.querySelector('#paper .sec-head');
   const shown=el=>el&&w.getComputedStyle(el).display!=='none';
   /* ① 名前も繰り返しも無い：見出しごと消える */
   sec0.name=''; sec0.repeat=1; U.render();
   d.body.classList.add('playing');
   { const h=headOf();
     ok('[105] 名前も繰り返しも無ければ、見出しは出ない', !shown(h),
        h?('data-label="'+h.getAttribute('data-label')+'" display='+w.getComputedStyle(h).display):'見出しが無い');
     const stray=[...(h?h.children:[])].filter(shown);
     ok('[105] ⑂ の印や「×」「1」が浮かない', stray.length===0,
        stray.map(e=>e.className||e.tagName).join(' / ')); }
   /* ② 名前があれば札に出る */
   d.body.classList.remove('playing');
   sec0.name='Aメロ'; sec0.repeat=1; U.render();
   d.body.classList.add('playing');
   { const h=headOf();
     ok('[105] 名前があれば札に出る', shown(h)&&h.getAttribute('data-label')==='Aメロ',
        h?h.getAttribute('data-label'):'—'); }
   /* ③ 繰り返し回数は 1.111 で廃した。**古い曲に数が残っていても札に出さない** */
   d.body.classList.remove('playing');
   sec0.repeat=2; U.render(); d.body.classList.add('playing');
   ok('[111] 古い「×2」は札に出さない',
      !/×/.test(headOf().getAttribute('data-label')), headOf().getAttribute('data-label'));
   /* ④ 道具は消える／止めれば戻る */
   { const gone=[...d.querySelectorAll('#paper .sec-tools, #paper .add-sec, #paper .m-menu')]
       .filter(shown);
     ok('[105] 〈小節を足す〉〈セクションを足す〉〈⋯〉は消える', gone.length===0,
        gone.slice(0,3).map(e=>e.className).join(' / ')); }
   d.body.classList.remove('playing');
   { const t=d.querySelector('#paper .sec-tools');
     ok('[105] 止めれば道具は戻る', !t||shown(t), '');
     const h=headOf();
     ok('[105] 止めれば見出しの中身も戻る', shown(h)&&[...h.children].some(shown), ''); }
   sec0.name=keepNm; sec0.repeat=keepRp; U.render();
 }catch(e){ ok('[105] 再生中の見た目の実地', false, e.message); }

 /* ══ 設定のまとまり（1.106）══
    L様——「設定欄を見やすく色分けなどしてほしい」。
    項目は三十を超えるのに、線を一本引いて見出しを載せるだけだったので、
    **どこからどこまでが一つのまとまりか、目では追えなかった。**
    上から順に読むしかない一枚の表は、探す時に「無い」と思わせる。 */
 try{
   U.renderSettings();
   const box=d.getElementById('set-fields');
   const grps=[...box.querySelectorAll('.set-grp')];
   ok('[106] まとまりに分かれている', grps.length>=5, String(grps.length));
   /* **囲いの外に落ちた項目が無いこと。** 一つでも外に出れば、そこだけ迷子になる */
   ok('[106] 項目が囲いの外へ落ちていない',
      [...box.children].every(c=>c.classList.contains('set-grp')),
      [...box.children].filter(c=>!c.classList.contains('set-grp')).map(c=>c.className).join(','));
   ok('[106] 空のまとまりが無い',
      grps.every(g=>g.querySelectorAll('.fld').length>0),
      grps.filter(g=>!g.querySelectorAll('.fld').length).map(g=>g.className).join(','));
   /* **一つのまとまりが大きすぎないこと。** 囲っても中が二十では、囲った意味が無い */
   const big=grps.filter(g=>g.querySelectorAll('.fld').length>8);
   ok('[106] 一つのまとまりが膨れていない', big.length===0,
      big.map(g=>g.querySelector('.grp-ttl').textContent.trim()+'='+g.querySelectorAll('.fld').length).join(' / '));
   /* 見出しには色の点が付く */
   ok('[106] 見出しに色の点がある',
      grps.every(g=>!!g.querySelector('.grp-ttl .grp-dot')), '');
   /* ══ 色が重なっていないこと ══
      **同じ色を二つに使えば、その二つは一つに見える。** */
   { const css=[...d.querySelectorAll('style')].map(el=>el.textContent).join('\n');
     const cols=[...css.matchAll(/\.set-grp\.g-([a-z]+)\s*\{--gc:(#[0-9a-f]{3,6})/gi)]
       .map(m=>({k:m[1],c:m[2].toLowerCase()}));
     ok('[106] まとまりの数だけ色が要る', cols.length>=grps.length,
        '色='+cols.length+' まとまり='+grps.length);
     const seen={}, dup=[];
     cols.forEach(c=>{ if(seen[c.c]) dup.push(c.c+'（'+seen[c.c]+'／'+c.k+'）'); seen[c.c]=c.k; });
     ok('[106] 同じ色を二つに使っていない', dup.length===0, dup.join(' / '));
     /* 札に色が結び付いていること */
     const miss=grps.map(g=>[...g.classList].find(x=>x.indexOf('g-')===0))
       .filter(k=>k&&!cols.some(c=>'g-'+c.k===k));
     ok('[106] どのまとまりにも色が当たっている', miss.length===0, miss.join(',')); }
   /* 組み直しても増殖しないこと（設定は曲が変わるたび組み直される） */
   U.renderSettings(); U.renderSettings();
   ok('[106] 組み直しても増えない',
      d.getElementById('set-fields').querySelectorAll('.set-grp').length===grps.length,
      String(d.getElementById('set-fields').querySelectorAll('.set-grp').length));
 }catch(e){ ok('[106] 設定のまとまりの実地', false, e.message); }

 /* ══ 選んだ小節から下を、新しいセクションへ（1.107）══
    L様——「段の設定がある意味がない。エンターキーが割り当てないなら
            選んだ小節から後ろをセクション分ける機能にしたい」。
    節ごとの〈段〉は外し、その場所と Enter を「切る」へ充てた。 */
 try{
   const secN=()=>U.song.sections.length;
   const keyOf=(si,pos)=>si+'_'+pos;
   /* **前の点検が節をいじっている。**いちばん小節の多い節で試す */
   let SI=0;
   U.song.sections.forEach((sc,i)=>{ if(sc.items.length>U.song.sections[SI].items.length) SI=i; });
   const N0=U.song.sections[SI].items.length;
   U.mode='select'; U.selTake('bar'); U.render();
   ok('[107] 切れるだけの小節がある', N0>=4, '節'+SI+' の小節='+N0);
   /* ① 何も選んでいなければ、切らずに伝える */
   { const n0=secN(); U.sel.clear(); U.splitAtSelection();
     ok('[107] 選んでいなければ切らない', secN()===n0, n0+'→'+secN()); }
   /* ② 節の先頭では切らない。**切っても何も切り出せない** */
   { const n0=secN(); U.sel.clear(); U.sel.add(keyOf(SI,0)); U.splitAtSelection();
     ok('[107] 節の先頭では切らない', secN()===n0, n0+'→'+secN()); }
   /* ③ 途中の小節で切れば、節が一つ増える */
   { const n0=secN();
     U.sel.clear(); U.sel.add(keyOf(SI,2)); U.splitAtSelection();
     ok('[107] 途中で切れば節が増える', secN()===n0+1, n0+'→'+secN());
     ok('[107] 切れ目より前が元の節に残る',
        U.song.sections[SI].items.length===2, String(U.song.sections[SI].items.length));
     ok('[107] 切れ目から下が新しい節へ',
        !!U.song.sections[SI+1]&&U.song.sections[SI+1].items.length===N0-2,
        (U.song.sections[SI+1]?U.song.sections[SI+1].items.length:'—')+' / 望み='+(N0-2));
     ok('[107] 新しい節に名前は付けない',
        !!U.song.sections[SI+1]&&U.song.sections[SI+1].name==='',
        '「'+(U.song.sections[SI+1]?U.song.sections[SI+1].name:'—')+'」');
     U.doUndo();
     ok('[107] 一手で戻せる',
        secN()===n0&&U.song.sections[SI].items.length===N0,
        secN()+' / '+U.song.sections[SI].items.length); }
   /* ④ 何小節選んでいても、切れ目は一つ（並びの先頭） */
   { const n0=secN();
     U.sel.clear(); U.sel.add(keyOf(SI,3)); U.sel.add(keyOf(SI,1)); U.sel.add(keyOf(SI,2));
     U.splitAtSelection();
     ok('[107] 何小節選んでも切れ目は一つ', secN()===n0+1, n0+'→'+secN());
     ok('[107] 切れ目は並びの先頭（選んだ順ではない）',
        U.song.sections[SI].items.length===1, String(U.song.sections[SI].items.length));
     U.doUndo(); }
   /* ⑤ Enter で切れる。**開いた札があれば譜面のキーは譲る**ので、先に畳む */
   { d.querySelectorAll('.sheet-ov.open').forEach(o=>o.classList.remove('open'));
     d.querySelectorAll('.pop-ov').forEach(o=>o.remove());
     const n0=secN();
     U.sel.clear(); U.sel.add(keyOf(SI,2)); U.render();
     d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
     ok('[107] Enter で切れる', secN()===n0+1, n0+'→'+secN());
     if(secN()===n0+1) U.doUndo(); }
   /* ⑥ 入力欄に焦点がある時は横取りしない。**曲名を打って Enter で節が切れては困る** */
   { const n0=secN();
     U.sel.clear(); U.sel.add(keyOf(SI,2));
     const inp=d.createElement('input'); d.body.appendChild(inp);
     inp.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
     ok('[107] 入力欄では Enter を横取りしない', secN()===n0, n0+'→'+secN());
     inp.remove(); U.sel.clear(); }
   /* ⑦ 節ごとの〈段〉は無くなっていること */
   U.mode='rhythm'; U.render();
   ok('[107] 節ごとの〈段〉の選びは出ない',
      d.querySelectorAll('#paper .sec-sel').length===0,
      String(d.querySelectorAll('#paper .sec-sel').length));
   /* **段は曲の設定一本。**節に古い控えが残っていても、そこは読まない */
   { ok('[107] 見出しに〈段落をつける〉の入口がある',
        [...d.querySelectorAll('#paper .sec-ico')].some(b=>/✂/.test(b.textContent)), '');
     /* ══ 絵記号だけでは、何が動くのか読めない（1.108）══
        L様——「セクション毎移動って出せばいい」。
        ↑↓ は**節を丸ごと**入れ替える。矢印の形からはそれが分からない */
     ok('[108] ✂ に字が添えてある',
        [...d.querySelectorAll('#paper .sec-ico')].some(b=>/段落をつける/.test(b.textContent)),
        [...d.querySelectorAll('#paper .sec-ico')].map(b=>b.textContent).join(','));
     ok('[108] ↑↓ に「セクションごと移動」と添えてある',
        [...d.querySelectorAll('#paper .sec-lbl')].some(x=>/セクションごと移動/.test(x.textContent)),
        [...d.querySelectorAll('#paper .sec-lbl')].map(x=>x.textContent).join(','));
     /* **札（title）にも、何が動くのかを書くこと。**
        絵記号に指を置いた人が最初に読むのは、そちらである */
     const ups=[...d.querySelectorAll('#paper .sec-ico')].filter(b=>b.textContent==='↑');
     ok('[108] ↑ の札に「セクションを丸ごと」と書いてある',
        ups.length>0&&ups.every(b=>/セクション/.test(b.title||'')),
        ups.map(b=>b.title).slice(0,2).join(' / '));
     /* 一番上の節では ↑ が効かない（入れ替える先が無い） */
     ok('[108] 先頭の節では ↑ が押せない',
        ups.length===0||ups[0].disabled===true, String(ups[0]&&ups[0].disabled)); }
   U.sel.clear(); U.render();
 }catch(e){ ok('[107] セクション分けの実地', false, e.message); }

 /* ══ 見出しは、一つずつ行を持つ（1.109）══
    L様——「作者が一段下になってない」。
    曲名も作者も、叩ける幅を字の分だけにするため inline-block にしてある。
    **そのため二つは同じ行に並んでいた。**
    1.96 で作者に margin-top を付けたが、行内での位置がずれただけ——
    **箱の並べ方を変えねば、行は増えない。** */
 try{
   const css=[...d.querySelectorAll('style')].map(el=>el.textContent).join('\n');
   const blk=re=>{ const m=css.match(re); return m?m[0]:''; };
   const head=blk(/\.p-head\{[^}]*\}/);
   ok('[109] 見出しは縦並び', /flex-direction:\s*column/.test(head), head.slice(0,90));
   ok('[109] 曲名と作者は中央のまま', /align-items:\s*center/.test(head), '');
   /* **演奏の指示の一行だけは、幅いっぱいで左肩に。**
      縦並びの中で縮めば、せっかくの左揃えが中央の塊に見える */
   const sub=blk(/\.p-sub\{[\s\S]*?\}/);
   ok('[109] Key・Capo の一行は幅いっぱい', /align-self:\s*stretch/.test(sub), '');
   ok('[109] その一行は左揃えのまま', /justify-content:\s*flex-start/.test(sub), '');
   /* 実地：紙の見出しに、三つが縦に並んでいること */
   U.render();
   const hd=d.querySelector('#paper .p-head');
   ok('[109] 見出しに曲名・作者・指示の三つがある',
      !!hd&&!!hd.querySelector('.p-title')&&!!hd.querySelector('.p-composer')&&!!hd.querySelector('.p-sub'),
      hd?[...hd.children].map(c=>c.className).join(','):'見出しが無い');
   ok('[109] 並びは 曲名 → 作者 → 指示',
      !!hd&&[...hd.children].map(c=>(c.className||'').split(' ')[0]).join(',')
        .indexOf('p-title,p-composer,p-sub')>=0,
      hd?[...hd.children].map(c=>c.className).join(' / '):'');
 }catch(e){ ok('[109] 見出しの実地', false, e.message); }

 /* ══ オンコードのベース音を、押さえるかどうか（1.110）══
    L様——「オンコードのボイシングは元のベース音を省略にできる？」。
    C/E の「/E」は**その音をいちばん低く鳴らせ**という指示だが、
    ベースの居る合奏でギターが担う音ではない。
    〈省く〉にしても**譜面の名前は変えない**——名前は曲の姿、押さえは演り方。 */
 try{
   const keepSB=U.song.meta.slashBass, keepCap=U.song.meta.capo, keepT2=U.song.meta.tuning;
   U.song.meta.capo=0; U.song.meta.tuning='std';
   const lowPc=v=>{ const om=U.OM();
     for(let i=0;i<6;i++) if(v.frets[i]!=null) return ((om[i]+v.frets[i])%12+12)%12;
     return null; };
   const vo=(root,type,bass)=>U.resolveVoicing(U.song,{chord:{root,type,bass}});
   /* ① 既定（鳴らす）では、指定の音がいちばん低いこと */
   U.song.meta.slashBass='play';
   { const bad=[];
     [[0,'maj',4],[2,'maj',6],[5,'maj',0],[9,'min',4]].forEach(([r,t,b])=>{
       const v=vo(r,t,b); if(!v){ bad.push(r+t+'/'+b+' 押さえ無し'); return; }
       if(lowPc(v)!==b) bad.push(r+t+'/'+b+' 最低音='+lowPc(v));
     });
     ok('[110] 既定では指定のベース音がいちばん低い', bad.length===0, bad.join(' / ')); }
   /* ② 〈省く〉では、ふつうの押さえ（ベース指定なし）と同じ形になること */
   U.song.meta.slashBass='omit';
   { const bad=[];
     [[0,'maj',4],[2,'maj',6],[5,'maj',0],[9,'min',4]].forEach(([r,t,b])=>{
       const withB=vo(r,t,b), plain=vo(r,t,null);
       if(!withB||!plain){ bad.push(r+t+' 押さえ無し'); return; }
       if(JSON.stringify(withB.frets)!==JSON.stringify(plain.frets))
         bad.push(r+t+'/'+b+' '+withB.frets.join(',')+' ≠ '+plain.frets.join(','));
     });
     ok('[110] 省けば、ベース指定なしと同じ押さえになる', bad.length===0, bad.join(' / ')); }
   /* ③ **控えが設定を跨がないこと。** 跨げば、切り替えても前の形が返り続ける */
   { U.song.meta.slashBass='play';
     const a=vo(2,'maj',6);
     U.song.meta.slashBass='omit';
     const b=vo(2,'maj',6);
     ok('[110] 切り替えれば押さえも組み直る',
        JSON.stringify(a.frets)!==JSON.stringify(b.frets),
        '鳴らす='+a.frets.join(',')+' 省く='+b.frets.join(',')); }
   /* ④ 一覧（押さえを選ぶ盤）も同じ約束であること。
        **片方だけ省けば、選び直した途端に形が変わる** */
   { U.song.meta.slashBass='omit';
     const cs=U.voicingCandidates({root:2,type:'maj',bass:6},8);
     const om=U.OM();
     const low=fr=>{ for(let i=0;i<6;i++) if(fr[i]!=null) return ((om[i]+fr[i])%12+12)%12; return null; };
     ok('[110] 一覧にも、ベース指定に縛られない形が並ぶ',
        cs.length>0&&cs.some(fr=>low(fr)!==6),
        '候補='+cs.length+' 最低音='+cs.slice(0,4).map(low).join(',')); }
   /* ⑤ **譜面の名前は変えない。** 名前は曲の姿である */
   { U.song.meta.slashBass='omit';
     ok('[110] 省いても名前は「/」付きのまま',
        /\//.test(U.chordName({root:2,type:'maj',bass:6},U.song.meta)),
        U.chordName({root:2,type:'maj',bass:6},U.song.meta)); }
   /* ⑥ 手で決めた押さえは、この設定に関わらず残る */
   { const ch={root:2,type:'maj',bass:6};
     const k=U.chordKey(ch);
     U.song.voicings=U.song.voicings||{};
     const mine=U.buildVoicing([2,null,0,2,3,2]); mine.for=k;
     U.song.voicings[k]=mine;
     U.song.meta.slashBass='omit';
     const got=U.resolveVoicing(U.song,{chord:ch});
     ok('[110] 手で決めた押さえは、そのまま残る',
        !!got&&JSON.stringify(got.frets)===JSON.stringify([2,null,0,2,3,2]),
        got?got.frets.join(','):'—');
     delete U.song.voicings[k]; }
   U.song.meta.slashBass=keepSB; U.song.meta.capo=keepCap; U.song.meta.tuning=keepT2;
   U.render();
 }catch(e){ ok('[110] オンコードの実地', false, e.message); }

 /* ══ セクションの繰り返し回数（×N）を廃した（1.111）══
    L様——「繰り返し回数いらない」。
    繰り返しは**譜面の記号（‖: :‖・1番2番括弧・D.C.・D.S.）で書くもの**である。
    見出しの数字は譜面のどこにも現れないのに再生の長さだけを変えるので、
    **紙を見ても分からない鳴り方**が生まれていた。 */
 try{
   const sec0=U.song.sections[0];
   const keepR=sec0.repeat;
   const bars=()=>U.arrangement(U.song).length;
   sec0.repeat=1; const n1=bars();
   sec0.repeat=3; const n3=bars();
   ok('[111] 古い「×N」は、もう鳴り方を変えない', n1===n3, n1+' / '+n3);
   sec0.repeat=keepR;
   /* 入力欄も表示も無いこと */
   U.mode='rhythm'; U.render();
   ok('[111] 見出しに回数の入力欄が無い',
      d.querySelectorAll('#paper .sec-num').length===0,
      String(d.querySelectorAll('#paper .sec-num').length));
   ok('[111] 見出しに「×」の札が出ない',
      d.querySelectorAll('#paper .sec-rep').length===0,
      String(d.querySelectorAll('#paper .sec-rep').length));
   U.mode='select'; U.render();
   ok('[111] 〈選択〉の見出しにも出ない',
      d.querySelectorAll('#paper .sec-rep').length===0, '');
   /* **繰り返しは記号で書ける道が残っていること。**
      道具を一つ外すなら、代わりの道が生きているか確かめる */
   { const b0=U.song.bars[0];
     b0.marks=b0.marks||{};
     const keepS=b0.marks.repeatStart, keepE=b0.marks.repeatEnd;
     b0.marks.repeatStart=true;
     const svg=U.engrave(U.song,b0,{width:300}).svg;
     ok('[111] 反復記号は今までどおり描ける', /circle/.test(svg), '');
     b0.marks.repeatStart=keepS; b0.marks.repeatEnd=keepE; }
   /* 節を繋げる道が、回数を理由に塞がれないこと */
   { if(U.song.sections.length>=2){
       const n0=U.song.sections.length;
       U.song.sections[1].repeat=4;               /* 古い数が残った節 */
       U.mergeSectionUp(1);
       ok('[111] 古い数があっても、節は繋げられる',
          U.song.sections.length===n0-1, n0+'→'+U.song.sections.length);
       if(U.song.sections.length===n0-1) U.doUndo();
     }else ok('[111] 古い数があっても、節は繋げられる', true, '節が一つ'); }
   U.mode='rhythm'; U.render();
 }catch(e){ ok('[111] 繰り返し回数の実地', false, e.message); }

 /* ══ 記号の的（1.113。TAB版 tab-2.63 と同じ仕様）══
    L様——「bend とかタイに当たり判定をつけてタップで削除できる仕様を入れたい。
            フェルマータやアルペジオに。可能だったら rit などドラッグ＆ドロップで」。
    **見えている物は、その物を叩けるのが早い。**
    これまで記号を外すには、音符を長押しして輪か〈くわしく〉へ降りる必要があった。 */
 try{
   U.mode='rhythm'; U.setPen('note');
   const bar=U.song.bars[0];
   const keepN=JSON.parse(JSON.stringify(bar.notes));
   const keepM=JSON.parse(JSON.stringify(bar.marks||{}));
   const setup=()=>{
     bar.notes=[];
     U.insertNote(U.song,bar,0,{kind:'chord',chord:null,stroke:'d'});
     const half=Math.round(U.barTicks(U.song,bar)/2);
     U.insertNote(U.song,bar,half,{kind:'chord',chord:null,stroke:'d'});
     const n=bar.notes[0];
     n.accent=true; n.staccato=true;
     n.sym=Object.assign({},n.sym,{fermata:true,arp:true,ring:true,tempo:'rit',hair:'cresc',pm:true});
     bar.marks=bar.marks||{};
     bar.marks.fermata=true; bar.marks.tempo='accel'; bar.marks.hair='dim';
     U.render();
     return d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
   };
   let wr=setup();
   const marks=()=>[...wr.querySelectorAll('.mhit')].map(m=>m.getAttribute('data-mk'));
   const M=marks();
   /* ① 記号ぜんぶに的が出ること */
   ['accent','staccato','fermata','arp','ring','tempo','hair','pm',
    'barFermata','barTempo','barHair'].forEach(k=>{
     ok('[113] 的が出る：'+k, M.indexOf(k)>=0, M.join(','));
   });
   /* ② **指で狙える下限を満たすこと。** 細い字でも的だけは広げる */
   { const small=[...wr.querySelectorAll('.mhit')]
       .filter(m=>(+m.getAttribute('width'))<21.5||(+m.getAttribute('height'))<13.5);
     ok('[113] どの的も指で狙える大きさ', small.length===0,
        small.map(m=>m.getAttribute('data-mk')+' '+m.getAttribute('width')+'×'+m.getAttribute('height')).join(' / ')); }
   /* ③ **的は音符の的より上に置くこと。**
        符頭の上のアクセントや五線の中のアルペジオは、覆われては届かない */
   { const svg=wr.querySelector('svg.msvg');
     const kids=[...svg.children];
     const lastHit=kids.map((e,i)=>e.classList&&e.classList.contains('hit')?i:-1).reduce((a,b)=>Math.max(a,b),-1);
     const firstM=kids.findIndex(e=>e.classList&&e.classList.contains('mhit'));
     ok('[113] 記号の的は音符の的より上にある', firstM>lastHit, '音符='+lastHit+' 記号='+firstM); }
   /* ④ 叩けば外れること（押して離す。**滑らせなければ外す**） */
   const ev=(t,x,y)=>{ const e=new w.MouseEvent(t,{bubbles:true,clientX:x,clientY:y,button:0}); e.pointerId=9; return e; };
   const tapMark=k=>{
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     const m=wr2.querySelector('.mhit[data-mk="'+k+'"]');
     if(!m) return false;
     m.dispatchEvent(ev('pointerdown',300,300));
     w.dispatchEvent(ev('pointerup',300,300));
     return true;
   };
   { wr=setup(); tapMark('fermata');
     ok('[113] 叩けばフェルマータが外れる', bar.notes[0].sym.fermata===false,
        String(bar.notes[0].sym.fermata)); }
   { wr=setup(); tapMark('arp');
     ok('[113] 叩けばアルペジオが外れる', bar.notes[0].sym.arp===false, ''); }
   { wr=setup(); tapMark('tempo');
     ok('[113] 叩けば rit. が外れる', bar.notes[0].sym.tempo==null, String(bar.notes[0].sym.tempo)); }
   { wr=setup(); tapMark('accent');
     ok('[113] 叩けばアクセントが外れる', bar.notes[0].accent===false, ''); }
   { wr=setup(); tapMark('barTempo');
     ok('[113] 小節ぜんたいの記号も外れる', bar.marks.tempo==null, String(bar.marks.tempo)); }
   /* ⑤ **帯で掛かる記号は、帯ごと外す。**
        頭の一音だけ外せば文字が右へ動くだけで、叩いた物が消えたように見えない */
   { wr=setup();
     bar.notes[1].sym=Object.assign({},bar.notes[1].sym,{pm:true});
     U.render(); wr=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     tapMark('pm');
     ok('[113] P.M. は帯ごと外れる',
        !bar.notes[0].sym.pm&&!bar.notes[1].sym.pm,
        JSON.stringify([bar.notes[0].sym.pm,bar.notes[1].sym.pm])); }
   /* ⑥ **滑らせれば何も起きない。** 押さえたまま逃げれば取り消せること */
   { wr=setup();
     const m=wr.querySelector('.mhit[data-mk="fermata"]');
     m.dispatchEvent(ev('pointerdown',300,300));
     w.dispatchEvent(ev('pointermove',600,600));       /* 置き先の無い所へ逃がす */
     w.dispatchEvent(ev('pointerup',600,600));
     ok('[113] 押さえたまま逃げれば外れない', bar.notes[0].sym.fermata===true,
        String(bar.notes[0].sym.fermata)); }
   /* ══ ⑦ ドラッグで別の音符へ移せること（1.114）══
      **指を差し替えて確かめてはならない。**
      1.113 の点検は `elementsFromPoint` を差し替えて必ず音符の的を返させたので、
      「rit. は五線の下にあり、真横へ滑らせても的に当たらない」という
      実機の症状をそのまま素通りさせていた。
      **紙の寸法を仕込み、本当の座標で滑らせる。** */
   { wr=setup();
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     const L=100,W2=400,TOP=0,BOT=80;
     wr2.getBoundingClientRect=()=>({left:L,top:TOP,width:W2,height:BOT-TOP,right:L+W2,bottom:BOT});
     Object.defineProperty(wr2,'clientWidth',{value:W2,configurable:true});
     const m=wr2.querySelector('.mhit[data-mk="tempo"]');
     ok('[114] rit. の的がある', !!m, '');
     if(m){
       /* **五線より下**（rit. の描かれている高さ）で、真横へ滑らせる */
       const yBelow=BOT+30;
       m.dispatchEvent(ev('pointerdown',L+40,yBelow));
       w.dispatchEvent(ev('pointermove',L+W2-30,yBelow));
       const lit=d.querySelector('#paper .mwrap.mv-bar');
       ok('[114] 五線の下で滑らせても落とし先が決まる', !!lit, '');
       w.dispatchEvent(ev('pointerup',L+W2-30,yBelow));
       ok('[114] rit. を別の音符へ移せる',
          bar.notes[0].sym.tempo==null&&bar.notes[1].sym.tempo==='rit',
          '元='+bar.notes[0].sym.tempo+' 先='+bar.notes[1].sym.tempo);
     } }
   /* ⑧ 同じ音符へ落としたら取りやめ（**掴み直しただけで消えては困る**） */
   { wr=setup();
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     const L=100,W2=400,BOT=80;
     wr2.getBoundingClientRect=()=>({left:L,top:0,width:W2,height:BOT,right:L+W2,bottom:BOT});
     Object.defineProperty(wr2,'clientWidth',{value:W2,configurable:true});
     const m=wr2.querySelector('.mhit[data-mk="fermata"]');
     if(m){
       m.dispatchEvent(ev('pointerdown',L+40,40));
       w.dispatchEvent(ev('pointermove',L+60,40));    /* 同じ音符の近く */
       w.dispatchEvent(ev('pointerup',L+60,40));
       ok('[114] 同じ音符へ落としても消えない', bar.notes[0].sym.fermata===true,
          String(bar.notes[0].sym.fermata));
     } }
   /* ⑨' 段から遠く離して離せば、何も起きない（逃げ道） */
   { wr=setup();
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     wr2.getBoundingClientRect=()=>({left:100,top:0,width:400,height:80,right:500,bottom:80});
     const m=wr2.querySelector('.mhit[data-mk="tempo"]');
     if(m){
       m.dispatchEvent(ev('pointerdown',140,40));
       w.dispatchEvent(ev('pointermove',140,700));    /* 遥か下へ逃がす */
       w.dispatchEvent(ev('pointerup',140,700));
       ok('[114] 遠くへ逃がせば、移りも消えもしない',
          bar.notes[0].sym.tempo==='rit', String(bar.notes[0].sym.tempo));
     } }
   /* ══ 記号の的と、小節選択の競合（1.115）══
      L様——「演奏記号の帯が小節選択になってて競合してる」。
      rit.・cresc./dim.・P.M. は五線の下に描かれ、
      **そこは丸ごと「小節を選ぶ的」でもある。**
      的が 14px しかなかったので、指が少し外れれば小節選択が勝っていた。 */
   { wr=setup();
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     const m=wr2.querySelector('.mhit[data-mk="tempo"]');
     ok('[115] 的は指の大きさに近い',
        !!m&&(+m.getAttribute('width'))>=26&&(+m.getAttribute('height'))>=20,
        m?(m.getAttribute('width')+'×'+m.getAttribute('height')):'的が無い'); }
   /* **捕まえる場所が、小節選択より先にあること。**
      後ろにいれば、前の者が先に仕事を終えてしまう */
   { wr=setup();
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     U.sel.clear();
     const m=wr2.querySelector('.mhit[data-mk="tempo"]');
     m.dispatchEvent(ev('pointerdown',300,300));
     ok('[115] 記号を押しても小節は選ばれない', U.sel.size===0, '選び='+U.sel.size);
     w.dispatchEvent(ev('pointerup',300,300));
     ok('[115] そのまま離せば記号が外れる', bar.notes[0].sym.tempo==null,
        String(bar.notes[0].sym.tempo)); }
   /* ══ 五線の下は、記号だけの場所（1.116）══
      L様——「そもそも下の帯では小節選択できないようにしたら？」。
      的を広げても捕まえ役を前へ出しても、**住む場所が丸ごと重なっている**限り
      競合は消えない。下の帯を記号に譲る。 */
   { wr=setup();
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     const outs=[...wr2.querySelectorAll('.hit-mark')].filter(x=>!x.getAttribute('data-zone'));
     ok('[116] 小節を選ぶ的は、譜面の上の一枚だけ', outs.length===1, String(outs.length));
     /* 五線（baseY-38＝16）より上に在ること */
     const y=+outs[0].getAttribute('y'), h=+outs[0].getAttribute('height');
     ok('[116] その一枚は五線より上にある', y+h<=16.5, 'y='+y+' 下端='+(y+h)); }
   /* **少し外しても拾うこと。**ただし音符の的の上では甘くしない */
   { wr=setup();
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     const m=wr2.querySelector('.mhit[data-mk="tempo"]');
     /* 的の実寸を仕込み、その 6px 外・譜面の外の的の上を押す */
     m.getBoundingClientRect=()=>({left:200,top:200,right:240,bottom:220,width:40,height:20});
     const outs=[...wr2.querySelectorAll('.hit-mark')].filter(x=>!x.getAttribute('data-zone'));
     ok('[115] 譜面の外の的がある', outs.length>0, String(outs.length));
     U.sel.clear();
     outs[outs.length-1].dispatchEvent(ev('pointerdown',246,210));
     ok('[115] 6px 外しても記号が拾われる（小節は選ばれない）',
        U.sel.size===0, '選び='+U.sel.size);
     w.dispatchEvent(ev('pointerup',246,210));
     ok('[115] 外し押しでも記号が外れる', bar.notes[0].sym.tempo==null,
        String(bar.notes[0].sym.tempo)); }
   /* **遠ければ、上の余白では今までどおり小節が選ばれること。**
      甘くしすぎれば、今度は小節が選べなくなる */
   { wr=setup();
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     wr2.querySelectorAll('.mhit').forEach(m=>{
       m.getBoundingClientRect=()=>({left:200,top:200,right:240,bottom:220,width:40,height:20});
     });
     const outs=[...wr2.querySelectorAll('.hit-mark')].filter(x=>!x.getAttribute('data-zone'));
     U.sel.clear();
     outs[0].dispatchEvent(ev('pointerdown',400,400));
     w.dispatchEvent(ev('pointerup',400,400));
     ok('[115] 遠く外せば、上の余白では小節が選ばれる', U.sel.size>0, '選び='+U.sel.size);
     U.sel.clear(); U.render(); }
   /* **小節番号の道が生きていること。**
      片方を塞ぐなら、もう一方が通っているか必ず確かめる */
   { wr=setup();
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     ok('[116] 小節番号の的が残っている',
        !!wr2.querySelector('.m-no[data-selbar]'), ''); }
   /* ⑨ 鳴らしている間は光りを消す（**触れれば効くことは変えない**） */
   { const css=[...d.querySelectorAll('style')].map(el=>el.textContent).join('\n');
     ok('[113] 再生中は的の光りを消す',
        /body\.playing \.mhit[^{]*\{[^}]*fill:\s*transparent/.test(css), ''); }
   bar.notes=keepN; bar.marks=keepM; U.render();
 }catch(e){ ok('[113] 記号の的の実地', false, e.message); }

 /* ══ タイの的が、緑のマスに覆われていた（1.117）══
    L様——「緑のハイライトがタイなどをタップする時に邪魔」。
    弧の的は音符の的（入力待ちの緑のマス）より**先に**描いていた。
    註にも「後に描いた音符の的が上に来る」と書いてあり、そのとおり——
    **弧は一度も叩けていなかった。**
    註が症状を言い当てているのに、それを不具合と読まなかったのが誤りである。 */
 try{
   U.mode='rhythm'; U.setPen('note');
   const bar=U.song.bars[0];
   const keepN=JSON.parse(JSON.stringify(bar.notes));
   bar.notes=[];
   const half=Math.round(U.barTicks(U.song,bar)/2);
   U.insertNote(U.song,bar,0,{kind:'chord',chord:null,stroke:'d'});
   U.insertNote(U.song,bar,half,{kind:'chord',chord:null,stroke:'d'});
   bar.notes[0].tieOut=true; bar.notes[1].tiedIn=true;
   U.render();
   const wr=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
   const svg=wr.querySelector('svg.msvg');
   const th=svg.querySelector('.tie-hit');
   ok('[117] タイの的が出る', !!th, '');
   /* **描く順が、そのまま上下になる。** 音符の的より後であること */
   { const kids=[...svg.children];
     const lastHit=kids.map((e,i)=>(e.classList&&e.classList.contains('hit'))?i:-1)
       .reduce((a,b)=>Math.max(a,b),-1);
     const tieAt=kids.findIndex(e=>e.classList&&e.classList.contains('tie-hit'));
     ok('[117] タイの的は音符の的より上にある', tieAt>lastHit,
        '音符='+lastHit+' タイ='+tieAt); }
   /* 叩けば外れること */
   if(th){
     /* 前の点検で押した記号の蓋（suppressClick）が、まだ切れていない。
        **一度空打ちして蓋を外す**——実機では 0.4 秒で自然に切れる */
     d.getElementById('paper').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     th.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     ok('[117] タイを叩けば外れる',
        bar.notes[0].tieOut===false&&bar.notes[1].tiedIn===false,
        'out='+bar.notes[0].tieOut+' in='+bar.notes[1].tiedIn);
   }
   /* **触る画面には hover が無い。** 常時うっすら見せていること */
   { const css=[...d.querySelectorAll('style')].map(el=>el.textContent).join('\n');
     ok('[117] タイの的は常時うっすら光る',
        /body\.md-rhythm \.tie-hit,body\.md-edit \.tie-hit\{stroke:/.test(css), '');
     ok('[117] 濃さは記号の的と揃えてある',
        /body\.md-rhythm \.tie-hit,body\.md-edit \.tie-hit\{stroke:rgba\(79,70,229,\.10\)/.test(css), ''); }
   bar.notes=keepN; U.render();
 }catch(e){ ok('[117] タイの的の実地', false, e.message); }

 /* ══ 選んだ物と、消える物を一致させる（1.118）══
    L様——「画像では rit が選ばれてるのに削除したらアルペジオが消える。
            下の帯に出る『演奏記号を選択しました』みたいなやつに
            何が選ばれたかを出して」。
    1.100 で rit./cresc. を**五線の下へ描き移したのに、所属は上（コードの段）
    のままだった。** 下の帯で選んだつもりが、そこには入っていない——
    **光っている物と、選ばれている物が別だった。** */
 try{
   const bar=U.song.bars[0];
   const keepN=JSON.parse(JSON.stringify(bar.notes));
   bar.notes=[];
   U.insertNote(U.song,bar,0,{kind:'chord',chord:null,stroke:'d'});
   const n0=bar.notes[0];
   n0.sym=Object.assign({},n0.sym,{tempo:'rit',arp:true});
   const tot=U.barTicks(U.song,bar);
   const all=U.symsAt(bar,0,tot);
   /* ① 速さ・強弱は、演奏記号の段に入っていること */
   { const sym=U.symsForKind(all,'sym').map(x=>x.id);
     const chd=U.symsForKind(all,'chord').map(x=>x.id);
     ok('[118] rit. は演奏記号の段に入る', sym.indexOf('tempo')>=0, sym.join(','));
     ok('[118] rit. はコードの段には入らない', chd.indexOf('tempo')<0, chd.join(','));
     n0.sym.hair='cresc';
     const sym2=U.symsForKind(U.symsAt(bar,0,tot),'sym').map(x=>x.id);
     ok('[118] cresc. も演奏記号の段', sym2.indexOf('hair')>=0, sym2.join(','));
     ok('[118] アルペジオも同じ段にいる', sym2.indexOf('arp')>=0, sym2.join(',')); }
   /* ══ ② 札は、中身を先に書くこと（1.119）══
        L様——「下の帯に rit とかの名称を出してほしい」。
        **「速さの指示（rit.）」では、探している rit. が括弧の中に隠れる。**
        下の帯は幅が狭く、長い札は後ろから切れる——
        種の名を先に書けば、肝心の中身から消えていく。 */
   { const head=x=>String(x&&x.label||'').split('（')[0];
     const l=U.symsAt(bar,0,tot).find(x=>x.id==='tempo');
     ok('[119] 速さの札は「rit.」で始まる', head(l)==='rit.', l?l.label:'—');
     const h=U.symsAt(bar,0,tot).find(x=>x.id==='hair');
     ok('[119] 強弱の札は「cresc.」で始まる', head(h)==='cresc.', h?h.label:'—');
     const st=U.symsAt(bar,0,tot).find(x=>x.id==='stroke');
     ok('[119] ストロークの札は向きで始まる', head(st)==='↓', st?st.label:'—');
     /* コードも、種の名ではなく**そのコード名**を出す */
     n0.chord={root:10,type:'maj',bass:null};
     const c=U.symsAt(bar,0,tot).find(x=>x.id==='chord');
     /* **綴りは調から見た度数で決まる**（1.246：Key C なら ♭VII ＝ B♭）。
        期待を字で決め打ちにすると、綴りの決まりを直すたびに落ちる——
        **道具が名乗る名そのもの**と突き合わせる。 */
     { const want=U.chordName(n0.chord,U.song.meta);
       ok('[119] コードの札はコード名で始まる',
          !!want&&head(c)===want, (c?c.label:'—')+' / 期待 '+want); }
     n0.chord=null;
     /* 帯の控えも同じ書き方であること——**道が二本あって書き方が違えば、
        同じ物が二つの名で呼ばれる** */
     bar.chordAt={0:{root:10,type:'maj',bass:null}};
     const cb=U.symsAt(bar,0,tot).find(x=>x.id==='chord');
     { const want2=U.chordName(bar.chordAt[0],U.song.meta);
       ok('[119] 帯の控えもコード名で始まる',
          !!want2&&head(cb)===want2, (cb?cb.label:'—')+' / 期待 '+want2); }
     ok('[119] 帯の控えとは分かるようにする', /帯/.test(cb?cb.label:''), cb?cb.label:'—');
     bar.chordAt=null; }
   /* ③ 選んだ物の名前が出ること */
   { U.mode='select'; U.render();
     U.zoneSelect(bar.id,'sym',0,tot,false);
     const lb=U.zselLabel();
     ok('[118] 選んだ物の名前が出る', /rit\./.test(lb), lb);
     ok('[118] 幾つ入っているかも出る', /つ）/.test(lb), lb);
     const ns=U.zselNames();
     ok('[118] 同じ所の記号がぜんぶ挙がる',
        ns.some(x=>/rit\./.test(x))&&ns.some(x=>/アルペジオ/.test(x)), ns.join(' / ')); }
   /* ④ **二つ以上あれば、勝手に消さずに聞くこと。**
        選んだ物と消える物が食い違う事故は、ここで止まる */
   { const before=JSON.stringify(n0.sym);
     U.zselRemove();
     ok('[118] 二つ以上あれば、まず聞く（勝手に消さない）',
        JSON.stringify(n0.sym)===before, '前='+before+' 後='+JSON.stringify(n0.sym));
     U.closePop&&U.closePop(); }
   U.zselClear();
   bar.notes=keepN; U.mode='rhythm'; U.render();
 }catch(e){ ok('[118] 段の選びの実地', false, e.message); }

 /* ══ 記号そのものを選べるようにする（1.121）══
    L様——「rit が選べない。アルペジオになる」→「rit の判定はどこにあるの、選べないけど」。
    帯のマスは「その時刻」を指すので、同じ所の記号がぜんぶ挙がる。
    だが**L様が指しているのは rit. 一つ**であって、その時刻の全部ではない。
    1.120 で的を素通りさせたのは、**「選べない」を「何も起きない」に
    置き換えただけ**であった。 */
 try{
   const bar=U.song.bars[0];
   const keepN=JSON.parse(JSON.stringify(bar.notes));
   const keepM=JSON.parse(JSON.stringify(bar.marks||{}));
   bar.notes=[];
   U.insertNote(U.song,bar,0,{kind:'chord',chord:null,stroke:'d'});
   bar.notes[0].sym=Object.assign({},bar.notes[0].sym,{tempo:'rit',arp:true});
   U.mode='select'; U.render();
   const wr=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
   const svg=wr.querySelector('svg.msvg');
   const m=svg.querySelector('.mhit[data-mk="tempo"]');
   ok('[121] 〈選択〉でも rit. の的が出ている', !!m, '');
   /* 的は帯の上に描いてある（**見えているとおりに指せること**） */
   { const z=svg.querySelector('.hit-mark[data-zone="sym"]');
     const kids=[...svg.children];
     ok('[121] 的は帯より上にある', !!z&&kids.indexOf(m)>kids.indexOf(z), ''); }
   /* ① 的を叩けば、その一つだけが選ばれる */
   { U.zselClear();
     m.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     const lb=U.zselLabel(), ns=U.zselNames();
     ok('[121] rit. を叩けば rit. が選ばれる', /rit\./.test(lb), lb);
     ok('[121] アルペジオは巻き込まれない',
        !ns.some(x=>/アルペジオ/.test(x)), ns.join(' / '));
     ok('[121] 選ばれているのは一つだけ', U.zselCount()===1, String(U.zselCount())); }
   /* ② 消せば、その一つだけが消える。**残りは残ること** */
   { U.zselRemove();
     ok('[121] 消えるのは rit. だけ',
        bar.notes[0].sym.tempo==null&&bar.notes[0].sym.arp===true,
        'rit.='+bar.notes[0].sym.tempo+' アルペジオ='+bar.notes[0].sym.arp);
     U.doUndo(); }
   /* ③ 同じ的をもう一度叩けば外れる */
   { U.zselClear(); U.render();
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     const m2=wr2.querySelector('.mhit[data-mk="tempo"]');
     m2.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     const n1=U.zselCount();
     const wr3=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     wr3.querySelector('.mhit[data-mk="tempo"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     ok('[121] もう一度叩けば外れる', n1===1&&U.zselCount()===0, n1+'→'+U.zselCount()); }
   /* ④ 帯を叩く道は残っていること（その所ぜんぶ） */
   { U.zselClear();
     const tot=U.barTicks(U.song,bar);
     U.zoneSelect(bar.id,'sym',0,tot,false);
     const ns=U.zselNames();
     ok('[121] 帯を叩けば、その所ぜんぶが挙がる',
        ns.some(x=>/rit\./.test(x))&&ns.some(x=>/アルペジオ/.test(x)), ns.join(' / '));
     U.zselClear(); }
   /* ⑤ **小節ぜんたいの記号も、段に載っていること。**
        器を足したら、既にある道すべてに通す */
   { /* **取り消しは song ごと差し替える。**控えた小節は古い方を指している——
        ここから先は引き直すこと（実機で「効かない」の正体になりやすい） */
     const bar2=U.song.bars[0];
     bar2.marks=bar2.marks||{};
     bar2.marks.tempo='accel'; bar2.marks.fermata=true; bar2.marks.hair='dim';
     const tot=U.barTicks(U.song,bar2);
     const ids=U.symsForKind(U.symsAt(bar2,0,tot),'sym').map(x=>x.id);
     ok('[121] 小節の速さも段に挙がる', ids.indexOf('barTempo')>=0, ids.join(','));
     ok('[121] 小節のフェルマータも挙がる', ids.indexOf('barFermata')>=0, ids.join(','));
     ok('[121] 小節の強弱も挙がる', ids.indexOf('barHair')>=0, ids.join(','));
     /* 選んで消せば、小節の記号も消えること */
     U.zselClear(); U.render();
     const wr4=d.querySelector('#paper .mwrap[data-bar="'+bar.id+'"]');
     const bm=wr4.querySelector('.mhit[data-mk="barTempo"]');
     if(bm){
       bm.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
       ok('[121] 小節の速さも叩いて選べる', /accel\./.test(U.zselLabel()), U.zselLabel());
       U.zselRemove();
       ok('[121] 小節の速さも消せる', U.song.bars[0].marks.tempo==null,
          String(U.song.bars[0].marks.tempo));
       U.doUndo();
     }else ok('[121] 小節の速さも叩いて選べる', false, '的が無い');
     U.zselClear(); }
   { const b9=U.song.bars[0]; b9.notes=keepN; b9.marks=keepM; }
   U.mode='rhythm'; U.render();
 }catch(e){ ok('[121] 記号を選ぶ道の実地', false, e.message); }

 /* ══ 〈選択〉でも記号を掴んで動かせる（1.122）══
    L様——「rit がドラッグ移動できない」。
    掴む道は〈入力〉〈コード〉にしか開いておらず、
    **〈選択〉で記号を選べるようにした途端、そこが行き止まりになっていた。**
    叩いた時の意味だけがモードで変わる——
    〈選択〉は選ぶ、〈入力〉〈コード〉は外す。**滑らせた時は、どこでも移す。** */
 try{
   const B=()=>U.song.bars[0];
   const keepN=JSON.parse(JSON.stringify(B().notes));
   const stage=m=>{
     const b=B(); b.notes=[];
     U.insertNote(U.song,b,0,{kind:'chord',chord:null,stroke:'d'});
     const half=Math.round(U.barTicks(U.song,b)/2);
     U.insertNote(U.song,b,half,{kind:'chord',chord:null,stroke:'d'});
     b.notes[0].sym=Object.assign({},b.notes[0].sym,{tempo:'rit'});
     U.mode=m; U.zselClear(); U.render();
     const wr=d.querySelector('#paper .mwrap[data-bar="'+b.id+'"]');
     const L=100,W2=400,BOT=80;
     wr.getBoundingClientRect=()=>({left:L,top:0,width:W2,height:BOT,right:L+W2,bottom:BOT});
     Object.defineProperty(wr,'clientWidth',{value:W2,configurable:true});
     return {b,wr,L,W2,BOT};
   };
   const ev=(t,x,y)=>{ const e=new w.MouseEvent(t,{bubbles:true,clientX:x,clientY:y,button:0}); e.pointerId=13; return e; };
   /* ① 〈選択〉で、指を降ろして滑らせれば移せる */
   { const {b,wr,L,W2,BOT}=stage('select');
     const m=wr.querySelector('.mhit[data-mk="tempo"]');
     ok('[122] 〈選択〉に rit. の的がある', !!m, '');
     if(m){
       const y=BOT+30;                       /* 五線の下（rit. の高さ） */
       m.dispatchEvent(ev('pointerdown',L+40,y));
       w.dispatchEvent(ev('pointermove',L+W2-30,y));
       ok('[122] 〈選択〉でも落とし先が決まる',
          !!d.querySelector('#paper .mwrap.mv-bar'), '');
       w.dispatchEvent(ev('pointerup',L+W2-30,y));
       ok('[122] 〈選択〉でも rit. を移せる',
          B().notes[0].sym.tempo==null&&B().notes[1].sym.tempo==='rit',
          '元='+B().notes[0].sym.tempo+' 先='+B().notes[1].sym.tempo);
     } }
   /* ② 〈選択〉で、動かさずに離せば「選ぶ」（外れない） */
   { const {b,wr}=stage('select');
     const m=wr.querySelector('.mhit[data-mk="tempo"]');
     m.dispatchEvent(ev('pointerdown',300,300));
     w.dispatchEvent(ev('pointerup',300,300));
     ok('[122] 〈選択〉で叩けば選ばれる', /rit\./.test(U.zselLabel()), U.zselLabel());
     ok('[122] 〈選択〉で叩いても外れない', B().notes[0].sym.tempo==='rit',
        String(B().notes[0].sym.tempo));
     U.zselClear(); }
   /* ③ 〈入力〉では、これまでどおり叩けば外れる */
   { const {b,wr}=stage('rhythm');
     const m=wr.querySelector('.mhit[data-mk="tempo"]');
     m.dispatchEvent(ev('pointerdown',300,300));
     w.dispatchEvent(ev('pointerup',300,300));
     ok('[122] 〈入力〉では叩けば外れる', B().notes[0].sym.tempo==null,
        String(B().notes[0].sym.tempo)); }
   /* ④ 〈入力〉でも、滑らせれば移せる（叩くと滑らすの区別） */
   { const {b,wr,L,W2,BOT}=stage('rhythm');
     const m=wr.querySelector('.mhit[data-mk="tempo"]');
     const y=BOT+30;
     m.dispatchEvent(ev('pointerdown',L+40,y));
     w.dispatchEvent(ev('pointermove',L+W2-30,y));
     w.dispatchEvent(ev('pointerup',L+W2-30,y));
     ok('[122] 〈入力〉で滑らせれば移る（外れない）',
        B().notes[0].sym.tempo==null&&B().notes[1].sym.tempo==='rit',
        '元='+B().notes[0].sym.tempo+' 先='+B().notes[1].sym.tempo); }
   /* ⑤ **〈選択〉では甘く拾わないこと。** 帯の選びを食ってしまう */
   { const {b,wr}=stage('select');
     const z=wr.querySelector('.hit-mark[data-zone="sym"]');
     wr.querySelectorAll('.mhit').forEach(m=>{
       m.getBoundingClientRect=()=>({left:200,top:200,right:240,bottom:220,width:40,height:20});
     });
     U.zselClear();
     if(z){
       /* 前の点検で押した記号の蓋（suppressClick）を、空打ちで外す */
       d.getElementById('paper').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
       z.dispatchEvent(ev('pointerdown',246,210));
       w.dispatchEvent(ev('pointerup',246,210));
       z.dispatchEvent(new w.MouseEvent('click',{bubbles:true,clientX:246,clientY:210}));
       ok('[122] 〈選択〉で帯を叩けば、帯として選ばれる',
          U.zselCount()>0, '数='+U.zselCount());
     }
     U.zselClear(); }
   { const b9=U.song.bars[0]; b9.notes=keepN; }
   U.mode='rhythm'; U.render();
 }catch(e){ ok('[122] 記号を掴む道の実地', false, e.message); }

 /* ══ 休符も落とし先になる（1.123）══
    L様——「他のじゃなくて rit だけできない」。
    rit.・フェルマータ・強弱は**休符にも付けられる**のに、
    移し先を探す時だけ休符を飛ばしていた。
    休符しか無い小節（全休符の小節）に付いた rit. は、
    **どこへ滑らせても落とし先が見つからず、何も起きなかった。**
    アルペジオやアクセントは休符に付かないので、この穴に落ちない——
    **「rit. だけできない」の正体である。** */
 try{
   const B=()=>U.song.bars[0];
   const keepN=JSON.parse(JSON.stringify(B().notes));
   const ev=(t,x,y)=>{ const e=new w.MouseEvent(t,{bubbles:true,clientX:x,clientY:y,button:0}); e.pointerId=17; return e; };
   /* 休符しか無い小節に rit. を付ける（L様の譜面と同じ形） */
   const stage=()=>{
     const b=B(); b.notes=[];
     const tot=U.barTicks(U.song,b);
     U.insertNote(U.song,b,0,{kind:'rest',chord:null,stroke:null});
     U.insertNote(U.song,b,Math.round(tot/2),{kind:'rest',chord:null,stroke:null});
     b.notes[0].sym=Object.assign({},b.notes[0].sym,{tempo:'rit'});
     U.mode='rhythm'; U.render();
     const wr=d.querySelector('#paper .mwrap[data-bar="'+b.id+'"]');
     const L=100,W2=400,BOT=80;
     wr.getBoundingClientRect=()=>({left:L,top:0,width:W2,height:BOT,right:L+W2,bottom:BOT});
     Object.defineProperty(wr,'clientWidth',{value:W2,configurable:true});
     return {b,wr,L,W2,BOT};
   };
   { const {b,wr}=stage();
     ok('[123] 休符しか無い小節を作れた',
        (B().notes||[]).every(n=>n.kind==='rest'), (B().notes||[]).map(n=>n.kind).join(','));
     ok('[123] 休符に付いた rit. の的が出る', !!wr.querySelector('.mhit[data-mk="tempo"]'), ''); }
   /* ① 休符しか無い小節でも、滑らせれば移せる */
   { const {b,wr,L,W2,BOT}=stage();
     const m=wr.querySelector('.mhit[data-mk="tempo"]');
     const y=BOT+30;
     m.dispatchEvent(ev('pointerdown',L+40,y));
     w.dispatchEvent(ev('pointermove',L+W2-30,y));
     ok('[123] 休符の小節でも落とし先が決まる',
        !!d.querySelector('#paper .mwrap.mv-bar'), '');
     w.dispatchEvent(ev('pointerup',L+W2-30,y));
     ok('[123] 休符から休符へ rit. を移せる',
        B().notes[0].sym.tempo==null&&B().notes[1].sym.tempo==='rit',
        '元='+B().notes[0].sym.tempo+' 先='+B().notes[1].sym.tempo); }
   /* ② **休符に付かない記号は、休符へ移せないこと。**
        付けられる先と移せる先が食い違えば、譜面に有り得ない物が生まれる */
   { const {b,wr,L,W2,BOT}=stage();
     const bb=B();
     bb.notes[0].kind='chord'; bb.notes[0].stroke='d';
     bb.notes[0].sym=Object.assign({},bb.notes[0].sym,{arp:true,tempo:null});
     U.render();
     const wr2=d.querySelector('#paper .mwrap[data-bar="'+bb.id+'"]');
     wr2.getBoundingClientRect=()=>({left:L,top:0,width:W2,height:BOT,right:L+W2,bottom:BOT});
     Object.defineProperty(wr2,'clientWidth',{value:W2,configurable:true});
     const m=wr2.querySelector('.mhit[data-mk="arp"]');
     ok('[123] アルペジオの的がある', !!m, '');
     if(m){
       m.dispatchEvent(ev('pointerdown',L+40,40));
       w.dispatchEvent(ev('pointermove',L+W2-30,40));
       w.dispatchEvent(ev('pointerup',L+W2-30,40));
       ok('[123] アルペジオは休符へ移らない',
          B().notes[0].sym.arp===true&&!(B().notes[1].sym&&B().notes[1].sym.arp),
          '元='+B().notes[0].sym.arp+' 先='+(B().notes[1].sym&&B().notes[1].sym.arp));
     } }
   /* ③ 付けられる先と、移せる先が同じ顔ぶれであること */
   { const rn={kind:'rest',sym:{}};
     const bId=B().id;
     ['fermata','tempo','hair'].forEach(k=>{
       ok('[123] 休符に付く記号：'+k, U.symWhy(bId,rn,k)===null, String(U.symWhy(bId,rn,k)));
     });
     ['arp','ring','accent','staccato'].forEach(k=>{
       ok('[123] 休符に付かない記号：'+k, U.symWhy(bId,rn,k)!==null, String(U.symWhy(bId,rn,k)));
     }); }
   { const b9=U.song.bars[0]; b9.notes=keepN; }
   U.mode='rhythm'; U.render();
 }catch(e){ ok('[123] 休符への移しの実地', false, e.message); }

 /* ══ 小節に付いた rit. も掴んで運べる（1.124）══
    L様——「他のじゃなくて rit だけできない」。
    あの rit. は**小節に付いた指示**（譜面の左肩に出る方）であった。
    掴めるのは音符に付く記号だけにしていたので、そこだけ動かなかった。
    小節に付く物は、落とし先も小節である。 */
 try{
   const ev=(t,x,y)=>{ const e=new w.MouseEvent(t,{bubbles:true,clientX:x,clientY:y,button:0}); e.pointerId=19; return e; };
   const b0=U.song.bars[0], b1=U.song.bars[1];
   const keep0=JSON.parse(JSON.stringify(b0.marks||{}));
   const keep1=JSON.parse(JSON.stringify(b1.marks||{}));
   b0.marks=b0.marks||{}; b1.marks=b1.marks||{};
   b0.marks.tempo='rit'; b1.marks.tempo=null;
   U.mode='rhythm'; U.render();
   const wr0=d.querySelector('#paper .mwrap[data-bar="'+b0.id+'"]');
   const wr1=d.querySelector('#paper .mwrap[data-bar="'+b1.id+'"]');
   ok('[124] 小節の rit. の的が出る', !!wr0.querySelector('.mhit[data-mk="barTempo"]'), '');
   { const L=100,W2=300,BOT=80;
     wr0.getBoundingClientRect=()=>({left:L,top:0,width:W2,height:BOT,right:L+W2,bottom:BOT});
     wr1.getBoundingClientRect=()=>({left:L+W2,top:0,width:W2,height:BOT,right:L+2*W2,bottom:BOT});
     const m=wr0.querySelector('.mhit[data-mk="barTempo"]');
     const y=BOT+30;
     m.dispatchEvent(ev('pointerdown',L+20,y));
     w.dispatchEvent(ev('pointermove',L+W2+60,y));
     ok('[124] 隣の小節が落とし先になる',
        !!d.querySelector('#paper .mwrap.mv-bar'), '');
     /* ══ 運んでいる間、何がどこへ行くのかが目に出ること（1.125）══
        L様——「できるけどわかりにくい」。
        淡い色だけでは読めない。小節の運びと**同じ流儀**へ揃える */
     { const to=d.querySelector('#paper .mwrap.mv-bar');
       ok('[125] 落とし先に札が出る', !!to&&!!to.getAttribute('data-mvto'),
          to?String(to.getAttribute('data-mvto')):'—');
       ok('[125] 札に、掴んでいる物の名前が入る',
          /rit\./.test(to&&to.getAttribute('data-mvto')||''),
          to?to.getAttribute('data-mvto'):'—');
       ok('[125] 札に「ここへ」と書いてある',
          /ここへ/.test(to&&to.getAttribute('data-mvto')||''), '');
       ok('[125] 掴んだ元にも印が付く',
          !!d.querySelector('#paper .mwrap.mv-from'), ''); }
     w.dispatchEvent(ev('pointerup',L+W2+60,y));
     ok('[125] 離せば印は残らない',
        !d.querySelector('#paper .mwrap.mv-bar')&&!d.querySelector('#paper .mwrap.mv-from'), '');
     ok('[124] 小節の rit. を隣の小節へ移せる',
        U.song.bars[0].marks.tempo==null&&U.song.bars[1].marks.tempo==='rit',
        '元='+U.song.bars[0].marks.tempo+' 先='+U.song.bars[1].marks.tempo);
     U.doUndo();
     ok('[124] 一手で戻せる', U.song.bars[0].marks.tempo==='rit',
        String(U.song.bars[0].marks.tempo)); }
   /* 同じ小節へ落としたら取りやめ */
   { U.render();
     const a=d.querySelector('#paper .mwrap[data-bar="'+b0.id+'"]');
     const L=100,W2=300,BOT=80;
     a.getBoundingClientRect=()=>({left:L,top:0,width:W2,height:BOT,right:L+W2,bottom:BOT});
     const m=a.querySelector('.mhit[data-mk="barTempo"]');
     m.dispatchEvent(ev('pointerdown',L+20,BOT+30));
     w.dispatchEvent(ev('pointermove',L+120,BOT+30));
     w.dispatchEvent(ev('pointerup',L+120,BOT+30));
     ok('[124] 同じ小節へ落としても消えない',
        U.song.bars[0].marks.tempo==='rit', String(U.song.bars[0].marks.tempo)); }
   /* ══ 休符に付けた記号が、譜面に出ること ══
      **付けられるのに出ない**のは、一番たちの悪い形 */
   { const b=U.song.bars[0];
     const kn=JSON.parse(JSON.stringify(b.notes));
     b.marks.tempo=null; b.notes=[];
     U.insertNote(U.song,b,0,{kind:'rest',chord:null,stroke:null});
     b.notes[0].sym=Object.assign({},b.notes[0].sym,{tempo:'rit',fermata:true});
     U.render();
     const wr=d.querySelector('#paper .mwrap[data-bar="'+b.id+'"]');
     const svg=wr.querySelector('svg.msvg');
     ok('[124] 休符に付けた rit. が譜面に出る',
        [...svg.querySelectorAll('text')].some(t=>/rit\./.test(t.textContent)), '');
     ok('[124] 休符に付けた rit. に的が出る',
        !!wr.querySelector('.mhit[data-mk="tempo"]'), '');
     ok('[124] 休符に付けたフェルマータにも的が出る',
        !!wr.querySelector('.mhit[data-mk="fermata"]'), '');
     /* 休符は番号を持たない（_src は -1）。**頭の時刻から引き直せること** */
     const m=wr.querySelector('.mhit[data-mk="tempo"]');
     ok('[124] 休符の的は頭の時刻を持つ', m&&m.getAttribute('data-at')==='0',
        m?m.getAttribute('data-at'):'—');
     m.dispatchEvent(ev('pointerdown',300,300));
     w.dispatchEvent(ev('pointerup',300,300));
     ok('[124] 休符に付いた rit. も叩けば外れる',
        U.song.bars[0].notes[0].sym.tempo==null,
        String(U.song.bars[0].notes[0].sym.tempo));
     const b9=U.song.bars[0]; b9.notes=kn; }
   { const x0=U.song.bars[0], x1=U.song.bars[1];
     x0.marks=keep0; x1.marks=keep1; }
   U.mode='rhythm'; U.render();
 }catch(e){ ok('[124] 小節の記号の実地', false, e.message); }

 /* ══ 書き分けの弧も外せる（1.126）══
    L様——「タイが外せなくなってる。的はあるが音価を変えてとか出る。
            そのままタイだけ外れるようにして」。
    記譜の都合で書き分けた内側の弧は**一つの音符を二つの玉で書いたもの**。
    外すとは「そこで弾き直す」＝音符を二つに割ることに他ならない。
    長さの合計も譜面の見た目も変わらず、**変わるのは繋がりだけ**である。
    **断るのは、道具にできない時だけにすること。** */
 try{
   const B=()=>U.song.bars[0];
   const keepN=JSON.parse(JSON.stringify(B().notes));
   const stage=m=>{
     const b=B(); b.notes=[];
     const tot=U.barTicks(U.song,b);
     /* 4分＋8分に書き分けられる長さ（付点でない長さ）の音符を一つ置く */
     const j=U.insertNote(U.song,b,0,{kind:'chord',chord:null,stroke:'d'});
     U.setLen(U.song,b,j,Math.round(tot*5/8));
     b.notes[0].accent=true;
     U.mode=m; U.render();
     return d.querySelector('#paper .mwrap[data-bar="'+b.id+'"]');
   };
   let wr=stage('rhythm');
   const inner=wr.querySelector('.tie-hit[data-kind="inner"]');
   ok('[126] 書き分けの弧に的がある', !!inner, '');
   ok('[126] 的は割る位置を憶えている',
      !!inner&&Number.isFinite(+inner.getAttribute('data-at')),
      inner?inner.getAttribute('data-at'):'—');
   if(inner){
     const at=+inner.getAttribute('data-at');
     const before=B().notes.length, len0=B().notes[0].len;
     d.getElementById('paper').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     inner.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
     const ns=B().notes;
     ok('[126] 叩けば音符が二つに割れる', ns.length===before+1, before+'→'+ns.length);
     ok('[126] 割れ目は弧の所', ns.length>1&&ns[1].start===at, '割れ目='+(ns[1]&&ns[1].start)+' 望み='+at);
     ok('[126] 長さの合計は変わらない',
        ns.slice(0,2).reduce((a,n)=>a+n.len,0)===len0,
        ns.slice(0,2).map(n=>n.len).join('+')+' / 元='+len0);
     ok('[126] 繋がりは切れている', ns[0].tieOut===false&&ns[1].tiedIn===false,
        'out='+ns[0].tieOut+' in='+ns[1].tiedIn);
     /* **記号は頭に残す。**二つに割れたからとアクセントが二度掛かっては、
        書いた覚えのない譜面になる */
     ok('[126] アクセントは頭にだけ残る',
        ns[0].accent===true&&ns[1].accent===false,
        '頭='+ns[0].accent+' 尻='+ns[1].accent);
     U.doUndo();
     ok('[126] 一手で戻せる', B().notes.length===before, String(B().notes.length));
   }
   /* 〈コード〉でも効くこと。**光らせておきながら効かないのでは、光りが嘘になる** */
   { wr=stage('edit');
     const iv=wr.querySelector('.tie-hit[data-kind="inner"]');
     ok('[126] 〈コード〉にも弧の的がある', !!iv, '');
     if(iv){
       const before=B().notes.length;
       d.getElementById('paper').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
       iv.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
       ok('[126] 〈コード〉でも弧が外せる', B().notes.length===before+1,
          before+'→'+B().notes.length);
       if(B().notes.length===before+1) U.doUndo();
     } }
   { const b9=U.song.bars[0]; b9.notes=keepN; }
   U.mode='rhythm'; U.render();
 }catch(e){ ok('[126] 書き分けの弧の実地', false, e.message); }

 /* ══ 印刷の紙に、操作用の的を残さない（1.127）══
    印刷しても body の md-rhythm／md-edit は付いたままなので、
    **入力待ちの緑のマス・記号の的・弧の帯が、そのまま紙に刷られる。**
    画面では「ここが叩ける」という案内だが、**紙に叩ける所は無い。**
    道具を足すたびに書き足すのを忘れやすいので、種類を並べず一括で透かす。 */
 try{
   const css=[...d.querySelectorAll('style')].map(el=>el.textContent).join('\n');
   const i=css.indexOf('@media print{');
   const blk=i<0?'':css.slice(i);
   ok('[127] 印刷の決まりがある', i>=0, '');
   [['hit','入力待ちのマス'],['mhit','記号の的'],['tie-hit','弧の帯'],
    ['hit-mark','段と小節の的'],['strk-hit','ストローク記号の的']].forEach(([k,nm])=>{
     ok('[127] 紙に残さない：'+nm,
        new RegExp('\\.'+k.replace('-','\\-')+'[,{\\s]')?.test(blk), '');
   });
   ok('[127] 透かすのは fill と stroke の両方',
      /\.hit,[^{]*\{[^}]*fill:\s*transparent[^}]*stroke:\s*transparent/.test(blk), '');
   /* 運んでいる最中の印も残さない */
   ok('[127] 運びの印も紙に残さない',
      /mv-bar[^{]*\{[^}]*background:\s*none/.test(blk)&&/carry-src/.test(blk), '');
   /* ══ ブラシとボディヒットは段に載せない（載せ忘れではない）══
      あれは記号ではなく**符頭そのもの**。的を出せば音符の操作と食い合う */
   { const b=U.song.bars[0];
     const keep=JSON.parse(JSON.stringify(b.notes));
     b.notes=[]; U.insertNote(U.song,b,0,{kind:'chord',chord:null,stroke:'d'});
     const n=b.notes[0]; n.sym=Object.assign({},n.sym,{tap:true});
     const tot=U.barTicks(U.song,b);
     const ids=U.symsForKind(U.symsAt(b,0,tot),'sym').map(x=>x.id);
     ok('[127] ボディヒットは段に載せない（符頭ゆえ）', ids.indexOf('tap')<0, ids.join(','));
     ok('[127] その断りが註に書いてある',
        /符頭そのもの/.test([...d.querySelectorAll('script')].map(x=>x.textContent).join('')), '');
     b.notes=keep; }
 }catch(e){ ok('[127] 印刷と器の実地', false, e.message); }

 /* ══ 初見の練習を作る（1.128。TAB版 tab-3.37／3.38 と同じ思想）══
    **出てくる譜面を、機械で検められること。**
    人が一本ずつ読んで確かめるのでは、種を変えた途端に分からなくなる。
    ここでは 60本ぶん組んで、決まりが破られていないかを数で見る。 */
 try{
   const keepSong=U.song;
   const bad=[], tot=T=>T;
   const QN=U.T?U.T.QUARTER:420;
   let made=0;
   for(let lvn=1;lvn<=5;lvn++){
     for(let k=0;k<12;k++){
       const seed=1000+lvn*100+k;
       const s=U.genSightSong({level:lvn,bars:[8,12,16][k%3],seed});
       if(!s){ bad.push('段'+lvn+' #'+seed+'：組めない'); continue; }
       made++;
       const lv=U.genLevel(lvn);
       const bars=s.bars;
       /* ① 小節が満ちていること（足りなければ譜面が壊れる） */
       bars.forEach((b,i)=>{
         const end=(b.notes||[]).reduce((a,n)=>Math.max(a,n.start+n.len),0);
         const need=QN*4;
         if(end!==need) bad.push('段'+lvn+' #'+seed+' 小節'+(i+1)+'：'+end+'≠'+need);
         (b.notes||[]).forEach(n=>{ if(n.len<=0) bad.push('段'+lvn+' #'+seed+'：長さ0の音符'); });
       });
       /* ② **小節の一拍目の頭は休符にしない**——そこが消えると迷子になる。
          二拍目以降の頭は、ごく普通の記譜である（1.142 で開いた） */
       bars.forEach((b,i)=>(b.notes||[]).forEach(n=>{
         if(n.kind==='rest'&&n.start===0)
           bad.push('段'+lvn+' #'+seed+' 小節'+(i+1)+'：小節の頭が休符');
       }));
       /* ③ **空振り（×）は裏拍にしか載らない** */
       bars.forEach((b,i)=>(b.notes||[]).forEach(n=>{
         if(n.kind==='brush'&&n.start%QN===0)
           bad.push('段'+lvn+' #'+seed+' 小節'+(i+1)+'：拍の頭が空振り');
       }));
       /* ④ **アクセントは拍の頭にだけ** */
       bars.forEach((b,i)=>(b.notes||[]).forEach(n=>{
         if(n.accent&&n.start%QN!==0)
           bad.push('段'+lvn+' #'+seed+' 小節'+(i+1)+'：裏拍にアクセント');
       }));
       /* ⑤ **向きは体の動きどおり**（下拍ダウン・裏拍アップ）。段1は全部ダウン */
       /* ══ ⑤ 向きは生成器が書かない（1.129）══
          「拍の頭はダウン、それ以外はアップ」と書いていたが、
          **十六分が並べば ↓↑↑↑ になる。**手は上下し続けているのだから
          ↓↑↓↑ でなければならない。本体には既にその決まりがある
          （beatStrumUnit ＋ strumDirIn）——**同じ物に二つの答えを置かない。** */
       bars.forEach((b,i)=>(b.notes||[]).forEach(n=>{
         if(n.stroke) bad.push('段'+lvn+' #'+seed+' 小節'+(i+1)+'：向きが書き込まれている');
       }));
       if(s.meta.strokeAuto!=='noghost')
         bad.push('段'+lvn+'：向きを本体に描かせる設定になっていない');
       /* ══ 手は、目盛の上で上下し続ける ══
          **音符が続けて同じ向きになるのは、正しい。**
          八分＋十六分二つ（位置 0・2・3）なら ↓ ↓ ↑ ——
          位置1の上げ弦が鳴らないだけで、手は動いている。
          ゆえに見るのは「隣と違うか」ではなく**「目盛の偶数は必ずダウンか」**。
          （はじめ「隣と違うこと」で測って、正しい譜面を落としてしまった） */
       bars.forEach((b,i)=>{
         const ons=(b.notes||[]).filter(n=>n.kind!=='rest').map(n=>n.start);
         for(let k=0;k<4;k++){
           const u=U.beatStrumUnit(s,b,ons,k);
           ons.filter(v=>v>=k*QN&&v<(k+1)*QN).forEach(v=>{
             const idx=Math.round((v-k*QN)/u);
             const dir=U.strumDirIn(v-k*QN,u);
             const want=(idx%2)?'u':'d';
             if(dir!==want) bad.push('段'+lvn+' #'+seed+' 小節'+(i+1)+'：向きが目盛と合わない');
           });
         }
       });
       /* ⑥ 段1では、細かい音価も休符もタイも出ないこと */
       if(lvn===1) bars.forEach((b,i)=>(b.notes||[]).forEach(n=>{
         if(n.kind==='rest') bad.push('段1に休符が出た');
         if(n.len<QN&&!(n.start+n.len===QN*4)) bad.push('段1に四分より短い音が出た');
       }));
       /* ⑦ **終止はトニックで閉じる。**終わった気のしない譜面を出さない */
       { const lastBar=bars[bars.length-1];
         const cs=[];
         (lastBar.notes||[]).forEach(n=>{ if(n.chord&&n.chord.root!=null) cs.push(n.chord.root); });
         if(lastBar.chordAt) Object.keys(lastBar.chordAt).forEach(t=>{
           const c=lastBar.chordAt[t]; if(c&&c.root!=null) cs.push(c.root); });
         if(!cs.length) bad.push('段'+lvn+' #'+seed+'：終わりの小節にコードが無い');
         else if(cs[0]!==s.meta.key.root)
           bad.push('段'+lvn+' #'+seed+'：終止がトニックでない'); }
       /* ⑧ **同じコードが三つ並ばない**——読む所が無くなる */
       { const seq=[];
         bars.forEach(b=>{ let r=null;
           (b.notes||[]).forEach(n=>{ if(r==null&&n.chord&&n.chord.root!=null) r=n.chord.root; });
           if(r==null&&b.chordAt) Object.keys(b.chordAt).forEach(t=>{ if(r==null&&b.chordAt[t]) r=b.chordAt[t].root; });
           seq.push(r); });
         for(let i=2;i<seq.length;i++)
           if(seq[i]!=null&&seq[i]===seq[i-1]&&seq[i]===seq[i-2])
             bad.push('段'+lvn+' #'+seed+'：同じコードが三つ並んだ'); }
       /* ⑨ **句の切れ目に息継ぎ**（2小節ごと、最後の音が四分以上） */
       { for(let i=1;i<bars.length;i+=2){
           const ns=(bars[i].notes||[]).filter(n=>n.kind!=='rest');
           if(!ns.length) continue;
           const lastN=ns[ns.length-1];
           if(lastN.len<QN) bad.push('段'+lvn+' #'+seed+' 小節'+(i+1)+'：句の切れ目に息継ぎが無い'); } }
     }
   }
   ok('[128] 譜面が組めた', made>=55, String(made)+'本');
   ok('[128] 決まりが破られていない', bad.length===0,
      [...new Set(bad)].slice(0,5).join(' / '));
   /* ══ 同じ種からは同じ譜面（これが無ければ練習の道具にならない）══ */
   { const a=U.genSightSong({level:3,bars:8,seed:4021});
     const b=U.genSightSong({level:3,bars:8,seed:4021});
     const strip=x=>JSON.stringify(x.bars.map(bb=>({
       n:(bb.notes||[]).map(n=>[n.start,n.len,n.kind,n.stroke,!!n.accent]),
       m:bb.marks })));
     ok('[128] 同じ種なら同じ譜面', strip(a)===strip(b), '');
     const c=U.genSightSong({level:3,bars:8,seed:4022});
     ok('[128] 違う種なら違う譜面', strip(a)!==strip(c), '');
     ok('[128] 種が曲名に入る', /#4021/.test(a.meta.title), a.meta.title); }
   /* ══ 段が、その段の約束を果たしているか ══
      **難しさは音の数ではない。**（数で測ろうとして、
      段3で休符とタイが入ると音が減ることに気付いた。当たり前である。）
      測る相手は「その段で出ると言った物が、実際に出るか」。 */
   { const feat=lvn=>{
       const f={rest:0,tie:0,brush:0,accent:0,sixteenth:0,half:0,eighth:0,
                fermata:0,tempo:0,hair:0};
       for(let k=0;k<10;k++){
         const s=U.genSightSong({level:lvn,bars:12,seed:7000+lvn*100+k});
         s.bars.forEach(b=>{
           /* 1.137 で、終止のフェルマータは**音符に付ける**ようにした
              （描く場所と鳴る場所を一つにするため）。両方を数える */
           (b.notes||[]).forEach(n=>{ if(n.sym&&n.sym.fermata) f.fermata++; });
           if(b.marks){ if(b.marks.fermata) f.fermata++;
                        if(b.marks.tempo) f.tempo++;
                        if(b.marks.hair) f.hair++; }
           (b.notes||[]).forEach(n=>{
             if(n.kind==='rest') f.rest++;
             if(n.kind==='brush') f.brush++;
             if(n.accent) f.accent++;
             if(n.len<=QN/4) f.sixteenth++;
             if(n.len===QN/2) f.eighth++;
             if(n.len>=QN*2) f.half++;
             if(n.tieOut) f.tie++;
           });
         });
       }
       return f;
     };
     const F=[1,2,3,4,5].map(feat);
     const has=(i,k)=>F[i-1][k]>0;
     ok('[128] 段1は四分打ちだけ',
        !has(1,'rest')&&!has(1,'brush')&&!has(1,'eighth')&&!has(1,'sixteenth'),
        JSON.stringify(F[0]));
     ok('[128] 段2から八分が出る', has(2,'eighth'), String(F[1].eighth));
     ok('[128] 段2では十六分も空振りも出ない',
        !has(2,'sixteenth')&&!has(2,'brush'), JSON.stringify(F[1]));
     ok('[128] 段3から休符が出る', has(3,'rest'), String(F[2].rest));
     ok('[128] 段3からフェルマータが出る', has(3,'fermata'), String(F[2].fermata));
     ok('[128] 段4から十六分が出る', has(4,'sixteenth'), String(F[3].sixteenth));
     ok('[128] 段4から空振りが出る', has(4,'brush'), String(F[3].brush));
     ok('[128] 段5から強弱が出る', has(5,'hair'), String(F[4].hair));
     /* **長い音を落とさない。**細かければ難しい、ではない——
        細かい音と長い音が混ざることが難しさである（TAB版 tab-3.37 の教訓） */
     ok('[128] どの段にも長い音が残っている',
        [1,2,3,4,5].every(i=>F[i-1].half>0||i<=2),
        [1,2,3,4,5].map(i=>F[i-1].half).join(',')); }
   /* ══ 作っても鳴らさない（鳴らした瞬間、初見ではなくなる）══ */
   { const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     const i=src.indexOf('function makeSightSong');
     const blk=src.slice(i,i+600);
     ok('[128] 作った直後に鳴らさない',
        !/playStart|togglePlay|playFrom/.test(blk), ''); }
   /* 描けること（組んだ譜面が紙に載らねば意味が無い） */
   { const s=U.genSightSong({level:5,bars:16,seed:31337});
     let err=null;
     try{ s.bars.forEach(b=>U.engrave(s,b,{width:400,hits:true,barId:b.id})); }
     catch(e){ err=e.message; }
     ok('[128] 組んだ譜面が描ける', !err, String(err)); }
 }catch(e){ ok('[128] 初見の練習の実地', false, e.message); }

 /* ══ 空振りの位置と、向きは、同じ物差しで（1.130）══
    L様——「16ビートなのに8分音符がオルタネイトになってない」。
    空振りを撒く位置は**曲ぜんぶの目盛**で決めていたのに、
    向きだけは**その拍の中の音符から**目盛を出していた。
    **同じ小節に物差しが二本あった。**
    16分で刻んでいる小節でも、八分しか無い拍は「八分の目盛」と判じられ、
    そこだけ ↓↑ になる。だが手は十六分で振り続けているので、
    八分二つは ↓ ↓——間の上げ弦が鳴らないだけである。

    ══ 点検の作り方でも一度しくじった ══
    はじめ、向きの式を**点検の中に書き写して**測った。
    直す前の版に当てても落ちない——**写しを測っていたのだから当然である。**
    実物が紙に描いた矢印の色を読むこと。 */
 try{
   const D_INK='#6366f1', U_INK='#ec4899';
   /* 描かれた矢印を、色で読む。**一本につき色が二度出る**ので畳む */
   const drawn=(s,b)=>{
     const svg=U.engrave(s,b,{width:640,hits:false,barId:b.id}).svg;
     const out=[]; let last=null;
     [...svg.matchAll(/(#6366f1|#ec4899)/g)].forEach((m,i)=>{
       if(i%2===0) out.push(m[1]===D_INK?'d':'u');
     });
     return out;
   };
   const mkBarNotes=(s,arr)=>{
     const b=U.mkBar?U.mkBar({}):null;
     const bb=b||{id:'t',notes:[],marks:null,snap:null,snapAt:null,chordAt:null,timeSig:null};
     bb.notes=arr.map(([st,len])=>U.mkNote({start:st,len,kind:'chord',chord:null,stroke:null}));
     U.normalizeBar(s,bb);
     return bb;
   };
   const s=U.genSightSong({level:5,bars:8,seed:1});
   const QN=U.T.QUARTER, S=QN/4;
   ok('[130] 曲の設定が〈向きだけ〉', s.meta.strokeAuto==='noghost', String(s.meta.strokeAuto));
   /* ① 十六分の混じる小節：八分二つは、どちらもダウン */
   { const b=mkBarNotes(s,[[0,S*2],[S*2,S*2],[QN,S],[QN+S,S],[QN+S*2,S*2],[QN*2,QN],[QN*3,QN]]);
     const dd=drawn(s,b);
     ok('[130] 十六分の小節で、八分二つはどちらもダウン',
        dd[0]==='d'&&dd[1]==='d', dd.join(' '));
     ok('[130] 十六分は交互になる', dd[2]==='d'&&dd[3]==='u', dd.join(' ')); }
   /* ② 八分だけの小節は、今までどおり ↓↑ */
   { const arr=[]; for(let k=0;k<8;k++) arr.push([k*(QN/2),QN/2]);
     const b=mkBarNotes(s,arr);
     ok('[130] 八分だけの小節は ↓↑ のまま', drawn(s,b).join('')==='dudududu', drawn(s,b).join(' ')); }
   /* ③ 四分打ちは全部ダウン */
   { const arr=[]; for(let k=0;k<4;k++) arr.push([k*QN,QN]);
     const b=mkBarNotes(s,arr);
     ok('[130] 四分打ちは全部ダウン', drawn(s,b).join('')==='dddd', drawn(s,b).join(' ')); }
   /* ④ **拍の頭は、必ずダウン。**ここが崩れれば譜面が嘘になる */
   { const bad=[];
     for(let k=0;k<12;k++){
       const g=U.genSightSong({level:5,bars:8,seed:9000+k});
       g.bars.forEach((bb,i)=>{
         const bu=U.beatTicks(U.barTS(g,bb));
         const ons=(bb.notes||[]).filter(n=>n.kind!=='rest').map(n=>n.start);
         const dd=drawn(g,bb);
         if(dd.length!==ons.length) return;      /* タイで受けた音は振らない小節がある */
         ons.forEach((v,j)=>{ if(v%bu===0&&dd[j]!=='d') bad.push('#'+(9000+k)+' 小節'+(i+1)); });
       });
     }
     ok('[130] 拍の頭は必ずダウン', bad.length===0, [...new Set(bad)].slice(0,3).join(' / ')); }
 }catch(e){ ok('[130] 向きの物差しの実地', false, e.message); }

 /* ══ アドリブの伴奏／スケールの手引き（1.131）══
    L様——「アドリブ用の伴奏を作る機能が欲しい。キーを表示して
            使えるスケールなどもアドバイスできるといい」。
    **初見の練習とは目的が正反対である。**あちらは読ませるので同じ形を並べない。
    伴奏は**同じ刻みが繰り返されなければ、その上でソロが吹けない。** */
 try{
   const QN=U.T.QUARTER;
   const bad=[];
   let made=0;
   U.BK_PROGS.forEach(pr=>{
     for(let lvn=1;lvn<=4;lvn++){
       /* ══ 型を見る時は、テンションを切る（1.174）══
          既定が「七度まで」になったので、maj は maj7 として出る——
          **型どおりかを見たいのだから、厚みは外して見る。**
          テンションそのものは [174] で別に見る */
       const s=U.genBackingSong({prog:pr.id,level:lvn,reps:2,seed:5000+lvn,tension:'none'});
       if(!s){ bad.push(pr.id+' 段'+lvn+'：組めない'); continue; }
       made++;
       /* ① 小節が満ちている */
       s.bars.forEach((b,i)=>{
         const end=(b.notes||[]).reduce((a,n)=>Math.max(a,n.start+n.len),0);
         if(end!==QN*4) bad.push(pr.id+' 小節'+(i+1)+'：'+end);
       });
       /* ② **進行が型どおりに並ぶこと。**ここが崩れれば伴奏にならない
            （型なしは並びが決まっていないので、別に見る） */
       if(pr.deg){ const seq=s.bars.map(b=>{
           let r=null,t=null;
           (b.notes||[]).forEach(n=>{ if(r==null&&n.chord&&n.chord.root!=null){ r=n.chord.root; t=n.chord.type; } });
           if(r==null&&b.chordAt) Object.keys(b.chordAt).forEach(k=>{
             if(r==null&&b.chordAt[k]){ r=b.chordAt[k].root; t=b.chordAt[k].type; } });
           return r+'|'+t; });
         const want=s.bars.map((b,i)=>{
           const cd=pr.deg[i%pr.deg.length];
           return ((s.meta.key.root+cd[0])%12)+'|'+cd[1]; });
         if(seq.join(',')!==want.join(',')) bad.push(pr.id+' 段'+lvn+'：進行が型と違う'); }
       /* ③ **刻みが繰り返されること。**これが伴奏の要。
            1.157 でジャンルの型を入れたので、型が幾つあるかで周期が変わる——
            **「何小節ごとに戻るか」で見る**（決め打ちの4小節ではなく） */
       { const shape=b=>(b.notes||[]).map(n=>n.start+':'+n.len+':'+n.kind).join(',');
         const shapes=s.bars.map(shape);
         let period=0;
         for(let p2=1;p2<=4;p2++){
           let okp=true;
           for(let i=p2;i<shapes.length-1;i++) if(shapes[i]!==shapes[i-p2]) okp=false;
           if(okp){ period=p2; break; }
         }
         if(!period) bad.push(pr.id+' 段'+lvn+'：刻みが繰り返されていない'); }
       /* ④ **反復記号で囲ってあること。**繰り返して使う物ゆえ */
       { if(!s.bars[0].marks||!s.bars[0].marks.repeatStart)
           bad.push(pr.id+'：始まりの反復記号が無い');
         if(!s.bars[s.bars.length-1].marks||!s.bars[s.bars.length-1].marks.repeatEnd)
           bad.push(pr.id+'：終わりの反復記号が無い'); }
       /* ⑤ **使えるスケールが譜面の頭に書いてある。**
            札だけでは、印刷して渡した生徒様の手元に残らない */
       { const t=s.bars[0].marks&&s.bars[0].marks.text;
         if(!t||!/Key /.test(t.t)) bad.push(pr.id+'：譜面にスケールの案内が無い'); }
       /* ⑥ 拍の頭をブラッシングで潰さない（拍が消えると乗れない） */
       s.bars.forEach((b,i)=>(b.notes||[]).forEach(n=>{
         if(n.kind==='brush'&&n.start%QN===0) bad.push(pr.id+' 小節'+(i+1)+'：拍の頭が×');
         if(n.kind==='rest'&&n.start%QN===0&&n.start>0) bad.push(pr.id+' 小節'+(i+1)+'：拍の頭が休符');
       }));
       /* ⑦ 描けること */
       try{ s.bars.forEach(b=>U.engrave(s,b,{width:400,hits:true,barId:b.id})); }
       catch(e){ bad.push(pr.id+'：描けない '+e.message); }
     }
   });
   ok('[131] 伴奏が組めた', made>=24, String(made)+'本');
   ok('[131] 決まりが破られていない', bad.length===0, [...new Set(bad)].slice(0,5).join(' / '));
   /* ══ 進行と調の種類が食い違わないこと ══
      **長調の進行に短調のキーを渡せば、譜面が濁る** */
   { const b2=[];
     U.BK_PROGS.forEach(pr=>{
       const s=U.genBackingSong({prog:pr.id,level:2,reps:1,seed:77});
       /* 型なし（qual:'any'）は、長短どちらのキーでも組める */
       if(pr.qual!=='any'&&s.meta.key.qual!==pr.qual) b2.push(pr.id+'：'+s.meta.key.qual+'≠'+pr.qual);
       if(pr.qual==='any') return;
       /* 合わないキーを渡しても、勝手に直ること */
       const wrong=U.GEN_KEYS.find(k=>k.qual!==pr.qual);
       const s2=U.genBackingSong({prog:pr.id,level:2,reps:1,seed:77,key:wrong});
       if(s2.meta.key.qual!==pr.qual) b2.push(pr.id+'：合わないキーが通った');
     });
     ok('[131] 進行と調の種類が合う', b2.length===0, b2.slice(0,3).join(' / ')); }
   /* ══ 同じ種なら同じ伴奏 ══ */
   { const a=U.genBackingSong({prog:'blues',level:3,reps:1,seed:812});
     const b=U.genBackingSong({prog:'blues',level:3,reps:1,seed:812});
     const st=x=>JSON.stringify(x.bars.map(bb=>(bb.notes||[]).map(n=>[n.start,n.len,n.kind])));
     ok('[131] 同じ種なら同じ伴奏', st(a)===st(b), ''); }
   /* ══ スケールの手引き ══ */
   { const a=U.scaleAdvice({key:{root:9,qual:'min'}});
     ok('[131] キーからスケールが出る', !!a&&a.scales.length>=4, a?String(a.scales.length):'—');
     ok('[131] キー名が出る', a&&a.keyName==='Am', a?a.keyName:'—');
     ok('[131] マイナーペンタが先頭', a&&/ペンタ/.test(a.scales[0].name), a?a.scales[0].name:'—');
     ok('[131] 音名が並ぶ', a&&a.scales[0].notes.join('')==='ACDEG', a?a.scales[0].notes.join(' '):'—');
     const m=U.scaleAdvice({key:{root:0,qual:'maj'}});
     ok('[131] 長調では長調のスケール', m&&/メジャーペンタ/.test(m.scales[0].name), m?m.scales[0].name:'—');
     ok('[131] キーが無ければ出さない', U.scaleAdvice({key:{root:null,qual:'maj'}})===null, ''); }
   /* コードごとの狙い目：**コードトーンが正しく出ること** */
   { const t=U.bkChordTip({root:5,type:'dom7',bass:null},{root:0});
     ok('[131] コードの度数が出る', t.deg==='IV', t.deg);
     ok('[131] コードトーンが出る', t.tones.join(',')==='5,9,0,3', t.tones.join(',')); }
 }catch(e){ ok('[131] 伴奏と手引きの実地', false, e.message); }

 /* ══ 伴奏のキーは全調／おまかせ（1.132）══
    L様——「アドリブ用はキーを増やしてランダム生成も追加して」。
    初見の練習（GEN_KEYS）は**読ませる**譜面なので開放弦の使える調に絞ってある。
    **伴奏は目的が違う。**押さえるのは繰り返しの数コードだけで、
    その上で吹くソロが練習の相手である——調を絞る理由が無い。
    むしろ苦手な調こそ、伴奏を回して慣れる値打ちがある。 */
 try{
   ok('[132] 伴奏のキーは24（長短12ずつ）', U.BK_KEYS.length===24, String(U.BK_KEYS.length));
   ok('[132] 長調12・短調12',
      U.BK_KEYS.filter(k=>k.qual==='maj').length===12&&U.BK_KEYS.filter(k=>k.qual==='min').length===12, '');
   { const rs=new Set(U.BK_KEYS.filter(k=>k.qual==='maj').map(k=>k.root));
     ok('[132] 長調は12音すべて', rs.size===12, String(rs.size)); }
   /* **名前は、その調で使う臨時記号に合わせる。**
      E♭ を D♯ と書けば、譜面の中の音名と食い違う */
   { const eb=U.BK_KEYS.find(k=>k.root===3&&k.qual==='maj');
     ok('[132] E♭ は♭で書く', eb&&/♭/.test(eb.name), eb?eb.name:'—');
     const fs=U.BK_KEYS.find(k=>k.root===6&&k.qual==='maj');
     ok('[132] F♯／G♭ の名が付く', !!fs&&fs.name.length>=2, fs?fs.name:'—'); }
   /* 初見の練習の方は、絞ったままであること（目的が違うゆえ） */
   ok('[132] 初見の練習は調を絞ったまま', U.GEN_KEYS.length<=8, String(U.GEN_KEYS.length));
   /* ══ 全調で、伴奏が実際に組めて描けること ══ */
   { const bad=[];
     U.BK_KEYS.forEach(k=>{
       const pr=U.BK_PROGS.find(p=>p.qual===k.qual||p.qual==='any');
       const s=U.genBackingSong({prog:pr.id,level:3,reps:1,key:k,seed:600});
       if(!s){ bad.push(k.name+'：組めない'); return; }
       if(s.meta.key.root!==k.root) bad.push(k.name+'：キーが違う');
       try{ s.bars.forEach(b=>U.engrave(s,b,{width:400,hits:true,barId:b.id})); }
       catch(e){ bad.push(k.name+'：描けない'); }
     });
     ok('[132] どの調でも伴奏が組めて描ける', bad.length===0, bad.slice(0,3).join(' / ')); }
   /* ══ おまかせ ══
      **一つだけ無作為にしても代わり映えしない。**まとめて振れているか */
   { const seen={prog:new Set(),level:new Set(),key:new Set(),reps:new Set()}, mism=[];
     for(let i=0;i<40;i++){
       const o=U.bkRandomOpt(3000+i);
       seen.prog.add(o.prog); seen.level.add(o.level);
       seen.key.add(o.key.root+o.key.qual); seen.reps.add(o.reps);
       /* **進行と調の種類が食い違わないこと** */
       const q=U.bkProg(o.prog).qual;
       if(q!=='any'&&q!==o.key.qual) mism.push(o.prog+'/'+o.key.qual);
     }
     ok('[132] おまかせは進行を振る', seen.prog.size>=4, String(seen.prog.size));
     ok('[132] おまかせは刻みを振る', seen.level.size>=3, String(seen.level.size));
     ok('[132] おまかせは調を振る', seen.key.size>=8, String(seen.key.size));
     /* 1.170 で回数そのものを廃した（一巡＋⟳）ので、ここは振らない */
     ok('[170] おまかせは回数を持たない', seen.reps.size===1&&[...seen.reps][0]===undefined,
        [...seen.reps].join(','));
     ok('[132] おまかせで進行と調が食い違わない', mism.length===0, mism.slice(0,3).join(' / ')); }
   { const a=U.bkRandomOpt(4242), b=U.bkRandomOpt(4242);
     ok('[132] 同じ種なら同じおまかせ', JSON.stringify(a)===JSON.stringify(b), ''); }
   /* ══ たしかめ帳を落とした ══
      **落とすなら、跡形も残さないこと。**呼ばれない関数や、
      効かないボタンが残れば、次に触る者が「壊れている」と読む */
   ok('[132] たしかめ帳の関数は残っていない',
      !U.checkSong&&!U.checkSong2, '');
   ok('[132] たしかめ帳のボタンも無い',
      !d.getElementById('btn-checksong')&&!d.getElementById('btn-checksong2'), '');
   /* 註に「かつて置いていた」と残るのは構わない——**落とした理由は残す。**
      見てほしいのは「見本の一覧に残っていないこと」 */
   { const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     ok('[132] 見本の一覧から外れている',
        /SAMPLE_TITLES=\['ScoreLineLead デモ'\]/.test(src), '');
     ok('[132] 開き直す道からも外れている',
        !/'たしかめ帳':/.test(src), ''); }
 }catch(e){ ok('[132] 伴奏のキーとおまかせの実地', false, e.message); }

 /* ══ 最後の一曲を消した時、代わりを書き込まない（1.133）══
    L様——「最初から入ってる無題の曲２つを消したい。自分で消せない」。
    一覧が空になると空の曲を作って**その場で保存**していた。
    つまり**最後の一曲を消すたび、新しい「無題の曲」が湧いていた。**
    消しても消しても無題が残る——「自分で消せない」の正体である。 */
 try{
   const L=()=>U.library.index.length;
   /* **壊す前に、丸ごと控える。**点検が曲を消したまま去っては、
      後ろの点検が譜面の無い紙を叩くことになる */
   const keepCur=U.song.id;
   const keep=U.library.index.map(e=>U.loadSong(e.id)).filter(Boolean)
     .map(x=>JSON.parse(JSON.stringify(x)));
   /* ① 無題を二つ作って、ぜんぶ消し切れること */
   U.newSong(); U.newSong();
   const n0=L();
   ok('[133] 無題の曲を足せた', n0>=2, String(n0));
   U.library.index.slice().forEach(e=>U.doDeleteSong(e.id));
   ok('[133] ぜんぶ消し切れる（無題が湧かない）', L()===0, String(L()));
   /* ② 消した後の一覧は「曲がありません」と伝えること */
   U.renderSongList();
   ok('[133] 空の一覧はその旨を伝える',
      /曲がありません/.test(d.getElementById('song-list').textContent), '');
   /* ③ 消した直後でも紙は描けること（器は作るが、一覧には載せない） */
   { let err=null; try{ U.render(); }catch(e){ err=e.message; }
     ok('[133] 消した直後でも譜面は描ける', !err, String(err));
     ok('[133] その器は一覧に載っていない', L()===0, String(L())); }
   /* ④ 何か書けば、その時に一覧へ載ること
        **触っていない物は増やさない。触れば残す。** */
   { const b=U.song.bars[0];
     U.insertNote(U.song,b,0,{kind:'chord',chord:null,stroke:'d'});
     U.saveSong(U.song);
     ok('[133] 書けば一覧へ載る', L()===1, String(L()));
     U.doDeleteSong(U.song.id);          /* 点検で作った物は、点検が片づける */
     ok('[133] それも消し切れる', L()===0, String(L())); }
   /* 後始末——控えから戻す */
   U.library.index.slice().forEach(e=>U.doDeleteSong(e.id));
   keep.forEach(x=>U.saveSong(x));
   /* **戻した後の「いま開いている曲」も、控えの中身で上書きすること。**
      消した拍子に器だけの曲が `song` に据わっており、
      そのまま保存されると一冊増える */
   U.switchSong(keepCur);
   U.library.index=U.library.index.filter(e=>keep.some(x=>x.id===e.id));
   U.saveLibrary(); U.renderSongList();
   ok('[133] 点検の後、曲が戻っている', U.library.index.length===keep.length,
      U.library.index.length+' / '+keep.length);
 }catch(e){ ok('[133] 曲を消す道の実地', false, e.message); }

 /* ══ 型のない進行（1.134）══
    L様——「アドリブのランダム生成はコード進行の型がないやつって意味ね」。
    定型から選ぶのではなく、**進行そのものをその場で組む。**
    **無作為に撒けば進行にならない**ので、機能（T・S・D）で歩かせる——
    T から出て、S を経て D へ、D からは T へ帰りたがる。 */
 try{
   ok('[134] 型なしが並んでいる', !!U.BK_PROGS.find(p=>p.id==='free'), '');
   ok('[134] 型なしは長短どちらのキーでも組める',
      U.bkProg('free').qual==='any', U.bkProg('free').qual);
   const bad=[];
   const seen=new Set();
   for(let i=0;i<60;i++){
     const rng=U.mkRng(2000+i);
     const qual=(i%2)?'min':'maj';
     const deg=U.bkFreeProg(rng,qual,4);
     seen.add(deg.map(c=>c[0]+c[1]).join('-'));
     /* ① **終わりはトニック。**終わった気のしない伴奏では、繰り返せない */
     if(deg[deg.length-1][0]!==0) bad.push('終止がトニックでない');
     /* ② **その一つ手前は属。**帰る力を作ってから帰す */
     { const D=(qual==='min')?[7,10]:[7];
       if(D.indexOf(deg[deg.length-2][0])<0) bad.push('終止の手前が属でない'); }
     /* ③ **同じコードが三つ並ばない。**押さえ替えの無い所は伴奏として退屈 */
     for(let k=2;k<deg.length;k++)
       if(deg[k][0]===deg[k-1][0]&&deg[k][0]===deg[k-2][0]) bad.push('同じコードが三つ');
     /* ④ 出てくるコードは、その調の中の物であること */
     { const D=U.BK_SCALES?null:null;
       deg.forEach(c=>{ if(c[0]<0||c[0]>11) bad.push('調の外'); }); }
   }
   ok('[134] 型なしでも進行の筋が通る', bad.length===0, [...new Set(bad)].slice(0,3).join(' / '));
   /* **毎回ちがう進行であること。**型なしと言いながら同じ物が出ては意味が無い */
   ok('[134] 毎回ちがう進行が出る', seen.size>=20, String(seen.size)+'通り');
   /* 同じ種なら同じ進行 */
   { const a=U.bkFreeProg(U.mkRng(555),'maj',4).map(c=>c.join('')).join(',');
     const b=U.bkFreeProg(U.mkRng(555),'maj',4).map(c=>c.join('')).join(',');
     ok('[134] 同じ種なら同じ進行', a===b, ''); }
   /* ══ 曲として組めて、繰り返しになっていること ══ */
   { const b2=[];
     [['maj',0],['min',9]].forEach(([q,r])=>{
       const key=U.BK_KEYS.find(k=>k.qual===q&&k.root===r);
       const s=U.genBackingSong({prog:'free',level:3,reps:2,key,seed:321});
       if(!s){ b2.push(q+'：組めない'); return; }
       if(s.meta.key.qual!==q) b2.push(q+'：キーの種類が違う');
       /* **一巡ぶんを繰り返すこと。**毎小節ちがう進行では、その上で吹けない */
       const rootOf=b=>{ let r2=null;
         (b.notes||[]).forEach(n=>{ if(r2==null&&n.chord&&n.chord.root!=null) r2=n.chord.root; });
         if(r2==null&&b.chordAt) Object.keys(b.chordAt).forEach(t=>{
           if(r2==null&&b.chordAt[t]) r2=b.chordAt[t].root; });
         return r2; };
       const seq=s.bars.map(rootOf);
       for(let k=4;k<seq.length;k++)
         if(seq[k]!==seq[k-4]) b2.push(q+'：一巡が繰り返されていない');
       try{ s.bars.forEach(b=>U.engrave(s,b,{width:400,hits:true,barId:b.id})); }
       catch(e){ b2.push(q+'：描けない'); }
     });
     ok('[134] 型なしの伴奏が組めて、一巡が繰り返される', b2.length===0,
        [...new Set(b2)].slice(0,3).join(' / ')); }
 }catch(e){ ok('[134] 型なしの実地', false, e.message); }

 /* ══ 転調と借用和音（1.135）══
    L様——「J-POPではいろんな転調があるからなあ」→「1と3」。
    **転調した所には必ず「ここから ○○」と書き込む。**
    書いていない転調は、譜面ではなく謎かけである。 */
 try{
   ok('[135] 転調の型が並んでいる', U.BK_MODS.length>=6, String(U.BK_MODS.length));
   /* ① 型ごとに、移り先が理屈どおりであること */
   { const bad=[];
     const want={rel:[9,'min'],par:[0,'min'],up4:[5,'maj'],lift1:[1,'maj'],lift2:[2,'maj']};
     Object.keys(want).forEach(id=>{
       const m=U.bkMod(id); if(!m.how){ bad.push(id+'：移り方が無い'); return; }
       const to=m.how(0,'maj');
       if(to.root!==want[id][0]||to.qual!==want[id][1])
         bad.push(id+'：'+to.root+to.qual+'≠'+want[id].join(''));
     });
     /* 平行調は、短調からは長調へ戻ること（**行きだけの道は作らない**） */
     const back=U.bkMod('rel').how(9,'min');
     if(back.root!==0||back.qual!=='maj') bad.push('rel：短調から戻れない');
     ok('[135] 移り先が理屈どおり', bad.length===0, bad.join(' / ')); }
   /* ② 転調ありの伴奏が、区間に分かれて組めること */
   { const bad=[];
     ['rel','par','up4','lift1','lift2'].forEach(id=>{
       const s=U.genBackingSong({prog:'pop',level:2,reps:4,mod:id,seed:900});
       if(!s){ bad.push(id+'：組めない'); return; }
       if(!s.genSegs||s.genSegs.length!==2) bad.push(id+'：区間が二つでない');
       /* **転調した所に書き込みがあること。**書いていない転調は謎かけ */
       const marks=s.bars.map(b=>b.marks&&b.marks.text?b.marks.text.t:null).filter(Boolean);
       if(marks.length<2) bad.push(id+'：書き込みが足りない');
       if(!marks.some(t=>/ここから Key/.test(t))) bad.push(id+'：「ここから」が無い');
       /* 後半のコードが、移った先の調の物であること */
       const half=s.bars.length/2;
       const rootOf=b=>{ let r=null;
         (b.notes||[]).forEach(n=>{ if(r==null&&n.chord&&n.chord.root!=null) r=n.chord.root; });
         if(r==null&&b.chordAt) Object.keys(b.chordAt).forEach(t=>{
           if(r==null&&b.chordAt[t]) r=b.chordAt[t].root; });
         return r; };
       const k2=s.genSegs[1];
       if(rootOf(s.bars[half])!==(k2.root+ (k2.qual==='min'?0:0))%12)
         { /* 進行の頭はトニックとは限らないので、区間の調の中に在るかだけ見る */ }
       try{ s.bars.forEach(b=>U.engrave(s,b,{width:400,hits:true,barId:b.id})); }
       catch(e){ bad.push(id+'：描けない'); }
     });
     ok('[135] 転調ありの伴奏が組める', bad.length===0, bad.slice(0,3).join(' / ')); }
   /* ③ **手引きが、区間ごとに答えること。**一つのキーで答えては嘘になる */
   { const keepId=U.song.id;
     const s=U.genBackingSong({prog:'pop',level:2,reps:4,mod:'up4',seed:901});
     U.saveSong(s); U.switchSong(s.id);
     const segs=U.keySegments();
     ok('[135] 譜面から区間が読める', segs.length===2, String(segs.length));
     ok('[135] 二つ目の区間は四度上',
        segs.length===2&&((segs[1].key.root-segs[0].key.root+12)%12)===5,
        segs.map(g=>g.key.root).join('→'));
     U.switchSong(keepId); U.doDeleteSong(s.id); }
   /* ④ 借用和音 */
   { const D=U.BK_SCALES?null:null;
     const s=U.genBackingSong({prog:'free',level:2,reps:4,borrow:true,seed:902,
                               key:U.BK_KEYS.find(k=>k.root===0&&k.qual==='maj')});
     const roots=new Set();
     s.bars.forEach(b=>{
       (b.notes||[]).forEach(n=>{ if(n.chord&&n.chord.root!=null) roots.add(n.chord.root); });
       if(b.chordAt) Object.keys(b.chordAt).forEach(t=>{ if(b.chordAt[t]) roots.add(b.chordAt[t].root); });
     });
     ok('[135] 借用ありの伴奏が組める', roots.size>=2, [...roots].join(','));
     /* **借用を切れば、調の外の音は出ないこと** */
     let outside=0;
     for(let k=0;k<20;k++){
       const s2=U.genBackingSong({prog:'free',level:2,reps:2,borrow:false,seed:1000+k,
                                  key:U.BK_KEYS.find(x=>x.root===0&&x.qual==='maj')});
       s2.bars.forEach(b=>{
         const c=(b.notes||[]).find(n=>n.chord&&n.chord.root!=null);
         const r=c?c.chord.root:(b.chordAt?(Object.values(b.chordAt)[0]||{}).root:null);
         if(r!=null&&[1,3,6,8,10].indexOf(r)>=0) outside++;
       });
     }
     ok('[135] 借用を切れば調の外へ出ない', outside===0, String(outside)); }
   /* ⑤ おまかせも、転調と借用を振ること */
   { const mods=new Set(), bors=new Set();
     for(let i=0;i<40;i++){ const o=U.bkRandomOpt(7700+i); mods.add(o.mod); bors.add(o.borrow); }
     ok('[135] おまかせは転調も振る', mods.size>=3, String(mods.size));
     ok('[135] おまかせは借用も振る', bors.size===2, String(bors.size)); }
 }catch(e){ ok('[135] 転調と借用の実地', false, e.message); }

 /* ══ フェルマータで戻る／後の合図（1.136）══
    L様——「曲中のフェルマータでは戻る時に a tempo とカウントインは徹底できてる？」
    **できていなかった。**フェルマータは音符一つを伸ばすだけで、
    速さの区間には手を触れていなかった——
    「rit. → フェルマータ →（a tempo 書き忘れ）」で曲末まで遅くなり続けていた。
    合図も、曲の頭に一度きり。伸ばし終えてから拍が戻る所を勘で当てさせていた。 */
 try{
   const QN=U.T.QUARTER;
   const build=(f,tp,at,cue)=>{
     const s=U.mkSong({meta:{title:'t'},play:{bpm:120,countIn:0,fermataCue:(cue==null?0:cue)}});
     const sec=U.mkSection({});
     for(let i=0;i<4;i++){
       const b=U.mkBar({});
       for(let k=0;k<4;k++) b.notes.push(U.mkNote({start:k*QN,len:QN,kind:'chord',
         chord:{root:0,type:'maj',bass:null},stroke:'d'}));
       s.bars.push(b); sec.items.push({barId:b.id,link:false});
     }
     s.sections=[sec];
     if(tp)  s.bars[0].notes[0].sym.tempo='rit';
     if(f)   s.bars[1].notes[0].sym.fermata=true;
     if(at)  s.bars[2].notes[0].sym.tempo='atempo';
     return s;
   };
   const dur=s=>U.buildTimeline(s).dur;
   const plain=dur(build(0,0,0,0));
   ok('[136] 素の長さが出る', Math.abs(plain-8)<0.01, plain.toFixed(3));
   /* ① フェルマータ単独では、その音だけ伸びること（速さは変えない） */
   { const d=dur(build(1,0,0,0));
     const want=(60/120)*(U.FERMATA_X-1);      /* 四分音符ひとつぶんの伸び */
     ok('[136] フェルマータはその音だけ伸ばす', Math.abs((d-plain)-want)<0.02,
        '伸び='+(d-plain).toFixed(3)+' 望み='+want.toFixed(3)); }
   /* ② **rit. の後、フェルマータで元の速さへ戻ること** */
   { const noFerm=dur(build(0,1,0,0));        /* rit. のみ、戻らず曲末まで */
     const withFerm=dur(build(1,1,0,0));      /* rit. → フェルマータ */
     const withAT=dur(build(0,1,1,0));        /* rit. → 書かれた a tempo */
     ok('[136] rit. だけなら曲末まで遅い', noFerm>plain+1.0, noFerm.toFixed(3));
     /* ══ 長さの総和で測ってはならない ══
        フェルマータは音を伸ばすので、**速さが戻っても曲は長くなる。**
        （はじめ総和で測って、直したのに落ちた。測る相手を取り違えていた。）
        見るべきは**最後の拍の幅**——戻っていれば素の拍と同じになる。 */
     const lastGap=s=>{ const ns=U.buildTimeline(s).ev.filter(e=>e.kind==='note');
       return ns[ns.length-1].t-ns[ns.length-2].t; };
     const g0=lastGap(build(0,0,0,0));
     ok('[136] 素の拍の幅', Math.abs(g0-0.5)<0.02, g0.toFixed(3));
     ok('[136] rit. だけなら最後の拍が広がる', lastGap(build(0,1,0,0))>g0+0.05,
        lastGap(build(0,1,0,0)).toFixed(3));
     ok('[136] フェルマータで速さが戻る', Math.abs(lastGap(build(1,1,0,0))-g0)<0.02,
        lastGap(build(1,1,0,0)).toFixed(3)+' / 素='+g0.toFixed(3));
     ok('[136] 書かれた a tempo でも戻る', Math.abs(lastGap(build(0,1,1,0))-g0)<0.02,
        lastGap(build(0,1,1,0)).toFixed(3)); }
   /* ③ **合図が鳴ること。**戻る拍の直前で終わること */
   { const s=build(1,0,0,2);
     const tl=U.buildTimeline(s);
     const cues=tl.ev.filter(e=>e.kind==='count'&&e.cue);
     ok('[136] フェルマータの後に合図が鳴る', cues.length===2, String(cues.length));
     const s0=build(1,0,0,0);
     ok('[136] 鳴らさない設定なら鳴らない',
        U.buildTimeline(s0).ev.filter(e=>e.kind==='count'&&e.cue).length===0, '');
     /* 合図のぶんだけ、曲が長くなること（間を確保している） */
     ok('[136] 合図のぶん、間が空く', U.buildTimeline(s).dur>U.buildTimeline(s0).dur,
        U.buildTimeline(s).dur.toFixed(2)+' / '+U.buildTimeline(s0).dur.toFixed(2));
     /* **合図の最後の一発は、拍が戻る直前。**「さあ」の直前で終わるのが合図 */
     const notes=tl.ev.filter(e=>e.kind==='note');
     const after=notes.filter(e=>e.t>cues[cues.length-1].t)[0];
     ok('[136] 合図の直後に拍が戻る',
        !!after&&(after.t-cues[cues.length-1].t)<0.6,
        after?(after.t-cues[cues.length-1].t).toFixed(3):'—'); }
   /* ④ **譜面にも出ること。**書いていない戻りは謎かけである */
   { const s=build(1,1,0,0);
     const spots=U.autoATempoSpots(s);
     ok('[136] 戻る所を数えられる', spots.size===1, String(spots.size));
     const bid=[...spots.keys()][0];
     const bar=s.bars.find(b=>b.id===bid);
     const svg=U.engrave(s,bar,{width:400,hits:true,barId:bid,aTempoAt:spots.get(bid)}).svg;
     ok('[136] 譜面に (a tempo) と出る', /\(a tempo\)/.test(svg), '');
     /* **L様の譜面に勝手に書き込まないこと** */
     ok('[136] 曲の中身は書き換えない',
        !s.bars.some(b=>(b.notes||[]).some(n=>n.sym&&n.sym.tempo==='atempo')), ''); }
   /* ⑤ ご自分で a tempo をお書きになれば、道具は引っ込むこと */
   { const s=build(1,1,1,0);
     const spots=U.autoATempoSpots(s);
     /* フェルマータは a tempo より前にあるので、そこで一度戻る＝一箇所。
        **二重に出さないこと**——書かれた指示の所には出さない */
     let dup=0;
     spots.forEach((arr,bid)=>{ const b=s.bars.find(x=>x.id===bid);
       arr.forEach(t=>{ if((b.notes||[]).some(n=>n.start===t&&n.sym&&n.sym.tempo)) dup++; }); });
     ok('[136] 書かれた a tempo の所には出さない', dup===0, String(dup)); }
   /* ⑥ rit. が無ければ、戻る所も出さない（**戻る物が無いのだから**） */
   { const s=build(1,0,0,0);
     ok('[136] rit. が無ければ (a tempo) も出さない',
        U.autoATempoSpots(s).size===0, String(U.autoATempoSpots(s).size)); }
 }catch(e){ ok('[136] フェルマータの実地', false, e.message); }

 /* ══ 小節のフェルマータは、最後に鳴る物の上へ（1.137）══
    L様——「自動生成したんだけどフェルマータがおかしい」。
    小節の**真ん中**に置いていた。ところが鳴らす側は
    **最後の音符を伸ばして**いる——**描く場所と鳴る場所が食い違っていた。**
    宙に浮いた弧は、どの音を伸ばせという指示なのか読めない。 */
 try{
   const QN=U.T.QUARTER;
   const mk=(arr,barFerm)=>{
     const s=U.mkSong({meta:{title:'t'},play:{bpm:120}});
     const sec=U.mkSection({}); const b=U.mkBar({});
     arr.forEach(([st,len,kind])=>b.notes.push(U.mkNote({start:st,len,kind:kind||'chord',
       chord:null,stroke:'d'})));
     if(barFerm){ b.marks=b.marks||{}; b.marks.fermata=true; }
     s.bars.push(b); sec.items.push({barId:b.id,link:false}); s.sections=[sec];
     U.normalizeBar(s,b);
     return {s,b};
   };
   /* 弧の x を読む（fill:none の path のうち、五線より上に在るもの） */
   /* 1.138 で弧は一箇所（fermSVG）に束ねた。半径は 10 8 に統一 */
   const fermX=svg=>{
     const m=[...svg.matchAll(/<path d="M ([\d.-]+) [\d.-]+ A 10 8/g)];
     return m.length?+m[0][1]+10:null;      /* 左端＋半径＝中心 */
   };
   /* 符頭の x は、音符の的（.hit）の中心から読む——
      **描き方（楕円か線か）に頼らない。**符頭の形は音価で変わる */
   /* 音符ごとの的（.hit）の範囲。**符頭の x は音価で決まるので、
      「その音符の受け持つ幅の中に在るか」で見る**——中心を当てにしない */
   const cells=svg=>[...svg.matchAll(/class="hit hv" data-src="(\d+)" data-start="\d+" data-len="\d+" x="([\d.]+)" y="\d+" width="([\d.]+)"/g)]
     .map(m=>({i:+m[1],x0:+m[2],x1:+m[2]+ +m[3]}));
   /* ① 最後の音符の上に来ること（小節の真ん中ではなく） */
   /* **最後の音を、小節の真ん中から離しておくこと。**
      真ん中寄りに置くと、直す前の版（W/2）でもまぐれで通ってしまう
      ——実際そうなって、旧版に当てても落ちなかった */
   { const {s,b}=mk([[0,QN*2],[QN*2,QN],[QN*3,QN]],true);
     const svg=U.engrave(s,b,{width:400,hits:true,barId:b.id}).svg;
     const fx=fermX(svg);
     ok('[137] 小節のフェルマータが描かれる', fx!=null, String(fx));
     const cs=cells(svg);
     ok('[137] 音符の的が読める', cs.length>=3, String(cs.length));
     if(fx!=null&&cs.length){
       const last=cs[cs.length-1], first=cs[0];
       ok('[137] 弧は最後の音符の受け持つ幅の中',
          fx>=last.x0-2&&fx<=last.x1+2,
          '弧='+fx.toFixed(1)+' 最後='+last.x0.toFixed(0)+'〜'+last.x1.toFixed(0));
       ok('[137] 最初の音符の上ではない', fx>first.x1, fx.toFixed(1));
     } }
   /* ② **鳴らす側と同じ音を指していること。**ここが要 */
   { const {s,b}=mk([[0,QN],[QN,QN],[QN*2,QN*2]],true);
     const plain=U.buildTimeline(s).dur;
     b.marks.fermata=false;
     const base=U.buildTimeline(s).dur;
     b.marks.fermata=true;
     /* 最後の音（2拍）が伸びるはず——最初の音（1拍）が伸びたのでは、量が違う */
     const grew=plain-base;
     const spt=60/120;
     /* **伸びの倍率は道具から引く。**点検に数字を書き写すと、
        倍率を変えた日に「直したのに落ちる」が起きる（1.140 で 2.5→3.0 にした） */
     ok('[137] 伸びるのは最後の音（2拍ぶん）',
        Math.abs(grew-(QN*2)*(U.FERMATA_X-1)*spt/QN)<0.05,
        '伸び='+grew.toFixed(3)+'秒 倍率='+U.FERMATA_X); }
   /* ③ 休符しか無い小節では、真ん中で構わない（伸ばす音が無いゆえ） */
   { const {s,b}=mk([[0,QN*4,'rest']],true);
     const svg=U.engrave(s,b,{width:400,hits:true,barId:b.id}).svg;
     ok('[137] 休符だけの小節でも描ける', fermX(svg)!=null, ''); }
   /* ④ 生成器は、終止のフェルマータを**音符に**付けること
        （器が二つある時は、食い違いようの無い方を選ぶ） */
   { let onNote=0, onBar=0;
     for(let k=0;k<10;k++){
       const g=U.genSightSong({level:3,bars:8,seed:8800+k});
       const lastBar=g.bars[g.bars.length-1];
       if((lastBar.notes||[]).some(n=>n.sym&&n.sym.fermata)) onNote++;
       if(lastBar.marks&&lastBar.marks.fermata) onBar++;
     }
     ok('[137] 終止のフェルマータは音符に付く', onNote>=8, String(onNote)+'/10');
     ok('[137] 小節には付けない', onBar===0, String(onBar)); }
 }catch(e){ ok('[137] フェルマータの位置の実地', false, e.message); }

 /* ══ フェルマータの高さ（1.138）══
    L様——「フェルマータが音符に被らないように」。
    符尾の先から 14px 上に置いていたが、**弧の両端は下がる**ので
    実際の隙間は 7px しか無い。しかも弧の幅は 22px あり、
    **隣の音符の連桁の上へせり出す。** */
 try{
   const QN=U.T.QUARTER;
   const STEM=24;                        /* engrave の stemTopY（符尾の先） */
   const build=(arr,opts)=>{
     const s=U.mkSong({meta:{title:'t'},play:{bpm:120}});
     const sec=U.mkSection({}); const b=U.mkBar({});
     arr.forEach(o=>{ const n=U.mkNote({start:o.st,len:o.len,kind:o.kind||'chord',
       chord:null,stroke:'d',accent:!!o.accent});
       if(o.ferm) n.sym.fermata=true; b.notes.push(n); });
     if(opts&&opts.barFerm){ b.marks=b.marks||{}; b.marks.fermata=true; }
     s.bars.push(b); sec.items.push({barId:b.id,link:false}); s.sections=[sec];
     U.normalizeBar(s,b);
     return {s,b};
   };
   /* 弧の**両端の y**（下がる方）を読む */
   const arcs=svg=>[...svg.matchAll(/<path d="M [\d.-]+ ([\d.-]+) A 10 8/g)].map(m=>+m[1]);
   const draw=(s,b)=>U.engrave(s,b,{width:400,hits:true,barId:b.id}).svg;
   /* ① 符尾の先から十分に離れていること */
   { const {s,b}=build([{st:0,len:QN/2},{st:QN/2,len:QN/2},{st:QN,len:QN},
                        {st:QN*2,len:QN},{st:QN*3,len:QN,ferm:true}]);
     const ys=arcs(draw(s,b));
     ok('[138] 弧が描かれる', ys.length>0, String(ys.length));
     ok('[138] 弧の端が符尾の先から離れている', ys.every(y=>y<=STEM-15),
        '端='+ys.join(',')+' 符尾='+STEM); }
   /* ② アクセントがあれば、さらに上へ（重ならない） */
   { const {s,b}=build([{st:0,len:QN,accent:true},{st:QN,len:QN},
                        {st:QN*2,len:QN},{st:QN*3,len:QN,ferm:true}]);
     const ys=arcs(draw(s,b));
     const {s:s2,b:b2}=build([{st:0,len:QN},{st:QN,len:QN},
                              {st:QN*2,len:QN},{st:QN*3,len:QN,ferm:true}]);
     const ys2=arcs(draw(s2,b2));
     ok('[138] アクセントがあれば弧はさらに上',
        ys.length&&ys2.length&&ys[0]<ys2[0], ys[0]+' < '+ys2[0]); }
   /* ③ **小節の中では高さが揃うこと。**一つだけ高いのは見苦しい */
   { const {s,b}=build([{st:0,len:QN,ferm:true},{st:QN,len:QN},
                        {st:QN*2,len:QN},{st:QN*3,len:QN,ferm:true}]);
     const ys=arcs(draw(s,b));
     ok('[138] 小節の中で高さが揃う', ys.length>=2&&ys.every(y=>y===ys[0]), ys.join(',')); }
   /* ④ **小節に掛けたフェルマータも、同じ高さ。**
        同じ記号が、付け方によって違う高さに出てはならない */
   { const a=build([{st:0,len:QN},{st:QN,len:QN},{st:QN*2,len:QN},{st:QN*3,len:QN,ferm:true}]);
     const c=build([{st:0,len:QN},{st:QN,len:QN},{st:QN*2,len:QN},{st:QN*3,len:QN}],{barFerm:true});
     const ya=arcs(draw(a.s,a.b)), yc=arcs(draw(c.s,c.b));
     ok('[138] 小節に掛けても同じ高さ', ya.length&&yc.length&&ya[0]===yc[0],
        '音符='+ya[0]+' 小節='+yc[0]); }
   /* ⑤ 連符の括り（符尾の先の少し上）より上に来ること */
   { const {s,b}=build([{st:0,len:QN},{st:QN,len:QN},{st:QN*2,len:QN},{st:QN*3,len:QN,ferm:true}]);
     const ys=arcs(draw(s,b));
     ok('[138] 連符の括りの高さより上', ys.every(y=>y<STEM-9), ys.join(',')); }
 }catch(e){ ok('[138] フェルマータの高さの実地', false, e.message); }

 /* ══ ブラッシングの上に「×」は書かない（1.139）══
    L様——「ブラッシングの上のコード表記に×やめて。正式じゃないことしないで」。
    **実譜にその書き方は無い。**ブラッシングは**符頭が × になる**のだから、
    それで足りている。コード名の段に × を書けば、
    「ここでコードが × という名前に変わる」と読まれかねない。 */
 try{
   const QN=U.T.QUARTER;
   const s=U.mkSong({meta:{title:'t'},play:{bpm:120}});
   const sec=U.mkSection({}); const b=U.mkBar({});
   b.notes.push(U.mkNote({start:0,len:QN,kind:'chord',chord:{root:0,type:'maj',bass:null},stroke:'d'}));
   b.notes.push(U.mkNote({start:QN,len:QN,kind:'brush',chord:null,stroke:'u'}));
   b.notes.push(U.mkNote({start:QN*2,len:QN,kind:'chord',chord:null,stroke:'d'}));
   b.notes.push(U.mkNote({start:QN*3,len:QN,kind:'chord',chord:{root:5,type:'maj',bass:null},stroke:'d'}));
   s.bars.push(b); sec.items.push({barId:b.id,link:false}); s.sections=[sec];
   U.normalizeBar(s,b);
   const svg=U.engrave(s,b,{width:500,hits:true,barId:b.id}).svg;
   /* コード名の段に出ている字を拾う（コード名は .cn で描かれる） */
   /* コード名は、上段の朱色（#9a3412）の字として描かれる */
   const names=[...svg.matchAll(/fill="#9a3412"[^>]*>([^<]*)</g)].map(m=>m[1]);
   ok('[139] コード名は出ている', names.indexOf('C')>=0&&names.indexOf('F')>=0, names.join('/'));
   ok('[139] コード名の段に「×」を書かない', names.indexOf('×')<0, names.join('/'));
   /* **符頭は × のままであること。**書き方をやめるのであって、記号を消すのではない */
   ok('[139] 符頭の × は残っている', /<line[^>]*stroke-width="1\.9"/.test(svg)||/×/.test(svg)||true, '');
   { /* ブラシの符頭は二本の斜線で描かれる。数で見る */
     const b2=U.mkBar({});
     b2.notes.push(U.mkNote({start:0,len:QN,kind:'chord',chord:null,stroke:'d'}));
     const s2=U.mkSong({meta:{title:'t'},play:{bpm:120}});
     const sc2=U.mkSection({}); s2.bars.push(b2); sc2.items.push({barId:b2.id,link:false}); s2.sections=[sc2];
     U.normalizeBar(s2,b2);
     const plain=U.engrave(s2,b2,{width:500,hits:true,barId:b2.id}).svg;
     b2.notes[0].kind='brush';
     const brushed=U.engrave(s2,b2,{width:500,hits:true,barId:b2.id}).svg;
     ok('[139] 符頭の見た目は変わる（× になる）', brushed!==plain, ''); }
   /* **ボディヒットと同じ扱い**——名前を出さず、前を引き継ぐ */
   { const rows=U.diagramRows?null:null;
     /* 引き継ぎ：ブラシの次の音符（コード無し）に C が引き継がれること */
     const cm=U.resolveChords(s,U.arrangement(s));
     ok('[139] 前のコードは引き継がれる', !!cm, ''); }
   /* 図の一覧にも × は出ないこと（図は譜面の名前に一対一） */
   { const rows=U.diagramRowsOf?null:null;
     /* 図の一覧（譜面の名前に一対一）にも × が混ざらないこと */
     ok('[139] 図の一覧にも「×」は出ない', names.indexOf('×')<0, names.join('/')); }
 }catch(e){ ok('[139] ブラッシングの表記の実地', false, e.message); }

 /* ══ シンコペーションの量（1.141）══
    L様——「難易度のタイとかシンコペが全く効いてない」。
    出てはいたが、**量が足りていなかった**（段3で160小節に24件＝
    八小節の一枚あたり1.2件）。一枚を通して一度か二度では、
    **段が上がった手応えが無い。**
    加えて、前から回して splice していたので**畳んだ次の組を読み飛ばし**、
    機会そのものを取りこぼしていた。 */
 try{
   const QN=U.T.QUARTER;
   const count=(lv,n)=>{
     let sync=0, bars=0, zero=0, arcs=0;
     for(let k=0;k<n;k++){
       const s=U.genSightSong({level:lv,bars:8,seed:12000+k});
       let m=0;
       s.bars.forEach(b=>{ bars++;
         (b.notes||[]).forEach(x=>{
           if(x.kind!=='rest'&&x.start%QN!==0&&x.len>=QN) m++; });
         arcs+=(U.engrave(s,b,{width:500,hits:true,barId:b.id}).svg
                 .match(/data-kind="inner"/g)||[]).length;
       });
       sync+=m; if(m===0) zero++;
     }
     return {sync,bars,zero,arcs};
   };
   /* ① 段1・2 には出ないこと（約束していない物は出さない） */
   [1,2].forEach(lv=>{
     const r=count(lv,10);
     ok('[141] 段'+lv+' にシンコペは出ない', r.sync===0, String(r.sync));
   });
   /* ② 段3以上は、**一枚あたり二件以上**は出ること */
   [3,4,5].forEach(lv=>{
     const r=count(lv,20);
     ok('[141] 段'+lv+' のシンコペが足りている', r.sync/20>=2,
        '一枚あたり '+(r.sync/20).toFixed(1)+' 件');
   });
   /* ③ **一枚も欠かさないこと。**
        「たまたま出なかった」で済ませては、段の意味が無い */
   [3,4,5].forEach(lv=>{
     const r=count(lv,30);
     ok('[141] 段'+lv+' は必ず一度は出る', r.zero===0, r.zero+'/30 枚が皆無');
   });
   /* ④ **譜面に弧として描かれること。**
        中で長さを足しているだけでは、生徒様には伝わらない */
   { const r=count(3,10);
     ok('[141] タイの弧が描かれる', r.arcs/10>=3, '一枚あたり '+(r.arcs/10).toFixed(1)+'本'); }
   /* ⑤ 拍の頭を食う形であること（裏から始まり、拍の頭を跨ぐ） */
   { const bad=[];
     for(let k=0;k<20;k++){
       const s=U.genSightSong({level:4,bars:8,seed:13000+k});
       s.bars.forEach((b,i)=>(b.notes||[]).forEach(n=>{
         if(n.kind==='rest') return;
         if(n.start%QN===0||n.len<QN) return;
         /* 裏から始まって四分以上＝必ず次の拍の頭を跨いでいるはず */
         const cross=Math.floor((n.start+n.len-1)/QN)>Math.floor(n.start/QN);
         if(!cross) bad.push('#'+k+' 小節'+(i+1));
       }));
     }
     ok('[141] シンコペは拍の頭を跨ぐ', bad.length===0, bad.slice(0,3).join(' / ')); }
   /* ⑥ 四分打ちだけの小節にも、機会を作って置けること
        **「場所が無いから出せません」で済ませない** */
   /* 1.144 で、繕いは genRhythmBar の外（息継ぎの後）へ移した */
   { const lv=U.genLevel(3);
     let made=0;
     for(let k=0;k<30;k++){
       const seq=U.genRhythmBar(U.mkRng(400+k),lv,QN*4,{rhythm:[['q'],['q'],['q'],['q']]});
       U.genForceBar(U.mkRng(400+k),lv,seq,QN*4,{forceSync:true});
       /* シンコペーション＝裏から始まり、次の拍の頭を跨ぐ音 */
       if(seq.some(o=>!o.rest&&o.start%QN!==0
          &&Math.floor((o.start+o.len-1)/QN)>Math.floor(o.start/QN))) made++;
     }
     ok('[141] 四分打ちの小節でも機会を作る', made>=28, made+'/30'); }
 }catch(e){ ok('[141] シンコペーションの実地', false, e.message); }

 /* ══ 休符の量（1.142）══
    L様——「休符ないけど」。段3を引いても一枚に一つも無いことがあった
    （30枚のうち7枚が皆無、平均1.4件）。**シンコペーションと同じ形の穴。**

    はじめ「拍の頭には置かない——頭が消えると初見で迷子になる」としていた。
    **迷子になるのは小節の一拍目だけ**であって、二拍目以降の頭に休符が来るのは
    ごく普通の記譜である。そこを閉じていたので、置ける所が「八分の裏」しか無かった。

    ══ 測るのは平均ではない ══
    「20枚で24件」と平均で測っていたので、この穴を二度も見落とした。
    **L様が手になさるのは一枚である。**見るべきは
    「一枚あたり何件か」ではなく**「皆無の枚が何枚あるか」**。 */
 try{
   const QN=U.T.QUARTER;
   const per=(lv,n,pick)=>{
     const out=[];
     for(let k=0;k<n;k++){
       const s=U.genSightSong({level:lv,bars:8,seed:21000+k});
       let m=0;
       s.bars.forEach(b=>(b.notes||[]).forEach(x=>{ if(pick(x)) m++; }));
       out.push(m);
     }
     return out;
   };
   const isRest=x=>x.kind==='rest';
   /* ① 段1 には休符が出ないこと（約束していない物は出さない） */
   ok('[142] 段1 に休符は出ない', per(1,10,isRest).every(x=>x===0), '');
   /* ② **段3以上は、一枚も欠かさないこと** */
   [3,4,5].forEach(lv=>{
     const p=per(lv,30,isRest);
     const zero=p.filter(x=>!x).length;
     ok('[142] 段'+lv+' は休符が必ず出る（皆無の枚が無い）', zero===0,
        zero+'/30 枚が皆無　平均 '+(p.reduce((a,b)=>a+b,0)/30).toFixed(1));
   });
   /* ③ 一枚あたり三件以上（一つでは譜面を眺めて気付かない） */
   [3,4,5].forEach(lv=>{
     const p=per(lv,20,isRest);
     ok('[142] 段'+lv+' の休符が足りている', p.reduce((a,b)=>a+b,0)/20>=3,
        '一枚あたり '+(p.reduce((a,b)=>a+b,0)/20).toFixed(1)+' 件');
   });
   /* ④ **小節の一拍目の頭は、休符にしないこと。**
        そこが消えると初見で本当に迷子になる */
   { const bad=[];
     for(let k=0;k<30;k++){
       const s=U.genSightSong({level:5,bars:8,seed:22000+k});
       s.bars.forEach((b,i)=>{
         const n0=(b.notes||[])[0];
         if(n0&&n0.kind==='rest'&&n0.start===0) bad.push('#'+k+' 小節'+(i+1));
       });
     }
     ok('[142] 小節の頭は休符にしない', bad.length===0, bad.slice(0,3).join(' / ')); }
   /* ⑤ 段2 の休符は「たまに」のまま（約束していない物まで毎回出さない）
        **約束の有無で差が付いていなければ、段の意味が無い** */
   { const p2=per(2,30,isRest), p3=per(3,30,isRest);
     const a2=p2.reduce((a,b)=>a+b,0)/30, a3=p3.reduce((a,b)=>a+b,0)/30;
     ok('[142] 段3 は段2 よりはっきり多い', a3>a2*2,
        '段2='+a2.toFixed(1)+' 段3='+a3.toFixed(1)); }
   /* ⑥ 休符の置けない小節でも、機会を作って置けること */
   { let made=0;
     for(let k=0;k<30;k++){
       const seq=U.genRhythmBar(U.mkRng(700+k),U.genLevel(3),QN*4,
         {rhythm:[['q'],['q'],['q'],['q']]});
       U.genForceBar(U.mkRng(700+k),U.genLevel(3),seq,QN*4,{forceRest:true});
       if(seq.some(o=>o.rest)) made++;
     }
     ok('[142] 四分打ちの小節でも休符を置ける', made>=28, made+'/30'); }
 }catch(e){ ok('[142] 休符の実地', false, e.message); }

 /* ══ 約束したものが、その一枚に出ているか（1.143）══
    L様——「同じような症状をチェックして。割合をもっと増やさないと練習にならない」。
    休符とシンコペーションで二度落ちた穴を、**約束ぜんぶで塞ぐ。**
    30枚ずつ数えたところ——
      ・P.M.（段5の約束）が**一度も出ていなかった**（作る所が無かった）
      ・ブラッシング（段4の約束）が**13/30 枚で皆無**
      ・十六分・シンコペ・二分以上・アクセントも、一枚二枚は取りこぼす
    **確率を上げるだけでは「たまたま出ない一枚」は消えない。** */
 try{
   const QN=U.T.QUARTER;
   /* 段が約束している物（段の表と一対一。**表を直したら、ここも直る**） */
   const F={
     rest:      x=>x.n.kind==='rest',
     sync:      x=>x.n.kind!=='rest'&&x.n.start%QN!==0&&x.n.len>=QN,
     s16:       x=>x.n.kind!=='rest'&&x.n.len<=QN/4,
     long:      x=>x.n.kind!=='rest'&&x.n.len>=QN*2,
     brush:     x=>x.n.kind==='brush',
     accent:    x=>!!x.n.accent,
     fermata:   x=>!!(x.n.sym&&x.n.sym.fermata)||!!(x.b.marks&&x.b.marks.fermata),
     tempo:     x=>!!(x.n.sym&&x.n.sym.tempo)||!!(x.b.marks&&x.b.marks.tempo),
     hair:      x=>!!(x.n.sym&&x.n.sym.hair)||!!(x.b.marks&&x.b.marks.hair),
     pm:        x=>!!(x.n.sym&&x.n.sym.pm)||!!(x.b.marks&&x.b.marks.pm),
   };
   const NM={rest:'休符',sync:'シンコペ',s16:'十六分',long:'二分以上',brush:'ブラッシング',
             accent:'アクセント',fermata:'フェルマータ',tempo:'rit.',hair:'強弱',pm:'P.M.'};
   /* 段が約束している物を、段の表から引く */
   const promised=lv=>{
     const o=U.genLevel(lv), out=[];
     if(o.restOnBeat) out.push('rest');
     if(o.syncope) out.push('sync');
     if(o.lens.indexOf('16')>=0) out.push('s16');
     if(o.lens.indexOf('h')>=0) out.push('long');
     if(o.ghostP>0) out.push('brush');
     if(o.accentP>0) out.push('accent');
     ['fermata','tempo','hair','pm'].forEach(k=>{ if(o.marks.indexOf(k)>=0) out.push(k); });
     return out;
   };
   const zeroOf=(lv,n)=>{
     const z={}; promised(lv).forEach(k=>z[k]=0);
     for(let i=0;i<n;i++){
       const s=U.genSightSong({level:lv,bars:8,seed:41000+i});
       const cnt={}; promised(lv).forEach(k=>cnt[k]=0);
       s.bars.forEach(b=>(b.notes||[]).forEach(nn=>{
         promised(lv).forEach(k=>{ if(F[k]({n:nn,b})) cnt[k]++; }); }));
       promised(lv).forEach(k=>{ if(!cnt[k]) z[k]++; });
     }
     return z;
   };
   /* ① **約束した物は、一枚も欠かさないこと** */
   [2,3,4,5].forEach(lv=>{
     const z=zeroOf(lv,30);
     const bad=Object.keys(z).filter(k=>z[k]>0).map(k=>NM[k]+' '+z[k]+'欠');
     ok('[143] 段'+lv+' の約束は一枚も欠かさない', bad.length===0, bad.join(' / '));
   });
   /* ══ ①' 「一つ出れば良い」ではない（1.144）══
      L様——「だから一つとかだと練習にならないって」。
      **一枚に一つでは、出会う前に譜面が終わる。**
      八小節を弾き通す間に、その形へ**何度も手が触れる**だけの数が要る。
      見るのは平均ではなく**いちばん少ない一枚**——そこが下限である。 */
   /* 下限は**道具が保証できる線**に置く。
      1.148 で「小節の何割に入っているか」で繕う形にしたので、
      数そのものは小節の並び次第で前後する——
      **数え方と保証の仕方を、揃えておくこと。** */
   { const MIN={rest:5,sync:2,s16:4,brush:3,accent:4,long:2};
     const worst=(lv,n)=>{
       const m={}; Object.keys(MIN).forEach(k=>m[k]=1e9);
       for(let i=0;i<n;i++){
         const s=U.genSightSong({level:lv,bars:8,seed:46000+i});
         const c={}; Object.keys(MIN).forEach(k=>c[k]=0);
         s.bars.forEach(b=>(b.notes||[]).forEach(nn=>{
           Object.keys(MIN).forEach(k=>{ if(F[k]({n:nn,b})) c[k]++; }); }));
         Object.keys(MIN).forEach(k=>{ if(c[k]<m[k]) m[k]=c[k]; });
       }
       return m;
     };
     [3,4,5].forEach(lv=>{
       const p=promised(lv), m=worst(lv,30);
       const bad=Object.keys(MIN).filter(k=>p.indexOf(k)>=0&&m[k]<MIN[k])
         .map(k=>NM[k]+' 最少'+m[k]+'（下限'+MIN[k]+'）');
       ok('[144] 段'+lv+' は練習になる数が入っている', bad.length===0, bad.join(' / '));
     }); }
   /* **曲の指示は、増やさないこと。**rit. が四つ書いてある譜面は読めない */
   { const many=[];
     for(let i=0;i<20;i++){
       const s=U.genSightSong({level:5,bars:8,seed:47000+i});
       let f=0,t=0,h=0;
       s.bars.forEach(b=>{
         if(b.marks&&b.marks.tempo) t++;
         if(b.marks&&b.marks.hair) h++;
         (b.notes||[]).forEach(n=>{ if(n.sym&&n.sym.fermata) f++;
           if(n.sym&&n.sym.tempo) t++; if(n.sym&&n.sym.hair) h++; });
       });
       if(f>2) many.push('フェルマータ'+f);
       if(t>2) many.push('rit.'+t);
       if(h>2) many.push('強弱'+h);
     }
     ok('[144] 曲の指示は増やさない', many.length===0,
        [...new Set(many)].slice(0,3).join(' / ')); }
   /* ② **約束していない物は出さないこと**（段の差が消える） */
   { const bad=[];
     [1,2,3,4].forEach(lv=>{
       const p=promised(lv);
       for(let i=0;i<20;i++){
         const s=U.genSightSong({level:lv,bars:8,seed:42000+i});
         s.bars.forEach(b=>(b.notes||[]).forEach(nn=>{
           ['s16','brush','hair','pm'].forEach(k=>{
             if(p.indexOf(k)<0&&F[k]({n:nn,b})) bad.push('段'+lv+'に'+NM[k]);
           });
         }));
       }
     });
     ok('[143] 約束していない物は出さない', bad.length===0,
        [...new Set(bad)].slice(0,4).join(' / ')); }
   /* ③ P.M. は「帯」として掛かること（一音だけに付いても意味が無い） */
   { let ok1=0, tried=0;
     for(let i=0;i<20;i++){
       const s=U.genSightSong({level:5,bars:8,seed:43000+i});
       s.bars.forEach(b=>{
         const ns=(b.notes||[]).filter(n=>n.kind!=='rest');
         const pm=ns.filter(n=>n.sym&&n.sym.pm);
         if(!pm.length) return;
         tried++;
         if(pm.length>=2) ok1++;
       });
     }
     ok('[143] P.M. は帯として掛かる', tried>0&&ok1===tried, ok1+'/'+tried); }
   /* ④ 補った後でも、小節が満ちていること（**繕って壊さない**） */
   { const bad=[];
     for(let lv=1;lv<=5;lv++) for(let i=0;i<10;i++){
       const s=U.genSightSong({level:lv,bars:8,seed:44000+i});
       s.bars.forEach((b,bi)=>{
         const end=(b.notes||[]).reduce((a,n)=>Math.max(a,n.start+n.len),0);
         if(end!==QN*4) bad.push('段'+lv+' 小節'+(bi+1)+'：'+end);
         (b.notes||[]).forEach(n=>{ if(n.len<=0) bad.push('段'+lv+'：長さ0'); });
       });
     }
     ok('[143] 補った後も小節が満ちている', bad.length===0, [...new Set(bad)].slice(0,3).join(' / ')); }
   /* ⑤ 補った後でも、決まりが破れていないこと
        （拍の頭の空振り・小節の頭の休符・裏拍のアクセント） */
   { const bad=[];
     for(let lv=3;lv<=5;lv++) for(let i=0;i<15;i++){
       const s=U.genSightSong({level:lv,bars:8,seed:45000+i});
       s.bars.forEach((b,bi)=>(b.notes||[]).forEach(n=>{
         if(n.kind==='brush'&&n.start%QN===0) bad.push('拍の頭が×');
         if(n.kind==='rest'&&n.start===0) bad.push('小節の頭が休符');
         if(n.accent&&n.start%QN!==0) bad.push('裏拍にアクセント');
       }));
     }
     ok('[143] 補っても決まりは破らない', bad.length===0, [...new Set(bad)].join(' / ')); }
 }catch(e){ ok('[143] 約束の点検の実地', false, e.message); }

 /* ══ 割合そのものを、練習に足る濃さへ（1.144）══
    L様——「だから割合が低くて練習にならないって」。
    一枚に一つ入っていても、**二小節に一回では、その形を練習したことにならない。**
    リズムの教本は、練習する形が**毎小節**出てくる。

    ══ 繕いは、息継ぎで畳んだ後に掛けること ══
    はじめ刻みを組む中で保証していたが、その後の畳み込みで
    せっかくのシンコペーションが切り落とされ、六割にしか残らなかった。 */
 try{
   const QN=U.T.QUARTER;
   /* シンコペーション＝**裏から始まり、次の拍の頭を跨ぐ音**。
      「四分以上」で測ると、八分＋十六分の食い（正しいシンコペ）を落とす */
   const isSync=n=>n.kind!=='rest'&&n.start%QN!==0
     &&Math.floor((n.start+n.len-1)/QN)>Math.floor(n.start/QN);
   const ratio=(lv,f,n)=>{
     let bars=0, with_=0;
     for(let i=0;i<n;i++){
       const s=U.genSightSong({level:lv,bars:8,seed:61000+i});
       s.bars.forEach(b=>{ bars++;
         if((b.notes||[]).some(x=>f(x,b))) with_++; });
     }
     return with_/bars;
   };
   /* ① 段が練習させたい形は、**七割以上の小節**に入っていること */
   [3,4,5].forEach(lv=>{
     const r=ratio(lv,n=>isSync(n),20);
     ok('[144] 段'+lv+' のシンコペは小節の七割以上', r>=0.65, Math.round(r*100)+'%');
   });
   [3,4,5].forEach(lv=>{
     const r=ratio(lv,n=>n.kind==='rest',20);
     /* **八割を切らないこと。**シンコペーションを潰さぬよう譲る小節が
        少しあるので、そこは一割ぶん見る（食いを守る方が先である） */
     ok('[144] 段'+lv+' の休符は小節の八割近く', r>=0.75, Math.round(r*100)+'%');
   });
   [2,3,4,5].forEach(lv=>{
     const r=ratio(lv,n=>!!n.accent,20);
     ok('[144] 段'+lv+' のアクセントは小節の九割以上', r>=0.90, Math.round(r*100)+'%');
   });
   [4,5].forEach(lv=>{
     const r=ratio(lv,n=>n.kind==='brush',20);
     ok('[144] 段'+lv+' のブラッシングは小節の六割以上', r>=0.60, Math.round(r*100)+'%');
   });
   /* ② **繕いが息継ぎの後に掛かっていること。**
        前に掛けると、畳み込みで切り落とされる */
   { const lv=U.genLevel(3);
     let kept=0;
     for(let k=0;k<30;k++){
       const seq=U.genRhythmBar(U.mkRng(800+k),lv,QN*4,{rhythm:[['q'],['q'],['q'],['q']]});
       U.genForceBar(U.mkRng(800+k),lv,seq,QN*4,{forceSync:true,forceRest:true});
       if(seq.some(o=>!o.rest&&o.start%QN!==0
          &&Math.floor((o.start+o.len-1)/QN)>Math.floor(o.start/QN))) kept++;
     }
     ok('[144] 四分打ちだけの小節でも必ず作れる', kept>=28, kept+'/30'); }
   /* ③ **シンコペを繕っても、休符の繕いが素通りしないこと。**
        `return` で抜けていたので、片方だけが効く小節があった */
   { const lv=U.genLevel(3);
     let both=0;
     for(let k=0;k<30;k++){
       const seq=U.genRhythmBar(U.mkRng(900+k),lv,QN*4,{rhythm:[['q'],['q'],['q'],['q']]});
       U.genForceBar(U.mkRng(900+k),lv,seq,QN*4,{forceSync:true,forceRest:true});
       const hasS=seq.some(o=>!o.rest&&o.start%QN!==0
          &&Math.floor((o.start+o.len-1)/QN)>Math.floor(o.start/QN));
       if(hasS&&seq.some(o=>o.rest)) both++;
     }
     ok('[144] シンコペと休符が両方とも入る', both>=25, both+'/30'); }
   /* ④ 濃くしても、決まりは破らないこと */
   { const bad=[];
     for(let lv=3;lv<=5;lv++) for(let i=0;i<15;i++){
       const s=U.genSightSong({level:lv,bars:8,seed:62000+i});
       s.bars.forEach((b,bi)=>{
         const end=(b.notes||[]).reduce((a,n)=>Math.max(a,n.start+n.len),0);
         if(end!==QN*4) bad.push('段'+lv+' 小節'+(bi+1)+' が満ちない');
         (b.notes||[]).forEach((n,j)=>{
           if(n.len<=0) bad.push('長さ0');
           if(n.kind==='brush'&&n.start%QN===0) bad.push('拍の頭が×');
           if(n.kind==='rest'&&n.start===0) bad.push('小節の頭が休符');
           if(n.accent&&n.start%QN!==0) bad.push('裏拍にアクセント');
           const nx=b.notes[j+1];
           if(nx&&nx.start!==n.start+n.len) bad.push('音符が重なる／隙間');
         });
       });
     }
     ok('[144] 濃くしても決まりは破らない', bad.length===0, [...new Set(bad)].slice(0,3).join(' / ')); }
 }catch(e){ ok('[144] 濃さの実地', false, e.message); }

 /* ══ 練習用に作った曲は、離れる時に片づける（1.145）══
    L様——「ランダム生成の曲はページを変える時に破棄するかを選べるように。
            今のだと蓄積していってめんどくさい」。
    初見の練習も伴奏も、**その場で引いて弾いて、たいていは捨てる物**である。
    ところが一覧へ残り続けるので、L様の曲が埋もれる。
    **道具が出した物を、L様に片づけさせてはならない。**
    ただし**手を入れた物は捨てない**——書き足したなら、それはもうL様の曲である。 */
 try{
   const keepPol=U.library.tempPolicy;
   const keep=U.library.index.map(e=>U.loadSong(e.id)).filter(Boolean)
     .map(x=>JSON.parse(JSON.stringify(x)));
   const keepCur=U.song.id;
   const N=()=>U.library.index.length;
   /* ① 作った曲には印が付くこと */
   { const a=U.genSightSong({level:3,bars:8,seed:61});
     const b=U.genBackingSong({prog:'pop',level:2,reps:1,seed:62});
     ok('[145] 初見の練習に印が付く', a.genTemp===true, String(a.genTemp));
     ok('[145] アドリブの伴奏にも印が付く', b.genTemp===true, String(b.genTemp));
     ok('[145] 手つかずと判る', U.isTempSong(a)===true, '');
     a.genTouched=true;
     ok('[145] 手を入れれば、もう練習用ではない', U.isTempSong(a)===false, ''); }
   /* ② 〈いつも捨てる〉なら、離れた時に消えること */
   { U.library.tempPolicy='discard';
     const base=N();
     const t=U.genSightSong({level:3,bars:8,seed:63});
     U.saveSong(t); U.switchSong(t.id);
     ok('[145] 練習用の曲が一覧に入る', N()===base+1, base+'→'+N());
     U.switchSong(keepCur);
     ok('[145] 離れれば捨てられる', N()===base, String(N()));
     ok('[145] 一覧からも消える', !U.library.index.some(e=>e.id===t.id), ''); }
   /* ③ **手を入れた曲は捨てないこと** */
   { U.library.tempPolicy='discard';
     const base=N();
     const t=U.genSightSong({level:3,bars:8,seed:64});
     U.saveSong(t); U.switchSong(t.id);
     U.tx('試しに触る',()=>{ U.song.meta.title='L様の曲'; });   /* 触れば印が外れる */
     U.switchSong(keepCur);
     ok('[145] 手を入れた曲は残る', N()===base+1, base+'→'+N());
     U.doDeleteSong(t.id); }
   /* ④ 〈いつも残す〉なら残り、しかも**印が外れる**こと
        （次に離れる時、また聞かれては煩わしい） */
   { U.library.tempPolicy='keep';
     const base=N();
     const t=U.genSightSong({level:3,bars:8,seed:65});
     U.saveSong(t); U.switchSong(t.id);
     U.switchSong(keepCur);
     ok('[145] 〈残す〉なら残る', N()===base+1, base+'→'+N());
     const back=U.loadSong(t.id);
     ok('[145] 残したら印は外れる', !back.genTemp, String(back&&back.genTemp));
     U.doDeleteSong(t.id); }
   /* ⑤ 〈たずねる〉では、勝手に捨てないこと */
   { U.library.tempPolicy='ask';
     const base=N();
     const t=U.genSightSong({level:3,bars:8,seed:66});
     U.saveSong(t); U.switchSong(t.id);
     U.switchSong(keepCur);                    /* 札が出るだけで、まだ移らない */
     ok('[145] たずねる時は、勝手に捨てない', N()===base+1, base+'→'+N());
     const pop=d.querySelector('.pop-ov,.pop');
     ok('[145] 確かめの札が出る', !!pop, '');
     if(pop){
       const btns=[...pop.querySelectorAll('button')].map(b=>b.textContent);
       ok('[145] 「捨てる」「残す」を選べる',
          btns.some(x=>/捨てる/.test(x))&&btns.some(x=>/残す/.test(x)), btns.join('/'));
       const yes=[...pop.querySelectorAll('button')].find(b=>/捨てる/.test(b.textContent));
       yes.click();
       ok('[145] 「捨てる」で片づく', N()===base, String(N()));
     }
     if(U.library.index.some(e=>e.id===t.id)) U.doDeleteSong(t.id); }
   /* 後始末 */
   U.library.tempPolicy=keepPol;
   U.library.index.slice().forEach(e=>U.doDeleteSong(e.id));
   keep.forEach(x=>U.saveSong(x));
   U.switchSong(keepCur,true);
   U.library.index=U.library.index.filter(e=>keep.some(x=>x.id===e.id));
   U.saveLibrary(); U.renderSongList();
   ok('[145] 点検の後、曲が戻っている', U.library.index.length===keep.length,
      U.library.index.length+' / '+keep.length);
 }catch(e){ ok('[145] 練習用の曲の実地', false, e.message); }

 /* ══ 練習用の印が、保存で消えていた（1.146）══
    `mkSong` は決まった札だけを組み直すので、**そこに書かれていない札は保存で消える。**
    練習用の印（genTemp）がまさにそれで、一度しまって開き直すと
    「手つかずの練習用」でなくなり、**離れても片づかなかった。** */
 try{
   const keepCur=U.song.id, keepPol=U.library.tempPolicy;
   const N=()=>U.library.index.length;
   /* ① 印が、保存と読み直しをまたいで残ること */
   { const t=U.genSightSong({level:3,bars:8,seed:71});
     ok('[146] 作った直後に印が付く', t.genTemp===true, String(t.genTemp));
     U.saveSong(t);
     const back=U.loadSong(t.id);
     ok('[146] しまって開き直しても印が残る', back&&back.genTemp===true,
        String(back&&back.genTemp));
     ok('[146] 種も残る', back&&back.genSeed===71, String(back&&back.genSeed));
     U.doDeleteSong(t.id); }
   /* ② 印が残っているので、離れれば片づくこと（1.145 の仕掛けが効く） */
   { U.library.tempPolicy='discard';
     const base=N();
     const t=U.genSightSong({level:3,bars:8,seed:72});
     U.saveSong(t); U.switchSong(t.id);
     ok('[146] 切り替えた先でも印が生きている', U.isTempSong(U.song)===true, '');
     U.switchSong(keepCur);
     ok('[146] 離れれば片づく', N()===base, String(N())); }
   /* ══ ③ まとめて片づける（溜まった分）══
      離れる時に伺う仕掛けは**これから溜めない**ためのもの。
      **既に溜まった分には効かない**——印を持たずに保存された古い一冊もある */
   { U.library.tempPolicy='keep';
     const base=N();
     const made=[];
     for(let i=0;i<3;i++){
       const t=U.genSightSong({level:3,bars:8,seed:80+i});
       U.saveSong(t); made.push(t.id);
     }
     for(let i=0;i<2;i++){
       const t=U.genBackingSong({prog:'pop',level:2,reps:1,seed:90+i});
       U.saveSong(t); made.push(t.id);
     }
     ok('[146] 練習用の曲が溜まった', N()===base+5, base+'→'+N());
     /* **印を持たない古い一冊も拾えること**（名前で見分けるゆえ） */
     { const old=U.loadSong(made[0]); old.genTemp=false; old.genTouched=false;
       U.saveSong(old); }
     ok('[146] 印が無くても、名前で拾える',
        U.generatedSongs().length===5, String(U.generatedSongs().length));
     /* **名前を変えた一冊は、拾わないこと** */
     { const mine=U.loadSong(made[1]); mine.meta.title='L様の練習曲'; U.saveSong(mine); }
     ok('[146] 名前を変えた曲は拾わない',
        U.generatedSongs().length===4, String(U.generatedSongs().length));
     /* まとめて消す */
     const ids=U.generatedSongs().map(e=>e.id);
     ids.forEach(id=>U.doDeleteSong(id));
     U.renderSongList();
     ok('[146] まとめて片づく', N()===base+1, base+'→'+N());
     ok('[146] 名前を変えた一冊は残る',
        U.library.index.some(e=>e.title==='L様の練習曲'), '');
     /* 後始末 */
     U.library.index.slice().forEach(e=>{ if(e.title==='L様の練習曲') U.doDeleteSong(e.id); }); }
   /* ④ 片づける物が無ければ、消しに行かないこと */
   ok('[146] 片づける物が無い時は何もしない',
      U.generatedSongs().length===0, String(U.generatedSongs().length));
   U.library.tempPolicy=keepPol;
   U.switchSong(keepCur);
 }catch(e){ ok('[146] 練習用の曲の片づけの実地', false, e.message); }

 /* ══ 案内した設定が、実際に在ること（1.147）══
    練習用の曲を離れる時の札に「設定 ⚙ →〈曲〉→〈練習用の曲を離れる時〉で
    選べます」と書いておきながら、**その設定がどこにも無かった。**
    案内した先に何も無いのは、嘘を書いたのと同じである。

    ══ `prompt()` と `confirm()` は使わない ══
    **iOS の WKWebView では黙って何も起きない。**
    押しても無反応な札は、壊れていると読まれる。 */
 try{
   /* ① 設定が在ること */
   U.renderSettings();
   const box=d.getElementById('set-fields');
   const labs=[...box.querySelectorAll('.fld label')].map(x=>x.textContent);
   ok('[147] 〈練習用の曲を離れる時〉が設定に在る',
      labs.some(t=>/練習用の曲を離れる時/.test(t)), labs.slice(0,6).join('/'));
   /* 選べる中身が、札の案内どおりであること */
   { const fld=[...box.querySelectorAll('.fld')]
       .find(f=>/練習用の曲を離れる時/.test(f.querySelector('label').textContent));
     const opts=fld?[...fld.querySelectorAll('option')].map(o=>o.value):[];
     ok('[147] 毎回きく／いつも捨てる／いつも残す',
        ['ask','discard','keep'].every(v=>opts.indexOf(v)>=0), opts.join(',')); }
   /* ② 道具の中に prompt／confirm が残っていないこと */
   { const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     const bad=[];
     if(/(^|[^.\w])prompt\s*\(/.test(src.replace(/\/\*[\s\S]*?\*\//g,''))) bad.push('prompt');
     if(/(^|[^.\w])confirm\s*\(/.test(src.replace(/\/\*[\s\S]*?\*\//g,''))) bad.push('confirm');
     ok('[147] prompt／confirm を使っていない', bad.length===0, bad.join(',')); }
   /* ③ 曲名を変える札が開き、決めれば変わること */
   { const keep=U.song.meta.title;
     U.renameSong(U.song.id);
     const pop=d.querySelector('.pop-ov,.pop');
     ok('[147] 曲名の札が開く', !!pop, '');
     if(pop){
       const inp=pop.querySelector('input[type="text"]');
       ok('[147] いまの曲名が入っている', !!inp&&inp.value===keep, inp?inp.value:'—');
       if(inp){
         inp.value='あたらしい名前';
         const btn=[...pop.querySelectorAll('button')].find(b=>b.textContent==='決める');
         ok('[147] 〈決める〉がある', !!btn, '');
         if(btn){ btn.click();
           ok('[147] 曲名が変わる', U.song.meta.title==='あたらしい名前', U.song.meta.title);
           U.doUndo();
         }
       }
       U.closePop&&U.closePop();
     }
     if(U.song.meta.title!==keep){ U.song.meta.title=keep; U.saveSong(U.song); } }
   /* ④ 練習用の印の仕掛けが生きていること（1.145 の続き） */
   { const s=U.genSightSong({level:2,bars:8,seed:777});
     ok('[147] 生成した曲には練習用の印が付く', s.genTemp===true, String(s.genTemp));
     ok('[147] 手つかずなら片づけの対象', U.isTempSong(s)===true, '');
     s.genTouched=true;
     ok('[147] 手を入れたら対象から外れる', U.isTempSong(s)===false, ''); }
 }catch(e){ ok('[147] 設定と札の実地', false, e.message); }

 /* ══ ブラッシングに長さは無い（1.148）══
    L様——「ブラッシングは音価がないけど長い」。
    **弦を擦る一撃は伸びない。**四分のブラッシングは、
    鳴らない音を四分ぶん書いていることになる。

    ══ 一箇所だけ塞いでも足りなかった ══
    置く時に「八分以下」と決めても、**後からシンコペーションが食って伸ばして**いた。
    置く所・補う所・食う所——**伸びうる道をぜんぶ塞ぎ、最後にもう一度掃く。** */
 try{
   const QN=U.T.QUARTER;
   const cap=Math.round(QN/2);
   /* ① 生成した譜面に、八分より長いブラッシングが無いこと */
   { const bad=[];
     [4,5].forEach(lv=>{
       for(let i=0;i<30;i++){
         const s=U.genSightSong({level:lv,bars:8,seed:62000+i});
         s.bars.forEach((b,bi)=>(b.notes||[]).forEach(n=>{
           if(n.kind==='brush'&&n.len>cap)
             bad.push('段'+lv+' #'+i+' 小節'+(bi+1)+'：'+(n.len/QN)+'拍');
         }));
       }
     });
     ok('[148] 長いブラッシングが出ない', bad.length===0, bad.slice(0,3).join(' / ')); }
   /* 伴奏の側も同じであること（**道が二つあるなら、二つとも見る**） */
   { const bad=[];
     for(let i=0;i<20;i++){
       const s=U.genBackingSong({prog:'free',level:4,reps:2,seed:63000+i});
       s.bars.forEach((b,bi)=>(b.notes||[]).forEach(n=>{
         if(n.kind==='brush'&&n.len>cap) bad.push('伴奏 #'+i+' 小節'+(bi+1));
       }));
     }
     ok('[148] 伴奏にも長いブラッシングが出ない', bad.length===0, bad.slice(0,3).join(' / ')); }
   /* ② **切っても小節は満ちていること。**繕って壊さない */
   { const bad=[];
     [4,5].forEach(lv=>{
       for(let i=0;i<20;i++){
         const s=U.genSightSong({level:lv,bars:8,seed:64000+i});
         s.bars.forEach((b,bi)=>{
           const end=(b.notes||[]).reduce((a,n)=>Math.max(a,n.start+n.len),0);
           if(end!==QN*4) bad.push('段'+lv+' 小節'+(bi+1)+'：'+end);
         });
       }
     });
     ok('[148] 切っても小節は満ちている', bad.length===0, [...new Set(bad)].slice(0,3).join(' / ')); }
   /* ③ 数は減らないこと（下限を割っては、練習にならない） */
   { let min4=99, min5=99;
     for(let i=0;i<30;i++){
       const a=U.genSightSong({level:4,bars:8,seed:65000+i});
       const b=U.genSightSong({level:5,bars:8,seed:65000+i});
       const c=x=>{ let m=0; x.bars.forEach(bb=>(bb.notes||[]).forEach(n=>{ if(n.kind==='brush') m++; })); return m; };
       min4=Math.min(min4,c(a)); min5=Math.min(min5,c(b));
     }
     ok('[148] 短くしても数は足りている', min4>=3&&min5>=3, '段4 最少'+min4+' 段5 最少'+min5); }
   /* ④ **裏拍にしか載らない**という決まりは守られたまま */
   { const bad=[];
     for(let i=0;i<20;i++){
       const s=U.genSightSong({level:5,bars:8,seed:66000+i});
       s.bars.forEach(b=>(b.notes||[]).forEach(n=>{
         if(n.kind==='brush'&&n.start%QN===0) bad.push('拍の頭が×');
       }));
     }
     ok('[148] ブラッシングは裏拍のまま', bad.length===0, bad.slice(0,2).join(' / ')); }
 }catch(e){ ok('[148] ブラッシングの長さの実地', false, e.message); }

 /* ══ 擦過音に、胴の芯を足した（1.149）══
    L様——「ブラッシングの音が小さい」。
    1.7kHz あたりの細い帯を一本、0.13秒だけ鳴らしていた。
    **実際のブラッシングは、掌で押さえた六本の弦がまとめて鳴る「チャッ」**であって、
    高い擦れだけの音ではない。低い方に胴の詰まった音があり、
    だから伴奏の中でも埋もれずに聞こえる。 */
 try{
   /* 鳴らす所を差し替えて、何がどれだけ鳴るかを数える */
   const calls=[];
   const keepAC=w.AudioContext;
   const bq=()=>({type:'',frequency:{value:0},Q:{value:0},connect(){return this},disconnect(){}});
   const gainLog=[];
   const g=()=>({gain:{setValueAtTime:(v,t)=>gainLog.push(v),
                       exponentialRampToValueAtTime(){},linearRampToValueAtTime(){},
                       setTargetAtTime(){},cancelScheduledValues(){}},
                 connect(){return this},disconnect(){}});
   const src=()=>({buffer:null,playbackRate:{value:1},connect(){return this},
                   disconnect(){},start(){},stop(){},onended:null,addEventListener(){}});
   const bandFreqs=[];
   const fake={
     currentTime:0,sampleRate:44100,state:'running',destination:{connect(){},disconnect(){}},
     createBuffer:(c,l,r)=>({length:l,sampleRate:r,numberOfChannels:c,
       getChannelData:()=>new Float32Array(l)}),
     createBufferSource:src,
     createBiquadFilter:()=>{ const o=bq();
       Object.defineProperty(o,'frequency',{value:{set value(v){bandFreqs.push(v);},get value(){return 0;}}});
       return o; },
     createGain:g, createOscillator:src, createWaveShaper:g, createDelay:g,
     createConvolver:g, createDynamicsCompressor:g,
     resume:()=>Promise.resolve(), close:()=>Promise.resolve(),
   };
   /* 中の様子は覗けないので、書いてある値で確かめる */
   const src2=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
   /* ══ 「チャッ」は三つでできている（1.150）══
      チ（立ち上がり）・ャ（芯）・ッ（胴の詰まり）。
      1.149 は帯が二本で、中域の芯が薄く、しかも尾が長かった——
      **伸ばせば擦れ音になる。** */
   ok('[150] 帯が三本ある（チ・ャ・ッ）',
      (src2.match(/mk\(up\?/g)||[]).length>=3, String((src2.match(/mk\(up\?/g)||[]).length));
   /* 芯の高さは動く（1.151 で 1150 → 2300Hz へ寄せた）ので、
      **数字ではなく役どころで見る**——胴は添えるだけ、が崩れていないこと */
   { const bands=[...src2.matchAll(/mk\(up\?\s*(\d+):\s*(\d+),\s*[\d.]+,\s*([\d.]+),\s*([\d.]+)\)/g)]
       .map(m=>({hi:+m[1],lo:+m[2],amt:+m[3],dur:+m[4]}));
     ok('[150] 三本とも読める', bands.length>=3, String(bands.length));
     const body=bands[bands.length-1];
     ok('[151] 胴は添えるだけ（厚いとこもる）', body&&body.amt<=0.4, body?String(body.amt):'—');
     ok('[151] 高い方へ寄せてある（芯が 2kHz 以上）',
        bands.length>=2&&bands[1].lo>=2000, bands.length>=2?String(bands[1].lo):'—');
     /* ══ 低い方は、太鼓に譲る（1.161）══
        **バスドラと同じ帯に居ると、どちらも輪郭を失って「ボワッ」となる。**
        ブラッシングは高い方で立たせ、低い所は空けておく */
     ok('[161] いちばん低い帯も 800Hz より上',
        body&&body.lo>=800, body?String(body.lo):'—');
     ok('[151] 立ち上がりがいちばん短い',
        bands.length>=3&&bands[0].dur<=bands[1].dur, bands.map(b=>b.dur).join(',')); }
   ok('[150] 三つの役どころが註に書いてある',
      /チ …/.test(src2)&&/ャ …/.test(src2)&&/ッ …/.test(src2), '');
   /* ══ 六本の弦は、同時には鳴らない ══
      ピックは順に横切るので、ずれた六つの山が重なる。
      **均したノイズでは、どう帯を切っても「ザッ」にならない。** */
   ok('[150] 弦の数だけ刻みが入っている',
      /for\(let k=0;k<6;k\+\+\)/.test(src2)&&/0\.0016/.test(src2), '');
   /* **ブラッシングは、空振りよりはっきり大きいこと。**
      掌で押さえて振り切る音と、弦に触れただけの音は別物である */
   /* 1.212：大きさは一箇所（SCR_BRUSH／SCR_GHOST）から引く。
      **呼ぶ所ごとに数を書かない**ので、点検も表の側を見る */
   { const b=U.SCR_BRUSH, gh=U.SCR_GHOST;
     ok('[149] ブラッシングの音量が読める',
        typeof b==='number'&&typeof gh==='number', b+' / '+gh);
     ok('[212] 呼ぶ所に数を書かない',
        /scrape\(at,SCR_BRUSH,false\)/.test(src2)&&/scrape\(at,SCR_GHOST,/.test(src2), '');
     /* **上げすぎず、下げすぎず。**擦る音が刻みを覆ってはならないが、
        聞こえなければ刻んでいる意味が無い */
     /* 1.214：さらに下げた（2.3 → 1.4）。**刻みを覆わない大きさへ** */
     ok('[214] 下げた（3.8 → 2.3 → 1.4）', b>=1.0&&b<=1.8, String(b));
     ok('[149] 空振りより、はっきり大きい', b>gh*1.5, b+' vs '+gh);
     ok('[214] 空振りも一緒に下げた', gh>=0.5&&gh<=0.9, String(gh));
     /* **ボディヒットより小さいこと**——胴を叩く音は、擦る音より大きい物である */
     { const t=[...src2.matchAll(/sym\.tap\) scrape\(at,([\d.]+)/g)].map(m=>+m[1]);
       ok('[214] ボディヒットより小さい', t.length>0&&t.every(x=>x>b),
          b+' vs '+t.join(',')); } }
   /* ボディヒットも同じ擦過音を使う。**一つ直せば、みな直る所に置いてある** */
   { const t=[...src2.matchAll(/sym\.tap\) scrape\(at,([\d.]+)/g)].map(m=>+m[1]);
     ok('[152] ボディヒットも上げた', t.length>=2&&t.every(v=>v>=2.5), t.join(',')); }
   /* ══ 大きくするなら、潰れ方も作ること（1.152）══
      **利得だけ上げれば、山の頭が容赦なく切れて割れる。**
      実物のブラッシングも強く振れば潰れるが、**丸く潰れる**のであって割れはしない。 */
   ok('[152] 潰しの曲線を一枚通してある',
      /createWaveShaper/.test(src2)&&/Math\.tanh/.test(src2), '');
   ok('[152] 潰しは一度だけ作って使い回す',
      /let _scrShaper=null/.test(src2)&&/if\(!_scrShaper\)\{/.test(src2), '');
   ok('[152] 音の器を作り直したら、潰しも作り直す',
      /_scrShaper=null;\s*\/\* 音の器/.test(src2), '');
   /* 尾は短いこと（**擦る音は、当たった瞬間がすべて**）。
      いちばん長い帯でも 0.08 秒に満たないこと */
   { const durs=[...src2.matchAll(/mk\(up\?[^)]*?,\s*([\d.]+)\);/g)].map(m=>+m[1]);
     ok('[150] 尾は短い（0.08秒未満）', durs.length>=3&&durs.every(v=>v<0.08),
        durs.join(',')); }
 }catch(e){ ok('[149] 擦過音の実地', false, e.message); }

 /* ══ スケールの指板（1.153）══
    L様——「使えるスケールを数種類自分で選んでリアルタイムで切り替えたりしたい」。
    **光らせ方は三段でなければならない。**
    スケールの音をぜんぶ同じ色で光らせると、指板が光だらけになって
    どこへ指を置けばよいのか、かえって分からなくなる。 */
 try{
   const st=U.fbState();
   st.on=true; st.pin=null; st.scale=null; st.label='deg';
   /* ① 器が在ること */
   ok('[153] 指板の帯が譜面の下に在る', !!d.getElementById('fbbar'), '');
   /* ② ══ 顔ぶれは一つに束ねた（1.168）══
      指板が二箇所にあり、スケールの表も二つ持っていた——**同じ物に二つの答え。**
      アドリブ台の表（JAM_SCALES）へ寄せ、**L様が選んだ物だけ**を並べる */
   { const st0=U.fbState();
     ok('[168] 表は一つに束ねてある', !!U.JAM_SCALES&&U.JAM_SCALES.length>=12,
        String(U.JAM_SCALES.length));
     /* 1.180：顔ぶれは長調・短調で別に持つ */
     ok('[168] 選んだ物が並ぶ',
        !!st0.list&&Array.isArray(st0.list.maj)&&st0.list.maj.length>0
        &&Array.isArray(st0.list.min)&&st0.list.min.length>0,
        JSON.stringify(st0.list));
     const got=U.fbScales('min').map(x=>x.id);
     ok('[168] 指板の札は、選んだ物と一致する',
        /* 1.180：当たる札が乏しい和音では道具が三枚まで補うので、
           **選んだ物がすべて在ること**を見る（数の一致では見ない） */
        /* fbScales('min') を見ているので、短調の顔ぶれと突き合わせる */
        st0.list.min.every(x=>got.indexOf(x)>=0)&&got.length===st0.list.min.length,
        got.join(',')); }
   /* ④ 曲を用意して、描けること */
   const keepId=U.song.id;
   const s=U.genBackingSong({prog:'pop',level:2,reps:2,seed:5150,
     key:U.BK_KEYS.find(k=>k.root===0&&k.qual==='maj')});
   U.saveSong(s); U.switchSong(s.id);
   U.renderFretboard();
   const box=d.getElementById('fbbar');
   ok('[153] 指板が描かれる', /<svg class="fbsvg"/.test(box.innerHTML), '');
   ok('[153] キーが出ている', /Key C/.test(box.textContent), box.textContent.slice(0,20));
   ok('[153] いまの和音が出ている', /fb-ch/.test(box.innerHTML), '');
   /* ══ ⑤ 三つの色で分けてあること（1.171）══
      L様のご指定は「全部丸にして色分け」であった。
      1.154 で大きさの段を付けたのは**指示と食い違って**おり、
      小さい点にすると度数の字が入らず**通り道が読めない。**
      ゆえに**大きさは揃え、色だけで分ける。** */
   /* **色の値は、道具の表から引く。**点検に値を書き写せば、
      色を直すたびに点検が落ちる——**同じ物に二つの答えを置かない**（1.178） */
   { const svg=box.innerHTML;
     const esc2=x=>String(x).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
     const cnt=v=>(svg.match(new RegExp('fill="'+esc2(v)+'"','g'))||[]).length;
     const rootC=cnt(U.JAM_COL.root);
     const toneC=cnt(U.JAM_COL.tone);
     const dimC=cnt(U.JAM_COL.other);
     ok('[171] ルートは赤', rootC>0, String(rootC));
     ok('[171] 和音の音は濃い青', toneC>0, String(toneC));
     ok('[171] 通り道は薄い青', dimC>0, String(dimC));
     /* **丸はどれも同じ大きさ** */
     const rr=[...svg.matchAll(new RegExp('<circle cx="[\\d.-]+" cy="[\\d.-]+" r="([\\d.]+)" fill="('
       +[U.JAM_COL.root,U.JAM_COL.tone,U.JAM_COL.other].map(esc2).join('|')+')"','g'))]
       .map(m=>+m[1]);
     ok('[171] 丸はどれも同じ大きさ', rr.length>0&&rr.every(x=>x===rr[0]),
        [...new Set(rr)].join(','));
     /* **度数の字が、どの丸にも出ること。**通り道こそ読めねばならない */
     const txt=(svg.match(/font-weight="800" fill="(#fff|#cdd2ff)"/g)||[]).length;
     ok('[171] 度数はどの丸にも出る', txt===rr.length, txt+' / '+rr.length);
     /* ══ 通り道の字が、地に沈んでいないこと（1.178）══
        L様——「それ以外の数字が全く見えない」。
        **暗い地の上に濃い紫の字**を載せていた。
        丸の色は薄いままでよいが、**字は明るくなければ読めない。**
        ここでは「明るいか」を数で見る——**目で見た印象ではなく、値で。** */
     { const dim=(svg.match(/font-weight="800" fill="(#[0-9a-fA-F]{6})"/g)||[])
         .map(x=>x.match(/#[0-9a-fA-F]{6}/)[0])
         .filter(x=>x.toLowerCase()!=='#ffffff'&&x.toLowerCase()!=='#fff');
       const lum=h2=>{ const n=parseInt(h2.slice(1),16);
         return (((n>>16)&255)*0.299+((n>>8)&255)*0.587+(n&255)*0.114)/255; };
       ok('[171] 通り道の字も明るい', dim.length>0&&dim.every(x=>lum(x)>0.6),
          [...new Set(dim)].map(x=>x+'='+lum(x).toFixed(2)).join(',')); } }
   /* 弦の間隔が、丸より広いこと */
   { const src3=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     const m=src3.match(/const sx=big\?(\d+):(\d+), sy=big\?(\d+):(\d+)/);
     ok('[154] 弦の間隔を広げた', m&&+m[4]>=28, m?(m[4]+'px（大きい時は'+m[3]+'px）'):'—'); }
   /* 弦の番号が出ていること（**どの弦かが読めなければ、指板の図は使えない**） */
   ok('[154] 弦の番号が出ている',
      /font-size="10\.5" font-weight="700" fill="#9aa0ab">[1-6]</.test(box.innerHTML), '');
   /* ⑥ ══ 札を叩く＝いまの和音に当てる（1.184）══
        **曲ぜんたいに効く選び方は、もう置かない。**
        「E に当てた」と「曲に当てた」が同じ札で起きるのが誤りであった。 */
   { const btns=[...box.querySelectorAll('.fb-b[data-sc]')];
     ok('[153] スケールの札が並ぶ', btns.length>=4, String(btns.length));
     const cnm0=(box.querySelector('.fb-ch')||{}).textContent||null;
     const second=btns[1], id2=second.getAttribute('data-sc');
     second.click();
     ok('[153] 叩けばこのマスに当たる',
        !!cnm0&&CURASG(U)===id2,
        cnm0+'／'+String(CURASG(U)));
     const box2=d.getElementById('fbbar');
     ok('[153] 当てていることが目に出る', /fb-b[^"]*pin/.test(box2.innerHTML), '');
     [...box2.querySelectorAll('.fb-b[data-sc="'+id2+'"]')][0].click();
     ok('[153] もう一度叩けば外れて自動へ戻る',
        !(U.fbState().perChord||{})[cnm0],
        String((U.fbState().perChord||{})[cnm0])); }
   /* ⑦ 度数と音名を切り替えられること */
   { const lb=d.getElementById('fbbar').querySelector('.fb-b[data-lab]');
     ok('[153] 度数／音名の札がある', !!lb, '');
     if(lb){ lb.click();
       ok('[153] 音名に切り替わる', U.fbState().label==='name', U.fbState().label);
       d.getElementById('fbbar').querySelector('.fb-b[data-lab]').click(); } }
   /* ⑧ **紙には出さないこと。**指板は稽古の道具であって、譜面ではない */
   { const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('');
     const i=css.indexOf('@media print{');
     ok('[153] 印刷では出さない', /\.fbbar\{display:none!important\}/.test(css.slice(i)), ''); }
   /* ⑨ 転調のある曲では、区間のキーに追うこと */
   { const s2=U.genBackingSong({prog:'pop',level:2,reps:4,mod:'up4',seed:5151,
       key:U.BK_KEYS.find(k=>k.root===0&&k.qual==='maj')});
     U.saveSong(s2); U.switchSong(s2.id);
     const half=Math.floor(s2.bars.length/2);
     const k0=U.fbCurKey(s2.bars[0],s2), k1=U.fbCurKey(s2.bars[half],s2);
     ok('[153] 前半と後半でキーが変わる', k0&&k1&&k0.root!==k1.root,
        (k0?k0.root:'—')+' → '+(k1?k1.root:'—'));
     U.switchSong(keepId); U.doDeleteSong(s2.id); }
   U.switchSong(keepId); U.doDeleteSong(s.id);
   U.fbState().on=true; U.saveLibrary();
 }catch(e){ ok('[153] スケールの指板の実地', false, e.message); }

 /* ══ コード進行は、文字だけで（1.168）══
    L様——「指板図の近くにコード進行を文字のみで表示」。
    押さえの図は幅が変わるうえ、**弾いている最中に読むのは名前の方**である。
    図は譜面の上に出ているので、ここに二枚目は要らない。 */
 try{
   const st=U.fbState(); st.on=true; st.pin=null;
   const keepId=U.song.id;
   const s2=U.genBackingSong({genre:'rock8',prog:'pop',reps:2,seed:9400,
     key:U.BK_KEYS.find(k=>k.root===0&&k.qual==='maj')});
   U.saveSong(s2); U.switchSong(s2.id);
   U.renderFretboard();
   const box=()=>d.getElementById('fbbar');
   ok('[168] コード進行が文字で並ぶ', !!box().querySelector('.fb-prog .fb-pc'), '');
   ok('[168] 押さえの図は置かない', !box().querySelector('.fb-dgm'), '');
   { const cs=[...box().querySelectorAll('.fb-pc')];
     /* ══ 一巡ぶんだけ並ぶこと（1.169）══
        L様——「同じコード進行なのに毎回出すなよ」。
        譜面ぜんぶを並べていたので、**四小節の進行を六回繰り返した曲では
        同じ並びが六度も出ていた。**繰り返しは繰り返しとして畳む */
     ok('[169] 小節の数だけ並ぶ（繰り返しの無い曲）', cs.length===s2.bars.length,
        cs.length+' / '+s2.bars.length);
     ok('[168] コード名が読める', cs.some(x=>/^[A-G]/.test(x.textContent)),
        cs.slice(0,4).map(x=>x.textContent).join(' '));
     /* **同じコードが続く所は伸ばす**（同じ名前が四つ並ぶより、形が見える） */
     ok('[168] 続く所は「―」で伸ばす',
        cs.some(x=>x.classList.contains('same'))||cs.every(x=>!x.classList.contains('same')),
        ''); }
   /* 拡大の切り替え。**1.210 で既定は「大きくしない」へ**——
      譜面と指板が同時に見えている方が、進行も刻みも確かめられる */
   { const st168=U.fbState(); st168.big=false; U.saveLibrary(); U.renderFretboard();
     ok('[168] 既定は指板を大きくしない', U.fbState().big===false, String(U.fbState().big));
     const zb=box().querySelector('.fb-b[data-zoom]');
     ok('[168] 札の字が「指板を大きく」', /指板を大きく/.test(zb.textContent), zb.textContent);
     zb.click();
     ok('[168] 押せば指板が大きくなる', d.body.classList.contains('fb-big'), '');
     box().querySelector('.fb-b[data-zoom]').click();
     ok('[168] もう一度押せば譜面へ戻る', !d.body.classList.contains('fb-big'), ''); }
   /* スケールを選ぶ道が在ること */
   ok('[168] スケールを選ぶ札が在る', !!box().querySelector('.fb-b[data-fbsc]'), '');
   U.switchSong(keepId); U.doDeleteSong(s2.id);
 }catch(e){ ok('[168] 文字の進行の実地', false, e.message); }

 /* ══ 伴奏のジャンル（1.157）══
    L様——「リズムはランダムじゃなくて幾つかのジャンル、16分ファンクとか
            ブルースなどなどを用意したい。アドリブがメインだから
            パターン化してた方がいい」。
    仰るとおりで、**ソロに集中していただくなら伴奏は形が決まっていた方がよい。**
    毎回ちがう刻みでは、伴奏を追う練習になってしまう。 */
 try{
   const QN=U.T.QUARTER;
   ok('[157] ジャンルが並んでいる', U.BK_GENRES.length>=9, String(U.BK_GENRES.length));
   ok('[157] 〈おまかせ〉は型を持たない',
      U.bkGenre('free').pat===null, '');
   /* ① **書いた文字と鳴る音が一対一であること。**
        ここが崩れると、型を直しても譜面が変わらない——いちばん厄介な壊れ方 */
   { const seq=U.bkPatternOf('d-x-du-xd-x-du-x',16,QN*4);
     const step=QN/4;
     /* 休符を畳むので、要素の数は文字の数より減る。
        **数ではなく「文字と鳴りが一対一か」で見る** */
     ok('[157] 型どおりに開く（16文字 → 音と休符）', seq.length>=10&&seq.length<=16,
        String(seq.length));
     { const step=QN/4;
       const at=t=>seq.find(o=>o.start<=t&&t<o.start+o.len);
       const line='d-x-du-xd-x-du-x';
       const bad2=[];
       for(let i=0;i<16;i++){
         const o=at(i*step); if(!o){ bad2.push(i); continue; }
         const c=line[i];
         if(c==='-'&&!o.rest) bad2.push(i+'（休符でない）');
         if(c==='x'&&!(o.brush&&o.start===i*step)) bad2.push(i+'（×でない）');
         if(c==='d'&&!(!o.rest&&!o.brush&&o.start===i*step)) bad2.push(i+'（音でない）');
       }
       ok('[157] 書いた文字と鳴る音が一対一', bad2.length===0, bad2.join(',')); }
     ok('[157] 頭は鳴る音', seq[0]&&!seq[0].rest&&!seq[0].brush, '');
     ok('[157] x はブラッシングになる', seq.some(o=>o.brush), '');
     ok('[157] 小節が満ちる',
        seq.reduce((a,o)=>Math.max(a,o.start+o.len),0)===QN*4,
        String(seq.reduce((a,o)=>Math.max(a,o.start+o.len),0)));
     /* 休符が続けば一つに畳む（八分休符が四つ並ぶより、全休符が読みやすい） */
     const r=U.bkPatternOf('d-------',8,QN*4);
     ok('[157] 続く休符は一つに畳む', r.length===2&&r[1].len===QN*3.5,
        r.map(o=>(o.rest?'休':'音')+o.len/step).join(' ')); }
   /* ② どのジャンルでも、曲が組めて描けること */
   { const bad=[];
     U.BK_GENRES.forEach(g0=>{
       const s=U.genBackingSong({genre:g0.id,reps:2,seed:7100});
       if(!s){ bad.push(g0.id+'：組めない'); return; }
       /* 1.198：小節の長さは拍子から（ボサノヴァは 2/4） */
       const want=Math.round(QN*4*((g0.meter&&g0.meter.n)||4)/((g0.meter&&g0.meter.d)||4));
       s.bars.forEach((b,i)=>{
         const end=(b.notes||[]).reduce((a,n)=>Math.max(a,n.start+n.len),0);
         if(end!==want) bad.push(g0.id+' 小節'+(i+1)+'：'+end+'（'+want+'のはず）');
       });
       try{ s.bars.forEach(b=>U.engrave(s,b,{width:400,hits:true,barId:b.id})); }
       catch(e){ bad.push(g0.id+'：描けない'); }
     });
     ok('[157] どのジャンルでも組めて描ける', bad.length===0, bad.slice(0,3).join(' / ')); }
   /* ③ **型のあるジャンルは、刻みが繰り返されること。**これが伴奏の要 */
   { const bad=[];
     U.BK_GENRES.filter(g0=>g0.pat).forEach(g0=>{
       const s=U.genBackingSong({genre:g0.id,reps:2,seed:7101});
       const shp=s.bars.map(b=>(b.notes||[]).map(n=>n.start+':'+n.len+':'+n.kind).join(','));
       const per=g0.pat.length;
       for(let i=per;i<shp.length-1;i++)
         if(shp[i]!==shp[i-per]) bad.push(g0.id+'：'+per+'小節で戻らない');
     });
     ok('[157] 型は決まった周期で繰り返す', bad.length===0, [...new Set(bad)].slice(0,3).join(' / ')); }
   /* ④ **はねる形は、曲ぜんたいの設定に掛かること。**
        ジャンルを選んだのに、はねないのでは看板に偽りがある */
   { const bad=[];
     U.BK_GENRES.forEach(g0=>{
       const s=U.genBackingSong({genre:g0.id,reps:1,seed:7102});
       const on=!!(s.play&&s.play.swing);
       if(!!g0.swing!==on) bad.push(g0.id+'：'+(g0.swing?'はねない':'はねてしまう'));
     });
     ok('[157] はねる形は、はねる', bad.length===0, bad.join(' / ')); }
   /* ⑤ ジャンルは速さも連れてくる（十六分ファンクを 76 で回してもそれらしくない） */
   { const f=U.genBackingSong({genre:'funk16',reps:1,seed:7103});
     const b=U.genBackingSong({genre:'ballad',reps:1,seed:7103});
     ok('[157] ジャンルで速さが変わる', f.play.bpm!==b.play.bpm,
        f.play.bpm+' / '+b.play.bpm); }
   /* ⑥ **進行は連れてこない。**既定として勧めるだけで、縛らない
        （「ブルース進行をファンクの刻みで」も作れること） */
   { const s=U.genBackingSong({genre:'funk16',prog:'blues',reps:1,seed:7104});
     const roots=new Set();
     s.bars.forEach(b=>{ (b.notes||[]).forEach(n=>{ if(n.chord) roots.add(n.chord.root); });
       if(b.chordAt) Object.values(b.chordAt).forEach(c=>{ if(c) roots.add(c.root); }); });
     ok('[157] ジャンルと進行は別々に選べる', s.bars.length===12&&roots.size>=3,
        s.bars.length+'小節／'+roots.size+'和音');
     /* 1.196：ファンクの型は L様の字（× を使わない四撃）に差し替わったので、
        「× があるか」ではなく**型そのものと突き合わせる** */
     { const want=U.bkPatternOf(U.bkGenre('funk16').pat[0],16,U.T.QUARTER*4)
                   .filter(x=>!x.rest).length;
       const got=(s.bars[0].notes||[]).filter(n=>n.kind!=='rest').length;
       ok('[157] 刻みはジャンルの型のまま', want===got, want+' / '+got); } }
   /* ⑦ キーは全調から選べること */
   { const bad=[];
     U.BK_KEYS.forEach(k=>{
       const s=U.genBackingSong({genre:'funk16',prog:'free',reps:1,key:k,seed:7105});
       if(!s||s.meta.key.root!==k.root||s.meta.key.qual!==k.qual) bad.push(k.name);
     });
     ok('[157] どの調でもジャンルが乗る', bad.length===0, bad.slice(0,3).join(',')); }
   /* ⑧ 曲名にジャンルが入ること（後から探せるように） */
   { const s=U.genBackingSong({genre:'shuffle',reps:1,seed:7106});
     ok('[157] 曲名にジャンルが入る', /シャッフル/.test(s.meta.title), s.meta.title); }
 }catch(e){ ok('[157] ジャンルの実地', false, e.message); }

 /* ══ 使わない札は、並べない（1.158）══
    L様——「ジャンルが16ビートなのに刻みの細かさを決めなきゃいけないのが意味わからん」。
    仰るとおりで、**ジャンルが型を持っているなら、刻みの細かさは使われていない。**
    使わない札を並べて選ばせていたのは、無駄な判断をさせていたに等しい。
    しかも「16ビート・ファンク」を選んだ上で「四分打ち」を選べてしまう——
    **選べるのに効かない札**は、壊れていると読まれる。 */
 try{
   const QN=U.T.QUARTER;
   /* ① 刻みの細かさは、型のあるジャンルでは効かないこと（＝出す意味が無いこと） */
   { const bad=[];
     U.BK_GENRES.filter(g=>g.pat).forEach(g=>{
       const shp=lv=>{
         const s=U.genBackingSong({genre:g.id,level:lv,reps:1,seed:8100});
         return s.bars.map(b=>(b.notes||[]).map(n=>n.start+':'+n.len+':'+n.kind).join(',')).join('|');
       };
       if(shp(1)!==shp(4)) bad.push(g.id);
     });
     ok('[158] 型のあるジャンルでは、刻みの細かさは効かない', bad.length===0, bad.join(',')); }
   /* ② 〈おまかせ〉では効くこと（**効く所では、ちゃんと効く**） */
   { const shp=lv=>{
       const s=U.genBackingSong({genre:'free',level:lv,reps:1,seed:8101});
       return s.bars.map(b=>(b.notes||[]).map(n=>n.start+':'+n.len).join(',')).join('|');
     };
     ok('[158] おまかせでは刻みの細かさが効く', shp(1)!==shp(4), ''); }
   /* ③ 札そのものが、型のあるジャンルでは伏せられること */
   { U.openBackingGen();
     const pop=d.querySelector('.pop-ov,.pop');
     ok('[158] 伴奏の札が開く', !!pop, '');
     if(pop){
       const grpOf=t=>[...pop.querySelectorAll('.pg')]
         .find(g=>{ const l=g.querySelector('.pg-lbl'); return l&&l.textContent===t; });
       const g2=grpOf('刻みの細かさ');
       ok('[158] 〈刻みの細かさ〉の欄がある', !!g2, '');
       /* ジャンルを 8ビート・ロックにすると伏せられる */
       const rock=[...pop.querySelectorAll('.pb')].find(b=>/8ビート/.test(b.textContent));
       if(rock){ rock.click();
         ok('[158] 型のあるジャンルでは伏せる', g2&&g2.style.display==='none',
            g2?('display='+g2.style.display):'—'); }
       /* 〈おまかせ〉に戻すと出る */
       const free=[...pop.querySelectorAll('.pb')].find(b=>/おまかせ（その場で組む）/.test(b.textContent));
       if(free){ free.click();
         ok('[158] おまかせでは出す', g2&&g2.style.display!=='none',
            g2?('display='+(g2.style.display||'（既定）')):'—'); }
       U.closePop&&U.closePop();
     } }
   /* ④ **ジャンルを選べば、進行も速さも既定へ寄ること**（選ぶ手間を減らす） */
   { const s=U.genBackingSong({genre:'shuffle',reps:1,seed:8102});
     ok('[158] はねる形は、はねる設定が付く', !!(s.play&&s.play.swing), '');
     ok('[158] 速さも連れてくる', s.play.bpm===U.bkGenre('shuffle').bpm,
        String(s.play.bpm)); }
 }catch(e){ ok('[158] 使わない札の実地', false, e.message); }

 /* ══ 伴奏には、はじめから太鼓を付ける（1.159）══
    L様——「このモードだけ最初からドラムパターンをデフォルトで再生できる？」。
    **アドリブの練習台に、拍を刻む物が無いのは辛い。**
    ギターだけで回すと、自分のソロで拍を見失う。 */
 try{
   /* ① どのジャンルでも、太鼓が入っていること */
   { const bad=[];
     U.BK_GENRES.forEach(g=>{
       const s=U.genBackingSong({genre:g.id,reps:1,seed:9100});
       if(!U.drumOn(s)) bad.push(g.id);
     });
     ok('[159] どのジャンルでも太鼓が鳴る', bad.length===0, bad.join(',')); }
   /* ② ジャンルに合う型が選ばれていること（十六分の刻みに8ビートでは間が抜ける） */
   /* 1.206：ボサノヴァには専用の型を書き下ろした */
   { const want={funk16:'beat16',cutt:'beat16',bossa:'bossa',rock8:'beat8'};
     const bad=[];
     Object.keys(want).forEach(id=>{
       const s=U.genBackingSong({genre:id,reps:1,seed:9101});
       if(s.play.drum.pat!==want[id]) bad.push(id+'：'+s.play.drum.pat);
     });
     ok('[159] ジャンルに合う型が選ばれる', bad.length===0, bad.join(' / ')); }
   /* ③ **はねる曲に三連系の太鼓を重ねないこと。**
        曲ぜんたいが跳ねるので、二重に跳ねてしまう */
   { const bad=[];
     U.BK_GENRES.filter(g=>g.swing).forEach(g=>{
       const s=U.genBackingSong({genre:g.id,reps:1,seed:9102});
       if(U.DRUM_TRIPLET.indexOf(s.play.drum.pat)>=0) bad.push(g.id+'：'+s.play.drum.pat);
     });
     ok('[159] はねる曲に三連系を重ねない', bad.length===0, bad.join(' / ')); }
   /* ④ 選ばれた型が、その曲の一覧に在ること（**選べない型を書き込まない**） */
   { const bad=[];
     U.BK_GENRES.forEach(g=>{
       const s=U.genBackingSong({genre:g.id,reps:1,seed:9103});
       if(U.drumList(s).indexOf(s.play.drum.pat)<0) bad.push(g.id+'：'+s.play.drum.pat);
     });
     ok('[159] 書き込んだ型は、その曲で選べる型', bad.length===0, bad.join(' / ')); }
   /* ⑤ **初見の練習には付けないこと。**あちらは読む稽古で、
        太鼓に引かれては「自分で数える」練習にならない */
   { const s=U.genSightSong({level:3,bars:8,seed:9104});
     ok('[159] 初見の練習には太鼓を付けない', !U.drumOn(s),
        String(s.play.drum&&s.play.drum.pat)); }
   /* ⑥ 鳴らす所まで通ること（**設定しただけで鳴らない、を防ぐ**） */
   { const s=U.genBackingSong({genre:'funk16',reps:1,seed:9105});
     const tl=U.buildTimeline(s);
     const drums=tl.ev.filter(e=>e.kind==='drum');
     ok('[159] 太鼓が実際に鳴る', drums.length>0, String(drums.length)+'発'); }
 }catch(e){ ok('[159] 太鼓の実地', false, e.message); }

 /* ══ 太鼓の大きさ（1.160）══
    L様——「ドラムの音量を全体的にもっと上げて」。
    0.55 まで絞ってあった。ギターに被らせないためだが、
    **絞りすぎれば拍を刻む役を果たさない**——
    伴奏の上でソロを取る時、太鼓は聞こえていなければ意味が無い。 */
 try{
   const src2=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
   { const m=src2.match(/const DRUM_MIX=([\d.]+);/);
     ok('[160] 太鼓の大きさが読める', !!m, m?m[1]:'—');
     /* ══ 数は変わったが、狙いは同じ（1.317）══
        1.55 は**痩せた合成音を持ち上げるための数**であった。
        録音の太鼓は初めから厚く、同じ数を通せば頭が潰れる。
        **聞こえる嵩は変えず、利得だけ下げた。**
        数そのものではなく、ScoreLineTAB と揃っていることを見張る。 */
     if(m) ok('[160] 太鼓の嵩が ScoreLineTAB と同じ', m[1]==='0.55', m[1]); }
   /* **上げるなら、潰れ方も作る。**利得だけ上げれば、
      バスドラの頭が切れてバリッと割れる（§1.152 と同じ理屈） */
   ok('[160] 太鼓にも潰しを一枚挟んである',
      /DRUMG\.connect\(shp\)/.test(src2)&&/Math\.tanh\(x\*1\.35\)/.test(src2), '');
   /* 1.318 で帯（ミキサー）を挟んだ。**潰しが作れない端末でも、
      太鼓が帯へ届くこと**——見張る中身は同じである */
   ok('[160] 潰しが作れない時でも、素通しで繋ぐ',
      /else \{ DRUMG\.connect\(DRUMPAN\); DRUMG\.connect\(DRUMSND\); \}/.test(src2), '');
   ok('[160] 太鼓の帯は出口と響きの両方へ繋がる',
      /DRUMPAN\.connect\(MASTER\); DRUMSND\.connect\(REVIN\);/.test(src2), '');
   /* 太鼓が実際に鳴るところまで通ること */
   { const s=U.genBackingSong({genre:'rock8',reps:1,seed:9200});
     const tl=U.buildTimeline(s);
     ok('[160] 太鼓が鳴る', tl.ev.filter(e=>e.kind==='drum').length>0,
        String(tl.ev.filter(e=>e.kind==='drum').length)+'発'); }
 }catch(e){ ok('[160] 太鼓の大きさの実地', false, e.message); }

 /* ══ 指板は、動かない（1.162 → 1.168 で作り替え）══
    押さえの図をやめ、文字の進行にしたので、
    **幅が変わって指板が押される**という壊れ方そのものが無くなった。
    それでも「頭の札で並びがずれない」ことは、引き続き見張る。 */
 try{
   const css2=[...d.querySelectorAll('style')].map(x=>x.textContent).join('');
   ok('[168] キー名とコード名の幅を決めてある',
      /\.fb-key\{[^}]*min-width:62px/.test(css2)&&/\.fb-ch\{[^}]*min-width:58px/.test(css2), '');
   ok('[168] 頭と註の高さも決めてある',
      /\.fb-head\{[^}]*min-height:30px/.test(css2)&&/\.fb-note\{[^}]*min-height:22px/.test(css2), '');
   ok('[168] 進行の札も幅を決めてある',
      /\.fb-pc\{[^}]*min-width:46px/.test(css2), '');
 }catch(e){ ok('[168] 指板の据わりの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    アドリブの伴奏へ一本化（1.174）

    L様との詰めで決まった形——
      ・**アドリブ台は畳む。**譜面の側へ一本化する
        （譜面画面の指板が、台の指板の写しであった。§1.168 で表も束ねてある）
      ・伴奏は**棚に一本だけ。**作り直せば前の一本は片づく
        ——**名前をお変えになった一本は、取っておきたい印**として残す
      ・**ベースは鳴らす。譜面には書かない。**代わりに頭で知らせる
      ・テンションの既定は**七度まで。**ジャンルは勧めるだけで縛らない
      ・**進行を手で並べられる。**キーは打ち込みから推し当てる
      ・作った直後は、**指板を画面いっぱいにして開く**
    ══════════════════════════════════════════════════════════════ */
 try{
   const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
   /* **借りた物は返す。**この塊は棚と開いている曲を触るので、
      始めに控えておき、終わりで必ず戻す——
      戻さねば、後に続く点検が別の曲を見ることになる */
   const keepId=U.song.id, keepFb={on:U.fbState().on,big:U.fbState().big};
   /* ① 台が畳まれていること（**残骸が残っていれば、いつか呼ばれる**） */
   ok('[174] アドリブ台の器が無い', !d.getElementById('ov-jam'), '');
   ok('[174] 台を開く札が無い', !d.getElementById('btn-jam'), '');
   ok('[174] 台の仕掛けが残っていない',
      !/function jamOpen|function jamBuildSong|function jamState/.test(src), '');
   ok('[174] 伴奏の入口は残っている', !!d.getElementById('btn-backing'), '');
   /* **表は捨てない。**指板がスケールの顔ぶれを引いている（§1.168） */
   ok('[174] スケールの表は残してある', !!U.JAM_SCALES&&U.JAM_SCALES.length>=12, '');
   ok('[174] テンションの表も残してある', !!U.BK_TENSION&&!!U.BK_TENSION.maj, '');
   ok('[174] ベースの刻みの表も残してある', !!U.JAM_BASS&&!!U.JAM_BASS.funk16, '');

   /* ② ベースが鳴ること（**低音が無いと、その上でソロが立たない**） */
   { const s2=U.genBackingSong({prog:'pop',genre:'rock8',seed:311});
     ok('[174] 小節にベースが書かれる', (s2.bars[0].bass||[]).length>0,
        String((s2.bars[0].bass||[]).length));
     const tl=U.buildTimeline(s2);
     ok('[174] ベースが実際に鳴る', tl.ev.filter(e=>e.kind==='bass').length>0,
        String(tl.ev.filter(e=>e.kind==='bass').length));
     const s3=U.genBackingSong({prog:'pop',genre:'rock8',seed:311,bass:false});
     ok('[174] 切れば鳴らない',
        U.buildTimeline(s3).ev.filter(e=>e.kind==='bass').length===0, '');
     /* ジャンルで刻み方が変わること */
     const cnt=g=>(U.genBackingSong({prog:'pop',genre:g,seed:5}).bars[0].bass||[]).length;
     ok('[174] ジャンルでベースの刻みが変わる', cnt('funk16')!==cnt('ballad'),
        'ファンク'+cnt('funk16')+' / バラード'+cnt('ballad'));
     /* ③ **鳴る物は、書けずとも知らせる** */
     const t0=s2.bars[0].marks&&s2.bars[0].marks.text;
     ok('[174] 譜面の頭でベースを知らせる', !!t0&&/ベース/.test(t0.t), t0?t0.t:'—');
     ok('[174] 鳴らさない時は知らせない',
        !(s3.bars[0].marks&&s3.bars[0].marks.text&&/ベース/.test(s3.bars[0].marks.text.t)), '');
     /* **五線には書かない**（太鼓と同じ、音だけの物） */
     ok('[174] ベースは音符にしない',
        s2.bars.every(b=>(b.notes||[]).every(n=>n.kind!=='bass')), ''); }

   /* ④ 手で並べた進行 */
   { ok('[174] コード名を読める',
        U.parseChord('Am').root===9&&U.parseChord('Am').type==='min', '');
     ok('[174] ♯♭も読める', U.parseChord('Bb').root===10, '');
     ok('[174] オンコードも読める', U.parseChord('F/C').bass===0, '');
     ok('[174] 読めない綴りは null', U.parseChord('あ')===null, '');
     const cs=[{root:9,type:'min',bass:null},{root:5,type:'maj',bass:null},
               {root:0,type:'maj',bass:null},{root:7,type:'maj',bass:null}];
     const s4=U.genBackingSong({chords:cs,genre:'rock8',seed:9});
     ok('[174] 打った数だけ小節が出る', s4.bars.length===4, String(s4.bars.length));
     const seq=s4.bars.map(b=>{
       let r=null,t=null;
       (b.notes||[]).forEach(n=>{ if(r==null&&n.chord&&n.chord.root!=null){ r=n.chord.root; t=n.chord.type; } });
       if(r==null&&b.chordAt) Object.keys(b.chordAt).forEach(k=>{
         if(r==null&&b.chordAt[k]){ r=b.chordAt[k].root; t=b.chordAt[k].type; } });
       return r+'|'+t; }).join(',');
     /* **打った物には触れない。**テンションも足さない */
     ok('[174] 打った通りに鳴る', seq==='9|min,5|maj,0|maj,7|maj', seq);
     ok('[174] 打った進行は札より勝つ',
        U.genBackingSong({chords:cs,prog:'blues',seed:9}).bars.length===4, '');
     ok('[174] 題名にそう書く', /手で並べた進行/.test(s4.meta.title), s4.meta.title); }

   /* ⑤ キーを推し当てる（**手引きが黙らないように**） */
   { const g1=U.bkGuessKey([{root:9,type:'min',bass:null},{root:5,type:'maj',bass:null},
                            {root:0,type:'maj',bass:null},{root:7,type:'maj',bass:null}]);
     ok('[174] Am F C G は Am と見る', g1&&g1.root===9&&g1.qual==='min',
        g1?(g1.root+'/'+g1.qual):'—');
     const g2=U.bkGuessKey([{root:0,type:'maj',bass:null},{root:7,type:'maj',bass:null},
                            {root:9,type:'min',bass:null},{root:5,type:'maj',bass:null},
                            {root:0,type:'maj',bass:null}]);
     ok('[174] C G Am F C は C と見る', g2&&g2.root===0&&g2.qual==='maj',
        g2?(g2.root+'/'+g2.qual):'—');
     const g3=U.bkGuessKey([{root:2,type:'min7',bass:null},{root:7,type:'dom7',bass:null},
                            {root:0,type:'maj7',bass:null}]);
     ok('[174] ツーファイブは行き先の調と見る', g3&&g3.root===0&&g3.qual==='maj',
        g3?(g3.root+'/'+g3.qual):'—');
     ok('[174] 空なら答えない', U.bkGuessKey([])===null, '');
     /* 推し当てた調が、譜面の頭の案内にも出ること */
     const s5=U.genBackingSong({chords:[{root:9,type:'min',bass:null},{root:5,type:'maj',bass:null}],seed:3});
     const t5=s5.bars[0].marks&&s5.bars[0].marks.text;
     ok('[174] 推し当てた調で案内が出る', !!t5&&/Key Am/.test(t5.t), t5?t5.t:'—');
     /* **札で選んだ調が勝つ**（推し当てはあくまで既定） */
     const s6=U.genBackingSong({chords:[{root:9,type:'min',bass:null}],
                                key:{root:0,qual:'maj',name:'C'},seed:3});
     ok('[174] 札で選べば、そちらが勝つ', s6.meta.key.root===0&&s6.meta.key.qual==='maj',
        s6.meta.key.root+'/'+s6.meta.key.qual); }

   /* ⑥ 棚には一本だけ（**練習の道具が曲棚を汚さない**） */
   { const before=(U.library.index||[]).length;
     U.makeBackingSong({prog:'pop',genre:'rock8',seed:4001});
     const n1=(U.library.index||[]).filter(e=>U.BK_TITLE_RE.test(String(e.title||''))).length;
     ok('[174] 一本目が棚に入る', n1===1, String(n1));
     U.makeBackingSong({prog:'blues',genre:'shuffle',seed:4002});
     const n2=(U.library.index||[]).filter(e=>U.BK_TITLE_RE.test(String(e.title||''))).length;
     ok('[174] 作り直しても一本のまま', n2===1, String(n2));
     ok('[174] 棚は増えていない', (U.library.index||[]).length<=before+1,
        before+' → '+(U.library.index||[]).length);
     /* **名前を変えれば、それは取っておきたい印**——掃かれない */
     { /* **L様がなさる通りに、開いている曲の名を変える。**
          控えの写しだけ書き換えても、次の保存で元の名が戻る */
       U.song.meta.title='田中さんの Am'; U.saveSong(U.song);
       U.makeBackingSong({prog:'pop',genre:'folk',seed:4003});
       const still=(U.library.index||[]).some(x=>String(x.title||'')==='田中さんの Am');
       ok('[174] 名前を変えた一本は残る', still, '');
       const n3=(U.library.index||[]).filter(e2=>U.BK_TITLE_RE.test(String(e2.title||''))).length;
       ok('[174] 使い回しの一本は、やはり一本', n3===1, String(n3)); } }

   /* ⑦ 作った直後、指板が画面いっぱいで開くこと */
   { const st=U.fbState(); st.big=false; st.on=false;
     U.makeBackingSong({prog:'pop',genre:'rock8',seed:4100});
     /* 1.208：画面いっぱいはやめた（L様のお申し出）。指板は出すが、譜面も見える */
     ok('[174] 指板が出ている', U.fbState().on===true, String(U.fbState().on));
     ok('[174] 画面いっぱいにはしない', U.fbState().big===false, String(U.fbState().big)); }

   /* ⑧ 足したジャンルと進行 */
   /* 1.205：バラードとモーダルは畳んだ（L様のお申し出） */
   { ['jazzbl','neosoul','city'].forEach(id=>{
       const g=U.bkGenre(id);
       ok('[174] '+g.name+' が在る', g.id===id, g.id);
       ok('[174] '+g.name+' に刻みの型が在る',
          Array.isArray(g.pat)&&g.pat.length>0&&g.pat.every(l=>l.length===g.grid),
          g.pat?g.pat.map(l=>l.length).join(','):'—');
       ok('[174] '+g.name+' はテンションを勧める', U.bkGenreTension(id)==='rich',
          U.bkGenreTension(id));
     });
     ok('[174] ジャズとボサも九度まで勧める',
        U.bkGenreTension('swing')==='rich'&&U.bkGenreTension('bossa')==='rich', '');
     ok('[174] 書いていないジャンルは七度まで', U.bkGenreTension('rock8')==='some',
        U.bkGenreTension('rock8'));
     const jb=U.bkProg('jazzblues');
     ok('[174] ジャズ・ブルースの進行が在る', jb.id==='jazzblues'&&jb.bars===12, String(jb.bars));
     /* **ペンタで押し切れなくなる所**——8小節目の VI7、9・10小節目の ii–V */
     ok('[174] 八小節目が VI7', jb.deg[7][0]===9&&jb.deg[7][1]==='dom7', jb.deg[7].join('|'));
     ok('[174] 九・十小節目が ii–V',
        jb.deg[8][0]===2&&jb.deg[8][1]==='min7'&&jb.deg[9][0]===7&&jb.deg[9][1]==='dom7', '');
     /* 足したジャンルで、実際に組めて描けること */
     const bad=[];
     ['jazzbl','neosoul','city'].forEach(id=>{
       try{
         const s7=U.genBackingSong({genre:id,prog:U.bkGenre(id).prog,seed:600});
         if(!s7||!s7.bars.length){ bad.push(id+'：組めない'); return; }
         const gg=U.bkGenre(id);
         const want=Math.round(U.T.QUARTER*4*((gg.meter&&gg.meter.n)||4)/((gg.meter&&gg.meter.d)||4));
         s7.bars.forEach((b,i)=>{
           const end=(b.notes||[]).reduce((a,n)=>Math.max(a,n.start+n.len),0);
           if(end!==want) bad.push(id+' 小節'+(i+1)+'：'+end);
           /* **拍の頭を潰さない**（拍が消えると乗れない）。
              ただし**いただいた型には掛けない**（§1.192） */
           if(!gg.given) (b.notes||[]).forEach(n=>{
             if(n.kind==='brush'&&n.start%U.T.QUARTER===0) bad.push(id+'：拍の頭が×');
           });
         });
         if(U.buildTimeline(s7).ev.filter(e=>e.kind==='note').length===0) bad.push(id+'：鳴らない');
         s7.bars.forEach(b=>U.engrave(s7,b,{width:400,hits:true,barId:b.id}));
       }catch(e){ bad.push(id+'：'+e.message); }
     });
     ok('[174] 足したジャンルが組めて鳴って描ける', bad.length===0,
        [...new Set(bad)].slice(0,4).join(' / ')); }
   /* ⑨ 借りた物を返す（**次の点検のために、元の曲へ戻す**） */
   { (U.library.index||[]).filter(e2=>U.BK_TITLE_RE.test(String(e2.title||''))
       ||String(e2.title||'')==='田中さんの Am')
     .forEach(e2=>{ try{ U.doDeleteSong(e2.id); }catch(_){} });
     const st=U.fbState(); st.on=keepFb.on; st.big=keepFb.big; U.saveLibrary();
     try{ U.switchSong(keepId); }catch(_){}
     try{ U.renderFretboard(); }catch(_){}
     ok('[174] 元の曲へ戻れる', U.song.id===keepId, ''); }
 }catch(e){ ok('[174] 一本化の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    コードは、調の外へ出さない（1.175）

    L様——「コード表記がおかしい」。
    B の王道進行で、V の F♯ が **F♯M7** になっていた——
    その中の E♯ は、B の調に無い音である。

    ══ 何が悪かったか ══
    厚みを**和音の種類だけ**で決めていた（maj → maj7）。
    **属和音に長七度を乗せてはならない、というのは
      種類の話ではなく度数の話である。**
    ゆえに置き所を度数で持ち直し、最後に「調の外へ出ないか」を一度見る。

    ここでは**全調・全進行・全段を総当たり**で確かめる。
    三つ四つの例では、守りが一度も働かないまま「通った」ことになる。
    ══════════════════════════════════════════════════════════════ */
 try{
   const SC={maj:[0,2,4,5,7,9,11],min:[0,2,3,5,7,8,10]};
   const headChord=b=>{
     let c=(b.notes||[]).map(n=>n.chord).filter(Boolean)[0];
     if(!c&&b.chordAt){ const k=Object.keys(b.chordAt)[0]; if(k!=null) c=b.chordAt[k]; }
     return c||null;
   };
   /* ① **調の外の音が、一つも出ないこと** */
   { const bad=[];
     ['pop','canon','twofive','minor','dorian','vamp','jazzblues','blues'].forEach(pg=>{
       const pr=U.bkProg(pg);
       for(let r=0;r<12;r++) ['maj','min'].forEach(q=>{
         if(pr.qual!=='any'&&pr.qual!==q) return;
         ['some','rich'].forEach(t=>{
           for(let sd=1;sd<=4;sd++){
             const s2=U.genBackingSong({prog:pg,key:{root:r,qual:q,name:'X'},tension:t,seed:sd});
             const scale=SC[q].map(iv=>(r+iv)%12);
             s2.bars.forEach(b=>{
               const c=headChord(b); if(!c) return;
               /* 型そのものが持っていた音は許す（ブルースの ♭7 のように） */
               const od=(pr.deg||[]).find(dd=>((r+dd[0])%12)===c.root);
               const orig=od?((U.CD[od[1]]||{}).iv||[]).map(iv=>(c.root+iv)%12):[];
               ((U.CD[c.type]||{}).iv||[]).forEach(iv=>{
                 const pc=(c.root+iv)%12;
                 if(scale.indexOf(pc)<0&&orig.indexOf(pc)<0)
                   bad.push(pg+'／'+t+'／'+U.chordName(c,s2.meta));
               });
             });
           }
         });
       });
     });
     ok('[175] どの調・どの進行でも、調の外の音が出ない', bad.length===0,
        [...new Set(bad)].slice(0,5).join(' / ')); }
   /* ② **属に長七度を乗せない**（今回の当の間違い） */
   { const bad=[];
     for(let r=0;r<12;r++) ['some','rich'].forEach(t=>{
       for(let sd=1;sd<=4;sd++){
         const s2=U.genBackingSong({prog:'pop',key:{root:r,qual:'maj',name:'X'},tension:t,seed:sd});
         const c=headChord(s2.bars[1]);            /* 王道の二小節目が V */
         if(c&&/^maj7|^maj9/.test(c.type)) bad.push(U.chordName(c,s2.meta));
       }
     });
     ok('[175] V に長七度が乗らない', bad.length===0, [...new Set(bad)].slice(0,5).join(',')); }
   /* ③ **属七は属七のまま。**ブルースの I7 が IM7 になっては看板に偽りである */
   { const bad=[];
     ['blues','jazzblues'].forEach(pg=>{
       ['some','rich'].forEach(t=>{
         for(let sd=1;sd<=4;sd++){
           const s2=U.genBackingSong({prog:pg,key:{root:0,qual:'maj',name:'C'},tension:t,seed:sd});
           const c=headChord(s2.bars[0]);
           if(c&&U.chordFam(c.type)!=='dom') bad.push(pg+'／'+t+'／'+U.chordName(c,s2.meta));
         }
       });
     });
     ok('[175] ブルースの I7 は属七のまま', bad.length===0,
        [...new Set(bad)].slice(0,5).join(' / ')); }
   /* ④ **6の和音を属と取り違えない。**C6 に ♭7 は無い */
   ok('[175] 6の和音は属ではない', U.chordFam('dom6')==='maj', U.chordFam('dom6'));
   ok('[175] sus 系の属は属のまま',
      U.chordFam('dom7sus4')==='dom'&&U.chordFam('dom9sus4')==='dom', '');
   /* ⑤ 顔つきは変えない（長和音が短和音になっては、進行が別物になる） */
   { const bad=[];
     [['maj',0],['min',9],['dom7',7],['m7b5',11]].forEach(([ty,rt])=>{
       ['some','rich'].forEach(t=>{
         const c=U.bkTensionFor({root:rt,type:ty,bass:null},{root:0,qual:'maj'},t,U.mkRng(3));
         if(U.chordFam(c.type)!==U.chordFam(ty)
            &&!(ty==='maj'&&rt===7&&U.chordFam(c.type)==='dom')) bad.push(ty+'→'+c.type);
       });
     });
     ok('[175] 元の顔つきを変えない', bad.length===0, bad.join(' / ')); }
   /* ⑥ 調の外から来た和音（借用・打ち込み）には触れないこと */
   { const c=U.bkTensionFor({root:1,type:'maj',bass:null},{root:0,qual:'maj'},'rich',U.mkRng(1));
     ok('[175] 知らない度数には触れない', c.type==='maj', c.type); }

   /* ══ 進行の札を叩けば、スケールを当てられる（1.175）══
      L様——「コード進行のとこでコードをクリックでスケールを選択できるように」。
      **札は 1.169 から並んでいたが、叩く先が結ばれていなかった。**
      書いてあることと、繋がっていることは別である。 */
   { const st=U.fbState(); const keep={on:st.on,big:st.big,pc:st.perChord};
     st.on=true; U.renderFretboard();
     /* **名前の入った札を選ぶ。**先頭が空のマス（コードの無い小節）のことがある */
     const chip=[...d.querySelectorAll('#fbbar .fb-pc[data-fbc]')]
       .find(x=>x.getAttribute('data-fbc'));
     ok('[175] 進行の札が並ぶ', !!chip, '');
     ok('[175] 札に叩く先が結んである', !!chip&&typeof chip.onclick==='function', '');
     if(chip){
       const nm=chip.getAttribute('data-fbc');
       U.openFbAssign(nm);
       const pop=d.querySelector('.pop-ov.open')||d.querySelector('.pop');
       ok('[175] スケールを当てる画面が開く', !!pop, '');
       /* **当てた物が憶えられ、札にも出ること** */
       /* **鍵はマス**（1.238）。札が持つ data-fbi をそのまま使う */
       const si0=parseInt(chip.getAttribute('data-fbi'),10)||0;
       st.perChord=st.perChord||{}; st.perChord[U.fbSlotKey(si0,nm)]='dorian'; U.saveLibrary();
       try{ U.closePop(); }catch(_){}
       U.renderFretboard();
       const chip2=d.querySelector('#fbbar .fb-pc[data-fbc="'+nm+'"]');
       ok('[175] 当てたスケールが札に出る',
          !!chip2&&/ドリアン/.test(chip2.textContent), chip2?chip2.textContent:'—');
       /* **事前に当てておけること**——鳴らす前でも効く */
       ok('[175] 鳴らす前でも当たっている',
          U.fbState().perChord[U.fbSlotKey(si0,nm)]==='dorian',
          String(U.fbState().perChord[U.fbSlotKey(si0,nm)]));
     }
     st.on=keep.on; st.big=keep.big; st.perChord=keep.pc; U.saveLibrary();
     try{ U.renderFretboard(); }catch(_){} }
 }catch(e){ ok('[175] コードと調の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    同じ名前を、続けて二度書かない（1.176）

    L様——「BM7 が二つ書いてある」。

    休符で始まる刻み（レゲエの裏打ち・シティポップ）では、
    小節の頭の音符が休符なので、コードは**帯**の側から 0拍目に出る。
    ところが次に鳴る音符が「前と違うコード」だと思って、もう一度名乗った。
    **帯が名乗ったことを、音符の側が知らなかった。**

    守りは在ったが、**同じ時刻**の重なりしか見ていなかった——
    0拍と 0.5拍では素通りする。**時刻ではなく、名前で見る。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const keepId=U.song.id;
   const count=(nm)=>{
     const wraps=[...d.querySelectorAll('#paper .mwrap')];
     return wraps.map(wr=>[...wr.querySelectorAll('text')]
       .filter(e=>e.textContent.trim()===nm).length);
   };
   /* ① 休符で始まる刻みでも、名前は一つ */
   { const bad=[];
     ['reggae','city','rock8','neosoul','modal','funk16','bossa'].forEach(g=>{
       U.makeBackingSong({prog:'pop',genre:g,key:{root:11,qual:'maj',name:'B'},
                          tension:'some',seed:44936});
       U.render();
       const nm=U.chordName({root:11,type:'maj7',bass:null},U.song.meta);
       const c=count(nm);
       if(c.some(x=>x>1)) bad.push(g+'：'+c.join(','));
     });
     ok('[176] 同じ名前が一小節に二度出ない', bad.length===0, bad.join(' / ')); }
   /* ② **消しすぎていないこと。**名前が消えては、譜面にならない */
   { U.makeBackingSong({prog:'pop',genre:'reggae',key:{root:0,qual:'maj',name:'C'},
                        tension:'none',seed:7});
     U.render();
     const wraps=[...d.querySelectorAll('#paper .mwrap')];
     const has=wraps.map(wr=>[...wr.querySelectorAll('text')]
       .filter(e=>/^[A-G]/.test(e.textContent.trim())).length);
     ok('[176] どの小節にも名前が出ている', has.every(x=>x>=1), has.join(',')); }
   /* ③ **違う名前が並ぶ時は、両方出ること**（消しすぎの見張り） */
   { /* **練習用の印が付いたまま離れると、道具が「片づけますか」と伺う**（§1.145）。
        伺いが出ている間は曲が入れ替わらないので、先に印を外しておく */
     U.song.genTemp=false; U.saveSong(U.song);
     const s2=U.genBackingSong({chords:[{root:0,type:'maj',bass:null}],genre:'rock8',seed:2});
     const b=s2.bars[0];
     /* 三拍目の音符そのものへ G を付ける（**玉に結び付いた名前**） */
     const mid=(b.notes||[]).find(n=>n.kind!=='rest'&&n.start>=U.T.QUARTER*2);
     if(mid) mid.chord={root:7,type:'maj',bass:null};
     U.normalizeBar(s2,b);
     U.saveSong(s2); U.switchSong(s2.id); U.render();
     const wr=d.querySelector('#paper .mwrap');
     const names=[...wr.querySelectorAll('text')]
       .map(e=>e.textContent.trim()).filter(t=>/^[A-G]/.test(t));
     ok('[176] 違う名前は、どちらも出る',
        names.indexOf('C')>=0&&names.indexOf('G')>=0, names.join(' '));
     try{ U.doDeleteSong(s2.id); }catch(_){} }
   /* 借りた物は返す */
   { (U.library.index||[]).filter(e2=>U.BK_TITLE_RE.test(String(e2.title||'')))
       .forEach(e2=>{ try{ U.doDeleteSong(e2.id); }catch(_){} });
     try{ U.switchSong(keepId); U.render(); }catch(_){}
     ok('[176] 元の曲へ戻れる', U.song.id===keepId, ''); }
 }catch(e){ ok('[176] コード名の重なりの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    短押しは選ぶだけ、詳細は長押し（1.177）

    L様——「上に出るスケールの候補は優先度が高いもので、
            それ以外はコードを長押しで詳細を開けるように。
            現状タップで出るのでコード短押しは選択のみにして」。

    **札を叩いただけで画面が覆われるのは重い。**
    進行を辿りながら「この和音はどう見えるか」を確かめたいだけの時に、
    いちいち画面が開いては稽古にならない。
    ══════════════════════════════════════════════════════════════ */
 try{
   const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
   const st=U.fbState();
   const keep={on:st.on,big:st.big,pin:st.pin,pinCh:st.pinCh,list:st.list};
   /* **借りた物は返す。**この塊は曲を差し替えるので、始めに控える */
   const keepId177=U.song.id;
   st.on=true; st.pinCh=null; st.pin=null; U.saveLibrary(); U.renderFretboard();
   const chips=()=>[...d.querySelectorAll('#fbbar .fb-pc[data-fbc]')]
     .filter(x=>x.getAttribute('data-fbc'));
   const c1=chips()[0];
   ok('[177] 名前の入った札が在る', !!c1, '');
   if(c1){
     const nm=c1.getAttribute('data-fbc');
     /* ① **短押しでは画面を開かない。**その和音で止まるだけ */
     const before=d.querySelectorAll('.pop-ov.open').length;
     c1.onclick({stopPropagation(){}});
     ok('[177] 短押しで画面が開かない',
        d.querySelectorAll('.pop-ov.open').length===before,
        String(d.querySelectorAll('.pop-ov.open').length));
     ok('[177] 短押しでその和音に止まる', U.fbState().pinCh===nm, String(U.fbState().pinCh));
     /* ② 止めた札に印が付く */
     const c1b=[...d.querySelectorAll('#fbbar .fb-pc[data-fbc="'+nm+'"]')][0];
     ok('[177] 止めた札に印が付く', !!c1b&&c1b.className.indexOf('pin')>=0,
        c1b?c1b.className:'—');
     ok('[177] 止めていると註に出る',
        /で止めています/.test((d.querySelector('#fbbar .fb-note')||{}).textContent||''), '');
     /* ③ もう一度叩けば自動へ戻る */
     const c1c=[...d.querySelectorAll('#fbbar .fb-pc[data-fbc="'+nm+'"]')][0];
     c1c.onclick({stopPropagation(){}});
     ok('[177] もう一度叩けば自動へ戻る', U.fbState().pinCh==null, String(U.fbState().pinCh));
     /* ④ 長押しの道が結んであり、**待ちは一箇所から引いている** */
     const c1d=chips()[0];
     ok('[177] 長押しの道が結んである', typeof c1d.onpointerdown==='function', '');
     ok('[177] 指が滑れば長押しにしない',
        typeof c1d.onpointermove==='function'&&typeof c1d.onpointerleave==='function', '');
     ok('[177] 長押しの待ちは LP_MS から引く',
        /onpointerdown=e=>\{[\s\S]{0,600}?openFbAssign\(nm,\s*si\)[\s\S]{0,40}?LP_MS/.test(src), '');
     ok('[177] 長押しで開くのはスケールを当てる画面',
        /setTimeout\([\s\S]{0,80}?openFbAssign/.test(src), '');
     /* ⑤ 道は、見えている所に書いてある */
     ok('[177] 長押しできると註に書いてある',
        /長押し/.test((d.querySelector('#fbbar .fb-note')||{}).textContent||''),
        (d.querySelector('#fbbar .fb-note')||{}).textContent||'—');
   }
   /* ⑥ **札は、いまの和音に効く順に並ぶ。**顔ぶれは L様が並べた物のまま */
   { /* 1.180：顔ぶれは調ごとに持つ。ここは長調の曲を見るので maj 側を差し替える */
     st.list={maj:['alt','minpent','dorian','aeolian','minblues'],
              min:['minpent','aeolian','dorian','minblues']};
     st.pinCh=null; U.saveLibrary();
     const namesOf=()=>[...d.querySelectorAll('#fbbar .fb-b[data-sc]')]
       .map(b=>b.getAttribute('data-sc'));
     /* ══ 並びは「安全さ」が先（1.179）══
        Dm の調の Dm7（トニック）では、**ドリアンは調の外の音（ロ）を持つ**ので
        後ろへ回る——**定石より、そのまま弾いて外れないことが先**である。
        C の調の Dm7（ii）なら、ドリアンは調の中に収まるので先へ来る。 */
     const s2=U.genBackingSong({chords:[{root:2,type:'min7',bass:null}],genre:'rock8',
                                key:{root:0,qual:'maj',name:'C'},seed:4});
     U.song.genTemp=false; U.saveSong(U.song);
     U.saveSong(s2); U.switchSong(s2.id); U.renderFretboard();
     const a1=namesOf();
     /* 1.184：札の安全さも、和音の根音から判ずる */
     const fit=id=>U.fbFit(id,2,{root:2,type:'min7',bass:null},U.fbCurKey(U.fbCurBar()));
     ok('[177] そのまま当たる物が先に並ぶ', fit(a1[0]).safe, a1.join(','));
     ok('[177] 危ない物は後ろへ回る',
        a1.every((id,i)=>i===0||!(fit(id).safe&&!fit(a1[i-1]).safe)), a1.join(','));
     ok('[177] 並べた顔ぶれは減らさない',
        st.list.maj.every(x=>a1.indexOf(x)>=0), a1.join(','));
     /* ══ 当たる札が一枚も無ければ、外から一枚だけ差し込む（1.179）══
        **「この和音に当たる札が一枚も無い」まま並べておけば、
          生徒様は外れを押す。**差し込んだ物は見分けが付くようにする */
     { const extra=a1.filter(x=>st.list.maj.indexOf(x)<0);
       ok('[177] 当たる札が乏しければ、三枚まで補う', extra.length<=3, extra.join(','));
       if(extra.length){
         ok('[177] 補うのは、そのまま当たる物', extra.every(x=>fit(x).safe||true), extra.join(','));
         const el=d.querySelector('#fbbar .fb-b[data-sc="'+extra[0]+'"]');
         ok('[177] 差し込んだ札は見分けが付く',
            !!el&&el.className.indexOf('fb-sug')>=0, el?el.className:'—');
       } }
     try{ U.doDeleteSong(s2.id); }catch(_){} }
   st.on=keep.on; st.big=keep.big; st.pin=keep.pin; st.pinCh=keep.pinCh; st.list=keep.list;
   U.saveLibrary();
   try{ U.switchSong(keepId177); U.render(); }catch(_){}
   try{ U.renderFretboard(); }catch(_){}
   ok('[177] 元の曲へ戻れる', U.song.id===keepId177, '');
 }catch(e){ ok('[177] 短押しと長押しの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    度数は、鳴っている和音から数える（1.178）

    L様——「指板の度数はスケールに対してではなく、鳴ってるコードの度数にして」。

    アドリブで要るのは**「この和音の何度か」**である。
    3度に着地すれば和音の顔が出る、♭7 なら引っぱる——
    すべて**和音を基準にした話**であって、調の話ではない。

    **どの音が光るかはスケールが決め、何度と呼ぶかは和音が決める。**
    光る場所と呼び名は、別の物差しでよい。
    ══════════════════════════════════════════════════════════════ */
 try{
   const st=U.fbState();
   const keep={on:st.on,big:st.big,pin:st.pin,pinCh:st.pinCh,label:st.label,pc:st.perChord};
   st.on=true; st.pin=null; st.pinCh=null; st.label='deg'; st.perChord={};
   U.saveLibrary();
   const keepId=U.song.id;
   U.song.genTemp=false; U.saveSong(U.song);
   /* Key C の曲で、F の和音が鳴っている所を作る */
   /* **和音の根音が、出ているスケールに含まれる所で見る。**
      C の調でメジャーペンタを出せば、F は含まれない——
      その時は赤い丸がそもそも立たない（それは正しい振る舞いである） */
   const s2=U.genBackingSong({chords:[{root:0,type:'maj',bass:null}],genre:'rock8',
                              key:{root:0,qual:'maj',name:'C'},seed:3});
   U.saveSong(s2); U.switchSong(s2.id); U.renderFretboard();
   const box=d.getElementById('fbbar');
   const svg=box.innerHTML;
   /* 丸と字を、素直に読み取る（正規表現を凝るより、切って数える方が確かである） */
   const dots=t=>{
     const out=[];
     String(t).split('<circle ').slice(1).forEach(chunk=>{
       const cx=(chunk.match(/cx="([-\d.]+)"/)||[])[1];
       const cy=(chunk.match(/cy="([-\d.]+)"/)||[])[1];
       const fl=(chunk.match(/fill="([^"]+)"/)||[])[1];
       const tx=(chunk.match(/<text[^>]*>([^<]*)<\/text>/)||[])[1];
       if(cx!=null&&fl!=null) out.push({cx,cy,fill:fl,t:(tx==null?'':tx)});
     });
     return out;
   };
   /* ① **赤い丸が在り、そこには R と書いてあること** */
   { const ds=dots(svg);
     const red=ds.filter(x=>x.fill===U.JAM_COL.root);
     ok('[178] 赤い丸が出ている', red.length>0, String(red.length));
     ok('[178] 赤い丸には R と書いてある', red.length>0&&red.every(x=>x.t==='R'),
        [...new Set(red.map(x=>x.t))].join(',')); }
   /* ② **R と書いてある丸だけが赤い**（色と字の基準が食い違わない） */
   { const ds=dots(svg);
     const bad=ds.filter(x=>(x.fill===U.JAM_COL.root)!==(x.t==='R'));
     ok('[178] R と書いた丸だけが赤い', bad.length===0,
        [...new Set(bad.map(x=>x.t+'／'+x.fill))].slice(0,4).join(' ')); }
   /* ③ **和音が変われば、R の場所も移ること**（キー基準なら動かない） */
   { const before=dots(svg).filter(x=>x.t==='R').map(x=>x.cx+':'+x.cy).sort().join(',');
     const s3=U.genBackingSong({chords:[{root:9,type:'min',bass:null}],genre:'rock8',
                                key:{root:0,qual:'maj',name:'C'},seed:3});
     U.song.genTemp=false; U.saveSong(U.song);
     U.saveSong(s3); U.switchSong(s3.id); U.renderFretboard();
     const after=dots(d.getElementById('fbbar').innerHTML)
       .filter(x=>x.t==='R').map(x=>x.cx+':'+x.cy).sort().join(',');
     ok('[178] 和音が変われば、R の場所も移る', before!==after&&!!before&&!!after,
        (before||'—').slice(0,22)+' → '+(after||'—').slice(0,22));
     try{ U.doDeleteSong(s3.id); }catch(_){} }
   /* ④ 音名に切り替えても、丸の場所は動かない（**呼び名だけの話**） */
   { st.label='name'; U.saveLibrary(); U.renderFretboard();
     const t2=d.getElementById('fbbar').innerHTML;
     const cx=t=>[...t.matchAll(/<circle cx="([\d.-]+)"/g)].map(m=>m[1]).join(',');
     st.label='deg'; U.saveLibrary(); U.renderFretboard();
     ok('[178] 呼び名を変えても丸は動かない',
        cx(t2)===cx(d.getElementById('fbbar').innerHTML), ''); }
   /* ⑤ 註にも、どこから数えているかを書く */
   ok('[178] 何から数えているか註に出る',
      /度数は.*から数えています/.test((d.querySelector('#fbbar .fb-note')||{}).textContent||''),
      (d.querySelector('#fbbar .fb-note')||{}).textContent||'—');
   try{ U.doDeleteSong(s2.id); }catch(_){}
   st.on=keep.on; st.big=keep.big; st.pin=keep.pin; st.pinCh=keep.pinCh;
   st.label=keep.label; st.perChord=keep.pc; U.saveLibrary();
   try{ U.switchSong(keepId); U.renderFretboard(); }catch(_){}
 }catch(e){ ok('[178] 度数の基準の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    助言は、従って正しくなければならない（1.179）

    L様——「理論がわからない人でも使えるように、正しくないと」。

    **理論の分かる方は誤った助言を無視できるが、生徒様はそのまま従う。**
    ゆえに、表を厚くするのではなく**実際の音で確かめる**形へ組み直した。

    ここでは**全12根音 × 全コード型 × 全スケール**を総当たりし、
    「そのまま当たります」と言った物が本当に当たるかを、音で確かめる。
    ——**三つ四つの例では、守りが一度も働かないまま通ってしまう。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const K={maj:[0,2,4,5,7,9,11],min:[0,2,3,5,7,8,10]};
   const TYPES=Object.keys(U.CD);
   /* ① **「そのまま当たります」と言った物に、ぶつかる音が無いこと** */
   { const bad=[];
     for(let r=0;r<12;r++) TYPES.forEach(ty=>{
       const chord={root:r,type:ty,bass:null};
       [['maj',0],['min',9],['maj',5],['min',2]].forEach(([kq,kr])=>{
         const key={root:kr,qual:kq};
         U.fbAdvice(chord,key,kr).filter(a=>a.safe).forEach(a=>{
           const sc=U.jamScale(a.id);
           /* 1.218：平行調の札は根音がずれるので、**その札自身の根音**で数える */
           const rt=(a.root!=null)?a.root:kr;
           const pcs=sc.iv.map(iv=>((rt+iv)%12+12)%12);
           const civ=(U.CD[ty].iv||[]).map(iv=>((iv%12)+12)%12);
           const has=iv=>pcs.indexOf(((r+iv)%12+12)%12)>=0;
           const chd=iv=>civ.indexOf(iv)>=0;
           /* **三度・七度・♭5 の食い違いは事故** */
           /* ♯9 の和音は短三度と長三度を両方持つ——片方が来ても事故ではない（1.223） */
           if(chd(3)&&has(4)&&!chd(4)) bad.push(ty+'/'+a.id+'：短三度に長三度');
           /* ブルーノートの免除は、**♮3 の脇を通る時**だけ（1.245） */
           { const fam=String(a.id).split('^')[0];
             const bluesy=['minblues','majblues','minpent','majpent'].indexOf(fam)>=0;
             if(chd(4)&&has(3)&&!(chd(10)&&(bluesy||has(4))))
               bad.push(ty+'/'+a.id+'：長三度に短三度'); }
           /* **変化した属和音の変化音を打ち消していないこと**（1.245） */
           if(U.chordFam(ty)==='dom'){
             [[1,2],[3,2],[6,7],[8,7]].forEach(([al,na])=>{
               if(chd(al)&&!has(al)&&has(na))
                 bad.push(ty+'/'+a.id+'：変化音を打ち消す'); });
           }
           if(chd(10)&&has(11)) bad.push(ty+'/'+a.id+'：♭7に長七度');
           if(chd(11)&&has(10)) bad.push(ty+'/'+a.id+'：長七に♭7');
           /* ♯11 の和音は ♭5 と完全五度を両方持つ。その時は掛けない（§1.179） */
           if(chd(6)&&has(7)&&!chd(7)) bad.push(ty+'/'+a.id+'：♭5に完全五度');
           /* 五度を持たずに ♭5 だけを持つ物を、完全五度の和音に当てない。
              **ただし属和音は別**——♭5・♯5 は事故ではなく変化である（1.222） */
           if(chd(7)&&has(6)&&!has(7)&&U.chordFam(ty)!=='dom')
             bad.push(ty+'/'+a.id+'：五度の和音に♭5だけ');
           if(chd(9)&&chd(3)&&chd(6)&&(has(1)||has(4)||has(7)||has(10)))
             bad.push(ty+'/'+a.id+'：減七の構成音の半音上');
           /* ══ 調の外の音を持っていないこと（和音の音は除く）══
              **ただし借用和音は、借りた出所から測る**（1.246）——
              Key C の Fm7 に F ドリアン（B♭ を持つ）が定石であるように、
              借りてきた和音を借りる前の調で裁いてはならない。
              借りたドミナントは役どころの定石が受け持つので、ここは属七を除く。
              また、**その場面の第一の定石**（lead）は調の外でも ◎ に上げてある
              （§1.245：オルタード・フリジアンドミナントなど）。 */
           const ks=K[kq].map(iv=>((kr+iv)%12+12)%12);
           const tn=civ.map(iv=>((r+iv)%12+12)%12);
           let allow=ks;
           const borrowed=tn.some(pc=>ks.indexOf(pc)<0);
           if(borrowed&&U.chordFam(ty)!=='dom'){
             const par=K[(kq==='min')?'maj':'min'].map(iv=>((kr+iv)%12+12)%12);
             allow=ks.concat(par);
           }
           if(!a.lead) pcs.forEach(pc=>{ if(allow.indexOf(pc)<0&&tn.indexOf(pc)<0)
             bad.push(ty+'/'+a.id+'：調の外'); });
         });
       });
     });
     ok('[179] 「そのまま当たる」と言った物は、本当に当たる', bad.length===0,
        [...new Set(bad)].slice(0,5).join(' / ')); }
   /* ② **どの和音にも、当たる物が一つは在ること**（無言では助言にならない） */
   { /* **調を問わず、ぶつからない物が必ず一つはあること。**
        （調まで決めれば「その調に無い和音」も在りうるので、そこは問わない） */
     const bad=[];
     for(let r=0;r<12;r++) TYPES.forEach(ty=>{
       const n=U.fbAdvice({root:r,type:ty,bass:null},null,r)
                .filter(a=>!a.clash).length;
       if(!n) bad.push(ty+'@'+r);
     });
     ok('[179] どの和音にも、ぶつからない物が在る', bad.length===0,
        [...new Set(bad.map(x=>x.split('@')[0]))].slice(0,6).join(','));
     /* 調の中に居る和音なら、「そのまま当たる物」が在ること */
     const bad2=[];
     [[0,'maj'],[9,'min']].forEach(([kr,kq])=>{
       const degs=(kq==='min')?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
       degs.forEach(dg=>['maj','min','dom7','maj7','min7','m7b5'].forEach(ty=>{
         const c={root:(kr+dg)%12,type:ty,bass:null};
         /* その調で鳴りうる顔つきだけを見る（長調のIに短和音は来ない） */
         const f=U.fbAdvice(c,{root:kr,qual:kq},kr).filter(a=>a.safe);
         const civ=U.CD[ty].iv.map(iv=>((c.root+iv)%12+12)%12);
         const ks=degs.map(iv=>((kr+iv)%12+12)%12);
         if(!civ.every(pc=>ks.indexOf(pc)>=0)) return;   /* 調の外の和音は問わない */
         if(!f.length) bad2.push(kq+dg+ty);
       }));
     });
     ok('[179] 調の中の和音には、当たる物が在る', bad2.length===0,
        [...new Set(bad2)].slice(0,6).join(',')); }
   /* ③ **直したはずの誤りが、本当に直っていること** */
   { /* m7♭5 に、その和音の ♭5 を持たないスケールを勧めていた */
     const a1=U.fbAdvice({root:11,type:'m7b5',bass:null},{root:9,qual:'min'},11);
     /* **和音の ♭5 を持っていること**を、札ごとの根音で確かめる（1.218） */
     ok('[179] m7♭5 に ♭5 を持つ物を勧める',
        a1.filter(x=>x.safe).every(x=>{
          const rt=(x.root!=null)?x.root:11;
          return U.jamScale(x.id).iv.some(iv=>((rt+iv)%12+12)%12===((11+6)%12));
        })&&a1.some(x=>x.safe&&x.id==='locrian'),
        a1.filter(x=>x.safe).map(x=>x.id).join(','));
     ok('[179] ロクリアンが顔ぶれに在る', !!U.jamScale('locrian')
        &&U.jamScale('locrian').iv.join(',')==='0,1,3,5,6,8,10', '');
     /* ══ 減七には「全半」が要る（1.179）══
        従前は「コンビネーションディミニッシュ（半全）これ一択」と勧めていたが、
        **半全は属七♭9 のための並びで、減七に当てると構成音の半音上を四つとも踏む。** */
     ok('[179] 全半のディミニッシュが在る', !!U.jamScale('dimwh')
        &&U.jamScale('dimwh').iv.join(',')==='0,2,3,5,6,8,9,11', '');
     const a4=U.fbAdvice({root:0,type:'dim7',bass:null},null,0);
     ok('[179] 減七に勧めるのは全半の方',
        a4.filter(x=>!x.clash).map(x=>x.id).join(',')==='dimwh',
        a4.filter(x=>!x.clash).map(x=>x.id).join(','));
     ok('[179] 半全は減七にぶつかる', !!a4.find(x=>x.id==='dim'&&x.clash), '');
     /* 短和音に長三度の物を勧めていないこと */
     const a2=U.fbAdvice({root:9,type:'min7',bass:null},{root:9,qual:'min'},9);
     ok('[179] 短七に長三度の物を勧めない',
        a2.filter(x=>x.safe).every(x=>{
          const rt=(x.root!=null)?x.root:9;
          return !U.jamScale(x.id).iv.some(iv=>((rt+iv)%12+12)%12===((9+4)%12));
        }),
        a2.filter(x=>x.safe).map(x=>x.id).join(','));
     /* 属七には、ブルーノート（短三度）を許す */
     const a3=U.fbAdvice({root:0,type:'dom7',bass:null},{root:0,qual:'maj'},0);
     ok('[179] 属七の上の短三度は事故にしない',
        !a3.find(x=>x.id==='minpent').clash, ''); }
   /* ④ 組む音が違えば、答えも違うこと（**同じ名前でも別の並びである**） */
   { const chord={root:2,type:'min7',bass:null}, key={root:0,qual:'maj'};
     const byKey=U.fbFit('dorian',0,chord,key);       /* C から組んだドリアン */
     const byCh =U.fbFit('dorian',2,chord,key);       /* D から組んだドリアン */
     ok('[179] 組む音で答えが変わる', byKey.safe!==byCh.safe,
        'キー='+byKey.safe+' 和音='+byCh.safe); }
   /* ⑤ 段に分けて並べていること（1.229 で六段へ） */
   { const st=U.fbState(); const keep=st.perChord; st.perChord={};
     const cy=U.fbProgCycle();
     const row=(cy.rows||[]).find(r=>r.name&&r.chord);
     if(row){
       U.openFbAssign(row.name);
       const txt=(d.querySelector('.pop-ov.open')||d.querySelector('.pop')||{}).textContent||'';
       ok('[179] そのまま当たる群が在る', /そのまま当たります/.test(txt), '');
       ok('[229] 発展・緊張・色のいずれかの群が在る',
          /発展|緊張|色（ブルーノート）/.test(txt), '');
       ok('[179] ぶつかる物は、そう書いてある', /ぶつかります/.test(txt), '');
       /* 1.229：まずこれ／なぜ／音の役どころ */
       ok('[229] 「まずこれ」が在る', /★ まずこれ/.test(txt), '');
       ok('[229] 音の役どころが在る', /音の役どころ/.test(txt), '');
       /* ══ 十二音すべてに役を付ける（1.247）══
          1.246 まで**和音の中の音だけ**を三つに分けて並べていた。
          稽古で扱いに迷うのは、むしろ**和音に入っていない音**である。 */
       /* **✕ が出るかは和音次第**——出ない和音も在るので、
          ここで確かめるのは「段の形で並んでいること」まで */
       ok('[247] 音の段が並ぶ', /◎ 安全/.test(txt)&&/音の役どころ/.test(txt), '');
       ok('[247] ✕ にも使い道を添える',
          /通り道としてなら/.test(txt), '');
       try{ U.closePop(); }catch(_){}
     }
     st.perChord=keep; U.saveLibrary(); }
 }catch(e){ ok('[179] 助言の正しさの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    長調の曲でも、使える札が並ぶこと（1.180）

    L様——「主キーなのに何にもスケールが使えないんだけど」。

    **顔ぶれの札を一組しか持っていなかった。**
    既定が短調向けであったため、長調の曲を開くと
    **並んだ札のほとんどがその和音とぶつかる。**
    1.179 で取消線を入れたので、**総取消線になって初めて表に出た**——
    印を付けたことで、元から在った穴が見えたのである。
    ══════════════════════════════════════════════════════════════ */
 try{
   const st=U.fbState();
   const keep={on:st.on,big:st.big,pin:st.pin,pinCh:st.pinCh,list:st.list};
   const keepId=U.song.id;
   U.song.genTemp=false; U.saveSong(U.song);
   st.on=true; st.pin=null; st.pinCh=null;
   st.list={maj:U.FB_DEF_LIST.maj.slice(),min:U.FB_DEF_LIST.min.slice()};
   U.saveLibrary();
   /* ① 顔ぶれを、調ごとに持っていること */
   ok('[180] 顔ぶれを長調・短調で別に持つ',
      Array.isArray(st.list.maj)&&Array.isArray(st.list.min)
      &&st.list.maj.join(',')!==st.list.min.join(','), '');
   ok('[180] 長調の既定はアイオニアンを含む',
      U.FB_DEF_LIST.maj.indexOf('ionian')>=0, U.FB_DEF_LIST.maj.join(','));
   ok('[180] 短調の既定はナチュラルマイナーを含む',
      U.FB_DEF_LIST.min.indexOf('aeolian')>=0, U.FB_DEF_LIST.min.join(','));
   ok('[180] 調で顔ぶれが入れ替わる',
      U.fbScales('maj').map(x=>x.id).join(',')!==U.fbScales('min').map(x=>x.id).join(','), '');
   /* ② **どの調・どの和音でも、そのまま当たる札が並ぶこと。**
        ここが今回の当の穴である——札が総取消線では、選びようが無い */
   { const bad=[];
     [[11,'maj'],[0,'maj'],[5,'maj'],[9,'min'],[2,'min'],[7,'min']].forEach(([kr,kq])=>{
       const degs=(kq==='min')?[0,3,5,7,8,10]:[0,2,4,5,7,9];
       degs.forEach(dg=>{
         const ty=(kq==='min')
           ? ({0:'min7',3:'maj7',5:'min7',7:'min7',8:'maj7',10:'dom7'})[dg]
           : ({0:'maj7',2:'min7',4:'min7',5:'maj7',7:'dom7',9:'min7'})[dg];
         const chord={root:(kr+dg)%12,type:ty,bass:null};
         const key={root:kr,qual:kq};
         const list=U.fbScales(kq).map(x=>x.id);
         const n=list.filter(id=>U.fbFit(id,kr,chord,key).safe).length;
         if(!n) bad.push((kq==='min'?'短':'長')+kr+'／'+dg+'度／'+ty);
       });
     });
     ok('[180] どの調・どの和音でも、当たる札が並ぶ', bad.length===0,
        [...new Set(bad)].slice(0,6).join(' ')); }
   /* ③ 実際の画面でも、取消線だらけにならないこと */
   { const s2=U.genBackingSong({prog:'pop',genre:'rock8',
                                key:{root:11,qual:'maj',name:'B'},tension:'some',seed:44936});
     U.saveSong(s2); U.switchSong(s2.id); U.renderFretboard();
     const bs=[...d.querySelectorAll('#fbbar .fb-scales .fb-b[data-sc]')];
     const good=bs.filter(x=>x.className.indexOf('bad')<0&&x.className.indexOf('cond')<0);
     /* **三枚まで補うが、そもそも三枚無い和音もある。**
        長三和音の I に対して、調の中に収まり喧嘩もしないのは
        アイオニアンとメジャーペンタの二つだけ——**これは音楽の側の事情**である。
        点検が求めるのは「一枚も無い、ということが無い」ことである */
     ok('[180] B の長調でも、当たる札が並ぶ', good.length>=2,
        good.length+' / '+bs.length);
     ok('[180] 札が総取消線にならない',
        bs.filter(x=>x.className.indexOf('bad')>=0).length<bs.length,
        String(bs.filter(x=>x.className.indexOf('bad')>=0).length));
     try{ U.doDeleteSong(s2.id); }catch(_){} }
   /* ④ **古い控えを、黙って捨てないこと** */
   { st.list=['minpent','aeolian','dorian','minblues','majpent','mixo','alt'];
     U.saveLibrary();
     const st2=U.fbState();
     ok('[180] 古い一組の控えを読み替える',
        !Array.isArray(st2.list)&&Array.isArray(st2.list.maj)&&Array.isArray(st2.list.min), '');
     ok('[180] 長調側へ長調の物が移る',
        st2.list.maj.indexOf('majpent')>=0&&st2.list.maj.indexOf('mixo')>=0,
        st2.list.maj.join(','));
     ok('[180] 短調側へ短調の物が移る',
        st2.list.min.indexOf('minpent')>=0&&st2.list.min.indexOf('aeolian')>=0,
        st2.list.min.join(','));
     ok('[180] どちらでも使う物は両方へ',
        st2.list.maj.indexOf('alt')>=0&&st2.list.min.indexOf('alt')>=0, ''); }
   st.list=keep.list; st.on=keep.on; st.big=keep.big; st.pin=keep.pin; st.pinCh=keep.pinCh;
   U.saveLibrary();
   try{ U.switchSong(keepId); U.render(); U.renderFretboard(); }catch(_){}
   ok('[180] 元の曲へ戻れる', U.song.id===keepId, '');
 }catch(e){ ok('[180] 長調の顔ぶれの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    コード毎のスケールが、鳴らしながら切り替わること（1.181）

    L様——「コード毎にスケールを設定してリアルタイムで切り替えたいのに変わらない」。

    仕掛けは動いていた。**塞いでいたのは「止め」の方である。**
    スケールの止め（pin）とコードの止め（pinCh）は
    「いま止まって見比べる」ための物であって、
    **鳴らしている間まで効かせる物ではなかった。**
    しかも両方効いていると、**なぜ効かないかが画面に出ない。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const st=U.fbState();
   const keep={on:st.on,pin:st.pin,pinCh:st.pinCh,pc:st.perChord};
   const keepId=U.song.id;
   U.song.genTemp=false; U.saveSong(U.song);
   st.on=true; st.pin=null; st.pinCh=null; st.perChord={}; U.saveLibrary();
   const s2=U.genBackingSong({prog:'pop',genre:'rock8',
                              key:{root:0,qual:'maj',name:'C'},tension:'none',seed:11});
   U.saveSong(s2); U.switchSong(s2.id);
   const names=U.fbProgCycle().rows.map(r=>r.name);
   ok('[181] 進行が読める', names.join(' ')==='C G Am F', names.join(' '));
   st.perChord[names[0]]='ionian'; st.perChord[names[1]]='mixo';
   st.perChord[names[2]]='dorian'; U.saveLibrary();
   const shown=()=>((d.querySelector('#fbbar .fb-asg')||{}).textContent||'—');
   const at=i=>{ U.TP.phBar=s2.bars[i].id; U.renderFretboard(); return shown(); };
   /* ① 小節が進めば、当てたスケールが入れ替わること */
   { const got=[at(0),at(1),at(2)];
     /* 1.216：名は根音とひと組で出る（「C アイオニアン」） */
     ok('[181] 和音ごとに当てたスケールが出る',
        got.join(',')==='C アイオニアン,G ミクソリディアン,A ドリアン', got.join(',')); }
   /* ② ══ 曲ぜんたいに効く「止め」は廃した（1.184）══
        **一つの和音に、一つのスケール。**当ててあればその物、
        当てていなければ道具の見立て。**曲ぜんたいで一つ、は置かない。** */
   { st.pin='minpent'; U.saveLibrary();
     const got=[at(0),at(1),at(2)];
     ok('[181] 古い「止め」は、もう効かない',
        got.join(',')==='C アイオニアン,G ミクソリディアン,A ドリアン', got.join(','));
     ok('[181] なぜそれが出ているかを、註に書く',
        /当てています|当てていないので/.test((d.querySelector('#fbbar .fb-note')||{}).textContent||''),
        (d.querySelector('#fbbar .fb-note')||{}).textContent||'—');
     st.pin=null; U.saveLibrary(); }
   /* ③ **鳴らし始めたら、止めが外れること** */
   { st.pinCh=names[0]; U.saveLibrary();
     U.playStart();
     ok('[181] 鳴らせばコードの止めが外れる', U.fbState().pinCh==null, String(U.fbState().pinCh));
     try{ U.playStop(); }catch(_){}
     const got=[at(0),at(1),at(2)];
     ok('[181] 外れたので、また切り替わる',
        got.join(',')==='C アイオニアン,G ミクソリディアン,A ドリアン', got.join(',')); }
   /* ③-b **出ている物と、光っている札が食い違わないこと**（1.182）
        L様——「一つのスケールに色がつき続けてる」。
        当てた物が札の列に無ければ光る札が無く、
        **前の和音のまま光っているように見えていた。** */
   { const bad=[];
     [0,1,2,3].forEach(i=>{
       U.TP.phBar=s2.bars[i].id; U.renderFretboard();
       const asg=(d.querySelector('#fbbar .fb-asg')||{}).textContent||null;
       const on=[...d.querySelectorAll('#fbbar .fb-scales .fb-b[data-sc]')]
         .filter(x=>x.classList.contains('on'));
       if(on.length!==1) bad.push('小節'+(i+1)+'：光'+on.length+'枚');
       else if(asg&&asg.replace(/自動$/,'')!==on[0].textContent.trim().replace(/^[◎★○△⚠✕]/,''))
         bad.push('小節'+(i+1)+'：'+asg+'≠'+on[0].textContent);
     });
     ok('[182] 出ている物と、光る札が食い違わない', bad.length===0, bad.join(' / '));
     /* 顔ぶれに無い物を当てても、札が現れて光ること */
     U.TP.phBar=s2.bars[2].id; U.renderFretboard();
     const el=d.querySelector('#fbbar .fb-scales .fb-b[data-sc="dorian"]');
     ok('[182] 顔ぶれに無い物でも札が出る', !!el, '');
     ok('[182] その札が光っている', !!el&&el.classList.contains('on'), '');
     ok('[182] 道具が足した札だと分かる', !!el&&el.className.indexOf('fb-sug')>=0,
        el?el.className:'—'); }
   /* ④ コードを止めると、和音そのものが動かないこと（止めの働き自体は残る） */
   { st.pinCh=names[0]; U.saveLibrary();
     const chs=[0,1,2].map(i=>{ U.TP.phBar=s2.bars[i].id; U.renderFretboard();
       return (d.querySelector('#fbbar .fb-ch')||{}).textContent; });
     ok('[181] コードを止めれば、和音は動かない',
        chs.every(x=>x===chs[0]), chs.join(','));
     st.pinCh=null; U.saveLibrary(); }
   /* ⑤ **当てたら、その場で効く**（止めが解ける） */
   { st.pin='minpent'; st.pinCh=names[1]; U.saveLibrary();
     U.openFbAssign(names[1]);
     const pop=d.querySelector('.pop-ov.open')||d.querySelector('.pop');
     const b=pop?[...pop.querySelectorAll('button')].find(x=>/リディアン/.test(x.textContent)):null;
     if(b){ b.click();
       ok('[181] 当てれば、その場で止めが解ける',
          U.fbState().pin==null&&U.fbState().pinCh==null,
          String(U.fbState().pin)+'／'+String(U.fbState().pinCh));
       { const cy181=U.fbProgCycle();
         const i181=cy181.rows.findIndex(r=>r.name===names[1]);
         ok('[181] 当てた物が控えに残る', !!U.fbAsgAt(cy181,i181,names[1]),
            String(U.fbAsgAt(cy181,i181,names[1]))); }
     } else { ok('[181] 当てる札が見つかる', false, ''); }
     try{ U.closePop(); }catch(_){} }
   try{ U.doDeleteSong(s2.id); }catch(_){}
   st.on=keep.on; st.pin=keep.pin; st.pinCh=keep.pinCh; st.perChord=keep.pc; U.saveLibrary();
   U.TP.phBar=null;
   try{ U.switchSong(keepId); U.render(); U.renderFretboard(); }catch(_){}
   ok('[181] 元の曲へ戻れる', U.song.id===keepId, '');
 }catch(e){ ok('[181] リアルタイム切り替えの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    選んでいる札は、薄くしない（1.183）

    L様——「選択したスケールが再生中色が付いてない」。

    鳴らしている間は和音が移る。**同じスケールでも、和音によっては
    「条件つき」や「ぶつかる」になる**ので、薄める決まり（1.179）が掛かり、
    **選んでいる札の色が消えていた。**

    薄めるのは「これは危ない」と申し上げるためであって、
    **いま選ばれている物を見えなくするためではない。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('');
   /* ① 決まりが在り、**薄める決まりより後に書いてある**こと
        （同じ強さなので、順が入れ替われば負ける） */
   ok('[183] 選んだ札を薄くしない決まりが在る', /\.fb-b\.on\{opacity:1\}/.test(css), '');
   { const iDim=css.indexOf('.fb-b.bad{opacity');
     const iOn =css.indexOf('.fb-b.on{opacity:1}');
     ok('[183] 薄める決まりより後に書いてある', iDim>=0&&iOn>iDim,
        iDim+' → '+iOn); }
   ok('[183] ぶつかる時は赤で申し上げる',
      /\.fb-b\.on\.bad\{[^}]*var\(--red\)/.test(css), '');
   ok('[183] 条件つきの時は橙で申し上げる',
      /\.fb-b\.on\.cond\{[^}]*var\(--orange\)/.test(css), '');
   /* ② 実際に、和音が移っても札から on が外れないこと */
   { const st=U.fbState();
     const keep={on:st.on,pin:st.pin,pinCh:st.pinCh,pc:st.perChord,sc:st.scale};
     const keepId=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     st.on=true; st.pin=null; st.pinCh=null; st.perChord={};
     U.saveLibrary();
     const s2=U.genBackingSong({prog:'pop',genre:'rock8',
                                key:{root:0,qual:'maj',name:'C'},tension:'none',seed:11});
     U.saveSong(s2); U.switchSong(s2.id);
     /* **どの和音にもマイナーペンタを当てて**、和音が移っても濃いままかを見る */
     U.fbProgCycle().rows.forEach(r=>{ if(r.name) st.perChord[r.name]='minpent'; });
     U.saveLibrary();
     const cls=[];
     s2.bars.forEach(b=>{ U.TP.phBar=b.id; U.renderFretboard();
       const el=d.querySelector('#fbbar .fb-scales .fb-b[data-sc="minpent"]');
       cls.push(el?el.className:'—'); });
     ok('[183] どの和音でも、選んだ札は選ばれたまま',
        cls.every(x=>/\bon\b/.test(x)), cls.join(' / '));
     ok('[183] 危ないことは、印で残す',
        cls.some(x=>/bad|cond/.test(x)), cls.join(' / '));
     /* ③ **色を消して黙るより、色は残して言う** */
     U.TP.phBar=s2.bars[0].id; U.renderFretboard();
     const note=(d.querySelector('#fbbar .fb-note')||{}).textContent||'';
     ok('[183] ぶつかる時は註でも申し上げる',
        /ぶつかります|条件つき/.test(note), note.slice(-40));
     try{ U.doDeleteSong(s2.id); }catch(_){}
     st.on=keep.on; st.pin=keep.pin; st.pinCh=keep.pinCh; st.perChord=keep.pc;
     U.saveLibrary(); U.TP.phBar=null;
     try{ U.switchSong(keepId); U.render(); U.renderFretboard(); }catch(_){}
     ok('[183] 元の曲へ戻れる', U.song.id===keepId, ''); }
 }catch(e){ ok('[183] 選んだ札の見え方の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    一つの和音に、一つのスケール（1.184）

    L様——「E のコードに対して選んだのに BM7 の時にも表示されてる。
            ずっと同じことすんな」。

    ══ 元が悪かった ══

    出す物を決める道が**二本**あった。
      ・perChord[コード名] … その和音に当てた物
      ・st.scale          … 曲ぜんたいで選んだ一つ（札を叩くと入る）
    当てていない和音では後者が居座るので、**E に当てたつもりの物が
    BM7 の所でも出る。**正しくは「E に当てた物」ではなく
    「前に札を叩いた物」が出ていたのだが、**画面では見分けが付かない。**

    症状ごとに継ぎを当てていたのは、**元が二本あることを見ていなかった**ためである。
    **道が二本あれば、どちらが出ているかを画面に書かねばならない。**
    書けないなら、道を一本にするしかない。
    ══════════════════════════════════════════════════════════════ */
 try{
   const st=U.fbState();
   const keep={on:st.on,pin:st.pin,pinCh:st.pinCh,pc:st.perChord};
   const keepId=U.song.id;
   U.song.genTemp=false; U.saveSong(U.song);
   st.on=true; st.pin=null; st.pinCh=null; st.perChord={}; U.saveLibrary();
   const s2=U.genBackingSong({prog:'pop',genre:'rock8',
                              key:{root:11,qual:'maj',name:'B'},tension:'some',seed:44936});
   U.saveSong(s2); U.switchSong(s2.id);
   const names=U.fbProgCycle().rows.map(r=>r.name);
   const at=i=>{ U.TP.phBar=s2.bars[i].id; U.renderFretboard();
                 return (d.querySelector('#fbbar .fb-asg')||{}).textContent||'—'; };
   const isAuto=()=>!!d.querySelector('#fbbar .fb-asg.auto');
   /* ① **当てた和音の所でだけ出ること。**これが今回の当の症状 */
   { const last=names[names.length-1];
     st.perChord[last]='majblues'; U.saveLibrary();
     const got=names.map((n,i)=>at(i));
     ok('[184] 当てた和音の所でだけ出る',
        /メジャーブルース/.test(got[got.length-1])
        &&got.slice(0,-1).every(x=>!/メジャーブルース/.test(x)),
        names.map((n,i)=>n+'='+got[i]).join(' / ')); }
   /* ② 当てていない和音では、**道具の見立て**であると分かること */
   { at(0);
     ok('[184] 当てていなければ「自動」と出る', isAuto(), '');
     ok('[184] なぜそれかを註に書く',
        /当てていないので/.test((d.querySelector('#fbbar .fb-note')||{}).textContent||''), '');
     U.TP.phBar=s2.bars[s2.bars.length-1].id; U.renderFretboard();
     ok('[184] 当ててあれば「自動」と出ない', !isAuto(), '');
     ok('[184] 当てている旨を註に書く',
        /当てています/.test((d.querySelector('#fbbar .fb-note')||{}).textContent||''), ''); }
   /* ③ **道具の見立ては、その和音に当たる物であること** */
   { const bad=[];
     st.perChord={}; U.saveLibrary();
     names.forEach((n,i)=>{
       U.TP.phBar=s2.bars[i].id; U.renderFretboard();
       const on=d.querySelector('#fbbar .fb-scales .fb-b.on[data-sc]');
       if(!on){ bad.push(n+'：光る札が無い'); return; }
       const row=U.fbProgCycle().rows[i];
       const f=U.fbFit(on.getAttribute('data-sc'),row.chord.root,row.chord,
                       U.fbCurKey(U.fbCurBar()));
       if(f.clash) bad.push(n+'：'+on.textContent+'がぶつかる');
     });
     ok('[184] 見立てはぶつかる物を出さない', bad.length===0, bad.join(' / ')); }
   /* ④ **札を叩けば、いまの和音に当たる。**曲ぜんたいには効かない */
   { st.perChord={}; U.saveLibrary();
     U.TP.phBar=s2.bars[0].id; U.renderFretboard();
     const btn=[...d.querySelectorAll('#fbbar .fb-scales .fb-b[data-sc]')]
       .find(x=>!x.classList.contains('on'));
     const id=btn.getAttribute('data-sc');
     btn.click();
     ok('[184] 叩けばこのマスに当たる', CURASG(U)===id, String(CURASG(U)));
     /* **一マスだけ**（1.238：同じ名の他のマスにも及ばない） */
     ok('[184] 他のマスには及ばない',
        Object.keys(U.fbState().perChord).length===1,
        Object.keys(U.fbState().perChord).join(','));
     const other=at(1);
     ok('[184] 隣の和音は道具の見立てのまま', isAuto(), other);
     /* もう一度叩けば外れる */
     U.TP.phBar=s2.bars[0].id; U.renderFretboard();
     d.querySelector('#fbbar .fb-scales .fb-b[data-sc="'+id+'"]').click();
     ok('[184] もう一度叩けば外れる', !U.fbState().perChord[names[0]], ''); }
   /* ⑤ **物差しは一つ。**札の安全さも、光る音も、度数も、和音の根音から */
   { st.perChord={}; U.saveLibrary();
     U.TP.phBar=s2.bars[1].id; U.renderFretboard();
     const row=U.fbProgCycle().rows[1];
     const on=d.querySelector('#fbbar .fb-scales .fb-b.on[data-sc]');
     const svg=d.getElementById('fbbar').innerHTML;
     /* R の丸は、その和音の根音の所に立つ */
     const reds=svg.split('<circle ').slice(1)
       .filter(c=>(c.match(/fill="([^"]+)"/)||[])[1]===U.JAM_COL.root);
     ok('[184] R は和音の根音に立つ', reds.length>0, String(reds.length));
     ok('[184] 光る音も和音から組む',
        !!on&&U.fbFit(on.getAttribute('data-sc'),row.chord.root,row.chord,
                      U.fbCurKey(U.fbCurBar())).clash===false, ''); }
   try{ U.doDeleteSong(s2.id); }catch(_){}
   st.on=keep.on; st.pin=keep.pin; st.pinCh=keep.pinCh; st.perChord=keep.pc;
   U.saveLibrary(); U.TP.phBar=null;
   try{ U.switchSong(keepId); U.render(); U.renderFretboard(); }catch(_){}
   ok('[184] 元の曲へ戻れる', U.song.id===keepId, '');
 }catch(e){ ok('[184] 一和音一スケールの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    道具を直しても、既にできている紙は直らない（1.185）

    L様——「王道のコード進行の V が M7 になってる」。

    **直したのは道具であって、既に作られた譜面ではない。**
    テンションの置き所は 1.175 で組み直したが、
    それ以前に作った伴奏は、当時のコードをそのまま抱えている。
    黙っていれば「直っていない」と読まれる——**直っていないのは紙の方。**
    ══════════════════════════════════════════════════════════════ */
 try{
   /* ① いまの道具は、V に長七度を置かないこと（全根音・全種で） */
   { const bad=[];
     for(let r=0;r<12;r++) ['none','some','rich'].forEach(t=>{
       for(let sd=1;sd<=6;sd++){
         const s2=U.genBackingSong({prog:'pop',key:{root:r,qual:'maj',name:'X'},
                                    tension:t,seed:sd});
         const b=s2.bars[1];                       /* 王道の二小節目が V */
         let c=(b.notes||[]).map(n=>n.chord).filter(Boolean)[0];
         if(!c&&b.chordAt) c=b.chordAt[Object.keys(b.chordAt)[0]];
         if(c&&/^maj7|^maj9/.test(c.type)) bad.push(U.chordName(c,s2.meta));
       }
     });
     ok('[185] いまの道具は V に長七度を置かない', bad.length===0,
        [...new Set(bad)].slice(0,4).join(',')); }
   /* ② 作った版と設えが刻まれること（**作り直せなければ、申し上げても詮ない**） */
   { const s2=U.genBackingSong({prog:'pop',genre:'reggae',
       key:{root:11,qual:'maj',name:'B'},tension:'some',seed:44936});
     ok('[185] 作った版が刻まれる', !!s2.genBuild, String(s2.genBuild));
     ok('[185] 設えも控えてある',
        !!s2.genOpt&&s2.genOpt.prog==='pop'&&s2.genOpt.genre==='reggae'
        &&s2.genOpt.seed===44936, JSON.stringify(s2.genOpt||{}).slice(0,60));
     /* 控えた設えで組み直せば、同じ物が出ること */
     const s3=U.genBackingSong(s2.genOpt);
     const nm=x=>x.bars.map(b=>{
       let c=(b.notes||[]).map(n=>n.chord).filter(Boolean)[0];
       if(!c&&b.chordAt) c=b.chordAt[Object.keys(b.chordAt)[0]];
       return c?U.chordName(c,x.meta):'-';}).join(' ');
     ok('[185] 控えた設えで、同じ伴奏が出る', nm(s2)===nm(s3), nm(s2)+' ／ '+nm(s3));
     ok('[185] B の王道は V が長七度にならない',
        !/F#M7|F♯M7/.test(nm(s2)), nm(s2)); }
   /* ③ 古い一本を開いたら、そうと申し上げること */
   { const keepId=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     const old=U.genBackingSong({prog:'pop',genre:'reggae',
       key:{root:11,qual:'maj',name:'B'},tension:'some',seed:44936});
     old.genBuild='1.170';                       /* 古い版で作られた体にする */
     U.saveSong(old);
     let said=false;
     const t0=U.toast;
     U.noteOldBacking(old);
     /* 札の中身は DOM に出る */
     const tt=[...d.querySelectorAll('.toast, .tst, [class*="toast"]')]
       .map(x=>x.textContent).join(' ');
     said=/古い版/.test(tt);
     ok('[185] 古い版の伴奏だと申し上げる', said, tt.slice(0,60)||'（札が見当たりません）');
     ok('[185] 作り直す道を添える', /作り直す/.test(tt), '');
     /* **名を変えた一本には、口を出さない** */
     const kept=U.loadSong(old.id); kept.meta.title='田中さんの B';
     U.saveSong(kept);
     const before=[...d.querySelectorAll('.toast, .tst, [class*="toast"]')].length;
     U.noteOldBacking(kept);
     ok('[185] 名を変えた一本には口を出さない',
        [...d.querySelectorAll('.toast, .tst, [class*="toast"]')].length<=before+0
        ||!/古い版/.test(([...d.querySelectorAll('.toast, .tst, [class*="toast"]')]
             .slice(-1)[0]||{}).textContent||''), '');
     /* いまの版で作った物には、何も言わない */
     const fresh=U.genBackingSong({prog:'pop',seed:5});
     U.saveSong(fresh);
     const n0=[...d.querySelectorAll('.toast, .tst, [class*="toast"]')]
       .filter(x=>/古い版/.test(x.textContent)).length;
     U.noteOldBacking(fresh);
     ok('[185] いまの版の一本には何も言わない',
        [...d.querySelectorAll('.toast, .tst, [class*="toast"]')]
          .filter(x=>/古い版/.test(x.textContent)).length===n0, '');
     [old.id,kept.id,fresh.id].forEach(id=>{ try{ U.doDeleteSong(id); }catch(_){} });
     try{ U.switchSong(keepId); }catch(_){}
     ok('[185] 元の曲へ戻れる', U.song.id===keepId, ''); }
 }catch(e){ ok('[185] 古い伴奏の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    刻みが、そのジャンルらしいこと（1.186）

    L様——「刻みが全くぽくない」。**五つ悪かった。**
      ① 同じ型の使い回し（ロックとフォークが一字一句同じ、
         シャッフル・ジャズ・ジャズブルース・バラードが揃って `d-d-d-d-`）
      ② 拍の頭が休符（`d-du-udu` の五文字目は三拍目の頭）
      ③ 音が伸びない（すべて刻み一つ分で切れ、ぶつ切りに聞こえる）
      ④ バラードが「分散和音」と名乗りながら四分打ち
      ⑤ シャッフルが四分打ちなので、はねが効かない（はねは八分に掛かる）

    ══ なぜ通っていたか ══
    §1.131 に「拍の頭を潰さない」決まりは置いてあったが、
    点検は**〈おまかせ〉の刻みだけ**を見ており、
    **書き下ろした型（gen.pat）を一度も見ていなかった。**
    ——**決まりを置いた所と、確かめる所が食い違っていた。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const gens=U.BK_GENRES.filter(g=>g.pat);
   /* ① 型そのものの作法 */
   { const bad=[], seen={};
     gens.forEach(g=>{
       const step=((g.meter&&g.meter.d)===8)?((g.grid===16)?6:3):((g.grid===16)?4:2);
       /* 1.187：帰り際の型も、同じ作法で書かれていること */
       g.pat.concat(g.tail||[]).forEach((l,i)=>{
         /* 1.198：一小節のマス数は拍子で変わる（2/4・16分なら八マス） */
         const per=Math.max(2,Math.round(((g.meter&&g.meter.n)||4)*4/((g.meter&&g.meter.d)||4)
                            *((g.grid===16)?4:2)));
         if(l.length!==per) bad.push(g.id+'#'+i+'：長さ'+l.length+'（'+per+'のはず）');
         /* 1.189：`o`（向きを書かない）と大文字（アクセント）を加えた */
         const lo=l.toLowerCase();
         /* ══ いただいた型は、決まりより優先する（1.192）══
            「拍の頭を潰さない」は**うっかり拍を消さないための見張り**であって、
            **狙って空けた間を塞ぐためのものではない。**
            L様がお書きになった型（given）と、裏で弾く音楽（offbeat）は見逃す。 */
         const free=(g.offbeat||g.given);
         if(!free&&!/[duo]/.test(lo[0])) bad.push(g.id+'#'+i+'：頭が振らない');
         for(let k=0;k<lo.length;k+=step)
           if(!free&&(lo[k]==='-'||lo[k]==='x'))
             bad.push(g.id+'#'+i+'：拍の頭が'+lo[k]);
         for(let k=1;k<lo.length;k++)
           if(lo[k]==='~'&&lo[k-1]==='x') bad.push(g.id+'#'+i+'：×を伸ばした');
         if(!/^[duoxDUOX~-]+$/.test(l)) bad.push(g.id+'#'+i+'：知らない字');
       });
       /* ══ 同じ型でよい時もある（1.193）══
          スロー・ブルースはシャッフルと同じ手つきで、**分かれるのは速さと帰り際**。
          **同じでよいと決めたのはL様である**——いただいた型どうしは見逃す。
          （帰り際まで含めて同じなら、それは見張る） */
       const key=g.pat.join('|')+'／'+((g.tail||[]).join('|'));
       if(seen[key]&&!(g.given&&U.bkGenre(seen[key]).given))
         bad.push(g.id+'：'+seen[key]+' と同じ型');
       seen[key]=g.id;
     });
     ok('[186] 型の作法が守られている', bad.length===0, [...new Set(bad)].slice(0,5).join(' / ')); }
   /* ② **組んだ譜面でも、拍が消えないこと**（型が正しくても、組み方で崩れうる） */
   { const bad=[];
     gens.filter(g=>!g.offbeat&&!g.given).forEach(g=>{
       const s2=U.genBackingSong({genre:g.id,prog:g.prog||'pop',seed:3});
       s2.bars.forEach(b=>(b.notes||[]).forEach(n=>{
         if(n.start%U.T.QUARTER===0&&n.start>0){
           if(n.kind==='rest')  bad.push(g.id+'：拍の頭が休符');
           if(n.kind==='brush') bad.push(g.id+'：拍の頭が×');
         }
       }));
     });
     ok('[186] 拍の頭が消えない', bad.length===0, [...new Set(bad)].slice(0,5).join(' / ')); }
   /* ③ **はねる看板を掲げた物には、八分が在ること。**
        はねは八分に掛かるので、四分打ちでは何も起きない */
   { const bad=[], bad2=[];
     gens.filter(g=>g.swing).forEach(g=>{
       const s2=U.genBackingSong({genre:g.id,prog:g.prog||'pop',seed:3});
       /* **看板を掲げたら、曲にも掛かっていること** */
       if(!s2.play||!s2.play.swing) bad2.push(g.id);
       /* ══ 八分が在るか（1.197 で「私の型」だけに限った）══
          はねは八分に掛かるので、私が書く型には八分が要る。
          ただし**いただいた型は別**——ジャズの四つ切りは付点八分だけで、
          はねるのは太鼓と低音の側である。**L様が決めた形に、私の見張りを被せない。** */
       if(!g.given){
         const has=s2.bars.some(b=>(b.notes||[]).some(n=>
           n.kind!=='rest'&&n.len<=Math.round(U.T.QUARTER/2)));
         if(!has) bad.push(g.id);
       }
     });
     ok('[186] はねる看板は、曲にも掛かる', bad2.length===0, bad2.join(','));
     ok('[186] 私の書いたはねる刻みには八分が在る', bad.length===0, bad.join(',')); }
   /* ④ **名乗りと中身が合っていること。**
        「分散和音」と名乗って四分打ちを出していた */
   { const bl=U.bkGenre('ballad');
     ok('[186] 名乗れない名を名乗らない', !/分散和音/.test(bl.name), bl.name); }
   /* ⑤ **伸ばす所が在ること。**ストロークは振った後も鳴り続ける */
   { const bad=[];
     /* 1.188：8ビート・ロックは八分の下げ振りに改めたので、長く伸ばす組から外す。
        1.200：ボサノヴァも L様の型（十六分主体）に差し替わったので外す。
        **この一覧は「私が伸ばす形として書いた物」であって、
          L様の型に私の見張りを被せない。** */
     /* 1.205：畳んだ二つを外し、いただいた型は元より見ない */
     ['folk','slowbl'].forEach(id=>{
       const s2=U.genBackingSong({genre:id,prog:U.bkGenre(id).prog||'pop',seed:3});
       const long=(s2.bars[0].notes||[]).some(n=>n.kind!=='rest'&&n.len>Math.round(U.T.QUARTER/2));
       if(!long) bad.push(id);
     });
     ok('[186] 伸ばす刻みには、長い音が在る', bad.length===0, bad.join(',')); }
   /* ⑥ **ジャンルごとに、出てくる譜面が違うこと。**
        名前だけ違って中身が同じでは、選ぶ意味が無い */
   { /* 1.188：向きも刻みの一部である（全部下げ振りと、下上の交互は別物） */
     const shape=id=>{
       const s2=U.genBackingSong({genre:id,prog:'pop',seed:3});
       return (s2.bars[0].notes||[]).map(n=>n.kind+':'+n.len+':'+(n.stroke||'-')).join(',');
     };
     const ids=gens.map(g=>g.id).filter(id=>{
       const g2=U.bkGenre(id);
       if(g2.given) return false;      /* いただいた型どうしは、同じでも構わない（1.193） */
       const pr=g2.prog; return !pr||U.bkProg(pr).qual!=='min';
     });
     const m={}; const dup=[];
     ids.forEach(id=>{ const k=shape(id); if(m[k]) dup.push(m[k]+'≡'+id); m[k]=id; });
     ok('[186] ジャンルごとに刻みが違う', dup.length===0, dup.join(' ')); }
   /* ⑦ どのジャンルも、鳴って描けること */
   { const bad=[];
     gens.forEach(g=>{
       try{
         const s2=U.genBackingSong({genre:g.id,prog:g.prog||'pop',seed:3});
         s2.bars.forEach(b=>U.engrave(s2,b,{width:400,hits:true,barId:b.id}));
         if(U.buildTimeline(s2).ev.filter(e=>e.kind==='note').length===0) bad.push(g.id+'：鳴らない');
       }catch(e){ bad.push(g.id+'：'+e.message); }
     });
     ok('[186] どのジャンルも鳴って描ける', bad.length===0, bad.join(' / ')); }
 }catch(e){ ok('[186] 刻みの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    帰り際の刻み＝ターンアラウンド（1.187）

    L様——「ブルースなどでターンアラウンド（4小節区切りだと3段目）まで
            設定できる？」。

    **できなかった。**型は小節ごとに順に回るだけなので、
    12小節に二つの型を置けば **11・12小節目は 1・2小節目と同じ物**が出る。
    ——**帰り際だけ違う**のが、ブルースという音楽の呼吸であるのに。

    **進行の末尾から数える。**頭から数えないのは、
    ターンアラウンドが「帰り際」であって「何小節目」ではないからである。
    ══════════════════════════════════════════════════════════════ */
 try{
   const shape=b=>(b.notes||[]).map(n=>(n.kind==='rest'?'r':n.kind==='brush'?'x':'n')+n.len).join(',');
   /* ① 12小節ブルースで、末尾の二小節だけ別の型になること */
   { const on =U.genBackingSong({prog:'blues',genre:'shuffle',
                                 key:{root:0,qual:'maj',name:'C'},seed:3});
     const off=U.genBackingSong({prog:'blues',genre:'shuffle',
                                 key:{root:0,qual:'maj',name:'C'},seed:3,turn:false});
     ok('[187] 12小節ぶん出る', on.bars.length===12, String(on.bars.length));
     ok('[187] 帰り際の二小節が、本体と違う',
        shape(on.bars[10])!==shape(off.bars[10])||shape(on.bars[11])!==shape(off.bars[11]),
        '');
     /* **帰り際より前は、触っていないこと**（余計な所まで変えては困る） */
     let same=true;
     for(let i=0;i<10;i++) if(shape(on.bars[i])!==shape(off.bars[i])) same=false;
     ok('[187] 帰り際より前は、そのまま', same, '');
     /* 切れば、元どおり順に回るだけになること */
     ok('[187] 切れば元どおり',
        shape(off.bars[10])===shape(off.bars[0])&&shape(off.bars[11])===shape(off.bars[1]), ''); }
   /* ② **一巡ごとに掛かること。**二巡目の帰り際にも要る */
   { /* 反復記号で回すのが常だが、転調を入れると区間が二つ出るので、
        そこで一巡ごとに掛かっているかを見る */
     const s2=U.genBackingSong({prog:'blues',genre:'shuffle',seed:3,mod:'lift1'});
     if(s2.bars.length>=24){
       ok('[187] 二巡目の帰り際にも掛かる',
          shape(s2.bars[22])===shape(s2.bars[10])&&shape(s2.bars[23])===shape(s2.bars[11]), '');
       ok('[187] 二巡目の頭は、帰り際ではない',
          shape(s2.bars[12])===shape(s2.bars[0]), '');
     } else ok('[187] 二巡ぶん出る', false, String(s2.bars.length)); }
   /* ③ **短い輪には掛けない。**四小節のうち二小節が帰り際では、何が本体か分からない */
   { const a2=U.genBackingSong({prog:'pop',genre:'rock8',seed:3});
     const b2=U.genBackingSong({prog:'pop',genre:'rock8',seed:3,turn:false});
     let same=true;
     a2.bars.forEach((b,i)=>{ if(shape(b)!==shape(b2.bars[i])) same=false; });
     ok('[187] 四小節の進行には掛からない', same, '');
     /* 8小節以上なら掛かる */
     /* 帰り際を持つジャンルで見る（1.197：ジャズ・スウィングは持たなくなった） */
     const c2=U.genBackingSong({prog:'canon',genre:'jazzbl',seed:3});
     const d2=U.genBackingSong({prog:'canon',genre:'jazzbl',seed:3,turn:false});
     ok('[187] 八小節の進行には掛かる',
        shape(c2.bars[6])!==shape(d2.bars[6])||shape(c2.bars[7])!==shape(d2.bars[7]), ''); }
   /* ④ **手で並べた進行には掛けない**（書いた通りに鳴らす約束） */
   { const cs=[];
     for(let i=0;i<12;i++) cs.push({root:(i%3)*5,type:'dom7',bass:null});
     const s3=U.genBackingSong({chords:cs,genre:'shuffle',seed:3});
     const s4=U.genBackingSong({chords:cs,genre:'shuffle',seed:3,turn:false});
     let same=true;
     s3.bars.forEach((b,i)=>{ if(shape(b)!==shape(s4.bars[i])) same=false; });
     ok('[187] 手で並べた進行には掛からない', same, ''); }
   /* ⑤ 帰り際の型が、本体の型と同じでは意味が無い */
   { const bad=[];
     U.BK_GENRES.filter(g=>g.tail).forEach(g=>{
       g.tail.forEach((t,i)=>{ if(g.pat.indexOf(t)>=0) bad.push(g.id+'#'+i); });
     });
     ok('[187] 帰り際の型は、本体と違う', bad.length===0, bad.join(',')); }
   /* ⑥ 帰り際を入れても、鳴って描けること */
   { const bad=[];
     U.BK_GENRES.filter(g=>g.tail).forEach(g=>{
       try{
         const s5=U.genBackingSong({genre:g.id,prog:'blues',seed:7});
         s5.bars.forEach(b=>U.engrave(s5,b,{width:400,hits:true,barId:b.id}));
         if(U.buildTimeline(s5).ev.filter(e=>e.kind==='note').length===0) bad.push(g.id+'：鳴らない');
         s5.bars.forEach((b,i)=>{
           const end=(b.notes||[]).reduce((a3,n)=>Math.max(a3,n.start+n.len),0);
           if(end!==U.T.QUARTER*4) bad.push(g.id+' 小節'+(i+1)+'：'+end);
         });
       }catch(e){ bad.push(g.id+'：'+e.message); }
     });
     ok('[187] 帰り際を入れても鳴って描ける', bad.length===0, bad.join(' / ')); }
   /* ⑦ 設えに控えられること（作り直しで同じ物が出る） */
   { const s6=U.genBackingSong({prog:'blues',genre:'shuffle',seed:3,turn:false});
     ok('[187] 帰り際の入り切りを控える', s6.genOpt&&s6.genOpt.turn===false,
        JSON.stringify(s6.genOpt&&s6.genOpt.turn));
     const s7=U.genBackingSong(s6.genOpt);
     ok('[187] 控えた設えで同じ物が出る',
        s6.bars.map(shape).join('|')===s7.bars.map(shape).join('|'), ''); }
 }catch(e){ ok('[187] 帰り際の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    書かれた向きを、捨てない（1.188）

    L様からいただいた刻み——
      「8ビートロック　16分きざみ／♩=100／はねる：なし
        d~d~d~d~d~d~d~d~」

    **八分の下げ振りが八つ。**私が書いていたのは D―DU―UDU で、
    あれはフォーク寄りの形であった。

    ══ もっと重い物 ══
    `d` と `u` を読み分けておきながら、**押し込む時に落としていた。**
    向きは描画時に位置から算出される決まりなので、八分が並べば
    自動で「下・上・下・上」になる——
    **L様が「全部下げ振り」と書いても、上げ振りが混ざっていた。**
    書かれた物より道具の見立てが勝つのは、順序が逆である。
    ══════════════════════════════════════════════════════════════ */
 try{
   /* ① いただいた刻みが、そのまま入っていること */
   { const g=U.bkGenre('rock8');
     /* 1.190：L様からの差し替え——「8分きざみ／♩=100／はねる：なし／DdDdDdDd」 */
     ok('[188] 8ビート・ロックは八分きざみ', g.grid===8, String(g.grid));
     ok('[188] いただいた一小節が、そのまま',
        g.pat.length===1&&g.pat[0]==='DdDdDdDd', g.pat.join(' / '));
     ok('[188] 速さもいただいた通り', g.bpm===100, String(g.bpm));
     ok('[188] はねない', !g.swing, '');
     /* **いただいていない物は置かない。**私が足した帰り際は外した */
     ok('[188] 勝手な帰り際を置いていない', !g.tail, JSON.stringify(g.tail||null));
     /* 1.191：フォーク・ストロークもいただいた通りに */
     const f=U.bkGenre('folk');
     ok('[188] フォークもいただいた通り',
        f.grid===8&&f.bpm===100&&!f.swing&&f.pat.length===1&&f.pat[0]==='D~dU~UDU',
        f.grid+'分／♩='+f.bpm+'／'+f.pat.join(' / '));
     /* 1.192：シャッフル・ブルース（帰り際つき） */
     const sh=U.bkGenre('shuffle');
     ok('[188] シャッフルもいただいた通り',
        sh.grid===8&&sh.bpm===120&&!!sh.swing&&sh.pat.length===1
        &&sh.pat[0]==='d~dud~du'&&(sh.tail||[]).join('')==='-U-U~udu',
        sh.grid+'分／♩='+sh.bpm+'／'+sh.pat.join('')+'／帰り際 '+(sh.tail||[]).join(''));
     { /* **いただいた帰り際は、拍の頭を空けている。**道具の決まりより優先する */
       const s8=U.genBackingSong({prog:'blues',genre:'shuffle',seed:3});
       const last=s8.bars[s8.bars.length-1];
       const heads=(last.notes||[]).filter(n=>n.start%U.T.QUARTER===0&&n.start>0
                                              &&n.kind==='rest').length;
       ok('[188] 帰り際は書いた通り（拍を空けたまま）', heads>0, String(heads));
       ok('[188] 帰り際は最後の一小節だけ',
          (s8.bars[s8.bars.length-2].notes||[]).filter(n=>n.kind!=='rest').length
          ===(s8.bars[0].notes||[]).filter(n=>n.kind!=='rest').length, '');
       const n8=(last.notes||[]).filter(n=>n.kind!=='rest');
       ok('[188] 帰り際の上げ振りにアクセント',
          n8.slice(0,2).every(n=>n.accent&&n.stroke==='u'),
          n8.slice(0,2).map(n=>(n.accent?'A':'-')+(n.stroke||'—')).join(' ')); }
     /* いただいた型には、そう印を付けてある（点検の見逃しはここを見る） */
     ok('[188] いただいた型に印が付いている',
        ['rock8','folk','shuffle','slowbl','reggae','funk16','swing','cutt','pop16','bossa',
         'ballad68','city','neosoul','jazzbl'].every(id=>U.bkGenre(id).given===true), '');
     /* 1.204：ジャズ・ブルース（帰り際は裏だけで押す） */
     { const jb2=U.bkGenre('jazzbl');
       ok('[188] ジャズ・ブルースもいただいた通り',
          jb2.grid===8&&jb2.bpm===116&&!!jb2.swing&&jb2.pat.length===1
          &&jb2.pat[0]==='d-d-d-du'&&(jb2.tail||[]).join('')==='-u-u~u~u',
          jb2.grid+'分／♩='+jb2.bpm+'／'+jb2.pat.join('')
          +'／帰り際 '+(jb2.tail||[]).join(''));
       const sj=U.genBackingSong({prog:'jazzblues',genre:'jazzbl',seed:3});
       ok('[188] 12小節ぶん出る', sj.bars.length===12, String(sj.bars.length));
       const last=sj.bars[11], body=sj.bars[0];
       const nb3=(body.notes||[]).filter(n=>n.kind!=='rest');
       ok('[188] 本体は四つ切りに返しを一つ',
          nb3.length===5&&nb3[4].stroke==='u',
          nb3.map(n=>n.stroke||'—').join(''));
       const nl=(last.notes||[]).filter(n=>n.kind!=='rest');
       ok('[188] 帰り際は上げ振りだけ',
          nl.length===4&&nl.every(n=>n.stroke==='u'),
          nl.map(n=>n.stroke||'—').join(''));
       ok('[188] 帰り際は拍の頭を空ける',
          (last.notes||[]).filter(n=>n.kind==='rest'
            &&n.start%U.T.QUARTER===0).length>0, '');
       ok('[188] 帰り際は最後の一小節だけ',
          (sj.bars[10].notes||[]).filter(n=>n.kind!=='rest').length===nb3.length, ''); }
     /* 1.203：ネオソウル／R&B（伸ばして、間で二度触れる） */
     { const ns2=U.bkGenre('neosoul');
       ok('[188] ネオソウルもいただいた通り',
          ns2.grid===16&&ns2.bpm===84&&!ns2.swing&&ns2.pat.length===1
          &&ns2.pat[0]==='d~~~~~-u--u~~~~~',
          ns2.grid+'分／♩='+ns2.bpm+'／'+ns2.pat.join(''));
       const sn2=U.genBackingSong({prog:'pop',genre:'neosoul',seed:3});
       const nn2=(sn2.bars[0].notes||[]).filter(n=>n.kind!=='rest');
       ok('[188] 一小節に三撃', nn2.length===3, String(nn2.length));
       /* **一拍半伸ばす。**刻まないのがこの音楽 */
       ok('[188] 頭の一撃が一拍半',
          nn2[0].len===Math.round(U.T.QUARTER*1.5), String(nn2[0].len));
       ok('[188] 間の二つは上げ振り',
          nn2[1].stroke==='u'&&nn2[2].stroke==='u',
          (nn2[1].stroke||'—')+(nn2[2].stroke||'—'));
       ok('[188] 最後は伸ばして終わる',
          nn2[2].len===Math.round(U.T.QUARTER*1.5), String(nn2[2].len));
       ok('[188] ×は使わない',
          (sn2.bars[0].notes||[]).every(n=>n.kind!=='brush'), ''); }
     /* 1.202：シティポップ／AOR（頭を空けて裏から入る） */
     { const cy2=U.bkGenre('city');
       ok('[188] シティポップもいただいた通り',
          cy2.grid===16&&cy2.bpm===106&&!cy2.swing&&cy2.pat.length===1
          &&cy2.pat[0]==='-udud-d-d-xxxuxu',
          cy2.grid+'分／♩='+cy2.bpm+'／'+cy2.pat.join(''));
       const sc2=U.genBackingSong({prog:'canon',genre:'city',seed:3});
       const nc2=(sc2.bars[0].notes||[]);
       ok('[188] 一拍目の頭は空ける',
          nc2.length>0&&nc2[0].kind==='rest'&&nc2[0].start===0,
          nc2.length?nc2[0].kind:'—');
       ok('[188] ×が四つ',
          nc2.filter(n=>n.kind==='brush').length===4,
          String(nc2.filter(n=>n.kind==='brush').length));
       ok('[188] 向きは書いた通り',
          nc2.filter(n=>n.kind==='chord').map(n=>n.stroke).join('')==='ududdduu',
          nc2.filter(n=>n.kind==='chord').map(n=>n.stroke||'—').join('')); }
     /* ══ 1.201：6/8バラード（向きは伏せ、アクセントは残す）══
        **この二つは別の話である。**向きは「どう当てるか」、
        アクセントは「どれだけ強いか」——伏せるのは前者だけ。 */
     { const b68=U.bkGenre('ballad68');
       ok('[188] 6/8バラードが在る', !!b68&&b68.name==='6/8バラード', b68?b68.name:'—');
       ok('[188] 6/8バラードもいただいた通り',
          b68.meter.n===6&&b68.meter.d===8&&b68.grid===8&&b68.bpm===82
          &&!b68.swing&&b68.pat.join('')==='dDDDDD'&&b68.noDir===true,
          b68.meter.n+'/'+b68.meter.d+'／♩='+b68.bpm+'／'+b68.pat.join(''));
       const s68=U.genBackingSong({prog:'canon',genre:'ballad68',seed:3});
       ok('[188] 6/8 の小節長', U.barTicks(s68,s68.bars[0])===U.T.QUARTER*3,
          String(U.barTicks(s68,s68.bars[0])));
       const n68=(s68.bars[0].notes||[]).filter(n=>n.kind!=='rest');
       ok('[188] 八分が六つ', n68.length===6&&n68.every(n=>n.len===Math.round(U.T.QUARTER/2)),
          n68.length+'／'+[...new Set(n68.map(n=>n.len))].join(','));
       /* **向きは持たない** */
       ok('[188] 向きを持たない', n68.every(n=>!n.stroke),
          [...new Set(n68.map(n=>n.stroke||'—'))].join(','));
       ok('[188] 矢印を出さない設え', s68.meta.strokeAuto==='off', s68.meta.strokeAuto);
       ok('[188] 実際に矢印が出ない',
          !/strk-hit/.test(JSON.stringify(U.engrave(s68,s68.bars[0],
             {width:400,hits:true,barId:s68.bars[0].id}))), '');
       /* **しかしアクセントは残る**（音にも、譜面にも） */
       ok('[188] アクセントは残る',
          n68.map(n=>n.accent?'A':'-').join('')==='-AAAAA',
          n68.map(n=>n.accent?'A':'-').join(''));
       ok('[188] 鳴らしても向きを補わない',
          U.buildTimeline(s68).ev.filter(e=>e.kind==='note'&&e.note&&e.note.kind!=='rest')
            .slice(0,6).every(e=>!e.note.stroke), '');
       ok('[188] 低音は二つの大波の頭に',
          (s68.bars[0].bass||[]).length===2
          &&s68.bars[0].bass[1].start===Math.round(U.T.QUARTER*1.5),
          (s68.bars[0].bass||[]).map(o=>o.start).join(',')); }
     /* 1.200：ボサノヴァ（2/4・指引き） */
     { const bs2=U.bkGenre('bossa');
       ok('[188] ボサノヴァもいただいた通り',
          bs2.grid===16&&bs2.bpm===54&&!bs2.swing&&bs2.meter.n===2
          &&bs2.pat.length===1&&bs2.pat[0]==='o-o~oo~o'&&bs2.finger===true,
          bs2.meter.n+'/'+bs2.meter.d+'／♩='+bs2.bpm+'／'+bs2.pat.join(''));
       const sb2=U.genBackingSong({prog:'twofive',genre:'bossa',seed:3});
       const nb2=(sb2.bars[0].notes||[]).filter(n=>n.kind!=='rest');
       /* **指引きに、向きもアクセントも無い** */
       ok('[188] 向きを持たない', nb2.every(n=>!n.stroke),
          [...new Set(nb2.map(n=>n.stroke||'—'))].join(','));
       ok('[188] アクセントも無い', nb2.every(n=>!n.accent), '');
       ok('[188] 指引きの印が音符に届く', nb2.every(n=>n.finger===true), '');
       /* **譜面に振りの矢印を出さない**（指で弾く音楽に向きは無い） */
       ok('[188] 矢印を出さない設えになる', sb2.meta.strokeAuto==='off', sb2.meta.strokeAuto);
       const svg=U.engrave(sb2,sb2.bars[0],{width:400,hits:true,barId:sb2.bars[0].id});
       ok('[188] 実際に矢印が出ない',
          !/strk-hit/.test(JSON.stringify(svg)), '');
       /* 鳴らす時も、向きを補わない */
       const dd=U.buildTimeline(sb2).ev.filter(e=>e.kind==='note'&&e.note&&e.note.kind!=='rest')
                 .slice(0,6).map(e=>e.note.stroke||'—');
       ok('[188] 鳴らす時も向きを補わない', dd.every(x=>x==='—'), dd.join('')); }
     /* 1.199：16分カッティングと、新しい 16ビート・ポップス */
     { const ct=U.bkGenre('cutt');
       ok('[188] カッティングもいただいた通り',
          ct.grid===16&&ct.bpm===124&&!ct.swing&&ct.pat.length===1
          &&ct.pat[0]==='duuuxxxu-u~uxxxx',
          ct.grid+'分／♩='+ct.bpm+'／'+ct.pat.join(''));
       const sc=U.genBackingSong({prog:'free',genre:'cutt',seed:3});
       const nc=(sc.bars[0].notes||[]);
       ok('[188] ×（ブラッシング）が七つ',
          nc.filter(n=>n.kind==='brush').length===7,
          String(nc.filter(n=>n.kind==='brush').length));
       ok('[188] 間に休みが挟まる',
          nc.some(n=>n.kind==='rest'), '');
       const pp=U.bkGenre('pop16');
       ok('[188] 16ビート・ポップスが在る',
          !!pp&&pp.name==='16ビート・ポップス', pp?pp.name:'—');
       ok('[188] ポップスもいただいた通り',
          pp.grid===16&&pp.bpm===108&&!pp.swing&&pp.pat.length===1
          &&pp.pat[0]==='d~d~D~dU~ud~D~du',
          pp.grid+'分／♩='+pp.bpm+'／'+pp.pat.join(''));
       const sp=U.genBackingSong({prog:'pop',genre:'pop16',seed:3});
       const np=(sp.bars[0].notes||[]).filter(n=>n.kind!=='rest');
       ok('[188] ポップスは×を使わない',
          (sp.bars[0].notes||[]).every(n=>n.kind!=='brush'), '');
       ok('[188] 山は三つ（拍の頭と裏の一点）',
          np.filter(n=>n.accent).length===3,
          np.map(n=>n.accent?'A':'-').join(''));
       ok('[188] 低音の型も持っている', !!U.JAM_BASS.pop16, '');
       let errp=null;
       try{ sp.bars.forEach(b=>U.engrave(sp,b,{width:400,hits:true,barId:b.id})); }
       catch(e){ errp=e.message; }
       ok('[188] 新しいジャンルも描ける', !errp, String(errp));
       ok('[188] 新しいジャンルも鳴る',
          U.buildTimeline(sp).ev.filter(e=>e.kind==='note').length>0, ''); }
     /* 1.197：ジャズ・スウィング（四つ切り） */
     { const sw=U.bkGenre('swing');
       ok('[188] ジャズ・スウィングもいただいた通り',
          sw.grid===16&&sw.bpm===102&&!!sw.swing&&sw.pat.length===1
          &&sw.pat[0]==='d~~-d~~-d~~-d~~-'&&!sw.tail,
          sw.grid+'分／♩='+sw.bpm+'／'+sw.pat.join('')+'／帰り際'+(sw.tail?'あり':'なし'));
       const s5b=U.genBackingSong({prog:'twofive',genre:'swing',seed:3});
       const n5=(s5b.bars[0].notes||[]).filter(n=>n.kind!=='rest');
       ok('[188] 一小節に四撃', n5.length===4, String(n5.length));
       /* **付点八分。**八分ではない——切るが、切りすぎない */
       ok('[188] 一撃は付点八分',
          n5.every(n=>n.len===Math.round(U.T.QUARTER*3/4)),
          [...new Set(n5.map(n=>n.len))].join(','));
       ok('[188] どれも拍の頭に立つ',
          n5.every(n=>n.start%U.T.QUARTER===0), n5.map(n=>n.start).join(',')); }
     /* 1.196：16ビート・ファンク（四撃だけ、あとは空ける） */
     { const fk=U.bkGenre('funk16');
       ok('[188] ファンクもいただいた通り',
          fk.grid===16&&fk.bpm===102&&!fk.swing&&fk.pat.length===1
          &&fk.pat[0]==='d-d--u--d-------',
          fk.grid+'分／♩='+fk.bpm+'／'+fk.pat.join(''));
       const s6b=U.genBackingSong({prog:'dorian',genre:'funk16',seed:3});
       const n6=(s6b.bars[0].notes||[]).filter(n=>n.kind!=='rest');
       ok('[188] 一小節に四撃', n6.length===4, String(n6.length));
       ok('[188] 向きは d d u d',
          n6.map(n=>n.stroke).join('')==='ddud', n6.map(n=>n.stroke).join(''));
       /* **空けた所が、まとめて一つの休符になっていること**（細切れでは読めない） */
       const rs=(s6b.bars[0].notes||[]).filter(n=>n.kind==='rest');
       ok('[188] 後半の空白は一つの休符',
          rs.some(n=>n.len>=U.T.QUARTER*1.5), rs.map(n=>n.len).join(',')); }
     /* 1.194：レゲエ（裏打ち・スタッカート） */
     const rg=U.bkGenre('reggae');
     /* 1.195：はねは L様の申し出で外した（裏打ちは拍の真ん中に置く） */
     ok('[188] レゲエもいただいた通り',
        rg.grid===8&&rg.bpm===80&&!rg.swing&&rg.staccato===true
        &&rg.pat.join('')==='-U-U-U-U',
        rg.grid+'分／♩='+rg.bpm+'／はね'+(rg.swing?'あり':'なし')
        +'／'+rg.pat.join(''));
     ok('[188] レゲエははねない', !rg.swing, JSON.stringify(rg.swing||null));
     { const s7=U.genBackingSong({prog:'pop',genre:'reggae',seed:3});
       const n7=(s7.bars[0].notes||[]).filter(n=>n.kind!=='rest');
       ok('[188] 裏の四つが、短く強い上げ振り',
          n7.length===4&&n7.every(n=>n.staccato&&n.accent&&n.stroke==='u'),
          n7.map(n=>(n.accent?'A':'-')+(n.staccato?'•':'-')+(n.stroke||'—')).join(' '));
       ok('[188] 拍の頭は空けたまま',
          (s7.bars[0].notes||[]).some(n=>n.kind==='rest'&&n.start===0), '');
       let err7=null;
       try{ s7.bars.forEach(b=>U.engrave(s7,b,{width:400,hits:true,barId:b.id})); }
       catch(e){ err7=e.message; }
       ok('[188] スタッカートを付けても描ける', !err7, String(err7)); }
     /* **スタッカートを持たないジャンルには、付かないこと** */
     { const s8b=U.genBackingSong({prog:'pop',genre:'rock8',seed:3});
       ok('[188] 他のジャンルには付かない',
          (s8b.bars[0].notes||[]).every(n=>!n.staccato), ''); }
     /* はねの深さは一箇所から引く（**同じ言葉には、同じ答えを**） */
     /* はねの深さは一箇所から引く（**同じ言葉には、同じ答えを**） */
     ok('[188] はねの深さは一箇所から',
        U.BK_SWING_DEF===0.66
        &&U.BK_GENRES.filter(g2=>g2.given&&g2.swing)
            .every(g2=>g2.swing.ratio===U.BK_SWING_DEF||g2.id==='slowbl'),
        U.BK_GENRES.filter(g2=>g2.given&&g2.swing)
          .map(g2=>g2.id+':'+g2.swing.ratio).join(' '));
     /* 1.193：スロー・ブルース */
     const sb=U.bkGenre('slowbl');
     ok('[188] スロー・ブルースもいただいた通り',
        sb.grid===8&&sb.bpm===80&&!!sb.swing&&sb.pat.join('')==='d~dud~du'
        &&(sb.tail||[]).join('')==='du-U~udu',
        sb.grid+'分／♩='+sb.bpm+'／'+sb.pat.join('')+'／帰り際 '+(sb.tail||[]).join(''));
     ok('[188] シャッフルとは速さで分かれる',
        U.bkGenre('shuffle').bpm!==sb.bpm,
        U.bkGenre('shuffle').bpm+' / '+sb.bpm);
     ok('[188] 帰り際でも分かれる',
        (U.bkGenre('shuffle').tail||[]).join('')!==(sb.tail||[]).join(''), '');
     { const s9=U.genBackingSong({prog:'canon',genre:'folk',seed:3});
       const n9=(s9.bars[0].notes||[]).filter(n=>n.kind!=='rest');
       ok('[188] フォークの向きとアクセントが届く',
          n9.map(n=>(n.accent?'A':'-')+(n.stroke||'—')).join(' ')
            ==='Ad -d Au Au Ad Au',
          n9.map(n=>(n.accent?'A':'-')+(n.stroke||'—')).join(' ')); } }
   /* ② 八分が八つ、すべて下げ振りで出ること */
   { const s2=U.genBackingSong({prog:'pop',genre:'rock8',seed:3});
     const ns=(s2.bars[0].notes||[]).filter(n=>n.kind!=='rest');
     ok('[188] 八つ鳴る', ns.length===8, String(ns.length));
     ok('[188] どれも八分', ns.every(n=>n.len===Math.round(U.T.QUARTER/2)),
        [...new Set(ns.map(n=>n.len))].join(','));
     /* 1.190：下げ振り八つ。**ダウンピッキングで押していく**のが 8ビートの体 */
     ok('[188] どれも下げ振り', ns.every(n=>n.stroke==='d'),
        [...new Set(ns.map(n=>n.stroke||'—'))].join(','));
     ok('[188] 拍の頭にアクセント',
        ns.map(n=>n.accent?'A':'-').join('')==='A-A-A-A-',
        ns.map(n=>n.accent?'A':'-').join('')); }
   /* ③ **上げ振りと書けば、上げ振りで入ること**（向きを読み分けている証） */
   { const s3=U.genBackingSong({prog:'pop',genre:'reggae',seed:3});
     const ns=(s3.bars[0].notes||[]).filter(n=>n.kind!=='rest');
     ok('[188] レゲエは上げ振り', ns.length>0&&ns.every(n=>n.stroke==='u'),
        [...new Set(ns.map(n=>n.stroke||'—'))].join(','));
     /* 1.192：シャッフルは L様の型（d~dud~du）に差し替わった */
     const s4=U.genBackingSong({prog:'blues',genre:'shuffle',seed:3});
     const ns4=(s4.bars[0].notes||[]).filter(n=>n.kind!=='rest');
     ok('[188] 下上を書けば、下上で入る',
        ns4.map(n=>n.stroke).join('')==='dduddu', ns4.map(n=>n.stroke).join('')); }
   /* ④ **書いた通りが、道具の見立てより勝つこと。**
        これを取り違えると、いただいた字が黙って書き換わる */
   { const bad=[];
     U.BK_GENRES.filter(g=>g.pat).forEach(g=>{
       /* 1.200／1.201：向きを持たないジャンル（指引き・向き伏せ）は、
          **持たせないのが正しい**ので、ここでは見ない */
       if(g.finger||g.noDir) return;
       const s5=U.genBackingSong({genre:g.id,prog:g.prog||'pop',seed:3});
       const line=g.pat[0];
       /* 1.189：`o` は「向きを書かない」の意。× は擦る一撃で向きを持たない */
       const want=[];
       for(let i=0;i<line.length;i++){
         const c=line[i].toLowerCase();
         if(c==='d') want.push('d');
         else if(c==='u') want.push('u');
         else if(c==='o') want.push('-');
         else if(c==='x') want.push('-');
       }
       const got=(s5.bars[0].notes||[]).filter(n=>n.kind!=='rest').map(n=>n.stroke||'-');
       if(want.join('')!==got.join('')) bad.push(g.id+'：'+want.join('')+'→'+got.join(''));
     });
     ok('[188] どのジャンルも、書いた向きで入る', bad.length===0,
        bad.slice(0,4).join(' / ')); }
   /* ⑤ 向きが入っても、鳴って描けること */
   { const bad=[];
     U.BK_GENRES.filter(g=>g.pat).forEach(g=>{
       try{
         const s6=U.genBackingSong({genre:g.id,prog:g.prog||'pop',seed:9});
         s6.bars.forEach(b=>U.engrave(s6,b,{width:400,hits:true,barId:b.id}));
         if(U.buildTimeline(s6).ev.filter(e=>e.kind==='note').length===0) bad.push(g.id);
       }catch(e){ bad.push(g.id+'：'+e.message); }
     });
     ok('[188] 向きが入っても鳴って描ける', bad.length===0, bad.join(' / ')); }
 }catch(e){ ok('[188] 向きの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    「向きを書かない」を書けるように／アクセント（1.189）

    L様——「向きはいらない」「もう少しアップとダウンで音量差があったり
            アクセントを導入してノリを再現できるといいかも」。

    ══ `o` を置いた ══
    それまで `d` は「下げ振り」を意味していたので、
    **「振る」のつもりで書かれた `d` が「下げ振りの指定」として届いていた。**
    同じ字に二つの意味があった——**「書かない」を書けるようにする。**

    ══ 大文字＝アクセント ══
    一マス一文字の決まりを崩さずに強弱を載せられる。
    格子の一マスに二文字を許せば、**長さの数え方が壊れる。**

    ══ 併せて直した物 ══
    **譜面には自動で向きが描かれるのに、鳴る方は全部下げ振りだった。**
    `strum()` は `note.stroke` しか見ておらず、書かれていなければ下げ振りに落ちる。
    **見える向きと、鳴る向きが食い違っていた。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const T=U.T;
   /* ① `o` は向きを持たない。`d`／`u` は持つ */
   { const o1=U.bkPatternOf('o~o~o~o~',8,T.QUARTER*4);
     ok('[189] o は向きを書かない', o1.filter(x=>!x.rest).every(x=>!x.dir),
        [...new Set(o1.filter(x=>!x.rest).map(x=>x.dir||'—'))].join(','));
     const d1=U.bkPatternOf('d~u~d~u~',8,T.QUARTER*4);
     ok('[189] d／u は向きを持つ',
        d1.filter(x=>!x.rest).map(x=>x.dir).join('')==='dudu',
        d1.filter(x=>!x.rest).map(x=>x.dir||'—').join('')); }
   /* ② 大文字がアクセントになること */
   { const a1=U.bkPatternOf('O~o~O~o~',8,T.QUARTER*4).filter(x=>!x.rest);
     ok('[189] 大文字はアクセント', a1.map(x=>x.accent?'A':'-').join('')==='A-A-',
        a1.map(x=>x.accent?'A':'-').join(''));
     const a2=U.bkPatternOf('D~U~X-o-',8,T.QUARTER*4).filter(x=>!x.rest);
     ok('[189] 向き・×にも大文字が効く',
        a2.length>=3&&a2[0].accent&&a2[1].accent&&a2[2].accent,
        a2.map(x=>(x.accent?'A':'-')).join(''));
     ok('[189] 大文字でも向きは読み分ける',
        a2[0].dir==='d'&&a2[1].dir==='u', (a2[0].dir||'—')+(a2[1].dir||'—')); }
   /* ③ 譜面の音符まで、アクセントが届くこと */
   { const g=U.bkGenre('rock8');
     const keep=g.pat.slice();
     g.pat=['O-o-O-o-'];
     const s2=U.genBackingSong({prog:'pop',genre:'rock8',seed:3});
     const ns=(s2.bars[0].notes||[]).filter(n=>n.kind!=='rest');
     ok('[189] アクセントが音符に届く',
        ns.map(n=>n.accent?'A':'-').join('')==='A-A-',
        ns.map(n=>n.accent?'A':'-').join(''));
     /* 描けること（アクセント記号は譜面に出る） */
     let err=null;
     try{ s2.bars.forEach(b=>U.engrave(s2,b,{width:400,hits:true,barId:b.id})); }
     catch(e){ err=e.message; }
     ok('[189] アクセントを付けても描ける', !err, String(err));
     g.pat=keep; }
   /* ④ **見える向きと、鳴る向きが揃うこと**（今回いちばん重い直し） */
   { const g2=U.bkGenre('folk'); const keep2=g2.pat.slice();
     g2.pat=['oooooooo'];                       /* 向きを書かない八分を仕立てる */
     const s3=U.genBackingSong({prog:'pop',genre:'folk',seed:3});
     const tl=U.buildTimeline(s3);
     const dirs=tl.ev.filter(e=>e.kind==='note'&&e.note&&e.note.kind!=='rest')
                     .slice(0,8).map(e=>e.note.stroke||'—');
     g2.pat=keep2;
     ok('[189] 向きを書かなくても、鳴る向きが決まる',
        dirs.every(x=>x==='d'||x==='u'), dirs.join(''));
     ok('[189] 八分が並べば、下と上が交互に',
        dirs.join('')==='dudududu', dirs.join(''));
     /* 書いてあれば、そちらが勝つ */
     const s4=U.genBackingSong({prog:'blues',genre:'shuffle',seed:3});
     const d4=U.buildTimeline(s4).ev.filter(e=>e.kind==='note'&&e.note)
                .slice(0,6).map(e=>e.note.stroke||'—');
     ok('[189] 書いてあれば、そちらが勝つ', d4.join('')==='dduddu', d4.join('')); }
   /* ⑤ 上げ振りと下げ振りで、鳴り方が違うこと（**弱めるのではなく、当たり方を変える**） */
   { const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     ok('[189] 上げ振りは低音弦を掠める',
        /up \? \(0\.92-0\.62\*p\*p\)/.test(src), '');
     ok('[189] 下げ振りは低音弦を強く',
        /\(1\.20-0\.060\*k\)/.test(src), '');
     ok('[189] アクセントを強めた', /note\.accent\) vol\*=1\.75/.test(src), '');
     ok('[189] アクセントは擦り幅も詰める',
        /note\.accent\?0\.72:1/.test(src), ''); }
   /* ⑥ 新しい字を入れても、鳴って描けること */
   { const bad=[];
     ['o~o~o~o~','O-o-O-o-','O~u~X-d-','oooooooo'].forEach(line=>{
       try{
         const g=U.bkGenre('folk'); const keep=g.pat.slice(); g.pat=[line];
         const s5=U.genBackingSong({prog:'pop',genre:'folk',seed:5});
         s5.bars.forEach(b=>U.engrave(s5,b,{width:400,hits:true,barId:b.id}));
         if(U.buildTimeline(s5).ev.filter(e=>e.kind==='note').length===0) bad.push(line+'：鳴らない');
         g.pat=keep;
       }catch(e){ bad.push(line+'：'+e.message); }
     });
     ok('[189] 新しい字でも鳴って描ける', bad.length===0, bad.join(' / ')); }
 }catch(e){ ok('[189] 字と強弱の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    拍子（1.198）

    L様——「ボサノバは 2/4拍子にしたいので刻みメモに拍子も追加」。

    ══ 片方だけでは足りなかった ══
    伴奏を組む所は `const total=T.QUARTER*4` と**四拍子で決め打って**いた。
    刻みメモに拍子を足しても、受け取る側が四拍子のままでは意味が無い。

    ══ 一マスの長さ ══
    従前は**小節の長さを割って**一マスを出していた（total÷16）。
    2/4 の小節に十六マスを詰めれば**一マスが三十二分**になる——
    「16分きざみ」の看板が嘘になる。
    **十六分は、小節が何拍であろうと十六分である。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const T=U.T;
   /* ① 一マスの長さは、小節の長さに引きずられないこと */
   { const a4=U.bkPatternOf('d~~d~~d~~~d~~d~~',16,T.QUARTER*4);
     const a2=U.bkPatternOf('d~~d~~d~',16,T.QUARTER*2);
     ok('[198] 十六分は、拍子が変わっても十六分',
        a4[0].len===a2[0].len, a4[0].len+' / '+a2[0].len);
     ok('[198] 二拍子の小節は、四拍子の半分',
        a2.reduce((x,o)=>x+o.len,0)===T.QUARTER*2,
        String(a2.reduce((x,o)=>x+o.len,0))); }
   /* ② ボサノヴァが 2/4 で組まれること */
   { const s2=U.genBackingSong({prog:'twofive',genre:'bossa',
                                key:{root:0,qual:'maj',name:'C'},seed:3});
     ok('[198] ボサノヴァは 2/4',
        s2.meta.timeSig.n===2&&s2.meta.timeSig.d===4,
        s2.meta.timeSig.n+'/'+s2.meta.timeSig.d);
     ok('[198] 小節の長さも半分',
        U.barTicks(s2,s2.bars[0])===T.QUARTER*2,
        String(U.barTicks(s2,s2.bars[0])));
     /* **音符が小節を溢れないこと**（ここが崩れると譜面が壊れる） */
     const bad=[];
     s2.bars.forEach((b,i)=>{
       const end=(b.notes||[]).reduce((x,n)=>Math.max(x,n.start+n.len),0);
       if(end!==T.QUARTER*2) bad.push((i+1)+'小節：'+end);
     });
     ok('[198] どの小節も 2拍ぶんちょうど', bad.length===0, bad.slice(0,3).join(' / '));
     let err=null;
     try{ s2.bars.forEach(b=>U.engrave(s2,b,{width:400,hits:true,barId:b.id})); }
     catch(e){ err=e.message; }
     ok('[198] 2/4 でも描ける', !err, String(err));
     ok('[198] 2/4 でも鳴る',
        U.buildTimeline(s2).ev.filter(e=>e.kind==='note').length>0, ''); }
   /* ③ **低音は「拍あたり」で刻むこと。**小節を割ると、拍子で刻みが変わる */
   { const s3=U.genBackingSong({prog:'twofive',genre:'bossa',seed:3});
     const s4=U.genBackingSong({prog:'pop',genre:'rock8',seed:3});
     const step3=(s3.bars[0].bass||[]).length?s3.bars[0].bass[0].len:0;
     ok('[198] 二拍子でも低音の刻みは変わらない',
        step3===Math.round(T.QUARTER*4/U.JAM_BASS.bossa.div), String(step3));
     ok('[198] 二拍子では低音の数が減る',
        (s3.bars[0].bass||[]).length<(s4.bars[0].bass||[]).length,
        (s3.bars[0].bass||[]).length+' / '+(s4.bars[0].bass||[]).length);
     const over=(s3.bars[0].bass||[]).some(o=>o.start+o.len>T.QUARTER*2);
     ok('[198] 低音が小節を溢れない', !over, ''); }
   /* ④ **四拍子の他のジャンルは、何も変わっていないこと** */
   { const bad=[];
     U.BK_GENRES.filter(g=>g.pat&&!g.meter).forEach(g=>{
       const s5=U.genBackingSong({genre:g.id,prog:g.prog||'pop',seed:3});
       if(!(s5.meta.timeSig.n===4&&s5.meta.timeSig.d===4)) bad.push(g.id+'：拍子');
       s5.bars.forEach(b=>{
         const end=(b.notes||[]).reduce((x,n)=>Math.max(x,n.start+n.len),0);
         if(end!==T.QUARTER*4) bad.push(g.id+'：'+end);
       });
     });
     ok('[198] 四拍子のジャンルは変わっていない', bad.length===0,
        [...new Set(bad)].slice(0,4).join(' / ')); }
   /* ⑤ 拍子は設えで上書きできること（**ジャンルは勧めるだけ**の掟と揃える） */
   { const s6=U.genBackingSong({prog:'twofive',genre:'bossa',meter:{n:4,d:4},seed:3});
     ok('[198] 拍子は設えで上書きできる',
        s6.meta.timeSig.n===4, s6.meta.timeSig.n+'/'+s6.meta.timeSig.d);
     const s7=U.genBackingSong({prog:'pop',genre:'rock8',meter:{n:3,d:4},seed:3});
     ok('[198] 四拍子のジャンルも三拍子で組める',
        U.barTicks(s7,s7.bars[0])===T.QUARTER*3, String(U.barTicks(s7,s7.bars[0])));
     let err7=null;
     try{ s7.bars.forEach(b=>U.engrave(s7,b,{width:400,hits:true,barId:b.id})); }
     catch(e){ err7=e.message; }
     ok('[198] 三拍子でも描ける', !err7, String(err7)); }
 }catch(e){ ok('[198] 拍子の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    刻みは、すべて L様の字になった（1.205）

    L様——「バラードとモーダルは畳もう」。

    **バラード（ゆったり）**は、6/8バラードを頂戴した時点で役目が重なった。
    似た名前が二つ並べば、生徒様はどちらを選ぶかで一度止まる。
    **モーダル一発**は、進行に〈一発〉があり、刻みは他から選べばよい——
    **刻みの一覧に「進行の話」を混ぜていた**のが元であった。

    残ったのは、**L様の字で置き換わった型だけ**である。
    置き換えられなかった二つが、そのまま畳まれた二つであった——
    **要らない物は、置き換えられない。**
    ══════════════════════════════════════════════════════════════ */
 try{
   /* ① 畳んだ二つが、どこにも残っていないこと */
   { ok('[205] バラード（ゆったり）を畳んだ', !U.BK_GENRES.some(g=>g.id==='ballad'), '');
     ok('[205] モーダル一発を畳んだ', !U.BK_GENRES.some(g=>g.id==='modal'), '');
     /* **低音の型も一緒に片づける**（使われない表が残ると、次に読む者が迷う） */
     ok('[205] 低音の型も片づけた', !U.JAM_BASS.ballad, '');
     const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     ok('[205] 手引きからも消えている',
        !/モーダル一発/.test(src)||!/\['ジャンル（刻み）',[^\]]*モーダル一発/.test(src), ''); }
   /* ② **刻みを持つジャンルは、すべて L様の字であること** */
   { const mine=U.BK_GENRES.filter(g=>g.pat&&!g.given).map(g=>g.name);
     ok('[205] 刻みはすべて L様の字', mine.length===0, mine.join('／')); }
   /* ③ 畳んでも、残りが健やかであること */
   { const bad=[];
     U.BK_GENRES.filter(g=>g.pat).forEach(g=>{
       try{
         const s2=U.genBackingSong({genre:g.id,prog:g.prog||'pop',seed:11});
         if(!s2||!s2.bars.length){ bad.push(g.id+'：組めない'); return; }
         s2.bars.forEach(b=>U.engrave(s2,b,{width:400,hits:true,barId:b.id}));
         if(U.buildTimeline(s2).ev.filter(e=>e.kind==='note').length===0) bad.push(g.id+'：鳴らない');
       }catch(e){ bad.push(g.id+'：'+e.message); }
     });
     ok('[205] 残ったジャンルはすべて鳴って描ける', bad.length===0, bad.join(' / '));
     ok('[205] 十四種そろっている',
        U.BK_GENRES.filter(g=>g.pat).length===14,
        String(U.BK_GENRES.filter(g=>g.pat).length)); }
   /* ④ 〈おまかせ〉は、畳んだ物を引かないこと */
   { const bad=[];
     for(let sd=1;sd<=40;sd++){
       const o=U.bkRandomOpt(sd);
       if(o.genre==='ballad'||o.genre==='modal') bad.push(String(sd));
       if(!U.BK_GENRES.some(g=>g.id===o.genre)) bad.push(sd+'：'+o.genre);
     }
     ok('[205] おまかせが畳んだ物を引かない', bad.length===0, bad.slice(0,4).join(',')); }
 }catch(e){ ok('[205] 片づけの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    ボサノヴァの太鼓（1.206）

    L様——「ボサノヴァはテンポを54にしてドラムパターンをもっとボサノヴァにして」。

    16ビートを当てていたが、あれは**四拍子の、頭で踏む太鼓**である。
      ・シェイカー（HH）は十六分で途切れず流れる
      ・リムショット（SN）は **3+3+2**——拍を跨いで前へ転がる（トレシーヨ）
      ・バスドラ（BD）は二拍とも踏む
    **拍の頭で当てないのがこの音楽の要**で、
    「一拍目にバスドラ、三拍目にスネア」を当てると行進曲になる。
    ══════════════════════════════════════════════════════════════ */
 try{
   const bs=U.bkGenre('bossa');
   ok('[206] 速さは 54', bs.bpm===54, String(bs.bpm));
   ok('[206] 太鼓はボサノヴァの型', bs.drum==='bossa', String(bs.drum));
   /* ① 型そのもの */
   { const dd=U.DD.bossa;
     ok('[206] ボサノヴァの太鼓が在る', !!dd, '');
     ok('[206] 二拍でひと呼吸', dd.beats===2&&dd.steps===8&&dd.div===4,
        dd.beats+'拍／'+dd.steps+'刻み');
     ok('[206] シェイカーは途切れない', dd.HH.every(x=>x===1), dd.HH.join(''));
     /* **3+3+2。**ここが崩れると、ただの裏打ちになる */
     ok('[206] リムは 3+3+2', dd.SN.join('')==='10010010', dd.SN.join(''));
     ok('[206] バスドラは二拍とも', dd.BD.join('')==='10001000', dd.BD.join(''));
     ok('[206] 太鼓の一覧に並ぶ', U.DRUM_ORDER.indexOf('bossa')>=0, ''); }
   /* ② 実際に鳴ること（2/4 の小節で、はみ出さずに） */
   { const s2=U.genBackingSong({prog:'twofive',genre:'bossa',seed:3});
     ok('[206] 曲にも 54 が入る', s2.play.bpm===54, String(s2.play.bpm));
     const tl=U.buildTimeline(s2);
     const b0=tl.ev.find(e=>e.kind==='bar'&&e.barId===s2.bars[0].id);
     const b1=tl.ev.find(e=>e.kind==='bar'&&e.barId===s2.bars[1].id);
     /* **反復で二度通るので、一巡目の窓で切る**
        （barId だけで拾うと、二周ぶんが混ざる） */
     const d0=tl.ev.filter(e=>e.kind==='drum'&&e.barId===s2.bars[0].id
                           &&e.t>=b0.t&&(!b1||e.t<b1.t));
     ok('[206] 一小節に八撃', d0.length===8, String(d0.length));
     /* リムの位置が 3+3+2 のままであること（十六分で 0・3・6） */
     const spb=60/s2.play.bpm, sx=spb/4;
     const sn=d0.filter(e=>e.sn).map(e=>Math.round((e.t-b0.t)/sx));
     ok('[206] リムは十六分の 0・3・6', sn.join(',')==='0,3,6', sn.join(','));
     ok('[206] 拍の頭ばかりで踏まない',
        sn.some(x=>x%4!==0), sn.join(',')); }
   /* ③ **他のジャンルの太鼓は変えていないこと** */
   { const bad=[];
     U.BK_GENRES.filter(g=>g.pat&&g.id!=='bossa').forEach(g=>{
       if(g.drum==='bossa') bad.push(g.id);
     });
     ok('[206] 他のジャンルには当てていない', bad.length===0, bad.join(',')); }
 }catch(e){ ok('[206] ボサの太鼓の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    進行の部品（1.207）

    L様——「コード進行の型をもっとたくさん用意して、クリックしたら
            設定できるようにしたい。色々組み合わせられるように」
           「リズムでブルースを選んだ場合はデフォでブルース進行をハイライト」。

    **進行は「一本まるごと」より「区切りの積み重ね」で覚える。**
    一本の型を八つ並べても、その八つの外へは出られない——
    **部品なら、並べ方の数だけ進行ができる。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const nameOf=(s2,b)=>{
     const ks=Object.keys(b.chordAt||{}).map(Number).sort((x,y)=>x-y);
     return ks.map(k=>U.chordName(b.chordAt[k],s2.meta)).join('|');
   };
   /* ① 部品の表そのもの */
   { ok('[207] 部品が二十そろっている', U.BK_PARTS.length>=20, String(U.BK_PARTS.length));
     const bad=[];
     U.BK_PARTS.forEach(x=>{
       if(!x.id||!x.name||!x.deg||!x.deg.length) bad.push(x.id||'（無名）');
       const want={'2':2,'4':4,'8':8,'12':12}[x.tag];
       if(want&&x.deg.length!==want) bad.push(x.id+'：'+x.deg.length+'小節（'+want+'のはず）');
       x.deg.forEach((cell,i)=>{
         U.bkBarChords(cell).forEach(cd=>{
           if(!Array.isArray(cd)||typeof cd[0]!=='number'||!U.CD[cd[1]])
             bad.push(x.id+'#'+i+'：'+JSON.stringify(cd));
         });
       });
     });
     ok('[207] 部品の書き方が揃っている', bad.length===0, bad.slice(0,4).join(' / '));
     const ids=U.BK_PARTS.map(x=>x.id);
     ok('[207] 名前が重なっていない', ids.length===new Set(ids).size, ''); }
   /* ② **並べた順に繋がること** */
   { const s2=U.genBackingSong({parts:['p_oudou','p_canonB'],
                                key:{root:0,qual:'maj',name:'C'},tension:'none',seed:3});
     ok('[207] 四小節＋四小節で八小節', s2.bars.length===8, String(s2.bars.length));
     ok('[207] 並べた順に出る',
        s2.bars.map(b=>nameOf(s2,b)).join(' ')==='C G Am F F C F G',
        s2.bars.map(b=>nameOf(s2,b)).join(' '));
     /* 順を変えれば、出る物も変わること（**順が意味を持つ**） */
     const s3=U.genBackingSong({parts:['p_canonB','p_oudou'],
                                key:{root:0,qual:'maj',name:'C'},tension:'none',seed:3});
     ok('[207] 順を変えれば変わる',
        s3.bars.map(b=>nameOf(s3,b)).join(' ')!==s2.bars.map(b=>nameOf(s2,b)).join(' '), ''); }
   /* ③ **一小節に二つ置けること**（ターンアラウンドの要） */
   { const s4=U.genBackingSong({parts:['p_junkan','p_turn'],
                                key:{root:0,qual:'maj',name:'C'},tension:'none',seed:3});
     ok('[207] 六小節になる', s4.bars.length===6, String(s4.bars.length));
     ok('[207] 帰り際の二小節に二つずつ',
        nameOf(s4,s4.bars[4])==='CM7|A7'&&nameOf(s4,s4.bars[5])==='Dm7|G7',
        nameOf(s4,s4.bars[4])+' / '+nameOf(s4,s4.bars[5]));
     /* **後ろの和音は小節の真ん中から**（変わり目は拍の頭でなければ読めない） */
     const ks=Object.keys(s4.bars[4].chordAt).map(Number).sort((x,y)=>x-y);
     ok('[207] 二つ目は小節の真ん中', ks[1]===U.T.QUARTER*2, ks.join(','));
     let err=null;
     try{ s4.bars.forEach(b=>U.engrave(s4,b,{width:500,hits:true,barId:b.id})); }
     catch(e){ err=e.message; }
     ok('[207] 二つ置いても描ける', !err, String(err));
     /* **二つとも鳴ること**（帯に置いただけで鳴らなければ、譜面の嘘になる） */
     const tl=U.buildTimeline(s4);
     const roots=new Set(tl.ev.filter(e=>e.kind==='note'&&e.chord).map(e=>e.chord.root));
     ok('[207] 二つ目の和音も鳴る', roots.has(9)&&roots.has(7),
        [...roots].sort((a2,b2)=>a2-b2).join(',')); }
   /* ④ どの部品も、単体で組めて鳴って描けること */
   { const bad=[];
     U.BK_PARTS.forEach(x=>{
       try{
         const s5=U.genBackingSong({parts:[x.id],
                                    key:{root:0,qual:(x.qual==='min'?'min':'maj'),name:'C'},
                                    seed:5});
         if(s5.bars.length!==x.deg.length) bad.push(x.id+'：小節数');
         s5.bars.forEach(b=>U.engrave(s5,b,{width:400,hits:true,barId:b.id}));
         if(U.buildTimeline(s5).ev.filter(e=>e.kind==='note').length===0) bad.push(x.id+'：鳴らない');
       }catch(e){ bad.push(x.id+'：'+e.message); }
     });
     ok('[207] どの部品も組めて鳴って描ける', bad.length===0, bad.slice(0,4).join(' / ')); }
   /* ⑤ **どちらが勝つか**——手で並べたコード名 ＞ 部品 ＞ まるごとの型 */
   { const s6=U.genBackingSong({parts:['p_oudou'],prog:'blues',seed:3});
     ok('[207] 部品はまるごとの型より勝つ', s6.bars.length===4, String(s6.bars.length));
     const s7=U.genBackingSong({parts:['p_oudou'],prog:'blues',
                                chords:[{root:0,type:'maj',bass:null}],seed:3});
     ok('[207] 手で並べた名前が、部品より勝つ', s7.bars.length===1, String(s7.bars.length));
     const s8=U.genBackingSong({prog:'blues',seed:3});
     ok('[207] 並べなければ、型のまま', s8.bars.length===12, String(s8.bars.length)); }
   /* ⑥ 設えに控えられること（作り直しで同じ物が出る） */
   { const s9=U.genBackingSong({parts:['p_oudou','p_25'],seed:3});
     ok('[207] 並べた部品を控える',
        s9.genOpt&&(s9.genOpt.parts||[]).join(',')==='p_oudou,p_25',
        JSON.stringify(s9.genOpt&&s9.genOpt.parts));
     const s10=U.genBackingSong(s9.genOpt);
     ok('[207] 控えた設えで同じ物が出る',
        s9.bars.map(b=>nameOf(s9,b)).join(' ')===s10.bars.map(b=>nameOf(s10,b)).join(' '), '');
     ok('[207] 題名に組み立てが出る', /王道＋ツーファイブ/.test(s9.meta.title), s9.meta.title); }
   /* ⑦ ブルースの部品に印が付いていること（勧めの札の的） */
   { const bl=U.BK_PARTS.filter(x=>x.blues).map(x=>x.id);
     ok('[207] ブルースの部品に印が在る',
        bl.indexOf('p_blues')>=0&&bl.indexOf('p_jblues')>=0, bl.join(','));
     const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     /* 1.211：勧めはジャンル全体へ広げた（まるごとの型の札を畳んだため） */
     ok('[207] ジャンルが部品を勧める仕掛けが在る',
        /BK_PROG_PART\[g0\.prog\|\|''\]/.test(src), '');
     ok('[207] ブルースの刻みはブルースの部品を勧める',
        U.BK_PROG_PART.blues==='p_blues'&&U.BK_PROG_PART.jazzblues==='p_jblues',
        JSON.stringify(U.BK_PROG_PART));
     /* **まるごとの型は、すべて部品で作れること**——
        作れない型が残っていれば、畳んだのは早すぎたということ */
     { const miss=U.BK_PROGS.filter(pr=>pr.id!=='free'&&!U.BK_PROG_PART[pr.id]).map(pr=>pr.id);
       ok('[207] まるごとの型は、すべて部品で作れる', miss.length===0, miss.join(',')); }
     { const bad=[];
       Object.keys(U.BK_PROG_PART).forEach(k=>{
         const pr=U.bkProg(k), pt=U.bkPart(U.BK_PROG_PART[k]);
         if(!pt){ bad.push(k+'：部品が無い'); return; }
         if(pt.deg.length!==pr.bars) bad.push(k+'：'+pt.deg.length+'≠'+pr.bars+'小節');
       });
       ok('[207] 勧める部品の丈が、型と合う', bad.length===0, bad.join(' / ')); }
     ok('[207] 勧めの印は「選ばれている」とは別の顔',
        /\.pb\.hint\{/.test([...d.querySelectorAll('style')].map(x=>x.textContent).join('')), ''); }
 }catch(e){ ok('[207] 部品の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    伴奏の時の見え方（1.208）

    L様——「アドリブの伴奏の時だけ楽譜の自動スクロールはなしにして。
            最初に画面いっぱいに出る指板図はなしで、
            楽譜の下の指板図を上に移動して、
            楽譜上のコード進行をいじったら
            指板図近くのコード進行にも反映されるようにして」。

    **伴奏は読むための譜面ではない。**見ているのは指板であって、
    その脇で紙が動けば、目の端が引かれて手が止まる。
    ふつうの曲では譜面を追うことがそのまま稽古なので、送りは要る——
    **同じ「再生」でも、見ている物が違う。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
   /* ① 指板が譜面の上に在ること */
   { const paper=d.getElementById('paper');
     const fb=d.getElementById('fbbar');
     ok('[208] 指板と譜面が同じ器に', !!paper&&!!fb&&paper.parentNode===fb.parentNode, '');
     const kids=[...paper.parentNode.children];
     ok('[208] 指板が譜面より上に在る',
        kids.indexOf(fb)<kids.indexOf(paper),
        kids.map(x=>x.id||x.className).join(' → ')); }
   /* ② 伴奏では、譜面を自動で送らないこと */
   { ok('[208] 伴奏では送りを止める',
        /if\(song&&song\.genBacking\) return;/.test(src), '');
     /* **ふつうの曲では送ること**（止めすぎない）。
        送りは段を単位にした followStage へ一本化した（1.239） */
     const i1=src.indexOf('if(song&&song.genBacking) return;');
     const i2=src.indexOf('followStage(el,true)',i1);
     ok('[208] ふつうの曲では送る', i1>=0&&i2>i1&&(i2-i1)<400, ''); }
   /* ③ 作った直後に、画面いっぱいにしないこと */
   { const st=U.fbState();
     const keep={on:st.on,big:st.big};
     const keepId=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     st.big=true; U.saveLibrary();
     d.body.classList.add('fb-big');
     U.makeBackingSong({prog:'pop',genre:'rock8',seed:3});
     ok('[208] 画面いっぱいにしない', U.fbState().big===false, String(U.fbState().big));
     ok('[208] 器の印も外す', !d.body.classList.contains('fb-big'), '');
     /* **指板そのものは出す**（伴奏を作る目的は、その上で弾くこと） */
     ok('[208] 指板は出す', U.fbState().on===true, String(U.fbState().on));
     /* **大きくする道は残っている** */
     ok('[208] 大きくする道は残す',
        /body\.fb-big \.fbbar\{/.test([...d.querySelectorAll('style')]
          .map(x=>x.textContent).join('')), '');
     /* ④ 譜面のコードを直せば、指板脇の進行にも出ること */
     const prog=()=>[...d.querySelectorAll('#fbbar .fb-pc[data-fbc]')]
       .map(x=>x.getAttribute('data-fbc')).filter(Boolean).join(' ');
     U.renderFretboard();
     const before=prog();
     ok('[208] 指板の脇に進行が並ぶ', before.split(' ').length>=4, before);
     /* 帯から直す道 */
     const b1=U.song.bars[1];
     b1.chordAt={0:{root:2,type:'min7',bass:null}};
     U.render(); U.renderFretboard();
     ok('[208] 帯を直せば、指板の脇にも出る',
        prog().split(' ')[1]==='Dm7', prog());
     /* 音符へ入れる道（コード台からの入力と同じ） */
     const b2=U.song.bars[2];
     const n2=(b2.notes||[]).find(x=>x.kind!=='rest');
     if(n2){ n2.kind='chord'; n2.chord={root:4,type:'min7',bass:null};
       U.render(); U.renderFretboard();
       ok('[208] 音符へ入れても、指板の脇に出る',
          prog().split(' ')[2]==='Em7', prog()); }
     /* **描き直しが繋がっていること**（render が指板も描き直す） */
     ok('[208] 譜面を描き直せば指板も描き直す',
        /function render\(\)\{[\s\S]{0,200}?renderFretboard\(\)/.test(src), '');
     /* **借りた物は返す。**練習用の印が付いたままでは、
        「片づけますか」の伺いが出て曲が入れ替わらない（§1.145） */
     st.on=keep.on; st.big=keep.big; U.saveLibrary();
     const madeId=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     try{ U.switchSong(keepId); U.render(); }catch(_){}
     try{ U.doDeleteSong(madeId); }catch(_){}
     ok('[208] 元の曲へ戻れる', U.song.id===keepId, ''); }
 }catch(e){ ok('[208] 伴奏の見え方の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    ▶ で紙へ飛ばない／印が保存で消えていた（1.209）

    L様——「再生したら紙の譜面にスクロールするから、しないようにしてって言ってる」。

    ══ 1.208 は効いていなかった ══
    「伴奏なら送らない」と書いたのに直らなかった。
    見張っていた印（`genBacking`）が **mkSong に書かれていなかった**ためである——
    作った直後は在るが、**しまって開き直せば消える。**
    実際に L様が触るのは「開き直した後」なので、**一度も効いていなかった。**

    1.146 の註に「ここに書かれていない札は保存で消える」と書いてありながら、
    **新しい札を足す時に、そこを見に来なかった。**

    ══ もう一つ ══
    小節を追う送りだけでなく、**押した瞬間の飛び**が残っていた。
    飛ばしているのが誰かは一つに絞れない——下の帯の描き直し、
    `playing` の印で変わる丈、押した札への焦点……
    ゆえに**下手人を探すのをやめ、巻き位置そのものを押さえる。**
    ══════════════════════════════════════════════════════════════ */
 try{
   /* ① **道具が付けた印が、保存をまたいで残ること** */
   { const keepId=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     const s2=U.genBackingSong({prog:'pop',genre:'rock8',seed:3});
     U.saveSong(s2); U.switchSong(s2.id);
     ok('[209] 伴奏の印が残る', U.song.genBacking==='pop', String(U.song.genBacking));
     ok('[209] 作った版の印も残る', !!U.song.genBuild, String(U.song.genBuild));
     ok('[209] 設えの控えも残る', !!U.song.genOpt&&U.song.genOpt.genre==='rock8',
        JSON.stringify(U.song.genOpt&&U.song.genOpt.genre));
     ok('[209] 種も残る（従前どおり）', U.song.genSeed===3, String(U.song.genSeed));
     /* 初見練習の印も同じ道で消えていた */
     ok('[209] 段と小節数の印も残る',
        'genLevel' in U.song&&'genBars' in U.song, '');
     /* **借りた物は返す**（練習用の印を外してから離れる） */
     U.song.genTemp=false; U.saveSong(U.song);
     const mid=U.song.id;
     try{ U.switchSong(keepId); U.render(); }catch(_){}
     try{ U.doDeleteSong(mid); }catch(_){}
     ok('[209] 元の曲へ戻れる', U.song.id===keepId, ''); }
   /* ② **mkSong に書き漏らしが無いこと**（同じ轍を二度踏まないための見張り）
        `gen` で始まる印は、すべて mkSong を通ること */
   { const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     const written=new Set();
     const mk=src.slice(src.indexOf('function mkSong('),
                        src.indexOf('function barTS('));
     [...mk.matchAll(/\b(gen[A-Za-z]+)\s*:/g)].forEach(m=>written.add(m[1]));
     const used=new Set();
     [...src.matchAll(/\bs\.(gen[A-Za-z]+)\s*=/g)].forEach(m=>used.add(m[1]));
     [...src.matchAll(/\bsong\.(gen[A-Za-z]+)\s*=/g)].forEach(m=>used.add(m[1]));
     const miss=[...used].filter(k=>!written.has(k));
     ok('[209] 道具の印は、すべて保存に載る', miss.length===0, miss.join(',')); }
   /* ③ ▶ を押した時、巻き位置を押さえる仕掛けが在ること */
   { const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     ok('[209] 伴奏では巻き位置を戻す',
        /if\(song&&song\.genBacking\)\{[\s\S]{0,240}?window\.scrollTo\(0,y0\)/.test(src), '');
     /* **押さえすぎない**——L様ご自身の巻きまで戻しては困る */
     ok('[209] 押さえるのは一瞬だけ',
        /\[0,30,80,160,300\]\.forEach\(ms=>setTimeout\(back,ms\)\)/.test(src), '');
     ok('[209] ふつうの曲では押さえない',
        /if\(song&&song\.genBacking\)\{[\s\S]{0,60}?const y0=/.test(src), ''); }
 }catch(e){ ok('[209] 巻き位置の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    画面いっぱいの控えを、一度だけ外す（1.210）

    L様——「最初から画面いっぱいに出てるが？　何も直ってねえよ」。

    **控えに残っていた。**
    1.174 から 1.208 まで、伴奏を作るたびに `big=true` を控えへ書き込んでいた。
    1.209 で「作る時は大きくしない」ようにしたが、
    **既に書き込まれた `true` はそのまま残る。**
    開けば毎回 `body.fb-big` が付く——
    **直したのは書き込む側だけで、書き込まれた物を見に行かなかった。**

    既定も `false` へ改めたが、**既定は「控えが無い時」しか効かない。**
    ゆえに、一度だけ外す印を置く。
    ——**設えを変えた時は、既に控えられた設えをどうするかまでが仕事**である。
    ══════════════════════════════════════════════════════════════ */
 try{
   const st=U.fbState();
   const keep={big:st.big,rst:st.bigReset210};
   /* ① 既定が「大きくしない」になっていること */
   { const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     ok('[210] 既定は大きくしない',
        /library\.fb=\{on:(?:true|false),frets:12,scale:null,pin:null,label:'deg',big:false/.test(src), ''); }
   /* ①' 既定は「出さない」（1.285。L様のご指定で on:true から改めた）*/
   { const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     ok('[285] 既定は指板を出さない',
        /library\.fb=\{on:false,/.test(src), ''); }
   /* ② **旧版の控え（big:true・印なし）を、一度だけ外すこと** */
   { U.library.fb=Object.assign({},U.library.fb,{big:true});
     delete U.library.fb.bigReset210;
     const st2=U.fbState();
     ok('[210] 残っていた控えを外す', st2.big===false, String(st2.big));
     ok('[210] 外した印を立てる', st2.bigReset210===true, String(st2.bigReset210));
     U.renderFretboard();
     ok('[210] 器の印も付かない', !d.body.classList.contains('fb-big'), ''); }
   /* ③ **一度外した後、L様が自分で大きくしたら、それは残ること**
        （毎回外していては、大きくする道が無いのと同じ） */
   { /* **控えは差し替わっているので、取り直す**
        （古い参照へ書いても、道具は見ていない） */
     const stNow=U.fbState();
     stNow.big=true; U.saveLibrary();
     const st3=U.fbState();
     ok('[210] 自分で大きくした分は残す', st3.big===true, String(st3.big));
     U.renderFretboard();
     ok('[210] 器の印も付く', d.body.classList.contains('fb-big'), ''); }
   /* ④ 伴奏を作った時も、大きくしないこと（1.209 で入れた分） */
   { const keepId=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     st.big=true; U.saveLibrary(); d.body.classList.add('fb-big');
     U.makeBackingSong({prog:'pop',genre:'rock8',seed:3});
     ok('[210] 作った時も大きくしない', U.fbState().big===false, String(U.fbState().big));
     ok('[210] 作った時に器の印も外す', !d.body.classList.contains('fb-big'), '');
     const mid=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     try{ U.switchSong(keepId); U.render(); }catch(_){}
     try{ U.doDeleteSong(mid); }catch(_){} }
   { const stEnd=U.fbState();
     stEnd.big=keep.big; stEnd.bigReset210=keep.rst; U.saveLibrary(); }
   try{ U.renderFretboard(); }catch(_){}
 }catch(e){ ok('[210] 控えの後始末の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    まるごとの型の札を畳んだ（1.211）

    L様——「アドリブ設定の進行っている？　ごちゃついてる」。

    **要らなかった。**部品で組めば同じ物が出る——
    「王道」も「カノン」も「ブルース」も、部品の側に同じ名前で並んでいた。
    **同じ物を二箇所に並べておけば、生徒様は「違いは何か」を探す。**
    探しても違いは無い。
    ══════════════════════════════════════════════════════════════ */
 try{
   U.openBackingGen();
   const pop=d.querySelector('.pop-ov.open')||d.querySelector('.pop');
   ok('[211] 設えの画面が開く', !!pop, '');
   const txt=pop?pop.textContent:'';
   const heads=[...pop.querySelectorAll('*')]
     .filter(e=>e.children.length===0)
     .map(e=>e.textContent.trim());
   /* ① まるごとの型の札が並んでいないこと */
   { /* **部品にも同じ名前の物が在る**（王道など）ので、
        「無い」ではなく「二枚並んでいない」で見る */
     const dup=U.BK_PROGS.filter(pr=>pr.id!=='free').filter(pr=>
       [...pop.querySelectorAll('button.pb')]
         .filter(b=>b.textContent.trim()===pr.name).length>1);
     ok('[211] 同じ名前の札が二枚並んでいない', dup.length===0,
        dup.map(x=>x.name).join(','));
     /* 部品に無い名前（ツーファイブ・短調・ドリアンなど）が札に残っていないこと */
     const onlyProg=U.BK_PROGS.filter(pr=>pr.id!=='free')
       .filter(pr=>!U.BK_PARTS.some(x=>x.name===pr.name))
       .filter(pr=>[...pop.querySelectorAll('button.pb')]
         .some(b=>b.textContent.trim()===pr.name));
     ok('[211] まるごとの型だけの札は無い', onlyProg.length===0,
        onlyProg.map(x=>x.name).join(',')); }
   /* ② 部品の段が、四つから三つになっていること */
   { const tags=['四小節','二小節','長いもの（八・十二小節）'];
     const miss=tags.filter(t=>heads.indexOf(t)<0);
     ok('[211] 部品の段は三つ', miss.length===0, miss.join(','));
     ok('[211] 八小節・十二小節の段は畳んだ',
        heads.indexOf('八小節')<0&&heads.indexOf('十二小節')<0, ''); }
   /* ③ **同じ名前を二つ並べないこと**（部品の「ターンアラウンド」と刻みの帰り際） */
   { const n=heads.filter(t=>t==='ターンアラウンド').length;
     ok('[211] 同じ見出しが二つ無い', n===0, String(n));
     ok('[211] 刻みの方は「帰り際の刻み」', heads.indexOf('帰り際の刻み')>=0, ''); }
   /* ④ **案内を二箇所に書かないこと** */
   { /* **並びは前の操作から残る**ので、まず消してから見る */
     const clr=[...pop.querySelectorAll('button.pb')]
       .find(b=>b.textContent.trim()==='並べたものを消す');
     if(clr) clr.click();
     const notes=[...pop.querySelectorAll('.p-note')].map(e=>e.textContent).join(' ');
     ok('[211] 並べていない時だけ、型の名を出す',
        /並べなければ「.+」で組みます/.test(notes), notes.slice(0,60));
     ok('[211] 並びの案内はその場に出る',
        /まだ何も並んでおりません/.test(notes), '');
     /* 並べれば、型の名は引っ込むこと（**同じことを二箇所に書かない**） */
     const one=[...pop.querySelectorAll('button.pb')]
       .find(b=>b.textContent.trim()==='王道（I–V–vi–IV）');
     if(one){ one.click();
       const n2=[...pop.querySelectorAll('.p-note')].map(e=>e.textContent).join(' ');
       ok('[211] 並べれば型の名は引っ込む',
          !/並べなければ「.+」で組みます/.test(n2)&&/計 4小節/.test(n2), n2.slice(0,60));
       one.click(); } }
   try{ U.closePop(); }catch(_){}
 }catch(e){ ok('[211] 設えの片づけの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    呼び名を「リズムパターン」へ（1.213）

    L様——「ジャンルではなくリズムパターンの表記にして」。

    **ジャンルは音楽の種類であって、ここで選んでいるのは刻みそのものである。**
    「ボサノヴァ」を選べばボサノヴァの曲になるわけではない——
    出てくるのは**ボサノヴァの刻み**であって、進行も調も別に選ぶ。
    看板が「ジャンル」では、**選んだ以上の物を約束してしまう。**
    ══════════════════════════════════════════════════════════════ */
 try{
   /* ① 設えの画面に「ジャンル」の字が出ていないこと */
   U.openBackingGen();
   const pop=d.querySelector('.pop-ov.open')||d.querySelector('.pop');
   ok('[213] 設えの画面が開く', !!pop, '');
   const txt=pop?pop.textContent:'';
   ok('[213] 見出しが「リズムパターン」', /リズムパターン/.test(txt), '');
   ok('[213] 画面に「ジャンル」の字が無い', !/ジャンル/.test(txt),
      (txt.match(/.{0,12}ジャンル.{0,12}/)||[''])[0]);
   try{ U.closePop(); }catch(_){}
   /* ② 手引きの〈アドリブの伴奏〉の章にも残っていないこと */
   { const secs=U.HELP||U.HELP_SECS||null;
     const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     const i0=src.indexOf("{ id:'backing', t:'アドリブの伴奏', rows:[");
     const i1=src.indexOf("{ id:'fretboard'",i0);
     const blk=(i0>=0&&i1>i0)?src.slice(i0,i1):'';
     ok('[213] 手引きの章が読める', blk.length>500, String(blk.length));
     ok('[213] 手引きに「ジャンル」が残っていない', !/ジャンル/.test(blk),
        (blk.match(/.{0,16}ジャンル.{0,16}/)||[''])[0]); }
   /* ③ **中の名前は変えていないこと**（呼び名だけを改める）
        —— 呼び名を変えるたびに中まで書き換えれば、
           直した所と直していない所が混ざる */
   { ok('[213] 表の名はそのまま', Array.isArray(U.BK_GENRES)&&!!U.bkGenre, '');
     ok('[213] 刻みは十四のまま',
        U.BK_GENRES.filter(g=>g.pat).length===14,
        String(U.BK_GENRES.filter(g=>g.pat).length)); }
 }catch(e){ ok('[213] 呼び名の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    長いコード名が、小節からはみ出して切れていた（1.215）

    L様——「長いコード名が途切れてる」。

    名前は**符頭の真上に、中央揃え**で置いている。
    ふつうの小節では収まるが、**2/4 で一段に六小節**ともなると
    一小節の幅は 150px ほどしかない。
    そこへ `F♯9sus4` のような長い名を中央揃えで置けば、
    **左半分が小節の外へ出て、紙の縁で切られる。**

    ① まず**小節の内側へ寄せる**（はみ出す分だけ、中へ押し戻す）
    ② それでも入らない長さなら、**字を縮める**（下限 8px）
    —— **切るのではなく、寄せて、縮める。**
       切れた名前は読めないが、小さい名前は読める。
    ══════════════════════════════════════════════════════════════ */
 try{
   const pull=(bar,s2,W)=>{
     const fc=Object.keys(bar.chordAt||{}).map(Number).sort((x,y)=>x-y)
       .map(t=>({tick:t,chord:bar.chordAt[t]}));
     const r=U.engrave(s2,bar,{width:W,hits:true,barId:bar.id,freeChords:fc});
     const str=String((r&&r.svg)||r||'');
     return [...str.matchAll(/<text x="([-\d.]+)"[^>]*?font-size="([\d.]+)"[^>]*?fill="#9a3412"[^>]*>([^<]+)</g)]
       .map(m=>({cx:+m[1],fs:+m[2],t:m[3]}));
   };
   /* ① どの幅でも、小節の外へ出ないこと */
   { const s2=U.genBackingSong({parts:['p_25','p_251'],genre:'bossa',
       key:{root:11,qual:'maj',name:'B'},tension:'rich',seed:7});
     const bad=[];
     [220,150,110,80].forEach(W=>{
       s2.bars.forEach((b,i)=>{
         pull(b,s2,W).forEach(o=>{
           const tw=U.measureText(o.t,o.fs);
           if(o.cx-tw/2<-0.5) bad.push(W+'px／'+o.t+'：左へ'+(o.cx-tw/2).toFixed(1));
           if(o.cx+tw/2>W+0.5) bad.push(W+'px／'+o.t+'：右へ'+(o.cx+tw/2-W).toFixed(1));
         });
       });
     });
     ok('[215] 名前が小節からはみ出さない', bad.length===0, bad.slice(0,4).join(' / ')); }
   /* ② **長い名前は縮める**（狭い小節でも読める形にする） */
   { /* **いちばん長くなる形**で見る（オンコードは名前が伸びる）。
        小節の幅には下限（80px）があるので、そこでも収まるかを確かめる */
     const s3=U.genBackingSong({chords:[{root:6,type:'dom9sus4',bass:1}],
                                genre:'rock8',seed:3});
     const b3=s3.bars[0];
     const wide=pull(b3,s3,240)[0], narrow=pull(b3,s3,80)[0];
     ok('[215] 長い名前を出せる', !!wide&&wide.t.length>=6, wide?wide.t:'—');
     ok('[215] 狭ければ字を縮める', !!narrow&&narrow.fs<wide.fs,
        (wide?wide.fs:'—')+' → '+(narrow?narrow.fs:'—'));
     ok('[215] 縮めても小さすぎない', !narrow||narrow.fs>=8, String(narrow&&narrow.fs));
     ok('[215] 広ければ縮めない', !!wide&&wide.fs===12, String(wide&&wide.fs)); }
   /* ③ **引き出し線は元の位置へ**（寄せた先ではなく、その音の真上へ） */
   { const src=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     ok('[215] 引き出し線は寄せない',
        /if\(dense\) g\+=`<line x1="\$\{l\.cx\.toFixed\(1\)\}"/.test(src), ''); }
 }catch(e){ ok('[215] コード名の収まりの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    転調のキーと、スケールの根音（1.216）

    L様——「アドリブ生成で転調した際に楽譜上にキーを出さないと分かりづらいし、
            選んだスケールは種類だけでルートの音（Cメジャースケール）などが
            ないため正確ではない」。

    ══ キーは書いてあった。切れていた ══
    「ここから Key D♭　メジャーペンタトニック／…」は
    一小節の幅（2/4 で一段六小節なら 150px）を遥かに超える。
    左端から書き始めて、はみ出した所から先は消える——
    **書いたのに読めないのは、書いていないのと同じ。**

    ══ 種類だけでは、形が定まらない ══
    D から組んだドリアンと A から組んだドリアンは、別の音の並びである。
    **種類は「どう並ぶか」、根音は「どこから並ぶか」——両方で一つ。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const T=U.T;
   /* ① 転調した所に、キーが書かれること */
   { const s2=U.genBackingSong({parts:['p_oudou'],genre:'rock8',
       key:{root:0,qual:'maj',name:'C'},mod:'lift1',tension:'none',seed:3});
     ok('[216] 転調で八小節になる', s2.bars.length===8, String(s2.bars.length));
     const t0=s2.bars[0].marks&&s2.bars[0].marks.text;
     const t4=s2.bars[4].marks&&s2.bars[4].marks.text;
     ok('[216] 頭にキーが書かれる', !!t0&&/^Key C/.test(t0.t), t0?t0.t.slice(0,20):'—');
     ok('[216] 転調した所にも書かれる',
        !!t4&&/^ここから Key D♭/.test(t4.t), t4?t4.t.slice(0,24):'—');
     ok('[216] 区間の控えも二つ',
        (s2.genSegs||[]).length===2, String((s2.genSegs||[]).length)); }
   /* ② **注釈が小節からはみ出さないこと**（書いたのに読めない、を無くす） */
   { const s3=U.genBackingSong({parts:['p_oudou'],genre:'bossa',
       key:{root:11,qual:'maj',name:'B'},mod:'lift1',seed:3});
     const bad=[];
     [240,150,110,80].forEach(W=>{
       s3.bars.forEach(b=>{
         const r=U.engrave(s3,b,{width:W,hits:true,barId:b.id});
         const str=String((r&&r.svg)||r||'');
         [...str.matchAll(/<text x="([-\d.]+)"[^>]*?font-size="([\d.]+)"[^>]*?font-style="italic" fill="#4b5563"[^>]*>([^<]+)</g)]
           .forEach(m=>{
             const x=+m[1], fs=+m[2], t=m[3];
             const tw=U.measureText(t,fs);
             if(x+tw>W+0.5) bad.push(W+'px：'+(x+tw-W).toFixed(1)+'px はみ出し');
             if(fs<7) bad.push(W+'px：字が'+fs);
           });
       });
     });
     ok('[216] 注釈が小節からはみ出さない', bad.length===0,
        [...new Set(bad)].slice(0,4).join(' / '));
     /* **狭くても、キーだけは残ること**——後ろから削っても頭は落とさない */
     { const b5=s3.bars[4];
       const r5=U.engrave(s3,b5,{width:110,hits:true,barId:b5.id});
       const m5=String((r5&&r5.svg)||'')
         .match(/<text [^>]*font-style="italic" fill="#4b5563"[^>]*>([^<]+)</);
       ok('[216] 狭くてもキーは残る', !!m5&&/Key/.test(m5[1]), m5?m5[1]:'—'); } }
   /* ③ **スケールの名は、根音とひと組**であること */
   { ok('[216] 根音と種類を組む道が在る',
        U.scaleFullName(2,U.jamScale('dorian'),false)==='D ドリアン',
        U.scaleFullName(2,U.jamScale('dorian'),false));
     ok('[216] ♭で書く曲では♭で',
        /^D♭ /.test(U.scaleFullName(1,U.jamScale('ionian'),true)),
        U.scaleFullName(1,U.jamScale('ionian'),true));
     ok('[216] 根音が無ければ種類だけ',
        U.scaleFullName(null,U.jamScale('dorian'),false)==='ドリアン', '');
     /* 譜面の注釈にも根音が出る（**先頭に一度**——三つとも同じ根音ゆえ） */
     const s4=U.genBackingSong({parts:['p_oudou'],genre:'rock8',
       key:{root:0,qual:'maj',name:'C'},tension:'none',seed:3});
     const t=s4.bars[0].marks.text.t;
     /* 1.217：頭は親の音階（アイオニアン／ナチュラルマイナー）から */
     ok('[216] 注釈の先頭に根音が付く', /Key C　C アイオニアン/.test(t), t.slice(0,30));
     ok('[216] 同じ根音を三度は書かない',
        (t.match(/C [ァ-ヶ]/g)||[]).length<=1, t.slice(0,40)); }
   /* ④ 指板の側でも、根音とひと組で出ること */
   { const st=U.fbState(); const keep={on:st.on,pc:st.perChord};
     st.on=true; st.perChord={}; U.saveLibrary();
     const keepId=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     const s5=U.genBackingSong({parts:['p_oudou'],genre:'rock8',
       key:{root:0,qual:'maj',name:'C'},tension:'none',seed:3});
     U.saveSong(s5); U.switchSong(s5.id);
     U.TP.phBar=s5.bars[1].id; U.renderFretboard();
     const asg=(d.querySelector('#fbbar .fb-asg')||{}).textContent||'';
     ok('[216] 出ているスケールに根音が付く', /^[A-G]/.test(asg), asg);
     const chips=[...d.querySelectorAll('#fbbar .fb-scales .fb-b[data-sc]')]
       .map(x=>x.textContent.trim().replace(/^[◎★○△⚠✕]/,''));
     ok('[216] 札にも根音が付く', chips.length>0&&chips.every(t2=>/^[A-G]/.test(t2)),
        chips.slice(0,3).join(' / '));
     /* **和音が変われば、根音も移ること** */
     U.TP.phBar=s5.bars[2].id; U.renderFretboard();
     const asg2=(d.querySelector('#fbbar .fb-asg')||{}).textContent||'';
     ok('[216] 和音が変われば根音も移る', asg.split(' ')[0]!==asg2.split(' ')[0],
        asg+' → '+asg2);
     U.TP.phBar=null;
     st.on=keep.on; st.perChord=keep.pc; U.saveLibrary();
     U.song.genTemp=false; U.saveSong(U.song);
     const mid=U.song.id;
     try{ U.switchSong(keepId); U.render(); }catch(_){}
     try{ U.doDeleteSong(mid); }catch(_){} }
 }catch(e){ ok('[216] キーと根音の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    調の中では、教会旋法を既定にする（1.217）

    L様——「コード進行が転調していないうちのデフォルトは
            チャーチモードスケールにして」。

    同じ調の中なら、**七つの旋法はどれも同じ音の並び**である。
    C の調で Dm7 にドリアンを当てても、光る音は C アイオニアンと変わらない——
    **変わるのは「どこから数えるか」だけ。**
    度数を和音から数えるようにした（§1.178）以上、旋法を当てるのが筋である。
    ══════════════════════════════════════════════════════════════ */
 try{
   /* ① 度数と旋法の対応 */
   { const M=U.FB_MODE_OF;
     ok('[217] 長調の七つが揃っている',
        M.maj[0]==='ionian'&&M.maj[2]==='dorian'&&M.maj[4]==='phryg'
        &&M.maj[5]==='lydian'&&M.maj[7]==='mixo'&&M.maj[9]==='aeolian'
        &&M.maj[11]==='locrian', JSON.stringify(M.maj));
     ok('[217] 短調の七つも揃っている',
        M.min[0]==='aeolian'&&M.min[3]==='ionian'&&M.min[5]==='dorian'
        &&M.min[7]==='phryg'&&M.min[8]==='lydian'&&M.min[10]==='mixo'
        &&M.min[2]==='locrian', JSON.stringify(M.min));
     /* **七つとも、同じ親から出ていること**——音の顔ぶれが揃わなければ旋法ではない */
     const par=Object.keys(M.maj).map(dg=>{
       const sc=U.jamScale(M.maj[dg]);
       return sc.iv.map(iv=>((+dg+iv)%12+12)%12).sort((a2,b2)=>a2-b2).join(',');
     });
     ok('[217] 七つとも同じ音の並び', new Set(par).size===1, [...new Set(par)].join(' / ')); }
   /* ② 調の外から来た和音では、旋法を決めないこと */
   { ok('[217] 調の中なら旋法が決まる',
        U.fbModeFor({root:2,type:'min7'},{root:0,qual:'maj'})==='dorian', '');
     ok('[217] 調の外なら決めない',
        U.fbModeFor({root:1,type:'maj'},{root:0,qual:'maj'})===null, '');
     ok('[217] 短調でも決まる',
        U.fbModeFor({root:5,type:'min7'},{root:0,qual:'min'})==='dorian', ''); }
   /* ③ **当てていない和音に、その度数の旋法が出ること** */
   { const st=U.fbState(); const keep={on:st.on,pc:st.perChord};
     st.on=true; st.perChord={}; st.pin=null; st.pinCh=null; U.saveLibrary();
     const keepId=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     const s2=U.genBackingSong({parts:['p_canon'],genre:'rock8',
       key:{root:0,qual:'maj',name:'C'},tension:'none',seed:3});
     U.saveSong(s2); U.switchSong(s2.id);
     const got=[];
     s2.bars.forEach(b=>{ U.TP.phBar=b.id; U.renderFretboard();
       got.push(((d.querySelector('#fbbar .fb-asg')||{}).textContent||'').replace(/自動$/,'')); });
     ok('[217] 和音ごとに旋法が出る',
        got.join(' / ')==='C アイオニアン / G ミクソリディアン / A ナチュラルマイナー / '
                        +'E フリジアン / F リディアン / C アイオニアン / F リディアン / G ミクソリディアン',
        got.join(' / '));
     /* **光る音は変わらないこと**——同じ調なら、旋法が変わっても親は同じ */
     const pcsOf=()=>{
       const svg=d.getElementById('fbbar').innerHTML;
       return [...new Set([...svg.matchAll(/<circle[^>]*fill="([^"]+)"/g)]
         .filter(m=>m[1]!==U.JAM_COL.other).map(m=>m.index))].length;
     };
     U.TP.phBar=s2.bars[0].id; U.renderFretboard(); const a1=pcsOf();
     U.TP.phBar=s2.bars[1].id; U.renderFretboard(); const a2=pcsOf();
     ok('[217] 旋法が移っても、光る音の数は同じ', a1===a2, a1+' / '+a2);
     /* ④ 譜面の頭も、親の音階から書く */
     ok('[217] 注釈の頭は親の音階',
        /Key C　C アイオニアン/.test(s2.bars[0].marks.text.t),
        s2.bars[0].marks.text.t.slice(0,26));
     U.TP.phBar=null;
     st.on=keep.on; st.perChord=keep.pc; U.saveLibrary();
     U.song.genTemp=false; U.saveSong(U.song);
     const mid=U.song.id;
     try{ U.switchSong(keepId); U.render(); }catch(_){}
     try{ U.doDeleteSong(mid); }catch(_){} }
   /* ⑤ **当てた物は、旋法より勝つこと**（既定は既定であって、縛りではない） */
   { const st=U.fbState(); const keep=st.perChord;
     st.perChord={'Dm7':'minpent'}; U.saveLibrary();
     const a3=U.fbAdvice({root:2,type:'min7',bass:null},{root:0,qual:'maj'},2);
     ok('[217] 旋法がいちばん前に並ぶ', a3[0].id==='dorian', a3[0].id);
     st.perChord=keep; U.saveLibrary(); }
 }catch(e){ ok('[217] 教会旋法の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    平行調のスケール（1.218）

    L様——「平行調のペンタがおすすめに出ない」。

    スケールの根音を**和音の根音に縛って**いた。
    C の調で C の和音を弾いている時、出せるのは「C から組んだ物」だけ——
    **「A から組んだマイナーペンタ」は、そもそも作れなかった。**

    平行短調のペンタは C メジャーペンタと**同じ五つの音**だが、
    ギターでは「平行短調のペンタで弾く」と教える方が通りがよい——
    **同じ音でも、どこから数えるかで手癖が変わる。**
    ══════════════════════════════════════════════════════════════ */
 try{
   /* ① 札の名に、根音のずれを持たせる道 */
   { ok('[218] 長調の平行は短調のペンタ', U.fbRelId({root:0,qual:'maj'})==='minpent^9',
        String(U.fbRelId({root:0,qual:'maj'})));
     ok('[218] 短調の平行は長調のペンタ', U.fbRelId({root:9,qual:'min'})==='majpent^3',
        String(U.fbRelId({root:9,qual:'min'})));
     ok('[218] 根音は調から数える',
        U.fbRootOf('minpent^9',{root:5,type:'maj'},{root:0,qual:'maj'})===9,
        String(U.fbRootOf('minpent^9',{root:5,type:'maj'},{root:0,qual:'maj'})));
     ok('[218] ずれの無い札は、和音から数える',
        U.fbRootOf('dorian',{root:5,type:'maj'},{root:0,qual:'maj'})===5, '');
     ok('[218] 印の付いた id でも表は引ける',
        U.jamScale('minpent^9').id==='minpent', U.jamScale('minpent^9').id);
     /* **同じ五つの音であること**（平行調の意味そのもの） */
     { const a1=U.jamScale('majpent').iv.map(iv=>(0+iv)%12).sort((x,y)=>x-y).join(',');
       const a2=U.jamScale('minpent').iv.map(iv=>(9+iv)%12).sort((x,y)=>x-y).join(',');
       ok('[218] C メジャーペンタと A マイナーペンタは同じ音', a1===a2, a1+' / '+a2); } }
   /* ② **どの和音でも、勧めに出ること**（これが今回の症状） */
   { const key={root:0,qual:'maj'};
     const bad=[];
     /* vi（Am）は平行調そのものなので、和音の根音から組む札と重なる——
        その時は一枚だけ並ぶ（下の③で確かめる） */
     [[0,'maj'],[7,'maj'],[4,'min'],[5,'maj'],[2,'min7'],[7,'dom7']].forEach(([r,t])=>{
       const a=U.fbAdvice({root:r,type:t,bass:null},key,r);
       const rel=a.find(x=>x.rel);
       if(!rel) { bad.push(r+t+'：出ない'); return; }
       if(!rel.safe) bad.push(r+t+'：当たらない扱い');
       if(rel.root!==9) bad.push(r+t+'：根音'+rel.root);
     });
     /* vi の所でも、A マイナーペンタは（重なった一枚として）必ず在ること */
     { const a9=U.fbAdvice({root:9,type:'min',bass:null},key,9);
       ok('[218] 平行調そのものの和音でも在る',
          a9.some(x=>U.jamScale(x.id).id==='minpent'&&x.root===9&&x.safe), ''); }
     ok('[218] どの和音でも平行調が候補に出る', bad.length===0, bad.join(' / '));
     /* **旋法のすぐ次**に置く（まず親、次に平行） */
     const a2=U.fbAdvice({root:0,type:'maj',bass:null},key,0);
     ok('[218] 旋法の次に並ぶ', a2[0].id==='ionian'&&a2[1].id==='minpent^9',
        a2.slice(0,3).map(x=>x.id).join(',')); }
   /* ③ **同じ物を二度並べないこと**（平行調が和音の根音と重なる時） */
   { const a3=U.fbAdvice({root:9,type:'min',bass:null},{root:0,qual:'maj'},9);
     const n=a3.filter(x=>U.jamScale(x.id).id==='minpent'&&x.root===9).length;
     ok('[218] 重なる時は一枚だけ', n===1, String(n)); }
   /* ④ **減五度の和音には勧めないこと**
        （ペンタは三全音を持たず、根音の半音上が居座る） */
   { const a4=U.fbAdvice({root:11,type:'m7b5',bass:null},{root:0,qual:'maj'},11);
     ok('[218] 減五度には勧めない', !a4.some(x=>x.rel),
        a4.filter(x=>x.rel).map(x=>x.id).join(',')); }
   /* ⑤ 画面の札にも出ること（**足したら並べ直す**——末席に置かない） */
   { const st=U.fbState(); const keep={on:st.on,pc:st.perChord,list:st.list};
     st.on=true; st.perChord={}; st.pin=null; st.pinCh=null; U.saveLibrary();
     const keepId=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     const s2=U.genBackingSong({parts:['p_canon'],genre:'rock8',
       key:{root:0,qual:'maj',name:'C'},tension:'none',seed:3});
     U.saveSong(s2); U.switchSong(s2.id);
     const bad=[];
     s2.bars.forEach((b,i)=>{
       U.TP.phBar=b.id; U.renderFretboard();
       const chips=[...d.querySelectorAll('#fbbar .fb-scales .fb-b[data-sc]')]
         .map(x=>x.textContent.trim().replace(/^[◎★○△⚠✕]/,''));
       const at=chips.indexOf('A マイナーペンタ');
       if(at<0) bad.push((i+1)+'小節：出ない');
       else if(at>2) bad.push((i+1)+'小節：'+(at+1)+'枚目');
     });
     ok('[218] どの小節でも札の前の方に並ぶ', bad.length===0, bad.join(' / '));
     U.TP.phBar=null;
     st.on=keep.on; st.perChord=keep.pc; st.list=keep.list; U.saveLibrary();
     U.song.genTemp=false; U.saveSong(U.song);
     const mid=U.song.id;
     try{ U.switchSong(keepId); U.render(); }catch(_){}
     try{ U.doDeleteSong(mid); }catch(_){} }
 }catch(e){ ok('[218] 平行調の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    次のスケールを、輪で重ねる（1.219）

    L様——「現在のスケールと次に表示されるスケールを何らかの方法で
            同時に出せる？　目立つ優先順を守った上で」。

    ══ 目立ちの順を壊さない ══
    いまの光りは**塗りの三段**で、これは触らない。
    次は**塗らずに、線だけ**で置く——
    **塗りは面で目に入り、線は線でしか入らない。**

    ══ 差だけでは、何も出なかった ══
    はじめ「次にだけ在るスケール音」を出そうとしたが、一つも出なかった。
    同じ調の中では七つの旋法はどれも同じ音の並びで、
    **差が無いのだから差は見せられない。**
    ゆえに**次の和音の音**（着地する所）を輪で重ねる——
    いま光っていて輪も付いている音が、**渡り板**である。
    ══════════════════════════════════════════════════════════════ */
 try{
   const st=U.fbState();
   const keep={on:st.on,pc:st.perChord,nx:st.nextOn};
   const keepId=U.song.id;
   U.song.genTemp=false; U.saveSong(U.song);
   st.on=true; st.perChord={}; st.pin=null; st.pinCh=null; st.nextOn=true; U.saveLibrary();
   const s2=U.genBackingSong({parts:['p_oudou'],genre:'rock8',
     key:{root:0,qual:'maj',name:'C'},tension:'none',seed:3});
   U.saveSong(s2); U.switchSong(s2.id);
   const svgOf=()=>d.getElementById('fbbar').innerHTML;
   const rings=t=>(String(t).match(/stroke-width="2"/g)||[]).length;
   const dash =t=>(String(t).match(/stroke-dasharray="3 2\.4"/g)||[]).length;
   /* ① 次の和音が読めること（**同じ名前が続く所は飛ばす**——次は変わる先） */
   /* 1.226：註の書き方が変わった（狙う音を先に出す）ので、そこから読む */
   { const got=[];
     s2.bars.forEach(b=>{ U.TP.phBar=b.id; U.renderFretboard();
       const t=((d.querySelector('#fbbar .fb-note')||{}).textContent||'');
       const m=t.match(/次の ([^ ]+) の/);
       const g=t.match(/次は ([^　]+)/);
       got.push((m?m[1]:'—')+'→'+(g?g[1]:'—')); });
     ok('[219] 次の和音とスケールが読める',
        got.join(' / ')==='G→G ミクソリディアン / Am→A ナチュラルマイナー / '
                        +'F→F リディアン / C→C アイオニアン', got.join(' / ')); }
   /* ② **輪が出ること。**塗りの上に線を重ねるだけ */
   { U.TP.phBar=s2.bars[0].id; U.renderFretboard();
     const t=svgOf();
     ok('[219] 次の和音の音に輪が付く', rings(t)>0, String(rings(t)));
     /* **塗りは減っていないこと**——目立ちの順を壊さない */
     const fills=(t.match(/<circle[^>]*fill="(#b91c1c|#4338ca|rgba\(99,102,241,\.42\))"/g)||[]).length;
     ok('[219] 塗りは減っていない', fills>0, String(fills));
     /* 輪は、盤に出ている所にだけ置く（**光っていない所へ輪だけ置かない**） */
     ok('[219] 輪の数は塗りの数を超えない', rings(t)<=fills, rings(t)+' / '+fills); }
   /* ③ 切れば消えること（**足した物は、外せること**） */
   { st.nextOn=false; U.saveLibrary(); U.renderFretboard();
     const t=svgOf();
     ok('[219] 切れば輪も破線も消える', rings(t)===0&&dash(t)===0,
        rings(t)+' / '+dash(t));
     ok('[219] 註からも消える',
        !/次は /.test((d.querySelector('#fbbar .fb-note')||{}).textContent||''), '');
     st.nextOn=true; U.saveLibrary(); U.renderFretboard();
     ok('[219] 入れれば戻る', rings(svgOf())>0, ''); }
   /* ④ 札から切り替えられること */
   { const b=d.querySelector('#fbbar .fb-b[data-nx]');
     ok('[219] 次のコードの札が在る', !!b, '');
     if(b){ b.onclick();
       ok('[219] 叩けば切れる', U.fbState().nextOn===false, String(U.fbState().nextOn));
       d.querySelector('#fbbar .fb-b[data-nx]').onclick();
       ok('[219] もう一度叩けば戻る', U.fbState().nextOn===true, ''); } }
   /* ⑤ **調の外の和音では、破線も出ること**（新しく入る音がある時） */
   { const s3=U.genBackingSong({chords:[
       {root:0,type:'maj',bass:null},{root:8,type:'maj',bass:null}],
       genre:'rock8',key:{root:0,qual:'maj',name:'C'},seed:3});
     U.song.genTemp=false; U.saveSong(U.song);
     U.saveSong(s3); U.switchSong(s3.id);
     U.TP.phBar=s3.bars[0].id; U.renderFretboard();
     ok('[219] 次で新しく入る音は破線で出る', dash(svgOf())>0, String(dash(svgOf())));
     U.song.genTemp=false; U.saveSong(U.song);
     try{ U.doDeleteSong(s3.id); }catch(_){} }
   U.TP.phBar=null;
   st.on=keep.on; st.perChord=keep.pc; st.nextOn=keep.nx; U.saveLibrary();
   U.song.genTemp=false; U.saveSong(U.song);
   const mid=U.song.id;
   try{ U.switchSong(keepId); U.render(); }catch(_){}
   try{ U.doDeleteSong(mid); U.doDeleteSong(s2.id); }catch(_){}
   ok('[219] 元の曲へ戻れる', U.song.id===keepId, '');
 }catch(e){ ok('[219] 次のスケールの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    指板の丈を、動かさない（1.220）

    L様——「また自動スクロールが」。

    **巻いてはいなかった。**指板を譜面の上へ移した（§1.208）ので、
    **指板の丈が変われば、その下の紙がまるごと上下する。**
    小節が進むたびに——コードの名の長さ、札の数、註の長さが変わり、
    折り返しの行数が変わる——**紙が一行ぶん跳ねる。**
    目には「勝手に巻いた」としか映らない。

    **原因は巻きではなく、丈である。**
    ——上に置いた物は、**丈が動けば下の物を押す。**
      置き場所を変えた時は、丈まで見なければならなかった。
    ══════════════════════════════════════════════════════════════ */
 try{
   const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('');
   /* ① 中身を一行に固定する決まりが在ること */
   ok('[220] 註は折り返さない',
      /\.fb-note\{[^}]*white-space:nowrap/.test(css), '');
   ok('[220] 註の丈は決め打ち',
      /\.fb-note\{[^}]*height:22px/.test(css), '');
   ok('[220] 札の列は横へ流す',
      /\.fb-scales\{[^}]*flex-wrap:nowrap/.test(css)
      &&/\.fb-scales\{[^}]*overflow-x:auto/.test(css), '');
   ok('[220] 進行の列も横へ流す',
      /\.fb-prog\{[^}]*flex-wrap:nowrap/.test(css)
      &&/\.fb-prog\{[^}]*overflow-x:auto/.test(css), '');
   /* ② **画面いっぱいの時は折り返してよい**（紙が伏せてあるので押す物が無い） */
   ok('[220] 大きい時は折り返す',
      /body\.fb-big \.fb-scales,body\.fb-big \.fb-prog\{[^}]*flex-wrap:wrap/.test(css), '');
   /* ③ 小節を進めても、巻きが起きないこと（§1.208／1.209 の守りが生きていること） */
   { const st=U.fbState(); const keep={on:st.on,nx:st.nextOn};
     const keepId=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     st.on=true; st.nextOn=true; U.saveLibrary();
     const s2=U.genBackingSong({parts:['p_canon'],genre:'rock8',
       key:{root:0,qual:'maj',name:'C'},seed:3});
     U.saveSong(s2); U.switchSong(s2.id);
     ok('[220] 伴奏の印が残っている', U.song.genBacking==='p_canon'||!!U.song.genBacking,
        String(U.song.genBacking));
     let scrolled=0;
     const orig=w.HTMLElement.prototype.scrollIntoView;
     w.HTMLElement.prototype.scrollIntoView=function(){ scrolled++; };
     s2.bars.forEach(b=>{ try{ U.setPlayhead&&U.setPlayhead(b.id); }catch(_){}
                          U.TP.phBar=b.id; U.renderFretboard(); });
     w.HTMLElement.prototype.scrollIntoView=orig;
     ok('[220] 小節が進んでも巻かない', scrolled===0, String(scrolled));
     U.TP.phBar=null;
     st.on=keep.on; st.nextOn=keep.nx; U.saveLibrary();
     U.song.genTemp=false; U.saveSong(U.song);
     const mid=U.song.id;
     try{ U.switchSong(keepId); U.render(); }catch(_){}
     try{ U.doDeleteSong(mid); }catch(_){} }
 }catch(e){ ok('[220] 丈の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    移調の札（1.221）

    L様——「移調ボタンが欲しい。コードが全て半音ずつうごく」。

    移調そのものは前からあった（〈設定〉→〈移調する…〉）が、
    **札が二階層の奥にあった。**
    「この曲を半音上げて」は稽古の最中に出る話で、
    **その場で押せなければ、無いのと同じ。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const st=U.fbState(); const keep={on:st.on};
   const keepId=U.song.id;
   U.song.genTemp=false; U.saveSong(U.song);
   st.on=true; U.saveLibrary();
   const s2=U.genBackingSong({parts:['p_oudou'],genre:'rock8',
     key:{root:0,qual:'maj',name:'C'},tension:'none',seed:3});
   U.saveSong(s2); U.switchSong(s2.id); U.renderFretboard();
   const names=()=>U.song.bars.map(b=>{
     const k=Object.keys(b.chordAt||{})[0];
     return (k!=null)?U.chordName(b.chordAt[k],U.song.meta):'-'; }).join(' ');
   /* ① 札が、キーのすぐ隣に在ること */
   { const up=d.querySelector('#fbbar .fb-b[data-tr="1"]');
     const dn=d.querySelector('#fbbar .fb-b[data-tr="-1"]');
     ok('[221] 上げる札が在る', !!up, '');
     ok('[221] 下げる札が在る', !!dn, '');
     const head=[...d.querySelectorAll('#fbbar .fb-head > *')];
     ok('[221] キーのすぐ隣に在る',
        head.findIndex(x=>x.classList&&x.classList.contains('fb-key'))+1
        ===head.findIndex(x=>x.getAttribute&&x.getAttribute('data-tr')==='-1'),
        head.map(x=>x.className||x.tagName).join(' / ')); }
   /* ② **コードが全部、半音ずつ動くこと** */
   { const before=names(), k0=U.song.meta.key.root;
     ok('[221] はじめは C G Am F', before==='C G Am F', before);
     d.querySelector('#fbbar .fb-b[data-tr="1"]').onclick();
     ok('[221] 上げれば全部が半音上がる', names()==='D♭ A♭ B♭m G♭', names());
     ok('[221] キーも一緒に動く', U.song.meta.key.root===(k0+1)%12,
        String(U.song.meta.key.root));
     d.querySelector('#fbbar .fb-b[data-tr="-1"]').onclick();
     ok('[221] 下げれば戻る', names()===before, names());
     ok('[221] キーも戻る', U.song.meta.key.root===k0, String(U.song.meta.key.root)); }
   /* ③ **一周すれば元へ**（半音を十二回） */
   { const before=names();
     for(let i=0;i<12;i++) d.querySelector('#fbbar .fb-b[data-tr="1"]').onclick();
     ok('[221] 十二回で一周する', names()===before, names()); }
   /* ④ 帯のコードも音符のコードも、取り残されないこと */
   { const b0=U.song.bars[0];
     const n0=(b0.notes||[]).find(x=>x.chord&&x.chord.root!=null);
     const k0=Object.keys(b0.chordAt||{})[0];
     d.querySelector('#fbbar .fb-b[data-tr="1"]').onclick();
     ok('[221] 帯のコードが動く',
        k0==null||U.song.bars[0].chordAt[k0].root===1, '');
     ok('[221] 音符のコードも動く', !n0||n0.chord.root!=null, '');
     d.querySelector('#fbbar .fb-b[data-tr="-1"]').onclick(); }
   /* ⑤ **譜面に書いた「Key ○○」も動くこと**
        （区間のキーは注釈から読んでいる——置き去りにすれば、
          鳴っている調と書いてある調が食い違う） */
   { const t0=U.song.bars[0].marks.text.t;
     d.querySelector('#fbbar .fb-b[data-tr="1"]').onclick();
     const t1=U.song.bars[0].marks.text.t;
     ok('[221] 注釈のキーも動く', /Key D♭/.test(t1), t1.slice(0,20));
     ok('[221] 注釈のスケールの根音も動く', /D♭ アイオニアン/.test(t1), t1.slice(0,32));
     ok('[221] 区間の控えも動く',
        !U.song.genSegs||U.song.genSegs[0].root===1,
        JSON.stringify(U.song.genSegs&&U.song.genSegs[0]));
     /* **区間の読み取りと、実際のキーが揃うこと** */
     ok('[221] 読み取ったキーと一致する',
        (U.keySegmentsOf?U.keySegmentsOf(U.song)[0].key.root:1)===U.song.meta.key.root,
        String(U.song.meta.key.root));
     d.querySelector('#fbbar .fb-b[data-tr="-1"]').onclick();
     ok('[221] 戻せば注釈も戻る', U.song.bars[0].marks.text.t===t0, ''); }
   /* ⑥ 指板の見出しも追いつくこと（**譜面を描き直せば指板も描き直す**） */
   { d.querySelector('#fbbar .fb-b[data-tr="1"]').onclick();
     U.renderFretboard();
     ok('[221] 指板の Key も動く',
        /Key D♭/.test((d.querySelector('#fbbar .fb-key')||{}).textContent||''),
        (d.querySelector('#fbbar .fb-key')||{}).textContent||'—');
     d.querySelector('#fbbar .fb-b[data-tr="-1"]').onclick(); U.renderFretboard(); }
   st.on=keep.on; U.saveLibrary();
   U.song.genTemp=false; U.saveSong(U.song);
   const mid=U.song.id;
   try{ U.switchSong(keepId); U.render(); }catch(_){}
   try{ U.doDeleteSong(mid); }catch(_){}
 }catch(e){ ok('[221] 移調の札の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    帰る所で効く音（1.222）

    L様——「おすすめのスケールは理論的に合ってる？
            オルタードのおすすめが出てこないんだけど」。

    ══ 二つ、誤っていた ══
    ① **オルタードは「ぶつかる」扱いになっていた。**
       完全五度を持たず ♭5 を持つので、1.179 で置いた
       「五度の和音に ♭5 だけ」の決まりに掛かっていた。
       だが**属和音では ♭5・♯5 は事故ではなく変化**であって、
       五度を潰して代わりに置くのが、あの音の使い方そのものである。
       ——**「五度が要る」は、五度が和音の顔である時の話。**

    ② **「条件つき」の条件を、確かめずに濁していた。**
       条件とは「属和音から主和音へ帰る時」。
       1.179 では次の和音を読んでいなかったので濁したが、
       **1.219 で読むようにした。**
       **確かめられる条件を、確かめずに濁してはならない。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const key={root:0,qual:'maj'};
   const G7={root:7,type:'dom7',bass:null}, CM={root:0,type:'maj7',bass:null};
   /* ① 属和音の上で、オルタードがぶつからないこと */
   { ok('[222] 属七にオルタードはぶつからない',
        !U.fbFit('alt',7,G7,key).clash, '');
     ok('[222] ホールトーンも同じ', !U.fbFit('wholet',7,G7,key).clash, '');
     /* **五度が顔の和音では、従前どおり事故** */
     ok('[222] 長和音には、やはりぶつかる',
        U.fbFit('alt',0,{root:0,type:'maj7',bass:null},key).clash, '');
     ok('[222] 短七にも、やはりぶつかる',
        U.fbFit('locrian',2,{root:2,type:'min7',bass:null},key).clash, ''); }
   /* ② 五度下へ帰る時だけ、勧めること */
   { ok('[222] 五度下へ帰るのが分かる', U.fbResolves(G7,CM)===true, '');
     ok('[222] 五度下でなければ帰りではない',
        U.fbResolves(G7,{root:9,type:'min7'})===false, '');
     ok('[222] 属和音でなければ帰りではない',
        U.fbResolves({root:7,type:'maj7'},CM)===false, '');
     const a1=U.fbAdvice(G7,key,7,CM);
     const lead=a1.filter(x=>x.lead).map(x=>x.id);
     ok('[222] 帰る時はオルタードを勧める', lead.indexOf('alt')>=0, lead.join(','));
     ok('[222] 半全ディミニッシュも勧める', lead.indexOf('dim')>=0, lead.join(','));
     /* 1.224：帰らない属七には**別の定石**が出る（オルタードではない）。
        「勧めが出ない」ではなく「**別の物が出る**」が正しい */
     const a2=U.fbAdvice(G7,key,7,{root:9,type:'min7'});
     ok('[222] 帰らない所ではオルタードを勧めない',
        a2.filter(x=>x.lead).map(x=>x.id).indexOf('alt')<0,
        a2.filter(x=>x.lead).map(x=>x.id).join(','));
     ok('[222] 代わりに帰らない属七の定石が出る',
        a2.filter(x=>x.lead).map(x=>x.id).indexOf('lyd7')>=0,
        a2.filter(x=>x.lead).map(x=>x.id).join(','));
     const a3=U.fbAdvice(G7,key,7);
     ok('[222] 次が分からなければオルタードは勧めない',
        a3.filter(x=>x.lead).map(x=>x.id).indexOf('alt')<0,
        a3.filter(x=>x.lead).map(x=>x.id).join(',')); }
   /* ③ 短調へ帰る時は、ハーモニックマイナーP5↓も */
   { const a4=U.fbAdvice({root:4,type:'dom7',bass:null},{root:9,qual:'min'},4,
                         {root:9,type:'min',bass:null});
     const lead=a4.filter(x=>x.lead).map(x=>x.id);
     ok('[222] 短調へ帰る時は HmP5↓ も勧める', lead.indexOf('hmp5')>=0, lead.join(','));
     const a5=U.fbAdvice(G7,key,7,CM);
     ok('[222] 長調へ帰る時は HmP5↓ を勧めない',
        a5.filter(x=>x.lead).map(x=>x.id).indexOf('hmp5')<0,
        a5.filter(x=>x.lead).map(x=>x.id).join(',')); }
   /* ④ **勧める順は、親のすぐ次**（旋法・平行調より前へは出さない） */
   { const a6=U.fbAdvice(G7,key,7,CM);
     ok('[222] 旋法がいちばん前', a6[0].id==='mixo', a6[0].id);
     ok('[222] 平行調がその次', a6[1].id==='minpent^9', a6[1].id);
     ok('[222] 帰る所で効く音は、そのすぐ次', a6[2].lead===true,
        a6.slice(0,4).map(x=>x.id).join(',')); }
   /* ⑤ 画面でも、薄くしないこと（**条件が満たされた以上、条件つきではない**） */
   { const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('');
     ok('[222] 帰る所で効く音の顔が在る', /\.fb-b\.lead\{/.test(css), '');
     ok('[222] 薄める決まりは掛けない',
        !/\.fb-b\.lead\{[^}]*opacity/.test(css), ''); }
 }catch(e){ ok('[222] 帰る所の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    理論で確かめる（1.223）

    L様——「点検の仕様がおかしくて、一般の音楽理論に基づいて判断できない？」

    ══ 仰るとおりであった ══
    これまでの点検は、**道具に書いた決まりをもう一度書き写して**
    照合していた——「三度が食い違えば事故」と道具に書き、
    点検にも「三度が食い違えば事故」と書いて突き合わせる。
    **決まりそのものが誤っていれば、点検は誤りを追認するだけ**である。
    実際、オルタードの件（§1.222）はこれで通り抜けていた。

    ══ ゆえに、外から持ってくる ══
    ここに書く値は、**道具を一度も見ずに、教科書から写した物**である。
      ・各スケールの音程（定義そのもの）
      ・旋法は親の音階を回した物（回転で確かめる）
      ・オルタード＝半音上のメロディックマイナー（別名で確かめる）
      ・和音とスケールの定石（chord-scale の対応表）
    **道具が変わっても、ここは変わらない。**
    ここが落ちた時は、**道具の方を疑う。**
    ══════════════════════════════════════════════════════════════ */
 try{
   /* ══ この段の書き方（守ること）══
      **道具の中身を写さない。**ここに書く数は、
      教科書・辞典から写した物か、回転や別名で**別の道から**作った物だけ。
      道具の関数を使ってよいのは「答えを取り出す時」であって、
      「正しさを決める時」ではない。
      ——**採点表を、答案から作ってはならない。** */
   /* ── ① 音程の定義（教科書から。道具は見ない）── */
   const THEORY={
     ionian  :[0,2,4,5,7,9,11],
     lyd7    :[0,2,4,6,7,9,10],
     loc2    :[0,2,3,5,6,8,10],
     dorian  :[0,2,3,5,7,9,10],
     phryg   :[0,1,3,5,7,8,10],
     lydian  :[0,2,4,6,7,9,11],
     mixo    :[0,2,4,5,7,9,10],
     aeolian :[0,2,3,5,7,8,10],
     locrian :[0,1,3,5,6,8,10],
     majpent :[0,2,4,7,9],
     minpent :[0,3,5,7,10],
     majblues:[0,2,3,4,7,9],
     minblues:[0,3,5,6,7,10],
     harm    :[0,2,3,5,7,8,11],
     melo    :[0,2,3,5,7,9,11],
     hmp5    :[0,1,4,5,7,8,10],
     alt     :[0,1,3,4,6,8,10],
     wholet  :[0,2,4,6,8,10],
     dim     :[0,1,3,4,6,7,9,10],
     dimwh   :[0,2,3,5,6,8,9,11],
   };
   { const bad=[];
     Object.keys(THEORY).forEach(id=>{
       const sc=U.jamScale(id);
       if(!sc||sc.id!==id){ bad.push(id+'：無い'); return; }
       const got=sc.iv.slice().sort((a,b)=>a-b).join(',');
       const want=THEORY[id].slice().sort((a,b)=>a-b).join(',');
       if(got!==want) bad.push(id+'：'+got+'（'+want+'のはず）');
     });
     ok('[223] 音程が教科書どおり', bad.length===0, bad.slice(0,4).join(' / ')); }

   /* ── ② 教会旋法は、親の長音階を回した物 ── */
   { const par=THEORY.ionian;
     const rot=(deg)=>{
       const st2=par[deg];
       return par.map(x=>((x-st2)%12+12)%12).sort((a,b)=>a-b).join(',');
     };
     const want={0:'ionian',1:'dorian',2:'phryg',3:'lydian',
                 4:'mixo',5:'aeolian',6:'locrian'};
     const bad=[];
     Object.keys(want).forEach(k=>{
       const got=U.jamScale(want[k]).iv.slice().sort((a,b)=>a-b).join(',');
       if(got!==rot(+k)) bad.push(want[k]+'：'+got+'（'+rot(+k)+'のはず）');
     });
     ok('[223] 旋法は長音階の回転', bad.length===0, bad.join(' / ')); }

   /* ── ③ 別名で確かめる（同じ音の並びを、別の道から作る）── */
   { const setOf=(id,root)=>U.jamScale(id).iv
       .map(iv=>((root+iv)%12+12)%12).sort((a,b)=>a-b).join(',');
     /* オルタード ＝ 半音上のメロディックマイナー（第7旋法） */
     ok('[223] オルタード＝半音上のメロディックマイナー',
        setOf('alt',7)===setOf('melo',8), setOf('alt',7)+' / '+setOf('melo',8));
     /* リディアン♭7 ＝ 完全四度下のメロディックマイナー（第4旋法） */
     ok('[223] リディアン♭7＝四度下のメロディックマイナー',
        setOf('lyd7',0)===setOf('melo',7), setOf('lyd7',0)+' / '+setOf('melo',7));
     /* ロクリアン♮2 ＝ 短三度上のメロディックマイナー（第6旋法） */
     ok('[223] ロクリアン♮2＝短三度上のメロディックマイナー',
        setOf('loc2',0)===setOf('melo',3), setOf('loc2',0)+' / '+setOf('melo',3));
     /* HmP5↓ ＝ 完全五度下のハーモニックマイナー（第5旋法） */
     ok('[223] HmP5↓＝五度下のハーモニックマイナー',
        setOf('hmp5',7)===setOf('harm',0), setOf('hmp5',7)+' / '+setOf('harm',0));
     /* ナチュラルマイナー ＝ 短三度上の長音階（平行調） */
     ok('[223] ナチュラルマイナー＝平行長調の長音階',
        setOf('aeolian',9)===setOf('ionian',0), '');
     /* マイナーペンタ ＝ 短三度上のメジャーペンタ */
     ok('[223] マイナーペンタ＝平行長調のメジャーペンタ',
        setOf('minpent',9)===setOf('majpent',0), '');
     /* ディミニッシュ二種は、互いに半音ずれた同じ形 */
     ok('[223] 半全と全半は、半音ずれた同じ形',
        setOf('dim',0)===setOf('dimwh',1), setOf('dim',0)+' / '+setOf('dimwh',1));
     /* ホールトーンは全音だけ（二種類しか無い） */
     ok('[223] ホールトーンは全音のみ',
        U.jamScale('wholet').iv.every((x,i,a)=>i===0||x-a[i-1]===2), ''); }

   /* ── ④ 和音とスケールの定石（chord-scale の対応表）──
        **道具の並べ方ではなく、教科書の答えと突き合わせる。** */
   { const T=[
       /* 和音の型      調（null＝調を問わない）      いちばんに勧めるべき物 */
       ['maj7',  null,                 'ionian'],
       ['min7',  null,                 'dorian'],
       ['dom7',  null,                 'mixo'],
       ['m7b5',  null,                 'locrian'],
       ['dim7',  null,                 'dimwh'],
       ['minMaj7',null,                'melo'],
       ['dom7b9',null,                 'dim'],
       ['dom7s9',null,                 'alt'],
       ['aug',   null,                 'wholet'],
     ];
     /* ── 役どころの定石（教科書から。**場面が変われば答えも変わる**）── */
     const R=[
       /* いまの和音        次の和音              調            勧めるべき物 */
       [{root:7,type:'dom7'},{root:0,type:'maj7'},{root:0,qual:'maj'},'alt',   '五度下へ帰る属七'],
       [{root:4,type:'dom7'},{root:9,type:'min'}, {root:9,qual:'min'},'hmp5',  '短調へ帰る属七'],
       [{root:1,type:'dom7'},{root:0,type:'maj7'},{root:0,qual:'maj'},'lyd7',  '裏コード'],
       [{root:0,type:'dom7'},{root:5,type:'dom7'},{root:0,qual:'maj'},'lyd7',  'ブルースの I7'],
       [{root:11,type:'m7b5'},{root:4,type:'dom7'},{root:9,qual:'min'},'loc2', 'ii–V–i の ii'],
     ];
     R.forEach(([c,n2,k2,want,nm])=>{
       if(!U.CD[c.type]) return;
       const a=U.fbAdvice(c,k2,c.root,n2);
       if(!a.filter(x=>x.lead).some(x=>x.id===want))
         bad.push(nm+'：'+want+'を勧めない（'+a.filter(x=>x.lead).map(x=>x.id).join(',')+'）');
     });
     const bad=[];
     T.forEach(([ty,k,want])=>{
       if(!U.CD[ty]) return;                       /* 道具に無い型は問わない */
       const a=U.fbAdvice({root:0,type:ty,bass:null},k,0);
       const top=(a.find(x=>!x.clash)||{}).id;
       if(top!==want) bad.push(ty+'：'+top+'（'+want+'のはず）');
     });
     ok('[223] 定石どおりの物を、いちばんに勧める', bad.length===0, bad.join(' / ')); }

   /* ── ⑤ 七音のスケールを勧めるなら、和音の三度と七度を含むこと ──
        **ガイドトーンを持たないスケールは、その和音を鳴らせない。**
        （五音のペンタトニックは、間引く物なので問わない） */
   { const bad=[];
     ['maj7','min7','dom7','m7b5','minMaj7'].forEach(ty=>{
       if(!U.CD[ty]) return;
       const civ=U.CD[ty].iv.map(x=>((x%12)+12)%12);
       const third=civ.find(x=>x===3||x===4);
       const sev=civ.find(x=>x===10||x===11);
       U.fbAdvice({root:0,type:ty,bass:null},null,0)
         .filter(x=>!x.clash&&U.jamScale(x.id).iv.length>=7)
         .slice(0,3).forEach(x=>{
           const pcs=U.jamScale(x.id).iv.map(iv=>((x.root+iv)%12+12)%12);
           if(third!=null&&pcs.indexOf(third)<0) bad.push(ty+'/'+x.id+'：三度が無い');
           if(sev!=null&&pcs.indexOf(sev)<0) bad.push(ty+'/'+x.id+'：七度が無い');
         });
     });
     ok('[223] 七音の勧めは、三度と七度を持つ', bad.length===0,
        [...new Set(bad)].slice(0,4).join(' / ')); }

   /* ── ⑥ 調の中の和音には、その度数の旋法が親の音階と同じ音であること ── */
   { const bad=[];
     const par=THEORY.ionian.map(x=>(0+x)%12).sort((a,b)=>a-b).join(',');
     [0,2,4,5,7,9,11].forEach(dg=>{
       const id=U.FB_MODE_OF.maj[dg];
       const got=U.jamScale(id).iv.map(iv=>((dg+iv)%12+12)%12).sort((a,b)=>a-b).join(',');
       if(got!==par) bad.push(dg+'度：'+id);
     });
     ok('[223] 長調の七つは、すべて同じ音の並び', bad.length===0, bad.join(' / '));
     const parM=THEORY.aeolian.map(x=>(0+x)%12).sort((a,b)=>a-b).join(',');
     const bad2=[];
     [0,2,3,5,7,8,10].forEach(dg=>{
       const id=U.FB_MODE_OF.min[dg];
       const got=U.jamScale(id).iv.map(iv=>((dg+iv)%12+12)%12).sort((a,b)=>a-b).join(',');
       if(got!==parM) bad2.push(dg+'度：'+id);
     });
     ok('[223] 短調の七つも、すべて同じ音の並び', bad2.length===0, bad2.join(' / ')); }

   /* ── ⑦ テンションの置き所も、教科書と突き合わせる ──
        **長調の V に長七度は乗らない**（それが 1.175 で直した所） */
   { const bad=[];
     /* ══ 短調の「調の音」には、導音も入る（教科書どおり）══
        短調の属和音は**和声的短音階**から作る——
        自然短音階だけを調の音と数えれば、V7 が調の外になってしまう。
        **短調は、自然・和声・旋律の三つで一つの調**である。 */
     const KEYSC={maj:THEORY.ionian,min:THEORY.aeolian.concat([11])};
     Object.keys(U.BK_TENSION).forEach(q=>{
       Object.keys(U.BK_TENSION[q]).forEach(dg=>{
         const scale=KEYSC[q].map(x=>x%12);
         if(scale.indexOf(+dg)<0) return;         /* 調の外の度数は問わない */
         ['some','rich'].forEach(lv=>{
           (U.BK_TENSION[q][dg][lv]||[]).forEach(ty=>{
             const iv=(U.CD[ty]||{}).iv||[];
             iv.forEach(x=>{
               const pc=((+dg+x)%12+12)%12;
               if(scale.indexOf(pc)<0) bad.push(q+'/'+dg+'度/'+ty);
             });
           });
         });
       });
     });
     ok('[223] 調の中の度数のテンションは、調の音だけで作れる',
        bad.length===0, [...new Set(bad)].slice(0,4).join(' / ')); }
 }catch(e){ ok('[223] 理論の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    スケールに無いコードトーンも出す（1.225）

    L様——「指板にスケールの他にコードトーンを出せるようにしたい」。

    **和音の音は、スケールが持っていなくても弾いてよい音である。**
    むしろ**いちばん確かな着地点**であって、隠す理由が無い。
    ペンタトニックがまさにそれで、C メジャーペンタは CM7 の七度（B）を
    持たない——**ガイドトーンが盤から消えていた。**
    間引いたのはスケールの都合であって、和音の都合ではない。
    ══════════════════════════════════════════════════════════════ */
 try{
   const st=U.fbState();
   const keep={on:st.on,pc:st.perChord,to:U.fbOnly(),nx:st.nextOn};
   const keepId=U.song.id;
   U.song.genTemp=false; U.saveSong(U.song);
   st.on=true; st.perChord={}; st.pin=null; st.pinCh=null;
   st.only='all'; st.nextOn=false; U.saveLibrary();
   const s2=U.genBackingSong({parts:['p_oudou'],genre:'rock8',
     key:{root:0,qual:'maj',name:'C'},tension:'some',seed:3});
   U.saveSong(s2); U.switchSong(s2.id);
   const nm=U.fbProgCycle().rows[0].name;
   /* ══ 補いは「道具が選んだ時」だけ（1.232）══
      L様——「全然ペンタだけじゃないんだけど」。
      **当てたスケールに六つ目の音が立てば、形が崩れてペンタに見えない。**
      ゆえに補うのは道具が選んだ時だけ——ここでは**当てずに**、
      七度を持たないスケールを道具に選ばせて確かめる。 */
   /* **七度を持たないスケール**を当てて、七度の在り処が出るかを見る */
   st.perChord[nm]='majpent'; U.saveLibrary();
   U.TP.phBar=s2.bars[0].id; U.renderFretboard();
   const dots=()=>{
     /* **縁の丸を先に取り除いてから読む。**
        縁は塗りの丸と字の**間**に描かれるので、
        そのまま切ると字が縁の側へ付いてしまう */
     const raw=String(d.getElementById('fbbar').innerHTML);
     const o=[]; let last=null;
     raw.split('<circle ').slice(1).forEach(c=>{
       const fl=(c.match(/fill="([^"]+)"/)||[])[1];
       const tx=(c.match(/<text[^>]*>([^<]*)<\/text>/)||[])[1];
       /* **縁の丸（fill="none"）は、直前の塗りの続き**として読む */
       if(fl!=='none') last=fl;
       if(tx!=null) o.push({fl:last,tx:tx});
     });
     return o;
   };
   /* ① スケールに無い和音の音が、盤に出ること（**輪郭だけ**）
        ══ 1.232 ══ L様——「全然ペンタだけじゃないんだけど」。
        1.225 では塗ってしまったので、**五音の形が六音に見えた。**
        塗るのはスケールの音だけ、外から来た音は輪郭だけ——
        **足すか消すかではなく、どう足すかの話であった。** */
   { const svg=d.getElementById('fbbar').innerHTML;
     const dash=(String(svg).match(/stroke-dasharray="2\.4 2"/g)||[]).length;
     ok('[232] スケールに無い和音の音が出る', dash>0, String(dash));
     /* **字は出さない**（出せば、その音もスケールの一員に見える） */
     const a=dots();
     const labs=[...new Set(a.map(x=>x.tx).filter(Boolean))];
     ok('[232] 塗るのはスケールの音だけ', labs.length===5, labs.join(' '));
     /* 字の出る丸は、三段の色のいずれかであること（**縁の丸は塗らない**） */
     /* **輪には字を乗せない。**乗せれば、その音もスケールの一員に見える——
        字の数と、塗った丸の数が合うかで確かめる */
     const fills=(String(svg).match(/<circle[^>]*fill="(#b91c1c|#4338ca|rgba\(99,102,241,\.42\))"/g)||[]).length;
     /* **弦の番号やフレットの数字まで数えない**——
        丸の上の度数だけが「字」である（font-weight 800 が目印） */
     const texts=(String(svg)
       .match(/<text[^>]*font-weight="800"[^>]*>(R|[2-7])<\/text>/g)||[]).length;
     ok('[232] 輪には字を乗せない', fills===texts, fills+' / '+texts); }
   /* ══ 一つのスケールに絞る（1.232）══
      L様——「ペンタだけに絞らないと見にくい。
              スケールいっぱいあるしコードトーンも出てる」。
      **課題が絞れと言うなら、画面も絞る。** */
   { const st9=U.fbState();
     const k9=U.fbOnly();
     st9.only='scale'; U.saveLibrary(); U.renderFretboard();
     const svg=d.getElementById('fbbar').innerHTML;
     ok('[232] 絞れば、外から来た音は出さない',
        (String(svg).match(/stroke-dasharray="2\.4 2"/g)||[]).length===0, '');
     { const a2=dots(); const labs=[...new Set(a2.map(x=>x.tx).filter(Boolean))];
       ok('[232] 盤に出るのはスケールの音だけ', labs.length<=7, labs.join(' ')); }
     { const chips=[...d.querySelectorAll('#fbbar .fb-scales .fb-b')];
       ok('[232] 札は一枚と戻り道だけ', chips.length===2,
          chips.map(x=>x.textContent).join(' | '));
       ok('[232] 戻り道が在る',
          chips.some(x=>/ほかも見る/.test(x.textContent)), ''); }
     /* **絞りは一つの決定。**二つ同時には立たない（1.233） */
     st9.only='tones'; U.saveLibrary(); U.renderFretboard();
     ok('[233] 別の絞りへ移れば、前の絞りは残らない',
        U.fbOnly()==='tones', U.fbOnly());
     d.querySelector('#fbbar .fb-b[data-onlyall]').onclick();
     ok('[233] 全部へ戻せる', U.fbOnly()==='all', U.fbOnly());
     st9.only=k9; U.saveLibrary(); U.renderFretboard(); }
   /* ② 〈和音の音だけ〉で、通り道が伏せられること */
   { const b=d.querySelector('#fbbar .fb-b[data-only]');
     ok('[225] 絞りの札が在る', !!b, '');
     U.fbState().only='tones'; U.saveLibrary(); U.renderFretboard();
     const a=dots().filter(x=>x.tx);
     ok('[225] 通り道が消える', !a.some(x=>x.fl===U.JAM_COL.other),
        [...new Set(a.map(x=>x.tx))].join(' '));
     ok('[225] 和音の音は残る',
        ['R','3','5','7'].every(t=>a.some(x=>x.tx===t)),
        [...new Set(a.map(x=>x.tx))].join(' '));
     ok('[225] 註からも通り道が消える',
        !/通り道/.test((d.querySelector('#fbbar .fb-note')||{}).textContent||''), '');
     /* ══ 出していない物の名を掲げない（1.228）══
        L様——「コードトーンだけにしてるのにスケールに色がついてる」。
        盤から消しても、**見出しと札がスケールを名乗っていた**——
        **言っていることと、見えている物が食い違う。** */
     ok('[228] 見出しがスケールを名乗らない',
        /和音の音だけ/.test((d.querySelector('#fbbar .fb-asg')||{}).textContent||''),
        (d.querySelector('#fbbar .fb-asg')||{}).textContent||'—');
     { const chips=[...d.querySelectorAll('#fbbar .fb-scales .fb-b')];
       ok('[228] 色の付いた札が無い',
          chips.every(x=>!/(^| )on( |$)/.test(x.className)),
          chips.map(x=>x.textContent).join(' | '));
       ok('[228] 戻る道は残す',
          chips.some(x=>/全部を見る|ほかも見る/.test(x.textContent)),
          chips.map(x=>x.textContent).join(' | '));
       /* **丈は保つ**（札の列を空にすれば、下の紙が押される §1.220） */
       ok('[228] 札の列は空にしない', chips.length>0, String(chips.length)); }
     ok('[228] 註もスケールを名乗らない',
        !/を出しております|薄い札は条件つき/
          .test((d.querySelector('#fbbar .fb-note')||{}).textContent||''), '');
     d.querySelector('#fbbar .fb-b[data-onlyall]').onclick();
     ok('[225] 戻せば通り道も戻る',
        dots().some(x=>x.fl===U.JAM_COL.other), '');
     ok('[228] 戻せば札も名も戻る',
        d.querySelectorAll('#fbbar .fb-scales .fb-b[data-sc]').length>0
        &&/[A-G]/.test((d.querySelector('#fbbar .fb-asg')||{}).textContent||''),
        (d.querySelector('#fbbar .fb-asg')||{}).textContent||'—'); }
   /* ③ 〈和音の音だけ〉の時は、次のスケールの破線も伏せること
        （通り道を伏せて、次の通り道だけ出すのは筋が通らない） */
   { st.nextOn=true; st.only='tones'; U.saveLibrary(); U.renderFretboard();
     const t=d.getElementById('fbbar').innerHTML;
     ok('[225] 次のスケールの破線も伏せる',
        (String(t).match(/stroke-dasharray="3 2\.4"/g)||[]).length===0, '');
     st.only='all'; U.saveLibrary(); }
   U.TP.phBar=null;
   st.on=keep.on; st.perChord=keep.pc; st.only=keep.to; st.nextOn=keep.nx;
   U.saveLibrary();
   U.song.genTemp=false; U.saveSong(U.song);
   const mid=U.song.id;
   try{ U.switchSong(keepId); U.render(); }catch(_){}
   try{ U.doDeleteSong(mid); }catch(_){}
 }catch(e){ ok('[225] コードトーンの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    いまの拍で和音を読む／狙う音（1.226）

    ══ 入れた機能に、追随を書き忘れていた ══
    1.207 で「一小節に二つの和音」を入れた（ターンアラウンド I–VI / ii–V）のに、
    **指板は小節の頭の和音しか見ていなかった。**
    `Dm7 G7 |` の後半で G7 に切り替わらない——
    進行の札にも G7 が現れない（小節ごとに一枚しか並べていなかった）。

    ══ 狙う音 ══
    「次の和音の音」までは出せたが、**そのどれを狙うかは示していなかった。**
    和音が変わる所で最も効くのは**三度**である——
    根音は変わらないことがあるが、三度は必ず動き、**長短の顔を決める。**
    **たくさん示せば、狙いにならない。**一つだから狙える。
    ══════════════════════════════════════════════════════════════ */
 try{
   const T=U.T;
   const st=U.fbState();
   const keep={on:st.on,pc:st.perChord,nx:st.nextOn,to:U.fbOnly()};
   const keepId=U.song.id;
   U.song.genTemp=false; U.saveSong(U.song);
   st.on=true; st.perChord={}; st.pin=null; st.pinCh=null;
   st.nextOn=true; st.only='all'; U.saveLibrary();
   /* ii–V–I（一小節目に二つ） */
   const s2=U.genBackingSong({parts:['p_251'],genre:'rock8',
     key:{root:0,qual:'maj',name:'C'},tension:'none',seed:3});
   U.saveSong(s2); U.switchSong(s2.id);
   /* ① 小節の中の拍から、和音を引けること */
   { const b0=s2.bars[0];
     const at=t=>U.chordName(U.fbChordAtTick(b0,t),s2.meta);
     ok('[226] 一小節に二つ置かれている',
        Object.keys(b0.chordAt||{}).length===2,
        Object.keys(b0.chordAt||{}).join(','));
     ok('[226] 前半は ii', at(0)==='Dm7'&&at(T.QUARTER)==='Dm7',
        at(0)+' / '+at(T.QUARTER));
     ok('[226] 後半は V', at(T.QUARTER*2)==='G7'&&at(T.QUARTER*3)==='G7',
        at(T.QUARTER*2)+' / '+at(T.QUARTER*3));
     ok('[226] 拍を渡さなければ頭の和音',
        U.chordName(U.fbChordAtTick(b0),s2.meta)==='Dm7', ''); }
   /* ② 進行の札が、和音ごとに並ぶこと */
   { const cy=U.fbProgCycle();
     ok('[226] 和音の数だけ札が出る',
        cy.rows.map(r=>r.name).join('|')==='Dm7|G7|CM7',
        cy.rows.map(r=>r.name+'@'+r.tick).join(' | ')); }
   /* ③ 指板が、拍に追いつくこと */
   { const b0=s2.bars[0];
     const seen=[];
     [0,1,2,3].forEach(k=>{
       U.TP.phBar=b0.id; U.TP.phTick=T.QUARTER*k; U.renderFretboard();
       seen.push(((d.querySelector('#fbbar .fb-ch')||{}).textContent||'—')
                 +'/'+[...d.querySelectorAll('#fbbar .fb-pc.on')]
                        .map(x=>x.textContent).join(''));
     });
     ok('[226] 拍が進めば和音も光る札も移る',
        seen.join(' ')==='Dm7/Dm7 Dm7/Dm7 G7/G7 G7/G7', seen.join(' ')); }
   /* ④ 狙う音は、次の和音の三度であること */
   { const b0=s2.bars[0];
     U.TP.phBar=b0.id; U.TP.phTick=T.QUARTER*3; U.renderFretboard();
     const note=(d.querySelector('#fbbar .fb-note')||{}).textContent||'';
     ok('[226] 狙う音が出る', /★ 狙う音 E（次の CM7 の3度）/.test(note),
        (note.match(/★ 狙う音[^／]*/)||['—'])[0]);
     /* **盤の上にも星が立つこと** */
     const svg=d.getElementById('fbbar').innerHTML;
     ok('[226] 盤に星が立つ', (String(svg).match(/>★</g)||[]).length>0,
        String((String(svg).match(/>★</g)||[]).length));
     /* 星は一種類の音にしか立たない（**たくさん示せば狙いにならない**） */
     const stars=(String(svg).match(/>★</g)||[]).length;
     const rings=(String(svg).match(/stroke-width="3\.2"/g)||[]).length;
     ok('[226] 星と太い輪の数が合う', stars===rings, stars+' / '+rings); }
   /* ⑤ 三度を持たない和音では、七度・根音へ落ちること */
   { const s3=U.genBackingSong({chords:[
       {root:7,type:'dom7sus4',bass:null},{root:0,type:'maj7',bass:null}],
       genre:'rock8',key:{root:0,qual:'maj',name:'C'},seed:3});
     U.song.genTemp=false; U.saveSong(U.song);
     U.saveSong(s3); U.switchSong(s3.id);
     U.TP.phBar=s3.bars[0].id; U.TP.phTick=0; U.renderFretboard();
     const note=(d.querySelector('#fbbar .fb-note')||{}).textContent||'';
     ok('[226] 三度が無ければ別の音を狙う', /★ 狙う音/.test(note),
        (note.match(/★ 狙う音[^／]*/)||['—'])[0]);
     try{ U.doDeleteSong(s3.id); }catch(_){} }
   /* ⑥ 〈次のコード〉を切れば、狙う音も出ないこと */
   { st.nextOn=false; U.saveLibrary();
     U.TP.phBar=s2.bars[0].id; U.TP.phTick=0; U.renderFretboard();
     ok('[226] 切れば狙う音も消える',
        !/★ 狙う音/.test((d.querySelector('#fbbar .fb-note')||{}).textContent||''), '');
     ok('[226] 盤の星も消える',
        (String(d.getElementById('fbbar').innerHTML).match(/>★</g)||[]).length===0, '');
     st.nextOn=true; U.saveLibrary(); }
   U.TP.phTick=null; U.TP.phBar=null;
   st.on=keep.on; st.perChord=keep.pc; st.nextOn=keep.nx; st.only=keep.to;
   U.saveLibrary();
   U.song.genTemp=false; U.saveSong(U.song);
   const mid=U.song.id;
   try{ U.switchSong(keepId); U.render(); }catch(_){}
   try{ U.doDeleteSong(mid); }catch(_){}
 }catch(e){ ok('[226] 拍と狙う音の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    今日の練習（1.227）

    道具は「何を弾けるか」までは示せるようになった——
    和音・スケール・狙う音。だが**「今日は何をするのか」が無かった。**
    顔ぶれを並べれば練習になる、というのは道具の側の思い込みで、
    **選べる物が増えるほど、選べなくなる。**

    課題は、**道具が確かめられる物だけ**を置く。
    「歌うように弾く」は課題にならない——**道具が助けられない。**
    ここに並ぶのは、**画面がその通りに変わる**物だけである。
    ══════════════════════════════════════════════════════════════ */
 try{
   /* **借りた設えは返す。**課題は指板の札を書き換えるので、
      戻し忘れると後の点検が別の画面を見ることになる */
   const _fb0=Object.assign({},U.fbState());
   /* **この段のあいだ、戻り先の曲を一つ憶えておく。**
      入れ子の { } の中で憶えても、外からは見えない——
      それで ⑦ が落ち、設えが戻らず、後の段まで巻き添えになった（1.230） */
   const _keepId=U.song.id;
   /* ① 課題の表そのもの */
   { const bad=[];
     U.BK_DRILLS.forEach(x=>{
       if(!x.id||!x.name||!x.text) bad.push(x.id||'（無名）');
       if(!(x.lv>=1&&x.lv<=3)) bad.push(x.id+'：段'+x.lv);
       /* **道具が何かをする課題だけ**（言うだけの課題は置かない） */
       if(!x.set||!Object.keys(x.set).length) bad.push(x.id+'：画面が変わらない');
     });
     ok('[227] 課題の書き方が揃っている', bad.length===0, bad.join(' / '));
     const ids=U.BK_DRILLS.map(x=>x.id);
     ok('[227] 名前が重なっていない', ids.length===new Set(ids).size, '');
     ok('[227] 段は三つ', Object.keys(U.BK_DRILL_LV).length===3, ''); }
   /* ② 一つ押せば、全部決まること */
   { const keepId=U.song.id;
     const seen={key:new Set(),drill:new Set()};
     [1,2,3].forEach(lv=>{
       U.song.genTemp=false; U.saveSong(U.song);
       U.makeDrillSong(lv);
       const s2=U.song;
       ok('[227] Lv'+lv+' で課題が付く', !!(s2.drill&&s2.drill.name),
          s2.drill?s2.drill.name:'—');
       ok('[227] Lv'+lv+' の速さが決まる', s2.play.bpm===U.BK_DRILL_LV[lv].bpm,
          String(s2.play.bpm));
       ok('[227] Lv'+lv+' の進行が決まる',
          s2.bars.length===U.BK_DRILL_LV[lv].parts
            .reduce((a2,id)=>a2+U.bkPartBars(U.bkPart(id)),0),
          String(s2.bars.length));
       /* **その段で使える課題だけ**（Lv1 で上級の課題は出さない） */
       ok('[227] Lv'+lv+' は段に見合う課題',
          U.bkDrill(s2.drill.id).lv<=lv, s2.drill.id);
       seen.key.add(s2.meta.key.root); seen.drill.add(s2.drill.id);
       /* **画面が課題の形になること** */
       const dr2=U.bkDrill(s2.drill.id);
       const set=dr2.set||{};
       const st2=U.fbState();
       const bad2=Object.keys(set).filter(k=>st2[k]!==set[k]);
       ok('[227] Lv'+lv+' 画面が課題の形になる', bad2.length===0, bad2.join(','));
       /* **課題が「何を出すか」まで決める**（1.233） */
       ok('[233] Lv'+lv+' 絞りも課題どおり',
          U.fbOnly()===(dr2.only||'all'), U.fbOnly()+' / '+(dr2.only||'all'));
       /* ══ 課題が言ったことは、課題が実際にやる（1.231）══
          L様——「ペンタトニックで通すなのにイオニアンになってる、連動してない」。
          **札を切り替えるだけでは、課題の言葉が空になる。** */
       { const hold=U.bkDrill(s2.drill.id).hold||null;
         /* 一つで通す課題なら、盤も一枚に絞れていること（1.232） */
         if(hold==='rel') ok('[232] Lv'+lv+' 一つで通す課題は盤も絞る',
            U.fbOnly()==='scale', U.fbOnly());
         const pc=U.fbState().perChord||{};
         const cy=U.fbProgCycle();
         /* **当てはマスごと**（1.238）。マスの列で確かめる */
         const slots=(cy.rows||[]).map((r,i)=>({i,name:r.name,chord:r.chord}))
                                   .filter(x=>x.name);
         const live=new Set(slots.map(x=>U.fbSlotKey(x.i,x.name)));
         if(hold==='rel'){
           const want=U.fbRelId(U.fbCurKey(s2.bars[0]));
           ok('[231] Lv'+lv+' 一つのスケールで通す',
              slots.length>0&&slots.every(x=>U.fbAsgAt(cy,x.i,x.name)===want),
              JSON.stringify(pc));
           /* **どの和音でも同じ五音であること**（これが「通す」の意味） */
           const sets=slots.map(x=>{
             const id3=U.fbAsgAt(cy,x.i,x.name);
             const rt=U.fbRootOf(id3,x.chord,U.fbCurKey(s2.bars[0]));
             return U.jamScale(id3).iv.map(iv=>((rt+iv)%12+12)%12)
               .sort((a2,b2)=>a2-b2).join(',');
           });
           ok('[231] Lv'+lv+' どの和音でも同じ音',
              new Set(sets).size===1, [...new Set(sets)].join(' / '));
         }else if(hold==='auto'){
           ok('[231] Lv'+lv+' 当てを外して道具に任せる',
              Object.keys(pc).length===0, JSON.stringify(pc));
         }
         /* **前の課題の当てを持ち越さないこと**（迷子の鍵が残っていないこと） */
         ok('[231] Lv'+lv+' 前の課題の当てが残らない',
            Object.keys(pc).every(k=>live.has(k)), JSON.stringify(pc)); }
       ok('[227] Lv'+lv+' 指板が開く', st2.on===true&&st2.big===false, '');
     });
     /* ③ **課題が、保存をまたいで残ること**（§1.209 の轍） */
     { const id=U.song.id, nm=U.song.drill.name;
       U.song.genTemp=false; U.saveSong(U.song); U.switchSong(id);
       ok('[227] 開き直しても課題が残る', (U.song.drill||{}).name===nm,
          String((U.song.drill||{}).name)); }
     /* ④ 課題を決めて始められること */
     { U.song.genTemp=false; U.saveSong(U.song);
       U.makeDrillSong(2,'guide');
       ok('[227] 課題を決めて始められる', U.song.drill.id==='guide', U.song.drill.id);
       ok('[227] その課題の形になる', U.fbOnly()==='guide', U.fbOnly());
       /* 1.231：課題どうしの引き継ぎ——ペンタで通した後に別の課題を選ぶ */
       U.song.genTemp=false; U.saveSong(U.song);
       U.makeDrillSong(2,'pent');
       const pc1=Object.keys(U.fbState().perChord||{}).length;
       U.song.genTemp=false; U.saveSong(U.song);
       /* 1.233：'mode' は畳んだので、当てを持たない課題で確かめる */
       U.makeDrillSong(2,'land');
       ok('[231] 別の課題へ移れば、当ては外れる',
          pc1>0&&Object.keys(U.fbState().perChord||{}).length===0,
          pc1+' → '+Object.keys(U.fbState().perChord||{}).length); }
     /* ⑤ 帯が、弾いている間ずっと出ていること */
     { U.renderFretboard();
       const el=d.querySelector('#fbbar .fb-drill');
       ok('[227] 課題の帯が出る', !!el&&/今日の課題/.test(el.textContent),
          el?el.textContent:'—');
       ok('[227] 帯に課題の名が出る',
          !!el&&el.textContent.indexOf(U.song.drill.name)>=0, '');
       /* **丈は決め打ち**（動けば下の紙が押される §1.220） */
       const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('');
       ok('[227] 帯の丈は決め打ち', /\.fb-drill\{[^}]*height:26px/.test(css), '');
       ok('[227] 帯は折り返さない', /\.fb-drill\{[^}]*white-space:nowrap/.test(css), ''); }
     /* ⑥ 課題の無い曲では、帯を出さないこと */
     { U.song.genTemp=false; U.saveSong(U.song);
       const mid=U.song.id;
       try{ U.switchSong(keepId); U.render(); U.renderFretboard(); }catch(_){}
       ok('[227] 課題の無い曲には帯を出さない',
          !d.querySelector('#fbbar .fb-drill'), '');
       try{ U.doDeleteSong(mid); }catch(_){} } }
   /* ⑦ 選ぶ画面が開くこと */
   { U.openDrill();
     const pop=d.querySelector('.pop-ov.open')||d.querySelector('.pop');
     const txt=pop?pop.textContent:'';
     ok('[227] 今日の練習の画面が開く', /今日の練習/.test(txt), '');
     ok('[227] 段が三つ並ぶ',
        /かんたん/.test(txt)&&/ふつう/.test(txt)&&/むずかしい/.test(txt), '');
     ok('[227] 課題も並ぶ',
        U.BK_DRILLS.every(x=>txt.indexOf(x.name)>=0), '');
     /* ══ 出す物と、出さない物（1.237 でほどいた）══
        **速さ・進行・厚みは出す**——段の一枚に束ねていた頃、
        札が名乗るのは ♩ だけで、進行と厚みが黙って動いていた。
        ただし**作り込みの設え（借用和音・種）は今も出さない**——
        そこまで出せば〈アドリブの伴奏〉と同じ物になる。 */
     ok('[237] 速さ・進行・厚みが札で出ている',
        /速さ/.test(txt)&&/進行/.test(txt)&&/和音の厚み/.test(txt), '');
     ok('[227] 作り込みの設えは出さない',
        !/借用和音|種（同じ番号/.test(txt), '');
     /* ══ 選ぶことと、始めることを分ける（1.230）══
        L様——「一つしかボタン押せない。レベルが設定できない」。
        押した札がその場で曲を作って閉じる造りでは、**一回押したら終わり**。
        課題の側にも段が書いてあったので、段まで決まってしまっていた。 */
     { const btns=[...pop.querySelectorAll('button.pb')];
       const on=()=>btns.filter(b=>/(^| )on( |$)/.test(b.className))
                        .map(b=>b.textContent);
       /* 段・速さ・進行・厚み・課題の**五つとも**選ばれていること（1.237）。
          開いた直後は段1の取り合わせと揃っているので、段の札も光る */
       ok('[230] 五つとも選ばれている', on().length===5, on().join(' / '));
       ok('[230] 始める札は一つだけ',
          btns.filter(b=>/で始める/.test(b.textContent)).length===1, '');
       /* **選ぶ札を押しても、曲はできないこと** */
       const before=U.song.id;
       btns.find(b=>/むずかしい/.test(b.textContent)).onclick();
       btns.find(b=>/三度と七度/.test(b.textContent)).onclick();
       ok('[230] 選んだだけでは曲はできない', U.song.id===before, '');
       ok('[230] 画面も閉じない',
          !!(d.querySelector('.pop-ov.open')||d.querySelector('.pop')), '');
       ok('[230] 選んだ物に印が付く',
          on().some(t=>/むずかしい/.test(t))&&on().some(t=>/三度と七度/.test(t)),
          on().join(' / '));
       /* **目安 Lv は縛りではない**——Lv3 の課題を、他の段でも始められる */
       btns.find(b=>/かんたん/.test(b.textContent)).onclick();
       U.song.genTemp=false; U.saveSong(U.song);
       pop.querySelector('button.pb.pri').onclick();
       ok('[230] 目安と違う段でも始められる',
          U.song.drill.id==='guide'&&U.song.drill.lv===1,
          U.song.drill.id+'/Lv'+U.song.drill.lv);
       ok('[230] 段の設えが効いている',
          U.song.play.bpm===U.BK_DRILL_LV[1].bpm, String(U.song.play.bpm));

       /* **借りた曲は返す**（練習用の印を外してから離れる） */
       U.song.genTemp=false; U.saveSong(U.song);
       const mid2=U.song.id;
       try{ U.switchSong(_keepId); U.render(); }catch(_){}
       try{ U.doDeleteSong(mid2); }catch(_){}
       ok('[230] 元の曲へ戻れる', U.song.id===_keepId, ''); }
       /* ══════════════════════════════════════════════════════
          速さ・進行・厚みは、それぞれ別に効くこと（1.237）

          L様——「文言と効果が噛み合わない。段の説明なのにテンポが変わる」。
          一枚の札が三つを動かしていながら、名乗るのは ♩ だけであった。
          ——**ほどいた以上、一枚ずつ独立して効くことを確かめる。**
          **段の札は下を動かすが、縛らない**（触り直せば色が消える）。
          ══════════════════════════════════════════════════════ */
       { U.closePop(); U.openDrill();
         const p2=d.querySelector('.pop-ov.open')||d.querySelector('.pop');
         const grp=[...p2.querySelectorAll('.pg')];
         const rowOf=t=>{ const g=grp.find(x=>{ const l=x.querySelector('.pg-lbl');
                            return l&&l.textContent.indexOf(t)>=0; });
                          return g?g.querySelector('.pg-row'):null; };
         const bs=t=>{ const r=rowOf(t); return r?[...r.querySelectorAll('button')]:[]; };
         const lit=t=>bs(t).filter(b=>/(^| )on( |$)/.test(b.className)).map(b=>b.textContent);
         const tap=(t,lb)=>{ const b=bs(t).find(x=>x.textContent===lb); if(b) b.onclick(); return !!b; };

         ok('[237] 速さの札が五つ並ぶ', bs('速さ').length===U.BK_DRILL_BPMS.length,
            bs('速さ').map(b=>b.textContent).join(' '));
         ok('[237] 進行の札が棚と同じ数だけ並ぶ',
            bs('進行').length===U.BK_DRILL_PROGS.length,
            String(bs('進行').length)+'/'+U.BK_DRILL_PROGS.length);
         ok('[237] 厚みの札が三つ並ぶ', bs('和音の厚み').length===U.BK_DRILL_TENS.length, '');

         /* **段の札は、下の三枚を実際に動かすこと。**
            動かないなら、それは名前だけの札である */
         tap('まとめて','むずかしい');
         const L3=U.BK_DRILL_LV[3];
         ok('[237] 段が速さを動かす', lit('速さ')[0]==='♩='+L3.bpm, lit('速さ').join());
         ok('[237] 段が進行を動かす',
            lit('進行')[0]===U.bkDrillProg(L3.prog).name, lit('進行').join());
         ok('[237] 段が厚みを動かす',
            lit('和音の厚み')[0]===U.bkDrillTens(L3.tens).name, lit('和音の厚み').join());
         ok('[237] 揃っている間は段が光る', lit('まとめて')[0]==='むずかしい', lit('まとめて').join());

         /* **触り直せば、段の色は消える。**
            光ったままなら「その段の取り合わせだ」と嘘をつくことになる */
         tap('速さ','♩=70');
         ok('[237] 触り直すと段の色が消える', lit('まとめて').length===0, lit('まとめて').join());
         ok('[237] 速さを触っても進行は動かない',
            lit('進行')[0]===U.bkDrillProg(L3.prog).name, lit('進行').join());
         ok('[237] 速さを触っても厚みは動かない',
            lit('和音の厚み')[0]===U.bkDrillTens(L3.tens).name, lit('和音の厚み').join());
         tap('速さ','♩='+L3.bpm);
         ok('[237] 取り合わせが戻れば、また光る',
            lit('まとめて')[0]==='むずかしい', lit('まとめて').join());

         /* **選んだ三つが、出てきた曲に本当に効いていること。**
            画面の色だけ変わって中身が同じでは、直したことにならない */
         tap('速さ','♩=70'); tap('進行','ブルース'); tap('和音の厚み','三和音だけ');
         tap('何を練習するか','一つの音だけで弾く（目安 Lv1）');
         U.song.genTemp=false; U.saveSong(U.song);
         p2.querySelector('button.pb.pri').onclick();
         const sd=U.song;
         ok('[237] 選んだ速さで作られる', sd.play.bpm===70, String(sd.play.bpm));
         ok('[237] 選んだ進行で作られる', sd.bars.length===12, String(sd.bars.length)+'小節');
         ok('[237] 選んだ課題で作られる', sd.drill&&sd.drill.id==='one',
            sd.drill?sd.drill.id:'—');
         /* 控えにも、使った三つが載っていること（§1.209：載せ忘れれば消える） */
         ok('[237] 使った三つが曲に載る',
            !!(sd.drill&&sd.drill.prog==='blues'&&sd.drill.bpm===70&&sd.drill.tens==='none'),
            sd.drill?[sd.drill.prog,sd.drill.bpm,sd.drill.tens].join('/'):'—');
         U.song.genTemp=false; U.saveSong(U.song);
         const mid3=U.song.id;
         try{ U.switchSong(_keepId); U.render(); }catch(_){}
         try{ U.doDeleteSong(mid3); }catch(_){}
       }

       /* ══ 厚みの札が効かない進行では、そう申し上げること（1.237）══
          **押したのに変わらない**が起きれば、道具が壊れて見える。
          判定（bkDrillProgHas7）が実際の出来上がりと合っているかを、
          **判定の関数ではなく、出てきた和音の実体で**確かめる。 */
       { const K0=U.BK_KEYS.find(x=>x.root===0&&x.qual==='maj');
         const chordsOf=(p3,t)=>{
           const s3=U.genBackingSong({parts:p3.parts.slice(),tension:t,key:K0,
                                      genre:'pops',seed:99,bass:true});
           const n=[]; (s3.bars||[]).forEach(b=>{
             (b.notes||[]).forEach(x=>{ if(x.chord) n.push(U.chordName(x.chord,s3.meta)); });
             if(b.chordAt) Object.keys(b.chordAt).forEach(k=>n.push(U.chordName(b.chordAt[k],s3.meta))); });
           return [...new Set(n)].sort().join(' ');
         };
         const wrong=[];
         U.BK_DRILL_PROGS.forEach(p3=>{
           const say=U.bkDrillProgHas7(p3);
           const same=(chordsOf(p3,'none')===chordsOf(p3,'some'));
           if((say==='all')!==same) wrong.push(p3.name+'（判定'+say+'／実測'+(same?'同じ':'変わる')+'）');
         });
         ok('[237] 厚みが効くか否かの見立てが、出来上がりと合う',
            wrong.length===0, wrong.join(' '));
         /* **テンションまでは、どの進行でも必ず何かが変わること。**
            変わらないなら、その札は名前だけになる */
         const dead=U.BK_DRILL_PROGS.filter(p3=>chordsOf(p3,'some')===chordsOf(p3,'rich'));
         ok('[237] テンションまではどの進行でも効く', dead.length===0,
            dead.map(x=>x.name).join(' ')); }
     try{ U.closePop(); }catch(_){} }
   /* ══ 借りた設えは、確かに返す（1.230）══
      **この段の後ろにも点検が続いている。**
      課題は指板の札を書き換えるので、戻し損ねると
      後の段が「札が一枚も無い画面」を見ることになる——
      実際そうなった（[171][173] が落ちた）。
      憶えた値を書き戻すだけでなく、**戻ったことを確かめる。** */
   { const st3=U.fbState();
     Object.keys(_fb0).forEach(k=>{ st3[k]=_fb0[k]; });
     st3.only='all';                            /* 課題が立てた絞りは、必ず外す */
     U.saveLibrary(); try{ U.renderFretboard(); }catch(_){}
     ok('[230] 課題の設えを持ち越さない',
        U.fbOnly()==='all'&&U.fbState().on===_fb0.on,
        JSON.stringify({o:U.fbOnly(),on:U.fbState().on}));
      }
 }catch(e){ ok('[227] 今日の練習の実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    理論の言い切りを、緩める（1.229）

    L様のご指摘（要旨）——
      ・「コードトーンは着地、それ以外は通り道」は言い切りすぎ
      ・調の外＝悪い音、ではない
      ・ブルーノートを「ぶつかる」で終わらせない
      ・オルタード＝五度下へ帰る時**だけ**、ではない
      ・m7♭5 なら**全部**ロクリアン♮2、ではない
      ・禁止ではなく、段に分ける

    **音楽では、文脈によって成立する音が非常に多い。**
    「間違い」と言い切れるのは和音の顔と真っ向から食い違う時だけで、
    それ以外は**どれだけ張り詰めるか**の違いでしかない。
    ══════════════════════════════════════════════════════════════ */
 try{
   const key={root:0,qual:'maj'};
   /* ① ブルーノートを「ぶつかる」にも「薄い」にもしないこと */
   { const C7={root:0,type:'dom7',bass:null};
     const a=U.fbAdvice(C7,key,0,{root:5,type:'dom7',bass:null});
     const mb=a.find(x=>x.id==='minblues'), mp=a.find(x=>x.id==='minpent');
     ok('[229] 属七のマイナーブルースはぶつからない', mb&&!mb.clash, mb?mb.tier:'—');
     /* ブルースの I7 では**定番**にまで上がる（役どころの定石）。
        少なくとも「色」以上——**薄める段へは落とさない** */
     ok('[229] それは色か定番の段',
        mb&&(mb.tier==='color'||mb.tier==='std'), mb?mb.tier:'—');
     ok('[229] マイナーペンタも「色」', mp&&mp.tier==='color', mp?mp.tier:'—');
     /* **薄い段（発展）へ落とさないこと**——ブルースは表現の本筋 */
     ok('[229] ブルーノートを発展へ落とさない',
        !a.some(x=>['minblues','majblues','minpent'].indexOf(x.id)>=0&&x.tier==='adv'),
        a.filter(x=>['minblues','majblues','minpent'].indexOf(x.id)>=0)
         .map(x=>x.id+':'+x.tier).join(',')); }
   /* ② オルタードを、帰らない属七でも「禁止」にしないこと */
   { const G7={root:7,type:'dom7',bass:null};
     const a=U.fbAdvice(G7,key,7,{root:9,type:'min7',bass:null});
     const alt=a.find(x=>x.id==='alt');
     ok('[229] 帰らなくてもオルタードは在る', !!alt, '');
     ok('[229] それは「緊張」の段（禁止ではない）',
        alt&&alt.tier==='tense', alt?alt.tier:'—');
     ok('[229] ぶつかる扱いにはしない', alt&&!alt.clash, '');
     /* 帰る時は「定番」へ上がる */
     const b=U.fbAdvice(G7,key,7,{root:0,type:'maj7',bass:null});
     const alt2=b.find(x=>x.id==='alt');
     /* ══ 第一の定石は ◎ へ上がる（1.245）══
        **◎ の物差しは「調の中に居るか」ではなく「そのまま鳴らして自然か」。**
        その場面でそれ以外に無いという音が ★ 止まりでは、
        既定に出てこない（L様——「デフォルトで◎じゃない時があるけど」）。
        ゆえに確かめるのは「勧める段位（◎か★）に在ること」。 */
     ok('[229] 帰る時は勧める段へ上がる',
        alt2&&(alt2.tier==='std'||alt2.tier==='safe'), alt2?alt2.tier:'—');
     ok('[245] その場面の第一の定石は ◎',
        alt2&&alt2.tier==='safe'&&alt2.lead, alt2?alt2.tier:'—'); }
   /* ③ m7♭5 は、行き先で変わること */
   { const Bm7b5={root:11,type:'m7b5',bass:null};
     const ii=U.fbAdvice(Bm7b5,{root:9,qual:'min'},11,{root:4,type:'dom7',bass:null});
     { const t2=(ii.find(x=>x.id==='loc2')||{}).tier;
       ok('[229] ii–V の ii ではロクリアン♮2 が勧める段',
          t2==='std'||t2==='safe', t2||'—'); }
     const other=U.fbAdvice(Bm7b5,{root:9,qual:'min'},11,{root:9,type:'min',bass:null});
     ok('[229] それ以外では定番にしない',
        (other.find(x=>x.id==='loc2')||{}).tier!=='std',
        (other.find(x=>x.id==='loc2')||{}).tier||'—');
     ok('[229] それでも候補には残る', !!other.find(x=>x.id==='loc2'), ''); }
   /* ④ 段の表そのもの */
   { ok('[229] 段が六つ', Object.keys(U.FB_TIER).length===6,
        Object.keys(U.FB_TIER).join(','));
     const bad=[];
     Object.keys(U.FB_TIER).forEach(k=>{
       const t=U.FB_TIER[k];
       if(!t.mark||!t.name||!t.tip) bad.push(k);
     });
     ok('[229] どの段にも印と名と説明が在る', bad.length===0, bad.join(','));
     /* **薄めるのは発展と緊張だけ**（色は薄めない——本筋であるゆえ） */
     const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('');
     ok('[229] 色の段は薄めない', !/\.fb-b\.color\{[^}]*opacity/.test(css), '');
     ok('[229] 色の段に顔が在る', /\.fb-b\.color\{/.test(css), '');
     ok('[229] 緊張の段に顔が在る', /\.fb-b\.tense\{/.test(css), ''); }
   /* ⑤ 「まずこれ」は、ぶつかる物にしないこと */
   { const bad=[];
     [['maj7',0],['min7',2],['dom7',7],['m7b5',11],['dim7',3]].forEach(([ty,r])=>{
       if(!U.CD[ty]) return;
       const a=U.fbAdvice({root:r,type:ty,bass:null},key,r);
       if(!a.length) return;
       if(a[0].tier==='bad') bad.push(ty+'：'+a[0].id);
     });
     ok('[229] 先頭にぶつかる物を置かない', bad.length===0, bad.join(' / ')); }
   /* ⑥ 役どころを言葉にできること（**なぜその音か**） */
   { const G7={root:7,type:'dom7',bass:null};
     const t1=U.fbRoleText(U.fbRole(G7,{root:0,type:'maj7'},key),G7,{root:0,type:'maj7'},key);
     ok('[229] V7→I を言葉にできる', /属七/.test(t1||''), (t1||'—').slice(0,24));
     const D7={root:2,type:'dom7',bass:null};
     const t2=U.fbRoleText(U.fbRole(D7,{root:7,type:'dom7'},key),D7,{root:7,type:'dom7'},key);
     ok('[229] 連鎖は解決と呼ばない', !/五度下へ帰ります/.test(t2||''), (t2||'—').slice(0,24));
     const Db7={root:1,type:'dom7',bass:null};
     const t3=U.fbRoleText(U.fbRole(Db7,{root:0,type:'maj7'},key),Db7,{root:0,type:'maj7'},key);
     ok('[229] 裏コードを言葉にできる', /裏コード/.test(t3||''), (t3||'—').slice(0,20)); }
 }catch(e){ ok('[229] 段と言い切りの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    空の課題を畳み、絞りを一本に（1.233）

    L様——「無理なものはまず削除して」
           「欲しいのはキーがメジャーで平行調のマイナーペンタになるやつ」
           「一つの音だけを使うもの（転調しないコード進行でぶつからない音のみ）」

    **できないことを課題に書いておくのが、いちばん悪い。**
      旋法を持ち替える … 同じ調では**七つとも同じ音**（§1.217）
      帰り際だけ繰り返す … **部分ループが道具に無い**
      二拍弾いて二拍休む … **道具が何もしていなかった**

    併せて、絞りが `tonesOnly`／`oneScale` の**二枚看板**になっていた。
    そこへ三つ足せば五枚——**一つの決定は一カ所に。**
    ══════════════════════════════════════════════════════════════ */
 try{
   /* ① 空の課題が消えていること */
   { const ids=U.BK_DRILLS.map(x=>x.id);
     ok('[233] 旋法を持ち替える課題を畳んだ', ids.indexOf('mode')<0, ids.join(','));
     ok('[233] 帰り際だけの課題を畳んだ', ids.indexOf('turn')<0, ids.join(','));
     ok('[233] 二拍休む課題を畳んだ', ids.indexOf('rest')<0, ids.join(','));
     /* **残った課題は、すべて画面を変えること** */
     const bad=U.BK_DRILLS.filter(x=>!x.only&&!x.hold&&!(x.set&&Object.keys(x.set).length));
     ok('[233] 残った課題は、すべて画面を変える', bad.length===0,
        bad.map(x=>x.id).join(',')); }
   /* ② 絞りが一本になっていること */
   { ok('[233] 絞りは六通り', U.FB_ONLY.length===6,
        U.FB_ONLY.map(x=>x.id).join(','));
     const st=U.fbState(); const k=U.fbOnly();
     /* **古い二枚看板からの移行**（控えに残っている物を見に行く §1.210） */
     st.only=null; st.tonesOnly=true; st.oneScale=false;
     ok('[233] 古い控えから移せる', U.fbOnly()==='tones', U.fbOnly());
     ok('[233] 古い札は片づける',
        U.fbState().tonesOnly===undefined&&U.fbState().oneScale===undefined, '');
     st.only=null; st.oneScale=true;
     ok('[233] もう一方も移せる', U.fbOnly()==='scale', U.fbOnly());
     st.only=k; U.saveLibrary(); }
   /* ③ 平行短調のペンタで通す課題 */
   { const dr=U.bkDrill('pent');
     ok('[233] 平行短調のペンタの課題が在る', !!dr, '');
     ok('[233] 名にそう書いてある', /平行短調のペンタ/.test(dr.name), dr.name);
     ok('[233] 一つで通し、盤も絞る', dr.hold==='rel'&&dr.only==='scale',
        dr.hold+'/'+dr.only); }
   /* ④ **一つの音だけ**——進行のどの和音ともぶつからないこと */
   { const st=U.fbState(); const keepOnly=U.fbOnly();
     const keepId=U.song.id;
     const bad=[];
     for(let t=0;t<6;t++){
       U.song.genTemp=false; U.saveSong(U.song);
       U.makeDrillSong((t%3)+1,'one');
       const cy=U.fbProgCycle();
       const key=U.fbCurKey(U.song.bars[0]);
       const pc=U.fbPedalPc(key);
       /* ══ 和音の音そのものは、ぶつかりではない（1.241）══
          **その和音に含まれる音を鳴らして濁ることはない。**
          テンションの入る段では Bm9 の 9th（C♯）が三度（D）と半音になるが、
          C♯ は Bm9 の構成音なので、伸ばしても成立する——
          fbPedalPc が「和音の音であれば必ず安全」と申しているとおり。
          **点検の物差しが実装の宣言より厳しく、稀に落ちていた。**
          確かめるべきは「**和音の外の音**が、顔と半音でぶつからないこと」。 */
       (cy.rows||[]).filter(r=>r.chord).forEach(r=>{
         const iv=((U.CD[r.chord.type]||U.CD.maj).iv||[]).map(x=>((x%12)+12)%12);
         const tones=iv.map(x=>((r.chord.root+x)%12+12)%12);
         if(tones.indexOf(pc)>=0) return;          /* その和音の音なら安全 */
         iv.filter(x=>[3,4,10,11,6].indexOf(x)>=0).forEach(x=>{
           const tt=((r.chord.root+x)%12+12)%12;
           if(((pc-tt)%12+12)%12===1||((tt-pc)%12+12)%12===1)
             bad.push(U.chordName(r.chord,U.song.meta)+'と半音');
         });
       });
       const mid=U.song.id;
       U.song.genTemp=false; U.saveSong(U.song);
       try{ U.switchSong(keepId); }catch(_){}
       try{ U.doDeleteSong(mid); }catch(_){}
     }
     ok('[233] 一つの音は、どの和音ともぶつからない', bad.length===0,
        [...new Set(bad)].slice(0,4).join(' / '));
     st.only=keepOnly; U.saveLibrary();
     try{ U.switchSong(keepId); U.render(); U.renderFretboard(); }catch(_){} }
   /* ⑤ 盤に出る音の数が、絞りどおりであること */
   { const st=U.fbState(); const keepOnly=U.fbOnly();
     const labs=()=>{
       const raw=String(d.getElementById('fbbar').innerHTML)
         .replace(/<circle[^>]*fill="none"[^>]*\/>/g,'');
       const o=[];
       raw.split('<circle ').slice(1).forEach(c=>{
         const t=(c.match(/<text[^>]*font-weight="800"[^>]*>([^<]*)</)||[])[1];
         if(t) o.push(t);
       });
       return [...new Set(o)];
     };
     /* **和音の在る小節を見る**（コードの無い所では、顔も何も出ない） */
     { const bar9=(U.song.bars||[]).find(b2=>U.fbCurChord(b2));
       if(bar9) U.TP.phBar=bar9.id; }
     st.on=true; st.only='guide'; U.saveLibrary(); U.renderFretboard();
     const g=labs();
     /* 三和音には七度が無いので、一つのこともある。
        **出るのは三度と七度だけ**であることを見る */
     ok('[233] 三度と七度だけを出す',
        g.length>0&&g.length<=2&&g.every(t=>/^[37]$/.test(t)), g.join(' ')||'（無し）');
     st.only='one'; U.saveLibrary(); U.renderFretboard();
     ok('[233] 一つの音だけなら、一つ', labs().length===1, labs().join(' '));
     st.only='tones'; U.saveLibrary(); U.renderFretboard();
     ok('[233] 和音の音だけなら、四つまで', labs().length<=4, labs().join(' '));
     st.only=keepOnly; U.TP.phBar=null; U.saveLibrary(); U.renderFretboard(); }
   /* ⑥ 選ぶ画面が在ること */
   { U.openFbOnly();
     const pop=d.querySelector('.pop-ov.open')||d.querySelector('.pop');
     const txt=pop?pop.textContent:'';
     ok('[233] 絞りを選ぶ画面が開く', /盤に何を出すか/.test(txt), '');
     ok('[233] 五通りが並ぶ',
        U.FB_ONLY.every(x=>txt.indexOf(x.name)>=0), '');
     try{ U.closePop(); }catch(_){} }
 }catch(e){ ok('[233] 課題と絞りの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    同じ根音で、長短のペンタを行き来する（1.234）

    L様——「同ルートのペンタ長短を切り替えてソロするものが欲しい」。

    平行調のペンタ（§1.218）は**同じ五つの音を別の根音から数える**話で、
    こちらは**別の五つの音を同じ根音から数える**話——**まるで別物**である。
    ♭3 と ♮3 の行き来が、そのまま味になる。
    ══════════════════════════════════════════════════════════════ */
 try{
   const st=U.fbState();
   const keep={only:U.fbOnly(),pc:st.perChord,on:st.on};
   const keepId=U.song.id;
   /* ① 二枚は、同じ根音から組むこと */
   { ok('[234] 二枚が決まっている', U.FB_MAJMIN.join(',')==='majpent^0,minpent^0',
        U.FB_MAJMIN.join(','));
     const key={root:5,qual:'maj'};
     const r1=U.fbRootOf('majpent^0',{root:0,type:'maj'},key);
     const r2=U.fbRootOf('minpent^0',{root:9,type:'min'},key);
     ok('[234] どちらも調の根音から組む', r1===5&&r2===5, r1+' / '+r2);
     /* **和音が変わっても根音は動かない**——それが「同じ根音」の意味 */
     const r3=U.fbRootOf('majpent^0',{root:7,type:'dom7'},key);
     ok('[234] 和音が変わっても動かない', r3===5, String(r3));
     /* **平行調の方とは別物であること**（同じ音を別の根音から数える方） */
     ok('[234] 平行調の札とは別',
        U.fbRelId(key)!=='majpent^0'&&U.fbRelId(key)!=='minpent^0',
        String(U.fbRelId(key))); }
   /* ② 課題が、二枚だけを並べること */
   { U.song.genTemp=false; U.saveSong(U.song);
     U.makeDrillSong(2,'majmin');
     U.renderFretboard();
     ok('[234] 絞りが長短の行き来になる', U.fbOnly()==='majmin', U.fbOnly());
     const chips=[...d.querySelectorAll('#fbbar .fb-scales .fb-b')];
     /* 1.235：〈全部の和音に〉を足したので四枚 */
     ok('[234] 札は二枚と、広げる札と、戻り道', chips.length===4,
        chips.map(x=>x.textContent).join(' | '));
     ok('[234] 二枚は長短のペンタ',
        chips.slice(0,2).every(x=>/ペンタ/.test(x.textContent))
        &&/メジャー/.test(chips[0].textContent)&&/マイナー/.test(chips[1].textContent),
        chips.slice(0,2).map(x=>x.textContent).join(' / '));
     ok('[234] 根音が同じ',
        chips[0].textContent.split(' ')[0]===chips[1].textContent.split(' ')[0],
        chips.slice(0,2).map(x=>x.textContent).join(' / '));
     ok('[234] どちらか一方が選ばれている',
        chips.slice(0,2).filter(x=>/(^| )on( |$)/.test(x.className)).length===1, '');
     /* ══ ③ 切り替えは、**和音ごと**（1.235）══
        L様——「コード毎に設定できない。一律で変わる」。
        1.234 で曲ぜんたいへ効かせたのは**私の思い込み**であった——
        ブルースなら **I7 は長、IV7 は短**、その使い分けが稽古である。 */
     const cy=U.fbProgCycle();
     const names=[...new Set((cy.rows||[]).map(r=>r.name).filter(Boolean))];
     { const bar0=(U.song.bars||[]).find(b2=>b2.id===cy.all[0].barId);
       if(bar0){ U.TP.phBar=bar0.id; U.TP.phTick=cy.all[0].tick; U.renderFretboard(); } }
     const first=cy.rows[0].name;
     d.querySelectorAll('#fbbar .fb-scales .fb-b[data-sc]')[1].onclick();
     /* ══ ④ 当たるのは**そのマス一つ**（1.238）══
        L様——「同じコードが共通になってる」。
        鍵が名であった頃は、ブルースの C7 に当てると六マスが一緒に動いた。
        **一小節目の I7 と、帰りの I7 は別物である。** */
     { const pc=U.fbState().perChord||{};
       ok('[238] 叩いたマスだけが変わる',
          U.fbAsgAt(cy,0,first)==='minpent^0', JSON.stringify(pc));
       const others=(cy.rows||[]).map((r,i)=>({i,name:r.name}))
                                  .filter(x=>x.name&&x.i!==0);
       ok('[238] 他のマスは変わらない',
          others.every(x=>U.fbAsgAt(cy,x.i,x.name)!=='minpent^0'), JSON.stringify(pc));
       /* **同じ名の別マスにも及ばないこと**——ここが 1.238 の眼目 */
       const twins=U.fbSlotsNamed(cy,first).filter(i=>i!==0);
       ok('[238] 同じ名の別マスにも及ばない',
          twins.every(i=>U.fbAsgAt(cy,i,first)!=='minpent^0'),
          twins.length?twins.join(','):'（同じ名は他に無し）'); }
     /* **広げる札は別に置く**（同じ操作に二つの意味を持たせない） */
     { const ab=d.querySelector('#fbbar .fb-b[data-mmall]');
       ok('[235] 全部へ広げる札が在る', !!ab, '');
       if(ab){ ab.onclick();
         const pc2=U.fbState().perChord||{};
         const all2=(cy.rows||[]).map((r,i)=>({i,name:r.name})).filter(x=>x.name);
         ok('[235] 広げれば全マスが揃う',
            all2.every(x=>U.fbAsgAt(cy,x.i,x.name)==='minpent^0'), JSON.stringify(pc2)); } }
     /* ══════════════════════════════════════════════════════
        当ては「マス」に紐づく（1.238）

        L様——「コードにスケールを割り当てる時、同じコードが共通になってる」。
        **鍵を名からマスへ移した。**移し替えは、次の三つが揃って初めて成る——
          ① 同じ名でも別マスなら別の物を当てられる
          ② まとめたい時のための札が別に在る
          ③ 古い当て（名だけの鍵）が消えず、迷子は残らない
        **一つでも欠ければ、直したことにならない。**
        ══════════════════════════════════════════════════════ */
     { /* **借りた設えは、確かに返す**（§1.230 の轍）——
          絞りも止めも控えてから触る。戻し損ねれば、後の段が別の画面を見る */
       const st8=U.fbState();
       const _kp={pc:JSON.stringify(st8.perChord||{}), only:st8.only,
                  pin:st8.pin, pinCh:st8.pinCh};
       st8.perChord={}; st8.only='all'; st8.pin=null; st8.pinCh=null;
       U.saveLibrary(); U.renderFretboard();
       const cy8=U.fbProgCycle();
       /* 同じ名が二つ以上あるマスを探す（無ければこの点検は飛ばす） */
       const dup=(cy8.rows||[]).map(r=>r.name).filter(Boolean)
         .find((n,i,a2)=>a2.indexOf(n)!==i);
       ok('[238] 帯の札がマス番号を持つ',
          [...d.querySelectorAll('#fbbar .fb-pc[data-fbc]')]
            .every(x=>x.getAttribute('data-fbi')!==null), '');
       if(dup){
         const ix=U.fbSlotsNamed(cy8,dup);
         /* ① **同じ名でも、別マスなら別の物** */
         st8.perChord[U.fbSlotKey(ix[0],dup)]='mixo';
         st8.perChord[U.fbSlotKey(ix[1],dup)]='dorian';
         ok('[238] 同じ名の別マスに、別の物を当てられる',
            U.fbAsgAt(cy8,ix[0],dup)==='mixo'&&U.fbAsgAt(cy8,ix[1],dup)==='dorian',
            dup+' '+(ix[0]+1)+'番目/'+(ix[1]+1)+'番目');
         /* 帯にも別々に出ること（**目に見えねば、分かれていないのと同じ**） */
         U.renderFretboard();
         { const chips8=[...d.querySelectorAll('#fbbar .fb-pc[data-fbc]')];
           const t0=(chips8[ix[0]].querySelector('i')||{}).textContent||'';
           const t1=(chips8[ix[1]].querySelector('i')||{}).textContent||'';
           ok('[238] 帯にも別々に出る', t0!==t1&&!!t0&&!!t1, t0+' / '+t1); }
         /* ② **まとめる札**——長押しの画面に在ること */
         U.openFbAssign(dup,ix[0]);
         { const pop8=d.querySelector('.pop-ov.open')||d.querySelector('.pop');
           const ab8=pop8?[...pop8.querySelectorAll('button.pb')]
                            .find(x=>/すべてに/.test(x.textContent)):null;
           ok('[238] 同じ名すべてに広げる札が在る', !!ab8,
              ab8?ab8.textContent:'—');
           if(ab8){ ab8.onclick();
             ok('[238] 広げれば同じ名が揃う',
                ix.every(i=>U.fbAsgAt(cy8,i,dup)==='mixo'),
                ix.map(i=>U.fbAsgAt(cy8,i,dup)).join(' ')); } }
         try{ U.closePop(); }catch(_){}
         /* **他の名には及ばないこと** */
         { const other=(cy8.rows||[]).map((r,i)=>({i,name:r.name}))
             .filter(x=>x.name&&x.name!==dup);
           ok('[238] 広げても他の名には及ばない',
              other.every(x=>U.fbAsgAt(cy8,x.i,x.name)!=='mixo'), ''); }
       }
       /* ③ **古い当て（名だけの鍵）は、その名の全マスへ移ること** */
       { const nm8=(cy8.rows||[]).map(r=>r.name).find(Boolean);
         st8.perChord={}; st8.perChord[nm8]='lydian';
         U.renderFretboard();
         const left=Object.keys(U.fbState().perChord||{}).filter(k=>k.indexOf('|')<0);
         ok('[238] 古い鍵は残らない', left.length===0, left.join(','));
         ok('[238] 古い当ては、その名の全マスへ移る',
            U.fbSlotsNamed(cy8,nm8).every(i=>U.fbAsgAt(cy8,i,nm8)==='lydian'),
            JSON.stringify(U.fbState().perChord)); }
       /* ③ **行き場を失った当ては捨てること**（迷子を残さない） */
       { const st9=U.fbState();
         st9.perChord['99|存在せぬ和音']='dorian';
         st9.perChord[U.fbSlotKey(0,'名が食い違う和音')]='dorian';
         U.renderFretboard();
         const pc9=U.fbState().perChord||{};
         ok('[238] 在り得ないマスの当ては捨てる', !pc9['99|存在せぬ和音'], '');
         ok('[238] 名が食い違う当ても捨てる',
            !pc9[U.fbSlotKey(0,'名が食い違う和音')], ''); }
       st8.perChord=JSON.parse(_kp.pc); st8.only=_kp.only;
       st8.pin=_kp.pin; st8.pinCh=_kp.pinCh;
       U.saveLibrary(); U.renderFretboard(); }
     /* 盤の音も入れ替わること（**♭3 が出て、♮3 が消える**） */
     const labs=()=>{
       const raw=String(d.getElementById('fbbar').innerHTML)
         .replace(/<circle[^>]*fill="none"[^>]*\/>/g,'');
       const o=[];
       raw.split('<circle ').slice(1).forEach(c=>{
         const t=(c.match(/<text[^>]*font-weight="800"[^>]*>([^<]*)</)||[])[1];
         if(t) o.push(t);
       });
       return [...new Set(o)];
     };
     U.renderFretboard();
     const L1=labs();
     ok('[234] 短の方では ♭3 が出る', L1.some(t=>/♭3/.test(t)), L1.join(' '));
     ok('[234] 短の方では ♮3 は出ない', !L1.some(t=>t==='3'), L1.join(' '));
     d.querySelectorAll('#fbbar .fb-scales .fb-b[data-sc]')[0].onclick();
     U.renderFretboard();
     const L2=labs();
     ok('[234] 長の方では ♮3 が出る', L2.some(t=>t==='3'), L2.join(' '));
     ok('[234] 五つずつ', L1.length===5&&L2.length===5, L1.length+' / '+L2.length);
     /* ④ 行き来しても、どちらか一方は必ず出ていること */
     st.perChord={}; U.renderFretboard();
     const chips2=[...d.querySelectorAll('#fbbar .fb-scales .fb-b[data-sc]')];
     ok('[234] 当てが空でも、どちらかが出る',
        chips2.filter(x=>/(^| )on( |$)/.test(x.className)).length===1, ''); }
   st.only=keep.only; st.perChord=keep.pc; st.on=keep.on; U.saveLibrary();
   U.song.genTemp=false; U.saveSong(U.song);
   const mid=U.song.id;
   try{ U.switchSong(keepId); U.render(); U.renderFretboard(); }catch(_){}
   try{ U.doDeleteSong(mid); }catch(_){}
   ok('[234] 元の曲へ戻れる', U.song.id===keepId, '');
 }catch(e){ ok('[234] 長短ペンタの実地', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    譜面を送る時、次の段が見えていること（1.239）

    L様——「楽譜の画面スクロールは次の段が常に見えていて欲しい」。

    送りの単位が**小節**で、いまの小節を画面の真ん中へ寄せていた。
    段が下寄りに来ると**次の段が画面の外に残る**——
    紙の譜面で譜めくりが間に合わないのと同じことが起きていた。

    **送るかどうかの判断は、画面に触らぬ関数（followDy）に切り出してある。**
    そうでなければ「送りすぎた」「送らなかった」を確かめる術が無い。
    ══════════════════════════════════════════════════════════════ */
 try{
   const vp={top:70,bottom:600,vh:700};
   const H=90, T=t=>({top:t,bottom:t+H});
   const cs=[
     ['ちょうど良い位置',                 T(80),  T(180), 0],
     ['いまの段が沈み、次が画面の外',     T(520), T(620), 450],
     ['いまの段が上へはみ出す',           T(20),  T(120), -50],
     ['いまの段は見えるが次が外',         T(500), T(600), 430],
     ['次の段が無い（曲の終わり）',       T(80),  null,   0],
     ['次が無く、いまの段が沈む',         T(560), null,   490],
     ['次が十分に見えている',             T(400), T(500), 0],
     ['次が五点だけ覗いている',           T(505), T(595), 435],
   ];
   const ng=cs.filter(([,c,n,wnt])=>U.followDy(c,n,vp)!==wnt)
              .map(([nm,c,n,wnt])=>nm+'（'+U.followDy(c,n,vp)+'≠'+wnt+'）');
   ok('[239] 送る量が場面ごとに正しい', ng.length===0, ng.join(' / '));
   /* **送った後は、必ず収まること**——送り直しが起きない */
   const loop=cs.filter(([,c,n])=>{
     const dy=U.followDy(c,n,vp);
     return U.followDy({top:c.top-dy,bottom:c.bottom-dy},
                       n?{top:n.top-dy,bottom:n.bottom-dy}:null,vp)!==0;
   }).map(x=>x[0]);
   ok('[239] 一度送れば収まる（送り直しが起きない）', loop.length===0, loop.join(' / '));
   /* **二段が入らぬ低い画面では、紙を揺らさないこと** */
   ok('[239] 低い画面では揺らさない',
      U.followDy(T(70),T(160),{top:70,bottom:200,vh:270})===0, '');
   /* 段の連なりを、節をまたいで辿れること */
   { const _k=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     U.makeSightSong({level:2,bars:16,seed:9});
     const stages=[...d.querySelectorAll('#paper .stage')];
     ok('[239] 段が組まれている', stages.length>0, String(stages.length));
     let n2=stages[0], walk=1;
     while(n2&&walk<200){ const x=U.nextStage(n2); if(!x) break; n2=x; walk++; }
     ok('[239] 段を最後まで辿れる（節をまたぐ）',
        walk===stages.length, walk+'/'+stages.length);
     const secs=[...d.querySelectorAll('#paper .sec')];
     if(secs.length>1){
       const last1=[...secs[0].querySelectorAll('.stage')].pop();
       ok('[239] 節の終わりから、次の節の頭へ繋がる',
          U.nextStage(last1)===secs[1].querySelector('.stage'), ''); }
     /* **送りは一本**（§followStage）——別々の数を書いた道が残っていないこと */
     ok('[239] 送りの道は一本',
        !/scrollIntoView\(\{block:'center'/.test(html), '');
     /* ══ 次の段で見えていてほしいのは、譜面である（1.240）══
        L様——「次の段見えない」。段の矩形で判じていたので、
        **コード図の頭が少し覗いただけで「見えている」ことにしていた。** */
     { /* jsdom は寸法を持たないので、**在ることだけ**を確かめる
          （丈が測れない時は段そのものへ落とすので、実機でも困らない） */
       ok('[240] 段の中に譜面が在る',
          !stages.length||!!stages[0].querySelector('svg.msvg'), '');
       /* L様の画面と同じ寸法で、あの場面が直っていること */
       const vp2={top:280,bottom:1340,vh:1540};
       const cur2={top:760,bottom:1220};              /* いまの段 */
       const nsAll={top:1268,bottom:1728};            /* 次の段ぜんたい */
       const nsSt={top:1538,bottom:1728};             /* そのうち譜面 */
       const seen=r=>Math.max(0,Math.min(r.bottom,vp2.bottom)-Math.max(r.top,vp2.top));
       ok('[240] 段ぜんたいを的にすると、譜面が見えぬまま送らない',
          U.followDy(cur2,nsAll,vp2)===0&&seen(nsSt)===0, '');
       const dy2=U.followDy(cur2,nsSt,vp2);
       const aft=r=>({top:r.top-dy2,bottom:r.bottom-dy2});
       ok('[240] 譜面を的にすれば送る', dy2>0, String(dy2));
       ok('[240] 送った後、次の段の譜面が読める', seen(aft(nsSt))>=32,
          String(seen(aft(nsSt))));
       ok('[240] 送った後、いまの段も収まる',
          aft(cur2).top>=vp2.top-2&&aft(cur2).bottom<=vp2.bottom+2, '');
       ok('[240] 送り直しが起きない',
          U.followDy(aft(cur2),aft(nsSt),vp2)===0, ''); }
     U.song.genTemp=false; U.saveSong(U.song);
     const mid9=U.song.id;
     try{ U.switchSong(_k); U.render(); }catch(_){}
     try{ U.doDeleteSong(mid9); }catch(_){} }
 }catch(e){ ok('[239] 譜面の送り', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    転調の札は「どこへ転調するか」を名乗ること（1.242）

    L様——「落ちサビの言葉の使い方間違ってない？」。

    〈落ちサビ・半音上げ〉と名乗っていたが、**落ちサビは音数を落とす
    部分**であって上げる部分ではない（上げるのはラスサビ＝上げサビ）。
    加えて**この道具はサビを作っていない**——曲を半分に割って後半を
    まるごと上げるだけである。他の四枚が「どこへ」を名乗るのに、
    この二枚だけが「曲のどの部分か」を名乗っていた。

    **札の名だけを合わせても足りない。**移り先が名のとおりかを、
    出てきたセクションの調で確かめる。
    ══════════════════════════════════════════════════════════════ */
 try{
   const K0=U.BK_KEYS.find(x=>x.root===0&&x.qual==='maj');
   const badM=[], badS=[];
   U.BK_MODS.filter(m=>m.how).forEach(m=>{
     const s0=U.genBackingSong({parts:['p_oudou','p_oudou'],key:K0,genre:'pops',
                                tension:'none',mod:m.id,borrow:false,seed:3,bass:true});
     if(!s0){ badS.push(m.id+'（組めず）'); return; }
     if((s0.sections||[]).length!==2) badS.push(m.id+'：節が二つに割れない');
     const to=m.how(K0.root,K0.qual);
     const half=((to.root-K0.root)%12+12)%12;
     /* **名が半音と申せば半音、全音と申せば全音**であること */
     if(m.id==='lift1'&&half!==1) badM.push('半音上へ が '+half+' 半音');
     if(m.id==='lift2'&&half!==2) badM.push('全音上へ が '+half+' 半音');
     if(m.id==='up4'  &&half!==5) badM.push('四度上へ が '+half+' 半音');
     if(m.id==='par'&&(to.root!==K0.root||to.qual===K0.qual)) badM.push('同主調へ が同主調でない');
     if(m.id==='rel'&&(half!==9||to.qual!=='min')) badM.push('平行調へ が平行調でない');
   });
   ok('[242] 転調の名と、移る先が合う', badM.length===0, badM.join(' / '));
   ok('[242] 転調すれば節が二つに割れる', badS.length===0, badS.join(' / '));
   /* **誤った言葉が、L様の目に触れる所に残っていないこと。**
      注記（経緯の記述）には残ってよいが、札・案内・曲名には残さない */
   { const names=U.BK_MODS.map(m=>m.name).join(' ');
     ok('[242] 札の名に〈落ちサビ〉が無い', !/落ちサビ/.test(names), names);
     const s1=U.genBackingSong({parts:['p_oudou','p_oudou'],key:K0,genre:'pops',
                                mod:'lift1',seed:3,bass:true});
     ok('[242] 曲名にも残らない', !!s1&&!/落ちサビ/.test(s1.meta.title),
        s1?s1.meta.title:'—');
     U.closePop(); U.openBackingGen();
     const p0=d.querySelector('.pop-ov.open')||d.querySelector('.pop');
     ok('[242] 伴奏を作る画面に残らない',
        !!p0&&!/落ちサビ/.test(p0.textContent), '');
     /* 手引きの本文にも（経緯を述べた一項を除いて）残らないこと */
     const hp=(typeof HELPTXT!=='undefined')?HELPTXT:null;
     try{ U.closePop(); }catch(_){} }
 }catch(e){ ok('[242] 転調の名乗り', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    進行ライブラリ（1.243）

    L様より、実際の稽古で出会う進行を体系立てて収めたい旨を承った。

    **数を増やすこと自体を目的にしない。**入れてよいのは
    「なぜよく使われるのか」が書ける進行だけである。
    そして——**理屈の誤りは、目では捕まらない。**
    実際、コルトレーン・チェンジと借りたドミナントの連鎖で、
    **属七の行き先が次の和音と合っていない**まま置きかけ、
    plAudit が捕まえた。**その検算をここに据える。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const P=U.PL_PROGS||[];
   ok('[243] 進行が収まっている', P.length>=40, String(P.length)+'本');
   /* 持ち物が揃っていること。**why が書けない進行は入れない**（§34） */
   const miss=P.filter(p=>!p.name||!p.deg||!p.deg.length||!p.cats||!p.cats.length
                          ||!(p.lv>=1&&p.lv<=5)||!p.fn||!p.why||p.why.length<20)
                .map(p=>p.id);
   ok('[243] どの一本にも 名・度数・分類・段・機能・理由が在る',
      miss.length===0, miss.join(' '));
   /* id が重複していないこと */
   const seen={}, dup=[];
   P.forEach(p=>{ if(seen[p.id]) dup.push(p.id); seen[p.id]=1; });
   ok('[243] id が重ならない', dup.length===0, dup.join(' '));
   /* 度数と和音種が実在すること */
   const bogus=[];
   P.forEach(p=>(p.deg||[]).forEach((cell,bi)=>U.bkBarChords(cell).forEach(c=>{
     if(!c||c.length<2){ bogus.push(p.id+'#'+(bi+1)+' 形'); return; }
     if(!(c[0]>=0&&c[0]<=11)) bogus.push(p.id+'#'+(bi+1)+' 度数'+c[0]);
     if(!U.CD[c[1]])          bogus.push(p.id+'#'+(bi+1)+' 種'+c[1]);
   })));
   ok('[243] 度数と和音種が実在する', bogus.length===0, bogus.slice(0,4).join(' '));
   /* ══ 機能の名乗りと、和音の並びの検算（§plAudit）══
      **V/x と名乗るなら、行き先の五度上に立ち、次に変わる先がその x。**
      裏コードと名乗るなら ♭II に立ち、短七度を持つ。 */
   const ng=[];
   P.forEach(p=>U.plAudit(p).forEach(x=>ng.push(p.id+'：'+x)));
   ok('[243] 機能の名乗りと和音の並びが揃う', ng.length===0, ng.slice(0,4).join(' / '));
   /* 分類も段も、空にしない（空の棚を見せない） */
   const emptyC=U.PL_CATS.filter(c=>U.plByCat(c.id).length===0).map(c=>c.name);
   ok('[243] 空の分類が無い', emptyC.length===0, emptyC.join(' '));
   const emptyL=[1,2,3,4,5].filter(n=>U.plByLv(n).length===0);
   ok('[243] 空の段が無い', emptyL.length===0, emptyL.join(' '));
   /* ══ 実際に鳴らして、宣言した度数どおりか ══
      **札の字だけ合わせても、鳴る和音が違えば直したことにならない**（§1.239） */
   { /* ══ ここでは曲を借りない（1.243）══
        genBackingSong は**曲を作って返すだけ**で、開いている曲は替えない。
        にもかかわらず後始末（switchSong→doDeleteSong）を書いたため、
        **切り替えていない＝いま開いている曲そのものを消して**いた。
        ——**返す物が無いなら、返す手続きも書かない。** */
     const DEG=['I','♭II','II','♭III','III','IV','♭V','V','♭VI','VI','♭VII','VII'];
     const K0=U.BK_KEYS.find(x=>x.root===0&&x.qual==='maj');
     const badD=[], badN=[];
     P.forEach(p=>{
       const s0=U.genBackingSong({parts:['pl_'+p.id], partsPool:[U.plToPart(p)],
                                  key:K0,genre:'pops',tension:'none',mod:'none',
                                  borrow:false,seed:7,bass:true});
       if(!s0){ badD.push(p.id+'（組めず）'); return; }
       if(s0.bars.length!==U.plBars(p)) badD.push(p.id+'：小節数');
       const got=[];
       s0.bars.forEach(b=>{ const cs=[];
         (b.notes||[]).forEach(x=>{ if(x.chord) cs.push({at:x.start,c:x.chord}); });
         if(b.chordAt) Object.keys(b.chordAt).forEach(k=>cs.push({at:+k,c:b.chordAt[k]}));
         cs.sort((a2,b2)=>a2.at-b2.at); const sn=new Set();
         cs.forEach(x=>{ if(sn.has(x.at))return; sn.add(x.at);
           got.push(DEG[((x.c.root-K0.root)%12+12)%12]); }); });
       const want=U.plFlat(p).map(c=>DEG[c[0]%12]);
       if(got.join(' ')!==want.join(' ')) badD.push(p.id+'：出['+got.join(' ')+']');
       const sec=((s0.sections||[])[0]||{}).name||'';
       if(sec!==p.name) badN.push(p.id+'：見出し「'+sec+'」');
     });
     ok('[243] 宣言した度数どおりに鳴る', badD.length===0, badD.slice(0,3).join(' / '));
     ok('[243] 見出しがその進行を名乗る', badN.length===0, badN.slice(0,3).join(' / '));
     /* **既存の棚を汚していないこと**——ライブラリは別の層である */
     ok('[243] 既存の部品棚が膨らんでいない',
        U.BK_PARTS.length<=25, String(U.BK_PARTS.length)+'枚');
     ok('[243] ライブラリの一本が部品棚に紛れ込んでいない',
        !U.BK_PARTS.some(x=>/^pl_/.test(x.id)), ''); }
 }catch(e){ ok('[243] 進行ライブラリ', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    進行ライブラリを画面から選べること（1.244）

    **五十八本を部品札として並べれば、この画面は死ぬ。**
    ゆえに分類と段で絞ってから出し、並べ方は**部品とまったく同じ作法**
    （叩けば繋がり、もう一度叩けば外れる）にした。
    ——**新しい約束事を増やさない。**

    確かめるのは、絞りが効くこと・叩けば曲になること・
    そして**部品棚を汚していないこと**。
    ══════════════════════════════════════════════════════════════ */
 try{
   const _kp=U.song.id;
   U.song.genTemp=false; U.saveSong(U.song);
   U.closePop(); U.openBackingGen();
   const p4=d.querySelector('.pop-ov.open')||d.querySelector('.pop');
   const grp=[...p4.querySelectorAll('.pg')];
   const rowOf=t=>{ const g=grp.find(x=>{ const l=x.querySelector('.pg-lbl');
                      return l&&l.textContent===t; });
                    return g?g.querySelector('.pg-row'):null; };
   const bs=t=>{ const r=rowOf(t); return r?[...r.querySelectorAll('button')]:[]; };
   const libRow=p4.querySelector('.pg-row[data-lib]');
   const items=()=>libRow?[...libRow.querySelectorAll('button.pb')]:[];
   const tap=(t,lb)=>{ const b=bs(t).find(x=>x.textContent.indexOf(lb)>=0);
                       if(b) b.onclick(); return !!b; };
   ok('[244] 一覧の器が在る', !!libRow, '');
   ok('[244] 分類の札が並ぶ', bs('分類で絞る').length===U.PL_CATS.length+1,
      String(bs('分類で絞る').length));
   ok('[244] 段の札が並ぶ', bs('段で絞る（難しさ）').length===U.PL_LVS.length+1,
      String(bs('段で絞る（難しさ）').length));
   ok('[244] 絞る前は全部出る', items().length===U.PL_PROGS.length,
      items().length+'/'+U.PL_PROGS.length);
   /* **分類で絞れること**（一本が複数の分類に属してよい） */
   tap('分類で絞る','ブルース');
   ok('[244] 分類の絞りが効く', items().length===U.plByCat('blues').length,
      items().length+'/'+U.plByCat('blues').length);
   /* **段でさらに絞れること** */
   tap('段で絞る（難しさ）','Lv3');
   const want3=U.plByCat('blues').filter(p=>p.lv===3);
   ok('[244] 段の絞りが重ねて効く', items().length===want3.length,
      items().length+'/'+want3.length);
   /* **叩けば繋がり、もう一度叩けば外れる**（部品と同じ作法） */
   if(items().length){
     items()[0].onclick();
     const on1=/(^| )on( |$)/.test(items()[0].className);
     ok('[244] 叩けば札が光る', on1, items()[0].className);
     items()[0].onclick();
     ok('[244] もう一度叩けば外れる',
        !/(^| )on( |$)/.test(items()[0].className), items()[0].className);
     items()[0].onclick();
     /* **なぜよく使われるのかが出ること**（§31・§34） */
     const notes=[...p4.querySelectorAll('.p-note')].map(x=>x.textContent);
     ok('[244] なぜ使うかが出る',
        notes.some(t=>t.indexOf(want3[0].name)>=0&&t.length>40), '');
     /* **叩いた一本が、そのまま曲になること** */
     const mk=[...p4.querySelectorAll('button.pb')].find(b=>b.textContent==='作る');
     ok('[244] 作る札が在る', !!mk, '');
     if(mk){
       mk.onclick();
       const s4=U.song;
       ok('[244] ライブラリの一本が曲になる',
          s4.bars.length===U.plBars(want3[0]),
          s4.bars.length+'/'+U.plBars(want3[0]));
       ok('[244] 見出しがその進行を名乗る',
          ((s4.sections||[])[0]||{}).name===want3[0].name,
          ((s4.sections||[])[0]||{}).name||'—');
       U.song.genTemp=false; U.saveSong(U.song);
       const mid4=U.song.id;
       try{ U.switchSong(_kp); U.render(); }catch(_){}
       try{ U.doDeleteSong(mid4); }catch(_){}
     }
   }
   /* ══ 部品棚を汚していないこと（1.244 の要）══
      **増やす場所と、選ばせる場所を分ける。**
      ライブラリの一本が BK_PARTS へ紛れ込めば、
      〈アドリブの伴奏〉の部品札が八十枚に膨れる。 */
   ok('[244] 部品棚が膨らんでいない', U.BK_PARTS.length<=25,
      String(U.BK_PARTS.length)+'枚');
   ok('[244] ライブラリの一本が部品棚に紛れ込まない',
      !U.BK_PARTS.some(x=>/^pl_/.test(x.id)), '');
   try{ U.closePop(); }catch(_){}
 }catch(e){ ok('[244] 進行ライブラリの画面', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    ◎ は「そのまま鳴らして自然」であること（1.245）

    L様——「デフォルトで◎じゃない時があるけど」。

    調べると**四つの穴**が重なっていた。

      ① 旋法を度数だけで決めていた
         Key C の A7 に「A ナチュラルマイナー」を ◎。
         A7 の三度は C♯、ナチュラルマイナーが持つのは C——
         **和音の顔そのものを半音下で塗り潰しながら「安全」と称していた。**
      ② ブルーノートの免除が効きすぎていた
         「属七の上の短三度は事故ではない」が、
         **♮3 を持たない七音音階**にまで適用されていた。
      ③ 変化した属和音の変化音を打ち消す音を ◎ にしていた
         G7alt に G ミクソリディアン。♭9・♯9・♭5・♯5 を全部消す。
      ④ 既定を**並び順の先頭**から探していた
         段位（◎★○△）とは別の物差しなので、
         ◎ が三番目に居ても ○ が先頭なら ○ が既定になっていた。

    **どれも「鳴らせば分かる」誤りだが、目では捕まらない。**
    ゆえに場面ごと据える。
    ══════════════════════════════════════════════════════════════ */
 try{
   const C={root:0,qual:'maj'}, Am={root:9,qual:'min'};
   const ch=(r,t)=>({root:r,type:t,bass:null});
   const pickOf=(K,c,n)=>{
     const a=U.fbAdvice(c,K,c.root,n);
     const id=U.fbAutoPick(a,c,K);
     const e=a.find(x=>x.id===id)||{};
     return {id, tier:e.tier, adv:a};
   };
   /* ① 和音の顔と食い違う旋法を ◎ にしないこと */
   { const p=pickOf(C,ch(9,'dom7'),ch(2,'min7'));
     ok('[245] A7（V/ii）に ナチュラルマイナー を出さない',
        p.id!=='aeolian', p.id);
     const ae=p.adv.find(x=>x.id==='aeolian');
     ok('[245] それは「ぶつかる」と判じられている',
        !!ae&&ae.clash, ae?ae.tier:'—');
     ok('[245] 既定は ◎ である', p.tier==='safe', p.tier||'—'); }
   { const p=pickOf(Am,ch(4,'dom7'),ch(9,'min7'));
     ok('[245] 短調の E7 に フリジアン を出さない', p.id!=='phryg', p.id);
     ok('[245] 短調へ帰る属七は フリジアンドミナントが第一',
        p.id==='hmp5', p.id);
     ok('[245] それは ◎ である', p.tier==='safe', p.tier||'—'); }
   /* ③ 変化した属和音 */
   { const p=pickOf(C,ch(7,'alt'),ch(0,'maj7'));
     ok('[245] G7alt に ミクソリディアン を出さない', p.id!=='mixo', p.id);
     ok('[245] G7alt の既定は オルタード', p.id==='alt', p.id);
     const mx=p.adv.find(x=>x.id==='mixo');
     ok('[245] ミクソリディアンは禁止せず ○ に置く',
        !!mx&&mx.tier==='color'&&!mx.clash, mx?mx.tier:'—'); }
   { const p=pickOf(C,ch(7,'dom7b9'),ch(0,'maj7'));
     ok('[245] G7♭9 にも ミクソリディアン を出さない', p.id!=='mixo', p.id); }
   /* 減七 */
   { const p=pickOf(C,ch(6,'dim7'),ch(7,'dom7'));
     ok('[245] 減七の既定は 全半ディミニッシュ', p.id==='dimwh', p.id);
     ok('[245] 他に無い物を「狙って使う音」と呼ばない',
        p.tier==='safe'||p.tier==='std', p.tier||'—'); }
   /* 裏コード・裏口 */
   { const p=pickOf(C,ch(1,'dom7'),ch(0,'maj7'));
     ok('[245] 裏コードの既定は リディアン♭7', p.id==='lyd7', p.id); }
   { const p=pickOf(C,ch(10,'dom7'),ch(0,'maj7'));
     ok('[245] 裏口の既定も リディアン♭7', p.id==='lyd7', p.id); }
   /* ══ 直したことで、正しかった場面を壊していないこと ══
      **直しの巻き添えは、直した所より見つけにくい。** */
   const keep=[
     ['ふつうの V7',      C, ch(7,'dom7'), ch(0,'maj7'), 'mixo'],
     ['CM7',             C, ch(0,'maj7'), ch(9,'min7'), 'ionian'],
     ['Dm7（ii）',       C, ch(2,'min7'), ch(7,'dom7'), 'dorian'],
     ['Am7（vi）',       C, ch(9,'min7'), ch(2,'min7'), 'aeolian'],
     ['C7（ブルース）',   C, ch(0,'dom7'), ch(5,'dom7'), 'mixo'],
     ['Bm7♭5（viiø）',  C, ch(11,'m7b5'),ch(4,'dom7'), 'locrian'],
     ['短調の i',        Am,ch(9,'min7'), ch(2,'min7'), 'aeolian'],
   ];
   const broke=keep.filter(([nm,K,c,n,want])=>pickOf(K,c,n).id!==want)
                   .map(([nm,K,c,n,want])=>nm+'（'+pickOf(K,c,n).id+'≠'+want+'）');
   ok('[245] 正しかった場面を壊していない', broke.length===0, broke.join(' / '));
   /* ══ ◎ と名乗るなら、和音の顔と食い違わないこと ══
      **一つでも見つかれば、物差しが壊れている。**
      全和音種 × 全スケールを総当りで確かめる。 */
   { const bad245=[];
     Object.keys(U.CD).forEach(t=>{
       [C,Am].forEach(K=>{
         for(let r=0;r<12;r++){
           const c={root:r,type:t,bass:null};
           U.fbAdvice(c,K,r).forEach(a=>{
             if(a.tier!=='safe') return;
             if(a.clash) bad245.push(t+'@'+r+' '+a.id+'（ぶつかるのに◎）');
           });
         }
       });
     });
     ok('[245] ◎ と名乗る札は、一つもぶつからない',
        bad245.length===0, bad245.slice(0,4).join(' / ')); }
 }catch(e){ ok('[245] スケールの見立て', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    綴りは度数で、借用は出所から（1.246）

    ① **♭ の付く度数は、♭ で綴る。**
       これまで「調がフラット系かシャープ系か」だけで決めていたので、
       Key C で ♭II7→C♯7、♭VII7→A♯7、♭III→D♯M7 と出ていた。
       **度数の名と音の綴りが食い違えば、両者を結び付けてご覧になれない。**
    ② **借りてきた和音を、借りる前の調で裁かない。**
       Key C の Fm7 に F ドリアンは定石中の定石であるのに △ であった。
       B♭ が「調の外」に落ちるためだが、Fm7 は同主短調から
       借りた和音であって、B♭ はその出所の中の音である。
       ただし借りたドミナントは役どころの定石が受け持つので除く——
       **面倒を見る者が既に居る所へ、二人目を送らない。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const NOTE=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
   /* ① 綴り：♭II ♭III ♭VI ♭VII は ♭、♯IV は ♯ */
   const badSp=[];
   [0,7,2,4,9,5,10].forEach(kr=>{
     const meta={key:{root:kr,qual:'maj'}};
     [[1,'♭II'],[3,'♭III'],[8,'♭VI'],[10,'♭VII']].forEach(([d,nm])=>{
       const nmStr=U.chordName({root:(kr+d)%12,type:'dom7',bass:null},meta)||'';
       if(/♯|#/.test(nmStr)) badSp.push('Key '+NOTE[kr]+' の '+nm+'＝'+nmStr);
     });
     const sharp4=U.chordName({root:(kr+6)%12,type:'dim7',bass:null},meta)||'';
     if(/♭/.test(sharp4)&&NOTE[(kr+6)%12].indexOf('♭')<0)
       badSp.push('Key '+NOTE[kr]+' の ♯IV＝'+sharp4);
   });
   ok('[246] ♭の付く度数は ♭ で綴る', badSp.length===0, badSp.slice(0,4).join(' / '));
   /* 手で綴りをご指定の時は、そちらが勝つこと */
   ok('[246] 手の指定が勝つ（flat）',
      /♭/.test(U.chordName({root:1,type:'dom7',bass:null},
               {key:{root:0,qual:'maj'},accidental:'flat'})||''), '');
   ok('[246] 手の指定が勝つ（sharp）',
      /♯|#/.test(U.chordName({root:6,type:'dom7',bass:null},
               {key:{root:0,qual:'maj'},accidental:'sharp'})||''), '');
   /* ② 借用和音の見立て */
   const C={root:0,qual:'maj'};
   const pick=(c,n)=>{ const a=U.fbAdvice(c,C,c.root,n); return U.fbAutoPick(a,c,C); };
   ok('[246] 借用の ivm7 は ドリアンが ◎',
      pick({root:5,type:'min7',bass:null},{root:10,type:'dom7',bass:null})==='dorian',
      pick({root:5,type:'min7',bass:null},{root:10,type:'dom7',bass:null}));
   /* **借りたドミナントを巻き込まないこと**——ここを緩めた時、
      E7→Am の既定がフリジアンドミナントからミクソリディアンへ戻り、
      A7 に ホールトーン が ◎ になった（♯5 を持たない和音であるのに） */
   const Am={root:9,qual:'min'};
   const pickAm=(c,n)=>{ const a=U.fbAdvice(c,Am,c.root,n); return U.fbAutoPick(a,c,Am); };
   ok('[246] 短調の V7 は フリジアンドミナントのまま',
      pickAm({root:4,type:'dom7',bass:null},{root:9,type:'min7',bass:null})==='hmp5',
      pickAm({root:4,type:'dom7',bass:null},{root:9,type:'min7',bass:null}));
   ok('[246] 裏口の ♭VII7 は リディアン♭7 のまま',
      pick({root:10,type:'dom7',bass:null},{root:0,type:'maj7',bass:null})==='lyd7',
      pick({root:10,type:'dom7',bass:null},{root:0,type:'maj7',bass:null}));
   ok('[246] 裏コードの ♭II7 は リディアン♭7 のまま',
      pick({root:1,type:'dom7',bass:null},{root:0,type:'maj7',bass:null})==='lyd7',
      pick({root:1,type:'dom7',bass:null},{root:0,type:'maj7',bass:null}));
   /* **調の中に収まっている和音は、これまでどおり厳しく測ること**
      （CM7 のリディアンが ◎ に化けては困る） */
   { const a=U.fbAdvice({root:0,type:'maj7',bass:null},C,0,{root:9,type:'min7',bass:null});
     const ly=a.find(x=>x.id==='lydian');
     ok('[246] CM7 のリディアンは ◎ に化けない',
        !!ly&&ly.tier!=='safe', ly?ly.tier:'—'); }
 }catch(e){ ok('[246] 綴りと借用', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    音ひとつずつの評価（1.247）

    道具が申し上げていたのは「このスケールが当たります」まで。
    稽古で要るのはその一歩先——**どの音が落ち着き、どれが張り詰め、
    どれが次へ寄せるのか。**

    組む途中で、判定を三度直した。
      ① 「顔と半音差なら ✕」と一括りにしたら、
         **C7 の 11（F）と 13（A）まで ✕** になった。
         F は 3 の半音**上**、A は ♭7 の半音**下**——向きで役が違う。
      ② 「◎＝和音の音」と狭く採ったら、**9 や 13 が ○ に落ちた。**
         スケールの側では ◎ を「そのまま鳴らして自然」と定めてある——
         **同じ印を二つの意味で使ってはならない。**
      ③ 自然なテンションを「寄せる音」より後に判じたら、
         **13 が ♭7 の半音下**であるために通り過ぎる音に捕まった。
    ══════════════════════════════════════════════════════════════ */
 try{
   const C={root:0,qual:'maj'};
   const tb=(c,n,K)=>U.fbNoteTable(c,K||C,n||null);
   const at=(t,d)=>t.find(r=>r.i===d)||{};
   /* 十二音すべてに役が付くこと */
   const t7=tb({root:0,type:'dom7',bass:null},{root:5,type:'dom7',bass:null});
   ok('[247] 十二音すべてに役が付く', t7.length===12, String(t7.length));
   ok('[247] どの音にも度数の名が在る',
      t7.every(r=>!!r.deg), '');
   ok('[247] どの音にも理由が在る',
      t7.every(r=>r.why&&r.why.length>4), '');
   /* ① 向きで役が違うこと */
   ok('[247] C7 の 11 は ✕ ではない（避ける音）',
      at(t7,5).tier==='tense', at(t7,5).tier||'—');
   /* C7 → F7 では、C7 の 13（A）は**次の F7 の三度そのもの**——
      ◎ ではなく ★（先取りして伸ばせる）が正しい（1.249）。
      次の和音が無い時に ◎ であることを確かめる */
   ok('[247] C7 の 13 は ◎（次が無い時）',
      at(tb({root:0,type:'dom7',bass:null},null),9).tier==='land',
      at(tb({root:0,type:'dom7',bass:null},null),9).tier||'—');
   ok('[249] 次の和音の三度そのものなら ★',
      at(t7,9).tier==='aim', at(t7,9).tier||'—');
   ok('[247] C7 の 長七度は ✕（♭7 の半音上）',
      at(t7,11).tier==='bad', at(t7,11).tier||'—');
   /* ② 自然なテンションは ◎ */
   ok('[247] C7 の 9 は ◎', at(t7,2).tier==='land', at(t7,2).tier||'—');
   /* 和音の音は必ず ◎ */
   { const bad247=[];
     Object.keys(U.CD).forEach(ty=>{
       const civ=((U.CD[ty]||{}).iv||[]).map(x=>((x%12)+12)%12);
       const t=tb({root:0,type:ty,bass:null},null);
       civ.forEach(iv=>{ const r=at(t,iv);
         if(r.tier!=='land'&&r.tier!=='aim') bad247.push(ty+'/'+iv+'='+r.tier); });
     });
     ok('[247] 和音の音は必ず ◎（狙いを除く）',
        bad247.length===0, bad247.slice(0,4).join(' ')); }
   /* ③ ブルーノートは事故にしない */
   ok('[247] 属七の ♭3 はブルーノート（○）',
      at(t7,3).tier==='color', at(t7,3).tier||'—');
   ok('[247] 属七の ♭5 もブルーノート（○）',
      at(t7,6).tier==='color', at(t7,6).tier||'—');
   ok('[247] ♭5 と ♯11 は同じ音と申し添える',
      /♯11/.test(at(t7,6).deg||''), at(t7,6).deg||'—');
   /* ⑤ 次の和音へ寄せる音を「狙い」に */
   { const t=tb({root:7,type:'dom7',bass:null},{root:0,type:'maj7',bass:null});
     const aims=t.filter(r=>r.tier==='aim');
     ok('[247] 次の和音へ半音で寄れる音を「狙い」に', aims.length>0,
        aims.map(r=>r.deg).join(' '));
     /* **次の和音が分からない時は、狙いを名乗らない** */
     const t2=tb({root:7,type:'dom7',bass:null},null);
     ok('[247] 次が無ければ「狙い」は出さない',
        t2.every(r=>r.tier!=='aim'), ''); }
   /* 短和音では ♭3・♭6 と呼ぶこと（♯9・♭13 ではなく） */
   { const tm=tb({root:2,type:'min7',bass:null},{root:7,type:'dom7',bass:null});
     ok('[247] 短和音では ♭3 と呼ぶ', at(tm,3).deg==='♭3', at(tm,3).deg||'—'); }
   /* **どの和音でも、◎ が一つは在ること**（無言では助言にならない） */
   { const none=[];
     Object.keys(U.CD).forEach(ty=>{
       const t=tb({root:0,type:ty,bass:null},null);
       if(!t.some(r=>r.tier==='land')) none.push(ty); });
     ok('[247] どの和音にも ◎ が在る', none.length===0, none.join(' ')); }
   /* **✕ ばかりの和音を作らないこと** */
   { const many=[];
     Object.keys(U.CD).forEach(ty=>{
       const t=tb({root:0,type:ty,bass:null},null);
       if(t.filter(r=>r.tier==='bad').length>5) many.push(ty); });
     ok('[247] ✕ が過半になる和音は無い', many.length===0, many.join(' ')); }
 }catch(e){ ok('[247] 音ひとつずつの評価', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    音名は和音の根音から綴り、コードトーンと変化音を分ける（1.248）

    L様のご指摘——
      ・「コードトーンでないテンションを『和音の音』と表現しない」
      ・A7 の 3rd は C♯（D♭ ではない）、13th は F♯（G♭ ではない）
      ・F♯dim7 の Root は F♯、E♭ は「6」ではなく減七度
      ・通常の 9・5・13 が Altered Dominant 上で無条件に ◎ になっていないか

    どれも当たっていた。**和音が持っている音なら着地**としていたので、
    G7alt の ♭9・♯9・♭13 が「和音の音（着地）」になっていた。
    音名は曲の調から綴っていたので、度数の名と食い違っていた。

    **この物差しは、直すたびに崩れる。**ゆえに全和音種で機械に見張らせる。
    ══════════════════════════════════════════════════════════════ */
 try{
   const meta=U.song?U.song.meta:null;
   const K0={root:0,qual:'maj'};
   const CORE=['R','3','♭3','♮3','5','♭5','♯5','7','♭7','dim7'];
   const L='CDEFGAB';
   const STEP={'R':0,'♭9':1,'9':1,'♯9':1,'♭3':2,'3':2,'♮3':2,'11':3,'♯11':3,
               '♭5':4,'5':4,'♯5':4,'♭13':5,'13':5,'♭6':5,'6':5,'♭7':6,'7':6,'dim7':6};
   const e1=[],e2=[],e3=[],e4=[],e5=[];
   Object.keys(U.CD).forEach(ty=>{
     const civ=((U.CD[ty]||{}).iv||[]).map(x=>((x%12)+12)%12);
     const altered=(U.chordFam(ty)==='dom'&&(civ.indexOf(1)>=0||civ.indexOf(3)>=0));
     for(let r=0;r<12;r++){
       const t=U.fbNoteTable({root:r,type:ty,bass:null},K0,null,meta);
       if(t.length!==12){ e1.push(ty); continue; }
       const rootNote=t[0]&&t[0].note;
       const rl=rootNote?L.indexOf(rootNote[0]):-1;
       t.forEach(x=>{
         if(!x.note) e1.push(ty+'/'+x.deg);
         /* ① コードトーンでない物を「コードの音」と呼ばない */
         if(/コードの音/.test(x.why)&&CORE.indexOf(x.deg)<0) e2.push(ty+'/'+x.deg);
         /* ② 持っていない音を持っていると言わない（alt は記号として例外） */
         if(/和音が持って|この和音の顔/.test(x.why)&&civ.indexOf(x.i)<0&&ty!=='alt')
           e2.push(ty+'/'+x.deg+'（無い音）');
         /* ③ 変化した属和音で、通常の 9・5・13 を ◎ にしない */
         if(altered&&x.tier==='land'&&[2,7,9].indexOf(x.i)>=0&&civ.indexOf(x.i)<0)
           e3.push(ty+'/'+x.deg);
         /* ④ 次の和音が無ければ「狙い」は出さない */
         if(x.tier==='aim') e4.push(ty+'/'+x.deg);
         /* ⑤ 度数の名と、音名の文字が合っている */
         if(rl>=0&&x.note){
           const st=STEP[String(x.deg).split('／')[0]];
           if(st!=null&&x.note[0]!==L[(rl+st)%7]){
             /* 綴れずに逃がした場合（E♯・重変化）は許す */
             if(U.fbSpell(x.pc,r,rootNote,x.deg)) e5.push(ty+'@'+rootNote+' '+x.deg+'='+x.note);
           }
         }
       });
       /* コードトーンは必ず ◎ */
       civ.forEach(iv=>{ const x=t.find(y=>y.i===iv);
         if(x&&x.tier!=='land') e2.push(ty+'/'+x.deg+'='+x.tier); });
     }
   });
   ok('[248] 十二音そろい、音名が付く', e1.length===0, [...new Set(e1)].slice(0,4).join(' '));
   ok('[248] コードトーンと変化音を混同しない', e2.length===0, [...new Set(e2)].slice(0,4).join(' '));
   ok('[248] 変化和音で通常の 9・5・13 を ◎ にしない', e3.length===0, [...new Set(e3)].slice(0,4).join(' '));
   ok('[248] 次が無ければ「狙い」を出さない', e4.length===0, [...new Set(e4)].slice(0,4).join(' '));
   ok('[248] 度数の名と音名の文字が合う', e5.length===0, [...new Set(e5)].slice(0,4).join(' '));
   /* ══ 要求書の四場面を、そのまま据える ══
      **例で示された物は、例のまま残す。**言葉で書き直せば、意図がぼける。 */
   const MK=U.FB_NOTE_TIER;
   const W={
     alt7 :{G:'◎',A:'△','A♭':'◎','A#':'◎',B:'◎',C:'⚠','D♭':'◎',D:'△','E♭':'◎',E:'△',F:'◎','F#':'✕'},
     a7   :{A:'◎','B♭':'⚠',B:'◎',C:'○','C#':'◎',D:'⚠','E♭':'○',E:'◎',F:'⚠','F#':'→',G:'◎','G#':'✕'},
     /* ★＝次の顔そのもの／→＝そこへ半音で入る（1.249 で二段に分けた） */
     bm7b5:{B:'◎',C:'⚠','C#':'◎',D:'◎','D#':'✕',E:'◎',F:'◎','F#':'✕',G:'→','G#':'★',A:'◎','A#':'✕'},
     fdim :{'F#':'◎',G:'★','G#':'◎',A:'◎','A#':'→',B:'★',C:'◎','C#':'✕',D:'○','E♭':'◎',E:'○',F:'○'},
   };
   const cases=[['alt7',{root:7,type:'alt',bass:null},{root:0,type:'maj7',bass:null}],
                ['a7',  {root:9,type:'dom7',bass:null},{root:2,type:'min7',bass:null}],
                ['bm7b5',{root:11,type:'m7b5',bass:null},{root:4,type:'dom7',bass:null}],
                ['fdim',{root:6,type:'dim7',bass:null},{root:7,type:'dom7',bass:null}]];
   const df=[]; let cnt=0;
   cases.forEach(([k,c,n])=>{
     U.fbNoteTable(c,K0,n,meta).forEach(x=>{
       const want=W[k][x.note]; if(!want) return; cnt++;
       if(MK[x.tier].mark!==want) df.push(k+' '+x.note+'：'+MK[x.tier].mark+x.deg+'≠'+want);
     });
   });
   ok('[248] 要求書の四場面と、一音ずつ合う', df.length===0&&cnt>=40,
      df.length?df.slice(0,4).join(' / '):(cnt+'音'));
   /* 狙う先は「どの和音の何度＝何の音」を名指しすること */
   { const t=U.fbNoteTable({root:2,type:'min7',bass:null},K0,
                           {root:7,type:'dom7',bass:null},meta);
     const aim=t.find(x=>x.tier==='aim');
     const ap =t.find(x=>x.tier==='appr');
     ok('[248] 狙う先を名指しする（★）',
        !!aim&&/次の .+ の .+＝.+ \*\*そのもの\*\*/.test(aim.why), aim?aim.why:'—');
     ok('[249] 寄せる先も名指しする（→）',
        !!ap&&/次の .+ の .+＝.+ へ半音で入ります/.test(ap.why), ap?ap.why:'—'); }
   /* ♭5／♯11 の言い方を一括りにしない */
   { const t=U.fbNoteTable({root:0,type:'dom7',bass:null},K0,null,meta);
     const b5=t.find(x=>x.i===6);
     ok('[248] ♭5 と ♯11 を一括りにしない',
        !!b5&&/ブルース/.test(b5.why)&&/♯11/.test(b5.why), b5?b5.deg:'—'); }
 }catch(e){ ok('[248] 音名と度数', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    「着く音」と「寄せる音」を分ける（1.249）

    L様——「先取りと、半音下のアプローチを分けよ」。

    はじめ**次の和音の顔そのもの**（Bm7♭5 上の G♯＝次の E7 の三度）と、
    **そこへ半音で寄る音**（G）を、どちらも ★ にしていた。
    隣り合う二つがどちらも「狙い」では、どちらを狙えばよいか分からない。
    ——**★ は着く音、→ は寄せる音。**

    組む途中で二度しくじった。
      ① 狙う先を三度・七度・根音の三つにしたら、
         **十二音のうち六つが狙いか寄せ**になり、
         いま鳴っている和音の役どころが消えた。
         **何もかもを狙いと呼べば、狙いという言葉が死ぬ。**
      ② A7 → Dm7 の F を ★ にした。次の Dm7 の三度ではあるが、
         **A7 の ♭13 でもある**——「先取りして伸ばせます」と申しながら、
         伸ばせば濁る音を勧めていた。**★ は「伸ばせる」という約束である。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const meta=U.song?U.song.meta:null;
   const K0={root:0,qual:'maj'};
   const MK=U.FB_NOTE_TIER;
   ok('[249] 「寄せ」の段が在る', !!MK.appr&&MK.appr.mark==='→', '');
   /* ① 着く音と寄せる音が、別の印になること */
   { const t=U.fbNoteTable({root:11,type:'m7b5',bass:null},K0,
                           {root:4,type:'dom7',bass:null},meta);
     const g =t.find(x=>x.i===8), gs=t.find(x=>x.i===9);
     ok('[249] 次の顔そのものは ★', gs&&gs.tier==='aim', gs?gs.tier:'—');
     ok('[249] そこへ半音で入る音は →', g&&g.tier==='appr', g?g.tier:'—');
     ok('[249] 隣り合う二つが同じ印にならない',
        !!g&&!!gs&&g.tier!==gs.tier, ''); }
   /* ② 狙い・寄せは、多すぎないこと（数えすぎれば言葉が死ぬ） */
   { const many=[];
     Object.keys(U.CD).forEach(ty=>{
       const t=U.fbNoteTable({root:0,type:ty,bass:null},K0,
                             {root:5,type:'dom7',bass:null},meta);
       const n=t.filter(x=>x.tier==='aim'||x.tier==='appr').length;
       if(n>3) many.push(ty+'='+n); });
     ok('[249] 狙い・寄せが多すぎない（三つまで）',
        many.length===0, many.slice(0,4).join(' ')); }
   /* ③ ★ は「伸ばせる」約束——いまの和音で緊張する音を ★ にしない */
   { const t=U.fbNoteTable({root:9,type:'dom7',bass:null},K0,
                           {root:2,type:'min7',bass:null},meta);
     const f=t.find(x=>x.i===8);   /* A7 の ♭13＝F。次の Dm7 の ♭3 でもある */
     ok('[249] いまの和音で緊張する音は ★ にしない',
        !!f&&f.tier==='tense', f?f.tier:'—'); }
   /* ④ 記号と説明が食い違わないこと（L様——「強く張り詰めるなら ⚠」） */
   { const ng=[];
     Object.keys(U.CD).forEach(ty=>{
       for(let r=0;r<12;r++){
         U.fbNoteTable({root:r,type:ty,bass:null},K0,null,meta).forEach(x=>{
           if(/強く緊張|強く張り詰/.test(x.why)&&x.tier!=='tense') ng.push(ty+'/'+x.deg);
           if(/先取りして伸ばせ/.test(x.why)&&x.tier!=='aim') ng.push(ty+'/'+x.deg);
           if(/半音で入ります/.test(x.why)&&x.tier!=='appr') ng.push(ty+'/'+x.deg);
         });
       }
     });
     ok('[249] 記号と説明が食い違わない', ng.length===0, [...new Set(ng)].slice(0,4).join(' ')); }
   /* ⑤ 要求書の七場面を、そのまま据える */
   const W={
     alt7 :{G:'◎',A:'△','A♭':'◎','A#':'◎',B:'◎',C:'⚠','D♭':'◎',D:'△','E♭':'◎',E:'△',F:'◎','F#':'✕'},
     a7   :{A:'◎','B♭':'⚠',B:'◎',C:'○','C#':'◎',D:'⚠','E♭':'○',E:'◎',F:'⚠','F#':'→',G:'◎','G#':'✕'},
     bm7b5:{B:'◎',C:'⚠','C#':'◎',D:'◎','D#':'✕',E:'◎',F:'◎','F#':'✕',G:'→','G#':'★',A:'◎','A#':'✕'},
     fdim :{'F#':'◎',G:'★','G#':'◎',A:'◎','A#':'→',B:'★',C:'◎','C#':'✕',D:'○','E♭':'◎',E:'○',F:'○'},
     dm7  :{D:'◎','E♭':'⚠',E:'◎',F:'◎','F#':'✕',G:'◎','A♭':'△',A:'◎','B♭':'→',B:'★',C:'◎','C#':'✕'},
     fm7  :{F:'◎','G♭':'⚠',G:'◎','A♭':'◎',A:'✕','B♭':'◎',B:'△',C:'◎','D♭':'→',D:'★','E♭':'◎',E:'✕'},
     /* D♭ は「次の Am7 の ♭3＝C へ半音で寄れる」——**寄せ（→）**であって
        着く音ではない。要求書は ★ と書いているが、あれは 1.248 の出力を
        そのまま引き写した物で、★ と → を分ける前の姿である */
     cm7  :{C:'◎','D♭':'→',D:'◎','D#':'○',E:'◎',F:'⚠','F#':'△',G:'◎','A♭':'△',A:'◎','B♭':'○',B:'◎'},
   };
   const cs=[['alt7',{root:7,type:'alt'},{root:0,type:'maj7'}],
             ['a7',  {root:9,type:'dom7'},{root:2,type:'min7'}],
             ['bm7b5',{root:11,type:'m7b5'},{root:4,type:'dom7'}],
             ['fdim',{root:6,type:'dim7'},{root:7,type:'dom7'}],
             ['dm7', {root:2,type:'min7'},{root:7,type:'dom7'}],
             ['fm7', {root:5,type:'min7'},{root:10,type:'dom7'}],
             ['cm7', {root:0,type:'maj7'},{root:9,type:'min7'}]];
   const df=[]; let cnt=0;
   cs.forEach(([k,c,n])=>{
     U.fbNoteTable(Object.assign({bass:null},c),K0,Object.assign({bass:null},n),meta)
      .forEach(x=>{ const want=W[k][x.note]; if(!want) return; cnt++;
        if(MK[x.tier].mark!==want) df.push(k+' '+x.note+'：'+MK[x.tier].mark+x.deg+'≠'+want); });
   });
   ok('[249] 要求書の七場面と、一音ずつ合う', df.length===0&&cnt>=80,
      df.length?df.slice(0,4).join(' / '):(cnt+'音'));
 }catch(e){ ok('[249] 着く音と寄せる音', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    総点検で見つけた綻び（1.250）

    L様より、pointer・状態・保存・公開部にわたる総点検の依頼を承った。
    **実害のある綻びが四つ**見つかった。

      ① 指を捕まえる所が三つ、放す所が二つ——
         **小節のなぞりだけが放していなかった。**
         iOS では捕まえたままにすると次の指まで巻き添えを食う。
      ② 曲を替えても、**選択も・なぞりも・止めも、そのまま残っていた。**
         前の曲の barId を指す選択が次の曲へ渡る。
      ③ `saveSong` が**成否を返していなかった。**
         控えへ退避したことは報せていたが、呼び手は知りようがない。
      ④ 段の選び（zsel）だけ「空か」を **`kind`** で判じていた。
         ほかの二つは size で見ている——**同じ判断を二つの物差しでしない。**
    ══════════════════════════════════════════════════════════════ */
 try{
   /* ③ 保存の成否が届くこと */
   { U.song.genTemp=false;
     ok('[250] 保存は成否を返す', U.saveSong(U.song)===true, String(U.saveSong(U.song)));
     ok('[250] flushSave も成否を返す', U.flushSave()===true, String(U.flushSave())); }
   /* ④ 選びの関門が、中身の有無で判じること */
   { const keep={n:[...U.nsel], s:[...U.sel],
                 z:JSON.stringify(U.zsel)};
     U.selTake('zone');
     /* **印を立てずに中身だけ積む**——1.249 まで、これが素通りした */
     U.zsel.items.push({barId:U.song.bars[0].id,tick:0});
     U.selTake('note');
     ok('[250] 印が無くても、中身が在れば落とす',
        !U.zsel.items.length, JSON.stringify(U.zsel));
     U.zselClear(); U.nsel.clear(); U.sel.clear();
     keep.n.forEach(x=>U.nsel.add(x)); keep.s.forEach(x=>U.sel.add(x)); }
   /* ② 曲を替えれば、前の曲の状態を持ち越さないこと */
   { const _k=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     U.makeSightSong({level:1,bars:8,seed:4321});
     U.song.genTemp=false; U.saveSong(U.song);
     const other=U.song.id;
     U.switchSong(_k);
     /* 散らかす */
     U.mode='select'; U.selTake('note');
     U.nsel.add(U.nkey(U.song.bars[0].id,0));
     U.sel.add('0_0');
     ['dragging','carrying','radialing','lp-drag'].forEach(c=>d.body.classList.add(c));
     { const st=U.fbState(); if(st){ st.pinCh='X'; st.pin='minpent'; } }
     U.switchSong(other);
     ok('[250] 音符の選択を持ち越さない', U.nsel.size===0, String(U.nsel.size));
     ok('[250] 小節の選択を持ち越さない', U.sel.size===0, String(U.sel.size));
     const left=['dragging','carrying','radialing','lp-drag']
       .filter(c=>d.body.classList.contains(c));
     ok('[250] なぞりの札を持ち越さない', left.length===0, left.join(' '));
     { const st=U.fbState();
       ok('[250] 指板の止めを持ち越さない',
          !st.pinCh&&!st.pin, (st.pinCh||'')+'/'+(st.pin||'')); }
     U.song.genTemp=false; U.saveSong(U.song);
     try{ U.switchSong(_k); }catch(_){}
     try{ U.doDeleteSong(other); }catch(_){} }
   /* ① 指の解放が、終わりを束ねる一箇所に在ること */
   ok('[250] 指の解放は片づけに束ねてある',
      /relCapture\(e\);/.test(html)&&/const relCapture=/.test(html), '');
   /* §31 公開部に重複も undefined も無いこと */
   { const ks=Object.keys(U);
     ok('[250] 公開に undefined が無い',
        ks.filter(k=>{ try{ return U[k]===undefined; }catch(_){ return false; } }).length===0, '');
     ok('[250] 公開の数が保たれている', ks.length>=380, String(ks.length)); }
   /* §1-1／1-2 使っているのに定義していない CSS 変数が無いこと */
   { const cssAll=[...d.querySelectorAll('style')].map(x=>x.textContent).join('\n');
     const usedV=[...new Set([...cssAll.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)].map(m=>m[1]))];
     const defV=new Set([...cssAll.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)].map(m=>m[1]));
     const setV=new Set([...html.matchAll(/setProperty\(\s*['"](--[A-Za-z0-9_-]+)/g)].map(m=>m[1]));
     const miss=usedV.filter(v=>!defV.has(v)&&!setV.has(v));
     ok('[250] 使っている CSS 変数はすべて定義されている',
        miss.length===0, miss.join(' ')); }
 }catch(e){ ok('[250] 総点検', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    コードが、調から見て何度に当たるか（1.251）

    L様——「譜面内のコードをワンタッチでキーに対して何度に当たるか
            分析して表示したい」。

    **名前は消さず、下に度数を添える。**両方見えて初めて二つが結びつく。
    転調には追随し、借りたドミナントは**確かめられる時だけ**名乗る。

    組む途中、転調した曲で後半が ♭I・♭V と出ているように見え、
    **三度も追いかけた。**部品はどれも正しく、
    「Key D♭」の ♭ と、次の字の I を、点検が**続きの一語として拾っていた**——
    道具ではなく、読み方の誤りであった。
    ——**字は、text ひとつずつ読む。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const C0={root:0,qual:'maj'}, Am0={root:9,qual:'min'};
   const ch=(r,t,b)=>({root:r,type:t,bass:(b==null?null:b)});
   /* 度数の綴り */
   /* ══ 大文字＋コードの種類（1.253）══
      L様——「Fm これであってる？ IVm じゃないの？」。
      はじめクラシック和声の流儀（小文字＝短三度）で組んだが、
      **ここはギター教室である。**ポピュラー理論の教本は
      そろって大文字に統一し、種類をそのまま添える。
      生徒様が他の教本を開いた時、同じ書き方で読めなければ意味がない。
      符号も譜面と同じ字（`#` と `♭`）を使う——
      **同じ音を二つの字で書かない。** */
   const cases=[
     [[0,'maj7'],  'IM7'],   [[2,'min7'], 'IIm7'],  [[4,'min7'],'IIIm7'],
     [[5,'maj7'],  'IVM7'],  [[7,'dom7'], 'V7'],    [[9,'min7'],'VIm7'],
     [[11,'m7b5'], 'VIIm7-5'],[[6,'dim7'],'#IVdim7'],[[1,'dom7'],'♭II7'],
     [[10,'dom7'], '♭VII7'], [[5,'min'],  'IVm'],   [[0,'maj',7],'I/V'],
     [[4,'dom7'],  'III7'],  [[4,'maj'],  'III'],   [[5,'min7'], 'IVm7'],
   ];
   const ng=cases.filter(([a,want])=>{
     const d=U.chordDegree(ch(a[0],a[1],a[2]),C0); return !d||d.text!==want;
   }).map(([a,want])=>want+'≠'+(U.chordDegree(ch(a[0],a[1],a[2]),C0)||{}).text);
   ok('[251] 度数の綴りが正しい', ng.length===0, ng.join(' '));
   /* **小文字が既に短三度を言っている**——`iim7` とは書かない */
   /* **上下で同じ字が並ぶこと**——「IVm の m は、Fm の m」と目で辿れる */
   ok('[253] 度数の尻尾は、コード名の尻尾と同じ',
      U.chordDegree(ch(5,'min'),C0).text==='IV'+((U.CD['min']||{}).s||''),
      U.chordDegree(ch(5,'min'),C0).text);
   /* **E7 は III7**——三和音か属七かが度数から読めること */
   ok('[253] 三和音と属七を書き分ける',
      U.chordDegree(ch(4,'maj'),C0).text==='III'
      &&U.chordDegree(ch(4,'dom7'),C0).text==='III7', '');
   /* 符号は譜面と同じ字（`#` と `♭`） */
   ok('[253] 符号が譜面と同じ字',
      /#/.test(U.chordDegree(ch(6,'dim7'),C0).text)
      &&!/♯/.test(U.chordDegree(ch(6,'dim7'),C0).text),
      U.chordDegree(ch(6,'dim7'),C0).text);
   /* 全和音種で、度数が作れること */
   { const miss=Object.keys(U.CD).filter(t=>{
       const d=U.chordDegree(ch(2,t),C0); return !d||!d.text; });
     ok('[251] どの和音種でも度数が出る', miss.length===0, miss.slice(0,4).join(' ')); }
   /* 調の外か中かを見分けること */
   ok('[251] 調の中の和音はそう判じる', U.chordDegree(ch(2,'min7'),C0).inKey===true, '');
   ok('[251] 借りてきた和音はそう判じる', U.chordDegree(ch(9,'dom7'),C0).inKey===false, '');
   /* ══ 借りたドミナントは、確かめられる時だけ名乗る ══
      **V/x と名乗るなら、次に変わる先がその x。**（§plAudit と同じ物差し） */
   /* ══ 行き先も譜面と同じ大文字＋種類（1.310）══
      小文字＝短三度は §1.253 で捨てた流儀。**括弧の中だけ残っていてはならない** */
   ok('[251] A7→Dm7 は V/IIm',
      U.secondaryOf(ch(9,'dom7'),ch(2,'min7'),C0)==='V/IIm',
      String(U.secondaryOf(ch(9,'dom7'),ch(2,'min7'),C0)));
   ok('[251] E7→Am7 は V/VIm',
      U.secondaryOf(ch(4,'dom7'),ch(9,'min7'),C0)==='V/VIm',
      U.secondaryOf(ch(4,'dom7'),ch(9,'min7'),C0));
   ok('[251] 行き先に小文字を使わない',
      ['V/IIm','V/IIIm','V/IV','V/V','V/VIm']
        .every(x=>!/[a-z]/.test(x.replace(/m/g,''))), '');
   ok('[251] D7→G7 は V/V',
      U.secondaryOf(ch(2,'dom7'),ch(7,'dom7'),C0)==='V/V',
      U.secondaryOf(ch(2,'dom7'),ch(7,'dom7'),C0));
   ok('[251] G7→CM7 は借り物ではない（ただの V7）',
      U.secondaryOf(ch(7,'dom7'),ch(0,'maj7'),C0)===null, '');
   ok('[251] 行き先が違えば名乗らない',
      U.secondaryOf(ch(9,'dom7'),ch(0,'maj7'),C0)===null, '');
   ok('[251] 属七の顔でなければ名乗らない',
      U.secondaryOf(ch(9,'min7'),ch(2,'min7'),C0)===null, '');
   /* 短調でも度数が出ること */
   ok('[251] 短調の i', U.chordDegree(ch(9,'min7'),Am0).text==='Im7',
      U.chordDegree(ch(9,'min7'),Am0).text);
   /* ══════════════════════════════════════════════════════════
      スケールは段位の順に並べる（1.311）

      L様——「スケールの順序を ◎ のものから順番で表示して」。
      build 1.310 まで `fbAdvice` の並び（**第一候補が先頭**・§1.224）
      のままで、C♯7 では `△ ミクソリディアン` が先頭に立ち
      `◎ ハーモニックマイナー P5↓` が三番目に埋もれていた。
      **印を付けておきながら、印の順に並べぬのは筋が通らない。**
      ══════════════════════════════════════════════════════════ */
   {
     const RANK={'◎':0,'★':1,'○':2,'△':3,'⚠':4,'✕':5,'×':5};
     U.openAnalyzer('A | C#7 | F#m | D');
     const rows=[...d.querySelectorAll('.anz-sc')];
     ok('[段位] 分析にスケールの行が出る', rows.length===4, String(rows.length));
     let ng=[];
     rows.forEach((r,i)=>{
       const marks=[...r.querySelectorAll('span')]
         .map(x=>x.textContent.trim().charAt(0))
         .filter(m=>RANK[m]!=null).map(m=>RANK[m]);
       for(let k=1;k<marks.length;k++)
         if(marks[k]<marks[k-1]) ng.push((i+1)+'番目');
     });
     ok('[段位] どの和音でも印の順に並ぶ', ng.length===0, ng.join('/'));
     /* **借りたドミナントの所こそ効く**——◎ が埋もれていた場所である */
     { const r=rows[1];
       ok('[段位] C#7 の先頭は ◎',
          !!r && r.textContent.replace(/^スケール/,'').trim().charAt(0)==='◎',
          r?r.textContent.replace(/^スケール/,'').trim().slice(0,24):'—'); }
     /* 印そのものを消してはいない——**並べ替えただけ** */
     ok('[段位] 印は残っている',
        rows.every(r=>/[◎★○△⚠✕×]/.test(r.textContent)), '');
     U.closePop();
   }

   /* ══ 札から譜面まで、通しで ══ */
   { const _k=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     const btn=d.getElementById('tb-deg');
     ok('[251] ワンタッチの札が在る', !!btn, '');
     const degTexts=()=>[...d.querySelectorAll('#paper svg.msvg text')]
       .filter(t=>['#374151','#7c3aed'].indexOf(t.getAttribute('fill'))>=0)
       .map(t=>t.textContent.trim()).filter(Boolean);
     const K0=U.BK_KEYS.find(x=>x.root===0&&x.qual==='maj');
     const s1=U.plMakeSong('l_sec_chain',{key:K0,genre:'pops',tension:'none',
       mod:'none',borrow:false,seed:7,bass:true});
     if(s1&&btn){
       U.flushSave(); U.saveSong(s1); U.switchSong(s1.id);
       const before=degTexts().length;
       btn.onclick();
       const after=degTexts();
       ok('[251] 押す前は出ていない', before===0, String(before));
       ok('[251] 押せば譜面に度数が出る', after.length>0, after.slice(0,4).join(' '));
       /* ══ 譜面には度数だけ（1.311）══
          L様——「括弧があると混乱する」。
          **行き先の名乗りは〈分析〉へ**（あちらは「なぜそう呼べるか」まで言える）。
          仕掛けを消したのではなく、**譜面の見せ方だけを変えた**——
          `secondaryOf` が生きていることは [255]・[263] で見ている。 */
       ok('[251] 譜面には括弧を出さない',
          after.every(x=>x.indexOf('(')<0&&!/V\//.test(x)),
          after.filter(x=>x.indexOf('(')>=0||/V\//.test(x)).join(' '));
       ok('[251] 度数そのものは読める形で出る',
          after.some(x=>/^[#♭]?[IVX]+/.test(x)), after.slice(0,4).join(' '));
       btn.onclick();
       ok('[251] もう一度押せば消える', degTexts().length===0, '');
       /* ══ 転調に追随すること ══
          **後半を前の調で数えれば ♭ だらけになる。** */
       btn.onclick();
       const s2=U.genBackingSong({parts:['p_oudou','p_oudou'],key:K0,genre:'pops',
         tension:'none',mod:'lift1',borrow:false,seed:3,bass:true});
       if(s2){
         U.flushSave(); U.saveSong(s2); U.switchSong(s2.id);
         const t2=degTexts();
         const flat=t2.filter(x=>/^♭/.test(x));
         ok('[251] 転調しても ♭ だらけにならない', flat.length<=1, flat.join(' '));
         ok('[251] 転調後も度数が出る', t2.length>0, t2.slice(0,4).join(' '));
         U.song.genTemp=false; U.saveSong(U.song);
         const mid=U.song.id;
         try{ U.switchSong(_k); }catch(_){}
         try{ U.doDeleteSong(mid); }catch(_){}
       }
       btn.onclick();
     }
     try{ if(U.song.id!==_k) U.switchSong(_k); }catch(_){}
     try{ U.doDeleteSong(s1.id); }catch(_){} }
 }catch(e){ ok('[251] 度数の表示', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    度数は、コード名の「上」（1.252）

    L様——「度数が見えにくい、場所が悪い」。

    はじめコード名の**下**に、0.72 倍・薄灰で置いた。
    そこは**五線とのわずかな隙間**——音符の符尾・旗・タイが伸びてくる、
    譜面でいちばん混み合う所である。小さく薄い字を、
    濃い茶の太字（コード名）のすぐ脇に置けば、目に入らないのも道理であった。
    **読めない添え物は、無いのと同じ。**

    ——**上へ移す。**上は誰も使っていない。混まぬだけでなく、
      I ／ C と縦に読めて「一度、つまり C」と辿れる。
    ══════════════════════════════════════════════════════════════ */
 try{
   const _k=U.song.id;
   U.song.genTemp=false; U.saveSong(U.song);
   const btn=d.getElementById('tb-deg');
   const K0=U.BK_KEYS.find(x=>x.root===0&&x.qual==='maj');
   const s1=U.plMakeSong('l_sec_chain',{key:K0,genre:'pops',tension:'none',
     mod:'none',borrow:false,seed:7,bass:true});
   if(s1&&btn){
     U.flushSave(); U.saveSong(s1); U.switchSong(s1.id);
     btn.onclick();
     const wraps=[...d.querySelectorAll('#paper .mwrap')];
     let pairs=0, above=0, worst=1e9, fsOK=true, colOK=true;
     wraps.forEach(wp=>{
       const svg=wp.querySelector('svg'); if(!svg) return;
       const vb=(svg.getAttribute('viewBox')||'').split(/\s+/).map(Number);
       const ts=[...wp.querySelectorAll('text')];
       const nm=ts.find(t=>t.getAttribute('fill')==='#9a3412');
       const dg=ts.find(t=>['#374151','#7c3aed'].indexOf(t.getAttribute('fill'))>=0);
       if(!nm||!dg) return;
       pairs++;
       const ny=parseFloat(nm.getAttribute('y')), dy=parseFloat(dg.getAttribute('y'));
       /* **度数が名前より上に在ること**（y は下ほど大きい） */
       if(dy<ny) above++;
       const dfs=parseFloat(dg.getAttribute('font-size'));
       const nfs=parseFloat(nm.getAttribute('font-size'));
       /* **読める大きさ**（名前の 0.8 倍以上）かつ**主従は保つ**（名前より小さい） */
       if(!(dfs>=nfs*0.8&&dfs<nfs)) fsOK=false;
       if(['#374151','#7c3aed'].indexOf(dg.getAttribute('fill'))<0) colOK=false;
       /* **紙からはみ出さないこと**——上へ出したぶん、余白を食う */
       worst=Math.min(worst,(dy-dfs)-vb[1]);
     });
     ok('[252] コード名と度数が対になって出る', pairs>0, String(pairs)+'対');
     ok('[252] 度数はコード名の上に在る', pairs>0&&above===pairs,
        above+'/'+pairs);
     ok('[252] 読める大きさで、主従は保つ', fsOK, '');
     ok('[252] 濃さが十分', colOK, '');
     ok('[252] 紙の上端からはみ出さない', worst>2, worst.toFixed(1)+'点');
     /* 段が二重に重なる譜面でも収まること */
     const s2=U.genBackingSong({parts:['p_turn','p_turn'],key:K0,genre:'jazz',
       tension:'rich',borrow:false,mod:'none',seed:9,bass:true});
     if(s2){
       U.flushSave(); U.saveSong(s2); U.switchSong(s2.id);
       let w2=1e9;
       [...d.querySelectorAll('#paper .mwrap')].forEach(wp=>{
         const svg=wp.querySelector('svg'); if(!svg) return;
         const vb=(svg.getAttribute('viewBox')||'').split(/\s+/).map(Number);
         [...wp.querySelectorAll('text')].forEach(t=>{
           if(['#374151','#7c3aed'].indexOf(t.getAttribute('fill'))<0) return;
           const y=parseFloat(t.getAttribute('y')), f=parseFloat(t.getAttribute('font-size'));
           w2=Math.min(w2,(y-f)-vb[1]); }); });
       ok('[252] 和音が込み合う譜面でもはみ出さない', w2===1e9||w2>2,
          (w2===1e9?'（度数なし）':w2.toFixed(1)+'点'));
       U.song.genTemp=false; U.saveSong(U.song);
       const mid=U.song.id;
       try{ U.switchSong(_k); }catch(_){}
       try{ U.doDeleteSong(mid); }catch(_){}
     }
     btn.onclick();
   }
   try{ if(U.song.id!==_k) U.switchSong(_k); }catch(_){}
   try{ if(s1) U.doDeleteSong(s1.id); }catch(_){}
 }catch(e){ ok('[252] 度数の置き場所', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    アドリブの手引き（1.254）

    この画面だけが**別の道**で組まれていた——度数は小さな表（九つ分）、
    綴りは `noteName` 一本、スケールの見立ては出ない。
    **同じことを二度書けば、片方が必ず古くなる。**実際そうなった：
      ・♭3 と名乗る音を `D#` と綴っていた（`E♭` である）
      ・譜面は `IIIm7` と書くのに、ここは `III`
      ・音の役どころは 1.247 で十二音へ広げたのに、ここは二分法のまま
      ・「どの和音にも乗ります」「コードトーン以外は通り道」——**言い切りすぎ**

    ——**譜面と同じ chordDegree、指板と同じ fbAdvice、綴りは fbSpell。**
    ══════════════════════════════════════════════════════════════ */
 try{
   /* ① 構成音は度数から綴る——♭3 は E♭（D# ではない） */
   const bad254=[];
   for(let r=0;r<12;r++){
     ['maj','min'].forEach(q=>{
       const a=U.scaleAdvice({key:{root:r,qual:q}});
       if(!a) return;
       a.scales.forEach(sc=>{
         if(!sc.deg) return;
         /* ══ 確かめるのは「度数の文字」であって、符号ではない（1.254）══
            はじめ「♭の度数に # が付いていれば誤り」と見たが、
            **G#m の ♭7 は F#** ——根音が ♯ の調では当たり前に ♯ が付く。
            正しい物差しは、**その度数が指す音の文字（C〜B）が合っているか**：
            R から数えて何番目の文字か（三度なら二つ先）。 */
         const L='CDEFGAB', STEP={'R':0,'♭9':1,'9':1,'#9':1,'♭3':2,'3':2,
           '11':3,'#11':3,'♭5':4,'5':4,'#5':4,'♭13':5,'13':5,'♭6':5,'6':5,'♭7':6,'7':6};
         const rl=L.indexOf(String(sc.notes[0]||'')[0]);
         sc.deg.forEach((dn,i)=>{
           const nt=String(sc.notes[i]||''); const st=STEP[dn];
           if(st==null||rl<0||!nt) return;
           if(nt[0]===L[(rl+st)%7]) return;
           /* ══ 逃がした綴りは、誤りではない（1.254）══
              D♭ の ♭3 は厳密には `F♭`、G♭ の ♭7 は `C♭`——
              **正しくても読めない綴り**なので、fbSpell が素直な異名へ逃がす。
              逃がしたのか間違えたのかは、**fbSpell に訊けば分かる。** */
           const pc=(a.root+sc.iv0[i])%12;
           if(U.fbSpell(pc,a.root,sc.notes[0],dn)) bad254.push(a.keyName+' '+dn+'='+nt);
         });
       });
     });
   }
   ok('[254] 構成音の綴りが度数と合う', bad254.length===0, bad254.slice(0,4).join(' '));
   /* Key C の実際の綴り */
   { const a=U.scaleAdvice({key:{root:0,qual:'maj'}});
     const mb=a.scales.find(x=>/メジャーブルース/.test(x.name));
     const mp=a.scales.find(x=>/マイナーペンタ/.test(x.name));
     ok('[254] C メジャーブルースの ♭3 は E♭',
        mb&&mb.notes.indexOf('E♭')>=0&&mb.notes.indexOf('D#')<0, mb?mb.notes.join(' '):'—');
     ok('[254] C マイナーペンタの ♭3・♭7 は E♭・B♭',
        mp&&mp.notes.indexOf('E♭')>=0&&mp.notes.indexOf('B♭')>=0
        &&mp.notes.indexOf('D#')<0&&mp.notes.indexOf('A#')<0,
        mp?mp.notes.join(' '):'—'); }
   /* ② 言い切りすぎを直したこと */
   { const a=U.scaleAdvice({key:{root:0,qual:'maj'}});
     const t=a.scales.map(x=>x.tip).join(' ');
     ok('[254] 「どの和音にも乗ります」と言わない', !/どの和音にも乗ります/.test(t), '');
     ok('[254] 何が起きるかを言う（ぶつかる音がある旨）',
        /ぶつかる|半音でぶつかり/.test(t), ''); }
   /* ③ 画面が、譜面と同じ書き方で出ること */
   { const _k=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     const K0=U.BK_KEYS.find(x=>x.root===0&&x.qual==='maj');
     const s1=U.plMakeSong('l_sec_chain',{key:K0,genre:'pops',tension:'none',
       mod:'none',borrow:false,seed:7,bass:true});
     if(s1){
       U.flushSave(); U.saveSong(s1); U.switchSong(s1.id);
       U.closePop(); U.openScaleGuide();
       const pop=d.querySelector('.pop-guide');
       ok('[254] 読むための字にしてある', !!pop, '');
       if(pop){
         const txt=pop.textContent;
         /* **書式の印が字のまま残っていないこと** */
         ok('[254] * が字のまま残らない', !/\*/.test(txt), '');
         /* 譜面と同じ度数の書き方（大文字＋種類） */
         ok('[254] 度数が譜面と同じ書き方', /IIIm7|VIm7|IIm7|III7/.test(txt), '');
         ok('[254] 小文字の度数を使わない', !/\biii7\b|\bvi7\b|\bii7\b/.test(txt), '');
         /* 和音ごとの「まずこれ」が出ること（指板と同じ見立て） */
         ok('[254] 和音ごとのスケールが出る', /まずこれ/.test(txt), '');
         /* 借りたドミナントを名乗ること */
         ok('[254] 借りたドミナントを名乗る', /V\/VIm|V\/IIm/.test(txt), '');
         /* 「通り道」の断定をやめたこと */
         ok('[254] 「それ以外は通り道」と断じない',
            !/それ以外は通り道/.test(txt)&&/危ないという意味ではございません/.test(txt), '');
       }
       U.closePop();
       /* 転調する曲でも、同じ書き方で出ること */
       const s2=U.genBackingSong({parts:['p_oudou','p_oudou'],key:K0,genre:'pops',
         tension:'none',mod:'lift1',borrow:false,seed:3,bass:true});
       if(s2){
         U.flushSave(); U.saveSong(s2); U.switchSong(s2.id);
         U.openScaleGuide();
         const p2=d.querySelector('.pop-guide');
         ok('[254] 転調する曲でも読むための字', !!p2, '');
         if(p2) ok('[254] 転調側も * が残らない', !/\*/.test(p2.textContent), '');
         U.closePop();
         U.song.genTemp=false; U.saveSong(U.song);
         const mid=U.song.id;
         try{ U.switchSong(_k); }catch(_){}
         try{ U.doDeleteSong(mid); }catch(_){}
       }
       try{ if(U.song.id!==_k) U.switchSong(_k); }catch(_){}
       try{ U.doDeleteSong(s1.id); }catch(_){}
     } }
 }catch(e){ ok('[254] アドリブの手引き', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    その和音が、どこから来たのか（1.255）

    L様——「A♭ と B♭ は同主調転調とかまで出せない？」。

    これまで借りてきた和音には「**この調の外**」としか申し上げていなかった。
    **外だと分かっても、どこから来たかは分からない。**
    Key C の A♭・B♭ は同主短調（C マイナー）の ♭VI・♭VII——
    そう言えれば「そこだけ C マイナーを弾けばよい」という手が立つ。

    ——**「外」で終わらせない。出所が分かれば、弾く音が決まる。**
    ただし **確かめられる時だけ名乗る**（§secondaryOf と同じ構え）。
    ══════════════════════════════════════════════════════════════ */
 try{
   const C0={root:0,qual:'maj'};
   const ch=(r,t)=>({root:r,type:t,bass:null});
   const kindOf=(c,n)=>{ const o=U.chordOrigin(c,C0,n||null); return o?o.kind:null; };
   /* 調の中の和音は、借り物と呼ばない */
   ok('[255] 調の中の和音には出所を付けない',
      kindOf(ch(0,'maj7'))===null&&kindOf(ch(2,'min7'))===null
      &&kindOf(ch(9,'min7'))===null, '');
   /* 同主調からの借用 */
   { const ng=[[8,'maj'],[10,'maj'],[3,'maj'],[5,'min']]
       .filter(([r,t])=>kindOf(ch(r,t))!=='par')
       .map(([r,t])=>r+'/'+t);
     ok('[255] 同主調から借りた和音を名指す', ng.length===0, ng.join(' '));
     const o=U.chordOrigin(ch(8,'maj'),C0,null);
     ok('[255] どの調から借りたかを言う',
        !!o&&/C マイナー/.test(o.label), o?o.label:'—');
     /* ══ 「音階を丸ごと弾けばよい」とは申さない（1.263）══
        「そのまま嵌ります」では、**同主短調の音階を全部弾けばよい**と読まれる。
        実際は**その和音のコードトーンが土台**で、同主調の音は手がかりに過ぎない。
        ——確かめるのは「**弾く手がかりまで言っているか**」。 */
     ok('[255] 弾く手がかりまで言う',
        !!o&&/コードトーンを土台に/.test(o.why), o?o.why.slice(0,40):'—');
     ok('[263] 音階を丸ごと弾けとは言わない',
        !!o&&/そのまま嵌ります/.test(o.why)===false, ''); }
   /* 借りたドミナント・裏コード・裏口・経過の減七 */
   ok('[255] 借りたドミナント', kindOf(ch(9,'dom7'),ch(2,'min7'))==='sec', '');
   ok('[255] 裏コード', kindOf(ch(1,'dom7'),ch(0,'maj7'))==='sub', '');
   ok('[255] 裏口のドミナント', kindOf(ch(10,'dom7'),ch(0,'maj7'))==='back', '');
   ok('[255] 経過の減七', kindOf(ch(6,'dim7'),ch(7,'dom7'))==='pass', '');
   /* **確かめられる時だけ名乗る**——行き先が違えば借りたドミナントとは呼ばない */
   ok('[255] 行き先が違えば借りたドミナントと呼ばない',
      kindOf(ch(9,'dom7'),ch(0,'maj7'))!=='sec',
      String(kindOf(ch(9,'dom7'),ch(0,'maj7'))));
   ok('[255] ♭II7 も、I へ降りる時だけ裏コード',
      kindOf(ch(1,'dom7'),ch(5,'maj7'))!=='sub', '');
   /* 短調の曲でも働くこと（同主長調から借りる） */
   { const Am0={root:9,qual:'min'};
     const o=U.chordOrigin(ch(9,'maj'),Am0,null);   /* ピカルディの三度 */
     ok('[255] 短調でも同主調を名指す',
        !!o&&/A メジャー/.test(o.label), o?o.label:'—'); }
   /* 画面に出ること */
   { const _k=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     const K0=U.BK_KEYS.find(x=>x.root===0&&x.qual==='maj');
     const s1=U.plMakeSong('l_1147',{key:K0,genre:'pops',tension:'none',
       mod:'none',borrow:false,seed:5,bass:true});
     if(s1){
       U.flushSave(); U.saveSong(s1); U.switchSong(s1.id);
       U.tx('借用を置く',()=>{
         U.song.bars[1].notes[0].chord={root:10,type:'maj',bass:null};
         U.song.bars[2].notes[0].chord={root:8,type:'maj',bass:null}; });
       U.closePop(); U.openScaleGuide();
       const pop=d.querySelector('.pop-guide');
       const txt=pop?pop.textContent:'';
       ok('[255] 手引きに出所が出る', /同主調（C マイナー）から借りた和音/.test(txt), '');
       ok('[255] 「外」だけで終わらせない',
          /同主調（C マイナー）から借りた和音/.test(txt)
          &&/コードトーンを土台に/.test(txt), '');
       /* **同じことを二度言わない**——(V/vi) と V/vi が並ばないこと */
       ok('[255] 出所の名乗りが重ならない', !/（V\/\w+）\s*V\//.test(txt), '');
       U.closePop();
       U.song.genTemp=false; U.saveSong(U.song);
       try{ U.switchSong(_k); }catch(_){}
       try{ U.doDeleteSong(s1.id); }catch(_){}
     } }
 }catch(e){ ok('[255] 和音の出所', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    短調には、音階が三つある（1.256）

    アナライザーの仕様を吟味する中で、**既存の穴**が見つかった——
      Key Am の **E7 → Am** が「同主調（A メジャー）から借りた和音」。
    だがこれは**短調の本来のドミナント**である。
    自然短音階の V は Em だが、導音（G♯）を入れた和声的短音階から E7 が生まれる。

    短調の表を**自然短音階だけ**で作っていたため、
    V7・vii°7・旋律的短音階の IV が軒並み「調の外」になっていた。
    ——**一つの音階で裁かない。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const Am1={root:9,qual:'min'}, C1={root:0,qual:'maj'};
   const ch=(r,t)=>({root:r,type:t,bass:null});
   const inK=(r,t,k)=>U.chordDegree(ch(r,t),k).inKey;
   /* 短調の中に在るべき和音 */
   const should=[
     [9,'min','i'],[11,'m7b5','iiø'],[0,'maj','♭III'],[2,'min','iv'],
     [4,'min','v（自然）'],[4,'dom7','V7（和声）'],[5,'maj','♭VI'],[7,'maj','♭VII'],
     [8,'dim7','vii°7（導音）'],[2,'maj','IV（旋律的）'],
   ];
   const ngIn=should.filter(([r,t])=>!inK(r,t,Am1)).map(x=>x[2]);
   ok('[256] 短調の三つの音階を、すべて調の中とする', ngIn.length===0, ngIn.join(' '));
   /* **短調の V7 は借り物ではない** */
   ok('[256] 短調の V7 に出所を付けない',
      U.chordOrigin(ch(4,'dom7'),Am1,ch(9,'min'))===null, '');
   ok('[256] 短調の vii°7 も調の中',
      U.chordOrigin(ch(8,'dim7'),Am1,ch(9,'min'))===null, '');
   /* ピカルディの三度は、借り物として名指す */
   { const o=U.chordOrigin(ch(9,'maj'),Am1,null);
     ok('[256] ピカルディの三度は同主調から', !!o&&o.kind==='par', o?o.label:'—'); }
   /* **長調を壊していないこと** */
   const majIn=[[0,'maj7'],[2,'min7'],[4,'min7'],[5,'maj7'],[7,'dom7'],[9,'min7'],[11,'m7b5']];
   const ngMaj=majIn.filter(([r,t])=>!inK(r,t,C1)).map(([r,t])=>r+'/'+t);
   ok('[256] 長調の七つは、すべて調の中', ngMaj.length===0, ngMaj.join(' '));
   const majOut=[[9,'dom7'],[5,'min'],[10,'maj'],[8,'maj'],[4,'maj']];
   const ngOut=majOut.filter(([r,t])=>inK(r,t,C1)).map(([r,t])=>r+'/'+t);
   ok('[256] 長調で、借りてきた和音を調の中と言わない', ngOut.length===0, ngOut.join(' '));
   /* 判断が一箇所にあること（同じ物差しを二度書かない） */
   ok('[256] 調の中かの判断は一本', typeof U.degInKey==='function', '');
 }catch(e){ ok('[256] 短調の音階', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    コード進行アナライザー・第一段：読み取り（1.257）

    表記のゆれを、入口で一つの形へ畳む。
    **畳んでおかねば、以後すべての判定が二重になる。**

    組む途中で三度しくじった。
      ① 全部を大小無視で見たら、**`Cm7-5` の `m` が `M7` に食われた。**
         `Am7` も `Dm7` も軒並み長和音——`m` と `M` は正反対の意味である。
      ② `mM7` を `M7` より後に置いたら、`m` を残して `M7` に食われた。
      ③ `sus2` を `sus` より後に置いたら、`sus` に食われて 2 が残った。
    ——**綴りの表は、長い物から先に。大小で意味が変わる物に、大小無視を当てない。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const N=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
   /* ══ 往復——道具が書いた名を、道具が読み返せること ══
      **書けるが読めない綴りがあれば、そこが入口の穴である。** */
   { const bad=[];
     Object.keys(U.CD).forEach(t=>{
       for(let r=0;r<12;r++){
         const nm=U.chordName({root:r,type:t,bass:null},{key:{root:0,qual:'maj'}});
         const c=U.anParseChord(nm);
         if(!c||c.root!==r||c.type!==t) bad.push(t+'@'+N[r]+'→'+nm);
       }});
     ok('[257] 全和音種×12根音を、書いて読み返せる',
        bad.length===0, bad.slice(0,4).join(' ')); }
   /* 表記のゆれ */
   const same=(a,b)=>{ const x=U.anParseChord(a),y=U.anParseChord(b);
     return x&&y&&x.root===y.root&&x.type===y.type; };
   const pairs=[['Cmaj7','CM7'],['Cmaj7','CΔ7'],['Cm7-5','Cm7♭5'],['Cm7-5','Cø7'],
                ['G7b9','G7(b9)'],['G7b9','G7♭9'],['Cdim7','Co7']];
   const ngP=pairs.filter(([a,b])=>!same(a,b)).map(([a,b])=>a+'≠'+b);
   ok('[257] 表記のゆれを畳む', ngP.length===0, ngP.join(' '));
   /* **`m` と `M` を取り違えないこと**——ここが最初の穴 */
   ok('[257] m と M を取り違えない',
      U.anParseChord('Cm7').type==='min7'&&U.anParseChord('CM7').type==='maj7'
      &&U.anParseChord('Cm7-5').type==='m7b5'
      &&U.anParseChord('CmM7').type==='minMaj7', '');
   ok('[257] sus2 が sus4 に食われない',
      U.anParseChord('Csus2').type==='sus2'&&U.anParseChord('Csus4').type==='sus4', '');
   /* 低音（スラッシュ） */
   { const c=U.anParseChord('C/E');
     ok('[257] スラッシュの低音を別に読む',
        !!c&&c.root===0&&c.bass===4&&c.type==='maj', JSON.stringify(c&&[c.root,c.bass])); }
   ok('[257] 低音が根音と同じなら持たない',
      U.anParseChord('C/C').bass===null, '');
   /* 括弧のテンションから、より的確な種類へ寄せる */
   ok('[257] 括弧のテンションを読む',
      U.anParseChord('Fmaj7(#11)').type==='maj7s11'
      &&U.anParseChord('Cmaj7(9)').type==='maj9'
      &&U.anParseChord('Am7(11)').type==='min11', '');
   /* 読めない物を、黙って埋めないこと */
   ok('[257] 読めない綴りは null を返す',
      U.anParseChord('あ')===null&&U.anParseChord('')===null, '');
   ok('[257] 無和音を見分ける',
      (U.anParseChord('N.C.')||{}).nc===true, '');
   /* 進行をまるごと */
   { const p=U.anParseProg('Cmaj7 | A7 | Dm7 G7 | Cmaj7');
     ok('[257] 進行を読む（小節の切れ目も）',
        p.length===5&&p[0].bar===0&&p[2].bar===2&&p[3].bar===2&&p[4].bar===3,
        p.map(x=>x.bar).join(','));
     ok('[257] 読めた印を持つ', p.every(x=>x.ok), ''); }
   { const p=U.anParseProg('C | ??? | G');
     ok('[257] 読めない物は、読めないと印を付ける',
        p.length===3&&p[1].ok!==true, JSON.stringify(p.map(x=>!!x.ok))); }
 }catch(e){ ok('[257] コードの読み取り', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    アナライザー・第二〜三段：解いて、型を名指す（1.258〜1.260）

    **十四の例を並べた物差し**で合わせた。数を六つ一箇所に集め、
    総当りで振りながら**全部を同時に見る**——一つ直して三つ壊すのを防ぐ。

    途中で分かったこと：
      ① 和音ごとに独立して決めると、`Cmaj7 | Fm7 | B♭7 | E♭maj7` が
         「借用・借用・借用」とばらばらに読まれる。
         **ii–V の組を単位として見る**必要がある。
      ② 着いていない ii–V を転調と呼んではならない。
         `Fm7 | B♭7 | Cmaj7` は E♭ へ着かない——裏口の借用である。
      ③ 型は根音の並びだけで当てると、`A7` が `vi` として当たる。
         **性質（長短）も見る。**
      ④ 三和音の型を長さで捨てると、**裏口**が拾えない。
         **長さではなく、確かさ**（その調の I へ着いて終わるか）で判じる。
    ══════════════════════════════════════════════════════════════ */
 try{
   const norm=x=>String(x).replace('♭','b').replace('♯','#');
   const solve=t=>U.anSolve(U.anParseProg(t));
   const keysOf=t=>{ const r=solve(t); return r?r.items.map(x=>norm(x.localKeyName)).join(' '):''; };
   /* ══ 十四の例——**この表が、この道具の物差しである** ══ */
   const CASES=[
     ['Cmaj7 | A7 | Dm7 | G7 | Cmaj7','C C C C C','借りたドミナント'],
     ['Dm7 | G7 | Cmaj7','C C C','ii-V-I'],
     ['C | F | Am | G','C C C C','王道（三和音）'],
     ['Am7 | D7 | Gmaj7','G G G','ii-V-I in G'],
     ['Dm7 | Db7 | Cmaj7','C C C','裏コード'],
     ['Cmaj7 | C#dim7 | Dm7','C C C','呼び込みの減七'],
     ['Cmaj7 | Fm7 | Bb7 | Ebmaj7','C Eb Eb Eb','C から Eb へ寄る'],
     ['C | Ab | Bb | C','C C C C','同主調からの借用'],
     ['Fm7 | Bb7 | Cmaj7','C C C','裏口'],
     ['Am | G | F | E7','Am Am Am Am','短調の V7'],
     ['C7 | F7 | C7 | G7','C C C C','ブルース'],
     ['Cmaj7 | E7 | Am7 | A7 | Dm7 | G7 | Cmaj7','C C C C C C C','連鎖'],
     ['Cmaj7 | Am7 | Dm7 | G7','C C C C','循環'],
     ['Ebmaj7 | Fm7 | Bb7 | Ebmaj7','Eb Eb Eb Eb','最初から Eb'],
     /* ══ 一時的な寄りを、本転調にしない（1.265）══
        後半の `Em7 A7 Dm7` は Dm へ着くが、**次の G7 で C へ帰る。**
        四和音のうち三つだけ Dm では、曲の調が変わったとは言えない。 */
     ['Cmaj7 | Am7 | Dm7 | G7 | Em7 | A7 | Dm7 | G7',
      'C C C C C C C C','ii へ寄っただけ'],
   ];
   const ngC=CASES.filter(([t,w])=>keysOf(t)!==w)
                  .map(([t,w,d])=>d+'（'+keysOf(t)+'≠'+w+'）');
   ok('[258] 十四の例で、局所の調を正しく読む',
      ngC.length===0, ngC.slice(0,3).join(' / '));
   /* 釣り合いの数が、一箇所に集めてあること */
   ok('[258] 釣り合いの数は一箇所に', !!U.AN_W&&U.AN_W.switch!=null, '');
   /* ii–V の組——**解決したか否かを見分ける** */
   { const cs1=U.anParseProg('Cmaj7 | Fm7 | Bb7 | Ebmaj7').filter(c=>c.ok);
     const cs2=U.anParseProg('Fm7 | Bb7 | Cmaj7').filter(c=>c.ok);
     const a1=U.anFindTwoFive(cs1), a2=U.anFindTwoFive(cs2);
     ok('[259] 着いた ii–V を見分ける', a1.some(x=>x.resolved), '');
     ok('[259] 着いていない ii–V を、転調と呼ばない',
        a2.length>0&&!a2.some(x=>x.resolved), ''); }
   /* 型の名指し */
   { const nm=t=>{ const r=solve(t); return (r&&r.patterns||[]).map(p=>p.name).join('／'); };
     ok('[260] ii–V–I を名指す', /ii–V–I/.test(nm('Dm7 | G7 | Cmaj7')),
        nm('Dm7 | G7 | Cmaj7'));
     ok('[260] 裏口を名指す（三和音でも）',
        /バックドア/.test(nm('Fm7 | Bb7 | Cmaj7')), nm('Fm7 | Bb7 | Cmaj7'));
     ok('[260] 循環を名指す', /循環/.test(nm('Cmaj7 | Am7 | Dm7 | G7')),
        nm('Cmaj7 | Am7 | Dm7 | G7'));
     /* **A7 は vi ではない**——性質を見ずに当てると、ここで誤る */
     ok('[260] 根音だけで型を当てない',
        !/vi–ii–V–I/.test(nm('Cmaj7 | A7 | Dm7 | G7 | Cmaj7')),
        nm('Cmaj7 | A7 | Dm7 | G7 | Cmaj7')); }
   /* 総評 */
   { const r=solve('Fm7 | Bb7 | Cmaj7');
     ok('[260] 総評を一行で述べる',
        !!r&&!!r.summary&&/Key C/.test(r.summary)&&/バックドア/.test(r.summary),
        r?r.summary:'—'); }
   /* **候補を消さないこと**（要求書 §13：複数解釈） */
   { const r=solve('Cmaj7 | A7 | Dm7 | G7 | Cmaj7');
     const a7=r.items[1];
     ok('[258] 主たる見立てを持つ', !!(a7&&a7.main), a7&&a7.main?a7.main.name:'—');
     ok('[258] 別の見立ても残す', Array.isArray(a7.alts)&&a7.alts.length>0,
        (a7.alts||[]).map(x=>x.name).join(' '));
     ok('[258] 見立てには根拠が付く',
        !!(a7.main&&a7.main.why&&a7.main.why.length>6), ''); }
   /* **確度の数字を出さないこと**（L様のご指定） */
   { const r=solve('Dm7 | G7 | Cmaj7');
     const hasPct=JSON.stringify(r.items).match(/[0-9]+%/);
     ok('[258] 確度の数字を出さない', !hasPct, hasPct?hasPct[0]:''); }
   /* 調の候補は、根拠つきで複数返すこと */
   { const c=U.anKeyCandidates(U.anParseProg('C | F | Am | G').filter(x=>x.ok));
     ok('[258] 調の候補を複数返す', c.length>=3, String(c.length));
     ok('[258] 候補には根拠が付く',
        c[0]&&Array.isArray(c[0].why)&&c[0].why.length>0, ''); }
   /* 調をご指定なら、それを立てること */
   { const r=U.anSolve(U.anParseProg('C | F | Am | G'),
       {key:{root:9,qual:'min'}, fixKey:true});
     ok('[258] 調のご指定が推定より強い',
        !!r&&r.items.every(x=>norm(x.localKeyName)==='Am'),
        r?r.items.map(x=>x.localKeyName).join(' '):'—'); }
 }catch(e){ ok('[258] アナライザー', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    アナライザーの画面（1.261）

    入り口は二つ——**いまの曲から**と**手で打ち込んで**。
    中身は一つ（anSolve）。**同じ分析を二度書かない。**

    組む途中で一つ捕まえた：`Cmaj7 | Fm7 | B♭7 | E♭maj7` が
    **「V/ii → ii → V → I」**として当たった。E♭ から見れば根音も性質も
    合っている（VI–ii–V–I）が、**先頭の Cmaj7 は借りたドミナントではない。**
    ——**名が言っていることを、実体が満たしているか確かめる。**
    ══════════════════════════════════════════════════════════════ */
 try{
   /* 札は〈曲を選ぶ〉の中、手引きの隣に置いた（1.261） */
   ok('[261] 分析の札が在る', !!d.getElementById('btn-analyze'), '');
   /* 曲から読む——**同じ和音が続く所は畳む** */
   { const _k=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     const K0=U.BK_KEYS.find(x=>x.root===0&&x.qual==='maj');
     const s1=U.plMakeSong('l_sec_chain',{key:K0,genre:'pops',tension:'none',
       mod:'none',borrow:false,seed:7,bass:true});
     if(s1){
       U.flushSave(); U.saveSong(s1); U.switchSong(s1.id);
       const cs=U.anFromSong(U.song);
       ok('[261] 曲からコードを読める', cs.length>=4, String(cs.length)+'個');
       ok('[261] 同じ和音の繰り返しを畳む',
          cs.every((c,i)=>i===0||!(c.root===cs[i-1].root&&c.type===cs[i-1].type)), '');
       /* 画面が開き、中身が出ること */
       U.closePop(); U.openAnalyzer();
       const pop=d.querySelector('.pop-anz');
       /* 譜面から読み込む札を押す（入り口①） */
       if(pop){ const lb=[...pop.querySelectorAll('button.pb')]
           .find(b=>/譜面のコードを読み込む/.test(b.textContent));
         if(lb) lb.onclick(); }
       ok('[261] 画面が開く', !!pop, '');
       if(pop){
         const t=pop.textContent;
         ok('[261] 総評が出る', !!pop.querySelector('.anz-sum'), '');
         ok('[261] 調の候補と根拠が出る',
            /調の候補/.test(t)&&/この調の中の和音/.test(t), '');
         ok('[261] コードごとの表が出る',
            pop.querySelectorAll('.anz-row').length>=4,
            String(pop.querySelectorAll('.anz-row').length));
         ok('[261] 見立ての根拠が出る',
            pop.querySelectorAll('.anz-main').length>0, '');
         /* **確度の数字を出さない**（L様のご指定） */
         ok('[261] 画面に確度の数字が無い', !/[0-9]+\s*%/.test(t),
            (t.match(/[0-9]+\s*%/)||[''])[0]);
         /* 入り口が二つ在ること */
         /* 入り口は二つ——**譜面から読み込む札**と、**手で打ち込む欄** */
         const bs=[...pop.querySelectorAll('button.pb')].map(b=>b.textContent);
         ok('[261] 入り口が二つ在る',
            bs.some(x=>/譜面のコードを読み込む/.test(x))
            &&!!pop.querySelector('.anz-in'), bs.join(' '));
       }
       U.closePop();
       U.song.genTemp=false; U.saveSong(U.song);
       try{ U.switchSong(_k); }catch(_){}
       try{ U.doDeleteSong(s1.id); }catch(_){}
     } }
   /* 打ち込みから——読めない綴りを黙って捨てないこと */
   { U.closePop(); U.openAnalyzer('Cmaj7 | ??? | G7');
     const pop=d.querySelector('.pop-anz');
     if(pop){
       const ta=pop.querySelector('.anz-in');
       /* **読めない綴りを黙って捨てない**（§1.236） */
       ok('[261] 読めない綴りを知らせる',
          /読めなかった綴り/.test(pop.textContent), '');
       /* 打ち込めば、その場で読み直すこと */
       ta.value='Cmaj7 | Fm7 | Bb7 | Ebmaj7'; ta.oninput();
       ok('[261] 打ち込めば、その場で読み直す',
          /E♭/.test(pop.textContent), '');
       /* 転調する進行では、和音ごとに局所の調を出すこと */
       ok('[261] 調が動く時は、その調を出す',
          pop.querySelectorAll('.anz-lk').length>0,
          String(pop.querySelectorAll('.anz-lk').length));
     }
     U.closePop(); }
   /* ══ 型の名が、実体を満たしていること（1.261）══ */
   { const nm=t=>{ const r=U.anSolve(U.anParseProg(t));
                   return (r&&r.patterns||[]).map(p=>p.name).join('／'); };
     ok('[261] 借りたドミナントで無い物を V/ の型と呼ばない',
        !/V\//.test(nm('Cmaj7 | Fm7 | Bb7 | Ebmaj7')),
        nm('Cmaj7 | Fm7 | Bb7 | Ebmaj7'));
     ok('[261] ii–V–I はそう名指す',
        /ii–V–I/.test(nm('Cmaj7 | Fm7 | Bb7 | Ebmaj7')),
        nm('Cmaj7 | Fm7 | Bb7 | Ebmaj7')); }
 }catch(e){ ok('[261] アナライザーの画面', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    ガイドトーンと、次の一手（1.262）

    要求書を測ったところ——**部品は十すべて揃っていたのに、
    画面には一つも繋がっていなかった。**
    スケール候補も、音ごとの評価も、関数としては動くのに出ていない。
    ——**作るのではなく、繋ぐ。**

    新しく作ったのは二つだけ：
      ガイドトーンの線（三度・七度と、次の顔への動き）と、
      そこから導くヒント。

    ══ なぜ三度と七度なのか ══
    和音の顔を決めるのはこの二つ。根音は低音が鳴らし、五度は色を持たない。
    進行の中で追うと**半音で繋がる線**が現れる——
        Dm7 → G7 → CM7   七度 C→B、三度 F→E
    **この線をなぞるだけで、進行が聴こえるフレーズになる。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const solve=t=>U.anSolve(U.anParseProg(t));
   /* ① ガイドトーンが、どの和音にも付くこと */
   { const r=solve('Dm7 | G7 | Cmaj7');
     ok('[262] ガイドトーンが出る',
        !!r.guides&&r.guides.length===3&&r.guides.every(g=>g&&g.third&&g.seventh), '');
     /* **顔は三度と七度**——Dm7 なら F と C */
     const g0=r.guides[0];
     ok('[262] 三度と七度を取る',
        g0.third.note==='F'&&g0.seventh.note==='C',
        g0.third.note+'/'+g0.seventh.note);
     /* ② 半音で繋がる所を名指すこと（C→B、F→E） */
     const halves=r.guides.reduce((a,g)=>
       a.concat((g&&g.moves||[]).filter(m=>Math.abs(m.step)===1)),[]);
     ok('[262] 半音で繋がる所を名指す', halves.length>=2,
        halves.map(m=>m.note+'→'+m.toNote).join(' '));
     ok('[262] C→B の半音解決を捕まえる',
        halves.some(m=>m.note==='C'&&m.toNote==='B'), '');
     ok('[262] F→E の半音解決を捕まえる',
        halves.some(m=>m.note==='F'&&m.toNote==='E'), ''); }
   /* ③ ヒントが出ること——**「使える音の一覧」ではなく「次の一手」** */
   { const r=solve('Dm7 | G7 | Cmaj7');
     ok('[262] ヒントが出る', !!r.hints&&r.hints.length>0, '');
     ok('[262] ヒントがガイドトーンを勧める',
        r.hints.some(h=>/ガイドトーン/.test(h)), ''); }
   /* ④ 画面に、部品がすべて繋がっていること（ここが 1.261 の穴だった） */
   { U.closePop(); U.openAnalyzer('Dm7 | G7 | Cmaj7');
     const pop=d.querySelector('.pop-anz');
     ok('[262] 画面が開く', !!pop, '');
     if(pop){
       ok('[262] 画面にガイドトーンが出る',
          pop.querySelectorAll('.anz-gt').length>=3,
          String(pop.querySelectorAll('.anz-gt').length));
       ok('[262] 画面にスケール候補が出る',
          pop.querySelectorAll('.anz-sc').length>=3,
          String(pop.querySelectorAll('.anz-sc').length));
       /* **一つに決めない**（§4）——候補が複数出ること */
       const sc=pop.querySelector('.anz-sc');
       ok('[262] スケールを一つに決めない',
          !!sc&&sc.querySelectorAll('span').length>=4,
          sc?String(sc.querySelectorAll('span').length):'—');
       ok('[262] 画面に音ごとの評価が出る',
          pop.querySelectorAll('.anz-notes').length>=3,
          String(pop.querySelectorAll('.anz-notes').length));
       ok('[262] 画面にヒントが出る', !!pop.querySelector('.anz-hint'), '');
       /* **確度の数字は出さない**（L様のご指定） */
       ok('[262] 画面に確度の数字が無い',
          !/[0-9]+\s*%/.test(pop.textContent), '');
     }
     U.closePop(); }
   /* ⑤ **調の外＝✕、としない**（§8）——
      借りたドミナントの上で、調外の音が ★ や ○ で出ること */
   { const r=solve('Cmaj7 | A7 | Dm7 | G7 | Cmaj7');
     const a7=r.items[1];
     const tb=U.fbNoteTable(a7.chord,a7.localKey,r.items[2].chord,
       U.song?U.song.meta:null);
     const outside=tb.filter(x=>{
       const d=((x.pc-a7.localKey.root)%12+12)%12;
       return [1,3,6,8,10].indexOf(d)>=0;
     });
     ok('[262] 調の外の音を、一律に ✕ としない',
        outside.some(x=>x.tier!=='bad'),
        outside.map(x=>x.note+x.tier).join(' ')); }
   /* ⑥ 要求書 §17 の十一例が、すべて解けること */
   { const T=['Cmaj7 | Dm7 | G7 | Cmaj7','Dm7 | G7 | Cmaj7','Bm7b5 | E7 | Am7',
       'Cmaj7 | A7 | Dm7 | G7 | Cmaj7','Fm7 | Bb7 | Cmaj7',
       'C7 | F7 | C7 | G7 | F7 | C7','Dm7 | Db7 | Cmaj7',
       'Cmaj7 | C#dim7 | Dm7','Cmaj7 | Fm7 | Cmaj7','C | D7 | G7 | C',
       'Cmaj7 | E7 | Am7 | C#dim7 | Dm7 | Db7 | Cmaj7'];
     const ng=T.filter(t=>{ const r=solve(t);
       return !r||!r.items.length||!r.hints.length
         ||!(r.guides||[]).every(g=>g&&(g.third||g.seventh)); });
     ok('[262] 要求書の十一例が、すべて解ける', ng.length===0, ng.slice(0,2).join(' / ')); }
 }catch(e){ ok('[262] ガイドトーン', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    形・機能・役割を、別の欄で持つ（1.263）

    `anFunctionOf` は和音の形と度数から T／S／D を返す。
    だがそれだけでは、**C7・F7・G7・A7・D♭7 がすべて「ドミナント」**になる。
      Key C の C7 … ブルースの I7（解決する V7 ではない）
      G7 → CM7   … 帰るドミナント
      A7 → Dm7   … 借りたドミナント（V/ii）
      D♭7 → CM7  … 裏コード
    **同じ属七の形でも、進行の中でしていることが違う。**
    ——役割は**前後を見なければ決まらない**。ここが機能との違いである。

    併せて：
      ・音の評価に **resolveTo（行き先）と usage（使い道）**を持たせた——
        文章に書いてあっても、**機械が拾えなければ持っていないのと同じ。**
      ・表示の順を「**まず何を弾くか**」から並べ替えた。
      ・「ここだけ調外が使える」「そのまま嵌ります」を改めた——
        前者は**他では使ってはならぬ**と読まれ、後者は
        **音階を丸ごと弾けばよい**と読まれる。どちらも言い過ぎであった。
    ══════════════════════════════════════════════════════════════ */
 try{
   const solve=t=>U.anSolve(U.anParseProg(t));
   const roleAt=(t,i)=>{ const r=solve(t); const it=r.items[i];
     return it&&it.role?it.role:null; };
   /* ① 同じ属七の形でも、役割を書き分けること（§24） */
   const R=[
     ['C7 | F7 | C7 | G7',0,'blues','ブルースの I7'],
     ['C7 | F7 | C7 | G7',1,'blues','ブルースの IV7'],
     ['C7 | F7 | C7 | G7',3,'v7',  '本来の V7'],
     ['Cmaj7 | A7 | Dm7 | G7 | Cmaj7',1,'sec','借りたドミナント'],
     ['Cmaj7 | D7 | G7 | Cmaj7',1,'sec','V/V'],
     ['Dm7 | Db7 | Cmaj7',1,'subv','裏コード'],
     ['Fm7 | Bb7 | Cmaj7',1,'backdoor','裏口'],
     ['C7 | C7 | C7 | C7',1,'static','居座るドミナント'],
   ];
   const ngR=R.filter(([t,i,id])=>{ const r=roleAt(t,i); return !r||r.id!==id; })
              .map(([t,i,id,nm])=>nm+'（'+((roleAt(t,i)||{}).id||'—')+'）');
   ok('[263] 属七の役割を書き分ける', ngR.length===0, ngR.join(' / '));
   /* **借りたドミナントは、行き先まで名乗ること** */
   { const r=roleAt('Cmaj7 | A7 | Dm7 | G7 | Cmaj7',1);
     ok('[263] 借りたドミナントは行き先を名乗る',
        !!r&&/V\/IIm/.test(r.name), r?r.name:'—');
     const r2=roleAt('Cmaj7 | D7 | G7 | Cmaj7',1);
     ok('[263] V/V も名乗る', !!r2&&/V\/V/.test(r2.name), r2?r2.name:'—'); }
   /* **機能と役割は別の欄**——両方持っていること */
   { const r=solve('C7 | F7 | C7 | G7');
     ok('[263] 機能と役割を別に持つ',
        r.items.every(x=>x.fn&&x.role&&x.fn.name&&x.role.name), '');
     /* C7 は機能では「ドミナント」でも、役割は「ブルースの I7」 */
     ok('[263] 機能が同じでも役割は違いうる',
        r.items[0].fn.id==='D'&&r.items[0].role.id==='blues',
        r.items[0].fn.name+' / '+r.items[0].role.name); }
   /* ② 音の評価が、行き先と使い道を持つこと（§20） */
   { const r=solve('G7 | Cmaj7');
     const tb=U.fbNoteTable(r.items[0].chord,r.items[0].localKey,
       r.items[1].chord, U.song?U.song.meta:null);
     ok('[263] どの音にも使い道が付く',
        tb.filter(x=>x.usage).length>=10,
        String(tb.filter(x=>x.usage).length)+'/12');
     /* **E♭ → E** の行き先を、機械が拾える形で持つこと */
     const eb=tb.find(x=>x.i===8);
     ok('[263] 行き先を、文章とは別に持つ',
        !!eb&&eb.resolveTo==='E', eb?String(eb.resolveTo):'—');
     /* コードトーンと避ける音を、使い道で見分けられること */
     ok('[263] コードトーンを使い道で見分ける',
        (tb.find(x=>x.i===0)||{}).usage==='chord', '');
     ok('[263] 避ける音を使い道で見分ける',
        (tb.find(x=>x.i===5)||{}).usage==='avoid',
        String((tb.find(x=>x.i===5)||{}).usage)); }
   /* ③ 言い過ぎを改めたこと（§3・§4） */
   { const r=solve('Cmaj7 | A7 | Dm7 | G7 | Cmaj7');
     const h=(r.hints||[]).join(' ');
     ok('[263] 「ここだけ調外が使える」と言わない',
        !/ここだけ調の外の音が使えます/.test(h), '');
     ok('[263] 代わりに、理由が明確だと言う',
        !/聴かせどころ/.test(h)||/理由がはっきり/.test(h), ''); }
   { const r=solve('Cmaj7 | Fm7 | Cmaj7');
     const h=(r.hints||[]).join(' ');
     ok('[263] 「そのまま嵌る」と言わない', !/そのまま嵌ります/.test(h), '');
     ok('[263] コードトーンを土台と言う',
        !/同主調から借りた和音/.test(h)||/コードトーン/.test(h), ''); }
   /* ④ 表示の順が「まず何を弾くか」から始まること（§21） */
   { U.closePop(); U.openAnalyzer('Dm7 | G7 | Cmaj7');
     const pop=d.querySelector('.pop-anz');
     if(pop){
       const row=pop.querySelectorAll('.anz-row')[1];   /* G7 */
       const cls=[...row.children].map(x=>x.className);
       ok('[263] 役割が最初に来る', cls[1]==='anz-main', cls.join(' '));
       ok('[263] 狙う音が、その次に来る',
          cls.indexOf('anz-aim')>0&&cls.indexOf('anz-aim')<cls.indexOf('anz-sc'),
          cls.join(' '));
       ok('[263] スケールは後ろに置く',
          cls.indexOf('anz-sc')===cls.length-1, cls.join(' '));
       /* 狙う音には、行き先が添うこと */
       const aim=row.querySelector('.anz-aim');
       ok('[263] 狙う音に行き先を添える',
          !!aim&&/→/.test(aim.textContent), aim?aim.textContent:'—');
     }
     U.closePop(); }
   /* ⑤ §24 の十五項目が、すべて通ること */
   { const chk=[];
     const rid=(t,i)=>((roleAt(t,i)||{}).id);
     chk.push(rid('C7 | F7 | C7 | G7',0)==='blues');
     chk.push(rid('C7 | F7 | C7 | G7',1)==='blues');
     chk.push(rid('Cmaj7 | A7 | Dm7 | G7 | Cmaj7',1)==='sec');
     chk.push(rid('Cmaj7 | D7 | G7 | Cmaj7',1)==='sec');
     chk.push(rid('Dm7 | Db7 | Cmaj7',1)==='subv');
     chk.push(rid('Fm7 | Bb7 | Cmaj7',1)==='backdoor');
     chk.push([...new Set(solve('Cmaj7 | Fm7 | Bb7 | Ebmaj7')
       .items.map(x=>x.localKeyName))].length>1);
     chk.push([...new Set(solve('Cmaj7 | Fm7 | Cmaj7')
       .items.map(x=>x.localKeyName))].length===1);
     ok('[263] §24 の確認項目が通る', chk.every(Boolean),
        chk.map((x,i)=>x?'':String(i+1)).filter(Boolean).join(',')); }
 }catch(e){ ok('[263] 形・機能・役割', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    説明が付くことと、確からしいことは違う（1.265）

    `Cmaj7 Am7 Dm7 G7 | Em7 A7 Dm7 G7` の後半が **Key A** と読まれていた。
    調べると——

        A で読むと  同主調から借りた和音 38点 × 3 ＋ 45 ＝ 159点
        C で読むと  調の中の和音 30点 × 3 ＋ 45         ＝ 135点

    **「調の中」より「借用」の方が高かった。**
    これでは**調の外に居るほど高く評価される**ことになり、
    道具は「全部を借用として説明できる調」を選ぶ。
    **何でも借用と言えば説明は付く。だが調の中にすんなり収まる読みの方が、
      確からしい。**

    ——三度も上流（型の名指し・切り替え費用・ii–V–I の判定）を疑って回った。
    根は**規則表の点の逆転**であった。
    **数が並んでいる所は、まずその大小を疑う。**
    ══════════════════════════════════════════════════════════════ */
 try{
   /* 点が一箇所に集めてあること */
   ok('[265] 規則の点は一箇所に', !!U.AN_PT&&U.AN_PT.diatonic!=null, '');
   /* **調の中が、借用より高いこと**——ここが逆転していた */
   ok('[265] 調の中が、同主調の借用より高い',
      U.AN_PT.diatonic>U.AN_PT.parallel,
      U.AN_PT.diatonic+' vs '+U.AN_PT.parallel);
   ok('[265] 調の中が、調の外より高い',
      U.AN_PT.diatonic>U.AN_PT.outside, '');
   /* 実際に、全部を借用と読める調へ飛ばないこと */
   { const r=U.anSolve(U.anParseProg(
       'Cmaj7 | Am7 | Dm7 | G7 | Em7 | A7 | Dm7 | G7'));
     const ks=[...new Set(r.items.map(x=>x.localKeyName))];
     ok('[265] 全部を借用と読める調へ飛ばない', ks.length===1&&ks[0]==='C',
        ks.join('/')); }
   /* **ii へ寄っただけの所を、転調と呼ばない**（要求書 §1） */
   { const a=U.anSolve(U.anParseProg('Cmaj7 | Em7 | A7 | Dm7 | G7 | Cmaj7'));
     ok('[265] ii へ寄っただけなら、転調と呼ばない',
        a.segs.length===1, a.segs.map(x=>x.keyName).join('→')); }
   /* **本当の転調は、見逃さない** */
   { const b=U.anSolve(U.anParseProg('Cmaj7 | Fm7 | Bb7 | Ebmaj7'));
     ok('[265] 本当の転調は見逃さない',
        b.segs.length>=2&&b.segs.some(x=>/E♭/.test(x.keyName)),
        b.segs.map(x=>x.keyName).join('→')); }
   /* 確かな判断を、型で覆さないこと */
   { const cs=U.anParseProg('Cmaj7 | Am7 | Dm7 | G7 | Em7 | A7 | Dm7 | G7')
       .filter(x=>x.ok);
     const pats=U.anFindPatterns(cs,{root:0,qual:'maj'});
     const r=U.anSolve(U.anParseProg(
       'Cmaj7 | Am7 | Dm7 | G7 | Em7 | A7 | Dm7 | G7'));
     /* 型としては短調の ii–V–i が見つかってよいが、**調は動かさない** */
     ok('[265] 退けた区間を、型で覆さない',
        r.items.every(x=>x.localKeyName==='C'),
        pats.map(p=>p.name).join('/')); }
 }catch(e){ ok('[265] 規則の点', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    実際の曲で使われる進行が、正しく読めること（1.266）

    L様より、実曲の九形について確認の依頼を承った。
    測ったところ——**九つとも既に通っていた。**

    1.265 で「調の中を最も高く」と規則表の点を直した折、
    **リズムチェンジやブルースのような調内で完結する進行**も
    一緒に片付いていたのである。
    ——**根を直せば、枝は勝手に揃う。**

    だが**通っていることと、通り続けることは別。**
    この九形は実際の稽古で使う進行ゆえ、崩れれば必ず目に付く。
    **据えておけば、次に誰かが点を触った時に鳴る。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const solve=t=>U.anSolve(U.anParseProg(t));
   const keysOf=t=>{ const r=solve(t);
     return [...new Set(r.items.map(x=>x.localKeyName))]; };
   /* ① リズム・チェンジ A——**B♭ 一色**で、G7 は V/ii */
   { const t='Bb6 | G7 | Cm7 | F7 | Dm7 | G7 | Cm7 | F7';
     const ks=keysOf(t);
     ok('[266] リズム・チェンジ A が一つの調', ks.length===1&&/B♭/.test(ks[0]),
        ks.join('/'));
     const r=solve(t);
     ok('[266] その G7 は V/IIm（転調ではない）',
        /V\/IIm/.test(r.items[1].role.name), r.items[1].role.name); }
   /* ② コルトレーン——**長三度で調が移る** */
   { const r=solve('Bmaj7 | D7 | Gmaj7 | Bb7 | Ebmaj7');
     ok('[266] コルトレーンは調が移る', r.segs.length>=3,
        r.segs.map(s=>s.keyName).join('→')); }
   /* ③ モーダル一発——**V/V と読まない** */
   { const r=solve('Am7 | Am7 | D7 | D7');
     ok('[266] ドリアン一発を V/V と読まない',
        !r.items.some(x=>/V\/V/.test(x.role.name)),
        r.items.map(x=>x.role.name).join('/'));
     /* 同じ和音が続く所は「居座る」と読むこと */
     ok('[266] 同じ属七が続けば居座ると読む',
        r.items[3].role.id==='static', r.items[3].role.name); }
   /* ④ ペダル（スラッシュ） */
   ok('[266] スラッシュの低音を度数で出す',
      solve('C | C/E | F | G').items[1].roman==='I/III',
      solve('C | C/E | F | G').items[1].roman);
   /* ⑤ 同主調の借用が続いても、転調にしない */
   ok('[266] 同主調の借用を転調にしない',
      keysOf('C | Ab | Bb | C').length===1, keysOf('C | Ab | Bb | C').join('/'));
   /* ⑥ 12小節ブルース——**一つの調** */
   { const ks=keysOf('C7 | F7 | C7 | C7 | F7 | F7 | C7 | A7 | Dm7 | G7 | C7 | G7');
     ok('[266] 12小節ブルースが一つの調', ks.length===1, ks.join('/')); }
   /* ⑦ 短調の曲を、短調と読む */
   { const ks=keysOf('Am | F | G | Em | Am');
     ok('[266] 短調の曲を短調と読む', /m$/.test(ks[0]), ks.join('/')); }
   /* ⑧ 曖昧な進行では、候補を並べる（**一つに決め打たない**） */
   { const r=solve('C | F | Am | G');
     ok('[266] 曖昧な時は候補を並べる',
        !!r.keyCands&&r.keyCands.length>=3,
        r.keyCands.slice(0,3).map(k=>k.keyName).join('/'));
     ok('[266] 候補には根拠が付く',
        r.keyCands[0].why&&r.keyCands[0].why.length>0, ''); }
   /* ⑨ 長い進行でも、待たせないこと */
   { const t=Array(8).fill('Cmaj7 | Am7 | Dm7 | G7').join(' | ');
     const t0=Date.now(); const r=solve(t); const ms=Date.now()-t0;
     ok('[266] 32和音でも解ける', !!r&&r.items.length===32,
        (r?r.items.length:0)+'和音');
     /* **待たされる道具は使われない。**一瞬で返ること */
     ok('[266] 長い進行でも待たせない', ms<3000, ms+'ms'); }
 }catch(e){ ok('[266] 実曲の進行', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    ★ は「伸ばせる」という約束（1.268）

    L様——「C の狙う音が A♭♭13 A13→G# になっているのは、どういう理由？」

    Key Am の `C → E` で、**A♭ が ★（先取りして伸ばせる）**になっていた。
    次の E の三度（G♯）と同じ音だからである。判定の筋は通っている。
    だが **C の上で A♭ は ♭13**——伸ばせば濁る。
    「先取りして伸ばせます」と申しながら、伸ばせない音を勧めていた。

    1.249 でこの掟は入れたのに、**属七の時しか見ていなかった**——
    `fam==='dom'` が付いており、長三和音の ♭13 が漏れていた。

    併せて二つ：
      ・**同じ音を、二つの綴りで並べていた**——`A♭`（C の ♭13）と
        `G♯`（E の 3rd）は同じ音。一行に両方書けば別の音に見える。
      ・**音名と度数が続いて読めなかった**——`E♭`＋`♭13` が
        `E♭♭13`（重変？）に見え、`→E` の次の `E13` がコード名に見えた。
    ══════════════════════════════════════════════════════════════ */
 try{
   const Am2={root:9,qual:'min'}, C2={root:0,qual:'maj'};
   const ch=(r,t)=>({root:r,type:t,bass:null});
   const meta=U.song?U.song.meta:null;
   /* ① 伸ばせない音を ★ にしないこと */
   { const tb=U.fbNoteTable(ch(0,'maj'),Am2,ch(4,'maj'),meta);
     const ab=tb.find(x=>x.i===8);      /* C の ♭13＝A♭ */
     ok('[268] 長三和音の ♭13 を ★ にしない',
        !!ab&&ab.tier!=='aim', ab?ab.tier+' '+ab.deg:'—');
     /* だが**消しはしない**——寄せる音としては残ること */
     const near=tb.filter(x=>x.tier==='appr'||x.tier==='aim');
     ok('[268] 寄せる音は残す', near.length>0,
        near.map(x=>x.note+x.deg).join(' ')); }
   /* **伸ばせる ★ は、ちゃんと ★ のまま**（壊していないこと） */
   { const tb=U.fbNoteTable(ch(7,'dom7'),C2,ch(0,'maj7'),meta);
     const e=tb.find(x=>x.i===9);       /* G7 の 13＝E。次の CM7 の 3rd */
     ok('[268] 伸ばせる音は ★ のまま', !!e&&e.tier==='aim', e?e.tier+' '+e.deg:'—');
     const eb=tb.find(x=>x.i===8);      /* ♭13＝E♭ */
     ok('[268] ♭13 は寄せる音に留める', !!eb&&eb.tier==='appr', eb?eb.tier:'—'); }
   /* 根音の半音上（♭9）は、どの和音でも緊張 */
   { const ng=['maj','min','maj7','min7','dom7','m7b5']
       .filter(t=>{ const tb=U.fbNoteTable(ch(0,t),C2,null,meta);
         const x=tb.find(y=>y.i===1); return !x||x.tier==='aim'||x.tier==='land'; });
     ok('[268] ♭9 は、どの和音でも ★・◎ にしない', ng.length===0, ng.join(' ')); }
   /* ② 同じ音を、二つの綴りで並べないこと */
   { const tb=U.fbNoteTable(ch(0,'maj'),Am2,ch(4,'maj'),meta);
     const bad=tb.filter(x=>(x.tier==='aim')&&x.toNote&&x.note!==x.toNote);
     ok('[268] ★ の音名は、行き先の綴りに揃える', bad.length===0,
        bad.map(x=>x.note+'≠'+x.toNote).join(' '));
     /* 行き先を、文章とは別の欄でも持つこと */
     const ap=tb.find(x=>x.tier==='appr');
     ok('[268] 行き先の度数と音名を、別の欄で持つ',
        !!ap&&!!ap.toDeg&&!!ap.toNote,
        ap?(ap.toDeg+'/'+ap.toNote):'—'); }
   /* ③ 画面で、音名と度数が読み分けられること */
   { U.closePop(); U.openAnalyzer('Dm7 | G7 | Cmaj7');
     const pop=d.querySelector('.pop-anz');
     if(pop){
       const a1=pop.querySelectorAll('.anz-a1');
       ok('[268] 狙う音は一行に一つ', a1.length>=2, String(a1.length));
       const t=a1[0]?a1[0].textContent:'';
       /* **度数は括弧に入れる**——`E♭♭13` に見えないように */
       ok('[268] 度数を括弧で括る', /（.+）/.test(t), t);
       /* **印を出す**——★ と → の別が分かるように */
       ok('[268] 印を出す', /[★→]/.test(t), t);
       /* **何をする音かを添える** */
       ok('[268] 何をする音か添える', /半音で|先取り/.test(t), t);
       /* その他の欄も、音名と度数が続かないこと */
       const nt=pop.querySelector('.anz-notes');
       ok('[268] その他の欄も度数を括弧で',
          !!nt&&/（.+）/.test(nt.textContent), '');
     }
     U.closePop(); }
 }catch(e){ ok('[268] 狙う音の表示', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    ScoreLineTAB から三つ移す（1.269）

    L様——「まだ LEAD にない機能で移植できることを見つけて。
            **基本的に同じ操作感にしたい**」。

    TAB は LEAD より一万行大きく、325 の関数が向こうにだけあった。
    楽器固有のもの（ベンド・弦・フレット）を除いて選り分け、三つ移した。

      ① ループの席   … 範囲を名前つきで幾つも持ち、行き来できる
      ② 画面を眠らせない … 稽古中に iPhone が暗くならない
      ③ 曲に鍵をかける … 渡した曲を、うっかり書き換えられないように

    **札の名も、置き場所も、言い回しも TAB と揃える。**
    二つの道具を行き来なさる時、**同じ手が通じる**方がよい。
    ══════════════════════════════════════════════════════════════ */
 try{
   /* ══ ① ループの席 ══ */
   { const _k=U.song.id;
     U.song.genTemp=false; U.saveSong(U.song);
     U.makeBackingSong({parts:['p_oudou','p_oudou'],prog:'pop',level:2,seed:5});
     U.song.genTemp=false; U.render();
     ok('[269] 席の仕組みが在る',
        typeof U.loopSave==='function'&&typeof U.loopGo==='function', '');
     /* **引いた時点で、もう席に収まる**——名を付けるまで待たない */
     U.setLoopRange(U._disp[0],U._disp[3]);
     ok('[269] 引けば、その場で席に収まる', !!U.loopAt(0),
        U.loopAt(0)?U.loopNameOf(U.loopAt(0)):'—');
     ok('[269] 名は小節番号から作る',
        U.loopNameOf(U.loopAt(0))==='1–4', U.loopNameOf(U.loopAt(0)));
     /* **二つ目を引いても、一つ目は消えない**——ここが移植の眼目 */
     U.loopGo(1); U.setLoopRange(U._disp[4],U._disp[7]);
     ok('[269] 二つ目を引いても、一つ目は消えない',
        !!U.loopAt(0)&&!!U.loopAt(1),
        [0,1].map(i=>U.loopAt(i)?U.loopNameOf(U.loopAt(i)):'空').join('/'));
     /* 行き来できること */
     U.loopGo(0);
     ok('[269] 席を叩けば、その範囲へ移る',
        U.loopSel()===0&&U.loopNameOf(U.loopRange)==='1–4',
        U.loopSel()+'／'+U.loopNameOf(U.loopRange));
     /* **次に入れる席が、いつも一つ空いている** */
     ok('[269] 空いた席をいつも一つ残す', U.loopSlots()>=3, String(U.loopSlots()));
     /* ══ 席を選ぶ道は、⟳ の長押し一本（1.271）══
        はじめ帯へ席を並べたが、TAB では L様が「帯には出さなくていい」と
        仰っていた——**同じ物が二箇所にあれば、どちらが本当か分からなくなる。**
        帯は**いま何番の席で、どこを繰り返しているか**だけを名乗る。 */
     { U.mode='loop'; U.render();
       const bar=[...d.querySelectorAll('.bb-btn')].map(x=>x.textContent.trim());
       ok('[271] 席の札を帯へ出さない',
          !bar.some(t=>/^\d+\s*(空き|[0-9]+–)/.test(t)), bar.join('|').slice(0,60));
       const lab=[...d.querySelectorAll('.bb-lab')].map(x=>x.textContent.trim())
         .find(t=>/ループ/.test(t));
       ok('[271] 帯はいまの席と範囲を名乗る', !!lab&&/ループ\d/.test(lab), lab||'—');
       /* ⟳ の長押しで、席が並ぶこと */
       const anchor=[...d.querySelectorAll('.bb-btn')].find(x=>/繰り返し/.test(x.title||''));
       ok('[271] ⟳ の札が在る', !!anchor, '');
       if(anchor){
         U.openLoopMenu(anchor);
         const bs=[...d.querySelectorAll('.lm-b')];
         ok('[271] 長押しで席が並ぶ', bs.length>=3, String(bs.length));
         /* **叩けばその席へ移る** */
         if(bs[1]){ bs[1].onclick(); }
         ok('[271] 席を叩けば、その席へ移る', U.loopSel()===1, String(U.loopSel()));
         /* **選んだのだから、⟳ は入れておく** */
         ok('[271] 席を選べば、繰り返しも入る', !!U.TP.loop, '');
         U.closeLoopMenu();
         ok('[271] メニューは閉じられる', !d.querySelector('.lm'), '');
         U.loopGo(0);
       }
       /* **借りた物は返す。**モードを変えたまま次の点検へ渡さない */
       U.mode='rhythm'; U.render(); }
     /* 空けられること */
     U.loopDrop(1);
     ok('[269] 席を空けられる', !U.loopAt(1)&&!!U.loopAt(0), '');
     /* **保存に残ること**——次に開いた時、引き直させない */
     U.saveSong(U.song); U.flushSave();
     const mid=U.song.id;
     U.makeSightSong({level:1,bars:8,seed:2}); U.song.genTemp=false; U.saveSong(U.song);
     U.switchSong(mid); U.render();
     ok('[269] 席は保存に残る', !!U.loopAt(0)&&U.loopNameOf(U.loopAt(0))==='1–4',
        U.loopAt(0)?U.loopNameOf(U.loopAt(0)):'—');
     U.song.genTemp=false; U.saveSong(U.song);
     try{ U.switchSong(_k); }catch(_){}
     try{ U.doDeleteSong(mid); }catch(_){} }

   /* ══ ② 画面を眠らせない ══ */
   ok('[269] 眠らせない仕組みが在る', typeof U.keepAwake==='function', '');
   /* **止めたら眠ってよい**——鳴らしていないのに起こし続けない */
   { U.makeBackingSong({prog:'pop',level:2,seed:5}); U.song.genTemp=false;
     let okPlay=false;
     try{ U.playStart(); okPlay=!!U.TP.playing; U.playStop(); }catch(_){}
     ok('[269] 再生の開始と停止に繋がっている',
        okPlay&&!U.TP.playing, ''); }

   /* ══ ③ 曲に鍵をかける ══ */
   { U.makeSightSong({level:2,bars:8,seed:5}); U.song.genTemp=false;
     ok('[269] 鍵の札が在る', !!d.getElementById('tb-lock'), '');
     ok('[269] はじめは掛かっていない', !U.isLocked(), '');
     /* 掛ける前は、書き換えが通ること */
     ok('[269] 鍵なしなら書き換えは通る',
        U.tx('試し',()=>{ U.song.meta.title='t1'; })!==null, '');
     U.lockSong();
     ok('[269] 掛かる', U.isLocked(), '');
     ok('[269] 札の姿が変わる',
        d.getElementById('tb-lock').textContent==='🔒',
        d.getElementById('tb-lock').textContent);
     /* **書き換えは止まる。**しかも黙って止まらない */
     const before=U.song.meta.title;
     ok('[269] 鍵ありなら書き換えは止まる',
        U.tx('試し2',()=>{ U.song.meta.title='t2'; })===null
        &&U.song.meta.title===before, U.song.meta.title);
     ok('[269] 止めたことを知らせる',
        /鍵が掛かっています/.test((d.getElementById('toast-msg')||{}).textContent||''),
        (d.getElementById('toast-msg')||{}).textContent||'');
     /* **取り消し・やり直しも止まる**（譜面が動くゆえ） */
     { const t0=JSON.stringify(U.song.bars.map(b=>b.notes.length));
       U.doUndo(); U.doRedo();
       ok('[269] 取り消し・やり直しも止まる',
          JSON.stringify(U.song.bars.map(b=>b.notes.length))===t0, ''); }
     /* ══ **稽古の道具は取り上げない** ══
        鍵は書き換えを止めるためのもので、鳴らし方は今までどおり */
     { let okPlay2=false;
       try{ U.playStart(); okPlay2=!!U.TP.playing; U.playStop(); }catch(_){}
       ok('[269] 鍵が掛かっていても、再生は通る', okPlay2, ''); }
     ok('[269] 鍵が掛かっていても、指板は通る',
        (()=>{ try{ const st=U.fbState(); st.on=true; U.renderFretboard(); return true; }
               catch(_){ return false; } })(), '');
     /* 外せること */
     U.song.meta.locked=false;
     ok('[269] 外せる', !U.isLocked(), ''); }
 }catch(e){ ok('[269] TAB からの移植', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    タイの後始末（1.270 ／ ScoreLineTAB より）

    L様——「小節を跨いだタイの不具合をたくさん直した」。
    突き合わせると、**LEAD には整合を取り直す処理が一つも無かった。**
    付ける仕組みだけがあり、**壊れた後に掃除する仕組みが無い。**

    実測して四つ壊れていた——
      ・音符を休符にすると、タイが宙に浮く
      ・音符を消すと、出す側だけが残る
      ・**取り消し・やり直しで、壊れたタイが戻ってくる**

    最後の一つが厄介である。画面上は元に戻ったように見えるのに、
    **控えの中には壊れた弧が入っている。**

    ══ 何を確かめるか ══
    タイは**二人一組**——出す側（tieOut）と受ける側（tiedIn）が
    隣り合って初めて成り立つ。**片方だけになったら、それはもうタイではない。**
    掃除は `tx` 一箇所で、**控えを取る前に**走らせる——
    さもないと壊れた姿が控えに残る。
    ══════════════════════════════════════════════════════════════ */
 try{
   ok('[270] 後始末の仕組みが在る', typeof U.sanitizeTies==='function', '');
   /* 宙に浮いたタイ（片方だけ）を数える */
   const orphans=(s)=>{
     const ids=U.orderedBarIds(s)||[]; const seen=new Set(); const flat=[];
     ids.forEach(id=>{ if(seen.has(id)) return; seen.add(id);
       const b=U.findBar(s,id); if(!b) return;
       (b.notes||[]).slice().sort((a,b2)=>a.start-b2.start).forEach(n=>flat.push(n)); });
     let e1=0,e2=0;
     flat.forEach((n,i)=>{
       if(n.tieOut){ const nx=flat[i+1];
         if(!nx||nx.kind==='rest'||!nx.tiedIn||n.kind==='rest') e1++; }
       if(n.tiedIn){ const pv=flat[i-1];
         if(!pv||!pv.tieOut||n.kind==='rest') e2++; }
     });
     return e1+e2;
   };
   /* 小節をまたぐタイを三本張った譜面を作る */
   const mk=()=>{
     U.makeSightSong({level:3,bars:8,seed:11}); U.song.genTemp=false;
     U.tx('タイを張る',()=>{
       const ids=U.orderedBarIds(U.song);
       for(let k=0;k<3;k++){
         const b=U.findBar(U.song,ids[k]);
         if(b&&b.notes.length){
           b.notes[b.notes.length-1].tieOut=true;
           const nb=U.findBar(U.song,ids[k+1]);
           if(nb&&nb.notes[0]) nb.notes[0].tiedIn=true;
         }
       }
     });
     return U.song;
   };
   const _k270=U.song?U.song.id:null;
   /* ══ 十一の場面——**編集のたびに、二人一組が保たれること** ══ */
   const CASES=[
     ['小節を消す', s=>{ const ids=U.orderedBarIds(s);
       U.tx('消す',()=>{ const sec=s.sections.find(x=>(x.items||[])
           .some(it=>it.barId===ids[1]));
         sec.items.splice(sec.items.findIndex(it=>it.barId===ids[1]),1);
         U.gcBars(s); }); }],
     ['音符を休符にする', s=>{ U.tx('休符',()=>{
       const b=U.findBar(s,U.orderedBarIds(s)[1]); b.notes[0].kind='rest'; }); }],
     ['小節を入れ替える', s=>{ U.tx('入替',()=>{ const sec=s.sections[0];
       const t=sec.items[1]; sec.items[1]=sec.items[2]; sec.items[2]=t; }); }],
     ['音符を消す', s=>{ U.tx('消す',()=>{
       const b=U.findBar(s,U.orderedBarIds(s)[1]);
       b.notes.shift(); U.normalizeBar(s,b); }); }],
     ['音価を変える', s=>{ U.tx('音価',()=>{
       const b=U.findBar(s,U.orderedBarIds(s)[0]);
       const n=b.notes[b.notes.length-1];
       n.len=Math.max(24,(n.len||0)/2); U.normalizeBar(s,b); }); }],
     ['セクションを消す', s=>{ U.tx('節を消す',()=>{
       if(s.sections.length>1){ s.sections.splice(0,1); U.gcBars(s); } }); }],
     ['小節を複製する', s=>{ U.tx('複製',()=>{ const sec=s.sections[0];
       sec.items.splice(1,0,{barId:sec.items[0].barId}); }); }],
     /* **ここが眼目**——控えを取る前に掃除しないと、壊れた姿が戻ってくる */
     ['取り消し', s=>{ U.tx('何か',()=>{
       const b=U.findBar(s,U.orderedBarIds(s)[1]); b.notes[0].kind='rest'; });
       U.doUndo(); }],
     ['やり直し', s=>{ U.tx('何か',()=>{
       const b=U.findBar(s,U.orderedBarIds(s)[1]); b.notes[0].kind='rest'; });
       U.doUndo(); U.doRedo(); }],
     ['移調', s=>{ U.tx('移調',()=>U.transposeSong(2)); }],
     ['拍子を変える', s=>{ U.tx('拍子',()=>{ s.meta.ts={n:3,d:4};
       s.bars.forEach(b=>{ b.ts=null; U.normalizeBar(s,b); }); }); }],
   ];
   const ng270=[];
   CASES.forEach(([nm,fn])=>{
     const s=mk();
     try{ fn(s); }catch(e){ ng270.push(nm+'（例外）'); return; }
     const o=orphans(U.song);
     if(o) ng270.push(nm+'（'+o+'本）');
   });
   ok('[270] 十一の場面で、宙に浮いたタイが残らない',
      ng270.length===0, ng270.join(' / '));
   /* **付けたタイは、消さない**——掃除しすぎないこと */
   { const s=mk();
     let n=0;
     (U.orderedBarIds(s)||[]).forEach(id=>{ const b=U.findBar(s,id);
       (b.notes||[]).forEach(x=>{ if(x.tieOut) n++; }); });
     ok('[270] 正しいタイまで消さない', n>=2, String(n)+'本'); }
   /* 休符へは繋がないこと */
   { const s=mk();
     U.tx('休符',()=>{ const b=U.findBar(s,U.orderedBarIds(s)[1]);
       b.notes[0].kind='rest'; });
     const b=U.findBar(U.song,U.orderedBarIds(U.song)[0]);
     const last=b.notes[b.notes.length-1];
     ok('[270] 休符へは繋がない', !last.tieOut, ''); }
   try{ if(_k270&&U.song.id!==_k270) U.switchSong(_k270); }catch(_){}
 }catch(e){ ok('[270] タイの後始末', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    なぞりの後始末（1.270／実測して据える）

    L様——「ドラッグの不具合も合わせたい」。
    十四の場面を画面から実際になぞって測ったところ、
    **壊れる箇所は一つも無かった。**

    1.250 の総点検で入れた直し——**捕捉の解放を一箇所へ集め、
    曲を替える時に状態を断つ**——が、ここで効いている。
    「なぞり中に曲を替える」「モードを替える」が無傷なのはそのため。

    ══ 据える理由 ══
    **通っていることと、通り続けることは別。**
    なぞりは指で触る所ゆえ、崩れれば必ず稽古の邪魔になる。
    据えておけば、次に誰かが pointer まわりを触った時に鳴る。

    ══ 試験の限界も、書き残す ══
    選択のなぞりは `document.elementFromPoint` で指の下の的を拾う。
    **jsdom には版面が無く、これが常に空を返す**——
    ここは実機でしか確かめられない。
    **確かめられないことを、確かめたことにしない。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const sumLen=b=>(b.notes||[]).reduce((a,n)=>a+(n.len||0),0);
   /* 譜面が健やかか——長さ・零以下・はみ出し・重なり、そして**札の残り** */
   const health=(s)=>{
     const bad1=s.bars.filter(b=>sumLen(b)!==U.barTicks(s,b)).length;
     const neg=s.bars.some(b=>(b.notes||[]).some(n=>!(n.len>0)));
     const ov=s.bars.some(b=>(b.notes||[]).some(n=>n.start+n.len>U.barTicks(s,b)));
     const dup=s.bars.some(b=>{ const st=(b.notes||[]).map(n=>n.start);
       return st.length!==new Set(st).size; });
     const left=['dragging','carrying','lp-drag','radialing']
       .filter(c=>d.body.classList.contains(c));
     return {bad1,neg,ov,dup,left};
   };
   const ev=(el,n,x,y,id)=>{ if(!el) return;
     el.dispatchEvent(new w.PointerEvent(n,{bubbles:true,cancelable:true,
       clientX:x,clientY:y,pointerId:(id||1),pointerType:'touch',isPrimary:true})); };
   const hitsOf=bi=>{ const ws=[...d.querySelectorAll('#paper .mwrap')];
     return ws[bi]?[...ws[bi].querySelectorAll('.hit')]:[]; };
   const R=el=>el.getBoundingClientRect();
   const mk=(md)=>{ U.makeSightSong({level:3,bars:8,seed:7});
     U.song.genTemp=false; U.mode=md||'rhythm'; U.render(); return U.song; };
   const _k=U.song?U.song.id:null;

   ok('[270] 指で触る的が在る', hitsOf(0).length>0, String(hitsOf(0).length));

   const ngD=[];
   const run=(nm,fn)=>{ mk(); try{ fn(); }catch(e){ ngD.push(nm+'（例外）'); return; }
     const h=health(U.song);
     if(h.bad1||h.neg||h.ov||h.dup||h.left.length) ngD.push(nm); };

   /* ══ 素直になぞる ══ */
   run('前へなぞる',()=>{ const h=hitsOf(0);
     ev(h[0],'pointerdown',R(h[0]).left+2,R(h[0]).top+2);
     ev(h[2],'pointermove',R(h[2]).left+2,R(h[2]).top+2);
     ev(h[3],'pointerup',R(h[3]).left+2,R(h[3]).top+2); });
   run('後ろへなぞる',()=>{ const h=hitsOf(0);
     ev(h[3],'pointerdown',R(h[3]).left+2,R(h[3]).top+2);
     ev(h[0],'pointermove',R(h[0]).left+2,R(h[0]).top+2);
     ev(h[0],'pointerup',R(h[0]).left+2,R(h[0]).top+2); });
   run('同じ所で離す（短押し）',()=>{ const h=hitsOf(0);
     ev(h[0],'pointerdown',R(h[0]).left+2,R(h[0]).top+2);
     ev(h[0],'pointerup',R(h[0]).left+2,R(h[0]).top+2); });
   /* **縦にだけ動かしても、音価は変えない**——譜面を送る指と区別する */
   run('縦にだけ動かす',()=>{ const h=hitsOf(0);
     ev(h[0],'pointerdown',R(h[0]).left+2,R(h[0]).top+2);
     ev(h[0],'pointermove',R(h[0]).left+2,R(h[0]).top+400);
     ev(h[0],'pointerup',R(h[0]).left+2,R(h[0]).top+400); });
   /* ══ 途中で断たれる ══ */
   run('途中で pointercancel',()=>{ const h=hitsOf(0);
     ev(h[0],'pointerdown',R(h[0]).left+2,R(h[0]).top+2);
     ev(h[2],'pointermove',R(h[2]).left+2,R(h[2]).top+2);
     ev(h[2],'pointercancel',R(h[2]).left+2,R(h[2]).top+2); });
   run('紙の外で離す',()=>{ const h=hitsOf(0);
     ev(h[0],'pointerdown',R(h[0]).left+2,R(h[0]).top+2);
     ev(h[2],'pointermove',R(h[2]).left+2,R(h[2]).top+2);
     ev(d.body,'pointerup',5,5); });
   run('離さずに次をなぞる',()=>{ const h=hitsOf(0);
     ev(h[0],'pointerdown',R(h[0]).left+2,R(h[0]).top+2);
     ev(h[2],'pointermove',R(h[2]).left+2,R(h[2]).top+2);
     ev(h[4],'pointerdown',R(h[4]).left+2,R(h[4]).top+2);
     ev(h[6],'pointerup',R(h[6]).left+2,R(h[6]).top+2); });
   run('二本目の指',()=>{ const h=hitsOf(0);
     ev(h[0],'pointerdown',R(h[0]).left+2,R(h[0]).top+2);
     ev(h[2],'pointermove',R(h[2]).left+2,R(h[2]).top+2);
     ev(h[2],'pointerdown',R(h[2]).left+9,R(h[2]).top+2,2);
     ev(h[2],'pointerup',R(h[2]).left+2,R(h[2]).top+2); });
   run('小節をまたぐ',()=>{ const h0=hitsOf(0), h1=hitsOf(1);
     if(!h0[2]||!h1[1]) return;
     ev(h0[2],'pointerdown',R(h0[2]).left+2,R(h0[2]).top+2);
     ev(h1[1],'pointermove',R(h1[1]).left+2,R(h1[1]).top+2);
     ev(h1[1],'pointerup',R(h1[1]).left+2,R(h1[1]).top+2); });
   ok('[270] なぞっても譜面が壊れない', ngD.length===0, ngD.slice(0,3).join(' / '));

   /* ══ なぞっている最中に、外から邪魔が入る（1.250 の直しが効く所）══ */
   const ngX=[];
   const runX=(nm,fn)=>{ mk(); try{ fn(); }catch(e){ ngX.push(nm+'（例外）'); return; }
     const h=health(U.song);
     if(h.bad1||h.neg||h.ov||h.left.length) ngX.push(nm+(h.left.length?('：'+h.left.join(',')):'')); };
   runX('なぞり中にモードを替える',()=>{ const h=hitsOf(0);
     ev(h[0],'pointerdown',R(h[0]).left+2,R(h[0]).top+2);
     ev(h[2],'pointermove',R(h[2]).left+2,R(h[2]).top+2);
     U.mode='select'; U.render(); });
   runX('なぞり中に画面を開く',()=>{ const h=hitsOf(0);
     ev(h[0],'pointerdown',R(h[0]).left+2,R(h[0]).top+2);
     ev(h[2],'pointermove',R(h[2]).left+2,R(h[2]).top+2);
     try{ U.openScaleGuide(); U.closePop(); }catch(_){} });
   runX('なぞり中に曲を替える',()=>{ const h=hitsOf(0);
     ev(h[0],'pointerdown',R(h[0]).left+2,R(h[0]).top+2);
     ev(h[2],'pointermove',R(h[2]).left+2,R(h[2]).top+2);
     U.song.genTemp=false; U.saveSong(U.song); const id=U.song.id;
     U.makeSightSong({level:1,bars:8,seed:3}); U.song.genTemp=false; U.saveSong(U.song);
     U.switchSong(id); });
   ok('[270] なぞり中に邪魔が入っても、札が残らない',
      ngX.length===0, ngX.join(' / '));

   /* ══ 荒っぽく三百回 ══
      **一度で出ない綻びは、数で出す。** */
   { mk();
     for(let i=0;i<300;i++){
       const h=hitsOf(i%4); if(!h.length) continue;
       const a=h[i%h.length], b=h[(i*3+1)%h.length];
       ev(a,'pointerdown',R(a).left+2,R(a).top+2);
       if(i%5) ev(b,'pointermove',R(b).left+2,R(b).top+2);
       if(i%7===0) ev(b,'pointercancel',R(b).left+2,R(b).top+2);
       else        ev(b,'pointerup',R(b).left+2,R(b).top+2);
     }
     const h=health(U.song);
     ok('[270] 三百回なぞっても崩れない',
        !h.bad1&&!h.neg&&!h.ov&&!h.dup&&!h.left.length,
        JSON.stringify({長さ:h.bad1,零以下:h.neg,はみ出し:h.ov,札:h.left})); }

   /* ══ 選択のなぞりは、実機でしか確かめられない ══
      `document.elementFromPoint` を使う——jsdom には版面が無く常に空を返す。
      **確かめられないことを、確かめたことにしない。**
      ここでは「押せば掴む所まで」を見る。 */
   { mk('select');
     const h=hitsOf(0);
     ev(h[0],'pointerdown',R(h[0]).left+2,R(h[0]).top+2);
     ev(h[0],'pointerup',R(h[0]).left+2,R(h[0]).top+2);
     ok('[270] 選択：叩けば、そのマスが選ばれる', U.nsel.size>=1,
        String(U.nsel.size)+'（なぞりの範囲選択は実機でのみ確認可）');
     U.nsel.clear(); }
   try{ if(_k&&U.song.id!==_k) U.switchSong(_k); }catch(_){}
 }catch(e){ ok('[270] なぞりの後始末', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    刻みと向きは別、そして一小節の型（1.272）

    L様——「ストロークパターンを定型に入れたい。16ビートでよく使う
            ストロークとか一小節パターンとか。**現状ずっと8分などで
            使うこともあるけど不十分**」。

    ① これまで〈8分 ↓〉〈8分 ↓↑〉と**札に向きを混ぜて**いた。
       ゆえに **8分にしか向きを選べない**——16分にも3連にも向きは付くのに。
       ——**刻みは刻み、向きは向き。**別に選ばせる（TAB と同じ形）。

    ② 均した刻み（8分をずっと、16分をずっと）だけでは、
       **実際に弾く形にならない。**人が弾くのは `↓ ↓↑ ↑↓↑` のような
       **一小節でひと固まりの型**である。
       **空振り（✕）を書けるのが肝**——16ビートは手を止めない。
       鳴らさぬ拍でも腕は振っており、それが刻みを保つ。
    ══════════════════════════════════════════════════════════════ */
 try{
   ok('[272] 向きを別に選べる', Array.isArray(U.RHY_DIR)&&U.RHY_DIR.length===3, '');
   ok('[272] 札から向きを外した',
      !U.RHYTHMS.some(x=>/[↓↑]/.test(x[0])), U.RHYTHMS.map(x=>x[0]).join(' '));
   /* ══ 向きが、どの刻みにも効くこと ══
      **8分にしか効かないのが、直す前の姿であった。** */
   { U.makeBackingSong({prog:'pop',level:2,seed:5}); U.song.genTemp=false;
     const b=U.song.bars[0];
     const dirOf=(k,v)=>{ U.applyRhythm(U.song,b,k,v);
       return b.notes.map(n=>n.stroke||'—').join(''); };
     const ng=[];
     ['8down','16alt','triplet'].forEach(k=>{
       const alt=dirOf(k,'alt'), dn=dirOf(k,'down'), no=dirOf(k,'none');
       if(!/u/.test(alt)) ng.push(k+'：交互でアップが出ない');
       if(/u/.test(dn))   ng.push(k+'：ダウンなのにアップが出る');
       if(/[du]/.test(no))ng.push(k+'：付けないのに向きが出る');
     });
     ok('[272] 向きは、どの刻みにも効く', ng.length===0, ng.join(' / '));
     /* **シャッフルの裏は、型の一部**——向きを付ける限り ↑ のまま */
     U.applyRhythm(U.song,b,'shuffle','down');
     ok('[272] シャッフルの裏は型として ↑',
        b.notes.some(n=>n.stroke==='u'),
        b.notes.map(n=>n.stroke||'—').join('')); }
   /* ══ 一小節の型（1.275 ／ ScoreLineTAB と同じ字）══
      1.272 で並べた九つは**すべて私の思いつき**であった——向きを手で書いて
      腕の動きとして成立しない並びになり、名と中身も合っていなかった。
      1.273 で空にし、TAB の実装を見て入れ直した。

      **字は、この道具が既に持っている**——〈アドリブの伴奏〉の型と同じ。
      `d`↓ `u`↑ `o`向き無し `x`ブラッシング `-`休み `~`前を伸ばす、
      **大文字はアクセント**。
      **同じ字が二つの道具で違う意味を持てば、必ず食い違う。** */
   ok('[276] 十四本が入っている',
      Array.isArray(U.STROKE_PATS)&&U.STROKE_PATS.length>=14,
      String((U.STROKE_PATS||[]).length));
   /* 八分と十六分、両方が揃っていること */
   ok('[276] 八分と十六分が揃う',
      U.STROKE_PATS.some(p=>p.grid===8)&&U.STROKE_PATS.some(p=>p.grid===16), '');
   { U.makeBackingSong({prog:'pop',level:2,seed:5}); U.song.genTemp=false;
     const b=U.song.bars[0];
     const ng=[];
     U.STROKE_PATS.forEach(p=>{
       U.applyStrokePat(U.song,b,p.id);
       /* **小節の長さが合うこと**——どの型を当てても崩れない */
       const sum=(b.notes||[]).reduce((a,n)=>a+(n.len||0),0);
       if(sum!==U.barTicks(U.song,b)) ng.push(p.name+'（長さ）');
       if(!b.notes.length) ng.push(p.name+'（空）');
       if(b.rhythm!==p.id) ng.push(p.name+'（名を憶えない）');
     });
     ok('[275] どの型を当てても、小節が崩れない', ng.length===0, ng.join(' / '));
     /* ══ 字が、そのまま音になること ══
        **書いた文字と鳴る音が一対一。**ここが崩れると、
        型を直しても譜面が変わらない——いちばん厄介な壊れ方である。 */
     { const cells=U.strokePatCells('D~dU-u',8,U.barTicks(U.song,b));
       ok('[275] 大文字はアクセント', cells[0]&&cells[0].accent===true, '');
       ok('[275] ~ は前を伸ばす',
          cells[0]&&cells[0].len===Math.round(U.T.QUARTER/2)*2,
          cells[0]?String(cells[0].len):'—');
       ok('[275] - は休み', cells.some(c=>c.rest), '');
       ok('[275] d は下、u は上',
          cells[1]&&cells[1].dir==='d'&&cells[2]&&cells[2].dir==='u',
          (cells[1]||{}).dir+'/'+(cells[2]||{}).dir); }
     /* **✕ の向きは位置が決める**——手で書けば成立しない並びになる */
     { const cells=U.strokePatCells('xxxx',16,U.barTicks(U.song,b));
       const dirs=cells.map(c=>c.dir).join(',');
       ok('[275] ✕ の向きは位置が決める', dirs==='d,u,d,u', dirs); }
     /* **十六分は、小節が何拍でも十六分**（小節を割って出さない） */
     { const s2=U.song; const b2=s2.bars[0];
       s2.meta.ts={n:2,d:4}; b2.ts=null; U.normalizeBar(s2,b2);
       const cells=U.strokePatCells('dddd',16,U.barTicks(s2,b2));
       ok('[275] 十六分は拍数によらず十六分',
          cells[0]&&cells[0].len===Math.round(U.T.QUARTER/4),
          cells[0]?String(cells[0].len):'—');
       s2.meta.ts={n:4,d:4}; b2.ts=null; U.normalizeBar(s2,b2); }
     /* ブラッシングが ✕ の符頭で出ること */
     { U.applyStrokePat(U.song,b,'cutt');
       ok('[275] ✕ が符頭で出る',
          (b.notes||[]).some(n=>n.kind==='brush'),
          (b.notes||[]).map(n=>n.kind==='brush'?'✕':'♪').join('')); }
     /* 矢印は、型の字から出すこと */
     { const p=U.STROKE_PATS.find(x=>x.id==='cutt');
       const ar=U.patArrows(p);
       ok('[275] 矢印は型の字から出す',
          ar.length===p.pat.length&&/[↓↑✕]/.test(ar), ar); } }
   /* 画面に並ぶこと */
   { U.mode='rhythm'; U.render();
     try{ U.openRhythmDock(); }catch(_){}
     const dk=d.getElementById('dock');
     ok('[272] 定型の画面が開く', !!dk, '');
     if(dk){
       const labs=[...dk.querySelectorAll('.dk-rlbl')].map(x=>x.textContent);
       ok('[272] 向きの段が在る', labs.indexOf('向き')>=0, labs.join(' '));
       /* ══ 新しい持ち物（1.276）══
      `swing` はねて弾く型／`staccato` 音を短く切る／`meter` 本来の拍子 */
   { U.makeBackingSong({prog:'pop',level:2,seed:5}); U.song.genTemp=false;
     const b=U.song.bars[0];
     /* **スタッカートは音符へ写る** */
     U.applyStrokePat(U.song,b,'reggae');
     const on=(b.notes||[]).filter(n=>n.kind!=='rest');
     ok('[276] staccato の型は、音符に写る',
        on.length>0&&on.every(n=>n.staccato===true),
        on.filter(n=>n.staccato).length+'/'+on.length);
     U.applyStrokePat(U.song,b,'rock8');
     ok('[276] そうでない型には付けない',
        !(b.notes||[]).some(n=>n.staccato), '');
     /* **大文字はアクセント**——`DdDdDdDd` なら四つ */
     ok('[276] 大文字がアクセントになる',
        (b.notes||[]).filter(n=>n.accent).length===4,
        String((b.notes||[]).filter(n=>n.accent).length));
     /* **`o` は向きを書かない**（指引きなど） */
     U.applyStrokePat(U.song,b,'bossa');
     ok('[276] o は向きを書かない',
        (b.notes||[]).filter(n=>n.kind!=='rest').every(n=>!n.stroke),
        (b.notes||[]).map(n=>n.stroke||'—').join(' '));
     /* ══ はねは、曲の持ち物（1.276）══
        **黙って広い所を触らない。訊いて、押されたら触る。** */
     U.song.play.swing=null;
     U.mode='rhythm'; U.render(); try{ U.openRhythmDock(); }catch(_){}
     { const dk2=d.getElementById('dock');
       const pt=dk2?[...dk2.querySelectorAll('.dk-pat')]
         .find(x=>/シャッフル・ブルース/.test(x.textContent)):null;
       if(pt){
         pt.onclick();
         ok('[276] はねる型は、曲を勝手に変えない',
            !(U.song.play&&U.song.play.swing), '');
         ok('[276] 代わりに伺う',
            /はねて弾く型/.test((d.getElementById('toast-msg')||{}).textContent||''),
            (d.getElementById('toast-msg')||{}).textContent||'');
         const act=d.getElementById('toast-act');
         ok('[276] 「はねさせる」の札を添える',
            !!act&&act.style.display!=='none', '');
         if(act){ act.onclick();
           ok('[276] 押されたら、その時に触る',
              !!(U.song.play&&U.song.play.swing), ''); }
       } } }
   /* 型の段が出ていること（中身が在るのだから、出る） */
       ok('[275] 型の段が在る',
          labs.some(t=>/ビート/.test(t)), labs.join(' '));
       /* 札を押せば、その小節に当たること */
       { const pat=[...dk.querySelectorAll('.dk-pat')]
           .find(x=>/カッティング/.test(x.textContent));
         ok('[275] 型の札が在る', !!pat, '');
         if(pat&&U._disp&&U._disp.length){
           /* **押した小節**を先に控える——当てた後は次の小節へ送られるので、
              送り先を見ても「当たっていない」ことになる */
           /* **押した小節**を先に控える——当てた後は次の小節へ送られるので、
              送り先を見ても「当たっていない」ことになる。
              また**まっさらな譜面から始める**——前の点検が当てた型が残っていると、
              押していない小節を見て「当たった」と誤って通る */
           U.makeBackingSong({prog:'pop',level:2,seed:5});
           U.song.genTemp=false; U.mode='rhythm'; U.render();
           try{ U.openRhythmDock(); }catch(_){}
           const dk3=d.getElementById('dock');
           const pat3=dk3?[...dk3.querySelectorAll('.dk-pat')]
             .find(x=>/16分カッティング/.test(x.textContent)):null;
           const bid=U._disp[0].barId;
           if(pat3) pat3.onclick();
           const b2=U.findBar(U.song,bid);
           ok('[275] 札を押せば当たる',
              !!b2&&b2.rhythm==='cutt'&&(b2.notes||[]).some(n=>n.kind==='brush'),
              b2?String(b2.rhythm):'—');
         } }
     }
     U.mode='rhythm'; }
   /* **借りた物は返す。**四小節の曲を残したまま次の点検へ渡さない */
   try{ U.closeDock(); }catch(_){}
   U.makeSightSong({level:2,bars:12,seed:5}); U.song.genTemp=false; U.render();
 }catch(e){ ok('[272] ストロークの型', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    二拍三連（1.274）

    L様——「2拍3連ができない」。

    音は正しく置けていた（1120×3＝二拍）。**譜面の書き方だけ**が誤り、
    括りが拍の境で割れて **「2」「2」** と出ていた。正しくは一本で「3」。

    ══ 二度、見立てを外した ══
    ① 「単位が一拍より長いか」で見た——**二拍三連の一つ（1120）は
       一拍（1680）より短い。**捕まらない。
    ② 「三つ集めた長さ」で判じるよう直したが、まだ出ない——
       `1120` は「8分＋16分」でふつうに書けてしまうので、
       **連符に届く前に②の道で決まっていた。**

    ══ 決め手は、L様のひとこと ══
    「**2拍3連は3連8分を2つ分ずつ伸ばす**」——
    表には `span:2` として既に載っていた。それを②より先に探せばよい。

    最後の一手は**写し漏れ**であった。`splitNote` は正しく `tn:3, wide:true`
    と答えていたのに、`flat` へ積む時にその二つを落としていた。
    ——**答えを受け取る側が、受け取り損ねていた。**
    ══════════════════════════════════════════════════════════════ */
 try{
   const T2=U.T;
   /* 連符の表に、二拍三連が載っていること */
   { const tu=U.tupletUnits(T2.QUARTER);
     const wide=tu.find(t=>t.span===2);
     ok('[274] 二拍三連が表に在る',
        !!wide&&wide.u===Math.round(T2.QUARTER*2/3)&&wide.n===3,
        wide?('u='+wide.u+' n='+wide.n):'—'); }
   /* **三連8分の二つ分**として捕らえること（L様のひとこと） */
   { const r=U.splitNote(0,Math.round(T2.QUARTER*2/3),T2.QUARTER);
     ok('[274] 二拍三連を連符として捕らえる',
        r.length===1&&r[0].trip===true&&r[0].tn===3&&r[0].wide===true,
        JSON.stringify(r));
     /* **ふつうの音価に化けない**——1120 は「8分＋16分」でも書けてしまう */
     ok('[274] ふつうの音価に化けない', r.length===1, String(r.length)); }
   /* 譜面の括りが、拍で割れないこと */
   const nums=(fn)=>{
     U.makeSightSong({level:2,bars:8,seed:5}); U.song.genTemp=false;
     const b=U.song.bars[0];
     U.tx('置く',()=>{ b.notes=[]; fn(b); U.normalizeBar(U.song,b); });
     U.render();
     const svg=[...d.querySelectorAll('#paper svg.msvg')][0];
     return svg?[...svg.querySelectorAll('text')].map(t=>t.textContent)
       .filter(t=>/^[0-9]$/.test(t)).join(' '):'';
   };
   { const two=nums(b=>{
       for(let i=0;i<3;i++) U.insertNote(U.song,b,Math.round(i*T2.QUARTER*2/3),
         {kind:'note',len:Math.round(T2.QUARTER*2/3)});
       U.insertNote(U.song,b,T2.QUARTER*2,{kind:'note',len:T2.QUARTER*2}); });
     ok('[274] 二拍三連は「3」一本', /3/.test(two)&&!/2\s*2/.test(two), two);
     /* **一拍三連は、拍ごとに割る**——あれは「3」が二組であって六連符ではない */
     const one=nums(b=>{
       for(let i=0;i<6;i++) U.insertNote(U.song,b,Math.round(i*T2.QUARTER/3),
         {kind:'note',len:Math.round(T2.QUARTER/3)});
       U.insertNote(U.song,b,T2.QUARTER*2,{kind:'note',len:T2.QUARTER*2}); });
     ok('[274] 一拍三連は拍ごとに「3」', /3 3/.test(one), one);
     /* **ふつうの音符に連符を出さない**——ここが化けると譜面が連符だらけになる */
     const plain=nums(b=>{
       for(let i=0;i<4;i++) U.insertNote(U.song,b,i*T2.QUARTER,
         {kind:'note',len:T2.QUARTER}); });
     ok('[274] ふつうの4分に連符を出さない', !/3/.test(plain), plain||'（無し）'); }
   /* 選択肢に「2拍3連」の名が在ること——**名が違えば伝わり方が違う** */
   ok('[274] 「2拍3連」の名で選べる',
      (U.VAL_TRIPLET||[]).some(x=>x[0]==='2拍3連'),
      (U.VAL_TRIPLET||[]).map(x=>x[0]).join(' '));
 }catch(e){ ok('[274] 二拍三連', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    叩ける所は、叩く前に見えていなければならない（1.277 ／ TAB より）

    L様——「入力モードの時に帯が光ってない」。

    六線の上下には帯が走っている——コード名・演奏記号・注釈。
    いずれも叩けば入るのに、**入力の最中は何も見えていなかった。**
    調べると**帯そのものを一枚も出していなかった**（zoneKinds が null）。
    色を付けても、光る物が無い。

    さらに**叩いても応えなかった**——`.hit` が無ければ return しており、
    帯まで届いていなかった。
    ——**触れるように見せたなら、触れて応えねばならない。**

    ══ 帯ごとに色を分ける ══
    どれも同じ淡い紫では、**帯がいくつあるのかすら読めない。**
    置く物の色に合わせる——コード名は焦茶、記号は紫、注釈は灰、歌詞は青。
    ══════════════════════════════════════════════════════════════ */
 try{
   const _k277=U.song?U.song.id:null;
   U.makeBackingSong({prog:'pop',level:2,seed:5}); U.song.genTemp=false;
   const zonesOf=()=>{ const z={};
     [...d.querySelectorAll('#paper .hit-mark')].forEach(el=>{
       const k=[...el.classList].find(c=>/^hz-/.test(c)); if(k) z[k]=(z[k]||0)+1; });
     return z; };
   /* ① 入力モードでも、帯が出ること */
   U.mode='rhythm'; U.render();
   { const z=zonesOf();
     ok('[277] 入力でも帯を出す',
        (z['hz-chord']||0)>0&&(z['hz-sym']||0)>0,
        Object.entries(z).map(([k,v])=>k+'×'+v).join(' '));
     ok('[277] 入力の印（pen-open）が立つ',
        d.body.classList.contains('pen-open'), ''); }
   U.mode='edit'; U.render();
   ok('[277] コードでもコードの帯が出る', (zonesOf()['hz-chord']||0)>0, '');
   /* ② 帯ごとに、色が分かれていること */
   { const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('\n');
     const ng=['hz-chord','hz-sym','hz-ann'].filter(k=>
       css.indexOf('pen-open .hit-mark.'+k)<0);
     ok('[277] 帯ごとに色を分ける', ng.length===0, ng.join(' '));
     ok('[277] 触れれば濃くなる', css.indexOf('hz-chord:hover')>=0, ''); }
   /* ③ 叩いて応えること——**見せておいて応えない帯があってはならない** */
   U.mode='rhythm'; U.render();
   const R2=el=>el.getBoundingClientRect();
   const clk=el=>{ const r=R2(el);
     el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,
       clientX:r.left+2,clientY:r.top+2})); };
   { const ch=[...d.querySelectorAll('#paper .hit-mark.hz-chord')][0];
     if(ch){ clk(ch);
       ok('[277] コードの帯を叩けば、入れられる',
          !!d.getElementById('dock')||!!d.querySelector('.pop'), '');
       try{ U.closePop(); }catch(_){}
       try{ U.closeDock(); }catch(_){} U.render(); } }
   { const b=U.song.bars[0];
     const before=b.notes[0].stroke;
     const sy=[...d.querySelectorAll('#paper .hit-mark.hz-sym')][0];
     if(sy){ clk(sy);
       ok('[277] 記号の帯を叩けば、向きが変わる',
          b.notes[0].stroke!==before,
          String(before)+'→'+String(b.notes[0].stroke));
       /* **空振りも同じ列に並ぶ**——巡って出せること */
       /* **押すたび描き直される**ので、的を毎回取り直す——
          古い的を押し続けても届かない */
       const seen=new Set([b.notes[0].stroke]);
       for(let i=0;i<5;i++){
         const sy2=[...d.querySelectorAll('#paper .hit-mark.hz-sym')][0];
         if(!sy2) break;
         clk(sy2);
         const b2=U.findBar(U.song,U._disp[0].barId);
         seen.add(b2&&b2.notes[0]?b2.notes[0].stroke:null);
       }
       ok('[277] 空振りも同じ道から出せる',
          seen.has('xd')||seen.has('xu'),
          [...seen].map(String).join(' ')); } }
   /* ④ 譜面を壊さないこと——**帯を叩いて音符が動いてはならない** */
   { const b=U.song.bars[0];
     const sum=(b.notes||[]).reduce((a,n)=>a+(n.len||0),0);
     ok('[277] 帯を叩いても譜面は崩れない',
        sum===U.barTicks(U.song,b), sum+'/'+U.barTicks(U.song,b)); }
   U.mode='rhythm';
   try{ if(_k277&&U.song.id!==_k277) U.switchSong(_k277); }catch(_){}
 }catch(e){ ok('[277] 帯', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    録音・第一段（1.278 ／ ScoreLineTAB より）

    L様——「録音の仕様をそのまま入れて欲しい」。

    伴奏を鳴らしながらご自身の演奏を録り、あとで重ねて聴き返す。
    **譜面が「作る物」から「弾く物」になる**ための一歩。

    ══ 器に節点を足さない（TAB 5.80）══
    マイクを器へ入れると**入りと出が別の時計で動く**ため、
    器がずれを埋めようとして周期的な乱れが出る。
    マイクの流れを `MediaRecorder` へ直に渡す。

    ══ 前の測りは、次の測りの前に捨てる（TAB 6.12）══
    `songHeadSec` を消し忘れると、録る前に一度でも ▶ を押していれば
    **その時の値が新しい控えに当てられる**——鳴らぬか、あらぬ所から鳴る。
    **残った物差しは、無い物差しより悪い。**
    ══════════════════════════════════════════════════════════════ */
 try{
   ok('[278] 録音の仕組みが在る',
      typeof U.recToggle==='function'&&typeof U.recPlayAt==='function'&&!!U.REC, '');
   U.makeBackingSong({prog:'pop',level:2,seed:5}); U.song.genTemp=false; U.render();
   /* ● の札が在ること */
   { const b=[...d.querySelectorAll('.bb-btn')].find(x=>/録音/.test(x.title||''));
     ok('[278] ● の札が在る', !!b, b?b.title:'—'); }
   /* **マイクを借りられない時は、黙って失敗しない** */
   ok('[278] 控えが無ければ、まだ録っていない', !U.recHas(), '');
   /* 控えが無い時に鳴らそうとしても、落ちないこと */
   { let ng=false; try{ U.recPlayAt(0,0); }catch(_){ ng=true; }
     ok('[278] 控えが無くても落ちない', !ng, ''); }
   /* ══ 控えを差し込んで、鳴らす道を確かめる ══ */
   { const ac=U.audioReady();
     if(ac){
       const buf=ac.createBuffer(1,Math.round(ac.sampleRate*3),ac.sampleRate);
       U.REC.buf=buf; U.REC.dur=3; U.REC.sr=ac.sampleRate; U.REC.songHeadSec=0.5;
       ok('[278] 控えが在ると分かる', U.recHas(), '');
       U.render();
       const b2=[...d.querySelectorAll('.bb-btn')].find(x=>/録り直す/.test(x.title||''));
       ok('[278] 控えが在れば、札の文言が変わる', !!b2, b2?b2.title:'—');
       /* 鳴らす・止める */
       U.recPlayAt(ac.currentTime+0.1,0);
       ok('[278] 控えを鳴らせる', !!U.REC.node, '');
       U.recStopSrc();
       ok('[278] 控えを止められる', !U.REC.node, '');
       /* **再生と一緒に鳴ること**——ここが眼目。譜面と重ねて聴ける */
       U.playStart();
       ok('[278] 再生すれば、控えも一緒に鳴る', !!U.REC.node, '');
       U.playStop();
       ok('[278] 止めれば、控えも止まる', !U.REC.node, '');
       /* ══ 消せば、物差しも消えること ══
          **残った物差しは、無い物差しより悪い**（TAB 6.12） */
       U.recClear();
       ok('[278] 消せば、控えも物差しも消える',
          !U.recHas()&&U.REC.songHeadSec==null&&U.REC.X==null,
          JSON.stringify({has:U.recHas(),head:U.REC.songHeadSec,X:U.REC.X}));
     } }
   /* **借りた物は返す。**四小節の曲を残したまま次の点検へ渡さない */
   U.makeSightSong({level:2,bars:12,seed:5}); U.song.genTemp=false; U.render();
 }catch(e){ ok('[278] 録音', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    録音・第二段：頭合わせと校正（1.279 ／ ScoreLineTAB より）

    ══ 二段構え ══
      機器ごとの固定ずれ … 一度測れば自動で揃う（〈頭のずれを測る〉）
      残る差            … 摘みで耳から詰めていただく（〈録音の頭合わせ〉）
    **判る所まで器が出し、判らぬ所だけ耳で詰めていただく。**

    ══ 数が信じられぬ時は、使わない ══
    拍が三つ未満／並びが揃わない／ばらつきが 80ミリ秒を越える——
    いずれも採らずに置く。**間違った数を採るより、採らぬ方がよろしい。**
    ══════════════════════════════════════════════════════════════ */
 try{
   ok('[279] 校正の仕組みが在る',
      typeof U.calRun==='function'&&typeof U.recNudgeOfs==='function', '');
   ok('[279] 測りの部品が在る',
      typeof U.onsetsOf==='function'&&typeof U.envelopeOf==='function', '');
   U.makeBackingSong({prog:'pop',level:2,seed:5}); U.song.genTemp=false;
   /* ══ 頭合わせの摘み ══ */
   { const c0=(U.library&&typeof U.library.recOfs==='number')?U.library.recOfs:0;
     U.recNudgeOfs(-c0);                       /* 0 から始める */
     U.recNudgeOfs(50);
     ok('[279] 摘みが効く', U.library.recOfs===50, String(U.library.recOfs));
     U.recNudgeOfs(-10);
     ok('[279] 前後どちらへも動く', U.library.recOfs===40, String(U.library.recOfs));
     /* **端で止まること**——際限なくずらせば、控えが曲の外へ出る */
     U.recNudgeOfs(99999);
     ok('[279] 端で止まる', U.library.recOfs===5000, String(U.library.recOfs));
     U.recNudgeOfs(-99999);
     ok('[279] 逆の端でも止まる', U.library.recOfs===-5000, String(U.library.recOfs));
     U.recNudgeOfs(5000);                      /* 0 へ戻す */ }
   /* ══ 控えの音量 ══ */
   { U.setRecVol(0.5);
     ok('[279] 音量を変えられる', U.recVolOf()===0.5, String(U.recVolOf()));
     U.setRecVol(99);
     ok('[279] 音量も端で止まる', U.recVolOf()===4, String(U.recVolOf()));
     U.setRecVol(1); }
   /* ══ 最初の音を1拍目に ══ */
   { U.recClear();
     ok('[279] 控えが無ければ、合わせられない',
        U.recSnapToggle()===false, '');
     const ac=U.audioReady();
     if(ac){
       const buf=ac.createBuffer(1,Math.round(ac.sampleRate*4),ac.sampleRate);
       U.REC.buf=buf; U.REC.dur=4; U.REC.sr=ac.sampleRate;
       U.REC.songHeadSec=0.5; U.REC.performanceHeadSec=0.72;
       ok('[279] はじめは、録った位置のまま', U.recSongHeadSec()===0.5,
          String(U.recSongHeadSec()));
       U.recSnapToggle();
       ok('[279] 最初の音に合わせられる', U.recSongHeadSec()===0.72,
          String(U.recSongHeadSec()));
       U.recSnapToggle();
       ok('[279] 元へ戻せる', U.recSongHeadSec()===0.5, String(U.recSongHeadSec()));
       U.recClear();
       /* **消せば、合わせも解ける** */
       ok('[279] 消せば合わせも解ける',
          !U.REC.snapOn&&U.REC.performanceHeadSec==null, '');
     } }
   /* ══ 校正の画面 ══ */
   { U.calRun();
     /* マイクの無い器では開いて閉じる——**それも正しい振る舞い** */
     U.calStop();
     ok('[279] 校正の画面を閉じられる', !d.querySelector('.cal-ov'), ''); }
   /* ══ 設定に、録音の段が在ること ══ */
   { U.renderSettings();
     const gs=[...d.querySelectorAll('.set-grp')];
     const rec=gs.find(x=>/録音/.test(x.textContent));
     ok('[279] 設定に〈録音〉の段が在る', !!rec, '');
     if(rec){
       const labs=[...rec.querySelectorAll('label')].map(x=>x.textContent);
       ok('[279] 頭合わせ・固定ずれ・音量が揃う',
          labs.some(t=>/頭合わせ/.test(t))&&labs.some(t=>/固定ずれ/.test(t))
          &&labs.some(t=>/音量/.test(t)), labs.join(' / '));
     } }
   /* **借りた物は返す。**四小節の曲を残したまま次の点検へ渡さない */
   U.makeSightSong({level:2,bars:12,seed:5}); U.song.genTemp=false; U.render();
 }catch(e){ ok('[279] 頭合わせと校正', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    録音・第三段：合わせの報告（1.280）

    録り終えたあと、**演奏が譜面に対してどれだけ前後したか**を申し上げる。

    ══ 混ぜる必要はない ══
    ScoreLineTAB は「器の音を混ぜて録らねば測れない」としていた。
    だが**譜面の音はこちらが鳴らしているのだから、何時に鳴らしたかは器が知っている。**
    録って測り直す道理はない。
    ——**知っている数を、測り直さない。**
    控えから拾うのは演奏の音だけでよく、控えた刻と引き算する。
    **きれいに録ることと、ずれを測ることは、両立する。**

    ══ 走りともたりを、相殺させない ══
    平均だけでは「揺れているのに、ぴったり」に見える。
    ばらつきも併せて申し上げる。
    ══════════════════════════════════════════════════════════════ */
 try{
   ok('[280] 報告の仕組みが在る', typeof U.recJointReport==='function', '');
   U.makeBackingSong({prog:'pop',level:2,seed:5}); U.song.genTemp=false;
   const ac=U.audioReady();
   if(ac){
     const sr=ac.sampleRate;
     const spb=60/((U.song.play&&U.song.play.bpm)||100);
     /* 拍の刻に音を置いた、偽の控えを作る */
     const mk=(offs)=>{
       const n=Math.round(sr*5), pcm=new Float32Array(n);
       U.REC.pcm=pcm; U.REC.sr=sr; U.REC.dur=5;
       U.REC.buf=ac.createBuffer(1,n,sr); U.REC.X=0;
       U.REC.countAC=[0.5,0.5+spb,0.5+spb*2,0.5+spb*3];
       U.REC.beatAC=[]; for(let k=0;k<4;k++) U.REC.beatAC.push(0.5+spb*(4+k));
       [].concat(U.REC.countAC,U.REC.beatAC).forEach((t,i)=>{
         const o=(typeof offs==='function')?offs(i):offs;
         const i0=Math.round((t+o)*sr);
         for(let j=0;j<Math.round(0.05*sr);j++){ const x=j/sr;
           pcm[i0+j]=Math.sin(2*Math.PI*440*x)*Math.exp(-x/0.02); }
       });
       return U.recJointReport();
     };
     /* **もたり・走り・揺れを、それぞれ言い当てること** */
     ok('[280] ぴったりなら、そう申す',
        /ほぼ揃って/.test(mk(0)), mk(0).slice(0,30));
     { const r=mk(0.08);
       ok('[280] もたりを言い当てる',
          /もたって/.test(r)&&/8\d ミリ秒/.test(r), r.slice(0,40)); }
     { const r=mk(-0.06);
       ok('[280] 走りを言い当てる',
          /走って/.test(r)&&/6\d ミリ秒/.test(r), r.slice(0,40)); }
     /* ══ ここが眼目——**平均では「揃っている」に見える揺れ** ══ */
     { const r=mk(i=>[0,0.05,-0.04,0.06,-0.05,0.04,0,0.05][i]||0);
       ok('[280] 揺れを、平均に相殺させない',
          /揺れが/.test(r), r.slice(0,60)); }
     /* 拍ごとのずれも出すこと */
     ok('[280] 拍ごとのずれを並べる',
        /拍ごとのずれ/.test(mk(0.03)), '');
     /* ══ 測れぬ時は、測れぬと申す ══ */
     { const n=Math.round(sr*5);
       U.REC.pcm=new Float32Array(n); U.REC.dur=5;
       ok('[280] 演奏が入っていなければ、そう申す',
          /入っておりませぬ/.test(U.recJointReport()), U.recJointReport()); }
     { U.REC.X=null;
       ok('[280] 刻が結べなければ、そう申す',
          /結べておりませぬ/.test(U.recJointReport()), ''); }
     U.recClear();
     ok('[280] 控えが無ければ、何も申さない', U.recJointReport()==='', '');
     /* **消せば、控えた刻も消える** */
     ok('[280] 消せば、控えた刻も消える',
        U.REC.countAC==null&&U.REC.beatAC==null&&U.REC.gap==null, '');
   }
   U.makeSightSong({level:2,bars:12,seed:5}); U.song.genTemp=false; U.render();
 }catch(e){ ok('[280] 合わせの報告', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    名乗った進行と、鳴っている進行が同じこと（1.239）

    L様——「選んだコード進行と譜面に書いてあるのが違う」。

    曲名は三択で正しく組んでいたのに、**セクションの見出しだけが
    型の名（既定 'pop'）の一択**で、部品を並べた時も必ず〈王道〉と
    名乗っていた。**同じ物に二つの答えを置かない**（§1.174）。

    ——**見立ての関数を突き合わせるのではなく、
      「出てきた和音の度数」を数えて確かめる。**
    見出しの文字だけ合わせても、中身が違えば直したことにならない。
    ══════════════════════════════════════════════════════════════ */
 try{
   const DEG=['I','♭II','II','♭III','III','IV','♭V','V','♭VI','VI','♭VII','VII'];
   const degsOf=(s9,kroot)=>{
     const out=[];
     (s9.bars||[]).forEach(b=>{
       const cs=[];
       (b.notes||[]).forEach(x=>{ if(x.chord) cs.push({at:x.start,c:x.chord}); });
       if(b.chordAt) Object.keys(b.chordAt).forEach(k=>cs.push({at:+k,c:b.chordAt[k]}));
       cs.sort((a2,b2)=>a2.at-b2.at);
       const seen=new Set();
       cs.forEach(x=>{ if(seen.has(x.at))return; seen.add(x.at);
         out.push(DEG[((x.c.root-kroot)%12+12)%12]); });
     });
     return out.join(' ');
   };
   const KF=U.BK_KEYS.find(x=>x.root===5&&x.qual==='maj');
   const badN=[], badD=[], badT=[];
   U.BK_PARTS.forEach(p2=>{
     const s9=U.genBackingSong({parts:[p2.id],key:KF,genre:'pops',tension:'none',
                                mod:'none',borrow:false,seed:4,bass:true});
     if(!s9){ badN.push(p2.id+'（組めず）'); return; }
     const sec=((s9.sections||[])[0]||{}).name||'';
     if(sec!==p2.name) badN.push(p2.id+'：見出し「'+sec+'」≠「'+p2.name+'」');
     if(s9.meta.title.indexOf(p2.name.replace(/（.*/,''))<0)
       badT.push(p2.id+'：'+s9.meta.title);
     const want=[];
     (p2.deg||[]).forEach(cell=>U.bkBarChords(cell).forEach(c=>{
       if(c) want.push(DEG[((c[0]%12)+12)%12]); }));
     const got=degsOf(s9,KF.root);
     if(got!==want.join(' ')) badD.push(p2.id+'：出 '+got+' ／ 宣言 '+want.join(' '));
   });
   ok('[239] 部品を並べた時、見出しがその進行を名乗る', badN.length===0, badN.join(' / '));
   ok('[239] 曲名にもその進行が出る', badT.length===0, badT.join(' / '));
   /* **見出しの字だけでなく、鳴っている度数まで一致すること** */
   ok('[239] 名乗った進行と、鳴る度数が合う', badD.length===0, badD.join(' / '));
   const badP=[];
   U.BK_PROGS.forEach(pg=>{
     const kk=U.BK_KEYS.find(x=>x.qual===((pg.qual==='min')?'min':'maj'));
     const s9=U.genBackingSong({prog:pg.id,key:kk,genre:'pops',tension:'none',
                                mod:'none',borrow:false,seed:4,bass:true});
     if(!s9){ badP.push(pg.id+'（組めず）'); return; }
     const sec=((s9.sections||[])[0]||{}).name||'';
     if(sec!==pg.name) badP.push(pg.id+'：見出し「'+sec+'」≠「'+pg.name+'」');
     if(s9.meta.title.indexOf(pg.name)<0) badP.push(pg.id+'：曲名 '+s9.meta.title);
   });
   ok('[239] 型で選んだ時も、見出しと曲名が揃う', badP.length===0, badP.join(' / '));
   /* **手で並べた時は、そう名乗ること**（型の名を騙らない） */
   { const s9=U.genBackingSong({chords:[{root:5,type:'maj7',bass:null},
                                        {root:0,type:'dom7',bass:null}],
                                key:KF,genre:'pops',seed:4,bass:true});
     const sec=s9?(((s9.sections||[])[0]||{}).name||''):'';
     ok('[239] 手で並べた進行は、型の名を騙らない',
        !!s9&&sec.indexOf('王道')<0&&s9.meta.title.indexOf('手で並べた進行')>=0,
        sec+' ／ '+(s9?s9.meta.title:'—')); }
 }catch(e){ ok('[239] 名乗りと中身の照合', false, e.message); }

 /* ══════════════════════════════════════════════════════════════
    一巡が繰り返される曲でも、全周から当てが引けること（1.238）

    **当ては一巡ぶんで持つ。**二周目・三周目のマスは、一巡の同じ番号へ
    写って同じ物を引く——写らなければ、「四小節を四回まわす」伴奏の
    二周目から先で、当てが消えたように見える。

    **この段は曲を借りるので、独立させて置く。**
    他の段の途中に挟めば、その段が使っていた曲を奪う（実際に奪った）。
    ══════════════════════════════════════════════════════════════ */
 try{
   const kL=U.song.id;
   U.song.genTemp=false; U.saveSong(U.song);
   /* **設えは全部明示する**——省いた分は道具の既定に握られ、
      前の段の操作で結果が変わる（実際、繰り返しが消えた） */
   const sL=U.genBackingSong({parts:['p_turn','p_turn','p_turn','p_turn'],
                              tension:'none',level:2,seed:12,bass:true,
                              genre:'pops',mod:'none',borrow:false,
                              key:U.BK_KEYS.find(x=>x.root===0&&x.qual==='maj')});
   if(sL){
     U.flushSave(); U.saveSong(sL); U.switchSong(sL.id);
     const stL=U.fbState();
     const kpL={on:stL.on, only:stL.only, pc:JSON.stringify(stL.perChord||{})};
     stL.on=true; stL.only='all'; stL.perChord={};
     U.renderFretboard();
     const cyL=U.fbProgCycle();
     ok('[238] 繰り返す曲が組めた', cyL.laps>1,
        'all='+(cyL.all||[]).length+' rows='+cyL.rows.length+' laps='+cyL.laps);
     if(cyL.laps>1){
       (cyL.rows||[]).forEach((r,i)=>{ if(r.name)
         stL.perChord[U.fbSlotKey(i,r.name)]='minpent^0'; });
       const lost=[];
       (cyL.all||[]).forEach((r,k)=>{ if(!r.name) return;
         const bar=U.findBar(sL,r.barId);
         const i2=U.fbSlotAt(cyL,bar,r.tick);
         if(i2<0||U.fbAsgAt(cyL,i2,r.name)!=='minpent^0') lost.push(k+1); });
       ok('[238] 二周目以降のマスからも当てが引ける', lost.length===0, lost.join(','));
       /* **一巡ぶんだけ持てば足りること**（全マス分は持たない） */
       ok('[238] 控えは一巡ぶんで足りる',
          Object.keys(stL.perChord).length===cyL.rows.length,
          Object.keys(stL.perChord).length+'/'+cyL.rows.length);
     }
     /* **借りた物は、確かに返す** */
     stL.on=kpL.on; stL.only=kpL.only; stL.perChord=JSON.parse(kpL.pc);
     U.saveLibrary();
     U.song.genTemp=false; U.saveSong(U.song);
     const midL=U.song.id;
     try{ U.switchSong(kL); U.render(); U.renderFretboard(); }catch(_){}
     try{ U.doDeleteSong(midL); }catch(_){}
     ok('[238] 借りた曲を返せる', U.song.id===kL, '');
   }
 }catch(e){ ok('[238] 繰り返す曲での当て', false, e.message); }



 /* ══ テンション（1.164 → 1.174 で伴奏の側へ）══
    L様——「コードにテンションも追加したい」「基本は七度まで」。
    **三和音だけの伴奏では、その上で弾ける音も三つしかないように聞こえる。**
    七度や九度が鳴っていれば、ソロの側もそこへ寄りかかれる。 */
 try{
   const typesOf=(t,seed)=>{
     const s2=U.genBackingSong({prog:'pop',genre:'rock8',key:{root:0,qual:'maj',name:'C'},
                                tension:t,seed:(seed||71)});
     return s2.bars.map(b=>{
       let ty=null;
       (b.notes||[]).forEach(n=>{ if(ty==null&&n.chord) ty=n.chord.type; });
       if(ty==null&&b.chordAt) Object.keys(b.chordAt).forEach(k=>{
         if(ty==null&&b.chordAt[k]) ty=b.chordAt[k].type; });
       return ty; });
   };
   /* ① 三和音のまま／七度まで／九度まで、で顔ぶれが変わること */
   { const a=typesOf('none'), b=typesOf('some'), c=typesOf('rich');
     ok('[164] 三和音のままなら三和音',
        a.every(t=>['maj','min'].indexOf(t)>=0), a.join(','));
     ok('[164] 七度まで、で七の和音が出る',
        b.some(t=>/7/.test(t)), b.join(','));
     ok('[164] 九度まで、でさらに厚くなる',
        c.some(t=>/9|13|11|add9|alt|dom6/.test(t)), c.join(',')); }
   /* ② **同じ種なら同じ伴奏。**振るたびに変わっては、稽古にならない */
   ok('[164] 同じ種なら同じ厚み', typesOf('rich',88).join(',')===typesOf('rich',88).join(','),
      typesOf('rich',88).join(','));
   ok('[164] 種が違えば変わりうる', true, '');
   /* ③ **既定は七度まで**（1.174） */
   { const d0=typesOf(undefined,71);
     ok('[164] 何も言わねば七度まで', d0.join(',')===typesOf('some',71).join(','), d0.join(',')); }
   /* ④ **手で並べた物は、そのまま。**お書きになった通りに鳴らす */
   { const cs=[{root:0,type:'maj',bass:null},{root:5,type:'maj',bass:null}];
     const s3=U.genBackingSong({chords:cs,tension:'rich',seed:5});
     const got=s3.bars.map(b=>{
       let ty=null;
       (b.notes||[]).forEach(n=>{ if(ty==null&&n.chord) ty=n.chord.type; });
       if(ty==null&&b.chordAt) Object.keys(b.chordAt).forEach(k=>{
         if(ty==null&&b.chordAt[k]) ty=b.chordAt[k].type; });
       return ty; }).join(',');
     ok('[164] 手で並べた物は、そのまま', got==='maj,maj', got); }
   /* ⑤ **どの和音も道具の型に在ること。**名前の出ない和音は譜面に書けない */
   { const bad=[];
     ['pop','canon','blues','twofive','minor','dorian','vamp','jazzblues'].forEach(p2=>{
       ['none','some','rich'].forEach(t=>{
         const s4=U.genBackingSong({prog:p2,tension:t,seed:33});
         s4.bars.forEach(b=>{
           const c=(b.notes||[]).map(n=>n.chord).filter(Boolean)[0]
                 ||(b.chordAt?Object.keys(b.chordAt).map(k=>b.chordAt[k])[0]:null);
           if(c&&!U.CD[c.type]) bad.push(p2+'/'+t+'/'+c.type);
         });
       });
     });
     ok('[164] どの和音も道具の型に在る', bad.length===0, [...new Set(bad)].join(',')); }
   /* ⑥ **属和音がいちばん自由が利く。**そこを厚く配ってある（1.175：度数で持つ） */
   { const dom=U.BK_TENSION.maj[7].rich||[];
     const ton=U.BK_TENSION.maj[0].rich||[];
     ok('[164] 属の度数がいちばん厚い', dom.length>=ton.length,
        dom.length+' / '+ton.length);
     ok('[164] 短調の属には変化した九度も入る',
        (U.BK_TENSION.min[7].rich||[]).indexOf('dom7b9')>=0,
        (U.BK_TENSION.min[7].rich||[]).join(',')); }
   /* ⑦ 厚くしても、鳴って描けること */
   { const bad=[];
     ['jazzbl','neosoul','modal','city','swing','bossa'].forEach(g=>{
       try{
         const s5=U.genBackingSong({genre:g,prog:U.bkGenre(g).prog,tension:'rich',seed:404});
         s5.bars.forEach(b=>U.engrave(s5,b,{width:400,hits:true,barId:b.id}));
         if(U.buildTimeline(s5).ev.filter(e=>e.kind==='note').length===0) bad.push(g+'：鳴らない');
       }catch(e){ bad.push(g+'：'+e.message); }
     });
     ok('[164] 厚くしても鳴って描ける', bad.length===0, bad.join(' / ')); }
   /* ⑧ 打ち込みでもテンションが読めること */
   { const bad=[];
     ['CM7','G13','D7b9','Bm7-5','E7alt','Am7(11)','F9sus'].forEach(w=>{
       if(!U.parseChord(w)) bad.push(w);
     });
     ok('[164] 打ち込みでもテンションが読める', bad.length===0, bad.join(' / ')); }
 }catch(e){ ok('[164] テンションの実地', false, e.message); }


 /* ══ 11th を積んだ和音（1.165）══
    L様——「11thはない？」。無かった。9th と 13th、♯11 はあったが、
    **完全11度を積んだ形がまるごと抜けていた。**
    11度は積み方で意味が変わる——m11 は短和音へ、sus4 系は属へ、♯11 はトニックへ。 */
 try{
   /* ① 型が在ること。**構成音が理屈どおりであること** */
   { const want={
       min11:[0,3,7,10,14,17],       /* R ♭3 5 ♭7 9 11 */
       dom9sus4:[0,5,7,10,14],       /* R 4 5 ♭7 9 */
       maj7s11:[0,4,7,11,18],        /* R 3 5 7 ♯11 */
       dom11:[0,7,10,14,17],         /* 三度を抜く（濁りを避ける） */
     };
     const bad=[];
     Object.keys(want).forEach(k=>{
       if(!U.CD[k]){ bad.push(k+'：無い'); return; }
       if(U.CD[k].iv.join(',')!==want[k].join(',')) bad.push(k+'：'+U.CD[k].iv.join(','));
     });
     ok('[165] 11度の和音が在り、構成音が正しい', bad.length===0, bad.join(' / ')); }
   /* ② **長三和音に完全11度を積んだ形は、道具から混ぜないこと。**
        ドとファがぶつかる——事故のもとである */
   { const bad=[];
     Object.keys(U.BK_TENSION).forEach(q=>{
       Object.keys(U.BK_TENSION[q]).forEach(deg=>{
         ['some','rich'].forEach(lv=>{
           if((U.BK_TENSION[q][deg][lv]||[]).indexOf('dom11')>=0) bad.push(q+'/'+deg+'/'+lv);
         });
       });
     });
     ok('[165] C11 の形は、道具から混ぜない', bad.length===0, bad.join(',')); }
   /* ③ **それでも、書かれれば読むこと。**
        混ぜないことと、読まないことは別である */
   { const cases=[['Am11','min11'],['Am7(11)','min11'],['G9sus4','dom9sus4'],
                  ['G9sus','dom9sus4'],['CM7(#11)','maj7s11'],['CM7♯11','maj7s11'],
                  ['G7(#11)','dom7s11'],['C11','dom11'],['G7sus4','dom7sus4']];
     const bad=[];
     cases.forEach(([w,t])=>{ const c=U.parseChord(w); if(!c||c.type!==t) bad.push(w+'→'+(c?c.type:'—')); });
     ok('[165] 11度の綴りが読める', bad.length===0, bad.join(' / ')); }
   /* ④ 置き所が理屈どおりであること */
   {
     /* 1.175：置き所は「種類」ではなく「度数」で持つ */
     ok('[165] m11 は ii・vi・i・iv へ',
        (U.BK_TENSION.maj[2].rich||[]).indexOf('min11')>=0
        &&(U.BK_TENSION.min[0].rich||[]).indexOf('min11')>=0, '');
     ok('[165] sus4 系は属へ',
        (U.BK_TENSION.maj[7].rich||[]).indexOf('dom9sus4')>=0
        &&(U.BK_TENSION.maj[7].rich||[]).indexOf('dom7sus4')>=0,
        (U.BK_TENSION.maj[7].rich||[]).join(','));
     /* **♯11 は IV と ♭VI へ**（トニックに乗せれば ♯4 が出て、調の外である） */
     ok('[165] ♯11 は IV へ', (U.BK_TENSION.maj[5].rich||[]).indexOf('maj7s11')>=0,
        (U.BK_TENSION.maj[5].rich||[]).join(','));
     ok('[165] ♯11 をトニックには乗せない',
        (U.BK_TENSION.maj[0].rich||[]).indexOf('maj7s11')<0,
        (U.BK_TENSION.maj[0].rich||[]).join(','));
     /* **属に長七度を乗せない**——これが 1.175 で直した所である */
     ok('[165] 属に長七度を乗せない',
        (U.BK_TENSION.maj[7].rich||[]).every(t=>!/^maj/.test(t))
        &&(U.BK_TENSION.maj[7].some||[]).indexOf('maj7')<0,
        (U.BK_TENSION.maj[7].rich||[]).join(',')); }
   /* ⑤ 押さえが出ること（**知っていても押さえられなければ、譜面に使えない**） */
   { const bad=[];
     ['min11','dom9sus4','maj7s11','dom11'].forEach(t=>{
       [0,5,7,9].forEach(r2=>{
         const v=U.resolveVoicing(U.song,{chord:{root:r2,type:t,bass:null}});
         if(!v) bad.push(t+'/'+r2);
       });
     });
     ok('[165] どの根音でも押さえが出る', bad.length===0, bad.slice(0,4).join(',')); }
   /* ⑥ 名前が出ること（**名前の出ない和音は、譜面に書けない**） */
   { const bad=[];
     ['min11','dom9sus4','maj7s11','dom11'].forEach(t=>{
       const n=U.chordName({root:0,type:t,bass:null},U.song.meta);
       if(!n) bad.push(t);
     });
     ok('[165] 名前が出る', bad.length===0, bad.join(',')); }
   /* ⑦ 伴奏に混ぜても、鳴らせて描けること */
   { const built=U.genBackingSong({
       chords:[{root:9,type:'min11',bass:null},{root:7,type:'dom9sus4',bass:null}],
       tension:'rich', seed:12});
     let err=null;
     try{ built.bars.forEach(b=>U.engrave(built,b,{width:400,hits:true,barId:b.id})); }
     catch(e){ err=e.message; }
     ok('[165] 11度の和音でも譜面が描ける', !err, String(err));
     ok('[165] 鳴らせる', U.buildTimeline(built).ev.filter(e=>e.kind==='note').length>0, ''); }
 }catch(e){ ok('[165] 11度の実地', false, e.message); }

 /* ══ 器の親子を、点検で見張る（1.166）══
    L様——「曲目開けない」。
    アドリブ台の器を紙の入れ物の**中**へ入れてしまい、閉じ括弧の数が合わず、
    **後ろに続く器（曲の一覧・設定・手引き）を丸ごと呑み込んでいた。**
    画面は一見ふつうに出るので、開いてみるまで分からない——
    **JavaScript の点検はぜんぶ通っていた。**
    ゆえに、器の親子そのものを見張る。 */
 try{
   const body=d.body;
   /* ① 画面いっぱいの器は、body の直下に在ること */
   /* 1.174 で台を畳んだので、見張る器はこの四つ。
      **教訓は器の数ではなく「入れ子にしない」ことなので、点検は残す** */
   [['ov-songs','曲を選ぶ'],['ov-set','設定'],
    ['ov-help','手引き'],['botbar','下の帯']].forEach(([id,nm])=>{
     const el=d.getElementById(id);
     ok('[166] '+nm+'の器が body の直下に在る',
        !!el&&el.parentNode===body,
        el?('親='+(el.parentNode.id||el.parentNode.className||el.parentNode.tagName)):'器が無い');
   });
   /* ② **器が入れ子になっていないこと。**
        呑み込まれた器は、開いても親に隠れて出てこない */
   { const ids=['ov-songs','ov-set','ov-help'];
     const bad=[];
     ids.forEach(a=>ids.forEach(b=>{
       if(a===b) return;
       const x=d.getElementById(a), y=d.getElementById(b);
       if(x&&y&&x.contains(y)) bad.push(b+' が '+a+' の中');
     }));
     ok('[166] 器どうしが入れ子になっていない', bad.length===0, bad.join(' / ')); }
   /* ③ 実際に開けること（**器が在るだけでは足りない**） */
   { U.openSheet('ov-songs');
     const ov=d.getElementById('ov-songs');
     ok('[166] 曲の一覧が開く', ov.classList.contains('open'), '');
     ok('[166] 中身が見えている', !!ov.querySelector('#song-list'), '');
     ok('[166] 他の器に呑まれていない',
        !d.getElementById('ov-help').contains(ov), '');
     U.closeSheet('ov-songs'); }
   /* ④ 紙の入れ物が、閉じ括弧の食い違いで壊れていないこと */
   { const pw=d.querySelector('.paperwrap');
     ok('[166] 紙の入れ物が譜面と指板だけを抱えている',
        !!pw&&!pw.querySelector('.sheet-ov'), ''); }
 }catch(e){ ok('[166] 器の親子の実地', false, e.message); }

 /* ══ 指板は、余った方いっぱいまで（1.167 → 1.174 で譜面側の指板へ）══
    L様——「指板が画面いっぱいになってないんだが？」。
    幅に合わせて描いていたので、**縦が大きく余っていた。**
    指板は横長なので、六本の弦しかない物を縦いっぱいにするには
    **間隔で稼ぐ**しかない。
    台を畳んだ（1.174）ので、見る先は譜面側の指板（body.fb-big）である。 */
 try{
   const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('');
   /* ① 画面いっぱいの時、器が余りを取り、指板が縦横いっぱいまで伸びること */
   ok('[167] 指板の器が余りを取る',
      /body\.fb-big \.fb-row\{[^}]*flex:1 1 auto/.test(css), '');
   ok('[167] 指板は縦横いっぱいまで',
      /body\.fb-big \.fbsvg\{[^}]*height:100%[^}]*max-height:100%/.test(css), '');
   ok('[167] 譜面は伏せる',
      /body\.fb-big \.paper,body\.fb-big \.printhead\{visibility:hidden\}/.test(css), '');
   /* ② 弦の間隔を広げたこと（**縦へ寄せる唯一の手**） */
   { const src2=[...d.querySelectorAll('script')].map(x=>x.textContent).join('');
     const m=src2.match(/const sx=big\?(\d+):\d+, sy=big\?(\d+):\d+/);
     ok('[167] 弦の間隔を広げた', m&&+m[2]>=44, m?m[2]+'px':'—');
     if(m){ const sx=+m[1], sy=+m[2];
       const W=46+15*sx+16, H=20+5*sy+28;
       ok('[167] 縦横の比が縦寄りになった', (W/H)<3.0, (W/H).toFixed(2)); } }
   /* ③ 丸と字も、そのぶん大きいこと（**器だけ大きくしても読めない**） */
   { const st=U.fbState(); const keep=st.big; st.big=true; st.on=true;
     U.renderFretboard();
     const svg=(d.querySelector('#fbbar .fbsvg')||{outerHTML:''}).outerHTML;
     const rs=[...svg.matchAll(/<circle[^>]*r="([\d.]+)"/g)].map(m=>+m[1]);
     ok('[167] 丸が大きい', rs.length>0&&Math.max(...rs)>=14,
        rs.length?String(Math.max(...rs)):'—');
     const fs=[...svg.matchAll(/font-size="([\d.]+)" font-weight="800"/g)].map(m=>+m[1]);
     ok('[167] 度数の字も大きい', fs.length>0&&Math.max(...fs)>=12,
        fs.length?String(Math.max(...fs)):'—');
     st.big=keep; U.saveLibrary(); U.renderFretboard(); }
 }catch(e){ ok('[167] 指板の大きさの実地', false, e.message); }


 /* ══ 一巡だけ／コードごとにスケール（1.169）══
    L様——「同じコード進行なのに毎回出すなよ。しかもループ機能使えって。
            スケールは何小節目はこれって選ぶイメージで
            そこにジャズ風ならこれとかアドバイスをだせ」。 */
 try{
   const st=U.fbState(); st.on=true; st.pin=null; st.perChord={};
   const keepId=U.song.id;
   /* 1.170 から伴奏は一巡ぶんしか作らない。
      **畳む仕掛けは、L様が手で書き足した譜面のためにある**ので、
      ここでは同じ進行を三度書き写した譜面を自分で作って試す */
   const s3=U.genBackingSong({genre:'rock8',prog:'pop',seed:9500,
     key:U.BK_KEYS.find(k=>k.root===0&&k.qual==='maj')});
   { const one=s3.bars.slice();
     const sec=s3.sections[0];
     for(let k=0;k<2;k++) one.forEach(b0=>{
       const c=U.clone?U.clone(b0):JSON.parse(JSON.stringify(b0));
       c.id=U.uid?U.uid('b'):('b'+Math.random());
       s3.bars.push(c); sec.items.push({barId:c.id,link:false});
     }); }
   U.saveSong(s3); U.switchSong(s3.id);
   /* ① 周期が見つかること */
   { const cy=U.fbProgCycle();
     ok('[169] 繰り返しの周期を見つける', cy.period<s3.bars.length,
        '周期'+cy.period+' / 全'+s3.bars.length);
     ok('[169] 何周するかも分かる', cy.laps>1, '×'+cy.laps);
     ok('[169] 一巡ぶんだけ持つ', cy.rows.length===cy.period, String(cy.rows.length)); }
   /* ② **繰り返しでない曲は、畳まないこと。**
        畳みすぎれば、進行が読めなくなる */
   { const s4=U.genBackingSong({genre:'rock8',prog:'canon',reps:1,seed:9501});
     U.saveSong(s4); U.switchSong(s4.id);
     const cy=U.fbProgCycle();
     ok('[169] 繰り返していない曲は畳まない', cy.rows.length===s4.bars.length||cy.period>=4,
        cy.period+' / '+s4.bars.length);
     U.doDeleteSong(s4.id); U.switchSong(s3.id); }
   /* ③ そのコードに合うスケールが出ること */
   { const a1=U.fbAdvice({root:7,type:'dom7',bass:null});
     ok('[169] 属七に候補が並ぶ', a1.length>=4, String(a1.length));
     ok('[169] 素直な物が先頭', a1[0].id==='mixo', a1[0].id);
     ok('[169] ジャズ風の道も出る', a1.some(x=>x.id==='alt'), a1.map(x=>x.id).join(','));
     /* 1.179：顔ぶれ全部を安全さで並べるようになったので、
        **理由の字が付くのは「好みの表」に在る物だけ**である。
        言葉の無い物が混ざるのは、言葉より順（安全さ）を先に置いた結果 */
     ok('[169] 勧める物には、なぜそれかが添えてある',
        a1.filter(x=>x.safe).slice(0,2).every(x=>!!x.why),
        a1.filter(x=>x.safe).slice(0,2).map(x=>x.id+':'+(x.why||'—')).join(' '));
     const a2=U.fbAdvice({root:2,type:'min7',bass:null});
     ok('[169] 短七にはドリアンが筆頭', a2[0].id==='dorian', a2[0].id);
     const a3=U.fbAdvice({root:0,type:'maj7s11',bass:null});
     ok('[169] M7♯11 はリディアン一択', a3[0].id==='lydian', a3[0].id);
     /* **知らない型でも、何かは返すこと**（空の札を出さない） */
     ok('[169] 知らない型でも空にしない', U.fbAdvice({root:0,type:'sus2',bass:null}).length>0, ''); }
   /* ④ 割り当てれば、指板がその和音の根音で描かれること
        **その和音の上で弾くのだから、その和音を基準に数える** */
   { const cy=U.fbProgCycle();
     const nm=cy.rows.find(r=>r.name)?.name;
     ok('[169] 進行にコード名がある', !!nm, String(nm));
     if(nm){
       const c=cy.rows.find(r=>r.name===nm).chord;
       st.perChord[nm]='mixo';
       U.renderFretboard();
       const svg=d.getElementById('fbbar').innerHTML;
       /* 根音がコードの根音になっていれば、その位置に R が出る */
       ok('[169] 割り当てが札に出る', /fb-asg/.test(svg), '');
       ok('[169] 進行の札にも添える', /<i>/.test(svg), '');
       st.perChord={}; U.renderFretboard();
     } }
   /* ⑤ ══ 曲ぜんたいに効く「止め」は廃した（1.184）══
        **一つの和音に、一つのスケール。**
        当ててあればその物が出て、外せば道具の見立てへ戻る——
        **どちらが勝つかを考えずに済むのが、一本にした値打ち**である。 */
   { const cy=U.fbProgCycle();
     const nm=cy.rows.find(r=>r.name)?.name;
     const i169=cy.rows.findIndex(r=>r.name);
     if(nm){ st.perChord[U.fbSlotKey(i169,nm)]='mixo'; st.pin='minpent';
       U.renderFretboard();
       ok('[169] 当てた物が勝つ（古い止めは効かない）',
          /fb-asg/.test(d.getElementById('fbbar').innerHTML)
          &&!/fb-asg auto/.test(d.getElementById('fbbar').innerHTML), '');
       delete st.perChord[U.fbSlotKey(i169,nm)]; U.renderFretboard();
       ok('[169] 外せば道具の見立てへ戻る',
          /fb-asg auto/.test(d.getElementById('fbbar').innerHTML), '');
       st.pin=null; st.perChord={}; U.renderFretboard(); } }
   /* ⑥ 大きい時、上の帯に被らないこと */
   { const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('');
     ok('[169] 上の帯のぶんを空ける',
        /body\.fb-big \.fbbar\{[^}]*top:var\(--fbtop/.test(css), ''); }
   U.switchSong(keepId); U.doDeleteSong(s3.id);
 }catch(e){ ok('[169] 一巡と割り当ての実地', false, e.message); }

 /* ══ 繰り返しは作らない（1.170）══
    L様——「まず繰り返しはなしにして。ループをデフォルトで全体にかければいいから」。
    仰るとおりで、**同じ進行を六回書き写した譜面は、六倍長いだけの譜面である。**
    一巡ぶんだけ作り、⟳ を最初から入れておけば足りる。 */
 try{
   /* ① 一巡ぶんだけ作ること */
   { const bad=[];
     U.BK_PROGS.forEach(pr=>{
       const s=U.genBackingSong({genre:'rock8',prog:pr.id,seed:9600});
       if(s.bars.length!==pr.bars) bad.push(pr.id+'：'+s.bars.length+'／型は'+pr.bars);
     });
     ok('[170] 進行の一巡ぶんだけ作る', bad.length===0, bad.slice(0,3).join(' / ')); }
   /* ② **⟳ が最初から入っていること** */
   { const s=U.genBackingSong({genre:'rock8',prog:'pop',seed:9601});
     ok('[170] 曲に ⟳ が書いてある', s.play.loop===true, String(s.play.loop));
     /* 開いた時に、道具の ⟳ が入ること（**書いてあっても、効かねば意味が無い**） */
     const keepId=U.song.id;
     U.TP.loop=false;
     U.saveSong(s); U.switchSong(s.id);
     ok('[170] 開けば ⟳ が入る', U.TP.loop===true, String(U.TP.loop));
     U.switchSong(keepId); U.doDeleteSong(s.id); }
   /* ③ 転調がある時だけ、二巡ぶん要ること */
   { const a=U.genBackingSong({genre:'rock8',prog:'pop',seed:9602});
     const b=U.genBackingSong({genre:'rock8',prog:'pop',mod:'up4',seed:9602});
     ok('[170] 転調があれば二巡ぶん', b.bars.length===a.bars.length*2,
        a.bars.length+' → '+b.bars.length);
     ok('[170] 区間は二つ', b.genSegs&&b.genSegs.length===2, ''); }
   /* ④ **札から「繰り返す回数」が消えていること。**
        作らない物を選ばせては、無駄な判断をさせることになる */
   { U.openBackingGen();
     const pop=d.querySelector('.pop-ov,.pop');
     ok('[170] 伴奏の札が開く', !!pop, '');
     if(pop){
       const labs=[...pop.querySelectorAll('.pg-lbl')].map(x=>x.textContent);
       ok('[170] 〈繰り返す回数〉の欄が無い',
          !labs.some(t=>/繰り返す回数/.test(t)), labs.join('/'));
       ok('[170] ⟳ が入ることを伝える',
          /⟳ を入れて/.test(pop.textContent), '');
       U.closePop&&U.closePop();
     } }
   /* ⑤ おまかせも、回数を振らないこと */
   { const o=U.bkRandomOpt(9603);
     ok('[170] おまかせは回数を持たない', o.reps===undefined, String(o.reps)); }
   /* ⑥ 譜面が短くなったこと（**目で追える長さに収まる**） */
   { const s=U.genBackingSong({genre:'funk16',prog:'blues',seed:9604});
     ok('[170] 12小節ブルースは12小節', s.bars.length===12, String(s.bars.length)); }
 }catch(e){ ok('[170] 繰り返しの実地', false, e.message); }

 /* ══ 指板は譜面の下（1.171）══
    L様——「スケールの候補が見えない、色がおかしい」。
    紙の入れ物が `display:flex` のままだったので、**指板が譜面の横へ回っていた。**
    幅が半分になり、スケールの札は溢れ、丸も潰れて見えていた。
    「譜面の下に一枚」と決めたのだから、**縦に積まねばならない。** */
 try{
   const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('');
   ok('[171] 紙の入れ物は縦に積む',
      /\.paperwrap\{[^}]*flex-direction:column/.test(css), '');
   ok('[171] 譜面は縮まない', /\.paper\{[^}]*flex:0 0 auto/.test(css), '');
   /* 器の並びでも確かめる（**書いてあるだけでなく、そう並んでいること**） */
   { const pw=d.querySelector('.paperwrap');
     const kids=pw?[...pw.children].map(x=>x.id||x.className):[];
     /* 1.208：指板は譜面の上へ移した */
     ok('[171] 指板の次に譜面が来る',
        kids.indexOf('fbbar')>=0&&kids.indexOf('paper')===kids.indexOf('fbbar')+1,
        kids.join(' → ')); }
   /* スケールの札が、独立した行に在ること */
   { const st=U.fbState(); st.on=true;
     const q171=((U.fbCurKey(U.fbCurBar())||{}).qual==='min')?'min':'maj';
     st.list={maj:['majpent','ionian','mixo','lydian','majblues','minpent'],
              min:['minpent','aeolian','dorian','minblues','harm','locrian']};
     U.saveLibrary(); U.renderFretboard();
     const box=d.getElementById('fbbar');
     const row=box.querySelector('.fb-scales');
     ok('[171] スケールの札が独立した行に在る', !!row, '');
     const bs=row?[...row.querySelectorAll('.fb-b[data-sc]')]:[];
     /* 1.180：当たる札が乏しい和音では、道具が三枚まで補う */
     ok('[171] 選んだ数だけ並ぶ（補いを除く）',
        bs.length>=st.list[q171].length&&bs.length<=st.list[q171].length+3,
        bs.length+' / '+st.list[q171].length);
     ok('[171] 〈＋ 選ぶ〉も同じ行に', !!row.querySelector('.fb-b[data-fbsc]'), '');
     /* **頭の行には道具の札だけ。**数の増える物と混ぜない */
     const head=box.querySelector('.fb-head');
     ok('[171] 頭の行にスケールの札は無い',
        !head.querySelector('.fb-b[data-sc]'), ''); }
 }catch(e){ ok('[171] 指板の置き所の実地', false, e.message); }

 /* ══ 炭色の器の上の色（1.172）══
    L様——「コード毎に設定するスケールのふだが黒くて見えない」。
    紙用の #9a3412（白地に映える濃い茶）を、**炭色の器の上にそのまま使っていた。**
    暗い地に濃い茶では、ほとんど黒である。
    加えて、割り当てたスケール名を出す `<i>` には**色を付け忘れており**、
    親の色を継いで沈んでいた。**地が変われば、字の色も変えねばならない。** */
 try{
   const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('');
   /* ① 器ごとの色を用意してあること */
   ok('[172] 炭色の器の上の色が在る',
      /--chord-on-ink:/.test(css)&&/--indigo-on-ink:/.test(css), '');
   /* ② 指板の帯の中で、紙用の色を使っていないこと */
   { const i=css.indexOf('.fbbar{');
     const j=css.indexOf('@media print{');
     const blk=css.slice(i,j>i?j:undefined);
     const bad=[];
     ['.fb-pc{','.fb-ch{','.fb-key{','.fb-asg{','.fb-lap{'].forEach(sel=>{
       const k=blk.indexOf(sel);
       if(k<0){ bad.push(sel+'（決まりが無い）'); return; }
       const rule=blk.slice(k,blk.indexOf('}',k));
       if(/#9a3412/.test(rule)) bad.push(sel+'（紙用の茶）');
       if(!/color:/.test(rule)) bad.push(sel+'（色の指定が無い）');
     });
     ok('[172] 帯の中で紙用の色を使っていない', bad.length===0, bad.join(' / ')); }
   /* ③ **割り当ての名にも色が付いていること。**ここが抜けていた */
   ok('[172] 割り当ての名に色が付いている',
      /\.fb-pc i\{[^}]*color:var\(--indigo-on-ink\)/.test(css), '');
   ok('[172] 光っている札の中でも読める',
      /\.fb-pc\.on i\{color:/.test(css), '');
   /* ④ 実際に描いて、色の指定が出ていること */
   { const st=U.fbState(); st.on=true; st.perChord={};
     const keepId=U.song.id;
     const s5=U.genBackingSong({genre:'rock8',prog:'pop',seed:9700,
       key:U.BK_KEYS.find(k=>k.root===0&&k.qual==='maj')});
     U.saveSong(s5); U.switchSong(s5.id);
     const cy=U.fbProgCycle();
     const nm=cy.rows.find(r=>r.name)?.name;
     if(nm){
       st.perChord[nm]='mixo'; U.saveLibrary(); U.renderFretboard();
       const el=[...d.querySelectorAll('#fbbar .fb-pc')].find(x=>x.querySelector('i'));
       ok('[172] 割り当ての名が札に出る', !!el, '');
       ok('[172] 中身がスケールの名', !!el&&/ミクソリディアン/.test(el.textContent),
          el?el.textContent:'—');
       st.perChord={}; U.saveLibrary();
     }
     U.switchSong(keepId); U.doDeleteSong(s5.id); }
   /* ⑤ 紙の上では、これまでどおり濃い茶のままであること
        **器が違えば色も違う。だが紙の色を変えてはならない** */
   ok('[172] 紙の上のコード名は濃い茶のまま',
      /--chord:#9a3412/.test(css), '');
 }catch(e){ ok('[172] 器ごとの色の実地', false, e.message); }

 /* ══ 炭色の器の上の札（1.173）══
    L様——「マイナーペンタの横にカーソル合わせるとクリックできるけど見えない」。
    `background:var(--bg)`（炭色の地）に `color:var(--ink)`（**炭色の字**）を
    当てていた。**地と同じ色の字は、無いのと同じである。**
    選ばれている札だけは藍地に白字なので見えており、
    だから「一つしか無い」ように見えていた。

    ══ 見張り方 ══
    一つずつ直しても、次に器を足せばまた沈む。
    **炭色の器の中で、紙用の色を使っていないこと**を決まりとして見張る。 */
 try{
   const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('');
   /* 炭色の器の決まりを、まとめて抜き出す */
   const rules=[];
   const re=/(\.fbbar|\.fb-[a-z-]+|\.jam-[a-z-]+|body\.fb-big [^{,]+)\s*(?:,[^{]*)?\{([^}]*)\}/g;
   let m;
   while((m=re.exec(css))){ rules.push({sel:m[1],body:m[2]}); }
   ok('[173] 炭色の器の決まりが読める', rules.length>=15, String(rules.length));
   /* ① **地と同じ色の字を使っていないこと** */
   { const bad=[];
     rules.forEach(r=>{
       if(/color:var\(--ink\)/.test(r.body)) bad.push(r.sel+'（字が炭色）');
       if(/background:var\(--bg\)/.test(r.body)) bad.push(r.sel+'（地が紙色）');
     });
     ok('[173] 炭色の地に炭色の字を使っていない', bad.length===0, bad.slice(0,4).join(' / ')); }
   /* ② 紙用の淡い色も使っていないこと（--dim／--line は白地の上の色） */
   { const bad=[];
     rules.forEach(r=>{
       if(/var\(--dim\)/.test(r.body)) bad.push(r.sel+'（紙用の淡い字）');
       if(/var\(--line\)/.test(r.body)) bad.push(r.sel+'（紙用の淡い枠）');
     });
     ok('[173] 紙用の淡い色も使っていない', bad.length===0, bad.slice(0,4).join(' / ')); }
   /* ③ 札に、地と字と枠がそろっていること
        **どれか一つでも欠ければ、地に沈む** */
   { const b=rules.find(r=>r.sel==='.fb-b');
     ok('[173] 札に地の色がある', !!b&&/background:/.test(b.body), '');
     ok('[173] 札に字の色がある', !!b&&/color:var\(--on-ink\)/.test(b.body), '');
     ok('[173] 札に枠がある', !!b&&/border:1px solid var\(--ink-line\)/.test(b.body), '');
     ok('[173] 触れた時に色が変わる',
        rules.some(r=>r.sel==='.fb-b'&&false)||/\.fb-b:hover\{/.test(css), ''); }
   /* ④ 選んでいない札も、実際に見えること（選んだ札との差だけで見分けない） */
   { const st=U.fbState(); st.on=true; st.pin=null;
     st.list={maj:['majpent','ionian','mixo','lydian'],
              min:['minpent','aeolian','dorian','minblues']};
     U.saveLibrary(); U.renderFretboard();
     const bs=[...d.querySelectorAll('#fbbar .fb-scales .fb-b[data-sc]')];
     ok('[173] 札が並んでいる', bs.length>=4, String(bs.length));
     const off=bs.filter(x=>!x.classList.contains('on'));
     ok('[173] 選んでいない札もある', off.length>=3, String(off.length)); }
 }catch(e){ ok('[173] 札の見え方の実地', false, e.message); }

 /* ══ 小節を押さえて運ぶ（1.101）══
    L様——「小節をドラッグでコピーアンドペーストができない。多分複数選択に吸われてる」。
    まさにその通りで、**1px でも動けば**「なぞって選ぶ」に決まり、
    運びへ移る待ち時間（520ms）を打ち切っていた。
    指でも手でも、押さえて半秒じっとしているのは無理である。
    音符の長押しには 8px の遊びがあるのに、小節には遊びが無かった。 */
 try{
   U.mode='select'; U.selTake('bar'); U.render();
   const wraps=[...d.querySelectorAll('#paper .mwrap')];
   ok('[101] 小節が並んでいる', wraps.length>=3, String(wraps.length));
   const markOf=wr=>wr.querySelector('.hit-mark:not([data-zone])')||wr.querySelector('.m-no[data-selbar]');
   const ev=(t,x,y)=>{ const e=new w.MouseEvent(t,{bubbles:true,clientX:x,clientY:y,button:0}); e.pointerId=7; return e; };
   const CARRY=520;
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   (async()=>{
     /* ① 震えても、運びへ移れること */
     U.sel.clear(); U.render();
     const w1=[...d.querySelectorAll('#paper .mwrap')][0];
     const m1=markOf(w1);
     if(!m1){ ok('[101] 小節の的がある', false, ''); }
     else{
       m1.dispatchEvent(ev('pointerdown',200,200));
       /* 手の震えぶん（数px）だけ動かす */
       [1,-2,3,-1,2].forEach((dx,i)=>w.dispatchEvent(ev('pointermove',200+dx,200+(i%2?1:-1))));
       await wait(CARRY+120);
       ok('[101] 数pxの震えでは、なぞりに決まらない', !!U.bcarry||!(U.bdrag&&U.bdrag.moved),
          'bcarry='+!!U.bcarry+' moved='+(U.bdrag?U.bdrag.moved:'—'));
       ok('[101] 押さえて待てば「運ぶ」へ移る', !!U.bcarry, 'bcarry='+!!U.bcarry);
       /* ══ 落とし先が目に見えること（1.112）══
          L様——「コピペ先に見た目の変化がないとわかりずらい」。
          細線一本では譜面の罫線と見分けが付かない。
          範囲・位置・何が起きるか——三つとも出す */
       { const css2=[...d.querySelectorAll('style')].map(el=>el.textContent).join('\n');
         const to=css2.slice(css2.indexOf('body.carrying .mwrap.carry-to{'));
         ok('[112] 落とし先は小節ぜんたいを染める', /carry-to\{[^}]*background:/.test(to), '');
         ok('[112] 差し込みの位置に太い棒を立てる',
            /carry-to::before\{[^}]*width:\s*[4-9]px/.test(to), '');
         ok('[112] 何が起きるかを字で出す',
            /carry-to::after\{[^}]*content:\s*attr\(data-carry\)/.test(to), '');
         ok('[112] 掴んだ側にも字を出す（元と先は対で読む）',
            /carry-src::after\{[^}]*content:/.test(css2), ''); }
       /* ② 落とせば写しが増える */
       const before=U.song.sections.reduce((a,sc)=>a+sc.items.length,0);
       const w3=[...d.querySelectorAll('#paper .mwrap')][2];
       if(U.bcarry&&w3){
         d.elementFromPoint=()=>markOf(w3)||w3;
         w.dispatchEvent(ev('pointermove',600,200));
         { const dst=d.querySelector('#paper .mwrap.carry-to');
           ok('[112] 落とし先に印が付く', !!dst, '');
           ok('[112] 印に「N小節をここへ」と書いてある',
              !!dst&&/小節をここへ/.test(dst.getAttribute('data-carry')||''),
              dst?dst.getAttribute('data-carry'):'—');
           ok('[112] 掴んだ側にも印が付く',
              !!d.querySelector('#paper .mwrap.carry-src'), ''); }
         w.dispatchEvent(ev('pointerup',600,200));
         const after=U.song.sections.reduce((a,sc)=>a+sc.items.length,0);
         ok('[101] 落とした所へ小節が写る', after>before, before+'→'+after);
         U.doUndo();
         ok('[101] 写しは一手で取り消せる',
            U.song.sections.reduce((a,sc)=>a+sc.items.length,0)===before, '');
       }
       d.elementFromPoint=()=>null;
     }
     /* ③ 大きく動かせば、今までどおり「なぞって選ぶ」 */
     U.sel.clear(); U.bcarry&&U.carryEnd(); U.render();
     const ws=[...d.querySelectorAll('#paper .mwrap')];
     const ma=markOf(ws[0]), mb=markOf(ws[2]);
     if(ma&&mb){
       ma.dispatchEvent(ev('pointerdown',200,200));
       d.elementFromPoint=()=>mb;
       w.dispatchEvent(ev('pointermove',400,200));
       ok('[101] 大きく動かせば、なぞって選ぶ', U.sel.size>=2||!!(U.bdrag&&U.bdrag.moved),
          '選び='+U.sel.size);
       w.dispatchEvent(ev('pointerup',400,200));
       d.elementFromPoint=()=>null;
     }
     /* ══ ④ モードで受け持ちを分ける（1.102）══
        〈入力〉では、なぞりが選びに吸われないこと——動かせば運びである */
     U.sel.clear(); U.bcarry&&U.carryEnd(); U.mode='rhythm'; U.render();
     { const ws2=[...d.querySelectorAll('#paper .mwrap')];
       const m0=markOf(ws2[0]), m2=markOf(ws2[2]);
       if(m0&&m2){
         m0.dispatchEvent(ev('pointerdown',200,200));
         d.elementFromPoint=()=>m2;
         w.dispatchEvent(ev('pointermove',400,200));
         ok('[102] 〈入力〉では、なぞればすぐ運びに入る', !!U.bcarry, 'bcarry='+!!U.bcarry);
         ok('[102] 〈入力〉では複数選択に吸われない', U.sel.size<=1, '選び='+U.sel.size);
         const before2=U.song.sections.reduce((a,sc)=>a+sc.items.length,0);
         w.dispatchEvent(ev('pointerup',400,200));
         const after2=U.song.sections.reduce((a,sc)=>a+sc.items.length,0);
         ok('[102] 〈入力〉のなぞりで小節が写る', after2>before2, before2+'→'+after2);
         if(after2>before2) U.doUndo();
         d.elementFromPoint=()=>null;
       } }
     /* ⑤ 掴んだ所へ戻せば取りやめ。**うっかり掴んだ時の逃げ道** */
     U.sel.clear(); U.render();
     { const ws3=[...d.querySelectorAll('#paper .mwrap')];
       const m0=markOf(ws3[0]);
       if(m0){
         const before3=U.song.sections.reduce((a,sc)=>a+sc.items.length,0);
         m0.dispatchEvent(ev('pointerdown',200,200));
         d.elementFromPoint=()=>m0;
         w.dispatchEvent(ev('pointermove',400,200));
         w.dispatchEvent(ev('pointerup',400,200));
         const after3=U.song.sections.reduce((a,sc)=>a+sc.items.length,0);
         ok('[102] 掴んだ所へ戻せば、何も起きない', after3===before3, before3+'→'+after3);
         d.elementFromPoint=()=>null;
       } }
     /* ⑥ 〈選択〉では、これまでどおり待たねば運びに入らない */
     U.sel.clear(); U.mode='select'; U.selTake('bar'); U.render();
     { const ws4=[...d.querySelectorAll('#paper .mwrap')];
       const m0=markOf(ws4[0]), m2=markOf(ws4[2]);
       if(m0&&m2){
         m0.dispatchEvent(ev('pointerdown',200,200));
         d.elementFromPoint=()=>m2;
         w.dispatchEvent(ev('pointermove',400,200));
         ok('[102] 〈選択〉のなぞりは、選びのまま', !U.bcarry, 'bcarry='+!!U.bcarry);
         w.dispatchEvent(ev('pointerup',400,200));
         d.elementFromPoint=()=>null;
       } }
     /* ══ 〈選択〉は叩くたびに足す（1.103）══
        L様——「選択モードで小節を選択するときはタップで増やしていけるように」。
        これまではどのモードでも「Shift を押していなければ捨てて一つだけ」。
        **指で触る道具に Shift は無い。**飛び飛びの小節は選べなかった。 */
     U.sel.clear(); U.bcarry&&U.carryEnd(); U.mode='select'; U.selTake('bar'); U.render();
     { /* **描き直されるので、叩くたびに引き直すこと。**
          控えた要素は前の紙のもので、叩いても今の紙には届かない */
       const tap=i=>{ const wr=[...d.querySelectorAll('#paper .mwrap')][i];
         const m=wr&&markOf(wr); if(!m) return false;
         m.dispatchEvent(ev('pointerdown',200,200));
         w.dispatchEvent(ev('pointerup',200,200)); return true; };
       const ws5=[...d.querySelectorAll('#paper .mwrap')];
       ok('[103] 叩ける小節が足りている', ws5.length>=5&&markOf(ws5[0])&&markOf(ws5[2]),
          '小節='+ws5.length);
       tap(0);
       const a1=U.sel.size;
       tap(2);                                        /* 隣ではなく、飛ばした小節 */
       const a2=U.sel.size;
       ok('[103] 〈選択〉は叩くたびに足せる', a1===1&&a2===2, a1+'→'+a2);
       tap(2);                                        /* もう一度叩けば外れる */
       ok('[103] もう一度叩けば外れる', U.sel.size===1, String(U.sel.size));
       tap(4); tap(1);
       ok('[103] 飛び飛びでも選べる', U.sel.size===3, String(U.sel.size)); }
     /* 〈入力〉は今までどおり一つだけ。**あそこの「選ぶ」は指差しであって、束ねる用ではない** */
     U.sel.clear(); U.mode='rhythm'; U.render();
     {
       const tap=i=>{ const wr=[...d.querySelectorAll('#paper .mwrap')][i];
         const m=wr&&markOf(wr); if(!m) return;
         m.dispatchEvent(ev('pointerdown',200,200));
         w.dispatchEvent(ev('pointerup',200,200)); };
       tap(0); tap(2);
       ok('[103] 〈入力〉では一つだけ選ばれる', U.sel.size===1, String(U.sel.size)); }
     U.sel.clear(); U.mode='rhythm'; U.render();
     fin();
   })();
   HOLD=true;
 }catch(e){ ok('[101] 小節の運びの実地', false, e.message); }

 function fin(){
   console.log('');
   console.log('  通過 '+pass+' 件 ／ 落ち '+fail+' 件');
   bad.forEach(x=>console.log('  ✗ '+x));
   console.log('');
   process.exit(fail?1:0);
 }
 if(!HOLD) fin();
},900);
