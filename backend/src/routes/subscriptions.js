const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Product = require('../models/Product');
const { protect, authorize, isActive } = require('../middleware/auth');
const { sendNotification } = require('../services/notificationService');

router.post('/', protect, authorize('customer'), isActive, async (req, res) => {
  try {
    const { productId, variant, quantity, deliverySchedule, deliveryDays, deliveryTime, deliveryAddress, startDate, specialInstructions } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variantData = product.variants.find(v => v.size === variant);
    if (!variantData) {
      return res.status(400).json({ success: false, message: 'Invalid variant' });
    }

    const subscription = await Subscription.create({
      customer: req.user.id,
      product: productId,
      variant,
      quantity,
      deliverySchedule,
      deliveryDays,
      deliveryTime,
      deliveryAddress,
      startDate: startDate || new Date(),
      pricePerDelivery: variantData.price * quantity,
      specialInstructions,
    });

    await subscription.populate('product');

    await sendNotification(req.user.id, 'subscription_created', 'Subscription Created',
      `Your ${product.name} subscription (${deliverySchedule}) has been set up.`);

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating subscription', error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }

    const subscriptions = await Subscription.find(query)
      .populate('product')
      .populate('customer', 'fullName mobileNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: subscriptions.length, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscriptions', error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id).populate('product');
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    if (req.user.role === 'customer' && subscription.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscription', error: error.message });
  }
});

router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    if (req.user.role === 'customer' && subscription.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    subscription.status = status;
    if (status === 'cancelled') subscription.endDate = new Date();
    await subscription.save();

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating subscription', error: error.message });
  }
});

module.exports = router;
