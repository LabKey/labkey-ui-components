import {storiesOf} from "@storybook/react";
import React from "react";
import {PipelineStatusDetailPage} from "..";

storiesOf('PipelineStatusDetails', module)
    .add('success', () => {
        return (
            <PipelineStatusDetailPage
                rowId={1}
            />
        );
    })
    .add('error', () => {
        return (
            <PipelineStatusDetailPage
                rowId={2}
            />
        );
    })
    .add('running with warning', () => {
        return (
            <PipelineStatusDetailPage
                rowId={3}
            />
        );
    });