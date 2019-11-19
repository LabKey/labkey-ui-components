import * as React from 'react';
import renderer from 'react-test-renderer'
import { fromJS } from 'immutable';
import { UserDetailHeader } from './UserDetailHeader';
import { ASSAYDESIGNER, READER } from "../../test/data/users";
import { Button } from "react-bootstrap";


describe("<UserDetailHeader/>", () => {

    test("default properties", () => {
        const component = (
            <UserDetailHeader
                title={'Title'}
                user={READER}
                userProperties={fromJS({})}
                dateFormat={undefined}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("custom properties", () => {
        const component = (
            <UserDetailHeader
                title={'Title (Custom)'}
                user={ASSAYDESIGNER}
                userProperties={fromJS({lastLogin: '2019-11-15 13:50:17.987'})}
                dateFormat={'YYYY-MM-DD'}
                renderButtons={() => <Button>Test</Button>}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});