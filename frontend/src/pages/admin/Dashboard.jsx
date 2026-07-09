import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { LogOut, ListOrdered, Utensils, Plus, Edit, Trash2, Check, X, TrendingUp, Trophy, Loader, Clock, QrCode, Download, Printer, UtensilsCrossed } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import API_BASE_URL from '../../config';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('orders');
  
  // Sync tab with URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('menu')) setActiveTab('menu');
    else if (path.includes('analytics')) setActiveTab('analytics');
    else if (path.includes('qrcodes')) setActiveTab('qrcodes');
    else if (path.includes('delivered')) setActiveTab('delivered');
    else setActiveTab('orders');
  }, [location]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const getOneMonthAgoStr = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (activeTab === 'delivered') {
      const todayStr = new Date().toISOString().split('T')[0];
      const oneMonthAgoStr = getOneMonthAgoStr();
      if (selectedDate < oneMonthAgoStr || selectedDate > todayStr) {
        setSelectedDate(todayStr);
      }
    }
  }, [activeTab]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');

  useEffect(() => {
    if (isModalOpen) {
      setSelectedImage(editingItem ? editingItem.imageUrl || '' : '');
    }
  }, [isModalOpen, editingItem]);
  
  // QR Code State
  const [tables, setTables] = useState([]);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [isAddingTable, setIsAddingTable] = useState(false);
  
  const [socket, setSocket] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderTypeFilter, setOrderTypeFilter] = useState('active'); // 'all', 'active', 'cancelled'
  
  // Analytics State
  const [analyticsData, setAnalyticsData] = useState([]);
  const [analyticsRange, setAnalyticsRange] = useState('today');

  useEffect(() => {
    const token = localStorage.getItem('cafe_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    fetchOrders();
    fetchMenu();
    fetchAnalytics();
    fetchTables();

    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.on('newOrder', (order) => {
      // Only add to list if the order was placed on the currently selected date
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      if (orderDate === selectedDate) {
        setOrders(prev => [order, ...prev]);
      }
    });

    newSocket.on('orderStatusUpdated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    return () => newSocket.disconnect();
  }, [navigate, selectedDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [analyticsRange]);

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const res = await axios.get(`${API_BASE_URL}/api/orders?date=${selectedDate}`);
      setOrders(res.data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/menu`);
      setMenuItems(res.data);
    } catch {
      console.error('Failed to load menu');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/analytics/top-dishes?range=${analyticsRange}`);
      setAnalyticsData(res.data);
    } catch {
      console.error('Failed to load analytics');
    }
  };

  const fetchTables = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tables`);
      setTables(res.data);
    } catch {
      console.error('Failed to load tables');
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableNumber) return;
    
    setIsAddingTable(true);
    try {
      // Hardcode local IP to ensure QR works on mobile even if admin is on localhost
      // Extract hostname from API_BASE_URL
      const localIP = new URL(API_BASE_URL).hostname;
      const qrUrl = `http://${localIP}:5173/login?table=${newTableNumber}`;
      
      await axios.post(`${API_BASE_URL}/api/tables`, {
        tableNumber: parseInt(newTableNumber),
        qrUrl
      });
      toast.success(`Table ${newTableNumber} added!`);
      setNewTableNumber('');
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add table');
    } finally {
      setIsAddingTable(false);
    }
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm('Delete this table QR?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/tables/${id}`);
      toast.success('Table deleted');
      fetchTables();
    } catch {
      toast.error('Failed to delete table');
    }
  };

  const downloadQR = (tableNum) => {
    const canvas = document.getElementById(`qr-table-${tableNum}`);
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `Table-${tableNum}-QR.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const printQR = (tableNum) => {
    const canvas = document.getElementById(`qr-table-${tableNum}`);
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const windowContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Print Table ${tableNum} QR</title></head>
      <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
        <h1 style="color:#6F4E37;">Table ${tableNum}</h1>
        <img src="${dataUrl}" style="width:300px; height:300px; border:10px solid #6F4E37; border-radius:20px; padding:20px;" />
        <p style="margin-top:20px; color:#666;">Scan to view menu & order</p>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.open();
    printWindow.document.write(windowContent);
    printWindow.document.close();
  };

  const printAllQRs = () => {
    if (tables.length === 0) return toast.error('No QR codes to print');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const margin = 15;
    const cols = 3;
    const rows = 4;
    const cellWidth = (pageWidth - margin * 2) / cols;
    const cellHeight = (pageHeight - margin * 2) / rows;
    const qrSize = 45;
    
    let count = 0;
    
    doc.setFont("helvetica", "bold");
    
    tables.forEach((table) => {
      const canvas = document.getElementById(`qr-table-${table.tableNumber}`);
      if (canvas) {
        if (count > 0 && count % (cols * rows) === 0) {
          doc.addPage();
        }
        
        const col = count % cols;
        const row = Math.floor((count % (cols * rows)) / cols);
        
        const cellX = margin + col * cellWidth;
        const cellY = margin + row * cellHeight;
        
        // Calculate centered X position for the QR code
        const qrX = cellX + (cellWidth - qrSize) / 2;
        const qrY = cellY + 5;
        
        const dataUrl = canvas.toDataURL('image/png');
        
        // Add QR Image
        doc.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        
        // Draw Border around QR
        doc.setDrawColor(111, 78, 55); // #6F4E37 (Cafe Brown)
        doc.setLineWidth(0.8);
        doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2);
        
        // Add Table text
        doc.setTextColor(111, 78, 55);
        doc.setFontSize(16);
        doc.text(`Table ${table.tableNumber}`, cellX + cellWidth / 2, qrY + qrSize + 8, { align: 'center' });
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text(`Scan to order`, cellX + cellWidth / 2, qrY + qrSize + 13, { align: 'center' });
        
        count++;
      }
    });
    
    doc.save('Cafe_Table_QRs.pdf');
    toast.success('PDF downloaded successfully!');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('cafe_admin_token');
    navigate('/admin/login', { replace: true });
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      category: formData.get('category'),
      type: formData.get('type'),
      isAvailable: formData.get('isAvailable') === 'true',
      imageUrl: selectedImage
    };

    // Check for duplicate dish (matching name and category)
    const isDuplicate = menuItems.some(item => 
      item.id !== editingItem?.id &&
      item.name?.trim().toLowerCase() === data.name?.trim().toLowerCase() &&
      item.category?.trim().toLowerCase() === data.category?.trim().toLowerCase()
    );

    if (isDuplicate) {
      toast.error('This item already exists in the menu!');
      isSavingRef.current = false;
      setIsSaving(false);
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`${API_BASE_URL}/api/menu/${editingItem.id}`, data);
        toast.success('Dish updated!');
      } else {
        await axios.post(`${API_BASE_URL}/api/menu`, data);
        toast.success('Dish added!');
      }
      setIsModalOpen(false);
      fetchMenu();
    } catch {
      toast.error('Failed to save dish');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMenu = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/menu/${id}`);
        toast.success('Dish deleted');
        fetchMenu();
      } catch {
        toast.error('Failed to delete dish');
      }
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/menu/${id}/availability`, { isAvailable: !currentStatus });
      toast.success('Availability updated');
      fetchMenu();
    } catch {
      toast.error('Failed to update availability');
    }
  };

  return (
    <div className="admin-container animate-fade-in" style={{ background: 'var(--bg-cream)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'var(--primary-color)', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(111, 78, 55, 0.15)' }}>
            <UtensilsCrossed color="white" size={28} />
          </div>
          <div>
            <h1 className="header-title" style={{ fontSize: '2rem', margin: 0, lineHeight: 1.1 }}>Admin Portal</h1>
            <p style={{ color: 'var(--text-dim)', fontWeight: '500', marginTop: '4px', margin: 0 }}>Welcome back to your dashboard</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-white)', color: 'var(--danger-color)', border: '1px solid #FFEBEE' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => navigate('/admin/orders')}
          className="btn-secondary" 
          style={{ 
            background: activeTab === 'orders' ? 'var(--primary-color)' : 'var(--bg-white)', 
            color: activeTab === 'orders' ? 'white' : 'var(--primary-color)', 
            display: 'flex', alignItems: 'center', gap: '8px', border: activeTab === 'orders' ? 'none' : '1px solid var(--glass-border)',
            fontWeight: '700', padding: '12px 24px'
          }}
        >
          <ListOrdered size={18} /> Live Orders
        </button>
        <button 
          onClick={() => navigate('/admin/delivered')}
          className="btn-secondary" 
          style={{ 
            background: activeTab === 'delivered' ? 'var(--primary-color)' : 'var(--bg-white)', 
            color: activeTab === 'delivered' ? 'white' : 'var(--primary-color)', 
            display: 'flex', alignItems: 'center', gap: '8px', border: activeTab === 'delivered' ? 'none' : '1px solid var(--glass-border)',
            fontWeight: '700', padding: '12px 24px'
          }}
        >
          <Check size={18} /> Delivered Orders
        </button>
        <button 
          onClick={() => navigate('/admin/menu')}
          className="btn-secondary" 
          style={{ 
            background: activeTab === 'menu' ? 'var(--primary-color)' : 'var(--bg-white)', 
            color: activeTab === 'menu' ? 'white' : 'var(--primary-color)', 
            display: 'flex', alignItems: 'center', gap: '8px', border: activeTab === 'menu' ? 'none' : '1px solid var(--glass-border)',
            fontWeight: '700', padding: '12px 24px'
          }}
        >
          <Utensils size={18} /> Manage Menu
        </button>
        <button 
          onClick={() => navigate('/admin/analytics')}
          className="btn-secondary" 
          style={{ 
            background: activeTab === 'analytics' ? 'var(--primary-color)' : 'var(--bg-white)', 
            color: activeTab === 'analytics' ? 'white' : 'var(--primary-color)', 
            display: 'flex', alignItems: 'center', gap: '8px', border: activeTab === 'analytics' ? 'none' : '1px solid var(--glass-border)',
            fontWeight: '700', padding: '12px 24px'
          }}
        >
          <TrendingUp size={18} /> Sales Analytics
        </button>
        <button 
          onClick={() => navigate('/admin/qrcodes')}
          className="btn-secondary" 
          style={{ 
            background: activeTab === 'qrcodes' ? 'var(--primary-color)' : 'var(--bg-white)', 
            color: activeTab === 'qrcodes' ? 'white' : 'var(--primary-color)', 
            display: 'flex', alignItems: 'center', gap: '8px', border: activeTab === 'qrcodes' ? 'none' : '1px solid var(--glass-border)',
            fontWeight: '700', padding: '12px 24px'
          }}
        >
          <QrCode size={18} /> QR Codes
        </button>
      </div>

      {activeTab === 'orders' && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-white)', padding: '6px', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)' }}>
              {[
                { id: 'all', label: 'All Orders', icon: <ListOrdered size={16} /> },
                { id: 'active', label: 'Active', icon: <Clock size={16} /> },
                { id: 'cancelled', label: 'Cancelled', icon: <X size={16} /> }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setOrderTypeFilter(f.id)}
                  style={{
                    padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '800',
                    background: orderTypeFilter === f.id ? 'var(--primary-color)' : 'transparent',
                    color: orderTypeFilter === f.id ? 'white' : 'var(--text-dim)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--bg-white)', padding: '10px 20px', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)' }}>
              <button 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                style={{ background: 'var(--bg-cream)', color: 'var(--primary-color)', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '800' }}
              >
                Today
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary-color)' }}>Date:</span>
                <input 
                  type="date" 
                  className="input-field" 
                  style={{ width: 'auto', padding: '6px 12px', height: '38px', margin: 0, background: 'var(--bg-cream)', borderRadius: '10px' }}
                  max={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    if (e.target.value > todayStr) {
                      toast.error("Cannot select a future date");
                      setSelectedDate(todayStr);
                    } else {
                      setSelectedDate(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {isLoadingOrders ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-dim)' }}>
              <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
              <Loader style={{ animation: 'spin 2s linear infinite', marginBottom: '1rem' }} size={48} color="var(--primary-color)" />
              <p style={{ fontWeight: '600' }}>Loading live orders...</p>
            </div>
          ) : orders
            .filter(order => {
              if (orderTypeFilter === 'all') return true;
              if (orderTypeFilter === 'cancelled') return order.status === 'Cancelled';
              return order.status !== 'Cancelled' && order.status !== 'Delivered';
            })
            .map(order => (
            <div 
              key={order.id} 
              className="cafe-card animate-fade-in"
              style={{ 
                padding: '1.5rem',
                borderTop: `6px solid ${
                  order.status === 'Cancelled' ? '#C62828' : 
                  order.status === 'Preparing' ? '#EF6C00' : 
                  order.status === 'Delivered' ? '#1976D2' : 
                  '#2E7D32'
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-color)' }}>Table {order.tableNumber}</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '700', background: 'var(--bg-cream)', padding: '2px 8px', borderRadius: '4px' }}>
                      #{order.orderId}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: '600' }}>
                    {order.customerName} • {order.customerPhone}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="status-badge" style={{ 
                    background: 
                      order.status === 'Cancelled' ? '#FFEBEE' : 
                      order.status === 'Preparing' ? '#FFF3E0' : 
                      order.status === 'Delivered' ? '#E3F2FD' : 
                      '#E8F5E9',
                    color: 
                      order.status === 'Cancelled' ? '#C62828' : 
                      order.status === 'Preparing' ? '#EF6C00' : 
                      order.status === 'Delivered' ? '#1976D2' : 
                      '#2E7D32',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '800'
                  }}>
                    {order.status}
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600' }}>
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              <div style={{ background: '#FDFCFB', padding: '1rem', borderRadius: '14px', border: '1px solid var(--bg-cream)' }}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: idx === order.items.length - 1 ? 0 : '10px', paddingBottom: idx === order.items.length - 1 ? 0 : '10px', borderBottom: idx === order.items.length - 1 ? 'none' : '1px dashed var(--bg-cream)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ opacity: item.status === 'Cancelled' ? 0.4 : 1 }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--primary-color)', textDecoration: item.status === 'Cancelled' ? 'line-through' : 'none' }}>
                          {item.quantity}x {item.name}
                        </span>
                      </div>
                      {item.status === 'Cancelled' ? (
                        <span style={{ fontSize: '0.65rem', background: '#FFEBEE', color: '#C62828', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>CANCELLED</span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary-color)' }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                      )}
                    </div>
                    {item.status === 'Cancelled' && (
                      <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#C62828', fontWeight: '600', paddingLeft: '4px', borderLeft: '2px solid #C62828' }}>
                        Reason: {item.cancelReason}
                        {item.cancelledAt && <span style={{ opacity: 0.7, marginLeft: '8px' }}>({new Date(item.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {order.status === 'Cancelled' && (
                <div style={{ background: '#FFEBEE', padding: '10px 14px', borderRadius: '12px', border: '1px solid #FFCDD2' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#C62828', fontWeight: '700' }}>
                    <strong>Cancellation Reason:</strong> {order.cancelReason}
                  </p>
                  {order.cancelledAt && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#C62828', opacity: 0.8, fontWeight: '600' }}>
                      Cancelled at: {new Date(order.cancelledAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: '600' }}>Payment: </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '800' }}>{order.paymentMode}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: '600' }}>Total: </span>
                  <span style={{ fontSize: '1.2rem', color: 'var(--primary-color)', fontWeight: '900' }}>₹{order.totalAmount.toFixed(0)}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px', marginTop: '4px' }}>
                {['Placed', 'Delivered'].map(status => (
                  <button 
                    key={status}
                    onClick={() => updateOrderStatus(order.id, status)}
                    disabled={order.status === 'Cancelled'}
                    style={{ 
                      padding: '8px 4px', fontSize: '0.75rem', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--bg-cream)',
                      background: order.status === status ? 
                        (status === 'Placed' ? '#2E7D32' : status === 'Preparing' ? '#EF6C00' : status === 'Delivered' ? '#1976D2' : '#757575') 
                        : 'var(--bg-white)',
                      color: order.status === status ? 'white' : 'var(--primary-color)',
                      fontWeight: '800',
                      transition: 'all 0.2s ease',
                      opacity: order.status === 'Cancelled' ? 0.3 : 1
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {(!isLoadingOrders && orders.length === 0) && (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-white)', borderRadius: '24px', border: '1px dashed var(--secondary-color)', gridColumn: '1 / -1' }}>
              <ListOrdered size={48} style={{ color: 'var(--secondary-color)', marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-dim)', margin: 0, fontWeight: '600' }}>No orders found for this date.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'delivered' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', margin: 0 }}>Delivered Orders</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: '500', margin: '4px 0 0' }}>Displaying completed and served orders (last 1 month only)</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--bg-white)', padding: '10px 20px', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)' }}>
              <button 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                style={{ background: 'var(--bg-cream)', color: 'var(--primary-color)', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '800' }}
              >
                Today
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary-color)' }}>Date:</span>
                <input 
                  type="date" 
                  className="input-field" 
                  style={{ width: 'auto', padding: '6px 12px', height: '38px', margin: 0, background: 'var(--bg-cream)', borderRadius: '10px' }}
                  min={getOneMonthAgoStr()}
                  max={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const oneMonthAgoStr = getOneMonthAgoStr();
                    if (e.target.value < oneMonthAgoStr) {
                      toast.error("Delivered orders are restricted to the last 1 month");
                      setSelectedDate(todayStr);
                    } else if (e.target.value > todayStr) {
                      toast.error("Cannot select a future date");
                      setSelectedDate(todayStr);
                    } else {
                      setSelectedDate(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {isLoadingOrders ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-dim)' }}>
                <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
                <Loader style={{ animation: 'spin 2s linear infinite', marginBottom: '1rem' }} size={48} color="var(--primary-color)" />
                <p style={{ fontWeight: '600' }}>Loading delivered orders...</p>
              </div>
            ) : orders.filter(order => order.status === 'Delivered').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-white)', borderRadius: '24px', border: '1px dashed var(--secondary-color)', gridColumn: '1 / -1' }}>
                <Check size={48} style={{ color: 'var(--secondary-color)', marginBottom: '1rem', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-dim)', margin: 0, fontWeight: '600' }}>No delivered orders found for this date.</p>
              </div>
            ) : orders
              .filter(order => order.status === 'Delivered')
              .map(order => (
                <div 
                  key={order.id} 
                  className="cafe-card animate-fade-in"
                  style={{ 
                    padding: '1.5rem',
                    borderTop: '6px solid #1976D2',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-color)' }}>Table {order.tableNumber}</h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '700', background: 'var(--bg-cream)', padding: '2px 8px', borderRadius: '4px' }}>
                          #{order.orderId}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: '600' }}>
                        {order.customerName} • {order.customerPhone}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="status-badge" style={{ 
                        background: '#E3F2FD',
                        color: '#1976D2',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '800'
                      }}>
                        {order.status}
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600' }}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ background: '#FDFCFB', padding: '1rem', borderRadius: '14px', border: '1px solid var(--bg-cream)' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ marginBottom: idx === order.items.length - 1 ? 0 : '10px', paddingBottom: idx === order.items.length - 1 ? 0 : '10px', borderBottom: idx === order.items.length - 1 ? 'none' : '1px dashed var(--bg-cream)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ opacity: item.status === 'Cancelled' ? 0.4 : 1 }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--primary-color)', textDecoration: item.status === 'Cancelled' ? 'line-through' : 'none' }}>
                              {item.quantity}x {item.name}
                            </span>
                          </div>
                          {item.status === 'Cancelled' ? (
                            <span style={{ fontSize: '0.65rem', background: '#FFEBEE', color: '#C62828', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>CANCELLED</span>
                          ) : (
                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary-color)' }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                          )}
                        </div>
                        {item.status === 'Cancelled' && (
                          <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#C62828', fontWeight: '600', paddingLeft: '4px', borderLeft: '2px solid #C62828' }}>
                            Reason: {item.cancelReason}
                            {item.cancelledAt && <span style={{ opacity: 0.7, marginLeft: '8px' }}>({new Date(item.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: '600' }}>Payment: </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '800' }}>{order.paymentMode}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: '600' }}>Total: </span>
                      <span style={{ fontSize: '1.2rem', color: 'var(--primary-color)', fontWeight: '900' }}>₹{order.totalAmount.toFixed(0)}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px', marginTop: '4px' }}>
                    {['Placed', 'Delivered'].map(status => (
                      <button 
                        key={status}
                        onClick={() => updateOrderStatus(order.id, status)}
                        style={{ 
                          padding: '8px 4px', fontSize: '0.75rem', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--bg-cream)',
                          background: order.status === status ? 
                            (status === 'Placed' ? '#2E7D32' : status === 'Delivered' ? '#1976D2' : '#757575') 
                            : 'var(--bg-white)',
                          color: order.status === status ? 'white' : 'var(--primary-color)',
                          fontWeight: '800',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>Menu Management</h2>
            <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>
              <Plus size={18} /> Add Item
            </button>
          </div>

          <div className="cafe-card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-cream)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '1.2rem', color: 'var(--primary-color)', fontWeight: '800' }}>Item</th>
                  <th style={{ padding: '1.2rem', color: 'var(--primary-color)', fontWeight: '800' }}>Category</th>
                  <th style={{ padding: '1.2rem', color: 'var(--primary-color)', fontWeight: '800' }}>Price</th>
                  <th style={{ padding: '1.2rem', color: 'var(--primary-color)', fontWeight: '800' }}>Type</th>
                  <th style={{ padding: '1.2rem', color: 'var(--primary-color)', fontWeight: '800' }}>Status</th>
                  <th style={{ padding: '1.2rem', color: 'var(--primary-color)', fontWeight: '800', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--bg-cream)' }}>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '10px' }} /> : <div style={{ width: 44, height: 44, background: 'var(--bg-cream)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Utensils size={20} color="var(--primary-color)" /></div>}
                        <span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-dim)', fontWeight: '500' }}>{item.category}</td>
                    <td style={{ padding: '1rem 1.2rem', fontWeight: '800', color: 'var(--primary-color)' }}>₹{item.price.toFixed(0)}</td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <span style={{ 
                        fontSize: '0.7rem', fontWeight: '800', padding: '4px 10px', borderRadius: '6px',
                        color: item.type?.toLowerCase() === 'veg' ? '#2E7D32' : '#C62828',
                        background: item.type?.toLowerCase() === 'veg' ? '#E8F5E9' : '#FFEBEE'
                      }}>
                        {item.type?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <button 
                        onClick={() => toggleAvailability(item.id, item.isAvailable)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: item.isAvailable ? '#E8F5E9' : '#FFEBEE', color: item.isAvailable ? '#2E7D32' : '#C62828', padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem' }}
                      >
                        {item.isAvailable ? <Check size={14} /> : <X size={14} />} {item.isAvailable ? 'Available' : 'Out of Stock'}
                      </button>
                    </td>
                    <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} style={{ background: 'var(--bg-cream)', color: 'var(--primary-color)', padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}><Edit size={18} /></button>
                        <button onClick={() => handleDeleteMenu(item.id)} style={{ background: '#FFEBEE', color: '#C62828', padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {menuItems.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontWeight: '500' }}>Your menu is empty. Start adding some delicious dishes!</p>}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>Popular Dishes</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-white)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary-color)' }}>Range:</span>
              <select 
                className="input-field" 
                style={{ width: 'auto', padding: '4px 10px', height: '34px', margin: 0, background: 'var(--bg-cream)', border: 'none', fontWeight: '700', fontSize: '0.85rem' }}
                value={analyticsRange}
                onChange={(e) => setAnalyticsRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="2days">Last 2 Days</option>
                <option value="15days">Last 15 Days</option>
                <option value="1month">Last 1 Month</option>
              </select>
            </div>
          </div>

          <div className="cafe-card" style={{ padding: '2.5rem' }}>
            {analyticsData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {analyticsData.map((item, index) => (
                  <div key={item.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ 
                          width: '36px', height: '36px', borderRadius: '10px', 
                          background: index === 0 ? 'var(--primary-color)' : 'var(--bg-cream)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1rem', fontWeight: '900', color: index === 0 ? 'white' : 'var(--primary-color)'
                        }}>
                          {index + 1}
                        </div>
                        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-color)' }}>{item.name}</span>
                        {index === 0 && (
                          <span style={{ background: 'var(--secondary-color)', color: 'var(--primary-color)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Trophy size={14} /> BEST SELLER
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--primary-color)' }}>{item.totalSold} sold</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '14px', background: 'var(--bg-cream)', borderRadius: '20px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${(item.totalSold / analyticsData[0].totalSold) * 100}%`, 
                        height: '100%', 
                        background: index === 0 ? 'var(--primary-color)' : 'var(--accent-color)',
                        borderRadius: '20px',
                        transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <TrendingUp size={60} style={{ color: 'var(--secondary-color)', marginBottom: '1.5rem', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-dim)', fontWeight: '600' }}>No sales data available for this range.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'qrcodes' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', margin: 0 }}>QR Code Management</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: '500' }}>Generate unique QR codes for each table</p>
              <div style={{ background: '#FFF9C4', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', color: '#827717', marginTop: '8px', fontWeight: '700', display: 'inline-block' }}>
                Tip: Access dashboard via your Local IP (e.g. 192.168.x.x) before generating for mobile testing.
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={printAllQRs} className="btn-secondary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} /> Print All
              </button>
              <form onSubmit={handleAddTable} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Table No." 
                  className="input-field"
                  style={{ width: '120px', margin: 0, background: 'var(--bg-white)' }}
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <button type="submit" disabled={isAddingTable} className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
                  <Plus size={18} /> {isAddingTable ? 'Adding...' : 'Add Table'}
                </button>
              </form>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {tables.map(table => (
              <div key={table.id} className="cafe-card animate-fade-in" style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
                <button 
                  onClick={() => handleDeleteTable(table.id)}
                  style={{ position: 'absolute', top: '15px', right: '15px', background: '#FFEBEE', color: '#C62828', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
                
                <h3 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>Table {table.tableNumber}</h3>
                
                <div style={{ background: 'white', padding: '15px', borderRadius: '15px', display: 'inline-block', border: '1px solid var(--bg-cream)', marginBottom: '1.5rem' }}>
                  <QRCodeCanvas 
                    id={`qr-table-${table.tableNumber}`}
                    value={table.qrUrl} 
                    size={160}
                    level={"H"}
                    includeMargin={true}
                    fgColor={"#6F4E37"}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => downloadQR(table.tableNumber)}
                    className="btn-secondary" 
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', fontSize: '0.85rem' }}
                  >
                    <Download size={16} /> Download
                  </button>
                  <button 
                    onClick={() => printQR(table.tableNumber)}
                    className="btn-secondary" 
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', fontSize: '0.85rem' }}
                  >
                    <Printer size={16} /> Print
                  </button>
                </div>
              </div>
            ))}
            {tables.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'var(--bg-white)', borderRadius: '24px', border: '1px dashed var(--secondary-color)' }}>
                <QrCode size={48} style={{ color: 'var(--secondary-color)', marginBottom: '1rem', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-dim)', margin: 0, fontWeight: '600' }}>No tables added yet. Generate your first QR code above!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(44, 24, 16, 0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="cafe-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem' }}>
            <h2 style={{ marginBottom: '1.8rem', color: 'var(--primary-color)', fontSize: '1.6rem' }}>{editingItem ? 'Edit Dish' : 'New Dish'}</h2>
            <form onSubmit={handleSaveMenu} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <input name="name" defaultValue={editingItem?.name} className="input-field" placeholder="Dish Name" required />
              <textarea name="description" defaultValue={editingItem?.description} className="input-field" placeholder="Tell customers about this dish..." rows={3} style={{ resize: 'none' }} />
              <input name="category" defaultValue={editingItem?.category || ''} className="input-field" placeholder="Category (e.g. Pasta, Combos)" required />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input name="price" defaultValue={editingItem?.price} type="number" className="input-field" placeholder="Price (₹)" required style={{ flex: 1 }} />
                <select name="isAvailable" defaultValue={editingItem ? editingItem.isAvailable : true} className="input-field" style={{ flex: 1, cursor: 'pointer' }}>
                  <option value={true}>Available</option>
                  <option value={false}>Out of Stock</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <select name="type" defaultValue={editingItem?.type || 'veg'} className="input-field" style={{ flex: 1, cursor: 'pointer' }}>
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                </select>
                <div style={{ flex: 1 }}></div>
              </div>
              <input 
                type="file" 
                id="dish-image-upload"
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleImageChange}
              />
              <button
                type="button"
                onClick={() => document.getElementById('dish-image-upload').click()}
                className="btn-secondary"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--bg-cream)',
                  color: 'var(--primary-color)',
                  border: '1px dashed var(--primary-color)',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Select Dish Image
              </button>

              {selectedImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-cream)', padding: '10px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <img 
                    src={selectedImage} 
                    alt="Dish Preview" 
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-color)' }}>Image Selected</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {selectedImage.startsWith('data:') ? 'Local file uploaded' : 'External image url'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage('')}
                    style={{ background: '#FFEBEE', color: 'var(--danger-color)', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '14px' }} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px', opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
