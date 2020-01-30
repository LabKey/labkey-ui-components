import {storiesOf} from "@storybook/react";
import {withKnobs} from "@storybook/addon-knobs";
import {FileTree} from "../components/files/FileTree";
import React from "react";
import {fetchFileTestTree} from "../components/files/FileTreeTest";


storiesOf('FileTree', module)
    .addDecorator(withKnobs)
    .add('With basic data', () =>
        <div>
            <FileTree loadData={fetchFileTestTree}/>
        </div>
    )

