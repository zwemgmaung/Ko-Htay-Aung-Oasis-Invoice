import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Username ကို space ဖြတ်ပြီး စစ်ဆေးတဲ့ logic
    const validUsername = username.trim() === "Oasis";
    const validPassword = password === "Oasis@2000";

    if (validUsername && validPassword) {
      onLoginSuccess(); // Login အောင်မြင်ရင် Main App ကိုသွားမယ်
    } else {
      setError("Username သို့မဟုတ် Password မှားယွင်းနေပါတယ် ကိုကို");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo & Header Section */}
        <div style={styles.header}>
          <div style={styles.logoCircle}>OASIS</div>
          <h1 style={styles.title}>Ko Htay Aung ( Oasis )</h1>
          <p style={styles.subtitle}>Refrigerator, Air-Con Repair, Sales & Services</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          {/* Username Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username -</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Enter username"
            />
          </div>

          {/* Password Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password -</label>
            <div style={styles.passwordWrapper}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.inputPassword}
                placeholder="Enter password"
              />
              <span 
                onClick={() => setShowPassword(!showPassword)} 
                style={styles.eyeIcon}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.loginBtn}>Login</button>
        </form>
      </div>
    </div>
  );
};

// Simple Styles
const styles = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4' },
  card: { backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '350px', textAlign: 'center' },
  logoCircle: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', margin: '0 auto 15px' },
  title: { fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '5px' },
  subtitle: { fontSize: '12px', color: '#059669', fontStyle: 'italic', marginBottom: '30px' },
  inputGroup: { textAlign: 'left', marginBottom: '15px' },
  label: { display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: '600' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db', boxSizing: 'border-box' },
  passwordWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputPassword: { width: '100%', padding: '10px', paddingRight: '40px', borderRadius: '5px', border: '1px solid #d1d5db', boxSizing: 'border-box' },
  eyeIcon: { position: 'absolute', right: '10px', cursor: 'pointer', fontSize: '18px' },
  loginBtn: { width: '100%', padding: '12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  error: { color: 'red', fontSize: '12px', marginTop: '10px' }
};

export default Login;
           
