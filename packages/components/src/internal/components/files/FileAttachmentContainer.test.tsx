/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import {
    FileAttachmentContainer,
    getTransferItemDirectoryEntry,
    isDirectoryEntry,
    isFileEntry,
} from './FileAttachmentContainer';

describe('FileAttachmentContainer', () => {
    test('with single file', () => {
        render(
            <FileAttachmentContainer
                allowMultiple={false}
                allowDirectories={false}
                initialFiles={{ 'file1.txt': new File([], 'file1.txt') }}
            />
        );

        expect(document.querySelector('.file-upload__container').className).toContain('hidden');
        expect(document.querySelector('.attached-file__container')).toHaveTextContent('file1.txt');
    });

    test('with multiple files', () => {
        render(
            <FileAttachmentContainer
                allowMultiple
                allowDirectories={false}
                initialFiles={{
                    'file1.txt': new File([], 'file1.txt'),
                    'file2.txt': new File([], 'file2.txt'),
                }}
            />
        );

        expect(document.querySelector('.file-upload__container').className).toContain('block');
        expect(document.querySelectorAll('.attached-file__container')).toHaveLength(2);
        expect(document.querySelectorAll('.attached-file__container')[0]).toHaveTextContent('file1.txt');
        expect(document.querySelectorAll('.attached-file__container')[1]).toHaveTextContent('file2.txt');

        expect(document.querySelectorAll('.file-upload__file-entry-listing')).toHaveLength(1);
        expect(document.querySelectorAll('.file-upload__scroll-footer')).toHaveLength(0);
    });

    test('with initial file names', () => {
        render(
            <FileAttachmentContainer
                allowMultiple
                allowDirectories={false}
                initialFileNames={['initial1.txt', 'initial2.csv']}
            />
        );

        expect(document.querySelector('.file-upload__container').className).toContain('block');
        expect(document.querySelectorAll('.attached-file__container')).toHaveLength(2);
    });

    test('with initial single file name - no multiples allowed', () => {
        render(
            <FileAttachmentContainer allowMultiple={false} allowDirectories={false} initialFileNames={['single.csv']} />
        );

        expect(document.querySelector('.file-upload__container').className).toContain('hidden');
        expect(document.querySelectorAll('.attached-file__container')).toHaveLength(1);
    });

    test('fileCountSuffix with multiple', () => {
        render(
            <FileAttachmentContainer
                allowMultiple
                allowDirectories={false}
                fileCountSuffix="will be uploaded"
                initialFiles={{
                    'file1.txt': new File([], 'file1.txt'),
                    'file2.txt': new File([], 'file2.txt'),
                }}
            />
        );

        expect(document.querySelector('.file-upload__container').className).toContain('block');
        expect(document.querySelectorAll('.attached-file__container')).toHaveLength(2);
        expect(document.querySelectorAll('.file-upload__file-entry-listing')).toHaveLength(1);
        expect(document.querySelector('.file-upload__scroll-footer')).toHaveTextContent('2 files will be uploaded.');
    });

    test('fileCountSuffix with single', () => {
        render(
            <FileAttachmentContainer
                allowMultiple
                allowDirectories={false}
                fileCountSuffix="will be uploaded"
                initialFiles={{
                    'file1.txt': new File([], 'file1.txt'),
                }}
            />
        );

        expect(document.querySelector('.file-upload__container').className).toContain('block');
        expect(document.querySelectorAll('.attached-file__container')).toHaveLength(1);
        expect(document.querySelectorAll('.file-upload__file-entry-listing')).toHaveLength(1);
        expect(document.querySelector('.file-upload__scroll-footer')).toHaveTextContent('1 file will be uploaded.');
    });
});

describe('File System Helper Functions', () => {
    function mockFileSystemEntry(isDirectory: boolean, isFile: boolean): FileSystemEntry {
        return {
            filesystem: undefined,
            fullPath: undefined,
            isDirectory,
            isFile,
            name: undefined,
            getParent: jest.fn(),
        };
    }

    function mockDataTransferItemList(entry: FileSystemEntry): DataTransferItemList {
        return {
            0: {
                webkitGetAsEntry: jest.fn().mockReturnValue(entry),
            },
        } as unknown as DataTransferItemList;
    }

    describe('isDirectoryEntry', () => {
        it('should return true when entry is a directory', () => {
            const mockDirEntry = mockFileSystemEntry(true, false);
            expect(isDirectoryEntry(mockDirEntry)).toBe(true);
        });

        it('should return false when entry is a file', () => {
            const mockFileEntry = mockFileSystemEntry(false, true);
            expect(isDirectoryEntry(mockFileEntry)).toBe(false);
        });

        it('should return false when entry is undefined', () => {
            expect(isDirectoryEntry(undefined)).toBe(false);
            expect(isDirectoryEntry(null)).toBe(false);
            expect(isDirectoryEntry({} as unknown as FileSystemEntry)).toBe(false);
        });
    });

    describe('isFileEntry', () => {
        it('should return true when entry is a file', () => {
            const mockFileEntry = mockFileSystemEntry(false, true);
            expect(isFileEntry(mockFileEntry)).toBe(true);
        });

        it('should return false when entry is a directory', () => {
            const mockDirEntry = mockFileSystemEntry(true, false);
            expect(isFileEntry(mockDirEntry)).toBe(false);
        });

        it('should return false when entry is undefined', () => {
            expect(isFileEntry(undefined)).toBe(false);
            expect(isFileEntry(null)).toBe(false);
            expect(isFileEntry({} as unknown as FileSystemEntry)).toBe(false);
        });
    });

    describe('getTransferItemDirectoryEntry', () => {
        it('should return directory entry when item at index is a directory', () => {
            const mockDirEntry = mockFileSystemEntry(true, false);
            const mockTransferItems = mockDataTransferItemList(mockDirEntry);

            const result = getTransferItemDirectoryEntry(mockTransferItems, 0);
            expect(result).toBe(mockDirEntry);
            expect(mockTransferItems[0].webkitGetAsEntry).toHaveBeenCalledTimes(1);
        });

        it('should return undefined when item at index is a file', () => {
            const mockFileEntry = mockFileSystemEntry(false, true);
            const mockTransferItems = mockDataTransferItemList(mockFileEntry);

            const result = getTransferItemDirectoryEntry(mockTransferItems, 0);
            expect(result).toBeUndefined();
        });

        it('should return undefined when index is out of bounds', () => {
            expect(getTransferItemDirectoryEntry(undefined as DataTransferItemList, 0)).toBeUndefined();
            expect(getTransferItemDirectoryEntry({} as DataTransferItemList, 999)).toBeUndefined();
        });

        it('should return undefined when webkitGetAsEntry returns null', () => {
            const mockTransferItems = mockDataTransferItemList(null);
            expect(getTransferItemDirectoryEntry(mockTransferItems, 0)).toBeUndefined();
        });
    });
});
