import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Invoice Data States
  const [invoiceNo, setInvoiceNo] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [discount, setDiscount] = useState(0);
  
  // Table Rows (14 rows)
  const [rows, setRows] = useState(
    Array.from({ length: 14 }, (_, i) => ({ id: i + 1, desc: "", unit: "", qty: 0, price: 0 }))
  );

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() === "Oasis" && password === "Oasis@2000") {
      localStorage.setItem("isLoggedIn", "true");
      setIsLoggedIn(true);
    } else { alert("Login Fail!"); }
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = (field === "desc" || field === "unit") ? value : Number(value);
    setRows(newRows);
  };

  const totalAmount = rows.reduce((sum, row) => sum + (row.qty * row.price), 0);
  const balance = totalAmount - discount;

  const handleSaveInvoice = async () => {
    try {
      await addDoc(collection(db, "invoices"), {
        invoiceNo, customer, rows, totalAmount, discount, balance,
        createdAt: serverTimestamp(),
      });
      alert("အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ ကိုကို!");
      window.print();
    } catch (e) { alert("Error: " + e.message); }
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginCenter}>
        <div style={styles.loginCard}>
          <div style={styles.logoCircle}>OASIS</div>
          <h2 style={{color: '#1e293b'}}>LOGIN</h2>
          <input placeholder="Username" style={styles.loginInput} onChange={e => setUsername(e.target.value)} />
          <div style={{position:'relative'}}>
            <input type={showPassword ? "text" : "password"} style={styles.loginInput} placeholder="Password" onChange={e => setPassword(e.target.value)} />
            <span style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "👁️" : "👁️‍🗨️"}</span>
          </div>
          <button onClick={handleLogin} style={styles.loginBtn}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.bodyWrapper}>
      <div style={styles.a4Container}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.mainLogo}>Logo</div>
            <div>
              <h1 style={styles.bizTitle}>Ko Htay Aung</h1>
              <h2 style={styles.bizSub}>( Oasis )</h2>
              <p style={styles.serviceText}>Refrigerator, Washing Machine & Air-Conditioning</p>
              <p style={styles.serviceText}>Repair, Sales and Services</p>
            </div>
          </div>
          <div style={styles.invoiceBadge}>INVOICE</div>
        </div>

        {/* Address Row */}
        <div style={styles.infoRow}>
          <div style={styles.addressArea}>
            <p><strong>Address :</strong> B97/7, Nawaday Shophouse, Hlaingthaya Township, Yangon</p>
            <p><strong>Contact No. :</strong> 09-421 097 839, 09-795 954 493</p>
            <p style={{marginLeft: '85px'}}>09-974 989 754</p>
          </div>
          <div style={styles.metaArea}>
            <div style={styles.invNoBox}>
              <strong>INV NO:</strong> 
              <input style={styles.invNoInput} value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} />
            </div>
            <div style={styles.dateBox}>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div style={styles.tableWrapper}>
          <table style={styles.mainTable}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={{...styles.th, width: '40px'}}>No.</th>
                <th style={styles.th}>Item Description</th>
                <th style={{...styles.th, width: '80px'}}>Unit</th>
                <th style={{...styles.th, width: '60px'}}>Qty</th>
                <th style={{...styles.th, width: '100px'}}>Price</th>
                <th style={{...styles.th, width: '120px'}}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td style={styles.tdId}>{row.id}</td>
                  <td style={styles.td}><input style={styles.tableInput} value={row.desc} onChange={e => updateRow(index, "desc", e.target.value)} /></td>
                  <td style={styles.td}><input style={styles.tableInput} value={row.unit} onChange={e => updateRow(index, "unit", e.target.value)} /></td>
                  <td style={styles.td}><input style={styles.tableInputCenter} type="number" onChange={e => updateRow(index, "qty", e.target.value)} /></td>
                  <td style={styles.td}><input style={styles.tableInputRight} type="number" onChange={e => updateRow(index, "price", e.target.value)} /></td>
                  <td style={styles.tdTotal}>{(row.qty * row.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Section */}
        <div style={styles.footerRow}>
          <div style={styles.custInfo}>
            <div style={styles.custInputRow}><strong>Customer Name:</strong> <input style={styles.dottedInput} onChange={e=>setCustomer({...customer, name: e.target.value})} /></div>
            <div style={styles.custInputRow}><strong>Contact No:</strong> <input style={styles.dottedInput} onChange={e=>setCustomer({...customer, phone: e.target.value})} /></div>
            <div style={styles.custInputRow}><strong>Address:</strong> <input style={styles.dottedInput} onChange={e=>setCustomer({...customer, address: e.target.value})} /></div>
          </div>
          <div style={styles.summaryArea}>
            <div style={styles.totalRowGreen}><span>Total Amount</span> <span>{totalAmount.toLocaleString()}</span></div>
            <div style={styles.summaryRow}><span>Discount</span> <input style={styles.summaryInput} type="number" onChange={e=>setDiscount(Number(e.target.value))} /></div>
            <div style={styles.summaryRow}><span>Balance</span> <span>{balance.toLocaleString()}</span></div>
          </div>
        </div>

        <div style={styles.signatureRow}>
            <div style={styles.sigBox}>
              <div style={styles.sigSign}>Zwe</div>
              <div style={styles.sigLine}>Zwe Htet Naing</div>
              <div>OASIS</div>
            </div>
        </div>

        <p style={styles.thanksText}>Thanks for your business!</p>

        <div className="no-print" style={styles.actionArea}>
          <button onClick={handleSaveInvoice} style={styles.savePrintBtn}>Save to Firebase & Print</button>
          <button onClick={() => { localStorage.removeItem("isLoggedIn"); setIsLoggedIn(false); }} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  bodyWrapper: { backgroundColor: '#cbd5e1', minHeight: '100vh', padding: '20px', display: 'flex', justifyContent: 'center' },
  a4Container: { backgroundColor: 'white', width: '210mm', padding: '15mm', boxShadow: '0 0 20px rgba(0,0,0,0.2)', position: 'relative', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #059669', paddingBottom: '10px', marginBottom: '15px' },
  headerLeft: { display: 'flex', gap: '20px', alignItems: 'center' },
  mainLogo: { width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#059669' },
  bizTitle: { fontSize: '26px', margin: 0, color: '#1e293b' },
  bizSub: { fontSize: '20px', margin: 0, color: '#1e293b' },
  serviceText: { margin: 0, fontSize: '13px', color: '#059669', fontWeight: 'bold' },
  invoiceBadge: { backgroundColor: '#059669', color: 'white', padding: '10px 40px', fontSize: '24px', fontWeight: 'bold', transform: 'skewX(-20deg)', marginRight: '-15mm' },
  infoRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px' },
  addressArea: { flex: 2 },
  metaArea: { flex: 1, textAlign: 'right' },
  invNoBox: { backgroundColor: '#1e293b', color: 'white', padding: '5px 10px', display: 'flex', justifyContent: 'center', gap: '5px' },
  invNoInput: { background: 'transparent', border: 'none', color: 'white', outline: 'none', borderBottom: '1px solid white', width: '80px', textAlign: 'center' },
  dateBox: { borderBottom: '1px solid #94a3b8', padding: '5px', marginTop: '5px', textAlign: 'center' },
  tableWrapper: { overflowX: 'auto' },
  mainTable: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
  tableHeader: { backgroundColor: '#059669', color: 'white' },
  th: { border: '1px solid #ddd', padding: '10px', fontSize: '13px' },
  td: { border: '1px solid #ddd', padding: '0' },
  tdId: { border: '1px solid #ddd', textAlign: 'center', fontSize: '13px' },
  tdTotal: { border: '1px solid #ddd', textAlign: 'right', padding: '8px', fontSize: '13px', fontWeight: 'bold' },
  tableInput: { width: '100%', border: 'none', padding: '8px', outline: 'none', fontSize: '13px' },
  tableInputCenter: { width: '100%', border: 'none', padding: '8px', outline: 'none', fontSize: '13px', textAlign: 'center' },
  tableInputRight: { width: '100%', border: 'none', padding: '8px', outline: 'none', fontSize: '13px', textAlign: 'right' },
  footerRow: { display: 'flex', justifyContent: 'space-between', marginTop: '10px' },
  custInfo: { flex: 1.5, display: 'flex', flexDirection: 'column', gap: '10px' },
  custInputRow: { fontSize: '14px', display: 'flex', gap: '5px' },
  dottedInput: { flex: 1, border: 'none', borderBottom: '1px dotted #000', outline: 'none' },
  summaryArea: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  totalRowGreen: { backgroundColor: '#059669', color: 'white', padding: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
  summaryRow: { backgroundColor: '#d1fae5', color: '#065f46', padding: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
  summaryInput: { background: 'transparent', border: 'none', outline: 'none', textAlign: 'right', width: '80px', color: '#065f46', fontWeight: 'bold' },
  signatureRow: { display: 'flex', justifyContent: 'flex-end', marginTop: '40px' },
  sigBox: { textAlign: 'center', width: '200px' },
  sigSign: { fontFamily: 'cursive', fontSize: '24px', marginBottom: '5px' },
  sigLine: { borderTop: '1px solid black', paddingTop: '5px', fontWeight: 'bold' },
  thanksText: { textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginTop: '30px' },
  actionArea: { marginTop: '20px', display: 'flex', gap: '10px' },
  savePrintBtn: { flex: 4, padding: '15px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  logoutBtn: { flex: 1, padding: '15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  loginCenter: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0fdf4' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '350px', textAlign: 'center' },
  logoCircle: { width: '70px', height: '70px', borderRadius: '50%', background: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontWeight: 'bold' },
  loginInput: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none' },
  eyeIcon: { position: 'absolute', right: '15px', top: '12px', cursor: 'pointer' },
  loginBtn: { width: '100%', padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};

export default App;
          
