import * as React from 'react';
import renderer from 'react-test-renderer';

import { App } from '../../..';

import { SampleEmptyAlert } from './SampleEmptyAlert';

describe('<SampleEmptyAlert/>', () => {
    test('admin', () => {
        const component = <SampleEmptyAlert user={App.TEST_USER_FOLDER_ADMIN} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('author', () => {
        const component = <SampleEmptyAlert user={App.TEST_USER_AUTHOR} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('reader', () => {
        const component = <SampleEmptyAlert user={App.TEST_USER_READER} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom props', () => {
        const component = <SampleEmptyAlert user={App.TEST_USER_READER} className="testClass" message="Test Message" />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
