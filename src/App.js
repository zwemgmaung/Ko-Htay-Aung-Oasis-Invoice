import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase-config';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import html2canvas from 'html2canvas';

// 📸 1. Logo ကို import လုပ်မယ် (file နာမည် oasis-logo.png နဲ့ src ထဲသိမ်းပါ)
import OasisLogo from './oasis-logo.png';

const App = () => {
  const [activeTab, setActiveTab] = useState('invoice');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [history, setHistory] = useState([]);
  const invoiceRef = useRef(null);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [discount, setDiscount] = useState(0);
  const [rows, setRows] = useState(Array.from({ length: 14 }, (_, i) => ({ id: i + 1, desc: "", unit: "", qty: 0, price: 0 })));

  // Realtime Data & Auto Invoice No.
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
    const cleanValue = (field === "desc" || field === "unit") ? value : Number(value.replace(/,/g, ''));
    newRows[index][field] = cleanValue;
    setRows(newRows);
  };

  const totalAmount = rows.reduce((sum, row) => sum + (row.qty * row.price), 0);
  const balance = totalAmount - discount;
  const formatNum = (num) => (num === 0 || !num) ? "" : num.toLocaleString();

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
      {/* 2. Rotate Animation အတွက် CSS ထည့်မယ် */}
      <style>{`
        .rotate-logo {
          transition: transform 0.5s ease;
          transform: rotate(-20deg); /* 📸 Default Rotate */
          filter: drop-shadow(0 4px 6px rgba(16,185,129,0.2));
        }
        .rotate-logo:hover {
          transform: rotate(0deg); /* Mouse တင်ရင် ပြန်တည့်မယ် */
        }
        .nav-logo { width: 30px; height: 30px; border-radius: 50%; }
      `}</style>

      {/* Navbar Section */}
      <div className="no-print" style={styles.navBar}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src={OasisLogo} alt="NavLogo" style={styles.navLogo} /> {/* Nav Bar Logo */}
          <div style={styles.navBrand}>OASIS SYSTEM</div>
        </div>
        <div style={styles.navLinks}>
          <button onClick={() => setActiveTab('invoice')} style={activeTab === 'invoice' ? styles.navBtnActive : styles.navBtn}>Create Invoice</button>
          <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? styles.navBtnActive : styles.navBtn}>History</button>
        </div>
        <button onClick={() => {localStorage.removeItem("isLoggedIn"); setIsLoggedIn(false);}} style={styles.logoutBtn}>Logout</button>
      </div>

      {activeTab === 'invoice' ? (
        <div style={styles.scrollWrapper}>
          <div style={styles.invoiceOuter}>
            <div ref={invoiceRef} style={styles.a4Sheet}>
              {/* Header Design with Rotated Logo */}
              <div style={styles.header}>
                <div style={styles.headerLeft}>
                  {/* 📸 3. ပုံကို Rotate လုပ်ပြီး Header မှာ သုံးထားတယ် */}
                  <img src={OasisLogo} alt="OasisLogo" className="rotate-logo" style={styles.logoImage} />
                  <div style={styles.bizInfo}>
                    <h1 style={styles.bizTitle}>Ko Htay Aung <span style={styles.bizSub}>( Oasis )</span></h1>
                    <p style={styles.serviceText}>Refrigerator, Washing Machine & Air-Conditioning Repair, Sales and Services</p>
                  </div>
                </div>
                <div style={styles.invoiceBadge}>INVOICE</div>
              </div>

              {/* Info Grid */}
              <div style={styles.infoGrid}>
                <div style={styles.addressBox}>
                  <div style={styles.infoRow}><span style={styles.label}>Address</span> <span style={styles.colon}>:</span> <span style={styles.val}>B97/7, Nawaday Shophouse, Hlaingthaya Township, Yangon</span></div>
                  <div style={styles.infoRow}><span style={styles.label}>Contact No.</span> <span style={styles.colon}>:</span> <span style={styles.val}>09-421 097 839, 09-795 954 493, 09-974 989 754</span></div>
                </div>
                <div style={styles.metaBox}>
                  <div style={styles.invNoDisplay}>INV NO: <strong>{invoiceNo}</strong></div>
                  <div style={styles.dateDisplay}>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* The Main Excel Grid Table */}
              <table style={styles.excelTable}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.thNo}>No.</th>
                    <th style={styles.thDesc}>Item Description</th>
                    <th style={styles.thUnit}>Unit</th>
                    <th style={styles.thQty}>Qty</th>
                    <th style={styles.thPrice}>Price</th>
                    <th style={styles.thTotal}>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.tdNo}>{i+1}</td>
                      <td style={styles.tdDesc}><input style={styles.tableInput} value={row.desc} onChange={e=>updateRow(i, 'desc', e.target.value)} /></td>
                      <td style={styles.tdUnit}><input style={styles.tableInputCenter} value={row.unit} onChange={e=>updateRow(i, 'unit', e.target.value)} /></td>
                      <td style={styles.tdQty}><input style={styles.tableInputCenter} type="text" value={row.qty || ""} onChange={e => updateRow(i, "qty", e.target.value)} /></td>
                      <td style={styles.tdPrice}><input style={styles.tableInputCenter} type="text" value={formatNum(row.price)} onChange={e => updateRow(i, "price", e.target.value)} /></td>
                      <td style={styles.tdTotalValue}>{formatNum(row.qty * row.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Section */}
              <div style={styles.footerLayout}>
                <div style={styles.customerBox}>
                  <div style={styles.footerInfoRow}><span style={styles.fLabel}>Customer Name</span> <span style={styles.colon}>:</span> <input style={styles.footerInput} onChange={e=>setCustomer({...customer, name: e.target.value})} /></div>
                  <div style={styles.footerInfoRow}><span style={styles.fLabel}>Contact No.</span> <span style={styles.colon}>:</span> <input style={styles.footerInput} onChange={e=>setCustomer({...customer, phone: e.target.value})} /></div>
                  <div style={styles.footerInfoRow}><span style={styles.fLabel}>Address</span> <span style={styles.colon}>:</span> <input style={styles.footerInput} onChange={e=>setCustomer({...customer, address: e.target.value})} /></div>
                </div>
                <div style={styles.summaryBox}>
                  <div style={styles.totalRowMain}><span>Total Amount</span> <span>{formatNum(totalAmount)}</span></div>
                  <div style={styles.summaryRow}><span>Discount</span> <input style={styles.summaryInput} type="text" value={formatNum(discount)} onChange={e=>setDiscount(Number(e.target.value.replace(/,/g, '')))} /></div>
                  <div style={styles.summaryRowLast}><span>Balance</span> <span>{formatNum(balance)}</span></div>
                </div>
              </div>

              <div style={styles.signatureSection}>
                <div style={styles.sigBox}>
                  <div style={styles.sigName}>Zwe</div>
                  <div style={styles.sigLine}>Zwe Htet Naing</div>
                  <div style={styles.sigTitle}>OASIS</div>
                </div>
              </div>
              <p style={styles.thanksText}>Thanks for your business!</p>
            </div>
          </div>
          <div style={styles.actionArea}>
            <button onClick={handleSaveAndCapture} style={styles.mainSaveBtn}>SAVE & DOWNLOAD JPEG</button>
          </div>
        </div>
      ) : (
        <div style={styles.dashboardArea}>
          <div style={{display:'flex', alignItems:'center', gap:'15px', borderBottom: '2px solid #10b981', paddingBottom: '10px'}}>
             {/* Dashboard Header Logo */}
             <img src={OasisLogo} alt="DashLogo" style={{width:'50px', height:'50px', borderRadius:'50%', border:'2px solid #10b981'}} />
             <h2 style={{color: '#064e3b', margin:0}}>Invoice Records</h2>
          </div>
          <div style={styles.historyGrid}>
            {history.map(item => (
              <div key={item.id} style={styles.historyCard}>
                <div style={styles.cardHeader}>INV: {item.invoiceNo}</div>
                <div style={styles.cardBody}>
                  <p><strong>Customer:</strong> {item.customer?.name || 'N/A'}</p>
                  <p><strong>Total:</strong> {formatNum(item.balance)} Ks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LoginSection = ({ onLogin }) => (
  <div style={styles.loginBg}><div style={styles.loginCard}>
    {/* 📸 Login Logo */}
    <img src={OasisLogo} alt="LoginLogo" style={styles.logoCircleLarge} />
    <h3>SYSTEM LOGIN</h3><input id="u" placeholder="Username" style={styles.loginInput} /><input id="p" type="password" placeholder="Password" style={styles.loginInput} /><button onClick={() => { if(document.getElementById('u').value.trim() === "Oasis" && document.getElementById('p').value === "Oasis@2000") { localStorage.setItem("isLoggedIn", "true"); onLogin(); } }} style={styles.loginBtnPrimary}>Login</button></div></div>
);

const styles = {
  appContainer: { backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' },
  navBar: { display: 'flex', alignItems: 'center', backgroundColor: '#065f46', padding: '10px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 },
  navBrand: { fontSize: '18px', fontWeight: 'bold' },
  navLinks: { display: 'flex', gap: '10px', flex: 1, justifyContent:'center' },
  navBtn: { padding: '8px 15px', color: '#a7f3d0', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px' },
  navBtnActive: { padding: '8px 15px', color: 'white', border: 'none', background: '#047857', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' },
  logoutBtn: { padding: '8px 15px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' },
  navLogo: { width: '30px', height: '30px', borderRadius: '50%' },
  
  scrollWrapper: { width: '100vw', overflowX: 'auto', padding: '30px 0' },
  invoiceOuter: { width: 'fit-content', margin: '0 auto', padding: '0 20px' },
  a4Sheet: { width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' },
  
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #10b981', paddingBottom: '15px', marginBottom: '20px' },
  headerLeft: { display: 'flex', gap: '20px', alignItems: 'center' },
  logoImage: { width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #10b981', objectFit: 'cover' }, // 📸 Logo Style
  bizTitle: { fontSize: '24px', margin: 0, color: '#064e3b' },
  bizSub: { fontSize: '18px', color: '#059669' },
  serviceText: { margin: '5px 0 0 0', fontSize: '12px', color: '#059669', maxWidth: '400px' },
  invoiceBadge: { backgroundColor: '#10b981', color: 'white', padding: '8px 40px', fontSize: '22px', fontWeight: 'bold', transform: 'skewX(-15deg)', height:'40px', display:'flex', alignItems:'center' },
  
  infoGrid: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px' },
  addressBox: { flex: 2 },
  infoRow: { display: 'flex', marginBottom: '4px', fontSize: '12px' },
  label: { width: '70px', fontWeight: 'bold', color: '#374151' },
  colon: { width: '15px', textAlign: 'center' },
  val: { flex: 1, color: '#4b5563' },
  metaBox: { flex: 1, textAlign: 'right' },
  invNoDisplay: { background: '#065f46', color: 'white', padding: '5px 15px', borderRadius: '4px', fontSize: '14px', display:'inline-block' },
  dateDisplay: { marginTop: '5px', fontSize: '12px', color: '#6b7280' },

  excelTable: { width: '100%', borderCollapse: 'collapse', border: '2px solid #000', marginBottom: '30px' },
  tableHeader: { backgroundColor: '#10b981', color: 'white' },
  thNo: { width: '40px', border: '1.5px solid #000', padding: '10px' },
  thDesc: { border: '1.5px solid #000', padding: '10px' },
  thUnit: { width: '80px', border: '1.5px solid #000' },
  thQty: { width: '80px', border: '1.5px solid #000' },
  thPrice: { width: '110px', border: '1.5px solid #000' },
  thTotal: { width: '130px', border: '1.5px solid #000' },
  tdNo: { border: '1.5px solid #000', textAlign: 'center', fontSize: '13px', color: '#000' },
  tdDesc: { border: '1.5px solid #000', padding: 0 },
  tdUnit: { border: '1.5px solid #000', padding: 0 },
  tdQty: { border: '1.5px solid #000', padding: 0 },
  tdPrice: { border: '1.5px solid #000', padding: 0 },
  tdTotalValue: { border: '1.5px solid #000', textAlign: 'right', padding: '8px', fontWeight: 'bold', fontSize: '13px' },
  tableInput: { width: '100%', border: 'none', padding: '10px', outline: 'none', fontSize: '13px', background: 'transparent' },
  tableInputCenter: { width: '100%', border: 'none', textAlign: 'center', outline: 'none', fontSize: '13px', background: 'transparent' },

  footerLayout: { display: 'flex', justifyContent: 'space-between' },
  customerBox: { flex: 1.5 },
  footerInfoRow: { display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '13px' },
  fLabel: { width: '110px', fontWeight: 'bold', color: '#374151' },
  footerInput: { flex: 1, border: 'none', borderBottom: '1px solid #10b981', outline: 'none', marginLeft: '5px', fontSize: '13px' },
  summaryBox: { flex: 1, border: '1px solid #10b981', borderRadius: '4px', overflow: 'hidden' },
  summaryRowMain: { backgroundColor: '#10b981', color: 'white', padding: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
  summaryRow: { padding: '10px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #d1fae5', color: '#065f46' },
  summaryRowLast: { padding: '10px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#d1fae5', fontWeight: 'bold', color: '#065f46' },
  summaryInput: { border: 'none', background: 'transparent', textAlign: 'right', width: '80px', outline: 'none', fontWeight: 'bold', color: '#065f46' },

  signatureSection: { display: 'flex', justifyContent: 'flex-end', marginTop: '40px' },
  sigBox: { textAlign: 'center', width: '200px' },
  sigName: { fontFamily: 'cursive', fontSize: '24px', color: '#065f46' },
  sigLine: { borderTop: '2px solid #000', paddingTop: '5px', fontWeight: 'bold', fontSize: '13px' },
  sigTitle: { fontSize: '11px', color: '#6b7280' },
  thanksText: { textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginTop: '40px' },
  actionArea: { display: 'flex', justifyContent: 'center', paddingBottom: '50px' },
  mainSaveBtn: { width: '210mm', padding: '15px', backgroundColor: '#10b981', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', letterSpacing: '1px' },
  
  dashboardArea: { padding: '30px', maxWidth: '1000px', margin: '0 auto' },
  historyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' },
  historyCard: { background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '4px solid #10b981' },
  cardHeader: { fontWeight: 'bold', color: '#10b981', borderBottom: '1px solid #f3f4f6', paddingBottom: '5px', marginBottom: '10px' },
  cardBody: { fontSize: '13px' },
  
  loginBg: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ecfdf5' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', width: '350px', textAlign: 'center' },
  logoCircleLarge: { width: '80px', height: '80px', borderRadius: '50%', objectFit:'cover', margin: '0 auto 20px', border:'2px solid #10b981' }, // 📸 Login Logo Style
  loginInput: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #d1fae5', borderRadius: '8px', outline: 'none' },
  loginBtnPrimary: { width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};

export default App;
        
