-- Corrige les bases ayant déjà reçu document_version en VARCHAR/TEXT.
-- La migration échoue explicitement avant conversion si une valeur ne peut pas
-- représenter un entier positif PostgreSQL.
DROP TRIGGER IF EXISTS prevent_smart_archive_history_mutation
    ON public.smart_archive_history;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.smart_archive_history
        WHERE document_version IS NOT NULL AND BTRIM(document_version::text) !~ '^[0-9]+$'
    ) THEN
        RAISE EXCEPTION 'smart_archive_history.document_version contient une valeur non entière';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.smart_archive_history
        WHERE document_version IS NOT NULL
          AND (
              BTRIM(document_version::text)::NUMERIC < 1
              OR BTRIM(document_version::text)::NUMERIC > 2147483647
          )
    ) THEN
        RAISE EXCEPTION 'smart_archive_history.document_version est hors limites';
    END IF;
END;
$$;

ALTER TABLE public.smart_archive_history
    ALTER COLUMN document_version TYPE INTEGER
    USING (
        CASE
            WHEN document_version IS NULL THEN NULL
            ELSE BTRIM(document_version::text)::INTEGER
        END
    );

UPDATE public.smart_archive_history AS history
SET document_version = COALESCE(
    (
        SELECT MAX(previous.document_version)
        FROM public.smart_archive_history AS previous
        WHERE previous.numero_cadastral = history.numero_cadastral
          AND previous.document_version IS NOT NULL
          AND previous.created_at <= history.created_at
    ),
    (
        SELECT MIN(known.document_version)
        FROM public.smart_archive_history AS known
        WHERE known.numero_cadastral = history.numero_cadastral
          AND known.document_version IS NOT NULL
    ),
    1
)
WHERE history.document_version IS NULL;

ALTER TABLE public.smart_archive_history
    ALTER COLUMN document_version SET NOT NULL;

ALTER TABLE public.smart_archive_history
    DROP CONSTRAINT IF EXISTS smart_archive_history_document_version_positive;

ALTER TABLE public.smart_archive_history
    ADD CONSTRAINT smart_archive_history_document_version_positive
    CHECK (document_version > 0);

CREATE TRIGGER prevent_smart_archive_history_mutation
    BEFORE UPDATE OR DELETE ON public.smart_archive_history
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_history_mutation();

-- Une écriture métier sans version (validation/rejet ultérieur) reprend la
-- version courante. Seule create_title_with_history calcule une nouvelle version.
CREATE OR REPLACE FUNCTION public.assign_smart_archive_document_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.document_version IS NULL THEN
        PERFORM pg_advisory_xact_lock(hashtextextended(NEW.numero_cadastral, 0));

        SELECT COALESCE(MAX(document_version), 1)
        INTO NEW.document_version
        FROM public.smart_archive_history
        WHERE numero_cadastral = NEW.numero_cadastral;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.assign_smart_archive_document_version()
    FROM PUBLIC;

DROP TRIGGER IF EXISTS assign_smart_archive_document_version
    ON public.smart_archive_history;

CREATE TRIGGER assign_smart_archive_document_version
    BEFORE INSERT ON public.smart_archive_history
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_smart_archive_document_version();

-- Aucun utilisateur applicatif ne peut forger l'audit directement.
DROP POLICY IF EXISTS "Agents peuvent insérer historique"
    ON public.smart_archive_history;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.smart_archive_history
    FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.smart_archive_history
    FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.smart_archive_history
    FROM PUBLIC;
GRANT SELECT ON TABLE public.smart_archive_history
    TO authenticated;

-- Réaffirme le contexte et les permissions de l'unique RPC créant une version.
ALTER FUNCTION public.create_title_with_history(
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    TIMESTAMP WITH TIME ZONE,
    TEXT,
    JSONB,
    VARCHAR,
    BOOLEAN
) SECURITY DEFINER;

ALTER FUNCTION public.create_title_with_history(
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    TIMESTAMP WITH TIME ZONE,
    TEXT,
    JSONB,
    VARCHAR,
    BOOLEAN
) SET search_path = public;

REVOKE ALL ON FUNCTION public.create_title_with_history(
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    TIMESTAMP WITH TIME ZONE,
    TEXT,
    JSONB,
    VARCHAR,
    BOOLEAN
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.create_title_with_history(
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    TIMESTAMP WITH TIME ZONE,
    TEXT,
    JSONB,
    VARCHAR,
    BOOLEAN
) FROM anon;

GRANT EXECUTE ON FUNCTION public.create_title_with_history(
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    TIMESTAMP WITH TIME ZONE,
    TEXT,
    JSONB,
    VARCHAR,
    BOOLEAN
) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_smart_archive_duplicate(
    p_numero_cadastral VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
BEGIN
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_profile.id IS NULL OR v_profile.role <> 'agent' THEN
        RAISE EXCEPTION 'Accès réservé aux agents assermentés.';
    END IF;

    INSERT INTO public.smart_archive_history (
        agent_id,
        numero_cadastral,
        action_type
    )
    VALUES (
        auth.uid(),
        BTRIM(p_numero_cadastral),
        'rejected_duplicate'
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.record_smart_archive_duplicate(VARCHAR)
    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_smart_archive_duplicate(VARCHAR)
    FROM anon;
GRANT EXECUTE ON FUNCTION public.record_smart_archive_duplicate(VARCHAR)
    TO authenticated;

ALTER FUNCTION public.update_title_status_with_history(UUID, VARCHAR, TEXT)
    SECURITY DEFINER;
ALTER FUNCTION public.update_title_status_with_history(UUID, VARCHAR, TEXT)
    SET search_path = public;
REVOKE ALL ON FUNCTION public.update_title_status_with_history(UUID, VARCHAR, TEXT)
    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_title_status_with_history(UUID, VARCHAR, TEXT)
    FROM anon;
GRANT EXECUTE ON FUNCTION public.update_title_status_with_history(UUID, VARCHAR, TEXT)
    TO authenticated;
