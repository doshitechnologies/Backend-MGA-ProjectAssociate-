// src/server.js
const env = process.env.NODE_ENV || 'development'; // Default to 'development' if NODE_ENV is not set
require('dotenv').config({ path: `.env.${env}` });
const express = require('express');
const path = require('path');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const modalDataRoutes = require('./routes/ArchitectureRoutes');
const interiorRoutes = require('./routes/InteriorRoutes');
const adminRouter = require('./routes/adminRoute')
const cors = require('cors'); // Import CORS

const app = express();
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

require('dotenv').config();


// Middleware
app.use(cors()); // Use CORS middleware
const allowedOrigins = ['*'];

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Routes
app.use('/api/auth', cors(corsOptions),authRoutes);
app.use('/api/architecture',cors(corsOptions), modalDataRoutes);
app.use('/api/interior', interiorRoutes);
app.use(adminRouter)

// Function to list all endpoints
const listEndpoints = (app) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) { // if the middleware is a route
            routes.push(middleware.route);
        } else if (middleware.handle && middleware.handle.stack) { // if the middleware is a router
            middleware.handle.stack.forEach((route) => {
                if (route.route) { // Check if route is defined
                    const methods = Object.keys(route.route.methods).map(method => method.toUpperCase());
                    routes.push({
                        path: route.route.path,
                        methods: methods // This should be an array of methods
                    });
                }
            });
        }
    });
    return routes;
};

// Log all endpoints when the server starts
const logEndpoints = () => {
    const endpoints = listEndpoints(app);
    const baseURL = `http://localhost:${process.env.PORT || 8000}`; // Set the base URL with port
    console.log('Registered API Endpoints:');
    endpoints.forEach(endpoint => {
        // Ensure endpoint.methods is an array before calling join
        if (Array.isArray(endpoint.methods)) {
            console.log(`${endpoint.methods.join(', ')} - ${baseURL}${endpoint.path}`);
        } else {
            console.log(`Unexpected structure for endpoint: ${JSON.stringify(endpoint)}`);
        }
    });
};
console.log('before connect db Starting server...');
// Connect to database
connectDB();
console.log('after connect db Starting server...');
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    logEndpoints(); // Call the function to log endpoints
});
