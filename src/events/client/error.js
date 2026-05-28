module.exports = {
    name: 'error',
    once: false,
    execute(error) {
        console.error('[Client Error]', error.message);
    }
};
