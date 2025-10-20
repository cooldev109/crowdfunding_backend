import { Router } from 'express';
import { ContactController } from '../controllers/contactController';

const router = Router();

/**
 * @route   POST /api/contact
 * @desc    Submit contact form
 * @access  Public
 */
router.post('/', ContactController.submitContactForm);

export default router;
