export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function gotoHashURL(hash: string, qsParams?: Record<string, string>) {
    const url = new URL(window.location.href);
    url.hash = hash;
    url.search = new URLSearchParams(qsParams).toString();
    window.location.href = url.toString();
    return;
}

export function wait(ms: number): Promise<void> {
    // Wait for the specified amount of time
    return new Promise((resolve) => setTimeout(resolve, ms));
}
