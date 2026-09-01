async function testStaticServe() {
  const testUrl = 'http://localhost:5000/uploads/products/gallery/test-product-1788255151169-70261c2e.png';
  console.log('Fetching uploaded static asset from:', testUrl);

  try {
    const res = await fetch(testUrl);
    console.log('HTTP GET status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    if (res.status === 200) {
      console.log('✓ Successfully retrieved static gallery image through Express static server!');
    } else {
      console.error('✗ Failed to retrieve static image, status:', res.status);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testStaticServe();
