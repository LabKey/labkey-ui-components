import { parsePathName } from './URLService';

describe('parsePathName', () => {
    test('old style', () => {
        const url = '/labkey/controller/my%20folder/my%20path/action.view?extra=123';
        expect(parsePathName(url)).toEqual({
            controller: 'controller',
            action: 'action',
            containerPath: '/my folder/my path',
        });
    });

    test('new style', () => {
        const url = '/labkey/my%20folder/my%20path/controller-action.view?extra=123';
        expect(parsePathName(url)).toEqual({
            controller: 'controller',
            action: 'action',
            containerPath: '/my folder/my path',
        });
    });
});
