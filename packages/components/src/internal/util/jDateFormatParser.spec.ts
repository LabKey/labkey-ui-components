import moment from 'moment';

import { formatWithJDF, toJDFString, toMomentFormatString } from './jDateFormatParser';

describe('jDateFormatParser', () => {
    describe('formatWithJDF', () => {
        test('Date checks', () => {
            expect(formatWithJDF(moment('2013-12-24 14:30'), 'dd.')).toBe('24.');
            expect(formatWithJDF(moment('2013-12-24 14:30'), 'dd.MM.')).toBe('24.12.');
            expect(formatWithJDF(moment('2013-12-24 14:30'), 'dd.MM.yyyy')).toBe('24.12.2013');
            expect(formatWithJDF(moment('2013-12-24 14:30'), 'dd.MM.yyy')).toBe('24.12.2013');
            expect(formatWithJDF(moment('2013-12-24 14:30'), 'd.M.yyyy')).toBe('24.12.2013');
            expect(formatWithJDF(moment('2013-07-04 14:30'), 'd.M.yyyy')).toBe('4.7.2013');
            expect(formatWithJDF(moment('2013-07-04 14:30'), 'yyyy')).toBe('2013');
            expect(formatWithJDF(moment('2013-07-04 14:30'), 'yyy')).toBe('2013');
            expect(formatWithJDF(moment('2013-07-04 14:30'), 'yy')).toBe('13');
            expect(formatWithJDF(moment('2013-07-04 14:30'), 'y')).toBe('2013');
            expect(formatWithJDF(moment('2013-07-04 14:30'), 'M')).toBe('7');
            expect(formatWithJDF(moment('2013-07-04 14:30'), 'MM')).toBe('07');
            expect(formatWithJDF(moment('2013-07-04 14:30'), 'MMM')).toBe('Jul');
            expect(formatWithJDF(moment('2013-07-04 14:30'), 'MMMM')).toBe('July');
        });

        test('Hour and minute checks', () => {
            expect(formatWithJDF(moment('2013-12-24 14:30'), 'HH:mm')).toBe('14:30');
            expect(formatWithJDF(moment('2013-12-24 14:30'), 'hh:mm')).toBe('02:30');
            expect(formatWithJDF(moment('2013-12-24 14:30'), 'hh:mm A')).toBe('02:30 PM');
            expect(formatWithJDF(moment('2013-12-24 14:30'), 'hh:mm a')).toBe('02:30 pm');
            expect(formatWithJDF(moment('2013-12-24 04:30'), 'hh:mm A')).toBe('04:30 AM');
            expect(formatWithJDF(moment('2013-12-24 04:30'), 'hh:mm a')).toBe('04:30 am');
            expect(formatWithJDF(moment('2013-12-24 14:09'), 'h:mm A')).toBe('2:09 PM');
            expect(formatWithJDF(moment('2013-12-24 14:09'), 'h:mm a')).toBe('2:09 pm');
            expect(formatWithJDF(moment('2013-12-24 04:09'), 'h:mm A')).toBe('4:09 AM');
            expect(formatWithJDF(moment('2013-12-24 04:09'), 'h:mm a')).toBe('4:09 am');
            expect(formatWithJDF(moment('2013-12-24 14:09'), 'm')).toBe('9');
            expect(formatWithJDF(moment('2013-12-24 14:09'), 'h')).toBe('2');
            expect(formatWithJDF(moment('2013-12-24 14:09'), 'H')).toBe('14');
        });

        test('Seconds and milliseconds checks', () => {
            expect(formatWithJDF(moment('2013-12-24 14:30:49.257'), 'HH:mm:ss')).toBe('14:30:49');
            expect(formatWithJDF(moment('2013-12-24 14:30:49.257'), 'HH:mm:ss.SSS')).toBe('14:30:49.257');
            expect(formatWithJDF(moment('2013-12-24 14:30:09.257'), 's')).toBe('9');
            expect(formatWithJDF(moment('2013-12-24 14:30:09.257'), 'ss')).toBe('09');
            expect(formatWithJDF(moment('2013-12-24 14:30:49.257'), 'S')).toBe('257');
            expect(formatWithJDF(moment('2013-12-24 14:30:49.257'), 'SS')).toBe('257');
            expect(formatWithJDF(moment('2013-12-24 14:30:49.257'), 'SSS')).toBe('257');
        });

        test('Weekday checks', () => {
            expect(formatWithJDF(moment('2013-12-24 14:30'), 'E')).toBe('Tue');
            expect(formatWithJDF(moment('2013-12-24 14:30'), 'EEEE')).toBe('Tuesday');
            expect(formatWithJDF(moment('2013-12-24 14:30'), 'D')).toBe('358');
            expect(formatWithJDF(moment('2013-12-10 14:30'), 'u')).toBe('2');
            expect(formatWithJDF(moment('2013-01-10 14:30'), 'w')).toBe('2');
            expect(formatWithJDF(moment('2013-01-10 14:30'), 'ww')).toBe('02');
        });

        test('Timezone checks', () => {
            expect(formatWithJDF(moment('2013-12-24 14:30').utc(), 'z')).toBe('+0000');
            expect(formatWithJDF(moment('2013-12-24 14:30').utc(), 'zzzz')).toBe('+00:00');
            expect(formatWithJDF(moment('2013-12-24 14:30').utc(), 'Z')).toBe('+0000');
            expect(formatWithJDF(moment('2013-01-10 14:30').utc(), 'X')).toBe('+0000');
            expect(formatWithJDF(moment('2013-01-10 14:30').utc(), 'XX')).toBe('+0000');
            expect(formatWithJDF(moment('2013-01-10 14:30').utc(), 'XXX')).toBe('+00:00');
        });

        test('Escape character checks', () => {
            expect(formatWithJDF(moment('2013-12-24 14:30'), "'GMT'")).toBe('GMT');
            expect(formatWithJDF(moment('2013-12-24 14:30'), "HH:mm 'GMT'")).toBe('14:30 GMT');
            expect(formatWithJDF(moment('2013-12-24 14:30'), "'Time:' HH:mm 'GMT'")).toBe('Time: 14:30 GMT');
        });
    });

    describe('toJDFString', () => {
        test('Date checks', () => {
            expect(toJDFString('DD.')).toBe('dd.');
            expect(toJDFString('DD.MM.')).toBe('dd.MM.');
            expect(toJDFString('DD.MM.YYYY')).toBe('dd.MM.yyyy');
            expect(toJDFString('D.M.YYYY')).toBe('d.M.yyyy');
            expect(toJDFString('YYYY')).toBe('yyyy');
            expect(toJDFString('YY')).toBe('yy');
            expect(toJDFString('M')).toBe('M');
            expect(toJDFString('MM')).toBe('MM');
            expect(toJDFString('MMM')).toBe('MMM');
            expect(toJDFString('MMMM')).toBe('MMMM');
        });

        test('Hour and minute checks', () => {
            expect(toJDFString('HH:mm')).toBe('HH:mm');
            expect(toJDFString('hh:mm')).toBe('hh:mm');
            expect(toJDFString('hh:mm A')).toBe('hh:mm a');
            expect(toJDFString('hh:mm a')).toBe('hh:mm a');
            expect(toJDFString('h:mm A')).toBe('h:mm a');
            expect(toJDFString('h:mm a')).toBe('h:mm a');
            expect(toJDFString('m')).toBe('m');
            expect(toJDFString('h')).toBe('h');
            expect(toJDFString('H')).toBe('H');
        });

        test('Seconds and milliseconds checks', () => {
            expect(toJDFString('HH:mm:ss')).toBe('HH:mm:ss');
            expect(toJDFString('HH:mm:ss.SSS')).toBe('HH:mm:ss.S');
            expect(toJDFString('s')).toBe('s');
            expect(toJDFString('ss')).toBe('ss');
            expect(toJDFString('S')).toBe('S');
            expect(toJDFString('SS')).toBe('S');
            expect(toJDFString('SSS')).toBe('S');
        });

        test('Weekday checks', () => {
            expect(toJDFString('ddd')).toBe('E');
            expect(toJDFString('dddd')).toBe('EEEE');
            expect(toJDFString('DDD')).toBe('D');
            expect(toJDFString('u')).toBe('u');
            expect(toJDFString('W')).toBe('w');
            expect(toJDFString('WW')).toBe('ww');
        });
    });

    describe('toMomentFormatString', () => {
        test('Date checks', () => {
            expect(toMomentFormatString('dd.')).toBe('DD.');
            expect(toMomentFormatString('dd.MM.')).toBe('DD.MM.');
            expect(toMomentFormatString('dd.MM.yyyy')).toBe('DD.MM.YYYY');
            expect(toMomentFormatString('d.M.yyyy')).toBe('D.M.YYYY');
            expect(toMomentFormatString('yyyy')).toBe('YYYY');
            expect(toMomentFormatString('yy')).toBe('YY');
            expect(toMomentFormatString('y')).toBe('YYYY');
            expect(toMomentFormatString('M')).toBe('M');
            expect(toMomentFormatString('MM')).toBe('MM');
            expect(toMomentFormatString('MMM')).toBe('MMM');
            expect(toMomentFormatString('MMMM')).toBe('MMMM');
        });

        test('Hour and minute checks', () => {
            expect(toMomentFormatString('HH:mm')).toBe('HH:mm');
            expect(toMomentFormatString('hh:mm')).toBe('hh:mm');
            expect(toMomentFormatString('hh:mm A')).toBe('hh:mm A');
            expect(toMomentFormatString('hh:mm a')).toBe('hh:mm a');
            expect(toMomentFormatString('h:mm A')).toBe('h:mm A');
            expect(toMomentFormatString('h:mm a')).toBe('h:mm a');
            expect(toMomentFormatString('m')).toBe('m');
            expect(toMomentFormatString('h')).toBe('h');
            expect(toMomentFormatString('H')).toBe('H');
        });

        test('Seconds and milliseconds checks', () => {
            expect(toMomentFormatString('HH:mm:ss')).toBe('HH:mm:ss');
            expect(toMomentFormatString('HH:mm:ss.SSS')).toBe('HH:mm:ss.SSS');
            expect(toMomentFormatString('s')).toBe('s');
            expect(toMomentFormatString('ss')).toBe('ss');
            expect(toMomentFormatString('S')).toBe('SSS');
            expect(toMomentFormatString('SS')).toBe('SSS');
            expect(toMomentFormatString('SSS')).toBe('SSS');
        });

        test('Weekday checks', () => {
            expect(toMomentFormatString('E')).toBe('ddd');
            expect(toMomentFormatString('EEEE')).toBe('dddd');
            expect(toMomentFormatString('D')).toBe('DDD');
            expect(toMomentFormatString('u')).toBe('E');
            expect(toMomentFormatString('w')).toBe('W');
            expect(toMomentFormatString('ww')).toBe('WW');
        });

        test('Timezone checks', () => {
            expect(toMomentFormatString('z')).toBe('ZZ');
            expect(toMomentFormatString('zzzz')).toBe('Z');
            expect(toMomentFormatString('Z')).toBe('ZZ');
            expect(toMomentFormatString('ZZZZ')).toBe('ZZ');
            expect(toMomentFormatString('X')).toBe('ZZ');
            expect(toMomentFormatString('XX')).toBe('ZZ');
            expect(toMomentFormatString('XXX')).toBe('Z');
        });

        test('Escape character checks', () => {
            expect(toMomentFormatString("'GMT'")).toBe('[GMT]');
            expect(toMomentFormatString("HH:mm 'GMT'")).toBe('HH:mm [GMT]');
            expect(toMomentFormatString("'Time:' HH:mm 'GMT'")).toBe('[Time:] HH:mm [GMT]');
        });
    });
});
