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
  
  // Table Rows (14 rows as requested)
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
    newRows[index][field] = field === "desc" || field === "unit" ? value : Number(value);
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
      alert("Firebase မှာ သိမ်းဆည်းပြီးပါပြီ ကိုကို!");
      window.print();
    } catch (e) { alert("Error: " + e.message); }
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginCenter}>
        <div style={styles.loginCard}>
          <h2>OASIS LOGIN</h2>
          <input placeholder="Username" style={styles.input} onChange={e => setUsername(e.target.value)} />
          <div style={{position:'relative'}}>
            <input type={showPassword ? "text" : "password"} style={styles.input} placeholder="Password" onChange={e => setPassword(e.target.value)} />
            <span style={{position:'absolute', right:10, top:10}} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "👁️" : "👁️‍🗨️"}</span>
          </div>
          <button onClick={handleLogin} style={styles.btnGreen}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.mobileWrapper}>
      {/* Printable Invoice Area */}
      <div id="invoice" style={styles.invoiceA4}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.logoGroup}>
            <div style={styles.logoCircle}>Logo</div>
            <div>
              <h1 style={styles.bizTitle}>Ko Htay Aung</h1>
              <h2 style={styles.bizSub}>( Oasis )</h2>
              <p style={styles.bizText}>Refrigerator, Washing Machine & Air-Conditioning</p>
              <p style={styles.bizText}>Repair, Sales and Services</p>
            </div>
          </div>
          <div style={styles.invoiceLabel}>INVOICE</div>
        </div>

        {/* Address & Meta */}
        <div style={styles.metaRow}>
          <div style={{flex:2, fontSize:'11px'}}>
            <p><strong>Address:</strong> B97/7, Nawaday Shophouse, Hlaingthaya Township, Yangon</p>
            <p><strong>Contact:</strong> 09-421 097 839, 09-795 954 493, 09-974 989 754</p>
          </div>
          <div style={{flex:1, textAlign:'right'}}>
             <div style={styles.blackBox}>INV NO: <input style={styles.invInput} value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} /></div>
             <p style={styles.dateText}>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Dynamic Table */}
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>No.</th>
              <th style={styles.th}>Item Description</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td style={styles.tdCenter}>{row.id}</td>
                <td style={styles.td}><input style={styles.tableInput} value={row.desc} onChange={e => updateRow(index, "desc", e.target.value)} /></td>
                <td style={styles.td}><input style={styles.tableInput} value={row.unit} onChange={e => updateRow(index, "unit", e.target.value)} /></td>
                <td style={styles.td}><input style={styles.tableInput} type="number" onChange={e => updateRow(index, "qty", e.target.value)} /></td>
                <td style={styles.td}><input style={styles.tableInput} type="number" onChange={e => updateRow(index, "price", e.target.value)} /></td>
                <td style={styles.tdRight}>{(row.qty * row.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer & Totals */}
        <div style={styles.footerGrid}>
          <div style={styles.customerSection}>
            <p>Customer Name: <input style={styles.bottomInput} onChange={e=>setCustomer({...customer, name: e.target.value})} /></p>
            <p>Contact No: <input style={styles.bottomInput} onChange={e=>setCustomer({...customer, phone: e.target.value})} /></p>
            <p>Address: <input style={styles.bottomInput} onChange={e=>setCustomer({...customer, address: e.target.value})} /></p>
          </div>
          <div style={styles.totalSection}>
            <div style={styles.totalRowGreen}><span>Total Amount</span> <span>{totalAmount.toLocaleString()}</span></div>
            <div style={styles.totalRowLight}><span>Discount</span> <input style={styles.totalInput} type="number" onChange={e=>setDiscount(Number(e.target.value))} /></div>
            <div style={styles.totalRowLight}><span>Balance</span> <span>{balance.toLocaleString()}</span></div>
          </div>
        </div>

        <button className="no-print" onClick={handleSaveInvoice} style={styles.saveBtn}>Save to Firebase & Print</button>
      </div>
    </div>
  );
};

const styles = {
  mobileWrapper: { backgroundColor: '#f4f4f4', padding: '10px', minHeight: '100vh', display: 'flex', justifyContent: 'center' },
  invoiceA4: { backgroundColor: 'white', width: '100%', maxWidth: '800px', padding: '15px', position: 'relative', boxShadow: '0 0 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #059669', paddingBottom: '10px' },
  logoGroup: { display: 'flex', gap: '10px', alignItems: 'center' },
  logoCircle: { width: '50px', height: '50px', borderRadius: '50%', border: '1px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' },
  bizTitle: { fontSize: '18px', margin: 0 },
  bizSub: { fontSize: '14px', margin: 0 },
  bizText: { fontSize: '10px', margin: 0, color: '#059669' },
  invoiceLabel: { backgroundColor: '#059669', color: 'white', padding: '5px 20px', fontWeight: 'bold', transform: 'skewX(-15deg)' },
  metaRow: { display: 'flex', marginTop: '10px', marginBottom: '10px' },
  blackBox: { backgroundColor: '#1e293b', color: 'white', padding: '3px 10px', fontSize: '11px' },
  invInput: { background: 'transparent', border: 'none', color: 'white', width: '60px', outline: 'none' },
  dateText: { borderBottom: '1px solid #ccc', fontSize: '11px', marginTop: '5px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  thRow: { backgroundColor: '#059669', color: 'white' },
  th: { border: '1px solid #ddd', padding: '5px', fontSize: '11px' },
  td: { border: '1px solid #ddd', padding: '2px' },
  tdCenter: { border: '1px solid #ddd', textAlign: 'center', fontSize: '11px' },
  tdRight: { border: '1px solid #ddd', textAlign: 'right', padding: '5px', fontSize: '11px' },
  tableInput: { width: '100%', border: 'none', outline: 'none', padding: '5px', fontSize: '11px' },
  footerGrid: { display: 'flex', marginTop: '20px', gap: '20px' },
  customerSection: { flex: 1.5, fontSize: '11px' },
  bottomInput: { border: 'none', borderBottom: '1px dotted #000', outline: 'none', width: '70%' },
  totalSection: { flex: 1 },
  totalRowGreen: { backgroundColor: '#059669', color: 'white', padding: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' },
  totalRowLight: { backgroundColor: '#d1fae5', padding: '8px', display: 'flex', justifyContent: 'space-between', marginTop: '2px' },
  totalInput: { width: '60px', border: 'none', background: 'transparent', textAlign: 'right' },
  saveBtn: { width: '100%', marginTop: '30px', padding: '15px', backgroundColor: '#059669', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  loginCenter: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0fdf4' },
  loginCard: { background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '300px' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' },
  btnGreen: { width: '100%', padding: '10px', background: '#059669', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }
};

export default App;
          
