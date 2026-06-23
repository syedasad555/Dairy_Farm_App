const express = require('express');
const router = express.Router();
const Billing = require('../models/Billing');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');
const { generateStatementPDF } = require('../services/pdfService');
const { sendNotification } = require('../services/notificationService');

// @route   POST /api/billing/generate-statement
// @desc    Generate monthly statement for a customer
// @access  Private/Admin
router.post('/generate-statement', protect, authorize('admin'), async (req, res) => {
  try {
    const { customerId, month, year } = req.body;
    
    // Get all orders for the customer in the specified month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const orders = await Order.find({
      customer: customerId,
      orderStatus: 'delivered',
      actualDeliveryTime: { $gte: startDate, $lte: endDate }
    }).populate('items.product');

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No orders found for this period'
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = orders.map(order => ({
      order: order._id,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      deliveryDate: order.actualDeliveryTime,
      items: order.items.map(item => ({
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price
      })),
      amount: order.finalAmount
    }));

    totalAmount = orders.reduce((sum, order) => sum + order.finalAmount, 0);

    // Create billing statement
    const billing = await Billing.create({
      customer: customerId,
      month,
      year,
      orders: orderItems,
      totalAmount,
      pendingAmount: totalAmount,
      dueDate: new Date(year, month, 15)
    });

    await sendNotification(
      customerId,
      'statement_generated',
      'Monthly Statement Generated',
      `Your statement for ${month}/${year} is ready. Total: ₹${totalAmount}`,
      { billingId: billing._id }
    );

    res.status(201).json({
      success: true,
      data: billing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating statement',
      error: error.message
    });
  }
});

// @route   GET /api/billing/customer/:customerId
// @desc    Get all billing statements for a customer
// @access  Private
router.get('/customer/:customerId', protect, async (req, res) => {
  try {
    const customerId = req.user.role === 'customer' ? req.user.id : req.params.customerId;
    
    const statements = await Billing.find({ customer: customerId })
      .populate('customer', 'fullName mobileNumber addresses')
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      count: statements.length,
      data: statements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statements',
      error: error.message
    });
  }
});

// @route   GET /api/billing/reports/outstanding
router.get('/reports/outstanding', protect, authorize('admin'), async (req, res) => {
  try {
    const outstanding = await Billing.find({
      paymentStatus: { $in: ['unpaid', 'partial'] }
    })
    .populate('customer', 'fullName mobileNumber addresses')
    .sort({ pendingAmount: -1 });

    const totalOutstanding = outstanding.reduce((sum, bill) => sum + bill.pendingAmount, 0);

    res.status(200).json({
      success: true,
      totalOutstanding,
      count: outstanding.length,
      data: outstanding
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching outstanding report',
      error: error.message
    });
  }
});

// @route   GET /api/billing/:id/pdf
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const billing = await Billing.findById(req.params.id)
      .populate('customer', 'fullName mobileNumber addresses');

    if (!billing) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    if (req.user.role === 'customer' && billing.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const pdfBuffer = await generateStatementPDF(billing, billing.customer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${billing.statementNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating PDF', error: error.message });
  }
});

// @route   GET /api/billing/:id
// @desc    Get single billing statement
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const billing = await Billing.findById(req.params.id)
      .populate('customer', 'fullName mobileNumber addresses')
      .populate('orders.order');

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Statement not found'
      });
    }

    // Check if user has access to this statement
    if (req.user.role === 'customer' && billing.customer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this statement'
      });
    }

    res.status(200).json({
      success: true,
      data: billing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statement',
      error: error.message
    });
  }
});

// @route   GET /api/billing
// @desc    Get all billing statements (admin view)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { month, year, paymentStatus } = req.query;
    
    let query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const statements = await Billing.find(query)
      .populate('customer', 'fullName mobileNumber')
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      count: statements.length,
      data: statements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statements',
      error: error.message
    });
  }
});

// @route   PUT /api/billing/:id/payment
// @desc    Record payment
// @access  Private/Admin
router.put('/:id/payment', protect, authorize('admin'), async (req, res) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    
    const billing = await Billing.findById(req.params.id);
    
    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Statement not found'
      });
    }

    billing.paidAmount += amount;
    billing.pendingAmount = billing.totalAmount - billing.paidAmount;
    
    if (billing.pendingAmount <= 0) {
      billing.paymentStatus = 'paid';
    } else if (billing.paidAmount > 0) {
      billing.paymentStatus = 'partial';
    }

    billing.paymentHistory.push({
      amount,
      paymentDate: new Date(),
      paymentMethod,
      notes,
      collectedBy: req.user.id
    });

    if (notes) billing.collectionNotes = notes;

    await billing.save();

    res.status(200).json({
      success: true,
      data: billing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    });
  }
});

// @route   PUT /api/billing/:id/status
// @desc    Update payment status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    const billing = await Billing.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true, runValidators: true }
    );

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Statement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: billing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
});

module.exports = router;
