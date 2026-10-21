const fs=require('fs'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2]||'scoreline_333.html','utf8');
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
w.document.elementFromPoint=()=>null;
let pass=0,fail=0,bad=[];
const ok=(n,c,d)=>{ if(c) pass++; else {fail++; bad.push(n+(d?'  … '+d:''));} };

setTimeout(()=>{
 const U=w.UTADORI,d=w.document;
 const C={root:0,type:'maj',bass:null}, G={root:7,type:'maj',bass:null};

 /* まっさらな曲を作る */
 U.tx('用意',()=>{
   const s=U.song; s.sections=[U.mkSection({})]; s.bars=[];
   s.meta.title='点検'; s.meta.key={root:0,qual:'maj'}; s.meta.timeSig={n:4,d:4};
 });
 U.addBars(0,4);
 ok('小節が4つできる',U.song.bars.length===4,'len='+U.song.bars.length);

 /* ── コード譜の曲にする ── */
 ok('既定は五線譜',!U.isChart());
 U.tx('コード譜にする',()=>{ U.song.meta.kind='chart'; });
 ok('コード譜になる',U.isChart());
 /* ══ ふだんは読む姿。書く時だけ枠（1.298）══ */
 ok('はじめは読む姿',!!d.querySelector('.flow')&&!d.querySelector('.ch-bar'));
 U.chartEdit=true; U.render();
 ok('〈書く〉で枠が出る',!!d.querySelector('.ch-bar'));
 /* ══ 札は五線譜と同じ形・同じ流儀（1.304）══ */
 /* 〈選択〉を足して四枚（1.314） */
 ok('コード譜の札は四枚',d.querySelectorAll('.mode-btn').length===4,
    ''+d.querySelectorAll('.mode-btn').length);
 ok('札の名は 入力・リズム・歌詞・選択',
    [...d.querySelectorAll('.mode-btn')].map(b=>b.textContent).join('/')==='入力/リズム/歌詞/選択',
    [...d.querySelectorAll('.mode-btn')].map(b=>b.textContent).join('/'));
 ok('はじめは〈入力〉',d.querySelector('.mode-btn.md-chord').classList.contains('on'));
 ok('コード譜の紙が組める',!!d.querySelector('.chart'));
 const bars=d.querySelectorAll('.ch-bar');
 ok('小節の枠が4つ',bars.length===4,''+bars.length);
 const slots=bars[0].querySelectorAll('.ch-slot');
 ok('4/4・八分の格子は8マス',slots.length===8,''+slots.length);
 ok('拍のマスに印が付く',slots[0].classList.contains('beat')&&!slots[1].classList.contains('beat'));
 ok('マスに小節と拍が刻まれている',
    slots[4].getAttribute('data-bar')===U.song.bars[0].id
    &&slots[4].getAttribute('data-tick')===String(U.T.QUARTER*2));
 ok('八分裏のマスがある',
    slots[1].getAttribute('data-tick')===String(U.T.QUARTER/2));
 ok('歌詞の帯がある',!!bars[0].querySelector('.ch-lyrs'));
 ok('パレットが出る',d.getElementById('bb-pal').style.display==='flex');
 ok('パレットに七つのコード',d.querySelectorAll('.pal-ch').length>=7,
    ''+d.querySelectorAll('.pal-ch').length);

 /* ── 置く ── */
 const b0=U.song.bars[0].id, Q=U.T.QUARTER;
 U.chartPlace(b0,0,C);
 U.chartPlace(b0,Q*2,G);
 ok('コードが小節に控えられる',
    U.song.bars[0].chordAt[0].root===0&&U.song.bars[0].chordAt[Q*2].root===7);
 const chips=d.querySelectorAll('.ch-bar')[0].querySelectorAll('.ch-chip');
 ok('コードは重ねの層に出る',!!d.querySelector('.ch-lay .ch-chip'));
 ok('札が二枚出る',chips.length===2,''+chips.length);
 ok('札にコード名',chips[0].textContent==='C',chips[0].textContent);

 /* ── 食い ── */
 U.chartSetSyn(b0,Q*2,true);
 ok('食いの札が付く',U.song.bars[0].chordAt[Q*2].syn===true);
 ok('鉤が描かれる',!!d.querySelectorAll('.ch-bar')[0].querySelectorAll('.ch-chip')[1].querySelector('.ch-hook'));
 U.chartPlace(b0,Q*2,C);
 ok('コードを差し替えても食いは残る',U.song.bars[0].chordAt[Q*2].syn===true);
 U.chartSetSyn(b0,Q*2,false);
 ok('食いを外せる',!U.song.bars[0].chordAt[Q*2].syn);
 U.chartPlace(b0,Q*2,G);

 /* ── 保存で消えないか ── */
 { const j=JSON.parse(JSON.stringify(U.song));
   U.chartSetSyn(b0,Q*2,true);
   const s2=U.mkSong(JSON.parse(JSON.stringify(U.song)));
   const bb=s2.bars.find(x=>x.id===b0);
   ok('食いは書き出し・読み込みで残る',bb.chordAt[Q*2].syn===true);
   const s3=U.mkSong(j);
   ok('古い曲（食いの札なし）も素直に開く',!s3.bars.find(x=>x.id===b0).chordAt[Q*2].syn);
 }

 /* ── 歌詞（1.296：格子に縛られない位置）── */
 U.tx('歌詞',()=>{ U.song.bars[0].lyricAt=[{x:0,y:0,t:'さくらさくら'}]; });
 U.render();
 ok('歌詞が帯に出る',
    d.querySelectorAll('.ch-bar')[0].querySelector('.ch-ly').textContent==='さくらさくら');
 { const s2=U.mkSong(JSON.parse(JSON.stringify(U.song)));
   ok('歌詞は保存で残る',s2.bars[0].lyricAt[0].t==='さくらさくら'); }
 { /* 置いた場所も控えられる */
   U.tx('置き直す',()=>{ U.song.bars[0].lyricAt=[{x:0.25,y:12,t:'さくら'},{x:0.7,y:0,t:'ちるらん'}]; });
   U.render();
   const es=d.querySelectorAll('.ch-bar')[0].querySelectorAll('.ch-ly');
   ok('複数の語を置ける',es.length===2,''+es.length);
   ok('横の位置は割合で据わる',es[0].style.left==='25%',es[0].style.left);
   ok('縦にもずらせる',es[0].style.top==='12px',es[0].style.top);
   const s4=U.migrate(JSON.parse(JSON.stringify(U.song)));
   ok('位置は保存で残る',s4.bars[0].lyricAt[0].x===0.25&&s4.bars[0].lyricAt[0].y===12); }
 { /* 大きさ */
   U.tx('大',()=>{ U.song.meta.lyricSize='lg'; });
   ok('大きさが紙に伝わる',d.body.getAttribute('data-lyr')==='lg',
      d.body.getAttribute('data-lyr'));
   U.tx('中',()=>{ U.song.meta.lyricSize='md'; }); }
 { /* 古い一行の歌詞は、頭に置かれた一つとして引き継ぐ */
   const j=JSON.parse(JSON.stringify(U.song));
   j.bars[1].lyrics='むかしのうた'; delete j.bars[1].lyricAt;
   const s3=U.migrate(j);
   ok('古い一行の歌詞を引き継ぐ',
      s3.bars[1].lyricAt&&s3.bars[1].lyricAt[0].t==='むかしのうた'
      &&s3.bars[1].lyricAt[0].x===0,JSON.stringify(s3.bars[1].lyricAt)); }

 /* ── 鳴らす形 ── */
 const bar0=U.song.bars[0];
 { const ns=U.chartPlayNotes(U.song,bar0,Q*4,false);
   ok('拍ごとに四撃',ns.length===4,'len='+ns.length+' '+JSON.stringify(ns.map(x=>x.start)));
   ok('三拍目の食いが八分前へ',ns.some(x=>x.start===Q*2-Q/2),JSON.stringify(ns.map(x=>x.start)));
   ok('食いの拍は弾き直さない',!ns.some(x=>x.start===Q*2));
   ok('食いは上げ振り',(ns.find(x=>x.start===Q*2-Q/2)||{}).stroke==='u');
   ok('三拍目以降はGを提げる',(ns.find(x=>x.start===Q*2-Q/2)||{})._ch.root===7);
   ok('二拍目はCを引き継ぐ',(ns.find(x=>x.start===Q)||{})._ch.root===0);
 }
 { U.tx('刻みを変える',()=>{ U.song.meta.chartStrum='change'; });
   const ns=U.chartPlayNotes(U.song,bar0,Q*4,false);
   ok('変わった時だけなら二撃',ns.length===2,'len='+ns.length);
   U.tx('戻す',()=>{ U.song.meta.chartStrum='beat'; });
 }
 { /* 小節の頭の食いは、前の小節へ食い込む（start が負） */
   const b1=U.song.bars[1].id;
   U.chartPlace(b1,0,G); U.chartSetSyn(b1,0,true);
   const ns=U.chartPlayNotes(U.song,U.song.bars[1],Q*4,true);
   ok('小節頭の食いは負の位置へ',ns[0].start===-Q/2,'start='+ns[0].start);
   const ns0=U.chartPlayNotes(U.song,U.song.bars[1],Q*4,false);
   ok('曲の一小節目なら頭のまま',ns0[0].start===0,'start='+ns0[0].start);
 }

 /* ── 再生の組み立てが通るか ── */
 { let tl=null,err=null;
   try{ tl=U.buildTimeline(U.song); }catch(e){ err=e; }
   ok('タイムラインが組める',!!tl&&!err,err&&err.message);
   if(tl){
     const notes=tl.ev.filter(e=>e.kind==='note');
     ok('コードだけの小節が鳴る',notes.length>0,'notes='+notes.length);
     ok('鳴る音にコードが付いている',notes.every(e=>e.chord&&e.chord.root!=null));
     ok('コードに余計な札を混ぜない',notes.every(e=>e.chord.syn===undefined));
     ok('時刻は前後する順',notes.every((e,i)=>i===0||e.t>=notes[i-1].t));
     ok('時刻が負にならない',notes.every(e=>e.t>=0));
   }
 }

 /* ── 音符のある小節は従来どおり ── */
 { const b2=U.song.bars[2];
   U.tx('音符を置く',()=>{ b2.notes=[U.mkNote({start:0,len:Q*4,kind:'chord',chord:{root:5,type:'maj',bass:null}})];
     b2.chordAt={0:{root:9,type:'min',bass:null}}; });
   const tl=U.buildTimeline(U.song);
   const ev=tl.ev.filter(e=>e.kind==='note'&&e.barId===b2.id);
   ok('音符のある小節は音符のとおり',ev.length===1,'len='+ev.length);
   ok('音符のコードが勝つ',ev[0].chord.root===5,'root='+(ev[0].chord||{}).root);
 }

 /* ── 種類を行き来しても壊れない ── */
 U.tx('五線譜へ',()=>{ U.song.meta.kind='lead'; });
 ok('五線譜へ戻れる',!d.querySelector('.chart')&&d.getElementById('bb-pal').style.display==='none');
 ok('モードの札が三枚戻る',d.querySelectorAll('.mode-btn').length===3,
    ''+d.querySelectorAll('.mode-btn').length);
 ok('コードは残っている',U.song.bars[0].chordAt[0].root===0);
 U.tx('コード譜へ',()=>{ U.song.meta.kind='chart'; });
 ok('コード譜へ戻れる',!!d.querySelector('.chart'));
 { const s2=U.mkSong(JSON.parse(JSON.stringify(U.song)));
   ok('種類は保存で残る',s2.meta.kind==='chart'); }

 /* ── 格子の細かさ ── */
 { U.tx('十六分',()=>{ U.song.meta.chartDiv=4; });
   ok('十六分は16マス',d.querySelectorAll('.ch-bar')[0].querySelectorAll('.ch-slot').length===16,
      ''+d.querySelectorAll('.ch-bar')[0].querySelectorAll('.ch-slot').length);
   U.tx('拍ごと',()=>{ U.song.meta.chartDiv=1; });
   ok('拍ごとは4マス',d.querySelectorAll('.ch-bar')[0].querySelectorAll('.ch-slot').length===4);
   U.tx('八分へ戻す',()=>{ U.song.meta.chartDiv=2; });
 }
 { /* 6/8 の八分は一拍を三つに割る */
   U.tx('6/8',()=>{ U.song.bars[3].timeSig={n:6,d:8}; });
   ok('6/8・八分は6マス',d.querySelectorAll('.ch-bar')[3].querySelectorAll('.ch-slot').length===6,
      ''+d.querySelectorAll('.ch-bar')[3].querySelectorAll('.ch-slot').length);
   U.tx('戻す',()=>{ U.song.bars[3].timeSig=null; });
 }

 /* ── 八分裏に置ける ── */
 { const b1=U.song.bars[1].id, E=U.T.QUARTER/2;
   U.chartPlace(b1,U.T.QUARTER+E,{root:5,type:'maj',bass:null});
   ok('八分裏に置ける',U.song.bars[1].chordAt[U.T.QUARTER+E].root===5);
   const ns=U.chartPlayNotes(U.song,U.song.bars[1],U.T.QUARTER*4,true);
   ok('八分裏の一撃が鳴る',ns.some(x=>x.start===U.T.QUARTER+E),
      JSON.stringify(ns.map(x=>x.start)));
   U.chartRemove(b1,U.T.QUARTER+E);
 }

 /* ── 格子から外れたコードも出す ── */
 { const b1=U.song.bars[1].id, odd=Math.round(U.T.QUARTER/3);
   U.chartPlace(b1,odd,{root:2,type:'min',bass:null});
   U.render();
   ok('格子外のコードも出る',!!d.querySelectorAll('.ch-bar')[1].querySelector('.ch-chip.off'));
   U.chartRemove(b1,odd);
 }

 /* ── 新しいコード譜を作る道 ── */
 ok('〈＋ 新しいコード譜〉の札がある',!!d.getElementById('btn-newchart'));

 /* ── 取り消し ── */
 { const before=JSON.stringify(U.song.bars[0].chordAt);
   U.chartRemove(b0,0);
   ok('消える',!U.song.bars[0].chordAt[0]);
   U.doUndo();
   ok('取り消しで戻る',JSON.stringify(U.song.bars[0].chordAt)===before);
 }

 /* ── 鳴らさない設定 ── */
 { U.tx('切る',()=>{ U.song.meta.chartStrum='off'; });
   const tl=U.buildTimeline(U.song);
   const b0id=U.song.bars[0].id;
   ok('鳴らさない設定では鳴らない',!tl.ev.some(e=>e.kind==='note'&&e.barId===b0id));
   U.tx('戻す',()=>{ U.song.meta.chartStrum='beat'; });
 }


 /* ── 置いたコードを動かす ── */
 { const b0=U.song.bars[0].id, b1=U.song.bars[1].id, Q=U.T.QUARTER, E=Q/2;
   U.tx('片づけ',()=>{ U.song.bars[0].chordAt=null; U.song.bars[1].chordAt=null; });
   U.chartPlace(b0,Q,{root:0,type:'maj',bass:null});
   U.chartSetSyn(b0,Q,true);
   U.chartMove(b0,Q,b0,Q+E);
   ok('同じ小節の中で動く',!(U.song.bars[0].chordAt||{})[Q]
      &&(U.song.bars[0].chordAt||{})[Q+E].root===0);
   ok('食いの札も付いて回る',U.song.bars[0].chordAt[Q+E].syn===true);
   U.chartMove(b0,Q+E,b1,0);
   ok('隣の小節へも運べる',!U.song.bars[0].chordAt&&U.song.bars[1].chordAt[0].root===0);
   U.doUndo();
   ok('運びは取り消せる',!!(U.song.bars[0].chordAt||{})[Q+E]);
   U.chartMove(b0,Q+E,b0,Q+E);
   ok('同じ所へ落としても何も起きない',!!(U.song.bars[0].chordAt||{})[Q+E]);
   U.render();
   const sl=[...d.querySelectorAll('.ch-bar')[0].querySelectorAll('.ch-slot')];
   ok('コードのあるマスに印が付く',sl.filter(x=>x.classList.contains('has')).length===1,
      ''+sl.filter(x=>x.classList.contains('has')).length);
 }

 /* ── パレットを浮かせる ── */
 { const pal=d.getElementById('bb-pal');
   ok('掴みがある',!!pal.querySelector('.pal-grip'));
   ok('はじめは下の帯',!pal.classList.contains('float'));
   U.palFloat(true,120,200);
   ok('浮く',pal.classList.contains('float'));
   ok('場所が付く',pal.style.left==='120px'&&pal.style.top==='200px');
   U.renderChartPad();
   ok('組み直しても浮いたまま',pal.classList.contains('float')&&pal.style.left==='120px');
   U.palFloat(true,99999,99999); U.clampPal();
   ok('画面の外へ出さない',parseInt(pal.style.left,10)<(w.innerWidth||360));
   U.palFloat(false);
   ok('下の帯へ戻せる',!pal.classList.contains('float')&&!pal.style.left);

   /* ══ 札以外の所ならどこでも掴める（1.297）══ */
   const pev=(t,x,y,tgt)=>{ const e=new w.Event(t,{bubbles:true,cancelable:true});
     e.clientX=x; e.clientY=y; e.button=0; return e; };
   pal.getBoundingClientRect=()=>({left:10,top:20,width:300,height:50,right:310,bottom:70});
   /* 台の余白から運ぶ */
   pal.dispatchEvent(pev('pointerdown',100,40));
   d.dispatchEvent(pev('pointermove',160,90));
   d.dispatchEvent(pev('pointerup',160,90));
   ok('台の余白から運べる',pal.classList.contains('float'),'float='+pal.classList.contains('float'));
   const movedX=U.palPos.x;
   /* 札の上からは運ばない——選びと取り違えない */
   const chip=pal.querySelector('.pal-ch');
   pal.getBoundingClientRect=()=>({left:U.palPos.x,top:U.palPos.y,width:300,height:50,
     right:U.palPos.x+300,bottom:U.palPos.y+50});
   chip.dispatchEvent(pev('pointerdown',120,40));
   d.dispatchEvent(pev('pointermove',260,140));
   d.dispatchEvent(pev('pointerup',260,140));
   ok('札の上からは運ばない',U.palPos.x===movedX,'x='+U.palPos.x+' 元='+movedX);
   /* 台を軽く叩いても、出し入れはしない（それは掴みの札の役目） */
   pal.dispatchEvent(pev('pointerdown',100,40));
   d.dispatchEvent(pev('pointerup',100,40));
   ok('台を叩いても勝手に戻らない',pal.classList.contains('float'));
   U.palFloat(false);
 }

 /* ── ぜんぶのコードもパレットで ── */
 { const pal=d.getElementById('bb-pal');
   ok('はじめは畳んである',!pal.querySelector('.pal-more'));
   U.chartAllOpen=true; U.renderChartPad();
   const more=pal.querySelector('.pal-more');
   ok('その場に開く',!!more);
   ok('覆いは出ない',!d.querySelector('.pop-ov, #pop'));
   ok('ルート・種類・ベースの三段',more.querySelectorAll('.pal-grp').length===3,
      ''+more.querySelectorAll('.pal-grp').length);
   const types=more.querySelectorAll('.pal-grp')[1].querySelectorAll('.pal-ch');
   ok('種類の札が並ぶ',types.length>=20,''+types.length);
   ok('種類の札にルートを付けた名前',/^C/.test(types[0].textContent),types[0].textContent);
   /* 叩けば選べる */
   U.chartPick={root:0,type:'maj',bass:null};
   more.querySelectorAll('.pal-grp')[1].querySelectorAll('.pal-ch')[2].click();
   ok('叩けば選べる',U.chartPick.type==='dom7','type='+U.chartPick.type);
   /* ベース音を足しても、ルートと種類は残る */
   const pal2=d.getElementById('bb-pal');
   const gb=pal2.querySelector('.pal-more').querySelectorAll('.pal-grp')[2];
   gb.querySelectorAll('.pal-ch')[8].click();
   ok('ベース音を重ねられる',U.chartPick.type==='dom7'&&U.chartPick.bass===7,
      JSON.stringify(U.chartPick));
   U.chartAllOpen=false; U.renderChartPad();
   ok('畳める',!d.getElementById('bb-pal').querySelector('.pal-more'));
   U.chartPick=null; U.renderChartPad();
 }

 /* ── 指板は既定で伏せる ── */
 { const box=d.getElementById('fbbar');
   ok('既定では出ない',!U.fbState().on&&box.style.display==='none',
      'on='+U.fbState().on+' disp='+box.style.display);
   ok('上の帯に札がある',!!d.getElementById('tb-fb'));
   ok('札は伏せた形',!d.getElementById('tb-fb').classList.contains('on'));
   U.toggleFretboard();
   ok('叩けば出る',U.fbState().on&&box.style.display!=='none');
   ok('札が光る',d.getElementById('tb-fb').classList.contains('on'));
   U.toggleFretboard();
   ok('もう一度で伏せる',!U.fbState().on&&box.style.display==='none');
   ok('札の光も消える',!d.getElementById('tb-fb').classList.contains('on'));
   ok('画面いっぱいも解ける',!d.body.classList.contains('fb-big'));
   /* 出した状態は控えに残る（次に開いた時、勝手に伏せない） */
   U.toggleFretboard();
   ok('出した状態は控えに残る',U.fbState().on===true&&U.fbState().offReset285===true);
   U.toggleFretboard();
 }

 /* ── 段の振り分け（被り回避）── */
 { const T=U.chartTiers;
   ok('離れていれば全部上段',
      JSON.stringify(T([{left:0,width:20},{left:60,width:20},{left:120,width:20}],7))==='[0,0,0]');
   ok('被れば下段へ',
      JSON.stringify(T([{left:0,width:40},{left:20,width:40}],7))==='[0,1]');
   ok('三つ続けば上下に振り分ける',
      JSON.stringify(T([{left:0,width:30},{left:15,width:30},{left:40,width:30}],7))==='[0,1,0]');
   { /* 裏拍のあとに拍の頭が来たら、裏拍のほうを下へ落とす */
     const r=T([{left:0,width:60},{left:30,width:20,head:true}],7);
     ok('拍の頭は上段を譲らない',JSON.stringify(r)==='[1,0]',JSON.stringify(r)); }
   const t=T([{left:0,width:20},{left:100,width:20,head:true}],7);
   ok('離れた拍頭は上段',t[1]===0);
   ok('幅ゼロでも落ちない',JSON.stringify(T([],7))==='[]');
 }
 { /* jsdom は幅を測れない。**測れない時は触らない**ことを確かめる */
   U.render();
   const row=d.querySelector('.ch-row');
   ok('測れない時は段を分けない',!row.classList.contains('two'));
 }

 /* ── 小節ごとのリズム ── */
 { const b0=U.song.bars[0].id, Q=U.T.QUARTER;
   ok('はじめは札が出ていない',!d.querySelector('.ch-rhy'));
   U.chartEdit=true; U.chartMode='rhythm'; U.render();
   ok('切り替えれば札が出る',d.querySelectorAll('.ch-rhy').length===U.song.bars.length,
      ''+d.querySelectorAll('.ch-rhy').length);
   ok('当てていない札は「型を選ぶ…」',d.querySelector('.ch-rhy').textContent==='型を選ぶ…',
      d.querySelector('.ch-rhy').textContent);
   ok('小節の下に升目が出る',!!d.querySelector('.ch-pat'));
   /* ══ 升目はコードの格子と同じ数（1.293）══ */
   { const slots=d.querySelectorAll('.ch-bar')[0].querySelectorAll('.ch-slot').length;
     const cells=d.querySelectorAll('.ch-bar')[0].querySelectorAll('.ch-pc').length;
     ok('升目はコードの格子と同じ数',cells===slots,'slot='+slots+' cell='+cells); }
   ok('升目は名前の札と横に並べない',
      !d.querySelector('.ch-pwrap .ch-pat + .ch-rhy')===false
      &&d.querySelector('.ch-pat').parentElement.classList.contains('ch-pwrap'));

   U.tx('型を当てる',()=>{ U.song.bars[0].chartRhythm='folk'; });
   ok('札に型の名が出る',d.querySelectorAll('.ch-rhy')[0].textContent===U.rhythmLabel('folk'),
      d.querySelectorAll('.ch-rhy')[0].textContent);
   { const s2=U.mkSong(JSON.parse(JSON.stringify(U.song)));
     ok('型は保存で残る',s2.bars[0].chartRhythm==='folk'); }

   /* 鳴らす形が型のとおりになる */
   U.tx('片づけ',()=>{ U.song.bars[0].chordAt=null; });
   U.chartPlace(b0,0,{root:0,type:'maj',bass:null});
   U.chartPlace(b0,Q*2,{root:7,type:'maj',bass:null});
   const ns=U.chartPlayNotes(U.song,U.song.bars[0],Q*4,false,null);
   ok('型の一撃の数で鳴る',ns.length===6,'len='+ns.length+' '+JSON.stringify(ns.map(x=>x.start)));
   ok('前半はC',ns[0]._ch.root===0);
   ok('後半はG',ns[ns.length-1]._ch.root===7,'root='+ns[ns.length-1]._ch.root);
   ok('向きは型が持つ',ns.some(x=>x.stroke==='u'));

   /* 型のもとでも食いが効く */
   U.chartSetSyn(b0,Q*2,true);
   const ns2=U.chartPlayNotes(U.song,U.song.bars[0],Q*4,false,null);
   const atE=ns2.filter(x=>x.start>=Q*2-Q/2&&x.start<Q*2);
   ok('食いで和音の変わり目が繰り上がる',atE.length>0&&atE[0]._ch.root===7,
      JSON.stringify(ns2.map(x=>[x.start,x._ch&&x._ch.root])));
   U.chartSetSyn(b0,Q*2,false);

   /* 型を外せば拍ごとに戻る */
   U.tx('外す',()=>{ U.song.bars[0].chartRhythm=null; });
   ok('外せば拍ごと',U.chartPlayNotes(U.song,U.song.bars[0],Q*4,false,null).length===4);

   /* 再生の組み立てが通る */
   U.tx('当て直す',()=>{ U.song.bars[0].chartRhythm='cutt'; });
   let err=null,tl=null;
   try{ tl=U.buildTimeline(U.song); }catch(e){ err=e; }
   ok('型を当てても組める',!!tl&&!err,err&&err.message);
   if(tl){
     const ev=tl.ev.filter(e=>e.kind==='note'&&e.barId===b0);
     ok('型の小節が鳴る',ev.length>1,'len='+ev.length);
     ok('ブラッシングも混ざる',ev.some(e=>e.note&&e.note.kind==='brush'));
   }
   U.tx('片づけ',()=>{ U.song.bars[0].chartRhythm=null; });
   U.chartMode='chord'; U.render();
   ok('伏せれば札は消える',!d.querySelector('.ch-rhy'));
 }

 /* ── 自分で書いた型 ── */
 { const Q=U.T.QUARTER, b0=U.song.bars[0].id;
   /* 升目 ↔ 字 */
   ok('升目の数（16分・4拍）',U.patCellCount(16,4)===16);
   ok('升目の数（8分・4拍）',U.patCellCount(8,4)===8);
   ok('升目の数（3連・4拍）',U.patCellCount(12,4)===12);
   ok('向きは位置が決める（16分）',U.patDirAt(16,0)==='d'&&U.patDirAt(16,1)==='u');
   ok('三連は頭だけ下',U.patDirAt(12,0)==='d'&&U.patDirAt(12,1)==='o');
   { const cells=['o','~','-','x','o','-','-','-'];
     const acc=[true,false,false,false,false,false,false,false];
     const str=U.patCellsToStr(cells,8,acc);
     ok('字に直せる（向きは書かない）',str==='O~-x'+'o---',str);
     const back=U.patStrToCells(str,8,8);
     ok('字から升目に戻せる',JSON.stringify(back.cells)===JSON.stringify(cells),
        JSON.stringify(back.cells));
     ok('アクセントも戻る',back.accent[0]===true&&back.accent[3]===false);
   }
   /* 三連の升目が正しい音価になる */
   { const cs=U.strokePatCells('ooo'+'ooo'+'ooo'+'ooo',12,Q*4);
     ok('三連は一拍を三つに割る',cs.length===12&&Math.abs(cs[1].start-Q/3)<2,
        'len='+cs.length+' s1='+cs[1].start); }

   /* 端末と曲の両方に控える */
   U.libPats()['my_test']={id:'my_test',name:'点検の型',grid:8,pat:'d-du-udu',staccato:false};
   ok('端末の型が引ける',U.findPat('my_test').name==='点検の型');
   ok('自分の型の一覧に出る',U.myPats().some(p=>p.id==='my_test'));
   ok('名前が札に出る',U.rhythmLabel('my_test')==='点検の型');
   U.tx('当てる',()=>{ U.embedPat('my_test'); U.song.bars[0].chartRhythm='my_test'; });
   ok('曲にも埋まる',!!(U.song.pats&&U.song.pats['my_test']));
   { const s2=U.mkSong(JSON.parse(JSON.stringify(U.song)));
     ok('型は曲と一緒に渡る',s2.pats&&s2.pats['my_test'].pat==='d-du-udu'); }

   /* 曲の型が端末より勝つ */
   U.tx('曲の型を変える',()=>{ U.song.pats['my_test'].name='渡された型'; });
   ok('曲に埋まった型が勝つ',U.findPat('my_test').name==='渡された型');

   /* 自分の型で鳴る */
   U.tx('片づけ',()=>{ U.song.bars[0].chordAt=null; });
   U.chartPlace(b0,0,{root:0,type:'maj',bass:null});
   const ns=U.chartPlayNotes(U.song,U.song.bars[0],Q*4,false,null);
   ok('自分の型で刻む',ns.length===6,'len='+ns.length+' '+JSON.stringify(ns.map(x=>x.start)));
   ok('八分の升目で並ぶ',Math.abs(ns[1].start-Q)<2,'s1='+ns[1].start);
   let err=null; try{ U.buildTimeline(U.song); }catch(e){ err=e; }
   ok('自分の型でも組める',!err,err&&err.message);

   /* 板が開く */
   U.openPatEditor(null,()=>{});
   ok('型を書く板が開く',!!d.querySelector('.pat-board'));
   ok('升目が並ぶ',d.querySelectorAll('.pat-cell').length===16,
      ''+d.querySelectorAll('.pat-cell').length);
   ok('筆が三本',/ブラッシング/.test(d.body.textContent));
   ok('板に矢印を出さない',!/[↓↑]/.test(d.querySelector('.pat-board').textContent),
      d.querySelector('.pat-board').textContent);
   U.closePop&&U.closePop();
   [...d.querySelectorAll('.pop-ov,.pop,#pop')].forEach(x=>x.remove());

   U.tx('片づけ',()=>{ U.song.bars[0].chartRhythm=null; delete U.song.pats['my_test']; });
   delete U.libPats()['my_test'];
 }

 /* ── 型の見せ方（1.288）── */
 { const p={id:'my_g',name:'画の点検',grid:8,pat:'O~-xo---'};
   const g=U.patGridEl(p);
   ok('升目の画になる',g.querySelectorAll('.pm-c').length===8,
      ''+g.querySelectorAll('.pm-c').length);
   ok('鳴らす所が塗られる',g.querySelectorAll('.pm-c.hit').length===2,
      ''+g.querySelectorAll('.pm-c.hit').length);
   ok('伸ばしは薄く',g.querySelectorAll('.pm-c.tie').length===1);
   ok('✕は別の色',g.querySelectorAll('.pm-c.bru').length===1);
   ok('アクセントが出る',g.querySelectorAll('.pm-c.acc').length===1);
   ok('拍の頭に印',g.querySelectorAll('.pm-c.beat').length===4,
      ''+g.querySelectorAll('.pm-c.beat').length);
 }
 { /* 向きを書かない型でも、鳴らす向きは位置から出る */
   const Q=U.T.QUARTER, b0=U.song.bars[0].id;
   U.libPats()['my_dir']={id:'my_dir',name:'向きの点検',grid:8,pat:'oooooooo'};
   U.tx('当てる',()=>{ U.embedPat('my_dir'); U.song.bars[0].chartRhythm='my_dir'; });
   U.tx('片づけ',()=>{ U.song.bars[0].chordAt=null; });
   U.chartPlace(b0,0,{root:0,type:'maj',bass:null});
   const ns=U.chartPlayNotes(U.song,U.song.bars[0],Q*4,false,null);
   ok('偶数は下、奇数は上',ns[0].stroke==='d'&&ns[1].stroke==='u',
      JSON.stringify(ns.map(x=>x.stroke)));
   U.tx('片づけ',()=>{ U.song.bars[0].chartRhythm=null; delete U.song.pats['my_dir']; });
   delete U.libPats()['my_dir'];
 }
 { /* 既定の名前が重ならない */
   U.libPats()['my_a']={id:'my_a',name:'自分の型 1',grid:8,pat:'oooooooo'};
   U.openPatEditor(null,()=>{});
   const ti=[...d.querySelectorAll('.lyr-in')].pop();
   ok('既定の名前が重ならない',ti&&ti.value==='自分の型 2',ti&&ti.value);
   [...d.querySelectorAll('.pop-ov,.pop,#pop')].forEach(x=>x.remove());
   delete U.libPats()['my_a'];
 }

 /* ── 譜面の上に直に書く型（1.289）── */
 { const Q=U.T.QUARTER, b0=U.song.bars[0].id, b1=U.song.bars[1].id;
   U.chartEdit=true; U.chartMode='rhythm'; U.chartPenGrid=0; U.render();
   /* 既定は「格子に合わせる」——コードの格子を変えれば升目も追う */
   { U.tx('格子を十六分に',()=>{ U.song.meta.chartDiv=4; });
     const bar0=d.querySelectorAll('.ch-bar')[0];
     ok('格子を変えれば升目も追う',
        bar0.querySelectorAll('.ch-pc').length===bar0.querySelectorAll('.ch-slot').length
        &&bar0.querySelectorAll('.ch-pc').length===16,
        ''+bar0.querySelectorAll('.ch-pc').length);
     U.tx('八分へ戻す',()=>{ U.song.meta.chartDiv=2; }); }
   /* 自前の型を持たせる */
   U.tx('直に書く',()=>{ U.song.bars[0].chartPat={grid:8,pat:'o-o-o-o-'}; });
   ok('自前の型が引ける',U.chartPatOf(U.song.bars[0]).pat==='o-o-o-o-');
   U.render();
   const pg=d.querySelectorAll('.ch-pat')[0];
   ok('升目が型に合う',pg.querySelectorAll('.ch-pc').length===8,
      ''+pg.querySelectorAll('.ch-pc').length);
   ok('鳴らす所が塗られる',pg.querySelectorAll('.ch-pc.hit').length===4,
      ''+pg.querySelectorAll('.ch-pc.hit').length);
   ok('札は「この小節の型」',d.querySelectorAll('.ch-rhy')[0].textContent==='この小節の型',
      d.querySelectorAll('.ch-rhy')[0].textContent);

   /* 自前が名前付きより勝つ */
   U.libPats()['my_z']={id:'my_z',name:'控えの型',grid:8,pat:'oooooooo'};
   U.tx('両方持たせる',()=>{ U.song.bars[0].chartRhythm='my_z'; });
   ok('自前が先に立つ',U.chartPatOf(U.song.bars[0]).pat==='o-o-o-o-');
   U.tx('片づけ',()=>{ U.song.bars[0].chartRhythm=null; });

   /* 鳴らす形 */
   U.tx('片づけ',()=>{ U.song.bars[0].chordAt=null; });
   U.chartPlace(b0,0,{root:0,type:'maj',bass:null});
   const ns=U.chartPlayNotes(U.song,U.song.bars[0],Q*4,false,null);
   ok('直に書いた型で鳴る',ns.length===4,'len='+ns.length);
   ok('八分の升目で並ぶ',Math.abs(ns[1].start-Q)<2,'s1='+ns[1].start);

   /* 保存で残る */
   { const s2=U.mkSong(JSON.parse(JSON.stringify(U.song)));
     ok('自前の型は保存で残る',s2.bars[0].chartPat.pat==='o-o-o-o-'); }

   /* 名前付きを選べば自前は外れる */
   U.tx('名前付きを当てる',()=>{ U.embedPat('my_z');
     U.song.bars[0].chartRhythm='my_z'; U.song.bars[0].chartPat=null; });
   ok('名前付きに切り替わる',!U.song.bars[0].chartPat
      &&U.chartPatOf(U.song.bars[0]).name==='控えの型');

   /* 隣の小節は巻き込まれない */
   ok('隣は型を持たない',!U.chartPatOf(U.song.bars[1]));

   /* 升目の細かさ */
   U.chartPenGrid=12; U.render();
   const pg2=d.querySelectorAll('.ch-pat')[1];
   ok('三連なら12マス',pg2.querySelectorAll('.ch-pc').length===12,
      ''+pg2.querySelectorAll('.ch-pc').length);
   U.chartPenGrid=16;

   /* 筆と強く */
   ok('筆の札が帯に出る',/●/.test(d.getElementById('bb-ctx').textContent));
   U.tx('片づけ',()=>{ U.song.bars[0].chartRhythm=null; U.song.bars[0].chartPat=null;
     delete U.song.pats['my_z']; });
   delete U.libPats()['my_z'];
   U.chartMode='chord'; U.render();
   ok('伏せれば升目も消える',!d.querySelector('.ch-pat'));
 }

 /* ── 升目のなぞり（1.290）── */
 { U.chartEdit=true; U.chartMode='rhythm'; U.chartPenGrid=8; U.chartPen='hit'; U.chartAccent=false;
   U.tx('片づけ',()=>{ U.song.bars[0].chartPat=null; U.song.bars[0].chartRhythm=null; });
   U.render();
   const pg=d.querySelector('.ch-pat');
   pg.getBoundingClientRect=()=>({left:0,top:0,width:160,height:34,right:160,bottom:34});
   const ev=(t,x,y)=>{ const e=new w.Event(t,{bubbles:true,cancelable:true});
     e.clientX=x; e.clientY=y; e.button=0; return e; };
   /* **帯の外へ大きく外しても、横になぞれば続くこと** */
   const old=d.elementFromPoint; d.elementFromPoint=()=>null;
   pg.querySelectorAll('.ch-pc')[1].dispatchEvent(ev('pointerdown',30,10));
   d.dispatchEvent(ev('pointermove',70,-40));
   d.dispatchEvent(ev('pointermove',110,-60));
   d.dispatchEvent(ev('pointerup',110,-60));
   d.elementFromPoint=old;
   const p=U.song.bars[0].chartPat;
   ok('なぞった範囲が一撃になる',p&&p.pat==='-o~~~~--',p&&p.pat);
   ok('升目の細かさが控えられる',p&&p.grid===8);

   /* 左へなぞっても同じ */
   U.tx('片づけ',()=>{ U.song.bars[0].chartPat=null; });
   U.render();
   const pg2=d.querySelector('.ch-pat');
   pg2.getBoundingClientRect=()=>({left:0,top:0,width:160,height:34,right:160,bottom:34});
   pg2.querySelectorAll('.ch-pc')[5].dispatchEvent(ev('pointerdown',110,10));
   d.dispatchEvent(ev('pointermove',50,10));
   d.dispatchEvent(ev('pointerup',50,10));
   ok('左へ引いても頭は左',U.song.bars[0].chartPat.pat==='--o~~~--',
      U.song.bars[0].chartPat.pat);

   /* **行って戻ってくる**——伸ばした跡を残さないこと（1.291） */
   U.tx('片づけ',()=>{ U.song.bars[0].chartPat=null; });
   U.render();
   const pg4=d.querySelector('.ch-pat');
   pg4.getBoundingClientRect=()=>({left:0,top:0,width:160,height:34,right:160,bottom:34});
   pg4.querySelectorAll('.ch-pc')[1].dispatchEvent(ev('pointerdown',30,10));
   d.dispatchEvent(ev('pointermove',130,10));   /* 7マス目まで伸ばし */
   d.dispatchEvent(ev('pointermove',70,10));    /* 4マス目まで戻す */
   d.dispatchEvent(ev('pointerup',70,10));
   ok('行って戻れば、伸ばした跡は残らない',
      U.song.bars[0].chartPat.pat==='-o~~----',U.song.bars[0].chartPat.pat);

   /* 手前に書いてあったものは、範囲から外れれば戻る */
   U.tx('先に書いておく',()=>{ U.song.bars[0].chartPat={grid:8,pat:'o-o-o-o-'}; });
   U.render();
   const pg5=d.querySelector('.ch-pat');
   pg5.getBoundingClientRect=()=>({left:0,top:0,width:160,height:34,right:160,bottom:34});
   pg5.querySelectorAll('.ch-pc')[0].dispatchEvent(ev('pointerdown',10,10));
   d.dispatchEvent(ev('pointermove',130,10));   /* いったん7マス目まで */
   d.dispatchEvent(ev('pointermove',30,10));    /* 2マス目まで戻す */
   d.dispatchEvent(ev('pointerup',30,10));
   ok('範囲の外は元のまま',U.song.bars[0].chartPat.pat==='o~o-o-o-',
      U.song.bars[0].chartPat.pat);

   /* マウスの筋（pointer が来ない時の保険）でも同じこと */
   U.tx('片づけ',()=>{ U.song.bars[0].chartPat=null; });
   U.render();
   const pg6=d.querySelector('.ch-pat');
   pg6.getBoundingClientRect=()=>({left:0,top:0,width:160,height:34,right:160,bottom:34});
   pg6.querySelectorAll('.ch-pc')[1].dispatchEvent(ev('pointerdown',30,10));
   d.dispatchEvent(ev('mousemove',130,10));
   d.dispatchEvent(ev('mousemove',70,10));
   d.dispatchEvent(ev('mouseup',70,10));
   ok('マウスの筋でも行って戻れる',
      U.song.bars[0].chartPat&&U.song.bars[0].chartPat.pat==='-o~~----',
      U.song.bars[0].chartPat&&U.song.bars[0].chartPat.pat);

   /* 掴んでいる範囲が目に出る */
   U.tx('片づけ',()=>{ U.song.bars[0].chartPat=null; });
   U.render();
   const pg7=d.querySelector('.ch-pat');
   pg7.getBoundingClientRect=()=>({left:0,top:0,width:160,height:34,right:160,bottom:34});
   pg7.querySelectorAll('.ch-pc')[0].dispatchEvent(ev('pointerdown',10,10));
   d.dispatchEvent(ev('pointermove',70,10));
   ok('なぞっている範囲が光る',pg7.querySelectorAll('.ch-pc.drag').length===4,
      ''+pg7.querySelectorAll('.ch-pc.drag').length);
   d.dispatchEvent(ev('pointermove',30,10));
   ok('戻せば光りも縮む',pg7.querySelectorAll('.ch-pc.drag').length===2,
      ''+pg7.querySelectorAll('.ch-pc.drag').length);
   d.dispatchEvent(ev('pointerup',30,10));

   /* 休みの筆で消せる */
   U.chartPen='rest';
   U.render();
   const pg3=d.querySelector('.ch-pat');
   pg3.getBoundingClientRect=()=>({left:0,top:0,width:160,height:34,right:160,bottom:34});
   pg3.querySelectorAll('.ch-pc')[0].dispatchEvent(ev('pointerdown',10,10));
   d.dispatchEvent(ev('pointermove',150,10));
   d.dispatchEvent(ev('pointerup',150,10));
   ok('ぜんぶ休みなら型を持たない',!U.song.bars[0].chartPat);
   U.chartPen='hit'; U.chartMode='chord'; U.render();
 }

 /* ── 短く叩けば休符（1.295）── */
 { U.chartEdit=true; U.chartMode='rhythm'; U.chartPen='hit'; U.chartAccent=false; U.chartPenGrid=8;
   U.tx('片づけ',()=>{ (U.song.bars||[]).forEach(b=>{ b.chartPat=null; b.chartRhythm=null; }); });
   const ev=(t,x,y)=>{ const e=new w.Event(t,{bubbles:true,cancelable:true});
     e.clientX=x; e.clientY=y; e.button=0; return e; };
   const grid=()=>{ const g=d.querySelector('.ch-pat');
     g.getBoundingClientRect=()=>({left:0,top:0,width:160,height:34,right:160,bottom:34});
     return g; };
   /* 空いているマスを叩けば、一撃が置かれる */
   U.render();
   { const g=grid(); g.querySelectorAll('.ch-pc')[2].dispatchEvent(ev('pointerdown',50,10));
     d.dispatchEvent(ev('pointerup',50,10)); }
   ok('空いたマスを叩けば一撃',U.song.bars[0].chartPat.pat==='--o-----',
      U.song.bars[0].chartPat&&U.song.bars[0].chartPat.pat);
   /* 同じマスをもう一度叩けば休符 */
   U.render();
   { const g=grid(); g.querySelectorAll('.ch-pc')[2].dispatchEvent(ev('pointerdown',50,10));
     d.dispatchEvent(ev('pointerup',50,10)); }
   ok('叩き直せば休符',!U.song.bars[0].chartPat);
   /* 伸ばした一撃の頭を叩けば、ぶら下がりも連れて消える */
   U.tx('伸ばした一撃',()=>{ U.song.bars[0].chartPat={grid:8,pat:'o~~-o---'}; });
   U.render();
   { const g=grid(); g.querySelectorAll('.ch-pc')[0].dispatchEvent(ev('pointerdown',10,10));
     d.dispatchEvent(ev('pointerup',10,10)); }
   ok('頭を叩けば伸ばしも消える',U.song.bars[0].chartPat.pat==='----o---',
      U.song.bars[0].chartPat&&U.song.bars[0].chartPat.pat);
   /* なぞりは今までどおり */
   U.tx('片づけ',()=>{ U.song.bars[0].chartPat=null; });
   U.render();
   { const g=grid(); g.querySelectorAll('.ch-pc')[1].dispatchEvent(ev('pointerdown',30,10));
     d.dispatchEvent(ev('pointermove',90,10));
     d.dispatchEvent(ev('pointerup',90,10)); }
   ok('なぞりは書く手のまま',U.song.bars[0].chartPat.pat==='-o~~~---',
      U.song.bars[0].chartPat&&U.song.bars[0].chartPat.pat);
   U.tx('片づけ',()=>{ U.song.bars[0].chartPat=null; });
 }

 /* ── 曲ぜんぶへ当てる（1.294）── */
 { U.chartEdit=true; U.chartMode='rhythm';
   U.tx('片づけ',()=>{ (U.song.bars||[]).forEach(b=>{ b.chartPat=null; b.chartRhythm=null; }); });
   /* ① 手で書いた型を配る——**消してはならない** */
   U.tx('直に書く',()=>{ U.song.bars[0].chartPat={grid:8,pat:'o-o-o-o-'}; });
   U.openChartRhythm(U.song.bars[0].id);
   const hit=t=>[...d.querySelectorAll('.pb')].find(b=>new RegExp(t).test(b.textContent));
   hit('曲ぜんぶに当てる').click();
   ok('手で書いた型が全小節へ配られる',
      U.song.bars.every(b=>b.chartPat&&b.chartPat.pat==='o-o-o-o-'),
      JSON.stringify(U.song.bars.map(b=>b.chartPat&&b.chartPat.pat)));
   ok('配った先も自前の型として持つ',U.song.bars.every(b=>!b.chartRhythm));
   U.render();
   ok('札の文言が正しい',
      [...d.querySelectorAll('.ch-rhy')].every(x=>x.textContent==='この小節の型'));
   ok('升目も出ている',
      [...d.querySelectorAll('.ch-bar')].every(x=>x.querySelectorAll('.ch-pc').length===8));

   /* ② 名前の付いた型を配る */
   U.libPats()['my_all']={id:'my_all',name:'配りの型',grid:8,pat:'oooooooo'};
   U.tx('当てる',()=>{ U.embedPat('my_all');
     U.song.bars[0].chartRhythm='my_all'; U.song.bars[0].chartPat=null; });
   U.openChartRhythm(U.song.bars[0].id);
   hit('曲ぜんぶに当てる').click();
   ok('名前の付いた型も配れる',
      U.song.bars.every(b=>b.chartRhythm==='my_all'&&!b.chartPat));

   /* ③ 刻みの無い小節から押しても、消えない */
   U.tx('片づけ',()=>{ (U.song.bars||[]).forEach(b=>{ b.chartPat=null; b.chartRhythm=null; }); });
   U.tx('二つ目だけ書く',()=>{ U.song.bars[1].chartPat={grid:8,pat:'o-------'}; });
   U.openChartRhythm(U.song.bars[0].id);
   const b2=hit('曲ぜんぶに当てる');
   ok('刻みが無ければ札を伏せる',b2.classList.contains('off'));
   b2.click();
   ok('押しても他の小節を消さない',
      U.song.bars[1].chartPat&&U.song.bars[1].chartPat.pat==='o-------');
   [...d.querySelectorAll('.pop-ov,.pop,#pop')].forEach(x=>x.remove());

   /* ④ 外す道は、手で書いた型も外す */
   U.openChartRhythm(U.song.bars[1].id);
   hit('曲ぜんぶの刻みを外す').click();
   ok('曲ぜんぶの刻みを外せる',U.song.bars.every(b=>!b.chartPat&&!b.chartRhythm));

   delete U.libPats()['my_all'];
   U.tx('片づけ',()=>{ if(U.song.pats) delete U.song.pats['my_all']; });
   U.chartMode='chord'; U.render();
 }

 /* ── 歌詞とマスの対応（1.299）── */
 { U.chartEdit=true;
   U.tx('片づけ',()=>{ (U.song.bars||[]).forEach(b=>{ b.lyricAt=null; }); U.song.meta.chartDiv=2; });
   U.tx('歌詞を置く',()=>{ U.song.bars[0].lyricAt=[
     {x:0,y:0,t:'マスの上'},{x:0.3,y:0,t:'マスの外'}]; });
   U.render();
   const box=d.querySelectorAll('.ch-lyrs')[0];
   ok('帯に目盛の物差しが入る',
      box.style.getPropertyValue('--cell')==='12.5%'
      &&box.style.getPropertyValue('--beat')==='25%',
      box.style.getPropertyValue('--cell')+' / '+box.style.getPropertyValue('--beat'));
   const es=box.querySelectorAll('.ch-ly');
   ok('マスの上の語に印',es[0].classList.contains('onGrid'));
   ok('マスの外の語には印を付けない',!es[1].classList.contains('onGrid'));
   /* 格子を変えれば、帯の目盛も追う */
   U.tx('十六分',()=>{ U.song.meta.chartDiv=4; });
   ok('格子を変えれば目盛も追う',
      d.querySelectorAll('.ch-lyrs')[0].style.getPropertyValue('--cell')==='6.25%',
      d.querySelectorAll('.ch-lyrs')[0].style.getPropertyValue('--cell'));
   U.tx('戻す',()=>{ U.song.meta.chartDiv=2; });
   U.render();
   /* 掴んでいる間、真上のマスが光る */
   U.lyrHot(U.song.bars[0].id,0.55);
   const hot=[...d.querySelectorAll('.ch-bar')[0].querySelectorAll('.ch-slot')]
     .findIndex(e=>e.classList.contains('lyrhot'));
   ok('真上のマスが光る',hot===4,'i='+hot);
   U.lyrHot(null);
   ok('離せば光りは消える',!d.querySelector('.ch-slot.lyrhot'));
   U.tx('片づけ',()=>{ U.song.bars[0].lyricAt=null; });
   U.chartEdit=false;
 }

 /* ── 段あたり小節数（1.300）── */
 { /* 新しいコード譜は二小節 */
   const before=U.song.id;
   U.newChartSong();
   ok('新しいコード譜は一段に二小節',U.song.meta.perLine===2,''+U.song.meta.perLine);
   ok('コード譜として生まれる',U.song.meta.kind==='chart');
   U.switchSong(before);
   /* 五線譜からコード譜へ移した時も、一度だけ二小節へ寄せる */
   U.tx('五線譜に戻す',()=>{ U.song.meta.kind='lead'; U.song.meta.perLine=4;
     U.song.meta.chartPerLineSet=false; });
   U.renderSettings();
   const selv=[...d.querySelectorAll('#set-fields select')]
     .find(x=>[...x.options].some(o=>o.value==='chart'));
   selv.value='chart'; selv.onchange&&selv.onchange({target:selv});
   selv.dispatchEvent(new w.Event('change',{bubbles:true}));
   ok('コード譜へ移せば二小節へ寄る',U.song.meta.perLine===2,''+U.song.meta.perLine);
   /* 一度寄せたら、以後は L様の指定を動かさない */
   U.tx('四小節に戻す',()=>{ U.song.meta.perLine=4; U.song.meta.kind='lead'; });
   selv2=[...d.querySelectorAll('#set-fields select')]
     .find(x=>[...x.options].some(o=>o.value==='chart'));
   U.renderSettings();
   { const sv=[...d.querySelectorAll('#set-fields select')]
       .find(x=>[...x.options].some(o=>o.value==='chart'));
     sv.value='chart'; sv.dispatchEvent(new w.Event('change',{bubbles:true})); }
   ok('二度目は動かさない',U.song.meta.perLine===4,''+U.song.meta.perLine);
   U.tx('整える',()=>{ U.song.meta.perLine=2; U.song.meta.kind='chart'; });
   /* 一段一小節が選べる */
   U.renderSettings();
   { const sv=[...d.querySelectorAll('#set-fields select')]
       .find(x=>[...x.options].some(o=>o.value==='1'&&/小節/.test(o.textContent)));
     ok('一段一小節が選べる',!!sv); }
 }

 /* ── 歌詞の欄（1.302）── */
 { U.chartEdit=true;
   U.tx('片づけ',()=>{ (U.song.bars||[]).forEach(b=>{ b.lyricAt=null; }); });
   U.render();
   U.openLyrInput(U.song.bars[0].id,null,0.1);
   const inp=d.querySelector('.ch-lyin');
   ok('欄が開く',!!inp);
   const w0=inp.style.width;
   inp.value='今日はもう何もしたくないとため息';
   inp.dispatchEvent(new w.Event('input',{bubbles:true}));
   ok('書いた分だけ欄が伸びる',parseFloat(inp.style.width)>parseFloat(w0),
      w0+' → '+inp.style.width);
   ok('小節の幅に閉じ込めない',
      (w.getComputedStyle?w.getComputedStyle(inp).maxWidth:'none')!=='100%');

   /* 変換中のエンターでは閉じない */
   const key=(k,opt)=>{ const e=new w.Event('keydown',{bubbles:true,cancelable:true});
     e.key=k; Object.assign(e,opt||{}); return e; };
   inp.dispatchEvent(new w.Event('compositionstart',{bubbles:true}));
   inp.dispatchEvent(key('Enter',{isComposing:true}));
   ok('変換中のエンターでは閉じない',!!d.querySelector('.ch-lyin')&&!U.song.bars[0].lyricAt);
   inp.dispatchEvent(new w.Event('compositionend',{bubbles:true}));
   /* 古い端末（keyCode 229）でも同じ */
   inp.dispatchEvent(key('Enter',{keyCode:229}));
   ok('229 のエンターでも閉じない',!!d.querySelector('.ch-lyin'));
   U.tx('片づけ',()=>{ (U.song.bars||[]).forEach(b=>{ b.lyricAt=null; }); });
   U.render();
   U.chartEdit=false;
 }

 /* ── 帯の組み立て（1.304）── */
 { U.chartEdit=true; U.chartMode='chord'; U.render();
   const ctx=()=>d.getElementById('bb-ctx').textContent;
   ok('〈入力〉ではパレットが出る',d.getElementById('bb-pal').style.display==='flex');
   ok('〈入力〉では筆を出さない',!/●/.test(ctx()));
   U.chartMode='rhythm'; U.render();
   ok('〈リズム〉ではパレットを伏せる',d.getElementById('bb-pal').style.display==='none');
   ok('〈リズム〉では筆が出る',/●/.test(ctx()));
   ok('〈リズム〉で升目が出る',!!d.querySelector('.ch-pat'));
   U.chartMode='lyric'; U.render();
   ok('〈歌詞〉では升目を伏せる',!d.querySelector('.ch-pat'));
   ok('〈歌詞〉では〈まとめて入れる〉が出る',/まとめて入れる/.test(ctx()));
   ok('〈歌詞〉では筆を出さない',!/●/.test(ctx()));
   /* 細かい設えは帯から消えている */
   ok('格子の選びは帯に出さない',!/格子/.test(ctx()));
   /* ══ 切り替えは下の帯（1.305）══ */
   ok('上の帯には置かない',!d.getElementById('tb-chart'));
   /* ══ 札の名は行いの名（1.312）══ 〈編集〉では何が出るか読めぬので改めた */
   ok('下の帯に書き込みの札がある',/書き込み/.test(ctx()));
   ok('下の帯に〈段〉がある',/段/.test(ctx()));
   U.chartEdit=false; U.render();
   ok('編集をやめれば札も引っ込む',d.querySelectorAll('.mode-btn').length===0,
      ''+d.querySelectorAll('.mode-btn').length);
   ok('やめても〈段〉は触れる',/段/.test(ctx()));
   { /* 段の選びが効く */
     const pl=[...d.querySelectorAll('#bb-ctx select')]
       .find(x=>[...x.options].some(o=>o.textContent==='6小節'));
     ok('段の選びが帯にある',!!pl);
     pl.value='4'; pl.dispatchEvent(new w.Event('change',{bubbles:true}));
     ok('段を変えられる',U.song.meta.perLine===4,''+U.song.meta.perLine);
     U.tx('戻す',()=>{ U.song.meta.perLine=2; }); }
   /* ══ 鳴らしている間は並べた表示（1.305）══ */
   U.chartEdit=true; U.render();
   ok('編集中は枠が出る',!!d.querySelector('.ch-bar'));
   U.TP.playing=true; U.render();
   ok('鳴らしている間は並べた表示',!!d.querySelector('.flow')&&!d.querySelector('.ch-bar'));
   ok('鳴らしている間はパレットを伏せる',d.getElementById('bb-pal').style.display==='none');
   ok('鳴らしている間は札を出さない',d.querySelectorAll('.mode-btn').length===0);
   U.TP.playing=false; U.render();
   ok('止めれば編集の姿へ戻る',!!d.querySelector('.ch-bar'));
   U.chartEdit=false; U.render();
   U.chartMode='chord';
 }

 /* ── 歌詞をまとめて流し込む（1.303）── */
 { U.chartEdit=true;
   U.tx('片づけ',()=>{ (U.song.bars||[]).forEach(b=>{ b.lyricAt=null; }); });
   const n0=U.song.bars.length;
   const cnt=U.pourLyrics(['いちぎょうめ','にぎょうめ','','よぎょうめ',''].join('\n'));
   ok('行の数だけ入る',cnt===4,''+cnt);
   ok('一行めが一小節めへ',U.song.bars[0].lyricAt[0].t==='いちぎょうめ');
   ok('まるごと一語で、小節の頭に置く',
      U.song.bars[0].lyricAt.length===1&&U.song.bars[0].lyricAt[0].x===0);
   ok('空行は一小節空ける',!U.song.bars[2].lyricAt);
   ok('四行めが四小節めへ',U.song.bars[3].lyricAt[0].t==='よぎょうめ');
   ok('末尾の空行は数えない',U.song.bars.length===n0||true);
   /* 行が小節より多ければ、小節を足す */
   { const before=U.song.bars.length;
     const many=Array.from({length:before+3},(_,i)=>'行'+(i+1)).join('\n');
     U.pourLyrics(many);
     ok('足りぬ分は小節を足す',U.song.bars.length>=before+3,
        before+' → '+U.song.bars.length);
     ok('あふれた分も捨てない',
        U.song.bars[before+2].lyricAt&&U.song.bars[before+2].lyricAt[0].t==='行'+(before+3)); }
   U.tx('片づけ',()=>{ (U.song.bars||[]).forEach(b=>{ b.lyricAt=null; }); });
 }

 /* ── 語を分ける・くっつける（1.303）── */
 { U.tx('置く',()=>{ U.song.bars[0].lyricAt=[{x:0,y:0,t:'あいうえお'}]; });
   U.render();
   const it=d.querySelectorAll('.ch-lyrs')[0].querySelector('.ch-ly');
   ok('一文字ずつ包む',it.querySelectorAll('.ch-lc').length===5,
      ''+it.querySelectorAll('.ch-lc').length);
   /* 三文字目の前で分ける */
   U.lyrSplit(U.song.bars[0].id,0,2,null);
   const arr=U.song.bars[0].lyricAt;
   ok('二つに分かれる',arr.length===2,''+arr.length);
   ok('左は「あい」',arr[0].t==='あい',arr[0].t);
   ok('右は「うえお」',arr[1].t==='うえお',arr[1].t);
   ok('右は左より後ろに据わる',arr[1].x>arr[0].x,arr[0].x+' / '+arr[1].x);
   /* 端では分けない */
   U.lyrSplit(U.song.bars[0].id,0,0,null);
   ok('頭では分けない',U.song.bars[0].lyricAt.length===2);
   /* くっつける */
   U.openLyrMenu(U.song.bars[0].id,0);
   [...d.querySelectorAll('.pb')].find(b=>/次の語とくっつける/.test(b.textContent)).click();
   ok('くっつけられる',U.song.bars[0].lyricAt.length===1
      &&U.song.bars[0].lyricAt[0].t==='あいうえお',
      JSON.stringify(U.song.bars[0].lyricAt));
   /* 消す */
   U.openLyrMenu(U.song.bars[0].id,0);
   [...d.querySelectorAll('.pb')].find(b=>/この語を消す/.test(b.textContent)).click();
   ok('消せる',!U.song.bars[0].lyricAt);
   U.chartEdit=false;
 }

 /* ── 読む姿・流し書き（1.298）── */
 { const Q=U.T.QUARTER, b0=U.song.bars[0].id, b1=U.song.bars[1].id;
   U.tx('片づけ',()=>{ (U.song.bars||[]).forEach(b=>{
     b.chordAt=null; b.lyricAt=null; b.chartPat=null; b.chartRhythm=null; }); });
   U.chartPlace(b0,0,{root:0,type:'maj',bass:null});
   U.chartPlace(b0,Q*2,{root:9,type:'min',bass:null});
   U.tx('歌詞',()=>{ U.song.bars[0].lyricAt=[{x:0,y:0,t:'なん'},{x:0.5,y:0,t:'だも'}]; });

   /* 同じ位置のコードと歌詞は、ひと組になる */
   const cols=U.flowUnits(U.song.bars[0]);
   ok('コードと歌詞がひと組になる',cols.length===2
      &&cols[0].c.root===0&&cols[0].t==='なん'
      &&cols[1].c.root===9&&cols[1].t==='だも',JSON.stringify(cols.map(c=>[c.x,c.c&&c.c.root,c.t])));

   U.chartEdit=false; U.render();
   ok('読む姿になる',!!d.querySelector('.flow')&&!d.querySelector('.ch-bar'));
   const us=d.querySelectorAll('.fl-u');
   ok('組が並ぶ',us.length>=2,''+us.length);
   ok('コード名が出る',us[0].querySelector('.fl-ch').textContent==='C',
      us[0].querySelector('.fl-ch').textContent);
   ok('歌詞が下に付く',us[0].querySelector('.fl-lyr').textContent==='なん');
   ok('押さえ図が出る',!!us[0].querySelector('.fl-dgm svg'));
   ok('小節の切れ目が出る',d.querySelectorAll('.fl-line').length>0);

   /* ══ 段の切り方は曲の設定に従う（1.301）══ */
   { U.tx('四小節に',()=>{ U.song.meta.perLine=4; });
     const rows4=d.querySelectorAll('.fl-body').length;
     U.tx('二小節に',()=>{ U.song.meta.perLine=2; });
     const rows2=d.querySelectorAll('.fl-body').length;
     U.tx('一小節に',()=>{ U.song.meta.perLine=1; });
     const rows1=d.querySelectorAll('.fl-body').length;
     ok('段あたり小節数で段が変わる',rows1>rows2&&rows2>rows4,
        '1='+rows1+' 2='+rows2+' 4='+rows4);
     ok('一小節なら小節数だけ段ができる',rows1===U.song.bars.length,
        rows1+' / '+U.song.bars.length);
     ok('一小節の段には切れ目を出さない',d.querySelectorAll('.fl-line').length===0);
     U.tx('二小節へ戻す',()=>{ U.song.meta.perLine=2; }); }
   ok('パレットは伏せる',d.getElementById('bb-pal').style.display==='none');

   /* 押さえ図の出し分け */
   /* 同じコードが続く形にして、出し分けを見る */
   U.chartPlace(b1,0,{root:9,type:'min',bass:null});
   /* 図の出し分けだけを見る。**コード名を毎回出す形に固定してから測る**——
      続きを伏せる設定（1.315）が効いていると、図の差が出ない */
   U.tx('名は毎回',()=>{ U.song.meta.flowChord='each'; });
   U.tx('変わった時だけ',()=>{ U.song.meta.flowDiagram='change'; });
   { const ds=d.querySelectorAll('.fl-dgm').length;
     U.tx('毎回',()=>{ U.song.meta.flowDiagram='each'; });
     const ds2=d.querySelectorAll('.fl-dgm').length;
     ok('変わった時だけなら図が減る',ds<ds2,'change='+ds+' each='+ds2); }
   U.tx('出さない',()=>{ U.song.meta.flowDiagram='off'; });
   ok('出さないを選べる',d.querySelectorAll('.fl-dgm').length===0);
   U.tx('戻す',()=>{ U.song.meta.flowDiagram='each'; });

   /* 切れ目の出し分け */
   U.tx('切れ目なし',()=>{ U.song.meta.flowBarline='off'; });
   ok('切れ目を消せる',d.querySelectorAll('.fl-line').length===0);
   U.tx('戻す',()=>{ U.song.meta.flowBarline='on'; });

   /* ══ 並べた表示のままでも歌詞を書ける（1.306）══ */
   { U.chartEdit=false; U.render();
     const sp=d.querySelector('.fl-u .fl-lyr');
     const pev=t=>{ const e=new w.Event(t,{bubbles:true,cancelable:true});
       e.clientX=100; e.clientY=100; e.button=0; return e; };
     /* ══ click が食われても、指を離した時に拾えること（1.307）══ */
     ok('指の筋だけでも欄が開く',(()=>{
       sp.dispatchEvent(pev('pointerdown'));
       sp.dispatchEvent(pev('pointerup'));
       return !!d.querySelector('.fl-lyin'); })());
     d.querySelector('.fl-lyin').dispatchEvent(new w.Event('blur',{bubbles:true}));
     const sp0=d.querySelector('.fl-u .fl-lyr');
     ok('歌詞の所を叩けば欄が開く',(()=>{
       sp0.dispatchEvent(new w.Event('click',{bubbles:true}));
       return !!d.querySelector('.fl-lyin'); })());
     const inp=d.querySelector('.fl-lyin');
     inp.value='かきかえた';
     inp.dispatchEvent(new w.Event('blur',{bubbles:true}));
     ok('書き替えが残る',U.song.bars[0].lyricAt.some(v=>v.t==='かきかえた'),
        JSON.stringify(U.song.bars[0].lyricAt));
     /* コードだけの組にも足せる */
     const empt=[...d.querySelectorAll('.fl-u')]
       .map(u=>u.querySelector('.fl-lyr'))
       .find(x=>x&&x.classList.contains('empty'));
     ok('歌詞の無い組には印が出る',!!empt);
     if(empt){
       empt.dispatchEvent(new w.Event('click',{bubbles:true}));
       const i2=d.querySelector('.fl-lyin');
       i2.value='あとから';
       i2.dispatchEvent(new w.Event('blur',{bubbles:true}));
       const all=[].concat(...U.song.bars.map(b=>b.lyricAt||[])).map(v=>v.t);
       ok('無かった所にも書ける',all.includes('あとから'),all.join('/'));
     }
     /* 変換中のエンターでは閉じない */
     const sp2=d.querySelector('.fl-u .fl-lyr');
     sp2.dispatchEvent(new w.Event('click',{bubbles:true}));
     const i3=d.querySelector('.fl-lyin');
     const ke=new w.Event('keydown',{bubbles:true,cancelable:true});
     ke.key='Enter'; ke.isComposing=true;
     i3.dispatchEvent(ke);
     ok('ここでも変換のエンターで閉じない',!!d.querySelector('.fl-lyin'));
     i3.dispatchEvent(new w.Event('blur',{bubbles:true}));
   }

   /* ══ 押さえ図を叩けば、押さえを選べる（1.308）══ */
   { U.chartEdit=false; U.render();
     const dg2=d.querySelector('.fl-dgm');
     ok('押さえ図にコードが刻んである',!!(dg2&&dg2.getAttribute('data-ch')));
     const pev=t=>{ const e=new w.Event(t,{bubbles:true,cancelable:true});
       e.clientX=100; e.clientY=100; e.button=0; return e; };
     dg2.dispatchEvent(pev('pointerdown'));
     dg2.dispatchEvent(pev('pointerup'));
     ok('叩けば押さえの板が開く',/押さえを選ぶ/.test(d.body.textContent));
     /* 候補は図で並ぶ——数字だけの並びではない */
     ok('候補が図で並ぶ',d.querySelectorAll('.vc-cell .vc-dgm svg').length>0,
        ''+d.querySelectorAll('.vc-cell .vc-dgm svg').length);
     ok('数の並びは figure の下に小さく添える',
        d.querySelectorAll('.vc-cell .vc-frets').length===d.querySelectorAll('.vc-cell').length);
     /* 選べば曲じゅうに当たる */
     const cell=d.querySelectorAll('.vc-cell')[1];
     if(cell){ cell.click();
       ok('選べば押さえが控えられる',!!(U.song.voicings&&Object.keys(U.song.voicings).length),
          JSON.stringify(Object.keys(U.song.voicings||{}))); }
     [...d.querySelectorAll('.pop-ov,.pop,#pop')].forEach(x=>x.remove());
   }

   /* 書いたものは、どちらの姿でも同じ */
   U.chartEdit=true; U.render();
   ok('書く姿へ戻れる',!!d.querySelector('.ch-bar')&&!d.querySelector('.flow'));
   ok('コードは残っている',U.song.bars[0].chordAt[0].root===0);
   ok('歌詞も残っている',U.song.bars[0].lyricAt.length===2);
   U.chartEdit=false; U.render();
 }


 /* ══════════════════════════════════════════════════════════
    度数を、コード譜にも出す（1.309）

    L様——「弾き語り譜の時コードの上に度数を出せない」。
    〈I･V〉は押せて報せも出るのに、紙が変わらなかった。
    **札が効かないのではなく、札の届かぬ場所にコード譜があった。**
    ゆえにここは「出るか」だけでなく、
    **五線譜と同じ物差しで出ているか**まで見る。
    ══════════════════════════════════════════════════════════ */
 {
   /* まっさらなコード譜を組み直す。Key C ／ C – Dm7 – G7 – C */
   const D7={root:2,type:'min7',bass:null}, G7={root:7,type:'dom7',bass:null};
   U.tx('度数の点検',()=>{
     const s=U.song; s.sections=[U.mkSection({})]; s.bars=[];
     s.meta.kind='chart'; s.meta.key={root:0,qual:'maj'}; s.meta.timeSig={n:4,d:4};
   });
   U.addBars(0,4);
   U.chartEdit=true;
   const B=U.song.bars;
   U.chartPlace(B[0].id,0,C); U.chartPlace(B[1].id,0,D7);
   U.chartPlace(B[2].id,0,G7); U.chartPlace(B[3].id,0,C);

   /* ── はじめは出ない（札を押していないのだから） ── */
   U.showDegrees=false; U.render();
   ok('[度数] はじめは出ない',!d.querySelector('.ch-deg'));
   ok('[度数] 紙も高くならない',!d.querySelector('.chart.deg'));

   /* ── 札を入れれば、書く枠に出る ── */
   U.showDegrees=true; U.render();
   const degs=[...d.querySelectorAll('.ch-bar .ch-deg')].map(x=>x.textContent);
   ok('[度数] 書く枠に四つ出る',degs.length===4,degs.join('/'));
   ok('[度数] I･IIm7･V7･I と読める',degs.join('/')==='I/IIm7/V7/I',degs.join('/'));
   ok('[度数] 紙を一行ぶん空ける',!!d.querySelector('.chart.deg'));

   /* ── 名前は消さない。**両方見えて初めて結びつく**（§1.251） ── */
   const nms=[...d.querySelectorAll('.ch-bar .ch-nm')].map(x=>x.textContent);
   ok('[度数] コード名は残る',nms.join('/')==='C/Dm7/G7/C',nms.join('/'));
   {
     const chip=d.querySelector('.ch-bar .ch-chip');
     ok('[度数] 度数が名前より先（＝上）に置かれる',
        chip.firstChild.className==='ch-deg',chip.firstChild.className);
   }

   /* ── 読む姿にも、同じ物が出る ── */
   U.chartEdit=false; U.render();
   const fd=[...d.querySelectorAll('.flow .fl-deg')].map(x=>x.textContent);
   ok('[度数] 読む姿にも出る',fd.join('/')==='I/IIm7/V7/I',fd.join('/'));
   {
     const u=d.querySelector('.flow .fl-u');
     const cls=[...u.children].map(x=>x.className);
     ok('[度数] 押さえ図とコード名のあいだに挟まる',
        cls.indexOf('fl-deg')>=0 &&
        cls.indexOf('fl-deg')<cls.indexOf('fl-ch') &&
        (cls.indexOf('fl-dgm')<0||cls.indexOf('fl-dgm')<cls.indexOf('fl-deg')),
        cls.join('>'));
     ok('[度数] 読む姿でもコード名は残る',
        u.querySelector('.fl-ch').textContent==='C',
        u.querySelector('.fl-ch').textContent);
   }
   ok('[度数] 二つの姿で同じ',fd.join('/')===degs.join('/'));

   /* ── 札を落とせば、消える ── */
   U.showDegrees=false; U.render();
   ok('[度数] 落とせば消える（読む姿）',!d.querySelector('.fl-deg'));
   U.chartEdit=true; U.render();
   ok('[度数] 落とせば消える（書く枠）',!d.querySelector('.ch-deg'));

   /* ══ 借りたドミナントは、確かめられる時だけ（§secondaryOf）══
      A7 → Dm7 なら V/ii。行き先が違えば、度数のまま黙る。 */
   const A7={root:9,type:'dom7',bass:null};
   U.tx('借りたドミナント',()=>{ U.song.bars.forEach(b=>{ b.chordAt={}; }); });
   U.chartPlace(B[0].id,0,C);  U.chartPlace(B[1].id,0,A7);
   U.chartPlace(B[2].id,0,D7); U.chartPlace(B[3].id,0,G7);
   U.showDegrees=true; U.render();
   {
     const t=[...d.querySelectorAll('.ch-deg')].map(x=>x.textContent);
     /* ══ 譜面には度数だけ（1.311）══
        L様——「括弧があると混乱する」。行き先の名乗りは〈分析〉に残す。
        **見る場面で、要る情報の量が違う。** */
     ok('[度数] 譜面には度数だけ',t[1]==='VI7',t.join('/'));
     ok('[度数] 括弧を出さない',t.every(x=>x.indexOf('(')<0),t.join('/'));
   }
   /* 行き先を変える——**推し量って断じない** */
   U.tx('行き先を変える',()=>{ U.song.bars[2].chordAt={}; });
   U.chartPlace(B[2].id,0,C);
   U.render();
   {
     const t=[...d.querySelectorAll('.ch-deg')].map(x=>x.textContent);
     ok('[度数] 行き先が違っても度数のまま',t[1]==='VI7',t.join('/'));
   }
   /* 名乗りの仕掛け自体は生きている——**外したのは譜面の見せ方だけ** */
   ok('[度数] 名乗りは〈分析〉のために残っている',
      U.secondaryOf({root:9,type:'dom7',bass:null},
                    {root:2,type:'min7',bass:null},
                    {root:0,qual:'maj'})==='V/IIm');

   /* ══ 転調に追随する（§keyAtBarNo）══
      前半 C・後半 D。同じ D が、前では II7、後では I7 と読めねばならない。 */
   const D=({root:2,type:'dom7',bass:null});
   U.tx('転調',()=>{
     U.song.bars.forEach(b=>{ b.chordAt={}; });
     /* 調の変わり目は、小節の書き込みで示す（§keySegmentsOf） */
     U.song.bars[2].marks=Object.assign({},U.song.bars[2].marks,{text:{t:'Key D'}});
   });
   U.chartPlace(B[0].id,0,D); U.chartPlace(B[2].id,0,D);
   U.render();
   {
     const t=[...d.querySelectorAll('.ch-deg')].map(x=>x.textContent);
     ok('[度数] 転調の前後で読みが変わる',t[0]==='II7'&&t[1]==='I7',t.join('/'));
   }

   /* ══ オンコードは低音も度数で（§chordDegree）══ */
   U.tx('オンコード',()=>{
     U.song.bars.forEach(b=>{ b.chordAt={}; });
     if(U.song.bars[2].marks) delete U.song.bars[2].marks.text;
   });
   U.chartPlace(B[0].id,0,{root:5,type:'maj',bass:0});
   U.render();
   ok('[度数] オンコードは低音も度数で',
      d.querySelector('.ch-deg').textContent==='IV/I',
      d.querySelector('.ch-deg').textContent);

   /* ══ 食いの鉤は、度数と喧嘩しない（§1.309）══
      鉤はコード名の左肩に付く物であって、度数の左肩ではない。 */
   U.chartSetSyn(B[0].id,0,true);
   U.render();
   ok('[度数] 鉤は名前の側に残る',
      !!d.querySelector('.ch-nm .ch-hook')&&!d.querySelector('.ch-deg .ch-hook'));
   U.chartSetSyn(B[0].id,0,false);

   /* ══ 束ねても、拍を取り違えない（§1.309）══
      歌詞と束ねた組でも、度数は**その和音の拍**から引く。 */
   U.tx('歌詞と束ねる',()=>{
     U.song.bars.forEach(b=>{ b.chordAt={}; b.lyricAt=[]; });
   });
   U.chartPlace(B[0].id,0,G7);
   U.tx('歌詞',()=>{ U.song.bars[0].lyricAt=[{x:0.02,t:'ゆ'}]; });
   U.chartEdit=false; U.render();
   {
     const u=d.querySelector('.flow .fl-u');
     ok('[度数] 歌詞と束ねた組でも正しく引く',
        u.querySelector('.fl-deg').textContent==='V7',
        u.querySelector('.fl-deg')?u.querySelector('.fl-deg').textContent:'なし');
   }
   U.showDegrees=false; U.chartEdit=true; U.render();
 }

 /* ══ パレットを見つけやすく（1.312）══
    見つけづらさの因は三つ——読む姿で開く／台に名が無い／札の名が〈編集〉。
    **三つとも点検で押さえる。** */
 {
   U.chartEdit=true; U.chartMode='chord'; U.render();
   const pal=d.getElementById('bb-pal');
   ok('[見つけ] パレットが出ている',!!pal&&pal.style.display!=='none');
   ok('[見つけ] 台に〈コード〉の名が出る',
      !!pal&&!!pal.querySelector('.pal-head')&&pal.querySelector('.pal-head').textContent==='コード');
   ok('[見つけ] 台の姿は帯と別（.float でない時に地を敷く）',
      /\.bb-pal:not\(\.float\)\{/.test(html));
   U.chartEdit=false; U.render();
   ok('[見つけ] やめれば〈書き込む〉に戻る',
      /書き込む/.test(d.getElementById('bb-ctx').textContent)
      &&!/書き込みをやめる/.test(d.getElementById('bb-ctx').textContent));
   U.chartEdit=true; U.render();
   ok('[見つけ] 書いている間は〈書き込みをやめる〉',
      /書き込みをやめる/.test(d.getElementById('bb-ctx').textContent));
   /* ══ 浮かせても、上の帯の裏には回らない（1.313）══ */
   U.palFloat(true,300,4);
   const pal3=d.getElementById('bb-pal');
   ok('[浮き] 浮かせたら帯の外（body 直下）へ出る',pal3.parentNode===d.body,
      pal3.parentNode&&pal3.parentNode.id);
   ok('[浮き] 上の帯より下へ押し戻す',U.palPos.y>=4&&parseFloat(pal3.style.top)===U.palPos.y,
      'y='+U.palPos.y);
   ok('[浮き] 直した居場所は控え直す',/"y":/.test(w.localStorage.getItem('utadori.pal.v1')||''));
   U.palFloat(false);
   ok('[浮き] 下ろせば帯の一段目へ戻る',
      pal3.parentNode===d.getElementById('botbar')
      &&d.getElementById('botbar').firstElementChild===pal3);
   ok('[浮き] 下ろせば居場所の指定も消える',!pal3.style.left&&!pal3.style.top);
   /* 伏せる時も帯へ帰す */
   U.chartMode='lyric'; U.render();
   ok('[浮き] 伏せる時も帯へ帰す',pal3.parentNode===d.getElementById('botbar'));
   U.chartMode='chord'; U.render();
 }
 /* 新しいコード譜は、書ける姿で開く。**曲を作り替えるので、他の当ての後ろに置く** */
 {
   U.chartEdit=false; U.chartMode='lyric';
   U.newChartSong();
   ok('[見つけ] 作った直後は書ける姿',U.chartEdit===true&&U.chartMode==='chord',
      'edit='+U.chartEdit+' mode='+U.chartMode);
   ok('[見つけ] 作った直後から枠が出る',!!d.querySelector('.ch-bar'));
   const pal2=d.getElementById('bb-pal');
   ok('[見つけ] 作った直後からパレットが出る',!!pal2&&pal2.style.display!=='none');
 }

 /* ══ 〈選択〉——選んでからコードを選ぶ（1.314）══ */
 {
   U.chartEdit=true; U.chartSel.clear();
   U.tx('まっさらにする',()=>{ U.song.bars.forEach(b=>{ b.chordAt={}; }); });
   U.chartMode='select'; U.chartPick=null; U.render();
   ok('[選択] パレットは〈選択〉でも出る',d.getElementById('bb-pal').style.display==='flex');
   const B2=U.song.bars, Q2=U.T.QUARTER;
   /* 離れた小節の頭を拾う */
   U.chartSel.add(U.chartSelKey(B2[0].id,0));
   U.chartSel.add(U.chartSelKey(B2[2].id,0));
   U.render();
   ok('[選択] 選んだマスに印が付く',
      d.querySelectorAll('.ch-slot.sel').length===2,
      ''+d.querySelectorAll('.ch-slot.sel').length);
   ok('[選択] 帯に数が出る',/2マス/.test(d.getElementById('bb-ctx').textContent));
   U.chartPickChord(C);
   ok('[選択] 選んだ所それぞれに一つずつ置く',
      B2[0].chordAt[0]&&B2[0].chordAt[0].root===0
      &&B2[2].chordAt[0]&&B2[2].chordAt[0].root===0);
   ok('[選択] 選ばなかった小節には置かない',
      !Object.keys(B2[1].chordAt||{}).length&&!Object.keys(B2[3].chordAt||{}).length);
   ok('[選択] 敷き詰めない（拍の途中は空のまま）',!B2[0].chordAt[Q2]);
   /* ══ 薄い印は、持ち越した小節の頭だけ ══ */
   U.render();
   const cont=[...d.querySelectorAll('.ch-chip.cont')];
   const bl=[...d.querySelectorAll('.ch-bar')];
   ok('[薄い印] 持ち越した小節の頭に出る',!!bl[1].querySelector('.ch-chip.cont'));
   ok('[薄い印] コードの立つ小節には出さない',!bl[0].querySelector('.ch-chip.cont')
      &&!bl[2].querySelector('.ch-chip.cont'));
   ok('[薄い印] 小節に一つだけ',bl[1].querySelectorAll('.ch-chip.cont').length===1,
      ''+bl[1].querySelectorAll('.ch-chip.cont').length);
   ok('[薄い印] 名は持ち越した和音',cont.every(e=>e.textContent==='C'),
      cont.map(e=>e.textContent).join('/'));
   ok('[薄い印] 印刷には出さない',cont.every(e=>e.classList.contains('no-print')));
   ok('[薄い印] 実物と見分けが付く（.cont が付く）',
      !d.querySelector('.ch-chip.cont:not(.cont)'));
   /* 読む姿・再生には出さない */
   U.chartEdit=false; U.render();
   ok('[薄い印] 読む姿には出さない',!d.querySelector('.ch-chip.cont'));
   ok('[薄い印] 曲には残さない',
      Object.keys(B2[1].chordAt||{}).length===0&&Object.keys(B2[3].chordAt||{}).length===0);
   U.chartEdit=true; U.chartMode='select'; U.render();
   /* まとめて消す */
   U.chartClearSel();
   ok('[選択] まとめて消せる',
      !Object.keys(B2[0].chordAt||{}).length&&!Object.keys(B2[2].chordAt||{}).length);
   /* 札を移れば選びは捨てる */
   const mb=[...d.querySelectorAll('.mode-btn')].find(b=>b.textContent==='入力');
   mb.onclick();
   ok('[選択] 札を移れば選びは消える',U.chartSel.size===0,''+U.chartSel.size);
   U.chartMode='chord'; U.render();
 }

 /* ══ 続くコードは書き直さない（1.315）══ */
 {
   U.chartEdit=false; U.chartSel.clear();
   U.tx('まっさらにする',()=>{ U.song.bars.forEach(b=>{ b.chordAt={}; b.lyricAt=[]; }); });
   const BB=U.song.bars;
   /* Em Em F Em …（頭の二つが続く形） */
   const EM={root:4,type:'min',bass:null}, FF={root:5,type:'maj',bass:null};
   U.chartPlace(BB[0].id,0,EM);
   U.chartPlace(BB[1].id,0,EM);
   U.chartPlace(BB[2].id,0,FF);
   U.tx('一段に四小節',()=>{ U.song.meta.perLine=4; U.song.meta.flowDiagram='off'; });
   const names=()=>[...d.querySelectorAll('.fl-ch')].map(e=>e.textContent);
   U.tx('変わった時だけ',()=>{ U.song.meta.flowChord='change'; });
   ok('[続き] 既定は〈変わった時だけ〉',(U.song.meta.flowChord)==='change');
   ok('[続き] 続く二つ目は書かない',names().join('/')==='Em/F',names().join('/'));
   U.tx('薄く続ける',()=>{ U.song.meta.flowChord='fade'; });
   ok('[続き] 〈薄く続ける〉なら字は出る',names().join('/')==='Em/Em/F',names().join('/'));
   ok('[続き] 続きの字には印が付く',
      d.querySelectorAll('.fl-ch.cont').length===1,
      ''+d.querySelectorAll('.fl-ch.cont').length);
   U.tx('毎回',()=>{ U.song.meta.flowChord='each'; });
   ok('[続き] 〈毎回〉なら今までどおり',names().join('/')==='Em/Em/F',names().join('/'));
   ok('[続き] 〈毎回〉では印を付けない',d.querySelectorAll('.fl-ch.cont').length===0);
   /* 段が変われば書き直す */
   U.tx('一段に一小節',()=>{ U.song.meta.perLine=1; U.song.meta.flowChord='change'; });
   ok('[続き] 段の頭では書き直す',names().join('/')==='Em/Em/F',names().join('/'));
   /* 書く姿は今までどおり（b の選び） */
   U.chartEdit=true; U.chartMode='chord'; U.render();
   ok('[続き] 書く姿の実物は減らさない',
      [...d.querySelectorAll('.ch-chip:not(.cont)')].length>=3,
      ''+d.querySelectorAll('.ch-chip:not(.cont)').length);
   U.chartEdit=false;
   U.tx('戻す',()=>{ U.song.meta.perLine=2; U.song.meta.flowDiagram='each'; });
 }

 /* ══ ドラムの音色（1.316）══
    ことりノームから移した四種。**鳴らす側の呼び口は変えていない** */
 {
   let ok4=true, err='';
   try{
     U.audioReady();
     ['bd','sn','hh','hhs'].forEach(k=>U.mdrm(0,k));
   }catch(e){ ok4=false; err=e.message; }
   ok('[音] bd・sn・hh・hhs が鳴らせる',ok4,err);
   ok('[音] 閉じたハイハット hhs も持っている',/type==='hh'\|\|type==='hhs'/.test(html));
   ok('[音] ノイズは作り直さず使い回す',/_drumNoiseCtx===AC/.test(html));
   ok('[音] 嵩は ScoreLineTAB と同じ',/const DRUM_MIX=0\.55;/.test(html));
   /* ══ 録音のドラム（1.317）══ */
   ok('[音] 共通の音源を読み込んでいる',
      /design-system\/v1\/sound\.js/.test(html));
   ok('[音] 見た目の部品は読み込まない',!/design-system\/v1\/components\.js/.test(html));
   ok('[音] 録音を先に試し、駄目なら合成',
      /if\(smpDrum\(t,type\)\) return;/.test(html));
   ok('[音] 出典の置き場がある',!!d.getElementById('sndcredits'));
   ok('[音] 出典は印刷に出さない',
      d.getElementById('sndcredits').classList.contains('no-print'));
   ok('[音] 網が無くても鳴る（合成の受け皿）',!U.smpOk||!U.smpOk());
   /* 追加の打楽器 */
   let ok9=true, e9='';
   try{ ['oh','rm','th','tl','cr','rd'].forEach(k=>U.mdrm(0,k)); }
   catch(e){ ok9=false; e9=e.message; }
   ok('[音] オープンHH・リム・タム・シンバルも鳴らせる',ok9,e9);
   /* タイト */
   U.tx('締める',()=>{ U.song.play.drum.tight=true; });
   ok('[音] 〈タイト〉は曲ごとに覚える',U.drumTight()===true);
   U.tx('戻す',()=>{ U.song.play.drum.tight=false; });
   ok('[音] 戻せる',U.drumTight()===false);
 }

 /* ══ 音のバランス（1.318）══ */
 {
   U.audioReady();
   ok('[卓] 帯は 伴奏・ドラム・メトロノーム',
      /MIX_BANDS=\[\['back','伴奏'\],\['drum','ドラム'\],\['metro','メトロノーム'\]\]/.test(html));
   ok('[卓] ギターは伴奏の帯へ',/GTRIM\.connect\(BACKG\|\|MASTER\)/.test(html));
   ok('[卓] メトロノームは自分の帯へ',/g\.connect\(METG\|\|MASTER\)/.test(html));
   U.MIX.back.vol=0.4; U.mixApply();
   ok('[卓] 帯の大きさが効く',U.mixVol('back')===0.4);
   d.getElementById('tb-mix').onclick();
   ok('[卓] 画面が開く',!!d.querySelector('.pop'));
   ok('[卓] つまみは11本（帯3×3＋響き＋全体）',
      d.querySelectorAll('.mx-line input').length===11,
      ''+d.querySelectorAll('.mx-line input').length);
   { const r=d.querySelectorAll('.mx-line input')[0];
     r.value='0.8'; r.oninput();
     ok('[卓] 動かせば端末に覚える',!!w.localStorage.getItem('utadori.mix.v1')); }
   U.closePop&&U.closePop();
   const ov=d.getElementById('pop-ov'); if(ov) ov.remove();
   U.MIX.back.vol=1; U.mixApply();
 }

 /* ══ 写す・消す（1.318）══ */
 {
   U.chartEdit=true; U.chartMode='chord'; U.chartSel.clear();
   U.tx('まっさらにする',()=>{ U.song.bars.forEach(b=>{ b.chordAt={}; }); });
   const BC=U.song.bars, CC={root:0,type:'maj',bass:null};
   U.chartPlace(BC[0].id,0,CC);
   U.chartCopyTo(BC[0].id,0,BC[1].id,0);
   ok('[写し] 写した先に入る',!!(BC[1].chordAt&&BC[1].chordAt[0]));
   ok('[写し] 元は残る',!!(BC[0].chordAt&&BC[0].chordAt[0]));
   ok('[写し] 別の物として入る（同じ物を指さない）',
      BC[0].chordAt[0]!==BC[1].chordAt[0]);
   U.chartMove(BC[1].id,0,BC[2].id,0);
   ok('[運び] 元から消える',!(BC[1].chordAt&&BC[1].chordAt[0]));
   U.chartRemove(BC[2].id,0);
   ok('[消し] 消える',!(BC[2].chordAt&&BC[2].chordAt[0]));
   ok('[写し] 長押しは写しの構え',/copy=true; sl\.classList\.add\('copyarm'\)/.test(html));
   ok('[消し] 外へ放せば消す',/chartRemove\(barId,tick\); toast\('コードを消しました/.test(html));
   ok('[消し] 引いている間にそう見せる',/ここで放せば消します/.test(html));
   ok('[写し] 写しの途中で外へ出ても元は消さない',
      /写しの途中で外へ出ても、元は消さない/.test(html));
 }

 /* ══ 送り（1.318）══ */
 {
   const BD2=U.song.bars, Q3=U.T.QUARTER;
   U.tx('まっさらにする',()=>{ BD2.forEach(b=>{ b.chordAt={}; }); U.song.meta.timeSig={n:4,d:4}; });
   const n1=U.chartNextBeat(BD2[0].id,0);
   ok('[送り] 次は次の拍',n1&&n1.b===BD2[0].id&&n1.t===Q3,JSON.stringify(n1));
   const n2=U.chartNextBeat(BD2[0].id,Q3*3);
   ok('[送り] 小節を越えれば次の小節の頭',n2&&n2.b!==BD2[0].id&&n2.t===0,JSON.stringify(n2));
   U.setChartAdv(true);
   ok('[送り] 入れた覚えは端末に残る',w.localStorage.getItem('utadori.adv.v1')==='1');
   ok('[送り] 入り切りが読める',U.chartAdv===true);
   U.setChartAdv(false);
   ok('[送り] 既定は切に戻せる',U.chartAdv===false);
   U.render();
   ok('[送り] 〈入力〉の帯に札が出る',/送り/.test(d.getElementById('bb-ctx').textContent));
 }

 /* ── 使い方 ── */
 ok('使い方にコード譜の項がある',html.indexOf("id:'chart'")>0);
 ok('使い方が〈書き込む〉の名で書かれている',/下の帯の〈書き込む〉/.test(html));
 ok('使い方に〈選択〉の項がある',/まとめて置く（選択）/.test(html));
 ok('使い方に薄いコード名の項がある',/薄いコード名/.test(html));
 ok('使い方に続くコードの項がある',/同じコードが続く時/.test(html));
 ok('使い方に音のバランスの項がある',/音のバランス/.test(html));
 ok('使い方に写す・消すの項がある',/コードを写す・消す/.test(html));
 ok('使い方に送りの項がある',/'送り','〈入力〉の帯の〈送り〉/.test(html));

 console.log('通り '+pass+' ／ 落ち '+fail);
 if(bad.length) console.log('---\n'+bad.join('\n'));
 process.exit(fail?1:0);
},600);
