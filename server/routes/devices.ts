import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Connect device with parent code
router.post('/connect', async (req, res) => {
  try {
    const { parentCode, deviceInfo } = req.body;

    if (!parentCode) {
      return res.status(400).json({ message: 'Parent code is required' });
    }

    // Find parent by code
    const parent = await storage.getUserByParentCode(parentCode);
    if (!parent) {
      return res.status(404).json({ message: 'Invalid parent code' });
    }

    // Check subscription status
    if (!parent.subscriptionActive) {
      return res.status(403).json({ message: 'Parent subscription is inactive' });
    }

    // Get child associated with parent code
    const child = await storage.getChildByParentCode(parentCode);
    if (!child) {
      return res.status(404).json({ message: 'No child found for this parent code' });
    }

    // Register or update device
    await storage.registerDevice({
      childId: child.id,
      parentCode,
      deviceInfo,
      connectedAt: new Date(),
      isActive: true
    });

    res.json({
      success: true,
      childName: child.name,
      message: `Device connected successfully for ${child.name}`
    });

  } catch (error) {
    console.error('Device connection error:', error);
    res.status(500).json({ message: 'Failed to connect device' });
  }
});

// Get device status
router.get('/status', async (req, res) => {
  try {
    // In a real implementation, this would check the device's current status
    // For now, return simulated status
    res.json({
      isLocked: false,
      networkEnabled: true,
      batteryLevel: Math.floor(Math.random() * 100),
      lastActivity: new Date().toISOString(),
      activeSchedule: null
    });
  } catch (error) {
    console.error('Device status error:', error);
    res.status(500).json({ message: 'Failed to get device status' });
  }
});

// Request device unlock
router.post('/request-unlock', async (req, res) => {
  try {
    const { reason } = req.body;
    
    // In a real implementation, this would notify the parent
    console.log('Unlock request received:', reason);
    
    res.json({
      success: true,
      message: 'Unlock request sent to parent'
    });
  } catch (error) {
    console.error('Unlock request error:', error);
    res.status(500).json({ message: 'Failed to send unlock request' });
  }
});

// Sync device status (for background sync)
router.post('/sync-status', async (req, res) => {
  try {
    const { timestamp, battery, network, location } = req.body;
    
    // Store device status update
    console.log('Device status sync:', { timestamp, battery, network, location });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Status sync error:', error);
    res.status(500).json({ message: 'Failed to sync status' });
  }
});

export default router;