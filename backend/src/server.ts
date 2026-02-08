import 'dotenv/config';
import app from './app';

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Network access: http://0.0.0.0:${PORT}`);
});

// Handle server errors
server.on('error', (error: any) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
