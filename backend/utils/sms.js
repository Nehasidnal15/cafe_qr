const twilio = require('twilio');

/**
 * Sends an order confirmation SMS to the customer.
 * @param {Object} order - The order document from MongoDB
 */
const sendOrderSMS = async (order) => {
  const { 
    customerName, 
    phoneNumber, 
    orderId, 
    items, 
    totalAmount, 
    tableNumber 
  } = order;

  // Check for credentials
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !fromPhone) {
    console.log('[SMS Skip] Twilio credentials not fully configured in .env.');
    return;
  }

  try {
    const client = twilio(sid, token);
    
    // Format items: "Coffee x2, Burger x1"
    const itemsList = items.map(i => `${i.name} x${i.quantity}`).join(', ');
    
    // Construct message based on user requirements
    const message = `Hi ${customerName}, your order (ID: ${orderId}) has been placed. Items: ${itemsList}. Total: ₹${totalAmount.toFixed(2)}. Table: ${tableNumber}. Thank you!`;

    // Ensure India country code (+91) if not present
    const formattedTo = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    await client.messages.create({
      body: message,
      from: fromPhone,
      to: formattedTo
    });

    console.log(`[SMS Success] Confirmation sent to ${formattedTo} for Order ${orderId}`);
  } catch (error) {
    console.error(`[SMS Error] Failed to send SMS for Order ${orderId}:`, error.message);
  }
};

module.exports = { sendOrderSMS };
