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
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    setHistory(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = (field === "desc" || field === "unit") ? value : Number(value);
    setRows(newRows);
  };

  const totalAmount = rows.reduce((sum, row) => sum + (row.qty * row.price), 0);
  const balance = totalAmount - discount;

  const handleSaveAndCapture = async () => {
    if (!invoiceRef.current) return;
    try {
      await addDoc(collection(db, "invoices"), { invoiceNo, customer, rows, totalAmount, discount, balance, createdAt: serverTimestamp() });
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, logging: false });
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
              {/* Invoice Layout Code (Same as previous high-fidelity layout) */}
              <div style={styles.header}>
                <div style={styles.headerLeft}>
                  <div style={styles.logoCircle}>Logo</div>
                  <div style={{textAlign: 'center'}}>
                    <h1 style={{fontSize: '28px', margin: 0}}>Ko Htay Aung</h1>
                    <h2 style={{fontSize: '22px', margin: '0 0 5px 0'}}>( Oasis )</h2>
                    <p style={styles.serviceText}>Refrigerator, Washing Machine & Air-Conditioning</p>
                    <p style={styles.serviceText}>Repair, Sales and Services</p>
                  </div>
                </div>
                <div style={styles.invoiceBadge}>INVOICE</div>
              </div>

              <div style={styles.infoGrid}>
                <div style={{flex: 2}}>
                  <div style={styles.infoLine}><strong>Address</strong> <span style={{flex: 1, paddingLeft: '8px'}}>: B97/7, Nawaday Shophouse, Hlaingthaya Township, Yangon</span></div>
                  <div style={styles.infoLine}><strong>Contact No.</strong> <span style={{flex: 1, paddingLeft: '8px'}}>: 09-421 097 839, 09-795 954 493</span></div>
                  <div style={{marginLeft: '100px'}}>09-974 989 754</div>
                </div>
                <div style={{flex: 1, textAlign: 'right'}}>
                  <div style={styles.invNoBox}>INV NO: <input style={styles.invInput} onChange={e=>setInvoiceNo(e.target.value)} /></div>
                  <div style={styles.dateBox}>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <table style={styles.mainTable}>
                <thead>
                  <tr style={{backgroundColor: '#059669', color: 'white'}}>
                    <th style={styles.th}>No.</th>
                    <th style={styles.th}>Item Description</th>
                    <th style={styles.th}>Unit</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td style={styles.tdCenter}>{i+1}</td>
                      <td style={styles.td}><input style={styles.tdInput} onChange={e=>updateRow(i, 'desc', e.target.value)} /></td>
                      <td style={styles.td}><input style={styles.tdInput} onChange={e=>updateRow(i, 'unit', e.target.value)} /></td>
                      <td style={styles.td}><input style={styles.tdInputCenter} type="number" onChange={e=>updateRow(i, 'qty', e.target.value)} /></td>
                      <td style={styles.td}><input style={styles.tdInputRight} type="number" onChange={e=>updateRow(i, 'price', e.target.value)} /></td>
                      <td style={styles.tdTotal}>{(row.qty * row.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={styles.footerLayout}>
                <div style={{flex: 1.5}}>
                  <div style={styles.infoLine}><strong>Customer Name</strong> <span style={styles.dottedSpan}>: <input style={styles.dottedInput} onChange={e=>setCustomer({...customer, name: e.target.value})} /></span></div>
                  <div style={styles.infoLine}><strong>Phone Number</strong> <span style={styles.dottedSpan}>: <input style={styles.dottedInput} onChange={e=>setCustomer({...customer, phone: e.target.value})} /></span></div>
                  <div style={styles.infoLine}><strong>Address</strong> <span style={styles.dottedSpan}>: <input style={styles.dottedInput} onChange={e=>setCustomer({...customer, address: e.target.value})} /></span></div>
                </div>
                <div style={{flex: 1}}>
                  <div style={styles.totalRow}><span>Total Amount</span> <span>{totalAmount.toLocaleString()}</span></div>
                  <div style={styles.summaryRow}><span>Discount</span> <input style={styles.summaryInput} type="number" onChange={e=>setDiscount(Number(e.target.value))} /></div>
                  <div style={styles.summaryRow}><span>Balance</span> <span>{balance.toLocaleString()}</span></div>
                </div>
              </div>
              <div style={styles.sigArea}><div style={styles.sigBlock}><div style={{fontFamily:'cursive',fontSize:'26px'}}>Zwe</div><div style={styles.sigLine}>Zwe Htet Naing</div><div>OASIS</div></div></div>
              <p style={styles.thanks}>Thanks for your business!</p>
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'center',paddingBottom:'40px'}}><button onClick={handleSaveAndCapture} style={styles.saveBtn}>Save & Download JPEG</button></div>
        </div>
      ) : (
        <div style={styles.dashboardArea}>
          <h2 style={{borderBottom:'2px solid #059669',paddingBottom:'10px'}}>Dashboard - Invoice History</h2>
          <div style={styles.historyList}>
            {history.map(item => (
              <div key={item.id} style={styles.historyItem} onClick={() => setSelectedInvoice(item)}>
                <span><strong>INV:</strong> {item.invoiceNo || 'N/A'}</span>
                <span><strong>User:</strong> {item.customer?.name}</span>
                <span><strong>Total:</strong> {item.balance?.toLocaleString()} Ks</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LoginSection = ({ onLogin }) => (
  <div style={styles.loginPage}><div style={styles.loginCard}><div style={styles.logoCircle}>OASIS</div><h3>Oasis Login</h3><input id="u" placeholder="Username" style={styles.loginInput} /><input id="p" type="password" placeholder="Password" style={styles.loginInput} /><button onClick={() => { if(document.getElementById('u').value.trim() === "Oasis" && document.getElementById('p').value === "Oasis@2000") { localStorage.setItem("isLoggedIn", "true"); onLogin(); } else { alert("Login Fail"); } }} style={styles.saveBtnSmall}>Login</button></div></div>
);

const styles = {
  appContainer: { backgroundColor: '#cbd5e1', minHeight: '100vh', overflowX: 'hidden' },
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
  serviceText: { margin: 0, fontSize: '13px', color: '#059669', fontWeight: 'bold' },
  invoiceBadge: { backgroundColor: '#059669', color: 'white', padding: '8px 40px', fontSize: '24px', fontWeight: 'bold', transform: 'skewX(-20deg)', marginRight: '-15mm' },
  infoGrid: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px' },
  infoLine: { display: 'flex', marginBottom: '4px' },
  invNoBox: { backgroundColor: '#1e293b', color: 'white', padding: '6px', textAlign: 'center', fontWeight: 'bold' },
  invInput: { background: 'transparent', border: 'none', borderBottom: '1px solid white', color: 'white', width: '70px', outline: 'none', textAlign: 'center' },
  dateBox: { borderBottom: '1px solid #ddd', textAlign: 'center', padding: '4px' },
  mainTable: { width: '100%', borderCollapse: 'collapse', marginBottom: '25px' },
  th: { border: '1px solid #94a3b8', padding: '10px', fontSize: '13px' },
  td: { border: '1px solid #94a3b8', padding: 0 },
  tdCenter: { border: '1px solid #94a3b8', textAlign: 'center', fontSize: '13px' },
  tdTotal: { border: '1px solid #94a3b8', textAlign: 'right', padding: '8px', fontWeight: 'bold', fontSize: '13px' },
  tdInput: { width: '100%', border: 'none', padding: '10px', outline: 'none', fontSize: '13px' },
  tdInputCenter: { width: '100%', border: 'none', textAlign: 'center', outline: 'none', fontSize: '13px' },
  tdInputRight: { width: '100%', border: 'none', textAlign: 'right', paddingRight: '5px', outline: 'none', fontSize: '13px' },
  footerLayout: { display: 'flex', justifyContent: 'space-between' },
  dottedSpan: { flex: 1, paddingLeft: '8px' },
  dottedInput: { width: '100%', border: 'none', borderBottom: '1px dotted black', outline: 'none', fontSize: '13px' },
  totalRow: { backgroundColor: '#059669', color: 'white', padding: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
  summaryRow: { backgroundColor: '#d1fae5', padding: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '2px solid white' },
  summaryInput: { border: 'none', background: 'transparent', textAlign: 'right', width: '80px', outline: 'none', fontWeight: 'bold' },
  sigArea: { display: 'flex', justifyContent: 'flex-end', marginTop: '40px' },
  sigBlock: { textAlign: 'center', width: '200px' },
  sigLine: { borderTop: '2px solid black', paddingTop: '5px', fontWeight: 'bold' },
  thanks: { textAlign: 'center', fontSize: '16px', fontWeight: 'bold', marginTop: '30px' },
  saveBtn: { width: '230mm', padding: '15px', backgroundColor: '#059669', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  loginPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0fdf4' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '320px', textAlign: 'center' },
  loginInput: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '8px', outline:'none' },
  saveBtnSmall: { width: '100%', padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor:'pointer' },
  dashboardArea: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' },
  historyItem: { background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }
};

export default App;
  
