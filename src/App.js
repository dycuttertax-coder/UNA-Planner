import { useState } from "react";

const color = "#2DBF8A", bg = "#E4F9F2";
const FF = "sans-serif";

const entry = { time: "21:30", dosage: "0.8" };
const dSite = { label: "왼쪽 배", color, bg, area: "abdomen" };
const dPos = 3;
const selected = "2025-05-13";

function Pill({b,c,ch}) {
  return <span style={{display:"inline-flex",alignItems:"center",background:b,color:c,padding:"4px 10px",borderRadius:16,fontSize:11,fontWeight:700}}>{ch}</span>;
}

// A: 좌우 분리 (정보 왼쪽, 버튼 오른쪽)
function OptionA() {
  return (
    <div style={{background:"white",borderRadius:18,padding:"14px 16px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
      <div style={{fontSize:10,color:"#9AA5B4",marginBottom:4}}>📍 오늘 · {selected}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:17,fontWeight:900,color:"#1A1E2E"}}>{dSite.label} {dPos}번</div>
          <div style={{display:"flex",gap:6,marginTop:5,alignItems:"center"}}>
            <Pill b="#EDFAF3" c="#2DBF8A" ch="✓ 기록됨"/>
            <span style={{fontSize:13,fontWeight:700,color:"#2D3748"}}>{entry.time}</span>
            <span style={{fontSize:11,color:"#9AA5B4"}}>{entry.dosage}mg</span>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <button style={{padding:"9px 16px",borderRadius:12,border:"none",background:"#F0F3F8",color:"#2D3748",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FF}}>✏️ 수정</button>
          <button style={{padding:"9px 16px",borderRadius:12,border:"none",background:"#FFE8E8",color:"#FF6B6B",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FF}}>🗑 삭제</button>
        </div>
      </div>
    </div>
  );
}

// B: 풀 버튼 하단
function OptionB() {
  return (
    <div style={{background:"white",borderRadius:18,padding:"14px 16px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
      <div style={{fontSize:10,color:"#9AA5B4",marginBottom:3}}>📍 오늘 · {selected}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div>
          <div style={{fontSize:17,fontWeight:900,color:"#1A1E2E"}}>{dSite.label} {dPos}번</div>
          <div style={{display:"flex",gap:6,marginTop:4,alignItems:"center"}}>
            <Pill b="#EDFAF3" c="#2DBF8A" ch="✓ 기록됨"/>
          </div>
        </div>
        <div style={{textAlign:"right",background:"#F7F9FC",borderRadius:10,padding:"8px 12px"}}>
          <div style={{fontSize:16,fontWeight:800,color:"#1A1E2E"}}>{entry.time}</div>
          <div style={{fontSize:11,color:"#9AA5B4"}}>{entry.dosage}mg</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8}}>
        <button style={{padding:"11px",borderRadius:12,border:"none",background:"#F0F3F8",color:"#2D3748",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FF}}>✏️ 수정하기</button>
        <button style={{padding:"11px 14px",borderRadius:12,border:"none",background:"#FFE8E8",color:"#FF6B6B",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FF}}>🗑</button>
      </div>
    </div>
  );
}

// C: 컬러 강조 카드
function OptionC() {
  return (
    <div style={{background:bg,borderRadius:18,padding:"14px 16px",border:`2px solid ${color}30`,boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:10,color,fontWeight:700}}>📍 오늘 주사 부위</div>
        <Pill b="white" c="#2DBF8A" ch="✓ 기록됨"/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:20,fontWeight:900,color:"#1A1E2E"}}>{dSite.label} <span style={{color}}>{dPos}번</span></div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:16,fontWeight:800,color:"#1A1E2E"}}>{entry.time}</div>
          <div style={{fontSize:11,color:"#9AA5B4"}}>{entry.dosage}mg</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,marginTop:10}}>
        <button style={{padding:"10px",borderRadius:12,border:"none",background:"white",color:"#2D3748",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FF,boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>✏️ 수정하기</button>
        <button style={{padding:"10px 14px",borderRadius:12,border:"none",background:"#FFE8E8",color:"#FF6B6B",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FF}}>🗑</button>
      </div>
    </div>
  );
}

// D: 미기록 상태 강조
function OptionD() {
  return (
    <div style={{background:"white",borderRadius:18,padding:"14px 16px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
        <div style={{fontSize:10,color:"#9AA5B4"}}>📍 오늘 · {selected}</div>
        <Pill b="#EDFAF3" c="#2DBF8A" ch="✓ 기록됨"/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:18,fontWeight:900,color:"#1A1E2E"}}>{dSite.label} {dPos}번 부위</div>
        <div style={{fontSize:14,fontWeight:700,color:"#1A1E2E"}}>{entry.time} <span style={{fontSize:11,color:"#9AA5B4",fontWeight:400}}>{entry.dosage}mg</span></div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button style={{flex:1,padding:"11px",borderRadius:12,border:`2px solid ${color}`,background:"white",color,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FF}}>✏️ 수정</button>
        <button style={{flex:1,padding:"11px",borderRadius:12,border:"none",background:color,color:"white",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FF}}>💉 오늘 기록</button>
        <button style={{padding:"11px 12px",borderRadius:12,border:"none",background:"#FFE8E8",color:"#FF6B6B",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FF}}>🗑</button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div style={{fontFamily:FF,background:"#F0F3F8",minHeight:"100vh",padding:16}}>
      <div style={{fontSize:15,fontWeight:900,color:"#1A1E2E",marginBottom:16,textAlign:"center"}}>메인 카드 레이아웃 선택</div>
      {[["A", OptionA],["B", OptionB],["C", OptionC],["D", OptionD]].map(([label, Comp])=>(
        <div key={label} style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:800,color:"#9AA5B4",marginBottom:6}}>{label}형</div>
          <Comp/>
        </div>
      ))}
    </div>
  );
}
