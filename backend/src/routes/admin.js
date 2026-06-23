const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Billing = require('../models/Billing');
const { protect, authorize } = require('../middleware/auth');
const { sendNotification } = require('../services/notificationService');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard overview
// @access  Private/Admin
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const pendingApprovals = await User.countDocuments({ role: 'customer', status: 'pending' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const activeDeliveries = await Order.countDocuments({ orderStatus: 'out_for_delivery' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    
    // Calculate outstanding amounts
    const billingRecords = await Billing.find({ paymentStatus: { $in: ['unpaid', 'partial'] } });
    const outstandingAmounts = billingRecords.reduce((sum, bill) => sum + bill.pendingAmount, 0);
    
    // Calculate monthly revenue
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyOrders = await Order.find({
      orderStatus: 'delivered',
      actualDeliveryTime: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lte: new Date(currentYear, currentMonth + 1, 0)
      }
    });
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.finalAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        pendingApprovals,
        totalProducts,
        totalOrders,
        activeDeliveries,
        deliveredOrders,
        outstandingAmounts,
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/admin/pending-approvals
// @desc    Get pending customer approvals
// @access  Private/Admin
router.get('/pending-approvals', protect, authorize('admin'), async (req, res) => {
  try {
    const pendingUsers = await User.find({
      role: 'customer',
      status: 'pending'
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/approve-customer/:userId
// @desc    Approve customer account
// @access  Private/Admin
router.put('/approve-customer/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status: 'active' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send notification to customer
    await sendNotification(
      user._id,
      'account_approved',
      'Account Approved',
      'Your account has been approved. You can now login.',
      { userId: user._id }
    );

    res.status(200).json({
      success: true,
      data: user,
      message: 'Customer approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving customer',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/reject-customer/:userId
// @desc    Reject customer account
// @access  Private/Admin
router.put('/reject-customer/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status: 'rejected' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Customer rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting customer',
      error: error.message
    });
  }
});

// @route   POST /api/admin/delivery-partners
// @desc    Create delivery partner
// @access  Private/Admin
router.post('/delivery-partners', protect, authorize('admin'), async (req, res) => {
  try {
    const { fullName, mobileNumber, password, assignedArea, vehicleNumber, vehicleType } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already registered'
      });
    }

    const user = await User.create({
      fullName,
      mobileNumber,
      password,
      role: 'delivery_partner',
      status: 'active',
      assignedArea,
      vehicleNumber,
      vehicleType
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating delivery partner',
      error: error.message
    });
  }
});

// @route   GET /api/admin/delivery-partners
// @desc    Get all delivery partners
// @access  Private/Admin
router.get('/delivery-partners', protect, authorize('admin'), async (req, res) => {
  try {
    const deliveryPartners = await User.find({ role: 'delivery_partner' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveryPartners.length,
      data: deliveryPartners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery partners',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/delivery-partners/:userId
// @desc    Update delivery partner
// @access  Private/Admin
router.put('/delivery-partners/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating delivery partner',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/delivery-partners/:userId
// @desc    Delete delivery partner
// @access  Private/Admin
router.delete('/delivery-partners/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery partner deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting delivery partner',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/delivery-partners/:userId/reset-password
// @desc    Reset delivery partner password
// @access  Private/Admin
router.put('/delivery-partners/:userId/reset-password', protect, authorize('admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Private/Admin
router.get('/analytics', protect, authorize('admin'), async (req, res) => {
  try {
    const { period } = req.query; // daily, weekly, monthly
    
    let startDate;
    const now = new Date();
    
    if (period === 'daily') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === 'weekly') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Order analytics
    const orders = await Order.find({
      createdAt: { $gte: startDate }
    });

    const orderStats = {
      total: orders.length,
      byStatus: {
        received: orders.filter(o => o.orderStatus === 'received').length,
        preparing: orders.filter(o => o.orderStatus === 'preparing').length,
        assigned: orders.filter(o => o.orderStatus === 'assigned').length,
        out_for_delivery: orders.filter(o => o.orderStatus === 'out_for_delivery').length,
        delivered: orders.filter(o => o.orderStatus === 'delivered').length,
        cancelled: orders.filter(o => o.orderStatus === 'cancelled').length
      },
      totalRevenue: orders.reduce((sum, o) => sum + o.finalAmount, 0)
    };

    // Product analytics
    const products = await Product.find();
    const productStats = {
      total: products.length,
      byCategory: {
        dairy: products.filter(p => p.category === 'dairy').length,
        meat: products.filter(p => p.category === 'meat').length,
        poultry: products.filter(p => p.category === 'poultry').length,
        grocery: products.filter(p => p.category === 'grocery').length
      }
    };

    // Customer analytics
    const customers = await User.find({ role: 'customer' });
    const customerStats = {
      total: customers.length,
      active: customers.filter(c => c.status === 'active').length,
      pending: customers.filter(c => c.status === 'pending').length
    };

    res.status(200).json({
      success: true,
      data: {
        orders: orderStats,
        products: productStats,
        customers: customerStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});

module.exports = router;
