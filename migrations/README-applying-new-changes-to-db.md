# When you need to modify the schema in the future:

1. Create a new migration file with an incremental number:

   ```
   003_add_new_feature.sql
   ```

2. Include only the changes you want to make:

   ```sql
   -- Add a new column to events table
   ALTER TABLE events ADD COLUMN new_feature VARCHAR(255);

   -- Record this migration
   INSERT INTO migrations (version) VALUES ('003_add_new_feature');
   ```

3. Run the migration:
   ```bash
   npm run migrate
   ```
