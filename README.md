# Pledge Pal

## Getting Started

1. Deploy backend

```
sam build && sam deploy --profile AWS_PROFILE
```

2. Create a frontend/amplify_outputs.json file from the amplify_outputs.json.example file and add the properties from the backend deploy

```
{
  "API": {
    "Events": {
      "endpoint": "",
      "region": "",
      "defaultAuthMode": "apiKey",
      "apiKey": ""
    }
  }
}
```

3. Deploy frontend (using AWS Amplify console)
