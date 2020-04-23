import React from 'react';
import renderer from 'react-test-renderer';

import { AssayPropertiesInput } from './AssayPropertiesInput';

describe('AssayPropertiesInput', () => {
    test('default properties', () => {
        const tree = renderer.create(
            <AssayPropertiesInput label="Test Property">
                <input type="checkbox" id="checkbox-test-id" />
            </AssayPropertiesInput>
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('with custom props', () => {
        const tree = renderer.create(
            <AssayPropertiesInput
                label="Test Property"
                required={true}
                colSize={5}
                helpTipBody={() => <div>testing</div>}
            >
                <input type="checkbox" id="checkbox-test-id" />
            </AssayPropertiesInput>
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });
});
