import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { GeneratePage } from '@pages/Generate';

describe('Генерация данных', () => {
    afterEach(() => {
        cleanup();
    });

    it('Если начать скачивание файла, то показывается лоадер', async () => {
        const { container } = render(<GeneratePage />);

        const generateButton = container.querySelector('[data-testid="generate-button"]') as HTMLElement;
        fireEvent.click(generateButton);

        const loader = container.querySelector('[data-testid="loader"]');
        expect(loader).not.toBeNull();
    });

    it('Если произойдет HTTP ошибка, то показывается ошибка', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
        });

        const { container, findByTestId } = render(<GeneratePage />);
        const generateButton = container.querySelector('[data-testid="generate-button"]') as HTMLElement;
        fireEvent.click(generateButton);

        const errorText = await findByTestId('error-message');
        expect(errorText).not.toBeNull();

        (global.fetch as any).mockRestore?.();
    });

    it('Если произойдет сетевая ошибка, то показывается ошибка', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

        const { container, findByTestId } = render(<GeneratePage />);
        const generateButton = container.querySelector('[data-testid="generate-button"]') as HTMLElement;
        fireEvent.click(generateButton);

        const errorText = await findByTestId('error-message');
        expect(errorText).not.toBeNull();

        (global.fetch as any).mockRestore?.();
    });
});
