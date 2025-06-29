import { describe, it, expect } from 'vitest';
import {
    InvalidServerResponseError,
    isCsvFile,
    transformAnalysisData,
    validateServerResponse,
    convertHighlightsToArray,
} from '@utils/analysis';
import { Highlights } from '@app-types/common';

describe('Analysis Utils', () => {
    describe('isCsvFile', () => {
        it('Если загрузить файл, правильно определяет является ли он CSV', () => {
            const csvFile = new File([''], 'test.csv');
            const txtFile = new File([''], 'test.txt');

            expect(isCsvFile(csvFile)).toBe(true);
            expect(isCsvFile(txtFile)).toBe(false);
        });
    });

    describe('validateServerResponse', () => {
        it('Если передать правильные данные, то успешно валидирует данные', () => {
            const validResponse = {
                average_spend_galactic: 500.2450198019802,
                big_spent_at: 189,
                big_spent_civ: 'monsters',
                big_spent_value: 471007,
                less_spent_at: 31,
                less_spent_civ: 'humans',
                less_spent_value: 369805.5,
                total_spend_galactic: 151574241,
            };
            expect(validateServerResponse(validResponse)).toBe(true);
        });

        it('Если передать данные с null значениями, то выбросит ошибку', () => {
            const invalidResponse = {
                average_spend_galactic: 500.2450198019802,
                big_spent_at: 189,
                big_spent_civ: 'monsters',
                big_spent_value: 471007,
                less_spent_at: 31,
                less_spent_civ: 'humans',
                less_spent_value: null,
                total_spend_galactic: 151574241,
            };
            expect(() => validateServerResponse(invalidResponse)).toThrow(InvalidServerResponseError);
        });

        it('Если передать данные без валидных ключей, то вернёт отрицательный результат валидации', () => {
            const invalidResponse = {
                invalid_key: 'some_value',
                another_invalid: 123,
            };
            expect(validateServerResponse(invalidResponse)).toBe(false);
        });

        it('Если передать пустой объект, то вернёт отрицательный результат валидации', () => {
            const emptyResponse = {};
            expect(validateServerResponse(emptyResponse)).toBe(false);
        });
    });

    describe('convertHighlightsToArray', () => {
        it('Если передать объект с highlights, то правильно преобразует его в массив', () => {
            const highlights: Partial<Highlights> = {
                average_spend_galactic: 500.2450198019802,
                big_spent_at: 189,
                big_spent_civ: 'monsters',
                total_spend_galactic: 151574241,
            };

            const result = convertHighlightsToArray(highlights as Highlights);

            expect(result).toHaveLength(4);
            expect(result[0]).toEqual({
                title: '500',
                description: 'Средние расходы',
            });
            expect(result[1]).toEqual({
                title: '189',
                description: 'День max расходов',
            });
            expect(result[2]).toEqual({
                title: 'monsters',
                description: 'Цивилизация max расходов',
            });
            expect(result[3]).toEqual({
                title: '151574241',
                description: 'Общие расходы',
            });
        });

        it('Если передать объект с неизвестными ключами, то обработает их корректно', () => {
            const highlights = {
                unknown_key: 'some_value',
            };

            const result = convertHighlightsToArray(highlights as any);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                title: 'some_value',
                description: 'Неизвестный параметр',
            });
        });
    });

    describe('transformAnalysisData', () => {
        it('Если передать валидные данные, то правильно обработает их', () => {
            const validData = {
                average_spend_galactic: 500.2450198019802,
                big_spent_at: 189,
                big_spent_civ: 'monsters',
                total_spend_galactic: 151574241,
                rows_affected: 1000,
            };

            const encoder = new TextEncoder();
            const jsonString = JSON.stringify(validData);
            const uint8Array = encoder.encode(jsonString + '\n');

            const result = transformAnalysisData(uint8Array);

            expect(result.highlights).toEqual({
                average_spend_galactic: 500.2450198019802,
                big_spent_at: 189,
                big_spent_civ: 'monsters',
                total_spend_galactic: 151574241,
            });

            expect(result.highlightsToStore).toHaveLength(4);
            expect(result.highlightsToStore[0].title).toBe('500');
            expect(result.highlightsToStore[0].description).toBe('Средние расходы');
        });

        it('Если передать невалидные данные, то выбросит ошибку', () => {
            const invalidData = {
                invalid_key: 'some_value',
            };

            const encoder = new TextEncoder();
            const jsonString = JSON.stringify(invalidData);
            const uint8Array = encoder.encode(jsonString + '\n');

            expect(() => transformAnalysisData(uint8Array)).toThrow(InvalidServerResponseError);
            expect(() => transformAnalysisData(uint8Array)).toThrow('Файл не был корректно обработан на сервере :(');
        });

        it('Если передать данные с null значениями, то выбросит ошибку', () => {
            const invalidData = {
                average_spend_galactic: 500.2450198019802,
                big_spent_at: null,
                big_spent_civ: 'monsters',
            };

            const encoder = new TextEncoder();
            const jsonString = JSON.stringify(invalidData);
            const uint8Array = encoder.encode(jsonString + '\n');

            expect(() => transformAnalysisData(uint8Array)).toThrow(InvalidServerResponseError);
            expect(() => transformAnalysisData(uint8Array)).toThrow(
                'Ответ сервера содержит некорректные данные (null значения)'
            );
        });
    });
});
