import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const App = () => {
  // LocalStorage ထဲမှာ login ဝင်ထားဖူးသလားဆိုတာကို အရင်စစ်မယ်
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [invoiceNo, setInvoiceNo] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });

  // Login ဝင်တဲ့အခါ အောင်မြင်ရင် localStorage ထဲမှာ မှတ်ထားမယ်
  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() === "Oasis" && password === "Oasis@2000") {
      localStorage.setItem("isLoggedIn", "true");
      setIsLoggedIn(true);
    } else {
      setError("Username သို့မဟုတ် Password မှားနေပါတယ် ကိုကို");
    }
  };

  // Logout ထွက်တဲ့အခါ localStorage ထဲက data ကို ဖျက်ပစ်မယ်
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  const handleSaveInvoice = async () => {
    try {
      await addDoc(collection(db, "invoices"), {
        invoiceNo, customer, date: serverTimestamp(),
      });
      alert("Invoice သိမ်းပြီးပါပြီ ကိုကို!");
      window.print();
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
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
            <button type="submit" style={styles.button}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2 style={{color: '#059669'}}>OASIS Invoice Generator</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
      <input placeholder="Invoice No" style={styles.inputBlock} onChange={(e)=>setInvoiceNo(e.target.value)} />
      <input placeholder="Customer Name" style={styles.inputBlock} onChange={(e)=>setCustomer({...customer, name: e.target.value})} />
      <input placeholder="Phone" style={styles.inputBlock} onChange={(e)=>setCustomer({...customer, phone: e.target.value})} />
      <button onClick={handleSaveInvoice} style={styles.button}>Save & Print</button>
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4' },
  card: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '320px', textAlign: 'center' },
  logoCircle: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontWeight: 'bold' },
  title: { fontSize: '18px', marginBottom: '5px' },
  subtitle: { fontSize: '11px', color: '#059669', marginBottom: '20px' },
  inputGroup: { textAlign: 'left', marginBottom: '15px' },
  label: { fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '5px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' },
  inputBlock: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd' },
  passwordWrapper: { position: 'relative' },
  eyeIcon: { position: 'absolute', right: '10px', top: '10px', cursor: 'pointer' },
  button: { width: '100%', padding: '12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  logoutBtn: { backgroundColor: '#ef4444', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '12px' },
  error: { color: 'red', fontSize: '12px', marginBottom: '10px' }
};

export default App;
    
