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

const timingsDefault = { startTime: null, endTime: 0 };

function computeState(timings, currentTime) {
    if (timings.startTime === null || currentTime < timings.startTime) {
        return { state: "logo", end: false };
    } else if (currentTime >= timings.endTime + blinkSeconds) {
        return { state: "logo", end: true };
    } else {
        let remainingTime = timings.endTime - currentTime;
        let blink = ((Math.round(remainingTime) % 2) === 0);
        if (remainingTime < 0) {
            remainingTime = 0;
        }
        [remainingTime, s] = divMod(remainingTime, 60);
        s = Math.round(s);
        const [h, m] = divMod(remainingTime, 60);
        if (m >= quarterMinutesDisplay) {
            return { state: "time", h, m, blink: false };
        } else if (m >= secondsDisplay) {
            return { state: "time", h, m, s: Math.floor(s / 15) * 15, blink: false };
        } else {
            if (s >= blinkSeconds) {
                blink = false;
            }
            return { state: "time", h, m, s, blink };
        }
    }
};

function responseToTimings(response) {
    let timings = timingsDefault;
    if (response.start_time !== null) {
        
        const startTime = parseCcsTime(response.start_time) / 1000;
        const duration = parseCcsReltime(response.duration) / 1000;
        if (duration < 0) {
            throw new Error("Invalid duration");
        }
        return {
            startTime,
            endTime: startTime + Math.floor(duration),
        }
    } else {
        return timingsDefault;
    }
}

const pageController = {
    timings: timingsDefault,
    done: false,
    polling: false,
    refreshTicks: 0,

    pollServer(recurse = false) {
        if (recurse || !this.polling) {
            this.polling = true;
        } else {
            return;
        }

        fetch(pollUrl, { mode: "cors", credentials: "omit", signal: AbortSignal.timeout(pollRetryTimeout) })
            .then((response) => {
                if (response.ok) {
                    return response.json()
                } else {
                    throw new Error("HTTP unsuccesful");
                }
            })
            .then((response) => {
                this.timings = responseToTimings(response);
                this.refreshTicks = pollRate;
                this.polling = false;

            })
            .catch((error) => {
                console.log(new Error("Request to server failed", { cause: error }));
                setTimeout(() => this.pollServer(true), pollRetryTimeout);
            });
    },

    tick() {
        const [currentTimeSecs, currentTimeRemainder] = divMod(Date.now(), tickRate);

        if (!this.done) {
            // using `setTimeout` recursively since `setInterval` may drift
            setTimeout(() => pageController.tick(), tickRate - currentTimeRemainder);
        }

        const state = computeState(this.timings, currentTimeSecs);
        switch (state.state) {
            case "logo":
                this.done = state.end;
                document.querySelector(".logo").classList.remove("hidden");
                document.querySelector(".timer").classList.add("hidden");
                 break;
            case "time":
                const pad = (i) => i.toString().padStart(2, "0");
                document.querySelector(".timer .hm").textContent = `${pad(state.h)}:${pad(state.m)}`;
                if (state.hasOwnProperty("s")) {
                    const secondsElem = document.querySelector(".timer .seconds");
                    secondsElem.textContent = `:${pad(state.s)}`;
                    secondsElem.classList.remove("hidden");
                } else {
                    document.querySelector(".timer .seconds").classList.add("hidden");
                }
                document.querySelector(".timer").classList.toggle("blink", state.blink);
                document.querySelector(".logo").classList.add("hidden");
                document.querySelector(".timer").classList.remove("hidden");
                 break;
        }

        if (!this.done) {
            if (this.refreshTicks <= 0) {
                this.pollServer();
            } else {
                this.refreshTicks -= 1;
            }
        }
    },
};

addEventListener("DOMContentLoaded", () => pageController.tick());
