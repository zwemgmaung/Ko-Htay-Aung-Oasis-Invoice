import React, { useState } from 'react';
import { db } from './firebase-config';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function App() {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });

  const handleSave = async () => {
    try {
      await addDoc(collection(db, "invoices"), {
        invoiceNo,
        customer,
        date: serverTimestamp(),
      });
      alert("Invoice သိမ်းပြီးပါပြီ ကိုကို");
      window.print();
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h2 style={{color: '#059669'}}>OASIS Invoice Generator</h2>
      <div style={{marginBottom: '15px'}}>
        <input placeholder="Invoice No" style={{width:'100%', padding:'10px', marginBottom:'10px'}} onChange={(e)=>setInvoiceNo(e.target.value)} />
        <input placeholder="Customer Name" style={{width:'100%', padding:'10px', marginBottom:'10px'}} onChange={(e)=>setCustomer({...customer, name: e.target.value})} />
        <input placeholder="Phone Number" style={{width:'100%', padding:'10px', marginBottom:'10px'}} onChange={(e)=>setCustomer({...customer, phone: e.target.value})} />
      </div>
      <button onClick={handleSave} style={{ background: '#059669', color: 'white', padding: '12px 25px', border: 'none', borderRadius: '5px', width: '100%', fontWeight: 'bold' }}>
        Save & Print
      </button>
    </div>
  );
}

export default App;


