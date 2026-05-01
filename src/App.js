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
  const [discount, setDiscount] = useState(0);
  const [rows, setRows] = useState(Array.from({ length: 14 }, (_, i) => ({ id: i + 1, desc: "", unit: "", qty: "", price: "" })));

  // 🔢 Realtime History & Invoice No Reset Logic
  useEffect(() => {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(data);
      
      // ကိုကိုပြောတဲ့အတိုင်း data မရှိရင် 001 ကပြန်စမယ်
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
      alert("သိမ်းဆည်းပြီးပါပြီ ကိုကို!");
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
        .rotate-logo { transition: transform 0.5s ease; transform: rotate(-20deg); filter: drop-shadow(0 4px 6px rgba(16,185,129,0.2)); cursor: zoom-in; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 2000; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; align-items: center; }
        .logo-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.95); z-index: 3000; display: flex; justify-content: center; align-items: center; }
      `}</style>

      {/* Navbar Fixed */}
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
                {/* Header */}
                <div style={styles.header}>
                  <div style={styles.headerLeft}>
                    <img src={OasisLogo} alt="Logo" className="rotate-logo" style={styles.logoImage} onClick={() => setShowFullLogo(true)} />
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

                {/* Table - Excel Style */}
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
                        <td><input className="excel-input-center" value={row.price} onChange={e=>updateRow(i, 'price', e.target.value)} /></td>
                        <td style={{textAlign:'right', paddingRight:'10px', fontWeight:'bold', fontSize:'13px'}}>{calculateTotal(row.qty, row.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer and Sig */}
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
                <div style={styles.signatureArea}><div style={styles.sigBox}><div style={styles.sigName}>Zwe</div><div style={styles.sigLine}>Zwe Htet Naing</div><div style={{fontSize:'11px'}}>OASIS</div></div></div>
              </div>
            </div>
            <div style={styles.btnCenter}><button onClick={handleSaveAndCapture} style={styles.saveBtn}>SAVE & DOWNLOAD JPEG</button></div>
          </div>
        ) : (
          <div style={styles.dashboardArea}>
            <h2 style={{color:'#065f46'}}>History Records</h2>
            <div style={styles.historyGrid}>
              {history.map(item => (
                <div key={item.id} style={styles.hCard} onClick={() => setSelectedInvoice(item)}>
                  <p><strong>INV:</strong> {item.invoiceNo}</p>
                  <p><strong>Name:</strong> {item.customer?.name || 'N/A'}</p>
                  <p style={{color:'#10b981'}}><strong>Total:</strong> {item.balance?.toLocaleString()} Ks</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History Modal Viewer - ဒီမှာ ပုံပေါ်အောင် Fix လုပ်ထားပါတယ်ရှင် */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <button style={styles.closeModal} onClick={() => setSelectedInvoice(null)}>CLOSE [X]</button>
          <div onClick={e => e.stopPropagation()}>
            <InvoiceReadOnly data={selectedInvoice} />
          </div>
        </div>
      )}

      {showFullLogo && ( <div className="logo-modal" onClick={() => setShowFullLogo(false)}><img src={OasisLogo} alt="Full" style={{ maxWidth: '90%', maxHeight: '90%' }} /></div> )}
    </div>
  );
};

// ... Styles, LoginSection and InvoiceReadOnly (Same as high-fidelity version) ...
                                       
