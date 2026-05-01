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
  const [discount, setDiscount] = useState(0);
  const [rows, setRows] = useState(Array.from({ length: 14 }, (_, i) => ({ id: i + 1, desc: "", unit: "", qty: "", price: "" })));

  useEffect(() => {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(data);
      if (data.length > 0 && !invoiceNo) {
        const lastInv = data[0].invoiceNo || "0";
        const nextNum = parseInt(lastInv.replace(/[^0-9]/g, '')) + 1;
        setInvoiceNo(nextNum.toString().padStart(3, '0'));
      } else if (!invoiceNo) { setInvoiceNo("001"); }
    });
    return () => unsub();
  }, [invoiceNo]);

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const calculateTotal = (qty, price) => {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(String(price).replace(/,/g, '')) || 0;
    return q * p;
  };

  const totalAmount = rows.reduce((sum, row) => sum + calculateTotal(row.qty, row.price), 0);
  const balance = totalAmount - discount;

  const handleSaveAndCapture = async () => {
    if (!invoiceRef.current) return;
    try {
      await addDoc(collection(db, "invoices"), { invoiceNo, customer, rows, totalAmount, discount, balance, createdAt: serverTimestamp() });
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `Oasis_Invoice_${invoiceNo}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      alert("အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ ကိုကို!");
    } catch (e) { alert("Error: " + e.message); }
  };

  if (!isLoggedIn) return <LoginSection onLogin={() => setIsLoggedIn(true)} />;
    return (
    <div style={styles.appContainer}>
      <style>{`
        .excel-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 2px solid black; }
        .excel-table th { border: 1.2px solid black; background-color: #10b981; color: white; padding: 10px; font-size: 14px; }
        .excel-table td { border: 1.2px solid black; padding: 0; height: 38px; vertical-align: middle; }
        .excel-input { width: 100%; height: 100%; border: none; padding: 0 10px; outline: none; font-size: 13px; background: transparent; }
        .excel-input-center { width: 100%; height: 100%; border: none; text-align: center; outline: none; font-size: 13px; background: transparent; }
        .rotate-logo { transition: transform 0.5s ease; transform: rotate(-20deg); filter: drop-shadow(0 4px 6px rgba(16,185,129,0.2)); }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 2000; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; align-items: center; }
        .pass-container { position: relative; width: 100%; margin-bottom: 20px; }
        .eye-icon { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #10b981; font-size: 18px; }
      `}</style>

      {/* Navbar */}
      <div style={styles.navBar}>
        <div style={styles.navLinks}>
          <button onClick={() => setActiveTab('invoice')} style={activeTab === 'invoice' ? styles.navBtnActive : styles.navBtn}>NEW INVOICE</button>
          <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? styles.navBtnActive : styles.navBtn}>HISTORY</button>
        </div>
        <button onClick={() => {localStorage.removeItem("isLoggedIn"); setIsLoggedIn(false);}} style={styles.logoutBtn}>LOGOUT</button>
      </div>

      {activeTab === 'invoice' ? (
        <div style={styles.scrollWrapper}>
          <div style={styles.invoiceOuter}>
            <div ref={invoiceRef} style={styles.a4Sheet}>
              {/* Header */}
              <div style={styles.header}>
                <div style={styles.headerLeft}>
                  <img src={OasisLogo} alt="Logo" className="rotate-logo" style={styles.logoImage} />
                  <div style={styles.bizInfo}>
                    <h1 style={styles.bizTitle}>Ko Htay Aung <span style={styles.bizSub}>( Oasis )</span></h1>
                    <p style={styles.serviceText}>Refrigerator, Washing Machine & Air-Conditioning Repair, Sales and Services</p>
                    <p style={styles.headerSmallText}>Address : B97/7, Nawaday Shophouse, Hlaingthaya Township, Yangon</p>
                    <p style={styles.headerSmallText}>Contact No : 09-421 097 839, 09-795 954 493, 09-974 989 754</p>
                  </div>
                </div>
                <div style={styles.headerRight}>
                   <div style={styles.invoiceBadge}>INVOICE</div>
                   <div style={styles.invNoBox}>INV NO: {invoiceNo}</div>
                   <div style={styles.dateBox}>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* Excel Table */}
              <table className="excel-table">
                <thead>
                  <tr>
                    <th style={{width: '45px'}}>No.</th><th>Item Description</th><th style={{width: '80px'}}>Unit</th><th style={{width: '65px'}}>Qty</th><th style={{width: '110px'}}>Price</th><th style={{width: '135px'}}>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td style={{textAlign:'center', fontSize:'13px', fontWeight:'bold'}}>{i+1}</td>
                      <td><input className="excel-input" value={row.desc} onChange={e=>updateRow(i, 'desc', e.target.value)} /></td>
                      <td><input className="excel-input-center" value={row.unit} onChange={e=>updateRow(i, 'unit', e.target.value)} /></td>
                      <td><input className="excel-input-center" value={row.qty} onChange={e=>updateRow(i, 'qty', e.target.value)} /></td>
                      <td><input className="excel-input-center" value={row.price} onChange={e=>updateRow(i, 'price', e.target.value)} /></td>
                      <td style={{textAlign:'right', paddingRight:'10px', fontWeight:'bold', fontSize:'13px'}}>{calculateTotal(row.qty, row.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div style={styles.footerFlex}>
                <div style={styles.customerArea}>
                  <div style={styles.fRow}>Name : <input style={styles.footerIn} onChange={e=>setCustomer({...customer, name:e.target.value})} /></div>
                  <div style={styles.fRow}>Phone : <input style={styles.footerIn} onChange={e=>setCustomer({...customer, phone:e.target.value})} /></div>
                  <div style={styles.fRow}>Addr : <input style={styles.footerIn} onChange={e=>setCustomer({...customer, address:e.target.value})} /></div>
                </div>
                <div style={styles.summaryArea}>
                  <div style={styles.sRow}>Total: <span>{totalAmount.toLocaleString()}</span></div>
                  <div style={styles.sRow}>Discount: <input style={styles.sInput} onChange={e=>setDiscount(Number(e.target.value))} /></div>
                  <div style={{...styles.sRow, background:'#10b981', color:'white'}}>Balance: <span>{balance.toLocaleString()}</span></div>
                </div>
              </div>

              <div style={styles.signatureArea}>
                <div style={styles.sigBox}>
                  <div style={styles.sigName}>Zwe</div>
                  <div style={styles.sigLine}>Zwe Htet Naing</div>
                  <div style={{fontSize:'11px'}}>OASIS</div>
                </div>
              </div>
              <p style={styles.thanksText}>Thanks for your business!</p>
            </div>
          </div>
          <div style={styles.btnCenter}><button onClick={handleSaveAndCapture} style={styles.saveBtn}>SAVE & DOWNLOAD JPEG</button></div>
        </div>
      ) : (
        /* History Dashboard */
        <div style={styles.dashboardArea}>
          <h2>History Records</h2>
          <div style={styles.historyGrid}>
            {history.map(item => (
              <div key={item.id} style={styles.hCard} onClick={() => setSelectedInvoice(item)}>
                <p><strong>INV:</strong> {item.invoiceNo}</p>
                <p><strong>Name:</strong> {item.customer?.name}</p>
                <p style={{color:'#10b981'}}><strong>Total:</strong> {item.balance?.toLocaleString()} Ks</p>
              </div>
            ))}
          </div>
          {selectedInvoice && (
            <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
              <button style={styles.closeModal} onClick={() => setSelectedInvoice(null)}>CLOSE [X]</button>
              <div onClick={e => e.stopPropagation()}><InvoiceReadOnly data={selectedInvoice} /></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 🔐 Login Component with Eye Icon
const LoginSection = ({ onLogin }) => {
  const [showPass, setShowPass] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div style={styles.loginBg}>
      <div style={styles.loginCard}>
        <img src={OasisLogo} alt="Logo" style={styles.logoCircleLarge} />
        <h2 style={{color: '#064e3b', margin: '0 0 5px 0'}}>Ko Htay Aung ( Oasis )</h2>
        <p style={{fontSize: '11px', color: '#059669', marginBottom: '25px', fontWeight: 'bold'}}>
          Refrigerator, Washing Machine & Air-Conditioning Repair, Sales & Service
        </p>
        
        <input 
          placeholder="Username" 
          style={styles.loginInput} 
          onChange={(e) => setUser(e.target.value)}
        />
        
        <div className="pass-container">
          <input 
            type={showPass ? "text" : "password"} 
            placeholder="Password" 
            style={{...styles.loginInput, marginBottom: 0}} 
            onChange={(e) => setPass(e.target.value)}
          />
          <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
            {showPass ? "👁️" : "🙈"}
          </span>
        </div>

        <button 
          onClick={() => { if(user.trim() === "Oasis" && pass === "Oasis@2000") { localStorage.setItem("isLoggedIn", "true"); onLogin(); } }} 
          style={styles.saveBtn}
        >
          Login
        </button>
      </div>
    </div>
  );
};

const InvoiceReadOnly = ({ data }) => (
  <div style={styles.a4Sheet}>
    <h2 style={{color:'#10b981'}}>Record: {data.invoiceNo}</h2>
    <p>Customer: {data.customer.name}</p>
    <table className="excel-table">
        <thead><tr><th>Description</th><th>Qty</th><th>Total</th></tr></thead>
        <tbody>{data.rows.map((r, i) => r.desc && <tr key={i}><td>{r.desc}</td><td style={{textAlign:'center'}}>{r.qty}</td><td style={{textAlign:'right', paddingRight:'10px'}}>{(parseFloat(r.qty||0)*parseFloat(String(r.price||0).replace(/,/g,''))).toLocaleString()}</td></tr>)}</tbody>
    </table>
    <h3 style={{textAlign:'right'}}>Total: {data.balance.toLocaleString()} Ks</h3>
  </div>
);

const styles = {
  appContainer: { backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif' },
  navBar: { display: 'flex', justifyContent: 'center', background: '#065f46', padding: '15px', position:'relative', alignItems:'center' },
  navLinks: { display: 'flex', gap: '30px' },
  navBtn: { background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', fontWeight:'bold', fontSize:'14px' },
  navBtnActive: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight:'bold', borderBottom:'3px solid #10b981', fontSize:'14px' },
  logoutBtn: { position:'absolute', right:'20px', background:'#dc2626', color:'white', border:'none', padding:'8px 15px', borderRadius:'5px', fontWeight:'bold', cursor:'pointer' },
  scrollWrapper: { padding: '30px 0' },
  invoiceOuter: { width: 'fit-content', margin: '0 auto' },
  a4Sheet: { width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #10b981', paddingBottom: '15px', marginBottom: '25px' },
  headerLeft: { display: 'flex', gap: '15px', alignItems: 'center' },
  logoImage: { width: '75px', height: '70px', borderRadius: '50%', border: '2px solid #10b981' },
  bizInfo: { textAlign: 'left' },
  bizTitle: { fontSize: '24px', margin: 0, color: '#064e3b' },
  bizSub: { color: '#10b981' },
  serviceText: { fontSize: '11px', margin: '3px 0', color: '#666', maxWidth:'350px' },
  headerSmallText: { fontSize: '10px', margin: '2px 0', color: '#444', fontWeight:'bold' },
  invoiceBadge: { background: '#10b981', color: 'white', padding: '10px 40px', fontWeight: 'bold', fontSize:'20px', marginBottom:'5px' },
  invNoBox: { fontWeight:'bold', fontSize:'14px', color:'#064e3b' },
  dateBox: { fontSize:'12px', color:'#666' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', marginTop: '30px' },
  customerArea: { flex: 1.5 },
  fRow: { marginBottom: '10px', fontSize:'14px', fontWeight:'bold' },
  footerIn: { border:'none', borderBottom:'1.5px solid #10b981', outline:'none', width:'70%', marginLeft:'10px' },
  summaryArea: { width: '280px', border: '2px solid black' },
  sRow: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #ddd' },
  sInput: { width: '80px', textAlign: 'right', border: 'none', outline: 'none', background:'transparent', fontWeight:'bold' },
  signatureArea: { marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingRight:'20px' },
  sigBox: { textAlign: 'center', width: '180px' },
  sigName: { fontFamily: 'cursive', fontSize: '22px', color:'#064e3b' },
  sigLine: { borderTop: '2.5px solid black', marginTop: '5px', fontWeight:'bold' },
  thanksText: { textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginTop: '30px' },
  btnCenter: { textAlign:'center', marginTop:'30px', paddingBottom:'50px' },
  saveBtn: { padding: '15px 50px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold', fontSize:'16px' },
  dashboardArea: { padding: '40px', maxWidth:'1000px', margin:'0 auto' },
  historyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
  hCard: { background: 'white', padding: '20px', borderRadius: '10px', cursor: 'pointer', borderLeft: '8px solid #10b981', boxShadow:'0 4px 6px rgba(0,0,0,0.05)' },
  closeModal: { background: 'red', color: 'white', border: 'none', padding: '10px 20px', borderRadius:'5px', cursor: 'pointer', fontWeight:'bold', marginBottom:'15px' },
  loginBg: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#ecfdf5' },
  loginCard: { background:'white', padding:'40px', borderRadius:'15px', textAlign:'center', boxShadow:'0 10px 20px rgba(0,0,0,0.1)', width: '380px' },
  logoCircleLarge: { width: '100px', height: '100px', borderRadius: '50%', objectFit:'cover', margin: '0 auto 15px', border:'2px solid #10b981' },
  loginInput: { display:'block', margin:'15px auto', padding:'12px', width:'100%', border:'1.5px solid #d1fae5', borderRadius:'8px', outline: 'none' }
};

export default App;
        
