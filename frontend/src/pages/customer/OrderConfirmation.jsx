import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, ChevronRight, MessageCircle, LogOut, XCircle, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerOrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state?.order;
  
  const [timeLeft, setTimeLeft] = useState(120); // 120 seconds = 2 minutes
  const [canCancel, setCanCancel] = useState(true);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null); // New state for specific item
  const [reason, setReason] = useState('');
  const [currentOrder, setCurrentOrder] = useState(orderData);

  useEffect(() => {
    if (!currentOrder || currentOrder.status === 'Cancelled') return;

    const calculateTime = () => {
      const start = new Date(currentOrder.createdAt).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000);
      const remaining = 120 - elapsed;

      if (remaining <= 0) {
        setTimeLeft(0);
        setCanCancel(false);
      } else {
        setTimeLeft(remaining);
      }
    };

    calculateTime();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanCancel(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentOrder]);

  const handleCancelOrder = async () => {
    if (!reason.trim()) {
      return toast.error('Please enter a cancellation reason');
    }
    
    setIsCancelling(true);
    console.log(`[FRONTEND] Cancelling ${selectedItemId ? 'item: ' + selectedItemId : 'full order: ' + currentOrder._id}`);

    try {
      const url = selectedItemId 
        ? `http://192.168.0.167:5000/api/orders/${currentOrder._id}/items/${selectedItemId}/cancel`
        : `http://192.168.0.167:5000/api/orders/${currentOrder._id}/cancel`;
        
      const res = await axios.put(url, { reason });
      
      if (res.data.success) {
        setCurrentOrder(res.data.order);
        if (res.data.order.status === 'Cancelled') {
          setIsCancelled(true);
        }
        toast.success(res.data.message);
        setShowReasonModal(false);
        setReason('');
        setSelectedItemId(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!currentOrder) {
    return <Navigate to="/menu" replace />;
  }

  return (
    <div className="app-container" style={{ background: 'var(--bg-cream)', justifyContent: 'center', padding: '2rem' }}>
      <div className="cafe-card animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          {currentOrder.status === 'Cancelled' ? (
            <div style={{ background: '#FFEBEE', padding: '20px', borderRadius: '50%' }}>
              <XCircle color="#C62828" size={64} />
            </div>
          ) : (
            <div style={{ background: '#E8F5E9', padding: '20px', borderRadius: '50%' }}>
              <CheckCircle2 color="#2E7D32" size={64} />
            </div>
          )}
        </div>

        <h1 className="header-title" style={{ 
          fontSize: '2rem', 
          marginBottom: '0.5rem', 
          color: currentOrder.status === 'Cancelled' ? '#C62828' : 'var(--primary-color)'
        }}>
          {currentOrder.status === 'Cancelled' ? 'Order Cancelled' : 'Order Placed!'}
        </h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', fontSize: '1rem', fontWeight: '500' }}>
          {currentOrder.status === 'Cancelled' ? 'This order has been cancelled.' : "We're preparing your delicious food."}
        </p>

        {canCancel && currentOrder.status === 'Placed' && (
          <div style={{ 
            background: 'var(--bg-cream)', 
            padding: '10px 16px', 
            borderRadius: '12px', 
            marginBottom: '1.5rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            border: '1px solid var(--secondary-color)'
          }}>
            <Clock size={16} color="var(--primary-color)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '700' }}>
              Cancel available: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        <div style={{ background: 'var(--bg-white)', padding: '1.5rem', borderRadius: '20px', textAlign: 'left', marginBottom: '2rem', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: '600' }}>Order ID:</span>
            <span style={{ fontWeight: '800', color: 'var(--primary-color)', fontSize: '0.9rem' }}>#{currentOrder.orderId}</span>
          </div>
          
          <div style={{ margin: '1.2rem 0', padding: '1rem 0', borderTop: '1px solid var(--bg-cream)', borderBottom: '1px solid var(--bg-cream)' }}>
            <p style={{ fontWeight: '800', marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--primary-color)' }}>Items Ordered:</p>
            {currentOrder.items.map((item) => (
              <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <span style={{ fontSize: '0.9rem', color: item.status === 'Cancelled' ? 'var(--text-dim)' : 'var(--text-main)', textDecoration: item.status === 'Cancelled' ? 'line-through' : 'none', fontWeight: '500' }}>
                       {item.quantity}x {item.name}
                     </span>
                     {item.status === 'Cancelled' && (
                       <span style={{ fontSize: '0.65rem', background: '#FFEBEE', color: '#C62828', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>CANCELLED</span>
                     )}
                  </div>
                </div>

                {item.status === 'Placed' && currentOrder.status !== 'Cancelled' && canCancel && (
                  <button 
                    onClick={() => { setSelectedItemId(item._id); setShowReasonModal(true); }}
                    style={{ background: 'var(--bg-cream)', border: 'none', color: '#C62828', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={12} /> Cancel
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: '600' }}>Table:</span>
            <span style={{ fontWeight: '800', color: 'var(--primary-color)' }}>{currentOrder.tableNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: '600' }}>Total Amount:</span>
            <span style={{ fontWeight: '900', color: 'var(--primary-color)', fontSize: '1.1rem' }}>₹{currentOrder.totalAmount.toFixed(0)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => navigate('/menu')} className="btn-primary" style={{ padding: '16px' }}>
            {currentOrder.status === 'Cancelled' ? 'Back to Menu' : 'Order More'} <ChevronRight size={20} />
          </button>

          {currentOrder.status === 'Placed' && canCancel && (
            <button 
              onClick={() => setShowReasonModal(true)} 
              disabled={isCancelling}
              className="btn-secondary" 
              style={{ padding: '14px', color: '#C62828', borderColor: '#FFEBEE', background: '#FFEBEE', fontWeight: '700', fontSize: '0.9rem' }}
            >
              {isCancelling ? 'Wait...' : `Cancel Full Order`}
            </button>
          )}

          <button
            onClick={() => {
              localStorage.removeItem('customerName');
              localStorage.removeItem('customerPhone');
              localStorage.removeItem('tableNumber');
              localStorage.removeItem('customerLoggedIn');
              localStorage.removeItem('cafe_customer');
              localStorage.removeItem('cafe_cart');
              localStorage.removeItem('cafe_ordered_history');
              localStorage.removeItem('foodPreference');
              navigate('/login', { replace: true });
            }}
            className="btn-secondary"
            style={{ width: '100%', color: 'var(--text-dim)', fontSize: '0.9rem' }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Cancellation Reason Modal */}
      {showReasonModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(44, 24, 16, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="cafe-card animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.3rem', color: 'var(--primary-color)' }}>{selectedItemId ? 'Cancel Item?' : 'Cancel Order?'}</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Please tell us the reason for cancellation</p>
            
            <textarea 
              className="input-field"
              placeholder="E.g., Ordered by mistake..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              style={{ marginBottom: '1.5rem', resize: 'none', background: 'var(--bg-cream)' }}
              required
            />

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button 
                onClick={() => { setShowReasonModal(false); setSelectedItemId(null); setReason(''); }}
                className="btn-secondary" 
                style={{ flex: 1, padding: '12px', fontSize: '0.9rem' }}
              >
                Back
              </button>
              <button 
                onClick={handleCancelOrder}
                className="btn-primary" 
                style={{ flex: 1, padding: '12px', background: '#C62828', fontSize: '0.9rem' }}
                disabled={!reason.trim() || isCancelling}
              >
                {isCancelling ? 'Wait...' : 'Cancel Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderConfirmation;
