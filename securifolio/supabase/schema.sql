-- Activation de l'extension uuid-ossp pour la génération des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Authentification & Rôles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('agent', 'chef_cadastre', 'conservateur', 'notaire', 'citoyen')),
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Active le RLS sur profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS circonscription VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS matricule VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fonction VARCHAR(100);
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON profiles;
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" ON profiles FOR SELECT USING (auth.uid() = id);

-- 2. TITRES FONCIERS (La table principale)
CREATE TABLE IF NOT EXISTS titres_fonciers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_cadastral VARCHAR(255) NOT NULL UNIQUE,
    volume VARCHAR(50) NOT NULL,
    folio VARCHAR(50) NOT NULL,
    nom_proprietaire VARCHAR(255) NOT NULL,
    circonscription VARCHAR(255) NOT NULL,
    superficie VARCHAR(100),
    date_enregistrement TIMESTAMP WITH TIME ZONE,
    statut VARCHAR(100) NOT NULL CHECK (statut IN ('Valide', 'Litige', 'Falsifié', 'En attente de validation cadastrale', 'Validé techniquement')),
    scan_url TEXT,
    coordonnees_spatiales JSONB,
    hash_signature VARCHAR(255), -- Empreinte SHA-256
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Active le RLS sur titres_fonciers
ALTER TABLE titres_fonciers ENABLE ROW LEVEL SECURITY;

-- Politique : lecture complète réservée aux comptes authentifiés autorisés.
-- Le portail public doit passer par une API serveur qui ne retourne qu'un résumé filtré.
DROP POLICY IF EXISTS "Lecture publique des titres" ON titres_fonciers;
DROP POLICY IF EXISTS "Acteurs authentifiés peuvent lire les titres" ON titres_fonciers;
CREATE POLICY "Acteurs authentifiés peuvent lire les titres" ON titres_fonciers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('agent', 'chef_cadastre', 'conservateur', 'notaire')
        AND (profiles.circonscription IS NULL OR profiles.circonscription = titres_fonciers.circonscription)
    )
);

-- Politique : Seuls les agents peuvent insérer ou modifier
DROP POLICY IF EXISTS "Agents peuvent insérer" ON titres_fonciers;
CREATE POLICY "Agents peuvent insérer" ON titres_fonciers FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'agent'
        AND (profiles.circonscription IS NULL OR profiles.circonscription = titres_fonciers.circonscription)
    )
);
DROP POLICY IF EXISTS "Agents peuvent modifier" ON titres_fonciers;
CREATE POLICY "Agents peuvent modifier" ON titres_fonciers FOR UPDATE USING (
    false
);
DROP POLICY IF EXISTS "Chefs de cadastre peuvent modifier" ON titres_fonciers;
CREATE POLICY "Chefs de cadastre peuvent modifier" ON titres_fonciers FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'chef_cadastre'
        AND (profiles.circonscription IS NULL OR profiles.circonscription = titres_fonciers.circonscription)
    )
);
DROP POLICY IF EXISTS "Conservateurs peuvent modifier" ON titres_fonciers;
CREATE POLICY "Conservateurs peuvent modifier" ON titres_fonciers FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'conservateur'
        AND (profiles.circonscription IS NULL OR profiles.circonscription = titres_fonciers.circonscription)
    )
);

-- 3. HISTORIQUE SMART ARCHIVE (Audit Trail)
CREATE TABLE IF NOT EXISTS smart_archive_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(id),
    numero_cadastral VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    notes TEXT,
    document_version INTEGER NOT NULL,
    attestation_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE smart_archive_history ADD COLUMN IF NOT EXISTS document_version INTEGER;
ALTER TABLE smart_archive_history ADD COLUMN IF NOT EXISTS attestation_text TEXT;

-- Active le RLS sur l'historique
ALTER TABLE smart_archive_history ENABLE ROW LEVEL SECURITY;

-- Politique : Un agent voit son historique
DROP POLICY IF EXISTS "Agents voient leur historique" ON smart_archive_history;
CREATE POLICY "Agents voient leur historique" ON smart_archive_history FOR SELECT USING (auth.uid() = agent_id);
-- Les écritures passent exclusivement par les RPC SECURITY DEFINER.
DROP POLICY IF EXISTS "Agents peuvent insérer historique" ON smart_archive_history;
REVOKE INSERT, UPDATE, DELETE ON TABLE smart_archive_history FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE smart_archive_history FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE smart_archive_history FROM PUBLIC;
GRANT SELECT ON TABLE smart_archive_history TO authenticated;

-- Chemin compatible avec une ancienne colonne VARCHAR/TEXT.
DROP TRIGGER IF EXISTS prevent_smart_archive_history_mutation
    ON smart_archive_history;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM smart_archive_history
        WHERE document_version IS NOT NULL AND BTRIM(document_version::text) !~ '^[0-9]+$'
    ) THEN
        RAISE EXCEPTION 'smart_archive_history.document_version contient une valeur non entière';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM smart_archive_history
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

ALTER TABLE smart_archive_history
    ALTER COLUMN document_version TYPE INTEGER
    USING (
        CASE
            WHEN document_version IS NULL THEN NULL
            ELSE BTRIM(document_version::text)::INTEGER
        END
    );

UPDATE smart_archive_history AS history
SET document_version = COALESCE(
    (
        SELECT MAX(previous.document_version)
        FROM smart_archive_history AS previous
        WHERE previous.numero_cadastral = history.numero_cadastral
          AND previous.document_version IS NOT NULL
          AND previous.created_at <= history.created_at
    ),
    (
        SELECT MIN(known.document_version)
        FROM smart_archive_history AS known
        WHERE known.numero_cadastral = history.numero_cadastral
          AND known.document_version IS NOT NULL
    ),
    1
)
WHERE history.document_version IS NULL;

ALTER TABLE smart_archive_history
    ALTER COLUMN document_version SET NOT NULL;

ALTER TABLE smart_archive_history
    DROP CONSTRAINT IF EXISTS smart_archive_history_document_version_positive;
ALTER TABLE smart_archive_history
    ADD CONSTRAINT smart_archive_history_document_version_positive
    CHECK (document_version > 0);

-- 4. HISTORIQUE ANTI-FOLIO
CREATE TABLE IF NOT EXISTS anti_folio_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(id),
    numero_cadastral VARCHAR(255) NOT NULL,
    resultat VARCHAR(20) NOT NULL CHECK (
        resultat IN (
            'valid',
            'fraud',
            'pending',
            'match',
            'not_found',
            'ambiguous',
            'technical_error',
            'overlap_detected'
        )
    ),
    date_scan TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE anti_folio_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents voient leur historique anti-folio" ON anti_folio_history;
DROP POLICY IF EXISTS "Agents insèrent leur historique anti-folio" ON anti_folio_history;
CREATE POLICY "Agents voient leur historique anti-folio" ON anti_folio_history FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents insèrent leur historique anti-folio" ON anti_folio_history FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Verrou append-only explicite pour les historiques.
CREATE OR REPLACE FUNCTION prevent_history_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Les journaux d''audit sont append-only et ne peuvent pas être modifiés ou supprimés.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_smart_archive_history_mutation ON smart_archive_history;
CREATE TRIGGER prevent_smart_archive_history_mutation
    BEFORE UPDATE OR DELETE ON smart_archive_history
    FOR EACH ROW
    EXECUTE FUNCTION prevent_history_mutation();

CREATE OR REPLACE FUNCTION assign_smart_archive_document_version()
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
        FROM smart_archive_history
        WHERE numero_cadastral = NEW.numero_cadastral
          AND action_type = 'insert'
          AND attestation_text IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION assign_smart_archive_document_version() FROM PUBLIC;

DROP TRIGGER IF EXISTS assign_smart_archive_document_version
    ON smart_archive_history;
CREATE TRIGGER assign_smart_archive_document_version
    BEFORE INSERT ON smart_archive_history
    FOR EACH ROW
    EXECUTE FUNCTION assign_smart_archive_document_version();

DROP TRIGGER IF EXISTS prevent_anti_folio_history_mutation ON anti_folio_history;
CREATE TRIGGER prevent_anti_folio_history_mutation
    BEFORE UPDATE OR DELETE ON anti_folio_history
    FOR EACH ROW
    EXECUTE FUNCTION prevent_history_mutation();

-- 5. FONCTIONS TRANSACTIONNELLES MÉTIER
DROP FUNCTION IF EXISTS create_title_with_history(
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
CREATE OR REPLACE FUNCTION create_title_with_history(
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
    v_profile profiles%ROWTYPE;
    v_title_id UUID;
    v_attestation_text TEXT;
    v_document_version INTEGER;
    v_numero_cadastral VARCHAR;
BEGIN
    SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();

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

    IF v_profile.circonscription IS NOT NULL AND v_profile.circonscription <> p_circonscription THEN
        RAISE EXCEPTION 'Circonscription non autorisée pour cet agent.';
    END IF;

    v_numero_cadastral := BTRIM(p_numero_cadastral);
    v_attestation_text := format(
        'En tant qu''agent assermenté %s (%s, rôle %s, matricule %s), j''atteste sur l''honneur avoir vérifié visuellement la conformité de ces données avec le document physique original. Toute altération non signalée engagera ma responsabilité pénale.',
        COALESCE(NULLIF(BTRIM(v_profile.full_name), ''), 'Nom non renseigné'),
        COALESCE(NULLIF(BTRIM(v_profile.fonction), ''), 'Fonction non renseignée'),
        v_profile.role,
        COALESCE(NULLIF(BTRIM(v_profile.matricule), ''), 'Matricule non renseigné')
    );

    PERFORM pg_advisory_xact_lock(hashtextextended(v_numero_cadastral, 0));

    SELECT COALESCE(MAX(document_version), 0) + 1
    INTO v_document_version
    FROM smart_archive_history
    WHERE numero_cadastral = v_numero_cadastral
      AND action_type = 'insert'
      AND attestation_text IS NOT NULL;

    INSERT INTO titres_fonciers (
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

    INSERT INTO smart_archive_history (
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

ALTER FUNCTION create_title_with_history(
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
ALTER FUNCTION create_title_with_history(
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
REVOKE ALL ON FUNCTION create_title_with_history(
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
REVOKE ALL ON FUNCTION create_title_with_history(
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
GRANT EXECUTE ON FUNCTION create_title_with_history(
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

CREATE OR REPLACE FUNCTION record_smart_archive_duplicate(
    p_numero_cadastral VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_profile profiles%ROWTYPE;
    v_numero_cadastral VARCHAR;
    v_has_authoritative_title BOOLEAN;
BEGIN
    SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();

    IF v_profile.id IS NULL OR v_profile.role <> 'agent' THEN
        RAISE EXCEPTION 'Accès réservé aux agents assermentés.';
    END IF;

    v_numero_cadastral := BTRIM(p_numero_cadastral);
    PERFORM pg_advisory_xact_lock(hashtextextended(v_numero_cadastral, 0));

    SELECT EXISTS (
        SELECT 1
        FROM titres_fonciers AS title
        WHERE title.numero_cadastral = v_numero_cadastral
          AND EXISTS (
              SELECT 1
              FROM smart_archive_history AS history
              WHERE history.numero_cadastral = v_numero_cadastral
                AND history.action_type = 'insert'
                AND history.attestation_text IS NOT NULL
          )
    )
    INTO v_has_authoritative_title;

    IF NOT v_has_authoritative_title THEN
        RAISE EXCEPTION 'Aucun titre autoritatif existant pour ce numéro cadastral.';
    END IF;

    INSERT INTO smart_archive_history (
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

REVOKE ALL ON FUNCTION record_smart_archive_duplicate(VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION record_smart_archive_duplicate(VARCHAR) FROM anon;
GRANT EXECUTE ON FUNCTION record_smart_archive_duplicate(VARCHAR) TO authenticated;

CREATE OR REPLACE FUNCTION update_title_status_with_history(
    p_title_id UUID,
    p_new_status VARCHAR,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_profile profiles%ROWTYPE;
    v_title titres_fonciers%ROWTYPE;
    v_action_type VARCHAR;
BEGIN
    SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();

    IF v_profile.id IS NULL THEN
        RAISE EXCEPTION 'Non authentifié.';
    END IF;

    SELECT * INTO v_title FROM titres_fonciers WHERE id = p_title_id FOR UPDATE;

    IF v_title.id IS NULL THEN
        RAISE EXCEPTION 'Titre introuvable.';
    END IF;

    IF v_profile.circonscription IS NOT NULL AND v_profile.circonscription <> v_title.circonscription THEN
        RAISE EXCEPTION 'Circonscription non autorisée.';
    END IF;

    IF v_profile.role = 'chef_cadastre' THEN
        IF v_title.statut <> 'En attente de validation cadastrale'
           OR p_new_status NOT IN ('Validé techniquement', 'Falsifié', 'Litige') THEN
            RAISE EXCEPTION 'Transition cadastrale non autorisée.';
        END IF;
        v_action_type := CASE WHEN p_new_status = 'Validé techniquement' THEN 'approved_by_cadastre' ELSE 'rejected_by_cadastre' END;
    ELSIF v_profile.role = 'conservateur' THEN
        IF v_title.statut <> 'Validé techniquement'
           OR p_new_status NOT IN ('Valide', 'Falsifié') THEN
            RAISE EXCEPTION 'Transition conservateur non autorisée.';
        END IF;
        v_action_type := CASE WHEN p_new_status = 'Valide' THEN 'approved_by_conservateur' ELSE 'rejected_by_conservateur' END;
    ELSE
        RAISE EXCEPTION 'Rôle non autorisé pour modifier le statut.';
    END IF;

    UPDATE titres_fonciers
    SET statut = p_new_status
    WHERE id = p_title_id;

    INSERT INTO smart_archive_history (agent_id, numero_cadastral, action_type, notes)
    VALUES (auth.uid(), v_title.numero_cadastral, v_action_type, NULLIF(p_notes, ''));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER FUNCTION update_title_status_with_history(UUID, VARCHAR, TEXT)
    SECURITY DEFINER;
ALTER FUNCTION update_title_status_with_history(UUID, VARCHAR, TEXT)
    SET search_path = public;
REVOKE ALL ON FUNCTION update_title_status_with_history(UUID, VARCHAR, TEXT)
    FROM PUBLIC;
REVOKE ALL ON FUNCTION update_title_status_with_history(UUID, VARCHAR, TEXT)
    FROM anon;
GRANT EXECUTE ON FUNCTION update_title_status_with_history(UUID, VARCHAR, TEXT)
    TO authenticated;

-- Fonction pour mettre à jour automatiquement "updated_at"
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_titres_fonciers_updated_at ON titres_fonciers;
CREATE TRIGGER update_titres_fonciers_updated_at
    BEFORE UPDATE ON titres_fonciers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. DOSSIERS FONCIERS STRUCTURÉS
CREATE TABLE IF NOT EXISTS public.dossiers_fonciers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_dossier TEXT NOT NULL UNIQUE,
    circonscription TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    statut TEXT NOT NULL DEFAULT 'en_constitution'
        CHECK (statut IN ('en_constitution', 'en_validation', 'valide', 'rejete')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pieces_dossier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dossier_id UUID NOT NULL REFERENCES public.dossiers_fonciers(id),
    type_piece TEXT NOT NULL CHECK (type_piece IN (
        'demande',
        'fiche_parcellaire',
        'pv_enquete',
        'pv_mesurage_bornage',
        'croquis',
        'contrat_concession',
        'preuve_paiement',
        'minute_certificat',
        'certificat_enregistrement',
        'copie_certifiee',
        'autre'
    )),
    storage_path TEXT NOT NULL UNIQUE,
    file_sha256 TEXT NOT NULL CHECK (file_sha256 ~ '^[a-f0-9]{64}$'),
    version INTEGER NOT NULL CHECK (version > 0),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (dossier_id, type_piece, version)
);

ALTER TABLE public.titres_fonciers
    ADD COLUMN IF NOT EXISTS dossier_id UUID
        REFERENCES public.dossiers_fonciers(id),
    ADD COLUMN IF NOT EXISTS description_immeuble TEXT,
    ADD COLUMN IF NOT EXISTS situation TEXT,
    ADD COLUMN IF NOT EXISTS charges_reelles TEXT,
    ADD COLUMN IF NOT EXISTS droits_constates TEXT,
    ADD COLUMN IF NOT EXISTS date_sceau TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS signataire_conservateur TEXT;

ALTER TABLE public.titres_fonciers
    ADD COLUMN IF NOT EXISTS integrity_schema_version INTEGER;
ALTER TABLE public.titres_fonciers
    DROP CONSTRAINT IF EXISTS titres_fonciers_integrity_schema_version;
ALTER TABLE public.titres_fonciers
    ADD CONSTRAINT titres_fonciers_integrity_schema_version
    CHECK (
        integrity_schema_version IS NULL
        OR integrity_schema_version IN (1, 2)
    );

CREATE UNIQUE INDEX IF NOT EXISTS titres_fonciers_dossier_id_unique
    ON public.titres_fonciers(dossier_id)
    WHERE dossier_id IS NOT NULL;

INSERT INTO public.dossiers_fonciers (
    numero_dossier,
    circonscription,
    created_by,
    statut,
    created_at
)
SELECT
    title.numero_cadastral,
    title.circonscription,
    creation.agent_id,
    CASE
        WHEN title.statut = 'Valide' THEN 'valide'
        WHEN title.statut IN ('Falsifié', 'Litige') THEN 'rejete'
        ELSE 'en_validation'
    END,
    title.created_at
FROM public.titres_fonciers AS title
JOIN LATERAL (
    SELECT history.agent_id
    FROM public.smart_archive_history AS history
    WHERE history.numero_cadastral = title.numero_cadastral
      AND history.action_type = 'insert'
    ORDER BY history.created_at ASC
    LIMIT 1
) AS creation ON TRUE
WHERE title.dossier_id IS NULL
ON CONFLICT (numero_dossier) DO NOTHING;

UPDATE public.titres_fonciers AS title
SET dossier_id = dossier.id
FROM public.dossiers_fonciers AS dossier
WHERE title.dossier_id IS NULL
  AND dossier.numero_dossier = title.numero_cadastral;

INSERT INTO public.pieces_dossier (
    dossier_id,
    type_piece,
    storage_path,
    file_sha256,
    version,
    created_by,
    created_at
)
SELECT
    title.dossier_id,
    'certificat_enregistrement',
    title.storage_path,
    title.file_sha256,
    title.document_version,
    creation.agent_id,
    title.created_at
FROM public.titres_fonciers AS title
JOIN LATERAL (
    SELECT history.agent_id
    FROM public.smart_archive_history AS history
    WHERE history.numero_cadastral = title.numero_cadastral
      AND history.action_type = 'insert'
      AND history.document_version = title.document_version
    ORDER BY history.created_at ASC
    LIMIT 1
) AS creation ON TRUE
WHERE title.dossier_id IS NOT NULL
  AND title.storage_path IS NOT NULL
  AND title.file_sha256 IS NOT NULL
  AND title.document_version IS NOT NULL
ON CONFLICT (storage_path) DO NOTHING;

ALTER TABLE public.dossiers_fonciers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pieces_dossier ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acteurs autorisés lisent dossiers fonciers"
    ON public.dossiers_fonciers;
CREATE POLICY "Acteurs autorisés lisent dossiers fonciers"
ON public.dossiers_fonciers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('agent', 'chef_cadastre', 'conservateur', 'notaire')
          AND (
              profiles.circonscription IS NULL
              OR profiles.circonscription = dossiers_fonciers.circonscription
          )
    )
);

DROP POLICY IF EXISTS "Acteurs autorisés lisent pièces dossier"
    ON public.pieces_dossier;
CREATE POLICY "Acteurs autorisés lisent pièces dossier"
ON public.pieces_dossier
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.dossiers_fonciers
        JOIN public.profiles ON profiles.id = auth.uid()
        WHERE dossiers_fonciers.id = pieces_dossier.dossier_id
          AND profiles.role IN ('agent', 'chef_cadastre', 'conservateur', 'notaire')
          AND (
              profiles.circonscription IS NULL
              OR profiles.circonscription = dossiers_fonciers.circonscription
          )
    )
);

REVOKE INSERT, UPDATE, DELETE ON public.dossiers_fonciers
    FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.pieces_dossier
    FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.dossiers_fonciers, public.pieces_dossier
    TO authenticated;

DROP POLICY IF EXISTS "Agents delete pending scans_certificats"
    ON storage.objects;
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
            AND NOT EXISTS (
                SELECT 1
                FROM public.pieces_dossier
                WHERE pieces_dossier.storage_path = storage.objects.name
            )
        )
    )
);

DROP FUNCTION IF EXISTS public.create_title_with_history(
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR,
    TIMESTAMP WITH TIME ZONE, TEXT, VARCHAR, VARCHAR, JSONB, BOOLEAN
);

CREATE OR REPLACE FUNCTION public.create_title_with_history(
    p_numero_cadastral VARCHAR,
    p_nom_proprietaire VARCHAR,
    p_volume VARCHAR,
    p_folio VARCHAR,
    p_circonscription VARCHAR,
    p_superficie VARCHAR,
    p_date_enregistrement TIMESTAMPTZ,
    p_storage_path TEXT,
    p_file_sha256 VARCHAR,
    p_metadata_hmac VARCHAR,
    p_coordonnees_spatiales JSONB,
    p_attested BOOLEAN,
    p_description_immeuble TEXT,
    p_situation TEXT,
    p_charges_reelles TEXT,
    p_droits_constates TEXT,
    p_date_sceau TIMESTAMPTZ,
    p_signataire_conservateur TEXT
)
RETURNS UUID AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
    v_title_id UUID;
    v_dossier_id UUID;
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

    IF NULLIF(BTRIM(p_circonscription), '') IS NULL THEN
        RAISE EXCEPTION 'La circonscription est obligatoire.';
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

    INSERT INTO public.dossiers_fonciers (
        numero_dossier,
        circonscription,
        created_by,
        statut
    )
    VALUES (
        v_numero_cadastral,
        BTRIM(p_circonscription),
        auth.uid(),
        'en_validation'
    )
    RETURNING id INTO v_dossier_id;

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
        integrity_schema_version,
        coordonnees_spatiales,
        dossier_id,
        description_immeuble,
        situation,
        charges_reelles,
        droits_constates,
        date_sceau,
        signataire_conservateur
    )
    VALUES (
        v_numero_cadastral,
        p_nom_proprietaire,
        COALESCE(p_volume, ''),
        COALESCE(p_folio, ''),
        BTRIM(p_circonscription),
        COALESCE(p_superficie, ''),
        p_date_enregistrement,
        'En attente de validation cadastrale',
        NULL,
        NULL,
        p_storage_path,
        p_file_sha256,
        p_metadata_hmac,
        v_document_version,
        2,
        p_coordonnees_spatiales,
        v_dossier_id,
        NULLIF(BTRIM(p_description_immeuble), ''),
        NULLIF(BTRIM(p_situation), ''),
        NULLIF(BTRIM(p_charges_reelles), ''),
        NULLIF(BTRIM(p_droits_constates), ''),
        p_date_sceau,
        NULLIF(BTRIM(p_signataire_conservateur), '')
    )
    RETURNING id INTO v_title_id;

    INSERT INTO public.pieces_dossier (
        dossier_id,
        type_piece,
        storage_path,
        file_sha256,
        version,
        created_by
    )
    VALUES (
        v_dossier_id,
        'certificat_enregistrement',
        p_storage_path,
        p_file_sha256,
        v_document_version,
        auth.uid()
    );

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

    RETURN v_dossier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.create_title_with_history(
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR,
    TIMESTAMPTZ, TEXT, VARCHAR, VARCHAR, JSONB, BOOLEAN,
    TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_title_with_history(
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR,
    TIMESTAMPTZ, TEXT, VARCHAR, VARCHAR, JSONB, BOOLEAN,
    TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT
) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_dossier_piece(
    p_dossier_id UUID,
    p_type_piece TEXT,
    p_storage_path TEXT,
    p_file_sha256 TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
    v_dossier public.dossiers_fonciers%ROWTYPE;
    v_version INTEGER;
BEGIN
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = auth.uid();

    SELECT * INTO v_dossier
    FROM public.dossiers_fonciers
    WHERE id = p_dossier_id;

    IF v_profile.id IS NULL OR v_profile.role <> 'agent' THEN
        RAISE EXCEPTION 'Accès réservé aux agents.';
    END IF;

    IF v_dossier.id IS NULL THEN
        RAISE EXCEPTION 'Dossier introuvable.';
    END IF;

    IF v_profile.circonscription IS NOT NULL
       AND v_profile.circonscription <> v_dossier.circonscription THEN
        RAISE EXCEPTION 'Circonscription non autorisée.';
    END IF;

    IF p_type_piece NOT IN (
        'demande', 'fiche_parcellaire', 'pv_enquete',
        'pv_mesurage_bornage', 'croquis', 'contrat_concession',
        'preuve_paiement', 'minute_certificat',
        'certificat_enregistrement', 'copie_certifiee', 'autre'
    ) THEN
        RAISE EXCEPTION 'Type de pièce non autorisé.';
    END IF;

    IF p_storage_path NOT LIKE ('documents/' || auth.uid()::TEXT || '/%')
       OR position('..' IN p_storage_path) > 0 THEN
        RAISE EXCEPTION 'Chemin de stockage privé invalide.';
    END IF;

    IF p_file_sha256 !~ '^[a-f0-9]{64}$' THEN
        RAISE EXCEPTION 'Empreinte de fichier invalide.';
    END IF;

    PERFORM pg_advisory_xact_lock(
        hashtextextended(p_dossier_id::TEXT || ':' || p_type_piece, 0)
    );

    SELECT COALESCE(MAX(version), 0) + 1
    INTO v_version
    FROM public.pieces_dossier
    WHERE dossier_id = p_dossier_id
      AND type_piece = p_type_piece;

    INSERT INTO public.pieces_dossier (
        dossier_id,
        type_piece,
        storage_path,
        file_sha256,
        version,
        created_by
    )
    VALUES (
        p_dossier_id,
        p_type_piece,
        p_storage_path,
        p_file_sha256,
        v_version,
        auth.uid()
    );

    RETURN v_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.add_dossier_piece(UUID, TEXT, TEXT, TEXT)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_dossier_piece(UUID, TEXT, TEXT, TEXT)
    TO authenticated;

CREATE OR REPLACE FUNCTION public.get_dossier_document_checklist(
    p_dossier_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
    v_dossier public.dossiers_fonciers%ROWTYPE;
    v_present TEXT[];
    v_cadastre_missing TEXT[];
    v_conservateur_missing TEXT[];
    v_versions JSONB;
BEGIN
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = auth.uid();

    SELECT * INTO v_dossier
    FROM public.dossiers_fonciers
    WHERE id = p_dossier_id;

    IF v_profile.id IS NULL
       OR v_profile.role NOT IN ('agent', 'chef_cadastre', 'conservateur', 'notaire')
       OR v_dossier.id IS NULL THEN
        RAISE EXCEPTION 'Consultation du dossier non autorisée.';
    END IF;

    IF v_profile.circonscription IS NOT NULL
       AND v_profile.circonscription <> v_dossier.circonscription THEN
        RAISE EXCEPTION 'Circonscription non autorisée.';
    END IF;

    SELECT COALESCE(array_agg(DISTINCT type_piece), ARRAY[]::TEXT[])
    INTO v_present
    FROM public.pieces_dossier
    WHERE dossier_id = p_dossier_id;

    SELECT COALESCE(jsonb_object_agg(type_piece, max_version), '{}'::JSONB)
    INTO v_versions
    FROM (
        SELECT type_piece, MAX(version) AS max_version
        FROM public.pieces_dossier
        WHERE dossier_id = p_dossier_id
        GROUP BY type_piece
    ) AS latest_versions;

    SELECT COALESCE(array_agg(required), ARRAY[]::TEXT[])
    INTO v_cadastre_missing
    FROM unnest(ARRAY['pv_mesurage_bornage', 'croquis']) AS required
    WHERE NOT (required = ANY(v_present));

    SELECT COALESCE(array_agg(required), ARRAY[]::TEXT[])
    INTO v_conservateur_missing
    FROM unnest(ARRAY['minute_certificat', 'preuve_paiement']) AS required
    WHERE NOT (required = ANY(v_present));

    RETURN jsonb_build_object(
        'complete',
        cardinality(v_cadastre_missing) = 0
            AND cardinality(v_conservateur_missing) = 0,
        'missing',
        to_jsonb(v_cadastre_missing || v_conservateur_missing),
        'versions',
        v_versions,
        'cadastre',
        jsonb_build_object(
            'ready', cardinality(v_cadastre_missing) = 0,
            'missing', to_jsonb(v_cadastre_missing)
        ),
        'conservateur',
        jsonb_build_object(
            'ready', cardinality(v_conservateur_missing) = 0,
            'missing', to_jsonb(v_conservateur_missing)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_dossier_document_checklist(UUID)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dossier_document_checklist(UUID)
    TO authenticated;

CREATE OR REPLACE FUNCTION public.update_title_status_with_history(
    p_title_id UUID,
    p_new_status VARCHAR,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
    v_title public.titres_fonciers%ROWTYPE;
    v_action_type VARCHAR;
BEGIN
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_profile.id IS NULL THEN
        RAISE EXCEPTION 'Non authentifié.';
    END IF;

    SELECT * INTO v_title
    FROM public.titres_fonciers
    WHERE id = p_title_id
    FOR UPDATE;

    IF v_title.id IS NULL THEN
        RAISE EXCEPTION 'Titre introuvable.';
    END IF;

    IF v_profile.circonscription IS NOT NULL
       AND v_profile.circonscription <> v_title.circonscription THEN
        RAISE EXCEPTION 'Circonscription non autorisée.';
    END IF;

    IF v_profile.role = 'chef_cadastre' THEN
        IF v_title.statut <> 'En attente de validation cadastrale'
           OR p_new_status NOT IN ('Validé techniquement', 'Falsifié', 'Litige') THEN
            RAISE EXCEPTION 'Transition cadastrale non autorisée.';
        END IF;

        IF p_new_status = 'Validé techniquement'
           AND (
               v_title.dossier_id IS NULL
               OR NOT EXISTS (
                   SELECT 1 FROM public.pieces_dossier
                   WHERE dossier_id = v_title.dossier_id
                     AND type_piece = 'pv_mesurage_bornage'
               )
               OR NOT EXISTS (
                   SELECT 1 FROM public.pieces_dossier
                   WHERE dossier_id = v_title.dossier_id
                     AND type_piece = 'croquis'
               )
           ) THEN
            RAISE EXCEPTION 'Validation cadastrale impossible : PV de mesurage/bornage ou croquis manquant.';
        END IF;

        v_action_type := CASE
            WHEN p_new_status = 'Validé techniquement'
                THEN 'approved_by_cadastre'
            ELSE 'rejected_by_cadastre'
        END;
    ELSIF v_profile.role = 'conservateur' THEN
        IF v_title.statut <> 'Validé techniquement'
           OR p_new_status NOT IN ('Valide', 'Falsifié') THEN
            RAISE EXCEPTION 'Transition conservateur non autorisée.';
        END IF;

        IF p_new_status = 'Valide'
           AND (
               v_title.dossier_id IS NULL
               OR NOT EXISTS (
                   SELECT 1 FROM public.pieces_dossier
                   WHERE dossier_id = v_title.dossier_id
                     AND type_piece = 'minute_certificat'
               )
               OR NOT EXISTS (
                   SELECT 1 FROM public.pieces_dossier
                   WHERE dossier_id = v_title.dossier_id
                     AND type_piece = 'preuve_paiement'
               )
               OR NULLIF(BTRIM(p_notes), '') IS NULL
           ) THEN
            RAISE EXCEPTION 'Validation du Conservateur impossible : minute, preuve de paiement ou justification de contrôle manquante.';
        END IF;

        v_action_type := CASE
            WHEN p_new_status = 'Valide'
                THEN 'approved_by_conservateur'
            ELSE 'rejected_by_conservateur'
        END;
    ELSE
        RAISE EXCEPTION 'Rôle non autorisé pour modifier le statut.';
    END IF;

    UPDATE public.titres_fonciers
    SET statut = p_new_status
    WHERE id = p_title_id;

    UPDATE public.dossiers_fonciers
    SET statut = CASE
        WHEN p_new_status = 'Valide' THEN 'valide'
        WHEN p_new_status IN ('Falsifié', 'Litige') THEN 'rejete'
        ELSE 'en_validation'
    END
    WHERE id = v_title.dossier_id;

    INSERT INTO public.smart_archive_history (
        agent_id,
        numero_cadastral,
        action_type,
        notes,
        document_version
    )
    VALUES (
        auth.uid(),
        v_title.numero_cadastral,
        v_action_type,
        NULLIF(BTRIM(p_notes), ''),
        v_title.document_version
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.update_title_status_with_history(UUID, VARCHAR, TEXT)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_title_status_with_history(UUID, VARCHAR, TEXT)
    TO authenticated;

CREATE OR REPLACE FUNCTION public.record_smart_archive_duplicate(
    p_numero_cadastral VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
    v_numero_cadastral VARCHAR;
    v_title public.titres_fonciers%ROWTYPE;
    v_attestation_text TEXT;
BEGIN
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_profile.id IS NULL OR v_profile.role <> 'agent' THEN
        RAISE EXCEPTION 'Accès réservé aux agents assermentés.';
    END IF;

    v_numero_cadastral := BTRIM(p_numero_cadastral);
    PERFORM pg_advisory_xact_lock(hashtextextended(v_numero_cadastral, 0));

    SELECT * INTO v_title
    FROM public.titres_fonciers
    WHERE numero_cadastral = v_numero_cadastral;

    SELECT attestation_text INTO v_attestation_text
    FROM public.smart_archive_history
    WHERE numero_cadastral = v_numero_cadastral
      AND action_type = 'insert'
      AND document_version = v_title.document_version
      AND attestation_text IS NOT NULL
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_title.id IS NULL OR v_attestation_text IS NULL THEN
        RAISE EXCEPTION 'Aucun titre autoritatif existant pour ce numéro cadastral.';
    END IF;

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
        'rejected_duplicate',
        v_title.document_version,
        v_attestation_text
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.record_smart_archive_duplicate(VARCHAR)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_smart_archive_duplicate(VARCHAR)
    TO authenticated;
