import fs from 'fs';
import path from 'path';

async function testUpload() {
  const dummyFilePath = path.resolve('scratch/test-sample.png');
  // 1x1 transparent PNG bytes
  const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(dummyFilePath, pngBytes);

  console.log('Testing upload to http://localhost:5000/api/upload/image?folder=products/gallery ...');

  const formData = new FormData();
  const fileBlob = new Blob([pngBytes], { type: 'image/png' });
  formData.append('file', fileBlob, 'test-product.png');

  try {
    const res = await fetch('http://localhost:5000/api/upload/image?folder=products/gallery', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    console.log('Upload response status:', res.status);
    console.log('Upload response data:', JSON.stringify(data, null, 2));

    if (data.success && data.data?.url?.startsWith('/uploads/products/gallery/')) {
      console.log('✓ Successfully verified gallery upload to relative path:', data.data.url);
      const physicalPath = path.resolve('uploads', data.data.url.replace('/uploads/', ''));
      if (fs.existsSync(physicalPath)) {
        console.log('✓ Physical file exists on server disk at:', physicalPath);
      } else {
        console.error('✗ File not found at physical path:', physicalPath);
      }
    } else {
      console.error('✗ Unexpected response format:', data);
    }
  } catch (err) {
    console.error('Upload test failed:', err);
  }
}

testUpload();
