const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Delivery = require('../models/Delivery');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, authorize, isActive } = require('../middleware/auth');
const { sendNotification } = require('../services/notificationService');

async function validateAndBuildOrderItems(items) {
  const orderItems = [];
  let totalAmount = 0;
  const stockUpdates = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      throw new Error(`Product not found or unavailable: ${item.productId}`);
    }

    const variant = product.variants.find(v => v.size === item.variant);
    if (!variant) {
      throw new Error(`Variant "${item.variant}" not found for ${product.name}`);
    }

    if (variant.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name} (${item.variant})`);
    }

    const totalPrice = variant.price * item.quantity;
    totalAmount += totalPrice;

    orderItems.push({
      product: product._id,
      variant: variant.size,
      quantity: item.quantity,
      price: variant.price,
      totalPrice
    });

    stockUpdates.push({ product, variantSize: variant.size, quantity: item.quantity });
  }

  return { orderItems, totalAmount, stockUpdates };
}

async function decrementStock(stockUpdates) {
  for (const { product, variantSize, quantity } of stockUpdates) {
    const variant = product.variants.find(v => v.size === variantSize);
    variant.stock -= quantity;
    await product.save();
  }
}

// @route   POST /api/orders
router.post('/', protect, authorize('customer'), isActive, async (req, res) => {
  try {
    const { items, deliveryAddress, specialInstructions } = req.body;

    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    if (!deliveryAddress?.addressLine || !deliveryAddress?.city) {
      return res.status(400).json({ success: false, message: 'Valid delivery address is required' });
    }

    const { orderItems, totalAmount, stockUpdates } = await validateAndBuildOrderItems(items);

    const order = await Order.create({
      customer: req.user.id,
      items: orderItems,
      deliveryAddress,
      totalAmount,
      finalAmount: totalAmount,
      specialInstructions
    });

    await decrementStock(stockUpdates);
    await order.populate('items.product');

    await sendNotification(
      req.user.id,
      'order_placed',
      'Order Placed',
      `Your order ${order.orderNumber} has been received.`,
      { orderId: order._id }
    );

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating order'
    });
  }
});

// @route   GET /api/orders
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'delivery_partner') {
      query.deliveryPartner = req.user.id;
    }

    if (req.user.role === 'admin') {
      const { status, orderStatus, startDate, endDate, customer, deliveryPartner } = req.query;
      const statusFilter = status || orderStatus;
      if (statusFilter) query.orderStatus = statusFilter;
      if (customer) query.customer = customer;
      if (deliveryPartner) query.deliveryPartner = deliveryPartner;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
    }

    const orders = await Order.find(query)
      .populate('customer', 'fullName mobileNumber')
      .populate('deliveryPartner', 'fullName mobileNumber currentLocation')
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
  }
});

// @route   GET /api/orders/:id/tracking
router.get('/:id/tracking', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('deliveryPartner', 'fullName mobileNumber currentLocation');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role === 'customer' && order.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const delivery = await Delivery.findOne({ order: order._id });

    const partnerLocation = order.deliveryPartner?.currentLocation?.coordinates ||
      delivery?.currentLocation?.coordinates || null;

    res.status(200).json({
      success: true,
      data: {
        orderStatus: order.orderStatus,
        orderNumber: order.orderNumber,
        deliveryAddress: order.deliveryAddress,
        deliveryPartner: order.deliveryPartner ? {
          name: order.deliveryPartner.fullName,
          mobile: order.deliveryPartner.mobileNumber,
          location: partnerLocation ? {
            latitude: partnerLocation[1],
            longitude: partnerLocation[0]
          } : null
        } : null,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        actualDeliveryTime: order.actualDeliveryTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tracking data', error: error.message });
  }
});

// @route   GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'fullName mobileNumber addresses')
      .populate('deliveryPartner', 'fullName mobileNumber currentLocation')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this order' });
    }

    if (req.user.role === 'delivery_partner' && order.deliveryPartner?._id?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching order', error: error.message });
  }
});

// @route   PUT /api/orders/:id/status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role === 'delivery_partner' && order.deliveryPartner?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    if (req.user.role === 'customer' && orderStatus !== 'cancelled') {
      return res.status(403).json({ success: false, message: 'Customers can only cancel orders' });
    }

    order.orderStatus = orderStatus;

    if (orderStatus === 'delivered') {
      order.actualDeliveryTime = new Date();
    }

    await order.save();

    const statusMessages = {
      preparing: 'Your order is being prepared.',
      assigned: 'A delivery partner has been assigned to your order.',
      out_for_delivery: 'Your order is out for delivery!',
      delivered: 'Your order has been delivered.',
      cancelled: 'Your order has been cancelled.'
    };

    if (statusMessages[orderStatus]) {
      await sendNotification(
        order.customer,
        `order_${orderStatus}`,
        'Order Update',
        statusMessages[orderStatus],
        { orderId: order._id }
      );
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating order status', error: error.message });
  }
});

// @route   PUT /api/orders/:id/assign
router.put('/:id/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const partner = await User.findById(deliveryPartnerId);
    if (!partner || partner.role !== 'delivery_partner') {
      return res.status(400).json({ success: false, message: 'Invalid delivery partner' });
    }

    order.deliveryPartner = deliveryPartnerId;
    order.orderStatus = 'assigned';
    await order.save();

    const existingDelivery = await Delivery.findOne({ order: order._id });
    if (!existingDelivery) {
      await Delivery.create({
        deliveryPartner: deliveryPartnerId,
        order: order._id,
        deliveryStatus: 'assigned'
      });
    }

    await sendNotification(
      order.customer,
      'delivery_assigned',
      'Delivery Partner Assigned',
      'A delivery partner has been assigned to your order.',
      { orderId: order._id }
    );

    await sendNotification(
      deliveryPartnerId,
      'new_delivery',
      'New Delivery Assigned',
      `You have a new delivery for order ${order.orderNumber}.`,
      { orderId: order._id }
    );

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error assigning delivery partner', error: error.message });
  }
});

// @route   PUT /api/orders/:id/delivery-proof
router.put('/:id/delivery-proof', protect, authorize('delivery_partner'), async (req, res) => {
  try {
    const { image, gpsCoordinates } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.deliveryPartner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    order.deliveryProof = {
      image,
      gpsCoordinates: {
        type: 'Point',
        coordinates: [gpsCoordinates.longitude, gpsCoordinates.latitude]
      },
      timestamp: new Date()
    };
    order.orderStatus = 'delivered';
    order.actualDeliveryTime = new Date();
    await order.save();

    const delivery = await Delivery.findOne({ order: order._id });
    if (delivery) {
      delivery.deliveryStatus = 'delivered';
      await delivery.save();
    }

    await sendNotification(order.customer, 'order_delivered', 'Order Delivered', 'Your order has been delivered successfully!', { orderId: order._id });

    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await sendNotification(admin._id, 'delivery_completed', 'Delivery Completed', `Order ${order.orderNumber} has been delivered.`, { orderId: order._id });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting delivery proof', error: error.message });
  }
});

// @route   POST /api/orders/:id/rate
router.post('/:id/rate', protect, authorize('customer'), async (req, res) => {
  try {
    const { rating, review } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to rate this order' });
    }

    order.customerRating = { rating, review, ratedAt: new Date() };
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error rating order', error: error.message });
  }
});

module.exports = router;
