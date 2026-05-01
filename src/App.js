import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase-config';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import html2canvas from 'html2canvas';

// Logo import (src ထဲမှာ oasis-logo.png ရှိရပါမယ်)
import OasisLogo from './oasis-logo.png';

const App = () => {
  const [activeTab, setActiveTab] = useState('invoice');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [history, setHistory] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null); // History ပြန်ကြည့်ရန် State
  const invoiceRef = useRef(null);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [discount, setDiscount] = useState(0);
  const [rows, setRows] = useState(Array.from({ length: 14 }, (_, i) => ({ id: i + 1, desc: "", unit: "", qty: 0, price: 0 })));

  // Realtime History & Auto Invoice No.
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
      <style>{`
        .rotate-logo { transition: transform 0.5s ease; transform: rotate(-20deg); filter: drop-shadow(0 4px 6px rgba(16,185,129,0.2)); }
        .rotate-logo:hover { transform: rotate(0deg); }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 2000; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; align-items: center; }
        .close-btn { background: #dc2626; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
      `}</style>

      {/* Navbar - Logo နဲ့ စာသား ဖြုတ်ထားပါတယ် */}
      <div className="no-print" style={styles.navBar}>
        <div style={styles.navLinks}>
          <button onClick={() => setActiveTab('invoice')} style={activeTab === 'invoice' ? styles.navBtnActive : styles.navBtn}>NEW INVOICE</button>
          <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? styles.navBtnActive : styles.navBtn}>HISTORY</button>
        </div>
        <button onClick={() => {localStorage.removeItem("isLoggedIn"); setIsLoggedIn(false);}} style={styles.logoutBtn}>Logout</button>
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

              {/* Excel Table */}
              <table style={styles.excelTable}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.thNo}>No.</th><th style={styles.thDesc}>Item Description</th><th style={styles.thUnit}>Unit</th><th style={styles.thQty}>Qty</th><th style={styles.thPrice}>Price</th><th style={styles.thTotal}>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td style={styles.tdNo}>{i+1}</td>
                      <td style={styles.tdBorder}><input style={styles.tableInput} value={row.desc} onChange={e=>updateRow(i, 'desc', e.target.value)} /></td>
                      <td style={styles.tdBorder}><input style={styles.tableInputCenter} value={row.unit} onChange={e=>updateRow(i, 'unit', e.target.value)} /></td>
                      <td style={styles.tdBorder}><input style={styles.tableInputCenter} type="text" value={row.qty || ""} onChange={e => updateRow(i, "qty", e.target.value)} /></td>
                      <td style={styles.tdBorder}><input style={styles.tableInputCenter} type="text" value={formatNum(row.price)} onChange={e => updateRow(i, "price", e.target.value)} /></td>
                      <td style={styles.tdTotalValue}>{formatNum(row.qty * row.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div style={styles.footerLayout}>
                <div style={styles.customerBox}>
                  <div style={styles.footerInfoRow}><span style={styles.fLabel}>Customer Name</span> <span style={styles.colon}>:</span> <input style={styles.footerInput} onChange={e=>setCustomer({...customer, name: e.target.value})} /></div>
                  <div style={styles.footerInfoRow}><span style={styles.fLabel}>Contact No.</span> <span style={styles.colon}>:</span> <input style={styles.footerInput} onChange={e=>setCustomer({...customer, phone: e.target.value})} /></div>
                  <div style={styles.footerInfoRow}><span style={styles.fLabel}>Address</span> <span style={styles.colon}>:</span> <input style={styles.footerInput} onChange={e=>setCustomer({...customer, address: e.target.value})} /></div>
                </div>
                <div style={styles.summaryBox}>
                  <div style={styles.summaryRowMain}><span>Total Amount</span> <span>{formatNum(totalAmount)}</span></div>
                  <div style={styles.summaryRow}><span>Discount</span> <input style={styles.summaryInput} type="text" value={formatNum(discount)} onChange={e=>setDiscount(Number(e.target.value.replace(/,/g, '')))} /></div>
                  <div style={styles.summaryRowLast}><span>Balance</span> <span>{formatNum(balance)}</span></div>
                </div>
              </div>
              <div style={styles.signatureSection}><div style={styles.sigBox}><div style={styles.sigName}>Zwe</div><div style={styles.sigLine}>Zwe Htet Naing</div><div style={styles.sigTitle}>OASIS</div></div></div>
              <p style={styles.thanksText}>Thanks for your business!</p>
            </div>
          </div>
          <div style={styles.actionArea}><button onClick={handleSaveAndCapture} style={styles.mainSaveBtn}>SAVE & DOWNLOAD JPEG</button></div>
        </div>
      ) : (
        /* History Dashboard Section */
        <div style={styles.dashboardArea}>
          <h2 style={styles.dashTitle}>Invoice History</h2>
          <div style={styles.historyGrid}>
            {history.map(item => (
              <div key={item.id} style={styles.historyCard} onClick={() => setSelectedInvoice(item)}>
                <div style={styles.cardHeader}>INV: {item.invoiceNo}</div>
                <div style={styles.cardBody}>
                  <p><strong>Customer:</strong> {item.customer?.name || 'N/A'}</p>
                  <p><strong>Date:</strong> {item.createdAt?.toDate().toLocaleDateString()}</p>
                  <p style={{color: '#10b981', fontWeight:'bold'}}>Total: {formatNum(item.balance)} Ks</p>
                </div>
              </div>
            ))}
          </div>

          {/* History Modal Viewer - ဒါက History ပြန်ကြည့်လို့ရအောင် ပြင်ပေးထားတာပါ */}
          {selectedInvoice && (
            <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
              <button className="close-btn" onClick={() => setSelectedInvoice(null)}>CLOSE [X]</button>
              <div onClick={e => e.stopPropagation()}>
                <InvoiceReadOnly data={selectedInvoice} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// History ထဲက Invoice အဟောင်းကို Layout မပျက် ပြန်ကြည့်ရမဲ့ အစိတ်အပိုင်း
const InvoiceReadOnly = ({ data }) => (
  <div style={styles.a4Sheet}>
    <div style={styles.header}>
      <div style={styles.headerLeft}>
        <img src={OasisLogo} alt="Logo" className="rotate-logo" style={styles.logoImage} />
        <div style={styles.bizInfo}>
          <h1 style={styles.bizTitle}>Ko Htay Aung <span style={styles.bizSub}>( Oasis )</span></h1>
          <p style={styles.serviceText}>Refrigerator, Washing Machine & Air-Conditioning Repair, Sales and Services</p>
        </div>
      </div>
      <div style={styles.invoiceBadge}>INVOICE</div>
    </div>
    <div style={styles.infoGrid}>
      <div style={styles.addressBox}>
        <div style={styles.infoRow}><span style={styles.label}>Address</span> <span style={styles.colon}>:</span> <span style={styles.val}>B97/7, Nawaday Shophouse, Hlaingthaya Township, Yangon</span></div>
        <div style={styles.infoRow}><span style={styles.label}>Contact No.</span> <span style={styles.colon}>:</span> <span style={styles.val}>09-421 097 839, 09-795 954 493</span></div>
      </div>
      <div style={styles.metaBox}>
        <div style={styles.invNoDisplay}>INV NO: <strong>{data.invoiceNo}</strong></div>
        <div style={styles.dateDisplay}>Date: {data.createdAt?.toDate().toLocaleDateString()}</div>
      </div>
    </div>
    <table style={styles.excelTable}>
      <thead>
        <tr style={styles.tableHeader}>
          <th style={styles.thNo}>No.</th><th>Item Description</th><th>Unit</th><th>Qty</th><th>Price</th><th>Total Price</th>
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, i) => (
          <tr key={i}>
            <td style={styles.tdNo}>{i+1}</td>
            <td style={styles.tdBorder}><div style={{padding:'10px', fontSize:'13px'}}>{row.desc}</div></td>
            <td style={styles.tdBorder}><div style={{padding:'10px', fontSize:'13px', textAlign:'center'}}>{row.unit}</div></td>
            <td style={styles.tdBorder}><div style={{padding:'10px', fontSize:'13px', textAlign:'center'}}>{row.qty || ""}</div></td>
            <td style={styles.tdBorder}><div style={{padding:'10px', fontSize:'13px', textAlign:'center'}}>{row.price ? row.price.toLocaleString() : ""}</div></td>
            <td style={styles.tdTotalValue}>{(row.qty * row.price).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div style={styles.footerLayout}>
      <div style={styles.customerBox}>
        <p style={{fontSize:'13px'}}><strong>Customer Name :</strong> {data.customer.name}</p>
        <p style={{fontSize:'13px'}}><strong>Contact No :</strong> {data.customer.phone}</p>
        <p style={{fontSize:'13px'}}><strong>Address :</strong> {data.customer.address}</p>
      </div>
      <div style={styles.summaryBox}>
        <div style={styles.summaryRowMain}><span>Total</span> <span>{data.totalAmount.toLocaleString()}</span></div>
        <div style={styles.summaryRow}><span>Discount</span> <span>{data.discount.toLocaleString()}</span></div>
        <div style={styles.summaryRowLast}><span>Balance</span> <span>{data.balance.toLocaleString()}</span></div>
      </div>
    </div>
    <p style={styles.thanksText}>Record Viewed Only</p>
  </div>
);

const LoginSection = ({ onLogin }) => (
  <div style={styles.loginBg}><div style={styles.loginCard}><img src={OasisLogo} alt="Logo" style={styles.logoCircleLarge} /><h3>SYSTEM LOGIN</h3><input id="u" placeholder="Username" style={styles.loginInput} /><input id="p" type="password" placeholder="Password" style={styles.loginInput} /><button onClick={() => { if(document.getElementById('u').value.trim() === "Oasis" && document.getElementById('p').value === "Oasis@2000") { localStorage.setItem("isLoggedIn", "true"); onLogin(); } }} style={styles.loginBtnPrimary}>Login</button></div></div>
);

const styles = {
  appContainer: { backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' },
  navBar: { display: 'flex', alignItems: 'center', backgroundColor: '#065f46', padding: '10px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 1000, justifyContent:'center' },
  navLinks: { display: 'flex', gap: '20px' },
  navBtn: { padding: '10px 20px', color: '#a7f3d0', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px', fontSize:'14px', fontWeight:'bold' },
  navBtnActive: { padding: '10px 20px', color: 'white', border: 'none', background: '#047857', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', borderBottom: '3px solid #10b981' },
  logoutBtn: { position:'absolute', right:'20px', padding: '8px 15px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' },
  
  scrollWrapper: { width: '100vw', overflowX: 'auto', padding: '30px 0' },
  invoiceOuter: { width: 'fit-content', margin: '0 auto', padding: '0 20px' },
  a4Sheet: { width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' },
  
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #10b981', paddingBottom: '15px', marginBottom: '20px' },
  headerLeft: { display: 'flex', gap: '20px', alignItems: 'center' },
  logoImage: { width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #10b981', objectFit: 'cover' },
  bizTitle: { fontSize: '24px', margin: 0, color: '#064e3b' },
  bizSub: { fontSize: '18px', color: '#059669' },
  serviceText: { margin: '5px 0 0 0', fontSize: '12px', color: '#059669', maxWidth: '400px' },
  invoiceBadge: { backgroundColor: '#10b981', color: 'white', padding: '8px 40px', fontSize: '22px', fontWeight: 'bold', transform: 'skewX(-15deg)', height:'40px', display:'flex', alignItems:'center' },
  
  infoGrid: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px' },
  addressBox: { flex: 2 },
  infoRow: { display: 'flex', marginBottom: '4px', fontSize: '12px' },
  label: { width: '70px', fontWeight: 'bold' },
  colon: { width: '15px', textAlign: 'center' },
  val: { flex: 1, color: '#4b5563' },
  metaBox: { flex: 1, textAlign: 'right' },
  invNoDisplay: { background: '#065f46', color: 'white', padding: '5px 15px', borderRadius: '4px', fontSize: '14px', display:'inline-block' },
  dateDisplay: { marginTop: '5px', fontSize: '12px', color: '#6b7280' },

  excelTable: { width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', marginBottom: '30px' },
  tableHeader: { backgroundColor: '#10b981', color: 'white' },
  thNo: { width: '40px', border: '1.5px solid #000', padding: '10px' },
  thDesc: { border: '1.5px solid #000', padding: '10px' },
  tdNo: { border: '1.5px solid #000', textAlign: 'center', fontSize: '13px' },
  tdBorder: { border: '1.5px solid #000', padding: 0 },
  tdTotalValue: { border: '1.5px solid #000', textAlign: 'right', padding: '8px', fontWeight: 'bold', fontSize: '13px' },
  tableInput: { width: '100%', border: 'none', padding: '10px', outline: 'none', fontSize: '13px' },
  tableInputCenter: { width: '100%', border: 'none', textAlign: 'center', outline: 'none', fontSize: '13px' },

  footerLayout: { display: 'flex', justifyContent: 'space-between' },
  customerBox: { flex: 1.5 },
  footerInfoRow: { display: 'flex', alignItems: 'center', marginBottom: '8px' },
  fLabel: { width: '110px', fontWeight: 'bold' },
  footerInput: { flex: 1, border: 'none', borderBottom: '1px solid #10b981', outline: 'none', marginLeft: '5px' },
  summaryBox: { flex: 1, border: '1px solid #10b981', borderRadius: '4px' },
  summaryRowMain: { backgroundColor: '#10b981', color: 'white', padding: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
  summaryRow: { padding: '10px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #d1fae5' },
  summaryRowLast: { padding: '10px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#d1fae5', fontWeight: 'bold' },
  summaryInput: { border: 'none', background: 'transparent', textAlign: 'right', width: '80px', outline: 'none', fontWeight: 'bold' },

  signatureSection: { display: 'flex', justifyContent: 'flex-end', marginTop: '40px' },
  sigBox: { textAlign: 'center', width: '200px' },
  sigName: { fontFamily: 'cursive', fontSize: '24px' },
  sigLine: { borderTop: '2px solid #000', paddingTop: '5px', fontWeight: 'bold' },
  sigTitle: { fontSize: '11px' },
  thanksText: { textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginTop: '40px' },
  actionArea: { display: 'flex', justifyContent: 'center', paddingBottom: '50px' },
  mainSaveBtn: { width: '210mm', padding: '15px', backgroundColor: '#10b981', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  
  dashboardArea: { padding: '30px', maxWidth: '1000px', margin: '0 auto' },
  dashTitle: { borderBottom: '2px solid #10b981', color: '#065f46', paddingBottom: '10px' },
  historyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' },
  historyCard: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor:'pointer', borderLeft:'6px solid #10b981' },
  cardHeader: { fontWeight: 'bold', color: '#10b981', fontSize:'18px', marginBottom:'10px' },
  cardBody: { fontSize: '14px', color:'#4b5563' },
  
  loginBg: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ecfdf5' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 25px rgba(0,0,0,0.1)', width: '350px', textAlign: 'center' },
  logoCircleLarge: { width: '80px', height: '80px', borderRadius: '50%', objectFit:'cover', margin: '0 auto 20px', border:'2px solid #10b981' },
  loginInput: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #d1fae5', borderRadius: '8px', outline: 'none' },
  loginBtnPrimary: { width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};

export default App;
        
