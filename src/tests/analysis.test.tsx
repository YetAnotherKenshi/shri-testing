import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { HomePage } from '@pages/Home';
import { useAnalysisStore } from '@store/analysisStore';

describe('Анализ данных', () => {
    afterEach(() => {
        cleanup();
        useAnalysisStore.getState().reset();
    });

    it('Если загрузить не CSV файл, то появится ошибка', async () => {
        const { container } = render(<HomePage />);
        const dropzone = container.querySelector('[data-testid="dropzone"]');

        const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [new File(['not csv'], 'test.txt', { type: 'text/plain' })] } });

        const status = dropzone?.querySelector('p');
        expect(status?.textContent).toBe('Можно загружать только *.csv файлы');
    });

    it('Если перетащить CSV файл, то он загрузится успешно', () => {
        const { container } = render(<HomePage />);
        const dropzone = container.querySelector('[data-testid="dropzone"]') as HTMLElement;

        const csvFile = new File([''], 'test.csv', { type: 'text/csv' });

        fireEvent.dragEnter(dropzone, {
            dataTransfer: {
                files: [csvFile],
            },
        });

        const status = container.querySelector('[data-testid="dropzone-status"]');
        expect(status?.textContent).toBe('Отпустите для загрузки');

        fireEvent.drop(dropzone, {
            dataTransfer: {
                files: [csvFile],
            },
        });

        expect(status?.textContent).toBe('файл загружен!');
    });

    it('Если перетащить не CSV файл, то должна появиться ошибка', () => {
        const { container } = render(<HomePage />);
        const dropzone = container.querySelector('[data-testid="dropzone"]') as HTMLElement;

        const txtFile = new File(['some text content'], 'test.txt', { type: 'text/plain' });

        fireEvent.dragEnter(dropzone, {
            dataTransfer: {
                files: [txtFile],
            },
        });

        const status = container.querySelector('[data-testid="dropzone-status"]');

        expect(status?.textContent).toBe('Отпустите для загрузки');

        fireEvent.drop(dropzone, {
            dataTransfer: {
                files: [txtFile],
            },
        });

        expect(status?.textContent).toBe('Можно загружать только *.csv файлы');
    });

    it('Если начать обработку файла, то показывается лоадер', async () => {
        const { container } = render(<HomePage />);
        const dropzone = container.querySelector('[data-testid="dropzone"]') as HTMLElement;

        const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, {
            target: { files: [new File([''], 'test.csv', { type: 'text/csv' })] },
        });

        const sendButton = container.querySelector('[data-testid="send-button"]') as HTMLElement;
        fireEvent.click(sendButton);

        const loader = container.querySelector('[data-testid="loader"]');
        expect(loader).not.toBeNull();
    });

    it('Если начать обработку файла, то кнопка отправки исчезает', async () => {
        const { container } = render(<HomePage />);
        const dropzone = container.querySelector('[data-testid="dropzone"]') as HTMLElement;

        const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, {
            target: { files: [new File([''], 'test.csv', { type: 'text/csv' })] },
        });

        let sendButton = container.querySelector('[data-testid="send-button"]') as HTMLElement;
        expect(sendButton).not.toBeNull();

        fireEvent.click(sendButton);

        sendButton = container.querySelector('[data-testid="send-button"]') as HTMLElement;
        expect(sendButton).toBeNull();
    });

    it('Если кликнуть на dropzone, то откроется файловый диалог', () => {
        const { container } = render(<HomePage />);
        const dropzone = container.querySelector('[data-testid="dropzone"]') as HTMLElement;
        const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

        const inputClickSpy = vi.spyOn(input, 'click');

        fireEvent.click(dropzone);

        expect(inputClickSpy).toHaveBeenCalled();

        inputClickSpy.mockRestore();
    });

    it('Если нажать кнопку очистки, то файл очищается', () => {
        const { container } = render(<HomePage />);
        const dropzone = container.querySelector('[data-testid="dropzone"]') as HTMLElement;
        const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(input, {
            target: { files: [new File([''], 'test.csv', { type: 'text/csv' })] },
        });

        const status = container.querySelector('[data-testid="dropzone-status"]');
        expect(status?.textContent).toMatch(/файл загружен!/);

        const clearButton = container.querySelector('[data-testid="clear-button"]') as HTMLElement;
        expect(clearButton).not.toBeNull();
        fireEvent.click(clearButton);

        expect(status?.textContent).toMatch(/или перетащите сюда .csv файл/);
    });

    it('Если произойдет HTTP ошибка, то показывается ошибка', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
        });

        const { container, findByText } = render(<HomePage />);
        const dropzone = container.querySelector('[data-testid="dropzone"]') as HTMLElement;
        const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(input, {
            target: { files: [new File([''], 'test.csv', { type: 'text/csv' })] },
        });

        const sendButton = container.querySelector('[data-testid="send-button"]') as HTMLElement;
        expect(sendButton).not.toBeNull();
        fireEvent.click(sendButton);

        const errorText = await findByText(/Неизвестная ошибка парсинга :\(/);
        expect(errorText).not.toBeNull();

        (global.fetch as any).mockRestore?.();
    });

    it('Если произойдет сетевая ошибка, то показывается ошибка', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

        const { container, findByText } = render(<HomePage />);
        const dropzone = container.querySelector('[data-testid="dropzone"]') as HTMLElement;
        const input = dropzone?.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(input, {
            target: { files: [new File([''], 'test.csv', { type: 'text/csv' })] },
        });

        const sendButton = container.querySelector('[data-testid="send-button"]') as HTMLElement;
        expect(sendButton).not.toBeNull();
        fireEvent.click(sendButton);

        const errorText = await findByText(/Неизвестная ошибка парсинга :\(/);
        expect(errorText).not.toBeNull();

        (global.fetch as any).mockRestore?.();
    });
});
