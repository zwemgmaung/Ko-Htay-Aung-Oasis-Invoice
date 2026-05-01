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
  const formatNum = (num) => num === 0 ? "" : num.toLocaleString();

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
        .excel-table th { border: 1px solid black; background-color: #10b981; color: white; padding: 8px; font-size: 14px; }
        .excel-table td { border: 1px solid black; padding: 0; height: 35px; vertical-align: middle; }
        .excel-input { width: 100%; height: 100%; border: none; padding: 0 8px; outline: none; font-size: 13px; box-sizing: border-box; display: block; }
        .excel-input-center { width: 100%; height: 100%; border: none; text-align: center; outline: none; font-size: 13px; box-sizing: border-box; display: block; }
        .rotate-logo { transform: rotate(-20deg); filter: drop-shadow(0 4px 6px rgba(16,185,129,0.2)); }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 2000; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; align-items: center; }
      `}</style>

      {/* Nav Bar - စာသားဖြုတ်ထားပါတယ် */}
      <div style={styles.navBar}>
        <div style={styles.navLinks}>
          <button onClick={() => setActiveTab('invoice')} style={activeTab === 'invoice' ? styles.navBtnActive : styles.navBtn}>NEW INVOICE</button>
          <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? styles.navBtnActive : styles.navBtn}>HISTORY</button>
        </div>
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

              {/* Excel Table Structure */}
              <table className="excel-table">
                <thead>
                  <tr>
                    <th style={{width: '45px'}}>No.</th>
                    <th>Item Description</th>
                    <th style={{width: '70px'}}>Unit</th>
                    <th style={{width: '60px'}}>Qty</th>
                    <th style={{width: '100px'}}>Price</th>
                    <th style={{width: '120px'}}>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td style={{textAlign:'center', fontSize:'13px'}}>{i+1}</td>
                      <td><input className="excel-input" value={row.desc} onChange={e=>updateRow(i, 'desc', e.target.value)} /></td>
                      <td><input className="excel-input-center" value={row.unit} onChange={e=>updateRow(i, 'unit', e.target.value)} /></td>
                      <td><input className="excel-input-center" value={row.qty} onChange={e=>updateRow(i, 'qty', e.target.value)} /></td>
                      <td><input className="excel-input-center" value={row.price} onChange={e=>updateRow(i, 'price', e.target.value)} /></td>
                      <td style={{textAlign:'right', paddingRight:'10px', fontWeight:'bold', fontSize:'13px'}}>
                        {calculateTotal(row.qty, row.price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Section */}
              <div style={styles.footerFlex}>
                <div style={styles.customerArea}>
                  <p>Name: <input style={styles.underlinedInput} onChange={e=>setCustomer({...customer, name:e.target.value})} /></p>
                  <p>Phone: <input style={styles.underlinedInput} onChange={e=>setCustomer({...customer, phone:e.target.value})} /></p>
                </div>
                <div style={styles.summaryArea}>
                  <div style={styles.summaryRow}>Total: <span>{totalAmount.toLocaleString()}</span></div>
                  <div style={styles.summaryRow}>Discount: <input style={styles.summaryInput} onChange={e=>setDiscount(Number(e.target.value))} /></div>
                  <div style={{...styles.summaryRow, backgroundColor:'#d1fae5', fontWeight:'bold'}}>Balance: <span>{balance.toLocaleString()}</span></div>
                </div>
              </div>
              <div style={styles.signatureSection}><div style={styles.sigBox}><div style={styles.sigName}>Zwe</div><div style={styles.sigLine}>Zwe Htet Naing</div></div></div>
            </div>
          </div>
          <div style={{textAlign:'center', marginTop:'20px'}}><button onClick={handleSaveAndCapture} style={styles.mainSaveBtn}>SAVE INVOICE</button></div>
        </div>
      ) : (
        /* History View */
        <div style={styles.dashboardArea}>
          <h2>History List</h2>
          <div style={styles.historyGrid}>
            {history.map(item => (
              <div key={item.id} style={styles.historyCard} onClick={() => setSelectedInvoice(item)}>
                <p>INV: {item.invoiceNo}</p>
                <p>Customer: {item.customer?.name}</p>
              </div>
            ))}
          </div>
          {selectedInvoice && (
            <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
              <button style={styles.closeBtn} onClick={() => setSelectedInvoice(null)}>CLOSE [X]</button>
              <div onClick={e => e.stopPropagation()}><InvoiceReadOnly data={selectedInvoice} /></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InvoiceReadOnly = ({ data }) => (
  <div style={styles.a4Sheet}>
    <h2 style={{color:'#10b981'}}>Invoice {data.invoiceNo}</h2>
    <table className="excel-table">
      <thead><tr><th>No.</th><th>Description</th><th>Qty</th><th>Total</th></tr></thead>
      <tbody>{data.rows.map((row, i) => (
        <tr key={i}>
          <td style={{textAlign:'center'}}>{i+1}</td>
          <td style={{paddingLeft:'10px'}}>{row.desc}</td>
          <td style={{textAlign:'center'}}>{row.qty}</td>
          <td style={{textAlign:'right', paddingRight:'10px'}}>{(parseFloat(row.qty || 0) * parseFloat(String(row.price || 0).replace(/,/g,''))).toLocaleString()}</td>
        </tr>
      ))}</tbody>
    </table>
    <div style={{marginTop:'20px', textAlign:'right', fontWeight:'bold'}}>Balance: {data.balance.toLocaleString()} Ks</div>
  </div>
);

const LoginSection = ({ onLogin }) => (
  <div style={styles.loginBg}><div style={styles.loginCard}><h3>OASIS LOGIN</h3><input id="u" placeholder="User" style={styles.loginInput}/><input id="p" type="password" placeholder="Pass" style={styles.loginInput}/><button onClick={() => onLogin()} style={styles.mainSaveBtn}>Login</button></div></div>
);

const styles = {
  appContainer: { backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' },
  navBar: { display: 'flex', justifyContent: 'center', background: '#065f46', padding: '15px' },
  navLinks: { display: 'flex', gap: '20px' },
  navBtn: { background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', fontWeight:'bold' },
  navBtnActive: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight:'bold', borderBottom:'2px solid white' },
  scrollWrapper: { padding: '20px 0' },
  invoiceOuter: { width: 'fit-content', margin: '0 auto' },
  a4Sheet: { width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #10b981', paddingBottom: '10px', marginBottom: '20px' },
  headerLeft: { display: 'flex', gap: '15px', alignItems: 'center' },
  logoImage: { width: '70px', height: '70px', borderRadius: '50%', border: '2px solid #10b981' },
  bizTitle: { fontSize: '22px', margin: 0 },
  bizSub: { color: '#10b981' },
  serviceText: { fontSize: '11px', margin: 0, color: '#666' },
  invoiceBadge: { background: '#10b981', color: 'white', padding: '10px 30px', fontWeight: 'bold' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', marginTop: '20px' },
  customerArea: { flex: 1 },
  underlinedInput: { border: 'none', borderBottom: '1px solid black', outline: 'none', width: '200px', marginLeft: '10px' },
  summaryArea: { width: '250px', border: '1px solid black' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee' },
  summaryInput: { width: '80px', textAlign: 'right', border: 'none', outline: 'none' },
  signatureSection: { marginTop: '40px', display: 'flex', justifyContent: 'flex-end' },
  sigBox: { textAlign: 'center', width: '150px' },
  sigName: { fontFamily: 'cursive', fontSize: '20px' },
  sigLine: { borderTop: '1px solid black', marginTop: '5px' },
  mainSaveBtn: { padding: '10px 40px', background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' },
  dashboardArea: { padding: '40px' },
  historyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
  historyCard: { background: 'white', padding: '15px', borderRadius: '8px', cursor: 'pointer', borderLeft: '5px solid #10b981' },
  closeBtn: { background: 'red', color: 'white', border: 'none', padding: '10px', marginBottom: '10px', cursor: 'pointer' },
  loginBg: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center' },
  loginCard: { background:'white', padding:'30px', borderRadius:'10px', textAlign:'center' },
  loginInput: { display:'block', margin:'10px auto', padding:'10px' }
};

export default App;
