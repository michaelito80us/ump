# Vercel Environment Variables Configuration for Supabase

This guide provides step-by-step instructions for configuring Vercel environment variables to integrate with Supabase.

## Prerequisites

- Vercel project linked to your repository
- Supabase project created and configured
- Access to Vercel dashboard

## Environment Variables to Configure

### Required Variables

Set these environment variables in your Vercel project dashboard:

| Variable Name               | Description                                                    | Example Value                                                                 | Environment         |
| --------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------- |
| `DATABASE_URL`              | Supabase PostgreSQL connection string                          | `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres` | Production, Preview |
| `DIRECT_URL`                | Direct database connection (same as DATABASE_URL for Supabase) | `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres` | Production, Preview |
| `SUPABASE_URL`              | Your Supabase project URL                                      | `https://[PROJECT-REF].supabase.co`                                           | Production, Preview |
| `SUPABASE_ANON_KEY`         | Supabase anonymous/public key                                  | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`                                     | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only)                   | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`                                     | Production, Preview |

### Additional Backend Variables

| Variable Name           | Description                  | Example Value                          | Environment         |
| ----------------------- | ---------------------------- | -------------------------------------- | ------------------- |
| `JWT_SECRET`            | JWT signing secret           | `your-super-secret-jwt-key-production` | Production, Preview |
| `NODE_ENV`              | Node environment             | `production`                           | Production          |
| `PORT`                  | Server port                  | `4001`                                 | Production, Preview |
| `DATABASE_SSL`          | Enable SSL for database      | `true`                                 | Production, Preview |
| `DATABASE_POOL_SIZE`    | Connection pool size         | `10`                                   | Production, Preview |
| `REDIS_URL`             | Redis connection string      | `redis://...`                          | Production, Preview |
| `CORS_ORIGIN`           | Allowed CORS origins         | `https://yourdomain.com`               | Production, Preview |
| `GRAPHQL_INTROSPECTION` | Enable GraphQL introspection | `false`                                | Production          |
| `GRAPHQL_PLAYGROUND`    | Enable GraphQL playground    | `false`                                | Production          |
| `LOG_LEVEL`             | Logging level                | `info`                                 | Production          |

## Step-by-Step Configuration

### Step 1: Access Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your UMP project
3. Navigate to **Settings** → **Environment Variables**

### Step 2: Get Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Database**
   - Copy the connection string (replace `[YOUR-PASSWORD]` with your actual password)
4. Navigate to **Settings** → **API**
   - Copy the Project URL
   - Copy the `anon` `public` key
   - Copy the `service_role` `secret` key

### Step 3: Add Environment Variables

For each variable, click **Add New** and enter:

#### Database Configuration

```
Name: DATABASE_URL
Value: postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
Environments: Production, Preview
```

```
Name: DIRECT_URL
Value: postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
Environments: Production, Preview
```

#### Supabase Configuration

```
Name: SUPABASE_URL
Value: https://[YOUR-PROJECT-REF].supabase.co
Environments: Production, Preview
```

```
Name: SUPABASE_ANON_KEY
Value: [YOUR-SUPABASE-ANON-KEY]
Environments: Production, Preview
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [YOUR-SUPABASE-SERVICE-ROLE-KEY]
Environments: Production, Preview
```

#### Application Configuration

```
Name: JWT_SECRET
Value: [GENERATE-STRONG-SECRET]
Environments: Production, Preview
```

```
Name: NODE_ENV
Value: production
Environments: Production
```

```
Name: DATABASE_SSL
Value: true
Environments: Production, Preview
```

### Step 4: Configure Build Settings

Ensure your Vercel build settings are configured for the monorepo:

1. **Framework Preset**: Other
2. **Root Directory**: `packages/backend` (for backend deployment)
3. **Build Command**: `pnpm build`
4. **Output Directory**: `dist`
5. **Install Command**: `pnpm install`

### Step 5: Deploy and Test

1. Trigger a new deployment
2. Check the deployment logs for any environment variable issues
3. Test database connectivity in the deployed environment

## Environment-Specific Configuration

### Production Environment

- Use strong, unique secrets
- Disable GraphQL introspection and playground
- Set appropriate CORS origins
- Use production database credentials

### Preview Environment

- Can use the same Supabase project or a separate staging project
- Enable GraphQL playground for testing
- Use preview-specific CORS origins if needed

### Development Environment

- Use local environment variables (`.env`)
- Can point to the same Supabase project or local PostgreSQL
- Enable all debugging features

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use different credentials for different environments**
3. **Regularly rotate API keys and secrets**
4. **Limit CORS origins to your actual domains**
5. **Use Vercel's encrypted environment variables**
6. **Monitor access logs in Supabase dashboard**

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   - Verify connection string format
   - Check if password contains special characters (URL encode if needed)
   - Ensure Supabase project is active

2. **Environment Variable Not Found**

   - Verify variable names match exactly (case-sensitive)
   - Check if variables are set for the correct environment
   - Redeploy after adding new variables

3. **SSL Connection Issues**

   - Ensure `DATABASE_SSL=true` is set
   - Verify Supabase connection string includes SSL parameters

4. **CORS Errors**
   - Update `CORS_ORIGIN` to include your frontend domain
   - Check Supabase RLS policies if using Row Level Security

### Verification Commands

After deployment, you can verify the configuration:

```bash
# Check if environment variables are loaded
curl https://your-backend.vercel.app/health

# Test database connectivity (if you have a health endpoint)
curl https://your-backend.vercel.app/api/health/db
```

## Next Steps

After configuring Vercel environment variables:

1. Deploy your application
2. Run database migrations in production
3. Test all API endpoints
4. Set up monitoring and alerting
5. Configure backup and recovery procedures

## Support Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Prisma Deployment Documentation](https://www.prisma.io/docs/guides/deployment)

## Automation Script

For teams, consider creating a script to set up environment variables:

```bash
#!/bin/bash
# setup-vercel-env.sh

# Set your project ID and team ID
PROJECT_ID="your-vercel-project-id"
TEAM_ID="your-vercel-team-id"

# Add environment variables
vercel env add DATABASE_URL production --scope $PROJECT_ID
vercel env add DIRECT_URL production --scope $PROJECT_ID
vercel env add SUPABASE_URL production --scope $PROJECT_ID
vercel env add SUPABASE_ANON_KEY production --scope $PROJECT_ID
vercel env add SUPABASE_SERVICE_ROLE_KEY production --scope $PROJECT_ID

echo "Environment variables configured successfully!"
```

Remember to keep this script secure and never commit it with actual values.
