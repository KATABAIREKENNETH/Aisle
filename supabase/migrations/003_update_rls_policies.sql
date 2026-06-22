-- Migration: Update RLS policies to use wedding_members table
-- This replaces couple_id/partner_id checks with wedding_members checks

-- Check if wedding_members table exists before updating policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wedding_members'
  ) THEN
    RAISE NOTICE 'wedding_members table does not exist, skipping RLS policy updates';
    RETURN;
  END IF;

  -- Drop old Weddings RLS policies
  DROP POLICY IF EXISTS "Superadmins can view all weddings" ON weddings;
  DROP POLICY IF EXISTS "Users can view own weddings" ON weddings;
  DROP POLICY IF EXISTS "Superadmins can update all weddings" ON weddings;
  DROP POLICY IF EXISTS "Users can update own weddings" ON weddings;
  DROP POLICY IF EXISTS "Superadmins can insert weddings" ON weddings;
  DROP POLICY IF EXISTS "Users can insert own weddings" ON weddings;

  -- Create new Weddings RLS policies using wedding_members
  DROP POLICY IF EXISTS "Superadmins can view all weddings" ON weddings;
  CREATE POLICY "Superadmins can view all weddings" ON weddings
    FOR SELECT USING (public.is_superadmin());

  DROP POLICY IF EXISTS "Users can view weddings they are members of" ON weddings;
  CREATE POLICY "Users can view weddings they are members of" ON weddings
    FOR SELECT USING (
      id IN (
        SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Superadmins can update all weddings" ON weddings;
  CREATE POLICY "Superadmins can update all weddings" ON weddings
    FOR UPDATE USING (public.is_superadmin());

  DROP POLICY IF EXISTS "Users can update weddings they are couple/partner/planner in" ON weddings;
  CREATE POLICY "Users can update weddings they are couple/partner/planner in" ON weddings
    FOR UPDATE USING (
      id IN (
        SELECT wedding_id FROM wedding_members 
        WHERE user_id = auth.uid() 
        AND role IN ('couple', 'partner', 'planner')
      )
    );

  DROP POLICY IF EXISTS "Superadmins can insert weddings" ON weddings;
  CREATE POLICY "Superadmins can insert weddings" ON weddings
    FOR INSERT WITH CHECK (public.is_superadmin());

  DROP POLICY IF EXISTS "Users can insert weddings" ON weddings;
  CREATE POLICY "Users can insert weddings" ON weddings
    FOR INSERT WITH CHECK (
      couple_id = auth.uid() OR
      partner_id = auth.uid()
    );
END $$;

-- Drop old Tasks RLS policies
DROP POLICY IF EXISTS "Superadmins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks from own weddings" ON tasks;
DROP POLICY IF EXISTS "Superadmins can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks to own weddings" ON tasks;
DROP POLICY IF EXISTS "Superadmins can update all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks from own weddings" ON tasks;
DROP POLICY IF EXISTS "Superadmins can delete all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks from own weddings" ON tasks;

-- Create new Tasks RLS policies using wedding_members
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wedding_members'
  ) THEN
    DROP POLICY IF EXISTS "Superadmins can view all tasks" ON tasks;
    CREATE POLICY "Superadmins can view all tasks" ON tasks
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view tasks from weddings they are members of" ON tasks;
    CREATE POLICY "Users can view tasks from weddings they are members of" ON tasks
      FOR SELECT USING (
        tasks.wedding_id IN (
          SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert tasks" ON tasks;
    CREATE POLICY "Superadmins can insert tasks" ON tasks
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert tasks to weddings they have permission" ON tasks;
    CREATE POLICY "Users can insert tasks to weddings they have permission" ON tasks
      FOR INSERT WITH CHECK (
        tasks.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_assign_tasks')::boolean = true
        )
      );

    DROP POLICY IF EXISTS "Superadmins can update all tasks" ON tasks;
    CREATE POLICY "Superadmins can update all tasks" ON tasks
      FOR UPDATE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can update tasks from weddings they have permission" ON tasks;
    CREATE POLICY "Users can update tasks from weddings they have permission" ON tasks
      FOR UPDATE USING (
        tasks.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_assign_tasks')::boolean = true
        )
        OR assigned_to = auth.uid()
      );

    DROP POLICY IF EXISTS "Superadmins can delete all tasks" ON tasks;
    CREATE POLICY "Superadmins can delete all tasks" ON tasks
      FOR DELETE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can delete tasks from weddings they have permission" ON tasks;
    CREATE POLICY "Users can delete tasks from weddings they have permission" ON tasks
      FOR DELETE USING (
        tasks.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_assign_tasks')::boolean = true
        )
      );
  ELSE
    -- Fallback to old policies if wedding_members doesn't exist
    DROP POLICY IF EXISTS "Superadmins can view all tasks" ON tasks;
    CREATE POLICY "Superadmins can view all tasks" ON tasks
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view tasks from own weddings" ON tasks;
    CREATE POLICY "Users can view tasks from own weddings" ON tasks
      FOR SELECT USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert tasks" ON tasks;
    CREATE POLICY "Superadmins can insert tasks" ON tasks
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert tasks to own weddings" ON tasks;
    CREATE POLICY "Users can insert tasks to own weddings" ON tasks
      FOR INSERT WITH CHECK (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can update all tasks" ON tasks;
    CREATE POLICY "Superadmins can update all tasks" ON tasks
      FOR UPDATE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can update tasks from own weddings" ON tasks;
    CREATE POLICY "Users can update tasks from own weddings" ON tasks
      FOR UPDATE USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can delete all tasks" ON tasks;
    CREATE POLICY "Superadmins can delete all tasks" ON tasks
      FOR DELETE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can delete tasks from own weddings" ON tasks;
    CREATE POLICY "Users can delete tasks from own weddings" ON tasks
      FOR DELETE USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Drop old Budget Categories RLS policies
DROP POLICY IF EXISTS "Superadmins can view all budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can view budget categories from own weddings" ON budget_categories;
DROP POLICY IF EXISTS "Superadmins can insert budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can insert budget categories to own weddings" ON budget_categories;
DROP POLICY IF EXISTS "Superadmins can update all budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can update budget categories from own weddings" ON budget_categories;

-- Create new Budget Categories RLS policies using wedding_members
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wedding_members'
  ) THEN
    DROP POLICY IF EXISTS "Superadmins can view all budget categories" ON budget_categories;
    CREATE POLICY "Superadmins can view all budget categories" ON budget_categories
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view budget categories from weddings they are members of" ON budget_categories;
    CREATE POLICY "Users can view budget categories from weddings they are members of" ON budget_categories
      FOR SELECT USING (
        budget_categories.wedding_id IN (
          SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert budget categories" ON budget_categories;
    CREATE POLICY "Superadmins can insert budget categories" ON budget_categories
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert budget categories to weddings they have permission" ON budget_categories;
    CREATE POLICY "Users can insert budget categories to weddings they have permission" ON budget_categories
      FOR INSERT WITH CHECK (
        budget_categories.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_edit_budget')::boolean = true
        )
      );

    DROP POLICY IF EXISTS "Superadmins can update all budget categories" ON budget_categories;
    CREATE POLICY "Superadmins can update all budget categories" ON budget_categories
      FOR UPDATE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can update budget categories from weddings they have permission" ON budget_categories;
    CREATE POLICY "Users can update budget categories from weddings they have permission" ON budget_categories
      FOR UPDATE USING (
        budget_categories.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_edit_budget')::boolean = true
        )
      );
  ELSE
    -- Fallback to old policies
    DROP POLICY IF EXISTS "Superadmins can view all budget categories" ON budget_categories;
    CREATE POLICY "Superadmins can view all budget categories" ON budget_categories
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view budget categories from own weddings" ON budget_categories;
    CREATE POLICY "Users can view budget categories from own weddings" ON budget_categories
      FOR SELECT USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert budget categories" ON budget_categories;
    CREATE POLICY "Superadmins can insert budget categories" ON budget_categories
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert budget categories to own weddings" ON budget_categories;
    CREATE POLICY "Users can insert budget categories to own weddings" ON budget_categories
      FOR INSERT WITH CHECK (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can update all budget categories" ON budget_categories;
    CREATE POLICY "Superadmins can update all budget categories" ON budget_categories
      FOR UPDATE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can update budget categories from own weddings" ON budget_categories;
    CREATE POLICY "Users can update budget categories from own weddings" ON budget_categories
      FOR UPDATE USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Drop old Expenses RLS policies
DROP POLICY IF EXISTS "Superadmins can view all expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view expenses from own weddings" ON expenses;
DROP POLICY IF EXISTS "Superadmins can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert expenses to own weddings" ON expenses;
DROP POLICY IF EXISTS "Superadmins can update all expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses from own weddings" ON expenses;
DROP POLICY IF EXISTS "Superadmins can delete all expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses from own weddings" ON expenses;

-- Create new Expenses RLS policies using wedding_members
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wedding_members'
  ) THEN
    DROP POLICY IF EXISTS "Superadmins can view all expenses" ON expenses;
    CREATE POLICY "Superadmins can view all expenses" ON expenses
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view expenses from weddings they are members of" ON expenses;
    CREATE POLICY "Users can view expenses from weddings they are members of" ON expenses
      FOR SELECT USING (
        expenses.wedding_id IN (
          SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid()
          AND (permissions ->> 'can_view_budget')::boolean = true
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert expenses" ON expenses;
    CREATE POLICY "Superadmins can insert expenses" ON expenses
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert expenses to weddings they have permission" ON expenses;
    CREATE POLICY "Users can insert expenses to weddings they have permission" ON expenses
      FOR INSERT WITH CHECK (
        expenses.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_edit_budget')::boolean = true
        )
      );

    DROP POLICY IF EXISTS "Superadmins can update all expenses" ON expenses;
    CREATE POLICY "Superadmins can update all expenses" ON expenses
      FOR UPDATE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can update expenses from weddings they have permission" ON expenses;
    CREATE POLICY "Users can update expenses from weddings they have permission" ON expenses
      FOR UPDATE USING (
        expenses.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_edit_budget')::boolean = true
        )
      );

    DROP POLICY IF EXISTS "Superadmins can delete all expenses" ON expenses;
    CREATE POLICY "Superadmins can delete all expenses" ON expenses
      FOR DELETE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can delete expenses from weddings they have permission" ON expenses;
    CREATE POLICY "Users can delete expenses from weddings they have permission" ON expenses
      FOR DELETE USING (
        expenses.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_edit_budget')::boolean = true
        )
      );
  ELSE
    -- Fallback to old policies
    DROP POLICY IF EXISTS "Superadmins can view all expenses" ON expenses;
    CREATE POLICY "Superadmins can view all expenses" ON expenses
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view expenses from own weddings" ON expenses;
    CREATE POLICY "Users can view expenses from own weddings" ON expenses
      FOR SELECT USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert expenses" ON expenses;
    CREATE POLICY "Superadmins can insert expenses" ON expenses
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert expenses to own weddings" ON expenses;
    CREATE POLICY "Users can insert expenses to own weddings" ON expenses
      FOR INSERT WITH CHECK (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can update all expenses" ON expenses;
    CREATE POLICY "Superadmins can update all expenses" ON expenses
      FOR UPDATE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can update expenses from own weddings" ON expenses;
    CREATE POLICY "Users can update expenses from own weddings" ON expenses
      FOR UPDATE USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can delete all expenses" ON expenses;
    CREATE POLICY "Superadmins can delete all expenses" ON expenses
      FOR DELETE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can delete expenses from own weddings" ON expenses;
    CREATE POLICY "Users can delete expenses from own weddings" ON expenses
      FOR DELETE USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Drop old Vendors RLS policies
DROP POLICY IF EXISTS "Superadmins can view all vendors" ON vendors;
DROP POLICY IF EXISTS "Users can view vendors from own weddings" ON vendors;
DROP POLICY IF EXISTS "Superadmins can insert vendors" ON vendors;
DROP POLICY IF EXISTS "Users can insert vendors to own weddings" ON vendors;
DROP POLICY IF EXISTS "Superadmins can update all vendors" ON vendors;
DROP POLICY IF EXISTS "Users can update vendors from own weddings" ON vendors;
DROP POLICY IF EXISTS "Superadmins can delete all vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete vendors from own weddings" ON vendors;

-- Create new Vendors RLS policies using wedding_members
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wedding_members'
  ) THEN
    DROP POLICY IF EXISTS "Superadmins can view all vendors" ON vendors;
    CREATE POLICY "Superadmins can view all vendors" ON vendors
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view vendors from weddings they are members of" ON vendors;
    CREATE POLICY "Users can view vendors from weddings they are members of" ON vendors
      FOR SELECT USING (
        vendors.wedding_id IN (
          SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert vendors" ON vendors;
    CREATE POLICY "Superadmins can insert vendors" ON vendors
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert vendors to weddings they have permission" ON vendors;
    CREATE POLICY "Users can insert vendors to weddings they have permission" ON vendors
      FOR INSERT WITH CHECK (
        vendors.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_manage_vendors')::boolean = true
        )
      );

    DROP POLICY IF EXISTS "Superadmins can update all vendors" ON vendors;
    CREATE POLICY "Superadmins can update all vendors" ON vendors
      FOR UPDATE USING (public.is_superadmin());

    -- Check if user_id column exists in vendors table before using it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'vendors' AND column_name = 'user_id'
    ) THEN
      DROP POLICY IF EXISTS "Users can update vendors from weddings they have permission" ON vendors;
      CREATE POLICY "Users can update vendors from weddings they have permission" ON vendors
        FOR UPDATE USING (
          vendors.wedding_id IN (
            SELECT wedding_id FROM wedding_members 
            WHERE user_id = auth.uid() 
            AND (permissions ->> 'can_manage_vendors')::boolean = true
          )
          OR user_id = auth.uid()
        );
    ELSE
      DROP POLICY IF EXISTS "Users can update vendors from weddings they have permission" ON vendors;
      CREATE POLICY "Users can update vendors from weddings they have permission" ON vendors
        FOR UPDATE USING (
          vendors.wedding_id IN (
            SELECT wedding_id FROM wedding_members 
            WHERE user_id = auth.uid() 
            AND (permissions ->> 'can_manage_vendors')::boolean = true
          )
        );
    END IF;

    DROP POLICY IF EXISTS "Superadmins can delete all vendors" ON vendors;
    CREATE POLICY "Superadmins can delete all vendors" ON vendors
      FOR DELETE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can delete vendors from weddings they have permission" ON vendors;
    CREATE POLICY "Users can delete vendors from weddings they have permission" ON vendors
      FOR DELETE USING (
        vendors.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_manage_vendors')::boolean = true
        )
      );
  ELSE
    -- Fallback to old policies
    DROP POLICY IF EXISTS "Superadmins can view all vendors" ON vendors;
    CREATE POLICY "Superadmins can view all vendors" ON vendors
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view vendors from own weddings" ON vendors;
    CREATE POLICY "Users can view vendors from own weddings" ON vendors
      FOR SELECT USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert vendors" ON vendors;
    CREATE POLICY "Superadmins can insert vendors" ON vendors
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert vendors to own weddings" ON vendors;
    CREATE POLICY "Users can insert vendors to own weddings" ON vendors
      FOR INSERT WITH CHECK (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can update all vendors" ON vendors;
    CREATE POLICY "Superadmins can update all vendors" ON vendors
      FOR UPDATE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can update vendors from own weddings" ON vendors;
    CREATE POLICY "Users can update vendors from own weddings" ON vendors
      FOR UPDATE USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can delete all vendors" ON vendors;
    CREATE POLICY "Superadmins can delete all vendors" ON vendors
      FOR DELETE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can delete vendors from own weddings" ON vendors;
    CREATE POLICY "Users can delete vendors from own weddings" ON vendors
      FOR DELETE USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Drop old Guests RLS policies
DROP POLICY IF EXISTS "Superadmins can view all guests" ON guests;
DROP POLICY IF EXISTS "Users can view guests from own weddings" ON guests;
DROP POLICY IF EXISTS "Superadmins can insert guests" ON guests;
DROP POLICY IF EXISTS "Users can insert guests to own weddings" ON guests;
DROP POLICY IF EXISTS "Superadmins can update all guests" ON guests;
DROP POLICY IF EXISTS "Users can update guests from own weddings" ON guests;
DROP POLICY IF EXISTS "Superadmins can delete all guests" ON guests;
DROP POLICY IF EXISTS "Users can delete guests from own weddings" ON guests;

-- Create new Guests RLS policies using wedding_members
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wedding_members'
  ) THEN
    DROP POLICY IF EXISTS "Superadmins can view all guests" ON guests;
    CREATE POLICY "Superadmins can view all guests" ON guests
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view guests from weddings they are members of" ON guests;
    CREATE POLICY "Users can view guests from weddings they are members of" ON guests
      FOR SELECT USING (
        guests.wedding_id IN (
          SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert guests" ON guests;
    CREATE POLICY "Superadmins can insert guests" ON guests
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert guests to weddings they have permission" ON guests;
    CREATE POLICY "Users can insert guests to weddings they have permission" ON guests
      FOR INSERT WITH CHECK (
        guests.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_manage_guests')::boolean = true
        )
      );

    DROP POLICY IF EXISTS "Superadmins can update all guests" ON guests;
    CREATE POLICY "Superadmins can update all guests" ON guests
      FOR UPDATE USING (public.is_superadmin());

    -- Check if user_id column exists in guests table before using it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'guests' AND column_name = 'user_id'
    ) THEN
      DROP POLICY IF EXISTS "Users can update guests from weddings they have permission" ON guests;
      CREATE POLICY "Users can update guests from weddings they have permission" ON guests
        FOR UPDATE USING (
          guests.wedding_id IN (
            SELECT wedding_id FROM wedding_members 
            WHERE user_id = auth.uid() 
            AND (permissions ->> 'can_manage_guests')::boolean = true
          )
          OR user_id = auth.uid()
        );
    ELSE
      DROP POLICY IF EXISTS "Users can update guests from weddings they have permission" ON guests;
      CREATE POLICY "Users can update guests from weddings they have permission" ON guests
        FOR UPDATE USING (
          guests.wedding_id IN (
            SELECT wedding_id FROM wedding_members 
            WHERE user_id = auth.uid() 
            AND (permissions ->> 'can_manage_guests')::boolean = true
          )
        );
    END IF;

    DROP POLICY IF EXISTS "Superadmins can delete all guests" ON guests;
    CREATE POLICY "Superadmins can delete all guests" ON guests
      FOR DELETE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can delete guests from weddings they have permission" ON guests;
    CREATE POLICY "Users can delete guests from weddings they have permission" ON guests
      FOR DELETE USING (
        guests.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_manage_guests')::boolean = true
        )
      );
  ELSE
    -- Fallback to old policies
    DROP POLICY IF EXISTS "Superadmins can view all guests" ON guests;
    CREATE POLICY "Superadmins can view all guests" ON guests
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view guests from own weddings" ON guests;
    CREATE POLICY "Users can view guests from own weddings" ON guests
      FOR SELECT USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert guests" ON guests;
    CREATE POLICY "Superadmins can insert guests" ON guests
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert guests to own weddings" ON guests;
    CREATE POLICY "Users can insert guests to own weddings" ON guests
      FOR INSERT WITH CHECK (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can update all guests" ON guests;
    CREATE POLICY "Superadmins can update all guests" ON guests
      FOR UPDATE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can update guests from own weddings" ON guests;
    CREATE POLICY "Users can update guests from own weddings" ON guests
      FOR UPDATE USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can delete all guests" ON guests;
    CREATE POLICY "Superadmins can delete all guests" ON guests
      FOR DELETE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can delete guests from own weddings" ON guests;
    CREATE POLICY "Users can delete guests from own weddings" ON guests
      FOR DELETE USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Drop old Appointments RLS policies
DROP POLICY IF EXISTS "Superadmins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view appointments from own weddings" ON appointments;
DROP POLICY IF EXISTS "Superadmins can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert appointments to own weddings" ON appointments;
DROP POLICY IF EXISTS "Superadmins can update all appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments from own weddings" ON appointments;

-- Create new Appointments RLS policies using wedding_members
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wedding_members'
  ) THEN
    DROP POLICY IF EXISTS "Superadmins can view all appointments" ON appointments;
    CREATE POLICY "Superadmins can view all appointments" ON appointments
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view appointments from weddings they are members of" ON appointments;
    CREATE POLICY "Users can view appointments from weddings they are members of" ON appointments
      FOR SELECT USING (
        appointments.wedding_id IN (
          SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert appointments" ON appointments;
    CREATE POLICY "Superadmins can insert appointments" ON appointments
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert appointments to weddings they have permission" ON appointments;
    CREATE POLICY "Users can insert appointments to weddings they have permission" ON appointments
      FOR INSERT WITH CHECK (
        appointments.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_view_tasks')::boolean = true
        )
      );

    DROP POLICY IF EXISTS "Superadmins can update all appointments" ON appointments;
    CREATE POLICY "Superadmins can update all appointments" ON appointments
      FOR UPDATE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can update appointments from weddings they have permission" ON appointments;
    CREATE POLICY "Users can update appointments from weddings they have permission" ON appointments
      FOR UPDATE USING (
        appointments.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_view_tasks')::boolean = true
        )
      );
  ELSE
    -- Fallback to old policies
    DROP POLICY IF EXISTS "Superadmins can view all appointments" ON appointments;
    CREATE POLICY "Superadmins can view all appointments" ON appointments
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view appointments from own weddings" ON appointments;
    CREATE POLICY "Users can view appointments from own weddings" ON appointments
      FOR SELECT USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert appointments" ON appointments;
    CREATE POLICY "Superadmins can insert appointments" ON appointments
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert appointments to own weddings" ON appointments;
    CREATE POLICY "Users can insert appointments to own weddings" ON appointments
      FOR INSERT WITH CHECK (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can update all appointments" ON appointments;
    CREATE POLICY "Superadmins can update all appointments" ON appointments
      FOR UPDATE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can update appointments from own weddings" ON appointments;
    CREATE POLICY "Users can update appointments from own weddings" ON appointments
      FOR UPDATE USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Drop old Conversations RLS policies
DROP POLICY IF EXISTS "Superadmins can view all conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations from own weddings" ON conversations;
DROP POLICY IF EXISTS "Superadmins can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations to own weddings" ON conversations;
DROP POLICY IF EXISTS "Superadmins can update all conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they created" ON conversations;

-- Create new Conversations RLS policies using wedding_members
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wedding_members'
  ) THEN
    DROP POLICY IF EXISTS "Superadmins can view all conversations" ON conversations;
    CREATE POLICY "Superadmins can view all conversations" ON conversations
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view conversations from weddings they are members of" ON conversations;
    CREATE POLICY "Users can view conversations from weddings they are members of" ON conversations
      FOR SELECT USING (
        conversations.wedding_id IN (
          SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert conversations" ON conversations;
    CREATE POLICY "Superadmins can insert conversations" ON conversations
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert conversations to weddings they have permission" ON conversations;
    CREATE POLICY "Users can insert conversations to weddings they have permission" ON conversations
      FOR INSERT WITH CHECK (
        conversations.wedding_id IN (
          SELECT wedding_id FROM wedding_members 
          WHERE user_id = auth.uid() 
          AND (permissions ->> 'can_send_messages')::boolean = true
        ) AND created_by = auth.uid()
      );

    DROP POLICY IF EXISTS "Superadmins can update all conversations" ON conversations;
    CREATE POLICY "Superadmins can update all conversations" ON conversations
      FOR UPDATE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can update conversations they created" ON conversations;
    CREATE POLICY "Users can update conversations they created" ON conversations
      FOR UPDATE USING (created_by = auth.uid());
  ELSE
    -- Fallback to old policies
    DROP POLICY IF EXISTS "Superadmins can view all conversations" ON conversations;
    CREATE POLICY "Superadmins can view all conversations" ON conversations
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view conversations from own weddings" ON conversations;
    CREATE POLICY "Users can view conversations from own weddings" ON conversations
      FOR SELECT USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert conversations" ON conversations;
    CREATE POLICY "Superadmins can insert conversations" ON conversations
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert conversations to own weddings" ON conversations;
    CREATE POLICY "Users can insert conversations to own weddings" ON conversations
      FOR INSERT WITH CHECK (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        ) AND created_by = auth.uid()
      );

    DROP POLICY IF EXISTS "Superadmins can update all conversations" ON conversations;
    CREATE POLICY "Superadmins can update all conversations" ON conversations
      FOR UPDATE USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can update conversations they created" ON conversations;
    CREATE POLICY "Users can update conversations they created" ON conversations
      FOR UPDATE USING (created_by = auth.uid());
  END IF;
END $$;

-- Drop old Activity Log RLS policies
DROP POLICY IF EXISTS "Superadmins can view all activity logs" ON activity_log;
DROP POLICY IF EXISTS "Users can view activity log from own weddings" ON activity_log;
DROP POLICY IF EXISTS "Superadmins can insert activity logs" ON activity_log;
DROP POLICY IF EXISTS "Users can insert activity log to own weddings" ON activity_log;

-- Create new Activity Log RLS policies using wedding_members
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wedding_members'
  ) THEN
    DROP POLICY IF EXISTS "Superadmins can view all activity logs" ON activity_log;
    CREATE POLICY "Superadmins can view all activity logs" ON activity_log
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view activity log from weddings they are members of" ON activity_log;
    CREATE POLICY "Users can view activity log from weddings they are members of" ON activity_log
      FOR SELECT USING (
        activity_log.wedding_id IN (
          SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert activity logs" ON activity_log;
    CREATE POLICY "Superadmins can insert activity logs" ON activity_log
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert activity log to weddings they are members of" ON activity_log;
    CREATE POLICY "Users can insert activity log to weddings they are members of" ON activity_log
      FOR INSERT WITH CHECK (
        activity_log.wedding_id IN (
          SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid()
        )
      );
  ELSE
    -- Fallback to old policies
    DROP POLICY IF EXISTS "Superadmins can view all activity logs" ON activity_log;
    CREATE POLICY "Superadmins can view all activity logs" ON activity_log
      FOR SELECT USING (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can view activity log from own weddings" ON activity_log;
    CREATE POLICY "Users can view activity log from own weddings" ON activity_log
      FOR SELECT USING (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Superadmins can insert activity logs" ON activity_log;
    CREATE POLICY "Superadmins can insert activity logs" ON activity_log
      FOR INSERT WITH CHECK (public.is_superadmin());

    DROP POLICY IF EXISTS "Users can insert activity log to own weddings" ON activity_log;
    CREATE POLICY "Users can insert activity log to own weddings" ON activity_log
      FOR INSERT WITH CHECK (
        wedding_id IN (
          SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
        )
      );
  END IF;
END $$;
