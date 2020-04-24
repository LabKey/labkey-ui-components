import { getBackupImageFromLineageNode, getImageNameWithTheme, resolveIconAndShapeForNode } from './utils';
import { LineageNode } from './models';

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

describe('resolveIconAndShapeForNode', () => {
    it('accept no arguments', () => {
        expect(resolveIconAndShapeForNode()).toStrictEqual({
            iconURL: 'default',
            image: '/labkey/_images/default_gray.svg',
            imageBackup: 'https://labkey.org/_images/default_gray.svg',
            imageSelected: '/labkey/_images/default_orange.svg',
            imageShape: 'circularImage',
        });
    });

    it('support run type nodes', () => {
        const node = LineageNode.create('test', {
            expType: 'run',
            steps: [],
        });
        expect(resolveIconAndShapeForNode(node)).toStrictEqual({
            iconURL: 'run',
            image: '/labkey/_images/run_gray.svg',
            imageBackup: 'https://labkey.org/_images/default_gray.svg',
            imageSelected: '/labkey/_images/run_orange.svg',
            imageShape: 'image',
        });
    });
});
