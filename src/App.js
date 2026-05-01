import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase-config';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import html2canvas from 'html2canvas';

const App = () => {
  const [activeTab, setActiveTab] = useState('invoice'); // 'dashboard' or 'invoice'
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [history, setHistory] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const invoiceRef = useRef(null);

  // Invoice Data States
  const [invoiceNo, setInvoiceNo] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [discount, setDiscount] = useState(0);
  const [rows, setRows] = useState(Array.from({ length: 14 }, (_, i) => ({ id: i + 1, desc: "", unit: "", qty: 0, price: 0 })));

  // Firebase ကနေ History ပြန်ခေါ်မယ်
  const fetchHistory = async () => {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setHistory(data);
  };

  useEffect(() => { if (activeTab === 'dashboard') fetchHistory(); }, [activeTab]);

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = (field === "desc" || field === "unit") ? value : Number(value);
    setRows(newRows);
  };

  const totalAmount = rows.reduce((sum, row) => sum + (row.qty * row.price), 0);
  const balance = totalAmount - discount;

  // JPEG အနေနဲ့ သိမ်းပြီး Print ထုတ်မယ်
  const handleSaveAndCapture = async () => {
    if (!invoiceRef.current) return;
    try {
      // ၁။ Firebase မှာ အရင်သိမ်းမယ်
      await addDoc(collection(db, "invoices"), {
        invoiceNo, customer, rows, totalAmount, discount, balance,
        createdAt: serverTimestamp(),
      });

      // ၂။ Screenshot ရိုက်ပြီး JPEG ထုတ်မယ်
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
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
      {/* Navigation Tabs */}
      <div className="no-print" style={styles.tabBar}>
        <button onClick={() => {setActiveTab('invoice'); setSelectedInvoice(null);}} style={activeTab === 'invoice' ? styles.activeTab : styles.tab}>New Invoice</button>
        <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? styles.activeTab : styles.tab}>Invoice History</button>
        <button onClick={() => {localStorage.removeItem("isLoggedIn"); setIsLoggedIn(false);}} style={styles.logoutTab}>Logout</button>
      </div>

      {activeTab === 'invoice' ? (
        <div style={styles.contentArea}>
          <div ref={invoiceRef} style={styles.a4Sheet}>
             {/* Header Section */}
             <div style={styles.header}>
               <div style={styles.headerLeft}>
                 <div style={styles.logoCircle}>Logo</div>
                 <div style={styles.bizIdentity}>
                   <h1 style={styles.bizTitle}>Ko Htay Aung</h1>
                   <h2 style={styles.bizSub}>( Oasis )</h2>
                   <p style={styles.serviceText}>Refrigerator, Washing Machine & Air-Conditioning</p>
                   <p style={styles.serviceText}>Repair, Sales and Services</p>
                 </div>
               </div>
               <div style={styles.invoiceBadge}>INVOICE</div>
             </div>

             {/* Address & Meta */}
             <div style={styles.infoGrid}>
               <div style={styles.addressSection}>
                 <div style={styles.infoLine}><strong>Address</strong> <span>: B97/7, Nawaday Shophouse, Hlaingthaya Township, Yangon</span></div>
                 <div style={styles.infoLine}><strong>Contact No.</strong> <span>: 09-421 097 839, 09-795 954 493</span></div>
                 <div style={styles.infoLine}><strong></strong> <span style={{paddingLeft:'12px'}}>09-974 989 754</span></div>
               </div>
               <div style={styles.metaSection}>
                 <div style={styles.invNoBox}>INV NO: <input style={styles.invInput} onChange={e=>setInvoiceNo(e.target.value)} /></div>
                 <div style={styles.dateBox}>Date: {new Date().toLocaleDateString()}</div>
               </div>
             </div>

             {/* Table */}
             <table style={styles.mainTable}>
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

             {/* Footer Totals */}
             <div style={styles.footerLayout}>
               <div style={styles.customerInfo}>
                 <div style={styles.infoLine}><strong>Customer Name</strong> <span>: <input style={styles.dottedInput} onChange={e=>setCustomer({...customer, name: e.target.value})} /></span></div>
                 <div style={styles.infoLine}><strong>Contact No.</strong> <span>: <input style={styles.dottedInput} onChange={e=>setCustomer({...customer, phone: e.target.value})} /></span></div>
                 <div style={styles.infoLine}><strong>Address</strong> <span>: <input style={styles.dottedInput} onChange={e=>setCustomer({...customer, address: e.target.value})} /></span></div>
               </div>
               <div style={styles.summaryBox}>
                 <div style={styles.totalRow}><span>Total Amount</span> <span>{totalAmount.toLocaleString()}</span></div>
                 <div style={styles.summaryRow}><span>Discount</span> <input style={styles.summaryInput} onChange={e=>setDiscount(Number(e.target.value))} /></div>
                 <div style={styles.summaryRow}><span>Balance</span> <span>{balance.toLocaleString()}</span></div>
               </div>
             </div>

             <div style={styles.sigArea}>
                <div style={styles.sigBlock}>
                  <div style={styles.cursive}>Zwe</div>
                  <div style={styles.sigLine}>Zwe Htet Naing</div>
                  <div>OASIS</div>
                </div>
             </div>
             <p style={styles.thanks}>Thanks for your business!</p>
          </div>
          <button onClick={handleSaveAndCapture} style={styles.saveBtn}>Save to Firebase & Download JPEG</button>
        </div>
      ) : (
        <div style={styles.dashboardArea}>
          <h2>Invoice History Dashboard</h2>
          <div style={styles.historyList}>
            {history.map(item => (
              <div key={item.id} style={styles.historyItem} onClick={() => setSelectedInvoice(item)}>
                <span>📄 {item.invoiceNo || 'No ID'}</span>
                <span>👤 {item.customer?.name || 'Unknown'}</span>
                <span>💰 {item.balance?.toLocaleString()} Ks</span>
              </div>
            ))}
          </div>
          {selectedInvoice && <InvoiceViewer data={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
        </div>
      )}
    </div>
  );
};

// Login & Viewer Components as Sub-sections...
const LoginSection = ({ onLogin }) => (
  <div style={styles.loginPage}>
    <div style={styles.loginCard}>
      <div style={styles.logoCircle}>OASIS</div>
      <h3>Ko Htay Aung (Oasis) Login</h3>
      <input id="u" placeholder="Username" style={styles.loginInput} />
      <input id="p" type="password" placeholder="Password" style={styles.loginInput} />
      <button onClick={() => { if(document.getElementById('u').value.trim() === "Oasis" && document.getElementById('p').value === "Oasis@2000") { localStorage.setItem("isLoggedIn", "true"); onLogin(); } }} style={styles.saveBtn}>Login</button>
    </div>
  </div>
);

const InvoiceViewer = ({ data, onClose }) => (
  <div style={styles.overlay}>
    <div style={{...styles.a4Sheet, transform:'scale(0.8)', marginTop:'-50px'}}>
      <button onClick={onClose} style={styles.closeBtn}>Close</button>
      {/* ဇယားနဲ့ Header တွေကို အပေါ်ကအတိုင်း data pass ပြီး ပြန်ပြတဲ့ logic... */}
      <h1 style={{textAlign:'center'}}>Invoice Record: {data.invoiceNo}</h1>
      <p>Customer: {data.customer.name}</p>
      <p>Total: {data.totalAmount.toLocaleString()}</p>
      {/* (မှတ်ချက်။ ။ Viewer မှာ UI အပြည့်ပြန်ထည့်ရပါမယ်) */}
    </div>
  </div>
);

const styles = {
  appContainer: { backgroundColor: '#f1f5f9', minHeight: '100vh' },
  tabBar: { display: 'flex', backgroundColor: '#1e293b', padding: '10px 20px', gap: '10px' },
  tab: { padding: '10px 20px', color: 'white', border: 'none', background: 'transparent', cursor: 'pointer' },
  activeTab: { padding: '10px 20px', color: 'white', borderBottom: '3px solid #059669', background: '#334155', fontWeight: 'bold' },
  logoutTab: { marginLeft: 'auto', padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px' },
  contentArea: { padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  a4Sheet: { width: '230mm', minHeight: '297mm', padding: '20mm', backgroundColor: 'white', boxShadow: '0 0 20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #059669', paddingBottom: '10px', marginBottom: '20px' },
  headerLeft: { display: 'flex', gap: '25px', alignItems: 'center' },
  logoCircle: { width: '90px', height: '90px', border: '3px solid #059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#059669' },
  bizIdentity: { textAlign: 'center' },
  bizTitle: { fontSize: '32px', margin: 0 },
  bizSub: { fontSize: '24px', margin: '0 0 5px 0' },
  serviceText: { margin: 0, fontSize: '14px', color: '#059669', fontWeight: 'bold' },
  invoiceBadge: { backgroundColor: '#059669', color: 'white', padding: '10px 50px', fontSize: '28px', fontWeight: 'bold', transform: 'skewX(-20deg)', marginRight: '-20mm' },
  infoGrid: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '14px' },
  infoLine: { display: 'flex', marginBottom: '5px' },
  addressSection: { flex: 2 },
  metaSection: { flex: 1 },
  invNoBox: { backgroundColor: '#1e293b', color: 'white', padding: '8px', textAlign: 'center', fontWeight: 'bold' },
  invInput: { background: 'transparent', border: 'none', borderBottom: '1px solid white', color: 'white', width: '80px', outline: 'none', textAlign: 'center' },
  dateBox: { borderBottom: '1px solid #ddd', textAlign: 'center', padding: '5px' },
  mainTable: { width: '100%', borderCollapse: 'collapse', marginBottom: '30px' },
  tableHeader: { backgroundColor: '#059669', color: 'white' },
  thNo: { width: '40px', border: '1px solid #ddd', padding: '10px' },
  thDesc: { border: '1px solid #ddd', padding: '10px' },
  thUnit: { width: '80px', border: '1px solid #ddd' },
  thQty: { width: '60px', border: '1px solid #ddd' },
  thPrice: { width: '120px', border: '1px solid #ddd' },
  thTotal: { width: '140px', border: '1px solid #ddd' },
  td: { border: '1px solid #ddd', padding: 0 },
  tdCenter: { border: '1px solid #ddd', textAlign: 'center' },
  tdTotal: { border: '1px solid #ddd', textAlign: 'right', padding: '8px', fontWeight: 'bold' },
  tdInput: { width: '100%', border: 'none', padding: '10px', outline: 'none' },
  tdInputCenter: { width: '100%', border: 'none', textAlign: 'center', outline: 'none' },
  tdInputRight: { width: '100%', border: 'none', textAlign: 'right', paddingRight: '5px', outline: 'none' },
  footerLayout: { display: 'flex', justifyContent: 'space-between' },
  customerInfo: { flex: 1.5 },
  dottedInput: { flex: 1, border: 'none', borderBottom: '1px dotted black', outline: 'none', paddingLeft: '5px' },
  summaryBox: { flex: 1 },
  totalRow: { backgroundColor: '#059669', color: 'white', padding: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
  summaryRow: { backgroundColor: '#d1fae5', padding: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '2px solid white' },
  summaryInput: { border: 'none', background: 'transparent', textAlign: 'right', width: '80px', outline: 'none', fontWeight: 'bold' },
  sigArea: { display: 'flex', justifyContent: 'flex-end', marginTop: '50px' },
  sigBlock: { textAlign: 'center', width: '220px' },
  cursive: { fontFamily: 'cursive', fontSize: '28px' },
  sigLine: { borderTop: '2px solid black', paddingTop: '5px', fontWeight: 'bold' },
  thanks: { textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginTop: '40px' },
  saveBtn: { width: '230mm', padding: '20px', backgroundColor: '#059669', color: 'white', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '20px' },
  dashboardArea: { padding: '40px', maxWidth: '1000px', margin: '0 auto' },
  historyList: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' },
  historyItem: { background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }
};

export default App;
               
