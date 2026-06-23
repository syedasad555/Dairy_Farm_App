const PDFDocument = require('pdfkit');

function generateStatementPDF(billing, customer) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

      // Header
      doc.fontSize(22).fillColor('#2E7D32').text('Farm Fresh Dairy & Organic Store', { align: 'center' });
      doc.fontSize(12).fillColor('#666').text('Pure. Fresh. Natural. Delivered To Your Doorstep.', { align: 'center' });
      doc.moveDown();
      doc.fontSize(18).fillColor('#000').text('Monthly Statement', { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(11).fillColor('#333');
      doc.text(`Statement No: ${billing.statementNumber}`);
      doc.text(`Period: ${monthNames[billing.month - 1]} ${billing.year}`);
      doc.text(`Generated: ${new Date(billing.generatedAt || billing.createdAt).toLocaleDateString()}`);
      doc.text(`Due Date: ${new Date(billing.dueDate).toLocaleDateString()}`);
      doc.moveDown();

      // Customer info
      doc.fontSize(14).fillColor('#2E7D32').text('Customer Details');
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor('#333');
      doc.text(`Name: ${customer.fullName}`);
      doc.text(`Mobile: ${customer.mobileNumber}`);
      if (customer.addresses?.length > 0) {
        const addr = customer.addresses.find(a => a.isDefault) || customer.addresses[0];
        doc.text(`Address: ${addr.addressLine}, ${addr.city}, ${addr.state} - ${addr.pincode}`);
      }
      doc.moveDown();

      // Orders table header
      doc.fontSize(14).fillColor('#2E7D32').text('Order History');
      doc.moveDown(0.5);

      billing.orders.forEach((order, idx) => {
        doc.fontSize(11).fillColor('#000').text(`${idx + 1}. ${order.orderNumber} — ${new Date(order.deliveryDate || order.orderDate).toLocaleDateString()}`);
        order.items.forEach(item => {
          doc.fontSize(10).fillColor('#555').text(`   ${item.productName} × ${item.quantity} @ ₹${item.price} = ₹${item.quantity * item.price}`);
        });
        doc.fontSize(10).fillColor('#2E7D32').text(`   Order Total: ₹${order.amount}`);
        doc.moveDown(0.3);
      });

      doc.moveDown();
      doc.strokeColor('#2E7D32').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Summary
      doc.fontSize(12).fillColor('#000');
      doc.text(`Total Amount:     ₹${billing.totalAmount}`, { align: 'right' });
      doc.text(`Paid Amount:      ₹${billing.paidAmount}`, { align: 'right' });
      doc.fontSize(14).fillColor('#2E7D32').text(`Pending Amount:   ₹${billing.pendingAmount}`, { align: 'right' });
      doc.moveDown();
      doc.fontSize(10).fillColor('#999').text(`Payment Status: ${billing.paymentStatus.toUpperCase()}`, { align: 'center' });
      doc.text('Payment collected on delivery. No online payment required.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateStatementPDF };
