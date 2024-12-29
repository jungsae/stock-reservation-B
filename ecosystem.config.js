module.exports = {
    apps: [{
        name: 'backend',
        script: './app.js',
        instances: 0,
        autorestart: true,
        watch: false,
        node_args: "--max-old-space-size=256",
        max_memory_restart: '300M',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            DATABASE_URL: process.env.DATABASE_URL,
        }
    }]
};