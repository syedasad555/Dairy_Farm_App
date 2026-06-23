const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/deliveries/today
// @desc    Get today's deliveries for delivery partner
// @access  Private/Delivery Partner
router.get('/today', protect, authorize('delivery_partner'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const deliveries = await Delivery.find({
      deliveryPartner: req.user.id,
      createdAt: { $gte: today, $lt: tomorrow }
    })
    .populate({
      path: 'order',
      populate: { path: 'customer', select: 'fullName mobileNumber' }
    })
    .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching deliveries',
      error: error.message
    });
  }
});

// @route   GET /api/deliveries/pending
// @desc    Get pending deliveries for delivery partner
// @access  Private/Delivery Partner
router.get('/pending', protect, authorize('delivery_partner'), async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      deliveryPartner: req.user.id,
      deliveryStatus: { $in: ['assigned', 'picked_up', 'in_transit'] }
    })
    .populate({
      path: 'order',
      populate: { path: 'customer', select: 'fullName mobileNumber' }
    })
    .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending deliveries',
      error: error.message
    });
  }
});

// @route   GET /api/deliveries/completed
// @desc    Get completed deliveries for delivery partner
// @access  Private/Delivery Partner
router.get('/completed', protect, authorize('delivery_partner'), async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      deliveryPartner: req.user.id,
      deliveryStatus: 'delivered'
    })
    .populate({
      path: 'order',
      populate: { path: 'customer', select: 'fullName mobileNumber' }
    })
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching completed deliveries',
      error: error.message
    });
  }
});

// @route   GET /api/deliveries/:id
// @desc    Get single delivery by ID
// @access  Private/Delivery Partner
router.get('/:id', protect, authorize('delivery_partner'), async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate({
        path: 'order',
        populate: [
          { path: 'customer', select: 'fullName mobileNumber' },
          { path: 'items.product' }
        ]
      });

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    if (delivery.deliveryPartner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching delivery', error: error.message });
  }
});

// @route   POST /api/deliveries/optimize-route
// @desc    Optimize delivery route
// @access  Private/Delivery Partner
router.post('/optimize-route', protect, authorize('delivery_partner'), async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    const orders = await Order.find({
      _id: { $in: orderIds },
      deliveryPartner: req.user.id,
      orderStatus: { $in: ['assigned', 'out_for_delivery'] }
    }).populate('customer');

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No orders found for optimization'
      });
    }

    // Simple route optimization based on distance from current location
    const deliveryPartner = await User.findById(req.user.id);
    const currentLocation = deliveryPartner?.currentLocation?.coordinates || [0, 0];

    const sortedOrders = orders.sort((a, b) => {
      const coordsA = a.deliveryAddress?.location?.coordinates || [0, 0];
      const coordsB = b.deliveryAddress?.location?.coordinates || [0, 0];
      const distA = calculateDistance(currentLocation[1], currentLocation[0], coordsA[1], coordsA[0]);
      const distB = calculateDistance(currentLocation[1], currentLocation[0], coordsB[1], coordsB[0]);
      return distA - distB;
    });

    // Create optimized route
    const route = sortedOrders.map((order, index) => ({
      stopNumber: index + 1,
      order: order._id,
      address: `${order.deliveryAddress.addressLine}, ${order.deliveryAddress.city}`,
      location: order.deliveryAddress.location,
      estimatedArrival: new Date(Date.now() + (index + 1) * 30 * 60000), // 30 min per stop
      status: 'pending'
    }));

    res.status(200).json({
      success: true,
      data: {
        route,
        totalStops: route.length,
        estimatedDuration: route.length * 30
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error optimizing route',
      error: error.message
    });
  }
});

// @route   PUT /api/deliveries/:id/status
// @desc    Update delivery status
// @access  Private/Delivery Partner
router.put('/:id/status', protect, authorize('delivery_partner'), async (req, res) => {
  try {
    const { deliveryStatus } = req.body;
    
    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    if (delivery.deliveryPartner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this delivery'
      });
    }

    delivery.deliveryStatus = deliveryStatus;
    await delivery.save();

    // Update order status accordingly
    const order = await Order.findById(delivery.order);
    if (order) {
      if (deliveryStatus === 'in_transit') {
        order.orderStatus = 'out_for_delivery';
      } else if (deliveryStatus === 'delivered') {
        order.orderStatus = 'delivered';
      }
      await order.save();
    }

    res.status(200).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating delivery status',
      error: error.message
    });
  }
});

// @route   PUT /api/deliveries/:id/location
// @desc    Update delivery partner location
// @access  Private/Delivery Partner
router.put('/:id/location', protect, authorize('delivery_partner'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    if (delivery.deliveryPartner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this delivery'
      });
    }

    delivery.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };

    await delivery.save();

    res.status(200).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;
