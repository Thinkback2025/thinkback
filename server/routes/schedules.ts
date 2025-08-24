import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Get active schedules for device
router.get('/active', async (req, res) => {
  try {
    // In a real implementation, this would get schedules for the connected device
    // For now, return simulated active schedules
    const currentTime = new Date();
    const schedules = [
      {
        name: 'School Hours',
        isActive: currentTime.getHours() >= 9 && currentTime.getHours() < 15,
        nextChange: '15:00',
        restrictions: ['Social Media', 'Games']
      },
      {
        name: 'Bed Time',
        isActive: currentTime.getHours() >= 22 || currentTime.getHours() < 6,
        nextChange: '06:00',
        restrictions: ['All Apps', 'Internet']
      }
    ];

    res.json(schedules.filter(s => s.isActive));
  } catch (error) {
    console.error('Active schedules error:', error);
    res.status(500).json({ message: 'Failed to get active schedules' });
  }
});

export default router;