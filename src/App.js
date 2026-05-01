import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase-config';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import html2canvas from 'html2canvas';

const App = () => {
  const [activeTab, setActiveTab] = useState('invoice');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [history, setHistory] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const invoiceRef = useRef(null);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [discount, setDiscount] = useState(0);
  const [rows, setRows] = useState(Array.from({ length: 14 }, (_, i) => ({ id: i + 1, desc: "", unit: "", qty: 0, price: 0 })));

  useEffect(() => { if (activeTab === 'dashboard') fetchHistory(); }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      setHistory(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    const cleanValue = (field === "desc" || field === "unit") ? value : Number(value.replace(/,/g, ''));
    newRows[index][field] = cleanValue;
    setRows(newRows);
  };

  const totalAmount = rows.reduce((sum, row) => sum + (row.qty * row.price), 0);
  const balance = totalAmount - discount;
  const formatNum = (num) => (num === 0 || !num) ? "0" : num.toLocaleString();

  const handleSaveAndCapture = async () => {
    if (!invoiceRef.current) return;
    try {
      await addDoc(collection(db, "invoices"), { invoiceNo, customer, rows, totalAmount, discount, balance, createdAt: serverTimestamp() });
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `Oasis_Invoice_${invoiceNo || 'New'}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      alert("JPEG သိမ်းဆည်းပြီး Firebase မှာ မှတ်တမ်းတင်ပြီးပါပြီ ကိုကို!");
    } catch (e) { alert("Error: " + e.message); }
  };

  if (!isLoggedIn) return <LoginSection onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div style={styles.appContainer}>
      <div className="no-print" style={styles.tabBar}>
        <button onClick={() => {setActiveTab('invoice'); setSelectedInvoice(null);}} style={activeTab === 'invoice' ? styles.activeTab : styles.tab}>New Invoice</button>
        <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? styles.activeTab : styles.tab}>Invoice History</button>
        <button onClick={() => {localStorage.removeItem("isLoggedIn"); setIsLoggedIn(false);}} style={styles.logoutTab}>Logout</button>
      </div>

      {activeTab === 'invoice' ? (
        <div style={styles.scrollWrapper}>
          <div style={styles.invoiceOuter}>
            <div ref={invoiceRef} style={styles.a4Sheet}>
              {/* Header */}
              <div style={styles.header}>
                <div style={styles.headerLeft}>
                  <div style={styles.logoCircle}>Logo</div>
                  <div style={styles.bizHeader}>
                    <h1 style={styles.bizTitle}>Ko Htay Aung</h1>
                    <h2 style={styles.bizSub}>( Oasis )</h2>
                    <p style={styles.serviceText}>Refrigerator, Washing Machine & Air-Conditioning</p>
                    <p style={styles.serviceText}>Repair, Sales and Services</p>
                  </div>
                </div>
                <div style={styles.invoiceBadge}>INVOICE</div>
              </div>

              {/* Info Rows */}
              <div style={styles.infoGrid}>
                <div style={styles.addressBox}>
                  <div style={styles.alignedRow}><span style={styles.label}>Address</span> <span style={styles.colon}>:</span> <span style={styles.value}>B97/7, Nawaday Shophouse, Hlaingthaya Township, Yangon</span></div>
                  <div style={styles.alignedRow}><span style={styles.label}>Contact No.</span> <span style={styles.colon}>:</span> <span style={styles.value}>09-421 097 839, 09-795 954 493</span></div>
                  <div style={styles.alignedRow}><span style={styles.label}></span> <span style={styles.colon}></span> <span style={styles.value}>09-974 989 754</span></div>
                </div>
                <div style={styles.metaBox}>
                  <div style={styles.invNoBox}>INV NO: <input style={styles.invInput} onChange={e=>setInvoiceNo(e.target.value)} /></div>
                  <div style={styles.dateBox}>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* Grid Table with Columns */}
              <table style={styles.mainTable}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.thCol}>No.</th>
                    <th style={styles.thCol}>Item Description</th>
                    <th style={styles.thCol}>Unit</th>
                    <th style={styles.thCol}>Qty</th>
                    <th style={styles.thCol}>Price</th>
                    <th style={styles.thCol}>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td style={styles.tdColCenter}>{i+1}</td>
                      <td style={styles.tdColDotted}><input style={styles.tdInput} value={row.desc} onChange={e=>updateRow(i, 'desc', e.target.value)} /></td>
                      <td style={styles.tdColCenter}><input style={styles.tdInputCenter} value={row.unit} onChange={e=>updateRow(i, 'unit', e.target.value)} /></td>
                      <td style={styles.tdColCenter}><input style={styles.tdInputCenter} type="text" value={row.qty || ""} onChange={e => updateRow(i, "qty", e.target.value)} /></td>
                      <td style={styles.tdColCenter}><input style={styles.tdInputCenter} type="text" value={formatNum(row.price)} onChange={e => updateRow(i, "price", e.target.value)} /></td>
                      <td style={styles.tdColTotal}>{formatNum(row.qty * row.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div style={styles.footerLayout}>
                <div style={styles.customerBox}>
                  <div style={styles.alignedRow}><span style={styles.labelLong}>Customer Name</span> <span style={styles.colon}>:</span> <input style={styles.dottedInput} onChange={e=>setCustomer({...customer, name: e.target.value})} /></div>
                  <div style={styles.alignedRow}><span style={styles.labelLong}>Contact No.</span> <span style={styles.colon}>:</span> <input style={styles.dottedInput} onChange={e=>setCustomer({...customer, phone: e.target.value})} /></div>
                  <div style={styles.alignedRow}><span style={styles.labelLong}>Address</span> <span style={styles.colon}>:</span> <input style={styles.dottedInput} onChange={e=>setCustomer({...customer, address: e.target.value})} /></div>
                </div>
                <div style={styles.summaryBox}>
                  <div style={styles.totalRow}><span>Total Amount</span> <span>{formatNum(totalAmount)}</span></div>
                  <div style={styles.summaryRow}><span>Discount</span> <input style={styles.summaryInput} type="text" value={formatNum(discount)} onChange={e=>setDiscount(Number(e.target.value.replace(/,/g, '')))} /></div>
                  <div style={styles.summaryRow}><span>Balance</span> <span>{formatNum(balance)}</span></div>
                </div>
              </div>

              <div style={styles.sigArea}><div style={styles.sigBlock}><div style={{fontFamily:'cursive',fontSize:'26px'}}>Zwe</div><div style={styles.sigLine}>Zwe Htet Naing</div><div>OASIS</div></div></div>
              <p style={styles.thanks}>Thanks for your business!</p>
            </div>
          </div>
          <div style={styles.actionArea}><button onClick={handleSaveAndCapture} style={styles.saveBtn}>Save to Firebase & Download JPEG</button></div>
        </div>
      ) : (
        <div style={styles.dashboardArea}>
          <h2>Dashboard - Invoice History</h2>
          <div style={styles.historyList}>
            {history.map(item => (
              <div key={item.id} style={styles.historyItem}>
                <span><strong>INV:</strong> {item.invoiceNo || 'N/A'}</span>
                <span><strong>Customer:</strong> {item.customer?.name}</span>
                <span><strong>Total:</strong> {formatNum(item.balance)} Ks</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LoginSection = ({ onLogin }) => (
  <div style={styles.loginPage}><div style={styles.loginCard}><div style={styles.logoCircle}>OASIS</div><h3>Oasis Login</h3><input id="u" placeholder="Username" style={styles.loginInput} /><input id="p" type="password" placeholder="Password" style={styles.loginInput} /><button onClick={() => { if(document.getElementById('u').value.trim() === "Oasis" && document.getElementById('p').value === "Oasis@2000") { localStorage.setItem("isLoggedIn", "true"); onLogin(); } }} style={styles.saveBtnSmall}>Login</button></div></div>
);

const styles = {
  appContainer: { backgroundColor: '#cbd5e1', minHeight: '100vh' },
  tabBar: { display: 'flex', backgroundColor: '#1e293b', padding: '10px', gap: '5px', position: 'sticky', top: 0, zIndex: 100 },
  tab: { padding: '8px 15px', color: 'white', border: 'none', background: 'transparent', fontSize: '14px', cursor:'pointer' },
  activeTab: { padding: '8px 15px', color: 'white', borderBottom: '3px solid #059669', background: '#334155', fontWeight: 'bold' },
  logoutTab: { marginLeft: 'auto', padding: '8px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', cursor:'pointer' },
  scrollWrapper: { width: '100vw', overflowX: 'auto', padding: '20px 0' },
  invoiceOuter: { width: 'fit-content', margin: '0 auto', padding: '0 20px' },
  a4Sheet: { width: '230mm', minHeight: '297mm', padding: '15mm', backgroundColor: 'white', boxShadow: '0 0 15px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #059669', paddingBottom: '10px', marginBottom: '20px' },
  headerLeft: { display: 'flex', gap: '20px', alignItems: 'center' },
  logoCircle: { width: '80px', height: '80px', border: '2px solid #059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#059669' },
  bizHeader: { textAlign: 'center' },
  bizTitle: { fontSize: '28px', margin: 0 },
  bizSub: { fontSize: '22px', margin: '0 0 5px 0' },
  serviceText: { margin: 0, fontSize: '13px', color: '#059669', fontWeight: 'bold' },
  invoiceBadge: { backgroundColor: '#059669', color: 'white', padding: '8px 40px', fontSize: '24px', fontWeight: 'bold', transform: 'skewX(-20deg)', marginRight: '-15mm' },
  infoGrid: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px' },
  addressBox: { flex: 2 },
  alignedRow: { display: 'flex', alignItems: 'center', marginBottom: '5px' },
  label: { width: '80px', fontWeight: 'bold' },
  labelLong: { width: '110px', fontWeight: 'bold' },
  colon: { width: '15px', textAlign: 'center', fontWeight: 'bold' },
  value: { flex: 1 },
  metaBox: { flex: 1, textAlign: 'right' },
  invNoBox: { backgroundColor: '#1e293b', color: 'white', padding: '6px', textAlign: 'center', fontWeight: 'bold' },
  invInput: { background: 'transparent', border: 'none', borderBottom: '1px solid white', color: 'white', width: '70px', outline: 'none', textAlign: 'center' },
  dateBox: { borderBottom: '1px solid #ddd', textAlign: 'center', padding: '4px' },
  
  // Table Borders - တစ်ကွက်ချင်းစီ သီးသန့်ပေါ်စေရန်
  mainTable: { width: '100%', borderCollapse: 'collapse', marginBottom: '25px', border: '1.5px solid #000' },
  tableHeader: { backgroundColor: '#059669', color: 'white' },
  thCol: { border: '1.5px solid #000', padding: '10px', fontSize: '13px' },
  
  // Cells with Columns logic
  tdColCenter: { border: '1.5px solid #000', textAlign: 'center', fontSize: '13px' },
  tdColDotted: { border: '1.5px solid #000', borderRight: '1.5px dotted #000', padding: 0 }, // Description နှင့် Unit ကြားက မျဉ်းစက်
  tdColTotal: { border: '1.5px solid #000', textAlign: 'right', padding: '8px', fontWeight: 'bold', fontSize: '13px' },
  
  tdInput: { width: '100%', border: 'none', padding: '10px', outline: 'none', fontSize: '13px' },
  tdInputCenter: { width: '100%', border: 'none', textAlign: 'center', outline: 'none', fontSize: '13px' },
  
  footerLayout: { display: 'flex', justifyContent: 'space-between' },
  customerBox: { flex: 1.5 },
  dottedInput: { flex: 1, border: 'none', borderBottom: '1px dotted black', outline: 'none', fontSize: '13px', marginLeft: '5px' },
  summaryBox: { flex: 1 },
  totalRow: { backgroundColor: '#059669', color: 'white', padding: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
  summaryRow: { backgroundColor: '#d1fae5', padding: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '2px solid white' },
  summaryInput: { border: 'none', background: 'transparent', textAlign: 'right', width: '80px', outline: 'none', fontWeight: 'bold' },
  sigArea: { display: 'flex', justifyContent: 'flex-end', marginTop: '40px' },
  sigBlock: { textAlign: 'center', width: '200px' },
  sigLine: { borderTop: '2px solid black', paddingTop: '5px', fontWeight: 'bold' },
  thanks: { textAlign: 'center', fontSize: '16px', fontWeight: 'bold', marginTop: '30px' },
  actionArea: { display: 'flex', justifyContent: 'center', paddingBottom: '40px' },
  saveBtn: { width: '230mm', padding: '15px', backgroundColor: '#059669', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  loginPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0fdf4' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '320px', textAlign: 'center' },
  loginInput: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '8px', outline:'none' },
  saveBtnSmall: { width: '100%', padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor:'pointer' },
  dashboardArea: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' },
  historyItem: { background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer' },
};

export default App;
        
