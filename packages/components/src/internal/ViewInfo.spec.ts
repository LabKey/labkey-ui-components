import { List } from 'immutable';

import { ViewInfo } from './ViewInfo';

describe('ViewInfo', () => {
    test('create', () => {
        let view = ViewInfo.create({ name: 'test', label: 'Testing' });
        expect(view.name).toBe('test');
        expect(view.label).toBe('Testing');

        view = ViewInfo.create({ name: 'test', label: 'Testing', default: true });
        expect(view.name).toBe(ViewInfo.DEFAULT_NAME);
        expect(view.label).toBe('Default');

        view = ViewInfo.create({ default: true });
        expect(view.name).toBe(ViewInfo.DEFAULT_NAME);
        expect(view.label).toBe('Default');
    });

    test('serialize', () => {
        let view = ViewInfo.create({ name: 'test' });
        expect(ViewInfo.serialize(view).name).toBe('test');
        view = ViewInfo.create({ name: ViewInfo.DEFAULT_NAME });
        expect(ViewInfo.serialize(view).name).toBe('');

        const filterObj = { fieldKey: 'test', value: 'val', op: 'contains' };
        view = ViewInfo.create({ filter: [filterObj] });
        expect(ViewInfo.serialize(view).filters).toBe(undefined);
        expect(ViewInfo.serialize(view).filter).toStrictEqual(List([filterObj]));

        const sortObj = { fieldKey: 'test', dir: '+' };
        view = ViewInfo.create({ sort: [sortObj] });
        expect(ViewInfo.serialize(view).sorts).toBe(undefined);
        expect(ViewInfo.serialize(view).sort).toStrictEqual(List([sortObj]));
    });

    test('isVisible', () => {
        let view = ViewInfo.create({ default: false, hidden: false, name: 'test' });
        expect(view.isVisible).toBeTruthy();
        view = ViewInfo.create({ default: true, hidden: false, name: 'test' });
        expect(view.isVisible).toBeFalsy();
        view = ViewInfo.create({ default: false, hidden: true, name: 'test' });
        expect(view.isVisible).toBeFalsy();
        view = ViewInfo.create({ default: false, hidden: false, name: '~~DETAILS~~' });
        expect(view.isVisible).toBeFalsy();
        view = ViewInfo.create({ default: false, hidden: false, name: ViewInfo.BIO_DETAIL_NAME });
        expect(view.isVisible).toBeFalsy();
    });

    test('isSaved', () => {
        expect(ViewInfo.create({}).isSaved).toBeFalsy();
        expect(ViewInfo.create({ saved: undefined }).isSaved).toBeFalsy();
        expect(ViewInfo.create({ saved: false }).isSaved).toBeFalsy();
        expect(ViewInfo.create({ saved: true }).isSaved).toBeTruthy();
    });
});
