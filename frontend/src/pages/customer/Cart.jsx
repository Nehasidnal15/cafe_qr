import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config';

const CustomerCart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [orderedHistory, setOrderedHistory] = useState([]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const customer = JSON.parse(localStorage.getItem('cafe_customer'));

  useEffect(() => {
    if (!customer) {
      navigate('/login');
      return;
    }
    const savedCart = JSON.parse(localStorage.getItem('cafe_cart')) || [];
    setCart(savedCart);
    const savedHistory = JSON.parse(localStorage.getItem('cafe_ordered_history')) || [];
    setOrderedHistory(savedHistory);
  }, [navigate]);

  const updateCart = (itemId, delta) => {
    let newCart = [...cart];
    const existing = newCart.find(c => c.id === itemId);

    if (existing) {
      existing.quantity += delta;
      if (existing.quantity <= 0) {
        newCart = newCart.filter(c => c.id !== itemId);
      }
    }
    setCart(newCart);
    localStorage.setItem('cafe_cart', JSON.stringify(newCart));
  };

  const removeItem = (itemId) => {
    const newCart = cart.filter(c => c.id !== itemId);
    setCart(newCart);
    localStorage.setItem('cafe_cart', JSON.stringify(newCart));
  };

  const calculateTotal = () => {
    return cart.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    setIsSubmitting(true);

    const orderData = {
      customerName: customer.customerName,
      customerPhone: customer.phoneNumber,
      tableNumber: customer.tableNumber,
      items: cart.map(item => ({
        id: item.id,
        menuItemId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        status: 'Placed'
      })),
      totalAmount: calculateTotal(),
      paymentMode
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/api/orders`, orderData);
      
      const newHistory = [...orderedHistory, ...cart];
      localStorage.setItem('cafe_ordered_history', JSON.stringify(newHistory));
      setOrderedHistory(newHistory);
      
      localStorage.removeItem('cafe_cart');
      setCart([]);
      toast.success('Order placed successfully!');
      
      if (paymentMode === 'Online') {
        // Standard UPI Deep Link (Works on mobile for GPay, PhonePe, Paytm, etc.)
        const upiLink = `upi://pay?pa=merchant@upi&pn=Cafe&am=${calculateTotal().toFixed(2)}&cu=INR&tn=Order ID: ${res.data.orderId}`;
        window.location.href = upiLink;
      }

      navigate('/order-confirmation', { state: { order: res.data } });
    } catch (error) {
      console.error('Error placing order', error);
      toast.error('Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container" style={{ background: 'var(--bg-cream)' }}>
      <div className="header-bar">
        <button onClick={() => navigate('/menu')} style={{ background: 'transparent', color: 'var(--primary-color)', border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="header-title" style={{ fontSize: '1.4rem' }}>Your Cart</h1>
        <div style={{ width: 24 }}></div>
      </div>

      <div style={{ padding: '1.5rem', flex: 1, paddingBottom: '2rem' }}>
        {cart.length === 0 && orderedHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-dim)' }}>
            <div style={{ background: 'var(--bg-white)', width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: 'var(--card-shadow)' }}>
              <ShoppingBag size={40} color="var(--secondary-color)" />
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>Your cart is empty</h3>
            <p style={{ fontWeight: '500' }}>Add some delicious items from the menu!</p>
            <button onClick={() => navigate('/menu')} className="btn-primary" style={{ marginTop: '2rem', padding: '14px 28px', width: 'auto', display: 'inline-flex' }}>
              Back to Menu
            </button>
          </div>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {orderedHistory.length > 0 && (
              <div className="cafe-card" style={{ padding: '1.2rem', background: '#F0F7F1', border: '1px solid #D4E8D6' }}>
                <h3 style={{ marginBottom: '1rem', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                  <div style={{ width: 8, height: 8, background: '#2E7D32', borderRadius: '50%' }}></div>
                  Already Ordered (Preparing)
                </h3>
                {orderedHistory.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '0.6rem' }}>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: '500' }}>
                      <span style={{ fontWeight: '800', color: 'var(--primary-color)' }}>{item.quantity}x</span> {item.name}
                    </div>
                    <span style={{ color: 'var(--primary-color)', fontWeight: '700', fontSize: '0.9rem' }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: '600' }}>
                  <span>Table Total:</span>
                  <span style={{ fontWeight: '800', color: '#2E7D32', fontSize: '1rem' }}>
                    ₹{orderedHistory.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(0)}
                  </span>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div className="cafe-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem', color: 'var(--primary-color)' }}>New Order</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--bg-cream)' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--primary-color)' }}>{item.name}</h4>
                          <span style={{ color: 'var(--accent-color)', fontWeight: '800', fontSize: '0.9rem' }}>₹{item.price.toFixed(0)}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-cream)', borderRadius: '12px', padding: '4px' }}>
                            <button onClick={() => updateCart(item.id, -1)} style={{ background: 'transparent', color: 'var(--primary-color)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                              <Minus size={14} />
                            </button>
                            <span style={{ width: '20px', textAlign: 'center', fontWeight: '800', color: 'var(--primary-color)' }}>{item.quantity}</span>
                             <button onClick={() => updateCart(item.id, 1)} style={{ background: 'transparent', color: 'var(--primary-color)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                              <Plus size={14} />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.id)} style={{ background: 'var(--bg-cream)', color: 'var(--danger-color)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-color)' }}>
                    <span>Subtotal:</span>
                    <span>₹{calculateTotal().toFixed(0)}</span>
                  </div>
                </div>

                <div className="cafe-card" style={{ padding: '1.2rem' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--primary-color)' }}>Payment Method</h3>
                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <div 
                      style={{ 
                        flex: 1, padding: '1rem', borderRadius: '12px', border: '2px solid var(--primary-color)',
                        background: 'var(--secondary-color)',
                        textAlign: 'center', transition: 'all 0.3s ease'
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary-color)' }}>Cash on Table</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout} 
                  disabled={isSubmitting}
                  className="btn-primary" 
                  style={{ padding: '18px', fontSize: '1.1rem', marginTop: '1rem' }}
                >
                  {isSubmitting ? 'Placing Order...' : `Place Order • ₹${calculateTotal().toFixed(0)}`}
                </button>
              </>
            )}

            {cart.length === 0 && orderedHistory.length > 0 && (
              <button 
                onClick={() => navigate('/menu')} 
                className="btn-secondary" 
                style={{ padding: '16px', fontSize: '1rem' }}
              >
                Go Back to Menu & Order More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerCart;
