const logger = require('../../utils/logger');

module.exports = {
    name: 'error',
    once: false,
    execute(error) {
        logger.error('[Client Error]', error.message);
    }
};
