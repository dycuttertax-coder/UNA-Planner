import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDv3uZKMBSWXobaQ98_-791g5x_A8GKMcE",
  authDomain: "unana-milk.firebaseapp.com",
  projectId: "unana-milk",
  storageBucket: "unana-milk.firebasestorage.app",
  messagingSenderId: "641894857903",
  appId: "1:641894857903:web:1c664f1f73642da651e85a"
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const DATA_REF = () => doc(db, "app-data", "shared");

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ── INJECTION ROTATION ─────────────────────────────────────────────────────
// 매일 부위 교체: L팔1→R팔1→L배1→R배1→L엉1→R엉1→L팔2→R팔2→...
const SITES = [
  { id:"L-arm", label:"왼팔",          area:"arm",      side:"left",  color:"#4F86E8", bg:"#EAF1FD", maxPos:6 },
  { id:"R-arm", label:"오른팔",         area:"arm",      side:"right", color:"#4F86E8", bg:"#EAF1FD", maxPos:6 },
  { id:"L-abd", label:"왼쪽 배",       area:"abdomen",  side:"left",  color:"#2DBF8A", bg:"#E4F9F2", maxPos:9 },
  { id:"R-abd", label:"오른쪽 배",     area:"abdomen",  side:"right", color:"#2DBF8A", bg:"#E4F9F2", maxPos:9 },
  { id:"L-but", label:"왼쪽 엉덩이",   area:"buttocks", side:"left",  color:"#F0693E", bg:"#FEF0EB", maxPos:9 },
  { id:"R-but", label:"오른쪽 엉덩이", area:"buttocks", side:"right", color:"#F0693E", bg:"#FEF0EB", maxPos:9 },
];
// 실제 접종 기록 기반으로 다음 부위 계산
function getSuggestionFromLog(injLog, beforeDate) {
  const past = Object.entries(injLog)
    .filter(([d,v]) => (!beforeDate || d < beforeDate) && v.logged && v.siteId)
    .sort(([a],[b]) => a.localeCompare(b));
  if (past.length === 0) return { site: SITES[0], position: 1 };
  const lastSiteId = past[past.length-1][1].siteId;
  const lastSiteIdx = SITES.findIndex(s => s.id === lastSiteId);
  const nextSiteIdx = (lastSiteIdx + 1) % SITES.length;
  const nextSite = SITES[nextSiteIdx];
  const usedCount = past.filter(([,v]) => v.siteId === nextSite.id).length;
  const nextPos = (usedCount % nextSite.maxPos) + 1;
  return { site: nextSite, position: nextPos };
}

// ── GROWTH REFERENCE DATA (한국 소아청소년 성장도표 2017 근사) ────────────
const GROW = {
  M: {
    h: [[2,82.5,84.5,86.5,88.5,90.5,92.5,94.5],[3,89.0,91.5,93.5,96.0,98.0,100.0,102.0],[4,96.0,98.5,101.0,103.5,106.0,108.0,110.0],[5,102.5,105.5,108.0,110.5,113.5,115.5,118.0],[6,108.5,111.5,114.5,117.0,120.0,122.5,125.0],[7,114.5,117.5,120.5,123.5,126.5,129.0,131.5],[8,120.0,123.5,126.5,130.0,133.0,135.5,138.5],[9,125.5,129.0,132.5,136.0,139.5,142.5,145.5],[10,130.5,134.5,138.0,141.5,145.5,148.5,152.0],[11,135.5,139.5,143.5,147.5,151.5,155.0,158.5],[12,141.0,145.5,149.5,154.0,158.0,161.5,165.5],[13,148.0,152.5,156.5,161.0,165.0,168.5,172.0],[14,154.5,158.5,162.5,166.5,170.0,173.5,177.0],[15,159.0,162.5,166.0,169.5,173.5,176.5,180.0],[16,161.5,165.0,168.0,171.5,175.0,178.0,181.5],[17,163.0,166.0,169.0,172.5,176.0,179.0,182.5],[18,163.5,166.5,169.5,173.0,176.5,179.5,183.0]],
    w: [[2,10.3,11.0,11.8,12.7,13.7,14.6,15.8],[3,12.3,13.2,14.2,15.4,16.7,18.0,19.6],[4,14.0,15.1,16.4,17.8,19.5,21.2,23.3],[5,15.8,17.1,18.7,20.5,22.6,24.8,27.5],[6,17.5,19.1,21.0,23.2,25.8,28.6,32.0],[7,19.5,21.3,23.6,26.4,29.6,33.2,37.8],[8,21.5,23.8,26.5,29.9,34.0,38.5,44.5],[9,23.5,26.4,29.8,34.0,39.1,44.8,52.5],[10,25.5,29.0,33.3,38.5,44.8,51.9,61.3],[11,28.2,32.4,37.4,43.7,51.3,59.7,70.6],[12,32.0,37.0,43.1,50.3,58.7,68.1,79.8],[13,37.0,42.7,49.2,57.1,65.8,75.5,87.0],[14,43.0,49.0,55.7,63.6,72.4,81.6,92.5],[15,48.0,54.0,60.5,68.0,76.5,85.2,95.5],[16,52.0,57.5,63.5,70.5,78.5,86.5,96.5],[17,54.5,60.0,65.5,72.5,80.0,88.0,97.5],[18,56.0,61.5,67.0,73.5,81.0,89.0,98.0]],
  },
  F: {
    h: [[2,81.5,83.5,85.5,87.5,89.5,91.5,93.5],[3,88.5,90.5,92.5,95.0,97.0,99.0,101.0],[4,95.0,97.5,100.0,102.5,105.0,107.0,109.5],[5,101.5,104.5,107.0,109.5,112.0,114.5,117.0],[6,107.5,110.5,113.0,116.0,118.5,121.0,123.5],[7,113.5,116.5,119.5,122.0,125.0,127.5,130.0],[8,119.0,122.5,125.5,128.5,131.5,134.5,137.0],[9,124.0,128.0,131.5,135.0,138.0,141.0,144.0],[10,129.5,133.5,137.0,140.5,144.0,147.5,150.5],[11,135.5,139.5,143.5,147.5,151.0,154.5,158.0],[12,141.5,145.0,149.0,152.5,156.0,159.0,162.5],[13,146.0,149.5,152.5,156.0,159.0,162.0,165.0],[14,148.5,152.0,155.0,158.0,161.0,163.5,166.5],[15,149.5,153.0,156.0,159.0,162.0,164.5,167.5],[16,150.0,153.5,156.5,159.5,162.5,165.0,168.0],[17,150.5,154.0,157.0,160.0,163.0,165.5,168.5],[18,150.5,154.0,157.0,160.0,163.0,165.5,168.5]],
    w: [[2,9.8,10.5,11.3,12.2,13.2,14.1,15.4],[3,11.7,12.6,13.7,14.9,16.3,17.7,19.5],[4,13.3,14.5,15.8,17.3,19.1,21.0,23.3],[5,14.9,16.3,18.0,19.9,22.2,24.7,27.9],[6,16.5,18.2,20.2,22.6,25.4,28.5,32.6],[7,18.2,20.3,22.8,25.8,29.4,33.4,38.8],[8,20.1,22.7,25.8,29.6,34.0,39.1,46.0],[9,22.2,25.3,29.3,33.9,39.5,46.0,54.7],[10,24.7,28.5,33.2,39.0,46.0,54.0,64.3],[11,28.0,32.5,38.2,45.0,53.0,61.5,72.5],[12,32.5,37.5,43.5,50.5,58.5,67.0,77.5],[13,37.0,42.0,47.5,54.5,62.0,70.0,80.0],[14,40.5,45.0,50.5,57.0,64.5,72.0,82.0],[15,42.5,47.0,52.5,58.5,66.0,73.5,83.5],[16,43.5,48.0,53.5,59.5,67.0,74.5,84.5],[17,44.0,48.5,54.0,60.0,67.5,75.0,85.0],[18,44.5,49.0,54.5,60.5,68.0,75.5,85.5]],
  },
};
const P_KEYS = ["p3","p10","p25","p50","p75","p90","p97"];
const P_VALS = [3,10,25,50,75,90,97];

function rowToObj(arr) {
  const r = { age: arr[0] };
  P_KEYS.forEach((k,i) => r[k] = arr[i+1]);
  return r;
}
function interpRef(table, age) {
  const rows = table.map(rowToObj);
  if (age <= rows[0].age) return rows[0];
  if (age >= rows[rows.length-1].age) return rows[rows.length-1];
  for (let i=0; i<rows.length-1; i++) {
    if (age >= rows[i].age && age <= rows[i+1].age) {
      const t = (age - rows[i].age) / (rows[i+1].age - rows[i].age);
      const r = { age };
      P_KEYS.forEach(k => r[k] = rows[i][k] + t*(rows[i+1][k]-rows[i][k]));
      return r;
    }
  }
  return rows[0];
}
function calcPct(val, ref) {
  const vals = P_KEYS.map(k => ref[k]);
  if (val <= vals[0]) return Math.max(1, Math.round(P_VALS[0] * val/vals[0]));
  if (val >= vals[vals.length-1]) return 99;
  for (let i=0; i<vals.length-1; i++) {
    if (val >= vals[i] && val <= vals[i+1]) {
      const t = (val-vals[i])/(vals[i+1]-vals[i]);
      return Math.round(P_VALS[i] + t*(P_VALS[i+1]-P_VALS[i]));
    }
  }
  return 50;
}
function ageYears(birthStr, dateStr) {
  if (!birthStr||!dateStr) return 0;
  return (new Date(dateStr)-new Date(birthStr))/(365.25*86400000);
}
function fmtAge(y) {
  const yr=Math.floor(y), mo=Math.floor((y-yr)*12);
  return `만 ${yr}세 ${mo}개월`;
}
function pctColor(p) {
  if (p<=3||p>=97) return "#F0693E";
  if (p<=10||p>=90) return "#F5A623";
  return "#2DBF8A";
}
function pctLabel(p) {
  if (p<=3) return "3백분위 이하";
  if (p<=10) return "10백분위 이하 (주의)";
  if (p<=25) return "하위 25%";
  if (p<=75) return "정상 범위";
  if (p<=90) return "상위 25%";
  if (p<=97) return "상위 10%";
  return "97백분위 이상";
}

// ── UTILS ──────────────────────────────────────────────────────────────────
const DAYS=["일","월","화","수","목","금","토"];
function toStr(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function nowTime() { const n=new Date(); return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`; }

// ── BODY DIAGRAM SVGs (onSelect 있으면 클릭 가능) ─────────────────────────
const ARM_D=[{pos:1,cx:50,cy:68},{pos:2,cx:88,cy:68},{pos:3,cx:50,cy:108},{pos:4,cx:88,cy:108},{pos:5,cx:50,cy:148},{pos:6,cx:88,cy:148}];
function ArmSVG({side,activePos,color,onSelect}) {
  return <svg viewBox="0 0 140 215" style={{width:115,height:180}}>
    <ellipse cx="69" cy="22" rx="34" ry="17" fill="#F5C5A0" stroke="#DCAA82" strokeWidth="1.5"/>
    <path d="M35 28 Q30 35 30 185 Q30 208 69 208 Q108 208 110 185 Q110 35 103 28Z" fill="#FDDEC6" stroke="#DCAA82" strokeWidth="1.5"/>
    <text x="69" y="202" textAnchor="middle" fontSize="10" fill="#C0A898" fontFamily="sans-serif" fontWeight="600">{side==="left"?"왼팔":"오른팔"}</text>
    {ARM_D.map(({pos,cx,cy})=>{const a=pos===activePos;return(<g key={pos} onClick={onSelect?()=>onSelect(pos):undefined} style={{cursor:onSelect?"pointer":"default"}}>
      {a&&<circle cx={cx} cy={cy} r="19" fill={color} opacity="0.18"/>}
      <circle cx={cx} cy={cy} r={a?15:12} fill={a?color:"rgba(255,255,255,0.9)"} stroke={color} strokeWidth={a?2.5:1.5} opacity={a?1:0.55}/>
      <text x={cx} y={cy+5} textAnchor="middle" fontSize="12" fontWeight={a?"800":"500"} fill={a?"white":color} fontFamily="sans-serif" style={{pointerEvents:"none"}}>{pos}</text>
    </g>);})}
  </svg>;
}
const ABD_L=[{pos:1,cx:42,cy:62},{pos:2,cx:65,cy:62},{pos:3,cx:88,cy:62},{pos:4,cx:42,cy:93},{pos:5,cx:65,cy:93},{pos:6,cx:88,cy:93},{pos:7,cx:42,cy:124},{pos:8,cx:65,cy:124},{pos:9,cx:88,cy:124}];
const ABD_R=[{pos:1,cx:112,cy:62},{pos:2,cx:135,cy:62},{pos:3,cx:158,cy:62},{pos:4,cx:112,cy:93},{pos:5,cx:135,cy:93},{pos:6,cx:158,cy:93},{pos:7,cx:112,cy:124},{pos:8,cx:135,cy:124},{pos:9,cx:158,cy:124}];
function AbdomenSVG({side,activePos,color,onSelect}) {
  const act=side==="left"?ABD_L:ABD_R,dim=side==="left"?ABD_R:ABD_L;
  return <svg viewBox="0 0 200 195" style={{width:185,height:178}}>
    <path d="M30 10 Q30 0 100 0 Q170 0 170 10 L185 165 Q185 195 100 195 Q15 195 15 165Z" fill="#FDDEC6" stroke="#DCAA82" strokeWidth="1.5"/>
    <path d="M45 18 Q100 40 155 18" fill="none" stroke="#DCAA82" strokeWidth="1" opacity="0.35"/>
    <ellipse cx="100" cy="100" rx="7" ry="5" fill="none" stroke="#C9956A" strokeWidth="2"/>
    <line x1="100" y1="2" x2="100" y2="190" stroke="#DCAA82" strokeWidth="1.2" strokeDasharray="5,4" opacity="0.5"/>
    {dim.map(({pos,cx,cy})=><circle key={`d${pos}`} cx={cx} cy={cy} r="11" fill="rgba(255,255,255,0.5)" stroke={color} strokeWidth="1" opacity="0.2"/>)}
    {act.map(({pos,cx,cy})=>{const a=pos===activePos;return(<g key={pos} onClick={onSelect?()=>onSelect(pos):undefined} style={{cursor:onSelect?"pointer":"default"}}>
      {a&&<circle cx={cx} cy={cy} r="17" fill={color} opacity="0.15"/>}
      <circle cx={cx} cy={cy} r={a?13:11} fill={a?color:"rgba(255,255,255,0.9)"} stroke={color} strokeWidth={a?2.5:1.5} opacity={a?1:0.6}/>
      <text x={cx} y={cy+5} textAnchor="middle" fontSize="11" fontWeight={a?"800":"500"} fill={a?"white":color} fontFamily="sans-serif" style={{pointerEvents:"none"}}>{pos}</text>
    </g>);})}
  </svg>;
}
// OO 엉덩이 - 교집합 내부 테두리 없음, 외곽선만
const BUT_L=[{pos:1,cx:32,cy:52},{pos:2,cx:58,cy:52},{pos:3,cx:84,cy:52},{pos:4,cx:32,cy:82},{pos:5,cx:58,cy:82},{pos:6,cx:84,cy:82},{pos:7,cx:32,cy:112},{pos:8,cx:58,cy:112},{pos:9,cx:84,cy:112}];
const BUT_R=[{pos:1,cx:116,cy:52},{pos:2,cx:142,cy:52},{pos:3,cx:168,cy:52},{pos:4,cx:116,cy:82},{pos:5,cx:142,cy:82},{pos:6,cx:168,cy:82},{pos:7,cx:116,cy:112},{pos:8,cx:142,cy:112},{pos:9,cx:168,cy:112}];
function ButtocksSVG({side,activePos,color,onSelect}) {
  const act=side==="left"?BUT_L:BUT_R,dim=side==="left"?BUT_R:BUT_L;
  return <svg viewBox="0 0 200 165" style={{width:185,height:150}}>
    <ellipse cx="60" cy="90" rx="55" ry="68" fill="#FDDEC6" stroke="none"/>
    <ellipse cx="140" cy="90" rx="55" ry="68" fill="#FDDEC6" stroke="none"/>
    <path d="M 100 43 A 55 68 0 1 0 100 137 A 55 68 0 1 1 100 43 Z" fill="none" stroke="#DCAA82" strokeWidth="1.8"/>
    <path d="M 100 25 Q 97 90 100 155" fill="none" stroke="#C9956A" strokeWidth="1.5" opacity="0.4" strokeDasharray="4,3"/>
    <path d="M 10 18 Q 100 5 190 18" fill="none" stroke="#DCAA82" strokeWidth="1.5" opacity="0.4"/>
    {dim.map(({pos,cx,cy})=><circle key={`d${pos}`} cx={cx} cy={cy} r="11" fill="rgba(255,255,255,0.5)" stroke={color} strokeWidth="1" opacity="0.2"/>)}
    {act.map(({pos,cx,cy})=>{const a=pos===activePos;return(<g key={pos} onClick={onSelect?()=>onSelect(pos):undefined} style={{cursor:onSelect?"pointer":"default"}}>
      {a&&<circle cx={cx} cy={cy} r="17" fill={color} opacity="0.15"/>}
      <circle cx={cx} cy={cy} r={a?13:11} fill={a?color:"rgba(255,255,255,0.9)"} stroke={color} strokeWidth={a?2.5:1.5} opacity={a?1:0.6}/>
      <text x={cx} y={cy+5} textAnchor="middle" fontSize="11" fontWeight={a?"800":"500"} fill={a?"white":color} fontFamily="sans-serif" style={{pointerEvents:"none"}}>{pos}</text>
    </g>);})}
  </svg>;
}
function BodyDiagram({site,position,onSelect}) {
  const {area,side,color}=site;
  if(area==="arm") return <ArmSVG side={side} activePos={position} color={color} onSelect={onSelect}/>;
  if(area==="abdomen") return <AbdomenSVG side={side} activePos={position} color={color} onSelect={onSelect}/>;
  return <ButtocksSVG side={side} activePos={position} color={color} onSelect={onSelect}/>;
}
function AreaIcon({area,color,size=26}) {
  if(area==="arm") return <svg width={size} height={size} viewBox="0 0 26 26"><ellipse cx="13" cy="4" rx="7" ry="3.5" fill={color} opacity="0.35"/><rect x="6" y="5" width="14" height="18" rx="7" fill={color} opacity="0.3"/></svg>;
  if(area==="abdomen") return <svg width={size} height={size} viewBox="0 0 26 26"><rect x="3" y="2" width="20" height="22" rx="7" fill={color} opacity="0.3"/><circle cx="13" cy="14" r="2.5" fill={color} opacity="0.6"/><line x1="13" y1="2" x2="13" y2="24" stroke={color} strokeWidth="1.5" opacity="0.3" strokeDasharray="3,2"/></svg>;
  return <svg width={size} height={size} viewBox="0 0 26 26"><ellipse cx="8" cy="15" rx="7" ry="9" fill={color} opacity="0.3"/><ellipse cx="18" cy="15" rx="7" ry="9" fill={color} opacity="0.3"/></svg>;
}

// ── CALENDAR ───────────────────────────────────────────────────────────────
function Calendar({year,month,log,onDateClick,today,selected}) {
  const firstDay=new Date(year,month,1).getDay();
  const dim=new Date(year,month+1,0).getDate();
  const cells=Array(firstDay).fill(null);
  for(let d=1;d<=dim;d++) cells.push(d);
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
      {DAYS.map((d,i)=><div key={d} style={{textAlign:"center",fontSize:12,fontWeight:700,padding:"4px 0",color:i===0?"#FF6B6B":i===6?"#4F86E8":"#9AA5B4"}}>{d}</div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
      {cells.map((day,i)=>{
        if(!day) return <div key={i}/>;
        const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        const e=log[ds],isT=ds===today,isSel=ds===selected,dow=(firstDay+day-1)%7;
        const sc=e?(SITES.find(s=>s.id===e.siteId)||{color:"#ccc"}).color:null;
        return <div key={day} onClick={()=>onDateClick(ds)} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"7px 2px",cursor:"pointer",borderRadius:12,background:isSel?"#1A1E2E":isT?"#EEF3FF":"transparent"}}>
          <span style={{fontSize:14,lineHeight:1,fontWeight:isSel||isT?800:400,color:isSel?"white":isT?"#4F86E8":dow===0?"#FF6B6B":dow===6?"#4F86E8":"#2D3748"}}>{day}</span>
          <div style={{width:6,height:6,borderRadius:"50%",background:sc||"transparent",marginTop:3}}/>
        </div>;
      })}
    </div>
  </div>;
}

// ── GROWTH CHART ───────────────────────────────────────────────────────────
function GrowthChart({gender,growthLog,metric,birthDate}) {
  if(!gender||!birthDate) return null;
  const table=GROW[gender][metric==="height"?"h":"w"];
  const refRows=table.map(rowToObj);
  const unit=metric==="height"?"cm":"kg";
  const chartData=refRows.map(r=>({age:r.age,...Object.fromEntries(P_KEYS.map(k=>[k,+r[k].toFixed(1)]))}));
  const childPts=Object.entries(growthLog).filter(([,v])=>v[metric]).map(([date,v])=>({age:+ageYears(birthDate,date).toFixed(2),val:+v[metric]})).filter(p=>p.age>=2&&p.age<=18).sort((a,b)=>a.age-b.age);
  const fullData=[...chartData];
  childPts.forEach(({age,val})=>{
    const ex=fullData.find(d=>Math.abs(d.age-age)<0.2);
    if(ex) ex.child=val;
    else { const ref=interpRef(table,age); fullData.push({age:+age.toFixed(1),...Object.fromEntries(P_KEYS.map(k=>[k,+ref[k].toFixed(1)])),child:val}); }
  });
  fullData.sort((a,b)=>a.age-b.age);
  const lineColors={p3:"#FFAAA0",p10:"#FFD580",p25:"#A8D8A8",p50:"#4F86E8",p75:"#A8D8A8",p90:"#FFD580",p97:"#FFAAA0"};
  return <div>
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={fullData} margin={{top:8,right:6,left:-18,bottom:4}}>
        <CartesianGrid strokeDasharray="3,3" stroke="#F0F3F8"/>
        <XAxis dataKey="age" type="number" domain={[2,18]} tickCount={9} tickFormatter={v=>`${v}세`} style={{fontSize:10}} tick={{fill:"#9AA5B4"}}/>
        <YAxis style={{fontSize:10}} tick={{fill:"#9AA5B4"}} tickFormatter={v=>`${v}`}/>
        <Tooltip formatter={(v,n)=>n==="child"?[`${v}${unit}`,"내 아이"]:[`${v}${unit}`,n.toUpperCase()]} labelFormatter={l=>`${l}세`} contentStyle={{fontSize:11,borderRadius:10,border:"1px solid #E8EDF5"}}/>
        {P_KEYS.map(k=><Line key={k} dataKey={k} dot={false} strokeWidth={k==="p50"?2:1} stroke={lineColors[k]} strokeDasharray={k==="p50"?"":"4 3"} opacity={0.85} name={`P${P_VALS[P_KEYS.indexOf(k)]}`}/>)}
        <Line dataKey="child" dot={{r:5,fill:"#1A1E2E",stroke:"white",strokeWidth:2}} stroke="#1A1E2E" strokeWidth={2.5} connectNulls name="child"/>
      </LineChart>
    </ResponsiveContainer>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:6,justifyContent:"center"}}>
      {[["P3/P97","#FFAAA0"],["P10/P90","#FFD580"],["P25/P75","#A8D8A8"],["P50(중앙)","#4F86E8"],["내 아이","#1A1E2E"]].map(([l,c])=>(
        <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#9AA5B4"}}>
          <div style={{width:16,height:2.5,background:c,borderRadius:2}}/>{l}
        </div>
      ))}
    </div>
  </div>;
}

// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const today=toStr(new Date());
  const [viewDate,setViewDate]=useState(new Date());
  const [injLog,setInjLog]=useState({});
  const [growthLog,setGrowthLog]=useState({});
  const [profile,setProfile]=useState({birthDate:"",gender:"M"});
  const [selected,setSelected]=useState(today);
  const [tab,setTab]=useState("inj");
  const [showInjModal,setShowInjModal]=useState(false);
  const [showDiagram,setShowDiagram]=useState(false);
  const [showGrowthModal,setShowGrowthModal]=useState(false);
  const [showProfileModal,setShowProfileModal]=useState(false);
  const [form,setForm]=useState({time:"",dosage:"",notes:""});
  const [gForm,setGForm]=useState({date:today,height:"",weight:""});
  const [pForm,setPForm]=useState({birthDate:"",gender:"M"});
  const [metric,setMetric]=useState("height");
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    const link=document.createElement("link"); link.rel="stylesheet";
    link.href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap";
    document.head.appendChild(link);
  },[]);

  useEffect(()=>{
    (async()=>{
      try {
        const snap = await getDoc(DATA_REF());
        if(snap.exists()){
          const d = snap.data();
          if(d.injLog) setInjLog(d.injLog);
          if(d.growthLog) setGrowthLog(d.growthLog);
          if(d.profile) setProfile(d.profile);
        }
      } catch(e){ console.error(e); }
      setLoaded(true);
    })();
  },[]);

  useEffect(()=>{ if(!loaded) return; const t=setTimeout(()=>{ setDoc(DATA_REF(),{injLog},{merge:true}).catch(console.error); },1000); return()=>clearTimeout(t); },[injLog,loaded]);
  useEffect(()=>{ if(!loaded) return; const t=setTimeout(()=>{ setDoc(DATA_REF(),{growthLog},{merge:true}).catch(console.error); },1000); return()=>clearTimeout(t); },[growthLog,loaded]);
  useEffect(()=>{ if(!loaded) return; const t=setTimeout(()=>{ setDoc(DATA_REF(),{profile},{merge:true}).catch(console.error); },1000); return()=>clearTimeout(t); },[profile,loaded]);

  function getSugFor(ds) {
    return getSuggestionFromLog(injLog, ds);
  }
  const entry=injLog[selected];
  const {site:sugSite,position:sugPos}=getSugFor(selected);
  const dSite=entry?(SITES.find(s=>s.id===entry.siteId)||sugSite):sugSite;
  const dPos=entry?entry.position:sugPos;
  const todaySug=getSugFor(today);

  function openInjModal(ds) {
    setSelected(ds);
    const e=injLog[ds];
    const {site,position}=getSuggestionFromLog(injLog, ds);
    setForm({
      time:e?.time||nowTime(),
      dosage:e?.dosage||"0.8",
      notes:e?.notes||"",
      actualSiteId:e?.siteId||site.id,
      actualPosition:e?.position||position,
    });
    setShowInjModal(true);
  }
  function saveInj() {
    setInjLog(p=>({...p,[selected]:{time:form.time,dosage:form.dosage,notes:form.notes,siteId:form.actualSiteId,position:form.actualPosition,logged:true}}));
    setShowInjModal(false);
  }
  function saveGrowth() {
    if(!gForm.date) return;
    setGrowthLog(p=>({...p,[gForm.date]:{height:gForm.height?+gForm.height:undefined,weight:gForm.weight?+gForm.weight:undefined}}));
    setShowGrowthModal(false);
  }

  const growthDates=Object.keys(growthLog).sort().reverse();
  const latestDate=growthDates[0];
  const latestEntry=latestDate?growthLog[latestDate]:null;
  const latestAge=latestDate?ageYears(profile.birthDate,latestDate):null;
  const hRef=(latestAge&&latestEntry?.height&&profile.birthDate&&latestAge>=2)?interpRef(GROW[profile.gender].h,latestAge):null;
  const wRef=(latestAge&&latestEntry?.weight&&profile.birthDate&&latestAge>=2)?interpRef(GROW[profile.gender].w,latestAge):null;
  const hPct=hRef&&latestEntry?.height?calcPct(latestEntry.height,hRef):null;
  const wPct=wRef&&latestEntry?.weight?calcPct(latestEntry.weight,wRef):null;

  const year=viewDate.getFullYear(),month=viewDate.getMonth();
  const MONTHS=["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const FF="'Noto Sans KR',sans-serif";
  const card={background:"white",borderRadius:22,padding:"18px",boxShadow:"0 2px 14px rgba(0,0,0,0.06)",margin:"0 14px 12px"};
  const inp={width:"100%",padding:"13px 15px",borderRadius:13,border:"2px solid #E8EDF5",fontSize:15,fontFamily:FF,outline:"none",boxSizing:"border-box",background:"#F7F9FC",color:"#1A1E2E"};
  const pill=(bg,col,ch)=><span style={{display:"inline-flex",alignItems:"center",background:bg,color:col,padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700}}>{ch}</span>;

  if(!loaded) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:FF,color:"#9AA5B4",background:"#F0F3F8",flexDirection:"column",gap:12}}><div style={{fontSize:32}}>💉</div><div>로딩 중...</div></div>;

  const histEntries=Object.entries(injLog).filter(([,v])=>v.logged).sort(([a],[b])=>b.localeCompare(a)).slice(0,40);

  return (
    <div style={{maxWidth:390,margin:"0 auto",minHeight:"100vh",background:"#F0F3F8",fontFamily:FF}}>
      {/* HEADER */}
      <div style={{background:"white",padding:"18px 18px 0",boxShadow:"0 1px 0 rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div>
            <div style={{fontSize:19,fontWeight:900,color:"#1A1E2E",letterSpacing:-0.5}}>💉 성장호르몬 플래너</div>
            <div style={{fontSize:11,color:"#9AA5B4",marginTop:1}}>주사 부위 순환 · 성장 기록</div>
          </div>
          <div style={{background:todaySug.site.bg,borderRadius:14,padding:"7px 12px",textAlign:"right"}}>
            <div style={{fontSize:10,color:todaySug.site.color,fontWeight:700}}>오늘 추천</div>
            <div style={{fontSize:13,color:todaySug.site.color,fontWeight:800}}>{todaySug.site.label} {todaySug.position}번</div>
          </div>
        </div>
        <div style={{display:"flex",borderBottom:"2px solid #F0F3F8"}}>
          {[["inj","💉 주사"],["hist","📋 기록"],["growth","📈 성장"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px 0",background:"none",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",color:tab===t?"#1A1E2E":"#9AA5B4",fontFamily:FF,borderBottom:tab===t?"2.5px solid #1A1E2E":"2.5px solid transparent",marginBottom:-2}}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{height:14}}/>

      {/* ── 주사 TAB ── */}
      {tab==="inj" && <>
        <div style={card}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <button onClick={()=>setViewDate(new Date(year,month-1,1))} style={{background:"#F0F3F8",border:"none",borderRadius:10,width:34,height:34,fontSize:18,cursor:"pointer"}}>‹</button>
            <span style={{fontSize:16,fontWeight:800,color:"#1A1E2E"}}>{year}년 {MONTHS[month]}</span>
            <button onClick={()=>setViewDate(new Date(year,month+1,1))} style={{background:"#F0F3F8",border:"none",borderRadius:10,width:34,height:34,fontSize:18,cursor:"pointer"}}>›</button>
          </div>
          <Calendar year={year} month={month} log={injLog} onDateClick={openInjModal} today={today} selected={selected}/>
        </div>
        <div style={card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div style={{fontSize:11,color:"#9AA5B4",fontWeight:600,marginBottom:3}}>{selected===today?"📍 오늘":selected} 주사 부위</div>
              <div style={{fontSize:22,fontWeight:900,color:"#1A1E2E"}}>{dSite.label}</div>
              <div style={{marginTop:6,display:"flex",gap:6,flexWrap:"wrap"}}>
                {pill(dSite.bg,dSite.color,`${dPos}번 부위`)}
                {entry&&pill("#EDFAF3","#2DBF8A","✓ 기록됨")}
              </div>
            </div>
            {entry&&<div style={{textAlign:"right",background:"#F7F9FC",borderRadius:12,padding:"10px 14px"}}>
              {entry.time&&<div style={{fontSize:18,fontWeight:800,color:"#1A1E2E"}}>{entry.time}</div>}
              {entry.dosage&&<div style={{fontSize:12,color:"#9AA5B4",marginTop:2}}>{entry.dosage}</div>}
            </div>}
          </div>
          <div onClick={()=>setShowDiagram(true)} style={{background:dSite.bg,borderRadius:16,padding:"14px",display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",border:`2px solid ${dSite.color}20`}}>
            <BodyDiagram site={dSite} position={dPos}/>
            <div style={{fontSize:11,color:dSite.color,marginTop:8,fontWeight:700}}>👆 탭하여 크게 보기</div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:12}}>
            <button onClick={()=>openInjModal(selected)} style={{flex:1,padding:"14px",borderRadius:14,border:"none",background:entry?"#F0F3F8":dSite.color,color:entry?"#2D3748":"white",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:FF}}>{entry?"✏️ 수정":"💉 기록하기"}</button>
            {entry&&<button onClick={()=>{setInjLog(p=>{const n={...p};delete n[selected];return n;});}} style={{padding:"14px 16px",borderRadius:14,border:"none",background:"#FFE8E8",color:"#FF6B6B",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:FF}}>🗑</button>}
          </div>
        </div>
        <div style={{...card,paddingBottom:14}}>
          <div style={{fontSize:11,fontWeight:800,color:"#9AA5B4",marginBottom:10}}>매일 부위 교체 순환 방식</div>
          {[{area:"arm",label:"왼팔 ↔ 오른팔",sub:"1~2일차 → 7~8일차에 2번으로",color:"#4F86E8",bg:"#EAF1FD"},{area:"abdomen",label:"왼쪽 배 ↔ 오른쪽 배",sub:"3~4일차 → 9~10일차에 2번으로",color:"#2DBF8A",bg:"#E4F9F2"},{area:"buttocks",label:"왼쪽 엉덩이 ↔ 오른쪽 엉덩이",sub:"5~6일차 → 11~12일차에 2번으로",color:"#F0693E",bg:"#FEF0EB"}].map(({area,label,sub,color,bg})=>(
            <div key={area} style={{display:"flex",alignItems:"center",gap:10,background:bg,borderRadius:12,padding:"10px 12px",marginBottom:7}}>
              <AreaIcon area={area} color={color} size={22}/>
              <div><div style={{fontSize:12,color,fontWeight:700}}>{label}</div><div style={{fontSize:10,color,opacity:0.7}}>{sub}</div></div>
            </div>
          ))}
          <div style={{fontSize:10,color:"#B0BAC8",marginTop:8,lineHeight:1.6}}>예시: 1일=왼팔1번 · 2일=오른팔1번 · 3일=왼배1번 · 4일=오른배1번 · 5일=왼엉1번 · 6일=오른엉1번 · 7일=왼팔2번…</div>
        </div>
      </>}

      {/* ── 기록 TAB ── */}
      {tab==="hist" && <div style={{padding:"0 14px"}}>
        {histEntries.length===0?<div style={{...card,textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:36,marginBottom:10}}>📋</div><div style={{fontSize:15,fontWeight:700,color:"#2D3748"}}>기록이 없습니다</div></div>
        :histEntries.map(([ds,e])=>{const s=SITES.find(x=>x.id===e.siteId)||SITES[0];return(
          <div key={ds} onClick={()=>{setSelected(ds);setTab("inj");openInjModal(ds);}} style={{...card,display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"13px 16px",margin:"0 0 10px"}}>
            <div style={{width:38,height:38,borderRadius:11,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><AreaIcon area={s.area} color={s.color} size={24}/></div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:"#1A1E2E"}}>{ds}</div><div style={{marginTop:3}}>{pill(s.bg,s.color,`${s.label} ${e.position}번`)}</div></div>
            <div style={{textAlign:"right"}}>{e.time&&<div style={{fontSize:14,fontWeight:700,color:"#2D3748"}}>{e.time}</div>}{e.dosage&&<div style={{fontSize:11,color:"#9AA5B4",marginTop:2}}>{e.dosage}</div>}</div>
          </div>);})}
        <div style={{height:24}}/>
      </div>}

      {/* ── 성장 TAB ── */}
      {tab==="growth" && <div style={{padding:"0 14px"}}>
        <div style={{...card,padding:"14px 16px",margin:"0 0 12px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#9AA5B4",marginBottom:4}}>아이 정보</div>
              {profile.birthDate?<div style={{fontSize:13,fontWeight:700,color:"#1A1E2E"}}>{profile.gender==="M"?"👦":"👧"} {profile.birthDate}{latestAge&&<span style={{fontSize:11,color:"#9AA5B4",marginLeft:8}}>{fmtAge(latestAge)}</span>}</div>
              :<div style={{fontSize:12,color:"#9AA5B4"}}>정보를 설정해 주세요</div>}
            </div>
            <button onClick={()=>{setPForm({...profile});setShowProfileModal(true);}} style={{background:"#F0F3F8",border:"none",borderRadius:10,padding:"7px 13px",fontSize:12,fontWeight:700,cursor:"pointer",color:"#4A5568",fontFamily:FF}}>⚙️ {profile.birthDate?"수정":"설정"}</button>
          </div>
        </div>

        {latestEntry&&<div style={{...card,margin:"0 0 12px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#9AA5B4",marginBottom:12}}>최근 측정 · {latestDate}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {latestEntry.height&&<div style={{background:"#F7F9FC",borderRadius:16,padding:"14px"}}>
              <div style={{fontSize:11,color:"#9AA5B4",fontWeight:600,marginBottom:4}}>키</div>
              <div style={{fontSize:22,fontWeight:900,color:"#1A1E2E"}}>{latestEntry.height}<span style={{fontSize:12,fontWeight:500}}> cm</span></div>
              {hPct!==null&&<><div style={{marginTop:6}}>{pill(pctColor(hPct)+"22",pctColor(hPct),`${hPct}백분위`)}</div><div style={{fontSize:10,color:"#9AA5B4",marginTop:4,lineHeight:1.4}}>{pctLabel(hPct)}</div></>}
            </div>}
            {latestEntry.weight&&<div style={{background:"#F7F9FC",borderRadius:16,padding:"14px"}}>
              <div style={{fontSize:11,color:"#9AA5B4",fontWeight:600,marginBottom:4}}>몸무게</div>
              <div style={{fontSize:22,fontWeight:900,color:"#1A1E2E"}}>{latestEntry.weight}<span style={{fontSize:12,fontWeight:500}}> kg</span></div>
              {wPct!==null&&<><div style={{marginTop:6}}>{pill(pctColor(wPct)+"22",pctColor(wPct),`${wPct}백분위`)}</div><div style={{fontSize:10,color:"#9AA5B4",marginTop:4,lineHeight:1.4}}>{pctLabel(wPct)}</div></>}
            </div>}
          </div>
        </div>}

        {profile.birthDate&&growthDates.length>0&&<div style={{...card,margin:"0 0 12px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div><div style={{fontSize:13,fontWeight:800,color:"#1A1E2E"}}>성장 곡선</div><div style={{fontSize:10,color:"#9AA5B4"}}>한국 소아청소년 성장도표 2017 기준</div></div>
            <div style={{display:"flex",gap:6}}>
              {["height","weight"].map(m=><button key={m} onClick={()=>setMetric(m)} style={{padding:"5px 11px",borderRadius:9,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FF,background:metric===m?"#1A1E2E":"#F0F3F8",color:metric===m?"white":"#9AA5B4"}}>{m==="height"?"키":"몸무게"}</button>)}
            </div>
          </div>
          <GrowthChart gender={profile.gender} growthLog={growthLog} metric={metric} birthDate={profile.birthDate}/>
        </div>}

        {growthDates.length>0&&<div style={{...card,margin:"0 0 12px"}}>
          <div style={{fontSize:11,fontWeight:800,color:"#9AA5B4",marginBottom:12}}>측정 기록</div>
          {growthDates.slice(0,20).map(ds=>{
            const e=growthLog[ds];
            const age=profile.birthDate?ageYears(profile.birthDate,ds):null;
            const hr=(age&&e.height&&age>=2)?interpRef(GROW[profile.gender].h,age):null;
            const wr=(age&&e.weight&&age>=2)?interpRef(GROW[profile.gender].w,age):null;
            const hp=hr&&e.height?calcPct(e.height,hr):null;
            const wp=wr&&e.weight?calcPct(e.weight,wr):null;
            return <div key={ds} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 0",borderBottom:"1px solid #F5F7FA"}}>
              <div><div style={{fontSize:12,fontWeight:700,color:"#1A1E2E"}}>{ds}</div>{age&&<div style={{fontSize:10,color:"#9AA5B4"}}>{fmtAge(age)}</div>}</div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                {e.height&&<div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,color:"#1A1E2E"}}>{e.height} cm</div>{hp!==null&&<div style={{fontSize:10,color:pctColor(hp),fontWeight:700}}>{hp}백분위</div>}</div>}
                {e.weight&&<div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,color:"#1A1E2E"}}>{e.weight} kg</div>{wp!==null&&<div style={{fontSize:10,color:pctColor(wp),fontWeight:700}}>{wp}백분위</div>}</div>}
                <button onClick={()=>setGrowthLog(p=>{const n={...p};delete n[ds];return n;})} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#D1D5DB",padding:"0 2px"}}>✕</button>
              </div>
            </div>;
          })}
        </div>}

        <div style={{margin:"0 0 80px"}}>
          <button onClick={()=>{setGForm({date:today,height:"",weight:""});setShowGrowthModal(true);}} style={{width:"100%",padding:"15px",borderRadius:16,border:"none",background:"#1A1E2E",color:"white",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:FF}}>📏 성장 측정 추가</button>
        </div>
      </div>}

      {/* ── MODALS ── */}
      {showInjModal&&(()=>{
        const {site:sugSite2,position:sugPos2}=getSugFor(selected);
        const actSite=SITES.find(s=>s.id===form.actualSiteId)||sugSite2;
        const dosageOptions=[];
        for(let v=0.1;v<=3.01;v+=0.1) dosageOptions.push((Math.round(v*10)/10).toFixed(1));
        const maxPos=actSite.maxPos;
        return <div style={{position:"fixed",inset:0,background:"rgba(15,20,35,0.6)",display:"flex",alignItems:"flex-end",zIndex:100,backdropFilter:"blur(4px)"}} onClick={()=>setShowInjModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:390,margin:"0 auto",background:"white",borderRadius:"26px 26px 0 0",padding:"10px 20px 44px",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0 18px"}}>
              <div style={{fontSize:17,fontWeight:900,color:"#1A1E2E"}}>주사 기록</div>
              <button onClick={()=>setShowInjModal(false)} style={{background:"#F0F3F8",border:"none",borderRadius:"50%",width:34,height:34,fontSize:16,cursor:"pointer",color:"#9AA5B4",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{fontSize:11,color:"#9AA5B4",marginBottom:16}}>{selected} · 추천: {sugSite2.label} {sugPos2}번</div>

            {/* 시간 */}
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,fontWeight:700,color:"#4A5568",marginBottom:7}}>🕐 접종 시간</label>
              <input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={{...inp,fontWeight:700,fontSize:18}}/>
            </div>

            {/* 용량 스크롤 선택 */}
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,fontWeight:700,color:"#4A5568",marginBottom:7}}>💊 용량 (mg)</label>
              <select value={form.dosage} onChange={e=>setForm(p=>({...p,dosage:e.target.value}))}
                style={{...inp,fontSize:20,fontWeight:800,color:"#1A1E2E",appearance:"none",textAlign:"center",cursor:"pointer"}}>
                {dosageOptions.map(v=><option key={v} value={v}>{v} mg</option>)}
              </select>
            </div>

            {/* 실제 접종 부위 - 이미지에서 직접 선택 */}
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,fontWeight:700,color:"#4A5568",marginBottom:8}}>📍 실제 접종 부위</label>
              {/* 부위 선택 버튼 */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:12}}>
                {SITES.map(s=><button key={s.id} onClick={()=>setForm(p=>({...p,actualSiteId:s.id,actualPosition:1}))}
                  style={{padding:"8px 2px",borderRadius:10,border:`2px solid ${form.actualSiteId===s.id?s.color:"#E8EDF5"}`,background:form.actualSiteId===s.id?s.bg:"white",color:form.actualSiteId===s.id?s.color:"#9AA5B4",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FF}}>
                  {s.label}
                </button>)}
              </div>
              {/* SVG 이미지에서 번호 직접 탭 */}
              <div style={{fontSize:11,color:actSite.color,fontWeight:700,marginBottom:6,textAlign:"center"}}>
                이미지에서 번호를 탭해서 선택하세요 · 현재 <strong>{form.actualPosition}번</strong>
              </div>
              <div style={{background:actSite.bg,borderRadius:16,padding:"12px",display:"flex",justifyContent:"center",border:`2px solid ${actSite.color}20`}}>
                <BodyDiagram site={actSite} position={form.actualPosition} onSelect={n=>setForm(p=>({...p,actualPosition:n}))}/>
              </div>
            </div>

            {/* 메모 */}
            <div style={{marginBottom:20}}>
              <label style={{display:"block",fontSize:12,fontWeight:700,color:"#4A5568",marginBottom:7}}>📝 메모</label>
              <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="특이사항" rows={2} style={{...inp,resize:"none",lineHeight:1.6}}/>
            </div>

            <button onClick={saveInj} style={{width:"100%",padding:15,borderRadius:15,border:"none",background:actSite.color,color:"white",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:FF,boxShadow:`0 6px 20px ${actSite.color}40`}}>✓ 저장하기</button>
          </div>
        </div>;
      })()}

      {showDiagram&&<div style={{position:"fixed",inset:0,background:"rgba(15,20,35,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(6px)",padding:"20px",boxSizing:"border-box"}} onClick={()=>setShowDiagram(false)}>
        <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:28,padding:"24px 20px 20px",width:"100%",maxWidth:340,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{fontSize:11,fontWeight:700,color:dSite.color,letterSpacing:2,marginBottom:4}}>주사 부위 확인</div>
          <div style={{fontSize:22,fontWeight:900,color:"#1A1E2E",marginBottom:8}}>{dSite.label}</div>
          {pill(dSite.bg,dSite.color,`${dPos}번 부위에 주사하세요`)}
          <div style={{background:dSite.bg,borderRadius:20,padding:"16px",marginTop:16,display:"flex",alignItems:"center",justifyContent:"center",width:"100%",boxSizing:"border-box"}}><BodyDiagram site={dSite} position={dPos}/></div>
          <div style={{fontSize:11,color:"#9AA5B4",textAlign:"center",marginTop:10,lineHeight:1.6}}>강조된 <strong style={{color:dSite.color}}>{dPos}번</strong> 위치에 피하주사</div>
          <button onClick={()=>setShowDiagram(false)} style={{marginTop:14,padding:"11px 28px",borderRadius:12,border:"none",background:"#F0F3F8",color:"#2D3748",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:FF}}>닫기</button>
        </div>
      </div>}

      {showGrowthModal&&<div style={{position:"fixed",inset:0,background:"rgba(15,20,35,0.6)",display:"flex",alignItems:"flex-end",zIndex:100,backdropFilter:"blur(4px)"}} onClick={()=>setShowGrowthModal(false)}>
        <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:390,margin:"0 auto",background:"white",borderRadius:"26px 26px 0 0",padding:"10px 20px 44px"}}>
          <div style={{width:40,height:4,background:"#E8EDF5",borderRadius:2,margin:"10px auto 18px"}}/>
          <div style={{fontSize:18,fontWeight:900,color:"#1A1E2E",marginBottom:4}}>📏 성장 측정 기록</div>
          <div style={{fontSize:12,color:"#9AA5B4",marginBottom:18}}>키와 몸무게를 입력하세요</div>
          <div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,fontWeight:700,color:"#4A5568",marginBottom:7}}>📅 측정 날짜</label><input type="date" value={gForm.date} onChange={e=>setGForm(p=>({...p,date:e.target.value}))} style={{...inp,fontWeight:700}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            <div><label style={{display:"block",fontSize:12,fontWeight:700,color:"#4A5568",marginBottom:7}}>키 (cm)</label><input type="number" step="0.1" value={gForm.height} onChange={e=>setGForm(p=>({...p,height:e.target.value}))} placeholder="예: 120.5" style={{...inp,fontSize:16,fontWeight:700}}/></div>
            <div><label style={{display:"block",fontSize:12,fontWeight:700,color:"#4A5568",marginBottom:7}}>몸무게 (kg)</label><input type="number" step="0.1" value={gForm.weight} onChange={e=>setGForm(p=>({...p,weight:e.target.value}))} placeholder="예: 25.0" style={{...inp,fontSize:16,fontWeight:700}}/></div>
          </div>
          <button onClick={saveGrowth} style={{width:"100%",padding:15,borderRadius:15,border:"none",background:"#1A1E2E",color:"white",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:FF}}>✓ 저장하기</button>
        </div>
      </div>}

      {showProfileModal&&<div style={{position:"fixed",inset:0,background:"rgba(15,20,35,0.6)",display:"flex",alignItems:"flex-end",zIndex:100,backdropFilter:"blur(4px)"}} onClick={()=>setShowProfileModal(false)}>
        <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:390,margin:"0 auto",background:"white",borderRadius:"26px 26px 0 0",padding:"10px 20px 44px"}}>
          <div style={{width:40,height:4,background:"#E8EDF5",borderRadius:2,margin:"10px auto 18px"}}/>
          <div style={{fontSize:18,fontWeight:900,color:"#1A1E2E",marginBottom:4}}>⚙️ 아이 정보 설정</div>
          <div style={{fontSize:12,color:"#9AA5B4",marginBottom:18}}>성장 백분위 계산에 사용됩니다</div>
          <div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:700,color:"#4A5568",marginBottom:7}}>생년월일</label><input type="date" value={pForm.birthDate} onChange={e=>setPForm(p=>({...p,birthDate:e.target.value}))} style={{...inp,fontWeight:700}}/></div>
          <div style={{marginBottom:22}}><label style={{display:"block",fontSize:12,fontWeight:700,color:"#4A5568",marginBottom:10}}>성별</label>
            <div style={{display:"flex",gap:10}}>
              {[["M","👦 남자"],["F","👧 여자"]].map(([v,l])=><button key={v} onClick={()=>setPForm(p=>({...p,gender:v}))} style={{flex:1,padding:"13px",borderRadius:13,border:`2px solid ${pForm.gender===v?"#1A1E2E":"#E8EDF5"}`,background:pForm.gender===v?"#1A1E2E":"white",color:pForm.gender===v?"white":"#9AA5B4",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:FF}}>{l}</button>)}
            </div>
          </div>
          <button onClick={()=>{setProfile(pForm);setShowProfileModal(false);}} style={{width:"100%",padding:15,borderRadius:15,border:"none",background:"#1A1E2E",color:"white",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:FF}}>✓ 저장하기</button>
        </div>
      </div>}
    </div>
  );
}
