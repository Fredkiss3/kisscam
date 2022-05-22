import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    expect: {
        timeout: 2000,
    },
};
export default config;
