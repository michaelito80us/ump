# Supabase Database Setup Guide

This guide will help you set up Supabase as the production database for the UMP backend.

## Prerequisites

1. A Supabase account (https://supabase.com)
2. A Supabase project created
3. Vercel account with project linked to Supabase

## Step 1: Get Supabase Connection Details

### Database Connection

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Copy the connection string from the **Connection string** section
4. The format will be: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

### API Keys

1. Navigate to **Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
   - **anon public key**: For client-side operations
   - **service_role secret key**: For server-side operations (keep secure!)

## Step 2: Configure Environment Variables

### For Local Development

1. Copy `.env.local` to `.env`
2. Replace the placeholder values with your actual Supabase details:

```bash
# Database URLs
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Configuration
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR-SUPABASE-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SUPABASE-SERVICE-ROLE-KEY]"
```

### For Production (Vercel)

Set these environment variables in your Vercel dashboard:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable                    | Value                           | Environment |
| --------------------------- | ------------------------------- | ----------- |
| `DATABASE_URL`              | Your Supabase connection string | Production  |
| `DIRECT_URL`                | Your Supabase connection string | Production  |
| `SUPABASE_URL`              | Your Supabase project URL       | Production  |
| `SUPABASE_ANON_KEY`         | Your Supabase anon key          | Production  |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key  | Production  |

## Step 3: Database Migration

### Initial Setup

```bash
# Generate Prisma client
pnpm db:generate

# Create and apply initial migration
pnpm db:migrate

# Seed the database with initial data
pnpm db:seed
```

### Verify Connection

```bash
# Open Prisma Studio to verify connection
pnpm db:studio
```

## Step 4: Supabase-Specific Configuration

### Connection Pooling

Supabase automatically handles connection pooling, but you can optimize it:

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Note the **Connection pooling** settings
3. Use the pooled connection string for better performance in production

### SSL Configuration

Supabase requires SSL connections. This is already configured in the environment files:

```bash
DATABASE_SSL=true
```

### Row Level Security (RLS)

Consider enabling RLS for additional security:

1. Go to **Authentication** → **Policies** in Supabase dashboard
2. Enable RLS on sensitive tables
3. Create appropriate policies for your use case

## Step 5: Monitoring and Maintenance

### Database Monitoring

- Use Supabase dashboard for real-time monitoring
- Set up alerts for connection limits and performance

### Backup Strategy

- Supabase automatically backs up your database
- Consider additional backup strategies for critical data

### Performance Optimization

- Monitor query performance in Supabase dashboard
- Use database indexes appropriately
- Consider read replicas for high-traffic applications

## Troubleshooting

### Common Issues

1. **Connection Timeout**

   - Check your connection string format
   - Verify network connectivity
   - Ensure SSL is enabled

2. **Authentication Errors**

   - Verify your password is correct
   - Check if your IP is whitelisted (if applicable)

3. **Migration Failures**
   - Ensure database is empty for initial migration
   - Check for conflicting schema changes

### Support

- Supabase Documentation: https://supabase.com/docs
- Supabase Community: https://github.com/supabase/supabase/discussions
- Prisma Documentation: https://www.prisma.io/docs

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use service role key only on server-side**
3. **Rotate keys regularly**
4. **Enable RLS where appropriate**
5. **Monitor database access logs**
6. **Use environment-specific configurations**

## Next Steps

After completing this setup:

1. Run the test suite to verify everything works
2. Deploy to Vercel and test production connectivity
3. Set up monitoring and alerting
4. Configure backup and recovery procedures
