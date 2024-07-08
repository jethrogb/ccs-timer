/* Copyright (c) Jethro G. Beekman
   
   This file is part of CCS timer.
   
   CCS timer program is free software: you can redistribute it and/or modify it 
   under the terms of the GNU Affero General Public License as published by the 
   Free Software Foundation, either version 3 of the License, or (at your 
   option) any later version.
   
   This program is distributed in the hope that it will be useful, but WITHOUT 
   ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or 
   FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License 
   for more details.
   
   You should have received a copy of the GNU Affero General Public License 
   along with this program. If not, see <https://www.gnu.org/licenses/>. */

function divMod(x, y) {
    const mod = x % y;
    return [(x - mod) / y, mod];
}

// This will take the sign from `h` and apply it to the whole result!
function timeToMs(h, m, s, ms) {
    // consistently determine the sign, also from negative zero
    const sign = Math.sign(1 / Math.sign(h));
    return sign * (((h * sign * 60 + m) * 60 + s) * 1000 + ms);
}

function parseCcsReltime(val) {
    //                           1       2      3     4 5
    const matches = val.match(/^(-?\d+):(\d\d):(\d\d)(.(\d\d\d))?$/);
    if (matches === null) {
        throw new Error("Invalid reltime");
    }

    const h = parseInt(matches[1]);
    const m = parseInt(matches[2]);
    if (m > 59) {
        throw new Error("Invalid reltime");
    }
    const s = parseInt(matches[3]);
    if (s > 59) {
        throw new Error("Invalid reltime");
    }
    const ms = parseInt(matches[5] || 0);
    return timeToMs(h, m, s, ms);
}

function parseCcsTime(val) {
    //                           1          2      3      4      5      6     7 8         9  10       11 12
    const matches = val.match(/^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(.(\d\d\d))?(Z|([+-]\d\d)(:(\d\d))?)$/);
    if (matches === null) {
        throw new Error("Invalid time");
    }

    const y = parseInt(matches[1]);
    const m = parseInt(matches[2]);
    const d = parseInt(matches[3]);
    const h = parseInt(matches[4]);
    const mn = parseInt(matches[5]);
    const s = parseInt(matches[6]);
    const ms = parseInt(matches[8] || 0);
    let zadjust;
    if (matches[10] === undefined) {
        zadjust = 0;
    } else {
        const zh = parseInt(matches[10]);
        const zm = parseInt(matches[12] || 0);
        zadjust = timeToMs(zh, zm, 0, 0);
    }

    const t = new Date(Date.UTC(y, m - 1, d, h, mn, s, ms));
    if (t.getUTCFullYear() !== y) {
        throw new Error("Invalid time");
    }
    if (t.getUTCMonth() !== m - 1) {
        throw new Error("Invalid time");
    }
    if (t.getUTCDate() !== d) {
        throw new Error("Invalid time");
    }
    if (t.getUTCHours() !== h) {
        throw new Error("Invalid time");
    }
    if (t.getUTCMinutes() !== mn) {
        throw new Error("Invalid time");
    }
    if (t.getUTCSeconds() !== s) {
        throw new Error("Invalid time");
    }

    return t.getTime() - zadjust;
}

if (typeof window === 'undefined' && process.env.UNIT_TEST) {
    function deepEq(a, b) {
        if (Array.isArray(a) && Array.isArray(b)) {
            return a.length === b.length && a.every((v, idx) => deepEq(v, b[idx]));
        } else {
            return Object.is(a, b);
        }
    }

    function assertEq(a, b) {
        if (!deepEq(a, b)) {
            throw new Error(`Assertion failed: left: ${a} right: ${b}`);
        }
    }

    function assertThrows(f) {
        try {
            f();
        } catch (e) {
            return;
        }
        throw new Error(`Assertion failed: expected ${f} to throw exception`);
    }

    // test deep_eq
    console.assert(deepEq([2, 3], [2, 3]));
    console.assert(!deepEq([2, 3], [2, 4]));
    console.assert(!deepEq([2, 3], [2]));
    console.assert(!deepEq([2, 3], [2, 3, 4]));
    console.assert(deepEq(1, 1));
    console.assert(!deepEq(1, 2));
    
    // test assertThrows
    assertThrows(() => { throw new Error() });
    assertThrows(() => assertThrows(() => {}));

    // test divMod
    assertEq(divMod(15, 6), [2, 3]);
    assertEq(divMod(15, 15), [1, 0]);
    assertEq(divMod(1, 1), [1, 0]);
    assertEq(divMod(12, 30), [0, 12]);
    
    // timeToMs tested by parseCcsReltime

    // test parseCcsReltime
    assertEq(parseCcsReltime("0:00:00"), 0);
    assertEq(parseCcsReltime("00:00:00"), 0);
    assertEq(parseCcsReltime("-0:00:00"), -0);
    assertEq(parseCcsReltime("-00:00:00"), -0);
    assertEq(parseCcsReltime("0:00:00.000"), 0);
    assertEq(parseCcsReltime("00:00:00.000"), 0);
    assertEq(parseCcsReltime("-0:00:00.000"), -0);
    assertEq(parseCcsReltime("-00:00:00.000"), -0);

    assertEq(parseCcsReltime("0:00:00.001"), 1);
    assertEq(parseCcsReltime("-0:00:00.001"), -1);
    assertEq(parseCcsReltime("1:01:01.001"), 3661001);
    assertEq(parseCcsReltime("-1:01:01.001"), -3661001);
    assertEq(parseCcsReltime("999:59:59.999"), 3599999999);
    assertEq(parseCcsReltime("-999:59:59.999"), -3599999999);
    assertEq(parseCcsReltime("999:59:59.999"), 3599999999);

    assertThrows(() => parseCcsReltime("0:60:00"));
    assertThrows(() => parseCcsReltime("0:00:60"));
    
    // test parseCcsTime
    assertEq(parseCcsTime("2024-02-29T00:00:00Z"), 1709164800000);
    assertEq(parseCcsTime("2024-02-29T00:00:00+00:01"), 1709164740000);
    assertEq(parseCcsTime("2024-02-29T00:00:00+01:01"), 1709161140000);
    assertEq(parseCcsTime("2024-02-29T00:00:00+01"), 1709161200000);
    assertEq(parseCcsTime("2024-02-29T00:00:00-00:01"), 1709164860000);
    assertEq(parseCcsTime("2024-02-29T00:00:00-01:01"), 1709168460000);
    assertEq(parseCcsTime("2024-02-29T00:00:00-01"), 1709168400000);
    assertEq(parseCcsTime("2024-02-29T23:59:59.999Z"), 1709251199999);
    assertEq(parseCcsTime("2024-02-29T23:59:59.999+00:01"), 1709251139999);
    assertEq(parseCcsTime("2024-02-29T23:59:59.999+01:01"), 1709247539999);
    assertEq(parseCcsTime("2024-02-29T23:59:59.999+01"), 1709247599999);
    assertEq(parseCcsTime("2024-02-29T23:59:59.999-00:01"), 1709251259999);
    assertEq(parseCcsTime("2024-02-29T23:59:59.999-01:01"), 1709254859999);
    assertEq(parseCcsTime("2024-02-29T23:59:59.999-01"), 1709254799999);
    assertThrows(() => parseCcsTime("2024-02-00T00:00:00Z"));
    assertThrows(() => parseCcsTime("2024-02-30T00:00:00Z"));
    assertThrows(() => parseCcsTime("2024-12-32T00:00:00Z"));
    assertThrows(() => parseCcsTime("2024-00-29T00:00:00Z"));
    assertThrows(() => parseCcsTime("2024-13-29T00:00:00Z"));
    assertThrows(() => parseCcsTime("2024-02-29T24:00:00Z"));
    assertThrows(() => parseCcsTime("2024-02-29T00:60:00Z"));
    assertThrows(() => parseCcsTime("2024-02-29T00:00:60Z"));
    assertThrows(() => parseCcsTime("2024-02-29T00:00:00X"));
    assertThrows(() => parseCcsTime("2024-02-29T00:00:00"));
}
