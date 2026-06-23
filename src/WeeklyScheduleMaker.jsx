import { useState, useEffect } from "react";
import { DAYS_JA, DAYS_EN, getMonday, fmtDate, isDk, emptySchedule, snapToMondayStr, parseTemplateJson, exportFilename } from "./lib/schedule.js";

const F="'Zen Maru Gothic','Hiragino Kaku Gothic Pro','Yu Gothic',sans-serif";
const MO="'Courier New','Consolas',monospace";

// SVG string builder helpers (module scope)
const cir=(x,y,r,c,o)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/>`;
const lin=(x1,y1,x2,y2,c,w,o)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" opacity="${o}"/>`;
const rcf=(x,y,w,h,c,o,rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}" opacity="${o}"/>`;
const rcs=(x,y,w,h,c,sw,o,rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="${c}" stroke-width="${sw}" opacity="${o}"/>`;
const star4=(x,y,s,c,o)=>`<path d="M${x},${y-s}L${x+s*.22},${y-s*.3}L${x+s},${y}L${x+s*.22},${y+s*.3}L${x},${y+s}L${x-s*.22},${y+s*.3}L${x-s},${y}L${x-s*.22},${y-s*.3}Z" fill="${c}" opacity="${o}"/>`;
const mo=a=>a.join("");

const THEMES=[
  // ── ライトテーマ (10) ──
  {id:"aqua",name:"アクアポップ",primary:"#7DD3FC",secondary:"#BAE6FD",accent:"#0EA5E9",bg:"#E0F2FE",text:"#0C4A6E",card:"rgba(255,255,255,0.75)",spark:"#F59E0B"},
  {id:"sakura",name:"桜ピンク",primary:"#F9A8D4",secondary:"#FBCFE8",accent:"#EC4899",bg:"#FDF2F8",text:"#831843",card:"rgba(255,255,255,0.75)",spark:"#A78BFA"},
  {id:"sunset",name:"サンセット",primary:"#FDBA74",secondary:"#FED7AA",accent:"#F97316",bg:"#FFF7ED",text:"#7C2D12",card:"rgba(255,255,255,0.75)",spark:"#EF4444"},
  {id:"mint",name:"ミントグリーン",primary:"#6EE7B7",secondary:"#A7F3D0",accent:"#10B981",bg:"#ECFDF5",text:"#064E3B",card:"rgba(255,255,255,0.75)",spark:"#F472B6"},
  {id:"lavender",name:"ラベンダー",primary:"#C4B5FD",secondary:"#DDD6FE",accent:"#8B5CF6",bg:"#F5F3FF",text:"#3B0764",card:"rgba(255,255,255,0.75)",spark:"#F9A8D4"},
  {id:"coral",name:"コーラル",primary:"#FDA4AF",secondary:"#FFE4E6",accent:"#F43F5E",bg:"#FFF1F2",text:"#881337",card:"rgba(255,255,255,0.75)",spark:"#2DD4BF"},
  {id:"lemon",name:"レモン",primary:"#FDE047",secondary:"#FEF9C3",accent:"#CA8A04",bg:"#FEFCE8",text:"#713F12",card:"rgba(255,255,255,0.75)",spark:"#34D399"},
  {id:"ocean",name:"オーシャン",primary:"#67E8F9",secondary:"#CFFAFE",accent:"#0891B2",bg:"#ECFEFF",text:"#164E63",card:"rgba(255,255,255,0.75)",spark:"#C084FC"},
  {id:"rosegold",name:"ローズゴールド",primary:"#E8B4B8",secondary:"#F5E6E8",accent:"#C07882",bg:"#FBF0F2",text:"#6B3A3F",card:"rgba(255,255,255,0.78)",spark:"#D4A574"},
  {id:"mono",name:"モノクロ",primary:"#94A3B8",secondary:"#E2E8F0",accent:"#475569",bg:"#F8FAFC",text:"#1E293B",card:"rgba(255,255,255,0.8)",spark:"#64748B"},
  // ── ダークテーマ (6) ──
  {id:"midnight",name:"ミッドナイト",primary:"#60A5FA",secondary:"#1E3A5F",accent:"#3B82F6",bg:"#0F172A",text:"#E2E8F0",card:"rgba(30,58,95,0.8)",spark:"#FBBF24"},
  {id:"neon",name:"ネオンシティ",primary:"#E879F9",secondary:"#2D1B4E",accent:"#A855F7",bg:"#1A0B2E",text:"#F0ABFC",card:"rgba(45,27,78,0.8)",spark:"#22D3EE"},
  {id:"retro",name:"レトロゲーム",primary:"#4ADE80",secondary:"#1A2E1A",accent:"#22C55E",bg:"#0A1A0A",text:"#86EFAC",card:"rgba(26,46,26,0.85)",spark:"#FACC15"},
  {id:"bloodmoon",name:"ブラッドムーン",primary:"#F87171",secondary:"#3B1111",accent:"#DC2626",bg:"#1C0606",text:"#FCA5A5",card:"rgba(59,17,17,0.85)",spark:"#FB923C"},
  {id:"forest",name:"ダークフォレスト",primary:"#4ADE80",secondary:"#14332A",accent:"#059669",bg:"#071A12",text:"#A7F3D0",card:"rgba(20,51,42,0.82)",spark:"#FDE68A"},
  {id:"deepblue",name:"ディープブルー",primary:"#818CF8",secondary:"#1E1B4B",accent:"#6366F1",bg:"#0F0E2A",text:"#C7D2FE",card:"rgba(30,27,75,0.82)",spark:"#FB7185"},
];

const DESIGNS=[
  {id:"kawaii",name:"かわいい",desc:"ふわふわキラキラ ✨"},
  {id:"clean",name:"クリーン",desc:"ミニマル＆モダン"},
  {id:"pop",name:"ポップ",desc:"カラフル＆元気"},
  {id:"streamer",name:"ストリーマー",desc:"左モデル＋右スケジュール"},
  {id:"pixel",name:"ピクセル",desc:"レトロゲーム風 CRT"},
  {id:"elegant",name:"エレガント",desc:"上品＆洗練"},
  {id:"comic",name:"コミック",desc:"マンガ風ダイナミック"},
  {id:"wamodern",name:"和モダン",desc:"和柄×モダン"},
  {id:"cyber",name:"サイバー",desc:"デジタル＆グリッチ"},
  {id:"pastel",name:"パステル",desc:"ゆめかわ＆ソフト"},
  {id:"galaxy",name:"ギャラクシー",desc:"宇宙＆星空ファンタジー"},
  {id:"grunge",name:"グランジ",desc:"ストリート＆ダーク"},
];

// getMonday / fmtDate / isDk は ./lib/schedule.js から import（純粋ロジック層に集約）

/* ════════════════════════════════════════
   PREVIEW COMPONENTS (12 designs) - LUXURIOUS backgrounds
   ════════════════════════════════════════ */

function PreviewKawaii({t,sch,range,title,dk,img}){
  const c1="#FF69B4",c2="#B19CD9",c3="#FFD700",c4="#7FDBCA";
  return(<svg viewBox="0 0 1280 720" style={{width:"100%",borderRadius:8}}>
    <defs>
      <linearGradient id="kbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={t.bg}/><stop offset="100%" stopColor={t.secondary}/></linearGradient>
      <radialGradient id="kgl1" cx="20%" cy="80%"><stop offset="0%" stopColor={t.primary} stopOpacity="0.60"/><stop offset="100%" stopColor={t.primary} stopOpacity="0"/></radialGradient>
      <radialGradient id="kgl2" cx="80%" cy="20%"><stop offset="0%" stopColor={t.accent} stopOpacity="0.45"/><stop offset="100%" stopColor={t.accent} stopOpacity="0"/></radialGradient>
      <radialGradient id="kgl3" cx="50%" cy="50%"><stop offset="0%" stopColor={t.spark} stopOpacity="0.36"/><stop offset="100%" stopColor={t.spark} stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#kbg)"/><rect width="1280" height="720" fill="url(#kgl1)"/><rect width="1280" height="720" fill="url(#kgl2)"/><rect width="1280" height="720" fill="url(#kgl3)"/>
    {/* candy stripes */}
    {[...Array(18)].map((_,i)=><rect key={`ks${i}`} x={-200+i*110} y="-50" width="55" height="900" fill={i%2===0?t.primary:t.accent} opacity={0.09} transform="rotate(-25,640,360)"/>)}
    {/* diagonal stripes */}
    {[...Array(22)].map((_,i)=><line key={i} x1={-100+i*90} y1="0" x2={-100+i*90+400} y2="720" stroke={t.primary} strokeWidth="35" opacity="0.14"/>)}
    {/* large clouds */}
    {[[80,600,70],[300,650,55],[550,620,65],[750,660,45],[180,60,40],[500,40,50],[700,70,35]].map(([cx,cy,r],i)=>
      <g key={`cl${i}`} opacity={0.30+i*0.01}><ellipse cx={cx} cy={cy} rx={r*1.8} ry={r*.7} fill={dk?t.secondary:i%3===0?c1:i%3===1?c2:"white"}/><ellipse cx={cx-r*.6} cy={cy-r*.25} rx={r} ry={r*.55} fill={dk?t.secondary:"white"}/><ellipse cx={cx+r*.7} cy={cy-r*.2} rx={r*.85} ry={r*.5} fill={dk?t.secondary:"white"}/></g>
    )}
    {/* rainbow arcs */}
    <path d="M-80,720 A350,230 0 0,1 380,720" fill="none" stroke={c1} strokeWidth="18" opacity="0.18"/>
    <path d="M-50,720 A320,200 0 0,1 360,720" fill="none" stroke={c2} strokeWidth="12" opacity="0.16"/>
    <path d="M-20,720 A290,170 0 0,1 340,720" fill="none" stroke={c3} strokeWidth="8" opacity="0.15"/>
    {/* scattered candy */}
    {[[120,80],[630,690],[340,40],[700,100],[60,400],[580,30],[200,650]].map(([x,y],i)=>
      <g key={`lo${i}`} opacity={0.38+i*0.01}><circle cx={x} cy={y} r={7+i%3} fill={i%2===0?t.accent:t.spark}/><line x1={x} y1={y+7+i%3} x2={x} y2={y+20+i%3} stroke={t.primary} strokeWidth="2"/></g>
    )}
    {/* large sparkle bursts across background */}
    {[[250,200,18],[500,500,14],[150,450,12],[650,150,10],[400,350,16],[50,550,10],[700,400,8]].map(([x,y,s],i)=>
      <path key={`sb${i}`} d={`M${x},${y-s}L${x+s*.25},${y-s*.3}L${x+s},${y}L${x+s*.25},${y+s*.3}L${x},${y+s}L${x-s*.25},${y+s*.3}L${x-s},${y}L${x-s*.25},${y-s*.3}Z`} fill={i%4===0?c1:i%4===1?c2:i%4===2?c3:c4} opacity={0.25+i*0.015}/>
    )}
    <rect x="12" y="12" width="1256" height="696" rx="16" fill="none" stroke={dk?t.primary:"white"} strokeWidth="2.5" opacity="0.25" strokeDasharray="10,5"/>
    {sch.map((it,i)=>{const y=46+i*90;return(
      <g key={i}>
        <rect x="30" y={y} width="760" height="78" rx="16" fill={t.card} stroke={t.accent} strokeWidth="2" strokeOpacity="0.4"/>
        <circle cx="70" cy={y+39} r="27" fill={t.primary} opacity="0.85"/>
        <text x="70" y={y+45} textAnchor="middle" fill={dk?t.bg:"white"} fontSize="22" fontWeight="900" fontFamily={F}>{it.date}</text>
        <text x="112" y={y+18} fill={t.accent} fontSize="10" fontWeight="700" fontFamily={F} opacity="0.55">{DAYS_EN[i]}</text>
        <text x="112" y={y+52} fill={t.text} fontSize="17" fontWeight="700" fontFamily={F}>{it.text||""}</text>
        {it.time&&<><rect x="630" y={y+22} width="140" height="34" rx="17" fill={t.primary} opacity="0.18"/><text x="700" y={y+44} textAnchor="middle" fill={t.accent} fontSize="14" fontWeight="700" fontFamily={F}>{it.time}</text></>}
      </g>);})}
    {/* right panel */}
    <rect x="820" y="40" width="420" height="640" rx="28" fill={dk?t.secondary:"white"} opacity="0.35" stroke={t.primary} strokeWidth="2" strokeOpacity="0.4"/>
    {/* layered circles */}
    {[[880,120,55],[990,210,75],[1110,330,60],[950,450,50],[1070,540,40],[870,350,35],[1170,160,30],[1000,600,45]].map(([cx,cy,r],i)=>
      <circle key={`c${i}`} cx={cx} cy={cy} r={r} fill={i%3===0?t.primary:i%3===1?t.accent:t.spark} opacity={0.18+i*0.006}/>
    )}
    {/* sparkles */}
    {[[870,90,9],[1180,140,7],[900,460,8],[1160,560,6],[1050,100,7],[880,350,8],[1190,420,6],[960,620,7],[1120,280,5],[850,200,6],[1200,490,5],[990,380,7]].map(([x,y,s],i)=>
      <path key={`s${i}`} d={`M${x},${y-s}L${x+s*.22},${y-s*.3}L${x+s},${y}L${x+s*.22},${y+s*.3}L${x},${y+s}L${x-s*.22},${y+s*.3}L${x-s},${y}L${x-s*.22},${y-s*.3}Z`} fill={t.spark} opacity={0.40+(i%3)*0.08}/>
    )}
    {/* hearts */}
    {[[885,105,.8],[1175,155,.6],[905,455,.7],[1140,350,.5],[1000,520,.6],[870,280,.4]].map(([x,y,sc],i)=>
      <path key={`h${i}`} d={`M${x},${y+10*sc}C${x},${y+10*sc} ${x-14*sc},${y-6*sc} ${x-14*sc},${y-14*sc}C${x-14*sc},${y-22*sc} ${x-7*sc},${y-26*sc} ${x},${y-18*sc}C${x+7*sc},${y-26*sc} ${x+14*sc},${y-22*sc} ${x+14*sc},${y-14*sc}C${x+14*sc},${y-6*sc} ${x},${y+10*sc} ${x},${y+10*sc}Z`} fill={t.accent} opacity={0.30+i*0.01}/>
    )}
    {/* ribbon bows */}
    {[[920,80,1],[1170,500,.8],[1080,130,.6],[870,550,.7]].map(([x,y,s],i)=>
      <g key={`bw${i}`} transform={`translate(${x},${y}) scale(${s})`} opacity={0.38+i*0.02}><ellipse cx="-12" cy="0" rx="12" ry="8" fill={t.accent}/><ellipse cx="12" cy="0" rx="12" ry="8" fill={t.accent}/><circle cx="0" cy="0" r="5" fill={t.accent}/><path d="M0,5L-4,20L4,20Z" fill={t.accent}/></g>
    )}
    {/* music notes */}
    {[[1150,240],[870,580],[1020,440],[940,160]].map(([x,y],i)=>
      <g key={`nt${i}`} opacity={0.30+i*0.02}><circle cx={x} cy={y} r="5" fill={t.spark}/><line x1={x+5} y1={y} x2={x+5} y2={y-20} stroke={t.spark} strokeWidth="2"/><path d={`M${x+5},${y-20}Q${x+14},${y-24} ${x+12},${y-16}`} fill={t.spark}/></g>
    )}
    {/* crown */}
    <path d="M1000,280L1012,255L1025,275L1038,250L1050,275L1062,255L1075,280Z" fill="none" stroke={t.accent} strokeWidth="2" opacity="0.4"/>
    {/* wand star */}
    <line x1="1100" y1="420" x2="1100" y2="475" stroke={t.primary} strokeWidth="2" opacity="0.3"/>
    <path d="M1100,420L1104,410L1112,414L1106,406L1110,396L1100,402L1090,396L1094,406L1088,414L1096,410Z" fill={t.spark} opacity="0.4"/>
    <circle cx="1030" cy="350" r="100" fill="none" stroke={t.accent} strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="5,4"/>
    <text x="1030" y="658" textAnchor="middle" fill={t.accent} fontSize="11" fontFamily={F} opacity="0.4">▲ モデル配置エリア</text>
    <text x="30" y="706" fill={t.accent} fontSize="13" fontFamily={F} opacity="0.25">✨ {range}</text>
    {img&&<image href={img} x="835" y="55" width="395" height="610" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>}
  </svg>);
}

function PreviewClean({t,sch,range,title,dk,img}){
  const c1="#4682B4",c2="#708090",c3="#2F4F4F",c4="#B8860B";
  return(<svg viewBox="0 0 1280 720" style={{width:"100%",borderRadius:8}}>
    <defs>
      <linearGradient id="clbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={t.bg}/><stop offset="100%" stopColor={dk?t.bg:t.secondary} stopOpacity="0.45"/></linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#clbg)"/>
    {/* crosshatch */}
    {[...Array(25)].map((_,i)=><line key={`ch1_${i}`} x1={-100+i*72} y1="0" x2={-100+i*72+400} y2="720" stroke={t.primary} strokeWidth="0.8" opacity={0.07}/>)}
    {[...Array(25)].map((_,i)=><line key={`ch2_${i}`} x1={1380-i*72} y1="0" x2={1380-i*72-400} y2="720" stroke={t.primary} strokeWidth="0.8" opacity={0.06}/>)}
    {/* dot grid */}
    {[...Array(20)].map((_,i)=>[...Array(10)].map((_,j)=>
      <circle key={`d${i}_${j}`} cx={35+i*66} cy={35+j*72} r="1.3" fill={t.primary} opacity="0.3"/>
    ))}
    {/* accent bar */}
    <rect x="0" y="0" width="7" height="720" fill={t.accent}/>
    <rect x="7" y="0" width="2" height="720" fill={c2} opacity="0.3"/>
    <rect x="10" y="0" width="1" height="720" fill={t.accent} opacity="0.21"/>
    {/* large geometric shapes background */}
    <rect x="600" y="580" width="90" height="90" rx="3" fill="none" stroke={t.primary} strokeWidth="1.5" opacity="0.21" transform="rotate(20,645,625)"/>
    <rect x="650" y="610" width="50" height="50" rx="2" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.14" transform="rotate(-10,675,635)"/>
    <circle cx="720" cy="45" r="25" fill="none" stroke={t.primary} strokeWidth="1.5" opacity="0.21"/>
    <circle cx="720" cy="45" r="15" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.14"/>
    <polygon points="100,660 130,610 160,660" fill="none" stroke={c4} strokeWidth="1.2" opacity="0.15"/>
    <polygon points="350,680 370,650 390,680" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.14"/>
    {/* horizontal rule lines */}
    <line x1="100" y1="698" x2="350" y2="698" stroke={t.accent} strokeWidth="0.6" opacity="0.24"/>
    <line x1="400" y1="705" x2="700" y2="705" stroke={t.primary} strokeWidth="0.4" opacity="0.18"/>
    <text x="40" y="62" fill={t.text} fontSize="30" fontWeight="900" fontFamily={F} letterSpacing="2">{title||"WEEKLY SCHEDULE"}</text>
    <text x="40" y="88" fill={t.accent} fontSize="15" fontWeight="700" fontFamily={F}>{range}</text>
    <line x1="40" y1="102" x2="780" y2="102" stroke={t.primary} strokeWidth="1.5" opacity="0.4"/>
    {sch.map((it,i)=>{const y=116+i*82;const w=i>=5;return(
      <g key={i}>
        <rect x="40" y={y} width="740" height="72" rx="8" fill={w?t.primary:t.card} opacity={w?.08:1} stroke={t.accent} strokeWidth="2" strokeOpacity="0.35"/>
        <rect x="40" y={y} width="100" height="72" rx="8" fill={t.accent} opacity={w?.12:.06}/>
        <text x="90" y={y+28} textAnchor="middle" fill={t.accent} fontSize="10" fontWeight="700" fontFamily={F}>{DAYS_EN[i]}</text>
        <text x="90" y={y+52} textAnchor="middle" fill={t.text} fontSize="20" fontWeight="900" fontFamily={F}>{it.date}</text>
        <text x="160" y={y+45} fill={t.text} fontSize="16" fontWeight="700" fontFamily={F}>{it.text||""}</text>
        {it.time&&<text x="750" y={y+45} textAnchor="end" fill={t.accent} fontSize="14" fontWeight="700" fontFamily={F}>{it.time}</text>}
      </g>);})}
    <line x1="810" y1="0" x2="810" y2="720" stroke={t.primary} strokeWidth="1" opacity="0.3"/>
    {/* concentric circles */}
    <circle cx="1040" cy="300" r="220" fill="none" stroke={c1} strokeWidth="0.8" opacity="0.15"/>
    <circle cx="1040" cy="300" r="180" fill="none" stroke={c4} strokeWidth="1.5" opacity="0.2"/>
    <circle cx="1040" cy="300" r="140" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.21"/>
    <circle cx="1040" cy="300" r="100" fill={t.primary} opacity="0.07"/>
    <circle cx="1040" cy="300" r="60" fill={t.primary} opacity="0.07"/>
    <line x1="820" y1="300" x2="1260" y2="300" stroke={t.primary} strokeWidth="0.5" opacity="0.21"/>
    <line x1="1040" y1="80" x2="1040" y2="520" stroke={t.primary} strokeWidth="0.5" opacity="0.21"/>
    {/* plus signs */}
    {[[880,130],[1180,450],[900,540],[1160,110],[950,80],[1120,560],[840,400]].map(([x,y],i)=>
      <g key={`p${i}`} opacity={0.24+i*0.008}><line x1={x-7} y1={y} x2={x+7} y2={y} stroke={t.accent} strokeWidth="1.5"/><line x1={x} y1={y-7} x2={x} y2={y+7} stroke={t.accent} strokeWidth="1.5"/></g>
    )}
    {/* triangles */}
    <polygon points="950,520 975,480 1000,520" fill="none" stroke={t.primary} strokeWidth="1.2" opacity="0.21"/>
    <polygon points="1120,160 1145,125 1170,160" fill="none" stroke={t.accent} strokeWidth="1.2" opacity="0.21"/>
    <polygon points="870,250 890,220 910,250" fill="none" stroke={t.primary} strokeWidth="1" opacity="0.18"/>
    {/* thin horizontal lines */}
    {[560,580,600,620,640].map(y=><line key={y} x1="860" y1={y} x2="1220" y2={y} stroke={t.primary} strokeWidth="0.5" opacity="0.14"/>)}
    {[0,1,2,3,4].map(i=><circle key={i} cx={870+i*95} cy="660" r={3.5-i*0.4} fill={t.accent} opacity={0.2-i*0.03}/>)}
    <text x="1040" y="670" textAnchor="middle" fill={t.accent} fontSize="11" fontFamily={F} opacity="0.15">model area</text>
    {img&&<image href={img} x="835" y="55" width="410" height="610" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>}
  </svg>);
}

function PreviewPop({t,sch,range,title,dk,img}){
  const c1="#FF1493",c2="#FFD700",c3="#00C853",c4="#9B59B6";
  return(<svg viewBox="0 0 1280 720" style={{width:"100%",borderRadius:8}}>
    <defs>
      <radialGradient id="ppgl" cx="30%" cy="70%"><stop offset="0%" stopColor={t.primary} stopOpacity="0.45"/><stop offset="100%" stopColor={t.primary} stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1280" height="720" fill={t.bg}/><rect width="1280" height="720" fill="url(#ppgl)"/>
    {/* bold diagonal stripes */}
    {[...Array(14)].map((_,i)=><rect key={`ps${i}`} x={-300+i*140} y="-100" width="70" height="1000" fill={i%3===0?t.primary:i%3===1?t.accent:t.spark} opacity={i%3===0?0.10:0.07} transform="rotate(-30,640,360)"/>)}
    {/* radial burst from center-bottom */}
    <circle cx="400" cy="800" r="600" fill="none" stroke={t.accent} strokeWidth="80" opacity={0.06}/>
    <circle cx="400" cy="800" r="450" fill="none" stroke={t.primary} strokeWidth="50" opacity={0.03}/>
    {/* zigzag top+bottom */}
    <path d="M0,0 L60,35 L120,0 L180,35 L240,0 L300,35 L360,0 L420,35 L480,0 L540,35 L600,0 L660,35 L720,0 L780,35 L840,0 L900,35 L960,0 L1020,35 L1080,0 L1140,35 L1200,0 L1260,35 L1280,25 L1280,0Z" fill={t.primary} opacity="0.24"/>
    <path d="M0,720 L60,685 L120,720 L180,685 L240,720 L300,685 L360,720 L420,685 L480,720 L540,685 L600,720 L660,685 L720,720 L780,685 L840,720 L900,685 L960,720 L1020,685 L1080,720 L1140,685 L1200,720 L1260,685 L1280,695 L1280,720Z" fill={t.primary} opacity="0.21"/>
    {/* wave */}
    <path d="M0,620 Q160,550 320,620 Q480,690 640,620 Q800,550 960,620 Q1120,690 1280,620 L1280,720 L0,720Z" fill={t.primary} opacity="0.18"/>
    {/* confetti dots */}
    {[[50,200,7],[150,580,9],[300,100,6],[650,680,8],[400,40,7],[730,600,5],[250,400,6],[550,150,8],[100,350,5],[480,620,7],[680,50,6],[360,280,5],[600,400,4],[180,120,6]].map(([x,y,r],i)=>
      <circle key={`cf${i}`} cx={x} cy={y} r={r} fill={i%4===0?c1:i%4===1?c2:i%4===2?c3:c4} opacity={0.30+i*0.006}/>
    )}
    {/* burst stars */}
    {[[200,300,14],[500,650,12],[700,80,10],[400,500,8],[120,600,11]].map(([x,y,s],i)=>
      <polygon key={`bs${i}`} points={`${x},${y-s} ${x+s*.25},${y-s*.35} ${x+s},${y-s*.1} ${x+s*.4},${y+s*.2} ${x+s*.6},${y+s} ${x},${y+s*.55} ${x-s*.6},${y+s} ${x-s*.4},${y+s*.2} ${x-s},${y-s*.1} ${x-s*.25},${y-s*.35}`} fill={i%4===0?c1:i%4===1?c2:i%4===2?c3:c4} opacity={0.2+i*0.01}/>
    )}
    {/* exclamation marks */}
    {[[120,450],[620,40],[50,100],[720,520]].map(([x,y],i)=>
      <g key={`ex${i}`} opacity={0.30+i*0.02}><rect x={x-2.5} y={y} width="5" height="18" rx="2.5" fill={t.accent}/><circle cx={x} cy={y+24} r="3" fill={t.accent}/></g>
    )}
    <text x="45" y="64" fill={t.accent} fontSize="36" fontWeight="900" fontFamily={F} letterSpacing="-1">{title||"WEEKLY"}</text>
    <text x="45" y="92" fill={t.text} fontSize="16" fontWeight="700" fontFamily={F} opacity="0.45">{range}</text>
    <rect x="45" y="100" width="60" height="4" rx="2" fill={c1} opacity="0.25"/>
    {sch.map((it,i)=>{const y=118+i*82;return(
      <g key={i}>
        <rect x="35" y={y} width="750" height="72" rx="6" fill={t.card} stroke={t.accent} strokeWidth="2.5" strokeOpacity="0.35"/>
        <rect x="35" y={y} width="95" height="72" rx="6" fill={t.accent} opacity="0.24"/>
        <text x="82" y={y+28} textAnchor="middle" fill={t.accent} fontSize="11" fontWeight="900" fontFamily={F}>{DAYS_EN[i]}</text>
        <text x="82" y={y+54} textAnchor="middle" fill={t.text} fontSize="22" fontWeight="900" fontFamily={F}>{it.date}</text>
        <text x="148" y={y+46} fill={t.text} fontSize="16" fontWeight="700" fontFamily={F}>{it.text||""}</text>
        {it.time&&<><rect x="640" y={y+20} width="125" height="32" rx="16" fill={t.primary} opacity="0.12"/><text x="702" y={y+42} textAnchor="middle" fill={t.accent} fontSize="14" fontWeight="700" fontFamily={F}>{it.time}</text></>}
      </g>);})}
    {/* right panel */}
    <rect x="820" y="30" width="430" height="660" fill={t.primary} opacity="0.14"/>
    <rect x="820" y="30" width="430" height="660" fill="none" stroke={t.accent} strokeWidth="3" strokeOpacity="0.3"/>
    {/* big burst star */}
    <polygon points="1030,200 1042,165 1060,188 1088,175 1070,200 1092,218 1065,218 1052,248 1040,218 1010,218 1028,200 1008,182" fill={t.accent} opacity="0.24"/>
    {/* zigzag bands */}
    <polyline points="860,310 895,285 930,310 965,285 1000,310 1035,285 1070,310 1105,285 1140,310 1175,285 1210,310" fill="none" stroke={t.accent} strokeWidth="2.5" opacity="0.24"/>
    <polyline points="860,330 895,305 930,330 965,305 1000,330 1035,305 1070,330 1105,305 1140,330 1175,305 1210,330" fill="none" stroke={t.primary} strokeWidth="1.5" opacity="0.18"/>
    {/* explosion outline */}
    <path d="M920,450L940,415L952,445L980,422L972,458L1005,445L992,475L1015,480L992,498L1010,520L978,508L968,530L950,505L928,520L935,495L908,500L925,478L902,462Z" fill="none" stroke={t.accent} strokeWidth="2.5" opacity="0.24"/>
    {/* lightning bolt */}
    <path d="M1140,90L1118,148L1148,142L1122,210" fill="none" stroke={t.accent} strokeWidth="3" opacity="0.3"/>
    {/* scattered shapes */}
    {[[870,80,22],[1180,110,18],[860,570,16],[1190,600,14],[950,550,12],[1120,80,10]].map(([x,y,r],i)=>
      <circle key={i} cx={x} cy={y} r={r} fill={i%2===0?t.accent:t.primary} opacity={0.30+i*0.01}/>
    )}
    <polygon points="880,100 925,100 902,65" fill={c1} opacity="0.25"/>
    <rect x="1155" y="488" width="40" height="40" fill={t.primary} opacity="0.24" transform="rotate(15,1175,508)"/>
    <polygon points="1180,380 1200,360 1220,380" fill="none" stroke={t.spark} strokeWidth="2" opacity="0.24"/>
    {/* confetti in right panel */}
    {[...Array(16)].map((_,i)=><circle key={`d${i}`} cx={840+((i*43+20)%400)} cy={50+((i*59+30)%620)} r={3+i%3} fill={i%4===0?c1:i%4===1?c2:i%4===2?c3:c4} opacity={0.30+i*0.005}/>)}
    {img&&<image href={img} x="835" y="45" width="400" height="625" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>}
  </svg>);
}

function PreviewStreamer({t,sch,range,title,dk,img}){
  const c1="#00BCD4",c2="#E91E63",c3="#7C4DFF",c4="#FF9800";
  return(<svg viewBox="0 0 1280 720" style={{width:"100%",borderRadius:8}}>
    <defs>
      <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={t.bg}/><stop offset="50%" stopColor={dk?t.bg:t.secondary}/><stop offset="100%" stopColor={t.bg}/></linearGradient>
      <radialGradient id="sggl" cx="20%" cy="40%"><stop offset="0%" stopColor={t.accent} stopOpacity="0.36"/><stop offset="100%" stopColor={t.accent} stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#sg)"/><rect width="1280" height="720" fill="url(#sggl)"/>
    {/* horizontal glow bands */}
    {[...Array(8)].map((_,i)=><rect key={`hb${i}`} x="0" y={i*95} width="1280" height="48" fill={i%2===0?t.primary:t.accent} opacity={0.06+i*0.007} rx="4"/>)}
    {/* corner glow */}
    <circle cx="0" cy="0" r="350" fill={t.accent} opacity={0.06}/>
    <circle cx="1280" cy="720" r="400" fill={t.primary} opacity={0.055}/>
    {/* tech grid */}
    {[...Array(14)].map((_,i)=><line key={`v${i}`} x1={i*100} y1="0" x2={i*100} y2="720" stroke={t.primary} strokeWidth="0.5" opacity="0.18"/>)}
    {[...Array(8)].map((_,i)=><line key={`h${i}`} x1="0" y1={i*100} x2="1280" y2={i*100} stroke={t.primary} strokeWidth="0.5" opacity="0.18"/>)}
    {/* diagonal tech lines */}
    {[[0,0,430,720],[430,0,0,300],[1280,0,850,720],[850,720,1280,300]].map(([x1,y1,x2,y2],i)=>
      <line key={`tl${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={t.accent} strokeWidth="1" opacity="0.14"/>
    )}
    {/* hexagonal accents */}
    {[[620,650,18],[700,100,14],[50,350,16],[750,400,12]].map(([cx,cy,s],i)=>{
      const pts=Array.from({length:6},(_,j)=>{const a=j*60*Math.PI/180;return `${cx+s*Math.cos(a)},${cy+s*Math.sin(a)}`;}).join(" ");
      return <polygon key={`hx${i}`} points={pts} fill="none" stroke={i%2===0?c1:c2} strokeWidth="1.5" opacity={0.18+i*0.01}/>;
    })}
    {/* play btn + signal bars */}
    <polygon points="750,660 750,695 775,677" fill={t.accent} opacity="0.21"/>
    {[0,1,2,3].map(i=><rect key={`sig${i}`} x={700+i*9} y={628-i*10} width="6" height={14+i*10} rx="1" fill={i%3===0?c1:i%3===1?c2:c4} opacity={0.15+i*0.01}/>)}
    {/* chat bubbles */}
    <rect x="70" y="575" width="55" height="34" rx="10" fill={t.accent} opacity="0.21"/><path d="M88,609L82,622L100,609" fill={t.accent} opacity="0.21"/>
    <rect x="280" y="95" width="48" height="28" rx="8" fill={t.primary} opacity="0.14"/><path d="M318,123L324,134L312,123" fill={t.primary} opacity="0.14"/>
    <rect x="450" y="680" width="42" height="25" rx="7" fill={c4} opacity="0.18"/>
    {/* LIVE badge */}
    <rect x="155" y="618" width="50" height="20" rx="5" fill={t.accent} opacity="0.21"/>
    <circle cx="167" cy="628" r="3.5" fill="#ef4444" opacity="0.3"/>
    {/* model area */}
    <rect x="40" y="40" width="380" height="640" rx="16" fill={dk?t.secondary:"white"} opacity="0.25" stroke={t.accent} strokeWidth="2" strokeOpacity="0.38"/>
    {[...Array(6)].map((_,i)=><line key={`lg${i}`} x1="40" y1={40+i*128} x2="420" y2={40+i*128} stroke={t.primary} strokeWidth="0.5" opacity="0.21"/>)}
    <circle cx="230" cy="360" r="60" fill="none" stroke={t.accent} strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="4,4"/>
    <text x="230" y="365" textAnchor="middle" fill={t.accent} fontSize="11" fontFamily={F} opacity="0.15">MODEL</text>
    {img&&<image href={img} x="45" y="45" width="370" height="630" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>}
    <rect x="460" y="25" width="790" height="62" rx="12" fill={t.accent} opacity={dk?.2:.1}/>
    <text x="510" y="64" fill={dk?t.primary:t.accent} fontSize="32" fontWeight="900" fontFamily={F}>{title||"配信スケジュール"}</text>
    <rect x="1060" y="36" width="170" height="36" rx="18" fill={c2} opacity="0.25"/>
    <text x="1145" y="60" textAnchor="middle" fill={dk?t.primary:t.accent} fontSize="16" fontWeight="700" fontFamily={F}>{range}</text>
    {sch.map((it,i)=>{const y=103+i*85;const live=it.text&&it.text.length>0;return(
      <g key={i}>
        <rect x="460" y={y} width="790" height="74" rx="10" fill={t.card} stroke={t.accent} strokeWidth="2" strokeOpacity={live?0.45:0.2}/>
        <rect x="470" y={y+10} width="80" height="54" rx="8" fill={t.accent} opacity={live?.15:.05}/>
        <text x="510" y={y+30} textAnchor="middle" fill={t.accent} fontSize="10" fontWeight="700" fontFamily={F}>{DAYS_JA[i]}</text>
        <text x="510" y={y+52} textAnchor="middle" fill={t.text} fontSize="20" fontWeight="900" fontFamily={F}>{it.date}</text>
        {live&&<circle cx="570" cy={y+37} r="4" fill="#EF4444" opacity="0.75"/>}
        <text x="586" y={y+44} fill={t.text} fontSize="16" fontWeight="700" fontFamily={F}>{it.text||""}</text>
        {it.time&&<><rect x="1100" y={y+18} width="130" height="38" rx="19" fill={t.accent} opacity="0.1"/><text x="1165" y={y+43} textAnchor="middle" fill={t.accent} fontSize="15" fontWeight="700" fontFamily={F}>{it.time}</text></>}
      </g>);})}
  </svg>);
}

function PreviewPixel({t,sch,range,title,dk,img}){
  const c1="#FFD700",c2="#FF4444",c3="#44FF44",c4="#4488FF";
  return(<svg viewBox="0 0 1280 720" style={{width:"100%",borderRadius:4}}>
    <rect width="1280" height="720" fill={t.bg}/>
    {/* checkerboard */}
    {[...Array(18)].map((_,i)=>[...Array(10)].map((_,j)=>(i+j)%2===0?<rect key={`cb${i}_${j}`} x={i*72} y={j*72} width="72" height="72" fill={t.primary} opacity={0.06}/>:null))}
    {/* CRT vignette */}
    {/* scanlines */}
    {[...Array(180)].map((_,i)=><line key={`sl${i}`} x1="0" y1={i*4} x2="1280" y2={i*4} stroke={t.primary} strokeWidth="1" opacity="0.09"/>)}
    {/* double border */}
    <rect x="4" y="4" width="1272" height="712" fill="none" stroke={t.accent} strokeWidth="4"/>
    <rect x="10" y="10" width="1260" height="700" fill="none" stroke={t.primary} strokeWidth="1" opacity="0.38"/>
    {/* corner pixels */}
    {[0,1,2,3].map(i=>{const x=i<2?18:1246,y=i%2===0?18:686;return <g key={`cp${i}`}><rect x={x} y={y} width="8" height="8" fill={i%4===0?c1:i%4===1?c2:i%4===2?c3:c4} opacity="0.3"/><rect x={x+10} y={y} width="4" height="4" fill={t.accent} opacity="0.3"/><rect x={x} y={y+(i%2===0?10:-6)} width="4" height="4" fill={t.accent} opacity="0.3"/></g>;})}
    {/* pixel coins */}
    {[[700,650],[340,690],[580,20]].map(([bx,by],ci)=>
      <g key={`co${ci}`} opacity="0.3">{[[0,0],[4,0],[8,0],[12,0],[0,4],[12,4],[0,8],[4,8],[8,8],[12,8]].map(([dx,dy],i)=>
        <rect key={i} x={bx+dx} y={by+dy} width="4" height="4" fill={t.accent}/>)}</g>
    )}
    {/* pixel hearts */}
    {[[140,680],[400,30]].map(([bx,by],hi)=>
      <g key={`ph${hi}`} opacity="0.3">{[[4,0],[8,0],[0,4],[4,4],[8,4],[12,4],[4,8],[8,8]].map(([dx,dy],i)=>
        <rect key={i} x={bx+dx} y={by+dy} width="4" height="4" fill={t.accent}/>)}</g>
    )}
    {/* pixel arrows */}
    {[[400,40],[680,690]].map(([bx,by],ai)=>
      <g key={`pa${ai}`} opacity="0.24">{[[0,0],[4,-4],[4,4],[8,-8],[8,8]].map(([dx,dy],i)=>
        <rect key={i} x={bx+dx} y={by+dy} width="4" height="4" fill={t.spark}/>)}</g>
    )}
    {/* pixel mushroom */}
    <g opacity="0.24">{[[4,-8],[8,-8],[12,-8],[0,-4],[4,-4],[8,-4],[12,-4],[16,-4],[4,0],[8,0],[12,0],[8,4]].map(([dx,dy],i)=>
      <rect key={`mu${i}`} x={200+dx} y={690+dy} width="4" height="4" fill={i<5?t.accent:t.spark}/>)}</g>
    <rect x="25" y="18" width="620" height="46" fill={t.accent} opacity="0.3"/>
    <text x="38" y="48" fill={t.accent} fontSize="24" fontWeight="900" fontFamily={MO} letterSpacing="3">{"> "+(title||"WEEKLY SCHEDULE")}</text>
    <text x="1230" y="48" textAnchor="end" fill={t.text} fontSize="16" fontWeight="700" fontFamily={MO} opacity="0.45">[{range}]</text>
    {sch.map((it,i)=>{const y=78+i*82;return(
      <g key={i}>
        <rect x="25" y={y} width="790" height="72" fill={t.card} stroke={t.accent} strokeWidth="2" strokeOpacity="0.4"/>
        <rect x="25" y={y} width="110" height="72" fill={t.accent} opacity="0.3"/>
        <text x="80" y={y+28} textAnchor="middle" fill={t.accent} fontSize="11" fontWeight="700" fontFamily={MO}>{DAYS_EN[i]}</text>
        <text x="80" y={y+54} textAnchor="middle" fill={t.text} fontSize="22" fontWeight="900" fontFamily={MO}>{it.date}</text>
        <text x="150" y={y+30} fill={t.accent} fontSize="14" fontFamily={MO}>{">"}</text>
        <text x="168" y={y+30} fill={t.text} fontSize="15" fontWeight="700" fontFamily={MO}>{it.text||"---"}</text>
        {it.time&&<text x="790" y={y+54} textAnchor="end" fill={t.spark} fontSize="14" fontWeight="700" fontFamily={MO}>[{it.time}]</text>}
        <rect x="168" y={y+48} width={Math.min((it.text||"").length*14,480)} height="4" fill={t.primary} opacity="0.1"/>
      </g>);})}
    {/* right panel */}
    <rect x="840" y="78" width="400" height="430" fill={t.card} stroke={t.accent} strokeWidth="2" strokeOpacity="0.4"/>
    {[...Array(10)].map((_,i)=><line key={`pv${i}`} x1={840+i*40} y1="78" x2={840+i*40} y2="508" stroke={t.primary} strokeWidth="1" opacity="0.18"/>)}
    {[...Array(11)].map((_,i)=><line key={`ph2${i}`} x1="840" y1={78+i*43} x2="1240" y2={78+i*43} stroke={t.primary} strokeWidth="1" opacity="0.18"/>)}
    {/* checker pattern */}
    {[[860,98],[900,98],[940,98],[860,138],[940,138],[860,178],[900,178],[940,178],[980,98],[980,178],[860,218],[940,218]].map(([x,y],i)=>
      <rect key={`px${i}`} x={x} y={y} width="36" height="36" fill={t.accent} opacity="0.21"/>)}
    {/* pixel sword */}
    <g opacity="0.3">{[[0,0],[4,4],[8,8],[12,12],[16,16],[20,20],[-4,8],[4,16]].map(([dx,dy],i)=>
      <rect key={`sw${i}`} x={1100+dx} y={120+dy} width="4" height="4" fill={t.spark}/>)}</g>
    {/* pixel shield */}
    <g opacity="0.24">{[[0,0],[4,0],[8,0],[0,4],[4,4],[8,4],[0,8],[4,8],[8,8],[4,12]].map(([dx,dy],i)=>
      <rect key={`sh${i}`} x={1140+dx} y={300+dy} width="4" height="4" fill={t.accent}/>)}</g>
    {/* HP bar */}
    <rect x="880" y="418" width="110" height="10" fill={t.card} stroke={t.primary} strokeWidth="1" opacity="0.3"/>
    <rect x="881" y="419" width="75" height="8" fill={c3} opacity="0.25"/>
    <text x="865" y="416" fill={t.spark} fontSize="9" fontFamily={MO} opacity="0.4">HP</text>
    {/* MP bar */}
    <rect x="880" y="438" width="110" height="10" fill={t.card} stroke={t.primary} strokeWidth="1" opacity="0.3"/>
    <rect x="881" y="439" width="50" height="8" fill={t.accent} opacity="0.3"/>
    <text x="865" y="436" fill={t.accent} fontSize="9" fontFamily={MO} opacity="0.4">MP</text>
    <rect x="840" y="530" width="400" height="60" fill={t.accent} opacity="0.18"/>
    <text x="858" y="558" fill={t.spark} fontSize="12" fontFamily={MO} opacity="0.35">[AVATAR_ZONE]</text>
    <rect x="840" y="620" width="400" height="55" fill={t.card} stroke={t.primary} strokeWidth="2" strokeOpacity="0.3"/>
    <text x="858" y="654" fill={t.accent} fontSize="14" fontFamily={MO}>{"> チャンネル登録よろしく!_"}</text>
    {img&&<image href={img} x="845" y="83" width="390" height="420" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>}
  </svg>);
}

function PreviewElegant({t,sch,range,title,dk,img}){
  const c1="#D4AF37",c2="#8B4513",c3="#708090",c4="#800020";
  return(<svg viewBox="0 0 1280 720" style={{width:"100%",borderRadius:8}}>
    <defs>
      <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.bg}/><stop offset="100%" stopColor={dk?t.bg:t.secondary}/></linearGradient>
      <linearGradient id="eg2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={t.primary} stopOpacity="0.27"/><stop offset="50%" stopColor={t.primary} stopOpacity="0"/><stop offset="100%" stopColor={t.primary} stopOpacity="0.27"/></linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#eg)"/><rect width="1280" height="720" fill="url(#eg2)"/>
    {/* diamond lattice */}
    {[...Array(20)].map((_,i)=><line key={`dl1_${i}`} x1={i*85} y1="0" x2={i*85-360} y2="720" stroke={t.accent} strokeWidth="0.5" opacity={0.09}/>)}
    {[...Array(20)].map((_,i)=><line key={`dl2_${i}`} x1={i*85} y1="0" x2={i*85+360} y2="720" stroke={t.accent} strokeWidth="0.5" opacity={0.09}/>)}
    {/* subtle silk sheen gradient */}
    <ellipse cx="400" cy="200" rx="500" ry="300" fill={t.primary} opacity={0.05}/>
    <ellipse cx="900" cy="500" rx="400" ry="250" fill={t.accent} opacity={0.04}/>
    {/* ornamental corner frames */}
    <path d="M20,20L100,20L100,24L24,24L24,100L20,100Z" fill={t.accent} opacity="0.3"/>
    <path d="M1260,20L1180,20L1180,24L1256,24L1256,100L1260,100Z" fill={t.accent} opacity="0.3"/>
    <path d="M20,700L100,700L100,696L24,696L24,620L20,620Z" fill={t.accent} opacity="0.3"/>
    <path d="M1260,700L1180,700L1180,696L1256,696L1256,620L1260,620Z" fill={t.accent} opacity="0.3"/>
    {/* inner frame */}
    <rect x="20" y="20" width="1240" height="680" fill="none" stroke={t.accent} strokeWidth="0.5" opacity="0.3"/>
    <rect x="28" y="28" width="1224" height="664" fill="none" stroke={t.accent} strokeWidth="0.3" opacity="0.21"/>
    {/* fleur-de-lis */}
    {[[380,692],[680,692],[530,692],[240,692]].map(([x,y],i)=>
      <g key={`fl${i}`} opacity={0.24+i*0.01} transform={`translate(${x},${y})`}><path d="M0,-14C-4,-10 -10,-7 -10,0C-10,5 -5,7 0,5C5,7 10,5 10,0C10,-7 4,-10 0,-14Z" fill={t.accent}/><line x1="0" y1="5" x2="0" y2="15" stroke={t.accent} strokeWidth="1.5"/></g>
    )}
    {/* damask-style scroll patterns */}
    {[[100,200],[200,350],[300,500],[600,180],[500,380],[700,520]].map(([x,y],i)=>
      <path key={`dm${i}`} d={`M${x},${y}Q${x+15},${y-12} ${x+30},${y}Q${x+15},${y+12} ${x},${y}`} fill="none" stroke={t.accent} strokeWidth="0.8" opacity={0.14+i*0.005}/>
    )}
    {/* laurels around title */}
    <path d="M280,28Q305,18 330,30Q310,24 295,30" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.24"/>
    <path d="M480,28Q455,18 430,30Q450,24 465,30" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.24"/>
    <text x="400" y="55" textAnchor="middle" fill={t.text} fontSize="13" fontFamily="'Georgia',serif" letterSpacing="6" opacity="0.35">{(title||"WEEKLY SCHEDULE").toUpperCase()}</text>
    <text x="400" y="76" textAnchor="middle" fill={t.accent} fontSize="11" fontFamily="'Georgia',serif" letterSpacing="4" opacity="0.25">{range}</text>
    <line x1="160" y1="90" x2="640" y2="90" stroke={t.accent} strokeWidth="0.5" opacity="0.3"/>
    <circle cx="160" cy="90" r="2" fill={t.accent} opacity="0.3"/>
    <circle cx="640" cy="90" r="2" fill={t.accent} opacity="0.3"/>
    {sch.map((it,i)=>{const y=108+i*82;return(
      <g key={i}>
        <rect x="40" y={y} width="740" height="72" fill={t.card} opacity={i>=5?.5:1} stroke={t.accent} strokeWidth="1.5" strokeOpacity="0.25"/>
        <rect x="40" y={y} width="90" height="72" fill={t.accent} opacity="0.18"/>
        <text x="85" y={y+28} textAnchor="middle" fill={t.accent} fontSize="10" fontWeight="700" fontFamily="'Georgia',serif">{DAYS_EN[i]}</text>
        <text x="85" y={y+52} textAnchor="middle" fill={t.text} fontSize="20" fontWeight="900" fontFamily="'Georgia',serif">{it.date}</text>
        <text x="150" y={y+45} fill={t.text} fontSize="15" fontWeight="700" fontFamily={F}>{it.text||""}</text>
        {it.time&&<text x="750" y={y+45} textAnchor="end" fill={t.accent} fontSize="13" fontWeight="700" fontFamily="'Georgia',serif">{it.time}</text>}
      </g>);})}
    <rect x="830" y="50" width="400" height="620" fill="none" stroke={t.accent} strokeWidth="1" strokeOpacity="0.3"/>
    {/* diamonds */}
    {[[870,100,20],[1170,130,16],[870,520,18],[1170,560,14],[1020,90,12],[1040,540,10],[920,300,14],[1140,380,12]].map(([x,y,s],i)=>
      <rect key={i} x={x} y={y} width={s} height={s} rx="1" fill="none" stroke={t.accent} strokeWidth={1+i*0.1} opacity={0.1-i*0.006} transform={`rotate(45,${x+s/2},${y+s/2})`}/>
    )}
    {/* scroll curves */}
    <path d="M890,180Q915,155 940,180Q965,205 940,230" fill="none" stroke={c2} strokeWidth="1.2" opacity="0.2"/>
    <path d="M1120,400Q1145,375 1170,400Q1195,425 1170,450" fill="none" stroke={c4} strokeWidth="1.2" opacity="0.18"/>
    <path d="M870,430Q895,410 920,430Q945,450 920,470" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.21"/>
    <path d="M1100,200Q1125,180 1150,200Q1175,220 1150,240" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.21"/>
    {/* laurel wreath around model area */}
    <path d="M975,310Q965,285 982,272Q1000,260 1015,275" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.24"/>
    <path d="M975,310Q965,335 982,348Q1000,360 1015,345" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.24"/>
    <path d="M1085,310Q1095,285 1078,272Q1060,260 1045,275" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.24"/>
    <path d="M1085,310Q1095,335 1078,348Q1060,360 1045,345" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.24"/>
    <circle cx="1030" cy="340" r="85" fill="none" stroke={t.primary} strokeWidth="0.5" opacity="0.24" strokeDasharray="2,6"/>
    <path d="M860,656Q950,640 1030,656Q1110,672 1200,656" fill="none" stroke={c1} strokeWidth="1" opacity="0.25"/>
    <text x="1030" y="676" textAnchor="middle" fill={t.accent} fontSize="10" fontFamily="'Georgia',serif" letterSpacing="4" opacity="0.1">MODEL</text>
    {img&&<image href={img} x="835" y="55" width="390" height="610" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>}
  </svg>);
}

function PreviewComic({t,sch,range,title,dk,img}){
  const c1="#FF0000",c2="#FFD700",c3="#0066FF",c4="#FF8C00";
  return(<svg viewBox="0 0 1280 720" style={{width:"100%",borderRadius:8}}>
    <rect width="1280" height="720" fill={t.bg}/>
    {/* large ben-day dots pattern */}
    {[...Array(12)].map((_,i)=>[...Array(7)].map((_,j)=><circle key={`bd${i}_${j}`} cx={55+i*110+(j%2)*55} cy={55+j*110} r={22+((i+j)%3)*5} fill={t.primary} opacity={0.06+((i+j)%3)*0.015}/>))}
    {/* action lines radiating from corner */}
    {[...Array(30)].map((_,i)=>{const a=(i/30)*Math.PI*0.75+0.15;return(
      <line key={`al${i}`} x1="1280" y1="0" x2={1280-Math.cos(a)*1500} y2={Math.sin(a)*1500} stroke={t.primary} strokeWidth={1.8+i*0.12} opacity={0.09+i*0.0015}/>);})}
    {/* halftone dots background */}
    {[...Array(8)].map((_,i)=>[...Array(6)].map((_,j)=>{
      const x=50+i*95,y=100+j*105,r=3+(i+j)%4;
      return <circle key={`ht${i}_${j}`} cx={x} cy={y} r={r} fill={t.primary} opacity={0.10+((i+j)%3)*0.01}/>;
    }))}
    <rect x="8" y="8" width="1264" height="704" rx="4" fill="none" stroke={t.accent} strokeWidth="4.5" strokeOpacity="0.36"/>
    {/* onomatopoeia */}
    <text x="650" y="700" fill={t.accent} fontSize="32" fontWeight="900" fontFamily={F} opacity="0.21" transform="rotate(-8,650,700)">ドドド</text>
    <text x="40" y="695" fill={t.primary} fontSize="24" fontWeight="900" fontFamily={F} opacity="0.18" transform="rotate(5,40,695)">ゴゴゴ</text>
    <text x="420" y="710" fill={c3} fontSize="18" fontWeight="900" fontFamily={F} opacity="0.12" transform="rotate(-3,420,710)">バーン！</text>
    {/* impact stars */}
    {[[350,38,10],[680,680,8],[200,600,7]].map(([x,y,s],i)=>
      <polygon key={`is${i}`} points={`${x},${y-s} ${x+s*.3},${y-s*.4} ${x+s},${y-s*.15} ${x+s*.45},${y+s*.25} ${x+s*.65},${y+s} ${x},${y+s*.6} ${x-s*.65},${y+s} ${x-s*.45},${y+s*.25} ${x-s},${y-s*.15} ${x-s*.3},${y-s*.4}`} fill={i%4===0?c1:i%4===1?c2:i%4===2?c3:c4} opacity={0.18+i*0.01}/>
    )}
    <rect x="28" y="10" width="480" height="34" rx="2" fill={t.accent} opacity="0.3"/>
    <text x="38" y="34" fill={t.accent} fontSize="20" fontWeight="900" fontFamily={F} letterSpacing="2">{title||"WEEKLY SCHEDULE"}</text>
    <text x="530" y="34" fill={t.text} fontSize="14" fontWeight="700" fontFamily={F} opacity="0.35">{range}</text>
    {sch.map((it,i)=>{const y=52+i*88;const live=it.text&&it.text.length>0;return(
      <g key={i}>
        <rect x="28" y={y} width="770" height="78" rx="4" fill={t.card} stroke={t.accent} strokeWidth={live?"3":"2"} strokeOpacity={live?0.4:0.2}/>
        <rect x="28" y={y} width="95" height="78" rx="4" fill={t.accent} opacity="0.3"/>
        <text x="75" y={y+28} textAnchor="middle" fill={t.accent} fontSize="11" fontWeight="900" fontFamily={F}>{DAYS_EN[i]}</text>
        <text x="75" y={y+58} textAnchor="middle" fill={t.text} fontSize="26" fontWeight="900" fontFamily={F}>{it.date}</text>
        <text x="140" y={y+50} fill={t.text} fontSize="17" fontWeight="900" fontFamily={F}>{it.text||""}</text>
        {it.time&&<text x="770" y={y+50} textAnchor="end" fill={t.accent} fontSize="14" fontWeight="900" fontFamily={F}>{it.time}</text>}
      </g>);})}
    {/* halftone dots right panel */}
    {[...Array(80)].map((_,i)=>{const x=845+(i%8)*52,y=55+Math.floor(i/8)*66;return(
      <circle key={`dt${i}`} cx={x} cy={y} r={2.5+(i*3)%4} fill={t.accent} opacity="0.12"/>);})}
    {/* speech bubble */}
    <ellipse cx="960" cy="535" rx="65" ry="42" fill="none" stroke={t.accent} strokeWidth="3.5" strokeOpacity="0.35"/>
    <path d="M915,570L892,618L945,592" fill={t.accent} opacity="0.3"/>
    <text x="960" y="542" textAnchor="middle" fill={t.accent} fontSize="16" fontWeight="900" fontFamily={F} opacity="0.14">LIVE!</text>
    {/* thought bubble */}
    <ellipse cx="905" cy="175" rx="45" ry="28" fill="none" stroke={t.accent} strokeWidth="2" opacity="0.24"/>
    <circle cx="882" cy="215" r="7" fill="none" stroke={t.accent} strokeWidth="1.5" opacity="0.21"/>
    <circle cx="870" cy="234" r="4" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.18"/>
    {/* big SFX */}
    <text x="1080" y="155" fill={t.accent} fontSize="55" fontWeight="900" fontFamily={F} opacity="0.21" transform="rotate(-10,1080,155)">！</text>
    <text x="1140" y="290" fill={c2} fontSize="35" fontWeight="900" fontFamily={F} opacity="0.12" transform="rotate(8,1140,290)">ドン</text>
    {/* panel dividers */}
    <line x1="835" y1="350" x2="1255" y2="350" stroke={c3} strokeWidth="2.5" opacity="0.18"/>
    <line x1="1040" y1="55" x2="1040" y2="350" stroke={c2} strokeWidth="2.5" opacity="0.15"/>
    <polygon points="1040,48 1115,22 1250,48 1250,90 1115,65 1040,90" fill={t.accent} opacity="0.18"/>
    {img&&<image href={img} x="835" y="55" width="410" height="610" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>}
  </svg>);
}

function PreviewWamodern({t,sch,range,title,dk,img}){
  const c1="#D94070",c2="#3F51B5",c3="#C5A253",c4="#2E8B57";
  const arcs=[];
  for(let row=0;row<10;row++) for(let col=0;col<6;col++){
    const x=830+col*70+(row%2)*35,y=35+row*62;
    arcs.push(<path key={`a${row}_${col}`} d={`M${x},${y+32}A32,32 0 0,1 ${x+32},${y}A32,32 0 0,1 ${x+64},${y+32}`} fill="none" stroke={row%4===0?c1:row%4===1?c2:row%4===2?c3:c4} strokeWidth="0.8" opacity={0.15+row*0.005}/>);
  }
  return(<svg viewBox="0 0 1280 720" style={{width:"100%",borderRadius:8}}>
    <defs>
      <radialGradient id="wmgl" cx="30%" cy="70%"><stop offset="0%" stopColor={t.primary} stopOpacity="0.32"/><stop offset="100%" stopColor={t.primary} stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1280" height="720" fill={t.bg}/><rect width="1280" height="720" fill="url(#wmgl)"/>
    {/* kasumi (haze) horizontal bands */}
    <rect x="0" y="100" width="1280" height="80" fill={t.primary} opacity={0.035}/>
    <rect x="0" y="350" width="1280" height="100" fill={t.accent} opacity={0.05}/>
    <rect x="0" y="580" width="1280" height="70" fill={t.primary} opacity={0.04}/>
    {/* vertical mist */}
    <ellipse cx="200" cy="360" rx="120" ry="350" fill={t.primary} opacity={0.05}/>
    <ellipse cx="650" cy="360" rx="100" ry="320" fill={t.accent} opacity={0.025}/>
    {/* asanoha triangles */}
    {[...Array(6)].map((_,i)=>[...Array(5)].map((_,j)=>{
      const cx=60+i*140,cy=100+j*130;
      return <g key={`as${i}_${j}`} opacity="0.14"><line x1={cx} y1={cy-22} x2={cx-20} y2={cy+12} stroke={t.accent} strokeWidth="1"/><line x1={cx} y1={cy-22} x2={cx+20} y2={cy+12} stroke={t.accent} strokeWidth="1"/><line x1={cx-20} y1={cy+12} x2={cx+20} y2={cy+12} stroke={t.accent} strokeWidth="1"/><line x1={cx} y1={cy-22} x2={cx} y2={cy+12} stroke={t.accent} strokeWidth="0.5" opacity="0.5"/></g>;
    }))}
    {/* sakura petals - scattered */}
    {[[200,50],[500,680],[720,30],[100,650],[380,120],[600,580],[150,350],[680,350]].map(([x,y],i)=>
      <g key={`sk${i}`} opacity={0.21+i*0.005} transform={`translate(${x},${y}) rotate(${i*45}) scale(${0.8+i*0.05})`}><ellipse cx="0" cy="-6" rx="4.5" ry="9" fill={t.accent}/><ellipse cx="-5" cy="2" rx="4.5" ry="9" fill={t.accent} transform="rotate(72)"/><ellipse cx="5" cy="2" rx="4.5" ry="9" fill={t.accent} transform="rotate(-72)"/></g>
    )}
    {/* torii gate */}
    <g opacity="0.14" transform="translate(650,645) scale(1.2)"><rect x="-28" y="0" width="5" height="35" fill={t.accent}/><rect x="23" y="0" width="5" height="35" fill={t.accent}/><rect x="-34" y="-5" width="68" height="5" rx="2" fill={t.accent}/><rect x="-31" y="2" width="62" height="3.5" fill={t.accent}/></g>
    {/* wave (seigaiha) hint at bottom left */}
    {[0,1,2,3,4].map(i=>
      <path key={`wv${i}`} d={`M${i*80},720 A40,40 0 0,1 ${i*80+40},680 A40,40 0 0,1 ${i*80+80},720`} fill="none" stroke={t.accent} strokeWidth="0.8" opacity={0.14+i*0.005}/>
    )}
    {/* frame */}
    <rect x="15" y="15" width="1250" height="690" fill="none" stroke={c1} strokeWidth="1.5" opacity="0.25"/>
    {/* corner brackets */}
    {[[15,40,15,15,40,15],[1245,15,1265,15,1265,40],[15,680,15,705,40,705],[1245,705,1265,705,1265,680]].map(([x1,y1,x2,y2,x3,y3],i)=>
      <g key={`cb${i}`}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c3} strokeWidth="2.5" opacity="0.3"/><line x1={x2} y1={y2} x2={x3} y2={y3} stroke={t.accent} strokeWidth="2.5" opacity="0.38"/></g>
    )}
    <text x="50" y="56" fill={t.text} fontSize="26" fontWeight="900" fontFamily="'Georgia',serif" letterSpacing="4">{title||"週間予定"}</text>
    <text x="50" y="80" fill={t.accent} fontSize="13" fontFamily={F} opacity="0.4">{range}</text>
    <line x1="50" y1="92" x2="780" y2="92" stroke={t.accent} strokeWidth="1" opacity="0.3"/>
    {sch.map((it,i)=>{const y=106+i*82;return(
      <g key={i}>
        <rect x="40" y={y} width="740" height="72" fill={t.card} opacity={i>=5?.5:1} stroke={t.accent} strokeWidth="1.5" strokeOpacity="0.3"/>
        <rect x="40" y={y} width="95" height="72" fill={t.accent} opacity="0.21"/>
        <text x="87" y={y+28} textAnchor="middle" fill={t.accent} fontSize="10" fontWeight="700" fontFamily={F}>{DAYS_EN[i]}</text>
        <text x="87" y={y+52} textAnchor="middle" fill={t.text} fontSize="20" fontWeight="900" fontFamily="'Georgia',serif">{it.date}</text>
        <text x="155" y={y+45} fill={t.text} fontSize="15" fontWeight="700" fontFamily={F}>{it.text||""}</text>
        {it.time&&<text x="750" y={y+45} textAnchor="end" fill={t.accent} fontSize="13" fontWeight="700" fontFamily={F}>{it.time}</text>}
      </g>);})}
    <rect x="830" y="40" width="420" height="640" fill="none" stroke={t.accent} strokeWidth="1.5" strokeOpacity="0.21"/>
    {arcs}
    {/* sakura in right panel */}
    {[[900,580],[1100,120],[1180,400],[960,250],[1050,500]].map(([x,y],i)=>
      <g key={`rsk${i}`} opacity={0.21+i*0.008} transform={`translate(${x},${y}) rotate(${i*40}) scale(1.3)`}><ellipse cx="0" cy="-5" rx="4" ry="8" fill={t.accent}/><ellipse cx="-4" cy="2" rx="4" ry="8" fill={t.accent} transform="rotate(72)"/><ellipse cx="4" cy="2" rx="4" ry="8" fill={t.accent} transform="rotate(-72)"/></g>
    )}
    <circle cx="1035" cy="630" r="24" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.3"/>
    <text x="1035" y="636" textAnchor="middle" fill={t.accent} fontSize="13" fontFamily="serif" opacity="0.3">和</text>
    {img&&<image href={img} x="835" y="45" width="410" height="630" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>}
  </svg>);
}

function PreviewCyber({t,sch,range,title,dk,img}){
  const c1="#00FFFF",c2="#FF00FF",c3="#39FF14",c4="#FF6600";
  return(<svg viewBox="0 0 1280 720" style={{width:"100%",borderRadius:6}}>
    <defs>
      <linearGradient id="cbg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor={t.bg}/><stop offset="60%" stopColor={dk?t.bg:t.secondary}/><stop offset="100%" stopColor={t.bg}/></linearGradient>
      <radialGradient id="cgl1" cx="15%" cy="85%"><stop offset="0%" stopColor={t.accent} stopOpacity="0.45"/><stop offset="100%" stopColor={t.accent} stopOpacity="0"/></radialGradient>
      <radialGradient id="cgl2" cx="90%" cy="10%"><stop offset="0%" stopColor={t.spark} stopOpacity="0.36"/><stop offset="100%" stopColor={t.spark} stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#cbg)"/><rect width="1280" height="720" fill="url(#cgl1)"/><rect width="1280" height="720" fill="url(#cgl2)"/>
    {/* digital noise horizontal bars */}
    {[...Array(24)].map((_,i)=><rect key={`dn${i}`} x={((i*137+50)%800)} y={i*30} width={100+((i*73)%300)} height={2+i%4} fill={i%4===0?c1:i%4===1?c2:i%4===2?c3:t.accent} opacity={0.08+i*0.004}/>)}
    {/* large ambient glow */}
    <circle cx="200" cy="600" r="350" fill={t.accent} opacity={0.08}/>
    <circle cx="1100" cy="150" r="300" fill={t.spark} opacity={0.04}/>
    {/* perspective grid */}
    {[...Array(14)].map((_,i)=><line key={`pg${i}`} x1={640} y1={720} x2={i*110-40} y2="0" stroke={t.primary} strokeWidth="0.8" opacity="0.14"/>)}
    {[...Array(12)].map((_,i)=><line key={`hl${i}`} x1="0" y1={380+i*32} x2="1280" y2={380+i*32} stroke={t.primary} strokeWidth="0.8" opacity={0.07+i*0.003}/>)}
    {/* glitch bars */}
    {[[0,180,400,4],[200,350,300,5],[500,50,250,3],[0,520,600,4],[700,280,200,3],[300,450,350,3],[100,620,500,2]].map(([x,y,w,h],i)=>
      <rect key={`gl${i}`} x={x} y={y} width={w} height={h} fill={t.accent} opacity={0.21+i*0.005}/>)}
    {/* scanlines */}
    {[...Array(90)].map((_,i)=><line key={`sc${i}`} x1="0" y1={i*8} x2="1280" y2={i*8} stroke={t.primary} strokeWidth="0.5" opacity="0.08"/>)}
    {/* hex codes + binary */}
    <text x="30" y="700" fill={t.primary} fontSize="9" fontFamily={MO} opacity="0.24">0x4F2A 0xBE91 0x7C3D 0xA5F0 0x1D8E</text>
    <text x="500" y="710" fill={t.accent} fontSize="8" fontFamily={MO} opacity="0.18">{">>>"} SYS_ONLINE {"<<<"}</text>
    {[620,660,700,740,780].map((x,i)=>
      <text key={`bin${i}`} x={x} y={95+i*28} fill={t.primary} fontSize="8" fontFamily={MO} opacity="0.14">{["10110","01101","11010","00111","10101"][i%5]}</text>
    )}
    <text x="30" y="680" fill={t.primary} fontSize="7" fontFamily={MO} opacity="0.18">PACKET:0x7F2B STATUS:200 LATENCY:12ms</text>
    <rect x="4" y="4" width="1272" height="712" fill="none" stroke={t.accent} strokeWidth="2" strokeOpacity="0.4"/>
    <rect x="30" y="15" width="500" height="45" fill={t.accent} opacity="0.24"/>
    <rect x="30" y="15" width="4" height="45" fill={t.accent} opacity="0.35"/>
    <text x="48" y="44" fill={t.accent} fontSize="22" fontWeight="900" fontFamily={MO} letterSpacing="2">{title||"SCHEDULE://LIVE"}</text>
    <text x="1240" y="44" textAnchor="end" fill={t.spark} fontSize="14" fontWeight="700" fontFamily={MO} opacity="0.5">[{range}]</text>
    <line x1="30" y1="65" x2="780" y2="65" stroke={t.accent} strokeWidth="2" opacity="0.38"/>
    <line x1="30" y1="67" x2="780" y2="67" stroke={t.spark} strokeWidth="1" opacity="0.24"/>
    {sch.map((it,i)=>{const y=78+i*84;const live=it.text&&it.text.length>0;return(
      <g key={i}>
        <rect x="30" y={y} width="770" height="72" rx="2" fill={t.card} stroke={t.accent} strokeWidth="2" strokeOpacity={live?0.5:0.25}/>
        <rect x="30" y={y} width="4" height="72" fill={t.accent} opacity={live?0.6:0.2}/>
        <rect x="38" y={y+4} width="90" height="64" rx="2" fill={t.accent} opacity="0.21"/>
        <text x="83" y={y+26} textAnchor="middle" fill={t.spark} fontSize="10" fontWeight="700" fontFamily={MO}>{DAYS_EN[i]}</text>
        <text x="83" y={y+52} textAnchor="middle" fill={t.text} fontSize="22" fontWeight="900" fontFamily={MO}>{it.date}</text>
        {live&&<rect x="140" y={y+36} width="6" height="6" rx="3" fill="#EF4444" opacity="0.8"/>}
        <text x="155" y={y+44} fill={t.text} fontSize="15" fontWeight="700" fontFamily={MO}>{it.text||"---"}</text>
        {it.time&&<text x="775" y={y+44} textAnchor="end" fill={t.spark} fontSize="14" fontWeight="700" fontFamily={MO}>&lt;{it.time}&gt;</text>}
      </g>);})}
    {/* right panel */}
    <rect x="830" y="50" width="420" height="620" rx="4" fill={t.card} opacity="0.3" stroke={t.accent} strokeWidth="1.5" strokeOpacity="0.38"/>
    {/* circuit traces */}
    <path d="M860,80L860,200L920,200L920,280L880,280" fill="none" stroke={t.accent} strokeWidth="1.5" opacity="0.3"/>
    <path d="M1200,100L1200,180L1140,180L1140,250" fill="none" stroke={t.accent} strokeWidth="1.5" opacity="0.3"/>
    <path d="M960,400L1060,400L1060,480L1120,480" fill="none" stroke={t.primary} strokeWidth="1" opacity="0.24"/>
    <path d="M880,280L880,340L940,340" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.21"/>
    <path d="M1140,250L1140,320L1080,320" fill="none" stroke={t.primary} strokeWidth="1" opacity="0.21"/>
    {/* circuit nodes */}
    {[[860,80],[860,200],[920,200],[920,280],[880,280],[1200,100],[1200,180],[1140,180],[1140,250],[960,400],[1060,400],[1060,480],[1120,480],[880,340],[940,340],[1140,320],[1080,320]].map(([x,y],i)=>
      <circle key={`nd${i}`} cx={x} cy={y} r="3" fill={t.accent} opacity={0.38+i*0.005}/>)}
    {/* chip motifs */}
    <rect x="970" y="220" width="55" height="55" rx="4" fill="none" stroke={t.accent} strokeWidth="1.5" opacity="0.3"/>
    {[0,1,2,3].map(i=><g key={`cp${i}`}><line x1={980+i*12} y1="220" x2={980+i*12} y2="208" stroke={t.accent} strokeWidth="1" opacity="0.24"/><line x1={980+i*12} y1="275" x2={980+i*12} y2="287" stroke={t.accent} strokeWidth="1" opacity="0.24"/></g>)}
    {/* data blocks */}
    {[[870,320,85,28],[1140,350,95,22],[900,520,105,22],[1100,560,85,20],[950,360,60,18],[1060,300,70,18]].map(([x,y,w,h],i)=>
      <rect key={`db${i}`} x={x} y={y} width={w} height={h} fill={i%4===0?c1:i%4===1?c2:i%4===2?c3:c4} opacity={0.12+i*0.005} stroke={t.accent} strokeWidth="0.8" strokeOpacity="0.3"/>)}
    <text x="875" y="340" fill={t.spark} fontSize="7" fontFamily={MO} opacity="0.1">STREAM_DATA_OK</text>
    <text x="875" y="355" fill={t.primary} fontSize="7" fontFamily={MO} opacity="0.2">PKT:0x7F2B STAT:200</text>
    <text x="1040" y="650" textAnchor="middle" fill={t.spark} fontSize="10" fontFamily={MO} opacity="0.2">{"<AVATAR_SLOT/>"}</text>
    {img&&<image href={img} x="835" y="55" width="410" height="610" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>}
  </svg>);
}

function PreviewPastel({t,sch,range,title,dk,img}){
  const c1="#FFDAB9",c2="#89CFF0",c3="#DDA0DD",c4="#98D8C8";
  return(<svg viewBox="0 0 1280 720" style={{width:"100%",borderRadius:12}}>
    <defs>
      <linearGradient id="pbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={t.bg}/><stop offset="50%" stopColor={t.secondary}/><stop offset="100%" stopColor={t.bg}/></linearGradient>
      <radialGradient id="pglow1" cx="15%" cy="80%"><stop offset="0%" stopColor={t.primary} stopOpacity="0.57"/><stop offset="100%" stopColor={t.primary} stopOpacity="0"/></radialGradient>
      <radialGradient id="pglow2" cx="85%" cy="15%"><stop offset="0%" stopColor={t.accent} stopOpacity="0.45"/><stop offset="100%" stopColor={t.accent} stopOpacity="0"/></radialGradient>
      <radialGradient id="pglow3" cx="50%" cy="50%"><stop offset="0%" stopColor={t.spark} stopOpacity="0.32"/><stop offset="100%" stopColor={t.spark} stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#pbg)"/><rect width="1280" height="720" fill="url(#pglow1)"/><rect width="1280" height="720" fill="url(#pglow2)"/><rect width="1280" height="720" fill="url(#pglow3)"/>
    {/* soft wave layers */}
    <path d="M0,300 Q320,240 640,300 Q960,360 1280,300 L1280,720 L0,720Z" fill={t.primary} opacity={0.06}/>
    <path d="M0,400 Q320,340 640,400 Q960,460 1280,400 L1280,720 L0,720Z" fill={t.accent} opacity={0.055}/>
    <path d="M0,500 Q320,450 640,500 Q960,550 1280,500 L1280,720 L0,720Z" fill={t.spark} opacity={0.05}/>
    {/* large soft bokeh */}
    <circle cx="250" cy="580" r="200" fill={t.primary} opacity={0.09}/>
    <circle cx="700" cy="150" r="180" fill={t.accent} opacity={0.08}/>
    <circle cx="500" cy="400" r="250" fill={t.spark} opacity={0.03}/>
    {/* clouds */}
    {[[100,620,85],[320,665,65],[560,640,75],[160,55,55],[420,35,45],[670,65,50],[750,650,40]].map(([cx,cy,r],i)=>
      <g key={`cl${i}`} opacity={0.36+i*0.008}><ellipse cx={cx} cy={cy} rx={r*1.8} ry={r} fill={dk?t.secondary:"white"}/><ellipse cx={cx-r*.5} cy={cy-r*.3} rx={r*.9} ry={r*.6} fill={dk?t.secondary:"white"}/><ellipse cx={cx+r*.6} cy={cy-r*.2} rx={r*.8} ry={r*.55} fill={dk?t.secondary:"white"}/></g>
    )}
    {/* rainbow */}
    <path d="M-120,720A750,420 0 0,1 850,720" fill="none" stroke={t.primary} strokeWidth="45" opacity="0.12"/>
    <path d="M-80,720A710,390 0 0,1 830,720" fill="none" stroke={t.accent} strokeWidth="30" opacity="0.1"/>
    <path d="M-40,720A670,360 0 0,1 810,720" fill="none" stroke={t.spark} strokeWidth="18" opacity="0.09"/>
    {/* flowers */}
    {[[180,300],[480,100],[700,550],[350,600],[120,450],[550,250],[680,400],[250,150]].map(([x,y],i)=>
      <g key={`fl${i}`} opacity={0.21+i*0.005} transform={`translate(${x},${y}) scale(${0.8+i*0.04}) rotate(${i*28})`}>{[0,72,144,216,288].map(a=><ellipse key={a} cx={Math.cos(a*Math.PI/180)*9} cy={Math.sin(a*Math.PI/180)*9} rx="5.5" ry="3.2" fill={t.accent} transform={`rotate(${a})`}/>)}<circle cx="0" cy="0" r="3.5" fill={t.primary} opacity="0.8"/></g>
    )}
    {/* butterflies */}
    {[[580,80],[120,500],[400,50]].map(([x,y],i)=>
      <g key={`bf${i}`} opacity={0.21+i*0.01} transform={`translate(${x},${y}) scale(0.8) rotate(${i*20})`}><ellipse cx="-9" cy="-5" rx="8" ry="11" fill={t.accent}/><ellipse cx="9" cy="-5" rx="8" ry="11" fill={t.accent}/><ellipse cx="-6" cy="6" rx="5.5" ry="7.5" fill={t.primary}/><ellipse cx="6" cy="6" rx="5.5" ry="7.5" fill={t.primary}/><line x1="0" y1="-12" x2="0" y2="12" stroke={t.text} strokeWidth="1" opacity="0.3"/></g>
    )}
    {/* scattered soft circles */}
    {[[70,200,18],[200,400,12],[650,100,15],[500,550,10],[720,450,12],[320,50,8],[600,650,10]].map(([x,y,r],i)=>
      <circle key={`fc${i}`} cx={x} cy={y} r={r} fill={i%4===0?c1:i%4===1?c2:i%4===2?c3:c4} opacity={0.2+i*0.006}/>)}
    <rect x="16" y="16" width="1248" height="688" rx="20" fill="none" stroke={dk?t.primary:"white"} strokeWidth="2" opacity="0.44"/>
    <text x="50" y="60" fill={t.accent} fontSize="28" fontWeight="900" fontFamily={F} opacity="0.8">{title||"Weekly Schedule"}</text>
    <text x="50" y="84" fill={t.text} fontSize="14" fontWeight="700" fontFamily={F} opacity="0.35">{range}</text>
    {[0,1,2].map(i=><circle key={i} cx={55+i*14} cy="96" r="3.5" fill={t.accent} opacity={0.25-i*0.06}/>)}
    {sch.map((it,i)=>{const y=112+i*82;return(
      <g key={i}>
        <rect x="35" y={y} width="750" height="72" rx="18" fill={t.card} stroke={t.accent} strokeWidth="2" strokeOpacity="0.3"/>
        <rect x="45" y={y+10} width="80" height="52" rx="26" fill={t.primary} opacity="0.38"/>
        <text x="85" y={y+30} textAnchor="middle" fill={t.accent} fontSize="10" fontWeight="700" fontFamily={F}>{DAYS_EN[i]}</text>
        <text x="85" y={y+50} textAnchor="middle" fill={t.text} fontSize="18" fontWeight="900" fontFamily={F}>{it.date}</text>
        <text x="142" y={y+46} fill={t.text} fontSize="16" fontWeight="700" fontFamily={F}>{it.text||""}</text>
        {it.time&&<><rect x="630" y={y+22} width="130" height="30" rx="15" fill={t.accent} opacity="0.1"/><text x="695" y={y+42} textAnchor="middle" fill={t.accent} fontSize="13" fontWeight="700" fontFamily={F}>{it.time}</text></>}
      </g>);})}
    {/* right panel */}
    <rect x="820" y="40" width="420" height="640" rx="24" fill={dk?t.secondary:"white"} opacity="0.28" stroke={t.primary} strokeWidth="1.5" strokeOpacity="0.3"/>
    {/* layered circles */}
    {[[920,150,65],[1080,280,85],[960,430,55],[1120,520,45],[1040,120,35],[880,580,40],[1180,400,30],[1000,340,50]].map(([cx,cy,r],i)=>
      <circle key={`rc${i}`} cx={cx} cy={cy} r={r} fill={i%3===0?t.primary:i%3===1?t.accent:t.spark} opacity={0.16+i*0.005}/>)}
    {/* flowers in right */}
    {[[880,200],[1150,350],[950,500],[1070,150],[1020,450]].map(([x,y],i)=>
      <g key={`rf${i}`} opacity={0.24+i*0.008} transform={`translate(${x},${y}) scale(1) rotate(${i*45})`}>{[0,72,144,216,288].map(a=><ellipse key={a} cx={Math.cos(a*Math.PI/180)*7} cy={Math.sin(a*Math.PI/180)*7} rx="4.5" ry="2.8" fill={t.accent} transform={`rotate(${a})`}/>)}<circle cx="0" cy="0" r="3" fill={t.primary} opacity="0.8"/></g>
    )}
    {/* sparkles */}
    {[[870,100,6],[1180,170,7],[900,500,5],[1160,600,6],[1060,80,6],[950,360,5],[1130,420,4],[870,300,5],[1200,250,4],[980,580,5]].map(([x,y,s],i)=>
      <path key={`sp${i}`} d={`M${x},${y-s}L${x+s*.22},${y-s*.3}L${x+s},${y}L${x+s*.22},${y+s*.3}L${x},${y+s}L${x-s*.22},${y+s*.3}L${x-s},${y}L${x-s*.22},${y-s*.3}Z`} fill={t.spark} opacity={0.36+(i%3)*0.06}/>
    )}
    <text x="1030" y="658" textAnchor="middle" fill={t.accent} fontSize="11" fontFamily={F} opacity="0.15">✧ model area ✧</text>
    {img&&<image href={img} x="830" y="50" width="400" height="620" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>}
  </svg>);
}

function PreviewGalaxy({t,sch,range,title,dk,img}){
  const c1="#9B59B6",c2="#FFD700",c3="#008B8B",c4="#FF6B6B";
  const stars=[];for(let i=0;i<120;i++){stars.push(<circle key={`st${i}`} cx={Math.sin(i*7.3)*620+640} cy={Math.cos(i*5.1)*350+360} r={0.4+(i%5)*0.5} fill={i%4===0?t.spark:i%4===1?"white":i%4===2?t.primary:t.accent} opacity={0.30+(i%6)*0.06}/>);}
  return(<svg viewBox="0 0 1280 720" style={{width:"100%",borderRadius:8}}>
    <defs>
      <linearGradient id="gbg" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor={dk?t.bg:"#0c0a1d"}/><stop offset="40%" stopColor={dk?t.secondary:"#1a103a"}/><stop offset="100%" stopColor={dk?t.bg:"#0a0818"}/></linearGradient>
      <radialGradient id="gneb1" cx="22%" cy="62%"><stop offset="0%" stopColor={t.accent} stopOpacity="0.54"/><stop offset="100%" stopColor={t.accent} stopOpacity="0"/></radialGradient>
      <radialGradient id="gneb2" cx="82%" cy="28%"><stop offset="0%" stopColor={t.primary} stopOpacity="0.52"/><stop offset="100%" stopColor={t.primary} stopOpacity="0"/></radialGradient>
      <radialGradient id="gneb3" cx="55%" cy="88%"><stop offset="0%" stopColor={t.spark} stopOpacity="0.45"/><stop offset="100%" stopColor={t.spark} stopOpacity="0"/></radialGradient>
      <radialGradient id="gneb4" cx="75%" cy="55%"><stop offset="0%" stopColor={t.accent} stopOpacity="0.32"/><stop offset="100%" stopColor={t.accent} stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#gbg)"/><rect width="1280" height="720" fill="url(#gneb1)"/><rect width="1280" height="720" fill="url(#gneb2)"/><rect width="1280" height="720" fill="url(#gneb3)"/><rect width="1280" height="720" fill="url(#gneb4)"/>
    {/* milky way band */}
    <ellipse cx="640" cy="360" rx="850" ry="130" fill={t.primary} opacity="0.09" transform="rotate(-15,640,360)"/>
    <ellipse cx="640" cy="360" rx="650" ry="70" fill="white" opacity="0.08" transform="rotate(-15,640,360)"/>
    {stars}
    {/* shooting stars */}
    <line x1="80" y1="40" x2="200" y2="78" stroke={c2} strokeWidth="1.5" opacity="0.22"/><circle cx="80" cy="40" r="2.5" fill="white" opacity="0.5"/>
    <line x1="700" y1="25" x2="760" y2="50" stroke="white" strokeWidth="1.2" opacity="0.38"/><circle cx="700" cy="25" r="2" fill="white" opacity="0.35"/>
    <line x1="400" y1="680" x2="350" y2="700" stroke="white" strokeWidth="1" opacity="0.3"/><circle cx="400" cy="680" r="1.5" fill="white" opacity="0.25"/>
    {/* spiral galaxy */}
    <path d="M400,690Q425,660 450,672Q475,685 460,710" fill="none" stroke={t.primary} strokeWidth="1.2" opacity="0.18"/>
    <path d="M395,695Q428,655 458,668Q485,685 465,715" fill="none" stroke={t.accent} strokeWidth="0.8" opacity="0.12"/>
    {/* comet */}
    <circle cx="580" cy="650" r="4" fill={t.spark} opacity="0.3"/><line x1="580" y1="650" x2="630" y2="665" stroke={t.spark} strokeWidth="3" opacity="0.21"/>
    {/* cosmic dust clouds */}
    {[[200,580,100,40],[500,100,120,35],[700,620,80,30]].map(([cx,cy,rx,ry],i)=>
      <ellipse key={`cd${i}`} cx={cx} cy={cy} rx={rx} ry={ry} fill={i%2===0?t.accent:t.primary} opacity={0.07+i*0.005}/>
    )}
    <rect x="14" y="14" width="1252" height="692" rx="12" fill="none" stroke={t.primary} strokeWidth="1" opacity="0.3"/>
    <text x="45" y="55" fill={t.spark} fontSize="26" fontWeight="900" fontFamily={F} opacity="0.9" letterSpacing="1">{title||"WEEKLY SCHEDULE"}</text>
    <text x="45" y="78" fill={t.primary} fontSize="13" fontWeight="700" fontFamily={F} opacity="0.45">{range}</text>
    {[0,1,2,3,4].map(i=><circle key={i} cx={48+i*8} cy="90" r="2" fill={t.spark} opacity={0.4-i*0.07}/>)}
    {sch.map((it,i)=>{const y=106+i*82;return(
      <g key={i}>
        <rect x="35" y={y} width="750" height="72" rx="10" fill={dk?t.card:"rgba(15,10,40,0.7)"} stroke={t.accent} strokeWidth="2.5" strokeOpacity="0.55"/>
        <rect x="35" y={y} width="95" height="72" rx="10" fill={t.accent} opacity="0.3"/>
        <text x="82" y={y+28} textAnchor="middle" fill={t.spark} fontSize="10" fontWeight="700" fontFamily={F}>{DAYS_EN[i]}</text>
        <text x="82" y={y+52} textAnchor="middle" fill={dk?t.text:"#e2e8f0"} fontSize="20" fontWeight="900" fontFamily={F}>{it.date}</text>
        <text x="150" y={y+45} fill={dk?t.text:"#e2e8f0"} fontSize="16" fontWeight="700" fontFamily={F}>{it.text||""}</text>
        {it.time&&<><rect x="630" y={y+20} width="130" height="32" rx="16" fill={t.accent} opacity="0.12"/><text x="695" y={y+42} textAnchor="middle" fill={t.spark} fontSize="14" fontWeight="700" fontFamily={F}>{it.time}</text></>}
      </g>);})}
    <rect x="820" y="40" width="420" height="640" rx="16" fill="rgba(255,255,255,0.02)" stroke={t.primary} strokeWidth="1" strokeOpacity="0.3"/>
    {/* constellations */}
    <line x1="880" y1="120" x2="950" y2="180" stroke={t.spark} strokeWidth="0.8" opacity="0.36"/><line x1="950" y1="180" x2="1020" y2="150" stroke={t.spark} strokeWidth="0.8" opacity="0.36"/><line x1="1020" y1="150" x2="1080" y2="220" stroke={t.spark} strokeWidth="0.8" opacity="0.36"/><line x1="1080" y1="220" x2="1150" y2="170" stroke={t.spark} strokeWidth="0.8" opacity="0.36"/>
    <line x1="900" y1="350" x2="980" y2="400" stroke={t.primary} strokeWidth="0.8" opacity="0.3"/><line x1="980" y1="400" x2="1060" y2="380" stroke={t.primary} strokeWidth="0.8" opacity="0.3"/><line x1="1060" y1="380" x2="1120" y2="440" stroke={t.primary} strokeWidth="0.8" opacity="0.3"/>
    {/* constellation stars */}
    {[[880,120,3],[950,180,3.5],[1020,150,3],[1080,220,3.5],[1150,170,3],[900,350,2.5],[980,400,3],[1060,380,2.5],[1120,440,3]].map(([x,y,r],i)=>
      <circle key={`cn${i}`} cx={x} cy={y} r={r} fill={i<5?t.spark:t.primary} opacity={0.3+i*0.02}/>)}
    {/* planet + ring */}
    <circle cx="1050" cy="550" r="45" fill={t.accent} opacity="0.18"/><circle cx="1050" cy="550" r="45" fill="none" stroke={t.primary} strokeWidth="1" opacity="0.3"/>
    <ellipse cx="1050" cy="550" rx="70" ry="10" fill="none" stroke={c3} strokeWidth="1.2" opacity="0.25" transform="rotate(-20,1050,550)"/>
    {/* moon */}
    <circle cx="900" cy="260" r="14" fill={t.primary} opacity="0.14"/><circle cx="900" cy="260" r="14" fill="none" stroke={t.spark} strokeWidth="0.6" opacity="0.3"/>
    <circle cx="905" cy="256" r="10" fill={dk?t.bg:"#0c0a1d"} opacity="0.6"/>
    <text x="1030" y="658" textAnchor="middle" fill={t.spark} fontSize="11" fontFamily={F} opacity="0.15">✦ model area ✦</text>
    {img&&<image href={img} x="830" y="50" width="400" height="620" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>}
  </svg>);
}

function PreviewGrunge({t,sch,range,title,dk,img}){
  const c1="#B7410E",c2="#4B5320",c3="#FFBF00",c4="#666699";
  return(<svg viewBox="0 0 1280 720" style={{width:"100%",borderRadius:4}}>
    <defs>
      <linearGradient id="grbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={dk?t.bg:"#1a1a1a"}/><stop offset="100%" stopColor={dk?t.secondary:"#111111"}/></linearGradient>
      <radialGradient id="grgl" cx="30%" cy="40%"><stop offset="0%" stopColor={t.accent} stopOpacity="0.32"/><stop offset="100%" stopColor={t.accent} stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#grbg)"/><rect width="1280" height="720" fill="url(#grgl)"/>
    {/* concrete texture - horizontal rough bands */}
    {[...Array(12)].map((_,i)=><rect key={`ct${i}`} x="0" y={i*62} width="1280" height={30+i%15} fill={dk?t.primary:i%4===0?"#444":i%4===1?c1:i%4===2?c2:c4} opacity={0.07+i*0.004}/>)}
    {/* paint drip gradient from top */}
    <rect x="0" y="0" width="1280" height="180" fill={t.accent} opacity={0.09}/>
    <rect x="0" y="0" width="1280" height="80" fill={t.accent} opacity={0.04}/>
    {/* vignette corners */}
    <rect x="0" y="0" width="200" height="720" fill="black" opacity={0.12}/>
    <rect x="1080" y="0" width="200" height="720" fill="black" opacity={0.10}/>
    {/* noise texture rects */}
    {[...Array(50)].map((_,i)=><rect key={`n${i}`} x={Math.sin(i*3.7)*600+640} y={Math.cos(i*2.9)*350+360} width={18+i%35} height={2+i%3} fill={dk?t.primary:"#333"} opacity={0.14+i*0.001} transform={`rotate(${i*17},${Math.sin(i*3.7)*600+640},${Math.cos(i*2.9)*350+360})`}/>)}
    {/* scratch lines */}
    {[[30,0,250,720],[180,0,400,720],[600,0,820,720],[950,0,1170,720],[1100,0,1280,600],[400,720,100,0],[800,720,500,0]].map(([x1,y1,x2,y2],i)=>
      <line key={`sc${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={dk?t.primary:"#333"} strokeWidth={1+i*0.3} opacity={0.18+i*0.006}/>)}
    {/* spray paint splatters */}
    {[[100,100,35],[700,50,25],[50,600,30],[750,680,22],[350,30,18],[600,690,20]].map(([x,y,r],i)=>
      <circle key={`sp${i}`} cx={x} cy={y} r={r} fill={i%4===0?c1:i%4===1?c2:i%4===2?c3:c4} opacity={0.15+i*0.005}/>)}
    {/* chains */}
    {[[180,680],[320,680],[460,680],[600,680]].map(([x,y],i)=>
      <ellipse key={`ch${i}`} cx={x} cy={y} rx="14" ry="9" fill="none" stroke={t.accent} strokeWidth="2.5" opacity={0.18+i*0.008}/>)}
    {/* barbed wire */}
    <g opacity="0.18"><line x1="0" y1="658" x2="800" y2="658" stroke={t.accent} strokeWidth="2"/>{[60,160,260,360,460,560,660,760].map(x=><g key={`bw${x}`}><line x1={x-5} y1="653" x2={x+5} y2="663" stroke={t.accent} strokeWidth="2"/><line x1={x+5} y1="653" x2={x-5} y2="663" stroke={t.accent} strokeWidth="2"/></g>)}</g>
    {/* spray text */}
    <text x="520" y="712" fill={c1} fontSize="18" fontWeight="900" fontFamily={F} opacity="0.15" transform="rotate(-3,520,712)">UNDERGROUND</text>
    <text x="100" y="700" fill={t.primary} fontSize="12" fontWeight="900" fontFamily={F} opacity="0.14" transform="rotate(2,100,700)">NO LIMITS</text>
    {/* edge bars */}
    <rect x="0" y="0" width="12" height="720" fill={t.accent} opacity="0.35"/>
    <rect x="12" y="0" width="3" height="500" fill={t.accent} opacity="0.21"/>
    <rect x="1268" y="0" width="12" height="720" fill={t.accent} opacity="0.3"/>
    <rect x="1265" y="200" width="3" height="520" fill={t.accent} opacity="0.18"/>
    {/* torn top edge */}
    <path d="M0,65L45,58L90,68L135,55L180,65L225,52L270,62L315,55L360,68L405,58L450,65L495,54L540,62L585,56L630,68L675,55L720,62L765,58L800,65L800,0L0,0Z" fill={t.accent} opacity="0.21"/>
    <text x="30" y="48" fill={dk?t.text:"#ddd"} fontSize="32" fontWeight="900" fontFamily={F} letterSpacing="-1" opacity="0.9">{title||"WEEKLY SCHEDULE"}</text>
    <line x1="30" y1="58" x2="370" y2="58" stroke={t.accent} strokeWidth="3.5" opacity="0.4"/>
    <text x="380" y="52" fill={t.accent} fontSize="15" fontWeight="700" fontFamily={F} opacity="0.4">{range}</text>
    {sch.map((it,i)=>{const y=74+i*86;const live=it.text&&it.text.length>0;return(
      <g key={i}>
        <rect x="25" y={y} width="770" height="76" rx="2" fill={dk?t.card:"rgba(40,40,40,0.85)"} stroke={t.accent} strokeWidth={live?"3":"2.5"} strokeOpacity={live?0.6:0.4}/>
        <rect x="25" y={y} width="6" height="76" rx="1" fill={t.accent} opacity={live?0.7:0.3}/>
        <rect x="38" y={y+6} width="85" height="64" rx="2" fill={t.accent} opacity="0.21"/>
        <text x="80" y={y+28} textAnchor="middle" fill={t.accent} fontSize="11" fontWeight="900" fontFamily={F} opacity="0.6">{DAYS_EN[i]}</text>
        <text x="80" y={y+56} textAnchor="middle" fill={dk?t.text:"#ddd"} fontSize="24" fontWeight="900" fontFamily={F}>{it.date}</text>
        <text x="140" y={y+48} fill={dk?t.text:"#ccc"} fontSize="16" fontWeight="700" fontFamily={F}>{it.text||""}</text>
        {it.time&&<text x="770" y={y+48} textAnchor="end" fill={t.accent} fontSize="14" fontWeight="900" fontFamily={F} opacity="0.6">[ {it.time} ]</text>}
      </g>);})}
    {/* right panel */}
    <rect x="825" y="30" width="425" height="660" rx="2" fill={dk?t.card:"rgba(30,30,30,0.6)"} stroke={t.accent} strokeWidth="2.5" strokeOpacity="0.38"/>
    {/* X cross */}
    <line x1="855" y1="75" x2="1215" y2="610" stroke={t.accent} strokeWidth="2" opacity="0.18"/>
    <line x1="1215" y1="75" x2="855" y2="610" stroke={t.accent} strokeWidth="2" opacity="0.18"/>
    {/* crosshair */}
    <circle cx="1035" cy="200" r="55" fill="none" stroke={t.accent} strokeWidth="3" opacity="0.3"/>
    <circle cx="1035" cy="200" r="35" fill="none" stroke={t.accent} strokeWidth="1.5" opacity="0.21"/>
    <circle cx="1035" cy="200" r="15" fill="none" stroke={t.accent} strokeWidth="1" opacity="0.14"/>
    <line x1="1035" y1="135" x2="1035" y2="265" stroke={c1} strokeWidth="1.5" opacity="0.2"/>
    <line x1="970" y1="200" x2="1100" y2="200" stroke={t.accent} strokeWidth="1.5" opacity="0.24"/>
    {/* skull */}
    <g opacity="0.21" transform="translate(950,450) scale(1.1)"><circle cx="0" cy="-5" r="18" fill="none" stroke={t.accent} strokeWidth="2.5"/><rect x="-13" y="6" width="26" height="12" rx="5" fill="none" stroke={t.accent} strokeWidth="2"/><circle cx="-7" cy="-8" r="3.5" fill={t.accent}/><circle cx="7" cy="-8" r="3.5" fill={t.accent}/></g>
    {/* drips */}
    {[[880,290,90],[1165,240,115],[920,500,65],[1145,475,80],[870,400,50],[1190,350,60]].map(([x,y,h],i)=>
      <rect key={`dr${i}`} x={x} y={y} width={3+i%2} height={h} fill={i%4===0?c1:i%4===1?c2:i%4===2?c3:c4} opacity={0.18+i*0.012} rx="1.5"/>)}
    {/* tag box */}
    <rect x="865" y="575" width="90" height="35" rx="3" fill="none" stroke={t.accent} strokeWidth="2.5" opacity="0.24"/>
    <text x="910" y="598" textAnchor="middle" fill={t.accent} fontSize="11" fontWeight="900" fontFamily={F} opacity="0.2">TAG</text>
    {/* splatter dots */}
    {[...Array(25)].map((_,i)=><circle key={`sd${i}`} cx={860+((i*67)%360)} cy={340+((i*43)%280)} r={1.5+i%3} fill={i%4===0?c1:i%4===1?c2:i%4===2?c3:c4} opacity={0.15+i*0.004}/>)}
    <text x="1035" y="650" textAnchor="middle" fill={t.accent} fontSize="12" fontFamily={F} opacity="0.15">[ MODEL ]</text>
    {img&&<image href={img} x="830" y="40" width="415" height="645" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>}
  </svg>);
}

const PREVIEW={kawaii:PreviewKawaii,clean:PreviewClean,pop:PreviewPop,streamer:PreviewStreamer,pixel:PreviewPixel,elegant:PreviewElegant,comic:PreviewComic,wamodern:PreviewWamodern,cyber:PreviewCyber,pastel:PreviewPastel,galaxy:PreviewGalaxy,grunge:PreviewGrunge};

/* ════════════════════════════════════════
   EXPORT SVG (string builder) - LUXURIOUS
   ════════════════════════════════════════ */
function buildExportSVG({designId,t,sch,range,title,img}){
  const dk=isDk(t);
  const PAL={kawaii:["#FF69B4","#B19CD9","#FFD700","#7FDBCA"],clean:["#4682B4","#708090","#2F4F4F","#B8860B"],pop:["#FF1493","#FFD700","#00C853","#9B59B6"],streamer:["#00BCD4","#E91E63","#7C4DFF","#FF9800"],pixel:["#FFD700","#FF4444","#44FF44","#4488FF"],elegant:["#D4AF37","#8B4513","#708090","#800020"],comic:["#FF0000","#FFD700","#0066FF","#FF8C00"],wamodern:["#D94070","#3F51B5","#C5A253","#2E8B57"],cyber:["#00FFFF","#FF00FF","#39FF14","#FF6600"],pastel:["#FFDAB9","#89CFF0","#DDA0DD","#98D8C8"],galaxy:["#9B59B6","#FFD700","#008B8B","#FF6B6B"],grunge:["#B7410E","#4B5320","#FFBF00","#666699"]};
  const [c1,c2,c3,c4]=PAL[designId]||PAL.clean;
  const imgTag=img?`<image href="${img.replace(/"/g,'&quot;')}" x="${designId==='streamer'?45:835}" y="${designId==='streamer'?45:50}" width="${designId==='streamer'?370:410}" height="${designId==='streamer'?630:620}" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>`:"";

  const rows=sch.map((it,i)=>{
    const live=it.text&&it.text.length>0;
    if(designId==="streamer"){const y=103+i*85;return `<g><rect x="460" y="${y}" width="790" height="74" rx="10" fill="${t.card}" stroke="${t.accent}" stroke-width="2" stroke-opacity="${live?0.45:0.2}"/><rect x="470" y="${y+10}" width="80" height="54" rx="8" fill="${t.accent}" opacity="${live?0.15:0.05}"/><text x="510" y="${y+30}" text-anchor="middle" fill="${t.accent}" font-size="10" font-weight="700" font-family="${F}">${DAYS_JA[i]}</text><text x="510" y="${y+52}" text-anchor="middle" fill="${t.text}" font-size="20" font-weight="900" font-family="${F}">${it.date}</text>${live?`<circle cx="570" cy="${y+37}" r="4" fill="#EF4444" opacity="0.75"/>`:""}<text x="586" y="${y+44}" fill="${t.text}" font-size="16" font-weight="700" font-family="${F}">${it.text||""}</text>${it.time?`<rect x="1100" y="${y+18}" width="130" height="38" rx="19" fill="${t.accent}" opacity="0.1"/><text x="1165" y="${y+43}" text-anchor="middle" fill="${t.accent}" font-size="15" font-weight="700" font-family="${F}">${it.time}</text>`:""}</g>`;}
    if(designId==="pixel"){const y=78+i*82;return `<g><rect x="25" y="${y}" width="790" height="72" fill="${t.card}" stroke="${t.accent}" stroke-width="2" stroke-opacity="0.4"/><rect x="25" y="${y}" width="110" height="72" fill="${t.accent}" opacity="0.1"/><text x="80" y="${y+28}" text-anchor="middle" fill="${t.accent}" font-size="11" font-weight="700" font-family="${MO}">${DAYS_EN[i]}</text><text x="80" y="${y+54}" text-anchor="middle" fill="${t.text}" font-size="22" font-weight="900" font-family="${MO}">${it.date}</text><text x="150" y="${y+30}" fill="${t.accent}" font-size="14" font-family="${MO}">&gt;</text><text x="168" y="${y+30}" fill="${t.text}" font-size="15" font-weight="700" font-family="${MO}">${it.text||"---"}</text>${it.time?`<text x="790" y="${y+54}" text-anchor="end" fill="${t.spark}" font-size="14" font-weight="700" font-family="${MO}">[${it.time}]</text>`:""}<rect x="168" y="${y+48}" width="${Math.min((it.text||"").length*14,480)}" height="4" fill="${t.primary}" opacity="0.1"/></g>`;}
    if(designId==="kawaii"){const y=46+i*90;return `<g><rect x="30" y="${y}" width="760" height="78" rx="16" fill="${t.card}" stroke="${t.accent}" stroke-width="2" stroke-opacity="0.4"/><circle cx="70" cy="${y+39}" r="27" fill="${t.primary}" opacity="0.85"/><text x="70" y="${y+45}" text-anchor="middle" fill="${dk?t.bg:'white'}" font-size="22" font-weight="900" font-family="${F}">${it.date}</text><text x="112" y="${y+18}" fill="${t.accent}" font-size="10" font-weight="700" font-family="${F}" opacity="0.55">${DAYS_EN[i]}</text><text x="112" y="${y+52}" fill="${t.text}" font-size="17" font-weight="700" font-family="${F}">${it.text||""}</text>${it.time?`<rect x="630" y="${y+22}" width="140" height="34" rx="17" fill="${t.primary}" opacity="0.18"/><text x="700" y="${y+44}" text-anchor="middle" fill="${t.accent}" font-size="14" font-weight="700" font-family="${F}">${it.time}</text>`:""}</g>`;}
    if(designId==="comic"){const y=52+i*88;return `<g><rect x="28" y="${y}" width="770" height="78" rx="4" fill="${t.card}" stroke="${t.accent}" stroke-width="${live?3:2}" stroke-opacity="${live?0.4:0.2}"/><rect x="28" y="${y}" width="95" height="78" rx="4" fill="${t.accent}" opacity="0.1"/><text x="75" y="${y+28}" text-anchor="middle" fill="${t.accent}" font-size="11" font-weight="900" font-family="${F}">${DAYS_EN[i]}</text><text x="75" y="${y+58}" text-anchor="middle" fill="${t.text}" font-size="26" font-weight="900" font-family="${F}">${it.date}</text><text x="140" y="${y+50}" fill="${t.text}" font-size="17" font-weight="900" font-family="${F}">${it.text||""}</text>${it.time?`<text x="770" y="${y+50}" text-anchor="end" fill="${t.accent}" font-size="14" font-weight="900" font-family="${F}">${it.time}</text>`:""}</g>`;}
    if(designId==="cyber"){const y=78+i*84;return `<g><rect x="30" y="${y}" width="770" height="72" rx="2" fill="${t.card}" stroke="${t.accent}" stroke-width="2" stroke-opacity="${live?0.5:0.25}"/><rect x="30" y="${y}" width="4" height="72" fill="${t.accent}" opacity="${live?0.6:0.2}"/><rect x="38" y="${y+4}" width="90" height="64" rx="2" fill="${t.accent}" opacity="0.14"/><text x="83" y="${y+26}" text-anchor="middle" fill="${t.spark}" font-size="10" font-weight="700" font-family="${MO}">${DAYS_EN[i]}</text><text x="83" y="${y+52}" text-anchor="middle" fill="${t.text}" font-size="22" font-weight="900" font-family="${MO}">${it.date}</text>${live?`<rect x="140" y="${y+36}" width="6" height="6" rx="3" fill="#EF4444" opacity="0.8"/>`:""}<text x="155" y="${y+44}" fill="${t.text}" font-size="15" font-weight="700" font-family="${MO}">${it.text||"---"}</text>${it.time?`<text x="775" y="${y+44}" text-anchor="end" fill="${t.spark}" font-size="14" font-weight="700" font-family="${MO}">&lt;${it.time}&gt;</text>`:""}</g>`;}
    if(designId==="pastel"){const y=112+i*82;return `<g><rect x="35" y="${y}" width="750" height="72" rx="18" fill="${t.card}" stroke="${t.accent}" stroke-width="2" stroke-opacity="0.3"/><rect x="45" y="${y+10}" width="80" height="52" rx="26" fill="${c2}" opacity="0.15"/><text x="85" y="${y+30}" text-anchor="middle" fill="${t.accent}" font-size="10" font-weight="700" font-family="${F}">${DAYS_EN[i]}</text><text x="85" y="${y+50}" text-anchor="middle" fill="${t.text}" font-size="18" font-weight="900" font-family="${F}">${it.date}</text><text x="142" y="${y+46}" fill="${t.text}" font-size="16" font-weight="700" font-family="${F}">${it.text||""}</text>${it.time?`<rect x="630" y="${y+22}" width="130" height="30" rx="15" fill="${t.accent}" opacity="0.1"/><text x="695" y="${y+42}" text-anchor="middle" fill="${t.accent}" font-size="13" font-weight="700" font-family="${F}">${it.time}</text>`:""}</g>`;}
    if(designId==="galaxy"){const y=106+i*82;return `<g><rect x="35" y="${y}" width="750" height="72" rx="10" fill="${dk?t.card:'rgba(15,10,40,0.7)'}" stroke="${t.accent}" stroke-width="2.5" stroke-opacity="0.55"/><rect x="35" y="${y}" width="95" height="72" rx="10" fill="${t.accent}" opacity="0.1"/><text x="82" y="${y+28}" text-anchor="middle" fill="${t.spark}" font-size="10" font-weight="700" font-family="${F}">${DAYS_EN[i]}</text><text x="82" y="${y+52}" text-anchor="middle" fill="${dk?t.text:'#e2e8f0'}" font-size="20" font-weight="900" font-family="${F}">${it.date}</text><text x="150" y="${y+45}" fill="${dk?t.text:'#e2e8f0'}" font-size="16" font-weight="700" font-family="${F}">${it.text||""}</text>${it.time?`<rect x="630" y="${y+20}" width="130" height="32" rx="16" fill="${t.accent}" opacity="0.12"/><text x="695" y="${y+42}" text-anchor="middle" fill="${t.spark}" font-size="14" font-weight="700" font-family="${F}">${it.time}</text>`:""}</g>`;}
    if(designId==="grunge"){const y=74+i*86;return `<g><rect x="25" y="${y}" width="770" height="76" rx="2" fill="${dk?t.card:'rgba(40,40,40,0.85)'}" stroke="${t.accent}" stroke-width="${live?3:2.5}" stroke-opacity="${live?0.6:0.4}"/><rect x="25" y="${y}" width="6" height="76" rx="1" fill="${t.accent}" opacity="${live?0.7:0.3}"/><rect x="38" y="${y+6}" width="85" height="64" rx="2" fill="${t.accent}" opacity="0.16"/><text x="80" y="${y+28}" text-anchor="middle" fill="${t.accent}" font-size="11" font-weight="900" font-family="${F}" opacity="0.6">${DAYS_EN[i]}</text><text x="80" y="${y+56}" text-anchor="middle" fill="${dk?t.text:'#ddd'}" font-size="24" font-weight="900" font-family="${F}">${it.date}</text><text x="140" y="${y+48}" fill="${dk?t.text:'#ccc'}" font-size="16" font-weight="700" font-family="${F}">${it.text||""}</text>${it.time?`<text x="770" y="${y+48}" text-anchor="end" fill="${t.accent}" font-size="14" font-weight="900" font-family="${F}" opacity="0.6">[ ${it.time} ]</text>`:""}</g>`;}
    // clean, pop, elegant, wamodern
    const offY={clean:116,pop:118,elegant:108,wamodern:106}[designId]||116;
    const y=offY+i*82;const rx={pop:"6",wamodern:"0",elegant:"0"}[designId]||"8";
    const df=["wamodern","elegant"].includes(designId)?"'Georgia',serif":F;
    return `<g><rect x="40" y="${y}" width="740" height="72" rx="${rx}" fill="${t.card}" opacity="${i>=5?0.5:1}" stroke="${t.accent}" stroke-width="${designId==='pop'?2.5:designId==='elegant'?1.5:2}" stroke-opacity="${designId==='pop'?0.35:0.25}"/><rect x="40" y="${y}" width="${designId==='pop'?95:90}" height="72" rx="${rx}" fill="${t.accent}" opacity="${i>=5?0.1:designId==='pop'?0.08:0.05}"/><text x="${designId==='pop'?82:85}" y="${y+28}" text-anchor="middle" fill="${t.accent}" font-size="${designId==='pop'?11:10}" font-weight="700" font-family="${df}">${DAYS_EN[i]}</text><text x="${designId==='pop'?82:85}" y="${y+52}" text-anchor="middle" fill="${t.text}" font-size="${designId==='pop'?22:20}" font-weight="900" font-family="${df}">${it.date}</text><text x="${designId==='pop'?148:150}" y="${y+45}" fill="${t.text}" font-size="16" font-weight="700" font-family="${F}">${it.text||""}</text>${it.time?`<text x="750" y="${y+45}" text-anchor="end" fill="${t.accent}" font-size="14" font-weight="700" font-family="${df}">${it.time}</text>`:""}</g>`;
  }).join("");

  let svg=`<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">`;

  if(designId==="kawaii") svg+=`<defs><linearGradient id="kbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${t.bg}"/><stop offset="100%" stop-color="${t.secondary}"/></linearGradient><radialGradient id="kgl1" cx="20%" cy="80%"><stop offset="0%" stop-color="${t.primary}" stop-opacity="0.60"/><stop offset="100%" stop-color="${t.primary}" stop-opacity="0"/></radialGradient><radialGradient id="kgl2" cx="80%" cy="20%"><stop offset="0%" stop-color="${t.accent}" stop-opacity="0.45"/><stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/></radialGradient></defs><rect width="1280" height="720" fill="url(#kbg)"/><rect width="1280" height="720" fill="url(#kgl1)"/><rect width="1280" height="720" fill="url(#kgl2)"/>${mo([...Array(18)].map((_,i)=>`<rect x="${-200+i*110}" y="-50" width="55" height="900" fill="${i%2===0?t.primary:t.accent}" opacity="0.09" transform="rotate(-25,640,360)"/>`))}${mo([...Array(22)].map((_,i)=>lin(-100+i*90,0,-100+i*90+400,720,t.primary,35,0.04)))}${mo([[80,600,70],[300,650,55],[550,620,65],[750,660,45],[180,60,40],[500,40,50]].map(([cx,cy,r])=>`<ellipse cx="${cx}" cy="${cy}" rx="${r*1.8}" ry="${r*.7}" fill="${dk?t.secondary:'white'}" opacity="0.3"/><ellipse cx="${cx-r*.6}" cy="${cy-r*.25}" rx="${r}" ry="${r*.55}" fill="${dk?t.secondary:'white'}" opacity="0.3"/>`))}
  <path d="M-80,720 A350,230 0 0,1 380,720" fill="none" stroke="${t.primary}" stroke-width="18" opacity="0.21"/><path d="M-50,720 A320,200 0 0,1 360,720" fill="none" stroke="${t.accent}" stroke-width="12" opacity="0.21"/><path d="M-20,720 A290,170 0 0,1 340,720" fill="none" stroke="${t.spark}" stroke-width="8" opacity="0.18"/>
  ${mo([[120,80],[630,690],[340,40],[700,100],[60,400],[580,30]].map(([x,y],i)=>`${cir(x,y,7+i%3,i%2===0?t.accent:t.spark,0.15)}${lin(x,y+7+i%3,x,y+20+i%3,t.primary,2,0.15)}`))}
  ${mo([[250,200,18],[500,500,14],[150,450,12],[650,150,10],[400,350,16]].map(([x,y,s],i)=>star4(x,y,s,i%4===0?c1:i%4===1?c2:i%4===2?c3:c4,0.12+i*0.01)))}
  <rect x="12" y="12" width="1256" height="696" rx="16" fill="none" stroke="${dk?t.primary:'white'}" stroke-width="2.5" opacity="0.25" stroke-dasharray="10,5"/>${rows}
  <rect x="820" y="40" width="420" height="640" rx="28" fill="${dk?t.secondary:'white'}" opacity="0.35" stroke="${t.primary}" stroke-width="2" stroke-opacity="0.4"/>
  ${mo([[880,120,55],[990,210,75],[1110,330,60],[950,450,50],[1070,540,40],[870,350,35]].map(([cx,cy,r],i)=>cir(cx,cy,r,i%3===0?t.primary:i%3===1?t.accent:t.spark,0.05+i*0.006)))}
  ${mo([[870,90,9],[1180,140,7],[900,460,8],[1160,560,6],[1050,100,7],[880,350,8],[1190,420,6],[960,620,7],[1120,280,5],[850,200,6]].map(([x,y,s],i)=>star4(x,y,s,i%4===0?c1:i%4===1?c2:i%4===2?c3:c4,0.18)))}
  ${mo([[885,105,.8],[1175,155,.6],[905,455,.7],[1140,350,.5]].map(([x,y,sc])=>`<path d="M${x},${y+10*sc}C${x},${y+10*sc} ${x-14*sc},${y-6*sc} ${x-14*sc},${y-14*sc}C${x-14*sc},${y-22*sc} ${x-7*sc},${y-26*sc} ${x},${y-18*sc}C${x+7*sc},${y-26*sc} ${x+14*sc},${y-22*sc} ${x+14*sc},${y-14*sc}C${x+14*sc},${y-6*sc} ${x},${y+10*sc} ${x},${y+10*sc}Z" fill="${t.accent}" opacity="0.3"/>`))}
  ${mo([[920,80,1],[1170,500,.8],[1080,130,.6]].map(([x,y,s])=>`<ellipse cx="${x-12}" cy="${y}" rx="12" ry="8" fill="${t.accent}" opacity="0.38"/><ellipse cx="${x+12}" cy="${y}" rx="12" ry="8" fill="${t.accent}" opacity="0.38"/>`))}
  <path d="M1000,280L1012,255L1025,275L1038,250L1050,275L1062,255L1075,280Z" fill="none" stroke="${t.accent}" stroke-width="2" opacity="0.4"/>
  ${mo([[1150,240],[870,580],[1020,440]].map(([x,y])=>`${cir(x,y,5,t.spark,0.12)}${lin(x+5,y,x+5,y-20,t.spark,2,0.12)}`))}
  ${cir(1030,350,100,"none",0)}${rcs(1030-100,350-100,200,200,t.accent,1.5,0.1)}
  <text x="30" y="706" fill="${t.accent}" font-size="13" font-family="${F}" opacity="0.25">✨ ${range}</text>`;

  else if(designId==="clean") svg+=`<defs><linearGradient id="clbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${t.bg}"/><stop offset="100%" stop-color="${dk?t.bg:t.secondary}" stop-opacity="0.45"/></linearGradient></defs><rect width="1280" height="720" fill="url(#clbg)"/>
  ${mo([...Array(25)].map((_,i)=>lin(-100+i*72,0,-100+i*72+400,720,t.primary,0.8,0.05)))}${mo([...Array(25)].map((_,i)=>lin(1380-i*72,0,1380-i*72-400,720,t.primary,0.8,0.04)))}
  ${mo([...Array(20)].map((_,i)=>mo([...Array(10)].map((_,j)=>cir(35+i*66,35+j*72,1.3,t.primary,0.1)))))}
  ${rcf(0,0,7,720,t.accent,1)}${rcf(7,0,2,720,t.primary,0.15)}${rcf(10,0,1,720,t.accent,0.06)}
  ${rcs(600,580,90,90,t.primary,1.5,0.06,3)}${rcs(650,610,50,50,t.accent,1,0.04,2)}${rcs(720-25,45-25,50,50,t.primary,1.5,0.06)}
  <polygon points="100,660 130,610 160,660" fill="none" stroke="${t.primary}" stroke-width="1.2" opacity="0.18"/>
  <polygon points="350,680 370,650 390,680" fill="none" stroke="${t.accent}" stroke-width="1" opacity="0.14"/>
  <text x="40" y="62" fill="${t.text}" font-size="30" font-weight="900" font-family="${F}" letter-spacing="2">${title||"WEEKLY SCHEDULE"}</text><text x="40" y="88" fill="${t.accent}" font-size="15" font-weight="700" font-family="${F}">${range}</text>${lin(40,102,780,102,t.primary,1.5,0.2)}${rows}
  ${lin(810,0,810,720,t.primary,1,0.1)}
  ${cir(1040,300,220,"none",0)}${rcs(1040-220,300-220,440,440,t.primary,0.8,0.05)}${rcs(1040-180,300-180,360,360,t.primary,1.5,0.08)}${rcs(1040-140,300-140,280,280,t.accent,1,0.06)}${cir(1040,300,100,t.primary,0.02)}${cir(1040,300,60,t.primary,0.02)}
  ${lin(820,300,1260,300,t.primary,0.5,0.06)}${lin(1040,80,1040,520,t.primary,0.5,0.06)}
  ${mo([[880,130],[1180,450],[900,540],[1160,110],[950,80],[1120,560],[840,400]].map(([x,y])=>`${lin(x-7,y,x+7,y,t.accent,1.5,0.08)}${lin(x,y-7,x,y+7,t.accent,1.5,0.08)}`))}
  <polygon points="950,520 975,480 1000,520" fill="none" stroke="${t.primary}" stroke-width="1.2" opacity="0.21"/>
  <polygon points="1120,160 1145,125 1170,160" fill="none" stroke="${t.accent}" stroke-width="1.2" opacity="0.21"/>
  <polygon points="870,250 890,220 910,250" fill="none" stroke="${t.primary}" stroke-width="1" opacity="0.18"/>
  ${mo([560,580,600,620,640].map(y=>lin(860,y,1220,y,t.primary,0.5,0.04)))}
  ${mo([0,1,2,3,4].map(i=>cir(870+i*95,660,3.5-i*0.4,t.accent,0.2-i*0.03)))}`;

  else if(designId==="pop") svg+=`<defs><radialGradient id="ppgl" cx="30%" cy="70%"><stop offset="0%" stop-color="${t.primary}" stop-opacity="0.45"/><stop offset="100%" stop-color="${t.primary}" stop-opacity="0"/></radialGradient></defs><rect width="1280" height="720" fill="${t.bg}"/><rect width="1280" height="720" fill="url(#ppgl)"/>
  ${mo([...Array(14)].map((_,i)=>`<rect x="${-300+i*140}" y="-100" width="70" height="1000" fill="${i%3===0?t.primary:i%3===1?t.accent:t.spark}" opacity="${i%3===0?0.10:0.07}" transform="rotate(-30,640,360)"/>`))}${cir(400,800,600,"none",0)}${rcs(400-600,800-600,1200,1200,t.accent,80,0.04)}${rcs(400-450,800-450,900,900,t.primary,50,0.03)}
  <path d="M0,0 L60,35 L120,0 L180,35 L240,0 L300,35 L360,0 L420,35 L480,0 L540,35 L600,0 L660,35 L720,0 L780,35 L840,0 L900,35 L960,0 L1020,35 L1080,0 L1140,35 L1200,0 L1260,35 L1280,25 L1280,0Z" fill="${t.primary}" opacity="0.24"/>
  <path d="M0,720 L60,685 L120,720 L180,685 L240,720 L300,685 L360,720 L420,685 L480,720 L540,685 L600,720 L660,685 L720,720 L780,685 L840,720 L900,685 L960,720 L1020,685 L1080,720 L1140,685 L1200,720 L1260,685 L1280,695 L1280,720Z" fill="${t.primary}" opacity="0.21"/>
  <path d="M0,620 Q160,550 320,620 Q480,690 640,620 Q800,550 960,620 Q1120,690 1280,620 L1280,720 L0,720Z" fill="${t.primary}" opacity="0.18"/>
  ${mo([[50,200,7],[150,580,9],[300,100,6],[650,680,8],[400,40,7],[730,600,5],[250,400,6],[550,150,8],[100,350,5],[480,620,7],[680,50,6],[360,280,5]].map(([x,y,r],i)=>cir(x,y,r,i%4===0?c1:i%4===1?c2:i%4===2?c3:t.accent,0.1+i*0.006)))}
  ${mo([[200,300,14],[500,650,12],[700,80,10],[400,500,8],[120,600,11]].map(([x,y,s],i)=>`<polygon points="${x},${y-s} ${x+s*.25},${y-s*.35} ${x+s},${y-s*.1} ${x+s*.4},${y+s*.2} ${x+s*.6},${y+s} ${x},${y+s*.55} ${x-s*.6},${y+s} ${x-s*.4},${y+s*.2} ${x-s},${y-s*.1} ${x-s*.25},${y-s*.35}" fill="${i%4===0?c1:i%4===1?c2:i%4===2?c3:c4}" opacity="${0.08+i*0.01}"/>`))}
  ${mo([[120,450],[620,40],[50,100],[720,520]].map(([x,y],i)=>`${rcf(x-2.5,y,5,18,t.accent,0.1+i*0.02,2.5)}${cir(x,y+24,3,t.accent,0.1+i*0.02)}`))}
  <text x="45" y="64" fill="${t.accent}" font-size="36" font-weight="900" font-family="${F}" letter-spacing="-1">${title||"WEEKLY"}</text><text x="45" y="92" fill="${t.text}" font-size="16" font-weight="700" font-family="${F}" opacity="0.45">${range}</text>${rcf(45,100,60,4,t.accent,0.3,2)}${rows}
  ${rcf(820,30,430,660,t.primary,0.04)}${rcs(820,30,430,660,t.accent,3,0.12)}
  <polygon points="1030,200 1042,165 1060,188 1088,175 1070,200 1092,218 1065,218 1052,248 1040,218 1010,218 1028,200 1008,182" fill="${t.accent}" opacity="0.24"/>
  <polyline points="860,310 895,285 930,310 965,285 1000,310 1035,285 1070,310 1105,285 1140,310 1175,285 1210,310" fill="none" stroke="${t.accent}" stroke-width="2.5" opacity="0.24"/>
  <path d="M920,450L940,415L952,445L980,422L972,458L1005,445L992,475L1015,480L992,498L1010,520L978,508L968,530L950,505L928,520L935,495L908,500L925,478L902,462Z" fill="none" stroke="${t.accent}" stroke-width="2.5" opacity="0.24"/>
  <path d="M1140,90L1118,148L1148,142L1122,210" fill="none" stroke="${t.accent}" stroke-width="3" opacity="0.3"/>
  ${mo([[870,80,22],[1180,110,18],[860,570,16],[1190,600,14],[950,550,12],[1120,80,10]].map(([x,y,r],i)=>cir(x,y,r,i%2===0?t.accent:t.primary,0.1+i*0.01)))}
  <polygon points="880,100 925,100 902,65" fill="${t.accent}" opacity="0.3"/>
  ${mo([...Array(16)].map((_,i)=>cir(840+((i*43+20)%400),50+((i*59+30)%620),3+i%3,i%4===0?c1:i%4===1?c2:i%4===2?c3:c4,0.1+i*0.005)))}`;

  else if(designId==="streamer") svg+=`<defs><linearGradient id="sG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${t.bg}"/><stop offset="50%" stop-color="${dk?t.bg:t.secondary}"/><stop offset="100%" stop-color="${t.bg}"/></linearGradient><radialGradient id="sggl" cx="20%" cy="40%"><stop offset="0%" stop-color="${t.accent}" stop-opacity="0.60"/><stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/></radialGradient></defs><rect width="1280" height="720" fill="url(#sG)"/><rect width="1280" height="720" fill="url(#sggl)"/>
  ${mo([...Array(8)].map((_,i)=>rcf(0,i*95,1280,48,i%2===0?t.primary:t.accent,0.04+i*0.005,4)))}${cir(0,0,350,t.accent,0.04)}${cir(1280,720,400,t.primary,0.035)}
  ${mo([...Array(14)].map((_,i)=>lin(i*100,0,i*100,720,t.primary,0.5,0.05)))}${mo([...Array(8)].map((_,i)=>lin(0,i*100,1280,i*100,t.primary,0.5,0.05)))}
  ${mo([[0,0,430,720],[1280,0,850,720]].map(([x1,y1,x2,y2])=>lin(x1,y1,x2,y2,t.accent,1,0.04)))}
  ${mo([[620,650,18],[700,100,14],[50,350,16],[750,400,12]].map(([cx,cy,s],i)=>{const pts=Array.from({length:6},(_,j)=>{const a=j*60*Math.PI/180;return `${cx+s*Math.cos(a)},${cy+s*Math.sin(a)}`;}).join(" ");return `<polygon points="${pts}" fill="none" stroke="${i%2===0?c1:c2}" stroke-width="1.5" opacity="${0.06+i*0.01}"/>`;}))}
  <polygon points="750,660 750,695 775,677" fill="${t.accent}" opacity="0.21"/>
  ${mo([0,1,2,3].map(i=>rcf(700+i*9,628-i*10,6,14+i*10,t.accent,0.05+i*0.01,1)))}
  ${rcf(70,575,55,34,t.accent,0.06,10)}<path d="M88,609L82,622L100,609" fill="${t.accent}" opacity="0.21"/>
  ${rcf(280,95,48,28,t.primary,0.04,8)}<path d="M318,123L324,134L312,123" fill="${t.primary}" opacity="0.14"/>
  ${rcf(155,618,50,20,t.accent,0.07,5)}${cir(167,628,3.5,"#ef4444",0.12)}
  <rect x="40" y="40" width="380" height="640" rx="16" fill="${dk?t.secondary:'white'}" opacity="0.25" stroke="${t.accent}" stroke-width="2" stroke-opacity="0.38"/>
  ${cir(230,360,60,"none",0)}${rcs(170,300,120,120,t.accent,1.5,0.12,60)}
  <rect x="460" y="25" width="790" height="62" rx="12" fill="${t.accent}" opacity="${dk?0.2:0.1}"/><text x="510" y="64" fill="${dk?t.primary:t.accent}" font-size="32" font-weight="900" font-family="${F}">${title||"配信スケジュール"}</text><rect x="1060" y="36" width="170" height="36" rx="18" fill="${t.accent}" opacity="0.12"/><text x="1145" y="60" text-anchor="middle" fill="${dk?t.primary:t.accent}" font-size="16" font-weight="700" font-family="${F}">${range}</text>${rows}`;

  else if(designId==="pixel") svg+=`<rect width="1280" height="720" fill="${t.bg}"/>${mo([...Array(18)].map((_,i)=>mo([...Array(10)].map((_,j)=>(i+j)%2===0?rcf(i*72,j*72,72,72,t.primary,0.06):""))))}${mo([...Array(180)].map((_,i)=>lin(0,i*4,1280,i*4,t.primary,1,0.025)))}
  ${rcs(4,4,1272,712,t.accent,4,1)}${rcs(10,10,1260,700,t.primary,1,0.15)}
  ${mo([0,1,2,3].map(i=>{const x=i<2?18:1246,y=i%2===0?18:686;return `${rcf(x,y,8,8,t.accent,0.15)}${rcf(x+(i<2?10:-6),y,4,4,t.accent,0.1)}${rcf(x,y+(i%2===0?10:-6),4,4,t.accent,0.1)}`;}))}
  ${mo([[700,650],[340,690],[580,20]].map(([bx,by])=>mo([[0,0],[4,0],[8,0],[12,0],[0,4],[12,4],[0,8],[4,8],[8,8],[12,8]].map(([dx,dy])=>rcf(bx+dx,by+dy,4,4,t.accent,0.12)))))}
  ${mo([[140,680],[400,30]].map(([bx,by])=>mo([[4,0],[8,0],[0,4],[4,4],[8,4],[12,4],[4,8],[8,8]].map(([dx,dy])=>rcf(bx+dx,by+dy,4,4,t.accent,0.1)))))}
  ${mo([[200,690]].map(([bx,by])=>mo([[4,-8],[8,-8],[12,-8],[0,-4],[4,-4],[8,-4],[12,-4],[16,-4],[4,0],[8,0],[12,0],[8,4]].map(([dx,dy],i)=>rcf(bx+dx,by+dy,4,4,i<5?t.accent:t.spark,0.08)))))}
  <rect x="25" y="18" width="620" height="46" fill="${t.accent}" opacity="0.12"/><text x="38" y="48" fill="${t.accent}" font-size="24" font-weight="900" font-family="${MO}" letter-spacing="3">&gt; ${title||"WEEKLY SCHEDULE"}</text><text x="1230" y="48" text-anchor="end" fill="${t.text}" font-size="16" font-weight="700" font-family="${MO}" opacity="0.45">[${range}]</text>${rows}
  <rect x="840" y="78" width="400" height="430" fill="${t.card}" stroke="${t.accent}" stroke-width="2" stroke-opacity="0.2"/>
  ${mo([...Array(10)].map((_,i)=>lin(840+i*40,78,840+i*40,508,t.primary,1,0.05)))}${mo([...Array(11)].map((_,i)=>lin(840,78+i*43,1240,78+i*43,t.primary,1,0.05)))}
  ${mo([[860,98],[900,98],[940,98],[860,138],[940,138],[860,178],[900,178],[940,178],[980,98],[980,178],[860,218],[940,218]].map(([x,y])=>rcf(x,y,36,36,t.accent,0.06)))}
  ${mo([[0,0],[4,4],[8,8],[12,12],[16,16],[20,20],[-4,8],[4,16]].map(([dx,dy])=>rcf(1100+dx,120+dy,4,4,t.spark,0.1)))}
  ${rcs(880,418,110,10,t.primary,1,0.12)}${rcf(881,419,75,8,t.spark,0.12)}
  <text x="865" y="416" fill="${t.spark}" font-size="9" font-family="${MO}" opacity="0.2">HP</text>
  ${rcs(880,438,110,10,t.primary,1,0.12)}${rcf(881,439,50,8,t.accent,0.12)}
  <text x="865" y="436" fill="${t.accent}" font-size="9" font-family="${MO}" opacity="0.2">MP</text>
  ${rcf(840,530,400,60,t.accent,0.05)}<text x="858" y="558" fill="${t.spark}" font-size="12" font-family="${MO}" opacity="0.35">[AVATAR_ZONE]</text>
  ${rcf(840,620,400,55,t.card,1)}${rcs(840,620,400,55,t.primary,2,0.1)}
  <text x="858" y="654" fill="${t.accent}" font-size="14" font-family="${MO}">&gt; チャンネル登録よろしく!_</text>`;

  else if(designId==="elegant") svg+=`<defs><linearGradient id="eG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${t.bg}"/><stop offset="100%" stop-color="${dk?t.bg:t.secondary}"/></linearGradient><linearGradient id="eg2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${t.primary}" stop-opacity="0.54"/><stop offset="50%" stop-color="${t.primary}" stop-opacity="0"/><stop offset="100%" stop-color="${t.primary}" stop-opacity="0.54"/></linearGradient></defs><rect width="1280" height="720" fill="url(#eG)"/><rect width="1280" height="720" fill="url(#eg2)"/>
  ${mo([...Array(20)].map((_,i)=>lin(i*85,0,i*85-360,720,t.accent,0.5,0.09)))}${mo([...Array(20)].map((_,i)=>lin(i*85,0,i*85+360,720,t.accent,0.5,0.09)))}<ellipse cx="400" cy="200" rx="500" ry="300" fill="${t.primary}" opacity="0.03"/><ellipse cx="900" cy="500" rx="400" ry="250" fill="${t.accent}" opacity="0.025"/>
  <path d="M20,20L100,20L100,24L24,24L24,100L20,100Z" fill="${t.accent}" opacity="0.3"/><path d="M1260,20L1180,20L1180,24L1256,24L1256,100L1260,100Z" fill="${t.accent}" opacity="0.3"/><path d="M20,700L100,700L100,696L24,696L24,620L20,620Z" fill="${t.accent}" opacity="0.3"/><path d="M1260,700L1180,700L1180,696L1256,696L1256,620L1260,620Z" fill="${t.accent}" opacity="0.3"/>
  ${rcs(20,20,1240,680,t.accent,0.5,0.12)}${rcs(28,28,1224,664,t.accent,0.3,0.06)}
  ${mo([[380,692],[680,692],[530,692],[240,692]].map(([x,y])=>`<path d="M${x},${y-14}C${x-4},${y-10} ${x-10},${y-7} ${x-10},${y}C${x-10},${y+5} ${x-5},${y+7} ${x},${y+5}C${x+5},${y+7} ${x+10},${y+5} ${x+10},${y}C${x+10},${y-7} ${x+4},${y-10} ${x},${y-14}Z" fill="${t.accent}" opacity="0.24"/>`))}
  ${mo([[100,200],[200,350],[300,500],[600,180],[500,380],[700,520]].map(([x,y])=>`<path d="M${x},${y}Q${x+15},${y-12} ${x+30},${y}Q${x+15},${y+12} ${x},${y}" fill="none" stroke="${t.accent}" stroke-width="0.8" opacity="0.14"/>`))}
  <path d="M280,28Q305,18 330,30Q310,24 295,30" fill="none" stroke="${t.accent}" stroke-width="1" opacity="0.24"/>
  <path d="M480,28Q455,18 430,30Q450,24 465,30" fill="none" stroke="${t.accent}" stroke-width="1" opacity="0.24"/>
  <text x="400" y="55" text-anchor="middle" fill="${t.text}" font-size="13" font-family="'Georgia',serif" letter-spacing="6" opacity="0.35">${(title||"WEEKLY SCHEDULE").toUpperCase()}</text><text x="400" y="76" text-anchor="middle" fill="${t.accent}" font-size="11" font-family="'Georgia',serif" letter-spacing="4" opacity="0.25">${range}</text>${lin(160,90,640,90,t.accent,0.5,0.12)}${cir(160,90,2,t.accent,0.1)}${cir(640,90,2,t.accent,0.1)}${rows}
  ${rcs(830,50,400,620,t.accent,1,0.1)}
  ${mo([[870,100,20],[1170,130,16],[870,520,18],[1170,560,14],[1020,90,12],[1040,540,10],[920,300,14],[1140,380,12]].map(([x,y,s])=>`<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="1" fill="none" stroke="${t.accent}" stroke-width="1" opacity="0.3" transform="rotate(45,${x+s/2},${y+s/2})"/>`))}
  <path d="M890,180Q915,155 940,180Q965,205 940,230" fill="none" stroke="${t.accent}" stroke-width="1.2" opacity="0.24"/>
  <path d="M1120,400Q1145,375 1170,400Q1195,425 1170,450" fill="none" stroke="${t.accent}" stroke-width="1.2" opacity="0.21"/>
  <path d="M975,310Q965,285 982,272Q1000,260 1015,275" fill="none" stroke="${t.accent}" stroke-width="1" opacity="0.24"/>
  <path d="M1085,310Q1095,285 1078,272Q1060,260 1045,275" fill="none" stroke="${t.accent}" stroke-width="1" opacity="0.24"/>
  ${cir(1030,340,85,"none",0)}${rcs(1030-85,340-85,170,170,t.primary,0.5,0.08)}
  <path d="M860,656Q950,640 1030,656Q1110,672 1200,656" fill="none" stroke="${t.accent}" stroke-width="1" opacity="0.3"/>`;

  else if(designId==="comic") svg+=`<rect width="1280" height="720" fill="${t.bg}"/>${mo([...Array(12)].map((_,i)=>mo([...Array(7)].map((_,j)=>cir(55+i*110+(j%2)*55,55+j*110,22+((i+j)%3)*5,(i+j)%4===0?c1:(i+j)%4===1?c2:(i+j)%4===2?c3:c4,0.04+((i+j)%3)*0.01)))))}${mo([...Array(30)].map((_,i)=>{const a=(i/30)*Math.PI*0.75+0.15;return lin(1280,0,1280-Math.cos(a)*1500,Math.sin(a)*1500,t.primary,1.8+i*0.12,0.025+i*0.0015);}))}
  ${mo([...Array(8)].map((_,i)=>mo([...Array(6)].map((_,j)=>{const x=50+i*95,y=100+j*105,r=3+(i+j)%4;return cir(x,y,r,t.primary,0.03+((i+j)%3)*0.01);}))))}
  ${rcs(8,8,1264,704,t.accent,4.5,0.18,4)}
  <text x="650" y="700" fill="${c1}" font-size="32" font-weight="900" font-family="${F}" opacity="0.15" transform="rotate(-8,650,700)">ドドド</text>
  <text x="40" y="695" fill="${c2}" font-size="24" font-weight="900" font-family="${F}" opacity="0.13" transform="rotate(5,40,695)">ゴゴゴ</text>
  <text x="420" y="710" fill="${c3}" font-size="18" font-weight="900" font-family="${F}" opacity="0.12" transform="rotate(-3,420,710)">バーン！</text>
  ${mo([[350,38,10],[680,680,8],[200,600,7]].map(([x,y,s])=>`<polygon points="${x},${y-s} ${x+s*.3},${y-s*.4} ${x+s},${y-s*.15} ${x+s*.45},${y+s*.25} ${x+s*.65},${y+s} ${x},${y+s*.6} ${x-s*.65},${y+s} ${x-s*.45},${y+s*.25} ${x-s},${y-s*.15} ${x-s*.3},${y-s*.4}" fill="${t.accent}" opacity="0.21"/>`))}
  ${rcf(28,10,480,34,t.accent,0.12,2)}<text x="38" y="34" fill="${t.accent}" font-size="20" font-weight="900" font-family="${F}" letter-spacing="2">${title||"WEEKLY SCHEDULE"}</text><text x="530" y="34" fill="${t.text}" font-size="14" font-weight="700" font-family="${F}" opacity="0.35">${range}</text>${rows}
  ${mo([...Array(80)].map((_,i)=>cir(845+(i%8)*52,55+Math.floor(i/8)*66,2.5+(i*3)%4,t.accent,0.035)))}
  <ellipse cx="960" cy="535" rx="65" ry="42" fill="none" stroke="${t.accent}" stroke-width="3.5" opacity="0.35"/><path d="M915,570L892,618L945,592" fill="${t.accent}" opacity="0.3"/>
  <text x="960" y="542" text-anchor="middle" fill="${t.accent}" font-size="16" font-weight="900" font-family="${F}" opacity="0.14">LIVE!</text>
  <ellipse cx="905" cy="175" rx="45" ry="28" fill="none" stroke="${t.accent}" stroke-width="2" opacity="0.24"/>
  ${cir(882,215,7,"none",0)}${rcs(875,208,14,14,t.accent,1.5,0.06)}${cir(870,234,4,"none",0)}${rcs(866,230,8,8,t.accent,1,0.05)}
  <text x="1080" y="155" fill="${c1}" font-size="55" font-weight="900" font-family="${F}" opacity="0.15" transform="rotate(-10,1080,155)">！</text>
  <text x="1140" y="290" fill="${c2}" font-size="35" font-weight="900" font-family="${F}" opacity="0.12" transform="rotate(8,1140,290)">ドン</text>
  ${lin(835,350,1255,350,t.accent,2.5,0.06)}${lin(1040,55,1040,350,t.accent,2.5,0.05)}`;

  else if(designId==="wamodern"){let arcs="";for(let row=0;row<10;row++)for(let col=0;col<6;col++){const x=830+col*70+(row%2)*35,y=35+row*62;arcs+=`<path d="M${x},${y+32}A32,32 0 0,1 ${x+32},${y}A32,32 0 0,1 ${x+64},${y+32}" fill="none" stroke="${[c1,c2,c3,c4][row%4]}" stroke-width="0.8" opacity="${0.05+row*0.005}"/>`;} let asa="";for(let i=0;i<6;i++)for(let j=0;j<5;j++){const cx=60+i*140,cy=100+j*130;asa+=`${lin(cx,cy-22,cx-20,cy+12,t.accent,1,0.04)}${lin(cx,cy-22,cx+20,cy+12,t.accent,1,0.04)}${lin(cx-20,cy+12,cx+20,cy+12,t.accent,1,0.04)}${lin(cx,cy-22,cx,cy+12,t.accent,0.5,0.02)}`;} let sakura="";[[200,50],[500,680],[720,30],[100,650],[380,120],[600,580],[150,350],[680,350],[900,580],[1100,120],[1180,400],[960,250],[1050,500]].forEach(([x,y],i)=>{const op=i<8?0.06+i*0.005:0.07+i*0.008;const sc=i<8?0.8+i*0.05:1.3;sakura+=`<g opacity="${op}" transform="translate(${x},${y}) rotate(${i*45}) scale(${sc})"><ellipse cx="0" cy="-6" rx="4.5" ry="9" fill="${t.accent}"/><ellipse cx="-5" cy="2" rx="4.5" ry="9" fill="${t.accent}" transform="rotate(72)"/><ellipse cx="5" cy="2" rx="4.5" ry="9" fill="${t.accent}" transform="rotate(-72)"/></g>`;});
  svg+=`<defs><radialGradient id="wmgl" cx="30%" cy="70%"><stop offset="0%" stop-color="${t.primary}" stop-opacity="0.60"/><stop offset="100%" stop-color="${t.primary}" stop-opacity="0"/></radialGradient></defs><rect width="1280" height="720" fill="${t.bg}"/><rect width="1280" height="720" fill="url(#wmgl)"/>${rcf(0,100,1280,80,t.primary,0.055)}${rcf(0,350,1280,100,t.accent,0.05)}${rcf(0,580,1280,70,t.primary,0.025)}<ellipse cx="200" cy="360" rx="120" ry="350" fill="${t.primary}" opacity="0.03"/><ellipse cx="650" cy="360" rx="100" ry="320" fill="${t.accent}" opacity="0.025"/>${asa}
  <g opacity="0.14" transform="translate(650,645) scale(1.2)"><rect x="-28" y="0" width="5" height="35" fill="${t.accent}"/><rect x="23" y="0" width="5" height="35" fill="${t.accent}"/><rect x="-34" y="-5" width="68" height="5" rx="2" fill="${t.accent}"/><rect x="-31" y="2" width="62" height="3.5" fill="${t.accent}"/></g>
  ${mo([0,1,2,3,4].map(i=>`<path d="M${i*80},720 A40,40 0 0,1 ${i*80+40},680 A40,40 0 0,1 ${i*80+80},720" fill="none" stroke="${t.accent}" stroke-width="0.8" opacity="${0.04+i*0.005}"/>`))}
  ${rcs(15,15,1250,690,t.accent,1.5,0.1)}
  ${mo([[15,40,15,15,40,15],[1245,15,1265,15,1265,40],[15,680,15,705,40,705],[1245,705,1265,705,1265,680]].map(([x1,y1,x2,y2,x3,y3])=>`${lin(x1,y1,x2,y2,t.accent,2.5,0.15)}${lin(x2,y2,x3,y3,t.accent,2.5,0.15)}`))}
  <text x="50" y="56" fill="${t.text}" font-size="26" font-weight="900" font-family="'Georgia',serif" letter-spacing="4">${title||"週間予定"}</text><text x="50" y="80" fill="${t.accent}" font-size="13" font-family="${F}" opacity="0.4">${range}</text>${lin(50,92,780,92,t.accent,1,0.1)}${rows}${arcs}${sakura}
  ${rcs(830,40,420,640,t.accent,1.5,0.07)}
  ${cir(1035,630,24,"none",0)}${rcs(1035-24,630-24,48,48,t.accent,1,0.1,24)}<text x="1035" y="636" text-anchor="middle" fill="${t.accent}" font-size="13" font-family="serif" opacity="0.12">和</text>`;}

  else if(designId==="cyber") svg+=`<defs><linearGradient id="cbg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stop-color="${t.bg}"/><stop offset="60%" stop-color="${dk?t.bg:t.secondary}"/><stop offset="100%" stop-color="${t.bg}"/></linearGradient><radialGradient id="cgl1" cx="15%" cy="85%"><stop offset="0%" stop-color="${t.accent}" stop-opacity="0.45"/><stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/></radialGradient><radialGradient id="cgl2" cx="90%" cy="10%"><stop offset="0%" stop-color="${t.spark}" stop-opacity="0.60"/><stop offset="100%" stop-color="${t.spark}" stop-opacity="0"/></radialGradient></defs><rect width="1280" height="720" fill="url(#cbg)"/><rect width="1280" height="720" fill="url(#cgl1)"/><rect width="1280" height="720" fill="url(#cgl2)"/>
  ${mo([...Array(24)].map((_,i)=>rcf(((i*137+50)%800),i*30,100+((i*73)%300),2+i%4,i%4===0?c1:i%4===1?c2:i%4===2?c3:c4,0.06+i*0.003)))}${cir(200,600,350,t.accent,0.05)}${cir(1100,150,300,t.spark,0.04)}
  ${mo([...Array(14)].map((_,i)=>lin(640,720,i*110-40,0,t.primary,0.8,0.04)))}${mo([...Array(12)].map((_,i)=>lin(0,380+i*32,1280,380+i*32,t.primary,0.8,0.02+i*0.003)))}
  ${mo([[0,180,400,4],[200,350,300,5],[500,50,250,3],[0,520,600,4],[700,280,200,3],[300,450,350,3],[100,620,500,2]].map(([x,y,w,h],i)=>rcf(x,y,w,h,t.accent,0.06+i*0.005)))}
  ${mo([...Array(90)].map((_,i)=>lin(0,i*8,1280,i*8,t.primary,0.5,0.015)))}
  <text x="30" y="700" fill="${t.primary}" font-size="9" font-family="${MO}" opacity="0.2">0x4F2A 0xBE91 0x7C3D 0xA5F0 0x1D8E</text>
  <text x="500" y="710" fill="${t.accent}" font-size="8" font-family="${MO}" opacity="0.18">&gt;&gt;&gt; SYS_ONLINE &lt;&lt;&lt;</text>
  ${mo([620,660,700,740,780].map((x,i)=>`<text x="${x}" y="${95+i*28}" fill="${t.primary}" font-size="8" font-family="${MO}" opacity="0.14">${["10110","01101","11010","00111","10101"][i%5]}</text>`))}
  <text x="30" y="680" fill="${t.primary}" font-size="7" font-family="${MO}" opacity="0.16">PACKET:0x7F2B STATUS:200 LATENCY:12ms</text>
  ${rcs(4,4,1272,712,t.accent,2,0.2)}${rcf(30,15,500,45,t.accent,0.08)}${rcf(30,15,4,45,t.accent,0.35)}
  <text x="48" y="44" fill="${t.accent}" font-size="22" font-weight="900" font-family="${MO}" letter-spacing="2">${title||"SCHEDULE://LIVE"}</text><text x="1240" y="44" text-anchor="end" fill="${t.spark}" font-size="14" font-weight="700" font-family="${MO}" opacity="0.5">[${range}]</text>${lin(30,65,780,65,t.accent,2,0.15)}${lin(30,67,780,67,t.spark,1,0.08)}${rows}
  ${rcf(830,50,420,620,t.card,0.3,4)}${rcs(830,50,420,620,t.accent,1.5,0.15,4)}
  <path d="M860,80L860,200L920,200L920,280L880,280" fill="none" stroke="${t.accent}" stroke-width="1.5" opacity="0.3"/>
  <path d="M1200,100L1200,180L1140,180L1140,250" fill="none" stroke="${t.accent}" stroke-width="1.5" opacity="0.3"/>
  <path d="M960,400L1060,400L1060,480L1120,480" fill="none" stroke="${t.primary}" stroke-width="1" opacity="0.24"/>
  <path d="M880,280L880,340L940,340" fill="none" stroke="${t.accent}" stroke-width="1" opacity="0.21"/>
  ${mo([[860,80],[860,200],[920,200],[920,280],[880,280],[1200,100],[1200,180],[1140,250],[960,400],[1060,480],[1120,480],[880,340],[940,340]].map(([x,y],i)=>cir(x,y,3,[c1,c2,c3,c4][i%4],0.15)))}
  ${rcs(970,220,55,55,t.accent,1.5,0.1,4)}
  ${mo([0,1,2,3].map(i=>`${lin(980+i*12,220,980+i*12,208,t.accent,1,0.08)}${lin(980+i*12,275,980+i*12,287,t.accent,1,0.08)}`))}
  ${mo([[870,320,85,28],[1140,350,95,22],[900,520,105,22],[1100,560,85,20],[950,360,60,18],[1060,300,70,18]].map(([x,y,w,h],i)=>`${rcf(x,y,w,h,[c1,c2,c3,c4][i%4],0.04+i*0.005)}${rcs(x,y,w,h,t.accent,0.8,0.1)}`))}
  <text x="875" y="340" fill="${t.spark}" font-size="7" font-family="${MO}" opacity="0.1">STREAM_DATA_OK</text>
  <text x="875" y="355" fill="${t.primary}" font-size="7" font-family="${MO}" opacity="0.2">PKT:0x7F2B STAT:200</text>
  <text x="1040" y="650" text-anchor="middle" fill="${t.spark}" font-size="10" font-family="${MO}" opacity="0.2">&lt;AVATAR_SLOT/&gt;</text>`;

  else if(designId==="pastel") svg+=`<defs><linearGradient id="pbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${t.bg}"/><stop offset="50%" stop-color="${t.secondary}"/><stop offset="100%" stop-color="${t.bg}"/></linearGradient><radialGradient id="pglow1" cx="15%" cy="80%"><stop offset="0%" stop-color="${t.primary}" stop-opacity="0.57"/><stop offset="100%" stop-color="${t.primary}" stop-opacity="0"/></radialGradient><radialGradient id="pglow2" cx="85%" cy="15%"><stop offset="0%" stop-color="${t.accent}" stop-opacity="0.45"/><stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/></radialGradient></defs><rect width="1280" height="720" fill="url(#pbg)"/><rect width="1280" height="720" fill="url(#pglow1)"/><rect width="1280" height="720" fill="url(#pglow2)"/>
  <path d="M0,300 Q320,240 640,300 Q960,360 1280,300 L1280,720 L0,720Z" fill="${t.primary}" opacity="0.06"/><path d="M0,400 Q320,340 640,400 Q960,460 1280,400 L1280,720 L0,720Z" fill="${t.accent}" opacity="0.055"/><path d="M0,500 Q320,450 640,500 Q960,550 1280,500 L1280,720 L0,720Z" fill="${t.spark}" opacity="0.03"/>${cir(250,580,200,t.primary,0.06)}${cir(700,150,180,t.accent,0.05)}${cir(500,400,250,t.spark,0.03)}
  ${mo([[100,620,85],[320,665,65],[560,640,75],[160,55,55],[420,35,45],[670,65,50],[750,650,40]].map(([cx,cy,r])=>`<ellipse cx="${cx}" cy="${cy}" rx="${r*1.8}" ry="${r}" fill="${dk?t.secondary:'white'}" opacity="0.36"/><ellipse cx="${cx-r*.5}" cy="${cy-r*.3}" rx="${r*.9}" ry="${r*.6}" fill="${dk?t.secondary:'white'}" opacity="0.36"/>`))}
  <path d="M-120,720A750,420 0 0,1 850,720" fill="none" stroke="${t.primary}" stroke-width="45" opacity="0.12"/>
  <path d="M-80,720A710,390 0 0,1 830,720" fill="none" stroke="${t.accent}" stroke-width="30" opacity="0.1"/>
  ${mo([[180,300],[480,100],[700,550],[350,600],[120,450],[550,250],[680,400],[250,150]].map(([x,y],i)=>{let p="";[0,72,144,216,288].forEach(a=>{p+=`<ellipse cx="${x+Math.cos(a*Math.PI/180)*9}" cy="${y+Math.sin(a*Math.PI/180)*9}" rx="5.5" ry="3.2" fill="${t.accent}" opacity="${0.07+i*0.005}" transform="rotate(${a},${x+Math.cos(a*Math.PI/180)*9},${y+Math.sin(a*Math.PI/180)*9})"/>`;});p+=cir(x,y,3.5,t.primary,0.07+i*0.005);return p;}))}
  ${mo([[580,80],[120,500],[400,50]].map(([x,y],i)=>`<ellipse cx="${x-9}" cy="${y-5}" rx="8" ry="11" fill="${[c1,c2,c3,c4][i%4]}" opacity="${0.06+i*0.01}"/><ellipse cx="${x+9}" cy="${y-5}" rx="8" ry="11" fill="${[c1,c2,c3,c4][i%4]}" opacity="${0.06+i*0.01}"/><ellipse cx="${x-6}" cy="${y+6}" rx="5.5" ry="7.5" fill="${t.primary}" opacity="${0.05+i*0.008}"/><ellipse cx="${x+6}" cy="${y+6}" rx="5.5" ry="7.5" fill="${t.primary}" opacity="${0.05+i*0.008}"/>`))}
  ${mo([[70,200,18],[200,400,12],[650,100,15],[500,550,10],[720,450,12],[320,50,8],[600,650,10]].map(([x,y,r],i)=>cir(x,y,r,i%4===0?c1:i%4===1?c2:i%4===2?c3:c4,0.08+i*0.006)))}
  ${rcs(16,16,1248,688,dk?t.primary:"white",2,0.22,20)}
  <text x="50" y="60" fill="${t.accent}" font-size="28" font-weight="900" font-family="${F}" opacity="0.8">${title||"Weekly Schedule"}</text><text x="50" y="84" fill="${t.text}" font-size="14" font-weight="700" font-family="${F}" opacity="0.35">${range}</text>
  ${mo([0,1,2].map(i=>cir(55+i*14,96,3.5,t.accent,0.25-i*0.06)))}${rows}
  <rect x="820" y="40" width="420" height="640" rx="24" fill="${dk?t.secondary:'white'}" opacity="0.28" stroke="${t.primary}" stroke-width="1.5" stroke-opacity="0.3"/>
  ${mo([[920,150,65],[1080,280,85],[960,430,55],[1120,520,45],[1040,120,35],[880,580,40],[1180,400,30],[1000,340,50]].map(([cx,cy,r],i)=>cir(cx,cy,r,i%3===0?t.primary:i%3===1?t.accent:t.spark,0.045+i*0.005)))}
  ${mo([[880,200],[1150,350],[950,500],[1070,150],[1020,450]].map(([x,y],i)=>{let p="";[0,72,144,216,288].forEach(a=>{p+=`<ellipse cx="${x+Math.cos(a*Math.PI/180)*7}" cy="${y+Math.sin(a*Math.PI/180)*7}" rx="4.5" ry="2.8" fill="${[c1,c2,c3,c4][i%4]}" opacity="${0.08+i*0.008}" transform="rotate(${a},${x+Math.cos(a*Math.PI/180)*7},${y+Math.sin(a*Math.PI/180)*7})"/>`;});p+=cir(x,y,3,t.primary,0.08+i*0.008);return p;}))}
  ${mo([[870,100,6],[1180,170,7],[900,500,5],[1160,600,6],[1060,80,6],[950,360,5],[1130,420,4],[870,300,5],[1200,250,4],[980,580,5]].map(([x,y,s])=>star4(x,y,s,t.spark,0.18)))}`;

  else if(designId==="galaxy"){let stars="";for(let i=0;i<120;i++){stars+=cir(Math.sin(i*7.3)*620+640,Math.cos(i*5.1)*350+360,0.4+(i%5)*0.5,i%4===0?t.spark:i%4===1?"white":i%4===2?t.primary:t.accent,0.12+(i%6)*0.06);}
  svg+=`<defs><linearGradient id="gbg" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="${dk?t.bg:'#0c0a1d'}"/><stop offset="40%" stop-color="${dk?t.secondary:'#1a103a'}"/><stop offset="100%" stop-color="${dk?t.bg:'#0a0818'}"/></linearGradient><radialGradient id="gneb1" cx="22%" cy="62%"><stop offset="0%" stop-color="${t.accent}" stop-opacity="0.54"/><stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/></radialGradient><radialGradient id="gneb2" cx="82%" cy="28%"><stop offset="0%" stop-color="${t.primary}" stop-opacity="0.52"/><stop offset="100%" stop-color="${t.primary}" stop-opacity="0"/></radialGradient><radialGradient id="gneb3" cx="55%" cy="88%"><stop offset="0%" stop-color="${t.spark}" stop-opacity="0.45"/><stop offset="100%" stop-color="${t.spark}" stop-opacity="0"/></radialGradient><radialGradient id="gneb4" cx="75%" cy="55%"><stop offset="0%" stop-color="${t.accent}" stop-opacity="0.60"/><stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/></radialGradient></defs><rect width="1280" height="720" fill="url(#gbg)"/><rect width="1280" height="720" fill="url(#gneb1)"/><rect width="1280" height="720" fill="url(#gneb2)"/><rect width="1280" height="720" fill="url(#gneb3)"/><rect width="1280" height="720" fill="url(#gneb4)"/>
  <ellipse cx="640" cy="360" rx="850" ry="130" fill="${t.primary}" opacity="0.09" transform="rotate(-15,640,360)"/>
  <ellipse cx="640" cy="360" rx="650" ry="70" fill="white" opacity="0.08" transform="rotate(-15,640,360)"/>
  ${stars}
  ${lin(80,40,200,78,"white",1.5,0.25)}${cir(80,40,2.5,"white",0.5)}${lin(700,25,760,50,"white",1.2,0.15)}${cir(700,25,2,"white",0.35)}${lin(400,680,350,700,"white",1,0.1)}${cir(400,680,1.5,"white",0.25)}
  <path d="M400,690Q425,660 450,672Q475,685 460,710" fill="none" stroke="${t.primary}" stroke-width="1.2" opacity="0.18"/>
  ${cir(580,650,4,t.spark,0.1)}${lin(580,650,630,665,t.spark,3,0.06)}
  ${mo([[200,580,100,40],[500,100,120,35],[700,620,80,30]].map(([cx,cy,rx,ry],i)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${i%2===0?t.accent:t.primary}" opacity="${0.02+i*0.005}"/>`))}
  ${rcs(14,14,1252,692,t.primary,1,0.12,12)}
  <text x="45" y="55" fill="${t.spark}" font-size="26" font-weight="900" font-family="${F}" opacity="0.9" letter-spacing="1">${title||"WEEKLY SCHEDULE"}</text><text x="45" y="78" fill="${t.primary}" font-size="13" font-weight="700" font-family="${F}" opacity="0.45">${range}</text>
  ${mo([0,1,2,3,4].map(i=>cir(48+i*8,90,2,t.spark,0.4-i*0.07)))}${rows}
  <rect x="820" y="40" width="420" height="640" rx="16" fill="rgba(255,255,255,0.02)" stroke="${t.primary}" stroke-width="1" stroke-opacity="0.3"/>
  ${mo([[880,120,950,180],[950,180,1020,150],[1020,150,1080,220],[1080,220,1150,170]].map(([x1,y1,x2,y2])=>lin(x1,y1,x2,y2,t.spark,0.8,0.18)))}
  ${mo([[900,350,980,400],[980,400,1060,380],[1060,380,1120,440]].map(([x1,y1,x2,y2])=>lin(x1,y1,x2,y2,t.primary,0.8,0.12)))}
  ${mo([[880,120],[950,180],[1020,150],[1080,220],[1150,170],[900,350],[980,400],[1060,380],[1120,440]].map(([x,y],i)=>cir(x,y,i<5?3:2.5,i<5?t.spark:t.primary,0.3+i*0.02)))}
  ${cir(1050,550,45,t.accent,0.05)}${rcs(1050-45,550-45,90,90,t.primary,1,0.12)}
  <ellipse cx="1050" cy="550" rx="70" ry="10" fill="none" stroke="${t.spark}" stroke-width="1.2" opacity="0.3" transform="rotate(-20,1050,550)"/>
  ${cir(900,260,14,t.primary,0.04)}${rcs(900-14,260-14,28,28,t.spark,0.6,0.1)}
  <circle cx="905" cy="256" r="10" fill="${dk?t.bg:'#0c0a1d'}" opacity="0.6"/>`;}

  else if(designId==="grunge") svg+=`<defs><linearGradient id="grbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${dk?t.bg:'#1a1a1a'}"/><stop offset="100%" stop-color="${dk?t.secondary:'#111111'}"/></linearGradient><radialGradient id="grgl" cx="30%" cy="40%"><stop offset="0%" stop-color="${t.accent}" stop-opacity="0.60"/><stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/></radialGradient></defs><rect width="1280" height="720" fill="url(#grbg)"/><rect width="1280" height="720" fill="url(#grgl)"/>
  ${mo([...Array(12)].map((_,i)=>rcf(0,i*62,1280,30+i%15,dk?t.primary:[c1,c2,c4,"#444"][i%4],0.07+i*0.004)))}${rcf(0,0,1280,180,t.accent,0.06)}${rcf(0,0,1280,80,t.accent,0.04)}${rcf(0,0,200,720,"black",0.08)}${rcf(1080,0,200,720,"black",0.06)}
  ${mo([...Array(50)].map((_,i)=>`<rect x="${Math.sin(i*3.7)*600+640}" y="${Math.cos(i*2.9)*350+360}" width="${18+i%35}" height="${2+i%3}" fill="${dk?t.primary:'#333'}" opacity="${0.04+i*0.001}" transform="rotate(${i*17},${Math.sin(i*3.7)*600+640},${Math.cos(i*2.9)*350+360})"/>`))}
  ${mo([[30,0,250,720],[180,0,400,720],[600,0,820,720],[950,0,1170,720],[1100,0,1280,600],[400,720,100,0],[800,720,500,0]].map(([x1,y1,x2,y2],i)=>lin(x1,y1,x2,y2,dk?t.primary:[c1,c2,"#333"][i%3],1+i*0.3,0.05+i*0.006)))}
  ${mo([[100,100,35],[700,50,25],[50,600,30],[750,680,22],[350,30,18],[600,690,20]].map(([x,y,r],i)=>cir(x,y,r,[c1,c2,c3,c4][i%4],0.05+i*0.005)))}
  ${mo([[180,680],[320,680],[460,680],[600,680]].map(([x,y],i)=>`<ellipse cx="${x}" cy="${y}" rx="14" ry="9" fill="none" stroke="${t.accent}" stroke-width="2.5" opacity="${0.05+i*0.008}"/>`))}
  <g opacity="0.18">${lin(0,658,800,658,t.accent,2,1)}${mo([60,160,260,360,460,560,660,760].map(x=>`${lin(x-5,653,x+5,663,t.accent,2,1)}${lin(x+5,653,x-5,663,t.accent,2,1)}`))}</g>
  <text x="520" y="712" fill="${t.accent}" font-size="18" font-weight="900" font-family="${F}" opacity="0.18" transform="rotate(-3,520,712)">UNDERGROUND</text>
  <text x="100" y="700" fill="${t.primary}" font-size="12" font-weight="900" font-family="${F}" opacity="0.14" transform="rotate(2,100,700)">NO LIMITS</text>
  ${rcf(0,0,12,720,t.accent,0.14)}${rcf(12,0,3,500,t.accent,0.07)}${rcf(1268,0,12,720,t.accent,0.1)}${rcf(1265,200,3,520,t.accent,0.05)}
  <path d="M0,65L45,58L90,68L135,55L180,65L225,52L270,62L315,55L360,68L405,58L450,65L495,54L540,62L585,56L630,68L675,55L720,62L765,58L800,65L800,0L0,0Z" fill="${t.accent}" opacity="0.21"/>
  <text x="30" y="48" fill="${dk?t.text:'#ddd'}" font-size="32" font-weight="900" font-family="${F}" letter-spacing="-1" opacity="0.9">${title||"WEEKLY SCHEDULE"}</text>${lin(30,58,370,58,t.accent,3.5,0.4)}<text x="380" y="52" fill="${t.accent}" font-size="15" font-weight="700" font-family="${F}" opacity="0.4">${range}</text>${rows}
  ${rcf(825,30,425,660,dk?t.card:"rgba(30,30,30,0.6)",1,2)}${rcs(825,30,425,660,t.accent,2.5,0.15,2)}
  ${lin(855,75,1215,610,t.accent,2,0.05)}${lin(1215,75,855,610,t.accent,2,0.05)}
  ${rcs(1035-55,200-55,110,110,t.accent,3,0.1)}${rcs(1035-35,200-35,70,70,t.accent,1.5,0.06)}${rcs(1035-15,200-15,30,30,t.accent,1,0.04)}
  ${lin(1035,135,1035,265,t.accent,1.5,0.08)}${lin(970,200,1100,200,t.accent,1.5,0.08)}
  <g opacity="0.21" transform="translate(950,450) scale(1.1)"><circle cx="0" cy="-5" r="18" fill="none" stroke="${t.accent}" stroke-width="2.5"/><rect x="-13" y="6" width="26" height="12" rx="5" fill="none" stroke="${t.accent}" stroke-width="2"/><circle cx="-7" cy="-8" r="3.5" fill="${t.accent}"/><circle cx="7" cy="-8" r="3.5" fill="${t.accent}"/></g>
  ${mo([[880,290,90],[1165,240,115],[920,500,65],[1145,475,80],[870,400,50],[1190,350,60]].map(([x,y,h],i)=>`<rect x="${x}" y="${y}" width="${3+i%2}" height="${h}" fill="${t.accent}" opacity="${0.06+i*0.012}" rx="1.5"/>`))}
  ${rcs(865,575,90,35,t.accent,2.5,0.08,3)}<text x="910" y="598" text-anchor="middle" fill="${t.accent}" font-size="11" font-weight="900" font-family="${F}" opacity="0.2">TAG</text>
  ${mo([...Array(25)].map((_,i)=>cir(860+((i*67)%360),340+((i*43)%280),1.5+i%3,t.accent,0.05+i*0.004)))}`;

  svg+=imgTag+`</svg>`;
  return svg;
}


/* ════════════════════════════════════════
   EXPORT MODAL
   ════════════════════════════════════════ */
function ExportModal({svgString,onClose,accent,dark,title,range}){
  const[tab,setTab]=useState("png");const[pngUrl,setPngUrl]=useState(null);const[status,setStatus]=useState("loading");
  const svgB64="data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(svgString)));
  useEffect(()=>{setStatus("loading");setPngUrl(null);const im=new Image();im.onload=()=>{try{const c=document.createElement("canvas");c.width=1280;c.height=720;c.getContext("2d").drawImage(im,0,0,1280,720);setPngUrl(c.toDataURL("image/png"));setStatus("done");}catch{setStatus("error");}};im.onerror=()=>setStatus("error");im.src=svgB64;},[svgString]);
  const bg="rgba(0,0,0,0.5)",pBg="white",tx="#1e293b";
  return(<div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:bg,backdropFilter:"blur(6px)"}} onClick={onClose}><div style={{background:pBg,borderRadius:20,maxWidth:720,width:"92%",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.4)"}} onClick={e=>e.stopPropagation()}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px 0"}}><div style={{fontWeight:900,fontSize:20,color:accent}}>📥 画像を保存</div><button onClick={onClose} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:tx,opacity:.5}}>✕</button></div>
    <div style={{display:"flex",gap:8,padding:"16px 24px 0"}}>{[{id:"png",label:"🖼️ PNG"},{id:"svg",label:"✏️ SVG"}].map(x=>(<button key={x.id} onClick={()=>setTab(x.id)} style={{flex:1,padding:"12px",borderRadius:12,border:tab===x.id?`2px solid ${accent}`:`2px solid ${"#e2e8f0"}`,background:tab===x.id?`${accent}15`:"transparent",cursor:"pointer",fontFamily:"inherit",fontWeight:900,fontSize:15,color:tab===x.id?accent:tx}}>{x.label}</button>))}</div>
    <div style={{padding:"16px 24px 24px"}}>
      {tab==="png"&&(<div>{status==="loading"&&<div style={{textAlign:"center",padding:40,color:tx,opacity:.6}}>⏳ PNG生成中...</div>}{status==="done"&&pngUrl&&<div><div style={{borderRadius:12,overflow:"hidden",border:`2px solid ${accent}30`,marginBottom:16}}><img src={pngUrl} alt="PNG" style={{width:"100%",display:"block"}}/></div><a href={pngUrl} download={exportFilename(title,range,"png")} style={{display:"block",textAlign:"center",padding:"14px",borderRadius:12,background:accent,color:"white",fontWeight:900,fontSize:16,textDecoration:"none",marginBottom:14,boxShadow:`0 4px 16px ${accent}40`}}>⬇️ PNGをダウンロード</a><div style={{background:"#f1f5f9",borderRadius:12,padding:16}}><div style={{fontWeight:700,fontSize:14,color:accent,marginBottom:8}}>💡 ダウンロードできない場合</div><div style={{fontSize:13,color:tx,opacity:.7,lineHeight:1.8}}><strong>スマホ：</strong>画像を長押し → 保存<br/><strong>PC：</strong>右クリック → 名前を付けて保存</div></div></div>}{status==="error"&&<div style={{textAlign:"center",padding:30,color:"#ef4444"}}>PNG変換失敗。SVGタブをお試しください。</div>}</div>)}
      {tab==="svg"&&(<div><div style={{borderRadius:12,overflow:"hidden",border:`2px solid ${accent}30`,marginBottom:16}}><img src={svgB64} alt="SVG" style={{width:"100%",display:"block"}}/></div><a href={svgB64} download={exportFilename(title,range,"svg")} style={{display:"block",textAlign:"center",padding:"14px",borderRadius:12,background:accent,color:"white",fontWeight:900,fontSize:16,textDecoration:"none",marginBottom:14,boxShadow:`0 4px 16px ${accent}40`}}>⬇️ SVGをダウンロード</a><div style={{background:"#f1f5f9",borderRadius:12,padding:16,marginBottom:12}}><div style={{fontWeight:700,fontSize:14,color:accent,marginBottom:8}}>💡 ダウンロードできない場合</div><div style={{fontSize:13,color:tx,opacity:.7,lineHeight:1.8}}><strong>PC：</strong>画像を右クリック → 名前を付けて保存 → .svg に<br/><strong>スマホ：</strong>画像を長押し → 保存</div></div><div style={{background:`${accent}08`,borderRadius:12,padding:16,border:`1px solid ${accent}20`}}><div style={{fontWeight:700,fontSize:13,color:accent,marginBottom:6}}>✏️ SVGで編集可能</div><div style={{fontSize:12,color:tx,opacity:.6,lineHeight:1.7}}>Illustrator / Inkscape / Figma でVTuberモデルを配置したり自由に編集できます。</div></div></div>)}
    </div></div></div>);
}

/* ════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════ */
export default function WeeklyScheduleMaker(){
  const[design,setDesign]=useState("kawaii");const[themeIdx,setThemeIdx]=useState(0);const[uploadedImg,setUploadedImg]=useState(null);
  const[title,setTitle]=useState("");const[startDate,setStartDate]=useState(()=>{const m=getMonday(new Date());return m.toISOString().split("T")[0];});
  const[schedule,setSchedule]=useState(emptySchedule);
  const[tab,setTab]=useState("design");const[showExport,setShowExport]=useState(false);
  const[myTemplates,setMyTemplates]=useState([]);const[saveName,setSaveName]=useState("");const[importJson,setImportJson]=useState("");const[toast,setToast]=useState("");

  const notify=(m)=>{setToast(m);setTimeout(()=>setToast(""),2500);};
  useEffect(()=>{try{const r=localStorage.getItem("my-templates");if(r)setMyTemplates(JSON.parse(r));}catch{}},[]);
  const persist=async(list)=>{setMyTemplates(list);try{localStorage.setItem("my-templates",JSON.stringify(list));}catch{notify("⚠️ 保存に失敗しました（ブラウザのストレージ制限の可能性）");}};

  const theme=THEMES[themeIdx];const dark=isDk(theme);
  const monday=new Date(startDate+"T00:00:00");const sunday=new Date(monday);sunday.setDate(monday.getDate()+6);
  const range=`${fmtDate(monday)} ー ${fmtDate(sunday)}`;
  const fullSch=schedule.map((s,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return{...s,date:d.getDate()};});

  const upd=(i,k,v)=>setSchedule(p=>{const n=[...p];n[i]={...n[i],[k]:v};return n;});
  const exportStr=buildExportSVG({designId:design,t:theme,sch:fullSch,range,title,img:uploadedImg});
  const Preview=PREVIEW[design];

  const saveT=async()=>{const s={name:saveName||"無題",design,themeIdx,title,schedule:[...schedule],createdAt:new Date().toISOString()};await persist([s,...myTemplates]);setSaveName("");notify("✅ 保存しました！");};
  const loadT=(t)=>{setDesign(t.design||"kawaii");setThemeIdx(t.themeIdx??0);setTitle(t.title||"");setSchedule(t.schedule||emptySchedule());notify("📂 読み込みました");};
  const delT=async(i)=>{await persist(myTemplates.filter((_,j)=>j!==i));notify("🗑️ 削除");};
  const expT=(t)=>{navigator.clipboard?.writeText(JSON.stringify(t,null,2)).then(()=>notify("📋 コピー")).catch(()=>notify("失敗"));};
  const impT=async()=>{try{const p=parseTemplateJson(importJson,{designIds:DESIGNS.map(d=>d.id),themeCount:THEMES.length});p.createdAt=new Date().toISOString();await persist([p,...myTemplates]);setImportJson("");notify("✅ インポート完了");}catch{notify("❌ JSON形式エラー");}};

  const pBg="#f8fafc",pTx="#1e293b",bd="rgba(0,0,0,0.08)",iBg="white",iBd="#e2e8f0";

  return(
    <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:F}}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;700;900&display=swap" rel="stylesheet"/>
      {showExport&&<ExportModal svgString={exportStr} onClose={()=>setShowExport(false)} accent={theme.accent} dark={dark} title={title} range={range}/>}
      {toast&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:2000,background:"white",color:pTx,padding:"12px 24px",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",fontWeight:700,fontSize:14,border:`2px solid ${theme.accent}40`}}>{toast}</div>}

      <div style={{background:"rgba(255,255,255,0.9)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${bd}`,padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:26}}>📅</span><div><div style={{fontWeight:900,fontSize:17,color:theme.accent,letterSpacing:1}}>配信スケジュールメーカー</div><div style={{fontSize:10,color:pTx,opacity:.5}}>VTuber / YouTube Live</div></div></div>
        <button onClick={()=>setShowExport(true)} style={{background:theme.accent,color:"white",border:"none",borderRadius:10,padding:"10px 28px",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 16px ${theme.accent}40`}}>📥 画像を保存</button>
      </div>

      <div style={{display:"flex",maxWidth:1600,margin:"0 auto"}}>
        <div style={{width:380,minWidth:380,background:pBg,borderRight:`1px solid ${bd}`,minHeight:"calc(100vh - 60px)",overflowY:"auto"}}>
          <div style={{display:"flex",borderBottom:`1px solid ${bd}`}}>
            {[{id:"design",l:"🎨 デザイン"},{id:"schedule",l:"📝 予定"},{id:"templates",l:"💾 テンプレ"}].map(x=>(
              <button key={x.id} onClick={()=>setTab(x.id)} style={{flex:1,padding:"13px 4px",border:"none",background:tab===x.id?"white":"transparent",borderBottom:tab===x.id?`3px solid ${theme.accent}`:"3px solid transparent",color:tab===x.id?theme.accent:pTx,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",opacity:tab===x.id?1:.5}}>{x.l}</button>
            ))}
          </div>
          <div style={{padding:20}}>
            {tab==="design"&&(<div>
              <div style={{fontSize:13,fontWeight:700,color:pTx,marginBottom:10,opacity:.6}}>デザインテンプレート</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24}}>
                {DESIGNS.map(d=>(<button key={d.id} onClick={()=>setDesign(d.id)} style={{padding:"12px 10px",borderRadius:12,border:design===d.id?`2px solid ${theme.accent}`:`2px solid ${iBd}`,background:design===d.id?`${theme.accent}15`:iBg,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}><div style={{fontWeight:900,fontSize:14,color:design===d.id?theme.accent:pTx}}>{d.name}</div><div style={{fontSize:10,color:pTx,opacity:.5,marginTop:1}}>{d.desc}</div></button>))}
              </div>
              <div style={{fontSize:13,fontWeight:700,color:pTx,marginBottom:10,opacity:.6}}>カラーテーマ</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
                {THEMES.map((x,i)=>(<button key={x.id} onClick={()=>setThemeIdx(i)} style={{width:"100%",aspectRatio:"1",borderRadius:14,border:themeIdx===i?`3px solid ${x.accent}`:"3px solid transparent",background:`linear-gradient(135deg,${x.primary},${x.accent})`,cursor:"pointer",position:"relative",boxShadow:themeIdx===i?`0 4px 12px ${x.accent}40`:"none"}}>{themeIdx===i&&<div style={{position:"absolute",inset:0,borderRadius:11,border:"2px solid white",opacity:.6}}/>}</button>))}
              </div>
              <div style={{textAlign:"center",fontSize:13,color:theme.accent,fontWeight:700,marginBottom:20}}>{theme.name}</div>
              <div style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:pTx,marginBottom:8,opacity:.6}}>タイトル</div><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Weekly Schedule" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${iBd}`,background:iBg,fontSize:15,fontFamily:"inherit",color:pTx,boxSizing:"border-box",outline:"none"}}/></div>
              <div style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:pTx,marginBottom:8,opacity:.6}}>開始日（自動で月曜に調整）</div><input type="date" value={startDate} onChange={e=>{const v=e.target.value;const snapped=snapToMondayStr(v);setStartDate(snapped||v);}} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${iBd}`,background:iBg,fontSize:14,fontFamily:"inherit",color:pTx,boxSizing:"border-box",outline:"none"}}/><div style={{fontSize:11,color:pTx,opacity:.4,marginTop:5}}>どの曜日を選んでも、その週の月曜日に自動調整されます</div></div>
              <div style={{background:`${theme.accent}06`,borderRadius:14,padding:14,border:`1px solid ${theme.accent}15`}}>
                <div style={{fontSize:13,fontWeight:700,color:pTx,marginBottom:6,opacity:.6}}>🖼️ カスタム画像（任意）</div>
                <div style={{fontSize:11,color:pTx,opacity:.35,marginBottom:8}}>モデル配置エリアに画像を重ねて表示</div>
                <label style={{display:"flex",alignItems:"center",justifyContent:"center",height:uploadedImg?100:44,borderRadius:10,border:`1.5px dashed ${theme.accent}40`,background:`${theme.accent}05`,cursor:"pointer"}}>
                  {uploadedImg?<img src={uploadedImg} alt="" style={{maxHeight:90,maxWidth:"100%",borderRadius:8,objectFit:"contain"}}/>:<span style={{fontSize:13,color:theme.accent,fontWeight:700}}>+ 画像を選択</span>}
                  <input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setUploadedImg(ev.target.result);r.readAsDataURL(f);}} style={{display:"none"}}/>
                </label>
                {uploadedImg&&<button onClick={()=>setUploadedImg(null)} style={{marginTop:8,width:"100%",padding:"7px",borderRadius:8,border:"1px solid #ef444440",background:"#ef44440a",color:"#ef4444",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>画像を削除</button>}
              </div>
            </div>)}

            {tab==="schedule"&&(<div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:700,color:pTx,opacity:.6}}>各曜日の配信予定</div>
                <button onClick={()=>{if(schedule.some(s=>s.text||s.time)){if(!window.confirm("すべての予定をクリアしますか？"))return;}setSchedule(emptySchedule());notify("🧹 予定をクリアしました");}} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${iBd}`,background:"transparent",color:pTx,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit",opacity:.7}}>🧹 全消去</button>
              </div>
              {schedule.map((item,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return(
                <div key={i} style={{marginBottom:10,background:iBg,borderRadius:12,padding:12,border:`1px solid ${iBd}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <div style={{background:theme.accent,color:"white",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13}}>{d.getDate()}</div>
                    <div style={{fontWeight:700,fontSize:13,color:pTx}}>{DAYS_JA[i]}</div>
                  </div>
                  <input value={item.text} onChange={e=>upd(i,"text",e.target.value)} placeholder="配信内容" style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${iBd}`,background:"#f8fafc",fontSize:14,fontFamily:"inherit",color:pTx,marginBottom:6,boxSizing:"border-box",outline:"none"}}/>
                  <input value={item.time} onChange={e=>upd(i,"time",e.target.value)} placeholder="時間（例：20:00〜）" style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${iBd}`,background:"#f8fafc",fontSize:14,fontFamily:"inherit",color:pTx,boxSizing:"border-box",outline:"none"}}/>
                </div>);})}
            </div>)}

            {tab==="templates"&&(<div>
              <div style={{background:`${theme.accent}08`,borderRadius:14,padding:16,border:`1px solid ${theme.accent}20`,marginBottom:20}}>
                <div style={{fontWeight:900,fontSize:14,color:theme.accent,marginBottom:10}}>💾 現在の設定を保存</div>
                <input value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder="テンプレート名" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${iBd}`,background:iBg,fontSize:14,fontFamily:"inherit",color:pTx,boxSizing:"border-box",outline:"none",marginBottom:8}}/>
                <button onClick={saveT} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:theme.accent,color:"white",fontWeight:900,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>保存する</button>
              </div>
              <div style={{fontWeight:900,fontSize:14,color:pTx,marginBottom:10}}>📂 マイテンプレート ({myTemplates.length})</div>
              {myTemplates.length===0&&<div style={{textAlign:"center",padding:20,color:pTx,opacity:.4,fontSize:13}}>まだテンプレートがありません</div>}
              {myTemplates.map((tmpl,idx)=>(<div key={idx} style={{background:iBg,borderRadius:12,padding:12,border:`1px solid ${iBd}`,marginBottom:8}}>
                <div style={{fontWeight:900,fontSize:14,color:pTx,marginBottom:3}}>{tmpl.name}</div>
                <div style={{fontSize:11,color:pTx,opacity:.4,marginBottom:8}}>{DESIGNS.find(d=>d.id===tmpl.design)?.name||tmpl.design} / {THEMES[tmpl.themeIdx||0]?.name}</div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>loadT(tmpl)} style={{flex:1,padding:"7px",borderRadius:8,border:`1px solid ${theme.accent}40`,background:`${theme.accent}10`,color:theme.accent,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>📂 読込</button>
                  <button onClick={()=>expT(tmpl)} style={{flex:1,padding:"7px",borderRadius:8,border:`1px solid ${iBd}`,background:"transparent",color:pTx,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",opacity:.7}}>📋 JSON</button>
                  <button onClick={()=>delT(idx)} style={{padding:"7px 12px",borderRadius:8,border:"1px solid #ef444440",background:"#ef44440a",color:"#ef4444",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🗑️</button>
                </div>
              </div>))}
              <div style={{marginTop:20,background:`${theme.accent}05`,borderRadius:14,padding:16,border:`1px solid ${theme.accent}15`}}>
                <div style={{fontWeight:900,fontSize:14,color:theme.accent,marginBottom:8}}>📥 JSONインポート</div>
                <textarea value={importJson} onChange={e=>setImportJson(e.target.value)} placeholder="JSONを貼り付け" rows={3} style={{width:"100%",padding:"10px",borderRadius:10,border:`1.5px solid ${iBd}`,background:iBg,fontSize:12,fontFamily:MO,color:pTx,boxSizing:"border-box",outline:"none",resize:"vertical",marginBottom:8}}/>
                <button onClick={impT} disabled={!importJson.trim()} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:importJson.trim()?theme.accent:`${theme.accent}40`,color:"white",fontWeight:900,fontSize:14,cursor:importJson.trim()?"pointer":"default",fontFamily:"inherit",opacity:importJson.trim()?1:0.5}}>インポート</button>
              </div>
            </div>)}
          </div>
        </div>

        <div style={{flex:1,padding:24,display:"flex",alignItems:"flex-start",justifyContent:"center"}}>
          <div style={{width:"100%",maxWidth:1000}}>
            <div style={{fontSize:12,color:pTx,opacity:.4,marginBottom:8,fontWeight:700}}>プレビュー (1280×720) ・ 右エリア = VTuberモデル配置想定</div>
            <div style={{borderRadius:12,overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,0.1)",background:"white"}}>
              <Preview t={theme} sch={fullSch} range={range} title={title} dk={dark} img={uploadedImg}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
