import { Router } from 'express';
import { ContactController } from '../controllers/contactController';

const router = Router();

/**
 * @route   POST /api/contact
 * @desc    Submit contact form
 * @access  Public
 */
router.post('/', ContactController.submitContactForm);

/**
 * @route   POST /api/contact/meeting
 * @desc    Submit meeting request
 * @access  Public
 */
router.post('/meeting', ContactController.submitMeetingRequest);

export default router;
