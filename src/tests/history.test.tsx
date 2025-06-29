import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { HistoryList } from '@components/HistoryList';
import { HistoryItem } from '@components/HistoryItem';
import { ClearHistoryButton } from '@components/ClearHistoryButton';
import { useHistoryStore } from '@store/historyStore';
import { HistoryItemType } from '@app-types/history';
import { Highlights } from '@app-types/common';
import { addToHistory, clearHistory } from '@utils/storage';

const createMockHighlights = (): Highlights => ({
    total_spend_galactic: 1000,
    rows_affected: 100,
    less_spent_at: 1,
    big_spent_at: 10,
    less_spent_civ: 'humans',
    big_spent_civ: 'monsters',
    less_spent_value: 500,
    big_spent_value: 1500,
    average_spend_galactic: 750,
});

const createMockHistoryItem = (overrides: Partial<HistoryItemType> = {}): HistoryItemType => ({
    id: 'test-1',
    fileName: 'test.csv',
    timestamp: Date.now(),
    highlights: createMockHighlights(),
    ...overrides,
});

describe('История загрузок', () => {
    afterEach(() => {
        cleanup();
        clearHistory();
    });

    describe('HistoryList', () => {
        it('Если история пустая, то список пустой', () => {
            const { container } = render(<HistoryList />);

            const listItems = container.querySelectorAll('[data-testid="history-item"]');
            expect(listItems).toHaveLength(0);
        });

        it('Если в истории есть элементы, то они отображаются', () => {
            const mockItem1 = createMockHistoryItem({ id: 'test-1', fileName: 'test1.csv' });
            const mockItem2 = createMockHistoryItem({ id: 'test-2', fileName: 'test2.csv' });

            addToHistory(mockItem1);
            addToHistory(mockItem2);

            const { getByText } = render(<HistoryList />);

            expect(getByText('test1.csv')).not.toBeNull();
            expect(getByText('test2.csv')).not.toBeNull();
        });

        it('Если нажать кнопку удаления, то элемент удаляется из истории', async () => {
            const mockItem = createMockHistoryItem();
            addToHistory(mockItem);

            const { getByTestId } = render(<HistoryList />);

            const deleteButton = getByTestId('history-item-delete');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(useHistoryStore.getState().history).toHaveLength(0);
            });
        });
    });

    describe('HistoryItem', () => {
        const mockItem = createMockHistoryItem();
        const mockItemWithoutHighlights = createMockHistoryItem({
            id: 'test-2',
            fileName: 'test2.csv',
            highlights: undefined,
        });

        it('Если у элемента есть хайлайты, то он кликабельный', () => {
            const mockOnClick = vi.fn();
            const mockOnDelete = vi.fn();

            const { getByText } = render(<HistoryItem item={mockItem} onClick={mockOnClick} onDelete={mockOnDelete} />);

            const item = getByText('test.csv');
            fireEvent.click(item);

            expect(mockOnClick).toHaveBeenCalledWith(mockItem);
        });

        it('Если у элемента нет хайлайтов, то он не кликабельный', () => {
            const mockOnClick = vi.fn();
            const mockOnDelete = vi.fn();

            const { getByText } = render(
                <HistoryItem item={mockItemWithoutHighlights} onClick={mockOnClick} onDelete={mockOnDelete} />
            );

            const item = getByText('test2.csv');
            fireEvent.click(item);

            expect(mockOnClick).not.toHaveBeenCalled();
        });

        it('Если нажать кнопку удаления, то вызывается onDelete', () => {
            const mockOnClick = vi.fn();
            const mockOnDelete = vi.fn();

            const { getByTestId } = render(
                <HistoryItem item={mockItem} onClick={mockOnClick} onDelete={mockOnDelete} />
            );

            const deleteButton = getByTestId('history-item-delete');
            fireEvent.click(deleteButton);

            expect(mockOnDelete).toHaveBeenCalledWith('test-1');
        });

        it('Отображает правильный статус для успешного элемента', () => {
            const mockOnClick = vi.fn();
            const mockOnDelete = vi.fn();

            const { getByTestId } = render(
                <HistoryItem item={mockItem} onClick={mockOnClick} onDelete={mockOnDelete} />
            );

            const successStatus = getByTestId('status-success');
            const errorStatus = getByTestId('status-error');

            expect(successStatus).not.toBeNull();
            expect(errorStatus).not.toBeNull();
        });

        it('Отображает правильный статус для элемента с ошибкой', () => {
            const mockOnClick = vi.fn();
            const mockOnDelete = vi.fn();

            const { getByTestId } = render(
                <HistoryItem item={mockItemWithoutHighlights} onClick={mockOnClick} onDelete={mockOnDelete} />
            );

            const successStatus = getByTestId('status-success');
            const errorStatus = getByTestId('status-error');

            expect(successStatus).not.toBeNull();
            expect(errorStatus).not.toBeNull();
        });
    });

    describe('ClearHistoryButton', () => {
        it('Если история пустая, то кнопка не отображается', () => {
            const { container } = render(<ClearHistoryButton />);

            expect(container.firstChild).toBeNull();
        });

        it('Если в истории есть элементы, то кнопка отображается', () => {
            const mockItem = createMockHistoryItem();
            useHistoryStore.getState().addToHistory(mockItem);

            const { getByText } = render(<ClearHistoryButton />);

            expect(getByText('Очистить всё')).not.toBeNull();
        });

        it('Если нажать кнопку очистки, то история очищается', async () => {
            const mockItem = createMockHistoryItem();
            useHistoryStore.getState().addToHistory(mockItem);

            const { getByText } = render(<ClearHistoryButton />);

            const clearButton = getByText('Очистить всё');
            fireEvent.click(clearButton);

            await waitFor(() => {
                expect(useHistoryStore.getState().history).toHaveLength(0);
            });
        });
    });

    describe('HistoryStore', () => {
        it('Если добавить элемент в историю, то он появляется в store', () => {
            const mockItem = createMockHistoryItem();

            useHistoryStore.getState().addToHistory(mockItem);

            expect(useHistoryStore.getState().history).toHaveLength(1);
            expect(useHistoryStore.getState().history[0]).toEqual(mockItem);
        });

        it('Если удалить элемент из истории, то он исчезает из store', () => {
            const mockItem = createMockHistoryItem();

            addToHistory(mockItem);
            expect(useHistoryStore.getState().history).toHaveLength(1);

            useHistoryStore.getState().removeFromHistory('test-1');
            expect(useHistoryStore.getState().history).toHaveLength(0);
        });

        it('Если установить выбранный элемент, то он появляется в store', () => {
            const mockItem = createMockHistoryItem();

            useHistoryStore.getState().setSelectedItem(mockItem);

            expect(useHistoryStore.getState().selectedItem).toEqual(mockItem);
        });

        it('Если показать модальное окно, то флаг isOpenModal становится true', () => {
            useHistoryStore.getState().showModal();

            expect(useHistoryStore.getState().isOpenModal).toBe(true);
        });

        it('Если скрыть модальное окно, то флаг isOpenModal становится false', () => {
            useHistoryStore.getState().showModal();
            expect(useHistoryStore.getState().isOpenModal).toBe(true);

            useHistoryStore.getState().hideModal();
            expect(useHistoryStore.getState().isOpenModal).toBe(false);
        });
    });
});
