-- Allow users to delete their own rejected transactions (so Financeiro can dismiss them)
CREATE POLICY "Users can delete own rejected_transactions"
ON public.rejected_transactions
FOR DELETE
USING (created_by = auth.uid());