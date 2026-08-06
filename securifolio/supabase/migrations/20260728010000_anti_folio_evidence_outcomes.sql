ALTER TABLE public.anti_folio_history
    DROP CONSTRAINT IF EXISTS anti_folio_history_resultat_check;

ALTER TABLE public.anti_folio_history
    ADD CONSTRAINT anti_folio_history_resultat_check
    CHECK (
        resultat IN (
            -- Valeurs historiques conservées; les nouvelles écritures utilisent
            -- exclusivement les états factuels ci-dessous.
            'valid',
            'fraud',
            'pending',
            'match',
            'not_found',
            'ambiguous',
            'technical_error',
            'overlap_detected'
        )
    );
