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
      await addDoc(collection(db, "invoices"), { invoiceNo, customer, rows, totalAmount, discount: discNum, balance, createdAt: serverTimestamp() });
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
        .excel-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5px solid #000; }
        .excel-table td { border: 1.5px solid #000; padding: 0; height: 35px; vertical-align: middle; }
        .excel-input { width: 100%; height: 100%; border: none; padding: 0 8px; outline: none; font-size: 13px; background: transparent; }
        .excel-input-center { width: 100%; height: 100%; border: none; text-align: center; outline: none; font-size: 13px; background: transparent; }
        
        .inv-badge-wrap { display: flex; height: 50px; overflow: hidden; }
        .badge-lime { background: #8ce100; width: 40px; clip-path: polygon(0 0, 100% 0, 40% 100%, 0 100%); }
        .badge-dark { background: #231f20; color: white; display: flex; align-items: center; padding: 0 40px 0 20px; font-size: 22px; font-weight: bold; clip-path: polygon(20% 0, 100% 0, 100% 100%, 0 100%); margin-left: -20px; letter-spacing: 2px; }
        
        .th-lime { background-color: #8ce100; color: #fff; border: 1.5px solid #000; padding: 10px; font-size: 13px; }
        .th-black { background-color: #231f20; color: #fff; border: 1.5px solid #000; padding: 10px; font-size: 13px; }

        .bottom-design { position: relative; height: 40px; width: 100%; margin-top: 20px; display: flex; justify-content: flex-end; }
        .design-black { background: #231f20; width: 150px; clip-path: polygon(20% 0, 100% 0, 100% 100%, 0 100%); }
        .design-lime { background: #8ce100; width: 300px; clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%); margin-left: -30px; }
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
                {/* Header */}
                <div style={styles.header}>
                  <div style={styles.headerLeft}>
                    <img src={OasisLogo} alt="Logo" style={styles.logoImage} onClick={() => setShowFullLogo(true)} />
                    <div style={styles.bizInfo}>
                      <h1 style={styles.bizTitle}>ကိုဌေးအောင် <span style={{color: '#231f20', fontSize: '28px', marginLeft:'10px'}}>OASIS</span></h1>
                      <p style={{...styles.serviceText, color: '#8ce100'}}>Refrigerator, Air-Conditioning Repair, Sales and Services</p>
                      <p style={styles.headerSmallText}>Address : B97/7, Nawaday Shophouse, Hlaingthaya Township, Yangon</p>
                      <p style={styles.headerSmallText}>Phone : 09-974 989 754, 09-421 097 839, 09-767 954 493</p>
                    </div>
                  </div>
                  <div style={styles.headerRight}>
                    <div className="inv-badge-wrap">
                      <div className="badge-lime"></div>
                      <div className="badge-dark">INVOICE</div>
                    </div>
                    <div style={styles.invNoBox}>INVOICE NO: {invoiceNo}</div>
                    <div style={styles.dateBox}>Invoice Date: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Table - Mixed Black/Lime Colors */}
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
                        <td><input className="excel-input" value={row.desc} onChange={e=>updateRow(i, 'desc', e.target.value)} /></td>
                        <td><input className="excel-input-center" value={row.unit} onChange={e=>updateRow(i, 'unit', e.target.value)} /></td>
                        <td><input className="excel-input-center" value={row.qty} onChange={e=>updateRow(i, 'qty', e.target.value)} /></td>
                        <td><input className="excel-input-center" value={row.price} onChange={e=>updateRow(i, "price", e.target.value)} /></td>
                        <td style={{textAlign:'right', paddingRight:'10px', fontSize:'12px', fontWeight:'bold'}}>{calculateTotal(row.qty, row.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer and Totals */}
                <div style={styles.footerFlex}>
                  <div style={styles.customerArea}>
                    <div style={styles.fRow}><span style={styles.fLabel}>Customer Name</span> : <input style={styles.footerIn} onChange={e=>setCustomer({...customer, name:e.target.value})} /></div>
                    <div style={styles.fRow}><span style={styles.fLabel}>Phone Number</span> : <input style={styles.footerIn} onChange={e=>setCustomer({...customer, phone:e.target.value})} /></div>
                    <div style={styles.fRow}><span style={styles.fLabel}>Address</span> : <input style={styles.footerIn} onChange={e=>setCustomer({...customer, address:e.target.value})} /></div>
                  </div>
                  <div style={styles.summaryArea}>
                    <div style={{...styles.sRow, background:'#8ce100', color:'#fff'}}>Total Amount <span style={{fontWeight:'bold'}}>{totalAmount.toLocaleString()}</span></div>
                    <div style={{...styles.sRow, background:'#b8e986'}}>Discount <input style={styles.sInput} value={discount} onChange={e=>setDiscount(formatComma(e.target.value))} /></div>
                    <div style={{...styles.sRow, background:'#8ce100', color:'#fff', fontWeight:'bold', borderBottom:'none'}}>Balance <span>{balance.toLocaleString()}</span></div>
                  </div>
                </div>

                {/* Signature and Bottom Design */}
                <div style={styles.signatureArea}>
                  <div style={styles.sigBox}>
                    <div style={{color:'#1e40af', fontSize:'24px', fontFamily:'cursive'}}>Zwe</div>
                    <div style={styles.sigLine}>Zwe Htet Naing</div>
                    <div style={{fontSize:'10px', fontWeight:'bold'}}>OASIS</div>
                  </div>
                </div>

                <p style={{fontSize:'14px', fontWeight:'bold', marginTop:'10px', marginLeft:'20px'}}>Thanks for your business!</p>
                
                {/* 🎨 Bottom Graphic Design */}
                <div className="bottom-design">
                  <div className="design-black"></div>
                  <div className="design-lime"></div>
                </div>
              </div>
            </div>
            <div style={styles.btnCenter}><button onClick={handleSaveAndCapture} style={styles.saveBtn}>SAVE & DOWNLOAD JPEG</button></div>
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
    </div>
  );
};

const InvoiceReadOnly = ({ data }) => (
  <div style={styles.a4Sheet}>
    <div style={styles.header}>
      <div style={styles.headerLeft}>
        <img src={OasisLogo} alt="Logo" style={styles.logoImage} />
        <div style={styles.bizInfo}><h1 style={styles.bizTitle}>ကိုဌေးအောင် <span>OASIS</span></h1><p style={{color:'#8ce100'}}>Air-Conditioning Services</p></div>
      </div>
      <div className="inv-badge-wrap"><div className="badge-lime"></div><div className="badge-dark">INVOICE</div></div>
    </div>
    <table className="excel-table">
      <thead><tr><th className="th-black">No.</th><th className="th-lime">Description</th><th className="th-black">Unit</th><th className="th-lime">Total</th></tr></thead>
      <tbody>{data.rows.map((r, i) => r.desc && <tr key={i}><td style={{textAlign:'center'}}>{i+1}</td><td style={{padding:'0 10px'}}>{r.desc}</td><td style={{textAlign:'center'}}>{r.unit}</td><td style={{textAlign:'right', paddingRight:'10px'}}>{(parseFloat(r.qty||0)*parseFloat(String(r.price||0).replace(/,/g,''))).toLocaleString()}</td></tr>)}</tbody>
    </table>
    <h3 style={{textAlign:'right', color:'#8ce100', marginTop:'20px'}}>Balance: {data.balance.toLocaleString()} Ks</h3>
    <div className="bottom-design"><div className="design-black"></div><div className="design-lime"></div></div>
  </div>
);

const LoginSection = ({ onLogin }) => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div style={styles.loginBg}><div style={styles.loginCard}><h2 style={{color: '#231f20'}}>OASIS LOGIN</h2><input placeholder="Username" style={styles.loginInput} onChange={(e) => setUser(e.target.value)} /><input type="password" placeholder="Password" style={styles.loginInput} onChange={(e) => setPass(e.target.value)} /><button onClick={() => { if(user.trim() === "Oasis" && pass === "Oasis@2000") onLogin(); }} style={{background:'#8ce100', border:'none', padding:'12px', borderRadius:'8px', width:'100%', fontWeight:'bold', cursor:'pointer'}}>Login</button></div></div>
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
  a4Sheet: { width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  headerLeft: { display: 'flex', gap: '15px', alignItems: 'center' },
  headerRight: { textAlign: 'right', display:'flex', flexDirection:'column', alignItems:'flex-end' },
  logoImage: { width: '90px', height: '90px', objectFit: 'cover' },
  bizTitle: { fontSize: '24px', margin: 0, color: '#333', fontWeight:'bold' },
  serviceText: { fontSize: '14px', margin: '3px 0', fontWeight: 'bold' },
  headerSmallText: { fontSize: '11px', margin: '2px 0', color: '#555', fontWeight:'bold' },
  invNoBox: { background: '#231f20', color: 'white', padding: '5px 15px', fontSize:'13px', fontWeight:'bold', marginTop:'5px' },
  dateBox: { fontSize:'11px', color:'#777', marginTop:'5px', fontWeight:'bold' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', marginTop: '25px' },
  customerArea: { flex: 1.5 },
  fRow: { display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '13px' },
  fLabel: { width: '110px', fontWeight: 'bold' },
  footerIn: { border:'none', borderBottom:'1px solid #8ce100', outline:'none', flex: 1, marginRight: '20px', background:'transparent' },
  summaryArea: { width: '250px', border: '1.5px solid #000' },
  sRow: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1.5px solid #000', fontSize:'12px' },
  sInput: { width: '80px', textAlign: 'right', border: 'none', outline: 'none', background:'transparent', fontWeight:'bold' },
  signatureArea: { marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingRight:'40px' },
  sigBox: { textAlign: 'center', width: '180px' },
  sigLine: { borderTop: '1.5px solid #000', marginTop: '5px', fontWeight:'bold' },
  saveBtn: { padding: '15px 50px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold', fontSize:'16px' },
  dashboardArea: { padding: '40px', maxWidth:'1000px', margin:'0 auto' },
  historyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
  hCard: { background: 'white', padding: '20px', borderRadius: '10px', borderLeft: '8px solid' },
  loginBg: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f0fdf4' },
  loginCard: { background:'white', padding:'40px', borderRadius:'15px', textAlign:'center', width: '380px' },
  loginInput: { display:'block', margin:'15px auto', padding:'12px', width:'100%', borderRadius:'8px', border:'1px solid #ccc' }
};

export default App;
