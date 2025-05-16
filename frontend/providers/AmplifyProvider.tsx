'use client';

import { PropsWithChildren } from 'react';
import { Amplify, ResourcesConfig } from 'aws-amplify';

const config: ResourcesConfig = {
  API: {
    Events: {
      endpoint: process.env.NEXT_PUBLIC_APPSYNC_EVENTS_API_URL || '',
      region: process.env.NEXT_PUBLIC_APPSYNC_EVENTS_API_REGION,
      defaultAuthMode: 'apiKey',
      apiKey: process.env.NEXT_PUBLIC_APPSYNC_EVENTS_API_KEY,
    },
  },
};

Amplify.configure(config);

export function AmplifyProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}
