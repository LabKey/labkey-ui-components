import React, { CSSProperties, FC, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';

import { Button } from 'react-bootstrap';

import { Tooltip } from '../../Tooltip';
import { Popover } from '../../Popover';

import { OverlayTrigger } from '../../OverlayTrigger';

import { QueriesListingPage } from './pages/QueriesListingPage';
import { QueryDetailPage } from './pages/QueryDetailPage';
import { QueryListingPage } from './pages/QueryListingPage';
import { SchemaListingPage } from './pages/SchemaListingPage';

const Thing = () => {
    return (
        <Button bsStyle="default" type="button">
            I am a thing
        </Button>
    );
};

// FIXME: DO NOT COMMIT THIS, THIS IS JUST A DEMO PAGE SO WE CAN TEST LAYOUT OF Tooltip and Popover
const OverlayTest: FC = () => {
    const baseStyle: CSSProperties = { position: 'relative' };
    const tooltipRef = useRef(undefined);
    const popoverRef = useRef(undefined);

    const topTooltip = (
        <Tooltip id="tooltip-right" placement="top">
            top tooltip
        </Tooltip>
    );
    const rightTooltip = (
        <Tooltip id="tooltip-right" placement="right">
            right tooltip
        </Tooltip>
    );
    const bottomTooltip = (
        <Tooltip id="tooltip-right" placement="bottom">
            bottom tooltip
        </Tooltip>
    );
    const leftTooltip = (
        <Tooltip id="tooltip-right" placement="left">
            left tooltip
        </Tooltip>
    );

    const topPopover = (
        <Popover id="popover-top" title="top popover" placement="top">
            top popover content
        </Popover>
    );
    const rightPopover = (
        <Popover id="popover-right" title="right popover" placement="right">
            right popover content
        </Popover>
    );
    const bottomPopover = (
        <Popover id="popover-bottom" title="bottom popover" placement="bottom">
            bottom popover content
        </Popover>
    );
    const leftPopover = (
        <Popover id="popover-left" title="left popover" placement="left">
            left popover content
        </Popover>
    );

    return (
        <div className="app-page">
            <div className="panel panel-default">
                <div className="panel-heading">Click OverlayTrigger</div>
                <div className="panel-body">
                    <OverlayTrigger id="overlay-test-left" overlay={leftTooltip} triggerType="click">
                        <button type="button" className="btn btn-default">
                            Button with left tooltip
                        </button>
                    </OverlayTrigger>

                    <OverlayTrigger id="overlay-test-top" overlay={topTooltip} triggerType="click">
                        <button type="button" className="btn btn-default">
                            Button with top tooltip
                        </button>
                    </OverlayTrigger>

                    <OverlayTrigger id="overlay-test-bottom" overlay={bottomTooltip} triggerType="click">
                        <button type="button" className="btn btn-default">
                            Button with bottom tooltip
                        </button>
                    </OverlayTrigger>

                    <OverlayTrigger id="overlay-test-right" overlay={rightTooltip} triggerType="click">
                        <button type="button" className="btn btn-default">
                            Button with right tooltip
                        </button>
                    </OverlayTrigger>
                </div>
            </div>

            <div className="panel panel-default">
                <div className="panel-heading">Hover OverlayTrigger</div>
                <div className="panel-body">
                    <OverlayTrigger id="overlay-hover-test-left" overlay={leftTooltip}>
                        <button type="button" className="btn btn-default">
                            Button with left tooltip
                        </button>
                    </OverlayTrigger>

                    <OverlayTrigger id="overlay-hover-test-top" overlay={topTooltip}>
                        <button type="button" className="btn btn-default">
                            Button with top tooltip
                        </button>
                    </OverlayTrigger>

                    <OverlayTrigger id="overlay-hover-test-bottom" overlay={bottomTooltip}>
                        <button type="button" className="btn btn-default">
                            Button with bottom tooltip
                        </button>
                    </OverlayTrigger>

                    <OverlayTrigger id="overlay-hover-test-right" overlay={rightTooltip}>
                        <button type="button" className="btn btn-default">
                            Button with right tooltip
                        </button>
                    </OverlayTrigger>
                </div>
            </div>

            <div className="panel panel-default">
                <div className="panel-heading">OverlayTrigger Popovers</div>
                <div className="panel-body">
                    <OverlayTrigger id="overlay-hover-popover-left" overlay={leftPopover}>
                        <button type="button" className="btn btn-default">
                            Button with left popover
                        </button>
                    </OverlayTrigger>

                    <OverlayTrigger id="overlay-hover-popover-top" overlay={topPopover}>
                        <button type="button" className="btn btn-default">
                            Button with top popover
                        </button>
                    </OverlayTrigger>

                    <OverlayTrigger id="overlay-hover-popover-right" overlay={bottomPopover} triggerType="click">
                        <button type="button" className="btn btn-default">
                            Button with bottom popover on click
                        </button>
                    </OverlayTrigger>

                    <OverlayTrigger id="overlay-hover-popover-bottom" overlay={rightPopover} triggerType="click">
                        <button type="button" className="btn btn-default">
                            Button with right popover
                        </button>
                    </OverlayTrigger>
                </div>
            </div>

            <div className="panel panel-default">
                <div className="panel-heading">Long Content</div>
                <div className="panel-body">
                    <p>
                        John Singer Sargent (/ˈsɑːrdʒənt/; January 12, 1856 – April 14, 1925)[1] was an American
                        expatriate artist, considered the "leading portrait painter of his generation" for his
                        evocations of Edwardian-era luxury.[2][3] He created roughly 900 oil paintings and more than
                        2,000 watercolors, as well as countless sketches and charcoal drawings. His oeuvre documents
                        worldwide travel, from Venice to the Tyrol, Corfu, Spain, the Middle East, Montana, Maine, and
                        Florida.
                    </p>

                    <p>
                        Born in Florence to American parents, he was trained in Paris before moving to London, living
                        most of his life in Europe. He enjoyed international acclaim as a portrait painter. An early
                        submission to the Paris Salon in the 1880s, his Portrait of Madame X, was intended to
                        consolidate his position as a society painter in Paris, but instead resulted in scandal. During
                        the next year following the scandal, Sargent departed for England where he continued a
                        successful career as a portrait artist.
                    </p>

                    <p>
                        From the beginning, Sargent's work is characterized by remarkable technical facility,
                        particularly in his ability to draw with a brush, which in later years inspired admiration as
                        well as criticism for a supposed superficiality. His commissioned works were consistent with the
                        grand manner of portraiture, while his informal studies and landscape paintings displayed a
                        familiarity with Impressionism. In later life Sargent expressed ambivalence about the
                        restrictions of formal portrait work, and devoted much of his energy to mural painting and
                        working en plein air. Art historians generally ignored society artists such as Sargent until the
                        late 20th century.[4]
                    </p>

                    <p>
                        The exhibition in the 1980s of Sargent's previously hidden male nudes served to spark a
                        re-evaluation of his life and work, and its psychological complexity. In addition to the beauty,
                        sensation, and innovation of his oeuvre, his same-sex interests, unconventional friendships with
                        women, and engagement with race, gender-nonconformity, and emerging globalism, are now viewed as
                        socially and aesthetically progressive, and radical.[5]
                    </p>

                    <p>
                        Sargent was a descendant of Epes Sargent, a colonial military leader and jurist. Before John
                        Singer Sargent's birth, his father, FitzWilliam (b. 1820 in Gloucester, Massachusetts), was an
                        eye surgeon at the Wills Eye Hospital in Philadelphia from 1844 to 1854. After John's older
                        sister died at the age of two, his mother, Mary Newbold Singer (née Singer, 1826–1906), suffered
                        a breakdown, and the couple decided to go abroad to recover.[1] They remained nomadic
                        expatriates for the rest of their lives.[6][7] Although based in Paris, Sargent's parents moved
                        regularly, spending seasons at the sea and at mountain resorts in France, Germany, Italy, and
                        Switzerland.
                    </p>

                    <p>
                        While Mary was pregnant, they stopped in Florence, Tuscany, because of a cholera epidemic.
                        Sargent was born there in 1856. A year later, his sister Mary was born. After her birth,
                        FitzWilliam reluctantly resigned his post in Philadelphia and accepted his wife's request to
                        remain abroad.[8] They lived modestly on a small inheritance and savings, leading a quiet life
                        with their children. They generally avoided society and other Americans except for friends in
                        the art world.[9] Four more children were born abroad, of whom only two lived past
                        childhood.[10]
                    </p>

                    <p>
                        Although his father was a patient teacher of basic subjects, young Sargent was a rambunctious
                        child, more interested in outdoor activities than his studies. As his father wrote home, "He is
                        quite a close observer of animated nature."[11] His mother was convinced that traveling around
                        Europe, and visiting museums and churches, would give young Sargent a satisfactory education.
                        Several attempts to have him formally schooled failed, owing mostly to their itinerant life. His
                        mother was a capable amateur artist and his father was a skilled medical illustrator.[12] Early
                        on, she gave him sketchbooks and encouraged drawing excursions. Sargent worked on his drawings,
                        and he enthusiastically copied images from The Illustrated London News of ships and made
                        detailed sketches of landscapes.[13] FitzWilliam had hoped that his son's interest in ships and
                        the sea might lead him toward a naval career.
                    </p>

                    <p>
                        At thirteen, his mother reported that John "sketches quite nicely, & has a remarkably quick and
                        correct eye. If we could afford to give him really good lessons, he would soon be quite a little
                        artist."[14] At the age of thirteen, he received some watercolor lessons from Carl Welsch, a
                        German landscape painter.[15] Although his education was far from complete, Sargent grew up to
                        be a highly literate and cosmopolitan young man, accomplished in art, music, and literature.[16]
                        He was fluent in English, French, Italian, and German. At seventeen, Sargent was described as
                        "willful, curious, determined and strong" (after his mother) yet shy, generous, and modest
                        (after his father).[17] He was well-acquainted with many of the great masters from first-hand
                        observation, as he wrote in 1874, "I have learned in Venice to admire Tintoretto immensely and
                        to consider him perhaps second only to Michelangelo and Titian."[18]
                    </p>

                    <p>
                        An attempt to study at the Academy of Florence failed, as the school was reorganizing at the
                        time. After returning to Paris from Florence, Sargent began his art studies with the young
                        French portraitist Carolus-Duran. Following a meteoric rise, the artist was noted for his bold
                        technique and modern teaching methods; his influence would be pivotal to Sargent during the
                        period from 1874 to 1878.[19]
                    </p>

                    <p>
                        In 1874, Sargent passed on his first attempt the rigorous exam required to gain admission to the
                        École des Beaux-Arts, the premier art school in France. He took drawing classes, which included
                        anatomy and perspective, and gained a silver prize.[19][20] He also spent much time in
                        self-study, drawing in museums and painting in a studio he shared with James Carroll Beckwith.
                        He became both a valuable friend and Sargent's primary connection with the American artists
                        abroad.[21] Sargent also took some lessons from Léon Bonnat.[20] Carolus-Duran's atelier was
                        progressive, dispensing with the traditional academic approach, which required careful drawing
                        and underpainting, in favor of the alla prima method of working directly on the canvas with a
                        loaded brush, derived from Diego Velázquez. It was an approach that relied on the proper
                        placement of tones of paint. Sargent would later create a painting in this style that prompted
                        comments such as: "The student has surpassed the teacher."[22] This approach also permitted
                        spontaneous flourishes of color not bound to an underdrawing. It was markedly different from the
                        traditional atelier of Jean-Léon Gérôme, where Americans Thomas Eakins and Julian Alden Weir had
                        studied. Sargent was the star student in short order. Weir met Sargent in 1874 and noted that
                        Sargent was "one of the most talented fellows I have ever come across; his drawings are like the
                        old masters, and his color is equally fine."[21] Sargent's excellent command of French and his
                        superior talent made him both popular and admired. Through his friendship with Paul César
                        Helleu, Sargent would meet giants of the art world, including Degas, Rodin, Monet, and Whistler.
                        Sargent's early enthusiasm was for landscapes, not portraiture, as evidenced by his voluminous
                        sketches full of mountains, seascapes, and buildings.[23] Carolus-Duran's expertise in
                        portraiture finally influenced Sargent in that direction. Commissions for history paintings were
                        still considered more prestigious, but were much harder to get. Portrait painting, on the other
                        hand, was the best way of promoting an art career, getting exhibited in the Salon, and gaining
                        commissions to earn a livelihood. Sargent's first major portrait was of his friend Fanny Watts
                        in 1877, and was also his first Salon admission. Its particularly well-executed pose drew
                        attention.[23] His second salon entry was the Oyster Gatherers of Cançale, an impressionistic
                        painting of which he made two copies, one of which he sent back to the United States, and both
                        received warm reviews.[24]
                    </p>
                </div>
            </div>
        </div>
    );
};

export const SchemaBrowserRoutes = () => (
    <Routes>
        <Route path="overlays" element={<OverlayTest />} />
        <Route index element={<SchemaListingPage />} />
        <Route path=":schema">
            <Route index element={<QueriesListingPage />} />
            <Route path=":query">
                <Route index element={<QueryListingPage />} />
                <Route path=":id" element={<QueryDetailPage />} />
            </Route>
        </Route>
    </Routes>
);
