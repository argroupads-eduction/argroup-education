"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// POST /api/newsletter/subscribe - Subscribe to newsletter
router.post('/subscribe', [(0, express_validator_1.body)('email').isEmail().withMessage('Invalid email')], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { email } = req.body;
        // TODO: Save to database via Prisma
        // TODO: Send welcome email
        res.json({
            success: true,
            message: 'Successfully subscribed to newsletter!',
        });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res
                .status(400)
                .json({ success: false, message: 'Email already subscribed' });
        }
        res.status(500).json({ success: false, message: 'Error subscribing' });
    }
});
exports.default = router;
//# sourceMappingURL=newsletter.js.map