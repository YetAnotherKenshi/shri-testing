import { test, expect } from '@playwright/test';
import path from 'path';

test('Если загрузить некорректный csv, то появится ошибка', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const csvPath = path.resolve('./tests/fixtures/incorrect.csv');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-button').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(csvPath);
    await page.getByTestId('send-button').click();

    await expect(page.getByText(/Ответ сервера содержит некорректные данные/)).toBeVisible();
});

test('Если загрузить корректный csv, то результат выведется правильно', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const csvPath = path.resolve('./tests/fixtures/correct.csv');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-button').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(csvPath);
    await page.getByTestId('send-button').click();

    await expect(page.getByText(/готово!/)).toBeVisible();
    await expect(page.getByTestId('highlights-section')).toBeVisible();
});
