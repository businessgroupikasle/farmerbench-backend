const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../farmer_frontend/src/pages/ProductDetailPage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Remove useUIStore openAuthModal import if unused or clean it up
content = content.replace("import { useUIStore } from '../store/uiStore';\n", '');
content = content.replace("  const { openAuthModal } = useUIStore();\n", '');

// 2. Replace openAuthModal in handleReviewSubmit with navigate('/register')
content = content.replace(
  `  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }`,
  `  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }`
);

// 3. Replace Sign In button onClick with navigate('/register')
content = content.replace(
  `<Button variant="primary" size="sm" onClick={() => openAuthModal('login')}>
                    Sign In
                  </Button>`,
  `<Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                    Sign In
                  </Button>`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✅ Updated ProductDetailPage.tsx to redirect Sign In to /register');
