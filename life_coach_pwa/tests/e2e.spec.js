import { test, expect } from '@playwright/test';

test('Intake form submits and loads Dashboard with Charts', async ({ page }) => {
    // 1. Go to Intake Page
    await page.goto('/');

    // 2. Fill Form
    await page.getByPlaceholder("What should we call you?").fill('Playwright Test');
    const cityInput = page.getByPlaceholder("Search for a city...");
    await cityInput.fill('New York');
    await page.waitForTimeout(1000); // Wait for list
    await cityInput.press('ArrowDown');
    await cityInput.press('Enter');

    // Verify coordinates are populated (wait for it)
    await expect(page.getByLabel('Latitude')).not.toBeEmpty();
    await expect(page.getByLabel('Longitude')).not.toBeEmpty();

    await page.getByLabel('Gender').selectOption('male');
    // If selectOption doesn't work (custom select), might need clicks. 
    // Assuming standard select or using text based fill for checks.

    // Fill Date/Time
    // Note: Date inputs might need specific formatting
    await page.getByLabel("Birth Date").fill('1990-01-01');
    await page.getByLabel("Birth Time").fill('12:00');

    // Fill new profile fields
    await page.getByLabel('Relationship Status').selectOption('single');
    await page.getByLabel('Profession').fill('Technology');
    await page.getByLabel('Sexual Orientation').selectOption('heterosexual');

    // 3. Click Submit
    const submitBtn = page.getByText('Calculate Birth Chart');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 4. Wait for Navigation to Dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // 5. Verify Dashboard Content
    await expect(page.getByText('Welcome, Playwright Test')).toBeVisible();

    // 6. Verify Chart Visibility
    const chartToggle = page.getByText('Show Your Cosmic Blueprint');
    await chartToggle.click();

    // Check for Rashi Chart element
    await expect(page.locator('svg').nth(0)).toBeVisible(); // Assuming NorthIndianChart is an SVG
    await expect(page.getByText('Rashi Chart (D1)')).toBeVisible();

    // 7. Verify Planet Table
    await expect(page.getByText('Planetary Highlights')).toBeVisible();
    await expect(page.getByText('Sun')).toBeVisible();

    // 8. Select a Guru and Start Journey
    await page.getByText('Vaidya Jiva').click();
    await expect(page.getByText('1 Gurus selected')).toBeVisible();

    await page.getByText('Start Journey →').click();

    // 9. Verify Guru Intake Page Loads
    await expect(page.getByText('Vaidya Jiva')).toBeVisible(); // Name
    await expect(page.getByText('Ayurvedic Healer')).toBeVisible(); // Specific Role (Verified Fix)
    await expect(page.getByPlaceholder('Type your answer...')).toBeVisible();

    // 10. Test Context Retention & Seed Offer (Mocked Response)
    // We can't rely on real LLM in CI, but we can check if the UI supports the offer card if it appears.
    // For now, let's just verify the chat input works
    await page.getByPlaceholder('Type your answer...').fill('I feel stressed.');
    await page.getByRole('button', { name: 'Send Message' }).click(); // Send button is icon only
});
