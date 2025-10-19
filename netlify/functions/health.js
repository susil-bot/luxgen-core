const { handler } = require('./api');

// Health check function
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(o => o.trim()).join(',') : 
      '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight' })
    };
  }

  try {
    // Create a mock request for the health endpoint
    const mockEvent = {
      ...event,
      path: '/health',
      httpMethod: 'GET'
    };

    const result = await handler(mockEvent, context);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'luxgen-backend-netlify',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        netlify: {
          region: process.env.AWS_REGION || 'us-east-1',
          requestId: event.headers['x-amzn-requestid'] || 'unknown',
          functionName: 'health'
        }
      })
    };
  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
