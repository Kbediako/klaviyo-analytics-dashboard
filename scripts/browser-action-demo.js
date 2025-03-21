/**
 * Browser Action Testing Demo Script
 * 
 * This script demonstrates how to properly test the Klaviyo Analytics Dashboard
 * using browser actions, with a focus on ensuring proper scrolling to view all content.
 * 
 * Usage:
 * 1. Start the development server: npm run dev
 * 2. Run this script: node scripts/browser-action-demo.js
 */

const puppeteer = require('puppeteer');

async function runBrowserActionDemo() {
  console.log('Starting Browser Action Demo...');
  
  // Launch browser with specific viewport size to match browser_action tool
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 900,
      height: 600
    }
  });
  
  const page = await browser.newPage();
  
  try {
    // Step 1: Launch the application
    console.log('Step 1: Launching application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'screenshots/01-initial-load.png' });
    await new Promise(r => setTimeout(r, 1000)); // Wait for animations
    
    // Step 2: Verify initial page load
    console.log('Step 2: Verifying initial page load...');
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Step 3: Scroll down to see content below the fold
    console.log('Step 3: Scrolling down to see content below the fold...');
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.screenshot({ path: 'screenshots/02-scrolled-overview.png' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 4: Click on Campaigns tab
    console.log('Step 4: Clicking on Campaigns tab...');
    await page.click('button:has-text("Campaigns")');
    await page.screenshot({ path: 'screenshots/03-campaigns-tab-clicked.png' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 5: Scroll down to see campaigns table
    console.log('Step 5: Scrolling down to see campaigns table...');
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.screenshot({ path: 'screenshots/04-campaigns-scrolled.png' });
    await new Promise(r => setTimeout(r, 2000)); // Wait for data to load
    
    // Step 6: Click on Flows tab
    console.log('Step 6: Clicking on Flows tab...');
    await page.click('button:has-text("Flows")');
    await page.screenshot({ path: 'screenshots/05-flows-tab-clicked.png' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 7: Scroll down to see flows visualization
    console.log('Step 7: Scrolling down to see flows visualization...');
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.screenshot({ path: 'screenshots/06-flows-scrolled.png' });
    await new Promise(r => setTimeout(r, 2000)); // Wait for data to load
    
    // Step 8: Click on Forms tab
    console.log('Step 8: Clicking on Forms tab...');
    await page.click('button:has-text("Forms")');
    await page.screenshot({ path: 'screenshots/07-forms-tab-clicked.png' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 9: Scroll down to see forms data
    console.log('Step 9: Scrolling down to see forms data...');
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.screenshot({ path: 'screenshots/08-forms-scrolled.png' });
    await new Promise(r => setTimeout(r, 2000)); // Wait for data to load
    
    // Step 10: Click on Segments tab
    console.log('Step 10: Clicking on Segments tab...');
    await page.click('button:has-text("Segments")');
    await page.screenshot({ path: 'screenshots/09-segments-tab-clicked.png' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 11: Scroll down to see segments data
    console.log('Step 11: Scrolling down to see segments data...');
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.screenshot({ path: 'screenshots/10-segments-scrolled.png' });
    await new Promise(r => setTimeout(r, 2000)); // Wait for data to load
    
    // Step 12: Return to Overview tab
    console.log('Step 12: Returning to Overview tab...');
    await page.click('button:has-text("Overview")');
    await page.screenshot({ path: 'screenshots/11-overview-tab-clicked.png' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 13: Final scroll to see all overview content
    console.log('Step 13: Final scroll to see all overview content...');
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.screenshot({ path: 'screenshots/12-overview-scrolled.png' });
    
    console.log('Browser Action Demo completed successfully!');
    console.log('Screenshots saved to the screenshots directory.');
    
  } catch (error) {
    console.error('Error during browser action demo:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Create screenshots directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the demo
runBrowserActionDemo().catch(console.error);
