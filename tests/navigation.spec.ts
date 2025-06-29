import { test, expect } from '@playwright/test';

test.describe('Навигация по navbar', () => {
    test('Переход на страницу генерации', async ({ page }) => {
        await page.goto('http://localhost:5173');

        await page.locator('a[href="/generate"]').click();

        await expect(page).toHaveURL(/.*\/generate/);
    });

    test('Переход на страницу истории', async ({ page }) => {
        await page.goto('http://localhost:5173');

        await page.locator('a[href="/history"]').click();

        await expect(page).toHaveURL(/.*\/history/);
    });

    test('Возврат на главную страницу', async ({ page }) => {
        await page.goto('http://localhost:5173/generate');

        await page.locator('a[href="/"]').click();

        await expect(page).toHaveURL('http://localhost:5173/');
    });
});
