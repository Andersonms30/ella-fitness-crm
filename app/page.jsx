"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const SUPABASE_URL = "https://sxwjyvpqsprwthyqtjzy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4d2p5dnBxc3Byd3RoeXF0anp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTgxMjQsImV4cCI6MjA5NzczNDEyNH0.XnNgcXtLjol_-51JN74H9WztMUsDTuAChwFgIaRKqUQ";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);


// ── CONFIGURE AQUI ────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────



// ── Design Tokens ─────────────────────────────────────────────
const G = {
  bg:"#07070f", surf:"#0f0f1a", card:"#13131f", bord:"#ffffff0d", bord2:"#ffffff16",
  pink:"#f472b6", rose:"#fb7185", violet:"#a78bfa", purple:"#7c3aed",
  green:"#34d399", amber:"#fbbf24", red:"#f87171", sky:"#38bdf8",
  muted:"#ffffff38", sub:"#ffffff65", text:"#f5f5ff"
};
const PAL = [G.pink,G.violet,G.green,G.amber,G.rose,G.sky,"#fb923c","#a3e635"];
const METHODS = { pix:"PIX", debit:"Débito", credit:"Crédito", crediario:"Crediário" };
const MC = { pix:G.green, debit:G.amber, credit:G.violet, crediario:G.rose };

// ── Utils ─────────────────────────────────────────────────────
const R    = v => `R$ ${Number(v||0).toFixed(2).replace(".",",")}`;
const pct  = (a,b) => b ? ((a/b)*100).toFixed(1)+"%" : "—";
const TODAY= () => new Date().toISOString().slice(0,10);
const INI  = s => (s||"?").trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
const fmtD = d => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR") : "—";
const fmtMonth = d => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{month:"short",year:"numeric"}) : "";
const daysDiff = (a,b) => Math.ceil((new Date(b)-new Date(a))/(86400000));
const addMonths=(ds,n)=>{const d=new Date(ds+"T12:00:00");d.setMonth(d.getMonth()+n);return d.toISOString().slice(0,10);};
const dueDateDay=(ref,mo,day)=>{const d=new Date(ref+"T12:00:00");d.setMonth(d.getMonth()+mo);d.setDate(parseInt(day)||10);return d.toISOString().slice(0,10);};

// ── Primitives ────────────────────────────────────────────────
const Card = ({children,style,onClick}) => (
  <div onClick={onClick} style={{background:G.card,border:`1px solid ${G.bord}`,borderRadius:14,padding:"16px 18px",...style,cursor:onClick?"pointer":undefined}}>{children}</div>
);
const Badge = ({children,color}) => {
  const c=color||G.pink;
  return <span style={{background:c+"1e",color:c,border:`1px solid ${c}30`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{children}</span>;
};
const Btn = ({children,onClick,variant,small,full,disabled,style={}}) => {
  const bg = disabled?"#ffffff0e"
    : variant==="danger"  ? G.red
    : variant==="success" ? G.green
    : variant==="ghost"   ? "#ffffff0e"
    : variant==="amber"   ? `linear-gradient(135deg,${G.amber},#f59e0b)`
    : variant==="pink"    ? `linear-gradient(135deg,${G.pink},${G.rose})`
    : variant==="green"   ? `linear-gradient(135deg,${G.green},#059669)`
    : `linear-gradient(135deg,${G.violet},${G.purple})`;
  return (
    <button onClick={disabled?undefined:onClick} style={{
      background:bg, color:disabled?G.muted:"#fff", border:"none",
      borderRadius:9, padding:small?"5px 11px":"9px 18px",
      fontSize:small?12:14, fontWeight:700,
      cursor:disabled?"not-allowed":"pointer",
      width:full?"100%":undefined, flexShrink:0, ...style
    }}>{children}</button>
  );
};
const iS = {background:G.bg,color:G.text,border:`1px solid ${G.bord2}`,borderRadius:9,padding:"9px 12px",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
const Inp = ({label,hint,...p}) => (
  <div style={{display:"flex",flexDirection:"column",gap:4}}>
    {label && <span style={{color:G.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.8}}>{label}</span>}
    <input {...p} style={{...iS,...p.style}}/>
    {hint && <span style={{color:G.muted,fontSize:11}}>{hint}</span>}
  </div>
);
const Sel = ({label,children,...p}) => (
  <div style={{display:"flex",flexDirection:"column",gap:4}}>
    {label && <span style={{color:G.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.8}}>{label}</span>}
    <select {...p} style={{...iS,...p.style}}>{children}</select>
  </div>
);
const TA = ({label,...p}) => (
  <div style={{display:"flex",flexDirection:"column",gap:4}}>
    {label && <span style={{color:G.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.8}}>{label}</span>}
    <textarea {...p} style={{...iS,resize:"vertical",minHeight:60,...p.style}}/>
  </div>
);
const Divider = ({my=12}) => <div style={{height:1,background:G.bord,margin:`${my}px 0`}}/>;
const Spin = () => (
  <div style={{display:"inline-block",width:16,height:16,border:`2px solid ${G.muted}`,borderTopColor:G.pink,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
);
function Toast({msg,color}){
  if(!msg)return null;
  return <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:color||G.violet,color:"#fff",padding:"10px 22px",borderRadius:10,fontWeight:700,fontSize:13,zIndex:3000,boxShadow:"0 4px 28px #0009",whiteSpace:"nowrap",pointerEvents:"none"}}>{msg}</div>;
}
function Modal({title,onClose,children,wide}){
  return(
    <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:G.surf,border:`1px solid ${G.bord2}`,borderRadius:18,padding:22,width:"100%",maxWidth:wide?700:480,marginTop:24,marginBottom:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <strong style={{fontSize:16}}>{title}</strong>
          <button onClick={onClose} style={{background:"none",border:"none",color:G.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function PhotoUpload({value,onChange}){
  const ref=useRef();
  const handle=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onChange(ev.target.result);r.readAsDataURL(f);};
  return(
    <div>
      <span style={{color:G.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>Foto</span>
      <div onClick={()=>ref.current.click()} style={{width:"100%",height:110,borderRadius:10,border:`2px dashed ${G.bord2}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",background:G.bg,position:"relative"}}>
        {value?<img src={value} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<><span style={{fontSize:24,marginBottom:4}}>📷</span><span style={{color:G.muted,fontSize:12}}>Adicionar foto</span></>}
        {value&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:"#000a",textAlign:"center",fontSize:11,color:"#fff",padding:"3px 0"}}>Trocar</div>}
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={handle} style={{display:"none"}}/>
    </div>
  );
}

// ── Realtime indicator ────────────────────────────────────────
function RTBadge({connected}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:connected?G.green:G.amber}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:connected?G.green:G.amber,boxShadow:connected?`0 0 6px ${G.green}`:undefined}}/>
      {connected?"Ao vivo":"Reconectando..."}
    </div>
  );
}

// ── WA helper ─────────────────────────────────────────────────
function waLink(phone, custName, instN, val, dueDate, storeName, overdue){
  const clean = phone.replace(/\D/g,"");
  const first = (custName||"").split(" ")[0];
  const msg = overdue
    ? `Olá ${first}! 😊 Aqui é da ${storeName}. A parcela ${instN}/${" "} no valor de ${R(val)} venceu em ${fmtD(dueDate)}. Podemos resolver? 🙏`
    : `Olá ${first}! 😊 Aqui é da ${storeName}. Lembrete: parcela ${instN} de ${R(val)} vence em ${fmtD(dueDate)}. Qualquer dúvida fale com a gente! 💪`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

// ── Auth Screen ───────────────────────────────────────────────
function AuthScreen({onAuth}){
  const [mode,  setMode]  = useState("login");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [store, setStore] = useState("");
  const [err,   setErr]   = useState("");
  const [loading,setLoad] = useState(false);

  const submit = async () => {
    setErr(""); setLoad(true);
    try {
      if(mode==="login"){
        const {data,error} = await sb.auth.signInWithPassword({email,password:pass});
        if(error) throw error;
        onAuth(data.user);
      } else {
        if(!store.trim()) throw new Error("Nome da loja é obrigatório");
        const {data,error} = await sb.auth.signUp({email,password:pass});
        if(error) throw error;
        // Create store + link user
        const {data:storeData,error:sErr} = await sb.from("stores").insert({name:store,owner_email:email}).select().single();
        if(sErr) throw sErr;
        await sb.from("store_users").insert({store_id:storeData.id,user_id:data.user.id,role:"owner"});
        onAuth(data.user);
      }
    } catch(e){ setErr(e.message||"Erro desconhecido"); }
    setLoad(false);
  };

  return(
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:44,marginBottom:8}}>👗</div>
          <div style={{fontSize:26,fontWeight:900,background:`linear-gradient(90deg,${G.pink},${G.violet})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FITPRO GESTÃO CRM</div>
          <div style={{color:G.muted,fontSize:13,marginTop:4}}>Sistema de gestão comercial completo</div>
        </div>
        <Card style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",gap:0,background:G.bg,borderRadius:10,padding:3}}>
            {[["login","Entrar"],["register","Criar conta"]].map(([k,l])=>(
              <button key={k} onClick={()=>{setMode(k);setErr("");}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:mode===k?`linear-gradient(135deg,${G.pink},${G.violet})`:"transparent",color:mode===k?"#fff":G.muted,fontWeight:mode===k?700:400,fontSize:13,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
          {mode==="register" && <Inp label="Nome da loja" value={store} onChange={e=>setStore(e.target.value)} placeholder="Ex: FitStore Moda Fitness"/>}
          <Inp label="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/>
          <Inp label="Senha" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()}/>
          {err && <div style={{color:G.red,fontSize:12,background:`${G.red}12`,borderRadius:8,padding:"8px 12px"}}>{err}</div>}
          <Btn full variant="pink" onClick={submit} disabled={loading} style={{padding:"12px 0",fontSize:15}}>
            {loading?<Spin/>:mode==="login"?"Entrar":"Criar conta"}
          </Btn>
        </Card>
        <div style={{textAlign:"center",color:G.muted,fontSize:11,marginTop:16}}>
          Dados armazenados com segurança via Supabase
        </div>
      </div>
    </div>
  );
}

// ── Period Picker ─────────────────────────────────────────────
function PeriodPicker({df,dt,setDf,setDt,preset,setPreset}){
  const apply = k => {
    setPreset(k);
    const now = new Date();
    if(k==="7d"){const d=new Date();d.setDate(now.getDate()-6);setDf(d.toISOString().slice(0,10));setDt(now.toISOString().slice(0,10));}
    else if(k==="30d"){const d=new Date();d.setDate(now.getDate()-29);setDf(d.toISOString().slice(0,10));setDt(now.toISOString().slice(0,10));}
    else if(k==="60d"){const d=new Date();d.setDate(now.getDate()-59);setDf(d.toISOString().slice(0,10));setDt(now.toISOString().slice(0,10));}
    else if(k==="mes"){const d=new Date(now.getFullYear(),now.getMonth(),1);setDf(d.toISOString().slice(0,10));setDt(now.toISOString().slice(0,10));}
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {[["7d","7 dias"],["30d","30 dias"],["60d","60 dias"],["mes","Este mês"],["custom","Período"]].map(([k,l])=>(
          <button key={k} onClick={()=>apply(k)} style={{padding:"5px 12px",borderRadius:20,border:"none",fontSize:12,fontWeight:preset===k?700:400,background:preset===k?G.pink:"#ffffff0e",color:preset===k?"#fff":G.muted,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      {preset==="custom"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          <Inp label="De" type="date" value={df} onChange={e=>setDf(e.target.value)}/>
          <Inp label="Até" type="date" value={dt} onChange={e=>setDt(e.target.value)}/>
        </div>
      )}
    </div>
  );
}

// ── InstallmentRow ────────────────────────────────────────────
function InstRow({inst,custName,custPhone,onPay,storeName,showWA=true}){
  const overdue = !inst.paid && inst.due_date < TODAY();
  const dueToday= !inst.paid && inst.due_date === TODAY();
  const col = inst.paid?G.green:overdue?G.red:dueToday?G.amber:G.muted+"88";
  return(
    <div style={{display:"flex",alignItems:"center",gap:9,background:inst.paid?"#34d39910":overdue?"#f8717110":dueToday?"#fbbf2410":"#ffffff07",border:`1px solid ${inst.paid?G.green+"30":overdue?G.red+"30":dueToday?G.amber+"30":G.bord}`,borderRadius:9,padding:"9px 12px"}}>
      <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,background:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{inst.number}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:inst.paid?G.green:overdue?G.red:G.text}}>{R(inst.amount)}</div>
        <div style={{fontSize:11,color:G.muted}}>Venc: {fmtD(inst.due_date)}{inst.paid_at?` · Pago em ${fmtD(inst.paid_at.slice(0,10))}`:"" }</div>
      </div>
      <Badge color={inst.paid?G.green:overdue?G.red:dueToday?G.amber:G.violet}>{inst.paid?"Pago":overdue?"Vencida":dueToday?"Hoje":"Pendente"}</Badge>
      {!inst.paid && onPay && <Btn small variant="success" onClick={()=>onPay(inst.id)}>✓</Btn>}
      {!inst.paid && showWA && custPhone && (
        <button onClick={()=>window.open(waLink(custPhone,custName,inst.number,inst.amount,inst.due_date,storeName,overdue),"_blank")}
          style={{background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",borderRadius:7,padding:"4px 9px",fontSize:13,cursor:"pointer",fontWeight:700,flexShrink:0}}>📱</button>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard({sales,products,customers,costs,installments,storeSettings}){
  const [preset,setPreset]=useState("30d");
  const [df,setDf]=useState(()=>{const d=new Date();d.setDate(d.getDate()-29);return d.toISOString().slice(0,10);});
  const [dt,setDt]=useState(TODAY);
  const meta=storeSettings?.monthly_goal||0;

  // Período atual — só vendas confirmadas (não orçamentos, não canceladas)
  const fSales=sales.filter(s=>s.date>=df&&s.date<=dt&&!s.cancelled&&!s.is_quote);
  const fQuotes=sales.filter(s=>s.date>=df&&s.date<=dt&&!s.cancelled&&s.is_quote);
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
  const ticketMedio=fSales.length?totalRev/fSales.length:0;
  const taxaConv=fSales.length+fQuotes.length>0?(fSales.length/(fSales.length+fQuotes.length)*100):0;

  // Período anterior equivalente
  const diffDays=Math.max(1,Math.ceil((new Date(dt)-new Date(df))/(86400000)));
  const prevDt=new Date(df+"T12:00:00");prevDt.setDate(prevDt.getDate()-1);
  const prevDf=new Date(prevDt);prevDf.setDate(prevDf.getDate()-(diffDays-1));
  const prevDfStr=prevDf.toISOString().slice(0,10);
  const prevDtStr=prevDt.toISOString().slice(0,10);
  const prevSales=sales.filter(s=>s.date>=prevDfStr&&s.date<=prevDtStr&&!s.cancelled&&!s.is_quote);
  const prevRev=prevSales.reduce((a,s)=>a+Number(s.total),0);
  const prevCogs=prevSales.reduce((a,s)=>a+s.items.reduce((b,i)=>b+Number(i.cost_price)*i.quantity,0),0);
  const prevProfit=prevRev-prevCogs;
  const prevTicket=prevSales.length?prevRev/prevSales.length:0;

  const varPct=(cur,prev)=>{if(!prev||prev===0)return null;return((cur-prev)/prev*100);};
  const VarTag=({cur,prev})=>{const v=varPct(cur,prev);if(v===null)return null;const up=v>=0;return <span style={{fontSize:11,fontWeight:700,color:up?G.green:G.red,marginLeft:5,background:up?`${G.green}18`:`${G.red}18`,padding:"2px 6px",borderRadius:10}}>{up?"↑":"↓"}{Math.abs(v).toFixed(1)}%</span>;};

  // Inadimplência proativa
  const inadimPct=totalRev>0?(overdueAll/totalRev)*100:0;

  // Mini-ranking de vendedores
  const sellerMap={};fSales.forEach(s=>{if(s.seller_name){sellerMap[s.seller_name]=(sellerMap[s.seller_name]||0)+Number(s.total);}});
  const sellers=Object.entries(sellerMap).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Meta
  const metaPct=meta?Math.min(100,(totalRev/meta)*100):0;

  // Aniversários
  const todayStr=`${String(new Date().getMonth()+1).padStart(2,"0")}-${String(new Date().getDate()).padStart(2,"0")}`;
  const birthdays=customers.filter(c=>c.birthday&&c.birthday.slice(5)===todayStr);

  // Gráfico
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

  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <Card style={{padding:"12px 16px"}}><PeriodPicker df={df} dt={dt} setDf={setDf} setDt={setDt} preset={preset} setPreset={setPreset}/></Card>

    {/* Aniversários */}
    {birthdays.length>0&&<Card style={{background:"#fbbf2410",borderColor:G.amber+"44"}}>
      <div style={{fontWeight:700,color:G.amber,marginBottom:8}}>🎂 Aniversários hoje!</div>
      {birthdays.map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:13}}>{c.name}</span>
        {c.phone&&<button onClick={()=>window.open(waBirthday(c.phone,c.name,storeSettings?.name||"nossa loja"),"_blank")} style={{background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",borderRadius:7,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:700}}>🎉 Parabenizar</button>}
      </div>)}
    </Card>}

    {/* Alerta inadimplência proativo */}
    {inadimPct>10&&<Card style={{background:`${G.red}10`,borderColor:G.red+"55"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{fontSize:20}}>🚨</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,color:G.red,fontSize:14}}>Alerta de Inadimplência</div>
          <div style={{color:G.muted,fontSize:12,marginTop:2}}>Parcelas vencidas representam <span style={{color:G.red,fontWeight:700}}>{inadimPct.toFixed(1)}%</span> da receita — risco de {R(overdueAll)} em perda.</div>
        </div>
        <div style={{textAlign:"right"}}><div style={{color:G.red,fontWeight:900,fontSize:18}}>{R(overdueAll)}</div><div style={{color:G.muted,fontSize:11}}>em atraso</div></div>
      </div>
    </Card>}

    {/* Meta */}
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

    {/* KPIs principais com comparativo */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
      {[
        ["💰","Faturamento",totalRev,prevRev,G.pink],
        ["🏆","Lucro líquido",netProfit,prevProfit,netProfit>=0?G.green:G.red],
        ["💸","Custos totais",totalCosts,null,G.amber],
        ["📊","Margem bruta",grossMargin,null,G.violet],
        ["🕐","A receber",pendingAll,null,G.sky],
        ["⚠️","Vencidos",overdueAll,null,G.red],
      ].map(([ic,l,v,pv,col])=>(
        <Card key={l} style={{borderLeft:`3px solid ${col}`,padding:"13px 14px"}}>
          <div style={{fontSize:14,marginBottom:4}}>{ic}</div>
          <div style={{color:"#ffffffaa",fontSize:10,textTransform:"uppercase",letterSpacing:.8,fontWeight:600}}>{l}</div>
          <div style={{display:"flex",alignItems:"baseline",flexWrap:"wrap",gap:2,marginTop:4}}>
            <span style={{color:col,fontSize:17,fontWeight:900}}>{R(v)}</span>
            {pv!==null&&<VarTag cur={v} prev={pv}/>}
          </div>
          {pv!==null&&pv>0&&<div style={{color:"#ffffff88",fontSize:10,marginTop:3}}>Ant: {R(pv)}</div>}
        </Card>
      ))}
    </div>

    {/* KPIs secundários */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
      <Card style={{padding:"12px 13px",borderLeft:`3px solid ${G.sky}`}}>
        <div style={{color:"#ffffffaa",fontSize:10,textTransform:"uppercase",fontWeight:600}}>🎫 Ticket médio</div>
        <div style={{display:"flex",alignItems:"baseline",gap:4,marginTop:3}}>
          <span style={{color:G.sky,fontWeight:800,fontSize:15}}>{R(ticketMedio)}</span>
          <VarTag cur={ticketMedio} prev={prevTicket}/>
        </div>
        <div style={{color:"#ffffff88",fontSize:10,marginTop:2}}>{fSales.length} vendas · Ant: {prevSales.length}</div>
      </Card>
      <Card style={{padding:"12px 13px",borderLeft:`3px solid ${G.green}`}}>
        <div style={{color:"#ffffffaa",fontSize:10,textTransform:"uppercase",fontWeight:600}}>🎯 Conversão</div>
        <div style={{color:G.green,fontWeight:800,fontSize:15,marginTop:3}}>{taxaConv.toFixed(1)}%</div>
        <div style={{color:"#ffffff88",fontSize:10,marginTop:2}}>{fSales.length} vendas · {fQuotes.length} orç.</div>
      </Card>
      <Card style={{padding:"12px 13px",borderLeft:`3px solid ${G.violet}`}}>
        <div style={{color:"#ffffffaa",fontSize:10,textTransform:"uppercase",fontWeight:600}}>📊 Margem %</div>
        <div style={{color:G.violet,fontWeight:800,fontSize:15,marginTop:3}}>{marginPct}%</div>
        <div style={{color:"#ffffff88",fontSize:10,marginTop:2}}>Bruta s/ receita</div>
      </Card>
    </div>

    {/* Comparativo período anterior */}
    <Card style={{background:`${G.violet}08`,borderColor:`${G.violet}30`}}>
      <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:G.violet}}>📅 vs. período anterior ({fmtD(prevDfStr)} – {fmtD(prevDtStr)})</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[["Receita",totalRev,prevRev,G.pink],["Lucro",netProfit,prevProfit,G.green],["Vendas",fSales.length,prevSales.length,G.violet]].map(([l,cur,prev,col])=>{
          const v=varPct(cur,prev);const up=v!==null&&v>=0;
          return(<div key={l} style={{textAlign:"center"}}>
            <div style={{color:G.muted,fontSize:11}}>{l}</div>
            <div style={{color:col,fontWeight:700,fontSize:14,marginTop:2}}>{typeof cur==="number"&&cur>100?R(cur):cur}</div>
            {v!==null&&<div style={{fontSize:12,color:up?G.green:G.red,fontWeight:700,marginTop:2}}>{up?"↑":"↓"}{Math.abs(v).toFixed(1)}%</div>}
          </div>);
        })}
      </div>
    </Card>

    {/* Custos */}
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

    {/* Gráfico */}
    <Card>
      <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>📈 Receita vs Custo</div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{top:4,right:4,left:-24,bottom:0}}>
          <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={G.pink} stopOpacity={0.3}/><stop offset="95%" stopColor={G.pink} stopOpacity={0}/></linearGradient></defs>
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
        <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>🏷️ Categorias</div>
        {pie.length===0?<div style={{color:G.muted,textAlign:"center",padding:18,fontSize:13}}>Sem vendas</div>:
        <><ResponsiveContainer width="100%" height={120}><PieChart><Pie data={pie} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={3}>{pie.map((_,i)=><Cell key={i} fill={PAL[i%PAL.length]}/>)}</Pie><Tooltip formatter={v=>R(v)} contentStyle={{background:G.surf,border:`1px solid ${G.bord}`,borderRadius:8,fontSize:12}}/></PieChart></ResponsiveContainer>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{pie.map((p,i)=><Badge key={p.name} color={PAL[i%PAL.length]}>{p.name}</Badge>)}</div></>}
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
      </Card>
    </div>

    {/* Top clientes */}
    <Card>
      <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>⭐ Top clientes</div>
      {topC.filter(c=>c.n>0).length===0?<div style={{color:G.muted,fontSize:13}}>Sem vendas no período.</div>:
      topC.filter(c=>c.n>0).map((c,i)=>(
        <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<3?10:0}}>
          <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${PAL[i]},${PAL[(i+3)%PAL.length]})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#fff"}}>{INI(c.name)}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{c.name}</div><div style={{fontSize:11,color:G.muted}}>{c.n} compra(s)</div></div>
          <span style={{color:G.pink,fontWeight:800,fontSize:14}}>{R(c.spent)}</span>
        </div>
      ))}
    </Card>

    {/* Mini-ranking vendedores */}
    {sellers.length>0&&<Card>
      <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>🏅 Ranking de vendedores</div>
      {sellers.map(([name,total],i)=>(
        <div key={name} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<sellers.length-1?8:0}}>
          <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,background:PAL[i%PAL.length],display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#fff"}}>{i+1}</div>
          <div style={{flex:1,fontSize:13,fontWeight:600}}>{name}</div>
          <span style={{color:PAL[i%PAL.length],fontWeight:700,fontSize:14}}>{R(total)}</span>
        </div>
      ))}
    </Card>}
  </div>);
}

// ── Products ──────────────────────────────────────────────────
function Products({products,storeId,toast,onRefresh}){
  const [open,setOpen]=useState(false);const [edit,setEdit]=useState(null);
  const [q,setQ]=useState("");const [catFil,setCatFil]=useState("");
  const [newCatMode,setNewCatMode]=useState(false);
  const empty={name:"",category:"",cost_price:"",sale_price:"",stock:"",description:"",photo_url:""};
  const [f,setF]=useState(empty);const [saving,setSaving]=useState(false);

  const openNew=()=>{setF(empty);setEdit(null);setNewCatMode(false);setOpen(true);};
  const openEdit=p=>{setF({name:p.name,category:p.category||"",cost_price:p.cost_price,sale_price:p.sale_price,stock:p.stock,description:p.description||"",photo_url:p.photo_url||""});setEdit(p);setNewCatMode(false);setOpen(true);};
  const save=async()=>{
    if(!f.name||!f.sale_price){toast("Nome e preço são obrigatórios","#f87171");return;}
    if(!f.category){toast("Categoria é obrigatória","#f87171");return;}
    setSaving(true);
    const d={name:f.name,category:f.category.trim(),cost_price:+f.cost_price||0,sale_price:+f.sale_price,stock:+f.stock||0,description:f.description||"",photo_url:f.photo_url||"",store_id:storeId,active:true};
    const {error}=edit?await sb.from("products").update(d).eq("id",edit.id):await sb.from("products").insert(d);
    if(error){toast("Erro: "+error.message,"#f87171");}else{toast(edit?"Produto atualizado!":"Produto cadastrado!");setOpen(false);}
    setSaving(false);
  };
  const del=async id=>{await sb.from("products").update({active:false}).eq("id",id);toast("Removido","#f87171");};

  const margin = f.sale_price&&f.cost_price ? (((+f.sale_price-+f.cost_price)/+f.sale_price)*100).toFixed(1) : null;
  // Categorias exatas (sem misturar "Conjunto de calça" com "Conjunto de calça Ella")
  const cats=[...new Set(products.filter(p=>p.active!==false).map(p=>p.category).filter(Boolean))].sort();
  const list=products.filter(p=>{
    if(p.active===false)return false;
    if(catFil&&p.category!==catFil)return false; // match EXATO, não includes()
    if(q&&!p.name.toLowerCase().includes(q.toLowerCase())&&!p.description?.toLowerCase().includes(q.toLowerCase()))return false;
    return true;
  });

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",gap:9}}><Inp placeholder="🔍 Buscar por nome ou descrição..." value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}}/><Btn onClick={openNew} variant="pink">+ Produto</Btn></div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        <button onClick={()=>setCatFil("")} style={{padding:"4px 11px",borderRadius:20,border:"none",background:!catFil?G.pink:"#ffffff10",color:!catFil?"#fff":"#ffffffcc",fontSize:12,cursor:"pointer",fontWeight:!catFil?700:400}}>Todos</button>
        {cats.map(c=><button key={c} onClick={()=>setCatFil(catFil===c?"":c)} style={{padding:"4px 11px",borderRadius:20,border:"none",background:catFil===c?G.pink:"#ffffff10",color:catFil===c?"#fff":"#ffffffcc",fontSize:12,cursor:"pointer",fontWeight:catFil===c?700:400}}>{c}</button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:11}}>
        {list.map(p=>{
          const mg=p.sale_price&&p.cost_price?(((p.sale_price-p.cost_price)/p.sale_price)*100).toFixed(0):null;
          return(
            <div key={p.id} style={{background:G.card,border:`1px solid ${G.bord}`,borderRadius:14,overflow:"hidden"}}>
              <div style={{width:"100%",height:100,background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                {p.photo_url?<img src={p.photo_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:32}}>👗</span>}
              </div>
              <div style={{padding:"10px 12px"}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:3,lineHeight:1.3}}>{p.name}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4}}>
                  <Badge color={G.pink}>{p.category}</Badge>
                  <span style={{color:G.pink,fontWeight:800,fontSize:14}}>{R(p.sale_price)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:5,fontSize:11,color:"#ffffff88"}}>
                  <span>Custo: {R(p.cost_price)}</span>
                  {mg&&<span style={{color:G.green}}>Mg: {mg}%</span>}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
                  <span style={{color:p.stock<=3?G.red:"#ffffff88",fontSize:12}}>Est: {p.stock}</span>
                  <div style={{display:"flex",gap:5}}><Btn small variant="ghost" onClick={()=>openEdit(p)}>✏️</Btn><Btn small variant="danger" onClick={()=>del(p.id)}>✕</Btn></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {open&&<Modal title={edit?"Editar Produto":"Novo Produto"} onClose={()=>setOpen(false)}>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <PhotoUpload value={f.photo_url} onChange={v=>setF({...f,photo_url:v})}/>
          <Inp label="Nome *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Ex: Legging Power Preta P"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:"#ffffffaa",fontSize:11,textTransform:"uppercase",letterSpacing:.8}}>Categoria *</span>
                <button onClick={()=>{setNewCatMode(!newCatMode);setF({...f,category:""});}} style={{background:"none",border:"none",color:G.violet,fontSize:11,cursor:"pointer",fontWeight:700}}>
                  {newCatMode?"↩ Selecionar existente":"+ Nova categoria"}
                </button>
              </div>
              {newCatMode||cats.length===0?
                <input value={f.category} onChange={e=>setF({...f,category:e.target.value})} placeholder="Digite a nova categoria" style={iS}/>
                :<select value={f.category} onChange={e=>setF({...f,category:e.target.value})} style={iS}>
                  <option value="">Selecione...</option>
                  {cats.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              }
            </div>
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
    </div>
  );
}

// ── Costs ─────────────────────────────────────────────────────
function Costs({costs,customers,storeId,toast}){
  const [open,setOpen]=useState(false);const [edit,setEdit]=useState(null);
  const empty={name:"",amount:"",type:"fixed",recurrent:true,ref_month:"",customer_id:""};
  const [f,setF]=useState(empty);const [saving,setSaving]=useState(false);

  const openNew=()=>{setF({...empty,ref_month:TODAY().slice(0,7)});setEdit(null);setOpen(true);};
  const openEdit=c=>{setF({name:c.name,amount:c.amount,type:c.type,recurrent:c.recurrent,ref_month:c.ref_month||"",customer_id:c.customer_id||""});setEdit(c);setOpen(true);};
  const save=async()=>{
    if(!f.name||!f.amount){toast("Preencha nome e valor","#f87171");return;}
    setSaving(true);
    const d={name:f.name,amount:+f.amount,type:f.type,recurrent:f.recurrent,ref_month:f.ref_month||null,customer_id:f.customer_id||null,store_id:storeId};
    const{error}=edit?await sb.from("costs").update(d).eq("id",edit.id):await sb.from("costs").insert(d);
    if(error)toast("Erro: "+error.message,"#f87171");else{toast(edit?"Custo atualizado!":"Custo lançado!");setOpen(false);}
    setSaving(false);
  };
  const del=async id=>{await sb.from("costs").delete().eq("id",id);toast("Removido","#f87171");};

  const fixed=costs.filter(c=>c.type==="fixed");const variable=costs.filter(c=>c.type==="variable");
  const totalF=fixed.reduce((a,c)=>a+Number(c.amount),0);const totalV=variable.reduce((a,c)=>a+Number(c.amount),0);

  const CostRow=({c})=>{
    const cust=customers.find(x=>x.id===c.customer_id);
    return(
      <div style={{display:"flex",alignItems:"center",gap:9,background:"#ffffff06",borderRadius:9,padding:"9px 12px",marginBottom:6}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600}}>{c.name}</div>
          <div style={{color:G.muted,fontSize:11,marginTop:2}}>
            {c.type==="fixed"?"Fixo":"Variável"}
            {c.ref_month?" · "+fmtMonth(c.ref_month+"-01"):""}
            {cust?" · "+cust.name:""}
          </div>
        </div>
        <span style={{color:G.amber,fontWeight:700,fontSize:14}}>{R(c.amount)}</span>
        <Btn small variant="ghost" onClick={()=>openEdit(c)}>✏️</Btn>
        <Btn small variant="danger" onClick={()=>del(c.id)}>✕</Btn>
      </div>
    );
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{color:G.muted,fontSize:12}}>Total fixos: <span style={{color:G.amber,fontWeight:700}}>{R(totalF)}</span> · Variáveis: <span style={{color:G.violet,fontWeight:700}}>{R(totalV)}</span></div></div>
        <Btn onClick={openNew} variant="pink" small>+ Lançar custo</Btn>
      </div>

      <Card>
        <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>🔒 Custos Fixos</div>
        {fixed.length===0?<div style={{color:G.muted,fontSize:13}}>Nenhum custo fixo lançado.</div>:fixed.map(c=><CostRow key={c.id} c={c}/>)}
      </Card>
      <Card>
        <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>📦 Custos Variáveis / Entrega</div>
        {variable.length===0?<div style={{color:G.muted,fontSize:13}}>Nenhum custo variável lançado.</div>:variable.map(c=><CostRow key={c.id} c={c}/>)}
      </Card>

      {open&&<Modal title={edit?"Editar Custo":"Lançar Custo"} onClose={()=>setOpen(false)}>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <Inp label="Descrição *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Ex: Aluguel, Taxa de entrega, Embalagem..."/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Inp label="Valor R$ *" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} type="number" min="0" step="0.01"/>
            <Sel label="Tipo" value={f.type} onChange={e=>setF({...f,type:e.target.value})}>
              <option value="fixed">Fixo (recorrente)</option>
              <option value="variable">Variável / Entrega</option>
            </Sel>
          </div>
          <Inp label="Mês de referência" type="month" value={f.ref_month} onChange={e=>setF({...f,ref_month:e.target.value})}/>
          <Sel label="Vincular a cliente (opcional — cobra só desta cliente)" value={f.customer_id} onChange={e=>setF({...f,customer_id:e.target.value})}>
            <option value="">Global (todas)</option>
            {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </Sel>
          <div style={{background:`${G.amber}10`,border:`1px solid ${G.amber}25`,borderRadius:9,padding:"9px 13px",fontSize:12,color:G.muted}}>
            💡 Custos vinculados a uma cliente são descontados apenas nos relatórios dessa cliente. Custos globais são rateados no resultado geral.
          </div>
          <div style={{display:"flex",gap:9,marginTop:4}}><Btn full onClick={save} variant="pink" disabled={saving}>{saving?<Spin/>:"Salvar"}</Btn><Btn full variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Btn></div>
        </div>
      </Modal>}
    </div>
  );
}

// ── New Sale ──────────────────────────────────────────────────
function NewSale({products,customers,storeId,toast,allSales,allInstallments}){
  const [cId,setCId]=useState("");const [date,setDate]=useState(TODAY());
  const [items,setItems]=useState([]);const [method,setMethod]=useState("pix");
  const [parc,setParc]=useState(1);const [diaVenc,setDiaVenc]=useState("10");
  const [notes,setNotes]=useState("");const [inclPend,setInclPend]=useState(false);
  const [saving,setSaving]=useState(false);

  const [prodCat,setProdCat]=useState("");
  const [prodQ,setProdQ]=useState("");
  const selC=customers.find(c=>c.id===cId);
  const pendInst=cId?allInstallments.filter(i=>i.customer_id===cId&&!i.paid):[];
  const pendTotal=pendInst.reduce((a,i)=>a+Number(i.amount),0);

  const addItem=pid=>{const p=products.find(x=>x.id===pid);if(!p)return;if(items.find(x=>x.pid===pid))setItems(items.map(x=>x.pid===pid?{...x,qty:x.qty+1}:x));else setItems([...items,{pid:pid,qty:1,sale_price:p.sale_price,cost_price:p.cost_price,name:p.name,category:p.category}]);};
  const rmItem=pid=>setItems(items.filter(x=>x.pid!==pid));
  const chgQty=(pid,q)=>q<1?rmItem(pid):setItems(items.map(x=>x.pid===pid?{...x,qty:q}:x));

  const sub=items.reduce((a,x)=>a+x.qty*x.sale_price,0);
  const cmv=items.reduce((a,x)=>a+x.qty*x.cost_price,0);
  const canParc=method==="credit"||method==="crediario";
  const effParc=canParc?parc:1;
  const total=inclPend?+(sub+pendTotal).toFixed(2):sub;
  const instVal=+(total/effParc).toFixed(2);

  const submit=async()=>{
    if(!items.length){toast("Adicione pelo menos um produto","#f87171");return;}
    setSaving(true);
    try{
      // 1. Create sale
      const{data:sale,error:sErr}=await sb.from("sales").insert({
        store_id:storeId,customer_id:cId||null,date,
        subtotal:sub,total_cost:cmv,total,method,installments:effParc,notes
      }).select().single();
      if(sErr)throw sErr;

      // 2. Insert items
      await sb.from("sale_items").insert(items.map(it=>({
        sale_id:sale.id,product_id:it.pid,product_name:it.name,
        category:it.category,quantity:it.qty,unit_price:it.sale_price,cost_price:it.cost_price
      })));

      // 3. Update stock
      for(const it of items){
        const p=products.find(x=>x.id===it.pid);
        if(p&&p.stock!==999)await sb.from("products").update({stock:Math.max(0,p.stock-it.qty)}).eq("id",it.pid);
      }

      // 4. Cancel pending installments if inclPend
      if(inclPend&&cId&&pendInst.length){
        await sb.from("installments").update({paid:true,paid_at:new Date().toISOString()}).in("id",pendInst.map(i=>i.id));
      }

      // 5. Create installments
      const insts=Array.from({length:effParc},(_,i)=>({
        sale_id:sale.id,store_id:storeId,customer_id:cId||null,
        number:i+1,amount:instVal,
        due_date:method==="crediario"?dueDateDay(date,i+1,diaVenc):addMonths(date,i+1),
        paid:effParc===1&&(method==="pix"||method==="debit")
      }));
      await sb.from("installments").insert(insts);

      toast("✅ Venda registrada!");
      setItems([]);setCId("");setMethod("pix");setParc(1);setInclPend(false);setNotes("");setDate(TODAY());
    }catch(e){toast("Erro: "+e.message,"#f87171");}
    setSaving(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <Sel label="Cliente" value={cId} onChange={e=>{setCId(e.target.value);setInclPend(false);}}>
            <option value="">Avulso (sem cadastro)</option>
            {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </Sel>
          <Inp label="Data da venda" type="date" value={date} onChange={e=>setDate(e.target.value)} hint="Aceita datas retroativas"/>
        </div>
        {selC&&pendTotal>0&&(
          <div style={{marginTop:10,background:`${G.amber}12`,border:`1px solid ${G.amber}30`,borderRadius:9,padding:"10px 13px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div><div style={{color:G.amber,fontWeight:700,fontSize:13}}>⚠️ Saldo em aberto</div><div style={{color:G.muted,fontSize:12}}>{R(pendTotal)} pendentes ({pendInst.length} parcelas)</div></div>
            <button onClick={()=>setInclPend(!inclPend)} style={{padding:"6px 12px",borderRadius:8,border:"none",fontWeight:700,fontSize:12,cursor:"pointer",background:inclPend?G.amber:"#ffffff10",color:inclPend?"#000":"#fff"}}>{inclPend?"✓ Incluído":"Incluir no parcelamento"}</button>
          </div>
        )}
      </Card>

      <Card>
        {(()=>{
          const cats=[...new Set(products.filter(p=>p.active&&p.stock>0).map(p=>p.category).filter(Boolean))].sort();
          const filteredProds=products.filter(p=>p.active&&p.stock>0&&(!prodCat||p.category===prodCat)&&(!prodQ||p.name.toLowerCase().includes(prodQ.toLowerCase())));
          return(<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
              <Sel label="Categoria" value={prodCat} onChange={e=>setProdCat(e.target.value)}>
                <option value="">Todas as categorias</option>
                {cats.map(c=><option key={c} value={c}>{c}</option>)}
              </Sel>
              <Inp label="Buscar produto" value={prodQ} onChange={e=>setProdQ(e.target.value)} placeholder="Nome..."/>
            </div>
            <Sel label="Adicionar produto" value="" onChange={e=>{if(e.target.value){addItem(e.target.value);e.target.value=""}}}>
              <option value="">Selecione um produto...</option>
              {filteredProds.map(p=><option key={p.id} value={p.id}>{p.name} — {R(p.sale_price)}{p.stock<=3?` ⚠️(${p.stock})`:""}</option>)}
            </Sel>
          </>);
        })()}
        {items.length>0&&<div style={{marginTop:11,display:"flex",flexDirection:"column",gap:7}}>{items.map(it=>(
          <div key={it.pid} style={{display:"flex",alignItems:"center",gap:8,background:"#ffffff07",borderRadius:9,padding:"7px 10px"}}>
            <span style={{flex:1,fontSize:13,fontWeight:600}}>{it.name}</span>
            <span style={{color:G.muted,fontSize:11}}>CMV: {R(it.cost_price)}</span>
            <button onClick={()=>chgQty(it.pid,it.qty-1)} style={QB}>−</button>
            <span style={{fontWeight:700,minWidth:20,textAlign:"center",fontSize:13}}>{it.qty}</span>
            <button onClick={()=>chgQty(it.pid,it.qty+1)} style={QB}>+</button>
            <span style={{color:G.pink,fontWeight:700,minWidth:60,textAlign:"right",fontSize:13}}>{R(it.qty*it.sale_price)}</span>
            <button onClick={()=>rmItem(it.pid)} style={{background:"none",border:"none",color:G.red,cursor:"pointer",fontSize:15}}>✕</button>
          </div>
        ))}</div>}
      </Card>

      <Card>
        <div style={{fontWeight:700,marginBottom:10,fontSize:13}}>💳 Pagamento</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>
          {[["pix","PIX 💚",G.green],["debit","Débito 🟡",G.amber],["credit","Crédito 💜",G.violet],["crediario","Crediário 🩷",G.rose]].map(([m,l,col])=>(
            <button key={m} onClick={()=>{setMethod(m);if(m!=="credit"&&m!=="crediario")setParc(1);}} style={{padding:"9px 0",borderRadius:9,border:`1.5px solid ${method===m?col:G.bord}`,background:method===m?col+"22":"transparent",color:method===m?col:G.muted,fontWeight:method===m?700:400,fontSize:13,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        {canParc&&<>
          <span style={{color:G.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:7}}>Parcelas</span>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:method==="crediario"?11:0}}>
            {[1,2,3,4,5,6,8,10,12].map(n=><button key={n} onClick={()=>setParc(n)} style={{padding:"6px 11px",borderRadius:8,border:"none",fontWeight:parc===n?700:400,fontSize:13,cursor:"pointer",background:parc===n?(method==="crediario"?G.rose:G.violet):"#ffffff0e",color:parc===n?"#fff":G.muted}}>{n}x</button>)}
          </div>
          {method==="crediario"&&parc>1&&<Sel label="Dia do vencimento" value={diaVenc} onChange={e=>setDiaVenc(e.target.value)} style={{marginTop:8}}>
            {["5","10","15","20","25","30"].map(d=><option key={d} value={d}>Todo dia {d}</option>)}
          </Sel>}
        </>}
      </Card>

      <Inp label="Observações (opcional)" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notas sobre a venda..."/>

      <Card style={{background:G.bg}}>
        <div style={{display:"flex",justifyContent:"space-between",color:G.muted,fontSize:13,marginBottom:5}}><span>Subtotal</span><span style={{color:G.text}}>{R(sub)}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",color:G.muted,fontSize:13,marginBottom:5}}><span>CMV (custo)</span><span style={{color:G.amber}}>{R(cmv)}</span></div>
        {inclPend&&pendTotal>0&&<div style={{display:"flex",justifyContent:"space-between",color:G.muted,fontSize:13,marginBottom:5}}><span>Saldo anterior</span><span style={{color:G.rose}}>{R(pendTotal)}</span></div>}
        <Divider my={8}/>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:20,marginBottom:canParc&&parc>1?8:0}}><span>Total</span><span style={{color:G.pink}}>{R(total)}</span></div>
        {canParc&&parc>1&&<div style={{textAlign:"center",background:`${method==="crediario"?G.rose:G.violet}14`,border:`1px solid ${method==="crediario"?G.rose:G.violet}30`,borderRadius:9,padding:"8px 12px",marginBottom:6}}><span style={{color:method==="crediario"?G.rose:G.violet,fontWeight:800,fontSize:16}}>{parc}x de {R(instVal)}</span></div>}
        <Btn full onClick={submit} disabled={saving||!items.length} variant="pink" style={{marginTop:10,padding:"12px 0",fontSize:15}}>{saving?<Spin/>:"Registrar Venda"}</Btn>
      </Card>
    </div>
  );
}
const QB={width:26,height:26,borderRadius:6,border:`1px solid ${G.bord2}`,background:"#ffffff0e",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,lineHeight:1,flexShrink:0};

// ── Sales List ────────────────────────────────────────────────
function SalesList({sales,customers,installments,storeId,toast,storeName,storeSettings}){
  const [df,setDf]=useState("");const [dt,setDt]=useState("");
  const [cFil,setCFil]=useState("");const [mFil,setMFil]=useState("");
  const [exp,setExp]=useState(null);const [showQuotes,setShowQuotes]=useState(false);
  const [cancelId,setCancelId]=useState(null);

  const list=sales.filter(s=>{
    if(showQuotes?!s.is_quote:s.is_quote)return false;
    if(s.cancelled&&!showQuotes)return false;
    if(df&&s.date<df)return false;if(dt&&s.date>dt)return false;
    if(cFil&&s.customer_id!==cFil)return false;if(mFil&&s.method!==mFil)return false;
    return true;
  }).sort((a,b)=>b.date.localeCompare(a.date)||b.created_at?.localeCompare(a.created_at||"")||0);

  const payInst=async id=>{await sb.from("installments").update({paid:true,paid_at:new Date().toISOString()}).eq("id",id);toast("Parcela paga! ✓");};
  const unpayInst=async id=>{await sb.from("installments").update({paid:false,paid_at:null}).eq("id",id);toast("Estorno realizado!");};

  const cancelSale=async id=>{
    const s=sales.find(x=>x.id===id);if(!s)return;
    await sb.from("sales").update({cancelled:true}).eq("id",id);
    await sb.from("installments").update({paid:true}).eq("sale_id",id);
    toast("Venda cancelada!","#fbbf24");setCancelId(null);
  };

  const convertQuote=async id=>{
    await sb.from("sales").update({is_quote:false}).eq("id",id);
    toast("Orçamento convertido em venda! ✓");
  };

  const printReceipt=(s)=>{
    const cust=customers.find(c=>c.id===s.customer_id);
    const loja=storeName||"FitPro Gestão CRM";
    const w=window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Recibo</title>
    <style>
      @media print{body{margin:0}@page{margin:15mm}}
      body{font-family:Arial,sans-serif;max-width:380px;margin:0 auto;padding:20px;color:#222;font-size:13px}
      h2{text-align:center;color:#7c3aed;margin:0 0 4px}
      .sub{text-align:center;color:#888;font-size:11px;margin-bottom:16px}
      hr{border:none;border-top:1px dashed #ccc;margin:12px 0}
      .row{display:flex;justify-content:space-between;margin:4px 0}
      .total{font-size:18px;font-weight:700;color:#7c3aed}
      .footer{text-align:center;color:#aaa;font-size:11px;margin-top:16px}
      table{width:100%;border-collapse:collapse}td{padding:4px 0}
    </style></head><body>
    <h2>${loja}</h2>
    <div class="sub">Comprovante de Venda</div>
    <hr>
    <div class="row"><span><b>Cliente:</b></span><span>${cust?.name||"Avulso"}</span></div>
    <div class="row"><span><b>Data:</b></span><span>${fmtD(s.date)}</span></div>
    <div class="row"><span><b>Pagamento:</b></span><span>${METHODS[s.method]}</span></div>
    ${s.installments>1?`<div class="row"><span><b>Parcelas:</b></span><span>${s.installments}x de ${R(s.total/s.installments)}</span></div>`:""}
    <hr>
    <table>
      ${s.items.map(it=>`<tr><td>${it.quantity}x ${it.product_name}</td><td style="text-align:right">${R(it.quantity*Number(it.unit_price))}</td></tr>`).join("")}
    </table>
    <hr>
    ${s.discount>0?`<div class="row"><span>Desconto:</span><span style="color:#16a34a">-${R(s.discount)}</span></div>`:""}
    <div class="row total"><span>TOTAL</span><span>${R(s.total)}</span></div>
    ${s.notes?`<hr><div style="color:#666;font-size:11px">Obs: ${s.notes}</div>`:""}
    <div class="footer">Obrigado pela preferencia! 💜<br>${loja}</div>
    <script>window.onload=()=>window.print();</script>
    </body></html>`);
    w.document.close();
  };

  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    {/* Toggle Vendas / Orçamentos */}
    <div style={{display:"flex",gap:7}}>
      <button onClick={()=>setShowQuotes(false)} style={{flex:1,padding:"9px 0",borderRadius:9,border:"none",background:!showQuotes?G.pink:"#ffffff10",color:!showQuotes?"#fff":"#ffffffcc",fontWeight:!showQuotes?700:500,fontSize:13,cursor:"pointer"}}>🧾 Vendas</button>
      <button onClick={()=>setShowQuotes(true)} style={{flex:1,padding:"9px 0",borderRadius:9,border:"none",background:showQuotes?G.violet:"#ffffff10",color:showQuotes?"#fff":"#ffffffcc",fontWeight:showQuotes?700:500,fontSize:13,cursor:"pointer"}}>📋 Orçamentos</button>
    </div>

    {/* Filtros */}
    <Card style={{padding:"12px 14px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
        <Inp label="De" type="date" value={df} onChange={e=>setDf(e.target.value)}/>
        <Inp label="Até" type="date" value={dt} onChange={e=>setDt(e.target.value)}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        <Sel label="Cliente" value={cFil} onChange={e=>setCFil(e.target.value)}><option value="">Todos</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel>
        <Sel label="Pagamento" value={mFil} onChange={e=>setMFil(e.target.value)}><option value="">Todos</option>{Object.entries(METHODS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</Sel>
      </div>
    </Card>

    {list.length===0&&<Card><div style={{color:"#ffffff66",textAlign:"center",padding:28}}>Nenhum{showQuotes?" orçamento":" venda"} encontrado.</div></Card>}

    {list.map(s=>{
      const cust=customers.find(c=>c.id===s.customer_id);
      const sInst=installments.filter(i=>i.sale_id===s.id);
      const pend=sInst.filter(i=>!i.paid);
      const hasOverdue=pend.some(i=>i.due_date<TODAY());
      const expanded=exp===s.id;
      return(
        <Card key={s.id} style={{borderColor:s.cancelled?G.red+"44":hasOverdue?G.amber+"44":G.bord,opacity:s.cancelled?.7:1}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,cursor:"pointer"}} onClick={()=>setExp(expanded?null:s.id)}>
            <div>
              <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                {fmtD(s.date)} — {cust?.name||"Avulso"}
                {s.cancelled&&<Badge color={G.red}>Cancelada</Badge>}
                {s.is_quote&&<Badge color={G.violet}>Orçamento</Badge>}
              </div>
              <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
                <Badge color={MC[s.method]}>{METHODS[s.method]}</Badge>
                {s.installments>1&&<Badge color={G.violet}>{s.installments}x de {R(s.total/s.installments)}</Badge>}
                {hasOverdue&&<Badge color={G.red}>⚠️ Vencida</Badge>}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:G.pink,fontWeight:800,fontSize:17}}>{R(s.total)}</div>
              <div style={{color:"#ffffff88",fontSize:12}}>{pend.length>0?`${pend.length} pendente(s)`:"✓ Quitado"}</div>
              <div style={{color:"#ffffff66",fontSize:11,marginTop:2}}>{expanded?"▲ Ocultar":"▼ Detalhes"}</div>
            </div>
          </div>

          {expanded&&<div style={{marginTop:12}}>
            <Divider/>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
              {s.items.map((it,i)=><Badge key={i} color="#ffffff22">{it.quantity}x {it.product_name}</Badge>)}
            </div>
            {s.total_cost>0&&<div style={{color:"#ffffff66",fontSize:12,marginBottom:8}}>
              CMV: {R(s.total_cost)} · Margem: {R(Number(s.total)-Number(s.total_cost))} ({pct(Number(s.total)-Number(s.total_cost),Number(s.total))})
            </div>}
            {s.notes&&<div style={{color:"#ffffff88",fontSize:12,marginBottom:8}}>📝 {s.notes}</div>}
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
              {sInst.map((inst,i)=><InstRow key={i} inst={inst} custName={cust?.name} custPhone={cust?.phone} onPay={payInst} onUnpay={unpayInst} storeName={storeName||"FitPro"} showWA={!!cust?.phone}/>)}
            </div>
            {/* Ações */}
            {!s.cancelled&&<div style={{display:"flex",gap:7,flexWrap:"wrap",paddingTop:10,borderTop:`1px solid ${G.bord}`}}>
              <Btn small variant="ghost" onClick={()=>printReceipt(s)}>🖨️ Imprimir recibo</Btn>
              {s.is_quote&&<Btn small variant="success" onClick={()=>convertQuote(s.id)}>✓ Converter em venda</Btn>}
              {!s.is_quote&&<Btn small variant="danger" onClick={()=>setCancelId(s.id)}>✕ Cancelar venda</Btn>}
            </div>}
          </div>}
        </Card>
      );
    })}

    {/* Modal cancelar */}
    {cancelId&&<Modal title="Cancelar venda?" onClose={()=>setCancelId(null)}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <p style={{color:"#ffffffaa",fontSize:14,margin:0}}>Esta acao nao pode ser desfeita. O estoque nao sera devolvido automaticamente.</p>
        <div style={{display:"flex",gap:9}}>
          <Btn full variant="danger" onClick={()=>cancelSale(cancelId)}>Confirmar cancelamento</Btn>
          <Btn full variant="ghost" onClick={()=>setCancelId(null)}>Voltar</Btn>
        </div>
      </div>
    </Modal>}
  </div>);
}

// ── Due Dates ─────────────────────────────────────────────────
function DueDates({installments,customers,storeName,toast}){
  const [filter,setFilter]=useState("all");const [cFil,setCFil]=useState("");
  const allPend=installments.filter(i=>!i.paid).sort((a,b)=>a.due_date.localeCompare(b.due_date));
  const weekEnd=new Date();weekEnd.setDate(weekEnd.getDate()+7);const we=weekEnd.toISOString().slice(0,10);
  const filtered=allPend.filter(i=>{
    if(cFil&&i.customer_id!==cFil)return false;
    if(filter==="overdue")return i.due_date<TODAY();
    if(filter==="today")return i.due_date===TODAY();
    if(filter==="week")return i.due_date>=TODAY()&&i.due_date<=we;
    if(filter==="crediario")return i.method==="crediario";
    return true;
  });
  const totalPend=filtered.reduce((a,i)=>a+Number(i.amount),0);
  const byCust={};filtered.forEach(i=>{const k=i.customer_id||"avulso";if(!byCust[k])byCust[k]={id:k,items:[]};byCust[k].items.push(i);});
  const payInst=async id=>{await sb.from("installments").update({paid:true,paid_at:new Date().toISOString()}).eq("id",id);toast("Parcela paga! ✓");};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:13}}>
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
        <Sel value={cFil} onChange={e=>setCFil(e.target.value)}>
          <option value="">Todas as clientes</option>
          {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </Sel>
      </Card>
      {filtered.length>0&&<div style={{background:`${G.pink}10`,border:`1px solid ${G.pink}22`,borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between"}}><span style={{color:G.muted,fontSize:13}}>Total filtrado</span><span style={{color:G.pink,fontWeight:800,fontSize:16}}>{R(totalPend)}</span></div>}
      {Object.values(byCust).map(({id,items})=>{
        const cust=customers.find(c=>c.id===id);
        const total=items.reduce((a,i)=>a+Number(i.amount),0);
        const hasOverdue=items.some(i=>i.due_date<TODAY());
        return(
          <Card key={id} style={{borderColor:hasOverdue?G.red+"44":G.bord}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:38,height:38,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${G.pink},${G.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:"#fff"}}>{cust?INI(cust.name):"?"}</div>
                <div><div style={{fontWeight:700,fontSize:14}}>{cust?.name||"Avulso"}</div>{cust?.phone&&<div style={{color:G.muted,fontSize:12}}>📞 {cust.phone}</div>}</div>
              </div>
              <div style={{textAlign:"right"}}><div style={{color:G.pink,fontWeight:800,fontSize:15}}>{R(total)}</div><div style={{color:G.muted,fontSize:12}}>{items.length} parcela(s)</div></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {items.map((inst,i)=><InstRow key={i} inst={inst} custName={cust?.name} custPhone={cust?.phone} onPay={payInst} storeName={storeName}/>)}
            </div>
            {cust?.phone&&items.filter(i=>i.due_date<TODAY()).length>0&&(
              <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${G.bord}`}}>
                <button onClick={()=>{items.filter(i=>i.due_date<TODAY()).forEach(i=>window.open(waLink(cust.phone,cust.name,i.number,i.amount,i.due_date,storeName,true),"_blank"));toast("WhatsApp aberto!");}} style={{display:"flex",alignItems:"center",gap:6,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",borderRadius:8,padding:"6px 13px",fontSize:12,cursor:"pointer",fontWeight:700}}>📱 Cobrar todas vencidas via WhatsApp</button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── Customer Profile ──────────────────────────────────────────
function CustomerProfile({cust,sales,installments,storeName,toast,vipThreshold}){
  const cSales=sales.filter(s=>s.customer_id===cust.id&&!s.cancelled);
  const cInst=installments.filter(i=>i.customer_id===cust.id);
  const paid=cInst.filter(i=>i.paid);const pend=cInst.filter(i=>!i.paid);
  const overdue=pend.filter(i=>i.due_date<TODAY());const upcoming=pend.filter(i=>i.due_date>=TODAY());
  const totalSpent=cSales.reduce((a,s)=>a+Number(s.total),0);
  const totalPaid=paid.reduce((a,i)=>a+Number(i.amount),0);
  const totalPend=pend.reduce((a,i)=>a+Number(i.amount),0);
  const ltv=totalSpent+totalPend;
  const lastSale=[...cSales].sort((a,b)=>b.date.localeCompare(a.date))[0];
  const lastDays=lastSale?daysDiff(lastSale.date,TODAY()):null;
  const [tab,setTab]=useState("compras");
  const payInst=async id=>{await sb.from("installments").update({paid:true,paid_at:new Date().toISOString()}).eq("id",id);toast("Pago! ✓");};
  const unpayInst=async id=>{await sb.from("installments").update({paid:false,paid_at:null}).eq("id",id);toast("Estornado!");};

  // Score automático
  const scoreLabel=overdue.length>0?"Inadimplente":lastDays!==null&&lastDays>90?"Inativo":totalSpent>=(vipThreshold||500)&&lastDays!==null&&lastDays<=60?"VIP":"Regular";
  const scoreColor={VIP:G.amber,Regular:G.green,Inativo:G.muted,Inadimplente:G.red}[scoreLabel];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Card style={{background:`linear-gradient(135deg,${G.pink}18,${G.violet}18)`,borderColor:G.pink+"33"}}>
        <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{width:56,height:56,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${G.pink},${G.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:"#fff"}}>{INI(cust.name)}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:18,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              {cust.name}
              <Badge color={scoreColor}>{scoreLabel}</Badge>
            </div>
            {cust.phone&&<div style={{color:"#ffffff99",fontSize:13}}>📞 {cust.phone}</div>}
            {cust.email&&<div style={{color:"#ffffff99",fontSize:13}}>✉️ {cust.email}</div>}
            {cust.origem&&<div style={{color:"#ffffff99",fontSize:13}}>📌 Origem: {cust.origem}</div>}
            {lastDays!==null&&<div style={{fontSize:12,marginTop:4,color:lastDays>90?G.red:lastDays>30?G.amber:G.green}}>🕐 Última compra: {lastDays===0?"hoje":`há ${lastDays} dias`}</div>}
            {cust.notes&&<div style={{color:G.violet,fontSize:12,marginTop:4}}>📝 {cust.notes}</div>}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:9,marginTop:14}}>
          {[["Total gasto",R(totalSpent),G.pink],["LTV",R(ltv),G.violet],["Pago",R(totalPaid),G.green],["A vencer",R(upcoming.reduce((a,i)=>a+Number(i.amount),0)),G.sky],["Vencidos",R(overdue.reduce((a,i)=>a+Number(i.amount),0)),G.red]].map(([l,v,col])=>(
            <div key={l} style={{background:"#ffffff08",borderRadius:10,padding:"10px 12px"}}>
              <div style={{color:"#ffffffaa",fontSize:10,textTransform:"uppercase",letterSpacing:.7,fontWeight:600}}>{l}</div>
              <div style={{color:col,fontWeight:800,fontSize:15,marginTop:3}}>{v}</div>
            </div>
          ))}
        </div>
        {overdue.length>0&&<div style={{marginTop:12,background:`${G.red}18`,border:`1px solid ${G.red}44`,borderRadius:9,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <span style={{color:G.red,fontWeight:700,fontSize:13}}>⚠️ {overdue.length} parcela(s) vencida(s)</span>
          {cust.phone&&<button onClick={()=>{overdue.forEach(i=>window.open(waLink(cust.phone,cust.name,i.number,i.amount,i.due_date,storeName,true),"_blank"));toast("WhatsApp aberto!");}} style={{background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontWeight:700}}>📱 Cobrar via WhatsApp</button>}
        </div>}
      </Card>

      <div style={{display:"flex",gap:4,overflowX:"auto"}}>
        {[["compras","🛍️ Compras"],["pagos","✅ Pagos"],["vencidos","🔴 Vencidos"],["avencer","⏳ A vencer"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flexShrink:0,flex:1,padding:"8px 4px",borderRadius:9,border:"none",background:tab===k?G.pink+"22":"transparent",color:tab===k?G.pink:"#ffffffcc",fontWeight:tab===k?700:500,fontSize:12,cursor:"pointer",borderBottom:tab===k?`2px solid ${G.pink}`:"2px solid transparent"}}>{l}</button>
        ))}
      </div>

      {tab==="compras"&&<div style={{display:"flex",flexDirection:"column",gap:9}}>
        {cSales.length===0&&<Card><div style={{color:"#ffffff66",textAlign:"center",padding:24}}>Nenhuma compra registrada.</div></Card>}
        {[...cSales].sort((a,b)=>b.date.localeCompare(a.date)).map(s=>{
          const si=installments.filter(i=>i.sale_id===s.id);const pendS=si.filter(i=>!i.paid);
          return(<Card key={s.id}><div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <div><div style={{fontWeight:700,fontSize:14}}>{fmtD(s.date)}</div><div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}><Badge color={MC[s.method]}>{METHODS[s.method]}</Badge>{s.installments>1&&<Badge color={G.violet}>{s.installments}x</Badge>}{pendS.length===0&&<Badge color={G.green}>Quitado</Badge>}</div></div>
            <div style={{textAlign:"right"}}><div style={{color:G.pink,fontWeight:800,fontSize:16}}>{R(s.total)}</div>{pendS.length>0&&<div style={{color:G.amber,fontSize:12}}>{pendS.length} pendente(s)</div>}</div>
          </div><div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>{s.items.map((it,i)=><Badge key={i} color="#ffffff20">{it.quantity}x {it.product_name}</Badge>)}</div></Card>);
        })}
      </div>}

      {tab==="pagos"&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
        {paid.length===0&&<Card><div style={{color:"#ffffff66",textAlign:"center",padding:24}}>Nenhum pagamento registrado.</div></Card>}
        {[...paid].sort((a,b)=>b.paid_at?.localeCompare(a.paid_at||"")).map((i,idx)=><InstRow key={idx} inst={i} onUnpay={unpayInst} showWA={false}/>)}
      </div>}

      {tab==="vencidos"&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
        {overdue.length===0&&<Card style={{borderColor:G.green+"44"}}><div style={{color:G.green,textAlign:"center",padding:24}}>✅ Nenhuma parcela vencida!</div></Card>}
        {[...overdue].sort((a,b)=>a.due_date.localeCompare(b.due_date)).map((i,idx)=><InstRow key={idx} inst={i} custName={cust.name} custPhone={cust.phone} onPay={payInst} storeName={storeName}/>)}
        {overdue.length>0&&cust.phone&&<button onClick={()=>{overdue.forEach(i=>window.open(waLink(cust.phone,cust.name,i.number,i.amount,i.due_date,storeName,true),"_blank"));toast("WhatsApp aberto!");}} style={{display:"flex",alignItems:"center",gap:8,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",borderRadius:9,padding:"10px 16px",fontSize:13,cursor:"pointer",fontWeight:700,marginTop:4}}>📱 Cobrar todas vencidas via WhatsApp ({overdue.length})</button>}
      </div>}

      {tab==="avencer"&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
        {upcoming.length===0&&<Card><div style={{color:"#ffffff66",textAlign:"center",padding:24}}>Nenhuma parcela a vencer.</div></Card>}
        {[...upcoming].sort((a,b)=>a.due_date.localeCompare(b.due_date)).map((i,idx)=><InstRow key={idx} inst={i} custName={cust.name} custPhone={cust.phone} onPay={payInst} storeName={storeName}/>)}
      </div>}
    </div>
  );
}

// ── Customers ─────────────────────────────────────────────────
function Customers({customers,sales,installments,storeId,storeName,toast,storeSettings}){
  const [open,setOpen]=useState(false);const [selected,setSelected]=useState(null);const [edit,setEdit]=useState(null);
  const [f,setF]=useState({name:"",phone:"",email:"",notes:"",origem:""});
  const [q,setQ]=useState("");const [catFil,setCatFil]=useState("");const [saving,setSaving]=useState(false);
  const vipThreshold=storeSettings?.vip_threshold||500;

  // Score automático
  const scoreCustomer=(c)=>{
    const cSales=sales.filter(s=>s.customer_id===c.id&&!s.cancelled);
    const totalSpent=cSales.reduce((a,s)=>a+Number(s.total),0);
    const pendInst=installments.filter(i=>i.customer_id===c.id&&!i.paid);
    const overdue=pendInst.filter(i=>i.due_date<TODAY());
    const lastSale=[...cSales].sort((a,b)=>b.date.localeCompare(a.date))[0];
    const lastDays=lastSale?daysDiff(lastSale.date,TODAY()):999;
    if(overdue.length>0)return{label:"Inadimplente",color:G.red};
    if(lastDays>90)return{label:"Inativo",color:G.muted};
    if(totalSpent>=vipThreshold&&lastDays<=60)return{label:"VIP",color:G.amber};
    return{label:"Regular",color:G.green};
  };

  const openNew=()=>{setF({name:"",phone:"",email:"",notes:"",origem:""});setEdit(null);setOpen(true);};
  const openEdit=c=>{setF({name:c.name,phone:c.phone||"",email:c.email||"",notes:c.notes||"",origem:c.origem||""});setEdit(c);setOpen(true);};
  const save=async()=>{
    if(!f.name){toast("Nome é obrigatório","#f87171");return;}
    setSaving(true);
    const d={name:f.name,phone:f.phone,email:f.email,notes:f.notes,origem:f.origem||null,store_id:storeId};
    const{error}=edit?await sb.from("customers").update(d).eq("id",edit.id):await sb.from("customers").insert(d);
    if(error)toast("Erro: "+error.message,"#f87171");else{toast(edit?"Cliente atualizada!":"Cliente cadastrada!");setOpen(false);}
    setSaving(false);
  };
  const del=async id=>{await sb.from("customers").delete().eq("id",id);toast("Removida","#f87171");};

  const scored=customers.map(c=>({...c,_score:scoreCustomer(c)}));
  const list=scored.filter(c=>{
    if(catFil&&c._score.label!==catFil)return false;
    return c.name.toLowerCase().includes(q.toLowerCase())||c.phone?.includes(q);
  });

  if(selected){
    return(<div>
      <button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",color:"#ffffffaa",cursor:"pointer",fontSize:13,marginBottom:14}}>← Voltar</button>
      <CustomerProfile cust={selected} sales={sales} installments={installments} storeName={storeName} toast={toast} vipThreshold={vipThreshold}/>
    </div>);
  }

  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",gap:9}}>
      <Inp placeholder="🔍 Buscar cliente..." value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}}/>
      <Btn onClick={openNew} variant="pink">+ Cliente</Btn>
    </div>
    {/* Filtro por score */}
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      {[["","Todas"],["VIP","⭐ VIP"],["Regular","✅ Regular"],["Inativo","😴 Inativo"],["Inadimplente","⚠️ Inadimplente"]].map(([k,l])=>(
        <button key={k} onClick={()=>setCatFil(k)} style={{padding:"4px 11px",borderRadius:20,border:"none",background:catFil===k?G.pink:"#ffffff10",color:catFil===k?"#fff":"#ffffffcc",fontSize:12,cursor:"pointer",fontWeight:catFil===k?700:400}}>{l}</button>
      ))}
    </div>
    {list.map(c=>{
      const cSales=sales.filter(s=>s.customer_id===c.id&&!s.cancelled);
      const spent=cSales.reduce((a,s)=>a+Number(s.total),0);
      const pendInst=installments.filter(i=>i.customer_id===c.id&&!i.paid);
      const pendVal=pendInst.reduce((a,i)=>a+Number(i.amount),0);
      const hasOverdue=pendInst.some(i=>i.due_date<TODAY());
      const lastSale=[...cSales].sort((a,b)=>b.date.localeCompare(a.date))[0];
      const lastDays=lastSale?daysDiff(lastSale.date,TODAY()):null;
      return(
        <Card key={c.id} onClick={()=>setSelected(c)} style={{cursor:"pointer",borderColor:hasOverdue?G.red+"44":G.bord}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:11,alignItems:"center"}}>
              <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${G.pink},${G.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#fff"}}>{INI(c.name)}</div>
              <div>
                <div style={{fontWeight:700,fontSize:15,display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                  {c.name}
                  <Badge color={c._score.color}>{c._score.label}</Badge>
                  {hasOverdue&&<Badge color={G.red}>⚠️ Inadimplente</Badge>}
                </div>
                {c.phone&&<div style={{color:"#ffffff88",fontSize:12}}>📞 {c.phone}</div>}
                <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
                  {lastDays!==null&&<span style={{fontSize:11,color:lastDays>90?G.red:lastDays>30?G.amber:G.green}}>🕐 {lastDays===0?"Comprou hoje":`há ${lastDays} dias`}</span>}
                  {c.origem&&<span style={{fontSize:11,color:"#ffffff66"}}>📌 {c.origem}</span>}
                </div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:G.pink,fontWeight:800,fontSize:16}}>{R(spent)}</div>
              <div style={{color:"#ffffff88",fontSize:12}}>{cSales.length} compras</div>
              {pendVal>0&&<div style={{marginTop:3}}><Badge color={hasOverdue?G.red:G.amber}>A receber: {R(pendVal)}</Badge></div>}
            </div>
          </div>
          <div style={{marginTop:10,display:"flex",gap:7}} onClick={e=>e.stopPropagation()}>
            <Btn small variant="ghost" onClick={()=>openEdit(c)}>✏️ Editar</Btn>
            <Btn small variant="danger" onClick={()=>del(c.id)}>✕</Btn>
            <Btn small variant="pink" onClick={()=>setSelected(c)}>Ver perfil →</Btn>
          </div>
        </Card>
      );
    })}
    {open&&<Modal title={edit?"Editar Cliente":"Nova Cliente"} onClose={()=>setOpen(false)}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <Inp label="Nome *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Nome completo"/>
        <Inp label="Telefone (com DDI: 5511999990000)" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="5511999990000"/>
        <Inp label="E-mail" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="email@exemplo.com"/>
        <Sel label="Origem" value={f.origem} onChange={e=>setF({...f,origem:e.target.value})}>
          <option value="">Selecionar origem...</option>
          {["Indicação","Instagram","Google","Loja física","WhatsApp","Outro"].map(o=><option key={o} value={o}>{o}</option>)}
        </Sel>
        <TA label="Observações" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Tamanho preferido, gostos, notas..."/>
        <div style={{background:`${G.violet}12`,borderRadius:9,padding:"9px 12px",fontSize:12,color:"#ffffffaa"}}>💡 A categoria (VIP, Inativo, etc.) é calculada automaticamente pelo histórico de compras.</div>
        <div style={{display:"flex",gap:9,marginTop:4}}><Btn full onClick={save} variant="pink" disabled={saving}>{saving?<Spin/>:"Salvar"}</Btn><Btn full variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Btn></div>
      </div>
    </Modal>}
  </div>);
}

// ── Settings ──────────────────────────────────────────────────
function Settings({storeName,storeId,toast,onSignOut,storeSettings,onSettingsUpdate,products,sales,customers}){
  const [name,setName]=useState(storeName||"");
  const [vipThreshold,setVipThreshold]=useState(storeSettings?.vip_threshold||500);
  const [monthlyGoal,setMonthlyGoal]=useState(storeSettings?.monthly_goal||"");
  const [stockAlert,setStockAlert]=useState(storeSettings?.stock_alert_default||3);
  const [modoCaixa,setModoCaixa]=useState(storeSettings?.modo_caixa||false);
  const [catMetas,setCatMetas]=useState(storeSettings?.cat_metas||{});
  const [saving,setSaving]=useState(false);
  const [exporting,setExporting]=useState(false);

  // Categorias disponíveis dos produtos
  const cats=[...new Set(products.map(p=>p.category).filter(Boolean))].sort();

  const save=async()=>{
    setSaving(true);
    const payload={
      name,
      vip_threshold:+vipThreshold||500,
      monthly_goal:+monthlyGoal||0,
      stock_alert_default:+stockAlert||3,
      modo_caixa:modoCaixa,
      cat_metas:catMetas,
    };
    await sb.from("stores").update(payload).eq("id",storeId);
    onSettingsUpdate&&onSettingsUpdate({...storeSettings,...payload});
    toast("Configurações salvas! ✓");
    setSaving(false);
  };

  const exportBackup=async()=>{
    setExporting(true);
    try{
      const [s,c,p]=await Promise.all([
        sb.from("sales").select("*,sale_items(*)").eq("store_id",storeId),
        sb.from("customers").select("*").eq("store_id",storeId),
        sb.from("products").select("*").eq("store_id",storeId),
      ]);
      const backup={
        exported_at:new Date().toISOString(),
        store:{id:storeId,name},
        sales:s.data||[],
        customers:c.data||[],
        products:p.data||[],
      };
      const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download=`backup_${name.replace(/\s+/g,"_")}_${TODAY()}.json`;a.click();URL.revokeObjectURL(url);
      toast("Backup exportado! ✓");
    }catch(e){toast("Erro ao exportar: "+e.message,"#f87171");}
    setExporting(false);
  };

  return(<div style={{display:"flex",flexDirection:"column",gap:13}}>
    {/* Dados da loja */}
    <Card>
      <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>🏪 Dados da loja</div>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <Inp label="Nome da loja" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Ella Fitness"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Meta mensal (R$)" type="number" value={monthlyGoal} onChange={e=>setMonthlyGoal(e.target.value)} placeholder="5000" hint="Barra de progresso no Dashboard"/>
          <Inp label="⭐ Threshold VIP (R$)" type="number" value={vipThreshold} onChange={e=>setVipThreshold(e.target.value)} placeholder="500" hint="Gasto mínimo para ser VIP"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="📦 Estoque mínimo padrão" type="number" value={stockAlert} onChange={e=>setStockAlert(e.target.value)} placeholder="3" hint="Alerta de reposição no Estoque"/>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <span style={{color:"#ffffffaa",fontSize:11,textTransform:"uppercase",letterSpacing:.8}}>👁️ Modo Caixa</span>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:G.bg,border:`1px solid ${G.bord2}`,borderRadius:9}}>
              <button onClick={()=>setModoCaixa(!modoCaixa)} style={{width:44,height:24,borderRadius:12,border:"none",background:modoCaixa?G.pink:"#ffffff20",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                <div style={{position:"absolute",top:2,left:modoCaixa?22:2,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
              </button>
              <span style={{fontSize:12,color:"#ffffffcc"}}>{modoCaixa?"Ativo — oculta Custos e Relatórios":"Desativado"}</span>
            </div>
            <span style={{color:"#ffffff66",fontSize:11}}>Para operadores de caixa</span>
          </div>
        </div>
        <div style={{background:`${G.violet}12`,borderRadius:9,padding:"9px 12px",fontSize:12,color:"#ffffffaa"}}>
          💡 VIP: gasto ≥ R${vipThreshold} + última compra ≤ 60 dias · Inativo: sem compras &gt; 90 dias · Inadimplente: parcela(s) vencida(s)
        </div>
      </div>
    </Card>

    {/* Metas por categoria */}
    {cats.length>0&&<Card>
      <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>🎯 Metas por categoria</div>
      <div style={{color:"#ffffff88",fontSize:12,marginBottom:12}}>Define uma meta mensal de vendas (R$) por categoria de produto.</div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {cats.map(cat=>{
          const mSales=sales.filter(s=>s.date.startsWith(TODAY().slice(0,7))&&!s.cancelled&&!s.is_quote);
          const catRev=mSales.reduce((a,s)=>a+s.items.filter(i=>i.category===cat).reduce((b,i)=>b+i.quantity*Number(i.unit_price||0),0),0);
          const meta=catMetas[cat]||0;
          const pct=meta>0?Math.min(100,(catRev/meta)*100):0;
          return(<div key={cat} style={{background:"#ffffff06",borderRadius:9,padding:"10px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <span style={{fontSize:13,fontWeight:600,color:G.text}}>{cat}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:G.green}}>{R(catRev)}</span>
                <span style={{fontSize:12,color:"#ffffff66"}}>/</span>
                <input type="number" min="0" value={meta||""} placeholder="Meta R$" onChange={e=>setCatMetas({...catMetas,[cat]:+e.target.value||0})} style={{width:90,...iS,padding:"4px 8px",fontSize:12}}/>
              </div>
            </div>
            {meta>0&&<><div style={{height:4,background:"#ffffff10",borderRadius:4,marginTop:8,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:4,width:`${pct}%`,background:pct>=100?`linear-gradient(90deg,${G.green},#059669)`:`linear-gradient(90deg,${G.pink},${G.violet})`,transition:"width .4s"}}/>
            </div><div style={{fontSize:10,color:"#ffffff66",marginTop:3}}>{pct.toFixed(1)}% da meta do mês</div></>}
          </div>);
        })}
      </div>
    </Card>}

    {/* Salvar */}
    <Btn onClick={save} variant="pink" disabled={saving}>{saving?<Spin/>:"💾 Salvar configurações"}</Btn>

    {/* Backup */}
    <Card>
      <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>💾 Backup de dados</div>
      <div style={{color:"#ffffff88",fontSize:13,marginBottom:12}}>Exporta um arquivo JSON com todas as vendas, clientes e produtos da sua loja. Útil para backup ou análise externa.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:9,marginBottom:12}}>
        {[["Vendas",sales.length,G.pink],["Clientes",customers.length,G.violet],["Produtos",products.length,G.green]].map(([l,n,col])=>(
          <div key={l} style={{background:"#ffffff06",borderRadius:9,padding:"10px 12px",textAlign:"center"}}>
            <div style={{color:col,fontWeight:800,fontSize:22}}>{n}</div>
            <div style={{color:"#ffffffaa",fontSize:11,textTransform:"uppercase"}}>{l}</div>
          </div>
        ))}
      </div>
      <Btn onClick={exportBackup} variant="success" disabled={exporting} full>{exporting?<Spin/>:"📥 Exportar backup JSON"}</Btn>
    </Card>

    {/* WhatsApp info */}
    <Card>
      <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>📱 WhatsApp — como funciona</div>
      {["O botão 📱 abre o WhatsApp com mensagem personalizada.","Para vencidas: mensagem de cobrança amigável.","Para a vencer: lembrete preventivo.","Telefone deve ter DDI: ex. 5511999990000"].map((t,i)=>(
        <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",marginBottom:7}}><span style={{color:G.pink,fontWeight:700,flexShrink:0}}>✓</span><span style={{color:"#ffffffaa",fontSize:13}}>{t}</span></div>
      ))}
    </Card>

    <Btn variant="danger" onClick={onSignOut} style={{alignSelf:"flex-start"}}>Sair da conta</Btn>
  </div>);
}

// ── Main App ──────────────────────────────────────────────────
// ── Estoque ───────────────────────────────────────────────────
function Estoque({products,sales}){
  const [sortBy,setSortBy]=useState("recPot");
  const [catFil,setCatFil]=useState("");
  const [q,setQ]=useState("");
  const [stockMin,setStockMin]=useState(3);

  const activeProds=products.filter(p=>p.active!==false&&p.stock>=0);
  const cats=[...new Set(activeProds.map(p=>p.category))].sort();

  // Giro 30 dias
  const d30=new Date();d30.setDate(d30.getDate()-30);const d30str=d30.toISOString().slice(0,10);
  const recentSales=sales.filter(s=>s.date>=d30str&&!s.cancelled&&!s.is_quote);
  const soldQty={};recentSales.forEach(s=>s.items?.forEach(it=>{soldQty[it.product_id]=(soldQty[it.product_id]||0)+it.quantity;}));

  // Histórico saídas (últimas 10 movimentações)
  const movLog=[];
  recentSales.forEach(s=>s.items?.forEach(it=>{movLog.push({date:s.date,name:it.product_name,qty:-it.quantity,type:"Saída",ref:`Venda`});}));
  movLog.sort((a,b)=>b.date.localeCompare(a.date));
  const movLogTop=movLog.slice(0,10);

  const calcs=activeProds.map(p=>{
    const min=p.min_stock||p.estoque_minimo||stockMin;
    const custoTotal=p.stock*Number(p.cost_price||0);
    const recPot=p.stock*Number(p.sale_price||0);
    const margemBruta=recPot-custoTotal;
    const margemPct=recPot>0?(margemBruta/recPot)*100:0;
    const giro=p.stock>0?((soldQty[p.id]||0)/p.stock).toFixed(2):0;
    const needsReorder=p.stock<=min;
    return{...p,custoTotal,recPot,margemBruta,margemPct,giro:Number(giro),needsReorder,min};
  });

  const comEstoque=calcs.filter(p=>p.stock>0);
  const totalCusto=comEstoque.reduce((a,p)=>a+p.custoTotal,0);
  const totalRecPot=comEstoque.reduce((a,p)=>a+p.recPot,0);
  const totalMargem=totalRecPot-totalCusto;
  const totalMgPct=totalRecPot>0?(totalMargem/totalRecPot)*100:0;
  const reorder=calcs.filter(p=>p.needsReorder);
  const lowMg=comEstoque.filter(p=>p.margemPct<15);
  const top3=[...comEstoque].sort((a,b)=>b.recPot-a.recPot).slice(0,3);

  const filtered=calcs.filter(p=>{
    if(p.stock<=0)return false;
    if(catFil&&p.category!==catFil)return false;
    if(q&&!p.name.toLowerCase().includes(q.toLowerCase()))return false;
    return true;
  }).sort((a,b)=>{
    if(sortBy==="recPot")return b.recPot-a.recPot;
    if(sortBy==="margem")return b.margemPct-a.margemPct;
    if(sortBy==="custo")return b.custoTotal-a.custoTotal;
    if(sortBy==="giro")return b.giro-a.giro;
    return a.name.localeCompare(b.name);
  });

  const exportCSV=()=>{
    const rows=[["Produto","Categoria","Estoque","Custo Unit.","Preço Venda","Custo Total","Rec. Potencial","Margem %","Giro 30d"]];
    calcs.filter(p=>p.stock>0).forEach(p=>rows.push([`"${p.name}"`,`"${p.category||""}"`,p.stock,Number(p.cost_price||0).toFixed(2),Number(p.sale_price||0).toFixed(2),p.custoTotal.toFixed(2),p.recPot.toFixed(2),p.margemPct.toFixed(1),p.giro]));
    const csv=rows.map(r=>r.join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`estoque_${TODAY()}.csv`;a.click();URL.revokeObjectURL(url);
  };

  const LBL=({t})=><div style={{color:"#ffffffaa",fontSize:10,textTransform:"uppercase",letterSpacing:.7,fontWeight:600,marginBottom:4}}>{t}</div>;

  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10}}>
      {[["💰","Custo total",R(totalCusto),G.amber],["📈","Rec. potencial",R(totalRecPot),G.violet],["📊","Margem bruta",R(totalMargem),G.green],["🎯","Margem %",totalMgPct.toFixed(1)+"%",totalMgPct>=30?G.green:totalMgPct>=15?G.amber:G.red]].map(([ic,l,v,col])=>(
        <Card key={l} style={{borderLeft:`3px solid ${col}`,padding:"13px 14px"}}>
          <div style={{fontSize:14,marginBottom:4}}>{ic}</div>
          <LBL t={l}/>
          <div style={{color:col,fontSize:17,fontWeight:900}}>{v}</div>
        </Card>
      ))}
    </div>


    {/* Top 3 */}
    <Card>
      <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>🏆 Maior receita potencial</div>
      {top3.map((p,i)=>(
        <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<2?10:0}}>
          <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,background:PAL[i],display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:"#fff"}}>{i+1}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.name}</div><div style={{fontSize:11,color:"#ffffff88"}}>{p.stock} un. × {R(p.sale_price)} · Giro: {p.giro}x/30d</div></div>
          <div style={{textAlign:"right"}}><div style={{color:G.violet,fontWeight:700,fontSize:14}}>{R(p.recPot)}</div><div style={{fontSize:11,color:"#ffffff88"}}>Mg: {p.margemPct.toFixed(1)}%</div></div>
        </div>
      ))}
    </Card>

    {/* Filtros e exportar */}
    <Card style={{padding:"12px 14px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
        <Inp placeholder="🔍 Buscar produto..." value={q} onChange={e=>setQ(e.target.value)}/>
        <Sel value={catFil} onChange={e=>setCatFil(e.target.value)}>
          <option value="">Todas as categorias</option>
          {cats.map(c=><option key={c} value={c}>{c}</option>)}
        </Sel>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{color:"#ffffffaa",fontSize:11,fontWeight:600}}>Ordenar:</span>
          {[["recPot","Rec.Pot"],["margem","Margem"],["custo","Custo"],["giro","Giro"],["nome","Nome"]].map(([k,l])=>(
            <button key={k} onClick={()=>setSortBy(k)} style={{padding:"4px 10px",borderRadius:20,border:"none",background:sortBy===k?G.violet:"#ffffff15",color:sortBy===k?"#fff":"#ffffffcc",fontSize:12,cursor:"pointer",fontWeight:sortBy===k?700:400}}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:7,alignItems:"center"}}>
          <span style={{color:"#ffffffaa",fontSize:11}}>Est. mín. padrão:</span>
          <input type="number" value={stockMin} onChange={e=>setStockMin(+e.target.value||1)} min="1" style={{width:50,...iS,padding:"4px 8px",fontSize:12}}/>
          <Btn small variant="success" onClick={exportCSV}>📥 CSV</Btn>
        </div>
      </div>
    </Card>

    {/* Tabela inventário */}
    <Card style={{padding:"12px 14px",overflowX:"auto"}}>
      <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>📋 Inventário ({filtered.length} produtos)</div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr",gap:8,padding:"6px 8px",background:"#ffffff10",borderRadius:8}}>
          {["Produto","Qtd","Custo Unit.","Custo Total","Rec. Pot.","Margem","Giro 30d"].map(h=><div key={h} style={{color:"#ffffffaa",fontSize:10,textTransform:"uppercase",letterSpacing:.6,fontWeight:700}}>{h}</div>)}
        </div>
        {filtered.length===0&&<div style={{color:"#ffffff66",textAlign:"center",padding:20}}>Nenhum produto encontrado.</div>}
        {filtered.map(p=>(
          <div key={p.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr",gap:8,padding:"8px",background:p.needsReorder?"#f8717108":"#ffffff06",borderRadius:8,borderLeft:`3px solid ${p.needsReorder?G.red:p.margemPct<15?G.amber:p.margemPct>=40?G.green:G.bord}`}}>
            <div><div style={{fontSize:13,fontWeight:600}}>{p.name}</div><div style={{fontSize:10,color:"#ffffff66"}}>{p.category}</div></div>
            <div style={{fontSize:13,color:p.needsReorder?G.red:"#ffffffdd",alignSelf:"center",fontWeight:p.needsReorder?700:400}}>{p.stock}{p.needsReorder&&<span style={{fontSize:9,color:G.red}}> ⚠️</span>}</div>
            <div style={{fontSize:13,color:"#ffffff88",alignSelf:"center"}}>{R(p.cost_price)}</div>
            <div style={{fontSize:13,color:G.amber,fontWeight:600,alignSelf:"center"}}>{R(p.custoTotal)}</div>
            <div style={{fontSize:13,color:G.violet,fontWeight:600,alignSelf:"center"}}>{R(p.recPot)}</div>
            <div style={{alignSelf:"center"}}>
              <div style={{fontSize:13,color:p.margemPct<15?G.red:p.margemPct>=40?G.green:G.amber,fontWeight:700}}>{p.margemPct.toFixed(1)}%</div>
              <div style={{fontSize:10,color:"#ffffff66"}}>{R(p.margemBruta)}</div>
            </div>
            <div style={{fontSize:13,color:p.giro>1?G.green:p.giro>0.3?G.amber:G.red,fontWeight:600,alignSelf:"center"}}>{p.giro}x</div>
          </div>
        ))}
        {filtered.length>0&&<div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr",gap:8,padding:"9px 8px",background:`${G.pink}10`,borderRadius:8}}>
          <div style={{fontSize:13,fontWeight:700,color:G.pink}}>TOTAL</div>
          <div style={{fontSize:13,color:"#ffffff88"}}>{filtered.reduce((a,p)=>a+p.stock,0)} un.</div>
          <div/>
          <div style={{fontSize:13,color:G.amber,fontWeight:700}}>{R(filtered.reduce((a,p)=>a+p.custoTotal,0))}</div>
          <div style={{fontSize:13,color:G.violet,fontWeight:700}}>{R(filtered.reduce((a,p)=>a+p.recPot,0))}</div>
          <div style={{fontSize:13,color:G.green,fontWeight:700}}>{(()=>{const tr=filtered.reduce((a,p)=>a+p.recPot,0);const tm=filtered.reduce((a,p)=>a+p.margemBruta,0);return tr>0?(tm/tr*100).toFixed(1):0;})()}%</div>
          <div/>
        </div>}
      </div>
    </Card>

    {/* Histórico movimentações */}
    {movLogTop.length>0&&<Card>
      <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>📋 Últimas movimentações (saídas)</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {movLogTop.map((m,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:"#ffffff06",borderRadius:8}}>
            <div style={{width:32,height:32,borderRadius:8,flexShrink:0,background:`${G.red}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:G.red}}>↓</div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{m.name}</div><div style={{fontSize:11,color:"#ffffff88"}}>{m.ref} · {fmtD(m.date)}</div></div>
            <span style={{color:G.red,fontWeight:700,fontSize:14}}>{m.qty} un.</span>
          </div>
        ))}
      </div>
    </Card>}

    {/* Alertas no final */}
    {lowMg.length>0&&<Card style={{borderColor:G.amber+"44",background:`${G.amber}08`}}>
      <div style={{color:G.amber,fontWeight:700,marginBottom:8,fontSize:13}}>⚠️ Margem abaixo de 15%</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {lowMg.map(p=><Badge key={p.id} color={G.amber}>{p.name} — {p.margemPct.toFixed(1)}%</Badge>)}
      </div>
    </Card>}
    {reorder.length>0&&<Card style={{borderColor:G.red+"44",background:`${G.red}08`}}>
      <div style={{color:G.red,fontWeight:700,marginBottom:8,fontSize:13}}>🔔 Reposição necessária ({reorder.length} produto{reorder.length>1?"s":""})</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {reorder.map(p=><Badge key={p.id} color={G.red}>{p.name} — {p.stock}/{p.min} un.</Badge>)}
      </div>
    </Card>}
  </div>);
}


// ── Reports ───────────────────────────────────────────────────
function Reports({sales,costs,customers,installments,storeName}){
  const [month,setMonth]=useState(TODAY().slice(0,7));
  const [rankTab,setRankTab]=useState("receita");

  // Dados do mês
  const mSales=sales.filter(s=>s.date.startsWith(month)&&!s.cancelled&&!s.is_quote);
  const rev=mSales.reduce((a,s)=>a+Number(s.total),0);
  const cogs=mSales.reduce((a,s)=>a+s.items.reduce((b,i)=>b+Number(i.cost_price||0)*i.quantity,0),0);
  const lucBruto=rev-cogs;
  const fixedC=costs.filter(c=>c.type==="fixed"&&c.ref_month===month).reduce((a,c)=>a+Number(c.amount),0);
  const varC=costs.filter(c=>c.type==="variable"&&c.ref_month===month).reduce((a,c)=>a+Number(c.amount),0);
  const lucLiq=lucBruto-fixedC-varC;
  const pctRev=v=>rev>0?`${((v/rev)*100).toFixed(1)}%`:"—";

  // DRE linhas
  const dreRows=[
    {label:"Receita Bruta",value:rev,pct:"100%",bold:true,color:G.green,indent:0},
    {label:"(−) CMV",value:cogs,pct:pctRev(cogs),bold:false,color:G.rose,indent:1},
    {label:"= Lucro Bruto",value:lucBruto,pct:pctRev(lucBruto),bold:true,color:lucBruto>=0?G.violet:G.red,indent:0},
    {label:"(−) Custos Fixos",value:fixedC,pct:pctRev(fixedC),bold:false,color:G.amber,indent:1},
    {label:"(−) Custos Variáveis",value:varC,pct:pctRev(varC),bold:false,color:G.amber,indent:1},
    {label:"= Lucro Líquido",value:lucLiq,pct:pctRev(lucLiq),bold:true,color:lucLiq>=0?G.green:G.red,indent:0,highlight:true},
  ];

  // Comparativo 6 meses
  const last6=Array.from({length:6},(_,i)=>{
    const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-5+i);
    const m=d.toISOString().slice(0,7);
    const ms=sales.filter(s=>s.date.startsWith(m)&&!s.cancelled&&!s.is_quote);
    const r=ms.reduce((a,s)=>a+Number(s.total),0);
    const c=ms.reduce((a,s)=>a+s.items.reduce((b,i)=>b+Number(i.cost_price||0)*i.quantity,0),0);
    const fc=costs.filter(x=>x.type==="fixed"&&x.ref_month===m).reduce((a,x)=>a+Number(x.amount),0);
    const vc=costs.filter(x=>x.type==="variable"&&x.ref_month===m).reduce((a,x)=>a+Number(x.amount),0);
    return{mes:fmtMonth(m+"-01"),receita:+r.toFixed(2),lucro:+(r-c-fc-vc).toFixed(2)};
  });

  // Rankings produtos
  const prodMap={};
  mSales.forEach(s=>s.items.forEach(it=>{
    if(!prodMap[it.product_name])prodMap[it.product_name]={qty:0,rev:0,cost:0};
    prodMap[it.product_name].qty+=it.quantity;
    prodMap[it.product_name].rev+=it.quantity*Number(it.unit_price||0);
    prodMap[it.product_name].cost+=it.quantity*Number(it.cost_price||0);
  }));
  const prodsArr=Object.entries(prodMap).map(([n,v])=>({name:n,...v,mg:v.rev>0?((v.rev-v.cost)/v.rev*100):0}));
  const byRev=[...prodsArr].sort((a,b)=>b.rev-a.rev).slice(0,10);
  const byMg=[...prodsArr].sort((a,b)=>b.mg-a.mg).slice(0,10);
  const byQty=[...prodsArr].sort((a,b)=>b.qty-a.qty).slice(0,10);
  const rankList=rankTab==="receita"?byRev:rankTab==="margem"?byMg:byQty;

  // Inadimplência
  const cancelledIds=new Set(sales.filter(s=>s.cancelled).map(s=>s.id));
  const overdueInst=installments.filter(i=>!i.paid&&i.due_date<TODAY()&&!cancelledIds.has(i.sale_id));
  const byCust={};
  overdueInst.forEach(i=>{
    if(!byCust[i.customer_id])byCust[i.customer_id]={items:[],total:0};
    byCust[i.customer_id].items.push(i);
    byCust[i.customer_id].total+=Number(i.amount);
  });
  const inadimList=Object.entries(byCust).map(([cid,v])=>{
    const c=customers.find(x=>x.id===cid);
    const oldest=[...v.items].sort((a,b)=>a.due_date.localeCompare(b.due_date))[0];
    return{cust:c,total:v.total,dias:daysDiff(oldest.due_date,TODAY()),qtd:v.items.length};
  }).sort((a,b)=>b.total-a.total);
  const totalInadim=inadimList.reduce((a,x)=>a+x.total,0);

  // Print PDF
  const printPDF=()=>{
    const dreHTML=dreRows.map(r=>`
      <tr style="background:${r.highlight?"#f0fff4":"white"};font-weight:${r.bold?"700":"400"}">
        <td style="padding:8px 12px;padding-left:${r.indent?28:12}px;color:#333">${r.label}</td>
        <td style="padding:8px 12px;text-align:right;color:${r.value<0?"#dc2626":"#16a34a"}">${r.value<0?"-":""} R$ ${Math.abs(r.value).toFixed(2).replace(".",",")}</td>
        <td style="padding:8px 12px;text-align:right;color:#6b7280">${r.pct}</td>
      </tr>`).join("");
    const rankHTML=byRev.map((p,i)=>`<tr><td style="padding:6px 10px">${i+1}. ${p.name}</td><td style="text-align:right;padding:6px 10px">R$ ${p.rev.toFixed(2).replace(".",",")}</td><td style="text-align:right;padding:6px 10px">${p.qty}</td><td style="text-align:right;padding:6px 10px">${p.mg.toFixed(1)}%</td></tr>`).join("");
    const inadimHTML=inadimList.map(x=>`<tr><td style="padding:6px 10px">${x.cust?.name||"Avulso"}</td><td style="text-align:right;padding:6px 10px;color:#dc2626">R$ ${x.total.toFixed(2).replace(".",",")}</td><td style="text-align:right;padding:6px 10px">${x.dias}d</td><td style="padding:6px 10px">${x.qtd} parcela(s)</td></tr>`).join("");
    const w=window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Relatório ${storeName} — ${fmtMonth(month+"-01")}</title>
    <style>
      @media print{body{margin:0}@page{margin:20mm}}
      body{font-family:Arial,sans-serif;color:#222;padding:24px;max-width:800px;margin:0 auto}
      h1{color:#7c3aed;font-size:22px;margin-bottom:4px}
      h2{color:#374151;font-size:15px;margin-top:24px;margin-bottom:8px;border-bottom:2px solid #e5e7eb;padding-bottom:4px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{background:#f3f0ff;padding:8px 12px;text-align:left;color:#374151}
      td{border-bottom:1px solid #f3f4f6}
      .footer{margin-top:32px;color:#9ca3af;font-size:11px;text-align:right}
      .total-row{background:#fdf4ff;font-weight:700}
    </style>
    </head><body>
    <h1>📊 Relatório Gerencial — ${storeName}</h1>
    <p style="color:#6b7280;font-size:13px;margin:0">Período: ${fmtMonth(month+"-01")} · Gerado em ${new Date().toLocaleString("pt-BR")}</p>
    <h2>DRE — Demonstrativo de Resultado</h2>
    <table><tr><th>Indicador</th><th style="text-align:right">Valor</th><th style="text-align:right">% Receita</th></tr>${dreHTML}</table>
    <h2>Ranking de Produtos — Por Receita</h2>
    <table><tr><th>Produto</th><th style="text-align:right">Receita</th><th style="text-align:right">Qtd</th><th style="text-align:right">Margem</th></tr>${rankHTML}</table>
    ${inadimList.length>0?`<h2>Inadimplência</h2><table><tr><th>Cliente</th><th style="text-align:right">Total vencido</th><th style="text-align:right">Atraso</th><th>Parcelas</th></tr>${inadimHTML}<tr class="total-row"><td style="padding:8px 10px">TOTAL</td><td style="text-align:right;padding:8px 10px;color:#dc2626">R$ ${totalInadim.toFixed(2).replace(".",",")}</td><td colspan="2"></td></tr></table>`:""}
    <div class="footer">FITPRO GESTÃO CRM — ${storeName}</div>
    </body></html>`);
    w.document.close();setTimeout(()=>w.print(),400);
  };

  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    {/* CSS impressão embutido */}
    <style>{`@media print{.no-print{display:none!important}.print-only{display:block!important}}`}</style>

    {/* Controles */}
    <div style={{display:"flex",gap:9,alignItems:"flex-end",flexWrap:"wrap"}} className="no-print">
      <Inp label="Mês" type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{flex:1,maxWidth:220}}/>
      <Btn onClick={printPDF} variant="pink">🖨️ Exportar PDF</Btn>
    </div>

    {/* DRE */}
    <Card>
      <div style={{fontWeight:700,marginBottom:14,fontSize:15}}>📊 DRE — Demonstrativo de Resultado</div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {dreRows.map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",padding:"9px 12px",background:r.highlight?`${r.color}12`:i%2===0?"#ffffff05":"transparent",borderRadius:9,borderLeft:r.highlight||r.bold?`3px solid ${r.color}`:"3px solid transparent",marginLeft:r.indent?16:0}}>
            <div style={{flex:1,fontSize:r.bold?14:13,fontWeight:r.bold?700:400,color:r.bold?G.text:"#ffffffcc"}}>{r.label}</div>
            <div style={{minWidth:110,textAlign:"right",fontWeight:r.bold?800:600,fontSize:r.highlight?17:r.bold?15:13,color:r.color}}>{r.value<0?"-":""}{R(Math.abs(r.value))}</div>
            <div style={{minWidth:55,textAlign:"right",fontSize:11,color:"#ffffff88",marginLeft:12}}>{r.pct}</div>
          </div>
        ))}
      </div>
    </Card>

    {/* Comparativo 6 meses */}
    <Card>
      <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>📈 Comparativo — últimos 6 meses</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={last6} margin={{top:4,right:4,left:-20,bottom:0}}>
          <XAxis dataKey="mes" tick={{fill:"#ffffffaa",fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fill:"#ffffffaa",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
          <Tooltip formatter={v=>R(v)} contentStyle={{background:G.surf,border:`1px solid ${G.bord}`,borderRadius:8,fontSize:12}}/>
          <Bar dataKey="receita" name="Receita" fill={G.pink} radius={[4,4,0,0]}/>
          <Bar dataKey="lucro" name="Lucro Líq." fill={G.green} radius={[4,4,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
      <div style={{display:"flex",gap:14,justifyContent:"center",marginTop:6}}>
        <span style={{fontSize:12,color:G.pink}}>■ Receita</span>
        <span style={{fontSize:12,color:G.green}}>■ Lucro Líq.</span>
      </div>
    </Card>

    {/* Ranking produtos */}
    <Card>
      <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>🏆 Ranking de produtos — top 10</div>
      <div style={{display:"flex",gap:5,marginBottom:12}}>
        {[["receita","💰 Por Receita"],["margem","📊 Por Margem"],["qty","📦 Por Qtd"]].map(([k,l])=>(
          <button key={k} onClick={()=>setRankTab(k)} style={{flex:1,padding:"7px 0",borderRadius:9,border:"none",background:rankTab===k?G.violet:"#ffffff10",color:rankTab===k?"#fff":"#ffffffcc",fontWeight:rankTab===k?700:500,fontSize:12,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      {rankList.length===0&&<div style={{color:"#ffffff66",textAlign:"center",padding:16}}>Sem vendas no mês.</div>}
      {rankList.map((p,i)=>(
        <div key={p.name} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 0",borderBottom:i<rankList.length-1?`1px solid ${G.bord}`:"none"}}>
          <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,background:PAL[i%PAL.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{i+1}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600}}>{p.name}</div>
            <div style={{fontSize:11,color:"#ffffff88"}}>{p.qty} un. · Mg: {p.mg.toFixed(1)}%</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{color:PAL[i%PAL.length],fontWeight:700,fontSize:13}}>{rankTab==="margem"?p.mg.toFixed(1)+"%":rankTab==="qty"?p.qty+" un.":R(p.rev)}</div>
            {rankTab!=="qty"&&<div style={{fontSize:10,color:"#ffffff66"}}>{rankTab==="margem"?R(p.rev):p.mg.toFixed(1)+"%"}</div>}
          </div>
        </div>
      ))}
    </Card>

    {/* Inadimplência */}
    {inadimList.length>0?<Card style={{borderColor:G.red+"44"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{fontWeight:700,fontSize:14,color:G.red}}>⚠️ Relatório de Inadimplência</div>
        <div style={{textAlign:"right"}}>
          <div style={{color:G.red,fontWeight:800,fontSize:16}}>{R(totalInadim)}</div>
          <div style={{color:"#ffffff88",fontSize:11}}>{inadimList.length} cliente(s) em atraso</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {inadimList.map((x,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"#ffffff06",borderRadius:9,borderLeft:`3px solid ${x.dias>30?G.red:G.amber}`}}>
            <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${G.red},${G.rose})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:"#fff"}}>{INI(x.cust?.name||"?")}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700}}>{x.cust?.name||"Avulso"}</div>
              <div style={{fontSize:11,color:"#ffffff88"}}>{x.qtd} parcela(s) · <span style={{color:x.dias>30?G.red:G.amber}}>{x.dias} dias em atraso</span></div>
            </div>
            <div style={{textAlign:"right",marginRight:8}}>
              <div style={{color:G.red,fontWeight:800,fontSize:15}}>{R(x.total)}</div>
            </div>
            {x.cust?.phone&&<button onClick={()=>window.open(`https://wa.me/${x.cust.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Olá ${x.cust.name.split(" ")[0]}! Você tem ${x.qtd} parcela(s) vencida(s) no valor de ${R(x.total)}. Podemos resolver? 🙏`)}`, "_blank")} style={{background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",borderRadius:8,padding:"6px 10px",fontSize:13,cursor:"pointer",fontWeight:700,flexShrink:0}}>📱</button>}
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",background:`${G.red}10`,borderRadius:9,borderTop:`1px solid ${G.red}30`}}>
          <span style={{fontWeight:700,fontSize:13}}>Total inadimplente</span>
          <span style={{color:G.red,fontWeight:800,fontSize:15}}>{R(totalInadim)}</span>
        </div>
      </div>
    </Card>:<Card style={{borderColor:G.green+"44",background:`${G.green}08`}}>
      <div style={{color:G.green,textAlign:"center",padding:16,fontWeight:700}}>✅ Nenhuma inadimplência no sistema!</div>
    </Card>}
  </div>);
}

// ── WhatsApp Messages ─────────────────────────────────────────
function WhatsAppMessages({storeSettings,storeId,toast,customers,installments,storeName}){
  const def={
    overdue:`Olá {nome}! 😊 Aqui é da {loja}. A parcela {parcela} no valor de {valor} venceu em {vencimento}. Podemos resolver? 🙏`,
    upcoming:`Olá {nome}! 😊 Aqui é da {loja}. Lembrete: sua parcela {parcela} de {valor} vence em {vencimento}. Qualquer dúvida fale comigo! 💪`,
    birthday:`Feliz aniversário, {nome}! 🎉🎂 Toda a equipe da {loja} deseja um dia incrível! Como presente especial, temos novidades esperando por você. 💗`,
  };
  const [msgs,setMsgs]=useState({
    overdue:storeSettings?.wa_overdue||def.overdue,
    upcoming:storeSettings?.wa_upcoming||def.upcoming,
    birthday:storeSettings?.wa_birthday||def.birthday,
  });
  const [saving,setSaving]=useState(false);
  const [preview,setPreview]=useState(null);

  const vars={"{nome}":"Ana Silva","{loja}":storeName||"FitPro","{parcela}":"2","{valor}":"R$ 150,00","{vencimento}":"10/07/2026"};
  const renderPreview=t=>Object.entries(vars).reduce((s,[k,v])=>s.replaceAll(k,v),t);

  const save=async()=>{
    setSaving(true);
    await sb.from("stores").update({wa_overdue:msgs.overdue,wa_upcoming:msgs.upcoming,wa_birthday:msgs.birthday}).eq("id",storeId);
    toast("Mensagens salvas! ✓");
    setSaving(false);
  };

  const reset=key=>setMsgs({...msgs,[key]:def[key]});

  const TYPES=[
    {key:"overdue",icon:"⚠️",label:"Cobrança — Vencida",color:G.red,desc:"Enviada quando uma parcela já passou do vencimento."},
    {key:"upcoming",icon:"⏰",label:"Lembrete — A vencer",color:G.amber,desc:"Lembrete preventivo antes do vencimento."},
    {key:"birthday",icon:"🎂",label:"Feliz Aniversário",color:G.pink,desc:"Enviada automaticamente para clientes aniversariantes."},
  ];

  // Clientes com parcelas vencidas para teste rápido
  const overdueCustomers=customers.filter(c=>{
    return installments.some(i=>i.customer_id===c.id&&!i.paid&&i.due_date<TODAY());
  }).slice(0,3);

  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    {/* Variáveis disponíveis */}
    <Card style={{background:`${G.violet}08`,borderColor:`${G.violet}30`}}>
      <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:G.violet}}>📌 Variáveis disponíveis nas mensagens</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {Object.keys(vars).map(v=><Badge key={v} color={G.violet}>{v}</Badge>)}
      </div>
      <div style={{color:"#ffffff88",fontSize:12,marginTop:8}}>Essas variáveis são substituídas automaticamente pelo sistema ao enviar a mensagem.</div>
    </Card>

    {/* Editor de cada mensagem */}
    {TYPES.map(({key,icon,label,color,desc})=>(
      <Card key={key} style={{borderColor:color+"33"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontWeight:700,fontSize:14}}>{icon} {label}</div>
            <div style={{color:"#ffffff88",fontSize:12,marginTop:2}}>{desc}</div>
          </div>
          <div style={{display:"flex",gap:7}}>
            <Btn small variant="ghost" onClick={()=>reset(key)}>↺ Padrão</Btn>
            <Btn small variant="ghost" onClick={()=>setPreview(preview===key?null:key)}>👁️ Preview</Btn>
          </div>
        </div>
        <textarea
          value={msgs[key]}
          onChange={e=>setMsgs({...msgs,[key]:e.target.value})}
          rows={4}
          style={{...iS,resize:"vertical",lineHeight:1.6,fontSize:13}}
        />
        {preview===key&&<div style={{marginTop:10,background:"#25D36615",border:"1px solid #25D36640",borderRadius:9,padding:"12px 14px"}}>
          <div style={{color:"#25D366",fontWeight:700,fontSize:12,marginBottom:6}}>📱 Preview da mensagem:</div>
          <div style={{color:"#ffffffcc",fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{renderPreview(msgs[key])}</div>
        </div>}
      </Card>
    ))}

    <Btn onClick={save} variant="pink" disabled={saving} full style={{padding:"12px 0",fontSize:15}}>{saving?<Spin/>:"💾 Salvar mensagens"}</Btn>

    {/* Teste rápido */}
    {overdueCustomers.length>0&&<Card>
      <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>🧪 Teste rápido — enviar cobrança</div>
      <div style={{color:"#ffffff88",fontSize:12,marginBottom:10}}>Clientes com parcelas vencidas disponíveis para teste:</div>
      {overdueCustomers.map(c=>{
        const inst=installments.filter(i=>i.customer_id===c.id&&!i.paid&&i.due_date<TODAY())[0];
        if(!inst||!c.phone)return null;
        const msg=msgs.overdue.replaceAll("{nome}",c.name.split(" ")[0]).replaceAll("{loja}",storeName||"FitPro").replaceAll("{parcela}",String(inst.number||1)).replaceAll("{valor}",R(inst.amount)).replaceAll("{vencimento}",fmtD(inst.due_date));
        return(<div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#ffffff06",borderRadius:9,marginBottom:6}}>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{c.name}</div><div style={{fontSize:11,color:"#ffffff88"}}>{c.phone}</div></div>
          <button onClick={()=>window.open(`https://wa.me/${c.phone.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`,"_blank")} style={{background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:700,flexShrink:0}}>📱 Enviar teste</button>
        </div>);
      })}
    </Card>}
  </div>);
}

const TABS=[{l:"Dashboard",i:"📊"},{l:"Nova Venda",i:"🛒"},{l:"Vendas",i:"🧾"},{l:"Vencimentos",i:"📅"},{l:"Clientes",i:"👤"},{l:"Produtos",i:"👗"},{l:"Estoque",i:"📦"},{l:"Custos",i:"💸"},{l:"Relatórios",i:"📋"},{l:"WhatsApp",i:"📱"},{l:"Config",i:"⚙️"}];

export default function Page(){
  const [user,    setUser]    = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [storeName,setSName]  = useState("FITPRO GESTÃO CRM");
  const [storeSettings, setStoreSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [rtOk,    setRtOk]    = useState(false);
  const [tab,     setTab]     = useState(0);
  const [tn,      setTn]      = useState({msg:"",col:G.green});

  // Data
  const [products,     setProducts]     = useState([]);
  const [customers,    setCustomers]    = useState([]);
  const [sales,        setSales]        = useState([]);
  const [saleItems,    setSaleItems]    = useState([]);
  const [installments, setInstallments] = useState([]);
  const [costs,        setCosts]        = useState([]);

  const toast = useCallback((msg,col=G.violet)=>{setTn({msg,col});setTimeout(()=>setTn({msg:"",col:G.violet}),2800);},[]);

  // Auth init
  useEffect(()=>{
    sb.auth.getSession().then(({data:{session}})=>{
      if(session?.user) initStore(session.user);
      else setLoading(false);
    });
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,session)=>{
      if(session?.user)initStore(session.user);else{setUser(null);setStoreId(null);setLoading(false);}
    });
    return()=>subscription.unsubscribe();
  },[]);

  const initStore = async(u)=>{
    setUser(u);
    try{
      const{data:su}=await sb.from("store_users").select("store_id").eq("user_id",u.id).single();
      if(su?.store_id){
        setStoreId(su.store_id);
        const{data:st}=await sb.from("stores").select("*").eq("id",su.store_id).single();
        if(st){setSName(st.name||"FITPRO GESTÃO CRM");setStoreSettings(st);}
      }
    }catch(e){console.error("initStore",e);}
    setLoading(false);
  };

  // Load data when storeId ready
  useEffect(()=>{
    if(!storeId)return;
    loadAll();
    setupRealtime();
  },[storeId]);

  const loadAll = async()=>{
    const[p,c,s,si,i,co]=await Promise.all([
      sb.from("products").select("*").eq("store_id",storeId).eq("active",true).order("name"),
      sb.from("customers").select("*").eq("store_id",storeId).order("name"),
      sb.from("sales").select("*").eq("store_id",storeId).order("date",{ascending:false}),
      sb.from("sale_items").select("*"),
      sb.from("installments").select("*").eq("store_id",storeId).order("due_date"),
      sb.from("costs").select("*").eq("store_id",storeId).order("created_at",{ascending:false}),
    ]);
    if(p.data)setProducts(p.data);
    if(c.data)setCustomers(c.data);
    if(s.data){
      const salesWithItems=s.data.map(sale=>({...sale,items:si.data?.filter(x=>x.sale_id===sale.id)||[]}));
      setSales(salesWithItems);
    }
    if(i.data)setInstallments(i.data);
    if(co.data)setCosts(co.data);
  };

  const setupRealtime = ()=>{
    const channel = sb.channel(`store-${storeId}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"products",filter:`store_id=eq.${storeId}`},()=>loadAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"customers",filter:`store_id=eq.${storeId}`},()=>loadAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"sales",filter:`store_id=eq.${storeId}`},()=>loadAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"sale_items"},()=>loadAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"installments",filter:`store_id=eq.${storeId}`},()=>loadAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"costs",filter:`store_id=eq.${storeId}`},()=>loadAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"stores"},()=>loadAll())
      .subscribe(status=>{setRtOk(status==="SUBSCRIBED");});
    return()=>sb.removeChannel(channel);
  };

  const handleSignOut=async()=>{await sb.auth.signOut();setUser(null);setStoreId(null);setSales([]);setProducts([]);setCustomers([]);setInstallments([]);setCosts([]);};

  if(loading)return(
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>👗</div><div style={{color:G.pink,fontWeight:700}}>Carregando...</div></div>
    </div>
  );

  if(!user)return(<><style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style><AuthScreen onAuth={u=>{initStore(u);}}/></>);

  const panels=[
    <Dashboard sales={sales} products={products} customers={customers} costs={costs} installments={installments} storeSettings={storeSettings}/>,
    <NewSale products={products} customers={customers} storeId={storeId} toast={toast} allSales={sales} allInstallments={installments}/>,
    <SalesList sales={sales} customers={customers} installments={installments} storeId={storeId} toast={toast} storeName={storeName} storeSettings={storeSettings}/>,
    <DueDates installments={installments} customers={customers} storeName={storeName} toast={toast}/>,
    <Customers customers={customers} sales={sales} installments={installments} storeId={storeId} storeName={storeName} toast={toast} storeSettings={storeSettings}/>,
    <Products products={products} storeId={storeId} toast={toast}/>,
    <Estoque products={products} sales={sales}/>,
    <Costs costs={costs} customers={customers} storeId={storeId} toast={toast}/>,
    <Reports sales={sales} costs={costs} customers={customers} installments={installments} storeName={storeName}/>,
    <WhatsAppMessages storeSettings={storeSettings} storeId={storeId} toast={toast} customers={customers} installments={installments} storeName={storeName}/>,
    <Settings storeName={storeName} storeId={storeId} toast={toast} onSignOut={handleSignOut} storeSettings={storeSettings} onSettingsUpdate={s=>{setStoreSettings(s);setSName(s.name);}} products={products} sales={sales} customers={customers}/>,
  ];

  return(
    <div style={{minHeight:"100vh",background:G.bg,fontFamily:"system-ui,'Segoe UI',sans-serif",color:G.text}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${G.bord2};border-radius:4px}`}</style>
      {/* Header */}
      <div style={{background:"#0b0b1799",backdropFilter:"blur(14px)",borderBottom:`1px solid ${G.bord}`,padding:"10px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:300}}>
        <div style={{width:32,height:32,borderRadius:8,flexShrink:0,background:`linear-gradient(135deg,${G.pink},${G.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👗</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:900,fontSize:14,background:`linear-gradient(90deg,${G.pink},${G.violet})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{storeName}</div>
        </div>
        <RTBadge connected={rtOk}/>
        <div style={{color:G.muted,fontSize:11,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
      </div>
      {/* Nav */}
      <div style={{display:"flex",overflowX:"auto",gap:1,padding:"7px 10px",borderBottom:`1px solid ${G.bord}`,background:G.bg,scrollbarWidth:"none"}}>
        {TABS.map((t,i)=>{
          // Modo caixa: oculta Custos (idx 7) e Relatórios (idx 8)
          if(storeSettings?.modo_caixa&&(t.l==="Custos"||t.l==="Relatórios"||t.l==="WhatsApp"))return null;
          return(<button key={i} onClick={()=>setTab(i)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:4,padding:"7px 12px",borderRadius:8,border:"none",background:tab===i?`${G.pink}28`:"#ffffff0a",color:tab===i?G.pink:"#ffffffcc",fontWeight:tab===i?700:500,fontSize:12,cursor:"pointer",borderBottom:tab===i?`2px solid ${G.pink}`:"2px solid transparent",whiteSpace:"nowrap"}}>
            <span>{t.i}</span><span>{t.l}</span>
          </button>);
        })}
      </div>
      {/* Content */}
      <div style={{padding:"14px 14px 60px",maxWidth:740,margin:"0 auto"}}>
        {panels[tab]}
      </div>
      <Toast msg={tn.msg} color={tn.col}/>
    </div>
  );
}
