import { test, expect } from '@playwright/test';

test.describe('Wisdom Sync', () => {

    // Helper to complete intake if needed (reusing logic or assuming state)
    // For specific sync testing, we might want to bypass intake if possible, 
    // but without a seed, we need to go through it.

    test.beforeEach(async ({ page }) => {
        // 1. Landing Page
        await page.goto('/');

        // Check if we are on Landing Page (look for Get Started)
        const getStartedBtn = page.getByText('Get Started');
        if (await getStartedBtn.isVisible()) {
            await getStartedBtn.click();

            // 2. Auth Page (Signin)
            // Use provided credentials
            // Click "Sign In" toggle (it's the first one, or use exact text match if unique enough, but here toggle and footer match)
            await page.getByRole('button', { name: 'Sign In' }).first().click();

            await page.getByPlaceholder('you@example.com').fill('mrhandlin@gmail.com');
            await page.getByPlaceholder('••••••••').fill('@Ve3166534848');

            // Click Submit (use type='submit' to distinguish from toggle)
            await page.locator('button[type="submit"]').click();
        }

        // 3. Navigation
        // User likely already has chart, so they go to Dashboard directly
        await page.waitForURL('**/dashboard', { timeout: 15000 });
    });

    test('Add and Delete Wisdom Note persists correctly', async ({ page }) => {
        // Navigate to Wisdom Page
        // Need to check where the link is. Dashboard has "Go to Garden", but maybe Navbar?
        // Navbar usually has links. Assuming /wisdom works directly.
        await page.goto('/wisdom');

        // 1. Add Note
        await page.locator('button').filter({ hasText: '+' }).click(); // FAB button
        await expect(page.getByText('Add Wisdom Note')).toBeVisible();

        const testTitle = 'Test Wisdom ' + Date.now();
        const testContent = 'This is a test content for sync verification.';

        await page.getByLabel('Title').fill(testTitle);
        await page.getByLabel('Content').fill(testContent);
        await page.getByRole('button', { name: 'Save Wisdom' }).click();

        // Verify it appears
        await expect(page.getByText(testTitle)).toBeVisible();

        // 2. Reload to verify persistence (mocking "sync" by reloading state from "server" if possible, 
        // strictly this verifies localStorage persistence if offline, or server pull if online)
        await page.reload();
        await expect(page.getByText(testTitle)).toBeVisible();

        // 3. Delete Note
        // Click the card to expand (maybe needed?) or click trash icon directly
        // Trash icon has click handler that stops propagation, so direct click works.
        // Need to handle confirm dialog
        page.on('dialog', dialog => dialog.accept());

        await page.getByTitle('Delete').first().click();

        // Verify gone
        await expect(page.getByText(testTitle)).not.toBeVisible();

        // 4. Reload again to verify valid deletion persistence
        await page.reload();
        await expect(page.getByText(testTitle)).not.toBeVisible();
    });
});
