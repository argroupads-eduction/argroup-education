'use strict';

/**
 * Controllers are optional for admin-only content types.
 * REST can be enabled later; Step 3 uses admin + import script.
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::post.post');
