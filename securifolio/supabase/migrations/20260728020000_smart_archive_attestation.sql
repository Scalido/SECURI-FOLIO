ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS matricule VARCHAR(100);

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS fonction VARCHAR(100);

ALTER TABLE public.smart_archive_history
    ADD COLUMN IF NOT EXISTS document_version VARCHAR(50);

ALTER TABLE public.smart_archive_history
    ADD COLUMN IF NOT EXISTS attestation_text TEXT;

DROP FUNCTION IF EXISTS public.create_title_with_history(
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    VARCHAR,
    TIMESTAMP WITH TIME ZONE,
    TEXT,
    JSONB,
    VARCHAR
);

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
BEGIN
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_profile.id IS NULL OR v_profile.role <> 'agent' THEN
        RAISE EXCEPTION 'Accès réservé aux agents assermentés.';
    END IF;

    IF p_attested IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION 'Attestation obligatoire avant transmission.';
    END IF;

    IF v_profile.circonscription IS NOT NULL
       AND v_profile.circonscription <> p_circonscription THEN
        RAISE EXCEPTION 'Circonscription non autorisée pour cet agent.';
    END IF;

    v_attestation_text := format(
        'En tant qu''agent assermenté %s (%s, rôle %s, matricule %s), j''atteste sur l''honneur avoir vérifié visuellement la conformité de ces données avec le document physique original. Toute altération non signalée engagera ma responsabilité pénale.',
        COALESCE(NULLIF(BTRIM(v_profile.full_name), ''), 'Nom non renseigné'),
        COALESCE(NULLIF(BTRIM(v_profile.fonction), ''), 'Fonction non renseignée'),
        v_profile.role,
        COALESCE(NULLIF(BTRIM(v_profile.matricule), ''), 'Matricule non renseigné')
    );

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
        p_numero_cadastral,
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
        p_numero_cadastral,
        'insert',
        '1',
        v_attestation_text
    );

    RETURN v_title_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
