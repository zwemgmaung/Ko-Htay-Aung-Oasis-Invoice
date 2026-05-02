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
  const [showFullLogo, setShowFullLogo] = useState(false);
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
      if (data.length === 0) {
        setInvoiceNo("001");
      } else {
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
    if (isNaN(num)) return "";
    return Number(num).toLocaleString();
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    if (field === "price") {
      newRows[index][field] = formatComma(value);
    } else {
      newRows[index][field] = value;
    }
    setRows(newRows);
  };

  const calculateTotal = (qty, price) => {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(String(price).replace(/,/g, '')) || 0;
    return q * p;
  };

  const totalAmount = rows.reduce((sum, row) => sum + calculateTotal(row.qty, row.price), 0);
  const discNum = parseFloat(String(discount).replace(/,/g, '')) || 0;
  const balance = totalAmount - discNum;

  const handleSaveAndCapture = async () => {
    if (!invoiceRef.current) return;
    try {
      await addDoc(collection(db, "invoices"), { 
        invoiceNo, customer, rows, totalAmount, discount: discNum, balance, createdAt: serverTimestamp() 
      });
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
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
        .excel-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 2px solid black; }
        /* UI Color Updated to Lime Green */
        .excel-table th { border: 1.2px solid black; background-color: #8ce100; color: #000; padding: 10px; font-size: 14px; }
        .excel-table td { border: 1.2px solid black; padding: 0; height: 38px; vertical-align: middle; }
        .excel-input { width: 100%; height: 100%; border: none; padding: 0 10px; outline: none; font-size: 13px; background: transparent; }
        .excel-input-center { width: 100%; height: 100%; border: none; text-align: center; outline: none; font-size: 13px; background: transparent; }
        .rotate-logo { transition: transform 0.5s ease; transform: rotate(-20deg); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); cursor: zoom-in; }
        .rotate-logo:hover { transform: rotate(0deg); }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 2000; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; align-items: center; }
        .nav-bar-fixed { display: flex; justify-content: center; background: #333; padding: 10px 15px; position: fixed; top: 0; left: 0; right: 0; z-index: 2000; align-items: center; }
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
                <div style={styles.header}>
                  <div style={styles.headerLeft}>
                    <img src={OasisLogo} alt="Logo" className="rotate-logo" style={styles.logoImage} onClick={() => setShowFullLogo(true)} />
                    <div style={styles.bizInfo}>
                      <h1 style={styles.bizTitle}>Ko Htay Aung <span style={{color: '#8ce100'}}>( Oasis )</span></h1>
                      <p style={{...styles.serviceText, color: '#8ce100'}}>Refrigerator, Air-Conditioning Repair, Sales and Services</p>
                      <p style={styles.headerSmallText}>Address : B97/7, Nawaday Shophouse, Hlaingthaya Township, Yangon</p>
                      {/* Updated Contact Numbers */}
                      <p style={styles.headerSmallText}>Contact No : 09-974 989 754, 09-421 097 839, 09-767 954 493</p>
                    </div>
                  </div>
                  <div style={styles.headerRight}>
                    <div style={{...styles.invoiceBadge, background: '#8ce100'}}>INVOICE</div>
                    <div style={styles.invNoBox}>INV NO: {invoiceNo}</div>
                    <div style={styles.dateBox}>Date: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                <table className="excel-table">
                  <thead>
                    <tr><th style={{width: '45px'}}>No.</th><th>Item Description</th><th style={{width: '80px'}}>Unit</th><th style={{width: '65px'}}>Qty</th><th style={{width: '110px'}}>Price</th><th style={{width: '135px'}}>Total Price</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        <td style={{textAlign:'center', fontSize:'13px', fontWeight:'bold'}}>{i+1}</td>
                        <td><input className="excel-input" value={row.desc} onChange={e=>updateRow(i, 'desc', e.target.value)} /></td>
                        <td><input className="excel-input-center" value={row.unit} onChange={e=>updateRow(i, 'unit', e.target.value)} /></td>
                        <td><input className="excel-input-center" value={row.qty} onChange={e=>updateRow(i, 'qty', e.target.value)} /></td>
                        <td><input className="excel-input-center" value={row.price} onChange={e=>updateRow(i, "price", e.target.value)} /></td>
                        <td style={{textAlign:'right', paddingRight:'10px', fontWeight:'bold', fontSize:'13px'}}>{calculateTotal(row.qty, row.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={styles.footerFlex}>
                  <div style={styles.customerArea}>
                    <div style={styles.fRow}><span style={styles.fLabel}>Customer Name</span> <span style={styles.colon}>:</span> <input style={{...styles.footerIn, borderBottomColor:'#8ce100'}} onChange={e=>setCustomer({...customer, name:e.target.value})} /></div>
                    <div style={styles.fRow}><span style={styles.fLabel}>Phone Number</span> <span style={styles.colon}>:</span> <input style={{...styles.footerIn, borderBottomColor:'#8ce100'}} onChange={e=>setCustomer({...customer, phone:e.target.value})} /></div>
                    <div style={styles.fRow}><span style={styles.fLabel}>Address</span> <span style={styles.colon}>:</span> <input style={{...styles.footerIn, borderBottomColor:'#8ce100'}} onChange={e=>setCustomer({...customer, address:e.target.value})} /></div>
                  </div>
                  <div style={{...styles.summaryArea, borderColor:'#8ce100'}}>
                    <div style={styles.sRow}>Total: <span>{totalAmount.toLocaleString()}</span></div>
                    <div style={styles.sRow}>Discount: <input style={styles.sInput} value={discount} onChange={e=>setDiscount(formatComma(e.target.value))} /></div>
                    <div style={{...styles.sRow, background:'#8ce100', color:'#000', fontWeight:'bold'}}>Balance: <span>{balance.toLocaleString()}</span></div>
                  </div>
                </div>
                <div style={styles.signatureArea}><div style={styles.sigBox}>
                  <div style={styles.sigName}>Zwe</div><div style={styles.sigLine}>Zwe Htet Naing</div><div style={{fontSize:'11px'}}>OASIS</div>
                </div></div>
                <p style={{...styles.thanksText, color:'#8ce100'}}>Thanks for your business!</p>
              </div>
            </div>
            <div style={styles.btnCenter}><button onClick={handleSaveAndCapture} style={{...styles.saveBtn, background:'#8ce100', color:'#000'}}>SAVE & DOWNLOAD JPEG</button></div>
          </div>
        ) : (
          <div style={styles.dashboardArea}>
            <h2 style={{color:'#8ce100'}}>History Records</h2>
            <div style={styles.historyGrid}>
              {history.map(item => (
                <div key={item.id} style={{...styles.hCard, borderLeftColor:'#8ce100'}} onClick={() => setSelectedInvoice(item)}>
                  <p><strong>INV:</strong> {item.invoiceNo}</p>
                  <p><strong>Name:</strong> {item.customer?.name || 'N/A'}</p>
                  <p style={{color:'#8ce100'}}><strong>Total:</strong> {item.balance?.toLocaleString()} Ks</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <button style={{background:'red', color:'white', border:'none', padding:'10px 20px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold', marginBottom:'15px'}} onClick={() => setSelectedInvoice(null)}>CLOSE [X]</button>
          <div onClick={e => e.stopPropagation()}><InvoiceReadOnly data={selectedInvoice} /></div>
        </div>
      )}

      {showFullLogo && ( <div style={styles.logoFullModal} onClick={() => setShowFullLogo(false)}><img src={OasisLogo} alt="Full" style={{ maxWidth: '90%', maxHeight: '90%' }} /></div> )}
    </div>
  );
};

const InvoiceReadOnly = ({ data }) => (
  <div style={styles.a4Sheet}>
    <div style={styles.header}>
      <div style={styles.headerLeft}><img src={OasisLogo} alt="Logo" style={styles.logoImage} />
      <div style={styles.bizInfo}><h1 style={styles.bizTitle}>Ko Htay Aung <span style={{color:'#8ce100'}}>( Oasis )</span></h1><p style={{color:'#8ce100'}}>Air-Conditioning Repair and Services</p></div></div>
      <div style={{...styles.invoiceBadge, background:'#8ce100'}}>INVOICE</div>
    </div>
    <table className="excel-table">
      <thead><tr><th style={{background:'#8ce100', color:'#000'}}>Description</th><th style={{background:'#8ce100', color:'#000'}}>Qty</th><th style={{background:'#8ce100', color:'#000'}}>Total</th></tr></thead>
      <tbody>{data.rows.map((r, i) => r.desc && <tr key={i}><td><div style={{padding:'10px'}}>{r.desc}</div></td><td style={{textAlign:'center'}}>{r.qty}</td><td style={{textAlign:'right', paddingRight:'10px'}}>{(parseFloat(r.qty||0)*parseFloat(String(r.price||0).replace(/,/g,''))).toLocaleString()}</td></tr>)}</tbody>
    </table>
    <h3 style={{textAlign:'right', color:'#8ce100'}}>Total: {data.balance.toLocaleString()} Ks</h3>
  </div>
);

const LoginSection = ({ onLogin }) => {
  const [showPass, setShowPass] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div style={styles.loginBg}><div style={styles.loginCard}><img src={OasisLogo} alt="Logo" style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 15px', border:'2px solid #8ce100' }} /><h2 style={{color: '#333'}}>Ko Htay Aung ( Oasis )</h2><p style={{fontSize: '11px', color: '#8ce100', fontWeight: 'bold'}}>Repair, Sales & Service</p><input placeholder="Username" style={{...styles.loginInput, border:'1.5px solid #8ce100'}} onChange={(e) => setUser(e.target.value)} /><div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}><input type={showPass ? "text" : "password"} placeholder="Password" style={{...styles.loginInput, border:'1.5px solid #8ce100', marginBottom: 0, paddingRight: '45px'}} onChange={(e) => setPass(e.target.value)} /><span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setShowPass(!showPass)}>{showPass ? "👁️" : "🙈"}</span></div><button onClick={() => { if(user.trim() === "Oasis" && pass === "Oasis@2000") { localStorage.setItem("isLoggedIn", "true"); onLogin(); } }} style={{...styles.saveBtn, background:'#8ce100', color:'#000', width:'100%'}}>Login</button></div></div>
  );
};

const styles = {
  appContainer: { backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif' },
  navBar: { display: 'flex', justifyContent: 'center', background: '#333', padding: '10px 15px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000, alignItems: 'center' },
  navLinks: { display: 'flex', gap: '20px' },
  navBtn: { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontWeight:'bold', fontSize:'13px' },
  navBtnActive: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight:'bold', borderBottom:'3px solid #8ce100', fontSize:'13px' },
  logoutBtn: { position:'absolute', right:'10px', background:'#dc2626', color:'white', border:'none', padding:'6px 12px', borderRadius:'5px', fontWeight:'bold', fontSize:'11px' },
  scrollWrapper: { padding: '10px 0' },
  invoiceOuter: { width: 'fit-content', margin: '0 auto' },
  a4Sheet: { width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #8ce100', paddingBottom: '15px', marginBottom: '25px' },
  headerLeft: { display: 'flex', gap: '15px', alignItems: 'center' },
  headerRight: { textAlign: 'right' },
  logoImage: { width: '75px', height: '70px', borderRadius: '50%', border: '2px solid #8ce100', objectFit: 'cover' },
  bizInfo: { textAlign: 'left' },
  bizTitle: { fontSize: '24px', margin: 0, color: '#333' },
  bizSub: { fontWeight: 'bold' },
  serviceText: { fontSize: '11px', margin: '3px 0', fontWeight: 'bold', maxWidth:'350px' },
  headerSmallText: { fontSize: '10px', margin: '2px 0', color: '#444', fontWeight:'bold' },
  invoiceBadge: { color: '#000', padding: '10px 40px', fontWeight: 'bold', fontSize:'20px', marginBottom:'5px' },
  invNoBox: { fontWeight:'bold', fontSize:'14px' },
  dateBox: { fontSize:'12px', color:'#666' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', marginTop: '30px' },
  customerArea: { flex: 1.5 },
  fRow: { display: 'flex', alignItems: 'center', marginBottom: '10px' },
  fLabel: { width: '120px', fontSize: '14px', fontWeight: 'bold', color: '#333' },
  colon: { width: '20px', textAlign: 'center', fontWeight: 'bold' },
  footerIn: { border:'none', borderBottom:'1.5px solid #8ce100', outline:'none', flex: 1, marginRight: '20px' },
  summaryArea: { width: '280px', border: '2px solid black' },
  sRow: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #ddd' },
  sInput: { width: '80px', textAlign: 'right', border: 'none', outline: 'none', background:'transparent', fontWeight:'bold' },
  signatureArea: { marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingRight:'20px' },
  sigBox: { textAlign: 'center', width: '180px' },
  sigName: { fontFamily: 'cursive', fontSize: '22px' },
  sigLine: { borderTop: '2.5px solid black', marginTop: '5px', fontWeight:'bold' },
  thanksText: { textAlign: 'center', fontSize: '16px', fontWeight: 'bold', marginTop: '30px' },
  btnCenter: { textAlign:'center', marginTop:'30px', paddingBottom:'50px' },
  saveBtn: { padding: '15px 50px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold', fontSize:'16px' },
  dashboardArea: { padding: '40px', maxWidth:'1000px', margin:'0 auto' },
  historyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
  hCard: { background: 'white', padding: '20px', borderRadius: '10px', cursor: 'pointer', borderLeft: '8px solid', boxShadow:'0 4px 6px rgba(0,0,0,0.05)' },
  loginBg: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f0fdf4' },
  loginCard: { background:'white', padding:'40px', borderRadius:'15px', textAlign:'center', boxShadow:'0 10px 20px rgba(0,0,0,0.1)', width: '380px' },
  loginInput: { display:'block', margin:'15px auto', padding:'12px', width:'100%', borderRadius:'8px', outline: 'none' },
  logoFullModal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', zIndex: 4000, display: 'flex', justifyContent: 'center', alignItems: 'center' }
};

export default App;
  
