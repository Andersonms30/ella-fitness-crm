"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const SUPABASE_URL = "https://sxwjyvpqsprwthyqtjzy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4d2p5dnBxc3Byd3RoeXF0anp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTgxMjQsImV4cCI6MjA5NzczNDEyNH0.XnNgcXtLjol_-51JN74H9WztMUsDTuAChwFgIaRKqUQ";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const G = {
  bg:"#07070f",surf:"#0f0f1a",card:"#13131f",bord:"#ffffff0d",bord2:"#ffffff16",
  pink:"#f472b6",rose:"#fb7185",violet:"#a78bfa",purple:"#7c3aed",
  green:"#34d399",amber:"#fbbf24",red:"#f87171",sky:"#38bdf8",
  muted:"#ffffff38",sub:"#ffffff65",text:"#f5f5ff"
};
const PAL=[G.pink,G.violet,G.green,G.amber,G.rose,G.sky,"#fb923c","#a3e635"];
const METHODS={pix:"PIX",debit:"Débito",credit:"Crédito",crediario:"Crediário"};
const MC={pix:G.green,debit:G.amber,credit:G.violet,crediario:G.rose};
const CUST_CATS={vip:"VIP",regular:"Regular",inactive:"Inativo",defaulter:"Inadimplente"};
const CUST_CAT_COLORS={vip:G.amber,regular:G.green,inactive:G.muted,defaulter:G.red};

const R=v=>`R$ ${Number(v||0).toFixed(2).replace(".",",")}`;
const pct=(a,b)=>b?((a/b)*100).toFixed(1)+"%":"—";
const TODAY=()=>new Date().toISOString().slice(0,10);
const INI=s=>(s||"?").trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
const fmtD=d=>d?new Date(d+"T12:00:00").toLocaleDateString("pt-BR"):"—";
const fmtMonth=d=>d?new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{month:"short",year:"numeric"}):"";
const addMonths=(ds,n)=>{const d=new Date(ds+"T12:00:00");d.setMonth(d.getMonth()+n);return d.toISOString().slice(0,10);};
const dueDateDay=(ref,mo,day)=>{const d=new Date(ref+"T12:00:00");d.setMonth(d.getMonth()+mo);d.setDate(parseInt(day)||10);return d.toISOString().slice(0,10);};
const daysDiff=(a,b)=>Math.ceil((new Date(b)-new Date(a))/(86400000));

// ── Primitives ────────────────────────────────────────────────
const Card=({children,style,onClick})=>(
  <div onClick={onClick} style={{background:G.card,border:`1px solid ${G.bord}`,borderRadius:14,padding:"16px 18px",...style,cursor:onClick?"pointer":undefined}}>{children}</div>
);
const Badge=({children,color})=>{const c=color||G.pink;return <span style={{background:c+"1e",color:c,border:`1px solid ${c}30`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{children}</span>;};
const Btn=({children,onClick,variant,small,full,disabled,style={}})=>{
  const bg=disabled?"#ffffff0e":variant==="danger"?G.red:variant==="success"?G.green:variant==="ghost"?"#ffffff0e":variant==="amber"?`linear-gradient(135deg,${G.amber},#f59e0b)`:variant==="pink"?`linear-gradient(135deg,${G.pink},${G.rose})`:variant==="green"?`linear-gradient(135deg,${G.green},#059669)`:`linear-gradient(135deg,${G.violet},${G.purple})`;
  return <button onClick={disabled?undefined:onClick} style={{background:bg,color:disabled?G.muted:"#fff",border:"none",borderRadius:9,padding:small?"5px 11px":"9px 18px",fontSize:small?12:14,fontWeight:700,cursor:disabled?"not-allowed":"pointer",width:full?"100%":undefined,flexShrink:0,...style}}>{children}</button>;
};
const iS={background:G.bg,color:G.text,border:`1px solid ${G.bord2}`,borderRadius:9,padding:"9px 12px",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
const Inp=({label,hint,...p})=>(<div style={{display:"flex",flexDirection:"column",gap:4}}>{label&&<span style={{color:G.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.8}}>{label}</span>}<input {...p} style={{...iS,...p.style}}/>{hint&&<span style={{color:G.muted,fontSize:11}}>{hint}</span>}</div>);
const Sel=({label,children,...p})=>(<div style={{display:"flex",flexDirection:"column",gap:4}}>{label&&<span style={{color:G.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.8}}>{label}</span>}<select {...p} style={{...iS,...p.style}}>{children}</select></div>);
const TA=({label,...p})=>(<div style={{display:"flex",flexDirection:"column",gap:4}}>{label&&<span style={{color:G.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.8}}>{label}</span>}<textarea {...p} style={{...iS,resize:"vertical",minHeight:60,...p.style}}/></div>);
const Divider=({my=12})=><div style={{height:1,background:G.bord,margin:`${my}px 0`}}/>;
const Spin=()=><div style={{display:"inline-block",width:16,height:16,border:`2px solid ${G.muted}`,borderTopColor:G.pink,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>;
function Toast({msg,color}){if(!msg)return null;return <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:color||G.violet,color:"#fff",padding:"10px 22px",borderRadius:10,fontWeight:700,fontSize:13,zIndex:3000,boxShadow:"0 4px 28px #0009",whiteSpace:"nowrap",pointerEvents:"none"}}>{msg}</div>;}
function Modal({title,onClose,children,wide}){return(
  <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{background:G.surf,border:`1px solid ${G.bord2}`,borderRadius:18,padding:22,width:"100%",maxWidth:wide?700:480,marginTop:24,marginBottom:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <strong style={{fontSize:16}}>{title}</strong>
        <button onClick={onClose} style={{background:"none",border:"none",color:G.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);}
function PhotoUpload({value,onChange,height=110}){
  const ref=useRef();
  const handle=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onChange(ev.target.result);r.readAsDataURL(f);};
  return(<div><div onClick={()=>ref.current.click()} style={{width:"100%",height,borderRadius:10,border:`2px dashed ${G.bord2}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",background:G.bg,position:"relative"}}>
    {value?<img src={value} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<><span style={{fontSize:24,marginBottom:4}}>📷</span><span style={{color:G.muted,fontSize:12}}>Clique para adicionar</span></>}
    {value&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:"#000a",textAlign:"center",fontSize:11,color:"#fff",padding:"3px 0"}}>Trocar</div>}
  </div><input ref={ref} type="file" accept="image/*" onChange={handle} style={{display:"none"}}/></div>);
}
const RTBadge=({connected})=>(
  <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:connected?G.green:G.amber}}>
    <div style={{width:7,height:7,borderRadius:"50%",background:connected?G.green:G.amber,boxShadow:connected?`0 0 6px ${G.green}`:undefined}}/>
    {connected?"Ao vivo":"Reconectando..."}
  </div>
);
function waLink(phone,name,n,val,due,store,overdue){
  const clean=phone.replace(/\D/g,"");const first=(name||"").split(" ")[0];
  const msg=overdue?`Olá ${first}! 😊 Aqui é da ${store}. A parcela ${n} no valor de ${R(val)} venceu em ${fmtD(due)}. Podemos resolver? 🙏`:`Olá ${first}! 😊 Aqui é da ${store}. Lembrete: parcela ${n} de ${R(val)} vence em ${fmtD(due)}. Qualquer dúvida fale! 💪`;
  return`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}
function waBirthday(phone,name,store){
  const clean=phone.replace(/\D/g,"");const first=(name||"").split(" ")[0];
  const msg=`Feliz aniversário, ${first}! 🎉🎂 Toda a equipe da ${store} deseja um dia incrível! Como presente especial, temos uma surpresa esperando por você. Venha nos visitar! 💗`;
  return`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

// ── Period Picker ─────────────────────────────────────────────
function PeriodPicker({df,dt,setDf,setDt,preset,setPreset}){
  const apply=k=>{setPreset(k);const now=new Date();
    if(k==="7d"){const d=new Date();d.setDate(now.getDate()-6);setDf(d.toISOString().slice(0,10));setDt(now.toISOString().slice(0,10));}
    else if(k==="30d"){const d=new Date();d.setDate(now.getDate()-29);setDf(d.toISOString().slice(0,10));setDt(now.toISOString().slice(0,10));}
    else if(k==="60d"){const d=new Date();d.setDate(now.getDate()-59);setDf(d.toISOString().slice(0,10));setDt(now.toISOString().slice(0,10));}
    else if(k==="mes"){const d=new Date(now.getFullYear(),now.getMonth(),1);setDf(d.toISOString().slice(0,10));setDt(now.toISOString().slice(0,10));}
  };
  return(<div style={{display:"flex",flexDirection:"column",gap:8}}>
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      {[["7d","7 dias"],["30d","30 dias"],["60d","60 dias"],["mes","Este mês"],["custom","Período"]].map(([k,l])=>(
        <button key={k} onClick={()=>apply(k)} style={{padding:"5px 12px",borderRadius:20,border:"none",fontSize:12,fontWeight:preset===k?700:400,background:preset===k?G.pink:"#ffffff0e",color:preset===k?"#fff":G.muted,cursor:"pointer"}}>{l}</button>
      ))}
    </div>
    {preset==="custom"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}><Inp label="De" type="date" value={df} onChange={e=>setDf(e.target.value)}/><Inp label="Até" type="date" value={dt} onChange={e=>setDt(e.target.value)}/></div>}
  </div>);
}

// ── InstRow ───────────────────────────────────────────────────
function InstRow({inst,custName,custPhone,onPay,onUnpay,storeName,showWA=true}){
  const overdue=!inst.paid&&inst.due_date<TODAY();const dueToday=!inst.paid&&inst.due_date===TODAY();
  return(<div style={{display:"flex",alignItems:"center",gap:9,background:inst.paid?"#34d39910":overdue?"#f8717110":dueToday?"#fbbf2410":"#ffffff07",border:`1px solid ${inst.paid?G.green+"30":overdue?G.red+"30":dueToday?G.amber+"30":G.bord}`,borderRadius:9,padding:"9px 12px"}}>
    <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,background:inst.paid?G.green:overdue?G.red:dueToday?G.amber:G.muted+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{inst.number}</div>
    <div style={{flex:1}}>
      <div style={{fontSize:13,fontWeight:700,color:inst.paid?G.green:overdue?G.red:G.text}}>{R(inst.amount)}</div>
      <div style={{fontSize:11,color:G.muted}}>Venc: {fmtD(inst.due_date)}{inst.paid_at?` · Pago em ${fmtD(inst.paid_at.slice(0,10))}`:"" }</div>
    </div>
    <Badge color={inst.paid?G.green:overdue?G.red:dueToday?G.amber:G.violet}>{inst.paid?"Pago":overdue?"Vencida":dueToday?"Hoje":"Pendente"}</Badge>
    {!inst.paid&&onPay&&<Btn small variant="success" onClick={()=>onPay(inst.id)}>✓</Btn>}
    {inst.paid&&onUnpay&&<Btn small variant="ghost" onClick={()=>onUnpay(inst.id)} style={{fontSize:10}}>↩</Btn>}
    {!inst.paid&&showWA&&custPhone&&<button onClick={()=>window.open(waLink(custPhone,custName,inst.number,inst.amount,inst.due_date,storeName,overdue),"_blank")} style={{background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",borderRadius:7,padding:"4px 9px",fontSize:13,cursor:"pointer",fontWeight:700,flexShrink:0}}>📱</button>}
  </div>);
}

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard({sales,products,customers,costs,installments,storeSettings}){
  const [preset,setPreset]=useState("30d");
  const [df,setDf]=useState(()=>{const d=new Date();d.setDate(d.getDate()-29);return d.toISOString().slice(0,10);});
  const [dt,setDt]=useState(TODAY);
  const meta=storeSettings?.monthly_goal||0;

  const fSales=sales.filter(s=>s.date>=df&&s.date<=dt&&!s.cancelled);
  const totalRev=fSales.reduce((a,s)=>a+Number(s.total),0);
  const totalCogs=fSales.reduce((a,s)=>a+s.items.reduce((b,i)=>b+Number(i.cost_price)*i.quantity,0),0);
  const fixedCosts=costs.filter(c=>c.type==="fixed"&&(!c.ref_month||(c.ref_month>=df.slice(0,7)&&c.ref_month<=dt.slice(0,7)))).reduce((a,c)=>a+Number(c.amount),0);
  const varCosts=costs.filter(c=>c.type==="variable"&&c.created_at?.slice(0,10)>=df&&c.created_at?.slice(0,10)<=dt).reduce((a,c)=>a+Number(c.amount),0);
  const totalCosts=totalCogs+fixedCosts+varCosts;
  const grossMargin=totalRev-totalCogs;
  const netProfit=totalRev-totalCosts;
  const marginPct=totalRev?((grossMargin/totalRev)*100).toFixed(1):0;
  const pendingAll=installments.filter(i=>!i.paid).reduce((a,i)=>a+Number(i.amount),0);
  const overdueAll=installments.filter(i=>!i.paid&&i.due_date<TODAY()).reduce((a,i)=>a+Number(i.amount),0);

  const days=Math.min(60,Math.ceil((new Date(dt)-new Date(df))/(86400000))+1);
  const chartData=Array.from({length:days},(_,i)=>{
    const d=new Date(df+"T12:00:00");d.setDate(d.getDate()+i);
    const ds=d.toISOString().slice(0,10);const dayS=fSales.filter(s=>s.date===ds);
    return{day:d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),receita:+dayS.reduce((a,s)=>a+Number(s.total),0).toFixed(2),custo:+dayS.reduce((a,s)=>a+s.items.reduce((b,it)=>b+Number(it.cost_price)*it.quantity,0),0).toFixed(2)};
  });

  const catMap={};fSales.forEach(s=>s.items.forEach(it=>{catMap[it.category||"Geral"]=(catMap[it.category||"Geral"]||0)+Number(it.unit_price)*it.quantity;}));
  const pie=Object.entries(catMap).map(([name,value])=>({name,value:+value.toFixed(2)}));
  const mMap={pix:0,debit:0,credit:0,crediario:0};fSales.forEach(s=>{mMap[s.method]=(mMap[s.method]||0)+Number(s.total);});
  const topC=customers.map(c=>{const cs=fSales.filter(s=>s.customer_id===c.id);return{...c,spent:cs.reduce((a,s)=>a+Number(s.total),0),n:cs.length};}).sort((a,b)=>b.spent-a.spent).slice(0,4);
  const topP={};fSales.forEach(s=>s.items.forEach(it=>{if(!topP[it.product_name])topP[it.product_name]={qty:0,rev:0};topP[it.product_name].qty+=it.quantity;topP[it.product_name].rev+=it.quantity*Number(it.unit_price);}));
  const topProducts=Object.entries(topP).sort((a,b)=>b[1].qty-a[1].qty).slice(0,5);
  const lowStock=products.filter(p=>p.active&&p.stock<=3&&p.stock!==999);
  const noMove=products.filter(p=>p.active&&!fSales.some(s=>s.items.some(it=>it.product_id===p.id)));
  const metaPct=meta?Math.min(100,(totalRev/meta)*100):0;

  // Birthday alerts
  const today=new Date();const todayStr=`${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const birthdays=customers.filter(c=>c.birthday&&c.birthday.slice(5)===todayStr);

  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <Card style={{padding:"12px 16px"}}><PeriodPicker df={df} dt={dt} setDf={setDf} setDt={setDt} preset={preset} setPreset={setPreset}/></Card>

    {birthdays.length>0&&<Card style={{background:"#fbbf2410",borderColor:G.amber+"44"}}>
      <div style={{fontWeight:700,color:G.amber,marginBottom:8}}>🎂 Aniversários hoje!</div>
      {birthdays.map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:13}}>{c.name}</span>
        {c.phone&&<button onClick={()=>window.open(waBirthday(c.phone,c.name,storeSettings?.name||"nossa loja"),"_blank")} style={{background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",borderRadius:7,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:700}}>🎉 Parabenizar</button>}
      </div>)}
    </Card>}

    {meta>0&&<Card>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontWeight:700,fontSize:14}}>🎯 Meta do mês</span>
        <span style={{color:metaPct>=100?G.green:G.amber,fontWeight:700}}>{R(totalRev)} / {R(meta)}</span>
      </div>
      <div style={{background:"#ffffff0f",borderRadius:6,height:8,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:6,width:`${metaPct}%`,background:metaPct>=100?`linear-gradient(90deg,${G.green},#059669)`:`linear-gradient(90deg,${G.pink},${G.violet})`,transition:"width .5s"}}/>
      </div>
      <div style={{color:G.muted,fontSize:12,marginTop:5}}>{metaPct.toFixed(1)}% da meta atingida</div>
    </Card>}

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10}}>
      {[["Faturamento",R(totalRev),G.pink,"💰"],["Margem bruta",R(grossMargin)+" ("+marginPct+"%)",G.violet,"📊"],["Custos totais",R(totalCosts),G.amber,"💸"],["Lucro líquido",R(netProfit),netProfit>=0?G.green:G.red,"🏆"],["A receber",R(pendingAll),G.sky,"🕐"],["Vencidos",R(overdueAll),G.red,"⚠️"]].map(([l,v,col,ic])=>(
        <Card key={l} style={{borderLeft:`3px solid ${col}`,padding:"13px 14px"}}>
          <div style={{fontSize:14,marginBottom:4}}>{ic}</div>
          <div style={{color:G.muted,fontSize:10,textTransform:"uppercase",letterSpacing:.8}}>{l}</div>
          <div style={{color:col,fontSize:17,fontWeight:900,marginTop:4,wordBreak:"break-all"}}>{v}</div>
        </Card>
      ))}
    </div>

    <Card>
      <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>💸 Composição de custos</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {[["CMV",totalCogs,G.rose],["Fixos",fixedCosts,G.amber],["Variáveis",varCosts,G.violet]].map(([l,v,col])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{flex:1}}><div style={{fontSize:13}}>{l}</div>
              <div style={{height:3,background:G.bord,borderRadius:3,marginTop:4,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:3,background:col,width:`${totalCosts?Math.min(100,(v/totalCosts)*100):0}%`,transition:"width .4s"}}/>
              </div>
            </div>
            <div style={{color:col,fontWeight:700,fontSize:14,minWidth:80,textAlign:"right"}}>{R(v)}</div>
          </div>
        ))}
      </div>
    </Card>

    {(lowStock.length>0||noMove.length>0)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {lowStock.length>0&&<Card style={{borderColor:G.red+"44",background:`${G.red}08`}}><div style={{color:G.red,fontWeight:700,marginBottom:7,fontSize:13}}>⚠️ Estoque baixo</div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{lowStock.map(p=><Badge key={p.id} color={G.red}>{p.name} ({p.stock})</Badge>)}</div></Card>}
      {noMove.length>0&&<Card style={{borderColor:G.amber+"44"}}><div style={{color:G.amber,fontWeight:700,marginBottom:7,fontSize:13}}>📉 Sem giro</div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{noMove.slice(0,4).map(p=><Badge key={p.id} color={G.amber}>{p.name}</Badge>)}</div></Card>}
    </div>}

    <Card>
      <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>📈 Receita vs Custo</div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{top:4,right:4,left:-24,bottom:0}}>
          <defs>
            <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={G.pink} stopOpacity={0.3}/><stop offset="95%" stopColor={G.pink} stopOpacity={0}/></linearGradient>
          </defs>
          <XAxis dataKey="day" tick={{fill:G.muted,fontSize:9}} axisLine={false} tickLine={false} interval={Math.max(0,Math.floor(days/6)-1)}/>
          <YAxis tick={{fill:G.muted,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(1)}k`}/>
          <Tooltip formatter={v=>R(v)} contentStyle={{background:G.surf,border:`1px solid ${G.bord}`,borderRadius:8,fontSize:12}}/>
          <Area type="monotone" dataKey="receita" name="Receita" stroke={G.pink} fill="url(#gr)" strokeWidth={2.5} dot={false}/>
          <Line type="monotone" dataKey="custo" name="Custo" stroke={G.amber} strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
        </AreaChart>
      </ResponsiveContainer>
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
      <Card>
        <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>🏆 Top produtos</div>
        {topProducts.length===0?<div style={{color:G.muted,fontSize:13}}>Sem vendas no período</div>:topProducts.map(([name,{qty,rev}],i)=>(
          <div key={name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:PAL[i%PAL.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>{i+1}</div>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{name}</div><div style={{fontSize:11,color:G.muted}}>{qty} un.</div></div>
            <span style={{color:PAL[i%PAL.length],fontWeight:700,fontSize:13}}>{R(rev)}</span>
          </div>
        ))}
      </Card>
      <Card>
        <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>💳 Por pagamento</div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {Object.entries(mMap).filter(([,v])=>v>0).map(([m,v])=>(
            <div key={m} style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:MC[m],flexShrink:0}}/>
              <span style={{flex:1,fontSize:13}}>{METHODS[m]}</span>
              <span style={{color:MC[m],fontWeight:700,fontSize:13}}>{R(v)}</span>
            </div>
          ))}
        </div>
        {pie.length>0&&<>
          <Divider/>
          <div style={{fontWeight:700,marginBottom:8,fontSize:13}}>🏷️ Categorias</div>
          <ResponsiveContainer width="100%" height={120}><PieChart><Pie data={pie} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={3}>{pie.map((_,i)=><Cell key={i} fill={PAL[i%PAL.length]}/>)}</Pie><Tooltip formatter={v=>R(v)} contentStyle={{background:G.surf,border:`1px solid ${G.bord}`,borderRadius:8,fontSize:12}}/></PieChart></ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{pie.map((p,i)=><Badge key={p.name} color={PAL[i%PAL.length]}>{p.name}</Badge>)}</div>
        </>}
      </Card>
    </div>

    <Card>
      <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>⭐ Top clientes</div>
      {topC.filter(c=>c.n>0).length===0?<div style={{color:G.muted,fontSize:13}}>Sem vendas no período.</div>:
      topC.filter(c=>c.n>0).map((c,i)=>(
        <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<topC.length-1?10:0}}>
          <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${PAL[i]},${PAL[(i+3)%PAL.length]})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#fff"}}>{INI(c.name)}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{c.name}</div><div style={{fontSize:11,color:G.muted}}>{c.n} compra(s)</div></div>
          <span style={{color:G.pink,fontWeight:800,fontSize:14}}>{R(c.spent)}</span>
        </div>
      ))}
    </Card>
  </div>);
}

// ── Products ──────────────────────────────────────────────────
function Products({products,storeId,toast,onRefresh}){
  const [open,setOpen]=useState(false);const [stockOpen,setStockOpen]=useState(null);
  const [edit,setEdit]=useState(null);const [q,setQ]=useState("");
  const empty={name:"",category:"",cost_price:"",sale_price:"",stock:"",description:"",photo_url:""};
  const [f,setF]=useState(empty);const [saving,setSaving]=useState(false);
  const [stockEntry,setStockEntry]=useState({qty:"",cost:"",note:""});

  const openNew=()=>{setF(empty);setEdit(null);setOpen(true);};
  const openEdit=p=>{setF({name:p.name,category:p.category||"",cost_price:p.cost_price,sale_price:p.sale_price,stock:p.stock,description:p.description||"",photo_url:p.photo_url||""});setEdit(p);setOpen(true);};
  const save=async()=>{
    if(!f.name||!f.sale_price){toast("Nome e preço são obrigatórios","#f87171");return;}
    setSaving(true);
    const d={name:f.name,category:f.category||"Geral",cost_price:+f.cost_price||0,sale_price:+f.sale_price,stock:+f.stock||0,description:f.description||"",photo_url:f.photo_url||"",store_id:storeId,active:true};
    const{error}=edit?await sb.from("products").update(d).eq("id",edit.id):await sb.from("products").insert(d);
    if(error){toast("Erro: "+error.message,"#f87171");}
    else{toast(edit?"Produto atualizado!":"Produto cadastrado!");setOpen(false);onRefresh&&onRefresh();}
    setSaving(false);
  };
  const del=async id=>{await sb.from("products").update({active:false}).eq("id",id);toast("Removido","#f87171");};
  const addStock=async p=>{
    if(!stockEntry.qty)return;
    const newStock=p.stock+(+stockEntry.qty);
    const newCost=stockEntry.cost?+stockEntry.cost:p.cost_price;
    await sb.from("products").update({stock:newStock,cost_price:newCost}).eq("id",p.id);
    toast(`+${stockEntry.qty} unidades adicionadas!`);setStockOpen(null);setStockEntry({qty:"",cost:"",note:""});
  };

  const margin=f.sale_price&&f.cost_price?(((+f.sale_price-+f.cost_price)/+f.sale_price)*100).toFixed(1):null;
  const list=products.filter(p=>p.active!==false&&(p.name.toLowerCase().includes(q.toLowerCase())||p.category?.toLowerCase().includes(q.toLowerCase())));
  const cats=[...new Set(products.filter(p=>p.active).map(p=>p.category))];

  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",gap:9}}><Inp placeholder="🔍 Buscar..." value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}}/><Btn onClick={openNew} variant="pink">+ Produto</Btn></div>
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      {["Todos",...cats].map(c=><button key={c} onClick={()=>setQ(c==="Todos"?"":c)} style={{padding:"4px 11px",borderRadius:20,border:"none",background:(c==="Todos"&&!q)||q===c?G.pink:"#ffffff0e",color:(c==="Todos"&&!q)||q===c?"#fff":G.muted,fontSize:12,cursor:"pointer",fontWeight:(c==="Todos"&&!q)||q===c?700:400}}>{c}</button>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:11}}>
      {list.map(p=>{
        const mg=p.sale_price&&p.cost_price?(((p.sale_price-p.cost_price)/p.sale_price)*100).toFixed(0):null;
        return(<div key={p.id} style={{background:G.card,border:`1px solid ${p.stock<=3?G.red+"44":G.bord}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{width:"100%",height:100,background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
            {p.photo_url?<img src={p.photo_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:32}}>👗</span>}
          </div>
          <div style={{padding:"10px 12px"}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:3,lineHeight:1.3}}>{p.name}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4}}><Badge color={G.pink}>{p.category}</Badge><span style={{color:G.pink,fontWeight:800,fontSize:14}}>{R(p.sale_price)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5,fontSize:11,color:G.muted}}><span>Custo: {R(p.cost_price)}</span>{mg&&<span style={{color:G.green}}>Mg: {mg}%</span>}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
              <span style={{color:p.stock<=3?G.red:G.muted,fontSize:12}}>Est: {p.stock}</span>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>{setStockOpen(p);setStockEntry({qty:"",cost:"",note:""});}} style={{background:`${G.green}22`,border:`1px solid ${G.green}44`,color:G.green,borderRadius:6,padding:"3px 7px",fontSize:11,cursor:"pointer",fontWeight:700}}>+Est</button>
                <Btn small variant="ghost" onClick={()=>openEdit(p)}>✏️</Btn>
                <Btn small variant="danger" onClick={()=>del(p.id)}>✕</Btn>
              </div>
            </div>
          </div>
        </div>);
      })}
    </div>

    {open&&<Modal title={edit?"Editar Produto":"Novo Produto"} onClose={()=>setOpen(false)}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <PhotoUpload value={f.photo_url} onChange={v=>setF({...f,photo_url:v})}/>
        <Inp label="Nome *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Ex: Legging Power Preta P"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Categoria" value={f.category} onChange={e=>setF({...f,category:e.target.value})} placeholder="Legging, Top..."/>
          <Inp label="Estoque" value={f.stock} onChange={e=>setF({...f,stock:e.target.value})} type="number" min="0"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Preço de custo R$" value={f.cost_price} onChange={e=>setF({...f,cost_price:e.target.value})} type="number" min="0" step="0.01"/>
          <Inp label="Preço de venda R$ *" value={f.sale_price} onChange={e=>setF({...f,sale_price:e.target.value})} type="number" min="0" step="0.01"/>
        </div>
        {margin&&<div style={{background:`${G.green}12`,border:`1px solid ${G.green}30`,borderRadius:9,padding:"9px 13px",display:"flex",justifyContent:"space-between"}}><span style={{color:G.muted,fontSize:13}}>Margem de contribuição</span><span style={{color:G.green,fontWeight:700,fontSize:14}}>{margin}%</span></div>}
        <TA label="Descrição" value={f.description} onChange={e=>setF({...f,description:e.target.value})} placeholder="Tecido, corte, tamanho..."/>
        <div style={{display:"flex",gap:9,marginTop:4}}><Btn full onClick={save} variant="pink" disabled={saving}>{saving?<Spin/>:"Salvar"}</Btn><Btn full variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Btn></div>
      </div>
    </Modal>}

    {stockOpen&&<Modal title={`📦 Entrada de estoque — ${stockOpen.name}`} onClose={()=>setStockOpen(null)}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <div style={{background:"#ffffff08",borderRadius:9,padding:"10px 13px",display:"flex",justifyContent:"space-between"}}>
          <span style={{color:G.muted,fontSize:13}}>Estoque atual</span>
          <span style={{fontWeight:700,color:G.amber}}>{stockOpen.stock} un.</span>
        </div>
        <Inp label="Quantidade a adicionar *" value={stockEntry.qty} onChange={e=>setStockEntry({...stockEntry,qty:e.target.value})} type="number" min="1"/>
        <Inp label="Novo preço de custo (opcional)" value={stockEntry.cost} onChange={e=>setStockEntry({...stockEntry,cost:e.target.value})} type="number" min="0" step="0.01" placeholder={`Atual: ${R(stockOpen.cost_price)}`}/>
        <Inp label="Observação" value={stockEntry.note} onChange={e=>setStockEntry({...stockEntry,note:e.target.value})} placeholder="Ex: NF 1234, Fornecedor X..."/>
        <div style={{background:`${G.green}12`,borderRadius:9,padding:"10px 13px",display:"flex",justifyContent:"space-between"}}>
          <span style={{color:G.muted,fontSize:13}}>Novo total</span>
          <span style={{fontWeight:700,color:G.green}}>{stockOpen.stock+(+stockEntry.qty||0)} un.</span>
        </div>
        <div style={{display:"flex",gap:9}}><Btn full onClick={()=>addStock(stockOpen)} variant="green">Confirmar entrada</Btn><Btn full variant="ghost" onClick={()=>setStockOpen(null)}>Cancelar</Btn></div>
      </div>
    </Modal>}
  </div>);
}

// ── Costs ─────────────────────────────────────────────────────
function Costs({costs,customers,storeId,toast}){
  const [open,setOpen]=useState(false);const [edit,setEdit]=useState(null);
  const empty={name:"",amount:"",type:"fixed",ref_month:"",customer_id:""};
  const [f,setF]=useState(empty);const [saving,setSaving]=useState(false);
  const openNew=()=>{setF({...empty,ref_month:TODAY().slice(0,7)});setEdit(null);setOpen(true);};
  const openEdit=c=>{setF({name:c.name,amount:c.amount,type:c.type,ref_month:c.ref_month||"",customer_id:c.customer_id||""});setEdit(c);setOpen(true);};
  const save=async()=>{
    if(!f.name||!f.amount){toast("Preencha nome e valor","#f87171");return;}
    setSaving(true);
    const d={name:f.name,amount:+f.amount,type:f.type,ref_month:f.ref_month||null,customer_id:f.customer_id||null,store_id:storeId};
    const{error}=edit?await sb.from("costs").update(d).eq("id",edit.id):await sb.from("costs").insert(d);
    if(error)toast("Erro: "+error.message,"#f87171");else{toast(edit?"Custo atualizado!":"Custo lançado!");setOpen(false);}
    setSaving(false);
  };
  const del=async id=>{await sb.from("costs").delete().eq("id",id);toast("Removido","#f87171");};
  const fixed=costs.filter(c=>c.type==="fixed");const variable=costs.filter(c=>c.type==="variable");
  const totalF=fixed.reduce((a,c)=>a+Number(c.amount),0);const totalV=variable.reduce((a,c)=>a+Number(c.amount),0);
  const CR=({c})=>{const cust=customers.find(x=>x.id===c.customer_id);return(
    <div style={{display:"flex",alignItems:"center",gap:9,background:"#ffffff06",borderRadius:9,padding:"9px 12px",marginBottom:6}}>
      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{c.name}</div><div style={{color:G.muted,fontSize:11,marginTop:2}}>{c.type==="fixed"?"Fixo":"Variável"}{c.ref_month?" · "+fmtMonth(c.ref_month+"-01"):""}{cust?" · "+cust.name:""}</div></div>
      <span style={{color:G.amber,fontWeight:700,fontSize:14}}>{R(c.amount)}</span>
      <Btn small variant="ghost" onClick={()=>openEdit(c)}>✏️</Btn>
      <Btn small variant="danger" onClick={()=>del(c.id)}>✕</Btn>
    </div>
  );};
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{color:G.muted,fontSize:12}}>Fixos: <span style={{color:G.amber,fontWeight:700}}>{R(totalF)}</span> · Variáveis: <span style={{color:G.violet,fontWeight:700}}>{R(totalV)}</span></div>
      <Btn onClick={openNew} variant="pink" small>+ Lançar custo</Btn>
    </div>
    <Card><div style={{fontWeight:700,fontSize:14,marginBottom:10}}>🔒 Custos Fixos</div>{fixed.length===0?<div style={{color:G.muted,fontSize:13}}>Nenhum custo fixo.</div>:fixed.map(c=><CR key={c.id} c={c}/>)}</Card>
    <Card><div style={{fontWeight:700,fontSize:14,marginBottom:10}}>📦 Variáveis / Entrega</div>{variable.length===0?<div style={{color:G.muted,fontSize:13}}>Nenhum custo variável.</div>:variable.map(c=><CR key={c.id} c={c}/>)}</Card>
    {open&&<Modal title={edit?"Editar Custo":"Lançar Custo"} onClose={()=>setOpen(false)}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <Inp label="Descrição *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Ex: Aluguel, Entrega, Embalagem..."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Valor R$ *" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} type="number" min="0" step="0.01"/>
          <Sel label="Tipo" value={f.type} onChange={e=>setF({...f,type:e.target.value})}><option value="fixed">Fixo</option><option value="variable">Variável</option></Sel>
        </div>
        <Inp label="Mês de referência" type="month" value={f.ref_month} onChange={e=>setF({...f,ref_month:e.target.value})}/>
        <Sel label="Vincular a cliente (opcional)" value={f.customer_id} onChange={e=>setF({...f,customer_id:e.target.value})}><option value="">Global</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel>
        <div style={{display:"flex",gap:9,marginTop:4}}><Btn full onClick={save} variant="pink" disabled={saving}>{saving?<Spin/>:"Salvar"}</Btn><Btn full variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Btn></div>
      </div>
    </Modal>}
  </div>);
}

// ── New Sale ──────────────────────────────────────────────────
function NewSale({products,customers,storeId,toast,allInstallments}){
  const [isQuote,setIsQuote]=useState(false);
  const [cId,setCId]=useState("");const [date,setDate]=useState(TODAY());
  const [items,setItems]=useState([]);const [method,setMethod]=useState("pix");
  const [parc,setParc]=useState(1);const [diaVenc,setDiaVenc]=useState("10");
  const [notes,setNotes]=useState("");const [inclPend,setInclPend]=useState(false);
  const [discount,setDiscount]=useState("");const [discType,setDiscType]=useState("pct");
  const [saving,setSaving]=useState(false);

  const selC=customers.find(c=>c.id===cId);
  const pendInst=cId?allInstallments.filter(i=>i.customer_id===cId&&!i.paid):[];
  const pendTotal=pendInst.reduce((a,i)=>a+Number(i.amount),0);
  const addItem=pid=>{const p=products.find(x=>x.id===pid);if(!p)return;if(items.find(x=>x.pid===pid))setItems(items.map(x=>x.pid===pid?{...x,qty:x.qty+1}:x));else setItems([...items,{pid,qty:1,sale_price:p.sale_price,cost_price:p.cost_price,name:p.name,category:p.category}]);};
  const rmItem=pid=>setItems(items.filter(x=>x.pid!==pid));
  const chgQty=(pid,q)=>q<1?rmItem(pid):setItems(items.map(x=>x.pid===pid?{...x,qty:q}:x));
  const sub=items.reduce((a,x)=>a+x.qty*x.sale_price,0);
  const discVal=discount?(discType==="pct"?sub*(+discount/100):+discount):0;
  const subAfterDisc=Math.max(0,sub-discVal);
  const canParc=method==="credit"||method==="crediario";
  const effParc=canParc?parc:1;
  const total=inclPend?+(subAfterDisc+pendTotal).toFixed(2):subAfterDisc;
  const instVal=+(total/effParc).toFixed(2);

  const submit=async()=>{
    if(!items.length){toast("Adicione pelo menos um produto","#f87171");return;}
    setSaving(true);
    try{
      const cmv=items.reduce((a,x)=>a+x.qty*x.cost_price,0);
      const{data:sale,error:sErr}=await sb.from("sales").insert({store_id:storeId,customer_id:cId||null,date,subtotal:sub,discount:discVal,total_cost:cmv,total,method,installments:effParc,notes,is_quote:isQuote,cancelled:false}).select().single();
      if(sErr)throw sErr;
      await sb.from("sale_items").insert(items.map(it=>({sale_id:sale.id,product_id:it.pid,product_name:it.name,category:it.category,quantity:it.qty,unit_price:it.sale_price,cost_price:it.cost_price})));
      for(const it of items){const p=products.find(x=>x.id===it.pid);if(p&&!isQuote)await sb.from("products").update({stock:Math.max(0,p.stock-it.qty)}).eq("id",it.pid);}
      if(inclPend&&cId&&pendInst.length)await sb.from("installments").update({paid:true,paid_at:new Date().toISOString()}).in("id",pendInst.map(i=>i.id));
      const insts=Array.from({length:effParc},(_,i)=>({sale_id:sale.id,store_id:storeId,customer_id:cId||null,number:i+1,amount:instVal,due_date:method==="crediario"?dueDateDay(date,i+1,diaVenc):addMonths(date,i+1),paid:effParc===1&&(method==="pix"||method==="debit")}));
      await sb.from("installments").insert(insts);
      toast(isQuote?"✅ Orçamento salvo!":"✅ Venda registrada!");
      setItems([]);setCId("");setMethod("pix");setParc(1);setInclPend(false);setNotes("");setDate(TODAY());setDiscount("");
    }catch(e){toast("Erro: "+e.message,"#f87171");}
    setSaving(false);
  };

  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",gap:7}}>
      <button onClick={()=>setIsQuote(false)} style={{flex:1,padding:"8px 0",borderRadius:9,border:"none",background:!isQuote?G.pink:"#ffffff0e",color:!isQuote?"#fff":G.muted,fontWeight:!isQuote?700:400,fontSize:13,cursor:"pointer"}}>🛒 Venda</button>
      <button onClick={()=>setIsQuote(true)} style={{flex:1,padding:"8px 0",borderRadius:9,border:"none",background:isQuote?G.violet:"#ffffff0e",color:isQuote?"#fff":G.muted,fontWeight:isQuote?700:400,fontSize:13,cursor:"pointer"}}>📋 Orçamento</button>
    </div>
    <Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
        <Sel label="Cliente" value={cId} onChange={e=>{setCId(e.target.value);setInclPend(false);}}>
          <option value="">Avulso</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </Sel>
        <Inp label="Data" type="date" value={date} onChange={e=>setDate(e.target.value)} hint="Aceita datas retroativas"/>
      </div>
      {selC&&pendTotal>0&&<div style={{marginTop:10,background:`${G.amber}12`,border:`1px solid ${G.amber}30`,borderRadius:9,padding:"10px 13px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div><div style={{color:G.amber,fontWeight:700,fontSize:13}}>⚠️ Saldo em aberto</div><div style={{color:G.muted,fontSize:12}}>{R(pendTotal)} ({pendInst.length} parcelas)</div></div>
        <button onClick={()=>setInclPend(!inclPend)} style={{padding:"6px 12px",borderRadius:8,border:"none",fontWeight:700,fontSize:12,cursor:"pointer",background:inclPend?G.amber:"#ffffff10",color:inclPend?"#000":"#fff"}}>{inclPend?"✓ Incluído":"Incluir no parcelamento"}</button>
      </div>}
    </Card>

    <Card>
      <Sel label="Adicionar produto" value="" onChange={e=>{if(e.target.value){addItem(e.target.value);e.target.value=""}}}>
        <option value="">Selecione um produto...</option>
        {products.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.name} — {R(p.sale_price)}{p.stock<=3?" ⚠️":""}</option>)}
      </Sel>
      {items.length>0&&<div style={{marginTop:11,display:"flex",flexDirection:"column",gap:7}}>{items.map(it=>(
        <div key={it.pid} style={{display:"flex",alignItems:"center",gap:8,background:"#ffffff07",borderRadius:9,padding:"7px 10px"}}>
          <span style={{flex:1,fontSize:13,fontWeight:600}}>{it.name}</span>
          <button onClick={()=>chgQty(it.pid,it.qty-1)} style={QB}>−</button>
          <span style={{fontWeight:700,minWidth:20,textAlign:"center",fontSize:13}}>{it.qty}</span>
          <button onClick={()=>chgQty(it.pid,it.qty+1)} style={QB}>+</button>
          <span style={{color:G.pink,fontWeight:700,minWidth:60,textAlign:"right",fontSize:13}}>{R(it.qty*it.sale_price)}</span>
          <button onClick={()=>rmItem(it.pid)} style={{background:"none",border:"none",color:G.red,cursor:"pointer",fontSize:15}}>✕</button>
        </div>
      ))}</div>}
    </Card>

    <Card>
      <div style={{fontWeight:700,marginBottom:10,fontSize:13}}>🎁 Desconto (opcional)</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        <Inp label="Valor do desconto" value={discount} onChange={e=>setDiscount(e.target.value)} type="number" min="0" step="0.01"/>
        <Sel label="Tipo" value={discType} onChange={e=>setDiscType(e.target.value)}><option value="pct">Percentual (%)</option><option value="fixed">Valor fixo (R$)</option></Sel>
      </div>
      {discount&&<div style={{marginTop:8,color:G.green,fontSize:13,fontWeight:700}}>Desconto: {R(discVal)}</div>}
    </Card>

    <Card>
      <div style={{fontWeight:700,marginBottom:10,fontSize:13}}>💳 Pagamento</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>
        {[["pix","PIX 💚",G.green],["debit","Débito 🟡",G.amber],["credit","Crédito 💜",G.violet],["crediario","Crediário 🩷",G.rose]].map(([m,l,col])=>(
          <button key={m} onClick={()=>{setMethod(m);if(m!=="credit"&&m!=="crediario")setParc(1);}} style={{padding:"9px 0",borderRadius:9,border:`1.5px solid ${method===m?col:G.bord}`,background:method===m?col+"22":"transparent",color:method===m?col:G.muted,fontWeight:method===m?700:400,fontSize:13,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      {canParc&&<><span style={{color:G.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:7}}>Parcelas</span>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:method==="crediario"?11:0}}>
          {[1,2,3,4,5,6,8,10,12].map(n=><button key={n} onClick={()=>setParc(n)} style={{padding:"6px 11px",borderRadius:8,border:"none",fontWeight:parc===n?700:400,fontSize:13,cursor:"pointer",background:parc===n?(method==="crediario"?G.rose:G.violet):"#ffffff0e",color:parc===n?"#fff":G.muted}}>{n}x</button>)}
        </div>
        {method==="crediario"&&parc>1&&<Sel label="Dia do vencimento" value={diaVenc} onChange={e=>setDiaVenc(e.target.value)} style={{marginTop:8}}>{["5","10","15","20","25","30"].map(d=><option key={d} value={d}>Todo dia {d}</option>)}</Sel>}
      </>}
    </Card>

    <Inp label="Observações (opcional)" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notas sobre a venda..."/>

    <Card style={{background:G.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",color:G.muted,fontSize:13,marginBottom:5}}><span>Subtotal</span><span style={{color:G.text}}>{R(sub)}</span></div>
      {discVal>0&&<div style={{display:"flex",justifyContent:"space-between",color:G.muted,fontSize:13,marginBottom:5}}><span>Desconto</span><span style={{color:G.green}}>−{R(discVal)}</span></div>}
      {inclPend&&pendTotal>0&&<div style={{display:"flex",justifyContent:"space-between",color:G.muted,fontSize:13,marginBottom:5}}><span>Saldo anterior</span><span style={{color:G.rose}}>{R(pendTotal)}</span></div>}
      <Divider my={8}/>
      <div style={{display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:20,marginBottom:canParc&&parc>1?8:0}}><span>Total</span><span style={{color:G.pink}}>{R(total)}</span></div>
      {canParc&&parc>1&&<div style={{textAlign:"center",background:`${method==="crediario"?G.rose:G.violet}14`,border:`1px solid ${method==="crediario"?G.rose:G.violet}30`,borderRadius:9,padding:"8px 12px",marginBottom:6}}><span style={{color:method==="crediario"?G.rose:G.violet,fontWeight:800,fontSize:16}}>{parc}x de {R(instVal)}</span></div>}
      <Btn full onClick={submit} disabled={saving||!items.length} variant="pink" style={{marginTop:10,padding:"12px 0",fontSize:15}}>{saving?<Spin/>:isQuote?"💾 Salvar Orçamento":"Registrar Venda"}</Btn>
    </Card>
  </div>);
}
const QB={width:26,height:26,borderRadius:6,border:`1px solid ${G.bord2}`,background:"#ffffff0e",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,lineHeight:1,flexShrink:0};

// ── Sales List ────────────────────────────────────────────────
function SalesList({sales,customers,installments,storeId,toast,products}){
  const [df,setDf]=useState("");const [dt,setDt]=useState("");
  const [cFil,setCFil]=useState("");const [mFil,setMFil]=useState("");
  const [exp,setExp]=useState(null);const [showQuotes,setShowQuotes]=useState(false);
  const [cancelId,setCancelId]=useState(null);

  const list=sales.filter(s=>{
    if(showQuotes?!s.is_quote:s.is_quote)return false;
    if(df&&s.date<df)return false;if(dt&&s.date>dt)return false;
    if(cFil&&s.customer_id!==cFil)return false;if(mFil&&s.method!==mFil)return false;
    return true;
  }).sort((a,b)=>b.date.localeCompare(a.date)||b.created_at?.localeCompare(a.created_at||"")||0);

  const payInst=async id=>{await sb.from("installments").update({paid:true,paid_at:new Date().toISOString()}).eq("id",id);toast("Parcela paga! ✓");};
  const unpayInst=async id=>{await sb.from("installments").update({paid:false,paid_at:null}).eq("id",id);toast("Estorno realizado!");};
  const cancelSale=async id=>{
    const sale=sales.find(s=>s.id===id);if(!sale)return;
    await sb.from("sales").update({cancelled:true}).eq("id",id);
    await sb.from("installments").update({paid:true}).eq("sale_id",id);
    for(const it of sale.items){const p=products.find(x=>x.id===it.product_id);if(p)await sb.from("products").update({stock:p.stock+it.quantity}).eq("id",it.product_id);}
    toast("Venda cancelada e estoque devolvido!","#fbbf24");setCancelId(null);
  };
  const convertQuote=async id=>{
    const sale=sales.find(s=>s.id===id);if(!sale)return;
    await sb.from("sales").update({is_quote:false}).eq("id",id);
    for(const it of sale.items){const p=products.find(x=>x.id===it.product_id);if(p)await sb.from("products").update({stock:Math.max(0,p.stock-it.quantity)}).eq("id",it.product_id);}
    await sb.from("installments").update({paid:sale.method==="pix"||sale.method==="debit"}).eq("sale_id",id);
    toast("Orçamento convertido em venda! ✓");
  };

  const printReceipt=(s)=>{
    const cust=customers.find(c=>c.id===s.customer_id);
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>Recibo</title><style>body{font-family:sans-serif;padding:20px;max-width:400px;margin:0 auto}h2{text-align:center}table{width:100%}td{padding:4px 0}hr{margin:10px 0}.total{font-weight:bold;font-size:18px}</style></head><body>
    <h2>🧾 Recibo de Venda</h2><hr>
    <p><b>Cliente:</b> ${cust?.name||"Avulso"}</p>
    <p><b>Data:</b> ${fmtD(s.date)}</p>
    <p><b>Pagamento:</b> ${METHODS[s.method]}</p><hr>
    <table>${s.items.map(it=>`<tr><td>${it.quantity}x ${it.product_name}</td><td style="text-align:right">${R(it.quantity*it.unit_price)}</td></tr>`).join("")}</table><hr>
    ${s.discount>0?`<p>Desconto: −${R(s.discount)}</p>`:""}
    <p class="total">Total: ${R(s.total)}</p>
    ${s.installments>1?`<p>${s.installments}x de ${R(s.total/s.installments)}</p>`:""}
    ${s.notes?`<p>Obs: ${s.notes}</p>`:""}
    <hr><p style="text-align:center;color:#999;font-size:12px">Obrigada pela preferência! 💗</p>
    </body></html>`);w.print();
  };

  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",gap:7}}>
      <button onClick={()=>setShowQuotes(false)} style={{flex:1,padding:"8px 0",borderRadius:9,border:"none",background:!showQuotes?G.pink:"#ffffff0e",color:!showQuotes?"#fff":G.muted,fontWeight:!showQuotes?700:400,fontSize:13,cursor:"pointer"}}>🧾 Vendas</button>
      <button onClick={()=>setShowQuotes(true)} style={{flex:1,padding:"8px 0",borderRadius:9,border:"none",background:showQuotes?G.violet:"#ffffff0e",color:showQuotes?"#fff":G.muted,fontWeight:showQuotes?700:400,fontSize:13,cursor:"pointer"}}>📋 Orçamentos</button>
    </div>
    <Card style={{padding:"12px 14px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}><Inp label="De" type="date" value={df} onChange={e=>setDf(e.target.value)}/><Inp label="Até" type="date" value={dt} onChange={e=>setDt(e.target.value)}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        <Sel label="Cliente" value={cFil} onChange={e=>setCFil(e.target.value)}><option value="">Todos</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel>
        <Sel label="Pagamento" value={mFil} onChange={e=>setMFil(e.target.value)}><option value="">Todos</option>{Object.entries(METHODS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</Sel>
      </div>
    </Card>
    {list.length===0&&<Card><div style={{color:G.muted,textAlign:"center",padding:28}}>Nenhuma {showQuotes?"orçamento":"venda"} encontrada.</div></Card>}
    {list.map(s=>{
      const cust=customers.find(c=>c.id===s.customer_id);
      const sInst=installments.filter(i=>i.sale_id===s.id);
      const pend=sInst.filter(i=>!i.paid);const hasOverdue=pend.some(i=>i.due_date<TODAY());
      const expanded=exp===s.id;
      return(<Card key={s.id} style={{borderColor:s.cancelled?G.red+"44":hasOverdue?G.amber+"44":G.bord,opacity:s.cancelled?0.6:1}}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,cursor:"pointer"}} onClick={()=>setExp(expanded?null:s.id)}>
          <div>
            <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:7}}>
              {fmtD(s.date)} — {cust?.name||"Avulso"}
              {s.cancelled&&<Badge color={G.red}>Cancelada</Badge>}
              {s.is_quote&&<Badge color={G.violet}>Orçamento</Badge>}
            </div>
            <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
              <Badge color={MC[s.method]}>{METHODS[s.method]}</Badge>
              {s.installments>1&&<Badge color={G.violet}>{s.installments}x de {R(s.total/s.installments)}</Badge>}
              {hasOverdue&&<Badge color={G.red}>Vencida</Badge>}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{color:G.pink,fontWeight:800,fontSize:17}}>{R(s.total)}</div>
            <div style={{color:G.muted,fontSize:12}}>{pend.length>0?`${pend.length} pendente(s)`:"✓ Quitado"}</div>
            <div style={{color:G.muted,fontSize:11,marginTop:2}}>{expanded?"▲":"▼"}</div>
          </div>
        </div>
        {expanded&&<div style={{marginTop:12}}>
          <Divider/>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>{s.items.map((it,i)=><Badge key={i} color="#ffffff25">{it.quantity}x {it.product_name}</Badge>)}</div>
          {s.discount>0&&<div style={{color:G.green,fontSize:12,marginBottom:8}}>Desconto aplicado: −{R(s.discount)}</div>}
          {s.notes&&<div style={{color:G.muted,fontSize:12,marginBottom:8}}>📝 {s.notes}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
            {sInst.map((inst,i)=><InstRow key={i} inst={inst} custName={cust?.name} custPhone={cust?.phone} onPay={payInst} onUnpay={unpayInst} storeName="Fitness CRM" showWA={!!cust?.phone}/>)}
          </div>
          {!s.cancelled&&<div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            <Btn small variant="ghost" onClick={()=>printReceipt(s)}>🖨️ Recibo</Btn>
            {s.is_quote&&<Btn small variant="success" onClick={()=>convertQuote(s.id)}>✓ Confirmar venda</Btn>}
            {!s.is_quote&&<Btn small variant="danger" onClick={()=>setCancelId(s.id)}>✕ Cancelar venda</Btn>}
          </div>}
        </div>}
      </Card>);
    })}
    {cancelId&&<Modal title="⚠️ Cancelar venda?" onClose={()=>setCancelId(null)}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{color:G.muted,fontSize:14}}>O estoque dos produtos será devolvido automaticamente. Esta ação não pode ser desfeita.</div>
        <div style={{display:"flex",gap:9}}><Btn full variant="danger" onClick={()=>cancelSale(cancelId)}>Confirmar cancelamento</Btn><Btn full variant="ghost" onClick={()=>setCancelId(null)}>Voltar</Btn></div>
      </div>
    </Modal>}
  </div>);
}

// ── Due Dates ─────────────────────────────────────────────────
function DueDates({installments,customers,storeName,toast,sales}){
  const [filter,setFilter]=useState("all");const [cFil,setCFil]=useState("");
  const cancelledSaleIds=new Set((sales||[]).filter(s=>s.cancelled).map(s=>s.id));
  const allPend=installments.filter(i=>!i.paid&&!cancelledSaleIds.has(i.sale_id)).sort((a,b)=>a.due_date.localeCompare(b.due_date));
  const weekEnd=new Date();weekEnd.setDate(weekEnd.getDate()+7);const we=weekEnd.toISOString().slice(0,10);
  const filtered=allPend.filter(i=>{
    if(cFil&&i.customer_id!==cFil)return false;
    if(filter==="overdue")return i.due_date<TODAY();
    if(filter==="today")return i.due_date===TODAY();
    if(filter==="week")return i.due_date>=TODAY()&&i.due_date<=we;
    return true;
  });
  const totalPend=filtered.reduce((a,i)=>a+Number(i.amount),0);
  const byCust={};filtered.forEach(i=>{const k=i.customer_id||"avulso";if(!byCust[k])byCust[k]={id:k,items:[]};byCust[k].items.push(i);});
  const payInst=async id=>{await sb.from("installments").update({paid:true,paid_at:new Date().toISOString()}).eq("id",id);toast("Parcela paga! ✓");};
  return(<div style={{display:"flex",flexDirection:"column",gap:13}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(115px,1fr))",gap:9}}>
      {[["Pendentes",allPend.length,G.violet],["Vencidas",allPend.filter(i=>i.due_date<TODAY()).length,G.red],["Hoje",allPend.filter(i=>i.due_date===TODAY()).length,G.amber],["Total",R(allPend.reduce((a,i)=>a+Number(i.amount),0)),G.pink]].map(([l,v,col])=>(
        <Card key={l} style={{borderLeft:`3px solid ${col}`,padding:"11px 13px"}}><div style={{color:G.muted,fontSize:10,textTransform:"uppercase",letterSpacing:.7}}>{l}</div><div style={{color:col,fontSize:18,fontWeight:900,marginTop:4}}>{v}</div></Card>
      ))}
    </div>
    <Card style={{padding:"12px 14px"}}>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
        {[["all","Todas"],["overdue","Vencidas"],["today","Hoje"],["week","7 dias"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{padding:"5px 12px",borderRadius:20,border:"none",fontSize:12,fontWeight:filter===k?700:400,background:filter===k?G.rose:"#ffffff0e",color:filter===k?"#fff":G.muted,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      <Sel value={cFil} onChange={e=>setCFil(e.target.value)}><option value="">Todas as clientes</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel>
    </Card>
    {filtered.length>0&&<div style={{background:`${G.pink}10`,border:`1px solid ${G.pink}22`,borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between"}}><span style={{color:G.muted,fontSize:13}}>Total filtrado</span><span style={{color:G.pink,fontWeight:800,fontSize:16}}>{R(totalPend)}</span></div>}
    {Object.values(byCust).map(({id,items})=>{
      const cust=customers.find(c=>c.id===id);const total=items.reduce((a,i)=>a+Number(i.amount),0);const hasOverdue=items.some(i=>i.due_date<TODAY());
      return(<Card key={id} style={{borderColor:hasOverdue?G.red+"44":G.bord}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:38,height:38,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${G.pink},${G.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:"#fff"}}>{cust?INI(cust.name):"?"}</div>
            <div><div style={{fontWeight:700,fontSize:14}}>{cust?.name||"Avulso"}</div>{cust?.phone&&<div style={{color:G.muted,fontSize:12}}>📞 {cust.phone}</div>}</div>
          </div>
          <div style={{textAlign:"right"}}><div style={{color:G.pink,fontWeight:800,fontSize:15}}>{R(total)}</div><div style={{color:G.muted,fontSize:12}}>{items.length} parcela(s)</div></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>{items.map((inst,i)=><InstRow key={i} inst={inst} custName={cust?.name} custPhone={cust?.phone} onPay={payInst} storeName={storeName}/>)}</div>
        {cust?.phone&&items.filter(i=>i.due_date<TODAY()).length>0&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${G.bord}`}}>
          <button onClick={()=>{items.filter(i=>i.due_date<TODAY()).forEach(i=>window.open(waLink(cust.phone,cust.name,i.number,i.amount,i.due_date,storeName,true),"_blank"));toast("WhatsApp aberto!");}} style={{display:"flex",alignItems:"center",gap:6,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",borderRadius:8,padding:"6px 13px",fontSize:12,cursor:"pointer",fontWeight:700}}>📱 Cobrar todas vencidas</button>
        </div>}
      </Card>);
    })}
  </div>);
}

// ── Customer Profile ──────────────────────────────────────────
function CustomerProfile({cust,sales,installments,storeName,toast,onBack}){
  const cSales=sales.filter(s=>s.customer_id===cust.id&&!s.cancelled);
  const cInst=installments.filter(i=>i.customer_id===cust.id);
  const paid=cInst.filter(i=>i.paid);const pend=cInst.filter(i=>!i.paid);
  const overdue=pend.filter(i=>i.due_date<TODAY());const upcoming=pend.filter(i=>i.due_date>=TODAY());
  const totalSpent=cSales.reduce((a,s)=>a+Number(s.total),0);
  const [tab,setTab]=useState("compras");
  const payInst=async id=>{await sb.from("installments").update({paid:true,paid_at:new Date().toISOString()}).eq("id",id);toast("Pago! ✓");};
  const unpayInst=async id=>{await sb.from("installments").update({paid:false,paid_at:null}).eq("id",id);toast("Estorno! ✓");};
  const lastBuy=cSales.length?cSales.sort((a,b)=>b.date.localeCompare(a.date))[0].date:null;
  const inactiveDays=lastBuy?daysDiff(lastBuy,TODAY()):null;

  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",color:G.muted,cursor:"pointer",fontSize:13}}>← Voltar</button>
    <Card style={{background:`linear-gradient(135deg,${G.pink}18,${G.violet}18)`,borderColor:G.pink+"33"}}>
      <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{width:56,height:56,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${G.pink},${G.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:"#fff",overflow:"hidden"}}>
          {cust.photo_url?<img src={cust.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:INI(cust.name)}
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:18,display:"flex",alignItems:"center",gap:8}}>{cust.name}{cust.category&&<Badge color={CUST_CAT_COLORS[cust.category]||G.pink}>{CUST_CATS[cust.category]||cust.category}</Badge>}</div>
          {cust.phone&&<div style={{color:G.muted,fontSize:13}}>📞 {cust.phone}</div>}
          {cust.email&&<div style={{color:G.muted,fontSize:13}}>✉️ {cust.email}</div>}
          {cust.birthday&&<div style={{color:G.muted,fontSize:13}}>🎂 {fmtD(cust.birthday)}</div>}
          {cust.notes&&<div style={{color:G.violet,fontSize:12,marginTop:4}}>📝 {cust.notes}</div>}
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:G.pink,fontWeight:900,fontSize:20}}>{R(totalSpent)}</div>
          {pend.length>0&&<div style={{color:G.amber,fontWeight:700,fontSize:14}}>{R(pend.reduce((a,i)=>a+Number(i.amount),0))} a receber</div>}
        </div>
      </div>
      {inactiveDays!==null&&inactiveDays>30&&<div style={{marginTop:10,background:`${G.amber}14`,border:`1px solid ${G.amber}30`,borderRadius:8,padding:"7px 12px",fontSize:12,color:G.amber}}>⏰ Sem compras há {inactiveDays} dias{cust.phone&&<button onClick={()=>window.open(`https://wa.me/${cust.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Olá ${cust.name.split(" ")[0]}! 😊 Sentimos sua falta! Temos novidades esperando por você na ${storeName}. Venha nos visitar! 💗`)}`, "_blank")} style={{marginLeft:10,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",borderRadius:6,padding:"2px 8px",fontSize:11,cursor:"pointer",fontWeight:700}}>📱 Reativar</button>}</div>}
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:9}}>
      {[["Total gasto",R(totalSpent),G.pink],["Pago",R(paid.reduce((a,i)=>a+Number(i.amount),0)),G.green],["A vencer",R(upcoming.reduce((a,i)=>a+Number(i.amount),0)),G.violet],["Vencidos",R(overdue.reduce((a,i)=>a+Number(i.amount),0)),G.red]].map(([l,v,col])=>(
        <Card key={l} style={{borderLeft:`3px solid ${col}`,padding:"10px 12px"}}><div style={{color:G.muted,fontSize:10,textTransform:"uppercase",letterSpacing:.7}}>{l}</div><div style={{color:col,fontWeight:800,fontSize:14,marginTop:3}}>{v}</div></Card>
      ))}
    </div>
    <div style={{display:"flex",gap:4,overflowX:"auto"}}>
      {[["compras","🛍️ Compras"],["pagos","✅ Pagos"],["vencidos","🔴 Vencidos"],["avencer","⏳ A vencer"]].map(([k,l])=>(
        <button key={k} onClick={()=>setTab(k)} style={{flexShrink:0,flex:1,padding:"8px 4px",borderRadius:9,border:"none",background:tab===k?G.pink+"22":"transparent",color:tab===k?G.pink:G.muted,fontWeight:tab===k?700:400,fontSize:12,cursor:"pointer",borderBottom:tab===k?`2px solid ${G.pink}`:"2px solid transparent"}}>{l}</button>
      ))}
    </div>
    {tab==="compras"&&<div style={{display:"flex",flexDirection:"column",gap:9}}>
      {cSales.length===0&&<Card><div style={{color:G.muted,textAlign:"center",padding:24}}>Nenhuma compra registrada.</div></Card>}
      {cSales.sort((a,b)=>b.date.localeCompare(a.date)).map(s=>(
        <Card key={s.id}><div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div><div style={{fontWeight:700,fontSize:14}}>{fmtD(s.date)}</div><div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}><Badge color={MC[s.method]}>{METHODS[s.method]}</Badge>{s.installments>1&&<Badge color={G.violet}>{s.installments}x</Badge>}</div></div>
          <div style={{textAlign:"right"}}><div style={{color:G.pink,fontWeight:800,fontSize:16}}>{R(s.total)}</div>{s.notes&&<div style={{color:G.muted,fontSize:12}}>{s.notes}</div>}</div>
        </div><div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>{s.items.map((it,i)=><Badge key={i} color="#ffffff20">{it.quantity}x {it.product_name}</Badge>)}</div></Card>
      ))}
    </div>}
    {tab==="pagos"&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
      {paid.length===0&&<Card><div style={{color:G.muted,textAlign:"center",padding:24}}>Nenhum pagamento.</div></Card>}
      {paid.sort((a,b)=>b.paid_at?.localeCompare(a.paid_at||"")).map((i,idx)=><InstRow key={idx} inst={i} onUnpay={unpayInst} showWA={false}/>)}
    </div>}
    {tab==="vencidos"&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
      {overdue.length===0&&<Card style={{borderColor:G.green+"44"}}><div style={{color:G.green,textAlign:"center",padding:24}}>✅ Nenhuma parcela vencida!</div></Card>}
      {overdue.sort((a,b)=>a.due_date.localeCompare(b.due_date)).map((i,idx)=><InstRow key={idx} inst={i} custName={cust.name} custPhone={cust.phone} onPay={payInst} storeName={storeName}/>)}
      {overdue.length>0&&cust.phone&&<button onClick={()=>{overdue.forEach(i=>window.open(waLink(cust.phone,cust.name,i.number,i.amount,i.due_date,storeName,true),"_blank"));toast("WhatsApp aberto!");}} style={{display:"flex",alignItems:"center",gap:6,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer",fontWeight:700}}>📱 Cobrar todas via WhatsApp</button>}
    </div>}
    {tab==="avencer"&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
      {upcoming.length===0&&<Card><div style={{color:G.muted,textAlign:"center",padding:24}}>Nenhuma parcela a vencer.</div></Card>}
      {upcoming.sort((a,b)=>a.due_date.localeCompare(b.due_date)).map((i,idx)=><InstRow key={idx} inst={i} custName={cust.name} custPhone={cust.phone} onPay={payInst} storeName={storeName}/>)}
    </div>}
  </div>);
}

function Customers({customers,sales,installments,storeId,storeName,toast}){
  const [open,setOpen]=useState(false);const [selected,setSelected]=useState(null);const [edit,setEdit]=useState(null);
  const [f,setF]=useState({name:"",phone:"",email:"",notes:"",birthday:"",category:"regular",photo_url:""});
  const [q,setQ]=useState("");const [saving,setSaving]=useState(false);const [catFil,setCatFil]=useState("");
  const openNew=()=>{setF({name:"",phone:"",email:"",notes:"",birthday:"",category:"regular",photo_url:""});setEdit(null);setOpen(true);};
  const openEdit=c=>{setF({name:c.name,phone:c.phone||"",email:c.email||"",notes:c.notes||"",birthday:c.birthday||"",category:c.category||"regular",photo_url:c.photo_url||""});setEdit(c);setOpen(true);};
  const save=async()=>{
    if(!f.name){toast("Nome é obrigatório","#f87171");return;}
    setSaving(true);
    const d={name:f.name,phone:f.phone,email:f.email,notes:f.notes,birthday:f.birthday||null,category:f.category,photo_url:f.photo_url||"",store_id:storeId};
    const{error}=edit?await sb.from("customers").update(d).eq("id",edit.id):await sb.from("customers").insert(d);
    if(error)toast("Erro: "+error.message,"#f87171");else{toast(edit?"Cliente atualizada!":"Cliente cadastrada!");setOpen(false);}
    setSaving(false);
  };
  const del=async id=>{await sb.from("customers").delete().eq("id",id);toast("Removida","#f87171");};
  if(selected)return <CustomerProfile cust={selected} sales={sales} installments={installments} storeName={storeName} toast={toast} onBack={()=>setSelected(null)}/>;
  const today=new Date();const todayStr=`${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const list=customers.filter(c=>{if(catFil&&c.category!==catFil)return false;return c.name.toLowerCase().includes(q.toLowerCase())||c.phone?.includes(q);});
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",gap:9}}><Inp placeholder="🔍 Buscar cliente..." value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}}/><Btn onClick={openNew} variant="pink">+ Cliente</Btn></div>
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      <button onClick={()=>setCatFil("")} style={{padding:"4px 11px",borderRadius:20,border:"none",background:!catFil?G.pink:"#ffffff0e",color:!catFil?"#fff":G.muted,fontSize:12,cursor:"pointer",fontWeight:!catFil?700:400}}>Todas</button>
      {Object.entries(CUST_CATS).map(([k,v])=><button key={k} onClick={()=>setCatFil(k)} style={{padding:"4px 11px",borderRadius:20,border:"none",background:catFil===k?(CUST_CAT_COLORS[k]||G.pink):"#ffffff0e",color:catFil===k?"#fff":G.muted,fontSize:12,cursor:"pointer",fontWeight:catFil===k?700:400}}>{v}</button>)}
    </div>
    {list.map(c=>{
      const cs=sales.filter(s=>s.customer_id===c.id&&!s.cancelled);
      const spent=cs.reduce((a,s)=>a+Number(s.total),0);
      const pendInst=installments.filter(i=>i.customer_id===c.id&&!i.paid);
      const pendVal=pendInst.reduce((a,i)=>a+Number(i.amount),0);
      const hasOverdue=pendInst.some(i=>i.due_date<TODAY());
      const isBirthday=c.birthday&&c.birthday.slice(5)===todayStr;
      return(<Card key={c.id} onClick={()=>setSelected(c)} style={{cursor:"pointer",borderColor:hasOverdue?G.red+"44":isBirthday?G.amber+"44":G.bord}}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",gap:11,alignItems:"center"}}>
            <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${G.pink},${G.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#fff",overflow:"hidden"}}>
              {c.photo_url?<img src={c.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:INI(c.name)}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:15,display:"flex",alignItems:"center",gap:6}}>{c.name}{isBirthday&&<span>🎂</span>}{c.category&&<Badge color={CUST_CAT_COLORS[c.category]||G.pink}>{CUST_CATS[c.category]||c.category}</Badge>}</div>
              {c.phone&&<div style={{color:G.muted,fontSize:12}}>📞 {c.phone}</div>}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{color:G.pink,fontWeight:800,fontSize:16}}>{R(spent)}</div>
            <div style={{color:G.muted,fontSize:12}}>{cs.length} compras</div>
            {pendVal>0&&<div style={{marginTop:3}}><Badge color={hasOverdue?G.red:G.amber}>A receber: {R(pendVal)}</Badge></div>}
          </div>
        </div>
        <div style={{marginTop:10,display:"flex",gap:7}} onClick={e=>e.stopPropagation()}>
          <Btn small variant="ghost" onClick={()=>openEdit(c)}>✏️ Editar</Btn>
          <Btn small variant="danger" onClick={()=>del(c.id)}>✕</Btn>
          <Btn small variant="pink" onClick={()=>setSelected(c)}>Ver perfil →</Btn>
        </div>
      </Card>);
    })}
    {open&&<Modal title={edit?"Editar Cliente":"Nova Cliente"} onClose={()=>setOpen(false)}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <PhotoUpload value={f.photo_url} onChange={v=>setF({...f,photo_url:v})} height={90}/>
        <Inp label="Nome *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Nome completo"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Telefone (com DDI)" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="5511999990000"/>
          <Inp label="Aniversário" type="date" value={f.birthday} onChange={e=>setF({...f,birthday:e.target.value})}/>
        </div>
        <Inp label="E-mail" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="email@exemplo.com"/>
        <Sel label="Categoria" value={f.category} onChange={e=>setF({...f,category:e.target.value})}>
          {Object.entries(CUST_CATS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </Sel>
        <TA label="Observações" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Tamanho preferido, gostos..."/>
        <div style={{display:"flex",gap:9,marginTop:4}}><Btn full onClick={save} variant="pink" disabled={saving}>{saving?<Spin/>:"Salvar"}</Btn><Btn full variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Btn></div>
      </div>
    </Modal>}
  </div>);
}

function CashFlow({sales,costs,installments}){
  const [month,setMonth]=useState(TODAY().slice(0,7));
  const mSales=sales.filter(s=>s.date.startsWith(month)&&!s.cancelled);
  const mCosts=costs.filter(c=>c.ref_month===month);
  const cancelledIds=new Set(sales.filter(s=>s.cancelled).map(s=>s.id));
  const mInst=installments.filter(i=>i.paid&&i.paid_at?.startsWith(month)&&!cancelledIds.has(i.sale_id));
  const totalIn=mInst.reduce((a,i)=>a+Number(i.amount),0);
  const totalOut=mCosts.reduce((a,c)=>a+Number(c.amount),0);
  const balance=totalIn-totalOut;
  const days=[];for(let d=1;d<=31;d++){const ds=`${month}-${String(d).padStart(2,"0")}`;const daySales=mSales.filter(s=>s.date===ds);if(daySales.length>0)days.push({day:String(d),entradas:+daySales.reduce((a,s)=>a+Number(s.total),0).toFixed(2)});}
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <Inp label="Mês" type="month" value={month} onChange={e=>setMonth(e.target.value)}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
      <Card style={{borderLeft:`3px solid ${G.green}`}}><div style={{color:G.muted,fontSize:10,textTransform:"uppercase"}}>Entradas</div><div style={{color:G.green,fontWeight:800,fontSize:16,marginTop:4}}>{R(totalIn)}</div></Card>
      <Card style={{borderLeft:`3px solid ${G.red}`}}><div style={{color:G.muted,fontSize:10,textTransform:"uppercase"}}>Saídas</div><div style={{color:G.red,fontWeight:800,fontSize:16,marginTop:4}}>{R(totalOut)}</div></Card>
      <Card style={{borderLeft:`3px solid ${balance>=0?G.green:G.red}`}}><div style={{color:G.muted,fontSize:10,textTransform:"uppercase"}}>Saldo</div><div style={{color:balance>=0?G.green:G.red,fontWeight:800,fontSize:16,marginTop:4}}>{R(balance)}</div></Card>
    </div>
    {days.length>0&&<Card>
      <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>📊 Entradas por dia</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={days} margin={{top:4,right:4,left:-24,bottom:0}}>
          <XAxis dataKey="day" tick={{fill:G.muted,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fill:G.muted,fontSize:10}} axisLine={false} tickLine={false}/>
          <Tooltip formatter={v=>R(v)} contentStyle={{background:G.surf,border:`1px solid ${G.bord}`,borderRadius:8,fontSize:12}}/>
          <Bar dataKey="entradas" fill={G.green} radius={[4,4,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>}
    <Card>
      <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>💸 Saídas do mês</div>
      {mCosts.length===0?<div style={{color:G.muted,fontSize:13}}>Nenhum custo lançado para este mês.</div>:mCosts.map(c=>(
        <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div><div style={{fontSize:13}}>{c.name}</div><div style={{color:G.muted,fontSize:11}}>{c.type==="fixed"?"Fixo":"Variável"}</div></div>
          <span style={{color:G.red,fontWeight:700}}>{R(c.amount)}</span>
        </div>
      ))}
    </Card>
  </div>);
}

function Reports({sales,products,customers,installments,costs,storeName}){
  const [month,setMonth]=useState(TODAY().slice(0,7));
  const mSales=sales.filter(s=>s.date.startsWith(month)&&!s.cancelled);
  const rev=mSales.reduce((a,s)=>a+Number(s.total),0);
  const cogs=mSales.reduce((a,s)=>a+s.items.reduce((b,i)=>b+Number(i.cost_price)*i.quantity,0),0);
  const mCosts=costs.filter(c=>c.ref_month===month).reduce((a,c)=>a+Number(c.amount),0);
  const profit=rev-cogs-mCosts;
  const prodMap={};mSales.forEach(s=>s.items.forEach(it=>{if(!prodMap[it.product_name])prodMap[it.product_name]={qty:0,rev:0};prodMap[it.product_name].qty+=it.quantity;prodMap[it.product_name].rev+=it.quantity*Number(it.unit_price);}));
  const topProds=Object.entries(prodMap).sort((a,b)=>b[1].qty-a[1].qty).slice(0,10);
  const printReport=()=>{
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>Relatório ${fmtMonth(month+"-01")}</title><style>body{font-family:sans-serif;padding:20px;color:#333}h1,h2{color:#7c3aed}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f0ff}.total{font-weight:bold;font-size:16px;color:#7c3aed}</style></head><body>
    <h1>📊 ${storeName} — Relatório ${fmtMonth(month+"-01")}</h1>
    <h2>Resumo Financeiro</h2>
    <table><tr><th>Indicador</th><th>Valor</th></tr>
    <tr><td>Faturamento</td><td>${R(rev)}</td></tr>
    <tr><td>CMV</td><td>${R(cogs)}</td></tr>
    <tr><td>Margem bruta</td><td>${R(rev-cogs)} (${rev?(((rev-cogs)/rev)*100).toFixed(1):0}%)</td></tr>
    <tr><td>Outros custos</td><td>${R(mCosts)}</td></tr>
    <tr><td class="total">Lucro líquido</td><td class="total">${R(profit)}</td></tr></table>
    <h2>Top Produtos</h2>
    <table><tr><th>Produto</th><th>Qtd</th><th>Receita</th></tr>
    ${topProds.map(([n,{qty,rev}])=>`<tr><td>${n}</td><td>${qty}</td><td>${R(rev)}</td></tr>`).join("")}
    </table>
    <p style="color:#999;font-size:12px;margin-top:20px">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
    </body></html>`);w.print();
  };
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"flex",gap:9,alignItems:"flex-end"}}>
      <Inp label="Mês do relatório" type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{flex:1}}/>
      <Btn onClick={printReport} variant="pink">🖨️ Imprimir PDF</Btn>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
      {[["Faturamento",R(rev),G.pink],["Margem bruta",R(rev-cogs),G.violet],["Outros custos",R(mCosts),G.amber],["Lucro líquido",R(profit),profit>=0?G.green:G.red]].map(([l,v,col])=>(
        <Card key={l} style={{borderLeft:`3px solid ${col}`,padding:"12px 13px"}}><div style={{color:G.muted,fontSize:10,textTransform:"uppercase"}}>{l}</div><div style={{color:col,fontWeight:800,fontSize:15,marginTop:4}}>{v}</div></Card>
      ))}
    </div>
    <Card>
      <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>🏆 Top produtos do mês</div>
      {topProds.length===0?<div style={{color:G.muted,fontSize:13}}>Sem vendas no mês.</div>:topProds.map(([name,{qty,rev}],i)=>(
        <div key={name} style={{display:"flex",alignItems:"center",gap:9,marginBottom:8}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:PAL[i%PAL.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>{i+1}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{name}</div><div style={{fontSize:11,color:G.muted}}>{qty} unidades</div></div>
          <span style={{color:PAL[i%PAL.length],fontWeight:700,fontSize:13}}>{R(rev)}</span>
        </div>
      ))}
    </Card>
  </div>);
}

function Settings({storeId,storeName,toast,onSignOut,storeSettings,onSettingsUpdate}){
  const [f,setF]=useState({name:storeName||"",logo_url:storeSettings?.logo_url||"",owner_name:storeSettings?.owner_name||"",owner_phone:storeSettings?.owner_phone||"",owner_email:storeSettings?.owner_email||"",address:storeSettings?.address||"",cnpj:storeSettings?.cnpj||"",monthly_goal:storeSettings?.monthly_goal||""});
  const [saving,setSaving]=useState(false);
  const save=async()=>{
    setSaving(true);
    await sb.from("stores").update({name:f.name,logo_url:f.logo_url,owner_name:f.owner_name,owner_phone:f.owner_phone,owner_email:f.owner_email,address:f.address,cnpj:f.cnpj,monthly_goal:+f.monthly_goal||0}).eq("id",storeId);
    onSettingsUpdate({...f,monthly_goal:+f.monthly_goal||0});
    toast("Configurações salvas! ✓");setSaving(false);
  };
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <Card>
      <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>🏪 Dados da loja</div>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
          <div style={{width:100,flexShrink:0}}>
            <span style={{color:G.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>Logo</span>
            <PhotoUpload value={f.logo_url} onChange={v=>setF({...f,logo_url:v})} height={80}/>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:11}}>
            <Inp label="Nome da loja *" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
            <Inp label="CNPJ / CPF" value={f.cnpj} onChange={e=>setF({...f,cnpj:e.target.value})} placeholder="00.000.000/0001-00"/>
          </div>
        </div>
        <Inp label="Endereço" value={f.address} onChange={e=>setF({...f,address:e.target.value})} placeholder="Rua, número, bairro, cidade"/>
      </div>
    </Card>
    <Card>
      <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>👤 Dados do proprietário</div>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <Inp label="Nome completo" value={f.owner_name} onChange={e=>setF({...f,owner_name:e.target.value})}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Telefone / WhatsApp" value={f.owner_phone} onChange={e=>setF({...f,owner_phone:e.target.value})} placeholder="5511999990000"/>
          <Inp label="E-mail" value={f.owner_email} onChange={e=>setF({...f,owner_email:e.target.value})}/>
        </div>
      </div>
    </Card>
    <Card>
      <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>🎯 Meta de vendas mensal</div>
      <Inp label="Meta mensal (R$)" value={f.monthly_goal} onChange={e=>setF({...f,monthly_goal:e.target.value})} type="number" min="0" step="100" placeholder="Ex: 5000"/>
    </Card>
    <Btn full onClick={save} variant="pink" disabled={saving} style={{padding:"12px 0",fontSize:15}}>{saving?<Spin/>:"💾 Salvar configurações"}</Btn>
    <Btn variant="danger" onClick={onSignOut} style={{alignSelf:"flex-start"}}>Sair da conta</Btn>
  </div>);
}

function AuthScreen({onAuth}){
  const [mode,setMode]=useState("login");const [email,setEmail]=useState("");const [pass,setPass]=useState("");
  const [store,setStore]=useState("");const [err,setErr]=useState("");const [loading,setLoad]=useState(false);
  const submit=async()=>{
    setErr("");setLoad(true);
    try{
      if(mode==="login"){const{data,error}=await sb.auth.signInWithPassword({email,password:pass});if(error)throw error;onAuth(data.user);}
      else{if(!store.trim())throw new Error("Nome da loja é obrigatório");const{data,error}=await sb.auth.signUp({email,password:pass});if(error)throw error;const{data:sd,error:sErr}=await sb.from("stores").insert({name:store,owner_email:email}).select().single();if(sErr)throw sErr;await sb.from("store_users").insert({store_id:sd.id,user_id:data.user.id,role:"owner"});onAuth(data.user);}
    }catch(e){setErr(e.message||"Erro desconhecido");}
    setLoad(false);
  };
  return(<div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"system-ui,sans-serif"}}>
    <div style={{width:"100%",maxWidth:400}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:44,marginBottom:8}}>👗</div>
        <div style={{fontSize:26,fontWeight:900,background:`linear-gradient(90deg,${G.pink},${G.violet})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Fitness CRM</div>
        <div style={{color:G.muted,fontSize:13,marginTop:4}}>Sistema de gestão para lojas fitness</div>
      </div>
      <Card style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:0,background:G.bg,borderRadius:10,padding:3}}>
          {[["login","Entrar"],["register","Criar conta"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setMode(k);setErr("");}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:mode===k?`linear-gradient(135deg,${G.pink},${G.violet})`:"transparent",color:mode===k?"#fff":G.muted,fontWeight:mode===k?700:400,fontSize:13,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        {mode==="register"&&<Inp label="Nome da loja" value={store} onChange={e=>setStore(e.target.value)} placeholder="Ex: Ella Fitness"/>}
        <Inp label="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/>
        <Inp label="Senha" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()}/>
        {err&&<div style={{color:G.red,fontSize:12,background:`${G.red}12`,borderRadius:8,padding:"8px 12px"}}>{err}</div>}
        <Btn full variant="pink" onClick={submit} disabled={loading} style={{padding:"12px 0",fontSize:15}}>{loading?<Spin/>:mode==="login"?"Entrar":"Criar conta"}</Btn>
      </Card>
      <div style={{textAlign:"center",color:G.muted,fontSize:11,marginTop:16}}>Dados armazenados com segurança via Supabase</div>
    </div>
  </div>);
}

const TABS=[{l:"Dashboard",i:"📊"},{l:"Nova Venda",i:"🛒"},{l:"Vendas",i:"🧾"},{l:"Vencimentos",i:"📅"},{l:"Clientes",i:"👤"},{l:"Produtos",i:"👗"},{l:"Custos",i:"💸"},{l:"Caixa",i:"💵"},{l:"Relatórios",i:"📋"},{l:"Config",i:"⚙️"}];

export default function Page(){
  const [user,setUser]=useState(null);const [storeId,setStoreId]=useState(null);
  const [storeName,setSName]=useState("Fitness CRM");const [storeSettings,setStoreSettings]=useState({});
  const [loading,setLoading]=useState(true);const [rtOk,setRtOk]=useState(false);
  const [tab,setTab]=useState(0);const [tn,setTn]=useState({msg:"",col:G.green});
  const [products,setProducts]=useState([]);const [customers,setCustomers]=useState([]);
  const [sales,setSales]=useState([]);const [installments,setInstallments]=useState([]);
  const [costs,setCosts]=useState([]);
  const toast=useCallback((msg,col=G.violet)=>{setTn({msg,col});setTimeout(()=>setTn({msg:"",col:G.violet}),2800);},[]);
  useEffect(()=>{
    sb.auth.getSession().then(({data:{session}})=>{if(session?.user)initStore(session.user);else setLoading(false);});
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,session)=>{if(session?.user)initStore(session.user);else{setUser(null);setStoreId(null);setLoading(false);}});
    return()=>subscription.unsubscribe();
  },[]);
  const initStore=async u=>{
    setUser(u);
    try{
      // Try store_users first
      const{data:su,error:suErr}=await sb.from("store_users").select("store_id").eq("user_id",u.id).single();
      let sid=su?.store_id;
      // Fallback: find store by owner email
      if(!sid){
        const{data:st}=await sb.from("stores").select("id,name").eq("owner_email",u.email).single();
        if(st){
          sid=st.id;
          // Create missing store_users link
          await sb.from("store_users").insert({store_id:st.id,user_id:u.id,role:"owner"}).select();
        }
      }
      if(sid){
        setStoreId(sid);
        const{data:st}=await sb.from("stores").select("*").eq("id",sid).single();
        if(st){setSName(st.name||"Fitness CRM");setStoreSettings(st);}
        loadAll(sid);
      }
    }catch(e){console.error("initStore error",e);}
    setLoading(false);
  };
  useEffect(()=>{if(!storeId)return;const cleanup=setupRealtime();return cleanup;},[storeId]);
  const loadAll=async(sid)=>{
    const id=sid||storeId;
    if(!id)return;
    console.log("loadAll with storeId:", id);
    const[p,c,s,i,co]=await Promise.all([
      sb.from("products").select("*").eq("store_id",id).order("name"),
      sb.from("customers").select("*").eq("store_id",id).order("name"),
      sb.from("sales").select("*,sale_items(*)").eq("store_id",id).order("date",{ascending:false}),
      sb.from("installments").select("*").eq("store_id",id).order("due_date"),
      sb.from("costs").select("*").eq("store_id",id).order("created_at",{ascending:false}),
    ]);
    console.log("products result:", p.data?.length, p.error);
    if(p.data)setProducts(p.data);
    if(c.data)setCustomers(c.data);
    if(s.data)setSales(s.data.map(sale=>({...sale,items:sale.sale_items||[]})));
    if(i.data)setInstallments(i.data);
    if(co.data)setCosts(co.data);
  };
  const setupRealtime=()=>{
    const ch=sb.channel(`store-${storeId}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"products",filter:`store_id=eq.${storeId}`},()=>loadAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"customers",filter:`store_id=eq.${storeId}`},()=>loadAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"sales",filter:`store_id=eq.${storeId}`},()=>loadAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"sale_items"},()=>loadAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"installments",filter:`store_id=eq.${storeId}`},()=>loadAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"costs",filter:`store_id=eq.${storeId}`},()=>loadAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"stores"},()=>loadAll())
      .subscribe(s=>{setRtOk(s==="SUBSCRIBED");});
    return()=>sb.removeChannel(ch);
  };
  const handleSignOut=async()=>{await sb.auth.signOut();setUser(null);setStoreId(null);setSales([]);setProducts([]);setCustomers([]);setInstallments([]);setCosts([]);};
  if(loading)return(<div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>👗</div><div style={{color:G.pink,fontWeight:700}}>Carregando...</div></div></div>);
  if(!user)return <AuthScreen onAuth={u=>initStore(u)}/>;
  const panels=[
    <Dashboard sales={sales} products={products} customers={customers} costs={costs} installments={installments} storeSettings={storeSettings}/>,
    <NewSale products={products} customers={customers} storeId={storeId} toast={toast} allInstallments={installments}/>,
    <SalesList sales={sales} customers={customers} installments={installments} storeId={storeId} toast={toast} products={products}/>,
    <DueDates installments={installments} customers={customers} storeName={storeName} toast={toast} sales={sales}/>,
    <Customers customers={customers} sales={sales} installments={installments} storeId={storeId} storeName={storeName} toast={toast}/>,
    <Products products={products} storeId={storeId} toast={toast} onRefresh={()=>loadAll(storeId)}/>,
    <Costs costs={costs} customers={customers} storeId={storeId} toast={toast}/>,
    <CashFlow sales={sales} costs={costs} installments={installments}/>,
    <Reports sales={sales} products={products} customers={customers} installments={installments} costs={costs} storeName={storeName}/>,
    <Settings storeId={storeId} storeName={storeName} toast={toast} onSignOut={handleSignOut} storeSettings={storeSettings} onSettingsUpdate={s=>{setStoreSettings(s);setSName(s.name);}}/>,
  ];
  return(<div style={{minHeight:"100vh",background:G.bg,fontFamily:"system-ui,'Segoe UI',sans-serif",color:G.text}}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:${G.bord2};border-radius:4px}`}</style>
    <div style={{background:"#0b0b1799",backdropFilter:"blur(14px)",borderBottom:`1px solid ${G.bord}`,padding:"10px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:300}}>
      {storeSettings?.logo_url
        ? <img src={storeSettings.logo_url} style={{height:44,maxWidth:160,objectFit:"contain",flexShrink:0,borderRadius:6}} alt="logo"/>
        : <div style={{width:36,height:36,borderRadius:9,flexShrink:0,background:`linear-gradient(135deg,${G.pink},${G.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>👗</div>
      }
      <div style={{flex:1}}>
        {!storeSettings?.logo_url&&<div style={{fontWeight:900,fontSize:14,background:`linear-gradient(90deg,${G.pink},${G.violet})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{storeName}</div>}
        {storeSettings?.owner_name&&<div style={{color:G.muted,fontSize:10}}>{storeSettings.owner_name}</div>}
      </div>
      <RTBadge connected={rtOk}/>
      <div style={{color:G.muted,fontSize:11,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
    </div>
    <div style={{display:"flex",overflowX:"auto",gap:1,padding:"7px 10px",borderBottom:`1px solid ${G.bord}`,background:G.bg,scrollbarWidth:"none"}}>
      {TABS.map((t,i)=>(
        <button key={i} onClick={()=>setTab(i)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderRadius:8,border:"none",background:tab===i?`${G.pink}20`:"transparent",color:tab===i?G.pink:G.muted,fontWeight:tab===i?700:400,fontSize:12,cursor:"pointer",borderBottom:tab===i?`2px solid ${G.pink}`:"2px solid transparent",whiteSpace:"nowrap"}}>
          <span>{t.i}</span><span>{t.l}</span>
        </button>
      ))}
    </div>
    <div style={{padding:"14px 14px 60px",maxWidth:740,margin:"0 auto"}}>{panels[tab]}</div>
    <Toast msg={tn.msg} color={tn.col}/>
  </div>);
}
