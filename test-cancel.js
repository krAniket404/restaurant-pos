import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Intercept dialogs and accept them automatically
  page.on('dialog', async dialog => {
    console.log('Dialog appeared:', dialog.message());
    await dialog.accept();
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:3000/waiter/orders/requested', { waitUntil: 'networkidle0' });
  
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
    console.log('Finished waiting');
  } else {
    console.log('No Cancel Order button found');
  }

  await browser.close();
})();
