import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const App = () => {
  // Login Persistence
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Invoice States
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toLocaleDateString());
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [items, setItems] = useState([{ id: 1, desc: "", unit: "", qty: 1, price: 0 }]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() === "Oasis" && password === "Oasis@2000") {
      localStorage.setItem("isLoggedIn", "true");
      setIsLoggedIn(true);
    } else {
      setError("Username သို့မဟုတ် Password မှားနေပါတယ် ကိုကို");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  const handleSaveInvoice = async () => {
    const total = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    try {
      await addDoc(collection(db, "invoices"), {
        invoiceNo, customer, items, total, date: serverTimestamp(),
      });
      alert("Invoice သိမ်းပြီးပါပြီ ကိုကို!");
      window.print();
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.logoCircle}>OASIS</div>
          <h1 style={styles.title}>Ko Htay Aung ( Oasis )</h1>
          <p style={styles.subtitle}>Refrigerator, Air-Con Repair, Sales & Services</p>
          <form onSubmit={handleLogin}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username -</label>
              <input type="text" style={styles.input} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password -</label>
              <div style={styles.passwordWrapper}>
                <input type={showPassword ? "text" : "password"} style={styles.input} onChange={(e) => setPassword(e.target.value)} />
                <span onClick={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</span>
              </div>
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" style={styles.loginBtn}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.mainPage}>
      {/* Input Area (Hidden during print) */}
      <div className="no-print" style={styles.inputArea}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
          <h2 style={{color: '#059669', margin: 0}}>Invoice Input Form</h2>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
        <div style={styles.grid}>
          <input placeholder="Invoice No" style={styles.inputField} onChange={(e)=>setInvoiceNo(e.target.value)} />
          <input placeholder="Customer Name" style={styles.inputField} onChange={(e)=>setCustomer({...customer, name: e.target.value})} />
          <input placeholder="Phone" style={styles.inputField} onChange={(e)=>setCustomer({...customer, phone: e.target.value})} />
          <input placeholder="Address" style={styles.inputField} onChange={(e)=>setCustomer({...customer, address: e.target.value})} />
        </div>
        <button onClick={handleSaveInvoice} style={styles.saveBtn}>Save & Print Invoice</button>
      </div>

      {/* Invoice Template (Final Layout) */}
      <div id="invoice-render" style={styles.invoiceSheet}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoAndText}>
            <div style={styles.invoiceLogo}>Logo</div>
            <div>
              <h1 style={styles.bizName}>Ko Htay Aung</h1>
              <h2 style={styles.bizSub}>( Oasis )</h2>
              <p style={styles.bizService}>Refrigerator, Washing Machine & Air-Conditioning</p>
              <p style={styles.bizService}>Repair, Sales and Services</p>
            </div>
          </div>
          <div style={styles.invoiceTag}>INVOICE</div>
        </div>

        {/* Contact Info Section */}
        <div style={styles.infoRow}>
          <div style={styles.contactSide}>
            <p><strong>Address :</strong> B97/7, Nawaday Shophouse, Hlaingthaya Township, Yangon</p>
            <p><strong>Contact No. :</strong> 09-421 097 839, 09-795 954 493</p>
            <p style={{marginLeft: '95px'}}>09-974 989 754</p>
          </div>
          <div style={styles.metaSide}>
            <div style={styles.metaBox}><strong>INVOICE NO:</strong> {invoiceNo}</div>
            <div style={styles.metaBoxDate}><strong>Invoice Date:</strong> {invoiceDate}</div>
          </div>
        </div>

        {/* Table */}
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHead}>
              <th style={styles.th}>No.</th>
              <th style={styles.th}>Item description</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Total Price</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{height: '35px'}}>
              <td style={styles.tdCenter}>1.</td>
              <td style={styles.td}>Midea AC Universal Card Change</td>
              <td style={styles.tdCenter}>IDU</td>
              <td style={styles.tdCenter}>1set</td>
              <td style={styles.tdRight}></td>
              <td style={styles.tdRight}>200,000</td>
            </tr>
            {[...Array(8)].map((_, i) => (
              <tr key={i} style={{height: '35px'}}><td style={styles.td}></td><td style={styles.td}></td><td style={styles.td}></td><td style={styles.td}></td><td style={styles.td}></td><td style={styles.td}></td></tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={styles.footerRow}>
          <div style={styles.customerBox}>
            <p><strong>Customer Name :</strong> {customer.name}</p>
            <p><strong>Phone Number :</strong> {customer.phone}</p>
            <p><strong>Address :</strong> {customer.address}</p>
          </div>
          <div style={styles.summaryBox}>
            <div style={styles.summaryItem}><span>Total Amount</span> <span>200,000</span></div>
            <div style={styles.summaryItemEmpty}>Discount</div>
            <div style={styles.summaryItemEmpty}>Balance</div>
          </div>
        </div>

        {/* Signature */}
        <div style={styles.signatureArea}>
          <div style={styles.sigContainer}>
            <div style={styles.sigName}>Zwe</div>
            <p style={styles.sigLine}>Zwe Htet Naing</p>
            <p>OASIS</p>
          </div>
        </div>

        <p style={styles.thanks}>Thanks for your business!</p>
      </div>
    </div>
  );
};

const styles = {
  loginContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4' },
  loginCard: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '320px', textAlign: 'center' },
  logoCircle: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontWeight: 'bold' },
  title: { fontSize: '18px', marginBottom: '5px' },
  subtitle: { fontSize: '11px', color: '#059669', marginBottom: '20px' },
  inputGroup: { textAlign: 'left', marginBottom: '15px' },
  label: { fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '5px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' },
  passwordWrapper: { position: 'relative' },
  eyeIcon: { position: 'absolute', right: '10px', top: '10px', cursor: 'pointer' },
  loginBtn: { width: '100%', padding: '12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  
  mainPage: { padding: '20px', backgroundColor: '#e2e8f0', minHeight: '100vh' },
  inputArea: { maxWidth: '800px', margin: '0 auto 30px', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' },
  inputField: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px' },
  saveBtn: { width: '100%', padding: '15px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  logoutBtn: { padding: '5px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },

  // Invoice Styles
  invoiceSheet: { width: '210mm', minHeight: '297mm', padding: '20mm', backgroundColor: 'white', margin: '0 auto', boxShadow: '0 0 20px rgba(0,0,0,0.2)', position: 'relative' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #059669', paddingBottom: '10px', marginBottom: '20px' },
  logoAndText: { display: 'flex', gap: '20px', alignItems: 'center' },
  invoiceLogo: { width: '80px', height: '80px', border: '2px solid #059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontSize: '12px', fontWeight: 'bold' },
  bizName: { fontSize: '28px', margin: 0, fontWeight: 'bold', color: '#1f293b' },
  bizSub: { fontSize: '20px', margin: 0, color: '#1f293b' },
  bizService: { margin: 0, fontSize: '13px', color: '#059669', fontWeight: 'bold' },
  invoiceTag: { backgroundColor: '#059669', color: 'white', padding: '10px 30px', fontSize: '24px', fontWeight: 'bold', transform: 'skewX(-20deg)', marginRight: '-20px' },
  
  infoRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '13px' },
  contactSide: { flex: 2 },
  metaSide: { flex: 1, textAlign: 'right' },
  metaBox: { backgroundColor: '#1f293b', color: 'white', padding: '5px 10px', marginBottom: '5px', textAlign: 'center' },
  metaBoxDate: { borderBottom: '1px solid #ddd', padding: '5px', textAlign: 'center' },
  
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
  tableHead: { backgroundColor: '#059669', color: 'white' },
  th: { border: '1px solid #ddd', padding: '8px' },
  td: { border: '1px solid #ddd', padding: '8px' },
  tdCenter: { border: '1px solid #ddd', padding: '8px', textAlign: 'center' },
  tdRight: { border: '1px solid #ddd', padding: '8px', textAlign: 'right' },

  footerRow: { display: 'flex', justifyContent: 'space-between' },
  customerBox: { flex: 1.5, fontSize: '14px' },
  summaryBox: { flex: 1 },
  summaryItem: { backgroundColor: '#059669', color: 'white', padding: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '5px' },
  summaryItemEmpty: { backgroundColor: '#d1fae5', color: '#065f46', padding: '8px', fontWeight: 'bold', marginBottom: '5px', textAlign: 'left' },

  signatureArea: { display: 'flex', justifyContent: 'flex-end', marginTop: '40px' },
  sigContainer: { textAlign: 'center', width: '200px' },
  sigName: { fontSize: '24px', fontFamily: 'cursive', color: '#1f293b' },
  sigLine: { borderTop: '1px solid black', marginTop: '5px', fontWeight: 'bold' },
  thanks: { textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginTop: '50px' }
};

export default App;
    
