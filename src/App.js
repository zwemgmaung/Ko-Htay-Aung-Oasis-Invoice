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
  const [discount, setDiscount] = useState("");
  const [rows, setRows] = useState(Array.from({ length: 14 }, (_, i) => ({ id: i + 1, desc: "", unit: "", qty: "", price: "" })));

  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=yes');
    }
  }, []);

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
    const stringVal = String(val);
    if (stringVal.includes('%')) return stringVal;
    const num = stringVal.replace(/,/g, "");
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
  const getDiscountValue = () => {
    if (!discount) return 0;
    const cleanDisc = String(discount).replace(/,/g, '');
    if (cleanDisc.includes('%')) {
      const percent = parseFloat(cleanDisc.replace('%', '')) || 0;
      return (totalAmount * percent) / 100;
    }
    return parseFloat(cleanDisc) || 0;
  };
  const discountValue = getDiscountValue();
  const balance = totalAmount - discountValue;

  const handleSaveAndCapture = async () => {
    if (!invoiceRef.current) return;
    try {
      await addDoc(collection(db, "invoices"), { invoiceNo, customer, rows, totalAmount, discount, balance, createdAt: serverTimestamp() });
      const canvas = await html2canvas(invoiceRef.current, { 
        scale: 3, 
        useCORS: true, 
        backgroundColor: "#ffffff",
        windowWidth: 850
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      const link = document.createElement('a');
      link.download = `Oasis_Invoice_${invoiceNo}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) { console.error(e); }
  };

  if (!isLoggedIn) return <LoginSection onLogin={() => { localStorage.setItem("isLoggedIn", "true"); setIsLoggedIn(true); }} />;

  return (
    <div style={styles.appContainer}>
      <style>{`
        .excel-table { width: 750px; border-collapse: collapse; border: 1.5px solid #000; table-layout: fixed; margin: 0; }
        .excel-table td { border: 1.5px solid #000; padding: 0; height: 35px; vertical-align: middle; }
        .th-lime { background-color: #8ce100; color: #fff; border: 1.5px solid #000; padding: 8px; font-size: 13px; font-weight: bold; text-align: center; }
        .th-black { background-color: #231f20; color: #fff; border: 1.5px solid #000; padding: 8px; font-size: 13px; text-align: center; }
        .cell-container { display: flex; align-items: center; height: 100%; width: 100%; overflow: hidden; }
        .invoice-scroll-area { width: 100%; overflow-x: auto; padding: 20px 10px; background: #f4f7f6; }
      `}</style>
      <div className="no-print" style={styles.navBar}>
        <div style={styles.navLinks}>
          <button onClick={() => setActiveTab('invoice')} style={activeTab === 'invoice' ? styles.navBtnActive : styles.navBtn}>NEW INVOICE</button>
          <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? styles.navBtnActive : styles.navBtn}>HISTORY</button>
        </div>
        <button onClick={() => { localStorage.removeItem("isLoggedIn"); setIsLoggedIn(false); }} style={styles.logoutBtn}>LOGOUT</button>
      </div>

      <div style={{ marginTop: '70px' }}>
        {activeTab === 'invoice' ? (
          <div className="invoice-scroll-area">
            <div ref={invoiceRef} style={styles.a4Sheet}>
              <div style={styles.header}>
                <div style={styles.headerLeft}>
                  <img src={OasisLogo} alt="Logo" style={styles.logoImage} />
                  <div style={styles.bizInfo}>
                    <div style={{display:'flex', alignItems:'baseline'}}><span style={{fontSize:'22px', fontWeight:'bold'}}>Ko Htay Aung</span><h1 style={{fontSize:'22px', margin:'0 0 0 10px', color:'#231f20'}}>( OASIS )</h1></div>
                    <p style={{fontSize:'12px', color:'#8ce100', fontWeight:'bold', margin:'3px 0'}}>Refrigerator, Air-Conditioning Repair, Sales and Services</p>
                    <p style={styles.headerSmallText}>Address : B-97/7, Nawaday Shophouse, Hlaingtharyar Township, Yangon</p>
                    <p style={styles.headerSmallText}>Contact No. : 09-974 989 754, 09-421 097 839, 09-767 954 493</p>
                  </div>
                </div>
                <div style={styles.headerRight}>
                  <div style={styles.topLimeBox}>INVOICE</div>
                  <div style={styles.invNoBox}>INV NO: {invoiceNo}</div>
                  <div style={styles.dateBox}>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <table className="excel-table">
                <thead>
                  <tr>
                    <th className="th-black" style={{width: '40px'}}>No.</th>
                    <th className="th-lime" style={{width: '320px'}}>Item description</th>
                    <th className="th-black" style={{width: '70px'}}>Unit</th>
                    <th className="th-lime" style={{width: '70px'}}>Qty</th>
                    <th className="th-black" style={{width: '100px'}}>Price</th>
                    <th className="th-lime" style={{width: '150px'}}>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td style={{textAlign:'center', fontSize:'13px'}}>{i+1}</td>
                      <td><div className="cell-container"><input style={styles.cellInput} value={row.desc} onChange={e=>updateRow(i, 'desc', e.target.value)} /></div></td>
                      <td><div className="cell-container"><input style={styles.cellInputCenter} value={row.unit} onChange={e=>updateRow(i, 'unit', e.target.value)} /></div></td>
                      <td><div className="cell-container"><input style={styles.cellInputCenter} value={row.qty} onChange={e=>updateRow(i, 'qty', e.target.value)} /></div></td>
                      <td><div className="cell-container"><input style={styles.cellInputCenter} value={row.price} onChange={e=>updateRow(i, "price", e.target.value)} /></div></td>
                      <td style={{textAlign:'right', paddingRight:'10px', fontSize:'13px', fontWeight:'bold'}}>
                        <div className="cell-container" style={{justifyContent:'flex-end'}}>{calculateTotal(row.qty, row.price) > 0 ? calculateTotal(row.qty, row.price).toLocaleString() : ""}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={styles.footerFlex}>
                <div style={styles.customerArea}>
                  <div style={styles.fRow}><span style={styles.fLabel}>Customer Name</span> : <input style={styles.footerIn} onChange={e=>setCustomer({...customer, name:e.target.value})} /></div>
                  <div style={styles.fRow}><span style={styles.fLabel}>Contact No.</span> : <input style={styles.footerIn} onChange={e=>setCustomer({...customer, phone:e.target.value})} /></div>
                  <div style={styles.fRow}><span style={styles.fLabel}>Address</span> : <input style={styles.footerIn} onChange={e=>setCustomer({...customer, address:e.target.value})} /></div>
                </div>
                <div style={styles.summaryArea}>
                  <div style={{...styles.sRow, background:'#8ce100', borderBottom:'1.5px solid #000'}}>Total Amount <span style={{fontWeight:'bold'}}>{totalAmount.toLocaleString()}</span></div>
                  <div style={{...styles.sRow, background:'#231f20', color:'#fff', borderBottom:'1.5px solid #000'}}>Discount <input style={{...styles.sInput, color:'#fff'}} value={discount} onChange={e=>setDiscount(formatComma(e.target.value))} /></div>
                  <div style={{...styles.sRow, background:'#8ce100', fontWeight:'bold'}}>Balance <span>{balance.toLocaleString()}</span></div>
                </div>
              </div>

              <div style={styles.signatureArea}>
                <div style={styles.sigBox}>
                  <div style={{color:'#1e40af', fontSize:'22px', fontFamily:'cursive', marginBottom:'10px'}}>Zwe</div>
                  <div style={styles.sigLine}></div>
                  <div style={{fontSize:'14px', fontWeight:'bold', marginTop: '8px'}}>Zwe Htet Naing</div>
                  <div style={{fontSize:'12px', fontWeight:'bold'}}>( OASIS )</div>
                </div>
              </div>
              <p style={{fontSize:'13px', fontWeight:'bold', marginTop:'15px'}}>Thanks for your business!</p>
              <div style={styles.bottomGraphic}><div style={styles.botLime}></div><div style={styles.botBlack}></div></div>
            </div>
            <div style={styles.btnCenter}><button onClick={handleSaveAndCapture} style={styles.saveBtn}>SAVE & DOWNLOAD JPEG</button></div>
          </div>
        ) : (
          <div style={styles.dashboardArea}>
            <h2 style={{color:'#8ce100'}}>History Records</h2>
            <div style={styles.historyGrid}>{history.map(item => (<div key={item.id} style={styles.hCard} onClick={() => setSelectedInvoice(item)}><p>INV: {item.invoiceNo}</p><p>Total: {item.balance?.toLocaleString()} Ks</p></div>))}</div>
          </div>
        )}
      </div>

      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <button className="close-modal-btn" onClick={() => setSelectedInvoice(null)}>CLOSE [X]</button>
          <div className="modal-content-wrapper"><div onClick={e => e.stopPropagation()}><InvoiceReadOnly data={selectedInvoice} styles={styles} OasisLogo={OasisLogo} /></div></div>
        </div>
      )}
    </div>
  );
};

const InvoiceReadOnly = ({ data, styles, OasisLogo }) => (
  <div style={styles.a4Sheet}>
    <div style={styles.header}>
      <div style={styles.headerLeft}><img src={OasisLogo} alt="Logo" style={styles.logoImage} /><div style={styles.bizInfo}><div style={{display:'flex', alignItems:'baseline'}}><span style={{fontSize:'22px', fontWeight:'bold'}}>Ko Htay Aung</span><h1 style={{fontSize:'22px', margin:'0 0 0 10px', color:'#231f20'}}>( OASIS )</h1></div><p style={{fontSize:'12px', color:'#8ce100', fontWeight:'bold', margin:'3px 0'}}>Repair, Sales and Services</p><p style={styles.headerSmallText}>Address : B-97/7, Nawaday Shophouse, Yangon</p><p style={styles.headerSmallText}>Contact No. : 09-974 989 754, 09-421 097 839, 09-767 954 493</p></div></div>
      <div style={styles.headerRight}><div style={styles.topLimeBox}>INVOICE</div><div style={styles.invNoBox}>INV NO: {data.invoiceNo}</div><div style={styles.dateBox}>Date: {data.createdAt?.toDate().toLocaleDateString()}</div></div>
    </div>
    <table className="excel-table">
      <thead><tr><th className="th-black" style={{width:'40px'}}>No.</th><th className="th-lime" style={{width:'320px'}}>Description</th><th className="th-black" style={{width:'70px'}}>Unit</th><th className="th-lime" style={{width:'70px'}}>Qty</th><th className="th-black" style={{width:'100px'}}>Price</th><th className="th-lime" style={{width:'150px'}}>Total</th></tr></thead>
      <tbody>{data.rows.map((row, i) => {
          const rowTotal = (parseFloat(row.qty||0)*parseFloat(String(row.price||0).replace(/,/g,'')));
          return (<tr key={i}><td style={{textAlign:'center', fontSize:'13px'}}>{i+1}</td><td style={{padding:'0 10px', fontSize:'12px'}}>{row.desc}</td><td style={{textAlign:'center', fontSize:'12px'}}>{row.unit}</td><td style={{textAlign:'center', fontSize:'12px'}}>{row.qty}</td><td style={{textAlign:'center', fontSize:'12px'}}>{row.price}</td><td style={{textAlign:'right', paddingRight:'10px', fontSize:'13px', fontWeight:'bold'}}>{rowTotal > 0 ? rowTotal.toLocaleString() : ""}</td></tr>)
        })}</tbody>
    </table>
    <div style={styles.footerFlex}><div style={styles.customerArea}><p style={{fontSize:'14px'}}><strong>Name :</strong> {data.customer.name}</p><p style={{fontSize:'14px'}}><strong>Contact :</strong> {data.customer.phone}</p><p style={{fontSize:'14px'}}><strong>Address :</strong> {data.customer.address}</p></div><div style={styles.summaryArea}><div style={{...styles.sRow, background:'#8ce100'}}>Total <span>{data.totalAmount.toLocaleString()}</span></div><div style={{...styles.sRow, background:'#231f20', color:'#fff'}}>Disc <span>{data.discount}</span></div><div style={{...styles.sRow, background:'#8ce100', fontWeight:'bold', borderBottom:'none'}}>Balance <span>{data.balance.toLocaleString()}</span></div></div></div>
    <div style={styles.signatureArea}><div style={styles.sigBox}><div style={{color:'#1e40af', fontSize:'22px', fontFamily:'cursive', marginBottom:'10px'}}>Zwe</div><div style={styles.sigLine}></div><div style={{fontSize:'14px', fontWeight:'bold', marginTop:'8px'}}>Zwe Htet Naing</div><div style={{fontSize:'12px', fontWeight:'bold'}}>( OASIS )</div></div></div>
    <div style={styles.bottomGraphic}><div style={styles.botLime}></div><div style={styles.botBlack}></div></div>
  </div>
);

const LoginSection = ({ onLogin }) => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  return (
    <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f0fdf4'}}>
      <div style={{background:'white', padding:'40px', borderRadius:'15px', textAlign:'center', width:'350px', boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>
        <img src={OasisLogo} style={{width:'90px', borderRadius:'50%', marginBottom:'15px'}} alt="logo" />
        <h2 style={{marginBottom:'20px'}}>Ko Htay Aung ( OASIS )</h2>
        <input placeholder="Username" style={{display:'block', width:'100%', padding:'12px', marginBottom:'15px', borderRadius:'8px', border:'1px solid #ccc', boxSizing:'border-box'}} onChange={e=>setUser(e.target.value)} />
        <div style={{position:'relative', marginBottom:'20px'}}>
          <input type={showPass ? "text" : "password"} placeholder="Password" style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ccc', boxSizing:'border-box'}} onChange={e=>setPass(e.target.value)} />
          <span style={{position:'absolute', right:'10px', top:'12px', cursor:'pointer'}} onClick={()=>setShowPass(!showPass)}>{showPass ? "O" : "X"}</span>
        </div>
        <button onClick={()=>{if(user==="Oasis" && pass==="ZweHNaing@2026") onLogin()}} style={{width:'100%', padding:'12px', background:'#8ce100', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold'}}>Login</button>
      </div>
    </div>
  );
};

const styles = {
  appContainer: { backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' },
  navBar: { display: 'flex', justifyContent: 'center', background: '#231f20', padding: '10px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 },
  navLinks: { display: 'flex', gap: '20px' },
  navBtn: { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontWeight:'bold' },
  navBtnActive: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight:'bold', borderBottom:'3px solid #8ce100' },
  logoutBtn: { position:'absolute', right:'10px', background:'#dc2626', color:'white', border:'none', padding:'6px 12px', borderRadius:'5px', fontSize:'11px' },
  a4Sheet: { width: '800px', minHeight: '1100px', padding: '30px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', margin: '0 auto', boxShadow: '0 0 20px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  headerLeft: { display: 'flex', gap: '15px', alignItems: 'center', flex: 1 },
  headerRight: { textAlign: 'right', width: '250px' },
  logoImage: { width: '85px', height: '85px', objectFit: 'cover' },
  headerSmallText: { fontSize: '11px', margin: '2px 0', color: '#555', fontWeight:'bold' },
  topLimeBox: { background:'#8ce100', color:'white', padding:'8px', fontSize:'20px', fontWeight:'bold', textAlign:'center', marginBottom:'10px' },
  invNoBox: { background:'#231f20', color: 'white', padding: '5px 12px', fontSize:'12px', fontWeight:'bold', marginTop:'8px', display: 'inline-block' },
  dateBox: { fontSize:'11px', marginTop:'5px' },
  cellInput: { width: '100%', border: 'none', padding: '0 8px', outline: 'none', fontSize: '13px' },
  cellInputCenter: { width: '100%', border: 'none', textAlign: 'center', outline: 'none', fontSize: '13px' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', marginTop: '20px' },
  customerArea: { flex: 1, paddingTop: '10px' },
  fRow: { display: 'flex', alignItems: 'center', marginBottom: '8px' },
  fLabel: { width: '110px', fontWeight: 'bold', fontSize: '13px' },
  footerIn: { border:'none', borderBottom:'1.5px solid #8ce100', flex: 1, marginRight: '20px', fontSize: '13px', outline:'none' },
  summaryArea: { width: '260px', border: '1.5px solid #000' },
  sRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: '13px', alignItems: 'center', borderBottom: '1.5px solid #000' },
  sInput: { width: '80px', textAlign: 'right', border: 'none', outline: 'none', background:'transparent', fontWeight:'bold', fontSize:'13px' },
  signatureArea: { marginTop: '40px', display: 'flex', justifyContent: 'flex-end', paddingRight:'20px' },
  sigBox: { textAlign: 'center', width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  sigLine: { borderTop: '2px solid #000', width: '100%' },
  bottomGraphic: { marginTop: 'auto', position: 'relative', height: '60px', width: '750px' },
  botLime: { position: 'absolute', bottom: '15px', right: 0, width: '350px', height: '25px', background: '#8ce100', clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)' },
  botBlack: { position: 'absolute', bottom: 0, right: 0, width: '400px', height: '25px', background: '#231f20', clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0 100%)' },
  btnCenter: { textAlign:'center', padding: '30px' },
  saveBtn: { background:'#8ce100', color:'white', border:'none', padding:'15px 40px', borderRadius:'8px', fontWeight:'bold' }
};

export default App;
