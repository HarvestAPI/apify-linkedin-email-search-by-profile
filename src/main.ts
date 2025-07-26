// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { createLinkedinScraper, type Profile } from '@harvestapi/scraper';
import { Actor } from 'apify';
import { config } from 'dotenv';
import { createConcurrentQueues } from './utils/queue.js';

config();

await Actor.init();

interface Input {
  profiles: (Profile | { element: Profile })[];
}

// Structure of input is defined in input_schema.json
const input = await Actor.getInput<Input>();
if (!input) throw new Error('Input is missing!');

const { actorId, actorRunId, actorBuildId, userId, memoryMbytes } = Actor.getEnv();
const { actorMaxPaidDatasetItems } = Actor.getEnv();

const client = Actor.newClient();
const user = userId ? await client.user(userId).get() : null;

const scraper = createLinkedinScraper({
  apiKey: process.env.HARVESTAPI_TOKEN!,
  baseUrl: process.env.HARVESTAPI_URL || 'https://api.harvest-api.com',
  addHeaders: {
    'x-apify-userid': userId!,
    'x-apify-actor-id': actorId!,
    'x-apify-actor-run-id': actorRunId!,
    'x-apify-actor-build-id': actorBuildId!,
    'x-apify-memory-mbytes': String(memoryMbytes),
    'x-apify-actor-max-paid-dataset-items': String(actorMaxPaidDatasetItems) || '0',
    'x-apify-username': user?.username || '',
    'x-apify-user-is-paying': (user as Record<string, any> | null)?.isPaying,
  },
});

const addJob = createConcurrentQueues(6, async ({ profile }: { profile: Profile }) => {
  if (!profile?.linkedinUrl) {
    console.warn(`Profile ${profile?.id} has no LinkedIn URL, skipping...`);
    return;
  }

  const result = await scraper.searchProfileEmail({
    profile,
  });
  if (result.element) {
    const item = {
      id: profile.id,
      linkedinUrl: profile.linkedinUrl,
      ...result.element,
    };
    await Actor.pushData(item);
  }
});

await Promise.all(
  input.profiles.map(async (profileData) => {
    return addJob({
      profile: 'element' in profileData ? profileData.element : profileData,
    });
  }),
);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
await Actor.exit();
