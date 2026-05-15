"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// POST /api/forms/counselling - Submit counselling form
router.post('/counselling', [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Invalid email'),
    (0, express_validator_1.body)('phone').matches(/^[0-9\s\-\+\(\)]{10,}$/).withMessage('Invalid phone'),
    (0, express_validator_1.body)('course').notEmpty().withMessage('Course is required'),
    (0, express_validator_1.body)('countryPreference').notEmpty().withMessage('Country preference is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { name, email, phone, course, neetScore, countryPreference } = req.body;
        // TODO: Save to database via Prisma
        // TODO: Send confirmation email
        // TODO: Send to WhatsApp
        res.json({
            success: true,
            message: 'Thank you! We will contact you soon.',
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error submitting form' });
    }
});
// POST /api/forms/contact - Submit contact form
router.post('/contact', [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Invalid email'),
    (0, express_validator_1.body)('subject').trim().notEmpty().withMessage('Subject is required'),
    (0, express_validator_1.body)('message').trim().notEmpty().withMessage('Message is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        // TODO: Save to database via Prisma
        // TODO: Send confirmation email
        res.json({
            success: true,
            message: 'Thank you for your message. We will get back to you soon.',
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error submitting form' });
    }
});
exports.default = router;
//# sourceMappingURL=forms.js.map