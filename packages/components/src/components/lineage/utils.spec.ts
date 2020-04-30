import { getBackupImageFromLineageNode, getImageNameWithTheme, getImagesForNode } from './utils';
import { LineageNode, LineageNodeMetadata } from './models';

describe('getImageNameWithTheme', () => {
    it('support all parameter combinations', () => {
        expect(getImageNameWithTheme('test', false, false)).toBe('test_gray.svg');
        expect(getImageNameWithTheme('test', true, false)).toBe('test.svg');
        expect(getImageNameWithTheme('test', false, true)).toBe('test_orange.svg');
        expect(getImageNameWithTheme('test', true, true)).toBe('test_orange.svg');
    });
});

describe('getBackupImageFromLineageNode', () => {
    it('provide backup image', () => {
        const node = LineageNode.create('test', { cpasType: 'Test' });
        expect(getBackupImageFromLineageNode(node, false, false)).toBe('https://labkey.org/_images/default_gray.svg');
    });

    it('use samples based on cpasType', () => {
        const node = LineageNode.create('test', { cpasType: 'SampleSet' });
        expect(getBackupImageFromLineageNode(node, false, false)).toBe('https://labkey.org/_images/samples_gray.svg');
    });
});

describe('getImagesForNode', () => {
    it('accept no arguments', () => {
        expect(getImagesForNode()).toStrictEqual({
            image: '/labkey/_images/default_gray.svg',
            imageBackup: 'https://labkey.org/_images/default_gray.svg',
            imageSelected: '/labkey/_images/default_orange.svg',
            shape: 'circularImage',
        });
    });

    it('use meta supplied iconURL', () => {
        const node = LineageNode.create('test', {
            meta: new LineageNodeMetadata({
                iconURL: 'aladdin',
            }),
            type: 'run',
        });
        expect(getImagesForNode(node)).toStrictEqual({
            image: '/labkey/_images/aladdin_gray.svg',
            imageBackup: 'https://labkey.org/_images/default_gray.svg',
            imageSelected: '/labkey/_images/aladdin_orange.svg',
            shape: 'circularImage',
        });
    });

    it('support run type nodes', () => {
        const node = LineageNode.create('test', { type: 'run' });
        expect(getImagesForNode(node)).toStrictEqual({
            image: '/labkey/_images/run_gray.svg',
            imageBackup: 'https://labkey.org/_images/default_gray.svg',
            imageSelected: '/labkey/_images/run_orange.svg',
            shape: 'image',
        });
    });
});
