import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart, Plus, Minus, X, LogOut, Settings, Trash2,
  Upload, Eye, EyeOff, ChevronRight, ChevronDown,
  RefreshCw, Ban, Key, Lock
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, setDoc, getDoc,
  collection, onSnapshot, query, orderBy, updateDoc, deleteDoc,
  writeBatch, getDocs
} from "firebase/firestore";

/* ════════════════════════════════════════════
   🔥 FIREBASE CONFIG
   Reemplaza estos valores con los de tu proyecto
   en https://console.firebase.google.com
════════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyBEJ8_QDgT2eFjsxIk0jx_e0ualoQ-A-_g",
  authDomain: "altura-cafe.firebaseapp.com",
  projectId: "altura-cafe",
  storageBucket: "altura-cafe.firebasestorage.app",
  messagingSenderId: "435328707331",
  appId: "1:435328707331:web:aee5c333adfb6334131736"
};

const fbApp = initializeApp(FIREBASE_CONFIG);
const fdb   = getFirestore(fbApp);

/* ── Firebase helpers ── */
const fbGet = async (col, id) => {
  try { const s = await getDoc(doc(fdb,col,id)); return s.exists()?s.data():null; }
  catch { return null; }
};
const fbSet = async (col, id, data) => {
  try { await setDoc(doc(fdb,col,id), data); return true; }
  catch(e) { console.error(e); return false; }
};
const fbUpd = async (col, id, data) => {
  try { await updateDoc(doc(fdb,col,id), data); return true; }
  catch { return false; }
};

/* Archivar pedidos del día y limpiar la colección orders */
const archiveOrders = async () => {
  try {
    const snap = await getDocs(collection(fdb,"orders"));
    if(snap.empty) return;
    const yesterday = dateKey(new Date(Date.now() - 86400000));
    const batch = writeBatch(fdb);
    snap.docs.forEach(d => {
      const orderDate = d.data().createdAt?.slice(0,10) || yesterday;
      batch.set(doc(fdb,"historial", orderDate + "_" + d.id), {...d.data(), id:d.id, archivedAt:orderDate});
      batch.delete(doc(fdb,"orders",d.id));
    });
    await batch.commit();
  } catch(e){ console.error("Archive error:",e); }
};

/* ════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════ */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const fmt$ = n => `$${parseFloat(n||0).toFixed(2)}`;
const nowDate = () => new Date().toLocaleDateString("es-SV",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
const dateKey = d => { const dt=d||new Date(); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`; };
const dateLabel = key => { const [y,m,d]=key.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("es-SV",{weekday:"long",year:"numeric",month:"long",day:"numeric"}); };

const genTempPass = () => {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({length:8},()=>c[Math.floor(Math.random()*c.length)]).join("");
};

const DELIVERY_TIMES = ["11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","4:00 PM","5:00 PM"];

const isTimePast = (t) => {
  const now = new Date();
  const [time, ampm] = t.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
};

const CAT_LABELS = {
  calientes:"☕ Cafés Calientes", helados:"🧊 Cafés Helados", frappuccinos:"🥤 Frappuccinos",
  matcha:"🍵 Matcha", bowls:"🥣 Bowls", extras:"✨ Extras"
};
const CAT_ORDER = ["calientes","helados","frappuccinos","matcha","bowls","extras"];

const STATUS_INFO = {
  pendiente: { label:"⏳ Pendiente", bg:"#FFF3CD", color:"#856404" },
  enviado:   { label:"🚗 Enviado",   bg:"#D4EDDA", color:"#155724" },
  cancelado: { label:"❌ Cancelado", bg:"#F8D7DA", color:"#721C24" },
};
const STATUS_NEXT = { pendiente:"enviado" };

const FOOD_EMOJIS = ["☕","🧋","🥤","🍵","🧊","🥣","🍫","🍨","🍮","🥛","🌰","🍯","🍓","🍦","✨","💧","🧃","🍪"];

const DEF_CONFIG  = { name:"Altura Café", phone:"7000-0000", address:"El Salvador", logo:null, desc:"Café de altura, experiencias que elevan" };
const DEF_CATALOG = [
  { id:"m1",  cat:"calientes",    name:"Espresso",              emoji:"☕", price:1.50 },
  { id:"m2",  cat:"calientes",    name:"Americano",             emoji:"☕", price:2.00 },
  { id:"m3",  cat:"calientes",    name:"Capuchino",             emoji:"☕", price:2.75 },
  { id:"m4",  cat:"calientes",    name:"Latte",                 emoji:"☕", price:3.00 },
  { id:"m5",  cat:"calientes",    name:"Moka",                  emoji:"☕", price:3.25 },
  { id:"m6",  cat:"helados",      name:"Iced Latte",            emoji:"🧊", price:3.50 },
  { id:"m7",  cat:"helados",      name:"Iced Coffee",           emoji:"🧊", price:2.50 },
  { id:"m8",  cat:"helados",      name:"Iced Caramel Latte",    emoji:"🧊", price:4.00 },
  { id:"m9",  cat:"frappuccinos", name:"Frappuccino Caramelo",  emoji:"🥤", price:4.50 },
  { id:"m10", cat:"frappuccinos", name:"Frappuccino Chocolate", emoji:"🥤", price:4.50 },
  { id:"m11", cat:"frappuccinos", name:"Frappuccino Moka",      emoji:"🥤", price:4.75 },
  { id:"m12", cat:"matcha",       name:"Matcha Latte",          emoji:"🍵", price:4.00 },
  { id:"m13", cat:"matcha",       name:"Matcha Strawberry Latte", emoji:"🍵", price:4.75 },
  { id:"m14", cat:"matcha",       name:"Iced Matcha Latte",     emoji:"🍵", price:4.25 },
  { id:"m15", cat:"bowls",        name:"Yogurt Bowl Altura",    emoji:"🥣", price:4.50 },
  { id:"m16", cat:"extras",       name:"Leche Vegetal",         emoji:"🥛", price:0.50 },
  { id:"m17", cat:"extras",       name:"Shot Extra de Espresso", emoji:"☕", price:0.75 },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Nunito:wght@400;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Nunito',sans-serif!important}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-thumb{background:#6B422655;border-radius:99px}
  .pac{font-family:'Pacifico',cursive!important}
  .btn-hot{background:linear-gradient(135deg,#6B4226,#A9746E);color:white;border:none;border-radius:14px;padding:13px 28px;font-family:'Nunito',sans-serif;font-weight:800;cursor:pointer;transition:all .2s;font-size:15px;display:inline-flex;align-items:center;justify-content:center;gap:7px}
  .btn-hot:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(232,75,30,.38)}
  .btn-hot:disabled{opacity:.65;cursor:not-allowed;transform:none}
  .btn-out{background:white;color:#6B4226;border:2.5px solid #6B4226;border-radius:14px;padding:11px 26px;font-family:'Nunito',sans-serif;font-weight:800;cursor:pointer;transition:all .2s;font-size:15px;display:inline-flex;align-items:center;justify-content:center;gap:7px}
  .btn-out:hover{background:#F3E9DD}
  .btn-green{background:#25D366;color:white;border:none;border-radius:14px;padding:10px 20px;font-family:'Nunito',sans-serif;font-weight:800;cursor:pointer;font-size:14px;display:inline-flex;align-items:center;justify-content:center;gap:7px}
  .btn-red{background:#C0392B;color:white;border:none;border-radius:14px;padding:9px 16px;font-family:'Nunito',sans-serif;font-weight:800;cursor:pointer;font-size:13px;display:inline-flex;align-items:center;justify-content:center;gap:6px}
  .card{background:white;border-radius:20px;box-shadow:0 4px 24px rgba(0,0,0,.07);overflow:hidden}
  .inp{width:100%;padding:12px 15px;border:2.5px solid #E4D2BE;border-radius:12px;font-family:'Nunito',sans-serif;font-size:14px;outline:none;transition:border .2s;background:#FBF6EF;color:#2B1B12}
  .inp:focus{border-color:#6B4226}
  .inp::placeholder{color:#C8A090}
  select.inp{appearance:auto}
  .tab-btn{background:transparent;border:none;cursor:pointer;font-family:'Nunito',sans-serif;font-weight:700;padding:11px 14px;color:#AAA;border-bottom:3px solid transparent;transition:all .2s;font-size:14px;white-space:nowrap}
  .tab-btn.on{color:#6B4226;border-bottom-color:#6B4226}
  .chip{padding:5px 14px;border-radius:99px;border:2px solid;font-family:'Nunito',sans-serif;font-weight:700;cursor:pointer;font-size:13px;transition:all .15s}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .fu{animation:fadeUp .35s ease both}
  @keyframes pop{0%{transform:scale(.85)}65%{transform:scale(1.06)}100%{transform:scale(1)}}
  .pop{animation:pop .35s ease both}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
  .pulse{animation:pulse 1.8s ease infinite}
`;

/* ════════════════════════════════════════════
   ROOT APP
════════════════════════════════════════════ */
export default function App() {
  const [view,setView]       = useState("menu");
  const [user,setUser]       = useState(null);
  const [isAdmin,setAdmin]   = useState(false);
  const [cart,setCart]       = useState([]);
  const [cfg,setCfg]         = useState(DEF_CONFIG);
  const [menus,setMenus]     = useState({});
  const [catalog,setCatalog] = useState(DEF_CATALOG);
  const [antos,setAntos]     = useState([]);
  const [orders,setOrders]   = useState([]);
  const [users,setUsers]     = useState([]);
  const [toast,setToast]     = useState(null);
  const [ready,setReady]     = useState(false);

  const notify = (msg,err=false) => { setToast({msg,err}); setTimeout(()=>setToast(null),3500); };

  /* ── Load estáticos + subscripciones en tiempo real ── */
  useEffect(()=>{
    const sess = (() => { try { return JSON.parse(localStorage.getItem("sess")); } catch { return null; } })();

    const init = async () => {
      const [c, cat, a, u] = await Promise.all([
        fbGet("app","cfg"), fbGet("app","catalog"), fbGet("app","antos"), fbGet("app","users")
      ]);
      if(c)        setCfg(c);
      if(cat?.items) setCatalog(cat.items);
      if(a?.items)   setAntos(a.items);
      if(u?.list)    setUsers(u.list);
      if(sess?.admin){ setAdmin(true); setView("admin"); }
      else if(sess?.user){
        const fresh = (u?.list||[]).find(x=>x.id===sess.user.id);
        if(fresh) setUser(fresh);
      }
      setReady(true);
    };
    init();

    /* Menú de hoy — tiempo real */
    const unsubMenu = onSnapshot(doc(fdb,"menus",dateKey()), snap => {
      if(snap.exists()) setMenus(prev=>({...prev,[dateKey()]:snap.data()}));
      else setMenus(prev=>{ const n={...prev}; delete n[dateKey()]; return n; });
    });

    /* Pedidos — tiempo real */
    const q = query(collection(fdb,"orders"), orderBy("createdAt","desc"));
    const unsubOrders = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d=>({...d.data(), id:d.id})));
    });

    /* Auto-desactivar menú a las 6 PM + archivar pedidos a medianoche */
    let lastArchivedDate = localStorage.getItem("lastArchivedDate") || "";
    const checkTime = () => {
      const now = new Date();
      const h = now.getHours();
      const today = dateKey(now);
      // Desactivar menú a las 6 PM
      if(h>=18){
        const tk=dateKey();
        setMenus(prev=>{
          if(prev[tk]?.active){
            const upd={...prev,[tk]:{...prev[tk],active:false}};
            fbSet("menus",tk,upd[tk]);
            return upd;
          }
          return prev;
        });
      }
      // Archivar pedidos a medianoche (entre 00:00 y 00:01)
      if(h===0 && lastArchivedDate !== today){
        lastArchivedDate = today;
        localStorage.setItem("lastArchivedDate", today);
        archiveOrders();
      }
    };
    checkTime();
    const timer = setInterval(checkTime,60000);

    return ()=>{ unsubMenu(); unsubOrders(); clearInterval(timer); };
  },[]);

  /* ── Persistencia ── */
  const saveCfg     = async v => { setCfg(v);      await fbSet("app","cfg",v); };
  const saveMenuDay = async (dk,v) => { setMenus(p=>({...p,[dk]:v})); await fbSet("menus",dk,v); };
  const saveAntos   = async v => { setAntos(v);    await fbSet("app","antos",{items:v}); };
  const saveCatalog = async v => { setCatalog(v);  await fbSet("app","catalog",{items:v}); };
  const saveUsers   = async v => { setUsers(v);    await fbSet("app","users",{list:v}); };
  const saveSession = v => localStorage.setItem("sess",JSON.stringify(v));

  const loginAdmin = async (u,p) => {
    if(u.trim()==="admin"&&p.trim()==="altura2024"){ setAdmin(true); setView("admin"); saveSession({admin:true}); return true; }
    return false;
  };
  const loginUser = async (usuario,clave) => {
    const u = users.find(x=>x.usuario===usuario&&x.clave===clave);
    if(u){ setUser(u); setView("menu"); saveSession({user:u}); return true; }
    return false;
  };
  const registerUser = async data => {
    if(users.find(x=>x.usuario===data.usuario)) return "usuario";
    if(users.find(x=>x.email===data.email))     return "email";
    const u={...data,id:uid(),role:"customer"};
    const newList=[...users,u];
    await saveUsers(newList);
    setUser(u); saveSession({user:u}); return "ok";
  };
  const logout = async () => { setUser(null); setAdmin(false); setView("menu"); setCart([]); saveSession(null); };

  const placeOrder = async data => {
    const o={...data,id:uid(),status:"pendiente",createdAt:new Date().toISOString(),userId:user?.id,userName:user?.nombre};
    await fbSet("orders",o.id,o);
    return o;
  };
  const updateStatus = async (id,status) => { await fbUpd("orders",id,{status}); };

  const changePassword = async (userId,newPass) => {
    const newList = users.map(u=>u.id===userId?{...u,clave:newPass}:u);
    await saveUsers(newList);
    const fresh = newList.find(u=>u.id===userId);
    if(fresh){ setUser(fresh); saveSession({user:fresh}); }
  };

  const ctx={view,setView,user,isAdmin,cart,setCart,cfg,menus,catalog,antos,orders,users,
    notify,loginAdmin,loginUser,registerUser,logout,placeOrder,updateStatus,
    saveCfg,saveMenuDay,saveCatalog,saveAntos,saveUsers,changePassword,archiveOrders};

  if(!ready) return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FBF5EC"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center"}}><div className="pulse" style={{fontSize:64}}>☕</div><p className="pac" style={{color:"#6B4226",fontSize:22,marginTop:12}}>Cargando...</p></div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#FBF5EC",fontFamily:"'Nunito',sans-serif"}}>
      <style>{CSS}</style>
      <NavBar {...ctx}/>
      <main style={{maxWidth:880,margin:"0 auto",padding:"20px 14px 100px"}}>
        {view==="menu"          && <MenuPage      {...ctx}/>}
        {view==="login"         && <LoginPage     {...ctx}/>}
        {view==="register"      && <RegisterPage  {...ctx}/>}
        {view==="forgot"        && <ForgotPage    {...ctx}/>}
        {view==="order"         && <OrderPage     {...ctx}/>}
        {view==="my-orders"&&user&& <MyOrders     {...ctx}/>}
        {view==="change-pass"&&user&&<ChangePassPage {...ctx}/>}
        {view==="admin-login"   && <AdminLogin    {...ctx}/>}
        {view==="admin"&&isAdmin&& <AdminPanel    {...ctx}/>}
      </main>
      {toast&&(
        <div className="fu" style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:toast.err?"#C0392B":"#1E6B2D",color:"white",padding:"12px 24px",borderRadius:16,fontWeight:800,zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,.25)",fontSize:14,whiteSpace:"nowrap"}}>
          {toast.err?"❌":"✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── NAVBAR ── */
function NavBar({setView,user,isAdmin,cart,logout,cfg}){
  const count=cart.reduce((s,i)=>s+i.qty,0);
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  return(
    <header style={{background:"white",boxShadow:"0 2px 20px rgba(0,0,0,.08)",position:"sticky",top:0,zIndex:200}}>
      <div style={{maxWidth:880,margin:"0 auto",padding:"0 14px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
        <div onClick={()=>setView("menu")} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
          {cfg.logo?<img src={cfg.logo} alt="" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",border:"2px solid #E4D2BE"}}/>:<div style={{width:44,height:44,background:"linear-gradient(135deg,#6B4226,#C89B3C)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>☕</div>}
          <span className="pac" style={{fontSize:20,color:"#6B4226",lineHeight:1}}>{cfg.name}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {!isAdmin&&<button onClick={()=>setView("order")} style={{position:"relative",background:count>0?"linear-gradient(135deg,#6B4226,#A9746E)":"#F5F5F5",border:"none",borderRadius:99,height:42,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            <ShoppingCart size={18} color={count>0?"white":"#AAA"}/>
            {count>0&&<><span style={{color:"white",fontWeight:800,fontSize:13}}>{fmt$(total)}</span><span style={{position:"absolute",top:-4,right:-4,background:"#2D5016",color:"white",width:20,height:20,borderRadius:"50%",fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{count}</span></>}
          </button>}
          {user&&!isAdmin&&<>
            <button onClick={()=>setView("my-orders")} className="btn-out" style={{padding:"7px 13px",fontSize:13}}>Mis Pedidos</button>
            <button onClick={()=>setView("change-pass")} style={{background:"none",border:"none",cursor:"pointer",color:"#9C7B5F",padding:4}} title="Cambiar clave"><Key size={16}/></button>
            <button onClick={logout} style={{background:"none",border:"none",cursor:"pointer",color:"#CCC",padding:4}}><LogOut size={17}/></button>
          </>}
          {isAdmin&&<button onClick={logout} className="btn-out" style={{padding:"7px 13px",fontSize:13}}><LogOut size={14}/>Salir</button>}
          {!user&&!isAdmin&&<button onClick={()=>setView("login")} className="btn-hot" style={{padding:"8px 18px",fontSize:14}}>Ingresar</button>}
          <button onClick={()=>setView("admin-login")} style={{background:"none",border:"none",cursor:"pointer",color:"#DDD",padding:"4px"}} title="Admin"><Settings size={15}/></button>
        </div>
      </div>
    </header>
  );
}

/* ── MENU PAGE ── */
function MenuPage({menus,antos,cart,setCart,cfg,setView,user,notify}){
  const today=(menus||{})[dateKey()]||null;
  const menuActivo=today&&today.active;
  const addToCart=(item)=>{const ex=cart.find(c=>c.id===item.id);if(ex)setCart(cart.map(c=>c.id===item.id?{...c,qty:c.qty+1}:c));else setCart([...cart,{...item,qty:1}]);notify(item.name+" agregado 🛒");};
  const decCart=(item)=>{const ex=cart.find(c=>c.id===item.id);if(!ex)return;if(ex.qty===1)setCart(cart.filter(c=>c.id!==item.id));else setCart(cart.map(c=>c.id===item.id?{...c,qty:c.qty-1}:c));};
  const qty=id=>cart.find(c=>c.id===id)?.qty||0;
  const grouped={};
  ((today?.items)||[]).forEach(i=>{if(!grouped[i.cat])grouped[i.cat]=[];grouped[i.cat].push(i);});
  const cartCount=cart.reduce((s,i)=>s+i.qty,0);
  const cartTotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  return(
    <div>
      <div className="fu card" style={{background:"linear-gradient(135deg,#6B4226 0%,#A9746E 55%,#C89B3C 100%)",padding:"30px 24px",marginBottom:24,color:"white",textAlign:"center",position:"relative",overflow:"hidden",borderRadius:24}}>
        <div style={{position:"absolute",fontSize:120,opacity:.06,top:-20,right:-20,lineHeight:1,userSelect:"none"}}>☕</div>
        {cfg.logo&&<img src={cfg.logo} alt="" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",border:"3px solid rgba(255,255,255,.5)",marginBottom:8}}/>}
        <p className="pac" style={{fontSize:28,marginBottom:4,textShadow:"0 2px 8px rgba(0,0,0,.15)"}}>{menuActivo?"¡Menú de Hoy! ☕":`¡Bienvenido a ${cfg.name}!`}</p>
        <p style={{opacity:.85,fontSize:13,marginBottom:10,textTransform:"capitalize"}}>{today?.date||nowDate()}</p>
        {menuActivo&&<span style={{background:"rgba(255,255,255,.2)",backdropFilter:"blur(4px)",padding:"6px 20px",borderRadius:99,fontSize:13}}>{today.message}</span>}
        {!user&&<div style={{marginTop:18,display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setView("register")} style={{background:"white",color:"#6B4226",border:"none",borderRadius:99,padding:"9px 22px",fontFamily:"'Nunito',sans-serif",fontWeight:800,cursor:"pointer",fontSize:14}}>Crear Cuenta</button>
          <button onClick={()=>setView("login")} style={{background:"transparent",color:"white",border:"2px solid white",borderRadius:99,padding:"7px 20px",fontFamily:"'Nunito',sans-serif",fontWeight:700,cursor:"pointer",fontSize:14}}>Ingresar</button>
        </div>}
        {user&&<div style={{marginTop:12,background:"rgba(255,255,255,.2)",borderRadius:99,display:"inline-block",padding:"5px 16px",fontSize:13}}>👋 Hola, <strong>{user.nombre.split(" ")[0]}</strong></div>}
      </div>
      {menuActivo&&(today?.items||[]).length>0?(
        <div className="fu">
          <h2 className="pac" style={{color:"#6B4226",fontSize:22,marginBottom:16}}>☕ Menú del Día</h2>
          {CAT_ORDER.filter(cat=>grouped[cat]?.length>0).map(cat=>(
            <div key={cat} style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:1.4,color:"#9C7B5F",marginBottom:8,paddingLeft:4}}>{CAT_LABELS[cat]||cat}</div>
              {grouped[cat].map(item=>(
                <div key={item.id} className="card" style={{padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:28,lineHeight:1}}>{item.emoji}</span><div><div style={{fontWeight:700,fontSize:15,color:"#2B1B12"}}>{item.name}</div><div style={{color:"#6B4226",fontWeight:900,fontSize:15}}>{fmt$(item.price)}</div></div></div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {qty(item.id)>0&&<><button onClick={()=>decCart(item)} style={{width:30,height:30,borderRadius:"50%",border:"2px solid #6B4226",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#6B4226"}}><Minus size={13}/></button><span style={{fontWeight:900,minWidth:20,textAlign:"center",fontSize:15}}>{qty(item.id)}</span></>}
                    <button onClick={()=>addToCart(item)} style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#6B4226,#A9746E)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={14} color="white"/></button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ):(
        <div className="card fu" style={{padding:44,textAlign:"center"}}>
          <div style={{fontSize:60,marginBottom:8}}>☕</div>
          <p className="pac" style={{color:"#6B4226",fontSize:20}}>Menú en Preparación</p>
          <p style={{color:"#AAA",marginTop:8,fontSize:14}}>El menú estará disponible muy pronto</p>
          <p style={{color:"#6B4226",fontWeight:800,marginTop:10}}>📞 {cfg.phone}</p>
        </div>
      )}
      {(antos||[]).filter(a=>a.active!==false).length>0&&(
        <div style={{marginTop:32}} className="fu">
          <h2 className="pac" style={{color:"#C89B3C",fontSize:22,marginBottom:4}}>🌟 Especiales del Café</h2>
          <p style={{color:"#AAA",fontSize:13,marginBottom:16}}>Bebidas y bocados de temporada</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",gap:14}}>
            {(antos||[]).filter(a=>a.active!==false).map(a=>(
              <div key={a.id} className="card">
                {a.image?<img src={a.image} alt={a.title} style={{width:"100%",height:170,objectFit:"cover"}}/>:<div style={{height:90,background:"linear-gradient(135deg,#C89B3C,#6B4226)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>🌟</div>}
                <div style={{padding:14}}>
                  <h3 style={{fontWeight:800,fontSize:15,marginBottom:4}}>{a.title}</h3>
                  {a.desc&&<p style={{color:"#AAA",fontSize:13,marginBottom:8}}>{a.desc}</p>}
                  {(a.items||[]).map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px dashed #E4D2BE",fontSize:14}}><span style={{color:"#555"}}>{it.name}</span><span style={{color:"#6B4226",fontWeight:800}}>{fmt$(it.price)}</span></div>)}
                  {(a.items||[]).length>0&&<button onClick={()=>{const it=a.items[0];const ci={id:"anto-"+a.id,name:a.title+(a.items.length>1?" - "+it.name:""),price:parseFloat(it.price)||0,emoji:"🌟",cat:"antojito"};const ex=cart.find(c=>c.id===ci.id);if(ex)setCart(cart.map(c=>c.id===ci.id?{...c,qty:c.qty+1}:c));else setCart([...cart,{...ci,qty:1}]);notify(a.title+" agregado 🛒");}} className="btn-hot" style={{width:"100%",marginTop:12,padding:"10px",fontSize:14}}>Agregar al Pedido</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {cartCount>0&&<div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:150,width:"calc(100% - 28px)",maxWidth:500}}>
        <button onClick={()=>user?setView("order"):setView("login")} className="btn-hot" style={{width:"100%",padding:"15px 20px",fontSize:15,boxShadow:"0 8px 32px rgba(232,75,30,.45)"}}>
          <ShoppingCart size={19}/>Ver Pedido ({cartCount} ítems) — {fmt$(cartTotal)}<ChevronRight size={18}/>
        </button>
      </div>}
    </div>
  );
}

/* ── LOGIN ── */
function LoginPage({loginUser,setView,notify}){
  const [f,setF]=useState({usuario:"",clave:""});
  const [show,setShow]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const submit=async()=>{if(!f.usuario||!f.clave){setErr("Completa todos los campos");return;}setLoading(true);setErr("");const ok=await loginUser(f.usuario,f.clave);setLoading(false);if(ok)notify("¡Bienvenido! 👋");else setErr("Usuario o contraseña incorrectos");};
  return(
    <div className="fu" style={{maxWidth:400,margin:"0 auto",paddingTop:16}}>
      <div className="card" style={{padding:28}}>
        <div style={{textAlign:"center",marginBottom:22}}><div style={{fontSize:52,marginBottom:4}}>🔑</div><h2 className="pac" style={{color:"#6B4226",fontSize:22}}>Iniciar Sesión</h2></div>
        {err&&<div style={{background:"#F6EAE3",border:"1.5px solid #E7C9B4",borderRadius:10,padding:"9px 13px",color:"#C0392B",fontSize:14,marginBottom:14,fontWeight:700}}>⚠️ {err}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <input className="inp" placeholder="Usuario" value={f.usuario} onChange={e=>setF({...f,usuario:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          <div style={{position:"relative"}}>
            <input className="inp" type={show?"text":"password"} placeholder="Contraseña" value={f.clave} onChange={e=>setF({...f,clave:e.target.value})} style={{paddingRight:46}} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9C7B5F"}}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button>
          </div>
          <button className="btn-hot" onClick={submit} disabled={loading} style={{width:"100%",padding:"13px"}}>{loading?"Ingresando...":"Ingresar 🔑"}</button>
        </div>
        <p style={{textAlign:"center",marginTop:12,fontSize:13}}>
          <span onClick={()=>setView("forgot")} style={{color:"#6B4226",fontWeight:700,cursor:"pointer"}}>¿Olvidaste tu clave?</span>
        </p>
        <p style={{textAlign:"center",marginTop:8,fontSize:14,color:"#AAA"}}>¿No tienes cuenta? <span onClick={()=>setView("register")} style={{color:"#6B4226",fontWeight:800,cursor:"pointer"}}>Regístrate</span></p>
        <p style={{textAlign:"center",marginTop:8}}><button onClick={()=>setView("menu")} style={{background:"none",border:"none",cursor:"pointer",color:"#CCC",fontSize:13}}>← Volver</button></p>
      </div>
    </div>
  );
}

/* ── FORGOT PASSWORD ── */
function ForgotPage({setView,cfg}){
  return(
    <div className="fu" style={{maxWidth:400,margin:"0 auto",paddingTop:16}}>
      <div className="card" style={{padding:32,textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:8}}>🔐</div>
        <h2 className="pac" style={{color:"#6B4226",fontSize:22,marginBottom:8}}>¿Olvidaste tu clave?</h2>
        <p style={{color:"#888",fontSize:14,marginBottom:24}}>Comunícate con el café y te generamos una clave temporal de inmediato.</p>
        <a href={`https://wa.me/503${(cfg.phone||"").replace(/\D/g,"")}?text=${encodeURIComponent("Hola! Olvidé mi clave de la app del café, ¿me pueden ayudar? 🙏")}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
          <button className="btn-green" style={{width:"100%",padding:"14px",fontSize:15}}>📱 Contactar al Café por WhatsApp</button>
        </a>
        <button onClick={()=>setView("login")} style={{marginTop:14,background:"none",border:"none",cursor:"pointer",color:"#6B4226",fontWeight:700,fontSize:13}}>← Volver al Login</button>
      </div>
    </div>
  );
}

/* ── CHANGE PASSWORD ── */
function ChangePassPage({user,changePassword,setView,notify}){
  const [f,setF]=useState({actual:"",nueva:"",confirmar:""});
  const [show,setShow]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const submit=async()=>{
    if(!f.actual||!f.nueva||!f.confirmar){setErr("Completa todos los campos");return;}
    if(f.actual!==user.clave){setErr("La clave actual es incorrecta");return;}
    if(f.nueva.length<6){setErr("La nueva clave debe tener al menos 6 caracteres");return;}
    if(f.nueva!==f.confirmar){setErr("Las claves nuevas no coinciden");return;}
    setLoading(true);setErr("");
    await changePassword(user.id,f.nueva);
    setLoading(false);
    notify("¡Clave cambiada exitosamente! 🔐");
    setView("menu");
  };
  return(
    <div className="fu" style={{maxWidth:400,margin:"0 auto",paddingTop:16}}>
      <div className="card" style={{padding:28}}>
        <div style={{textAlign:"center",marginBottom:22}}><div style={{fontSize:48,marginBottom:4}}>🔐</div><h2 className="pac" style={{color:"#6B4226",fontSize:22}}>Cambiar Clave</h2><p style={{color:"#AAA",fontSize:13,marginTop:4}}>Hola {user.nombre.split(" ")[0]}</p></div>
        {err&&<div style={{background:"#F6EAE3",border:"1.5px solid #E7C9B4",borderRadius:10,padding:"9px 13px",color:"#C0392B",fontSize:14,marginBottom:14,fontWeight:700}}>⚠️ {err}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <div style={{position:"relative"}}>
            <input className="inp" type={show?"text":"password"} placeholder="Clave actual" value={f.actual} onChange={e=>setF(p=>({...p,actual:e.target.value}))} style={{paddingRight:46}}/>
            <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9C7B5F"}}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button>
          </div>
          <input className="inp" type={show?"text":"password"} placeholder="Nueva clave (mínimo 6 caracteres)" value={f.nueva} onChange={e=>setF(p=>({...p,nueva:e.target.value}))}/>
          <input className="inp" type={show?"text":"password"} placeholder="Confirmar nueva clave" value={f.confirmar} onChange={e=>setF(p=>({...p,confirmar:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          <button className="btn-hot" onClick={submit} disabled={loading} style={{width:"100%",padding:"13px"}}>{loading?"Guardando...":"💾 Cambiar Clave"}</button>
        </div>
        <p style={{textAlign:"center",marginTop:14}}><button onClick={()=>setView("menu")} style={{background:"none",border:"none",cursor:"pointer",color:"#CCC",fontSize:13}}>← Cancelar</button></p>
      </div>
    </div>
  );
}

/* ── REGISTER ── */
function RegisterPage({registerUser,setView,notify}){
  const [f,setF]=useState({nombre:"",telefono:"",email:"",direccion:"",usuario:"",clave:""});
  const [show,setShow]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const up=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const submit=async()=>{const miss=["nombre","telefono","email","direccion","usuario","clave"].find(k=>!f[k]?.trim());if(miss){setErr("Completa todos los campos");return;}if(f.clave.length<6){setErr("Contraseña mínimo 6 caracteres");return;}setLoading(true);setErr("");const res=await registerUser(f);setLoading(false);if(res==="ok"){notify("¡Cuenta creada! 🎉");setView("menu");}else if(res==="usuario")setErr("Usuario ya en uso");else setErr("Email ya registrado");};
  return(
    <div className="fu" style={{maxWidth:460,margin:"0 auto",paddingTop:12}}>
      <div className="card" style={{padding:28}}>
        <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:48,marginBottom:4}}>👋</div><h2 className="pac" style={{color:"#6B4226",fontSize:22}}>Crear Cuenta</h2></div>
        {err&&<div style={{background:"#F6EAE3",border:"1.5px solid #E7C9B4",borderRadius:10,padding:"9px 13px",color:"#C0392B",fontSize:14,marginBottom:14,fontWeight:700}}>⚠️ {err}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <input className="inp" placeholder="Nombre completo *" value={f.nombre} onChange={up("nombre")} style={{gridColumn:"1/-1"}}/>
          <input className="inp" placeholder="Teléfono *" value={f.telefono} onChange={up("telefono")}/>
          <input className="inp" placeholder="Email *" type="email" value={f.email} onChange={up("email")}/>
          <input className="inp" placeholder="Dirección *" value={f.direccion} onChange={up("direccion")} style={{gridColumn:"1/-1"}}/>
          <input className="inp" placeholder="Usuario *" value={f.usuario} onChange={up("usuario")}/>
          <div style={{position:"relative"}}>
            <input className="inp" type={show?"text":"password"} placeholder="Contraseña *" value={f.clave} onChange={up("clave")} style={{paddingRight:44}} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9C7B5F"}}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button>
          </div>
        </div>
        <button className="btn-hot" onClick={submit} disabled={loading} style={{width:"100%",padding:"13px"}}>{loading?"Creando cuenta...":"Crear Cuenta 🎉"}</button>
        <p style={{textAlign:"center",marginTop:14,fontSize:14,color:"#AAA"}}>¿Ya tienes cuenta? <span onClick={()=>setView("login")} style={{color:"#6B4226",fontWeight:800,cursor:"pointer"}}>Inicia sesión</span></p>
      </div>
    </div>
  );
}

/* ── ORDER PAGE ── */
function OrderPage({cart,setCart,user,cfg,menus,placeOrder,setView,notify}){
  const [tipo,setTipo]=useState(""); // "domicilio" | "reserva"
  const [time,setTime]=useState("");
  const [addr,setAddr]=useState(user?.direccion||"");
  const [notes,setNotes]=useState("");
  const [sent,setSent]=useState(null);
  const [loading,setLoading]=useState(false);
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const count=cart.reduce((s,i)=>s+i.qty,0);
  const remove=id=>setCart(cart.filter(c=>c.id!==id));
  const changeQty=(id,q)=>{if(q<1)remove(id);else setCart(cart.map(c=>c.id===id?{...c,qty:q}:c));};
  const checkout=async()=>{
    if(!tipo){notify("Selecciona si es a domicilio o recoger en tienda",true);return;}
    if(tipo==="domicilio"&&!time){notify("Selecciona un horario de entrega",true);return;}
    if(tipo==="domicilio"&&!addr.trim()){notify("Ingresa la dirección de entrega",true);return;}
    if(cart.length===0){notify("El carrito está vacío",true);return;}
    setLoading(true);
    const o=await placeOrder({items:cart,tipo,deliveryTime:tipo==="domicilio"?time:"En el local",address:tipo==="domicilio"?addr:"Recoger en tienda",notes,total,phone:user.telefono,email:user.email});
    setCart([]);setSent(o);setLoading(false);
  };
  if(sent) return(
    <div className="fu" style={{maxWidth:460,margin:"0 auto",paddingTop:16}}>
      <div className="card" style={{padding:32,textAlign:"center"}}>
        <div className="pop" style={{fontSize:72,marginBottom:8}}>🎉</div>
        <h2 className="pac" style={{color:"#2D5016",fontSize:24,marginBottom:6}}>¡Pedido Registrado!</h2>
        <p style={{color:"#666",marginBottom:4}}>Pedido <strong style={{color:"#6B4226"}}>#{sent.id.slice(-6).toUpperCase()}</strong></p>
        <p style={{fontWeight:700,color:"#2B1B12",marginBottom:4}}>{sent.tipo==="reserva"?"☕ Recoger en la tienda":"🚗 Entrega a domicilio"}</p>
        <p style={{fontWeight:700,color:"#2B1B12",marginBottom:20}}>⏰ {sent.tipo==="reserva"?"Hora de recogida":"Entrega"}: <span style={{color:"#6B4226"}}>{sent.tipo==="reserva"?"En el local":sent.deliveryTime}</span></p>
        <div style={{background:"#F8FFF9",border:"1.5px solid #C3E6CB",borderRadius:14,padding:"12px 16px",marginBottom:20,textAlign:"left"}}>
          {(sent.items||[]).map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:14,padding:"3px 0"}}><span>{it.emoji} {it.qty}x {it.name}</span><span style={{fontWeight:800}}>{fmt$(it.price*it.qty)}</span></div>)}
          <div style={{borderTop:"1px dashed #C3E6CB",marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:900}}><span>Total</span><span style={{color:"#6B4226"}}>{fmt$(sent.total)}</span></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <a href={`https://wa.me/503${(cfg?.phone||"").replace(/\D/g,"")}?text=${encodeURIComponent(`Hola! Soy ${sent.userName}, pedido #${sent.id.slice(-6).toUpperCase()} para las ${sent.deliveryTime}. Total: ${fmt$(sent.total)}`)}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
            <button className="btn-green" style={{width:"100%",padding:"13px"}}>📱 Confirmar por WhatsApp</button>
          </a>
          <button onClick={()=>setView("my-orders")} className="btn-out" style={{width:"100%"}}>Ver Mis Pedidos</button>
          <button onClick={()=>setView("menu")} style={{background:"none",border:"none",cursor:"pointer",color:"#6B4226",fontWeight:700,fontSize:14}}>← Volver al Menú</button>
        </div>
      </div>
    </div>
  );
  return(
    <div className="fu" style={{maxWidth:520,margin:"0 auto",paddingTop:8}}>
      <h2 className="pac" style={{color:"#6B4226",fontSize:22,marginBottom:16}}>🛒 Tu Pedido</h2>
      {cart.length===0?(
        <div className="card" style={{padding:44,textAlign:"center"}}><div style={{fontSize:54}}>🛒</div><p style={{color:"#AAA",marginTop:10,fontSize:15}}>Tu carrito está vacío</p><button onClick={()=>setView("menu")} className="btn-hot" style={{marginTop:18}}>Ver Menú</button></div>
      ):(
        <>
          <div className="card" style={{padding:16,marginBottom:14}}>
            {cart.map(item=>(
              <div key={item.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px dashed #E4D2BE"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}><span style={{fontSize:24,flexShrink:0}}>{item.emoji||"🍴"}</span><div style={{minWidth:0}}><div style={{fontWeight:700,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div><div style={{color:"#6B4226",fontWeight:900,fontSize:14}}>{fmt$(item.price)}</div></div></div>
                <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
                  <button onClick={()=>changeQty(item.id,item.qty-1)} style={{width:27,height:27,borderRadius:"50%",border:"2px solid #6B4226",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#6B4226"}}><Minus size={12}/></button>
                  <span style={{fontWeight:900,minWidth:18,textAlign:"center"}}>{item.qty}</span>
                  <button onClick={()=>changeQty(item.id,item.qty+1)} style={{width:27,height:27,borderRadius:"50%",background:"linear-gradient(135deg,#6B4226,#A9746E)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={12} color="white"/></button>
                  <button onClick={()=>remove(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#DDD",marginLeft:2}}><X size={16}/></button>
                </div>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",paddingTop:12,fontWeight:900,fontSize:16}}><span>Total ({count} ítems)</span><span style={{color:"#6B4226"}}>{fmt$(total)}</span></div>
          </div>
          <div className="card" style={{padding:18,marginBottom:14}}>
            <h3 style={{fontWeight:800,marginBottom:14,color:"#2B1B12",fontSize:15}}>📋 Tipo de Pedido</h3>
            <div style={{display:"flex",gap:10,marginBottom:tipo?16:0}}>
              {[["domicilio","🚗 A Domicilio","#0C5460","#D1ECF1"],["reserva","☕ Recoger en Tienda","#856404","#FFF3CD"]].map(([v,l,c,bg])=>(
                <button key={v} onClick={()=>{setTipo(v);if(v==="reserva")setTime("");}} style={{flex:1,padding:"12px 8px",borderRadius:14,border:`2.5px solid ${tipo===v?c:"#E4D2BE"}`,background:tipo===v?bg:"white",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:13,color:tipo===v?c:"#888",cursor:"pointer",transition:"all .15s"}}>{l}</button>
              ))}
            </div>
            {tipo==="domicilio"&&<>
              <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:700,color:"#AAA",display:"block",marginBottom:8}}>⏰ Horario de Entrega *</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {DELIVERY_TIMES.map(t=>{const past=isTimePast(t);return(<button key={t} onClick={()=>!past&&setTime(t)} className="chip" style={{borderColor:time===t?"#6B4226":past?"#EEE":"#E4D2BE",background:time===t?"#6B4226":past?"#F5F5F5":"white",color:time===t?"white":past?"#CCC":"#888",cursor:past?"not-allowed":"pointer",textDecoration:past?"line-through":"none"}}>{t}</button>);})}
                </div>
              </div>
              <div style={{marginBottom:12}}><label style={{fontSize:13,fontWeight:700,color:"#AAA",display:"block",marginBottom:5}}>📍 Dirección de Entrega *</label><textarea className="inp" value={addr} onChange={e=>setAddr(e.target.value)} placeholder="Colonia, calle, número de casa..." rows={2} style={{resize:"vertical"}}/></div>
            </>}
            {tipo==="reserva"&&<div style={{background:"#FFF3CD",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#856404",fontWeight:700,marginBottom:12}}>☕ Tu pedido estará listo para cuando lo recojas en tienda</div>}
            <div><label style={{fontSize:13,fontWeight:700,color:"#AAA",display:"block",marginBottom:5}}>💬 Notas (opcional)</label><input className="inp" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Instrucciones especiales..."/></div>
          </div>
          <button className="btn-hot" onClick={checkout} disabled={loading} style={{width:"100%",padding:"15px",fontSize:16}}>{loading?"Enviando pedido...":"✅ Confirmar Pedido"}</button>
          <button onClick={()=>setView("menu")} className="btn-out" style={{width:"100%",marginTop:10}}>← Seguir viendo el menú</button>
        </>
      )}
    </div>
  );
}

/* ── ADMIN LOGIN ── */
function AdminLogin({loginAdmin,setView,notify}){
  const [f,setF]=useState({u:"",p:""});
  const [err,setErr]=useState("");
  const [show,setShow]=useState(false);
  const submit=async()=>{if(!f.u||!f.p){setErr("Completa los campos");return;}const ok=await loginAdmin(f.u,f.p);if(!ok)setErr("Credenciales incorrectas");else notify("Bienvenido ⚙️");};
  return(
    <div className="fu" style={{maxWidth:360,margin:"0 auto",paddingTop:20}}>
      <div className="card" style={{padding:28}}>
        <div style={{textAlign:"center",marginBottom:20}}><div style={{width:64,height:64,background:"linear-gradient(135deg,#2B1B12,#4A2E1D)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 8px"}}>⚙️</div><h2 className="pac" style={{color:"#6B4226",fontSize:22}}>Administrador</h2></div>
        {err&&<div style={{background:"#F6EAE3",border:"1.5px solid #E7C9B4",borderRadius:10,padding:"9px 13px",color:"#C0392B",fontSize:14,marginBottom:12,fontWeight:700}}>⚠️ {err}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <input className="inp" placeholder="Usuario" value={f.u} autoComplete="off" onChange={e=>setF(p=>({...p,u:e.target.value}))}/>
          <div style={{position:"relative"}}>
            <input className="inp" type={show?"text":"password"} placeholder="Contraseña" value={f.p} autoComplete="new-password" onChange={e=>setF(p=>({...p,p:e.target.value}))} style={{paddingRight:44}} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9C7B5F"}}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button>
          </div>
          <button className="btn-hot" onClick={submit} style={{width:"100%"}}>Ingresar al Panel</button>
        </div>
        <p style={{textAlign:"center",marginTop:14}}><button onClick={()=>setView("menu")} style={{background:"none",border:"none",cursor:"pointer",color:"#6B4226",fontWeight:700,fontSize:13}}>← Volver al menú</button></p>
      </div>
    </div>
  );
}

/* ── ADMIN PANEL ── */
function AdminPanel(props){
  const [tab,setTab]=useState("pedidos");
  const pending=(props.orders||[]).filter(o=>o.status==="pendiente").length;
  const tabs=[["pedidos","📦 Pedidos",pending],["menu","☕ Menú",null],["antojitos","🌟 Especiales",null],["reportes","📊 Reportes",null],["clientes","👥 Clientes",null],["config","⚙️ Config",null]];
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <h2 className="pac" style={{color:"#6B4226",fontSize:22}}>Panel de Administración</h2>
        {pending>0&&<span style={{background:"#6B4226",color:"white",padding:"5px 14px",borderRadius:99,fontSize:13,fontWeight:800}}>🔔 {pending} nuevo{pending>1?"s":""}</span>}
      </div>
      <div style={{borderBottom:"2.5px solid #E4D2BE",marginBottom:20,display:"flex",gap:2,overflowX:"auto"}}>
        {tabs.map(([k,l,badge])=>(
          <button key={k} className={`tab-btn${tab===k?" on":""}`} onClick={()=>setTab(k)} style={{position:"relative"}}>
            {l}{badge>0&&<span style={{position:"absolute",top:4,right:2,background:"#6B4226",color:"white",width:16,height:16,borderRadius:"50%",fontSize:10,fontWeight:900,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{badge}</span>}
          </button>
        ))}
      </div>
      {tab==="pedidos"   && <AdminOrders    {...props}/>}
      {tab==="menu"      && <AdminMenu      menus={props.menus} saveMenuDay={props.saveMenuDay} catalog={props.catalog} saveCatalog={props.saveCatalog} notify={props.notify}/>}
      {tab==="antojitos" && <AdminAntojitos {...props}/>}
      {tab==="reportes"  && <AdminReportes  orders={props.orders} archiveOrders={props.archiveOrders} />}
      {tab==="clientes"  && <AdminClientes  {...props}/>}
      {tab==="config"    && <AdminConfig    {...props}/>}
    </div>
  );
}

/* ── ADMIN ORDERS ── */
function AdminOrders({orders,updateStatus,notify}){
  const [filter,setFilter]=useState("todos");
  const [vista,setVista]=useState("horarios"); // "horarios" | "reservas" | "resumen"
  const all=orders||[];
  const domicilio=all.filter(o=>o.tipo!=="reserva");
  const reservas=all.filter(o=>o.tipo==="reserva");
  const filtered=(vista==="reservas"?reservas:domicilio).filter(o=>filter==="todos"||o.status===filter);
  const stats={
    total:all.filter(o=>o.status!=="cancelado").length,
    pendiente:all.filter(o=>o.status==="pendiente").length,
    reservas:reservas.filter(o=>o.status!=="cancelado").length,
    ingresos:all.filter(o=>o.status!=="cancelado").reduce((s,o)=>s+(o.total||0),0)
  };
  const productosPendientes={};
  all.filter(o=>o.status==="pendiente").forEach(o=>{
    (o.items||[]).forEach(it=>{
      if(!productosPendientes[it.name])productosPendientes[it.name]={qty:0,emoji:it.emoji};
      productosPendientes[it.name].qty+=it.qty||1;
    });
  });
  const resumenProductos=Object.entries(productosPendientes).sort((a,b)=>b[1].qty-a[1].qty);
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,marginBottom:16}}>
        {[{label:"Total",val:stats.total,c:"#6B4226",e:"📦"},{label:"Pendientes",val:stats.pendiente,c:"#856404",e:"⏳"},{label:"Reservas",val:stats.reservas,c:"#0C5460",e:"☕"},{label:"Ingresos",val:fmt$(stats.ingresos),c:"#155724",e:"💵"}].map((s,i)=>(
          <div key={i} className="card" style={{padding:"14px 10px",textAlign:"center"}}><div style={{fontSize:26}}>{s.e}</div><div style={{fontWeight:900,fontSize:20,color:s.c,marginTop:4,lineHeight:1}}>{s.val}</div><div style={{fontSize:11,color:"#AAA",fontWeight:700,marginTop:2}}>{s.label}</div></div>
        ))}
      </div>
      <div style={{display:"flex",gap:4,marginBottom:14,background:"#F3E9DD",borderRadius:14,padding:4}}>
        {[["horarios","🚗 A Domicilio"],["reservas","☕ Recoger en Tienda"],["resumen","📊 Resumen Productos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setVista(v)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"none",background:vista===v?"white":"transparent",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:12,color:vista===v?"#6B4226":"#9C7B5F",cursor:"pointer",boxShadow:vista===v?"0 2px 8px rgba(0,0,0,.08)":"none"}}>{l}</button>
        ))}
      </div>
      {vista==="resumen"&&(
        <div>
          <div style={{fontWeight:800,fontSize:14,color:"#2B1B12",marginBottom:12}}>📊 Productos Pendientes de Preparar</div>
          {resumenProductos.length===0?(
            <div className="card" style={{padding:36,textAlign:"center"}}><div style={{fontSize:44}}>✅</div><p style={{color:"#AAA",marginTop:10}}>No hay productos pendientes</p></div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {resumenProductos.map(([name,d])=>(
                <div key={name} className="card" style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:14,border:"1.5px solid #FFF3CD"}}>
                  <span style={{fontSize:32}}>{d.emoji||"☕"}</span>
                  <div style={{flex:1}}><div style={{fontWeight:800,fontSize:15,color:"#2B1B12"}}>{name}</div><div style={{fontSize:12,color:"#AAA",marginTop:2}}>Pedidos pendientes</div></div>
                  <div style={{background:"linear-gradient(135deg,#6B4226,#A9746E)",color:"white",borderRadius:12,padding:"8px 18px",fontWeight:900,fontSize:22}}>{d.qty}</div>
                </div>
              ))}
              <div style={{background:"linear-gradient(135deg,#2B1B12,#4A2E1D)",borderRadius:14,padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",color:"white"}}>
                <span style={{fontWeight:800,fontSize:14}}>Total productos a preparar</span>
                <span style={{fontWeight:900,fontSize:22}}>{resumenProductos.reduce((s,[,d])=>s+d.qty,0)}</span>
              </div>
            </div>
          )}
        </div>
      )}
      {vista!=="resumen"&&<>
        <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          {["todos","pendiente","enviado","cancelado"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className="chip" style={{borderColor:filter===f?"#6B4226":"#E4D2BE",background:filter===f?"#6B4226":"white",color:filter===f?"white":"#888"}}>
              {f==="todos"?"Todos":STATUS_INFO[f]?.label||f}
            </button>
          ))}
          <button onClick={()=>setFilter("todos")} style={{background:"none",border:"none",cursor:"pointer",color:"#CCC",marginLeft:"auto"}}><RefreshCw size={15}/></button>
        </div>
        {vista==="reservas"&&(filtered.length===0?(
          <div className="card" style={{padding:36,textAlign:"center"}}><div style={{fontSize:44}}>📭</div><p style={{color:"#AAA",marginTop:10}}>No hay reservas</p></div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[...filtered].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(o=><OrderCard key={o.id} order={o} updateStatus={updateStatus} notify={notify}/>)}
          </div>
        ))}
        {vista==="horarios"&&(filtered.length===0?(
          <div className="card" style={{padding:36,textAlign:"center"}}><div style={{fontSize:44}}>📭</div><p style={{color:"#AAA",marginTop:10}}>No hay pedidos {filter!=="todos"?"en este estado":""}</p></div>
        ):(()=>{
          const porHorario={};
          [...filtered].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).forEach(o=>{
            const h=o.deliveryTime||"Sin horario";
            if(!porHorario[h])porHorario[h]=[];
            porHorario[h].push(o);
          });
          const grupos=[...DELIVERY_TIMES,"Sin horario"].filter(h=>porHorario[h]);
          return(
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {grupos.map(horario=>{
                const pedidos=porHorario[horario];
                const subtotal=pedidos.filter(o=>o.status!=="cancelado").reduce((s,o)=>s+(o.total||0),0);
                const productosHora={};
                pedidos.filter(o=>o.status!=="cancelado").forEach(o=>{
                  (o.items||[]).forEach(it=>{
                    if(!productosHora[it.name])productosHora[it.name]={qty:0,emoji:it.emoji};
                    productosHora[it.name].qty+=it.qty||1;
                  });
                });
                const sorted=[...pedidos].sort((a,b)=>{
                  const aP=(a.items||[])[0]?.name||"";
                  const bP=(b.items||[])[0]?.name||"";
                  return aP.localeCompare(bP);
                });
                return(
                  <div key={horario}>
                    <div style={{padding:"10px 14px",background:"linear-gradient(135deg,#F3E9DD,#FBF5EC)",borderRadius:12,border:"1.5px solid #E4D2BE",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:Object.keys(productosHora).length>0?8:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:16}}>⏰</span>
                          <span style={{fontWeight:900,fontSize:15,color:"#6B4226"}}>{horario}</span>
                          <span style={{background:"#6B4226",color:"white",borderRadius:99,padding:"2px 10px",fontSize:12,fontWeight:800}}>{pedidos.length} pedido{pedidos.length!==1?"s":""}</span>
                        </div>
                        <span style={{fontWeight:900,color:"#155724",fontSize:14}}>{fmt$(subtotal)}</span>
                      </div>
                      {Object.keys(productosHora).length>0&&(
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {Object.entries(productosHora).map(([name,d])=>(
                            <span key={name} style={{background:"white",border:"1.5px solid #E4D2BE",borderRadius:99,padding:"3px 10px",fontSize:12,fontWeight:700,color:"#6B4226",display:"flex",alignItems:"center",gap:4}}>
                              {d.emoji} {name} <span style={{background:"#6B4226",color:"white",borderRadius:99,padding:"1px 7px",fontSize:11,fontWeight:900}}>{d.qty}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>{sorted.map(o=><OrderCard key={o.id} order={o} updateStatus={updateStatus} notify={notify}/>)}</div>
                  </div>
                );
              })}
            </div>
          );
        })())}
      </>}
    </div>
  );
}
function OrderCard({order:o,updateStatus,notify}){
  const [open,setOpen]=useState(false);
  const [confirmCancel,setConfirmCancel]=useState(false);
  const esReserva=o.tipo==="reserva";
  const info={...STATUS_INFO[o.status]||{}};
  if(esReserva&&o.status==="enviado")info.label="✅ Servido";
  const next=STATUS_NEXT[o.status];
  const timeStr=new Date(o.createdAt).toLocaleString("es-SV",{hour:"2-digit",minute:"2-digit",month:"short",day:"numeric"});
  const canCancel=o.status==="pendiente"||o.status==="enviado";
  return(
    <div className="card" style={{overflow:"visible",border:o.status==="pendiente"?"1.5px solid #E7C9B4":o.status==="cancelado"?"1.5px solid #F8D7DA":"none"}}>
      <div onClick={()=>setOpen(v=>!v)} style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:o.status==="cancelado"?"#F8D7DA":"linear-gradient(135deg,#6B4226,#C89B3C)",display:"flex",alignItems:"center",justifyContent:"center",color:o.status==="cancelado"?"#721C24":"white",fontWeight:900,fontSize:11,flexShrink:0}}>#{o.id.slice(-4).toUpperCase()}</div>
          <div><div style={{fontWeight:800,fontSize:14,display:"flex",alignItems:"center",gap:6}}>{o.userName}{esReserva&&<span style={{background:"#FFF3CD",color:"#856404",borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:800}}>☕ Recoger</span>}</div><div style={{fontSize:12,color:"#AAA"}}>⏰ {esReserva?"En el local":o.deliveryTime} · {timeStr}</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
          <span style={{fontWeight:900,color:"#6B4226",fontSize:15}}>{fmt$(o.total)}</span>
          <span style={{background:info.bg,color:info.color,padding:"4px 11px",borderRadius:99,fontSize:12,fontWeight:800}}>{info.label}</span>
          <ChevronDown size={15} style={{color:"#CCC",transform:open?"rotate(180deg)":"",transition:"transform .2s"}}/>
        </div>
      </div>
      {open&&(
        <div className="fu" style={{borderTop:"1px solid #FFF0E8",padding:"14px 16px",background:"#FBF6EF"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12,fontSize:13}}>
            <div style={{color:"#555"}}><span style={{color:"#AAA"}}>📍 </span>{o.address}</div>
            <div style={{color:"#555"}}><span style={{color:"#AAA"}}>📞 </span>{o.phone}</div>
            {o.notes&&<div style={{gridColumn:"1/-1",color:"#555"}}><span style={{color:"#AAA"}}>💬 </span>{o.notes}</div>}
          </div>
          <div style={{background:"white",borderRadius:12,padding:"10px 12px",marginBottom:12}}>
            {(o.items||[]).map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:14}}><span>{it.emoji} {it.qty}x {it.name}</span><span style={{fontWeight:800}}>{fmt$(it.price*it.qty)}</span></div>)}
            <div style={{borderTop:"1px dashed #E4D2BE",marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:900}}><span>Total</span><span style={{color:"#6B4226"}}>{fmt$(o.total)}</span></div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {next&&o.status!=="cancelado"&&<button className="btn-hot" style={{padding:"9px 18px",fontSize:13}} onClick={async()=>{await updateStatus(o.id,next);notify("Estado actualizado ✅");}}>{esReserva&&next==="enviado"?"✅ Servido":STATUS_INFO[next]?.label} →</button>}
            <a href={`https://wa.me/503${(o.phone||"").replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${o.userName}! 👋\nPedido #${o.id.slice(-6).toUpperCase()}: ${info.label}\nEntrega: ${o.deliveryTime}\n¡Gracias!`)}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
              <button className="btn-green" style={{padding:"9px 16px",fontSize:13}}>📱 WhatsApp</button>
            </a>
            {canCancel&&!confirmCancel&&<button className="btn-red" style={{marginLeft:"auto"}} onClick={()=>setConfirmCancel(true)}><Ban size={14}/>Cancelar</button>}
            {confirmCancel&&<div style={{display:"flex",gap:6,alignItems:"center",marginLeft:"auto",flexWrap:"wrap"}}>
              <span style={{fontSize:13,color:"#C0392B",fontWeight:700}}>¿Confirmar?</span>
              <button className="btn-red" onClick={async()=>{await updateStatus(o.id,"cancelado");setConfirmCancel(false);notify("Pedido cancelado");}}>Sí</button>
              <button className="btn-out" style={{padding:"7px 14px",fontSize:13}} onClick={()=>setConfirmCancel(false)}>No</button>
            </div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ADMIN MENU ── */
function AdminMenu({menus,saveMenuDay,catalog,saveCatalog,notify}){
  const todayKey=dateKey();
  const todayMenu=(menus||{})[todayKey]||null;
  const [mensaje,setMensaje]=useState(todayMenu?.message||"¡LINDO DÍA, DISFRUTA TU CAFÉ! ☕");
  const [activo,setActivo]=useState(todayMenu?.active??true);
  const [selectedIds,setSelectedIds]=useState(()=>todayMenu?(todayMenu.items||[]).map(i=>i.id):(catalog||[]).map(i=>i.id));
  const [seccion,setSeccion]=useState(1);
  const [newItem,setNewItem]=useState({cat:"calientes",name:"",emoji:"☕",price:""});
  const [saving,setSaving]=useState(false);
  const isSelected=id=>selectedIds.includes(id);
  const toggleItem=id=>setSelectedIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const grouped={};(catalog||[]).forEach(i=>{if(!grouped[i.cat])grouped[i.cat]=[];grouped[i.cat].push(i);});
  const saveMenu=async()=>{
    const items=(catalog||[]).filter(i=>selectedIds.includes(i.id));
    const menuData={date:nowDate(),active:activo,message:mensaje,items};
    setSaving(true);await saveMenuDay(todayKey,menuData);setSaving(false);
    notify("Menú del día guardado ✅");
  };
  const addToCatalog=()=>{
    if(!newItem.name.trim()){notify("El nombre es requerido",true);return;}
    if(newItem.price===""){notify("El precio es requerido",true);return;}
    const item={...newItem,id:uid(),price:parseFloat(newItem.price)||0};
    saveCatalog([...(catalog||[]),item]);
    setSelectedIds(prev=>[...prev,item.id]);
    setNewItem(p=>({...p,name:"",price:""}));notify("Producto agregado ✅");
  };
  const removeFromCatalog=id=>{saveCatalog((catalog||[]).filter(i=>i.id!==id));setSelectedIds(prev=>prev.filter(x=>x!==id));notify("Producto eliminado");};
  return(
    <div>
      <div style={{display:"flex",gap:4,marginBottom:18,background:"#F3E9DD",borderRadius:14,padding:4}}>
        {[[1,"📋 Menú de Hoy"],[2,"🗂️ Catálogo"],[3,"➕ Agregar Nuevo"]].map(([n,l])=>(
          <button key={n} onClick={()=>setSeccion(n)} style={{flex:1,padding:"9px 6px",borderRadius:10,border:"none",background:seccion===n?"white":"transparent",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:13,color:seccion===n?"#6B4226":"#9C7B5F",cursor:"pointer",boxShadow:seccion===n?"0 2px 8px rgba(0,0,0,.08)":"none"}}>{l}</button>
        ))}
      </div>
      {seccion===1&&(
        <div>
          <div className="card" style={{padding:18,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
              <div><div style={{fontSize:12,fontWeight:700,color:"#AAA",marginBottom:3}}>📅 Hoy</div><div style={{fontWeight:800,fontSize:15,color:"#2B1B12",textTransform:"capitalize"}}>{nowDate()}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:13,fontWeight:700,color:activo?"#2D5016":"#AAA"}}>{activo?"✅ Activo":"⭕ Inactivo"}</span>
                <button onClick={()=>setActivo(v=>!v)} style={{background:activo?"#2D5016":"#999",border:"none",borderRadius:99,padding:"8px 18px",color:"white",fontFamily:"'Nunito',sans-serif",fontWeight:700,cursor:"pointer",fontSize:13}}>{activo?"Desactivar":"Activar"}</button>
              </div>
            </div>
            <label style={{fontSize:12,fontWeight:700,color:"#AAA",display:"block",marginBottom:5}}>💬 Mensaje del día</label>
            <input className="inp" value={mensaje} onChange={e=>setMensaje(e.target.value)} placeholder="¡LINDO DÍA, DISFRUTA TU CAFÉ! ☕"/>
            {!todayMenu&&<div style={{marginTop:10,background:"#FFF3CD",borderRadius:10,padding:"8px 12px",fontSize:12,color:"#856404",fontWeight:700}}>⚠️ Sin menú para hoy. Selecciona productos y guarda.</div>}
            {todayMenu&&<div style={{marginTop:10,background:"#D4EDDA",borderRadius:10,padding:"8px 12px",fontSize:12,color:"#155724",fontWeight:700}}>✅ Menú guardado · Se desactiva automáticamente a las 6:00 PM</div>}
          </div>
          <div className="card" style={{padding:16,marginBottom:14}}>
            <div style={{fontWeight:800,fontSize:13,color:"#9C7B5F",marginBottom:12}}>Productos del menú de hoy</div>
            {CAT_ORDER.map(cat=>{const selItems=(catalog||[]).filter(i=>i.cat===cat&&isSelected(i.id));if(!selItems.length)return null;return(
              <div key={cat} style={{marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:1.2,color:"#9C7B5F",marginBottom:6}}>{CAT_LABELS[cat]}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {selItems.map(it=><span key={it.id} style={{background:"#F3E9DD",border:"1.5px solid #E4D2BE",borderRadius:99,padding:"4px 12px",fontSize:13,fontWeight:700,color:"#6B4226",display:"flex",alignItems:"center",gap:5}}>
                    {it.emoji} {it.name}<span style={{fontSize:11,opacity:.8}}> · {fmt$(it.price)}</span>
                    <button onClick={()=>toggleItem(it.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#E0B49A",padding:"0 0 0 2px",fontSize:12}}>✕</button>
                  </span>)}
                </div>
              </div>
            );})}
            {selectedIds.length===0&&<p style={{color:"#AAA",fontSize:13}}>Ve al Catálogo para seleccionar productos</p>}
            <button onClick={()=>setSeccion(2)} className="btn-out" style={{width:"100%",padding:"10px",fontSize:13,marginTop:12}}>+ Seleccionar del Catálogo</button>
          </div>
          <button onClick={saveMenu} disabled={saving} className="btn-hot" style={{width:"100%",padding:"14px",fontSize:16}}>{saving?"Guardando...":"💾 Guardar Menú del Día"}</button>
        </div>
      )}
      {seccion===2&&(
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div><div style={{fontWeight:800,fontSize:15}}>Catálogo de Productos</div><div style={{fontSize:12,color:"#AAA",marginTop:2}}>Selecciona los del menú de hoy</div></div>
            <button onClick={()=>setSeccion(3)} className="btn-hot" style={{padding:"8px 16px",fontSize:13}}>+ Agregar Nuevo</button>
          </div>
          {CAT_ORDER.map(cat=>{const items=(catalog||[]).filter(i=>i.cat===cat);if(!items.length)return null;return(
            <div key={cat} style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:1.3,color:"#9C7B5F",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                {CAT_LABELS[cat]}
              </div>
              {items.map(it=>{const sel=isSelected(it.id);return(
                <div key={it.id} className="card" style={{padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7,border:sel?"1.5px solid #6B4226":"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}><span style={{fontSize:24}}>{it.emoji}</span><div><div style={{fontWeight:700,fontSize:14}}>{it.name}</div><div style={{color:"#6B4226",fontWeight:800,fontSize:13}}>{fmt$(it.price)}</div></div></div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <button onClick={()=>toggleItem(it.id)} style={{width:32,height:32,borderRadius:"50%",border:`2.5px solid ${sel?"#6B4226":"#E4D2BE"}`,background:sel?"#6B4226":"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {sel&&<span style={{color:"white",fontSize:14,fontWeight:900}}>✓</span>}
                    </button>
                    <button onClick={()=>removeFromCatalog(it.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#E0B49A",padding:4}}><Trash2 size={15}/></button>
                  </div>
                </div>
              );})}
            </div>
          );})}
          <button onClick={()=>{setSeccion(1);saveMenu();}} className="btn-hot" style={{width:"100%",padding:"13px",fontSize:15}}>💾 Guardar selección en Menú de Hoy</button>
        </div>
      )}
      {seccion===3&&(
        <div>
          <div style={{fontWeight:800,fontSize:15,marginBottom:4}}>Agregar Nuevo Producto al Catálogo</div>
          <div style={{fontSize:12,color:"#AAA",marginBottom:16}}>Queda disponible para usarlo en cualquier día</div>
          <div className="card" style={{padding:18,border:"2px dashed #E4D2BE"}}>
            <div style={{display:"grid",gridTemplateColumns:"130px 1fr 52px 80px",gap:8,marginBottom:10}}>
              <select className="inp" value={newItem.cat} onChange={e=>setNewItem(p=>({...p,cat:e.target.value}))}>
                {CAT_ORDER.map(c=><option key={c} value={c}>{CAT_LABELS[c]?.split(" ").slice(1).join(" ")||c}</option>)}
              </select>
              <input className="inp" placeholder="Nombre del producto" value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addToCatalog()}/>
              <select className="inp" value={newItem.emoji} onChange={e=>setNewItem(p=>({...p,emoji:e.target.value}))} style={{textAlign:"center"}}>
                {FOOD_EMOJIS.map(e=><option key={e} value={e}>{e}</option>)}
              </select>
              <input className="inp" placeholder="$0.00" type="number" step="0.05" min="0" value={newItem.price} onChange={e=>setNewItem(p=>({...p,price:e.target.value}))}/>
            </div>
            <button onClick={addToCatalog} className="btn-hot" style={{width:"100%",padding:"12px"}}>+ Agregar al Catálogo</button>
          </div>
          <button onClick={()=>setSeccion(2)} className="btn-out" style={{width:"100%",padding:"11px",fontSize:13,marginTop:10}}>← Volver al Catálogo</button>
        </div>
      )}
    </div>
  );
}

/* ── ADMIN REPORTES ── */
function AdminReportes({orders,archiveOrders}){
  const today=dateKey();
  const [desde,setDesde]=useState(today);
  const [hasta,setHasta]=useState(today);
  const [modo,setModo]=useState("resumen");
  const [vista,setVista]=useState("actual"); // "actual" | "historial"
  const [historialDia,setHistorialDia]=useState(dateKey(new Date(Date.now()-86400000)));
  const [historialPedidos,setHistorialPedidos]=useState([]);
  const [loadingHist,setLoadingHist]=useState(false);
  const [archivando,setArchivando]=useState(false);

  const cargarHistorial = async (dia) => {
    setLoadingHist(true);
    try {
      const { getDocs, collection, query: fquery, where } = await import("firebase/firestore");
      const { getFirestore } = await import("firebase/firestore");
      const fdb2 = getFirestore();
      const snap = await getDocs(collection(fdb2,"historial"));
      const pedidos = snap.docs
        .map(d=>({...d.data()}))
        .filter(p=>p.archivedAt===dia)
        .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
      setHistorialPedidos(pedidos);
    } catch(e){ console.error(e); }
    setLoadingHist(false);
  };

  const handleArchivar = async () => {
    if(!window.confirm("¿Archivar todos los pedidos de hoy y limpiar la pantalla? Esta acción no se puede deshacer.")) return;
    setArchivando(true);
    await archiveOrders();
    setArchivando(false);
  };
  const allOrders=orders||[];
  const inRange=o=>{const d=o.createdAt?.slice(0,10);return d>=desde&&d<=hasta;};
  const validos=allOrders.filter(o=>o.status!=="cancelado"&&inRange(o));
  const cancelados=allOrders.filter(o=>o.status==="cancelado"&&inRange(o));
  const todos=allOrders.filter(o=>inRange(o));
  const totalVentas=validos.reduce((s,o)=>s+(o.total||0),0);
  const totalPedidos=validos.length;
  const porFecha={};
  validos.forEach(o=>{const d=o.createdAt?.slice(0,10);if(!porFecha[d])porFecha[d]={pedidos:0,total:0};porFecha[d].pedidos++;porFecha[d].total+=o.total||0;});
  const itemsGlobal={};
  validos.forEach(o=>{(o.items||[]).forEach(it=>{if(!itemsGlobal[it.name])itemsGlobal[it.name]={qty:0,total:0,emoji:it.emoji};itemsGlobal[it.name].qty+=it.qty||1;itemsGlobal[it.name].total+=it.price*(it.qty||1);});});
  const topItems=Object.entries(itemsGlobal).sort((a,b)=>b[1].qty-a[1].qty);
  const fechasOrdenadas=Object.keys(porFecha).sort();
  const mismosDias=desde===hasta;
  return(
    <div>
      {/* Vista selector */}
      <div style={{display:"flex",gap:4,marginBottom:16,background:"#F3E9DD",borderRadius:14,padding:4}}>
        {[["actual","📊 Reporte Actual"],["historial","🗂️ Historial de Días"]].map(([v,l])=>(
          <button key={v} onClick={()=>setVista(v)} style={{flex:1,padding:"9px 6px",borderRadius:10,border:"none",background:vista===v?"white":"transparent",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:13,color:vista===v?"#6B4226":"#9C7B5F",cursor:"pointer",boxShadow:vista===v?"0 2px 8px rgba(0,0,0,.08)":"none"}}>{l}</button>
        ))}
      </div>

      {/* ── HISTORIAL ── */}
      {vista==="historial"&&(
        <div>
          <div className="card" style={{padding:16,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:12}}>
              <h3 style={{fontWeight:800,fontSize:15,color:"#6B4226",flex:1}}>🗂️ Historial por Día</h3>
              <button onClick={handleArchivar} disabled={archivando} style={{background:"#FFF3CD",border:"1.5px solid #E9C77B",borderRadius:10,padding:"7px 14px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:12,color:"#856404"}}>
                {archivando?"Archivando...":"📦 Archivar Pedidos de Hoy"}
              </button>
            </div>
            <p style={{fontSize:12,color:"#AAA",marginBottom:12}}>Selecciona un día para ver sus pedidos archivados. Los pedidos se archivan automáticamente a medianoche.</p>
            <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:160}}>
                <label style={{fontSize:12,fontWeight:700,color:"#AAA",display:"block",marginBottom:4}}>📅 Seleccionar día</label>
                <input className="inp" type="date" value={historialDia} max={dateKey(new Date(Date.now()-86400000))} onChange={e=>{setHistorialDia(e.target.value);setHistorialPedidos([]);}} style={{fontSize:13}}/>
              </div>
              <button onClick={()=>cargarHistorial(historialDia)} disabled={loadingHist} className="btn-hot" style={{padding:"12px 20px",fontSize:13}}>
                {loadingHist?"Cargando...":"🔍 Ver Pedidos"}
              </button>
            </div>
          </div>

          {historialPedidos.length===0&&!loadingHist&&(
            <div className="card" style={{padding:44,textAlign:"center"}}>
              <div style={{fontSize:52}}>🗂️</div>
              <p style={{color:"#AAA",marginTop:10}}>Selecciona un día y presiona "Ver Pedidos"</p>
            </div>
          )}

          {historialPedidos.length>0&&(
            <div>
              {/* Resumen del día */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,marginBottom:16}}>
                {[
                  {e:"📦",v:historialPedidos.filter(o=>o.status!=="cancelado").length,l:"Pedidos",c:"#6B4226"},
                  {e:"☕",v:historialPedidos.filter(o=>o.tipo==="reserva").length,l:"Recoger en tienda",c:"#0C5460"},
                  {e:"❌",v:historialPedidos.filter(o=>o.status==="cancelado").length,l:"Cancelados",c:"#721C24"},
                  {e:"💵",v:fmt$(historialPedidos.filter(o=>o.status!=="cancelado").reduce((s,o)=>s+(o.total||0),0)),l:"Total",c:"#155724"},
                ].map((s,i)=>(
                  <div key={i} className="card" style={{padding:"14px 10px",textAlign:"center"}}>
                    <div style={{fontSize:26}}>{s.e}</div>
                    <div style={{fontWeight:900,fontSize:20,color:s.c,marginTop:4,lineHeight:1}}>{s.v}</div>
                    <div style={{fontSize:11,color:"#AAA",fontWeight:700,marginTop:2}}>{s.l}</div>
                  </div>
                ))}
              </div>
              {/* Lista de pedidos */}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {historialPedidos.map((o,i)=>{
                  const info={...STATUS_INFO[o.status]||{}};
                  if(o.tipo==="reserva"&&o.status==="enviado")info.label="✅ Servido";
                  return(
                    <div key={i} className="card" style={{padding:"12px 16px",border:o.status==="cancelado"?"1.5px solid #F8D7DA":"none",opacity:o.status==="cancelado"?.7:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:36,height:36,borderRadius:"50%",background:o.status==="cancelado"?"#F8D7DA":"linear-gradient(135deg,#6B4226,#C89B3C)",display:"flex",alignItems:"center",justifyContent:"center",color:o.status==="cancelado"?"#721C24":"white",fontWeight:900,fontSize:11,flexShrink:0}}>#{(o.id||"").slice(-4).toUpperCase()}</div>
                          <div>
                            <div style={{fontWeight:800,fontSize:14}}>{o.userName}</div>
                            <div style={{fontSize:11,color:"#AAA"}}>⏰ {o.tipo==="reserva"?"En el local":o.deliveryTime} · {o.tipo==="reserva"?"☕ Recoger":"🚗 Domicilio"}</div>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontWeight:900,fontSize:15,color:o.status==="cancelado"?"#AAA":"#6B4226",textDecoration:o.status==="cancelado"?"line-through":"none"}}>{fmt$(o.total)}</div>
                          <span style={{background:info.bg,color:info.color,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:800}}>{info.label}</span>
                        </div>
                      </div>
                      <div style={{background:"#FBF5EC",borderRadius:10,padding:"8px 10px"}}>
                        {(o.items||[]).map((it,j)=><div key={j} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"2px 0"}}><span style={{color:"#555"}}>{it.emoji} {it.qty}x {it.name}</span><span style={{fontWeight:700}}>{fmt$(it.price*it.qty)}</span></div>)}
                        {o.address&&o.tipo!=="reserva"&&<div style={{fontSize:12,color:"#AAA",marginTop:3}}>📍 {o.address}</div>}
                        {o.notes&&<div style={{fontSize:12,color:"#AAA"}}>💬 {o.notes}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REPORTE ACTUAL ── */}
      {vista==="actual"&&<div>
      <div className="card" style={{padding:16,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:12}}>
          <h3 style={{fontWeight:800,fontSize:15,color:"#6B4226",flex:1}}>📊 Reporte de Ventas</h3>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[["Hoy",()=>{setDesde(today);setHasta(today);}],["7 días",()=>{const d=new Date();d.setDate(d.getDate()-6);setDesde(dateKey(d));setHasta(today);}],["Este mes",()=>{const n=new Date();setDesde(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-01`);setHasta(today);}]].map(([l,fn])=>(
              <button key={l} onClick={fn} style={{background:"#F3E9DD",border:"1.5px solid #E4D2BE",borderRadius:99,padding:"5px 13px",fontSize:12,fontWeight:700,color:"#6B4226",cursor:"pointer"}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{flex:1,minWidth:140}}><label style={{fontSize:12,fontWeight:700,color:"#AAA",display:"block",marginBottom:4}}>Desde</label><input className="inp" type="date" value={desde} onChange={e=>setDesde(e.target.value)} style={{fontSize:13}}/></div>
          <div style={{flex:1,minWidth:140}}><label style={{fontSize:12,fontWeight:700,color:"#AAA",display:"block",marginBottom:4}}>Hasta</label><input className="inp" type="date" value={hasta} onChange={e=>setHasta(e.target.value)} style={{fontSize:13}}/></div>
          <div style={{display:"flex",gap:6}}>{[["Resumen","resumen"],["Detalle","detalle"]].map(([l,v])=><button key={v} onClick={()=>setModo(v)} className="chip" style={{borderColor:modo===v?"#6B4226":"#E4D2BE",background:modo===v?"#6B4226":"white",color:modo===v?"white":"#888"}}>{l}</button>)}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,marginBottom:16}}>
        {[{e:"💵",v:fmt$(totalVentas),l:"Total Ventas",c:"#155724"},{e:"📦",v:totalPedidos,l:"Pedidos Válidos",c:"#6B4226"},{e:"📈",v:totalPedidos>0?fmt$(totalVentas/totalPedidos):"$0.00",l:"Ticket Promedio",c:"#0C5460"},{e:"❌",v:cancelados.length,l:"Cancelados",c:"#721C24"}].map((s,i)=>(
          <div key={i} className="card" style={{padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:28}}>{s.e}</div><div style={{fontWeight:900,fontSize:22,color:s.c,marginTop:4,lineHeight:1}}>{s.v}</div><div style={{fontSize:11,color:"#AAA",fontWeight:700,marginTop:3}}>{s.l}</div></div>
        ))}
      </div>
      {todos.length===0?(
        <div className="card" style={{padding:44,textAlign:"center"}}><div style={{fontSize:52}}>📭</div><p style={{color:"#AAA",marginTop:10}}>No hay pedidos en el período</p></div>
      ):modo==="resumen"?(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {!mismosDias&&<div className="card" style={{padding:16}}>
            <h4 style={{fontWeight:800,color:"#6B4226",marginBottom:12,fontSize:14}}>📅 Por Fecha</h4>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:"2px solid #E4D2BE"}}>{["Fecha","Pedidos","Total"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:"#AAA",fontWeight:800,fontSize:12}}>{h}</th>)}</tr></thead>
              <tbody>
                {fechasOrdenadas.map(d=><tr key={d} style={{borderBottom:"1px dashed #E4D2BE"}}><td style={{padding:"8px 10px",fontWeight:700,color:"#555",fontSize:12}}>{d}</td><td style={{padding:"8px 10px",fontWeight:800,color:"#6B4226"}}>{porFecha[d].pedidos}</td><td style={{padding:"8px 10px",fontWeight:900,color:"#155724"}}>{fmt$(porFecha[d].total)}</td></tr>)}
                <tr style={{borderTop:"2.5px solid #E4D2BE",background:"#FBF5EC"}}><td style={{padding:"10px",fontWeight:900}}>TOTAL</td><td style={{padding:"10px",fontWeight:900,color:"#6B4226"}}>{totalPedidos}</td><td style={{padding:"10px",fontWeight:900,color:"#155724",fontSize:15}}>{fmt$(totalVentas)}</td></tr>
              </tbody>
            </table>
          </div>}
          {topItems.length>0&&<div className="card" style={{padding:16}}>
            <h4 style={{fontWeight:800,color:"#6B4226",marginBottom:12,fontSize:14}}>🏆 Ítems Más Vendidos</h4>
            {topItems.slice(0,10).map(([name,d],i)=>(
              <div key={name} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px dashed #E4D2BE"}}>
                <span style={{fontWeight:900,color:"#9C7B5F",fontSize:12,minWidth:20}}>#{i+1}</span>
                <span style={{fontSize:20}}>{d.emoji||"🍴"}</span>
                <span style={{flex:1,fontWeight:700,fontSize:14}}>{name}</span>
                <span style={{background:"#F3E9DD",borderRadius:99,padding:"3px 10px",fontSize:12,fontWeight:800,color:"#6B4226"}}>{d.qty} unid.</span>
                <span style={{fontWeight:900,color:"#155724",fontSize:14,minWidth:60,textAlign:"right"}}>{fmt$(d.total)}</span>
              </div>
            ))}
          </div>}
          {cancelados.length>0&&<div style={{background:"#F6EAE3",border:"1.5px solid #E7C9B4",borderRadius:14,padding:"10px 16px",fontSize:13,color:"#C0392B",fontWeight:700}}>⚠️ {cancelados.length} cancelado{cancelados.length>1?"s":""} — NO incluido{cancelados.length>1?"s":""} en el total</div>}
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {fechasOrdenadas.map(d=>(
            <div key={d}>
              {!mismosDias&&<div style={{fontSize:12,fontWeight:900,color:"#9C7B5F",letterSpacing:1,marginBottom:8,paddingLeft:4}}>📅 {dateLabel(d)} — {porFecha[d].pedidos} pedido{porFecha[d].pedidos>1?"s":""} · {fmt$(porFecha[d].total)}</div>}
              {validos.filter(o=>o.createdAt?.slice(0,10)===d).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(o=>(
                <div key={o.id} className="card" style={{padding:"12px 16px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#6B4226,#C89B3C)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:900,fontSize:10,flexShrink:0}}>#{o.id.slice(-4).toUpperCase()}</div>
                      <div><div style={{fontWeight:800,fontSize:14}}>{o.userName}</div><div style={{fontSize:11,color:"#AAA"}}>⏰ {o.deliveryTime} · {new Date(o.createdAt).toLocaleTimeString("es-SV",{hour:"2-digit",minute:"2-digit"})}</div></div>
                    </div>
                    <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:16,color:"#6B4226"}}>{fmt$(o.total)}</div><span style={{background:STATUS_INFO[o.status]?.bg,color:STATUS_INFO[o.status]?.color,padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:800}}>{STATUS_INFO[o.status]?.label}</span></div>
                  </div>
                  <div style={{background:"#FBF5EC",borderRadius:10,padding:"8px 10px"}}>
                    {(o.items||[]).map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"2px 0"}}><span style={{color:"#555"}}>{it.emoji} {it.qty}x {it.name}</span><span style={{fontWeight:700}}>{fmt$(it.price*it.qty)}</span></div>)}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {cancelados.length>0&&<div>
            <div style={{fontSize:12,fontWeight:900,color:"#C0392B",letterSpacing:1,marginBottom:8}}>❌ CANCELADOS — NO INCLUIDOS EN VENTAS</div>
            {cancelados.map(o=><div key={o.id} className="card" style={{padding:"12px 16px",marginBottom:8,border:"1.5px solid #F8D7DA",opacity:.75}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{width:34,height:34,borderRadius:"50%",background:"#F8D7DA",display:"flex",alignItems:"center",justifyContent:"center",color:"#721C24",fontWeight:900,fontSize:10,flexShrink:0}}>#{o.id.slice(-4).toUpperCase()}</div><div><div style={{fontWeight:800,fontSize:14,color:"#888"}}>{o.userName}</div><div style={{fontSize:11,color:"#AAA"}}>{o.deliveryTime}</div></div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:15,color:"#AAA",textDecoration:"line-through"}}>{fmt$(o.total)}</div><span style={{background:"#F8D7DA",color:"#721C24",padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:800}}>❌ Cancelado</span></div>
              </div>
            </div>)}
          </div>}
          <div style={{background:"linear-gradient(135deg,#6B4226,#A9746E)",borderRadius:16,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",color:"white"}}>
            <div><div style={{fontWeight:800,fontSize:13,opacity:.85}}>TOTAL DEL PERÍODO</div><div style={{fontSize:12,opacity:.7}}>{totalPedidos} pedido{totalPedidos!==1?"s":""} · excluye cancelados</div></div>
            <div style={{fontWeight:900,fontSize:26}}>{fmt$(totalVentas)}</div>
          </div>
        </div>
      )}
    </div>}
    </div>
  );
}

/* ── ADMIN CLIENTES ── */
function AdminClientes({users,orders,saveUsers,notify,cfg}){
  const [buscar,setBuscar]=useState("");
  const [selected,setSelected]=useState(null);
  const [resetInfo,setResetInfo]=useState(null); // {userId, tempPass}
  const lista=(users||[]).filter(u=>{if(!buscar.trim())return true;const q=buscar.toLowerCase();return u.nombre?.toLowerCase().includes(q)||u.usuario?.toLowerCase().includes(q)||u.telefono?.includes(q)||u.email?.toLowerCase().includes(q);});
  const pedidosCliente=uid=>(orders||[]).filter(o=>o.userId===uid);
  const ventasCliente=uid=>pedidosCliente(uid).filter(o=>o.status!=="cancelado").reduce((s,o)=>s+(o.total||0),0);

  const handleReset=async(u)=>{
    const tempPass=genTempPass();
    const newList=(users||[]).map(x=>x.id===u.id?{...x,clave:tempPass}:x);
    await saveUsers(newList);
    setResetInfo({user:u,tempPass});
    notify(`Clave temporal generada para ${u.nombre.split(" ")[0]}`);
  };

  const sendWhatsApp=(u,tempPass)=>{
    const msg=`Hola ${u.nombre.split(" ")[0]}! 👋\nTe enviamos tu clave temporal para Altura Café:\n\n*${tempPass}*\n\n📱 Ingresa con esta clave y cámbiala desde el ícono 🔐 en el menú superior.\n\nCualquier duda escríbenos. ☕`;
    window.open(`https://wa.me/503${(u.telefono||"").replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`,"_blank");
  };

  return(
    <div>
      {resetInfo&&(
        <div style={{background:"#D4EDDA",border:"1.5px solid #C3E6CB",borderRadius:16,padding:"16px 20px",marginBottom:16,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontWeight:800,color:"#155724",fontSize:14}}>✅ Clave temporal generada para {resetInfo.user.nombre.split(" ")[0]}</div>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <code style={{background:"white",border:"1.5px solid #C3E6CB",borderRadius:8,padding:"8px 16px",fontSize:18,fontWeight:900,letterSpacing:2,color:"#155724"}}>{resetInfo.tempPass}</code>
            <button className="btn-green" onClick={()=>sendWhatsApp(resetInfo.user,resetInfo.tempPass)} style={{flex:1,minWidth:200}}>📱 Enviar por WhatsApp a {resetInfo.user.nombre.split(" ")[0]}</button>
          </div>
          <p style={{fontSize:12,color:"#155724",opacity:.8}}>El cliente puede cambiar su clave desde el ícono 🔐 después de iniciar sesión.</p>
          <button onClick={()=>setResetInfo(null)} style={{alignSelf:"flex-start",background:"none",border:"none",cursor:"pointer",color:"#888",fontSize:12}}>✕ Cerrar</button>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:16}}>
        {[{e:"👥",v:(users||[]).length,l:"Registrados",c:"#6B4226"},{e:"📦",v:(orders||[]).filter(o=>o.status!=="cancelado").length,l:"Pedidos",c:"#0C5460"},{e:"💵",v:fmt$((orders||[]).filter(o=>o.status!=="cancelado").reduce((s,o)=>s+(o.total||0),0)),l:"Ventas Total",c:"#155724"}].map((s,i)=>(
          <div key={i} className="card" style={{padding:"14px 12px",textAlign:"center"}}><div style={{fontSize:28}}>{s.e}</div><div style={{fontWeight:900,fontSize:22,color:s.c,marginTop:4}}>{s.v}</div><div style={{fontSize:11,color:"#AAA",fontWeight:700,marginTop:2}}>{s.l}</div></div>
        ))}
      </div>
      <div style={{marginBottom:14}}><input className="inp" placeholder="🔍 Buscar por nombre, usuario, teléfono o email..." value={buscar} onChange={e=>setBuscar(e.target.value)}/></div>
      {lista.length===0?(
        <div className="card" style={{padding:44,textAlign:"center"}}><div style={{fontSize:52}}>👤</div><p style={{color:"#AAA",marginTop:10}}>{buscar?"No se encontraron clientes":"No hay clientes registrados"}</p></div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {lista.map(u=>{
            const misOrdenes=pedidosCliente(u.id);
            const misVentas=ventasCliente(u.id);
            const cancelados=misOrdenes.filter(o=>o.status==="cancelado").length;
            const ultimo=[...misOrdenes].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0];
            const isOpen=selected===u.id;
            return(
              <div key={u.id} className="card" style={{overflow:"visible",border:isOpen?"1.5px solid #E4D2BE":"none"}}>
                <div style={{padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                  <div onClick={()=>setSelected(isOpen?null:u.id)} style={{display:"flex",alignItems:"center",gap:12,flex:1,cursor:"pointer"}}>
                    <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#6B4226,#C89B3C)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:900,fontSize:16,flexShrink:0}}>{u.nombre?.charAt(0).toUpperCase()}</div>
                    <div><div style={{fontWeight:800,fontSize:14}}>{u.nombre}</div><div style={{fontSize:12,color:"#AAA"}}>@{u.usuario} · 📞 {u.telefono}</div></div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <div style={{textAlign:"right"}}><div style={{fontWeight:900,color:"#155724",fontSize:14}}>{fmt$(misVentas)}</div><div style={{fontSize:11,color:"#AAA"}}>{misOrdenes.length} pedido{misOrdenes.length!==1?"s":""}</div></div>
                    <button onClick={()=>handleReset(u)} style={{background:"#FFF3CD",border:"1.5px solid #E9C77B",borderRadius:10,padding:"7px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:800,color:"#856404"}} title="Generar clave temporal"><Key size={14}/>Reset</button>
                    <ChevronDown size={15} onClick={()=>setSelected(isOpen?null:u.id)} style={{color:"#CCC",transform:isOpen?"rotate(180deg)":"",transition:"transform .2s",cursor:"pointer"}}/>
                  </div>
                </div>
                {isOpen&&(
                  <div className="fu" style={{borderTop:"1px solid #FFF0E8",padding:"14px 16px",background:"#FBF6EF"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14,fontSize:13}}>
                      <div><span style={{color:"#AAA",fontSize:11,display:"block",marginBottom:2}}>Email</span><span style={{fontWeight:700,color:"#555"}}>{u.email||"—"}</span></div>
                      <div><span style={{color:"#AAA",fontSize:11,display:"block",marginBottom:2}}>Teléfono</span><span style={{fontWeight:700,color:"#555"}}>{u.telefono}</span></div>
                      <div style={{gridColumn:"1/-1"}}><span style={{color:"#AAA",fontSize:11,display:"block",marginBottom:2}}>📍 Dirección</span><span style={{fontWeight:700,color:"#555"}}>{u.direccion||"—"}</span></div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                      {[{e:"📦",v:misOrdenes.length,l:"Pedidos",c:"#6B4226"},{e:"💵",v:fmt$(misVentas),l:"Compras",c:"#155724"},{e:"❌",v:cancelados,l:"Cancelados",c:"#721C24"}].map((s,i)=>(
                        <div key={i} style={{background:"white",borderRadius:12,padding:"10px 8px",textAlign:"center"}}><div style={{fontSize:20}}>{s.e}</div><div style={{fontWeight:900,fontSize:16,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#AAA",fontWeight:700}}>{s.l}</div></div>
                      ))}
                    </div>
                    {ultimo&&<div style={{background:"white",borderRadius:12,padding:"10px 12px",marginBottom:12,fontSize:13}}>
                      <div style={{fontWeight:800,color:"#AAA",fontSize:11,marginBottom:6}}>ÚLTIMO PEDIDO</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div><div style={{fontWeight:700}}>#{ultimo.id.slice(-6).toUpperCase()} · {ultimo.deliveryTime}</div><div style={{color:"#AAA",fontSize:12}}>{new Date(ultimo.createdAt).toLocaleDateString("es-SV")}</div></div>
                        <div style={{textAlign:"right"}}><div style={{fontWeight:900,color:"#6B4226"}}>{fmt$(ultimo.total)}</div><span style={{background:STATUS_INFO[ultimo.status]?.bg,color:STATUS_INFO[ultimo.status]?.color,padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:800}}>{STATUS_INFO[ultimo.status]?.label}</span></div>
                      </div>
                    </div>}
                    <a href={`https://wa.me/503${(u.telefono||"").replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${u.nombre?.split(" ")[0]}! 👋 Te escribimos de Altura Café. ¿En qué podemos ayudarte?`)}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
                      <button className="btn-green" style={{width:"100%",padding:"10px",fontSize:13}}>📱 Contactar por WhatsApp</button>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── ADMIN ANTOJITOS ── */
function AdminAntojitos({antos,saveAntos,notify}){
  const [list,setList]=useState([...(antos||[])]);
  const [adding,setAdding]=useState(false);
  const [form,setForm]=useState({title:"",desc:"",image:null,items:[{name:"",price:""}]});
  const imgRef=useRef();
  const handleImg=e=>{const file=e.target.files[0];if(!file)return;if(file.size>2*1024*1024){notify("Imagen muy grande. Máx 2MB",true);return;}const r=new FileReader();r.onload=ev=>setForm(p=>({...p,image:ev.target.result}));r.readAsDataURL(file);};
  const toggle=async id=>{const u=list.map(a=>a.id===id?{...a,active:!a.active}:a);setList(u);await saveAntos(u);};
  const del=async id=>{const u=list.filter(a=>a.id!==id);setList(u);await saveAntos(u);notify("Especial eliminado");};
  const save=async()=>{if(!form.title.trim()){notify("El título es requerido",true);return;}const anto={...form,id:uid(),active:true,items:form.items.filter(i=>i.name&&i.price)};const u=[...list,anto];setList(u);await saveAntos(u);setForm({title:"",desc:"",image:null,items:[{name:"",price:""}]});setAdding(false);notify("Especial agregado ✅");};
  return(
    <div>
      {list.length===0&&!adding&&<div className="card" style={{padding:36,textAlign:"center",marginBottom:16}}><div style={{fontSize:52}}>🌟</div><p style={{color:"#AAA",marginTop:10}}>No hay especiales aún</p></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12,marginBottom:16}}>
        {list.map(a=>(
          <div key={a.id} className="card" style={{opacity:a.active!==false?1:.5}}>
            {a.image?<img src={a.image} alt={a.title} style={{width:"100%",height:150,objectFit:"cover"}}/>:<div style={{height:80,background:"linear-gradient(135deg,#C89B3C,#6B4226)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>🌟</div>}
            <div style={{padding:12}}>
              <div style={{fontWeight:800,fontSize:14,marginBottom:4}}>{a.title}</div>
              {(a.items||[]).map((it,i)=><div key={i} style={{fontSize:13,color:"#888",lineHeight:1.6}}>{it.name} — <span style={{color:"#6B4226",fontWeight:700}}>{fmt$(it.price)}</span></div>)}
              <div style={{display:"flex",gap:7,marginTop:10}}>
                <button onClick={()=>toggle(a.id)} style={{flex:1,padding:"7px 4px",borderRadius:10,border:"none",background:a.active!==false?"#D4EDDA":"#E4D2BE",color:a.active!==false?"#155724":"#9C7B5F",fontFamily:"'Nunito',sans-serif",fontWeight:700,cursor:"pointer",fontSize:12}}>{a.active!==false?"✅ Activo":"⭕ Inactivo"}</button>
                <button onClick={()=>del(a.id)} style={{padding:"7px 10px",borderRadius:10,border:"none",background:"#F6EAE3",color:"#6B4226",cursor:"pointer"}}><Trash2 size={14}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {adding?(
        <div className="card" style={{padding:18}}>
          <h3 style={{fontWeight:800,color:"#6B4226",marginBottom:14}}>Nuevo Especial</h3>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input className="inp" placeholder="Título" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
            <input className="inp" placeholder="Descripción (opcional)" value={form.desc} onChange={e=>setForm(p=>({...p,desc:e.target.value}))}/>
            <div><input type="file" accept="image/*" ref={imgRef} onChange={handleImg} style={{display:"none"}}/><button onClick={()=>imgRef.current.click()} className="btn-out" style={{width:"100%",padding:"11px",fontSize:14}}><Upload size={15}/>{form.image?"✅ Imagen cargada — cambiar":"Cargar Imagen"}</button>{form.image&&<img src={form.image} alt="" style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:12,marginTop:8}}/>}</div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#AAA",marginBottom:8}}>Opciones / Precios</div>
              {form.items.map((it,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:7}}>
                <input className="inp" placeholder="Nombre" value={it.name} onChange={e=>setForm(p=>({...p,items:p.items.map((x,xi)=>xi===i?{...x,name:e.target.value}:x)}))}/>
                <input className="inp" placeholder="Precio" type="number" step="0.05" min="0" value={it.price} onChange={e=>setForm(p=>({...p,items:p.items.map((x,xi)=>xi===i?{...x,price:e.target.value}:x)}))} style={{width:90}}/>
                {form.items.length>1&&<button onClick={()=>setForm(p=>({...p,items:p.items.filter((_,xi)=>xi!==i)}))} style={{background:"none",border:"none",cursor:"pointer",color:"#E0B49A"}}><X size={16}/></button>}
              </div>)}
              <button onClick={()=>setForm(p=>({...p,items:[...p.items,{name:"",price:""}]}))} style={{background:"none",border:"none",cursor:"pointer",color:"#6B4226",fontWeight:700,fontSize:13}}>+ Agregar opción</button>
            </div>
            <div style={{display:"flex",gap:10}}><button className="btn-hot" onClick={save} style={{flex:1}}>Guardar</button><button className="btn-out" onClick={()=>setAdding(false)} style={{flex:1}}>Cancelar</button></div>
          </div>
        </div>
      ):(
        <button className="btn-hot" onClick={()=>setAdding(true)} style={{width:"100%",padding:"14px",fontSize:15}}><Plus size={18}/>Agregar Especial</button>
      )}
    </div>
  );
}

/* ── ADMIN CONFIG ── */
function AdminConfig({cfg,saveCfg,notify}){
  const [c,setC]=useState({...cfg});
  const [saving,setSaving]=useState(false);
  const logoRef=useRef();
  const handleLogo=e=>{const file=e.target.files[0];if(!file)return;if(file.size>1.5*1024*1024){notify("Logo muy grande",true);return;}const r=new FileReader();r.onload=ev=>setC(p=>({...p,logo:ev.target.result}));r.readAsDataURL(file);};
  const save=async()=>{setSaving(true);await saveCfg(c);setSaving(false);notify("Configuración guardada ✅");};
  return(
    <div className="fu" style={{maxWidth:480}}>
      <div className="card" style={{padding:20,marginBottom:14}}>
        <h3 style={{fontWeight:800,marginBottom:16,color:"#6B4226",fontSize:15}}>🏪 Datos del Café</h3>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div><label style={{fontSize:12,fontWeight:700,color:"#AAA",display:"block",marginBottom:7}}>Logo</label><input type="file" accept="image/*" ref={logoRef} onChange={handleLogo} style={{display:"none"}}/>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {c.logo?<img src={c.logo} alt="" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",border:"3px solid #E4D2BE",flexShrink:0}}/>:<div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#6B4226,#C89B3C)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>☕</div>}
              <div style={{display:"flex",gap:8}}><button onClick={()=>logoRef.current.click()} className="btn-out" style={{padding:"8px 14px",fontSize:13}}><Upload size={13}/>{c.logo?"Cambiar":"Subir Logo"}</button>{c.logo&&<button onClick={()=>setC(p=>({...p,logo:null}))} style={{background:"none",border:"none",cursor:"pointer",color:"#CCC"}}><X size={16}/></button>}</div>
            </div>
          </div>
          {[["name","Nombre del Café"],["phone","📞 Teléfono / WhatsApp"],["address","📍 Dirección"]].map(([k,label])=>(
            <div key={k}><label style={{fontSize:12,fontWeight:700,color:"#AAA",display:"block",marginBottom:5}}>{label}</label><input className="inp" value={c[k]} onChange={e=>setC(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
          <div><label style={{fontSize:12,fontWeight:700,color:"#AAA",display:"block",marginBottom:5}}>Descripción</label><textarea className="inp" value={c.desc} onChange={e=>setC(p=>({...p,desc:e.target.value}))} rows={3} style={{resize:"vertical"}}/></div>
        </div>
      </div>
      <div className="card" style={{padding:16,marginBottom:14,background:"#FFFAF0",border:"1px solid #E4D2BE"}}>
        <h4 style={{fontWeight:800,fontSize:14,color:"#9C7B5F",marginBottom:8}}>🔐 Acceso de Administrador</h4>
        <p style={{fontSize:13,color:"#888"}}>Usuario: <code style={{background:"#E4D2BE",padding:"2px 6px",borderRadius:6}}>admin</code> · Contraseña: <code style={{background:"#E4D2BE",padding:"2px 6px",borderRadius:6}}>altura2024</code></p>
        <p style={{fontSize:12,color:"#6B4226",marginTop:6,fontWeight:700}}>⚠️ Cambia estas credenciales en el código fuente.</p>
      </div>
      <button onClick={save} disabled={saving} className="btn-hot" style={{width:"100%",padding:"14px",fontSize:16}}>{saving?"Guardando...":"💾 Guardar Configuración"}</button>
    </div>
  );
}

/* ── MY ORDERS ── */
function MyOrders({orders,user,setView,updateStatus,notify}){
  const [confirmCancel,setConfirmCancel]=useState(null);
  const mine=(orders||[]).filter(o=>o.userId===user?.id);
  return(
    <div className="fu">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <h2 className="pac" style={{color:"#6B4226",fontSize:22}}>📦 Mis Pedidos</h2>
        <button onClick={()=>setView("menu")} style={{background:"none",border:"none",cursor:"pointer",color:"#6B4226",fontWeight:700,fontSize:13}}>← Volver</button>
      </div>
      {mine.length===0?(
        <div className="card" style={{padding:44,textAlign:"center"}}><div style={{fontSize:54}}>📭</div><p style={{color:"#AAA",marginTop:10,fontSize:15}}>No tienes pedidos aún</p><button onClick={()=>setView("menu")} className="btn-hot" style={{marginTop:18}}>Ver Menú</button></div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[...mine].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(o=>{
            const info={...STATUS_INFO[o.status]||{}};
            if(o.tipo==="reserva"&&o.status==="enviado")info.label="✅ Servido";
            const canCancel=o.status==="pendiente";
            return(
              <div key={o.id} className="card" style={{padding:"14px 16px",border:o.status==="cancelado"?"1.5px solid #F8D7DA":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,alignItems:"center"}}>
                  <span style={{fontWeight:800,color:"#6B4226",fontSize:14}}>Pedido #{o.id.slice(-6).toUpperCase()}</span>
                  <span style={{background:info.bg,color:info.color,padding:"4px 11px",borderRadius:99,fontSize:12,fontWeight:800}}>{info.label}</span>
                </div>
                <div style={{fontSize:13,color:"#AAA",marginBottom:8}}>{o.tipo==="reserva"?"☕ Recoger en tienda":"🚗 A domicilio"} · ⏰ {o.tipo==="reserva"?"En el local":o.deliveryTime} · {new Date(o.createdAt).toLocaleDateString("es-SV")}</div>
                {(o.items||[]).map((it,i)=><div key={i} style={{fontSize:14,color:"#555",padding:"2px 0",display:"flex",justifyContent:"space-between"}}><span>{it.emoji} {it.qty}x {it.name}</span><span style={{fontWeight:700}}>{fmt$(it.price*it.qty)}</span></div>)}
                <div style={{borderTop:"1px dashed #E4D2BE",marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center",fontWeight:900}}>
                  <span style={{color:"#888",fontSize:14}}>Total</span>
                  <span style={{color:"#6B4226",fontSize:15}}>{fmt$(o.total)}</span>
                </div>
                {canCancel&&confirmCancel!==o.id&&<button className="btn-red" style={{marginTop:10,width:"100%",fontSize:13}} onClick={()=>setConfirmCancel(o.id)}><Ban size={13}/>Cancelar Pedido</button>}
                {confirmCancel===o.id&&<div style={{marginTop:10,background:"#F6EAE3",borderRadius:10,padding:"10px 14px"}}>
                  <p style={{fontSize:13,color:"#C0392B",fontWeight:700,marginBottom:8}}>¿Cancelar este pedido?</p>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn-red" style={{flex:1,fontSize:13}} onClick={async()=>{await updateStatus(o.id,"cancelado");setConfirmCancel(null);notify("Pedido cancelado");}}>Sí, cancelar</button>
                    <button className="btn-out" style={{flex:1,padding:"9px",fontSize:13}} onClick={()=>setConfirmCancel(null)}>No, mantener</button>
                  </div>
                </div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
