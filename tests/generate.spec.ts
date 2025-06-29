import { test, expect } from '@playwright/test';

test('Если нажать на кнопку "Начать генерацию", файл успешно загрузится', async ({ page, context }) => {
    await page.goto('http://localhost:5173/generate');
    const generateButton = page.getByTestId('generate-button');

    await generateButton.click();

    await expect(generateButton).toBeDisabled();
    await expect(generateButton.locator('[data-testid="loader"]')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;

    const path = await download.path();
    expect(path).not.toBeNull();

    await expect(page.getByTestId('success-message')).toBeVisible();
});
