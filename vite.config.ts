import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

// Function to get the backend URL and hostname dynamically
function getBackendConfig(): { backendUrl: string; hostname?: string } {
  // Check if we're running on EC2 by looking for the instance metadata
  try {
    // Try to get the public IP from EC2 metadata service
    const publicIp = execSync('curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/public-ipv4', { encoding: 'utf8' }).trim();
    if (publicIp && publicIp.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      console.log(`Detected EC2 environment with public IP: ${publicIp}`);
      return {
        backendUrl: `http://${publicIp}:4000`,
        hostname: `ec2-${publicIp.replace(/\./g, '-')}.compute-1.amazonaws.com`
      };
    }
  } catch {
    // Not on EC2 or metadata service unavailable
  }

  // Fallback to localhost for local development
  console.log('Using localhost backend for development');
  return { backendUrl: 'http://localhost:4000' };
}

const { backendUrl, hostname } = getBackendConfig();

// Generate WebSocket URL from backend URL
const wsUrl = backendUrl.replace('http://', 'ws://');

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Set environment variables based on detected environment
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(backendUrl),
    'import.meta.env.VITE_WS_URL': JSON.stringify(wsUrl),
  },
  preview: {
    host: "0.0.0.0",
    port: 3001,
    strictPort: true,
    // Allow any EC2 hostname pattern to handle IP changes
    allowedHosts: [
      'localhost',
      '.compute-1.amazonaws.com',
      ...(hostname ? [hostname] : [])
    ]
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
