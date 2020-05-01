import { getImageNameWithTheme, resolveIconAndShapeForNode } from './utils';
import { LineageNode } from './models';

describe('getImageNameWithTheme', () => {
    it('support all parameter combinations', () => {
        expect(getImageNameWithTheme('test', false, false)).toBe('test_gray.svg');
        expect(getImageNameWithTheme('test', true, false)).toBe('test.svg');
        expect(getImageNameWithTheme('test', false, true)).toBe('test_orange.svg');
        expect(getImageNameWithTheme('test', true, true)).toBe('test_orange.svg');
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
            expType: 'ExperimentRun',
        });
        expect(resolveIconAndShapeForNode(node)).toStrictEqual({
            iconURL: 'run',
            image: '/labkey/_images/run_gray.svg',
            imageBackup: 'https://labkey.org/_images/run_gray.svg',
            imageSelected: '/labkey/_images/run_orange.svg',
            imageShape: 'image',
        });
    });
});
