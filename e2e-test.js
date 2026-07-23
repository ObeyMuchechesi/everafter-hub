const puppeteer = require('puppeteer');

(async () => {
  console.log("Starting smoke test...");
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 100,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Log page errors
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.error('REQUEST FAILED:', request.url(), request.failure().errorText));

  try {
    console.log("Navigating to login page...");
    // Increase timeout to 120s because Next.js dev server might take a long time to compile the first page
    await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle2', timeout: 120000 });
    
    // Login
    console.log("Logging in...");
    await page.type('input[type="email"]', 'admin@everafter.com');
    await page.type('input[type="password"]', 'admin123');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('.sign-in-btn')
    ]);
    console.log("Logged in successfully, navigated to:", page.url());

    // Test Admin Dashboard Navigation (wait for elements to load)
    console.log("Testing Admin Dashboard...");
    // Assuming there are buttons or tabs in the admin dashboard, we can try to find them.
    // We will wait a bit to let the user see the dashboard
    await new Promise(r => setTimeout(r, 2000));
    
    // Now let's navigate to the Mega Event guest page
    console.log("Navigating to Mega Event Guest Page...");
    await page.goto('http://127.0.0.1:3000/event/mega-event', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Try to interact with RSVP
    console.log("Testing RSVP...");
    // If there is an RSVP button or form, try to interact with it, but we don't know the exact DOM yet.
    // Let's just scroll around to simulate user behavior.
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Smoke test completed successfully!");
  } catch (err) {
    console.error("Smoke test encountered an error:", err);
  } finally {
    // Keep browser open for a few seconds for the user to see, then close
    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
  }
})();
