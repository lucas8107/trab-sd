import poissonProcess from "poisson-process";

let lastTime: Date = new Date();
let totalDelta = 0;
let count = 0;

async function sleep(milliseconds: number) {
    await setTimeout(()=>{}, milliseconds);
}

function sendMessage(): void {
    const currentTime = new Date();
    totalDelta += currentTime.getTime() - lastTime.getTime();
    count++;
    console.log(`Avg: ${totalDelta/count}`);
}

function main() {
    const loop = poissonProcess.create(3000, sendMessage);
    loop.start();
}

main();
