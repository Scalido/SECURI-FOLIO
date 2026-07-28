-- Les événements d'audit non créateurs ne participent jamais à l'allocation
-- d'une nouvelle version documentaire.
CREATE OR REPLACE FUNCTION public.assign_smart_archive_document_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.action_type = 'insert' THEN
        IF NEW.document_version IS NULL THEN
            RAISE EXCEPTION 'Une création autoritative doit fournir sa version transactionnelle.';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.document_version IS NULL THEN
        PERFORM pg_advisory_xact_lock(hashtextextended(NEW.numero_cadastral, 0));

        SELECT COALESCE(MAX(document_version), 1)
        INTO NEW.document_version
        FROM public.smart_archive_history
        WHERE numero_cadastral = NEW.numero_cadastral
          AND action_type = 'insert'
          AND attestation_text IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.assign_smart_archive_document_version()
    FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.create_title_with_history(
    p_numero_cadastral VARCHAR,
    p_nom_proprietaire VARCHAR,
    p_volume VARCHAR,
    p_folio VARCHAR,
    p_circonscription VARCHAR,
    p_superficie VARCHAR,
    p_date_enregistrement TIMESTAMP WITH TIME ZONE,
    p_scan_url TEXT,
    p_coordonnees_spatiales JSONB,
    p_hash_signature VARCHAR,
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
        coordonnees_spatiales,
        hash_signature
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
        p_scan_url,
        p_coordonnees_spatiales,
        p_hash_signature
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
    TIMESTAMP WITH TIME ZONE, TEXT, JSONB, VARCHAR, BOOLEAN
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_title_with_history(
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR,
    TIMESTAMP WITH TIME ZONE, TEXT, JSONB, VARCHAR, BOOLEAN
) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_title_with_history(
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR,
    TIMESTAMP WITH TIME ZONE, TEXT, JSONB, VARCHAR, BOOLEAN
) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_smart_archive_duplicate(
    p_numero_cadastral VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
    v_numero_cadastral VARCHAR;
    v_has_authoritative_title BOOLEAN;
BEGIN
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_profile.id IS NULL OR v_profile.role <> 'agent' THEN
        RAISE EXCEPTION 'Accès réservé aux agents assermentés.';
    END IF;

    v_numero_cadastral := BTRIM(p_numero_cadastral);
    PERFORM pg_advisory_xact_lock(hashtextextended(v_numero_cadastral, 0));

    SELECT EXISTS (
        SELECT 1
        FROM public.titres_fonciers AS title
        WHERE title.numero_cadastral = v_numero_cadastral
          AND EXISTS (
              SELECT 1
              FROM public.smart_archive_history AS history
              WHERE history.numero_cadastral = v_numero_cadastral
                AND history.action_type = 'insert'
                AND history.attestation_text IS NOT NULL
          )
    )
    INTO v_has_authoritative_title;

    IF NOT v_has_authoritative_title THEN
        RAISE EXCEPTION 'Aucun titre autoritatif existant pour ce numéro cadastral.';
    END IF;

    INSERT INTO public.smart_archive_history (
        agent_id,
        numero_cadastral,
        action_type
    )
    VALUES (
        auth.uid(),
        v_numero_cadastral,
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
