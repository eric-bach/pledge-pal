# Dragon's Vault

## Getting Started

1. Deploy backend

```
sam build && sam deploy --profile AWS_PROFILE
```

2. Create a frontend/.env file from the .env.example file and add the properties from the backend deploy

```
NEXT_PUBLIC_APPSYNC_EVENTS_API_URL=
NEXT_PUBLIC_APPSYNC_EVENTS_API_REGION=
NEXT_PUBLIC_APPSYNC_EVENTS_API_KEY=
```

3. Deploy frontend (using AWS Amplify console)
