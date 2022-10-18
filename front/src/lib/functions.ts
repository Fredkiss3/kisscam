export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getHostWithScheme(url: string): string {
    const urlObject = new URL(url);
    return urlObject.protocol + '//' + urlObject.host;
}

export function wait(ms: number): Promise<void> {
    // Wait for the specified amount of time
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createPeerConnection() {
    const pc = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                ],
            },
        ],
        iceCandidatePoolSize: 50,
    });

    return pc;
}

export async function jsonFetch<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    // Set the default headers correctly
    const headers: HeadersInit = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');

    // @ts-ignore
    if (import.meta.env.MODE !== 'development') {
        await wait(1500);
    }

    return fetch(url, {
        ...options,
        headers,
        mode: 'cors',
    })
        .then((response) => response.json())
        .catch((error) => {
            console.error('There was an error ?', error);
            throw error;
        });
}
