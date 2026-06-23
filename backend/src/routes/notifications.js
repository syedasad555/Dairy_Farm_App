const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendNotification } = require('../services/notificationService');

router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
});

router.get('/unread', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id, isRead: false })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching unread notifications', error: error.message });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking notification as read', error: error.message });
  }
});

router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking notifications as read', error: error.message });
  }
});

router.post('/send', protect, authorize('admin'), async (req, res) => {
  try {
    const { recipientId, title, body, type, data } = req.body;

    const user = await User.findById(recipientId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const notification = await sendNotification(recipientId, type || 'general', title, body, data);

    res.status(201).json({ success: true, data: notification, message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending notification', error: error.message });
  }
});

module.exports = router;
