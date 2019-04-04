import * as React from 'react';
import { Modal, ProgressBar } from 'react-bootstrap';
import { Progress } from "./Progress";
import { mount } from "enzyme";

beforeAll(() => {
    jest.useFakeTimers();
});

describe("<Progress />", () => {
    test("render not toggled, not modal", () => {
        const progressBar = mount(<Progress toggle={false}/>);
        expect(progressBar.find(ProgressBar)).toHaveLength(0);
        jest.runAllTimers();
        // still should not be displaying anything since toggle is false
        expect(progressBar.find(ProgressBar)).toHaveLength(0);
        progressBar.unmount();
    });

    test("render toggled, not modal", () => {
        const progressBar = mount(<Progress toggle={false}/>);
        // change the toggle state so it will render
        progressBar.setProps({toggle: true});

        // Should not be displaying anything until time has passed
        expect(progressBar.find(ProgressBar)).toHaveLength(0);
        jest.runTimersToTime(400);
        // Force an update of the component so it will rerender
        progressBar.update();

        //  should be displaying progress bar now
        expect(progressBar.find(ProgressBar)).toHaveLength(1);
        expect(progressBar.state()['percent']).toBe(80);

        expect(progressBar).toMatchSnapshot();
        progressBar.unmount()
    });

    test("render modal without title", () => {
        const progressBar = mount(<Progress toggle={false} modal={true}/>);
        // change the toggle state so it will render
        progressBar.setProps({toggle: true});
        jest.runTimersToTime(400);
        // Force an update of the component so it will rerender
        progressBar.update();

        //  should be displaying progress bar now
        expect(progressBar.find(ProgressBar)).toHaveLength(1);
        expect(progressBar.find(Modal)).toHaveLength(1);
        expect(progressBar.find(Modal.Title)).toHaveLength(0);

        progressBar.unmount()
    });

    test("render toggled, modal with title", () => {
        const title = "Modal Progress title";
        const progressBar = mount(<Progress toggle={false} modal={true} title={title}/>);
        // change the toggle state so it will render
        progressBar.setProps({toggle: true});

        // Should not be displaying anything until time has passed
        expect(progressBar.find(ProgressBar)).toHaveLength(0);
        jest.runTimersToTime(400);
        // Force an update of the component so it will rerender
        progressBar.update();

        //  should be displaying progress bar now
        expect(progressBar.find(ProgressBar)).toHaveLength(1);
        expect(progressBar.find(Modal)).toHaveLength(1);
        expect(progressBar.find(Modal.Title)).toHaveLength(1);

        progressBar.unmount()
    });


    test("render non-modal, set estimate, delay, and increment", () => {
        const progressBar = mount(<Progress toggle={false} delay={20} estimate={200} updateIncrement={10}/>);
        // change the toggle state so it will render
        progressBar.setProps({toggle: true});

        // Should not be displaying anything until time has passed
        expect(progressBar.find(ProgressBar)).toHaveLength(0);
        jest.runTimersToTime(20);
        // Force an update of the component so it will rerender
        progressBar.update();

        expect(progressBar.find(ProgressBar)).toHaveLength(1);
        expect(progressBar.state()).toEqual({
            duration: 20,
            percent: 10,
            show: true
        });

        jest.runTimersToTime(5);
        expect(progressBar.state()).toEqual({
            duration: 20,
            percent: 10,
            show: true
        });

        jest.runTimersToTime(10);
        expect(progressBar.state()).toEqual({
            duration: 30,
            percent: 15,
            show: true
        });
        progressBar.unmount();
    })

});