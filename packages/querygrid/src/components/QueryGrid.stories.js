import { storiesOf } from '@storybook/react'
import { withMarkdownNotes } from '@storybook/addon-notes'

import * as constants from "@glass/storybook/src/stories/constants";
import {QueryGrid} from "../../dist";

storiesOf('QueryGrid', module)
    .add('With basic data', withMarkdownNotes(constants.gridWithBasicDataMD)(() => <QueryGrid/>));
