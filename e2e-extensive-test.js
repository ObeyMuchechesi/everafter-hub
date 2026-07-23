const puppeteer = require('puppeteer');

(async () => {
  console.log("Starting extensive smoke test...");
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 100, 
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if(msg.type() === 'error') console.error('PAGE ERROR LOG:', msg.text());
  });
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));

  try {
    console.log("Navigating to login page...");
    await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle2', timeout: 120000 });
    
    console.log("Logging in...");
    await page.type('input[type="email"]', 'admin@everafter.com');
    await page.type('input[type="password"]', 'admin123');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('.sign-in-btn')
    ]);
    console.log("Logged in successfully, navigated to:", page.url());

    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Selecting the Mega Event to manage...");
    const manageBtn = await page.waitForSelector('button::-p-text(Manage →)');
    await manageBtn.click();
    console.log("Clicked Manage button for an event.");
    
    await new Promise(r => setTimeout(r, 1500));

    console.log("In Guests Tab - Adding a Guest...");
    const addGuestBtn = await page.waitForSelector('button::-p-text(+ Add Guest)');
    await addGuestBtn.click();
    
    await page.waitForSelector('input[placeholder="First Name"]', { timeout: 5000 });
    await page.type('input[placeholder="First Name"]', 'Automated');
    await page.type('input[placeholder="Surname"]', 'Tester');
    await page.type('input[placeholder="Table Number"]', '5');
    
    const submitGuestBtn = await page.waitForSelector('button::-p-text(Add Guest)');
    await submitGuestBtn.click();
    console.log("Added new guest.");
    
    await new Promise(r => setTimeout(r, 1500));

    console.log("Navigating to Timeline tab...");
    const timelineTab = await page.waitForSelector('span::-p-text(timeline)');
    await timelineTab.click();
    await new Promise(r => setTimeout(r, 1000));

    console.log("Navigating to Menu tab...");
    const menuTab = await page.waitForSelector('span::-p-text(menu)');
    await menuTab.click();
    await new Promise(r => setTimeout(r, 1000));

    console.log("Navigating to Photos tab...");
    const photosTab = await page.waitForSelector('span::-p-text(photos)');
    await photosTab.click();
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Navigating to Analytics tab...");
    const analyticsTab = await page.waitForSelector('span::-p-text(analytics)');
    await analyticsTab.click();
    await new Promise(r => setTimeout(r, 1500));

    console.log("Navigating to Live Chat tab...");
    const liveChatTab = await page.waitForSelector('span::-p-text(live chat)');
    await liveChatTab.click();
    await new Promise(r => setTimeout(r, 1000));
    
    await page.type('input[placeholder="Type your message..."]', 'Hello from Puppeteer E2E Test!');
    const sendBtn = await page.waitForSelector('button::-p-text(Send)');
    await sendBtn.click();
    console.log("Sent live chat message.");
    
    await new Promise(r => setTimeout(r, 2000));

    console.log("Navigating to Mega Event Guest Page...");
    await page.goto('http://127.0.0.1:3000/event/mega-event', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Testing Guest Page interactions...");
    try {
      const rsvpBtn = await page.waitForSelector('button::-p-text(RSVP)', { timeout: 2000 });
      await rsvpBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    } catch(e) {
      console.log("No RSVP button found to click.");
    }
    
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Extensive smoke test completed successfully!");
  } catch (err) {
    console.error("Smoke test encountered an error:", err);
  } finally {
    await new Promise(r => setTimeout(r, 4000));
    await browser.close();
  }
})();
