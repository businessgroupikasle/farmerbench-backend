import fs from 'fs';
import path from 'path';

async function testUploadDefault() {
  const dummyFilePath = path.resolve('scratch/test-sample.png');
  const pngBytes = fs.readFileSync(dummyFilePath);

  console.log('Testing upload to http://localhost:5000/api/upload/image without folder param (default)...');

  const formData = new FormData();
  const fileBlob = new Blob([pngBytes], { type: 'image/png' });
  formData.append('file', fileBlob, 'default-image.png');

  try {
    const res = await fetch('http://localhost:5000/api/upload/image', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    console.log('Default upload response status:', res.status);
    console.log('Default upload response data:', JSON.stringify(data, null, 2));

    if (data.success && data.data?.url?.startsWith('/uploads/') && !data.data.url.includes('/products/gallery/')) {
      console.log('✓ Successfully verified backward compatibility for root uploads:', data.data.url);
      const physicalPath = path.resolve('uploads', data.data.url.replace('/uploads/', ''));
      if (fs.existsSync(physicalPath)) {
        console.log('✓ Physical file exists on server disk at:', physicalPath);
      }
    } else {
      console.error('✗ Unexpected response format:', data);
    }
  } catch (err) {
    console.error('Default upload test failed:', err);
  }
}

testUploadDefault();
