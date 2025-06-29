import { test, expect } from '@playwright/test';

test.describe('Навигация по navbar', () => {
    test('Переход на страницу генерации', async ({ page }) => {
        // Arrange
        await page.goto('http://localhost:5173');

        // Act
        await page.locator('a[href="/generate"]').click();

        // Assert
        await expect(page).toHaveURL(/.*\/generate/);
    });

    test('Переход на страницу истории', async ({ page }) => {
        // Arrange
        await page.goto('http://localhost:5173');

        // Act
        await page.locator('a[href="/history"]').click();

        // Assert
        await expect(page).toHaveURL(/.*\/history/);
    });

    test('Возврат на главную страницу', async ({ page }) => {
        // Arrange
        await page.goto('http://localhost:5173/generate');

        // Act
        await page.locator('a[href="/"]').click();

        // Assert
        await expect(page).toHaveURL('http://localhost:5173/');
    });
});
