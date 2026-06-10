import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/waiter/orders/requested', { waitUntil: 'networkidle0' });
  
  // Expose a function to see console logs
  page.on('console', msg => console.log('LOG:', msg.text()));

  // Override confirm
  await page.evaluate(() => {
    window.confirm = (msg) => {
      console.log('Confirm dialog triggered:', msg);
      return true; // Always return true
    };
  });

  // Find the button and click
  const buttons = await page.$$('button');
  let cancelBtn = null;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Cancel Order')) {
      cancelBtn = btn;
      break;
    }
  }

  if (cancelBtn) {
    console.log('Clicking Cancel Order button...');
    await cancelBtn.click();
    await page.waitForTimeout(2000);
    console.log('Wait finished');
  } else {
    console.log('No Cancel Order button found');
  }

  await browser.close();
})();
