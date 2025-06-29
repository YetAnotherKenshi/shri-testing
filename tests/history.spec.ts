import { test, expect } from '@playwright/test';
import path from 'path';

test('Если загрузить корректный csv, то в историю запросов добавится запись с правильным именем и успешным статусом', async ({
    page,
}) => {
    await page.goto('http://localhost:5173');
    const csvPath = path.resolve('./tests/fixtures/correct.csv');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-button').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(csvPath);
    await page.getByTestId('send-button').click();

    await expect(page.getByText(/готово!/)).toBeVisible();

    await page.goto('http://localhost:5173/history');

    await expect(page.getByText('correct.csv')).toBeVisible();

    const successStatus = page.locator('span:has-text("Обработан успешно")');
    await expect(successStatus).toHaveCSS('opacity', '1');

    const errorStatus = page.locator('span:has-text("Не удалось обработать")');
    await expect(errorStatus).toHaveCSS('opacity', '0.5');
});

test('Если загрузить некорректный csv, то в историю запросов добавится запись с правильным именем и неуспешным статусом', async ({
    page,
}) => {
    await page.goto('http://localhost:5173');
    const csvPath = path.resolve('./tests/fixtures/incorrect.csv');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-button').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(csvPath);
    await page.getByTestId('send-button').click();

    await expect(page.getByText(/Ответ сервера содержит некорректные данные/)).toBeVisible();

    await page.goto('http://localhost:5173/history');

    await expect(page.getByText('incorrect.csv')).toBeVisible();

    const errorStatus = page.locator('span:has-text("Не удалось обработать")');
    await expect(errorStatus).toHaveCSS('opacity', '1');

    const successStatus = page.locator('span:has-text("Обработан успешно")');
    await expect(successStatus).toHaveCSS('opacity', '0.5');
});

test('История загрузок сохраняется в LocalStorage', async ({ page, context }) => {
    await page.goto('http://localhost:5173');
    const csvPath = path.resolve('./tests/fixtures/correct.csv');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-button').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(csvPath);
    await page.getByTestId('send-button').click();

    await expect(page.getByText(/готово!/)).toBeVisible();

    const localStorageData = await page.evaluate(() => {
        return localStorage.getItem('tableHistory');
    });

    expect(localStorageData).not.toBeNull();

    const historyData = JSON.parse(localStorageData!);
    expect(Array.isArray(historyData)).toBe(true);
    expect(historyData.length).toBeGreaterThan(0);

    const lastItem = historyData[0];
    expect(lastItem).toHaveProperty('id');
    expect(lastItem).toHaveProperty('timestamp');
    expect(lastItem).toHaveProperty('fileName', 'correct.csv');
    expect(lastItem).toHaveProperty('highlights');
});

test('История загрузок сохраняется между сессиями', async ({ page, context }) => {
    await page.goto('http://localhost:5173');
    const csvPath = path.resolve('./tests/fixtures/correct.csv');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-button').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(csvPath);
    await page.getByTestId('send-button').click();

    await expect(page.getByText(/готово!/)).toBeVisible();

    const localStorageData = await page.evaluate(() => {
        return localStorage.getItem('tableHistory');
    });

    const newPage = await context.newPage();
    await newPage.goto('http://localhost:5173/history');

    await expect(newPage.getByText('correct.csv')).toBeVisible();

    const newLocalStorageData = await newPage.evaluate(() => {
        return localStorage.getItem('tableHistory');
    });

    expect(newLocalStorageData).toBe(localStorageData);
});

test('Очистка истории удаляет данные из LocalStorage', async ({ page, context }) => {
    await page.goto('http://localhost:5173');
    const csvPath = path.resolve('./tests/fixtures/correct.csv');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-button').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(csvPath);
    await page.getByTestId('send-button').click();

    await expect(page.getByText(/готово!/)).toBeVisible();

    await page.goto('http://localhost:5173/history');
    await expect(page.getByText('correct.csv')).toBeVisible();

    await page.getByText('Очистить всё').click();

    await expect(page.getByText('correct.csv')).not.toBeVisible();

    const localStorageData = await page.evaluate(() => {
        return localStorage.getItem('tableHistory');
    });

    expect(localStorageData).toBeNull();
});
