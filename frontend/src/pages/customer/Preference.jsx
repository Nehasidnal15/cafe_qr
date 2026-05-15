import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Flame, Utensils, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerPreference = () => {
  const navigate = useNavigate();
  const [preference, setPreference] = useState('');
  const customer = JSON.parse(localStorage.getItem('cafe_customer'));

  useEffect(() => {
    if (!customer) {
      navigate('/login', { replace: true });
    }
  }, [customer, navigate]);

  const handleContinue = () => {
    if (!preference) {
      return toast.error('Please select a food preference to continue');
    }
    localStorage.setItem('foodPreference', preference);
    navigate('/menu');
  };

  const options = [
    { id: 'Veg', label: 'Veg', icon: <Leaf size={28} />, color: '#1dd1a1', desc: 'Show only vegetarian dishes' },
    { id: 'Non-Veg', label: 'Non-Veg', icon: <Flame size={28} />, color: '#ff4757', desc: 'Show only non-vegetarian dishes' },
    { id: 'Both', label: 'Both', icon: <Utensils size={28} />, color: '#feca57', desc: 'Show all delicious items' },
  ];

  return (
    <div className="app-container" style={{ justifyContent: 'center', padding: '2rem', background: 'var(--bg-cream)' }}>
      <div className="cafe-card animate-fade-in" style={{ textAlign: 'center' }}>
        <h1 className="header-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Select Food Preference</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', fontWeight: '500' }}>Customize your menu experience</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {options.map((opt) => (
            <div 
              key={opt.id}
              onClick={() => setPreference(opt.id)}
              className="animate-fade-in"
              style={{ 
                padding: '1.2rem', 
                borderRadius: '16px', 
                background: preference === opt.id ? 'var(--secondary-color)' : 'var(--bg-white)',
                border: `2px solid ${preference === opt.id ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left'
              }}
            >
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '12px', 
                background: preference === opt.id ? 'var(--primary-color)' : 'var(--bg-cream)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: preference === opt.id ? 'white' : 'var(--primary-color)',
                transition: 'all 0.3s ease'
              }}>
                {opt.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.1rem' }}>{opt.label}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: '500' }}>{opt.desc}</p>
              </div>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                border: `2px solid ${preference === opt.id ? 'var(--primary-color)' : 'var(--secondary-color)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px'
              }}>
                {preference === opt.id && <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--primary-color)' }}></div>}
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleContinue}
          className="btn-primary" 
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={!preference}
        >
          Continue <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default CustomerPreference;
