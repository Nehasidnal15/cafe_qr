const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

const generateOrderId = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      
      query.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.findAll(query);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/recommendations/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number.' });
    }

    const pastOrders = await Order.findByPhone(phone);
    if (!pastOrders || pastOrders.length === 0) {
      return res.json([]);
    }

    const itemStats = {};
    
    pastOrders.forEach((order, index) => {
      if (order.status === 'Cancelled') return;
      
      order.items.forEach(item => {
        if (item.status === 'Cancelled') return;
        
        if (!itemStats[item.id]) {
          itemStats[item.id] = {
            id: item.id,
            count: 0,
            lastOrderedIndex: index
          };
        }
        itemStats[item.id].count += item.quantity;
      });
    });

    const candidateIds = Object.values(itemStats)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.lastOrderedIndex - b.lastOrderedIndex;
      })
      .slice(0, 5)
      .map(stat => stat.id);

    if (candidateIds.length === 0) return res.json([]);

    const menuItems = await MenuItem.findAll(); 
    
    const recommendations = candidateIds.map(id => {
      return menuItems.find(m => m.id === id);
    }).filter(item => item && item.isAvailable);

    res.json(recommendations.slice(0, 4));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  const io = req.app.get('socketio');
  const { customerName, customerPhone, tableNumber, items, totalAmount, paymentMode } = req.body;
  
  if (!customerName || /\d/.test(customerName)) {
    return res.status(400).json({ message: 'Customer name cannot contain numbers.' });
  }

  if (!customerPhone || !/^[6-9]\d{9}$/.test(customerPhone)) {
    return res.status(400).json({ message: 'Invalid phone number format. Must be 10 digits starting with 6-9.' });
  }

  if (!tableNumber || isNaN(tableNumber) || Number(tableNumber) <= 0) {
    return res.status(400).json({ message: 'Table number must be a valid positive numeric value.' });
  }

  const orderId = generateOrderId();

  try {
    const savedOrder = await Order.create({
      orderId,
      customerName,
      customerPhone,
      tableNumber,
      items,
      totalAmount,
      paymentMode
    });

    io.emit('newOrder', savedOrder);
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  const io = req.app.get('socketio');
  try {
    const { status } = req.body;
    const order = await Order.updateStatus(req.params.id, status);
    
    if (!order) return res.status(404).json({ message: 'Order not found' });

    io.emit('orderStatusUpdated', order);
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id/cancel', async (req, res) => {
  const io = req.app.get('socketio');
  const orderId = req.params.id;
  
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found in database.' });
    }

    if (order.status !== 'Placed') {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled as it is already being prepared or served.' });
    }

    const now = new Date();
    const orderTime = new Date(order.createdAt);
    const diffInMs = now - orderTime;

    if (diffInMs > 120000) {
      return res.status(400).json({ success: false, message: 'Cancellation period (2 minutes) has expired.' });
    }

    order.status = 'Cancelled';
    order.cancelReason = req.body.reason || 'No reason provided';
    order.cancelledAt = new Date();
    order.totalAmount = 0;
    
    order.items.forEach(item => {
      if (item.status === 'Placed') {
        item.status = 'Cancelled';
        item.cancelReason = order.cancelReason;
        item.cancelledAt = order.cancelledAt;
      }
    });

    const updatedOrder = await Order.save(order);

    io.emit('orderStatusUpdated', updatedOrder);
    res.json({ success: true, message: 'Order cancelled successfully', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error during cancellation.' });
  }
});

router.put('/:orderId/items/:itemId/cancel', async (req, res) => {
  const io = req.app.get('socketio');
  const { orderId, itemId } = req.params;
  const { reason } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const diffInMs = new Date() - new Date(order.createdAt);
    if (diffInMs > 120000) {
      return res.status(400).json({ success: false, message: 'Cancellation period (2 minutes) has expired.' });
    }

    // In JSONB items, we don't have _id unless we added it manually. 
    // Usually frontend sends a unique ID for items. 
    // Let's assume items have a unique ID or use index.
    const itemIndex = order.items.findIndex(item => (item.id == itemId || item._id == itemId));
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Item not found in order.' });

    const item = order.items[itemIndex];

    if (item.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Item is already cancelled.' });
    }

    item.status = 'Cancelled';
    item.cancelReason = reason || 'No reason provided';
    item.cancelledAt = new Date();

    order.totalAmount = order.items
      .filter(i => i.status === 'Placed')
      .reduce((acc, i) => acc + (i.price * i.quantity), 0);

    const allCancelled = order.items.every(i => i.status === 'Cancelled');
    if (allCancelled) {
      order.status = 'Cancelled';
      order.cancelReason = 'All items cancelled individually';
      order.cancelledAt = new Date();
    }

    const updatedOrder = await Order.save(order);

    io.emit('orderStatusUpdated', updatedOrder);
    res.json({ success: true, message: 'Item cancelled successfully', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
