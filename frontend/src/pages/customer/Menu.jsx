import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, Minus, Plus, Search, Loader, ChevronRight, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerMenu = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  
  // States for Search and Categories
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [foodPreference, setFoodPreference] = useState(localStorage.getItem('foodPreference') || 'Both');
  const [logoClicks, setLogoClicks] = useState(0);

  const handlePreferenceChange = (newPref) => {
    setFoodPreference(newPref);
    localStorage.setItem('foodPreference', newPref);
    setSelectedCategory('All'); // Reset category to avoid empty results
  };

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
  
  const customer = JSON.parse(localStorage.getItem('cafe_customer'));

  useEffect(() => {
    if (!customer) {
      navigate('/login');
      return;
    }
    
    // Ensure preference exists, otherwise send back
    const pref = localStorage.getItem('foodPreference');
    if (!pref) {
      navigate('/preference', { replace: true });
      return;
    }
    setFoodPreference(pref);

    fetchMenu();
    
    const savedCart = JSON.parse(localStorage.getItem('cafe_cart')) || [];
    setCart(savedCart);
  }, [navigate]);

  const fetchMenu = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('http://192.168.0.167:5000/api/menu');
      setMenuItems(res.data);
    } catch (error) {
      console.error('Error fetching menu', error);
      toast.error('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const getCartQuantity = (itemId) => {
    const item = cart.find(c => c._id === itemId);
    return item ? item.quantity : 0;
  };

  const updateCart = (item, delta) => {
    let newCart = [...cart];
    const existing = newCart.find(c => c._id === item._id);

    if (existing) {
      existing.quantity += delta;
      if (existing.quantity <= 0) {
        newCart = newCart.filter(c => c._id !== item._id);
      }
    } else if (delta > 0) {
      newCart.push({ ...item, quantity: 1 });
    }

    setCart(newCart);
    localStorage.setItem('cafe_cart', JSON.stringify(newCart));
  };

  // Derive Items based on preference first
  const preferenceFiltered = menuItems.filter(item => {
    if (foodPreference.toLowerCase() === 'both') return true;
    return item.type?.toLowerCase() === foodPreference.toLowerCase();
  });

  // Derive Categories dynamically
  const categories = ['All', ...new Set(preferenceFiltered.map(item => item.category || 'Uncategorized'))];
  
  // Filter logic for Search and UI tabs
  const filteredItems = preferenceFiltered.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.quantity * item.price), 0);

  return (
    <>
      <div className="app-container" style={{ background: 'var(--bg-cream)' }}>
        <div className="header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              onClick={handleLogoClick}
              style={{ cursor: 'pointer', background: 'var(--primary-color)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <UtensilsCrossed color="white" size={20} />
            </div>
            <h1 className="header-title" style={{ fontSize: '1.5rem' }}>Our Menu</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'right', fontWeight: '600', background: 'var(--secondary-color)', padding: '4px 12px', borderRadius: '12px' }}>
              Table {customer?.tableNumber}
            </div>
            {totalItems > 0 && (
              <button onClick={() => navigate('/cart')} className="header-icon-btn">
                <ShoppingBag size={22} />
                <span className="cart-badge">{totalItems}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sticky Search and Category Tabs */}
        <div style={{ padding: '1rem 1.5rem 0', position: 'sticky', top: 68, zIndex: 40, background: 'var(--bg-white)', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
            {[
              { id: 'Veg', label: 'Veg', color: '#1dd1a1' },
              { id: 'Non-Veg', label: 'Non-Veg', color: '#ff4757' },
              { id: 'Both', label: 'Both', color: 'var(--primary-color)' }
            ].map((pref) => (
              <button
                key={pref.id}
                onClick={() => handlePreferenceChange(pref.id)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  border: `2px solid ${foodPreference === pref.id ? pref.color : 'var(--glass-border)'}`,
                  background: foodPreference === pref.id ? pref.color : 'transparent',
                  color: foodPreference === pref.id ? 'white' : 'var(--text-dim)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: foodPreference === pref.id ? 'white' : pref.color 
                }}></div>
                {pref.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: 16, color: 'var(--primary-color)' }} />
            <input 
              type="text" 
              placeholder="Search for dishes..." 
              className="input-field" 
              style={{ paddingLeft: '44px', borderRadius: '12px', height: '48px', background: 'var(--bg-cream)', border: 'none' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <style dangerouslySetInnerHTML={{__html: `.hide-scroll::-webkit-scrollbar { display: none; }`}} />
          <div className="hide-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{ 
                  padding: '8px 18px', 
                  borderRadius: '20px', 
                  whiteSpace: 'nowrap', 
                  fontWeight: '700', 
                  fontSize: '0.85rem',
                  border: 'none',
                  background: selectedCategory === cat ? 'var(--primary-color)' : 'var(--bg-cream)', 
                  color: selectedCategory === cat ? 'white' : 'var(--text-dim)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '1.5rem', flex: 1, paddingBottom: '120px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
            {isLoading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
                <Loader style={{ animation: 'spin 2s linear infinite' }} size={48} color="var(--primary-color)" />
                <p style={{ fontWeight: '500' }}>Loading our delicious menu...</p>
              </div>
            ) : filteredItems.map((item, idx) => (
              <div key={item._id} className="cafe-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', animationDelay: `${idx * 0.05}s` }}>
                <div style={{ position: 'relative' }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '140px', background: 'var(--bg-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingBag color="var(--primary-color)" size={32} />
                    </div>
                  )}
                  <div style={{ 
                    position: 'absolute', top: '10px', right: '10px',
                    width: '24px', height: '24px', background: 'white', borderRadius: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ 
                      width: '8px', height: '8px', borderRadius: '50%', 
                      background: item.type?.toLowerCase() === 'veg' ? '#1dd1a1' : '#ff4757', 
                      border: `1px solid ${item.type?.toLowerCase() === 'veg' ? '#1dd1a1' : '#ff4757'}` 
                    }}></div>
                  </div>
                </div>
                
                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: '700', color: 'var(--primary-color)', minHeight: '2.4rem' }}>{item.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontWeight: '800', color: 'var(--primary-color)', fontSize: '1rem' }}>₹{item.price.toFixed(0)}</span>
                  </div>
                  
                  <div style={{ marginTop: '12px' }}>
                    {item.isAvailable ? (
                      getCartQuantity(item._id) > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-cream)', borderRadius: '12px', padding: '4px' }}>
                          <button onClick={() => updateCart(item, -1)} style={{ background: 'transparent', color: 'var(--primary-color)', border: 'none', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Minus size={14} />
                          </button>
                          <span style={{ fontWeight: '800', color: 'var(--primary-color)' }}>{getCartQuantity(item._id)}</span>
                          <button onClick={() => updateCart(item, 1)} style={{ background: 'transparent', color: 'var(--primary-color)', border: 'none', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => updateCart(item, 1)} className="btn-primary" style={{ padding: '8px 0', fontSize: '0.85rem', borderRadius: '10px', width: '100%' }}>
                          Add
                        </button>
                      )
                    ) : (
                      <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', fontWeight: '700', textAlign: 'center', display: 'block' }}>
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!isLoading && filteredItems.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-dim)' }}>
                <div style={{ marginBottom: '1rem', opacity: 0.5 }}>
                  <UtensilsCrossed size={48} style={{ margin: '0 auto' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No items available</h3>
                <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  {searchQuery ? `We couldn't find anything matching "${searchQuery}"` : `There are no ${foodPreference} items in this category yet.`}
                </p>
                {(searchQuery || selectedCategory !== 'All' || foodPreference !== 'Both') && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      handlePreferenceChange('Both');
                    }}
                    style={{ 
                      marginTop: '1.5rem', 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--primary-color)', 
                      fontWeight: '700', 
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {totalItems > 0 && (
        <div className="floating-cart-wrapper">
          <button onClick={() => navigate('/cart')} className="btn-primary" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', cursor: 'pointer', borderRadius: '16px', width: '100%', pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <ShoppingBag size={20} color="white" />
              </div>
              <span style={{ fontWeight: '700', fontSize: '1rem' }}>{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>₹{totalPrice.toFixed(0)}</span>
              <ChevronRight size={20} />
            </div>
          </button>
        </div>
      )}

    </>
  );
};

export default CustomerMenu;
