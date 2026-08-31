const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../farmer_frontend');

// 1. Update vite.config.ts
const viteConfigContent = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@formerbench/shared': path.resolve(__dirname, '../farmer_backend/shared/src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
});
`;
fs.writeFileSync(path.join(frontendDir, 'vite.config.ts'), viteConfigContent, 'utf8');
console.log('✅ Updated vite.config.ts');

// 2. Update tsconfig.json
const tsconfigContent = `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@formerbench/shared": ["../farmer_backend/shared/src/index.ts"]
    }
  },
  "include": ["src"]
}
`;
fs.writeFileSync(path.join(frontendDir, 'tsconfig.json'), tsconfigContent, 'utf8');
console.log('✅ Updated tsconfig.json');
