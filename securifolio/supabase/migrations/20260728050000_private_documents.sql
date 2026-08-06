-- Le bucket contient des originaux administratifs : il ne doit jamais exposer
-- d'URL publique. Les lectures et URL signées passent par le serveur après RBAC.
INSERT INTO storage.buckets (id, name, public)
VALUES ('scans_certificats', 'scans_certificats', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

ALTER TABLE public.titres_fonciers
    ADD COLUMN IF NOT EXISTS storage_path TEXT,
    ADD COLUMN IF NOT EXISTS file_sha256 VARCHAR(64),
    ADD COLUMN IF NOT EXISTS metadata_hmac VARCHAR(64),
    ADD COLUMN IF NOT EXISTS document_version INTEGER;

DROP POLICY IF EXISTS "Agents upload scans_certificats" ON storage.objects;
DROP POLICY IF EXISTS "Agents delete pending scans_certificats" ON storage.objects;

CREATE POLICY "Agents upload scans_certificats"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'scans_certificats'
    AND split_part(name, '/', 1) IN ('temporary', 'documents')
    AND split_part(name, '/', 2) = auth.uid()::TEXT
    AND position('..' IN name) = 0
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'agent'
    )
);

CREATE POLICY "Agents delete pending scans_certificats"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'scans_certificats'
    AND split_part(name, '/', 2) = auth.uid()::TEXT
    AND (
        split_part(name, '/', 1) = 'temporary'
        OR (
            split_part(name, '/', 1) = 'documents'
            AND NOT EXISTS (
                SELECT 1
                FROM public.titres_fonciers
                WHERE titres_fonciers.storage_path = storage.objects.name
            )
        )
    )
);

ALTER TABLE public.titres_fonciers
    DROP CONSTRAINT IF EXISTS titres_fonciers_private_document_complete;
ALTER TABLE public.titres_fonciers
    ADD CONSTRAINT titres_fonciers_private_document_complete
    CHECK (
        (storage_path IS NULL AND file_sha256 IS NULL
            AND metadata_hmac IS NULL AND document_version IS NULL)
        OR
        (storage_path IS NOT NULL
            AND file_sha256 ~ '^[a-f0-9]{64}$'
            AND metadata_hmac ~ '^[a-f0-9]{64}$'
            AND document_version > 0)
    );

DROP FUNCTION IF EXISTS public.create_title_with_history(
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR,
    TIMESTAMP WITH TIME ZONE, TEXT, JSONB, VARCHAR, BOOLEAN
);

CREATE OR REPLACE FUNCTION public.create_title_with_history(
    p_numero_cadastral VARCHAR,
    p_nom_proprietaire VARCHAR,
    p_volume VARCHAR,
    p_folio VARCHAR,
    p_circonscription VARCHAR,
    p_superficie VARCHAR,
    p_date_enregistrement TIMESTAMP WITH TIME ZONE,
    p_storage_path TEXT,
    p_file_sha256 VARCHAR,
    p_metadata_hmac VARCHAR,
    p_coordonnees_spatiales JSONB,
    p_attested BOOLEAN
)
RETURNS UUID AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
    v_title_id UUID;
    v_attestation_text TEXT;
    v_document_version INTEGER;
    v_numero_cadastral VARCHAR;
BEGIN
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_profile.id IS NULL OR v_profile.role <> 'agent' THEN
        RAISE EXCEPTION 'Accès réservé aux agents assermentés.';
    END IF;

    IF NULLIF(BTRIM(v_profile.full_name), '') IS NULL
       OR NULLIF(BTRIM(v_profile.fonction), '') IS NULL
       OR NULLIF(BTRIM(v_profile.matricule), '') IS NULL THEN
        RAISE EXCEPTION 'Profil agent incomplet : nom, fonction et matricule sont obligatoires.';
    END IF;

    IF p_attested IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION 'Attestation obligatoire avant transmission.';
    END IF;

    IF p_storage_path NOT LIKE ('documents/' || auth.uid()::TEXT || '/%')
       OR position('..' IN p_storage_path) > 0 THEN
        RAISE EXCEPTION 'Chemin de stockage privé invalide.';
    END IF;

    IF p_file_sha256 !~ '^[a-f0-9]{64}$'
       OR p_metadata_hmac !~ '^[a-f0-9]{64}$' THEN
        RAISE EXCEPTION 'Enveloppe d''intégrité invalide.';
    END IF;

    IF v_profile.circonscription IS NOT NULL
       AND v_profile.circonscription <> p_circonscription THEN
        RAISE EXCEPTION 'Circonscription non autorisée pour cet agent.';
    END IF;

    v_numero_cadastral := BTRIM(p_numero_cadastral);
    v_attestation_text := format(
        'En tant qu''agent assermenté %s (%s, rôle %s, matricule %s), j''atteste sur l''honneur avoir vérifié visuellement la conformité de ces données avec le document physique original. Toute altération non signalée engagera ma responsabilité pénale.',
        BTRIM(v_profile.full_name),
        BTRIM(v_profile.fonction),
        v_profile.role,
        BTRIM(v_profile.matricule)
    );

    PERFORM pg_advisory_xact_lock(hashtextextended(v_numero_cadastral, 0));

    SELECT COALESCE(MAX(document_version), 0) + 1
    INTO v_document_version
    FROM public.smart_archive_history
    WHERE numero_cadastral = v_numero_cadastral
      AND action_type = 'insert'
      AND attestation_text IS NOT NULL;

    INSERT INTO public.titres_fonciers (
        numero_cadastral,
        nom_proprietaire,
        volume,
        folio,
        circonscription,
        superficie,
        date_enregistrement,
        statut,
        scan_url,
        hash_signature,
        storage_path,
        file_sha256,
        metadata_hmac,
        document_version,
        coordonnees_spatiales
    )
    VALUES (
        v_numero_cadastral,
        p_nom_proprietaire,
        COALESCE(p_volume, ''),
        COALESCE(p_folio, ''),
        p_circonscription,
        COALESCE(p_superficie, ''),
        p_date_enregistrement,
        'En attente de validation cadastrale',
        NULL,
        NULL,
        p_storage_path,
        p_file_sha256,
        p_metadata_hmac,
        v_document_version,
        p_coordonnees_spatiales
    )
    RETURNING id INTO v_title_id;

    INSERT INTO public.smart_archive_history (
        agent_id,
        numero_cadastral,
        action_type,
        document_version,
        attestation_text
    )
    VALUES (
        auth.uid(),
        v_numero_cadastral,
        'insert',
        v_document_version,
        v_attestation_text
    );

    RETURN v_title_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.create_title_with_history(
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR,
    TIMESTAMP WITH TIME ZONE, TEXT, VARCHAR, VARCHAR, JSONB, BOOLEAN
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_title_with_history(
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR,
    TIMESTAMP WITH TIME ZONE, TEXT, VARCHAR, VARCHAR, JSONB, BOOLEAN
) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_title_with_history(
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR,
    TIMESTAMP WITH TIME ZONE, TEXT, VARCHAR, VARCHAR, JSONB, BOOLEAN
) TO authenticated;

CREATE OR REPLACE FUNCTION public.log_document_integrity_check(
    p_title_id UUID,
    p_passed BOOLEAN,
    p_actor_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
    v_title public.titres_fonciers%ROWTYPE;
BEGIN
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = p_actor_id;

    SELECT * INTO v_title
    FROM public.titres_fonciers
    WHERE id = p_title_id;

    IF v_profile.id IS NULL
       OR v_profile.role NOT IN ('agent', 'chef_cadastre', 'conservateur', 'notaire')
       OR v_title.id IS NULL THEN
        RAISE EXCEPTION 'Consultation administrative non autorisée.';
    END IF;

    IF v_profile.circonscription IS NOT NULL
       AND v_profile.circonscription <> v_title.circonscription THEN
        RAISE EXCEPTION 'Circonscription non autorisée.';
    END IF;

    INSERT INTO public.smart_archive_history (
        agent_id,
        numero_cadastral,
        action_type,
        document_version,
        notes
    )
    VALUES (
        p_actor_id,
        v_title.numero_cadastral,
        CASE
            WHEN p_passed THEN 'integrity_check_passed'
            ELSE 'integrity_check_failed'
        END,
        v_title.document_version,
        'Contrôle automatique avant consultation administrative'
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.log_document_integrity_check(UUID, BOOLEAN, UUID)
    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_document_integrity_check(UUID, BOOLEAN, UUID)
    FROM anon;
REVOKE ALL ON FUNCTION public.log_document_integrity_check(UUID, BOOLEAN, UUID)
    FROM authenticated;
GRANT EXECUTE ON FUNCTION public.log_document_integrity_check(UUID, BOOLEAN, UUID)
    TO service_role;
