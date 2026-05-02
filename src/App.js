import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase-config';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import html2canvas from 'html2canvas';
import OasisLogo from './oasis-logo.png';

const App = () => {
  const [activeTab, setActiveTab] = useState('invoice');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [history, setHistory] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null); 
  const invoiceRef = useRef(null);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [discount, setDiscount] = useState("");
  const [rows, setRows] = useState(Array.from({ length: 14 }, (_, i) => ({ id: i + 1, desc: "", unit: "", qty: "", price: "" })));

  useEffect(() => {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(data);
      if (data.length === 0) setInvoiceNo("001");
      else {
        const lastInv = data[0].invoiceNo || "0";
        const nextNum = parseInt(lastInv.replace(/[^0-9]/g, '')) + 1;
        setInvoiceNo(nextNum.toString().padStart(3, '0'));
      }
    });
    return () => unsub();
  }, []);

  const formatComma = (val) => {
    if (!val) return "";
    const num = val.toString().replace(/,/g, "");
    return isNaN(num) ? "" : Number(num).toLocaleString();
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = (field === "price") ? formatComma(value) : value;
    setRows(newRows);
  };

  const totalAmount = rows.reduce((sum, row) => {
    const q = parseFloat(row.qty) || 0;
    const p = parseFloat(String(row.price).replace(/,/g, '')) || 0;
    return sum + (q * p);
  }, 0);
  const balance = totalAmount - (parseFloat(String(discount).replace(/,/g, '')) || 0);

  const handleSaveAndCapture = async () => {
    if (!invoiceRef.current) return;
    try {
      await addDoc(collection(db, "invoices"), { invoiceNo, customer, rows, totalAmount, discount, balance, createdAt: serverTimestamp() });
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = `Oasis_Invoice_${invoiceNo}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      alert("သိမ်းဆည်းပြီးပါပြီ ကိုကို!");
    } catch (e) { alert("Error: " + e.message); }
  };

  if (!isLoggedIn) return <LoginSection onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div style={styles.appContainer}>
      <style>{`
        .excel-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; }
        .excel-table td { border: 1.5px solid #000; padding: 0; height: 35px; }
        .th-lime { background-color: #8ce100; color: #fff; border: 1.5px solid #000; padding: 10px; font-size: 13px; font-weight: bold; }
        .th-black { background-color: #231f20; color: #fff; border: 1.5px solid #000; padding: 10px; font-size: 13px; }
        
        /* 🎨 Top Invoice Design Match */
        .top-design-container { position: relative; width: 320px; height: 80px; }
        .top-black-shape { position: absolute; right: 0; top: 15px; width: 280px; height: 50px; background: #231f20; clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%); z-index: 1; }
        .top-lime-shape { position: absolute; right: 80px; top: 0; width: 220px; height: 45px; background: #8ce100; clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%); z-index: 2; display: flex; align-items: center; justify-content: center; }
        .invoice-text { color: white; font-size: 24px; font-weight: bold; letter-spacing: 2px; }

        /* 🎨 Bottom Footer Design Match */
        .footer-graphic { position: relative; width: 100%; height: 60px; margin-top: 20px; }
        .bot-black { position: absolute; left: 45%; bottom: 0; width: 55%; height: 30px; background: #231f20; clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%); z-index: 2; }
        .bot-lime { position: absolute; left: 52%; bottom: 10px; width: 48%; height: 35px; background: #8ce100; clip-path: polygon(8% 0, 100% 0, 100% 100%, 0 100%); z-index: 1; }
      `}</style>

      <div className="no-print" style={styles.navBar}>
        <div style={styles.navLinks}>
          <button onClick={() => setActiveTab('invoice')} style={activeTab === 'invoice' ? styles.navBtnActive : styles.navBtn}>NEW INVOICE</button>
          <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? styles.navBtnActive : styles.navBtn}>HISTORY</button>
        </div>
        <button onClick={() => {localStorage.removeItem("isLoggedIn"); setIsLoggedIn(false);}} style={styles.logoutBtn}>LOGOUT</button>
      </div>

      <div style={{ marginTop: '70px' }}>
        {activeTab === 'invoice' ? (
          <div style={styles.scrollWrapper}>
            <div style={styles.invoiceOuter}>
              <div ref={invoiceRef} style={styles.a4Sheet}>
                {/* Header Section */}
                <div style={styles.header}>
                  <div style={styles.headerLeft}>
                    <img src={OasisLogo} alt="Logo" style={styles.logoImage} />
                    <div style={styles.bizInfo}>
                      <div style={{display:'flex', alignItems:'baseline'}}>
                        <span style={{fontSize:'20px', fontWeight:'bold'}}>ကိုဌေးအောင်</span>
                        <h1 style={{fontSize:'35px', margin:'0 0 0 15px', color:'#231f20'}}>OASIS</h1>
                      </div>
                      <p style={{fontSize:'16px', color:'#8ce100', fontWeight:'bold', margin:'5px 0'}}>Refrigerator, Air-Conditioning Repair, Sales and Services</p>
                      <p style={styles.headerSmallText}>Address : B97/7, Nawaday Shophouse, Hlaingthaya Township, Yangon</p>
                      <p style={styles.headerSmallText}>Phone : 09-974 989 754, 09-421 097 839, 09-767 954 493</p>
                    </div>
                  </div>
                  <div style={styles.headerRight}>
                    <div className="top-design-container">
                      <div className="top-black-shape"></div>
                      <div className="top-lime-shape"><span className="invoice-text">INVOICE</span></div>
                    </div>
                    <div style={styles.invNoBox}>INVOICE NO: {invoiceNo}</div>
                    <div style={styles.dateBox}>Invoice Date: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Table */}
                <table className="excel-table">
                  <thead>
                    <tr>
                      <th className="th-black" style={{width: '45px'}}>No.</th>
                      <th className="th-lime">Item description</th>
                      <th className="th-black" style={{width: '70px'}}>Unit</th>
                      <th className="th-lime" style={{width: '60px'}}>Qty</th>
                      <th className="th-black" style={{width: '100px'}}>Price</th>
                      <th className="th-lime" style={{width: '125px'}}>Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        <td style={{textAlign:'center', fontSize:'12px'}}>{i+1}</td>
                        <td><input style={styles.cellInput} value={row.desc} onChange={e=>updateRow(i, 'desc', e.target.value)} /></td>
                        <td><input style={styles.cellInputCenter} value={row.unit} onChange={e=>updateRow(i, 'unit', e.target.value)} /></td>
                        <td><input style={styles.cellInputCenter} value={row.qty} onChange={e=>updateRow(i, 'qty', e.target.value)} /></td>
                        <td><input style={styles.cellInputCenter} value={row.price} onChange={e=>updateRow(i, "price", e.target.value)} /></td>
                        <td style={{textAlign:'right', paddingRight:'10px', fontSize:'12px', fontWeight:'bold'}}>
                          {(parseFloat(row.qty||0)*parseFloat(String(row.price||0).replace(/,/g,''))).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer Section */}
                <div style={styles.footerFlex}>
                  <div style={styles.customerArea}>
                    <div style={styles.fRow}><span style={styles.fLabel}>Customer Name</span> : <input style={styles.footerIn} onChange={e=>setCustomer({...customer, name:e.target.value})} /></div>
                    <div style={styles.fRow}><span style={styles.fLabel}>Phone Number</span> : <input style={styles.footerIn} onChange={e=>setCustomer({...customer, phone:e.target.value})} /></div>
                    <div style={styles.fRow}><span style={styles.fLabel}>Address</span> : <input style={styles.footerIn} onChange={e=>setCustomer({...customer, address:e.target.value})} /></div>
                  </div>
                  <div style={styles.summaryArea}>
                    <div style={{...styles.sRow, background:'#8ce100', color:'#fff'}}>Total Amount <span>{totalAmount.toLocaleString()}</span></div>
                    <div style={{...styles.sRow, background:'#b8e986'}}>Discount <input style={styles.sInput} value={discount} onChange={e=>setDiscount(formatComma(e.target.value))} /></div>
                    <div style={{...styles.sRow, background:'#8ce100', color:'#fff', fontWeight:'bold', borderBottom:'none'}}>Balance <span>{balance.toLocaleString()}</span></div>
                  </div>
                </div>

                <div style={styles.signatureArea}>
                  <div style={styles.sigBox}>
                    <div style={{color:'#1e40af', fontSize:'24px', fontFamily:'cursive', marginBottom:'-5px'}}>Zwe</div>
                    <div style={styles.sigLine}>Zwe Htet Naing</div>
                    <div style={{fontSize:'10px', fontWeight:'bold'}}>OASIS</div>
                  </div>
                </div>

                <p style={{fontSize:'16px', fontWeight:'bold', marginTop:'5px', marginLeft:'20px'}}>Thanks for your business!</p>
                
                {/* 🎨 Bottom Graphic Match */}
                <div className="footer-graphic">
                  <div className="bot-lime"></div>
                  <div className="bot-black"></div>
                </div>
              </div>
            </div>
            <div style={styles.btnCenter}><button onClick={handleSaveAndCapture} style={{...styles.saveBtn, background:'#8ce100'}}>SAVE & DOWNLOAD JPEG</button></div>
          </div>
        ) : (
          <div style={styles.dashboardArea}>
            <h2 style={{color:'#8ce100'}}>History Records</h2>
            <div style={styles.historyGrid}>{history.map(item => (<div key={item.id} style={styles.hCard} onClick={() => setSelectedInvoice(item)}><p>INV: {item.invoiceNo}</p><p>Total: {item.balance?.toLocaleString()} Ks</p></div>))}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const LoginSection = ({ onLogin }) => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div style={styles.loginBg}><div style={styles.loginCard}><h2>OASIS LOGIN</h2><input placeholder="User" style={styles.loginInput} onChange={e=>setUser(e.target.value)}/><input type="password" placeholder="Pass" style={styles.loginInput} onChange={e=>setPass(e.target.value)}/><button onClick={()=>{if(user==="Oasis" && pass==="Oasis@2000") onLogin()}} style={{background:'#8ce100', padding:'10px', width:'100%', border:'none', cursor:'pointer'}}>Login</button></div></div>
  );
};

const styles = {
  appContainer: { backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' },
  navBar: { display: 'flex', justifyContent: 'center', background: '#231f20', padding: '10px 15px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 },
  navLinks: { display: 'flex', gap: '20px' },
  navBtn: { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontWeight:'bold' },
  navBtnActive: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight:'bold', borderBottom:'3px solid #8ce100' },
  logoutBtn: { position:'absolute', right:'10px', background:'#e74c3c', color:'white', border:'none', padding:'6px 12px', borderRadius:'5px' },
  scrollWrapper: { padding: '10px 0' },
  invoiceOuter: { width: 'fit-content', margin: '0 auto' },
  a4Sheet: { width: '210mm', minHeight: '297mm', padding: '10mm 15mm 0 15mm', backgroundColor: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  headerLeft: { display: 'flex', gap: '15px', alignItems: 'center', flex: 1 },
  headerRight: { textAlign: 'right', width: '320px' },
  logoImage: { width: '100px', height: '100px', objectFit: 'cover' },
  headerSmallText: { fontSize: '11px', margin: '2px 0', color: '#555', fontWeight:'bold' },
  invNoBox: { background: '#231f20', color: 'white', padding: '5px 15px', fontSize:'13px', fontWeight:'bold', marginTop:'10px', display: 'inline-block' },
  dateBox: { fontSize:'11px', color:'#777', marginTop:'5px', fontWeight:'bold' },
  cellInput: { width: '100%', height: '100%', border: 'none', padding: '0 8px', outline: 'none', fontSize: '13px', background: 'transparent' },
  cellInputCenter: { width: '100%', height: '100%', border: 'none', textAlign: 'center', outline: 'none', fontSize: '13px', background: 'transparent' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', marginTop: '20px' },
  customerArea: { flex: 1.5 },
  fRow: { display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '13px' },
  fLabel: { width: '110px', fontWeight: 'bold' },
  footerIn: { border:'none', borderBottom:'1px solid #8ce100', outline:'none', flex: 1, marginRight: '20px' },
  summaryArea: { width: '260px', border: '1.5px solid #000' },
  sRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1.5px solid #000', fontSize:'13px' },
  sInput: { width: '80px', textAlign: 'right', border: 'none', outline: 'none', background:'transparent', fontWeight:'bold' },
  signatureArea: { marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingRight:'20px' },
  sigBox: { textAlign: 'center', width: '180px' },
  sigLine: { borderTop: '2px solid #000', marginTop: '5px', fontWeight:'bold' },
  btnCenter: { textAlign:'center', marginTop:'20px', paddingBottom:'50px' },
  saveBtn: { padding: '12px 40px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold', color: 'white' },
  dashboardArea: { padding: '40px', maxWidth:'1000px', margin:'0 auto' },
  historyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
  hCard: { background: 'white', padding: '20px', borderRadius: '10px', borderLeft: '8px solid #8ce100' },
  loginBg: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f0fdf4' },
  loginCard: { background:'white', padding:'40px', borderRadius:'15px', textAlign:'center', width: '350px' },
  loginInput: { display:'block', margin:'10px auto', padding:'10px', width:'100%' }
};

export default App;
          
