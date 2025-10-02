# MongoDB Native Driver Integration This document describes the MongoDB native driver integration added to the LuxGen Trainer Platform backend. ## Overview The backend now includes both Mongoose (for ORM functionality) and the native MongoDB driver for direct database operations. This provides flexibility for different use cases and performance requirements. ## Files Added/Modified ### New Files
- `src/config/mongodb.js` - Native MongoDB driver configuration and connection management
- `src/scripts/test-mongodb-connection.js` - Test script for MongoDB Atlas connection
- `docs/MONGODB_NATIVE_DRIVER.md` - This documentation file ### Modified Files
- `package.json` - Added `mongodb` dependency
- `src/index.js` - Integrated native MongoDB connection with existing setup
- `env.example` - Added MongoDB Atlas configuration ## Configuration ### Environment Variables Add the following to your `.env` file: ```bash
# MongoDB Atlas Configuration (Native Driver)
MONGODB_ATLAS_URI=mongodb+srv://susilfreelancer_db_user:<db_password>@cluster0.lcnv7k5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
``` Replace `<db_password>` with your actual MongoDB Atlas password. ### Dependencies The native MongoDB driver is automatically installed when you run: ```bash
npm install
``` ## Usage ### Basic Connection ```javascript
const { connectToMongoDB, getClient, getDatabase, getCollection } = require('./config/mongodb'); // Connect to MongoDB Atlas
await connectToMongoDB(); // Get the client instance
const client = getClient(); // Get a specific database
const db = getDatabase('my_database'); // Get a specific collection
const collection = getCollection('my_collection');
``` ### Connection Management The native MongoDB driver provides several utility functions: - `connectToMongoDB()` - Establish connection to MongoDB Atlas
- `getClient()` - Get the MongoDB client instance
- `getDatabase(dbName)` - Get a specific database
- `getCollection(collectionName, dbName)` - Get a specific collection
- `testConnection()` - Test the connection health
- `getConnectionStatus()` - Get detailed connection status
- `closeConnection()` - Close the connection gracefully ## API Endpoints ### MongoDB Status Endpoint ```
GET /api/mongodb/status
``` Returns the status of the native MongoDB driver connection: ```json
{ "success": true, "nativeDriver": { "isConnected": true, "isHealthy": true, "hasClient": true, "isClientConnected": true, "connectionState": "connected"}, "timestamp": "2024-01-15T10:30:00.000Z"}
``` ## Testing ### Test Script Run the MongoDB connection test: ```bash
node src/scripts/test-mongodb-connection.js
``` This script will:
1. Connect to MongoDB Atlas
2. Perform a ping test
3. Insert a test document
4. Retrieve the test document
5. Clean up the test data
6. Close the connection ### Health Checks The backend provides multiple health check endpoints: - `/health` - Basic health check
- `/health/detailed` - Detailed health information including database status
- `/api/database/status` - Mongoose connection status
- `/api/mongodb/status` - Native MongoDB driver status ## Integration with Existing Setup The native MongoDB driver is integrated alongside the existing Mongoose setup: 1. **Startup Process**: Both connections are established during server startup
2. **Error Handling**: If the native driver connection fails, the server continues with Mongoose
3. **Graceful Shutdown**: Both connections are properly closed during shutdown
4. **Health Monitoring**: Both connections are monitored via health check endpoints ## Connection Architecture ```
┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│ Application │ │ MongoDB Atlas │ │ Local MongoDB │
│ │ │ │ │ │
│ ┌─────────────┐ │ │ │ │ │
│ │ Mongoose │◄┼────┼──────────────────┼────┼─────────────────┤
│ │ (ORM) │ │ │ │ │ │
│ └─────────────┘ │ │ │ │ │
│ │ │ │ │ │
│ ┌─────────────┐ │ │ │ │ │
│ │ Native │◄┼────┼──────────────────┼────┼─────────────────┤
│ │ Driver │ │ │ │ │ │
│ └─────────────┘ │ │ │ │ │
└─────────────────┘ └──────────────────┘ └─────────────────┘
``` ## Best Practices 1. **Use Mongoose for ORM operations** - Schema validation, middleware, etc.
2. **Use Native Driver for performance-critical operations** - Bulk operations, aggregations, etc.
3. **Monitor both connections** - Use health check endpoints
4. **Handle connection failures gracefully** - The system continues with Mongoose if native driver fails
5. **Use connection pooling** - Both drivers support connection pooling ## Troubleshooting ### Connection Issues 1. **Check environment variables** - Ensure `MONGODB_ATLAS_URI` is set correctly
2. **Verify network access** - Ensure your IP is whitelisted in MongoDB Atlas
3. **Check credentials** - Verify username and password
4. **Test connection** - Use the test script to diagnose issues ### Performance Issues 1. **Monitor connection status** - Use the health check endpoints
2. **Check connection pooling** - Both drivers have connection pooling enabled
3. **Review query patterns** - Use appropriate driver for the use case ## Security Considerations 1. **Environment Variables** - Store connection strings in environment variables
2. **Network Security** - Use MongoDB Atlas IP whitelisting
3. **Authentication** - Use strong passwords and proper authentication
4. **Connection Security** - Use TLS/SSL for all connections ## Future Enhancements - Connection pooling optimization
- Advanced monitoring and metrics
- Automatic failover configuration
- Performance benchmarking tools
- Connection health dashboards 