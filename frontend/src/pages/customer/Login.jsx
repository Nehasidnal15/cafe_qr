import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [tableError, setTableError] = useState('');
  const [logoClicks, setLogoClicks] = useState(0);

  useEffect(() => {
    if (logoClicks === 0) return;
    const timer = setTimeout(() => setLogoClicks(0), 3000);
    return () => clearTimeout(timer);
  }, [logoClicks]);

  const handleLogoClick = () => {
    const nextCount = logoClicks + 1;
    if (nextCount >= 5) {
      setLogoClicks(0);
      navigate('/admin/login');
    } else {
      setLogoClicks(nextCount);
    }
  };

  useEffect(() => {
    // Auto-fill table number from QR code parameter ?table=5
    const table = searchParams.get('table');
    if (table) {
      if (isNaN(table) || Number(table) <= 0) {
        toast.error('Invalid Table QR');
      } else {
        setTableNumber(table);
      }
    } else if (window.location.search && window.location.search.includes('?')) {
       // If there's a search string but no table, it's likely an invalid QR
       toast.error('Invalid Table QR');
    }
  }, [searchParams]);

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    // Allow only numeric input in real-time
    const numericVal = val.replace(/\D/g, ''); 
    setPhoneNumber(numericVal);
    
    if (numericVal.length > 0 && !/^[6-9]\d{9}$/.test(numericVal)) {
      setPhoneError('Must be exactly 10 digits starting with 6, 7, 8, or 9.');
    } else {
      setPhoneError('');
    }
  };

  const handleTableChange = (e) => {
    const val = e.target.value;
    setTableNumber(val);
    
    if (val !== '' && (isNaN(val) || Number(val) <= 0 || !Number.isInteger(Number(val)))) {
      setTableError('Table number must be a positive number (1, 2, 3...).');
    } else {
      setTableError('');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!customerName || !phoneNumber || !tableNumber) return toast.error('Please fill all fields');
    
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setPhoneError('Invalid phone number.');
      return;
    }

    if (!tableNumber || isNaN(tableNumber) || Number(tableNumber) <= 0 || !Number.isInteger(Number(tableNumber))) {
      setTableError('Table number must be a positive number.');
      return;
    }
    
    localStorage.setItem('customerName', customerName);
    localStorage.setItem('customerPhone', phoneNumber); 
    localStorage.setItem('tableNumber', tableNumber);
    localStorage.setItem('customerLoggedIn', 'true');
    
    localStorage.setItem('cafe_customer', JSON.stringify({ customerName, phoneNumber, tableNumber }));

    localStorage.removeItem('cafe_cart');
    localStorage.removeItem('cafe_ordered_history');
    localStorage.removeItem('foodPreference');
    
    navigate('/preference', { replace: true });
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', padding: '2rem', background: 'var(--bg-cream)' }}>
      <div className="cafe-card animate-fade-in" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div 
            onClick={handleLogoClick}
            className="float-animation" 
            style={{ cursor: 'pointer', background: 'var(--primary-color)', padding: '20px', borderRadius: '50%', boxShadow: '0 8px 25px rgba(111, 78, 55, 0.2)' }}
          >
            <UtensilsCrossed color="white" size={36} />
          </div>
        </div>
        <h1 className="header-title animate-fade-in" style={{ animationDelay: '0.1s', marginBottom: '0.5rem', fontSize: '1.8rem' }}>Welcome to Cafe</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', animationDelay: '0.2s', fontWeight: '500' }} className="animate-fade-in">Please enter your details to view our digital menu</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Your Name" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value.replace(/[0-9]/g, ''))}
              required
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <input 
              type="tel" 
              className="input-field" 
              placeholder="Phone Number" 
              value={phoneNumber}
              onChange={handlePhoneChange}
              maxLength={10}
              required
            />
            {phoneError && (
              <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', textAlign: 'left', margin: '8px 0 0 8px', fontWeight: '600' }}>
                {phoneError}
              </p>
            )}
          </div>
          <div className="animate-fade-in" style={{ position: 'relative', animationDelay: '0.5s' }}>
            <QrCode size={20} style={{ position: 'absolute', left: '16px', top: '18px', color: 'var(--primary-color)' }} />
            <input 
              type="number" 
              className="input-field" 
              placeholder="Table Number" 
              value={tableNumber}
              onChange={handleTableChange}
              style={{ paddingLeft: '48px' }}
              readOnly={!!searchParams.get('table')}
              min="1"
              required
            />
            {tableError && (
              <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', textAlign: 'left', margin: '8px 0 0 8px', fontWeight: '600' }}>
                {tableError}
              </p>
            )}
          </div>
          <button 
            type="submit" 
            className="btn-primary animate-fade-in" 
            style={{ marginTop: '1.5rem', animationDelay: '0.6s' }} 
            disabled={!!phoneError || !!tableError || !phoneNumber || phoneNumber.length !== 10 || !tableNumber}
          >
            View Menu
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerLogin;
