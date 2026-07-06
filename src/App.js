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

  const clearForm = () => {
    setCustomer({ name: "", phone: "", address: "" });
    setDiscount("");
    setRows(Array.from({ length: 14 }, (_, i) => ({ id: i + 1, desc: "", unit: "", qty: "", price: "" })));
  };

  useEffect(() => {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(data);
      if (data.length === 0) setInvoiceNo("001");
      else {
        const lastInv = data[0].invoiceNo ? String(data[0].invoiceNo) : "0";
        const cleanNum = parseInt(lastInv.replace(/[^0-9]/g, ''));
        const nextNum = isNaN(cleanNum) ? 1 : cleanNum + 1;
        setInvoiceNo(nextNum.toString().padStart(3, '0'));
      }
    });
    return () => unsub();
  }, [invoiceNo]);

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = (field === "price") ? value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",") : value;
    setRows(newRows);
  };

  const calculateTotal = (qty, price) => {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(String(price).replace(/,/g, '')) || 0;
    return q * p;
  };

  const totalAmount = rows.reduce((sum, row) => sum + calculateTotal(row.qty, row.price), 0);
  const discountVal = (() => {
    const cleanDisc = String(discount).replace(/,/g, '');
    if (cleanDisc.includes('%')) return (totalAmount * (parseFloat(cleanDisc.replace('%', '')) || 0)) / 100;
    return parseFloat(cleanDisc) || 0;
  })();
  const balance = totalAmount - discountVal;

  const handleSaveAndCapture = async (ref, invNumber) => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 3, useCORS: true, backgroundColor: "#ffffff", windowWidth: 794 });
    const link = document.createElement('a');
    link.download = `Oasis_Invoice_${invNumber}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 1.0);
    link.click();
  };

  const saveInvoice = async () => {
    await addDoc(collection(db, "invoices"), { invoiceNo, customer, rows, totalAmount, discount, balance, createdAt: serverTimestamp() });
    await handleSaveAndCapture(invoiceRef, invoiceNo);
    clearForm();
    alert("သိမ်းဆည်းပြီးပါပြီ ကိုကို");
  };
    return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style>{`
        .excel-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; table-layout: fixed; }
        .excel-table th, .excel-table td { border: 1.5px solid #000; height: 45px; vertical-align: middle; text-align: center; padding: 0; box-sizing: border-box; }
        .cell-input { width: 100%; height: 45px; line-height: 45px; border: none; text-align: center; outline: none; font-size: 13px; background: transparent; font-weight: bold; }
        .cell-input-desc { width: 100%; height: 45px; line-height: 45px; border: none; text-align: left; padding-left: 10px; outline: none; font-size: 13px; background: transparent; }
      `}</style>
      {/* UI: Invoice Area */}
      <div style={{ width: '794px', padding: '40px', backgroundColor: 'white', margin: '20px auto' }} ref={invoiceRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div><h1 style={{fontSize:'22px'}}>Ko Htay Aung ( OASIS )</h1><p style={{fontSize:'12px'}}>Repair, Sales & Services</p></div>
          <div style={{ textAlign: 'right' }}><strong>INVOICE</strong><p>INV NO: {invoiceNo}</p></div>
        </div>
        <table className="excel-table">
          <thead>
            <tr style={{background:'#231f20', color:'#fff'}}><th>No.</th><th>Item description</th><th>Unit</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{height:'45px'}}>
                <td style={{fontWeight:'bold'}}>{i+1}</td>
                <td style={{padding:0}}><input className="cell-input-desc" value={row.desc} onChange={e=>updateRow(i, 'desc', e.target.value)} /></td>
                <td style={{padding:0}}><input className="cell-input" value={row.unit} onChange={e=>updateRow(i, 'unit', e.target.value)} /></td>
                <td style={{padding:0}}><input className="cell-input" value={row.qty} onChange={e=>updateRow(i, 'qty', e.target.value)} /></td>
                <td style={{padding:0}}><input className="cell-input" value={row.price} onChange={e=>updateRow(i, 'price', e.target.value)} /></td>
                <td style={{textAlign:'right', paddingRight:'10px', fontWeight:'bold'}}>{calculateTotal(row.qty, row.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={saveInvoice} style={{marginTop: '20px', padding: '15px 30px', background:'#8ce100'}}>SAVE & DOWNLOAD</button>
      </div>

      {/* History Area */}
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h2>History</h2>
        {history.map(item => (
          <div key={item.id} style={{ padding: '10px', background: 'white', marginBottom: '10px' }}>
            <p>INV: {item.invoiceNo}</p>
            <button onClick={() => setSelectedInvoice(item)}>View</button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default App;
        
