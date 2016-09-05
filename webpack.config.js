module.exports = {
    entry: './lib/server.js',
    output: {
        path: './lib',
        filename: 'SERVER.js',
        library: 'SERVER',
        libraryTarget: 'umd'
    },
    target:'node'
};
